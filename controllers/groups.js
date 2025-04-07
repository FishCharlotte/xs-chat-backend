const { BadRequestError } = require('../utils/error');
const Groups = require('../services/groups');
const { models } = require("../models");

const controller = {}

// TODO: 转让群聊群主
// TODO: 审批后才能加群

/**
 * @description 创建群聊
 * @param ctx
 * @return {Promise<void>}
 */
controller.create = async (ctx) => {
    const { userId } = ctx.session;
    const { roomName, membersID } = ctx.request.body;
    // TODO：考虑当前用户是否有权限拉这些username的members进群
    if (membersID.length < 2) {
        throw new BadRequestError('参数不合法：合法群聊人数小于2');
    }
    const groupId = await Groups.create(userId, roomName, membersID);
    ctx.body = {
        status: 200,
        message: 'ok',
        data: {
            groupId: groupId
        }
    }
}

/**
 * @description 检查当前用户是否是群组管理员
 * @param ctx
 * @return {Promise<void>}
 */
controller.checkAdminStatus = async (ctx) => {
    const { userId } = ctx.session;
    const groupId = parseInt(ctx.params.id);

    // 检查参数是否有效
    if (!userId) {
        throw new BadRequestError('用户未登录，请重新登录');
    }
    if (isNaN(groupId)) {
        throw new BadRequestError('群组ID无效');
    }

    try {
        // 检查是否是管理员
        const isAdmin = await Groups.isAdmin(userId, groupId);

        // 返回用户是否为管理员的信息
        ctx.body = {
            status: 200,
            message: 'ok',
            data: {
                isAdmin
            }
        };
    } catch (error) {
        console.error('检查管理员状态失败:', error.message);
        throw new BadRequestError('无法获取管理员状态，请稍后重试');
    }
};

/**
 * @description 群主设置群识别号
 * @param ctx
 * @return {Promise<void>}
 */
controller.setHandle = async (ctx) => {
    const { userId } = ctx.session;

    const groupId = parseInt(ctx.params.id);
    const { handle } = ctx.request.body;
    await Groups.setHandle(userId, groupId, handle);
    ctx.body = {
        status: 200,
        message: 'ok'
    }
}


/**
 * @description 群主或管理员设置群名
 * @param ctx
 * @return {Promise<void>}
 */
controller.setName = async (ctx) => {
    const { userId } = ctx.session;

    const groupId = parseInt(ctx.params.id);
    const { name } = ctx.request.body;


    await Groups.setName(userId, groupId, name);
    ctx.body = {
        status: 200,
        message: 'ok'
    }
}


/**
 * @description 群主设置群聊管理员
 * @param ctx
 * @return {Promise<{message: string, status: number}>}
 */
controller.setAdmin = async (ctx) => {
    const { userId } = ctx.session;

    const groupId = parseInt(ctx.params.id);
    const { memberId } = ctx.request.body;

    await Groups.setAdmin(userId, memberId, groupId);
    return ctx.body = {
        status: 200,
        message: 'ok'
    }
}


/**
 * @description 加入群聊
 * @param ctx
 * @return {Promise<void>}
 */
controller.join = async (ctx) => {
    const { userId } = ctx.session;

    const groupId = parseInt(ctx.params.id);

    if (!groupId) {
        throw new BadRequestError('请输入要加入的聊天室的ID')
    }
    await Groups.join(userId, groupId);

    ctx.body = {
        status: 200,
        message: 'ok'
    }
}


/**
 * @description 添加用户的好友到指定群聊中
 * @param ctx
 * @return {Promise<void>}
 */
controller.add = async (ctx) => {
    const { userId } = ctx.session;

    const groupId = parseInt(ctx.params.id);
    const { members } = ctx.request.body;
    let memberId;
    // TODO: 这里并没有考虑到多人的情况哈，只能一个个拉
    if (members.length === 1) {
        memberId = members[0];
    } else if (members.length > 1) {
        throw new BadRequestError('一次只能新添加一个用户到群聊')
    } else {
        throw new BadRequestError('请选择要添加的用户ID')
    }

    await Groups.add(userId, memberId, groupId);
    ctx.body = {
        status: 200,
        message: 'ok'
    }
}


/**
 * @description 离开群聊
 * @param ctx
 * @return {Promise<void>}
 */
controller.leave = async (ctx) => {
    const { userId } = ctx.session;

    const groupId = parseInt(ctx.params.id);

    if (!groupId) {
        throw new BadRequestError('请输入要退出的群聊号')
    }
    await Groups.leave(userId, groupId);

    ctx.body = {
        status: 200,
        message: 'ok'
    }
}


/**
 * @description 删除群聊
 * @param ctx
 * @return {Promise<void>}
 */
controller.destroy = async (ctx) => {
    const { userId } = ctx.session;
    const groupId = parseInt(ctx.params.id);

    if (!groupId) {
        throw new BadRequestError('请输入要退出的群聊号')
    }

    await Groups.destroy(userId, groupId);

    ctx.body = {
        status: 200,
        message: 'ok'
    }
}


/**
 * @description 获取当前用户的聊天室列表
 * @param ctx
 * @return {Promise<void>}
 */
controller.getGroupList = async (ctx) => {
    const { userId } = ctx.session;

    const list = await Groups.getGroupList(userId);
    ctx.body = {
        status: 200,
        message: 'ok',
        data: {
            list: list
        }
    }
}


/**
 * @description 通过输入的keyword搜索群聊
 * @param ctx
 * @return {Promise<void>}
 */
controller.searchGroup = async (ctx) => {
    const { keyword } = ctx.request.body;

    const list = await Groups.searchGroup(keyword);

    ctx.body = {
        status: 200,
        message: 'ok',
        data: {
            list: list
        }
    }
}


/**
 * @description 获取特定群聊的成员信息
 * @param ctx
 * @return {Promise<void>}
 */
controller.getMemberList = async (ctx) => {
    const { userId } = ctx.session;

    const groupId = parseInt(ctx.params.id);

    if (!groupId) throw new BadRequestError('请输入要统计的群号');

    const list = await Groups.getMembersList(userId, groupId);

    ctx.body = {
        status: 200,
        message: 'ok',
        data: {
            list: list
        }
    }
}


/**
 * @description 移除群聊成员
 * @param ctx
 * @return {Promise<void>}
 */
controller.removeMember = async (ctx) => {
    const { userId } = ctx.session;

    const groupId = parseInt(ctx.params.id);
    const memberId = parseInt(ctx.request.body.memberId);
    
    await Groups.removeMember(userId, memberId, groupId)

    ctx.body = {
        status: 200,
        message: '移除成功',
    }
}

controller.getGroupInfo = async (ctx) => {
    const { userId } = ctx.session;
    const groupId = parseInt(ctx.params.id);

    const groupInfo = await Groups.getGroupInfo(userId, groupId);

    ctx.body = {
        status: 200,
        message: 'ok',
        data: {
            groupInfo: groupInfo
        }
    }
}

module.exports = controller;
