const ZEN_AUTH_URL = "https://sdsc.zendesk.com/oauth/authorizations/new?response_type=token&client_id=client_services_tool_dev&scope=read%20write";
const TRE_AUTH_URL = "https://trello.com/1/authorize?key=8886ef1a1bc5ad08caad020068a3f9a2&callback_method=fragment&return_url=https://localhost";

const ZEN_API_URL = "https://sdsc.zendesk.com/api/v2/";
const TRE_API_URL = "https://trello.com/1/";

const TRE_APP_KEY = "8886ef1a1bc5ad08caad020068a3f9a2";

var zendeskToken = "";
var trelloToken = "";
var user;
var isClosed = false;

var cardsCreated = new Set(); // Keeps track of ticket cards created - no dupes

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
      this.setCategory(this, data.idList);
    } else /* Zendesk*/ {
      this.name = data.subject;
      this.desc = data.description;
      this.lastModified = this.getTimeStampFromString(data.updated_at);
      this.createdAt = this.getTimeStampFromString(data.created_at);
      this.category = data.status;
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

  setCategory(task, listID) {
    let prom = trelloGet("lists/" + listID);
    Task.prom.push(prom);
    prom.then(function(listData) {
      task.category = listData.name;
    })
  }
}
Task.prom = new Array();



