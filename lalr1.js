# JavaScript skeleton for Bison -*- autoconf -*-

# Copyright (C) 2013 Free Software Foundation, Inc.

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

m4_include([./javascript.m4])

b4_defines_if([b4_fatal([%s: %%defines does not make sense in JavaScript], [b4_skeleton])])
m4_ifval(m4_defn([b4_symbol_destructors]),
        [b4_fatal([%s: %%destructor does not make sense in JavaScript], [b4_skeleton])],
        [])

b4_output_begin([b4_parser_file_name])
b4_copyright([Skeleton implementation for Bison LALR(1) parsers in JavaScript],
             [2007-2013])

b4_percent_define_ifdef([package], [package b4_percent_define_get([package]);
])
[/* First part of user declarations.  */
]b4_pre_prologue[
]b4_percent_code_get([[imports]])[
/**
 * A Bison parser, automatically generated from <tt>]m4_bpatsubst(b4_file_name, [^"\(.*\)"$], [\1])[</tt>.
 *
 * @@author LALR (1) parser skeleton written by Paolo Bonzini.
 */




/**
* A class defining a pair of positions.  Positions, defined by the
* <code>Position</code> class, denote a point in the input.
* Locations represent a part of the input through the beginning
* and ending positions.  */
function Location (begin, end) {
  /** The first, inclusive, position in the range.  */
  this.begin = begin;
  this.end = end;
}

Location.prototype.toString = function () {
  if (this.begin === this.end)
    return "" + begin;

  return this.begin + "-" + this.end;
}


function YYStack ()
{
  var stateStack = [];
  var locStack = [];
  var valueStack = [];

  this.push = function push (state, value, location)
  {
    stateStack.push(state);
    locStack.push(location);
    valueStack.push(value);
  }

  this.pop = function pop (num)
  {
    if (num <= 0)
      return;

    valueStack.length -= num;
    locStack.length -= num;
    stateStack.length -= num; // TODO: original code lacks this line
  }

  this.stateAt = function stateAt (i)
  {
    return stateStack[stateStack.length - i];
  }

  this.locationAt = function locationAt (i)
  {
    return locStack[locStack.length - i];
  }

  this.valueAt = function valueAt (i)
  {
    return valueStack[valueStack.length - i];
  }

  // Print the state stack on the debug stream.
  this.print = function print ()
  {
    console.log("Stack now");

    for (var i = 0; i <= stateStack.length; i++)
    {
      console.log(' ' + stateStack[i]);
    }
  }
  
  this.locationFromNthItemToCurrent = function locationFromNthItemToCurrent (n)
  {
    if (n > 0)
      return new Location(locationAt(n-1).begin, locationAt(0).end);
    
    var end = locationAt(0).end
    return new Location(end, end);
  }
}

// Instantiates the Bison-generated parser.
function YYParser (yylexer)
{
  // The scanner that will supply tokens to the parser.
  this.yylexer = yylexer;




  /** True if verbose error messages are enabled.  */
  var errorVerbose = ]b4_flag_value([error_verbose])[;

  /** Token returned by the scanner to signal the end of its input.  */
  var EOF = 0;

  ]b4_token_enums(b4_tokens)[

  











  var yydebug = false;



  function yyerror (location, message)
  {
    yylexer.yyerror(location, message);
  }

  






  function yycdebug (message)
  {
    if (yydebug)
      console.log(message);
  }



  /**
   * Returned by a Bison action in order to stop the parsing process and
   * return success (<tt>true</tt>).  */
  var YYACCEPT = 0;

  /**
   * Returned by a Bison action in order to stop the parsing process and
   * return failure (<tt>false</tt>).  */
  var YYABORT = 1;

  /**
   * Returned by a Bison action in order to start error recovery without
   * printing an error message.  */
  var YYERROR = 2;

  // Internal return codes that are not supported for user semantic
  // actions.
  var YYERRLAB = 3;
  var YYNEWSTATE = 4;
  var YYDEFAULT = 5;
  var YYREDUCE = 6;
  var YYERRLAB1 = 7;
  var YYRETURN = 8;

  var yyntokens_ = ]b4_tokens_number[;
  
  var yyerrstatus_ = 0;
  /**
   * Return whether error recovery is being done.  In this state, the parser
   * reads token until it reaches a known state, and then restarts normal
   * operation.  */
  function recovering ()
  {
    return yyerrstatus_ == 0;
  }
  
  var actionsTable =
  {
    ]b4_user_actions[
    'terminator': function noop (){} /* comma terminator, needs to be avoided */
  }


  function yyaction (yyn, yystack, yylen) // int yyn, YYStack yystack, int yylen
  {
    var yyloc = yystack.locationFromNthItemToCurrent(yylen);

    /* If YYLEN is nonzero, implement the default value of the action:
       `$$ = $1'.  Otherwise, use the top of the stack.

       Otherwise, the following line sets YYVAL to garbage.
       This behavior is undocumented and Bison
       users should not rely upon it.  */
    var yyval;
    if (yylen > 0)
      yyval = yystack.valueAt(yylen - 1);
    else
      yyval = yystack.valueAt(0);

    yy_reduce_print(yyn, yystack);  // TODO: step into

    var actionClosure = actionsTable[yyn]
    if (actionClosure)
      actionClosure()

    yy_symbol_print("-> $$ =", yyr1_[yyn], yyval, yyloc); // TODO: step into

    yystack.pop(yylen);
    yylen = 0;

    // Shift the result of the reduction.
    yyn = yyr1_[yyn];
    var yystate = yypgoto_[yyn - yyntokens_] + yystack.stateAt(0);
    if (0 <= yystate && yystate <= yylast_ && yycheck_[yystate] == yystack.stateAt(0))
      yystate = yytable_[yystate];
    else
      yystate = yydefgoto_[yyn - yyntokens_];

    yystack.push(yystate, yyval, yyloc);
    return YYNEWSTATE;
  }

  /* Return YYSTR after stripping away unnecessary quotes and
     backslashes, so that it's suitable for yyerror.  The heuristic is
     that double-quoting is unnecessary unless the string contains an
     apostrophe, a comma, or backslash (other than backslash-backslash).
     YYSTR is taken from yytname.  */
  function yytnamerr_ (yystr)
  {
    if (yystr[0] == '"')
    {
      var yyr = '';
      strip_quotes:
      for (var i = 1; i < yystr.length; i++)
      {
        switch (yystr[i])
        {
          case '\'':
          case ',':
            break strip_quotes;

          case '\\':
            if (yystr[++i] != '\\')
              break strip_quotes;
              // Fall through.

          case '"':
            return yyr;

          default:
            yyr += yystr[i];
            break;
        }
      }
    }
    else if (yystr == "$end")
      return "end of input";

    return yystr;
  }

  /*--------------------------------.
  | Print this symbol on YYOUTPUT.  |
  `--------------------------------*/

  private void yy_symbol_print (String s, int yytype,
        yyvaluep]dnl
				 , Object yylocationp[)
  {
    if (yydebug)
    yycdebug (s + (yytype < yyntokens_ ? " token " : " nterm ")
	      + yytname_[yytype] + " ("]
	      + yylocationp + ": "[
	      + (yyvaluep == null ? "(null)" : yyvaluep.toString ()) + ")");
  }

  /**
   * Parse input from the scanner that was specified at object construction
   * time.  Return whether the end of the input was reached successfully.
   *
   * @@return <tt>true</tt> if the parsing succeeds.  Note that this does not
   *          imply that there were no syntax errors.
   */
  public boolean parse ()][
  {
    /// Lookahead and lookahead in internal form.
    int yychar = yyempty_;
    int yytoken = 0;

    /* State.  */
    int yyn = 0;
    int yylen = 0;
    int yystate = 0;

    var yystack = new YYStack();

    /* Error handling.  */
    int yynerrs_ = 0;
    ]/// The location where the error started.
    Location yyerrloc = null;

    /// Location of the lookahead.
    Location yylloc = new Location (null, null);

    /// @@$.
    Location yyloc;

    /// Semantic value of the lookahead.
    var yylval = null;

    yycdebug ("Starting parse\n");
    yyerrstatus_ = 0;

m4_ifdef([b4_initial_action], [
b4_dollar_pushdef([yylval], [], [yylloc])dnl
/* User initialization code.  */
b4_user_initial_action
b4_dollar_popdef])[]dnl

  [  /* Initialize the stack.  */
    yystack.push (yystate, yylval], yylloc[);

    int label = YYNEWSTATE;
    for (;;)
      switch (label)
      {
        /* New state.  Unlike in the C/C++ skeletons, the state is already
	   pushed when we come here.  */
      case YYNEWSTATE:
        yycdebug ("Entering state " + yystate + "\n");
        if (yydebug)
          yystack.print (yyDebugStream);

        /* Accept?  */
        if (yystate == yyfinal_)
          return true;

        /* Take a decision.  First try without lookahead.  */
        yyn = yypact_[yystate];
        if (yy_pact_value_is_default_ (yyn))
          {
            label = YYDEFAULT;
	    break;
          }

        // Read a lookahead token.
        if (yychar == yyempty_)
        {
          yycdebug("Reading a token: ");
          yychar = yylexer.yylex();

          yylloc = new Location(yylexer.getStartPos(), yylexer.getEndPos());
          yylval = yylexer.getLVal ();
        }


        /* Convert token to internal form.  */
        if (yychar <= EOF)
          {
	    yychar = yytoken = EOF;
	    yycdebug ("Now at end of input.\n");
          }
        else
          {
	    yytoken = yytranslate_ (yychar);
	    yy_symbol_print ("Next token is", yytoken,
			     yylval], yylloc[);
          }

        /* If the proper action on seeing token YYTOKEN is to reduce or to
           detect an error, take that action.  */
        yyn += yytoken;
        if (yyn < 0 || yylast_ < yyn || yycheck_[yyn] != yytoken)
          label = YYDEFAULT;

        /* <= 0 means reduce or error.  */
        else if ((yyn = yytable_[yyn]) <= 0)
          {
	    if (yy_table_value_is_error_ (yyn))
	      label = YYERRLAB;
	    else
	      {
	        yyn = -yyn;
	        label = YYREDUCE;
	      }
          }

        else
          {
            /* Shift the lookahead token.  */
	    yy_symbol_print ("Shifting", yytoken,
			     yylval], yylloc[);

            /* Discard the token being shifted.  */
            yychar = yyempty_;

            /* Count tokens shifted since error; after three, turn off error
               status.  */
            if (yyerrstatus_ > 0)
              --yyerrstatus_;

            yystate = yyn;
            yystack.push(yystate, yylval], yylloc[);
            label = YYNEWSTATE;
          }
        break;

      /*-----------------------------------------------------------.
      | yydefault -- do the default action for the current state.  |
      `-----------------------------------------------------------*/
      case YYDEFAULT:
        yyn = yydefact_[yystate];
        if (yyn == 0)
          label = YYERRLAB;
        else
          label = YYREDUCE;
        break;

      /*-----------------------------.
      | yyreduce -- Do a reduction.  |
      `-----------------------------*/
      case YYREDUCE:
        yylen = yyr2_[yyn];
        label = yyaction (yyn, yystack, yylen);
	yystate = yystack.stateAt (0);
        break;

      /*------------------------------------.
      | yyerrlab -- here on detecting error |
      `------------------------------------*/
      case YYERRLAB:
        /* If not already recovering from an error, report this error.  */
        if (yyerrstatus_ == 0)
          {
            ++yynerrs_;
            if (yychar == yyempty_)
              yytoken = yyempty_;
            yyerror (]yylloc, [yysyntax_error (yystate, yytoken));
          }

        ]yyerrloc = yylloc;[
        if (yyerrstatus_ == 3)
          {
	    /* If just tried and failed to reuse lookahead token after an
	     error, discard it.  */

	    if (yychar <= EOF)
	      {
	      /* Return failure if at end of input.  */
	      if (yychar == EOF)
	        return false;
	      }
	    else
	      yychar = yyempty_;
          }

        /* Else will try to reuse lookahead token after shifting the error
           token.  */
        label = YYERRLAB1;
        break;

      /*---------------------------------------------------.
      | errorlab -- error raised explicitly by YYERROR.  |
      `---------------------------------------------------*/
      case YYERROR:

        ]yyerrloc = yystack.locationAt (yylen - 1);[
        /* Do not reclaim the symbols of the rule which action triggered
           this YYERROR.  */
        yystack.pop (yylen);
        yylen = 0;
        yystate = yystack.stateAt (0);
        label = YYERRLAB1;
        break;

      /*-------------------------------------------------------------.
      | yyerrlab1 -- common code for both syntax error and YYERROR.  |
      `-------------------------------------------------------------*/
      case YYERRLAB1:
        yyerrstatus_ = 3;	/* Each real token shifted decrements this.  */

        for (;;)
          {
	    yyn = yypact_[yystate];
	    if (!yy_pact_value_is_default_ (yyn))
	      {
	        yyn += yyterror_;
	        if (0 <= yyn && yyn <= yylast_ && yycheck_[yyn] == yyterror_)
	          {
	            yyn = yytable_[yyn];
	            if (0 < yyn)
		      break;
	          }
	      }

	    /* Pop the current state because it cannot handle the error token.  */
	    if (yystack.stateStack.length == 0)
	      return false;

	    ]yyerrloc = yystack.locationAt (0);[
	    yystack.pop (1);
	    yystate = yystack.stateAt (0);
	    if (yydebug)
	      yystack.print (yyDebugStream);
          }

	]
	/* Muck with the stack to setup for yylloc.  */
	yystack.push (0, null, yylloc);
	yystack.push (0, null, yyerrloc);
        yyloc = yylloc (yystack, 2);
	yystack.pop (2);[

        /* Shift the error token.  */
        yy_symbol_print ("Shifting", yystos_[yyn],
			 yylval], yyloc[);

        yystate = yyn;
	yystack.push (yyn, yylval], yyloc[);
        label = YYNEWSTATE;
        break;

        /* Accept.  */
      case YYACCEPT:
        return true;

        /* Abort.  */
      case YYABORT:
        return false;
      }
  }

  // Generate an error message.
  private String yysyntax_error (int yystate, int tok)
  {
    if (errorVerbose)
      {
        /* There are many possibilities here to consider:
           - Assume YYFAIL is not used.  It's too flawed to consider.
             See
             <http://lists.gnu.org/archive/html/bison-patches/2009-12/msg00024.html>
             for details.  YYERROR is fine as it does not invoke this
             function.
           - If this state is a consistent state with a default action,
             then the only way this function was invoked is if the
             default action is an error action.  In that case, don't
             check for expected tokens because there are none.
           - The only way there can be no lookahead present (in tok) is
             if this state is a consistent state with a default action.
             Thus, detecting the absence of a lookahead is sufficient to
             determine that there is no unexpected or expected token to
             report.  In that case, just report a simple "syntax error".
           - Don't assume there isn't a lookahead just because this
             state is a consistent state with a default action.  There
             might have been a previous inconsistent state, consistent
             state with a non-default action, or user semantic action
             that manipulated yychar.  (However, yychar is currently out
             of scope during semantic actions.)
           - Of course, the expected token list depends on states to
             have correct lookahead information, and it depends on the
             parser not to perform extra reductions after fetching a
             lookahead from the scanner and before detecting a syntax
             error.  Thus, state merging (from LALR or IELR) and default
             reductions corrupt the expected token list.  However, the
             list is correct for canonical LR with one exception: it
             will still contain any token that will not be accepted due
             to an error action in a later state.
        */
        if (tok != yyempty_)
          {
            // FIXME: This method of building the message is not compatible
            // with internationalization.
            StringBuffer res =
              new StringBuffer ("syntax error, unexpected ");
            res.append(yytnamerr_(yytname_[tok]));
            int yyn = yypact_[yystate];
            if (!yy_pact_value_is_default_ (yyn))
              {
                /* Start YYX at -YYN if negative to avoid negative
                   indexes in YYCHECK.  In other words, skip the first
                   -YYN actions for this state because they are default
                   actions.  */
                int yyxbegin = yyn < 0 ? -yyn : 0;
                /* Stay within bounds of both yycheck and yytname.  */
                int yychecklim = yylast_ - yyn + 1;
                int yyxend = yychecklim < yyntokens_ ? yychecklim : yyntokens_;
                int count = 0;
                for (int x = yyxbegin; x < yyxend; ++x)
                  if (yycheck_[x + yyn] == x && x != yyterror_
                      && !yy_table_value_is_error_ (yytable_[x + yyn]))
                    ++count;
                if (count < 5)
                  {
                    count = 0;
                    for (int x = yyxbegin; x < yyxend; ++x)
                      if (yycheck_[x + yyn] == x && x != yyterror_
                          && !yy_table_value_is_error_ (yytable_[x + yyn]))
                        {
                          res.append (count++ == 0 ? ", expecting " : " or ");
                          res.append(yytnamerr_(yytname_[x]));
                        }
                  }
              }
            return res.toString ();
          }
      }

    return "syntax error";
  }

  /**
   * Whether the given <code>yypact_</code> value indicates a defaulted state.
   * @@param yyvalue   the value to check
   */
  private static boolean yy_pact_value_is_default_ (int yyvalue)
  {
    return yyvalue == yypact_ninf_;
  }

  /**
   * Whether the given <code>yytable_</code> value indicates a syntax error.
   * @@param yyvalue   the value to check
   */
  private static boolean yy_table_value_is_error_ (int yyvalue)
  {
    return yyvalue == yytable_ninf_;
  }

  /* YYPACT[STATE-NUM] -- Index in YYTABLE of the portion describing
     STATE-NUM.  */
  private static final ]b4_int_type_for([b4_pact])[ yypact_ninf_ = ]b4_pact_ninf[;
  private static final ]b4_int_type_for([b4_pact])[ yypact_[] =
  {
    ]b4_pact[
  };

  /* YYDEFACT[S] -- default reduction number in state S.  Performed when
     YYTABLE doesn't specify something else to do.  Zero means the
     default is an error.  */
  private static final ]b4_int_type_for([b4_defact])[ yydefact_[] =
  {
    ]b4_defact[
  };

  /* YYPGOTO[NTERM-NUM].  */
  var yypgoto_ =
  {
    ]b4_pgoto[
  };

  /* YYDEFGOTO[NTERM-NUM].  */
  private static final ]b4_int_type_for([b4_defgoto])[
  yydefgoto_[] =
  {
    ]b4_defgoto[
  };

  /* YYTABLE[YYPACT[STATE-NUM]].  What to do in state STATE-NUM.  If
     positive, shift that token.  If negative, reduce the rule which
     number is the opposite.  If yytable_NINF_, syntax error.  */
  private static final ]b4_int_type_for([b4_table])[ yytable_ninf_ = ]b4_table_ninf[;
  private static final ]b4_int_type_for([b4_table])[
  yytable_[] =
  {
    ]b4_table[
  };

  /* YYCHECK.  */
  private static final ]b4_int_type_for([b4_check])[
  yycheck_[] =
  {
    ]b4_check[
  };

  /* STOS_[STATE-NUM] -- The (internal number of the) accessing
     symbol of state STATE-NUM.  */
  private static final ]b4_int_type_for([b4_stos])[
  yystos_[] =
  {
    ]b4_stos[
  };

  /* TOKEN_NUMBER_[YYLEX-NUM] -- Internal symbol number corresponding
     to YYLEX-NUM.  */
  private static final ]b4_int_type_for([b4_toknum])[
  yytoken_number_[] =
  {
    ]b4_toknum[
  };

  /* YYR1[YYN] -- Symbol number of symbol that rule YYN derives.  */
  private static final ]b4_int_type_for([b4_r1])[
  yyr1_[] =
  {
    ]b4_r1[
  };

  /* YYR2[YYN] -- Number of symbols composing right hand side of rule YYN.  */
  private static final ]b4_int_type_for([b4_r2])[
  yyr2_[] =
  {
    ]b4_r2[
  };

  /* YYTNAME[SYMBOL-NUM] -- String name of the symbol SYMBOL-NUM.
     First, the terminals, then, starting at \a yyntokens_, nonterminals.  */
  private static final String yytname_[] =
  {
    ]b4_tname[
  };

  /* YYRHS -- A `-1'-separated list of the rules' RHS.  */
  private static final ]b4_int_type_for([b4_rhs])[ yyrhs_[] =
  {
    ]b4_rhs[
  };

  /* YYPRHS[YYN] -- Index of the first RHS symbol of rule number YYN in
     YYRHS.  */
  private static final ]b4_int_type_for([b4_prhs])[ yyprhs_[] =
  {
    ]b4_prhs[
  };

  /* YYRLINE[YYN] -- Source line where rule number YYN was defined.  */
  private static final ]b4_int_type_for([b4_rline])[ yyrline_[] =
  {
    ]b4_rline[
  };

  // Report on the debug stream that the rule yyrule is going to be reduced.
  private void yy_reduce_print (int yyrule, YYStack yystack)
  {
    if (!yydebug)
      return;

    int yylno = yyrline_[yyrule];
    int yynrhs = yyr2_[yyrule];
    /* Print the symbols being reduced, and their result.  */
    yycdebug ("Reducing stack by rule " + (yyrule - 1)
	      + " (line " + yylno + "), ");

    /* The symbols being reduced.  */
    for (int yyi = 0; yyi < yynrhs; yyi++)
      yy_symbol_print ("   $" + (yyi + 1) + " =",
		       yyrhs_[yyprhs_[yyrule] + yyi],
		       ]b4_rhs_value(yynrhs, yyi + 1),
		       b4_rhs_location(yynrhs, yyi + 1)[);
  }

  /* YYTRANSLATE(YYLEX) -- Bison symbol number corresponding to YYLEX.  */
  private static final ]b4_int_type_for([b4_translate])[ yytranslate_table_[] =
  {
    ]b4_translate[
  };

  private static final ]b4_int_type_for([b4_translate])[ yytranslate_ (int t)
  {
    if (t >= 0 && t <= yyuser_token_number_max_)
      return yytranslate_table_[t];
    else
      return yyundef_token_;
  }

  private static final int yylast_ = ]b4_last[;
  private static final int yynnts_ = ]b4_nterms_number[;
  private static final int yyempty_ = -2;
  private static final int yyfinal_ = ]b4_final_state_number[;
  private static final int yyterror_ = 1;
  private static final int yyerrcode_ = 256;

  private static final int yyuser_token_number_max_ = ]b4_user_token_number_max[;
  private static final int yyundef_token_ = ]b4_undef_token_number[;

]/* User implementation code.  */
b4_percent_code_get[]dnl

}

// Version number for the Bison executable that generated this parser.
YYParser.bisonVersion = "b4_version";

// Name of the skeleton that generated this parser.
YYParser.bisonSkeleton = b4_skeleton;

b4_epilogue
b4_output_end()
