/* Prevent rows from shrinking when dragged */
/*
var maxWidth = 0;
$('#table td:nth-child(3)').each(function(){
    if(maxWidth < $(this).width())
        maxWidth = $(this).width();
});

$('#table td:nth-child(3)').css('width',maxWidth);

var fixHelperModified = function(e, tr) {
    var $originals = tr.children();
    var $helper = tr.clone();
    $helper.children().each(function(index) {
        $(this).width($originals.eq(index).width()+17); // 16 - 18
    });
    return $helper;
},
    updateIndex = function(e, ui) {
        $('td.index', ui.item.parent()).each(function (i) {
            $(this).html(i + 1);
        });
    };

$("#table tbody").sortable({
    helper: fixHelperModified,
    stop: updateIndex
}).disableSelection();
*/
/*var fixHelper = function(e, ui) {
    ui.children().each(function() {
        $(this).width($(this).width());
    });
    return ui;
};

$("#sort tbody").sortable({
    helper: fixHelper
}).disableSelection();
*/

//=======
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
    }else /* Zendesk*/{
      this.name = data.subject;
      this.desc = data.description;
      this.lastModified = this.getTimeStampFromString(data.updated_at);
      this.createdAt = this.getTimeStampFromString(data.created_at);
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
}


$(document).ready(function(){
  setupPage();
  $('table tbody').sortable();
  setIDs().then(function(){
    getCardsAndTickets().then(function(cardsAndTickets){
      console.log(cardsAndTickets);
      user.tasks = createTasksFromCardsAndTickets(cardsAndTickets);
      console.log(user.tasks);
    });
  });

});

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
  window.location.href = TRE_AUTH_URL
}

function redirectToZendeskLogin(){
  window.location.href = ZEN_AUTH_URL;
}

function setIDs(){
  let setIDTre = setTrelloID();
  let setIDZen = setZendeskID();

  return Promise.all(new Array(setIDTre, setIDZen));
}

function setTrelloID(){
  return new Promise(function(resolve, reject){
    trelloGet("members/me").then(function(trelloData){
      user.trello.id = trelloData.id;
      resolve();
    });
  });
}

function setZendeskID(){
  return new Promise(function(resolve, reject){
    zendeskGet("users/me").then(function(zendeskData){
      user.zendesk.id = zendeskData.user.id;
      resolve();
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
        });
      });
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
    });
  });
}

function getUsersCards(cards){
  // You need to know the user id. If you have it, use it. Otherwise, get it
  // using the API
  return new Promise(function(resolve, reject){
    if(user.trello.id != undefined){
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
    }else{
      trelloGet("members/me").then(function(meData){
        let id = meData.id;
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
  }
  return tasks;
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
//////////////////////////////////////
// /*Refresh the page*/
// function refresh(){
//   console.log("Refreshing");
//   location.reload();
// }

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

$('td').click(function() {
    // alert('Click!');

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