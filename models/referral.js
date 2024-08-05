
const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referralProgram: {
    newUserReward: { 
        type: Number,
        default: 100
     },
    referrerReward: {
         type: Number,
         default: 200
     }
  }
});

module.exports = mongoose.model('Referrals', referralSchema);