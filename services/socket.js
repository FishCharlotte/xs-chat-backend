const { Server } = require("socket.io");
const { ChatMq, Message, MessageType } = require('./mq');
const { SocketIOKoaSession } = require('../middlewares/session');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');


const sockets = new Map();

// TODO: 是否需要判断没有登录的情况
const initSocket = async (httpServer, app, store) => {
    const io = new Server(httpServer, {
        // TODO: 跨域问题
        cors: {
            origin: "*",
        }
    });

    // add Socket.io middleware to parse Koa-session cookie
    io.use(SocketIOKoaSession(app, config.session, store));

    const mq = new ChatMq(config.mq);
    await mq.connect();

    io.on('connect', async (socket) => {
        const { isFriend } = require('./friends');
        const { isInGroup } = require('./groups');

        const ch = await mq.startChannel();
        const userId = socket.session.userId;

        console.log('当前userID：', userId)

        if (!userId) {
            socket.emit('error', {
                type: 'user.no_login',
            });
            return setTimeout(() => socket.disconnect(true), 500);
        }

        // 检测是否已经存在socket连接
        if (sockets.has(userId)) {
            const prevSocket = sockets.get(userId);

            // 通知前一个socket连接，新的登录已经发生
            prevSocket.emit('error', {
                type: 'user.new_login',
                time: Date.now(),
            });

            // 重置前一个socket连接的session
            prevSocket.session.userId = null;
            prevSocket.session.save()

            // 关闭前一个socket连接
            prevSocket.disconnect(true);
            sockets.delete(userId);
        }

        sockets.set(userId, socket);

        /**
         * @description 接收消息
         */
        {
            const messages = new Map();
            await ch.consume(userId, async (msg) => {
                const message = JSON.parse(msg.content.toString())

                if (message) {
                    if (message.type !== 'notice') {
                        // 处理文本、图片等聊天消息
                        console.log('message.consume', message, message.id, 'userId', userId);

                        messages.set(message.id, msg);

                        socket.emit('message', {
                            data: message
                        })
                    } else {
                        // 处理通知消息
                        socket.emit('notice', {
                            type: message.key,
                            data: message.value,
                        });

                        // 通知消息不需要客户端ack
                        await ch.ackMessage(msg);
                    }
                } else {
                    await ch.ackMessage(msg);
                    console.log('Empty id! Received message:', message);
                }
            })

            /**
             * 消息已读
             * @param id 消息id
             */
            socket.on('message.read', async (id, _req) => {
                const action = 'message.read';

                const resp = {
                    msg: 'ok',
                    _req,
                }
                if (!messages.has(id)) {
                    console.log('message.read', id)
                    resp.msg = '无效消息ID';
                } else {
                    try {
                        const msg = messages.get(id);
                        console.log('消息读取，消息ID=', id, 'userId', userId);
                        if (msg) {
                            // const message = JSON.parse(msg.content.toString())
                            resp.msg = JSON.parse(msg.content.toString()).text.content;
                            await ch.ackMessage(msg);
                        }
                        messages.delete(id);
                    } catch (e) {
                        resp.msg = e.message;
                    }
                }
                socket.emit(action, resp);
            })
        }

        /**
         * 发送消息
         * @param type {Number} 发送目标类型。1：私聊；2：群聊
         * @param target {Number} 发送目标。userId或groupId
         * @param content {String} 发送的文字内容。
         */
        socket.on('send.message.text', async (type, target, content, callback) => {

            const recipientType = parseInt(type)
            const recipient =  parseInt(target)

            switch (recipientType) {
                case 1:
                    if (!await isFriend(userId, recipient)) {
                        socket.emit('authorized.error', {
                            type: 'user.not_authorized',
                            message: '用户不是好友',
                        });
                        return;
                    }
                    break;
                case 2:
                    if (!await isInGroup(userId, recipient)) {
                        socket.emit('authorized.error', {
                            type: 'user.not_authorized',
                            message: '用户不在群聊中',
                        });
                        return;
                    }
                    break;
                default:
                    socket.emit('authorized.error', {
                        type: 'user.not_authorized',
                        message: '非法的发送目标类型',
                    });
                    return;
            }

            const msgId = uuidv4();
            const resp = {
                msg: 'ok',
            };
            try {
                const msg = new Message({
                    id: msgId,
                    type: MessageType.text,
                    value: content,
                    sender: userId,
                    recipientType: recipientType,
                    recipient: recipient
                });

                await ch.sendMessage(msg);
                resp.id = msgId;
            } catch (e) {
                // TODO: 处理MQ错误的情况
                console.error('[send.message.text] failed to send message text: target = ', target, 'type = ', type, 'content = ', content, 'error = ', e);
                resp.msg = e.message;
            }
            callback(resp);
        })

        /**
         * 断开连接
         */
        socket.on('disconnect', async () => {
            // 关闭MQ的channel连接，防止继续消费
            if (ch) {
                await ch.disconnect();
            }

            // 移除socket
            sockets.delete(userId);

            console.log('user disconnected:', userId);
        })
    })
}

module.exports = {
    initSocket,
    sockets,
};