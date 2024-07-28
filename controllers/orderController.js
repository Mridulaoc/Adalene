const Order = require('../models/order')
const User = require('../models/user');
const Product = require('../models/product');
const moment = require('moment');

const displayOrders = async(req,res)=>{
    try {
        if(req.session.userid){
            let search = "";
            if(req.query.search){
                search = req.query.search
            }
            let page =1;
            if(req.query.page){
                page = req.query.page;
            }
            const limit = 5;
            const orders = await Order.find({orderId:{$regex:".*" + search + ".*", $options:'i' }})
            .populate('user')
            .populate('products.product')
            .limit(limit*1)
            .skip((page-1)*limit)
            .sort({ orderDate: -1 })
            .exec();
            const count = await Order.find({orderId:{$regex:".*" + search + ".*", $options:'i' }}).countDocuments();
            res.render('orderList', {orders,search,totalPages:Math.ceil(count/limit), currentPage:page,moment})
        }
       
        
    } catch (error) {
        console.log(error);
    }
}

const viewOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('user').populate('products.product');
        let totalValue = 0;
        order.products.forEach(item => {
            totalValue += item.product.prod_price * item.quantity;
        });

        let shippingCost = totalValue > 1000 ? 0 :100;
        res.render('updateOrder', {order,moment,totalValue, shippingCost})
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
}

const updateStatus = async (req, res) => {   
        const orderId = req.params.orderId;
        const status = req.body.status;
        console.log(orderId,status)
        try {
            const order = await Order.findById(orderId);
           
            if(!order){
                res.status(404).send('Order not found');
            }
            order.status = status;
            order.products.forEach(product => {
                product.productStatus = status;
            })
            await order.save();
            res.redirect('/admin/orders')

        } catch (error) {
            console.log(error)
            res.status(500).send("Error updating status")
        }
}



module.exports = {
    displayOrders,
    viewOrder,
    updateStatus
}