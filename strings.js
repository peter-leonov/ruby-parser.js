;(function(){

var text = read('text.txt')

;(function(){

var rex = /^([a-zA-Z0-9_]+)|^([\(\)\[\]\{\}])|^([\.\:])|^(\s+)|^(.)/

var begin = new Date()

var pos = 0
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
  pos += nextIndex
  // print(pos)
  substr = substr.substr(nextIndex)
}

var end = new Date()
print('time:', end - begin)
print('tokens:', tokens.length)
print('exact:', tokens.join('') == text)

})();








})();