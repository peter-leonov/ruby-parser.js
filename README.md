/**
 * Communication interface between the scanner and the Bison-generated
 * parser <tt>]b4_parser_class_name[</tt>.
 */
public interface Lexer {
  ]b4_locations_if([[/**
   * Method to retrieve the beginning position of the last scanned token.
   * @@return the position at which the last scanned token starts.  */
  ]b4_position_type[ getStartPos ();

  /**
   * Method to retrieve the ending position of the last scanned token.
   * @@return the first position beyond the last scanned token.  */
  ]b4_position_type[ getEndPos ();]])[

  /**
   * Method to retrieve the semantic value of the last scanned token.
   * @@return the semantic value of the last scanned token.  */
  ]b4_yystype[ getLVal ();

  /**
   * Entry point for the scanner.  Returns the token identifier corresponding
   * to the next token and prepares to return the semantic value
   * ]b4_locations_if([and beginning/ending positions ])[of the token.
   * @@return the token identifier corresponding to the next token. */
  int yylex () ]b4_maybe_throws([b4_lex_throws])[;

  /**
   * Entry point for error reporting.  Emits an error
   * ]b4_locations_if([referring to the given location ])[in a user-defined way.
   *
   * ]b4_locations_if([[@@param loc The location of the element to which the
   *                error message is related]])[
   * @@param s The string for the error message.  */
   void yyerror (]b4_locations_if([b4_location_type[ loc, ]])[String s);]
}













b4_locations_if([[
/**
* A class defining a pair of positions.  Positions, defined by the
* <code>]b4_position_type[</code> class, denote a point in the input.
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
]])
