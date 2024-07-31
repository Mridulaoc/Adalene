const Product = require('../models/product');

const checkOfferExpiry = async (req, res, next) => {
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId);
        if (product && product.offer) {
            const now = new Date();
            if (now > new Date(product.offer.end_date)) {
                // Offer has expired, remove it
                product.offer = undefined;
                await product.save();
            }
        }
        next();
    } catch (error) {
        console.error('Error in offer expiry middleware:', error);
        next(error);
    }
};

module.exports = checkOfferExpiry;