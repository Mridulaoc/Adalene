const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
     
    },
    amount: {
      type: Number,
      
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Wallet', WalletSchema);