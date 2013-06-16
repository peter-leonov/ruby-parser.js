this.global = this;
this.puts = print;

load('parse.js');

var text = read('tests/lexer/text.txt');
var begin = new Date()
if (!parse(text))
  puts('Error.')
print('time: ' + (new Date() - begin))
