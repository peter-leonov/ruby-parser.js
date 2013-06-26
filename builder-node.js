function inspect (v)
{
  return (v && v.inspect) ? v.inspect() : JSON.stringify(v);
}

function Node (type, children)
{
  this.type = type;
  this.children = children;
}
Node.prototype.add = function (child)
{
  this.children.push(child);
}
Node.prototype.inspect = function ()
{
  var children = this.children;
  
  var parts = [];
  for (var i = 0, il = children.length; i < il; i++)
    parts[i] = inspect(children[i]);
  
  return this.type + '(' + parts.join(', ') + ')';
}

function n (type, children)
{
  return new Node(type, children);
}


function NodeEmpty (type)
{
  this.type = type;
}
NodeEmpty.prototype.inspect = function ()
{
  return this.type;
}

function n0 (type)
{
  return new NodeEmpty(type);
}


function array (ary)
{
  ary.inspect = array_inspect;
  ary.pusha = array_pusha;
  return ary;
}
function array_inspect ()
{
  var parts = [];
  for (var i = 0, il = this.length; i < il; i++)
    parts[i] = inspect(this[i]);
  
  return '[' + parts.join(', ') + ']';
}
function array_pusha (ary)
{
  Array_push.apply(this, ary);
}
