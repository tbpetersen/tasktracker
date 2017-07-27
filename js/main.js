const ZEN_AUTH_URL = "https://sdsc.zendesk.com/oauth/authorizations/new?response_type=token&client_id=client_services_tool_dev&scope=read%20write";
const TRE_AUTH_URL = "https://trello.com/1/authorize?key=8886ef1a1bc5ad08caad020068a3f9a2&callback_method=fragment&return_url=https://localhost";

const ZEN_API_URL = "https://sdsc.zendesk.com/api/v2/";
const TRE_API_URL = "https://trello.com/1/";

const TRE_APP_KEY = "8886ef1a1bc5ad08caad020068a3f9a2";

var zendeskToken = "";
var trelloToken = "";
var user;
var isClosed = false;
var ID = 0;


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
  });

  setupPage();

  setIDs().then(function() {
    getCardsAndTickets().then(function(cardsAndTickets) {
      console.log(cardsAndTickets);

      user.tasks = createTasksFromCardsAndTickets(cardsAndTickets);


      createTasksFromCardsAndTickets(cardsAndTickets).then(function(){
      console.log(user.tasks);
        var trelloCat = ["Not_Started", "Blocked", "In_Progress", "To_Review", "Completed", "July_Billing"];
        var zendCat = ["open", "pending", "closed", "new", "solved"];

        var actualTrello = [];
        for (var i = 0; i < trelloCat.length; i++) {
          for (var j = 0; j < user.tasks.length; j++) {
            var str = user.tasks[j].category;
            var cat = str.split(' ').join('_');
            if (cat === trelloCat[i]) {
              if (document.getElementById(cat) == null) {
                createTable(cat);
                actualTrello.push(user.tasks[j].category);
              }
              populateTable(user.tasks[j], cat);
            }
          }
        }

        for (var i = 0; i < zendCat.length; i++) {
          for (var j = 0; j < user.tasks.length; j++) {
            if (user.tasks[j].category == zendCat[i]) {
              if (document.getElementById(user.tasks[j].category) == null) {
                createTable(user.tasks[j].category);
              }
              populateTable(user.tasks[j], user.tasks[j].category);
            }
          }
        }

        /*
        for(var i = 0; i < actualTrello.length; i++) {
          for(var j = 0; j < actualTrello.length; j++) {
            var str = actualTrello[i];
            var cat = str.split(' ').join('_');
            var str2 = actualTrello[j];
            var cat2 = str2.split(' ').join('_');
            var string = '#' + cat;
            var stringg = '#' + cat2;
            console.log(string);
            console.log(stringg);
            var stringgg = string + ", " + stringg;
            $(stringgg).sortable({
              connectWith: stringgg
            });
            }
          }*/

        for (var i = 0; i < trelloCat.length; i++) {
          if (document.getElementById(trelloCat[i]) != null) {
            assignIDtoRows(trelloCat[i]);
          }
        }

        for (var i = 0; i < zendCat.length; i++) {
          if (document.getElementById(zendCat[i]) != null) {
            assignIDtoRows(zendCat[i]);
          }
        }

      });
    });
  });
});

function createTable(tableName) {
  var table = document.createElement("TABLE");
  var mainDiv = document.getElementById("main-container");
  var head = document.createElement("thead");
  var body = document.createElement("tbody");

  table.appendChild(head);
  table.appendChild(body);
  mainDiv.appendChild(table);
  table.setAttribute("id", tableName);

  // table = document.getElementById(tableName);

  //create row and cell element
  row = document.createElement("tr");
  titleCell = document.createElement("th");
  descCell = document.createElement("th");
  modCell = document.createElement("th");
  catCell = document.createElement("th");

  row.setAttribute("id", "firstRow");
  row.setAttribute("class", "fixed");


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

  // append text to row
  row.appendChild(titleCell);
  row.appendChild(descCell);
  row.appendChild(modCell);
  row.appendChild(catCell);

  // append row to table/body
  head.appendChild(row);

  draggableRows(tableName);
}

function populateTable(tasks, tableName) {
  var table = document.getElementById(tableName);
  addRow(tasks, tableName);

  // THIS IS HOW YOU ACCESS AN INDIVIDUAL CELL IN THE TABLE
  //console.log(document.getElementById("table").rows[2].cells.item(3).innerHTML);
}

function addRow(tasks, tableName) {

  // Get title of task
  var title = tasks.name;

  // Get description's first 140 characters
  var desc = tasks.desc;
  var shortDesc = (desc).substring(0, 140);
  if (desc.length > 140) {
    shortDesc = shortDesc + "...";
  }

  // Get last modified date from timestamp
  var date = new Date(tasks.lastModified);
  date = date.toDateString();
  date = date.substring(4);

  // Get category of task
  var cat = tasks.category;

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
  textNode4 = document.createTextNode(cat);

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

  // append row to table/body
  body.appendChild(row);
}

function assignIDtoRows(tableName) {
  var rows = document.getElementById(tableName).rows.length;
  for (var i = 1; i < rows; ++i) {
    document.getElementById(tableName).rows[i].id = ID;
    ID++;
  }
}

function draggableRows(tableName) {
  // Drag rows
  $('#' + tableName).sortable();

  // Prevent rows from shrinking while dragging
  var fixHelper = function(e, ui) {
    ui.children().each(function() {
      $(this).width($(this).width());
    });
    return ui;
  };

  $('#' + tableName).sortable({
    helper: fixHelper,
    cancel: ".ui-state-disabled",
    items: "tr:not(.ui-state-disabled)"
  }).disableSelection();

  $(".fixed").addClass("ui-state-disabled");
}

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

