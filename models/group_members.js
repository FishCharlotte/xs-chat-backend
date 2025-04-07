const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    sequelize.define('GroupMembers', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            comment: '群成员入群记录ID'
        },
        role: {
            type: DataTypes.ENUM,
            values: ['member', 'owner', 'admin'],
            comment: '群成员身份'
        },
    }, {
        timestamps: false
    });
}

