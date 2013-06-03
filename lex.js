"use strict";

;(function(){

// proven to be fastest in regexp group by scan.js,
// tested with v8 and js17 -m -n
function regexps_on_position (text)
{
  var tokens = [],
      values = [] // try to pack as ((token_value_index << 10) + token_type)
  
  var rex = /([a-z_A-Z][a-z_A-Z0-9]*\??)|([ \r\n\t]+)|([\(\)\[\]\{\}])|(\.)|(:)|(,)|(.)/mg
  
  var t = ''
  for (var pos = 0, len = text.length; pos < len;)
  {
    var m = rex.exec(text)
    pos = rex.lastIndex
    
    if (t = m[1])
    {
      tokens.push(257)
      values.push(t)
      continue
    }
    
    if (t = m[2])
    {
      tokens.push(262)
      continue
    }
    
    if (t = m[3])
    {
      tokens.push(258)
      continue
    }
    
    if (t = m[4])
    {
      tokens.push(259)
      continue
    }
    
    if (t = m[5])
    {
      tokens.push(260)
      continue
    }
    
    if (t = m[6])
    {
      tokens.push(261)
      continue
    }
    
    // unknown symbol
    tokens.push(0)
  }
  
  return tokens.length + values.length
}









function char_by_char (text)
{
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





function code_by_code (text)
{
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
      ($A <= c && c <= $Z) ||
      ($0 <= c && c <= $9) ||
      c == $_
    )
  }
  function isa_az_AZ (c)
  {
    return !!( // !! saves a bit in v8
      ($a <= c && c <= $z) ||
      ($A <= c && c <= $Z) ||
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
  
  var lastPos = text.length - 1
  var pos = -1
  function nextc ()
  {
    if (pos >= lastPos)
      return -1
    
    return text.charCodeAt(++pos)
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
      // c is new
      continue
    }
    
    if (isa_brace(c))
    {
      tokens.push(258)
      c = nextc()
      continue
    }
    
    if (c === $dot)
    {
      tokens.push(259)
      c = nextc()
      continue
    }
    
    if (c === $sem)
    {
      tokens.push(260)
      c = nextc()
      continue
    }
    
    if (c === $com)
    {
      tokens.push(261)
      c = nextc()
      continue
    }
    
    if (c === -1)
      break
    
    // unknown symbol
    tokens.push(0)
    c = nextc()
  }
  
  return tokens.length + values.length
}




function code_by_code_unreadable (text)
{
  var lastPos = text.length - 1
  var pos = -1
  
  var tokens = [],
      values = []
  
  var c = (pos >= lastPos ? -1 : text.charCodeAt(++pos))
  for (;;)
  {
    if ((97 <= c && c <= 122) || (65 <= c && c <= 90) || c === 95)
    {
      var start = pos // of the c
      while ((c = (pos >= lastPos ? -1 : text.charCodeAt(++pos))), ((97 <= c && c <= 122) || (65 <= c && c <= 90) || (48 <= c && c <= 57) || c === 95));
      if (c === 63)
        c = (pos >= lastPos ? -1 : text.charCodeAt(++pos))
      tokens.push(257)
      values.push(text.substring(start, pos))
      // c is new
      continue
    }
    
    if (c === 32 || c === 13 || c === 10 || c === 9)
    {
      while ((c = (pos >= lastPos ? -1 : text.charCodeAt(++pos))), (c === 32 || c === 13 || c === 10 || c === 9));
      tokens.push(262)
      // c is new
      continue
    }
    
    if (c === 40 || c === 41 || c === 91 || c === 93 || c === 123 || c === 125)
    {
      tokens.push(258)
      c = (pos >= lastPos ? -1 : text.charCodeAt(++pos))
      continue
    }
    
    if (c === 46)
    {
      tokens.push(259)
      c = (pos >= lastPos ? -1 : text.charCodeAt(++pos))
      continue
    }
    
    if (c === 58)
    {
      tokens.push(260)
      c = (pos >= lastPos ? -1 : text.charCodeAt(++pos))
      continue
    }
    
    if (c === 44)
    {
      tokens.push(261)
      c = (pos >= lastPos ? -1 : text.charCodeAt(++pos))
      continue
    }
    
    if (c === -1)
      break
    
    // unknown symbol
    tokens.push(0)
    c = (pos >= lastPos ? -1 : text.charCodeAt(++pos))
  }
  
  return tokens.length + values.length
}



function simple_hash (text)
{
  var length = text.length
  
  var a = 0, b = 0, c = 0, d = 0
  var pos = -1
  var end = ((length >> 2) << 2) - 4
  while (pos < end)
  {
    var code = text.charCodeAt(++pos)
    // seen here http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
    a = ((a << 2) - a) + code
    
    var code = text.charCodeAt(++pos)
    b = ((b << 2) - b) + code
    
    var code = text.charCodeAt(++pos)
    c = ((c << 2) - c) + code
    
    var code = text.charCodeAt(++pos)
    d = ((d << 2) - d) + code
  }
  
  length--
  while (pos < length)
  {
    var code = text.charCodeAt(++pos)
    a = ((a << 2) - a) + code
  }
  
  var hash =  length.toString(36)
       + Math.abs(a).toString(36)
       + Math.abs(b).toString(36)
       + Math.abs(c).toString(36)
       + Math.abs(d).toString(36)
  
  return hash == '8kpney4e37f46sbkn8p2ipw360t29q8xqqn'
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
measure(regexps_on_position, repeat)
measure(char_by_char, repeat)
measure(code_by_code, repeat)
measure(code_by_code_unreadable, repeat)
measure(simple_hash, repeat)


})();