$(document).ready(function() {
  // Hamburger menu toggle
  var trigger = $('.hamburger');

  trigger.click(function() {
    hamburger_cross();
  });

  function hamburger_cross() {
    if (isClosed == true) {
      trigger.removeClass('is-open');
      trigger.addClass('is-closed');
      isClosed = false;
    } else {
      trigger.removeClass('is-closed');
      trigger.addClass('is-open');
      isClosed = true;
    }
  }

  $('[data-toggle="offcanvas"]').click(function() {
    $('body').toggleClass('toggled');
    $('.navbar').toggleClass('toggled');
  });

  // Default toast notifications settings
  $.notifyDefaults({
    allow_dismiss: true,
    animate: {
      enter: 'animated fadeInUp',
      exit: 'animated fadeOutRight'
    },
    placement: {
      from: "top",
      align: "right"
    },
    offset: 20,
    spacing: 10,
    delay: 500,
  });

  // Scroll to top button 
  $(window).scroll(function(){
    if ($(this).scrollTop() > 100) {
      $('.scrollTop').fadeIn();
    }
    else {
      $('.scrollTop').fadeOut();
    }
  });
  
  $('.scrollTop').click(function() {
    $('html, body').animate({scrollTop : 0},800);
    return false;
  });

  // Allocate tables for Zendesk and Trello
  setupPage();

  setIDs().then(function() {
    getCardsAndTickets().then(function(cardsAndTickets) {
      console.log(cardsAndTickets);

      user.tasks = createTasksFromCardsAndTickets(cardsAndTickets);


      createTasksFromCardsAndTickets(cardsAndTickets).then(function() {
        console.log(user.tasks);

        populateTrello();
        populateZend();
        draggableRows();
      });
    });
  });
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

/*Creates a new table with a random ID, as it cannot be coded to have it
  dynamically created if it isn't random.*/
function createNewTable() {
  $.notify({
    icon: 'glyphicon glyphicon-info-sign',
    message: "Table created."
  }, {
    type: 'info',
  });
  createTable(makeID()); // Create a table with a random ID;
  window.scrollTo(0, document.body.scrollHeight);
}

function deleteTable(tableName) {
  table = $(tableName).closest('table');
  if (isEmpty(tableName) || confirm("This table isn't empty!\nAre you sure you want to delete it?")) {
    table.remove();
    $.notify({
      icon: 'fa fa-exclamation-triangle',
      message: "Table deleted."
    }, {
      type: 'danger',
    });
  }
}

function isEmpty(tableName) {
  var tableLength = $(tableName).closest('table').find("td").length
  if (tableLength < 1)
    return true;
  return false;
}


/* Populating/setting up tables */
function populateTrello() {

  var trelloCat = ["Not_Started", "Blocked", "In_Progress", "To_Review",
  "Completed", "July_Billing"];

  for (var i = 0; i < trelloCat.length; i++) {
    for (var j = 0; j < user.tasks.length; j++) {
      var str = user.tasks[j].category;
      var cat = str.split(' ').join('_');
      if (cat === trelloCat[i]) {
        if (document.getElementById(cat) == null) {
          createTable(cat);
        }
        populateTable(user.tasks[j], cat, j);      
      }
    }
  }
}

function populateZend() {

  var zendCat = ["open", "pending", "closed", "new", "solved", "hold"];

  for (var i = 0; i < zendCat.length; i++) {
    for (var j = 0; j < user.tasks.length; j++) {
      if (user.tasks[j].category == zendCat[i]) {
        if (document.getElementById(user.tasks[j].category) == null) {
          createTable(user.tasks[j].category);
        }
        populateTable(user.tasks[j], user.tasks[j].category, j);
      }
    }
  }
}

function createTable(tableName) {
  var table = document.createElement("TABLE");
  var mainDiv = document.getElementById("main-container");
  var head = document.createElement("thead");
  var body = document.createElement("tbody");


  table.setAttribute("id", tableName);

  // Create the sorting buttons
  var titleSort = document.createElement("button");
  var descriptionSort = document.createElement("button");
  var modifiedSort = document.createElement("button");
  var categorySort = document.createElement("button");
  var deleteTable = document.createElement("button");

  //Assign classes to the sorting buttons
  titleSort.setAttribute("class", "sortButton glyphicon glyphicon-triangle-bottom");
  descriptionSort.setAttribute("class", "sortButton glyphicon glyphicon-triangle-bottom");
  modifiedSort.setAttribute("class", "sortButton glyphicon glyphicon-triangle-bottom");
  categorySort.setAttribute("class", "sortButton glyphicon glyphicon-triangle-bottom");
  deleteTable.setAttribute("class", "deleteButton glyphicon glyphicon-remove");

  titleSort.setAttribute("onclick", "sortAlphabet(" + tableName + ",0, false)");
  descriptionSort.setAttribute("onclick", "sortAlphabet(" + tableName + ",1)");
  modifiedSort.setAttribute("onclick", "sortLastModified(" + tableName + ")");
  categorySort.setAttribute("onclick", "sortCategory(" + tableName + ")");
  deleteTable.setAttribute("onclick", "deleteTable(" + tableName + ")");


  table.appendChild(head);
  table.appendChild(body);
  mainDiv.appendChild(table);

  //create row and cell element
  row = document.createElement("tr");
  titleCell = document.createElement("th");
  descCell = document.createElement("th");
  modCell = document.createElement("th");
  catCell = document.createElement("th");

  row.setAttribute("id", "firstRow");
  body.setAttribute("class", "sortable");

  titleCell.setAttribute("id", "titleCell");
  descCell.setAttribute("id", "descCell");
  modCell.setAttribute("id", "modCell");
  catCell.setAttribute("id", "catCell");

  // text for cell
  textNode1 = document.createTextNode("Title");
  textNode2 = document.createTextNode("Description");
  textNode3 = document.createTextNode("Last Modified");
  textNode4 = document.createTextNode("Category");

  // append text to cell
  titleCell.appendChild(textNode1);
  descCell.appendChild(textNode2);
  modCell.appendChild(textNode3);
  catCell.appendChild(textNode4);

  // append buttons to cell
  titleCell.appendChild(titleSort);
  descCell.appendChild(descriptionSort);
  modCell.appendChild(modifiedSort);
  catCell.appendChild(categorySort);
  catCell.appendChild(deleteTable);

  // append text to row
  row.appendChild(titleCell);
  row.appendChild(descCell);
  row.appendChild(modCell);
  row.appendChild(catCell);

  // append row to table/body
  head.appendChild(row);
  //head.appendChild(body);
  table.appendChild(head);
}

function populateTable(task, tableName, index) {
  var table = document.getElementById(tableName);
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

  // table = document.getElementById(tableName);
  var body = document.getElementById(tableName).getElementsByTagName('tbody')[0];

  //create row and cell element
  row = document.createElement("tr");
  titleCell = document.createElement("td");
  descCell = document.createElement("td");
  modCell = document.createElement("td");
  catCell = document.createElement("td");

  titleCell.setAttribute("id", "title");
  descCell.setAttribute("id", "desc");
  modCell.setAttribute("id", "mod");
  catCell.setAttribute("id", "cat");

  // text for cell
  textNode1 = document.createTextNode(title);
  textNode2 = document.createTextNode(shortDesc);
  textNode3 = document.createTextNode(date);
  textNode4 = document.createTextNode(capCat);

  // append text to cell
  titleCell.appendChild(textNode1);
  descCell.appendChild(textNode2);
  modCell.appendChild(textNode3);
  catCell.appendChild(textNode4);

  // append text to row
  row.appendChild(titleCell);
  row.appendChild(descCell);
  row.appendChild(modCell);
  row.appendChild(catCell);

  row.setAttribute("id", index);
  row.setAttribute("class", "notFirst");

  // append row to table/body
  body.appendChild(row);
}

function draggableRows() {

  // Prevent rows from shrinking while dragged
  var fixHelper = function(e, ui) {
    ui.children().each(function() {
      $(this).width($(this).width());
    });
    return ui;
  };

  $(".sortable").sortable({
    helper: fixHelper,
    connectWith: ".sortable",
    placeholder: "ui-state-highlight",
    zIndex: 99,
    stop: function(e,t) {
      if ($(this).children().length == 0) {
          $(this).addClass('place');
      }
      if ($(t.item).closest('tbody').children().length > 0) {
          $(t.item).closest('tbody').removeClass('place');
      }
    },

    receive: function() {
      //console.log($(this).closest('table'));
    },

  });
  $("#sortable").disableSelection(); 
}
/* End populating/setting up tables */

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
  let setIDTre = setTrelloID();
  let setIDZen = setZendeskID();

  return Promise.all(new Array(setIDTre, setIDZen));
}

function setTrelloID() {
  return new Promise(function(resolve, reject) {
    trelloGet("members/me")

      .then(function(trelloData) {
        user.trello.id = trelloData.id;
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
        getCardsFromBoard(getBoardsIDs(boards)).then(function(cards) {
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

function getBoardsIDs(boards) {
  let boardIDs = new Array();
  for (let i = 0; i < boards.length; i++) {
    boardIDs.push(boards[i].id);
  }
  return boardIDs;
}

function getCardsFromBoard(boardsIDs) {
  return new Promise(function(resolve, reject) {
    let boardDataPromises = new Array();
    for (let i = 0; i < boardsIDs.length; i++) {
      boardDataPromises.push(trelloGet("boards/" + boardsIDs[i] + "/cards"));
    }
    Promise.all(boardDataPromises).then(function(cardArrays) {
        let allCards = new Array();
        for (let i = 0; i < cardArrays.length; i++) {
          let singleArray = cardArrays[i];
          for (let j = 0; j < singleArray.length; j++) {
            allCards.push(singleArray[j]);
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

function createTasksFromCardsAndTickets(cardsAndTickets) {
  let tasks = new Array();
  for (let i = 0; i < cardsAndTickets.length; i++) {
    for (let j = 0; j < cardsAndTickets[i].length; j++) {
      tasks.push(new Task(cardsAndTickets[i][j], i));
    }
    user.tasks = tasks;
    //console.log(tasks);
    //console.log(user.tasks);
  }
  return Promise.all(Task.prom);
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

window.addEventListener("resize", function() {
  var openButton = document.getElementById("leftOpenButton");
  if (window.innerWidth < 1200) {
    if ($('body.toggled').css("padding") != null) {
      isClosed = false;
      $('body').toggleClass('toggled');
      $('.hamburger').removeClass('is-open');
      $('.hamburger').addClass('is-closed');
    }
  }
});

/*Refresh the page*/
function refresh() {
  location.reload();
}

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
  tableName = $(tableName).closest('table').attr('id');
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
      x = rows[i].getElementsByTagName("TD")[index];
      y = rows[i + 1].getElementsByTagName("TD")[index];
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
  alphabetForwards = true;
}


/*Sort the data alphabetically reversed*/
function sortAlphabetReverse(tableName, index) {
  var table, rows, switching, i, x, y, shouldSwitch;
  tableName = $(tableName).closest('table').attr('id');
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
      x = rows[i].getElementsByTagName("TD")[index];
      y = rows[i + 1].getElementsByTagName("TD")[index];
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
  tableName = $(tableName).closest('table').attr('id');
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
  tableName = $(tableName).closest('table').attr('id');
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
  tableName = $(tableName).closest('table').attr('id');
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
      x = rows[i].getElementsByTagName("TD")[2];
      y = rows[i + 1].getElementsByTagName("TD")[2];
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
  tableName = $(tableName).closest('table').attr('id');
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
      x = rows[i].getElementsByTagName("TD")[2];
      y = rows[i + 1].getElementsByTagName("TD")[2];
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

function goToZendesk() {
  window.open("https://www.zendesk.com");
}

function goToTrello() {
  window.open("https://www.trello.com");
}

/*-------------------- THEME CHANGE ------------------*/

var alternate = 1;

function changeColor() {
  var body = document.body.style;
  var ticketBarHead = document.getElementById("info-header").style;
  var ticketHeads = document.getElementsByClassName("panel-heading");
  var tickets = document.getElementsByClassName("panel-body");
  var tableHeads = document.getElementsByTagName("thead");

  if (alternate == 1) {
    body.backgroundColor = "#1E1E1E";
    body.color = "lightgrey";
    ticketBarHead.backgroundColor = "#1E1E1E";
    for (var i = 0; i < tickets.length; i++) {
      tickets[i].style.backgroundColor = "#7E7E7E";
      ticketHeads[i].style.backgroundColor = "#6E6E6E";
    }
    for (var i = 0; i < tableHeads.length; i++) {
      tableHeads[i].style.color = "white";
    }
  } else {
    body.backgroundColor = "#FFF";
    body.color = "#333";
    ticketBarHead.backgroundColor = "#CCC";
    for (var i = 0; i < tickets.length; i++) {
      tickets[i].style.backgroundColor = "#FFF";
      ticketHeads[i].style.backgroundColor = "#F5F5F5";
    }
    for (var i = 0; i < tableHeads.length; i++) {
      tableHeads[i].style.color = "#333";
    }
  }
  alternate = alternate % 2 + 1; //Increment/decrement alternate.
}
/* ------------------ END THEME CHANGE ------------------ */

/* ------------------ TICKET PANEL ------------------ */

/* Helper method that creates the card div */
function createTicketCard(cardIndex)
{
  var newCard = document.createElement('div');
  var task = user.tasks[cardIndex];
  var cardTitle = task.name;
  var cardDesc = task.desc;
  var status = task.category;
  var date = formatDate(task.lastModified);

  newCard.className = 'panel panel-default';
  newCard.id = cardIndex;

  newCard.innerHTML = '<div class="panel-heading">' +
    '<h3 class="panel-title"><i class="glyphicon glyphicon-remove-sign" aria-hidden="true"></i>' + cardTitle +
    '</h3></div>' +
    '<div class="panel-body">' +
    '<strong>Status: </strong> ' + status + ' <br>' +
    '<strong>Last Modified: </strong> ' + date + ' <br><br>' + 
    '<strong>Description</strong> <hr><p>' + cardDesc + '</p>' +
    '</div></div>';

  document.getElementById("card-list").appendChild(newCard);
  $('#' + cardIndex).addClass('animated fadeInRight');
  $('.panel-body p').readmore({
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
      icon: 'fa fa-exclamation-triangle',
      message: "Ticket already queued."
    }, {
      type: 'warning',
    });

    return;
  } else {
    cardsCreated.add(this.id);
    createTicketCard(this.id);

    $.notify({
      icon: 'fa fa-check',
      message: "Ticket queued."
    }, {
      type: 'success',
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
  $('#card-list').empty();
  cardsCreated.clear();
});

/* Method that will delegate which ticket card is clicked and delete that
   particular card */
$(".info-panel").on("click", ".glyphicon-remove-sign", function(e)
{
  var card = $(this).closest('.panel-default');
  var index = card.attr('id');

  if (cardsCreated.has(index)) {
    cardsCreated.delete(index);
  }

  card.addClass('animated fadeOutRight');
  card.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    $(this).remove();
  });
});

/* ------------------ END OF TICKET PANEL ------------------ */

function sort() {
  switch (document.getElementsByName("sortBy")[0].value) {
    case "a-z":
      sortAlphabet();
      break;

    case "z-a":
      sortAlphabetReverse();
      break;

    case "dueDate":
      sortDueDate();
      break;

    case "startDate":
      sortStartDate();
      break;

    case "category":
      sortCategory();
      break;

    case "lastModified":
      sortLastModified();
      break;

    case "lastModifiedReversed":
      sortlastModifiedReversed();
      break;
  }
}
/*--------------------------------Filters-------------------------------------*/
function filterBy(buttonID) {
  var category = document.getElementById(buttonID).innerHTML;
  var button = document.getElementById(buttonID);
  var filter = true;
  if (button.style.backgroundColor == "lightgrey")
    filter = false;
  //If View All is slected, reset everything to the defualt.
  if (category == "View All") {
    filterAll();
    return;
  }
  if (filter)
    filterIn(button, buttonID);
  else
    filterOut(button, buttonID);
  checkFilterAll();
}

function filterIn(button, buttonID) {
  var table, currentRow, i, j;
  var whitesmoke = "#f1f1f1";
  var category = document.getElementById(buttonID).innerHTML;
  var currentRowHTML;
  table = document.getElementsByTagName("table");
  for (j = 0; j < table.length; j++) { // Grab each table.
    rows = table[j].getElementsByTagName("TR"); // Grab the rows of each table.
    for (i = 1; i < rows.length; i++) { // Manipulate said row.
      currentRow = rows[i]
      currentRowHTML = currentRow.getElementsByTagName("TD")[3].innerHTML;
      if (currentRowHTML != category &&
        currentRow.style.display != "none" &&
        button.style.backgroundColor != "lightgrey" && filterIn) {
        if (document.getElementById("filter " +
            currentRowHTML).style.backgroundColor ==
          "lightgrey") {
          continue;
        }
        $(currentRow).hide(); // If the row is not whats filtered, hide it.
      } else if (currentRowHTML == category &&
        currentRow.style.display == "none" &&
        button.style.backgroundColor != "lightgrey")
        $(currentRow).show();
    }
  }
  //Change the backgorund color of the buttons when they're selected.
  if (button.style.backgroundColor == "lightgrey")
    button.style.backgroundColor = whitesmoke;
  else
    button.style.backgroundColor = "lightgrey";
}

function filterOut(button, buttonID) {
  var table, currentRow, i, j;
  var whitesmoke = "#f1f1f1";
  var category = document.getElementById(buttonID).innerHTML;
  table = document.getElementsByTagName("table");
  for (j = 0; j < table.length; j++) { // Grab each table.
    rows = table[j].getElementsByTagName("TR"); // Grab the rows of each table.
    for (i = 1; i < rows.length; i++) { // Manipulate said row.
      currentRow = rows[i]
      currentRowHTML = currentRow.getElementsByTagName("TD")[3].innerHTML;
      //If the current row needs to be filtered out, hide it.
      if (currentRowHTML == category &&
        currentRow.style.display != "none" &&
        button.style.backgroundColor == "lightgrey") {
        $(currentRow).hide();
      }
    }
  }
  //Change the background color of the buttons when they're selected.
  if (button.style.backgroundColor == "lightgrey")
    button.style.backgroundColor = whitesmoke;
  else
    button.style.backgroundColor = "lightgrey";
}

function checkFilterAll() {
  var table, i, j, filterBar;
  filterBar = document.getElementById("leftSidebar");
  var buttons = filterBar.getElementsByTagName("BUTTON");
  for (i = 0; i < buttons.length; i++) {
    //Check if any of the filter buttons are selected.
    if (buttons[i].style.backgroundColor == "lightgrey")
      return false;
  }
  filterAll();
  return true;
}

function filterAll() {
  var table, i, j, currentRow, filterBar;
  var whitesmoke = "#f1f1f1";
  filterBar = document.getElementById("leftSidebar");
  var buttons = filterBar.getElementsByTagName("BUTTON");
  //If the Filter All button was pressed, change the button colors to default.
  for (i = 0; i < buttons.length; i++)
    buttons[i].style.backgroundColor = whitesmoke;

  tables = document.getElementsByTagName("table");
  //Get the TR tags from the table.
  for (j = 0; j < tables.length; j++) {
    rows = tables[j].getElementsByTagName("TR");
    //Manipulate each TR by changing the display of it to be shown.
    for (i = 1; i < rows.length; i++) {
      currentRow = rows[i]
      currentRow.style.display = "table-row";
    }
  }
}
/*-----------------------------End of Filtering-------------------------------*/
/*---------------------------------Search-------------------------------------*/

function search() {
  var searchFor = document.getElementsByClassName("form-control")[0].value;
  var tables = document.getElementsByTagName("table");
  var rows;
  var currentRow, items, i, j, td;
  for (j = 0; j < tables.length; j++) {
    rows = tables[j].getElementsByTagName("TR");
    for (i = 1; i < rows.length; i++) {
      currentRow = rows[i]
      items = currentRow.getElementsByTagName("TD");
      for (td = 0; td < items.length; td++) {
        if (items[td].innerHTML.toLowerCase().includes(searchFor.toLowerCase())) {
          currentRow.style.display = "table-row";
          break;
        }
        if (td == items.length - 1 && currentRow.style.display != "none")
          $(currentRow).toggle();
      }
    }
  }
  return false; //Used to disable submitting.
}
