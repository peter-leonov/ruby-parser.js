// here is the main generator interface

// nodes classes

// TODO: implement them all
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


function N () {}


function NEW_SCOPE (tbl, body, args)
{
  var n = new N();
  n.type = NODE_SCOPE;
  n.flags = 0;
  n.line = 0;

  n.tbl = tbl || local_tbl();
  n.body = body;
  n.args = args;
  
  return n;
}

function NEW_BLOCK (head)
{
  var n = new N();
  n.type = NODE_BLOCK;
  n.flags = 0;
  n.line = 0;

  n.head = head; // set later
  n.next = null;
  n.end = null; // set later
  return n;
}

function NEW_BEGIN (body)
{
  var n = new N();
  n.type = NODE_BEGIN;
  n.flags = 0;
  n.line = 0;

  n.body = body;
  return n;
}

function NEW_RESCUE (body, rescue, elsee) // elsee for else
{
  var n = new N();
  n.type = NODE_RESCUE;
  n.flags = 0;
  n.line = 0;

  n.body = body;
  n.rescue = rescue;
  n.elsee = elsee;
  return n;
}

function NEW_RESBODY (exclude, body, rescue) // elsee for else
{
  var n = new N();
  n.type = NODE_RESBODY;
  n.flags = 0;
  n.line = 0;

  n.exclude = exclude;
  n.body = body;
  n.rescue = rescue;
  return n;
}

function NEW_ENSURE (body, enshure) // elsee for else
{
  var n = new N();
  n.type = NODE_ENSURE;
  n.flags = 0;
  n.line = 0;

  n.body = body;
  n.enshure = enshure;
  return n;
}

function NEW_NIL ()
{
  var n = new N();
  n.type = NODE_NIL;
  n.flags = 0;
  n.line = 0;
  return n;
}

function NEW_ALIAS (name, entity) // TODO: fix names
{
  var n = new N();
  n.type = NODE_ALIAS;
  n.flags = 0;
  n.line = 0;
  
  n.name = name;
  n.entity = entity;
  return n;
}

function NEW_VALIAS (name, entity) // TODO: fix names
{
  var n = new N();
  n.type = NODE_VALIAS;
  n.flags = 0;
  n.line = 0;
  
  n.name = name;
  n.entity = entity;
  return n;
}

function NEW_BACK_REF (name)
{
  var n = new N();
  n.type = NODE_BACK_REF;
  n.flags = 0;
  n.line = 0;
  
  n.name = name;
  return n;
}

function NEW_IF (cond, body, elsee)
{
  var n = new N();
  n.type = NODE_IF;
  n.flags = 0;
  n.line = 0;
  
  n.cond = cond;
  n.body = body; // aka "then"
  n.elsee = elsee;
  return n;
}

function NEW_MATCH2 (nd_1st, nd_2nd)
{
  var n = new N();
  n.type = NODE_MATCH2;
  n.flags = 0;
  n.line = 0;
  
  n.nd_1st = nd_1st;
  n.nd_2nd = nd_2nd;
  return n;
}

function NEW_GVAR (name)
{
  var n = new N();
  n.type = NODE_GVAR;
  n.flags = 0;
  n.line = 0;
  
  n.name = name;
  return n;
}

function NEW_DOT2 (beg, end)
{
  var n = new N();
  n.type = NODE_DOT2;
  n.flags = 0;
  n.line = 0;
  
  n.beg = beg;
  n.end = end;
  return n;
}

function NEW_DOT3 (beg, end)
{
  var n = new N();
  n.type = NODE_DOT3;
  n.flags = 0;
  n.line = 0;
  
  n.beg = beg;
  n.end = end;
  return n;
}

function NEW_LIT (lit, lit_type)
{
  var n = new N();
  n.type = NODE_LIT;
  n.flags = 0;
  n.line = 0;
  
  n.lit = lit;
  n.lit_type = lit_type;
  return n;
}

function NEW_WHILE (cond, body, n)
{
  var n = new N();
  n.type = NODE_WHILE;
  n.flags = 0;
  n.line = 0;
  
  n.cond = cond;
  n.body = body;
  n.n = n; // TODO: n what?
  return n;
}

function NEW_UNTIL (cond, body, n)
{
  var n = new N();
  n.type = NODE_UNTIL;
  n.flags = 0;
  n.line = 0;
  
  n.cond = cond;
  n.body = body;
  n.n = n; // TODO: n what?
  return n;
}

function NEW_POSTEXE (body)
{
  var n = new N();
  n.type = NODE_POSTEXE;
  n.flags = 0;
  n.line = 0;
  
  n.body = body;
  return n;
}

function NEW_OP_ASGN_OR (vid, val)
{
  var n = new N();
  n.type = NODE_OP_ASGN_OR;
  n.flags = 0;
  n.line = 0;
  
  n.vid = vid;
  n.val = val;
  return n;
}

function NEW_OP_ASGN1 (vid, op, args)
{
  var n = new N();
  n.type = NEW_OP_ASGN1;
  n.flags = 0;
  n.line = 0;
  
  n.vid = vid;
  n.op = op;
  n.args = args;
  return n;
}

function NEW_OP_ASGN2 (lhs, type, attr, op, rhs)
{
  var n = new N();
  n.type = NODE_OP_ASGN2;
  n.flags = 0;
  n.line = 0;
  
  n.lhs = lhs;
  n.otype = type;
  n.attr = attr;
  n.op = op;
  n.rhs = rhs;
  return n;
}

function NEW_OP_ASGN_AND (vid, val)
{
  var n = new N();
  n.type = NODE_OP_ASGN_AND;
  n.flags = 0;
  n.line = 0;
  
  n.vid = vid;
  n.val = val;
  return n;
}

function NEW_CALL (mid, val)
{
  var n = new N();
  n.type = NODE_CALL;
  n.flags = 0;
  n.line = 0;
  
  n.mid = mid;
  n.val = val;
  return n;
}

function NEW_ARRAY (next)
{
  var n = new N();
  n.type = NODE_ARRAY;
  n.flags = 0;
  n.line = 0;
  
  n.next = next;
  n.end = null;
  n.alen = 1;
  return n;
}

var NEW_LIST = NEW_ARRAY;

function NEW_STR (lit) // literal
{
  var n = new N();
  n.type = NODE_STR;
  n.flags = 0;
  n.line = 0;
  
  n.lit = lit;
  return n;
}

function NEW_ZARRAY () // literal
{
  var n = new N();
  n.type = NODE_ZARRAY;
  n.flags = 0;
  n.line = 0;
  return n;
}

function NEW_ARGSCAT () // literal
{
  var n = new N();
  n.type = NODE_ARGSCAT;
  n.flags = 0;
  n.line = 0;
  return n;
}

