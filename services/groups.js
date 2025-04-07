const { InternalServerError, NotFoundError, BadRequestError } = require("../utils/error");
const {models} = require("../models");
const { Op } = require('sequelize');
const { userIsExit } = require("./users");
const { isFriend } = require("./friends");


/**
 * @description 判断Handle是否唯一
 * @param {String} handle 识别号
 * @return {Promise<boolean>}
 */
const isHandleExit = async (handle) => {
    const res = await models.Groups.findOne({
        where: {
            handle: handle
        }
    })
    return !!res;
}


/**
 * @description 判断群聊是否存在
 * @param {Number} groupId 群聊ID
 * @return {Promise<boolean>}
 */
const isGroupExit = async (groupId) => {
    const res = await models.Groups.findOne({
        where: {
            id: groupId
        }
    })
    return !!res;
}


/**
 * @description 判断用户是否在群聊内
 * @param {Number} userId 当前用户ID
 * @param {Number} groupId 群聊ID
 * @return {Promise<boolean>}
 */
const isInGroup = async (userId, groupId) => {
    if (!await isGroupExit(groupId)) {
        return false;
    }
    const res = await models.GroupMembers.findOne({
        where: {
            UserId: userId,
            GroupId: groupId
        }
    })
    return !!res;
}


/**
 * @description 判断用户是否有管理员/群主身份
 * @param {Number} userId 当前用户ID
 * @param {Number} groupId 群聊ID
 * @return {Promise<boolean>}
 */
const isAdmin = async (userId, groupId) => {
    const res = await models.GroupMembers.findOne({
        attributes: ['role'],
        where: {
            UserId: userId,
            GroupId: groupId
        }
    })
    return res.role === 'owner' || res.role === 'admin';
}


/**
 * @description 查询当前用户是否群主身份
 * @param {Number} userId 当前用户ID
 * @param {Number} groupId 群聊ID
 * @return {Promise<boolean>}
 */
const isOwner = async (userId, groupId) => {
    const res = await models.GroupMembers.findOne({
        attributes: ['role'],
        where: {
            UserId: userId,
            GroupId: groupId
        }
    })
    return res.role === 'owner';
}


/**
 * @description 创建群聊
 * @param {Number} userId 当前用户ID
 * @param {String} roomName 房间名称
 * @param {Array} membersID 拉进群的成员
 */
const create = async (userId, roomName,  membersID) => {
    if (!roomName || !membersID) {
        throw new BadRequestError('信息不全')
    }
    // 验证每个member是否都是有效的，使用memberID是否存在于数据库当中来操作。
    const validMembersID = [userId];
    for (let memberID of membersID) {
        if (!Number.isInteger(memberID)) {
            throw new BadRequestError('请选择正确相应的用户开启聊天');
        }
        if (await userIsExit(memberID) && await isFriend(userId, memberID)) {
            validMembersID.push(parseInt(memberID));
        }
    }

    if (validMembersID.length <= 1) {
        throw new BadRequestError('参数不合法：合法群聊人数小于2');
    } else if (validMembersID.length > 2) {
        try {
            const newGroup = await models.Groups.create({
                name: roomName
            })

            // 插入群主记录到ChannelMembers数据表
            await models.GroupMembers.create({
                UserId: userId,
                GroupId: newGroup.id,
                role: 'owner'
            })
            // 插入除了群主以外的成员数据到数据库里面
            for (const memberId of validMembersID) {
                if (memberId === userId) {
                    continue;
                }
                await models.GroupMembers.create({
                    UserId: memberId,
                    GroupId: newGroup.id,
                    role: 'member'
                })
            }
            return newGroup.id;
        } catch (error) {
            console.log(error.message);
            throw new InternalServerError('服务器出错');
        }
    }
}


/**
 * @description 群主设置群识别号
 * @param {Number} userId 当前用户ID
 * @param {Number} groupId 群聊ID
 * @param {String} handle 要设置的群号
 */
