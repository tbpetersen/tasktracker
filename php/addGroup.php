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
$groupID = $_POST['groupID'];
$position = $_POST['position'];

//TODO Work on when there are multiple groups with the same name.
$stmt = $tasktrackerDB->prepare("SELECT * FROM $groupsTable WHERE groupName = (?) && userID = (?)");
$stmt->bind_param('ss', $groupName, $userID);
$success = $stmt->execute();
$result = $stmt->get_result();
if($groupID > -1){
  //TODO Modify table
  $stmt = $tasktrackerDB->prepare("UPDATE $itemsTable SET userID = (?), groupName = (?), position = (?) WHERE groupID = (?);");
  $stmt->bind_param('isii', $userID, $groupName, $position, $groupID);
  $success = $stmt->execute();
  $tasktrackerDB->close();
  exit($groupID);
}
else{
  /* Add the user to the db */
  $stmt = $tasktrackerDB->prepare("INSERT INTO $groupsTable (userID, groupName, position) VALUES (?,?,?)");
  $stmt->bind_param('isi', $userID, $groupName, $position);
  $success = $stmt->execute();
  if($success == 1){
    echo($tasktrackerDB->insert_id);
  }else{
    echo(-1);
  }
  $tasktrackerDB->close();
}
?>
