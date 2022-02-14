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

function addrowUp(ev) {
    if (!addPattern()) {
        requestGuesses(false);
    } else {
        requestGuesses(true);
    }
    displayRemaining();
}

function eraserowUp(ev) {
    // the display is the next element
    var i = this.parentElement.nextElementSibling.dataset.patterni;

    for (t of patterns[i].tiles) {
        t.remove();
    }
    patterns[i].display.previousElementSibling.remove(); //rightpad
    patterns[i].display.previousElementSibling.remove(); //leftpad
    patterns[i].display.remove();

    patterns.splice(i, 1);
    for (var i in patterns) {
        patterns[i].display.dataset.patterni = i;
    }

    remainingWords = rebuildRemainingWords();

    var fragment = hashFragment();
    window.history.replaceState('', '', fragment ? "#"+fragment : '');

    if (remainingWords.length > 1) {
        requestGuesses(true);
    } else {
        requestGuesses(false);
    }

    displayRemaining();
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
    erase.onpointerup = eraserowUp;
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

function showEdit(e) {
    var display = this.closest(".display");
    display.classList.add("edit");
    display.getElementsByClassName("editor")[0].focus();

    display.getElementsByClassName("autocomplete")
        .innerHTML="<option>loading&hellip;</option>";
    requestAutocomplete(patterns[display.dataset.patterni].pattern);
}

function hideEdit(e) {
    this.closest(".display").classList.remove("edit");
}

function maybeHideEdit(e) {
    if (!this.parentElement.contains(e.relatedTarget)) {
        hideEdit.call(this, e);
    }
}

function setWord(e) {
    var display = this.closest(".display");
    var i = display.dataset.patterni;

    if (setGuessWord(i, this.value)) {
        window.history.replaceState('', '', "#"+hashFragment());
        display.getElementsByClassName("editor")[0].value = this.value;

        if (remainingWords.length == 1) {
            requestGuesses(false);
        } else {
            requestGuesses(true);
        }

        displayRemaining();
        hideEdit.call(this, e);
    }
}

function editKeyUp(e) {
    if (e.key === "Enter") {
        setWord.call(this, e);
    } else if (e.key === "Escape") {
        this.value =
            patterns[this.closest(".display").dataset.patterni].guess || '';
        hideEdit.call(this, e);
    }
}

function editKeyDown(e) {
    var display = this.closest(".display");
    var autocomplete = display.getElementsByClassName("autocomplete")[0];

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

function editOnInput(e) {
    var display = this.closest(".display");
    var i = display.dataset.patterni;
    if (patterns[i].guesses) {
        var search = this.value.toUpperCase();
        var optsHTML = patterns[i].guesses.map(
            (g) => (g.indexOf(search) >= 0)
                ? '<option value="'+g+'">'+g+'</option>' : '').join('');
        display.getElementsByClassName("autocomplete")[0]
            .innerHTML = optsHTML;
    }
}

function addEditListener(display, i) {
    display.dataset.patterni = i;
    var editor = display.getElementsByClassName("editor")[0];
    var autocomplete = display.getElementsByClassName("autocomplete")[0];

    editor.onblur = maybeHideEdit;
    editor.oninput = editOnInput;
    editor.onkeydown = editKeyDown;

    editor.onkeyup = editKeyUp;
    autocomplete.onkeyup = editKeyUp;

    autocomplete.onblur = maybeHideEdit;
    autocomplete.oninput = function() {
        editor.value = this.value;
    }
    autocomplete.onclick = setWord;

    display.getElementsByClassName("editguess")[0].onclick = showEdit;
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

function shareUp() {
    var message;
    if (remainingWords.length == 1) {
        if (patterns.reduce((acc, p) => acc & (!p.guess), true)) {
            // only colors, no guesses
            message = "I found a "+(patterns.length-1)+
                " pattern DeWordle!";
        } else if (patterns.reduce((acc, p) => acc & (!!p.guess), true)) {
            message = "My plays for yesterday's Wordle:";
        } else {
            message = "Can you guess the missing words here?";
        }
    } else {
        message = "Only "+remainingWords.length+
            " answers fit this Wordle guess pattern. What are they?";
    }

    message += gameDiagram();
    message += "\n"+window.location.href;

    navigator.clipboard.writeText(message)
        .then(function() { alert("Copied to clipboard!"); });
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

        diagram += patterns[i].guess ? ' '+patterns[i].guess : '';
    }

    if (patterns[0].guess) {
        diagram += emoji["correct"+pallete].repeat(5)+' '+patterns[0].guess;
    }

    return diagram;
}

function resetUp() {
    board.innerHTML = "";
    resetBuild();
    clearPatterns();
    resetAnswer();
    window.history.replaceState('', '', '/');
    displayRemaining();
    resetGuesser();
}

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

            if (!patterns[i].guess) {
                for (t of patterns[i].tiles) {
                    t.getElementsByTagName("text")[0].innerHTML = '';
                }
            }

            fillMatchCount(i, m.data.count, m.data.generation);
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

            fillMatchCount(i, count, m.data.generation);
            fillMatchWords(i, m.data.words);

            if (count == 1) {
                if (patterns[i].guess) {
                    // want to be able to edit
                    showMatchCount(i);
                } else {
                    // edit wouldn't do anything
                    hideMatchCount(i);
                    hideMatchWords(i);
                }
            } else if (count > 1) {
                showMatchWords(i);
            } else {
                // shows "zero"
                showMatchCount(i);
            }
        }
    }
}

