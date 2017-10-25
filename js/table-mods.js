// Event listener for changing table titles
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
      filterAll(); // TODO THIS IS A TEMP FIX. Renaming them causes them to stay
                  // selected but the buttons become unhighlighted. Temp fix implemented
                  // to filter all when focus out.
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


// Event listener for deleting table modal popup
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

// Event listener for clicking the sdsc logo
$(document).on("click", "#logo", showRedirectToHostModal);

function showRedirectToHostModal(){
  $("#redirectToHostModal").modal("show");
  $("#redirectToHostModal").unbind("keyup");


  // Enter keypress for 'Okay'
  $('#redirectToHostModal').keyup(function (e) {
    e.preventDefault();

    var key = e.which;
    if (key == 13) {  // the enter key code
      redirectToHost();
    }
  });
}

// Modal for showing deleting table warning
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

// Modal for deleting unsorted warning
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


// Method to delete table and table wrappers as well as removing deleted group from db
function deleteTable(tableObj) {
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


// Helper method to list all tables for reordering modal
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

function redirectToHost(){
  window.location.assign('https://' + window.location.hostname);
}
