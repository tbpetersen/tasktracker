var dayTheme = "css/day.css";
var nightTheme = "css/night.css";
var currentTheme = $('#current-theme').attr("href");

// Collapsable menu for smaller screen widths
$(document).on('click', '.navbar-collapse.in',function(e) {
    if( ($(e.target).is('button') || $(e.target).is('a'))
      && $(e.target).attr('class') != 'dropdown-toggle' )
    {
        $(this).collapse('hide');
    }
});

function setTheme(){
  getTheme(user.databaseID)
  .then(function(id){
    if(id)
      changeToNight();
    else
      changeToDay();
    currentTheme = $('#current-theme').attr("href");
  });
}

// Theme change
$("#changeThemeBtn").click(function() {
  if (currentTheme === dayTheme)
    changeToNight();
  else
    changeToDay();
  filterAll(); //TODO
  currentTheme = $('#current-theme').attr("href");
});

function changeToNight(){
  updateTheme(user.databaseID, 1);
  $("#current-theme").attr("href", nightTheme);
  $("#logo").attr("src", "images/logo-invert.png");
}

function changeToDay(){
  updateTheme(user.databaseID, 0);
  $("#current-theme").attr("href", dayTheme);
  $("#logo").attr("src", "images/logo.png");
}
