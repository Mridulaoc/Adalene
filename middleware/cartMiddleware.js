const User = require('../models/user');

module.exports.attachCartData = async (req, res, next) => {
    if (req.isAuthenticated) {
        try {
            const user = await User.findById(req.user.id).populate('cart.products.product');
            req.cart = user.cart;
        } catch (error) {
            console.error('Error fetching cart data:', error);
        }
    }
    next();
};