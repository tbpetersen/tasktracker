const PHP_DIRECTORY_PATH = './php';

const PHP_ADD_USER = PHP_DIRECTORY_PATH + '/addUser.php';
const PHP_GET_USER = PHP_DIRECTORY_PATH + '/getUser.php';
const PHP_GET_USER_ID = PHP_DIRECTORY_PATH + '/getUserID.php';

const PHP_ADD_GROUP = PHP_DIRECTORY_PATH + '/addGroup.php';
const PHP_GET_GROUP = PHP_DIRECTORY_PATH + '/getGroup.php';
const PHP_GET_GROUP_ID = PHP_DIRECTORY_PATH + '/getGroupID.php';

const PHP_ADD_ITEM = PHP_DIRECTORY_PATH + '/addItem.php';
const PHP_GET_ITEM = PHP_DIRECTORY_PATH + '/getItem.php';
const PHP_GET_ITEMS_IN_GROUP = PHP_DIRECTORY_PATH +'/getAllItemsInGroup.php'


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

function addUserGroupToDB(user, group) {
  return checkUserGroupDB(user, group)
    .then(function(promise) {
      //If the group doesn't exist, add it
      if (!promise) {
        return new Promise(function(resolve, reject) {
          $.post(PHP_ADD_GROUP, {
            userID: user,
            groupName: group
          }, function(data) {
            if (data === -1)
              reject(data);
            resolve(data);
          });
        })
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

function addGroupItemToDB(item, userID, position/*, user, group, type, location*/ ) {
  return checkGroupItemDB(item, userID /*, user, group, type, location*/ )
  .then(function(promise) {
    //If the item doesn't exist, add it
    if (!promise) {
      getGroupID(userID, item.category)
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

function checkGroupItemDB(item, userID, userName) {
  var ID = item.id;
  if (item.group == undefined)
    item.group = "Ungrouped";
  var group = item.category;
  var type = item.type;
  return getGroupID(userID, group)
    .then(function(groupID) {
      return new Promise(function(resolve, reject) {
        $.post(PHP_GET_ITEM, {
          itemID: ID,
          userID: userID,
          groupID: groupID,
          itemType: type,
          position: 1
        }, function(data) {
          resolve(data);
        });
      })
    })
    .catch(function(err) {
      console.log("Error: " + err);
    });
}

function getItem(userID, itemID){
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_ITEM, {
      userID: userID,
      itemID: itemID
    }, function(data) {
      if(data == null){
        resolve(null);
      }else{
        resolve(JSON.parse(data));
      }
    });
  });
}

function getAllItemsInGroup(userID, groupID){
  return new Promise(function(resolve, reject) {
    $.post(PHP_GET_ITEMS_IN_GROUP, {
      userID: userID,
      groupID: groupID
    }, function(data) {
      resolve(JSON.parse(data));
    });
  });
}
