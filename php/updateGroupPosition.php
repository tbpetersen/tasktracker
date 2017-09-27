<?php
/*
File: updateGroupName.php
Purpose: changes the name of a group
POST parameters: userID - the user's id (String)
                 groupID - the id of the group to change (Integer)
                 newPosition - the new position to be saved in the DB
Description: changes the position of the group
Return value: 1 for success of -1 for failure
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $userID = $_POST['userID'];
  $groupID = $_POST['groupID'];
  $newPosition = $_POST['newPosition'];

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("UPDATE $groupsTable SET position = (?) WHERE userID = (?) && groupID = (?);");
    $stmt->bind_param('sii', $newPosition, $userID, $groupID);
    $success = $stmt->execute();

    if($success){
      echo(1);
    }else{
      echo -1;
    }

    $tasktrackerDB->close();
?>
