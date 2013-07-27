// expose the constants to outer world (e.g. parser)

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


// $text: plain old JS string with ruby source code,
function YYLexer ()
{
// the yylex() method and all public data sit here
var lexer = this;

var $scope = null;

var $lex_pbeg = 0, // $lex_pbeg never changes
    $lex_p = 0,
    $lex_pend = 0;

var $text_pos = 0;
var $text = '';

var $lex_nextline = '',
    $lex_lastline = '';


var $tokenbuf = '';

// our addition for source maps
// packed as: (line << 10) + (col & 0x3ff)
//  {line 20 bits}{column 10 bits} = {llllllllllllllllllll}{cccccccccc}
var $tok_beg = 0; // line and column of first token char
//   tok_end = 0; // line and column right after the last token char 

// Anything changing must be set in `reset`
function reset ()
{
  $lex_pbeg = 0;
  $lex_p = 0;
  $lex_pend = 0;

  $text = '';
  $text_pos = 0;

  $lex_nextline = '';
  $lex_lastline = '';

  $tokenbuf = '';
  $tok_beg = 0;
  
  
  $scope = null;
  
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
  // defined? … has its own roles of lexing
  lexer.in_defined = false;
  // have we seen `__END__` already in lexer?
  lexer.ruby__end__seen = false;
  // parser needs access to the line number,
  // AFAICT, parser never changes it, only sets `nd_line` on nodes
  lexer.ruby_sourceline = 0;
  // file name for meningfull error reporting
  lexer.filename = '';
  // parser doesn't touch it, but what is it?
  lexer.heredoc_end = 0;
  lexer.line_count = 0;
  // errors count
  lexer.nerr = 0;
  // TODO: check out list of stateful variables with the original

  // the token value to be stored in the values stack
  lexer.yylval = null;

  // the token location to be stored in the locations stack
  lexer.yylloc = 0;
}

// call once on lexer creation
reset();

// public:
// pretent brand new lexer
lexer.reset = reset;
// give a chance to set `$text` afterwards
lexer.setText = function (v)
{
  $text = v ? ''+v : '';
  $text_pos = 0;
}
// connection to the outer space
lexer.setScope = function (v) { $scope = v; }


// the shortcut for checking `lexer.lex_state` over and over again
function IS_lex_state (ls)
{
  return lexer.lex_state & ls;
}
function IS_lex_state_for (state, ls)
{
  return state & ls;
}

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
  return (IS_lex_state(EXPR_BEG | EXPR_ENDFN) && !lexer.cmd_state) || IS_ARG();
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
  warn("`"+op+"' after local variable is interpreted as binary operator");
  warn("even though it seems like "+syn);
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
  return ('A' <= c && c <= 'Z') || c.toLowerCase() != c;
}
function ISALPHA (c)
{
  return /^[a-zA-Z]/.test(c);
}
function ISSPACE (c)
{
  return (
    // the most common checked first
    c === ' '  || c === '\n' || c === '\t' ||
    c === '\f' || c === '\v'
  )
}
function ISASCII (c)
{
  return $(c) < 128;
}
function ISDIGIT (c)
{
  return /^\d$/.test(c);
}
function ISXDIGIT (c)
{
  return /^[0-9a-fA-F]/.test(c);
}
function ISALNUM (c)
{
  return /^\w$/.test(c);
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

lexer.check_kwarg_name = function check_kwarg_name (name_t)
{
  if (/^[A-Z]/.test(name_t))
  {
    this.compile_error('TODO: :argument_const');
  }
}


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


// $lex_lastline reader for error reporting
lexer.get_lex_lastline = function () { return $lex_lastline; }

function nextc ()
{
  if ($lex_p == $lex_pend)
  {
    var v = $lex_nextline;
    $lex_nextline = '';
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

    if (lexer.heredoc_end > 0)
    {
      lexer.ruby_sourceline = lexer.heredoc_end;
      lexer.heredoc_end = 0;
    }
    lexer.ruby_sourceline++;
#if DEBUG
    if (lexer.print_line_numbers)
      lexer.print(lexer.ruby_sourceline + '\n')
#endif // DEBUG
    lexer.line_count++;
    $lex_pbeg = $lex_p = 0;
    $lex_pend = v.length;
    $lex_lastline = v;
  }
  
  return $lex_lastline[$lex_p++];
}
// jump right to the end of current buffered line,
// here: "abc\n|" or here "abc|"
function lex_goto_eol ()
{
  $lex_p = $lex_pend;
}
function lex_eol_p ()
{
  return $lex_p >= $lex_pend;
}

// just an emulation of $lex_p[i] from C
function nthchar (i)
{
  return $lex_lastline[$lex_p+i];
}
// just an emulation of *lex_p from C
function lex_pv ()
{
  return $lex_lastline[$lex_p];
}
// just an emulation of *p from C
function p_pv (p)
{
  return $lex_lastline[p];
}
// emulation of `strncmp(lex_p, "begin", 5)`,
// but you better use a precompiled regexp if `str` is a constant
function strncmp_lex_p (str)
{
  return $test.substring($lex_p, $lex_p + str.length) == str;
}

// forecast, if the nextc() will return character `c`
function peek (c)
{
  return $lex_p < $lex_pend && c === $lex_lastline[$lex_p];
}

// forecast, if the nextc() will return character `c`
// after n calls
function peek_n (c, n)
{
  var pos = $lex_p + n;
  return pos < $lex_pend && c === $lex_lastline[pos];
}

// expects rex in this form: `/blablabla|/g`
// that means `blablabla` or empty string (to prevent deep search)
function match_grex (rex)
{
#if DEBUG
  // check if the rex is in proper form
  if (!rex.global)
  {
    lexer.yyerror('match_grex() allows only global regexps: `…|/g`');
    throw 'DEBUG';
  }
  if (rex.source.substr(-1) != '|')
  {
    lexer.yyerror('match_grex() need trailing empty string match: `…|/g`');
    throw 'DEBUG';
  }
#endif
  rex.lastIndex = $lex_p;
  // there is always a match or an empty string in [0]
  return rex.exec($lex_lastline);
}
// the same as `match_grex()` but does'n return the match,
// treats the empty match as a `false`
function test_grex (rex)
{
#if DEBUG
  // check if the rex is in proper form
  if (!rex.global)
  {
    lexer.yyerror('test_grex() allows only global regexps: `…|/g`');
    throw 'DEBUG';
  }
  if (rex.source.substr(-1) != '|')
  {
    lexer.yyerror('test_grex() need trailing empty string match: `…|/g`');
    throw 'DEBUG';
  }
#endif
  rex.lastIndex = $lex_p;
  // there is always a match for an empty string
  rex.test($lex_lastline);
  // and on the actual match there coud be a change in `lastIndex`
  return rex.lastIndex != $lex_p;
}
// step back for one character and check
// if the current character is equal to `c`
function pushback (c)
{
  if (c == '')
  {
#if DEBUG
    if ($lex_p != $lex_pend)
      throw 'lexer error: pushing back wrong EOF char';
#endif
    return;
  }
  
  $lex_p--;
#if DEBUG
  if ($lex_lastline[$lex_p] != c)
    throw 'lexer error: pushing back wrong "'+c+'" char';
#endif
}

// was begin af a line (`^` in terms of regexps) before last `nextc()`,
// that true if we're here "a|bc" of here "abc\na|bc"
function was_bol ()
{
  return $lex_p === /*$lex_pbeg +*/ 1; // $lex_pbeg never changes
}


// token related stuff


function get_location ()
{
  // TODO: use floats
  // remember to update `YYLexer.unpack_location`
  // return (lexer.ruby_sourceline << 10) + ($lex_p & 0x3ff);
  return lexer.ruby_sourceline * 1000 + ($lex_p <= 999 ? $lex_p : 999);
}
function newtok ()
{
  $tokenbuf = '';
}
function tokadd (c)
{
  $tokenbuf += c;
  return c;
}
function tokcopy (n)
{
  // TODO: use $lex_lastline
  $tokenbuf += $text.substring($text_pos - n, $text_pos);
}

function tokfix ()
{
  /* was: tokenbuf[tokidx]='\0'*/
}
function tok () { return $tokenbuf; }
function toklen () { return $tokenbuf.length; }
function toklast ()
{
  return $tokenbuf.substr(-1)
  // was: tokidx>0?tokenbuf[tokidx-1]:0)
}

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
    type: 'strterm',
    func: func,
    lex_lastline: '', // stub
    lex_p: 0, // stub
    ruby_sourceline: lexer.ruby_sourceline,
    nested: 0, // for tokadd_string() and parse_string()
    term: term,
    paren: paren
  };
}
// our addition
function NEW_HEREDOCTERM (func, term)
{
  return {
    type: 'heredoc',
    func: func,
    lex_lastline: $lex_lastline,
    lex_p: $lex_p,
    ruby_sourceline: lexer.ruby_sourceline,
    nested: 0,
    term: term,
    paren: ''
  };
}

