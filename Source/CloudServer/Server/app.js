var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport_config = require('./config/passport_config.js');

var index_route = require('./routes/index_route');
var user_route = require('./routes/user_route');
var user_management_route = require('./routes/user_management_route');
var data_utilization_route = require('./routes/data_utilization_route');
var node_management_route = require('./routes/node_management_route');

var app = express();

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(require('express-session')({
		secret: 'keyboard cat',
		resave: false,
		saveUninitialized: false
	}));

app.use(passport_config.initialize());
app.use(passport_config.session());

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
		extended: false
	}));

app.use('/', index_route);
app.use('/users', user_route);
app.use('/user_management', user_management_route);
app.use('/data_utilization', data_utilization_route);
app.use('/node_management', node_management_route);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.send(false);
});

module.exports = app;
