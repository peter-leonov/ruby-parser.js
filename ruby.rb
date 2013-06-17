#!ruby
# encoding: utf-8

# "#{<<AAA}, #{<<BBB}" + 2
# a content
# AAA
# b content
# BBB

<<AAA + <<BBB + "
a content
AAA
b content
#{<<CCC
c content
CCC
}
#{<<DDD
d content
DDD
}
BBB


string"

puts ?\

puts ?\x80 + "\x80"


# # TODO: add to error reporting tests
#   rex = /a\x0\123\\\cM\C-xaa/

x = 0.5e8
x = +0.5e8
x = 1e5

# # TODO: add to error reporting tests
# x = +0.5e8_e
# x = +0.5e8e
# x = +0.5e8_.


x = 0.5_0e1_000
x = 10_0.0_0e+0_0

=begin
sdfasf)
asdf
=end