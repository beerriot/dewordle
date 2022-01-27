# De-Wordle

Given one or more Wordle solution diagrams, with no letters, only
colored boxes, can we deduce the answer word?

We can! Of the 2,315 words in Wordle's possible answer list, 2,151 are
uniquely identifiable by the subset of 243 possible patterns that
guess words will produce. The remaining 164 each have a pattern set
that is a subset of one or more of the 2,151, so technically they can
only be ruled *out*, by finding a pattern outside their set.

See discussion at https://blog.beerriot.com/2022/01/23/dewordle/ and
https://blog.beerriot.com/2022/01/24/dewordle-debugging/

This repository is now split into two branches: `main` and
`gh-pages`. Here on main, you'll find the Erlang code I used to figure
out whether this was possible. On `gh-pages`, you'll find the code for
(https://wordle.beerriot.com/), an interactive version of the
resulting pattern mapping that you can either play as a game in its
own right, or use as a tool.

## Example

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

Guess diagrams are represented as base-3 numbers:

 * 2 = green/orange = correct letter in correct position
 * 1 = yellow/blue = correct letter in wrong position
 * 0 = white/black = incorrect letter
