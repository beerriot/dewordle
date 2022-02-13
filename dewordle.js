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

var board = document.getElementById("gameboard");
var square = board.getElementsByClassName("gamesquare")[0];
square.remove();

var leftpad = board.getElementsByClassName("leftpad")[0];
leftpad.remove();

var rightpad = board.getElementsByClassName("rightpad")[0];
rightpad.remove();

var display = document.getElementsByClassName("display")[0];
display.remove();

var buildrow = document.getElementById("buildrow");
var buildright = buildrow.getElementsByClassName("rightpad")[0];
var build = [];
for (var i = 0; i < 5; i++) {
    build.push(square.cloneNode(true));
    build[i].onpointerdown = inputDownHandler;
    build[i].onpointerup = buildUp;
    build[i].ontouchend = noZoom;
    buildright.before(build[i]);
}

var answerrow = document.getElementById("answerrow");
var answerright = answerrow.getElementsByClassName("rightpad")[0];
var answer = [];
for (var i = 0; i < 5; i++) {
    answer.push(square.cloneNode(true));
    answer[i].ontouchend = noZoom;
    answer[i].classList.add("correct");
    answerright.before(answer[i]);
}
var answerdisplay = display.cloneNode(true);
answerdisplay.classList.add("summary");
answerrow.append(answerdisplay);
addEditListener(answerdisplay, 0);

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

var win = document.getElementById("win");
var done = document.getElementById("done");

function addrowUp(ev) {
    if (!addPattern()) {
        endGame();
        requestGuesses(false);
    } else {
        requestGuesses(true);
    }
    displayRemaining();
}

function eraserowUp(i) {
    return function(ev) {
        for (t of patterns[i].tiles) {
            t.remove();
        }
        patterns[i].display.previousElementSibling.remove(); //rightpad
        patterns[i].display.previousElementSibling.remove(); //leftpad
        patterns[i].display.remove();

        patterns.splice(i, 1);
        remainingWords = rebuildRemainingWords();

        if (remainingWords.length > 1) {
            requestGuesses(true);
        } else {
            requestGuesses(false);
        }
    }
}

function resetBuild() {
    for (var b of build) {
        b.classList.remove("correct");
        b.classList.remove("almost");
        b.classList.remove("incorrect");
    }
}

function resetAnswer() {
    for (var a of answer) {
        a.getElementsByTagName("text")[0].innerHTML = "";
    }

    answerdisplay.classList.remove("words");
    answerdisplay.classList.add("summary");
    answerdisplay.getElementsByClassName("matchcount")[0]
        .innerHTML = ""+remainingWords.length;
}

