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
