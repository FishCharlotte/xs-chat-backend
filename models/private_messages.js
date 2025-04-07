const { DataTypes } = require("sequelize");
const Users = require("./users");

module.exports = (sequelize) => {
    sequelize.define('PrivateMessages', {
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
        recipientId: {
            type: DataTypes.INTEGER,
            references: {
                model: Users,
                key: 'id'
            },
            comment: '接收用户ID'
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
