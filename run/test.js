var parser = new RubyParser();
// tweak debug output
parser.parser.yydebug = 1; // render all the states transitions
parser.parser.yydebug_yylval = true; // don't print token values

var text = read('ruby.rb');
var ast = parser.parse(text, 'ruby.rb');

print(JSON.stringify(RubyParser.Builder.toPlain(ast)));

quit(ast ? 0 : 1);
