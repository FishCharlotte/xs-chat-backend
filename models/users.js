const { DataTypes} = require("sequelize");

module.exports = (sequelize) => {
    sequelize.define('Users', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: '用户名',
        },
        nickname: {
            type: DataTypes.TEXT,
            comment: '用户昵称'
        },
        password: {
            type: DataTypes.STRING,
            comment: '密码'
        },
        avatar: {
            type: DataTypes.TEXT,
            defaultValue: '',
            comment: '头像'
        },
    });
}
