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





function code_by_code (text)
{
  var tokens = []
  try
  {
    code_by_code_body(text, tokens)
  }
  catch (e)
  {
    if (e != 'eof')
      throw e
  }
  return tokens
}
var rex = /([a-zA-Z0-9_]+)|([\(\)\[\]\{\}])|([\.\:])|(\s+)|()/g
function code_by_code_body (text, tokens)
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
  
  function isa_azAZ09_ (c)
  {
    return !!( // !! saves a bit in v8
      ($a <= c && c <= $z) ||
      ($A <= c && c <= $A) ||
      ($0 <= c && c <= $9) ||
      c == $_
    )
  }
  
  for (;;)
  {
    var c = nextc()
    
    if (isa_azAZ09_(c))
      tokens.push(String.fromCharCode(c))
  }
}






var bigText = read('text.txt')

function measure (f, count)
{
  print(f.name + '()')
  
  var begin = new Date()
  for (var i = 0; i < count; i++)
  {
    var tokens = f(bigText)
  }
  var end = new Date()
  
  print('  mean:', (end - begin) / count)
  print('  tokens:', tokens.length)
  print('  exact:', tokens.join('') == bigText)
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
var repeat = 100

// heavy
// var repeat = 1000; warmup()
// measure(regexps_on_position, repeat)
measure(code_by_code, repeat)


})();