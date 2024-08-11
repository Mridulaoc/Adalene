const adminRoute = require('../routers/adminRouter');
const Admin = require('../models/admin');
const Order = require('../models/order');
const Product = require('../models/product');
const Category = require('../models/category');

const loadSigIn = (req,res)=>{
    if(req.session.userid){
        res.status(301).redirect('/admin/dashboard');
    }
    res.status(200).render('signin');
}

const verifySignIn = async(req,res)=>{
    try {
        const {email,password} = req.body;
        const adminData = await Admin.findOne({admin_email: email, admin_password: password});
        console.log(email,password);
        console.log(adminData)
        if(adminData){
            req.session.userid = adminData._id;       
            res.redirect('/admin/dashboard');   
        }else{
            res.status(200).render('signin', {message:"Username or password is incorrect"}); 
        }

    } catch (error) {
        console.log(err);
    }
    
}
// const loadDashboard = async (req,res)=>{
//     if(req.session.userid){
//         const period = parseInt(req.query.period) || 7;
//         const endDate = new Date();
//         const startDate = new Date(endDate.getTime() - period * 24 * 60 * 60 * 1000);
      
//         try {
//           // Fetch orders within the selected period
//           const orders = await Order.find({
//             orderDate: { $gte: startDate, $lte: endDate }
//           }).populate('products.product');
      
//           // Calculate total sales, orders, and profit
//           const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
//           const totalOrders = orders.length;
//           const totalProfit = orders.reduce((sum, order) => sum + (order.total - order.subtotal), 0);
      
//           // Calculate product and category sales
//           const productSales = {};
//           const categorySales = {};
      
//           orders.forEach(order => {
//             order.products.forEach(item => {
//               productSales[item.product._id] = (productSales[item.product._id] || 0) + item.quantity;
//               categorySales[item.product.prod_category] = (categorySales[item.product.prod_category] || 0) + item.quantity;
//             });
//           });
      
//           // Get top 10 best-selling products
//           const bestProducts = await Promise.all(
//             Object.entries(productSales)
//               .sort((a, b) => b[1] - a[1])
//               .slice(0, 10)
//               .map(async ([productId, sold]) => {
//                 const product = await Product.findById(productId);
//                 return { name: product.prod_name, sold };
//               })
//           );
      
//           // Get top 10 best-selling categories
//           const bestCategories = await Promise.all(
//             Object.entries(categorySales)
//               .sort((a, b) => b[1] - a[1])
//               .slice(0, 10)
//               .map(async ([categoryId, sold]) => {
//                 const category = await Category.findById(categoryId);
//                 return { name: category.name, sold };
//               })
//           );
      
//           // Prepare chart data
//           const chartLabels = [];
//           const chartData = [];
//           for (let i = 0; i < period; i++) {
//             const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
//             chartLabels.unshift(date.toLocaleDateString());
//             const dailySales = orders.filter(order => order.orderDate.toDateString() === date.toDateString())
//                                      .reduce((sum, order) => sum + order.total, 0);
//             chartData.unshift(dailySales);
//           }
      
//           res.json({
//             totalSales,
//             totalOrders,
//             totalProfit,
//             bestProducts,
//             bestCategories,
//             chartLabels,
//             chartData
//           });
//         } catch (error) {
//           console.error(error);
//           res.status(500).json({ error: 'Internal server error' });
//         }
//     }else{
//         res.redirect('/admin');
//     }
    
// }

const loadDashboard = async(req, res) => {
    try {
        // Initial data for the dashboard (e.g., last 7 days)
        const dashboardData = await getDashboardData(7);
        res.render('dashboard', { dashboardData });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Internal server error' });
    }
}

const updateDashboardData = async(req,res) =>{
    const period = parseInt(req.query.period) || 7;
    try {
        const dashboardData = await getDashboardData(period);
        res.json(dashboardData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getDashboardData(period) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - period * 24 * 60 * 60 * 1000);

    // Fetch orders within the selected period
    const orders = await Order.find({
        orderDate: { $gte: startDate, $lte: endDate }
    }).populate('products.product');

    // Calculate total sales, orders, and profit
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const totalProfit = orders.reduce((sum, order) => sum + (order.total - order.subtotal), 0);

    // Calculate product and category sales
    const productSales = {};
    const categorySales = {};

    orders.forEach(order => {
        order.products.forEach(item => {
            productSales[item.product._id] = (productSales[item.product._id] || 0) + item.quantity;
            categorySales[item.product.prod_category] = (categorySales[item.product.prod_category] || 0) + item.quantity;
        });
    });

    // Get top 10 best-selling products
    const bestProducts = await Promise.all(
        Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(async ([productId, sold]) => {
                const product = await Product.findById(productId);
                return { name: product.prod_name, sold };
            })
    );

    // Get top 10 best-selling categories
    const bestCategories = await Promise.all(
        Object.entries(categorySales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(async ([categoryId, sold]) => {
                const category = await Category.findById(categoryId);
                return { name: category.cat_name, sold };
            })
    );

    // Prepare chart data
    const chartLabels = [];
    const chartData = [];
    for (let i = 0; i < period; i++) {
        const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
        chartLabels.unshift(date.toLocaleDateString());
        const dailySales = orders.filter(order => order.orderDate.toDateString() === date.toDateString())
                                 .reduce((sum, order) => sum + order.total, 0);
        chartData.unshift(dailySales);
    }

    return {
        totalSales,
        totalOrders,
        totalProfit,
        bestProducts,
        bestCategories,
        chartLabels,
        chartData
    };
}

const adminSignOut = (req,res)=>{
    try {
        if(req.session.userid){
            req.session.destroy();
            res.redirect('/admin');
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports ={
    loadSigIn,
    verifySignIn,
    loadDashboard,
    updateDashboardData,
    adminSignOut
}