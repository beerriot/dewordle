# De-Wordle

Given one or more Wordle solution diagrams, with no letters, only
colored boxes, can we deduce the answer word?

See discussion at https://blog.beerriot.com/2022/01/23/dewordle/

```erlang
Map = dewordle:generate_map().
["ALIEN"] = dewordle:words_for_scores([3#12112, 3#21211], Map).

%% Wordle 219 Prediction
["SPIEL"] = dewordle:words_for_scores([
                  3#00210, 3#00201, 3#22200,         % @omermeroz
                  3#01020, 3#10002,                  % @beckytopia
                  3#01210, 3#02200,                  % @shreyaghoshal
                  3#00100, 3#01201, 3#10210,         % @doriancraycray
                  3#00010, 3#01120,                  % @JakyNinjakitty
                  3#01211,                           % @anniedundun
                  3#01022,                           % @SoWhoIsAmber
                  3#01001, 3#01110, 3#21210,         % @MR0808
                  3#00200, 3#00222,                  % @fitztiptoes
                  3#01010, 3#20110, 3#21000,         % @vibinjabakar
                  3#22000,                           % @nonaness_
                  3#22002,                           % @Turbidarrow212
                  3#02202,                           % @jackomarto
                  3#11020,                           % @kuppanoodle
                  3#00220,                           % @JordanRasko
                  3#10012, 3#10110,                  % @snackynicky
                  3#00121,                           % @zalmaaaa
                  3#02010,                           % @PulloutMethyd
                  3#00211,                           % @taomeslibrary
                  3#01200, 3#11002,                  % @wildestays
                  3#00022, 3#22022,                  % @yasharmouta
                  3#10010, 3#11110,                  % @kdiizzles
                  3#22010,                           % @uwuttaker
                  3#02020,                           % @countjazula
                  3#00002, 3#01002, 3#00101, 3#02022,% @fisforfavorites
                  3#12000, 3#20102, 3#20012,         % @fel_clt
                  3#21021, 3#21011,                  % @spikeymikeyYT
                  3#22112                            % @echipir_
              ], Map).
```

# Archived Development Thoughts

(Colors mentioned below are for the light-theme, non-color-blind
diagram. Green = correct letter, correct place; Yellow = correct
letter, incorrect place; White = incorrect letter.)

Does it make more sense to work forward or backward (From first guess
toward solution, or from solution toward first guess?)

Does it make more sense to work work depth-first (through-game) or
breadth-first (across-games)?

Maybe order of guesses doesn't matter, if you're not going to make
assumptions about how a player plays.

Thinking about in-order one-game analyisis: For hard-mode, yellows can
be assumed used on any subsequent line when there are only greens and
whites.

Previous greens mostly mean nothing. Prevous guess means only that
there is a word in Impossible that has a given comparison to the
chosen word.

I've been thinking letter-by-letter deduction, but maybe whole-word is
better? Maybe only whole-word is possible?

Five letters, each green or white = 2^5 = 32 possible guess
diagrams. There are 26 word lists for any guess diagram with 1
green. 26^2 word lists for any guess diagram with 2 greens. What does
the pairwise overlap look like? That is, if we know Gwwww, and wGwww,
how many of the 26^2 possible pairings have non-empty intersections?
And how large are the intersections?

Knowing Gwwww and wGwww is not the same as knowing GGwww. The
interesting thing is whether there is a word in Possible or Impossible
that fits GGwww.

So basically, for each word in Possible, how many of the 2^5 guess
diagrams are actually possible?

Adding Yellow, we have 3^5=243 possible guess diagrams. How many of
those apply to each Possible word? These include the 2^5 green-white
only.

2314 Possible words * 243 possible guess diagrams = 562302
diagram-word pairings.

We can probably ignore yellows until we want to try to produce
solutions with fewer input diagrams?
