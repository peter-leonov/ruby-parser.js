require 'parser/ruby20'

parser = Parser::Ruby20.new
parser.diagnostics.consumer = lambda do |diag|
  puts diag.render
end

buffer = Parser::Source::Buffer.new('ruby.rb')
buffer.source = File.read("ruby.rb")

p parser.parse(buffer)
