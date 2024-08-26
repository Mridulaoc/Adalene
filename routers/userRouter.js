const express = require('express');
const userRoute = express();
const session = require("express-session");
const noCache = require('nocache');
const bodyParser = require("body-parser");
const userController = require('../controllers/userController')
const walletController = require('../controllers/walletController')
const couponController = require('../controllers/couponController');
const passport = require('passport');
require('../passport')
// const userAuth = require('../middleware/userAuth');
const {isAuthenticated} = require('../middleware/userAuth')
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const checkBlocked = require('../middleware/checkBlocked');
const checkOfferExpiry = require('../middleware/offerCheckMiddleware');
const User = require('../models/user'); 
const getWishlistCount = require('../middleware/wishlistMiddleware');


userRoute.use(express.static('public'));
userRoute.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized:false,
    store: MongoStore.create({ mongoUrl: process.env.CONNECTION_STRING }),
    cookie: { secure: process.env.NODE_ENV === 'production' }
}))
userRoute.use(getWishlistCount);


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

userRoute.get('/google', (req, res, next) => {
    const returnUrl = req.query.returnUrl || '/';
    const state = Buffer.from(JSON.stringify({returnUrl})).toString('base64');
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state
    })(req, res, next);
});

userRoute.get('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/signin'); }
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            let returnUrl = '/';
            console.log(req.query.state)
            if(req.query.state){
                try {
                    const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
                    if (state.returnUrl) {
                        returnUrl = decodeURIComponent(state.returnUrl);
                    }
                } catch (error) {
                    console.error('Error parsing state:', error);
                }
            }
            
            return res.redirect(returnUrl);
        });
    })(req, res, next);
});

userRoute.get('/signin',userController.loadSigIn);
userRoute.post('/signin', (req, res, next) => {
    const returnUrl = req.body.returnUrl || '/';
    console.log(returnUrl)
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('signin', { 
                message: "Invalid email or password",
                returnUrl: returnUrl 
            });
        }

        if (!user.isVerified) {
            
            return res.render('signin', { 
                message: "Please verify your email before signing in",
                returnUrl: returnUrl 
            });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect(decodeURIComponent(returnUrl));
        });
    })(req, res, next);
});

userRoute.get('/',  userController.successGoogleLogin)
userRoute.get('/failure', userController.failureGoogleLogin);
userRoute.get('/', userController.loadSigIn);
userRoute.post('/', userController.verifySignIn);
userRoute.get('/forgot-password',userController.loadForgotPassword);
userRoute.post('/forgot-password', userController.requestOtp);
userRoute.post('/otp',userController.verifyFPOTP);
userRoute.post('/reset-password', userController.updatePassword);
userRoute.get('/shopall',userController.loadShopall);
userRoute.get('/products/:id', checkOfferExpiry, userController.loadProductDetails);
userRoute.post('/add-to-cart',  userController.addToCart);
userRoute.get('/get-cart-count', userController.getCartCount)
userRoute.get('/signout',  userController.userSignOut);


userRoute.use(isAuthenticated);
userRoute.get('/cart', userController.loadCartPage);
userRoute.post('/cart/update', userController.updateCart);
userRoute.post('/cart/remove', userController.removeCartItem);

userRoute.get('/checkout',   userController.displayAddressSelection);
userRoute.post('/checkout',   userController.selectedAddress);
userRoute.get('/payment',   userController.displayPayment);
userRoute.post('/apply-coupon',   couponController.applyCoupon);
userRoute.post('/remove-coupon',   couponController.removeCoupon);
userRoute.post('/paypal-success',   userController.paypalSuccess);
userRoute.post('/payment',   userController.processPayment);
userRoute.post('/create-paypal-order',  userController.createPaypalOrder);
userRoute.get('/create-paypal-order/:orderId',  userController.createPaypalOrderForRetry);
userRoute.get('/order-confirmation/:orderId',   userController.displayOrderConfirmation);
userRoute.get('/retry-payment/:orderId', userController.createPaypalOrderForRetry);

userRoute.get('/profile',   userController.displayProfile);
userRoute.get('/profile/edit/:id',   userController.displayEditProfile);
userRoute.put('/profile/edit/:id',  userController.updateProfile);

userRoute.get('/addresses',   userController.displayAddresses);
userRoute.get('/addresses/add',   userController.displayAddAddress);
userRoute.post('/addresses/add',   userController.addAddress);
userRoute.get('/addresses/edit/:id/:addressIndex',   userController.displayEditAddress);
userRoute.put('/addresses/edit/:id/:addressIndex',   userController.updateAddress);
userRoute.delete('/addresses/delete/:id/:addressIndex',   userController.deleteAddress)

userRoute.get('/change-password',   userController.displayChangePassword);
userRoute.post('/change-password',   userController.changePassword);

userRoute.get('/order-history',   userController.displayOrderHistory);
userRoute.post('/cancel-order',   userController.cancelOrder);
userRoute.get('/order-details/:orderId',   userController.displayOrderDetails)
userRoute.post('/cancel-order-item',   userController.cancelOrderItem);
userRoute.post('/return-order-item',   userController.returnOrderItem);
userRoute.post('/return-order-request',  userController.returnOrderRequest)
userRoute.get('/download-invoice/:orderId', userController.downloadInvoice)

userRoute.get('/my-wallet',   walletController.loadMyWallet);
userRoute.get('/my-wallet/balance',   walletController.getWalletBalance);
userRoute.get('/my-wallet/transactions',   walletController.getWalletTransactions);

userRoute.get('/wishlist', userController.getWishlist);
userRoute.post('/wishlist/add',   userController.addToWishlist);
userRoute.post('/wishlist/remove',   userController.removeFromWishlist);

userRoute.get('/my-referrals',   userController.getReferrals);


userRoute.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


module.exports = userRoute;