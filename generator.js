(function(){

// #define is_notop_id(id) ((id)>tLAST_OP_ID)
// #define is_local_id(id) (is_notop_id(id)&&((id)&ID_SCOPE_MASK)==ID_LOCAL)
// #define is_global_id(id) (is_notop_id(id)&&((id)&ID_SCOPE_MASK)==ID_GLOBAL)
// #define is_instance_id(id) (is_notop_id(id)&&((id)&ID_SCOPE_MASK)==ID_INSTANCE)
// #define is_attrset_id(id) (is_notop_id(id)&&((id)&ID_SCOPE_MASK)==ID_ATTRSET)
// #define is_const_id(id) (is_notop_id(id)&&((id)&ID_SCOPE_MASK)==ID_CONST)
// #define is_class_id(id) (is_notop_id(id)&&((id)&ID_SCOPE_MASK)==ID_CLASS)
// #define is_junk_id(id) (is_notop_id(id)&&((id)&ID_SCOPE_MASK)==ID_JUNK)
// #define id_type(id) (is_notop_id(id) ? (int)((id)&ID_SCOPE_MASK) : -1)
// 
// #define is_asgn_or_id(id) ((is_notop_id(id)) && \
//  (((id)&ID_SCOPE_MASK) == ID_GLOBAL || \
//   ((id)&ID_SCOPE_MASK) == ID_INSTANCE || \
//   ((id)&ID_SCOPE_MASK) == ID_CLASS))
// 
// lexer.is_local_id = is_local_id;
// static int
// dyna_in_block(struct parser_params *parser)
// {
//     return POINTER_P(lvtbl->vars) && lvtbl->vars->prev != DVARS_TOPSCOPE;
// }
// 
// #define dvar_defined_get(id) dvar_defined_gen(parser, (id), 1)
// #define dvar_defined(id) dvar_defined_gen(parser, (id), 0)
// 
// static int
// dvar_defined_gen(struct parser_params *parser, ID id, int get)
// {
//     struct vtable *vars, *args, *used;
//     int i;
// 
//     args = lvtbl->args;
//     vars = lvtbl->vars;
//     used = lvtbl->used;
// 
//     while (POINTER_P(vars)) {
//  if (vtable_included(args, id)) {
//      return 1;
//  }
//  if ((i = vtable_included(vars, id)) != 0) {
//      if (used) used->tbl[i-1] |= LVAR_USED;
//      return 1;
//  }
//  args = args->prev;
//  vars = vars->prev;
//  if (get) used = 0;
//  if (used) used = used->prev;
//     }
// 
//     if (vars == DVARS_INHERIT) {
//         return rb_dvar_defined(id);
//     }
// 
//     return 0;
// }
// 
// /* for parser */
// 
// int
// rb_dvar_defined(ID id)
// {
//     rb_thread_t *th = GET_THREAD();
//     rb_iseq_t *iseq;
//     if (th->base_block && (iseq = th->base_block->iseq)) {
//         while (iseq->type == ISEQ_TYPE_BLOCK ||
//                iseq->type == ISEQ_TYPE_RESCUE ||
//                iseq->type == ISEQ_TYPE_ENSURE ||
//                iseq->type == ISEQ_TYPE_EVAL ||
//                iseq->type == ISEQ_TYPE_MAIN
//                ) {
//             int i;
// 
//             for (i = 0; i < iseq->local_table_size; i++) {
//                 if (iseq->local_table[i] == id) {
//                     return 1;
//                 }
//             }
//             iseq = iseq->parent_iseq;
//         }
//     }
//     return 0;
// }
// 
// int
// rb_local_defined(ID id)
// {
//     rb_thread_t *th = GET_THREAD();
//     rb_iseq_t *iseq;
// 
//     if (th->base_block && th->base_block->iseq) {
//         int i;
//         iseq = th->base_block->iseq->local_iseq;
// 
//         for (i=0; i<iseq->local_table_size; i++) {
//             if (iseq->local_table[i] == id) {
//                 return 1;
//             }
//         }
//     }
//     return 0;
// }
// 
// int
// rb_parse_in_eval(void)
// {
//     return GET_THREAD()->parse_in_eval > 0;
// }
// 
// int
// rb_parse_in_main(void)
// {
//     return GET_THREAD()->parse_in_eval < 0;
// }
// 
// function lvar_defined (ident)
// {
//   // TODO :)
//   return (dyna_in_block() && dvar_defined_get(id)) || local_id(id);
// }



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