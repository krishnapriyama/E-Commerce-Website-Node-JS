var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
const { ObjectId, Admin } = require('mongodb')
const { ChallengeList } = require('twilio/lib/rest/verify/v2/service/entity/challenge')

module.exports = {
   getAllusers: () => {
      return new Promise(async (resolve, reject) => {
         let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
         resolve(users)
      })
   },
   doSignup: (userData) => {
      userData.blocked = false
      return new Promise(async (resolve, reject) => {
         userData.password = await bcrypt.hash(userData.password, 10)
         db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
            resolve(data.insertedId)
         })
      })
   },
   doLogin: (userData) => {
      return new Promise(async (resolve, reject) => {
         let loginStatus = false
         let response = {}
         let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
         const blockerror = "You are Blocked! Please Contact Us"
         const passerror = "Password Incorrect"
         const emailerror = "Email Incorrect"
         if (user) {
            bcrypt.compare(userData.password, user.password).then((status) => {
               if (status) {
                  console.log(user.blocked);
                  console.log(user);
                  if (user.blocked) {

                     reject(blockerror)
                  } else {
                     console.log(user.blocked);
                     console.log(user);
                     console.log("Login Success");
                     response.user = user
                     response.status = true
                     resolve(response)
                  }
               } else {
                  console.log("Login Falied");
                  reject(passerror)
               }
            })
         } else {
            console.log("Login Failed");
            console.log(userData.email);
            reject(emailerror)
         }
      })
   },
   editUsers: (EditUsers) => {
      return new Promise(async (resolve, reject) => {
         let userslist = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(EditUsers) })
         resolve(userslist)
      })
   },
   updateUser: (userId, userDetails) => {
      return new Promise((resolve, reject) => {
         db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
            $set: {
               fname: userDetails.fname,
               email: userDetails.email,
               place: userDetails.place,
               mobile: userDetails.mobile

            }
         }).then((response) => {
            resolve()
         })
      })
   },
   deleteUser: (dataId) => {
      return new Promise((resolve, reject) => {
         db.get().collection(collection.USER_COLLECTION).remove({ _id: ObjectId(dataId) }).then((response) => {
            resolve(response)
         })
      })
   },
   addtocart: (productid, userid) => {
      let proObj = {
         item: ObjectId(productid),
         quantity: 1
      }
      console.log(userid);
      return new Promise(async (resolve, reject) => {
         let Usercart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userid) })
         if (Usercart) {
            let proExist = Usercart.products.findIndex(products => products.item == productid)
            if (proExist != -1) {
               db.get().collection(collection.CART_COLLECTION).updateOne({
                  user: ObjectId(userid), 'products.item': ObjectId(productid)
               }, {
                  $inc: { 'products.$.quantity': 1 }
               }
               ).then(() => {
                  resolve()
               })
            } else {
               db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userid) },
                  {
                     $push: { products: proObj }
                  }
               ).then((response) => {
                  resolve()
               })
            }
         } else {
            let cartObj = {
               user: ObjectId(userid),
               products: [proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
               resolve()
            })
         }
      })
   },
   getcartproducts: (userId) => {
      return new Promise(async (resolve, reject) => {
         console.log(userId,'fukffgifg');
         let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
               $match: { user: ObjectId(userId) }
            },
            {
               $unwind: '$products'
            },
            {
               $project: {
                  item: '$products.item',
                  quantity: '$products.quantity'
               }
            },
            {
               $lookup: {
                  from: collection.PRODUCT_COLLECTION,
                  localField: 'item',
                  foreignField: '_id',
                  as: 'product'
               }
            },
            {
               $project: {
                  item: 1,
                  quantity: 1,
                  product: { $arrayElemAt: ['$product', 0] }
               }
            }
         ]).toArray()
         resolve(cartItems)
      })
   },
   getcartCount: (userId) => {
      return new Promise(async (resolve, reject) => {
         console.log(userId,"id");
         let count = 0
         let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
         if (cart) {
            count = cart.products.length
         }
         resolve(count)
      })
   },
   changeproductquantity: (details) => {
      console.log(details.user[0]);

      let count = parseInt(details.count)
      console.log(count);
      let cartId = details.cart
      let productid = details.product
      let quantity = parseInt(details.quantity)
      return new Promise((resolve, reject) => {
         if (count == -1 && quantity == 1) {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(cartId) },
               {
                  $pull: { products: { item: ObjectId(productid) } }
               }
            ).then((response) => {
               resolve({ removeProduct: true })
            })
         } else {
            db.get().collection(collection.CART_COLLECTION).
               updateOne({ _id: ObjectId(cartId), 'products.item': ObjectId(productid) },
                  {
                     $inc: { 'products.$.quantity': count }
                  }
               ).then((response) => {
                  resolve({ response: true })
               })
         }
      })
   },
   getTotalamount: (userId) => {
      return new Promise(async (resolve, reject) => {
         let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
               $match: { user: ObjectId(userId) }
            },
            {
               $unwind: '$products'
            },
            {
               $project: {
                  item: '$products.item',
                  quantity: '$products.quantity'
               }
            },
            {
               $lookup: {
                  from: collection.PRODUCT_COLLECTION,
                  localField: 'item',
                  foreignField: '_id',
                  as: 'product'
               }
            },
            {
               $project: {
                  item: 1,
                  quantity: 1,
                  product: { $arrayElemAt: ['$product', 0] }
               }
            },
            {
               $group: {
                  _id: null,
                  total: { $sum: { $multiply: ["$quantity", "$product.price"] } }
               }
            }
         ]).toArray()
         if (total[0]) {
            resolve(total[0].total)
         } else {
            resolve('Cart is Empty')
         }

      })
   },
   removeCartProduct: (cartproduct) => {
      let { cartID, ProID } = cartproduct
      return new Promise((resolve, reject) => {
         db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(cartID) },
            {
               $pull: { products: { item: ObjectId(ProID) } },
            }

         ).then((response) => {
            resolve({ ProRemove: true })
         })
      })
   },
   blockUser: (userid) => {
      return new Promise((resolve, reject) => {
         db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userid) }, { $set: { blocked: true } }).then((response) => {
            resolve(response)
         })
      })
   },
   unblockUser: (userid) => {
      return new Promise((resolve, reject) => {
         db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userid) }, { $set: { blocked: false } }).then((response) => {
            resolve(response)
         })
      })
   },
   placeOrder: (order, products, totalPrice) => {
      return new Promise(async (resolve, reject) => {
         //console.log(order, products, totalPrice);
         let status = order['paymentMethod'] === 'cod' ? 'placed' : 'pending'
         let orderObj = {
            delivaryDetails: {
               mobile: order.mobile,
               address: order.address,
               pincode: order.pincode
            },
            userId: ObjectId(order.userId),
            paymentMethod: order['paymentMethod'],
            products: products,
            totalAmount: totalPrice,
            Date: new Date(),
            status: status,
            orderCancel: false
         }
         db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
            resolve()
         })
      })
   },
   getCartProductlist: (userId) => {
      return new Promise(async (resolve, reject) => {
         let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
         resolve(cart.products)
      })
   },
   getUserOrders: (userId) => {
      return new Promise(async (resolve, reject) => {
         let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray()
         resolve(orders)
      })
   },
   getOrderProducts: (orderId) => {
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
         console.log(orderItems, "fdgdzfg");
         resolve(orderItems)

      })
   },
   cancel_order: (orderId) => {
      return new Promise((resolve, reject) => {
         db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
            $set: {
               orderCancel: true,
               status: "ordered_cancelled"
            }
         }).then((response) => {
            resolve(response)
         }).catch((err)=>{
            console.log(err);
            reject(err)
         })
      })
   }

}



