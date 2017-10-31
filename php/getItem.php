<?php
/*
File: getItem.php
Purpose: gets an item
POST parameters: itemID - the ID of the item that is to be created (String)
Description: gets the user from the db
Return value: a JSON string of the item or null
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $itemID = $_POST['itemID'];
  $userID = $_POST['userID'];
  $groupID = $_POST['groupID'];

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("SELECT itemID, userID, groupID, itemType, position FROM $itemsTable WHERE itemID = (?) && userID = (?) LIMIT 1;");
    $stmt->bind_param('si', $itemID, $userID);
    $success = $stmt->execute();
    $results = $stmt->bind_result($itemID, $userID, $groupID, $itemType, $position);
    $rowFetchStatus = $stmt->fetch();

    if($rowFetchStatus == null){
      echo("");
    }else{
      $row = array();
      $row["itemID"] = $itemID;
      $row["userID"] = $userID;
      $row["groupID"] = $groupID;
      $row["itemType"] = $itemType;
      $row["position"] = $position;
      header('Content-Type: application/json');
      echo(json_encode($row));
    }

    $tasktrackerDB->close();
?>
