// const serve = require("koa-static");
const send = require("koa-send");
const Router = require('@koa/router')

const router = new Router();

router.get('/(.*)', async (ctx) => {
    await send(ctx, ctx.path.slice('/statics/'.length), { root: "./data" });
})


module.exports = router;
