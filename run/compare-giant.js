function parse (text)
{
  var lexer = new YYLexer(text);
  lexer.filename = 'tests/giant.rb';
  
  var parser = new YYParser(lexer);
  parser.yydebug = 2; // render all the states transitions
  parser.yydebug_yylval = false; // don't print token values
  return parser.parse();
}

var text = read('tests/giant.rb');
quit(parse(text) ? 0 : 1);