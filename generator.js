#include "node.js"

// TODO: yyerror("Can't change the value of self");
// TODO: parser_warning(node, "regex literal in condition");
// TODO: "string literal in condition"
// TODO: multiple assignment in conditional
// TODO: multiple assignment in conditional
// TODO: "possibly useless use of "+useless+" in void context"
// TODO: unused literal ignored
// TODO: statement not reached
// and much more

// from parse.y
// 
// > in rules (and generator) we have access to those things:
// >   * all the code from prologue (not much though);
// >   * `lexer`: instance of our Lexer class from the lexer code block;
// >   * `parser`: instance of our Parser class;
// >   * $$ and $N through the `yyval` and `yystack` local variables
// >   * all the code and variables from `rules` code block.



var NODE_FL_NEWLINE = 1<<7;
var NODE_FL_CREF_PUSHED_BY_EVAL = NODE_FL_NEWLINE;
var NODE_FL_CREF_OMOD_SHARED = 1<<6;


function dyna_in_block ()
{
  return lvtbl.vars && lvtbl.vars.prev != DVARS_TOPSCOPE;
}

function rb_dvar_defined (id)
{
  // search through the local vars in runtime
  // for `eval()` or maybe `binding`
  // http://rxr.whitequark.org/mri/source/compile.c?v=2.0.0-p0#5802
  return false;
}
function dvar_defined (id, get)
{
  var args = lvtbl.args;
  var vars = lvtbl.vars;
  var used = lvtbl.used;

  // search throgh the local variables chain
  while (vars)
  {
    if (args[id])
    {
      return true;
    }
    if (vars[id])
    {
      // var i = vtable_included(vars, id); TODO
      // if (used)
      //   used->tbl[ - 1] |= LVAR_USED;
      return true;
    }
    args = args.prev;
    vars = vars.prev;
    // if (get) TODO
    //   used = null;
    // if (used)
    //   used = used.prev;
  }

  // we're very likely in eval,
  // so we need to check with virtual machine's state
  if (vars == DVARS_INHERIT)
  {
    return rb_dvar_defined(id);
  }

  return false;
}
function dvar_defined_get (id)
  { return dvar_defined(id, true); }

function lvar_defined (ident)
{
  return dyna_in_block() && dvar_defined_get(id);
}
function local_id (id)
{
  var vars = lvtbl.vars;
  var args = lvtbl.args;
  // var used = lvtbl.used; TODO

  // go to the bottom of the vars chain
  // TODO: reinvent
  while (vars && vars.prev)
  {
    vars = vars.prev;
    args = args.prev;
    // if (used)
    //   used = used.prev;
  }

  if (vars && vars.prev == DVARS_INHERIT)
  {
    return rb_local_defined(id);
  }
  else if (args[id])
  {
    return true;
  }
  else
  {
    if (vars[id])
    {
      // if (used)
      //   used[id] |= LVAR_USED;
      return true;
    }
    return false;
  }
}

// point of ident knowlage exchange,
// some kind of export inside out :)
lexer.setGenerator
({
  lvar_defined: lvar_defined
});



// This file is incuded into its own namesapase closure,
// so feel free to create global variables here,
// they all will be local to the parser actions.


var ruby_verbose = true;

// just a constants to compare to
var DVARS_INHERIT = {},  // (NODE *) 1
    DVARS_TOPSCOPE = null; // NULL

var lvtbl = null;

function vtable_alloc (prev)
{
  // TODO: check others fro Object.prototype collisions
  var tbl = Object.create(null);
  tbl.prev = prev;
  
  return tbl;
}

function local_push (inherit_dvars)
{
  var local =
  {
    prev: lvtbl,
    args: vtable_alloc(null),
    vars: vtable_alloc(inherit_dvars ? DVARS_INHERIT : DVARS_TOPSCOPE),
    used: vtable_alloc(null)
  };
  lvtbl = local;
}

function local_pop ()
{
  var local = lvtbl.prev;
  // if (lvtbl.used) TODO
  // {
  //   warn_unused_var(lvtbl);
  // }
  lvtbl = local;
}

function warn_unused_var (local)
{
  lexer.warn('TODO: warn_unused_var()');
}

function rb_bug ()
{
  throw 'TODO: rb_bug()';
  // TODO: scream, of even log to the base.
}


// TODO: analise these
var compile_for_eval = false;

