<?php
/*
File: getAllItemsInGroup.php
Purpose: gets an items in a group
POST parameters: groupID - the ID of the group (Integer)
Description: gets the items' ids from the db
Return value: a JSON string array of ids (empty if there are no items in the group)
*/
  /* Connect to the server */
  include_once("connectToDB.php");
  include_once("checkToken.php");

  /* POST arguments */
  $groupID = $_POST['groupID'];
  $userID = $_POST['userID'];


    $stmt = $tasktrackerDB->prepare("SELECT itemID, userID, groupID, itemType, position FROM $itemsTable WHERE groupID = (?) && userID = (?);");
    $stmt->bind_param('ii', $groupID, $userID);
    $success = $stmt->execute();
    $results = $stmt->bind_result($itemID, $userID, $groupID, $itemType, $position);

    $array = array();
    while($stmt->fetch() != null){
      $tmp = array();
      $tmp["itemID"] = $itemID;
      $tmp["userID"] = $userID;
      $tmp["groupID"] = $groupID;
      $tmp["itemType"] = $itemType;
      $tmp["position"] = $position;
      array_push($array, $tmp);
    }

    header('Content-Type: application/json');
    echo(json_encode($array));
    $tasktrackerDB->close();
?>
