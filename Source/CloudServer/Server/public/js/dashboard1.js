function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

var all_nodes_data = {};

var config = {};

function setConfig(chart_name, tilte) {
	config[chart_name] = {
		type: 'line',
		data: {
			labels: ["", "", "", "", "", "", "", "", "", ""],
			datasets: [{
					backgroundColor: window.chartColors.blue,
					borderColor: window.chartColors.blue,
					data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					fill: false,
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
							labelString: 'Time'
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
				display: false
			}
		}
	};
}

window.onload = function () {
	$.ajax({
		type: "GET",
		url: "/get_all_nodes",
		success: function (all_nodes) {
			if (!all_nodes) {
				alert("Something went wrong!");
				window.location.href = "/profile";
			} else {
				all_nodes_data = all_nodes;
				all_nodes.forEach(function (node) {
					setConfig('chart_' + node.node_id, node.information);
					var ctx = document.getElementById('chart_' + node.node_id).getContext('2d');
					window["chart_" + node.node_id] = new Chart(ctx, config['chart_' + node.node_id]);
				});
				getFirstChart();
			}
			$(".preloader").hide();
		},
		error: function () {
			alert("Something went wrong!");
			window.location.href = "/profile";
		}
	});
}

function getFirstChart() {
	all_nodes_data.forEach(function (node) {
		$.ajax({
			type: "GET",
			url: "/get_latest_data/" + node.node_id,
			success: function (latest_data) {
				if (!latest_data) {
					alert("Something went wrong!");
					window.location.href = "/profile";
				} else {
					var i = 0;
					for (i = 0; i < 10; i++) {
						var date = new Date(latest_data[i].date.toString());
						var timeString = date.getUTCHours() + ":" + date.getUTCMinutes() + ":" + date.getUTCSeconds();
						window["chart_" + node.node_id].data.labels[i] = timeString;
						window["chart_" + node.node_id].data.datasets[0].data[i] = Number(latest_data[i].salinity);
					}
					window["chart_" + node.node_id].update({
						easing: 'linear'
					});

					if (Number(latest_data[9].salinity) < 1) {
						window["chart_" + node.node_id].data.datasets[0].backgroundColor = window.chartColors.blue;
						window["chart_" + node.node_id].data.datasets[0].borderColor = window.chartColors.blue;
					} else if (Number(latest_data[9].salinity) < 5) {
						window["chart_" + node.node_id].data.datasets[0].backgroundColor = window.chartColors.purple;
						window["chart_" + node.node_id].data.datasets[0].borderColor = window.chartColors.purple;
					} else if (Number(latest_data[9].salinity) < 15) {
						window["chart_" + node.node_id].data.datasets[0].backgroundColor = window.chartColors.yellow;
						window["chart_" + node.node_id].data.datasets[0].borderColor = window.chartColors.yellow;
					} else if (Number(latest_data[9].salinity) < 30) {
						window["chart_" + node.node_id].data.datasets[0].backgroundColor = window.chartColors.orange;
						window["chart_" + node.node_id].data.datasets[0].borderColor = window.chartColors.orange;
					} else {
						window["chart_" + node.node_id].data.datasets[0].backgroundColor = window.chartColors.red;
						window["chart_" + node.node_id].data.datasets[0].borderColor = window.chartColors.red;
					}
					window["chart_" + node.node_id].update();
				}
				$(".preloader").hide();
			},
			error: function () {
				alert("Something went wrong!");
				window.location.href = "/profile";
			}
		});
	});
}

function refreshChart(latest_data) {
	var node_id = latest_data[0].node_id;
	var i = 0;
	var number_of_new_data = 10;
	for (i = 0; i < 10; i++) {
		var date = new Date(latest_data[0].date.toString());
		var timeString = date.getUTCHours() + ":" + date.getUTCMinutes() + ":" + date.getUTCSeconds();
		if (window["chart_" + node_id].data.labels[i] == timeString) {
			number_of_new_data = i;
			break;
		}
	}

	for (i = 0; i < number_of_new_data; i++) {
		var date = new Date(latest_data[10 - number_of_new_data + i].date.toString());
		var timeString = date.getUTCHours() + ":" + date.getUTCMinutes() + ":" + date.getUTCSeconds();

		window["chart_" + node_id].data.labels.push(timeString);
		window["chart_" + node_id].data.datasets[0].data.push(Number(latest_data[10 - number_of_new_data + i].salinity));
		window["chart_" + node_id].update({
			easing: 'linear'
		});

		window["chart_" + node_id].data.labels.shift();
		window["chart_" + node_id].data.datasets[0].data.shift();
		window["chart_" + node_id].update({
			easing: 'linear'
		});
	}

	if (Number(latest_data[9].salinity) < 1) {
		window["chart_" + node_id].data.datasets[0].backgroundColor = window.chartColors.blue;
		window["chart_" + node_id].data.datasets[0].borderColor = window.chartColors.blue;
	} else if (Number(latest_data[9].salinity) < 5) {
		window["chart_" + node_id].data.datasets[0].backgroundColor = window.chartColors.purple;
		window["chart_" + node_id].data.datasets[0].borderColor = window.chartColors.purple;
	} else if (Number(latest_data[9].salinity) < 15) {
		window["chart_" + node_id].data.datasets[0].backgroundColor = window.chartColors.yellow;
		window["chart_" + node_id].data.datasets[0].borderColor = window.chartColors.yellow;
	} else if (Number(latest_data[9].salinity) < 30) {
		window["chart_" + node_id].data.datasets[0].backgroundColor = window.chartColors.orange;
		window["chart_" + node_id].data.datasets[0].borderColor = window.chartColors.orange;
	} else {
		window["chart_" + node_id].data.datasets[0].backgroundColor = window.chartColors.red;
		window["chart_" + node_id].data.datasets[0].borderColor = window.chartColors.red;
	}
	window["chart_" + node_id].update();
}

$(document).ready(function () {
	"use strict";
	var sparklineLogin = function () {
		$('#sparklinedash').sparkline([0, 5, 6, 10, 9, 12, 4, 9], {
			type: 'bar',
			height: '30',
			barWidth: '4',
			resize: true,
			barSpacing: '5',
			barColor: '#7ace4c'
		});
		$('#sparklinedash2').sparkline([0, 5, 6, 10, 9, 12, 4, 9], {
			type: 'bar',
			height: '30',
			barWidth: '4',
			resize: true,
			barSpacing: '5',
			barColor: '#7460ee'
		});
		$('#sparklinedash3').sparkline([0, 5, 6, 10, 9, 12, 4, 9], {
			type: 'bar',
			height: '30',
			barWidth: '4',
			resize: true,
			barSpacing: '5',
			barColor: '#11a0f8'
		});
		$('#sparklinedash4').sparkline([0, 5, 6, 10, 9, 12, 4, 9], {
			type: 'bar',
			height: '30',
			barWidth: '4',
			resize: true,
			barSpacing: '5',
			barColor: '#f33155'
		});
	}
	sparklineLogin();

	socket.on('NEW_DATA', function (latest_data) {
		refreshChart(latest_data);
	});
});
