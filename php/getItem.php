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
    $stmt = $tasktrackerDB->prepare("SELECT * FROM $itemsTable WHERE itemID = (?) && userID = (?) && groupID = (?) LIMIT 1;");
    $stmt->bind_param('sii', $itemID, $userID, $groupID);
    $success = $stmt->execute();
    $results = $stmt->get_result();

    $row = $results->fetch_assoc();
    echo(json_encode($row));

    $tasktrackerDB->close();
?>
