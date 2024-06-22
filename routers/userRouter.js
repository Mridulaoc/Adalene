const express = require('express');
const userRoute = express();
const session = require("express-session");
const noCache = require('nocache');
const bodyParser = require("body-parser");
const userController = require('../controllers/userController')
const passport = require('passport');
require('../passport')
const userAuth = require('../middleware/userAuth');


// middlewares 
userRoute.use(express.static('public'));
userRoute.use(session({
    secret: "secretkey",
    resave: true,
    saveUninitialized:true,
}))
userRoute.use(noCache());
userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));
userRoute.use(passport.initialize());
userRoute.use(passport.session());

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
        successRedirect:'/home',
        failureRedirect:'/login'
    })
)

// userRoute.get('/signin',
//     passport.authenticate('local', {
//     successRedirect: '/',
//     failureRedirect: '/signin',
//     // failureFlash: true
// }))

userRoute.get('/home', userController.successGoogleLogin)
userRoute.get('/home',userAuth.isSignedIn, userController.loadHome);
userRoute.get('/failure', userController.failureGoogleLogin);
userRoute.get('/', userAuth.isSignedIn, userController.loadSigIn);
userRoute.post('/', userController.verifySignIn);
userRoute.get('/signin',  userController.loadSigIn);
userRoute.post('/signin', userController.verifySignIn);
userRoute.get('/forgot-password',userController.loadForgotPassword);
userRoute.post('/forgot-password', userController.requestOtp);
userRoute.post('/otp',userController.verifyFPOTP);
userRoute.post('/reset-password', userController.updatePassword);
userRoute.get('/shopall',userAuth.isSignedIn,userController.loadShopall);
userRoute.get('/bags', userController.loadBags);
userRoute.get('/wallets', userAuth.isSignedIn,userController.loadWallets);
userRoute.get('/belts', userAuth.isSignedIn,userController.loadBelts);
userRoute.get('/phonecases', userAuth.isSignedIn, userController.loadPhoneCases);
userRoute.get('/products', userAuth.isSignedIn,  userController.loadProductDetails);
userRoute.get('/signout',  userController.userSignOut);


// userRoute.get('/signin',
//     passport.authenticate('local', {
//     successRedirect: '/',
//     failureRedirect: '/signin',
//     // failureFlash: true
// }))

module.exports = userRoute;