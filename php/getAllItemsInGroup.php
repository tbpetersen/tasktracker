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

  /* POST arguments */
  $groupID = $_POST['groupID'];
  $userID = $_POST['userID'];

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("SELECT * FROM $itemsTable WHERE groupID = (?) && userID = (?);");
    $stmt->bind_param('ii', $groupID, $userID);
    $success = $stmt->execute();
    $results = $stmt->get_result();

    $row = null;
    $array = array();
    while(($row = $results->fetch_assoc()) != null){
      array_push($array, $row);
    }

    echo(json_encode($array));

    $tasktrackerDB->close();
?>
