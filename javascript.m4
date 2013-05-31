                                                            -*- Autoconf -*-

# Java language support for Bison

# Copyright (C) 2007-2013 Free Software Foundation, Inc.

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# b4_comment(TEXT)
# ----------------
m4_define([b4_comment], [/* m4_bpatsubst([$1], [
], [
   ])  */])


# b4_flag_value(BOOLEAN-FLAG)
# ---------------------------
m4_define([b4_flag_value], [b4_flag_if([$1], [true], [false])])


## ------------ ##
## Data types.  ##
## ------------ ##

# needed in list terminations
m4_define([b4_null], [null])


## ------------------------- ##
## Assigning token numbers.  ##
## ------------------------- ##

# b4_token_enum(TOKEN-NAME, TOKEN-NUMBER)
# ---------------------------------------
# Output the definition of this token as an enum.
m4_define([b4_token_enum],
[  '$1': $2,
])


# b4_token_enums(LIST-OF-PAIRS-TOKEN-NAME-TOKEN-NUMBER)
# -----------------------------------------------------
# Output the definition of the tokens (if there are) as enums.
m4_define([b4_token_enums],
[m4_if([$#$1], [1], [],
[
var TOKENS = {
m4_map([b4_token_enum], [$@])])
  'terminator': 0 /* FIXME: comma terminator */
};
])

# b4-case(ID, CODE)
# -----------------
m4_define([b4_case], [  '$1': function ()
    $2,
])



## ----------------- ##
## Semantic Values.  ##
## ----------------- ##


# b4_lhs_value([TYPE])
# --------------------
# Expansion of $<TYPE>$.
m4_define([b4_lhs_value], [yyval])


# b4_rhs_value(RULE-LENGTH, NUM)
# --------------------------------------
# Expansion of $<TYPE>NUM, where the current rule has RULE-LENGTH
# symbols on RHS.
#
# In this simple implementation, %token and %type have class names
# between the angle brackets.
m4_define([b4_rhs_value], [(yystack.valueAt($1-($2)))])


# b4_rhs_location(RULE-LENGTH, NUM)
# ---------------------------------
# Expansion of @NUM, where the current rule has RULE-LENGTH symbols
# on RHS.
m4_define([b4_rhs_location],
[yystack.locationAt ($1-($2))])



m4_define([b4_remove_comma], [m4_ifval(m4_quote($1), [$1, ], [])m4_shift2($@)])



