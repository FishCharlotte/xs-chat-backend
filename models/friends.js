const { DataTypes } = require("sequelize");
const Users = require('./users')

module.exports = (sequelize) => {
    sequelize.define('Friends', {
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
            comment: '用户'
        },
        friendId: {
            type: DataTypes.INTEGER,
            references: {
                model: Users,
                key: 'id'
            },
            comment: '用户的好友ID'
        },
    }, {
        timestamps: false, // true
    });
};
