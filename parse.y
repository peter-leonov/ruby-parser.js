%{
"use strict";

// lexer states from lexer.js

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


%}

%skeleton "./lalr1.js"
%output "parse.js"

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
%token END_OF_INPUT 0	"end-of-input"
%token tUPLUS		RUBY_TOKEN_UPLUS  "unary+"
%token tUMINUS		RUBY_TOKEN_UMINUS "unary-"
%token tPOW		RUBY_TOKEN_POW    "**"
%token tCMP		RUBY_TOKEN_CMP    "<=>"
%token tEQ		RUBY_TOKEN_EQ     "=="
%token tEQQ		RUBY_TOKEN_EQQ    "==="
%token tNEQ		RUBY_TOKEN_NEQ    "!="
%token tGEQ		RUBY_TOKEN_GEQ    ">="
%token tLEQ		RUBY_TOKEN_LEQ    "<="
%token tANDOP		"&&"
%token tOROP		"||"
%token tMATCH		RUBY_TOKEN_MATCH  "=~"
%token tNMATCH		RUBY_TOKEN_NMATCH "!~"
%token tDOT2		RUBY_TOKEN_DOT2   ".."
%token tDOT3		RUBY_TOKEN_DOT3   "..."
%token tAREF		RUBY_TOKEN_AREF   "[]"
%token tASET		RUBY_TOKEN_ASET   "[]="
%token tLSHFT		RUBY_TOKEN_LSHFT  "<<"
%token tRSHFT		RUBY_TOKEN_RSHFT  ">>"
%token tCOLON2		"::"
%token tCOLON3		":: at EXPR_BEG"
%token <id> tOP_ASGN	/* +=, -=  etc. */
%token tASSOC		"=>"
%token tLPAREN		"("
%token tLPAREN_ARG	"( arg"
%token tRPAREN		")"
%token tLBRACK		"["
%token tLBRACE		"{"
%token tLBRACE_ARG	"{ arg"
%token tSTAR		"*"
%token tDSTAR		"**arg"
%token tAMPER		"&"
%token tLAMBDA		"->"
%token tSYMBEG tSTRING_BEG tXSTRING_BEG tREGEXP_BEG tWORDS_BEG tQWORDS_BEG tSYMBOLS_BEG tQSYMBOLS_BEG
%token tSTRING_DBEG tSTRING_DEND tSTRING_DVAR tSTRING_END tLAMBEG

/*
 *	precedence table
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

%%
program
  :
    {
      yylexer.state = EXPR_BEG;
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

bodystmt
  :
    compstmt
    opt_rescue
    opt_else
    opt_ensure
    {}
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
      yyerror("BEGIN is permitted only at toplevel");
    }
    '{' top_compstmt '}'
    {}
  ;

stmt
  :
    keyword_alias fitem
    {
      yylexer.state = EXPR_FNAME;
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
      yyerror("can't make alias for the number variables");
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
    {}
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
    primary_value tCOLON2 operation2 command_args	%prec tLOWEST
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
    {}
  |
    tCOLON3 tCONSTANT
    {}
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
    {}
  |
    tCOLON3 tCONSTANT
    {}
  |
    backref
    {}
  ;

cname
  :
    tIDENTIFIER
    {}
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
      yylexer.state = EXPR_ENDFN;
    }
  |
    reswords
    {
      yylexer.state = EXPR_ENDFN;
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
      yylexer.state = EXPR_FNAME;
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
  : lhs '=' arg
		    {
		    /*%%%*/
			value_expr($3);
			$$ = node_assign($1, $3);
		    /*%
			$$ = dispatch2(assign, $1, $3);
		    %*/
		    }
		| lhs '=' arg modifier_rescue arg
		    {
		    /*%%%*/
			value_expr($3);
		        $3 = NEW_RESCUE($3, NEW_RESBODY(0,$5,0), 0);
			$$ = node_assign($1, $3);
		    /*%
			$$ = dispatch2(assign, $1, dispatch2(rescue_mod, $3, $5));
		    %*/
		    }
		| var_lhs tOP_ASGN arg
		    {
			value_expr($3);
			$$ = new_op_assign($1, $2, $3);
		    }
		| var_lhs tOP_ASGN arg modifier_rescue arg
		    {
		    /*%%%*/
			value_expr($3);
		        $3 = NEW_RESCUE($3, NEW_RESBODY(0,$5,0), 0);
		    /*%
			$3 = dispatch2(rescue_mod, $3, $5);
		    %*/
			$$ = new_op_assign($1, $2, $3);
		    }
		| primary_value '[' opt_call_args rbracket tOP_ASGN arg
		    {
		    /*%%%*/
			NODE *args;

			value_expr($6);
			if (!$3) $3 = NEW_ZARRAY();
			if (nd_type($3) == NODE_BLOCK_PASS) {
			    args = NEW_ARGSCAT($3, $6);
			}
		        else {
			    args = arg_concat($3, $6);
		        }
			if ($5 == tOROP) {
			    $5 = 0;
			}
			else if ($5 == tANDOP) {
			    $5 = 1;
			}
			$$ = NEW_OP_ASGN1($1, $5, args);
			fixpos($$, $1);
		    /*%
			$1 = dispatch2(aref_field, $1, escape_Qundef($3));
			$$ = dispatch3(opassign, $1, $5, $6);
		    %*/
		    }
		| primary_value '.' tIDENTIFIER tOP_ASGN arg
		    {
			value_expr($5);
			$$ = new_attr_op_assign($1, ripper_id2sym('.'), $3, $4, $5);
		    }
		| primary_value '.' tCONSTANT tOP_ASGN arg
		    {
			value_expr($5);
			$$ = new_attr_op_assign($1, ripper_id2sym('.'), $3, $4, $5);
		    }
		| primary_value tCOLON2 tIDENTIFIER tOP_ASGN arg
		    {
			value_expr($5);
			$$ = new_attr_op_assign($1, ripper_intern("::"), $3, $4, $5);
		    }
		| primary_value tCOLON2 tCONSTANT tOP_ASGN arg
		    {
		    /*%%%*/
			$$ = NEW_COLON2($1, $3);
			$$ = new_const_op_assign($$, $4, $5);
		    /*%
			$$ = dispatch2(const_path_field, $1, $3);
			$$ = dispatch3(opassign, $$, $4, $5);
		    %*/
		    }
		| tCOLON3 tCONSTANT tOP_ASGN arg
		    {
		    /*%%%*/
			$$ = NEW_COLON3($2);
			$$ = new_const_op_assign($$, $3, $4);
		    /*%
			$$ = dispatch1(top_const_field, $2);
			$$ = dispatch3(opassign, $$, $3, $4);
		    %*/
		    }
		| backref tOP_ASGN arg
		    {
		    /*%%%*/
			rb_backref_error($1);
			$$ = (0);
		    /*%
			$$ = dispatch1(var_field, $1);
			$$ = dispatch3(opassign, $$, $2, $3);
			$$ = dispatch1(assign_error, $$);
		    %*/
		    }
		| arg tDOT2 arg
		    {
		    /*%%%*/
			value_expr($1);
			value_expr($3);
			$$ = NEW_DOT2($1, $3);
			if (nd_type($1) == NODE_LIT && FIXNUM_P($1->nd_lit) &&
			    nd_type($3) == NODE_LIT && FIXNUM_P($3->nd_lit)) {
			    deferred_nodes = list_append(deferred_nodes, $$);
			}
		    /*%
			$$ = dispatch2(dot2, $1, $3);
		    %*/
		    }
		| arg tDOT3 arg
		    {
		    /*%%%*/
			value_expr($1);
			value_expr($3);
			$$ = NEW_DOT3($1, $3);
			if (nd_type($1) == NODE_LIT && FIXNUM_P($1->nd_lit) &&
			    nd_type($3) == NODE_LIT && FIXNUM_P($3->nd_lit)) {
			    deferred_nodes = list_append(deferred_nodes, $$);
			}
		    /*%
			$$ = dispatch2(dot3, $1, $3);
		    %*/
		    }
		| arg '+' arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, '+', $3);
		    /*%
			$$ = dispatch3(binary, $1, ID2SYM('+'), $3);
		    %*/
		    }
		| arg '-' arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, '-', $3);
		    /*%
			$$ = dispatch3(binary, $1, ID2SYM('-'), $3);
		    %*/
		    }
		| arg '*' arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, '*', $3);
		    /*%
			$$ = dispatch3(binary, $1, ID2SYM('*'), $3);
		    %*/
		    }
		| arg '/' arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, '/', $3);
		    /*%
			$$ = dispatch3(binary, $1, ID2SYM('/'), $3);
		    %*/
		    }
		| arg '%' arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, '%', $3);
		    /*%
			$$ = dispatch3(binary, $1, ID2SYM('%'), $3);
		    %*/
		    }
		| arg tPOW arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, tPOW, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("**"), $3);
		    %*/
		    }
		| tUMINUS_NUM tINTEGER tPOW arg
		    {
		    /*%%%*/
			$$ = NEW_CALL(call_bin_op($2, tPOW, $4), tUMINUS, 0);
		    /*%
			$$ = dispatch3(binary, $2, ripper_intern("**"), $4);
			$$ = dispatch2(unary, ripper_intern("-@"), $$);
		    %*/
		    }
		| tUMINUS_NUM tFLOAT tPOW arg
		    {
		    /*%%%*/
			$$ = NEW_CALL(call_bin_op($2, tPOW, $4), tUMINUS, 0);
		    /*%
			$$ = dispatch3(binary, $2, ripper_intern("**"), $4);
			$$ = dispatch2(unary, ripper_intern("-@"), $$);
		    %*/
		    }
		| tUPLUS arg
		    {
		    /*%%%*/
			$$ = call_uni_op($2, tUPLUS);
		    /*%
			$$ = dispatch2(unary, ripper_intern("+@"), $2);
		    %*/
		    }
		| tUMINUS arg
		    {
		    /*%%%*/
			$$ = call_uni_op($2, tUMINUS);
		    /*%
			$$ = dispatch2(unary, ripper_intern("-@"), $2);
		    %*/
		    }
		| arg '|' arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, '|', $3);
		    /*%
			$$ = dispatch3(binary, $1, ID2SYM('|'), $3);
		    %*/
		    }
		| arg '^' arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, '^', $3);
		    /*%
			$$ = dispatch3(binary, $1, ID2SYM('^'), $3);
		    %*/
		    }
		| arg '&' arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, '&', $3);
		    /*%
			$$ = dispatch3(binary, $1, ID2SYM('&'), $3);
		    %*/
		    }
		| arg tCMP arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, tCMP, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("<=>"), $3);
		    %*/
		    }
		| arg '>' arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, '>', $3);
		    /*%
			$$ = dispatch3(binary, $1, ID2SYM('>'), $3);
		    %*/
		    }
		| arg tGEQ arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, tGEQ, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern(">="), $3);
		    %*/
		    }
		| arg '<' arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, '<', $3);
		    /*%
			$$ = dispatch3(binary, $1, ID2SYM('<'), $3);
		    %*/
		    }
		| arg tLEQ arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, tLEQ, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("<="), $3);
		    %*/
		    }
		| arg tEQ arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, tEQ, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("=="), $3);
		    %*/
		    }
		| arg tEQQ arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, tEQQ, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("==="), $3);
		    %*/
		    }
		| arg tNEQ arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, tNEQ, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("!="), $3);
		    %*/
		    }
		| arg tMATCH arg
		    {
		    /*%%%*/
			$$ = match_op($1, $3);
                        if (nd_type($1) == NODE_LIT && RB_TYPE_P($1->nd_lit, T_REGEXP)) {
                            $$ = reg_named_capture_assign($1->nd_lit, $$);
                        }
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("=~"), $3);
		    %*/
		    }
		| arg tNMATCH arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, tNMATCH, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("!~"), $3);
		    %*/
		    }
		| '!' arg
		    {
		    /*%%%*/
			$$ = call_uni_op(cond($2), '!');
		    /*%
			$$ = dispatch2(unary, ID2SYM('!'), $2);
		    %*/
		    }
		| '~' arg
		    {
		    /*%%%*/
			$$ = call_uni_op($2, '~');
		    /*%
			$$ = dispatch2(unary, ID2SYM('~'), $2);
		    %*/
		    }
		| arg tLSHFT arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, tLSHFT, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("<<"), $3);
		    %*/
		    }
		| arg tRSHFT arg
		    {
		    /*%%%*/
			$$ = call_bin_op($1, tRSHFT, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern(">>"), $3);
		    %*/
		    }
		| arg tANDOP arg
		    {
		    /*%%%*/
			$$ = logop(NODE_AND, $1, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("&&"), $3);
		    %*/
		    }
		| arg tOROP arg
		    {
		    /*%%%*/
			$$ = logop(NODE_OR, $1, $3);
		    /*%
			$$ = dispatch3(binary, $1, ripper_intern("||"), $3);
		    %*/
		    }
		| keyword_defined opt_nl {in_defined = 1;} arg
		    {
		    /*%%%*/
			in_defined = 0;
			$$ = NEW_DEFINED($4);
		    /*%
			in_defined = 0;
			$$ = dispatch1(defined, $4);
		    %*/
		    }
		| arg '?' arg opt_nl ':' arg
		    {
		    /*%%%*/
			value_expr($1);
			$$ = NEW_IF(cond($1), $3, $6);
			fixpos($$, $1);
		    /*%
			$$ = dispatch3(ifop, $1, $3, $6);
		    %*/
		    }
		| primary
		    {
			$$ = $1;
		    }
		;

