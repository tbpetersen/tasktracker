const ZEN_AUTH_URL = "https://sdsc.zendesk.com/oauth/authorizations/new?response_type=token&client_id=client_services_tool_dev&scope=read%20write";
const TRE_AUTH_URL = "https://trello.com/1/authorize?name=Zello&key=8886ef1a1bc5ad08caad020068a3f9a2&callback_method=fragment&return_url=https://localhost&scope=read,account&expiration=never";

const ZEN_API_URL = "https://sdsc.zendesk.com/api/v2/";
const TRE_API_URL = "https://trello.com/1/";

const TRE_APP_KEY = "8886ef1a1bc5ad08caad020068a3f9a2";

const ZEN_TICKET_URL = "https://sdsc.zendesk.com/agent/tickets/";

var zendeskToken = "";
var trelloToken = "";
var user;
var isClosed = false;
const GROUP_SORTABLE_CLASS = 'sortable-group'
const ITEM_SORTABLE_CLASS = 'sortable-item'
const CONVERTER = new showdown.Converter();

var failedZendeskAuth = false;

class Table{
  constructor(name, id, position){
    this.name = name;
    this.id = id;
    this.position = position
    this.rows = new Array();
  }

  addRow(task) {
    this.rows.push(task)
  }


  getRowByID(rowID) {
    for (let i = 0; i < this.rows.length; i++){
      let row = this.rows[i];
      if(row.id == rowID){
        return row;
      }
    }
    return null;
  }

  isEmpty(){
    return this.rows.length == 0;
  }

}
class Task {
  /*
    Member variables:
      name - The Trello name or Zendesk subject
      desc - The Trello description or Zendesk body
      type - Trello is 0, Zendesk is 1
      createdAt - timestamp of creation timestamp
      lastModified - timestamp of time when the entity was last edited
      url - The link to this card/ticket
  */
  constructor(data, type) {
    this.type = type;
    this.id = data.id;
    this.url = data.url;
    if (type == 0 /* Trello */ ) {
      this.name = data.name;
      this.desc = data.desc;
      this.lastModified = this.getTimeStampFromString(data.dateLastActivity);
      this.createdAt = this.getTrelloCreationTime(this.id);
      this.category = data.list.name;
      this.group = data.nameBoard;
      this.requester = null;
    } else /* Zendesk*/ {
      this.name = data.subject;
      this.desc = data.description;
      this.lastModified = this.getTimeStampFromString(data.updated_at);
      this.createdAt = this.getTimeStampFromString(data.created_at);
      this.category = data.status;
      if(data.group){
        this.group = data.group.name;
      }
      this.requester = data.requester;
    }
  }

  getTrelloCreationTime(trelloID) {
    let hexTime = trelloID.substring(0, 8);
    return parseInt(hexTime, 16);
  }


  getTimeStampFromString(timeString) {
    let date = new Date(timeString);
    return date.getTime();
  }
}

