const express = require('express');
const productRoute = express();
const bodyParser = require("body-parser");
const multer = require('multer');
const path = require('path');
const authAdmin =require('../middleware/adminAuth')
const methodOverride = require('method-override');

productRoute.use(methodOverride('_method'));
productRoute.use(express.static('public'));

productRoute.use(bodyParser.json());
productRoute.use(bodyParser.urlencoded({ extended: true }));

productRoute.set('view engine', 'ejs');
productRoute.set("views", './views/product');

const productController = require('../controllers/productController');

const storage = multer.memoryStorage();
const upload = multer({ storage });






module.exports = productRoute;