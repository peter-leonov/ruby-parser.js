function parse (text)
{
  var lexer = new YYLexer();
  var parser = new YYParser(lexer);
  parser.yydebug = 1; // render all the states transitions
  parser.yydebug_yylval = true; // don't print token values
  // parser.yydebug_action = true; // print actions applied
  
  lexer.filename = 'ruby.rb';
  lexer.setText(text);
  var ok = parser.parse();
  return {ok: ok, ast: parser.resulting_ast};
}

var text = read('ruby.rb');
var result = parse(text);

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

print(JSON.stringify(to_plain(result.ast)));

quit(+!result.ok);
