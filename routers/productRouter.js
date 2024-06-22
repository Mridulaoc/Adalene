const express = require('express');
const productRoute = express();
const bodyParser = require("body-parser");
const multer = require('multer');
const path = require('path');
const authAdmin =require('../middleware/adminAuth')


productRoute.use(express.static('public'));

productRoute.use(bodyParser.json());
productRoute.use(bodyParser.urlencoded({ extended: true }));

productRoute.set('view engine', 'ejs');
productRoute.set("views", './views/product');

const productController = require('../controllers/productController');

const storage = multer.memoryStorage();
const upload = multer({ storage });


productRoute.get('/products', productController.loadProductList);
productRoute.get('/products/add-product', productController.loadAddProduct);
productRoute.post('/products/add-product', upload.array('images', 5),productController.addNewProduct);
productRoute.get('/products/edit-product/:id', productController.loadEditProduct);
productRoute.put('/products/edit-product/:id',upload.array('images',5), productController.updateProduct);
productRoute.get('/products/delete-product', productController.deleteProduct);



module.exports = productRoute;