var rex = /^a/g

rex.lastIndex = 2
print(rex.exec('abacd'))
print(rex.lastIndex)