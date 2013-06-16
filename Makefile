# bake parser.js.src out of Bison file parse.y,
# then preprocess the result with C preprocessor (cpp)
build:
	bison -l -r all -o parse.js.src parse.y
	cpp -E -CC -P parse.js.src > parse.js

# check if the parser state machine been touched
diff: build
	git diff -- parse.js.output

# just run the parser, it knows how to test itself
# add --use_strict to enshure the whole script is under protection :)
test: build
	d8 --use_strict runner-console.js

# profile with d8
prof: build
	d8 --prof --use_strict runner-console.js

CLEANUP=sed -E 's/ +\(line [0-9]+\)| \(\)//g'
compare: build
	ruby20 -yc ruby.rb 2>&1 | $(CLEANUP) >a.tmp
	d8 --use_strict runner-console.js | $(CLEANUP) >b.tmp
	diff a.tmp b.tmp

# convert the original parse.y to readable form
# DISFUNCTIONAL
ruby_source:
	gindent -nut -bl -bli0 -cli2 -npcs ruby20parse.lexer.y -o ruby20parse.lexer.pretty.y