$(document).ready(function() {
  // Hamburger menu toggle
  var trigger = $(".hamburger");

  trigger.click(function() {
    hamburger_cross();
  });

  $("#logo").click(function(){
    $("#redirectNotif").modal("show");
  //  window.location.href = "http://holonet.sdsc.edu";
  })

  function hamburger_cross() {
    if (isClosed == true) {
      trigger.removeClass("is-open");
      trigger.addClass("is-closed");
      isClosed = false;
    } else {
      trigger.removeClass("is-closed");
      trigger.addClass("is-open");
      isClosed = true;
    }
  }

  $("[data-toggle='offcanvas']").click(function() {
    $("body").toggleClass("toggled");
    $(".navbar").toggleClass("toggled");
  });

  // Default toast notifications settings
  $.notifyDefaults({
    allow_dismiss: true,
    animate: {
      enter: "animated fadeInUp",
      exit: "animated fadeOutRight"
    },
    placement: {
      from: "top",
      align: "right"
    },
    offset: 20,
    spacing: 10,
    delay: 500
  });

  // Scroll to top button
  $(window).scroll(function(){
    if ($(this).scrollTop() > 100) {
      $(".scrollTop").fadeIn();
    }
    else {
      $(".scrollTop").fadeOut();
    }
  });

  $(".scrollTop").click(function() {
    $("html, body").animate({scrollTop : 0},800);

    return false;
  });

  // Allocate tables for Zendesk and Trello

  Promise.resolve()
  .then(function(){
    return initialSetup();
  })

  .then(function(){
    return setIDs()
  })

  .then(setTheme)

  .then(function(){
    if(user.databaseID == -1){
      return loadFromAPI();
    }else{
      return loadFromDB();
    }
  })

  .then(function(){
    return addDataToDB();
  })

  .then(function(){
    $('.loader').hide();
    createFilters();
    createTablesFromTableObject();
    //After the API is finished loading, allow new table creation.
    $("#addTable").click(createNewTable);
  })
  .then(function(){
    $("#addTable").attr("disabled", false);
    $("#reorder").attr("disabled", false);
  })

  .catch(function(err){
    $('.loader').hide();
    console.log("Error during setup: ");
    console.log(err);
  })
  table();
  $("#addTable").attr("disabled", true);
  $("#reorder").attr("disabled", true);
});


function extractGroupID(idAttribute) {
  var startIndex = idAttribute.indexOf("_");

  if (startIndex === -1)
    return;

  var groupID = idAttribute.substr(++startIndex);
  return groupID;
}


function delayedPromise(seconds){
  return new Promise(function(resolve,reject){
    setTimeout(function(){
      resolve();
    }, seconds * 1000);
  });
}


function refreshGroupUI(tableObj) {

  if(tableObj == null){
    return;
  }

  let tableWrapper = document.getElementById(wrapperPrefix + tableObj.id);
  let headerWrapper = $(tableWrapper).find('.wrapper-header h3');
  let tableBody = $(tableWrapper).find('tbody');

  tableBody.removeClass("place")

  headerWrapper.text(tableObj.name);
  tableBody.empty();
  for(let i = 0; i < tableObj.rows.length; i++) {
    populateTable(tableObj.rows[i], tableObj.id, i);
  }
  draggableRows(ITEM_SORTABLE_CLASS);
}


/*https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  Generates and returns a random string ID.*/
function makeID() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


function loadUsersItemsFromDB(){
  return Promise.resolve()

  .then(function(){
    return getAllGroups(user.databaseID);
  })

  .then(function(groups){
    sortByPosition(groups);
    let promiseArray = new Array();
    for(let i = 0; i < groups.length; i++){
      let groupID = groups[i].groupID;
      promiseArray.push(getAllItemsInGroup(user.databaseID, groupID));
    }
    return Promise.all(promiseArray).then(function(items){
      let groupsArray = new Array();
      for(let i = 0; i < groups.length; i++){
        let groupObj = new Object();
        groupObj.name = groups[i].groupName;
        groupObj.id = groups[i].groupID;
        groupObj.items = items[i];
        groupsArray.push(groupObj);
      }
      return Promise.resolve(groupsArray);
    })
  })
}


function createTablesFromTableObject(){
  let tables = user.tables; // You can iterate over these

  // create each table by iterating through tables list
  for(i = 0; i < tables.length; i++) {
    var table = tables[i];
    createTable(table, false);

    // populate each table by accessing rows in each table
    var tableRows = table.rows.length;
    if (tableRows == 0) {
      var id = table.id;
      var tableID = tablePrefix + id;
      $("#" + tableID).find("tbody").addClass("place");
    }

    for(j = 0; j < table.rows.length; j++) {
      populateTable(table.rows[j], table.id, j);
    }

    draggableRows(ITEM_SORTABLE_CLASS);
  }
}


function sortByPosition(array){
  let compare = function(a,b){
    return a.position - b.position;
  }
  array.sort(compare);
}


function createTablesFromDBandAPI(dbData, tasks){
  createTablesFromGroups(dbData, tasks);
  return Promise.resolve();
}


