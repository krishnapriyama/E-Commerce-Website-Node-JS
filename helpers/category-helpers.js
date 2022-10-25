var db = require('../config/connection')
var collection = require('../config/collections')
const { ObjectId, Admin } = require('mongodb')
module.exports = {
   getAllcategory: () => {
      return new Promise(async (resolve, reject) => {
         let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
         resolve(category)
      })
   },
   addcategory: (category) => {
      console.log(category);
      return new Promise(async (resolve, reject) => {
         let cat = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: category})
         console.log(cat,"dfssedf");
         const err = "Category Already Added"
         if (cat) {
            reject(err)
         } else {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne({category}).then((data) => {
               resolve(data.insertedId)
            })

         }
      })

   },
   deleteCategory: (dataId) => {
      return new Promise((resolve, reject) => {
         db.get().collection(collection.CATEGORY_COLLECTION).remove({ _id: ObjectId(dataId) }).then((response) => {
            resolve(response)
         })
      })
   },
   editCategory: (Editcategory) => {
      return new Promise(async (resolve, reject) => {
         let categorylist = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectId(Editcategory) })
         resolve(categorylist)
      })
   },
   updateCategory: (categoryId, categoryDetails) => {
      return new Promise((resolve, reject) => {
         db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: ObjectId(categoryId) }, {
            $set: {
               category: categoryDetails.category
            }
         }).then((response) => {
            resolve()
         })
      })
   }
}