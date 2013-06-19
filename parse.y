// at first, read this: http://whitequark.org/blog/2013/04/01/ruby-hacking-guide-ch-11-finite-state-lexer/

%{
;(function(){ // whole parser and lexer namespase start

"use strict";

%}

%code lexer {

// here we know all the token numbers as a list of constant variables
// 
//   var END_OF_INPUT = 0;
//   var keyword_class = 258;
//   var keyword_module = 259;
// 
// and so on.

#include "lexer.js"

}

%code actions {

// here goes the code needed in rules only, when generating nodes,
// we still know all the token numbers here too.
// #include "generator.js"

}

%skeleton "./lalr1.js"

%token       keyword_class keyword_module keyword_def keyword_undef keyword_begin keyword_rescue keyword_ensure keyword_end keyword_if keyword_unless keyword_then keyword_elsif keyword_else keyword_case keyword_when keyword_while keyword_until keyword_for keyword_break keyword_next keyword_redo keyword_retry keyword_in keyword_do keyword_do_cond keyword_do_block keyword_do_LAMBDA keyword_return keyword_yield keyword_super keyword_self keyword_nil keyword_true keyword_false keyword_and keyword_or keyword_not modifier_if modifier_unless modifier_while modifier_until modifier_rescue keyword_alias keyword_defined keyword_BEGIN keyword_END keyword__LINE__ keyword__FILE__ keyword__ENCODING__

%token <id>   tIDENTIFIER tFID tGVAR tIVAR tCONSTANT tCVAR tLABEL
%token <node> tINTEGER tFLOAT tSTRING_CONTENT tCHAR
%token <node> tNTH_REF tBACK_REF
%token <num>  tREGEXP_END

%type <node> singleton strings string string1 xstring regexp
%type <node> string_contents xstring_contents regexp_contents string_content
%type <node> words symbols symbol_list qwords qsymbols word_list qword_list qsym_list word
%type <node> literal numeric dsym cpath
%type <node> top_compstmt top_stmts top_stmt
%type <node> bodystmt compstmt stmts stmt_or_begin stmt expr arg primary command command_call method_call
%type <node> expr_value arg_value primary_value fcall
%type <node> if_tail opt_else case_body cases opt_rescue exc_list exc_var opt_ensure
%type <node> args call_args opt_call_args
%type <node> paren_args opt_paren_args args_tail opt_args_tail block_args_tail opt_block_args_tail
%type <node> command_args aref_args opt_block_arg block_arg var_ref var_lhs
%type <node> command_asgn mrhs superclass block_call block_command
%type <node> f_block_optarg f_block_opt
%type <node> f_arglist f_args f_arg f_arg_item f_optarg f_marg f_marg_list f_margs
%type <node> assoc_list assocs assoc undef_list backref string_dvar for_var
%type <node> block_param opt_block_param block_param_def f_opt
%type <node> f_kwarg f_kw f_block_kwarg f_block_kw
%type <node> bv_decls opt_bv_decl bvar
%type <node> lambda f_larglist lambda_body
%type <node> brace_block cmd_brace_block do_block lhs none fitem
%type <node> mlhs mlhs_head mlhs_basic mlhs_item mlhs_node mlhs_post mlhs_inner
%type <id>   fsym keyword_variable user_variable sym symbol operation operation2 operation3
%type <id>   cname fname op f_rest_arg f_block_arg opt_f_block_arg f_norm_arg f_bad_arg
%type <id>   f_kwrest
/*%%%*/
/*%
%type <val> program reswords then do dot_or_colon
%*/
%token END_OF_INPUT 0    "end-of-input"
%token tUPLUS         "unary+"
%token tUMINUS        "unary-"
%token tPOW           "**"
%token tCMP           "<=>"
%token tEQ            "=="
%token tEQQ           "==="
%token tNEQ           "!="
%token tGEQ           ">="
%token tLEQ           "<="
%token tANDOP         "&&"
%token tOROP          "||"
%token tMATCH         "=~"
%token tNMATCH        "!~"
%token tDOT2          ".."
%token tDOT3          "..."
%token tAREF          "[]"
%token tASET          "[]="
%token tLSHFT         "<<"
%token tRSHFT         ">>"
%token tCOLON2        "::"
%token tCOLON3        ":: at EXPR_BEG"
%token <id> tOP_ASGN    /* +=, -=  etc. */
%token tASSOC         "=>"
%token tLPAREN        "("
%token tLPAREN_ARG    "( arg"
%token tRPAREN        ")"
%token tLBRACK        "["
%token tLBRACE        "{"
%token tLBRACE_ARG    "{ arg"
%token tSTAR          "*"
%token tDSTAR         "**arg"
%token tAMPER         "&"
%token tLAMBDA        "->"
%token tSYMBEG tSTRING_BEG tXSTRING_BEG tREGEXP_BEG tWORDS_BEG tQWORDS_BEG tSYMBOLS_BEG tQSYMBOLS_BEG
%token tSTRING_DBEG tSTRING_DEND tSTRING_DVAR tSTRING_END tLAMBEG

/*
 *    precedence table
 */

%nonassoc tLOWEST
%nonassoc tLBRACE_ARG

%nonassoc  modifier_if modifier_unless modifier_while modifier_until
%left  keyword_or keyword_and
%right keyword_not
%nonassoc keyword_defined
%right '=' tOP_ASGN
%left modifier_rescue
%right '?' ':'
%nonassoc tDOT2 tDOT3
%left  tOROP
%left  tANDOP
%nonassoc  tCMP tEQ tEQQ tNEQ tMATCH tNMATCH
%left  '>' tGEQ '<' tLEQ
%left  '|' '^'
%left  '&'
%left  tLSHFT tRSHFT
%left  '+' '-'
%left  '*' '/' '%'
%right tUMINUS_NUM tUMINUS
%right tPOW
%right '!' '~' tUPLUS

%token tLAST_TOKEN

// in rules we have access to those things:
//   * all the code from prologue (not much though);
//   * `lexer`: instance of our Lexer class from the lexer code block;
//   * $$ and $N through the `yyval` and `yystack` local variables
//   * all the code and variables from `rules` code block.

%%
program
  :
    {
      lexer.lex_state = EXPR_BEG;
      gen.local_push(true);
    }
    top_compstmt
    {}
  ;

top_compstmt
  :
    top_stmts opt_terms
    {}
  ;

top_stmts
  :
  none
    {}
  |
    top_stmt
    {}
  |
    top_stmts terms top_stmt
    {}
  |
    error top_stmt
    {}
  ;

top_stmt
  :
    stmt
  |
    keyword_BEGIN
    {}
    '{' top_compstmt '}'
    {}
  ;

bodystmt:
    compstmt opt_rescue opt_else opt_ensure
    {
      
    }
  ;

compstmt
  :
    stmts opt_terms
    {}
  ;

stmts
  :
    none
    {}
  |
    stmt_or_begin
    {}
  |
    stmts terms stmt_or_begin
    {}
  |
    error stmt
    {}
  ;

stmt_or_begin
  :
    stmt
    {}
  |
    keyword_BEGIN
    {
      lexer.yyerror("BEGIN is permitted only at toplevel");
    }
    '{' top_compstmt '}'
    {}
  ;

stmt
  :
    keyword_alias fitem
    {
      lexer.lex_state = EXPR_FNAME;
    }
    fitem
    {}
  |
    keyword_alias tGVAR tGVAR
    {}
  |
    keyword_alias tGVAR tBACK_REF
    {}
  |
    keyword_alias tGVAR tNTH_REF
    {
      lexer.yyerror("can't make alias for the number variables");
    }
  |
    keyword_undef undef_list
    {}
  |
    stmt modifier_if expr_value
    {}
  |
    stmt modifier_unless expr_value
    {}
  |
    stmt modifier_while expr_value
    {}
  |
    stmt modifier_until expr_value
    {}
  |
    stmt modifier_rescue stmt
    {}
  |
    keyword_END '{' compstmt '}'
    {
      if (lexer.in_def || lexer.in_single)
        rb_warn("END in method; use at_exit");
    }
  |
    command_asgn
  |
    mlhs '=' command_call
    {}
  |
    var_lhs tOP_ASGN command_call
    {}
  |
    primary_value '[' opt_call_args rbracket tOP_ASGN command_call
    {}
  |
    primary_value '.' tIDENTIFIER tOP_ASGN command_call
    {}
  |
    primary_value '.' tCONSTANT tOP_ASGN command_call
    {}
  |
    primary_value tCOLON2 tCONSTANT tOP_ASGN command_call
    {}
  |
    primary_value tCOLON2 tIDENTIFIER tOP_ASGN command_call
    {}
  |
    backref tOP_ASGN command_call
    {}
  |
    lhs '=' mrhs
    {}
  |
    mlhs '=' arg_value
    {}
  |
    mlhs '=' mrhs
    {}
  |
    expr
  ;

command_asgn
  :
    lhs '=' command_call
    {}
  |
    lhs '=' command_asgn
    {}
  ;


expr
  :
    command_call
  |
    expr keyword_and expr
    {}
  | expr keyword_or expr
    {}
  |
    keyword_not opt_nl expr
    {}
  |
    '!' command_call
    {}
  |
    arg
  ;

expr_value
  :
    expr
    {}
  ;

command_call
  :
    command
  |
    block_command
  ;

block_command
  :
    block_call
  |
    block_call dot_or_colon operation2 command_args
    {}
  ;

cmd_brace_block
  :
    tLBRACE_ARG
    {}
    opt_block_param compstmt '}'
    {
      // touching this alters the parse.output
      $<num>2;
    }
  ;

fcall
  :
    operation
    {}
  ;

command
  :
    fcall command_args  %prec tLOWEST
    {}
  |
    fcall command_args cmd_brace_block
    {}
  |
    primary_value '.' operation2 command_args  %prec tLOWEST
    {}
  |
    primary_value '.' operation2 command_args cmd_brace_block
    {}
  |
    primary_value tCOLON2 operation2 command_args    %prec tLOWEST
    {}
  |
    primary_value tCOLON2 operation2 command_args cmd_brace_block
    {}
  |
    keyword_super command_args
    {}
  |
    keyword_yield command_args
    {}
  |
    keyword_return call_args
    {}
  |
    keyword_break call_args
    {}
  |
    keyword_next call_args
    {}
  ;

mlhs
  :
    mlhs_basic
  |
    tLPAREN mlhs_inner rparen
    {}
  ;

mlhs_inner
  :
    mlhs_basic
  |
    tLPAREN mlhs_inner rparen
    {}
  ;

mlhs_basic
  :
    mlhs_head
    {}
  |
    mlhs_head mlhs_item
    {}
  |
    mlhs_head tSTAR mlhs_node
    {}
  |
    mlhs_head tSTAR mlhs_node ',' mlhs_post
    {}
  |
    mlhs_head tSTAR
    {}
  |
    mlhs_head tSTAR ',' mlhs_post
    {}
  |
    tSTAR mlhs_node
    {}
  |
    tSTAR mlhs_node ',' mlhs_post
    {}
  |
    tSTAR
    {}
  | tSTAR ',' mlhs_post
    {}
  ;

mlhs_item
  :
    mlhs_node
  |
    tLPAREN mlhs_inner rparen
    {}
  ;

mlhs_head
  :
    mlhs_item ','
    {}
  |
    mlhs_head mlhs_item ','
    {}
  ;

mlhs_post
  :
    mlhs_item
    {}
  |
    mlhs_post ',' mlhs_item
    {}
  ;

mlhs_node
  :
    user_variable
    {}
  |
    keyword_variable
    {}
  |
    primary_value '[' opt_call_args rbracket
    {}
  |
    primary_value '.' tIDENTIFIER
    {}
  |
    primary_value tCOLON2 tIDENTIFIER
    {}
  |
    primary_value '.' tCONSTANT
    {}
  |
    primary_value tCOLON2 tCONSTANT
    {
      if (lexer.in_def || lexer.in_single)
        lexer.yyerror("dynamic constant assignment");
    }
  |
    tCOLON3 tCONSTANT
    {
      if (lexer.in_def || lexer.in_single)
        lexer.yyerror("dynamic constant assignment");
    }
  |
    backref
    {}
  ;

lhs
  :
    user_variable
    {}
  |
    keyword_variable
    {}
  |
    primary_value '[' opt_call_args rbracket
    {}
  |
    primary_value '.' tIDENTIFIER
    {}
  |
    primary_value tCOLON2 tIDENTIFIER
    {}
  |
    primary_value '.' tCONSTANT
    {}
  |
    primary_value tCOLON2 tCONSTANT
    {
      if (lexer.in_def || lexer.in_single)
        lexer.yyerror("dynamic constant assignment");
    }
  |
    tCOLON3 tCONSTANT
    {
      if (lexer.in_def || lexer.in_single)
        lexer.yyerror("dynamic constant assignment");
    }
  |
    backref
    {}
  ;

cname
  :
    tIDENTIFIER
    {
      lexer.yyerror("class/module name must be CONSTANT");
    }
  |
    tCONSTANT
  ;

cpath
  :
    tCOLON3 cname
    {}
  |
    cname
    {}
  |
    primary_value tCOLON2 cname
    {}
  ;

fname
  :
    tIDENTIFIER
  |
    tCONSTANT
  |
    tFID
  |
    op
    {
      lexer.lex_state = EXPR_ENDFN;
    }
  |
    reswords
    {
      lexer.lex_state = EXPR_ENDFN;
    }
  ;

fsym
  :
    fname
  |
    symbol
  ;

fitem
  :
    fsym
    {}
  |
    dsym
  ;

undef_list
  :
    fitem
    {}
  |
    undef_list ','
    {
      lexer.lex_state = EXPR_FNAME;
    }
    fitem
    {}
  ;

op
  : '|'       {}
  | '^'       {}
  | '&'       {}
  | tCMP      {}
  | tEQ       {}
  | tEQQ      {}
  | tMATCH    {}
  | tNMATCH   {}
  | '>'       {}
  | tGEQ      {}
  | '<'       {}
  | tLEQ      {}
  | tNEQ      {}
  | tLSHFT    {}
  | tRSHFT    {}
  | '+'       {}
  | '-'       {}
  | '*'       {}
  | tSTAR     {}
  | '/'       {}
  | '%'       {}
  | tPOW      {}
  | tDSTAR    {}
  | '!'       {}
  | '~'       {}
  | tUPLUS    {}
  | tUMINUS   {}
  | tAREF     {}
  | tASET     {}
  | '`'       {}
  ;

reswords
  : keyword__LINE__ | keyword__FILE__ | keyword__ENCODING__
  | keyword_BEGIN | keyword_END
  | keyword_alias | keyword_and | keyword_begin
  | keyword_break | keyword_case | keyword_class | keyword_def
  | keyword_defined | keyword_do | keyword_else | keyword_elsif
  | keyword_end | keyword_ensure | keyword_false
  | keyword_for | keyword_in | keyword_module | keyword_next
  | keyword_nil | keyword_not | keyword_or | keyword_redo
  | keyword_rescue | keyword_retry | keyword_return | keyword_self
  | keyword_super | keyword_then | keyword_true | keyword_undef
  | keyword_when | keyword_yield | keyword_if | keyword_unless
  | keyword_while | keyword_until
  ;

arg
  :
    lhs '=' arg
    {}
  |
    lhs '=' arg modifier_rescue arg
    {}
  |
    var_lhs tOP_ASGN arg
    {}
  |
    var_lhs tOP_ASGN arg modifier_rescue arg
    {}
  |
    primary_value '[' opt_call_args rbracket tOP_ASGN arg
    {}
  |
    primary_value '.' tIDENTIFIER tOP_ASGN arg
    {}
  |
    primary_value '.' tCONSTANT tOP_ASGN arg
    {}
  |
    primary_value tCOLON2 tIDENTIFIER tOP_ASGN arg
    {}
  |
    primary_value tCOLON2 tCONSTANT tOP_ASGN arg
    {}
  |
    tCOLON3 tCONSTANT tOP_ASGN arg
    {}
  |
    backref tOP_ASGN arg
    {}
  |
    arg tDOT2 arg
    {}
  |
    arg tDOT3 arg
    {}
  |
    arg '+' arg
    {}
  |
    arg '-' arg
    {}
  |
    arg '*' arg
    {}
  |
    arg '/' arg
    {}
  |
    arg '%' arg
    {}
  |
    arg tPOW arg
    {}
  |
    tUMINUS_NUM tINTEGER tPOW arg
    {}
  |
    tUMINUS_NUM tFLOAT tPOW arg
    {}
  |
    tUPLUS arg
    {}
  |
    tUMINUS arg
    {}
  |
    arg '|' arg
    {}
  |
    arg '^' arg
    {}
  |
    arg '&' arg
    {}
  |
    arg tCMP arg
    {}
  |
    arg '>' arg
    {}
  |
    arg tGEQ arg
    {}
  |
    arg '<' arg
    {}
  |
    arg tLEQ arg
    {}
  |
    arg tEQ arg
    {}
  |
    arg tEQQ arg
    {}
  |
    arg tNEQ arg
    {}
  |
    arg tMATCH arg
    {}
  |
    arg tNMATCH arg
    {}
  |
    '!' arg
    {}
  |
    '~' arg
    {}
  |
    arg tLSHFT arg
    {}
  |
    arg tRSHFT arg
    {}
  |
    arg tANDOP arg
    {}
  |
    arg tOROP arg
    {}
  |
    keyword_defined opt_nl { lexer.in_defined = true;} arg
    {
      lexer.in_defined = false;
    }
  |
    arg '?' arg opt_nl ':' arg
    {}
  |
    primary
    {}
  ;

arg_value
  :
    arg
    {}
  ;

aref_args    : none
        | args trailer
            {}
        | args ',' assocs trailer
            {}
        | assocs trailer
            {}
        ;

paren_args    : '(' opt_call_args rparen
            {}
        ;

opt_paren_args    : none
        | paren_args
        ;

opt_call_args    : none
        | call_args
        | args ','
            {}
        | args ',' assocs ','
            {}
        | assocs ','
            {}
        ;

call_args    : command
            {}
        | args opt_block_arg
            {}
        | assocs opt_block_arg
            {}
        | args ',' assocs opt_block_arg
            {}
        | block_arg
        ;

command_args
  :
    {
      $<val>$ = lexer.cmdarg_stack;
      lexer.CMDARG_PUSH(1);
    }
    call_args
    {
      // CMDARG_POP()
      lexer.cmdarg_stack = $<val>1;
    }
  ;

block_arg    : tAMPER arg_value
            {}
        ;

opt_block_arg    : ',' block_arg
            {}
        | none
            {}
        ;

args        : arg_value
            {}
        | tSTAR arg_value
            {}
        | args ',' arg_value
            {}
        | args ',' tSTAR arg_value
            {}
        ;

mrhs        : args ',' arg_value
            {}
        | args ',' tSTAR arg_value
            {}
        | tSTAR arg_value
            {}
        ;

primary        : literal
        | strings
        | xstring
        | regexp
        | words
        | qwords
        | symbols
        | qsymbols
        | var_ref
        | backref
        | tFID
            {}
        | k_begin
            {
              $<val>1 = lexer.cmdarg_stack;
              lexer.cmdarg_stack = 0;
            }
          bodystmt
          k_end
            {
              lexer.cmdarg_stack = $<val>1;
              // touching this alters the parse.output
          $<num>2;
            }
        | tLPAREN_ARG
        {
          lexer.lex_state = EXPR_ENDARG;
        }
        rparen
            {}
        | tLPAREN_ARG expr
        {
          lexer.lex_state = EXPR_ENDARG;
        }
        rparen
            {}
        | tLPAREN compstmt ')'
            {}
        | primary_value tCOLON2 tCONSTANT
            {}
        | tCOLON3 tCONSTANT
            {}
        | tLBRACK aref_args ']'
            {}
        | tLBRACE assoc_list '}'
            {}
        | keyword_return
            {}
        | keyword_yield '(' call_args rparen
            {}
        | keyword_yield '(' rparen
            {}
        | keyword_yield
            {}
        | keyword_defined opt_nl '(' { lexer.in_defined = true;} expr rparen
            {
              lexer.in_defined = false;
            }
        | keyword_not '(' expr rparen
            {}
        | keyword_not '(' rparen
            {}
        | fcall brace_block
            {}
        | method_call
        | method_call brace_block
            {}
        | tLAMBDA lambda
            {}
        | k_if expr_value then
          compstmt
          if_tail
          k_end
            {}
        | k_unless expr_value then
          compstmt
          opt_else
          k_end
            {}
        | k_while
          {
            lexer.COND_PUSH(1);
          }
          expr_value do
          {
            lexer.COND_POP();
          }
          compstmt
          k_end
            {}
        | k_until
        {
          lexer.COND_PUSH(1);
        }
        expr_value do
        {
          lexer.COND_POP();
        }
          compstmt
          k_end
            {}
        | k_case expr_value opt_terms
          case_body
          k_end
            {}
        | k_case opt_terms case_body k_end
            {}
        | k_for for_var keyword_in
          {
            lexer.COND_PUSH(1);
          }
          expr_value do
          {
            lexer.COND_POP();
          }
          compstmt
          k_end
            {}
        | k_class cpath superclass
            {
          if (lexer.in_def || lexer.in_single)
            lexer.yyerror("class definition in method body");
                
            }
          bodystmt
          k_end
            {
              // touching this alters the parse.output
                $<num>4;
            }
        | k_class tLSHFT expr
            {
          $<num>$ = lexer.in_def;
          lexer.in_def = 0;
            }
          term
            {
              $<num>$ = lexer.in_single;
              lexer.in_single = 0;
            }
          bodystmt
          k_end
            {
          lexer.in_def = $<num>4;
          lexer.in_single = $<num>6;
            }
        | k_module cpath
            {
          if (lexer.in_def || lexer.in_single)
            lexer.yyerror("module definition in method body");
                
            }
          bodystmt
          k_end
            {
              // touching this alters the parse.output
                $<num>3;
            }
        | k_def fname
            {
              $<id>$ = lexer.cur_mid; // TODO
                lexer.cur_mid = $2;
                
              lexer.in_def++;
            }
          f_arglist
          bodystmt
          k_end
            {
              // touching this alters the parse.output
                $<num>1;
                lexer.in_def--;
                lexer.cur_mid = $<id>3;
            }
  |
    k_def singleton dot_or_colon
    {
      lexer.lex_state = EXPR_FNAME;
    }
    fname
    {
      lexer.in_single++;
      lexer.lex_state = EXPR_ENDFN; /* force for args */
    }
    f_arglist
    bodystmt
    k_end
    {
      lexer.in_single--;
    }
        | keyword_break
            {}
        | keyword_next
            {}
        | keyword_redo
            {}
        | keyword_retry
            {}
        ;

primary_value    : primary
            {}
        ;

k_begin        : keyword_begin
            {}
        ;

k_if        : keyword_if
            {}
        ;

k_unless    : keyword_unless
            {}
        ;

k_while        : keyword_while
            {}
        ;

k_until        : keyword_until
            {}
        ;

k_case        : keyword_case
            {}
        ;

k_for        : keyword_for
            {}
        ;

k_class        : keyword_class
            {}
        ;

k_module    : keyword_module
            {}
        ;

k_def        : keyword_def
            {}
        ;

k_end        : keyword_end
            {}
        ;

then        : term
        | keyword_then
        | term keyword_then
        ;

do        : term
        | keyword_do_cond
        ;

if_tail        : opt_else
        | keyword_elsif expr_value then
          compstmt
          if_tail
            {}
        ;

opt_else    : none
        | keyword_else compstmt
            {}
        ;

for_var        : lhs
        | mlhs
        ;

f_marg        : f_norm_arg
            {}
        | tLPAREN f_margs rparen
            {}
        ;

f_marg_list    : f_marg
            {}
        | f_marg_list ',' f_marg
            {}
        ;

f_margs        : f_marg_list
            {}
        | f_marg_list ',' tSTAR f_norm_arg
            {}
        | f_marg_list ',' tSTAR f_norm_arg ',' f_marg_list
            {}
        | f_marg_list ',' tSTAR
            {}
        | f_marg_list ',' tSTAR ',' f_marg_list
            {}
        | tSTAR f_norm_arg
            {}
        | tSTAR f_norm_arg ',' f_marg_list
            {}
        | tSTAR
            {}
        | tSTAR ',' f_marg_list
            {}
        ;


block_args_tail    : f_block_kwarg ',' f_kwrest opt_f_block_arg
            {}
        | f_block_kwarg opt_f_block_arg
            {}
        | f_kwrest opt_f_block_arg
            {}
        | f_block_arg
            {}
        ;

opt_block_args_tail : ',' block_args_tail
            {}
        | /* none */
            {}
        ;

block_param    : f_arg ',' f_block_optarg ',' f_rest_arg opt_block_args_tail
            {}
        | f_arg ',' f_block_optarg ',' f_rest_arg ',' f_arg opt_block_args_tail
            {}
        | f_arg ',' f_block_optarg opt_block_args_tail
            {}
        | f_arg ',' f_block_optarg ',' f_arg opt_block_args_tail
            {}
                | f_arg ',' f_rest_arg opt_block_args_tail
            {}
        | f_arg ','
            {}
        | f_arg ',' f_rest_arg ',' f_arg opt_block_args_tail
            {}
        | f_arg opt_block_args_tail
            {}
        | f_block_optarg ',' f_rest_arg opt_block_args_tail
            {}
        | f_block_optarg ',' f_rest_arg ',' f_arg opt_block_args_tail
            {}
        | f_block_optarg opt_block_args_tail
            {}
        | f_block_optarg ',' f_arg opt_block_args_tail
            {}
        | f_rest_arg opt_block_args_tail
            {}
        | f_rest_arg ',' f_arg opt_block_args_tail
            {}
        | block_args_tail
            {}
        ;

opt_block_param    : none
        | block_param_def
            {
            lexer.command_start = true;
            }
        ;

block_param_def    : '|' opt_bv_decl '|'
            {}
        | tOROP
            {}
        | '|' block_param opt_bv_decl '|'
            {}
        ;


opt_bv_decl    : opt_nl
            {}
        | opt_nl ';' bv_decls opt_nl
            {}
        ;

bv_decls    : bvar
        | bv_decls ',' bvar
        ;

bvar        : tIDENTIFIER
            {}
        | f_bad_arg
            {}
        ;

lambda        :   {}
            {
              $<num>$ = lexer.lpar_beg;
              lexer.lpar_beg = ++lexer.paren_nest;
            }
          f_larglist
          lambda_body
            {
          lexer.lpar_beg = $<num>2;
          // touching this alters the parse.output
          $<vars>1;
            }
        ;

f_larglist    : '(' f_args opt_bv_decl ')'
            {}
        | f_args
            {}
        ;

lambda_body    : tLAMBEG compstmt '}'
            {}
        | keyword_do_LAMBDA compstmt keyword_end
            {}
        ;

do_block    : keyword_do_block
            {}
          opt_block_param
          compstmt
          keyword_end
            {
          // touching this alters the parse.output
        $<num>2;
              $<vars>1;
            }
        ;

block_call    : command do_block
            {}
        | block_call dot_or_colon operation2 opt_paren_args
            {}
        | block_call dot_or_colon operation2 opt_paren_args brace_block
            {}
        | block_call dot_or_colon operation2 command_args do_block
            {}
        ;

method_call    : fcall paren_args
            {}
        | primary_value '.' operation2
            {}
          opt_paren_args
            {
              // touching this alters the parse.output
                $<num>4;
            }
        | primary_value tCOLON2 operation2
            {}
          paren_args
            {
              // touching this alters the parse.output
                $<num>4
            }
        | primary_value tCOLON2 operation3
            {}
        | primary_value '.'
            {}
          paren_args
            {
          // touching this alters the parse.output
          nd_set_line($$, $<num>3);
            }
        | primary_value tCOLON2
            {}
          paren_args
            {
          // touching this alters the parse.output
          $<num>3;
            }
        | keyword_super paren_args
            {}
        | keyword_super
            {}
        | primary_value '[' opt_call_args rbracket
            {}
        ;

brace_block    : '{'
            {}
          opt_block_param
          compstmt '}'
            {
              // touching this alters the parse.output
          $<num>2;
            }
        | keyword_do
            {}
          opt_block_param
          compstmt keyword_end
            {
          // touching this alters the parse.output
          $<num>2;
            }
        ;

case_body    : keyword_when args then
          compstmt
          cases
            {}
        ;

cases        : opt_else
        | case_body
        ;

opt_rescue    : keyword_rescue exc_list exc_var then
          compstmt
          opt_rescue
            {}
        | none
        ;

exc_list    : arg_value
            {}
        | mrhs
            {}
        | none
        ;

exc_var        : tASSOC lhs
            {}
        | none
        ;

opt_ensure    : keyword_ensure compstmt
            {}
        | none
        ;

literal        : numeric
        | symbol
            {}
        | dsym
        ;

strings        : string
            {}
        ;

string        : tCHAR
        | string1
        | string string1
            {}
        ;

string1        : tSTRING_BEG string_contents tSTRING_END
            {}
        ;

xstring        : tXSTRING_BEG xstring_contents tSTRING_END
            {}
        ;

regexp        : tREGEXP_BEG regexp_contents tREGEXP_END
            {}
        ;

words        : tWORDS_BEG ' ' tSTRING_END
            {}
        | tWORDS_BEG word_list tSTRING_END
            {}
        ;

word_list    : /* none */
            {}
        | word_list word ' '
            {}
        ;

word        : string_content
        | word string_content
            {}
        ;

symbols            : tSYMBOLS_BEG ' ' tSTRING_END
            {}
        | tSYMBOLS_BEG symbol_list tSTRING_END
            {}
        ;

symbol_list    : /* none */
            {}
        | symbol_list word ' '
            {}
        ;

qwords        : tQWORDS_BEG ' ' tSTRING_END
            {}
        | tQWORDS_BEG qword_list tSTRING_END
            {}
        ;

qsymbols    : tQSYMBOLS_BEG ' ' tSTRING_END
            {}
        | tQSYMBOLS_BEG qsym_list tSTRING_END
            {}
        ;

qword_list    : /* none */
            {}
        | qword_list tSTRING_CONTENT ' '
            {}
        ;

qsym_list    : /* none */
            {}
        | qsym_list tSTRING_CONTENT ' '
            {}
        ;

string_contents : /* none */
            {}
        | string_contents string_content
            {}
        ;

xstring_contents: /* none */
            {}
        | xstring_contents string_content
            {}
        ;

regexp_contents: /* none */
            {}
        | regexp_contents string_content
            {}
        ;

string_content    : tSTRING_CONTENT
        | tSTRING_DVAR
            {
            $<node>$ = lexer.lex_strterm;
            lexer.lex_strterm = null;
            lexer.lex_state = EXPR_BEG;
            }
          string_dvar
            {
            /*%%%*/
            lexer.lex_strterm = $<node>2;
            }
        | tSTRING_DBEG
            {
          $<val>1 = lexer.cond_stack;
          $<val>$ = lexer.cmdarg_stack;
          lexer.cond_stack = 0;
          lexer.cmdarg_stack = 0;
            }
            {
            $<node>$ = lexer.lex_strterm;
            lexer.lex_strterm = null;
            lexer.lex_state = EXPR_BEG;
            }
            {
            $<num>$ = lexer.brace_nest;
            lexer.brace_nest = 0;
            }
          compstmt tSTRING_DEND
            {
          lexer.cond_stack = $<val>1;
          lexer.cmdarg_stack = $<val>2;
          lexer.lex_strterm = $<node>3;
          lexer.brace_nest = $<num>4;
            }
        ;

string_dvar    : tGVAR
            {}
        | tIVAR
            {}
        | tCVAR
            {}
        | backref
        ;

symbol        : tSYMBEG sym
            {
            lexer.lex_state = EXPR_END;
            }
        ;

sym        : fname
        | tIVAR
        | tGVAR
        | tCVAR
        ;

dsym        : tSYMBEG xstring_contents tSTRING_END
            {
            lexer.lex_state = EXPR_END;
            }
        ;

numeric     : tINTEGER
        | tFLOAT
        | tUMINUS_NUM tINTEGER           %prec tLOWEST
            {
            }
        | tUMINUS_NUM tFLOAT           %prec tLOWEST
            {
            }
        ;

user_variable    : tIDENTIFIER
        | tIVAR
        | tGVAR
        | tCONSTANT
        | tCVAR
        ;

keyword_variable: keyword_nil {}
        | keyword_self {$$ = keyword_self;}
        | keyword_true {$$ = keyword_true;}
        | keyword_false {$$ = keyword_false;}
        | keyword__FILE__ {$$ = keyword__FILE__;}
        | keyword__LINE__ {$$ = keyword__LINE__;}
        | keyword__ENCODING__ {$$ = keyword__ENCODING__;}
        ;

var_ref        : user_variable
            {
            }
        | keyword_variable
            {}
        ;

var_lhs        : user_variable
            {}
        | keyword_variable
            {}
        ;

backref        : tNTH_REF
        | tBACK_REF
        ;

superclass    : term
            {}
        | '<'
            {
            lexer.lex_state = EXPR_BEG;
            lexer.command_start = true;
            }
          expr_value term
            {}
        | error term
            {
              yyerrok();
            }
        ;

f_arglist    : '(' f_args rparen
            {
            lexer.lex_state = EXPR_BEG;
            lexer.command_start = true;
            }
        | f_args term
            {
            lexer.lex_state = EXPR_BEG;
            lexer.command_start = true;
            }
        ;

args_tail    : f_kwarg ',' f_kwrest opt_f_block_arg
            {}
        | f_kwarg opt_f_block_arg
            {}
        | f_kwrest opt_f_block_arg
            {}
        | f_block_arg
            {}
        ;

opt_args_tail    : ',' args_tail
            {}
        | /* none */
            {}
        ;

f_args        : f_arg ',' f_optarg ',' f_rest_arg opt_args_tail
            {}
        | f_arg ',' f_optarg ',' f_rest_arg ',' f_arg opt_args_tail
            {}
        | f_arg ',' f_optarg opt_args_tail
            {}
        | f_arg ',' f_optarg ',' f_arg opt_args_tail
            {}
        | f_arg ',' f_rest_arg opt_args_tail
            {}
        | f_arg ',' f_rest_arg ',' f_arg opt_args_tail
            {}
        | f_arg opt_args_tail
            {}
        | f_optarg ',' f_rest_arg opt_args_tail
            {}
        | f_optarg ',' f_rest_arg ',' f_arg opt_args_tail
            {}
        | f_optarg opt_args_tail
            {}
        | f_optarg ',' f_arg opt_args_tail
            {}
        | f_rest_arg opt_args_tail
            {}
        | f_rest_arg ',' f_arg opt_args_tail
            {}
        | args_tail
            {}
        | /* none */
            {}
        ;

f_bad_arg    : tCONSTANT
            {
              lexer.yyerror("formal argument cannot be a constant");
            }
        | tIVAR
            {
              lexer.yyerror("formal argument cannot be an instance variable");
            }
        | tGVAR
            {
              lexer.yyerror("formal argument cannot be a global variable");
            }
        | tCVAR
            {
              lexer.yyerror("formal argument cannot be a class variable");
            }
        ;

f_norm_arg    : f_bad_arg
        | tIDENTIFIER
            {}
        ;

f_arg_item    : f_norm_arg
            {}
        | tLPAREN f_margs rparen
            {}
        ;

f_arg        : f_arg_item
        | f_arg ',' f_arg_item
            {}
        ;

f_kw        : tLABEL arg_value
            {}
        ;

f_block_kw    : tLABEL primary_value
            {}
        ;

f_block_kwarg    : f_block_kw
            {}
        | f_block_kwarg ',' f_block_kw
            {}
        ;


f_kwarg        : f_kw
            {}
        | f_kwarg ',' f_kw
            {}
        ;

kwrest_mark    : tPOW
        | tDSTAR
        ;

f_kwrest    : kwrest_mark tIDENTIFIER
            {}
        | kwrest_mark
            {}
        ;

f_opt        : tIDENTIFIER '=' arg_value
            {}
        ;

f_block_opt    : tIDENTIFIER '=' primary_value
            {}
        ;

f_block_optarg    : f_block_opt
            {}
        | f_block_optarg ',' f_block_opt
            {}
        ;

f_optarg    : f_opt
            {}
        | f_optarg ',' f_opt
            {}
        ;

restarg_mark    : '*'
        | tSTAR
        ;

f_rest_arg    : restarg_mark tIDENTIFIER
            {
          if (!lexer.is_local_id($2)) // TODO
            lexer.yyerror("rest argument must be local variable");
                
            }
        | restarg_mark
            {}
        ;

blkarg_mark    : '&'
        | tAMPER
        ;

f_block_arg    : blkarg_mark tIDENTIFIER
            {
              if (!lexer.is_local_id($2))
            lexer.yyerror("block argument must be local variable");
                else if (!lexer.dyna_in_block() && lexer.local_id($2))
            lexer.yyerror("duplicated block argument name");
                
            }
        ;

opt_f_block_arg    : ',' f_block_arg
            {}
        | none
            {}
        ;

singleton    : var_ref
            {}
        | '('
        {
          lexer.lex_state = EXPR_BEG;
        }
        expr rparen
            {
          if ($3 == 0) {
            lexer.yyerror("can't define singleton method for ().");
          }
          else {
            switch (nd_type($3)) { // TODO
              case NODE_STR:
              case NODE_DSTR:
              case NODE_XSTR:
              case NODE_DXSTR:
              case NODE_DREGX:
              case NODE_LIT:
              case NODE_ARRAY:
              case NODE_ZARRAY:
                lexer.yyerror("can't define singleton method for literals");
              default:
                value_expr($3); // TODO
                break;
            }
          }
            }
        ;

assoc_list    : none
        | assocs trailer
            {}
        ;

assocs        : assoc
        | assocs ',' assoc
            {}
        ;

assoc        : arg_value tASSOC arg_value
            {}
        | tLABEL arg_value
            {}
        | tDSTAR arg_value
            {}
        ;

        ;

operation    : tIDENTIFIER
        | tCONSTANT
        | tFID
        ;

operation2    : tIDENTIFIER
        | tCONSTANT
        | tFID
        | op
        ;

operation3    : tIDENTIFIER
        | tFID
        | op
        ;

dot_or_colon    : '.'
        | tCOLON2
        ;

opt_terms    : /* none */
        | terms
        ;

opt_nl        : /* none */
        | '\n'
        ;

rparen        : opt_nl ')'
        ;

rbracket    : opt_nl ']'
        ;

trailer        : /* none */
        | '\n'
        | ','
        ;

term        : ';' {yyerrok();}
        | '\n'
        ;

terms        : term
        | terms ';' {yyerrok();}
        ;

none        : /* none */
            {}
        ;

%%


// Exports part.
// Here we have to expose our YY* classes to outer world somehow.
// And yes, all the two YYParser and YYLexer are visible here

global.parse = function (text)
{
  var lexer = new YYLexer(text);
  lexer.filename = 'ruby.rb';
  
  var parser = new YYParser(lexer);
  return parser.parse();
}

})(); // whole parser and lexer namespase start
