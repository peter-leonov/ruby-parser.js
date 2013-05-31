%{
  // alert(123)
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

%token E EOF NUMBER PI

%left '+' '-'
%left '*' '/'
%left '^'
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : e EOF
        {return $1;}
    ;

e
    : e '+' e
        {$$ = $1 + $3;}
    | e '-' e
        {$$ = $1 - $3;}
    | e '*' e
        {$$ = $1 * $3;}
    | e '/' e
        {$$ = $1 / $3;}
    | e '^' e
        {$$ = Math.pow($1, $3);}
    | '-' e %prec UMINUS
        {$$ = -$2;}
    | '(' e ')'
        {$$ = $2;}
    | NUMBER
        {$$ = Number(yyval);}
    | E
        {$$ = Math.E;}
    | PI
        {$$ = Math.PI;}
    ;

%%

var Lexer = (function(){

function Lexer (tokens)
{
  this.tokens = tokens
}

Lexer.prototype =
{
  yylex: function ()
  {
    this.token = this.tokens.shift()
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

var t = YYParser.TOKENS

var lexer = new Lexer
([
  [t.NUMBER, '1'],
  ['+', '+'],
  [t.NUMBER, '3'],
  [t.EOF, '']
])

var parser = new YYParser(lexer)

print(parser.parse())
