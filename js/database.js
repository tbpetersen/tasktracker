const PHP_DIRECTORY_PATH = './php';

// Token operations
const PHP_CHECK_TOKEN = PHP_DIRECTORY_PATH + '/checkToken.php';

// User operations
const PHP_ADD_USER = PHP_DIRECTORY_PATH + '/addUser.php';
const PHP_GET_USER = PHP_DIRECTORY_PATH + '/getUser.php';
const PHP_GET_USER_ID = PHP_DIRECTORY_PATH + '/getUserID.php';

const PHP_GET_THEME = PHP_DIRECTORY_PATH + '/getTheme.php';
const PHP_ADD_GROUP = PHP_DIRECTORY_PATH + '/addGroup.php';
const PHP_GET_GROUP = PHP_DIRECTORY_PATH + '/getGroup.php';
const PHP_GET_GROUP_NAME = PHP_DIRECTORY_PATH + '/getGroupName.php';
const PHP_GET_GROUPS_FOR_USER = PHP_DIRECTORY_PATH + "/getAllGroups.php";
const PHP_UPDATE_GROUP_NAME = PHP_DIRECTORY_PATH + '/updateGroupName.php';
const PHP_UPDATE_GROUP_POSITION = PHP_DIRECTORY_PATH + '/updateGroupPosition.php';
const PHP_UPDATE_THEME = PHP_DIRECTORY_PATH + '/updateTheme.php';

// Item operations
const PHP_ADD_ITEM = PHP_DIRECTORY_PATH + '/addItem.php';
const PHP_GET_ITEM = PHP_DIRECTORY_PATH + '/getItem.php';
const PHP_GET_ITEMS_IN_GROUP = PHP_DIRECTORY_PATH + '/getAllItemsInGroup.php'
const PHP_UPDATE_ITEM_POSITION = PHP_DIRECTORY_PATH + '/updateItemPosition.php';
const PHP_UPDATE_ITEM_GROUP = PHP_DIRECTORY_PATH + '/updateItemGroup.php';

const PHP_GENERIC_DELETE = PHP_DIRECTORY_PATH + '/genericDelete.php';

const USERS_TABLE  = "users";
const GROUPS_TABLE = "user_groups";
const ITEMS_TABLE  = "group_items";

const UNSORTED_TABLE_ID = -2;

const AUTH_ERROR = "Authorization Error";

//TODO Reject when status code is 401
//return Promise.reject(AUTH_ERROR);


function getDBID(table, user, group) {
  return checkUserGroupDB(user, group)
}

function getUserID(user) {
  let params = getBasePOSTParameters();
  params.username = user;
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_USER_ID, params, function(data) {
      resolve(data);
    });
  })
}

function addDataToDB(){
  return new Promise(function(resolve, reject){
    var userName = user.trello.email;
    addUserToDB(userName)
    .then(function(newlyInsertedUserID){
      if(newlyInsertedUserID == -1){
        reject('Failed to add user to database');
        return;
      }
      return getUserID(userName);
    })
    .then(function(id){
      user.databaseID = id;
      //Add Groups to the DB
      var tables = user.tables;
      let groupPromises = new Array();
      for(let i in user.tables){
        /* tag-unsort
        if(tables[i].id !== UNSORTED_TABLE_ID) */
          groupPromises.push(addUserGroupToDB(id, user.trello.token, tables[i]));
      }
      return Promise.all(groupPromises)
      .then(function(){
        return Promise.resolve(id);
      });
    })
    .then(function(userID){
      let itemPromises = new Array();
      let tables = user.tables;
      for(let i in tables){
        for(let j in tables[i].rows){
          let item = tables[i].rows[j];
          item.position = j;
          itemPromises.push(addGroupItemToDB(userID,item, tables[i].id));
        }
      }
        Promise.all(itemPromises).then(function(){
          resolve();
        })
        .catch(function(err){
          console.log("Error: " + err);
          if(err === AUTH_ERROR)
            reject(AUTH_ERROR);
          reject(err);
        });
    })
    .catch(function(err) {
      console.log("Error: " + err);
      reject(err);
    });
  });
}

