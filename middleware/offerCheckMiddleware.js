const Product = require("../models/product");

const checkOfferExpiry = async (req, res, next) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId).populate("prod_category");
    
    const now = new Date();

    if (product && product.offer && now > new Date(product.offer.end_date)) {
          
        product.offer = undefined;
        await product.save();      
    }

    if (product.prod_category.offer && now > new Date(product.prod_category.offer.end_date)) {
        product.prod_category.offer.is_active = false;
        await product.prod_category.save();
    }

    next();
  } catch (error) {
    console.error("Error in offer expiry middleware:", error);
    next(error);
  }
};

module.exports = checkOfferExpiry;
