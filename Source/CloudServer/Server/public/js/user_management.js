function validateEmail(email) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

function validatePhone(phone) {
	var re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
	return re.test(phone);
}

function DeleteUser(user_id, user_number) {
	$.ajax({
		type: "POST",
		url: "/user_management/delete_user",
		data: {
			_id: user_id,
			usernumber: user_number
		},
		success: function (res) {
			if (!res)
				alert("Something went wrong!");
			window.location.href = "/user_management";
		},
		error: function () {
			alert("Something went wrong!");
			window.location.href = "/user_management";
		}
	});
}

function UpdateRoleUser(user_id) {
  var role_id = '#' + user_id + '_select';
  var role = $(role_id).find(":selected").text();
  $.ajax({
		type: "POST",
		url: "/user_management/update_role_user",
		data: {
			_id: user_id,
			role: role.toLowerCase()
		},
		success: function (res) {
			if (!res)
				alert("Something went wrong!");
			window.location.href = "/user_management";
		},
		error: function () {
			alert("Something went wrong!");
			window.location.href = "/user_management";
		}
	});
}

function AddAnUser() {
	/* var data = {
	username: "cuongphevip",
	pass: "76quangngai",
	fullname: "Võ Hùng Cường",
	email: "cuongphevip@gmail.com",
	phone: "01673490258",
	}; */
	var data = {};

	if ($('#username').val()) {
		if ($('#username').val().length < 6) {
			alert('Username is too short!');
			return;
		} else
			data["username"] = $('#username').val();
	} else {
		alert("Username is empty");
		return;
	}

	if ($('#password').val()) {
		if ($('#password').val().length < 6) {
			alert('Password is too short!');
			return;
		} else if ($('#password').val() != $('#repassword').val()) {
			alert('Retyped password is not correct!');
			return;
		} else
			data["pass"] = $('#password').val();
	} else {
		alert("Password is empty");
		return;
	}

	if ($('#fullname').val()) {
		if ($('#fullname').val().length < 10) {
			alert('fullname is too short!');
			return;
		} else
			data["fullname"] = $('#fullname').val();
	} else {
		alert("Full name is empty");
		return;
	}

	if ($('#email').val()) {
		if (!validateEmail($('#email').val())) {
			alert("It doesn't seem like an email!");
			return;
		} else
			data["email"] = $('#email').val();
	}

	if ($('#phone').val()) {
		if (!validatePhone($('#phone').val())) {
			alert("It doesn't seem like an phone number!");
			return;
		} else
			data["phone"] = $('#phone').val();
	}

	$.ajax({
		type: "POST",
		url: "/user_management/add_an_user",
		data: data,
		success: function (res) {
			if (res == "username")
				alert("Username has been registered");
			else if (res == "email")
				alert("Email has been registered");
			else if (res) {
				alert("User has been added");
				window.location.href = "/user_management";
			} else {
				alert("Something went wrong!");
				window.location.href = "/user_management";
			}
			$(".preloader").hide();
		},
		error: function () {
			//$('#login-error').html('Your username or password is incorrect');
			alert("FAIL!!!");
			window.location.href = "/user_management";
		}
	});
}
