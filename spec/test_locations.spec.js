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

  if (path[0] == '')
    // remove the leading empty root
    path.shift()
  else
    // trick for checking root node type
    node = [node];

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
    
    var nth = 0;
    
    var m = /(\w+)\[(\d+)\]/.exec(selector);
    if (m)
    {
      selector = m[1];
      nth = m[2];
    }
    
    // search throw all the node children for node with name `selector`
    for (var j = 0, jl = node/*.children*/.length; j < jl; j++)
    {
      var child = node[j]

      if (child.type != selector)
        continue;

      if (nth-- != 0) // it is not the node you are looking for
        continue;
      
      node = child;
      continue path;
    }

    throw 'empty selector result for "'+selector+'"'
  }

  // compare the type of nodes
  expect(node.type).toBe(selector);

  return node
}

// the main workhorse

function assert_location (path,  line,col, code)
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

  // copare their unpacked values (two hashes)
  expect(node_loc).toEqual({line: line, col: col});
}

describe("lexer", function() {

  // EOF

  it("test_at_eof_empty", function() {
    assert_location
    (
      'begin',  1,0,
      ""
    )
  });

  it("test_at_eof_newline", function() {
    assert_location
    (
      'begin',  2,0,
      "\n"
    )
  });

  it("test_at_eof_space", function() {
    assert_location
    (
      'begin',  1,1,
      " "
    )
  });

  it("test_at_eof_spaces", function() {
    assert_location
    (
      'begin',  1,4,
      "    "
    )
  });

  it("test_at_eof_newline_and_space", function() {
    assert_location
    (
      'begin',  2,1,
      "\n "
    )
  });

  // EOL

  it("test_at_eol_empty", function() {
    assert_location
    (
      'int',  1,0,
      "7"
    )
  });

  it("test_at_eol_newline", function() {
    assert_location
    (
      'int',  2,0,
      "\n7"
    )
  });

  it("test_at_eol_space", function() {
    assert_location
    (
      'int',  1,1,
      " 7"
    )
  });

  it("test_at_eol_spaces", function() {
    assert_location
    (
      'int',  1,4,
      "    7"
    )
  });

  it("test_at_eol_newline_and_space", function() {
    assert_location
    (
      'int',  2,1,
      "\n 7"
    )
  });

});

describe("locations", function() {

  it("test_BEGIN", function() {
    assert_location
    (
      '/preexe',  1,4,
      "1;  BEGIN {}"
    )
  });

  it("test_bodystmt", function() {
    assert_location
    (
      'kwbegin',  1,0,
      "begin; 1; rescue; 2; rescue; 3; else; 4; end"
    )
    assert_location
    (
      '/rescue',  1,5,
      "begin; 1; rescue; 2; rescue; 3; else; 4; end"
    )
    assert_location
    (
      '/rescue/resbody',  1,18,
      "begin; 1; rescue; 2; rescue; 3; else; 4; end"
    )
    assert_location
    (
      '/rescue/resbody[1]',  1,29,
      "begin; 1; rescue; 2; rescue; 3; else; 4; end"
    )
  });

});