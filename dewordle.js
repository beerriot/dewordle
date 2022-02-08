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
        requestGuesses(false);
        for (i in build) { build[i].remove(); }
    } else {
        requestGuesses(true);
    }
    displayRemaining();
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
        "display": guesscount.cloneNode(true),
        "tiles": []
    };
    patterns.push(record);
    dupeAndResetBuild();

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
        play.setAttribute("style", "display: none;");
        win.removeAttribute("style");

        addrow.setAttribute("style", "display: none;");
        share.removeAttribute("style");

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
    clearPatterns();
    window.location.hash = "";
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
    patterns = [];
}

function initPatterns(start) {
    clearPatterns();

    var play = true;
    var cleanPattern = '';
    var buildPattern = '';
    for(var i = 0; i < start.length; i++) {
        var c = start.charCodeAt(i);
        if (c < 128) {
            c = start.charAt(i);
            if ("012".indexOf(c) >= 0) {
                buildPattern += c;
                cleanPattern += c;
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
            buildPattern = [];
        }
    }

    if (cleanPattern.length > 0) {
        if (!play) {
            requestGuesses(false);
            for (var i in build) { build[i].remove(); }
        } else {
            requestGuesses(true);
        }
    }

    return cleanPattern;
}

var generation = 0;
var guesser = new Worker("guesser.js");
guesser.onmessage = function(m) {
    if (m.data.type == "count") {
        for (var i in patterns) {
            if (patterns[i].pattern == m.data.pattern) {
                patterns[i].display.removeAttribute("style");
                var count =
                    patterns[i].display.getElementsByClassName("matchcount")[0];
                count.innerText = ""+m.data.count;
                if (m.data.generation == generation) {
                    count.classList.remove("calculating");
                }
            }
        }
    } else if (m.data.type == "words") {
        var words = [];
        for (var j in m.data.words) { words.push(j); }
        var first = words.shift();

        for (var i in patterns) {
            if (patterns[i].pattern == m.data.pattern) {
                for (var j in first) {
                    patterns[i].tiles[j].getElementsByTagName("text")[0].innerHTML = first[j];
                }
                if (words.length > 0) {
                    patterns[i].display.removeAttribute("style");
                    if (words.length <= 8) {
                        patterns[i].display.children[0].innerHTML = "<i>or</i> "+words.join(", ");
                    } else {
                        var firstSix = words.slice(0, 6);
                        patterns[i].display.children[0].innerHTML = "<i>or</i> "+firstSix.join(", ");

                        var rest = document.createElement("span");
                        rest.setAttribute("style", "display: none");
                        rest.innerHTML = ", "+words.slice(6).join(", ");
                        patterns[i].display.children[0].append(rest);

                        var preview = document.createElement("a");
                        preview.classList.add("more");
                        preview.innerHTML = " &#x2026;&nbsp;&#x1f53d;";
                        preview.onclick = function() {
                            if (this.classList.contains("more") > 0) {
                                rest.removeAttribute("style");
                                this.innerHTML = " &#x1f53c;";
                                this.classList.remove("more");
                            } else {
                                rest.setAttribute("style", "display: none");
                                this.innerHTML = " &#x2026;&nbsp;&#x1f53d;";
                                this.classList.add("more");
                            }
                        }
                        patterns[i].display.children[0].append(preview);
                    }
                } else {
                    patterns[i].display.children[0].innerText = "";
                }
            }
        }
    } else {
        console.log("Unknown message: "+m);
    }
};

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

function resetGuesser() {
    guesser.postMessage({"type":"reset"});
}

var start = window.location.hash || '';
start = start.substring(start.indexOf("#")+1);
start = initPatterns(decodeURI(start));
window.history.replaceState(
    '', '', (start == '') ? '/' : '#'+encodeURI(start));

displayRemaining();

function displayRemaining() {
    wordsLeft.innerText = ""+remainingWords.length;

    document.getElementById("remainingwords").innerText = remainingWords.map(
        function(w) { return dict.words[w]; }).join(", ");
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

document.getElementById("showwords").onchange = function() {
    if (this.checked) {
        document.getElementById("remainingwords").removeAttribute("style");
    } else {
        document.getElementById("remainingwords").setAttribute("style", "display: none;");
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
            play &= addPattern();
            j = 0;
        }
    }
    this.value = "";

    if (!play) {
        requestGuesses(false);
        for (var i in build) { build[i].remove(); }
    } else {
        requestGuesses(true);
        for (var j in build) {
            if (buildClasses[j] != null) {
                build[j].classList.add(buildClasses[j]);
            }
        }
    }
}
