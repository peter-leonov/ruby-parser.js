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
