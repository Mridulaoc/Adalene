const Wishlist = require('../models/wishlist');

const getWishlistCount = async (req, res, next) => {
  if (req.user) {
    try {
      const wishlist = await Wishlist.findById(req.user.id );
      res.locals.wishlistCount = wishlist ? wishlist.products.length : 0;
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
      res.locals.wishlistCount = 0;
    }
  } else {
    res.locals.wishlistCount = 0;
  }
  next();
};

module.exports = getWishlistCount;