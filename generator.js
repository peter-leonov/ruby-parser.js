#include "node.js"


// from parse.y
// 
// > in rules (and generator) we have access to those things:
// >   * all the code from prologue (not much though);
// >   * `lexer`: instance of our Lexer class from the lexer code block;
// >   * $$ and $N through the `yyval` and `yystack` local variables
// >   * all the code and variables from `rules` code block.


// This file is incuded into its own namesapase closure,
// so feel free to create global variables here,
// they all will be local to the parser actions.


var ruby_verbose = true;

// just a constants to compare to
var DVARS_INHERIT = {},  // (NODE *) 1
    DVARS_TOPSCOPE = {}; // NULL

var lvtbl = null;

function vtable_alloc (prev)
{
  var tbl =
  {
    prev: prev
  };
  
  return tbl;
}

function local_push (inherit_dvars)
{
  var local =
  {
    prev: lvtbl,
    args: vtable_alloc(0),
    vars: vtable_alloc(inherit_dvars ? DVARS_INHERIT : DVARS_TOPSCOPE),
    used: vtable_alloc(0)
  };
  lvtbl = local;
}

function local_pop ()
{
  var local = lvtbl.prev;
  if (lvtbl.used)
  {
    warn_unused_var(lvtbl);
  }
  lvtbl = local;
}

function warn_unused_var (local)
{
  // TODO
}

function rb_bug ()
{
  // TODO: scream, of even log to the base.
}

var id2name_table = [];
function rb_id2name (id)
{
  return id2name_table[id] || 'unknown-id';
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
    case NODE_LIT:
    case NODE_STR:
    case NODE_SELF:
    case NODE_TRUE:
    case NODE_FALSE:
    case NODE_NIL:
      lexer.warn(h, "unused literal ignored");
      return tail;
    default:
      h = end = new NODE_BLOCK(head);
      end.end = end;
      fixpos(end, head);
      head = end;
      break;
    case NODE_BLOCK:
      end = h.end;
      break;
  }

  var nd = end.head;
  switch (nd.type)
  {
    case NODE_RETURN:
    case NODE_BREAK:
    case NODE_NEXT:
    case NODE_REDO:
    case NODE_RETRY:
      if (ruby_verbose)
      {
        parser_warning(tail, "statement not reached");
      }
      break;

    default:
      break;
  }

  if (tail.type != NODE_BLOCK)
  {
    tail = new NODE_BLOCK(tail);
    tail.end = tail;
  }
  end.next = tail;
  h.end = tail.end;
  return head;
}


function void_stmts (node)
{
  if (!ruby_verbose) TODO
    return;

  if (!node)
    return;
  if (node.type != NODE_BLOCK)
    return;

  for (;;)
  {
    if (!node.next)
      return;
    void_expr(node.head);
    node = node.next;
  }
}


// TODO: handle NODE_BEGIN with remove_begin()
function void_expr (node)
{
  var useless = '';

  if (!ruby_verbose) // TODO: hide in development mode
    return;

  if (!node)
    return;
  switch (node.type)
  {
    case NODE_CALL:
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
          useless = rb_id2name(node.mid);
          break;
      }
      break;

    case NODE_LVAR:
    case NODE_DVAR:
    case NODE_GVAR:
    case NODE_IVAR:
    case NODE_CVAR:
    case NODE_NTH_REF:
    case NODE_BACK_REF:
      useless = "a variable";
      break;
    case NODE_CONST:
      useless = "a constant";
      break;
    case NODE_LIT:
    case NODE_STR:
    case NODE_DSTR:
    case NODE_DREGX:
    case NODE_DREGX_ONCE:
      useless = "a literal";
      break;
    case NODE_COLON2:
    case NODE_COLON3:
      useless = "::";
      break;
    case NODE_DOT2:
      useless = "..";
      break;
    case NODE_DOT3:
      useless = "...";
      break;
    case NODE_SELF:
      useless = "self";
      break;
    case NODE_NIL:
      useless = "nil";
      break;
    case NODE_TRUE:
      useless = "true";
      break;
    case NODE_FALSE:
      useless = "false";
      break;
    case NODE_DEFINED:
      useless = "defined?";
      break;
  }

  if (useless)
  {
    var l = node.line;
    lexer.warn("possibly useless use of "+useless+" in void context", l);
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

// shifts all leading NODE_BEGIN nodes in list:
//   NODE_BEGIN->NODE_BEGIN->NODE_BEGIN->other_node
// becomes
//   other_node
function remove_begin (node)
{
  while (node && node.type == NODE_BEGIN && node.body)
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
