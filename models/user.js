const mongoose = require('mongoose');
const product = require('./product');
const passportLocalMongoose = require('passport-local-mongoose');
const { type } = require('express/lib/response');

const userSchema = mongoose.Schema({
    user_email :{
        type: 'string',
        required: true,
    },
    user_password:{
        type: 'string',
        required: false,
    },
    user_name:{
        type: 'string',
        required: true,
    },
    user_contact:{
        type:'number',
        required: false,
    },
    user_gender:{
        type: 'string',

    },
    user_dob:{
        type:'date',
    },
    created_on:{
        default: new Date(),
        type: 'date',
    },
    user_orders:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    addresses:[{
        houseNo:{
            type: 'string',
            required:true,
        },
        street: {
            type: 'string',
            required: true
          },
          city: {
            type: 'string',
            required: true
          },
          state: {
            type: 'string',
            required: true
          },
          zipCode: {
            type: 'string',
            required: true
          },
          country: {
            type: 'string',
            required: true
          }        
    }],
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
    },

    user_googleId:{
        type:'string',
    },

    cart:{
        products:[{
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Product',
                required:true
            },
            quantity:{
                type:'Number',
                default:1,
                required:true
            }
        }]
    },
    authMethod: {
         type: String,
         enum: ['local', 'google'],
          required: true
         }

})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);