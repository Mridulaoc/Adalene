const Order = require('../models/order')
const User = require('../models/user');
const Product = require('../models/product');
const Wallet = require('../models/wallet');
const moment = require('moment');
const { addToWallet } = require("./walletController");

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
            if (status === "Return Request Accepted") {
                for (let product of order.products) {
                    product.productStatus = "Returned";
              
                    const productInStock = await Product.findById(product.product);
                    if (productInStock) {
                      productInStock.quantity += product.quantity;
                      await productInStock.save();
                    }
                  }
                  let refundAmount;
                  if (order.subtotal < 1000) {
                    refundAmount = order.total - 100;
                  } else {
                    refundAmount = order.total; // If subtotal >= 1000, refund the full amount
                  }
                  await addToWallet(
                    order.user,
                    refundAmount,
                    `Refund for returned order ${order._id}`
                  );
                  if (order.walletAmountUsed > 0) {
                    // Refund the wallet amount
                    const wallet = await Wallet.findOne({ user: order.user });
                    wallet.balance += Number(order.walletAmountUsed);
                    wallet.transactions.push({
                      type: "CREDIT",
                      amount: Number(order.walletAmountUsed),
                      description: "Order cancellation refund (from wallet balance)",
                    });
                    await wallet.save();
                  }
              
                  order.status = "Returned";
                  order.total = 0;
              
                  await order.save();
              
                  res.redirect('/admin/orders')
            }else{
            order.status = status;
            order.products.forEach(product => {
                product.productStatus = status;
            })
            await order.save();
            res.redirect('/admin/orders')
            } 
           

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