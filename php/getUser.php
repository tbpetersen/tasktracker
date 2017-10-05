<?php
/*
File: getUser.php
Purpose: gets a user
POST parameters: username - the user's username (String)
Description: gets the user from the db
Return value: the user's ID in the database or -1 if fail
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $username = $_POST['username'];

  /*TODO: Check that the given username is not already in the users table */

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("SELECT username FROM $usersTable WHERE username = (?) LIMIT 1;");
    $stmt->bind_param('s', $username);
    $success = $stmt->execute();
    $result = $stmt->bind_result($col1);
    if(! $result){
      echo(null);
    }else{
      $rowFetchStatus = $stmt->fetch();
      if($rowFetchStatus == null || ! $rowFetchStatus){
        echo(null);
      }else{
        echo($col1);
      }
    }

    $tasktrackerDB->close();
?>
