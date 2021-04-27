# WordUnscramblerAPI
An API to parse a dictionary, unscramble words, and return substring combinations.

The working API is available here: https://WordUnscramblerAPI.josiahsprankle.repl.co

This is an API to unscramble words, return all possibilities and substrings of a string, and search words in a dictionary. To use this API, the routes are:

`https://WordUnscramblerAPI.josiahsprankle.repl.co/dictionary/yourword` --- (returns the definitions)

`https://WordUnscramblerAPI.josiahsprankle.repl.co/trees/yourword` --- (returns every single possible combination, substring, and slice of your word in every possible order.... this is a very expensive algorithm, so I have limited the usage to 7 characters.)

`https://WordUnscramblerAPI.josiahsprankle.repl.co/unscramble/yourword` --- This will return all possible words, but will include a couple of non-stardard words and abbreviations.

`https://WordUnscramblerAPI.josiahsprankle.repl.co/deep-unscramble/yourword` --- This will return all possible words and check them against the Merriam-Webster dictionary website to ensure that the words are valid. This takes much longer, but will be more accurate if you are patient. 
