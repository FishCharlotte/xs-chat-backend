const { Message, MessageType } = require("./mq");
const { sockets } = require("./socket"); // FIXME
const { getChannel } = require("./mq");

/**
 * @description 发送通知消息
 * @param to 接收者的用户ID
 * @param type 通知的类型
 * @param data 通知的数据
 * @return {Promise<void>}
 */
const sendNotice = async (to, type, data) => {
    const ch = await getChannel();

    if (!sockets.has(to)) {
        // 不在线的时候往MQ里面发通知消息
        if (!ch) {
            return console.error('[sendNotice] should input ch: to = ', to, 'type = ', type, 'data = ', data);
        }
        try {
            const msg = new Message({
                recipient: to,
                type: MessageType.notice,
                key: type,
                value: data,
            });

            await ch.sendNotice(msg);
        } catch (e) {
            // TODO: 处理MQ错误的情况
            console.error('[sendNotice] failed to sendNotice: to = ', to, 'type = ', type, 'data = ', data, e);
        }
        console.log("sendNotice::MQ 发送通知消息，to：", to, "type:", type, "data:", data);
    } else {
        // 在线的时候直接发送通知
        sockets.get(to).emit('notice', {
            type: type,
            data: data,
        })
        console.log("sendNotice::Socket 发送通知消息，to：", to, "type:", type, "data:", data);
    }
}

module.exports = {
    sendNotice,
};
