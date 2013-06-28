// port of the Builder class from https://github.com/whitequark/parser

#include "builder-scope.js"
#include "builder-node.js"

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
// and much more had been deleted in 037f36d283a52c580dd1eef6e9cd0576ce81e902


function Builder (lexer)
{
  this.lexer = lexer;
}

Builder.prototype =
{
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
        var children = cond.children;
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
        var children = cond.children;
        children[0] = this.check_condition(children[0]); // lhs
        children[1] = this.check_condition(children[1]); // rhs

        return cond;

      case 'irange': case 'erange':
        var children = cond.children;
        children[0] = this.check_condition(children[0]); // lhs
        children[1] = this.check_condition(children[1]); // rhs

        // irange => iflipflop
        // erange => eflipflop
        var type = cond.type == 'irange' ? 'iflipflop' : 'eflipflop'

        return n(type, children);

      case 'regexp':
        return n('match_current_line', [ cond ], null)

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
        begin.synthesized_from_compstmt = true;
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
  
  const_: function (identifier)
  {
    return n('const', [ null, identifier ]);
  },
  
  accessible: function (node)
  {
    switch (node.type)
    {
      case 'ident':
        var name = node.children[0];
        if (this.scope.is_declared(name))
        {
          return n('lvar', [ name ]);
        }
        else
        {
          return n('send', [ null, name ]);
        }

      case '__FILE__':
        return n('str', [ lexer.ruby_filename ]);

      case '__LINE__':
        // TODO: use line from node value
        return n('int', [ lexer.ruby_sourceline ]); 

      case '__ENCODING__':
        return n('const', [ 'UTF-16' ]);

      default:
        return node;
    }
  },

  integer: function (number, negate)
  {
    return n('int', [ negate ? -number : number ]);
  },

  assignable: function (node)
  {
    var children = node.children;
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
        if (lexer.in_def)
        {
          // TODO
          // diagnostic :error, :dynamic_const, node.loc.expression
        }

        return n('casgn', children);
        return node;

      case 'gvar':
        return n('gvasgn', children);

      case 'nil': case 'self': case 'true': case 'false':
      case '__FILE__': case '__LINE__': case '__ENCODING__':
        // TODO
        // diagnostic :error, :invalid_assignment, node.loc.expression
      break;

      case 'back_ref': case 'nth_ref':
        // TODO
        // diagnostic :error, :backref_assignment, node.loc.expression
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

    if (ensure)
    {
      compound_stmt = n('ensure', [ compound_stmt, ensure ]);
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
    
    if (body.type == 'begin' && body.synthesized_from_compstmt)
    {
      // Synthesized (begin) from compstmt "a; b".
      return n('kwbegin', body.children);
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
    var to   = this.gvar(gvar1);
    var from = this.back_ref(gvar2);
    
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
        // TODO
        // diagnostic :error, :backref_assignment, lhs.loc.expression
        return null;
    }
  },
  
  index: function (receiver, indexes)
  {
    // TODO: refactor all `concat()`s to avoid garbage arrays
    return n('send', [ receiver, "[]" ].concat(indexes));
  },
  
  call_method: function (receiver, dot_t, selector_t, args /*=[]*/)
  {
    // empty `selector_t` indicates this call form: `a.()`,
    // transform it to `a.call()`
    var ary = [ receiver, selector_t || "call" ];
    var node = n('send', args ? ary.concat(args) : ary);
    
    // to distinguish `a.b` from `a::b`
    node.op = dot_t;
    
    return node;
  },
  
  associate: function (pairs)
  {
    return n('hash', pairs.slice()); // TODO: check all `slices()` are nessry
  }
  
  
  
  
  
  
  
}
