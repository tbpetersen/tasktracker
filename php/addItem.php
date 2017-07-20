<?php
/*
File: addItem.php
Purpose: add a new item
POST parameters: itemID - the ID of the item that is to be created (String)
                 userID - the id of the user that owns the group associated with groupID (int)
                 groupID - the id of the group that this item should be in (int)
                 itemType - 0 if Trello, 1 if Zendesk (int)
                 position - the position in the group (int)
Description: adds a new item to the db
Return value: the item's ID in the database or -1 if fail
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $itemID   = $_POST['itemID'];
  $userID   = $_POST['userID'];
  $groupID  = $_POST['groupID'];
  $itemType = $_POST['itemType'];
  $position = $_POST['position'];


  /*TODO: Check that the given userID is a valid user and group ID is valid*/

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("INSERT INTO $itemsTable (itemID, userID, groupID, itemType, position) VALUES (?,?,?,?,?)");
    $stmt->bind_param('siiii', $itemID, $userID, $groupID, $itemType, $position);
    $success = $stmt->execute();
    if($success == 1){
      echo($itemID);
    }else{
      echo(-1);
    }
    $tasktrackerDB->close();
?>
