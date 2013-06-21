#include "node.js"


// from parse.y
// 
// > in rules (and generator) we have access to those things:
// >   * all the code from prologue (not much though);
// >   * `lexer`: instance of our Lexer class from the lexer code block;
// >   * `parser`: instance of our Parser class;
// >   * $$ and $N through the `yyval` and `yystack` local variables
// >   * all the code and variables from `rules` code block.


// everything on IDs is here

var tLAST_OP_ID = tLAST_TOKEN;
var ID_SCOPE_MASK = 0x07;

var ID_SCOPE_SHIFT  = 3,
    ID_SCOPE_MASK   = 0x07,                
    ID_LOCAL        = 0x00,
    ID_GLOBAL       = 0x03,
    ID_INSTANCE     = 0x01,
    ID_ATTRSET      = 0x04,
    ID_CONST        = 0x05,
    ID_CLASS        = 0x06,
    ID_JUNK         = 0x07;


function is_notop_id (id)
  { return id > tLAST_OP_ID }
function is_local_id (id)
  { return is_notop_id(id) && (id & ID_SCOPE_MASK) == ID_LOCAL }
function is_global_id (id)
  { return is_notop_id(id) && (id & ID_SCOPE_MASK) == ID_GLOBAL }
function is_instance_id (id)
  { return is_notop_id(id) && (id & ID_SCOPE_MASK) == ID_INSTANCE }
function is_attrset_id (id)
  { return is_notop_id(id) && (id & ID_SCOPE_MASK) == ID_ATTRSET }
function is_const_id (id)
  { return is_notop_id(id) && (id & ID_SCOPE_MASK) == ID_CONST }
function is_class_id (id)
  { return is_notop_id(id) && (id & ID_SCOPE_MASK) == ID_CLASS }
function is_junk_id (id)
  { return is_notop_id(id) && (id & ID_SCOPE_MASK) == ID_JUNK }
function id_type (id)
  { return is_notop_id(id) ? (id & ID_SCOPE_MASK) : -1 }
function is_asgn_or_id (id)
{
  if (!is_notop_id(id))
    return false;
  var t = id & ID_SCOPE_MASK;
  return t == ID_GLOBAL || t == ID_INSTANCE || t == ID_CLASS;
}

// cuts type bits (of count `ID_SCOPE_SHIFT`)
// and sets one for `ID_ATTRSET`
function rb_id_attrset (id)
{
  id &= ~ID_SCOPE_MASK;
  id |= ID_ATTRSET;
  return id;
}


var op_tbl = // TODO: rethink
{
  "..":         tDOT2,
  "...":        tDOT3,
  "+(binary)":  $('+'),
  "-(binary)":  $('-'),
  "**":         tPOW,
  "**(dstar)":  tDSTAR,
  "+@":         tUPLUS,
  "-@":         tUMINUS,
  "<=>":        tCMP,
  ">=":         tGEQ,
  "<=":         tLEQ,
  "==":         tEQ,
  "===":        tEQQ,
  "!=":         tNEQ,
  "=~":         tMATCH,
  "!~":         tNMATCH,
  "[]":         tAREF,
  "[]=":        tASET,
  "<<":         tLSHFT,
  ">>":         tRSHFT,
  "::":         tCOLON2
};


var rb_id2name = [];
var global_symbols_name2id = {};
for (var k in lexer.rb_reserved_word)
{
  var kw = lexer.rb_reserved_word[k];
  rb_id2name[kw.id0] = k;
  rb_id2name[kw.id1] = k;
}

rb_id2name.length = tLAST_OP_ID;

function register_symid_str (id, name)
{
  rb_id2name[id] = name;
  global_symbols_name2id[name] = id;
}


for (var k in op_tbl)
{
  var id = op_tbl[k];
  register_symid_str(id, k);
}

// print(JSON.stringify(rb_id2name))
// print(JSON.stringify(global_symbols_name2id))



// rb_intern3 rb_intern2 rb_intern_str
function rb_intern (name)
{
  var id = rb_id2name[name];
  if (id !== undefined)
    return id;

  return intern_str(str);
}