arg_value	: arg
		    {
		    /*%%%*/
			value_expr($1);
			$$ = $1;
		        if (!$$) $$ = NEW_NIL();
		    /*%
			$$ = $1;
		    %*/
		    }
		;

aref_args	: none
		| args trailer
		    {
			$$ = $1;
		    }
		| args ',' assocs trailer
		    {
		    /*%%%*/
			$$ = arg_append($1, NEW_HASH($3));
		    /*%
			$$ = arg_add_assocs($1, $3);
		    %*/
		    }
		| assocs trailer
		    {
		    /*%%%*/
			$$ = NEW_LIST(NEW_HASH($1));
		    /*%
			$$ = arg_add_assocs(arg_new(), $1);
		    %*/
		    }
		;

paren_args	: '(' opt_call_args rparen
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(arg_paren, escape_Qundef($2));
		    %*/
		    }
		;

opt_paren_args	: none
		| paren_args
		;

opt_call_args	: none
		| call_args
		| args ','
		    {
		      $$ = $1;
		    }
		| args ',' assocs ','
		    {
		    /*%%%*/
			$$ = arg_append($1, NEW_HASH($3));
		    /*%
			$$ = arg_add_assocs($1, $3);
		    %*/
		    }
		| assocs ','
		    {
		    /*%%%*/
			$$ = NEW_LIST(NEW_HASH($1));
		    /*%
			$$ = arg_add_assocs(arg_new(), $1);
		    %*/
		    }
		;

call_args	: command
		    {
		    /*%%%*/
			value_expr($1);
			$$ = NEW_LIST($1);
		    /*%
			$$ = arg_add(arg_new(), $1);
		    %*/
		    }
		| args opt_block_arg
		    {
		    /*%%%*/
			$$ = arg_blk_pass($1, $2);
		    /*%
			$$ = arg_add_optblock($1, $2);
		    %*/
		    }
		| assocs opt_block_arg
		    {
		    /*%%%*/
			$$ = NEW_LIST(NEW_HASH($1));
			$$ = arg_blk_pass($$, $2);
		    /*%
			$$ = arg_add_assocs(arg_new(), $1);
			$$ = arg_add_optblock($$, $2);
		    %*/
		    }
		| args ',' assocs opt_block_arg
		    {
		    /*%%%*/
			$$ = arg_append($1, NEW_HASH($3));
			$$ = arg_blk_pass($$, $4);
		    /*%
			$$ = arg_add_optblock(arg_add_assocs($1, $3), $4);
		    %*/
		    }
		| block_arg
		    /*%c%*/
		    /*%c
		    {
			$$ = arg_add_block(arg_new(), $1);
		    }
		    %*/
		;

command_args	:  {
			$<val>$ = cmdarg_stack;
			CMDARG_PUSH(1);
		    }
		  call_args
		    {
			/* CMDARG_POP() */
			cmdarg_stack = $<val>1;
			$$ = $2;
		    }
		;

block_arg	: tAMPER arg_value
		    {
		    /*%%%*/
			$$ = NEW_BLOCK_PASS($2);
		    /*%
			$$ = $2;
		    %*/
		    }
		;

opt_block_arg	: ',' block_arg
		    {
			$$ = $2;
		    }
		| none
		    {
			$$ = 0;
		    }
		;

args		: arg_value
		    {
		    /*%%%*/
			$$ = NEW_LIST($1);
		    /*%
			$$ = arg_add(arg_new(), $1);
		    %*/
		    }
		| tSTAR arg_value
		    {
		    /*%%%*/
			$$ = NEW_SPLAT($2);
		    /*%
			$$ = arg_add_star(arg_new(), $2);
		    %*/
		    }
		| args ',' arg_value
		    {
		    /*%%%*/
			NODE *n1;
			if ((n1 = splat_array($1)) != 0) {
			    $$ = list_append(n1, $3);
			}
			else {
			    $$ = arg_append($1, $3);
			}
		    /*%
			$$ = arg_add($1, $3);
		    %*/
		    }
		| args ',' tSTAR arg_value
		    {
		    /*%%%*/
			NODE *n1;
			if ((nd_type($4) == NODE_ARRAY) && (n1 = splat_array($1)) != 0) {
			    $$ = list_concat(n1, $4);
			}
			else {
			    $$ = arg_concat($1, $4);
			}
		    /*%
			$$ = arg_add_star($1, $4);
		    %*/
		    }
		;

mrhs		: args ',' arg_value
		    {
		    /*%%%*/
			NODE *n1;
			if ((n1 = splat_array($1)) != 0) {
			    $$ = list_append(n1, $3);
			}
			else {
			    $$ = arg_append($1, $3);
			}
		    /*%
			$$ = mrhs_add(args2mrhs($1), $3);
		    %*/
		    }
		| args ',' tSTAR arg_value
		    {
		    /*%%%*/
			NODE *n1;
			if (nd_type($4) == NODE_ARRAY &&
			    (n1 = splat_array($1)) != 0) {
			    $$ = list_concat(n1, $4);
			}
			else {
			    $$ = arg_concat($1, $4);
			}
		    /*%
			$$ = mrhs_add_star(args2mrhs($1), $4);
		    %*/
		    }
		| tSTAR arg_value
		    {
		    /*%%%*/
			$$ = NEW_SPLAT($2);
		    /*%
			$$ = mrhs_add_star(mrhs_new(), $2);
		    %*/
		    }
		;