function addUserToDB(user) {
  let params = getBasePOSTParameters();
  params.username = user;

  //IF THIS COMES OUT TO TRUE, RUN THE REST OF THE PROGRAM. IF NOT, RETURN
  return checkUserDB(user)
    .then(function(promise) {
      //If the user doesn't exist, add them
      if (!promise) {
        return new Promise(function(resolve, reject) {
          $.post(PHP_ADD_USER, params, function(data) {
            if (data === -1) {
              reject(data);
            }
            resolve(data);
          });
        })
      } else {
        return Promise.resolve();
      }
    })
    .catch(function(err) {
      console.log("Error: " + err);
      return Promise.reject();
    });
}

function checkUserDB(user) {
  let params = getBasePOSTParameters();
  params.username = user;

  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_USER, params, function(data) {
      resolve(data);
    });
  });
}

function addUserGroupToDB(userID, trelloToken, table) {
  let params = getBasePOSTParameters();
  params.userID = userID;
  params.groupName = table.name;
  params.groupID = table.id;
  params.position = table.position;

  return checkUserGroupDB(userID, table.name)
  .then(function(promise) {
    //If the group doesn't exist, add it
    if (!promise) {
      return new Promise(function(resolve, reject) {
        $.post(PHP_ADD_GROUP, params, function(data){
          if (data == -1){
            reject(data);
          }

          if(table.id != -2){
            table.id = data;
          }
          resolve(data);
        });
      })
    }else{
      return Promise.resolve();
    }
  });

}

function checkUserGroupDB(user, group) {
  let params = getBasePOSTParameters();
  params.userID = user;
  params.groupName = group;

  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_GROUP, params, function(data) {
      resolve(data != -1);
    });
  });
}

function addGroupItemToDB(userID, item, groupID) {
  let params = getBasePOSTParameters();
  params.itemID = item.id;
  params.userID = userID;
  params.groupID = groupID;
  params.itemType = item.type;
  params.position = item.position;

  return checkGroupItemDB(item, userID, groupID)
  .then(function(itemObj) {
    if(itemObj == null){
      return new Promise(function(resolve, reject) {
        $.post(PHP_ADD_ITEM, params, function(data) {
          if (data === -1)
            reject(data);
          resolve(data);
        });
      })
    }else{
      return updateItemGroup(userID, item.id, groupID)
      .then(function(){
        return updateItemPosition(userID, item);
      });
    }
  });
}

function checkGroupItemDB(item, userID, groupID) {
  var ID = item.id;
  if (item.group == undefined)
    item.group = "Ungrouped";
  var type = item.type;
  var groupTable = user.getTableByID(groupID);
    return getItem(userID, ID, groupID);
}

function getItem(userID, itemID, groupID) {
  let params = getBasePOSTParameters();
  params.itemID = itemID;
  params.groupID = groupID;

  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_ITEM, params, function(data) {
      if (data == "") {
        resolve(null);
      } else {
        resolve(data);
      }
    });
  });
}

function getTheme(userID){
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_THEME, {
      userID: userID
    }, function(data) {
      resolve(data == 1);
    });
  });
}

function updateTheme(userID, isNight){
  return new Promise(function(resolve, reject) {
    $.post(PHP_UPDATE_THEME, {
      userID: userID,
      isNight: isNight
    }, function(data) {
      resolve(data == 1);
    });
  });
}

function updateGroupName(userID, tableObj){
  let params = getBasePOSTParameters();
  params.groupID = tableObj.id;
  params.newName = tableObj.name;

  return new Promise(function(resolve, reject) {
    $.post(PHP_UPDATE_GROUP_NAME, params, function(data) {
      resolve(data == 1);
    });
  });
}

function updateGroupPosition(userID, tableObj){
  let params = getBasePOSTParameters();
  params.groupID = tableObj.id;
  params.newPosition = tableObj.position;

  return new Promise(function(resolve, reject) {
    $.post(PHP_UPDATE_GROUP_POSITION, params, function(data) {
      resolve(data == 1);
    });
  });
}

function updateItemPosition(userID, item) {
  let params = getBasePOSTParameters();
  params.itemID = item.id;
  params.newPosition = item.position;
  return new Promise(function(resolve, reject) {
    $.post(PHP_UPDATE_ITEM_POSITION, params, function(data) {
      resolve(data == 1);
    });
  });
}