function createTablesFromGroups(groups, tasks){
  user.tables = new Array();
  for(let i = 0; i < groups.length; i++){
    let group = groups[i];
    let table = new Table(group.name, group.id, i);

    for(let j = 0; j < group.items.length; j++){
      let item = group.items[j];
      task = getTaskByID(item.itemID);
      if(task != null){
        task.position = item.position;
        table.addRow(task);
      }
      sortByPosition(table.rows);
    }
    user.tables.push(table);
  }

  let newUnsortedTasks = findUnsortedTasks(tasks, groups);

  if(newUnsortedTasks.length > 0){
    if(! user.hasUnsortedTable()){
      let unsortedTable = createUnsortedTable(tasks, groups);
    }else{
      let unsortedTable = user.getTableByID(UNSORTED_TABLE_ID);
      for(let i = 0; i < newUnsortedTasks.length; i++){
        unsortedTable.rows.push(newUnsortedTasks[i]);
        addGroupItemToDB(user.databaseID, newUnsortedTasks[i], unsortedTable.id);
      }
    }
  }

}


function getUserTableFromItemID(itemID){
  let task = getTaskByID(itemID);
  for(let i in user.tables){
    for(let j in user.tables[i].rows){
      if(task === user.tables[i].rows[j]){
        return user.tables[i];
      }
    }
  }
}


function getTaskByID(taskID){
  if(user.tasks == null){
    return null;
  }

  for(let i = 0; i < user.tasks.length; i++){
    if(user.tasks[i].id == taskID){
      return user.tasks[i];
    }
  }
  return null;
}


function createTasks(){
  return Promise.resolve()
  .then(function(){
    return getCardsAndTickets();
  })

  .then(function(cardsAndTickets){
    return addInfoToCardsAndTickets(cardsAndTickets);
  })

  .then(function(cardsAndTickets){
    return createTasksFromCardsAndTickets(cardsAndTickets);
  })

  .then(function(tasks){
    user.tasks = tasks;
    return Promise.resolve(tasks);
  })
}


function loadFromAPI(){
  return Promise.resolve()
  .then(function(){
    return createTasks();
  })

  .then(function(tasks){
    createGroupsForUser(tasks);
    return Promise.resolve();
  })
}


function loadFromDB(){
  return Promise.resolve()

  .then(function(){
    return createTasks();
  })

  .then(function(tasks){
    user.tasks = tasks;
    return loadUsersItemsFromDB();
  })

  .then(function(itemsFromDB){
    let createTablesPromise = createTablesFromDBandAPI(itemsFromDB, user.tasks);
    let removeDeletedCardsPromise = removeDeletedCardsFromDB(itemsFromDB, user.tasks);
    return Promise.all([createTablesPromise, removeDeletedCardsPromise]);
  })
}

function removeDeletedCardsFromDB(itemsFromDB, tasks){
  let arrayOfItemsArray = itemsFromDB.map(
  function(group){
    return group.items
  });
  let allItems = oneArrayFromMany(arrayOfItemsArray);

  let deletePromises = [];
  for(let i = 0; i < allItems.length; i++){
    let cardIsOpen = false;
    for(let j = 0; j < tasks.length; j++){
      if(allItems[i].itemID == tasks[j].id){
        cardIsOpen = true;
      }
    }
    if(! cardIsOpen){
      deletePromises.push(deleteItem(user.databaseID, allItems[i].itemID));
    }
  }

  return Promise.all(deletePromises);
}

function createGroupsForUser(tasks){
  let cat = {};
  let groupCounter = 0;
  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];
    var catID = task.category;

    // Check if category table already exists
    if ( cat[catID] == null) {
      user.tables.push(new Table(task.category, catID, groupCounter));
      groupCounter++;
      cat[catID] = catID;
    }
    user.getTableByID(catID).addRow(task);
  }

  for(let i = 0; i < user.tables.length; i++){
    user.tables[i].id = -1;
  }
}


function getTrelloAndZendeskCardData(items){
  let proimseArray = new Array();
  for(let i = 0; i < items.length; i++){
    let item = items[i];
    if(item.itemType == 0 /* Trello */){
      promiseArray.push();
    }else /* Zendesk */{
      promiseArray.push();
    }
  }
}


