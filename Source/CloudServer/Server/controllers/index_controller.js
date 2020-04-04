var users_model = require('../models/users_model.js');
var node_data_model = require('../models/node_data_model.js');
var data_latest_model = require('../models/data_latest_model.js');

exports.getHomePage = function (req, res, next) {
	node_data_model.getAllNodeData(function (err, result) {
		if (err)
			return res.send(false);
		res.render('index', {
			user: req.user,
			all_nodes: result
		});
	});
};

exports.getProfilePage = function (req, res, next) {
	res.render('profile', {
		user: req.user
	});
};

exports.getAllNodes = function (req, res, next) {
	node_data_model.getAllNodeData(function (err, result) {
		if (err)
			return res.send(false);
		res.send(result);
	});
};

exports.getLatestData = function (req, res, next) {
	data_latest_model.getAllByNodeId(req.params.node_id, function (err, result) {
		if (err)
			return res.send(false);
		res.send(result);
	});
};

exports.Crash = function (req, res, next) {
	var crash_0;
  carsh_0 = cars_1.crash_2;
	res.send(false);
}
