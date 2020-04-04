var users_model = require('../models/users_model.js');
var deleted_user_numbers_model = require('../models/deleted_user_numbers_model.js');
var node_data_model = require('../models/node_data_model.js');
var data_model = require('../models/data_model.js');
var data_latest_model = require('../models/data_latest_model.js');
var path = require('path');

exports.getNodeManagementPage = function (req, res, next) {
	node_data_model.getAllNodeData(function (err, result) {
		if (err)
			return res.send(false);
		res.render('node_management', {
			user: req.user,
			all_nodes: result
		});
	});
}

exports.UpdateNode = function (req, res, next) {
	var data = {
		node_id: req.body.node_id,
		information: req.body.information,
		y: req.body.y,
		x: req.body.x,
		threshold: req.body.threshold
	}
	node_data_model.UpdateNode(data, function (err, result) {
		if (err)
			return res.send(false);
		res.send(true);
	});
}

exports.GetNodeByNodeId = function (req, res, next) {
	node_data_model.findByNodeId(req.params.node_id, function (err, result) {
		if (err)
			return res.send(false);
		res.send(result[0]);
	});
}

exports.AddNode = function (req, res, next) {
	node_data_model.GetMaxNodeId(function (err, result) {
		if (err)
			return res.send(false);
		var max_node_id = result[0].max_node_id;
		node_data_model.AddNode((max_node_id + 1), req.body.information, req.body.y, req.body.x, req.body.threshold, function () {
			if (err)
				return res.send(false);
			res.send("" + (max_node_id + 1));
		});
	});
}

exports.DeleteNode = function (req, res, next) {
	node_data_model.DeleteNode(req.body.node_id, function (err) {
		if (err)
			return res.send(false);
		data_latest_model.DeleteNodeLatestData(req.body.node_id, function (err) {
			if (err)
				return res.send(false);
			res.send(true);
		});
	});
}

exports.UpdateAllNodeThreshold = function (req, res, next) {
	node_data_model.UpdateAllNodeThreshold(req.params.threshold, function (err, result) {
		if (err)
			return res.send(false);
    if (result.n == 0)
      return res.send(false);
		res.send(true);
	});
}

exports.UpdateNodeThreshold = function (req, res, next) {
	node_data_model.UpdateNodeThreshold(req.params.node_id, req.params.threshold, function (err, result) {
		if (err)
			return res.send(false);
    if (result.n == 0)
      return res.send(false);
		res.send(true);
	});
}

exports.ChangeNodeId = function (req, res, next) {
	node_data_model.findByNodeId(req.params.new_node_id, function (err, result) {
		if (err)
			return res.send(false);
		if (result.length > 0)
			return res.send("exist");
		node_data_model.ChangeNodeId(req.params.old_node_id, req.params.new_node_id, function (err, result) {
			if (err)
				return res.send(false);
			return res.send(true);
		});
	})
}
