var express = require('express')
var router = express.Router()
var { render, response } = require('../app')
var productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const couponHelpers = require('../helpers/coupon-helpers')
const adminHelpers = require('../helpers/admin-helpers')
const nodemon = require('nodemon')
const Handlebars = require('handlebars')
const credential = {
  username: 'admin',
  password: '123admin',
}

// Increment values
Handlebars.registerHelper('inc', function (value, options) {
  return parseInt(value) + 1
})

// Session
const verifylogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin')
  }
}

// Homepage
router.get('/', function (req, res, next) {
  if (req.session.admin) {
    res.render('admin/admin-homepage', { admin: true, adminheader: true })
  } else {
    res.render('admin/login', { admin: true, adminheader: true })
  }
})

router.post('/', (req, res) => {
  adminHelpers.doAdminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin/admin-homepage')
    } else {
      res.render('admin/login', {
        admin: true,
        err: 'Invalid UserName or Password',
      })
    }
  })
})

router.get('/admin-homepage', verifylogin, async function (req, res, next) {
  let admin = req.session.admin
  let amount = await adminHelpers.getTotalAmount()
  let pending = await adminHelpers.getPendingCount()
  let placed = await adminHelpers.getPlacedCount()
  let totalcount = await adminHelpers.getTotalCount()
  let codcount = await adminHelpers.getcodCount()
  let razorcount = await adminHelpers.getrazorCount()
  let paypalcount = await adminHelpers.getpaypalCount()
  res.render('admin/admin-homepage', {
    admin: true,
    admin,
    amount,
    pending,
    placed,
    totalcount,
    codcount,
    razorcount,
    paypalcount,
  })
})

// Logout
router.get('/logoutadmin', (req, res) => {
  req.session.destroy()
  res.redirect('/admin')
})

// Products
router.get('/viewproducts', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/viewproducts', { admin: true, products })
  })
})

router.get('/addproducts', function (req, res, next) {
  categoryHelpers.getAllcategory().then((categories) => {
    res.render('admin/addproducts', { admin: true, categories })
  })
})

router.post('/addproducts', function (req, res, next) {
  productHelpers.addProduct(req.body, (result) => {
    let image = req.files.Image
    let image1 = req.files.Image1
    let image2 = req.files.Image2
    let image3 = req.files.Image3
    image.mv('./public/product-images/' + result + '.png')
    image1.mv('./public/product-images/' + result + '1.png')
    image2.mv('./public/product-images/' + result + '2.png')
    image3.mv('./public/product-images/' + result + '3.png')
    res.render('admin/addproducts', { admin: true })
  })
})

router.get('/deleteproduct/:id', (req, res, next) => {
  var uid = req.params.id
  productHelpers.deleteProduct(uid).then((userData) => {
    res.redirect('/admin/viewproducts')
  })
})

router.get('/editproducts/:id', (req, res, next) => {
  try {
    var productid = req.params.id
    productHelpers.editProducts(productid).then((product) => {
      categoryHelpers.getAllcategory().then((categories) => {
        res.render('admin/editproduct', { admin: true, product, categories })
      })
    })
  } catch (err) {
    console.log(err, 'error happedned in edit user pafe')
  }
})
router.post('/editproducts/:id', (req, res) => {
  try {
    let dataId = req.params.id
    productHelpers.updateProducts(dataId, req.body).then((response) => {
      res.json({ status: true })
    })
  } catch (err) {
    console.log(err, 'error happened in edit usr post')
  }
})

router.get('/moredetails/:id', (req, res, next) => {
  var sid = req.params.id
  productHelpers.viewSingleproducts(sid).then((productdetails) => {
    res.render('admin/moredetails', { admin: true, productdetails })
  })
})

router.get('/activeTrue/:id', (req, res, next) => {
  productHelpers.activeTrue(req.params.id).then((response) => {
    res.json(true)
  })
})

router.get('/activeFalse/:id', (req, res, next) => {
  productHelpers.activeFalse(req.params.id).then((response) => {
    res.json(true)
  })
})

// User
router.get('/viewusers', function (req, res, next) {
  userHelpers.getAllusers().then((users) => {
    res.render('admin/viewusers', { admin: true, users })
  })
})

router.get('/addusers', (req, res) => {
  res.render('admin/addusers', { admin: true })
})

router.post('/addusers', function (req, res, next) {
  userHelpers.doSignup(req.body).then((response) => {
    res.render('admin/addusers', { admin: true })
  })
})

router.get('/editusers/:id', (req, res, next) => {
  try {
    var Userid = req.params.id
    userHelpers.editUsers(Userid).then((userData) => {
      res.render('admin/editusers', { admin: true, userData })
    })
  } catch (err) {
    console.log(err, 'error happedned in edit user pafe')
  }
})
router.post('/editusers/:id', (req, res) => {
  try {
    let dataId = req.params.id
    userHelpers.updateUser(dataId, req.body).then((response) => {
      res.json({ status: true })
    })
  } catch (err) {
    console.log(err, 'error happened in edit usr post')
  }
})

router.get('/delete/:id', (req, res, next) => {
  var uid = req.params.id
  userHelpers.deleteUser(uid).then((userData) => {
    res.redirect('/admin/viewusers')
  })
})

router.get('/block_user/:id', (req, res, next) => {
  userHelpers.blockUser(req.params.id).then((response) => {
    res.redirect('/admin/viewusers')
  })
})

