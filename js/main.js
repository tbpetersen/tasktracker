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
const wrapperPrefix = "wrapper_";
const tablePrefix = "table_";
const GROUP_SORTABLE_CLASS = 'sortable-group'
const ITEM_SORTABLE_CLASS = 'sortable-item'

var cardsCreated = new Set(); // Keeps track of ticket cards created - no dupes

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
    //return populatePage();
  })

  .catch(function(err){
    $('.loader').hide();
    console.log("Error during setup: ");
    console.log(err);
  })
});

function delayedPromise(seconds){
  return new Promise(function(resolve,reject){
    setTimeout(function(){
      resolve();
    }, seconds * 1000);
  });
}

function refreshGroupUI(tableObj) {
  let tableWrapper = document.getElementById(wrapperPrefix + tableObj.id);
  let headerWrapper = $(tableWrapper).find('.wrapper-header h3');
  let tableBody = $(tableWrapper).find('tbody');

  headerWrapper.text(tableObj.name);
  tableBody.empty();
  for(let i = 0; i < tableObj.rows.length; i++) {
    populateTable(tableObj.rows[i], tableObj.id, i);
  }
  draggableRows(ITEM_SORTABLE_CLASS);
}

// Maybe another function - refreshAllGroupUI

/*https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  Generates and returns a random string ID.*/
function makeID() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

$(".main").on("click", "#deleteTableBtn", function(e)
{
 // Find the parent, table-wrapper, and get table
 var $table = $(this).parent().next();
 let tableID = extractGroupID($table[0].id);
 let tableObj = user.getTableByID(tableID);
 let unsortedTableObj = user.getTableByID(unsortedID);

 if((unsortedTableObj != null && tableObj.id === unsortedTableObj.id) && !(isEmpty($table))) {
   deleteUnsorted();
 }
 else if (isEmpty($table)) {
   deleteTable(tableObj);
 }
 else {
   deleteTablePrompt(tableObj);
 }
});

