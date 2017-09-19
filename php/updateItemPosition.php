<?php
/*
File: updateItemPosition.php
Purpose: changes the name of a group
POST parameters: userID - the user's id (String)
                 itemID - the id of the item to change (Integer)
                 newPosition - the value for the new position
Description: changes the position of the item
Return value: 1 for success of -1 for failure
*/
  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $userID = $_POST['userID'];
  $itemID = $_POST['itemID'];
  $newPosition = $_POST['newPosition'];

  /* Add the user to the db */
    $stmt = $tasktrackerDB->prepare("UPDATE $itemsTable SET position = (?) WHERE userID = (?) && itemID = (?);");
    $stmt->bind_param('iis', $newPosition, $userID, $itemID);
    $success = $stmt->execute();
    if($success){
      echo(1);
    }else{
      echo -1;
    }

    $tasktrackerDB->close();
?>
