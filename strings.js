;(function(){

var text = read('text.txt')

;(function(){

var rex = /^([a-zA-Z0-9_]+)|^([\(\)\[\]\{\}])|^([\.\:])|^(\s+)|^(.)/

var begin = new Date()

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

var end = new Date()
print('time:', end - begin)
print('tokens:', tokens.length)
print('exact:', tokens.join('') == text)

})();



;(function(){

var rex = /([a-zA-Z0-9_]+)|([\(\)\[\]\{\}])|([\.\:])|(\s+)|()/g

var begin = new Date()

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

var end = new Date()
print('time:', end - begin)
print('tokens:', tokens.length)
print('exact:', tokens.join('') == text)

})();


;(function(){

var begin = new Date()

var tokens = []
var substr = text
for (var i = 0, il = substr.length; i < il; i++)
  tokens.push(substr[i])

var end = new Date()
print('time:', end - begin)
print('tokens:', tokens.length)
print('exact:', tokens.join('') == text)

})();






})();