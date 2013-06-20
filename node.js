// here is the main generator interface

// nodes classes


var NODE_FL_NEWLINE = 1<<7;
var NODE_FL_CREF_PUSHED_BY_EVAL = NODE_FL_NEWLINE;
var NODE_FL_CREF_OMOD_SHARED = 1<<6;



// TODO: implement them all
function NODE_LIT () {}
function NODE_STR () {}
function NODE_SELF () {}
function NODE_TRUE () {}
function NODE_FALSE () {}
function NODE_NIL () {}
function NODE_RETURN () {}
function NODE_BREAK () {}
function NODE_NEXT () {}
function NODE_REDO () {}
function NODE_RETRY () {}
function NODE_CALL () {}
function NODE_LVAR () {}
function NODE_DVAR () {}
function NODE_GVAR () {}
function NODE_IVAR () {}
function NODE_CVAR () {}
function NODE_NTH_REF () {}
function NODE_BACK_REF () {}
function NODE_CONST () {}
function NODE_LIT () {}
function NODE_STR () {}
function NODE_DSTR () {}
function NODE_DREGX () {}
function NODE_DREGX_ONCE () {}
function NODE_COLON2 () {}
function NODE_COLON3 () {}
function NODE_DOT2 () {}
function NODE_DOT3 () {}
function NODE_SELF () {}
function NODE_NIL () {}
function NODE_TRUE () {}
function NODE_FALSE () {}
function NODE_DEFINED () {}





function NODE_SCOPE (head, body)
{
  this.type = NODE_SCOPE;
  this.flags = 0;
  this.line = 0;

  this.local_tbl = local_tbl();
  this.head = head;
  this.body = body;
}

function NODE_BLOCK (head)
{
  this.type = NODE_BLOCK;
  this.flags = 0;
  this.line = 0;

  this.head = head;
  this.body = null;
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

