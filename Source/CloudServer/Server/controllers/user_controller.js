var users_model = require('../models/users_model.js');
var deleted_user_numbers_model = require('../models/deleted_user_numbers_model.js');
var sha256 = require('sha256');

exports.UpdateProfileUser = function (req, res) {
	req.body["_id"] = req.user._id;
	users_model.ValidateUsernameAndEmail(req.body, function (err, result) {
		if (err)
			return res.send(false);
		//console.log(result);
		if (result == "username" || result == "email") {
			return res.send(result);
		}
		if (req.body.pass)
			req.body["pass"] = sha256(req.body["pass"]);
		users_model.UpdateProfileUser(req.user, req.body, function (err, result) {
			if (err)
				res.send(false);
			else
				res.send(result);
		});
	});
}

exports.RegisterAnUser = function (req, res) {
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
					req.body["role"] = "waitting",
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
						req.body["role"] = "waitting",
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
