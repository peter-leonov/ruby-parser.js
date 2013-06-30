require 'parser/ruby20'
require 'oj'

module Parser
  module AST
    class Node < ::AST::Node
      def to_plain
        [
          @type.to_s,
          
          *children.map do |c|
            if c.is_a? Node
              c.to_plain
            elsif c.is_a? Symbol
              c.to_s
            else
              c
            end
          end
        ]
      end
    end
  end
end


parser = Parser::Ruby20.new
parser.diagnostics.consumer = lambda do |diag|
  puts diag.render
end

buffer = Parser::Source::Buffer.new('ruby.rb')
buffer.source = File.read("ruby.rb")

puts Oj.dump(parser.parse(buffer).to_plain)
