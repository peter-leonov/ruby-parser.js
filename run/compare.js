function parse (text)
{
  var lexer = new YYLexer(text);
  var parser = new YYParser(lexer);
  
  parser.yydebug = 2; // render all the states transitions
  parser.yydebug_yylval = false; // don't print token values
  
  lexer.filename = 'ruby.rb';
  lexer.setText(text);
  return parser.parse();
}

var text = read('ruby.rb');
quit(parse(text) ? 0 : 1);