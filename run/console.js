this.global = this;
this.puts = print;
if (!this.write && this.putstr)
  this.write = this.putstr;
