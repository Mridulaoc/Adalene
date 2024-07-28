const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    orderId:{
        type:String,
        required:true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address:{
        type:String,
        required: true
    },
    paymentMethod:{
        type: String,        
        required: true,        
    },

    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            productStatus: {
                type: String,
                default: 'Pending'
            }

        }
    ],

    subtotal:{
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    status:{
        type: String,
        default: 'Pending'
    },
    paypalOrderId: {
         type: String 
    },
    refundId: {
        type: String,
    },
    refundStatus: {
        type: String,
        enum: ['Not Applicable', 'Pending', 'Completed', 'Failed'],
        default: 'Not Applicable'
    },
    refundAmount: {
        type: Number,
    },
    refundDate: {
        type: Date,
    },
    refundError: {
        type: String,
    },
    walletAmountUsed:{
        type:Number,
    },
    discount:{
        type: Number,
    }
})

module.exports = mongoose.model('Order', orderSchema)