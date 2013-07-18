var parser = new RubyParser();
// tweak debug output
parser.print = write; // let the parser speak
parser.parser.yydebug = 2; // render all the states transitions
parser.parser.yydebug_yylval = false; // don't print token values

var text = read('debug.rb');
quit(parser.parse(text, 'debug.rb') ? 0 : 1);