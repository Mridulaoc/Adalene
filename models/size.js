const mongoose = require('mongoose');

const sizeSchema = mongoose.Schema({
    size :{
        type : 'string'
    }
});

module.exports = mongoose.model('Size', sizeSchema);