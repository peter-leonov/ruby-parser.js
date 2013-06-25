function Node (type, children)
{
  this.type = type;
  this.children = children;
}
Node.prototype.inspect = function ()
{
  var pairs = [];
  for (var k in this)
  {
    if (k == 'type' || k == 'inspect' || k == 'line')
      continue;
    var v = this[k];
    v = (v && v.inspect) ? v.inspect() : JSON.stringify(v);
    pairs.push(k + ': ' + v);
  }
  
  return this.type + '(' + pairs.join(', ') + ')';
}
function n (type, children)
{
  return new Node(type, children);
}
function array (ary)
{
  ary.inspect = function () { return 'array['+this.length+']' } // TODO
  return ary;
}
