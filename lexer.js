"use strict";

;(function(){

function parser_yylex (text)
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
        return -1;

      parser.eofp = true;
      lex_goto_eol();
      return -1;
  }
  var c = text[lex_p++];
  if (c == '\r' && peek('\n'))
  {
    lex_p++;
    c = '\n';
  }

  return c;
}


function pushback(c)
{
  if (c == -1)
    return;
  lex_p--;
  if (lex_p > lex_pbeg && lex_p_get(0) == '\n' && lex_p_get(-1) == '\r')
  {
    lex_p--;
  }
}


function char_by_char (text)
{
  function isa_az_AZ09 (c)
  {
    return !!( // !! saves a bit in v8
      ('a' <= c && c <= 'z') ||
      ('A' <= c && c <= 'Z') ||
      ('0' <= c && c <= '9') ||
       '_' == c
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
  
  var lastPos = text.length - 1
  var pos = -1
  function nextc ()
  {
    if (pos >= lastPos)
      return ''
    
    return text.charAt(++pos)
  }
  
  var tokens = [],
      values = []
  
  var c = nextc()
  for (;;)
  {
    if (isa_az_AZ(c))
    {
      var start = pos // of the c
      while (isa_az_AZ09(c = nextc()));
      if (c === '?')
        c = nextc()
      tokens.push(257)
      values.push(text.substring(start, pos))
      // c is new
      continue
    }
    
    if (isa_space(c))
    {
      while (isa_space(c = nextc()));
      tokens.push(262)
      // c is new
      continue
    }
    
    if (isa_brace(c))
    {
      tokens.push(258)
      c = nextc()
      continue
    }
    
    if (c === '.')
    {
      tokens.push(259)
      c = nextc()
      continue
    }
    
    if (c === ':')
    {
      tokens.push(260)
      c = nextc()
      continue
    }
    
    if (c === ',')
    {
      tokens.push(261)
      c = nextc()
      continue
    }
    
    if (c === '') // eof
      break
    
    // unknown symbol
    tokens.push(0)
    c = nextc()
  }
  
  return tokens.length + values.length
}

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
measure(parser_yylex, repeat)

})();