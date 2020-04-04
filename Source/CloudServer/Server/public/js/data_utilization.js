var config = {};

$("#from_date").datepicker({
	minDate: new Date("2018-05-19"),
	maxDate: '0',
	onSelect: function (dateText) {
		$("#to_date").datepicker("option", "minDate", new Date(dateText));
	}
});

$("#to_date").datepicker({
	maxDate: '0'
});

function setConfigDateChart(tilte) {
	config["chart_by_date"] = {
		type: 'line',
		data: {
			labels: [],
			datasets: [{
					backgroundColor: window.chartColors.blue,
					borderColor: window.chartColors.blue,
					data: [],
					fill: false,
					label: "Average",
					pointRadius: 7,
					pointHoverRadius: 13,
					pointStyle: "rectRounded",
				}, {
					backgroundColor: window.chartColors.red,
					borderColor: window.chartColors.red,
					data: [],
					fill: false,
					label: "Max",
					pointRadius: 7,
					pointHoverRadius: 13,
					pointStyle: "triangle"
				}, {
					backgroundColor: window.chartColors.green,
					borderColor: window.chartColors.green,
					data: [],
					fill: false,
					label: "Min",
					pointRadius: 7,
					pointHoverRadius: 13,
					pointStyle: "rectRot"
				}
			]
		},
		options: {
			responsive: true,
			title: {
				display: true,
				text: tilte
			},
			tooltips: {
				mode: 'index',
				intersect: false,
			},
			hover: {
				mode: 'point',
				intersect: true
			},
			scales: {
				xAxes: [{
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Day'
						}
					}
				],
				yAxes: [{
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'ppt'
						},
						ticks: {
							min: 0
						}
					}
				]
			},
			legend: {
				display: true,
				labels: {
					usePointStyle: true
				}
			}
		}
	};
}

function setConfigHourChart(tilte) {
	var labels = [];
	var datas = [[], [], []];
	var i,
	j;
	for (i = 0; i < 24; i++) {
		labels.push("" + Math.floor(i / 10) + (i % 10) + " - " + Math.floor((i + 1) / 10) + ((i + 1) % 10));
	}
	for (i = 0; i < 24; i++) {
		for (j = 0; j < 3; j++) {
			datas[j].push(0);
		}
	}
	config["chart_by_hour"] = {
		type: 'line',
		data: {
			labels: labels,
			datasets: [{
					backgroundColor: window.chartColors.blue,
					borderColor: window.chartColors.blue,
					data: datas[0],
					fill: false,
					label: "Average",
					pointRadius: 7,
					pointHoverRadius: 13,
					pointStyle: "rectRounded",
				}, {
					backgroundColor: window.chartColors.red,
					borderColor: window.chartColors.red,
					data: datas[1],
					fill: false,
					label: "Max",
					pointRadius: 7,
					pointHoverRadius: 13,
					pointStyle: "triangle"
				}, {
					backgroundColor: window.chartColors.green,
					borderColor: window.chartColors.green,
					data: datas[2],
					fill: false,
					label: "Min",
					pointRadius: 7,
					pointHoverRadius: 13,
					pointStyle: "rectRot"
				}
			]
		},
		options: {
			responsive: true,
			title: {
				display: true,
				text: tilte
			},
			tooltips: {
				mode: 'index',
				intersect: false,
			},
			hover: {
				mode: 'point',
				intersect: true
			},
			scales: {
				xAxes: [{
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Hour'
						}
					}
				],
				yAxes: [{
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'ppt'
						},
						ticks: {
							min: 0
						}
					}
				]
			},
			legend: {
				display: true,
				labels: {
					usePointStyle: true
				}
			}
		}
	};
}

function setConfigSalinityChart(tilte) {
	var labels = [];
	var i;
	for (i = 0; i < 50; i = i + 2.5) {
		labels.push("" + i + "-" + (i + 2.5));
	}
	config["chart_by_salinity"] = {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [{
					backgroundColor: window.chartColors.blue,
					borderColor: window.chartColors.blue,
					data: [],
					label: "Percentage",
					borderWidth: 1
				}
			]
		},
		options: {
			responsive: true,
			title: {
				display: true,
				text: tilte
			},
			tooltips: {
				mode: 'index',
				intersect: false,
			},
			hover: {
				mode: 'point',
				intersect: true
			},
			scales: {
				xAxes: [{
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Salinity'
						}
					}
				],
				yAxes: [{
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Percent'
						},
						ticks: {
							min: 0
						}
					}
				]
			},
			legend: {
				display: true
			}
		}
	};
}

function DrawChart() {
	if (!($("#from_date").datepicker("getDate")) || !($("#to_date").datepicker("getDate"))) {
		alert("Please consider FROM DATE and START DATE!");
		return;
	}
	var data = {
		node_id: $("#node_select").find(":selected").text(),
		from_date: $("#from_date").datepicker("getDate"),
		to_date: $("#to_date").datepicker("getDate")
	};
	switch ($("#action_select").find(":selected").text()) {
	case "By Day":
		DrawChartByDay(data);
		break;
	case "By Hour":
		DrawChartByHour(data);
		break;
	case "By Salinity":
		DrawChartBySalinity(data);
		break;
	default:
		alert("Something went wrong!");
	}
}

