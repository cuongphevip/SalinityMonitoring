var users_model = require('../models/users_model.js');
var deleted_user_numbers_model = require('../models/deleted_user_numbers_model.js');
var node_data_model = require('../models/node_data_model.js');
var data_model = require('../models/data_model.js');
var data_latest_model = require('../models/data_latest_model.js');
var io_mod = require('../bin/www');
var excel_model = require('../models/excel_model.js');
var path = require('path');

exports.ImportData = function (req, res, next) {
	var date = new Date();
	date.setTime(date.getTime() + 7 * 60 * 60000);
	var float_salinity = parseFloat(req.params.salinity);
	var threshold_value;
	if (isNaN(float_salinity) || float_salinity > 50 || float_salinity < 0)
		return res.send(false);
	node_data_model.findByNodeId(req.params.node_id, function (err, result) {
		if (err || result.length == 0)
			return res.send(false);
		threshold_value = result[0].threshold;
		data_model.InsertNewData(req.params.node_id, req.params.salinity, date, function (result) {
			if (!result)
				return res.send(result);
			data_latest_model.InsertNewData(req.params.node_id, req.params.salinity, date, function (result) {
				if (!result)
					return res.send(false);
				data_latest_model.getAllByNodeId(req.params.node_id, function (err, result) {
					if (err)
						return res.send(true);
					io_mod(function (io) {
						io.emit("NEW_DATA", result);
					});
					var i;
					for (i = result.length - 1; i > result.length - 4; i--) {
						if (result[i].salinity < threshold_value) {
							return res.send(true);
						}
					}
					res.send("alert");
				});
			});
		});
	});
}

exports.getDataUtilizationPage = function (req, res, next) {
	node_data_model.getAllNodeData(function (err, result) {
		if (err)
			return res.send(false);
		res.render('data_utilization', {
			user: req.user,
			all_nodes: result
		});
	});
}

exports.GetDataByDate = function (req, res, next) {
	var from_date = new Date(req.body.from_date);
	var to_date = new Date(req.body.to_date);
	from_date.setTime(from_date.getTime() + 7 * 60 * 60000);
	to_date.setDate(to_date.getDate() + 1);
	to_date.setTime(to_date.getTime() + 7 * 60 * 60000);
	data_model.GetDataByDate(req.body.node_id, from_date, to_date, function (err, result) {
		if (err)
			return res.send(false);
		res.send(result);
	});
}

exports.GetDataByHour = function (req, res, next) {
	var from_date = new Date(req.body.from_date);
	var to_date = new Date(req.body.to_date);
	from_date.setTime(from_date.getTime() + 7 * 60 * 60000);
	to_date.setDate(to_date.getDate() + 1);
	to_date.setTime(to_date.getTime() + 7 * 60 * 60000);
	data_model.GetDataByHour(req.body.node_id, from_date, to_date, function (err, result) {
		if (err)
			return res.send(false);
		res.send(result);
	});
}

exports.GetDataBySalinity = function (req, res, next) {
	var from_date = new Date(req.body.from_date);
	var to_date = new Date(req.body.to_date);
	from_date.setTime(from_date.getTime() + 7 * 60 * 60000);
	to_date.setDate(to_date.getDate() + 1);
	to_date.setTime(to_date.getTime() + 7 * 60 * 60000);
	data_model.GetDataBySalinity(req.body.node_id, from_date, to_date, function (err, result) {
		if (err)
			return res.send(false);
		//console.log(result);
		res.send(result);
	});
}

exports.ExportData = function (req, res, next) {
	var date_result,
	hour_result,
	salinity_result;
	var from_date = new Date(req.body.from_date);
	var to_date = new Date(req.body.to_date);
	from_date.setTime(from_date.getTime() + 7 * 60 * 60000);
	to_date.setDate(to_date.getDate() + 1);
	to_date.setTime(to_date.getTime() + 7 * 60 * 60000);
	data_model.GetDataByDate(req.body.node_id, from_date, to_date, function (err, result) {
		if (err)
			return res.send(false);
		date_result = result;
		data_model.GetDataByHour(req.body.node_id, from_date, to_date, function (err, result) {
			if (err)
				return res.send(false);
			hour_result = result;
			data_model.GetDataBySalinity(req.body.node_id, from_date, to_date, function (err, result) {
				if (err)
					return res.send(false);
				salinity_result = result;
				excel_model.TestExcel(req.body.node_id, date_result, hour_result, salinity_result, function (err, stats) {
					if (err)
						return res.send(false);
					res.send(true);
				});
			});
		});
	});
}

exports.ExportLatestData = function (req, res, next) {
	data_latest_model.GetLatestValueOfNode(req.params.node_id, function (err, result) {
		if (err)
			return res.send(false);
		var date = new Date(result.date.toString());
		var timeString = date.getUTCHours() + ":" + date.getUTCMinutes() + ":" + date.getUTCSeconds();
		timeString += " " + date.getUTCDate() + "/" + (date.getUTCMonth() + 1) + "/" + date.getUTCFullYear();
		var return_value = "" + result.salinity + "ppt at " + timeString;
		res.send(return_value);
	});
}

exports.GetDataFile = function (req, res, next) {
	var file = __dirname + '/../data_export/DATA_Node_' + req.params.node_id + '.xlsx';
	res.download(path.resolve(file), 'DATA_Node_' + req.params.node_id + '.xlsx');
}
