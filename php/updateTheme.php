<?php
/*
File: updateTheme.php
Purpose: changes the theme
POST parameters: userID - the user's id (String)
                 isNight - whether the night theme is activated (Boolean)
Description: changes the theme
Return value: 1 for success of -1 for failure
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $userID = $_POST['userID'];
  $isNight = $_POST['isNight'];

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("UPDATE $usersTable SET isNight = (?) WHERE userID = (?)");
    $stmt->bind_param('ii', $isNight, $userID);
    $success = $stmt->execute();

    if($success){
      echo(1);
    }else{
      echo -1;
    }

    $tasktrackerDB->close();
?>
