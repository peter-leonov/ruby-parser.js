this.global = this;
this.puts = print;

load('parse.js');

var text = read('ruby.rb');
if (!parse(text))
  puts('Error.')
