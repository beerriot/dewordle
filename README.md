# De-Wordle

Wordle can be solved using only the colored-square diagrams, without
knowing any letters guessed. This app, "De-Wordle" (as in un-wordle,
reverse-wordle) makes a game of it. You guess colored-square diagrams
until it tells you you've narrowed down the possible answers to either
1 word (you win!) or 0 words (you lose!).

This is the `gh-pages` branch of this repository, which contains the
files for the website (https://dewordle.beerriot.com/). On the `main`
branch, you'll find the code that was used to build the file
`map-tiny.js`.

The `map-tiny.js` file is a map from colored-square diagrams to the
answer words that have guesses that can produce them. Its format:

```javascript
var dict = { // a name that the game code can reference
  "words": [ ... ], // the list of answer words
  "map64": [ ... ], // 243 diagram-to-word mappings
  };
```

The diagram mappings are in order of the diagram's base-3
representation, if "2" is substituted for correct-in-correct-place,
"1" for correct-in-wrong-place, and "0" for incorrect. So, the first
entry, at array position 0 is for diagram 00000, or "all
incorrect". The second entry, at array position 1 is for diagram
00001, or "all incorrect, except the right-most, which is correct but
in the wrong place". The third entry, at array position 2 is for
diagram 00002, or "all incorrect, except the right-most, which is
correct and in the right place". And the final entry, at array
position 242 is for diagram 22222, or "all correct".

Each diagram mapping is a base64-encoded string. Decoding one of those
strings produces a binary 290 bytes long. Each bit of that byte
indicates whether the corresponding word in the `words` list has one
or more guesses that generate this pattern (1 if it does, 0 if it does
not). This binary is little-endian encoded, so the lowest bit of the
first byte is for `words[0]`. The lowest bit of the second byte is for
`words[8]`. The third-lowest bit of the final byte is for
`words[2315]`, the end of the list.