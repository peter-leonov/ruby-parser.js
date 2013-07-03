
# The thing

This yet another ruby parser consists of three parts:

    * Lexer
    * Parser
    * Builder

The original ruby lexer/parser/ast-generator from `parse.y` has all these three parts in one file, but, unfortunately, tangled tightly without any abstraction or a namespace isolation. All the ruby parsers out there have introduced strong isolation of the parts. So did we.

# The main parts

**Lexer** here is a line to line, bit to bit (I hope so) port of original `parse.y` lexer from C to JavaScript. With all the `goto`s emulated somehow. There are only a few regexps introduced for trivial things like checking alphabetical chars with `/^[a-zA-Z]/`. It tries to mimic each and every warning and error it can reach.

**Parser** is a precise copy of the original bison rules from bison part of `parse.y`. At this phase the parser relies on a port of bison state machine to JavaScript. It's a separated project called [bison-lalr1.js](https://github.com/kung-fu-tzu/bison-lalr1.js); AFAICT, the JS port does exactly the same state transitions and produce identical error messages as the original `yacc.c` bison skeleton does (compared with `ruby -yc`).

**Builder** is a simplified port of [the ruby parser](https://github.com/whitequark/parser) AST generation part. It has a brilliant API, so the JS port tries to copy it word to word. As a pleasant outcome the JS port got the [sexy sexp](http://whitequark.org/blog/2012/10/02/parsing-ruby/) AST format too.

# Progress so far

It can lex, parse and build an AST for `giant.rb` of ~49000 lines of ruby code copied from Opal project, ActiveRecord gem, and Realties gem. It takes the parser 1.3 sec to do all the job: 37ms for bootstrap, and 1249ms for parsing.

Further optimizations needed to reduce the garbage produced by the lexer and the builder phases.


# First run

Prerequisites:

    brew install v8
    brew install bison # 2.7.1 at the moment

Run:

    make test

lots of output with "states", "shifts" etc.


# Bison rules!

If you need to touch around bison rules, please, run `make diff` to see, what changed. There must be no diff to parse.js.output :)

Then check the lexer.

# Lexer

To briefly test the lexer+parser tandem, run `make compare`. It will compare the parsing log of the original ruby and this parser. To do so you need to compile ruby 2.0.0-p195 with Bison 2.7.

# Ruby

To update the parser of the original ruby from Bison 2.3 (2006) to bison 2.7 (2012) install the new version of bison and delete file `parse.c` from its sources to force make calling bison.

And one more thing. Make your very own ruby 2.0.0-p195 (patch level matters in corner cases) executable visible by `ruby20` name.
