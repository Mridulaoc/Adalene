const express = require('express');
const Product = require('../models/product');
const User = require('../models/user');
const Cart = require('../models/cart');
const Size = require('../models/size');
const Color = require('../models/color');

const router = express.Router();

// Product description page
router.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id).populate('availableSizes availableColors');
    res.render('product', { product });
});

// Add to cart
router.post('/add-to-cart', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const { productId, quantity, size, color } = req.body;
    const user = await User.findById(req.session.user._id).populate('cartId');
    
    let cart = user.cartId;
    if (!cart) {
        cart = new Cart({ userId: user._id, items: [] });
        user.cartId = cart._id;
        await user.save();
    }

    const cartItemIndex = cart.items.findIndex(ci => 
        ci.productId.toString() === productId &&
        ci.size.toString() === size &&
        ci.color.toString() === color
    );

    if (cartItemIndex >= 0) {
        cart.items[cartItemIndex].quantity += Number(quantity);
    } else {
        cart.items.push({ productId, quantity, size, color });
    }

    await cart.save();
    res.redirect('/cart');
});

module.exports = router;