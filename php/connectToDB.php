<?php
/*
File: conntectToDB.php
Purpose: connect to the sql server
Description: connect to the sql server
*/

  $redirectPage = "Location: http://localhost";
  /* Tables */
  $usersTable  = "users";
  $groupsTable = "user_groups";
  $itemsTable  = "group_items";
  $tasktrackerDB = new mysqli( "localhost", "root", '',"tasktracker_db");
 ?>
