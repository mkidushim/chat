<!DOCTYPE html>
<html>
  <head>
    <title>chat Webapp</title>
    <!-- BEGIN META -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- BEGIN STYLESHEETS -->
   
    <link rel="stylesheet" type="text/css" href="client/css/style.css" />
    <script src="node_modules/socket.io-client/dist/socket.io.js"></script>
    <script type="text/javascript" src="config.js"></script>
    <script type="text/javascript" src="jscript.js"></script>
    <script type="text/javascript" src="https://mike.fusionofideas.com/oasis/assets/js/libs/jquery/jquery-1.11.2.min.js"></script>
    <!-- END STYLESHEETS -->
  </head>
  <body class="menubar-hoverable header-fixed">
    <div id="base">
      <div>
        <ul id="chatlist">
        </ul>
      </div>
      <div>
        <ul id="messages">
        </ul>
      </div>
      <div>
        <textarea id="msg"></textarea>
        <button id="sendMessage">Send</button>
      </div>
    </div>

<script type="text/javascript">
  // var socket = io.connect('https://mike.fusionofideas.com:4000');
  // session_user = "<?php echo $_SESSION['fast_track']['user']; ?>";
  session_userID = '2';
  // session_admin = "<?php echo $_SESSION['fast_track']['admin']; ?>";
  // session_token = "<?php echo $_SESSION['fast_track']['token']; ?>";
  session_hospital_id = '2';
  const hid = '2';
  socket = io.connect( 'https://mike.fusionofideas.com:4000',{ query: 'userId='+session_userID });
  var chatlist = [];
  var messages = [];





  //params for getting chat list
  const params= {hid:session_hospital_id,uid:session_userID};
  //send emit to server for all chat patients
  socket.emit('chat-list',params , function (params) {
  });
  //display chat list response 
  socket.on('chat-list-response', function (response) {
    if (!response.error) {
      if (response.in_transit) {
        //disconnect user
        chatlist = chatlist.filter(function (obj) {
            return obj.socketid !== response.socketId;
        });
        //disconnect user html



        console.log(response);
      } else {
        // populate chat list
        chatlist = response.chatList;
        // populate chat list html
        var html = '';
        if(chatlist.length> 0){
          for(var i = 0; i< chatlist.length; i++){
            var patient = chatlist[i];
            html += '<li class="tile chat-list-patient" patient_id="'+patient.id+'" appt_id="'+patient.appt_id+'">'
              +'<a class="tile-content">'
                +'<div class="tile-icon">'
                  +'<img src="'+patient.img+'">'
                +'</div>'
                +'<div class="tile-text" style="font-size:14px;">'
                  +patient.username
                +'</div>'
              +'</a>'
            +'</li>';
          }
          $('#chatlist').html(html);
        }
        //select patient to chat with
        $('.chat-list-patient').on('click', function() {
          var patient_id =this.getAttribute('patient_id');
          var appt_id = this.getAttribute('appt_id');
          $('.chat-list-patient').removeClass('active');
          $(this).addClass('active');
          var p = {id:patient_id,appt_id:appt_id};
          selectPatient(p);
        });
      }
    } else {
      alert(`Faild to load Chat list`);
    }
  });
  //
  socket.on('test-php', function(response){
    if (!response.error) {
      if (response.connected == true) {
          // Adding new online user into chat list
          chatlist.push(response.user);
          //add user to html

          $('.chat-list-patient[appt_id='+response.user.appt_id+']').remove();
          console.log(chatlist);
      } else {
          // removing online user from chat list
          chatlist = chatlist.filter(function (obj) {
              return obj.id !== response.user.id;
          });
          // remove user from html


          var html = '<li class="tile chat-list-patient" patient_id="'+response.user.id+'" appt_id="'+response.user.appt_id+'">'
            +'<a class="tile-content">'
              +'<div class="tile-icon">'
                +'<img src="'+response.user.id.img+'">'
              +'</div>'
              +'<div class="tile-text" style="font-size:14px;">'
                +response.user.id.username
              +'</div>'
            +'</a>'
          +'</li>';

          $('#chatlist').append(html);
          console.log(chatlist);
      }
    } else {
        alert(`Faild to load Chat list`);
    }
  });
  //function for getting messages
  function getMessages(form) {
    return Promise.resolve($.ajax({
      type: "POST",
      url: baseURL+"get_messages.php",
      contentType: false,
      cache: false,
      processData: false,
      data: form
    }));
  }
  //function for loading messages
  function loadMessages(patient_id,appt_id) {
    var form = new FormData();
    form.append('user', 'mike');
    form.append('token', '3d73e24d314e7441f92855126ab93cd0');
    form.append('patient_id',patient_id);
    form.append('appt_id',appt_id);
    var promise = getMessages(form);
    
    promise.then(function(data) {
      if (data.status == 'NO') {
        btn.button('error');
        setTimeout(function() {
          btn.hide();
        }, 300);
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
        var dc = data.content;
        console.log(dc);
        //populate message list
        var html = '';
        for(var i = 0; i< dc.length; i++){
          html += '<li class="message-item">'+dc[i].message+'</li>';
        }
        $('#messages').html(html);
      }
    });
  }
  //select patient to chat with(add to click handler)
  function selectPatient(patient){
    /*
    * Highlighting the selected user from the chat list
    */
    //split in two functions row click to direct you to new chat/patient page
    const friendId = patient.id;
    const apptId = patient.appt_id;
    const friendData = chatlist.filter((obj) => {
        return obj.id === friendId;
    });
    /**
    * This HTTP call will fetch chat between two users
    */
    //get chat messages between user and patient
    loadMessages(friendId,apptId);
  }
  function updateStatus() {
    
  }
  //send message from portal to app
  function sendMessage() {
    /* Fetching the selected User from the chat list starts */
    let patient_id = +$('.active.chat-list-patient').attr('patient_id');
    let selectedApptId = +$('.active.chat-list-patient').attr('appt_id');
    let content = $('#msg').val();
    if (patient_id === null) {
        return null;
    }
    // patientData = chatlist.filter((obj) => {
    //     return obj.id === patient_id;
    // });
    /* Fetching the selected User from the chat list ends */
    console.log(patientData);
    /* Emmiting socket event to server with Message, starts */
    if (patientData.length > 0) {
        let messagePacket = {
          message: content,
          fromUserId: session_userID,
          toUserId: patient_id,
          apptId: selectedApptId
        };
        messages.push(messagePacket);
        $('#messages').append('<li>'+content+'</li>');
        socket.emit(`add-message`, messagePacket);
        setTimeout(function() {
          $('#msg').val('');
        }, 200);
    }else {
        alert('Unexpected Error Occured,Please contact Admin');
    }
    /* Emmiting socket event to server with Message, ends */
  }
  //send message click handler
  $(document).keypress('#sendMessage', function(e) {
     if (e.which == 13) {
      sendMessage()
     }
  });
  //Message response from app
  socket.on('add-message-response', function(response){
    //add message 
    let patient_id = +$('.active.chat-list-patient').attr('patient_id');
    if (response && response.toUserId == patient_id) {
        messages.push(response);
    }
    //add message html

    $('#messages').append('<li>'+response.message+'</li>');

    console.log(messages);
  });
</script>
  </body>
</html>