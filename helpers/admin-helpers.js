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
   },
   weekOrderCount: () => {
      return new Promise((resolve, reject) => {
         db.get().collection(collection.ORDER_COLLECTION).aggregate([

            {
               $match: {
                  Date: {
                     $gte: new Date(new Date() - 60 * 60 * 24 * 1000 * 7)
                  }
               }
            },
            {
               $unwind: '$products'
            },
            {
               $project: {
                  year: { $year: "$Date" },
                  month: { $month: "$Date" },
                  day: { $dayOfMonth: "$Date" },
                  dayOfWeek: { $dayOfWeek: "$Date" },
               }
            },
            {
               $group: {
                  _id: '$dayOfWeek',
                  count: { $sum: 1 },
                  detail: { $first: '$$ROOT' }
               }
            },
            {
               $sort: { detail: 1 }
            }
         ]).toArray().then((value) => {
            resolve(value)
            console.log(value);
         }).catch((err) => {
            reject(err)
         })
      })
   },

   MonthOrderCount: () => {
      return new Promise((resolve, reject) => {
         db.get().collection(collection.ORDER_COLLECTION).aggregate([

            {
               $match: {
                  Date: {
                     $gte: new Date(new Date() - 60 * 60 * 24 * 1000 * 30)
                  }
               }
            },
            {
               $unwind: '$products'
            },
            {
               $project: {
                  year: { $year: "$Date" },
                  month: { $month: "$Date" },
                  day: { $dayOfMonth: "$Date" },
                  dayOfWeek: { $dayOfWeek: "$Date" },
               }
            },
            {
               $group: {
                  _id: '$dayOfWeek',
                  count: { $sum: 1 },
                  detail: { $first: '$$ROOT' }
               }
            },
            {
               $sort: { detail: 1 }
            }
         ]).toArray().then((value) => {
            resolve(value)
            console.log(value);
         }).catch((err) => {
            reject(err)
         })
      })
   },
   YearOrderCount: () => {
      return new Promise((resolve, reject) => {
         db.get().collection(collection.ORDER_COLLECTION).aggregate([

            {
               $match: {
                  Date: {
                     $gte: new Date(new Date() - 60 * 60 * 24 * 1000 * 365)
                  }
               }
            },
            {
               $unwind: '$products'
            },
            {
               $project: {
                  year: { $year: "$Date" },
                  month: { $month: "$Date" },
                  day: { $dayOfMonth: "$Date" },
                  dayOfWeek: { $dayOfWeek: "$Date" },
               }
            },
            {
               $group: {
                  _id: '$dayOfWeek',
                  count: { $sum: 1 },
                  detail: { $first: '$$ROOT' }
               }
            },
            {
               $sort: { detail: 1 }
            }
         ]).toArray().then((value) => {
            resolve(value)
            console.log(value);
         }).catch((err) => {
            reject(err)
         })
      })
   },
   getallUserOrders: () => {
      return new Promise(async (resolve, reject) => {
         let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
         resolve(orders)
      })
   },
   getOrderProducts: (orderId) => {
      console.log(orderId);
      return new Promise(async (resolve, reject) => {
         let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
               $match: { _id: ObjectId(orderId) }
            },
            {
               $unwind: '$products'
            },
            {
               $lookup: {
                  from: collection.PRODUCT_COLLECTION,
                  localField: 'products.item',
                  foreignField: '_id',
                  as: 'items'
               }
            },
            {
               $unwind: '$items'
            }

         ]).toArray()
         resolve(orderItems)
console.log(orderItems,"orderItems");
      })
   }
}