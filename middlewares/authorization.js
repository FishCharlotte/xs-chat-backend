const { UnauthorizedError } = require('../utils/error');
const { isAdmin, isOwner, isInGroup } = require('../services/groups');
const { isFriend } = require('../services/friends');

/**
 * @description 确保用户已经登录
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
const ensureAuthenticated = async (ctx, next) => {
    const { userId, username } = ctx.session;
    if ( !userId || !username) {
        throw new UnauthorizedError('请先登录');
    }
    await next();
}


/**
 * @description 确保用户是群组的管理员
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
const ensureGroupAdmin = async (ctx, next) => {
    const { userId } = ctx.session;
    if (!await isAdmin(userId, ctx.params.id)) {
        throw new UnauthorizedError('你不是群管理员');
    }
    await next();
}

/**
 * @description 确保用户是群组的群主
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
const ensureGroupOwner = async (ctx, next) => {
    const { userId } = ctx.session;
    if (!await isOwner(userId, ctx.params.id)) {
        throw new UnauthorizedError('你不是群管理员');
    }
    await next();
}

/**
 * @description 确保用户是群组的成员
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
const ensureGroupMember = async (ctx, next) => {
    const { userId } = ctx.session;
    if (!await isInGroup(userId, ctx.params.id)) {
        throw new UnauthorizedError('你不是群成员');
    }
    await next();
}

module.exports = {
    ensureAuthenticated,
    ensureGroupAdmin,
    ensureGroupOwner,
    ensureGroupMember,
}
