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
const {isAdminAuthenticated,isNotAuthenticated} = require('../middleware/adminAuth');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const offerController = require('../controllers/offerController');
const salesController = require('../controllers/salesController');
const referralController = require('../controllers/referralController');
const { routes } = require('./userRouter');

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
adminRoute.get('/signout',  adminController.adminSignOut);


adminRoute.use(isAdminAuthenticated)
// dashboard 
adminRoute.get('/dashboard',   adminController.loadDashboard);
adminRoute.get('/update-dashboard',   adminController.updateDashboardData);



// category routes 
adminRoute.get('/categories',     categoryController.loadCategoryList);
adminRoute.route('/categories/add-category')
.get(categoryController.loadAddCategory)
.post(categoryController.addNewCategory);
adminRoute.get('/categories/edit-category',     categoryController.loadEditCategory);
adminRoute.put('/categories/edit-category/:id',     categoryController.updateCategory);
adminRoute.get('/categories/delete-category',      categoryController.deleteCategory);


// product routes 
adminRoute.get('/products',     productController.loadProductList);
adminRoute.route('/products/add-product')
.get(productController.loadAddProduct)
.post(upload.array('images', 10),productController.addNewProduct)
adminRoute.route('/products/edit-product/:id')
.get(productController.loadEditProduct)
.put(upload.array('images',10), productController.updateProduct)
adminRoute.get('/products/delete-product',     productController.deleteProduct);
adminRoute.post('/delete-image',     productController.deleteProductImage)

// user routes 
adminRoute.get('/users',   userManagementController.loadUserManagement);
adminRoute.get('/users/block-user',   userManagementController.blockUser);

// order routes 

adminRoute.get('/orders',   orderController.displayOrders);
adminRoute.get('/orders/view-order/:orderId',   orderController.viewOrder);
adminRoute.put('/orders/view-order/:orderId',   orderController.updateStatus)

// coupon routes 

adminRoute.get('/coupons',   couponController.loadCouponList);
adminRoute.get('/coupons/add-coupon',   couponController.loadAddCoupon);
adminRoute.post('/coupons/add-coupon',   couponController.addNewCoupon);
adminRoute.get('/coupons/edit-coupon/:id',     couponController.loadEditCoupon);
adminRoute.put('/coupons/edit-coupon/:id',     couponController.updateCoupon);
adminRoute.get('/coupons/delete-coupon',      couponController.deleteCoupon);


// offer routes 
adminRoute.get('/offers',   offerController.getOfferList);
adminRoute.get('/offers/add-offer',   offerController.getAddOfferPage);
adminRoute.post('/offers/add-offer',   offerController.addNewOffer);
adminRoute.get('/offers/edit-offer',   offerController.getEditOfferPage);
adminRoute.put('/offers/edit-offer/:id',   offerController.updateOffer);

// sales routes 
adminRoute.get('/sales',    salesController.getSalesReportPage);
adminRoute.get('/salesReport',     salesController.getSalesReport);
adminRoute.get('/download-sales-report-pdf',    salesController.downloadPDFReport);
adminRoute.get('/download-sales-report-excel',    salesController.downloadExcelReport);





module.exports = adminRoute;