const amqp = require('amqplib');
const { BadRequestError, InternalServerError } = require('../utils/error')
const config = require("../config");

const MessageType = {
    text: Symbol('text'), // 文本消息
    image: Symbol('image'), // 图片消息
    voice: Symbol('voice'), // 音频消息
    video: Symbol('video'), // 视频消息
    file: Symbol('file'), // 文件消息
    emotion: Symbol('emotion'), // 表情消息
    userCard: Symbol('userCard'), // 名片消息
    revoke: Symbol('revoke'), // 撤回消息
    notice: Symbol('notice'), // 通知消息
};

/**
 * @description 检查对象中是否存在指定的属性
 * @param props 待检查的对象
 * @param fields 属性名的数组
 * @return {boolean}
 */
const checkFieldsExist = (props, fields) => {
    return fields.every(item => props[item] !== undefined);
}

/**
 * @description 获取MQ的Channel实例
 * @type {(function(): Promise<*|ChatChannel>)|*}
 */
const getChannel = (() => {
    let ch = null; // 使用闭包变量来存储 ch

    return async () => {
        if (ch) {
            return ch;
        }
        const mq = new ChatMq(config.mq);
        await mq.connect();
        ch = await mq.startChannel();
        return ch;
    };
})();


/**
 * @description 消息类
 */
class Message {
    constructor(props) {
        if (props.type !== MessageType.notice && !props.id) {
            throw new BadRequestError('Message must have id');
        }

        let fields = [];
        switch (props.type) {
            case MessageType.text:
                fields = ['sender', 'recipientType', 'recipient', 'value'];
                break;
            case MessageType.notice:
                fields = ['recipient', 'key', 'value'];
                break;
            default:
                throw new BadRequestError('Unknown message type');
        }

        if (!checkFieldsExist(props, fields)) {
            throw new BadRequestError('Required fields do not exist!');
        }

        this.props = props;
        this.time = Date.now();
    }

    toString() {
        switch (this.props.type) {
            // 文本消息
            case MessageType.text:
                return JSON.stringify({
                    id: this.props.id, // 消息ID
                    type: 'text', // 消息类型
                    sender: this.props.sender, // 消息发送人的UserId
                    recipientType: this.props.recipientType, // 接收人的类型
                    recipient: this.props.recipient, // 接收人的ID
                    text: { // 文本消息的value (仿微信)
                        content: this.props.value, // 文本消息的内容
                    },
                    time: this.time, // 消息产生的时间戳
                });
            // 通知消息
            case MessageType.notice:
                return JSON.stringify({
                    id: this.props.id, // 消息ID
                    type: 'notice', // 消息类型
                    key: this.props.key, // 通知的键
                    value: this.props.value, // 通知附带的内容（自定义）
                    time: this.time, // 消息产生的时间戳
                });
            default:
                throw new BadRequestError('Unknown message type');
        }
    }

    toBuffer() {
        return Buffer.from(this.toString());
    }
}

class ChatChannel {
    constructor(conn) {
        return (async () => {
            this.ch = await conn.createChannel();
            return this;
        })();
    }

    /**
     * 断开聊天消息队列和服务器的连接
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (this.ch) {
            await this.ch.close();
        }
    }

    /**
     * @description 生成User的队列名称
     * @param userId {String} 用户ID
     * @returns {String}
     * @private
     */
    _genUserQueueName(userId) {
        return `user-${userId}`;
    }

    /**
     * @description 生成Group的Exchange名称
     * @param groupId {String} 群组ID
     * @returns {String}
     * @private
     */
    _genGroupExchangeName(groupId) {
        return `group-${groupId}`;
    }

    /**
     * @description 定义用户消息队列
     * @param userId {String}
     * @returns {Promise<void>}
     * @private
     */
    async _assertUserQueue(userId) {
        await this.ch.assertQueue(this._genUserQueueName(userId), {
            durable: true,
            arguments: {
                messageTtl: 7 * 24 * 60 * 60 * 1000 // 7d 有效
            }
        })
    }