primary		: literal
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
		    {
		    /*%%%*/
			$$ = NEW_FCALL($1, 0);
		    /*%
			$$ = method_arg(dispatch1(fcall, $1), arg_new());
		    %*/
		    }
		| k_begin
		    {
			$<val>1 = cmdarg_stack;
			cmdarg_stack = 0;
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*%
		    %*/
		    }
		  bodystmt
		  k_end
		    {
			cmdarg_stack = $<val>1;
		    /*%%%*/
			if ($3 == NULL) {
			    $$ = NEW_NIL();
			}
			else {
			    if (nd_type($3) == NODE_RESCUE ||
				nd_type($3) == NODE_ENSURE)
				nd_set_line($3, $<num>2);
			    $$ = ($3);
			}
			nd_set_line($$, $<num>2);
		    /*%
			$$ = dispatch1(begin, $3);
		    %*/
		    }
		| tLPAREN_ARG {yylexer.state = EXPR_ENDARG;} rparen
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = dispatch1(paren, 0);
		    %*/
		    }
		| tLPAREN_ARG expr {yylexer.state = EXPR_ENDARG;} rparen
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(paren, $2);
		    %*/
		    }
		| tLPAREN compstmt ')'
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(paren, $2);
		    %*/
		    }
		| primary_value tCOLON2 tCONSTANT
		    {
		    /*%%%*/
			$$ = NEW_COLON2($1, $3);
		    /*%
			$$ = dispatch2(const_path_ref, $1, $3);
		    %*/
		    }
		| tCOLON3 tCONSTANT
		    {
		    /*%%%*/
			$$ = NEW_COLON3($2);
		    /*%
			$$ = dispatch1(top_const_ref, $2);
		    %*/
		    }
		| tLBRACK aref_args ']'
		    {
		    /*%%%*/
			if ($2 == 0) {
			    $$ = NEW_ZARRAY(); /* zero length array*/
			}
			else {
			    $$ = $2;
			}
		    /*%
			$$ = dispatch1(array, escape_Qundef($2));
		    %*/
		    }
		| tLBRACE assoc_list '}'
		    {
		    /*%%%*/
			$$ = NEW_HASH($2);
		    /*%
			$$ = dispatch1(hash, escape_Qundef($2));
		    %*/
		    }
		| keyword_return
		    {
		    /*%%%*/
			$$ = NEW_RETURN(0);
		    /*%
			$$ = dispatch0(return0);
		    %*/
		    }
		| keyword_yield '(' call_args rparen
		    {
		    /*%%%*/
			$$ = new_yield($3);
		    /*%
			$$ = dispatch1(yield, dispatch1(paren, $3));
		    %*/
		    }
		| keyword_yield '(' rparen
		    {
		    /*%%%*/
			$$ = NEW_YIELD(0);
		    /*%
			$$ = dispatch1(yield, dispatch1(paren, arg_new()));
		    %*/
		    }
		| keyword_yield
		    {
		    /*%%%*/
			$$ = NEW_YIELD(0);
		    /*%
			$$ = dispatch0(yield0);
		    %*/
		    }
		| keyword_defined opt_nl '(' {in_defined = 1;} expr rparen
		    {
		    /*%%%*/
			in_defined = 0;
			$$ = NEW_DEFINED($5);
		    /*%
			in_defined = 0;
			$$ = dispatch1(defined, $5);
		    %*/
		    }
		| keyword_not '(' expr rparen
		    {
		    /*%%%*/
			$$ = call_uni_op(cond($3), '!');
		    /*%
			$$ = dispatch2(unary, ripper_intern("not"), $3);
		    %*/
		    }
		| keyword_not '(' rparen
		    {
		    /*%%%*/
			$$ = call_uni_op(cond(NEW_NIL()), '!');
		    /*%
			$$ = dispatch2(unary, ripper_intern("not"), Qnil);
		    %*/
		    }
		| fcall brace_block
		    {
		    /*%%%*/
			$2->nd_iter = $1;
			$$ = $2;
		    /*%
			$$ = method_arg(dispatch1(fcall, $1), arg_new());
			$$ = method_add_block($$, $2);
		    %*/
		    }
		| method_call
		| method_call brace_block
		    {
		    /*%%%*/
			block_dup_check($1->nd_args, $2);
			$2->nd_iter = $1;
			$$ = $2;
		    /*%
			$$ = method_add_block($1, $2);
		    %*/
		    }
		| tLAMBDA lambda
		    {
			$$ = $2;
		    }
		| k_if expr_value then
		  compstmt
		  if_tail
		  k_end
		    {
		    /*%%%*/
			$$ = NEW_IF(cond($2), $4, $5);
			fixpos($$, $2);
		    /*%
			$$ = dispatch3(if, $2, $4, escape_Qundef($5));
		    %*/
		    }
		| k_unless expr_value then
		  compstmt
		  opt_else
		  k_end
		    {
		    /*%%%*/
			$$ = NEW_UNLESS(cond($2), $4, $5);
			fixpos($$, $2);
		    /*%
			$$ = dispatch3(unless, $2, $4, escape_Qundef($5));
		    %*/
		    }
		| k_while {COND_PUSH(1);} expr_value do {COND_POP();}
		  compstmt
		  k_end
		    {
		    /*%%%*/
			$$ = NEW_WHILE(cond($3), $6, 1);
			fixpos($$, $3);
		    /*%
			$$ = dispatch2(while, $3, $6);
		    %*/
		    }
		| k_until {COND_PUSH(1);} expr_value do {COND_POP();}
		  compstmt
		  k_end
		    {
		    /*%%%*/
			$$ = NEW_UNTIL(cond($3), $6, 1);
			fixpos($$, $3);
		    /*%
			$$ = dispatch2(until, $3, $6);
		    %*/
		    }
		| k_case expr_value opt_terms
		  case_body
		  k_end
		    {
		    /*%%%*/
			$$ = NEW_CASE($2, $4);
			fixpos($$, $2);
		    /*%
			$$ = dispatch2(case, $2, $4);
		    %*/
		    }
		| k_case opt_terms case_body k_end
		    {
		    /*%%%*/
			$$ = NEW_CASE(0, $3);
		    /*%
			$$ = dispatch2(case, Qnil, $3);
		    %*/
		    }
		| k_for for_var keyword_in
		  {COND_PUSH(1);}
		  expr_value do
		  {COND_POP();}
		  compstmt
		  k_end
		    {
		    /*%%%*/
			/*
			 *  for a, b, c in e
			 *  #=>
			 *  e.each{|*x| a, b, c = x
			 *
			 *  for a in e
			 *  #=>
			 *  e.each{|x| a, = x}
			 */
			ID id = internal_id();
			ID *tbl = ALLOC_N(ID, 2);
			NODE *m = NEW_ARGS_AUX(0, 0);
			NODE *args, *scope;

			if (nd_type($2) == NODE_MASGN) {
			    /* if args.length == 1 && args[0].kind_of?(Array)
			     *   args = args[0]
			     * end
			     */
			    NODE *one = NEW_LIST(NEW_LIT(INT2FIX(1)));
			    NODE *zero = NEW_LIST(NEW_LIT(INT2FIX(0)));
			    m->nd_next = block_append(
				NEW_IF(
				    NEW_NODE(NODE_AND,
					     NEW_CALL(NEW_CALL(NEW_DVAR(id), idLength, 0),
						      idEq, one),
					     NEW_CALL(NEW_CALL(NEW_DVAR(id), idAREF, zero),
						      rb_intern("kind_of?"), NEW_LIST(NEW_LIT(rb_cArray))),
					     0),
				    NEW_DASGN_CURR(id,
						   NEW_CALL(NEW_DVAR(id), idAREF, zero)),
				    0),
				node_assign($2, NEW_DVAR(id)));

			    args = new_args(m, 0, id, 0, new_args_tail(0, 0, 0));
			}
			else {
			    if (nd_type($2) == NODE_LASGN ||
				nd_type($2) == NODE_DASGN ||
				nd_type($2) == NODE_DASGN_CURR) {
				$2->nd_value = NEW_DVAR(id);
				m->nd_plen = 1;
				m->nd_next = $2;
				args = new_args(m, 0, 0, 0, new_args_tail(0, 0, 0));
			    }
			    else {
				m->nd_next = node_assign(NEW_MASGN(NEW_LIST($2), 0), NEW_DVAR(id));
				args = new_args(m, 0, id, 0, new_args_tail(0, 0, 0));
			    }
			}
			scope = NEW_NODE(NODE_SCOPE, tbl, $8, args);
			tbl[0] = 1; tbl[1] = id;
			$$ = NEW_FOR(0, $5, scope);
			fixpos($$, $2);
		    /*%
			$$ = dispatch3(for, $2, $5, $8);
		    %*/
		    }
		| k_class cpath superclass
		    {
			if (in_def || in_single)
			    yyerror("class definition in method body");
			local_push(0);
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*%
		    %*/
		    }
		  bodystmt
		  k_end
		    {
		    /*%%%*/
			$$ = NEW_CLASS($2, $5, $3);
			nd_set_line($$, $<num>4);
		    /*%
			$$ = dispatch3(class, $2, $3, $5);
		    %*/

		    }
		| k_class tLSHFT expr
		    {
			$<num>$ = in_def;
			in_def = 0;
		    }
		  term
		    {
			$<num>$ = in_single;
			in_single = 0;
			local_push(0);
		    }
		  bodystmt
		  k_end
		    {
		    /*%%%*/
			$$ = NEW_SCLASS($3, $7);
			fixpos($$, $3);
		    /*%
			$$ = dispatch2(sclass, $3, $7);
		    %*/

			in_def = $<num>4;
			in_single = $<num>6;
		    }
		| k_module cpath
		    {
			if (in_def || in_single)
			    yyerror("module definition in method body");
			local_push(0);
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*%
		    %*/
		    }
		  bodystmt
		  k_end
		    {
		    /*%%%*/
			$$ = NEW_MODULE($2, $4);
			nd_set_line($$, $<num>3);
		    /*%
			$$ = dispatch2(module, $2, $4);
		    %*/

		    }
		| k_def fname
		    {
			$<id>$ = cur_mid;
			cur_mid = $2;
			in_def++;
			local_push(0);
		    }
		  f_arglist
		  bodystmt
		  k_end
		    {
		    /*%%%*/
			NODE *body = remove_begin($5);
			reduce_nodes(&body);
			$$ = NEW_DEFN($2, $4, body, NOEX_PRIVATE);
			nd_set_line($$, $<num>1);
		    /*%
			$$ = dispatch3(def, $2, $4, $5);
		    %*/

			in_def--;
			cur_mid = $<id>3;
		    }
		| k_def singleton dot_or_colon {yylexer.state = EXPR_FNAME;} fname
		    {
			in_single++;
			yylexer.state = EXPR_ENDFN; /* force for args */
			local_push(0);
		    }
		  f_arglist
		  bodystmt
		  k_end
		    {
		    /*%%%*/
			NODE *body = remove_begin($8);
			reduce_nodes(&body);
			$$ = NEW_DEFS($2, $5, $7, body);
			nd_set_line($$, $<num>1);
		    /*%
			$$ = dispatch5(defs, $2, $3, $5, $7, $8);
		    %*/

			in_single--;
		    }
		| keyword_break
		    {
		    /*%%%*/
			$$ = NEW_BREAK(0);
		    /*%
			$$ = dispatch1(break, arg_new());
		    %*/
		    }
		| keyword_next
		    {
		    /*%%%*/
			$$ = NEW_NEXT(0);
		    /*%
			$$ = dispatch1(next, arg_new());
		    %*/
		    }
		| keyword_redo
		    {
		    /*%%%*/
			$$ = NEW_REDO();
		    /*%
			$$ = dispatch0(redo);
		    %*/
		    }
		| keyword_retry
		    {
		    /*%%%*/
			$$ = NEW_RETRY();
		    /*%
			$$ = dispatch0(retry);
		    %*/
		    }
		;

