// models/coupon.js
const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const couponSchema = mongoose.Schema({
  Name: {
    type: String,
    required: true
  },
  Description: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  Value: {
    type: Number,
    required: true
  },
  MinPurchase: {
    type: Number,
    default: 0,
  },
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDeleted:{
    type:Boolean,
    default:false
  },
  
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);