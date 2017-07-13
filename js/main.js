window.onload = function(){
  openLeft();
}

function openLeft() {
  var body = document.getElementById("main");
  var sideBar = document.getElementById("leftSidebar");
  var openButton = document.getElementById("leftOpenButton");
  sideBar.style.display = "block";
  sideBar.style.width = "10%";
  body.style.marginLeft = "10%";
  openButton.style.opacity = 0;
}

function closeLeft() {
  var body = document.getElementById("main");
  var sideBar = document.getElementById("leftSidebar");
  var openButton = document.getElementById("leftOpenButton");
  sideBar.style.display = "none";
  sideBar.style.width = "0%";
  body.style.marginLeft = "0%";
  openButton.style.opacity = 1;
}

function adjustScreen(){
  var body = document.getElementById("body");
  body.style.margin = "50%";
}
