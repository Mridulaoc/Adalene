const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    user_email :{
        type: 'string',
        required: true,
    },
    user_password:{
        type: 'string',
        required: true,
    },
    user_name:{
        type: 'string',
        required: true,
    },
    user_contact:{
        type:'number',
        required: true,
    },
    created_on:{
        default: new Date(),
        type: 'date',
    },
    user_orders:{
        type:'string',
    },
    user_address:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'UserAddress'
    },
    otp:{
        type:'string',
    },
    otp_expiry:{
        type:'string',
    },
    isVerified:{
        type:'boolean',
        default: false,
    },
    isBlocked:{
        type:'boolean',
        default: false,
    }

})

module.exports = mongoose.model("User", userSchema);