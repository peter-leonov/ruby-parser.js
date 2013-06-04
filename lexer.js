"use strict";

;(function(){

function create_lexer (text)
{

var parser =
{
  eofp: false,
  line_count: 0
};

var parser_lex_strterm = 0;
var parser_cond_stack = 0;
var parser_cmdarg_stack = 0;
var parser_class_nest = 0;
var parser_paren_nest = 0;
var parser_lpar_beg = 0;
var parser_brace_nest = 0;
var parser_in_single = 0;
var parser_in_def = 0;
var parser_in_defined = 0;
var parser_compile_for_eval = 0;
var parser_cur_mid = 0;
var parser_tokenbuf = null;
var parser_tokidx = 0;
var parser_toksiz = 0;
var heredoc_end = 0;
var parser_command_start = true;
var parser_deferred_nodes = 0;
var lex_pbeg = 0;
var lex_p = 0;
var lex_pend = 0;
var parser_lvtbl = 0;
var parser_ruby__end__seen = 0;
var parser_ruby_sourcefile = ''; /* current source file */
var is_ripper = 0;
var parser_eval_tree_begin = 0;
var parser_eval_tree = 0;

var lex_input = 0;
var lex_nextline = 0;
var ruby_sourceline = 0; /* current line no. */


function lex_p_get (i)
{
  return text[lex_p + i];
}

function lex_goto_eol () { return lex_p = lex_pend }

function peek (c)
{
  return peek_n(c, 0)
}

function peek_n (c, n)
{
  return lex_p + n < lex_pend && c == lex_p_get(n)
}

function nextc ()
{
  if (lex_p == lex_pend)
  {
      if (parser.eofp)
        return '';

      parser.eofp = true;
      lex_goto_eol();
      return '';
  }
  var c = text[lex_p++];
  if (c == '\r' && peek('\n'))
  {
    lex_p++;
    c = '\n';
  }

  return c;
}


function pushback (c)
{
  if (c == '')
    return;
  
  lex_p--;
  if (lex_p > lex_pbeg && lex_p_get(0) == '\n' && lex_p_get(-1) == '\r')
  {
    lex_p--;
  }
}

function isa_az_AZ09 (c)
{
  return !!( // !! saves a bit in v8
    ('a' <= c && c <= 'z') ||
    ('A' <= c && c <= 'Z') ||
    ('0' <= c && c <= '9') ||
    c == '_'
  )
}
function isa_az_AZ (c)
{
  return !!( // !! saves a bit in v8
    ('a' <= c && c <= 'z') ||
    ('A' <= c && c <= 'Z') ||
    c == '_'
  )
}

function isa_brace (c)
{
  return !!( // !! saves a bit in v8
    c === '(' || c === ')' ||
    c === '[' || c === ']' ||
    c === '{' || c === '}'
  )
}

function isa_space (c)
{
  return !!( // !! saves a bit in v8
    c === ' ' || c === '\r' ||
    c === '\n' || c === '\t'
  )
}

lex_pend = text.length

return function parser_yylex ()
{
  var c = ''
  
  retry: for (;;)
  {
    return 0
  }
}

}

function lex_all (text)
{
  var lexer = create_lexer(text)
  
  var t = 0
  while (t = lexer())
    print(t)
}


var bigText = read('text.txt')

function measure (f, count)
{
  print(f.name + '()')
  
  var begin = new Date()
  for (var i = 0; i < count; i++)
  {
    var res = f(bigText)
  }
  var end = new Date()
  
  print('  mean:', (end - begin) / count)
  print('  res:', res)
  print()
}

function warmup ()
{
  var start = new Date()
  for (;;)
  {
    for (var i = 0; i < 1000; i++)
      /ghfj%dksl/.test(bigText)
    
    if (new Date() - start > 1000)
      break
  }
}

// // light
var repeat = 1

// heavy
// var repeat = 100; warmup()
measure(lex_all, repeat)

})();