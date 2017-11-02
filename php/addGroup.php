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
$token    = $_POST['trelloToken'];
$groupName = $_POST['groupName'];
$groupID = $_POST['groupID'];
$position = $_POST['position'];

include_once("checkToken.php");
if(! $tokenIsValid){
  echo(-1);
  exit();
}

$stmt = $tasktrackerDB->prepare("SELECT groupID FROM $groupsTable WHERE groupID = (?) && userID = (?)");
$stmt->bind_param('ss', $groupID, $userID);
$success = $stmt->execute();
$result = $stmt->bind_result($col1);
$rowFetchStatus = $stmt->fetch();
if($rowFetchStatus){
  $stmt = $tasktrackerDB->prepare("UPDATE $groupsTable SET userID = (?), groupName = (?), position = (?) WHERE groupID = (?);");
  $stmt->bind_param('isii', $userID, $groupName, $position, $groupID);
  $success = $stmt->execute();
  $tasktrackerDB->close();
  exit($groupID);
}
else{
  /* Add the user to the db */
  $stmt = "";
  if($groupID == -2){
    $stmt = $tasktrackerDB->prepare("INSERT INTO $groupsTable (groupID, userID, groupName, position) VALUES (?,?,?,?)");
    $stmt->bind_param('iisi', $groupID, $userID, $groupName, $position);
  }else{
    $stmt = $tasktrackerDB->prepare("INSERT INTO $groupsTable (userID, groupName, position) VALUES (?,?,?)");
    $stmt->bind_param('isi', $userID, $groupName, $position);
  }

  $success = $stmt->execute();
  if($success == 1){
    echo($tasktrackerDB->insert_id);
  }else{
    echo(-1);
  }
  $tasktrackerDB->close();
}
?>
