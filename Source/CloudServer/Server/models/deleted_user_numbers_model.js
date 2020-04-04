var mongoose = require('../database/db_connection').mongoose;
var Schema = mongoose.Schema;
var users_schema = new Schema({
		usernumber: Number
	}, {
		collection: 'DeletedUserNumbers',
		versionKey: false
	});

var deleted_user_numbers_db = mongoose.model('DeletedUserNumbers', users_schema);

exports.count = function (callback) {
	deleted_user_numbers_db.count({}, function (err, count) {
		if (!err) {
			return callback(count);
		}
	});
}

exports.insertDeletedUsernumber = function (deleted_number, callback) {
	var data = {
		usernumber: deleted_number
	};
	deleted_user_numbers_db.create(data, function (err) {
		if (err)
			console.log(err);
		return callback(err);
	});
}

exports.cutFirstUsernumber = function (callback) {
	deleted_user_numbers_db.findOneAndRemove({}, function (err, result) {
		return callback(err, result.usernumber);
	});
}