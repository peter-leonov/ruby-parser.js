
# First run

Prerequisites:

    brew install v8
    brew install bison # 2.7.1 at the moment

Run:

    make test.js

lots of output with "states", "shifts" etc.


# Bison rules!

If you need to touch around bison rules, please, run `make diff` to see, what changed. There must be no diff to parse.js.output :)

Then check the lexer.

# Lexer

To briefly test the lexer+parser tandem, run `make compare`. It will compare the parsing log of the original ruby and this parser. To do so you need to compile ruby 2.0.0p0 with Bison 2.7.

# Ruby

To update the parser of the original ruby from Bison 2.3 (2006) to bison 2.7 (2012) install the new version of bison and delete file `parse.c` from its sources to force make calling bison.

And one more thing. Make your very own ruby 2.0 executable visible by `ruby20` name.
