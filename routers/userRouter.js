const express = require('express');
const userRoute = express();
const session = require("express-session");
const noCache = require('nocache');
const bodyParser = require("body-parser");
const userController = require('../controllers/userController')
const passport = require('passport');
require('../passport')
const userAuth = require('../middleware/userAuth');
const MongoStore = require('connect-mongo');


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

userRoute.get('/signin', userAuth.checkNotAuthenticated, userController.loadSigIn);
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

userRoute.get('/', userController.successGoogleLogin)
userRoute.get('/home',  userController.loadHome);
userRoute.get('/failure', userController.failureGoogleLogin);
userRoute.get('/', userController.loadSigIn);
userRoute.post('/', userController.verifySignIn);
userRoute.get('/forgot-password',userController.loadForgotPassword);
userRoute.post('/forgot-password', userController.requestOtp);
userRoute.post('/otp',userController.verifyFPOTP);
userRoute.post('/reset-password', userController.updatePassword);
userRoute.get('/shopall',userController.loadShopall);
userRoute.get('/shopall/products',userController.loadFilteredProducts);
userRoute.get('/bags', userController.loadBags);
userRoute.get('/wallets',userController.loadWallets);
userRoute.get('/belts', userController.loadBelts);
userRoute.get('/phonecases', userController.loadPhoneCases);
userRoute.get('/products', userController.loadProductDetails);
userRoute.get('/signout',  userController.userSignOut);

userRoute.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


module.exports = userRoute;