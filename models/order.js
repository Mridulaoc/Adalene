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
    }
})

module.exports = mongoose.model('Order', orderSchema)