var db = require('../config/connection')
var collection = require('../config/collections')
const { ObjectId, Admin } = require('mongodb')
module.exports = {
  getAllcategory: () => {
    return new Promise(async (resolve, reject) => {
      let category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray()
      resolve(category)
    })
  },
  addcategory: (category) => {
    return new Promise(async (resolve, reject) => {
      let cat = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ category: category.category })
      const err = 'Category Already Added'
      if (cat) {
        reject(err)
      } else {
        let cate = {
          category: category.category,
          offer: Number(category.offer),
          data: new Date().toUTCString(),
        }
        db.get()
          .collection(collection.CATEGORY_COLLECTION)
          .insertOne(cate)
          .then((data) => {
            resolve(data.insertedId)
          })
      }
    })
  },
  deleteCategory: (dataId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .remove({ _id: ObjectId(dataId) })
        .then((response) => {
          resolve(response)
        })
    })
  },
  editCategory: (Editcategory) => {
    return new Promise(async (resolve, reject) => {
      let categorylist = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: ObjectId(Editcategory) })
      resolve(categorylist)
    })
  },
  updateCategory: (categoryId, categoryDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: ObjectId(categoryId) },
          {
            $set: {
              category: categoryDetails.category,
              offer: Number(categoryDetails.offer),
            },
          },
        )
        .then((response) => {
          resolve()
        })
    })
  },
  getoffer_amount: () => {
    return new Promise(async (resolve, reject) => {
      let offer_amount = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .aggregate([
          {
            $lookup: {
              from: 'product',
              localField: 'category',
              foreignField: 'category',
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
              category: 1,
              offer: 1,
              stock:1,
              offer_amount: {
                $subtract: [
                  '$result.price',
                  {
                    $divide: [
                      {
                        $multiply: ['$result.price', '$offer'],
                      },
                      100,
                    ],
                  },
                ],
              },
            },
          },
          {
            $match: { 'result.isActive': false },
          },
        ])
        .toArray()
      offer_amount.forEach(async (element) => {
        await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: ObjectId(element.result._id) },
            {
              $set: { offerAmount: element.offer_amount, offer: element.offer },
            },
          )
          .then((response) => {
            resolve(offer_amount)
          })
      })
    })
  },
  productCatogeries: (categoryname) => {
    return new Promise(async (resolve, reject) => {
      let catProducts = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ category: categoryname })
        .toArray()
      resolve(catProducts)
    })
  },
}