primary_value	: primary
		    {
		    /*%%%*/
			value_expr($1);
			$$ = $1;
		        if (!$$) $$ = NEW_NIL();
		    /*%
			$$ = $1;
		    %*/
		    }
		;

k_begin		: keyword_begin
		    {
			token_info_push("begin");
		    }
		;

k_if		: keyword_if
		    {
			token_info_push("if");
		    }
		;

k_unless	: keyword_unless
		    {
			token_info_push("unless");
		    }
		;

k_while		: keyword_while
		    {
			token_info_push("while");
		    }
		;

k_until		: keyword_until
		    {
			token_info_push("until");
		    }
		;

k_case		: keyword_case
		    {
			token_info_push("case");
		    }
		;

k_for		: keyword_for
		    {
			token_info_push("for");
		    }
		;

k_class		: keyword_class
		    {
			token_info_push("class");
		    }
		;

k_module	: keyword_module
		    {
			token_info_push("module");
		    }
		;

k_def		: keyword_def
		    {
			token_info_push("def");
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*%
		    %*/
		    }
		;

k_end		: keyword_end
		    {
			token_info_pop("end");
		    }
		;

then		: term
		    /*%c%*/
		    /*%c
		    { $$ = Qnil; }
		    %*/
		| keyword_then
		| term keyword_then
		    /*%c%*/
		    /*%c
		    { $$ = $2; }
		    %*/
		;

do		: term
		    /*%c%*/
		    /*%c
		    { $$ = Qnil; }
		    %*/
		| keyword_do_cond
		;

if_tail		: opt_else
		| keyword_elsif expr_value then
		  compstmt
		  if_tail
		    {
		    /*%%%*/
			$$ = NEW_IF(cond($2), $4, $5);
			fixpos($$, $2);
		    /*%
			$$ = dispatch3(elsif, $2, $4, escape_Qundef($5));
		    %*/
		    }
		;

opt_else	: none
		| keyword_else compstmt
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(else, $2);
		    %*/
		    }
		;

for_var		: lhs
		| mlhs
		;

f_marg		: f_norm_arg
		    {
			$$ = assignable($1, 0);
		    /*%%%*/
		    /*%
			$$ = dispatch1(mlhs_paren, $$);
		    %*/
		    }
		| tLPAREN f_margs rparen
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(mlhs_paren, $2);
		    %*/
		    }
		;

f_marg_list	: f_marg
		    {
		    /*%%%*/
			$$ = NEW_LIST($1);
		    /*%
			$$ = mlhs_add(mlhs_new(), $1);
		    %*/
		    }
		| f_marg_list ',' f_marg
		    {
		    /*%%%*/
			$$ = list_append($1, $3);
		    /*%
			$$ = mlhs_add($1, $3);
		    %*/
		    }
		;

f_margs		: f_marg_list
		    {
		    /*%%%*/
			$$ = NEW_MASGN($1, 0);
		    /*%
			$$ = $1;
		    %*/
		    }
		| f_marg_list ',' tSTAR f_norm_arg
		    {
			$$ = assignable($4, 0);
		    /*%%%*/
			$$ = NEW_MASGN($1, $$);
		    /*%
			$$ = mlhs_add_star($1, $$);
		    %*/
		    }
		| f_marg_list ',' tSTAR f_norm_arg ',' f_marg_list
		    {
			$$ = assignable($4, 0);
		    /*%%%*/
			$$ = NEW_MASGN($1, NEW_POSTARG($$, $6));
		    /*%
			$$ = mlhs_add_star($1, $$);
		    %*/
		    }
		| f_marg_list ',' tSTAR
		    {
		    /*%%%*/
			$$ = NEW_MASGN($1, -1);
		    /*%
			$$ = mlhs_add_star($1, Qnil);
		    %*/
		    }
		| f_marg_list ',' tSTAR ',' f_marg_list
		    {
		    /*%%%*/
			$$ = NEW_MASGN($1, NEW_POSTARG(-1, $5));
		    /*%
			$$ = mlhs_add_star($1, $5);
		    %*/
		    }
		| tSTAR f_norm_arg
		    {
			$$ = assignable($2, 0);
		    /*%%%*/
			$$ = NEW_MASGN(0, $$);
		    /*%
			$$ = mlhs_add_star(mlhs_new(), $$);
		    %*/
		    }
		| tSTAR f_norm_arg ',' f_marg_list
		    {
			$$ = assignable($2, 0);
		    /*%%%*/
			$$ = NEW_MASGN(0, NEW_POSTARG($$, $4));
		    /*%
		      #if 0
		      TODO: Check me
		      #endif
			$$ = mlhs_add_star($$, $4);
		    %*/
		    }
		| tSTAR
		    {
		    /*%%%*/
			$$ = NEW_MASGN(0, -1);
		    /*%
			$$ = mlhs_add_star(mlhs_new(), Qnil);
		    %*/
		    }
		| tSTAR ',' f_marg_list
		    {
		    /*%%%*/
			$$ = NEW_MASGN(0, NEW_POSTARG(-1, $3));
		    /*%
			$$ = mlhs_add_star(mlhs_new(), Qnil);
		    %*/
		    }
		;


block_args_tail	: f_block_kwarg ',' f_kwrest opt_f_block_arg
		    {
			$$ = new_args_tail($1, $3, $4);
		    }
		| f_block_kwarg opt_f_block_arg
		    {
			$$ = new_args_tail($1, Qnone, $2);
		    }
		| f_kwrest opt_f_block_arg
		    {
			$$ = new_args_tail(Qnone, $1, $2);
		    }
		| f_block_arg
		    {
			$$ = new_args_tail(Qnone, Qnone, $1);
		    }
		;

opt_block_args_tail : ',' block_args_tail
		    {
			$$ = $2;
		    }
		| /* none */
		    {
			$$ = new_args_tail(Qnone, Qnone, Qnone);
		    }
		;

block_param	: f_arg ',' f_block_optarg ',' f_rest_arg opt_block_args_tail
		    {
			$$ = new_args($1, $3, $5, Qnone, $6);
		    }
		| f_arg ',' f_block_optarg ',' f_rest_arg ',' f_arg opt_block_args_tail
		    {
			$$ = new_args($1, $3, $5, $7, $8);
		    }
		| f_arg ',' f_block_optarg opt_block_args_tail
		    {
			$$ = new_args($1, $3, Qnone, Qnone, $4);
		    }
		| f_arg ',' f_block_optarg ',' f_arg opt_block_args_tail
		    {
			$$ = new_args($1, $3, Qnone, $5, $6);
		    }
                | f_arg ',' f_rest_arg opt_block_args_tail
		    {
			$$ = new_args($1, Qnone, $3, Qnone, $4);
		    }
		| f_arg ','
		    {
			$$ = new_args($1, Qnone, 1, Qnone, new_args_tail(Qnone, Qnone, Qnone));
		    /*%%%*/
		    /*%
                        dispatch1(excessed_comma, $$);
		    %*/
		    }
		| f_arg ',' f_rest_arg ',' f_arg opt_block_args_tail
		    {
			$$ = new_args($1, Qnone, $3, $5, $6);
		    }
		| f_arg opt_block_args_tail
		    {
			$$ = new_args($1, Qnone, Qnone, Qnone, $2);
		    }
		| f_block_optarg ',' f_rest_arg opt_block_args_tail
		    {
			$$ = new_args(Qnone, $1, $3, Qnone, $4);
		    }
		| f_block_optarg ',' f_rest_arg ',' f_arg opt_block_args_tail
		    {
			$$ = new_args(Qnone, $1, $3, $5, $6);
		    }
		| f_block_optarg opt_block_args_tail
		    {
			$$ = new_args(Qnone, $1, Qnone, Qnone, $2);
		    }
		| f_block_optarg ',' f_arg opt_block_args_tail
		    {
			$$ = new_args(Qnone, $1, Qnone, $3, $4);
		    }
		| f_rest_arg opt_block_args_tail
		    {
			$$ = new_args(Qnone, Qnone, $1, Qnone, $2);
		    }
		| f_rest_arg ',' f_arg opt_block_args_tail
		    {
			$$ = new_args(Qnone, Qnone, $1, $3, $4);
		    }
		| block_args_tail
		    {
			$$ = new_args(Qnone, Qnone, Qnone, Qnone, $1);
		    }
		;

