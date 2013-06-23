var begin = new Date();
load('parse.js')
print('load: ' + (new Date() - begin))

var text = read('tests/giant.rb');

var begin = new Date();
var lexer = new YYLexer(text);
lexer.filename = 'ruby.rb';
var parser = new YYParser(lexer);
print('create: ' + (new Date() - begin))

var begin = new Date()
parser.parse(text)
print('parse: ' + (new Date() - begin))

print('lines: ' + lexer.ruby_sourceline)
print('last: ' + lexer.get_lex_lastline())