function deleteUnsorted() {
  $('#delUnsorted').modal('show');
  $('#confirm').unbind('click');

  // Enter keypress for 'Okay'
  $('#delUnsorted').keyup(function (e) {
    var key = e.which;
    if (key == 13) {  // the enter key code
      $('#confirm').click();
    }
  });
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

  //TODO Shiva
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


function createTablesFromDPandAPI(dbData, tasks){
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
  let unsortedTable = createUnsortedTable(tasks, groups);
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

function createUnsortedTable(tasks, groups){
  let table = new Table('Unsorted', unsortedID, user.tables.length);
  var clonedTasks = JSON.parse(JSON.stringify(tasks));
  for(let i = 0; i < groups.length; i++){
    for(let j = 0; j < groups[i].items.length; j++){
      for(let k = 0; k < clonedTasks.length; k++){
        if(clonedTasks[k].id == groups[i].items[j].itemID){
          clonedTasks.splice(k, 1)
        }
      }
    }
  }
  for(let i = 0; i < clonedTasks.length; i++){
    table.addRow(clonedTasks[i]);
  }
  user.tables.push(table);
  return table;
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
    return createTablesFromDPandAPI(itemsFromDB, user.tasks);
  })
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

function deleteTablePrompt(tableName) {
  $("#delTableNotif").modal("show");
  $("#delTableConfirm").unbind("click");
  $("#delTableNotif").unbind("keyup");

  var removeTable = function() {
    $("#delTableNotif").modal("hide");
    deleteTable(tableName);
  }

  // Enter keypress for 'Okay'
  $('#delTableNotif').keyup(function (e) {
    e.preventDefault();

    var key = e.which;
    if (key == 13) {  // the enter key code
      removeTable();
    }
  });

  $("#delTableConfirm").click(function() {
    removeTable();
  });
}


var tableNumber = -1;
function createNewTable() {
  $.notify({
    icon: "glyphicon glyphicon-plus-sign",
    message: "Table created."
  }, {
    type: "info",
  });

  var tableID = "New Table " + tableNumber;
  let tableObject = new Table(tableID, -1, user.tables.length);

  user.tables.push(tableObject);
  addUserGroupToDB(user.databaseID, tableObject).then(function(){
    tableObject.name = "New Table " + tableObject.id;
    updateGroupName(user.databaseID, tableObject).then(function(){
      tableID = tablePrefix + tableObject.id;
      createTable(tableObject, true);
      $("#" + tableID).find("tbody").addClass("place");
      updateFilters();
      draggableRows(ITEM_SORTABLE_CLASS);
      window.scrollTo(0, document.body.scrollHeight);
      tableNumber--;
    });
  });
}

function deleteTable(tableObj) {
  if(tableObj.id == unsortedID){
    return;
  }

  let tableWrapper = $('#' + wrapperPrefix + tableObj.id);
  let unsortedTableObj = user.getTableByID(unsortedID);

  if(unsortedTableObj == null){
    unsortedTableObj = createUnsortedTable([],[]);
    createTable(unsortedTableObj, true);
  }


  tableWrapper.remove();

  for(let i = 0; i < tableObj.rows.length; i++){
    let row = tableObj.rows[i];
    unsortedTableObj.addRow(row);
  }

  user.deleteTable(tableObj);
  deleteItemsFromUserGroup(user.databaseID, tableObj);
  deleteUserGroup(user.databaseID, tableObj);
  refreshGroupUI(unsortedTableObj);
  draggableRows(ITEM_SORTABLE_CLASS);
  updateFilters();

  $.notify({
    icon: "fa fa-trash",
    message: "Table deleted."
  }, {
    type: "danger",
  });
}

function isEmpty(tableName) {
  var tableLength = $(tableName).find("tbody > tr").length;
  if (tableLength < 1)
    return true;
  return false;
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

function createTable(tableObj, isNewTable) {
  var tableName = tableObj.id;

  // Create table structure
  var table = document.createElement("TABLE");
  var mainDiv = document.getElementById("main-container");
  var head = document.createElement("thead");
  var body = document.createElement("tbody");

  var tableWrapper = createTableWrapper(tableObj, isNewTable);
  var tableID = tablePrefix + tableName;

  //create row and cell element
  row = document.createElement("tr");
  titleCell = document.createElement("th");
  descCell = document.createElement("th");
  groupCell = document.createElement("th");
  modCell = document.createElement("th");
  catCell = document.createElement("th");

  // text for cell
  textNode1 = document.createTextNode("Title");
  textNode2 = document.createTextNode("Description");
  textNode3 = document.createTextNode("Group/Board");
  textNode4 = document.createTextNode("Last Modified");
  textNode5 = document.createTextNode("Category");

  // append text to cell
  titleCell.appendChild(textNode1);
  descCell.appendChild(textNode2);
  groupCell.appendChild(textNode3);
  modCell.appendChild(textNode4);
  catCell.appendChild(textNode5);


  // append text to row
  row.appendChild(titleCell);
  row.appendChild(descCell);
  row.appendChild(groupCell);
  row.appendChild(modCell);
  row.appendChild(catCell);

  // Name elements
  table.setAttribute("id", tableID);
  table.setAttribute("class", "tables");
  table.setAttribute("dbID", 1);
  body.setAttribute("class", ITEM_SORTABLE_CLASS);
  row.setAttribute("id", "firstRow");

  titleCell.setAttribute("id", "titleCell");
  descCell.setAttribute("id", "descCell");
  groupCell.setAttribute("id", "groupCell");
  modCell.setAttribute("id", "modCell");
  catCell.setAttribute("id", "catCell");

  // append row to table/body
  head.appendChild(row);
  table.appendChild(head);
  table.appendChild(body)
  tableWrapper.appendChild(table);
  mainDiv.appendChild(tableWrapper);

  makeButtons(tableID);
}

/* Helper function for createTable to create div wrappers to encapsulate tables */
function createTableWrapper(tableObj, isNewTable) {
  var tableName = tableObj.id;

  var tableWrapper = document.createElement("div");
  var title = document.createElement("h3");
  var divider = document.createElement("hr");
  var header = document.createElement("div");
  var wrapperName = wrapperPrefix + tableName;

  tableWrapper.setAttribute("id", wrapperName);
  title.setAttribute("id", "tableTitle");
  tableWrapper.setAttribute("class", "table-wrapper");
  header.setAttribute("class", "wrapper-header");

  var tableTitle;
  if(isNewTable) {
    tableTitle = document.createTextNode(tableObj.name);
  }
  else {
    var catName = tableObj.name.charAt(0).toUpperCase()
      + tableObj.name.substring(1);
    tableTitle = document.createTextNode(catName);
  }

  title.appendChild(tableTitle);
  header.appendChild(title);
  header.appendChild(divider);
  tableWrapper.appendChild(header);

  return tableWrapper;
}

// Event listener for table titles
$(".main").on("click", "#tableTitle", function() {
  var $title = $(this);
  var $tableWrapper = $title.parent().parent();
  var $table = $title.parent().next();
  var $groupID = extractGroupID($tableWrapper.attr("id"));

  var inputText;
  var $input = $('<input/>').val( $title.text() );
  var numKeyPress = 0;

  //Only allow changing of names for tables that arent Unsorted.
  if(this.innerHTML !== "Unsorted"){
    $input.focus(function() { this.select(); });  // Selects all text

    //Update filters when table titles are changed.
    $input.on("focusin", function(){
      const inputStay = this.value;
      inputText = inputStay;
    });

    $input.on("focusout", function(){
      if(!this.value || isEmptyString(this.value))
        this.value = inputText;

      updateFilters();
      filterAll();
    });

    $input.on("input", function(){
      if(this.value.length === 1 && this.value !== this.value.toUpperCase())
        this.value = this.value.charAt(0).toUpperCase();
    });

    $title.replaceWith($input);

    var save = function() {
      var $newName = $input.val();
      var $titleStr = $('<h3 id="tableTitle" />').text( $newName );
      var tableObj = user.getTableByID($groupID);
      tableObj.name = $newName;
      updateGroupName(user.databaseID, tableObj);

      // Update input value
      $input.replaceWith($titleStr);
    };

    // Enter key exits form
    $input.keyup(function(e) {
      ++numKeyPress;

      if (e.which === 13 || e.which === 27) {
        var currentName = this.value;

        checkUserGroupDB(user.databaseID, currentName)
        .then(function(val) {
          if (val) {
            alert("Please rename this table as there is already one with the name \""
              + currentName + "\"");
            $input.val(inputText);
          }
          else {
            keyPressed = 0;
            updateFilters();
            $input.blur();
            return;
          }
        })
        .catch(function(err) {
          console.log("Error: " + err);
        });
      }
    }
  )};

  /** Avoid callbacks leftovers taking memory when input disappears
      after clicking away
  */
  $input.one('blur', save).focus();
});


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

function populateTable(task, tableName, index) {
  var table = document.getElementById(tablePrefix + tableName);
  addRow(task, tableName, index);
}

function formatDate(date) {
  var date = new Date(date);
  date = date.toDateString();
  date = date.substring(4);

  return date;
}

function addRow(task, tableName, index) {
  // Get title of task
  var title = task.name;

  // Get description's first 140 characters
  var desc = task.desc;
  var shortDesc = (desc).substring(0, 140);
  if (desc.length > 140) {
    shortDesc = shortDesc + "...";
  }

  // Get last modified date from timestamp
  date = formatDate(task.lastModified);

  // Get category of task
  var cat = task.category;
  var capCat = cat.charAt(0).toUpperCase() + cat.substring(1);

  // Get group/board of task
  var group = task.group;

  var tableID = tablePrefix + tableName;
  var unsortedID = tablePrefix + unsortedID;
  if (tableID != unsortedID) {
    var body = document.getElementById(tableID).getElementsByTagName("tbody")[0];
  }
  else{
    // var body = tableName.tBodies[0];
    var body = tableID.tBodies[0];
  }

  //create row and cell element
  row = document.createElement("tr");
  titleCell = document.createElement("td");
  descCell = document.createElement("td");
  groupCell = document.createElement("td");
  modCell = document.createElement("td");
  catCell = document.createElement("td");

  // Name elements
  row.setAttribute("id", task.id);
  row.setAttribute("class", "notFirst");
  titleCell.setAttribute("id", "title");
  descCell.setAttribute("id", "desc");
  groupCell.setAttribute("id", "group");
  modCell.setAttribute("id", "mod");
  catCell.setAttribute("id", "cat");

  // Link to task
  var btn = document.createElement("BUTTON");
  btn.setAttribute("id", "linkButton");
  btn.setAttribute("class", "btn");

  var icon = document.createElement("span");
  icon.className = "glyphicon glyphicon-link";

  btn.onclick = function() {
    if (task.type == 0) {
      window.open(task.url, "_blank");
    }
    else {
      var zendURL = ZEN_TICKET_URL + task.id;
      window.open(zendURL, "_blank");
    }

  };
  btn.appendChild(icon);

  // text for cell
  textNode1 = document.createTextNode(title);
  textNode2 = document.createTextNode(shortDesc);
  textNode3 = document.createTextNode(group);
  textNode4 = document.createTextNode(date);
  textNode5 = document.createTextNode(capCat);

  // append text to cell
  titleCell.appendChild(textNode1);
  titleCell.appendChild(btn);
  descCell.appendChild(textNode2);
  groupCell.appendChild(textNode3);
  modCell.appendChild(textNode4);
  catCell.appendChild(textNode5);

  // append text to row
  row.appendChild(titleCell);
  row.appendChild(descCell);
  row.appendChild(groupCell);
  row.appendChild(modCell);
  row.appendChild(catCell);

  // append row to table/body
  body.appendChild(row);
}

function draggableRows(className) {
  // Prevent rows from shrinking while dragged
  var fixHelper = function(e, ui) {
    ui.children().each(function() {
      $(this).width($(this).width());
    });
    return ui;
  };

  let updateListener;
  if(className == ITEM_SORTABLE_CLASS){
    updateListener = onTableUpdated;
  }else{
    updateListener = onTablePositionUpdated;
  }

  $("." + className).sortable({
    axis: 'y',
    dropOnEmpty: true,
    helper: fixHelper,
    connectWith: "." + className,
    placeholder: "ui-state-highlight",
    zIndex: 99,
    update: updateListener,
    stop: function(e,t) {
      if ($(this).children().length == 0) {
          $(this).addClass("place");
      }
      if ($(t.item).closest("tbody").children().length > 0) {
          $(t.item).closest("tbody").removeClass("place");
      }
    }
  });
  $("#sortable").disableSelection();
}

function onTableUpdated(event, ui){
  let htmlTable = event.target.parentNode;
  let tableID = extractGroupID(htmlTable.id);
  let table = user.getTableByID(tableID);
  let newRows = [];
  let items = htmlTable.getElementsByTagName("tr");
  let userID = user.databaseID;
  for (let i = 1; i < items.length; i++) {
    let task = getTaskByID(items[i].id);
    task.position = i - 1;
    addGroupItemToDB(userID, task, table.id);
    newRows.push(task);
    if(table.id === unsortedID){
      deleteItem(userID, task.id);
    }
  }
  table.rows = newRows;
}


function onTablePositionUpdated(event, ui){
  let htmlTable = $(event.target.parentNode);
  let htmlTableBody = htmlTable.find('tbody')[0];

  let groups = htmlTableBody.children;
  let newTablesArray = new Array();
  for(let i = 0; i < groups.length; i++){
    let currentGroup = groups[i];
    let groupID = currentGroup.getAttribute('databaseID');
    let table = user.getTableByID(groupID);
    newTablesArray.push(table);
  }
  user.tempTables = newTablesArray;
}

function makeButtons(tableName) {

  var table = document.getElementById(tableName);
  var wrapperHeader = $("#" + tableName).siblings('div');

  var titleCell = table.rows[0].cells[0];
  var descCell = table.rows[0].cells[1];
  var groupCell = table.rows[0].cells[2];
  var modCell = table.rows[0].cells[3];
  var catCell = table.rows[0].cells[4];

  var button1 = "sortButton glyphicon glyphicon-triangle-bottom";
  var button2 = "glyphicon glyphicon-remove";

  // Create the sorting buttons
  var titleSort = document.createElement("button");
  var descriptionSort = document.createElement("button");
  var groupSort = document.createElement("button");
  var modifiedSort = document.createElement("button");
  var categorySort = document.createElement("button");
  var deleteTable = document.createElement("button");

  //Assign classes to the sorting buttons
  titleSort.setAttribute("class", button1);
  descriptionSort.setAttribute("class", button1);
  groupSort.setAttribute("class", button1);
  modifiedSort.setAttribute("class", button1);
  categorySort.setAttribute("class", button1);
  deleteTable.setAttribute("class", button2);
  deleteTable.setAttribute("id", "deleteTableBtn");

  titleSort.onclick = function(titleSort){
    tableName = this.closest("table").id;
    sortAlphabet(tableName, 0);
  }
  descriptionSort.onclick = function(descriptionSort){
    tableName = this.closest("table").id;
    sortAlphabet(tableName, 1);
  }
  groupSort.onclick = function(groupSort){
    tableName = this.closest("table").id;
    sortAlphabet(tableName, 2);
  }
  modifiedSort.onclick = function(modifiedSort){
    tableName = this.closest("table").id;
    sortLastModified(tableName);
  }
  categorySort.onclick = function(categorySort){
    tableName = this.closest("table").id;
    sortCategory(tableName);
  }

  // append buttons to cell
  titleCell.appendChild(titleSort);
  descCell.appendChild(descriptionSort);
  groupCell.appendChild(groupSort);
  modCell.appendChild(modifiedSort);
  catCell.appendChild(categorySort);

  wrapperHeader.append(deleteTable);
}
/* End populating/setting up tables */

/* Reordering tables modal */
$("#reorder").click(function(e) {
  e.preventDefault();

  // instantiate new modal
  var modal = new tingle.modal({
    footer: true,
    stickyFooter: true,
    closeMethods: ['overlay', 'button', 'escape'],
    closeLabel: "Close",
    //cssClass: ['custom-class-1', 'custom-class-2'],
    onOpen: function() {
      draggableRows(GROUP_SORTABLE_CLASS);
      $('#reorder').prop('disabled', true);
    },
    onClose: function() {
    },
    beforeClose: function() {
      $('#reorder').prop('disabled', false);
      return true; // close the modal
    }
  });

  // set content
  modal.setContent('<h3>Reorder Tables</h3>');

  var table = listTables(0);
  modal.setContent(table);

  $("#addTable").click(function(e) {
    e.preventDefault();

    var table = document.getElementById("names");
    if(table) {
      modal.setContent('<h3>Reorder Tables</h3>');

      var table = listTables();
      modal.setContent(table);
      draggableRows(GROUP_SORTABLE_CLASS);
    }
  });

  // CANCEL
  modal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--primary', function() {
    user.tempTables = new Array();
    modal.close();
  });

  // SAVE: reorder tables
  modal.addFooterBtn('Save', 'tingle-btn tingle-btn--danger', function() {
    finalizeTempTable();
    var tableIDsNewOrder = listTables(1);

    let tables = user.tables;
    for(let i = 0; i < tables.length - 1; i++){
      let id = wrapperPrefix + (tables[i].id);
      let id2 = wrapperPrefix + (tables[i + 1].id);
      $("#" + id).after($("#" + id2));
      updateGroupPosition(user.databaseID, tables[i]);
    }
    draggableRows(GROUP_SORTABLE_CLASS);
    modal.close();
    updateFilters();
  });

  // open modal
  modal.open();
});

