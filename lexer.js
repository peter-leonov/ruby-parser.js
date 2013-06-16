(function(){

// at first, read this: http://whitequark.org/blog/2013/04/01/ruby-hacking-guide-ch-11-finite-state-lexer/

function Lexer ()
{
// the yylex() method and all public data sit here
var lexer = this;

// $text: plain old JS string with ruby source code,
// to be set later in `setText()`
var $text = '';
lexer.setText = function (text) { $text = text; }

// the end of stream had been reached
lexer.eofp = false;
// the string to be parsed in the nex lex() call
lexer.lex_strterm = null;
// the main point of interaction with the parser out there
lexer.lex_state = 0;
// to store the main state
lexer.last_state = 0;
// have the lexer seen a space somewhere before the current char
lexer.space_seen = false;
// parser and lexer set this for lexer,
// becomes `true` after `\n`, `;` or `(` is met
lexer.command_start = false;
// temp var for command_start during single run of `yylex`
lexer.cmd_state = false;
// used in `COND_*` macro-methods,
// another spot of interlacing parser and lexer
lexer.cond_stack = 0;
// used in `CMDARG_*` macro-methods,
// another spot of interlacing parser and lexer
lexer.cmdarg_stack = 0;
// controls level of nesting in `()` or `[]`
lexer.paren_nest = 0;
lexer.lpar_beg = 0;
// controls level of nesting in `{}`
lexer.brace_nest = 0;
// controls the nesting of states of condition-ness and cmdarg-ness
lexer.cond_stack = 0;
lexer.cmdarg_stack = 0;
// how deep in in singleton definition are we?
lexer.in_single = 0;
// are we in def …
lexer.in_def = 0;
// current method id/name (while in def …)
lexer.cur_mid = '';
// defined? … has its own roles of lexing
lexer.in_defined = false;
// have we seen `__END__` already in lexer?
lexer.ruby__end__seen = false;
// parser needs access to the line number,
// AFAICT, parser never changes it, only sets nd_line on nodes
lexer.ruby_sourceline = 0;
// parser doesn't touch it, but what is it?
lexer.heredoc_end = 0;
lexer.line_count = 0;
// TODO: check out list of stateful variables with the original

// all lexer states codes had been moved to parse.y prologue

// the shortcut for checking `lexer.lex_state` over and over again
function IS_lex_state (ls)
{
  return lexer.lex_state & ls;
}
function IS_lex_state_for (state, ls)
{
  return state & ls;
}

# define BITSTACK_PUSH(stack, n)	((stack) = ((stack)<<1)|((n)&1))
# define BITSTACK_POP(stack)	((stack) = (stack) >> 1)
# define BITSTACK_LEXPOP(stack)	((stack) = ((stack) >> 1) | ((stack) & 1))
# define BITSTACK_SET_P(stack)	((stack)&1)

// interface to lexer.cond_stack
// void
lexer.COND_PUSH = function (n)
{
  // was: BITSTACK_PUSH(cond_stack, n)
  lexer.cond_stack = (lexer.cond_stack << 1) | (n & 1);
}
// void
lexer.COND_POP = function ()
{
  // was: BITSTACK_POP(cond_stack)
  lexer.cond_stack >>= 1;
}
// void
lexer.COND_LEXPOP = function ()
{
  // was: BITSTACK_LEXPOP(cond_stack)
  var stack = lexer.cond_stack;
  lexer.cond_stack = (stack >> 1) | (stack & 1);
}
// int
lexer.COND_P = function ()
{
  // was: BITSTACK_SET_P(cond_stack)
  return lexer.cond_stack & 1;
}

// interface to lexer.cmdarg_stack
// void
lexer.CMDARG_PUSH = function (n)
{
  // was: BITSTACK_PUSH(cmdarg_stack, n)
  lexer.cmdarg_stack = (lexer.cmdarg_stack << 1) | (n & 1);
}
// void
lexer.CMDARG_POP = function ()
{
  // was: BITSTACK_POP(cmdarg_stack)
  lexer.cmdarg_stack >>= 1;
}
// void
lexer.CMDARG_LEXPOP = function ()
{
  // was: BITSTACK_LEXPOP(cmdarg_stack)
  var stack = lexer.cmdarg_stack;
  lexer.cmdarg_stack = (stack >> 1) | (stack & 1);
}
// int
lexer.CMDARG_P = function ()
{
  // was: BITSTACK_SET_P(cmdarg_stack)
  return lexer.cmdarg_stack & 1;
}



// few more shortcuts
function IS_ARG () { return lexer.lex_state & EXPR_ARG_ANY }
function IS_END () { return lexer.lex_state & EXPR_END_ANY }
function IS_BEG () { return lexer.lex_state & EXPR_BEG_ANY }
function IS_LABEL_POSSIBLE ()
{
  return (IS_lex_state(EXPR_BEG) && !lexer.cmd_state) || IS_ARG();
}
function IS_LABEL_SUFFIX (n)
{
  return peek_n(':', n) && !peek_n(':', n + 1);
}

// em…
function IS_SPCARG (c)
{
  return IS_ARG() &&
         lexer.space_seen &&
         !ISSPACE(c);
}

function IS_AFTER_OPERATOR () { return IS_lex_state(EXPR_FNAME | EXPR_DOT) }

function ambiguous_operator (op, syn)
{
  warning("`"+op+"' after local variable is interpreted as binary operator");
  warning("even though it seems like "+syn);
}
// very specific warning function :)
function warn_balanced (op, syn, c)
{
    if
    (
      !IS_lex_state_for
      (
        lexer.last_state,
        EXPR_CLASS | EXPR_DOT | EXPR_FNAME | EXPR_ENDFN | EXPR_ENDARG
      )
      && lexer.space_seen
      && !ISSPACE(c)
    )
    {
      ambiguous_operator(op, syn);
    }
}

var STR_FUNC_ESCAPE = 0x01;
var STR_FUNC_EXPAND = 0x02;
var STR_FUNC_REGEXP = 0x04;
var STR_FUNC_QWORDS = 0x08;
var STR_FUNC_SYMBOL = 0x10;
var STR_FUNC_INDENT = 0x20;

// enum string_type
var str_squote = 0;
var str_dquote = STR_FUNC_EXPAND;
var str_xquote = STR_FUNC_EXPAND;
var str_regexp = STR_FUNC_REGEXP | STR_FUNC_ESCAPE | STR_FUNC_EXPAND;
var str_sword = STR_FUNC_QWORDS;
var str_dword = STR_FUNC_QWORDS | STR_FUNC_EXPAND;
var str_ssym = STR_FUNC_SYMBOL;
var str_dsym = STR_FUNC_SYMBOL | STR_FUNC_EXPAND;





// here go all $strem related functions

function ISUPPER (c)
{
  return 'A' <= c && c <= 'Z';
}
function ISSPACE (c)
{
  return (
    // the most common checked first
    c === ' '  || c === '\n' || c === '\t' ||
    c === '\f' || c === '\v'
  )
}
// our own modification, does not match `\n`
// used to avoid crossing end of line on white space search
function ISSPACE_NOT_N (c)
{
  return (
    // the most common checked first
    c === ' '  || c === '\t' ||
    c === '\f' || c === '\v'
  )
}


var lex_pbeg = 0, // lex_pbeg never changes
    lex_p = 0,
    lex_pend = 0;

var $text_pos = 0;
// returns empty line as EOF
function lex_getline ()
{
  var i = $text.indexOf('\n', $text_pos);
  // didn't get any more newlines
  if (i === -1)
  {
    // the rest of the line
    // e.g. match the `$`
    i = $text.length;
  }
  else
  {
    i++; // include the `\n` char
  }
  
  var line = $text.substring($text_pos, i);
  $text_pos = i;
  return line;
}


var lex_nextline = '',
    lex_lastline = '';
function nextc ()
{
  if (lex_p == lex_pend)
  {
    var v = lex_nextline;
    lex_nextline = '';
    if (!v)
    {
      if (lexer.eofp)
        return '';

      if (!(v = lex_getline()))
      {
        lexer.eofp = true;
        lex_goto_eol();
        return '';
      }
    }
    {
      if (lexer.heredoc_end > 0)
      {
        lexer.ruby_sourceline = lexer.heredoc_end;
        lexer.heredoc_end = 0;
      }
      lexer.ruby_sourceline++;
      lexer.line_count++;
      lex_pbeg = lex_p = 0;
      lex_pend = v.length;
      lex_lastline = v;
    }
  }
  
  return lex_lastline[lex_p++];
}
// jump right to the end of current buffered line,
// here: "abc\n|" or here "abc|"
function lex_goto_eol ()
{
  lex_p = lex_pend;
}
function lex_eol_p ()
{
  return lex_p >= lex_pend;
}

// just an emulation of lex_p[i] from C
function nthchar (i)
{
  return lex_lastline[lex_p+i];
}
// just an emulation of *lex_p from C
function lex_pv ()
{
  return lex_lastline[lex_p];
}

// forecast, if the nextc() will return character `c`
function peek (c)
{
  return lex_p < lex_pend && c === lex_lastline[lex_p];
}

// forecast, if the nextc() will return character `c`
// after n calls
function peek_n (c, n)
{
  var pos = lex_p + n;
  return pos < lex_pend && c === lex_lastline[pos];
}

// expects rex in this form: `/blablabla|/g`
// that means `blablabla` or empty string (to prevent deep search)
function match_grex (rex)
{
#if DEBUG
  // check if the rex is in proper form
  if (!rex.global)
  {
    yyerror('match_grex() allows only global regexps: `…|/g`');
    throw 'DEBUG';
  }
  if (rex.source.substr(-1) != '|')
  {
    yyerror('match_grex() need trailing empty string match: `…|/g`');
    throw 'DEBUG';
  }
#endif
  rex.lastIndex = lex_p;
  // there is always a match or an empty string in [0]
  return rex.exec(lex_lastline);
}
// step back for one character and check
// if the current character is equal to `c`
function pushback (c)
{
  if (c == '')
  {
#if DEBUG
    if (lex_p != lex_pend)
      throw 'lexer error: pushing back wrong EOF char';
#endif
    return;
  }
  
  lex_p--;
#if DEBUG
  if (lex_lastline[lex_p] != c)
    throw 'lexer error: pushing back wrong "'+c+'" char';
#endif
}

// was begin af a line (`^` in terms of regexps) before last `nextc()`,
// that true if we're here "a|bc" of here "abc\na|bc"
function was_bol ()
{
  return lex_p === /*lex_pbeg +*/ 1; // lex_pbeg never changes
}


// token related stuff

var $tokenbuf = '',
    $tok_start = 0,
    $tok_end = 0;
    
function newtok ()
{
  $tok_start = $text_pos;
  $tokenbuf = '';
}
function tokadd (c)
{
  $tokenbuf += c;
  return c;
}

function tokfix ()
{
  $tok_end = $text_pos;
  /* was: tokenbuf[tokidx]='\0'*/
}
function tok () { return $tokenbuf; }
function toklen () { return $tokenbuf.length; }
function toklast ()
{
  return $tokenbuf.substr(-1)
  // was: tokidx>0?tokenbuf[tokidx-1]:0)
}

// TODO
this.getLVal = function () { return $tokenbuf; }



// other stuff

function parser_is_identchar (c)
{
  return !lexer.eofp && is_identchar(c);
  
}
function is_identchar (c)
{
  // \w = [A-Za-z0-9_] = (isalnum(c) || c == '_')
  return /^\w/.test(c) || !ISASCII(c);
}

function NEW_STRTERM (func, term, paren)
{
  return {
    type: 'NODE_STRTERM',
    nd_func: func,
    nd_orig: '', // stub
    nd_nth: 0, // stub
    nd_line: lexer.ruby_sourceline,
    nd_nest: 0, // for tokadd_string() and parse_string()
    term: term,
    paren: paren
  };
}
// our addition
function NEW_HEREDOCTERM (func, term)
{
  return {
    type: 'NODE_HEREDOC',
    nd_func: func,
    nd_orig: lex_lastline,
    nd_nth: lex_p,
    nd_line: lexer.ruby_sourceline,
    nd_nest: 0,
    term: term,
    paren: ''
  };
}

// char to code shortcut
function $ (c) { return c.charCodeAt(0) }
function $$ (code) { return String.fromCharCode(code) }

function ISASCII (c)
{
  return $(c) < 128;
}

function ISDIGIT (c)
{
  return /^\d$/.test(c);
}
function ISALNUM (c)
{
  return /^\w$/.test(c);
}

// TODO: get rid of such a piece of junk :)
function arg_ambiguous ()
{
  warning("ambiguous first argument; put parentheses or even spaces");
  return true;
}






this.yylex = function yylex ()
{
  var c = '';
  lexer.space_seen = false;
  
  if (lexer.lex_strterm)
  {
    var token = 0;
    if (lexer.lex_strterm.type == 'NODE_HEREDOC')
    {
      token = here_document(lexer.lex_strterm);
      if (token == tSTRING_END)
      {
        lexer.lex_strterm = null;
        lexer.lex_state = EXPR_END;
      }
    }
    else
    {
      token = parse_string(lexer.lex_strterm);
      if (token == tSTRING_END || token == tREGEXP_END)
      {
        lexer.lex_strterm = null;
        lexer.lex_state = EXPR_END;
      }
    }
    return token;
  }
  
  lexer.cmd_state = lexer.command_start;
  lexer.command_start = false;
  
  retry: for (;;)
  {
  lexer.last_state = lexer.lex_state;
  the_giant_switch:
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
    case '\r': // TODO: cream on `\r` everywhere, or clear it out
    case '\v':    // '\13'
    {
      lexer.space_seen = true;
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
      if (IS_lex_state(EXPR_BEG | EXPR_VALUE | EXPR_CLASS | EXPR_FNAME | EXPR_DOT))
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
            lexer.space_seen = true;
            break;
          case '.':
          {
            if ((c = nextc()) != '.')
            {
              pushback(c);
              pushback('.');
              continue retry; // was: goto retry;
            }
          }
          default:
            --lexer.ruby_sourceline;
            lex_nextline = lex_lastline;
            
          // EOF no decrement
          case '':
            lex_goto_eol();
            break after_backslash_n;
        }
      }
      // lands: break after_backslash_n;
      lexer.command_start = true;
      lexer.lex_state = EXPR_BEG;
      return $('\n');
    }
  
    case '*':
    {
      var token = 0
      if ((c = nextc()) == '*')
      {
        if ((c = nextc()) == '=')
        {
          // set_yylval_id(tPOW); TODO
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        if (IS_SPCARG(c))
        {
          warning("`**' interpreted as argument prefix");
          token = tDSTAR;
        }
        else if (IS_BEG())
        {
          token = tDSTAR;
        }
        else
        {
          warn_balanced("**", "argument prefix", c);
          token = tPOW;
        }
      }
      else
      {
        if (c == '=')
        {
          // set_yylval_id('*'); TODO
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        if (IS_SPCARG(c))
        {
          warning("`*' interpreted as argument prefix");
          token = tSTAR;
        }
        else if (IS_BEG())
        {
          token = tSTAR;
        }
        else
        {
          warn_balanced("*", "argument prefix", c);
          token = $('*');
        }
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      return token;
    }
    
    case '!':
    {
      c = nextc();
      if (IS_AFTER_OPERATOR())
      {
        lexer.lex_state = EXPR_ARG;
        if (c == '@')
        {
          return $('!');
        }
      }
      else
      {
        lexer.lex_state = EXPR_BEG;
      }
      if (c == '=')
      {
        return tNEQ;
      }
      if (c == '~')
      {
        return tNMATCH;
      }
      pushback(c);
      return $('!');
    }
    
    case '=':
    {
      // TODO: skip embedded rd document */

      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      if ((c = nextc()) == '=')
      {
        if ((c = nextc()) == '=')
        {
          return tEQQ;
        }
        pushback(c);
        return tEQ;
      }
      if (c == '~')
      {
        return tMATCH;
      }
      else if (c == '>')
      {
        return tASSOC;
      }
      pushback(c);
      return $('=');
    }
    
    case '<':
    {
      lexer.last_state = lexer.lex_state;
      c = nextc();
      if (c == '<' &&
          !IS_lex_state(EXPR_DOT | EXPR_CLASS) &&
          !IS_END() && (!IS_ARG() || lexer.space_seen))
      {
        var token = heredoc_identifier();
        if (token)
          return token;
      }
      if (IS_AFTER_OPERATOR())
      {
        lexer.lex_state = EXPR_ARG;
      }
      else
      {
        if (IS_lex_state(EXPR_CLASS))
          lexer.command_start = true;
        lexer.lex_state = EXPR_BEG;
      }
      if (c == '=')
      {
        if ((c = nextc()) == '>')
        {
          return tCMP;
        }
        pushback(c);
        return tLEQ;
      }
      if (c == '<')
      {
        if ((c = nextc()) == '=')
        {
          // set_yylval_id(tLSHFT); TODO
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        warn_balanced("<<", "here document", c);
        return tLSHFT;
      }
      pushback(c);
      return $('<');
    }
    
    case '>':
    {
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      if ((c = nextc()) == '=')
      {
        return tGEQ;
      }
      if (c == '>')
      {
        if ((c = nextc()) == '=')
        {
          // set_yylval_id(tRSHFT); TODO
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        return tRSHFT;
      }
      pushback(c);
      return $('>');
    }
    
    case '"':
    {
      lexer.lex_strterm = NEW_STRTERM(str_dquote, '"', '')
      return tSTRING_BEG;
    }
    
    case '`':
    {
      if (IS_lex_state(EXPR_FNAME))
      {
        lexer.lex_state = EXPR_ENDFN;
        return $(c);
      }
      if (IS_lex_state(EXPR_DOT))
      {
        if (lexer.cmd_state)
          lexer.lex_state = EXPR_CMDARG;
        else
          lexer.lex_state = EXPR_ARG;
        return $(c);
      }
      lexer.lex_strterm = NEW_STRTERM(str_xquote, '`', '');
      return tXSTRING_BEG;
    }
    
    case '\'':
    {
      lexer.lex_strterm = NEW_STRTERM(str_squote, '\'', '');
      return tSTRING_BEG;
    }
    
    case '?':
    {
      // trying to catch ternary operator
      if (IS_END())
      {
        lexer.lex_state = EXPR_VALUE;
        return $('?');
      }
      c = nextc();
      if (c == '')
      {
        compile_error("incomplete character syntax");
        return 0;
      }
      if (ISSPACE(c))
      {
        if (!IS_ARG())
        {
          var c2 = '';
          switch (c)
          {
            case ' ':
              c2 = 's';
              break;
            case '\n':
              c2 = 'n';
              break;
            case '\t':
              c2 = 't';
              break;
            case '\v':
              c2 = 'v';
              break;
            case '\r':
              c2 = 'r';
              break;
            case '\f':
              c2 = 'f';
              break;
          }
          if (c2)
          {
            warning("invalid character syntax; use ?\\" + c2);
          }
        }
        pushback(c);
        lexer.lex_state = EXPR_VALUE;
        return $('?');
      }
      newtok();
      if (!ISASCII(c))
      {
        if (tokadd(c) == '')
          return 0;
      }
      else if (is_identchar(c) && lex_p < lex_pend && is_identchar(lex_pv()))
      {
        pushback(c);
        lexer.lex_state = EXPR_VALUE;
        return $('?');
      }
      else if (c == '\\')
      {
        if (peek('u'))
        {
          nextc();
          c = parser_tokadd_utf8(false, false, false);
          tokadd(c);
        }
        else if (!lex_eol_p() && !(c = lex_pv(), ISASCII(c)))
        {
          nextc();
          if (tokadd(c) == '')
            return 0;
        }
        else
        {
          c = read_escape(0);
          tokadd(c);
        }
      }
      else
      {
        tokadd(c);
      }
      tokfix();
      // set_yylval_str(STR_NEW3(tok(), toklen(), enc, 0)); TODO
      lexer.lex_state = EXPR_END;
      return tCHAR;
    }
    
    case '&':
    {
      if ((c = nextc()) == '&')
      {
        lexer.lex_state = EXPR_BEG;
        if ((c = nextc()) == '=')
        {
          // set_yylval_id(tANDOP); TODO
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        return tANDOP;
      }
      else if (c == '=')
      {
        // set_yylval_id('&'); TODO
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      pushback(c);
      var t = $(c);
      if (IS_SPCARG(c))
      {
        warning("`&' interpreted as argument prefix");
        t = tAMPER;
      }
      else if (IS_BEG())
      {
        t = tAMPER;
      }
      else
      {
        warn_balanced("&", "argument prefix", c);
        t = $('&');
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      return t;
    }
    
    case '|':
    {
      if ((c = nextc()) == '|')
      {
        lexer.lex_state = EXPR_BEG;
        if ((c = nextc()) == '=')
        {
          // set_yylval_id(tOROP); TODO
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        return tOROP;
      }
      if (c == '=')
      {
        // set_yylval_id('|'); TODO
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      pushback(c);
      return $('|');
    }
    
    case '+':
    {
      c = nextc();
      if (IS_AFTER_OPERATOR())
      {
        lexer.lex_state = EXPR_ARG;
        if (c == '@')
        {
          return tUPLUS;
        }
        pushback(c);
        return $('+');
      }
      if (c == '=')
      {
        // set_yylval_id('+'); TODO
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      if (IS_BEG() || (IS_SPCARG(c) && arg_ambiguous()))
      {
        lexer.lex_state = EXPR_BEG;
        pushback(c);
        if (c != '' && ISDIGIT(c))
        {
          // c = '+';
          // return start_num(c); // was: goto start_num;
          return start_num(c); // was: goto start_num;
        }
        return tUPLUS;
      }
      lexer.lex_state = EXPR_BEG;
      pushback(c);
      warn_balanced("+", "unary operator", c);
      return $('+');
    }
    
    case '-':
    {
      c = nextc();
      if (IS_AFTER_OPERATOR())
      {
        lexer.lex_state = EXPR_ARG;
        if (c == '@')
        {
          return tUMINUS;
        }
        pushback(c);
        return $('-');
      }
      if (c == '=')
      {
        // set_yylval_id('-'); TODO
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      if (c == '>')
      {
        lexer.lex_state = EXPR_ENDFN;
        return tLAMBDA;
      }
      if (IS_BEG() || (IS_SPCARG(c) && arg_ambiguous()))
      {
        lexer.lex_state = EXPR_BEG;
        pushback(c);
        if (c != '' && ISDIGIT(c))
        {
          return tUMINUS_NUM;
        }
        return tUMINUS;
      }
      lexer.lex_state = EXPR_BEG;
      pushback(c);
      warn_balanced("-", "unary operator", c);
      return $('-');
    }
    
    case '.':
    {
      lexer.lex_state = EXPR_BEG;
      if ((c = nextc()) == '.')
      {
        if ((c = nextc()) == '.')
        {
          return tDOT3;
        }
        pushback(c);
        return tDOT2;
      }
      pushback(c);
      if (c != '' && ISDIGIT(c))
      {
        yyerror("no .<digit> floating literal anymore; put 0 before dot");
      }
      lexer.lex_state = EXPR_DOT;
      return $('.');
    }
    
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
    {
      pushback(c);
      return start_num(c);
    }
    
    case ')':
    case ']':
      lexer.paren_nest--;
    case '}':
    {
      var t = $(c);
      lexer.COND_LEXPOP();
      lexer.CMDARG_LEXPOP();
      if (c == ')')
        lexer.lex_state = EXPR_ENDFN;
      else
        lexer.lex_state = EXPR_ENDARG;
      if (c == '}')
      {
        if (!lexer.brace_nest--)
          t = tSTRING_DEND;
      }
      return t;
    }
    
    case ':':
    {
      c = nextc();
      if (c == ':')
      {
        if (IS_BEG() || IS_lex_state(EXPR_CLASS) || IS_SPCARG(''))
        {
          lexer.lex_state = EXPR_BEG;
          return tCOLON3;
        }
        lexer.lex_state = EXPR_DOT;
        return tCOLON2;
      }
      if (IS_END() || ISSPACE(c))
      {
        pushback(c);
        warn_balanced(":", "symbol literal", c);
        lexer.lex_state = EXPR_BEG;
        return $(':');
      }
      switch (c)
      {
        case '\'':
          lexer.lex_strterm = NEW_STRTERM(str_ssym, c, '');
          break;
        case '"':
          lexer.lex_strterm = NEW_STRTERM(str_dsym, c, '');
          break;
        default:
          pushback(c);
          break;
      }
      lexer.lex_state = EXPR_FNAME;
      return tSYMBEG;
    }
    
    case '/':
    {
      if (IS_lex_state(EXPR_BEG_ANY))
      {
        lexer.lex_strterm = NEW_STRTERM(str_regexp, '/', '');
        return tREGEXP_BEG;
      }
      if ((c = nextc()) == '=')
      {
        // set_yylval_id('/'); TODO
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      pushback(c);
      if (IS_SPCARG(c))
      {
        arg_ambiguous();
        lexer.lex_strterm = NEW_STRTERM(str_regexp, '/', '');
        return tREGEXP_BEG;
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      warn_balanced("/", "regexp literal", c);
      return $('/');
    }
    
    case '^':
    {
      if ((c = nextc()) == '=')
      {
        // set_yylval_id('^'); TODO
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      pushback(c);
      return $('^');
    }
    
    case ';':
    {
      lexer.lex_state = EXPR_BEG;
      lexer.command_start = true;
      return $(';');
    }
    
    case ',':
    {
      lexer.lex_state = EXPR_BEG;
      return $(',');
    }
    
    case '~':
    {
      if (IS_AFTER_OPERATOR())
      {
        if ((c = nextc()) != '@')
        {
          pushback(c);
        }
        lexer.lex_state = EXPR_ARG;
      }
      else
      {
        lexer.lex_state = EXPR_BEG;
      }
      return $('~');
    }
    
    case '(':
    {
      var t = $(c);
      if (IS_BEG())
      {
        t = tLPAREN;
      }
      else if (IS_SPCARG(''))
      {
        t = tLPAREN_ARG;
      }
      lexer.paren_nest++;
      lexer.COND_PUSH(0);
      lexer.CMDARG_PUSH(0);
      lexer.lex_state = EXPR_BEG;
      return t;
    }
    
    case '[':
    {
      var t = $(c);
      lexer.paren_nest++;
      if (IS_AFTER_OPERATOR())
      {
        lexer.lex_state = EXPR_ARG;
        if ((c = nextc()) == ']')
        {
          if ((c = nextc()) == '=')
          {
            return tASET;
          }
          pushback(c);
          return tAREF;
        }
        pushback(c);
        return $('[');
      }
      else if (IS_BEG())
      {
        t = tLBRACK;
      }
      else if (IS_ARG() && lexer.space_seen)
      {
        t = tLBRACK;
      }
      lexer.lex_state = EXPR_BEG;
      lexer.COND_PUSH(0);
      lexer.CMDARG_PUSH(0);
      return t;
    }
    
    case '{':
    {
      var t = $(c);
      ++lexer.brace_nest;
      if (lexer.lpar_beg && lexer.lpar_beg == lexer.paren_nest)
      {
        lexer.lex_state = EXPR_BEG;
        lexer.lpar_beg = 0;
        --lexer.paren_nest;
        lexer.COND_PUSH(0);
        lexer.CMDARG_PUSH(0);
        return tLAMBEG;
      }
      if (IS_ARG() || IS_lex_state(EXPR_END | EXPR_ENDFN))
        t = $('{');                /* block (primary) */
      else if (IS_lex_state(EXPR_ENDARG))
        t = tLBRACE_ARG;        /* block (expr) */
      else
        t = tLBRACE;            /* hash */
      lexer.COND_PUSH(0);
      lexer.CMDARG_PUSH(0);
      lexer.lex_state = EXPR_BEG;
      if (t != tLBRACE)
        lexer.command_start = true;
      return t;
    }
    
    case '\\':
    {
      c = nextc();
      if (c == '\n')
      {
        lexer.space_seen = true;
        // skip \\n
        continue retry; // was: goto retry;
      }
      pushback(c);
      return $('\\');
    }
    
    case '%':
    {
      var term = '';
      var paren = '';
      
      quotation:
      for (;;) // a label
      {
        // this label enulating loop expects the lex_state
        // to be constant within its boudaries
        if (IS_lex_state(EXPR_BEG_ANY))
        {
          c = nextc();
          // was: quotation:
          if (c == '' || !ISALNUM(c))
          {
            term = c;
            c = 'Q';
          }
          else
          {
            term = nextc();
            if (ISALNUM(term) || !ISASCII(term))
            {
              yyerror("unknown type of %string");
              return 0;
            }
          }
          if (c == '' || term == '')
          {
            compile_error("unterminated quoted string meets end of file");
            return 0;
          }
          paren = term;
          if (term == '(')
            term = ')';
          else if (term == '[')
            term = ']';
          else if (term == '{')
            term = '}';
          else if (term == '<')
            term = '>';
          else
            paren = '';

          switch (c)
          {
            case 'Q':
              lexer.lex_strterm = NEW_STRTERM(str_dquote, term, paren);
              return tSTRING_BEG;

            case 'q':
              lexer.lex_strterm = NEW_STRTERM(str_squote, term, paren);
              return tSTRING_BEG;

            case 'W':
              lexer.lex_strterm = NEW_STRTERM(str_dword, term, paren);
              do
              {
                c = nextc();
              }
              while (ISSPACE(c));
              pushback(c);
              return tWORDS_BEG;

            case 'w':
              lexer.lex_strterm = NEW_STRTERM(str_sword, term, paren);
              do
              {
                c = nextc();
              }
              while (ISSPACE(c));
              pushback(c);
              return tQWORDS_BEG;

            case 'I':
              lexer.lex_strterm = NEW_STRTERM(str_dword, term, paren);
              do
              {
                c = nextc();
              }
              while (ISSPACE(c));
              pushback(c);
              return tSYMBOLS_BEG;

            case 'i':
              lexer.lex_strterm = NEW_STRTERM(str_sword, term, paren);
              do
              {
                c = nextc();
              }
              while (ISSPACE(c));
              pushback(c);
              return tQSYMBOLS_BEG;

            case 'x':
              lexer.lex_strterm = NEW_STRTERM(str_xquote, term, paren);
              return tXSTRING_BEG;

            case 'r':
              lexer.lex_strterm = NEW_STRTERM(str_regexp, term, paren);
              return tREGEXP_BEG;

            case 's':
              lexer.lex_strterm = NEW_STRTERM(str_ssym, term, paren);
              lexer.lex_state = EXPR_FNAME;
              return tSYMBEG;

            default:
              yyerror("unknown type of %string");
              return 0;
          }
        }
        if ((c = nextc()) == '=')
        {
          // set_yylval_id('%'); TODO
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        if (IS_SPCARG(c))
        {
          pushback(c); // added to jump to top
          continue quotation; // was: goto quotation;
        }
        break; // the for (;;) label-loop
      } // for (;;) quotation
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      pushback(c);
      warn_balanced("%%", "string literal", c);
      return $('%');
    }
    
    case '$':
    {
      lexer.lex_state = EXPR_END;
      newtok();
      c = nextc();
      switch (c)
      {
        case '_':              /* $_: last read line string */
          c = nextc();
          if (parser_is_identchar(c))
          {
            tokadd('$');
            tokadd('_');
            break;
          }
          pushback(c);
          c = '_';
          /* fall through */
        case '~':              /* $~: match-data */
        case '*':              /* $*: argv */
        case '$':              /* $$: pid */
        case '?':              /* $?: last status */
        case '!':              /* $!: error string */
        case '@':              /* $@: error position */
        case '/':              /* $/: input record separator */
        case '\\':             /* $\: output record separator */
        case ';':              /* $;: field separator */
        case ',':              /* $,: output field separator */
        case '.':              /* $.: last read line number */
        case '=':              /* $=: ignorecase */
        case ':':              /* $:: load path */
        case '<':              /* $<: reading filename */
        case '>':              /* $>: default output handle */
        case '\"':             /* $": already loaded files */
          tokadd('$');
          tokadd(c);
          tokfix();
          // set_yylval_name(rb_intern(tok())); TODO
          return tGVAR;

        case '-':
          tokadd('$');
          tokadd(c);
          c = nextc();
          if (parser_is_identchar(c))
          {
            if (tokadd(c) == '')
              return 0;
          }
          else
          {
            pushback(c);
          }
        // was: gvar:
          tokfix();
          // set_yylval_name(rb_intern(tok())); TODO
          return tGVAR;

        case '&':              /* $&: last match */
        case '`':              /* $`: string before last match */
        case '\'':             /* $': string after last match */
        case '+':              /* $+: string matches last paren. */
          if (IS_lex_state_for(lexer.last_state, EXPR_FNAME))
          {
            tokadd('$');
            tokadd(c);
            // was: goto gvar;
            tokfix();
            // set_yylval_name(rb_intern(tok())); TODO
            return tGVAR;
          }
          // set_yylval_node(NEW_BACK_REF(c)); TODO
          return tBACK_REF;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          tokadd('$');
          do
          {
            tokadd(c);
            c = nextc();
          }
          while (c != '' && ISDIGIT(c));
          pushback(c);
          if (IS_lex_state_for(lexer.last_state, EXPR_FNAME))
          {
            // was: goto gvar;
            tokfix();
            // set_yylval_name(rb_intern(tok())); TODO
            return tGVAR;
          }
          tokfix();
          // set_yylval_node(NEW_NTH_REF(atoi(tok() + 1))); TODO
          return tNTH_REF;

        default:
          if (!parser_is_identchar(c))
          {
            pushback(c);
            return $('$');
          }
        case '0':
          tokadd('$');
      }
      break;
    }
    
    case '@':
    {
      c = nextc();
      newtok();
      tokadd('@');
      if (c == '@')
      {
        tokadd('@');
        c = nextc();
      }
      if (c != '' && ISDIGIT(c))
      {
        if (toklen() == 1)
        {
          compile_error("`@"+c+"' is not allowed as an instance variable name");
        }
        else
        {
          compile_error("`@@"+c+"' is not allowed as a class variable name");
        }
        return 0;
      }
      if (!parser_is_identchar(c))
      {
        pushback(c);
        return $('@');
      }
      break;
    }
    
    case '_':
    {
      if (was_bol() && whole_match_p("__END__", false))
      {
        lexer.ruby__end__seen = true;
        lexer.eofp = true;
        return 0; // was: return -1;
      }
      newtok();
      break;
    }
    
    // add before here :)
    
    default:
    {
      if (!parser_is_identchar(c))
      {
        compile_error("Invalid char `"+c+"' in expression");
        continue retry; // was: goto retry;
      }

      newtok();
      break the_giant_switch;
    }
  }
  
  do
  {
    if (tokadd(c) == '')
      return 0;
    c = nextc();
  }
  while (parser_is_identchar(c));
  switch (tok()[0])
  {
    case '@':
    case '$':
      pushback(c);
      break;
    default:
      if ((c == '!' || c == '?') && !peek('='))
      {
        tokadd(c);
      }
      else
      {
        pushback(c);
      }
  }
  tokfix();
  
  {
    var result = 0;

    lexer.last_state = lexer.lex_state;
    switch (tok()[0])
    {
      case '$':
        lexer.lex_state = EXPR_END;
        result = tGVAR;
        break;
      case '@':
        lexer.lex_state = EXPR_END;
        if (tok()[1] == '@')
          result = tCVAR;
        else
          result = tIVAR;
        break;

      default:
        if (toklast() == '!' || toklast() == '?')
        {
          result = tFID;
        }
        else
        {
          if (IS_lex_state(EXPR_FNAME))
          {
            if ((c = nextc()) == '=' && !peek('~') && !peek('>') &&
                (!peek('=') || (peek_n('>', 1))))
            {
              result = tIDENTIFIER;
              tokadd(c);
              tokfix();
            }
            else
            {
              pushback(c);
            }
          }
          if (result == 0 && ISUPPER(tok()[0]))
          {
            result = tCONSTANT;
          }
          else
          {
            result = tIDENTIFIER;
          }
        }

        if (IS_LABEL_POSSIBLE())
        {
          if (IS_LABEL_SUFFIX(0))
          {
            lexer.lex_state = EXPR_BEG;
            nextc();
            // set_yylval_name(TOK_INTERN(!ENC_SINGLE(mb))); TODO
            return tLABEL;
          }
        }
        if (!IS_lex_state(EXPR_DOT))
        {
          // const struct kwtable *kw;

          // See if it is a reserved word.
          var kw = rb_reserved_word[tok()];
          if (kw)
          {
            var state = lexer.lex_state;
            lexer.lex_state = kw.state;
            if (state == EXPR_FNAME)
            {
              // set_yylval_name(rb_intern(kw->name)); TODO
              return kw.id0;
            }
            if (lexer.lex_state == EXPR_BEG)
            {
              lexer.command_start = true;
            }
            if (kw.id0 == keyword_do)
            {
              if (lexer.lpar_beg && lexer.lpar_beg == lexer.paren_nest)
              {
                lexer.lpar_beg = 0;
                --lexer.paren_nest;
                return keyword_do_LAMBDA;
              }
              if (lexer.COND_P())
                return keyword_do_cond;
              if (lexer.CMDARG_P() && state != EXPR_CMDARG)
                return keyword_do_block;
              if (state & (EXPR_BEG | EXPR_ENDARG))
                return keyword_do_block;
              return keyword_do;
            }
            if (state & (EXPR_BEG | EXPR_VALUE))
              return kw.id0;
            else
            {
              if (kw.id0 != kw.id1)
                lexer.lex_state = EXPR_BEG;
              return kw.id1;
            }
          }
        }

        if (IS_lex_state(EXPR_BEG_ANY | EXPR_ARG_ANY | EXPR_DOT))
        {
          if (lexer.cmd_state)
          {
            lexer.lex_state = EXPR_CMDARG;
          }
          else
          {
            lexer.lex_state = EXPR_ARG;
          }
        }
        else if (lexer.lex_state == EXPR_FNAME)
        {
          lexer.lex_state = EXPR_ENDFN;
        }
        else
        {
          lexer.lex_state = EXPR_END;
        }
    }
    {
      // just take a plain string for now,
      // do not convert to a symbol, leave it to JS engine
      var ident = tok();

      // set_yylval_name(ident); TODO
      if (!IS_lex_state_for(lexer.last_state, EXPR_DOT | EXPR_FNAME) &&
          is_local_id(ident) && lvar_defined(ident))
      {
        lexer.lex_state = EXPR_END;
      }
    }
    return result;
  }
  
  // return c == '' ? 0 : 9999 // EOF or $undefined
  
  } // retry for loop
}

function heredoc_identifier ()
{
  var term = '', func = 0;
  
  var c = nextc()
  if (c == '-')
  {
    c = nextc();
    func = STR_FUNC_INDENT;
  }
  defaultt:
  {
    quoted:
    {
      switch (c)
      {
        case '\'':
          func |= str_squote;
          break; // was: goto quoted;
        case '"':
          func |= str_dquote;
          break; // was: goto quoted;
        case '`':
          func |= str_xquote;
          break; // was: goto quoted;
        default:
          break quoted
      }
      // was: quoted:
      newtok();
      // tokadd($$(func)); add it to the `strterm` property
      term = c;
      while ((c = nextc()) != '' && c != term)
      {
        if (tokadd(c) == '')
          return 0;
      }
      if (c == '')
      {
        compile_error("unterminated here document identifier");
        return 0;
      }
      break defaultt;
    } // quoted:

    // was: default:
    if (!parser_is_identchar(c))
    {
      pushback(c);
      if (func & STR_FUNC_INDENT)
      {
        pushback('-');
      }
      return 0;
    }
    // TODO: create token with $text.substring(start, end)
    newtok();
    term = '"';
    func |= str_dquote;
    do
    {
      if (tokadd(c) == '')
        return 0;
    }
    while ((c = nextc()) != '' && parser_is_identchar(c));
    pushback(c);
  } // defaultt:

  tokfix();
  lexer.lex_strterm = NEW_HEREDOCTERM(func, tok());
  lex_goto_eol();
  return term == '`' ? tXSTRING_BEG : tSTRING_BEG;
}

function here_document_error (eos)
{
  // was: error:
    compile_error("can't find string \""+eos+"\" anywhere before EOF");
    return here_document_restore(eos);
}
function here_document_restore (eos)
{
  // was: restore:
    heredoc_restore(lexer.lex_strterm);
    lexer.lex_strterm = null;
    return 0;
}
function here_document (here)
{
  // we're at the heredoc content start
  var func = here.nd_func,
      eos = here.term,
      indent = !!(func & STR_FUNC_INDENT);
  
  var str = ''; // accumulate string content here
  
  var c = nextc();
  if (c == '')
  {
    here_document_error(eos);
    return 0;
  }
  
  if (was_bol() && whole_match_p(eos, indent))
  {
    heredoc_restore(lexer.lex_strterm);
    return tSTRING_END;
  }
  
  // do not look for `#{}` stuff here
  if (!(func & STR_FUNC_EXPAND))
  {
    // mark a start of the string token
    do
    {
      str += lex_lastline;
      
      // EOF reached in the middle of the heredoc
      lex_goto_eol();
      if (nextc() === '')
      {
        here_document_error(eos); // was: goto error;
        return 0;
      }
    }
    while (!whole_match_p(eos, indent));
  }
  // try to find all the `#{}` stuff here
  else
  {
    /*      int mb = ENC_CODERANGE_7BIT, *mbp = &mb; */
    newtok();
    if (c == '#')
    {
      switch (c = nextc())
      {
        case '$':
        case '@':
          pushback(c);
          return tSTRING_DVAR;
        case '{':
          lexer.command_start = true;
          return tSTRING_DBEG;
      }
      tokadd('#');
    }
    do
    {
      pushback(c);
      if ((c = tokadd_string(func, '\n', '', null)) == '')
      {
        if (lexer.eofp)
        {
          here_document_error(eos); // was: goto error;
          return 0;
        }
        here_document_restore(); // was: goto restore;
        return 0;
      }
      if (c != '\n')
      {
        // set_yylval_str(STR_NEW3(tok(), toklen(), enc, func)); TODO
        return tSTRING_CONTENT;
      }
      tokadd(nextc());
      
      if ((c = nextc()) == '')
      {
        here_document_error(eos); // was: goto error;
        return 0;
      }
    }
    while (!whole_match_p(eos, indent));
    // str = STR_NEW3(tok(), toklen(), enc, func); TODO
  }
  heredoc_restore(lexer.lex_strterm);
  lexer.lex_strterm = NEW_STRTERM(-1, '', '');
  // set_yylval_str(str); TODO:
  return tSTRING_CONTENT;
}

function parse_string (quote)
{
  var func = quote.nd_func,
      term = quote.term,
      paren = quote.paren;
  
  var space = false;

  if (func == -1)
    return tSTRING_END;
  var c = nextc();
  if ((func & STR_FUNC_QWORDS) && ISSPACE(c))
  {
    do
    {
      c = nextc();
    }
    while (ISSPACE(c));
    space = true;
  }
  // quote.nd_nest is increased in tokadd_string()
  // once for every `paren` char met
  if (c == term && !quote.nd_nest)
  {
    if (func & STR_FUNC_QWORDS)
    {
      quote.nd_func = -1;
      return $(' ');
    }
    if (!(func & STR_FUNC_REGEXP))
      return tSTRING_END;
    // set_yylval_num(regx_options()); TODO
    return tREGEXP_END;
  }
  if (space)
  {
    pushback(c);
    return $(' ');
  }
  newtok();
  if ((func & STR_FUNC_EXPAND) && c == '#')
  {
    switch (c = nextc())
    {
      case '$':
      case '@':
        pushback(c);
        return tSTRING_DVAR;
      case '{':
        lexer.command_start = true;
        return tSTRING_DBEG;
    }
    tokadd('#');
  }
  pushback(c);
  if (tokadd_string(func, term, paren, quote) == '')
  {
    lexer.ruby_sourceline = quote.nd_line;
    if (func & STR_FUNC_REGEXP)
    {
      if (lexer.eofp)
        compile_error("unterminated regexp meets end of file");
      return tREGEXP_END;
    }
    else
    {
      if (lexer.eofp)
        compile_error("unterminated string meets end of file");
      return tSTRING_END;
    }
  }

  tokfix();
  // set_yylval_str(STR_NEW3(tok(), toklen(), enc, func)); TODO

  return tSTRING_CONTENT;
}


function tokadd_string (func, term, paren, str_term)
{
  var c = '';
  while ((c = nextc()) != '')
  {
    if (paren && c == paren)
    {
      ++str_term.nd_nest;
    }
    else if (c == term)
    {
      if (!str_term || !str_term.nd_nest)
      {
        pushback(c);
        break;
      }
      --str_term.nd_nest;
    }
    else if ((func & STR_FUNC_EXPAND) && c == '#' && lex_p < lex_pend)
    {
      var c2 = lex_pv();
      if (c2 == '$' || c2 == '@' || c2 == '{')
      {
        pushback(c);
        break;
      }
    }
    else if (c == '\\')
    {
      c = nextc();
      switch (c)
      {
        case '\n':
          if (func & STR_FUNC_QWORDS)
            break;
          if (func & STR_FUNC_EXPAND)
            continue;
          tokadd('\\');
          break;

        case '\\':
          if (func & STR_FUNC_ESCAPE)
            tokadd(c);
          break;

        case 'u':
          if ((func & STR_FUNC_EXPAND) == 0)
          {
            tokadd('\\');
            break;
          }
          parser_tokadd_utf8(true, !!(func & STR_FUNC_SYMBOL), !!(func & STR_FUNC_REGEXP));
          continue;

        default:
          if (c == '')
            return '';
          if (!ISASCII(c))
          {
            if ((func & STR_FUNC_EXPAND) == 0)
              tokadd('\\');
            // was: goto non_ascii;
            if (tokadd(c) == '')
              return '';
            continue;
          }
          if (func & STR_FUNC_REGEXP)
          {
            if (c == term && !simple_re_meta(c))
            {
              tokadd(c);
              continue;
            }
            pushback(c);
            if ((c = tokadd_escape()) == '')
              return '';
            continue;
          }
          else if (func & STR_FUNC_EXPAND)
          {
            pushback(c);
            if (func & STR_FUNC_ESCAPE)
              tokadd('\\');
            c = read_escape(0);
          }
          else if ((func & STR_FUNC_QWORDS) && ISSPACE(c))
          {
            /* ignore backslashed spaces in %w */
          }
          else if (c != term && !(paren && c == paren))
          {
            tokadd('\\');
            pushback(c);
            continue;
          }
      }
    }
    else if ((func & STR_FUNC_QWORDS) && ISSPACE(c))
    {
      pushback(c);
      break;
    }
    tokadd(c);
  }
  return c;
}

function simple_re_meta (c)
{
  // TODO: optimize!
  switch (c)
  {
    case '$':
    case '*':
    case '+':
    case '.':
    case '?':
    case '^':
    case '|':
    case ')':
      return true;
    default:
      return false;
  }
}


function tokadd_escape ()
{
  // TODO
  return 'TODO';
}

// checks if the current line matches `/^\s*#{eos}\n?$/`;
function whole_match_p (eos, indent)
{
  if (!indent)
  {
    return lex_lastline == eos + '\n' || lex_lastline == eos;
  }
  
  // `eos` is an identifier and doesn't need to be escaped
  var rex = new RegExp('^[ \\t]*' + eos + '$', 'm'); // TODO: cache
  return rex.test(lex_lastline);
}

function heredoc_restore (here)
{
  // restores the line from where the heredoc occured to begin
  lex_lastline = here.nd_orig;
  lex_pbeg = 0;
  lex_pend = lex_lastline.length;
  // restores the position in the line, right after heredoc token
  lex_p = here.nd_nth;
  // have no ideas yet :)
  lexer.heredoc_end = lexer.ruby_sourceline;
  lexer.ruby_sourceline = here.nd_line;
}

var ESCAPE_CONTROL = 1,
    ESCAPE_META = 2;

function read_escape_eof ()
{
  yyerror("Invalid escape character syntax");
  return '\0';
}
function read_escape (flags)
{
  var c = nextc();
  switch (c)
  {
    case '\\':                 /* Backslash */
      return c;

    case 'n':                  /* newline */
      return '\n';

    case 't':                  /* horizontal tab */
      return '\t';

    case 'r':                  /* carriage-return */
      return '\r';

    case 'f':                  /* form-feed */
      return '\f';

    case 'v':                  /* vertical tab */
      return '\v'; // \13

    case 'a':                  /* alarm(bell) */
      return '\a'; // \007

    case 'e':                  /* escape */
      return '\x1b'; // 033

    case '0':
    case '1':
    case '2':
    case '3':                  /* octal constant */
    case '4':
    case '5':
    case '6':
    case '7':
      pushback(c);
      // was: c = scan_oct(lex_p, 3, &numlen);
      var oct = match_grex(/[0-7]{1,3}|/g)[0];
      c = $$(parseInt(oct, 8));
      lex_p += oct.length;
      return c;

    case 'x':                  /* hex constant */
      // was: c = tok_hex(&numlen);
      var hex = match_grex(/[0-9a-fA-F]{1,2}|/g)[0];
      if (!hex)
      {
        yyerror("invalid hex escape");
        return '';
      }
      lex_p += hex.length;
      c = $$(parseInt(hex, 16));
      return c;

    case 'b':                  /* backspace */
      return '\x08'; // \010

    case 's':                  /* space */
      return ' ';

    case 'M':
      if (flags & ESCAPE_META)
      {
        // was: goto eof;
        return read_escape_eof();
      }
      if ((c = nextc()) != '-')
      {
        pushback(c);
        // was: goto eof;
        return read_escape_eof();
      }
      if ((c = nextc()) == '\\')
      {
        if (peek('u'))
        {
          // was: goto eof;
          return read_escape_eof();
        }
        return $$($(read_escape(flags | ESCAPE_META)) | 0x80);
      }
      else if (c == '' || !ISASCII(c))
      {
        // was: goto eof;
        return read_escape_eof();
      }
      else
      {
        return $$(($(c) & 0xff) | 0x80);
      }

    case 'C':
      if ((c = nextc()) != '-')
      {
        pushback(c);
        // was: goto eof;
        return read_escape_eof();
      }
    case 'c':
      if (flags & ESCAPE_CONTROL)
      {
        // was: goto eof;
        return read_escape_eof();
      }
      if ((c = nextc()) == '\\')
      {
        if (peek('u'))
        {
          // was: goto eof;
          return read_escape_eof();
        }
        c = read_escape(flags | ESCAPE_CONTROL);
      }
      else if (c == '?')
        return '\x7f'; // 0177;
      else if (c == '' || !ISASCII(c))
      {
        // was: goto eof;
        return read_escape_eof();
      }
      return $$($(c) & 0x9f);

    // was: eof:
    case -1:
      return read_escape_eof();

    default:
      return c;
  }
}

/* return value is for \u3042 */
function parser_tokadd_utf8 (string_literal, symbol_literal, regexp_literal)
{
  /*
   * If string_literal is true, then we allow multiple codepoints
   * in \u{}, and add the codepoints to the current token.
   * Otherwise we're parsing a character literal and return a single
   * codepoint without adding it
   */

  if (regexp_literal)
  {
    tokadd('\\u');
  }
  
  var c = nextc();
  // handle \u{...} form
  if (c === '{')
  {
    if (regexp_literal)
    {
      tokadd('{'); // was: tokadd(*lex_p);
    }
    for (;;)
    {
      // match hex digits or empty string
      var hex = match_grex(/[0-9a-fA-F]{1,6}|/g)[0];
      if (hex == '')
      {
        yyerror("invalid Unicode escape");
        return '';
      }
      var codepoint = parseInt(hex, 16);
      var the_char = $$(codepoint);
      if (codepoint > 0x10ffff)
      {
        yyerror("invalid Unicode codepoint "+codepoint+" (too large)");
        return '';
      }
      
      lex_p += hex.length;
      if (regexp_literal)
      {
        tokadd(hex);
      }
      else if (string_literal)
      {
        tokadd(the_char);
      }
      
      c = nextc();
      if (!string_literal)
        break;
      if (c !== ' ' && c !== '\t')
        break;
    }

    if (c !== '}')
    {
      yyerror("unterminated Unicode escape");
      return '';
    }

    if (regexp_literal)
    {
      tokadd('}');
    }
    
    // return the last found codepoint/char
    return the_char;
  }
  // handle \uxxxx form
  else
  {
    // match 4 hex digits or empty string
    var hex = match_grex(/[0-9a-fA-F]{4}|/g)[0];
    if (hex === '')
    {
      yyerror("invalid Unicode escape");
      return '';
    }
    var codepoint = parseInt(hex, 16);
    var the_char = $$(codepoint);
    lex_p += 4;
    if (regexp_literal)
    {
      tokadd(hex);
    }
    else if (string_literal)
    {
      tokadd(the_char);
    }
    
    // return the only found codepoint/char
    return the_char;
  }
}

// here `c` matches [0-9],
// `c` is the first char of the future number,
// as of Ruby 2.0 we don't expect to be called from leading '-' match,
// the `c` has been pushed back by caller
function start_num (c)
{
  var is_float = false,
      seen_point = false,
      seen_e = false,
      nondigit = '';
  
  lexer.lex_state = EXPR_END;
  newtok();
  if (c == '0')
  {
    if (match_grex(/0[xX0-9bBdD_oO]|/g)[0])
      warning('0-leading digits to be supported soon');
  }
  
  // as far as we know the first char is a digit, there is no need
  // for any `\d[\d_]*` trickery to avoid error with leading `_` char.
  // that means:
  // 
  //   \d+(_\d+)*                 000_000_000…
  // 
  // optionally followed by:
  // 
  //   \.\d+(?:_\d+)*            .000_000_000…
  // 
  // optionally followed by:
  // 
  //   [eE][+\-]?\d+(_\d+)*      e000_000_000…
  // 
  // so we could parse: `10_0.0_0e+0_0` as `100.0`
  var drex = /\d+(?:_\d+)*(\.\d+(?:_\d+)*)?(?:[eE][+\-]?\d+(?:_\d+)*)?|/g;
  var m = match_grex(drex);
  var decimal = m[0];
  if (!drex)
  {
    yyerror("broken decimal number");
    return tINTEGER;
  }
  lex_p += decimal.length;
  var nondigit = match_grex(/\w+|/g)[0];
  if (nondigit)
  {
    yyerror("trailing `"+nondigit+"' in number");
    return tINTEGER;
  }

  if (m[1]) // matched (\.\d+(?:_\d+)*)
  {
    // set_yylval_literal(rb_cstr_to_inum(tok(), 10, FALSE)); TODO
    return tFLOAT;
  }
  else
  {
    // set_yylval_literal(rb_cstr_to_inum(tok(), 10, FALSE)); TODO
    return tINTEGER;
  }
}


// struct kwtable {const char *name; int id[2]; enum lex_state_e state;};

function is_local_id (ident)
{
  // TODO :)
  return false;
}
lexer.is_local_id = is_local_id;
function lvar_defined (ident)
{
  // TODO :)
  return false;
}

var rb_reserved_word =
{
'__ENCODING__': {id0: keyword__ENCODING__, id1: keyword__ENCODING__, state: EXPR_END},
'__LINE__': {id0: keyword__LINE__, id1: keyword__LINE__, state: EXPR_END},
'__FILE__': {id0: keyword__FILE__, id1: keyword__FILE__, state: EXPR_END},
'BEGIN': {id0: keyword_BEGIN, id1: keyword_BEGIN, state: EXPR_END},
'END': {id0: keyword_END, id1: keyword_END, state: EXPR_END},
'alias': {id0: keyword_alias, id1: keyword_alias, state: EXPR_FNAME},
'and': {id0: keyword_and, id1: keyword_and, state: EXPR_VALUE},
'begin': {id0: keyword_begin, id1: keyword_begin, state: EXPR_BEG},
'break': {id0: keyword_break, id1: keyword_break, state: EXPR_MID},
'case': {id0: keyword_case, id1: keyword_case, state: EXPR_VALUE},
'class': {id0: keyword_class, id1: keyword_class, state: EXPR_CLASS},
'def': {id0: keyword_def, id1: keyword_def, state: EXPR_FNAME},
'defined?': {id0: keyword_defined, id1: keyword_defined, state: EXPR_ARG},
'do': {id0: keyword_do, id1: keyword_do, state: EXPR_BEG},
'else': {id0: keyword_else, id1: keyword_else, state: EXPR_BEG},
'elsif': {id0: keyword_elsif, id1: keyword_elsif, state: EXPR_VALUE},
'end': {id0: keyword_end, id1: keyword_end, state: EXPR_END},
'ensure': {id0: keyword_ensure, id1: keyword_ensure, state: EXPR_BEG},
'false': {id0: keyword_false, id1: keyword_false, state: EXPR_END},
'for': {id0: keyword_for, id1: keyword_for, state: EXPR_VALUE},
'if': {id0: keyword_if, id1: modifier_if, state: EXPR_VALUE},
'in': {id0: keyword_in, id1: keyword_in, state: EXPR_VALUE},
'module': {id0: keyword_module, id1: keyword_module, state: EXPR_VALUE},
'next': {id0: keyword_next, id1: keyword_next, state: EXPR_MID},
'nil': {id0: keyword_nil, id1: keyword_nil, state: EXPR_END},
'not': {id0: keyword_not, id1: keyword_not, state: EXPR_ARG},
'or': {id0: keyword_or, id1: keyword_or, state: EXPR_VALUE},
'redo': {id0: keyword_redo, id1: keyword_redo, state: EXPR_END},
'rescue': {id0: keyword_rescue, id1: modifier_rescue, state: EXPR_MID},
'retry': {id0: keyword_retry, id1: keyword_retry, state: EXPR_END},
'return': {id0: keyword_return, id1: keyword_return, state: EXPR_MID},
'self': {id0: keyword_self, id1: keyword_self, state: EXPR_END},
'super': {id0: keyword_super, id1: keyword_super, state: EXPR_ARG},
'then': {id0: keyword_then, id1: keyword_then, state: EXPR_BEG},
'true': {id0: keyword_true, id1: keyword_true, state: EXPR_END},
'undef': {id0: keyword_undef, id1: keyword_undef, state: EXPR_FNAME},
'unless': {id0: keyword_unless, id1: modifier_unless, state: EXPR_VALUE},
'until': {id0: keyword_until, id1: modifier_until, state: EXPR_VALUE},
'when': {id0: keyword_when, id1: keyword_when, state: EXPR_VALUE},
'while': {id0: keyword_while, id1: modifier_while, state: EXPR_VALUE},
'yield': {id0: keyword_yield, id1: keyword_yield, state: EXPR_ARG}
};

lexer.cursorPosition = function ()
{
  return (
    lex_lastline.substring(0, lex_p) +
    '>>here<<' +
    lex_lastline.substring(lex_p)
  );
}

function debug ()
{
  puts('\n\n')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts.apply(null, arguments)
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(lexer.cursorPosition())
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts(':::::::::::::::::::::::::::::::::::::::::::')
  puts('\n\n')
}
lexer.debug = debug;

function print_error ()
{
  puts('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  puts.apply(null, arguments)
  puts(lexer.cursorPosition())
  puts('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
}
function warning (msg) { print_error('WARNING: ' + msg) }
function compile_error (msg) { print_error('COMPILE ERROR: ' + msg) }
function yyerror (msg) { print_error('YYERROR: ' + msg) }
this.yyerror = yyerror;

} // function Lexer

return Lexer;

})();