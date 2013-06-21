function parse (text)
{
  var lexer = new YYLexer(text);
  lexer.filename = 'ruby.rb';
  
  var parser = new YYParser(lexer);
  parser.yydebug = true; // render all the states transitions
  parser.yydebug_yylval = false; // don't print token values
  return parser.parse();
}

var text = read('ruby.rb');
quit(parse(text) ? 0 : 1);