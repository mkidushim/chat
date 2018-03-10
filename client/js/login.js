// login form logic
$(document).on('submit','#login-form',function(e) {
  e.preventDefault();
  var user = $('#username').val();
  var pass = $('#password').val();

  if (user.length == '' || pass.length == '') {
    errorMessage("Please fill out all fields.");
    return;
  }
  $.ajax({
    type: "POST",
    url: baseURL+"login.php",
    data: "user="+user+"&password="+pass,
    success: function(data) {
      if (data.status == 'NO') {
        if (data.content == 'invalid_session') {
          if (session_exp == false) {
            session_exp = true;
            checkSession();
          }
        } else {
          console.log(data.content);
          alert(data.content);
          return;
        }
      } else {        
        var token = data.content.token;
        // var is_admin = data.content.is_admin;
        var is_admin = data.content.admin;
        var uid = data.content.id;
        $.ajax({
          type: "POST",
          data: "user="+user+"&token="+token+"&admin="+is_admin+"&userID="+uid+"&name="+data.content.name+"&hospital_id="+data.content.hospital_id,
          url: "php/login_session.php", // portal file
          success: function(data) {
            if (data.status == "NO") {
              alert("Failed to set session.");
              return;
            } else {
              var redirectURL = data.content.redirect_url;
              if (redirectURL == undefined) {
                var redirectURL = 'index.php';
              }
              window.location.assign(redirectURL);
            }
          }
        });
      }
    }
  });
});