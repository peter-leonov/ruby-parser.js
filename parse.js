














;(function(){ // whole parser and lexer namespace start

"use strict";

// returns own property or `undefined`
// used at least in Lexer
var hasOwnProperty = Object.prototype.hasOwnProperty;
function ownProperty (obj, prop)
{
  if (hasOwnProperty.call(obj, prop))
    return obj[prop];
  // has no such property
  return undefined;
}

// useful when adding an array elements to the end of array
var Array_push = Array.prototype.push;

// char to code shortcut
function $ (c) { return c.charCodeAt(0) }
function $$ (code) { return String.fromCharCode(code) }


// port of the Builder class from https://github.com/whitequark/parser

// TODO: yyerror("Can't change the value of self");
// TODO: parser_warning(node, "regex literal in condition");
// TODO: "string literal in condition"
// TODO: multiple assignment in conditional
// TODO: multiple assignment in conditional
// TODO: "possibly useless use of "+useless+" in void context"
// TODO: unused literal ignored
// TODO: statement not reached
// TODO: void_expr void_stmts
// TODO: check_cond assign_in_cond is_static_content
// TODO: range_op
// TODO: warn_unused_var
// TODO: compile_for_eval
// check all the ruby_sourceline pushing and poping, and nd_set_line
// and much more had been deleted in 037f36d283a52c580dd1eef6e9cd0576ce81e902


function Builder ()
{
  this.reset();
}

;(function(){ // builder namespace


// methods-in-constructor pattern used for performance, simplicity
// and, of course, readability
function Scope ()
{
  var self = this;
  
  var variables,
      stack;
  
  function reset ()
  {
    // keywords for search: DVARS_INHERIT : DVARS_TOPSCOPE
    //   if you need to inherit variables from a higher level,
    //   try passing a variables object and replace `null` with it
    variables = Object.create(null);
    stack     = [];
  }
  
  reset();
  
  function push_static ()
  {
    stack.push(variables);
    variables = Object.create(null);

    return self;
  }

  function push_dynamic ()
  {
    stack.push(variables);
    variables = Object.create(variables); // use the prototype chain

    return self;
  }

  function pop ()
  {
    variables = stack.pop();

    return self;
  }

  function declare (name)
  {
    variables[name] = true;

    return self;
  }

  function is_declared (name)
  {
    return variables[name];
  }
  
  // public
  self.push_static  = push_static;
  self.push_dynamic = push_dynamic;
  self.pop          = pop;
  self.declare      = declare;
  self.is_declared  = is_declared;
  
  // debug TODO: hide
  self.variables  = function () { return variables; };
}

Builder.Scope = Scope;

function n (type, children)
{
  children.type = type;
  // children.children = children;
  return children;
}

function n0 (type)
{
  var children = [];
  children.type = type;
  // children.children = children;
  return children;
}

function toPlain (node)
{
  if (!node || !node.type)
    return node;

  var ary = node.slice();
  ary.unshift(node.type);

  for (var i = 0, il = ary.length; i < il; i++)
    ary[i] = toPlain(ary[i]);

  return ary;
}

Builder.toPlain = toPlain;
Builder.createNode = n;




Builder.prototype =
{
  reset: function ()
  {
    this.lexer = null;
    this.resulting_ast = null;
  },
  
  setLexer: function (l)
  {
    this.lexer = l;
  },
  
  setScope: function (s)
  {
    this.scope = s;
  },
  
  //
  // VERIFICATION
  //

  // TODO: port the full version from parse.y check_cond()
  check_condition: function (cond)
  {
    switch (cond.type)
    {
      case 'masgn':
        // TODO
        // diagnostic :error, ERRORS[:masgn_as_condition], cond.loc.expression
        return null;

      case 'begin':
        var children = cond;
        if (children.length == 1)
        {
          var last = children[0];
          return n('begin', [this.check_condition(last)])
        }
        else
        {
          return cond;
        }

      case 'and': case 'or':
        var children = cond;
        children[0] = this.check_condition(children[0]); // lhs
        children[1] = this.check_condition(children[1]); // rhs

        return cond;

      case 'irange': case 'erange':
        var children = cond;
        children[0] = this.check_condition(children[0]); // lhs
        children[1] = this.check_condition(children[1]); // rhs

        // irange => iflipflop
        // erange => eflipflop
        var type = cond.type == 'irange' ? 'iflipflop' : 'eflipflop'

        return n(type, children);

      case 'regexp':
        return n('match_current_line', [ cond ])

      default:
        return cond;
    }
  },
  
  
  
  // compound statement
  compstmt: function (statements)
  {
    switch (statements.length)
    {
      case 0:
        return null;
      case 1:
        return statements[0];
      default:
        var begin = n('begin', statements);
        begin.begin_from_compstmt = true;
        return begin;
    }
  },
  
  // BEGIN
  preexe: function (compstmt)
  {
    return n('preexe', [ compstmt ])
  },
  
  ident: function (identifier)
  {
    return n('ident', [ identifier ])
  },
  
  const_: function (name_t)
  {
    return n('const', [ null, name_t ]);
  },
  
  accessible: function (node)
  {
    switch (node.type)
    {
      case 'ident':
        var name = node[0];
        if (this.scope.is_declared(name))
        {
          return n('lvar', [ name ]);
        }
        else
        {
          return n('send', [ null, name ]);
        }

      case '__FILE__':
        return n('__FILE__', [ node[0] ]);

      case '__LINE__':
        // TODO: use line from node value
        return n('__LINE__', [ this.lexer.ruby_sourceline ]);

      case '__ENCODING__':
        return n('const', [ n('const', [ null, 'Encoding'], null), 'UTF_8' ])

      default:
        return node;
    }
  },

  integer: function (number, negate)
  {
    return n('int', [ negate ? -number : number ]);
  },

  float_: function (number, negate)
  {
    return n('float', [ negate ? -number : number ]);
  },

  assignable: function (node)
  {
    var children = node;
    switch (node.type)
    {
      case 'ident':
        this.scope.declare(children[0]); // var name
        return n('lvasgn', children);

      case 'ivar':
        return n('ivasgn', children);

      case 'cvar':
        return n('cvasgn', children);

      case 'const':
        if (this.lexer.in_def)
        {
          this.lexer.compile_error('TODO: dynamic_const');
        }

        return n('casgn', children);

      case 'gvar':
        return n('gvasgn', children);

      case 'nil': case 'self': case 'true': case 'false':
      case '__FILE__': case '__LINE__': case '__ENCODING__':
        this.lexer.compile_error('TODO: invalid_assignment');
      break;

      case 'back_ref': case 'nth_ref':
        this.lexer.compile_error('TODO: backref_assignment');
      break;
    }
    
    return null;
  },
  
  // 
  // Literals
  // 

  // Singletons

  nil: function ()
  {
    return n0('nil');
  },

  true_: function ()
  {
    return n0('true');
  },

  false_: function ()
  {
    return n0('false');
  },
  
  //
  // Access
  //
  
  self: function ()
  {
    return n0('self');
  },
  
  attr_asgn: function (receiver, op_t, selector_t)
  {
    var method_name = selector_t + '=';

    // Incomplete method call.
    var node = n('send', [ receiver, method_name ]);
    // to distinguish `a.b` from `a::b`
    node.op = op_t;
    return node;
  },
  
  begin_body: function (compound_stmt, rescue_bodies , else_, ensure)
  {
    if (rescue_bodies.length)
    {
      var body = [compound_stmt];
      Array_push.apply(body, rescue_bodies);
      body.push(else_);
      
      compound_stmt = n('rescue', body);
    }

    // may be undefined if called from modifier statement
    // or empty ary if begin has no ensure black at all
    // or ary of one element with the body of the present ensure block
    if (ensure && ensure.length)
    {
      compound_stmt = n('ensure', [ compound_stmt, ensure[0] ]);
    }

    return compound_stmt;
  },
  
  rescue_body: function (exc_list, exc_var, compound_stmt)
  {
    return n('resbody', [ exc_list, exc_var, compound_stmt ]);
  },
  
  array: function (elements)
  {
    return n('array', elements);
  },
  
  begin_keyword: function (body)
  {
    if (!body)
    {
      // A nil expression: `begin end`.
      return n0('kwbegin');
    }
    
    if (body.begin_from_compstmt)
    {
      // Synthesized (begin) from compstmt "a; b".
      return n('kwbegin', body);
    }
    
    return n('kwbegin', [ body ])
  },
  
  assign: function (lhs, rhs)
  {
    lhs.push(rhs);
    return lhs;
  },
  
  const_op_assignable: function (node)
  {
    return n('casgn', node)
  },
  
  _LINE_: function (ruby_sourceline)
  {
    return n('__LINE__', [ ruby_sourceline ]);
  },
  
  _FILE_: function (filename)
  {
    return n('__FILE__', [ filename ]);
  },
  
  _ENCODING_: function ()
  {
    return n0('__ENCODING__');
  },
  
  ivar: function (name)
  {
    return n('ivar', [ name ]);
  },
  
  gvar: function (name)
  {
    return n('gvar', [ name ]);
  },
  
  cvar: function (name)
  {
    return n('cvar', [ name ]);
  },
  
  back_ref: function (name)
  {
    return n('back_ref', [ name ]);
  },
  
  nth_ref: function (name)
  {
    return n('nth_ref', [ name ]);
  },
  
  alias: function (to, from)
  {
    return n('alias', [ to, from ]);
  },
  
  alias_gvar_gvar: function (gvar1, gvar2)
  {
    var to   = this.gvar(gvar1);
    var from = this.gvar(gvar2);
    
    // the same as in `this.alias()`
    return n('alias', [ to, from ]);
  },
  
  alias_gvar_backref: function (gvar, backref)
  {
    var to   = this.gvar(gvar);
    var from = this.back_ref(backref);
    
    // the same as in `this.alias()`
    return n('alias', [ to, from ]);
  },
  
  symbol: function (sym)
  {
    return n('sym', [ sym ]);
  },
  
  undef_method: function (names)
  {
    return n('undef', names.slice()); // TODO: check if slice() is needed
  },
  
  condition_mod: function (if_true, if_false, cond)
  {
    return n('if', [ this.check_condition(cond), if_true, if_false ])
  },
  
  // Ranges

  range_inclusive: function (lhs, rhs)
  {
    return n('irange', [ lhs, rhs ]);
  },
  
  range_exclusive: function (lhs, rhs)
  {
    return n('erange', [ lhs, rhs ]);
  },
  
  loop: function (type, cond, body)
  {
    return n(type, [ this.check_condition(cond), body ]);
  },
  
  loop_mod: function (type, body, cond)
  {
    // begin … end while …
    if (body.type == 'kwbegin')
    {
      type += "_post"
    }

    return n(type, [ this.check_condition(cond), body ]);
  },
  
  postexe: function (compstmt)
  {
    return n('postexe', [ compstmt ]);
  },
  
  multi_assign: function (lhs, rhs)
  {
    return n('masgn', [ lhs, rhs ]);
  },
  
  multi_lhs: function (items)
  {
    return n('mlhs', items.slice()); // TODO: check if `slice()` is nessry
  },
  
  splat: function (arg)
  {
    return n('splat', [ arg ]);
  },
  
  splat_empty: function ()
  {
    return n0('splat');
  },
  
  op_assign: function (lhs, operator, rhs)
  {
    switch (lhs.type)
    {
      case 'send':
      case 'lvasgn': case 'ivasgn': case 'gvasgn':
      case 'cvasgn': case 'casgn':

        switch (operator)
        {
          case "&&":
            return n('and_asgn', [ lhs, rhs ]);
          case "||":
            return n('or_asgn', [ lhs, rhs ]);
        }

        return n('op_asgn', [ lhs, operator, rhs ]);

      case 'back_ref': case 'nth_ref':
        this.lexer.compile_error('TODO: backref_assignment');
        return null;
    }
  },
  
  index: function (receiver, indexes)
  {
    // TODO: refactor all `concat()`s to avoid garbage arrays
    return n('send', [ receiver, "[]" ].concat(indexes));
  },
  
  call_method: function (receiver, dot_t, selector_t, args)
  {
    // empty `selector_t` indicates this call form: `a.()`,
    // transform it to `a.call()`
    var ary = [ receiver, selector_t || "call" ];
    var node = n('send', args ? ary.concat(args) : ary);
    
    // to distinguish `a.b` from `a::b`
    node.op = dot_t;
    
    return node;
  },
  
  keyword_cmd: function (type, args)
  {
    return n(type, args || []);
  },
  
  logical_op: function (type, lhs, rhs)
  {
    return n(type, [ lhs, rhs ]);
  },
  
  not_op: function (receiver)
  {
    // for `!()`
    if (receiver == null)
    {
      var nil_node = n0('begin');

      return n('send', [ nil_node, '!' ]);
    }
    else
    {
      return n('send', [ receiver, '!' ]);
    }
  },
  
  block: function (method_call, args, body) // body is an array
  {
    // method_call = _receiver, _selector, *call_args
    // check if there are arguments at all
    if (method_call.length >= 3)
    {
      var last_arg = method_call[method_call.length-1];
      if (last_arg && last_arg.type == 'block_pass')
      {
        this.lexer.compile_error('TODO: block_and_blockarg');
      }
    }
    
    return n('block', [ method_call, args, body ]);
  },
  
  block_pass: function (arg)
  {
    return n('block_pass', [ arg ]);
  },
  
  args: function (args)
  {
    this.check_duplicate_args(args);
    return n('args', args.slice()); // expect not null `args`
  },
  
  arg: function (name_t)
  {
    return n('arg', [ name_t ]);
  },
  
  check_duplicate_args: function (args, map)
  {
    if (!map)
      map = {};
    
    for (var i = 0, il = args.length; i < il; i++)
    {
      var this_arg = args[i];
      
      switch (this_arg.type)
      {
        // TODO: place `case `mlhs` here, and these mess in default. Test!
        case 'arg':   case 'optarg':   case 'restarg':   case 'blockarg':
        case 'kwarg': case 'kwoptarg': case 'kwrestarg': case 'shadowarg':

          var this_name = this_arg[0];

          var that_arg = map[this_name];
          if (!that_arg)
          {
            map[this_name] = this_arg;
            continue;
          }
          
          var that_name = that_arg[0];
          if (this.arg_name_collides(this_name, that_name))
          {
            this.lexer.compile_error('TODO: duplicate_argument');
            // diagnostic :error, ERRORS[:duplicate_argument],
                       // this_arg.loc.name, [ that_arg.loc.name ]
          }
          break;

        case 'mlhs':
          this.check_duplicate_args(this_arg, map);
      }
    }
  },
  
  arg_name_collides: function (this_name, that_name)
  {
    // ruby 2.0 rule
    // Ignore everything beginning with underscore.
    return this_name[0] != '_' && this_name == that_name;
  },
  
  
  shadowarg: function (ident)
  {
    return n('shadowarg', [ ident ]);
  },
  
  pair_keyword: function (key_t, value)
  {
    var key = n('sym', [ key_t ]);
    return n('pair', [ key, value ]);
  },
  
  kwsplat: function (arg)
  {
    return n('kwsplat', [ arg ]);
  },
  
  pair: function (key, value)
  {
    return n('pair', [ key, value ]);
  },
  
  associate: function (pairs)
  {
    return n('hash', pairs.slice()); // TODO: check all `slices()` are nessry
  },
  
  begin: function (body)
  {
    if (body == null)
    {
      // A nil expression: ()
      return n0('begin');
    }
    
    if (body.type == 'mlhs' || body.begin_from_compstmt)
    {
      // Synthesized (begin) from compstmt "a; b" or (mlhs)
      // from multi_lhs "(a, b) = *foo".
      return n(body.type, body);
    }
    
    return n('begin', [ body ]);
  },
  
  index_asgn: function (receiver, indexes)
  {
    // Incomplete method call.
    return n('send', [ receiver, '[]=' ].concat(indexes));
  },
  
  const_global: function (name_t)
  {
    var cbase = n0('cbase');
    return n('const', [ cbase, name_t ]);
  },
  
  const_fetch: function (scope, op_t, name_t)
  {
    var node = n('const', [ scope, name_t ]);
    // to distinguish `a.b` from `a::b`
    node.op = op_t;
    return node;
  },
  
  binary_op: function (receiver, operator_t, arg)
  {
    return n('send', [ receiver, operator_t, arg ]);
  },
  
  unary_op: function (op_t, receiver)
  {
    if (op_t == '+')
    {
      var method = '+@';
    }
    else if (op_t == '-')
    {
      method = '-@';
    }
    else
    {
      method = op_t;
    }
    
    return n('send', [ receiver, method ]);
  },
  
  ternary: function (cond, if_true, if_false)
  {
    var node = n('if', [ this.check_condition(cond), if_true, if_false ]);
    node.ternary = true;
    return node;
  },
  
  blockarg: function (name_t)
  {
    return n('blockarg', [ name_t ]);
  },
  
  call_lambda: function ()
  {
    return n('send', [ null, 'lambda' ]);
  },
  
  condition: function (cond, if_true, if_false)
  {
    return n('if', [ this.check_condition(cond), if_true, if_false ]);
  },
  
  case_: function (expr, when_bodies, else_body)
  {
    var children = [ expr ].concat(when_bodies);
    children.push(else_body);
    return n('case', children);
  },
  
  when: function (patterns, body)
  {
    var children = patterns;
    children.push(body);
    return n('when', children);
  },
  
  for_: function (iterator, iteratee, body)
  {
    return n('for', [ iterator, iteratee, body ]);
  },
  
  def_class: function (name, superclass, body)
  {
    return n('class', [ name, superclass, body ]);
  },
  
  def_sclass: function (expr, body)
  {
    return n('sclass', [ expr, body ]);
  },
  
  def_module: function (name, body)
  {
    return n('module', [ name, body ]);
  },
  
  def_method: function (name_t, args, body)
  {
    return n('def', [ name_t, args, body ]);
  },
  
  def_singleton: function (definee, name_t, args, body)
  {
    switch (definee.type)
    {
      case 'int':    case 'str':   case 'dstr': case 'sym': case 'dsym':
      case 'regexp': case 'array': case 'hash':

        this.lexer.compile_error('TODO: singleton_literal');
        // fall through
    }
    
    return n('defs', [ definee, name_t, args, body ]);
  },
  
  
  restarg: function (name_t)
  {
    if (name_t == null)
      return n0('restarg');
    
    return n('restarg', [ name_t ]);
  },
  
  // Strings
  
  string: function (string_t)
  {
    return n('str', [ string_t ]);
  },
  
  string_compose: function (parts)
  {
    if (this.collapse_string_parts(parts))
    {
      return parts[0]; // single string or uncollapsable dstring
    }
    
    // uncollapsable dstring
    return n('dstr', parts.slice());
  },
  
  xstring_compose: function (parts)
  {
    return n('xstr', parts.slice());
  },
  
  regexp_options: function (regopt_t) // tREGEXP_END actually
  {
    var options = regopt_t.split('');
    options.sort(); // .uniq()

    return n('regopt', options);
  },
  
  regexp_compose: function (parts, options)
  {
    parts.push(options);
    return n('regexp', parts);
  },
  
  collapse_string_parts: function (parts)
  {
    if (parts.length != 1)
      return false;
    
    var type = parts[0].type;
    return type == 'str' || type == 'dstr';
  },
  
  words_compose: function (parts)
  {
    return n('array', parts.slice()); // TODO: almost sure slice() is usls.
  },
  
  word: function (parts)
  {
    if (this.collapse_string_parts(parts))
    {
      return parts[0];
    }
    
    return n('dstr', parts.slice());
  },
  
  symbols_compose: function (parts)
  {
    var symbols = [];
    for (var i = 0, il = parts.length; i < il; i++)
    {
      var part = parts[i];
      switch (part.type)
      {
        case 'str':
          var value = part[0];
          symbols.push(n('sym', [ value ]));
          break;
        case 'dstr':
          symbols.push(n('dsym', part));
          break;
        default:
          symbols.push(part);
      }
    }
    
    return n('array', symbols);
  },
  
  symbol_compose: function (parts)
  {
    if (this.collapse_string_parts(parts))
    {
      var str = parts[0];
      return n('sym', [ str[0] ]);
    }
    else
    {
      return n('dsym', parts.slice());
    }
  },
  
  
  kwoptarg: function (name_t, value)
  {
    return n('kwoptarg', [ name_t, value ]);
  },
  
  kwrestarg: function (name_t)
  {
    if (name_t == null)
    {
      return n0('kwrestarg');
    }
    
    return n('kwrestarg', [ name_t ]);
  },
  
  optarg: function (name_t, value)
  {
    return n('optarg', [ name_t, value ]);
  },
  
  match_op: function (receiver, arg)
  {
    if
    (
         receiver.type == 'regexp'
      && receiver.length == 2
      && receiver[0].type == 'str'
    )
    {

      var regexp_str = receiver[0];
      var regexp_body = regexp_str[0];

      var scope = this.scope;
      // TODO: write a full featured rexexp parser here ;)
      regexp_body.replace(/\(\?\<(\w+)\>/g, function (_m, name)
      {
        scope.declare(name);
      })

      return n('match_with_lvasgn', [ receiver, arg ]);
    }
    else
    {
      return n('send', [ receiver, '=~', arg ]);
    }
  }
  
}

})(); // builder namespace




// Tokens.
// Token numbers, to be returned by the scanner.
var
  END_OF_INPUT = 0,
  keyword_class = 258,
  keyword_module = 259,
  keyword_def = 260,
  keyword_undef = 261,
  keyword_begin = 262,
  keyword_rescue = 263,
  keyword_ensure = 264,
  keyword_end = 265,
  keyword_if = 266,
  keyword_unless = 267,
  keyword_then = 268,
  keyword_elsif = 269,
  keyword_else = 270,
  keyword_case = 271,
  keyword_when = 272,
  keyword_while = 273,
  keyword_until = 274,
  keyword_for = 275,
  keyword_break = 276,
  keyword_next = 277,
  keyword_redo = 278,
  keyword_retry = 279,
  keyword_in = 280,
  keyword_do = 281,
  keyword_do_cond = 282,
  keyword_do_block = 283,
  keyword_do_LAMBDA = 284,
  keyword_return = 285,
  keyword_yield = 286,
  keyword_super = 287,
  keyword_self = 288,
  keyword_nil = 289,
  keyword_true = 290,
  keyword_false = 291,
  keyword_and = 292,
  keyword_or = 293,
  keyword_not = 294,
  modifier_if = 295,
  modifier_unless = 296,
  modifier_while = 297,
  modifier_until = 298,
  modifier_rescue = 299,
  keyword_alias = 300,
  keyword_defined = 301,
  keyword_BEGIN = 302,
  keyword_END = 303,
  keyword__LINE__ = 304,
  keyword__FILE__ = 305,
  keyword__ENCODING__ = 306,
  tIDENTIFIER = 307,
  tFID = 308,
  tGVAR = 309,
  tIVAR = 310,
  tCONSTANT = 311,
  tCVAR = 312,
  tLABEL = 313,
  tINTEGER = 314,
  tFLOAT = 315,
  tSTRING_CONTENT = 316,
  tCHAR = 317,
  tNTH_REF = 318,
  tBACK_REF = 319,
  tREGEXP_END = 320,
  tUPLUS = 321,
  tUMINUS = 322,
  tPOW = 323,
  tCMP = 324,
  tEQ = 325,
  tEQQ = 326,
  tNEQ = 327,
  tGEQ = 328,
  tLEQ = 329,
  tANDOP = 330,
  tOROP = 331,
  tMATCH = 332,
  tNMATCH = 333,
  tDOT2 = 334,
  tDOT3 = 335,
  tAREF = 336,
  tASET = 337,
  tLSHFT = 338,
  tRSHFT = 339,
  tCOLON2 = 340,
  tCOLON3 = 341,
  tOP_ASGN = 342,
  tASSOC = 343,
  tLPAREN = 344,
  tLPAREN_ARG = 345,
  tRPAREN = 346,
  tLBRACK = 347,
  tLBRACE = 348,
  tLBRACE_ARG = 349,
  tSTAR = 350,
  tDSTAR = 351,
  tAMPER = 352,
  tLAMBDA = 353,
  tSYMBEG = 354,
  tSTRING_BEG = 355,
  tXSTRING_BEG = 356,
  tREGEXP_BEG = 357,
  tWORDS_BEG = 358,
  tQWORDS_BEG = 359,
  tSYMBOLS_BEG = 360,
  tQSYMBOLS_BEG = 361,
  tSTRING_DBEG = 362,
  tSTRING_DEND = 363,
  tSTRING_DVAR = 364,
  tSTRING_END = 365,
  tLAMBEG = 366,
  tLOWEST = 367,
  tUMINUS_NUM = 368,
  tLAST_TOKEN = 369;


// here goes all the lexer code that depends on token numbers




// here we know all the token numbers as a list of constant variables
// 
//   var END_OF_INPUT = 0;
//   var keyword_class = 258;
//   var keyword_module = 259;
// 
// and so on.


// expose the constants to outer world (e.g. parser)

// ignore newline, +/- is a sign.
var EXPR_BEG    = 1 << 0;
// newline significant, +/- is an operator.
var EXPR_END    = 1 << 1;
// ditto, and unbound braces.
var EXPR_ENDARG = 1 << 2;
// ditto, and unbound braces.
var EXPR_ENDFN  = 1 << 3;
// newline significant, +/- is an operator.
var EXPR_ARG    = 1 << 4;
// newline significant, +/- is an operator.
var EXPR_CMDARG = 1 << 5;
// newline significant, +/- is an operator.
var EXPR_MID    = 1 << 6;
// ignore newline, no reserved words.
var EXPR_FNAME  = 1 << 7;
// right after `.' or `::', no reserved words.
var EXPR_DOT    = 1 << 8;
// immediate after `class', no here document.
var EXPR_CLASS  = 1 << 9;
// alike EXPR_BEG but label is disallowed.
var EXPR_VALUE  = 1 << 10;

var EXPR_BEG_ANY = EXPR_BEG | EXPR_VALUE | EXPR_MID | EXPR_CLASS;
var EXPR_ARG_ANY = EXPR_ARG | EXPR_CMDARG;
var EXPR_END_ANY = EXPR_END | EXPR_ENDARG | EXPR_ENDFN;


// $text: plain old JS string with ruby source code,
function YYLexer ()
{
// the yylex() method and all public data sit here
var lexer = this;

var $scope = null;

var $lex_pbeg = 0, // $lex_pbeg never changes
    $lex_p = 0,
    $lex_pend = 0;

var $text_pos = 0;
var $text = '';

var $lex_nextline = '',
    $lex_lastline = '';


var $tokenbuf = '';

// our addition for source maps
// packed as: (line << 10) + (col & 0x3ff)
//  {line 20 bits}{column 10 bits} = {llllllllllllllllllll}{cccccccccc}
var $tok_beg = 0; // line and column of first token char
//   tok_end = 0; // line and column right after the last token char 

// Anything changing must be set in `reset`
function reset ()
{
  $lex_pbeg = 0;
  $lex_p = 0;
  $lex_pend = 0;

  $text = '';
  $text_pos = 0;

  $lex_nextline = '';
  $lex_lastline = '';

  $tokenbuf = '';
  $tok_beg = 0;
  
  
  $scope = null;
  
  // the end of stream had been reached
  lexer.eofp = false;
  // the string to be parsed in the nex lex() call
  lexer.lex_strterm = null;
  // the main point of interaction with the parser out there
  lexer.lex_state = 0;
  // to store the main state
  lexer.last_state = 0;
  // have the lexer seen a space somewhere before the current char
  lexer.space_seen = false;
  // parser and lexer set this for lexer,
  // becomes `true` after `\n`, `;` or `(` is met
  lexer.command_start = false;
  // temp var for command_start during single run of `yylex`
  lexer.cmd_state = false;
  // used in `COND_*` macro-methods,
  // another spot of interlacing parser and lexer
  lexer.cond_stack = 0;
  // used in `CMDARG_*` macro-methods,
  // another spot of interlacing parser and lexer
  lexer.cmdarg_stack = 0;
  // controls level of nesting in `()` or `[]`
  lexer.paren_nest = 0;
  lexer.lpar_beg = 0;
  // controls level of nesting in `{}`
  lexer.brace_nest = 0;
  // controls the nesting of states of condition-ness and cmdarg-ness
  lexer.cond_stack = 0;
  lexer.cmdarg_stack = 0;
  // how deep in in singleton definition are we?
  lexer.in_single = 0;
  // are we in def …
  lexer.in_def = 0;
  // defined? … has its own roles of lexing
  lexer.in_defined = false;
  // have we seen `__END__` already in lexer?
  lexer.ruby__end__seen = false;
  // parser needs access to the line number,
  // AFAICT, parser never changes it, only sets `nd_line` on nodes
  lexer.ruby_sourceline = 0;
  // file name for meningfull error reporting
  lexer.filename = '';
  // parser doesn't touch it, but what is it?
  lexer.heredoc_end = 0;
  lexer.line_count = 0;
  // errors count
  lexer.nerr = 0;
  // TODO: check out list of stateful variables with the original

  // the token value to be stored in the values stack
  lexer.yylval = null;

  // the token location to be stored in the locations stack
  lexer.yyloc = null;
}

// call once on lexer creation
reset();

// public:
// pretent brand new lexer
lexer.reset = reset;
// give a chance to set `$text` afterwards
lexer.setText = function (v)
{
  $text = v ? ''+v : '';
  $text_pos = 0;
}
// connection to the outer space
lexer.setScope = function (v) { $scope = v; }


// the shortcut for checking `lexer.lex_state` over and over again
function IS_lex_state (ls)
{
  return lexer.lex_state & ls;
}
function IS_lex_state_for (state, ls)
{
  return state & ls;
}

// interface to lexer.cond_stack
// void
lexer.COND_PUSH = function (n)
{
  // was: BITSTACK_PUSH(cond_stack, n)
  lexer.cond_stack = (lexer.cond_stack << 1) | (n & 1);
}
// void
lexer.COND_POP = function ()
{
  // was: BITSTACK_POP(cond_stack)
  lexer.cond_stack >>= 1;
}
// void
lexer.COND_LEXPOP = function ()
{
  // was: BITSTACK_LEXPOP(cond_stack)
  var stack = lexer.cond_stack;
  lexer.cond_stack = (stack >> 1) | (stack & 1);
}
// int
lexer.COND_P = function ()
{
  // was: BITSTACK_SET_P(cond_stack)
  return lexer.cond_stack & 1;
}

// interface to lexer.cmdarg_stack
// void
lexer.CMDARG_PUSH = function (n)
{
  // was: BITSTACK_PUSH(cmdarg_stack, n)
  lexer.cmdarg_stack = (lexer.cmdarg_stack << 1) | (n & 1);
}
// void
lexer.CMDARG_POP = function ()
{
  // was: BITSTACK_POP(cmdarg_stack)
  lexer.cmdarg_stack >>= 1;
}
// void
lexer.CMDARG_LEXPOP = function ()
{
  // was: BITSTACK_LEXPOP(cmdarg_stack)
  var stack = lexer.cmdarg_stack;
  lexer.cmdarg_stack = (stack >> 1) | (stack & 1);
}
// int
lexer.CMDARG_P = function ()
{
  // was: BITSTACK_SET_P(cmdarg_stack)
  return lexer.cmdarg_stack & 1;
}



// few more shortcuts
function IS_ARG () { return lexer.lex_state & EXPR_ARG_ANY }
function IS_END () { return lexer.lex_state & EXPR_END_ANY }
function IS_BEG () { return lexer.lex_state & EXPR_BEG_ANY }
function IS_LABEL_POSSIBLE ()
{
  return (IS_lex_state(EXPR_BEG | EXPR_ENDFN) && !lexer.cmd_state) || IS_ARG();
}
function IS_LABEL_SUFFIX (n)
{
  return peek_n(':', n) && !peek_n(':', n + 1);
}

// em…
function IS_SPCARG (c)
{
  return IS_ARG() &&
         lexer.space_seen &&
         !ISSPACE(c);
}

function IS_AFTER_OPERATOR () { return IS_lex_state(EXPR_FNAME | EXPR_DOT) }

function ambiguous_operator (op, syn)
{
  warn("`"+op+"' after local variable is interpreted as binary operator");
  warn("even though it seems like "+syn);
}
// very specific warning function :)
function warn_balanced (op, syn, c)
{
    if
    (
      !IS_lex_state_for
      (
        lexer.last_state,
        EXPR_CLASS | EXPR_DOT | EXPR_FNAME | EXPR_ENDFN | EXPR_ENDARG
      )
      && lexer.space_seen
      && !ISSPACE(c)
    )
    {
      ambiguous_operator(op, syn);
    }
}

var STR_FUNC_ESCAPE = 0x01;
var STR_FUNC_EXPAND = 0x02;
var STR_FUNC_REGEXP = 0x04;
var STR_FUNC_QWORDS = 0x08;
var STR_FUNC_SYMBOL = 0x10;
var STR_FUNC_INDENT = 0x20;

// enum string_type
var str_squote = 0;
var str_dquote = STR_FUNC_EXPAND;
var str_xquote = STR_FUNC_EXPAND;
var str_regexp = STR_FUNC_REGEXP | STR_FUNC_ESCAPE | STR_FUNC_EXPAND;
var str_sword = STR_FUNC_QWORDS;
var str_dword = STR_FUNC_QWORDS | STR_FUNC_EXPAND;
var str_ssym = STR_FUNC_SYMBOL;
var str_dsym = STR_FUNC_SYMBOL | STR_FUNC_EXPAND;





// here go all $strem related functions

function ISUPPER (c)
{
  return ('A' <= c && c <= 'Z') || c.toLowerCase() != c;
}
function ISALPHA (c)
{
  return /^[a-zA-Z]/.test(c);
}
function ISSPACE (c)
{
  return (
    // the most common checked first
    c === ' '  || c === '\n' || c === '\t' ||
    c === '\f' || c === '\v'
  )
}
function ISASCII (c)
{
  return $(c) < 128;
}
function ISDIGIT (c)
{
  return /^\d$/.test(c);
}
function ISXDIGIT (c)
{
  return /^[0-9a-fA-F]/.test(c);
}
function ISALNUM (c)
{
  return /^\w$/.test(c);
}

// our own modification, does not match `\n`
// used to avoid crossing end of line on white space search
function ISSPACE_NOT_N (c)
{
  return (
    // the most common checked first
    c === ' '  || c === '\t' ||
    c === '\f' || c === '\v'
  )
}

lexer.check_kwarg_name = function check_kwarg_name (name_t)
{
  if (/^[A-Z]/.test(name_t))
  {
    this.compile_error('TODO: :argument_const');
  }
}


// returns empty line as EOF
function lex_getline ()
{
  var i = $text.indexOf('\n', $text_pos);
  // didn't get any more newlines
  if (i === -1)
  {
    // the rest of the line
    // e.g. match the `$`
    i = $text.length;
  }
  else
  {
    i++; // include the `\n` char
  }
  
  var line = $text.substring($text_pos, i);
  $text_pos = i;
  return line;
}


// $lex_lastline reader for error reporting
lexer.get_lex_lastline = function () { return $lex_lastline; }

function nextc ()
{
  if ($lex_p == $lex_pend)
  {
    var v = $lex_nextline;
    $lex_nextline = '';
    if (!v)
    {
      if (lexer.eofp)
        return '';

      if (!(v = lex_getline()))
      {
        lexer.eofp = true;
        lex_goto_eol();
        return '';
      }
    }
    {
      if (lexer.heredoc_end > 0)
      {
        lexer.ruby_sourceline = lexer.heredoc_end;
        lexer.heredoc_end = 0;
      }
      lexer.ruby_sourceline++;




      lexer.line_count++;
      $lex_pbeg = $lex_p = 0;
      $lex_pend = v.length;
      $lex_lastline = v;
    }
  }
  
  return $lex_lastline[$lex_p++];
}
// jump right to the end of current buffered line,
// here: "abc\n|" or here "abc|"
function lex_goto_eol ()
{
  $lex_p = $lex_pend;
}
function lex_eol_p ()
{
  return $lex_p >= $lex_pend;
}

// just an emulation of $lex_p[i] from C
function nthchar (i)
{
  return $lex_lastline[$lex_p+i];
}
// just an emulation of *lex_p from C
function lex_pv ()
{
  return $lex_lastline[$lex_p];
}
// just an emulation of *p from C
function p_pv (p)
{
  return $lex_lastline[p];
}
// emulation of `strncmp(lex_p, "begin", 5)`,
// but you better use a precompiled regexp if `str` is a constant
function strncmp_lex_p (str)
{
  return $test.substring($lex_p, $lex_p + str.length) == str;
}

// forecast, if the nextc() will return character `c`
function peek (c)
{
  return $lex_p < $lex_pend && c === $lex_lastline[$lex_p];
}

// forecast, if the nextc() will return character `c`
// after n calls
function peek_n (c, n)
{
  var pos = $lex_p + n;
  return pos < $lex_pend && c === $lex_lastline[pos];
}

// expects rex in this form: `/blablabla|/g`
// that means `blablabla` or empty string (to prevent deep search)
function match_grex (rex)
{

  rex.lastIndex = $lex_p;
  // there is always a match or an empty string in [0]
  return rex.exec($lex_lastline);
}
// the same as `match_grex()` but does'n return the match,
// treats the empty match as a `false`
function test_grex (rex)
{

  rex.lastIndex = $lex_p;
  // there is always a match for an empty string
  rex.test($lex_lastline);
  // and on the actual match there coud be a change in `lastIndex`
  return rex.lastIndex != $lex_p;
}
// step back for one character and check
// if the current character is equal to `c`
function pushback (c)
{
  if (c == '')
  {




    return;
  }
  
  $lex_p--;




}

// was begin af a line (`^` in terms of regexps) before last `nextc()`,
// that true if we're here "a|bc" of here "abc\na|bc"
function was_bol ()
{
  return $lex_p ===  1; // $lex_pbeg never changes
}


// token related stuff


    
function newtok ()
{
  $tok_beg = (lexer.ruby_sourceline << 10) + (($lex_p - 1) & 0x3ff);
  $tokenbuf = '';
}
function tokadd (c)
{
  $tokenbuf += c;
  return c;
}
function tokcopy (n)
{
  // TODO: use $lex_lastline
  $tokenbuf += $text.substring($text_pos - n, $text_pos);
}

function tokfix ()
{
  var tok_end = (lexer.ruby_sourceline << 10) + ($lex_p & 0x3ff);
  lexer.yyloc = new Location($tok_beg, tok_end);
  
  
}
function tok () { return $tokenbuf; }
function toklen () { return $tokenbuf.length; }
function toklast ()
{
  return $tokenbuf.substr(-1)
  // was: tokidx>0?tokenbuf[tokidx-1]:0)
}

// other stuff

function parser_is_identchar (c)
{
  return !lexer.eofp && is_identchar(c);
  
}
function is_identchar (c)
{
  // \w = [A-Za-z0-9_] = (isalnum(c) || c == '_')
  return /^\w/.test(c) || !ISASCII(c);
}

function NEW_STRTERM (func, term, paren)
{
  return {
    type: 'strterm',
    func: func,
    lex_lastline: '', // stub
    lex_p: 0, // stub
    ruby_sourceline: lexer.ruby_sourceline,
    nested: 0, // for tokadd_string() and parse_string()
    term: term,
    paren: paren
  };
}
// our addition
function NEW_HEREDOCTERM (func, term)
{
  return {
    type: 'heredoc',
    func: func,
    lex_lastline: $lex_lastline,
    lex_p: $lex_p,
    ruby_sourceline: lexer.ruby_sourceline,
    nested: 0,
    term: term,
    paren: ''
  };
}

// TODO: get rid of such a piece of junk :)
function arg_ambiguous ()
{
  warn("ambiguous first argument; put parentheses or even spaces");
  return true;
}






this.yylex = function yylex ()
{
  lexer.yylval = null;
  lexer.yyloc = null;
  
  var c = '';
  lexer.space_seen = false;
  
  if (lexer.lex_strterm)
  {
    var token = 0;
    if (lexer.lex_strterm.type == 'heredoc')
    {
      token = here_document(lexer.lex_strterm);
      if (token == tSTRING_END)
      {
        lexer.lex_strterm = null;
        lexer.lex_state = EXPR_END;
      }
    }
    else
    {
      token = parse_string(lexer.lex_strterm);
      if (token == tSTRING_END || token == tREGEXP_END)
      {
        lexer.lex_strterm = null;
        lexer.lex_state = EXPR_END;
      }
    }
    return token;
  }
  
  lexer.cmd_state = lexer.command_start;
  lexer.command_start = false;
  
  retry: for (;;)
  {
  lexer.last_state = lexer.lex_state;
  the_giant_switch:
  switch (c = nextc())
  {
    // different signs of the input end
    case '\0':    // NUL
    case '\x04':  // ^D
    case '\x1a':  // ^Z
    case '':      // end of script.
    {
      return 0;
    }
    
    // white spaces
    case ' ':
    case '\t':
    case '\f':
    case '\r': // TODO: scream on `\r` everywhere, or clear it out
    case '\v':    // '\13'
    {
      lexer.space_seen = true;
      continue retry;
    }
    
    // it's a comment
    case '#':
    {
      lex_goto_eol();
      // fall throug to '\n'
    }
    case '\n':
    {
      if (IS_lex_state(EXPR_BEG | EXPR_VALUE | EXPR_CLASS | EXPR_FNAME | EXPR_DOT))
      {
        continue retry;
      }
      after_backslash_n: while ((c = nextc()))
      {
        switch (c)
        {
          case ' ':
          case '\t':
          case '\f':
          case '\r':
          case '\v':    // '\13'
            lexer.space_seen = true;
            break;
          case '.':
          {
            if ((c = nextc()) != '.')
            {
              pushback(c);
              pushback('.');
              continue retry; // was: goto retry;
            }
          }
          default:
            --lexer.ruby_sourceline;
            $lex_nextline = $lex_lastline;
            
          // EOF no decrement
          case '':
            lex_goto_eol();
            break after_backslash_n;
        }
      }
      // lands: break after_backslash_n;
      lexer.command_start = true;
      lexer.lex_state = EXPR_BEG;
      return $('\n');
    }
  
    case '*':
    {
      var token = 0;
      if ((c = nextc()) == '*')
      {
        if ((c = nextc()) == '=')
        {
          lexer.yylval = "**"; // tPOW;
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        if (IS_SPCARG(c))
        {
          warn("`**' interpreted as argument prefix");
          token = tDSTAR;
        }
        else if (IS_BEG())
        {
          token = tDSTAR;
        }
        else
        {
          warn_balanced("**", "argument prefix", c);
          lexer.yylval = "**";
          token = tPOW;
        }
      }
      else
      {
        if (c == '=')
        {
          lexer.yylval = "*"; // $('*');
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        if (IS_SPCARG(c))
        {
          warn("`*' interpreted as argument prefix");
          token = tSTAR;
        }
        else if (IS_BEG())
        {
          token = tSTAR;
        }
        else
        {
          warn_balanced("*", "argument prefix", c);
          lexer.yylval = "*";
          token = $('*');
        }
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      return token;
    }
    
    case '!':
    {
      c = nextc();
      if (IS_AFTER_OPERATOR())
      {
        lexer.lex_state = EXPR_ARG;
        if (c == '@')
        {
          return $('!');
        }
      }
      else
      {
        lexer.lex_state = EXPR_BEG;
      }
      if (c == '=')
      {
        lexer.yylval = "!=";
        return tNEQ;
      }
      if (c == '~')
      {
        lexer.yylval = "!~";
        return tNMATCH;
      }
      pushback(c);
      return $('!');
    }
    
    case '=':
    {
      if (was_bol())
      {
        
        if (match_grex(/begin[\n \t]|/g)[0])
        {
          for (;;)
          {
            lex_goto_eol();
            c = nextc();
            if (c == '')
            {
              compile_error("embedded document meets end of file");
              return 0;
            }
            if (c != '=')
              continue;
            if (match_grex(/end(?:[\n \t]|$)|/gm)[0])
            {
              break;
            }
          }
          lex_goto_eol();
          continue retry; // was: goto retry;
        }
      }

      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      if ((c = nextc()) == '=')
      {
        if ((c = nextc()) == '=')
        {
          lexer.yylval = "===";
          return tEQQ;
        }
        pushback(c);
        lexer.yylval = "==";
        return tEQ;
      }
      if (c == '~')
      {
        lexer.yylval = "=~";
        return tMATCH;
      }
      else if (c == '>')
      {
        return tASSOC;
      }
      pushback(c);
      return $('=');
    }
    
    case '<':
    {
      lexer.last_state = lexer.lex_state;
      c = nextc();
      if (c == '<' &&
          !IS_lex_state(EXPR_DOT | EXPR_CLASS) &&
          !IS_END() && (!IS_ARG() || lexer.space_seen))
      {
        var token = heredoc_identifier();
        if (token)
          return token;
      }
      if (IS_AFTER_OPERATOR())
      {
        lexer.lex_state = EXPR_ARG;
      }
      else
      {
        if (IS_lex_state(EXPR_CLASS))
          lexer.command_start = true;
        lexer.lex_state = EXPR_BEG;
      }
      if (c == '=')
      {
        if ((c = nextc()) == '>')
        {
          lexer.yylval = "<=>";
          return tCMP;
        }
        pushback(c);
        lexer.yylval = "<=";
        return tLEQ;
      }
      if (c == '<')
      {
        if ((c = nextc()) == '=')
        {
          lexer.yylval = "<<"; // tLSHFT;
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        warn_balanced("<<", "here document", c);
        lexer.yylval = "<<";
        return tLSHFT;
      }
      pushback(c);
      lexer.yylval = "<";
      return $('<');
    }
    
    case '>':
    {
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      if ((c = nextc()) == '=')
      {
        lexer.yylval = ">=";
        return tGEQ;
      }
      if (c == '>')
      {
        if ((c = nextc()) == '=')
        {
          lexer.yylval = ">>"; // tRSHFT;
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        lexer.yylval = ">>";
        return tRSHFT;
      }
      pushback(c);
      lexer.yylval = ">";
      return $('>');
    }
    
    case '"':
    {
      lexer.lex_strterm = NEW_STRTERM(str_dquote, '"', '')
      return tSTRING_BEG;
    }
    
    case '`':
    {
      if (IS_lex_state(EXPR_FNAME))
      {
        lexer.lex_state = EXPR_ENDFN;
        return $(c);
      }
      if (IS_lex_state(EXPR_DOT))
      {
        if (lexer.cmd_state)
          lexer.lex_state = EXPR_CMDARG;
        else
          lexer.lex_state = EXPR_ARG;
        return $(c);
      }
      lexer.lex_strterm = NEW_STRTERM(str_xquote, '`', '');
      return tXSTRING_BEG;
    }
    
    case '\'':
    {
      lexer.lex_strterm = NEW_STRTERM(str_squote, '\'', '');
      return tSTRING_BEG;
    }
    
    case '?':
    {
      // trying to catch ternary operator
      if (IS_END())
      {
        lexer.lex_state = EXPR_VALUE;
        return $('?');
      }
      c = nextc();
      if (c == '')
      {
        compile_error("incomplete character syntax");
        return 0;
      }
      if (ISSPACE(c))
      {
        if (!IS_ARG())
        {
          var c2 = '';
          switch (c)
          {
            case ' ':
              c2 = 's';
              break;
            case '\n':
              c2 = 'n';
              break;
            case '\t':
              c2 = 't';
              break;
            case '\v':
              c2 = 'v';
              break;
            case '\r':
              c2 = 'r';
              break;
            case '\f':
              c2 = 'f';
              break;
          }
          if (c2)
          {
            warn("invalid character syntax; use ?\\" + c2);
          }
        }
        pushback(c);
        lexer.lex_state = EXPR_VALUE;
        return $('?');
      }
      newtok();
      if (!ISASCII(c))
      {
        if (tokadd(c) == '')
          return 0;
      }
      else if (is_identchar(c) && $lex_p < $lex_pend && is_identchar(lex_pv()))
      {
        pushback(c);
        lexer.lex_state = EXPR_VALUE;
        return $('?');
      }
      else if (c == '\\')
      {
        if (peek('u'))
        {
          nextc();
          c = parser_tokadd_utf8(false, false, false);
          tokadd(c);
        }
        else if (!lex_eol_p() && !(c = lex_pv(), ISASCII(c)))
        {
          nextc();
          if (tokadd(c) == '')
            return 0;
        }
        else
        {
          c = read_escape(0);
          tokadd(c);
        }
      }
      else
      {
        tokadd(c);
      }
      tokfix();
      lexer.yylval = tok(); // plain string
      lexer.lex_state = EXPR_END;
      return tCHAR;
    }
    
    case '&':
    {
      if ((c = nextc()) == '&')
      {
        lexer.lex_state = EXPR_BEG;
        if ((c = nextc()) == '=')
        {
          lexer.yylval = "&&"; // tANDOP;
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        return tANDOP;
      }
      else if (c == '=')
      {
        lexer.yylval = "&"; // $('&');
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      pushback(c);
      var t = $(c);
      if (IS_SPCARG(c))
      {
        warn("`&' interpreted as argument prefix");
        t = tAMPER;
      }
      else if (IS_BEG())
      {
        t = tAMPER;
      }
      else
      {
        warn_balanced("&", "argument prefix", c);
        lexer.yylval = "&";
        t = $('&');
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      return t;
    }
    
    case '|':
    {
      if ((c = nextc()) == '|')
      {
        lexer.lex_state = EXPR_BEG;
        if ((c = nextc()) == '=')
        {
          lexer.yylval = "||"; // tOROP;
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        return tOROP;
      }
      if (c == '=')
      {
        lexer.yylval = "|"; // $('|');
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      pushback(c);
      lexer.yylval = "|";
      return $('|');
    }
    
    case '+':
    {
      c = nextc();
      if (IS_AFTER_OPERATOR())
      {
        lexer.lex_state = EXPR_ARG;
        if (c == '@')
        {
          lexer.yylval = "+";
          return tUPLUS;
        }
        pushback(c);
        lexer.yylval = "+";
        return $('+');
      }
      if (c == '=')
      {
        lexer.yylval = "+"; // $('+');
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      if (IS_BEG() || (IS_SPCARG(c) && arg_ambiguous()))
      {
        lexer.lex_state = EXPR_BEG;
        pushback(c); // pushing back char after `+`
        if (c != '' && ISDIGIT(c))
        {
          c = '+';
          return start_num(c); // was: goto start_num;
        }
        
        lexer.yylval = "+";
        return tUPLUS;
      }
      lexer.lex_state = EXPR_BEG;
      pushback(c);
      warn_balanced("+", "unary operator", c);
      lexer.yylval = "+";
      return $('+');
    }
    
    case '-':
    {
      c = nextc();
      if (IS_AFTER_OPERATOR())
      {
        lexer.lex_state = EXPR_ARG;
        if (c == '@')
        {
          lexer.yylval = "-";
          return tUMINUS;
        }
        pushback(c);
        lexer.yylval = "-";
        return $('-');
      }
      if (c == '=')
      {
        lexer.yylval = "-"; // $('-');
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      if (c == '>')
      {
        lexer.lex_state = EXPR_ENDFN;
        return tLAMBDA;
      }
      if (IS_BEG() || (IS_SPCARG(c) && arg_ambiguous()))
      {
        lexer.lex_state = EXPR_BEG;
        pushback(c);
        if (c != '' && ISDIGIT(c))
        {
          lexer.yylval = "-";
          return tUMINUS_NUM;
        }
        lexer.yylval = "-";
        return tUMINUS;
      }
      lexer.lex_state = EXPR_BEG;
      pushback(c);
      warn_balanced("-", "unary operator", c);
      lexer.yylval = "-";
      return $('-');
    }
    
    case '.':
    {
      lexer.lex_state = EXPR_BEG;
      if ((c = nextc()) == '.')
      {
        if ((c = nextc()) == '.')
        {
          return tDOT3;
        }
        pushback(c);
        return tDOT2;
      }
      pushback(c);
      if (c != '' && ISDIGIT(c))
      {
        lexer.yyerror("no .<digit> floating literal anymore; put 0 before dot");
      }
      lexer.lex_state = EXPR_DOT;
      return $('.');
    }
    
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
    {
      return start_num(c);
    }
    
    case ')':
    case ']':
      lexer.paren_nest--;
    case '}':
    {
      var t = $(c);
      lexer.COND_LEXPOP();
      lexer.CMDARG_LEXPOP();
      if (c == ')')
        lexer.lex_state = EXPR_ENDFN;
      else
        lexer.lex_state = EXPR_ENDARG;
      if (c == '}')
      {
        if (!lexer.brace_nest--)
          t = tSTRING_DEND;
      }
      return t;
    }
    
    case ':':
    {
      c = nextc();
      if (c == ':')
      {
        if (IS_BEG() || IS_lex_state(EXPR_CLASS) || IS_SPCARG(''))
        {
          lexer.lex_state = EXPR_BEG;
          return tCOLON3;
        }
        lexer.lex_state = EXPR_DOT;
        return tCOLON2;
      }
      if (IS_END() || ISSPACE(c))
      {
        pushback(c);
        warn_balanced(":", "symbol literal", c);
        lexer.lex_state = EXPR_BEG;
        return $(':');
      }
      switch (c)
      {
        case '\'':
          lexer.lex_strterm = NEW_STRTERM(str_ssym, c, '');
          break;
        case '"':
          lexer.lex_strterm = NEW_STRTERM(str_dsym, c, '');
          break;
        default:
          pushback(c);
          break;
      }
      lexer.lex_state = EXPR_FNAME;
      return tSYMBEG;
    }
    
    case '/':
    {
      if (IS_lex_state(EXPR_BEG_ANY))
      {
        lexer.lex_strterm = NEW_STRTERM(str_regexp, '/', '');
        return tREGEXP_BEG;
      }
      if ((c = nextc()) == '=')
      {
        lexer.yylval = "/"; // $('/');
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      pushback(c);
      if (IS_SPCARG(c))
      {
        arg_ambiguous();
        lexer.lex_strterm = NEW_STRTERM(str_regexp, '/', '');
        return tREGEXP_BEG;
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      warn_balanced("/", "regexp literal", c);
      lexer.yylval = "/";
      return $('/');
    }
    
    case '^':
    {
      if ((c = nextc()) == '=')
      {
        lexer.yylval = "^"; // $('^');
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      pushback(c);
      lexer.yylval = "^";
      return $('^');
    }
    
    case ';':
    {
      lexer.lex_state = EXPR_BEG;
      lexer.command_start = true;
      return $(';');
    }
    
    case ',':
    {
      lexer.lex_state = EXPR_BEG;
      return $(',');
    }
    
    case '~':
    {
      if (IS_AFTER_OPERATOR())
      {
        if ((c = nextc()) != '@')
        {
          pushback(c);
        }
        lexer.lex_state = EXPR_ARG;
      }
      else
      {
        lexer.lex_state = EXPR_BEG;
      }
      lexer.yylval = "~";
      return $('~');
    }
    
    case '(':
    {
      var t = $(c);
      if (IS_BEG())
      {
        t = tLPAREN;
      }
      else if (IS_SPCARG(''))
      {
        t = tLPAREN_ARG;
      }
      lexer.paren_nest++;
      lexer.COND_PUSH(0);
      lexer.CMDARG_PUSH(0);
      lexer.lex_state = EXPR_BEG;
      return t;
    }
    
    case '[':
    {
      var t = $(c);
      lexer.paren_nest++;
      if (IS_AFTER_OPERATOR())
      {
        lexer.lex_state = EXPR_ARG;
        if ((c = nextc()) == ']')
        {
          if ((c = nextc()) == '=')
          {
            return tASET;
          }
          pushback(c);
          return tAREF;
        }
        pushback(c);
        return $('[');
      }
      else if (IS_BEG())
      {
        t = tLBRACK;
      }
      else if (IS_ARG() && lexer.space_seen)
      {
        t = tLBRACK;
      }
      lexer.lex_state = EXPR_BEG;
      lexer.COND_PUSH(0);
      lexer.CMDARG_PUSH(0);
      return t;
    }
    
    case '{':
    {
      var t = $(c);
      ++lexer.brace_nest;
      if (lexer.lpar_beg && lexer.lpar_beg == lexer.paren_nest)
      {
        lexer.lex_state = EXPR_BEG;
        lexer.lpar_beg = 0;
        --lexer.paren_nest;
        lexer.COND_PUSH(0);
        lexer.CMDARG_PUSH(0);
        return tLAMBEG;
      }
      if (IS_ARG() || IS_lex_state(EXPR_END | EXPR_ENDFN))
        t = $('{');                
      else if (IS_lex_state(EXPR_ENDARG))
        t = tLBRACE_ARG;        
      else
        t = tLBRACE;            
      lexer.COND_PUSH(0);
      lexer.CMDARG_PUSH(0);
      lexer.lex_state = EXPR_BEG;
      if (t != tLBRACE)
        lexer.command_start = true;
      return t;
    }
    
    case '\\':
    {
      c = nextc();
      if (c == '\n')
      {
        lexer.space_seen = true;
        // skip \\n
        continue retry; // was: goto retry;
      }
      pushback(c);
      return $('\\');
    }
    
    case '%':
    {
      var term = '';
      var paren = '';
      var goto_quotation = false;
      goto_quotation: for (;;) // a label
      {
        // this label enulating loop expects the $lex_state
        // to be constant within its boudaries
        if (goto_quotation || IS_lex_state(EXPR_BEG_ANY))
        {
          if (!goto_quotation)
            c = nextc();
          goto_quotation = false; // got here, reset the flag
          // was: quotation:
          if (c == '' || !ISALNUM(c))
          {
            term = c;
            c = 'Q';
          }
          else
          {
            term = nextc();
            if (ISALNUM(term) || !ISASCII(term))
            {
              lexer.yyerror("unknown type of %string `"+term+"'");
              return 0;
            }
          }
          if (c == '' || term == '')
          {
            compile_error("unterminated quoted string meets end of file");
            return 0;
          }
          paren = term;
          if (term == '(')
            term = ')';
          else if (term == '[')
            term = ']';
          else if (term == '{')
            term = '}';
          else if (term == '<')
            term = '>';
          else
            paren = '';

          switch (c)
          {
            case 'Q':
              lexer.lex_strterm = NEW_STRTERM(str_dquote, term, paren);
              return tSTRING_BEG;

            case 'q':
              lexer.lex_strterm = NEW_STRTERM(str_squote, term, paren);
              return tSTRING_BEG;

            case 'W':
              lexer.lex_strterm = NEW_STRTERM(str_dword, term, paren);
              do
              {
                c = nextc();
              }
              while (ISSPACE(c));
              pushback(c);
              return tWORDS_BEG;

            case 'w':
              lexer.lex_strterm = NEW_STRTERM(str_sword, term, paren);
              do
              {
                c = nextc();
              }
              while (ISSPACE(c));
              pushback(c);
              return tQWORDS_BEG;

            case 'I':
              lexer.lex_strterm = NEW_STRTERM(str_dword, term, paren);
              do
              {
                c = nextc();
              }
              while (ISSPACE(c));
              pushback(c);
              return tSYMBOLS_BEG;

            case 'i':
              lexer.lex_strterm = NEW_STRTERM(str_sword, term, paren);
              do
              {
                c = nextc();
              }
              while (ISSPACE(c));
              pushback(c);
              return tQSYMBOLS_BEG;

            case 'x':
              lexer.lex_strterm = NEW_STRTERM(str_xquote, term, paren);
              return tXSTRING_BEG;

            case 'r':
              lexer.lex_strterm = NEW_STRTERM(str_regexp, term, paren);
              return tREGEXP_BEG;

            case 's':
              lexer.lex_strterm = NEW_STRTERM(str_ssym, term, paren);
              lexer.lex_state = EXPR_FNAME;
              return tSYMBEG;

            default:
              lexer.yyerror("unknown type of %string");
              return 0;
          }
        }
        if ((c = nextc()) == '=')
        {
          lexer.yylval = "%"; // $('%');
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        if (IS_SPCARG(c))
        {
          goto_quotation = true; // added to skip state check
          continue goto_quotation; // was: goto quotation;
        }
        break; // the goto_quotation for (;;) label-loop
      } // for (;;) goto_quotation
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      pushback(c);
      warn_balanced("%%", "string literal", c);
      lexer.yylval = "%";
      return $('%');
    }
    
    case '$':
    {
      lexer.lex_state = EXPR_END;
      newtok();
      c = nextc();
      switch (c)
      {
        case '_':              
          c = nextc();
          if (parser_is_identchar(c))
          {
            tokadd('$');
            tokadd('_');
            break;
          }
          pushback(c);
          c = '_';
          
        case '~':              
        case '*':              
        case '$':              
        case '?':              
        case '!':              
        case '@':              
        case '/':              
        case '\\':             
        case ';':              
        case ',':              
        case '.':              
        case '=':              
        case ':':              
        case '<':              
        case '>':              
        case '\"':             
          tokadd('$'+c);
          tokfix();
          lexer.yylval = tok(); // ID: intern string
          return tGVAR;

        case '-':
          tokadd('$'+c);
          c = nextc();
          if (parser_is_identchar(c))
          {
            if (tokadd(c) == '')
              return 0;
          }
          else
          {
            pushback(c);
          }
        // was: gvar:
          tokfix();
          lexer.yylval = tok(); // ID, intern string
          return tGVAR;

        case '&':              
        case '`':              
        case '\'':             
        case '+':              
          if (IS_lex_state_for(lexer.last_state, EXPR_FNAME))
          {
            tokadd('$'+c);
            // was: goto gvar;
            tokfix();
            lexer.yylval = tok(); // ID, intern string
            return tGVAR;
          }
          // was: set_yylval_node(NEW_BACK_REF(c)); TODO: check after time
          lexer.yylval = '$'+c; // we create new NODE_BACK_REF in parser
          return tBACK_REF;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          // was: tokadd('$');
          do
          {
            tokadd(c);
            c = nextc();
          }
          while (c != '' && ISDIGIT(c));
          pushback(c);
          if (IS_lex_state_for(lexer.last_state, EXPR_FNAME))
          {
            // was: goto gvar;
            tokfix();
            // was: set_yylval_name(rb_intern(tok())); TODO: check
            lexer.yylval = '$'+tok();
            return tGVAR;
          }
          tokfix();
          // was: set_yylval_node(NEW_NTH_REF(atoi(tok() + 1))); TODO: check
          lexer.yylval = +tok();
          return tNTH_REF;

        default:
          if (!parser_is_identchar(c))
          {
            pushback(c);
            compile_error("`$"+c+"' is not allowed as a global variable name");
            return 0;
          }
        case '0':
          tokadd('$');
      }
      break;
    }
    
    case '@':
    {
      c = nextc();
      newtok();
      tokadd('@');
      if (c == '@')
      {
        tokadd('@');
        c = nextc();
      }
      if (c != '' && ISDIGIT(c) || !parser_is_identchar(c))
      {
        pushback(c);
        if (toklen() == 1)
        {
          compile_error("`@"+c+"' is not allowed as an instance variable name");
        }
        else
        {
          compile_error("`@@"+c+"' is not allowed as a class variable name");
        }
        return 0;
      }
      break;
    }
    
    case '_':
    {
      if (was_bol() && whole_match_p("__END__", false))
      {
        lexer.ruby__end__seen = true;
        lexer.eofp = true;
        return 0; // was: return -1;
      }
      newtok();
      break;
    }
    
    // add before here :)
    
    default:
    {
      if (!parser_is_identchar(c))
      {
        compile_error("Invalid char `"+c+"' in expression");
        continue retry; // was: goto retry;
      }

      newtok();
      break the_giant_switch;
    }
  }
  
  do
  {
    if (tokadd(c) == '')
      return 0;
    c = nextc();
  }
  while (parser_is_identchar(c));
  switch (tok()[0])
  {
    case '@':
    case '$':
      pushback(c);
      break;
    default:
      if ((c == '!' || c == '?') && !peek('='))
      {
        tokadd(c);
      }
      else
      {
        pushback(c);
      }
  }
  tokfix();
  
  {
    var result = 0;
    var is_local_id = true;

    lexer.last_state = lexer.lex_state;
    switch (tok()[0])
    {
      case '$':
        lexer.lex_state = EXPR_END;
        result = tGVAR;
        is_local_id = false;
        break;
      case '@':
        lexer.lex_state = EXPR_END;
        if (tok()[1] == '@')
          result = tCVAR;
        else
          result = tIVAR;
        is_local_id = false;
        break;

      default:
        if (toklast() == '!' || toklast() == '?')
        {
          result = tFID;
        }
        else
        {
          if (IS_lex_state(EXPR_FNAME))
          {
            if ((c = nextc()) == '=' && !peek('~') && !peek('>') &&
                (!peek('=') || (peek_n('>', 1))))
            {
              result = tIDENTIFIER;
              is_local_id = false; // def abc=
              tokadd(c);
              tokfix();
            }
            else
            {
              pushback(c);
            }
          }
          if (result == 0 && ISUPPER(tok()[0]))
          {
            result = tCONSTANT;
            is_local_id = false;
          }
          else
          {
            result = tIDENTIFIER;
          }
        }

        if (IS_LABEL_POSSIBLE())
        {
          if (IS_LABEL_SUFFIX(0))
          {
            lexer.lex_state = EXPR_BEG;
            nextc();
            lexer.yylval = tok();
            is_local_id = false;
            return tLABEL;
          }
        }
        if (!IS_lex_state(EXPR_DOT))
        {
          // const struct kwtable *kw;

          // See if it is a reserved word.
          var kw = ownProperty(rb_reserved_word, tok());
          if (kw)
          {
            var state = lexer.lex_state;
            lexer.lex_state = kw.state;
            if (state == EXPR_FNAME)
            {
              // lexer.yylval = gen.rb_intern(tok()); // was: kw.name
              lexer.yylval = tok(); // was: kw.name
              return kw.id0;
            }
            if (lexer.lex_state == EXPR_BEG)
            {
              lexer.command_start = true;
            }
            if (kw.id0 == keyword_do)
            {
              if (lexer.lpar_beg && lexer.lpar_beg == lexer.paren_nest)
              {
                lexer.lpar_beg = 0;
                --lexer.paren_nest;
                return keyword_do_LAMBDA;
              }
              if (lexer.COND_P())
                return keyword_do_cond;
              if (lexer.CMDARG_P() && state != EXPR_CMDARG)
                return keyword_do_block;
              if (state & (EXPR_BEG | EXPR_ENDARG))
                return keyword_do_block;
              return keyword_do;
            }
            if (state & (EXPR_BEG | EXPR_VALUE))
              return kw.id0;
            else
            {
              // packed `id1`
              if (kw.id1) // was: kw.id0 != kw.id1
              {
                lexer.lex_state = EXPR_BEG;
                return kw.id1;
              }
              return kw.id0;
            }
          }
        }

        if (IS_lex_state(EXPR_BEG_ANY | EXPR_ARG_ANY | EXPR_DOT))
        {
          if (lexer.cmd_state)
          {
            lexer.lex_state = EXPR_CMDARG;
          }
          else
          {
            lexer.lex_state = EXPR_ARG;
          }
        }
        else if (lexer.lex_state == EXPR_FNAME)
        {
          lexer.lex_state = EXPR_ENDFN;
        }
        else
        {
          lexer.lex_state = EXPR_END;
        }
    }
    {
      var ident = tok();
      lexer.yylval = ident;
      // `is_local_id` is in place of `gen.is_local_id(ident)`,
      // and AKAICT, `gen.is_local_id` repeats the thing done by lexer
      if (!IS_lex_state_for(lexer.last_state, EXPR_DOT | EXPR_FNAME) &&
          is_local_id && $scope.is_declared(ident))
      {
        lexer.lex_state = EXPR_END;
      }
    }
    return result;
  }
  
  } // retry for loop
}

function heredoc_identifier ()
{
  var term = '', func = 0;
  
  var c = nextc()
  if (c == '-')
  {
    c = nextc();
    func = STR_FUNC_INDENT;
  }
  defaultt:
  {
    quoted:
    {
      switch (c)
      {
        case '\'':
          func |= str_squote;
          break; // was: goto quoted;
        case '"':
          func |= str_dquote;
          break; // was: goto quoted;
        case '`':
          func |= str_xquote;
          break; // was: goto quoted;
        default:
          break quoted
      }
      // was: quoted:
      newtok();
      // tokadd($$(func)); add it to the `strterm` property
      term = c;
      while ((c = nextc()) != '' && c != term)
      {
        if (tokadd(c) == '')
          return 0;
      }
      if (c == '')
      {
        compile_error("unterminated here document identifier");
        return 0;
      }
      break defaultt;
    } // quoted:

    // was: default:
    if (!parser_is_identchar(c))
    {
      pushback(c);
      if (func & STR_FUNC_INDENT)
      {
        pushback('-');
      }
      return 0;
    }
    // TODO: create token with $text.substring(start, end)
    newtok();
    term = '"';
    func |= str_dquote;
    do
    {
      if (tokadd(c) == '')
        return 0;
    }
    while ((c = nextc()) != '' && parser_is_identchar(c));
    pushback(c);
  } // defaultt:

  tokfix();
  lexer.lex_strterm = NEW_HEREDOCTERM(func, tok());
  lex_goto_eol();
  return term == '`' ? tXSTRING_BEG : tSTRING_BEG;
}

function here_document_error (eos)
{
  // was: error:
    compile_error("can't find string \""+eos+"\" anywhere before EOF");
    return here_document_restore(eos);
}
function here_document_restore (eos)
{
  // was: restore:
    heredoc_restore(lexer.lex_strterm);
    lexer.lex_strterm = null;
    return 0;
}
function here_document (here)
{
  // we're at the heredoc content start
  var func = here.func,
      eos = here.term,
      indent = !!(func & STR_FUNC_INDENT);
  
  var str = ''; // accumulate string content here
  
  var c = nextc();
  if (c == '')
  {
    here_document_error(eos);
    return 0;
  }
  
  if (was_bol() && whole_match_p(eos, indent))
  {
    heredoc_restore(lexer.lex_strterm);
    return tSTRING_END;
  }
  
  // do not look for `#{}` stuff here
  if (!(func & STR_FUNC_EXPAND))
  {
    // mark a start of the string token
    do
    {
      str += $lex_lastline;
      
      // EOF reached in the middle of the heredoc
      lex_goto_eol();
      if (nextc() === '')
      {
        here_document_error(eos); // was: goto error;
        return 0;
      }
    }
    while (!whole_match_p(eos, indent));
  }
  // try to find all the `#{}` stuff here
  else
  {
    
    newtok();
    if (c == '#')
    {
      var t = parser_peek_variable_name();
      if (t)
        return t;
      tokadd('#');
      c = nextc();
    }
    do
    {
      pushback(c);
      if ((c = tokadd_string(func, '\n', '', null)) == '')
      {
        if (lexer.eofp)
        {
          here_document_error(eos); // was: goto error;
          return 0;
        }
        here_document_restore(); // was: goto restore;
        return 0;
      }
      if (c != '\n')
      {
        // was: set_yylval_str(STR_NEW3(tok(), toklen(), enc, func));
        lexer.yylval = tok()
        return tSTRING_CONTENT;
      }
      tokadd(nextc());
      
      if ((c = nextc()) == '')
      {
        here_document_error(eos); // was: goto error;
        return 0;
      }
    }
    while (!whole_match_p(eos, indent));
    str = tok();
  }
  heredoc_restore(lexer.lex_strterm);
  lexer.lex_strterm = NEW_STRTERM(-1, '', '');
  // was: set_yylval_str(str); TODO:
  lexer.yylval = str;
  return tSTRING_CONTENT;
}

function parse_string (quote)
{
  var func = quote.func,
      term = quote.term,
      paren = quote.paren;
  
  var space = false;

  if (func == -1)
    return tSTRING_END;
  var c = nextc();
  if ((func & STR_FUNC_QWORDS) && ISSPACE(c))
  {
    do
    {
      c = nextc();
    }
    while (ISSPACE(c));
    space = true;
  }
  // quote.nested is increased in tokadd_string()
  // once for every `paren` char met
  if (c == term && !quote.nested)
  {
    if (func & STR_FUNC_QWORDS)
    {
      quote.func = -1;
      return $(' ');
    }
    if (!(func & STR_FUNC_REGEXP))
      return tSTRING_END;
    lexer.yylval = regx_options();
    return tREGEXP_END;
  }
  if (space)
  {
    pushback(c);
    return $(' ');
  }
  newtok();
  if ((func & STR_FUNC_EXPAND) && c == '#')
  {
    var t = parser_peek_variable_name();
    if (t)
      return t;
    tokadd('#');
    c = nextc();
  }
  pushback(c);
  if (tokadd_string(func, term, paren, quote) == '')
  {
    lexer.ruby_sourceline = quote.ruby_sourceline;
    if (func & STR_FUNC_REGEXP)
    {
      if (lexer.eofp)
        compile_error("unterminated regexp meets end of file");
      return tREGEXP_END;
    }
    else
    {
      if (lexer.eofp)
        compile_error("unterminated string meets end of file");
      return tSTRING_END;
    }
  }

  tokfix();
  // was: set_yylval_str(STR_NEW3(tok(), toklen(), enc, func));
  lexer.yylval = tok();

  return tSTRING_CONTENT;
}


function tokadd_string (func, term, paren, str_term)
{
  var c = '';
  while ((c = nextc()) != '')
  {
    if (paren && c == paren)
    {
      ++str_term.nested;
    }
    else if (c == term)
    {
      if (!str_term || !str_term.nested)
      {
        pushback(c);
        break;
      }
      --str_term.nested;
    }
    else if ((func & STR_FUNC_EXPAND) && c == '#' && $lex_p < $lex_pend)
    {
      var c2 = lex_pv();
      if (c2 == '$' || c2 == '@' || c2 == '{')
      {
        // push the '#' back
        pushback(c);
        // and leave it for the caller to process
        break;
      }
    }
    else if (c == '\\')
    {
      c = nextc();
      switch (c)
      {
        case '\n':
          if (func & STR_FUNC_QWORDS)
            break;
          if (func & STR_FUNC_EXPAND)
            continue;
          tokadd('\\');
          break;

        case '\\':
          if (func & STR_FUNC_ESCAPE)
            tokadd(c);
          break;

        case 'u':
          if ((func & STR_FUNC_EXPAND) == 0)
          {
            tokadd('\\');
            break;
          }
          parser_tokadd_utf8(true, !!(func & STR_FUNC_SYMBOL), !!(func & STR_FUNC_REGEXP));
          continue;

        default:
          if (c == '')
            return '';
          if (!ISASCII(c))
          {
            if ((func & STR_FUNC_EXPAND) == 0)
              tokadd('\\');
            // was: goto non_ascii;
            if (tokadd(c) == '')
              return '';
            continue;
          }
          if (func & STR_FUNC_REGEXP)
          {
            if (c == term && !simple_re_meta(c))
            {
              tokadd(c);
              continue;
            }
            pushback(c);
            if (!tokadd_escape()) // useless `c = ` was here
              return '';
            continue;
          }
          else if (func & STR_FUNC_EXPAND)
          {
            pushback(c);
            if (func & STR_FUNC_ESCAPE)
              tokadd('\\');
            c = read_escape(0);
          }
          else if ((func & STR_FUNC_QWORDS) && ISSPACE(c))
          {
            
          }
          else if (c != term && !(paren && c == paren))
          {
            tokadd('\\');
            pushback(c);
            continue;
          }
      }
    }
    else if ((func & STR_FUNC_QWORDS) && ISSPACE(c))
    {
      pushback(c);
      break;
    }
    tokadd(c);
  }
  return c;
}

function regx_options ()
{
  var options = match_grex(/[a-zA-Z]+|/g)[0];
  $lex_p += options.length;
  return options;
}

function simple_re_meta (c)
{
  switch (c)
  {
    case '$': case '*': case '+': case '.':
    case '?': case '^': case '|':
    case ')': case ']': case '}': case '>':
      return true;
    default:
      return false;
  }
}


function tokadd_escape_eof ()
{
  lexer.yyerror("Invalid escape character syntax");
}
// return `true` on success and `false` on failure,
// it is quite different from original source,
// however the returning value is a flag only there too;
function tokadd_escape ()
{
  var c = '';
  var flags = 0;

  switch (c = nextc())
  {
    case '\n':
      return true;                 

    case '0':
    case '1':
    case '2':
    case '3':                  
    case '4':
    case '5':
    case '6':
    case '7':
    {
      // was: scan_oct(lex_p, 3, &numlen);
      
      // we're here: "\|012",
      // so just match one or two more digits
      var oct = match_grex(/[0-7]{1,2}|/g);
      if (!oct)
      {
        // was: goto eof;
        tokadd_escape_eof();
        return false;
      }
      $lex_p += oct.length;
      tokadd('\\' + c + oct);
    }
    return true;

    case 'x':                  
      {
        // was: tok_hex(&numlen);
        
        // we're here: "\x|AB",
        // so just match one or two more digits
        var hex = match_grex(/[0-9a-fA-F]{1,2}|/g);
        if (!hex)
        {
          yyerror("invalid hex escape");
          return false;
        }
        $lex_p += hex.length;
        tokadd('\\x' + hex);
      }
      return true;
    
    case '':
      tokadd_escape_eof();
      return false;
    
    case 'c':
      tokadd("\\c");
      return true;
    
    case 'M':
    case 'C':
      lexer.yyerror("JavaScript doesn't support `\\"+c+"-' in regexp");
      if ((c = nextc()) != '-')
      {
        pushback(c);
        tokadd_escape_eof();
        return false;
      }
      tokcopy(3); // add though
      return true;
    
    default:
      tokadd("\\"+c);
  }
  return true;
}

// checks if the current line matches `/^\s*#{eos}\n?$/`;
var whole_match_p_rexcache = {};
function whole_match_p (eos, indent)
{
  if (!indent)
  {
    return $lex_lastline == eos + '\n' || $lex_lastline == eos;
  }
  
  // here there are all with indentation enabled!
  var rex = whole_match_p_rexcache[eos];
  if (!rex)
  {
    // `eos` is an identifier and doesn't need to be escaped
    rex = new RegExp('^[ \\t]*' + eos + '$', 'm');
    whole_match_p_rexcache[eos] = rex;
  }
  
  return rex.test($lex_lastline);
}

function heredoc_restore (here)
{
  // restores the line from where the heredoc occured to begin
  $lex_lastline = here.lex_lastline;
  $lex_pbeg = 0;
  $lex_pend = $lex_lastline.length;
  // restores the position in the line, right after heredoc token
  $lex_p = here.lex_p;
  // have no ideas yet :)
  lexer.heredoc_end = lexer.ruby_sourceline;
  lexer.ruby_sourceline = here.ruby_sourceline;
}

var ESCAPE_CONTROL = 1,
    ESCAPE_META = 2;

function read_escape_eof ()
{
  lexer.yyerror("Invalid escape character syntax");
  return '\0';
}
function read_escape (flags)
{
  var c = nextc();
  switch (c)
  {
    case '\\':                 
      return c;

    case 'n':                  
      return '\n';

    case 't':                  
      return '\t';

    case 'r':                  
      return '\r';

    case 'f':                  
      return '\f';

    case 'v':                  
      return '\v'; // \13

    case 'a':                  
      return '\a'; // \007

    case 'e':                  
      return '\x1b'; // 033

    case '0':
    case '1':
    case '2':
    case '3':                  
    case '4':
    case '5':
    case '6':
    case '7':
      pushback(c);
      // was: c = scan_oct(lex_p, 3, &numlen);
      var oct = match_grex(/[0-7]{1,3}|/g)[0];
      c = $$(parseInt(oct, 8));
      $lex_p += oct.length;
      return c;

    case 'x':                  
      // was: c = tok_hex(&numlen);
      var hex = match_grex(/[0-9a-fA-F]{1,2}|/g)[0];
      if (!hex)
      {
        lexer.yyerror("invalid hex escape");
        return '';
      }
      $lex_p += hex.length;
      c = $$(parseInt(hex, 16));
      return c;

    case 'b':                  
      return '\x08'; // \010

    case 's':                  
      return ' ';

    case 'M':
      if (flags & ESCAPE_META)
      {
        // was: goto eof;
        return read_escape_eof();
      }
      if ((c = nextc()) != '-')
      {
        pushback(c);
        // was: goto eof;
        return read_escape_eof();
      }
      if ((c = nextc()) == '\\')
      {
        if (peek('u'))
        {
          // was: goto eof;
          return read_escape_eof();
        }
        return $$($(read_escape(flags | ESCAPE_META)) | 0x80);
      }
      else if (c == '' || !ISASCII(c))
      {
        // was: goto eof;
        return read_escape_eof();
      }
      else
      {
        return $$(($(c) & 0xff) | 0x80);
      }

    case 'C':
      if ((c = nextc()) != '-')
      {
        pushback(c);
        // was: goto eof;
        return read_escape_eof();
      }
    case 'c':
      if (flags & ESCAPE_CONTROL)
      {
        // was: goto eof;
        return read_escape_eof();
      }
      if ((c = nextc()) == '\\')
      {
        if (peek('u'))
        {
          // was: goto eof;
          return read_escape_eof();
        }
        c = read_escape(flags | ESCAPE_CONTROL);
      }
      else if (c == '?')
        return '\x7f'; // 0177;
      else if (c == '' || !ISASCII(c))
      {
        // was: goto eof;
        return read_escape_eof();
      }
      return $$($(c) & 0x9f);

    // was: eof:
    case -1:
      return read_escape_eof();

    default:
      return c;
  }
}


function parser_tokadd_utf8 (string_literal, symbol_literal, regexp_literal)
{
  






  if (regexp_literal)
  {
    tokadd('\\u');
  }
  
  var c = nextc();
  // handle \u{...} form
  if (c === '{')
  {
    if (regexp_literal)
    {
      tokadd('{'); // was: tokadd(*lex_p);
    }
    for (;;)
    {
      // match hex digits or empty string
      var hex = match_grex(/[0-9a-fA-F]{1,6}|/g)[0];
      if (hex == '')
      {
        lexer.yyerror("invalid Unicode escape");
        return '';
      }
      var codepoint = parseInt(hex, 16);
      var the_char = $$(codepoint);
      if (codepoint > 0x10ffff)
      {
        lexer.yyerror("invalid Unicode codepoint "+codepoint+" (too large)");
        return '';
      }
      
      $lex_p += hex.length;
      if (regexp_literal)
      {
        tokadd(hex);
      }
      else if (string_literal)
      {
        tokadd(the_char);
      }
      
      c = nextc();
      if (!string_literal)
        break;
      if (c !== ' ' && c !== '\t')
        break;
    }

    if (c !== '}')
    {
      lexer.yyerror("unterminated Unicode escape");
      return '';
    }

    if (regexp_literal)
    {
      tokadd('}');
    }
    
    // return the last found codepoint/char
    return the_char;
  }
  // handle \uxxxx form
  else
  {
    // match 4 hex digits or empty string
    var hex = match_grex(/[0-9a-fA-F]{4}|/g)[0];
    if (hex === '')
    {
      lexer.yyerror("invalid Unicode escape");
      return '';
    }
    var codepoint = parseInt(hex, 16);
    var the_char = $$(codepoint);
    $lex_p += 4;
    if (regexp_literal)
    {
      tokadd(hex);
    }
    else if (string_literal)
    {
      tokadd(the_char);
    }
    
    // return the only found codepoint/char
    return the_char;
  }
}

// here `c` matches [0-9],
// `c` is the first char of the future number,
// as of Ruby 2.0 we don't expect to be called from leading '-' match
function start_num (c)
{
  var is_float = false,
      seen_point = false,
      seen_e = false,
      nondigit = '';

  lexer.lex_state = EXPR_END;
  newtok();
  if (c == '-' || c == '+')
  {
    tokadd(c);
    c = nextc();
  }
  
  goto_trailing_uc: {
  goto_decode_num: {
  goto_invalid_octal: {
  
  if (c == '0')
  {
    var start = toklen();
    c = nextc();
    if (c == 'x' || c == 'X')
    {
      
      c = nextc();
      if (c != '' && ISXDIGIT(c))
      {
        do
        {
          if (c == '_')
          {
            if (nondigit)
              break;
            nondigit = c;
            continue;
          }
          if (!ISXDIGIT(c))
            break;
          nondigit = '';
          tokadd(c);
        }
        while ((c = nextc()) != '');
      }
      pushback(c);
      tokfix();
      if (toklen() == start)
      {
        lexer.yyerror("numeric literal without digits");
        return 0;
      }
      else if (nondigit)
        break goto_trailing_uc; // was: goto trailing_uc;
      lexer.yylval = parseInt(tok(), 1);
      return tINTEGER;
    }
    if (c == 'b' || c == 'B')
    {
      
      c = nextc();
      if (c == '0' || c == '1')
      {
        do
        {
          if (c == '_')
          {
            if (nondigit)
              break;
            nondigit = c;
            continue;
          }
          if (c != '0' && c != '1')
            break;
          nondigit = '';
          tokadd(c);
        }
        while ((c = nextc()) != '');
      }
      pushback(c);
      tokfix();
      if (toklen() == start)
      {
        lexer.yyerror("numeric literal without digits");
        return 0;
      }
      else if (nondigit)
        break goto_trailing_uc; // was: goto trailing_uc;
      lexer.yylval = parseInt(tok(), 2);
      return tINTEGER;
    }
    if (c == 'd' || c == 'D')
    {
      
      c = nextc();
      if (c != '' && ISDIGIT(c))
      {
        do
        {
          if (c == '_')
          {
            if (nondigit)
              break;
            nondigit = c;
            continue;
          }
          if (!ISDIGIT(c))
            break;
          nondigit = '';
          tokadd(c);
        }
        while ((c = nextc()) != '');
      }
      pushback(c);
      tokfix();
      if (toklen() == start)
      {
        lexer.yyerror("numeric literal without digits");
        return 0;
      }
      else if (nondigit)
        break goto_trailing_uc; // was: goto trailing_uc;
      lexer.yylval = parseInt(tok(), 10)
      return tINTEGER;
    }
    // was: if (c == '_')
    // was: {
    // was:   
    // was:   goto octal_number;
    // was: }
    // and moved after the next if block
    if (c == 'o' || c == 'O')
    {
      
      c = nextc();
      if (c == '' || c == '_' || !ISDIGIT(c))
      {
        lexer.yyerror("numeric literal without digits");
        return 0;
      }
    }
    if ((c >= '0' && c <= '7') || c == '_')
    {
      
      // was:  octal_number:
      do
      {
        if (c == '_')
        {
          if (nondigit)
            break;
          nondigit = c;
          continue;
        }
        if (c < '0' || c > '9')
          break;
        if (c > '7')
        {
          lexer.yyerror("Invalid octal digit");
          break goto_invalid_octal; // was: goto invalid_octal;
        }
        nondigit = '';
        tokadd(c);
      }
      while ((c = nextc()) != '');
      if (toklen() > start)
      {
        pushback(c);
        tokfix();
        if (nondigit)
          break goto_trailing_uc; // was: goto trailing_uc;
        lexer.yylval = parseInt(tok(), 8);
        return tINTEGER;
      }
      if (nondigit)
      {
        pushback(c);
        break goto_trailing_uc; // was: goto trailing_uc;
      }
    }
    if (c > '7' && c <= '9')
    {
      // was: invalid_octal:
      lexer.yyerror("Invalid octal digit");
    }
    else if (c == '.' || c == 'e' || c == 'E')
    {
      tokadd('0');
    }
    else
    {
      pushback(c);
      // was: set_yylval_literal(INT2FIX(0));
      lexer.yylval = 0;
      return tINTEGER;
    }
  } // c == '0'

  } // goto_invalid_octal

  for (;;)
  {
    switch (c)
    {
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        nondigit = '';
        tokadd(c);
        break;

      case '.':
        if (nondigit)
          break goto_trailing_uc; // was: goto trailing_uc;
        if (seen_point || seen_e)
        {
          break goto_decode_num; // was: goto decode_num;
        }
        else
        {
          var c0 = nextc();
          if (c0 == '' || !ISDIGIT(c0))
          {
            pushback(c0);
            break goto_decode_num; // was: goto decode_num;
          }
          c = c0;
        }
        tokadd('.');
        tokadd(c);
        is_float = true;
        seen_point = true;
        nondigit = '';
        break;

      case 'e':
      case 'E':
        if (nondigit)
        {
          pushback(c);
          c = nondigit;
          break goto_decode_num; // was: goto decode_num;
        }
        if (seen_e)
        {
          break goto_decode_num; // was: goto decode_num;
        }
        tokadd(c);
        seen_e = true;
        is_float = true;
        nondigit = c;
        c = nextc();
        if (c != '-' && c != '+')
          continue;
        tokadd(c);
        nondigit = c;
        break;

      case '_':          
        if (nondigit)
          break goto_decode_num; // was: goto decode_num;
        nondigit = c;
        break;

      default:
        break goto_decode_num; // was: goto decode_num;
    }
    c = nextc();
  } // decimal for

  } // goto_decode_num
  
  // was: decode_num:
  pushback(c);
  
  } // goto_trailing_uc:
  
  if (nondigit) // always true after `break goto_trailing_uc;`
  {
    // was: trailing_uc:
    lexer.yyerror("trailing `"+nondigit+"' in number");
  }
  tokfix();
  if (is_float)
  {
    var d = parseFloat(tok());
    // if (errno == ERANGE)
    // {
    //   rb_warningS("Float %s out of range", tok()); TODO
    //   errno = 0;
    // }
    lexer.yylval = d;
    return tFLOAT;
  }
  lexer.yylval = parseInt(tok(), 10);
  return tINTEGER;

  // why are we so certain about returning `tFLOAT` or `tINTEGER`?
  // because we have got here meating a digit :)
}

var ruby_global_name_punct_bits =
{
  '~': true, '*': true, '$':  true, '?':  true,
  '!': true, '@': true, '/':  true, '\\': true,
  ';': true, ',': true, '.':  true, '=':  true,
  ':': true, '<': true, '>':  true, '\"': true,
  '&': true, '`': true, '\'': true, '+':  true,
  '0': true
};

function is_global_name_punct (c)
{
  if (c <= ' ' ||  '~' < c)
    return false;
  return ruby_global_name_punct_bits[c];
}


function parser_peek_variable_name ()
{
  var p = $lex_p;

  if (p + 1 >= $lex_pend)
    return 0;
  var c = p_pv(p++);
  switch (c)
  {
    case '$':
      if ((c = p_pv(p)) == '-')
      {
        if (++p >= $lex_pend)
          return 0;
        c = p_pv(p);
      }
      else if (is_global_name_punct(c) || ISDIGIT(c))
      {
        return tSTRING_DVAR;
      }
      break;
    case '@':
      if ((c = p_pv(p)) == '@')
      {
        if (++p >= $lex_pend)
          return 0;
        c = p_pv(p);
      }
      break;
    case '{':
      $lex_p = p;
      lexer.command_start = true;
      return tSTRING_DBEG;
    default:
      return 0;
  }

  if (!ISASCII(c) || c == '_' || ISALPHA(c))
    return tSTRING_DVAR;
  return 0;
}



// struct kwtable {const char *name; int id[2]; enum lex_state_e state;};
var rb_reserved_word = lexer.rb_reserved_word =
{
'__ENCODING__': {id0: keyword__ENCODING__, state: EXPR_END},
'__LINE__': {id0: keyword__LINE__, state: EXPR_END},
'__FILE__': {id0: keyword__FILE__, state: EXPR_END},
'BEGIN': {id0: keyword_BEGIN, state: EXPR_END},
'END': {id0: keyword_END, state: EXPR_END},
'alias': {id0: keyword_alias, state: EXPR_FNAME},
'and': {id0: keyword_and, state: EXPR_VALUE},
'begin': {id0: keyword_begin, state: EXPR_BEG},
'break': {id0: keyword_break, state: EXPR_MID},
'case': {id0: keyword_case, state: EXPR_VALUE},
'class': {id0: keyword_class, state: EXPR_CLASS},
'def': {id0: keyword_def, state: EXPR_FNAME},
'defined?': {id0: keyword_defined, state: EXPR_ARG},
'do': {id0: keyword_do, state: EXPR_BEG},
'else': {id0: keyword_else, state: EXPR_BEG},
'elsif': {id0: keyword_elsif, state: EXPR_VALUE},
'end': {id0: keyword_end, state: EXPR_END},
'ensure': {id0: keyword_ensure, state: EXPR_BEG},
'false': {id0: keyword_false, state: EXPR_END},
'for': {id0: keyword_for, state: EXPR_VALUE},
'if': {id0: keyword_if, id1: modifier_if, state: EXPR_VALUE},
'in': {id0: keyword_in, state: EXPR_VALUE},
'module': {id0: keyword_module, state: EXPR_VALUE},
'next': {id0: keyword_next, state: EXPR_MID},
'nil': {id0: keyword_nil, state: EXPR_END},
'not': {id0: keyword_not, state: EXPR_ARG},
'or': {id0: keyword_or, state: EXPR_VALUE},
'redo': {id0: keyword_redo, state: EXPR_END},
'rescue': {id0: keyword_rescue, id1: modifier_rescue, state: EXPR_MID},
'retry': {id0: keyword_retry, state: EXPR_END},
'return': {id0: keyword_return, state: EXPR_MID},
'self': {id0: keyword_self, state: EXPR_END},
'super': {id0: keyword_super, state: EXPR_ARG},
'then': {id0: keyword_then, state: EXPR_BEG},
'true': {id0: keyword_true, state: EXPR_END},
'undef': {id0: keyword_undef, state: EXPR_FNAME},
'unless': {id0: keyword_unless, id1: modifier_unless, state: EXPR_VALUE},
'until': {id0: keyword_until, id1: modifier_until, state: EXPR_VALUE},
'when': {id0: keyword_when, state: EXPR_VALUE},
'while': {id0: keyword_while, id1: modifier_while, state: EXPR_VALUE},
'yield': {id0: keyword_yield, state: EXPR_ARG}
};

lexer.print = null // to be defined in RubyParser constructor

function scream (msg, lineno, filename)
{
  lexer.print
  (
    (filename || lexer.filename) +
    ':' +
    (lineno || lexer.ruby_sourceline) +
    ': ' +
    msg + '\n'
  );
}

function warn (msg, lineno, filename)
{
  scream('warning: ' + msg, lineno, filename);
}
lexer.warn = warn;

function compile_error (msg)
{
  lexer.nerr++;

  scream(msg);
}
lexer.compile_error = compile_error

lexer.yyerror = function yyerror (msg)
{
  compile_error(msg);

  // to clean up \n \t and others
  var line = lexer.get_lex_lastline();
  var begin = line.substring(0, $lex_p)
                  .replace(/[\n\r]+/g, '')
                  .replace(/\s+/g, ' ');
  var end =   line.substring($lex_p)
                  .replace(/[\n\r]+/g, '')
                  .replace(/\s+/g, ' ');
  var arrow = [];
  arrow[begin.length] = '^';
  lexer.print(begin + end + '\n');
  lexer.print(arrow.join(' ') + '\n');
}

} // function Lexer

function Location (beg, end)
{
  this.beg = beg;
  this.end = end;
}
Location.prototype.inspect = function ()
{
  var beg = (this.beg >> 10) + ':' + (this.beg & 0x3ff);
  var end = (this.end >> 10) + ':' + (this.end & 0x3ff);
  return '{' + beg + '-' + end + '}'
}
















// Instantiates the Bison-generated parser.
// `lexer` is the scanner that will supply tokens to the parser.
function YYParser ()
{
  // self
  var parser = this;
  
  var lexer = null;
  parser.setLexer = function (l) { lexer = l; }
  
  var actionsTable;
  parser.setActions = function (actions) { actionsTable = actions.table; }
  
  // True if verbose error messages are enabled.
  this.errorVerbose = true;


  

  // Token returned by the scanner to signal the end of its input.
  var EOF = 0;

  // Returned by a Bison action in order to stop the parsing process
  // and return success (<tt>true</tt>).
  var YYACCEPT = 0;

  // Returned by a Bison action in order to stop the parsing process
  // and return failure (<tt>false</tt>).  */
  var YYABORT = 1;

  // Returned by a Bison action in order to start error recovery
  // without printing an error message.
  var YYERROR = 2;

  // Internal return codes that are not supported for user semantic
  // actions.
  var YYERRLAB = 3;
  var YYNEWSTATE = 4;
  var YYDEFAULT = 5;
  var YYREDUCE = 6;
  var YYERRLAB1 = 7;
  var YYRETURN = 8;

  var yyntokens_ = this.yyntokens_ = 142;
  
  var yyerrstatus_ = 0;
  parser.yyerrok = function yyerrok () { yyerrstatus_ = 0; }
  
  // Return whether error recovery is being done.
  // In this state, the parser reads token until it reaches a known state,
  // and then restarts normal operation.
  this.isRecovering = function isRecovering ()
  {
    return yyerrstatus_ == 0;
  }

  // Share with `action()`
  var yystack, yyvs;

  






  this.parse = function parse ()
  {
    // Lookahead and lookahead in internal form.
    var yychar = yyempty_;
    var yytoken = 0;

    
    var yyn = 0;
    var yylen = 0;
    var yystate = 0;

    // the only place yystack value is changed
    yystack = this.yystack = new YYParser.Stack();
    yyvs = yystack.valueStack;

    
    var yynerrs_ = 0;

    // Semantic value of the lookahead.
    var yylval = undefined;

    ;
    yyerrstatus_ = 0;


    // Initialize the stack.
    yystack.push(yystate, yylval);

    // have tried: recursive closures, breaking blocks - switch is faster,
    // next step: asm.js for the whole `parse()` function
    var label = YYNEWSTATE;
    goto_loop: for (;;)
    switch (label)
    {
      //----------------.
      // New state.     |
      //---------------/
      case YYNEWSTATE:
        // Unlike in the C/C++ skeletons, the state is already pushed when we come here.

        ;

        // Accept?
        if (yystate == yyfinal_)
          return true;

        // Take a decision.
        // First try without lookahead.
        yyn = yypact_[yystate];
        if (yyn == yypact_ninf_) // yyn pact value is default
        {
          // goto
          label = YYDEFAULT;
          continue goto_loop;
        }

        // Read a lookahead token.
        if (yychar == yyempty_)
        {
          ;
          yychar = lexer.yylex();
          yylval = lexer.yylval;
        }


        // Convert token to internal form.
        if (yychar <= EOF)
        {
          yychar = yytoken = EOF;
          ;
        }
        else
        {
          if (yychar >= 0 && yychar <= yyuser_token_number_max_)
            yytoken = yytranslate_table_[yychar];
          else
            yytoken = yyundef_token_;

          ;
        }

        // If the proper action on seeing token YYTOKEN
        // is to reduce or to detect an error, take that action.
        yyn += yytoken;
        if (yyn < 0 || yylast_ < yyn || yycheck_[yyn] != yytoken)
        {
          // goto
          label = YYDEFAULT;
          continue goto_loop;
        }
        // <= 0 means reduce or error.
        else if ((yyn = yytable_[yyn]) <= 0)
        {
          if (yyn == yytable_ninf_) // yyn's value is an error
          {
            // goto
            label = YYERRLAB;
            continue goto_loop;
          }
          else
          {
            yyn = -yyn;

            // goto
            label = YYREDUCE;
            continue goto_loop;
          }
        }

        else
        {
          // Shift the lookahead token.
          ;

          // Discard the token being shifted.
          yychar = yyempty_;

          // Count tokens shifted since error;
          // after three, turn off error status.
          if (yyerrstatus_ > 0)
            --yyerrstatus_;

          yystate = yyn;
          yystack.push(yystate, yylval);

          //goto
          label = YYNEWSTATE;
          continue goto_loop;
        }

        // won't reach here
        return false;

      //-----------------------------------------------------------.
      // yydefault -- do the default action for the current state. |
      //----------------------------------------------------------/
      case YYDEFAULT:
        yyn = yydefact_[yystate];
        if (yyn == 0)
        {
          // goto
          label = YYERRLAB;
          continue goto_loop;
        }
        else
        {
          // goto
          label = YYREDUCE;
          continue goto_loop;
        }

      // won't reach here
      return false;

      //------------------------------------.
      //  yyreduce -- Do a reduction.       |
      //-----------------------------------/
      case YYREDUCE:
        yylen = yyr2_[yyn];
        yyaction(yyn, yylen);
        yystate = yystack.stateAt(0);
        // goto
        label = YYNEWSTATE;
        continue goto_loop;

      //-------------------------------------.
      // yyerrlab -- here on detecting error |
      //------------------------------------/
      case YYERRLAB:
        // If not already recovering from an error, report this error.
        if (yyerrstatus_ == 0)
        {
          ++yynerrs_;
          if (yychar == yyempty_)
            yytoken = yyempty_;
          lexer.yyerror(this.yysyntax_error(yystate, yytoken));
        }

        if (yyerrstatus_ == 3)
        {
          // If just tried and failed to reuse lookahead token
          // after an error, discard it.

          if (yychar <= EOF)
          {
            // Return failure if at end of input.
            if (yychar == EOF)
              return false;
          }
          else
          {
            // ;
            yychar = yyempty_;
          }
        }

        // Else will try to reuse lookahead token
        // after shifting the error token.

        // goto
        label = YYERRLAB1;
        continue goto_loop;

      //--------------------------------------------------.
      // errorlab -- error raised explicitly by YYERROR.  |
      //-------------------------------------------------/
      case YYERROR:

        // Do not reclaim the symbols of the rule
        // which action triggered this YYERROR.
        yystack.pop(yylen);
        yylen = 0;
        ;
        yystate = yystack.stateAt(0);
        // goto
        label = YYERRLAB1;
        continue goto_loop;

      //--------------------------------------------------------------.
      // yyerrlab1 -- common code for both syntax error and YYERROR.  |
      //-------------------------------------------------------------/
      case YYERRLAB1:
        yyerrstatus_ = 3; // Each real token shifted decrements this.

        for (;;)
        {
          yyn = yypact_[yystate];
          if (yyn != yypact_ninf_) // yyn pact value isn't default
          {
            yyn += yyterror_;
            if (0 <= yyn && yyn <= yylast_ && yycheck_[yyn] == yyterror_)
            {
              yyn = yytable_[yyn];
              if (0 < yyn)
                break;
            }
          }

          // Pop the current state because it cannot handle the error token.
          if (yystack.height() == 0)
          {
            label = YYABORT;
            continue goto_loop;
          }

          ;
          yystack.pop(1);
          yystate = yystack.stateAt(0);
          ;
        }


        // Shift the error token.
        ;

        yystate = yyn;
        yystack.push(yyn, yylval);
        // goto
        label = YYNEWSTATE;
        continue goto_loop;

      //--------------------------.
      // Accept.                  |
      //-------------------------/
      case YYACCEPT:
        return true;

      //----------------------.
      // Abort.               |
      //---------------------/
      case YYABORT:
        // ;
        // yystack.pop(1);
        // yystate = yystack.stateAt(0);
        // ;
        return false;

      default:
        // won't reach here
        return false;
    } // for (;;) and switch (label)

    // won't reach here
    return false
  }

  function yyaction (yyn, yylen)
  {
    





    // var yyval; moved up in scope chain to share with actions
    // if (yylen > 0)
    //   yyval = yystack.valueAt(yylen - 1);
    // else
    //   yyval = yystack.valueAt(0);
    
    var yyval = undefined; // yes, setting garbage value;
    
    if (yylen > 0)
      yyval = yystack.valueAt(yylen - 1);

    ;

    var actionClosure = actionsTable[yyn]
    ;
    if (actionClosure)
      yyval = actionClosure(yyval, yyvs);

    ;

    yystack.pop(yylen);
    yylen = 0;
    ;

    // Shift the result of the reduction.
    yyn = yyr1_[yyn];
    var yystate = yypgoto_[yyn - yyntokens_] + yystack.stateAt(0);
    if (0 <= yystate && yystate <= yylast_ && yycheck_[yystate] == yystack.stateAt(0))
      yystate = yytable_[yystate];
    else
      yystate = yydefgoto_[yyn - yyntokens_];

    yystack.push(yystate, yyval);
    // was: usless: return YYNEWSTATE;
  }

  // YYPACT[STATE-NUM] -- Index in YYTABLE of the portion describing STATE-NUM.
  var yypact_ninf_ = this.yypact_ninf_ = -828;
  var yypact_ = this.yypact_ =
  [
    //]
      -828,   105,  2888,  -828,  7429,  -828,  -828,  -828,  6939,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  7542,  7542,  -828,  -828,
    7542,  4201,  3799,  -828,  -828,  -828,  -828,   -17,  6807,    -6,
    -828,    88,  -828,  -828,  -828,  3129,  3933,  -828,  -828,  3263,
    -828,  -828,  -828,  -828,  -828,  -828,  8898,  8898,   171,  5224,
    9011,  7881,  8220,  7197,  -828,  6675,  -828,  -828,  -828,     8,
     101,   172,   179,   271,  9124,  8898,  -828,   502,  -828,   664,
    -828,   640,  -828,  -828,   154,   267,   273,  -828,   213,  9237,
    -828,   285,  3108,    27,    44,  -828,  9011,  9011,  -828,  -828,
    6067,  9346,  9455,  9564,  6542,    52,    90,  -828,  -828,   321,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
     448,   643,  -828,   355,   704,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,   341,  -828,  -828,  -828,  -828,
     361,  8898,   443,  5363,  8898,  8898,  8898,  8898,  -828,   369,
    3108,   472,  -828,  -828,   420,   236,   139,   382,   501,   394,
     440,  -828,  -828,  -828,  5954,  -828,  7542,  7542,  -828,  -828,
    6180,  -828,  9011,   365,  -828,   458,   475,  5502,  -828,  -828,
    -828,   477,   500,   154,  -828,   299,   539,   708,  7655,  -828,
    5224,   507,   502,  -828,   664,    -6,   512,  -828,   640,    -6,
     546,   268,   398,  -828,   472,   555,   398,  -828,    -6,   581,
     638,  9673,   560,  -828,   304,   370,   409,   465,  -828,  -828,
    -828,  -828,  -828,  -828,   380,  -828,   403,   447,   284,   585,
     540,   590,    36,   601,   668,   612,    43,   665,   666,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  6293,  9011,  9011,  9011,
    9011,  7655,  9011,  9011,  -828,  -828,  -828,   645,  -828,  -828,
    -828,  8333,  -828,  5224,  7313,   599,  8333,  8898,  8898,  8898,
    8898,  8898,  8898,  8898,  8898,  8898,  8898,  8898,  8898,  8898,
    8898,  8898,  8898,  8898,  8898,  8898,  8898,  8898,  8898,  8898,
    8898,  8898,  8898,  9952,  7542, 10029,  4608,   640,   126,   126,
    9011,  9011,   502,   720,   606,   685,  -828,  -828,   486,   721,
      61,   100,   102,   330,   386,  9011,   199,  -828,   123,   489,
    -828,  -828,  -828,  -828,    57,   233,   277,   326,   328,   331,
     359,   366,   426,  -828,  -828,  -828,    52,  -828,  -828, 10106,
    -828,  -828,  9124,  9124,  -828,  -828,   406,  -828,  -828,  -828,
    8898,  8898,  7768,  -828,  -828, 10183,  7542, 10260,  8898,  8898,
    7994,  -828,    -6,   609,  -828,  -828,    -6,  -828,   618,   629,
    -828,    65,  -828,  -828,  -828,  -828,  -828,  6939,  -828,  8898,
    5615,   619, 10183, 10260,  8898,   664,   634,    -6,  -828,  -828,
    6406,   636,    -6,  -828,  -828,  8107,  -828,  -828,  8220,  -828,
    -828,  -828,   458,   495,  -828,  -828,  -828,   641,  9673, 10337,
    7542, 10414,  1082,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,    62,  -828,  -828,   648,  -828,
    -828,  -828,   347,  -828,   649,  -828,  8898,  8898,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,    45,    45,  -828,
    -828,    45,  8898,  -828,   660,   661,  -828,    -6,  9673,   669,
    -828,  -828,  -828,   684,  1231,  -828,  -828,   539,  2567,  2567,
    2567,  2567,   976,   976,  2722,  2633,  2567,  2567,  3242,  3242,
     689,   689,  1303,   976,   976,  1146,  1146,   603,   255,   255,
     539,   539,   539,  4335,  3397,  4469,  3531,   500,   670,  -828,
      -6,   733,  -828,   768,  -828,   500,  4067,   791,   798,  -828,
    4738,   805,  4998,    35,    35,   720,  8446,   791,   145, 10491,
    7542, 10568,  -828,   640,  -828,   495,  -828,   502,  -828,  -828,
    -828, 10645,  7542, 10106,  4608,  9011,  1193,  -828,  -828,  -828,
    1148,  -828,  2322,  -828,  3108,  6939,  2974,  -828,  8898,   472,
    -828,   440,  2995,  3665,    -6,   462,   490,  -828,  -828,  -828,
    -828,  7768,  7994,  -828,  -828,  9011,  3108,   692,  -828,  -828,
    -828,  3108,  5615,     7,  -828,  -828,   398,  9673,   641,   407,
     315,    -6,   224,   339,   706,  -828,  -828,  -828,  -828,  8898,
    -828,   896,  -828,  -828,  -828,  -828,  -828,  1142,  -828,  -828,
    -828,  -828,  -828,  -828,   690,  -828,   693,   776,   696,  -828,
     698,   784,   724,   806,  -828,  -828,   770,  -828,  -828,  -828,
    -828,  -828,   539,   539,  -828,   793,  5728,  -828,  -828,  5502,
      45,  5728,   731,  8559,  -828,   641,  9673,  9124,  8898,   753,
    9124,  9124,  -828,   645,   500,   732,   785,  9124,  9124,  -828,
     645,   500,  -828,  -828,  8672,   859,  -828,   471,  -828,   859,
    -828,  -828,  -828,  -828,   791,    77,  -828,    58,    74,    -6,
     152,   160,  9011,   502,  -828,  9011,  4608,   407,   315,  -828,
      -6,   791,    65,  1142,  4608,   502,  7071,  -828,    90,   267,
    -828,  8898,  -828,  -828,  -828,  8898,  8898,   497,  8898,  8898,
     743,    65,  -828,   755,  -828,  -828,   391,  8898,  -828,  -828,
     896,   473,  -828,   754,    -6,  -828,    -6,    79,  1142,  -828,
     571,  -828,  -828,  -828,   214,  -828,  1142,  -828,  -828,   881,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,   773,  9782,
    -828,    -6,   775,   758,  -828,   769,   696,  -828,   771,   772,
    -828,   761,   897,   778,  5502,   899,  8898,   786,   641,  3108,
    8898,  -828,  3108,  -828,  3108,  -828,  -828,  -828,  9124,  -828,
    3108,  -828,  3108,  -828,  -828,   660,  -828,   833,  -828,  5111,
     914,  -828,  9011,   791,  -828,   791,  5728,  5728,  -828,  8785,
    4868,   167,    35,  -828,   502,   791,  -828,  -828,  -828,    -6,
     791,  -828,  -828,  -828,  -828,  3108,  8898,  7994,  -828,  -828,
    -828,    -6,  1028,   794,   953,  -828,   792,  5728,  5502,  -828,
    -828,  -828,   796,   797,  -828,   696,  -828,   801,  -828,   807,
     801,  5841,  9782,   875,   529,   825,  -828,  1738,  -828,   622,
    -828,  -828,  1738,  -828,  1056,  -828,  1000,  -828,  -828,   815,
    -828,   813,  3108,  -828,  3108,  9891,   126,  -828,  -828,  5728,
    -828,  -828,   126,  -828,  -828,   791,   791,  -828,   616,  -828,
    4608,  -828,  -828,  -828,  -828,  1193,  -828,   814,  1028,   491,
    -828,  -828,   944,   827,  1142,  -828,   881,  -828,  -828,   881,
    -828,   881,  -828,  -828,   850,   529,  -828, 10722,  -828,  -828,
     826,   829,  -828,   696,   830,  -828,   831,   830,  -828,   452,
    -828,  -828,  -828,   909,  -828,   543,   370,   409,   465,  4608,
    -828,  4738,  -828,  -828,  -828,  -828,  -828,  5728,   791,  4608,
    1028,   814,  1028,   834,  -828,  -828,   801,   842,   801,   801,
    -828,   841,   846,  1738,  -828,  1056,  -828,  -828,  1056,  -828,
    1056,  -828,  -828,  1000,  -828,   495, 10799,  7542, 10876,   798,
     471,   791,  -828,   791,   814,  1028,  -828,   881,  -828,  -828,
    -828,   830,   849,   830,   830,  -828,    93,   315,    -6,   168,
     187,  -828,  -828,  -828,  -828,   814,   801,  -828,  1056,  -828,
    -828,  -828,   216,  -828,   830,  -828
    //[
  ];

  // YYDEFACT[S] -- default reduction number in state S.
  // Performed when YYTABLE doesn't specify something else to do.
  // Zero means the default is an error.  */
  var yydefact_ =
  [
    //]
         2,     0,     0,     1,     0,   346,   347,   348,     0,   339,
     340,   341,   344,   342,   343,   345,   334,   335,   336,   337,
     297,   263,   263,   510,   509,   511,   512,   608,     0,   608,
      10,     0,   514,   513,   515,   594,   596,   506,   505,   595,
     508,   500,   501,   453,   520,   521,     0,     0,     0,     0,
     288,   619,   619,    85,   406,   479,   477,   479,   481,   461,
     473,   467,   475,     0,     0,     0,     3,   606,     6,     9,
      33,    45,    48,    56,   263,    55,     0,    73,     0,    77,
      87,     0,    53,   244,     0,   286,     0,     0,   311,   314,
     606,     0,     0,     0,     0,    57,   306,   275,   276,   452,
     454,   277,   278,   279,   281,   280,   282,   450,   451,   449,
     516,   517,   283,     0,   284,    61,     5,     8,   168,   179,
     169,   192,   165,   185,   175,   174,   195,   196,   190,   173,
     172,   167,   193,   197,   198,   177,   166,   180,   184,   186,
     178,   171,   187,   194,   189,   188,   181,   191,   176,   164,
     183,   182,   163,   170,   161,   162,   158,   159,   160,   116,
     118,   117,   153,   154,   149,   131,   132,   133,   140,   137,
     139,   134,   135,   155,   156,   141,   142,   146,   150,   136,
     138,   128,   129,   130,   143,   144,   145,   147,   148,   151,
     152,   157,   121,   123,   125,    26,   119,   120,   122,   124,
       0,     0,     0,     0,     0,     0,     0,     0,   258,     0,
     245,   268,    71,   262,   619,     0,   516,   517,     0,   284,
     619,   589,    72,    70,   608,    69,     0,   619,   430,    68,
     608,   609,     0,     0,    21,   241,     0,     0,   334,   335,
     297,   300,   431,     0,   220,     0,   221,   294,     0,    19,
       0,     0,   606,    15,    18,   608,    75,    14,   290,   608,
       0,   612,   612,   246,     0,     0,   612,   587,   608,     0,
       0,     0,    83,   338,     0,    93,    94,   101,   308,   407,
     497,   496,   498,   495,     0,   494,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   502,   503,    52,
     235,   236,   615,   616,     4,   617,   607,     0,     0,     0,
       0,     0,     0,     0,   435,   433,   420,    62,   305,   414,
     416,     0,    89,     0,    81,    78,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   428,   619,   426,     0,    54,     0,     0,
       0,     0,   606,     0,   607,     0,   360,   359,     0,     0,
     516,   517,   284,   111,   112,     0,     0,   114,     0,     0,
     516,   517,   284,   327,   188,   181,   191,   176,   158,   159,
     160,   116,   117,   585,   329,   584,     0,   605,   604,     0,
     307,   455,     0,     0,   126,   592,   294,   269,   593,   265,
       0,     0,     0,   259,   267,   428,   619,   426,     0,     0,
       0,   260,   608,     0,   299,   264,   608,   254,   619,   619,
     253,   608,   304,    51,    23,    25,    24,     0,   301,     0,
       0,     0,   428,   426,     0,    17,     0,   608,   292,    13,
     607,    74,   608,   289,   295,   614,   613,   247,   614,   249,
     296,   588,     0,   100,   502,   503,    91,    86,     0,   428,
     619,   426,   548,   483,   486,   484,   499,   480,   456,   478,
     457,   458,   482,   459,   460,     0,   463,   469,     0,   470,
     465,   466,     0,   471,     0,   472,     0,     0,   618,     7,
      27,    28,    29,    30,    31,    49,    50,   619,   619,    59,
      63,   619,     0,    34,    43,     0,    44,   608,     0,    79,
      90,    47,    46,     0,   199,   268,    42,   217,   225,   230,
     231,   232,   227,   229,   239,   240,   233,   234,   210,   211,
     237,   238,   608,   226,   228,   222,   223,   224,   212,   213,
     214,   215,   216,   597,   599,   598,   600,     0,   263,   425,
     608,   597,   599,   598,   600,     0,   263,     0,   619,   351,
       0,   350,     0,     0,     0,     0,     0,     0,   294,   428,
     619,   426,   319,   324,   111,   112,   113,     0,   523,   322,
     522,   428,   619,   426,     0,     0,   548,   331,   597,   598,
     263,    35,   201,    41,   209,     0,   199,   591,     0,   270,
     266,   619,   597,   598,   608,   597,   598,   590,   298,   610,
     250,   255,   257,   303,    22,     0,   242,     0,    32,   423,
     421,   208,     0,    76,    16,   291,   612,     0,    84,    97,
      99,   608,   597,   598,   554,   551,   550,   549,   552,     0,
     565,     0,   576,   566,   580,   579,   575,   548,   408,   547,
     411,   553,   555,   557,   533,   563,   619,   568,   619,   573,
     533,   578,   533,     0,   531,   487,     0,   462,   464,   474,
     468,   476,   218,   219,   398,   608,     0,   396,   395,     0,
     619,     0,   274,     0,    88,    82,     0,     0,     0,     0,
       0,     0,   429,    66,     0,     0,   432,     0,     0,   427,
      64,   619,   349,   287,   619,   619,   441,   619,   352,   619,
     354,   312,   353,   315,     0,     0,   318,   601,   293,   608,
     597,   598,     0,     0,   525,     0,     0,   111,   112,   115,
     608,     0,   608,   548,     0,     0,     0,   252,   417,    58,
     251,     0,   127,   271,   261,     0,     0,   432,     0,     0,
     619,   608,    11,     0,   248,    92,    95,     0,   559,   554,
       0,   372,   363,   365,   608,   361,   608,     0,     0,   540,
       0,   529,   583,   567,     0,   530,     0,   543,   577,     0,
     545,   581,   488,   490,   491,   492,   485,   493,   554,     0,
     394,   608,     0,   379,   561,   619,   619,   571,   379,   379,
     377,   400,     0,     0,     0,     0,     0,   272,    80,   200,
       0,    40,   206,    39,   207,    67,   424,   611,     0,    37,
     204,    38,   205,    65,   422,   442,   443,   619,   444,     0,
     619,   357,     0,     0,   355,     0,     0,     0,   317,     0,
       0,   432,     0,   325,     0,     0,   432,   328,   586,   608,
       0,   527,   332,   418,   419,   202,     0,   256,   302,    20,
     569,   608,     0,   370,     0,   556,     0,     0,     0,   409,
     532,   558,   533,   533,   564,   619,   582,   533,   574,   533,
     533,     0,     0,     0,   560,     0,   397,   385,   387,     0,
     375,   376,     0,   390,     0,   392,     0,   436,   434,     0,
     415,   273,   243,    36,   203,     0,     0,   446,   358,     0,
      12,   448,     0,   309,   310,     0,     0,   270,   619,   320,
       0,   524,   323,   526,   330,   548,   362,   373,     0,   368,
     364,   410,     0,     0,     0,   536,     0,   538,   528,     0,
     544,     0,   541,   546,     0,   570,   294,   428,   399,   378,
     379,   379,   562,   619,   379,   572,   379,   379,   404,   608,
     402,   405,    60,     0,   445,     0,   102,   103,   110,     0,
     447,     0,   313,   316,   438,   439,   437,     0,     0,     0,
       0,   371,     0,   366,   413,   412,   533,   533,   533,   533,
     489,   601,   293,     0,   382,     0,   384,   374,     0,   391,
       0,   388,   393,     0,   401,   109,   428,   619,   426,   619,
     619,     0,   326,     0,   369,     0,   537,     0,   534,   539,
     542,   379,   379,   379,   379,   403,   601,   108,   608,   597,
     598,   440,   356,   321,   333,   367,   533,   383,     0,   380,
     386,   389,   432,   535,   379,   381
    //[
  ];

  // YYPGOTO[NTERM-NUM].
  var yypgoto_ =
  [
    //]
      -828,  -828,  -828,  -382,  -828,    26,  -828,  -549,    -7,  -828,
     534,  -828,    33,  -828,  -315,   -33,   -63,   -55,  -828,  -562,
    -828,   766,   -13,   895,  -135,    20,   -73,  -828,  -409,    29,
    1882,  -309,   902,   -54,  -828,    -5,  -828,  -828,     6,  -828,
    1208,  -828,  1366,  -828,   -41,   278,  -344,    78,   -14,  -828,
    -384,  -205,    -4,  -304,   -15,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,    64,  -828,  -828,  -828,  -828,  -828,  -828,  -828,
    -828,  -828,  -828,    -1,  -333,  -519,   -32,  -623,  -828,  -789,
    -771,   227,   314,    71,  -828,  -437,  -828,  -666,  -828,     0,
    -828,  -828,  -828,  -828,  -828,  -828,   251,  -828,  -828,  -828,
    -828,  -828,  -828,  -828,   -94,  -828,  -828,  -531,  -828,    14,
    -828,  -828,  -828,  -828,  -828,  -828,   903,  -828,  -828,  -828,
    -828,   712,  -828,  -828,  -828,  -828,  -828,  -828,  -828,   955,
    -828,  -126,  -828,  -828,  -828,  -828,  -828,    -3,  -828,    11,
    -828,  1400,  1673,   925,  1898,  1689,  -828,  -828,    92,  -451,
    -102,  -385,  -827,  -588,  -689,  -289,   245,   131,  -828,  -828,
    -828,    18,  -721,  -764,   137,   258,  -828,  -634,  -828,   -37,
    -627,  -828,  -828,  -828,   114,  -388,  -828,  -324,  -828,   644,
     -47,    -9,  -123,  -568,  -214,    21,   -11,    -2
    //[
  ];

  // YYDEFGOTO[NTERM-NUM].
  var yydefgoto_ =
  [
    //]
        -1,     1,     2,    66,    67,    68,   236,   567,   568,   252,
     253,   446,   254,   437,    70,    71,   358,    72,    73,   510,
     690,   243,    75,    76,   255,    77,    78,    79,   467,    80,
     209,   377,   378,   192,   193,   194,   195,   605,   556,   197,
      82,   439,   211,   260,   228,   748,   426,   427,   225,   226,
     213,   413,   428,   516,    83,   356,   259,   452,   625,   360,
     846,   361,   847,   732,   987,   736,   733,   930,   594,   596,
     746,   935,   245,    85,    86,    87,    88,    89,    90,    91,
      92,    93,    94,   713,   570,   721,   843,   844,   369,   772,
     773,   774,   959,   898,   801,   686,   687,   802,   969,   970,
     278,   279,   472,   777,   658,   879,   320,   511,    95,    96,
     711,   704,   565,   557,   318,   508,   507,   577,   986,   715,
     837,   916,   920,    97,    98,    99,   100,   101,   102,   103,
     290,   485,   104,   294,   105,   106,   292,   296,   286,   284,
     288,   477,   676,   675,   792,   891,   796,   107,   285,   108,
     109,   216,   217,   112,   218,   219,   589,   735,   744,   880,
     779,   745,   661,   662,   663,   664,   665,   804,   805,   666,
     667,   668,   669,   807,   808,   670,   671,   672,   673,   674,
     781,   396,   595,   265,   429,   221,   115,   629,   559,   399,
     304,   423,   424,   706,   457,   571,   364,   257
    //[
  ];

  // YYTABLE[YYPACT[STATE-NUM]]. What to do in state STATE-NUM.
  // If positive, shift that token.
  // If negative, reduce the rule which number is the opposite.
  // If yytable_NINF_, syntax error.
  var yytable_ninf_ = this.yytable_ninf_ = -620;
  var yytable_ = this.yytable_ =
  [
    //]
       116,   283,   400,   208,   208,   198,   325,   208,   229,   299,
     560,   521,   214,   214,   196,   421,   214,   258,   232,   199,
     235,   659,   526,   234,   359,   198,   572,   362,   610,   558,
     117,   566,   617,   316,   196,    69,   610,    69,   273,   199,
     394,   785,   251,   363,   724,   741,   757,   261,   459,   263,
     267,   809,   461,   357,   357,   723,   306,   357,   627,   638,
     317,   196,   720,   775,   273,   888,    84,   586,    84,   256,
     617,   689,   614,   766,   691,   600,   273,   273,   273,   971,
     215,   215,   272,  -106,   215,   940,  -102,   660,   305,   881,
     569,   558,   840,   566,   212,   222,   845,   488,   223,  -108,
     196,   937,   312,   313,   494,     3,  -106,   432,   877,   695,
     876,   305,  -338,    84,   215,   447,   314,   274,   230,   630,
     -74,   684,   231,   473,   587,  -103,   641,  -110,   215,   353,
     220,   220,   451,   231,   220,   895,   453,   397,   965,   569,
     -88,   825,  -510,   274,   883,   659,   489,   630,   833,   289,
     215,   215,   889,   495,   215,   368,   379,   379,  -338,  -338,
     479,   851,   482,   685,   486,   262,   266,   991,   486,   474,
    -109,   475,   856,   302,   303,   354,   355,  -105,   900,   901,
     314,  -105,   775,   873,   398,  -107,   971,   855,   517,  -510,
     878,   -97,  -104,  -597,   -93,   860,   251,   431,   466,   433,
    -107,   940,   316,   677,   231,   449,   659,   -99,   881,  -598,
     849,   208,   414,   208,   208,   302,   303,   237,   414,   315,
     214,  1024,   214,   888,   421,   430,  -518,   247,  -597,  -104,
     441,  -106,  -106,   -94,   617,  -101,   729,   610,   610,   965,
     588,   450,   291,   251,   500,   501,   502,   503,   740,   -96,
     763,   584,  -102,   814,  1045,   585,   273,   630,   948,   462,
     881,   302,   303,   961,   302,   303,   513,    84,   966,   630,
     256,   522,   776,   305,   357,   357,   357,   357,  -100,   505,
     506,   445,   739,   315,   775,   -96,   775,   818,   215,   227,
     215,   215,   659,   -98,   215,   319,   215,   573,   574,   618,
     -95,    84,   422,   620,   425,   984,  -105,  -105,   623,   273,
     997,   654,    84,   293,    84,   575,   251,   515,  -509,   881,
     295,   415,   515,   327,   633,  -107,  -107,   357,   357,   635,
     297,   298,   499,   929,   655,   274,  1007,   -96,   220,    69,
     220,   208,   583,   256,   504,   473,   322,   601,   603,   481,
     775,   993,   430,   519,  -104,  -104,  -594,   -96,   859,   678,
     -96,   564,  -511,   -96,   -98,  -509,   678,   416,   417,  1032,
      84,   215,   215,   215,   215,    84,   215,   215,   350,   351,
     352,   988,   521,   305,   442,   215,   321,    84,   274,   469,
     215,   474,   850,   475,   694,   466,   803,   985,   326,   590,
    -293,   455,   775,   208,   775,   564,   754,   456,   473,  -511,
     836,  -512,  -595,  -514,   430,  -504,  -513,  -432,   215,   434,
      84,    56,   764,   564,   215,   215,   414,   414,   435,   436,
     416,   443,   624,  -601,   198,   470,   471,   775,   116,   215,
    1023,   473,   402,   196,  -515,   466,  -293,  -293,   199,   564,
    -598,  -504,   -98,   273,   474,  -516,   475,   208,  -512,  -594,
    -514,  -504,  -504,  -513,   473,  -594,   215,   215,   430,  -519,
    1052,  -507,   -98,    69,   404,   -98,  -432,   564,   -98,   617,
     215,   419,   410,   610,   659,   842,   839,   474,   680,   475,
     476,  -515,  -601,   444,  -517,  -103,   230,   887,  -504,   406,
     890,  -516,  -516,   273,    84,   688,   688,  -110,   473,   688,
     474,  -507,   475,   478,    84,  -595,   702,  -507,  -507,  -109,
    -432,  -595,  -432,  -432,   709,   769,   611,   645,   646,   647,
     648,   458,   274,   699,   215,  -518,  -601,   456,  -601,  -601,
    -517,  -517,  -597,   769,   703,   645,   646,   647,   648,   758,
    -284,   705,   710,   412,   474,   754,   475,   480,  -507,   747,
     411,  -102,   742,   717,   765,   719,   716,   208,   787,   636,
     790,   579,   725,   420,   591,  -105,   726,   759,   430,   208,
    -294,   -93,   274,   979,   866,  1013,   749,   564,   418,   981,
     430,   231,   761,   438,   722,   722,  -284,  -284,   750,   564,
     752,   473,   198,  -107,   440,   705,   872,   327,   734,   414,
    -104,   196,   224,   964,   957,   967,   199,   580,   581,   858,
     592,   593,   273,   466,   992,   -73,  -294,  -294,  1016,   649,
     116,   839,   705,   576,    84,   227,    84,   463,   868,   650,
     302,   303,   522,   448,   215,   821,   823,   474,   810,   475,
     484,   875,   829,   831,   863,   996,   215,   998,    84,   215,
     592,   593,   999,   826,   782,    69,   782,   653,   654,   852,
     747,   327,   854,  1038,  1017,  1018,   811,   312,   313,   812,
     799,   273,   813,   454,   815,   460,   340,   341,   688,   215,
     650,   655,   862,   468,   630,   483,    84,   464,   465,   357,
     487,   274,   357,   806,   307,   308,   309,   310,   311,   750,
     515,   490,   838,   841,  1031,   841,  1033,   841,   653,   654,
     705,  1034,   493,   848,   348,   349,   350,   351,   352,   473,
    -519,   705,   520,   496,   497,   760,   933,   576,  1046,   509,
     857,   578,   655,   886,   498,   619,   582,   886,   936,   628,
      84,   621,   196,    84,   853,    84,  -103,   327,   414,  1054,
     274,   215,   622,   632,   215,   215,   861,   811,    74,   -88,
      74,   215,   215,   913,   637,   474,   -94,   475,   491,   922,
     945,   947,    74,    74,   273,   950,    74,   952,   953,   679,
     681,   403,   811,  -268,   693,   444,   215,   697,   885,   215,
      84,   712,   696,   782,   782,  -423,   714,   909,    84,   357,
     348,   349,   350,   351,   352,    74,    74,  -110,   718,   767,
     707,  -109,   762,   778,   793,   794,   780,   795,   783,   784,
      74,   786,   918,    44,    45,   917,   788,  -101,   921,   925,
     926,  -100,   923,   928,   924,   798,  -105,   645,   646,   647,
     648,   799,    74,    74,   932,   708,    74,   789,   791,   934,
     810,   650,   886,   894,  -269,   810,   -96,   810,   820,   827,
     942,   943,   828,   722,   839,   931,   867,   273,    84,   903,
     905,  -107,   651,   782,   954,   869,   892,   874,   652,   653,
     654,   897,   215,   896,  1026,  1028,  1029,  1030,  -104,   906,
     273,   -98,   899,    84,   902,   904,   215,   907,   908,   910,
      84,    84,   980,   655,    84,   806,   656,   963,   -95,  -270,
     806,   915,   806,   919,   982,   983,   841,   938,   941,   944,
     946,   956,   231,   769,   949,   645,   646,   647,   648,   649,
     951,    84,    84,   958,  1053,   972,  -271,   990,   769,   650,
     645,   646,   647,   648,   994,    84,   955,   995,  1000,  1003,
    1014,   782,  1005,  1008,  1010,  1015,   810,  1025,   810,    74,
     651,   810,  1019,   810,  1020,  1027,  -597,   653,   654,   975,
    1021,  -598,  1048,    84,   634,   770,   366,  1022,  1042,   834,
      74,   771,    74,    74,    84,   383,    74,   871,    74,   800,
     864,   655,   401,    74,   208,   769,   492,   645,   646,   647,
     648,   810,   287,  1035,    74,   430,    74,   716,   841,   395,
    1043,   806,  1044,   806,   564,   884,   806,   989,   806,   705,
     962,  1004,  1006,  1041,   960,  1009,   882,  1011,  1012,     0,
     597,     0,   770,    84,   327,    84,     0,     0,   939,     0,
       0,    84,   968,    84,   645,   646,   647,   648,     0,   340,
     341,     0,     0,     0,     0,     0,   806,     0,     0,     0,
       0,     0,    74,    74,    74,    74,    74,    74,    74,    74,
     769,   215,   645,   646,   647,   648,     0,    74,     0,    74,
       0,     0,    74,     0,   345,   346,   347,   348,   349,   350,
     351,   352,  1047,  1049,  1050,  1051,     0,     0,   769,     0,
     645,   646,   647,   648,   799,     0,     0,   770,     0,     0,
      74,     0,    74,     0,   650,  1055,    74,    74,     0,     0,
       0,     0,     0,     0,   644,     0,   645,   646,   647,   648,
     649,    74,     0,     0,     0,   651,     0,     0,  -619,     0,
     650,     0,   653,   654,     0,     0,  -619,  -619,  -619,     0,
       0,  -619,  -619,  -619,     0,  -619,     0,     0,    74,    74,
       0,   651,     0,     0,  -619,  -619,   655,   652,   653,   654,
       0,     0,    74,     0,     0,  -619,  -619,     0,  -619,  -619,
    -619,  -619,  -619,     0,   644,     0,   645,   646,   647,   648,
     649,     0,   655,     0,     0,   656,    74,     0,     0,     0,
     650,     0,     0,     0,   327,     0,    74,   657,     0,     0,
       0,     0,     0,     0,   210,   210,     0,     0,   210,   340,
     341,   651,     0,  -619,     0,     0,    74,   652,   653,   654,
       0,     0,     0,     0,     0,   644,     0,   645,   646,   647,
     648,   649,     0,     0,   244,   246,  -619,     0,     0,   210,
     210,   650,   655,     0,     0,   656,   347,   348,   349,   350,
     351,   352,   300,   301,     0,   698,     0,  -619,  -619,     0,
    -619,     0,   651,   227,  -619,     0,  -619,  -619,   652,   653,
     654,     0,     0,     0,     0,     0,     0,     0,     0,   327,
     328,   329,   330,   331,   332,   333,   334,   335,   336,   337,
     338,   339,     0,   655,   340,   341,   656,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   743,     0,
       0,     0,     0,     0,     0,     0,    74,     0,    74,     0,
       0,     0,     0,     0,     0,   342,    74,   343,   344,   345,
     346,   347,   348,   349,   350,   351,   352,     0,    74,     0,
      74,    74,     0,     0,  -245,     0,     0,     0,     0,     0,
       0,   327,   328,   329,   330,   331,   332,   333,   334,   335,
     336,   337,   338,   339,     0,     0,   340,   341,     0,     0,
       0,    74,     0,     0,     0,     0,     0,     0,    74,     0,
       0,     0,   110,     0,   110,     0,     0,     0,     0,   210,
       0,     0,   210,   210,   210,   300,     0,   342,   264,   343,
     344,   345,   346,   347,   348,   349,   350,   351,   352,     0,
       0,     0,   210,     0,   210,   210,     0,     0,     0,     0,
       0,     0,   231,     0,     0,     0,     0,     0,     0,   110,
       0,     0,    74,   275,     0,    74,     0,    74,     0,     0,
       0,     0,     0,    74,     0,     0,    74,    74,     0,     0,
       0,     0,     0,    74,    74,     0,     0,     0,     0,   275,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   370,   380,   380,   380,     0,     0,     0,    74,     0,
       0,    74,    74,     0,     0,     0,     0,     0,     0,     0,
      74,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   210,
       0,     0,     0,     0,   524,   527,   528,   529,   530,   531,
     532,   533,   534,   535,   536,   537,   538,   539,   540,   541,
     542,   543,   544,   545,   546,   547,   548,   549,   550,   551,
     552,     0,   210,     0,     0,     0,     0,   405,     0,     0,
     407,   408,   409,     0,     0,     0,     0,     0,     0,     0,
      74,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    74,     0,     0,     0,     0,     0,
       0,     0,     0,   110,     0,    74,     0,     0,    74,     0,
     602,   604,    74,    74,     0,     0,    74,     0,   606,   210,
     210,     0,     0,     0,   210,     0,   602,   604,   210,     0,
       0,     0,     0,     0,     0,     0,     0,   110,     0,     0,
       0,     0,     0,    74,    74,     0,     0,   626,   110,     0,
     110,     0,   631,     0,     0,     0,     0,    74,     0,     0,
       0,     0,     0,   210,     0,     0,   210,     0,     0,     0,
       0,   275,     0,     0,     0,   111,     0,   111,   210,     0,
       0,     0,     0,     0,     0,    74,     0,   514,     0,     0,
       0,   114,   525,   114,     0,     0,    74,     0,     0,     0,
       0,     0,     0,     0,   682,   683,   110,     0,     0,     0,
       0,   110,     0,     0,     0,     0,     0,     0,     0,     0,
     210,     0,   111,   110,   275,     0,   276,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   114,     0,
       0,     0,   277,     0,     0,    74,     0,    74,     0,     0,
       0,     0,   276,    74,     0,    74,   110,     0,     0,     0,
       0,     0,     0,     0,   371,   381,   381,   381,   277,     0,
       0,     0,     0,     0,     0,     0,     0,   607,   609,     0,
     372,   382,   382,    74,   210,     0,   264,     0,   210,     0,
     798,     0,   645,   646,   647,   648,   799,     0,     0,     0,
     210,     0,     0,     0,     0,     0,   650,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   210,     0,     0,     0,
       0,   609,     0,     0,   264,     0,     0,   651,     0,   210,
     210,     0,     0,   652,   653,   654,     0,     0,     0,     0,
     110,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     110,     0,     0,     0,     0,     0,     0,   210,   655,     0,
       0,   656,     0,     0,     0,     0,     0,     0,   275,     0,
       0,     0,     0,     0,     0,     0,   111,     0,   692,     0,
       0,     0,     0,     0,    81,     0,    81,     0,     0,     0,
       0,     0,   114,     0,     0,     0,     0,     0,     0,     0,
     113,   210,   113,     0,     0,   606,   819,     0,   822,   824,
     111,     0,     0,     0,     0,   830,   832,     0,   275,     0,
       0,   111,   210,   111,     0,     0,   114,     0,     0,     0,
       0,    81,     0,     0,     0,     0,     0,   114,     0,   114,
       0,     0,   525,     0,   276,     0,     0,   113,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   865,
     277,     0,     0,   822,   824,     0,   830,   832,     0,     0,
     110,     0,   110,   367,   753,   210,     0,     0,     0,   111,
       0,     0,     0,     0,   111,     0,     0,   609,   264,     0,
       0,     0,     0,     0,   110,   114,   111,   276,     0,     0,
     114,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   114,   277,     0,   768,     0,     0,     0,     0,
       0,     0,     0,     0,   210,     0,     0,     0,   912,   111,
       0,     0,   110,     0,     0,     0,   914,   275,     0,     0,
       0,     0,     0,     0,     0,   114,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   210,     0,   817,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   914,   210,     0,     0,     0,     0,
     835,     0,     0,     0,     0,    81,   110,     0,     0,   110,
       0,   110,     0,     0,     0,     0,   275,     0,     0,     0,
       0,   113,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   111,     0,     0,     0,     0,     0,    81,
       0,     0,     0,   111,     0,     0,     0,     0,     0,   114,
      81,     0,    81,   870,     0,   113,   110,     0,     0,   114,
       0,   276,     0,     0,   110,     0,   113,     0,   113,     0,
       0,     0,     0,     0,     0,     0,     0,   277,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   911,     0,     0,     0,     0,     0,    81,     0,
       0,   276,     0,    81,     0,     0,     0,     0,     0,   380,
       0,     0,     0,     0,   113,    81,     0,   277,   523,   113,
       0,     0,     0,     0,   110,   927,     0,     0,     0,     0,
       0,   113,     0,     0,     0,   210,     0,     0,     0,     0,
       0,     0,     0,   264,     0,     0,     0,     0,    81,   110,
       0,     0,     0,   111,     0,   111,   110,   110,     0,     0,
     110,     0,     0,     0,   113,     0,     0,     0,     0,   114,
       0,   114,     0,     0,     0,     0,     0,   111,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   110,   110,     0,
       0,     0,     0,   114,     0,     0,     0,     0,     0,     0,
       0,   110,   380,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   111,     0,     0,     0,     0,
     276,     0,     0,     0,     0,   976,     0,     0,     0,   110,
       0,   114,    81,     0,     0,     0,   277,     0,     0,     0,
     110,     0,    81,     0,     0,     0,     0,     0,   113,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   113,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   111,
       0,     0,   111,     0,   111,   797,   751,     0,     0,   276,
       0,     0,     0,     0,     0,   114,     0,     0,   114,   110,
     114,   110,     0,     0,     0,   277,     0,   110,     0,   110,
     327,   328,   329,   330,   331,   332,   333,   334,   335,   336,
     337,   338,   339,     0,     0,   340,   341,     0,     0,   111,
       0,     0,     0,     0,     0,     0,     0,   111,     0,     0,
       0,     0,     0,     0,     0,   114,     0,     0,     0,     0,
       0,     0,     0,   114,     0,     0,   342,     0,   343,   344,
     345,   346,   347,   348,   349,   350,   351,   352,     0,     0,
       0,     0,    81,     0,    81,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   113,     0,
     113,     0,   381,     0,     0,     0,    81,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   111,   382,     0,
       0,     0,   113,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   114,     0,     0,     0,     0,     0,     0,
       0,     0,   111,     0,    81,     0,     0,     0,     0,   111,
     111,     0,     0,   111,     0,     0,     0,     0,   114,     0,
     113,     0,     0,     0,     0,   114,   114,     0,     0,   114,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     111,   111,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   111,   381,   114,   114,    81,     0,
       0,    81,     0,    81,     0,     0,     0,     0,     0,   523,
     114,   382,     0,     0,   113,     0,     0,   113,   977,   113,
       0,     0,   111,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   111,   978,     0,     0,     0,   114,     0,
       0,     0,     0,     0,     0,     0,     0,     0,    81,   114,
       0,     0,     0,     0,     0,     0,    81,     0,     0,     0,
       0,     0,     0,     0,   113,   327,  -620,  -620,  -620,  -620,
     332,   333,   113,     0,  -620,  -620,     0,     0,     0,     0,
     340,   341,   111,     0,   111,     0,     0,     0,     0,     0,
     111,     0,   111,     0,     0,     0,     0,     0,   114,     0,
     114,     0,     0,     0,     0,     0,   114,     0,   114,     0,
       0,     0,     0,   343,   344,   345,   346,   347,   348,   349,
     350,   351,   352,     0,     0,     0,    81,     0,     0,     0,
       0,   327,   328,   329,   330,   331,   332,   333,   334,     0,
     336,   337,   113,     0,     0,     0,   340,   341,     0,     0,
       0,    81,     0,     0,     0,     0,     0,     0,    81,    81,
       0,     0,    81,     0,     0,     0,     0,   113,     0,     0,
       0,     0,     0,     0,   113,   113,     0,     0,   113,   343,
     344,   345,   346,   347,   348,   349,   350,   351,   352,    81,
      81,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,    81,     0,   113,   113,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   113,
     327,   328,   329,   330,   331,   332,   333,   974,     0,   336,
     337,    81,     0,     0,     0,   340,   341,     0,     0,     0,
       0,     0,    81,     0,     0,     0,     0,   113,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   113,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   343,   344,
     345,   346,   347,   348,   349,   350,   351,   352,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,    81,     0,    81,     0,     0,     0,     0,     0,    81,
       0,    81,     0,     0,     0,     0,     0,   113,     0,   113,
       0,     0,     0,     0,     0,   113,     0,   113,  -619,     4,
       0,     5,     6,     7,     8,     9,     0,     0,     0,    10,
      11,     0,     0,     0,    12,     0,    13,    14,    15,    16,
      17,    18,    19,     0,     0,     0,     0,     0,    20,    21,
      22,    23,    24,    25,    26,     0,     0,    27,     0,     0,
       0,     0,     0,    28,    29,    30,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    40,     0,    41,    42,     0,
      43,    44,    45,     0,    46,    47,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    48,     0,     0,    49,    50,     0,
      51,    52,     0,    53,     0,     0,    54,    55,    56,    57,
      58,    59,    60,    61,    62,  -601,     0,     0,     0,     0,
       0,     0,     0,  -601,  -601,  -601,     0,     0,  -601,  -601,
    -601,     0,  -601,     0,    63,    64,    65,     0,   698,     0,
       0,  -601,  -601,  -601,  -601,     0,  -619,  -619,     0,     0,
       0,     0,  -601,  -601,     0,  -601,  -601,  -601,  -601,  -601,
       0,     0,   327,   328,   329,   330,   331,   332,   333,   334,
     335,   336,   337,   338,   339,     0,     0,   340,   341,     0,
       0,     0,     0,  -601,  -601,  -601,  -601,  -601,  -601,  -601,
    -601,  -601,  -601,  -601,  -601,  -601,     0,     0,  -601,  -601,
    -601,     0,   755,  -601,     0,     0,     0,     0,   342,  -601,
     343,   344,   345,   346,   347,   348,   349,   350,   351,   352,
       0,     0,     0,  -601,     0,     0,  -601,     0,  -106,  -601,
    -601,  -601,  -601,  -601,  -601,  -601,  -601,  -601,  -601,  -601,
    -601,     0,     0,     0,  -601,  -601,  -601,  -601,  -601,  -504,
       0,  -601,  -601,  -601,  -601,     0,     0,  -504,  -504,  -504,
       0,     0,  -504,  -504,  -504,     0,  -504,     0,     0,     0,
       0,     0,     0,     0,  -504,     0,  -504,  -504,  -504,     0,
       0,     0,     0,     0,     0,     0,  -504,  -504,     0,  -504,
    -504,  -504,  -504,  -504,     0,     0,   327,   328,   329,   330,
     331,   332,   333,   334,   335,   336,   337,   338,   339,     0,
       0,   340,   341,     0,     0,     0,     0,  -504,  -504,  -504,
    -504,  -504,  -504,  -504,  -504,  -504,  -504,  -504,  -504,  -504,
       0,     0,  -504,  -504,  -504,     0,  -504,  -504,     0,     0,
       0,     0,   342,  -504,   343,   344,   345,   346,   347,   348,
     349,   350,   351,   352,     0,     0,     0,  -504,     0,     0,
    -504,     0,  -504,  -504,  -504,  -504,  -504,  -504,  -504,  -504,
    -504,  -504,  -504,  -504,  -504,     0,     0,     0,     0,  -504,
    -504,  -504,  -504,  -507,     0,  -504,  -504,  -504,  -504,     0,
       0,  -507,  -507,  -507,     0,     0,  -507,  -507,  -507,     0,
    -507,     0,     0,     0,     0,     0,     0,     0,  -507,     0,
    -507,  -507,  -507,     0,     0,     0,     0,     0,     0,     0,
    -507,  -507,     0,  -507,  -507,  -507,  -507,  -507,     0,     0,
     327,   328,   329,   330,   331,   332,   333,   334,   335,   336,
     337,  -620,  -620,     0,     0,   340,   341,     0,     0,     0,
       0,  -507,  -507,  -507,  -507,  -507,  -507,  -507,  -507,  -507,
    -507,  -507,  -507,  -507,     0,     0,  -507,  -507,  -507,     0,
    -507,  -507,     0,     0,     0,     0,     0,  -507,   343,   344,
     345,   346,   347,   348,   349,   350,   351,   352,     0,     0,
       0,  -507,     0,     0,  -507,     0,  -507,  -507,  -507,  -507,
    -507,  -507,  -507,  -507,  -507,  -507,  -507,  -507,  -507,     0,
       0,     0,     0,  -507,  -507,  -507,  -507,  -602,     0,  -507,
    -507,  -507,  -507,     0,     0,  -602,  -602,  -602,     0,     0,
    -602,  -602,  -602,     0,  -602,     0,     0,     0,     0,     0,
       0,     0,     0,  -602,  -602,  -602,  -602,     0,     0,     0,
       0,     0,     0,     0,  -602,  -602,     0,  -602,  -602,  -602,
    -602,  -602,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,  -602,  -602,  -602,  -602,  -602,
    -602,  -602,  -602,  -602,  -602,  -602,  -602,  -602,     0,     0,
    -602,  -602,  -602,     0,     0,  -602,     0,     0,     0,     0,
       0,  -602,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,  -602,     0,     0,  -602,     0,
       0,  -602,  -602,  -602,  -602,  -602,  -602,  -602,  -602,  -602,
    -602,  -602,  -602,     0,     0,     0,  -602,  -602,  -602,  -602,
    -602,  -603,     0,  -602,  -602,  -602,  -602,     0,     0,  -603,
    -603,  -603,     0,     0,  -603,  -603,  -603,     0,  -603,     0,
       0,     0,     0,     0,     0,     0,     0,  -603,  -603,  -603,
    -603,     0,     0,     0,     0,     0,     0,     0,  -603,  -603,
       0,  -603,  -603,  -603,  -603,  -603,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,  -603,
    -603,  -603,  -603,  -603,  -603,  -603,  -603,  -603,  -603,  -603,
    -603,  -603,     0,     0,  -603,  -603,  -603,     0,     0,  -603,
       0,     0,     0,     0,     0,  -603,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,  -603,
       0,     0,  -603,     0,     0,  -603,  -603,  -603,  -603,  -603,
    -603,  -603,  -603,  -603,  -603,  -603,  -603,     0,     0,     0,
    -603,  -603,  -603,  -603,  -603,  -293,     0,  -603,  -603,  -603,
    -603,     0,     0,  -293,  -293,  -293,     0,     0,  -293,  -293,
    -293,     0,  -293,     0,     0,     0,     0,     0,     0,     0,
       0,     0,  -293,  -293,  -293,     0,     0,     0,     0,     0,
       0,     0,  -293,  -293,     0,  -293,  -293,  -293,  -293,  -293,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,  -293,  -293,  -293,  -293,  -293,  -293,  -293,
    -293,  -293,  -293,  -293,  -293,  -293,     0,     0,  -293,  -293,
    -293,     0,   756,  -293,     0,     0,     0,     0,     0,  -293,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,  -293,     0,     0,  -293,     0,  -108,  -293,
    -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,
    -293,     0,     0,     0,     0,  -293,  -293,  -293,  -293,  -431,
       0,  -293,  -293,  -293,  -293,     0,     0,  -431,  -431,  -431,
       0,     0,  -431,  -431,  -431,     0,  -431,     0,     0,     0,
       0,     0,     0,     0,     0,  -431,  -431,  -431,     0,     0,
       0,     0,     0,     0,     0,     0,  -431,  -431,     0,  -431,
    -431,  -431,  -431,  -431,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,  -431,  -431,  -431,
    -431,  -431,  -431,  -431,  -431,  -431,  -431,  -431,  -431,  -431,
       0,     0,  -431,  -431,  -431,     0,     0,  -431,     0,     0,
       0,     0,     0,  -431,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,  -431,     0,     0,
       0,     0,     0,  -431,     0,  -431,  -431,  -431,  -431,  -431,
    -431,  -431,  -431,  -431,  -431,     0,     0,     0,  -431,  -431,
    -431,  -431,  -431,  -285,   227,  -431,  -431,  -431,  -431,     0,
       0,  -285,  -285,  -285,     0,     0,  -285,  -285,  -285,     0,
    -285,     0,     0,     0,     0,     0,     0,     0,     0,     0,
    -285,  -285,  -285,     0,     0,     0,     0,     0,     0,     0,
    -285,  -285,     0,  -285,  -285,  -285,  -285,  -285,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,  -285,  -285,  -285,  -285,  -285,  -285,  -285,  -285,  -285,
    -285,  -285,  -285,  -285,     0,     0,  -285,  -285,  -285,     0,
       0,  -285,     0,     0,     0,     0,     0,  -285,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,  -285,     0,     0,  -285,     0,     0,  -285,  -285,  -285,
    -285,  -285,  -285,  -285,  -285,  -285,  -285,  -285,  -285,     0,
       0,     0,     0,  -285,  -285,  -285,  -285,  -421,     0,  -285,
    -285,  -285,  -285,     0,     0,  -421,  -421,  -421,     0,     0,
    -421,  -421,  -421,     0,  -421,     0,     0,     0,     0,     0,
       0,     0,     0,  -421,  -421,  -421,     0,     0,     0,     0,
       0,     0,     0,     0,  -421,  -421,     0,  -421,  -421,  -421,
    -421,  -421,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,  -421,  -421,  -421,  -421,  -421,
    -421,  -421,  -421,  -421,  -421,  -421,  -421,  -421,     0,     0,
    -421,  -421,  -421,     0,     0,  -421,     0,     0,     0,     0,
       0,  -421,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,  -421,     0,     0,     0,     0,
       0,  -421,     0,  -421,  -421,  -421,  -421,  -421,  -421,  -421,
    -421,  -421,  -421,     0,     0,     0,  -421,  -421,  -421,  -421,
    -421,  -300,  -421,  -421,  -421,  -421,  -421,     0,     0,  -300,
    -300,  -300,     0,     0,  -300,  -300,  -300,     0,  -300,     0,
       0,     0,     0,     0,     0,     0,     0,     0,  -300,  -300,
       0,     0,     0,     0,     0,     0,     0,     0,  -300,  -300,
       0,  -300,  -300,  -300,  -300,  -300,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,  -300,
    -300,  -300,  -300,  -300,  -300,  -300,  -300,  -300,  -300,  -300,
    -300,  -300,     0,     0,  -300,  -300,  -300,     0,     0,  -300,
       0,     0,     0,     0,     0,  -300,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,  -300,
       0,     0,     0,     0,     0,  -300,     0,  -300,  -300,  -300,
    -300,  -300,  -300,  -300,  -300,  -300,  -300,     0,     0,     0,
       0,  -300,  -300,  -300,  -300,  -601,   224,  -300,  -300,  -300,
    -300,     0,     0,  -601,  -601,  -601,     0,     0,     0,  -601,
    -601,     0,  -601,     0,     0,     0,     0,     0,     0,     0,
       0,  -601,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,  -601,  -601,     0,  -601,  -601,  -601,  -601,  -601,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,  -601,  -601,  -601,  -601,  -601,  -601,  -601,
    -601,  -601,  -601,  -601,  -601,  -601,     0,     0,  -601,  -601,
    -601,     0,   700,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,  -601,     0,     0,     0,     0,  -106,  -601,
       0,  -601,  -601,  -601,  -601,  -601,  -601,  -601,  -601,  -601,
    -601,     0,     0,     0,  -601,  -601,  -601,  -601,   -97,  -293,
       0,  -601,     0,  -601,  -601,     0,     0,  -293,  -293,  -293,
       0,     0,     0,  -293,  -293,     0,  -293,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,  -293,  -293,     0,  -293,
    -293,  -293,  -293,  -293,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,  -293,  -293,  -293,
    -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,
       0,     0,  -293,  -293,  -293,     0,   701,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,  -293,     0,     0,
       0,     0,  -108,  -293,     0,  -293,  -293,  -293,  -293,  -293,
    -293,  -293,  -293,  -293,  -293,     0,     0,     0,     0,  -293,
    -293,  -293,   -99,     0,     0,  -293,     0,  -293,  -293,   248,
       0,     5,     6,     7,     8,     9,  -619,  -619,  -619,    10,
      11,     0,     0,  -619,    12,     0,    13,    14,    15,    16,
      17,    18,    19,     0,     0,     0,     0,     0,    20,    21,
      22,    23,    24,    25,    26,     0,     0,    27,     0,     0,
       0,     0,     0,    28,    29,   249,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    40,     0,    41,    42,     0,
      43,    44,    45,     0,    46,    47,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    48,     0,     0,    49,    50,     0,
      51,    52,     0,    53,     0,     0,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    63,    64,    65,     0,     0,   248,
       0,     5,     6,     7,     8,     9,  -619,  -619,  -619,    10,
      11,     0,  -619,  -619,    12,     0,    13,    14,    15,    16,
      17,    18,    19,     0,     0,     0,     0,     0,    20,    21,
      22,    23,    24,    25,    26,     0,     0,    27,     0,     0,
       0,     0,     0,    28,    29,   249,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    40,     0,    41,    42,     0,
      43,    44,    45,     0,    46,    47,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    48,     0,     0,    49,    50,     0,
      51,    52,     0,    53,     0,     0,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    63,    64,    65,     0,     0,   248,
       0,     5,     6,     7,     8,     9,  -619,  -619,  -619,    10,
      11,     0,     0,  -619,    12,  -619,    13,    14,    15,    16,
      17,    18,    19,     0,     0,     0,     0,     0,    20,    21,
      22,    23,    24,    25,    26,     0,     0,    27,     0,     0,
       0,     0,     0,    28,    29,   249,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    40,     0,    41,    42,     0,
      43,    44,    45,     0,    46,    47,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    48,     0,     0,    49,    50,     0,
      51,    52,     0,    53,     0,     0,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    63,    64,    65,     0,     0,   248,
       0,     5,     6,     7,     8,     9,  -619,  -619,  -619,    10,
      11,     0,     0,  -619,    12,     0,    13,    14,    15,    16,
      17,    18,    19,     0,     0,     0,     0,     0,    20,    21,
      22,    23,    24,    25,    26,     0,     0,    27,     0,     0,
       0,     0,     0,    28,    29,   249,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    40,     0,    41,    42,     0,
      43,    44,    45,     0,    46,    47,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    48,     0,     0,    49,    50,     0,
      51,    52,     0,    53,     0,     0,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       0,     0,   248,     0,     5,     6,     7,     8,     9,     0,
    -619,  -619,    10,    11,    63,    64,    65,    12,     0,    13,
      14,    15,    16,    17,    18,    19,  -619,  -619,     0,     0,
       0,    20,    21,    22,    23,    24,    25,    26,     0,     0,
      27,     0,     0,     0,     0,     0,    28,    29,   249,    31,
      32,    33,    34,    35,    36,    37,    38,    39,    40,     0,
      41,    42,     0,    43,    44,    45,     0,    46,    47,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,    48,     0,     0,
      49,    50,     0,    51,    52,     0,    53,     0,     0,    54,
      55,    56,    57,    58,    59,    60,    61,    62,     0,     0,
       0,     0,     0,     0,     0,   248,     0,     5,     6,     7,
       8,     9,     0,     0,     0,    10,    11,    63,    64,    65,
      12,     0,    13,    14,    15,    16,    17,    18,    19,  -619,
    -619,     0,     0,     0,    20,    21,    22,    23,    24,    25,
      26,     0,     0,    27,     0,     0,     0,     0,     0,    28,
      29,   249,    31,    32,    33,    34,    35,    36,    37,    38,
      39,    40,     0,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
      48,     0,     0,   250,    50,     0,    51,    52,     0,    53,
       0,     0,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
      63,    64,    65,     0,     0,     0,     0,     0,     0,     0,
    -619,     0,  -619,  -619,   248,     0,     5,     6,     7,     8,
       9,     0,     0,     0,    10,    11,     0,     0,     0,    12,
       0,    13,    14,    15,    16,    17,    18,    19,     0,     0,
       0,     0,     0,    20,    21,    22,    23,    24,    25,    26,
       0,     0,    27,     0,     0,     0,     0,     0,    28,    29,
     249,    31,    32,    33,    34,    35,    36,    37,    38,    39,
      40,     0,    41,    42,     0,    43,    44,    45,     0,    46,
      47,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,    48,
       0,     0,    49,    50,     0,    51,    52,     0,    53,     0,
       0,    54,    55,    56,    57,    58,    59,    60,    61,    62,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,    63,
      64,    65,     0,     0,     0,     0,     0,     0,     0,  -619,
       0,  -619,  -619,   248,     0,     5,     6,     7,     8,     9,
       0,     0,     0,    10,    11,     0,     0,     0,    12,     0,
      13,    14,    15,    16,    17,    18,    19,     0,     0,     0,
       0,     0,    20,    21,    22,    23,    24,    25,    26,     0,
       0,    27,     0,     0,     0,     0,     0,    28,    29,   249,
      31,    32,    33,    34,    35,    36,    37,    38,    39,    40,
       0,    41,    42,     0,    43,    44,    45,     0,    46,    47,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,    48,     0,
       0,    49,    50,     0,    51,    52,     0,    53,     0,     0,
      54,    55,    56,    57,    58,    59,    60,    61,    62,     0,
       0,     0,     0,     0,     0,     0,     4,     0,     5,     6,
       7,     8,     9,     0,     0,     0,    10,    11,    63,    64,
      65,    12,  -619,    13,    14,    15,    16,    17,    18,    19,
    -619,  -619,     0,     0,     0,    20,    21,    22,    23,    24,
      25,    26,     0,     0,    27,     0,     0,     0,     0,     0,
      28,    29,    30,    31,    32,    33,    34,    35,    36,    37,
      38,    39,    40,     0,    41,    42,     0,    43,    44,    45,
       0,    46,    47,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,    48,     0,     0,    49,    50,     0,    51,    52,     0,
      53,     0,     0,    54,    55,    56,    57,    58,    59,    60,
      61,    62,     0,     0,     0,     0,     0,     0,     0,   248,
       0,     5,     6,     7,     8,     9,     0,     0,  -619,    10,
      11,    63,    64,    65,    12,  -619,    13,    14,    15,    16,
      17,    18,    19,  -619,  -619,     0,     0,     0,    20,    21,
      22,    23,    24,    25,    26,     0,     0,    27,     0,     0,
       0,     0,     0,    28,    29,   249,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    40,     0,    41,    42,     0,
      43,    44,    45,     0,    46,    47,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    48,     0,     0,    49,    50,     0,
      51,    52,     0,    53,     0,     0,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       0,     0,   248,     0,     5,     6,     7,     8,     9,     0,
       0,     0,    10,    11,    63,    64,    65,    12,     0,    13,
      14,    15,    16,    17,    18,    19,  -619,  -619,     0,     0,
       0,    20,    21,    22,    23,    24,    25,    26,     0,     0,
      27,     0,     0,     0,     0,     0,    28,    29,   249,    31,
      32,    33,    34,    35,    36,    37,    38,    39,    40,     0,
      41,    42,     0,    43,    44,    45,     0,    46,    47,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,    48,     0,     0,
      49,    50,     0,    51,    52,     0,    53,     0,     0,    54,
      55,    56,    57,    58,    59,    60,    61,    62,     0,  -619,
       0,     0,     0,     0,     0,     0,     0,     5,     6,     7,
       0,     9,     0,     0,     0,    10,    11,    63,    64,    65,
      12,     0,    13,    14,    15,    16,    17,    18,    19,  -619,
    -619,     0,     0,     0,    20,    21,    22,    23,    24,    25,
      26,     0,     0,   200,     0,     0,     0,     0,     0,     0,
      29,     0,     0,    32,    33,    34,    35,    36,    37,    38,
      39,    40,   201,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     202,     0,     0,   203,    50,     0,    51,    52,     0,   204,
     205,   206,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       5,     6,     7,     0,     9,     0,     0,     0,    10,    11,
      63,   207,    65,    12,     0,    13,    14,    15,    16,    17,
      18,    19,     0,   231,     0,     0,     0,    20,    21,    22,
      23,    24,    25,    26,     0,     0,    27,     0,     0,     0,
       0,     0,     0,    29,     0,     0,    32,    33,    34,    35,
      36,    37,    38,    39,    40,     0,    41,    42,     0,    43,
      44,    45,     0,    46,    47,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   202,     0,     0,   203,    50,     0,    51,
      52,     0,     0,     0,     0,    54,    55,    56,    57,    58,
      59,    60,    61,    62,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     5,     6,     7,     0,     9,     0,     0,
       0,    10,    11,    63,    64,    65,    12,     0,    13,    14,
      15,    16,    17,    18,    19,   302,   303,     0,     0,     0,
      20,    21,    22,    23,    24,    25,    26,     0,     0,    27,
       0,     0,     0,     0,     0,     0,    29,     0,     0,    32,
      33,    34,    35,    36,    37,    38,    39,    40,     0,    41,
      42,     0,    43,    44,    45,     0,    46,    47,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   202,     0,     0,   203,
      50,     0,    51,    52,     0,     0,     0,     0,    54,    55,
      56,    57,    58,    59,    60,    61,    62,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     5,     6,     7,     8,
       9,     0,     0,     0,    10,    11,    63,    64,    65,    12,
       0,    13,    14,    15,    16,    17,    18,    19,     0,   231,
       0,     0,     0,    20,    21,    22,    23,    24,    25,    26,
       0,     0,    27,     0,     0,     0,     0,     0,    28,    29,
      30,    31,    32,    33,    34,    35,    36,    37,    38,    39,
      40,     0,    41,    42,     0,    43,    44,    45,     0,    46,
      47,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,    48,
       0,     0,    49,    50,     0,    51,    52,     0,    53,     0,
       0,    54,    55,    56,    57,    58,    59,    60,    61,    62,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     5,
       6,     7,     8,     9,     0,     0,     0,    10,    11,    63,
      64,    65,    12,     0,    13,    14,    15,    16,    17,    18,
      19,   498,     0,     0,     0,     0,    20,    21,    22,    23,
      24,    25,    26,     0,     0,    27,     0,     0,     0,     0,
       0,    28,    29,   249,    31,    32,    33,    34,    35,    36,
      37,    38,    39,    40,     0,    41,    42,     0,    43,    44,
      45,     0,    46,    47,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,    48,     0,     0,    49,    50,     0,    51,    52,
       0,    53,     0,     0,    54,    55,    56,    57,    58,    59,
      60,    61,    62,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,    63,    64,    65,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   498,   118,   119,   120,   121,   122,
     123,   124,   125,   126,   127,   128,   129,   130,   131,   132,
     133,   134,   135,   136,   137,   138,   139,   140,   141,     0,
       0,     0,   142,   143,   144,   384,   385,   386,   387,   149,
     150,   151,     0,     0,     0,     0,     0,   152,   153,   154,
     155,   388,   389,   390,   391,   160,    37,    38,   392,    40,
       0,     0,     0,     0,     0,     0,     0,     0,   162,   163,
     164,   165,   166,   167,   168,   169,   170,     0,     0,   171,
     172,     0,     0,   173,   174,   175,   176,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   177,   178,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   179,   180,
     181,   182,   183,   184,   185,   186,   187,   188,     0,   189,
     190,     0,     0,     0,     0,     0,   191,   393,   118,   119,
     120,   121,   122,   123,   124,   125,   126,   127,   128,   129,
     130,   131,   132,   133,   134,   135,   136,   137,   138,   139,
     140,   141,     0,     0,     0,   142,   143,   144,   145,   146,
     147,   148,   149,   150,   151,     0,     0,     0,     0,     0,
     152,   153,   154,   155,   156,   157,   158,   159,   160,   280,
     281,   161,   282,     0,     0,     0,     0,     0,     0,     0,
       0,   162,   163,   164,   165,   166,   167,   168,   169,   170,
       0,     0,   171,   172,     0,     0,   173,   174,   175,   176,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     177,   178,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   179,   180,   181,   182,   183,   184,   185,   186,   187,
     188,     0,   189,   190,     0,     0,     0,     0,     0,   191,
     118,   119,   120,   121,   122,   123,   124,   125,   126,   127,
     128,   129,   130,   131,   132,   133,   134,   135,   136,   137,
     138,   139,   140,   141,     0,     0,     0,   142,   143,   144,
     145,   146,   147,   148,   149,   150,   151,     0,     0,     0,
       0,     0,   152,   153,   154,   155,   156,   157,   158,   159,
     160,   233,     0,   161,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   162,   163,   164,   165,   166,   167,   168,
     169,   170,     0,     0,   171,   172,     0,     0,   173,   174,
     175,   176,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   177,   178,     0,     0,    55,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   179,   180,   181,   182,   183,   184,   185,
     186,   187,   188,     0,   189,   190,     0,     0,     0,     0,
       0,   191,   118,   119,   120,   121,   122,   123,   124,   125,
     126,   127,   128,   129,   130,   131,   132,   133,   134,   135,
     136,   137,   138,   139,   140,   141,     0,     0,     0,   142,
     143,   144,   145,   146,   147,   148,   149,   150,   151,     0,
       0,     0,     0,     0,   152,   153,   154,   155,   156,   157,
     158,   159,   160,     0,     0,   161,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   162,   163,   164,   165,   166,
     167,   168,   169,   170,     0,     0,   171,   172,     0,     0,
     173,   174,   175,   176,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   177,   178,     0,     0,    55,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   179,   180,   181,   182,   183,
     184,   185,   186,   187,   188,     0,   189,   190,     0,     0,
       0,     0,     0,   191,   118,   119,   120,   121,   122,   123,
     124,   125,   126,   127,   128,   129,   130,   131,   132,   133,
     134,   135,   136,   137,   138,   139,   140,   141,     0,     0,
       0,   142,   143,   144,   145,   146,   147,   148,   149,   150,
     151,     0,     0,     0,     0,     0,   152,   153,   154,   155,
     156,   157,   158,   159,   160,     0,     0,   161,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   162,   163,   164,
     165,   166,   167,   168,   169,   170,     0,     0,   171,   172,
       0,     0,   173,   174,   175,   176,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   177,   178,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   179,   180,   181,
     182,   183,   184,   185,   186,   187,   188,     0,   189,   190,
       5,     6,     7,     0,     9,   191,     0,     0,    10,    11,
       0,     0,     0,    12,     0,    13,    14,    15,   238,   239,
      18,    19,     0,     0,     0,     0,     0,   240,   241,   242,
      23,    24,    25,    26,     0,     0,   200,     0,     0,     0,
       0,     0,     0,   268,     0,     0,    32,    33,    34,    35,
      36,    37,    38,    39,    40,     0,    41,    42,     0,    43,
      44,    45,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   269,     0,     0,   203,    50,     0,    51,
      52,     0,     0,     0,     0,    54,    55,    56,    57,    58,
      59,    60,    61,    62,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     5,     6,     7,     0,
       9,     0,     0,   270,    10,    11,     0,     0,     0,    12,
     271,    13,    14,    15,   238,   239,    18,    19,     0,     0,
       0,     0,     0,   240,   241,   242,    23,    24,    25,    26,
       0,     0,   200,     0,     0,     0,     0,     0,     0,   268,
       0,     0,    32,    33,    34,    35,    36,    37,    38,    39,
      40,     0,    41,    42,     0,    43,    44,    45,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   269,
       0,     0,   203,    50,     0,    51,    52,     0,     0,     0,
       0,    54,    55,    56,    57,    58,    59,    60,    61,    62,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     5,     6,     7,     8,     9,     0,     0,   270,
      10,    11,     0,     0,     0,    12,   518,    13,    14,    15,
      16,    17,    18,    19,     0,     0,     0,     0,     0,    20,
      21,    22,    23,    24,    25,    26,     0,     0,    27,     0,
       0,     0,     0,     0,    28,    29,    30,    31,    32,    33,
      34,    35,    36,    37,    38,    39,    40,     0,    41,    42,
       0,    43,    44,    45,     0,    46,    47,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,    48,     0,     0,    49,    50,
       0,    51,    52,     0,    53,     0,     0,    54,    55,    56,
      57,    58,    59,    60,    61,    62,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     5,     6,     7,     0,     9,
       0,     0,     0,    10,    11,    63,    64,    65,    12,     0,
      13,    14,    15,    16,    17,    18,    19,     0,     0,     0,
       0,     0,    20,    21,    22,    23,    24,    25,    26,     0,
       0,   200,     0,     0,     0,     0,     0,     0,    29,     0,
       0,    32,    33,    34,    35,    36,    37,    38,    39,    40,
     201,    41,    42,     0,    43,    44,    45,     0,    46,    47,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   202,     0,
       0,   203,    50,     0,    51,    52,     0,   204,   205,   206,
      54,    55,    56,    57,    58,    59,    60,    61,    62,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     5,     6,
       7,     8,     9,     0,     0,     0,    10,    11,    63,   207,
      65,    12,     0,    13,    14,    15,    16,    17,    18,    19,
       0,     0,     0,     0,     0,    20,    21,    22,    23,    24,
      25,    26,     0,     0,    27,     0,     0,     0,     0,     0,
      28,    29,     0,    31,    32,    33,    34,    35,    36,    37,
      38,    39,    40,     0,    41,    42,     0,    43,    44,    45,
       0,    46,    47,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,    48,     0,     0,    49,    50,     0,    51,    52,     0,
      53,     0,     0,    54,    55,    56,    57,    58,    59,    60,
      61,    62,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     5,     6,     7,     0,     9,     0,     0,     0,    10,
      11,    63,    64,    65,    12,     0,    13,    14,    15,   238,
     239,    18,    19,     0,     0,     0,     0,     0,   240,   241,
     242,    23,    24,    25,    26,     0,     0,   200,     0,     0,
       0,     0,     0,     0,    29,     0,     0,    32,    33,    34,
      35,    36,    37,    38,    39,    40,   201,    41,    42,     0,
      43,    44,    45,     0,    46,    47,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   202,     0,     0,   203,    50,     0,
      51,    52,     0,   608,   205,   206,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     5,     6,     7,     0,     9,     0,
       0,     0,    10,    11,    63,   207,    65,    12,     0,    13,
      14,    15,   238,   239,    18,    19,     0,     0,     0,     0,
       0,   240,   241,   242,    23,    24,    25,    26,     0,     0,
     200,     0,     0,     0,     0,     0,     0,    29,     0,     0,
      32,    33,    34,    35,    36,    37,    38,    39,    40,   201,
      41,    42,     0,    43,    44,    45,     0,    46,    47,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   202,     0,     0,
     203,    50,     0,    51,    52,     0,   204,   205,     0,    54,
      55,    56,    57,    58,    59,    60,    61,    62,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     5,     6,     7,
       0,     9,     0,     0,     0,    10,    11,    63,   207,    65,
      12,     0,    13,    14,    15,   238,   239,    18,    19,     0,
       0,     0,     0,     0,   240,   241,   242,    23,    24,    25,
      26,     0,     0,   200,     0,     0,     0,     0,     0,     0,
      29,     0,     0,    32,    33,    34,    35,    36,    37,    38,
      39,    40,   201,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     202,     0,     0,   203,    50,     0,    51,    52,     0,     0,
     205,   206,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       5,     6,     7,     0,     9,     0,     0,     0,    10,    11,
      63,   207,    65,    12,     0,    13,    14,    15,   238,   239,
      18,    19,     0,     0,     0,     0,     0,   240,   241,   242,
      23,    24,    25,    26,     0,     0,   200,     0,     0,     0,
       0,     0,     0,    29,     0,     0,    32,    33,    34,    35,
      36,    37,    38,    39,    40,   201,    41,    42,     0,    43,
      44,    45,     0,    46,    47,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   202,     0,     0,   203,    50,     0,    51,
      52,     0,   608,   205,     0,    54,    55,    56,    57,    58,
      59,    60,    61,    62,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     5,     6,     7,     0,     9,     0,     0,
       0,    10,    11,    63,   207,    65,    12,     0,    13,    14,
      15,   238,   239,    18,    19,     0,     0,     0,     0,     0,
     240,   241,   242,    23,    24,    25,    26,     0,     0,   200,
       0,     0,     0,     0,     0,     0,    29,     0,     0,    32,
      33,    34,    35,    36,    37,    38,    39,    40,   201,    41,
      42,     0,    43,    44,    45,     0,    46,    47,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   202,     0,     0,   203,
      50,     0,    51,    52,     0,     0,   205,     0,    54,    55,
      56,    57,    58,    59,    60,    61,    62,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     5,     6,     7,     0,
       9,     0,     0,     0,    10,    11,    63,   207,    65,    12,
       0,    13,    14,    15,    16,    17,    18,    19,     0,     0,
       0,     0,     0,    20,    21,    22,    23,    24,    25,    26,
       0,     0,   200,     0,     0,     0,     0,     0,     0,    29,
       0,     0,    32,    33,    34,    35,    36,    37,    38,    39,
      40,     0,    41,    42,     0,    43,    44,    45,     0,    46,
      47,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   202,
       0,     0,   203,    50,     0,    51,    52,     0,   512,     0,
       0,    54,    55,    56,    57,    58,    59,    60,    61,    62,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     5,
       6,     7,     0,     9,     0,     0,     0,    10,    11,    63,
     207,    65,    12,     0,    13,    14,    15,   238,   239,    18,
      19,     0,     0,     0,     0,     0,   240,   241,   242,    23,
      24,    25,    26,     0,     0,   200,     0,     0,     0,     0,
       0,     0,    29,     0,     0,    32,    33,    34,    35,    36,
      37,    38,    39,    40,     0,    41,    42,     0,    43,    44,
      45,     0,    46,    47,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   202,     0,     0,   203,    50,     0,    51,    52,
       0,   204,     0,     0,    54,    55,    56,    57,    58,    59,
      60,    61,    62,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     5,     6,     7,     0,     9,     0,     0,     0,
      10,    11,    63,   207,    65,    12,     0,    13,    14,    15,
     238,   239,    18,    19,     0,     0,     0,     0,     0,   240,
     241,   242,    23,    24,    25,    26,     0,     0,   200,     0,
       0,     0,     0,     0,     0,    29,     0,     0,    32,    33,
      34,    35,    36,    37,    38,    39,    40,     0,    41,    42,
       0,    43,    44,    45,     0,    46,    47,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   202,     0,     0,   203,    50,
       0,    51,    52,     0,   816,     0,     0,    54,    55,    56,
      57,    58,    59,    60,    61,    62,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     5,     6,     7,     0,     9,
       0,     0,     0,    10,    11,    63,   207,    65,    12,     0,
      13,    14,    15,   238,   239,    18,    19,     0,     0,     0,
       0,     0,   240,   241,   242,    23,    24,    25,    26,     0,
       0,   200,     0,     0,     0,     0,     0,     0,    29,     0,
       0,    32,    33,    34,    35,    36,    37,    38,    39,    40,
       0,    41,    42,     0,    43,    44,    45,     0,    46,    47,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   202,     0,
       0,   203,    50,     0,    51,    52,     0,   512,     0,     0,
      54,    55,    56,    57,    58,    59,    60,    61,    62,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     5,     6,
       7,     0,     9,     0,     0,     0,    10,    11,    63,   207,
      65,    12,     0,    13,    14,    15,   238,   239,    18,    19,
       0,     0,     0,     0,     0,   240,   241,   242,    23,    24,
      25,    26,     0,     0,   200,     0,     0,     0,     0,     0,
       0,    29,     0,     0,    32,    33,    34,    35,    36,    37,
      38,    39,    40,     0,    41,    42,     0,    43,    44,    45,
       0,    46,    47,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   202,     0,     0,   203,    50,     0,    51,    52,     0,
     608,     0,     0,    54,    55,    56,    57,    58,    59,    60,
      61,    62,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     5,     6,     7,     0,     9,     0,     0,     0,    10,
      11,    63,   207,    65,    12,     0,    13,    14,    15,   238,
     239,    18,    19,     0,     0,     0,     0,     0,   240,   241,
     242,    23,    24,    25,    26,     0,     0,   200,     0,     0,
       0,     0,     0,     0,    29,     0,     0,    32,    33,    34,
      35,    36,    37,    38,    39,    40,     0,    41,    42,     0,
      43,    44,    45,     0,    46,    47,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   202,     0,     0,   203,    50,     0,
      51,    52,     0,     0,     0,     0,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     5,     6,     7,     0,     9,     0,
       0,     0,    10,    11,    63,   207,    65,    12,     0,    13,
      14,    15,    16,    17,    18,    19,     0,     0,     0,     0,
       0,    20,    21,    22,    23,    24,    25,    26,     0,     0,
      27,     0,     0,     0,     0,     0,     0,    29,     0,     0,
      32,    33,    34,    35,    36,    37,    38,    39,    40,     0,
      41,    42,     0,    43,    44,    45,     0,    46,    47,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   202,     0,     0,
     203,    50,     0,    51,    52,     0,     0,     0,     0,    54,
      55,    56,    57,    58,    59,    60,    61,    62,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     5,     6,     7,
       0,     9,     0,     0,     0,    10,    11,    63,    64,    65,
      12,     0,    13,    14,    15,    16,    17,    18,    19,     0,
       0,     0,     0,     0,    20,    21,    22,    23,    24,    25,
      26,     0,     0,   200,     0,     0,     0,     0,     0,     0,
      29,     0,     0,    32,    33,    34,    35,    36,    37,    38,
      39,    40,     0,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     202,     0,     0,   203,    50,     0,    51,    52,     0,     0,
       0,     0,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       5,     6,     7,     0,     9,     0,     0,     0,    10,    11,
      63,   207,    65,    12,     0,    13,    14,    15,   238,   239,
      18,    19,     0,     0,     0,     0,     0,   240,   241,   242,
      23,    24,    25,    26,     0,     0,   200,     0,     0,     0,
       0,     0,     0,   268,     0,     0,    32,    33,    34,    35,
      36,    37,    38,    39,    40,     0,    41,    42,     0,    43,
      44,    45,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   269,     0,     0,   323,    50,     0,    51,
      52,     0,   324,     0,     0,    54,    55,    56,    57,    58,
      59,    60,    61,    62,     0,     0,     0,     0,     0,     5,
       6,     7,     0,     9,     0,     0,     0,    10,    11,     0,
       0,     0,    12,   270,    13,    14,    15,   238,   239,    18,
      19,     0,     0,     0,     0,     0,   240,   241,   242,    23,
      24,    25,    26,     0,     0,   200,     0,     0,     0,     0,
       0,     0,   268,     0,     0,    32,    33,    34,    35,    36,
      37,    38,    39,    40,     0,    41,    42,     0,    43,    44,
      45,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   365,     0,     0,    49,    50,     0,    51,    52,
       0,    53,     0,     0,    54,    55,    56,    57,    58,    59,
      60,    61,    62,     0,     0,     0,     0,     0,     5,     6,
       7,     0,     9,     0,     0,     0,    10,    11,     0,     0,
       0,    12,   270,    13,    14,    15,   238,   239,    18,    19,
       0,     0,     0,     0,     0,   240,   241,   242,    23,    24,
      25,    26,     0,     0,   200,     0,     0,     0,     0,     0,
       0,   268,     0,     0,    32,    33,    34,   373,    36,    37,
      38,   374,    40,     0,    41,    42,     0,    43,    44,    45,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   375,     0,
       0,   376,     0,     0,   203,    50,     0,    51,    52,     0,
       0,     0,     0,    54,    55,    56,    57,    58,    59,    60,
      61,    62,     0,     0,     0,     0,     0,     5,     6,     7,
       0,     9,     0,     0,     0,    10,    11,     0,     0,     0,
      12,   270,    13,    14,    15,   238,   239,    18,    19,     0,
       0,     0,     0,     0,   240,   241,   242,    23,    24,    25,
      26,     0,     0,   200,     0,     0,     0,     0,     0,     0,
     268,     0,     0,    32,    33,    34,   373,    36,    37,    38,
     374,    40,     0,    41,    42,     0,    43,    44,    45,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     376,     0,     0,   203,    50,     0,    51,    52,     0,     0,
       0,     0,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     5,     6,     7,     0,
       9,     0,     0,     0,    10,    11,     0,     0,     0,    12,
     270,    13,    14,    15,   238,   239,    18,    19,     0,     0,
       0,     0,     0,   240,   241,   242,    23,    24,    25,    26,
       0,     0,   200,     0,     0,     0,     0,     0,     0,   268,
       0,     0,    32,    33,    34,    35,    36,    37,    38,    39,
      40,     0,    41,    42,     0,    43,    44,    45,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   269,
       0,     0,   323,    50,     0,    51,    52,     0,     0,     0,
       0,    54,    55,    56,    57,    58,    59,    60,    61,    62,
       0,     0,     0,     0,     0,     5,     6,     7,     0,     9,
       0,     0,     0,    10,    11,     0,     0,     0,    12,   270,
      13,    14,    15,   238,   239,    18,    19,     0,     0,     0,
       0,     0,   240,   241,   242,    23,    24,    25,    26,     0,
       0,   200,     0,     0,     0,     0,     0,     0,   268,     0,
       0,    32,    33,    34,    35,    36,    37,    38,    39,    40,
       0,    41,    42,     0,    43,    44,    45,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   893,     0,
       0,   203,    50,     0,    51,    52,     0,     0,     0,     0,
      54,    55,    56,    57,    58,    59,    60,    61,    62,     0,
       0,     0,     0,     0,     5,     6,     7,     0,     9,     0,
       0,     0,    10,    11,     0,     0,     0,    12,   270,    13,
      14,    15,   238,   239,    18,    19,     0,     0,     0,     0,
       0,   240,   241,   242,    23,    24,    25,    26,     0,     0,
     200,     0,     0,     0,     0,     0,     0,   268,     0,     0,
      32,    33,    34,    35,    36,    37,    38,    39,    40,     0,
      41,    42,     0,    43,    44,    45,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   973,     0,     0,
     203,    50,     0,    51,    52,     0,     0,     0,     0,    54,
      55,    56,    57,    58,    59,    60,    61,    62,     0,     0,
       0,     0,     0,     0,   553,   554,     0,     0,   555,     0,
       0,     0,     0,     0,     0,     0,     0,   270,   162,   163,
     164,   165,   166,   167,   168,   169,   170,     0,     0,   171,
     172,     0,     0,   173,   174,   175,   176,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   177,   178,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   179,   180,
     181,   182,   183,   184,   185,   186,   187,   188,     0,   189,
     190,   561,   562,     0,     0,   563,   191,     0,     0,     0,
       0,     0,     0,     0,     0,   162,   163,   164,   165,   166,
     167,   168,   169,   170,     0,     0,   171,   172,     0,     0,
     173,   174,   175,   176,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   177,   178,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   179,   180,   181,   182,   183,
     184,   185,   186,   187,   188,     0,   189,   190,   598,   562,
       0,     0,   599,   191,     0,     0,     0,     0,     0,     0,
       0,     0,   162,   163,   164,   165,   166,   167,   168,   169,
     170,     0,     0,   171,   172,     0,     0,   173,   174,   175,
     176,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   177,   178,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   179,   180,   181,   182,   183,   184,   185,   186,
     187,   188,     0,   189,   190,   612,   554,     0,     0,   613,
     191,     0,     0,     0,     0,     0,     0,     0,     0,   162,
     163,   164,   165,   166,   167,   168,   169,   170,     0,     0,
     171,   172,     0,     0,   173,   174,   175,   176,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   177,   178,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   179,
     180,   181,   182,   183,   184,   185,   186,   187,   188,     0,
     189,   190,   615,   562,     0,     0,   616,   191,     0,     0,
       0,     0,     0,     0,     0,     0,   162,   163,   164,   165,
     166,   167,   168,   169,   170,     0,     0,   171,   172,     0,
       0,   173,   174,   175,   176,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   177,   178,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   179,   180,   181,   182,
     183,   184,   185,   186,   187,   188,     0,   189,   190,   639,
     554,     0,     0,   640,   191,     0,     0,     0,     0,     0,
       0,     0,     0,   162,   163,   164,   165,   166,   167,   168,
     169,   170,     0,     0,   171,   172,     0,     0,   173,   174,
     175,   176,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   177,   178,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   179,   180,   181,   182,   183,   184,   185,
     186,   187,   188,     0,   189,   190,   642,   562,     0,     0,
     643,   191,     0,     0,     0,     0,     0,     0,     0,     0,
     162,   163,   164,   165,   166,   167,   168,   169,   170,     0,
       0,   171,   172,     0,     0,   173,   174,   175,   176,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   177,
     178,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     179,   180,   181,   182,   183,   184,   185,   186,   187,   188,
       0,   189,   190,   727,   554,     0,     0,   728,   191,     0,
       0,     0,     0,     0,     0,     0,     0,   162,   163,   164,
     165,   166,   167,   168,   169,   170,     0,     0,   171,   172,
       0,     0,   173,   174,   175,   176,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   177,   178,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   179,   180,   181,
     182,   183,   184,   185,   186,   187,   188,     0,   189,   190,
     730,   562,     0,     0,   731,   191,     0,     0,     0,     0,
       0,     0,     0,     0,   162,   163,   164,   165,   166,   167,
     168,   169,   170,     0,     0,   171,   172,     0,     0,   173,
     174,   175,   176,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   177,   178,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   179,   180,   181,   182,   183,   184,
     185,   186,   187,   188,     0,   189,   190,   737,   554,     0,
       0,   738,   191,     0,     0,     0,     0,     0,     0,     0,
       0,   162,   163,   164,   165,   166,   167,   168,   169,   170,
       0,     0,   171,   172,     0,     0,   173,   174,   175,   176,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     177,   178,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   179,   180,   181,   182,   183,   184,   185,   186,   187,
     188,     0,   189,   190,  1001,   554,     0,     0,  1002,   191,
       0,     0,     0,     0,     0,     0,     0,     0,   162,   163,
     164,   165,   166,   167,   168,   169,   170,     0,     0,   171,
     172,     0,     0,   173,   174,   175,   176,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   177,   178,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   179,   180,
     181,   182,   183,   184,   185,   186,   187,   188,     0,   189,
     190,  1036,   554,     0,     0,  1037,   191,     0,     0,     0,
       0,     0,     0,     0,     0,   162,   163,   164,   165,   166,
     167,   168,   169,   170,     0,     0,   171,   172,     0,     0,
     173,   174,   175,   176,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   177,   178,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   179,   180,   181,   182,   183,
     184,   185,   186,   187,   188,     0,   189,   190,  1039,   562,
       0,     0,  1040,   191,     0,     0,     0,     0,     0,     0,
       0,     0,   162,   163,   164,   165,   166,   167,   168,   169,
     170,     0,     0,   171,   172,     0,     0,   173,   174,   175,
     176,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   177,   178,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   179,   180,   181,   182,   183,   184,   185,   186,
     187,   188,     0,   189,   190,     0,     0,     0,     0,     0,
     191
    //[
  ];

  // YYCHECK.
  var yycheck_ = this.yycheck_ =
  [
    //]
         2,    55,    96,    16,    17,     8,    79,    20,    22,    64,
     354,   326,    16,    17,     8,   220,    20,    50,    27,     8,
      29,   472,   326,    28,    87,    28,   359,    90,   412,   353,
       4,   355,   420,    74,    28,     2,   420,     4,    53,    28,
      94,   668,    49,    90,   575,   594,   614,    51,   262,    51,
      52,   685,   266,    86,    87,   574,    67,    90,   440,   468,
      74,    55,    27,   651,    79,   786,     2,   376,     4,    49,
     458,   508,   416,   641,   511,   399,    91,    92,    93,   906,
      16,    17,    53,    25,    20,   874,    25,   472,    67,   778,
      13,   415,   715,   417,    16,    17,   719,    61,    20,    25,
      94,   872,    37,    38,    61,     0,    13,   230,    29,   518,
     776,    90,    85,    49,    50,   250,    26,    53,   135,   443,
     113,    76,   139,    61,     1,    25,   470,    25,    64,    85,
      16,    17,   255,   139,    20,   801,   259,    85,   902,    13,
     133,   703,    85,    79,   778,   596,   110,   471,   710,   141,
      86,    87,   786,   110,    90,    91,    92,    93,   131,   132,
     286,   729,   288,   118,   290,    51,    52,   938,   294,   107,
      25,   109,   740,   138,   139,   131,   132,    25,   805,   806,
      26,    13,   770,   771,   132,    25,  1013,   736,   323,   132,
     111,   133,    25,   135,   133,   744,   203,   230,   271,   232,
      13,   990,   243,   141,   139,   252,   657,   133,   897,   135,
     133,   224,   214,   226,   227,   138,   139,   129,   220,   129,
     224,   992,   226,   944,   429,   227,    87,    56,   135,    13,
     237,   138,   139,   133,   622,   133,   580,   621,   622,  1003,
     117,   252,   141,   250,   307,   308,   309,   310,   592,    25,
     632,    52,   113,   690,  1025,    56,   271,   581,   885,   268,
     949,   138,   139,   897,   138,   139,   321,   203,   902,   593,
     250,   326,   657,   252,   307,   308,   309,   310,   133,   312,
     313,   248,   591,   129,   872,   133,   874,   696,   224,   135,
     226,   227,   743,   133,   230,    28,   232,   360,   361,   422,
     133,   237,   224,   426,   226,   928,   138,   139,   431,   324,
     944,    97,   248,   141,   250,   362,   323,   321,    85,  1008,
     141,    85,   326,    68,   447,   138,   139,   360,   361,   452,
      59,    60,   306,   852,   120,   271,   963,   113,   224,   306,
     226,   354,   375,   323,   311,    61,   133,   402,   403,    65,
     938,   939,   354,   324,   138,   139,    26,   133,   743,   485,
     136,   355,    85,   139,    25,   132,   492,   131,   132,  1003,
     306,   307,   308,   309,   310,   311,   312,   313,   123,   124,
     125,   930,   697,   362,    85,   321,   113,   323,   324,    85,
     326,   107,   725,   109,   517,   468,   685,   928,   113,   378,
      85,   133,   990,   416,   992,   399,   611,   139,    61,   132,
     714,    85,    26,    85,   416,    85,    85,    26,   354,    54,
     356,   100,   636,   417,   360,   361,   428,   429,    63,    64,
     131,   132,   437,    26,   437,   131,   132,  1025,   440,   375,
     989,    61,    87,   437,    85,   518,   131,   132,   437,   443,
     135,    85,   113,   468,   107,    85,   109,   470,   132,   129,
     132,   131,   132,   132,    61,   135,   402,   403,   470,    87,
    1038,    85,   133,   440,   133,   136,    85,   471,   139,   867,
     416,    87,   113,   867,   935,    14,    15,   107,   141,   109,
     110,   132,    85,    87,    85,   113,   135,   786,   132,    56,
     789,   131,   132,   518,   440,   507,   508,   113,    61,   511,
     107,    85,   109,   110,   450,   129,   557,   131,   132,   113,
     129,   135,   131,   132,   565,    52,   412,    54,    55,    56,
      57,   133,   468,   542,   470,    87,   129,   139,   131,   132,
     131,   132,   135,    52,   558,    54,    55,    56,    57,    87,
      85,   560,   566,   133,   107,   760,   109,   110,   132,   600,
      88,   113,   595,   570,   637,   572,   568,   580,   670,   455,
     672,    85,   576,   133,    85,   113,   577,    87,   580,   592,
      85,   133,   518,   916,    87,   133,   600,   581,    87,   922,
     592,   139,   625,   135,   573,   574,   131,   132,   600,   593,
     605,    61,   605,   113,   129,   614,   133,    68,   587,   611,
     113,   605,   135,   902,    85,   904,   605,   131,   132,   742,
     131,   132,   637,   696,   133,   113,   131,   132,    85,    58,
     632,    15,   641,    17,   570,   135,   572,    56,   761,    68,
     138,   139,   697,   136,   580,   700,   701,   107,   685,   109,
     110,   774,   707,   708,   748,   944,   592,   946,   594,   595,
     131,   132,   951,   704,   666,   632,   668,    96,    97,   732,
     711,    68,   735,  1017,   131,   132,   685,    37,    38,   686,
      58,   696,   689,   137,   691,   130,    83,    84,   690,   625,
      68,   120,   746,   133,  1018,   110,   632,    59,    60,   732,
     110,   637,   735,   685,    40,    41,    42,    43,    44,   711,
     714,   110,   714,   715,  1003,   717,  1005,   719,    96,    97,
     729,  1010,   110,   724,   121,   122,   123,   124,   125,    61,
      87,   740,   133,    68,    68,   621,   859,    17,  1027,    94,
     741,    56,   120,   780,   138,   136,    25,   784,   871,   130,
     686,   133,   746,   689,   733,   691,   113,    68,   760,  1048,
     696,   697,   133,   129,   700,   701,   745,   776,     2,   133,
       4,   707,   708,   828,   133,   107,   133,   109,   110,   842,
     882,   883,    16,    17,   799,   887,    20,   889,   890,   141,
     141,    87,   801,   133,   133,    87,   732,   113,   780,   735,
     736,    10,   133,   805,   806,   135,     8,   814,   744,   842,
     121,   122,   123,   124,   125,    49,    50,   113,    13,   113,
      87,   113,   130,   133,    54,    55,   133,    57,    52,   133,
      64,   133,   839,    63,    64,   837,    52,   133,   840,   846,
     847,   133,   843,   850,   845,    52,   113,    54,    55,    56,
      57,    58,    86,    87,   855,    87,    90,   133,    52,   860,
     897,    68,   899,   799,   133,   902,   133,   904,   115,   137,
     877,   878,    87,   852,    15,   854,   133,   892,   814,   808,
     809,   113,    89,   885,   891,   130,   113,   133,    95,    96,
      97,   133,   828,   118,   996,   997,   998,   999,   113,   138,
     915,   133,   133,   839,   133,   133,   842,    10,   130,    10,
     846,   847,   919,   120,   850,   897,   123,   899,   133,   133,
     902,    88,   904,     9,   925,   926,   928,   133,   136,   133,
     133,    56,   139,    52,   133,    54,    55,    56,    57,    58,
     133,   877,   878,   118,  1046,   130,   133,   133,    52,    68,
      54,    55,    56,    57,    10,   891,   892,   130,   108,   133,
     969,   963,   133,   133,   133,    56,  1003,   133,  1005,   203,
      89,  1008,   979,  1010,   981,   133,   135,    96,    97,   915,
     987,   135,   133,   919,   450,    89,    91,   988,  1020,   711,
     224,    95,   226,   227,   930,    93,   230,   770,   232,   685,
     749,   120,    99,   237,  1017,    52,   294,    54,    55,    56,
      57,  1048,    57,  1013,   248,  1017,   250,  1019,  1020,    94,
    1021,  1003,  1023,  1005,  1018,   780,  1008,   935,  1010,  1038,
     899,   960,   961,  1019,   897,   964,   778,   966,   967,    -1,
     396,    -1,    89,   979,    68,   981,    -1,    -1,    95,    -1,
      -1,   987,    52,   989,    54,    55,    56,    57,    -1,    83,
      84,    -1,    -1,    -1,    -1,    -1,  1048,    -1,    -1,    -1,
      -1,    -1,   306,   307,   308,   309,   310,   311,   312,   313,
      52,  1017,    54,    55,    56,    57,    -1,   321,    -1,   323,
      -1,    -1,   326,    -1,   118,   119,   120,   121,   122,   123,
     124,   125,  1031,  1032,  1033,  1034,    -1,    -1,    52,    -1,
      54,    55,    56,    57,    58,    -1,    -1,    89,    -1,    -1,
     354,    -1,   356,    -1,    68,  1054,   360,   361,    -1,    -1,
      -1,    -1,    -1,    -1,    52,    -1,    54,    55,    56,    57,
      58,   375,    -1,    -1,    -1,    89,    -1,    -1,     0,    -1,
      68,    -1,    96,    97,    -1,    -1,     8,     9,    10,    -1,
      -1,    13,    14,    15,    -1,    17,    -1,    -1,   402,   403,
      -1,    89,    -1,    -1,    26,    27,   120,    95,    96,    97,
      -1,    -1,   416,    -1,    -1,    37,    38,    -1,    40,    41,
      42,    43,    44,    -1,    52,    -1,    54,    55,    56,    57,
      58,    -1,   120,    -1,    -1,   123,   440,    -1,    -1,    -1,
      68,    -1,    -1,    -1,    68,    -1,   450,   135,    -1,    -1,
      -1,    -1,    -1,    -1,    16,    17,    -1,    -1,    20,    83,
      84,    89,    -1,    85,    -1,    -1,   470,    95,    96,    97,
      -1,    -1,    -1,    -1,    -1,    52,    -1,    54,    55,    56,
      57,    58,    -1,    -1,    46,    47,   108,    -1,    -1,    51,
      52,    68,   120,    -1,    -1,   123,   120,   121,   122,   123,
     124,   125,    64,    65,    -1,    44,    -1,   129,   130,    -1,
     132,    -1,    89,   135,   136,    -1,   138,   139,    95,    96,
      97,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    68,
      69,    70,    71,    72,    73,    74,    75,    76,    77,    78,
      79,    80,    -1,   120,    83,    84,   123,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   135,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   570,    -1,   572,    -1,
      -1,    -1,    -1,    -1,    -1,   114,   580,   116,   117,   118,
     119,   120,   121,   122,   123,   124,   125,    -1,   592,    -1,
     594,   595,    -1,    -1,   133,    -1,    -1,    -1,    -1,    -1,
      -1,    68,    69,    70,    71,    72,    73,    74,    75,    76,
      77,    78,    79,    80,    -1,    -1,    83,    84,    -1,    -1,
      -1,   625,    -1,    -1,    -1,    -1,    -1,    -1,   632,    -1,
      -1,    -1,     2,    -1,     4,    -1,    -1,    -1,    -1,   201,
      -1,    -1,   204,   205,   206,   207,    -1,   114,    52,   116,
     117,   118,   119,   120,   121,   122,   123,   124,   125,    -1,
      -1,    -1,   224,    -1,   226,   227,    -1,    -1,    -1,    -1,
      -1,    -1,   139,    -1,    -1,    -1,    -1,    -1,    -1,    49,
      -1,    -1,   686,    53,    -1,   689,    -1,   691,    -1,    -1,
      -1,    -1,    -1,   697,    -1,    -1,   700,   701,    -1,    -1,
      -1,    -1,    -1,   707,   708,    -1,    -1,    -1,    -1,    79,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    91,    92,    93,    94,    -1,    -1,    -1,   732,    -1,
      -1,   735,   736,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     744,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   321,
      -1,    -1,    -1,    -1,   326,   327,   328,   329,   330,   331,
     332,   333,   334,   335,   336,   337,   338,   339,   340,   341,
     342,   343,   344,   345,   346,   347,   348,   349,   350,   351,
     352,    -1,   354,    -1,    -1,    -1,    -1,   201,    -1,    -1,
     204,   205,   206,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     814,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   828,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   203,    -1,   839,    -1,    -1,   842,    -1,
     402,   403,   846,   847,    -1,    -1,   850,    -1,   410,   411,
     412,    -1,    -1,    -1,   416,    -1,   418,   419,   420,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   237,    -1,    -1,
      -1,    -1,    -1,   877,   878,    -1,    -1,   439,   248,    -1,
     250,    -1,   444,    -1,    -1,    -1,    -1,   891,    -1,    -1,
      -1,    -1,    -1,   455,    -1,    -1,   458,    -1,    -1,    -1,
      -1,   271,    -1,    -1,    -1,     2,    -1,     4,   470,    -1,
      -1,    -1,    -1,    -1,    -1,   919,    -1,   321,    -1,    -1,
      -1,     2,   326,     4,    -1,    -1,   930,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   496,   497,   306,    -1,    -1,    -1,
      -1,   311,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     512,    -1,    49,   323,   324,    -1,    53,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    49,    -1,
      -1,    -1,    53,    -1,    -1,   979,    -1,   981,    -1,    -1,
      -1,    -1,    79,   987,    -1,   989,   356,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    91,    92,    93,    94,    79,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   411,   412,    -1,
      91,    92,    93,  1017,   576,    -1,   420,    -1,   580,    -1,
      52,    -1,    54,    55,    56,    57,    58,    -1,    -1,    -1,
     592,    -1,    -1,    -1,    -1,    -1,    68,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   608,    -1,    -1,    -1,
      -1,   455,    -1,    -1,   458,    -1,    -1,    89,    -1,   621,
     622,    -1,    -1,    95,    96,    97,    -1,    -1,    -1,    -1,
     440,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     450,    -1,    -1,    -1,    -1,    -1,    -1,   649,   120,    -1,
      -1,   123,    -1,    -1,    -1,    -1,    -1,    -1,   468,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   203,    -1,   512,    -1,
      -1,    -1,    -1,    -1,     2,    -1,     4,    -1,    -1,    -1,
      -1,    -1,   203,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
       2,   693,     4,    -1,    -1,   697,   698,    -1,   700,   701,
     237,    -1,    -1,    -1,    -1,   707,   708,    -1,   518,    -1,
      -1,   248,   714,   250,    -1,    -1,   237,    -1,    -1,    -1,
      -1,    49,    -1,    -1,    -1,    -1,    -1,   248,    -1,   250,
      -1,    -1,   576,    -1,   271,    -1,    -1,    49,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   751,
     271,    -1,    -1,   755,   756,    -1,   758,   759,    -1,    -1,
     570,    -1,   572,    91,   608,   767,    -1,    -1,    -1,   306,
      -1,    -1,    -1,    -1,   311,    -1,    -1,   621,   622,    -1,
      -1,    -1,    -1,    -1,   594,   306,   323,   324,    -1,    -1,
     311,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,   323,   324,    -1,   649,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   816,    -1,    -1,    -1,   820,   356,
      -1,    -1,   632,    -1,    -1,    -1,   828,   637,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   356,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   849,    -1,   693,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   866,   867,    -1,    -1,    -1,    -1,
     714,    -1,    -1,    -1,    -1,   203,   686,    -1,    -1,   689,
      -1,   691,    -1,    -1,    -1,    -1,   696,    -1,    -1,    -1,
      -1,   203,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   440,    -1,    -1,    -1,    -1,    -1,   237,
      -1,    -1,    -1,   450,    -1,    -1,    -1,    -1,    -1,   440,
     248,    -1,   250,   767,    -1,   237,   736,    -1,    -1,   450,
      -1,   468,    -1,    -1,   744,    -1,   248,    -1,   250,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   468,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,   816,    -1,    -1,    -1,    -1,    -1,   306,    -1,
      -1,   518,    -1,   311,    -1,    -1,    -1,    -1,    -1,   799,
      -1,    -1,    -1,    -1,   306,   323,    -1,   518,   326,   311,
      -1,    -1,    -1,    -1,   814,   849,    -1,    -1,    -1,    -1,
      -1,   323,    -1,    -1,    -1,  1017,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   867,    -1,    -1,    -1,    -1,   356,   839,
      -1,    -1,    -1,   570,    -1,   572,   846,   847,    -1,    -1,
     850,    -1,    -1,    -1,   356,    -1,    -1,    -1,    -1,   570,
      -1,   572,    -1,    -1,    -1,    -1,    -1,   594,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   877,   878,    -1,
      -1,    -1,    -1,   594,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   891,   892,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   632,    -1,    -1,    -1,    -1,
     637,    -1,    -1,    -1,    -1,   915,    -1,    -1,    -1,   919,
      -1,   632,   440,    -1,    -1,    -1,   637,    -1,    -1,    -1,
     930,    -1,   450,    -1,    -1,    -1,    -1,    -1,   440,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   450,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   686,
      -1,    -1,   689,    -1,   691,   676,    44,    -1,    -1,   696,
      -1,    -1,    -1,    -1,    -1,   686,    -1,    -1,   689,   979,
     691,   981,    -1,    -1,    -1,   696,    -1,   987,    -1,   989,
      68,    69,    70,    71,    72,    73,    74,    75,    76,    77,
      78,    79,    80,    -1,    -1,    83,    84,    -1,    -1,   736,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   744,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   736,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   744,    -1,    -1,   114,    -1,   116,   117,
     118,   119,   120,   121,   122,   123,   124,   125,    -1,    -1,
      -1,    -1,   570,    -1,   572,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   570,    -1,
     572,    -1,   799,    -1,    -1,    -1,   594,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   814,   799,    -1,
      -1,    -1,   594,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   814,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,   839,    -1,   632,    -1,    -1,    -1,    -1,   846,
     847,    -1,    -1,   850,    -1,    -1,    -1,    -1,   839,    -1,
     632,    -1,    -1,    -1,    -1,   846,   847,    -1,    -1,   850,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     877,   878,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   891,   892,   877,   878,   686,    -1,
      -1,   689,    -1,   691,    -1,    -1,    -1,    -1,    -1,   697,
     891,   892,    -1,    -1,   686,    -1,    -1,   689,   915,   691,
      -1,    -1,   919,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   930,   915,    -1,    -1,    -1,   919,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   736,   930,
      -1,    -1,    -1,    -1,    -1,    -1,   744,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   736,    68,    69,    70,    71,    72,
      73,    74,   744,    -1,    77,    78,    -1,    -1,    -1,    -1,
      83,    84,   979,    -1,   981,    -1,    -1,    -1,    -1,    -1,
     987,    -1,   989,    -1,    -1,    -1,    -1,    -1,   979,    -1,
     981,    -1,    -1,    -1,    -1,    -1,   987,    -1,   989,    -1,
      -1,    -1,    -1,   116,   117,   118,   119,   120,   121,   122,
     123,   124,   125,    -1,    -1,    -1,   814,    -1,    -1,    -1,
      -1,    68,    69,    70,    71,    72,    73,    74,    75,    -1,
      77,    78,   814,    -1,    -1,    -1,    83,    84,    -1,    -1,
      -1,   839,    -1,    -1,    -1,    -1,    -1,    -1,   846,   847,
      -1,    -1,   850,    -1,    -1,    -1,    -1,   839,    -1,    -1,
      -1,    -1,    -1,    -1,   846,   847,    -1,    -1,   850,   116,
     117,   118,   119,   120,   121,   122,   123,   124,   125,   877,
     878,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   891,    -1,   877,   878,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   891,
      68,    69,    70,    71,    72,    73,    74,   915,    -1,    77,
      78,   919,    -1,    -1,    -1,    83,    84,    -1,    -1,    -1,
      -1,    -1,   930,    -1,    -1,    -1,    -1,   919,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   930,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   116,   117,
     118,   119,   120,   121,   122,   123,   124,   125,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   979,    -1,   981,    -1,    -1,    -1,    -1,    -1,   987,
      -1,   989,    -1,    -1,    -1,    -1,    -1,   979,    -1,   981,
      -1,    -1,    -1,    -1,    -1,   987,    -1,   989,     0,     1,
      -1,     3,     4,     5,     6,     7,    -1,    -1,    -1,    11,
      12,    -1,    -1,    -1,    16,    -1,    18,    19,    20,    21,
      22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,
      32,    33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,
      -1,    -1,    -1,    45,    46,    47,    48,    49,    50,    51,
      52,    53,    54,    55,    56,    57,    -1,    59,    60,    -1,
      62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,
      92,    93,    -1,    95,    -1,    -1,    98,    99,   100,   101,
     102,   103,   104,   105,   106,     0,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,     8,     9,    10,    -1,    -1,    13,    14,
      15,    -1,    17,    -1,   126,   127,   128,    -1,    44,    -1,
      -1,    26,    27,    28,    29,    -1,   138,   139,    -1,    -1,
      -1,    -1,    37,    38,    -1,    40,    41,    42,    43,    44,
      -1,    -1,    68,    69,    70,    71,    72,    73,    74,    75,
      76,    77,    78,    79,    80,    -1,    -1,    83,    84,    -1,
      -1,    -1,    -1,    68,    69,    70,    71,    72,    73,    74,
      75,    76,    77,    78,    79,    80,    -1,    -1,    83,    84,
      85,    -1,    87,    88,    -1,    -1,    -1,    -1,   114,    94,
     116,   117,   118,   119,   120,   121,   122,   123,   124,   125,
      -1,    -1,    -1,   108,    -1,    -1,   111,    -1,   113,   114,
     115,   116,   117,   118,   119,   120,   121,   122,   123,   124,
     125,    -1,    -1,    -1,   129,   130,   131,   132,   133,     0,
      -1,   136,   137,   138,   139,    -1,    -1,     8,     9,    10,
      -1,    -1,    13,    14,    15,    -1,    17,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    25,    -1,    27,    28,    29,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    37,    38,    -1,    40,
      41,    42,    43,    44,    -1,    -1,    68,    69,    70,    71,
      72,    73,    74,    75,    76,    77,    78,    79,    80,    -1,
      -1,    83,    84,    -1,    -1,    -1,    -1,    68,    69,    70,
      71,    72,    73,    74,    75,    76,    77,    78,    79,    80,
      -1,    -1,    83,    84,    85,    -1,    87,    88,    -1,    -1,
      -1,    -1,   114,    94,   116,   117,   118,   119,   120,   121,
     122,   123,   124,   125,    -1,    -1,    -1,   108,    -1,    -1,
     111,    -1,   113,   114,   115,   116,   117,   118,   119,   120,
     121,   122,   123,   124,   125,    -1,    -1,    -1,    -1,   130,
     131,   132,   133,     0,    -1,   136,   137,   138,   139,    -1,
      -1,     8,     9,    10,    -1,    -1,    13,    14,    15,    -1,
      17,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    25,    -1,
      27,    28,    29,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      37,    38,    -1,    40,    41,    42,    43,    44,    -1,    -1,
      68,    69,    70,    71,    72,    73,    74,    75,    76,    77,
      78,    79,    80,    -1,    -1,    83,    84,    -1,    -1,    -1,
      -1,    68,    69,    70,    71,    72,    73,    74,    75,    76,
      77,    78,    79,    80,    -1,    -1,    83,    84,    85,    -1,
      87,    88,    -1,    -1,    -1,    -1,    -1,    94,   116,   117,
     118,   119,   120,   121,   122,   123,   124,   125,    -1,    -1,
      -1,   108,    -1,    -1,   111,    -1,   113,   114,   115,   116,
     117,   118,   119,   120,   121,   122,   123,   124,   125,    -1,
      -1,    -1,    -1,   130,   131,   132,   133,     0,    -1,   136,
     137,   138,   139,    -1,    -1,     8,     9,    10,    -1,    -1,
      13,    14,    15,    -1,    17,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    26,    27,    28,    29,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    37,    38,    -1,    40,    41,    42,
      43,    44,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    68,    69,    70,    71,    72,
      73,    74,    75,    76,    77,    78,    79,    80,    -1,    -1,
      83,    84,    85,    -1,    -1,    88,    -1,    -1,    -1,    -1,
      -1,    94,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   108,    -1,    -1,   111,    -1,
      -1,   114,   115,   116,   117,   118,   119,   120,   121,   122,
     123,   124,   125,    -1,    -1,    -1,   129,   130,   131,   132,
     133,     0,    -1,   136,   137,   138,   139,    -1,    -1,     8,
       9,    10,    -1,    -1,    13,    14,    15,    -1,    17,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    26,    27,    28,
      29,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    37,    38,
      -1,    40,    41,    42,    43,    44,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    68,
      69,    70,    71,    72,    73,    74,    75,    76,    77,    78,
      79,    80,    -1,    -1,    83,    84,    85,    -1,    -1,    88,
      -1,    -1,    -1,    -1,    -1,    94,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   108,
      -1,    -1,   111,    -1,    -1,   114,   115,   116,   117,   118,
     119,   120,   121,   122,   123,   124,   125,    -1,    -1,    -1,
     129,   130,   131,   132,   133,     0,    -1,   136,   137,   138,
     139,    -1,    -1,     8,     9,    10,    -1,    -1,    13,    14,
      15,    -1,    17,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    27,    28,    29,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    37,    38,    -1,    40,    41,    42,    43,    44,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    68,    69,    70,    71,    72,    73,    74,
      75,    76,    77,    78,    79,    80,    -1,    -1,    83,    84,
      85,    -1,    87,    88,    -1,    -1,    -1,    -1,    -1,    94,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   108,    -1,    -1,   111,    -1,   113,   114,
     115,   116,   117,   118,   119,   120,   121,   122,   123,   124,
     125,    -1,    -1,    -1,    -1,   130,   131,   132,   133,     0,
      -1,   136,   137,   138,   139,    -1,    -1,     8,     9,    10,
      -1,    -1,    13,    14,    15,    -1,    17,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    26,    27,    28,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    37,    38,    -1,    40,
      41,    42,    43,    44,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    68,    69,    70,
      71,    72,    73,    74,    75,    76,    77,    78,    79,    80,
      -1,    -1,    83,    84,    85,    -1,    -1,    88,    -1,    -1,
      -1,    -1,    -1,    94,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   108,    -1,    -1,
      -1,    -1,    -1,   114,    -1,   116,   117,   118,   119,   120,
     121,   122,   123,   124,   125,    -1,    -1,    -1,   129,   130,
     131,   132,   133,     0,   135,   136,   137,   138,   139,    -1,
      -1,     8,     9,    10,    -1,    -1,    13,    14,    15,    -1,
      17,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      27,    28,    29,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      37,    38,    -1,    40,    41,    42,    43,    44,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    68,    69,    70,    71,    72,    73,    74,    75,    76,
      77,    78,    79,    80,    -1,    -1,    83,    84,    85,    -1,
      -1,    88,    -1,    -1,    -1,    -1,    -1,    94,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   108,    -1,    -1,   111,    -1,    -1,   114,   115,   116,
     117,   118,   119,   120,   121,   122,   123,   124,   125,    -1,
      -1,    -1,    -1,   130,   131,   132,   133,     0,    -1,   136,
     137,   138,   139,    -1,    -1,     8,     9,    10,    -1,    -1,
      13,    14,    15,    -1,    17,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    26,    27,    28,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    37,    38,    -1,    40,    41,    42,
      43,    44,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    68,    69,    70,    71,    72,
      73,    74,    75,    76,    77,    78,    79,    80,    -1,    -1,
      83,    84,    85,    -1,    -1,    88,    -1,    -1,    -1,    -1,
      -1,    94,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   108,    -1,    -1,    -1,    -1,
      -1,   114,    -1,   116,   117,   118,   119,   120,   121,   122,
     123,   124,   125,    -1,    -1,    -1,   129,   130,   131,   132,
     133,     0,   135,   136,   137,   138,   139,    -1,    -1,     8,
       9,    10,    -1,    -1,    13,    14,    15,    -1,    17,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    27,    28,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    37,    38,
      -1,    40,    41,    42,    43,    44,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    68,
      69,    70,    71,    72,    73,    74,    75,    76,    77,    78,
      79,    80,    -1,    -1,    83,    84,    85,    -1,    -1,    88,
      -1,    -1,    -1,    -1,    -1,    94,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   108,
      -1,    -1,    -1,    -1,    -1,   114,    -1,   116,   117,   118,
     119,   120,   121,   122,   123,   124,   125,    -1,    -1,    -1,
      -1,   130,   131,   132,   133,     0,   135,   136,   137,   138,
     139,    -1,    -1,     8,     9,    10,    -1,    -1,    -1,    14,
      15,    -1,    17,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    26,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    37,    38,    -1,    40,    41,    42,    43,    44,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    68,    69,    70,    71,    72,    73,    74,
      75,    76,    77,    78,    79,    80,    -1,    -1,    83,    84,
      85,    -1,    87,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   108,    -1,    -1,    -1,    -1,   113,   114,
      -1,   116,   117,   118,   119,   120,   121,   122,   123,   124,
     125,    -1,    -1,    -1,   129,   130,   131,   132,   133,     0,
      -1,   136,    -1,   138,   139,    -1,    -1,     8,     9,    10,
      -1,    -1,    -1,    14,    15,    -1,    17,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    37,    38,    -1,    40,
      41,    42,    43,    44,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    68,    69,    70,
      71,    72,    73,    74,    75,    76,    77,    78,    79,    80,
      -1,    -1,    83,    84,    85,    -1,    87,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   108,    -1,    -1,
      -1,    -1,   113,   114,    -1,   116,   117,   118,   119,   120,
     121,   122,   123,   124,   125,    -1,    -1,    -1,    -1,   130,
     131,   132,   133,    -1,    -1,   136,    -1,   138,   139,     1,
      -1,     3,     4,     5,     6,     7,     8,     9,    10,    11,
      12,    -1,    -1,    15,    16,    -1,    18,    19,    20,    21,
      22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,
      32,    33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,
      -1,    -1,    -1,    45,    46,    47,    48,    49,    50,    51,
      52,    53,    54,    55,    56,    57,    -1,    59,    60,    -1,
      62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,
      92,    93,    -1,    95,    -1,    -1,    98,    99,   100,   101,
     102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   126,   127,   128,    -1,    -1,     1,
      -1,     3,     4,     5,     6,     7,   138,   139,    10,    11,
      12,    -1,    14,    15,    16,    -1,    18,    19,    20,    21,
      22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,
      32,    33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,
      -1,    -1,    -1,    45,    46,    47,    48,    49,    50,    51,
      52,    53,    54,    55,    56,    57,    -1,    59,    60,    -1,
      62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,
      92,    93,    -1,    95,    -1,    -1,    98,    99,   100,   101,
     102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   126,   127,   128,    -1,    -1,     1,
      -1,     3,     4,     5,     6,     7,   138,   139,    10,    11,
      12,    -1,    -1,    15,    16,    17,    18,    19,    20,    21,
      22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,
      32,    33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,
      -1,    -1,    -1,    45,    46,    47,    48,    49,    50,    51,
      52,    53,    54,    55,    56,    57,    -1,    59,    60,    -1,
      62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,
      92,    93,    -1,    95,    -1,    -1,    98,    99,   100,   101,
     102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   126,   127,   128,    -1,    -1,     1,
      -1,     3,     4,     5,     6,     7,   138,   139,    10,    11,
      12,    -1,    -1,    15,    16,    -1,    18,    19,    20,    21,
      22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,
      32,    33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,
      -1,    -1,    -1,    45,    46,    47,    48,    49,    50,    51,
      52,    53,    54,    55,    56,    57,    -1,    59,    60,    -1,
      62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,
      92,    93,    -1,    95,    -1,    -1,    98,    99,   100,   101,
     102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,     1,    -1,     3,     4,     5,     6,     7,    -1,
       9,    10,    11,    12,   126,   127,   128,    16,    -1,    18,
      19,    20,    21,    22,    23,    24,   138,   139,    -1,    -1,
      -1,    30,    31,    32,    33,    34,    35,    36,    -1,    -1,
      39,    -1,    -1,    -1,    -1,    -1,    45,    46,    47,    48,
      49,    50,    51,    52,    53,    54,    55,    56,    57,    -1,
      59,    60,    -1,    62,    63,    64,    -1,    66,    67,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,
      89,    90,    -1,    92,    93,    -1,    95,    -1,    -1,    98,
      99,   100,   101,   102,   103,   104,   105,   106,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,     1,    -1,     3,     4,     5,
       6,     7,    -1,    -1,    -1,    11,    12,   126,   127,   128,
      16,    -1,    18,    19,    20,    21,    22,    23,    24,   138,
     139,    -1,    -1,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    45,
      46,    47,    48,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    -1,    59,    60,    -1,    62,    63,    64,    -1,
      66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,
      -1,    -1,    98,    99,   100,   101,   102,   103,   104,   105,
     106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     126,   127,   128,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     136,    -1,   138,   139,     1,    -1,     3,     4,     5,     6,
       7,    -1,    -1,    -1,    11,    12,    -1,    -1,    -1,    16,
      -1,    18,    19,    20,    21,    22,    23,    24,    -1,    -1,
      -1,    -1,    -1,    30,    31,    32,    33,    34,    35,    36,
      -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    45,    46,
      47,    48,    49,    50,    51,    52,    53,    54,    55,    56,
      57,    -1,    59,    60,    -1,    62,    63,    64,    -1,    66,
      67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,
      -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,    -1,
      -1,    98,    99,   100,   101,   102,   103,   104,   105,   106,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   126,
     127,   128,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   136,
      -1,   138,   139,     1,    -1,     3,     4,     5,     6,     7,
      -1,    -1,    -1,    11,    12,    -1,    -1,    -1,    16,    -1,
      18,    19,    20,    21,    22,    23,    24,    -1,    -1,    -1,
      -1,    -1,    30,    31,    32,    33,    34,    35,    36,    -1,
      -1,    39,    -1,    -1,    -1,    -1,    -1,    45,    46,    47,
      48,    49,    50,    51,    52,    53,    54,    55,    56,    57,
      -1,    59,    60,    -1,    62,    63,    64,    -1,    66,    67,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,
      -1,    89,    90,    -1,    92,    93,    -1,    95,    -1,    -1,
      98,    99,   100,   101,   102,   103,   104,   105,   106,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,     1,    -1,     3,     4,
       5,     6,     7,    -1,    -1,    -1,    11,    12,   126,   127,
     128,    16,   130,    18,    19,    20,    21,    22,    23,    24,
     138,   139,    -1,    -1,    -1,    30,    31,    32,    33,    34,
      35,    36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,
      45,    46,    47,    48,    49,    50,    51,    52,    53,    54,
      55,    56,    57,    -1,    59,    60,    -1,    62,    63,    64,
      -1,    66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,
      95,    -1,    -1,    98,    99,   100,   101,   102,   103,   104,
     105,   106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     1,
      -1,     3,     4,     5,     6,     7,    -1,    -1,    10,    11,
      12,   126,   127,   128,    16,   130,    18,    19,    20,    21,
      22,    23,    24,   138,   139,    -1,    -1,    -1,    30,    31,
      32,    33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,
      -1,    -1,    -1,    45,    46,    47,    48,    49,    50,    51,
      52,    53,    54,    55,    56,    57,    -1,    59,    60,    -1,
      62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,
      92,    93,    -1,    95,    -1,    -1,    98,    99,   100,   101,
     102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,     1,    -1,     3,     4,     5,     6,     7,    -1,
      -1,    -1,    11,    12,   126,   127,   128,    16,    -1,    18,
      19,    20,    21,    22,    23,    24,   138,   139,    -1,    -1,
      -1,    30,    31,    32,    33,    34,    35,    36,    -1,    -1,
      39,    -1,    -1,    -1,    -1,    -1,    45,    46,    47,    48,
      49,    50,    51,    52,    53,    54,    55,    56,    57,    -1,
      59,    60,    -1,    62,    63,    64,    -1,    66,    67,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,
      89,    90,    -1,    92,    93,    -1,    95,    -1,    -1,    98,
      99,   100,   101,   102,   103,   104,   105,   106,    -1,   108,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,
      -1,     7,    -1,    -1,    -1,    11,    12,   126,   127,   128,
      16,    -1,    18,    19,    20,    21,    22,    23,    24,   138,
     139,    -1,    -1,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,
      46,    -1,    -1,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    58,    59,    60,    -1,    62,    63,    64,    -1,
      66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,
      96,    97,    98,    99,   100,   101,   102,   103,   104,   105,
     106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
       3,     4,     5,    -1,     7,    -1,    -1,    -1,    11,    12,
     126,   127,   128,    16,    -1,    18,    19,    20,    21,    22,
      23,    24,    -1,   139,    -1,    -1,    -1,    30,    31,    32,
      33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,
      -1,    -1,    -1,    46,    -1,    -1,    49,    50,    51,    52,
      53,    54,    55,    56,    57,    -1,    59,    60,    -1,    62,
      63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,
      93,    -1,    -1,    -1,    -1,    98,    99,   100,   101,   102,
     103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,     3,     4,     5,    -1,     7,    -1,    -1,
      -1,    11,    12,   126,   127,   128,    16,    -1,    18,    19,
      20,    21,    22,    23,    24,   138,   139,    -1,    -1,    -1,
      30,    31,    32,    33,    34,    35,    36,    -1,    -1,    39,
      -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,    49,
      50,    51,    52,    53,    54,    55,    56,    57,    -1,    59,
      60,    -1,    62,    63,    64,    -1,    66,    67,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,
      90,    -1,    92,    93,    -1,    -1,    -1,    -1,    98,    99,
     100,   101,   102,   103,   104,   105,   106,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,     6,
       7,    -1,    -1,    -1,    11,    12,   126,   127,   128,    16,
      -1,    18,    19,    20,    21,    22,    23,    24,    -1,   139,
      -1,    -1,    -1,    30,    31,    32,    33,    34,    35,    36,
      -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    45,    46,
      47,    48,    49,    50,    51,    52,    53,    54,    55,    56,
      57,    -1,    59,    60,    -1,    62,    63,    64,    -1,    66,
      67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,
      -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,    -1,
      -1,    98,    99,   100,   101,   102,   103,   104,   105,   106,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,
       4,     5,     6,     7,    -1,    -1,    -1,    11,    12,   126,
     127,   128,    16,    -1,    18,    19,    20,    21,    22,    23,
      24,   138,    -1,    -1,    -1,    -1,    30,    31,    32,    33,
      34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,    -1,
      -1,    45,    46,    47,    48,    49,    50,    51,    52,    53,
      54,    55,    56,    57,    -1,    59,    60,    -1,    62,    63,
      64,    -1,    66,    67,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,    93,
      -1,    95,    -1,    -1,    98,    99,   100,   101,   102,   103,
     104,   105,   106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,   126,   127,   128,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   138,     3,     4,     5,     6,     7,
       8,     9,    10,    11,    12,    13,    14,    15,    16,    17,
      18,    19,    20,    21,    22,    23,    24,    25,    26,    -1,
      -1,    -1,    30,    31,    32,    33,    34,    35,    36,    37,
      38,    39,    -1,    -1,    -1,    -1,    -1,    45,    46,    47,
      48,    49,    50,    51,    52,    53,    54,    55,    56,    57,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    66,    67,
      68,    69,    70,    71,    72,    73,    74,    -1,    -1,    77,
      78,    -1,    -1,    81,    82,    83,    84,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    95,    96,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   116,   117,
     118,   119,   120,   121,   122,   123,   124,   125,    -1,   127,
     128,    -1,    -1,    -1,    -1,    -1,   134,   135,     3,     4,
       5,     6,     7,     8,     9,    10,    11,    12,    13,    14,
      15,    16,    17,    18,    19,    20,    21,    22,    23,    24,
      25,    26,    -1,    -1,    -1,    30,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    -1,    -1,    -1,    -1,    -1,
      45,    46,    47,    48,    49,    50,    51,    52,    53,    54,
      55,    56,    57,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    66,    67,    68,    69,    70,    71,    72,    73,    74,
      -1,    -1,    77,    78,    -1,    -1,    81,    82,    83,    84,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      95,    96,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   116,   117,   118,   119,   120,   121,   122,   123,   124,
     125,    -1,   127,   128,    -1,    -1,    -1,    -1,    -1,   134,
       3,     4,     5,     6,     7,     8,     9,    10,    11,    12,
      13,    14,    15,    16,    17,    18,    19,    20,    21,    22,
      23,    24,    25,    26,    -1,    -1,    -1,    30,    31,    32,
      33,    34,    35,    36,    37,    38,    39,    -1,    -1,    -1,
      -1,    -1,    45,    46,    47,    48,    49,    50,    51,    52,
      53,    54,    -1,    56,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    66,    67,    68,    69,    70,    71,    72,
      73,    74,    -1,    -1,    77,    78,    -1,    -1,    81,    82,
      83,    84,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    95,    96,    -1,    -1,    99,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   116,   117,   118,   119,   120,   121,   122,
     123,   124,   125,    -1,   127,   128,    -1,    -1,    -1,    -1,
      -1,   134,     3,     4,     5,     6,     7,     8,     9,    10,
      11,    12,    13,    14,    15,    16,    17,    18,    19,    20,
      21,    22,    23,    24,    25,    26,    -1,    -1,    -1,    30,
      31,    32,    33,    34,    35,    36,    37,    38,    39,    -1,
      -1,    -1,    -1,    -1,    45,    46,    47,    48,    49,    50,
      51,    52,    53,    -1,    -1,    56,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    66,    67,    68,    69,    70,
      71,    72,    73,    74,    -1,    -1,    77,    78,    -1,    -1,
      81,    82,    83,    84,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    95,    96,    -1,    -1,    99,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   116,   117,   118,   119,   120,
     121,   122,   123,   124,   125,    -1,   127,   128,    -1,    -1,
      -1,    -1,    -1,   134,     3,     4,     5,     6,     7,     8,
       9,    10,    11,    12,    13,    14,    15,    16,    17,    18,
      19,    20,    21,    22,    23,    24,    25,    26,    -1,    -1,
      -1,    30,    31,    32,    33,    34,    35,    36,    37,    38,
      39,    -1,    -1,    -1,    -1,    -1,    45,    46,    47,    48,
      49,    50,    51,    52,    53,    -1,    -1,    56,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    66,    67,    68,
      69,    70,    71,    72,    73,    74,    -1,    -1,    77,    78,
      -1,    -1,    81,    82,    83,    84,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    95,    96,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   116,   117,   118,
     119,   120,   121,   122,   123,   124,   125,    -1,   127,   128,
       3,     4,     5,    -1,     7,   134,    -1,    -1,    11,    12,
      -1,    -1,    -1,    16,    -1,    18,    19,    20,    21,    22,
      23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,    32,
      33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,
      -1,    -1,    -1,    46,    -1,    -1,    49,    50,    51,    52,
      53,    54,    55,    56,    57,    -1,    59,    60,    -1,    62,
      63,    64,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,
      93,    -1,    -1,    -1,    -1,    98,    99,   100,   101,   102,
     103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,    -1,
       7,    -1,    -1,   126,    11,    12,    -1,    -1,    -1,    16,
     133,    18,    19,    20,    21,    22,    23,    24,    -1,    -1,
      -1,    -1,    -1,    30,    31,    32,    33,    34,    35,    36,
      -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,    46,
      -1,    -1,    49,    50,    51,    52,    53,    54,    55,    56,
      57,    -1,    59,    60,    -1,    62,    63,    64,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,
      -1,    -1,    89,    90,    -1,    92,    93,    -1,    -1,    -1,
      -1,    98,    99,   100,   101,   102,   103,   104,   105,   106,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,     3,     4,     5,     6,     7,    -1,    -1,   126,
      11,    12,    -1,    -1,    -1,    16,   133,    18,    19,    20,
      21,    22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,
      31,    32,    33,    34,    35,    36,    -1,    -1,    39,    -1,
      -1,    -1,    -1,    -1,    45,    46,    47,    48,    49,    50,
      51,    52,    53,    54,    55,    56,    57,    -1,    59,    60,
      -1,    62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,
      -1,    92,    93,    -1,    95,    -1,    -1,    98,    99,   100,
     101,   102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,     3,     4,     5,    -1,     7,
      -1,    -1,    -1,    11,    12,   126,   127,   128,    16,    -1,
      18,    19,    20,    21,    22,    23,    24,    -1,    -1,    -1,
      -1,    -1,    30,    31,    32,    33,    34,    35,    36,    -1,
      -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,
      -1,    49,    50,    51,    52,    53,    54,    55,    56,    57,
      58,    59,    60,    -1,    62,    63,    64,    -1,    66,    67,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,
      -1,    89,    90,    -1,    92,    93,    -1,    95,    96,    97,
      98,    99,   100,   101,   102,   103,   104,   105,   106,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,     4,
       5,     6,     7,    -1,    -1,    -1,    11,    12,   126,   127,
     128,    16,    -1,    18,    19,    20,    21,    22,    23,    24,
      -1,    -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,
      35,    36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,
      45,    46,    -1,    48,    49,    50,    51,    52,    53,    54,
      55,    56,    57,    -1,    59,    60,    -1,    62,    63,    64,
      -1,    66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,
      95,    -1,    -1,    98,    99,   100,   101,   102,   103,   104,
     105,   106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,     3,     4,     5,    -1,     7,    -1,    -1,    -1,    11,
      12,   126,   127,   128,    16,    -1,    18,    19,    20,    21,
      22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,
      32,    33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,
      -1,    -1,    -1,    -1,    46,    -1,    -1,    49,    50,    51,
      52,    53,    54,    55,    56,    57,    58,    59,    60,    -1,
      62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,
      92,    93,    -1,    95,    96,    97,    98,    99,   100,   101,
     102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,     3,     4,     5,    -1,     7,    -1,
      -1,    -1,    11,    12,   126,   127,   128,    16,    -1,    18,
      19,    20,    21,    22,    23,    24,    -1,    -1,    -1,    -1,
      -1,    30,    31,    32,    33,    34,    35,    36,    -1,    -1,
      39,    -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,
      49,    50,    51,    52,    53,    54,    55,    56,    57,    58,
      59,    60,    -1,    62,    63,    64,    -1,    66,    67,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,
      89,    90,    -1,    92,    93,    -1,    95,    96,    -1,    98,
      99,   100,   101,   102,   103,   104,   105,   106,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,
      -1,     7,    -1,    -1,    -1,    11,    12,   126,   127,   128,
      16,    -1,    18,    19,    20,    21,    22,    23,    24,    -1,
      -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,
      46,    -1,    -1,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    58,    59,    60,    -1,    62,    63,    64,    -1,
      66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    -1,
      96,    97,    98,    99,   100,   101,   102,   103,   104,   105,
     106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
       3,     4,     5,    -1,     7,    -1,    -1,    -1,    11,    12,
     126,   127,   128,    16,    -1,    18,    19,    20,    21,    22,
      23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,    32,
      33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,
      -1,    -1,    -1,    46,    -1,    -1,    49,    50,    51,    52,
      53,    54,    55,    56,    57,    58,    59,    60,    -1,    62,
      63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,
      93,    -1,    95,    96,    -1,    98,    99,   100,   101,   102,
     103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,     3,     4,     5,    -1,     7,    -1,    -1,
      -1,    11,    12,   126,   127,   128,    16,    -1,    18,    19,
      20,    21,    22,    23,    24,    -1,    -1,    -1,    -1,    -1,
      30,    31,    32,    33,    34,    35,    36,    -1,    -1,    39,
      -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,    49,
      50,    51,    52,    53,    54,    55,    56,    57,    58,    59,
      60,    -1,    62,    63,    64,    -1,    66,    67,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,
      90,    -1,    92,    93,    -1,    -1,    96,    -1,    98,    99,
     100,   101,   102,   103,   104,   105,   106,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,    -1,
       7,    -1,    -1,    -1,    11,    12,   126,   127,   128,    16,
      -1,    18,    19,    20,    21,    22,    23,    24,    -1,    -1,
      -1,    -1,    -1,    30,    31,    32,    33,    34,    35,    36,
      -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,    46,
      -1,    -1,    49,    50,    51,    52,    53,    54,    55,    56,
      57,    -1,    59,    60,    -1,    62,    63,    64,    -1,    66,
      67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,
      -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,    -1,
      -1,    98,    99,   100,   101,   102,   103,   104,   105,   106,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,
       4,     5,    -1,     7,    -1,    -1,    -1,    11,    12,   126,
     127,   128,    16,    -1,    18,    19,    20,    21,    22,    23,
      24,    -1,    -1,    -1,    -1,    -1,    30,    31,    32,    33,
      34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,    -1,
      -1,    -1,    46,    -1,    -1,    49,    50,    51,    52,    53,
      54,    55,    56,    57,    -1,    59,    60,    -1,    62,    63,
      64,    -1,    66,    67,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,    93,
      -1,    95,    -1,    -1,    98,    99,   100,   101,   102,   103,
     104,   105,   106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,     3,     4,     5,    -1,     7,    -1,    -1,    -1,
      11,    12,   126,   127,   128,    16,    -1,    18,    19,    20,
      21,    22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,
      31,    32,    33,    34,    35,    36,    -1,    -1,    39,    -1,
      -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,    49,    50,
      51,    52,    53,    54,    55,    56,    57,    -1,    59,    60,
      -1,    62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,
      -1,    92,    93,    -1,    95,    -1,    -1,    98,    99,   100,
     101,   102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,     3,     4,     5,    -1,     7,
      -1,    -1,    -1,    11,    12,   126,   127,   128,    16,    -1,
      18,    19,    20,    21,    22,    23,    24,    -1,    -1,    -1,
      -1,    -1,    30,    31,    32,    33,    34,    35,    36,    -1,
      -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,
      -1,    49,    50,    51,    52,    53,    54,    55,    56,    57,
      -1,    59,    60,    -1,    62,    63,    64,    -1,    66,    67,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,
      -1,    89,    90,    -1,    92,    93,    -1,    95,    -1,    -1,
      98,    99,   100,   101,   102,   103,   104,   105,   106,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,     4,
       5,    -1,     7,    -1,    -1,    -1,    11,    12,   126,   127,
     128,    16,    -1,    18,    19,    20,    21,    22,    23,    24,
      -1,    -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,
      35,    36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,
      -1,    46,    -1,    -1,    49,    50,    51,    52,    53,    54,
      55,    56,    57,    -1,    59,    60,    -1,    62,    63,    64,
      -1,    66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,
      95,    -1,    -1,    98,    99,   100,   101,   102,   103,   104,
     105,   106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,     3,     4,     5,    -1,     7,    -1,    -1,    -1,    11,
      12,   126,   127,   128,    16,    -1,    18,    19,    20,    21,
      22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,
      32,    33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,
      -1,    -1,    -1,    -1,    46,    -1,    -1,    49,    50,    51,
      52,    53,    54,    55,    56,    57,    -1,    59,    60,    -1,
      62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,
      92,    93,    -1,    -1,    -1,    -1,    98,    99,   100,   101,
     102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,     3,     4,     5,    -1,     7,    -1,
      -1,    -1,    11,    12,   126,   127,   128,    16,    -1,    18,
      19,    20,    21,    22,    23,    24,    -1,    -1,    -1,    -1,
      -1,    30,    31,    32,    33,    34,    35,    36,    -1,    -1,
      39,    -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,
      49,    50,    51,    52,    53,    54,    55,    56,    57,    -1,
      59,    60,    -1,    62,    63,    64,    -1,    66,    67,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,
      89,    90,    -1,    92,    93,    -1,    -1,    -1,    -1,    98,
      99,   100,   101,   102,   103,   104,   105,   106,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,
      -1,     7,    -1,    -1,    -1,    11,    12,   126,   127,   128,
      16,    -1,    18,    19,    20,    21,    22,    23,    24,    -1,
      -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,
      46,    -1,    -1,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    -1,    59,    60,    -1,    62,    63,    64,    -1,
      66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    -1,
      -1,    -1,    98,    99,   100,   101,   102,   103,   104,   105,
     106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
       3,     4,     5,    -1,     7,    -1,    -1,    -1,    11,    12,
     126,   127,   128,    16,    -1,    18,    19,    20,    21,    22,
      23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,    32,
      33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,
      -1,    -1,    -1,    46,    -1,    -1,    49,    50,    51,    52,
      53,    54,    55,    56,    57,    -1,    59,    60,    -1,    62,
      63,    64,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,
      93,    -1,    95,    -1,    -1,    98,    99,   100,   101,   102,
     103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,     3,
       4,     5,    -1,     7,    -1,    -1,    -1,    11,    12,    -1,
      -1,    -1,    16,   126,    18,    19,    20,    21,    22,    23,
      24,    -1,    -1,    -1,    -1,    -1,    30,    31,    32,    33,
      34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,    -1,
      -1,    -1,    46,    -1,    -1,    49,    50,    51,    52,    53,
      54,    55,    56,    57,    -1,    59,    60,    -1,    62,    63,
      64,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,    93,
      -1,    95,    -1,    -1,    98,    99,   100,   101,   102,   103,
     104,   105,   106,    -1,    -1,    -1,    -1,    -1,     3,     4,
       5,    -1,     7,    -1,    -1,    -1,    11,    12,    -1,    -1,
      -1,    16,   126,    18,    19,    20,    21,    22,    23,    24,
      -1,    -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,
      35,    36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,
      -1,    46,    -1,    -1,    49,    50,    51,    52,    53,    54,
      55,    56,    57,    -1,    59,    60,    -1,    62,    63,    64,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    83,    -1,
      -1,    86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,
      -1,    -1,    -1,    98,    99,   100,   101,   102,   103,   104,
     105,   106,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,
      -1,     7,    -1,    -1,    -1,    11,    12,    -1,    -1,    -1,
      16,   126,    18,    19,    20,    21,    22,    23,    24,    -1,
      -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,
      46,    -1,    -1,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    -1,    59,    60,    -1,    62,    63,    64,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    -1,
      -1,    -1,    98,    99,   100,   101,   102,   103,   104,   105,
     106,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,    -1,
       7,    -1,    -1,    -1,    11,    12,    -1,    -1,    -1,    16,
     126,    18,    19,    20,    21,    22,    23,    24,    -1,    -1,
      -1,    -1,    -1,    30,    31,    32,    33,    34,    35,    36,
      -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,    46,
      -1,    -1,    49,    50,    51,    52,    53,    54,    55,    56,
      57,    -1,    59,    60,    -1,    62,    63,    64,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,
      -1,    -1,    89,    90,    -1,    92,    93,    -1,    -1,    -1,
      -1,    98,    99,   100,   101,   102,   103,   104,   105,   106,
      -1,    -1,    -1,    -1,    -1,     3,     4,     5,    -1,     7,
      -1,    -1,    -1,    11,    12,    -1,    -1,    -1,    16,   126,
      18,    19,    20,    21,    22,    23,    24,    -1,    -1,    -1,
      -1,    -1,    30,    31,    32,    33,    34,    35,    36,    -1,
      -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,
      -1,    49,    50,    51,    52,    53,    54,    55,    56,    57,
      -1,    59,    60,    -1,    62,    63,    64,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,
      -1,    89,    90,    -1,    92,    93,    -1,    -1,    -1,    -1,
      98,    99,   100,   101,   102,   103,   104,   105,   106,    -1,
      -1,    -1,    -1,    -1,     3,     4,     5,    -1,     7,    -1,
      -1,    -1,    11,    12,    -1,    -1,    -1,    16,   126,    18,
      19,    20,    21,    22,    23,    24,    -1,    -1,    -1,    -1,
      -1,    30,    31,    32,    33,    34,    35,    36,    -1,    -1,
      39,    -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,
      49,    50,    51,    52,    53,    54,    55,    56,    57,    -1,
      59,    60,    -1,    62,    63,    64,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,
      89,    90,    -1,    92,    93,    -1,    -1,    -1,    -1,    98,
      99,   100,   101,   102,   103,   104,   105,   106,    -1,    -1,
      -1,    -1,    -1,    -1,    52,    53,    -1,    -1,    56,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   126,    66,    67,
      68,    69,    70,    71,    72,    73,    74,    -1,    -1,    77,
      78,    -1,    -1,    81,    82,    83,    84,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    95,    96,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   116,   117,
     118,   119,   120,   121,   122,   123,   124,   125,    -1,   127,
     128,    52,    53,    -1,    -1,    56,   134,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    66,    67,    68,    69,    70,
      71,    72,    73,    74,    -1,    -1,    77,    78,    -1,    -1,
      81,    82,    83,    84,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    95,    96,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   116,   117,   118,   119,   120,
     121,   122,   123,   124,   125,    -1,   127,   128,    52,    53,
      -1,    -1,    56,   134,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    66,    67,    68,    69,    70,    71,    72,    73,
      74,    -1,    -1,    77,    78,    -1,    -1,    81,    82,    83,
      84,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    95,    96,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,   116,   117,   118,   119,   120,   121,   122,   123,
     124,   125,    -1,   127,   128,    52,    53,    -1,    -1,    56,
     134,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    66,
      67,    68,    69,    70,    71,    72,    73,    74,    -1,    -1,
      77,    78,    -1,    -1,    81,    82,    83,    84,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    95,    96,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   116,
     117,   118,   119,   120,   121,   122,   123,   124,   125,    -1,
     127,   128,    52,    53,    -1,    -1,    56,   134,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    66,    67,    68,    69,
      70,    71,    72,    73,    74,    -1,    -1,    77,    78,    -1,
      -1,    81,    82,    83,    84,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    95,    96,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   116,   117,   118,   119,
     120,   121,   122,   123,   124,   125,    -1,   127,   128,    52,
      53,    -1,    -1,    56,   134,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    66,    67,    68,    69,    70,    71,    72,
      73,    74,    -1,    -1,    77,    78,    -1,    -1,    81,    82,
      83,    84,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    95,    96,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   116,   117,   118,   119,   120,   121,   122,
     123,   124,   125,    -1,   127,   128,    52,    53,    -1,    -1,
      56,   134,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      66,    67,    68,    69,    70,    71,    72,    73,    74,    -1,
      -1,    77,    78,    -1,    -1,    81,    82,    83,    84,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    95,
      96,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     116,   117,   118,   119,   120,   121,   122,   123,   124,   125,
      -1,   127,   128,    52,    53,    -1,    -1,    56,   134,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    66,    67,    68,
      69,    70,    71,    72,    73,    74,    -1,    -1,    77,    78,
      -1,    -1,    81,    82,    83,    84,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    95,    96,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   116,   117,   118,
     119,   120,   121,   122,   123,   124,   125,    -1,   127,   128,
      52,    53,    -1,    -1,    56,   134,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    66,    67,    68,    69,    70,    71,
      72,    73,    74,    -1,    -1,    77,    78,    -1,    -1,    81,
      82,    83,    84,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    95,    96,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   116,   117,   118,   119,   120,   121,
     122,   123,   124,   125,    -1,   127,   128,    52,    53,    -1,
      -1,    56,   134,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    66,    67,    68,    69,    70,    71,    72,    73,    74,
      -1,    -1,    77,    78,    -1,    -1,    81,    82,    83,    84,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      95,    96,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   116,   117,   118,   119,   120,   121,   122,   123,   124,
     125,    -1,   127,   128,    52,    53,    -1,    -1,    56,   134,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    66,    67,
      68,    69,    70,    71,    72,    73,    74,    -1,    -1,    77,
      78,    -1,    -1,    81,    82,    83,    84,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    95,    96,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   116,   117,
     118,   119,   120,   121,   122,   123,   124,   125,    -1,   127,
     128,    52,    53,    -1,    -1,    56,   134,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    66,    67,    68,    69,    70,
      71,    72,    73,    74,    -1,    -1,    77,    78,    -1,    -1,
      81,    82,    83,    84,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    95,    96,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   116,   117,   118,   119,   120,
     121,   122,   123,   124,   125,    -1,   127,   128,    52,    53,
      -1,    -1,    56,   134,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    66,    67,    68,    69,    70,    71,    72,    73,
      74,    -1,    -1,    77,    78,    -1,    -1,    81,    82,    83,
      84,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    95,    96,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,   116,   117,   118,   119,   120,   121,   122,   123,
     124,   125,    -1,   127,   128,    -1,    -1,    -1,    -1,    -1,
     134
    //[
  ];

  // STOS_[STATE-NUM]
  // The (internal number of the) accessing symbol of state STATE-NUM.
  var yystos_ =
  [
    //]
         0,   143,   144,     0,     1,     3,     4,     5,     6,     7,
      11,    12,    16,    18,    19,    20,    21,    22,    23,    24,
      30,    31,    32,    33,    34,    35,    36,    39,    45,    46,
      47,    48,    49,    50,    51,    52,    53,    54,    55,    56,
      57,    59,    60,    62,    63,    64,    66,    67,    86,    89,
      90,    92,    93,    95,    98,    99,   100,   101,   102,   103,
     104,   105,   106,   126,   127,   128,   145,   146,   147,   154,
     156,   157,   159,   160,   163,   164,   165,   167,   168,   169,
     171,   172,   182,   196,   214,   215,   216,   217,   218,   219,
     220,   221,   222,   223,   224,   250,   251,   265,   266,   267,
     268,   269,   270,   271,   274,   276,   277,   289,   291,   292,
     293,   294,   295,   296,   297,   328,   339,   147,     3,     4,
       5,     6,     7,     8,     9,    10,    11,    12,    13,    14,
      15,    16,    17,    18,    19,    20,    21,    22,    23,    24,
      25,    26,    30,    31,    32,    33,    34,    35,    36,    37,
      38,    39,    45,    46,    47,    48,    49,    50,    51,    52,
      53,    56,    66,    67,    68,    69,    70,    71,    72,    73,
      74,    77,    78,    81,    82,    83,    84,    95,    96,   116,
     117,   118,   119,   120,   121,   122,   123,   124,   125,   127,
     128,   134,   175,   176,   177,   178,   180,   181,   289,   291,
      39,    58,    86,    89,    95,    96,    97,   127,   164,   172,
     182,   184,   189,   192,   194,   214,   293,   294,   296,   297,
     326,   327,   189,   189,   135,   190,   191,   135,   186,   190,
     135,   139,   333,    54,   177,   333,   148,   129,    21,    22,
      30,    31,    32,   163,   182,   214,   182,    56,     1,    47,
      89,   150,   151,   152,   154,   166,   167,   339,   157,   198,
     185,   194,   326,   339,   184,   325,   326,   339,    46,    86,
     126,   133,   171,   196,   214,   293,   294,   297,   242,   243,
      54,    55,    57,   175,   281,   290,   280,   281,   282,   141,
     272,   141,   278,   141,   275,   141,   279,    59,    60,   159,
     182,   182,   138,   139,   332,   337,   338,    40,    41,    42,
      43,    44,    37,    38,    26,   129,   186,   190,   256,    28,
     248,   113,   133,    89,    95,   168,   113,    68,    69,    70,
      71,    72,    73,    74,    75,    76,    77,    78,    79,    80,
      83,    84,   114,   116,   117,   118,   119,   120,   121,   122,
     123,   124,   125,    85,   131,   132,   197,   157,   158,   158,
     201,   203,   158,   332,   338,    86,   165,   172,   214,   230,
     293,   294,   297,    52,    56,    83,    86,   173,   174,   214,
     293,   294,   297,   174,    33,    34,    35,    36,    49,    50,
      51,    52,    56,   135,   175,   295,   323,    85,   132,   331,
     256,   268,    87,    87,   133,   184,    56,   184,   184,   184,
     113,    88,   133,   193,   339,    85,   131,   132,    87,    87,
     133,   193,   189,   333,   334,   189,   188,   189,   194,   326,
     339,   157,   334,   157,    54,    63,    64,   155,   135,   183,
     129,   150,    85,   132,    87,   154,   153,   166,   136,   332,
     338,   334,   199,   334,   137,   133,   139,   336,   133,   336,
     130,   336,   333,    56,    59,    60,   168,   170,   133,    85,
     131,   132,   244,    61,   107,   109,   110,   283,   110,   283,
     110,    65,   283,   110,   110,   273,   283,   110,    61,   110,
     110,   110,   273,   110,    61,   110,    68,    68,   138,   147,
     158,   158,   158,   158,   154,   157,   157,   258,   257,    94,
     161,   249,    95,   159,   184,   194,   195,   166,   133,   171,
     133,   156,   159,   172,   182,   184,   195,   182,   182,   182,
     182,   182,   182,   182,   182,   182,   182,   182,   182,   182,
     182,   182,   182,   182,   182,   182,   182,   182,   182,   182,
     182,   182,   182,    52,    53,    56,   180,   255,   329,   330,
     188,    52,    53,    56,   180,   254,   329,   149,   150,    13,
     226,   337,   226,   158,   158,   332,    17,   259,    56,    85,
     131,   132,    25,   157,    52,    56,   173,     1,   117,   298,
     337,    85,   131,   132,   210,   324,   211,   331,    52,    56,
     329,   159,   182,   159,   182,   179,   182,   184,    95,   184,
     192,   326,    52,    56,   188,    52,    56,   327,   334,   136,
     334,   133,   133,   334,   177,   200,   182,   145,   130,   329,
     329,   182,   129,   334,   152,   334,   326,   133,   170,    52,
      56,   188,    52,    56,    52,    54,    55,    56,    57,    58,
      68,    89,    95,    96,    97,   120,   123,   135,   246,   301,
     303,   304,   305,   306,   307,   308,   311,   312,   313,   314,
     317,   318,   319,   320,   321,   285,   284,   141,   283,   141,
     141,   141,   182,   182,    76,   118,   237,   238,   339,   237,
     162,   237,   184,   133,   334,   170,   133,   113,    44,   333,
      87,    87,   186,   190,   253,   333,   335,    87,    87,   186,
     190,   252,    10,   225,     8,   261,   339,   150,    13,   150,
      27,   227,   337,   227,   259,   194,   225,    52,    56,   188,
      52,    56,   205,   208,   337,   299,   207,    52,    56,   173,
     188,   149,   157,   135,   300,   303,   212,   186,   187,   190,
     339,    44,   177,   184,   193,    87,    87,   335,    87,    87,
     326,   157,   130,   145,   336,   168,   335,   113,   184,    52,
      89,    95,   231,   232,   233,   305,   303,   245,   133,   302,
     133,   322,   339,    52,   133,   322,   133,   302,    52,   133,
     302,    52,   286,    54,    55,    57,   288,   297,    52,    58,
     234,   236,   239,   307,   309,   310,   313,   315,   316,   319,
     321,   333,   150,   150,   237,   150,    95,   184,   170,   182,
     115,   159,   182,   159,   182,   161,   186,   137,    87,   159,
     182,   159,   182,   161,   187,   184,   195,   262,   339,    15,
     229,   339,    14,   228,   229,   229,   202,   204,   225,   133,
     226,   335,   158,   337,   158,   149,   335,   225,   334,   303,
     149,   337,   175,   256,   248,   182,    87,   133,   334,   130,
     184,   233,   133,   305,   133,   334,   239,    29,   111,   247,
     301,   306,   317,   319,   308,   313,   321,   307,   314,   319,
     307,   287,   113,    86,   214,   239,   118,   133,   235,   133,
     322,   322,   133,   235,   133,   235,   138,    10,   130,   150,
      10,   184,   182,   159,   182,    88,   263,   339,   150,     9,
     264,   339,   158,   225,   225,   150,   150,   184,   150,   227,
     209,   337,   225,   334,   225,   213,   334,   232,   133,    95,
     231,   136,   150,   150,   133,   302,   133,   302,   322,   133,
     302,   133,   302,   302,   150,   214,    56,    85,   118,   234,
     316,   319,   309,   313,   307,   315,   319,   307,    52,   240,
     241,   304,   130,    86,   172,   214,   293,   294,   297,   226,
     150,   226,   225,   225,   229,   259,   260,   206,   149,   300,
     133,   232,   133,   305,    10,   130,   307,   319,   307,   307,
     108,    52,    56,   133,   235,   133,   235,   322,   133,   235,
     133,   235,   235,   133,   333,    56,    85,   131,   132,   150,
     150,   150,   225,   149,   232,   133,   302,   133,   302,   302,
     302,   307,   319,   307,   307,   241,    52,    56,   188,    52,
      56,   261,   228,   225,   225,   232,   307,   235,   133,   235,
     235,   235,   335,   302,   307,   235
    //[
  ];

  // TOKEN_NUMBER_[YYLEX-NUM]
  // Internal symbol number corresponding to YYLEX-NUM.
  var yytoken_number_ =
  [
    //]
         0,   256,   257,   258,   259,   260,   261,   262,   263,   264,
     265,   266,   267,   268,   269,   270,   271,   272,   273,   274,
     275,   276,   277,   278,   279,   280,   281,   282,   283,   284,
     285,   286,   287,   288,   289,   290,   291,   292,   293,   294,
     295,   296,   297,   298,   299,   300,   301,   302,   303,   304,
     305,   306,   307,   308,   309,   310,   311,   312,   313,   314,
     315,   316,   317,   318,   319,   320,   321,   322,   323,   324,
     325,   326,   327,   328,   329,   330,   331,   332,   333,   334,
     335,   336,   337,   338,   339,   340,   341,   342,   343,   344,
     345,   346,   347,   348,   349,   350,   351,   352,   353,   354,
     355,   356,   357,   358,   359,   360,   361,   362,   363,   364,
     365,   366,   367,    61,    63,    58,    62,    60,   124,    94,
      38,    43,    45,    42,    47,    37,   368,    33,   126,   123,
     125,    91,    46,    44,    96,    40,    41,    93,    59,    10,
     369,    32
    //[
  ];

  // YYR1[YYN] -- Symbol number of symbol that rule YYN derives.
  var yyr1_ =
  [
    //]
         0,   142,   144,   143,   145,   146,   146,   146,   146,   147,
     148,   147,   149,   150,   151,   151,   151,   151,   152,   153,
     152,   155,   154,   154,   154,   154,   154,   154,   154,   154,
     154,   154,   154,   154,   154,   154,   154,   154,   154,   154,
     154,   154,   154,   154,   154,   154,   156,   156,   157,   157,
     157,   157,   157,   157,   158,   159,   159,   160,   160,   162,
     161,   163,   164,   164,   164,   164,   164,   164,   164,   164,
     164,   164,   164,   165,   165,   166,   166,   167,   167,   167,
     167,   167,   167,   167,   167,   167,   167,   168,   168,   169,
     169,   170,   170,   171,   171,   171,   171,   171,   171,   171,
     171,   171,   172,   172,   172,   172,   172,   172,   172,   172,
     172,   173,   173,   174,   174,   174,   175,   175,   175,   175,
     175,   176,   176,   177,   177,   178,   179,   178,   180,   180,
     180,   180,   180,   180,   180,   180,   180,   180,   180,   180,
     180,   180,   180,   180,   180,   180,   180,   180,   180,   180,
     180,   180,   180,   180,   180,   180,   180,   180,   181,   181,
     181,   181,   181,   181,   181,   181,   181,   181,   181,   181,
     181,   181,   181,   181,   181,   181,   181,   181,   181,   181,
     181,   181,   181,   181,   181,   181,   181,   181,   181,   181,
     181,   181,   181,   181,   181,   181,   181,   181,   181,   182,
     182,   182,   182,   182,   182,   182,   182,   182,   182,   182,
     182,   182,   182,   182,   182,   182,   182,   182,   182,   182,
     182,   182,   182,   182,   182,   182,   182,   182,   182,   182,
     182,   182,   182,   182,   182,   182,   182,   182,   182,   182,
     182,   183,   182,   182,   182,   184,   185,   185,   185,   185,
     186,   187,   187,   188,   188,   188,   188,   188,   189,   189,
     189,   189,   189,   191,   190,   192,   193,   193,   194,   194,
     194,   194,   195,   195,   195,   196,   196,   196,   196,   196,
     196,   196,   196,   196,   196,   196,   197,   196,   198,   196,
     199,   196,   196,   196,   196,   196,   196,   196,   196,   196,
     196,   200,   196,   196,   196,   196,   196,   196,   196,   196,
     196,   201,   202,   196,   203,   204,   196,   196,   196,   205,
     206,   196,   207,   196,   208,   209,   196,   210,   196,   211,
     196,   212,   213,   196,   196,   196,   196,   196,   214,   215,
     216,   217,   218,   219,   220,   221,   222,   223,   224,   225,
     226,   226,   226,   227,   227,   228,   228,   229,   229,   230,
     230,   231,   231,   232,   232,   233,   233,   233,   233,   233,
     233,   233,   233,   233,   234,   234,   234,   234,   235,   235,
     236,   236,   236,   236,   236,   236,   236,   236,   236,   236,
     236,   236,   236,   236,   236,   237,   237,   238,   238,   238,
     239,   239,   240,   240,   241,   241,   243,   244,   245,   242,
     246,   246,   247,   247,   249,   248,   250,   250,   250,   250,
     251,   252,   251,   253,   251,   251,   254,   251,   255,   251,
     251,   251,   251,   257,   256,   258,   256,   259,   260,   260,
     261,   261,   262,   262,   262,   263,   263,   264,   264,   265,
     265,   265,   266,   267,   267,   267,   268,   269,   270,   271,
     271,   272,   272,   273,   273,   274,   274,   275,   275,   276,
     276,   277,   277,   278,   278,   279,   279,   280,   280,   281,
     281,   282,   282,   283,   284,   283,   285,   286,   287,   283,
     288,   288,   288,   288,   289,   290,   290,   290,   290,   291,
     292,   292,   292,   292,   293,   293,   293,   293,   293,   294,
     294,   294,   294,   294,   294,   294,   295,   295,   296,   296,
     297,   297,   298,   299,   298,   298,   300,   300,   301,   301,
     301,   301,   302,   302,   303,   303,   303,   303,   303,   303,
     303,   303,   303,   303,   303,   303,   303,   303,   303,   304,
     304,   304,   304,   305,   305,   306,   306,   307,   307,   308,
     309,   310,   310,   311,   311,   312,   312,   313,   313,   314,
     315,   316,   316,   317,   317,   318,   318,   319,   319,   320,
     320,   321,   322,   322,   323,   324,   323,   325,   325,   326,
     326,   327,   327,   327,   328,   328,   328,   329,   329,   329,
     329,   330,   330,   330,   331,   331,   332,   332,   333,   333,
     334,   335,   336,   336,   336,   337,   337,   338,   338,   339
    //[
  ];

  // YYR2[YYN] -- Number of symbols composing right hand side of rule YYN.
  var yyr2_ = this.yyr2_ =
  [
    //]
         0,     2,     0,     2,     2,     1,     1,     3,     2,     1,
       0,     5,     4,     2,     1,     1,     3,     2,     1,     0,
       5,     0,     4,     3,     3,     3,     2,     3,     3,     3,
       3,     3,     4,     1,     3,     3,     6,     5,     5,     5,
       5,     3,     3,     3,     3,     1,     3,     3,     1,     3,
       3,     3,     2,     1,     1,     1,     1,     1,     4,     0,
       5,     1,     2,     3,     4,     5,     4,     5,     2,     2,
       2,     2,     2,     1,     3,     1,     3,     1,     2,     3,
       5,     2,     4,     2,     4,     1,     3,     1,     3,     2,
       3,     1,     3,     1,     1,     4,     3,     3,     3,     3,
       2,     1,     1,     1,     4,     3,     3,     3,     3,     2,
       1,     1,     1,     2,     1,     3,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     0,     4,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     3,
       5,     3,     5,     6,     5,     5,     5,     5,     4,     3,
       3,     3,     3,     3,     3,     3,     3,     3,     4,     4,
       2,     2,     3,     3,     3,     3,     3,     3,     3,     3,
       3,     3,     3,     3,     3,     2,     2,     3,     3,     3,
       3,     0,     4,     6,     1,     1,     1,     2,     4,     2,
       3,     1,     1,     1,     1,     2,     4,     2,     1,     2,
       2,     4,     1,     0,     2,     2,     2,     1,     1,     2,
       3,     4,     3,     4,     2,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     0,     4,     0,     3,
       0,     4,     3,     3,     2,     3,     3,     1,     4,     3,
       1,     0,     6,     4,     3,     2,     1,     2,     2,     6,
       6,     0,     0,     7,     0,     0,     7,     5,     4,     0,
       0,     9,     0,     6,     0,     0,     8,     0,     5,     0,
       6,     0,     0,     9,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     2,     1,     1,     1,     5,     1,     2,     1,
       1,     1,     3,     1,     3,     1,     4,     6,     3,     5,
       2,     4,     1,     3,     4,     2,     2,     1,     2,     0,
       6,     8,     4,     6,     4,     2,     6,     2,     4,     6,
       2,     4,     2,     4,     1,     1,     1,     3,     1,     4,
       1,     4,     1,     3,     1,     1,     0,     0,     0,     5,
       4,     1,     3,     3,     0,     5,     2,     4,     5,     5,
       2,     0,     5,     0,     5,     3,     0,     4,     0,     4,
       2,     1,     4,     0,     5,     0,     5,     5,     1,     1,
       6,     1,     1,     1,     1,     2,     1,     2,     1,     1,
       1,     1,     1,     1,     1,     2,     3,     3,     3,     3,
       3,     0,     3,     1,     2,     3,     3,     0,     3,     3,
       3,     3,     3,     0,     3,     0,     3,     0,     2,     0,
       2,     0,     2,     1,     0,     3,     0,     0,     0,     6,
       1,     1,     1,     1,     2,     1,     1,     1,     1,     3,
       1,     1,     2,     2,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     0,     4,     2,     3,     2,     4,     2,
       2,     1,     2,     0,     6,     8,     4,     6,     4,     6,
       2,     4,     6,     2,     4,     2,     4,     1,     0,     1,
       1,     1,     1,     1,     1,     1,     3,     1,     3,     2,
       2,     1,     3,     1,     3,     1,     1,     2,     1,     3,
       3,     1,     3,     1,     3,     1,     1,     2,     1,     1,
       1,     2,     2,     1,     1,     0,     4,     1,     2,     1,
       3,     3,     2,     2,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     0,     1,     0,     1,
       2,     2,     0,     1,     1,     1,     1,     1,     2,     0
    //[
  ];

  // YYTNAME[SYMBOL-NUM] -- String name of the symbol SYMBOL-NUM.
  // First, the terminals, then, starting at \a yyntokens_, nonterminals.
  var yytname_ = this.yytname_ =
  [
    //]
    "\"end-of-input\"", "error", "$undefined", "keyword_class",
  "keyword_module", "keyword_def", "keyword_undef", "keyword_begin",
  "keyword_rescue", "keyword_ensure", "keyword_end", "keyword_if",
  "keyword_unless", "keyword_then", "keyword_elsif", "keyword_else",
  "keyword_case", "keyword_when", "keyword_while", "keyword_until",
  "keyword_for", "keyword_break", "keyword_next", "keyword_redo",
  "keyword_retry", "keyword_in", "keyword_do", "keyword_do_cond",
  "keyword_do_block", "keyword_do_LAMBDA", "keyword_return",
  "keyword_yield", "keyword_super", "keyword_self", "keyword_nil",
  "keyword_true", "keyword_false", "keyword_and", "keyword_or",
  "keyword_not", "modifier_if", "modifier_unless", "modifier_while",
  "modifier_until", "modifier_rescue", "keyword_alias", "keyword_defined",
  "keyword_BEGIN", "keyword_END", "keyword__LINE__", "keyword__FILE__",
  "keyword__ENCODING__", "tIDENTIFIER", "tFID", "tGVAR", "tIVAR",
  "tCONSTANT", "tCVAR", "tLABEL", "tINTEGER", "tFLOAT", "tSTRING_CONTENT",
  "tCHAR", "tNTH_REF", "tBACK_REF", "tREGEXP_END", "\"unary+\"",
  "\"unary-\"", "\"**\"", "\"<=>\"", "\"==\"", "\"===\"", "\"!=\"",
  "\">=\"", "\"<=\"", "\"&&\"", "\"||\"", "\"=~\"", "\"!~\"", "\"..\"",
  "\"...\"", "\"[]\"", "\"[]=\"", "\"<<\"", "\">>\"", "\"::\"",
  "\":: at EXPR_BEG\"", "tOP_ASGN", "\"=>\"", "\"(\"", "\"( arg\"",
  "\")\"", "\"[\"", "\"{\"", "\"{ arg\"", "\"*\"", "\"**arg\"", "\"&\"",
  "\"->\"", "tSYMBEG", "tSTRING_BEG", "tXSTRING_BEG", "tREGEXP_BEG",
  "tWORDS_BEG", "tQWORDS_BEG", "tSYMBOLS_BEG", "tQSYMBOLS_BEG",
  "tSTRING_DBEG", "tSTRING_DEND", "tSTRING_DVAR", "tSTRING_END", "tLAMBEG",
  "tLOWEST", "'='", "'?'", "':'", "'>'", "'<'", "'|'", "'^'", "'&'", "'+'",
  "'-'", "'*'", "'/'", "'%'", "tUMINUS_NUM", "'!'", "'~'", "'{'", "'}'",
  "'['", "'.'", "','", "'`'", "'('", "')'", "']'", "';'", "'\\n'",
  "tLAST_TOKEN", "' '", "$accept", "program", "$@1", "top_compstmt",
  "top_stmts", "top_stmt", "$@2", "bodystmt", "compstmt", "stmts",
  "stmt_or_begin", "$@3", "stmt", "$@4", "command_asgn", "expr",
  "expr_value", "command_call", "block_command", "cmd_brace_block", "@5",
  "fcall", "command", "mlhs", "mlhs_inner", "mlhs_basic", "mlhs_item",
  "mlhs_head", "mlhs_post", "mlhs_node", "lhs", "cname", "cpath", "fname",
  "fsym", "fitem", "undef_list", "$@6", "op", "reswords", "arg", "$@7",
  "arg_value", "aref_args", "paren_args", "opt_paren_args",
  "opt_call_args", "call_args", "command_args", "@8", "block_arg",
  "opt_block_arg", "args", "mrhs", "primary", "@9", "$@10", "$@11", "$@12",
  "$@13", "$@14", "$@15", "$@16", "$@17", "$@18", "@19", "@20", "@21",
  "@22", "@23", "$@24", "$@25", "primary_value", "k_begin", "k_if",
  "k_unless", "k_while", "k_until", "k_case", "k_for", "k_class",
  "k_module", "k_def", "k_end", "then", "do", "if_tail", "opt_else",
  "for_var", "f_marg", "f_marg_list", "f_margs", "block_args_tail",
  "opt_block_args_tail", "block_param", "opt_block_param",
  "block_param_def", "opt_bv_decl", "bv_decls", "bvar", "lambda", "@26",
  "@27", "@28", "f_larglist", "lambda_body", "do_block", "@29",
  "block_call", "method_call", "@30", "@31", "@32", "@33", "brace_block",
  "@34", "@35", "case_body", "cases", "opt_rescue", "exc_list", "exc_var",
  "opt_ensure", "literal", "strings", "string", "string1", "xstring",
  "regexp", "words", "word_list", "word", "symbols", "symbol_list",
  "qwords", "qsymbols", "qword_list", "qsym_list", "string_contents",
  "xstring_contents", "regexp_contents", "string_content", "@36", "@37",
  "@38", "@39", "string_dvar", "symbol", "sym", "dsym", "numeric",
  "user_variable", "keyword_variable", "var_ref", "var_lhs", "backref",
  "superclass", "$@40", "f_arglist", "args_tail", "opt_args_tail",
  "f_args", "f_bad_arg", "f_norm_arg", "f_arg_item", "f_arg", "f_kw",
  "f_block_kw", "f_block_kwarg", "f_kwarg", "kwrest_mark", "f_kwrest",
  "f_opt", "f_block_opt", "f_block_optarg", "f_optarg", "restarg_mark",
  "f_rest_arg", "blkarg_mark", "f_block_arg", "opt_f_block_arg",
  "singleton", "$@41", "assoc_list", "assocs", "assoc", "operation",
  "operation2", "operation3", "dot_or_colon", "opt_terms", "opt_nl",
  "rparen", "rbracket", "trailer", "term", "terms", "none", null
    //[
  ];

  // YYRHS -- A `-1'-separated list of the rules' RHS.
  var yyrhs_ = this.yyrhs_ =
  [
    //]
       143,     0,    -1,    -1,   144,   145,    -1,   146,   332,    -1,
     339,    -1,   147,    -1,   146,   338,   147,    -1,     1,   147,
      -1,   154,    -1,    -1,    47,   148,   129,   145,   130,    -1,
     150,   261,   229,   264,    -1,   151,   332,    -1,   339,    -1,
     152,    -1,   151,   338,   152,    -1,     1,   154,    -1,   154,
      -1,    -1,    47,   153,   129,   145,   130,    -1,    -1,    45,
     177,   155,   177,    -1,    45,    54,    54,    -1,    45,    54,
      64,    -1,    45,    54,    63,    -1,     6,   178,    -1,   154,
      40,   158,    -1,   154,    41,   158,    -1,   154,    42,   158,
      -1,   154,    43,   158,    -1,   154,    44,   154,    -1,    48,
     129,   150,   130,    -1,   156,    -1,   165,   113,   159,    -1,
     296,    87,   159,    -1,   214,   131,   188,   335,    87,   159,
      -1,   214,   132,    52,    87,   159,    -1,   214,   132,    56,
      87,   159,    -1,   214,    85,    56,    87,   159,    -1,   214,
      85,    52,    87,   159,    -1,   297,    87,   159,    -1,   172,
     113,   195,    -1,   165,   113,   184,    -1,   165,   113,   195,
      -1,   157,    -1,   172,   113,   159,    -1,   172,   113,   156,
      -1,   159,    -1,   157,    37,   157,    -1,   157,    38,   157,
      -1,    39,   333,   157,    -1,   127,   159,    -1,   182,    -1,
     157,    -1,   164,    -1,   160,    -1,   250,    -1,   250,   331,
     329,   190,    -1,    -1,    94,   162,   237,   150,   130,    -1,
     328,    -1,   163,   190,    -1,   163,   190,   161,    -1,   214,
     132,   329,   190,    -1,   214,   132,   329,   190,   161,    -1,
     214,    85,   329,   190,    -1,   214,    85,   329,   190,   161,
      -1,    32,   190,    -1,    31,   190,    -1,    30,   189,    -1,
      21,   189,    -1,    22,   189,    -1,   167,    -1,    89,   166,
     334,    -1,   167,    -1,    89,   166,   334,    -1,   169,    -1,
     169,   168,    -1,   169,    95,   171,    -1,   169,    95,   171,
     133,   170,    -1,   169,    95,    -1,   169,    95,   133,   170,
      -1,    95,   171,    -1,    95,   171,   133,   170,    -1,    95,
      -1,    95,   133,   170,    -1,   171,    -1,    89,   166,   334,
      -1,   168,   133,    -1,   169,   168,   133,    -1,   168,    -1,
     170,   133,   168,    -1,   293,    -1,   294,    -1,   214,   131,
     188,   335,    -1,   214,   132,    52,    -1,   214,    85,    52,
      -1,   214,   132,    56,    -1,   214,    85,    56,    -1,    86,
      56,    -1,   297,    -1,   293,    -1,   294,    -1,   214,   131,
     188,   335,    -1,   214,   132,    52,    -1,   214,    85,    52,
      -1,   214,   132,    56,    -1,   214,    85,    56,    -1,    86,
      56,    -1,   297,    -1,    52,    -1,    56,    -1,    86,   173,
      -1,   173,    -1,   214,    85,   173,    -1,    52,    -1,    56,
      -1,    53,    -1,   180,    -1,   181,    -1,   175,    -1,   289,
      -1,   176,    -1,   291,    -1,   177,    -1,    -1,   178,   133,
     179,   177,    -1,   118,    -1,   119,    -1,   120,    -1,    69,
      -1,    70,    -1,    71,    -1,    77,    -1,    78,    -1,   116,
      -1,    73,    -1,   117,    -1,    74,    -1,    72,    -1,    83,
      -1,    84,    -1,   121,    -1,   122,    -1,   123,    -1,    95,
      -1,   124,    -1,   125,    -1,    68,    -1,    96,    -1,   127,
      -1,   128,    -1,    66,    -1,    67,    -1,    81,    -1,    82,
      -1,   134,    -1,    49,    -1,    50,    -1,    51,    -1,    47,
      -1,    48,    -1,    45,    -1,    37,    -1,     7,    -1,    21,
      -1,    16,    -1,     3,    -1,     5,    -1,    46,    -1,    26,
      -1,    15,    -1,    14,    -1,    10,    -1,     9,    -1,    36,
      -1,    20,    -1,    25,    -1,     4,    -1,    22,    -1,    34,
      -1,    39,    -1,    38,    -1,    23,    -1,     8,    -1,    24,
      -1,    30,    -1,    33,    -1,    32,    -1,    13,    -1,    35,
      -1,     6,    -1,    17,    -1,    31,    -1,    11,    -1,    12,
      -1,    18,    -1,    19,    -1,   172,   113,   182,    -1,   172,
     113,   182,    44,   182,    -1,   296,    87,   182,    -1,   296,
      87,   182,    44,   182,    -1,   214,   131,   188,   335,    87,
     182,    -1,   214,   132,    52,    87,   182,    -1,   214,   132,
      56,    87,   182,    -1,   214,    85,    52,    87,   182,    -1,
     214,    85,    56,    87,   182,    -1,    86,    56,    87,   182,
      -1,   297,    87,   182,    -1,   182,    79,   182,    -1,   182,
      80,   182,    -1,   182,   121,   182,    -1,   182,   122,   182,
      -1,   182,   123,   182,    -1,   182,   124,   182,    -1,   182,
     125,   182,    -1,   182,    68,   182,    -1,   126,    59,    68,
     182,    -1,   126,    60,    68,   182,    -1,    66,   182,    -1,
      67,   182,    -1,   182,   118,   182,    -1,   182,   119,   182,
      -1,   182,   120,   182,    -1,   182,    69,   182,    -1,   182,
     116,   182,    -1,   182,    73,   182,    -1,   182,   117,   182,
      -1,   182,    74,   182,    -1,   182,    70,   182,    -1,   182,
      71,   182,    -1,   182,    72,   182,    -1,   182,    77,   182,
      -1,   182,    78,   182,    -1,   127,   182,    -1,   128,   182,
      -1,   182,    83,   182,    -1,   182,    84,   182,    -1,   182,
      75,   182,    -1,   182,    76,   182,    -1,    -1,    46,   333,
     183,   182,    -1,   182,   114,   182,   333,   115,   182,    -1,
     196,    -1,   182,    -1,   339,    -1,   194,   336,    -1,   194,
     133,   326,   336,    -1,   326,   336,    -1,   135,   188,   334,
      -1,   339,    -1,   186,    -1,   339,    -1,   189,    -1,   194,
     133,    -1,   194,   133,   326,   133,    -1,   326,   133,    -1,
     164,    -1,   194,   193,    -1,   326,   193,    -1,   194,   133,
     326,   193,    -1,   192,    -1,    -1,   191,   189,    -1,    97,
     184,    -1,   133,   192,    -1,   339,    -1,   184,    -1,    95,
     184,    -1,   194,   133,   184,    -1,   194,   133,    95,   184,
      -1,   194,   133,   184,    -1,   194,   133,    95,   184,    -1,
      95,   184,    -1,   265,    -1,   266,    -1,   269,    -1,   270,
      -1,   271,    -1,   276,    -1,   274,    -1,   277,    -1,   295,
      -1,   297,    -1,    53,    -1,    -1,   215,   197,   149,   225,
      -1,    -1,    90,   198,   334,    -1,    -1,    90,   157,   199,
     334,    -1,    89,   150,   136,    -1,   214,    85,    56,    -1,
      86,    56,    -1,    92,   185,   137,    -1,    93,   325,   130,
      -1,    30,    -1,    31,   135,   189,   334,    -1,    31,   135,
     334,    -1,    31,    -1,    -1,    46,   333,   135,   200,   157,
     334,    -1,    39,   135,   157,   334,    -1,    39,   135,   334,
      -1,   163,   256,    -1,   251,    -1,   251,   256,    -1,    98,
     242,    -1,   216,   158,   226,   150,   228,   225,    -1,   217,
     158,   226,   150,   229,   225,    -1,    -1,    -1,   218,   201,
     158,   227,   202,   150,   225,    -1,    -1,    -1,   219,   203,
     158,   227,   204,   150,   225,    -1,   220,   158,   332,   259,
     225,    -1,   220,   332,   259,   225,    -1,    -1,    -1,   221,
     230,    25,   205,   158,   227,   206,   150,   225,    -1,    -1,
     222,   174,   298,   207,   149,   225,    -1,    -1,    -1,   222,
      83,   157,   208,   337,   209,   149,   225,    -1,    -1,   223,
     174,   210,   149,   225,    -1,    -1,   224,   175,   211,   300,
     149,   225,    -1,    -1,    -1,   224,   323,   331,   212,   175,
     213,   300,   149,   225,    -1,    21,    -1,    22,    -1,    23,
      -1,    24,    -1,   196,    -1,     7,    -1,    11,    -1,    12,
      -1,    18,    -1,    19,    -1,    16,    -1,    20,    -1,     3,
      -1,     4,    -1,     5,    -1,    10,    -1,   337,    -1,    13,
      -1,   337,    13,    -1,   337,    -1,    27,    -1,   229,    -1,
      14,   158,   226,   150,   228,    -1,   339,    -1,    15,   150,
      -1,   172,    -1,   165,    -1,   305,    -1,    89,   233,   334,
      -1,   231,    -1,   232,   133,   231,    -1,   232,    -1,   232,
     133,    95,   305,    -1,   232,   133,    95,   305,   133,   232,
      -1,   232,   133,    95,    -1,   232,   133,    95,   133,   232,
      -1,    95,   305,    -1,    95,   305,   133,   232,    -1,    95,
      -1,    95,   133,   232,    -1,   310,   133,   313,   322,    -1,
     310,   322,    -1,   313,   322,    -1,   321,    -1,   133,   234,
      -1,    -1,   307,   133,   316,   133,   319,   235,    -1,   307,
     133,   316,   133,   319,   133,   307,   235,    -1,   307,   133,
     316,   235,    -1,   307,   133,   316,   133,   307,   235,    -1,
     307,   133,   319,   235,    -1,   307,   133,    -1,   307,   133,
     319,   133,   307,   235,    -1,   307,   235,    -1,   316,   133,
     319,   235,    -1,   316,   133,   319,   133,   307,   235,    -1,
     316,   235,    -1,   316,   133,   307,   235,    -1,   319,   235,
      -1,   319,   133,   307,   235,    -1,   234,    -1,   339,    -1,
     238,    -1,   118,   239,   118,    -1,    76,    -1,   118,   236,
     239,   118,    -1,   333,    -1,   333,   138,   240,   333,    -1,
     241,    -1,   240,   133,   241,    -1,    52,    -1,   304,    -1,
      -1,    -1,    -1,   243,   244,   246,   245,   247,    -1,   135,
     303,   239,   136,    -1,   303,    -1,   111,   150,   130,    -1,
      29,   150,    10,    -1,    -1,    28,   249,   237,   150,    10,
      -1,   164,   248,    -1,   250,   331,   329,   187,    -1,   250,
     331,   329,   187,   256,    -1,   250,   331,   329,   190,   248,
      -1,   163,   186,    -1,    -1,   214,   132,   329,   252,   187,
      -1,    -1,   214,    85,   329,   253,   186,    -1,   214,    85,
     330,    -1,    -1,   214,   132,   254,   186,    -1,    -1,   214,
      85,   255,   186,    -1,    32,   186,    -1,    32,    -1,   214,
     131,   188,   335,    -1,    -1,   129,   257,   237,   150,   130,
      -1,    -1,    26,   258,   237,   150,    10,    -1,    17,   194,
     226,   150,   260,    -1,   229,    -1,   259,    -1,     8,   262,
     263,   226,   150,   261,    -1,   339,    -1,   184,    -1,   195,
      -1,   339,    -1,    88,   172,    -1,   339,    -1,     9,   150,
      -1,   339,    -1,   292,    -1,   289,    -1,   291,    -1,   267,
      -1,    62,    -1,   268,    -1,   267,   268,    -1,   100,   280,
     110,    -1,   101,   281,   110,    -1,   102,   282,    65,    -1,
     103,   141,   110,    -1,   103,   272,   110,    -1,    -1,   272,
     273,   141,    -1,   283,    -1,   273,   283,    -1,   105,   141,
     110,    -1,   105,   275,   110,    -1,    -1,   275,   273,   141,
      -1,   104,   141,   110,    -1,   104,   278,   110,    -1,   106,
     141,   110,    -1,   106,   279,   110,    -1,    -1,   278,    61,
     141,    -1,    -1,   279,    61,   141,    -1,    -1,   280,   283,
      -1,    -1,   281,   283,    -1,    -1,   282,   283,    -1,    61,
      -1,    -1,   109,   284,   288,    -1,    -1,    -1,    -1,   107,
     285,   286,   287,   150,   108,    -1,    54,    -1,    55,    -1,
      57,    -1,   297,    -1,    99,   290,    -1,   175,    -1,    55,
      -1,    54,    -1,    57,    -1,    99,   281,   110,    -1,    59,
      -1,    60,    -1,   126,    59,    -1,   126,    60,    -1,    52,
      -1,    55,    -1,    54,    -1,    56,    -1,    57,    -1,    34,
      -1,    33,    -1,    35,    -1,    36,    -1,    50,    -1,    49,
      -1,    51,    -1,   293,    -1,   294,    -1,   293,    -1,   294,
      -1,    63,    -1,    64,    -1,   337,    -1,    -1,   117,   299,
     158,   337,    -1,     1,   337,    -1,   135,   303,   334,    -1,
     303,   337,    -1,   311,   133,   313,   322,    -1,   311,   322,
      -1,   313,   322,    -1,   321,    -1,   133,   301,    -1,    -1,
     307,   133,   317,   133,   319,   302,    -1,   307,   133,   317,
     133,   319,   133,   307,   302,    -1,   307,   133,   317,   302,
      -1,   307,   133,   317,   133,   307,   302,    -1,   307,   133,
     319,   302,    -1,   307,   133,   319,   133,   307,   302,    -1,
     307,   302,    -1,   317,   133,   319,   302,    -1,   317,   133,
     319,   133,   307,   302,    -1,   317,   302,    -1,   317,   133,
     307,   302,    -1,   319,   302,    -1,   319,   133,   307,   302,
      -1,   301,    -1,    -1,    56,    -1,    55,    -1,    54,    -1,
      57,    -1,   304,    -1,    52,    -1,   305,    -1,    89,   233,
     334,    -1,   306,    -1,   307,   133,   306,    -1,    58,   184,
      -1,    58,   214,    -1,   309,    -1,   310,   133,   309,    -1,
     308,    -1,   311,   133,   308,    -1,    68,    -1,    96,    -1,
     312,    52,    -1,   312,    -1,    52,   113,   184,    -1,    52,
     113,   214,    -1,   315,    -1,   316,   133,   315,    -1,   314,
      -1,   317,   133,   314,    -1,   123,    -1,    95,    -1,   318,
      52,    -1,   318,    -1,   120,    -1,    97,    -1,   320,    52,
      -1,   133,   321,    -1,   339,    -1,   295,    -1,    -1,   135,
     324,   157,   334,    -1,   339,    -1,   326,   336,    -1,   327,
      -1,   326,   133,   327,    -1,   184,    88,   184,    -1,    58,
     184,    -1,    96,   184,    -1,    52,    -1,    56,    -1,    53,
      -1,    52,    -1,    56,    -1,    53,    -1,   180,    -1,    52,
      -1,    53,    -1,   180,    -1,   132,    -1,    85,    -1,    -1,
     338,    -1,    -1,   139,    -1,   333,   136,    -1,   333,   137,
      -1,    -1,   139,    -1,   133,    -1,   138,    -1,   139,    -1,
     337,    -1,   338,   138,    -1,    -1
    //[
  ];

  // YYPRHS[YYN] -- Index of the first RHS symbol of rule number YYN in YYRHS.
  var yyprhs_= this.yyprhs_ =
  [
    //]
         0,     0,     3,     4,     7,    10,    12,    14,    18,    21,
      23,    24,    30,    35,    38,    40,    42,    46,    49,    51,
      52,    58,    59,    64,    68,    72,    76,    79,    83,    87,
      91,    95,    99,   104,   106,   110,   114,   121,   127,   133,
     139,   145,   149,   153,   157,   161,   163,   167,   171,   173,
     177,   181,   185,   188,   190,   192,   194,   196,   198,   203,
     204,   210,   212,   215,   219,   224,   230,   235,   241,   244,
     247,   250,   253,   256,   258,   262,   264,   268,   270,   273,
     277,   283,   286,   291,   294,   299,   301,   305,   307,   311,
     314,   318,   320,   324,   326,   328,   333,   337,   341,   345,
     349,   352,   354,   356,   358,   363,   367,   371,   375,   379,
     382,   384,   386,   388,   391,   393,   397,   399,   401,   403,
     405,   407,   409,   411,   413,   415,   417,   418,   423,   425,
     427,   429,   431,   433,   435,   437,   439,   441,   443,   445,
     447,   449,   451,   453,   455,   457,   459,   461,   463,   465,
     467,   469,   471,   473,   475,   477,   479,   481,   483,   485,
     487,   489,   491,   493,   495,   497,   499,   501,   503,   505,
     507,   509,   511,   513,   515,   517,   519,   521,   523,   525,
     527,   529,   531,   533,   535,   537,   539,   541,   543,   545,
     547,   549,   551,   553,   555,   557,   559,   561,   563,   565,
     569,   575,   579,   585,   592,   598,   604,   610,   616,   621,
     625,   629,   633,   637,   641,   645,   649,   653,   657,   662,
     667,   670,   673,   677,   681,   685,   689,   693,   697,   701,
     705,   709,   713,   717,   721,   725,   728,   731,   735,   739,
     743,   747,   748,   753,   760,   762,   764,   766,   769,   774,
     777,   781,   783,   785,   787,   789,   792,   797,   800,   802,
     805,   808,   813,   815,   816,   819,   822,   825,   827,   829,
     832,   836,   841,   845,   850,   853,   855,   857,   859,   861,
     863,   865,   867,   869,   871,   873,   875,   876,   881,   882,
     886,   887,   892,   896,   900,   903,   907,   911,   913,   918,
     922,   924,   925,   932,   937,   941,   944,   946,   949,   952,
     959,   966,   967,   968,   976,   977,   978,   986,   992,   997,
     998,   999,  1009,  1010,  1017,  1018,  1019,  1028,  1029,  1035,
    1036,  1043,  1044,  1045,  1055,  1057,  1059,  1061,  1063,  1065,
    1067,  1069,  1071,  1073,  1075,  1077,  1079,  1081,  1083,  1085,
    1087,  1089,  1091,  1094,  1096,  1098,  1100,  1106,  1108,  1111,
    1113,  1115,  1117,  1121,  1123,  1127,  1129,  1134,  1141,  1145,
    1151,  1154,  1159,  1161,  1165,  1170,  1173,  1176,  1178,  1181,
    1182,  1189,  1198,  1203,  1210,  1215,  1218,  1225,  1228,  1233,
    1240,  1243,  1248,  1251,  1256,  1258,  1260,  1262,  1266,  1268,
    1273,  1275,  1280,  1282,  1286,  1288,  1290,  1291,  1292,  1293,
    1299,  1304,  1306,  1310,  1314,  1315,  1321,  1324,  1329,  1335,
    1341,  1344,  1345,  1351,  1352,  1358,  1362,  1363,  1368,  1369,
    1374,  1377,  1379,  1384,  1385,  1391,  1392,  1398,  1404,  1406,
    1408,  1415,  1417,  1419,  1421,  1423,  1426,  1428,  1431,  1433,
    1435,  1437,  1439,  1441,  1443,  1445,  1448,  1452,  1456,  1460,
    1464,  1468,  1469,  1473,  1475,  1478,  1482,  1486,  1487,  1491,
    1495,  1499,  1503,  1507,  1508,  1512,  1513,  1517,  1518,  1521,
    1522,  1525,  1526,  1529,  1531,  1532,  1536,  1537,  1538,  1539,
    1546,  1548,  1550,  1552,  1554,  1557,  1559,  1561,  1563,  1565,
    1569,  1571,  1573,  1576,  1579,  1581,  1583,  1585,  1587,  1589,
    1591,  1593,  1595,  1597,  1599,  1601,  1603,  1605,  1607,  1609,
    1611,  1613,  1615,  1617,  1618,  1623,  1626,  1630,  1633,  1638,
    1641,  1644,  1646,  1649,  1650,  1657,  1666,  1671,  1678,  1683,
    1690,  1693,  1698,  1705,  1708,  1713,  1716,  1721,  1723,  1724,
    1726,  1728,  1730,  1732,  1734,  1736,  1738,  1742,  1744,  1748,
    1751,  1754,  1756,  1760,  1762,  1766,  1768,  1770,  1773,  1775,
    1779,  1783,  1785,  1789,  1791,  1795,  1797,  1799,  1802,  1804,
    1806,  1808,  1811,  1814,  1816,  1818,  1819,  1824,  1826,  1829,
    1831,  1835,  1839,  1842,  1845,  1847,  1849,  1851,  1853,  1855,
    1857,  1859,  1861,  1863,  1865,  1867,  1869,  1870,  1872,  1873,
    1875,  1878,  1881,  1882,  1884,  1886,  1888,  1890,  1892,  1895
    //[
  ];

  // YYTRANSLATE(YYLEX) -- Bison symbol number corresponding to YYLEX.
  var yytranslate_table_ =
  [
    //]
         0,     2,     2,     2,     2,     2,     2,     2,     2,     2,
     139,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,   141,   127,     2,     2,     2,   125,   120,     2,
     135,   136,   123,   121,   133,   122,   132,   124,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,   115,   138,
     117,   113,   116,   114,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,   131,     2,   137,   119,     2,   134,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,   129,   118,   130,   128,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     1,     2,     3,     4,
       5,     6,     7,     8,     9,    10,    11,    12,    13,    14,
      15,    16,    17,    18,    19,    20,    21,    22,    23,    24,
      25,    26,    27,    28,    29,    30,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    40,    41,    42,    43,    44,
      45,    46,    47,    48,    49,    50,    51,    52,    53,    54,
      55,    56,    57,    58,    59,    60,    61,    62,    63,    64,
      65,    66,    67,    68,    69,    70,    71,    72,    73,    74,
      75,    76,    77,    78,    79,    80,    81,    82,    83,    84,
      85,    86,    87,    88,    89,    90,    91,    92,    93,    94,
      95,    96,    97,    98,    99,   100,   101,   102,   103,   104,
     105,   106,   107,   108,   109,   110,   111,   112,   126,   140
    //[
  ];

  var yylast_ = this.yylast_ = 11010;
  var yynnts_ = 198;
  var yyempty_ = this.yyempty_ = -2;
  var yyfinal_ = 3;
  var yyterror_ = this.yyterror_ = 1;
  var yyerrcode_ = 256;

  var yyuser_token_number_max_ = 369;
  var yyundef_token_ = 2;
} // YYParser

// rare used functions
YYParser.prototype =
{
  // Report on the debug stream that the rule yyrule is going to be reduced.


  // Generate an error message.
  yysyntax_error: function yysyntax_error (yystate, tok)
  {
    if (!this.errorVerbose)
      return "syntax error";

    


    if (tok == this.yyempty_)
      return "syntax error (empty token)";

    // FIXME: This method of building the message is not compatible
    // with internationalization.
    var res = "syntax error, unexpected ";
    res += yytnamerr_(this.yytname_[tok]);
    var yyn = this.yypact_[yystate];
    if (yyn != this.yypact_ninf_) // yyn pact value isn't default
    {
      // Start YYX at -YYN if negative to avoid negative indexes in YYCHECK.
      // In other words, skip the first -YYN actions for this state
      // because they are default actions.
      var yyxbegin = yyn < 0 ? -yyn : 0;
      // Stay within bounds of both yycheck and yytname.
      var yychecklim = this.yylast_ - yyn + 1;
      var yyxend = yychecklim < this.yyntokens_ ? yychecklim : this.yyntokens_;
      var count = 0;
      for (var x = yyxbegin; x < yyxend; ++x)
      {
        if
        (
          this.yycheck_[x + yyn] == x
          && x != this.yyterror_
          && this.yytable_[x + yyn] != this.yytable_ninf_ // yytable_[x + yyn] isn't an error
        )
        {    
          ++count;
        }
      }
      if (count < 5)
      {
        count = 0;
        for (var x = yyxbegin; x < yyxend; ++x)
        {
          if
          (
            this.yycheck_[x + yyn] == x
            && x != this.yyterror_
            && this.yytable_[x + yyn] != this.yytable_ninf_ // yytable_[x + yyn] isn't an error
          )
          {
            res += (count++ == 0 ? ", expecting " : " or ");
            res += yytnamerr_(this.yytname_[x]);
          }
        }
      }
    }
    return res;

    




    function yytnamerr_ (yystr)
    {
      if (yystr[0] == '"')
      {
        var yyr = '';
        strip_quotes:
        for (var i = 1; i < yystr.length; i++)
        {
          switch (yystr[i])
          {
            case '\'':
            case ',':
              break strip_quotes;

            case '\\':
              if (yystr[++i] != '\\')
                break strip_quotes;
                // Fall through.

            case '"':
              return yyr;

            default:
              yyr += yystr[i];
              break;
          }
        }
      }
      else if (yystr == "$end")
        return "end of input";

      return yystr;
    }
  }
}

// Version number for the Bison executable that generated this parser.
YYParser.bisonVersion = "2.7.12-4996";

// Name of the skeleton that generated this parser.
YYParser.bisonSkeleton = "./lalr1.js";

YYParser.Stack = function Stack ()
{
  var stateStack = this.stateStack = [];
  var valueStack = this.valueStack = [];

  this.push = function push (state, value)
  {
    stateStack.push(state);
    valueStack.push(value);
  }

  this.pop = function pop (num)
  {
    if (num <= 0)
      return;

    valueStack.length -= num;
    stateStack.length -= num; // TODO: original code lacks this line
  }

  this.stateAt = function stateAt (i)
  {
    return stateStack[stateStack.length-1 - i];
  }

  this.valueAt = function valueAt (i)
  {
    return valueStack[valueStack.length-1 - i];
  }

  // used in debug mode or in an error recovery mode only
  this.height = function height ()
  {
    return stateStack.length-1;
  }
}


function YYActions ()
{





// here goes the code needed in rules only, when generating nodes,
// we still know all the token numbers here too.

var lexer, parser, builder, scope;
// public:
this.setLexer   = function (v) { lexer = v; }
this.setParser  = function (v) { parser = v; }
this.setBuilder = function (v) { builder = v; }
this.setScope   = function (v) { scope = v; }






this.table =
{
    2: function (yyval, yyvs)
{
  
    {
      lexer.lex_state = EXPR_BEG;
      // creates a new chain link of `lvtbl`es
      scope.push_dynamic();
    };
  
  return yyval;
},
  3: function (yyval, yyvs)
{
  
    {
      scope.pop();
      
      builder.resulting_ast = yyvs[yyvs.length-1-((2-(2)))];
    };
  
  return yyval;
},
  4: function (yyval, yyvs)
{
  
    {
      // was: void_stmts($1);
      // was: fixup_nodes(deferred_nodes);
      yyval = builder.compstmt(yyvs[yyvs.length-1-((2-(1)))]);
    };
  
  return yyval;
},
  5: function (yyval, yyvs)
{
  
    {
      yyval = []; // statements accumulator
    };
  
  return yyval;
},
  6: function (yyval, yyvs)
{
  
    {
      yyval = [yyvs[yyvs.length-1-((1-(1)))]];
    };
  
  return yyval;
},
  7: function (yyval, yyvs)
{
  
    {
      yyvs[yyvs.length-1-((3-(1)))].push(yyvs[yyvs.length-1-((3-(3)))]);
      yyval = yyvs[yyvs.length-1-((3-(1)))];
    };
  
  return yyval;
},
  8: function (yyval, yyvs)
{
  
    {
      yyval = [yyvs[yyvs.length-1-((2-(2)))]];
    };
  
  return yyval;
},
  10: function (yyval, yyvs)
{
  
    {
      // RIPPER
    };
  
  return yyval;
},
  11: function (yyval, yyvs)
{
  
    {
      yyval = builder.preexe(yyvs[yyvs.length-1-((5-(4)))]);
    };
  
  return yyval;
},
  12: function (yyval, yyvs)
{
  
    {
      var rescue_bodies   = yyvs[yyvs.length-1-((4-(2)))];
      var else_           = yyvs[yyvs.length-1-((4-(3)))];
      var ensure          = yyvs[yyvs.length-1-((4-(4)))];

      if (else_ != null && rescue_bodies.length == 0)
      {
        // TODO
        // diagnostic :warning, :useless_else, else_t
        lexer.warn("else without rescue is useless");
      }

      yyval = builder.begin_body(yyvs[yyvs.length-1-((4-(1)))], rescue_bodies, else_, ensure);
    };
  
  return yyval;
},
  13: function (yyval, yyvs)
{
  
    {
      yyval = builder.compstmt(yyvs[yyvs.length-1-((2-(1)))]);
    };
  
  return yyval;
},
  14: function (yyval, yyvs)
{
  
    {
      yyval = [];
    };
  
  return yyval;
},
  15: function (yyval, yyvs)
{
  
    {
      yyval = [yyvs[yyvs.length-1-((1-(1)))]];
    };
  
  return yyval;
},
  16: function (yyval, yyvs)
{
  
    {
      var stmts = yyvs[yyvs.length-1-((3-(1)))];
      stmts.push(yyvs[yyvs.length-1-((3-(3)))]);
      yyval = stmts;
    };
  
  return yyval;
},
  17: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((2-(2)))] ];
    };
  
  return yyval;
},
  19: function (yyval, yyvs)
{
  
    {
      if (lexer.in_def)
      {
        lexer.yyerror("BEGIN is permitted only at toplevel");
      }
    };
  
  return yyval;
},
  20: function (yyval, yyvs)
{
  
    {
      yyval = builder.preexe(yyvs[yyvs.length-1-((5-(4)))]);
    };
  
  return yyval;
},
  21: function (yyval, yyvs)
{
  
    {
      lexer.lex_state = EXPR_FNAME;
    };
  
  return yyval;
},
  22: function (yyval, yyvs)
{
  
    {
      yyval = builder.alias(yyvs[yyvs.length-1-((4-(2)))], yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  23: function (yyval, yyvs)
{
  
    {
      yyval = builder.alias_gvar_gvar(yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  24: function (yyval, yyvs)
{
  
    {
      yyval = builder.alias_gvar_backref(yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  25: function (yyval, yyvs)
{
  
    {
      lexer.yyerror("can't make alias for the number variables");
      // $$ = NEW_BEGIN(null);
    };
  
  return yyval;
},
  26: function (yyval, yyvs)
{
  
    {
      yyval = builder.undef_method(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  27: function (yyval, yyvs)
{
  
    {
      // true branch, null, the body
      yyval = builder.condition_mod(yyvs[yyvs.length-1-((3-(1)))], null, yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  28: function (yyval, yyvs)
{
  
    {
      // null, false branch, the body
      yyval = builder.condition_mod(null, yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  29: function (yyval, yyvs)
{
  
    {
      yyval = builder.loop_mod('while', yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  30: function (yyval, yyvs)
{
  
    {
      yyval = builder.loop_mod('until', yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  31: function (yyval, yyvs)
{
  
    {
      // exc_list, exc_var, compound_stmt
      var rescue_body = builder.rescue_body(null, null, yyvs[yyvs.length-1-((3-(3)))]);
      yyval = builder.begin_body(yyvs[yyvs.length-1-((3-(1)))], [ rescue_body ]);
    };
  
  return yyval;
},
  32: function (yyval, yyvs)
{
  
    {
      if (lexer.in_def || lexer.in_single)
      {
        lexer.warn("END in method; use at_exit");
      }
      
      yyval = builder.postexe(yyvs[yyvs.length-1-((4-(3)))]);
    };
  
  return yyval;
},
  34: function (yyval, yyvs)
{
  
    {
      yyval = builder.multi_assign(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  35: function (yyval, yyvs)
{
  
    {
      yyval = builder.op_assign(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  36: function (yyval, yyvs)
{
  
    {
      yyval = builder.op_assign(builder.index(yyvs[yyvs.length-1-((6-(1)))], yyvs[yyvs.length-1-((6-(3)))]), yyvs[yyvs.length-1-((6-(5)))], yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  37: function (yyval, yyvs)
{
  
    {
      yyval = builder.op_assign(builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))]), yyvs[yyvs.length-1-((5-(4)))], yyvs[yyvs.length-1-((5-(5)))]);
    };
  
  return yyval;
},
  38: function (yyval, yyvs)
{
  
    {
      yyval = builder.op_assign(builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))]), yyvs[yyvs.length-1-((5-(4)))], yyvs[yyvs.length-1-((5-(5)))]);
    };
  
  return yyval;
},
  39: function (yyval, yyvs)
{
  
    {
      yyval = builder.op_assign(builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))]), yyvs[yyvs.length-1-((5-(4)))], yyvs[yyvs.length-1-((5-(5)))]);
    };
  
  return yyval;
},
  40: function (yyval, yyvs)
{
  
    {
      yyval = builder.op_assign(builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))]), yyvs[yyvs.length-1-((5-(4)))], yyvs[yyvs.length-1-((5-(5)))]);
    };
  
  return yyval;
},
  41: function (yyval, yyvs)
{
  
    {
      // expected to return `null` as Ruby doesn't allow backref assignment
      yyval = builder.op_assign(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  42: function (yyval, yyvs)
{
  
    {
      // mrhs is an array
      yyval = builder.assign(yyvs[yyvs.length-1-((3-(1)))], builder.array(yyvs[yyvs.length-1-((3-(3)))]));
    };
  
  return yyval;
},
  43: function (yyval, yyvs)
{
  
    {
      yyval = builder.multi_assign(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  44: function (yyval, yyvs)
{
  
    {
      yyval = builder.multi_assign(yyvs[yyvs.length-1-((3-(1)))], builder.array(yyvs[yyvs.length-1-((3-(3)))]));
    };
  
  return yyval;
},
  46: function (yyval, yyvs)
{
  
    {
      yyval = builder.assign(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  47: function (yyval, yyvs)
{
  
    {
      yyval = builder.assign(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  49: function (yyval, yyvs)
{
  
    {
      yyval = builder.logical_op('and', yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  50: function (yyval, yyvs)
{
  
    {
      yyval = builder.logical_op('or', yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  51: function (yyval, yyvs)
{
  
    {
      yyval = builder.not_op(yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  52: function (yyval, yyvs)
{
  
    {
      yyval = builder.not_op(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  58: function (yyval, yyvs)
{
  
    {
      yyval = builder.call_method(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(2)))], yyvs[yyvs.length-1-((4-(3)))], yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  59: function (yyval, yyvs)
{
  
    {
      scope.push_dynamic();
      // $<num>$ = lexer.ruby_sourceline;
    };
  
  return yyval;
},
  60: function (yyval, yyvs)
{
  
    {
      yyval = { args: yyvs[yyvs.length-1-((5-(3)))], body: yyvs[yyvs.length-1-((5-(4)))] };
      
      // touching this alters the parse.output
      yyvs[yyvs.length-1-((5-(2)))]; // nd_set_line($$, $<num>2);
      scope.pop();
    };
  
  return yyval;
},
  61: function (yyval, yyvs)
{
  
    {
      // nd_set_line($$, tokline); TODO
    };
  
  return yyval;
},
  62: function (yyval, yyvs)
{
  
    {
      yyval = builder.call_method(null, null, yyvs[yyvs.length-1-((2-(1)))], yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  63: function (yyval, yyvs)
{
  
    {
      var method_call = builder.call_method(null, null, yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))]);

      var block = yyvs[yyvs.length-1-((3-(3)))];
      yyval = builder.block(method_call, block.args, block.body);
    };
  
  return yyval;
},
  64: function (yyval, yyvs)
{
  
    {
      yyval = builder.call_method(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(2)))], yyvs[yyvs.length-1-((4-(3)))], yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  65: function (yyval, yyvs)
{
  
    {
      var method_call = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))], yyvs[yyvs.length-1-((5-(4)))]);

      var block = yyvs[yyvs.length-1-((5-(5)))];
      yyval = builder.block(method_call, block.args, block.body);
    };
  
  return yyval;
},
  66: function (yyval, yyvs)
{
  
    {
      yyval = builder.call_method(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(2)))], yyvs[yyvs.length-1-((4-(3)))], yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  67: function (yyval, yyvs)
{
  
    {
      var method_call = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))], yyvs[yyvs.length-1-((5-(4)))]);

      var block = yyvs[yyvs.length-1-((5-(5)))];
      yyval = builder.block(method_call, block.args, block.body);
    };
  
  return yyval;
},
  68: function (yyval, yyvs)
{
  
    {
      yyval = builder.keyword_cmd('super', yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  69: function (yyval, yyvs)
{
  
    {
      yyval = builder.keyword_cmd('yield', yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  70: function (yyval, yyvs)
{
  
    {
      yyval = builder.keyword_cmd('return', yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  71: function (yyval, yyvs)
{
  
    {
      yyval = builder.keyword_cmd('break', yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  72: function (yyval, yyvs)
{
  
    {
      yyval = builder.keyword_cmd('next', yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  73: function (yyval, yyvs)
{
  
    {
      yyval = builder.multi_lhs(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  74: function (yyval, yyvs)
{
  
    {
      yyval = builder.begin(yyvs[yyvs.length-1-((3-(2)))]);
    };
  
  return yyval;
},
  75: function (yyval, yyvs)
{
  
    {
      yyval = builder.multi_lhs(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  76: function (yyval, yyvs)
{
  
    {
      yyval = builder.multi_lhs(yyvs[yyvs.length-1-((3-(2)))]);
    };
  
  return yyval;
},
  78: function (yyval, yyvs)
{
  
    {
      var mlhs_head = yyvs[yyvs.length-1-((2-(1)))];
      mlhs_head.push(yyvs[yyvs.length-1-((2-(2)))]);
      yyval = mlhs_head;
    };
  
  return yyval;
},
  79: function (yyval, yyvs)
{
  
    {
      var mlhs_head = yyvs[yyvs.length-1-((3-(1)))];
      mlhs_head.push(builder.splat(yyvs[yyvs.length-1-((3-(3)))]));
      yyval = mlhs_head;
    };
  
  return yyval;
},
  80: function (yyval, yyvs)
{
  
    {
      var mlhs_head = yyvs[yyvs.length-1-((5-(1)))];
      mlhs_head.push(builder.splat(yyvs[yyvs.length-1-((5-(3)))]));
      Array_push.apply(mlhs_head, yyvs[yyvs.length-1-((5-(5)))]);
      yyval = mlhs_head;
    };
  
  return yyval;
},
  81: function (yyval, yyvs)
{
  
    {
      var mlhs_head = yyvs[yyvs.length-1-((2-(1)))];
      mlhs_head.push(builder.splat_empty());
      yyval = mlhs_head;
    };
  
  return yyval;
},
  82: function (yyval, yyvs)
{
  
    {
      var mlhs_head = yyvs[yyvs.length-1-((4-(1)))];
      mlhs_head.push(builder.splat_empty());
      Array_push.apply(mlhs_head, yyvs[yyvs.length-1-((4-(4)))]);
      yyval = mlhs_head;
    };
  
  return yyval;
},
  83: function (yyval, yyvs)
{
  
    {
      yyval = [ builder.splat(yyvs[yyvs.length-1-((2-(2)))]) ];
    };
  
  return yyval;
},
  84: function (yyval, yyvs)
{
  
    {
      var ary = [ builder.splat(yyvs[yyvs.length-1-((4-(2)))]) ];
      Array_push.apply(ary, yyvs[yyvs.length-1-((4-(4)))]);
      yyval = ary;
    };
  
  return yyval;
},
  85: function (yyval, yyvs)
{
  
    {
      yyval = [ builder.splat_empty() ];
    };
  
  return yyval;
},
  86: function (yyval, yyvs)
{
  
    {
      var ary = [ builder.splat_empty() ];
      Array_push.apply(ary, yyvs[yyvs.length-1-((3-(3)))]);
      yyval = ary;
    };
  
  return yyval;
},
  88: function (yyval, yyvs)
{
  
    {
      yyval = builder.begin(yyvs[yyvs.length-1-((3-(2)))]);
    };
  
  return yyval;
},
  89: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((2-(1)))] ];
    };
  
  return yyval;
},
  90: function (yyval, yyvs)
{
  
    {
      var mlhs_head = yyvs[yyvs.length-1-((3-(1)))];
      mlhs_head.push(yyvs[yyvs.length-1-((3-(2)))]);
      yyval = mlhs_head;
    };
  
  return yyval;
},
  91: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
    };
  
  return yyval;
},
  92: function (yyval, yyvs)
{
  
    {
      var mlhs_post = yyvs[yyvs.length-1-((3-(1)))];
      mlhs_post.push(yyvs[yyvs.length-1-((3-(3)))]);
      yyval = mlhs_post;
    };
  
  return yyval;
},
  93: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  94: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  95: function (yyval, yyvs)
{
  
    {
      yyval = builder.index_asgn(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(3)))]);
    };
  
  return yyval;
},
  96: function (yyval, yyvs)
{
  
    {
      yyval = builder.attr_asgn(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  97: function (yyval, yyvs)
{
  
    {
      yyval = builder.attr_asgn(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  98: function (yyval, yyvs)
{
  
    {
      yyval = builder.attr_asgn(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  99: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(builder.const_fetch(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]));
    };
  
  return yyval;
},
  100: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(builder.const_global(yyvs[yyvs.length-1-((2-(2)))]));
    };
  
  return yyval;
},
  101: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  102: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  103: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  104: function (yyval, yyvs)
{
  
    {
      yyval = builder.index_asgn(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(3)))]);
    };
  
  return yyval;
},
  105: function (yyval, yyvs)
{
  
    {
      yyval = builder.attr_asgn(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  106: function (yyval, yyvs)
{
  
    {
      yyval = builder.attr_asgn(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  107: function (yyval, yyvs)
{
  
    {
      yyval = builder.attr_asgn(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  108: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(builder.const_fetch(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]));
    };
  
  return yyval;
},
  109: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(builder.const_global(yyvs[yyvs.length-1-((2-(2)))]));
    };
  
  return yyval;
},
  110: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  111: function (yyval, yyvs)
{
  
    {
      lexer.yyerror("class/module name must be CONSTANT");
    };
  
  return yyval;
},
  113: function (yyval, yyvs)
{
  
    {
      yyval = builder.const_global(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  114: function (yyval, yyvs)
{
  
    {
      yyval = builder.const_(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  115: function (yyval, yyvs)
{
  
    {
      yyval = builder.const_fetch(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  119: function (yyval, yyvs)
{
  
    {
      lexer.lex_state = EXPR_ENDFN;
    };
  
  return yyval;
},
  120: function (yyval, yyvs)
{
  
    {
      lexer.lex_state = EXPR_ENDFN;
    };
  
  return yyval;
},
  121: function (yyval, yyvs)
{
  
    {
      yyval = builder.symbol(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  123: function (yyval, yyvs)
{
  
    {};
  
  return yyval;
},
  125: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
    };
  
  return yyval;
},
  126: function (yyval, yyvs)
{
  
    {
      lexer.lex_state = EXPR_FNAME;
    };
  
  return yyval;
},
  127: function (yyval, yyvs)
{
  
    {
      var undef_list = yyvs[yyvs.length-1-((4-(1)))];
      undef_list.push(yyvs[yyvs.length-1-((4-(4)))]);
      yyval = undef_list;
    };
  
  return yyval;
},
  199: function (yyval, yyvs)
{
  
    {
      yyval = builder.assign(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  200: function (yyval, yyvs)
{
  
    {
      var rescue_body = builder.rescue_body(null, null, yyvs[yyvs.length-1-((5-(5)))]);
      var rescue = builder.begin_body(yyvs[yyvs.length-1-((5-(3)))], [ rescue_body ]);
      yyval = builder.assign(yyvs[yyvs.length-1-((5-(1)))], rescue);
    };
  
  return yyval;
},
  201: function (yyval, yyvs)
{
  
    {
      yyval = builder.op_assign(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  202: function (yyval, yyvs)
{
  
    {
      var rescue_body = builder.rescue_body(null, null, yyvs[yyvs.length-1-((5-(5)))]);
      var rescue = builder.begin_body(yyvs[yyvs.length-1-((5-(3)))], [ rescue_body ]);
      yyval = builder.op_assign(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], rescue);
    };
  
  return yyval;
},
  203: function (yyval, yyvs)
{
  
    {
      var index = builder.index(yyvs[yyvs.length-1-((6-(1)))], yyvs[yyvs.length-1-((6-(3)))]);
      yyval = builder.op_assign(index, yyvs[yyvs.length-1-((6-(5)))], yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  204: function (yyval, yyvs)
{
  
    {
      var call_method = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))]);
      yyval = builder.op_assign(call_method, yyvs[yyvs.length-1-((5-(4)))], yyvs[yyvs.length-1-((5-(5)))]);
    };
  
  return yyval;
},
  205: function (yyval, yyvs)
{
  
    {
      var call_method = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))]);
      yyval = builder.op_assign(call_method, yyvs[yyvs.length-1-((5-(4)))], yyvs[yyvs.length-1-((5-(5)))]);
    };
  
  return yyval;
},
  206: function (yyval, yyvs)
{
  
    {
      var call_method = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))]);
      yyval = builder.op_assign(call_method, yyvs[yyvs.length-1-((5-(4)))], yyvs[yyvs.length-1-((5-(5)))]);
    };
  
  return yyval;
},
  207: function (yyval, yyvs)
{
  
    {
      var const_ = builder.const_op_assignable(builder.const_fetch(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))]));
      yyval = builder.op_assign(const_, yyvs[yyvs.length-1-((5-(4)))], yyvs[yyvs.length-1-((5-(5)))]);
    };
  
  return yyval;
},
  208: function (yyval, yyvs)
{
  
    {
      var const_  = builder.const_op_assignable(builder.const_global(yyvs[yyvs.length-1-((4-(2)))]));
      yyval = builder.op_assign(const_, yyvs[yyvs.length-1-((4-(3)))], yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  209: function (yyval, yyvs)
{
  
    {
      // expected to return `null` as Ruby doesn't allow backref assignment
      yyval = builder.op_assign(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  210: function (yyval, yyvs)
{
  
    {
      yyval = builder.range_inclusive(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  211: function (yyval, yyvs)
{
  
    {
      yyval = builder.range_exclusive(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  212: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  213: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  214: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  215: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  216: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  217: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  218: function (yyval, yyvs)
{
  
    {
      var number = builder.integer(yyvs[yyvs.length-1-((4-(2)))], false);
      var binary  = builder.binary_op(number, yyvs[yyvs.length-1-((4-(3)))], yyvs[yyvs.length-1-((4-(4)))]);
      yyval = builder.unary_op(yyvs[yyvs.length-1-((4-(1)))], binary);
    };
  
  return yyval;
},
  219: function (yyval, yyvs)
{
  
    {
      var number = builder.float_(yyvs[yyvs.length-1-((4-(2)))], false);
      var binary  = builder.binary_op(number, yyvs[yyvs.length-1-((4-(3)))], yyvs[yyvs.length-1-((4-(4)))]);
      yyval = builder.unary_op(yyvs[yyvs.length-1-((4-(1)))], binary);
    };
  
  return yyval;
},
  220: function (yyval, yyvs)
{
  
    {
      yyval = builder.unary_op(yyvs[yyvs.length-1-((2-(1)))], yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  221: function (yyval, yyvs)
{
  
    {
      yyval = builder.unary_op(yyvs[yyvs.length-1-((2-(1)))], yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  222: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  223: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  224: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  225: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  226: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  227: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  228: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  229: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  230: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  231: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  232: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  233: function (yyval, yyvs)
{
  
    {
      yyval = builder.match_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  234: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  235: function (yyval, yyvs)
{
  
    {
      yyval = builder.not_op(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  236: function (yyval, yyvs)
{
  
    {
       yyval = builder.unary_op(yyvs[yyvs.length-1-((2-(1)))], yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  237: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  238: function (yyval, yyvs)
{
  
    {
      yyval = builder.binary_op(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  239: function (yyval, yyvs)
{
  
    {
      yyval = builder.logical_op('and', yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  240: function (yyval, yyvs)
{
  
    {
      yyval = builder.logical_op('or', yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  241: function (yyval, yyvs)
{
  
    {
      lexer.in_defined = true;
    };
  
  return yyval;
},
  242: function (yyval, yyvs)
{
  
    {
      lexer.in_defined = false;
      
      yyval = builder.keyword_cmd('defined?', [ yyvs[yyvs.length-1-((4-(4)))] ]);
    };
  
  return yyval;
},
  243: function (yyval, yyvs)
{
  
    {
      yyval = builder.ternary(yyvs[yyvs.length-1-((6-(1)))], yyvs[yyvs.length-1-((6-(3)))], yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  246: function (yyval, yyvs)
{
  
    {
        yyval = [];
      };
  
  return yyval;
},
  248: function (yyval, yyvs)
{
  
    {
      var args = yyvs[yyvs.length-1-((4-(1)))];
      args.push(builder.associate(yyvs[yyvs.length-1-((4-(3)))]));
      yyval = args;
    };
  
  return yyval;
},
  249: function (yyval, yyvs)
{
  
    {
      yyval = [ builder.associate(yyvs[yyvs.length-1-((2-(1)))]) ];
    };
  
  return yyval;
},
  250: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((3-(2)))];
    };
  
  return yyval;
},
  251: function (yyval, yyvs)
{
  
    {
      yyval = []; // args collector
    };
  
  return yyval;
},
  253: function (yyval, yyvs)
{
  
    {
      yyval = []; // args collector
    };
  
  return yyval;
},
  256: function (yyval, yyvs)
{
  
    {
      var args = yyvs[yyvs.length-1-((4-(1)))];
      args.push(builder.associate(yyvs[yyvs.length-1-((4-(3)))]));
      yyval = args;
    };
  
  return yyval;
},
  257: function (yyval, yyvs)
{
  
    {
      yyval = [ builder.associate(yyvs[yyvs.length-1-((2-(1)))]) ];
    };
  
  return yyval;
},
  258: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
    };
  
  return yyval;
},
  259: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  260: function (yyval, yyvs)
{
  
    {
      yyval = [ builder.associate(yyvs[yyvs.length-1-((2-(1)))]) ].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  261: function (yyval, yyvs)
{
  
    {
      var assocs = builder.associate(yyvs[yyvs.length-1-((4-(3)))]);
      var args = yyvs[yyvs.length-1-((4-(1)))];
      args.push(assocs);
      yyval = args.concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  262: function (yyval, yyvs)
{
  
    {
      yyval =  [ yyvs[yyvs.length-1-((1-(1)))] ];
    };
  
  return yyval;
},
  263: function (yyval, yyvs)
{
  
    {
      yyval = lexer.cmdarg_stack;
      lexer.CMDARG_PUSH(1);
    };
  
  return yyval;
},
  264: function (yyval, yyvs)
{
  
    {
      // CMDARG_POP()
      lexer.cmdarg_stack = yyvs[yyvs.length-1-((2-(1)))];
      
      yyval = yyvs[yyvs.length-1-((2-(2)))];
    };
  
  return yyval;
},
  265: function (yyval, yyvs)
{
  
    {
      yyval = builder.block_pass(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  266: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((2-(2)))] ];
    };
  
  return yyval;
},
  267: function (yyval, yyvs)
{
  
    {
      yyval = [];
    };
  
  return yyval;
},
  268: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
    };
  
  return yyval;
},
  269: function (yyval, yyvs)
{
  
    {
      yyval = [ builder.splat(yyvs[yyvs.length-1-((2-(2)))]) ];
    };
  
  return yyval;
},
  270: function (yyval, yyvs)
{
  
    {
      var args = yyvs[yyvs.length-1-((3-(1)))];
      args.push(yyvs[yyvs.length-1-((3-(3)))]);
      yyval = args;
    };
  
  return yyval;
},
  271: function (yyval, yyvs)
{
  
    {
      var args = yyvs[yyvs.length-1-((4-(1)))];
      args.push(builder.splat(yyvs[yyvs.length-1-((4-(4)))]));
      yyval = args;
    };
  
  return yyval;
},
  272: function (yyval, yyvs)
{
  
    {
      
      var args = yyvs[yyvs.length-1-((3-(1)))];
      args.push(yyvs[yyvs.length-1-((3-(3)))]);
      yyval = args;
    };
  
  return yyval;
},
  273: function (yyval, yyvs)
{
  
    {
      var args = yyvs[yyvs.length-1-((4-(1)))];
      args.push(builder.splat(yyvs[yyvs.length-1-((4-(4)))]));
      yyval = args;
    };
  
  return yyval;
},
  274: function (yyval, yyvs)
{
  
    {
      yyval = [ builder.splat(yyvs[yyvs.length-1-((2-(2)))]) ];
    };
  
  return yyval;
},
  285: function (yyval, yyvs)
{
  
    {
        yyval = builder.call_method(null, null, yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  286: function (yyval, yyvs)
{
  
    {
      yyvs[yyvs.length-1-((1-(1)))] = lexer.cmdarg_stack;
      lexer.cmdarg_stack = 0;
    };
  
  return yyval;
},
  287: function (yyval, yyvs)
{
  
    {
      lexer.cmdarg_stack = yyvs[yyvs.length-1-((4-(1)))];
      
      // touching this alters the parse.output
      yyvs[yyvs.length-1-((4-(2)))];
      
      yyval = builder.begin_keyword(yyvs[yyvs.length-1-((4-(3)))]);
    };
  
  return yyval;
},
  288: function (yyval, yyvs)
{
  
    {
        lexer.lex_state = EXPR_ENDARG;
      };
  
  return yyval;
},
  289: function (yyval, yyvs)
{
  
    {
        yyval = builder.begin(null);
      };
  
  return yyval;
},
  290: function (yyval, yyvs)
{
  
    {
        lexer.lex_state = EXPR_ENDARG;
      };
  
  return yyval;
},
  291: function (yyval, yyvs)
{
  
    {
        yyval = builder.begin(yyvs[yyvs.length-1-((4-(2)))]);
      };
  
  return yyval;
},
  292: function (yyval, yyvs)
{
  
    {
        yyval = builder.begin(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  293: function (yyval, yyvs)
{
  
    {
        yyval = builder.const_fetch(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]);
      };
  
  return yyval;
},
  294: function (yyval, yyvs)
{
  
    {
        yyval = builder.const_global(yyvs[yyvs.length-1-((2-(2)))]);
      };
  
  return yyval;
},
  295: function (yyval, yyvs)
{
  
    {
        yyval = builder.array(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  296: function (yyval, yyvs)
{
  
    {
        yyval = builder.associate(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  297: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('return');
      };
  
  return yyval;
},
  298: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('yield', yyvs[yyvs.length-1-((4-(3)))]);
      };
  
  return yyval;
},
  299: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('yield');
      };
  
  return yyval;
},
  300: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('yield');
      };
  
  return yyval;
},
  301: function (yyval, yyvs)
{
  
    {
        lexer.in_defined = true;
      };
  
  return yyval;
},
  302: function (yyval, yyvs)
{
  
    {
        lexer.in_defined = false;
      
        yyval = builder.keyword_cmd('defined?', [ yyvs[yyvs.length-1-((6-(5)))] ]);
      };
  
  return yyval;
},
  303: function (yyval, yyvs)
{
  
    {
        yyval = builder.not_op(yyvs[yyvs.length-1-((4-(3)))]);
      };
  
  return yyval;
},
  304: function (yyval, yyvs)
{
  
    {
        // not ()
        yyval = builder.not_op(null);
      };
  
  return yyval;
},
  305: function (yyval, yyvs)
{
  
    {
        var method_call = builder.call_method(null, null, yyvs[yyvs.length-1-((2-(1)))]);

        var block = yyvs[yyvs.length-1-((2-(2)))];
        yyval = builder.block(method_call, block.args, block.body);
      };
  
  return yyval;
},
  307: function (yyval, yyvs)
{
  
    {
        var block = yyvs[yyvs.length-1-((2-(2)))];
        yyval = builder.block(yyvs[yyvs.length-1-((2-(1)))], block.args, block.body);
      };
  
  return yyval;
},
  308: function (yyval, yyvs)
{
  
    {
        var lambda_call = builder.call_lambda(yyvs[yyvs.length-1-((2-(1)))]);

        var lambda = yyvs[yyvs.length-1-((2-(2)))];
        yyval = builder.block(lambda_call, lambda.args, lambda.body);
      };
  
  return yyval;
},
  309: function (yyval, yyvs)
{
  
    {
        yyval = builder.condition(yyvs[yyvs.length-1-((6-(2)))], yyvs[yyvs.length-1-((6-(4)))], yyvs[yyvs.length-1-((6-(5)))]);
      };
  
  return yyval;
},
  310: function (yyval, yyvs)
{
  
    {
        yyval = builder.condition(yyvs[yyvs.length-1-((6-(2)))], yyvs[yyvs.length-1-((6-(5)))], yyvs[yyvs.length-1-((6-(4)))]);
      };
  
  return yyval;
},
  311: function (yyval, yyvs)
{
  
    {
        lexer.COND_PUSH(1);
      };
  
  return yyval;
},
  312: function (yyval, yyvs)
{
  
    {
        lexer.COND_POP();
      };
  
  return yyval;
},
  313: function (yyval, yyvs)
{
  
    {
        yyval = builder.loop('while', yyvs[yyvs.length-1-((7-(3)))], yyvs[yyvs.length-1-((7-(6)))]);
      };
  
  return yyval;
},
  314: function (yyval, yyvs)
{
  
    {
        lexer.COND_PUSH(1);
      };
  
  return yyval;
},
  315: function (yyval, yyvs)
{
  
    {
        lexer.COND_POP();
      };
  
  return yyval;
},
  316: function (yyval, yyvs)
{
  
    {
        yyval = builder.loop('until', yyvs[yyvs.length-1-((7-(3)))], yyvs[yyvs.length-1-((7-(6)))]);
      };
  
  return yyval;
},
  317: function (yyval, yyvs)
{
  
    {
        var when_bodies = yyvs[yyvs.length-1-((5-(4)))];
        var else_body = when_bodies.pop();

        yyval = builder.case_(yyvs[yyvs.length-1-((5-(2)))], when_bodies, else_body);
      };
  
  return yyval;
},
  318: function (yyval, yyvs)
{
  
    {
        var when_bodies = yyvs[yyvs.length-1-((4-(3)))];
        var else_body = when_bodies.pop();

        yyval = builder.case_(null, when_bodies, else_body);
      };
  
  return yyval;
},
  319: function (yyval, yyvs)
{
  
    {
        lexer.COND_PUSH(1);
      };
  
  return yyval;
},
  320: function (yyval, yyvs)
{
  
    {
        lexer.COND_POP();
      };
  
  return yyval;
},
  321: function (yyval, yyvs)
{
  
    {
        yyval = builder.for_(yyvs[yyvs.length-1-((9-(2)))], yyvs[yyvs.length-1-((9-(5)))], yyvs[yyvs.length-1-((9-(8)))]);
      };
  
  return yyval;
},
  322: function (yyval, yyvs)
{
  
    {
        if (lexer.in_def || lexer.in_single)
        {
          lexer.yyerror("class definition in method body");
        }
      
        scope.push_static();
      };
  
  return yyval;
},
  323: function (yyval, yyvs)
{
  
    {
        yyval = builder.def_class(yyvs[yyvs.length-1-((6-(2)))], yyvs[yyvs.length-1-((6-(3)))], yyvs[yyvs.length-1-((6-(5)))]);
      
        // TODO: delete all these touching stuff:
        // touching this alters the parse.output
        yyvs[yyvs.length-1-((6-(4)))];
      
        scope.pop();
      };
  
  return yyval;
},
  324: function (yyval, yyvs)
{
  
    {
        yyval = lexer.in_def;
        lexer.in_def = 0;
      };
  
  return yyval;
},
  325: function (yyval, yyvs)
{
  
    {
        yyval = lexer.in_single;
        lexer.in_single = 0;
        scope.push_static();
      };
  
  return yyval;
},
  326: function (yyval, yyvs)
{
  
    {
        yyval = builder.def_sclass(yyvs[yyvs.length-1-((8-(3)))], yyvs[yyvs.length-1-((8-(7)))]);
      
        scope.pop();
        lexer.in_def = yyvs[yyvs.length-1-((8-(4)))];
        lexer.in_single = yyvs[yyvs.length-1-((8-(6)))];
      };
  
  return yyval;
},
  327: function (yyval, yyvs)
{
  
    {
        if (lexer.in_def || lexer.in_single)
        {
          lexer.yyerror("module definition in method body");
        }
        scope.push_static();
      };
  
  return yyval;
},
  328: function (yyval, yyvs)
{
  
    {
        yyval = builder.def_module(yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(4)))]);

        // touching this alters the parse.output
        yyvs[yyvs.length-1-((5-(3)))];
      
        scope.pop();
      };
  
  return yyval;
},
  329: function (yyval, yyvs)
{
  
    {
        lexer.in_def++;
        scope.push_static();
      };
  
  return yyval;
},
  330: function (yyval, yyvs)
{
  
    {
        yyval = builder.def_method(yyvs[yyvs.length-1-((6-(2)))], yyvs[yyvs.length-1-((6-(4)))], yyvs[yyvs.length-1-((6-(5)))]);
        
        // touching this alters the parse.output
        yyvs[yyvs.length-1-((6-(1)))]; yyvs[yyvs.length-1-((6-(3)))];
        
        scope.pop();
        lexer.in_def--;
      };
  
  return yyval;
},
  331: function (yyval, yyvs)
{
  
    {
        lexer.lex_state = EXPR_FNAME;
      };
  
  return yyval;
},
  332: function (yyval, yyvs)
{
  
    {
        lexer.in_single++;
        lexer.lex_state = EXPR_ENDFN; 
        scope.push_static();
      };
  
  return yyval;
},
  333: function (yyval, yyvs)
{
  
    {
        yyval = builder.def_singleton(yyvs[yyvs.length-1-((9-(2)))], yyvs[yyvs.length-1-((9-(5)))], yyvs[yyvs.length-1-((9-(7)))], yyvs[yyvs.length-1-((9-(8)))]);

        scope.pop();
        lexer.in_single--;
      };
  
  return yyval;
},
  334: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('break');
      };
  
  return yyval;
},
  335: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('next');
      };
  
  return yyval;
},
  336: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('redo');
      };
  
  return yyval;
},
  337: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('retry');
      };
  
  return yyval;
},
  356: function (yyval, yyvs)
{
  
    {
      yyval = builder.condition(yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(4)))], yyvs[yyvs.length-1-((5-(5)))]);
    };
  
  return yyval;
},
  358: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(2)))];
    };
  
  return yyval;
},
  361: function (yyval, yyvs)
{
  
    {
        var arg = yyvs[yyvs.length-1-((1-(1)))];
        scope.declare(arg[0]);
        
        yyval = builder.arg(arg);
      };
  
  return yyval;
},
  362: function (yyval, yyvs)
{
  
    {
        yyval = builder.multi_lhs(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  363: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  364: function (yyval, yyvs)
{
  
    {
        var f_marg_list = yyvs[yyvs.length-1-((3-(1)))];
        f_marg_list.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = f_marg_list;
      };
  
  return yyval;
},
  366: function (yyval, yyvs)
{
  
    {
        var f_norm_arg = yyvs[yyvs.length-1-((4-(4)))];
        scope.declare(f_norm_arg[0]);
        
        var f_marg_list = yyvs[yyvs.length-1-((4-(1)))];
        f_marg_list.push(builder.restarg(f_norm_arg));
        yyval = f_marg_list;
      };
  
  return yyval;
},
  367: function (yyval, yyvs)
{
  
    {
        var f_norm_arg = yyvs[yyvs.length-1-((6-(4)))];
        scope.declare(f_norm_arg[0]);
        
        var f_marg_list = yyvs[yyvs.length-1-((6-(1)))];
        f_marg_list.push(builder.restarg(f_norm_arg));
        yyval = f_marg_list.concat(yyvs[yyvs.length-1-((6-(6)))]);
      };
  
  return yyval;
},
  368: function (yyval, yyvs)
{
  
    {
        var f_marg_list = yyvs[yyvs.length-1-((3-(1)))];
        f_marg_list.push(builder.restarg());
        yyval = f_marg_list;
      };
  
  return yyval;
},
  369: function (yyval, yyvs)
{
  
    {
        var f_marg_list = yyvs[yyvs.length-1-((5-(1)))];
        f_marg_list.push(builder.restarg());
        yyval = f_marg_list.concat(yyvs[yyvs.length-1-((5-(5)))]);
      };
  
  return yyval;
},
  370: function (yyval, yyvs)
{
  
    {
        var f_norm_arg = yyvs[yyvs.length-1-((2-(2)))];
        scope.declare(f_norm_arg[0]);
        
        yyval = [ builder.restarg(f_norm_arg) ];
      };
  
  return yyval;
},
  371: function (yyval, yyvs)
{
  
    {
        var f_norm_arg = yyvs[yyvs.length-1-((4-(2)))];
        scope.declare(f_norm_arg[0]);
        
        yyval = [ builder.restarg(f_norm_arg) ].concat(yyvs[yyvs.length-1-((4-(4)))]);
      };
  
  return yyval;
},
  372: function (yyval, yyvs)
{
  
    {
        yyval = [ builder.restarg() ];
      };
  
  return yyval;
},
  373: function (yyval, yyvs)
{
  
    {
        yyval = [ builder.restarg() ].concat(yyvs[yyvs.length-1-((3-(3)))]);
      };
  
  return yyval;
},
  374: function (yyval, yyvs)
{
  
    {
        // TODO: try unshift()
        yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
      };
  
  return yyval;
},
  375: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
      };
  
  return yyval;
},
  376: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
      };
  
  return yyval;
},
  377: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  378: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(2)))];
    };
  
  return yyval;
},
  379: function (yyval, yyvs)
{
  
    {
      yyval = [];
    };
  
  return yyval;
},
  380: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
      };
  
  return yyval;
},
  381: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((8-(1)))].concat(yyvs[yyvs.length-1-((8-(3)))]).concat(yyvs[yyvs.length-1-((8-(5)))]).concat(yyvs[yyvs.length-1-((8-(7)))]).concat(yyvs[yyvs.length-1-((8-(8)))]);
      };
  
  return yyval;
},
  382: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
      };
  
  return yyval;
},
  383: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
      };
  
  return yyval;
},
  384: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
      };
  
  return yyval;
},
  386: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
      };
  
  return yyval;
},
  387: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  388: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
      };
  
  return yyval;
},
  389: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
      };
  
  return yyval;
},
  390: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
      };
  
  return yyval;
},
  391: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
      };
  
  return yyval;
},
  392: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
      };
  
  return yyval;
},
  393: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
      };
  
  return yyval;
},
  395: function (yyval, yyvs)
{
  
    {
      yyval = builder.args([]);
    };
  
  return yyval;
},
  396: function (yyval, yyvs)
{
  
    {
      lexer.command_start = true;
    };
  
  return yyval;
},
  397: function (yyval, yyvs)
{
  
    {
      yyval = builder.args(yyvs[yyvs.length-1-((3-(2)))]);
    };
  
  return yyval;
},
  398: function (yyval, yyvs)
{
  
    {
      yyval = builder.args([]);
    };
  
  return yyval;
},
  399: function (yyval, yyvs)
{
  
    {
      yyval = builder.args(yyvs[yyvs.length-1-((4-(2)))].concat(yyvs[yyvs.length-1-((4-(3)))]));
    };
  
  return yyval;
},
  400: function (yyval, yyvs)
{
  
    {
      yyval = [];
    };
  
  return yyval;
},
  401: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(3)))];
    };
  
  return yyval;
},
  402: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
    };
  
  return yyval;
},
  403: function (yyval, yyvs)
{
  
    {
      var bv_decls = yyvs[yyvs.length-1-((3-(1)))];
      bv_decls.push(yyvs[yyvs.length-1-((3-(3)))]);
      yyval = bv_decls;
    };
  
  return yyval;
},
  404: function (yyval, yyvs)
{
  
    {
      yyval = builder.shadowarg(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  405: function (yyval, yyvs)
{
  
    {
      // our addition
      yyval = null;
    };
  
  return yyval;
},
  406: function (yyval, yyvs)
{
  
    {
      // TODO
    };
  
  return yyval;
},
  407: function (yyval, yyvs)
{
  
    {
      yyval = lexer.lpar_beg;
      lexer.lpar_beg = ++lexer.paren_nest;
    };
  
  return yyval;
},
  408: function (yyval, yyvs)
{
  
    {
      // $<num>$ = lexer.ruby_sourceline;
    };
  
  return yyval;
},
  409: function (yyval, yyvs)
{
  
    {
      lexer.lpar_beg = yyvs[yyvs.length-1-((5-(2)))];
      // touching this alters the parse.output
      yyvs[yyvs.length-1-((5-(1)))];
      yyvs[yyvs.length-1-((5-(4)))]; // nd_set_line($$, $<num>4);
      
      yyval = { args: yyvs[yyvs.length-1-((5-(3)))], body: yyvs[yyvs.length-1-((5-(5)))] };
    };
  
  return yyval;
},
  410: function (yyval, yyvs)
{
  
    {
        yyval = builder.args(yyvs[yyvs.length-1-((4-(2)))].concat(yyvs[yyvs.length-1-((4-(3)))]));
      };
  
  return yyval;
},
  411: function (yyval, yyvs)
{
  
    {
        yyval = builder.args(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  412: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((3-(2)))]; // no wrapping in an array
    };
  
  return yyval;
},
  413: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((3-(2)))]; // no wrapping in an array
    };
  
  return yyval;
},
  414: function (yyval, yyvs)
{
  
    {
        scope.push_dynamic();
      };
  
  return yyval;
},
  415: function (yyval, yyvs)
{
  
    {
        yyval = { args: yyvs[yyvs.length-1-((5-(3)))], body: yyvs[yyvs.length-1-((5-(4)))] };

        scope.pop();

        // touching this alters the parse.output
        yyvs[yyvs.length-1-((5-(2)))];
        yyvs[yyvs.length-1-((5-(1)))];
      };
  
  return yyval;
},
  416: function (yyval, yyvs)
{
  
    {
        var block = yyvs[yyvs.length-1-((2-(2)))];
        yyval = builder.block(yyvs[yyvs.length-1-((2-(1)))], block.args, block.body);
      };
  
  return yyval;
},
  417: function (yyval, yyvs)
{
  
    {
        yyval = builder.call_method(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(2)))], yyvs[yyvs.length-1-((4-(3)))], yyvs[yyvs.length-1-((4-(4)))]);
      };
  
  return yyval;
},
  418: function (yyval, yyvs)
{
  
    {
        var method_call = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))], yyvs[yyvs.length-1-((5-(4)))]);

        var block = yyvs[yyvs.length-1-((5-(5)))];
        yyval = builder.block(method_call, block.args, block.body);
      };
  
  return yyval;
},
  419: function (yyval, yyvs)
{
  
    {
        var method_call = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))], yyvs[yyvs.length-1-((5-(4)))]);

        var block = yyvs[yyvs.length-1-((5-(5)))];
        yyval = builder.block(method_call, block.args, block.body);
      };
  
  return yyval;
},
  420: function (yyval, yyvs)
{
  
    {
      yyval = builder.call_method(null, null, yyvs[yyvs.length-1-((2-(1)))], yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  421: function (yyval, yyvs)
{
  
    {
        // TODO
      };
  
  return yyval;
},
  422: function (yyval, yyvs)
{
  
    {
        yyval = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))], yyvs[yyvs.length-1-((5-(5)))]);
      
        // touching this alters the parse.output
          yyvs[yyvs.length-1-((5-(4)))];
      };
  
  return yyval;
},
  423: function (yyval, yyvs)
{
  
    {
        // TODO
      };
  
  return yyval;
},
  424: function (yyval, yyvs)
{
  
    {
        yyval = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))], yyvs[yyvs.length-1-((5-(5)))]);
      
        // touching this alters the parse.output
          yyvs[yyvs.length-1-((5-(4)))]
      };
  
  return yyval;
},
  425: function (yyval, yyvs)
{
  
    {
      yyval = builder.call_method(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]); // empty args
    };
  
  return yyval;
},
  426: function (yyval, yyvs)
{
  
    {
        // TODO
      };
  
  return yyval;
},
  427: function (yyval, yyvs)
{
  
    {
        // null for empty method name
        // as in `primary_value.(paren_args)`
        yyval = builder.call_method(yyvs[yyvs.length-1-((4-(1)))], '.', null, yyvs[yyvs.length-1-((4-(4)))]);
      
        // touching this alters the parse.output
        yyvs[yyvs.length-1-((4-(3)))];
      };
  
  return yyval;
},
  428: function (yyval, yyvs)
{
  
    {
        // TODO
      };
  
  return yyval;
},
  429: function (yyval, yyvs)
{
  
    {
        yyval = builder.call_method(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(2)))], null, yyvs[yyvs.length-1-((4-(4)))]);

        // TODO: touching this alters the parse.output
        yyvs[yyvs.length-1-((4-(3)))];
      };
  
  return yyval;
},
  430: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('super', yyvs[yyvs.length-1-((2-(2)))]);
      };
  
  return yyval;
},
  431: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('zsuper');
      };
  
  return yyval;
},
  432: function (yyval, yyvs)
{
  
    {
        yyval = builder.index(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(3)))]);
      };
  
  return yyval;
},
  433: function (yyval, yyvs)
{
  
    {
        scope.push_dynamic();
      };
  
  return yyval;
},
  434: function (yyval, yyvs)
{
  
    {
        yyval = { args: yyvs[yyvs.length-1-((5-(3)))], body: yyvs[yyvs.length-1-((5-(4)))] };
      
        // touching this alters the parse.output
        yyvs[yyvs.length-1-((5-(2)))];
      
        scope.pop();
      };
  
  return yyval;
},
  435: function (yyval, yyvs)
{
  
    {
        scope.push_dynamic();
      };
  
  return yyval;
},
  436: function (yyval, yyvs)
{
  
    {
        yyval = { args: yyvs[yyvs.length-1-((5-(3)))], body: yyvs[yyvs.length-1-((5-(4)))] };
      
        // touching this alters the parse.output
        yyvs[yyvs.length-1-((5-(2)))];
      
        scope.pop();
      };
  
  return yyval;
},
  437: function (yyval, yyvs)
{
  
    {
        var cases = yyvs[yyvs.length-1-((5-(5)))];
        cases.unshift(builder.when(yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(4)))])); // TODO: push() + reverse()
        yyval = cases;
      };
  
  return yyval;
},
  438: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  440: function (yyval, yyvs)
{
  
    {
        var exc_list = yyvs[yyvs.length-1-((6-(2)))];
        if (exc_list) // may be `null`
        {
          exc_list = builder.array(exc_list)
        }

        yyval = [ builder.rescue_body(exc_list, yyvs[yyvs.length-1-((6-(3)))], yyvs[yyvs.length-1-((6-(5)))]) ].concat(yyvs[yyvs.length-1-((6-(6)))]);
      };
  
  return yyval;
},
  441: function (yyval, yyvs)
{
  
    {
        yyval = [];
      };
  
  return yyval;
},
  442: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  445: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((2-(2)))];
      };
  
  return yyval;
},
  447: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((2-(2)))] ];
      };
  
  return yyval;
},
  452: function (yyval, yyvs)
{
  
    {
        yyval = builder.string_compose(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  453: function (yyval, yyvs)
{
  
    {
       yyval = [ builder.string(yyvs[yyvs.length-1-((1-(1)))]) ];
     };
  
  return yyval;
},
  454: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  455: function (yyval, yyvs)
{
  
    {
        var string = yyvs[yyvs.length-1-((2-(1)))];
        string.push(yyvs[yyvs.length-1-((2-(2)))]);
        yyval = string;
      };
  
  return yyval;
},
  456: function (yyval, yyvs)
{
  
    {
        yyval = builder.string_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  457: function (yyval, yyvs)
{
  
    {
        yyval = builder.xstring_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  458: function (yyval, yyvs)
{
  
    {
        var opts = builder.regexp_options(yyvs[yyvs.length-1-((3-(3)))]); // tREGEXP_OPT in WP
        yyval = builder.regexp_compose(yyvs[yyvs.length-1-((3-(2)))], opts);
      };
  
  return yyval;
},
  459: function (yyval, yyvs)
{
  
    {
        yyval = builder.words_compose([]);
      };
  
  return yyval;
},
  460: function (yyval, yyvs)
{
  
    {
        yyval = builder.words_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  461: function (yyval, yyvs)
{
  
    {
        yyval = []; // words collector
      };
  
  return yyval;
},
  462: function (yyval, yyvs)
{
  
    {
        var word_list = yyvs[yyvs.length-1-((3-(1)))];
        word_list.push(builder.word(yyvs[yyvs.length-1-((3-(2)))]));
        yyval = word_list;
      };
  
  return yyval;
},
  463: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  464: function (yyval, yyvs)
{
  
    {
        var word = yyvs[yyvs.length-1-((2-(1)))];
        word.push(yyvs[yyvs.length-1-((2-(2)))]);
        yyval = word;
      };
  
  return yyval;
},
  465: function (yyval, yyvs)
{
  
    {
        yyval = builder.symbols_compose([]);
      };
  
  return yyval;
},
  466: function (yyval, yyvs)
{
  
    {
        yyval = builder.symbols_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  467: function (yyval, yyvs)
{
  
    {
        yyval = [];
      };
  
  return yyval;
},
  468: function (yyval, yyvs)
{
  
    {
        var symbol_list = yyvs[yyvs.length-1-((3-(1)))];
        symbol_list.push(builder.word(yyvs[yyvs.length-1-((3-(2)))]));
        yyval = symbol_list;
      };
  
  return yyval;
},
  469: function (yyval, yyvs)
{
  
    {
        yyval = builder.words_compose([]);
      };
  
  return yyval;
},
  470: function (yyval, yyvs)
{
  
    {
        yyval = builder.words_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  471: function (yyval, yyvs)
{
  
    {
        yyval = builder.symbols_compose([]);
      };
  
  return yyval;
},
  472: function (yyval, yyvs)
{
  
    {
        yyval = builder.symbols_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  473: function (yyval, yyvs)
{
  
    {
        yyval = []; // accumulator
      };
  
  return yyval;
},
  474: function (yyval, yyvs)
{
  
    {
        var qword_list = yyvs[yyvs.length-1-((3-(1)))];
        qword_list.push(builder.string(yyvs[yyvs.length-1-((3-(2)))]));
        yyval = qword_list;
      };
  
  return yyval;
},
  475: function (yyval, yyvs)
{
  
    {
        yyval = []; // accumulator
      };
  
  return yyval;
},
  476: function (yyval, yyvs)
{
  
    {
        var qsym_list = yyvs[yyvs.length-1-((3-(1)))];
        qsym_list.push(builder.symbol(yyvs[yyvs.length-1-((3-(2)))]));
        yyval = qsym_list;
      };
  
  return yyval;
},
  477: function (yyval, yyvs)
{
  
    {
        yyval = []; // string parts collector
      };
  
  return yyval;
},
  478: function (yyval, yyvs)
{
  
    {
        var string_contents = yyvs[yyvs.length-1-((2-(1)))];
        string_contents.push(yyvs[yyvs.length-1-((2-(2)))]);
        yyval = string_contents;
      };
  
  return yyval;
},
  479: function (yyval, yyvs)
{
  
    {
        yyval = []; // accumulator
      };
  
  return yyval;
},
  480: function (yyval, yyvs)
{
  
    {
        var xstring_contents = yyvs[yyvs.length-1-((2-(1)))];
        xstring_contents.push(yyvs[yyvs.length-1-((2-(2)))]);
        yyval = xstring_contents;
      };
  
  return yyval;
},
  481: function (yyval, yyvs)
{
  
    {
        yyval = []; // accumulator
      };
  
  return yyval;
},
  482: function (yyval, yyvs)
{
  
    {
        var regexp_contents = yyvs[yyvs.length-1-((2-(1)))];
        regexp_contents.push(yyvs[yyvs.length-1-((2-(2)))]);
        yyval = regexp_contents;
      };
  
  return yyval;
},
  483: function (yyval, yyvs)
{
  
    {
        yyval = builder.string(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  484: function (yyval, yyvs)
{
  
    {
        yyval = lexer.lex_strterm;
        lexer.lex_strterm = null;
        lexer.lex_state = EXPR_BEG;
      };
  
  return yyval;
},
  485: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((3-(3)))];
        lexer.lex_strterm = yyvs[yyvs.length-1-((3-(2)))];
      };
  
  return yyval;
},
  486: function (yyval, yyvs)
{
  
    {
        yyvs[yyvs.length-1-((1-(1)))] = lexer.cond_stack;
        yyval = lexer.cmdarg_stack;
        lexer.cond_stack = 0;
        lexer.cmdarg_stack = 0;
      };
  
  return yyval;
},
  487: function (yyval, yyvs)
{
  
    {
        yyval = lexer.lex_strterm;
        lexer.lex_strterm = null;
        lexer.lex_state = EXPR_BEG;
      };
  
  return yyval;
},
  488: function (yyval, yyvs)
{
  
    {
        yyval = lexer.brace_nest;
        lexer.brace_nest = 0;
      };
  
  return yyval;
},
  489: function (yyval, yyvs)
{
  
    {
        lexer.cond_stack = yyvs[yyvs.length-1-((6-(1)))];
        lexer.cmdarg_stack = yyvs[yyvs.length-1-((6-(2)))];
        lexer.lex_strterm = yyvs[yyvs.length-1-((6-(3)))];
        lexer.brace_nest = yyvs[yyvs.length-1-((6-(4)))];
        
        yyval = builder.begin(yyvs[yyvs.length-1-((6-(5)))]); // the compstmt
      };
  
  return yyval;
},
  490: function (yyval, yyvs)
{
  
    {
      yyval = builder.gvar(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  491: function (yyval, yyvs)
{
  
    {
      yyval = builder.ivar(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  492: function (yyval, yyvs)
{
  
    {
      yyval = builder.cvar(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  494: function (yyval, yyvs)
{
  
    {
      lexer.lex_state = EXPR_END;
      yyval = builder.symbol(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  499: function (yyval, yyvs)
{
  
    {
        lexer.lex_state = EXPR_END;
        
        yyval = builder.symbol_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  500: function (yyval, yyvs)
{
  
    {
        yyval = builder.integer(yyvs[yyvs.length-1-((1-(1)))], false);
      };
  
  return yyval;
},
  501: function (yyval, yyvs)
{
  
    {
        yyval = builder.float_(yyvs[yyvs.length-1-((1-(1)))], false);
      };
  
  return yyval;
},
  502: function (yyval, yyvs)
{
  
    {
        yyval = builder.integer(yyvs[yyvs.length-1-((2-(2)))], true);
      };
  
  return yyval;
},
  503: function (yyval, yyvs)
{
  
    {
        yyval = builder.float_(yyvs[yyvs.length-1-((2-(2)))], true);
      };
  
  return yyval;
},
  504: function (yyval, yyvs)
{
  
    {
        yyval = builder.ident(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  505: function (yyval, yyvs)
{
  
    {
        yyval = builder.ivar(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  506: function (yyval, yyvs)
{
  
    {
        yyval = builder.gvar(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  507: function (yyval, yyvs)
{
  
    {
        yyval = builder.const_(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  508: function (yyval, yyvs)
{
  
    {
        yyval = builder.cvar(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  509: function (yyval, yyvs)
{
  
    {
      yyval = builder.nil();
    };
  
  return yyval;
},
  510: function (yyval, yyvs)
{
  
    {
      yyval = builder.self();
    };
  
  return yyval;
},
  511: function (yyval, yyvs)
{
  
    {
      yyval = builder.true_();
    };
  
  return yyval;
},
  512: function (yyval, yyvs)
{
  
    {
      yyval = builder.false_();
    };
  
  return yyval;
},
  513: function (yyval, yyvs)
{
  
    {
      yyval = builder._FILE_(lexer.filename);
    };
  
  return yyval;
},
  514: function (yyval, yyvs)
{
  
    {
      yyval = builder._LINE_(lexer.ruby_sourceline);
    };
  
  return yyval;
},
  515: function (yyval, yyvs)
{
  
    {
      yyval = builder._ENCODING_();
    };
  
  return yyval;
},
  516: function (yyval, yyvs)
{
  
    {
      yyval = builder.accessible(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  517: function (yyval, yyvs)
{
  
    {
      yyval = builder.accessible(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  518: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  519: function (yyval, yyvs)
{
  
    {
      yyval = builder.assignable(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  520: function (yyval, yyvs)
{
  
    {
      yyval = builder.nth_ref(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  521: function (yyval, yyvs)
{
  
    {
      yyval = builder.back_ref(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  522: function (yyval, yyvs)
{
  
    {
      yyval = null;
    };
  
  return yyval;
},
  523: function (yyval, yyvs)
{
  
    {
      lexer.lex_state = EXPR_BEG;
      lexer.command_start = true;
    };
  
  return yyval;
},
  524: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(3)))];
    };
  
  return yyval;
},
  525: function (yyval, yyvs)
{
  
    {
      parser.yyerrok();
      yyval = null;
    };
  
  return yyval;
},
  526: function (yyval, yyvs)
{
  
    {
      yyval = builder.args(yyvs[yyvs.length-1-((3-(2)))]);
      
      lexer.lex_state = EXPR_BEG;
      lexer.command_start = true;
    };
  
  return yyval;
},
  527: function (yyval, yyvs)
{
  
    {
      yyval = builder.args(yyvs[yyvs.length-1-((2-(1)))]);
      
      lexer.lex_state = EXPR_BEG;
      lexer.command_start = true;
    };
  
  return yyval;
},
  528: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  529: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  530: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  531: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
    };
  
  return yyval;
},
  532: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(2)))];
    };
  
  return yyval;
},
  533: function (yyval, yyvs)
{
  
    {
      yyval = [];
    };
  
  return yyval;
},
  534: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  535: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((8-(1)))].concat(yyvs[yyvs.length-1-((8-(3)))]).concat(yyvs[yyvs.length-1-((8-(5)))]).concat(yyvs[yyvs.length-1-((8-(7)))]).concat(yyvs[yyvs.length-1-((8-(8)))]);
    };
  
  return yyval;
},
  536: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  537: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  538: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  539: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  540: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  541: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  542: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  543: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  544: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  545: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  546: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  548: function (yyval, yyvs)
{
  
    {
      yyval = [];
    };
  
  return yyval;
},
  549: function (yyval, yyvs)
{
  
    {
      lexer.yyerror("formal argument cannot be a constant");
    };
  
  return yyval;
},
  550: function (yyval, yyvs)
{
  
    {
      lexer.yyerror("formal argument cannot be an instance variable");
    };
  
  return yyval;
},
  551: function (yyval, yyvs)
{
  
    {
      lexer.yyerror("formal argument cannot be a global variable");
    };
  
  return yyval;
},
  552: function (yyval, yyvs)
{
  
    {
      lexer.yyerror("formal argument cannot be a class variable");
    };
  
  return yyval;
},
  555: function (yyval, yyvs)
{
  
    {
      var f_norm_arg = yyvs[yyvs.length-1-((1-(1)))];
      scope.declare(f_norm_arg[0]);
      
      yyval = builder.arg(f_norm_arg);
    };
  
  return yyval;
},
  556: function (yyval, yyvs)
{
  
    {
      yyval = builder.multi_lhs(yyvs[yyvs.length-1-((3-(2)))]);
    };
  
  return yyval;
},
  557: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
    };
  
  return yyval;
},
  558: function (yyval, yyvs)
{
  
    {
      var f_arg = yyvs[yyvs.length-1-((3-(1)))];
      f_arg.push(yyvs[yyvs.length-1-((3-(3)))]);
      yyval = f_arg;
    };
  
  return yyval;
},
  559: function (yyval, yyvs)
{
  
    {
        var label = yyvs[yyvs.length-1-((2-(1)))];
        lexer.check_kwarg_name(label);

        scope.declare(label[0]);

        yyval = builder.kwoptarg(label, yyvs[yyvs.length-1-((2-(2)))]);
      };
  
  return yyval;
},
  560: function (yyval, yyvs)
{
  
    {
        var label = yyvs[yyvs.length-1-((2-(1)))];
        lexer.check_kwarg_name(label);

        scope.declare(label[0]);

        yyval = builder.kwoptarg(label, yyvs[yyvs.length-1-((2-(2)))]);
      };
  
  return yyval;
},
  561: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  562: function (yyval, yyvs)
{
  
    {
        var f_block_kwarg = yyvs[yyvs.length-1-((3-(1)))];
        f_block_kwarg.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = f_block_kwarg;
      };
  
  return yyval;
},
  563: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  564: function (yyval, yyvs)
{
  
    {
        var f_kwarg = yyvs[yyvs.length-1-((3-(1)))];
        f_kwarg.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = f_kwarg;
      };
  
  return yyval;
},
  567: function (yyval, yyvs)
{
  
    {
        var ident = yyvs[yyvs.length-1-((2-(2)))];
        scope.declare(ident[0]);
        
        yyval = [ builder.kwrestarg(ident) ];
      };
  
  return yyval;
},
  568: function (yyval, yyvs)
{
  
    {
        yyval = [ builder.kwrestarg() ];
      };
  
  return yyval;
},
  569: function (yyval, yyvs)
{
  
    {
        var ident = yyvs[yyvs.length-1-((3-(1)))];
        scope.declare(ident[0]);
        
        yyval = builder.optarg(ident, yyvs[yyvs.length-1-((3-(3)))]);
      };
  
  return yyval;
},
  570: function (yyval, yyvs)
{
  
    {
        var ident = yyvs[yyvs.length-1-((3-(1)))];
        scope.declare(ident[0]);
        
        yyval = builder.optarg(ident, yyvs[yyvs.length-1-((3-(3)))]);
      };
  
  return yyval;
},
  571: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  572: function (yyval, yyvs)
{
  
    {
        var f_block_optarg = yyvs[yyvs.length-1-((3-(1)))];
        f_block_optarg.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = f_block_optarg;
      };
  
  return yyval;
},
  573: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  574: function (yyval, yyvs)
{
  
    {
        var f_optarg = yyvs[yyvs.length-1-((3-(1)))];
        f_optarg.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = f_optarg;
      };
  
  return yyval;
},
  577: function (yyval, yyvs)
{
  
    {
      var ident = yyvs[yyvs.length-1-((2-(2)))];
      scope.declare(ident[0]);
      // if (!is_local_id($2)) // TODO
      //   lexer.yyerror("rest argument must be local variable");
      
      yyval = [ builder.restarg(ident) ];
    };
  
  return yyval;
},
  578: function (yyval, yyvs)
{
  
    {
      yyval = [ builder.restarg() ];
    };
  
  return yyval;
},
  581: function (yyval, yyvs)
{
  
    {
      // TODO
      //   if (!is_local_id($2))
      // lexer.yyerror("block argument must be local variable");
      //     else if (!dyna_in_block() && local_id($2))
      // lexer.yyerror("duplicated block argument name");
      
      var ident = yyvs[yyvs.length-1-((2-(2)))];
      scope.declare(ident[0]);

      yyval = builder.blockarg(ident);
      
    };
  
  return yyval;
},
  582: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((2-(2)))] ];
      };
  
  return yyval;
},
  583: function (yyval, yyvs)
{
  
    {
        yyval = []; // empty
      };
  
  return yyval;
},
  585: function (yyval, yyvs)
{
  
    {
        lexer.lex_state = EXPR_BEG;
      };
  
  return yyval;
},
  586: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((4-(3)))];
      };
  
  return yyval;
},
  587: function (yyval, yyvs)
{
  
    {
        yyval = [];
      };
  
  return yyval;
},
  589: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  590: function (yyval, yyvs)
{
  
    {
        var assocs = yyvs[yyvs.length-1-((3-(1)))];
        assocs.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = assocs;
      };
  
  return yyval;
},
  591: function (yyval, yyvs)
{
  
    {
      yyval = builder.pair(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  592: function (yyval, yyvs)
{
  
    {
      yyval = builder.pair_keyword(yyvs[yyvs.length-1-((2-(1)))], yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  593: function (yyval, yyvs)
{
  
    {
      yyval = builder.kwsplat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  615: function (yyval, yyvs)
{
  
    {
        parser.yyerrok();
      };
  
  return yyval;
},
  618: function (yyval, yyvs)
{
  
    {
        parser.yyerrok();
      };
  
  return yyval;
},
  619: function (yyval, yyvs)
{
  
    {
      // empty ensure or else block for example
      yyval = null;
    };
  
  return yyval;
}
};

} // YYActions

// here goes the epilogue




// Exports part.

function RubyParser ()
{
  // Default file name.
  this.filename = '(eval)';
  
  // all the classes support independant instantiation
  var lexer   = new YYLexer();
  var parser  = new YYParser();
  var actions = new YYActions();
  var scope   = new Builder.Scope();
  var builder = new Builder();


  // Lexer uses Scope to distinct method calls from local variables,
  // the difference changes Lexer's behaviour drastically.
  lexer.setScope(scope);


  // Parser needs Lexer mainly for token stream,
  // but also it expects token values and locations.
  parser.setLexer(lexer);
  // The main job of Parser is to call Actions code every time
  // Parser understands a token sequence on the top of its stack.
  parser.setActions(actions);


  // The main value from Actions here is that parser
  // continually helps lexer get the right state.
  // Otherwise ruby code couldn't be parsed at all.
  actions.setLexer(lexer);
  // Actions also recovers Parser from error with `parser.yyerrok()`.
  actions.setParser(parser);
  // Actions code does the only valuable work: calls the Builder instance
  // and stores its results to the Parser stack. This is the most interesting part.
  // Also the most outer rule of Actions sets `resulting_ast` on the Builder instance.
  actions.setBuilder(builder);
  // Actions does push and pop new dynamic and static scopes to help
  // Scope track when Parser enters new block, class, module etc.
  actions.setScope(scope);


  // Scope needs no one. Selfish scope.
  // scope;


  // Builder needs Scope to declare variables,
  // to check if some identificator is a local variable,
  // to find duplicated variables, arguments and so on.
  builder.setScope(scope);
  // Builder uses Lexer state to check its state, and reports error
  // if some node isn't allowed in such a state.
  // Alse, Builder uses lexer methods for located error reporting.
  builder.setLexer(lexer);

  // set up the common print function
  var rubyParser = this;
  function redirectToPrint () { rubyParser.print.apply(rubyParser, arguments) }
  lexer.print = parser.print = redirectToPrint


  // Save for use in prototype methods.
  this.lexer    = lexer;
  this.parser   = parser;
  this.actions  = actions;
  this.scope    = scope;
  this.builder  = builder;
}

// Easy part.
RubyParser.prototype.parse = function parse (text, filename)
{
  // Prepare lexer for the new hard work.
  this.lexer.reset();
  this.lexer.setScope(this.scope);
  this.lexer.filename = filename || this.filename;
  
  // Just set, do not interpret it anyhow.
  this.lexer.setText(text);
  
  // The main parsing loop.
  var ok = this.parser.parse();
  if (!ok)
    return false;
  
  return this.builder.resulting_ast;
}
RubyParser.prototype.toJSON = function toJSON (text, filename)
{
  var ast = this.parse(text, filename);
  if (ast === false)
    return false;
  
  return JSON.stringify(Builder.toPlain(ast));
}
RubyParser.prototype.declareVar = function declareVar (varname)
{
  // We export Scope's main method
  // allowing parser users to declare theid own local variables
  // before the actual parsing process begins.
  this.scope.declare(varname);
}
RubyParser.prototype.setFilename = function setFilename (filename)
{
  this.filename = ''+filename; // ASM.js!!!
}
RubyParser.prototype.print = function print (msg)
{
  throw 'Please, define print callback on parser. The message was: ' + msg
}

// Export some classes.
RubyParser.Builder = Builder;


if (typeof module != 'undefined' && module.exports)
{
  module.exports.RubyParser = RubyParser;
}
else if (typeof global != 'undefined')
{
  global.RubyParser = RubyParser;
}
else if (typeof window != 'undefined')
{
  window.RubyParser = RubyParser;
}
else
{
  throw "don't know how to export RubyParser"
}

})(); // whole parser and lexer namespace start




