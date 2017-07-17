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
  console.log("Sorting alphabetically.");
}

/*Sort the data alphabetically reversed*/
function sortAlphabetReverse(){
  console.log("Sorting alphabetically reverse.");

}

/*Sort the data by date*/
function sortDate(){
  console.log("Sorting Cronologically.");

}

/*Sort the data by status*/
function sortStatus(){
  console.log("Sorting by Status.");

}

/*Open the filter pannel and move the screen with it.*/
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

/*Close the filter pannel and move the screen with it.*/
function closeLeft() {
  var body = document.getElementById("main");
  var sideBar = document.getElementById("leftSidebar");
  var openButton = document.getElementById("leftOpenButton");
  sideBar.style.display = "none";
  sideBar.style.width = "0%";
  body.style.marginLeft = "0%";
  openButton.style.opacity = 1;
}
