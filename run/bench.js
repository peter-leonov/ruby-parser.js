var begin = new Date();
load('parse.js')
print('load: ' + (new Date() - begin) + ' ms')

var text = read('tests/giant.rb');

var begin = new Date();
var lexer = new YYLexer();
var parser = new YYParser(lexer);
print('create: ' + (new Date() - begin) + ' ms')

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

print('parse: ' + (new Date() - begin) + ' ms')

var begin = new Date()
var json = JSON.stringify(to_plain(parser.resulting_ast));
print('to_json: ' + (new Date() - begin) + ' ms')
print('json size: ' + json.length + ' chars')

print('total lines: ' + lexer.ruby_sourceline)
print('last line: ' + lexer.get_lex_lastline())



function to_plain (n)
{
  if (!(n && n.type))
    return n;

  var ary = n.slice();
  ary.unshift(n.type);
  
  for (var i = 0, il = ary.length; i < il; i++)
    ary[i] = to_plain(ary[i]);
  
  return ary;
}
