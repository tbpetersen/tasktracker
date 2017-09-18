<?php
/*
File: getGroupID.php
Purpose: gets a GroupID
POST parameters: username - the user's username (String)
Description: gets the user from the db
Return value: the user's ID in the database or -1 if fail
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* GET arguments */
  $username = $_POST['userID'];
  $groupname = $_POST['groupName'];

  /*TODO: Check that the given username is not already in the users table */

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("SELECT * FROM $groupsTable WHERE userID = (?) && groupName = (?) LIMIT 1;");
    $stmt->bind_param('is', $username, $groupname);
    $success = $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
      echo($row['groupID']);
    $tasktrackerDB->close();
?>