    async _assertGroupQueue(groupId) {
        await  this.ch.assertExchange(this._genGroupExchangeName(groupId), 'fanout', {
            durable: true,
        })
    }

    async joinGroup(userId, groupId) {
        await this._assertUserQueue(userId);
        await this._assertGroupQueue(groupId);

        await this.ch.bindQueue(
            this._genUserQueueName(userId),
            this._genGroupExchangeName(groupId),
            '');
    }

    async leaveGroup(userId, groupId) {
        await this._assertUserQueue(userId);
        await this._assertGroupQueue(groupId);

        await this.ch.unbindExchange(
            this._genUserQueueName(userId),
            this._genGroupExchangeName(groupId),
            ''
        );
    }

    async dismissGroup(groupId) {
        try {
            await this.ch.deleteExchange(this._genGroupExchangeName(groupId))
        } catch (e) {
            console.log(e)
        }
    }

    /**
     * 发送一条私聊或群聊消息
     * @param msg 待发送的消息对象
     * @return {Promise<void>}
     */
    async sendMessage(msg) {
        // 检查消息是否已初始化
        if (!msg.props) {
            throw new BadRequestError('sendMessage(): Message must be init!')
        }

        // 禁止通知消息当作聊天消息发送
        if (msg.props.type === MessageType.notice) {
            throw new BadRequestError('sendMessage(): This message CAN NOT send by this function!')
        }

        await this._assertUserQueue(msg.props.sender);

        switch (msg.props.recipientType) {
            case 1: { // 私聊
                await this._assertUserQueue(msg.props.recipient);
                await this.ch.sendToQueue(this._genUserQueueName(msg.props.sender), msg.toBuffer());
                await this.ch.sendToQueue(this._genUserQueueName(msg.props.recipient), msg.toBuffer());
                console.log("mq:sendMessage发送消息，sender：", msg.props.sender, "recipient:", msg.props.recipient);
                break;
            }
            case 2: { // 群聊
                await this._assertGroupQueue(msg.props.recipient);
                await this.ch.publish(this._genGroupExchangeName(msg.props.recipient), '', msg.toBuffer());
                break;
            }
            default:
                throw new BadRequestError('非法消息类型');
        }
    }

    /**
     * @description 发送一条通知消息到指定的用户
     * @param msg 消息对象
     * @return {Promise<void>}
     */
    async sendNotice(msg) {
        // 检查是否为通知消息
        if (!msg.props || msg.props.type !== MessageType.notice) {
            throw new BadRequestError('sendNotice(): Only accept notice message!')
        }

        await this._assertUserQueue(msg.props.recipient);
        await this.ch.sendToQueue(this._genUserQueueName(msg.props.recipient), msg.toBuffer());
    }

    /**
     * 消费指定用户的消息队列
     * @param userId 用户ID
     * @param callback 消费的回调函数
     * @return {Promise<void>}
     */
    async consume(userId, callback) {
        await this._assertUserQueue(userId);

        this.ch.consume(this._genUserQueueName(userId), callback);
    }

    /**
     * @description 确认消息已接收
     * @param msg 待确认接收的消息对象
     * @return {Promise<*>}
     */
    async ackMessage(msg) {
        return await this.ch.ack(msg)
    }
}

class ChatMq {
    constructor(options) {
        this.options = options || {};
    }

    async connect() {
        this.conn = await amqp.connect(this.options.url);
    }

    async startChannel() {
        if (!this.conn) {
            throw new InternalServerError('No connection to start channel');
        }
        return new ChatChannel(this.conn);
    }

    /**
     * @description 程序退出
     * @return {Promise<void>}
     */
    async disconnect () {
        if (this.conn) {
            await this.conn.close();
        }
    }
}

module.exports = {
    Message,
    ChatChannel,
    ChatMq,
    MessageType,
    getChannel,
};
