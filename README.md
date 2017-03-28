# Simple examples first

### playground

Better see it once than hear thousand times: [Ruby to JSON online](http://peter-leonov.github.io/ruby-parser.js/) :)

### binary plus

```ruby
1 + 3.14
```

```js
["send"
  ["int", 1],
  "+",
  ["float", 3.14]
]
```

### simple value assignment

```ruby
a = 42
```

```js
["lvasgn",  "a",  ["int", 42]]
```

### attr access

```ruby
$object.attribute = 123
```

```js
["send",
  ["gvar", "$object"],
  "attribute=",
  ["int", 123]
]
```

As expected, just calling a method.

### variable, not a method

```ruby
a = 1
b = a
```

```js
["begin",
  ["lvasgn",  "a",  ["int", 1]],
  ["lvasgn",  "b",  ["lvar", "a"]]
]
```

The second entry of `a` is treated as a local variable `["lvar","a"]`, not a method.
`begin` here is a mythical wrapper for more than one statement.

### method, not a variable

```ruby
b = a
```

```js
["lvasgn",  "b",  ["send", null, "a"]]
```

Calling a method on `nil` means call the method on the `self` of the current scope. Or anything your AST processor needs it to mean :)

### array

```ruby
[42, 2.7, 'hello', %{world}]
```

```js
["array",
  ["int",    42],
  ["float",  2.7],
  ["str",    "hello"],
  ["str",    "world"]
]
```

### hash

```ruby
{a: 1, :b => 2, c => 3}
```

```js
["hash",
  ["pair",  ["sym","a"],       ["int",1]],
  ["pair",  ["sym","b"],       ["int",2]],
  ["pair",  ["send",null,"c"], ["int",3]]
]
```

# Complex examples

### heredocs, of course

```ruby
puts(<<AAA, <<BBB, <<CCC)
content of AAA
AAA
content of BBB
BBB
CCC
```

```js
["send",
  null, "puts",
  // arguments
  ["str","content of AAA\n"],
  ["str","content of BBB\n"],
  ["dstr"] // empty string (#1)
]
```

Cascade of heredocs.

### nested heredocs next

```ruby
<<"AAA"
aaa
#{
<<BBB
bbb
#{<<CCC
ccc
CCC
}
BBB
}
AAA
```

```js
["dstr",
  ["str", "aaa\n"],
  ["begin",
    ["dstr",
      ["str", "bbb\n"],
      ["begin",
        ["str", "ccc\n"]
      ],
      ["str", "\n"]
    ]
  ],
  ["str", "\n"]
]
```

Lots of dynamic strings.

### send with a block

```ruby
$a.map { |e| e ** 2 }
```

```js
["block",
  // method call
  ["send",  ["gvar","$a"],  "map"],
  // block arguments
  ["args",["arg","e"]],
  // block body
  ["send",["lvar","e"],"**",["int",2]]
]
```

The `send` node wrapped by the `block` node. AST is so abstract :)


# The thing

This yet another ruby parser consists of three parts:

    * Lexer
    * Parser
    * Builder

The original ruby lexer/parser/ast-generator from `parse.y` has all these three parts in one file, but, unfortunately, tangled tightly without any abstraction or a namespace isolation. All the ruby parsers out there have introduced strong isolation of the parts. So did we.

# The main parts

**Lexer** here is a line to line, bit to bit (I hope so) port of original `parse.y` lexer from C to JavaScript. With all the `goto`s emulated somehow. There are only a few regexps introduced for trivial things like checking alphabetical chars with `/^[a-zA-Z]/`. It tries to mimic each and every warning and error it can reach.

**Parser** is a precise copy of the original bison rules from bison part of `parse.y`. At this phase the parser relies on a port of bison state machine to JavaScript. It's a separated project called [bison-lalr1.js](https://github.com/kung-fu-tzu/bison-lalr1.js); AFAICT, the JS port does exactly the same state transitions and produce identical error messages as the original `yacc.c` bison skeleton does (compared with `ruby -yc`).

**Builder** is a simplified port of [the ruby parser](https://github.com/whitequark/parser) AST generation part. It has a brilliant API, so the JS port tries to copy it word to word. As a pleasant outcome the JS port got the [sexy sexp](http://whitequark.org/blog/2012/10/02/parsing-ruby/) AST format too. And [the AST documentation](https://github.com/whitequark/parser/blob/master/doc/AST_FORMAT.md) too.

# Progress so far

It can lex, parse and build an AST for `giant.rb` of ~49000 lines of ruby code copied from Opal project, ActiveRecord gem, and Realties gem. It takes the parser 1.3 sec to do all the job: 37ms for bootstrap, and 1249ms for parsing.

Further optimizations needed to reduce the garbage produced by the lexer and the builder phases.


# First run

    brew install node

then:

    node ruby2json.js 'puts(1 + 2.0)'


# Check it, please

Prerequisites:

    brew install node
    npm install jasmine-node -g

Run:

    make check

Standard Jasmine output follows. All the dots have to be green ;)

# Development

    brew install v8 # for d8
    brew install bison # 2.7.1 at the moment

and for `make check` to work:

    npm install jasmine-node -g

then change sample code in `debug.rb` and run:

    make compare

which will compare the parsing processes. If got bug, run:

    make debug

this will log all steps of the parser with all intermediate values.

In case you feel that the problem is in lexer, run:

    make debug-lexer

it will show all the token values lexer supplies.

# Bison rules!

If you need to touch around bison rules, please, run `make diff` to see, what changed. There must be no diff to parse.js.output :)

Then check the lexer.

# Lexer

To briefly test the lexer+parser tandem, run `make compare`. It will compare the parsing log of the original ruby and this parser. To do so you need to compile ruby 2.0.0-p195 with Bison 2.7.

# Ruby

To update the parser of the original ruby from Bison 2.3 (2006) to bison 2.7 (2012) install the new version of bison and delete file `parse.c` from its sources to force make calling bison.

And one more thing. Make your very own ruby 2.0.0-p195 (patch level matters in corner cases) executable visible by `ruby20` name.
