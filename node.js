// here is the main generator interface

// nodes classes

// TODO: implement them all

function N (type)
{
  this.type = type;
  // this.line = 0;
}
N.prototype.inspect = function ()
{
  var pairs = [];
  for (var k in this)
  {
    if (k == 'type' || k == 'inspect')
      continue;
    pairs.push(k + ': ' + JSON.stringify(this[k]));
  }
  
  return this.type + ' { ' + pairs.join(', ') + ' }';
}


function NEW_SCOPE (tbl, body, args)
{
  var n = new N('SCOPE');

  n.tbl = tbl || local_tbl();
  n.body = body;
  n.args = args;
  
  return n;
}

function NEW_BLOCK (head)
{
  var n = new N('BLOCK');

  n.head = head; // set later
  n.next = null;
  n.end = null; // set later
  return n;
}

function NEW_BEGIN (body)
{
  var n = new N('BEGIN');

  n.body = body;
  return n;
}

function NEW_RESCUE (body, rescue, elsee) // elsee for else
{
  var n = new N('RESCUE');

  n.body = body;
  n.rescue = rescue;
  n.elsee = elsee;
  return n;
}

function NEW_RESBODY (exclude, body, rescue) // elsee for else
{
  var n = new N('RESBODY');

  n.exclude = exclude;
  n.body = body;
  n.rescue = rescue;
  return n;
}

function NEW_ENSURE (body, enshure) // elsee for else
{
  var n = new N('ENSURE');

  n.body = body;
  n.enshure = enshure;
  return n;
}

function NEW_NIL ()
{
  var n = new N('NIL');

  return n;
}

function NEW_ALIAS (name, entity) // TODO: fix names
{
  var n = new N('ALIAS');
  
  n.name = name;
  n.entity = entity;
  return n;
}

function NEW_VALIAS (name, entity) // TODO: fix names
{
  var n = new N('VALIAS');
  
  n.name = name;
  n.entity = entity;
  return n;
}

function NEW_BACK_REF (name)
{
  var n = new N('BACK_REF');
  
  n.name = name;
  return n;
}

function NEW_IF (cond, body, elsee)
{
  var n = new N('IF');
  
  n.cond = cond;
  n.body = body; // aka "then"
  n.elsee = elsee;
  return n;
}

function NEW_MATCH2 (nd_1st, nd_2nd)
{
  var n = new N('MATCH2');
  
  n.nd_1st = nd_1st;
  n.nd_2nd = nd_2nd;
  return n;
}

function NEW_GVAR (name)
{
  var n = new N('GVAR');
  
  n.name = name;
  return n;
}

function NEW_DOT2 (beg, end)
{
  var n = new N('DOT2');
  
  n.beg = beg;
  n.end = end;
  return n;
}

function NEW_DOT3 (beg, end)
{
  var n = new N('DOT3');
  
  n.beg = beg;
  n.end = end;
  return n;
}

function NEW_LIT (lit, lit_type)
{
  var n = new N('LIT');
  
  n.lit = lit;
  n.lit_type = lit_type;
  return n;
}

function NEW_WHILE (cond, body, n)
{
  var n = new N('WHILE');
  
  n.cond = cond;
  n.body = body;
  n.n = n; // TODO: n what?
  return n;
}

function NEW_UNTIL (cond, body, n)
{
  var n = new N('UNTIL');
  
  n.cond = cond;
  n.body = body;
  n.n = n; // TODO: n what?
  return n;
}

function NEW_POSTEXE (body)
{
  var n = new N('POSTEXE');
  
  n.body = body;
  return n;
}

function NEW_OP_ASGN_OR (vid, val)
{
  var n = new N('OP_ASGN_OR');
  
  n.vid = vid;
  n.val = val;
  return n;
}

function NEW_OP_ASGN1 (vid, op, args)
{
  var n = new N('OP_ASGN1');
  
  n.vid = vid;
  n.op = op;
  n.args = args;
  return n;
}

function NEW_OP_ASGN2 (lhs, type, attr, op, rhs)
{
  var n = new N('OP_ASGN2');
  
  n.lhs = lhs;
  n.otype = type;
  n.attr = attr;
  n.op = op;
  n.rhs = rhs;
  return n;
}

function NEW_OP_ASGN_AND (vid, val)
{
  var n = new N('OP_ASGN_AND');
  
  n.vid = vid;
  n.val = val;
  return n;
}

function NEW_CALL (mid, val)
{
  var n = new N('CALL');
  
  n.mid = mid;
  n.val = val;
  return n;
}

function NEW_ARRAY (next)
{
  var n = new N('ARRAY');
  
  n.next = next;
  n.end = null;
  n.alen = 1;
  return n;
}

var NEW_LIST = NEW_ARRAY;

function NEW_STR (lit) // literal
{
  var n = new N('STR');
  
  n.lit = lit;
  return n;
}

function NEW_ZARRAY () // literal
{
  var n = new N('ZARRAY');
  
  return n;
}

function NEW_ARGSCAT () // literal
{
  var n = new N('ARGSCAT');
  
  return n;
}