function DrawChartByDay(data) {
	$.ajax({
		type: "POST",
		url: "/data_utilization/get_data_by_date",
		data: data,
		success: function (res) {
			if (!res) {
				$(".preloader").hide();
				return alert("Something went wrong!");
			}
			var title = "Statistics of node: " + data.node_id + "'s salinity ";
			if (data.from_date.toString() != data.to_date.toString())
				title += "from " + $.datepicker.formatDate('dd/mm/yy', data.from_date) + " to " + $.datepicker.formatDate('dd/mm/yy', data.to_date);
			else
				title += "in " + $.datepicker.formatDate('dd/mm/yy', data.from_date);
			setConfigDateChart(title);
			if (window["drawing_chart"])
				window["drawing_chart"].destroy();
			var ctx = document.getElementById('main_chart').getContext('2d');
			window["drawing_chart"] = new Chart(ctx, config["chart_by_date"]);
			res.forEach(function (date_data) {
				var date = "";
				date += date_data._id.day + "/" + date_data._id.month + "/" + date_data._id.year;
				window["drawing_chart"].data.labels.push(date);
				window["drawing_chart"].data.datasets[0].data.push(date_data.average);
				window["drawing_chart"].data.datasets[1].data.push(date_data.max);
				window["drawing_chart"].data.datasets[2].data.push(date_data.min);
			});
			window["drawing_chart"].update();
			$(".preloader").hide();
		},
		error: function () {
			alert("Something went wrong!");
			window.location.href = "/data_utilization";
		}
	});
}

function DrawChartByHour(data) {
	$.ajax({
		type: "POST",
		url: "/data_utilization/get_data_by_hour",
		data: data,
		success: function (res) {
			if (!res) {
				$(".preloader").hide();
				return alert("Something went wrong!");
			}
			var title = "Statistics of node: " + data.node_id + "'s salinity ";
			if (data.from_date.toString() != data.to_date.toString())
				title += "from " + $.datepicker.formatDate('dd/mm/yy', data.from_date) + " to " + $.datepicker.formatDate('dd/mm/yy', data.to_date);
			else
				title += "in " + $.datepicker.formatDate('dd/mm/yy', data.from_date);
			setConfigHourChart(title);
			if (window["drawing_chart"])
				window["drawing_chart"].destroy();
			var ctx = document.getElementById('main_chart').getContext('2d');
			window["drawing_chart"] = new Chart(ctx, config["chart_by_hour"]);
			res.forEach(function (hour_data) {
				window["drawing_chart"].data.datasets[0].data[hour_data._id.hour] = hour_data.average;
				window["drawing_chart"].data.datasets[1].data[hour_data._id.hour] = hour_data.max;
				window["drawing_chart"].data.datasets[2].data[hour_data._id.hour] = hour_data.min;
			});
			window["drawing_chart"].update();
			$(".preloader").hide();
		},
		error: function () {
			alert("Something went wrong!");
			window.location.href = "/data_utilization";
		}
	});
}

function DrawChartBySalinity(data) {
	$.ajax({
		type: "POST",
		url: "/data_utilization/get_data_by_salinity",
		data: data,
		success: function (res) {
			if (!res) {
				$(".preloader").hide();
				return alert("Something went wrong!");
			}
			var title = "Statistics of node: " + data.node_id + "'s salinity ";
			if (data.from_date.toString() != data.to_date.toString())
				title += "from " + $.datepicker.formatDate('dd/mm/yy', data.from_date) + " to " + $.datepicker.formatDate('dd/mm/yy', data.to_date);
			else
				title += "in " + $.datepicker.formatDate('dd/mm/yy', data.from_date);
			setConfigSalinityChart(title);
			if (window["drawing_chart"])
				window["drawing_chart"].destroy();
			var ctx = document.getElementById('main_chart').getContext('2d');
			window["drawing_chart"] = new Chart(ctx, config["chart_by_salinity"]);
			var i;
			for (i = 0; i < 50; i += 2.5) {
        var percent = 0;
        if (res["" + i + "-" + (i + 2.5)][0])
          var percent = res["" + i + "-" + (i + 2.5)][0].count / res["0-50"][0].count * 100;
				window["drawing_chart"].data.datasets[0].data.push(percent);
			}
			window["drawing_chart"].update();
			$(".preloader").hide();
		},
		error: function () {
			alert("Something went wrong!");
			window.location.href = "/data_utilization";
		}
	});
}

function ExportData() {
	if (!($("#from_date").datepicker("getDate")) || !($("#to_date").datepicker("getDate"))) {
		alert("Please consider FROM DATE and START DATE!");
		return;
	}
	var data = {
		node_id: $("#node_select").find(":selected").text(),
		from_date: $("#from_date").datepicker("getDate"),
		to_date: $("#to_date").datepicker("getDate")
	};
	$.ajax({
		type: "POST",
		url: "/data_utilization/export_data",
		data: data,
		success: function (res, status, request) {
			if (!res) {
				$(".preloader").hide();
				return alert("Something went wrong!");
			}
			window.location.href = "/data_utilization/get_data_file/" + data.node_id;
			$(".preloader").hide();
			/* var disp = request.getResponseHeader('Content-Disposition');
			if (disp && disp.search('attachment') != -1) {
			var form = $('<form method="POST" action="' + '/data_utilization/export_data' + '">');
			$.each(params, function (k, v) {
			form.append($('<input type="hidden" name="' + k + '" value="' + v + '">'));
			});
			$('body').append(form);
			form.submit();
			} */
		},
		error: function () {
			alert("Something went wrong!");
			$(".preloader").hide();
			//window.location.href = "/data_utilization";
		}
	});
}
