const express = require('express');
const adminRoute = express();
const session = require("express-session");
const noCache = require('nocache');
const bodyParser = require("body-parser");
const adminController = require('../controllers/adminController');
const authAdmin = require('../middleware/adminAuth')

// middlewares 
adminRoute.use(express.static('public'));
adminRoute.use(session({
    secret: "secretkey",
    resave: true,
    saveUninitialized:true,
}))
adminRoute.use(noCache());
adminRoute.use(bodyParser.json());
adminRoute.use(bodyParser.urlencoded({ extended: true }));

adminRoute.set('view engine', 'ejs');
adminRoute.set("views", './views/admin');

adminRoute.get('/', adminController.loadSigIn);
adminRoute.post('/', adminController.verifySignIn);
adminRoute.get('/dashboard',adminController.loadDashboard);
adminRoute.get('/signout', adminController.adminSignOut);


module.exports = adminRoute;