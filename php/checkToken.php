<?php
/*
File: checkToken.php
Purpose: verify that a token is for a specified user
Return value: No return value. Sets $tokenIsValid to true or false

NOTE: userID and token are expected to be defined 
*/
/* Connect to the server */
include_once("connectToDB.php");

$trelloTokenEndpoint = "https://api.trello.com/1/tokens/";
$zelloKey = "8886ef1a1bc5ad08caad020068a3f9a2";


// The at sign is suppressing a warning about if this call fails.
// I handle the failure, so there is no need for the warning
@$tokenInfo = file_get_contents($trelloTokenEndpoint . $token ."/member?key=" . $zelloKey ."&token=" . $token);
$tokenIsValid = false;

if($tokenInfo){
  $tokenInfoAsObject = json_decode($tokenInfo);
  $email = $tokenInfoAsObject->email;

  $stmt2 = $tasktrackerDB->prepare("SELECT username FROM $usersTable WHERE userID = (?) LIMIT 1;");
  $stmt2->bind_param('s', $userID);
  $success2 = $stmt2->execute();
  $result2 = $stmt2->bind_result($col);

  if($result2){
    $rowFetchStatus2 = $stmt2->fetch();
    if($rowFetchStatus2){
      $usernameInDB = $col;
      $tokenIsValid = $email == $usernameInDB;
    }
  }

  $stmt2->close();

}

?>
