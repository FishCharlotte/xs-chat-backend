/**
 * 资源不存在错误
 */
class NotFoundError extends Error {
    constructor(message) {
        super();
        this.status = 404;
        this.message = message;
    }
}

/**
 * 无权限错误
 */
class ForbiddenError extends Error {
    constructor(message) {
        super();
        this.status = 403;
        this.message = message;
    }
}

/**
 * 未授权错误
 */
class UnauthorizedError extends Error {
    constructor(message) {
        super();
        this.status = 401;
        this.message = message;
    }
}

/**
 * 参数错误
 */
class BadRequestError extends Error {
    constructor(message) {
        super();
        this.status = 400;
        this.message = message;
    }
}

/**
 * 服务器内部错误
 */
class InternalServerError extends Error {
    constructor(message = 'Internal Server Error') {
        super();
        this.status = 500;
        this.message = message;
    }
}


module.exports = {
    NotFoundError,
    ForbiddenError,
    UnauthorizedError,
    BadRequestError,
    InternalServerError,
};
