require 'v8'
# require 'oj'

class ParserJS
  @@js = nil
  
  def load_parser
    return true if @@js
    
    @@js = V8::Context.new

    # for error logging and debugging
    @@js["print"] = lambda { |this, *msg| puts(msg.join(' ')) }
    @@js["write"] = lambda { |this, *msg| print(msg.join(' ')) }

    # allow module to export itself
    @@js["write"] = lambda { |this, *msg| print(msg.join(' ')) }
    @@js.eval("global = this;")

    @@js.load('/www/parser/parse.js')
  end

  def initialize
    load_parser
    
    @parser = @@js.eval('new RubyParser()')
  end
  
  def parse source
    @parser.toJSON(source)
  end
  
  def declare var
    @parser.declareVar(var)
  end
  
  def filename= name
    @parser.setFilename(name)
  end
end
