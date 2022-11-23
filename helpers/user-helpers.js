var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
// const { response } = require('../app')
const { ObjectId, Admin } = require('mongodb')
const {
  ChallengeList,
} = require('twilio/lib/rest/verify/v2/service/entity/challenge')
const Razorpay = require('razorpay')
const paypal = require('paypal-rest-sdk')
const e = require('express')
const shortid = require('shortid')

var instance = new Razorpay({
  key_id: 'rzp_test_JqPjDeZbLpvY3e',
  key_secret: 'J5OUnWR9Bzigj9ausIn7TC6B',
})

paypal.configure({
  mode: 'sandbox', //sandbox or live
  client_id:
    'AbpKrkJjwekFEpH75Waps6LWMFSPw9B8zc7Txi5b9_y-p1DudBcS_-nynqqtwi1tFHcMJ6fN3uIVOLJY',
  client_secret:
    'EG1QABR2Hqy-_oNDjL01AaeT-DjDLrZyF58rXN3WysLptKdrlvLqSeoNU6FjTWC_gVVzI5N24rM7P0iq',
})

module.exports = {
  getAllusers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray()
      resolve(users)
    })
  },
  doSignup: (userData) => {
    userData.blocked = false
    userData.wallet = parseInt(0)
    userData.autoReferal = shortid.generate()
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10)
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.insertedId)
        })
    })
  },
  validReferal: (referal) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { autoReferal: referal },
          {
            $inc: {
              wallet: Number(50),
            },
          },
        )
        .then((response) => {
          resolve(response)
        })
    })
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false
      let response = {}
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email })
      const blockerror = 'You are Blocked! Please Contact Us'
      const passerror = 'Password Incorrect'
      const emailerror = 'Email Incorrect'
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            if (user.blocked) {
              reject(blockerror)
            } else {
              console.log('Login Success')
              response.user = user
              response.status = true
              resolve(response)
            }
          } else {
            console.log('Login Falied')
            reject(passerror)
          }
        })
      } else {
        console.log('Login Failed')
        reject(emailerror)
      }
    })
  },
  editUsers: (EditUsers) => {
    return new Promise(async (resolve, reject) => {
      let userslist = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(EditUsers) })
      resolve(userslist)
    })
  },
  updateUser: (userId, userDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: {
              fname: userDetails.fname,
              email: userDetails.email,
              place: userDetails.place,
              mobile: userDetails.mobile,
            },
          },
        )
        .then((response) => {
          resolve()
        })
    })
  },
  deleteUser: (dataId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .remove({ _id: ObjectId(dataId) })
        .then((response) => {
          resolve(response)
        })
    })
  },
  addtocart: (productid, userid) => {
    let proObj = {
      item: ObjectId(productid),
      quantity: 1,
    }
    return new Promise(async (resolve, reject) => {
      let Usercart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userid) })
      if (Usercart) {
        let proExist = Usercart.products.findIndex(
          (products) => products.item == productid,
        )
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              {
                user: ObjectId(userid),
                'products.item': ObjectId(productid),
              },
              {
                $inc: { 'products.$.quantity': 1 },
              },
            )
            .then(() => {
              resolve()
            })
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userid) },
              {
                $push: { products: proObj },
              },
            )
            .then((response) => {
              resolve()
            })
        }
      } else {
        let cartObj = {
          user: ObjectId(userid),
          products: [proObj],
        }
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve()
          })
      }
    })
  },

  addtowishlist: (productid, userid) => {
    return new Promise(async (resolve, reject) => {
      let exist = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ 'wishlist.item': ObjectId(productid) })
      if (!exist) {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: ObjectId(userid) },
            {
              $push: { wishlist: { item: ObjectId(productid) } },
            },
          )
          .then((response) => {
            resolve(response)
          })
          .catch((err) => {
            reject(err)
          })
      }
    })
  },
  viewwishlist: (userID) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectId(userID) },
          },
          {
            $unwind: {
              path: '$wishlist',
            },
          },
          {
            $lookup: {
              from: 'product',
              localField: 'wishlist.item',
              foreignField: '_id',
              as: 'result',
            },
          },
          {
            $unwind: {
              path: '$result',
            },
          },
          {
            $project: {
              result: 1,
            },
          },
          {
            $match: {
              'result.isActive': false,
            },
          },
        ])
        .toArray()
        .then((response) => {
          resolve(response)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  removewish: (ProID, userID) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          {
            _id: ObjectId(userID),
            'wishlist.item': ObjectId(ProID),
          },
          {
            $pull: { wishlist: { item: ObjectId(ProID) } },
          },
        )
        .then((response) => {
          resolve(response)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },

  contactus: (details, userid) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userid) },
          {
            $push: {
              Complaints: {
                name: details.name,
                phonenumber: details.phonenumber,
                email: details.email,
                need: details.need,
                status: 'pending',
                date: new Date().toGMTString(),
                message: details.message,
              },
            },
          },
        )
        .then((response) => {
          resolve(response)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },

  getcartproducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: {
              path: '$products',
            },
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity',
            },
          },
          {
            $lookup: {
              from: 'product',
              localField: 'item',
              foreignField: '_id',
              as: 'product',
            },
          },
          {
            $lookup: {
              from: 'category',
              localField: 'product.category',
              foreignField: 'category',
              as: 'discount',
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ['$product', 0],
              },
              discount: {
                $arrayElemAt: ['$discount', 0],
              },
              offer_Amount: {
                $subtract: [
                  {
                    $arrayElemAt: ['$product.price', 0],
                  },
                  {
                    $divide: [
                      {
                        $multiply: [
                          {
                            $arrayElemAt: ['$product.price', 0],
                          },
                          {
                            $arrayElemAt: ['$discount.offer', 0],
                          },
                        ],
                      },
                      100,
                    ],
                  },
                ],
              },
            },
          },
        ])
        .toArray()
      resolve(cartItems)
    })
  },
  checkoutdata: (cartData, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { user: ObjectId(userId) },
          {
            $set: {
              couponcode: cartData.couponcode,
              couponAmount: parseInt(cartData.couponAmount),
              offerAmount: parseInt(cartData.offerAmount),
              amounttopay: parseInt(cartData.amounttopay),
            },
          },
        )
        .then((response) => {
          resolve(response)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  getcartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) })
      if (cart) {
        count = cart.products.length
      }
      resolve(count)
    })
  }, 
  getMaxStock: (productId) => {
    return new Promise(async (resolve, reject) => {
      let stock = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(productId) });
      console.log("stock", stock);
      resolve(stock);
    });
  },
  changeproductquantity: (details) => {
    let count = parseInt(details.count)
    let cartId = details.cart
    let productid = details.product
    let quantity = parseInt(details.quantity)
    return new Promise((resolve, reject) => {
      if (count == -1 && quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: ObjectId(cartId) },
            {
              $pull: { products: { item: ObjectId(productid) } },
            },
          )
          .then((response) => {
            resolve({ removeProduct: true })
          })
      } else {
            db.get()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                { _id: ObjectId(cartId), 'products.item': ObjectId(productid) },
                {
                  $inc: { 'products.$.quantity': count },
                },
              )
              .then((response) => {
                resolve({ response: true })
              })
            }
          })
  },
  getTotalamount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: '$products',
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity',
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: 'item',
              foreignField: '_id',
              as: 'product',
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ['$product', 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $multiply: ['$quantity', '$product.offerAmount'] },
              },
            },
          },
        ])
        .toArray()
      if (total[0]) {
        resolve(total[0].total)
      } else {
        resolve('Cart is Empty')
      }
    })
  },
  getamount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let totalamt = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: '$products',
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity',
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: 'item',
              foreignField: '_id',
              as: 'product',
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ['$product', 0] },
            },
          },
          {
            $group: {
              _id: null,
              totalamt: {
                $sum: { $multiply: ['$quantity', '$product.price'] },
              },
            },
          },
        ])
        .toArray()
      if (totalamt[0]) {
        resolve(totalamt[0].totalamt)
      } else {
        resolve('Cart is Empty')
      }
    })
  },
  getcategoryDiscountAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let categorydiscountamount = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $unwind: {
              path: '$products',
            },
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity',
            },
          },
          {
            $lookup: {
              from: 'product',
              localField: 'item',
              foreignField: '_id',
              as: 'result',
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              result: {
                $arrayElemAt: ['$result', 0],
              },
            },
          },
          {
            $group: {
              _id: null,
              categorydiscount: {
                $sum: {
                  $multiply: ['$quantity', '$result.offerAmount'],
                },
              },
            },
          },
        ])
        .toArray()
      resolve(categorydiscountamount[0])
    })
  },
  removeCartProduct: (cartproduct) => {
    let { cartID, ProID } = cartproduct
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(cartID) },
          {
            $pull: { products: { item: ObjectId(ProID) } },
          },
        )
        .then((response) => {
          resolve({ ProRemove: true })
        })
    })
  },
  blockUser: (userid) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: ObjectId(userid) }, { $set: { blocked: true } })
        .then((response) => {
          resolve(response)
        })
    })
  },
  unblockUser: (userid) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: ObjectId(userid) }, { $set: { blocked: false } })
        .then((response) => {
          resolve(response)
        })
    })
  },
  placeOrder: (order, products, totalPrice) => {
    return new Promise(async (resolve, reject) => {
      let productdetails = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(products.products[0].item) })
      let status =
        order['paymentMethod'] === 'cod' || order['paymentMethod'] === 'PayPal'
          ? 'placed'
          : 'pending'
      let orderObj = {
        delivaryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode,
          name: order.name,
          lastname: order.lastname,
          email: order.email,
          country: order.country,
          state: order.state,
        },
        userId: ObjectId(order.userId),
        paymentMethod: order['paymentMethod'],
        products: products,
        stock: productdetails.stock,
        totalAmount: products.amounttopay,
        productId: products.products[0].item,
        Date: new Date(),
        status: status,
        orderCancel: false,
      }
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateMany(
              { _id: ObjectId(products.products[0].item) },
              { $inc: { stock: -products.products[0].quantity } },
            )
            .then((response) => {
              db.get()
                .collection(collection.CART_COLLECTION)
                .deleteOne({ user: ObjectId(order.userId) })
              resolve(response.insertedId)
            })
        })
    })
  },
  getCartProductlist: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) })
      resolve(cart)
    })
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: ObjectId(userId) })
        .toArray()
      resolve(orders)
    })
  },
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectId(orderId) },
          },
          {
            $unwind: '$products',
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: 'products.item',
              foreignField: '_id',
              as: 'items',
            },
          },
          {
            $unwind: '$items',
          },
        ])
        .toArray()
      resolve(orderItems)
    })
  },
  cancel_order: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              orderCancel: true,
              status: 'Cancel',
            },
          },
        )
        .then((response) => {
          resolve(response)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  AddNewaddress: (userId, address) => {
    let addressobj = {
      user: ObjectId(userId),
      address: [
        {
          name: address.name,
          lastname: address.lastname,
          email: address.email,
          mobile: address.mobile,
          address: address.address,
          country: address.country,
          state: address.state,
          uniqId: new Date(),
          pincode: address.pincode,
        },
      ],
    }
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .insertOne(addressobj)
        .then((data) => {
          resolve(data)
        })
    })
  },
  findAddress: (userID) => {
    return new Promise(async (resolve, reject) => {
      let address1 = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ user: ObjectId(userID) })
      resolve(address1)
    })
  },
  addAddress: (userId, address) => {
    let addNewaddress = {
      name: address.name,
      lastname: address.lastname,
      email: address.email,
      mobile: address.mobile,
      address: address.address,
      country: address.country,
      state: address.state,
      uniqId: new Date().toGMTString(),
      pincode: address.pincode,
    }
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .updateOne(
          { user: ObjectId(userId) },
          {
            $push: { address: addNewaddress },
          },
        )
        .then((response) => {
          resolve(response)
        })
    })
  },
  getUserDetails: (userID) => {
    return new Promise(async (resolve, reject) => {
      let userdetails = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userID) })
      if (userdetails) {
        resolve(userdetails)
      }
    })
  },
  deleteAddress: (date, userID) => {
    return new Promise(async (resolve, reject) => {
      let deletedata = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .updateOne(
          { user: ObjectId(userID) },
          { $pull: { address: { uniqId: date } } },
        )
        .then((deletedata) => {
          resolve(deletedata)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  generateRazorpay: (orderId, products, totalPrice) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: products.amounttopay * 100, // amount in the smallest currency unit
        currency: 'INR',
        receipt: orderId.toString(),
      }
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err)
        } else {
          resolve(order)
        }
      })
    })
  },
  verifyPayment: (PaymentDetials) => {
    return new Promise((resolve, reject) => {
      var crypto = require('crypto')
      let data =
        PaymentDetials['paymentdata[razorpay_order_id]'] +
        '|' +
        PaymentDetials['paymentdata[razorpay_payment_id]']
      let hmac = crypto
        .createHmac('sha256', 'J5OUnWR9Bzigj9ausIn7TC6B')
        .update(data.toString())
        .digest('hex')

      if (hmac === PaymentDetials['paymentdata[razorpay_signature]']) {
        console.log('Sucess')
        resolve()
      } else {
        console.log('failed')
        reject()
      }
    })
  },
  changePayemntStatus: (orderID) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderID) },
          {
            $set: {
              status: 'placed',
            },
          },
        )
        .then(() => {
          resolve()
        })
    })
  },
  placeorderajax: (cartdetails, id) => {
    return new Promise((resolve, reject) => {
      db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne({ user: ObjectId(id) }),
        {
          $set: {},
        }
    })
  },
  UpdateUser: (userID, userDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: ObjectId(userID) }, { $set: userDetails })
        .then((response) => {
          resolve(response)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  generatePaypal: (orderID, totalAmount) => {
    parseInt(totalPrice).toFixed(2)
    return new promises((resolve, reject) => {
      const create_payment_json = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal',
        },
        redirect_urls: {
          return_url: 'http://localhost:3000/success',
          cancel_url: 'http://localhost:3000/cancel',
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: 'list added',
                  sku: '001',
                  price: totalAmount,
                  currency: 'USD',
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: 'USD',
              total: totalAmount,
            },
            description: 'Hat ',
          },
        ],
      }

      let data = paypal.payment.create(create_payment_json, function (
        error,
        payment,
      ) {
        if (error) {
          throw error
        } else {
          resolve(payment)
        }
      })
    })
  },
  getcart: (userID) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userID) })
        .then((cart) => {
          resolve(cart)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
}
