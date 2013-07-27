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

function by_path (node, path)
{
  path = path.split('/');

  // remove the leading empty string
  if (path[0] == '')
    path.shift();

  // remove the trailing empty string
  if (path[path.length-1] == '')
    path.pop()

  path: for (var i = 0, il = path.length; i < il; i++)
  {
    var selector = path[i];
    // digital selector
    if (/^\d+$/.test(selector))
    {
      node = node[+selector];
      continue;
    }

    // symbolic selector
    // search throw all the node children for node with name `selector`
    for (var j = 0, jl = node/*.children*/.length; j < jl; j++)
    {
      var child = node[j]

      if (child.type != selector)
        continue;

      node = child;
      continue path;
    }

    throw 'empty selector result for "'+selector+'"'
  }

  return node
}

// the main workhorse

function assert_location (path,  line,col,  type, code)
{
  // do actual parsing
  var root = parser.parse(code, '(assert_parses)');
  var node = by_path(root, path);

  // find out and unpack the root node location
  var node_loc;
  if (node.loc == undefined)
    node_loc = undefined;
  else
    node_loc = RubyParser.Lexer.unpack_location(node.loc);

  // compare the type of nodes
  expect(type).toBe(node.type);
  // copare their unpacked values (two hashes)
  expect(node_loc).toEqual({line: line, col: col});
}

describe("lexer", function() {

  it("test_at_eof_empty", function() {
    assert_location
    (
      '/',  1,0,  'begin',
      ""
    )
  });

  it("test_at_eof_newline", function() {
    assert_location
    (
      '/',  2,0,  'begin',
      "\n"
    )
  });

  it("test_at_eof_space", function() {
    assert_location
    (
      '/',  1,1,  'begin',
      " "
    )
  });

  it("test_at_eof_spaces", function() {
    assert_location
    (
      '/',  1,4,  'begin',
      "    "
    )
  });

  it("test_at_eof_newline_and_space", function() {
    assert_location
    (
      '/',  2,1,  'begin',
      "\n "
    )
  });

});

describe("locations", function() {

  it("test_BEGIN", function() {
    assert_location
    (
      '/1',  1,4,  'preexe',
      "1;  BEGIN {}"
    )
  });

});