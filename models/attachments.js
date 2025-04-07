const { DataTypes} = require("sequelize");

module.exports = (sequelize) => {
    sequelize.define('Attachments', {
        type: {
            type: DataTypes.ENUM,
            values: ['avatar', 'file', 'emotion', 'audio', 'video', 'picture'],
            comment: '附件类型',
        },
        storagePlace: {
            type: DataTypes.STRING,
            defaultValue: 'local', // 本地服务器存储
            comment: '存储地点',
        },
        storageKey: {
            type: DataTypes.STRING,
            comment: '存储路径',
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否被删除',
        },
    });
}
