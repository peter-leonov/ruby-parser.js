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

// the main workhorse

function assert_parses (ast, code)
{
  var a = JSON.stringify(ast);
  var b = JSON.stringify(RubyParser.Builder.toPlain(parser.parse(code, '(assert_parses)')));
  expect(b).toBe(a);
}



describe("locations", function() {

});