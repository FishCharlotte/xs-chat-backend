const { DataTypes } = require("sequelize");
const Users = require('./users')

module.exports = (sequelize) => {
    sequelize.define('FriendInvitations', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        applicantId: {
            type: DataTypes.INTEGER,
            references: {
                model: Users,
                key: 'id'
            },
            comment: '好友申请发送者ID'
        },
        // 接收者
        recipientId: {
            type: DataTypes.INTEGER,
            references: {
                model: Users,
                key: 'id'
            },
            comment: '申请接收者ID'
        },
        requestContent: {
            type: DataTypes.STRING,
            comment: '申请文字内容'
        },
        status: {
            type: DataTypes.ENUM,
            values: ['waiting', 'accepted', 'rejected'],
            comment: '申请状态'
        },
    });
}

