function inspect (v)
{
  return (v && v.inspect) ? v.inspect() : JSON.stringify(v);
}

function Node (type, children)
{
  this.type = type;
  this.children = children;
}
Node.prototype.push = function (child)
{
  this.children.push(child);
}
Node.prototype.slice = function ()
{
  this.children.slice();
}
Node.prototype.inspect = function ()
{
  var children = this.children;
  if (children == null)
  {
    return this.type;
  }
  
  var parts = [];
  for (var i = 0, il = children.length; i < il; i++)
    parts[i] = inspect(children[i]);
  
  return this.type + '(' + parts.join(', ') + ')';
}

function n (type, children)
{
  return new Node(type, children);
}

function n0 (type)
{
  return new Node(type, null);
}


#if DEV
Array.prototype.inspect = function ()
{
  var parts = [];
  for (var i = 0, il = this.length; i < il; i++)
    parts[i] = inspect(this[i]);
  
  return '[' + parts.join(', ') + ']';
}
#endif DEV
