const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    prod_name :{
        type : 'string',
        required : true,
    },
    prod_desc:{
        type: 'string',
        required:true,
    },
    prod_price:{
        type: 'number',
        required:true,
    },
    prod_category:{
        type: mongoose.Schema.Types.ObjectId,
        
        ref:'Category',
    },
    prod_images:{
        type:['string'],
        required:false,
    },
    prod_size:{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Size',        
    },
    prod_color:{
        type:mongoose.Schema.Types.ObjectId,
        ref : 'Color',
       
    },
    prod_quantity:{
        type:'number',
        
    },
    prod_rating:{
        type:'number',
    },
    prod_reviews:{
        type:'number',
    },
    created_on:{
        type: 'date',
        default: new Date,
    },
    is_bestseller:{
        type:'boolean',
        default: false,
    },
    is_deleted:{
        type:'boolean',
        default: false,
    },
    prod_status:{
        type: 'string',
        enum:['ACTIVE','INACTIVE'],
        default: 'ACTIVE'
    }
})

module.exports = mongoose.model('Product', productSchema);