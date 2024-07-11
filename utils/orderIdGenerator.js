const crypto = require('crypto');

function generateOrderId() {
    
    const randomString = crypto.randomBytes(4).toString('hex');
    return `#AD-${randomString}`;
}

module.exports = generateOrderId;