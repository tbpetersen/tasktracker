<?php
/*
File: getGroup.php
Purpose: gets a group
POST parameters: userID - the user's userID (int)
                 groupName - the name of the users group (String)
Description: gets the user from the db
Return value: the user's ID in the database or -1 if fail
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $userID = $_POST['userID'];
  $groupName = $_POST['groupName'];

  /*TODO: Check that the given userID is not already in the users table */

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("SELECT * FROM $groupsTable WHERE userID = (?) && groupName = (?) LIMIT 1;");
    $stmt->bind_param('is', $userID, $groupName);
    $success = $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    echo($row['groupName']);
    $tasktrackerDB->close();
?>
