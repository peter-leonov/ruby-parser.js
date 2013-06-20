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

begin
  
  
end

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

# TODO: add to error reporting tests
# z = 067_
# z = 0678_10
# z = 07e5 # no to exponential octs
# z = 08
# z = 08888


puts {}.class

def returns(sexp)
  return returns s(:nil) unless sexp

  case sexp.first
  when :break, :next
    sexp
  when :yield
    sexp[0] = :returnable_yield
    sexp
  when :scope
    sexp[1] = returns sexp[1]
    sexp
  when :block
    if sexp.length > 1
      sexp[-1] = returns sexp[-1]
    else
      sexp << returns(s(:nil))
    end
    sexp
  when :when
    sexp[2] = returns(sexp[2])
    sexp
  when :rescue
    sexp[1] = returns sexp[1]
    sexp
  when :ensure
    sexp[1] = returns sexp[1]
    sexp
  when :while
    # sexp[2] = returns(sexp[2])
    sexp
  when :return
    sexp
  when :xstr
    sexp[1] = "return #{sexp[1]};" unless /return|;/ =~ sexp[1]
    sexp
  when :dxstr
    sexp[1] = "return #{sexp[1]}" unless /return|;|\n/ =~ sexp[1]
    sexp
  when :if
    sexp[2] = returns(sexp[2] || s(:nil))
    sexp[3] = returns(sexp[3] || s(:nil))
    sexp
  else
    s(:js_return, sexp).tap { |s|
      s.line = sexp.line
    }
  end
end

class AAA
  
  alias :subjectA :subjectB
  
def top(sexp, options = {})
  code = nil

  in_scope(:top) do
    indent {
      code = @indent + process(s(:scope, sexp), :stmt)
    }

    @scope.add_temp "self = __opal.top"
    @scope.add_temp "__scope = __opal"
    @scope.add_temp "nil = __opal.nil"
    @scope.add_temp "$mm = __opal.mm"
    @scope.add_temp "def = #{current_self}._klass.prototype" if @scope.defines_defn
    @helpers.keys.each { |h| @scope.add_temp "__#{h} = __opal.#{h}" }

    code = INDENT + @scope.to_vars + "\n" + code
  end

  "(function(__opal) {\n#{ code }\n})(Opal);\n"
end


def expression?(sexp)
  !STATEMENTS.include?(sexp.first)
end

end # class AAA

def a
  class B
  end
end

=begin
sdfasf)
asdf
=end