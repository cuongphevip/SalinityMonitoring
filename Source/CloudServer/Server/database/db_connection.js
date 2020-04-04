const mongoose = require('mongoose');

let uri = 'mongodb://<user>:<password>@<domain>.mlab.com:<port>/<databasename>';

// var options = {
// "server": {
// "socketOptions": {
// "keepAlive": 300000,
// "connectTimeoutMS": 30000
// }
// },
// "replset": {
// "socketOptions": {
// "keepAlive": 300000,
// "connectTimeoutMS": 30000
// }
// }
// }

exports.initConnection = function initConnection(callback) {
	mongoose.connect(uri);
	var db = mongoose.connection;
	db.on('error', function (err) {
		console.log('Failed to connect to database');
		process.exit(1);
	});

	db.on('disconnected', function () {});

	db.once('open', function () {
		console.log("Connected to database");
		callback();
	});
};

exports.mongoose = mongoose;
