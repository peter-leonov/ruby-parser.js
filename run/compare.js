var parser = new RubyParser();
// tweak debug output
parser.parser.yydebug = 2; // render all the states transitions
parser.parser.yydebug_yylval = false; // don't print token values

var text = read('ruby.rb');
quit(parser.parse(text, 'ruby.rb') ? 0 : 1);