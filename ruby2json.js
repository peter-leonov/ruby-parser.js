var util = require('util');
var fs   = require('fs');

global.print = function ()
{
  var ary = Array.prototype.slice.apply(arguments);
  util.print(ary.join(' '), '\n');
}

global.write = function ()
{
  var ary = Array.prototype.slice.apply(arguments);
  util.print(ary.join(' '));
}


var Parser = require('./parse.js');

var rbfile = process.argv[2];


function parse (text, filename)
{
  var lexer = new Parser.YYLexer(text);
  lexer.filename = filename;
  
  var parser = new Parser.YYParser(lexer);
  parser.yydebug = 1; // render all the states transitions
  parser.yydebug_yylval = true; // don't print token values
  // parser.yydebug_action = true; // print actions applied
  var ok = parser.parse();
  return {ok: ok, ast: parser.resulting_ast};
}

var text = fs.readFileSync(rbfile, {encoding: 'utf8'});
var result = parse(text, rbfile);

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

write(JSON.stringify(to_plain(result.ast)));

process.exit(+!result.ok);

