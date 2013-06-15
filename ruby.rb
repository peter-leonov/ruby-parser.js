# p "#{<<AEND}, #{<<BEND}".length
# a content
# AEND
# b content
# BEND

<<AAA + <<BBB + "
a content
AAA
b content
#{<<CCC
c content
CCC
}
#{<<DDD
c content
DDD
}
BBB


string"

# puts ?\
