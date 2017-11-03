var cardsCreated = new Set(); // Keeps track of ticket cards created - no dupes
const TRUNCATE_LENGTH = 250;

/* Allows resizing of the ticket panel. Weird results in edge though
$(document).ready(function(){
  console.log($('.info-panel'));
  $('.info-panel').resizable({
    handles: 'w,e',
    minWidth: 200,
    maxWidth: 700
});
});
*/


/* Helper method that creates the card div */
function createTicketCard(task)
{
  var newCard = document.createElement("div");
  var cardTitle = task.name;
  var cardDesc = task.desc;
  let cardDescMarkdown = CONVERTER.makeHtml(cardDesc);

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

  addLongDescription(body, cardDescMarkdown);

  if(cardDesc.length > TRUNCATE_LENGTH){
    let cardDescMarkdownShort = jQuery.truncate(cardDescMarkdown, {length: TRUNCATE_LENGTH});
    addShortDescription(body, cardDescMarkdownShort);
    addReadMoreLink(body);
    $(body).find(".long-desc").hide();
  }

  newCard.appendChild(panelHead);
  newCard.appendChild(body);

  document.getElementById("card-list").appendChild(newCard);
  $("#" + cardIndex).addClass("animated fadeInRight");

  // This is what add the "Read More" and "Read Less" to the ticket panel
  //$(".panel-body p").readmore({
  //  speed: 200,
  //});

  newCard.scrollIntoView();
}

function addDescription(ticketPanelBody, desc){
  let descriptionWrapper = document.createElement("div");
  descriptionWrapper.innerHTML = '<strong>Description</strong> <hr>' + desc;
  ticketPanelBody.appendChild(descriptionWrapper);
  return descriptionWrapper;
}

function addLongDescription(ticketPanelBody, longDesc){
  let longDescWrapper = addDescription(ticketPanelBody, longDesc);
  longDescWrapper.classList.add("long-desc");
}

function addShortDescription(ticketPanelBody, shortDesc){
  let shortDescWrapper = addDescription(ticketPanelBody, shortDesc);
  shortDescWrapper.classList.add("short-desc");
}

function addReadMoreLink(ticketPanelBody){
  let readMoreText = document.createElement("a");
  readMoreText.classList.add("read-more");
  readMoreText.innerHTML = "Read More";
  readMoreText.onclick = onReadMoreClick;
  ticketPanelBody.appendChild(readMoreText);
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

  $(".info-panel").css("left", "");
  $(".info-panel").css("width", "300px");
  $(".info-panel").toggleClass("toggled");
  $(".scrollTop").toggleClass("toggled");

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

function onReadMoreClick (e){
  let readMoreATag = e.target;
  let ticketPanelBody = readMoreATag.parentNode;

  if(readMoreATag.innerHTML == "Read More"){
    readMoreATag.innerHTML = "Read Less";
    $(ticketPanelBody).find(".short-desc").hide();
    $(ticketPanelBody).find(".long-desc").show();
  }else{
    readMoreATag.innerHTML = "Read More";
    $(ticketPanelBody).find(".short-desc").show();
    $(ticketPanelBody).find(".long-desc").hide();
  }
}

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
