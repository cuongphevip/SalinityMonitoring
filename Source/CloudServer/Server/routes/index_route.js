var express = require('express');
var router = express.Router();
var index_controller = require('../controllers/index_controller');

/* GET home page. */
router.get('/',
	function (req, res) {
	res.redirect('/index');
});

router.get('/index', index_controller.getHomePage);

/* GET profile page. */
router.get('/profile', index_controller.getProfilePage);

/* GET all nodes' data. */
router.get('/get_all_nodes', index_controller.getAllNodes);

/* GET all latest data of nodes. */
router.get('/get_latest_data/:node_id', index_controller.getLatestData);

router.get('/crash', index_controller.Crash);

module.exports = router;