const setHandle = async (userId, groupId,  handle) => {
    if (!await isGroupExit(groupId)) {
        throw new NotFoundError('没有找到该群聊');
    }
    if (!await isInGroup(userId, groupId)) {
        throw new BadRequestError('用户不在该群聊当中');
    }
    if (!await isOwner(userId, groupId)) {
        throw new BadRequestError('用户无操作权限');
    }
    if (await isHandleExit(handle)) {
        throw new BadRequestError('该识别号已存在，请换一个。')
    }
    try {
        await models.Groups.update(
            {handle: handle},
            {
                where: {
                    id: groupId
                }
            }
        )
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 群主或管理员设置群名
 * @param {Number} userId 当前用户ID
 * @param {Number} groupId 群聊ID
 * @param {String} name 要设定的名称
 * @return {Promise<void>}
 */
const setName = async (userId, groupId, name) => {
    if (!await isGroupExit(groupId)) {
        throw new NotFoundError('没有找到该群聊');
    }
    if (!await isInGroup(userId, groupId)) {
        throw new BadRequestError('用户不在该群聊当中');
    }
    if (!await isAdmin(userId, groupId)) {
        throw new BadRequestError('用户无操作权限');
    }
    try {
        await models.Groups.update(
            {name: name},
            {
                where: {
                    id: groupId
                }
            }
        )
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 群主设置群聊管理员
 * @param {Number} userId 当前用户ID
 * @param {Number} memberId 群聊成员ID
 * @param {Number} groupId 群聊ID
 * @return {Promise<void>}
 */
const setAdmin = async (userId, memberId, groupId) => {
    if (!await isGroupExit(groupId)) {
        throw new NotFoundError('没有找到该群聊');
    }
    if (!await isInGroup(userId, groupId)) {
        throw new BadRequestError('您不在群聊当中');
    }
    if (!await isInGroup(memberId, groupId)) {
        throw new BadRequestError('授权用户不在群聊当中');
    }
    if (!await isOwner(userId, groupId)) {
        throw new BadRequestError('用户无操作权限');
    }
    if (await isAdmin(memberId, groupId)) {
        throw new BadRequestError('用户已是管理员身份');
    }

    try {
        await models.GroupMembers.update({
            role: 'admin'
        }, {
            where: {
                role: 'member',
                UserId: memberId,
                GroupId: groupId
            }
        })
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 加入群聊操作
 * @param {Number} userId 当前用户ID
 * @param {Number} groupId 群聊ID
 */
const join = async (userId, groupId) => {
    if (!await isGroupExit(groupId)) {
        throw new NotFoundError('没有找到该群聊');
    }
    if (await isInGroup(userId, groupId)) {
        throw new BadRequestError('已经在群聊当中');
    }

    try {
        await models.GroupMembers.create({
            UserId: userId,
            GroupId: groupId,
            role: 'member',
        });
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}

/**
 * @description 添加用户的好友到指定群聊中
 * @param {Number} userId 当前用户ID
 * @param {Number} memberId 要添加的用户ID
 * @param {Number} groupId  群聊ID
 * @return {Promise<void>}
 */
const add = async (userId, memberId, groupId) => {
    if (!await isGroupExit(groupId)) {
        throw new NotFoundError('没有找到该群聊');
    }
    if (!await isInGroup(userId, groupId)) {
        throw new BadRequestError('您不在该群聊当中');
    }
    if (await isInGroup(memberId, groupId)) {
        throw new BadRequestError('受邀用户已在该群聊当中');
    }
    if (await isFriend(userId, memberId)) {
        throw new BadRequestError('您不是对方的好友');
    }

    try {
        await models.GroupMembers.create({
            UserId: memberId,
            GroupId: groupId,
            role: 'member',
        })
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 离开群聊操作
 * @param {Number} userId 当前用户ID
 * @param {Number} groupId  群聊ID
 */
const leave = async (userId, groupId) => {

    if (!await isGroupExit(groupId)) {
        throw new NotFoundError('没有找到该群聊');
    }
    if (!await isInGroup(userId, groupId)) {
        throw new BadRequestError('用户不在该群聊当中');
    }
    if (await isOwner(userId, groupId)) {
        throw new BadRequestError('群主不能离开')
    }

    try {
        await models.GroupMembers.destroy({
            where: {
                UserId: userId,
                GroupId: groupId,
                role: {
                    [Op.or]: ['member', 'admin']
                }
            }
        });
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 删除群聊操作
 * @param {Number} userId 当前用户ID
 * @param {Number} groupId 群聊ID
 */
const destroy = async (userId, groupId) => {
    if (!await isGroupExit(groupId)) {
        throw new NotFoundError('没有找到该群聊');
    }
    if (!await isInGroup(userId, groupId)) {
        throw new BadRequestError('用户不在该群聊当中');
    }
    if (!await isOwner(userId, groupId)) {
        throw new BadRequestError('用户不是群主身份');
    }
    try {
        await models.GroupMembers.destroy({
            where: {
                GroupId: groupId
            }
        });
        await models.Groups.destroy({
            where: {
                id: groupId
            }
        });
        await models.GroupMessages.destroy({
            where: {
                groupId: groupId
            }
        })
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 获取用户所在的所有群聊组ID
 * @param { Number } userId 当前用户ID
 */
const getGroupList = async (userId) => {
    try {

        const res = await models.GroupMembers.findAll({
            attributes: ['GroupId', 'role'],
            where: {
                UserId: userId
            }
        })
        return res.map(item => ({
            groupId: item.GroupId,
            role: item.role,
        }))
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 搜索群聊操作
 * @param {String} keyword 群聊关键词，可以为name也可以为handle
 */
const searchGroup = async (keyword) => {
    if (!keyword || keyword === 'null') {
        throw new NotFoundError('输入内容不能为空')
    }
    const res = await models.Groups.findAll({
        attributes: ['id', 'handle', 'name'],
        where: {
            [Op.or]: [
                { handle: keyword },
                { name: {
                        [Op.like]: `%${keyword}%`
                    }
                }
            ],
        }
    })
    console.log(res)
    return res.map(item => ({
        id: item.id,
        handle: item.handle,
        name: item.name
    }))
}

/**
 * @description 获取指定的群聊成员
 * @param {Number} userId
 * @param {Number} groupId
 */
const getMembersList = async (userId, groupId) => {
    if (!await isGroupExit(groupId)) {
        throw new NotFoundError('群聊不存在');
    }
    if (!await isInGroup(userId, groupId)) {
        throw new BadRequestError('用户不在当前群聊内');
    }
    try {
        const res = await models.GroupMembers.findAll({
            where: {
                GroupId: groupId
            }
        })

        return {
            members: res.map(item => item.UserId),
            count: res.length
        }
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 当前用户为管理员，移除某位群成员的操作
 * @param {Number} userId
 * @param {Number} memberId
 * @param {Number} groupId
 */
const removeMember = async (userId, memberId, groupId) => {
    if (memberId === groupId) {
        throw new NotFoundError('无法删除自己，应选择要移除的成员');
    }
    if (!await isInGroup(userId, groupId) ||
        !await isGroupExit(groupId) ||
        !await isInGroup(memberId, groupId)
    ) {
        throw new NotFoundError('该群不存在或成员不存在')
    }
    if (!await isAdmin(userId, groupId)) {
        throw new BadRequestError('无权进行该操作');
    }
    if (await isOwner(userId, groupId)) {
        await models.GroupMembers.destroy({
            where: {
                UserId: userId,
                GroupId: groupId,
                role: 'member'
            }
        })
        return;
    }
    if (await isOwner(memberId, groupId)) {
        throw new BadRequestError('无法移除群主')
    }
    await models.GroupMembers.destroy({
        where: {
            UserId: userId,
            GroupId: groupId,
            role: 'member'
        }
    })
}

const getGroupInfo = async (groupId) => {
    if (!await isGroupExit(groupId)) {
        throw new NotFoundError('没有找到该群聊');
    }
    const res = await models.Groups.findOne({
        where: {
            id: groupId
        }
    })
    return res;
}

module.exports = {
    isInGroup,
    isOwner,
    isAdmin,
    create,
    join,
    add,
    leave,
    destroy,
    setHandle,
    setName,
    setAdmin,
    getGroupList,
    searchGroup,
    getMembersList,
    removeMember,
    getGroupInfo
}