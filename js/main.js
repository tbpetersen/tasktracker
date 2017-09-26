const ZEN_AUTH_URL = "https://sdsc.zendesk.com/oauth/authorizations/new?response_type=token&client_id=client_services_tool_dev&scope=read%20write";
const TRE_AUTH_URL = "https://trello.com/1/authorize?name=Zello&key=8886ef1a1bc5ad08caad020068a3f9a2&callback_method=fragment&return_url=https://localhost&scope=read,account";

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
  constructor(name, id){
    this.name = name;
    this.id = id;
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
  setupPage();

  Promise.resolve()

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
    //createFilters();
    createTablesFromTableObject();
    //return populatePage();
  })
});

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
  var table = $(this).parent().next();

  if((table[0].id === "Unsorted") && !(isEmpty(table))) {
    deleteUnsorted();
    return;
  }

  if (isEmpty(table))
  {
    deleteTable(table);
    return;
  }
  deleteTablePrompt(table);
});

function storeDataFromTableObjects(){
  //TODO
  return Promise.resolve();
}

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

function createBackingTable(){
  user.tables[0] = new Table("Test 0", 0);
  user.tables[1] = new Table("Test 1", 1);
  for(let i = 0; i < user.tasks.length; i++){
    user.tables[i%2].addRow(user.tasks[i]);
  }
}

