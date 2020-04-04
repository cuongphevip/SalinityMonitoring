var express = require('express');
var router = express.Router();
var passport_config = require('../config/passport_config');
var user_controller = require('../controllers/user_controller');
var data_utilization_controller = require('../controllers/data_utilization_controller');

/* Ensure login for POST request */
router.post('*',
	require('connect-ensure-login').ensureLoggedIn('/profile'),
	function (req, res, next) {
	next('route');
});

router.get('/',
	require('connect-ensure-login').ensureLoggedIn('/profile'),
	data_utilization_controller.getDataUtilizationPage);

router.post('/get_data_by_date', data_utilization_controller.GetDataByDate);

router.post('/get_data_by_hour', data_utilization_controller.GetDataByHour);

router.post('/get_data_by_salinity', data_utilization_controller.GetDataBySalinity);

router.post('/export_data', data_utilization_controller.ExportData);

router.get('/get_data_file/:node_id',
	require('connect-ensure-login').ensureLoggedIn('/profile'),
	data_utilization_controller.GetDataFile);

router.get('/import/:node_id/:salinity', data_utilization_controller.ImportData);

router.get('/export/:node_id', data_utilization_controller.ExportLatestData);

module.exports = router;
