var express = require('express');
var router = express.Router();
var passport_config = require('../config/passport_config');
var user_management_controller = require('../controllers/user_management_controller');

/* Ensure login for User Management request. */
router.get('*',
	require('connect-ensure-login').ensureLoggedIn('/profile'),
	function (req, res, next) {
	next('route');
})

router.post('*',
	require('connect-ensure-login').ensureLoggedIn('/profile'),
	function (req, res, next) {
	next('route');
})

/* GET User Management page. */
router.get('/', user_management_controller.getUserManagementPage);

router.post('/delete_user', user_management_controller.DeleteUser);

router.post('/add_an_user', user_management_controller.AddAnUser);

router.post('/update_role_user', user_management_controller.UpdateRoleUser);

module.exports = router;
