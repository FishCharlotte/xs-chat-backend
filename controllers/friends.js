const Friends = require('../services/friends');
const { BadRequestError } = require("../utils/error");

const controller = {}


/**
 * @description 获取好友列表
 * @param ctx
 * @return {Promise<void>}
 */
controller.friendList = async (ctx) => {
    const { userId } = ctx.session;
    const list = await Friends.getList(userId);
    ctx.body = {
        status: 200,
        message: 'ok',
        data: {
            list
        }
    }
}


// TODO: 好友申请的过期时间

/**
 * @description 添加好友
 * @param ctx
 * @return {Promise<void>}
 */
controller.add = async (ctx) => {
    const { userId } = ctx.session;

    const { invitationContent } = ctx.request.body;
    const friendId = parseInt(ctx.params.id);

    if (!friendId) {
        throw new BadRequestError('请输入好友ID')
    }

    // 操作添加好友
    await Friends.add(userId, friendId, invitationContent);

    ctx.body = {
        status: 200,
        message: 'ok'
    }
}


/**
 * @description 删除好友
 * @param ctx
 * @return {Promise<void>}
 */
controller.remove = async (ctx) => {
    const { userId } = ctx.session;
    const id = parseInt(ctx.params.id);

    // 操作删除好友
    await Friends.remove(userId, id);

    ctx.body = {
        status: 200,
        message: 'ok'
    }
}


/**
 * @description 加载好友申请列表
 * @param ctx
 * @return {Promise<void>}
 */
controller.listInvitation = async (ctx) => {
    const { userId } = ctx.session;
    const list = await Friends.listInvitation(userId);
    ctx.body = {
        status: 200,
        message: 'ok',
        data: {
            list
        },
    }
}

// TODO:新增好友申请过期的话，那就需要判断过期状态，会多一个：outDate的状态
/**
 * @description 对好友申请做出反应
 * @param ctx
 * @return {Promise<void>}
 */
controller.respInvitation = async (ctx) => {
    const { userId } = ctx.session;

    const invitationId = parseInt(ctx.params.id);
    const { status } = ctx.request.body;

    if (!invitationId) {
        throw new BadRequestError('请选择有效的好友申请信息')
    }

    await Friends.respInvitation(userId, invitationId, status);

    ctx.body = {
        status: 200,
        message: 'ok'
    }
}

module.exports = controller;