function finalizeTempTable(){
  for(let i = 0; i < user.tempTables.length; i++){
    user.tempTables[i].position = i;
  }
  user.tables = user.tempTables;
  user.tempTables = new Array();
}

function egg() {
  var egg = new Egg();
  egg
    .addCode("b,o,b", function() {
      jQuery('#egggif').fadeIn(500, function() {
        window.setTimeout(function() { jQuery('#egggif').hide(); }, 5000);
      });
    })
    .addHook(function(){
      document.body.style.backgroundImage = "url('js/parrot.gif')";
    }).listen();
}

function listTables(bool) {

  // Get the names of all tables
  //var tables = document.getElementsByClassName('tables');

  var tableNames = [];
  if(bool == 0) {
    for(var i = 0; i < user.tables.length; i++) {
      var name = user.tables[i].name;
      name = name.charAt(0).toUpperCase() + name.substring(1);
      tableNames.push(name);
    }
  }
  if(bool == 1) {
    for(var i = 0; i < user.tables.length; i++) {
      var id = user.tables[i].id;
      tableNames.push(id);
    }
    return tableNames;
  }

  // Create table structure
  var table = document.createElement("TABLE");
  var head = document.createElement("thead");
  var body = document.createElement("tbody");

  row = document.createElement("tr");
  titleCell = document.createElement("th");

  // text for cell
  textNode1 = document.createTextNode("Table Title");
  titleCell.appendChild(textNode1);
  row.appendChild(titleCell);

  // Name elements
  table.setAttribute("id", "names");
  body.setAttribute("class", GROUP_SORTABLE_CLASS);
  row.setAttribute("id", "firstRow");
  titleCell.setAttribute("id", "titleCell");

  // append row to table/body
  head.appendChild(row);
  table.appendChild(head);
  table.appendChild(body);

  for(var j = 0; j < tableNames.length; j++) {

    //create row and cell element
    row = document.createElement("tr");
    titleCell = document.createElement("td");

    // Name elements
    row.setAttribute("class", "notFirst");
    row.setAttribute("databaseID", user.tables[j].id);
    titleCell.setAttribute("id", "titleCell");

    // text for cell
    //var str = (tableNames[j]).split("_").join(" ");
    textNode1 = document.createTextNode(tableNames[j]);
    titleCell.appendChild(textNode1);
    row.appendChild(titleCell);
    body.appendChild(row);
  }
  return table;
}
/* End modal */

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
}

