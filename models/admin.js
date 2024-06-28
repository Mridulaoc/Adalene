const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    admin_name:String,
    admin_email:String,
    admin_password:String,
    admin_contact:Number,
    is_admin:{
        type:Boolean,
        default:true

    }
})

module.exports = mongoose.model('Admin', adminSchema);