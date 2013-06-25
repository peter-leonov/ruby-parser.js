require 'parser/ruby20'
p Parser::Ruby20.parse(File.read("ruby.rb"))