function intern_str (name)
{
  var id = 0;
  goto_id_register: {
    switch (name[0])
    {
      case '$':
        id |= ID_GLOBAL;
        break;
      case '@':
        if (name[1] == '@')
        {
          id |= ID_CLASS;
        }
        else
        {
          id |= ID_INSTANCE;
        }
        break;
      default:
        // was: a seach through `op_tbl`, which is precalced above
        //      so we could never get here through the `rb_intern()`

        if (name[name.length-1] == '=')
        {
          /* attribute assignment */
          id = rb_intern(name);
          if (id > tLAST_OP_ID && !is_attrset_id(id))
          {
            id = rb_id_attrset(id); // sets type bits to `ID_ATTRSET`
            break goto_id_register; // was: goto id_register;
          }
          id = ID_ATTRSET;
        }
        else if ('A' <= name[0] && name[0] <= 'Z')
        {
          id = ID_CONST;
        }
        else
        {
          id = ID_LOCAL;
        }
        break;
    }
    // was: new_id:
    id |= ++global_symbols.last_id << ID_SCOPE_SHIFT;
  } // was: id_register:
  return register_symid_str(id, str);
}




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
  return (dyna_in_block() && dvar_defined_get(id)) || local_id(id);
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
  is_local_id: is_local_id,
  lvar_defined: lvar_defined
});



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
    args: vtable_alloc(null),
    vars: vtable_alloc(inherit_dvars ? DVARS_INHERIT : DVARS_TOPSCOPE),
    used: vtable_alloc(null)
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
    case NODE_LIT:
    case NODE_STR:
    case NODE_SELF:
    case NODE_TRUE:
    case NODE_FALSE:
    case NODE_NIL:
      lexer.warn(h, "unused literal ignored");
      return tail;
    default:
      h = end = NEW_BLOCK(head);
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
          useless = rb_id2name[node.mid];
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


