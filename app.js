const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const router = require('./routes');
const session = require("koa-generic-session");
const { createServer } = require("http");
const { initSocket } = require('./services/socket');
const redisStore = require('koa-redis');

const isMocha = process.env.NODE_ENV === 'test';

function main(args) {
    const app = new Koa();
    app.keys = ['dieueyf7huienejnfef']

    const store = redisStore({
        host: 'redis',
        port: 6379
    });

    app
        .use(session({
            store: store,
        }))
        .use(bodyParser())
        .use(router.routes())
        .use(router.allowedMethods());

    let httpServer;
    if (args && args.enableHttpServer) {
        httpServer = createServer(app.callback());
        initSocket(httpServer, app, store).then(() => {});

        httpServer.listen(3000);

        console.log('Server is running on http://localhost:3000');
    }

    return { app, httpServer }
}

// 正常运行，非测试环境
if (!isMocha) {
    main({
        enableHttpServer: true,
    })
}

module.exports = main;
