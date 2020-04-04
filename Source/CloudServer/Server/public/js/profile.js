function Login() {
	var data = {
		username: $('#username').val(),
		password: $('#password').val()
	};
	if (!data.username) {
		alert('Please fill your username!');
	} //$('#login-error').html('Please fill your username');
	else if (!data.password) {
		alert('Please fill your password!');
	} //$('#login-error').html('Please fill your password');
	else if (data.password.length < 6) {
		alert('Password must more then 5 characters!')
	} else {
		$.ajax({
			type: "POST",
			url: "/users/login",
			data: data,
			success: function (res) {
				if (!res) {
					$(".preloader").hide();
					return alert("Your user name or password is not correct!");
				}
				if (res == "waitting") {
					$(".preloader").hide();
					return alert("You must be waitting for approvement from admin!!!");
				}
				window.location.href = "/profile";
			},
			error: function () {
				//$('#login-error').html('Your username or password is incorrect');
				alert("FAIL!!!");
				$(".preloader").hide();
			}
		});
	}
}

function validateEmail(email) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

function validatePhone(phone) {
	var re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
	return re.test(phone);
}

function UpdateProfileUser() {
	var data = {};

	if ($('#username').val()) {
		if ($('#username').val().length < 6) {
			alert('Username is too short!');
			return;
		} else
			data["username"] = $('#username').val();
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
	}

	if ($('#fullname').val()) {
		if ($('#fullname').val().length < 10) {
			alert('fullname is too short!');
			return;
		} else
			data["fullname"] = $('#fullname').val();
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
		url: "/users/update_profile_user",
		data: data,
		success: function (res) {
			if (res == "username")
				alert("Your username has been registered");
			else if (res == "email")
				alert("Your email has been registered");
			else if (res)
				window.location.href = "/profile";
			$(".preloader").hide();
		},
		error: function () {
			//$('#login-error').html('Your username or password is incorrect');
			alert("FAIL!!!");
			$(".preloader").hide();
		}
	});
}

function RegisterAnUser() {
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
		url: "/users/sign_up",
		data: data,
		success: function (res) {
			if (res == "username")
				alert("Your username has been registered");
			else if (res == "email")
				alert("Your email has been registered");
			else if (res)
				alert("Your account has been registered, however you need to wait for approvement from admin");
			$(".preloader").hide();
		},
		error: function () {
			//$('#login-error').html('Your username or password is incorrect');
			alert("FAIL!!!");
			$(".preloader").hide();
		}
	});
}