function loadUsersItemsFromDB(){
  return Promise.resolve()

  .then(function(){
    return getAllGroups(user.databaseID);
  })

  .then(function(groups){
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
  console.log(tables);

  // create each table by iterating through tables list
  for(i = 0; i < tables.length; i++) {
    var table = tables[i];
    createTable(table, false);
    //createTable(table.id, false);

   // populate each table by accessing rows in each table
    for(j = 0; j < table.rows.length; j++) {
      populateTable(table.rows[j], table.id, j);
    }
    draggableRows(ITEM_SORTABLE_CLASS);
  }
}


function createTablesFromDPandAPI(dbData, tasks){
  let tables = createTablesFromGroups(dbData, tasks);
  user.tables = tables;
  return Promise.resolve();
}

function createTablesFromGroups(groups, tasks){
  let tables = new Array();
  for(let i = 0; i < groups.length; i++){
    let group = groups[i];
    let table = new Table(group.name, group.id);

    for(let j = 0; j < group.items.length; j++){
      let item = group.items[j];
      task = getTaskByID(item.itemID)
      if(task != null){
        table.addRow(task);
      }
    }

    tables.push(table);
  }
  let unsortedTable = getUnsortedTable(tasks, groups);
  tables.push(unsortedTable);
  return tables;
}

function getUnsortedTable(tasks, groups){
  let table = new Table('Unsorted', unsortedID);
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
  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];
    var catID = task.category;

    // Check if category table already exists
    if ( cat[catID] == null) {
      user.tables.push(new Table(task.category, catID));
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

/*Creates a new table with a random ID, as it cannot be coded to have it
  dynamically created if it isn"t random.*/
var tableNumber = -1;
function createNewTable() {
  $.notify({
    icon: "glyphicon glyphicon-plus-sign",
    message: "Table created."
  }, {
    type: "info",
  });

  var tableID = "New_Table_" + tableNumber;
  let tableObject = new Table(tableID, -1/*, user.tables.length*/);
  user.tables.push(tableObject);
  addUserGroupToDB(user.databaseID, tableObject).then(function(){
    tableObject.name = "New_Table_" + tableObject.id;
    updateGroupName(user.databaseID, tableObject).then(function(){
      tableID = tableObject.name;
      createTable(tableObject, true); // Create a table with a random ID;
      $("#" + tableID).find("tbody").addClass("place");
      updateFilters();
      draggableRows(ITEM_SORTABLE_CLASS);
      window.scrollTo(0, document.body.scrollHeight);
      tableNumber--;
    });
  });

}

function deleteTable(tableName) {

  if(!isEmpty(tableName)) {

    // If unsorted table doesn't already exist, create it
    if(document.getElementById("Unsorted") == null) {
      createTable("Unsorted", false);
    }

    // For when unsorted table is empty but still exists & table being deleted
    // is not empty, remove 'place' class before adding new rows
    $("#Unsorted").find("tbody").removeClass("place");

    // For each row, make a new Task and create a row for it in the unsorted table
    var info = tableName[0].tBodies[0].rows;
    for(var i = 0; i < info.length; i++) {
      var task = {
        name: info[i].cells[0].innerHTML,
        desc: info[i].cells[1].innerHTML,
        lastModified: info[i].cells[2].innerHTML,
        category: info[i].cells[3].innerHTML,
        id: info[i].id
      }

      // Make row
      var unsortedTable = document.getElementById("Unsorted");
      addRow(task, unsortedTable, task.id);
    }
    draggableRows(ITEM_SORTABLE_CLASS);
  }

  // Delete wrapper and table
  // var wrapperName = tableName[0].id + wrapperSuffix;
  var wrapperName = tableName.parent().attr("id");
  var wrapper = document.getElementById(wrapperName);

  tableName.remove();
  wrapper.remove();

  $.notify({
    icon: "fa fa-trash",
    message: "Table deleted."
  }, {
    type: "danger",
  });
  updateFilters();
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
      // console.log(groups);
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

    // for (var i = 0; i < user.tasks.length; i++) {
    //   task = user.tasks[i];
    //   var str = task.category.split(" ").join("_");
    //   var catName = str.charAt(0).toUpperCase() + str.substring(1);
    //   if (!cat.includes(catName)) {
    //     cat.push(catName);
    //   }
    //   if (document.getElementById(catName) == null) {
    //     createTable(catName, false);
    //   }
    //   populateTable(task, catName, i);
    // }
  });

}

// function createTable(tableName, isNewTable) {
  function createTable(tableObj, isNewTable) {

  // console.log(table);
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
  //TODO
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
      filterAll(); // TODO THIS IS A TEMP FIX. Renaming them causes them to stay selected but the buttons become unhighlighted. Temp fix implemented to filter all when focus out.
    });

    $input.on("input", function(){
      if(this.value.length === 1 && this.value !== this.value.toUpperCase())
        this.value = this.value.charAt(0).toUpperCase();
    });

    $title.replaceWith($input);

    var save = function() {
      var $titleStr = $('<h3 id="tableTitle" />').text( $input.val() );
      var $closedInput = $input.val().split(" ").join("_");
      var $id = $closedInput + wrapperSuffix;

      // Update table and wrapper ID
      $table.attr("id", $closedInput);
      $tableWrapper.attr("id", $id);
      $input.replaceWith($titleStr);
    };

    // Enter key exits form
    $input.keyup(function(e) {
      ++numKeyPress;

      if (e.which === 13 || e.which === 27) {
        //Get the name of the table that you are currently working with.
        var table = this.parentNode.parentNode.id;
        table = table.substring(0, table.indexOf("_table"));
        table = table.split("_").join(" ");
        //Check if the new table name is the same as others.
        if (numKeyPress > 1 && getFilters().includes(this.value)
          && this.value !== table) {
          alert("Please rename this table as there is already one with the name \""
            + this.value + "\"");
          this.value = inputText;
        }
        else {
          keyPressed = 0;
          updateFilters();
          $input.blur();
          return;
        }
      }
    }
  )};

  /** Avoid callbacks leftovers taking memory when input disappears
      after clicking away
  */
  $input.one('blur', save).focus();
});

