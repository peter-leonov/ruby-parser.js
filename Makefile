test:
	bison -l -r all -o parse.js.src parse.y
	cpp -E -CC -P parse.js.src > parse.js
	v8 parse.js
