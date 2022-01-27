// 'var dict' comes from map.js

var square = document.getElementById("gamesquare");
var board = square.parentElement;
square.remove();

var incorrect = square.cloneNode(true);
incorrect.classList.add("incorrect");

var almost = square.cloneNode(true);
almost.classList.add("almost");

var correct = square.cloneNode(true);
correct.classList.add("correct");

// inputs
var inputArea = document.getElementById("gameinput");

var incorrectInput = incorrect.cloneNode(true);
var almostInput = almost.cloneNode(true);
var correctInput = correct.cloneNode(true);

inputArea.append(incorrectInput);
inputArea.append(almostInput);
inputArea.append(correctInput);

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

incorrectInput.onpointerdown = inputDownHandler;
incorrectInput.onpointerup = inputUpHandler;
almostInput.onpointerdown = inputDownHandler;
almostInput.onpointerup = inputUpHandler;
correctInput.onpointerdown = inputDownHandler;
correctInput.onpointerup = inputUpHandler;

var patterns = [];
var build = [];

var remainingWords = dict.map[242].map(function(x) { return x; });
var wordsLeft = document.getElementById("wordsleft");
wordsLeft.innerText = ""+remainingWords.length;

document.getElementById("darkmode").onchange = function() {
    if (this.checked) {
	document.body.classList.add("darkmode");
    } else {
	document.body.classList.remove("darkmode");
    }
}

document.getElementById("colorblind").onchange = function() {
    if (this.checked) {
	document.body.classList.add("colorblind");
    } else {
	document.body.classList.remove("colorblind");
    }
}
