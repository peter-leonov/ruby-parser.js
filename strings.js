;(function(){

var text = read('text.txt')


function regexps_on_substrings ()
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


function regexps_on_position ()
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


function char_by_char ()
{
  var tokens = []
  var substr = text
  for (var i = 0, il = substr.length; i < il; i++)
    tokens.push(substr[i])

  return tokens
}


function code_by_code ()
{
  var tokens = []
  var substr = text
  for (var i = 0, il = substr.length; i < il; i++)
    tokens.push(substr.charCodeAt(i))

  return tokens
}





function measure (f, count)
{
  print(f.name + '()')
  var time = 0
  for (var i = 0; i < count; i++)
  {
    var begin = new Date()
    var tokens = f()
    var end = new Date()
    time += end - begin
  }
  
  print('  mean:', time / count)
  print('  tokens:', tokens.length)
  print('  exact:', tokens.join('') == text)
  print()
}

measure(regexps_on_substrings, 100)
measure(regexps_on_position, 100)
measure(char_by_char, 100)
measure(code_by_code, 100)


})();