function updateAllItemsInGroup(userDBID, group){
  let groupID = group.id.slice(6);
  let html = $("#" + group.id)[0].children[1].getElementsByTagName("tr");
  let tableObj;
  for(let i in user.tables){
    if(user.tables[i].id == groupID){
      tableObj = user.tables[i];
      break;
    }
  }

  for(let i in tableObj.rows){ //Reorder table object
    if(html[i].id !== tableObj.rows[i].id){

      let tempRow = tableObj.rows[i];

      for(let j in tableObj.rows){ //Update the positions
        if(tableObj.rows[j].id === html[i].id){
          tableObj.rows[i] = tableObj.rows[j];
          tableObj.rows[j] = tempRow;
        }
      }
    }
  }

  for(let i in tableObj.rows){ //Assign new positions.
    if(tableObj.rows[i].position !== i)
      tableObj.rows[i].position = i;

    var promiseArray = [];
    promiseArray.push(updateItemPosition(user.databaseID, tableObj.rows[i]));
  }

  return Promise.all(promiseArray);
}




function getHTMLTableFromItemID(itemID){
  let rows = document.getElementsByTagName("TR");
  for(let j = 0; j < rows.length; j++){
    if(rows[j].id == itemID)
      return rows[j].parentNode;
  }
}

/* Name: removeDuplicates
   Purpose: Removes the duplicate indexes in an array.
   Parameters: Array - array.
   Return: The array with only unique indeces.
*/
function removeDuplicates(array){
  let uniqueArray = [];
  for(i in array){
    if(!uniqueArray.includes(array[i]))
      uniqueArray.push(array[i]);
  }
  return uniqueArray;
}

function updateItemGroup(userID, itemID, newGroupID) {
  let params = getBasePOSTParameters();
  params.itemID = itemID;
  params.newGroupID = newGroupID;

  return new Promise(function(resolve, reject) {
    $.post(PHP_UPDATE_ITEM_GROUP, params , function(data) {
      resolve(data == 1);
    });
  });
}

function getAllItemsInGroup(userID, groupID) {
  let params = getBasePOSTParameters();
  params.groupID = groupID;

  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_ITEMS_IN_GROUP, params, function(data) {
      resolve(data);
    });
  });
}

function getTableFromID(tableID){
  for(let i in user.tables){
    if(user.tables[i].id == tableID)
      return user.tables[i]
    }
}

function getTableFromHTML(htmlTable){
  htmlTableItems = htmlTable.getElementsByTagName("tr");
  if(htmlTableItems <= 1)
    return;
  return getUserTableFromItemID(htmlTableItems[1].id);
}

/* Name: getItemPosition
   Purpose: Get the position of a single item.
   Parameters: userID - The ID of the user that the task is associated with.
               item - The item to find the position of.
   Return: The position of the item.
*/
function getItemPosition(userID, item) {
  var tables = document.getElementsByTagName("table");
  for (let i = 0; i < tables.length; i++) {
    var tableRows = tables[i].getElementsByTagName("tr");
    //Indexes of the table rows
    for (let j = 1; j < tableRows.length; j++) {
      if (tableRows[j].id == item.id) {
        return j - 1;
      }
    }
  }
}

function getAllGroups(userID) {
  let params = getBasePOSTParameters();

  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_GROUPS_FOR_USER, params, function(data) {
      resolve(data);
    });
  });
}

function getGroupName(user, groupID) {
  let params = getBasePOSTParameters();
  params.groupID = groupID;

  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_GROUP_NAME, params, function(data) {
      resolve(data);
    });
  });
}

function deleteItem(userID, itemID) {
  return genericDelete(ITEMS_TABLE, userID, itemID)
  .catch(function(err){
    console.log(err);
    handleAuthError();
    return Promise.resolve();
  });
}

function deleteItemsFromUserGroup(userID, tableObj) {
  let promises = new Array();
  for(let i = 0; i < tableObj.rows.length; i++){
    promises.push(deleteItem(userID, tableObj.rows[i].id));
  }
  return Promise.all(promises);
}

function deleteUserGroup(userID, tableObj) {
  return genericDelete(GROUPS_TABLE, userID, tableObj.id);
}

function genericDelete(databaseTableName, userID, columnValue){
  let params = getBasePOSTParameters();
  params.tableName = databaseTableName;
  params.columnValue = columnValue;

  return $.post(PHP_GENERIC_DELETE, params);
}

function checkToken(userID, trelloToken) {
  let params = getBasePOSTParameters();

  return new Promise(function(resolve, reject) {
    $.post(PHP_CHECK_TOKEN, params,
      function(data) {
        console.log(data);
        resolve();
      });
  });
}

function getBasePOSTParameters(){
  return {userID: user.databaseID, trelloToken: user.trello.token};
}
