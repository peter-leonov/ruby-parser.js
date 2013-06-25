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
// and much more had been deleted in 037f36d283a52c580dd1eef6e9cd0576ce81e902


// from parse.y
// 
// > in rules (and generator) we have access to those things:
// >   * all the code from prologue (not much though);
// >   * `lexer`: instance of our Lexer class from the lexer code block;
// >   * `parser`: instance of our Parser class;
// >   * $$ and $N through the `yyval` and `yystack` local variables
// >   * all the code and variables from `rules` code block.



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
}

function Node (type, children)
{
  this.type = type;
  this.children = children;
}
Node.prototype.inspect = function ()
{
  var pairs = [];
  for (var k in this)
  {
    if (k == 'type' || k == 'inspect' || k == 'line')
      continue;
    var v = this[k];
    v = (v && v.inspect) ? v.inspect() : JSON.stringify(v);
    pairs.push(k + ': ' + v);
  }
  
  return this.type + '(' + pairs.join(', ') + ')';
}
function n (type, children)
{
  return new Node(typem children);
}


function array (ary)
{
  ary.inspect = function () { return 'array['+this.length+']' } // TODO
  return ary;
}


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
