<?php
/*
File: updateGroupName.php
Purpose: changes the name of a group
POST parameters: userID - the user's id (String)
                 groupID - the id of the group to change (Integer)
                 newName - the name that should be put in the DB
Description: changes the name of the group
Return value: 1 for success of -1 for failure
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $userID = $_POST['userID'];
  $groupID = $_POST['groupID'];
  $newName = $_POST['newName'];

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("UPDATE $groupsTable SET groupName = (?) WHERE userID = (?) && groupID = (?);");
    $stmt->bind_param('sii', $newName, $userID, $groupID);
    $success = $stmt->execute();

    if($success){
      echo(1);
    }else{
      echo -1;
    }

    $tasktrackerDB->close();
?>
