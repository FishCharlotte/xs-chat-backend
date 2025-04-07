const Router = require('@koa/router')
const { Groups } = require('../controllers');
const { ensureAuthenticated, ensureGroupAdmin, ensureGroupOwner, ensureGroupMember } = require('../middlewares/authorization')

const router = new Router();

// Group Routes
router.get('/', ensureAuthenticated, Groups.getGroupList); // 获取所有群组
router.post('/', ensureAuthenticated, Groups.create); // 创建群组
router.delete('/:id', ensureAuthenticated, ensureGroupOwner, Groups.destroy); // 删除群组
router.get('/:id', ensureAuthenticated, ensureGroupMember, Groups.getGroupInfo); // 获取群组信息
router.put('/:id/name', ensureAuthenticated, ensureGroupAdmin, Groups.setName); // 修改群组名称
router.put('/:id/admin', ensureAuthenticated, ensureGroupOwner, Groups.setAdmin); // 设置群组管理员
router.put('/:id/handle', ensureAuthenticated, ensureGroupAdmin, Groups.setHandle); // 修改群组标识

// Membership Routes
router.post('/:id/join', ensureAuthenticated, Groups.join); // 加入群组
router.delete('/:id/leave', ensureAuthenticated, ensureGroupMember, Groups.leave); // 离开群组
router.post('/:id/members', ensureAuthenticated, ensureGroupMember, Groups.add); // 添加成员
router.delete('/:id/members', ensureAuthenticated, ensureGroupAdmin, Groups.removeMember); // 移除成员
router.get('/:id/members', ensureAuthenticated, ensureGroupMember, Groups.getMemberList); // 获取群组成员列表
router.get('/:id/members/admin-status', ensureAuthenticated, Groups.checkAdminStatus); // 检查当前用户是否是群组管理员


// Search Routes
router.get('/search', ensureAuthenticated, Groups.searchGroup); // 搜索群组
module.exports = router;
