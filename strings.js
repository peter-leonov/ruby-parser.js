;(function(){



function regexps_on_substrings (text)
{
  var rex = /^([a-zA-Z0-9_]+)|^([\(\)\[\]\{\}])|^([\.\:])|^(\s+)|^(.)/

  var tokens = []
  for (var substr = text;;)
  {
    var m = rex.exec(substr)
    if (m === null)
      break
    var token = m[0]
    // print(token)
    tokens.push(token)
  
    var nextIndex = token.length
    substr = substr.substr(nextIndex)
  }
  
  return tokens
}


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
  var tokens = []
  var substr = text
  for (var i = 0, il = substr.length; i < il; i++)
    tokens.push(substr[i])

  return tokens
}


function code_by_code (text)
{
  var tokens = []
  var substr = text
  for (var i = 0, il = substr.length; i < il; i++)
    tokens.push(substr.charCodeAt(i))

  return tokens
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

warmup()
measure(regexps_on_substrings, 100)
measure(regexps_on_position, 100)
measure(char_by_char, 100)
measure(code_by_code, 100)


})();