// here is the main generator interface

var
  NODE_SCOPE          = 1,
  NODE_BLOCK          = 2,
  NODE_IF             = 3,
  NODE_CASE           = 4,
  NODE_WHEN           = 5,
  NODE_OPT_N          = 6,
  NODE_WHILE          = 7,
  NODE_UNTIL          = 8,
  NODE_ITER           = 9,
  NODE_FOR            = 10,
  NODE_BREAK          = 11,
  NODE_NEXT           = 12,
  NODE_REDO           = 13,
  NODE_RETRY          = 14,
  NODE_BEGIN          = 15,
  NODE_RESCUE         = 16,
  NODE_RESBODY        = 17,
  NODE_ENSURE         = 18,
  NODE_AND            = 19,
  NODE_OR             = 20,
  NODE_MASGN          = 21,
  NODE_LASGN          = 22,
  NODE_DASGN          = 23,
  NODE_DASGN_CURR     = 24,
  NODE_GASGN          = 25,
  NODE_IASGN          = 26,
  NODE_IASGN2         = 27,
  NODE_CDECL          = 28,
  NODE_CVASGN         = 29,
  NODE_CVDECL         = 30,
  NODE_OP_ASGN1       = 31,
  NODE_OP_ASGN2       = 32,
  NODE_OP_ASGN_AND    = 33,
  NODE_OP_ASGN_OR     = 34,
  NODE_OP_CDECL       = 35,
  NODE_CALL           = 36,
  NODE_FCALL          = 37,
  NODE_VCALL          = 38,
  NODE_SUPER          = 39,
  NODE_ZSUPER         = 40,
  NODE_ARRAY          = 41,
  NODE_ZARRAY         = 42,
  NODE_VALUES         = 43,
  NODE_HASH           = 44,
  NODE_RETURN         = 45,
  NODE_YIELD          = 46,
  NODE_LVAR           = 47,
  NODE_DVAR           = 48,
  NODE_GVAR           = 49,
  NODE_IVAR           = 50,
  NODE_CONST          = 51,
  NODE_CVAR           = 52,
  NODE_NTH_REF        = 53,
  NODE_BACK_REF       = 54,
  NODE_MATCH          = 55,
  NODE_MATCH2         = 56,
  NODE_MATCH3         = 57,
  NODE_LIT            = 58,
  NODE_STR            = 59,
  NODE_DSTR           = 60,
  NODE_XSTR           = 61,
  NODE_DXSTR          = 62,
  NODE_EVSTR          = 63,
  NODE_DREGX          = 64,
  NODE_DREGX_ONCE     = 65,
  NODE_ARGS           = 66,
  NODE_ARGS_AUX       = 67,
  NODE_OPT_ARG        = 68,
  NODE_KW_ARG         = 69,
  NODE_POSTARG        = 70,
  NODE_ARGSCAT        = 71,
  NODE_ARGSPUSH       = 72,
  NODE_SPLAT          = 73,
  NODE_TO_ARY         = 74,
  NODE_BLOCK_ARG      = 75,
  NODE_BLOCK_PASS     = 76,
  NODE_DEFN           = 77,
  NODE_DEFS           = 78,
  NODE_ALIAS          = 79,
  NODE_VALIAS         = 80,
  NODE_UNDEF          = 81,
  NODE_CLASS          = 82,
  NODE_MODULE         = 83,
  NODE_SCLASS         = 84,
  NODE_COLON2         = 85,
  NODE_COLON3         = 86,
  NODE_CREF           = 87,
  NODE_DOT2           = 88,
  NODE_DOT3           = 89,
  NODE_FLIP2          = 90,
  NODE_FLIP3          = 91,
  NODE_SELF           = 92,
  NODE_NIL            = 93,
  NODE_TRUE           = 94,
  NODE_FALSE          = 95,
  NODE_ERRINFO        = 96,
  NODE_DEFINED        = 97,
  NODE_POSTEXE        = 98,
  NODE_ALLOCA         = 99,
  NODE_BMETHOD        = 100,
  NODE_MEMO           = 101,
  NODE_IFUNC          = 102,
  NODE_DSYM           = 103,
  NODE_ATTRASGN       = 104,
  NODE_PRELUDE        = 105,
  NODE_LAMBDA         = 106,
  NODE_LAST           = 107;



// nodes classes


// for the reference
// #define NEW_NODE(t,a0,a1,a2) rb_node_newnode((t),(VALUE)(a0),(VALUE)(a1),(VALUE)(a2))
// NODE*
// rb_node_newnode(enum node_type type, VALUE a0, VALUE a1, VALUE a2)
// {
//     NODE *n = (NODE*)rb_newobj();
// 
//     n->flags |= T_NODE;
//     nd_set_type(n, type);
// 
//     n->u1.value = a0; // nd_lit   or   nd_clss
//     n->u2.value = a1; // nd_rval  or   nd_tval
//     n->u3.value = a2; // nd_orig  or   nd_cval
// 
//     return n;
// }


function SCOPE (param, body)
{
  this.type = NODE_SCOPE;

  this.local_tbl = local_tbl();
  this.param = param;
  this.body = body;
}

// NEW_NODE(NODE_SCOPE,local_tbl(),b,a)


function BLOCK (body)
{
  this.type = NEW_BLOCK;

  this.body = body; // TODO: check
}


