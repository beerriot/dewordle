// WebWorker doing the more computationally expensive work of finding
// guesses that fit the colors, given the filtered answers.

// adds 'dict' to scope
importScripts("map.js");
dict.words = dict.possible.split(",");

onmessage = function(m) {
    if (m.data.type == "reset") {
        reset();
    } else if (m.data.type == "filter") {
        filter(m.data.count_only, m.data.patterns, m.data.answers);
    } else {
        console.log("Unknown message: m.data");
    }
};

var patterns = [];
function reset() {
    patterns = [];
}

function filter(count_only, newPatterns, answers) {
    for (var i in newPatterns) {
        if (i < patterns.length) {
            patterns[i].guesses =
                filterExisting(patterns[i].guesses, answers);
        } else {
            patterns[i] = {
                "pattern": newPatterns[i],
                "guesses": guessesForPattern(newPatterns[i], answers)
            }
        }

        if (count_only) {
            var count = 0;
            for (x in patterns[i].guesses) { count++; }
            postMessage({"type":"count",
                         "pattern": newPatterns[i],
                         "count": count});
        } else {
            postMessage({"type":"words",
                         "pattern": newPatterns[i],
                         "words": patterns[i].guesses});
        }
    }
}

function filterExisting(guesses, remainingWords) {
    var newGuesses = {};
    for (var j in guesses) {
        var newMatches = guesses[j].filter(
            function(m) { return remainingWords.includes(m); });
        if (newMatches.length > 0) {
            newGuesses[j] = newMatches;
        }
    }
    return newGuesses;
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
