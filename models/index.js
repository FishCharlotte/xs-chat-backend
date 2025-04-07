const { Sequelize } = require('sequelize');
const config = require('../config/database.json');
const applyExtraSetup = require('./extra_setup');

const sequelize = new Sequelize(config.databaseName, config.user, config.password, {
    logging: false,
    // storage: config.storage,
    // host: config.host,
    dialect: config.dialect,
    pool: {
        max: config.pool.max,
        min: config.pool.min,
        acquire: config.pool.acquire,
        idle: config.pool.idle
    },
    dialectOptions: {
        useUTC: false, // for reading from database
        timezone: config.timezone,
    },
});

const modelsDefiners = [
    require('./users.js'),
    require('./groups.js'),
    // require('./private_messages.js'),
    // require('./group_messages.js'),
    require('./friend_invitations.js'),
    require('./group_members'),
    require('./friends'),
    require('./attachments'),
]

for (let modelDefiner of modelsDefiners) {
    modelDefiner(sequelize);
}
applyExtraSetup(sequelize);

sequelize.authenticate()
    .then(() => console.log('连接数据库成功'))
    .catch(err => console.log('连接数据库失败： ', err))

sequelize.sync({
    force: false,
    // alter: true,
})
    .then(() => {
        console.log('同步成功')
    })
    .catch(err => console.log('同步失败: ', err))

module.exports = sequelize;
