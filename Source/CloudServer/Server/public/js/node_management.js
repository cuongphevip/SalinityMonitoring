var map;
$(document).ready(function () {
	$.ajax({
		type: "GET",
		url: "/node_management/get_node/" + $("#node_select").find(":selected").text(),
		success: function (res) {
			if (!res) {
				$(".preloader").hide();
				return alert("Something went wrong");
			}
			map = new GMaps({
					div: '#map',
					lat: res.y,
					lng: res.x,
          zoom: 17
				});
			map.addMarker({
				lat: res.y,
				lng: res.x,
				title: 'Node ID: ' + res.node_id,
				infoWindow: {
					content: '<p>' + res.information + '</p>'
				}
			});
			(map.markers[0].infoWindow).open(map.map, map.markers[0]);
			$(".preloader").hide();
		},
		error: function () {
			alert("Maps can not operate");
		}
	});

});

$("#node_select").change(function () {
	$.ajax({
		type: "GET",
		url: "/node_management/get_node/" + $("#node_select").find(":selected").text(),
		success: function (res) {
			if (!res) {
				$(".preloader").hide();
				return alert("Something went wrong");
			}
			$('#node_information').val(res.information);
			$('#node_information').attr("placeholder", res.information);
			$('#node_lat').val(res.y);
			$('#node_lat').attr("placeholder", res.y);
			$('#node_long').val(res.x);
			$('#node_long').attr("placeholder", res.x);
			$('#threshold').val(res.threshold);
			$('#threshold').attr("placeholder", res.threshold);
			$('#start_date').html(new Date(res.start_date));
      map = new GMaps({
					div: '#map',
					lat: res.y,
					lng: res.x
				});
			map.addMarker({
				lat: res.y,
				lng: res.x,
				title: 'Node ID: ' + res.node_id,
				infoWindow: {
					content: '<p>' + res.information + '</p>'
				}
			});
			(map.markers[0].infoWindow).open(map.map, map.markers[0]);
			$(".preloader").hide();
		},
		error: function () {
			alert("Something went wrong");
			window.location.href = "/node_management";
		}
	});
});

function UpdateNode() {
	var data = {};

	if (!$('#node_information').val() || $('#node_information').val().length < 6)
		return alert("Node's information is too short!");
	else
		data["information"] = $('#node_information').val();

	if (!$('#node_lat').val())
		return alert("It doesn't seem like a latitude!");
	else {
		var lat = parseFloat($('#node_lat').val());
		if (!isNaN(lat) && lat <= 90 && lat >= -90)
			data["y"] = $('#node_lat').val();
		else
			return alert("It doesn't seem like a latitude!");
	}

	if (!$('#node_long').val())
		return alert("It doesn't seem like a longitude!");
	else {
		var lon = parseFloat($('#node_long').val());
		if (!isNaN(lon) && lon <= 180 && lon >= -180)
			data["x"] = $('#node_long').val();
		else
			return alert("It doesn't seem like a longitude!");
	}

	if (!$('#threshold').val())
		return alert("It doesn't seem like a threshold!");
	else {
		var threshold = parseFloat($('#threshold').val());
		if (!isNaN(threshold) && threshold <= 50 && threshold >= 0)
			data["threshold"] = $('#threshold').val();
		else
			return alert("It doesn't seem like a threshold!");
	}

	data["node_id"] = $("#node_select").find(":selected").text(),

	$.ajax({
		type: "POST",
		url: "/node_management/update_node",
		data: data,
		success: function (res) {
			if (!res) {
				return alert("Something went wrong");
			}
			$(".preloader").hide();
		},
		error: function () {
			alert("Something went wrong");
			window.location.href = "/node_management";
		}
	});
}

function AddNode() {
	var data = {};

	if (!$('#node_information').val() || $('#node_information').val().length < 6)
		return alert("Node's information is too short!");
	else
		data["information"] = $('#node_information').val();

	if (!$('#node_lat').val())
		return alert("It doesn't seem like a latitude!");
	else {
		var lat = parseFloat($('#node_lat').val());
		if (!isNaN(lat) && lat <= 90 && lat >= -90)
			data["y"] = $('#node_lat').val();
		else
			return alert("It doesn't seem like a latitude!");
	}

	if (!$('#node_long').val())
		return alert("It doesn't seem like a longitude!");
	else {
		var lon = parseFloat($('#node_long').val());
		if (!isNaN(lon) && lon <= 180 && lon >= -180)
			data["x"] = $('#node_long').val();
		else
			return alert("It doesn't seem like a longitude!");
	}

	if (!$('#threshold').val())
		return alert("It doesn't seem like a threshold!");
	else {
		var threshold = parseFloat($('#threshold').val());
		if (!isNaN(threshold) && threshold <= 50 && threshold >= 0)
			data["threshold"] = $('#threshold').val();
		else
			return alert("It doesn't seem like a threshold!");
	}

	$.ajax({
		type: "POST",
		url: "/node_management/add_node",
		data: data,
		success: function (res) {
			if (!res) {
				$(".preloader").hide();
				return alert("Something went wrong");
			}
			alert("Node ID: " + res + " has been added!");
			window.location.href = "/node_management";
		},
		error: function () {
			alert("Something went wrong");
			window.location.href = "/node_management";
		}
	});
}

function DeleteNode() {
	var data = {
		node_id: $("#node_select").find(":selected").text()
	}
	$.ajax({
		type: "POST",
		url: "/node_management/delete_node",
		data: data,
		success: function (res) {
			if (!res) {
				$(".preloader").hide();
				return alert("Something went wrong");
			}
			alert("Node ID: " + data.node_id + " has been deleted!");
			window.location.href = "/node_management";
		},
		error: function () {
			alert("Something went wrong");
			window.location.href = "/node_management";
		}
	});
}
