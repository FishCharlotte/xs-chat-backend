const errorInterceptor = async (ctx, next) => {
    try {
        await next(); // 执行下一个中间件或路由处理程序

    } catch (error) {
        ctx.status = error.status || 500; // 设置响应状态码
        ctx.body = {
            error: error.message || 'Internal Server Error',
        };
    }
}

module.exports = {
    errorInterceptor
};