function check_cond (node)
{
  if (node == null)
    return null;
  assign_in_cond(node);

  switch (node.type)
  {
    case NODE_DSTR:
    case NODE_EVSTR:
    case NODE_STR:
      lexer.warn("string literal in condition");
      break;

    case NODE_DREGX:
    case NODE_DREGX_ONCE:
      parser_warning(node, "regex literal in condition");
      return NEW_MATCH2(node, NEW_GVAR("$_"));

    case NODE_AND:
    case NODE_OR:
      node.nd_1st = check_cond(node.nd_1st);
      node.nd_2nd = check_cond(node.nd_2nd);
      break;

    case NODE_DOT2:
    case NODE_DOT3:
      node.beg = range_op(node.beg);
      node.end = range_op(node.end);
      if (node.type == NODE_DOT2)
        // was: nd_set_type(node, NODE_FLIP2); TODO: understand
        node.type = NODE_FLIP2;
      else if (node.type == NODE_DOT3)
        // was: nd_set_type(node, NODE_FLIP3); TODO: understand
        node.type = NODE_FLIP3;
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

    case NODE_DSYM:
      parser_warning(node, "literal in condition");
      break;

    case NODE_LIT:
      if (node.lit_type == 'REGEXP')
      {
        parser_warning(node, "regex literal in condition");
        // was: nd_set_type(node, NODE_MATCH); TODO: understand
        node.type = NODE_MATCH;
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
    case NODE_MASGN:
      lexer.yyerror("multiple assignment in conditional");
      return true;

    case NODE_LASGN:
    case NODE_DASGN:
    case NODE_DASGN_CURR:
    case NODE_GASGN:
    case NODE_IASGN:
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
  if (type == NODE_LIT && node.lit_type == 'FIXNUM')
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
    case NODE_LIT:
    case NODE_STR:
    case NODE_DSTR:
    case NODE_EVSTR:
    case NODE_DREGX:
    case NODE_DREGX_ONCE:
    case NODE_DSYM:
      return 2;
    case NODE_TRUE:
    case NODE_FALSE:
    case NODE_NIL:
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
    case NODE_HASH:
      if (!(node = node.head))
        break;
    case NODE_ARRAY:
      do
      {
        if (!is_static_content(node.head))
          return false;
      }
      while ((node = node.next) != null);
    case NODE_LIT:
    case NODE_STR:
    case NODE_NIL:
    case NODE_TRUE:
    case NODE_FALSE:
    case NODE_ZARRAY:
      break;
    default:
      return false;
  }
  return true;
}


function value_expr (node)
{
  var cond = false;

  if (!node)
  {
    lexer.warn("empty expression");
  }
  while (node)
  {
    switch (node.type)
    {
      case NODE_DEFN:
      case NODE_DEFS:
        parser_warning(node, "void value expression");
        return false;

      case NODE_RETURN:
      case NODE_BREAK:
      case NODE_NEXT:
      case NODE_REDO:
      case NODE_RETRY:
        if (!cond)
          lexer.yyerror("void value expression");
        /* or "control never reach"? */
        return false;

      case NODE_BLOCK:
        while (node.next)
        {
          node = node.next;
        }
        node = node.head;
        break;

      case NODE_BEGIN:
        node = node.body;
        break;

      case NODE_IF:
        if (!node.body) // aka "then"
        {
          node = node.elsee;
          break;
        }
        else if (!node.elsee)
        {
          node = node.body;
          break;
        }
        if (!value_expr(node.body))
          return false;
        node = node.elsee;
        break;

      case NODE_AND:
      case NODE_OR:
        cond = true;
        node = node.nd_2nd;
        break;

      default:
        return true;
    }
  }

  return true;
}

function new_op_assign (lhs, op, rhs)
{
  var asgn = null;

  if (lhs)
  {
    var vid = lhs.vid; // TODO: ID op operation: tPOW, $('*'), tLSHFT, etc.
    if (op == tOROP)
    {
      lhs.value = rhs;
      asgn = NEW_OP_ASGN_OR(gettable(vid), lhs);
      if (is_asgn_or_id(vid))
      {
        asgn.aid = vid;
      }
    }
    else if (op == tANDOP)
    {
      lhs.value = rhs;
      asgn = NEW_OP_ASGN_AND(gettable(vid), lhs);
    }
    else
    {
      asgn = lhs;
      asgn.value = NEW_CALL(gettable(vid), op, NEW_LIST(rhs));
    }
  }
  else
  {
    asgn = NEW_BEGIN(null);
  }
  return asgn;
}

// TODO: understand and... rewrite :)
function gettable (id)
{
  throw 'TODO: function gettable (id)';
  switch (id)
  {
    case keyword_self:
      return NEW_SELF();
    case keyword_nil:
      return NEW_NIL();
    case keyword_true:
      return NEW_TRUE();
    case keyword_false:
      return NEW_FALSE();
    case keyword__FILE__:
      return
        NEW_STR(ruby_sourcefile);
    case keyword__LINE__:
      return NEW_LIT(INT2FIX(tokline));
    case keyword__ENCODING__:
      return NEW_LIT(rb_enc_from_encoding(current_enc));
  }
  switch (id_type(id))
  {
    case ID_LOCAL:
      if (dyna_in_block() && dvar_defined(id))
        return NEW_DVAR(id);
      if (local_id(id))
        return NEW_LVAR(id);
      /* method call without arguments */
      return NEW_VCALL(id);
    case ID_GLOBAL:
      return NEW_GVAR(id);
    case ID_INSTANCE:
      return NEW_IVAR(id);
    case ID_CONST:
      return NEW_CONST(id);
    case ID_CLASS:
      return NEW_CVAR(id);
  }
  lexer.compile_error("identifier %s is not valid to get", rb_id2name[id]);
  return null;
}

// used only in new_op_assign()
// TODO: understand
function is_asgn_or_id (id)
{
  // ((is_notop_id(id)) && \ // isn't an operator
  // (((id)&ID_SCOPE_MASK) == ID_GLOBAL || \    // $*
  // ((id)&ID_SCOPE_MASK) == ID_INSTANCE || \   // @*
  // ((id)&ID_SCOPE_MASK) == ID_CLASS))         // @@*
  
  // may translate to:
  // typeof id == "string"
  // id[0] == '$'
  // id[0] == '@' && id[1] != '@'
  // id[0] == '@' && id[1] == '@'
  
  return true;
}

function arg_concat_gen (node1, node2)
{
  if (!node2)
    return node1;
  switch (node1.type)
  {
    case NODE_BLOCK_PASS:
      if (node1.head)
        node1.head = arg_concat(node1.head, node2);
      else
        node1.head = NEW_LIST(node2);
      return node1;
    case NODE_ARGSPUSH:
      if (node2.type != NODE_ARRAY)
        break;
      node1.body = list_concat(NEW_LIST(node1.body), node2);
      // was: nd_set_type(node1, NODE_ARGSCAT);
      node1.type = NODE_ARGSCAT; // TODO
      return node1;
    case NODE_ARGSCAT:
      if (node2.type != NODE_ARRAY ||
          node1.body.type != NODE_ARRAY)
        break;
      node1.body = list_concat(node1.body, node2);
      return node1;
  }
  return NEW_ARGSCAT(node1, node2);
}

function list_concat (head, tail)
{
  var last = null;

  if (head.next)
  {
    last = head.next.end;
  }
  else
  {
    last = head;
  }

  head.alen += tail.alen;
  last.next = tail;
  if (tail.next)
  {
    head.next.end = tail.next.end;
  }
  else
  {
    head.next.end = tail;
  }

  return head;
}

function new_attr_op_assign (lhs, attr, op, rhs)
{
  if (op == tOROP)
  {
    op = 0;
  }
  else if (op == tANDOP)
  {
    op = 1;
  }
  // var asgn = new NEW_OP_ASGN2(lhs, attr, op, rhs);
  
  var asgn = NEW_OP_ASGN2
  (
    lhs,
    rhs,
    NEW_OP_ASGN2
    (
      attr,
      op,
      rb_id_attrset(attr)
    )
  )
  
  fixpos(asgn, lhs);
  return asgn;
}