$(".navbar-toggle").on("focusout", function(){
  console.log("Close the links");
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
  row.setAttribute("id", index);
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
  // console.log("Table: " + tableName + "----------------------");
  // console.log(body);
  // console.log(row);
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

  console.log(htmlTable)
  let table = user.getTableByID(tableID);
  //TODO update position of all items in group
}

function onTablePositionUpdated(event, ui){
  let table = event.target.parentNode;
  console.log('table');
  //TODO Paul
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

  var table = listTables();
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
    modal.close();
  });

  // SAVE: reorder tables
  modal.addFooterBtn('Save', 'tingle-btn tingle-btn--danger', function() {
    var table = document.getElementById("names");

    for(var i = 1; i < table.rows.length - 1; i++) {
      var id = (table.rows[i].cells[0].innerHTML).split(" ").join("_") + wrapperSuffix;
      var id2 = (table.rows[i + 1].cells[0].innerHTML).split(" ").join("_") + wrapperSuffix;

      $("#" + id).after($("#" + id2));
      draggableRows(GROUP_SORTABLE_CLASS);
    }
    modal.close();
    updateFilters();
  });

  // open modal
  modal.open();
});

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

function listTables() {

  // Get the names of all tables
  var tables = document.getElementsByClassName('tables');
  var tableNames = [];
  for(var i = 0; i < tables.length; i++) {
    tableNames.push(tables[i].id);
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
  table.appendChild(body)

  for(var j = 0; j < tableNames.length; j++) {

    //create row and cell element
    row = document.createElement("tr");
    titleCell = document.createElement("td");

    // Name elements
    row.setAttribute("class", "notFirst");
    titleCell.setAttribute("id", "titleCell");

    // text for cell
    var str = (tableNames[j]).split("_").join(" ");
    textNode1 = document.createTextNode(str);
    titleCell.appendChild(textNode1);
    row.appendChild(titleCell);
    body.appendChild(row);
  }
  return table;
}
/* End modal */

function setupPage() {
  if (!redirectToHTTPS()) {
    getTokens();
    instantiateUser();
  }
}

function instantiateUser() {
  user = new Object();
  user.trello = new Object();
  user.zendesk = new Object();
  user.tables = new Array();

  user.getTableByID = function(tableID){
    for(let i = 0; i < user.tables.length; i++){
      let table = user.tables[i];
      if(table.id == tableID){
        return table;
      }
    }
    return null;
  }
}

function redirectToHTTPS() {
  if (window.location.protocol != 'https:') {
    window.location.assign('https://' + window.location.hostname);
    return true;
  }
  return false;
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

function getTokens() {
  saveTokenFromURL();
  getZendeskToken();
  getTrelloToken();
}

function getZendeskToken() {
  zendeskToken = localStorage.getItem("zendeskToken");
  if (zendeskToken == undefined) {
    redirectToZendeskLogin();
  }
}

function getTrelloToken() {
  trelloToken = localStorage.getItem("trelloToken");
  if (trelloToken == undefined) {
    redirectToTrelloLogin();
  }
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
  return new Promise(function(resolve, reject) {
    let trelloCards = getTrelloCards();
    let zendeskTickets = getZendeskTickets();

    Promise.all([trelloCards, zendeskTickets]).then(function(data) {
      resolve([data[0], data[1].results]);
    });
  });
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
  //return zendeskGet("search.json?query=type:ticket status<solved assignee_id:" + user.zendesk.id);
  return zendeskGet("search.json?query=type:ticket status<solved");
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

function trelloGet(url) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      type: "GET",
      url: TRE_API_URL + url + "?token=" + trelloToken + "&key=" + TRE_APP_KEY,
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

/* ------------------ SORT FILTERS ------------------ */
/*Sorting is done using bubble sort. Hopefully implement a better algorithm in
  the future.*/

/*Sort the data alphabetically*/
var alphabetForwards = false;

function sortAlphabet(tableName, index) {
  if (alphabetForwards) {
    sortAlphabetReverse(tableName, index);
    alphabetForwards = false;
    return;
  }
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById(tableName);
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length-1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[index];
      y = rows[i + 1].getElementsByTagName("TD")[index];
      // check if the two rows should switch place:
      if (x.innerText.toLowerCase() > y.innerText.toLowerCase()) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
  alphabetForwards = true;
}


/*Sort the data alphabetically reversed*/
function sortAlphabetReverse(tableName, index) {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById(tableName);
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length-1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[index];
      y = rows[i + 1].getElementsByTagName("TD")[index];
      // check if the two rows should switch place:
      if (x.innerText.toLowerCase() < y.innerText.toLowerCase()) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

/*Sort the data by due date*/
function sortDueDate() {

}

/*Sort the data by date*/
function sortStartDate() {

}

/*Sort the data by Category*/
var categoryForwards = false;

function sortCategory(tableName) {
  if (categoryForwards) {
    sortCategoryReverse(tableName);
    categoryForwards = false;
    return;
  }
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById(tableName);
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[4];
      y = rows[i + 1].getElementsByTagName("TD")[4];
      //check if the two rows should switch place:
      if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
  categoryForwards = true;
}

function sortCategoryReverse(tableName) {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById(tableName);
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[4];
      y = rows[i + 1].getElementsByTagName("TD")[4];
      //check if the two rows should switch place:
      if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

/*Sort by the latest modified first*/
var lastModifiedForwards = false;

function sortLastModified(tableName) {
  if (lastModifiedForwards) {
    sortlastModifiedReversed(tableName);
    lastModifiedForwards = false;
    return;
  }
  var table, rows, switching, i, x, y, shouldSwitch;
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept",
    "Oct", "Nov", "Dec"
  ];
  table = document.getElementById(tableName);
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[3];
      y = rows[i + 1].getElementsByTagName("TD")[3];
      //check if the two rows should switch place:
      var month = x.innerHTML.substring(0, 3);
      var month2 = y.innerHTML.substring(0, 3);
      var date = x.innerHTML.substring(4);
      var date2 = y.innerHTML.substring(4);
      if (months.indexOf(month) > months.indexOf(month2) &&
        months.indexOf(month) != months.indexOf(month2)) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      } else if (months.indexOf(month) == months.indexOf(month2) &&
        date.toLowerCase() > date2.toLowerCase()) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
  lastModifiedForwards = true;
}

/*Sort by the latest modified last*/
function sortlastModifiedReversed(tableName) {
  var table, rows, switching, i, x, y, shouldSwitch;
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept",
    "Oct", "Nov", "Dec"
  ];
  table = document.getElementById(tableName);
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[3];
      y = rows[i + 1].getElementsByTagName("TD")[3];
      //check if the two rows should switch place:
      var month = x.innerHTML.substring(0, 3);
      var month2 = y.innerHTML.substring(0, 3);
      var date = x.innerHTML.substring(4);
      var date2 = y.innerHTML.substring(4);
      if (months.indexOf(month) < months.indexOf(month2) &&
        months.indexOf(month) != months.indexOf(month2)) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      } else if (months.indexOf(month) == months.indexOf(month2) &&
        date.toLowerCase() < date2.toLowerCase()) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

/* ------------------ END OF SORT FILTERS ------------------ */

/* ------------------ FILTER PANEL ------------------ */

/*Open the filter pannel and move the screen with it.*/
function openLeft() {
  var body = document.getElementById("main");
  var sideBar = document.getElementById("leftSidebar");
  var openButton = document.getElementById("leftOpenButton");
  body.style.marginLeft = "10%";
  setTimeout(function() {
    sideBar.style.display = "block";
    sideBar.style.width = "10%";
  }, 300);
  openButton.style.opacity = 0;
}

/*Close the filter pannel and move the screen with it.*/
function closeLeft() {
  var body = document.getElementById("main");
  var sideBar = document.getElementById("leftSidebar");
  var openButton = document.getElementById("leftOpenButton");
  sideBar.style.display = "none";
  body.style.width = "100%";
  body.style.marginLeft = "0%";
  openButton.style.opacity = 1;
}

/* ------------------ END OF FILTER PANEL ------------------ */

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
function createTicketCard(cardIndex)
{
  var newCard = document.createElement("div");
  var task = user.tasks[cardIndex];
  var cardTitle = task.name;
  var cardDesc = task.desc;
  var status = task.category.charAt(0).toUpperCase() + task.category.substring(1);
  var date = formatDate(task.lastModified);
  var type = task.type;

  if (type === 1)
  {
    var id = task.id;
    var url = ZEN_TICKET_URL + id;
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
  event.preventDefault();
  var isClosed = true;

  if (isClosed == true)
  {
    isClosed = false;
    $(".info-panel").addClass("toggled");
    $("#openInfo").text("Close Ticket Panel");
    $(".scrollTop").addClass("toggled");
  }

  // Check if card id exists in set
  if (cardsCreated.has(this.id)) {
    $.notify({
      icon: "fa fa-exclamation-triangle",
      message: "Ticket already queued."
    }, {
      type: "warning",
    });

    return;
  }
  else {
    cardsCreated.add(this.id);
    createTicketCard(this.id);

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
/*--------------------------------Filters-------------------------------------*/
function createFilters(){
  var filters = getFilters();
  var i;

  createFilterButton("View All");
  for(i = 0; i < filters.length; i++){
    createFilterButton(filters[i]);
  }

}

function createFilterButton(filter){
  var leftSidebar = document.getElementById("leftSidebar");
  var newFilter = document.createElement("button");
  filter = filter.charAt(0).toUpperCase() + filter.slice(1);
  newFilter.setAttribute("id", "filter " + filter);
  newFilter.setAttribute("class", "leftSidebarItem btn");
  newFilter.setAttribute("onclick", "filterBy(this.id)");
  newFilter.innerText = filter;
  leftSidebar.appendChild(newFilter);
}
var onPageLoad = true;
function getFilters(){//Most likely will change when we implement database
  var categories = [];
  var i;
  if(onPageLoad){
    var tasks = user.tasks;
    var currentCategory;
    for(i = 0; i < tasks.length; i++)
    {
      currentCategory = tasks[i].category.charAt(0).toUpperCase() + tasks[i].category.substring(1);
      if(!categories.includes(currentCategory))
      {
        categories.push(currentCategory);
      }
    }
    onPageLoad = false;
  }else{
    var leftSidebar = $("#leftSidebar");
    var buttons = leftSidebar[0].getElementsByTagName("BUTTON")
    for(i = 1; i < buttons.length; i++){
      categories.push(buttons[i].id.substring(buttons[i].id.indexOf(" ") + 1));
    }
  }
  return categories;
}

function updateFilters(){
  var currentNode;
  var tables = document.getElementsByTagName("table");
  clearFilters();
  // createFilterButton("View All");
  $('.wrapper-header').each(function(){
    currentNode = this.childNodes[0];
    if(currentNode.tagName === "INPUT")
      createFilterButton(currentNode.value)
    else
      createFilterButton(currentNode.innerHTML);
  });
}

function clearFilters(){
  var sideBar = document.getElementById("leftSidebar");
  var filters = sideBar.getElementsByTagName("button");
  $(filters).remove();
}

function filterBy(buttonID) {
  var category = document.getElementById(buttonID).innerHTML;
  var button = document.getElementById(buttonID);
  var include = true;
  if (button.style.backgroundColor == "lightgrey" || button.style.backgroundColor == "rgb(23, 23, 23)")
    include= false;
  //If View All is slected, reset everything to the defualt.
  if (category == "View All") {
    filterAll();
    return;
  }
  //Filter based on the button and whether it should be included or excluded.
  filter(button, buttonID, include);
  if(!checkFilterAll())
    hideTables();
}

function filter(button, buttonID, include) {
  var nightTheme = "css/night.css";
  var currentTheme = $('#main_style').attr("href");

  var table, tableIDReal, currentRow, i, j;
  var whitesmoke = "#F5F5F5";
  var nightDark = "#171717";
  var nightLight = "#212121";
  var category = document.getElementById(buttonID).innerHTML;
  var currentRowHTML;
  var mainTheme = "css/main.css";
  var nightTheme = "css/night.css";
  var currTheme = $('#main_style').attr("href");

  tables = document.getElementsByTagName("table");
  var buttonColor = button.style.backgroundColor;

  for (i = 0; i < tables.length; i++) { // Grab each table.
    currentTable = tables[i];
    if(currentTable.id !== "names"){
      tableIDReal = currentTable.id;
      //Hide unwanted tables.
      if(include)
        filterIn(tableIDReal, button)
      else
        filterOut(tableIDReal, button)
    }
  }
  //Change the backgorund color of the buttons when they're selected.
  if(nightTheme === currentTheme){
    if (button.style.backgroundColor === "rgb(23, 23, 23)")
      // button.style.backgroundColor = nightLight;
      button.style.backgroundColor = "";
    else
      button.style.backgroundColor = nightDark;
  }
  else{
    if (button.style.backgroundColor == "lightgrey")
      // button.style.backgroundColor = whitesmoke;
      button.style.backgroundColor = "";
    else
      button.style.backgroundColor = "lightgrey";
  }
}

function checkFilterAll() {
  var table, i, j, filterBar;
  filterBar = document.getElementById("leftSidebar");
  var buttons = filterBar.getElementsByTagName("BUTTON");
  for (i = 0; i < buttons.length; i++) {
    //Check if any of the filter buttons are selected.
    if (buttons[i].style.backgroundColor == "lightgrey" || buttons[i].style.backgroundColor == "rgb(23, 23, 23)")
      return false;
  }
  filterAll();
  return true;
}

function filterAll() {
  var nightTheme = "css/night.css";
  var currentTheme = $('#main_style').attr("href");
  nightTheme = nightTheme === currentTheme;
  var tables, i, currentRow, filterBar;
  var whitesmoke = "#F5F5F5";
  filterBar = document.getElementById("leftSidebar");
  var buttons = filterBar.getElementsByTagName("BUTTON");
  //If the Filter All button was pressed, change the button colors to default.
  for (i = 0; i < buttons.length; i++){
    if(nightTheme)
      // buttons[i].style.backgroundColor = "#212121";
      buttons[i].style.backgroundColor = "";
    else
      // buttons[i].style.backgroundColor = whitesmoke;
      buttons[i].style.backgroundColor = "";
  }

  tables = document.getElementsByTagName("table");
  //Get the TR tags from the table.
  for (i = 0; i < tables.length; i++) {
    if(tables[i].id !== "names")
      filterInTable(tables[i].id);
  }
}

function filterIn(tableIDReal, button){
  //Remove underscores
  var tableID = tableIDReal.split("_").join(" ");
  //Hide unwanted tables.
  if(!isGrey(tableID) && tableID !== button.innerHTML){
      filterOutTable(tableIDReal);
    }
  //Show wanted tables.
  else {
    filterInTable(tableIDReal);
  }
}

function filterOut(tableIDReal, button){
  //Remove underscores.
  var tableID = tableIDReal.split("_").join(" ");
  //Show wanted tables.
  if(isGrey(tableID) && tableID !== button.innerHTML){
      filterInTable(tableIDReal);
    }
  //Hide uwanted tables.
  else{
    filterOutTable(tableIDReal);
  }
}


function filterOutTable(tableID){
  //Loop through each row and hide it.
  $('#' + tableID + ' > tbody  > tr').each(function(){
    $(this).hide();
  });
}

function filterInTable(tableID){
  //Show the current table.
  document.getElementById(tableID + "_table").style.display = "block";
  //Loop through each row and show it.
  $('#' + tableID + ' > tbody  > tr').each(function(){
    $(this).show();
  });
}

function isGrey(table){
  //Get the background color of the row.
  var buttonColor = document.getElementById("filter " + table).style.backgroundColor;
  //Is the background ofthe button grey?
  if(buttonColor == "lightgrey" || buttonColor == "rgb(23, 23, 23)")
    return true;
  return false;
}
/*-----------------------------End of Filtering-------------------------------*/
/*---------------------------------Search-------------------------------------*/

function search() {
  //Text typed in search.
  var searchFor = document.getElementsByClassName("form-control")[0].value;
  if(searchFor === ""){
    return filterAll();
  }
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
    wrapperID ="#" + $(tables[i]).attr("id") + wrapperSuffix;

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