opt_block_param	: none
		| block_param_def
		    {
			yylexer.command_start = TRUE;
		    }
		;

block_param_def	: '|' opt_bv_decl '|'
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = blockvar_new(params_new(Qnil,Qnil,Qnil,Qnil,Qnil,Qnil,Qnil),
                                          escape_Qundef($2));
		    %*/
		    }
		| tOROP
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = blockvar_new(params_new(Qnil,Qnil,Qnil,Qnil,Qnil,Qnil,Qnil),
                                          Qnil);
		    %*/
		    }
		| '|' block_param opt_bv_decl '|'
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = blockvar_new(escape_Qundef($2), escape_Qundef($3));
		    %*/
		    }
		;


opt_bv_decl	: opt_nl
		    {
		      $$ = 0;
		    }
		| opt_nl ';' bv_decls opt_nl
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = $3;
		    %*/
		    }
		;

bv_decls	: bvar
		    /*%c%*/
		    /*%c
		    {
			$$ = rb_ary_new3(1, $1);
		    }
		    %*/
		| bv_decls ',' bvar
		    /*%c%*/
		    /*%c
		    {
			rb_ary_push($1, $3);
		    }
		    %*/
		;

bvar		: tIDENTIFIER
		    {
			new_bv(get_id($1));
		    /*%%%*/
		    /*%
			$$ = get_value($1);
		    %*/
		    }
		| f_bad_arg
		    {
			$$ = 0;
		    }
		;

lambda		:   {
			$<vars>$ = dyna_push();
		    }
		    {
			$<num>$ = lpar_beg;
			lpar_beg = ++paren_nest;
		    }
		  f_larglist
		  lambda_body
		    {
			lpar_beg = $<num>2;
		    /*%%%*/
			$$ = NEW_LAMBDA($3, $4);
		    /*%
			$$ = dispatch2(lambda, $3, $4);
		    %*/
			dyna_pop($<vars>1);
		    }
		;

f_larglist	: '(' f_args opt_bv_decl ')'
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(paren, $2);
		    %*/
		    }
		| f_args
		    {
		    /*%%%*/
			$$ = $1;
		    /*%
			$$ = $1;
		    %*/
		    }
		;

lambda_body	: tLAMBEG compstmt '}'
		    {
			$$ = $2;
		    }
		| keyword_do_LAMBDA compstmt keyword_end
		    {
			$$ = $2;
		    }
		;

do_block	: keyword_do_block
		    {
			$<vars>1 = dyna_push();
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*% %*/
		    }
		  opt_block_param
		  compstmt
		  keyword_end
		    {
		    /*%%%*/
			$$ = NEW_ITER($3,$4);
			nd_set_line($$, $<num>2);
		    /*%
			$$ = dispatch2(do_block, escape_Qundef($3), $4);
		    %*/
			dyna_pop($<vars>1);
		    }
		;

block_call	: command do_block
		    {
		    /*%%%*/
			if (nd_type($1) == NODE_YIELD) {
			    compile_error(PARSER_ARG "block given to yield");
			}
			else {
			    block_dup_check($1->nd_args, $2);
			}
			$2->nd_iter = $1;
			$$ = $2;
			fixpos($$, $1);
		    /*%
			$$ = method_add_block($1, $2);
		    %*/
		    }
		| block_call dot_or_colon operation2 opt_paren_args
		    {
		    /*%%%*/
			$$ = NEW_CALL($1, $3, $4);
		    /*%
			$$ = dispatch3(call, $1, $2, $3);
			$$ = method_optarg($$, $4);
		    %*/
		    }
		| block_call dot_or_colon operation2 opt_paren_args brace_block
		    {
		    /*%%%*/
			block_dup_check($4, $5);
			$5->nd_iter = NEW_CALL($1, $3, $4);
			$$ = $5;
			fixpos($$, $1);
		    /*%
			$$ = dispatch4(command_call, $1, $2, $3, $4);
			$$ = method_add_block($$, $5);
		    %*/
		    }
		| block_call dot_or_colon operation2 command_args do_block
		    {
		    /*%%%*/
			block_dup_check($4, $5);
			$5->nd_iter = NEW_CALL($1, $3, $4);
			$$ = $5;
			fixpos($$, $1);
		    /*%
			$$ = dispatch4(command_call, $1, $2, $3, $4);
			$$ = method_add_block($$, $5);
		    %*/
		    }
		;

method_call	: fcall paren_args
		    {
		    /*%%%*/
			$$ = $1;
			$$->nd_args = $2;
		    /*%
			$$ = method_arg(dispatch1(fcall, $1), $2);
		    %*/
		    }
		| primary_value '.' operation2
		    {
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*% %*/
		    }
		  opt_paren_args
		    {
		    /*%%%*/
			$$ = NEW_CALL($1, $3, $5);
			nd_set_line($$, $<num>4);
		    /*%
			$$ = dispatch3(call, $1, ripper_id2sym('.'), $3);
			$$ = method_optarg($$, $5);
		    %*/
		    }
		| primary_value tCOLON2 operation2
		    {
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*% %*/
		    }
		  paren_args
		    {
		    /*%%%*/
			$$ = NEW_CALL($1, $3, $5);
			nd_set_line($$, $<num>4);
		    /*%
			$$ = dispatch3(call, $1, ripper_id2sym('.'), $3);
			$$ = method_optarg($$, $5);
		    %*/
		    }
		| primary_value tCOLON2 operation3
		    {
		    /*%%%*/
			$$ = NEW_CALL($1, $3, 0);
		    /*%
			$$ = dispatch3(call, $1, ripper_intern("::"), $3);
		    %*/
		    }
		| primary_value '.'
		    {
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*% %*/
		    }
		  paren_args
		    {
		    /*%%%*/
			$$ = NEW_CALL($1, rb_intern("call"), $4);
			nd_set_line($$, $<num>3);
		    /*%
			$$ = dispatch3(call, $1, ripper_id2sym('.'),
				       ripper_intern("call"));
			$$ = method_optarg($$, $4);
		    %*/
		    }
		| primary_value tCOLON2
		    {
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*% %*/
		    }
		  paren_args
		    {
		    /*%%%*/
			$$ = NEW_CALL($1, rb_intern("call"), $4);
			nd_set_line($$, $<num>3);
		    /*%
			$$ = dispatch3(call, $1, ripper_intern("::"),
				       ripper_intern("call"));
			$$ = method_optarg($$, $4);
		    %*/
		    }
		| keyword_super paren_args
		    {
		    /*%%%*/
			$$ = NEW_SUPER($2);
		    /*%
			$$ = dispatch1(super, $2);
		    %*/
		    }
		| keyword_super
		    {
		    /*%%%*/
			$$ = NEW_ZSUPER();
		    /*%
			$$ = dispatch0(zsuper);
		    %*/
		    }
		| primary_value '[' opt_call_args rbracket
		    {
		    /*%%%*/
			if ($1 && nd_type($1) == NODE_SELF)
			    $$ = NEW_FCALL(tAREF, $3);
			else
			    $$ = NEW_CALL($1, tAREF, $3);
			fixpos($$, $1);
		    /*%
			$$ = dispatch2(aref, $1, escape_Qundef($3));
		    %*/
		    }
		;

brace_block	: '{'
		    {
			$<vars>1 = dyna_push();
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*%
                    %*/
		    }
		  opt_block_param
		  compstmt '}'
		    {
		    /*%%%*/
			$$ = NEW_ITER($3,$4);
			nd_set_line($$, $<num>2);
		    /*%
			$$ = dispatch2(brace_block, escape_Qundef($3), $4);
		    %*/
			dyna_pop($<vars>1);
		    }
		| keyword_do
		    {
			$<vars>1 = dyna_push();
		    /*%%%*/
			$<num>$ = ruby_sourceline;
		    /*%
                    %*/
		    }
		  opt_block_param
		  compstmt keyword_end
		    {
		    /*%%%*/
			$$ = NEW_ITER($3,$4);
			nd_set_line($$, $<num>2);
		    /*%
			$$ = dispatch2(do_block, escape_Qundef($3), $4);
		    %*/
			dyna_pop($<vars>1);
		    }
		;

case_body	: keyword_when args then
		  compstmt
		  cases
		    {
		    /*%%%*/
			$$ = NEW_WHEN($2, $4, $5);
		    /*%
			$$ = dispatch3(when, $2, $4, escape_Qundef($5));
		    %*/
		    }
		;

cases		: opt_else
		| case_body
		;

