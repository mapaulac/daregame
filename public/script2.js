//OPEN/CLOSE SESSIONS
var openedWindow;

function openWindow() {
    document.getElementById("part1").style.display = "none";
  document.getElementById("partDisclaimer").style.display = "flex";
  openedWindow = window.open('index.html');
  
}

function closeOpenedWindow() {
  openedWindow.close();
}

function restart(){
    window.location.href = "index.html";
}