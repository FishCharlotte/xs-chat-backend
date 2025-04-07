const { DataTypes } = require("sequelize");
const Users = require("./users");
const Gropus = require('./groups');

// TODO: 未读信息的持久化存储：用户下线后，或者持续一段时间没有消费
module.exports = (sequelize) => {
    sequelize.define('UnreadMessages', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: Users,
                key: 'id'
            },
            comment: ''
        },
        channelId: {
            type: DataTypes.INTEGER,
            references: {
                model: Gropus,
                key: 'id'
            }
        },
        content: DataTypes.STRING,
        type: {
            type: DataTypes.ENUM,
            values: ['text', 'voice', 'expression', 'picture'],
        },
    });
};
