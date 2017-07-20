<?php
/*
File: addUser.php
Purpose: add a new user
POST parameters: username - the new user's username (String)
Description: adds the user to the db
Return value: the user's ID in the database or -1 if fail
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $username = $_POST['username'];

  /*TODO: Check that the given username is not already in the users table */

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("INSERT INTO $usersTable (username) VALUES (?)");
    $stmt->bind_param('s', $username);
    $success = $stmt->execute();
    if($success == 1){
      echo($tasktrackerDB->insert_id);
    }else{
      echo(-1);
    }
    $tasktrackerDB->close();
?>
