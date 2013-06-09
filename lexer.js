"use strict";

load('tokens.js')

;(function(){

// $stream: plain old JS string with ruby source code
function Lexer ($stream)
{

// the lex() method and all public data sit here
var lexer = this;
// the end of stream had been reached
lexer.eofp = false;
// the string to be parsed in the nex lex() call
lexer.strterm = null;
// the main point of interaction with the parser out there
lexer.state = 0;
// have no idea
lexer.command_start = false;



// ignore newline, +/- is a sign.
var EXPR_BEG    = 1 << 0;
// newline significant, +/- is an operator.
var EXPR_END    = 1 << 1;
// ditto, and unbound braces.
var EXPR_ENDARG = 1 << 2;
// ditto, and unbound braces.
var EXPR_ENDFN  = 1 << 3;
// newline significant, +/- is an operator.
var EXPR_ARG    = 1 << 4;
// newline significant, +/- is an operator.
var EXPR_CMDARG = 1 << 5;
// newline significant, +/- is an operator.
var EXPR_MID    = 1 << 6;
// ignore newline, no reserved words.
var EXPR_FNAME  = 1 << 7;
// right after `.' or `::', no reserved words.
var EXPR_DOT    = 1 << 8;
// immediate after `class', no here document.
var EXPR_CLASS  = 1 << 9;
// alike EXPR_BEG but label is disallowed.
var EXPR_VALUE  = 1 << 10;

var EXPR_BEG_ANY = EXPR_BEG | EXPR_VALUE | EXPR_MID | EXPR_CLASS;
var EXPR_ARG_ANY = EXPR_ARG | EXPR_CMDARG;
var EXPR_END_ANY = EXPR_END | EXPR_ENDARG | EXPR_ENDFN;

// the shortcut for checking `lexer.state` over and over again
function IS_lex_state (state)
{
  return lexer.state & state
}


// here go all $strem related functions

var $streamLength = $stream.length;
var $pos = 0;

// just an emulation of pos[i] from C
function nthchar (i)
{
  return $stream[$pos + i];
}

// search for `\n` and stop right after it,
// if the position of `\n` been found at 3: "abc|\n"
// then `$pos` will be 4: "abc\n|"
function lex_goto_eol ()
{
  while (nextc() != '\n');
}

// forecast, if the nextc() will return character `c`
function peek (c)
{
  return $pos < $streamLength && c == $stream[$pos];
}

// forecast, if the nextc() will return character `c`
// after n calls
function peek_n (c, n)
{
  var pos = $pos + n;
  return pos < $streamLength && c == $stream[pos];
}

// returns next character from the `$stream`,
// or an empty string '' if there is no more characters
function nextc ()
{
  if ($pos >= $streamLength)
  {
    lexer.eofp = true;
    return '';
  }
  
  return $stream[$pos++];
}

// step back for one character and check
// if the current character is equal to `c`
function pushback (c)
{
  if (c == '')
  {
    if ($pos != $streamLength)
      throw 'lexer error: pushing back wrong EOF char';
    return;
  }
  
  $pos--;
  if ($stream[$pos] != c)
    throw 'lexer error: pushing back wrong "'+c+'" char';
}

this.lex = function yylex ()
{
  var c = '';
  var space_seen = false;
  
  if (lexer.strterm)
  {
    var token = 0;
    if (lexer.strterm.type == 'HEREDOC')
    {
      token = here_document(lexer.strterm);
      if (token == tSTRING_END)
      {
        lexer.strterm = null;
        lexer.state = EXPR_END;
      }
    }
    else
    {
      token = parse_string(lexer.strterm);
      if (token == tSTRING_END || token == tREGEXP_END)
      {
        lexer.strterm = null;
        lex_state = EXPR_END;
      }
    }
    return token;
  }
  
  var cmd_state = lexer.command_start;
  lexer.command_start = false;
  
  retry: for (;;)
  {
  var last_state = lexer.strterm;
  switch (c = nextc())
  {
    // different signs of the input end
    case '\0':    // NUL
    case '\x04':  // ^D
    case '\x1a':  // ^Z
    case '':      // end of script.
    {
      return 0;
    }
    
    // white spaces
    case ' ':
    case '\t':
    case '\f':
    case '\r':
    case '\v':    // '\13'
    {
      space_seen = true;
      continue retry;
    }
    
    // it's a comment
    case '#':
    {
      lex_goto_eol();
      // fall throug to '\n'
    }
    case '\n':
    {
      if (IS_lex_state(
          EXPR_BEG | EXPR_VALUE | EXPR_CLASS | EXPR_FNAME | EXPR_DOT
      ))
      {
        continue retry;
      }
      after_backslash_n: while ((c = nextc()))
      {
        switch (c)
        {
          case ' ':
          case '\t':
          case '\f':
          case '\r':
          case '\v':    // '\13'
            space_seen = 1;
            break;
          case '.':
          {
            if ((c = nextc()) != '.')
            {
              pushback(c);
              pushback('.');
              continue retry;
            }
          }
          default:
            // --ruby_sourceline; TODO:
            // lex_nextline = lex_lastline; TODO:
            
          // EOF no decrement
          case '':
            lex_goto_eol();
            break after_backslash_n;
        }
      }
      // lands: break after_backslash_n;
      lexer.command_start = true;
      lexer.state = EXPR_BEG;
      return '\n';
    }
  }
  
  return c ? 256 : 0
  
  } // retry for loop
}

}

function lex_all (text)
{
  var lexer = new Lexer(text)
  
  var t = 0
  while (t = lexer.lex())
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