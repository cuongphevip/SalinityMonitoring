var express = require('express');
var router = express.Router();
var passport_config = require('../config/passport_config');
var user_controller = require('../controllers/user_controller');
var node_management_controller = require('../controllers/node_management_controller');

/* Ensure login for POST request */
router.post('*',
	require('connect-ensure-login').ensureLoggedIn('/profile'),
	function (req, res, next) {
	next('route');
});

router.get('/',
	require('connect-ensure-login').ensureLoggedIn('/profile'),
	node_management_controller.getNodeManagementPage);

router.get('/get_node/:node_id',
	node_management_controller.GetNodeByNodeId);

router.get('/update_node_threshold/all/:threshold',
	node_management_controller.UpdateAllNodeThreshold);

router.get('/update_node_threshold/:node_id/:threshold',
	node_management_controller.UpdateNodeThreshold);

router.get('/change_node_id/:old_node_id/:new_node_id',
	node_management_controller.ChangeNodeId);

router.post('/update_node', node_management_controller.UpdateNode);

router.post('/add_node', node_management_controller.AddNode);

router.post('/delete_node', node_management_controller.DeleteNode);

module.exports = router;
