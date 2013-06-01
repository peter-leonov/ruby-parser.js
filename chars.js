var text = read('text.txt')


var b = new Date()
var count = 0
var $d = 100
for (var i = 0, il = text.length; i < il; i++)
  if (text.charCodeAt(i) > $d)
    count++

print('time:', new Date() - b)
if (count != 47783)
  print('wrong count:', count)



var b = new Date()
var count = 0
var chars = text.split('')
for (var i = 0, il = chars.length; i < il; i++)
  if (chars[i] > 'd')
    count++

print('time:', new Date() - b)
if (count != 47783)
  print('wrong count:', count)



var b = new Date()
var count = 0
for (var i = 0, il = chars.length; i < il; i++)
  if (text[i] > 'd')
    count++

print('time:', new Date() - b)
if (count != 47783)
  print('wrong count:', count)
