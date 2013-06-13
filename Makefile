# bake parser.js.src out of Bison file parse.y,
# then preprocess the result with C preprocessor (cpp)
build:
	bison -l -r all -o parse.js.src parse.y
	cpp -E -CC -P parse.js.src > parse.js

# check the parser state machine been touched
diff: build
	git diff -- parse.js.output

# just run the parser, it knows how to test itself
test: build
	v8 parse.js
