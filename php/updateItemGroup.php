<?php
/*
File: updateItemGroup.php
Purpose: changes the group the item is associated with
POST parameters: userID - the user's id (Integer)
                 itemID - the id of the item to change (Integer)
                 newGroupID - the ID of the group to associate the item with
Description: changes the group of the item
Return value: 1 for success of -1 for failure
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $userID = $_POST['userID'];
  $itemID = $_POST['itemID'];
  $newGroupID = $_POST['newGroupID'];

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("UPDATE $itemsTable SET groupID = (?) WHERE userID = (?) && itemID = (?);");
    $stmt->bind_param('iii', $newGroupID, $userID, $itemID);
    $success = $stmt->execute();

    if($success){
      echo(1);
    }else{
      echo -1;
    }

    $tasktrackerDB->close();
?>
