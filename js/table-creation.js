const wrapperPrefix = "wrapper_";
const tablePrefix = "table_";

// Helper method - check if table is empty
function isEmpty(tableName) {
  var tableLength = $(tableName).find("tbody > tr").length;
  if (tableLength < 1)
    return true;
  return false;
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

  var tableID = "New Table " + tableNumber;
  let tableObject = new Table(tableID, -1, user.tables.length);

  user.tables.push(tableObject);
  addUserGroupToDB(user.databaseID, tableObject).then(function(){
    tableObject.name = "New Table " + tableObject.id;
    updateGroupName(user.databaseID, tableObject).then(function(){
      tableID = tablePrefix + tableObject.id;
      createTable(tableObject, true); // Create a table with a random ID;
      $("#" + tableID).find("tbody").addClass("place");
      updateFilters();
      draggableRows(ITEM_SORTABLE_CLASS);
      window.scrollTo(0, document.body.scrollHeight);
      tableNumber--;
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
    console.log("here");
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

/* -------------------------- POPUATION OF TABLE CONTENT -------------------------- */

function populateTable(task, tableName, index) {
  var table = document.getElementById(tablePrefix + tableName);
  addRow(task, tableName, index);
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
  //TODO
  // Use the makrdown converter on descriptions
  //let markdownHTML = CONVERTER.makeHtml(shortDesc);
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
