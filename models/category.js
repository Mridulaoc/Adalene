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
        name:{
            type:'string',            
        },
        description:{
            type:'string',
            
        },
        discount_percentage: {
            type: Number,
            min: 0,
            max: 100
        },
        start_date: Date,
        end_date: Date,
        is_active: {
            type: Boolean,
            default: false
        }
    },
})

module.exports = mongoose.model('Category', categorySchema);