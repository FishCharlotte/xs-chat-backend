const { BadRequestError, InternalServerError, NotFoundError } = require("../utils/error");
const { models } = require("../models");
const { userIsExit } = require("./users");
const { sendNotice } = require("../services/notification");


/**
 * @description 判断用户是否拥有该好友
 * @param userId
 * @param friendId
 * @return {Promise<boolean>}
 */
const isFriend = async (userId, friendId) => {
    try {
        const res = await models.Friends.findOne({
            where: {
                userId: userId,
                friendId: friendId
            }
        })
        return !!res
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 获取好友列表
 * @param userId
 * @return {Promise<Array>}
 */
const getList = async (userId) => {
    try {
        return await models.Users.findOne({
            attributes: [],
            where: {
                id: userId,
            },
            include: [
                {
                    attributes: [['id', 'userId'], 'username', 'nickname', 'avatar'],
                    association: 'friends',
                    through: {
                        attributes: [],
                    },
                },
            ],
        });
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}

/**
 * @description 查询目标用户是否正在邀请作为好友
 * @param userId 当前用户ID
 * @param friendId 目标用户ID
 * @return {Promise<boolean>}
 */
const isInvitingNow = async (userId, friendId) => {
    try {
        const cnt = await models.FriendInvitations.count({
            where: {
                applicantId: userId,
                recipientId: friendId,
                status: 'waiting',
            }
        });
        return cnt > 0;
    } catch (e) {
        console.log(e);
        throw new InternalServerError('数据库出错')
    }
}

/**
 * @description 添加好友操作
 * @param {Number} userId
 * @param {Number} friendId
 * @param {String} invitationContent
 */
const add = async (userId, friendId, invitationContent) => {
    if (userId === friendId) {
        throw new BadRequestError('不允许添加自己为好友')
    }

    if (!await userIsExit(friendId)) {
        throw new NotFoundError('目标用户不存在')
    }

    if (await isFriend(userId, friendId)) {
        throw new BadRequestError('对方已经是您的好友')
    }

    if (await isInvitingNow(userId, friendId)) {
        throw new BadRequestError('你已发送好友申请，请等待对方回应')
    }

    try {
        await models.FriendInvitations.create({
            applicantId: userId,
            recipientId: friendId,
            requestContent: invitationContent,
            status: 'waiting',
        });


    } catch (error) {
        console.log(error);
        throw new InternalServerError('服务器出错');
    }

    // 通知对方添加好友
    try {
        await sendNotice(friendId, 'friend.add', {
            userId: userId,
        });
    } catch (e) {
        console.log(e);
        throw new InternalServerError('发送通知失败');
    }
}


/**
 * @description 查询好友申请列表
 * @param {Number} userId
 * @return {Promise<*>}
 */
const listInvitation = async (userId) => {
    try {
        return await models.Users.findOne({
            attributes: [],
            where: {
                id: userId,
            },
            include: [
                {
                    attributes: [['id', 'userId'], 'nickname', 'avatar'],
                    association: 'inviters',
                    through: {
                        as: 'invitation',
                        attributes: [['id', 'invitationId'], 'requestContent', 'status', 'updatedAt'],
                    },
                },
                {
                    attributes: [['id', 'userId'], 'nickname', 'avatar'],
                    association: 'invitees',
                    through: {
                        as: 'invitation',
                        attributes: [['id', 'invitationId'], 'requestContent', 'status', 'updatedAt'],
                    },
                },
            ],
        })
    } catch (error) {
        console.log(error);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 对好友申请做出反应
 * @param {Number} userId
 * @param {Number} invitationId
 * @param {String} status
 */
const respInvitation = async (userId, invitationId, status) => {
    const invitation = await models.FriendInvitations.findOne({
        where: {
            id: invitationId,
            recipientId: userId,
        },
    });

    if (!invitation) {
        throw new NotFoundError('没有找到该好友申请');
    }

    const { applicantId, recipientId, status: oldStatus } = invitation;
    if (recipientId !== userId || oldStatus !== 'waiting') {
        throw new BadRequestError('非法处理好友请求');
    }

    switch (status) {
        case 'accepted': {
            // 双方添加好友
            try {
                await models.Friends.create({
                    userId: applicantId,
                    friendId: recipientId,
                });

                await models.Friends.create({
                    userId: recipientId,
                    friendId: applicantId,
                });

            } catch (error) {
                console.log(error);
                throw new InternalServerError('服务器出错');
            }

            // 通知对方添加好友成功
            try {
                await sendNotice(applicantId, 'friend.add.pass', {
                    userId: recipientId,
                    status: 'accepted',
                });
            } catch (e) {
                console.log(e);
                throw new InternalServerError('发送通知失败');
            }

            break;
        }
        case 'rejected': {
            // 通知对方被拒绝
            try {
                await sendNotice(applicantId, 'friend.add.reject', {
                    userId: recipientId,
                    status: 'rejected',
                });
            } catch (e) {
                console.log(e);
                throw new InternalServerError('发送通知失败');
            }

            break;
        }
        default: {
            throw new BadRequestError('非法处理好友请求');
        }
    }

    // 更新好友申请状态
    try {
        await models.FriendInvitations.update({
            status: status,
        }, {
            where: {
                id: invitationId,
            }
        });
    } catch (error) {
        console.log(error);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 删除好友
 * @param userId
 * @param friendId
 * @return {Promise<void>}
 */
const remove = async (userId, friendId) => {
    if (!await isFriend(userId, friendId)) {
        throw new BadRequestError('您不是对方的好友');
    }
    // 删除好友
    try {
        await models.Friends.destroy({
            where: {
                userId: userId,
                friendId: friendId
            }
        });

        await models.Friends.destroy({
            where: {
                userId: friendId,
                friendId: userId
            }
        });
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }

    // 通知对方删除好友
    try {
        await sendNotice(friendId, 'friend.remove', {
            userId: userId
        });
    } catch (e) {
        console.log(e);
        throw new InternalServerError('发送通知失败');
    }
}

module.exports = {
    isFriend,
    getList,
    add,
    remove,
    listInvitation,
    respInvitation,
}