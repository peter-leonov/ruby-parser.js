function n (type, children)
{
  children.type = type;
  // children.children = children;
  return children;
}

function n0 (type)
{
  var children = [];
  children.type = type;
  // children.children = children;
  return children;
}

function toPlain (node)
{
  if (!node || !node.type)
    return node;

  var ary = node.slice();
  ary.unshift(node.type);

  for (var i = 0, il = ary.length; i < il; i++)
    ary[i] = toPlain(ary[i]);

  return ary;
}

Builder.toPlain = toPlain;
Builder.createNode = n;


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
