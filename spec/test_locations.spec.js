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

function assert_location (line, col, code)
{
  // do actual parsing
  var node = parser.parse(code, '(assert_parses)');

  // find out and unpack the root node location
  var node_loc;
  if (node.loc == undefined)
    node_loc = undefined;
  else
    node_loc = RubyParser.Lexer.unpack_location(node.loc);

  // copare their unpacked values (two hashes)
  expect(node_loc).toEqual({line: line, col: col});
}



describe("locations", function() {

  // program:
  it("test_empty_stmt", function() {
    assert_location
    (
      0,0,
      ""
    )
  });
  it("test_empty_stmt_spaces", function() {
    assert_location
    (
      3,4,
      "\n\n    "
    )
  });

});