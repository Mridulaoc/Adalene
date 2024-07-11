const express = require('express');
const userRoute = express();
const session = require("express-session");
const noCache = require('nocache');
const bodyParser = require("body-parser");
const userController = require('../controllers/userController')
const passport = require('passport');
require('../passport')
// const userAuth = require('../middleware/userAuth');
const {isAuthenticated} = require('../middleware/userAuth')
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const checkBlocked = require('../middleware/checkBlocked');



// middlewares 
userRoute.use(express.static('public'));
userRoute.use(session({
    secret: "secretkey",
    resave: true,
    saveUninitialized:true,
    store: MongoStore.create({ mongoUrl: process.env.CONNECTION_STRING })
}))
userRoute.use(noCache());
userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));
userRoute.use(passport.initialize());
userRoute.use(passport.session());
userRoute.use(methodOverride('_method'));
userRoute.use(checkBlocked);


userRoute.set('view engine', 'ejs');
userRoute.set("views", './views/user');



userRoute.get('/signup',userController.loadSignUp);
userRoute.post('/signup', userController.verifySignUp);
userRoute.get('/verify',userController.loadVerify);
userRoute.post('/verify', userController.verifyOTP);
userRoute.post('/resend', userController.resendOTP);
userRoute.get('/google', passport.authenticate('google', {
    scope:['email','profile']
}));

userRoute.get('/auth/google/callback',
    passport.authenticate('google',{
        scope:['profile'] ,
        successRedirect:'/',
        failureRedirect:'/signin'
    })
);

userRoute.get('/signin',userController.loadSigIn);
userRoute.post('/signin', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('signin', { errorMessage: info.message });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/');
        });
    })(req, res, next);
});

userRoute.get('/',  userController.successGoogleLogin)
userRoute.get('/home',  userController.loadHome);
userRoute.get('/failure', userController.failureGoogleLogin);
userRoute.get('/', userController.loadSigIn);
userRoute.post('/', userController.verifySignIn);
userRoute.get('/forgot-password',userController.loadForgotPassword);
userRoute.post('/forgot-password', userController.requestOtp);
userRoute.post('/otp',userController.verifyFPOTP);
userRoute.post('/reset-password', userController.updatePassword);
userRoute.get('/shopall',userController.loadShopall);
userRoute.get('/bags', userController.loadBags);
userRoute.get('/wallets',userController.loadWallets);
userRoute.get('/belts', userController.loadBelts);
userRoute.get('/phonecases', userController.loadPhoneCases);
userRoute.get('/products/:id', userController.loadProductDetails);
userRoute.post('/add-to-cart', isAuthenticated, userController.addToCart);
userRoute.get('/cart',isAuthenticated, userController.loadCartPage);
userRoute.post('/cart/update', isAuthenticated, userController.updateCart);
userRoute.post('/cart/remove', isAuthenticated, userController.removeCartItem);
userRoute.get('/cart/count', isAuthenticated, userController.countCartItems);
userRoute.get('/checkout', isAuthenticated, userController.displayAddressSelection);
userRoute.post('/checkout', isAuthenticated, userController.selectedAddress);
userRoute.get('/payment', isAuthenticated, userController.displayPayment);
userRoute.post('/payment', isAuthenticated, userController.processPayment);
userRoute.get('/order-confirmation/:orderId', isAuthenticated, userController.displayOrderConfirmation);
userRoute.get('/profile', isAuthenticated, userController.displayProfile);
userRoute.get('/profile/edit/:id', isAuthenticated, userController.displayEditProfile);
userRoute.put('/profile/edit/:id',isAuthenticated, userController.updateProfile);
userRoute.get('/addresses', isAuthenticated, userController.displayAddresses);
userRoute.get('/addresses/add', isAuthenticated, userController.displayAddAddress);
userRoute.post('/addresses/add', isAuthenticated, userController.addAddress);
userRoute.get('/addresses/edit/:id/:addressIndex', isAuthenticated, userController.displayEditAddress);
userRoute.put('/addresses/edit/:id/:addressIndex', isAuthenticated, userController.updateAddress);
userRoute.get('/order-history', isAuthenticated, userController.displayOrderHistory);
userRoute.post('/cancel-order', isAuthenticated, userController.cancelOrder);
userRoute.get('/order-details/:orderId', isAuthenticated, userController.displayOrderDetails)
userRoute.post('/cancel-order-item', isAuthenticated, userController.cancelOrderItem)
userRoute.get('/signout',  userController.userSignOut);

userRoute.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


module.exports = userRoute;