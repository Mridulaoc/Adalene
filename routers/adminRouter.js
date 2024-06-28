const express = require('express');
const adminRoute = express();
const session = require("express-session");
const noCache = require('nocache');
const bodyParser = require("body-parser");
const methodOverride = require('method-override');
const multer = require('multer');
const path = require('path');

const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const userManagementController = require('../controllers/userManagementController');
const {isAuthenticated,isNotAuthenticated} = require('../middleware/adminAuth')

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
adminRoute.use(methodOverride('_method'));


const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {    
    const filetypes = /jpeg|jpg|png|gif/;    
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());  
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
};
const upload = multer({ 
    storage:storage, 
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: fileFilter
 });


adminRoute.set('view engine', 'ejs');
adminRoute.set("views", './views/admin');



adminRoute.get('/', isNotAuthenticated, adminController.loadSigIn);
adminRoute.post('/', adminController.verifySignIn);
adminRoute.get('/dashboard',isAuthenticated,adminController.loadDashboard);
adminRoute.get('/signout',  adminController.adminSignOut);


// category routes 
adminRoute.get('/categories',  isAuthenticated,categoryController.loadCategoryList);
adminRoute.route('/categories/add-category')
.get(categoryController.loadAddCategory)
.post(categoryController.addNewCategory);
adminRoute.get('/categories/edit-category', isAuthenticated, categoryController.loadEditCategory);
adminRoute.put('/categories/edit-category/:id',  isAuthenticated,categoryController.updateCategory);
adminRoute.get('/categories/delete-category',  isAuthenticated, categoryController.deleteCategory);


// product routes 
adminRoute.get('/products', isAuthenticated, productController.loadProductList);
adminRoute.route('/products/add-product')
.get(productController.loadAddProduct)
.post(upload.array('images', 10),productController.addNewProduct)
adminRoute.route('/products/edit-product/:id')
.get(productController.loadEditProduct)
.put(upload.array('images',10), productController.updateProduct)
adminRoute.route('/products/delete-image',productController.deleteProductImage)
adminRoute.get('/products/delete-product', isAuthenticated, productController.deleteProduct);

// user routes 
adminRoute.get('/users',isAuthenticated,userManagementController.loadUserManagement);
adminRoute.get('/users/block-user',isAuthenticated,userManagementController.blockUser);




module.exports = adminRoute;