opt_rescue	: keyword_rescue exc_list exc_var then
		  compstmt
		  opt_rescue
		    {
		    /*%%%*/
			if ($3) {
			    $3 = node_assign($3, NEW_ERRINFO());
			    $5 = block_append($3, $5);
			}
			$$ = NEW_RESBODY($2, $5, $6);
			fixpos($$, $2?$2:$5);
		    /*%
			$$ = dispatch4(rescue,
				       escape_Qundef($2),
				       escape_Qundef($3),
				       escape_Qundef($5),
				       escape_Qundef($6));
		    %*/
		    }
		| none
		;

exc_list	: arg_value
		    {
		    /*%%%*/
			$$ = NEW_LIST($1);
		    /*%
			$$ = rb_ary_new3(1, $1);
		    %*/
		    }
		| mrhs
		    {
		    /*%%%*/
			if (!($$ = splat_array($1))) $$ = $1;
		    /*%
			$$ = $1;
		    %*/
		    }
		| none
		;

exc_var		: tASSOC lhs
		    {
			$$ = $2;
		    }
		| none
		;

opt_ensure	: keyword_ensure compstmt
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(ensure, $2);
		    %*/
		    }
		| none
		;

literal		: numeric
		| symbol
		    {
		    /*%%%*/
			$$ = NEW_LIT(ID2SYM($1));
		    /*%
			$$ = dispatch1(symbol_literal, $1);
		    %*/
		    }
		| dsym
		;

strings		: string
		    {
		    /*%%%*/
			NODE *node = $1;
			if (!node) {
			    node = NEW_STR(STR_NEW0());
			}
			else {
			    node = evstr2dstr(node);
			}
			$$ = node;
		    /*%
			$$ = $1;
		    %*/
		    }
		;

string		: tCHAR
		| string1
		| string string1
		    {
		    /*%%%*/
			$$ = literal_concat($1, $2);
		    /*%
			$$ = dispatch2(string_concat, $1, $2);
		    %*/
		    }
		;

string1		: tSTRING_BEG string_contents tSTRING_END
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(string_literal, $2);
		    %*/
		    }
		;

xstring		: tXSTRING_BEG xstring_contents tSTRING_END
		    {
		    /*%%%*/
			NODE *node = $2;
			if (!node) {
			    node = NEW_XSTR(STR_NEW0());
			}
			else {
			    switch (nd_type(node)) {
			      case NODE_STR:
				nd_set_type(node, NODE_XSTR);
				break;
			      case NODE_DSTR:
				nd_set_type(node, NODE_DXSTR);
				break;
			      default:
				node = NEW_NODE(NODE_DXSTR, Qnil, 1, NEW_LIST(node));
				break;
			    }
			}
			$$ = node;
		    /*%
			$$ = dispatch1(xstring_literal, $2);
		    %*/
		    }
		;

regexp		: tREGEXP_BEG regexp_contents tREGEXP_END
		    {
		    /*%%%*/
			int options = $3;
			NODE *node = $2;
			NODE *list, *prev;
			if (!node) {
			    node = NEW_LIT(reg_compile(STR_NEW0(), options));
			}
			else switch (nd_type(node)) {
			  case NODE_STR:
			    {
				VALUE src = node->nd_lit;
				nd_set_type(node, NODE_LIT);
				node->nd_lit = reg_compile(src, options);
			    }
			    break;
			  default:
			    node = NEW_NODE(NODE_DSTR, STR_NEW0(), 1, NEW_LIST(node));
			  case NODE_DSTR:
			    if (options & RE_OPTION_ONCE) {
				nd_set_type(node, NODE_DREGX_ONCE);
			    }
			    else {
				nd_set_type(node, NODE_DREGX);
			    }
			    node->nd_cflag = options & RE_OPTION_MASK;
			    if (!NIL_P(node->nd_lit)) reg_fragment_check(node->nd_lit, options);
			    for (list = (prev = node)->nd_next; list; list = list->nd_next) {
				if (nd_type(list->nd_head) == NODE_STR) {
				    VALUE tail = list->nd_head->nd_lit;
				    if (reg_fragment_check(tail, options) && prev && !NIL_P(prev->nd_lit)) {
					VALUE lit = prev == node ? prev->nd_lit : prev->nd_head->nd_lit;
					if (!literal_concat0(parser, lit, tail)) {
					    node = 0;
					    break;
					}
					rb_str_resize(tail, 0);
					prev->nd_next = list->nd_next;
					rb_gc_force_recycle((VALUE)list->nd_head);
					rb_gc_force_recycle((VALUE)list);
					list = prev;
				    }
				    else {
					prev = list;
				    }
                                }
				else {
				    prev = 0;
				}
                            }
			    if (!node->nd_next) {
				VALUE src = node->nd_lit;
				nd_set_type(node, NODE_LIT);
				node->nd_lit = reg_compile(src, options);
			    }
			    break;
			}
			$$ = node;
		    /*%
			$$ = dispatch2(regexp_literal, $2, $3);
		    %*/
		    }
		;

words		: tWORDS_BEG ' ' tSTRING_END
		    {
		    /*%%%*/
			$$ = NEW_ZARRAY();
		    /*%
			$$ = dispatch0(words_new);
			$$ = dispatch1(array, $$);
		    %*/
		    }
		| tWORDS_BEG word_list tSTRING_END
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(array, $2);
		    %*/
		    }
		;

word_list	: /* none */
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = dispatch0(words_new);
		    %*/
		    }
		| word_list word ' '
		    {
		    /*%%%*/
			$$ = list_append($1, evstr2dstr($2));
		    /*%
			$$ = dispatch2(words_add, $1, $2);
		    %*/
		    }
		;

word		: string_content
		    /*%c%*/
		    /*%c
		    {
			$$ = dispatch0(word_new);
			$$ = dispatch2(word_add, $$, $1);
		    }
		    %*/
		| word string_content
		    {
		    /*%%%*/
			$$ = literal_concat($1, $2);
		    /*%
			$$ = dispatch2(word_add, $1, $2);
		    %*/
		    }
		;

symbols	        : tSYMBOLS_BEG ' ' tSTRING_END
		    {
		    /*%%%*/
			$$ = NEW_ZARRAY();
		    /*%
			$$ = dispatch0(symbols_new);
			$$ = dispatch1(array, $$);
		    %*/
		    }
		| tSYMBOLS_BEG symbol_list tSTRING_END
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(array, $2);
		    %*/
		    }
		;

symbol_list	: /* none */
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = dispatch0(symbols_new);
		    %*/
		    }
		| symbol_list word ' '
		    {
		    /*%%%*/
			$2 = evstr2dstr($2);
			nd_set_type($2, NODE_DSYM);
			$$ = list_append($1, $2);
		    /*%
			$$ = dispatch2(symbols_add, $1, $2);
		    %*/
		    }
		;

qwords		: tQWORDS_BEG ' ' tSTRING_END
		    {
		    /*%%%*/
			$$ = NEW_ZARRAY();
		    /*%
			$$ = dispatch0(qwords_new);
			$$ = dispatch1(array, $$);
		    %*/
		    }
		| tQWORDS_BEG qword_list tSTRING_END
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(array, $2);
		    %*/
		    }
		;

qsymbols	: tQSYMBOLS_BEG ' ' tSTRING_END
		    {
		    /*%%%*/
			$$ = NEW_ZARRAY();
		    /*%
			$$ = dispatch0(qsymbols_new);
			$$ = dispatch1(array, $$);
		    %*/
		    }
		| tQSYMBOLS_BEG qsym_list tSTRING_END
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(array, $2);
		    %*/
		    }
		;

qword_list	: /* none */
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = dispatch0(qwords_new);
		    %*/
		    }
		| qword_list tSTRING_CONTENT ' '
		    {
		    /*%%%*/
			$$ = list_append($1, $2);
		    /*%
			$$ = dispatch2(qwords_add, $1, $2);
		    %*/
		    }
		;

qsym_list	: /* none */
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = dispatch0(qsymbols_new);
		    %*/
		    }
		| qsym_list tSTRING_CONTENT ' '
		    {
		    /*%%%*/
			VALUE lit;
			lit = $2->nd_lit;
			$2->nd_lit = ID2SYM(rb_intern_str(lit));
			nd_set_type($2, NODE_LIT);
			$$ = list_append($1, $2);
		    /*%
			$$ = dispatch2(qsymbols_add, $1, $2);
		    %*/
		    }
		;

string_contents : /* none */
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = dispatch0(string_content);
		    %*/
		    }
		| string_contents string_content
		    {
		    /*%%%*/
			$$ = literal_concat($1, $2);
		    /*%
			$$ = dispatch2(string_add, $1, $2);
		    %*/
		    }
		;

xstring_contents: /* none */
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = dispatch0(xstring_new);
		    %*/
		    }
		| xstring_contents string_content
		    {
		    /*%%%*/
			$$ = literal_concat($1, $2);
		    /*%
			$$ = dispatch2(xstring_add, $1, $2);
		    %*/
		    }
		;

regexp_contents: /* none */
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = dispatch0(regexp_new);
		    %*/
		    }
		| regexp_contents string_content
		    {
		    /*%%%*/
			NODE *head = $1, *tail = $2;
			if (!head) {
			    $$ = tail;
			}
			else if (!tail) {
			    $$ = head;
			}
			else {
			    switch (nd_type(head)) {
			      case NODE_STR:
				nd_set_type(head, NODE_DSTR);
				break;
			      case NODE_DSTR:
				break;
			      default:
				head = list_append(NEW_DSTR(Qnil), head);
				break;
			    }
			    $$ = list_append(head, tail);
			}
		    /*%
			$$ = dispatch2(regexp_add, $1, $2);
		    %*/
		    }
		;

