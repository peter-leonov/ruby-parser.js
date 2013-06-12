var YYLexer = (function(){

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
// have no idea TODO
lexer.command_start = false;
// have no idea TODO
lexer.cond_stack = 0;
// have no idea TODO
lexer.cmdarg_stack = 0;


// all lexer states had been moved to parse.y prologue

// the shortcut for checking `lexer.state` over and over again
function IS_lex_state (state)
{
  return lexer.state & state
}

// few more shortcuts
function IS_ARG () { return lexer.state & EXPR_ARG_ANY }
function IS_END () { return lexer.state & EXPR_END_ANY }
function IS_BEG () { return lexer.state & EXPR_BEG_ANY }

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

// em…
function IS_SPCARG (c) { return IS_ARG() && space_seen && !ISSPACE(c) }

function IS_AFTER_OPERATOR () { return IS_lex_state(EXPR_FNAME | EXPR_DOT) }


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
// our addition
function what_nextc ()
{
  if ($pos >= $streamLength)
  {
    return '';
  }
  
  return $stream[$pos];
}
function what_nextc_n (n)
{
  var pos = $pos + n;
  if (pos >= $streamLength)
  {
    return '';
  }
  
  return $stream[pos];
}
// expects rex in this form: `/blablabla|/g`
// that means `blablabla` or empty string (to prevent deep search)
function match_grex (rex)
{
  rex.lastIndex = $pos;
  // there is always a match for empty string
  return rex.exec($stream)[0];
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

// was begin af a line (`^` in terms of regexps) before last `nextc()`,
// that true if we're here "a|bc" of here "abc\na|bc"
function was_bol ()
{
  return $pos === 1 || $stream[$pos-2] === '\n'
}
// out own addition
// is begin af a line (`^` in terms of regexps) at the `$pos`,
// that true if we're here "|abc" of here "abc\n|abc"
function is_bol ()
{
  return $pos === 0 || $stream[$pos-1] === '\n'
}


// token related stuff

var tokenbuf = ''
function newtok ()
{
  tokenbuf = '';
  return tokenbuf;
}
function tokadd (c)
{
  tokenbuf += c;
  return c;
}
var tokadd_mbchar = tokadd;
function tokfix () { /* was: tokenbuf[tokidx]='\0'*/ }
function tok () { return tokenbuf; }
function toklen () { return tokenbuf.length; }
function toklast ()
{
  return tokenbuf.substr(-1)
  // was: tokidx>0?tokenbuf[tokidx-1]:0)
}


// TODO
this.getStartPos = function () { return $pos; }
this.getEndPos = function () { return $pos + 1; }
this.getLVal = function () { return tokenbuf; }



// other stuff

function parser_is_identchar (c)
{
  // \w = [A-Za-z0-9_]
  return /^\w/.test(c)
}

function NEW_STRTERM (func, term, paren)
{
  return {
    type: 'NODE_STRTERM',
    func: func,
    tok: term,
    paren: paren,
    pos_after_eos: 0, // to be calculated in `here_document()`
    heredoc_end_found_last_time: false,
    line: 0 // TODO: `ruby_sourceline`
  };
}
// our addition
function NEW_HEREDOCTERM (func, term)
{
  return {
    type: 'NODE_HEREDOC',
    func: func,
    tok: term,
    paren: '',
    pos_after_eos: 0, // to be calculated in `here_document()`
    heredoc_end_found_last_time: false,
    line: 0 // TODO: `ruby_sourceline`
  };
}

// char to code shortcut
function $ (c) { return c.charCodeAt(0) }
function $$ (code) { return String.fromCharCode(code) }

function ISASCII (c)
{
  return $(c) < 128;
}






this.yylex = function yylex ()
{
  var c = '';
  var space_seen = false;
  
  if (false) // TODO
  // if (lexer.strterm)
  {
    var token = 0;
    if (lexer.strterm.type == 'NODE_HEREDOC')
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
  var last_state = lexer.state;
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
            // --ruby_sourceline; TODO
            // lex_nextline = lex_lastline; TODO
            
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
  
    case '*':
    {
      var token = 0
      if ((c = nextc()) == '*')
      {
        if ((c = nextc()) == '=')
        {
          // set_yylval_id(tPOW); TODO
          lexer.state = EXPR_BEG;
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
          warn_balanced("**", "argument prefix");
          token = tPOW;
        }
      }
      else
      {
        if (c == '=')
        {
          // set_yylval_id('*'); TODO
          lexer.state = EXPR_BEG;
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
          // warn_balanced("*", "argument prefix"); TODO
          token = $('*');
        }
      }
      lexer.state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      return token;
    }
    
    case '!':
    {
      c = nextc();
      if (IS_AFTER_OPERATOR())
      {
        lexer.state = EXPR_ARG;
        if (c == '@')
        {
          return $('!');
        }
      }
      else
      {
        lexer.state = EXPR_BEG;
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

      lexer.state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
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
      last_state = lexer.state;
      c = nextc();
      if (c == '<' &&
          !IS_lex_state(EXPR_DOT | EXPR_CLASS) &&
          !IS_END() && (!IS_ARG() || space_seen))
      {
        var token = heredoc_identifier();
        if (token)
          return token;
      }
      if (IS_AFTER_OPERATOR())
      {
        lexer.state = EXPR_ARG;
      }
      else
      {
        if (IS_lex_state(EXPR_CLASS))
          lexer.command_start = true;
        lexer.state = EXPR_BEG;
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
          lexer.state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        // warn_balanced("<<", "here document"); TODO
        return tLSHFT;
      }
      pushback(c);
      return $('<');
    }
    
    case '>':
    {
      lexer.state = IS_AFTER_OPERATOR()? EXPR_ARG : EXPR_BEG;
      if ((c = nextc()) == '=')
      {
        return tGEQ;
      }
      if (c == '>')
      {
        if ((c = nextc()) == '=')
        {
          // set_yylval_id(tRSHFT); TODO
          lexer.state = EXPR_BEG;
          return tOP_ASGN;
        }
        pushback(c);
        return tRSHFT;
      }
      pushback(c);
      return '>';
    }
    
    case '"':
    {
      lexer.strterm = NEW_STRTERM(str_dquote, '"', '')
      return tSTRING_BEG;
    }
    
    case '`':
    {
      if (IS_lex_state(EXPR_FNAME))
      {
        lexer.state = EXPR_ENDFN;
        return c;
      }
      if (IS_lex_state(EXPR_DOT))
      {
        if (cmd_state)
          lexer.state = EXPR_CMDARG;
        else
          lexer.state = EXPR_ARG;
        return c;
      }
      lexer.strterm = NEW_STRTERM(str_xquote, '`', '');
      return tXSTRING_BEG;
    }
    
    case '\'':
    {
      lexer.strterm = NEW_STRTERM(str_squote, '\'', '');
      return tSTRING_BEG;
    }
    
    case '?':
    {
      // trying to catch ternary operator
      if (IS_END())
      {
        lexer.state = EXPR_VALUE;
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
        lexer.state = EXPR_VALUE;
        return $('?');
      }
      
      // the `?ab` construction
      if (parser_is_identchar(c) && parser_is_identchar(what_nextc()))
      {
        pushback(c);
        lex_state = EXPR_VALUE;
        return $('?');
      }
      
      // definitely it's a character
      
      newtok();
      if (c == '\\')
      {
        c = nextc();
        if (c === 'u')
        {
          c = parser_tokadd_utf8(false, false, false);
          tokadd(c);
        }
        else if (!(ISASCII(c)))
        {
          if (tokadd(c) == '')
            return 0;
        }
        else
        {
          pushback(c);
          // TODO:
          // c = read_escape(0, &enc);
          // tokadd(c);
        }
      }
      else
      {
        tokadd(c);
      }
      tokfix();
      // set_yylval_str(STR_NEW3(tok(), toklen(), enc, 0)); TODO
      lexer.state = EXPR_END;
      return tCHAR;
    }
    
    // add before here :)
    
    default:
    {
      if (!parser_is_identchar(c))
      {
        compile_error("Invalid char `"+c+"' in expression");
        continue retry;
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
  switch (c)
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
  
  
  return c ? 999 : 0
  
  } // retry for loop
}

function heredoc_identifier ()
{
  var term = 0, func = 0, len = 0;
  
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
        if (tokadd_mbchar(c) == '')
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
    // TODO: create token with $stream.substring(start, end)
    newtok();
    term = '"';
    tokadd(func |= str_dquote);
    do
    {
      if (tokadd_mbchar(c) == '')
        return 0;
    }
    while ((c = nextc()) != '' && parser_is_identchar(c));
    pushback(c);
  } // defaultt:

  tokfix();
  lex_goto_eol();
  lexer.strterm = NEW_HEREDOCTERM(func, tok());
  return term == '`' ? tXSTRING_BEG : tSTRING_BEG;
}

function here_document_error (eos)
{
  // was: error:
    compile_error("can't find string \""+eos+"\" anywhere before EOF");
  // was: restore:
    heredoc_restore(lexer.strterm);
    lexer.strterm = null;
    return 0;
}
function here_document (here)
{
  // instead of repeating the work just check the flag
  if (lexer.strterm.heredoc_end_found_last_time)
  {
    // was: dispatch_heredoc_end(); a noop out of ripper
    heredoc_restore(lexer.strterm);
    return tSTRING_END; // will erase `lexer.strterm`
  }

  // we're at the heredoc content start
  var func = here.func,
      eos  = here.tok,
      indent = func & STR_FUNC_INDENT;

  var c = ''
  // // do not look for `#{}` stuff here
  // if (!(func & STR_FUNC_EXPAND))
  {
    // mark a start of the string token
    var start = $pos, end = 0;
    scaning: // the heredoc body
    for (;;)
    {
      c = nextc();
      // EOF reached in the middle of the heredoc
      if (c === '')
      {
        return here_document_error(eos);
      }
      
      // end of line here
      if (c === '\n')
      {
        // try to match the end of heredoc
        // and get the position right after it
        var match_end = lookahead_whole_match_pos(eos, indent, $pos);
        if (match_end !== -1)
        {
          end = $pos;
          lexer.strterm.heredoc_end_found_last_time = true;
          lexer.strterm.pos_after_eos = match_end;
          break scaning; // the heredoc body
        }
        continue scaning; // the heredoc body
      }
    }
  }
  // // try to find all the `#{}` stuff here
  // else
  // {
  //   /*      int mb = ENC_CODERANGE_7BIT, *mbp = &mb; */
  //   newtok();
  //   if (c == '#')
  //   {
  //     switch (c = nextc())
  //     {
  //       case '$':
  //       case '@':
  //         pushback(c);
  //         return tSTRING_DVAR;
  //       case '{':
  //         lexer.command_start = TRUE;
  //         return tSTRING_DBEG;
  //     }
  //     tokadd('#');
  //   }
  //   do
  //   {
  //     pushback(c);
  //     if ((c = tokadd_string(func, '\n', 0, NULL, &enc)) == -1)
  //     {
  //       if (parser->eofp)
  //         goto error;
  //       goto restore;
  //     }
  //     if (c != '\n')
  //     {
  //       set_yylval_str(STR_NEW3(tok(), toklen(), enc, func));
  //       flush_string_content(enc);
  //       return tSTRING_CONTENT;
  //     }
  //     tokadd(nextc());
  //     /*      if (mbp && mb == ENC_CODERANGE_UNKNOWN) mbp = 0; */
  //     if ((c = nextc()) == -1)
  //       goto error;
  //   }
  //   while (!lookahead_whole_match_pos(eos, indent, $pos-1));
  //   str = STR_NEW3(tok(), toklen(), enc, func);
  // }
  // was: dispatch_heredoc_end(); a noop out of ripper
  heredoc_restore(lexer.strterm);
  // lex_strterm = NEW_STRTERM(-1, 0, 0);
  // set_yylval_str(str); TODO:
  return tSTRING_CONTENT;
}

// checks if the current line matches `/\s*#{eos}\n/`;
// `pos` tell us when the start point is:
// for `pos` = 2 "ab|c".
// Returns the position after the trailing `\n\:
//   "…\n    EOS\n|"
function lookahead_whole_match_pos (eos, indent, pos)
{
  // skip all white spaces if in `indent` mode
  if (indent)
  {
    while (ISSPACE_NOT_N($stream[pos]))
      pos++;
  }
  
  var len = eos.length;
  // check first if the `eos` fits the rest of the line
  if ($stream[pos + len] !== '\n')
    return -1;
  
  return $stream.substr(pos, len) === eos ? (pos + len + 1) : -1;
}

function heredoc_restore (here)
{
  $pos = here.pos_after_eos;
}

/* return value is for ?\u3042 */
function parser_tokadd_utf8(string_literal, symbol_literal, regexp_literal)
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
      var hex = match_grex(/[0-9a-fA-F]{1,6}|/g);
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
      
      $pos += hex.length;
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
    var hex = match_grex(/[0-9a-fA-F]{4}|/g);
    if (hex === '')
    {
      yyerror("invalid Unicode escape");
      return '';
    }
    var codepoint = parseInt(hex, 16);
    var the_char = $$(codepoint);
    $pos += 4;
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


function debug (msg)
{
  print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  print(msg)
  print(
    $stream.substring($pos - 25, $pos) +
    '>>here<<' +
    $stream.substring($pos, $pos + 25)
  )
  print('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
}
function warning (msg) { debug('WARNING: ' + msg) }
function compile_error (msg) { debug('COMPILE ERROR: ' + msg) }
function yyerror (msg) { debug('YYERROR: ' + msg) }
this.yyerror = yyerror;

} // function Lexer

return Lexer;

})();