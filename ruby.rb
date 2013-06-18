#!ruby
# encoding: utf-8

"#{<<AAA}, #{<<BBB}" + 2.to_s
a content
AAA
b content
BBB

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

0.i
1.i

x = 0
x = 5
x = 0.5e8
x = +0.5e8
x = 1e5

+x

# # TODO: add to error reporting tests
# x = +0.5e8_e
# x = +0.5e8e
# x = +0.5e8_.

x = 0e0
x = 0.5_0e1_0
x = 10_0.0_0e+0_0


y = 0x45
y = 0x4_5_0

# # TODO: add to error reporting tests
# y = 0x
# y = 0x_4_5_6
# y = 0x4_5_
# y = 0x4_5_.

z = 0_10
z = 0677_10
z = 08
z = 08888
z = 0678_10
# z = 067_
# z = 07e5 # no to exponential octs


=begin
sdfasf)
asdf
=end