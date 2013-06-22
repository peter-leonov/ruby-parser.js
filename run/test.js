function parse (text)
{
  var lexer = new YYLexer(text);
  lexer.filename = 'ruby.rb';
  
  var parser = new YYParser(lexer);
  parser.yydebug = 1; // render all the states transitions
  parser.yydebug_yylval = true; // don't print token values
  // parser.yydebug_action = true; // print actions applied
  return parser.parse();
}

var text = read('ruby.rb');
quit(parse(text) ? 0 : 1);