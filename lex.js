"use strict";

;(function(){

// proven to be fastest in regexp group by scan.js,
// tested with v8 and js17 -m -n
function regexps_on_position (text)
{
  var rex = /([a-zA-Z0-9_]+)|([\(\)\[\]\{\}])|([\.\:])|(\s+)|()/g

  var tokens = []
  for (var substr = text, pos = 0, len = substr.length; pos < len;)
  {
    var m = rex.exec(substr)
    var lastIndex = rex.lastIndex
    if (lastIndex === pos)
    {
      var token = substr[pos]
      pos++
      rex.lastIndex = pos
    }
    else
    {
      var token = m[0]
      pos = rex.lastIndex
    }

    // print(token)
    tokens.push(token)
  }
  
  return tokens
}





function char_by_char (text)
{
  var tokens = [],
      values = []
  try
  {
    char_by_char_body(text, tokens, values)
  }
  catch (e)
  {
    if (e != 'eof')
      throw e
  }
  return {tokens: tokens, values: values}
}
function char_by_char_body (text, tokens, values)
{
  var lastPos = text.length - 1
  var pos = -1
  function nextc ()
  {
    if (pos === lastPos)
      throw 'eof'
    
    return text.charAt(++pos)
  }
  
  function isa_az_AZ09 (c)
  {
    return !!( // !! saves a bit in v8
      ('a' <= c && c <= 'z') ||
      ('A' <= c && c <= 'A') ||
      ('0' <= c && c <= '9') ||
      c == '_'
    )
  }
  function isa_az_AZ (c)
  {
    return !!( // !! saves a bit in v8
      ('a' <= c && c <= 'z') ||
      ('A' <= c && c <= 'A') ||
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
      values.push('')
      // c is new
      continue
    }
    
    if (isa_brace(c))
    {
      tokens.push(258)
      values.push('')
      c = nextc()
      continue
    }
    
    if (c === '.')
    {
      tokens.push(259)
      values.push('')
      c = nextc()
      continue
    }
    
    if (c === ':')
    {
      tokens.push(260)
      values.push('')
      c = nextc()
      continue
    }
    
    if (c === ',')
    {
      tokens.push(261)
      values.push('')
      c = nextc()
      continue
    }
    
    // unknown symbol
    tokens.push(0)
    values.push('')
    c = nextc()
  }
}





function code_by_code (text)
{
  var tokens = [],
      values = []
  try
  {
    code_by_code_body(text, tokens, values)
  }
  catch (e)
  {
    if (e != 'eof')
      throw e
  }
  return {tokens: tokens, values: values}
}
function code_by_code_body (text, tokens, values)
{
  var lastPos = text.length - 1
  var pos = -1
  function nextc ()
  {
    if (pos === lastPos)
      throw 'eof'
    
    return text.charCodeAt(++pos)
  }
  
  var $a = 'a'.charCodeAt(0)
  var $z = 'z'.charCodeAt(0)
  var $A = 'A'.charCodeAt(0)
  var $Z = 'Z'.charCodeAt(0)
  var $0 = '0'.charCodeAt(0)
  var $9 = '9'.charCodeAt(0)
  var $_ = '_'.charCodeAt(0)
  function isa_az_AZ09 (c)
  {
    return !!( // !! saves a bit in v8
      ($a <= c && c <= $z) ||
      ($A <= c && c <= $A) ||
      ($0 <= c && c <= $9) ||
      c == $_
    )
  }
  function isa_az_AZ (c)
  {
    return !!( // !! saves a bit in v8
      ($a <= c && c <= $z) ||
      ($A <= c && c <= $A) ||
      c == $_
    )
  }
  
  var $lb = '('.charCodeAt(0)
  var $rb = ')'.charCodeAt(0)
  var $ls = '['.charCodeAt(0)
  var $rs = ']'.charCodeAt(0)
  var $lc = '{'.charCodeAt(0)
  var $rc = '}'.charCodeAt(0)
  function isa_brace (c)
  {
    return !!( // !! saves a bit in v8
      c === $lb || c === $rb ||
      c === $ls || c === $rs ||
      c === $lc || c === $rc
    )
  }
  
  var $s = ' '.charCodeAt(0)
  var $r = '\r'.charCodeAt(0)
  var $n = '\n'.charCodeAt(0)
  var $t = '\t'.charCodeAt(0)
  function isa_space (c)
  {
    return !!( // !! saves a bit in v8
      c === $s || c === $r ||
      c === $n || c === $t
    )
  }
  
  var $q = '?'.charCodeAt(0)
  
  var $dot = '.'.charCodeAt(0)
  var $sem = ':'.charCodeAt(0)
  var $com = ','.charCodeAt(0)
  
  var c = nextc()
  for (;;)
  {
    if (isa_az_AZ(c))
    {
      var start = pos // of the c
      while (isa_az_AZ09(c = nextc()));
      if (c === $q)
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
      values.push('')
      // c is new
      continue
    }
    
    if (isa_brace(c))
    {
      tokens.push(258)
      values.push('')
      c = nextc()
      continue
    }
    
    if (c === $dot)
    {
      tokens.push(259)
      values.push('')
      c = nextc()
      continue
    }
    
    if (c === $sem)
    {
      tokens.push(260)
      values.push('')
      c = nextc()
      continue
    }
    
    if (c === $com)
    {
      tokens.push(261)
      values.push('')
      c = nextc()
      continue
    }
    
    // unknown symbol
    tokens.push(0)
    values.push('')
    c = nextc()
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
  print('  tokens:', res.tokens.length)
  print('  exact:', res.values.join('') == bigText)
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
// var repeat = 1000; warmup()
// measure(regexps_on_position, repeat)
measure(char_by_char, repeat)
measure(code_by_code, repeat)


})();