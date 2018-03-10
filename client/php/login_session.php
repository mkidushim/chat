<?php
  header ('Content-Type: application/json');
  session_start();

  $response = array();
  $response['status'] = 'NO';

  if (!isset($_REQUEST['user']) || !isset($_REQUEST['token'])) {
    $response['content'] = "Username or token not sent.";
    echo json_encode($response);
    exit;
  }
  if (!isset($_REQUEST['admin'])) {
    $response['content'] = 'No admin is set.';
    echo json_encode($response);
    exit;
  }

  $response['status'] = 'OK';
  $_SESSION['fast_track']['userID'] = $_REQUEST['userID'];
  $_SESSION['fast_track']['user'] = $_REQUEST['user'];
  $_SESSION['fast_track']['hospital_id'] = $_REQUEST['hospital_id'];
  $_SESSION['fast_track']['token'] = $_REQUEST['token'];
  $_SESSION['fast_track']['admin'] = $_REQUEST['admin'];
  $_SESSION['fast_track']['name'] = $_REQUEST['name'];
  $_SESSION['fast_track']['hospital_id'] = $_REQUEST['hospital_id'];

  $response['content'] = array(
    'redirect_url' => $_SESSION['fast_track']['redirect_url']
  );
  echo json_encode($response);
  exit;
?>