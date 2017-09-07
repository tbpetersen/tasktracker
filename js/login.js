$("#loginButton").click(function(){
  console.log(
    "Username: " + $("#username").val() +
    "\nPassword: " + $("#password").val()
  );
});

$(document).ready(function() {
  animate(document.getElementsByTagName('body')[0]);
});

function animate(item){
  item.style.top = '100%'
    var pos = 100;
    var id = setInterval(frame, 5);
    function frame() {
        if (pos == 20) {
            clearInterval(id);
        } else {
            pos--;
            item.style.top = pos + '%';
        }
    }
}
