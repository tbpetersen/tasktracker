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
  var mainTheme = "css/main.css";
  var nightTheme = "css/night.css";
  var currentTheme = $('#main_style').attr("href");

  if (currentTheme === mainTheme)
  {
    $("#main_style").attr("href", nightTheme);
    $("#logo").attr("src", "images/logo-invert.png");
  }
  else
  {
    $("#main_style").attr("href", mainTheme);
    $("#logo").attr("src", "images/logo.png");
  }
  filterAll();
  currentTheme = $('#main_style').attr("href");
});