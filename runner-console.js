this.global = this;
this.puts = print;
if (!this.write && this.putstr)
  this.write = this.putstr;

load('parse.js');

var text = read('ruby.rb');
quit(parse(text) ? 0 : 1);