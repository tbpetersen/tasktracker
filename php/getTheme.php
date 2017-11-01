<?php
/*
File: getTheme.php
Purpose: gets the theme
POST parameters: userID - the user's userID (int)
Description: gets the theme from the db
Return value: the theme in the database or -1 if fail
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* GET arguments */
  $userID = $_POST['userID'];

  /*TODO: Check that the given username is not already in the users table */

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("SELECT isNight FROM $usersTable WHERE userID = (?) LIMIT 1;");
    $stmt->bind_param('i', $userID);
    $success = $stmt->execute();
    $result = $stmt->bind_result($col1);
    $row = $stmt->fetch();
    if($row == null){
      echo(-1);
    }else{
      echo($col1);
    }

    $tasktrackerDB->close();
?>
