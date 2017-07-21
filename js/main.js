const ZEN_AUTH_URL = "https://sdsc.zendesk.com/oauth/authorizations/new?response_type=token&client_id=client_services_tool_dev&scope=read%20write";
const TRE_AUTH_URL = "https://trello.com/1/authorize?key=8886ef1a1bc5ad08caad020068a3f9a2&callback_method=fragment&return_url=https://localhost";

const ZEN_API_URL = "https://sdsc.zendesk.com/api/v2/";
const TRE_API_URL = "https://trello.com/1/";

const TRE_APP_KEY = "8886ef1a1bc5ad08caad020068a3f9a2";

var zendeskToken = "";
var trelloToken = "";
var user;


class Task {
  /*
    Member variables:
      name - The Trello name of Zendesk subject
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
    if(type == 0 /* Trello */){
      this.name = data.name;
      this.desc = data.desc;
      this.lastModified = this.getTimeStampFromString(data.dateLastActivity);
      this.createdAt = this.getTrelloCreationTime(this.id);
      this.setCategory(this,data.idList);
    }else /* Zendesk*/{
      this.name = data.subject;
      this.desc = data.description;
      this.lastModified = this.getTimeStampFromString(data.updated_at);
      this.createdAt = this.getTimeStampFromString(data.created_at);
      this.category = data.status;
    }
  }

  getTrelloCreationTime(trelloID){
   let hexTime = trelloID.substring(0,8);
   return parseInt(hexTime, 16);
  }

  getTimeStampFromString(timeString){
    let date = new Date(timeString);
    return date.getTime();
  }

  setCategory(task, listID){
      let prom = trelloGet("lists/" + listID);
      Task.prom.push(prom);
      prom.then(function(listData){
        task.category = listData.name;
      })
    }
}
Task.prom = new Array();