router.get('/Unblock_user/:id', (req, res, next) => {
  userHelpers.unblockUser(req.params.id).then((response) => {
    res.redirect('/admin/viewusers')
  })
})

// Categories
router.get('/addcategories', function (req, res, next) {
  res.render('admin/addcategories', { admin: true })
})

router.post('/addcategories', function (req, res, next) {
  categoryHelpers
    .addcategory(req.body)
    .then((response) => {
      let image = req.files.Image
      image.mv('./public/category-images/' + response + '.png')
      res.render('admin/addcategories', { admin: true })
    })
    .catch((err) => {
      res.render('admin/addcategories', { admin: true, err })
    })
})

router.get('/viewcategories', function (req, res, next) {
  categoryHelpers.getAllcategory().then((category) => {
    res.render('admin/viewcategories', { admin: true, category })
  })
})

router.get('/deletecategory/:id', (req, res, next) => {
  var cid = req.params.id
  categoryHelpers.deleteCategory(cid).then((userData) => {
    res.redirect('/admin/viewcategories')
  })
})

router.get('/editcategory/:id', (req, res, next) => {
  try {
    var catid = req.params.id
    categoryHelpers.editCategory(catid).then((category) => {
      res.render('admin/editcategories', { admin: true, category })
    })
  } catch (err) {
    console.log(err, 'error happedned in edit user pafe')
  }
})
router.post('/editcategory/:id', (req, res) => {
  try {
    let dataId = req.params.id
    categoryHelpers.updateCategory(dataId, req.body).then((response) => {
      res.json({ status: true })
    })
  } catch (err) {
    console.log(err, 'error happened in edit usr post')
  }
})

// Chart
router.get('/chartWeek', (req, res, next) => {
  adminHelpers
    .weekOrderCount()
    .then((value) => {
      res.json(value)
    })
    .catch((err) => {
      res.json(err)
    })
})

router.get('/chartMonth', (req, res, next) => {
  adminHelpers
    .MonthOrderCount()
    .then((value) => {
      res.json(value)
    })
    .catch((err) => {
      res.json(err)
    })
})

router.get('/chartYear', (req, res, next) => {
  adminHelpers
    .YearOrderCount()
    .then((value) => {
      res.json(value)
    })
    .catch((err) => {
      res.json(err)
    })
})

// Orders
router.get('/vieworders', (req, res) => {
  adminHelpers.getallUserCodOrders(req.params.id).then((codOrders) => {
    adminHelpers.getallUserRazorOrders(req.params.id).then((razorpayorder) => {
      adminHelpers
        .getallUserPaypalOrders(req.params.id)
        .then((paypalOrders) => {
          res.render('admin/vieworders', {
            admin: true,
            codOrders,
            razorpayorder,
            paypalOrders,
          })
        })
    })
  })
})

router.get('/viewallorders', (req, res) => {
  adminHelpers.getallUserOrders(req.params.id).then((reponse) => {
    res.render('admin/viewallorders', { admin: true, reponse })
  })
})

router.get('/orderdetail/:id', (req, res) => {
  adminHelpers.getOrderProducts(req.params.id).then((products) => {
    res.render('admin/orderdetails-admin', { admin: true, products })
  })
})

router.get('/payemntdetails', async (req, res) => {
  let catwise = await adminHelpers.getCatwiseTotal()
  let productwise = await adminHelpers.getProductwiseTotal()
  let statuswise = await adminHelpers.getStatuswiseplacedTotal()
  res.render('admin/paymentdetails', {
    admin: true,
    catwise,
    productwise,
    statuswise,
  })
})

router.get('/viewcoupons', (req, res, next) => {
  couponHelpers.getAllcoupons().then((coupons) => {
    res.render('admin/viewcoupons', { admin: true, coupons })
  })
})

router.post('/change-status/:id', (req, res, next) => {
  adminHelpers.statusUpdate(req.params.id, req.body).then((value) => {
    res.redirect('/admin/vieworders')
  })
})

router.post('/allchange-status/:id', (req, res, next) => {
  adminHelpers.statusUpdate(req.params.id, req.body).then((value) => {
    res.redirect('/admin/viewallorders')
  })
})

// Coupons
router.get('/addcoupons', (req, res, next) => {
  res.render('admin/addcoupons', { admin: true })
})

router.post('/addcoupons', (req, res, next) => {
  couponHelpers
    .addcoupons(req.body)
    .then((response) => {
      res.render('admin/addcoupons', { admin: true })
    })
    .catch((err) => {
      res.render('admin/addcoupons', { admin: true, err })
    })
})

router.get('/deletecoupon/:id', (req, res, next) => {
  var cid = req.params.id
  couponHelpers.deleteCoupon(cid).then(() => {
    res.redirect('/admin/viewcoupons')
  })
})

router.get('/CouponactiveTrue/:id', (req, res, next) => {
  couponHelpers.CouponactiveTrue(req.params.id).then((response) => {
    res.json(true)
  })
})

router.get('/CouponactiveFalse/:id', (req, res, next) => {
  couponHelpers.CouponactiveFalse(req.params.id).then((response) => {
    res.json(true)
  })
})

// Complaints
router.get('/complaint', async (req, res, next) => {
  let complaint = await adminHelpers.getComplaints()
  res.render('admin/complaints', { admin: true, complaint })
})

router.post('/complaintchange-status', verifylogin, (req, res, next) => {
  adminHelpers.complaintstatusUpdate(req.body).then((value) => {
    res.redirect('/admin/complaint')
  })
})
module.exports = router