// `eval` handling
// require sets it to 0 http://rxr.whitequark.org/mri/source/ruby.c?v=2.0.0-p0#537
var parse_in_eval = 0;
function rb_parse_in_eval () { return parse_in_eval > 0; }
function rb_parse_in_main () { return parse_in_eval < 0; }
// http://rxr.whitequark.org/mri/source/vm_eval.c?v=2.0.0-p0#1207
/* make eval iseq */
// th->parse_in_eval++;
// th->mild_compile_error++;
// iseqval = rb_iseq_compile_on_base(src, rb_str_new2(file), INT2FIX(line), base_block);
// th->mild_compile_error--;
// th->parse_in_eval--;

// the root node, I think
var ruby_eval_tree = null;
var ruby_eval_tree_begin = null;






function fixpos (node, orig)
{
  if (!node)
    return;
  if (!orig)
    return;
  if (orig == DVARS_INHERIT) // (NODE *) 1
    return;
  node.line = orig.line;
}

function parser_warning (node, mesg)
{
  lexer.warn(mesg, node.line);
}


function block_append (head, tail)
{
  var end, h = head;

  if (tail == null)
    return head;

  if (h == null)
    return tail;
  switch (h.type)
  {
    case 'LIT':
    case 'STR':
    case 'SELF':
    case 'TRUE':
    case 'FALSE':
    case 'NIL':
      lexer.warn(h, "unused literal ignored");
      return tail;
    default:
      h = end = NEW_BLOCK(head);
      end.end = end;
      fixpos(end, head);
      head = end;
      break;
    case 'BLOCK':
      end = h.end;
      break;
  }

  var nd = end.head;
  switch (nd.type)
  {
    case 'RETURN':
    case 'BREAK':
    case 'NEXT':
    case 'REDO':
    case 'RETRY':
      if (ruby_verbose)
      {
        parser_warning(tail, "statement not reached");
      }
      break;

    default:
      break;
  }

  if (tail.type != 'BLOCK')
  {
    tail = NEW_BLOCK(tail);
    tail.end = tail;
  }
  end.next = tail;
  h.end = tail.end;
  return head;
}


function void_stmts (node)
{
  if (!ruby_verbose) // TODO
    return;

  if (!node)
    return;
  if (node.type != 'BLOCK')
    return;

  for (;;)
  {
    if (!node.next)
      return;
    void_expr(node.head);
    node = node.next;
  }
}


// TODO: handle BEGIN node with remove_begin()
function void_expr (node)
{
  var useless = '';

  if (!ruby_verbose) // TODO: hide in development mode
    return;

  if (!node)
    return;
  switch (node.type)
  {
    case 'CALL':
      switch (node.mid)
      {
        case $('+'):
        case $('-'):
        case $('*'):
        case $('/'):
        case $('%'):
        case tPOW:
        case tUPLUS:
        case tUMINUS:
        case $('|'):
        case $('^'):
        case $('&'):
        case tCMP:
        case $('>'):
        case tGEQ:
        case $('<'):
        case tLEQ:
        case tEQ:
        case tNEQ:
          useless = rb_id2name[node.mid];
          break;
      }
      break;

    case 'LVAR':
    case 'DVAR':
    case 'GVAR':
    case 'IVAR':
    case 'CVAR':
    case 'NTH_REF':
    case 'BACK_REF':
      useless = "a variable";
      break;
    case 'CONST':
      useless = "a constant";
      break;
    case 'LIT':
    case 'STR':
    case 'DSTR':
    case 'DREGX':
    case 'DREGX_ONCE':
      useless = "a literal";
      break;
    case 'COLON2':
    case 'COLON3':
      useless = "::";
      break;
    case 'DOT2':
      useless = "..";
      break;
    case 'DOT3':
      useless = "...";
      break;
    case 'SELF':
      useless = "self";
      break;
    case 'NIL':
      useless = "nil";
      break;
    case 'TRUE':
      useless = "true";
      break;
    case 'FALSE':
      useless = "false";
      break;
    case 'DEFINED':
      useless = "defined?";
      break;
  }

  if (useless)
  {
    lexer.warn("possibly useless use of "+useless+" in void context", node.line);
  }
}


function local_tbl ()
{
  var buf = {};
  
  for (var k in lvtbl.args)
    buf[k] = lvtbl.args[k]
  
  for (var k in lvtbl.vars)
    buf[k] = lvtbl.vars[k]
  
  return buf;
}

