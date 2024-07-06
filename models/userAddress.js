const mongoose = require('mongoose');

const userAddressSchema = mongoose.Schema({
   address :[{
        type:'object',
        
    }]
})

module.exports = mongoose.model("UserAddress", userAddressSchema);