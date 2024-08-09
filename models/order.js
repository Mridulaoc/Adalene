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
            originalPrice:{
                type: Number,
                
            },
            offerApplied:{
                type:Boolean,
            },
            productStatus: {
                type: String,
                default: 'Pending'
            },
            returnReason:{
                type: String,
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
        default: 0,
    },
    coupon:{
        type: String,
    },
    averageDiscountPercentage:{
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Failed', 'Completed'],
        default: 'Pending'
    },
    returnReason:{
        type: String,
    }
})

module.exports = mongoose.model('Order', orderSchema)