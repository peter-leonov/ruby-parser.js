// prepare parser

var RubyParser = require('../parse.js').RubyParser;
RubyParser.prototype.print = function (msg) { throw msg }

var parser = new RubyParser();
// declare helper variables
['foo', 'bar', 'baz'].forEach(function (v) { parser.declareVar(v) })


// prepare mocking

var slice = Array.prototype.slice;
function s ()
{
  return slice.call(arguments);
}

global.print = require('util').print;

// the main workhorse

function unpack_float_loc (n)
{
  var integer = n | 0;
  var decimal = n - integer;

  if (decimal <= 0.9)
    decimal *= 10
  else if (decimal <= 0.99)
    decimal *= 100
  else // if decimal > 0.99)
    decimal = (decimal * 1000) | 0

  return {line: integer, col: decimal};
}

function assert_location (loc, code)
{
  // do actual parsing
  var node = parser.parse(code, '(assert_parses)');

  // find out and unpack the root node location
  var node_loc;
  if (node.loc == undefined)
    node_loc = undefined;
  else
    node_loc = RubyParser.Lexer.unpack_location(node.loc);

  // unpack cosy float-encoded location
  var expected = unpack_float_loc(loc);

  // copare their unpacked values (two hashes)
  expect(node_loc).toBe(expected);
}



describe("locations", function() {

});