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