window.onload = function(){
  openLeft();
}

/*Refresh the page*/
function refresh(){
  location.reload();
}

function getData(){

}

/* Purpose: Open the filter pannel and move the screen with it.
*/
function openLeft() {
  var body = document.getElementById("main");
  var sideBar = document.getElementById("leftSidebar");
  var openButton = document.getElementById("leftOpenButton");
  body.style.marginLeft = "10%";
  setTimeout(function(){
    sideBar.style.display = "block";
    sideBar.style.width = "10%";}, 300);

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

/*function closeInfo(){
  var info = document.getElementById("info");
  var body = document.getElementById("main");
  info.style.visibility = "hidden";
  body.style.paddingRight = "0%";
}

function openInfo(){
  console.log("opening info");
  var info = document.getElementById("info");
  var body = document.getElementById("main");
  info.style.visibility = "visible";
  body.style.paddingRight = "16%";
}*/