string_content	: tSTRING_CONTENT
		| tSTRING_DVAR
		    {
			$<node>$ = yylexer.strterm;
			yylexer.strterm = 0;
			yylexer.state = EXPR_BEG;
		    }
		  string_dvar
		    {
		    /*%%%*/
			yylexer.strterm = $<node>2;
			$$ = NEW_EVSTR($3);
		    }
		| tSTRING_DBEG
		    {
			$<val>1 = cond_stack;
			$<val>$ = cmdarg_stack;
			cond_stack = 0;
			cmdarg_stack = 0;
		    }
		    {
			$<node>$ = yylexer.strterm;
			yylexer.strterm = null;
			yylexer.state = EXPR_BEG;
		    }
		    {
			$<num>$ = yylexer.brace_nest;
			yylexer.brace_nest = 0;
		    }
		  compstmt tSTRING_DEND
		    {
			cond_stack = $<val>1;
			cmdarg_stack = $<val>2;
			yylexer.strterm = $<node>3;
			yylexer.brace_nest = $<num>4;
		    /*%%%*/
			if ($5) $5->flags &= ~NODE_FL_NEWLINE;
			$$ = new_evstr($5);
		    /*%
			$$ = dispatch1(string_embexpr, $5);
		    %*/
		    }
		;

string_dvar	: tGVAR
		    {
		    /*%%%*/
			$$ = NEW_GVAR($1);
		    /*%
			$$ = dispatch1(var_ref, $1);
		    %*/
		    }
		| tIVAR
		    {
		    /*%%%*/
			$$ = NEW_IVAR($1);
		    /*%
			$$ = dispatch1(var_ref, $1);
		    %*/
		    }
		| tCVAR
		    {
		    /*%%%*/
			$$ = NEW_CVAR($1);
		    /*%
			$$ = dispatch1(var_ref, $1);
		    %*/
		    }
		| backref
		;

symbol		: tSYMBEG sym
		    {
			yylexer.state = EXPR_END;
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(symbol, $2);
		    %*/
		    }
		;

sym		: fname
		| tIVAR
		| tGVAR
		| tCVAR
		;

dsym		: tSYMBEG xstring_contents tSTRING_END
		    {
			yylexer.state = EXPR_END;
		    /*%%%*/
			$$ = dsym_node($2);
		    /*%
			$$ = dispatch1(dyna_symbol, $2);
		    %*/
		    }
		;

numeric 	: tINTEGER
		| tFLOAT
		| tUMINUS_NUM tINTEGER	       %prec tLOWEST
		    {
		    /*%%%*/
			$$ = negate_lit($2);
		    /*%
			$$ = dispatch2(unary, ripper_intern("-@"), $2);
		    %*/
		    }
		| tUMINUS_NUM tFLOAT	       %prec tLOWEST
		    {
		    /*%%%*/
			$$ = negate_lit($2);
		    /*%
			$$ = dispatch2(unary, ripper_intern("-@"), $2);
		    %*/
		    }
		;

user_variable	: tIDENTIFIER
		| tIVAR
		| tGVAR
		| tCONSTANT
		| tCVAR
		;

keyword_variable: keyword_nil {ifndef_ripper($$ = keyword_nil);}
		| keyword_self {ifndef_ripper($$ = keyword_self);}
		| keyword_true {ifndef_ripper($$ = keyword_true);}
		| keyword_false {ifndef_ripper($$ = keyword_false);}
		| keyword__FILE__ {ifndef_ripper($$ = keyword__FILE__);}
		| keyword__LINE__ {ifndef_ripper($$ = keyword__LINE__);}
		| keyword__ENCODING__ {ifndef_ripper($$ = keyword__ENCODING__);}
		;

var_ref		: user_variable
		    {
		    /*%%%*/
			if (!($$ = gettable($1))) $$ = (0);
		    /*%
			if (id_is_var(get_id($1))) {
			    $$ = dispatch1(var_ref, $1);
			}
			else {
			    $$ = dispatch1(vcall, $1);
			}
		    %*/
		    }
		| keyword_variable
		    {
		    /*%%%*/
			if (!($$ = gettable($1))) $$ = (0);
		    /*%
			$$ = dispatch1(var_ref, $1);
		    %*/
		    }
		;

var_lhs		: user_variable
		    {
			$$ = assignable($1, 0);
		    /*%%%*/
		    /*%
			$$ = dispatch1(var_field, $$);
		    %*/
		    }
		| keyword_variable
		    {
		        $$ = assignable($1, 0);
		    /*%%%*/
		    /*%
			$$ = dispatch1(var_field, $$);
		    %*/
		    }
		;

backref		: tNTH_REF
		| tBACK_REF
		;

superclass	: term
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = Qnil;
		    %*/
		    }
		| '<'
		    {
			yylexer.state = EXPR_BEG;
			yylexer.command_start = TRUE;
		    }
		  expr_value term
		    {
			$$ = $3;
		    }
		| error term
		    {
		    /*%%%*/
			yyerrok;
			$$ = 0;
		    /*%
			yyerrok;
			$$ = Qnil;
		    %*/
		    }
		;

f_arglist	: '(' f_args rparen
		    {
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(paren, $2);
		    %*/
			yylexer.state = EXPR_BEG;
			yylexer.command_start = TRUE;
		    }
		| f_args term
		    {
			$$ = $1;
			yylexer.state = EXPR_BEG;
			yylexer.command_start = TRUE;
		    }
		;

args_tail	: f_kwarg ',' f_kwrest opt_f_block_arg
		    {
			$$ = new_args_tail($1, $3, $4);
		    }
		| f_kwarg opt_f_block_arg
		    {
			$$ = new_args_tail($1, Qnone, $2);
		    }
		| f_kwrest opt_f_block_arg
		    {
			$$ = new_args_tail(Qnone, $1, $2);
		    }
		| f_block_arg
		    {
			$$ = new_args_tail(Qnone, Qnone, $1);
		    }
		;

opt_args_tail	: ',' args_tail
		    {
			$$ = $2;
		    }
		| /* none */
		    {
			$$ = new_args_tail(Qnone, Qnone, Qnone);
		    }
		;

f_args		: f_arg ',' f_optarg ',' f_rest_arg opt_args_tail
		    {
			$$ = new_args($1, $3, $5, Qnone, $6);
		    }
		| f_arg ',' f_optarg ',' f_rest_arg ',' f_arg opt_args_tail
		    {
			$$ = new_args($1, $3, $5, $7, $8);
		    }
		| f_arg ',' f_optarg opt_args_tail
		    {
			$$ = new_args($1, $3, Qnone, Qnone, $4);
		    }
		| f_arg ',' f_optarg ',' f_arg opt_args_tail
		    {
			$$ = new_args($1, $3, Qnone, $5, $6);
		    }
		| f_arg ',' f_rest_arg opt_args_tail
		    {
			$$ = new_args($1, Qnone, $3, Qnone, $4);
		    }
		| f_arg ',' f_rest_arg ',' f_arg opt_args_tail
		    {
			$$ = new_args($1, Qnone, $3, $5, $6);
		    }
		| f_arg opt_args_tail
		    {
			$$ = new_args($1, Qnone, Qnone, Qnone, $2);
		    }
		| f_optarg ',' f_rest_arg opt_args_tail
		    {
			$$ = new_args(Qnone, $1, $3, Qnone, $4);
		    }
		| f_optarg ',' f_rest_arg ',' f_arg opt_args_tail
		    {
			$$ = new_args(Qnone, $1, $3, $5, $6);
		    }
		| f_optarg opt_args_tail
		    {
			$$ = new_args(Qnone, $1, Qnone, Qnone, $2);
		    }
		| f_optarg ',' f_arg opt_args_tail
		    {
			$$ = new_args(Qnone, $1, Qnone, $3, $4);
		    }
		| f_rest_arg opt_args_tail
		    {
			$$ = new_args(Qnone, Qnone, $1, Qnone, $2);
		    }
		| f_rest_arg ',' f_arg opt_args_tail
		    {
			$$ = new_args(Qnone, Qnone, $1, $3, $4);
		    }
		| args_tail
		    {
			$$ = new_args(Qnone, Qnone, Qnone, Qnone, $1);
		    }
		| /* none */
		    {
			$$ = new_args_tail(Qnone, Qnone, Qnone);
			$$ = new_args(Qnone, Qnone, Qnone, Qnone, $$);
		    }
		;

f_bad_arg	: tCONSTANT
		    {
		    /*%%%*/
			yyerror("formal argument cannot be a constant");
			$$ = 0;
		    /*%
			$$ = dispatch1(param_error, $1);
		    %*/
		    }
		| tIVAR
		    {
		    /*%%%*/
			yyerror("formal argument cannot be an instance variable");
			$$ = 0;
		    /*%
			$$ = dispatch1(param_error, $1);
		    %*/
		    }
		| tGVAR
		    {
		    /*%%%*/
			yyerror("formal argument cannot be a global variable");
			$$ = 0;
		    /*%
			$$ = dispatch1(param_error, $1);
		    %*/
		    }
		| tCVAR
		    {
		    /*%%%*/
			yyerror("formal argument cannot be a class variable");
			$$ = 0;
		    /*%
			$$ = dispatch1(param_error, $1);
		    %*/
		    }
		;

f_norm_arg	: f_bad_arg
		| tIDENTIFIER
		    {
			formal_argument(get_id($1));
			$$ = $1;
		    }
		;

