default: build

# bake parser.js.src out of Bison file parse.y,
# then preprocess the result with C preprocessor (cpp)
bison:
	bison -l -r all -o parse.js.src parse.y


# different builds for different purposes

build: bison
	cpp -E -CC -P parse.js.src > parse.js

build_debug: bison
	cpp -E -CC -P -DDEBUG -DYYDEBUG parse.js.src > parse.js




# check if the parser state machine been touched
diff: build
	git diff -- parse.js.output

# just run the parser, it knows how to test itself
# add --use_strict to enshure the whole script is under protection :)
# test: build_debug
# 	d8 --use_strict run/console.js parse.js run/test.js

test: build_debug
	d8 --use_strict run/console.js parse.js run/test.js

test-lexer: build_debug
	d8 --use_strict run/console.js parse.js run/test-lexer.js \
		| grep 'Next token'


# profile with d8
prof: build
	d8 --prof --use_strict run/console.js parse.js run/bench.js

# benchmark agains giant ruby file
bench: build
	v8 run/console.js run/bench.js

DIFF=git diff --no-index --color --
CLEAN_BISON_LOG=sed -E 's/ +\(line [0-9]+\)| \(\)//g'
compare: build_debug
	ruby20 -yc ruby.rb 2>&1 | $(CLEAN_BISON_LOG) >tmp/a.tmp
	d8 --use_strict run/console.js parse.js run/compare.js \
		| $(CLEAN_BISON_LOG) >tmp/b.tmp
	$(DIFF) tmp/a.tmp tmp/b.tmp | cat

# # convert the original parse.y to readable form
# # DISFUNCTIONAL
# ruby_source:
# 	gindent -nut -bl -bli0 -cli2 -npcs ruby20parse.lexer.y -o ruby20parse.lexer.pretty.y

