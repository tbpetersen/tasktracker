window.onload = function(){
  openLeft();
}

/* Purpose: Open the filter pannel and move the screen with it.
*/
function openLeft() {
  var body = document.getElementById("main");
  var sideBar = document.getElementById("leftSidebar");
  var openButton = document.getElementById("leftOpenButton");
  sideBar.style.display = "block";
  sideBar.style.width = "10%";
  body.style.marginLeft = "10%";
  openButton.style.opacity = 0;
}

/* Purpose: Close the filter pannel and move the screen with it.
*/
function closeLeft() {
  var body = document.getElementById("main");
  var sideBar = document.getElementById("leftSidebar");
  var openButton = document.getElementById("leftOpenButton");
  sideBar.style.display = "none";
  sideBar.style.width = "0%";
  body.style.marginLeft = "0%";
  openButton.style.opacity = 1;
}
