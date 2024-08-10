const Coupon = require("../models/coupon");
const User = require("../models/user");
const moment = require("moment");

const loadCouponList = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 5;
    const couponData = await Coupon.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ expiryDate: -1 })
      .exec();

    const count = await Coupon.find().countDocuments();

    if (couponData) {
      res.render("couponList", {
        coupons: couponData,
        moment,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const loadAddCoupon = async (req, res) => {
  try {
    res.render("addCoupon");
  } catch (err) {
    console.log(err);
  }
};



const addNewCoupon = async (req, res) => {
  try {
    const { coupon, description, expiryDate, value, minPurchase } = req.body;
    const isExisting = await Coupon.findOne({
      Name:new RegExp(`^${coupon}$`, "i")
    });

    if(isExisting){
      res.render('addCoupon',{error:"Coupon name should be unique"})
    }else{
      const newCoupon = new Coupon({
        Name: coupon,
        Description: description,
        expiryDate,
        Value: value,
        MinPurchase: minPurchase,
    }) 
    
    await newCoupon.save();
    res.redirect("/admin/coupons");
    };

   
  } catch (error) {
    console.log(error);
  }
};

const loadEditCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    const coupon = await Coupon.findById({ _id: id });
    res.render("editCoupon", { coupon });
  } catch (error) {
    console.log(error);
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { coupon, description, expiryDate, value, minPurchase } = req.body;
    const id = req.params.id;
    const couponData = await Coupon.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          Name: coupon,
          Description: description,
          expiryDate: expiryDate,
          Value: value,
          MinPurchase: minPurchase,
        },
      }
    );
    res.redirect("/admin/coupons");
  } catch (error) {}
};

const deleteCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    const couponData = await Coupon.findById({ _id: id });
    if (couponData.isDeleted) {
      await Coupon.findByIdAndUpdate(
        { _id: id },
        { $set: { isDeleted: false } }
      );
      res.status(301).redirect("/admin/coupons");
    } else {
      await Coupon.findByIdAndUpdate(
        { _id: id },
        { $set: { isDeleted: true } }
      );
      res.status(301).redirect("/admin/coupons");
    }
  } catch (error) {
    console.log(error);
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user.id;
    const coupon = await Coupon.findOne({ Name: couponCode });
    if (!coupon) {
      return res.json({
        success: false,
        message: "Invalid or expired coupon code.",
      });
    }

    // Check if the coupon has expired
    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return res.json({ success: false, message: "Coupon has expired." });
    }

    // Check if the user has already used this coupon
    if (coupon.usedBy.includes(userId)) {
      return res.json({
        success: false,
        message: "You have already used this coupon.",
      });
    }

    // Check if the minimum purchase requirement is met
    const user = await User.findById(userId).populate("cart.products.product");

    let totalValue = 0;
    user.cart.products.forEach((item) => {
      totalValue += item.price * item.quantity;
    });

    
    

    if (totalValue < coupon.MinPurchase) {
      return res.json({
        success: false,
        message: `Minimum purchase of ₹${coupon.MinPurchase} required to use this coupon.`,
      });
    }

    let discount = coupon.Value;
    if (discount > totalValue) {
      discount = totalValue;
    }

    // const newTotal = totalValue - discount;
    let finalValue = totalValue > 1000 ? totalValue-discount : totalValue + 100 -discount;
    let newTotal = (totalValue/1.05)

    // Store the applied coupon in the session
    req.session.appliedCoupon = {
        Name: coupon.Name,
        discount: discount
    };

    // Mark the coupon as used by this user
    await Coupon.findByIdAndUpdate(coupon._id, { $addToSet: { usedBy: userId } });

    res.json({
        success: true,
        message: 'Coupon applied successfully!',
        newSubTotal: newTotal.toFixed(2),
        grandTotal: finalValue.toFixed(2),
        coupon: {
          Name: coupon.Name,
          discount: discount
      },
      updateCOD:true
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'An error occurred while applying the coupon.' });
  }
};

const removeCoupon = async(req,res)=>{
  try {
    const { couponCode } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId).populate("cart.products.product");
    const coupon = await Coupon.findOne({ Name: couponCode });

    let totalValue = 0;
    user.cart.products.forEach((item) => {
        totalValue += item.price * item.quantity;
    });

    
    const shippingCost = totalValue > 1000 ? 0 : 100;
    const grandTotal = totalValue + shippingCost;

    let newTotal = (totalValue/1.05).toFixed(2);

   // Remove the applied coupon from the session
   if (req.session.appliedCoupon) {
    // Remove user from the usedBy array in the coupon document
    await Coupon.findOneAndUpdate(
      { Name: req.session.appliedCoupon.Name },
      { $pull: { usedBy: userId } }
    );
    delete req.session.appliedCoupon;
  }


    res.json({
        success: true,
        message: 'Coupon removed successfully!',
        newSubTotal: newTotal,
        grandTotal: grandTotal,
        updateCOD:true,
    });

} catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'An error occurred while removing the coupon.' });
}
};


module.exports = {
  loadCouponList,
  loadAddCoupon,
  addNewCoupon,
  loadEditCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  removeCoupon
};