/* Populating/setting up tables */
function populatePage() {
  return new Promise(function(resolve, reject){
    var userName = user.trello.email;

    getUserID(userName)
    .then(function(promise) {
      return promise;
    })
    .then(function(id) {
      return getAllGroups(id);
    })
    .then(function(groups) {
      var cat = {};

      for (var i = 0; i < groups.length; i++) {
        cat[groups[i].groupName] = groups[i].groupID;
      }

      var tasks = user.tasks;
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var catID = cat[task.category];

        // Check if category table already exists
        var wrapperCat = wrapperPrefix + catID;
        if (document.getElementById(wrapperCat) == null) {
          createTable(catID, false);
        }
        populateTable(task, catID, i);
      }
      draggableRows(ITEM_SORTABLE_CLASS);
      resolve();
    })
    .catch(function(err) {
      console.log("Error" + err.stack);
      reject();
    });
  });

}

/* Name: isEmptyString
   Purpose: Tell whether the string is empty or not.
   Description: Runs through the string looking for anything that isn't an empty
    space and returns true or false if the string is empty.
   Parameter: String - The string to be checked if it's empty or not.
   Return: Boolean - Whether the string is empty or not.
*/
function isEmptyString(string){
  var i;
  for(i = 0; i < string.length; i++){
    if(string.charAt(i) !== ' ')
      return false;
  }
  return true;
}


function formatDate(date) {
  var date = new Date(date);
  date = date.toDateString();
  date = date.substring(4);

  return date;
}


function finalizeTempTable(){
  for(let i = 0; i < user.tempTables.length; i++){
    user.tempTables[i].position = i;
  }
  user.tables = user.tempTables;
  user.tempTables = new Array();
}


function table() {
  var egg = new Egg();
  egg
    .addCode("b,o,b", function() {
      jQuery('#background').fadeIn(500, function() {
        window.setTimeout(function() { jQuery('#background').hide(); }, 5000);
      });
    })
    .addHook(function(){
      document.body.style.backgroundImage = "url('js/parrot.gif')";
    }).listen();
}


function initialSetup() {
  if(isNotUsingHTTPS()){
    redirectToHTTPS();
    return Promise.reject();
  }else{
    return setupTokens()
    .then(function(){
      instantiateUser();
      return Promise.resolve();
    })
  }

}


function instantiateUser() {
  user = new Object();
  user.trello = new Object();
  user.zendesk = new Object();
  user.tables = new Array();
  user.tempTables = new Array();

  user.getTableByID = function(tableID){
    for(let i = 0; i < user.tables.length; i++){
      let table = user.tables[i];
      if(table.id == tableID){
        return table;
      }
    }
    return null;
  }
  user.deleteTable = function(tableObj){
    for(let i = 0; i < user.tables.length; i++){
      let table = user.tables[i];
      if(table.id == tableObj.id){
        user.tables.splice(i,1);
        break;
      }
    }
  };

  user.hasUnsortedTable = function(){
    return user.getTableByID(UNSORTED_TABLE_ID) != null;
  }
}


function isNotUsingHTTPS(){
  return window.location.protocol != 'https:'
}


function redirectToHTTPS() {
    window.location.assign('https://' + window.location.hostname + window.location.pathname);
}


function saveTokenFromURL() {
  saveTrelloTokenFromURL();
  saveZendeskTokenFromURL();
  window.history.replaceState(null, null, window.location.pathname);
}


function saveTrelloTokenFromURL() {
  var url = window.location.href;
  var tokenString = "#token=";

  if (!url.includes(tokenString)) {
    return;
  }

  var tokenStart = url.indexOf(tokenString) + tokenString.length;
  token = url.substring(tokenStart);
  localStorage.setItem("trelloToken", token);
}


function saveZendeskTokenFromURL() {
  var url = window.location.href;
  var tokenString = "#access_token=";

  if (!url.includes(tokenString)) {
    return;
  }

  var tokenStart = url.indexOf(tokenString) + tokenString.length;
  var tokenEnd = url.indexOf("&scope=");
  token = url.substring(tokenStart, tokenEnd);
  localStorage.setItem("zendeskToken", token);
}


