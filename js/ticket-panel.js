var cardsCreated = new Set(); // Keeps track of ticket cards created - no dupes

/* Helper method that creates the card div */
function createTicketCard(task)
{
  var newCard = document.createElement("div");
  var cardTitle = task.name;
  var cardDesc = task.desc;
  //TODO
  // Use the makrdown converter on descriptions
  //let markdownHTML = CONVERTER.makeHtml(shortDesc);
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
  var removeIcon = document.createElement("button");
  var link = document.createElement("a");

  removeIcon.setAttribute("class", "glyphicon glyphicon-remove deleteBtn red-background");
  removeIcon.setAttribute("aria-hidden", "true");
  link.setAttribute("target", "_blank");
  link.setAttribute("href", url);
  link.innerHTML = cardTitle;
  panelTitle.setAttribute("class", "panel-title");

  //panelTitle.appendChild(removeIcon);
  panelTitle.appendChild(link);
  panelHead.appendChild(panelTitle);
  panelHead.appendChild(removeIcon);

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
  onTicketPanelClicked();
});

function onTicketPanelClicked(){
  let openInfoPanelButton = document.getElementById("openInfo");

  $(".info-panel").toggleClass("toggled");
  $(".scrollTop").toggleClass("toggled");

    // if ($(openInfoPanelButton).text() === "Open Ticket Panel")
    // {
    //   $(openInfoPanelButton).text("Close Ticket Panel");
    // }
    // else
    // {
    //   $(openInfoPanelButton).text("Open Ticket Panel");
    // }
}


/* Clears all ticket cards inside ticket panel */
$("#clearBtn").click(function()
{
  $("#card-list").empty();
  cardsCreated.clear();
  closeTicketPanel();
});

/* Close panels when the user clicks off them */
$(document).click(function(e){
  let currentElement = e.target;

  if(userClickedOffTicketPanel(e.target)){
    closeTicketPanel();
  }

  if(userClickedOffMainNavBar(e.target)){
    closeNavBar();
  }
});

function userClickedOffTicketPanel(element){
  let openTicketPanelButton = document.getElementById("openInfo");
  let openPanelArrow = document.getElementById("openPanelArrow");

  let isChildOfTicketPanel = elementIsChildOfTicketPanel(element);
  let isButtonToOpenTicketPanel = element == openTicketPanelButton || element == openPanelArrow;
  let isTicketRow = element.tagName == "TD";

  return !(isChildOfTicketPanel || isButtonToOpenTicketPanel || isTicketRow);
}

function userClickedOffMainNavBar(element){
  let isExpandButton = element == document.getElementById("navbar-collapse");
  return !(elementIsChildOfMainNavBar(element) || isExpandButton);
}

function elementIsChildOfContainer(element, container){
  let currentElement = element;

  do{
    if(currentElement == container){
      return true;
    }
  }while( (currentElement = currentElement.parentNode) != null );
  return false;
}

function elementIsChildOfTicketPanel(element){
  let ticketPanelContainer = document.getElementById("ticket-panel-container");
  return elementIsChildOfContainer(element, ticketPanelContainer);
}

function elementIsChildOfMainNavBar(element){
  let mainNavBar = document.getElementById("navbar-links");
  return elementIsChildOfContainer(element, mainNavBar);
}

/* Close the ticket panel when clicked */
$("#close-ticket-panel-button").click(closeTicketPanel);

$("#openPanelArrow").click(function(e){
  e.preventDefault();
  onTicketPanelClicked();
});

/* Method that will delegate which ticket card is clicked and delete that
   particular card */
$(".info-panel").on("click", ".glyphicon-remove", function(e)
{

  var card = $(this).closest(".panel-default");
  var index = card.attr("id");

  if (cardsCreated.has(index)) {
    cardsCreated.delete(index);
  }

  if(isLastTicketInPanel()){
    closeTicketPanel();
  }

  card.addClass("animated fadeOutRight");
  card.one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", function() {
    $(this).remove();
  });
});

function closeTicketPanel(){
  if(ticketPanelIsOpen()){
    onTicketPanelClicked();
  }
}

function closeNavBar(){
  let mainNavBar = document.getElementById("navbar-links");
  let isExpanded = $(mainNavBar).attr("aria-expanded") == "true";

  if(isExpanded){
    $("#navbar-collapse").click();
  }
}

function isLastTicketInPanel(){
  return $("#card-list")[0].children.length == 1;
}

function ticketPanelIsOpen(){
  let openInfoPanelButton = document.getElementById("openInfo");
  return $("#ticket-panel-container").hasClass("toggled");
}
