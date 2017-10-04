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
function getFilters(){
  return user.tables.map(function(table){
    return table.name;
  })
}

function updateFilters(){
  var currentNode;
  var tables = document.getElementsByTagName("table");
  clearFilters();
  createFilterButton("View All");
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
    if(tables[i].id !== "names"){
      filterInTable(tables[i].id);
    }
  }
}

function filterIn(tableIDReal, button){
  //Hide unwanted tables.
  let tableName = getTableNameFromID(tableIDReal)
  if(!isGrey(tableIDReal) && tableName !== button.innerHTML){
      filterOutTable(tableIDReal);
    }
  //Show wanted tables.
  else {
    filterInTable(tableIDReal);
  }
}

function filterOut(tableIDReal, button){
  //Show wanted tables.
  let tableName = getTableNameFromID(tableIDReal)
  if(isGrey(tableIDReal) && tableName !== button.innerHTML){
      filterInTable(tableIDReal);
    }
  //Hide uwanted tables.
  else{
    filterOutTable(tableIDReal);
  }
}


function filterOutTable(table){
  let tableID = table.slice(6);
  //Loop through each row and hide it.
  $('#' + table + ' > tbody > tr').each(function(){
    $(this).hide();
  });
}

function filterInTable(table){
  let tableID = table.slice(6);
  //Show the current table.
  document.getElementById("wrapper_" + tableID).style.display = "block";
  //Loop through each row and show it.
  $('#' + table + ' > tbody > tr').each(function(){
    $(this).show();
  });
}

function isGrey(tableID){
  let table = getTableNameFromID(tableID);
  if(table == "Unsorted")
    return false;
  //Get the background color of the row.
  var buttonColor = document.getElementById("filter " + table).style.backgroundColor;
  //Is the background of the button grey?
  if(buttonColor == "lightgrey" || buttonColor == "rgb(23, 23, 23)")
    return true;
  return false;
}

function getTableNameFromID(tableID){
  let newID = document.getElementById(tableID).id.slice(6);
  return document.getElementById("wrapper_" + newID).firstChild.firstChild.innerHTML;
}
/*-----------------------------End of Filtering-------------------------------*/
