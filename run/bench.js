var begin = new Date();
load('parse.js')
print('load: ' + (new Date() - begin))

var text = read('tests/giant.rb');

var begin = new Date();
var lexer = new YYLexer();
var parser = new YYParser(lexer);
print('create: ' + (new Date() - begin))

var begin = new Date()
try
{
  lexer.filename = 'ruby.rb';
  lexer.setText(text);
  parser.parse();
}
catch (e)
{
  print(e.stack);
}

print('parse: ' + (new Date() - begin))

print('lines: ' + lexer.ruby_sourceline)
print('last: ' + lexer.get_lex_lastline())