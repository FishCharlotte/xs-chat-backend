const Router = require('@koa/router')
const { Friends } = require('../controllers');
const { ensureAuthenticated } = require('../middlewares/authorization');

const router = new Router();

router.get('/', ensureAuthenticated, Friends.friendList);
router.post('/:id', ensureAuthenticated, Friends.add);
router.delete('/:id', ensureAuthenticated, Friends.remove);

router.get('/invitation', ensureAuthenticated, Friends.listInvitation);
router.put('/invitation/:id', ensureAuthenticated, Friends.respInvitation);


module.exports = router;
