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
  }
  
  
  _LINE_: function (ruby_sourceline)
  {
    return n('__LINE__', [ ruby_sourceline ]);
  }
  
}
