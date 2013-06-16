this.global = this;
this.puts = print;

var begin = new Date()
load('parse.js');
print('load: ' + (new Date() - begin))
var text = read('tests/lexer/text.txt');

var begin = new Date()
parse(text)
print('parse: ' + (new Date() - begin))
