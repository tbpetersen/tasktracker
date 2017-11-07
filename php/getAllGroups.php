<?php
/*
File: getAllGroups.php
Purpose: gets an items in a group
POST parameters: groupID - the ID of the group (Integer)
Description: gets the items' ids from the db
Return value: a JSON string array of ids (empty if there are no items in the group)
*/
  /* Connect to the server */
  include_once("connectToDB.php");
  include_once("checkToken.php");

  /* POST arguments */
  $userID = $_POST['userID'];

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("SELECT groupID, userID, groupName, position FROM $groupsTable WHERE userID = (?);");
    $stmt->bind_param('i', $userID);
    $success = $stmt->execute();
    $results = $stmt->bind_result($groupID, $userID, $groupName, $position);

    $array = array();
    while($stmt->fetch() != null){
      $tmp = array();
      $tmp["groupID"] = $groupID;
      $tmp["userID"] = $userID;
      $tmp["groupName"] = $groupName;
      $tmp["position"] = $position;
      array_push($array, $tmp);
    }

    header('Content-Type: application/json');
    echo(json_encode($array));

    $tasktrackerDB->close();
?>