/*Sort the data alphabetically*/
function sortAlphabet() {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("table");
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
      x = rows[i].getElementsByTagName("TD")[0];
      y = rows[i + 1].getElementsByTagName("TD")[0];
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
}


/*Sort the data alphabetically reversed*/
function sortAlphabetReverse() {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("table");
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
      x = rows[i].getElementsByTagName("TD")[0];
      y = rows[i + 1].getElementsByTagName("TD")[0];
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
function sortCategory() {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("table");
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
}

/*Sort by the latest modified first*/
function sortLastModified() {
  var table, rows, switching, i, x, y, shouldSwitch;
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept",
    "Oct", "Nov", "Dec"
  ];
  table = document.getElementById("table");
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
      if (months.indexOf(month) > months.indexOf(month2) && months.indexOf(month) != months.indexOf(month2)) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      } else if (months.indexOf(month) == months.indexOf(month2) && date.toLowerCase() > date2.toLowerCase()) {
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

/*Sort by the latest modified last*/
function sortlastModifiedReversed() {
  var table, rows, switching, i, x, y, shouldSwitch;
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept",
    "Oct", "Nov", "Dec"
  ];
  table = document.getElementById("table");
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
      if (months.indexOf(month) < months.indexOf(month2) && months.indexOf(month) != months.indexOf(month2)) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      } else if (months.indexOf(month) == months.indexOf(month2) && date.toLowerCase() < date2.toLowerCase()) {
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

  if (alternate == 1) {
    body.backgroundColor = "#1E1E1E";
    body.color = "lightgrey";
    ticketBarHead.backgroundColor = "#1E1E1E";
    for (var i = 0; i < tickets.length; i++) {
      tickets[i].style.backgroundColor = "#7E7E7E";
      ticketHeads[i].style.backgroundColor = "#6E6E6E";
    }
  } else {
    body.backgroundColor = "#FFF";
    body.color = "#333";
    ticketBarHead.backgroundColor = "#CCC";
    for (var i = 0; i < tickets.length; i++) {
      tickets[i].style.backgroundColor = "#FFF";
      ticketHeads[i].style.backgroundColor = "#F5F5F5";
    }
  }
  alternate = alternate % 2 + 1; //Increment/decrement alternate.
}
/* ------------------ END THEME CHANGE ------------------ */

/* ------------------ TICKET PANEL ------------------ */

/* Clicking on table rows will open ticket panel view
   and creates a ticket card */
$(".main").on("click", "table > tbody > tr", function(e) {
  event.preventDefault();
  var newCard = document.createElement('div');
  var isClosed = true;
  var task = user.tasks[this.id];
  var cardTitle = task.name;
  var cardDesc = task.desc;

  if (isClosed == true) {
    isClosed = false;
    $(".info-panel").addClass("toggled");
    $("#openInfo").text("Close Ticket Panel");
  }

  /* Later on, make id="" maybe ticket ID of Zendesk or Trello to easily find dupes */
  newCard.innerHTML = '<div class="panel panel-default">' +
    '<div class="panel-heading">' +
    '<h3 class="panel-title"><i class="glyphicon glyphicon-remove-sign" aria-hidden="true"></i>' + cardTitle +
    '</h3></div>' +
    '<div class="panel-body">' + cardDesc +
    '</div></div>';

  document.getElementById("card-list").appendChild(newCard);
});

/* Click event listener for openInfo to toggle the ticket panel view */
$("#openInfo").click(function(e) {
  e.preventDefault();
  $(".info-panel").toggleClass("toggled");

  if ($(this).text() === "Open Ticket Panel") {
    $(this).text("Close Ticket Panel");
  } else {
    $(this).text("Open Ticket Panel");
  }
});

/* Clears all ticket cards inside ticket panel */
$("#clearBtn").click(function() {
  $('#card-list').empty();
});

/* Method that will delegate which ticket card is clicked and delete that
   particular card */
$(".info-panel").on("click", ".glyphicon-remove-sign", function(e) {
  $(this).closest('.panel-default').remove();
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

function filterBy(category) {
  //Reset everything, easier to manipulate then.
  filterAll();
  var table, currentRow, i, j;
  tables = document.getElementsByTagName("table");
  for (j = 0; j < tables.length; j++) { // Grab each table.
    rows = tables[j].getElementsByTagName("TR"); // Grab the rows of each table.
    for (i = 1; i < rows.length; i++) { // Manipulate said row.
      currentRow = rows[i]
      if (currentRow.getElementsByTagName("TD")[3].innerHTML != category && currentRow.style.display != "none") {
        $(currentRow).toggle(); // If the row is not whats filtered, hide it.
      }
    }
  }
}

function filterNotStared() {
  filterBy("Not Started");
}

function filterInProgress() {
  filterBy("In Progress");
}

function filterToReview() {
  filterBy("To Review");
}

function filterCompleted() {
  filterBy("Completed");
}

function filterBlocked() {
  filterBy("Blocked");
}

function filterAll() {
  var table, i, j, currentRow;
  tables = document.getElementsByTagName("table");
  for (j = 0; j < tables.length; j++) {
    rows = tables[j].getElementsByTagName("TR");
    for (i = 1; i < rows.length; i++) {
      currentRow = rows[i]
      currentRow.style.display = "table-row";
    }
  }
}

/*---------------------------------Search-------------------------------------*/

function search() {
  var searchFor = document.getElementsByClassName("form-control")[0].value;
  var tables = document.getElementsByTagName("table");
  var rows;
  var currentRow, items, i, j, td;
  for(j = 0; j < tables.length; j++) {
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