f_arg_item	: f_norm_arg
		    {
			arg_var(get_id($1));
		    /*%%%*/
			$$ = NEW_ARGS_AUX($1, 1);
		    /*%
			$$ = get_value($1);
		    %*/
		    }
		| tLPAREN f_margs rparen
		    {
			ID tid = internal_id();
			arg_var(tid);
		    /*%%%*/
			if (dyna_in_block()) {
			    $2->nd_value = NEW_DVAR(tid);
			}
			else {
			    $2->nd_value = NEW_LVAR(tid);
			}
			$$ = NEW_ARGS_AUX(tid, 1);
			$$->nd_next = $2;
		    /*%
			$$ = dispatch1(mlhs_paren, $2);
		    %*/
		    }
		;

f_arg		: f_arg_item
		    /*%c%*/
		    /*%c
		    {
			$$ = rb_ary_new3(1, $1);
		    }
		    c%*/
		| f_arg ',' f_arg_item
		    {
		    /*%%%*/
			$$ = $1;
			$$->nd_plen++;
			$$->nd_next = block_append($$->nd_next, $3->nd_next);
			rb_gc_force_recycle((VALUE)$3);
		    /*%
			$$ = rb_ary_push($1, $3);
		    %*/
		    }
		;

f_kw		: tLABEL arg_value
		    {
			arg_var(formal_argument(get_id($1)));
			$$ = assignable($1, $2);
		    /*%%%*/
			$$ = NEW_KW_ARG(0, $$);
		    /*%
			$$ = rb_assoc_new($$, $2);
		    %*/
		    }
		;

f_block_kw	: tLABEL primary_value
		    {
			arg_var(formal_argument(get_id($1)));
			$$ = assignable($1, $2);
		    /*%%%*/
			$$ = NEW_KW_ARG(0, $$);
		    /*%
			$$ = rb_assoc_new($$, $2);
		    %*/
		    }
		;

f_block_kwarg	: f_block_kw
		    {
		    /*%%%*/
			$$ = $1;
		    /*%
			$$ = rb_ary_new3(1, $1);
		    %*/
		    }
		| f_block_kwarg ',' f_block_kw
		    {
		    /*%%%*/
			NODE *kws = $1;

			while (kws->nd_next) {
			    kws = kws->nd_next;
			}
			kws->nd_next = $3;
			$$ = $1;
		    /*%
			$$ = rb_ary_push($1, $3);
		    %*/
		    }
		;


f_kwarg		: f_kw
		    {
		    /*%%%*/
			$$ = $1;
		    /*%
			$$ = rb_ary_new3(1, $1);
		    %*/
		    }
		| f_kwarg ',' f_kw
		    {
		    /*%%%*/
			NODE *kws = $1;

			while (kws->nd_next) {
			    kws = kws->nd_next;
			}
			kws->nd_next = $3;
			$$ = $1;
		    /*%
			$$ = rb_ary_push($1, $3);
		    %*/
		    }
		;

kwrest_mark	: tPOW
		| tDSTAR
		;

f_kwrest	: kwrest_mark tIDENTIFIER
		    {
			shadowing_lvar(get_id($2));
			$$ = $2;
		    }
		| kwrest_mark
		    {
			$$ = internal_id();
		    }
		;

f_opt		: tIDENTIFIER '=' arg_value
		    {
			arg_var(formal_argument(get_id($1)));
			$$ = assignable($1, $3);
		    /*%%%*/
			$$ = NEW_OPT_ARG(0, $$);
		    /*%
			$$ = rb_assoc_new($$, $3);
		    %*/
		    }
		;

f_block_opt	: tIDENTIFIER '=' primary_value
		    {
			arg_var(formal_argument(get_id($1)));
			$$ = assignable($1, $3);
		    /*%%%*/
			$$ = NEW_OPT_ARG(0, $$);
		    /*%
			$$ = rb_assoc_new($$, $3);
		    %*/
		    }
		;

f_block_optarg	: f_block_opt
		    {
		    /*%%%*/
			$$ = $1;
		    /*%
			$$ = rb_ary_new3(1, $1);
		    %*/
		    }
		| f_block_optarg ',' f_block_opt
		    {
		    /*%%%*/
			NODE *opts = $1;

			while (opts->nd_next) {
			    opts = opts->nd_next;
			}
			opts->nd_next = $3;
			$$ = $1;
		    /*%
			$$ = rb_ary_push($1, $3);
		    %*/
		    }
		;

f_optarg	: f_opt
		    {
		    /*%%%*/
			$$ = $1;
		    /*%
			$$ = rb_ary_new3(1, $1);
		    %*/
		    }
		| f_optarg ',' f_opt
		    {
		    /*%%%*/
			NODE *opts = $1;

			while (opts->nd_next) {
			    opts = opts->nd_next;
			}
			opts->nd_next = $3;
			$$ = $1;
		    /*%
			$$ = rb_ary_push($1, $3);
		    %*/
		    }
		;

restarg_mark	: '*'
		| tSTAR
		;

f_rest_arg	: restarg_mark tIDENTIFIER
		    {
		    /*%%%*/
			if (!is_local_id($2))
			    yyerror("rest argument must be local variable");
		    /*% %*/
			arg_var(shadowing_lvar(get_id($2)));
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(rest_param, $2);
		    %*/
		    }
		| restarg_mark
		    {
		    /*%%%*/
			$$ = internal_id();
			arg_var($$);
		    /*%
			$$ = dispatch1(rest_param, Qnil);
		    %*/
		    }
		;

blkarg_mark	: '&'
		| tAMPER
		;

f_block_arg	: blkarg_mark tIDENTIFIER
		    {
		    /*%%%*/
			if (!is_local_id($2))
			    yyerror("block argument must be local variable");
			else if (!dyna_in_block() && local_id($2))
			    yyerror("duplicated block argument name");
		    /*% %*/
			arg_var(shadowing_lvar(get_id($2)));
		    /*%%%*/
			$$ = $2;
		    /*%
			$$ = dispatch1(blockarg, $2);
		    %*/
		    }
		;

opt_f_block_arg	: ',' f_block_arg
		    {
			$$ = $2;
		    }
		| none
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = Qundef;
		    %*/
		    }
		;

singleton	: var_ref
		    {
		    /*%%%*/
			value_expr($1);
			$$ = $1;
		        if (!$$) $$ = NEW_NIL();
		    /*%
			$$ = $1;
		    %*/
		    }
		| '(' {yylexer.state = EXPR_BEG;} expr rparen
		    {
		    /*%%%*/
			if ($3 == 0) {
			    yyerror("can't define singleton method for ().");
			}
			else {
			    switch (nd_type($3)) {
			      case NODE_STR:
			      case NODE_DSTR:
			      case NODE_XSTR:
			      case NODE_DXSTR:
			      case NODE_DREGX:
			      case NODE_LIT:
			      case NODE_ARRAY:
			      case NODE_ZARRAY:
				yyerror("can't define singleton method for literals");
			      default:
				value_expr($3);
				break;
			    }
			}
			$$ = $3;
		    /*%
			$$ = dispatch1(paren, $3);
		    %*/
		    }
		;

assoc_list	: none
		| assocs trailer
		    {
		    /*%%%*/
			$$ = $1;
		    /*%
			$$ = dispatch1(assoclist_from_args, $1);
		    %*/
		    }
		;

assocs		: assoc
		    /*%c%*/
		    /*%c
		    {
			$$ = rb_ary_new3(1, $1);
		    }
		    %*/
		| assocs ',' assoc
		    {
		    /*%%%*/
			$$ = list_concat($1, $3);
		    /*%
			$$ = rb_ary_push($1, $3);
		    %*/
		    }
		;

assoc		: arg_value tASSOC arg_value
		    {
		    /*%%%*/
			$$ = list_append(NEW_LIST($1), $3);
		    /*%
			$$ = dispatch2(assoc_new, $1, $3);
		    %*/
		    }
		| tLABEL arg_value
		    {
		    /*%%%*/
			$$ = list_append(NEW_LIST(NEW_LIT(ID2SYM($1))), $2);
		    /*%
			$$ = dispatch2(assoc_new, $1, $2);
		    %*/
		    }
		| tDSTAR arg_value
		    {
		    /*%%%*/
			$$ = list_append(NEW_LIST(0), $2);
		    /*%
			$$ = dispatch1(assoc_splat, $2);
		    %*/
		    }
		;

		;

operation	: tIDENTIFIER
		| tCONSTANT
		| tFID
		;

operation2	: tIDENTIFIER
		| tCONSTANT
		| tFID
		| op
		;

operation3	: tIDENTIFIER
		| tFID
		| op
		;

dot_or_colon	: '.'
		    /*%c%*/
		    /*%c
		    { $$ = $<val>1; }
		    %*/
		| tCOLON2
		    /*%c%*/
		    /*%c
		    { $$ = $<val>1; }
		    %*/
		;

opt_terms	: /* none */
		| terms
		;

opt_nl		: /* none */
		| '\n'
		;

rparen		: opt_nl ')'
		;

rbracket	: opt_nl ']'
		;

trailer		: /* none */
		| '\n'
		| ','
		;

term		: ';' {yyerrok;}
		| '\n'
		;

terms		: term
		| terms ';' {yyerrok;}
		;

none		: /* none */
		    {
		    /*%%%*/
			$$ = 0;
		    /*%
			$$ = Qundef;
		    %*/
		    }
		;

%%

var YYLexer = load('lexer.js');

var lexer = new YYLexer(read('ruby.rb'));

var parser = new YYParser(lexer)
parser.enableDebug()

print(parser.parse())
