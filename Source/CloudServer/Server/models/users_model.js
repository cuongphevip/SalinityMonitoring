var mongoose = require('../database/db_connection').mongoose;
var Schema = mongoose.Schema;
var users_schema = new Schema({
		username: String,
		pass: String,
		role: String,
		fullname: String,
		email: String,
		phone: String,
		usernumber: Number
	}, {
		collection: 'Users',
		versionKey: false
	});

var users_db = mongoose.model('Users', users_schema);

exports.getAllUser = function (callback) {
	users_db.find({}, callback);
}

exports.getAllUserSortedByUsernumber = function (callback) {
	users_db.find({}).sort({
		'usernumber': 1
	}).exec(callback);
}

exports.findById = function (_id, callback) {
	users_db.findById(_id, callback);
}

exports.findByUsername = function (username, callback) {
	users_db.find({
		'username': username
	}, callback);
}

exports.UpdateProfileUser = function (old_user, new_user, callback) {
	users_db.findOneAndUpdate({
		"_id": old_user._id
	}, new_user, callback);
}

exports.ValidateUsernameAndEmail = function (user, callback) {
	users_db.find({
		'username': user.username
	}, function (err_0, res_0) {
		if (err_0)
			return callback(err_0, null);
		if (res_0.length > 0) {
			if (res_0.length > 1 || !user._id)
				return callback(err_0, "username");
			if (user._id.toString() != res_0[0]._id.toString())
				return callback(err_0, "username");
		}
		users_db.find({
			'email': user.email
		}, function (err_1, res_1) {
			if (err_1)
				return callback(err_1, null);
			if (res_1.length > 0) {
				if (res_1.length > 1 || !user._id)
					return callback(err_1, "email");
				if (user._id.toString() != res_1[0]._id.toString())
					return callback(err_1, "email");
			}
			return callback(err_1, true);
		})
	})
}

exports.GetMaxUsernumber = function (callback) {
	users_db.find({}).sort({
		'usernumber': -1
	}).limit(1).exec(function (err, user) {
		if (user.length == 0)
			return callback(err, 0);
		if (!err)
			return callback(err, user[0].usernumber);
		else
			return callback(err, null);
	})
}

exports.InsertNewUser = function (new_user, callback) {
	users_db.create(new_user, function (err) {
		if (err)
			console.log(err);
		return callback(err);
	});
}

exports.deleteUserByID = function (_id, callback) {
	users_db.find({
		"_id": _id
	}).remove().exec(callback);
}

exports.updateRoleByUserID = function (_id, role, callback) {
	users_db.findOneAndUpdate({
		"_id": _id
	}, {
		"role": role
	}, callback);
}
