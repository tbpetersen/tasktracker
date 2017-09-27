const PHP_DIRECTORY_PATH = './php';

const PHP_ADD_USER = PHP_DIRECTORY_PATH + '/addUser.php';
const PHP_GET_USER = PHP_DIRECTORY_PATH + '/getUser.php';
const PHP_GET_USER_ID = PHP_DIRECTORY_PATH + '/getUserID.php';

const PHP_ADD_GROUP = PHP_DIRECTORY_PATH + '/addGroup.php';
const PHP_GET_GROUP = PHP_DIRECTORY_PATH + '/getGroup.php';
const PHP_GET_GROUP_NAME = PHP_DIRECTORY_PATH + '/getGroupName.php';
const PHP_GET_GROUP_ID = PHP_DIRECTORY_PATH + '/getGroupID.php';
const PHP_GET_GROUPS_FOR_USER = PHP_DIRECTORY_PATH + "/getAllGroups.php";
const PHP_UPDATE_GROUP_NAME = PHP_DIRECTORY_PATH + '/updateGroupName.php';

const PHP_ADD_ITEM = PHP_DIRECTORY_PATH + '/addItem.php';
const PHP_GET_ITEM = PHP_DIRECTORY_PATH + '/getItem.php';
const PHP_GET_ITEMS_IN_GROUP = PHP_DIRECTORY_PATH + '/getAllItemsInGroup.php'
const PHP_UPDATE_ITEM_POSITION = PHP_DIRECTORY_PATH + '/updateItemPosition.php';
const PHP_UPDATE_ITEM_GROUP = PHP_DIRECTORY_PATH + '/updateItemGroup.php';

const unsortedID = -2;

function getDBID(table, user, group) {
  return checkUserGroupDB(user, group)
}

function getUserID(user) {
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_USER_ID, {
      username: user
    }, function(data) {
      resolve(data);
    });
  })
}

function getGroupID(user, group) {
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_GROUP_ID, {
      userID: user,
      groupName: group
    }, function(data) {
      resolve(data);
    });
  })
}

function addDataToDB(){
  return new Promise(function(resolve, reject){
    var userName = user.trello.email;
    addUserToDB(userName)
    .then(function(promise){
      return getUserID(userName);
    })
    .then(function(id){
      //Add Groups to the DB
      var tables = user.tables;
      let groupPromises = new Array();
      for(let i in user.tables){
        if(tables[i].id !== unsortedID)
          groupPromises.push(addUserGroupToDB(id, tables[i]));
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
          itemPromises.push(addGroupItemToDB(tables[i].rows[j], userID, j));
        }
      }
        Promise.all(itemPromises).then(function(){
          resolve();
        });
    })
    .catch(function(err) {
      console.log("Error: " + err);
      reject(err);
    });
  });
}

function addUserToDB(user) {
  //IF THIS COMES OUT TO TRUE, RUN THE REST OF THE PROGRAM. IF NOT, RETURN
  return checkUserDB(user)
    .then(function(promise) {
      //If the user doesn't exist, add them
      if (!promise) {
        return new Promise(function(resolve, reject) {
          $.post(PHP_ADD_USER, {
            username: user
          }, function(data) {
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
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_USER, {
      username: user
    }, function(data) {
      resolve(data);
    });
  });
}

function addUserGroupToDB(user, table) {
  return checkUserGroupDB(user, table.name)
  .then(function(promise) {
    //If the group doesn't exist, add it
    if (!promise) {
      return new Promise(function(resolve, reject) {
        $.post(PHP_ADD_GROUP, {
          userID: user,
          groupName: table.name,
          groupID: table.id,
          position: table.position
        }, function(data) {
          if (data === -1)
            reject(data);
          table.id = data;
          resolve(data);
        });
      })
    }else{
      return Promise.resolve();
    }
  })
  .catch(function(err) {
    console.log("Error: " + err);
  });
}

function checkUserGroupDB(user, group) {
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_GROUP, {
      userID: user,
      groupName: group
    }, function(data) {
      resolve(data);
    });
  });
}

function addGroupItemToDB(item, userID, position) {
  return getGroupID(userID, item.category)
  .then(function(groupID){
    return checkGroupItemDB(item, userID, groupID)
  })
  .then(function(itemObj) {
      //If the item doesn't exist, add it
      if (!itemObj) {
        return getGroupID(userID, item.category)
        .then(function(groupID) {
          return new Promise(function(resolve, reject) {
            $.post(PHP_ADD_ITEM, {
              itemID: item.id,
              userID: userID,
              groupID: groupID,
              itemType: item.type,
              position: position
            }, function(data) {
              if (data === -1)
                reject(data);
              resolve(data);
            });
          })
        })
      }
    })
    .catch(function(err) {
      console.log("Error: " + err);
    });
}

function checkGroupItemDB(item, userID, groupID) {
  var ID = item.id;
  if (item.group == undefined)
    item.group = "Ungrouped";
  var type = item.type;
  return getGroupID(userID, item.category)
  .then(function(groupID) {
    return getItem(userID, ID, groupID);
  })
  .catch(function(err) {
    console.log("Error: " + err);
  });
}

function getItem(userID, itemID, groupID) {
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_ITEM, {
      userID: userID,
      itemID: itemID,
      groupID: groupID
    }, function(data) {
      if (data == null) {
        resolve(null);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

function updateGroupName(userID, table, newName){
  return new Promise(function(resolve, reject) {
    $.post(PHP_UPDATE_GROUP_NAME, {
      userID: userID,
      groupID: table.id,
      newName: table.name
    }, function(data) {
      resolve(data == 1);
    });
  });
}

function updateItemPosition(userID, item) {
  // let task = getTaskByID(itemID);
  // let HTMLTable = getHTMLTableFromItemID(itemID);
  // let currentTable = getTableFromID(HTMLTable.parentNode.id.slice(6)); //"table_" is 6 chars long.
  // let HTMLTableRows = HTMLTable.rows;
  // let newRow = [];
  //
  // task.position = newPosition;
  // for(let i = 0; i < HTMLTableRows.length; i++)
  //   newRow.push(getTaskByID(HTMLTableRows[i].id));
  // currentTable.rows = newRow;
  // sortByPosition(currentTable.rows);

  return new Promise(function(resolve, reject) {
    $.post(PHP_UPDATE_ITEM_POSITION, {
      userID: userID,
      itemID: item.id,
      newPosition: item.position
    }, function(data) {
      resolve(data == 1);
    });
  });
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
  return new Promise(function(resolve, reject) {
    $.post(PHP_UPDATE_ITEM_GROUP, {
      userID: userID,
      itemID: itemID,
      newGroupID: newGroupID
    }, function(data) {
      resolve(data == 1);
    });
  });
}

function getAllItemsInGroup(userID, groupID) {
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_ITEMS_IN_GROUP, {
      userID: userID,
      groupID: groupID
    }, function(data) {
      resolve(JSON.parse(data));
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
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_GROUPS_FOR_USER, {
      userID: userID,
    }, function(data) {
      resolve(JSON.parse(data));
    });
  });
}

function getGroupName(user, groupID) {
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_GROUP_NAME, {
      userID: user,
      groupID: groupID
    }, function(data) {
      resolve(data);
    });
  })
}
