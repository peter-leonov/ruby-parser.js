(function(){

// 



function Generator ()
{
  this.lvtbl = null;
}

// just a constants to compare to
var DVARS_INHERIT = {},
    DVARS_TOPSCOPE = {};

function vtable_alloc (prev)
{
  var tbl =
  {
    prev: prev
  };
  
  return tbl;
}


Generator.prototype =
{

local_push: function (inherit_dvars)
{
  var local =
  {
    prev: this.lvtbl,
    args: vtable_alloc(0),
    vars: vtable_alloc(inherit_dvars ? DVARS_INHERIT : DVARS_TOPSCOPE),
    used: vtable_alloc(0)
  };
  this.lvtbl = local;
}

}

return Generator;

})();