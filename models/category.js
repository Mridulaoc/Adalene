const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    cat_name: {
        type: 'string',
        required: true
    },
    cat_desc:{
        type: 'string',
        required: true
    },
    is_Deleted:{
        type: 'boolean',
        default: false
        
    },
    created_on:{
        type:'date',
        default: new Date,
    },
    updated_on:{
        type:'date',
        default: new Date,
    },
    cat_status:{
        type: 'string',
        enum:['ACTIVE','INACTIVE'],
        default: 'ACTIVE'
    },
    offer: {
        type:mongoose.Schema.Types.ObjectId,
        ref : 'Offer',
        default: null
    },
})

module.exports = mongoose.model('Category', categorySchema);