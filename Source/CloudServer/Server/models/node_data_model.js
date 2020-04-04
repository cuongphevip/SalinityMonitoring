var mongoose = require('../database/db_connection').mongoose;
var Schema = mongoose.Schema;
var node_data_schema = new Schema({
		node_id: Number,
		information: String,
		y: String,
		x: String,
		threshold: Number,
		start_date: Date
	}, {
		collection: 'NodeData',
		versionKey: false
	});

var node_data_db = mongoose.model('NodeData', node_data_schema);

exports.getAllNodeData = function (callback) {
	node_data_db.find({}).sort({
		"node_id": 1
	}).exec(callback);
}

exports.findByNodeId = function (node_id, callback) {
	node_data_db.find({
		"node_id": node_id
	}, callback);
}

exports.UpdateNode = function (data, callback) {
	node_data_db.findOneAndUpdate({
		"node_id": data.node_id
	}, data, callback);
}

exports.GetMaxNodeId = function (callback) {
	node_data_db.aggregate().
	group({
		_id: null,
		max_node_id: {
			$max: "$node_id"
		}
	}).
	exec(callback);
}

exports.AddNode = function (node_id, information, y, x, threshold, callback) {
	var new_node = {
		node_id: node_id,
		information: information,
		y: y,
		x: x,
		threshold: threshold,
		start_date: new Date()
	}
	node_data_db.create(new_node, function (err, result) {
		if (err)
			return callback(err, null);
		return callback(err, result);
	});
}

exports.DeleteNode = function (node_id, callback) {
	node_data_db.find({
		node_id: node_id
	}).remove().exec(callback);
}

exports.UpdateAllNodeThreshold = function (threshold, callback) {
	node_data_db.update({}, {
		threshold: threshold
	}, {
		multi: true
	}).exec(callback);
}

exports.UpdateNodeThreshold = function (node_id, threshold, callback) {
	node_data_db.update({
		node_id: node_id
	}, {
		threshold: threshold
	}).exec(callback);
}

exports.ChangeNodeId = function (old_node_id, new_node_id, callback) {
  node_data_db.update({
    node_id: old_node_id
  }, {
    node_id: new_node_id
  }).exec(callback);
}