function dupeBuild() {
    board.append(leftpad.cloneNode(true));

    for (var i = 0; i < 5; i++) {
        var clone = build[i].cloneNode(true);
        if (!(clone.classList.contains("correct")
              || clone.classList.contains("almost"))) {
            clone.classList.add("incorrect");
        }

        patterns[patterns.length-1].tiles.push(clone);
        board.append(clone);
    }

    var right = rightpad.cloneNode(true);
    var erase = right.getElementsByClassName("erase")[0];
    erase.onpointerdown = inputDownHandler;
    erase.onpointerup = eraserowUp(patterns.length-1);
    board.append(right);

    board.append(patterns[patterns.length-1].display);
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

function hashFragment() {
    return (patterns[0].guess || '')
        + patterns.slice(1).map(
            (p) => p.pattern.toString(3).padStart(5, "0")
                + (p.guess || '')).join('');
}

function addPattern(updateHash=true) {
    var pattern = patternFrom(build);

    var words = dict.map[pattern];
    remainingWords = remainingWords.filter(
        function (w) { return words.includes(w); });

    var record = {
        "pattern": pattern,
        "display": display.cloneNode(true),
        "tiles": []
    };
    patterns.push(record);
    addEditListener(record.display, patterns.length-1);
    dupeBuild();
    resetBuild();

    if (updateHash) {
        window.history.replaceState('', '', "#"+hashFragment());
    }

    return remainingWords.length > 1;
}

function rebuildRemainingWords() {
    var words = dict.map[patterns[0].pattern];

    for (var i = 1; i < patterns.length; i++) {
        var pwords = dict.map[patterns[i].pattern];
        words = words.filter((w) => pwords.includes(w));
    }

    for (var i in patterns) {
        if (patterns[i].guess != null) {
            words = words.filter(
                (w) => (patterns[i].pattern == score(patterns[i].guess, w)));
        }
    }

    return words;
}

function hideEdit(e, i) {
    patterns[i].display.classList.remove("edit");
}

function maybeHideEdit(e, i) {
    if (!this.parentElement.contains(e.relatedTarget)) {
        hideEdit.call(this, e, i);
    }
}

function setWord(e, i, editor, autocomplete) {
    if (setGuessWord(i, this.value)) {
        window.history.replaceState('', '', "#"+hashFragment());
        this.parentElement.children[0].value = this.value;

        if (remainingWords.length == 1) {
            endGame();
            requestGuesses(false);
        } else {
            requestGuesses(true);
        }

        displayRemaining();
        hideEdit.call(this, e, i);
    }
}

function editKeyUp(e, i, editor, autocomplete) {
    if (e.key === "Enter") {
        setWord.call(this, e, i, editor, autocomplete);
    } else if (e.key === "Escape") {
        this.value = patterns[i].guess || '';
        hideEdit.call(this, e, i);
    }
}

function addEditListener(display, i) {
    var editor = display.getElementsByClassName("editor")[0];
    var autocomplete = display.getElementsByClassName("autocomplete")[0];

    editor.onblur = function(e) {
        maybeHideEdit.call(this, e, i);
    };
    editor.oninput = function() {
        if (patterns[i].guesses) {
            var search = this.value.toUpperCase();
            var optsHTML = patterns[i].guesses.map(
                (g) => (g.indexOf(search) >= 0)
                    ? '<option value="'+g+'">'+g+'</option>' : '').join('');
            autocomplete.innerHTML = optsHTML;
        }
    }

    editor.onkeydown = function(e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            var selected = autocomplete.querySelector("option[selected=true]");
            if (selected) {
                var next = (e.key == "ArrowDown")
                    ? selected.nextElementSibling
                    : selected.previousElementSibling;
                if (next) {
                    selected.removeAttribute("selected");
                    next.setAttribute("selected", "true");
                    this.value = next.value;
                }
            } else {
                autocomplete.children[0].setAttribute("selected", "true");
                this.value = autocomplete.children[0].value;
            }
        }
    }

    var keyup = function(e) {
        editKeyUp.call(this, e, i, editor, autocomplete);
    }
    editor.onkeyup = keyup;
    autocomplete.onkeyup = keyup;

    autocomplete.onblur = function(e) {
        maybeHideEdit.call(this, e, i);
    };
    autocomplete.oninput = function() {
        editor.value = this.value;
    }
    autocomplete.onclick = function(e) {
        setWord.call(this, e, i, editor, autocomplete);
    }

    display.getElementsByClassName("editguess")[0].onclick = function() {
        patterns[i].display.classList.add("edit");
        editor.focus();
        requestAutocomplete(i);

        autocomplete.innerHTML="<option>loading&hellip;</option>";
    }
}

function setGuessWord(i, rawWord) {
    var word = rawWord.toUpperCase();

    if (patterns[i].guess == word) {
        // This is already the guess. Return "unsuccessful" so we
        // don't request a new set of guesses for it.
        return false;
    }

    if (!(dict.words.includes(word) || dict.impossible.indexOf(word) >= 0)) {
        // not a valid guess
        return false;
    }

    var oldGuess = patterns[i].guess;

    delete patterns[i].guess;
    var rebuilt = rebuildRemainingWords();

    if (word != "") {
        var newRemainingWords = [];
        for (var j in rebuilt) {
            if (score(word, rebuilt[j]) == patterns[i].pattern) {
                newRemainingWords.push(rebuilt[j]);
            }
        }
    } else {
        newRemainingWords = rebuilt;
    }

    var success;
    if (newRemainingWords.length > 0) {
        if (word != "") {
            patterns[i].guess = word;
        }
        for (var k in patterns[i].tiles) {
            patterns[i].tiles[k].getElementsByTagName("text")[0].innerHTML =
                (word == "") ? "" : word[k];
        }

        remainingWords = newRemainingWords;
        success = true;
    } else {
        if (oldGuess != null) {
            patterns[i].guess = oldGuess;
        }
        success = false;
    }

    return success;
}

function endGame() {
    var word = dict.words[remainingWords[0]];
    if (!patterns[0].guess) {
        for (i in word) {
            patterns[0].tiles[i].getElementsByTagName("text")[0]
                .innerHTML = word[i];
        }
    }
}

function shareUp() {
    navigator.clipboard.writeText("I found a "+(patterns.length-1)+" pattern DeWordle!"+gameDiagram()).then(function() { alert("Copied to clipboard!"); });
}

const emoji = {
    "incorrect-themeW":
    String.fromCodePoint(0x2b1c)+String.fromCodePoint(0xfe0f),
    "incorrect-themeK":
    String.fromCodePoint(0x2b1b)+String.fromCodePoint(0xfe0f),
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
        if (i == 0) {
            // skip answer pattern
            continue;
        }

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

    win.setAttribute("style", "display:none;");

    document.getElementById("paste").removeAttribute("style");

    board.innerHTML = "";
    resetBuild();
    clearPatterns();
    resetAnswer();
    window.history.replaceState('', '', '/');
    displayRemaining();
    resetGuesser();
}

