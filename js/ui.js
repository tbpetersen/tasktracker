// Collapsable menu for smaller screen widths
$(document).on('click', '.navbar-collapse.in',function(e) {
    if( ($(e.target).is('button') || $(e.target).is('a'))
      && $(e.target).attr('class') != 'dropdown-toggle' )
    {
        $(this).collapse('hide');
    }
});


// Theme change
$("#changeThemeBtn").click(function() {
  var dayTheme = "css/day.css";
  var nightTheme = "css/night.css";
  var currentTheme = $('#current-theme').attr("href");

  if (currentTheme === dayTheme)
  {
    $("#current-theme").attr("href", nightTheme);
    $("#logo").attr("src", "images/logo-invert.png");
  }
  else
  {
    $("#current-theme").attr("href", dayTheme);
    $("#logo").attr("src", "images/logo.png");
  }
  filterAll();
  currentTheme = $('#current-theme').attr("href");
});
