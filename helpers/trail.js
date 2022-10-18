const bcrypt = require('bcrypt')
async function name() {
   var userData = await bcrypt.hash("123admin", 10)
   console.log(userData);
}

name()