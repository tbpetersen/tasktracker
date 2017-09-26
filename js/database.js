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
  console.log("Adding to database");

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
      for(i in user.tasks){
        itemPromises.push(addGroupItemToDB(user.tasks[i], userID, i));
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
          groupID: table.id
        }, function(data) {
          console.log(data);
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
  return checkGroupItemDB(item, userID)
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

function updateGroupName(userID, groupID, newName) {
  return new Promise(function(resolve, reject) {
    $.post(PHP_UPDATE_GROUP_NAME, {
      userID: userID,
      groupID: groupID,
      newName: newName
    }, function(data) {
      resolve(data == 1);
    });
  });
}

function updateItemPosition(userID, itemID, newPosition) {
  return new Promise(function(resolve, reject) {
    $.post(PHP_UPDATE_ITEM_POSITION, {
      userID: userID,
      itemID: itemID,
      newPosition: newPosition
    }, function(data) {
      resolve(data == 1);
    });
  });
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

/* Name: updateTableItemPositions
   Purpose: Update the DB to have the correct positions of ALL the items inside
            their respective tables.
   Parameters: userID - The ID of the user using Zello.
               category - The category to have it's tasks' positions updated.
   Return: None.
   TODO only update the positions of the tasks after the one that's inserted.
*/
function updateTableItemPositions(userID, table) {
  var tasksInTable = [];
  // console.log(table.getElementsByTagName("TR"));
  //Find the tasks with the category to be updated.
  var tableTasks = table.getElementsByTagName("TR")
  for (let i = 1; i < tableTasks.length; i++) {
    for (let j in user.tasks) {
      if (user.tasks[j].id == tableTasks[i].id){
        updateItemPosition(userID, user.tasks[j].id, getItemPosition(userID, user.tasks[j]));
      }
    }
  }
}

/* Name: updateItemPositions
   Purpose: Update the DB to have the correct positions of ALL the items inside
            their respective tables.
   Parameters: None.
   Return: None.
*/
function updateItemPositions(userID) {
  var uniqueCategories = [];
  for (let i in user.tasks) {
    let currentCategory = user.tasks[i].category
    if (!uniqueCategories.includes(currentCategory))
      uniqueCategories.push(currentCategory);
  }
  var categoriesWithTasks = new Array(uniqueCategories.length);
  for (let i in uniqueCategories) {
    categoriesWithTasks[i] = new Array();
  }
  for (let j = 0; j < user.tasks.length; j++) {
    categoriesWithTasks[uniqueCategories.indexOf(user.tasks[j].category)].push(user.tasks[j]);
  }
  for (let i in categoriesWithTasks) {
    for (let j in categoriesWithTasks[i]) {
      updateItemPosition(userID, categoriesWithTasks[i][j].id, j)
    }
  }
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
