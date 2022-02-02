// 'var dict' comes from map.js
dict.words = dict.possible.split(",");
dict.map = dict.map64.map(unpackBase64);

function unpackBase64(str) {
    var bin = atob(str);
    var words = [];
    for (var i = 0; i < bin.length; i++) {
        var b = bin.charCodeAt(i);
        for (var j = 0; j < 8; j++) {
            if (b & (1 << j)) {
                words.push(j + i * 8);
            }
        }
    }
    return words;
}

var square = document.getElementById("gamesquare");
var board = square.parentElement;
square.removeAttribute("id");
square.remove();

var guesscount = document.getElementById("guesscount");
guesscount.removeAttribute("id");
guesscount.remove();

var build;
function createBuildRow() {
    build = [];
    for (var i = 0; i < 5; i++) {
        build.push(square.cloneNode(true));
        build[i].onpointerdown = inputDownHandler;
        build[i].onpointerup = buildUp;
        build[i].ontouchend = noZoom;
        board.append(build[i]);
    }
}
createBuildRow();

function inputDownHandler(ev) {
    ev.preventDefault();
    this.setPointerCapture(ev.pointerId);
}
function noZoom(ev) {
    ev.preventDefault();
}

var addrow = document.getElementById("addrow");
addrow.onpointerdown = inputDownHandler;
addrow.onpointerup = addrowUp;

var share = document.getElementById("share");
share.onpointerdown = inputDownHandler;
share.onpointerup = shareUp;

var reset = document.getElementById("reset");
reset.onpointerdown = inputDownHandler;
reset.onpointerup = resetUp;

var play = document.getElementById("play");
var win = document.getElementById("win");
var done = document.getElementById("done");

function addrowUp(ev) {
    if (!addPattern()) {
        for (i in build) { build[i].remove(); }
    }
}

