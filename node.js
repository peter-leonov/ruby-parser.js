// here is the main generator interface

// nodes classes


var NODE_FL_NEWLINE = 1<<7;
var NODE_FL_CREF_PUSHED_BY_EVAL = NODE_FL_NEWLINE;
var NODE_FL_CREF_OMOD_SHARED = 1<<6;



function NODE_SCOPE (head, body)
{
  this.type = NODE_SCOPE;
  this.flags = 0;

  this.local_tbl = local_tbl();
  this.head = head;
  this.body = body;
}

function NODE_BLOCK (body)
{
  this.type = NODE_BLOCK;
  this.flags = 0;

  this.head = null;
  this.body = body; // TODO: check
}

function NODE_BEGIN (body)
{
  this.type = NODE_BEGIN;
  this.flags = 0;

  this.head = null;
  this.body = body;
}


