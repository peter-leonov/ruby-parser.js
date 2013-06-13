this.global = this;
this.puts = print;

load('parse.js');

var text = read('ruby.rb');
print(parse(text));
