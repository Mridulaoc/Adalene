const express = require('express');
const userManagementRoute = express();
const session = require("express-session");
const noCache = require('nocache');
const bodyParser = require("body-parser");
const userMangementController = require('../controllers/userManagementController');

userManagementRoute.use(express.static('public'));
userManagementRoute.use(session({
    secret: "secretkey",
    resave: true,
    saveUninitialized:true,
}))
userManagementRoute.use(noCache());
userManagementRoute.use(bodyParser.json());
userManagementRoute.use(bodyParser.urlencoded({ extended: true }));

userManagementRoute.set('view engine', 'ejs');
userManagementRoute.set("views", './views/userManagement');

userManagementRoute.get('/users',userMangementController.loadUserManagement);
userManagementRoute.get('/users/block-user',userMangementController.blockUser);

module.exports = userManagementRoute;
