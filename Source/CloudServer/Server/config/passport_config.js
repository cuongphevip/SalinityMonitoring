var passport = require('passport');
var strategy = require('passport-local').Strategy;
var users_model = require('../models/users_model.js');
var sha256 = require('sha256');

passport.use(
	new strategy(
		function (username, password, callback) {
		users_model.findByUsername(username, function (err, user) {
			if (err) {
				console.log("return error");
				return callback(err);
			}
			if (user.length == 0) {
				console.log("return NoUser");
				return callback(null, false);
			}
			if (user[0].pass != sha256(password)) {
				console.log("return Wrongpass");
				return callback(null, false);
			}
			//console.log("SUCCEED QUERRY!!!");
			return callback(null, user[0]);
		});
	}));

passport.serializeUser(function (user, callback) {
	callback(null, user._id);
});

passport.deserializeUser(function (_id, callback) {
	users_model.findById(_id, function (err, user) {
		//console.log("DESERIALIZE");
		if (err) {
			return callback(err);
		}
		callback(null, user);
	});
});

module.exports = passport;
