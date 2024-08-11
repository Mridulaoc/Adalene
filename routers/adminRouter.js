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
const {isAuthenticated,isNotAuthenticated} = require('../middleware/adminAuth');
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
adminRoute.post('/delete-image', isAuthenticated, productController.deleteProductImage)

// user routes 
adminRoute.get('/users',isAuthenticated,userManagementController.loadUserManagement);
adminRoute.get('/users/block-user',isAuthenticated,userManagementController.blockUser);

// order routes 

adminRoute.get('/orders',isAuthenticated,orderController.displayOrders);
adminRoute.get('/orders/view-order/:orderId',isAuthenticated,orderController.viewOrder);
adminRoute.put('/orders/view-order/:orderId',isAuthenticated,orderController.updateStatus)

// coupon routes 

adminRoute.get('/coupons',isAuthenticated,couponController.loadCouponList);
adminRoute.get('/coupons/add-coupon',isAuthenticated,couponController.loadAddCoupon);
adminRoute.post('/coupons/add-coupon',isAuthenticated,couponController.addNewCoupon);
adminRoute.get('/coupons/edit-coupon/:id', isAuthenticated, couponController.loadEditCoupon);
adminRoute.put('/coupons/edit-coupon/:id',  isAuthenticated,couponController.updateCoupon);
adminRoute.get('/coupons/delete-coupon',  isAuthenticated, couponController.deleteCoupon);


// offer routes 
adminRoute.get('/offers',isAuthenticated,offerController.getOfferList);
adminRoute.get('/offers/add-offer',isAuthenticated,offerController.getAddOfferPage);
adminRoute.post('/offers/add-offer',isAuthenticated,offerController.addNewOffer);
adminRoute.get('/offers/edit-offer',isAuthenticated,offerController.getEditOfferPage);
adminRoute.put('/offers/edit-offer/:id',isAuthenticated,offerController.updateOffer);
adminRoute.post('/products/update-offer',isAuthenticated,productController.updateProductOffer);
adminRoute.post('/categories/update-offer',isAuthenticated,categoryController.updateCategoryOffer)


//product offer routes
// adminRoute.get('/productOffer', isAuthenticated, offerController.getProductOffer);
// adminRoute.get('/productOffer/add-offer/:id', isAuthenticated, offerController.getAddProductOffer);
// adminRoute.post('/productOffer/add-offer', isAuthenticated, offerController.addNewproductOffer);
// adminRoute.get('/productOffer/edit-offer/:id', isAuthenticated, offerController.getEditProductOffer);
// adminRoute.post('/productOffer/edit-offer', isAuthenticated, offerController.updateProductOffer);

// // category offer routes 
// adminRoute.get('/categoryOffer', isAuthenticated, offerController.getCategoryOffer);
// adminRoute.get('/categoryOffer/add-offer/:id', isAuthenticated, offerController.getAddCategoryOffer);
// adminRoute.post('/categoryOffer/add-offer', isAuthenticated, offerController.addNewCategoryOffer);
// adminRoute.get('/categoryOffer/edit-offer/:id', isAuthenticated, offerController.getEditCategoryOffer);
// adminRoute.post('/categoryOffer/edit-offer/:id', isAuthenticated, offerController.updateCategoryOffer);

// referral offer routes 

adminRoute.get('/referralOffer', isAuthenticated, referralController.getReferralList);
adminRoute.get('/referralOffer/update-rewards', isAuthenticated, referralController.getupdateReferralRewards);
adminRoute.post('/referralOffer/update-rewards', isAuthenticated, referralController.updateReferralRewards);


// sales routes 
adminRoute.get('/sales',isAuthenticated, salesController.getSalesReportPage);
adminRoute.get('/salesReport', isAuthenticated, salesController.getSalesReport);
adminRoute.get('/download-sales-report-pdf',isAuthenticated, salesController.downloadPDFReport);
adminRoute.get('/download-sales-report-excel',isAuthenticated, salesController.downloadExcelReport);





module.exports = adminRoute;