function setupTokens() {
  saveTokenFromURL();

  return getZendeskToken()
  .then(function(){
    return getTrelloToken();
  })
}


function getZendeskToken() {
  zendeskToken = localStorage.getItem("zendeskToken");
  if (zendeskToken == undefined) {
    redirectToZendeskLogin();
    return Promise.reject();
  }else{
    return checkZendeskToken()
    .catch(function(error){
      if(error.status == 0 && ! failedZendeskAuth){
        localStorage.removeItem("zendeskToken");
        failedZendeskAuth = true;
        return getZendeskToken();
      }else{
        return Promise.reject(error);
      }
    })
  }
}


function checkZendeskToken(){
  return zendeskGet('users/me');
}


function getTrelloToken() {
  trelloToken = localStorage.getItem("trelloToken");
  if (trelloToken == undefined) {
    redirectToTrelloLogin();
    return Promise.reject();
  }else{
    return checkTrelloToken()
    .catch(function(error){
      if(error.responseText == 'invalid token'){
        localStorage.removeItem("trelloToken");
        return getTrelloToken();
      }else{
        return Promise.reject(error);
      }
    })
  }
}


function checkTrelloToken(){
  return trelloGet("members/me");
}


function redirectToTrelloLogin() {
  window.location.assign(TRE_AUTH_URL);
}


function redirectToZendeskLogin() {
  window.location.assign(ZEN_AUTH_URL);
}


function setIDs() {
  return new Promise(function(resolve, reject){
    let setIDTre = setTrelloID();
    let setIDZen = setZendeskID();

    Promise.all(new Array(setIDTre, setIDZen)).then(function(){
      getUserID(user.trello.email)
      .then(function(userID){
        user.databaseID = userID;
        resolve();
      })
      .catch(function(error){
        reject(error);
      });
    });
  });

}


function setTrelloID() {
  return new Promise(function(resolve, reject) {
    trelloGet("members/me")

      .then(function(trelloData) {
        user.trello.email = trelloData.email;

        user.trello.id = trelloData.id;
        user.trello.boardIDs = trelloData.idBoards;
        resolve();
      })

      .catch(function(trelloData) {
        reject(trelloData);
      });
  });
}


function setZendeskID() {
  return new Promise(function(resolve, reject) {
    zendeskGet("users/me")
      .then(function(zendeskData) {
        user.zendesk.id = zendeskData.user.id;
        resolve();
      })

      .catch(function(zendeskData) {
        reject(zendeskData);
      });
  });
}


function getCardsAndTickets() {
  let trelloCards = getTrelloCards();
  let zendeskTickets = getZendeskTickets();

  return Promise.all([trelloCards, zendeskTickets]);
}


function getTrelloCardsSearch(cardIDsArray){
  // TODO Trevor: Looking into more efficient loading from APIs
  //getTrelloCardsSearch(['57f7bd3914dd9c8939c68521', '58dbf3c5f0b7e827080d81af', '5817a1edb54f1b3cd101be55']);
  return trelloGet("search","card_board=true&card_list=true&query=*&board_fields=all&idCards=" + cardIDsArray.join(','))
  .then(function(data){
    console.log(data);
    return Promise.resolve(data);
  })
}


function getTrelloCards() {
  return new Promise(function(resolve, reject) {
    getTrelloBoards().then(function(boards) {
        getCardsFromBoard(boards).then(function(cards) {
            getUsersCards(cards).then(function(usersCards) {
                resolve(usersCards);
              })
              .catch(function(getUsersCardsFailed) {
                reject(getUsersCardsFailed);
              });
          })
          .catch(function(getCardsFromBoardsFailed) {
            reject(getCardsFromBoardsFailed);
          });
      })
      .catch(function(getTrelloBoardsFailed) {
        reject(getTrelloBoardsFailed);
      });
  });

}


function getTrelloBoards() {
  return trelloGet("members/me/boards");
}


