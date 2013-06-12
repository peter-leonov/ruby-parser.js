build:
	bison -l -r all -o parse.js.src parse.y
	cpp -E -CC -P parse.js.src > parse.js

test: build
	v8 parse.js
