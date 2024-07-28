const axios = require('axios');
const order = require('../models/order');

async function generateAccessToken (){
    const response = await axios({
        url:process.env.PAYPAL_BASE_URL + '/v1/oauth2/token',
        method: 'POST',
        data:'grant_type=client_credentials',
        auth:{
            username : process.env.PAYPAL_CLIENT_ID,
            password : process.env.PAYPAL_CLIENT_SECRET,
        }
       
    })
    
    return response.data.access_token;
}