function getCardsFromBoard(boards) {
  return new Promise(function(resolve, reject) {
    let boardDataPromises = new Array();
    for (let i = 0; i < boards.length; i++) {
      boardDataPromises.push(trelloGet("boards/" + boards[i].id + "/cards"));
    }
    Promise.all(boardDataPromises).then(function(cardArrays) {
        let allCards = new Array();
        for (let i = 0; i < cardArrays.length; i++) {
          let singleArray = cardArrays[i];
          for (let j = 0; j < singleArray.length; j++) {
            let card = singleArray[j];
            card.nameBoard = boards[i].name;
            allCards.push(card);
          }
        }
        resolve(allCards);
      })
      .catch(function(dataBoardPromisesFailed) {
        reject(dataBoardPromisesFailed);
      });
  });
}


function getUsersCards(cards) {
  return new Promise(function(resolve, reject) {
    if (user == null) {
      reject("user not instantiated");
    }
    if (user.trello == null) {
      reject("user.trello not instantiated");
    }
    if (user.trello.id == null) {
      reject("Trello ID not set");
    }
    let id = user.trello.id;
    let usersCards = new Array();
    for (let i = 0; i < cards.length; i++) {
      for (let j = 0; j < cards[i].idMembers.length; j++) {
        if (cards[i].idMembers[j] == id) {
          usersCards.push(cards[i]);
        }
      }
    }
    resolve(usersCards);
  });
}


function getZendeskTickets() {
  //return zendeskGet("search.json?query=type:ticket status<solved");
  let promiseArray = new Array();
  let myTickets = getMyTicketsThatAreNotClosed();
  let myGroupsUnassignedTickets = getMyGroupsUnassignedTickets();

  promiseArray.push(myTickets);
  promiseArray.push(myGroupsUnassignedTickets);

  return Promise.all(promiseArray).then(function(arrayofArrayOfTickets){
    return Promise.resolve(oneArrayFromMany(arrayofArrayOfTickets));
  })
}


function getMyTicketsThatAreNotClosed(){
  return zendeskGet("search.json?query=type:ticket assignee:me status<closed")

  .then(function(results){
    return Promise.resolve(results.results);
  })
}


function getMyGroupsUnassignedTickets(){
  return Promise.resolve()

  .then(function(){
    return getMyZendeskGroupsIDs()
  })

  .then(function(ids){
    let promiseArray = new Array();
    for(let i = 0; i < ids.length; i++){
      let query = "search.json?query=type:ticket assignee:none group:" + ids[i];
      promiseArray.push(zendeskGet(query));
    }
    return Promise.all(promiseArray).then(function(results){
      let arrayofArrayOfTickets = results.map(function(result){
        return result.results;
      });
      return Promise.resolve(oneArrayFromMany(arrayofArrayOfTickets))
    })
  })
}


function getMyZendeskGroupsIDs(){
  return zendeskGet('users/' + user.zendesk.id + '/groups.json')
  .then(function(data){
    let ids = data.groups.map(function(group){
      return group.id
    })
    return Promise.resolve(ids)
  })
}


function addInfoToCardsAndTickets(cardsAndTickets){
  let trelloCards = cardsAndTickets[0];
  let zendeskCards = cardsAndTickets[1];
  return new Promise(function(resolve, reject) {
      let addInfoTrelloGroup = addTrelloGroups(trelloCards);
      let addInfoZendeskGroup = addZendeskGroups(zendeskCards);
      let addInfoZendeskRequester = addZendeskRequester(zendeskCards);

      Promise.all([addInfoTrelloGroup, addInfoZendeskGroup, addInfoZendeskRequester]).then(function(data){
        resolve(cardsAndTickets);
      });
  });
}


function addZendeskGroups(zendeskCards){
  return new Promise(function(resolve, reject){
    let prom = zendeskGet("groups.json");
    prom.then(function(groupsData){
      groupsData = groupsData.groups;
      for(let i = 0; i < zendeskCards.length; i++){
        let group = findGroup(zendeskCards[i], groupsData);
        if(group == null){
          zendeskCards[i].group = null;
          continue;
        }
        let groupObject = new Object();
        groupObject.id = group.id;
        groupObject.name = group.name;
        zendeskCards[i].group = groupObject;
      }
      resolve();
    });
  });
}