var wordsLeft = document.getElementById("wordsleft");

// The square emoji are represented as two UTF-16 characters. This is
// a map from the "interesting" half of those pairs to the ASCII
// substitute we use, plus our canonical version.
const emoji_match = {};
for (k in emoji) {
    if (k.startsWith("incorrect")) {
        // For the white and black squares, the square itself is only
        // one UTF-16 character. The second character is optional, to
        // choose a better-looking version.
        emoji_match[emoji[k].charCodeAt(0)] = {
            "build": "0",
            // Chrome, Safari, and Firefox all render emoji in the URL
            // bar, except for the variation selector, which displays
            // as 3 percent-encoded bytes, so skip it here to look nicer.
            "clean": emoji[k].charAt(0),
            "class": "incorrect"
        };
    } else {
        // For the other colors, the first UTF-16 character is always
        // the same, and it's the second one that denotes the color.
        emoji_match[emoji[k].charCodeAt(1)] = {
            "build": k.startsWith("correct") ? "2" : "1",
            "clean": emoji[k],
            "class": k.substring(0, k.indexOf("-"))
        };
    }
}

var patterns;
var remainingWords;
function clearPatterns() {
    remainingWords = dict.map[242].map(function(x) { return x; });
    patterns = [{
        "pattern": 242,
        "display": answerdisplay,
        "tiles": answer
    }];
}

const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function initPatterns(start) {
    clearPatterns();

    var play = true;
    var cleanPattern = '';
    var buildPattern = '';
    var guess = '';
    for(var i = 0; i < start.length; i++) {
        var c = start.charCodeAt(i);
        if (c < 128) {
            c = start.charAt(i);
            if ("012".indexOf(c) >= 0) {
                buildPattern += c;
                cleanPattern += c;
            } else if(letters.indexOf(c) >= 0) {
                guess += c;
            }
        } else {
            // Yes, this ignores whether the high 10 bits of the
            // UTF-16 character are correct.
            if (c in emoji_match) {
                buildPattern += emoji_match[c].build;
                cleanPattern += emoji_match[c].clean;
            }
        }
        // Yes, this ignores characters we don't recognize.

        if (buildPattern.length == 5) {
            for (var j in buildPattern) {
                if (buildPattern[j] == "2") {
                    build[j].classList.add("correct");
                } else if (buildPattern[j] == "1") {
                    build[j].classList.add("almost");
                } else {
                    build[j].classList.add("incorrect");
                }
            }

            play &= addPattern(false);
            buildPattern = '';
        }

        if (guess.length == 5) {
            if (setGuessWord(patterns.length-1, guess)) {
                play &= remainingWords.length > 1;
            }
            guess = '';
        }
    }

    if (cleanPattern.length > 0) {
        if (!play) {
            endGame();
            requestGuesses(false);
        } else {
            requestGuesses(true);
        }
    }

    return cleanPattern;
}

var generation = 0;
var guesser = new Worker("guesser.js");
guesser.onmessage = function(m) {
    switch (m.data.type) {
    case "count":
        onCountMessage(m);
        break;
    case "words":
        onWordsMessage(m);
        break;
    case "autocomplete":
        onAutocompleteMessage(m);
        break;
    default:
        console.log("Unknown message: "+m);
    }
}

function onCountMessage(m) {
    for (var i in patterns) {
        if (patterns[i].pattern == m.data.pattern) {
            patterns[i].display.classList.remove("words");
            patterns[i].display.classList.add("summary");

            var count =
                patterns[i].display.getElementsByClassName("matchcount")[0];
            count.innerText = ""+m.data.count;
            if (m.data.generation == generation) {
                count.classList.remove("calculating");
            }
        }
    }
}

function onWordsMessage(m) {
    var count = m.data.words.length;

    for (var i in patterns) {
        if (patterns[i].pattern == m.data.pattern) {
            if (!(patterns[i].guess &&
                  m.data.words.includes(patterns[i].guess))) {
                var first = m.data.words.shift();
                for (var j in first) {
                    patterns[i].tiles[j]
                        .getElementsByTagName("text")[0]
                        .innerHTML = first[j];
                }
            } else {
                m.data.words.splice(
                    m.data.words.indexOf(patterns[i].guess), 1);
            }

            fillMatchCount(i, count);
            fillMatchWords(i, m.data.words);

            if (count > 0) {
                showMatchWords(i);
            } else {
                showMatchCount(i);
            }
        }
    }
}

