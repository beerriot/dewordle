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
    build.push(this.cloneNode(true));
    board.append(build[build.length-1]);

    if (build.length == 5) {
	addPattern(pattern(build));
	build = [];
    }
}

function pattern(elements) {
    var patternString = "";
    for (i = 0; i < elements.length; i++) {
	if (elements[i].classList.contains("correct")) {
	    patternString += "2";
	} else if (elements[i].classList.contains("almost")) {
	    patternString += "1";
	} else {
	    patternString += "0";
	}
    }

    return parseInt(patternString, 3);
}

function addPattern(pattern) {
    patterns.push(pattern);

    var words = dict.map[pattern];

    remainingWords = remainingWords.filter(
	function (w) { return words.includes(w); });
    wordsLeft.innerText = ""+remainingWords.length;
}

whiteInput.onpointerdown = inputDownHandler;
whiteInput.onpointerup = inputUpHandler;
yellowInput.onpointerdown = inputDownHandler;
yellowInput.onpointerup = inputUpHandler;
greenInput.onpointerdown = inputDownHandler;
greenInput.onpointerup = inputUpHandler;

var patterns = [];
var build = [];

var remainingWords = dict.map[242].map(function(x) { return x; });
var wordsLeft = document.getElementById("wordsleft");
wordsLeft.innerText = ""+remainingWords.length;
