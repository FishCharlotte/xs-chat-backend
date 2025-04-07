const { DataTypes } = require("sequelize");
const Users = require("./users");
const Groups = require('./groups')

module.exports = (sequelize) => {
    sequelize.define('GroupMessages', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        senderId: {
            type: DataTypes.INTEGER,
            references: {
                model: Users,
                key: 'id'
            },
            comment: '发出用户ID'
        },
        groupId: {
            type: DataTypes.INTEGER,
            references: {
                model: Groups,
                key: 'id'
            },
            comment: '接收群组ID'
        },
        content: {
            type: DataTypes.STRING,
            comment: '消息内容'
        },
        type: {
            type: DataTypes.ENUM,
            values: ['text', 'voice', 'expression', 'picture'],
            comment: '消息类型'
        },
    });
};
