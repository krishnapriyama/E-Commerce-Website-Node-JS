var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
const { ObjectId, Admin } = require('mongodb')

module.exports = {
   doAdminLogin: (adminData) => {
      return new Promise(async (resolve, reject) => {
         let loginStatus = false
         let response = {}
         let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ username: adminData.username })
         if (admin) {
            console.log(admin);
            bcrypt.compare(adminData.password, admin.password).then((status) => {
               if (status) {
                  console.log("Login Success");
                  response.admin = admin
                  response.status = true
                  resolve(response)
               } else {
                  console.log("Login Falied");
                  resolve({ status: false })
               }
            })
         } else {
            console.log("Login Failed");
            resolve({ status: false })
         }
      })
   }
}