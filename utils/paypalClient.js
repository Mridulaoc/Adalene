const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
let clientId = process.env.PAYPAL_CLIENT_ID;
let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

function environment() {
    let clientEnv = new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
    return clientEnv;
}

function client() {
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

module.exports = { client };
