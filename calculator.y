%{
var result
%}
%pure_parser

%language "java"
%skeleton "./lalr1.js"
%output "calculator.js"

/* description: Parses end evaluates mathematical expressions. */

/* lexical grammar */
// %lex
// %%
// \s+                   {/* skip whitespace */}
// [0-9]+("."[0-9]+)?\b  {return 'NUMBER';}
// "*"                   {return '*';}
// "/"                   {return '/';}
// "-"                   {return '-';}
// "+"                   {return '+';}
// "^"                   {return '^';}
// "("                   {return '(';}
// ")"                   {return ')';}
// "PI"                  {return 'PI';}
// "E"                   {return 'E';}
// <<EOF>>               {return 'EOF';}
// 
// /lex

/* operator associations and precedence */

%token E END NUMBER PI L R

%left PLUS MINUS
%left MULT DIV
%left POW
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : e END
        {result = $1;}
    ;

e
    : e PLUS e
        {$$ = $1 + $3;}
    | e MINUS e
        {$$ = $1 - $3;}
    | e MULT e
        {$$ = $1 * $3;}
    | e DIV e
        {$$ = $1 / $3;}
    | e POW e
        {$$ = Math.pow($1, $3);}
    | MINUS e %prec UMINUS
        {$$ = -$2;}
    | L e R
        {$$ = $2;}
    | NUMBER
        {$$ = Number(yyval);}
    | E
        {$$ = Math.E;}
    | PI
        {$$ = Math.PI;}
    ;

%%

var T = YYParser.TOKENS

var Lexer = (function(){

function Lexer (tokens)
{
  this.tokens = tokens
}

Lexer.prototype =
{
  yylex: function ()
  {
    if (this.tokens.length == 0)
      return T.EOF
    
    this.token = this.tokens.shift()
    print('yylex', this.token)
    return this.token[0]
  },

  getLVal: function ()
  {
    return this.token[1]
  },

  getStartPos: function ()
  {
    return 0
  },

  getEndPos: function ()
  {
    return 1
  },

  yyerror: function () {}
}

return Lexer

})();

this.console = {log: print}

// (3+2*3)/-3
var lexer = new Lexer
([
  [T.L, '('],
  [T.L, '('],
  [T.NUMBER, '3'],
  [T.PLUS, '+'],
  [T.NUMBER, '2'],
  [T.MULT, '*'],
  [T.NUMBER, '3'],
  [T.R, ')'],
  [T.MULT, '*'],
  [T.NUMBER, '1'],
  [T.R, ')'],
  [T.DIV, '/'],
  [T.MINUS, '-'],
  [T.NUMBER, '3'],
  [T.END, '']
])

var parser = new YYParser(lexer)

print(parser.parse())
print(result == -3)