// TODO: get rid of such a piece of junk :)
function arg_ambiguous ()
{
  warn("ambiguous first argument; put parentheses or even spaces");
  return true;
}






this.yylex = function yylex ()
{
  lexer.yylval = null;
  
  var c = '';
  lexer.space_seen = false;
  
  if (lexer.lex_strterm)
  {
    // right after the quote or << token
    lexer.yylloc = get_location();

    var token = 0;
    if (lexer.lex_strterm.type == 'heredoc')
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
  lexer.yylloc = get_location();
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
    case '\r': // TODO: scream on `\r` everywhere, or clear it out
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
            $lex_nextline = $lex_lastline;
            
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
      var token = 0;
      if ((c = nextc()) == '*')
      {
        if ((c = nextc()) == '=')
        {
          lexer.yylval = "**"; // tPOW;
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        if (IS_SPCARG(c))
        {
          warn("`**' interpreted as argument prefix");
          token = tDSTAR;
        }
        else if (IS_BEG())
        {
          token = tDSTAR;
        }
        else
        {
          warn_balanced("**", "argument prefix", c);
          lexer.yylval = "**";
          token = tPOW;
        }
      }
      else
      {
        if (c == '=')
        {
          lexer.yylval = "*"; // $('*');
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        if (IS_SPCARG(c))
        {
          warn("`*' interpreted as argument prefix");
          token = tSTAR;
        }
        else if (IS_BEG())
        {
          token = tSTAR;
        }
        else
        {
          warn_balanced("*", "argument prefix", c);
          lexer.yylval = "*";
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
        lexer.yylval = "!=";
        return tNEQ;
      }
      if (c == '~')
      {
        lexer.yylval = "!~";
        return tNMATCH;
      }
      pushback(c);
      return $('!');
    }
    
    case '=':
    {
      if (was_bol())
      {
        /* skip embedded rd document */
        if (match_grex(/begin[\n \t]|/g)[0])
        {
          for (;;)
          {
            lex_goto_eol();
            c = nextc();
            if (c == '')
            {
              compile_error("embedded document meets end of file");
              return 0;
            }
            if (c != '=')
              continue;
            if (match_grex(/end(?:[\n \t]|$)|/gm)[0])
            {
              break;
            }
          }
          lex_goto_eol();
          continue retry; // was: goto retry;
        }
      }

      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      if ((c = nextc()) == '=')
      {
        if ((c = nextc()) == '=')
        {
          lexer.yylval = "===";
          return tEQQ;
        }
        pushback(c);
        lexer.yylval = "==";
        return tEQ;
      }
      if (c == '~')
      {
        lexer.yylval = "=~";
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
          lexer.yylval = "<=>";
          return tCMP;
        }
        pushback(c);
        lexer.yylval = "<=";
        return tLEQ;
      }
      if (c == '<')
      {
        if ((c = nextc()) == '=')
        {
          lexer.yylval = "<<"; // tLSHFT;
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        warn_balanced("<<", "here document", c);
        lexer.yylval = "<<";
        return tLSHFT;
      }
      pushback(c);
      lexer.yylval = "<";
      return $('<');
    }
    
    case '>':
    {
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      if ((c = nextc()) == '=')
      {
        lexer.yylval = ">=";
        return tGEQ;
      }
      if (c == '>')
      {
        if ((c = nextc()) == '=')
        {
          lexer.yylval = ">>"; // tRSHFT;
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        lexer.yylval = ">>";
        return tRSHFT;
      }
      pushback(c);
      lexer.yylval = ">";
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
            warn("invalid character syntax; use ?\\" + c2);
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
      else if (is_identchar(c) && $lex_p < $lex_pend && is_identchar(lex_pv()))
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
      lexer.yylval = tok(); // plain string
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
          lexer.yylval = "&&"; // tANDOP;
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        return tANDOP;
      }
      else if (c == '=')
      {
        lexer.yylval = "&"; // $('&');
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      pushback(c);
      var t = $(c);
      if (IS_SPCARG(c))
      {
        warn("`&' interpreted as argument prefix");
        t = tAMPER;
      }
      else if (IS_BEG())
      {
        t = tAMPER;
      }
      else
      {
        warn_balanced("&", "argument prefix", c);
        lexer.yylval = "&";
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
          lexer.yylval = "||"; // tOROP;
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        return tOROP;
      }
      if (c == '=')
      {
        lexer.yylval = "|"; // $('|');
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      pushback(c);
      lexer.yylval = "|";
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
          lexer.yylval = "+";
          return tUPLUS;
        }
        pushback(c);
        lexer.yylval = "+";
        return $('+');
      }
      if (c == '=')
      {
        lexer.yylval = "+"; // $('+');
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      if (IS_BEG() || (IS_SPCARG(c) && arg_ambiguous()))
      {
        lexer.lex_state = EXPR_BEG;
        pushback(c); // pushing back char after `+`
        if (c != '' && ISDIGIT(c))
        {
          c = '+';
          return start_num(c); // was: goto start_num;
        }
        
        lexer.yylval = "+";
        return tUPLUS;
      }
      lexer.lex_state = EXPR_BEG;
      pushback(c);
      warn_balanced("+", "unary operator", c);
      lexer.yylval = "+";
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
          lexer.yylval = "-";
          return tUMINUS;
        }
        pushback(c);
        lexer.yylval = "-";
        return $('-');
      }
      if (c == '=')
      {
        lexer.yylval = "-"; // $('-');
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
          lexer.yylval = "-";
          return tUMINUS_NUM;
        }
        lexer.yylval = "-";
        return tUMINUS;
      }
      lexer.lex_state = EXPR_BEG;
      pushback(c);
      warn_balanced("-", "unary operator", c);
      lexer.yylval = "-";
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
        lexer.yyerror("no .<digit> floating literal anymore; put 0 before dot");
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
        lexer.yylval = "/"; // $('/');
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
      lexer.yylval = "/";
      return $('/');
    }
    
    case '^':
    {
      if ((c = nextc()) == '=')
      {
        lexer.yylval = "^"; // $('^');
        lexer.lex_state = EXPR_BEG;
        return tOP_ASGN;
      }
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      pushback(c);
      lexer.yylval = "^";
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
      lexer.yylval = "~";
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
      var goto_quotation = false;
      goto_quotation: for (;;) // a label
      {
        // this label enulating loop expects the $lex_state
        // to be constant within its boudaries
        if (goto_quotation || IS_lex_state(EXPR_BEG_ANY))
        {
          if (!goto_quotation)
            c = nextc();
          goto_quotation = false; // got here, reset the flag
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
              lexer.yyerror("unknown type of %string `"+term+"'");
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
              lexer.yyerror("unknown type of %string");
              return 0;
          }
        }
        if ((c = nextc()) == '=')
        {
          lexer.yylval = "%"; // $('%');
          lexer.lex_state = EXPR_BEG;
          return tOP_ASGN;
        }
        if (IS_SPCARG(c))
        {
          goto_quotation = true; // added to skip state check
          continue goto_quotation; // was: goto quotation;
        }
        break; // the goto_quotation for (;;) label-loop
      } // for (;;) goto_quotation
      lexer.lex_state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      pushback(c);
      warn_balanced("%%", "string literal", c);
      lexer.yylval = "%";
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
          tokadd('$'+c);
          tokfix();
          lexer.yylval = tok(); // ID: intern string
          return tGVAR;

        case '-':
          tokadd('$'+c);
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
          lexer.yylval = tok(); // ID, intern string
          return tGVAR;

        case '&':              /* $&: last match */
        case '`':              /* $`: string before last match */
        case '\'':             /* $': string after last match */
        case '+':              /* $+: string matches last paren. */
          if (IS_lex_state_for(lexer.last_state, EXPR_FNAME))
          {
            tokadd('$'+c);
            // was: goto gvar;
            tokfix();
            lexer.yylval = tok(); // ID, intern string
            return tGVAR;
          }
          // was: set_yylval_node(NEW_BACK_REF(c)); TODO: check after time
          lexer.yylval = '$'+c; // we create new NODE_BACK_REF in parser
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
          // was: tokadd('$');
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
            // was: set_yylval_name(rb_intern(tok())); TODO: check
            lexer.yylval = '$'+tok();
            return tGVAR;
          }
          tokfix();
          // was: set_yylval_node(NEW_NTH_REF(atoi(tok() + 1))); TODO: check
          lexer.yylval = +tok();
          return tNTH_REF;

        default:
          if (!parser_is_identchar(c))
          {
            pushback(c);
            compile_error("`$"+c+"' is not allowed as a global variable name");
            return 0;
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
      if (c != '' && ISDIGIT(c) || !parser_is_identchar(c))
      {
        pushback(c);
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
    var is_local_id = true;

    lexer.last_state = lexer.lex_state;
    switch (tok()[0])
    {
      case '$':
        lexer.lex_state = EXPR_END;
        result = tGVAR;
        is_local_id = false;
        break;
      case '@':
        lexer.lex_state = EXPR_END;
        if (tok()[1] == '@')
          result = tCVAR;
        else
          result = tIVAR;
        is_local_id = false;
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
              is_local_id = false; // def abc=
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
            is_local_id = false;
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
            lexer.yylval = tok();
            is_local_id = false;
            return tLABEL;
          }
        }
        if (!IS_lex_state(EXPR_DOT))
        {
          // const struct kwtable *kw;

          // See if it is a reserved word.
          var kw = ownProperty(rb_reserved_word, tok());
          if (kw)
          {
            var state = lexer.lex_state;
            lexer.lex_state = kw.state;
            if (state == EXPR_FNAME)
            {
              // lexer.yylval = gen.rb_intern(tok()); // was: kw.name
              lexer.yylval = tok(); // was: kw.name
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
              // packed `id1`
              if (kw.id1) // was: kw.id0 != kw.id1
              {
                lexer.lex_state = EXPR_BEG;
                return kw.id1;
              }
              return kw.id0;
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
      var ident = tok();
      lexer.yylval = ident;
      // `is_local_id` is in place of `gen.is_local_id(ident)`,
      // and AKAICT, `gen.is_local_id` repeats the thing done by lexer
      if (!IS_lex_state_for(lexer.last_state, EXPR_DOT | EXPR_FNAME) &&
          is_local_id && $scope.is_declared(ident))
      {
        lexer.lex_state = EXPR_END;
      }
    }
    return result;
  }
  
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
  var func = here.func,
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
      str += $lex_lastline;
      
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
      var t = parser_peek_variable_name();
      if (t)
        return t;
      tokadd('#');
      c = nextc();
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
        // was: set_yylval_str(STR_NEW3(tok(), toklen(), enc, func));
        lexer.yylval = tok()
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
    str = tok();
  }
  heredoc_restore(lexer.lex_strterm);
  lexer.lex_strterm = NEW_STRTERM(-1, '', '');
  // was: set_yylval_str(str); TODO:
  lexer.yylval = str;
  return tSTRING_CONTENT;
}

function parse_string (quote)
{
  var func = quote.func,
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
  // quote.nested is increased in tokadd_string()
  // once for every `paren` char met
  if (c == term && !quote.nested)
  {
    if (func & STR_FUNC_QWORDS)
    {
      quote.func = -1;
      return $(' ');
    }
    if (!(func & STR_FUNC_REGEXP))
      return tSTRING_END;
    lexer.yylval = regx_options();
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
    var t = parser_peek_variable_name();
    if (t)
      return t;
    tokadd('#');
    c = nextc();
  }
  pushback(c);
  if (tokadd_string(func, term, paren, quote) == '')
  {
    lexer.ruby_sourceline = quote.ruby_sourceline;
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
  // was: set_yylval_str(STR_NEW3(tok(), toklen(), enc, func));
  lexer.yylval = tok();

  return tSTRING_CONTENT;
}


function tokadd_string (func, term, paren, str_term)
{
  var c = '';
  while ((c = nextc()) != '')
  {
    if (paren && c == paren)
    {
      ++str_term.nested;
    }
    else if (c == term)
    {
      if (!str_term || !str_term.nested)
      {
        pushback(c);
        break;
      }
      --str_term.nested;
    }
    else if ((func & STR_FUNC_EXPAND) && c == '#' && $lex_p < $lex_pend)
    {
      var c2 = lex_pv();
      if (c2 == '$' || c2 == '@' || c2 == '{')
      {
        // push the '#' back
        pushback(c);
        // and leave it for the caller to process
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
            if (!tokadd_escape()) // useless `c = ` was here
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

function regx_options ()
{
  var options = match_grex(/[a-zA-Z]+|/g)[0];
  $lex_p += options.length;
  return options;
}

function simple_re_meta (c)
{
  switch (c)
  {
    case '$': case '*': case '+': case '.':
    case '?': case '^': case '|':
    case ')': case ']': case '}': case '>':
      return true;
    default:
      return false;
  }
}


function tokadd_escape_eof ()
{
  lexer.yyerror("Invalid escape character syntax");
}
// return `true` on success and `false` on failure,
// it is quite different from original source,
// however the returning value is a flag only there too;
function tokadd_escape ()
{
  var c = '';
  var flags = 0;

  switch (c = nextc())
  {
    case '\n':
      return true;                 /* just ignore */

    case '0':
    case '1':
    case '2':
    case '3':                  /* octal constant */
    case '4':
    case '5':
    case '6':
    case '7':
    {
      // was: scan_oct(lex_p, 3, &numlen);
      
      // we're here: "\|012",
      // so just match one or two more digits
      var oct = match_grex(/[0-7]{1,2}|/g);
      if (!oct)
      {
        // was: goto eof;
        tokadd_escape_eof();
        return false;
      }
      $lex_p += oct.length;
      tokadd('\\' + c + oct);
    }
    return true;

    case 'x':                  /* hex constant */
      {
        // was: tok_hex(&numlen);
        
        // we're here: "\x|AB",
        // so just match one or two more digits
        var hex = match_grex(/[0-9a-fA-F]{1,2}|/g);
        if (!hex)
        {
          yyerror("invalid hex escape");
          return false;
        }
        $lex_p += hex.length;
        tokadd('\\x' + hex);
      }
      return true;
    
    case '':
      tokadd_escape_eof();
      return false;
    
    case 'c':
      tokadd("\\c");
      return true;
    
    case 'M':
    case 'C':
      lexer.yyerror("JavaScript doesn't support `\\"+c+"-' in regexp");
      if ((c = nextc()) != '-')
      {
        pushback(c);
        tokadd_escape_eof();
        return false;
      }
      tokcopy(3); // add though
      return true;
    
    default:
      tokadd("\\"+c);
  }
  return true;
}

// checks if the current line matches `/^\s*#{eos}\n?$/`;
var whole_match_p_rexcache = {};
function whole_match_p (eos, indent)
{
  if (!indent)
  {
    return $lex_lastline == eos + '\n' || $lex_lastline == eos;
  }
  
  // here there are all with indentation enabled!
  var rex = whole_match_p_rexcache[eos];
  if (!rex)
  {
    // `eos` is an identifier and doesn't need to be escaped
    rex = new RegExp('^[ \\t]*' + eos + '$', 'm');
    whole_match_p_rexcache[eos] = rex;
  }
  
  return rex.test($lex_lastline);
}

function heredoc_restore (here)
{
  // restores the line from where the heredoc occured to begin
  $lex_lastline = here.lex_lastline;
  $lex_pbeg = 0;
  $lex_pend = $lex_lastline.length;
  // restores the position in the line, right after heredoc token
  $lex_p = here.lex_p;
  // have no ideas yet :)
  lexer.heredoc_end = lexer.ruby_sourceline;
  lexer.ruby_sourceline = here.ruby_sourceline;
}

var ESCAPE_CONTROL = 1,
    ESCAPE_META = 2;

function read_escape_eof ()
{
  lexer.yyerror("Invalid escape character syntax");
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
      $lex_p += oct.length;
      return c;

    case 'x':                  /* hex constant */
      // was: c = tok_hex(&numlen);
      var hex = match_grex(/[0-9a-fA-F]{1,2}|/g)[0];
      if (!hex)
      {
        lexer.yyerror("invalid hex escape");
        return '';
      }
      $lex_p += hex.length;
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
        lexer.yyerror("invalid Unicode escape");
        return '';
      }
      var codepoint = parseInt(hex, 16);
      var the_char = $$(codepoint);
      if (codepoint > 0x10ffff)
      {
        lexer.yyerror("invalid Unicode codepoint "+codepoint+" (too large)");
        return '';
      }
      
      $lex_p += hex.length;
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
      lexer.yyerror("unterminated Unicode escape");
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
      lexer.yyerror("invalid Unicode escape");
      return '';
    }
    var codepoint = parseInt(hex, 16);
    var the_char = $$(codepoint);
    $lex_p += 4;
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
// as of Ruby 2.0 we don't expect to be called from leading '-' match
function start_num (c)
{
  var is_float = false,
      seen_point = false,
      seen_e = false,
      nondigit = '';

  lexer.lex_state = EXPR_END;
  newtok();
  if (c == '-' || c == '+')
  {
    tokadd(c);
    c = nextc();
  }
  
  goto_trailing_uc: {
  goto_decode_num: {
  goto_invalid_octal: {
  
  if (c == '0')
  {
    var start = toklen();
    c = nextc();
    if (c == 'x' || c == 'X')
    {
      /* hexadecimal */
      c = nextc();
      if (c != '' && ISXDIGIT(c))
      {
        do
        {
          if (c == '_')
          {
            if (nondigit)
              break;
            nondigit = c;
            continue;
          }
          if (!ISXDIGIT(c))
            break;
          nondigit = '';
          tokadd(c);
        }
        while ((c = nextc()) != '');
      }
      pushback(c);
      tokfix();
      if (toklen() == start)
      {
        lexer.yyerror("numeric literal without digits");
        return 0;
      }
      else if (nondigit)
        break goto_trailing_uc; // was: goto trailing_uc;
      lexer.yylval = parseInt(tok(), 1);
      return tINTEGER;
    }
    if (c == 'b' || c == 'B')
    {
      /* binary */
      c = nextc();
      if (c == '0' || c == '1')
      {
        do
        {
          if (c == '_')
          {
            if (nondigit)
              break;
            nondigit = c;
            continue;
          }
          if (c != '0' && c != '1')
            break;
          nondigit = '';
          tokadd(c);
        }
        while ((c = nextc()) != '');
      }
      pushback(c);
      tokfix();
      if (toklen() == start)
      {
        lexer.yyerror("numeric literal without digits");
        return 0;
      }
      else if (nondigit)
        break goto_trailing_uc; // was: goto trailing_uc;
      lexer.yylval = parseInt(tok(), 2);
      return tINTEGER;
    }
    if (c == 'd' || c == 'D')
    {
      /* decimal */
      c = nextc();
      if (c != '' && ISDIGIT(c))
      {
        do
        {
          if (c == '_')
          {
            if (nondigit)
              break;
            nondigit = c;
            continue;
          }
          if (!ISDIGIT(c))
            break;
          nondigit = '';
          tokadd(c);
        }
        while ((c = nextc()) != '');
      }
      pushback(c);
      tokfix();
      if (toklen() == start)
      {
        lexer.yyerror("numeric literal without digits");
        return 0;
      }
      else if (nondigit)
        break goto_trailing_uc; // was: goto trailing_uc;
      lexer.yylval = parseInt(tok(), 10)
      return tINTEGER;
    }
    // was: if (c == '_')
    // was: {
    // was:   /* 0_0 */
    // was:   goto octal_number;
    // was: }
    // and moved after the next if block
    if (c == 'o' || c == 'O')
    {
      /* prefixed octal */
      c = nextc();
      if (c == '' || c == '_' || !ISDIGIT(c))
      {
        lexer.yyerror("numeric literal without digits");
        return 0;
      }
    }
    if ((c >= '0' && c <= '7') || c == '_')
    {
      /* octal */
      // was:  octal_number:
      do
      {
        if (c == '_')
        {
          if (nondigit)
            break;
          nondigit = c;
          continue;
        }
        if (c < '0' || c > '9')
          break;
        if (c > '7')
        {
          lexer.yyerror("Invalid octal digit");
          break goto_invalid_octal; // was: goto invalid_octal;
        }
        nondigit = '';
        tokadd(c);
      }
      while ((c = nextc()) != '');
      if (toklen() > start)
      {
        pushback(c);
        tokfix();
        if (nondigit)
          break goto_trailing_uc; // was: goto trailing_uc;
        lexer.yylval = parseInt(tok(), 8);
        return tINTEGER;
      }
      if (nondigit)
      {
        pushback(c);
        break goto_trailing_uc; // was: goto trailing_uc;
      }
    }
    if (c > '7' && c <= '9')
    {
      // was: invalid_octal:
      lexer.yyerror("Invalid octal digit");
    }
    else if (c == '.' || c == 'e' || c == 'E')
    {
      tokadd('0');
    }
    else
    {
      pushback(c);
      // was: set_yylval_literal(INT2FIX(0));
      lexer.yylval = 0;
      return tINTEGER;
    }
  } // c == '0'

  } // goto_invalid_octal

  for (;;)
  {
    switch (c)
    {
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
        nondigit = '';
        tokadd(c);
        break;

      case '.':
        if (nondigit)
          break goto_trailing_uc; // was: goto trailing_uc;
        if (seen_point || seen_e)
        {
          break goto_decode_num; // was: goto decode_num;
        }
        else
        {
          var c0 = nextc();
          if (c0 == '' || !ISDIGIT(c0))
          {
            pushback(c0);
            break goto_decode_num; // was: goto decode_num;
          }
          c = c0;
        }
        tokadd('.');
        tokadd(c);
        is_float = true;
        seen_point = true;
        nondigit = '';
        break;

      case 'e':
      case 'E':
        if (nondigit)
        {
          pushback(c);
          c = nondigit;
          break goto_decode_num; // was: goto decode_num;
        }
        if (seen_e)
        {
          break goto_decode_num; // was: goto decode_num;
        }
        tokadd(c);
        seen_e = true;
        is_float = true;
        nondigit = c;
        c = nextc();
        if (c != '-' && c != '+')
          continue;
        tokadd(c);
        nondigit = c;
        break;

      case '_':          /* `_' in number just ignored */
        if (nondigit)
          break goto_decode_num; // was: goto decode_num;
        nondigit = c;
        break;

      default:
        break goto_decode_num; // was: goto decode_num;
    }
    c = nextc();
  } // decimal for

  } // goto_decode_num
  
  // was: decode_num:
  pushback(c);
  
  } // goto_trailing_uc:
  
  if (nondigit) // always true after `break goto_trailing_uc;`
  {
    // was: trailing_uc:
    lexer.yyerror("trailing `"+nondigit+"' in number");
  }
  tokfix();
  if (is_float)
  {
    var d = parseFloat(tok());
    // if (errno == ERANGE)
    // {
    //   rb_warningS("Float %s out of range", tok()); TODO
    //   errno = 0;
    // }
    lexer.yylval = d;
    return tFLOAT;
  }
  lexer.yylval = parseInt(tok(), 10);
  return tINTEGER;

  // why are we so certain about returning `tFLOAT` or `tINTEGER`?
  // because we have got here meating a digit :)
}

var ruby_global_name_punct_bits =
{
  '~': true, '*': true, '$':  true, '?':  true,
  '!': true, '@': true, '/':  true, '\\': true,
  ';': true, ',': true, '.':  true, '=':  true,
  ':': true, '<': true, '>':  true, '\"': true,
  '&': true, '`': true, '\'': true, '+':  true,
  '0': true
};

function is_global_name_punct (c)
{
  if (c <= ' '/*0x20*/ || /*0x7e*/ '~' < c)
    return false;
  return ruby_global_name_punct_bits[c];
}


function parser_peek_variable_name ()
{
  var p = $lex_p;

  if (p + 1 >= $lex_pend)
    return 0;
  var c = p_pv(p++);
  switch (c)
  {
    case '$':
      if ((c = p_pv(p)) == '-')
      {
        if (++p >= $lex_pend)
          return 0;
        c = p_pv(p);
      }
      else if (is_global_name_punct(c) || ISDIGIT(c))
      {
        return tSTRING_DVAR;
      }
      break;
    case '@':
      if ((c = p_pv(p)) == '@')
      {
        if (++p >= $lex_pend)
          return 0;
        c = p_pv(p);
      }
      break;
    case '{':
      $lex_p = p;
      lexer.command_start = true;
      return tSTRING_DBEG;
    default:
      return 0;
  }

  if (!ISASCII(c) || c == '_' || ISALPHA(c))
    return tSTRING_DVAR;
  return 0;
}



// struct kwtable {const char *name; int id[2]; enum lex_state_e state;};
var rb_reserved_word = lexer.rb_reserved_word =
{
'__ENCODING__': {id0: keyword__ENCODING__, state: EXPR_END},
'__LINE__': {id0: keyword__LINE__, state: EXPR_END},
'__FILE__': {id0: keyword__FILE__, state: EXPR_END},
'BEGIN': {id0: keyword_BEGIN, state: EXPR_END},
'END': {id0: keyword_END, state: EXPR_END},
'alias': {id0: keyword_alias, state: EXPR_FNAME},
'and': {id0: keyword_and, state: EXPR_VALUE},
'begin': {id0: keyword_begin, state: EXPR_BEG},
'break': {id0: keyword_break, state: EXPR_MID},
'case': {id0: keyword_case, state: EXPR_VALUE},
'class': {id0: keyword_class, state: EXPR_CLASS},
'def': {id0: keyword_def, state: EXPR_FNAME},
'defined?': {id0: keyword_defined, state: EXPR_ARG},
'do': {id0: keyword_do, state: EXPR_BEG},
'else': {id0: keyword_else, state: EXPR_BEG},
'elsif': {id0: keyword_elsif, state: EXPR_VALUE},
'end': {id0: keyword_end, state: EXPR_END},
'ensure': {id0: keyword_ensure, state: EXPR_BEG},
'false': {id0: keyword_false, state: EXPR_END},
'for': {id0: keyword_for, state: EXPR_VALUE},
'if': {id0: keyword_if, id1: modifier_if, state: EXPR_VALUE},
'in': {id0: keyword_in, state: EXPR_VALUE},
'module': {id0: keyword_module, state: EXPR_VALUE},
'next': {id0: keyword_next, state: EXPR_MID},
'nil': {id0: keyword_nil, state: EXPR_END},
'not': {id0: keyword_not, state: EXPR_ARG},
'or': {id0: keyword_or, state: EXPR_VALUE},
'redo': {id0: keyword_redo, state: EXPR_END},
'rescue': {id0: keyword_rescue, id1: modifier_rescue, state: EXPR_MID},
'retry': {id0: keyword_retry, state: EXPR_END},
'return': {id0: keyword_return, state: EXPR_MID},
'self': {id0: keyword_self, state: EXPR_END},
'super': {id0: keyword_super, state: EXPR_ARG},
'then': {id0: keyword_then, state: EXPR_BEG},
'true': {id0: keyword_true, state: EXPR_END},
'undef': {id0: keyword_undef, state: EXPR_FNAME},
'unless': {id0: keyword_unless, id1: modifier_unless, state: EXPR_VALUE},
'until': {id0: keyword_until, id1: modifier_until, state: EXPR_VALUE},
'when': {id0: keyword_when, state: EXPR_VALUE},
'while': {id0: keyword_while, id1: modifier_while, state: EXPR_VALUE},
'yield': {id0: keyword_yield, state: EXPR_ARG}
};

lexer.print = null // to be defined in RubyParser constructor

function scream (msg, lineno, filename)
{
  lexer.print
  (
    (filename || lexer.filename) +
    ':' +
    (lineno || lexer.ruby_sourceline) +
    ': ' +
    msg + '\n'
  );
}

function warn (msg, lineno, filename)
{
  scream('warning: ' + msg, lineno, filename);
}
lexer.warn = warn;

function compile_error (msg)
{
  lexer.nerr++;

  scream(msg);
}
lexer.compile_error = compile_error

lexer.yyerror = function yyerror (msg)
{
  compile_error(msg);

  // to clean up \n \t and others
  var line = lexer.get_lex_lastline();
  var begin = line.substring(0, $lex_p)
                  .replace(/[\n\r]+/g, '')
                  .replace(/\s+/g, ' ');
  var end =   line.substring($lex_p)
                  .replace(/[\n\r]+/g, '')
                  .replace(/\s+/g, ' ');
  var arrow = [];
  arrow[begin.length] = '^';
  lexer.print(begin + end + '\n');
  lexer.print(arrow.join(' ') + '\n');
}

} // function YYLexer

YYLexer.unpack_location = function (loc)
{
  var line = (loc / 1000) | 0;
  return {line: line, col: loc - line * 1000};
}
