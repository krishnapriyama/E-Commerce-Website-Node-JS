var db = require('../config/connection')
var collection = require('../config/collections')
const { ObjectId, Admin } = require('mongodb')
module.exports = {
  addProduct: (product, callback) => {
    let products = {
      name: product.name,
      modelnumber: product.modelnumber,
      stock: Number(product.stock),
      modelname: product.modelname,
      series: product.series,
      color: product.color,
      category: product.category,
      batterybackup: product.batterybackup,
      suitablefor: product.suitablefor,
      powersupply: product.powersupply,
      price: Number(product.price),
      description: product.description,
      isActive: false,
      date: new Date().toUTCString(),
    }
    db.get()
      .collection('product')
      .insertOne(products)
      .then((data) => {
        callback(data.insertedId)
      })
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray()
      resolve(products)
    })
  },
  getuserAllProductslimit: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ isActive: false })
        .limit(4)
        .toArray()
      resolve(products)
    })
  },
  getuserAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ isActive: false })
        .toArray()
      resolve(products)
    })
  },
  deleteProduct: (dataId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .remove({ _id: ObjectId(dataId) })
        .then((response) => {
          resolve(response)
        })
    })
  },
  editProducts: (EditProducts) => {
    return new Promise(async (resolve, reject) => {
      let productlist = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(EditProducts) })
      resolve(productlist)
    })
  },
  viewSingleproducts: (dataId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(dataId) })
        .then((response) => {
          resolve(response)
        })
    })
  },
  updateProducts: (dataId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectId(dataId) },
          {
            $set: {
              name: productDetails.name,
              modelnumber: productDetails.modelnumber,
              stock: productDetails.stock,
              modelname: productDetails.modelname,
              series: productDetails.series,
              color: productDetails.color,
              type: productDetails.type,
              batterybackup: productDetails.batterybackup,
              suitablefor: productDetails.suitablefor,
              powersupply: productDetails.powersupply,
              price: Number(productDetails.price),
              description: productDetails.description,
            },
          },
        )
        .then((response) => {
          resolve()
        })
    })
  },
  activeTrue: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: { isActive: true },
          },
        )
        .then((resp) => {
          resolve(resp)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  activeFalse: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: { isActive: false },
          },
        )
        .then((resp) => {
          resolve(resp)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
}
