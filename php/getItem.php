<?php
/*
File: getItem.php
Purpose: gets an item
POST parameters: itemID - the ID of the item that is to be created (String)
                 userID - the id of the user that owns the group associated with groupID (int)
                 groupID - the id of the group that this item should be in (int)
                 itemType - 0 if Trello, 1 if Zendesk (int)
                 position - the position in the group (int)
Description: gets the user from the db
Return value: the user's ID in the database or -1 if fail
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* GET arguments */
  $itemID   = $_POST['itemID'];
  $userID   = $_POST['userID'];
  // $groupID  = $_POST['groupID'];
  // $itemType = $_POST['itemType'];
  // $position = $_POST['position'];


  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("SELECT * FROM $itemsTable WHERE itemID = (?) && userID = (?) LIMIT 1;");
  $stmt->bind_param(/*'siiii'*/'si', $itemID, $userID/*, $groupID, $itemType, $position*/);
    $success = $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    echo($row['itemID']);
    $tasktrackerDB->close();
?>
