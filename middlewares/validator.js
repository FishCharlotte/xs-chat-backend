const { BadRequestError } = require('../utils/error')
const validator = (type, schema) => {
    return async (ctx, next) => {
        let data = undefined;

        switch (type) {
            case 'query':
                data = ctx.request.query;
                break;
            case 'body':
                data = ctx.request.body;
                break;
        }

        const value = schema.validate(data);
        if (value.error) {
            throw new BadRequestError(value.error.details.map((detail) => (
                detail.message
            )).join(', '))
        }

        await next();
    }
}

module.exports = {
    validator
}
