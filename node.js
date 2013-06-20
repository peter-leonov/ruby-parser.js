// here is the main generator interface

// nodes classes

var NODE_FL_NEWLINE = 1<<7;
var NODE_FL_CREF_PUSHED_BY_EVAL = NODE_FL_NEWLINE;
var NODE_FL_CREF_OMOD_SHARED = 1<<6;


// TODO: implement them all
function NODE_BLOCK_PASS () {}
function NODE_ARGSPUSH () {}
function NODE_DSYM () {}
function NODE_AND () {}
function NODE_OR () {}
function NODE_EVSTR () {}
function NODE_MASGN () {}
function NODE_LASGN () {}
function NODE_DASGN () {}
function NODE_DASGN_CURR () {}
function NODE_GASGN () {}
function NODE_IASGN () {}
function NODE_SELF () {}
function NODE_TRUE () {}
function NODE_FALSE () {}
function NODE_NIL () {}
function NODE_RETURN () {}
function NODE_BREAK () {}
function NODE_NEXT () {}
function NODE_REDO () {}
function NODE_RETRY () {}
function NODE_LVAR () {}
function NODE_DVAR () {}
function NODE_IVAR () {}
function NODE_CVAR () {}
function NODE_NTH_REF () {}
function NODE_CONST () {}
function NODE_DSTR () {}
function NODE_DREGX () {}
function NODE_DREGX_ONCE () {}
function NODE_COLON2 () {}
function NODE_COLON3 () {}
function NODE_SELF () {}
function NODE_NIL () {}
function NODE_TRUE () {}
function NODE_FALSE () {}
function NODE_DEFINED () {}





function NODE_SCOPE (tbl, body, args)
{
  this.type = NODE_SCOPE;
  this.flags = 0;
  this.line = 0;

  this.tbl = tbl || local_tbl();
  this.body = body;
  this.args = args;
}

function NODE_BLOCK (head)
{
  this.type = NODE_BLOCK;
  this.flags = 0;
  this.line = 0;

  this.head = head; // set later
  this.next = null;
  this.end = null; // set later
}

function NODE_BEGIN (body)
{
  this.type = NODE_BEGIN;
  this.flags = 0;
  this.line = 0;

  this.body = body;
}

function NODE_RESCUE (body, rescue, elsee) // elsee for else
{
  this.type = NODE_RESCUE;
  this.flags = 0;
  this.line = 0;

  this.body = body;
  this.rescue = rescue;
  this.elsee = elsee;
}

function NODE_RESBODY (exclude, body, rescue) // elsee for else
{
  this.type = NODE_RESBODY;
  this.flags = 0;
  this.line = 0;

  this.exclude = exclude;
  this.body = body;
  this.rescue = rescue;
}

function NODE_ENSURE (body, enshure) // elsee for else
{
  this.type = NODE_ENSURE;
  this.flags = 0;
  this.line = 0;

  this.body = body;
  this.enshure = enshure;
}

function NODE_NIL ()
{
  this.type = NODE_NIL;
  this.flags = 0;
  this.line = 0;
}

function NODE_ALIAS (name, entity) // TODO: fix names
{
  this.type = NODE_ALIAS;
  this.flags = 0;
  this.line = 0;
  
  this.name = name;
  this.entity = entity;
}

function NODE_VALIAS (name, entity) // TODO: fix names
{
  this.type = NODE_VALIAS;
  this.flags = 0;
  this.line = 0;
  
  this.name = name;
  this.entity = entity;
}

function NODE_BACK_REF (name)
{
  this.type = NODE_BACK_REF;
  this.flags = 0;
  this.line = 0;
  
  this.name = name;
}

function NODE_IF (cond, body, elsee)
{
  this.type = NODE_IF;
  this.flags = 0;
  this.line = 0;
  
  this.cond = cond;
  this.body = body; // aka "then"
  this.elsee = elsee;
}

function NODE_MATCH2 (nd_1st, nd_2nd)
{
  this.type = NODE_MATCH2;
  this.flags = 0;
  this.line = 0;
  
  this.nd_1st = nd_1st;
  this.nd_2nd = nd_2nd;
}

function NODE_GVAR (name)
{
  this.type = NODE_GVAR;
  this.flags = 0;
  this.line = 0;
  
  this.name = name;
}

function NODE_DOT2 (beg, end)
{
  this.type = NODE_DOT2;
  this.flags = 0;
  this.line = 0;
  
  this.beg = beg;
  this.end = end;
}

function NODE_DOT3 (beg, end)
{
  this.type = NODE_DOT3;
  this.flags = 0;
  this.line = 0;
  
  this.beg = beg;
  this.end = end;
}

function NODE_LIT (lit, lit_type)
{
  this.type = NODE_LIT;
  this.flags = 0;
  this.line = 0;
  
  this.lit = lit;
  this.lit_type = lit_type;
}

function NODE_WHILE (cond, body, n)
{
  this.type = NODE_WHILE;
  this.flags = 0;
  this.line = 0;
  
  this.cond = cond;
  this.body = body;
  this.n = n; // TODO: n what?
}

function NODE_UNTIL (cond, body, n)
{
  this.type = NODE_UNTIL;
  this.flags = 0;
  this.line = 0;
  
  this.cond = cond;
  this.body = body;
  this.n = n; // TODO: n what?
}

function NODE_POSTEXE (body)
{
  this.type = NODE_POSTEXE;
  this.flags = 0;
  this.line = 0;
  
  this.body = body;
}

function NODE_OP_ASGN_OR (vid, val)
{
  this.type = NODE_OP_ASGN_OR;
  this.flags = 0;
  this.line = 0;
  
  this.vid = vid;
  this.val = val;
}

function NODE_OP_ASGN1 (vid, op, args)
{
  this.type = NODE_OP_ASGN_OR;
  this.flags = 0;
  this.line = 0;
  
  this.vid = vid;
  this.op = op;
  this.args = args;
}

function NODE_OP_ASGN2 (vid, op, args)
{
  this.type = NODE_OP_ASGN_OR;
  this.flags = 0;
  this.line = 0;
  
  this.vid = vid;
  this.op = op;
  this.args = args;
}

function NODE_OP_ASGN_AND (vid, val)
{
  this.type = NODE_OP_ASGN_AND;
  this.flags = 0;
  this.line = 0;
  
  this.vid = vid;
  this.val = val;
}

function NODE_CALL (vid, val)
{
  this.type = NODE_CALL;
  this.flags = 0;
  this.line = 0;
  
  this.vid = vid;
  this.val = val;
}

function NODE_ARRAY (next)
{
  this.type = NODE_ARRAY;
  this.flags = 0;
  this.line = 0;
  
  this.next = next;
  this.end = null;
  this.alen = 1;
}

var NODE_LIST = NODE_ARRAY;

function NODE_STR (lit) // literal
{
  this.type = NODE_STR;
  this.flags = 0;
  this.line = 0;
  
  this.lit = lit;
}

function NODE_ZARRAY () // literal
{
  this.type = NODE_ZARRAY;
  this.flags = 0;
  this.line = 0;
}

function NODE_ARGSCAT () // literal
{
  this.type = NODE_ARGSCAT;
  this.flags = 0;
  this.line = 0;
}