var deferred_nodes = [];

function fixup_nodes (deferred_nodes)
{
  // TODO: seams like a reduction for ranges
}

// shifts all leading BEGIN node nodes in list:
//   BEGIN->BEGIN->BEGIN->other_node
// becomes
//   other_node
function remove_begin (node)
{
  while (node && node.type == 'BEGIN' && node.body)
  {
    node = n1.body;
  }
  return node;
}


function  newline_node (node)
{
  if (node)
  {
    node = remove_begin(node);
    node.flags |= NODE_FL_NEWLINE;
  }
  return node;
}


function check_cond (node)
{
  if (node == null)
    return null;
  assign_in_cond(node);

  switch (node.type)
  {
    case 'DSTR':
    case 'EVSTR':
    case 'STR':
      lexer.warn("string literal in condition");
      break;

    case 'DREGX':
    case 'DREGX_ONCE':
      parser_warning(node, "regex literal in condition");
      return NEW_MATCH2(node, NEW_GVAR("$_"));

    case 'AND':
    case 'OR':
      node.nd_1st = check_cond(node.nd_1st);
      node.nd_2nd = check_cond(node.nd_2nd);
      break;

    case 'DOT2':
    case 'DOT3':
      node.beg = range_op(node.beg);
      node.end = range_op(node.end);
      if (node.type == 'DOT2')
        // was: nd_set_type(node, NODE_FLIP2); TODO: understand
        node.type = 'FLIP2';
      else if (node.type == 'DOT3')
        // was: nd_set_type(node, NODE_FLIP3); TODO: understand
        node.type = 'FLIP3';
      // if (!e_option_supplied(parser)) // TODO
      {
        var b = literal_node(node.beg);
        var e = literal_node(node.end);
        if ((b == 1 && e == 1) || (b + e >= 2 && ruby_verbose))
        {
          parser_warning(node, "range literal in condition");
        }
      }
      break;

    case 'DSYM':
      parser_warning(node, "literal in condition");
      break;

    case 'LIT':
      if (node.lit_type == 'REGEXP')
      {
        parser_warning(node, "regex literal in condition");
        // was: nd_set_type(node, NODE_MATCH); TODO: understand
        node.type = 'MATCH';
      }
      else
      {
        parser_warning(node, "literal in condition");
      }
    default:
      break;
  }
  return node;
}


function assign_in_cond (node)
{
  switch (node.type)
  {
    case 'MASGN':
      lexer.yyerror("multiple assignment in conditional");
      return true;

    case 'LASGN':
    case 'DASGN':
    case 'DASGN_CURR':
    case 'GASGN':
    case 'IASGN':
      break;

    default:
      return false;
  }

  if (!node.value)
    return true;
  if (is_static_content(node.value))
  {
    /* reports always */
    parser_warning(node.value, "found = in conditional, should be ==");
  }
  return true;
}

function range_op (node)
{
  if (node == null)
    return null;

  var type = node.type;
  value_expr(node);
  if (type == 'LIT' && node.lit_type == 'FIXNUM')
  {
    warn_unless_e_option(parser, node,
                         "integer literal in conditional range");
    return NEW_CALL(node, tEQ, NEW_LIST(NEW_GVAR(rb_intern("$."))));
  }
  return cond0(parser, node);
}


function literal_node (node)
{
  if (!node)
    return 1;        /* same as NODE_NIL */ // TODO: understand
  switch (node.type)
  {
    case 'LIT':
    case 'STR':
    case 'DSTR':
    case 'EVSTR':
    case 'DREGX':
    case 'DREGX_ONCE':
    case 'DSYM':
      return 2;
    case 'TRUE':
    case 'FALSE':
    case 'NIL':
      return 1;
  }
  return 0;
}


function is_static_content (node)
{
  if (!node)
    return true;
  switch (node.type)
  {
    case 'HASH':
      if (!(node = node.head))
        break;
    case 'ARRAY':
      do
      {
        if (!is_static_content(node.head))
          return false;
      }
      while ((node = node.next) != null);
    case 'LIT':
    case 'STR':
    case 'NIL':
    case 'TRUE':
    case 'FALSE':
    case 'ZARRAY':
      break;
    default:
      return false;
  }
  return true;
}






