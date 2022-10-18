var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
var router = express.Router();
// const serverSID = 'VAbeb462e425477ecf42eee83cf5093c52'
// const accountSID = 'AC674a3db162fadea27864cc9da3b8120b'
// const authtoken = '645976ce65e3d8d6a0f127d92c647981'
const serverSID = 'VA0487c8ae3c95e1685cc4fcea045087ab'
const accountSID = 'AC472499e6d3525bca27a343dd80624fa4'
const authtoken = '073127a1c7ba79c78a86978916dde2d7'
const client = require('twilio')(accountSID, authtoken)

const verifylogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('user/homepage', { admin: false });
});

router.get('/homepage', async function (req, res, next) {
  let user = req.session.user
  if (req.session.user) {
    let cartCount = await userHelpers.getcartCount(req.session.user._id)
    res.render('user/homepage', { admin: false, user, cartCount });
  } else {
    res.render('user/homepage', { admin: false });
  }

});

router.get('/viewproducts', verifylogin, async (req, res) => {
  let cartCount = await userHelpers.getcartCount(req.session.user._id)
  let user = req.session.user
  productHelpers.getAllProducts().then((products) => {
    res.render("user/viewproducts", { admin: false, products, user, cartCount })
  })
})

router.get('/login', function (req, res, next) {
  if (req.session.user) {
    res.redirect('/homepage')
  } else {
    res.render('user/login', { admin: false });
  }
});
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      // req.session.userName = response.user.
      req.session.userid = response.user._id
      res.redirect('/homepage')
    }
  }).catch((err) => {
    res.render('user/login', { err })
  })
})

router.get('/signup', function (req, res, next) {
  let user = req.session.user
  if (user) {
    res.redirect('user/homepage', { user });
  } else {
    res.render('user/signup')
  }
});
router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    //console.log(response);
    res.render('user/login')
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
  req.session.loggedIn = false
})


// otp login
router.get('/enterphno', function (req, res, next) {
  res.render('user/enterphno', { admin: false });
});
router.post('/enterphno', (req, res) => {
  // console.log(req.body.phno, '1st number');
  client.verify
    .services(serverSID)
    .verifications.create({
      to: `+91${req.body.phno}`,
      channel: 'sms'
    }).then(data => {
      res.render('user/otplogin', { phno: req.body.phno })
    })
    .catch(err => {
      console.log(err);
    })
})
router.get('/otplogin', function (req, res, next) {
  res.render('user/otplogin', { admin: false });
});
router.post('/otplogin', (req, res) => {
  const { otp, phno } = req.body
  client.verify.services(serverSID).verificationChecks.create({ to: `+91${phno}`, code: otp })
    .then((resp) => {
      if (!resp.valid) {
        res.render('user/otplogin')
      } else {
        res.redirect('/homepage')
      }
    }).catch(err => {
      console.log(err);
    })
})

router.get('/singleproduct/:id', verifylogin, async function (req, res, next) {
  let user = req.session.user
  let sid = req.params.id
  let cartCount = await userHelpers.getcartCount(req.session.user._id)
  productHelpers.viewSingleproducts(sid).then((singleproduct) => {
    res.render('user/singleproduct', { admin: false, singleproduct, user, cartCount });
  })
});

router.get('/cart', verifylogin, async (req, res) => {
  let user = req.session.user
  let userid = req.session.user._id
  let username = req.session.user
  let totalValue = await userHelpers.getTotalamount(req.session.user._id)
  let products = await userHelpers.getcartproducts(req.session.user._id)
  let cartCount = await userHelpers.getcartCount(req.session.user._id)
  if (products) {
    res.render('user/cart', { products, user, username, cartCount, totalValue })
  } else {
    res.render('user/cart', { products, userid })
  }
})

router.get('/add-to-cart/:id', verifylogin, (req, res) => {
  let proId = req.params.id
  let user = req.session.user
  userHelpers.addtocart(proId, req.session.userid).then(() => {
    res.json({ status: true })
  })
})

router.post('/change-product-quantity', (req, res, next) => {
  console.log(req.body, "body of change product quantity");
  userHelpers.changeproductquantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalamount(req.body.user)
    console.log(response.total, "tjhjhgjhg");
    res.json(response)
  })
})

router.get('/place-order', verifylogin, async (req, res) => {
  let total = await userHelpers.getTotalamount(req.session.user._id)
  let cartCount = await userHelpers.getcartCount(req.session.user._id)
  let products = await userHelpers.getcartproducts(req.session.user._id)
  console.log(products);
  let user = req.session.user
  res.render('user/place-order', { user, total, cartCount, products })
})

router.post('/removeCartProduct', (req, res, next) => {
  userHelpers.removeCartProduct(req.body).then((response) => {
    res.json(response)
  })
})

router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductlist(req.body.userId)
  let totalPrice = await userHelpers.getTotalamount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
    res.json({ status: true })
  })
  //console.log(req.body);
})

router.get('/order-success', (req, res) => {
  let user = req.session.user
  res.render('user/order-success', { user })
})


router.get('/profile', (req, res) => {
  let user = req.session.user
  res.render('user/profile', { user })
})

router.get('/cancel-order/:id', (req, res) => {
  let orderid = req.params.id
  userHelpers.cancel_order(orderid).then((response)=>{
res.json(true)
  })
})

router.get('/orders', verifylogin, async (req, res, next) => {
  let user = req.session.user
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/order', { user, orders })
})

router.get('/orderdetails/:id',verifylogin, async(req, res) => {
  let user = req.session.user
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/orderdetails', { user ,products})
})


module.exports = router;
