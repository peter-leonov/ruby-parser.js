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
function yyinspect (v)
{
  return (v && v.yyinspect) ? v.yyinspect() : JSON.stringify(v);
}

function yyinspect_node (node)
{
  if (!node.length)
  {
    return node.type + '()';
  }
  
  var parts = [];
  for (var i = 0, il = node.length; i < il; i++)
    parts[i] = yyinspect(node[i]);
  
  return node.type + '(' + parts.join(', ') + ')';
}

Array.prototype.yyinspect = function ()
{
  // are we a node?
  if (this.type)
    return yyinspect_node(this);
  
  var parts = [];
  for (var i = 0, il = this.length; i < il; i++)
    parts[i] = yyinspect(this[i]);
  
  return '[' + parts.join(', ') + ']';
}
#endif DEV
