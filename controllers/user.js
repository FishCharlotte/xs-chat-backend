const { InternalServerError, UnauthorizedError, BadRequestError, NotFoundError } = require('../utils/error')
const Users = require('../services/users')
const controller = {}



/**
 * @description 注册用户
 * @param ctx
 * @return {Promise<void>}
 */
controller.register = async (ctx) => {
    const { username, nickname, password } = ctx.request.body;
    await Users.register(username, nickname, password);
    ctx.body = {
        status: 200,
        message: `创建新用户“${nickname}”成功。`,
        data: {
            username: username
        }
    };
}

/**
 * @description 登录
 * @param ctx
 * @return {Promise<void>}
 */
controller.login = async (ctx) => {
    const { username, password } = ctx.request.body;
    if (!username || !password) {
        throw new BadRequestError('请输入信息')
    }

    const userId = await Users.login(username, password);

    ctx.session.userId = userId;
    ctx.session.username = username;

    ctx.body = {
        status: 200,
        message: '登录成功'
    }
}


/**
 * @description 获取当前账户的用户信息
 * @param ctx
 * @return {Promise<{data: {nickname: *, avatar: *, username: *}, message: string, status: number}>}
 */
controller.getInfo = async (ctx) => {
    const { userId } = ctx.session;
    const { username, nickname, avatar } = await Users.getInfo(userId);
    return ctx.body = {
        status: 200,
        message: "查询成功",
        data: {
            userId: userId,
            username: username,
            nickname: nickname,
            avatar: avatar,
        }
    }
}


/**
 * @description 查询指定username的用户
 * @param ctx
 * @return {Promise<{data: {nickname: String, avatar: *, userId: *, username: String}, message: string, status: number}>}
 */
controller.search = async (ctx) => {
    const { keyword } = ctx.request.query;
    const results = await Users.search(keyword);
    return ctx.body = {
        status: 200,
        message: "查询成功",
        data: results
    }
}

controller.getInfoById = async (ctx) => {
    const { id: userId } = ctx.request.params;

    const info = await Users.getInfo(userId);
    if (!info) {
        throw new NotFoundError('用户不存在');
    }

    const { id, username, nickname, avatar } = info;
    return ctx.body = {
        status: 200,
        message: "ok",
        data: {
            userId: id,
            username: username,
            nickname: nickname,
            avatar: avatar,
        }
    }
}


/**
 * @description 更新个人信息
 * @param ctx
 * @return {Promise<{message: string, status: number}>}
 */
controller.modifyInfo = async (ctx) => {
    const { userId } = ctx.session;

    const { newUsername, newNickname } = ctx.request.body;
    await Users.modifyInfo(userId, newUsername, newNickname);
    return ctx.body = {
        status: 200,
        message: '更新成功'
    }
}


/**
 * @description 上传头像
 * @param ctx
 * @return {Promise<void>}
 */
controller.uploadAvatar = async (ctx) => {
    const { userId, username } = ctx.session;
    const avatar = ctx.request.file;
    // TODO：头像回显功能，目前还没写获取互联网地址
    const path = await Users.uploadAvatar(userId, username, avatar);
    ctx.body = {
        status: 200,
        message: "ok",
        data: {
            avatar: path
        }
    }
}


/**
 * @description 用户退出登录
 * @param ctx
 * @return {{message: string, status: number}}
 */
controller.logout = (ctx) => {
    const { userId } = ctx.session;
    if (!userId) {
        throw new UnauthorizedError('用户未登录');
    }

    try {
        delete ctx.session.userId;

        return ctx.body = {
            status: 200,
            message: '已退出'
        }
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


module.exports = controller;
