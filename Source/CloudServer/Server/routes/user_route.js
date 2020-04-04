var express = require('express');
var router = express.Router();
var passport_config = require('../config/passport_config');
var user_controller = require('../controllers/user_controller');

/* Ensure login for GET request */
router.get('*',
	require('connect-ensure-login').ensureLoggedIn('/profile'),
	function (req, res, next) {
	next('route');
})

router.get('/', function (req, res, next) {
	res.render('profile', {user: req.user});
});

/* POST login. */
/* router.post('/login',
passport_config.authenticate('local', {
successRedirect: '/',
failureFlash: true
}),
function (req, res) {
if (!req.user)
res.send(false);
else
res.send(true);
}); */

/* router.post('/login', function (req, res, next) {
passport.authenticate('local', function (err, user, info) {
if (err) {
return next(err);
}
if (!user) {
return res.redirect(false);
} else {
if (user.role != "waitting") {
req.logIn(user, function (err) {
if (err) {
return res.send(false);
}
return res.redirect('/profile');
};
} else
return res.send("waitting");
})(req, res, next);
}); */

router.post('/login', function (req, res, next) {
	passport_config.authenticate('local', function (err, user, info) {
		if (err) {
			return next(err);
		}

		if (!user) {
			return res.send(false);
		}

		if (user.role == "waitting") {
			return res.send("waitting");
		}

		req.logIn(user, function (err) {
			if (err) {
				return next(err);
			}
			return res.redirect('/profile');
		});
	})(req, res, next);
});

/* POST sign up. */
router.post('/sign_up', user_controller.RegisterAnUser);

/* Ensure login for POST request */
router.post('*',
	require('connect-ensure-login').ensureLoggedIn('/profile'),
	function (req, res, next) {
	next('route');
})

/* POST update profile of user. */
router.post('/update_profile_user',
	user_controller.UpdateProfileUser);

router.get('/signout',
	function (req, res) {
	req.logout();
	res.redirect('/profile');
});

module.exports = router;