function addTrelloGroups(trelloCards){
  return new Promise(function(resolve, reject){
    let listPromisesArray = new Array();
    for(let i = 0; i < user.trello.boardIDs.length; i++){
      let listPromise = trelloGet("boards/" + user.trello.boardIDs[i] + "/lists");
      listPromisesArray.push(listPromise);
    }

    let listPromises = Promise.all(listPromisesArray);
    listPromises.then(function(listsData){
      listsData = oneArrayFromMany(listsData);
      for(let i = 0; i < trelloCards.length; i++){
        let list = findList(trelloCards[i], listsData);
        if(list == null){
          trelloCards[i].list = null;
          continue;
        }
        let listObject = new Object();
        listObject.id = list.id;
        listObject.name = list.name;
        trelloCards[i].list = listObject;
      }
      resolve();
    });
  });
}


function addZendeskRequester(zendeskCards){
  return new Promise(function(resolve, reject){
    let allZendeskUsers = getAllZendeskUsers("users", new Array());
    allZendeskUsers.then(function(arrayOfUsers){
      for(let i = 0; i < zendeskCards.length; i++){
        let task = zendeskCards[i];
        task.requester = null;
        for(let j = 0; j < arrayOfUsers.length; j++){
          let user = arrayOfUsers[j];
          if(user.id == task.requester_id){
            task.requester = user.email;
            break;
          }
        }
      }
      resolve();
    });
  });
}


function getAllZendeskUsers(url, previousList){
  let userPromise = zendeskGet(url);
  return userPromise.then(function(data){
    previousList.push(data.users);
    if(data.next_page != null){
      endingIndex = data.next_page.indexOf(ZEN_API_URL) + ZEN_API_URL.length;
      newURL = data.next_page.substring(endingIndex);
      return getAllZendeskUsers(newURL,previousList);
    }else{
      return Promise.resolve(oneArrayFromMany(previousList));
    }
  });
}


function oneArrayFromMany(arrayOfArrays){
  let returnArray = new Array();
  for(let i =0; i < arrayOfArrays.length; i++){
    for(let j = 0; j < arrayOfArrays[i].length; j++){
      returnArray.push(arrayOfArrays[i][j]);
    }
  }
  return returnArray;
}


function findList(card, lists){
  for(let i = 0; i < lists.length; i++){
    if(card.idList == lists[i].id){
      return lists[i];
    }
  }
  return null;
}


function findGroup(card, groups){
  for(let i = 0; i < groups.length; i++){
    if(card.group_id == groups[i].id){
      return groups[i];
    }
  }
  return null;
}


function createTasksFromCardsAndTickets(cardsAndTickets) {
  let tasks = new Array();
  for (let i = 0; i < cardsAndTickets.length; i++) {
    for (let j = 0; j < cardsAndTickets[i].length; j++) {
      tasks.push(new Task(cardsAndTickets[i][j], i));
    }
  }
  return Promise.resolve(tasks);
}


function zendeskGet(url) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      type: "GET",
      beforeSend: function(request) {
        request.setRequestHeader("Authorization", "Bearer " + zendeskToken);
      },
      url: ZEN_API_URL + url,
      success: function(data) {
        resolve(data)
      },
      error: function(data, d) {
        console.log(data);
        console.log(d);
        reject(data)
      }
    });
  });
}


function trelloGet(url, getParams) {
  if(getParams == null){
    getParams = '';
  }else{
    getParams = "&" + getParams;
  }
  return new Promise(function(resolve, reject) {
    $.ajax({
      type: "GET",
      url: TRE_API_URL + url + "?token=" + trelloToken + "&key=" + TRE_APP_KEY + getParams,
      success: function(data) {
        resolve(data)
      },
      error: function(data) {
        reject(data)
      }
    });
  });
}
