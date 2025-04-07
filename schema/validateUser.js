const Joi = require("joi");

const registerSchema = Joi.object({
    username: Joi.string().min(1).max(15).required(),
    nickname: Joi.string().min(1).max(15).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
})

const loginSchema = Joi.object({
    username: Joi.string().min(1).max(15).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
})

module.exports = {
    registerSchema,
    loginSchema,
}