$(document).ready(function(){
  // Hamburger menu toggle
  var trigger = $('.hamburger'),
  isClosed = false;

  trigger.click(function () {
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

  $('[data-toggle="offcanvas"]').click(function () {
    $('body').toggleClass('toggled');
  });

  setupPage();
  $('table tbody').sortable();
  setIDs().then(function(){
    getCardsAndTickets().then(function(cardsAndTickets){
      console.log(cardsAndTickets);
      createTasksFromCardsAndTickets(cardsAndTickets).then(function(){
        // Make/Populate table
        populateTable(user.tasks);
        console.log(user.tasks);
      });
    });
  });

});

function populateTable(tasks) {
  var table = document.getElementById("table");
  for(var i = 0; i < tasks.length; i++) {
    addRow(tasks, i);
  }

  // Make new rows draggable
  draggableRows();
}


function addRow(tasks, index) {

  // Get title of task
  var title = tasks[index].name;

  // Get description's first 140 characters
  var desc = tasks[index].desc;
  var shortDesc = (desc).substring(0, 140);
  if (desc.length > 140) {
    shortDesc = shortDesc + "...";
  }
  //console.log(shortDesc.substring(0,140));

  // Get last modified date from timestamp
  var date = new Date(tasks[index].lastModified);
  date = date.toDateString();
  date = date.substring(4);
  //console.log(date.toDateString());

  var cat = tasks[index].category;

  table = document.getElementById("table");

  //create row and cell element
  row = document.createElement("tr");
  titleCell = document.createElement("td");
  descCell = document.createElement("td");
  modCell = document.createElement("td");
  catCell = document.createElement("td");

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
  table.appendChild(row);

  // highlight rows on hover
  highlightRow();
}

function highlightRow() {

  $("tr").not(':first').hover(
    function () {
      $(this).css("background","#dd6367");
    },
    function () {
      $(this).css("background","");
    }
  );
}

function draggableRows() {

  // Drag rows
  $('#table').sortable();

  // Prevent rows from shrinking while dragging
  var fixHelper = function(e, ui) {
    ui.children().each(function() {
      $(this).width($(this).width());
    });
    return ui;
  };

  $('#table').sortable({
    helper: fixHelper
  }).disableSelection();
}

function setupPage(){
  if(! redirectToHTTPS()){
    getTokens();
    instantiateUser();
  }
}

function instantiateUser(){
  user = new Object();
  user.trello = new Object();
  user.zendesk = new Object();
}

function redirectToHTTPS(){
  if(window.location.protocol != 'https:'){
    window.location.assign('https://' + window.location.hostname);
    return true;
  }
  return false;
}

function saveTokenFromURL(){
  saveTrelloTokenFromURL();
  saveZendeskTokenFromURL();
}

function saveTrelloTokenFromURL(){
  var url = window.location.href;
  var tokenString = "#token=";

  if(! url.includes(tokenString)){
    return;
  }

  var tokenStart = url.indexOf(tokenString) + tokenString.length;
  token = url.substring(tokenStart);
  localStorage["trelloToken"] = token;
}

function saveZendeskTokenFromURL(){
  var url = window.location.href;
  var tokenString = "#access_token=";

  if(! url.includes(tokenString)){
    return;
  }

  var tokenStart = url.indexOf(tokenString) + tokenString.length;
  var tokenEnd = url.indexOf("&scope=");
  token = url.substring(tokenStart, tokenEnd);
  localStorage["zendeskToken"] = token;
}

function getTokens(){
    saveTokenFromURL();
    getZendeskToken();
    getTrelloToken();
}

function getZendeskToken(){
  zendeskToken = localStorage.getItem("zendeskToken");
  if(zendeskToken == undefined){
    redirectToZendeskLogin();
  }
}

function getTrelloToken(){
  trelloToken = localStorage.getItem("trelloToken");
  if(trelloToken == undefined){
    redirectToTrelloLogin();
  }
}

function redirectToTrelloLogin(){
  window.location.assign(TRE_AUTH_URL);
}

function redirectToZendeskLogin(){
  window.location.assign(ZEN_AUTH_URL);
}

function setIDs(){
  let setIDTre = setTrelloID();
  let setIDZen = setZendeskID();

  return Promise.all(new Array(setIDTre, setIDZen));
}

function setTrelloID(){
  return new Promise(function(resolve, reject){
    trelloGet("members/me")

    .then(function(trelloData){
      user.trello.id = trelloData.id;
      resolve();
    })

    .catch(function(trelloData){
      reject(trelloData);
    });
  });
}

function setZendeskID(){
  return new Promise(function(resolve, reject){
    zendeskGet("users/me")
    .then(function(zendeskData){
      user.zendesk.id = zendeskData.user.id;
      resolve();
    })

    .catch(function(zendeskData){
      reject(zendeskData);
    });
  });
}

function getCardsAndTickets(){
  return new Promise(function(resolve, reject){
    let trelloCards = getTrelloCards();
    let zendeskTickets = getZendeskTickets();

    Promise.all([trelloCards, zendeskTickets]).then(function(data){
      resolve([data[0], data[1].results]);
    });
  });
}

function getTrelloCards(){
  return new Promise(function(resolve, reject){
    getTrelloBoards().then(function(boards){
      getCardsFromBoard(getBoardsIDs(boards)).then(function(cards){
        getUsersCards(cards).then(function(usersCards){
          resolve(usersCards);
        })
        .catch(function(getUsersCardsFailed){
          reject(getUsersCardsFailed);
        });
      })
      .catch(function(getCardsFromBoardsFailed){
        reject(getCardsFromBoardsFailed);
      });
    })
    .catch(function(getTrelloBoardsFailed){
      reject(getTrelloBoardsFailed);
    });
  });
}

function getTrelloBoards(){
  return trelloGet("members/me/boards");
}

function getBoardsIDs(boards){
  let boardIDs = new Array();
  for(let i = 0; i < boards.length; i++){
    boardIDs.push(boards[i].id);
  }
  return boardIDs;
}

function getCardsFromBoard(boardsIDs){
  return new Promise(function(resolve, reject){
    let boardDataPromises = new Array();
    for(let i = 0; i < boardsIDs.length; i++){
      boardDataPromises.push(trelloGet("boards/" + boardsIDs[i] + "/cards"));
    }
    Promise.all(boardDataPromises).then(function(cardArrays){
      let allCards = new Array();
      for(let i = 0; i < cardArrays.length; i++){
        let singleArray = cardArrays[i];
        for(let j = 0; j < singleArray.length; j++ ){
          allCards.push(singleArray[j]);
        }
      }
      resolve(allCards);
    })
    .catch(function(dataBoardPromisesFailed){
      reject(dataBoardPromisesFailed);
    });
  });
}

function getUsersCards(cards){
  return new Promise(function(resolve, reject){
    if(user == null){
       reject("user not instantiated");
    }
    if(user.trello == null){
       reject("user.trello not instantiated");
    }
    if(user.trello.id == null){
      reject("Trello ID not set");
    }
    let id = user.trello.id;
    let usersCards = new Array();
    for(let i = 0; i < cards.length; i++){
      for(let j = 0; j < cards[i].idMembers.length; j++){
        if(cards[i].idMembers[j] == id){
          usersCards.push(cards[i]);
        }
      }
    }
    resolve(usersCards);
  });
}


function getZendeskTickets(){
  //return zendeskGet("search.json?query=type:ticket status<solved assignee_id:" + user.zendesk.id);
  return zendeskGet("search.json?query=type:ticket status<solved");
}

function createTasksFromCardsAndTickets(cardsAndTickets){
  let tasks = new Array();
  for(let i = 0; i < cardsAndTickets.length; i++){
    for(let j = 0; j < cardsAndTickets[i].length; j++){
      tasks.push(new Task(cardsAndTickets[i][j], i));
    }
    user.tasks = tasks;
  }
  return Promise.all(Task.prom);
}

function zendeskGet(url){
  return new Promise(function(resolve, reject){
    $.ajax({
    type: "GET",
    beforeSend: function(request) {
      request.setRequestHeader("Authorization", "Bearer " + zendeskToken);
    },
    url: ZEN_API_URL + url,
    success: function(data){
      resolve(data)
    },
    error: function(data){
      reject(data)
      }
    });
  });
}

function trelloGet(url){
  return new Promise(function(resolve, reject){
    $.ajax({
    type: "GET",
    url: TRE_API_URL + url + "?token=" + trelloToken + "&key=" + TRE_APP_KEY,
    success: function(data){
      resolve(data)
    },
    error: function(data){
      reject(data)
      }
    });
  });
}
////////////////////////////////////////////////////////////////////////////////

window.addEventListener("resize", function(){
  var openButton = document.getElementById("leftOpenButton");
    if(window.innerWidth < 1200)
    {
      // function(){$('body').toggleClass('toggled');};
    }
});

/*Refresh the page*/
function refresh(){
  console.log("Refreshing");
  location.reload();
}

/*Sort the data alphabetically*/
function sortAlphabet(){
  console.log("Sorting alphabetically.");
}

/*Sort the data alphabetically reversed*/
function sortAlphabetReverse(){
  console.log("Sorting alphabetically reverse.");

}

/*Sort the data by date*/
function sortDate(){
  console.log("Sorting Cronologically.");

}

/*Sort the data by status*/
function sortStatus(){
  console.log("Sorting by Status.");

}

/*Open the filter pannel and move the screen with it.*/
function openLeft(){
  var body = document.getElementById("main");
  var sideBar = document.getElementById("leftSidebar");
  var openButton = document.getElementById("leftOpenButton");
  body.style.marginLeft = "10%";
  setTimeout(function(){
    sideBar.style.display = "block";
    sideBar.style.width = "10%";}, 300);
  openButton.style.opacity = 0;
}

/*Close the filter pannel and move the screen with it.*/
function closeLeft(){
  var body = document.getElementById("main");
  var sideBar = document.getElementById("leftSidebar");
  var openButton = document.getElementById("leftOpenButton");
  sideBar.style.display = "none";
  body.style.width = "100%";
  body.style.marginLeft = "0%";
  openButton.style.opacity = 1;
}

$(".grid").on("click", "td", function(event) {
    event.preventDefault();
    var newCard = document.createElement('div');

    /* Later on, make id="" maybe ticket ID of Zendesk or Trello to easily find dupes */
    newCard.innerHTML = '<div class="panel panel-default">' +
    '<div class="panel-heading">' +
    '<h3 class="panel-title">Ticket #1234 ' +
    '<i class="glyphicon glyphicon-remove-sign" aria-hidden="true" onclick="delCard();"></i>' +
  '</h3></div>' +
    '<div class="panel-body">Ticket Info' +
    '</div></div>';

    document.getElementById("card-list").appendChild(newCard);
});

// $('td').click(function() {
//     var newCard = document.createElement('div');

//     /* Later on, make id="" maybe ticket ID of Zendesk or Trello to easily find dupes */
//     newCard.innerHTML = '<div class="panel panel-default">' +
//     '<div class="panel-heading">' +
//     '<h3 class="panel-title">Ticket #1234 ' +
//     '<i class="glyphicon glyphicon-remove-sign" aria-hidden="true" onclick="delCard();"></i>' +
//   '</h3></div>' +
//     '<div class="panel-body">Ticket Info' +
//     '</div></div>';

//     document.getElementById("card-list").appendChild(newCard);
// });

$("#openInfo").click(function(e) {
  e.preventDefault();
  $(".info-panel").toggleClass("toggled");
});

$("#clearBtn").click(function() {
  $('#card-list').empty();
});

function delCard()
{
  alert('Haven\'t add functionality yet!');
}
