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
      $("#current-theme").attr("href", nightTheme);
    else
      $("#current-theme").attr("href", dayTheme);
  })
}

// Theme change
$("#changeThemeBtn").click(function() {
  if (currentTheme === dayTheme)
  {
    updateTheme(user.databaseID, 1);
    $("#current-theme").attr("href", nightTheme);
    $("#logo").attr("src", "images/logo-invert.png");
  }
  else
  {
    updateTheme(user.databaseID, 0);
    $("#current-theme").attr("href", dayTheme);
    $("#logo").attr("src", "images/logo.png");
  }
  filterAll();
  currentTheme = $('#current-theme').attr("href");
});
