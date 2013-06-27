function inspect (v)
{
  return (v && v.inspect) ? v.inspect() : JSON.stringify(v);
}

function n (type, children)
{
  children.type = type;
  children.children = children;
  return children;
}

function n0 (type)
{
  var children = [];
  children.children = children;
  children.type = type;
  return children;
}


#if DEV
function inspect_node (node)
{
  if (!node.length)
  {
    return node.type;
  }
  
  var parts = [];
  for (var i = 0, il = node.length; i < il; i++)
    parts[i] = inspect(node[i]);
  
  return node.type + '(' + parts.join(', ') + ')';
}

Array.prototype.inspect = function ()
{
  // are we a node?
  if (this.type)
    return inspect_node(this);
  
  var parts = [];
  for (var i = 0, il = this.length; i < il; i++)
    parts[i] = inspect(this[i]);
  
  return '[' + parts.join(', ') + ']';
}
#endif DEV
