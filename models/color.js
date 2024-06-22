const mongoose = require('mongoose');

const colorSchema = mongoose.Schema({
    color_name :{
        type : 'string'
    },
    hex_value :{
        type : 'string'
    }
});

module.exports = mongoose.model('Color', colorSchema);