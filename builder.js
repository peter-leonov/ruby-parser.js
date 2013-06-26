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
        return n('begin', statements);
    }
  },
  
  // BEGIN
  preexe: function (compstmt)
  {
    return n('preexe', [ compstmt ])
  },
  
  ident: function (identifier)
  {
    return n1('ident', identifier)
  },
  
  accessible: function (node)
  {
    switch (node.type)
    {
      case 'ident':
        var name = node.child;
        if (this.scope.is_declared(name))
        {
          return n1('lvar', child);
        }
        else
        {
          return n('send', [ null, name ]);
        }

      case '__FILE__':
        return n1('str', lexer.ruby_filename);

      case '__LINE__':
        return n1('int', lexer.ruby_sourceline); // TODO: use line from node

      case '__ENCODING__':
        return n1('const', 'UTF-16');

      default:
        return node;
    }
  },

  integer: function (number, negate)
  {
    return n1('int', negate ? -number : number);
  },

  assignable: function (node)
  {
    var varname = node.child;
    switch (node.type)
    {
      case 'ident':
        this.scope.declare(varname);
        return n('lvasgn', [varname]);

      case 'ivar':
        return n('ivasgn', [varname]);

      case 'cvar':
        return n('cvasgn', [varname]);

      case 'const':
        if (lexer.in_def)
        {
          // TODO
          // diagnostic :error, :dynamic_const, node.loc.expression
        }

        return n('casgn', [varname]);
        return node;

      case 'gvar':
        return n('gvasgn', [varname]);

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
  
  
}
