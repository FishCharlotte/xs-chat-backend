const Router = require('@koa/router');

const { errorInterceptor } = require('../middlewares/errorInterceptor');
const sequelize = require('../models/index');
const { BadRequestError } = require("../utils/error");
const { ensureAuthenticated } = require("../middlewares/authorization");
const Users = require('./users');
const Groups = require('./groups');
const Static = require('./static');
const Friends = require('./friends')


const router = new Router();

router.use(errorInterceptor);
router.use('/statics', Static.routes());
router.use('/users', Users.routes());
router.use('/groups', Groups.routes());
router.use('/friends', Friends.routes());


router.get('/sync_database_alter', ensureAuthenticated, async (ctx) => {
    const { userId } = ctx.session;
    if (userId !== 1) {
        throw new BadRequestError('用户没有该权限操作');
    }

    await sequelize.sync({ alter: true });

    ctx.body = {
        status: 200,
        message: 'ok',
    }
});

router.get('/sync_database_force', ensureAuthenticated, async (ctx) => {
    const { userId } = ctx.session;
    if (userId !== 1) {
        throw new BadRequestError('用户没有该权限操作');
    }

    await sequelize.sync({ force: true });

    ctx.body = {
        status: 200,
        message: 'ok',
    }
});

module.exports = router;
