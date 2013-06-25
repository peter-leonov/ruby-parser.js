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


// from parse.y
// 
// > in rules (and generator) we have access to those things:
// >   * all the code from prologue (not much though);
// >   * `lexer`: instance of our Lexer class from the lexer code block;
// >   * `parser`: instance of our Parser class;
// >   * $$ and $N through the `yyval` and `yystack` local variables
// >   * all the code and variables from `rules` code block.

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
  }
  
}
