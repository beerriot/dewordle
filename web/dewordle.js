// 'var dict' comes from map.js

var square = document.getElementById("gamesquare");
var board = square.parentElement;
square.remove();

var white = square.cloneNode(true);
white.setAttribute("class", "incorrect");

var yellow = square.cloneNode(true);
yellow.setAttribute("class", "almost");

var green = square.cloneNode(true);
green.setAttribute("class", "correct");

board.append(white.cloneNode(true));
board.append(yellow.cloneNode(true));
board.append(green.cloneNode(true));
board.append(yellow.cloneNode(true));
board.append(white.cloneNode(true));