function dupeAndResetBuild() {
    for (var i = 0; i < 5; i++) {
        var clone = build[i].cloneNode(true);
        if (!(clone.classList.contains("correct")
              || clone.classList.contains("almost"))) {
            clone.classList.add("incorrect");
        }

        patterns[patterns.length-1].tiles.push(clone);
        build[0].before(clone);

        build[i].classList.remove("correct");
        build[i].classList.remove("almost");
        build[i].classList.remove("incorrect");
    }

    build[0].before(patterns[patterns.length-1].display);
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

function patternFrom(elements) {
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

function addPattern(updateHash=true) {
    var pattern = patternFrom(build);

    if (updateHash) {
        window.location.hash += pattern.toString(3).padStart(5, "0");
    }

    var words = dict.map[pattern];
    remainingWords = remainingWords.filter(
        function (w) { return words.includes(w); });

    var record = {
        "pattern": pattern,
        "guesses": guessesForPattern(pattern, remainingWords),
        "display": guesscount.cloneNode(true),
        "tiles": []
    };
    patterns.push(record);
    dupeAndResetBuild();

    // -1 here because the newest pattern has been pre-filtered
    for (var i = 0; i < patterns.length-1; i++) {
        var newGuesses = {};
        for (var j in patterns[i].guesses) {
            var newMatches = patterns[i].guesses[j].filter(
                function(m) { return remainingWords.includes(m); });
            if (newMatches.length > 0) {
                newGuesses[j] = newMatches;
            }
        }
        patterns[i].guesses = newGuesses;
    }

    displayRemaining();

    if (remainingWords.length <= 1) {
        endGame();
        return false;
    } else {
        return true;
    }
}

function guessesForPattern(pattern, remainingWords) {
    var guesses = {};

    for (var i = 0; i < remainingWords.length; i++) {
        var rexp = new RegExp(
            regexForPatternInWord(pattern, remainingWords[i]), "g");
        var matches = (dict.possible.match(rexp) || []).concat(
            dict.impossible.match(rexp) || []);
        for (var j = 0; j < matches.length; j++) {
            if (score(matches[j], remainingWords[i]) == pattern) {
                if (matches[j] in guesses) {
                    guesses[matches[j]].push(remainingWords[i]);
                } else {
                    guesses[matches[j]] = [remainingWords[i]];
                }
            }
        }
    }
    return guesses;
}

function regexForPatternInWord(pattern, wordi) {
    var patternstr = pattern.toString(3).padStart(5, "0");
    var word = dict.words[wordi];
    var rexp = "";
    for (var i = 0; i < patternstr.length; i++) {
        if (patternstr[i] == "2") {
            rexp += word[i];
        } else if (patternstr[i] == "1") {
            // This picks up more words than it should because of
            // double-letter oddities.
            rexp += "["+word.replaceAll(word[i], '')+"]";
        } else {
            // This also picks up more words than it should. It would
            // be great to write "[^WORD]" here, but it actually
            // misses valid words if you do that. For example, if the
            // word is CABAL, and the pattern is 11110, using [^CABAL]
            // for the last letter will miss ABACA. The final A in
            // ABACA will be scored 0, because the first two A's
            // claimed the 1's.
            rexp += "[A-Z]";
        }
    }
    return rexp;
}

function score(guess, wordi) {
    var score = ["0","0","0","0","0"];
    var word = dict.words[wordi].split('');

    for (var i = 0; i < guess.length; i++) {
        if (guess[i] == word[i]) {
            score[i] = "2";
            word[i] = ".";
        }
    }

    for (var i = 0; i < guess.length; i++) {
        if (score[i] == "0") {
            var j = word.indexOf(guess[i]);
            if (j >= 0) {
                score[i] = "1";
                word[j] = ".";
            }
        }
    }

    return parseInt(score.join(''), 3);
}

function endGame() {
    if (remainingWords.length == 1) {
        // win
        play.setAttribute("style", "display: none;");
        win.removeAttribute("style");

        addrow.setAttribute("style", "display: none;");
        share.removeAttribute("style");

        for (var i in patterns) {
            var words = [];
            for (var j in patterns[i].guesses) { words.push(j); }
            var first = words.shift();
            for (var j in first) {
                patterns[i].tiles[j].getElementsByTagName("text")[0].innerHTML = first[j];
            }
            if (words.length > 0) {
                patterns[i].display.children[0].innerHTML = "<i>or</i> "+words.join(", ");
            } else {
                patterns[i].display.children[0].innerText = "";
            }
        }

        var word = dict.words[remainingWords[0]];
        for (i in word) {
            var tile = build[0].cloneNode(true);
            tile.classList.add("correct");
            tile.getElementsByTagName("text")[0].innerHTML = word[i];
            build[0].before(tile);
        }
    } else {
        // lose
        wordsLeft.innerText = "no";
        addrow.setAttribute("style", "display: none;");
        done.removeAttribute("style");
    }
}

function shareUp() {
    navigator.clipboard.writeText("I found a "+patterns.length+" pattern DeWordle!"+gameDiagram()).then(function() { alert("Copied to clipboard!"); });
}

const emoji = {
    "incorrect-themeW": String.fromCodePoint(0x2b1c),
    "incorrect-themeK": String.fromCodePoint(0x2b1b),
    "correct-themeGY": String.fromCodePoint(0x1f7e9),
    "correct-themeOB": String.fromCodePoint(0x1f7e7),
    "almost-themeGY": String.fromCodePoint(0x1f7e8),
    "almost-themeOB": String.fromCodePoint(0x1f7e6)
};

function gameDiagram() {
    var theme = document.body.classList.contains("themeK") ?
        "-themeK" : "-themeW";
    var palette = document.body.classList.contains("themeOB") ?
        "-themeOB" : "-themeGY";

    var diagram = "";
    for (var i in patterns) {
        diagram += "\n";

        for (j in patterns[i].tiles) {
            if (patterns[i].tiles[j].classList.contains("correct")) {
                diagram += emoji["correct"+palette];
            } else if (patterns[i].tiles[j].classList.contains("almost")) {
                diagram += emoji["almost"+palette];
            } else {
                diagram += emoji["incorrect"+theme];
            }
        }
    }

    return diagram;
}

function resetUp() {
    share.setAttribute("style", "display: none;");
    done.setAttribute("style", "display: none;");
    addrow.removeAttribute("style");

    win.setAttribute("style", "display:none;");
    play.removeAttribute("style");

    board.innerHTML = "";
    createBuildRow();
    initPatterns();
    window.location.hash = "";
    displayRemaining();
}

const tileNames = {
    "correct": ["2", "G", "O"],
    "almost": ["1", "Y", "B"],
    "incorrect": ["0", "W", "K"]
};

var wordsLeft = document.getElementById("wordsleft");

var patterns;
var remainingWords;
function initPatterns(start) {
    remainingWords = dict.map[242].map(function(x) { return x; });
    patterns = [];

    if (start) {
        var play = true;
        for (var i = 0; i < start.length; i += 5) {
            for (var j = 0; j < 5; j++) {
                if (tileNames.correct.includes(start[i+j])) {
                    build[j].classList.add("correct");
                } else if (tileNames.almost.includes(start[i+j])) {
                    build[j].classList.add("almost");
                } else {
                    build[j].classList.add("incorrect");
                }
            }
            play &= addPattern(false);
        }

        if (!play) {
            for (var i in build) { build[i].remove(); }
        }
    }

    if (patterns.length == 0) {
        // this will have been called at least once if patterns were
        // read above
        displayRemaining();
    }
}

var startPatterns = null;
if (window.location.hash && window.location.hash.length > 1) {
    var count = Math.trunc((window.location.hash.length - 1) / 5);
    startPatterns = window.location.hash.slice(1, 1 + count * 5);
    if (startPatterns.length != window.location.hash.length - 1) {
        // in case someone missed a character during copy & paste,
        // chop off the partial pattern at the end, so that appending
        // the next-guessed pattern will work correctly
        window.location.hash = startPatterns;
    }
}
initPatterns(startPatterns);

function displayRemaining() {
    wordsLeft.innerText = ""+remainingWords.length;

    document.getElementById("remainingwords").innerText = remainingWords.map(
        function(w) { return dict.words[w]; }).join(", ");

    for (var i = 0; i < patterns.length; i++) {
        var count = 0;
        for (x in patterns[i].guesses) { count++; }
        patterns[i].display.getElementsByClassName("matchcount")[0].innerText =
            ""+count;
    }
}

document.getElementById("theme").onchange = function() {
    if (this.value.startsWith("GY")) {
        document.body.classList.remove("themeOB");
        document.body.classList.add("themeGY");
    } else {
        // startsWith("OB")
        document.body.classList.remove("themeGY");
        document.body.classList.add("themeOB");
    }

    if (this.value.endsWith("W")) {
        document.body.classList.remove("themeK");
        document.body.classList.add("themeW");
    } else {
        // endsWith("K")
        document.body.classList.remove("themeW");
        document.body.classList.add("themeK");
    }
}

document.getElementById("showwords").onchange = function() {
    if (this.checked) {
        document.getElementById("remainingwords").removeAttribute("style");
    } else {
        document.getElementById("remainingwords").setAttribute("style", "display: none;");
    }
}
