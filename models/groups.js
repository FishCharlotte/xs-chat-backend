const { DataTypes} = require("sequelize");

module.exports = (sequelize) => {
    sequelize.define('Groups', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            comment: '群组ID'
        },
        handle: {
            type: DataTypes.STRING,
            defaultValue: null,
            allowNull: true,
            unique: true,
            comment: '标识号'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: false,
            comment: '群组名'
        },
    }, {
        timestamps: false
    });
};
