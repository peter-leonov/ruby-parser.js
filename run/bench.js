var begin = new Date();
load('parse.js')
print('load: ' + (new Date() - begin))

var text = read('tests/lexer/text.rb');

var begin = new Date();
var lexer = new YYLexer(text);
lexer.filename = 'ruby.rb';
var parser = new YYParser(lexer);
print('create: ' + (new Date() - begin))

var begin = new Date()
parser.parse(text)
print('parse: ' + (new Date() - begin))
