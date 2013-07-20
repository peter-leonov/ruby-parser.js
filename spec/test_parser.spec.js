var RubyParser = require('../parse.js').RubyParser;
RubyParser.prototype.print = function (msg) { throw msg }

var slice = Array.prototype.slice;
function s ()
{
  return slice.call(arguments);
}

var toPlain = RubyParser.Builder.toPlain;
function assert_parses (ast, code)
{
  var a = JSON.stringify(ast);
  var b = JSON.stringify(toPlain(parser.parse(code, '(assert_parses)')));
  expect(b).toBe(a);
}

var parser = new RubyParser();
// declare helper variables
['foo', 'bar', 'baz'].forEach(function (v) { parser.declareVar(v) })

describe("Builder", function() {

  //
  // Literals
  //

  it("test_empty_stmt", function() {
    assert_parses
    (
      null,
      ""
    )
  });
  
  it("test_nil", function() {
    assert_parses(
      s('nil'),
      "nil")
  });
  
  it("test_nil_expression", function() {
    assert_parses(
      s('begin'),
      '()')

    assert_parses(
      s('kwbegin'),
      'begin end')
  });

  it("test_true", function() {
    assert_parses(
      s('true'),
      'true')
  });

  it("test_false", function() {
    assert_parses(
      s('false'),
      'false')
  });

  it("test_int", function() {
    assert_parses(
      s('int', 42),
      '42')

    assert_parses(
      s('int', -42),
      '-42')
  });

  it("test_int___LINE__", function() {
    assert_parses(
      s('__LINE__', 1),
      '__LINE__')
  });
  
  it("test_float", function() {
    assert_parses(
      s('float', 1.33),
      '1.33')

    assert_parses(
      s('float', -1.33),
      '-1.33')
  });
  
  // Strings

  it("test_string_plain", function() {
    assert_parses(
      s('str', 'foobar'),
      "'foobar'")
    
    assert_parses(
      s('str', 'foobar'),
      '%q(foobar)')
  });

  it("test_string_interp", function() {
    assert_parses(
      s('dstr',
        s('str', 'foo'),
        s('begin', s('lvar', 'bar')),
        s('str', 'baz')),
      '"foo#{bar}baz"')
  });

  it("test_string_dvar", function() {
    assert_parses(
      s('dstr',
        s('ivar', '@a'),
        s('str', ' '),
        s('cvar', '@@a'),
        s('str', ' '),
        s('gvar', '$a')),
      '"#@a #@@a #$a"')
  });

  it("test_string_concat", function() {
    assert_parses(
      s('dstr',
        s('dstr',
          s('str', 'foo'),
          s('ivar', '@a')),
        s('str', 'bar')),
      '"foo#@a" "bar"')
  });

  it("test_string___FILE__", function() {
    assert_parses(
      s('__FILE__', '(assert_parses)'),
      '__FILE__')
  });


  // Symbols

  it("test_symbol_plain", function() {
    assert_parses(
      s('sym', 'foo'),
      ':foo')

    assert_parses(
      s('sym', 'foo'),
      ":'foo'")
  });
  
  it("test_symbol_interp", function() {
    assert_parses(
      s('dsym',
        s('str', 'foo'),
        s('begin', s('lvar', 'bar')),
        s('str', 'baz')),
      ':"foo#{bar}baz"')
  });
  
  it("test_symbol_empty", function() {
    // assert_diagnoses
  });

  // Execute-strings

  it("test_xstring_plain", function() {
    assert_parses(
      s('xstr', s('str', 'foobar')),
      '`foobar`')
  });
  
  it("test_xstring_interp", function() {
    assert_parses(
      s('xstr',
        s('str', 'foo'),
        s('begin', s('lvar', 'bar')),
        s('str', 'baz')),
      '`foo#{bar}baz`')
  });

  // Regexp

  it("test_regex_plain", function() {
    assert_parses(
      s('regexp', s('str', 'source'), s('regopt', 'i', 'm')),
      '/source/im')
  });

  it("test_regex_interp", function() {
    assert_parses(
      s('regexp',
        s('str', 'foo'),
        s('begin', s('lvar', 'bar')),
        s('str', 'baz'),
        s('regopt')),
      '/foo#{bar}baz/')
  });

  // Arrays

  it("test_array_plain", function() {
    assert_parses(
      s('array', s('int', 1), s('int', 2)),
      '[1, 2]')
  });

  it("test_array_splat", function() {
    assert_parses(
      s('array',
        s('int', 1),
        s('splat', s('lvar', 'foo')),
        s('int', 2)),
      '[1, *foo, 2]')

    assert_parses(
      s('array',
        s('int', 1),
        s('splat', s('lvar', 'foo'))),
      '[1, *foo]')

    assert_parses(
      s('array',
        s('splat', s('lvar', 'foo'))),
      '[*foo]')
  });

  it("test_array_assocs", function() {
    assert_parses(
      s('array',
        s('hash', s('pair', s('int', 1), s('int', 2)))),
      '[ 1 => 2 ]')

    assert_parses(
      s('array',
        s('int', 1),
        s('hash', s('pair', s('int', 2), s('int', 3)))),
      '[ 1, 2 => 3 ]')
  });

  it("test_array_words", function() {
    assert_parses(
      s('array', s('str', 'foo'), s('str', 'bar')),
      '%w[foo bar]')
  });

  it("test_array_words_interp", function() {
    assert_parses(
      s('array',
        s('str', 'foo'),
        s('dstr', s('begin', s('lvar', 'bar')))),
      '%W[foo #{bar}]')

    assert_parses(
      s('array',
        s('str', 'foo'),
        s('dstr',
          s('begin', s('lvar', 'bar')),
          s('str', 'foo'),
          s('ivar', '@baz'))),
      '%W[foo #{bar}foo#@baz]')
  });

  it("test_array_words_empty", function() {
    assert_parses(
      s('array'),
      '%w[]')

    assert_parses(
      s('array'),
      '%W()')
  });

  it("test_array_symbols", function() {
    assert_parses(
      s('array', s('sym', 'foo'), s('sym', 'bar')),
      '%i[foo bar]')
  });

  it("test_array_symbols_interp", function() {
    assert_parses(
      s('array',
        s('sym', 'foo'),
        s('dsym', s('begin', s('lvar', 'bar')))),
      '%I[foo #{bar}]')

    assert_parses(
      s('array',
        s('dsym',
          s('str', 'foo'),
          s('begin', s('lvar', 'bar')))),
      '%I[foo#{bar}]')
  });

  it("test_array_symbols_empty", function() {
    assert_parses(
      s('array'),
      '%i[]')

    assert_parses(
      s('array'),
      '%I()')
  });

  // Hashes

  it("test_hash_empty", function() {
    assert_parses(
      s('hash'),
      '{ }')
  });

  it("test_hash_hashrocket", function() {
    assert_parses(
      s('hash', s('pair', s('int', 1), s('int', 2))),
      '{ 1 => 2 }')

    assert_parses(
      s('hash',
        s('pair', s('int', 1), s('int', 2)),
        s('pair', s('sym', 'foo'), s('str', 'bar'))),
      '{ 1 => 2, :foo => "bar" }')
  });

  it("test_hash_label", function() {
    assert_parses(
      s('hash', s('pair', s('sym', 'foo'), s('int', 2))),
      '{ foo: 2 }')
  });

  it("test_hash_kwsplat", function() {
    assert_parses(
      s('hash',
        s('pair', s('sym', 'foo'), s('int', 2)),
        s('kwsplat', s('lvar', 'bar'))),
      '{ foo: 2, **bar }')
  });
  
  it("test_hash_no_hashrocket", function() {
    // 1.8 only
  });
  
  it("test_hash_no_hashrocket_odd", function() {
    // assert_diagnoses
  });

  // Range

  it("test_range_inclusive", function() {
    assert_parses(
      s('irange', s('int', 1), s('int', 2)),
      '1..2')
  });

  it("test_range_exclusive", function() {
    assert_parses(
      s('erange', s('int', 1), s('int', 2)),
      '1...2')
  });


  //
  // Access
  //

  // Variables and pseudovariables

  it("test_self", function() {
    assert_parses(
      s('self'),
      'self')
  });

  it("test_lvar", function() {
    assert_parses(
      s('lvar', 'foo'),
      'foo')
  });

  it("test_ivar", function() {
    assert_parses(
      s('ivar', '@foo'),
      '@foo')
  });

  it("test_cvar", function() {
    assert_parses(
      s('cvar', '@@foo'),
      '@@foo')
  });

  it("test_gvar", function() {
    assert_parses(
      s('gvar', '$foo'),
      '$foo')
  });
    
  it("test_gvar_dash_empty", function() {
    // assert_diagnoses
  });

  it("test_back_ref", function() {
    assert_parses(
      s('back_ref', '$+'),
      '$+')
  });

  it("test_nth_ref", function() {
    assert_parses(
      s('nth_ref', 10),
      '$10')
  });

  // Constants

  it("test_const_toplevel", function() {
    assert_parses(
      s('const', s('cbase'), 'Foo'),
      '::Foo')
  });

  it("test_const_scoped", function() {
    assert_parses(
      s('const', s('const', null, 'Bar'), 'Foo'),
      'Bar::Foo')
  });

  it("test_const_unscoped", function() {
    assert_parses(
      s('const', null, 'Foo'),
      'Foo')
  });

  it("test___ENCODING__", function() {
    assert_parses(
      s('__ENCODING__'),
      '__ENCODING__')
  });

  // defined?

  it("test_defined", function() {
    assert_parses(
      s('defined?', s('lvar', 'foo')),
      'defined? foo')

    assert_parses(
      s('defined?', s('lvar', 'foo')),
      'defined?(foo)')

    assert_parses(
      s('defined?', s('ivar', '@foo')),
      'defined? @foo')
  });


  //
  // Assignment
  //

  // Variables

  it("test_lvasgn", function() {
    assert_parses(
      s('begin',
        s('lvasgn', 'var', s('int', 10)),
        s('lvar', 'var')),
      'var = 10; var')
  });

  it("test_ivasgn", function() {
    assert_parses(
      s('ivasgn', '@var', s('int', 10)),
      '@var = 10')
  });

  it("test_cvasgn", function() {
    assert_parses(
      s('cvasgn', '@@var', s('int', 10)),
      '@@var = 10')
  });

  it("test_gvasgn", function() {
    assert_parses(
      s('gvasgn', '$var', s('int', 10)),
      '$var = 10')
  });

  it("test_asgn_cmd", function() {
    assert_parses(
      s('lvasgn', 'foo', s('send', null, 'm', s('lvar', 'foo'))),
      'foo = m foo')

    assert_parses(
      s('lvasgn', 'foo',
        s('lvasgn', 'bar',
          s('send', null, 'm', s('lvar', 'foo')))),
      'foo = bar = m foo')
  });

  it("test_asgn_keyword_invalid", function() {
    // assert_diagnoses
  });

  it("test_asgn_backref_invalid", function() {
    // assert_diagnoses
  });

  // Constants

  it("test_casgn_toplevel", function() {
    assert_parses(
      s('casgn', s('cbase'), 'Foo', s('int', 10)),
      '::Foo = 10')
  });

  it("test_casgn_scoped", function() {
    assert_parses(
      s('casgn', s('const', null, 'Bar'), 'Foo', s('int', 10)),
      'Bar::Foo = 10')
  });

  it("test_casgn_unscoped", function() {
    assert_parses(
      s('casgn', null, 'Foo', s('int', 10)),
      'Foo = 10')
  });

  it("test_casgn_invalid", function() {
    // assert_diagnoses
  });

  // Multiple assignment

  it("test_masgn", function() {
    assert_parses(
      s('masgn',
        s('mlhs', s('lvasgn', 'foo'), s('lvasgn', 'bar')),
        s('array', s('int', 1), s('int', 2))),
      'foo, bar = 1, 2')

    assert_parses(
      s('masgn',
        s('mlhs', s('lvasgn', 'foo'), s('lvasgn', 'bar')),
        s('array', s('int', 1), s('int', 2))),
      '(foo, bar) = 1, 2')

    assert_parses(
      s('masgn',
        s('mlhs',
          s('lvasgn', 'foo'),
          s('lvasgn', 'bar'),
          s('lvasgn', 'baz')),
        s('array', s('int', 1), s('int', 2))),
      'foo, bar, baz = 1, 2')
  });

  it("test_masgn_splat", function() {
    assert_parses(
      s('masgn',
        s('mlhs', s('ivasgn', '@foo'), s('cvasgn', '@@bar')),
        s('array', s('splat', s('lvar', 'foo')))),
      '@foo, @@bar = *foo')

    assert_parses(
      s('masgn',
        s('mlhs', s('lvasgn', 'a'), s('lvasgn', 'b')),
        s('array', s('splat', s('lvar', 'foo')), s('lvar', 'bar'))),
      'a, b = *foo, bar')

    assert_parses(
      s('masgn',
        s('mlhs', s('lvasgn', 'a'), s('splat', s('lvasgn', 'b'))),
        s('lvar', 'bar')),
      'a, *b = bar')

    assert_parses(
      s('masgn',
        s('mlhs',
          s('lvasgn', 'a'),
          s('splat', s('lvasgn', 'b')),
          s('lvasgn', 'c')),
        s('lvar', 'bar')),
      'a, *b, c = bar')

    assert_parses(
      s('masgn',
        s('mlhs', s('lvasgn', 'a'), s('splat')),
        s('lvar', 'bar')),
      'a, * = bar')

    assert_parses(
      s('masgn',
        s('mlhs',
          s('lvasgn', 'a'),
          s('splat'),
          s('lvasgn', 'c')),
        s('lvar', 'bar')),
      'a, *, c = bar')

    assert_parses(
      s('masgn',
        s('mlhs', s('splat', s('lvasgn', 'b'))),
        s('lvar', 'bar')),
      '*b = bar')

    assert_parses(
      s('masgn',
        s('mlhs',
          s('splat', s('lvasgn', 'b')),
          s('lvasgn', 'c')),
        s('lvar', 'bar')),
      '*b, c = bar')

    assert_parses(
      s('masgn',
        s('mlhs', s('splat')),
        s('lvar', 'bar')),
      '* = bar')

    assert_parses(
      s('masgn',
        s('mlhs',
          s('splat'),
          s('lvasgn', 'c'),
          s('lvasgn', 'd')),
        s('lvar', 'bar')),
      '*, c, d = bar')
  });

  it("test_masgn_nested", function() {
    assert_parses(
      s('masgn',
        s('mlhs',
          s('lvasgn', 'a'),
          s('mlhs',
            s('lvasgn', 'b'),
            s('lvasgn', 'c'))),
        s('lvar', 'foo')),
      'a, (b, c) = foo')

    assert_parses(
      s('masgn',
        s('mlhs',
          s('lvasgn', 'b')),
        s('lvar', 'foo')),
      '((b, )) = foo')
  });

  it("test_masgn_attr", function() {
    assert_parses(
      s('masgn',
        s('mlhs',
          s('send', s('self'), 'a='),
          s('send', s('self'), '[]=', s('int', 1), s('int', 2))),
        s('lvar', 'foo')),
      'self.a, self[1, 2] = foo')

    assert_parses(
      s('masgn',
        s('mlhs',
          s('send', s('self'), 'a='),
          s('lvasgn', 'foo')),
        s('lvar', 'foo')),
      'self::a, foo = foo')

    assert_parses(
      s('masgn',
        s('mlhs',
          s('send', s('self'), 'A='),
          s('lvasgn', 'foo')),
        s('lvar', 'foo')),
      'self.A, foo = foo')
  });

  it("test_masgn_const", function() {
    assert_parses(
      s('masgn',
        s('mlhs',
          s('casgn', s('self'), 'A'),
          s('lvasgn', 'foo')),
        s('lvar', 'foo')),
      'self::A, foo = foo')

    assert_parses(
      s('masgn',
        s('mlhs',
          s('casgn', s('cbase'), 'A'),
          s('lvasgn', 'foo')),
        s('lvar', 'foo')),
      '::A, foo = foo')
  });

  it("test_masgn_cmd", function() {
    assert_parses(
      s('masgn',
        s('mlhs',
          s('lvasgn', 'foo'),
          s('lvasgn', 'bar')),
        s('send', null, 'm', s('lvar', 'foo'))),
      'foo, bar = m foo')
  });

  it("test_asgn_mrhs", function() {
    assert_parses(
      s('lvasgn', 'foo',
        s('array', s('lvar', 'bar'), s('int', 1))),
      'foo = bar, 1')

    assert_parses(
      s('lvasgn', 'foo',
        s('array', s('splat', s('lvar', 'bar')))),
      'foo = *bar')

    assert_parses(
      s('lvasgn', 'foo',
        s('array',
          s('lvar', 'baz'),
          s('splat', s('lvar', 'bar')))),
      'foo = baz, *bar')
  });

  it("test_masgn_keyword_invalid", function() {
    // assert_diagnoses
  });

  it("test_masgn_backref_invalid", function() {
    // assert_diagnoses
  });

  it("test_masgn_const_invalid", function() {
    // assert_diagnoses
  });

  // Variable binary operator-assignment

  it("test_var_op_asgn", function() {
    assert_parses(
      s('op_asgn', s('lvasgn', 'a'), '+', s('int', 1)),
      'a += 1')

    assert_parses(
      s('op_asgn', s('ivasgn', '@a'), '|', s('int', 1)),
      '@a |= 1')

    assert_parses(
      s('op_asgn', s('cvasgn', '@@var'), '|', s('int', 10)),
      '@@var |= 10')

    assert_parses(
      s('def', 'a', s('args'),
        s('op_asgn', s('cvasgn', '@@var'), '|', s('int', 10))),
      'def a; @@var |= 10; end')
  });

  it("test_var_op_asgn_cmd", function() {
    assert_parses(
      s('op_asgn',
        s('lvasgn', 'foo'), '+',
        s('send', null, 'm', s('lvar', 'foo'))),
      'foo += m foo')
  });
  
  it("test_var_op_asgn_keyword_invalid", function() {
    // assert_diagnoses
  });
  
  it("test_const_op_asgn", function() {
    assert_parses(
      s('op_asgn',
        s('casgn', null, 'A'), '+',
        s('int', 1)),
      'A += 1')

    assert_parses(
      s('op_asgn',
        s('casgn', s('cbase'), 'A'), '+',
        s('int', 1)),
      '::A += 1')

    assert_parses(
      s('op_asgn',
        s('casgn', s('const', null, 'B'), 'A'), '+',
        s('int', 1)),
      'B::A += 1')
  });

  it("test_const_op_asgn_invalid", function() {
    // assert_diagnoses
  });

  // Method binary operator-assignment

  it("test_op_asgn", function() {
    assert_parses(
      s('op_asgn',
        s('send', s('lvar', 'foo'), 'a'), '+',
        s('int', 1)),
      'foo.a += 1')

    assert_parses(
      s('op_asgn',
        s('send', s('lvar', 'foo'), 'a'), '+',
        s('int', 1)),
      'foo::a += 1')

    assert_parses(
      s('op_asgn',
        s('send', s('lvar', 'foo'), 'A'), '+',
        s('int', 1)),
      'foo.A += 1')
  });

  it("test_op_asgn_cmd", function() {
    assert_parses(
      s('op_asgn',
        s('send', s('lvar', 'foo'), 'a'), '+',
        s('send', null, 'm', s('lvar', 'foo'))),
      'foo.a += m foo')

    assert_parses(
      s('op_asgn',
        s('send', s('lvar', 'foo'), 'a'), '+',
        s('send', null, 'm', s('lvar', 'foo'))),
      'foo::a += m foo')

    assert_parses(
      s('op_asgn',
        s('send', s('lvar', 'foo'), 'A'), '+',
        s('send', null, 'm', s('lvar', 'foo'))),
      'foo.A += m foo')

    assert_parses(
      s('op_asgn',
        s('send', s('lvar', 'foo'), 'A'), '+',
        s('send', null, 'm', s('lvar', 'foo'))),
      'foo::A += m foo')
  });

  it("test_op_asgn_index", function() {
    assert_parses(
      s('op_asgn',
        s('send', s('lvar', 'foo'), '[]',
          s('int', 0), s('int', 1)), '+',
        s('int', 2)),
      'foo[0, 1] += 2')
  });

  it("test_op_asgn_index_cmd", function() {
    assert_parses(
      s('op_asgn',
        s('send', s('lvar', 'foo'), '[]',
          s('int', 0), s('int', 1)), '+',
        s('send', null, 'm', s('lvar', 'foo'))),
      'foo[0, 1] += m foo')
  });
  
  it("test_op_asgn_invalid", function() {
    // assert_diagnoses
  });

  // Variable logical operator-assignment

  it("test_var_or_asgn", function() {
    assert_parses(
      s('or_asgn', s('lvasgn', 'a'), s('int', 1)),
      'a ||= 1')
  });

  it("test_var_and_asgn", function() {
    assert_parses(
      s('and_asgn', s('lvasgn', 'a'), s('int', 1)),
      'a &&= 1')
  });

  // Method logical operator-assignment

  it("test_or_asgn", function() {
    assert_parses(
      s('or_asgn',
        s('send', s('lvar', 'foo'), 'a'),
        s('int', 1)),
      'foo.a ||= 1')

    assert_parses(
      s('or_asgn',
        s('send', s('lvar', 'foo'), '[]',
          s('int', 0), s('int', 1)),
        s('int', 2)),
      'foo[0, 1] ||= 2')
  });

  it("test_and_asgn", function() {
    assert_parses(
      s('and_asgn',
        s('send', s('lvar', 'foo'), 'a'),
        s('int', 1)),
      'foo.a &&= 1')

    assert_parses(
      s('and_asgn',
        s('send', s('lvar', 'foo'), '[]',
          s('int', 0), s('int', 1)),
        s('int', 2)),
      'foo[0, 1] &&= 2')
  });

  it("test_log_asgn_invalid", function() {
    // assert_diagnoses
  });

  //
  // Class and module definitions
  //

  it("test_module", function() {
    assert_parses(
      s('module',
        s('const', null, 'Foo'),
        null),
      'module Foo; end')
  });
  
  it("test_module_invalid", function() {
    // assert_diagnoses
  });
  
  it("test_cpath", function() {
    assert_parses(
      s('module',
        s('const', s('cbase'), 'Foo'),
        null),
      'module ::Foo; end')

    assert_parses(
      s('module',
        s('const', s('const', null, 'Bar'), 'Foo'),
        null),
      'module Bar::Foo; end')
  });
  
  it("test_cpath_invalid", function() {
    // assert_diagnoses
  });
  
  it("test_class", function() {
    assert_parses(
      s('class',
        s('const', null, 'Foo'),
        null,
        null),
      'class Foo; end')
  });

  it("test_class_super", function() {
    assert_parses(
      s('class',
        s('const', null, 'Foo'),
        s('const', null, 'Bar'),
        null),
      'class Foo < Bar; end')
  });

  it("test_class_super_label", function() {
    assert_parses(
      s('class',
        s('const', null, 'Foo'),
        s('send', null, 'a',
          s('sym', 'b')),
        null),
      'class Foo < a:b; end')
  });
  
  it("test_class_invalid", function() {
    // assert_diagnoses
  });
  
  
  it("test_sclass", function() {
    assert_parses(
      s('sclass',
        s('lvar', 'foo'),
        s('nil')),
      'class << foo; nil; end')
  });

  //
  // Method (un)definition
  //

  it("test_def", function() {
    assert_parses(
      s('def', 'foo', s('args'), null),
      'def foo; end')

    assert_parses(
      s('def', 'String', s('args'), null),
      'def String; end')

    assert_parses(
      s('def', 'String=', s('args'), null),
      'def String=; end')

    assert_parses(
      s('def', 'until', s('args'), null),
      'def until; end')
  });

  it("test_defs", function() {
    assert_parses(
      s('defs', s('self'), 'foo', s('args'), null),
      'def self.foo; end')

    assert_parses(
      s('defs', s('self'), 'foo', s('args'), null),
      'def self::foo; end')

    assert_parses(
      s('defs', s('lvar', 'foo'), 'foo', s('args'), null),
      'def (foo).foo; end')

    assert_parses(
      s('defs', s('const', null, 'String'), 'foo',
        s('args'), null),
      'def String.foo; end')

    assert_parses(
      s('defs', s('const', null, 'String'), 'foo',
        s('args'), null),
      'def String::foo; end')
  });

  it("test_defs_invalid", function() {
    // assert_diagnoses
  });


  it("test_undef", function() {
    assert_parses(
      s('undef',
        s('sym', 'foo'),
        s('sym', 'bar'),
        s('dsym', s('str', 'foo'), s('begin', s('int', 1)))),
      'undef foo, :bar, :"foo#{1}"')
  });
  
  //
  // Aliasing
  //

  it("test_alias", function() {
    assert_parses(
      s('alias', s('sym', 'foo'), s('sym', 'bar')),
      'alias :foo bar')
  });

  it("test_alias_gvar", function() {
    assert_parses(
      s('alias', s('gvar', '$a'), s('gvar', '$b')),
      'alias $a $b')

    assert_parses(
      s('alias', s('gvar', '$a'), s('back_ref', '$+')),
      'alias $a $+')
  });
  
  it("test_alias_nth_ref", function() {
    // assert_diagnoses
  });
  
  //
  // Formal arguments
  //

  it("test_arg", function() {
    assert_parses(
      s('def', 'f',
        s('args', s('arg', 'foo')),
        null),
      'def f(foo); end')

    assert_parses(
      s('def', 'f',
        s('args', s('arg', 'foo'), s('arg', 'bar')),
        null),
      'def f(foo, bar); end')
  });

  it("test_optarg", function() {
    assert_parses(
      s('def', 'f',
        s('args', s('optarg', 'foo', s('int', 1))),
        null),
      'def f foo = 1; end')

    assert_parses(
      s('def', 'f',
        s('args',
          s('optarg', 'foo', s('int', 1)),
          s('optarg', 'bar', s('int', 2))),
        null),
      'def f(foo=1, bar=2); end')
  });

  it("test_restarg_named", function() {
    assert_parses(
      s('def', 'f',
        s('args', s('restarg', 'foo')),
        null),
      'def f(*foo); end')
  });

  it("test_restarg_unnamed", function() {
    assert_parses(
      s('def', 'f',
        s('args', s('restarg')),
        null),
      'def f(*); end')
  });

  it("test_kwoptarg", function() {
    assert_parses(
      s('def', 'f',
        s('args', s('kwoptarg', 'foo', s('int', 1))),
        null),
      'def f(foo: 1); end')
  });

  it("test_kwrestarg_named", function() {
    assert_parses(
      s('def', 'f',
        s('args', s('kwrestarg', 'foo')),
        null),
      'def f(**foo); end')
  });

  it("test_kwrestarg_unnamed", function() {
    assert_parses(
      s('def', 'f',
        s('args', s('kwrestarg')),
        null),
      'def f(**); end')
  });

  it("test_blockarg", function() {
    assert_parses(
      s('def', 'f',
        s('args', s('blockarg', 'block')),
        null),
      'def f(&block); end')
  });

  function assert_parses_args (ast, code)
  {
    assert_parses(
      s('def', 'f', ast, null),
      'def f '+code+'; end')
  }
  

  it("test_arg_combinations", function() {
    // f_arg tCOMMA f_optarg tCOMMA f_rest_arg              opt_f_block_arg
    assert_parses_args(
      s('args',
        s('arg', 'a'),
        s('optarg', 'o', s('int', 1)),
        s('restarg', 'r'),
        s('blockarg', 'b')),
      'a, o=1, *r, &b')

    // f_arg tCOMMA f_optarg tCOMMA f_rest_arg tCOMMA f_arg opt_f_block_arg
    assert_parses_args(
      s('args',
        s('arg', 'a'),
        s('optarg', 'o', s('int', 1)),
        s('restarg', 'r'),
        s('arg', 'p'),
        s('blockarg', 'b')),
      'a, o=1, *r, p, &b')

    // f_arg tCOMMA f_optarg                                opt_f_block_arg
    assert_parses_args(
      s('args',
        s('arg', 'a'),
        s('optarg', 'o', s('int', 1)),
        s('blockarg', 'b')),
      'a, o=1, &b')

    // f_arg tCOMMA f_optarg tCOMMA                   f_arg opt_f_block_arg
    assert_parses_args(
      s('args',
        s('arg', 'a'),
        s('optarg', 'o', s('int', 1)),
        s('arg', 'p'),
        s('blockarg', 'b')),
      'a, o=1, p, &b')

    // f_arg tCOMMA                 f_rest_arg              opt_f_block_arg
    assert_parses_args(
      s('args',
        s('arg', 'a'),
        s('restarg', 'r'),
        s('blockarg', 'b')),
      'a, *r, &b')

    // f_arg tCOMMA                 f_rest_arg tCOMMA f_arg opt_f_block_arg
    assert_parses_args(
      s('args',
        s('arg', 'a'),
        s('restarg', 'r'),
        s('arg', 'p'),
        s('blockarg', 'b')),
      'a, *r, p, &b')

    // f_arg                                                opt_f_block_arg
    assert_parses_args(
      s('args',
        s('arg', 'a'),
        s('blockarg', 'b')),
      'a, &b')

    //              f_optarg tCOMMA f_rest_arg              opt_f_block_arg
    assert_parses_args(
      s('args',
        s('optarg', 'o', s('int', 1)),
        s('restarg', 'r'),
        s('blockarg', 'b')),
      'o=1, *r, &b')

    //              f_optarg tCOMMA f_rest_arg tCOMMA f_arg opt_f_block_arg
    assert_parses_args(
      s('args',
        s('optarg', 'o', s('int', 1)),
        s('restarg', 'r'),
        s('arg', 'p'),
        s('blockarg', 'b')),
      'o=1, *r, p, &b')

    //              f_optarg                                opt_f_block_arg
    assert_parses_args(
      s('args',
        s('optarg', 'o', s('int', 1)),
        s('blockarg', 'b')),
      'o=1, &b')

    //              f_optarg tCOMMA                   f_arg opt_f_block_arg
    assert_parses_args(
      s('args',
        s('optarg', 'o', s('int', 1)),
        s('arg', 'p'),
        s('blockarg', 'b')),
      'o=1, p, &b')

    //                              f_rest_arg              opt_f_block_arg
    assert_parses_args(
      s('args',
        s('restarg', 'r'),
        s('blockarg', 'b')),
      '*r, &b')

    //                              f_rest_arg tCOMMA f_arg opt_f_block_arg
    assert_parses_args(
      s('args',
        s('restarg', 'r'),
        s('arg', 'p'),
        s('blockarg', 'b')),
      '*r, p, &b')

    //                                                          f_block_arg
    assert_parses_args(
      s('args',
        s('blockarg', 'b')),
      '&b')

    // (nothing)
    assert_parses_args(
      s('args'),
      '')
  });

  it("test_kwarg_combinations", function() {
    // f_kwarg tCOMMA f_kwrest opt_f_block_arg
    assert_parses_args(
      s('args',
        s('kwoptarg', 'foo', s('int', 1)),
        s('kwoptarg', 'bar', s('int', 2)),
        s('kwrestarg', 'baz'),
        s('blockarg', 'b')),
      '(foo: 1, bar: 2, **baz, &b)')

    // f_kwarg opt_f_block_arg
    assert_parses_args(
      s('args',
        s('kwoptarg', 'foo', s('int', 1)),
        s('blockarg', 'b')),
      '(foo: 1, &b)')

    // f_kwrest opt_f_block_arg
    assert_parses_args(
      s('args',
        s('kwrestarg', 'baz'),
        s('blockarg', 'b')),
      '**baz, &b')
  });

  // ruby 2.1 syntax
  xit("test_kwarg_no_paren", function() {
    assert_parses_args(
      s('args',
        s('kwarg', 'foo')),
      'foo:\n')

    assert_parses_args(
      s('args',
        s('kwoptarg', 'foo', s('int', -1))),
      'foo: -1\n')
  });

  function assert_parses_margs (ast, code)
  {
    assert_parses_args(
      s('args', ast),
      '('+code+')')
  }

  it("test_marg_combinations", function() {
    // tLPAREN f_margs rparen
    assert_parses_margs(
      s('mlhs',
        s('mlhs', s('arg', 'a'))),
      '((a))')

    // f_marg_list
    assert_parses_margs(
      s('mlhs', s('arg', 'a'), s('arg', 'a1')),
      '(a, a1)')

    // f_marg_list tCOMMA tSTAR f_norm_arg
    assert_parses_margs(
      s('mlhs', s('arg', 'a'), s('restarg', 'r')),
      '(a, *r)')

    // f_marg_list tCOMMA tSTAR f_norm_arg tCOMMA f_marg_list
    assert_parses_margs(
      s('mlhs', s('arg', 'a'), s('restarg', 'r'), s('arg', 'p')),
      '(a, *r, p)')

    // f_marg_list tCOMMA tSTAR
    assert_parses_margs(
      s('mlhs', s('arg', 'a'), s('restarg')),
      '(a, *)')

    // f_marg_list tCOMMA tSTAR            tCOMMA f_marg_list
    assert_parses_margs(
      s('mlhs', s('arg', 'a'), s('restarg'), s('arg', 'p')),
      '(a, *, p)')

    // tSTAR f_norm_arg
    assert_parses_margs(
      s('mlhs', s('restarg', 'r')),
      '(*r)')

    // tSTAR f_norm_arg tCOMMA f_marg_list
    assert_parses_margs(
      s('mlhs', s('restarg', 'r'), s('arg', 'p')),
      '(*r, p)')

    // tSTAR
    assert_parses_margs(
      s('mlhs', s('restarg')),
      '(*)')

    // tSTAR tCOMMA f_marg_list
    assert_parses_margs(
      s('mlhs', s('restarg'), s('arg', 'p')),
      '(*, p)')
  });

  function assert_parses_blockargs (ast, code)
  {
    assert_parses(
      s('block',
        s('send', null, 'f'),
        ast, null),
      'f{ '+code+' }')
  }
  
  it("test_block_arg_combinations", function() {
    // none
    assert_parses_blockargs(
      s('args'),
      '')

    // tPIPE tPIPE
    // tPIPE opt_bv_decl tPIPE
    assert_parses_blockargs(
      s('args'),
      '| |')

    assert_parses_blockargs(
      s('args', s('shadowarg', 'a')),
      '|;a|')

    assert_parses_blockargs(
      s('args', s('shadowarg', 'a')),
      '|;\na\n|')

    // tOROP
    assert_parses_blockargs(
      s('args'),
      '||')

    // block_par
    // block_par tCOMMA
    // block_par tCOMMA tAMPER lhs
    // f_arg                                                      opt_f_block_arg
    // f_arg tCOMMA
    assert_parses_blockargs(
      s('args', s('arg', 'a')),
      '|a|')

    assert_parses_blockargs(
      s('args', s('arg', 'a'), s('arg', 'c')),
      '|a, c|')

    assert_parses_blockargs(
      s('args', s('arg', 'a')),
      '|a,|')

    assert_parses_blockargs(
      s('args', s('arg', 'a'), s('blockarg', 'b')),
      '|a, &b|')

    // block_par tCOMMA tSTAR lhs tCOMMA tAMPER lhs
    // block_par tCOMMA tSTAR tCOMMA tAMPER lhs
    // block_par tCOMMA tSTAR lhs
    // block_par tCOMMA tSTAR
    // f_arg tCOMMA                       f_rest_arg              opt_f_block_arg
    assert_parses_blockargs(
      s('args', s('arg', 'a'), s('restarg', 's'), s('blockarg', 'b')),
      '|a, *s, &b|')

    assert_parses_blockargs(
      s('args', s('arg', 'a'), s('restarg'), s('blockarg', 'b')),
      '|a, *, &b|')

    assert_parses_blockargs(
      s('args', s('arg', 'a'), s('restarg', 's')),
      '|a, *s|')

    assert_parses_blockargs(
      s('args', s('arg', 'a'), s('restarg')),
      '|a, *|')

    // tSTAR lhs tCOMMA tAMPER lhs
    // tSTAR lhs
    // tSTAR
    // tSTAR tCOMMA tAMPER lhs
    //                                    f_rest_arg              opt_f_block_arg
    assert_parses_blockargs(
      s('args', s('restarg', 's'), s('blockarg', 'b')),
      '|*s, &b|')

    assert_parses_blockargs(
      s('args', s('restarg'), s('blockarg', 'b')),
      '|*, &b|')

    assert_parses_blockargs(
      s('args', s('restarg', 's')),
      '|*s|')

    assert_parses_blockargs(
      s('args', s('restarg')),
      '|*|')

    // tAMPER lhs
    //                                                                f_block_arg
    assert_parses_blockargs(
      s('args', s('blockarg', 'b')),
      '|&b|')

    // f_arg tCOMMA f_block_optarg tCOMMA f_rest_arg              opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('arg', 'a'),
        s('optarg', 'o', s('int', 1)),
        s('optarg', 'o1', s('int', 2)),
        s('restarg', 'r'),
        s('blockarg', 'b')),
      '|a, o=1, o1=2, *r, &b|')

    // f_arg tCOMMA f_block_optarg tCOMMA f_rest_arg tCOMMA f_arg opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('arg', 'a'),
        s('optarg', 'o', s('int', 1)),
        s('restarg', 'r'),
        s('arg', 'p'),
        s('blockarg', 'b')),
      '|a, o=1, *r, p, &b|')

    // f_arg tCOMMA f_block_optarg                                opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('arg', 'a'),
        s('optarg', 'o', s('int', 1)),
        s('blockarg', 'b')),
      '|a, o=1, &b|')

    // f_arg tCOMMA f_block_optarg tCOMMA                   f_arg opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('arg', 'a'),
        s('optarg', 'o', s('int', 1)),
        s('arg', 'p'),
        s('blockarg', 'b')),
      '|a, o=1, p, &b|')

    // f_arg tCOMMA                       f_rest_arg tCOMMA f_arg opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('arg', 'a'),
        s('restarg', 'r'),
        s('arg', 'p'),
        s('blockarg', 'b')),
      '|a, *r, p, &b|')

    //              f_block_optarg tCOMMA f_rest_arg              opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('optarg', 'o', s('int', 1)),
        s('restarg', 'r'),
        s('blockarg', 'b')),
      '|o=1, *r, &b|')

    //              f_block_optarg tCOMMA f_rest_arg tCOMMA f_arg opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('optarg', 'o', s('int', 1)),
        s('restarg', 'r'),
        s('arg', 'p'),
        s('blockarg', 'b')),
      '|o=1, *r, p, &b|')

    //              f_block_optarg                                opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('optarg', 'o', s('int', 1)),
        s('blockarg', 'b')),
      '|o=1, &b|')

    //              f_block_optarg tCOMMA                   f_arg opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('optarg', 'o', s('int', 1)),
        s('arg', 'p'),
        s('blockarg', 'b')),
      '|o=1, p, &b|')

    //                                    f_rest_arg tCOMMA f_arg opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('restarg', 'r'),
        s('arg', 'p'),
        s('blockarg', 'b')),
      '|*r, p, &b|')
  });
  
  it("test_block_kwarg_combinations", function() {
    // f_block_kwarg tCOMMA f_kwrest opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('kwoptarg', 'foo', s('int', 1)),
        s('kwoptarg', 'bar', s('int', 2)),
        s('kwrestarg', 'baz'),
        s('blockarg', 'b')),
      '|foo: 1, bar: 2, **baz, &b|')

    // f_block_kwarg opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('kwoptarg', 'foo', s('int', 1)),
        s('blockarg', 'b')),
      '|foo: 1, &b|')

    // f_kwrest opt_f_block_arg
    assert_parses_blockargs(
      s('args',
        s('kwrestarg', 'baz'),
        s('blockarg', 'b')),
      '|**baz, &b|')
  });
  
  it("test_arg_invalid", function() {
    // assert_diagnoses
  });
  
  it("test_arg_duplicate", function() {
    // assert_diagnoses
  });
  
  it("test_arg_duplicate_ignored", function() {
    assert_parses(
      s('def', 'foo',
        s('args', s('arg', '_'), s('arg', '_')),
        null),
      'def foo(_, _); end')

    assert_parses(
      s('def', 'foo',
        s('args', s('arg', '_a'), s('arg', '_a')),
        null),
      'def foo(_a, _a); end')
  });
  
  it("test_kwarg_invalid", function() {
    // assert_diagnoses
  });
  
  it("test_arg_label", function() {
    assert_parses(
      s('def', 'foo', s('args'),
        s('send', null, 'a', s('sym', 'b'))),
      'def foo() a:b end')

    assert_parses(
      s('def', 'foo', s('args'),
        s('send', null, 'a', s('sym', 'b'))),
      'def foo\n a:b end')

    assert_parses(
      s('block',
        s('send', null, 'f'),
        s('args'),
        s('send', null, 'a',
          s('sym', 'b'))),
      'f { || a:b }')
  });
  
  //
  // Sends
  //

  // To self

  it("test_send_self", function() {
    assert_parses(
      s('send', null, 'fun'),
      'fun')

    assert_parses(
      s('send', null, 'fun!'),
      'fun!')

    assert_parses(
      s('send', null, 'fun', s('int', 1)),
      'fun(1)')
  });
  
  it("test_send_self_block", function() {
    assert_parses(
      s('block', s('send', null, 'fun'), s('args'), null),
      'fun { }')

    assert_parses(
      s('block', s('send', null, 'fun'), s('args'), null),
      'fun() { }')

    assert_parses(
      s('block', s('send', null, 'fun', s('int', 1)), s('args'), null),
      'fun(1) { }')

    assert_parses(
      s('block', s('send', null, 'fun'), s('args'), null),
      'fun do end')
  });
  
  it("test_send_block_blockarg", function() {
    // assert_diagnoses
  });
  
  // To receiver

  it("test_send_plain", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), 'fun'),
      'foo.fun')

    assert_parses(
      s('send', s('lvar', 'foo'), 'fun'),
      'foo::fun')

    assert_parses(
      s('send', s('lvar', 'foo'), 'Fun'),
      'foo::Fun()')
  });

  it("test_send_plain_cmd", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), 'fun', s('lvar', 'bar')),
      'foo.fun bar')

    assert_parses(
      s('send', s('lvar', 'foo'), 'fun', s('lvar', 'bar')),
      'foo::fun bar')

    assert_parses(
      s('send', s('lvar', 'foo'), 'Fun', s('lvar', 'bar')),
      'foo::Fun bar')
  });
  
  it("test_send_plain_cmd_ambiguous_prefix", function() {
    // assert_diagnoses
  });
  
  it("test_send_block_chain_cmd", function() {
    assert_parses(
      s('send',
        s('block',
          s('send', null, 'meth', s('int', 1)),
          s('args'), null),
        'fun', s('lvar', 'bar')),
      'meth 1 do end.fun bar')

    assert_parses(
      s('send',
        s('block',
          s('send', null, 'meth', s('int', 1)),
          s('args'), null),
        'fun', s('lvar', 'bar')),
      'meth 1 do end.fun(bar)')

    assert_parses(
      s('send',
        s('block',
          s('send', null, 'meth', s('int', 1)),
          s('args'), null),
        'fun', s('lvar', 'bar')),
      'meth 1 do end::fun bar')

    assert_parses(
      s('send',
        s('block',
          s('send', null, 'meth', s('int', 1)),
          s('args'), null),
        'fun', s('lvar', 'bar')),
      'meth 1 do end::fun(bar)')

    assert_parses(
      s('block',
        s('send',
          s('block',
            s('send', null, 'meth', s('int', 1)),
            s('args'), null),
          'fun', s('lvar', 'bar')),
        s('args'), null),
      'meth 1 do end.fun bar do end')

    assert_parses(
      s('block',
        s('send',
          s('block',
            s('send', null, 'meth', s('int', 1)),
            s('args'), null),
          'fun', s('lvar', 'bar')),
        s('args'), null),
      'meth 1 do end.fun(bar) {}')

    assert_parses(
      s('block',
        s('send',
          s('block',
            s('send', null, 'meth', s('int', 1)),
            s('args'), null),
          'fun'),
        s('args'), null),
      'meth 1 do end.fun {}')
  });

  it("test_send_binary_op", function() {
    var operators = '+ - * / % ** | ^ & < <= <=> >= > == != === =~ !~ << >>'.split(' ')
    for (var i = 0; i < operators.length; i++)
    {
      var op = operators[i]

      assert_parses(
        s('send', s('lvar', 'foo'), op, s('int', 1)),
        'foo '+op+' 1')
      assert_parses(
        s('send', s('lvar', 'foo'), op),
        'foo::' + op)
      assert_parses(
        s('send', s('lvar', 'foo'), op),
        'foo.' + op)
    }
  });
  
  it("test_send_unary_op", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), '-@'),
      '-foo')

    assert_parses(
      s('send', s('lvar', 'foo'), '+@'),
      '+foo')

    assert_parses(
      s('send', s('lvar', 'foo'), '~'),
      '~foo')
  });

  it("test_bang", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), '!'),
      '!foo')
  });

  it("test_bang_cmd", function() {
    assert_parses(
      s('send', s('send', null, 'm', s('lvar', 'foo')), '!'),
      '!m foo')
  });

  it("test_not", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), '!'),
      'not foo')

    assert_parses(
      s('send', s('lvar', 'foo'), '!'),
      'not(foo)')

    assert_parses(
      s('send', s('begin'), '!'),
      'not()')
  });

  it("test_not_cmd", function() {
    assert_parses(
      s('send', s('send', null, 'm', s('lvar', 'foo')), '!'),
      'not m foo')
  });

  it("test_pow_precedence", function() {
    assert_parses(
      s('send', s('send', s('int', 2), '**', s('int', 10)), '-@'),
      '-2 ** 10')

    assert_parses(
      s('send', s('send', s('float', 2.0), '**', s('int', 10)), '-@'),
      '-2.0 ** 10')
  });

  it("test_send_attr_asgn", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), 'a=', s('int', 1)),
      'foo.a = 1')

    assert_parses(
      s('send', s('lvar', 'foo'), 'a=', s('int', 1)),
      'foo::a = 1')

    assert_parses(
      s('send', s('lvar', 'foo'), 'A=', s('int', 1)),
      'foo.A = 1')

    assert_parses(
      s('casgn', s('lvar', 'foo'), 'A', s('int', 1)),
      'foo::A = 1')
  });

  it("test_send_index", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), '[]',
        s('int', 1), s('int', 2)),
      'foo[1, 2]')
  });

  it("test_send_index_cmd", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), '[]',
        s('send', null, 'm', s('lvar', 'bar'))),
      'foo[m bar]')
  });

  it("test_send_index_asgn", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), '[]=',
        s('int', 1), s('int', 2), s('int', 3)),
      'foo[1, 2] = 3')
  });

  it("test_send_lambda", function() {
    assert_parses(
      s('block', s('send', null, 'lambda'),
        s('args'), null),
      '->{ }')

    assert_parses(
      s('block', s('send', null, 'lambda'),
        s('args'), null),
      '-> do end')
  });

  it("test_send_lambda_args", function() {
    assert_parses(
      s('block', s('send', null, 'lambda'),
        s('args',
          s('arg', 'a')),
        null),
      '->(a) { }')

    assert_parses(
      s('block', s('send', null, 'lambda'),
        s('args',
          s('arg', 'a')),
        null),
      '-> (a) { }')
  });

  it("test_send_lambda_args_shadow", function() {
    assert_parses(
      s('block', s('send', null, 'lambda'),
        s('args',
          s('arg', 'a'),
          s('shadowarg', 'foo'),
          s('shadowarg', 'bar')),
        null),
      '->(a; foo, bar) { }')
  });

  it("test_lambda_args_scope", function() {
    assert_parses(
      s('begin',
        s('block', s('send', null, 'lambda'),
          s('args',
            s('arg', 'a')),
        null),
        s('send', null, 'a')),
      '->(a) { }; a')
  });

  it("test_send_call", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), 'call',
        s('int', 1)),
      'foo.(1)')

    assert_parses(
      s('send', s('lvar', 'foo'), 'call',
        s('int', 1)),
      'foo::(1)')
  });

  it("test_lvar_injecting_match", function() {
    assert_parses(
      s('begin',
        s('match_with_lvasgn',
          s('regexp',
            s('str', '(?<match>bar)'),
            s('regopt')),
          s('str', 'bar')),
        s('lvar', 'match')),
      "/(?<match>bar)/ =~ 'bar'; match")
  });

  it("test_non_lvar_injecting_match", function() {
    assert_parses(
      s('send',
        s('regexp',
          s('begin', s('str', '(?<match>bar)')),
          s('regopt')),
        '=~',
        s('str', 'bar')),
      "/#{'(?<match>bar)'}/ =~ 'bar'")
  });
  
  // To superclass

  it("test_super", function() {
    assert_parses(
      s('super', s('lvar', 'foo')),
      'super(foo)')

    assert_parses(
      s('super', s('lvar', 'foo')),
      'super foo')

    assert_parses(
      s('super'),
      'super()')
  });

  it("test_zsuper", function() {
    assert_parses(
      s('zsuper'),
      'super')
  });

  // To block argument

  it("test_yield", function() {
    assert_parses(
      s('yield', s('lvar', 'foo')),
      'yield(foo)')

    assert_parses(
      s('yield', s('lvar', 'foo')),
      'yield foo')

    assert_parses(
      s('yield'),
      'yield()')

    assert_parses(
      s('yield'),
      'yield')
  });

  // Call arguments

  it("test_args_cmd", function() {
    assert_parses(
      s('send', null, 'fun',
        s('send', null, 'f', s('lvar', 'bar'))),
      'fun(f bar)')
  });

  it("test_args_args_star", function() {
    assert_parses(
      s('send', null, 'fun',
        s('lvar', 'foo'), s('splat', s('lvar', 'bar'))),
      'fun(foo, *bar)')

    assert_parses(
      s('send', null, 'fun',
        s('lvar', 'foo'), s('splat', s('lvar', 'bar')),
        s('block_pass', s('lvar', 'baz'))),
      'fun(foo, *bar, &baz)')
  });

  it("test_args_star", function() {
    assert_parses(
      s('send', null, 'fun',
        s('splat', s('lvar', 'bar'))),
      'fun(*bar)')

    assert_parses(
      s('send', null, 'fun',
        s('splat', s('lvar', 'bar')),
        s('block_pass', s('lvar', 'baz'))),
      'fun(*bar, &baz)')
  });

  it("test_args_block_pass", function() {
    assert_parses(
      s('send', null, 'fun',
        s('block_pass', s('lvar', 'bar'))),
      'fun(&bar)')
  });

  it("test_args_args_comma", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), '[]',
        s('lvar', 'bar')),
      'foo[bar,]')
  });

  it("test_args_assocs", function() {
    assert_parses(
      s('send', null, 'fun',
        s('hash', s('pair', s('sym', 'foo'), s('int', 1)))),
      'fun(:foo => 1)')

    assert_parses(
      s('send', null, 'fun',
        s('hash', s('pair', s('sym', 'foo'), s('int', 1))),
        s('block_pass', s('lvar', 'baz'))),
      'fun(:foo => 1, &baz)')
  });

  it("test_args_assocs_comma", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), '[]',
        s('hash', s('pair', s('sym', 'baz'), s('int', 1)))),
      'foo[:baz => 1,]')
  });

  it("test_args_args_assocs", function() {
    assert_parses(
      s('send', null, 'fun',
        s('lvar', 'foo'),
        s('hash', s('pair', s('sym', 'foo'), s('int', 1)))),
      'fun(foo, :foo => 1)')

    assert_parses(
      s('send', null, 'fun',
        s('lvar', 'foo'),
        s('hash', s('pair', s('sym', 'foo'), s('int', 1))),
        s('block_pass', s('lvar', 'baz'))),
      'fun(foo, :foo => 1, &baz)')
  });

  it("test_args_args_assocs_comma", function() {
    assert_parses(
      s('send', s('lvar', 'foo'), '[]',
        s('lvar', 'bar'),
        s('hash', s('pair', s('sym', 'baz'), s('int', 1)))),
      'foo[bar, :baz => 1,]')
  });

  // Call arguments with whitespace

  it("test_space_args_cmd", function() {
    assert_parses(
      s('send', null, 'fun',
        s('begin', s('send', null, 'f', s('lvar', 'bar')))),
      'fun (f bar)')
  });

  it("test_space_args_arg", function() {
    assert_parses(
      s('send', null, 'fun', s('begin', s('int', 1))),
      'fun (1)')
  });

  it("test_space_args_arg_block", function() {
    assert_parses(
      s('block',
        s('send', null, 'fun', s('begin', s('int', 1))),
        s('args'), null),
      'fun (1) {}')

    assert_parses(
      s('block',
        s('send', s('lvar', 'foo'), 'fun', s('begin', s('int', 1))),
        s('args'), null),
      'foo.fun (1) {}')

    assert_parses(
      s('block',
        s('send', s('lvar', 'foo'), 'fun', s('begin', s('int', 1))),
        s('args'), null),
      'foo::fun (1) {}')
  });

  it("test_space_args_arg_call", function() {
    assert_parses(
      s('send', null, 'fun',
        s('send', s('begin', s('int', 1)), 'to_i')),
      'fun (1).to_i')
  });

  it("test_space_args_block", function() {
    assert_parses(
      s('block',
        s('send', null, 'fun',
          s('begin')),
        s('args'), null),
      'fun () {}')
  });
  
  //
  // Control flow
  //

  // Operators

  it("test_and", function() {
    assert_parses(
      s('and', s('lvar', 'foo'), s('lvar', 'bar')),
      'foo and bar')

    assert_parses(
      s('and', s('lvar', 'foo'), s('lvar', 'bar')),
      'foo && bar')
  });

  it("test_or", function() {
    assert_parses(
      s('or', s('lvar', 'foo'), s('lvar', 'bar')),
      'foo or bar')

    assert_parses(
      s('or', s('lvar', 'foo'), s('lvar', 'bar')),
      'foo || bar')
  });

  it("test_and_or_masgn", function() {
    assert_parses(
      s('and',
        s('lvar', 'foo'),
        s('begin',
          s('masgn',
            s('mlhs', s('lvasgn', 'a'), s('lvasgn', 'b')),
            s('lvar', 'bar')))),
      'foo && (a, b = bar)')

    assert_parses(
      s('or',
        s('lvar', 'foo'),
        s('begin',
          s('masgn',
            s('mlhs', s('lvasgn', 'a'), s('lvasgn', 'b')),
            s('lvar', 'bar')))),
      'foo || (a, b = bar)')
  });

  // Branching

  it("test_if", function() {
    assert_parses(
      s('if', s('lvar', 'foo'), s('lvar', 'bar'), null),
      'if foo then bar; end')

    assert_parses(
      s('if', s('lvar', 'foo'), s('lvar', 'bar'), null),
      'if foo; bar; end')
  });

  it("test_if_nl_then", function() {
    assert_parses(
      s('if', s('lvar', 'foo'), s('lvar', 'bar'), null),
      'if foo\nthen bar end')
  });

  it("test_if_mod", function() {
    assert_parses(
      s('if', s('lvar', 'foo'), s('lvar', 'bar'), null),
      'bar if foo')
  });

  it("test_unless", function() {
    assert_parses(
      s('if', s('lvar', 'foo'), null, s('lvar', 'bar')),
      'unless foo then bar; end')

    assert_parses(
      s('if', s('lvar', 'foo'), null, s('lvar', 'bar')),
      'unless foo; bar; end')
  });

  it("test_unless_mod", function() {
    assert_parses(
      s('if', s('lvar', 'foo'), null, s('lvar', 'bar')),
      'bar unless foo')
  });

  it("test_if_else", function() {
    assert_parses(
      s('if', s('lvar', 'foo'), s('lvar', 'bar'), s('lvar', 'baz')),
      'if foo then bar; else baz; end')

    assert_parses(
      s('if', s('lvar', 'foo'), s('lvar', 'bar'), s('lvar', 'baz')),
      'if foo; bar; else baz; end')
  });

  it("test_unless_else", function() {
    assert_parses(
      s('if', s('lvar', 'foo'), s('lvar', 'baz'), s('lvar', 'bar')),
      'unless foo then bar; else baz; end')

    assert_parses(
      s('if', s('lvar', 'foo'), s('lvar', 'baz'), s('lvar', 'bar')),
      'unless foo; bar; else baz; end')
  });

  it("test_if_elsif", function() {
    assert_parses(
      s('if', s('lvar', 'foo'), s('lvar', 'bar'),
        s('if', s('lvar', 'baz'), s('int', 1), s('int', 2))),
      'if foo; bar; elsif baz; 1; else 2; end')
  });

  it("test_ternary_ambiguous_symbol", function() {
    assert_parses(
      s('begin',
        s('lvasgn', 't', s('int', 1)),
        s('if', s('begin', s('lvar', 'foo')),
          s('lvar', 't'),
          s('const', null, 'T'))),
      't=1;(foo)?t:T')
  });

  it("test_if_masgn", function() {
    // assert_diagnoses
  });

  it("test_if_mod_masgn", function() {
    // assert_diagnoses
  });

  it("test_tern_masgn", function() {
    // assert_diagnoses
  });

  it("test_ternary", function() {
    assert_parses(
      s('if', s('lvar', 'foo'), s('int', 1), s('int', 2)),
      'foo ? 1 : 2')
  });

  it("test_ternary_ambiguous_symbol", function() {
    assert_parses(
      s('begin',
        s('lvasgn', 't', s('int', 1)),
        s('if', s('begin', s('lvar', 'foo')),
          s('lvar', 't'),
          s('const', null, 'T'))),
      't=1;(foo)?t:T')
  });
  
  it("test_cond_begin", function() {
    assert_parses(
      s('if',
        s('begin', s('lvar', 'bar')),
        s('lvar', 'foo'),
        null),
      'if (bar); foo; end')
  });
  
  it("test_cond_begin_masgn", function() {
    assert_parses(
      s('if',
        s('begin',
          s('lvar', 'bar'),
          s('masgn',
            s('mlhs', s('lvasgn', 'a'), s('lvasgn', 'b')),
            s('lvar', 'foo'))),
        null, null),
      'if (bar; a, b = foo); end')
  });
  
  it("test_cond_begin_and_or_masgn", function() {
    // assert_diagnoses
  });
  
  it("test_cond_iflipflop", function() {
    assert_parses(
      s('if', s('iflipflop', s('lvar', 'foo'), s('lvar', 'bar')),
        null, null),
      'if foo..bar; end')
  });
  
  it("test_cond_eflipflop", function() {
    assert_parses(
      s('if', s('eflipflop', s('lvar', 'foo'), s('lvar', 'bar')),
        null, null),
      'if foo...bar; end')
  });

  it("test_cond_match_current_line", function() {
    assert_parses(
      s('if',
        s('match_current_line',
          s('regexp',
            s('str', 'wat'),
            s('regopt'))),
        null, null),
      'if /wat/; end')
  });

  // Case matching

  it("test_case_expr", function() {
    assert_parses(
      s('case', s('lvar', 'foo'),
        s('when', s('str', 'bar'),
          s('lvar', 'bar')),
        null),
      "case foo; when 'bar'; bar; end")
  });

  it("test_case_expr_else", function() {
    assert_parses(
      s('case', s('lvar', 'foo'),
        s('when', s('str', 'bar'),
          s('lvar', 'bar')),
        s('lvar', 'baz')),
      "case foo; when 'bar'; bar; else baz; end")
  });

  it("test_case_cond", function() {
    assert_parses(
      s('case', null,
        s('when', s('lvar', 'foo'),
          s('str', 'foo')),
        null),
      "case; when foo; 'foo'; end")
  });

  it("test_case_cond_else", function() {
    assert_parses(
      s('case', null,
        s('when', s('lvar', 'foo'),
          s('str', 'foo')),
        s('str', 'bar')),
      "case; when foo; 'foo'; else 'bar'; end")
  });

  it("test_when_then", function() {
    assert_parses(
      s('case', s('lvar', 'foo'),
        s('when', s('str', 'bar'),
          s('lvar', 'bar')),
        null),
      "case foo; when 'bar' then bar; end")
  });

  it("test_when_multi", function() {
    assert_parses(
      s('case', s('lvar', 'foo'),
        s('when', s('str', 'bar'), s('str', 'baz'),
          s('lvar', 'bar')),
        null),
      "case foo; when 'bar', 'baz'; bar; end")
  });

  it("test_when_splat", function() {
    assert_parses(
      s('case', s('lvar', 'foo'),
        s('when',
          s('int', 1),
          s('splat', s('lvar', 'baz')),
          s('lvar', 'bar')),
        s('when',
          s('splat', s('lvar', 'foo')),
          null),
        null),
      'case foo; when 1, *baz; bar; when *foo; end')
  });
  
  // Looping

  it("test_while", function() {
    assert_parses(
      s('while', s('lvar', 'foo'), s('send', null, 'meth')),
      'while foo do meth end')

    assert_parses(
      s('while', s('lvar', 'foo'), s('send', null, 'meth')),
      'while foo; meth end')
  });

  it("test_while_mod", function() {
    assert_parses(
      s('while', s('lvar', 'foo'), s('send', null, 'meth')),
      'meth while foo')
  });

  it("test_until", function() {
    assert_parses(
      s('until', s('lvar', 'foo'), s('send', null, 'meth')),
      'until foo do meth end')

    assert_parses(
      s('until', s('lvar', 'foo'), s('send', null, 'meth')),
      'until foo; meth end')
  });

  it("test_until_mod", function() {
    assert_parses(
      s('until', s('lvar', 'foo'), s('send', null, 'meth')),
      'meth until foo')
  });

  it("test_while_post", function() {
    assert_parses(
      s('while_post', s('lvar', 'foo'),
        s('kwbegin', s('send', null, 'meth'))),
      'begin meth end while foo')
  });

  it("test_until_post", function() {
    assert_parses(
      s('until_post', s('lvar', 'foo'),
        s('kwbegin', s('send', null, 'meth'))),
      'begin meth end until foo')
  });
  
  it("test_while_masgn", function() {
    // assert_diagnoses
  });
  
  it("test_while_mod_masgn", function() {
    // assert_diagnoses
  });
  
  it("test_for", function() {
    assert_parses(
      s('for',
        s('lvasgn', 'a'),
        s('lvar', 'foo'),
        s('send', null, 'p', s('lvar', 'a'))),
      'for a in foo do p a; end')

    assert_parses(
      s('for',
        s('lvasgn', 'a'),
        s('lvar', 'foo'),
        s('send', null, 'p', s('lvar', 'a'))),
      'for a in foo; p a; end')
  });

  it("test_for_mlhs", function() {
    assert_parses(
      s('for',
        s('mlhs',
          s('lvasgn', 'a'),
          s('lvasgn', 'b')),
        s('lvar', 'foo'),
        s('send', null, 'p', s('lvar', 'a'), s('lvar', 'b'))),
      'for a, b in foo; p a, b; end',
      '    ~~~~ expression (mlhs)')
  });

  // Control flow commands

  it("test_break", function() {
    assert_parses(
      s('break', s('begin', s('lvar', 'foo'))),
      'break(foo)')

    assert_parses(
      s('break', s('lvar', 'foo')),
      'break foo')

    assert_parses(
        s('break', s('begin')),
      'break()')

    assert_parses(
      s('break'),
      'break')
  });

  it("test_return", function() {
    assert_parses(
      s('return', s('begin', s('lvar', 'foo'))),
      'return(foo)')

    assert_parses(
      s('return', s('lvar', 'foo')),
      'return foo')

    assert_parses(
      s('return', s('begin')),
      'return()')

    assert_parses(
      s('return'),
      'return')
  });

  it("test_next", function() {
    assert_parses(
      s('next', s('begin', s('lvar', 'foo'))),
      'next(foo)')

    assert_parses(
      s('next', s('lvar', 'foo')),
      'next foo')

    assert_parses(
        s('next', s('begin')),
      'next()')

    assert_parses(
      s('next'),
      'next')
  });

  it("test_redo", function() {
    assert_parses(
      s('redo'),
      'redo')
  });
  
  // Exception handling

  it("test_rescue", function() {
    assert_parses(
      s('kwbegin',
        s('rescue', s('send', null, 'meth'),
          s('resbody', null, null, s('lvar', 'foo')),
          null)),
      'begin; meth; rescue; foo; end')
  });

  it("test_rescue_else", function() {
    assert_parses(
      s('kwbegin',
        s('rescue', s('send', null, 'meth'),
          s('resbody', null, null, s('lvar', 'foo')),
          s('lvar', 'bar'))),
      'begin; meth; rescue; foo; else; bar; end')
  });
  
  it("test_rescue_else_useless", function() {
    // assert_diagnoses
  });
  
  it("test_ensure", function() {
    assert_parses(
      s('kwbegin',
        s('ensure', s('send', null, 'meth'),
          s('lvar', 'bar'))),
      'begin; meth; ensure; bar; end')
  });

  it("test_ensure_empty", function() {
    assert_parses(
      s('kwbegin',
        s('ensure', null, null)),
      'begin ensure end')
  });

  it("test_rescue_ensure", function() {
    assert_parses(
      s('kwbegin',
        s('ensure',
          s('rescue',
            s('send', null, 'meth'),
            s('resbody', null, null, s('lvar', 'baz')),
            null),
          s('lvar', 'bar'))),
      'begin; meth; rescue; baz; ensure; bar; end')
  });

  it("test_rescue_else_ensure", function() {
    assert_parses(
      s('kwbegin',
        s('ensure',
          s('rescue',
            s('send', null, 'meth'),
            s('resbody', null, null, s('lvar', 'baz')),
            s('lvar', 'foo')),
          s('lvar', 'bar'))),
      'begin; meth; rescue; baz; else foo; ensure; bar end')
  });

  it("test_rescue_mod", function() {
    assert_parses(
      s('rescue',
        s('send', null, 'meth'),
        s('resbody', null, null, s('lvar', 'bar')),
        null),
      'meth rescue bar')
  });

  it("test_rescue_mod_asgn", function() {
    assert_parses(
      s('lvasgn', 'foo',
        s('rescue',
          s('send', null, 'meth'),
          s('resbody', null, null, s('lvar', 'bar')),
          null)),
      'foo = meth rescue bar')
  });

  it("test_rescue_mod_op_assign", function() {
    assert_parses(
      s('op_asgn',
        s('lvasgn', 'foo'), '+',
        s('rescue',
          s('send', null, 'meth'),
          s('resbody', null, null, s('lvar', 'bar')),
          null)),
      'foo += meth rescue bar')
  });

  it("test_resbody_list", function() {
    assert_parses(
      s('kwbegin',
        s('rescue',
          s('send', null, 'meth'),
          s('resbody',
            s('array', s('const', null, 'Exception')),
            null,
            s('lvar', 'bar')),
          null)),
      'begin; meth; rescue Exception; bar; end')
  });

  it("test_resbody_list_mrhs", function() {
    assert_parses(
      s('kwbegin',
        s('rescue',
          s('send', null, 'meth'),
          s('resbody',
            s('array',
              s('const', null, 'Exception'),
              s('lvar', 'foo')),
            null,
            s('lvar', 'bar')),
          null)),
      'begin; meth; rescue Exception, foo; bar; end')
  });

  it("test_resbody_var", function() {
    assert_parses(
      s('kwbegin',
        s('rescue',
          s('send', null, 'meth'),
          s('resbody', null, s('lvasgn', 'ex'), s('lvar', 'bar')),
          null)),
      'begin; meth; rescue => ex; bar; end')

    assert_parses(
      s('kwbegin',
        s('rescue',
          s('send', null, 'meth'),
          s('resbody', null, s('ivasgn', '@ex'), s('lvar', 'bar')),
          null)),
      'begin; meth; rescue => @ex; bar; end')
  });

  it("test_resbody_list_var", function() {
    assert_parses(
      s('kwbegin',
        s('rescue',
          s('send', null, 'meth'),
          s('resbody',
            s('array', s('lvar', 'foo')),
            s('lvasgn', 'ex'),
            s('lvar', 'bar')),
          null)),
      'begin; meth; rescue foo => ex; bar; end')
  });

  it("test_retry", function() {
    assert_parses(
      s('retry'),
      'retry')
  });

  // BEGIN and END

  it("test_preexe", function() {
    assert_parses(
      s('preexe', s('int', 1)),
      'BEGIN { 1 }')
  });
  
  it("test_preexe_invalid", function() {
    // assert_diagnoses
  });
  
  it("test_postexe", function() {
    assert_parses(
      s('postexe', s('int', 1)),
      'END { 1 }')
  });

  //
  // Miscellanea
  //

  it("test_kwbegin_compstmt", function() {
    assert_parses(
      s('kwbegin',
        s('send', null, 'foo!'),
        s('send', null, 'bar!')),
      'begin foo!; bar! end')
  });

  it("test_begin_cmdarg", function() {
    assert_parses(
      s('send', null, 'p',
        s('kwbegin',
          s('block',
            s('send', s('int', 1), 'times'),
            s('args'),
            s('int', 1)))),
      'p begin 1.times do 1 end end')
  });
  
  //
  // Error recovery
  //
  
  it("test_unknown_percent_str", function() {
    // assert_diagnoses
  });
  
  it("test_unterminated_embedded_doc", function() {
    // assert_diagnoses
  });
  
  it("test_codepoint_too_large", function() {
    // assert_diagnoses
  });
  
  it("test_on_error", function() {
    // assert_diagnoses
  });
  
  //
  // Token and comment extraction
  //

  it("test_comment_interleaved", function() {
    assert_parses(
      s('send', s('int', 1), '+', s('int', 2)),
      '1 + # foo\n 2')
  });

  it("test_comment_single", function() {
    assert_parses(
      s('send', null, 'puts'),
      'puts # whatever')
  });

  //
  // Whitequark parser bug-specific tests
  //

  it("test_bug_cmd_string_lookahead", function() {
    assert_parses(
      s('block',
        s('send', null, 'desc',
          s('str', 'foo')),
        s('args'), null),
      'desc "foo" do end')
  });

  it("test_bug_interp_single", function() {
    assert_parses(
      s('dstr', s('begin', s('int', 1))),
      '"#{1}"')

    assert_parses(
      s('array', s('dstr', s('begin', s('int', 1)))),
      '%W"#{1}"')
  });

  it("test_bug_def_no_paren_eql_begin", function() {
    assert_parses(
      s('def', 'foo', s('args'), null),
      'def foo\n=begin\n=end\nend')
  });
  
});