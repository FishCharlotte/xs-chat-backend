const Router = require('@koa/router')
const { validator } = require('../middlewares/validator')
const {registerSchema, loginSchema} = require('../schema/validateUser')
const { Users } = require('../controllers');
const multer = require('@koa/multer');
const { ensureAuthenticated } = require('../middlewares/authorization')

const upload = multer();
const router = new Router();

// TODO: 是否需要在别的接口加上validator？

router.post('/register', validator('body', registerSchema), Users.register);
router.post('/login', validator('body', loginSchema), Users.login);

router.put('/', ensureAuthenticated, Users.modifyInfo);
router.get('/', ensureAuthenticated, Users.getInfo);
router.get('/search', ensureAuthenticated, Users.search);

router.post('/avatar', ensureAuthenticated, upload.single('avatar'), Users.uploadAvatar);
router.get('/logout', ensureAuthenticated, Users.logout);

router.get('/:id', ensureAuthenticated, Users.getInfoById);

module.exports = router;
