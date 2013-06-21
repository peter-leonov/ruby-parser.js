var text = read('tests/lexer/text.rb');
var begin = new Date()
parse(text)
print('parse: ' + (new Date() - begin))
