require 'v8'
# require 'oj'

class ParserJS

  def initialize
    @js = V8::Context.new

    # for error logging and debugging
    @js["print"] = lambda { |this, *msg| puts(msg.join(' ')) }
    @js["write"] = lambda { |this, *msg| print(msg.join(' ')) }

    # allow module to export itself
    @js["write"] = lambda { |this, *msg| print(msg.join(' ')) }
    @js.eval("global = this;")

    @js.load('/www/ruby/parser/parse.js')

    @js.eval <<-JS

    function parse (text)
    {
      var lexer = new YYLexer(text);
      lexer.filename = '(source)';
  
      var parser = new YYParser(lexer);
      parser.yydebug = 1;
      parser.yydebug_yylval = true;
      var ok = parser.parse();
      return {ok: ok, ast: parser.resulting_ast};
    }

    function to_plain (n)
    {
      if (!(n && n.type))
        return n;
    
      var ary = n.slice();
      ary.unshift(n.type);
  
      for (var i = 0, il = ary.length; i < il; i++)
        ary[i] = to_plain(ary[i]);
  
      return ary;
    }

    function give_me_json (ruby)
    {
      var res = parse(ruby);
      return JSON.stringify(to_plain(res.ast));
    }

    JS

    @give_me_json = @js.eval("give_me_json")
    @parse        = @js.eval("parse")
  end
  
  def to_json source
    @give_me_json.call(source)
  end
end

# puts ParserJS.new.to_json("1+2")
