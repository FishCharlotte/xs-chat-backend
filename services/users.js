const {models} = require("../models");
const { InternalServerError, BadRequestError, NotFoundError } = require("../utils/error");
const { Op } = require('sequelize');
const bcrypt = require("bcryptjs");
const SHA256 = require("crypto-js/sha256");
const fs = require("fs");
const Config = require('../config');


/**
 * @description 通过username获取用户的id
 * @param username
 * @return {Promise<*>}
 */
const getId = async (username) => {
    try {
        const res = await models.Users.findOne({
            attributes: ['id'],
            where: {
                username: username
            }
        });
        return res.id
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 判断用户名是否存在
 * @param {String} username
 * @return {Promise}
 */
const usernameIsExit = async (username) => {
    try {
        const res = await models.Users.findOne({
            where: {
                username: username
            }
        });
        return res !== null
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 判断用户id是否存在
 * @param {Number} userId
 * @return {Promise}
 */
const userIsExit = async (userId) => {
    try {
        const res = await models.Users.findOne({
            where: {
                id: userId
            }
        });
        return res !== null
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 用户注册
 * @param {String} username
 * @param {String} nickname
 * @param {String} password
 * @throws {BadRequestError} 如果用户名已被占用
 * @throws {InternalServerError} 如果数据库操作失败
 */
const register = async (username, nickname, password) => {
    if (await usernameIsExit(username)) {
        throw new BadRequestError('用户名已被占用')
    }
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    try {
        await models.Users.create({
            username: username,
            nickname: nickname,
            password: hashedPassword,
        });
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}


/**
 * @description 用户登录
 * @param {String} username
 * @param {String} password
 * @throws {BadRequestError} 用户名不存在
 * @throws {BadRequestError} 输入密码错误
 * @return {Promise} 用户id
 */
const login = async (username, password) => {
    if(!await usernameIsExit(username)) {
        throw new BadRequestError('用户名不存在')
    }

    const res = await models.Users.findOne({
        attributes: ['password', 'id'],
        where: {
            username: username
        }
    })

    const isPasswordMatched = bcrypt.compareSync(password, res.password);
    if (!isPasswordMatched) {
        throw new BadRequestError('密码错误')
    }
    return res.id;
}


/**
 * @description 按照用户ID获取用户信息
 * @param {Number} userId
 * @return {Promise<{nickname: *, avatar: *, username}>} 用户名、昵称、头像
 */
const getInfo = async (userId) => {
    try {
        return await models.Users.findOne({
            where: {
                id: userId,
            }
        });
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}

/**
 * @description 按照昵称搜索用户信息
 * @param {String} keyword
 * @return {Promise<*>} 用户名、昵称、头像
 */
const search = async (keyword) => {
    try {
        return await models.Users.findAll({
            attributes: ['id', 'username', 'nickname', 'avatar'],
            where: {
                [Op.or]: [{
                    username: keyword
                },
                // {
                //     nickname: {
                //         [Op.like]: `%${keyword}%`
                //     }
                // },
                ]
            }
        });
    } catch (error) {
        console.log('users.search err:', error.message);
        throw new InternalServerError('服务器出错');
    }
}

/**
 * @description 修改用户信息
 * @param {Number} userId
 * @param {String} newUsername
 * @param {String} newNickname
 * @return {Promise<void>}
 */
const modifyInfo = async (userId, newUsername, newNickname) => {
    // 同时修改username和nickname
    if (newUsername && newNickname) {
        if (await usernameIsExit(newUsername)) {
            throw new BadRequestError('该用户名已被使用')
        }
        await models.Users.update({
            username: newUsername,
            nickname: newNickname
        },{
            where: {
                id: userId
            }
        });
    } else if (newUsername) {
        if (await usernameIsExit(newUsername)) {
            throw new BadRequestError('该用户名已被使用')
        }
        await models.Users.update({
            username: newUsername
        },{
            where: {
                id: userId
            }
        });
    } else if (newNickname) {
        await models.Users.update({
            nickname: newNickname
        },{
            where: {
                id: userId
            }
        });
    }
}


/**
 * @description 上传头像
 * @param {Number} userId
 * @param {String} username
 * @param {File} avatar
 * @return {Promise<*>}
 */
const uploadAvatar = async (userId, username, avatar) => {
    const date = Date.now();
    // 文件类型仅接收jpg、png格式
    const type = avatar.mimetype;
    let suffix = '';

    if (type === "image/jpeg") {
        suffix = 'jpg';
    } else if (type === "image/png" ) {
        suffix = 'png';
    } else {
        throw new BadRequestError('上传的文件格式不对，应为png或jpg')
    }

    const avatarName = `${date}-${SHA256(username)}.${suffix}`;
    const path = `${Config.attachment.saveDir.avatar}/${avatarName}`;
    try {
        // 查找当前用户的AvatarId
        const res = await models.Users.findOne({
            attributes: ['avatarId'],
            where: {
                id: userId,
            }
        });

        // 查找头像对应的Attachment
        let attachment = null;
        if (res) {
            attachment = await models.Attachments.findOne({
                where: {
                    id: res.avatarId,
                }
            });
        }

        // 保存头像文件
        fs.writeFileSync(path, avatar.buffer);

        // 记录新头像
        const avatarResp = await models.Attachments.create({
            type: 'avatar',
            storagePlace: 'local',
            storageKey: avatarName,
            userId: userId,
        });

        console.log(avatarResp);

        // 直接生成绝对的地址
        const url = Config.attachment.baseUrl.avatar + '/' + avatarName;

        // 更新头像路径
        await models.Users.update({
            avatar: url,
            avatarId: avatarResp.id,
        }, {
            where: {
                id: userId,
            }
        });

        // 删除以前的头像
        if (attachment) {
            if (attachment.storagePlace === 'local') {
                fs.rmSync(`${Config.attachment.saveDir.avatar}/${attachment.storageKey}`);
            }

            // 删除完成后记录头像附件被删除
            await models.Attachments.update({
                isDeleted: true,
            },{
                where: {
                    id: attachment.id,
                }
            });
        }

        return avatarName;
    } catch (error) {
        console.log(error.message);
        throw new InternalServerError('服务器出错');
    }
}

module.exports = {
    usernameIsExit,
    userIsExit,
    getId,
    register,
    search,
    login,
    getInfo,
    modifyInfo,
    uploadAvatar
}
