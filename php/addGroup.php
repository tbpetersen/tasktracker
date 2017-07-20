<?php
/*
File: addGroup.php
Purpose: add a new group
POST parameters: userID - the ID of the owner of this new group (int)
                 groupName - the name of the new group (String)
Description: adds a new group to the db
Return value: the group's ID in the database or -1 if fail
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $userID    = $_POST['userID'];
  $groupName = $_POST['groupName'];

  /*TODO: Check that the given userID is a valid user (it exists in users)*/

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("INSERT INTO $groupsTable (userID, groupName) VALUES (?,?)");
    $stmt->bind_param('is', $userID, $groupName);
    $success = $stmt->execute();
    if($success == 1){
      echo($tasktrackerDB->insert_id);
    }else{
      echo(-1);
    }
    $tasktrackerDB->close();
?>
