// Require library
var excel = require('excel4node');

exports.TestExcel = function (node_id, date_result, hour_result, salinity_result, callback) {
	// Create a new instance of a Workbook class
	//console.log(date_result);
	//console.log(hour_result);
	//console.log(salinity_result);
	var i;
	var workbook = new excel.Workbook({
			defaultFont: {
				size: 12,
				name: 'Calibri',
				color: '00000000'
			}
		});

	// Add Worksheets to the workbook
	var by_day_sheet = workbook.addWorksheet('By_Day');
	var by_hour_sheet = workbook.addWorksheet('By_Hour');
	var by_salinity_sheet = workbook.addWorksheet('By_Salinity');

	// Set value of cell A2 to 'string' styled with paramaters of style
	by_day_sheet.cell(1, 1).string('DATE');
	by_day_sheet.column(1).setWidth(15);
	by_day_sheet.cell(1, 2).string('MAX SALINITY (ppt)');
	by_day_sheet.column(2).setWidth(20);
	by_day_sheet.cell(1, 3).string('MIN SALINITY (ppt)');
	by_day_sheet.column(3).setWidth(20);
	by_day_sheet.cell(1, 4).string('AVERAGE SALINITY (ppt)');
	by_day_sheet.column(4).setWidth(20);

	by_hour_sheet.cell(1, 1).string('HOUR');
	by_hour_sheet.column(1).setWidth(7);
	by_hour_sheet.cell(1, 2).string('MAX SALINITY (ppt)');
	by_hour_sheet.column(2).setWidth(20);
	by_hour_sheet.cell(1, 3).string('MIN SALINITY (ppt)');
	by_hour_sheet.column(3).setWidth(20);
	by_hour_sheet.cell(1, 4).string('AVERAGE SALINITY (ppt)');
	by_hour_sheet.column(4).setWidth(20);

	by_salinity_sheet.cell(1, 1).string('SALINITY (ppt)');
	by_salinity_sheet.column(1).setWidth(15);
	by_salinity_sheet.cell(1, 2).string('PERCENT (%)');
	by_salinity_sheet.column(1).setWidth(15);

	for (i = 0; i < 24; i++) {
		by_hour_sheet.cell(i + 2, 1).string("" + Math.floor(i / 10) + (i % 10) + " - " + Math.floor((i + 1) / 10) + ((i + 1) % 10));
	}

	for (i = 0; i < 50; i += 2.5) {
		by_salinity_sheet.cell(i / 2.5 + 2, 1).string("" + i + "-" + (i + 2.5));
		if (salinity_result["" + i + "-" + (i + 2.5)][0])
			by_salinity_sheet.cell(i / 2.5 + 2, 2).number(salinity_result["" + i + "-" + (i + 2.5)][0].count / salinity_result["0-50"][0].count * 100);
		else
			by_salinity_sheet.cell(i / 2.5 + 2, 2).number(0);
	}

	i = 2;
	date_result.forEach(function (data) {
		by_day_sheet.cell(i, 1).string("" + data._id.day + "-" + data._id.month + "-" + data._id.year);
		by_day_sheet.cell(i, 2).number(data.max);
		by_day_sheet.cell(i, 3).number(data.min);
		by_day_sheet.cell(i, 4).number(data.average);
		i++;
	});

	hour_result.forEach(function (data) {
		by_hour_sheet.cell(data._id.hour + 2, 2).number(data.max);
		by_hour_sheet.cell(data._id.hour + 2, 3).number(data.min);
		by_hour_sheet.cell(data._id.hour + 2, 4).number(data.average);
	});

	workbook.write('data_export/DATA_Node_' + node_id + '.xlsx', function (err, stats) {
		if (err) {
			console.error(err);
			return callback(err, stats);
		}
		return callback(null, stats);
	});
}
