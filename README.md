# De-Wordle

Given one or more Wordle solution diagrams, with no letters, only
colored boxes, can we deduce the answer word?

# Thoughts

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
