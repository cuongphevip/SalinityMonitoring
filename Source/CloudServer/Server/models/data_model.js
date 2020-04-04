var mongoose = require('../database/db_connection').mongoose;
var async = require("async");
var Schema = mongoose.Schema;
var data_schema = new Schema({
		node_id: String,
		salinity: Number,
		date: Date
	}, {
		collection: 'SalinityData',
		versionKey: false
	});

var salinity_db = mongoose.model('SalinityData', data_schema);

exports.getAllData = function (callback) {
	salinity_db.find({}, callback);
}

exports.findById = function (_id, callback) {
	salinity_db.findById(_id, callback);
}

exports.InsertNewData = function (node_id, salinity, date, callback) {
	var data = {
		"node_id": node_id,
		"salinity": salinity,
		"date": date
	};
	salinity_db.create(data, function (err) {
		if (err) {
			console.log(err);
			return callback(false);
		}
		return callback(true);
	});
}

exports.GetDataByDate = function (node_id, from_date, to_date, callback) {
	salinity_db.aggregate().
	match({
		node_id: node_id,
		date: {
			$gte: from_date,
			$lt: to_date
		}
	}).
	group({
		_id: {
			day: {
				$dayOfMonth: "$date",
			},
			month: {
				$month: "$date",
			},
			year: {
				$year: "$date",
			}
		},
		max: {
			$max: '$salinity'
		},
		min: {
			$min: '$salinity'
		},
		average: {
			$avg: '$salinity'
		}
	}).
	sort({
		"_id.year": 1,
		"_id.month": 1,
		"_id.day": 1
	}).
	exec(function (err, result) {
		if (err) {
			console.log(err);
			return callback(err, null);
		}
		return callback(null, result);
	});
}

exports.GetDataByHour = function (node_id, from_date, to_date, callback) {
	salinity_db.aggregate().
	match({
		node_id: node_id,
		date: {
			$gte: from_date,
			$lt: to_date
		}
	}).
	group({
		_id: {
			hour: {
				$hour: "$date",
			}
		},
		max: {
			$max: '$salinity'
		},
		min: {
			$min: '$salinity'
		},
		average: {
			$avg: '$salinity'
		}
	}).
	sort({
		"_id.hour": 1
	}).
	exec(function (err, result) {
		if (err) {
			console.log(err);
			return callback(err, null);
		}
		return callback(null, result);
	});
}

exports.GetDataBySalinity = function (node_id, from_date, to_date, callback) {

	// var _id = {};
	// var i,
	// currentCond;

	// _id["$cond"] = [{}, {}, {}
	// ];
	// currentCond = _id["$cond"];
	// for (i = 0; i < 95; i = i + 5) {
	// currentCond[0]["$gte"] = ["$Salinity", i];
	// currentCond[0]["$lt"] = ["$Salinity", i + 5];
	// currentCond[1] = "" + i + "-" + (i + 5);
	// if (i == 90)
	// currentCond[2] = "95-100";
	// else
	// currentCond[2]["$cond"] = [{}, {}, {}
	// ];
	// currentCond = currentCond[2]["$cond"];
	// }
	// var str = JSON.stringify(_id);
	//console.log(str);

	var parallelModel = {};

	parallelModel["0-2.5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 0,
				$lt: 2.5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["2.5-5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 2.5,
				$lt: 5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["5-7.5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 5,
				$lt: 7.5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["7.5-10"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 7.5,
				$lt: 10
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["10-12.5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 10,
				$lt: 12.5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["12.5-15"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 12.5,
				$lt: 15
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["15-17.5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 15,
				$lt: 17.5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["17.5-20"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 17.5,
				$lt: 20
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["20-22.5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 20,
				$lt: 22.5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["22.5-25"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 22.5,
				$lt: 25
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["25-27.5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 25,
				$lt: 27.5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["27.5-30"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 27.5,
				$lt: 30
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["30-32.5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 30,
				$lt: 32.5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["32.5-35"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 32.5,
				$lt: 35
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["35-37.5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 35,
				$lt: 37.5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["37.5-40"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 37.5,
				$lt: 40
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["40-42.5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 40,
				$lt: 42.5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["42.5-45"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 42.5,
				$lt: 45
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["45-47.5"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 45,
				$lt: 47.5
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	parallelModel["47.5-50"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 47.5,
				$lte: 50
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}
  
  parallelModel["0-50"] = function (cb) {
		salinity_db.aggregate().
		match({
			node_id: node_id,
			date: {
				$gte: from_date,
				$lt: to_date
			},
			salinity: {
				$gte: 0,
				$lte: 50
			}
		}).
		group({
			_id: null,
			count: {
				"$sum": 1
			},
		}).
		exec(cb);
	}

	async.parallel(
		parallelModel, function (err, result) {
		if (err) {
			console.log(err);
			return callback(true, null);
		}
		return callback(null, result);
	});
}
