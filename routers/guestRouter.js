const express = require('express');
const guestRoute = express();
const session = require("express-session");
const noCache = require('nocache');
const bodyParser = require("body-parser");
const methodOverride = require('method-override');
const multer = require('multer');
const path = require('path');

const adminController = require('../controllers/adminController');
const {isAuthenticated,isNotAuthenticated} = require('../middleware/adminAuth');
guestRoute.use(noCache());
guestRoute.use(bodyParser.json());
guestRoute.use(bodyParser.urlencoded({ extended: true }));


guestRoute.get('/', isNotAuthenticated, adminController.loadSigIn);
guestRoute.post('/', adminController.verifySignIn);
guestRoute.get('/signout',  adminController.adminSignOut);


module.exports = guestRoute;