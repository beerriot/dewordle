// 'var dict' comes from map.js

var square = document.getElementById("gamesquare");
var board = square.parentElement;
square.remove();

var white = square.cloneNode(true);
white.classList.add("incorrect");

var yellow = square.cloneNode(true);
yellow.classList.add("almost");

var green = square.cloneNode(true);
green.classList.add("correct");

// example board
board.append(white.cloneNode(true));
board.append(yellow.cloneNode(true));
board.append(green.cloneNode(true));
board.append(yellow.cloneNode(true));
board.append(white.cloneNode(true));

// inputs
var inputArea = document.getElementById("gameinput");

var whiteInput = white.cloneNode(true);
var yellowInput = yellow.cloneNode(true);
var greenInput = green.cloneNode(true);

inputArea.append(whiteInput);
inputArea.append(yellowInput);
inputArea.append(greenInput);

function inputDownHandler(ev) {
    this.setPointerCapture(ev.pointerId);
}

function inputUpHandler(ev) {
    board.append(this.cloneNode(true));
}

whiteInput.onpointerdown = inputDownHandler;
whiteInput.onpointerup = inputUpHandler;
yellowInput.onpointerdown = inputDownHandler;
yellowInput.onpointerup = inputUpHandler;
greenInput.onpointerdown = inputDownHandler;
greenInput.onpointerup = inputUpHandler;
