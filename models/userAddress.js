const mongoose = require('mongoose');

const userAddressSchema = mongoose.Schema({
    shipping_address :{
        type:'object',
        
    }
})

module.exports = mongoose.model("UserAddress", userAddressSchema);