function fillMatchCount(i, count, countgen) {
    var mc = patterns[i].display.getElementsByClassName("matchcount")[0];
    mc.innerText = ""+count;

    if (countgen == generation) {
        mc.classList.remove("calculating");
    }
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
    hideMatchWords(i);
    patterns[i].display.classList.add("summary");
}

function hideMatchCount(i) {
    patterns[i].display.classList.remove("summary");
}
function showMatchWords(i) {
    hideMatchCount(i);
    patterns[i].display.classList.add("words");
}

function hideMatchWords(i) {
    patterns[i].display.classList.remove("words");
}

function onAutocompleteMessage(m) {
    if (m.data.generation == generation) {
        for (i in patterns) {
            if (patterns[i].pattern == m.data.pattern &&
                patterns[i].display.classList.contains("edit")) {
                patterns[i].guesses = m.data.guesses.sort();
                var options = patterns[i].guesses.map(
                    (g) => '<option value="'+g+'">'+g+'</option>');
                patterns[i]
                    .display
                    .getElementsByClassName("autocomplete")[0]
                    .innerHTML = options;
                break;
            }
        }
    }
}

guesser.onerror = function(e) {
    console.log("guesser error: "+e);
}

function requestGuesses(countOnly) {
    generation++;
    Array.from(document.getElementsByClassName("matchcount"))
        .forEach((x) => x.classList.add("calculating"));

    // 1. Never request guesses for answer pattern - we know that list
    // already. 2. Never request guesses for the same pattern multiple
    // times - the same result applies to all of them.
    var reqpats = new Set();
    patterns.forEach((p, i) => (i > 0) && reqpats.add(p.pattern));

    guesser.postMessage({"type":"filter",
                         "generation": generation,
                         "count_only": countOnly,
                         "patterns": [...reqpats],
                         "answers": remainingWords});
}

function requestAutocomplete(pattern) {
    if (pattern != 242) {
        guesser.postMessage({"type":"autocomplete",
                             "generation": generation,
                             "pattern": pattern});
    } else {
        // if we're dealing with the answer pattern, we already know
        // the answer
        onAutocompleteMessage({"data": {
            "pattern": 242,
            "guesses": remainingWords.map((i) => dict.words[i]),
            "generation": generation}});
    }
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
    fillMatchCount(0, remainingWords.length, generation);
    if (remainingWords.length == 1) {
        if (!patterns[0].guess) {
            hideMatchCount(0);

            var word = dict.words[remainingWords[0]];
            for (i in word) {
                patterns[0].tiles[i].getElementsByTagName("text")[0]
                    .innerHTML = word[i];
            }
        } else {
            // want to be able to edit (and since there is a guess, we
            // don't need to set the text in the tiles)
            showMatchCount(0);
        }
    } else {
        if (!patterns[0].guess) {
            for (t of patterns[0].tiles) {
                t.getElementsByTagName("text")[0].innerHTML = '';
            }
        }
        showMatchCount(0);
    }
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
            if (build.reduce(
                (acc, b) => acc & b.classList.contains("correct"),
                true)) {
                // don't add the 242 answer pattern
                resetBuild();
            } else {
                play &= addPattern();
            }

            j = 0;
        }
    }
    this.value = "";

    displayRemaining();

    if (!play) {
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
