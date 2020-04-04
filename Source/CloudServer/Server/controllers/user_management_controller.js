var users_model = require('../models/users_model.js');
var deleted_user_numbers_model = require('../models/deleted_user_numbers_model.js');
var sha256 = require('sha256');

exports.getUserManagementPage = function (req, res, next) {
	users_model.getAllUserSortedByUsernumber(function (err, result) {
		if (err)
			return next('err');
		res.render('user_management', {
			all_user: result,
			user: req.user
		});
	});
};

exports.DeleteUser = function (req, res, next) {
	users_model.deleteUserByID(req.body._id, function (err_0) {
		if (err_0)
			return res.send(false);
		deleted_user_numbers_model.insertDeletedUsernumber(req.body.usernumber, function (err_1) {
			if (err_1)
				return res.send(false);
			res.send(true);
		});
	});
};

exports.AddAnUser = function (req, res) {
	users_model.ValidateUsernameAndEmail(req.body, function (err, result) {
		if (err)
			return res.send(false);
		if (result == "username" || result == "email")
			return res.send(result);
		deleted_user_numbers_model.count(function (count) {
			if (count) {
				deleted_user_numbers_model.cutFirstUsernumber(function (err, usernumber) {
					if (err)
						return res.send(false);
					req.body["role"] = "user",
					req.body["usernumber"] = usernumber;
					req.body["pass"] = sha256(req.body["pass"]);
					users_model.InsertNewUser(req.body, function (err) {
						if (err)
							return res.send(false);
						res.send(true);
					});
				});
			} else {
				users_model.GetMaxUsernumber(function (err, usernumber) {
					if (!err) {
						req.body["role"] = "user",
						req.body["usernumber"] = usernumber + 1;
						req.body["pass"] = sha256(req.body["pass"]);
						users_model.InsertNewUser(req.body, function (err) {
							if (err)
								return res.send(false);
							res.send(true);
						});
					} else
						res.send(false);
				});
			}
		});
	})
}

exports.UpdateRoleUser = function (req, res, next) {
	users_model.updateRoleByUserID(req.body._id, req.body.role, function (err) {
		if (err)
			return res.send(false);
		return res.send(true);
	});
};
