var begin = new Date();
load('parse.js')
print('load: ' + (new Date() - begin) + ' ms')

var text = read('tests/giant.rb');

var begin = new Date();
var parser = new RubyParser();
print('create: ' + (new Date() - begin) + ' ms')

var begin = new Date()
try
{
  var ast = parser.parse(text, 'ruby.rb');
}
catch (e)
{
  print(e.stack);
}

print('parse: ' + (new Date() - begin) + ' ms')

var begin = new Date()
var json = JSON.stringify(RubyParser.Builder.toPlain(ast));
print('to_json: ' + (new Date() - begin) + ' ms')
print('json size: ' + json.length + ' chars')

print('total lines: ' + parser.lexer.ruby_sourceline)
print('last line: ' + parser.lexer.get_lex_lastline())
