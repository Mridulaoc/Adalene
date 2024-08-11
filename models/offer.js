const { type } = require('express/lib/response');
const mongoose = require('mongoose');


const offerSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    discount_percentage:{
        type:Number,
        required:true,
    },
    start_date:{
        type:Date,
        required:true,
    },
    end_date:{
        type:Date,
        required:true,
    }
})

module.exports = mongoose.model('Offer', offerSchema);