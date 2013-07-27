

/* A Bison parser, made by GNU Bison 2.7.12-4996.  */

/* Skeleton implementation for Bison LALR(1) parsers in JavaScript
   
      Copyright (C) 2007-2013 Free Software Foundation, Inc.
   
   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.
   
   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* First part of user declarations.  */






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
        var children = cond/*.children*/;
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
        var children = cond/*.children*/;
        children[0] = this.check_condition(children[0]); // lhs
        children[1] = this.check_condition(children[1]); // rhs

        return cond;

      case 'irange': case 'erange':
        var children = cond/*.children*/;
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
        var name = node/*.children*/[0];
        if (this.scope.is_declared(name))
        {
          return n('lvar', [ name ]);
        }
        else
        {
          return n('send', [ null, name ]);
        }

      case '__FILE__':
        return n('str', [ node[0] ]);

      case '__LINE__':
        // TODO: use line from node value
        return n('int', [ this.lexer.ruby_sourceline ]); 

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
    var children = node/*.children*/;
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
  
  begin_body: function (compound_stmt, rescue_bodies /*=[]*/, else_, ensure)
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
      return n('kwbegin', body/*.children*/);
    }
    
    return n('kwbegin', [ body ])
  },
  
  assign: function (lhs, rhs)
  {
    lhs.push(rhs);
    return lhs;
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
          this.check_duplicate_args(this_arg/*.children*/, map);
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
      return n(body.type, body/*.children*/);
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
          symbols.push(n('dsym', part/*.children*/));
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
      return n('sym', [ str/*.children*/[0] ]);
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
      && receiver/*.children*/.length == 2
      && receiver/*.children*/[0].type == 'str'
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
/* "%code lexer" blocks.  */



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
  return 'A' <= c && c <= 'Z';
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
  return $lex_p === /*$lex_pbeg +*/ 1; // $lex_pbeg never changes
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
  
  /* was: tokenbuf[tokidx]='\0'*/
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
        /* skip embedded rd document */
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
        t = $('{');                /* block (primary) */
      else if (IS_lex_state(EXPR_ENDARG))
        t = tLBRACE_ARG;        /* block (expr) */
      else
        t = tLBRACE;            /* hash */
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
        case '_':              /* $_: last read line string */
          c = nextc();
          if (parser_is_identchar(c))
          {
            tokadd('$');
            tokadd('_');
            break;
          }
          pushback(c);
          c = '_';
          /* fall through */
        case '~':              /* $~: match-data */
        case '*':              /* $*: argv */
        case '$':              /* $$: pid */
        case '?':              /* $?: last status */
        case '!':              /* $!: error string */
        case '@':              /* $@: error position */
        case '/':              /* $/: input record separator */
        case '\\':             /* $\: output record separator */
        case ';':              /* $;: field separator */
        case ',':              /* $,: output field separator */
        case '.':              /* $.: last read line number */
        case '=':              /* $=: ignorecase */
        case ':':              /* $:: load path */
        case '<':              /* $<: reading filename */
        case '>':              /* $>: default output handle */
        case '\"':             /* $": already loaded files */
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

        case '&':              /* $&: last match */
        case '`':              /* $`: string before last match */
        case '\'':             /* $': string after last match */
        case '+':              /* $+: string matches last paren. */
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
    /*      int mb = ENC_CODERANGE_7BIT, *mbp = &mb; */
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
            /* ignore backslashed spaces in %w */
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
      return true;                 /* just ignore */

    case '0':
    case '1':
    case '2':
    case '3':                  /* octal constant */
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

    case 'x':                  /* hex constant */
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
    case '\\':                 /* Backslash */
      return c;

    case 'n':                  /* newline */
      return '\n';

    case 't':                  /* horizontal tab */
      return '\t';

    case 'r':                  /* carriage-return */
      return '\r';

    case 'f':                  /* form-feed */
      return '\f';

    case 'v':                  /* vertical tab */
      return '\v'; // \13

    case 'a':                  /* alarm(bell) */
      return '\a'; // \007

    case 'e':                  /* escape */
      return '\x1b'; // 033

    case '0':
    case '1':
    case '2':
    case '3':                  /* octal constant */
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

    case 'x':                  /* hex constant */
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

    case 'b':                  /* backspace */
      return '\x08'; // \010

    case 's':                  /* space */
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

/* return value is for \u3042 */
function parser_tokadd_utf8 (string_literal, symbol_literal, regexp_literal)
{
  /*
   * If string_literal is true, then we allow multiple codepoints
   * in \u{}, and add the codepoints to the current token.
   * Otherwise we're parsing a character literal and return a single
   * codepoint without adding it
   */

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
      /* hexadecimal */
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
      /* binary */
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
      /* decimal */
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
    // was:   /* 0_0 */
    // was:   goto octal_number;
    // was: }
    // and moved after the next if block
    if (c == 'o' || c == 'O')
    {
      /* prefixed octal */
      c = nextc();
      if (c == '' || c == '_' || !ISDIGIT(c))
      {
        lexer.yyerror("numeric literal without digits");
        return 0;
      }
    }
    if ((c >= '0' && c <= '7') || c == '_')
    {
      /* octal */
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

      case '_':          /* `_' in number just ignored */
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
  if (c <= ' '/*0x20*/ || /*0x7e*/ '~' < c)
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







/**
 * A Bison parser, automatically generated from <tt>parse.y</tt>.
 *
 * @author LALR (1) parser skeleton written by Paolo Bonzini.
 * @author JavaScript skeleton ported by Peter Leonov.
 */


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

  /**
   * Parse input from the scanner that was specified at object construction
   * time.  Return whether the end of the input was reached successfully.
   *
   * @return <tt>true</tt> if the parsing succeeds.  Note that this does not
   *          imply that there were no syntax errors.
   */
  this.parse = function parse ()
  {
    // Lookahead and lookahead in internal form.
    var yychar = yyempty_;
    var yytoken = 0;

    /* State.  */
    var yyn = 0;
    var yylen = 0;
    var yystate = 0;

    // the only place yystack value is changed
    yystack = this.yystack = new YYParser.Stack();
    yyvs = yystack.valueStack;

    /* Error handling.  */
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
    /* If YYLEN is nonzero, implement the default value of the action:
       `$$ = $1'.  Otherwise, use the top of the stack.

       Otherwise, the following line sets YYVAL to garbage.
       This behavior is undocumented and Bison
       users should not rely upon it.  */
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
  var yypact_ninf_ = this.yypact_ninf_ = -820;
  var yypact_ = this.yypact_ =
  [
    //]
      -820,   110,  2804,  -820,  7345,  -820,  -820,  -820,  6855,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  7458,  7458,  -820,  -820,
    7458,  4117,  3715,  -820,  -820,  -820,  -820,   314,  6723,    -8,
    -820,   -14,  -820,  -820,  -820,  3045,  3849,  -820,  -820,  3179,
    -820,  -820,  -820,  -820,  -820,  -820,  8814,  8814,    94,  5140,
    8927,  7797,  8136,  7113,  -820,  6591,  -820,  -820,  -820,    78,
      86,   120,   157,   246,  9040,  8814,  -820,   294,  -820,   845,
    -820,   144,  -820,  -820,    56,   287,   238,  -820,   241,  9153,
    -820,   275,  2890,   251,   331,  -820,  8927,  8927,  -820,  -820,
    5983,  9262,  9371,  9480,  6458,    20,    82,  -820,  -820,   315,
    -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
     400,   589,  -820,   333,   676,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,   327,  -820,  -820,  -820,  -820,
     337,  8814,   421,  5279,  8814,  8814,  8814,  8814,  -820,   407,
    2890,   410,  -820,  -820,   390,   411,    25,    42,   516,    43,
     478,  -820,  -820,  -820,  5870,  -820,  7458,  7458,  -820,  -820,
    6096,  -820,  8927,   813,  -820,   498,   509,  5418,  -820,  -820,
    -820,   510,   523,    56,  -820,   423,   595,   686,  7571,  -820,
    5140,   554,   294,  -820,   845,    -8,   560,  -820,   144,    -8,
     573,   210,   377,  -820,   410,   561,   377,  -820,    -8,   665,
     532,  9589,   591,  -820,   483,   515,   519,   528,  -820,  -820,
    -820,  -820,  -820,  -820,   422,  -820,   463,   486,   283,   618,
     632,   626,    55,   637,   726,   638,    63,   675,   700,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  6209,  8927,  8927,  8927,
    8927,  7571,  8927,  8927,  -820,  -820,  -820,   682,  -820,  -820,
    -820,  8249,  -820,  5140,  7229,   650,  8249,  8814,  8814,  8814,
    8814,  8814,  8814,  8814,  8814,  8814,  8814,  8814,  8814,  8814,
    8814,  8814,  8814,  8814,  8814,  8814,  8814,  8814,  8814,  8814,
    8814,  8814,  8814,  9868,  7458,  9945,  4524,   144,    77,    77,
    8927,  8927,   294,   769,   658,   741,  -820,  -820,   537,   775,
      66,   101,   122,   372,   445,  8927,   527,  -820,   279,   546,
    -820,  -820,  -820,  -820,    60,    98,   334,   338,   344,   406,
     430,   433,   465,  -820,  -820,  -820,    20,  -820,  -820, 10022,
    -820,  -820,  9040,  9040,  -820,  -820,    46,  -820,  -820,  -820,
    8814,  8814,  7684,  -820,  -820, 10099,  7458, 10176,  8814,  8814,
    7910,  -820,    -8,   666,  -820,  -820,    -8,  -820,   671,   674,
    -820,   343,  -820,  -820,  -820,  -820,  -820,  6855,  -820,  8814,
    5531,   678, 10099, 10176,  8814,   845,   681,    -8,  -820,  -820,
    6322,   679,    -8,  -820,  -820,  8023,  -820,  -820,  8136,  -820,
    -820,  -820,   498,   576,  -820,  -820,  -820,   683,  9589, 10253,
    7458, 10330,  1343,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,   293,  -820,  -820,   673,  -820,
    -820,  -820,   385,  -820,   684,  -820,  8814,  8814,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  -820,    51,    51,  -820,
    -820,    51,  8814,  -820,   701,   705,  -820,    -8,  9589,   706,
    -820,  -820,  -820,   733,  2023,  -820,  -820,   595,  2149,  2149,
    2149,  2149,  1173,  1173,  2550,  1796,  2149,  2149,  3024,  3024,
     630,   630,  2612,  1173,  1173,  1095,  1095,   707,    52,    52,
     595,   595,   595,  4251,  3313,  4385,  3447,   523,   718,  -820,
      -8,   690,  -820,   708,  -820,   523,  3983,   844,   848,  -820,
    4654,   847,  4914,    70,    70,   769,  8362,   844,   135, 10407,
    7458, 10484,  -820,   144,  -820,   576,  -820,   294,  -820,  -820,
    -820, 10561,  7458, 10022,  4524,  8927,  1416,  -820,  -820,  -820,
    1147,  -820,  2365,  -820,  2890,  6855,  2484,  -820,  8814,   410,
    -820,   478,  2911,  3581,    -8,    50,   291,  -820,  -820,  -820,
    -820,  7684,  7910,  -820,  -820,  8927,  2890,   728,  -820,  -820,
    -820,  2890,  5531,   278,  -820,  -820,   377,  9589,   683,   602,
     323,    -8,   175,   328,   753,  -820,  -820,  -820,  -820,  8814,
    -820,   807,  -820,  -820,  -820,  -820,  -820,  1551,    57,  -820,
    -820,  -820,  -820,  -820,   736,  -820,   738,   821,   747,  -820,
     748,   822,   749,   826,  -820,  -820,   788,  -820,  -820,  -820,
    -820,  -820,   595,   595,  -820,  1086,  5644,  -820,  -820,  5418,
      51,  5644,   758,  8475,  -820,   683,  9589,  9040,  8814,   779,
    9040,  9040,  -820,   682,   523,   762,   711,  9040,  9040,  -820,
     682,   523,  -820,  -820,  8588,   885,  -820,   610,  -820,   885,
    -820,  -820,  -820,  -820,   844,   171,  -820,    62,   139,    -8,
     154,   161,  8927,   294,  -820,  8927,  4524,   602,   323,  -820,
      -8,   844,   343,  1551,  4524,   294,  6987,  -820,    82,   287,
    -820,  8814,  -820,  -820,  -820,  8814,  8814,   598,  8814,  8814,
     770,   343,  -820,   778,  -820,  -820,   405,  8814,  -820,  -820,
     807,   504,  -820,   772,    -8,  -820,    -8,  5644,  5418,  -820,
    1551,  -820,   552,  -820,  -820,  -820,    28,  -820,  1551,  -820,
    -820,   992,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
     796,  9698,  -820,    -8,   793,   781,  -820,   782,   747,  -820,
     783,   785,  -820,   784,   910,   795,  5418,   913,  8814,   803,
     683,  2890,  8814,  -820,  2890,  -820,  2890,  -820,  -820,  -820,
    9040,  -820,  2890,  -820,  2890,  -820,  -820,   701,  -820,   855,
    -820,  5027,   936,  -820,  8927,   844,  -820,   844,  5644,  5644,
    -820,  8701,  4784,   253,    70,  -820,   294,   844,  -820,  -820,
    -820,    -8,   844,  -820,  -820,  -820,  -820,  2890,  8814,  7910,
    -820,  -820,  -820,    -8,   892,   817,   877,  -820,   815,   942,
     823,  -820,  -820,   824,   825,  -820,   747,  -820,   827,  -820,
     830,   827,  5757,  9698,   898,   633,   838,  -820,  1627,  -820,
     559,  -820,  -820,  1627,  -820,  1191,  -820,   883,  -820,  -820,
     829,  -820,   834,  2890,  -820,  2890,  9807,    77,  -820,  -820,
    5644,  -820,  -820,    77,  -820,  -820,   844,   844,  -820,   745,
    -820,  4524,  -820,  -820,  -820,  -820,  1416,  -820,   835,   892,
     649,  -820,  -820,  -820,  -820,  1551,  -820,   992,  -820,  -820,
     992,  -820,   992,  -820,  -820,   862,   633,  -820, 10638,  -820,
    -820,   840,   842,  -820,   747,   846,  -820,   849,   846,  -820,
     503,  -820,  -820,  -820,   921,  -820,   647,   515,   519,   528,
    4524,  -820,  4654,  -820,  -820,  -820,  -820,  -820,  5644,   844,
    4524,   892,   835,   892,   850,   827,   851,   827,   827,  -820,
     843,   859,  1627,  -820,  1191,  -820,  -820,  1191,  -820,  1191,
    -820,  -820,   883,  -820,   576, 10715,  7458, 10792,   848,   610,
     844,  -820,   844,   835,   892,  -820,   992,  -820,  -820,  -820,
     846,   852,   846,   846,  -820,   119,   323,    -8,   104,   183,
    -820,  -820,  -820,  -820,   835,   827,  -820,  1191,  -820,  -820,
    -820,   200,  -820,   846,  -820
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
     297,   263,   263,   509,   508,   510,   511,   607,     0,   607,
      10,     0,   513,   512,   514,   593,   595,   505,   504,   594,
     507,   499,   500,   452,   519,   520,     0,     0,     0,     0,
     288,   618,   618,    85,   406,   478,   476,   478,   480,   460,
     472,   466,   474,     0,     0,     0,     3,   605,     6,     9,
      33,    45,    48,    56,   263,    55,     0,    73,     0,    77,
      87,     0,    53,   244,     0,   286,     0,     0,   311,   314,
     605,     0,     0,     0,     0,    57,   306,   275,   276,   451,
     453,   277,   278,   279,   281,   280,   282,   449,   450,   448,
     515,   516,   283,     0,   284,    61,     5,     8,   168,   179,
     169,   192,   165,   185,   175,   174,   195,   196,   190,   173,
     172,   167,   193,   197,   198,   177,   166,   180,   184,   186,
     178,   171,   187,   194,   189,   188,   181,   191,   176,   164,
     183,   182,   163,   170,   161,   162,   158,   159,   160,   116,
     118,   117,   153,   154,   149,   131,   132,   133,   140,   137,
     139,   134,   135,   155,   156,   141,   142,   146,   150,   136,
     138,   128,   129,   130,   143,   144,   145,   147,   148,   151,
     152,   157,   121,   123,   125,    26,   119,   120,   122,   124,
       0,     0,     0,     0,     0,     0,     0,     0,   258,     0,
     245,   268,    71,   262,   618,     0,   515,   516,     0,   284,
     618,   588,    72,    70,   607,    69,     0,   618,   429,    68,
     607,   608,     0,     0,    21,   241,     0,     0,   334,   335,
     297,   300,   430,     0,   220,     0,   221,   294,     0,    19,
       0,     0,   605,    15,    18,   607,    75,    14,   290,   607,
       0,   611,   611,   246,     0,     0,   611,   586,   607,     0,
       0,     0,    83,   338,     0,    93,    94,   101,   308,   407,
     496,   495,   497,   494,     0,   493,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   501,   502,    52,
     235,   236,   614,   615,     4,   616,   606,     0,     0,     0,
       0,     0,     0,     0,   434,   432,   419,    62,   305,   413,
     415,     0,    89,     0,    81,    78,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   427,   618,   425,     0,    54,     0,     0,
       0,     0,   605,     0,   606,     0,   360,   359,     0,     0,
     515,   516,   284,   111,   112,     0,     0,   114,     0,     0,
     515,   516,   284,   327,   188,   181,   191,   176,   158,   159,
     160,   116,   117,   584,   329,   583,     0,   604,   603,     0,
     307,   454,     0,     0,   126,   591,   294,   269,   592,   265,
       0,     0,     0,   259,   267,   427,   618,   425,     0,     0,
       0,   260,   607,     0,   299,   264,   607,   254,   618,   618,
     253,   607,   304,    51,    23,    25,    24,     0,   301,     0,
       0,     0,   427,   425,     0,    17,     0,   607,   292,    13,
     606,    74,   607,   289,   295,   613,   612,   247,   613,   249,
     296,   587,     0,   100,   501,   502,    91,    86,     0,   427,
     618,   425,   547,   482,   485,   483,   498,   479,   455,   477,
     456,   457,   481,   458,   459,     0,   462,   468,     0,   469,
     464,   465,     0,   470,     0,   471,     0,     0,   617,     7,
      27,    28,    29,    30,    31,    49,    50,   618,   618,    59,
      63,   618,     0,    34,    43,     0,    44,   607,     0,    79,
      90,    47,    46,     0,   199,   268,    42,   217,   225,   230,
     231,   232,   227,   229,   239,   240,   233,   234,   210,   211,
     237,   238,   607,   226,   228,   222,   223,   224,   212,   213,
     214,   215,   216,   596,   598,   597,   599,     0,   263,   424,
     607,   596,   598,   597,   599,     0,   263,     0,   618,   351,
       0,   350,     0,     0,     0,     0,     0,     0,   294,   427,
     618,   425,   319,   324,   111,   112,   113,     0,   522,   322,
     521,   427,   618,   425,     0,     0,   547,   331,   596,   597,
     263,    35,   201,    41,   209,     0,   199,   590,     0,   270,
     266,   618,   596,   597,   607,   596,   597,   589,   298,   609,
     250,   255,   257,   303,    22,     0,   242,     0,    32,   422,
     420,   208,     0,    76,    16,   291,   611,     0,    84,    97,
      99,   607,   596,   597,   553,   550,   549,   548,   551,     0,
     564,     0,   575,   565,   579,   578,   574,   547,     0,   546,
     410,   552,   554,   556,   532,   562,   618,   567,   618,   572,
     532,   577,   532,     0,   530,   486,     0,   461,   463,   473,
     467,   475,   218,   219,   398,   607,     0,   396,   395,     0,
     618,     0,   274,     0,    88,    82,     0,     0,     0,     0,
       0,     0,   428,    66,     0,     0,   431,     0,     0,   426,
      64,   618,   349,   287,   618,   618,   440,   618,   352,   618,
     354,   312,   353,   315,     0,     0,   318,   600,   293,   607,
     596,   597,     0,     0,   524,     0,     0,   111,   112,   115,
     607,     0,   607,   547,     0,     0,     0,   252,   416,    58,
     251,     0,   127,   271,   261,     0,     0,   431,     0,     0,
     618,   607,    11,     0,   248,    92,    95,     0,   558,   553,
       0,   372,   363,   365,   607,   361,   607,     0,     0,   408,
       0,   539,     0,   528,   582,   566,     0,   529,     0,   542,
     576,     0,   544,   580,   487,   489,   490,   491,   484,   492,
     553,     0,   394,   607,     0,   379,   560,   618,   618,   570,
     379,   379,   377,   400,     0,     0,     0,     0,     0,   272,
      80,   200,     0,    40,   206,    39,   207,    67,   423,   610,
       0,    37,   204,    38,   205,    65,   421,   441,   442,   618,
     443,     0,   618,   357,     0,     0,   355,     0,     0,     0,
     317,     0,     0,   431,     0,   325,     0,     0,   431,   328,
     585,   607,     0,   526,   332,   417,   418,   202,     0,   256,
     302,    20,   568,   607,     0,   370,     0,   555,     0,     0,
       0,   531,   557,   532,   532,   563,   618,   581,   532,   573,
     532,   532,     0,     0,     0,   559,     0,   397,   385,   387,
       0,   375,   376,     0,   390,     0,   392,     0,   435,   433,
       0,   414,   273,   243,    36,   203,     0,     0,   445,   358,
       0,    12,   447,     0,   309,   310,     0,     0,   270,   618,
     320,     0,   523,   323,   525,   330,   547,   362,   373,     0,
     368,   364,   409,   412,   411,     0,   535,     0,   537,   527,
       0,   543,     0,   540,   545,     0,   569,   294,   427,   399,
     378,   379,   379,   561,   618,   379,   571,   379,   379,   404,
     607,   402,   405,    60,     0,   444,     0,   102,   103,   110,
       0,   446,     0,   313,   316,   437,   438,   436,     0,     0,
       0,     0,   371,     0,   366,   532,   532,   532,   532,   488,
     600,   293,     0,   382,     0,   384,   374,     0,   391,     0,
     388,   393,     0,   401,   109,   427,   618,   425,   618,   618,
       0,   326,     0,   369,     0,   536,     0,   533,   538,   541,
     379,   379,   379,   379,   403,   600,   108,   607,   596,   597,
     439,   356,   321,   333,   367,   532,   383,     0,   380,   386,
     389,   431,   534,   379,   381
    //[
  ];

  // YYPGOTO[NTERM-NUM].
  var yypgoto_ =
  [
    //]
      -820,  -820,  -820,  -386,  -820,    41,  -820,  -542,   285,  -820,
     545,  -820,    35,  -820,  -310,   -43,   -70,    19,  -820,  -267,
    -820,   680,     9,   905,  -156,    27,   -73,  -820,  -404,     6,
    1733,  -328,   904,   -52,  -820,   -24,  -820,  -820,    13,  -820,
    1007,  -820,   909,  -820,   -72,   289,  -336,   141,     5,  -820,
    -320,  -212,    58,  -313,   -21,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,    49,  -820,  -820,  -820,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,  -520,  -348,  -519,   -12,  -634,  -820,  -803,
    -773,   239,   325,    37,  -820,  -405,  -820,  -680,  -820,    -4,
    -820,  -820,  -820,  -820,  -820,   262,  -820,  -820,  -820,  -820,
    -820,  -820,  -820,   -95,  -820,  -820,  -535,  -820,    -6,  -820,
    -820,  -820,  -820,  -820,  -820,   914,  -820,  -820,  -820,  -820,
     721,  -820,  -820,  -820,  -820,  -820,  -820,  -820,   961,  -820,
    -116,  -820,  -820,  -820,  -820,  -820,     2,  -820,     7,  -820,
    1388,  1539,   925,  1901,  1724,  -820,  -820,    84,  -450,  -410,
    -412,  -819,  -627,  -718,  -134,   244,   121,  -820,  -820,  -820,
     -83,  -721,  -799,   130,   252,  -820,  -574,  -820,  -463,  -579,
    -820,  -820,  -820,   102,  -374,  -820,  -322,  -820,   639,   -29,
     -15,  -221,  -578,  -243,   -62,   -11,    -2
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
     848,   361,   849,   732,   988,   736,   733,   931,   594,   596,
     746,   936,   245,    85,    86,    87,    88,    89,    90,    91,
      92,    93,    94,   713,   570,   721,   845,   846,   369,   772,
     773,   774,   960,   899,   803,   686,   687,   804,   970,   971,
     278,   279,   472,   658,   779,   320,   511,    95,    96,   711,
     704,   565,   557,   318,   508,   507,   577,   987,   715,   839,
     917,   921,    97,    98,    99,   100,   101,   102,   103,   290,
     485,   104,   294,   105,   106,   292,   296,   286,   284,   288,
     477,   676,   675,   794,   892,   798,   107,   285,   108,   109,
     216,   217,   112,   218,   219,   589,   735,   744,   881,   781,
     745,   661,   662,   663,   664,   665,   806,   807,   666,   667,
     668,   669,   809,   810,   670,   671,   672,   673,   674,   783,
     396,   595,   265,   429,   221,   115,   629,   559,   399,   304,
     423,   424,   706,   457,   571,   364,   257
    //[
  ];

  // YYTABLE[YYPACT[STATE-NUM]]. What to do in state STATE-NUM.
  // If positive, shift that token.
  // If negative, reduce the rule which number is the opposite.
  // If yytable_NINF_, syntax error.
  var yytable_ninf_ = this.yytable_ninf_ = -619;
  var yytable_ = this.yytable_ =
  [
    //]
       116,   400,   316,   283,   234,   305,   325,   258,   421,   432,
     198,   572,   232,   526,   235,   199,   521,   359,   560,   459,
     362,   196,   659,   461,   775,   208,   208,   229,   305,   208,
     198,   558,   273,   566,   451,   199,   757,    69,   453,    69,
     724,   196,   394,   357,   357,   117,   617,   357,   586,   263,
     267,    84,   741,    84,   627,   723,   306,   726,   273,   272,
     660,   363,   882,   766,   638,   215,   215,   889,   196,   215,
     273,   273,   273,   941,   214,   214,   256,   600,   214,   317,
     614,   842,   314,   299,   617,   847,   777,  -106,   972,   787,
     569,  -102,   610,   558,   447,   566,   878,   720,    84,   215,
     610,   938,   274,   689,   966,   397,   691,   196,   314,   261,
       3,   811,  -517,   215,   695,   237,   488,  -105,   220,   220,
     327,   630,   220,   896,   494,   654,  -103,   684,   274,  -518,
     419,   231,  -106,   444,   641,   215,   215,   758,  -102,   215,
     368,   379,   379,   775,   875,  -509,   659,  -110,   655,   630,
     247,   853,   398,   262,   266,  -103,  -110,   212,   222,  -109,
    -109,   223,   858,  -105,  -108,   489,   992,   517,   778,   685,
     479,   316,   482,   495,   486,   350,   351,   352,   486,  -105,
     882,   312,   313,  -508,   569,   315,  -107,   431,   941,   433,
     305,   227,  -509,   972,   857,   -97,  -107,  -596,   466,   -93,
     -96,   618,   862,   966,   850,   620,   884,   659,   302,   303,
     623,   315,   414,  -104,   890,   302,   303,   421,   414,   289,
    1023,   859,   812,   449,   889,   430,   633,   291,   901,   902,
    -508,   635,   882,   208,   -94,   208,   208,   500,   501,   502,
     503,   450,  -105,  -105,   729,   776,   763,   775,   617,   775,
     273,  1044,    84,   462,  -596,  -101,   740,  -106,  -106,   630,
     789,   293,   792,   739,   357,   357,   357,   357,  -100,   505,
     506,   630,   -99,   215,  -597,   215,   215,   256,  -104,   215,
     587,   215,   214,   445,   214,   816,    84,   -96,   -96,   882,
     573,   574,   820,   659,   -98,   985,   694,    84,   295,    84,
     305,   610,   610,   273,   851,   297,   298,   949,   -96,   302,
     303,   -96,   775,   994,   -96,   319,   590,   357,   357,   887,
     274,  -107,  -107,   887,   962,   924,   220,   925,   220,   967,
     519,   861,   583,   575,   251,   930,  -338,   933,  -104,  -104,
     513,    69,   935,   455,   473,   522,   504,   499,   481,   456,
     256,   321,   430,   -98,   473,    84,   215,   215,   215,   215,
      84,   215,   215,   208,   775,   422,   775,   425,   564,   678,
     215,   996,    84,   274,   322,   215,   678,   852,   759,   515,
     312,   313,  -338,  -338,   515,  1006,   -95,   521,   326,   989,
     474,   -74,   475,   764,   986,   466,   588,   775,  -593,   754,
     474,   838,   475,   215,  -107,    84,   983,   984,  -293,   215,
     215,   -88,   564,   624,   430,    56,   353,   302,   303,  -510,
     402,   601,   603,  -511,   215,   208,   414,   414,  1031,  -513,
     564,  -431,   302,   303,   677,   812,   827,   887,   116,   198,
     812,   -98,   812,   835,   199,   466,   473,   273,  1022,   230,
     196,   215,   215,   231,  -293,  -293,   564,  -503,  -597,  1051,
     404,   -98,   354,   355,   -98,   215,  -510,   -98,   430,  1021,
    -511,  -594,   230,   946,   948,    69,  -513,   406,   951,   208,
     953,   954,   231,   473,   564,   702,   659,  -517,   251,    84,
    -431,  -512,   474,   709,   475,   617,   415,   273,   411,    84,
    1042,  -593,  1043,  -503,  -503,   688,   688,  -593,   442,   688,
     458,   722,   722,  -102,   611,  -514,   456,   274,  -503,   215,
     410,   860,   441,   412,   473,   734,   680,   699,   747,   474,
    -506,   475,   476,   -93,  -431,   251,  -431,  -431,  -512,   812,
     870,   812,   416,   417,   812,   705,   812,   473,   754,   610,
    -506,   805,   742,   877,   416,   443,   769,   636,   645,   646,
     647,   648,  -514,   703,   765,  -503,   716,   274,   469,   980,
     474,   710,   475,   478,  -594,   982,  -506,  -506,   430,   584,
    -594,   752,   761,   585,   812,  1025,  1027,  1028,  1029,   208,
     430,   464,   465,   474,   564,   475,   480,  -506,   750,   705,
    -515,   208,   808,   418,  -516,   749,   564,   198,   251,   414,
     649,   420,   199,  -284,   470,   471,   273,   801,   196,    84,
     650,    84,   579,   466,   844,   841,   705,   650,  -600,   215,
     116,   591,   828,   438,   725,  1052,  1012,   874,   440,   747,
     934,   215,   231,    84,   215,   224,  -515,  -515,   653,   654,
    -516,  -516,   937,   865,   888,   653,   654,   891,   227,  -284,
    -284,  -294,   854,   327,   784,   856,   784,    69,   580,   581,
     813,   855,   655,   -73,   215,   273,  -518,   592,   593,   655,
    1037,    84,    74,   863,    74,   868,   274,  -600,   688,   357,
     448,   460,   357,   473,   864,   630,    74,    74,   327,   886,
      74,   769,  -103,   645,   646,   647,   648,  -294,  -294,   750,
     454,  -104,   840,   843,   705,   843,   522,   843,   958,   823,
     825,   463,   -94,   760,   468,   705,   831,   833,   483,    74,
      74,  -600,  1015,  -600,  -600,    84,   487,  -596,    84,   474,
      84,   475,   484,   496,    74,   274,   215,   490,   493,   215,
     215,   348,   349,   350,   351,   352,   215,   215,   414,   196,
     841,   813,   576,   403,   592,   593,    74,    74,   497,   965,
      74,   968,   515,   444,   923,   327,   509,   707,  1016,  1017,
     273,   215,   993,   520,   215,    84,   576,   473,   813,  -110,
     340,   341,   722,    84,   932,   708,   498,   578,   830,  -109,
     582,   357,   619,  -105,   621,   784,   784,   622,   628,  -101,
     632,   995,   -88,   997,   679,   808,   637,   964,   998,  -100,
     808,  -107,   808,   -96,  -104,   681,    84,    84,   348,   349,
     350,   351,   352,   474,  -268,   475,   491,   918,   693,   696,
     922,   -98,   795,   796,   -95,   797,   697,   904,   906,   914,
     895,    44,    45,  -422,   712,   717,   714,   719,   762,   769,
     718,   645,   646,   647,   648,    84,   767,   434,  1030,   780,
    1032,   782,   273,   785,   790,  1033,   435,   436,   793,   215,
     786,   788,   791,    74,   784,   307,   308,   309,   310,   311,
      84,  -269,  1045,   215,   822,   273,   770,    84,    84,   829,
     841,    84,   771,   869,    74,   876,    74,    74,   871,   893,
      74,   897,    74,  1053,   898,   900,   903,    74,   905,   808,
     908,   808,   907,   911,   808,   909,   808,   843,    74,   769,
      74,   645,   646,   647,   648,   969,  -270,   645,   646,   647,
     648,    84,   956,   916,   769,   920,   645,   646,   647,   648,
     939,   942,   943,   944,   957,  1013,   959,   945,   947,   973,
     950,   264,   784,   952,   808,   976,   770,  -271,   991,    84,
     999,   814,   940,  1002,   815,  1004,   817,  1014,  -596,  1007,
      84,   770,  1009,  1024,  1026,  1047,    74,    74,    74,    74,
      74,    74,    74,    74,  -597,   634,   366,   383,  1003,  1005,
     836,    74,  1008,    74,  1010,  1011,    74,  1041,  1034,   873,
     802,   866,  1040,   401,   430,   492,   716,   843,   287,   395,
     990,   963,   705,   210,   210,   208,   885,   210,   961,    84,
     564,    84,   883,     0,    74,   597,    74,    84,     0,    84,
      74,    74,     0,     0,   769,     0,   645,   646,   647,   648,
     649,     0,     0,   244,   246,    74,     0,     0,   210,   210,
     650,     0,   879,   880,     0,   215,     0,  1046,  1048,  1049,
    1050,   300,   301,     0,     0,     0,     0,     0,     0,     0,
       0,   651,    74,    74,     0,     0,     0,     0,   653,   654,
    1054,     0,     0,     0,     0,     0,    74,     0,     0,     0,
       0,   910,     0,     0,     0,     0,     0,     0,     0,     0,
     405,     0,   655,   407,   408,   409,     0,     0,     0,     0,
      74,     0,     0,     0,     0,     0,   919,     0,     0,     0,
      74,     0,     0,   926,   927,     0,     0,   929,   800,     0,
     645,   646,   647,   648,   801,     0,     0,  -618,     0,     0,
      74,     0,     0,     0,   650,  -618,  -618,  -618,     0,     0,
    -618,  -618,  -618,   327,  -618,     0,     0,     0,     0,     0,
       0,     0,     0,  -618,  -618,   651,     0,   955,   340,   341,
       0,   652,   653,   654,  -618,  -618,     0,  -618,  -618,  -618,
    -618,  -618,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   981,   655,     0,   210,   656,
       0,   210,   210,   210,   300,   347,   348,   349,   350,   351,
     352,     0,     0,     0,     0,   231,     0,     0,     0,     0,
     514,   210,  -618,   210,   210,   525,     0,     0,     0,     0,
       0,   327,     0,   769,     0,   645,   646,   647,   648,   801,
      74,     0,    74,     0,     0,  -618,   340,   341,     0,   650,
      74,     0,     0,     0,     0,  1018,     0,  1019,     0,     0,
       0,     0,    74,  1020,    74,    74,  -618,  -618,     0,  -618,
     651,     0,   227,  -618,     0,  -618,  -618,   653,   654,     0,
       0,   345,   346,   347,   348,   349,   350,   351,   352,     0,
       0,     0,     0,     0,     0,    74,     0,     0,     0,     0,
       0,   655,    74,     0,     0,     0,     0,     0,     0,     0,
     607,   609,     0,     0,     0,     0,     0,     0,   210,   264,
       0,     0,     0,   524,   527,   528,   529,   530,   531,   532,
     533,   534,   535,   536,   537,   538,   539,   540,   541,   542,
     543,   544,   545,   546,   547,   548,   549,   550,   551,   552,
       0,   210,     0,     0,   609,     0,    74,   264,     0,    74,
       0,    74,     0,     0,     0,     0,     0,    74,     0,     0,
      74,    74,     0,     0,     0,     0,     0,    74,    74,     0,
     110,     0,   110,     0,     0,   644,     0,   645,   646,   647,
     648,   649,     0,     0,     0,     0,     0,     0,     0,   602,
     604,   650,    74,     0,     0,    74,    74,   606,   210,   210,
       0,   692,     0,   210,    74,   602,   604,   210,     0,     0,
       0,     0,   651,     0,     0,     0,     0,   110,   652,   653,
     654,   275,     0,     0,     0,     0,   626,     0,     0,     0,
       0,   631,     0,     0,     0,     0,     0,    74,    74,     0,
       0,     0,   210,   655,     0,   210,   656,   275,   644,     0,
     645,   646,   647,   648,   649,     0,     0,   210,   657,   370,
     380,   380,   380,     0,   650,   525,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,    74,     0,     0,     0,
       0,     0,     0,   682,   683,   651,     0,     0,     0,     0,
      74,   652,   653,   654,     0,     0,     0,   753,     0,   210,
       0,    74,     0,     0,    74,     0,     0,     0,    74,    74,
     609,   264,    74,     0,     0,     0,   655,     0,     0,   656,
       0,   111,     0,   111,     0,     0,     0,     0,     0,     0,
       0,   743,     0,     0,     0,     0,     0,     0,   768,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,    74,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   210,     0,     0,     0,   210,   111,     0,
       0,   110,   276,     0,     0,     0,     0,     0,     0,   210,
      74,     0,   819,   644,     0,   645,   646,   647,   648,   649,
       0,    74,     0,     0,     0,   210,     0,     0,   276,   650,
       0,     0,     0,   837,     0,   110,     0,     0,   210,   210,
     371,   381,   381,   381,     0,     0,   110,     0,   110,     0,
     651,     0,     0,     0,     0,     0,   652,   653,   654,     0,
       0,     0,     0,     0,     0,     0,   210,     0,     0,   275,
      74,     0,    74,     0,     0,     0,     0,     0,    74,     0,
      74,   655,     0,     0,   656,     0,   872,     0,     0,   800,
       0,   645,   646,   647,   648,   801,     0,     0,     0,     0,
       0,     0,     0,     0,   110,   650,    74,     0,     0,   110,
     210,     0,     0,     0,   606,   821,     0,   824,   826,     0,
       0,   110,   275,     0,   832,   834,   651,     0,     0,     0,
       0,   210,   652,   653,   654,     0,   114,   912,   114,     0,
       0,     0,     0,     0,     0,    81,     0,    81,     0,     0,
       0,     0,   111,     0,   110,     0,     0,   655,     0,     0,
     656,     0,     0,     0,     0,     0,     0,     0,   867,     0,
     928,     0,   824,   826,     0,   832,   834,     0,     0,     0,
       0,     0,     0,   114,   210,     0,   111,   277,   264,     0,
       0,     0,    81,     0,     0,     0,     0,   111,     0,   111,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   277,     0,     0,     0,     0,     0,     0,
     276,     0,     0,     0,     0,   372,   382,   382,     0,     0,
       0,     0,     0,     0,   367,   210,     0,     0,   110,   913,
       0,     0,     0,     0,     0,     0,     0,   915,   110,     0,
       0,     0,     0,     0,     0,   111,     0,     0,     0,     0,
     111,     0,     0,     0,     0,     0,   275,     0,   210,     0,
       0,     0,   111,   276,   327,   328,   329,   330,   331,   332,
     333,   334,     0,   336,   337,   915,   210,     0,     0,   340,
     341,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   111,     0,     0,     0,     0,
       0,     0,     0,   113,     0,   113,   275,     0,     0,     0,
       0,     0,   343,   344,   345,   346,   347,   348,   349,   350,
     351,   352,     0,     0,     0,     0,     0,   114,     0,     0,
       0,     0,     0,     0,     0,     0,    81,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     113,     0,     0,     0,     0,     0,     0,     0,   110,     0,
     110,   114,     0,     0,     0,     0,     0,     0,     0,     0,
      81,     0,   114,     0,   114,     0,     0,     0,     0,   111,
       0,    81,   110,    81,     0,     0,     0,     0,     0,   111,
       0,     0,     0,     0,     0,   277,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   276,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     110,     0,     0,   210,     0,   275,     0,     0,     0,     0,
     114,     0,     0,     0,     0,   114,     0,     0,     0,    81,
       0,     0,     0,     0,    81,     0,     0,   114,   277,     0,
       0,     0,     0,     0,     0,     0,    81,   276,     0,   523,
       0,     0,     0,     0,     0,     0,     0,   698,     0,     0,
       0,     0,     0,     0,   110,     0,     0,   110,     0,   110,
     114,     0,     0,     0,   275,     0,     0,     0,     0,    81,
       0,   327,   328,   329,   330,   331,   332,   333,   334,   335,
     336,   337,   338,   339,   113,     0,   340,   341,     0,   111,
       0,   111,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   110,     0,     0,     0,     0,     0,
       0,     0,   110,   111,     0,     0,     0,   342,   113,   343,
     344,   345,   346,   347,   348,   349,   350,   351,   352,   113,
       0,   113,     0,     0,     0,     0,  -245,     0,     0,     0,
       0,     0,     0,     0,   114,   110,   110,     0,     0,     0,
       0,   111,     0,    81,   114,     0,   276,     0,     0,     0,
       0,     0,     0,    81,     0,     0,     0,     0,     0,   380,
       0,     0,   277,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   110,     0,     0,   113,     0,     0,
       0,     0,   113,     0,     0,     0,     0,   327,  -619,  -619,
    -619,  -619,   332,   333,   113,   111,  -619,  -619,   111,   110,
     111,     0,   340,   341,     0,   276,   110,   110,     0,     0,
     110,     0,   277,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   113,     0,     0,
       0,     0,     0,     0,     0,   343,   344,   345,   346,   347,
     348,   349,   350,   351,   352,   111,     0,     0,     0,     0,
     110,   380,     0,   111,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   114,     0,   114,     0,     0,     0,
       0,     0,     0,    81,   977,    81,     0,     0,   110,     0,
       0,     0,     0,     0,     0,     0,   111,   111,   114,   110,
       0,     0,     0,     0,     0,     0,     0,    81,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     381,   113,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   113,     0,     0,     0,   111,   114,     0,     0,     0,
       0,   277,     0,     0,     0,    81,     0,     0,   110,     0,
     110,     0,     0,     0,     0,     0,   110,     0,   110,     0,
     111,     0,     0,     0,     0,     0,     0,   111,   111,     0,
       0,   111,     0,     0,     0,     0,     0,     0,     0,     0,
     799,     0,     0,     0,     0,     0,     0,     0,     0,   751,
     114,     0,     0,   114,     0,   114,     0,     0,     0,    81,
     277,     0,    81,     0,    81,     0,     0,     0,     0,     0,
     523,   111,   381,   327,   328,   329,   330,   331,   332,   333,
     334,   335,   336,   337,   338,   339,     0,     0,   340,   341,
       0,     0,     0,     0,     0,   978,     0,     0,     0,   111,
     114,     0,     0,     0,     0,     0,     0,     0,   114,    81,
     111,   113,     0,   113,     0,     0,     0,    81,     0,   342,
       0,   343,   344,   345,   346,   347,   348,   349,   350,   351,
     352,     0,     0,     0,     0,   113,     0,     0,     0,     0,
       0,   114,   114,     0,     0,     0,     0,     0,     0,     0,
      81,    81,     0,     0,     0,     0,     0,     0,     0,   111,
       0,   111,     0,     0,     0,   382,     0,   111,   698,   111,
       0,     0,     0,   113,     0,     0,     0,     0,     0,     0,
     114,     0,     0,     0,     0,     0,     0,     0,     0,    81,
       0,     0,   327,   328,   329,   330,   331,   332,   333,   334,
     335,   336,   337,   338,   339,   114,     0,   340,   341,     0,
       0,     0,   114,   114,    81,     0,   114,     0,     0,     0,
       0,    81,    81,     0,     0,    81,     0,   113,     0,     0,
     113,     0,   113,     0,     0,     0,     0,     0,   342,     0,
     343,   344,   345,   346,   347,   348,   349,   350,   351,   352,
       0,     0,     0,     0,     0,     0,   114,   382,   327,   328,
     329,   330,   331,   332,   333,    81,     0,   336,   337,     0,
       0,     0,     0,   340,   341,     0,     0,   113,     0,     0,
     979,     0,     0,     0,   114,   113,     0,     0,     0,   975,
       0,     0,     0,    81,     0,   114,     0,     0,     0,     0,
       0,     0,     0,     0,    81,     0,   343,   344,   345,   346,
     347,   348,   349,   350,   351,   352,     0,     0,   113,   113,
     327,   328,   329,   330,   331,   332,   333,   334,   335,   336,
     337,   338,   339,     0,     0,   340,   341,     0,     0,     0,
       0,     0,     0,     0,   114,     0,   114,     0,     0,     0,
       0,     0,   114,    81,   114,    81,     0,   113,     0,     0,
       0,    81,     0,    81,     0,     0,   342,     0,   343,   344,
     345,   346,   347,   348,   349,   350,   351,   352,     0,     0,
       0,     0,   113,     0,     0,     0,     0,     0,     0,   113,
     113,   231,     0,   113,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   113,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,  -618,     4,     0,     5,     6,     7,
       8,     9,     0,     0,     0,    10,    11,     0,     0,     0,
      12,   113,    13,    14,    15,    16,    17,    18,    19,     0,
       0,     0,   113,     0,    20,    21,    22,    23,    24,    25,
      26,     0,     0,    27,     0,     0,     0,     0,     0,    28,
      29,    30,    31,    32,    33,    34,    35,    36,    37,    38,
      39,    40,     0,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   113,     0,   113,     0,     0,     0,     0,     0,   113,
      48,   113,     0,    49,    50,     0,    51,    52,     0,    53,
       0,     0,    54,    55,    56,    57,    58,    59,    60,    61,
      62,  -600,     0,     0,     0,     0,     0,     0,     0,  -600,
    -600,  -600,     0,     0,  -600,  -600,  -600,     0,  -600,     0,
      63,    64,    65,     0,     0,     0,     0,  -600,  -600,  -600,
    -600,     0,  -618,  -618,     0,     0,     0,     0,  -600,  -600,
       0,  -600,  -600,  -600,  -600,  -600,     0,     0,   327,   328,
     329,   330,   331,   332,   333,   334,   335,   336,   337,   338,
     339,     0,     0,   340,   341,     0,     0,     0,     0,  -600,
    -600,  -600,  -600,  -600,  -600,  -600,  -600,  -600,  -600,  -600,
    -600,  -600,     0,     0,  -600,  -600,  -600,     0,   755,  -600,
       0,     0,     0,     0,   342,  -600,   343,   344,   345,   346,
     347,   348,   349,   350,   351,   352,     0,     0,     0,  -600,
       0,     0,  -600,     0,  -106,  -600,  -600,  -600,  -600,  -600,
    -600,  -600,  -600,  -600,  -600,  -600,  -600,     0,     0,     0,
    -600,  -600,  -600,  -600,  -600,  -503,     0,  -600,  -600,  -600,
    -600,     0,     0,  -503,  -503,  -503,     0,     0,  -503,  -503,
    -503,     0,  -503,     0,     0,     0,     0,     0,     0,     0,
    -503,     0,  -503,  -503,  -503,     0,     0,     0,     0,     0,
       0,     0,  -503,  -503,     0,  -503,  -503,  -503,  -503,  -503,
       0,     0,   327,   328,   329,   330,   331,   332,   333,   334,
     335,   336,   337,  -619,  -619,     0,     0,   340,   341,     0,
       0,     0,     0,  -503,  -503,  -503,  -503,  -503,  -503,  -503,
    -503,  -503,  -503,  -503,  -503,  -503,     0,     0,  -503,  -503,
    -503,     0,  -503,  -503,     0,     0,     0,     0,     0,  -503,
     343,   344,   345,   346,   347,   348,   349,   350,   351,   352,
       0,     0,     0,  -503,     0,     0,  -503,     0,  -503,  -503,
    -503,  -503,  -503,  -503,  -503,  -503,  -503,  -503,  -503,  -503,
    -503,     0,     0,     0,     0,  -503,  -503,  -503,  -503,  -506,
       0,  -503,  -503,  -503,  -503,     0,     0,  -506,  -506,  -506,
       0,     0,  -506,  -506,  -506,     0,  -506,     0,     0,     0,
       0,     0,     0,     0,  -506,     0,  -506,  -506,  -506,     0,
       0,     0,     0,     0,     0,     0,  -506,  -506,     0,  -506,
    -506,  -506,  -506,  -506,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,  -506,  -506,  -506,
    -506,  -506,  -506,  -506,  -506,  -506,  -506,  -506,  -506,  -506,
       0,     0,  -506,  -506,  -506,     0,  -506,  -506,     0,     0,
       0,     0,     0,  -506,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,  -506,     0,     0,
    -506,     0,  -506,  -506,  -506,  -506,  -506,  -506,  -506,  -506,
    -506,  -506,  -506,  -506,  -506,     0,     0,     0,     0,  -506,
    -506,  -506,  -506,  -601,     0,  -506,  -506,  -506,  -506,     0,
       0,  -601,  -601,  -601,     0,     0,  -601,  -601,  -601,     0,
    -601,     0,     0,     0,     0,     0,     0,     0,     0,  -601,
    -601,  -601,  -601,     0,     0,     0,     0,     0,     0,     0,
    -601,  -601,     0,  -601,  -601,  -601,  -601,  -601,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,  -601,  -601,  -601,  -601,  -601,  -601,  -601,  -601,  -601,
    -601,  -601,  -601,  -601,     0,     0,  -601,  -601,  -601,     0,
       0,  -601,     0,     0,     0,     0,     0,  -601,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,  -601,     0,     0,  -601,     0,     0,  -601,  -601,  -601,
    -601,  -601,  -601,  -601,  -601,  -601,  -601,  -601,  -601,     0,
       0,     0,  -601,  -601,  -601,  -601,  -601,  -602,     0,  -601,
    -601,  -601,  -601,     0,     0,  -602,  -602,  -602,     0,     0,
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
    -602,  -293,     0,  -602,  -602,  -602,  -602,     0,     0,  -293,
    -293,  -293,     0,     0,  -293,  -293,  -293,     0,  -293,     0,
       0,     0,     0,     0,     0,     0,     0,     0,  -293,  -293,
    -293,     0,     0,     0,     0,     0,     0,     0,  -293,  -293,
       0,  -293,  -293,  -293,  -293,  -293,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,  -293,
    -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,
    -293,  -293,     0,     0,  -293,  -293,  -293,     0,   756,  -293,
       0,     0,     0,     0,     0,  -293,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,  -293,
       0,     0,  -293,     0,  -108,  -293,  -293,  -293,  -293,  -293,
    -293,  -293,  -293,  -293,  -293,  -293,  -293,     0,     0,     0,
       0,  -293,  -293,  -293,  -293,  -430,     0,  -293,  -293,  -293,
    -293,     0,     0,  -430,  -430,  -430,     0,     0,  -430,  -430,
    -430,     0,  -430,     0,     0,     0,     0,     0,     0,     0,
       0,  -430,  -430,  -430,     0,     0,     0,     0,     0,     0,
       0,     0,  -430,  -430,     0,  -430,  -430,  -430,  -430,  -430,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,  -430,  -430,  -430,  -430,  -430,  -430,  -430,
    -430,  -430,  -430,  -430,  -430,  -430,     0,     0,  -430,  -430,
    -430,     0,     0,  -430,     0,     0,     0,     0,     0,  -430,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,  -430,     0,     0,     0,     0,     0,  -430,
       0,  -430,  -430,  -430,  -430,  -430,  -430,  -430,  -430,  -430,
    -430,     0,     0,     0,  -430,  -430,  -430,  -430,  -430,  -285,
     227,  -430,  -430,  -430,  -430,     0,     0,  -285,  -285,  -285,
       0,     0,  -285,  -285,  -285,     0,  -285,     0,     0,     0,
       0,     0,     0,     0,     0,     0,  -285,  -285,  -285,     0,
       0,     0,     0,     0,     0,     0,  -285,  -285,     0,  -285,
    -285,  -285,  -285,  -285,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,  -285,  -285,  -285,
    -285,  -285,  -285,  -285,  -285,  -285,  -285,  -285,  -285,  -285,
       0,     0,  -285,  -285,  -285,     0,     0,  -285,     0,     0,
       0,     0,     0,  -285,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,  -285,     0,     0,
    -285,     0,     0,  -285,  -285,  -285,  -285,  -285,  -285,  -285,
    -285,  -285,  -285,  -285,  -285,     0,     0,     0,     0,  -285,
    -285,  -285,  -285,  -420,     0,  -285,  -285,  -285,  -285,     0,
       0,  -420,  -420,  -420,     0,     0,  -420,  -420,  -420,     0,
    -420,     0,     0,     0,     0,     0,     0,     0,     0,  -420,
    -420,  -420,     0,     0,     0,     0,     0,     0,     0,     0,
    -420,  -420,     0,  -420,  -420,  -420,  -420,  -420,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,  -420,  -420,  -420,  -420,  -420,  -420,  -420,  -420,  -420,
    -420,  -420,  -420,  -420,     0,     0,  -420,  -420,  -420,     0,
       0,  -420,     0,     0,     0,     0,     0,  -420,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,  -420,     0,     0,     0,     0,     0,  -420,     0,  -420,
    -420,  -420,  -420,  -420,  -420,  -420,  -420,  -420,  -420,     0,
       0,     0,  -420,  -420,  -420,  -420,  -420,  -300,  -420,  -420,
    -420,  -420,  -420,     0,     0,  -300,  -300,  -300,     0,     0,
    -300,  -300,  -300,     0,  -300,     0,     0,     0,     0,     0,
       0,     0,     0,     0,  -300,  -300,     0,     0,     0,     0,
       0,     0,     0,     0,  -300,  -300,     0,  -300,  -300,  -300,
    -300,  -300,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,  -300,  -300,  -300,  -300,  -300,
    -300,  -300,  -300,  -300,  -300,  -300,  -300,  -300,     0,     0,
    -300,  -300,  -300,     0,     0,  -300,     0,     0,     0,     0,
       0,  -300,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,  -300,     0,     0,     0,     0,
       0,  -300,     0,  -300,  -300,  -300,  -300,  -300,  -300,  -300,
    -300,  -300,  -300,     0,     0,     0,     0,  -300,  -300,  -300,
    -300,  -600,   224,  -300,  -300,  -300,  -300,     0,     0,  -600,
    -600,  -600,     0,     0,     0,  -600,  -600,     0,  -600,     0,
       0,     0,     0,     0,     0,     0,     0,  -600,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,  -600,  -600,
       0,  -600,  -600,  -600,  -600,  -600,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,  -600,
    -600,  -600,  -600,  -600,  -600,  -600,  -600,  -600,  -600,  -600,
    -600,  -600,     0,     0,  -600,  -600,  -600,     0,   700,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,  -600,
       0,     0,     0,     0,  -106,  -600,     0,  -600,  -600,  -600,
    -600,  -600,  -600,  -600,  -600,  -600,  -600,     0,     0,     0,
    -600,  -600,  -600,  -600,   -97,  -293,     0,  -600,     0,  -600,
    -600,     0,     0,  -293,  -293,  -293,     0,     0,     0,  -293,
    -293,     0,  -293,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,  -293,  -293,     0,  -293,  -293,  -293,  -293,  -293,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,  -293,  -293,  -293,  -293,  -293,  -293,  -293,
    -293,  -293,  -293,  -293,  -293,  -293,     0,     0,  -293,  -293,
    -293,     0,   701,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,  -293,     0,     0,     0,     0,  -108,  -293,
       0,  -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,  -293,
    -293,     0,     0,     0,     0,  -293,  -293,  -293,   -99,     0,
       0,  -293,     0,  -293,  -293,   248,     0,     5,     6,     7,
       8,     9,  -618,  -618,  -618,    10,    11,     0,     0,  -618,
      12,     0,    13,    14,    15,    16,    17,    18,    19,     0,
       0,     0,     0,     0,    20,    21,    22,    23,    24,    25,
      26,     0,     0,    27,     0,     0,     0,     0,     0,    28,
      29,   249,    31,    32,    33,    34,    35,    36,    37,    38,
      39,    40,     0,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
      48,     0,     0,    49,    50,     0,    51,    52,     0,    53,
       0,     0,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
      63,    64,    65,     0,     0,   248,     0,     5,     6,     7,
       8,     9,  -618,  -618,  -618,    10,    11,     0,  -618,  -618,
      12,     0,    13,    14,    15,    16,    17,    18,    19,     0,
       0,     0,     0,     0,    20,    21,    22,    23,    24,    25,
      26,     0,     0,    27,     0,     0,     0,     0,     0,    28,
      29,   249,    31,    32,    33,    34,    35,    36,    37,    38,
      39,    40,     0,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
      48,     0,     0,    49,    50,     0,    51,    52,     0,    53,
       0,     0,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
      63,    64,    65,     0,     0,   248,     0,     5,     6,     7,
       8,     9,  -618,  -618,  -618,    10,    11,     0,     0,  -618,
      12,  -618,    13,    14,    15,    16,    17,    18,    19,     0,
       0,     0,     0,     0,    20,    21,    22,    23,    24,    25,
      26,     0,     0,    27,     0,     0,     0,     0,     0,    28,
      29,   249,    31,    32,    33,    34,    35,    36,    37,    38,
      39,    40,     0,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
      48,     0,     0,    49,    50,     0,    51,    52,     0,    53,
       0,     0,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
      63,    64,    65,     0,     0,   248,     0,     5,     6,     7,
       8,     9,  -618,  -618,  -618,    10,    11,     0,     0,  -618,
      12,     0,    13,    14,    15,    16,    17,    18,    19,     0,
       0,     0,     0,     0,    20,    21,    22,    23,    24,    25,
      26,     0,     0,    27,     0,     0,     0,     0,     0,    28,
      29,   249,    31,    32,    33,    34,    35,    36,    37,    38,
      39,    40,     0,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
      48,     0,     0,    49,    50,     0,    51,    52,     0,    53,
       0,     0,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     0,     0,   248,     0,
       5,     6,     7,     8,     9,     0,  -618,  -618,    10,    11,
      63,    64,    65,    12,     0,    13,    14,    15,    16,    17,
      18,    19,  -618,  -618,     0,     0,     0,    20,    21,    22,
      23,    24,    25,    26,     0,     0,    27,     0,     0,     0,
       0,     0,    28,    29,   249,    31,    32,    33,    34,    35,
      36,    37,    38,    39,    40,     0,    41,    42,     0,    43,
      44,    45,     0,    46,    47,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,    48,     0,     0,    49,    50,     0,    51,
      52,     0,    53,     0,     0,    54,    55,    56,    57,    58,
      59,    60,    61,    62,     0,     0,     0,     0,     0,     0,
       0,   248,     0,     5,     6,     7,     8,     9,     0,     0,
       0,    10,    11,    63,    64,    65,    12,     0,    13,    14,
      15,    16,    17,    18,    19,  -618,  -618,     0,     0,     0,
      20,    21,    22,    23,    24,    25,    26,     0,     0,    27,
       0,     0,     0,     0,     0,    28,    29,   249,    31,    32,
      33,    34,    35,    36,    37,    38,    39,    40,     0,    41,
      42,     0,    43,    44,    45,     0,    46,    47,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,    48,     0,     0,   250,
      50,     0,    51,    52,     0,    53,     0,     0,    54,    55,
      56,    57,    58,    59,    60,    61,    62,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,    63,    64,    65,     0,
       0,     0,     0,     0,     0,     0,  -618,     0,  -618,  -618,
     248,     0,     5,     6,     7,     8,     9,     0,     0,     0,
      10,    11,     0,     0,     0,    12,     0,    13,    14,    15,
      16,    17,    18,    19,     0,     0,     0,     0,     0,    20,
      21,    22,    23,    24,    25,    26,     0,     0,    27,     0,
       0,     0,     0,     0,    28,    29,   249,    31,    32,    33,
      34,    35,    36,    37,    38,    39,    40,     0,    41,    42,
       0,    43,    44,    45,     0,    46,    47,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,    48,     0,     0,    49,    50,
       0,    51,    52,     0,    53,     0,     0,    54,    55,    56,
      57,    58,    59,    60,    61,    62,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,    63,    64,    65,     0,     0,
       0,     0,     0,     0,     0,  -618,     0,  -618,  -618,   248,
       0,     5,     6,     7,     8,     9,     0,     0,     0,    10,
      11,     0,     0,     0,    12,     0,    13,    14,    15,    16,
      17,    18,    19,     0,     0,     0,     0,     0,    20,    21,
      22,    23,    24,    25,    26,     0,     0,    27,     0,     0,
       0,     0,     0,    28,    29,   249,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    40,     0,    41,    42,     0,
      43,    44,    45,     0,    46,    47,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    48,     0,     0,    49,    50,     0,
      51,    52,     0,    53,     0,     0,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       0,     0,     4,     0,     5,     6,     7,     8,     9,     0,
       0,     0,    10,    11,    63,    64,    65,    12,  -618,    13,
      14,    15,    16,    17,    18,    19,  -618,  -618,     0,     0,
       0,    20,    21,    22,    23,    24,    25,    26,     0,     0,
      27,     0,     0,     0,     0,     0,    28,    29,    30,    31,
      32,    33,    34,    35,    36,    37,    38,    39,    40,     0,
      41,    42,     0,    43,    44,    45,     0,    46,    47,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,    48,     0,     0,
      49,    50,     0,    51,    52,     0,    53,     0,     0,    54,
      55,    56,    57,    58,    59,    60,    61,    62,     0,     0,
       0,     0,     0,     0,     0,   248,     0,     5,     6,     7,
       8,     9,     0,     0,  -618,    10,    11,    63,    64,    65,
      12,  -618,    13,    14,    15,    16,    17,    18,    19,  -618,
    -618,     0,     0,     0,    20,    21,    22,    23,    24,    25,
      26,     0,     0,    27,     0,     0,     0,     0,     0,    28,
      29,   249,    31,    32,    33,    34,    35,    36,    37,    38,
      39,    40,     0,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
      48,     0,     0,    49,    50,     0,    51,    52,     0,    53,
       0,     0,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     0,     0,   248,     0,
       5,     6,     7,     8,     9,     0,     0,     0,    10,    11,
      63,    64,    65,    12,     0,    13,    14,    15,    16,    17,
      18,    19,  -618,  -618,     0,     0,     0,    20,    21,    22,
      23,    24,    25,    26,     0,     0,    27,     0,     0,     0,
       0,     0,    28,    29,   249,    31,    32,    33,    34,    35,
      36,    37,    38,    39,    40,     0,    41,    42,     0,    43,
      44,    45,     0,    46,    47,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,    48,     0,     0,    49,    50,     0,    51,
      52,     0,    53,     0,     0,    54,    55,    56,    57,    58,
      59,    60,    61,    62,     0,  -618,     0,     0,     0,     0,
       0,     0,     0,     5,     6,     7,     0,     9,     0,     0,
       0,    10,    11,    63,    64,    65,    12,     0,    13,    14,
      15,    16,    17,    18,    19,  -618,  -618,     0,     0,     0,
      20,    21,    22,    23,    24,    25,    26,     0,     0,   200,
       0,     0,     0,     0,     0,     0,    29,     0,     0,    32,
      33,    34,    35,    36,    37,    38,    39,    40,   201,    41,
      42,     0,    43,    44,    45,     0,    46,    47,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   202,     0,     0,   203,
      50,     0,    51,    52,     0,   204,   205,   206,    54,    55,
      56,    57,    58,    59,    60,    61,    62,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     5,     6,     7,     0,
       9,     0,     0,     0,    10,    11,    63,   207,    65,    12,
       0,    13,    14,    15,    16,    17,    18,    19,     0,   231,
       0,     0,     0,    20,    21,    22,    23,    24,    25,    26,
       0,     0,    27,     0,     0,     0,     0,     0,     0,    29,
       0,     0,    32,    33,    34,    35,    36,    37,    38,    39,
      40,     0,    41,    42,     0,    43,    44,    45,     0,    46,
      47,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   202,
       0,     0,   203,    50,     0,    51,    52,     0,     0,     0,
       0,    54,    55,    56,    57,    58,    59,    60,    61,    62,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     5,
       6,     7,     0,     9,     0,     0,     0,    10,    11,    63,
      64,    65,    12,     0,    13,    14,    15,    16,    17,    18,
      19,   302,   303,     0,     0,     0,    20,    21,    22,    23,
      24,    25,    26,     0,     0,    27,     0,     0,     0,     0,
       0,     0,    29,     0,     0,    32,    33,    34,    35,    36,
      37,    38,    39,    40,     0,    41,    42,     0,    43,    44,
      45,     0,    46,    47,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   202,     0,     0,   203,    50,     0,    51,    52,
       0,     0,     0,     0,    54,    55,    56,    57,    58,    59,
      60,    61,    62,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     5,     6,     7,     8,     9,     0,     0,     0,
      10,    11,    63,    64,    65,    12,     0,    13,    14,    15,
      16,    17,    18,    19,     0,   231,     0,     0,     0,    20,
      21,    22,    23,    24,    25,    26,     0,     0,    27,     0,
       0,     0,     0,     0,    28,    29,    30,    31,    32,    33,
      34,    35,    36,    37,    38,    39,    40,     0,    41,    42,
       0,    43,    44,    45,     0,    46,    47,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,    48,     0,     0,    49,    50,
       0,    51,    52,     0,    53,     0,     0,    54,    55,    56,
      57,    58,    59,    60,    61,    62,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     5,     6,     7,     8,     9,
       0,     0,     0,    10,    11,    63,    64,    65,    12,     0,
      13,    14,    15,    16,    17,    18,    19,   498,     0,     0,
       0,     0,    20,    21,    22,    23,    24,    25,    26,     0,
       0,    27,     0,     0,     0,     0,     0,    28,    29,   249,
      31,    32,    33,    34,    35,    36,    37,    38,    39,    40,
       0,    41,    42,     0,    43,    44,    45,     0,    46,    47,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,    48,     0,
       0,    49,    50,     0,    51,    52,     0,    53,     0,     0,
      54,    55,    56,    57,    58,    59,    60,    61,    62,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,    63,    64,
      65,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     498,   118,   119,   120,   121,   122,   123,   124,   125,   126,
     127,   128,   129,   130,   131,   132,   133,   134,   135,   136,
     137,   138,   139,   140,   141,     0,     0,     0,   142,   143,
     144,   384,   385,   386,   387,   149,   150,   151,     0,     0,
       0,     0,     0,   152,   153,   154,   155,   388,   389,   390,
     391,   160,    37,    38,   392,    40,     0,     0,     0,     0,
       0,     0,     0,     0,   162,   163,   164,   165,   166,   167,
     168,   169,   170,     0,     0,   171,   172,     0,     0,   173,
     174,   175,   176,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   177,   178,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   179,   180,   181,   182,   183,   184,
     185,   186,   187,   188,     0,   189,   190,     0,     0,     0,
       0,     0,   191,   393,   118,   119,   120,   121,   122,   123,
     124,   125,   126,   127,   128,   129,   130,   131,   132,   133,
     134,   135,   136,   137,   138,   139,   140,   141,     0,     0,
       0,   142,   143,   144,   145,   146,   147,   148,   149,   150,
     151,     0,     0,     0,     0,     0,   152,   153,   154,   155,
     156,   157,   158,   159,   160,   280,   281,   161,   282,     0,
       0,     0,     0,     0,     0,     0,     0,   162,   163,   164,
     165,   166,   167,   168,   169,   170,     0,     0,   171,   172,
       0,     0,   173,   174,   175,   176,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   177,   178,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   179,   180,   181,
     182,   183,   184,   185,   186,   187,   188,     0,   189,   190,
       0,     0,     0,     0,     0,   191,   118,   119,   120,   121,
     122,   123,   124,   125,   126,   127,   128,   129,   130,   131,
     132,   133,   134,   135,   136,   137,   138,   139,   140,   141,
       0,     0,     0,   142,   143,   144,   145,   146,   147,   148,
     149,   150,   151,     0,     0,     0,     0,     0,   152,   153,
     154,   155,   156,   157,   158,   159,   160,   233,     0,   161,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   162,
     163,   164,   165,   166,   167,   168,   169,   170,     0,     0,
     171,   172,     0,     0,   173,   174,   175,   176,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   177,   178,
       0,     0,    55,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   179,
     180,   181,   182,   183,   184,   185,   186,   187,   188,     0,
     189,   190,     0,     0,     0,     0,     0,   191,   118,   119,
     120,   121,   122,   123,   124,   125,   126,   127,   128,   129,
     130,   131,   132,   133,   134,   135,   136,   137,   138,   139,
     140,   141,     0,     0,     0,   142,   143,   144,   145,   146,
     147,   148,   149,   150,   151,     0,     0,     0,     0,     0,
     152,   153,   154,   155,   156,   157,   158,   159,   160,     0,
       0,   161,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   162,   163,   164,   165,   166,   167,   168,   169,   170,
       0,     0,   171,   172,     0,     0,   173,   174,   175,   176,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     177,   178,     0,     0,    55,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   179,   180,   181,   182,   183,   184,   185,   186,   187,
     188,     0,   189,   190,     0,     0,     0,     0,     0,   191,
     118,   119,   120,   121,   122,   123,   124,   125,   126,   127,
     128,   129,   130,   131,   132,   133,   134,   135,   136,   137,
     138,   139,   140,   141,     0,     0,     0,   142,   143,   144,
     145,   146,   147,   148,   149,   150,   151,     0,     0,     0,
       0,     0,   152,   153,   154,   155,   156,   157,   158,   159,
     160,     0,     0,   161,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   162,   163,   164,   165,   166,   167,   168,
     169,   170,     0,     0,   171,   172,     0,     0,   173,   174,
     175,   176,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   177,   178,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   179,   180,   181,   182,   183,   184,   185,
     186,   187,   188,     0,   189,   190,     5,     6,     7,     0,
       9,   191,     0,     0,    10,    11,     0,     0,     0,    12,
       0,    13,    14,    15,   238,   239,    18,    19,     0,     0,
       0,     0,     0,   240,   241,   242,    23,    24,    25,    26,
       0,     0,   200,     0,     0,     0,     0,     0,     0,   268,
       0,     0,    32,    33,    34,    35,    36,    37,    38,    39,
      40,     0,    41,    42,     0,    43,    44,    45,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   269,
       0,     0,   203,    50,     0,    51,    52,     0,     0,     0,
       0,    54,    55,    56,    57,    58,    59,    60,    61,    62,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     5,     6,     7,     0,     9,     0,     0,   270,
      10,    11,     0,     0,     0,    12,   271,    13,    14,    15,
     238,   239,    18,    19,     0,     0,     0,     0,     0,   240,
     241,   242,    23,    24,    25,    26,     0,     0,   200,     0,
       0,     0,     0,     0,     0,   268,     0,     0,    32,    33,
      34,    35,    36,    37,    38,    39,    40,     0,    41,    42,
       0,    43,    44,    45,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   269,     0,     0,   203,    50,
       0,    51,    52,     0,     0,     0,     0,    54,    55,    56,
      57,    58,    59,    60,    61,    62,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     5,     6,
       7,     8,     9,     0,     0,   270,    10,    11,     0,     0,
       0,    12,   518,    13,    14,    15,    16,    17,    18,    19,
       0,     0,     0,     0,     0,    20,    21,    22,    23,    24,
      25,    26,     0,     0,    27,     0,     0,     0,     0,     0,
      28,    29,    30,    31,    32,    33,    34,    35,    36,    37,
      38,    39,    40,     0,    41,    42,     0,    43,    44,    45,
       0,    46,    47,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,    48,     0,     0,    49,    50,     0,    51,    52,     0,
      53,     0,     0,    54,    55,    56,    57,    58,    59,    60,
      61,    62,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     5,     6,     7,     0,     9,     0,     0,     0,    10,
      11,    63,    64,    65,    12,     0,    13,    14,    15,    16,
      17,    18,    19,     0,     0,     0,     0,     0,    20,    21,
      22,    23,    24,    25,    26,     0,     0,   200,     0,     0,
       0,     0,     0,     0,    29,     0,     0,    32,    33,    34,
      35,    36,    37,    38,    39,    40,   201,    41,    42,     0,
      43,    44,    45,     0,    46,    47,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   202,     0,     0,   203,    50,     0,
      51,    52,     0,   204,   205,   206,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     5,     6,     7,     8,     9,     0,
       0,     0,    10,    11,    63,   207,    65,    12,     0,    13,
      14,    15,    16,    17,    18,    19,     0,     0,     0,     0,
       0,    20,    21,    22,    23,    24,    25,    26,     0,     0,
      27,     0,     0,     0,     0,     0,    28,    29,     0,    31,
      32,    33,    34,    35,    36,    37,    38,    39,    40,     0,
      41,    42,     0,    43,    44,    45,     0,    46,    47,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,    48,     0,     0,
      49,    50,     0,    51,    52,     0,    53,     0,     0,    54,
      55,    56,    57,    58,    59,    60,    61,    62,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     5,     6,     7,
       0,     9,     0,     0,     0,    10,    11,    63,    64,    65,
      12,     0,    13,    14,    15,   238,   239,    18,    19,     0,
       0,     0,     0,     0,   240,   241,   242,    23,    24,    25,
      26,     0,     0,   200,     0,     0,     0,     0,     0,     0,
      29,     0,     0,    32,    33,    34,    35,    36,    37,    38,
      39,    40,   201,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     202,     0,     0,   203,    50,     0,    51,    52,     0,   608,
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
      52,     0,   204,   205,     0,    54,    55,    56,    57,    58,
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
      50,     0,    51,    52,     0,     0,   205,   206,    54,    55,
      56,    57,    58,    59,    60,    61,    62,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     5,     6,     7,     0,
       9,     0,     0,     0,    10,    11,    63,   207,    65,    12,
       0,    13,    14,    15,   238,   239,    18,    19,     0,     0,
       0,     0,     0,   240,   241,   242,    23,    24,    25,    26,
       0,     0,   200,     0,     0,     0,     0,     0,     0,    29,
       0,     0,    32,    33,    34,    35,    36,    37,    38,    39,
      40,   201,    41,    42,     0,    43,    44,    45,     0,    46,
      47,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   202,
       0,     0,   203,    50,     0,    51,    52,     0,   608,   205,
       0,    54,    55,    56,    57,    58,    59,    60,    61,    62,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     5,
       6,     7,     0,     9,     0,     0,     0,    10,    11,    63,
     207,    65,    12,     0,    13,    14,    15,   238,   239,    18,
      19,     0,     0,     0,     0,     0,   240,   241,   242,    23,
      24,    25,    26,     0,     0,   200,     0,     0,     0,     0,
       0,     0,    29,     0,     0,    32,    33,    34,    35,    36,
      37,    38,    39,    40,   201,    41,    42,     0,    43,    44,
      45,     0,    46,    47,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   202,     0,     0,   203,    50,     0,    51,    52,
       0,     0,   205,     0,    54,    55,    56,    57,    58,    59,
      60,    61,    62,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     5,     6,     7,     0,     9,     0,     0,     0,
      10,    11,    63,   207,    65,    12,     0,    13,    14,    15,
      16,    17,    18,    19,     0,     0,     0,     0,     0,    20,
      21,    22,    23,    24,    25,    26,     0,     0,   200,     0,
       0,     0,     0,     0,     0,    29,     0,     0,    32,    33,
      34,    35,    36,    37,    38,    39,    40,     0,    41,    42,
       0,    43,    44,    45,     0,    46,    47,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   202,     0,     0,   203,    50,
       0,    51,    52,     0,   512,     0,     0,    54,    55,    56,
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
       0,   203,    50,     0,    51,    52,     0,   204,     0,     0,
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
     818,     0,     0,    54,    55,    56,    57,    58,    59,    60,
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
      51,    52,     0,   512,     0,     0,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     5,     6,     7,     0,     9,     0,
       0,     0,    10,    11,    63,   207,    65,    12,     0,    13,
      14,    15,   238,   239,    18,    19,     0,     0,     0,     0,
       0,   240,   241,   242,    23,    24,    25,    26,     0,     0,
     200,     0,     0,     0,     0,     0,     0,    29,     0,     0,
      32,    33,    34,    35,    36,    37,    38,    39,    40,     0,
      41,    42,     0,    43,    44,    45,     0,    46,    47,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   202,     0,     0,
     203,    50,     0,    51,    52,     0,   608,     0,     0,    54,
      55,    56,    57,    58,    59,    60,    61,    62,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     5,     6,     7,
       0,     9,     0,     0,     0,    10,    11,    63,   207,    65,
      12,     0,    13,    14,    15,   238,   239,    18,    19,     0,
       0,     0,     0,     0,   240,   241,   242,    23,    24,    25,
      26,     0,     0,   200,     0,     0,     0,     0,     0,     0,
      29,     0,     0,    32,    33,    34,    35,    36,    37,    38,
      39,    40,     0,    41,    42,     0,    43,    44,    45,     0,
      46,    47,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     202,     0,     0,   203,    50,     0,    51,    52,     0,     0,
       0,     0,    54,    55,    56,    57,    58,    59,    60,    61,
      62,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       5,     6,     7,     0,     9,     0,     0,     0,    10,    11,
      63,   207,    65,    12,     0,    13,    14,    15,    16,    17,
      18,    19,     0,     0,     0,     0,     0,    20,    21,    22,
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
      15,    16,    17,    18,    19,     0,     0,     0,     0,     0,
      20,    21,    22,    23,    24,    25,    26,     0,     0,   200,
       0,     0,     0,     0,     0,     0,    29,     0,     0,    32,
      33,    34,    35,    36,    37,    38,    39,    40,     0,    41,
      42,     0,    43,    44,    45,     0,    46,    47,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   202,     0,     0,   203,
      50,     0,    51,    52,     0,     0,     0,     0,    54,    55,
      56,    57,    58,    59,    60,    61,    62,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     5,     6,     7,     0,
       9,     0,     0,     0,    10,    11,    63,   207,    65,    12,
       0,    13,    14,    15,   238,   239,    18,    19,     0,     0,
       0,     0,     0,   240,   241,   242,    23,    24,    25,    26,
       0,     0,   200,     0,     0,     0,     0,     0,     0,   268,
       0,     0,    32,    33,    34,    35,    36,    37,    38,    39,
      40,     0,    41,    42,     0,    43,    44,    45,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   269,
       0,     0,   323,    50,     0,    51,    52,     0,   324,     0,
       0,    54,    55,    56,    57,    58,    59,    60,    61,    62,
       0,     0,     0,     0,     0,     5,     6,     7,     0,     9,
       0,     0,     0,    10,    11,     0,     0,     0,    12,   270,
      13,    14,    15,   238,   239,    18,    19,     0,     0,     0,
       0,     0,   240,   241,   242,    23,    24,    25,    26,     0,
       0,   200,     0,     0,     0,     0,     0,     0,   268,     0,
       0,    32,    33,    34,    35,    36,    37,    38,    39,    40,
       0,    41,    42,     0,    43,    44,    45,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   365,     0,
       0,    49,    50,     0,    51,    52,     0,    53,     0,     0,
      54,    55,    56,    57,    58,    59,    60,    61,    62,     0,
       0,     0,     0,     0,     5,     6,     7,     0,     9,     0,
       0,     0,    10,    11,     0,     0,     0,    12,   270,    13,
      14,    15,   238,   239,    18,    19,     0,     0,     0,     0,
       0,   240,   241,   242,    23,    24,    25,    26,     0,     0,
     200,     0,     0,     0,     0,     0,     0,   268,     0,     0,
      32,    33,    34,   373,    36,    37,    38,   374,    40,     0,
      41,    42,     0,    43,    44,    45,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   375,     0,     0,   376,     0,     0,
     203,    50,     0,    51,    52,     0,     0,     0,     0,    54,
      55,    56,    57,    58,    59,    60,    61,    62,     0,     0,
       0,     0,     0,     5,     6,     7,     0,     9,     0,     0,
       0,    10,    11,     0,     0,     0,    12,   270,    13,    14,
      15,   238,   239,    18,    19,     0,     0,     0,     0,     0,
     240,   241,   242,    23,    24,    25,    26,     0,     0,   200,
       0,     0,     0,     0,     0,     0,   268,     0,     0,    32,
      33,    34,   373,    36,    37,    38,   374,    40,     0,    41,
      42,     0,    43,    44,    45,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   376,     0,     0,   203,
      50,     0,    51,    52,     0,     0,     0,     0,    54,    55,
      56,    57,    58,    59,    60,    61,    62,     0,     0,     0,
       0,     0,     5,     6,     7,     0,     9,     0,     0,     0,
      10,    11,     0,     0,     0,    12,   270,    13,    14,    15,
     238,   239,    18,    19,     0,     0,     0,     0,     0,   240,
     241,   242,    23,    24,    25,    26,     0,     0,   200,     0,
       0,     0,     0,     0,     0,   268,     0,     0,    32,    33,
      34,    35,    36,    37,    38,    39,    40,     0,    41,    42,
       0,    43,    44,    45,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   269,     0,     0,   323,    50,
       0,    51,    52,     0,     0,     0,     0,    54,    55,    56,
      57,    58,    59,    60,    61,    62,     0,     0,     0,     0,
       0,     5,     6,     7,     0,     9,     0,     0,     0,    10,
      11,     0,     0,     0,    12,   270,    13,    14,    15,   238,
     239,    18,    19,     0,     0,     0,     0,     0,   240,   241,
     242,    23,    24,    25,    26,     0,     0,   200,     0,     0,
       0,     0,     0,     0,   268,     0,     0,    32,    33,    34,
      35,    36,    37,    38,    39,    40,     0,    41,    42,     0,
      43,    44,    45,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   894,     0,     0,   203,    50,     0,
      51,    52,     0,     0,     0,     0,    54,    55,    56,    57,
      58,    59,    60,    61,    62,     0,     0,     0,     0,     0,
       5,     6,     7,     0,     9,     0,     0,     0,    10,    11,
       0,     0,     0,    12,   270,    13,    14,    15,   238,   239,
      18,    19,     0,     0,     0,     0,     0,   240,   241,   242,
      23,    24,    25,    26,     0,     0,   200,     0,     0,     0,
       0,     0,     0,   268,     0,     0,    32,    33,    34,    35,
      36,    37,    38,    39,    40,     0,    41,    42,     0,    43,
      44,    45,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   974,     0,     0,   203,    50,     0,    51,
      52,     0,     0,     0,     0,    54,    55,    56,    57,    58,
      59,    60,    61,    62,     0,     0,     0,     0,     0,     0,
     553,   554,     0,     0,   555,     0,     0,     0,     0,     0,
       0,     0,     0,   270,   162,   163,   164,   165,   166,   167,
     168,   169,   170,     0,     0,   171,   172,     0,     0,   173,
     174,   175,   176,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   177,   178,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   179,   180,   181,   182,   183,   184,
     185,   186,   187,   188,     0,   189,   190,   561,   562,     0,
       0,   563,   191,     0,     0,     0,     0,     0,     0,     0,
       0,   162,   163,   164,   165,   166,   167,   168,   169,   170,
       0,     0,   171,   172,     0,     0,   173,   174,   175,   176,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     177,   178,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   179,   180,   181,   182,   183,   184,   185,   186,   187,
     188,     0,   189,   190,   598,   562,     0,     0,   599,   191,
       0,     0,     0,     0,     0,     0,     0,     0,   162,   163,
     164,   165,   166,   167,   168,   169,   170,     0,     0,   171,
     172,     0,     0,   173,   174,   175,   176,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   177,   178,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   179,   180,
     181,   182,   183,   184,   185,   186,   187,   188,     0,   189,
     190,   612,   554,     0,     0,   613,   191,     0,     0,     0,
       0,     0,     0,     0,     0,   162,   163,   164,   165,   166,
     167,   168,   169,   170,     0,     0,   171,   172,     0,     0,
     173,   174,   175,   176,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   177,   178,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   179,   180,   181,   182,   183,
     184,   185,   186,   187,   188,     0,   189,   190,   615,   562,
       0,     0,   616,   191,     0,     0,     0,     0,     0,     0,
       0,     0,   162,   163,   164,   165,   166,   167,   168,   169,
     170,     0,     0,   171,   172,     0,     0,   173,   174,   175,
     176,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   177,   178,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   179,   180,   181,   182,   183,   184,   185,   186,
     187,   188,     0,   189,   190,   639,   554,     0,     0,   640,
     191,     0,     0,     0,     0,     0,     0,     0,     0,   162,
     163,   164,   165,   166,   167,   168,   169,   170,     0,     0,
     171,   172,     0,     0,   173,   174,   175,   176,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   177,   178,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   179,
     180,   181,   182,   183,   184,   185,   186,   187,   188,     0,
     189,   190,   642,   562,     0,     0,   643,   191,     0,     0,
       0,     0,     0,     0,     0,     0,   162,   163,   164,   165,
     166,   167,   168,   169,   170,     0,     0,   171,   172,     0,
       0,   173,   174,   175,   176,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   177,   178,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   179,   180,   181,   182,
     183,   184,   185,   186,   187,   188,     0,   189,   190,   727,
     554,     0,     0,   728,   191,     0,     0,     0,     0,     0,
       0,     0,     0,   162,   163,   164,   165,   166,   167,   168,
     169,   170,     0,     0,   171,   172,     0,     0,   173,   174,
     175,   176,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   177,   178,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   179,   180,   181,   182,   183,   184,   185,
     186,   187,   188,     0,   189,   190,   730,   562,     0,     0,
     731,   191,     0,     0,     0,     0,     0,     0,     0,     0,
     162,   163,   164,   165,   166,   167,   168,   169,   170,     0,
       0,   171,   172,     0,     0,   173,   174,   175,   176,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,   177,
     178,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     179,   180,   181,   182,   183,   184,   185,   186,   187,   188,
       0,   189,   190,   737,   554,     0,     0,   738,   191,     0,
       0,     0,     0,     0,     0,     0,     0,   162,   163,   164,
     165,   166,   167,   168,   169,   170,     0,     0,   171,   172,
       0,     0,   173,   174,   175,   176,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,   177,   178,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   179,   180,   181,
     182,   183,   184,   185,   186,   187,   188,     0,   189,   190,
    1000,   554,     0,     0,  1001,   191,     0,     0,     0,     0,
       0,     0,     0,     0,   162,   163,   164,   165,   166,   167,
     168,   169,   170,     0,     0,   171,   172,     0,     0,   173,
     174,   175,   176,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,   177,   178,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   179,   180,   181,   182,   183,   184,
     185,   186,   187,   188,     0,   189,   190,  1035,   554,     0,
       0,  1036,   191,     0,     0,     0,     0,     0,     0,     0,
       0,   162,   163,   164,   165,   166,   167,   168,   169,   170,
       0,     0,   171,   172,     0,     0,   173,   174,   175,   176,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     177,   178,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   179,   180,   181,   182,   183,   184,   185,   186,   187,
     188,     0,   189,   190,  1038,   562,     0,     0,  1039,   191,
       0,     0,     0,     0,     0,     0,     0,     0,   162,   163,
     164,   165,   166,   167,   168,   169,   170,     0,     0,   171,
     172,     0,     0,   173,   174,   175,   176,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   177,   178,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   179,   180,
     181,   182,   183,   184,   185,   186,   187,   188,     0,   189,
     190,     0,     0,     0,     0,     0,   191
    //[
  ];

  // YYCHECK.
  var yycheck_ = this.yycheck_ =
  [
    //]
         2,    96,    74,    55,    28,    67,    79,    50,   220,   230,
       8,   359,    27,   326,    29,     8,   326,    87,   354,   262,
      90,     8,   472,   266,   651,    16,    17,    22,    90,    20,
      28,   353,    53,   355,   255,    28,   614,     2,   259,     4,
     575,    28,    94,    86,    87,     4,   420,    90,   376,    51,
      52,     2,   594,     4,   440,   574,    67,   577,    79,    53,
     472,    90,   780,   641,   468,    16,    17,   788,    55,    20,
      91,    92,    93,   876,    16,    17,    49,   399,    20,    74,
     416,   715,    26,    64,   458,   719,    29,    25,   907,   668,
      13,    25,   412,   415,   250,   417,   776,    27,    49,    50,
     420,   874,    53,   508,   903,    85,   511,    94,    26,    51,
       0,   685,    87,    64,   518,   129,    61,    13,    16,    17,
      68,   443,    20,   803,    61,    97,    25,    76,    79,    87,
      87,   139,    13,    87,   470,    86,    87,    87,   113,    90,
      91,    92,    93,   770,   771,    85,   596,    25,   120,   471,
      56,   729,   132,    51,    52,   113,   113,    16,    17,   113,
      25,    20,   740,   113,    25,   110,   939,   323,   111,   118,
     286,   243,   288,   110,   290,   123,   124,   125,   294,    25,
     898,    37,    38,    85,    13,   129,    25,   230,   991,   232,
     252,   135,   132,  1012,   736,   133,    13,   135,   271,   133,
      25,   422,   744,  1002,   724,   426,   780,   657,   138,   139,
     431,   129,   214,    13,   788,   138,   139,   429,   220,   141,
     993,   741,   685,   252,   945,   227,   447,   141,   807,   808,
     132,   452,   950,   224,   133,   226,   227,   307,   308,   309,
     310,   252,   138,   139,   580,   657,   632,   874,   622,   876,
     271,  1024,   203,   268,   135,   133,   592,   138,   139,   581,
     670,   141,   672,   591,   307,   308,   309,   310,   133,   312,
     313,   593,   133,   224,   135,   226,   227,   250,    25,   230,
       1,   232,   224,   248,   226,   690,   237,   133,   113,  1007,
     360,   361,   696,   743,   133,   929,   517,   248,   141,   250,
     362,   621,   622,   324,   133,    59,    60,   886,   133,   138,
     139,   136,   939,   940,   139,    28,   378,   360,   361,   782,
     271,   138,   139,   786,   898,   845,   224,   847,   226,   903,
     324,   743,   375,   362,    49,   854,    85,   857,   138,   139,
     321,   306,   862,   133,    61,   326,   311,   306,    65,   139,
     323,   113,   354,    25,    61,   306,   307,   308,   309,   310,
     311,   312,   313,   354,   991,   224,   993,   226,   355,   485,
     321,   945,   323,   324,   133,   326,   492,   725,    87,   321,
      37,    38,   131,   132,   326,   964,   133,   697,   113,   931,
     107,   113,   109,   636,   929,   468,   117,  1024,    26,   611,
     107,   714,   109,   354,   113,   356,   926,   927,    85,   360,
     361,   133,   399,   437,   416,   100,    85,   138,   139,    85,
      87,   402,   403,    85,   375,   416,   428,   429,  1002,    85,
     417,    26,   138,   139,   141,   898,   703,   900,   440,   437,
     903,   113,   905,   710,   437,   518,    61,   468,   990,   135,
     437,   402,   403,   139,   131,   132,   443,    85,   135,  1037,
     133,   133,   131,   132,   136,   416,   132,   139,   470,   989,
     132,    26,   135,   883,   884,   440,   132,    56,   888,   470,
     890,   891,   139,    61,   471,   557,   936,    87,   203,   440,
      85,    85,   107,   565,   109,   869,    85,   518,    88,   450,
    1020,   129,  1022,   131,   132,   507,   508,   135,    85,   511,
     133,   573,   574,   113,   412,    85,   139,   468,    85,   470,
     113,   742,   237,   133,    61,   587,   141,   542,   600,   107,
      85,   109,   110,   133,   129,   250,   131,   132,   132,  1002,
     761,  1004,   131,   132,  1007,   560,  1009,    61,   760,   869,
      85,   685,   595,   774,   131,   132,    52,   455,    54,    55,
      56,    57,   132,   558,   637,   132,   568,   518,    85,   917,
     107,   566,   109,   110,   129,   923,   131,   132,   580,    52,
     135,   605,   625,    56,  1047,   995,   996,   997,   998,   580,
     592,    59,    60,   107,   581,   109,   110,   132,   600,   614,
      85,   592,   685,    87,    85,   600,   593,   605,   323,   611,
      58,   133,   605,    85,   131,   132,   637,    58,   605,   570,
      68,   572,    85,   696,    14,    15,   641,    68,    26,   580,
     632,    85,   704,   135,   576,  1045,   133,   133,   129,   711,
     861,   592,   139,   594,   595,   135,   131,   132,    96,    97,
     131,   132,   873,   748,   788,    96,    97,   791,   135,   131,
     132,    85,   732,    68,   666,   735,   668,   632,   131,   132,
     685,   733,   120,   113,   625,   696,    87,   131,   132,   120,
    1016,   632,     2,   745,     4,    87,   637,    85,   690,   732,
     136,   130,   735,    61,   746,  1017,    16,    17,    68,   782,
      20,    52,   113,    54,    55,    56,    57,   131,   132,   711,
     137,   113,   714,   715,   729,   717,   697,   719,    85,   700,
     701,    56,   133,   621,   133,   740,   707,   708,   110,    49,
      50,   129,    85,   131,   132,   686,   110,   135,   689,   107,
     691,   109,   110,    68,    64,   696,   697,   110,   110,   700,
     701,   121,   122,   123,   124,   125,   707,   708,   760,   746,
      15,   776,    17,    87,   131,   132,    86,    87,    68,   903,
      90,   905,   714,    87,   844,    68,    94,    87,   131,   132,
     801,   732,   133,   133,   735,   736,    17,    61,   803,   113,
      83,    84,   854,   744,   856,    87,   138,    56,    87,   113,
      25,   844,   136,   113,   133,   807,   808,   133,   130,   133,
     129,   945,   133,   947,   141,   898,   133,   900,   952,   133,
     903,   113,   905,   133,   113,   141,   777,   778,   121,   122,
     123,   124,   125,   107,   133,   109,   110,   839,   133,   133,
     842,   133,    54,    55,   133,    57,   113,   810,   811,   830,
     801,    63,    64,   135,    10,   570,     8,   572,   130,    52,
      13,    54,    55,    56,    57,   816,   113,    54,  1002,   133,
    1004,   133,   893,    52,    52,  1009,    63,    64,    52,   830,
     133,   133,   133,   203,   886,    40,    41,    42,    43,    44,
     841,   133,  1026,   844,   115,   916,    89,   848,   849,   137,
      15,   852,    95,   133,   224,   133,   226,   227,   130,   113,
     230,   118,   232,  1047,   133,   133,   133,   237,   133,  1002,
      10,  1004,   138,    10,  1007,   130,  1009,   929,   248,    52,
     250,    54,    55,    56,    57,    52,   133,    54,    55,    56,
      57,   892,   893,    88,    52,     9,    54,    55,    56,    57,
     133,   136,    10,   130,    56,   970,   118,   133,   133,   130,
     133,    52,   964,   133,  1047,   916,    89,   133,   133,   920,
     108,   686,    95,   133,   689,   133,   691,    56,   135,   133,
     931,    89,   133,   133,   133,   133,   306,   307,   308,   309,
     310,   311,   312,   313,   135,   450,    91,    93,   961,   962,
     711,   321,   965,   323,   967,   968,   326,  1019,  1012,   770,
     685,   749,  1018,    99,  1016,   294,  1018,  1019,    57,    94,
     936,   900,  1037,    16,    17,  1016,   782,    20,   898,   980,
    1017,   982,   780,    -1,   354,   396,   356,   988,    -1,   990,
     360,   361,    -1,    -1,    52,    -1,    54,    55,    56,    57,
      58,    -1,    -1,    46,    47,   375,    -1,    -1,    51,    52,
      68,    -1,   777,   778,    -1,  1016,    -1,  1030,  1031,  1032,
    1033,    64,    65,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    89,   402,   403,    -1,    -1,    -1,    -1,    96,    97,
    1053,    -1,    -1,    -1,    -1,    -1,   416,    -1,    -1,    -1,
      -1,   816,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     201,    -1,   120,   204,   205,   206,    -1,    -1,    -1,    -1,
     440,    -1,    -1,    -1,    -1,    -1,   841,    -1,    -1,    -1,
     450,    -1,    -1,   848,   849,    -1,    -1,   852,    52,    -1,
      54,    55,    56,    57,    58,    -1,    -1,     0,    -1,    -1,
     470,    -1,    -1,    -1,    68,     8,     9,    10,    -1,    -1,
      13,    14,    15,    68,    17,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    26,    27,    89,    -1,   892,    83,    84,
      -1,    95,    96,    97,    37,    38,    -1,    40,    41,    42,
      43,    44,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   920,   120,    -1,   201,   123,
      -1,   204,   205,   206,   207,   120,   121,   122,   123,   124,
     125,    -1,    -1,    -1,    -1,   139,    -1,    -1,    -1,    -1,
     321,   224,    85,   226,   227,   326,    -1,    -1,    -1,    -1,
      -1,    68,    -1,    52,    -1,    54,    55,    56,    57,    58,
     570,    -1,   572,    -1,    -1,   108,    83,    84,    -1,    68,
     580,    -1,    -1,    -1,    -1,   980,    -1,   982,    -1,    -1,
      -1,    -1,   592,   988,   594,   595,   129,   130,    -1,   132,
      89,    -1,   135,   136,    -1,   138,   139,    96,    97,    -1,
      -1,   118,   119,   120,   121,   122,   123,   124,   125,    -1,
      -1,    -1,    -1,    -1,    -1,   625,    -1,    -1,    -1,    -1,
      -1,   120,   632,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     411,   412,    -1,    -1,    -1,    -1,    -1,    -1,   321,   420,
      -1,    -1,    -1,   326,   327,   328,   329,   330,   331,   332,
     333,   334,   335,   336,   337,   338,   339,   340,   341,   342,
     343,   344,   345,   346,   347,   348,   349,   350,   351,   352,
      -1,   354,    -1,    -1,   455,    -1,   686,   458,    -1,   689,
      -1,   691,    -1,    -1,    -1,    -1,    -1,   697,    -1,    -1,
     700,   701,    -1,    -1,    -1,    -1,    -1,   707,   708,    -1,
       2,    -1,     4,    -1,    -1,    52,    -1,    54,    55,    56,
      57,    58,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   402,
     403,    68,   732,    -1,    -1,   735,   736,   410,   411,   412,
      -1,   512,    -1,   416,   744,   418,   419,   420,    -1,    -1,
      -1,    -1,    89,    -1,    -1,    -1,    -1,    49,    95,    96,
      97,    53,    -1,    -1,    -1,    -1,   439,    -1,    -1,    -1,
      -1,   444,    -1,    -1,    -1,    -1,    -1,   777,   778,    -1,
      -1,    -1,   455,   120,    -1,   458,   123,    79,    52,    -1,
      54,    55,    56,    57,    58,    -1,    -1,   470,   135,    91,
      92,    93,    94,    -1,    68,   576,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   816,    -1,    -1,    -1,
      -1,    -1,    -1,   496,   497,    89,    -1,    -1,    -1,    -1,
     830,    95,    96,    97,    -1,    -1,    -1,   608,    -1,   512,
      -1,   841,    -1,    -1,   844,    -1,    -1,    -1,   848,   849,
     621,   622,   852,    -1,    -1,    -1,   120,    -1,    -1,   123,
      -1,     2,    -1,     4,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   135,    -1,    -1,    -1,    -1,    -1,    -1,   649,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,   892,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   576,    -1,    -1,    -1,   580,    49,    -1,
      -1,   203,    53,    -1,    -1,    -1,    -1,    -1,    -1,   592,
     920,    -1,   693,    52,    -1,    54,    55,    56,    57,    58,
      -1,   931,    -1,    -1,    -1,   608,    -1,    -1,    79,    68,
      -1,    -1,    -1,   714,    -1,   237,    -1,    -1,   621,   622,
      91,    92,    93,    94,    -1,    -1,   248,    -1,   250,    -1,
      89,    -1,    -1,    -1,    -1,    -1,    95,    96,    97,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   649,    -1,    -1,   271,
     980,    -1,   982,    -1,    -1,    -1,    -1,    -1,   988,    -1,
     990,   120,    -1,    -1,   123,    -1,   767,    -1,    -1,    52,
      -1,    54,    55,    56,    57,    58,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   306,    68,  1016,    -1,    -1,   311,
     693,    -1,    -1,    -1,   697,   698,    -1,   700,   701,    -1,
      -1,   323,   324,    -1,   707,   708,    89,    -1,    -1,    -1,
      -1,   714,    95,    96,    97,    -1,     2,   818,     4,    -1,
      -1,    -1,    -1,    -1,    -1,     2,    -1,     4,    -1,    -1,
      -1,    -1,   203,    -1,   356,    -1,    -1,   120,    -1,    -1,
     123,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   751,    -1,
     851,    -1,   755,   756,    -1,   758,   759,    -1,    -1,    -1,
      -1,    -1,    -1,    49,   767,    -1,   237,    53,   869,    -1,
      -1,    -1,    49,    -1,    -1,    -1,    -1,   248,    -1,   250,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    79,    -1,    -1,    -1,    -1,    -1,    -1,
     271,    -1,    -1,    -1,    -1,    91,    92,    93,    -1,    -1,
      -1,    -1,    -1,    -1,    91,   818,    -1,    -1,   440,   822,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   830,   450,    -1,
      -1,    -1,    -1,    -1,    -1,   306,    -1,    -1,    -1,    -1,
     311,    -1,    -1,    -1,    -1,    -1,   468,    -1,   851,    -1,
      -1,    -1,   323,   324,    68,    69,    70,    71,    72,    73,
      74,    75,    -1,    77,    78,   868,   869,    -1,    -1,    83,
      84,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   356,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,     2,    -1,     4,   518,    -1,    -1,    -1,
      -1,    -1,   116,   117,   118,   119,   120,   121,   122,   123,
     124,   125,    -1,    -1,    -1,    -1,    -1,   203,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   203,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      49,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   570,    -1,
     572,   237,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     237,    -1,   248,    -1,   250,    -1,    -1,    -1,    -1,   440,
      -1,   248,   594,   250,    -1,    -1,    -1,    -1,    -1,   450,
      -1,    -1,    -1,    -1,    -1,   271,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   468,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     632,    -1,    -1,  1016,    -1,   637,    -1,    -1,    -1,    -1,
     306,    -1,    -1,    -1,    -1,   311,    -1,    -1,    -1,   306,
      -1,    -1,    -1,    -1,   311,    -1,    -1,   323,   324,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   323,   518,    -1,   326,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    44,    -1,    -1,
      -1,    -1,    -1,    -1,   686,    -1,    -1,   689,    -1,   691,
     356,    -1,    -1,    -1,   696,    -1,    -1,    -1,    -1,   356,
      -1,    68,    69,    70,    71,    72,    73,    74,    75,    76,
      77,    78,    79,    80,   203,    -1,    83,    84,    -1,   570,
      -1,   572,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   736,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,   744,   594,    -1,    -1,    -1,   114,   237,   116,
     117,   118,   119,   120,   121,   122,   123,   124,   125,   248,
      -1,   250,    -1,    -1,    -1,    -1,   133,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   440,   777,   778,    -1,    -1,    -1,
      -1,   632,    -1,   440,   450,    -1,   637,    -1,    -1,    -1,
      -1,    -1,    -1,   450,    -1,    -1,    -1,    -1,    -1,   801,
      -1,    -1,   468,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   816,    -1,    -1,   306,    -1,    -1,
      -1,    -1,   311,    -1,    -1,    -1,    -1,    68,    69,    70,
      71,    72,    73,    74,   323,   686,    77,    78,   689,   841,
     691,    -1,    83,    84,    -1,   696,   848,   849,    -1,    -1,
     852,    -1,   518,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   356,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   116,   117,   118,   119,   120,
     121,   122,   123,   124,   125,   736,    -1,    -1,    -1,    -1,
     892,   893,    -1,   744,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   570,    -1,   572,    -1,    -1,    -1,
      -1,    -1,    -1,   570,   916,   572,    -1,    -1,   920,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   777,   778,   594,   931,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   594,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     801,   440,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   450,    -1,    -1,    -1,   816,   632,    -1,    -1,    -1,
      -1,   637,    -1,    -1,    -1,   632,    -1,    -1,   980,    -1,
     982,    -1,    -1,    -1,    -1,    -1,   988,    -1,   990,    -1,
     841,    -1,    -1,    -1,    -1,    -1,    -1,   848,   849,    -1,
      -1,   852,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     676,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    44,
     686,    -1,    -1,   689,    -1,   691,    -1,    -1,    -1,   686,
     696,    -1,   689,    -1,   691,    -1,    -1,    -1,    -1,    -1,
     697,   892,   893,    68,    69,    70,    71,    72,    73,    74,
      75,    76,    77,    78,    79,    80,    -1,    -1,    83,    84,
      -1,    -1,    -1,    -1,    -1,   916,    -1,    -1,    -1,   920,
     736,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   744,   736,
     931,   570,    -1,   572,    -1,    -1,    -1,   744,    -1,   114,
      -1,   116,   117,   118,   119,   120,   121,   122,   123,   124,
     125,    -1,    -1,    -1,    -1,   594,    -1,    -1,    -1,    -1,
      -1,   777,   778,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     777,   778,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   980,
      -1,   982,    -1,    -1,    -1,   801,    -1,   988,    44,   990,
      -1,    -1,    -1,   632,    -1,    -1,    -1,    -1,    -1,    -1,
     816,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   816,
      -1,    -1,    68,    69,    70,    71,    72,    73,    74,    75,
      76,    77,    78,    79,    80,   841,    -1,    83,    84,    -1,
      -1,    -1,   848,   849,   841,    -1,   852,    -1,    -1,    -1,
      -1,   848,   849,    -1,    -1,   852,    -1,   686,    -1,    -1,
     689,    -1,   691,    -1,    -1,    -1,    -1,    -1,   114,    -1,
     116,   117,   118,   119,   120,   121,   122,   123,   124,   125,
      -1,    -1,    -1,    -1,    -1,    -1,   892,   893,    68,    69,
      70,    71,    72,    73,    74,   892,    -1,    77,    78,    -1,
      -1,    -1,    -1,    83,    84,    -1,    -1,   736,    -1,    -1,
     916,    -1,    -1,    -1,   920,   744,    -1,    -1,    -1,   916,
      -1,    -1,    -1,   920,    -1,   931,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   931,    -1,   116,   117,   118,   119,
     120,   121,   122,   123,   124,   125,    -1,    -1,   777,   778,
      68,    69,    70,    71,    72,    73,    74,    75,    76,    77,
      78,    79,    80,    -1,    -1,    83,    84,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   980,    -1,   982,    -1,    -1,    -1,
      -1,    -1,   988,   980,   990,   982,    -1,   816,    -1,    -1,
      -1,   988,    -1,   990,    -1,    -1,   114,    -1,   116,   117,
     118,   119,   120,   121,   122,   123,   124,   125,    -1,    -1,
      -1,    -1,   841,    -1,    -1,    -1,    -1,    -1,    -1,   848,
     849,   139,    -1,   852,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   892,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,     0,     1,    -1,     3,     4,     5,
       6,     7,    -1,    -1,    -1,    11,    12,    -1,    -1,    -1,
      16,   920,    18,    19,    20,    21,    22,    23,    24,    -1,
      -1,    -1,   931,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    45,
      46,    47,    48,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    -1,    59,    60,    -1,    62,    63,    64,    -1,
      66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   980,    -1,   982,    -1,    -1,    -1,    -1,    -1,   988,
      86,   990,    -1,    89,    90,    -1,    92,    93,    -1,    95,
      -1,    -1,    98,    99,   100,   101,   102,   103,   104,   105,
     106,     0,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     8,
       9,    10,    -1,    -1,    13,    14,    15,    -1,    17,    -1,
     126,   127,   128,    -1,    -1,    -1,    -1,    26,    27,    28,
      29,    -1,   138,   139,    -1,    -1,    -1,    -1,    37,    38,
      -1,    40,    41,    42,    43,    44,    -1,    -1,    68,    69,
      70,    71,    72,    73,    74,    75,    76,    77,    78,    79,
      80,    -1,    -1,    83,    84,    -1,    -1,    -1,    -1,    68,
      69,    70,    71,    72,    73,    74,    75,    76,    77,    78,
      79,    80,    -1,    -1,    83,    84,    85,    -1,    87,    88,
      -1,    -1,    -1,    -1,   114,    94,   116,   117,   118,   119,
     120,   121,   122,   123,   124,   125,    -1,    -1,    -1,   108,
      -1,    -1,   111,    -1,   113,   114,   115,   116,   117,   118,
     119,   120,   121,   122,   123,   124,   125,    -1,    -1,    -1,
     129,   130,   131,   132,   133,     0,    -1,   136,   137,   138,
     139,    -1,    -1,     8,     9,    10,    -1,    -1,    13,    14,
      15,    -1,    17,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      25,    -1,    27,    28,    29,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    37,    38,    -1,    40,    41,    42,    43,    44,
      -1,    -1,    68,    69,    70,    71,    72,    73,    74,    75,
      76,    77,    78,    79,    80,    -1,    -1,    83,    84,    -1,
      -1,    -1,    -1,    68,    69,    70,    71,    72,    73,    74,
      75,    76,    77,    78,    79,    80,    -1,    -1,    83,    84,
      85,    -1,    87,    88,    -1,    -1,    -1,    -1,    -1,    94,
     116,   117,   118,   119,   120,   121,   122,   123,   124,   125,
      -1,    -1,    -1,   108,    -1,    -1,   111,    -1,   113,   114,
     115,   116,   117,   118,   119,   120,   121,   122,   123,   124,
     125,    -1,    -1,    -1,    -1,   130,   131,   132,   133,     0,
      -1,   136,   137,   138,   139,    -1,    -1,     8,     9,    10,
      -1,    -1,    13,    14,    15,    -1,    17,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    25,    -1,    27,    28,    29,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    37,    38,    -1,    40,
      41,    42,    43,    44,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    68,    69,    70,
      71,    72,    73,    74,    75,    76,    77,    78,    79,    80,
      -1,    -1,    83,    84,    85,    -1,    87,    88,    -1,    -1,
      -1,    -1,    -1,    94,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   108,    -1,    -1,
     111,    -1,   113,   114,   115,   116,   117,   118,   119,   120,
     121,   122,   123,   124,   125,    -1,    -1,    -1,    -1,   130,
     131,   132,   133,     0,    -1,   136,   137,   138,   139,    -1,
      -1,     8,     9,    10,    -1,    -1,    13,    14,    15,    -1,
      17,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    26,
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
      -1,    -1,   129,   130,   131,   132,   133,     0,    -1,   136,
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
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    27,    28,
      29,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    37,    38,
      -1,    40,    41,    42,    43,    44,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    68,
      69,    70,    71,    72,    73,    74,    75,    76,    77,    78,
      79,    80,    -1,    -1,    83,    84,    85,    -1,    87,    88,
      -1,    -1,    -1,    -1,    -1,    94,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   108,
      -1,    -1,   111,    -1,   113,   114,   115,   116,   117,   118,
     119,   120,   121,   122,   123,   124,   125,    -1,    -1,    -1,
      -1,   130,   131,   132,   133,     0,    -1,   136,   137,   138,
     139,    -1,    -1,     8,     9,    10,    -1,    -1,    13,    14,
      15,    -1,    17,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    26,    27,    28,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    37,    38,    -1,    40,    41,    42,    43,    44,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    68,    69,    70,    71,    72,    73,    74,
      75,    76,    77,    78,    79,    80,    -1,    -1,    83,    84,
      85,    -1,    -1,    88,    -1,    -1,    -1,    -1,    -1,    94,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   108,    -1,    -1,    -1,    -1,    -1,   114,
      -1,   116,   117,   118,   119,   120,   121,   122,   123,   124,
     125,    -1,    -1,    -1,   129,   130,   131,   132,   133,     0,
     135,   136,   137,   138,   139,    -1,    -1,     8,     9,    10,
      -1,    -1,    13,    14,    15,    -1,    17,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    27,    28,    29,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    37,    38,    -1,    40,
      41,    42,    43,    44,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    68,    69,    70,
      71,    72,    73,    74,    75,    76,    77,    78,    79,    80,
      -1,    -1,    83,    84,    85,    -1,    -1,    88,    -1,    -1,
      -1,    -1,    -1,    94,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   108,    -1,    -1,
     111,    -1,    -1,   114,   115,   116,   117,   118,   119,   120,
     121,   122,   123,   124,   125,    -1,    -1,    -1,    -1,   130,
     131,   132,   133,     0,    -1,   136,   137,   138,   139,    -1,
      -1,     8,     9,    10,    -1,    -1,    13,    14,    15,    -1,
      17,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    26,
      27,    28,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      37,    38,    -1,    40,    41,    42,    43,    44,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    68,    69,    70,    71,    72,    73,    74,    75,    76,
      77,    78,    79,    80,    -1,    -1,    83,    84,    85,    -1,
      -1,    88,    -1,    -1,    -1,    -1,    -1,    94,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   108,    -1,    -1,    -1,    -1,    -1,   114,    -1,   116,
     117,   118,   119,   120,   121,   122,   123,   124,   125,    -1,
      -1,    -1,   129,   130,   131,   132,   133,     0,   135,   136,
     137,   138,   139,    -1,    -1,     8,     9,    10,    -1,    -1,
      13,    14,    15,    -1,    17,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    27,    28,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    37,    38,    -1,    40,    41,    42,
      43,    44,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    68,    69,    70,    71,    72,
      73,    74,    75,    76,    77,    78,    79,    80,    -1,    -1,
      83,    84,    85,    -1,    -1,    88,    -1,    -1,    -1,    -1,
      -1,    94,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   108,    -1,    -1,    -1,    -1,
      -1,   114,    -1,   116,   117,   118,   119,   120,   121,   122,
     123,   124,   125,    -1,    -1,    -1,    -1,   130,   131,   132,
     133,     0,   135,   136,   137,   138,   139,    -1,    -1,     8,
       9,    10,    -1,    -1,    -1,    14,    15,    -1,    17,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    26,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    37,    38,
      -1,    40,    41,    42,    43,    44,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    68,
      69,    70,    71,    72,    73,    74,    75,    76,    77,    78,
      79,    80,    -1,    -1,    83,    84,    85,    -1,    87,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   108,
      -1,    -1,    -1,    -1,   113,   114,    -1,   116,   117,   118,
     119,   120,   121,   122,   123,   124,   125,    -1,    -1,    -1,
     129,   130,   131,   132,   133,     0,    -1,   136,    -1,   138,
     139,    -1,    -1,     8,     9,    10,    -1,    -1,    -1,    14,
      15,    -1,    17,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    37,    38,    -1,    40,    41,    42,    43,    44,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    68,    69,    70,    71,    72,    73,    74,
      75,    76,    77,    78,    79,    80,    -1,    -1,    83,    84,
      85,    -1,    87,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   108,    -1,    -1,    -1,    -1,   113,   114,
      -1,   116,   117,   118,   119,   120,   121,   122,   123,   124,
     125,    -1,    -1,    -1,    -1,   130,   131,   132,   133,    -1,
      -1,   136,    -1,   138,   139,     1,    -1,     3,     4,     5,
       6,     7,     8,     9,    10,    11,    12,    -1,    -1,    15,
      16,    -1,    18,    19,    20,    21,    22,    23,    24,    -1,
      -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    45,
      46,    47,    48,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    -1,    59,    60,    -1,    62,    63,    64,    -1,
      66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,
      -1,    -1,    98,    99,   100,   101,   102,   103,   104,   105,
     106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     126,   127,   128,    -1,    -1,     1,    -1,     3,     4,     5,
       6,     7,   138,   139,    10,    11,    12,    -1,    14,    15,
      16,    -1,    18,    19,    20,    21,    22,    23,    24,    -1,
      -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    45,
      46,    47,    48,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    -1,    59,    60,    -1,    62,    63,    64,    -1,
      66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,
      -1,    -1,    98,    99,   100,   101,   102,   103,   104,   105,
     106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     126,   127,   128,    -1,    -1,     1,    -1,     3,     4,     5,
       6,     7,   138,   139,    10,    11,    12,    -1,    -1,    15,
      16,    17,    18,    19,    20,    21,    22,    23,    24,    -1,
      -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    45,
      46,    47,    48,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    -1,    59,    60,    -1,    62,    63,    64,    -1,
      66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,
      -1,    -1,    98,    99,   100,   101,   102,   103,   104,   105,
     106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     126,   127,   128,    -1,    -1,     1,    -1,     3,     4,     5,
       6,     7,   138,   139,    10,    11,    12,    -1,    -1,    15,
      16,    -1,    18,    19,    20,    21,    22,    23,    24,    -1,
      -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    45,
      46,    47,    48,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    -1,    59,    60,    -1,    62,    63,    64,    -1,
      66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,
      -1,    -1,    98,    99,   100,   101,   102,   103,   104,   105,
     106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     1,    -1,
       3,     4,     5,     6,     7,    -1,     9,    10,    11,    12,
     126,   127,   128,    16,    -1,    18,    19,    20,    21,    22,
      23,    24,   138,   139,    -1,    -1,    -1,    30,    31,    32,
      33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,
      -1,    -1,    45,    46,    47,    48,    49,    50,    51,    52,
      53,    54,    55,    56,    57,    -1,    59,    60,    -1,    62,
      63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,
      93,    -1,    95,    -1,    -1,    98,    99,   100,   101,   102,
     103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,     1,    -1,     3,     4,     5,     6,     7,    -1,    -1,
      -1,    11,    12,   126,   127,   128,    16,    -1,    18,    19,
      20,    21,    22,    23,    24,   138,   139,    -1,    -1,    -1,
      30,    31,    32,    33,    34,    35,    36,    -1,    -1,    39,
      -1,    -1,    -1,    -1,    -1,    45,    46,    47,    48,    49,
      50,    51,    52,    53,    54,    55,    56,    57,    -1,    59,
      60,    -1,    62,    63,    64,    -1,    66,    67,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,
      90,    -1,    92,    93,    -1,    95,    -1,    -1,    98,    99,
     100,   101,   102,   103,   104,   105,   106,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   126,   127,   128,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   136,    -1,   138,   139,
       1,    -1,     3,     4,     5,     6,     7,    -1,    -1,    -1,
      11,    12,    -1,    -1,    -1,    16,    -1,    18,    19,    20,
      21,    22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,
      31,    32,    33,    34,    35,    36,    -1,    -1,    39,    -1,
      -1,    -1,    -1,    -1,    45,    46,    47,    48,    49,    50,
      51,    52,    53,    54,    55,    56,    57,    -1,    59,    60,
      -1,    62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,
      -1,    92,    93,    -1,    95,    -1,    -1,    98,    99,   100,
     101,   102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   126,   127,   128,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   136,    -1,   138,   139,     1,
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
     102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,     1,    -1,     3,     4,     5,     6,     7,    -1,
      -1,    -1,    11,    12,   126,   127,   128,    16,   130,    18,
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
       6,     7,    -1,    -1,    10,    11,    12,   126,   127,   128,
      16,   130,    18,    19,    20,    21,    22,    23,    24,   138,
     139,    -1,    -1,    -1,    30,    31,    32,    33,    34,    35,
      36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    45,
      46,    47,    48,    49,    50,    51,    52,    53,    54,    55,
      56,    57,    -1,    59,    60,    -1,    62,    63,    64,    -1,
      66,    67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,
      -1,    -1,    98,    99,   100,   101,   102,   103,   104,   105,
     106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     1,    -1,
       3,     4,     5,     6,     7,    -1,    -1,    -1,    11,    12,
     126,   127,   128,    16,    -1,    18,    19,    20,    21,    22,
      23,    24,   138,   139,    -1,    -1,    -1,    30,    31,    32,
      33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,
      -1,    -1,    45,    46,    47,    48,    49,    50,    51,    52,
      53,    54,    55,    56,    57,    -1,    59,    60,    -1,    62,
      63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,
      93,    -1,    95,    -1,    -1,    98,    99,   100,   101,   102,
     103,   104,   105,   106,    -1,   108,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,     3,     4,     5,    -1,     7,    -1,    -1,
      -1,    11,    12,   126,   127,   128,    16,    -1,    18,    19,
      20,    21,    22,    23,    24,   138,   139,    -1,    -1,    -1,
      30,    31,    32,    33,    34,    35,    36,    -1,    -1,    39,
      -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,    49,
      50,    51,    52,    53,    54,    55,    56,    57,    58,    59,
      60,    -1,    62,    63,    64,    -1,    66,    67,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,
      90,    -1,    92,    93,    -1,    95,    96,    97,    98,    99,
     100,   101,   102,   103,   104,   105,   106,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,    -1,
       7,    -1,    -1,    -1,    11,    12,   126,   127,   128,    16,
      -1,    18,    19,    20,    21,    22,    23,    24,    -1,   139,
      -1,    -1,    -1,    30,    31,    32,    33,    34,    35,    36,
      -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,    46,
      -1,    -1,    49,    50,    51,    52,    53,    54,    55,    56,
      57,    -1,    59,    60,    -1,    62,    63,    64,    -1,    66,
      67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,
      -1,    -1,    89,    90,    -1,    92,    93,    -1,    -1,    -1,
      -1,    98,    99,   100,   101,   102,   103,   104,   105,   106,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,
       4,     5,    -1,     7,    -1,    -1,    -1,    11,    12,   126,
     127,   128,    16,    -1,    18,    19,    20,    21,    22,    23,
      24,   138,   139,    -1,    -1,    -1,    30,    31,    32,    33,
      34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,    -1,
      -1,    -1,    46,    -1,    -1,    49,    50,    51,    52,    53,
      54,    55,    56,    57,    -1,    59,    60,    -1,    62,    63,
      64,    -1,    66,    67,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,    93,
      -1,    -1,    -1,    -1,    98,    99,   100,   101,   102,   103,
     104,   105,   106,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,     3,     4,     5,     6,     7,    -1,    -1,    -1,
      11,    12,   126,   127,   128,    16,    -1,    18,    19,    20,
      21,    22,    23,    24,    -1,   139,    -1,    -1,    -1,    30,
      31,    32,    33,    34,    35,    36,    -1,    -1,    39,    -1,
      -1,    -1,    -1,    -1,    45,    46,    47,    48,    49,    50,
      51,    52,    53,    54,    55,    56,    57,    -1,    59,    60,
      -1,    62,    63,    64,    -1,    66,    67,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,
      -1,    92,    93,    -1,    95,    -1,    -1,    98,    99,   100,
     101,   102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,     3,     4,     5,     6,     7,
      -1,    -1,    -1,    11,    12,   126,   127,   128,    16,    -1,
      18,    19,    20,    21,    22,    23,    24,   138,    -1,    -1,
      -1,    -1,    30,    31,    32,    33,    34,    35,    36,    -1,
      -1,    39,    -1,    -1,    -1,    -1,    -1,    45,    46,    47,
      48,    49,    50,    51,    52,    53,    54,    55,    56,    57,
      -1,    59,    60,    -1,    62,    63,    64,    -1,    66,    67,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,
      -1,    89,    90,    -1,    92,    93,    -1,    95,    -1,    -1,
      98,    99,   100,   101,   102,   103,   104,   105,   106,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   126,   127,
     128,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     138,     3,     4,     5,     6,     7,     8,     9,    10,    11,
      12,    13,    14,    15,    16,    17,    18,    19,    20,    21,
      22,    23,    24,    25,    26,    -1,    -1,    -1,    30,    31,
      32,    33,    34,    35,    36,    37,    38,    39,    -1,    -1,
      -1,    -1,    -1,    45,    46,    47,    48,    49,    50,    51,
      52,    53,    54,    55,    56,    57,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    66,    67,    68,    69,    70,    71,
      72,    73,    74,    -1,    -1,    77,    78,    -1,    -1,    81,
      82,    83,    84,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    95,    96,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   116,   117,   118,   119,   120,   121,
     122,   123,   124,   125,    -1,   127,   128,    -1,    -1,    -1,
      -1,    -1,   134,   135,     3,     4,     5,     6,     7,     8,
       9,    10,    11,    12,    13,    14,    15,    16,    17,    18,
      19,    20,    21,    22,    23,    24,    25,    26,    -1,    -1,
      -1,    30,    31,    32,    33,    34,    35,    36,    37,    38,
      39,    -1,    -1,    -1,    -1,    -1,    45,    46,    47,    48,
      49,    50,    51,    52,    53,    54,    55,    56,    57,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    66,    67,    68,
      69,    70,    71,    72,    73,    74,    -1,    -1,    77,    78,
      -1,    -1,    81,    82,    83,    84,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    95,    96,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   116,   117,   118,
     119,   120,   121,   122,   123,   124,   125,    -1,   127,   128,
      -1,    -1,    -1,    -1,    -1,   134,     3,     4,     5,     6,
       7,     8,     9,    10,    11,    12,    13,    14,    15,    16,
      17,    18,    19,    20,    21,    22,    23,    24,    25,    26,
      -1,    -1,    -1,    30,    31,    32,    33,    34,    35,    36,
      37,    38,    39,    -1,    -1,    -1,    -1,    -1,    45,    46,
      47,    48,    49,    50,    51,    52,    53,    54,    -1,    56,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    66,
      67,    68,    69,    70,    71,    72,    73,    74,    -1,    -1,
      77,    78,    -1,    -1,    81,    82,    83,    84,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    95,    96,
      -1,    -1,    99,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   116,
     117,   118,   119,   120,   121,   122,   123,   124,   125,    -1,
     127,   128,    -1,    -1,    -1,    -1,    -1,   134,     3,     4,
       5,     6,     7,     8,     9,    10,    11,    12,    13,    14,
      15,    16,    17,    18,    19,    20,    21,    22,    23,    24,
      25,    26,    -1,    -1,    -1,    30,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    -1,    -1,    -1,    -1,    -1,
      45,    46,    47,    48,    49,    50,    51,    52,    53,    -1,
      -1,    56,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    66,    67,    68,    69,    70,    71,    72,    73,    74,
      -1,    -1,    77,    78,    -1,    -1,    81,    82,    83,    84,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      95,    96,    -1,    -1,    99,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   116,   117,   118,   119,   120,   121,   122,   123,   124,
     125,    -1,   127,   128,    -1,    -1,    -1,    -1,    -1,   134,
       3,     4,     5,     6,     7,     8,     9,    10,    11,    12,
      13,    14,    15,    16,    17,    18,    19,    20,    21,    22,
      23,    24,    25,    26,    -1,    -1,    -1,    30,    31,    32,
      33,    34,    35,    36,    37,    38,    39,    -1,    -1,    -1,
      -1,    -1,    45,    46,    47,    48,    49,    50,    51,    52,
      53,    -1,    -1,    56,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    66,    67,    68,    69,    70,    71,    72,
      73,    74,    -1,    -1,    77,    78,    -1,    -1,    81,    82,
      83,    84,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    95,    96,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   116,   117,   118,   119,   120,   121,   122,
     123,   124,   125,    -1,   127,   128,     3,     4,     5,    -1,
       7,   134,    -1,    -1,    11,    12,    -1,    -1,    -1,    16,
      -1,    18,    19,    20,    21,    22,    23,    24,    -1,    -1,
      -1,    -1,    -1,    30,    31,    32,    33,    34,    35,    36,
      -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,    46,
      -1,    -1,    49,    50,    51,    52,    53,    54,    55,    56,
      57,    -1,    59,    60,    -1,    62,    63,    64,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,
      -1,    -1,    89,    90,    -1,    92,    93,    -1,    -1,    -1,
      -1,    98,    99,   100,   101,   102,   103,   104,   105,   106,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,     3,     4,     5,    -1,     7,    -1,    -1,   126,
      11,    12,    -1,    -1,    -1,    16,   133,    18,    19,    20,
      21,    22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,
      31,    32,    33,    34,    35,    36,    -1,    -1,    39,    -1,
      -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,    49,    50,
      51,    52,    53,    54,    55,    56,    57,    -1,    59,    60,
      -1,    62,    63,    64,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,
      -1,    92,    93,    -1,    -1,    -1,    -1,    98,    99,   100,
     101,   102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,     4,
       5,     6,     7,    -1,    -1,   126,    11,    12,    -1,    -1,
      -1,    16,   133,    18,    19,    20,    21,    22,    23,    24,
      -1,    -1,    -1,    -1,    -1,    30,    31,    32,    33,    34,
      35,    36,    -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,
      45,    46,    47,    48,    49,    50,    51,    52,    53,    54,
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
      -1,    -1,    -1,    -1,     3,     4,     5,     6,     7,    -1,
      -1,    -1,    11,    12,   126,   127,   128,    16,    -1,    18,
      19,    20,    21,    22,    23,    24,    -1,    -1,    -1,    -1,
      -1,    30,    31,    32,    33,    34,    35,    36,    -1,    -1,
      39,    -1,    -1,    -1,    -1,    -1,    45,    46,    -1,    48,
      49,    50,    51,    52,    53,    54,    55,    56,    57,    -1,
      59,    60,    -1,    62,    63,    64,    -1,    66,    67,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,
      89,    90,    -1,    92,    93,    -1,    95,    -1,    -1,    98,
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
      86,    -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,
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
      90,    -1,    92,    93,    -1,    -1,    96,    97,    98,    99,
     100,   101,   102,   103,   104,   105,   106,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,    -1,
       7,    -1,    -1,    -1,    11,    12,   126,   127,   128,    16,
      -1,    18,    19,    20,    21,    22,    23,    24,    -1,    -1,
      -1,    -1,    -1,    30,    31,    32,    33,    34,    35,    36,
      -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,    46,
      -1,    -1,    49,    50,    51,    52,    53,    54,    55,    56,
      57,    58,    59,    60,    -1,    62,    63,    64,    -1,    66,
      67,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,
      -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,    96,
      -1,    98,    99,   100,   101,   102,   103,   104,   105,   106,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,
       4,     5,    -1,     7,    -1,    -1,    -1,    11,    12,   126,
     127,   128,    16,    -1,    18,    19,    20,    21,    22,    23,
      24,    -1,    -1,    -1,    -1,    -1,    30,    31,    32,    33,
      34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,    -1,
      -1,    -1,    46,    -1,    -1,    49,    50,    51,    52,    53,
      54,    55,    56,    57,    58,    59,    60,    -1,    62,    63,
      64,    -1,    66,    67,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,    93,
      -1,    -1,    96,    -1,    98,    99,   100,   101,   102,   103,
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
      92,    93,    -1,    95,    -1,    -1,    98,    99,   100,   101,
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
      89,    90,    -1,    92,    93,    -1,    95,    -1,    -1,    98,
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
      63,    64,    -1,    66,    67,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,
      93,    -1,    -1,    -1,    -1,    98,    99,   100,   101,   102,
     103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,     3,     4,     5,    -1,     7,    -1,    -1,
      -1,    11,    12,   126,   127,   128,    16,    -1,    18,    19,
      20,    21,    22,    23,    24,    -1,    -1,    -1,    -1,    -1,
      30,    31,    32,    33,    34,    35,    36,    -1,    -1,    39,
      -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,    49,
      50,    51,    52,    53,    54,    55,    56,    57,    -1,    59,
      60,    -1,    62,    63,    64,    -1,    66,    67,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,
      90,    -1,    92,    93,    -1,    -1,    -1,    -1,    98,    99,
     100,   101,   102,   103,   104,   105,   106,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,     3,     4,     5,    -1,
       7,    -1,    -1,    -1,    11,    12,   126,   127,   128,    16,
      -1,    18,    19,    20,    21,    22,    23,    24,    -1,    -1,
      -1,    -1,    -1,    30,    31,    32,    33,    34,    35,    36,
      -1,    -1,    39,    -1,    -1,    -1,    -1,    -1,    -1,    46,
      -1,    -1,    49,    50,    51,    52,    53,    54,    55,    56,
      57,    -1,    59,    60,    -1,    62,    63,    64,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    86,
      -1,    -1,    89,    90,    -1,    92,    93,    -1,    95,    -1,
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
      -1,    89,    90,    -1,    92,    93,    -1,    95,    -1,    -1,
      98,    99,   100,   101,   102,   103,   104,   105,   106,    -1,
      -1,    -1,    -1,    -1,     3,     4,     5,    -1,     7,    -1,
      -1,    -1,    11,    12,    -1,    -1,    -1,    16,   126,    18,
      19,    20,    21,    22,    23,    24,    -1,    -1,    -1,    -1,
      -1,    30,    31,    32,    33,    34,    35,    36,    -1,    -1,
      39,    -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,
      49,    50,    51,    52,    53,    54,    55,    56,    57,    -1,
      59,    60,    -1,    62,    63,    64,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    83,    -1,    -1,    86,    -1,    -1,
      89,    90,    -1,    92,    93,    -1,    -1,    -1,    -1,    98,
      99,   100,   101,   102,   103,   104,   105,   106,    -1,    -1,
      -1,    -1,    -1,     3,     4,     5,    -1,     7,    -1,    -1,
      -1,    11,    12,    -1,    -1,    -1,    16,   126,    18,    19,
      20,    21,    22,    23,    24,    -1,    -1,    -1,    -1,    -1,
      30,    31,    32,    33,    34,    35,    36,    -1,    -1,    39,
      -1,    -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,    49,
      50,    51,    52,    53,    54,    55,    56,    57,    -1,    59,
      60,    -1,    62,    63,    64,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,
      90,    -1,    92,    93,    -1,    -1,    -1,    -1,    98,    99,
     100,   101,   102,   103,   104,   105,   106,    -1,    -1,    -1,
      -1,    -1,     3,     4,     5,    -1,     7,    -1,    -1,    -1,
      11,    12,    -1,    -1,    -1,    16,   126,    18,    19,    20,
      21,    22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,
      31,    32,    33,    34,    35,    36,    -1,    -1,    39,    -1,
      -1,    -1,    -1,    -1,    -1,    46,    -1,    -1,    49,    50,
      51,    52,    53,    54,    55,    56,    57,    -1,    59,    60,
      -1,    62,    63,    64,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,
      -1,    92,    93,    -1,    -1,    -1,    -1,    98,    99,   100,
     101,   102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,
      -1,     3,     4,     5,    -1,     7,    -1,    -1,    -1,    11,
      12,    -1,    -1,    -1,    16,   126,    18,    19,    20,    21,
      22,    23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,
      32,    33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,
      -1,    -1,    -1,    -1,    46,    -1,    -1,    49,    50,    51,
      52,    53,    54,    55,    56,    57,    -1,    59,    60,    -1,
      62,    63,    64,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,
      92,    93,    -1,    -1,    -1,    -1,    98,    99,   100,   101,
     102,   103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,
       3,     4,     5,    -1,     7,    -1,    -1,    -1,    11,    12,
      -1,    -1,    -1,    16,   126,    18,    19,    20,    21,    22,
      23,    24,    -1,    -1,    -1,    -1,    -1,    30,    31,    32,
      33,    34,    35,    36,    -1,    -1,    39,    -1,    -1,    -1,
      -1,    -1,    -1,    46,    -1,    -1,    49,    50,    51,    52,
      53,    54,    55,    56,    57,    -1,    59,    60,    -1,    62,
      63,    64,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    86,    -1,    -1,    89,    90,    -1,    92,
      93,    -1,    -1,    -1,    -1,    98,    99,   100,   101,   102,
     103,   104,   105,   106,    -1,    -1,    -1,    -1,    -1,    -1,
      52,    53,    -1,    -1,    56,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   126,    66,    67,    68,    69,    70,    71,
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
     128,    -1,    -1,    -1,    -1,    -1,   134
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
     220,   221,   222,   223,   224,   249,   250,   264,   265,   266,
     267,   268,   269,   270,   273,   275,   276,   288,   290,   291,
     292,   293,   294,   295,   296,   327,   338,   147,     3,     4,
       5,     6,     7,     8,     9,    10,    11,    12,    13,    14,
      15,    16,    17,    18,    19,    20,    21,    22,    23,    24,
      25,    26,    30,    31,    32,    33,    34,    35,    36,    37,
      38,    39,    45,    46,    47,    48,    49,    50,    51,    52,
      53,    56,    66,    67,    68,    69,    70,    71,    72,    73,
      74,    77,    78,    81,    82,    83,    84,    95,    96,   116,
     117,   118,   119,   120,   121,   122,   123,   124,   125,   127,
     128,   134,   175,   176,   177,   178,   180,   181,   288,   290,
      39,    58,    86,    89,    95,    96,    97,   127,   164,   172,
     182,   184,   189,   192,   194,   214,   292,   293,   295,   296,
     325,   326,   189,   189,   135,   190,   191,   135,   186,   190,
     135,   139,   332,    54,   177,   332,   148,   129,    21,    22,
      30,    31,    32,   163,   182,   214,   182,    56,     1,    47,
      89,   150,   151,   152,   154,   166,   167,   338,   157,   198,
     185,   194,   325,   338,   184,   324,   325,   338,    46,    86,
     126,   133,   171,   196,   214,   292,   293,   296,   242,   243,
      54,    55,    57,   175,   280,   289,   279,   280,   281,   141,
     271,   141,   277,   141,   274,   141,   278,    59,    60,   159,
     182,   182,   138,   139,   331,   336,   337,    40,    41,    42,
      43,    44,    37,    38,    26,   129,   186,   190,   255,    28,
     247,   113,   133,    89,    95,   168,   113,    68,    69,    70,
      71,    72,    73,    74,    75,    76,    77,    78,    79,    80,
      83,    84,   114,   116,   117,   118,   119,   120,   121,   122,
     123,   124,   125,    85,   131,   132,   197,   157,   158,   158,
     201,   203,   158,   331,   337,    86,   165,   172,   214,   230,
     292,   293,   296,    52,    56,    83,    86,   173,   174,   214,
     292,   293,   296,   174,    33,    34,    35,    36,    49,    50,
      51,    52,    56,   135,   175,   294,   322,    85,   132,   330,
     255,   267,    87,    87,   133,   184,    56,   184,   184,   184,
     113,    88,   133,   193,   338,    85,   131,   132,    87,    87,
     133,   193,   189,   332,   333,   189,   188,   189,   194,   325,
     338,   157,   333,   157,    54,    63,    64,   155,   135,   183,
     129,   150,    85,   132,    87,   154,   153,   166,   136,   331,
     337,   333,   199,   333,   137,   133,   139,   335,   133,   335,
     130,   335,   332,    56,    59,    60,   168,   170,   133,    85,
     131,   132,   244,    61,   107,   109,   110,   282,   110,   282,
     110,    65,   282,   110,   110,   272,   282,   110,    61,   110,
     110,   110,   272,   110,    61,   110,    68,    68,   138,   147,
     158,   158,   158,   158,   154,   157,   157,   257,   256,    94,
     161,   248,    95,   159,   184,   194,   195,   166,   133,   171,
     133,   156,   159,   172,   182,   184,   195,   182,   182,   182,
     182,   182,   182,   182,   182,   182,   182,   182,   182,   182,
     182,   182,   182,   182,   182,   182,   182,   182,   182,   182,
     182,   182,   182,    52,    53,    56,   180,   254,   328,   329,
     188,    52,    53,    56,   180,   253,   328,   149,   150,    13,
     226,   336,   226,   158,   158,   331,    17,   258,    56,    85,
     131,   132,    25,   157,    52,    56,   173,     1,   117,   297,
     336,    85,   131,   132,   210,   323,   211,   330,    52,    56,
     328,   159,   182,   159,   182,   179,   182,   184,    95,   184,
     192,   325,    52,    56,   188,    52,    56,   326,   333,   136,
     333,   133,   133,   333,   177,   200,   182,   145,   130,   328,
     328,   182,   129,   333,   152,   333,   325,   133,   170,    52,
      56,   188,    52,    56,    52,    54,    55,    56,    57,    58,
      68,    89,    95,    96,    97,   120,   123,   135,   245,   300,
     302,   303,   304,   305,   306,   307,   310,   311,   312,   313,
     316,   317,   318,   319,   320,   284,   283,   141,   282,   141,
     141,   141,   182,   182,    76,   118,   237,   238,   338,   237,
     162,   237,   184,   133,   333,   170,   133,   113,    44,   332,
      87,    87,   186,   190,   252,   332,   334,    87,    87,   186,
     190,   251,    10,   225,     8,   260,   338,   150,    13,   150,
      27,   227,   336,   227,   258,   194,   225,    52,    56,   188,
      52,    56,   205,   208,   336,   298,   207,    52,    56,   173,
     188,   149,   157,   135,   299,   302,   212,   186,   187,   190,
     338,    44,   177,   184,   193,    87,    87,   334,    87,    87,
     325,   157,   130,   145,   335,   168,   334,   113,   184,    52,
      89,    95,   231,   232,   233,   304,   302,    29,   111,   246,
     133,   301,   133,   321,   338,    52,   133,   321,   133,   301,
      52,   133,   301,    52,   285,    54,    55,    57,   287,   296,
      52,    58,   234,   236,   239,   306,   308,   309,   312,   314,
     315,   318,   320,   332,   150,   150,   237,   150,    95,   184,
     170,   182,   115,   159,   182,   159,   182,   161,   186,   137,
      87,   159,   182,   159,   182,   161,   187,   184,   195,   261,
     338,    15,   229,   338,    14,   228,   229,   229,   202,   204,
     225,   133,   226,   334,   158,   336,   158,   149,   334,   225,
     333,   302,   149,   336,   175,   255,   247,   182,    87,   133,
     333,   130,   184,   233,   133,   304,   133,   333,   239,   150,
     150,   300,   305,   316,   318,   307,   312,   320,   306,   313,
     318,   306,   286,   113,    86,   214,   239,   118,   133,   235,
     133,   321,   321,   133,   235,   133,   235,   138,    10,   130,
     150,    10,   184,   182,   159,   182,    88,   262,   338,   150,
       9,   263,   338,   158,   225,   225,   150,   150,   184,   150,
     227,   209,   336,   225,   333,   225,   213,   333,   232,   133,
      95,   231,   136,    10,   130,   133,   301,   133,   301,   321,
     133,   301,   133,   301,   301,   150,   214,    56,    85,   118,
     234,   315,   318,   308,   312,   306,   314,   318,   306,    52,
     240,   241,   303,   130,    86,   172,   214,   292,   293,   296,
     226,   150,   226,   225,   225,   229,   258,   259,   206,   149,
     299,   133,   232,   133,   304,   306,   318,   306,   306,   108,
      52,    56,   133,   235,   133,   235,   321,   133,   235,   133,
     235,   235,   133,   332,    56,    85,   131,   132,   150,   150,
     150,   225,   149,   232,   133,   301,   133,   301,   301,   301,
     306,   318,   306,   306,   241,    52,    56,   188,    52,    56,
     260,   228,   225,   225,   232,   306,   235,   133,   235,   235,
     235,   334,   301,   306,   235
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
     239,   239,   240,   240,   241,   241,   243,   244,   242,   245,
     245,   246,   246,   248,   247,   249,   249,   249,   249,   250,
     251,   250,   252,   250,   250,   253,   250,   254,   250,   250,
     250,   250,   256,   255,   257,   255,   258,   259,   259,   260,
     260,   261,   261,   261,   262,   262,   263,   263,   264,   264,
     264,   265,   266,   266,   266,   267,   268,   269,   270,   270,
     271,   271,   272,   272,   273,   273,   274,   274,   275,   275,
     276,   276,   277,   277,   278,   278,   279,   279,   280,   280,
     281,   281,   282,   283,   282,   284,   285,   286,   282,   287,
     287,   287,   287,   288,   289,   289,   289,   289,   290,   291,
     291,   291,   291,   292,   292,   292,   292,   292,   293,   293,
     293,   293,   293,   293,   293,   294,   294,   295,   295,   296,
     296,   297,   298,   297,   297,   299,   299,   300,   300,   300,
     300,   301,   301,   302,   302,   302,   302,   302,   302,   302,
     302,   302,   302,   302,   302,   302,   302,   302,   303,   303,
     303,   303,   304,   304,   305,   305,   306,   306,   307,   308,
     309,   309,   310,   310,   311,   311,   312,   312,   313,   314,
     315,   315,   316,   316,   317,   317,   318,   318,   319,   319,
     320,   321,   321,   322,   323,   322,   324,   324,   325,   325,
     326,   326,   326,   327,   327,   327,   328,   328,   328,   328,
     329,   329,   329,   330,   330,   331,   331,   332,   332,   333,
     334,   335,   335,   335,   336,   336,   337,   337,   338
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
       1,     4,     1,     3,     1,     1,     0,     0,     4,     4,
       1,     3,     3,     0,     5,     2,     4,     5,     5,     2,
       0,     5,     0,     5,     3,     0,     4,     0,     4,     2,
       1,     4,     0,     5,     0,     5,     5,     1,     1,     6,
       1,     1,     1,     1,     2,     1,     2,     1,     1,     1,
       1,     1,     1,     1,     2,     3,     3,     3,     3,     3,
       0,     3,     1,     2,     3,     3,     0,     3,     3,     3,
       3,     3,     0,     3,     0,     3,     0,     2,     0,     2,
       0,     2,     1,     0,     3,     0,     0,     0,     6,     1,
       1,     1,     1,     2,     1,     1,     1,     1,     3,     1,
       1,     2,     2,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     0,     4,     2,     3,     2,     4,     2,     2,
       1,     2,     0,     6,     8,     4,     6,     4,     6,     2,
       4,     6,     2,     4,     2,     4,     1,     0,     1,     1,
       1,     1,     1,     1,     1,     3,     1,     3,     2,     2,
       1,     3,     1,     3,     1,     1,     2,     1,     3,     3,
       1,     3,     1,     3,     1,     1,     2,     1,     1,     1,
       2,     2,     1,     1,     0,     4,     1,     2,     1,     3,
       3,     2,     2,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     0,     1,     0,     1,     2,
       2,     0,     1,     1,     1,     1,     1,     2,     0
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
  "@27", "f_larglist", "lambda_body", "do_block", "@28", "block_call",
  "method_call", "@29", "@30", "@31", "@32", "brace_block", "@33", "@34",
  "case_body", "cases", "opt_rescue", "exc_list", "exc_var", "opt_ensure",
  "literal", "strings", "string", "string1", "xstring", "regexp", "words",
  "word_list", "word", "symbols", "symbol_list", "qwords", "qsymbols",
  "qword_list", "qsym_list", "string_contents", "xstring_contents",
  "regexp_contents", "string_content", "@35", "@36", "@37", "@38",
  "string_dvar", "symbol", "sym", "dsym", "numeric", "user_variable",
  "keyword_variable", "var_ref", "var_lhs", "backref", "superclass",
  "$@39", "f_arglist", "args_tail", "opt_args_tail", "f_args", "f_bad_arg",
  "f_norm_arg", "f_arg_item", "f_arg", "f_kw", "f_block_kw",
  "f_block_kwarg", "f_kwarg", "kwrest_mark", "f_kwrest", "f_opt",
  "f_block_opt", "f_block_optarg", "f_optarg", "restarg_mark",
  "f_rest_arg", "blkarg_mark", "f_block_arg", "opt_f_block_arg",
  "singleton", "$@40", "assoc_list", "assocs", "assoc", "operation",
  "operation2", "operation3", "dot_or_colon", "opt_terms", "opt_nl",
  "rparen", "rbracket", "trailer", "term", "terms", "none", null
    //[
  ];

  // YYRHS -- A `-1'-separated list of the rules' RHS.
  var yyrhs_ = this.yyrhs_ =
  [
    //]
       143,     0,    -1,    -1,   144,   145,    -1,   146,   331,    -1,
     338,    -1,   147,    -1,   146,   337,   147,    -1,     1,   147,
      -1,   154,    -1,    -1,    47,   148,   129,   145,   130,    -1,
     150,   260,   229,   263,    -1,   151,   331,    -1,   338,    -1,
     152,    -1,   151,   337,   152,    -1,     1,   154,    -1,   154,
      -1,    -1,    47,   153,   129,   145,   130,    -1,    -1,    45,
     177,   155,   177,    -1,    45,    54,    54,    -1,    45,    54,
      64,    -1,    45,    54,    63,    -1,     6,   178,    -1,   154,
      40,   158,    -1,   154,    41,   158,    -1,   154,    42,   158,
      -1,   154,    43,   158,    -1,   154,    44,   154,    -1,    48,
     129,   150,   130,    -1,   156,    -1,   165,   113,   159,    -1,
     295,    87,   159,    -1,   214,   131,   188,   334,    87,   159,
      -1,   214,   132,    52,    87,   159,    -1,   214,   132,    56,
      87,   159,    -1,   214,    85,    56,    87,   159,    -1,   214,
      85,    52,    87,   159,    -1,   296,    87,   159,    -1,   172,
     113,   195,    -1,   165,   113,   184,    -1,   165,   113,   195,
      -1,   157,    -1,   172,   113,   159,    -1,   172,   113,   156,
      -1,   159,    -1,   157,    37,   157,    -1,   157,    38,   157,
      -1,    39,   332,   157,    -1,   127,   159,    -1,   182,    -1,
     157,    -1,   164,    -1,   160,    -1,   249,    -1,   249,   330,
     328,   190,    -1,    -1,    94,   162,   237,   150,   130,    -1,
     327,    -1,   163,   190,    -1,   163,   190,   161,    -1,   214,
     132,   328,   190,    -1,   214,   132,   328,   190,   161,    -1,
     214,    85,   328,   190,    -1,   214,    85,   328,   190,   161,
      -1,    32,   190,    -1,    31,   190,    -1,    30,   189,    -1,
      21,   189,    -1,    22,   189,    -1,   167,    -1,    89,   166,
     333,    -1,   167,    -1,    89,   166,   333,    -1,   169,    -1,
     169,   168,    -1,   169,    95,   171,    -1,   169,    95,   171,
     133,   170,    -1,   169,    95,    -1,   169,    95,   133,   170,
      -1,    95,   171,    -1,    95,   171,   133,   170,    -1,    95,
      -1,    95,   133,   170,    -1,   171,    -1,    89,   166,   333,
      -1,   168,   133,    -1,   169,   168,   133,    -1,   168,    -1,
     170,   133,   168,    -1,   292,    -1,   293,    -1,   214,   131,
     188,   334,    -1,   214,   132,    52,    -1,   214,    85,    52,
      -1,   214,   132,    56,    -1,   214,    85,    56,    -1,    86,
      56,    -1,   296,    -1,   292,    -1,   293,    -1,   214,   131,
     188,   334,    -1,   214,   132,    52,    -1,   214,    85,    52,
      -1,   214,   132,    56,    -1,   214,    85,    56,    -1,    86,
      56,    -1,   296,    -1,    52,    -1,    56,    -1,    86,   173,
      -1,   173,    -1,   214,    85,   173,    -1,    52,    -1,    56,
      -1,    53,    -1,   180,    -1,   181,    -1,   175,    -1,   288,
      -1,   176,    -1,   290,    -1,   177,    -1,    -1,   178,   133,
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
     113,   182,    44,   182,    -1,   295,    87,   182,    -1,   295,
      87,   182,    44,   182,    -1,   214,   131,   188,   334,    87,
     182,    -1,   214,   132,    52,    87,   182,    -1,   214,   132,
      56,    87,   182,    -1,   214,    85,    52,    87,   182,    -1,
     214,    85,    56,    87,   182,    -1,    86,    56,    87,   182,
      -1,   296,    87,   182,    -1,   182,    79,   182,    -1,   182,
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
      75,   182,    -1,   182,    76,   182,    -1,    -1,    46,   332,
     183,   182,    -1,   182,   114,   182,   332,   115,   182,    -1,
     196,    -1,   182,    -1,   338,    -1,   194,   335,    -1,   194,
     133,   325,   335,    -1,   325,   335,    -1,   135,   188,   333,
      -1,   338,    -1,   186,    -1,   338,    -1,   189,    -1,   194,
     133,    -1,   194,   133,   325,   133,    -1,   325,   133,    -1,
     164,    -1,   194,   193,    -1,   325,   193,    -1,   194,   133,
     325,   193,    -1,   192,    -1,    -1,   191,   189,    -1,    97,
     184,    -1,   133,   192,    -1,   338,    -1,   184,    -1,    95,
     184,    -1,   194,   133,   184,    -1,   194,   133,    95,   184,
      -1,   194,   133,   184,    -1,   194,   133,    95,   184,    -1,
      95,   184,    -1,   264,    -1,   265,    -1,   268,    -1,   269,
      -1,   270,    -1,   275,    -1,   273,    -1,   276,    -1,   294,
      -1,   296,    -1,    53,    -1,    -1,   215,   197,   149,   225,
      -1,    -1,    90,   198,   333,    -1,    -1,    90,   157,   199,
     333,    -1,    89,   150,   136,    -1,   214,    85,    56,    -1,
      86,    56,    -1,    92,   185,   137,    -1,    93,   324,   130,
      -1,    30,    -1,    31,   135,   189,   333,    -1,    31,   135,
     333,    -1,    31,    -1,    -1,    46,   332,   135,   200,   157,
     333,    -1,    39,   135,   157,   333,    -1,    39,   135,   333,
      -1,   163,   255,    -1,   250,    -1,   250,   255,    -1,    98,
     242,    -1,   216,   158,   226,   150,   228,   225,    -1,   217,
     158,   226,   150,   229,   225,    -1,    -1,    -1,   218,   201,
     158,   227,   202,   150,   225,    -1,    -1,    -1,   219,   203,
     158,   227,   204,   150,   225,    -1,   220,   158,   331,   258,
     225,    -1,   220,   331,   258,   225,    -1,    -1,    -1,   221,
     230,    25,   205,   158,   227,   206,   150,   225,    -1,    -1,
     222,   174,   297,   207,   149,   225,    -1,    -1,    -1,   222,
      83,   157,   208,   336,   209,   149,   225,    -1,    -1,   223,
     174,   210,   149,   225,    -1,    -1,   224,   175,   211,   299,
     149,   225,    -1,    -1,    -1,   224,   322,   330,   212,   175,
     213,   299,   149,   225,    -1,    21,    -1,    22,    -1,    23,
      -1,    24,    -1,   196,    -1,     7,    -1,    11,    -1,    12,
      -1,    18,    -1,    19,    -1,    16,    -1,    20,    -1,     3,
      -1,     4,    -1,     5,    -1,    10,    -1,   336,    -1,    13,
      -1,   336,    13,    -1,   336,    -1,    27,    -1,   229,    -1,
      14,   158,   226,   150,   228,    -1,   338,    -1,    15,   150,
      -1,   172,    -1,   165,    -1,   304,    -1,    89,   233,   333,
      -1,   231,    -1,   232,   133,   231,    -1,   232,    -1,   232,
     133,    95,   304,    -1,   232,   133,    95,   304,   133,   232,
      -1,   232,   133,    95,    -1,   232,   133,    95,   133,   232,
      -1,    95,   304,    -1,    95,   304,   133,   232,    -1,    95,
      -1,    95,   133,   232,    -1,   309,   133,   312,   321,    -1,
     309,   321,    -1,   312,   321,    -1,   320,    -1,   133,   234,
      -1,    -1,   306,   133,   315,   133,   318,   235,    -1,   306,
     133,   315,   133,   318,   133,   306,   235,    -1,   306,   133,
     315,   235,    -1,   306,   133,   315,   133,   306,   235,    -1,
     306,   133,   318,   235,    -1,   306,   133,    -1,   306,   133,
     318,   133,   306,   235,    -1,   306,   235,    -1,   315,   133,
     318,   235,    -1,   315,   133,   318,   133,   306,   235,    -1,
     315,   235,    -1,   315,   133,   306,   235,    -1,   318,   235,
      -1,   318,   133,   306,   235,    -1,   234,    -1,   338,    -1,
     238,    -1,   118,   239,   118,    -1,    76,    -1,   118,   236,
     239,   118,    -1,   332,    -1,   332,   138,   240,   332,    -1,
     241,    -1,   240,   133,   241,    -1,    52,    -1,   303,    -1,
      -1,    -1,   243,   244,   245,   246,    -1,   135,   302,   239,
     136,    -1,   302,    -1,   111,   150,   130,    -1,    29,   150,
      10,    -1,    -1,    28,   248,   237,   150,    10,    -1,   164,
     247,    -1,   249,   330,   328,   187,    -1,   249,   330,   328,
     187,   255,    -1,   249,   330,   328,   190,   247,    -1,   163,
     186,    -1,    -1,   214,   132,   328,   251,   187,    -1,    -1,
     214,    85,   328,   252,   186,    -1,   214,    85,   329,    -1,
      -1,   214,   132,   253,   186,    -1,    -1,   214,    85,   254,
     186,    -1,    32,   186,    -1,    32,    -1,   214,   131,   188,
     334,    -1,    -1,   129,   256,   237,   150,   130,    -1,    -1,
      26,   257,   237,   150,    10,    -1,    17,   194,   226,   150,
     259,    -1,   229,    -1,   258,    -1,     8,   261,   262,   226,
     150,   260,    -1,   338,    -1,   184,    -1,   195,    -1,   338,
      -1,    88,   172,    -1,   338,    -1,     9,   150,    -1,   338,
      -1,   291,    -1,   288,    -1,   290,    -1,   266,    -1,    62,
      -1,   267,    -1,   266,   267,    -1,   100,   279,   110,    -1,
     101,   280,   110,    -1,   102,   281,    65,    -1,   103,   141,
     110,    -1,   103,   271,   110,    -1,    -1,   271,   272,   141,
      -1,   282,    -1,   272,   282,    -1,   105,   141,   110,    -1,
     105,   274,   110,    -1,    -1,   274,   272,   141,    -1,   104,
     141,   110,    -1,   104,   277,   110,    -1,   106,   141,   110,
      -1,   106,   278,   110,    -1,    -1,   277,    61,   141,    -1,
      -1,   278,    61,   141,    -1,    -1,   279,   282,    -1,    -1,
     280,   282,    -1,    -1,   281,   282,    -1,    61,    -1,    -1,
     109,   283,   287,    -1,    -1,    -1,    -1,   107,   284,   285,
     286,   150,   108,    -1,    54,    -1,    55,    -1,    57,    -1,
     296,    -1,    99,   289,    -1,   175,    -1,    55,    -1,    54,
      -1,    57,    -1,    99,   280,   110,    -1,    59,    -1,    60,
      -1,   126,    59,    -1,   126,    60,    -1,    52,    -1,    55,
      -1,    54,    -1,    56,    -1,    57,    -1,    34,    -1,    33,
      -1,    35,    -1,    36,    -1,    50,    -1,    49,    -1,    51,
      -1,   292,    -1,   293,    -1,   292,    -1,   293,    -1,    63,
      -1,    64,    -1,   336,    -1,    -1,   117,   298,   158,   336,
      -1,     1,   336,    -1,   135,   302,   333,    -1,   302,   336,
      -1,   310,   133,   312,   321,    -1,   310,   321,    -1,   312,
     321,    -1,   320,    -1,   133,   300,    -1,    -1,   306,   133,
     316,   133,   318,   301,    -1,   306,   133,   316,   133,   318,
     133,   306,   301,    -1,   306,   133,   316,   301,    -1,   306,
     133,   316,   133,   306,   301,    -1,   306,   133,   318,   301,
      -1,   306,   133,   318,   133,   306,   301,    -1,   306,   301,
      -1,   316,   133,   318,   301,    -1,   316,   133,   318,   133,
     306,   301,    -1,   316,   301,    -1,   316,   133,   306,   301,
      -1,   318,   301,    -1,   318,   133,   306,   301,    -1,   300,
      -1,    -1,    56,    -1,    55,    -1,    54,    -1,    57,    -1,
     303,    -1,    52,    -1,   304,    -1,    89,   233,   333,    -1,
     305,    -1,   306,   133,   305,    -1,    58,   184,    -1,    58,
     214,    -1,   308,    -1,   309,   133,   308,    -1,   307,    -1,
     310,   133,   307,    -1,    68,    -1,    96,    -1,   311,    52,
      -1,   311,    -1,    52,   113,   184,    -1,    52,   113,   214,
      -1,   314,    -1,   315,   133,   314,    -1,   313,    -1,   316,
     133,   313,    -1,   123,    -1,    95,    -1,   317,    52,    -1,
     317,    -1,   120,    -1,    97,    -1,   319,    52,    -1,   133,
     320,    -1,   338,    -1,   294,    -1,    -1,   135,   323,   157,
     333,    -1,   338,    -1,   325,   335,    -1,   326,    -1,   325,
     133,   326,    -1,   184,    88,   184,    -1,    58,   184,    -1,
      96,   184,    -1,    52,    -1,    56,    -1,    53,    -1,    52,
      -1,    56,    -1,    53,    -1,   180,    -1,    52,    -1,    53,
      -1,   180,    -1,   132,    -1,    85,    -1,    -1,   337,    -1,
      -1,   139,    -1,   332,   136,    -1,   332,   137,    -1,    -1,
     139,    -1,   133,    -1,   138,    -1,   139,    -1,   336,    -1,
     337,   138,    -1,    -1
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
    1273,  1275,  1280,  1282,  1286,  1288,  1290,  1291,  1292,  1297,
    1302,  1304,  1308,  1312,  1313,  1319,  1322,  1327,  1333,  1339,
    1342,  1343,  1349,  1350,  1356,  1360,  1361,  1366,  1367,  1372,
    1375,  1377,  1382,  1383,  1389,  1390,  1396,  1402,  1404,  1406,
    1413,  1415,  1417,  1419,  1421,  1424,  1426,  1429,  1431,  1433,
    1435,  1437,  1439,  1441,  1443,  1446,  1450,  1454,  1458,  1462,
    1466,  1467,  1471,  1473,  1476,  1480,  1484,  1485,  1489,  1493,
    1497,  1501,  1505,  1506,  1510,  1511,  1515,  1516,  1519,  1520,
    1523,  1524,  1527,  1529,  1530,  1534,  1535,  1536,  1537,  1544,
    1546,  1548,  1550,  1552,  1555,  1557,  1559,  1561,  1563,  1567,
    1569,  1571,  1574,  1577,  1579,  1581,  1583,  1585,  1587,  1589,
    1591,  1593,  1595,  1597,  1599,  1601,  1603,  1605,  1607,  1609,
    1611,  1613,  1615,  1616,  1621,  1624,  1628,  1631,  1636,  1639,
    1642,  1644,  1647,  1648,  1655,  1664,  1669,  1676,  1681,  1688,
    1691,  1696,  1703,  1706,  1711,  1714,  1719,  1721,  1722,  1724,
    1726,  1728,  1730,  1732,  1734,  1736,  1740,  1742,  1746,  1749,
    1752,  1754,  1758,  1760,  1764,  1766,  1768,  1771,  1773,  1777,
    1781,  1783,  1787,  1789,  1793,  1795,  1797,  1800,  1802,  1804,
    1806,  1809,  1812,  1814,  1816,  1817,  1822,  1824,  1827,  1829,
    1833,  1837,  1840,  1843,  1845,  1847,  1849,  1851,  1853,  1855,
    1857,  1859,  1861,  1863,  1865,  1867,  1868,  1870,  1871,  1873,
    1876,  1879,  1880,  1882,  1884,  1886,  1888,  1890,  1893
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

  var yylast_ = this.yylast_ = 10926;
  var yynnts_ = 197;
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

    /*
    There are many possibilities here to consider:
     - Assume YYFAIL is not used.  It's too flawed to consider.
       See
       <http://lists.gnu.org/archive/html/bison-patches/2009-12/msg00024.html>
       for details.  YYERROR is fine as it does not invoke this
       function.
     - If this state is a consistent state with a default action,
       then the only way this function was invoked is if the
       default action is an error action.  In that case, don't
       check for expected tokens because there are none.
     - The only way there can be no lookahead present (in tok) is
       if this state is a consistent state with a default action.
       Thus, detecting the absence of a lookahead is sufficient to
       determine that there is no unexpected or expected token to
       report.  In that case, just report a simple "syntax error".
     - Don't assume there isn't a lookahead just because this
       state is a consistent state with a default action.  There
       might have been a previous inconsistent state, consistent
       state with a non-default action, or user semantic action
       that manipulated yychar.  (However, yychar is currently out
       of scope during semantic actions.)
     - Of course, the expected token list depends on states to
       have correct lookahead information, and it depends on the
       parser not to perform extra reductions after fetching a
       lookahead from the scanner and before detecting a syntax
       error.  Thus, state merging (from LALR or IELR) and default
       reductions corrupt the expected token list.  However, the
       list is correct for canonical LR with one exception: it
       will still contain any token that will not be accepted due
       to an error action in a later state.
    */

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

    /* Return YYSTR after stripping away unnecessary quotes and
       backslashes, so that it's suitable for yyerror.  The heuristic is
       that double-quoting is unnecessary unless the string contains an
       apostrophe, a comma, or backslash (other than backslash-backslash).
       YYSTR is taken from yytname.  */
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

/* "%code actions" blocks.  */



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
      if (lexer.in_def || lexer.in_single)
        lexer.yyerror("dynamic constant assignment");
      
      yyval = builder.assignable(builder.const_fetch(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]));
    };
  
  return yyval;
},
  100: function (yyval, yyvs)
{
  
    {
      if (lexer.in_def || lexer.in_single)
        lexer.yyerror("dynamic constant assignment");
      
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
      if (lexer.in_def || lexer.in_single)
        lexer.yyerror("dynamic constant assignment");
      
      yyval = builder.assignable(builder.const_fetch(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]));
    };
  
  return yyval;
},
  109: function (yyval, yyvs)
{
  
    {
      if (lexer.in_def || lexer.in_single)
        lexer.yyerror("dynamic constant assignment");
      
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
      // TODO
      // if in_def?
      //   diagnostic(:error, :dynamic_const, val[2], [ val[3] ])
      // end
      
      var const_ = builder.assignable(builder.const_fetch(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))]));
      yyval = builder.op_assign(const_, yyvs[yyvs.length-1-((5-(4)))], yyvs[yyvs.length-1-((5-(5)))]);
    };
  
  return yyval;
},
  208: function (yyval, yyvs)
{
  
    {
      // TODO
      // if in_def?
      //   diagnostic(:error, :dynamic_const, val[1], [ val[2] ])
      // end
      
      var const_  = builder.assignable(builder.const_global(yyvs[yyvs.length-1-((4-(2)))]));
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
      var number = builder.integer(yyvs[yyvs.length-1-((4-(2)))], /*negate=*/false);
      var binary  = builder.binary_op(number, yyvs[yyvs.length-1-((4-(3)))], yyvs[yyvs.length-1-((4-(4)))]);
      yyval = builder.unary_op(yyvs[yyvs.length-1-((4-(1)))], binary);
    };
  
  return yyval;
},
  219: function (yyval, yyvs)
{
  
    {
      var number = builder.float_(yyvs[yyvs.length-1-((4-(2)))], /*negate=*/false);
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
        lexer.lex_state = EXPR_ENDFN; /* force for args */
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
      lexer.lpar_beg = yyvs[yyvs.length-1-((4-(2)))];
      // touching this alters the parse.output
      yyvs[yyvs.length-1-((4-(1)))];
      
      yyval = { args: yyvs[yyvs.length-1-((4-(3)))], body: yyvs[yyvs.length-1-((4-(4)))] };
    };
  
  return yyval;
},
  409: function (yyval, yyvs)
{
  
    {
        yyval = builder.args(yyvs[yyvs.length-1-((4-(2)))].concat(yyvs[yyvs.length-1-((4-(3)))]));
      };
  
  return yyval;
},
  410: function (yyval, yyvs)
{
  
    {
        yyval = builder.args(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  411: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((3-(2)))]; // no wrapping in an array
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
        scope.push_dynamic();
      };
  
  return yyval;
},
  414: function (yyval, yyvs)
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
  415: function (yyval, yyvs)
{
  
    {
        var block = yyvs[yyvs.length-1-((2-(2)))];
        yyval = builder.block(yyvs[yyvs.length-1-((2-(1)))], block.args, block.body);
      };
  
  return yyval;
},
  416: function (yyval, yyvs)
{
  
    {
        yyval = builder.call_method(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(2)))], yyvs[yyvs.length-1-((4-(3)))], yyvs[yyvs.length-1-((4-(4)))]);
      };
  
  return yyval;
},
  417: function (yyval, yyvs)
{
  
    {
        var method_call = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))], yyvs[yyvs.length-1-((5-(4)))]);

        var block = yyvs[yyvs.length-1-((5-(5)))];
        yyval = builder.block(method_call, block.args, block.body);
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
      yyval = builder.call_method(null, null, yyvs[yyvs.length-1-((2-(1)))], yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  420: function (yyval, yyvs)
{
  
    {
        // TODO
      };
  
  return yyval;
},
  421: function (yyval, yyvs)
{
  
    {
        yyval = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))], yyvs[yyvs.length-1-((5-(5)))]);
      
        // touching this alters the parse.output
          yyvs[yyvs.length-1-((5-(4)))];
      };
  
  return yyval;
},
  422: function (yyval, yyvs)
{
  
    {
        // TODO
      };
  
  return yyval;
},
  423: function (yyval, yyvs)
{
  
    {
        yyval = builder.call_method(yyvs[yyvs.length-1-((5-(1)))], yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(3)))], yyvs[yyvs.length-1-((5-(5)))]);
      
        // touching this alters the parse.output
          yyvs[yyvs.length-1-((5-(4)))]
      };
  
  return yyval;
},
  424: function (yyval, yyvs)
{
  
    {
      yyval = builder.call_method(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(2)))], yyvs[yyvs.length-1-((3-(3)))]); // empty args
    };
  
  return yyval;
},
  425: function (yyval, yyvs)
{
  
    {
        // TODO
      };
  
  return yyval;
},
  426: function (yyval, yyvs)
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
  427: function (yyval, yyvs)
{
  
    {
        // TODO
      };
  
  return yyval;
},
  428: function (yyval, yyvs)
{
  
    {
        yyval = builder.call_method(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(2)))], null, yyvs[yyvs.length-1-((4-(4)))]);

        // TODO: touching this alters the parse.output
        yyvs[yyvs.length-1-((4-(3)))];
      };
  
  return yyval;
},
  429: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('super', yyvs[yyvs.length-1-((2-(2)))]);
      };
  
  return yyval;
},
  430: function (yyval, yyvs)
{
  
    {
        yyval = builder.keyword_cmd('zsuper');
      };
  
  return yyval;
},
  431: function (yyval, yyvs)
{
  
    {
        yyval = builder.index(yyvs[yyvs.length-1-((4-(1)))], yyvs[yyvs.length-1-((4-(3)))]);
      };
  
  return yyval;
},
  432: function (yyval, yyvs)
{
  
    {
        scope.push_dynamic();
      };
  
  return yyval;
},
  433: function (yyval, yyvs)
{
  
    {
        yyval = { args: yyvs[yyvs.length-1-((5-(3)))], body: yyvs[yyvs.length-1-((5-(4)))] };
      
        // touching this alters the parse.output
        yyvs[yyvs.length-1-((5-(2)))];
      
        scope.pop();
      };
  
  return yyval;
},
  434: function (yyval, yyvs)
{
  
    {
        scope.push_dynamic();
      };
  
  return yyval;
},
  435: function (yyval, yyvs)
{
  
    {
        yyval = { args: yyvs[yyvs.length-1-((5-(3)))], body: yyvs[yyvs.length-1-((5-(4)))] };
      
        // touching this alters the parse.output
        yyvs[yyvs.length-1-((5-(2)))];
      
        scope.pop();
      };
  
  return yyval;
},
  436: function (yyval, yyvs)
{
  
    {
        var cases = yyvs[yyvs.length-1-((5-(5)))];
        cases.unshift(builder.when(yyvs[yyvs.length-1-((5-(2)))], yyvs[yyvs.length-1-((5-(4)))])); // TODO: push() + reverse()
        yyval = cases;
      };
  
  return yyval;
},
  437: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  439: function (yyval, yyvs)
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
  440: function (yyval, yyvs)
{
  
    {
        yyval = [];
      };
  
  return yyval;
},
  441: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  444: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((2-(2)))];
      };
  
  return yyval;
},
  446: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((2-(2)))] ];
      };
  
  return yyval;
},
  451: function (yyval, yyvs)
{
  
    {
        yyval = builder.string_compose(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  452: function (yyval, yyvs)
{
  
    {
       yyval = [ builder.string(yyvs[yyvs.length-1-((1-(1)))]) ];
     };
  
  return yyval;
},
  453: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  454: function (yyval, yyvs)
{
  
    {
        var string = yyvs[yyvs.length-1-((2-(1)))];
        string.push(yyvs[yyvs.length-1-((2-(2)))]);
        yyval = string;
      };
  
  return yyval;
},
  455: function (yyval, yyvs)
{
  
    {
        yyval = builder.string_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  456: function (yyval, yyvs)
{
  
    {
        yyval = builder.xstring_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  457: function (yyval, yyvs)
{
  
    {
        var opts = builder.regexp_options(yyvs[yyvs.length-1-((3-(3)))]); // tREGEXP_OPT in WP
        yyval = builder.regexp_compose(yyvs[yyvs.length-1-((3-(2)))], opts);
      };
  
  return yyval;
},
  458: function (yyval, yyvs)
{
  
    {
        yyval = builder.words_compose([]);
      };
  
  return yyval;
},
  459: function (yyval, yyvs)
{
  
    {
        yyval = builder.words_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  460: function (yyval, yyvs)
{
  
    {
        yyval = []; // words collector
      };
  
  return yyval;
},
  461: function (yyval, yyvs)
{
  
    {
        var word_list = yyvs[yyvs.length-1-((3-(1)))];
        word_list.push(builder.word(yyvs[yyvs.length-1-((3-(2)))]));
        yyval = word_list;
      };
  
  return yyval;
},
  462: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  463: function (yyval, yyvs)
{
  
    {
        var word = yyvs[yyvs.length-1-((2-(1)))];
        word.push(yyvs[yyvs.length-1-((2-(2)))]);
        yyval = word;
      };
  
  return yyval;
},
  464: function (yyval, yyvs)
{
  
    {
        yyval = builder.symbols_compose([]);
      };
  
  return yyval;
},
  465: function (yyval, yyvs)
{
  
    {
        yyval = builder.symbols_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  466: function (yyval, yyvs)
{
  
    {
        yyval = [];
      };
  
  return yyval;
},
  467: function (yyval, yyvs)
{
  
    {
        var symbol_list = yyvs[yyvs.length-1-((3-(1)))];
        symbol_list.push(builder.word(yyvs[yyvs.length-1-((3-(2)))]));
        yyval = symbol_list;
      };
  
  return yyval;
},
  468: function (yyval, yyvs)
{
  
    {
        yyval = builder.words_compose([]);
      };
  
  return yyval;
},
  469: function (yyval, yyvs)
{
  
    {
        yyval = builder.words_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  470: function (yyval, yyvs)
{
  
    {
        yyval = builder.symbols_compose([]);
      };
  
  return yyval;
},
  471: function (yyval, yyvs)
{
  
    {
        yyval = builder.symbols_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  472: function (yyval, yyvs)
{
  
    {
        yyval = []; // accumulator
      };
  
  return yyval;
},
  473: function (yyval, yyvs)
{
  
    {
        var qword_list = yyvs[yyvs.length-1-((3-(1)))];
        qword_list.push(builder.string(yyvs[yyvs.length-1-((3-(2)))]));
        yyval = qword_list;
      };
  
  return yyval;
},
  474: function (yyval, yyvs)
{
  
    {
        yyval = []; // accumulator
      };
  
  return yyval;
},
  475: function (yyval, yyvs)
{
  
    {
        var qsym_list = yyvs[yyvs.length-1-((3-(1)))];
        qsym_list.push(builder.symbol(yyvs[yyvs.length-1-((3-(2)))]));
        yyval = qsym_list;
      };
  
  return yyval;
},
  476: function (yyval, yyvs)
{
  
    {
        yyval = []; // string parts collector
      };
  
  return yyval;
},
  477: function (yyval, yyvs)
{
  
    {
        var string_contents = yyvs[yyvs.length-1-((2-(1)))];
        string_contents.push(yyvs[yyvs.length-1-((2-(2)))]);
        yyval = string_contents;
      };
  
  return yyval;
},
  478: function (yyval, yyvs)
{
  
    {
        yyval = []; // accumulator
      };
  
  return yyval;
},
  479: function (yyval, yyvs)
{
  
    {
        var xstring_contents = yyvs[yyvs.length-1-((2-(1)))];
        xstring_contents.push(yyvs[yyvs.length-1-((2-(2)))]);
        yyval = xstring_contents;
      };
  
  return yyval;
},
  480: function (yyval, yyvs)
{
  
    {
        yyval = []; // accumulator
      };
  
  return yyval;
},
  481: function (yyval, yyvs)
{
  
    {
        var regexp_contents = yyvs[yyvs.length-1-((2-(1)))];
        regexp_contents.push(yyvs[yyvs.length-1-((2-(2)))]);
        yyval = regexp_contents;
      };
  
  return yyval;
},
  482: function (yyval, yyvs)
{
  
    {
        yyval = builder.string(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  483: function (yyval, yyvs)
{
  
    {
        yyval = lexer.lex_strterm;
        lexer.lex_strterm = null;
        lexer.lex_state = EXPR_BEG;
      };
  
  return yyval;
},
  484: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((3-(3)))];
        lexer.lex_strterm = yyvs[yyvs.length-1-((3-(2)))];
      };
  
  return yyval;
},
  485: function (yyval, yyvs)
{
  
    {
        yyvs[yyvs.length-1-((1-(1)))] = lexer.cond_stack;
        yyval = lexer.cmdarg_stack;
        lexer.cond_stack = 0;
        lexer.cmdarg_stack = 0;
      };
  
  return yyval;
},
  486: function (yyval, yyvs)
{
  
    {
        yyval = lexer.lex_strterm;
        lexer.lex_strterm = null;
        lexer.lex_state = EXPR_BEG;
      };
  
  return yyval;
},
  487: function (yyval, yyvs)
{
  
    {
        yyval = lexer.brace_nest;
        lexer.brace_nest = 0;
      };
  
  return yyval;
},
  488: function (yyval, yyvs)
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
  489: function (yyval, yyvs)
{
  
    {
      yyval = builder.gvar(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  490: function (yyval, yyvs)
{
  
    {
      yyval = builder.ivar(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  491: function (yyval, yyvs)
{
  
    {
      yyval = builder.cvar(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  493: function (yyval, yyvs)
{
  
    {
      lexer.lex_state = EXPR_END;
      yyval = builder.symbol(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  498: function (yyval, yyvs)
{
  
    {
        lexer.lex_state = EXPR_END;
        
        yyval = builder.symbol_compose(yyvs[yyvs.length-1-((3-(2)))]);
      };
  
  return yyval;
},
  499: function (yyval, yyvs)
{
  
    {
        yyval = builder.integer(yyvs[yyvs.length-1-((1-(1)))], /*negate=*/false);
      };
  
  return yyval;
},
  500: function (yyval, yyvs)
{
  
    {
        yyval = builder.float_(yyvs[yyvs.length-1-((1-(1)))], /*negate=*/false);
      };
  
  return yyval;
},
  501: function (yyval, yyvs)
{
  
    {
        yyval = builder.integer(yyvs[yyvs.length-1-((2-(2)))], /*negate=*/true);
      };
  
  return yyval;
},
  502: function (yyval, yyvs)
{
  
    {
        yyval = builder.float_(yyvs[yyvs.length-1-((2-(2)))], /*negate=*/true);
      };
  
  return yyval;
},
  503: function (yyval, yyvs)
{
  
    {
        yyval = builder.ident(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  504: function (yyval, yyvs)
{
  
    {
        yyval = builder.ivar(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  505: function (yyval, yyvs)
{
  
    {
        yyval = builder.gvar(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  506: function (yyval, yyvs)
{
  
    {
        yyval = builder.const_(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  507: function (yyval, yyvs)
{
  
    {
        yyval = builder.cvar(yyvs[yyvs.length-1-((1-(1)))]);
      };
  
  return yyval;
},
  508: function (yyval, yyvs)
{
  
    {
      yyval = builder.nil();
    };
  
  return yyval;
},
  509: function (yyval, yyvs)
{
  
    {
      yyval = builder.self();
    };
  
  return yyval;
},
  510: function (yyval, yyvs)
{
  
    {
      yyval = builder.true_();
    };
  
  return yyval;
},
  511: function (yyval, yyvs)
{
  
    {
      yyval = builder.false_();
    };
  
  return yyval;
},
  512: function (yyval, yyvs)
{
  
    {
      yyval = builder._FILE_(lexer.filename);
    };
  
  return yyval;
},
  513: function (yyval, yyvs)
{
  
    {
      yyval = builder._LINE_(lexer.ruby_sourceline);
    };
  
  return yyval;
},
  514: function (yyval, yyvs)
{
  
    {
      yyval = builder._ENCODING_();
    };
  
  return yyval;
},
  515: function (yyval, yyvs)
{
  
    {
      yyval = builder.accessible(yyvs[yyvs.length-1-((1-(1)))]);
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
      yyval = builder.assignable(yyvs[yyvs.length-1-((1-(1)))]);
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
      yyval = builder.nth_ref(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  520: function (yyval, yyvs)
{
  
    {
      yyval = builder.back_ref(yyvs[yyvs.length-1-((1-(1)))]);
    };
  
  return yyval;
},
  521: function (yyval, yyvs)
{
  
    {
      yyval = null;
    };
  
  return yyval;
},
  522: function (yyval, yyvs)
{
  
    {
      lexer.lex_state = EXPR_BEG;
      lexer.command_start = true;
    };
  
  return yyval;
},
  523: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(3)))];
    };
  
  return yyval;
},
  524: function (yyval, yyvs)
{
  
    {
      parser.yyerrok();
      yyval = null;
    };
  
  return yyval;
},
  525: function (yyval, yyvs)
{
  
    {
      yyval = builder.args(yyvs[yyvs.length-1-((3-(2)))]);
      
      lexer.lex_state = EXPR_BEG;
      lexer.command_start = true;
    };
  
  return yyval;
},
  526: function (yyval, yyvs)
{
  
    {
      yyval = builder.args(yyvs[yyvs.length-1-((2-(1)))]);
      
      lexer.lex_state = EXPR_BEG;
      lexer.command_start = true;
    };
  
  return yyval;
},
  527: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  528: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
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
      yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
    };
  
  return yyval;
},
  531: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(2)))];
    };
  
  return yyval;
},
  532: function (yyval, yyvs)
{
  
    {
      yyval = [];
    };
  
  return yyval;
},
  533: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  534: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((8-(1)))].concat(yyvs[yyvs.length-1-((8-(3)))]).concat(yyvs[yyvs.length-1-((8-(5)))]).concat(yyvs[yyvs.length-1-((8-(7)))]).concat(yyvs[yyvs.length-1-((8-(8)))]);
    };
  
  return yyval;
},
  535: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  536: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  537: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  538: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  539: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  540: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  541: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((6-(1)))].concat(yyvs[yyvs.length-1-((6-(3)))]).concat(yyvs[yyvs.length-1-((6-(5)))]).concat(yyvs[yyvs.length-1-((6-(6)))]);
    };
  
  return yyval;
},
  542: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  543: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  544: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((2-(1)))].concat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  545: function (yyval, yyvs)
{
  
    {
      yyval = yyvs[yyvs.length-1-((4-(1)))].concat(yyvs[yyvs.length-1-((4-(3)))]).concat(yyvs[yyvs.length-1-((4-(4)))]);
    };
  
  return yyval;
},
  547: function (yyval, yyvs)
{
  
    {
      yyval = [];
    };
  
  return yyval;
},
  548: function (yyval, yyvs)
{
  
    {
      lexer.yyerror("formal argument cannot be a constant");
    };
  
  return yyval;
},
  549: function (yyval, yyvs)
{
  
    {
      lexer.yyerror("formal argument cannot be an instance variable");
    };
  
  return yyval;
},
  550: function (yyval, yyvs)
{
  
    {
      lexer.yyerror("formal argument cannot be a global variable");
    };
  
  return yyval;
},
  551: function (yyval, yyvs)
{
  
    {
      lexer.yyerror("formal argument cannot be a class variable");
    };
  
  return yyval;
},
  554: function (yyval, yyvs)
{
  
    {
      var f_norm_arg = yyvs[yyvs.length-1-((1-(1)))];
      scope.declare(f_norm_arg[0]);
      
      yyval = builder.arg(f_norm_arg);
    };
  
  return yyval;
},
  555: function (yyval, yyvs)
{
  
    {
      yyval = builder.multi_lhs(yyvs[yyvs.length-1-((3-(2)))]);
    };
  
  return yyval;
},
  556: function (yyval, yyvs)
{
  
    {
      yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
    };
  
  return yyval;
},
  557: function (yyval, yyvs)
{
  
    {
      var f_arg = yyvs[yyvs.length-1-((3-(1)))];
      f_arg.push(yyvs[yyvs.length-1-((3-(3)))]);
      yyval = f_arg;
    };
  
  return yyval;
},
  558: function (yyval, yyvs)
{
  
    {
        var label = yyvs[yyvs.length-1-((2-(1)))];
        lexer.check_kwarg_name(label);

        scope.declare(label[0]);

        yyval = builder.kwoptarg(label, yyvs[yyvs.length-1-((2-(2)))]);
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
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  561: function (yyval, yyvs)
{
  
    {
        var f_block_kwarg = yyvs[yyvs.length-1-((3-(1)))];
        f_block_kwarg.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = f_block_kwarg;
      };
  
  return yyval;
},
  562: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  563: function (yyval, yyvs)
{
  
    {
        var f_kwarg = yyvs[yyvs.length-1-((3-(1)))];
        f_kwarg.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = f_kwarg;
      };
  
  return yyval;
},
  566: function (yyval, yyvs)
{
  
    {
        var ident = yyvs[yyvs.length-1-((2-(2)))];
        scope.declare(ident[0]);
        
        yyval = [ builder.kwrestarg(ident) ];
      };
  
  return yyval;
},
  567: function (yyval, yyvs)
{
  
    {
        yyval = [ builder.kwrestarg() ];
      };
  
  return yyval;
},
  568: function (yyval, yyvs)
{
  
    {
        var ident = yyvs[yyvs.length-1-((3-(1)))];
        scope.declare(ident[0]);
        
        yyval = builder.optarg(ident, yyvs[yyvs.length-1-((3-(3)))]);
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
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  571: function (yyval, yyvs)
{
  
    {
        var f_block_optarg = yyvs[yyvs.length-1-((3-(1)))];
        f_block_optarg.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = f_block_optarg;
      };
  
  return yyval;
},
  572: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  573: function (yyval, yyvs)
{
  
    {
        var f_optarg = yyvs[yyvs.length-1-((3-(1)))];
        f_optarg.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = f_optarg;
      };
  
  return yyval;
},
  576: function (yyval, yyvs)
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
  577: function (yyval, yyvs)
{
  
    {
      yyval = [ builder.restarg() ];
    };
  
  return yyval;
},
  580: function (yyval, yyvs)
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
  581: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((2-(2)))] ];
      };
  
  return yyval;
},
  582: function (yyval, yyvs)
{
  
    {
        yyval = []; // empty
      };
  
  return yyval;
},
  584: function (yyval, yyvs)
{
  
    {
        lexer.lex_state = EXPR_BEG;
      };
  
  return yyval;
},
  585: function (yyval, yyvs)
{
  
    {
        yyval = yyvs[yyvs.length-1-((4-(3)))];
      };
  
  return yyval;
},
  586: function (yyval, yyvs)
{
  
    {
        yyval = [];
      };
  
  return yyval;
},
  588: function (yyval, yyvs)
{
  
    {
        yyval = [ yyvs[yyvs.length-1-((1-(1)))] ];
      };
  
  return yyval;
},
  589: function (yyval, yyvs)
{
  
    {
        var assocs = yyvs[yyvs.length-1-((3-(1)))];
        assocs.push(yyvs[yyvs.length-1-((3-(3)))]);
        yyval = assocs;
      };
  
  return yyval;
},
  590: function (yyval, yyvs)
{
  
    {
      yyval = builder.pair(yyvs[yyvs.length-1-((3-(1)))], yyvs[yyvs.length-1-((3-(3)))]);
    };
  
  return yyval;
},
  591: function (yyval, yyvs)
{
  
    {
      yyval = builder.pair_keyword(yyvs[yyvs.length-1-((2-(1)))], yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  592: function (yyval, yyvs)
{
  
    {
      yyval = builder.kwsplat(yyvs[yyvs.length-1-((2-(2)))]);
    };
  
  return yyval;
},
  614: function (yyval, yyvs)
{
  
    {
        parser.yyerrok();
      };
  
  return yyval;
},
  617: function (yyval, yyvs)
{
  
    {
        parser.yyerrok();
      };
  
  return yyval;
},
  618: function (yyval, yyvs)
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



