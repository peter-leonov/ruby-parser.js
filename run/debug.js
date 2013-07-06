var parser = new RubyParser();
// tweak debug output
parser.parser.yydebug = 1; // render all the states transitions
parser.parser.yydebug_yylval = true; // don't print token values

var text = read('debug.rb');
var ast = parser.parse(text, 'debug.rb');

print(JSON.stringify(RubyParser.Builder.toPlain(ast)));

quit(ast ? 0 : 1);
