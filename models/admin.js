const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    admin_name:String,
    admin_email:String,
    admin_password:String,
    admin_contact:Number
})

module.exports = mongoose.model('Admin', adminSchema);