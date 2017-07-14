window.onload = function(){
}

/*Refresh the page*/
function refresh(){
  location.reload();
}

/*Return the data from the given line of the table*/
function getData(line){

}

/*Sort the data alphabetically*/
function sortAlphabet(){

}

/*Sort the data by date*/
function sortDate(){

}

/*Sort the data by status*/
function sortStatus(){

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
