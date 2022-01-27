// 'var dict' comes from map.js

var square = document.getElementById("gamesquare");
var board = square.parentElement;
square.removeAttribute("id");
square.remove();

var build = [];
for (var i = 0; i < 5; i++) {
    build.push(square.cloneNode(true));
    build[i].onpointerdown = inputDownHandler;
    build[i].onpointerup = buildUp;
    board.append(build[i]);
}

function inputDownHandler(ev) {
    this.setPointerCapture(ev.pointerId);
}

var addrow = document.getElementById("addrow");
addrow.onpointerdown = inputDownHandler;
addrow.onpointerup = addrowUp;

var share = document.getElementById("share");
share.onpointerdown = inputDownHandler;
share.onpointerup = shareUp;

function addrowUp(ev) {
    if (addPattern(pattern(build))) {
        for (var i = 0; i < 5; i++) {
	    var clone = build[i].cloneNode(true);
	    if (!(clone.classList.contains("correct")
	          || clone.classList.contains("almost"))) {
	        clone.classList.add("incorrect");
	    }

	    build[0].before(clone);

	    build[i].classList.remove("correct");
	    build[i].classList.remove("almost");
	    build[i].classList.remove("incorrect");
        }
    } else {
        for (var i = 0; i < 5; i++) {
            build[i].onpointerdown = null;
            build[i].onpointerup = null;
        }
        build = [];
    }
}

function buildUp(ev) {
    if (this.classList.contains("correct")) {
	this.classList.remove("correct");
	this.classList.add("almost");
    } else if (this.classList.contains("almost")) {
	this.classList.remove("almost");
	this.classList.add("incorrect");
    } else {
	this.classList.remove("incorrect");
	this.classList.add("correct");
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
    displayRemaining();

    if (remainingWords.length <= 1) {
        endGame();
        return false;
    } else {
        return true;
    }
}

function endGame() {
    if (remainingWords.length == 1) {
        // win
        document.getElementById("status").setAttribute("style", "display: none;");
        document.getElementById("winword").innerText = dict.words[remainingWords[0]];
        document.getElementById("win").removeAttribute("style");

        addrow.setAttribute("style", "display: none;");
        share.removeAttribute("style");
    } else {
        // lose
        wordsLeft.innerText = "no";
        addrow.setAttribute("style", "display: none;");
        document.getElementById("done").removeAttribute("style");
    }
}

function shareUp() {
    navigator.clipboard.writeText("I found a "+patterns.length+" pattern DeWordle!"+gameDiagram()).then(function() { alert("Copied to clipboard!"); });
}

const emoji = {
    "incorrect-light": String.fromCodePoint(0x2b1c),
    "incorrect-dark": String.fromCodePoint(0x2b1b),
    "correct-regular": String.fromCodePoint(0x1f7e9),
    "correct-color-blind": String.fromCodePoint(0x1f7e7),
    "almost-regular": String.fromCodePoint(0x1f7e8),
    "almost-color-blind": String.fromCodePoint(0x1f7e6)
};

function gameDiagram() {
    var theme = document.body.classList.contains("darkmode") ?
        "-dark" : "-light";
    var palette = document.body.classList.contains("colorblind") ?
        "-color-blind" : "-regular";

    var diagram = "";
    var squares = board.children;
    for (var i = 0; i < squares.length; i++) {
        if (i % 5 == 0) {
            diagram += "\n";
        }

        var square = squares[i];
        if (square.classList.contains("correct")) {
            diagram += emoji["correct"+palette];
        } else if (square.classList.contains("almost")) {
            diagram += emoji["almost"+palette];
        } else {
            diagram += emoji["incorrect"+theme];
        }
    }

    return diagram;
}

var patterns = [];

var remainingWords = dict.map[242].map(function(x) { return x; });
var wordsLeft = document.getElementById("wordsleft");
displayRemaining();

function displayRemaining() {
    wordsLeft.innerText = ""+remainingWords.length;

    document.getElementById("remainingwords").innerText = remainingWords.map(
	function(w) { return dict.words[w]; }).join(", ");
}

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

document.getElementById("showwords").onchange = function() {
    if (this.checked) {
	document.getElementById("remainingwords").removeAttribute("style");
    } else {
	document.getElementById("remainingwords").setAttribute("style", "display: none;");
    }
}
