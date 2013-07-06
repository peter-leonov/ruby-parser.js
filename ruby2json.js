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


var RubyParser = require('./parse.js').RubyParser;

var parser = new RubyParser();

var text = process.argv[2];

var json = parser.toJSON(text);

print(json);

process.exit(json ? 0 : 1);

