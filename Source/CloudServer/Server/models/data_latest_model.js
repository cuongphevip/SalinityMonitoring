var mongoose = require('../database/db_connection').mongoose;
var async = require("async");
var Schema = mongoose.Schema;
var data_latest_schema = new Schema({
		node_id: String,
		salinity: Number,
		date: Date
	}, {
		collection: 'SalinityLatestData',
		versionKey: false
	});

var salinity_latest_db = mongoose.model('SalinityLatestData', data_latest_schema);

exports.getAllData = function (callback) {
	salinity_latest_db.find({}, callback);
}

exports.findById = function (_id, callback) {
	salinity_latest_db.findById(_id, callback);
}

exports.getAllByNodeId = function (node_id, callback) {
	salinity_latest_db.find({
		"node_id": node_id
	}).sort({
		date: 1
	}).exec(callback);
}

exports.InsertNewData = function (node_id, salinity, date, callback) {
	var data = {
		"node_id": node_id,
		"salinity": salinity,
		"date": date
	};
	salinity_latest_db.find({
		"node_id": node_id
	}).sort({
		'date': 1
	}).exec(function (err, data_of_node) {
		if (err)
			return callback(false);
		if (data_of_node.length >= 10) {
			var i = 0;
			var waterfall = [];
			for (i = data_of_node.length; i > 9; i--) {
				waterfall.push(function (cb) {
					salinity_latest_db.findByIdAndRemove(data_of_node[data_of_node.length - i]._id, function (err, result) {
						if (err)
							return callback(false);
						i--; //Do not delete this line, it impacts on waterfall async task.
						cb(null);
					});
				});
			}
			i = data_of_node.length; //Do not delete this line, it impacts on waterfall async task.
			async.waterfall(waterfall, function (err, result) {
				if (err)
					return callback(false);
				salinity_latest_db.create(data, function (err) {
					if (err) {
						console.log(err);
						return callback(false);
					}
					return callback(true);
				});
			})
		} else {
			salinity_latest_db.create(data, function (err) {
				if (err) {
					console.log(err);
					return callback(false);
				}
				return callback(true);
			});
		}
	});
}

exports.DeleteNodeLatestData = function (node_id, callback) {
	salinity_latest_db.find({
		node_id: node_id
	}).remove(callback);
}

exports.GetLatestValueOfNode = function (node_id, callback) {
	salinity_latest_db.find({
		node_id: node_id
	}).sort({
		date: -1
	}).exec(function (err, result) {
		if (err)
			return callback(err, null);
		callback(null, result[0]);
	});
}