function isNotUsingHTTPS(){
  return window.location.protocol != 'https:'
}

function redirectToHTTPS() {
    window.location.assign('https://' + window.location.hostname);
}

function saveTokenFromURL() {
  saveTrelloTokenFromURL();
  saveZendeskTokenFromURL();
}

function saveTrelloTokenFromURL() {
  var url = window.location.href;
  var tokenString = "#token=";

  if (!url.includes(tokenString)) {
    return;
  }

  var tokenStart = url.indexOf(tokenString) + tokenString.length;
  token = url.substring(tokenStart);
  localStorage["trelloToken"] = token;
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
  localStorage["zendeskToken"] = token;
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
      if(error.status == 401){
        localStorage.removeItem("zendeskToken");
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
  // TODO Trevor: Looking into more efficient loaing from APIs
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
  //TODO trevor
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
      error: function(data) {
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
////////////////////////////////////////////////////////////////////////////////

/*-------------------- THEME CHANGE ------------------*/

$("#changeThemeBtn").click(function() {
  var mainTheme = "css/main.css";
  var nightTheme = "css/night.css";
  var currentTheme = $('#main_style').attr("href");

  if (currentTheme === mainTheme)
  {
    $("#main_style").attr("href", nightTheme);
    $("#logo").attr("src", "images/logo-invert.png");
  }
  else
  {
    $("#main_style").attr("href", mainTheme);
    $("#logo").attr("src", "images/logo.png");
  }
  filterAll();
  currentTheme = $('#main_style').attr("href");
});

/* ------------------ END THEME CHANGE ------------------ */

/* ------------------ TICKET PANEL ------------------ */

/* Helper method that creates the card div */
function createTicketCard(task)
{
  var newCard = document.createElement("div");
  var cardTitle = task.name;
  var cardDesc = task.desc;
  var cardIndex = task.id;
  var status = task.category.charAt(0).toUpperCase() + task.category.substring(1);
  var date = formatDate(task.lastModified);
  var type = task.type;

  if (type === 1)
  {
    var url = ZEN_TICKET_URL + task.id;
  }
  else
  {
    var url = task.url;
  }

  newCard.id = cardIndex;
  newCard.setAttribute("class", "panel panel-default");
  newCard.setAttribute("id", cardIndex);

  // Header
  var panelHead = document.createElement("div");

  panelHead.setAttribute("class", "panel-heading");

  // Title
  var panelTitle = document.createElement("h3");
  var removeIcon = document.createElement("i");
  var link = document.createElement("a");

  removeIcon.setAttribute("class", "glyphicon glyphicon-remove-sign");
  removeIcon.setAttribute("aria-hidden", "true");
  link.setAttribute("target", "_blank");
  link.setAttribute("href", url);
  link.innerHTML = cardTitle;
  panelTitle.setAttribute("class", "panel-title");

  panelTitle.appendChild(removeIcon);
  panelTitle.appendChild(link);
  panelHead.appendChild(panelTitle);

  // Body
  var body = document.createElement("div");

  body.setAttribute("class", "panel-body");
  body.innerHTML =  "<strong>Status: </strong> " + status + " <br>" +
    "<strong>Last Modified: </strong> " + date;

  // Zendesk Requester Info
  if (task.requester)
  {
    var requester = task.requester.name;
    var reqEmail = task.requester.email;

    body.innerHTML += "<br> <strong>Requester: </strong>" + requester + " <br>" +
      "<strong>Requester's Email: </strong>" + reqEmail + " <br><br>";
  }
  else
  {
    body.innerHTML += "<br><br>";
  }

  body.innerHTML += '<strong>Description</strong> <hr><p>' + cardDesc + '</p>';

  newCard.appendChild(panelHead);
  newCard.appendChild(body);

  document.getElementById("card-list").appendChild(newCard);
  $("#" + cardIndex).addClass("animated fadeInRight");
  $(".panel-body p").readmore({
    speed: 200,
  });
  newCard.scrollIntoView();
}

/* Clicking on table rows will open ticket panel view
   and creates a ticket card */
$(".main").on("click", "table > tbody > tr", function(e)
{
  e.preventDefault();
  var isClosed = true;

  if (isClosed == true)
  {
    isClosed = false;
    $(".info-panel").addClass("toggled");
    $("#openInfo").text("Close Ticket Panel");
    $(".scrollTop").addClass("toggled");
  }

  // Check if card id exists in set
  var $groupID = extractGroupID($(this).closest("table").attr("id"));
  var ticketGroup = user.getTableByID($groupID);
  var taskID = this.id;
  var task = ticketGroup.getRowByID(taskID);

  if (cardsCreated.has(taskID)) {
    $.notify({
      icon: "fa fa-exclamation-triangle",
      message: "Ticket already queued."
    }, {
      type: "warning",
    });

    return;
  }
  else {
    cardsCreated.add(taskID);
    createTicketCard(task);

    $.notify({
      icon: "fa fa-check",
      message: "Ticket queued."
    }, {
      type: "success",
    });
  }
});

/* Click event listener for openInfo to toggle the ticket panel view */
$("#openInfo").click(function(e)
{
  e.preventDefault();
  $(".info-panel").toggleClass("toggled");
  $(".scrollTop").toggleClass("toggled");

    if ($(this).text() === "Open Ticket Panel")
    {
      $(this).text("Close Ticket Panel");
    }
    else
    {
      $(this).text("Open Ticket Panel");
    }
});

/* Clears all ticket cards inside ticket panel */
$("#clearBtn").click(function()
{
  $("#card-list").empty();
  cardsCreated.clear();
});

/* Method that will delegate which ticket card is clicked and delete that
   particular card */
$(".info-panel").on("click", ".glyphicon-remove-sign", function(e)
{
  var card = $(this).closest(".panel-default");
  var index = card.attr("id");

  if (cardsCreated.has(index)) {
    cardsCreated.delete(index);
  }

  card.addClass("animated fadeOutRight");
  card.one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", function() {
    $(this).remove();
  });
});

/* ------------------ END OF TICKET PANEL ------------------ */
/*---------------------------------Search-------------------------------------*/

function search() {
  //Text typed in search.
  var searchFor = document.getElementsByClassName("form-control")[0].value;
  //Tables of tasks.
  var tables = document.getElementsByTagName("table");
  var rows;
  var currentRow, items, i, j, td;
  //Go through the rows of each table.
  for (j = 0; j < tables.length; j++) {
    rows = tables[j].getElementsByTagName("TR");
    //Go through each individual section of each row.
    for (i = 1; i < rows.length; i++) {
      currentRow = rows[i]
      items = currentRow.getElementsByTagName("TD");
      //Check if the section contains the search.
      for (td = 0; td < items.length; td++) {
        //If found, ignore current row.
        if (items[td].innerHTML.toLowerCase().includes(searchFor.toLowerCase())) {
          currentRow.style.display = "table-row";
          break;
        }
        //If not found, hide said row.
        if (td == items.length - 1 && currentRow.style.display != "none")
          $(currentRow).toggle();
      }
    }
  }
  hideTables();
  return false; //Used to disable submitting.
}
/*------------------------------End of Search---------------------------------*/
/*------------------------------Hiding table----------------------------------*/
function hideTables(){
  var tables = document.getElementsByTagName("table");
  var wrapper;

  //Go through each table, if it's elements are hidden, hide it. If not, show.
  for(var i = 0; i < tables.length; i++){
    wrapperID ="#wrapper_" + $(tables[i]).attr("id").slice(6);

    if(isTableHidden(tables[i])) {
      $(wrapperID).hide();
    }
    else {
      $(wrapperID).show();
    }
  }
}

function isTableHidden(table){
  //Body of the table passed in.
  var tableBody = table.getElementsByTagName("TBODY")[0];
  //Rows of the body.
  var bodyRows = tableBody.getElementsByTagName("TR");
  /*Go through the rows, checking if they are shown. Return whether all the
    table's rows are hidden.*/
  for(var i = 0; i < bodyRows.length; i++)
  {
    if(bodyRows[i].style.display == "table-row" || bodyRows[i].style.display == "")
      return false;
  }
  return true;
}
/*---------------------------End of Hiding table------------------------------*/

/*----------------------------Collapsable Menu--------------------------------*/
$(document).on('click', '.navbar-collapse.in',function(e) {
    if( ($(e.target).is('button') || $(e.target).is('a'))
      && $(e.target).attr('class') != 'dropdown-toggle' )
    {
        $(this).collapse('hide');
    }
});

function extractGroupID(idAttribute) {
  var startIndex = idAttribute.indexOf("_");

  if (startIndex === -1)
    return;

  var groupID = idAttribute.substr(++startIndex);
  return groupID;
}
