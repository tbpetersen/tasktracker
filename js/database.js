const PHP_DIRECTORY_PATH = './php';

const PHP_ADD_USER = PHP_DIRECTORY_PATH + '/addUser.php';
const PHP_GET_USER = PHP_DIRECTORY_PATH + '/getUser.php';

const PHP_ADD_GROUP = PHP_DIRECTORY_PATH + '/addGroup.php';
const PHP_GET_GROUP = PHP_DIRECTORY_PATH + '/getGroup.php';

const PHP_ADD_ITEM = PHP_DIRECTORY_PATH + '/addItem.php';
const PHP_GET_ITEM = PHP_DIRECTORY_PATH + '/getItem.php';




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
            if (data === -1)
              return Promise.reject(data);
            return Promise.resolve(data);
          });
        })
      }
    })
    .catch(function(err) {
      console.log("Error: " + err);
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
            return Promise.reject(data);
          return Promise.resolve(data);
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

function addGroupItemsToDB(item, user, group, type, location) {
  return checkGroupItemsDB(item, user, group, type, location)
  .then(function(promise) {
    //If the group doesn't exist, add it
    if (!promise) {
      return new Promise(function(resolve, reject) {
        $.post(PHP_GET_ITEM, {
          itemID: item,
          userID: user,
          groupID: group,
          itemType: type,
          position: location
        }, function(data) {
          if (data === -1)
            return Promise.reject(data);
          return Promise.resolve(data);
        });
      })
    }
  })
  .catch(function(err) {
    console.log("Error: " + err);
  });
}

function checkGroupItemsDB(items) {

}
