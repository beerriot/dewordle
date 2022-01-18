-module(dewordle).

-compile(export_all).

generate_map() ->
    generate_map(open_word_list("possible.txt"),
                 open_word_list("impossible.txt")).

open_word_list(Filename) ->
    {ok, Data} = file:read_file(Filename),
    [ binary_to_list(W) || W <- string:split(Data, <<"\n">>, all),
                           W =/= <<>> ].

generate_map(Possible, Impossible) ->
    All = Possible ++ Impossible,
    Map = maps:from_keys(lists:seq(0,242), []),
    lists:foldl(fun(Word, Acc) ->  map_word(All, Word, Acc) end,
                Map,
                Possible).

map_word(All, Word, Map) ->
    Scores = lists:foldl(fun(Guess, Acc) ->
                                 ordsets:add_element(
                                   score_guess(Guess, Word), Acc)
                         end,
                         [],
                         All),
    Map = lists:foldl(fun(Score, Acc) ->
                              #{Score := SoFar} = Acc,
                              Acc#{Score := [Word|SoFar]}
                      end,
                      Map,
                      Scores),
    maps:map(fun(_K, V) -> ordsets:from_list(V) end, Map).

score_guess(Guess, Word) ->
    {UsedGuess, UsedWord} = score_correct(Guess, Word),
    list_to_integer(score_rest(UsedGuess, UsedWord), 3).

score_correct(Guess, Word) ->
    {RevG, RevW} = lists:foldl(fun({M, M}, {GS, WS}) ->
                                       %% purposefully non-matching for later
                                       {[$2|GS], [2,WS]};
                                  ({G, W}, {GS, WS}) ->
                                       {[G|GS], [W,WS]}
                               end,
                               {[], []},
                               lists:zip(Guess,Word)),
    {lists:reverse(RevG), lists:reverse(RevW)}.

score_rest(Guess, Word) ->
    {RevScore, _} = lists:foldl(fun($2, {Score, Acc}) ->
                                        {[$2|Score], Acc};
                                   (G, {Score, Acc}) ->
                                        case lists:splitwith(
                                               fun(L) -> L =/= G end,
                                               Acc) of
                                            {Head, [G|Tail]} ->
                                                {[$1|Score], [Head,1|Tail]};
                                            _ ->
                                                {[$0|Score], Acc}
                                        end
                                end,
                                {[], Word},
                                Guess),
    lists:reverse(RevScore).
