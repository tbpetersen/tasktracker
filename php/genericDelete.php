<?php
/*
File: genericDelete.php
Purpose: gets an item
POST parameters: userID - the ID of the user
                 column - the column to check for columnValue
                 columnValue - the value that must be met to delete
Description: delete rows
Return value: 1 on success or -1 on failure
*/

  /* Connect to the server */
  include_once("connectToDB.php");

  /* POST arguments */
  $tableName = $_POST['tableName'];
  $userID = $_POST['userID'];
  $columnValue = $_POST['columnValue'];

  /* Add the user to the db */
    if($tableName == $groupsTable){
      $stmt = $tasktrackerDB->prepare("DELETE FROM $groupsTable WHERE userID = (?) && groupID = (?)");
      $stmt->bind_param('ii', $userID, $columnValue);
      $success = $stmt->execute();
    }else if($tableName == $itemsTable){
      $stmt = $tasktrackerDB->prepare("DELETE FROM $itemsTable WHERE userID = (?) && itemID = (?)");
      $stmt->bind_param('is', $userID, $columnValue);
      $success = $stmt->execute();
    }else{
      $success = false;
    }
    if($success == 1){
      echo(1);
    }else{
      echo(-1);
    }


    $tasktrackerDB->close();
?>
