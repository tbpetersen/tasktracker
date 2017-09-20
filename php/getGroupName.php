<?php
/*
File: getGroupName.php
Purpose: gets a group's name
POST parameters: userID - the user's userID (int)
                 groupID - the ID of a group
Description: gets the group's name from the user
Return value: the user's ID in the database or -1 if fail
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $userID = $_POST['userID'];
  $groupID = $_POST['groupID'];

  /*TODO: Check that the given userID is not already in the users table */

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("SELECT * FROM $groupsTable WHERE userID = (?) && groupID = (?) LIMIT 1;");
    $stmt->bind_param('ii', $userID, $groupID);
    $success = $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    echo($row['groupName']);
    $tasktrackerDB->close();
?>
