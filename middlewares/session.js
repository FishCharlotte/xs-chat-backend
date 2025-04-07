
const SocketIOKoaSession = (app, opt, store) => {
    const key = opt.key || 'koa.sid';
    return async (socket, next) => {
        if (!socket.handshake.headers.cookie) {
            return next(new Error('no cookies'));
        }

        // get access to koa context so that we can get session cookie
        // createContext does not need the ServerResponse to get us access to the cookies
        // however it is a required parameter that does not allow null or undefined
        const ctx = app.createContext(socket.request, null);
        const token = ctx.cookies.get(key);
        if (!token) {
            return next(new Error('no koa session cookie set'));
        }

        const sid = 'koa:sess:' + token;

        // cast socket to SessionSocket so that we have access to session member
        const sessionSocket = socket;

        // allow socket.io handlers to destroy the session
        const destroy = () => store.destroy(sid);

        // allow socket.io handlers to reload session from store
        const reload = () => store.get(sid).then((newSession) => {
            // save old reload reference to new session
            newSession.reload = sessionSocket.session.reload;
            // overwrite old session with session from store
            sessionSocket.session = newSession || {};
            sessionSocket.session.save = () => store.set(sid, newSession);
            sessionSocket.session.destroy = destroy;
            return newSession;
        });

        // load session from store or create empty session
        sessionSocket.session = (await store.get(sid)) || {};

        // add our methods to allow socket.io to reload, save and destroy session
        sessionSocket.session.reload = reload;
        sessionSocket.session.save = () => store.set(sid, sessionSocket.session);
        sessionSocket.session.destroy = destroy;

        await next();
    };
};

module.exports = {
    SocketIOKoaSession,
}