this.global = this;
this.puts = print;

load('parse.js');

var text = read('ruby.rb');
quit(parse(text) ? 0 : 1);