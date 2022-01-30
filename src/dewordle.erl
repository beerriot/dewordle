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
    Map = maps:from_list(lists:zip(lists:seq(0,242),
                                   lists:duplicate(243, []))),
    WordMap = lists:foldl(fun(Word, Acc) ->  map_word(All, Word, Acc) end,
                          Map,
                          Possible),
    maps:map(fun(_K, V) -> ordsets:from_list(V) end, WordMap).

map_word(All, Word, Map) ->
    Scores = lists:foldl(fun(Guess, Acc) ->
                                 ordsets:add_element(
                                   score_guess(Guess, Word), Acc)
                         end,
                         [],
                         All),
    lists:foldl(fun(Score, Acc) ->
                        #{Score := SoFar} = Acc,
                        Acc#{Score := [Word|SoFar]}
                end,
                Map,
                Scores).

score_guess(Guess, Word) ->
    {UsedGuess, UsedWord} = score_correct(Guess, Word),
    list_to_integer(score_rest(UsedGuess, UsedWord), 3).

score_correct(Guess, Word) ->
    {RevG, RevW} = lists:foldl(fun({M, M}, {GS, WS}) ->
                                       %% purposefully non-matching for later
                                       {[$2|GS], [2|WS]};
                                  ({G, W}, {GS, WS}) ->
                                       {[G|GS], [W|WS]}
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
                                                {[$1|Score], Head++[1|Tail]};
                                            _ ->
                                                {[$0|Score], Acc}
                                        end
                                end,
                                {[], Word},
                                Guess),
    lists:reverse(RevScore).

format_score(Score) ->
    Number = integer_to_list(Score, 3),
    io:format("~ts~n",
              [[ case P of
                     $2 -> 16#1f7e9;
                     $1 -> 16#1f7e8;
                     $0 -> 16#2b1c
                 end
                 || P <-  lists:duplicate(5-length(Number), $0) ++ Number]]).

words_for_scores(Scores, Map) ->
    #{242 := AllWords} = Map,
    lists:foldl(fun(Score, Acc) ->
                        #{Score := Words} = Map,
                        ordsets:intersection(Words, Acc)
                end,
                AllWords,
                Scores).

scores_containing_word(Word, Map) ->
    maps:fold(fun(K, V, Acc) ->
                      case lists:member(Word, V) of
                          true ->
                              [K|Acc];
                          false ->
                              Acc
                      end
              end,
              [],
              Map).

words_with_same_score_as(Word, Map) ->
    #{242 := AllWords} = Map,
    maps:fold(fun(_, V, Acc) ->
                      case lists:member(Word, V) of
                          true ->
                              ordsets:intersection(V, Acc);
                          false -> Acc
                      end
              end,
              AllWords,
              Map).

classify_words(Map) ->
    #{242 := AllWords} = Map,
    lists:foldl(fun(Word, {Single, Multiple}) ->
                        case words_with_same_score_as(Word, Map) of
                            [Word] ->
                                {[Word|Single], Multiple};
                            Many ->
                                {Single, [{Word,Many}|Multiple]}
                        end
                end,
                {[], []},
                AllWords).

write_json_map(Filename, Map, Impossible) ->
    #{242 := Words} = Map,
    WordIndex = maps:from_list(
                  lists:zip(Words, lists:seq(0, length(Words)-1))),
    Json = [${,
            "\"possible\":", json_word_list(Words), $,,
            "\"impossible\":", json_word_list(Impossible), $,,
            "\"map64\":",
            $[,
            lists:join($,, [json_word_map(maps:get(N, Map), WordIndex)
                            || N <- lists:seq(0, 242)]),
            $],
            $}],
    file:write_file(Filename, Json).

json_word_list(Words) ->
    [$", lists:join($,, Words), $"].

json_word_map(Words, Index) ->
    json_word_map(Words, Index, 0, 0, []).

json_word_map([Word|Words], Index, Byte, ByteAcc, Acc) ->
    I = maps:get(Word, Index),
    case I div 8 of
        Byte ->
            json_word_map(Words, Index, Byte,
                          ByteAcc bor (1 bsl (I rem 8)),
                          Acc);
        Future ->
            json_word_map([Word|Words], Index, I div 8, 0,
                          lists:duplicate(Future-Byte-1, 0)
                          ++ [ByteAcc|Acc])
    end;
json_word_map([], Index, Byte, ByteAcc, Acc) ->
    FinalAcc = lists:duplicate((maps:size(Index) div 8)-Byte, 0)
        ++ [ByteAcc|Acc],
    [$", base64:encode(lists:reverse(FinalAcc)), $"].
