"use strict";

;(function(){


function by_code (text)
{
  var count = 0
  var $d = 100
  for (var i = 0, il = text.length; i < il; i++)
    if (text.charCodeAt(i) > $d)
      count++
  
  return count
}


function by_char (text)
{
  var count = 0
  var $d = 'd'
  for (var i = 0, il = text.length; i < il; i++)
    if (text[i] > $d)
      count++
  
  return count
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
  print('  exact:', res)
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

var repeat = 100; warmup()
measure(by_code, repeat)
measure(by_char, repeat)


})();