function fillMatchCount(i, count) {
    var mc = patterns[i].display.getElementsByClassName("matchcount")[0];
    mc.classList.remove("calculating");
    mc.innerHTML = ""+count;
}

function fillMatchWords(i, words) {
    if (words.length <= 8) {
        patterns[i].display.getElementsByClassName("matchshort")[0]
            .innerHTML = words.join(", ");
    } else {
        var firstSix = words.slice(0, 6);
        patterns[i].display.getElementsByClassName("matchshort")[0]
            .innerHTML = firstSix.join(", ");

        patterns[i].display.getElementsByClassName("matchrest")[0]
            .removeAttribute("style");
        patterns[i].display.getElementsByClassName("matchlong")[0]
            .innerHTML = ", "+words.slice(6).join(", ");

        var preview = patterns[i].display
            .getElementsByClassName("matchexpand")[0];
        preview.onclick = previewExpand;
    }
}

function previewExpand() {
    var rest = this.parentElement;
    if (rest.classList.contains("less")) {
        rest.classList.remove("less");
        rest.classList.add("more");
    } else {
        rest.classList.remove("more");
        rest.classList.add("less");
    }
}

function showMatchCount(i) {
    patterns[i].display.classList.remove("words");
    patterns[i].display.classList.add("summary");
}

function showMatchWords(i) {
    patterns[i].display.classList.remove("summary");
    patterns[i].display.classList.add("words");
}

function onAutocompleteMessage(m) {
    if (m.data.generation == generation) {
        patterns[m.data.patterni].guesses = m.data.guesses.sort();
        var options = patterns[m.data.patterni].guesses.map(
            (g) => '<option value="'+g+'">'+g+'</option>');
        patterns[m.data.patterni]
            .display
            .getElementsByClassName("autocomplete")[0]
            .innerHTML = options;
    }
}

guesser.onerror = function(e) {
    console.log("guesser error: "+e);
}

function requestGuesses(countOnly) {
    generation++;
    Array.from(document.getElementsByClassName("matchcount"))
        .forEach((x) => x.classList.add("calculating"));
    guesser.postMessage({"type":"filter",
                         "generation": generation,
                         "count_only": countOnly,
                         "patterns": patterns.map((p) => p.pattern),
                         "answers": remainingWords});
}

function requestAutocomplete(patterni) {
    guesser.postMessage({"type":"autocomplete",
                         "generation": generation,
                         "patterni": patterni});
}

function resetGuesser() {
    guesser.postMessage({"type":"reset"});
}

var start = window.location.hash || '';
start = start.substring(start.indexOf("#")+1);
start = initPatterns(decodeURI(start));
window.history.replaceState(
    '', '', (start == '') ? '/' : '#'+hashFragment());

displayRemaining();

function displayRemaining() {
    fillMatchCount(0, remainingWords.length);
    fillMatchWords(0, remainingWords);
}

document.getElementById("theme").onchange = function() {
    displayTheme(this.value);
    window.localStorage.setItem('theme', this.value);
}

function displayTheme(theme) {
    if (theme.startsWith("GY")) {
        document.body.classList.remove("themeOB");
        document.body.classList.add("themeGY");
    } else {
        // startsWith("OB")
        document.body.classList.remove("themeGY");
        document.body.classList.add("themeOB");
    }

    if (theme.endsWith("W")) {
        document.body.classList.remove("themeK");
        document.body.classList.add("themeW");
    } else {
        // endsWith("K")
        document.body.classList.remove("themeW");
        document.body.classList.add("themeK");
    }
}

if (window.localStorage.getItem('theme')) {
    document.getElementById("theme").value =
        window.localStorage.getItem('theme');
    displayTheme(window.localStorage.getItem('theme'));
}

document.getElementById("paste").onchange = function() {
    var classList = ["correct", "almost", "incorrect"];
    var buildClasses = [];
    for (var j in build) {
        var found = false;
        for (var k in classList) {
            if (build[j].classList.contains(classList[k])) {
                buildClasses[j] = classList[k];
                build[j].classList.remove(classList[k]);
                found = true;
                break;
            }
        }
        if (!found) {
            buildClasses[j] = null;
        }
    }

    var i = 0;
    var j = 0;
    var play = true;
    for (i in this.value) {
        if (this.value.charCodeAt(i) in emoji_match) {
            build[j].classList.add(
                emoji_match[this.value.charCodeAt(i)].class);
            j++;
        }

        if (j == 5) {
            play &= addPattern();
            j = 0;
        }
    }
    this.value = "";

    if (!play) {
        endGame();
        requestGuesses(false);
    } else {
        requestGuesses(true);
        for (var j in build) {
            if (buildClasses[j] != null) {
                build[j].classList.add(buildClasses[j]);
            }
        }
    }
}
