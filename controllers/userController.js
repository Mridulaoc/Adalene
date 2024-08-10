const userRoute = require("../routers/userRouter");
const bCrypt = require("bcrypt");
const User = require("../models/user");
const Products = require("../models/product");
const Category = require("../models/category");
const Size = require("../models/size");
const Color = require("../models/color");
const Wallet = require("../models/wallet");
const nodemailer = require("nodemailer");
const { session } = require("passport");
const mongoose = require("mongoose");
const Order = require("../models/order");
const Wishlist = require("../models/wishlist");
const { addToWallet } = require("./walletController");
const generateOrderId = require("../utils/orderIdGenerator");
const getSortOption = require("../utils/sortOptions");
const referralCodeGenerator = require("../utils/referralCodeGenerator");
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')

require("dotenv/config");
var moment = require("moment");
const paypal = require("@paypal/checkout-server-sdk");

let environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
let client = new paypal.core.PayPalHttpClient(environment);
const axios = require("axios");

const successGoogleLogin = async (req, res) => {
  if (req.isAuthenticated) {
    const products = await Products.find({ is_bestseller: true });
    res.render("home", { products, user: req.user });
  }
};

const failureGoogleLogin = (req, res) => {
  res.send("Error");
};

const securePassword = async (password) => {
  try {
    const hashedPassword = await bCrypt.hash(password, 10);
    return hashedPassword;
  } catch (error) {
    console.log(error.message);
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

const loadSignUp = (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error);
  }
};

const verifySignUp = async (req, res) => {
  try {
    const {
      name,
      email,
      mobileno,
      password,
      confirmPassword,
      authMethod,
      referralCode,
    } = req.body;
    const isExist = await User.findOne({ user_email: email });

    if (isExist) {
      res.render("signup", {
        message:
          "Email id already exists in the database. Use another for registration",
      });
    } else {
      let referrer;
      if (referralCode) {
        referrer = await User.findOne({ referralCode });
        if (!referrer) {
          return res.status(400).json({ message: "Invalid referral code" });
        }
      }
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpiry = new Date(Date.now() + 1 * 60000);

      const sPassword = await securePassword(password);
      const newUser = new User({
        user_name: name,
        user_email: email,
        user_contact: mobileno,
        user_password: sPassword,
        otp: otp,
        otp_expiry: otpExpiry,
        authMethod: authMethod,
        referralCode: referralCodeGenerator(),
        referredBy: referrer ? referrer._id : null,
      });
      await newUser.save();

      const newWallet = new Wallet({
        user: newUser._id,
        balance: referrer ? 100 : 0, // Give 100 to new user if they used a referral code
      });

      if (referrer) {
        newWallet.transactions.push({
          type: "CREDIT",
          amount: 100,
          description: "Referral signup bonus",
        });
      }

      await newWallet.save();
      newUser.wallet = newWallet._id;
      await newUser.save();

      if (referrer) {
        const referrerWallet = await Wallet.findOne({ user: referrer._id });
        if (referrerWallet) {
          referrerWallet.balance += 200; // Increase referrer's wallet by 200
          referrerWallet.transactions.push({
            type: "CREDIT",
            amount: 200,
            description: "Referral reward",
          });
          await referrerWallet.save();
        }

        await User.findByIdAndUpdate(referrer._id, {
          $push: { referrals: newUser._id },
        });
      }

      const mailOptions = {
        from: "mridulagirish2024@gmail.com",
        to: email,
        subject: "Email Verification from Adalene",
        text: `Your OTP code is ${otp}`,
      };
      transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          console.log(err.message);
        } else {
          console.log("Email sent successfully");
        }
      });

      res.render("verify", {
        email: email,
        user: req.user,
        success: "Email sent successfully",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadVerify = (req, res) => {
  if (req.session.userId) {
    res.redirect("/");
  } else {
    res.render("verify");
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const { digit1, digit2, digit3, digit4 } = req.body;
    const newOTP = `${digit1}${digit2}${digit3}${digit4}`;
    console.log(newOTP);
    const user = await User.findOne({ user_email: email, otp: newOTP });
    console.log(user);
    if (user) {
      const otpExpiry = user.otp_expiry;
      const otpMilliseconds = new Date(otpExpiry).getTime();

      console.log(Date.now());

      if (otpMilliseconds > Date.now()) {
        user.isVerified = true;
        user.otp = null;
        user.otp_expiry = null;
        await user.save();
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.redirect("/");
        });
      }
    } else {
      const otpExpired = true;
      res.render("verify", {
        user: req.user,
        message: "OTP expired or wrong OTP",
        email: email,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const resendOTP = async (req, res) => {
  const { email } = req.body;
  console.log(email);
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpExpiry = new Date(Date.now() + 1 * 60000);
  await User.updateOne(
    { user_email: email },
    { $set: { otp: otp, otp_expiry: otpExpiry } }
  );

  const mailOptions = {
    from: "mridulagirish2024@gmail.com",
    to: email,
    subject: "Email Verification from Adalene",
    text: `Your OTP code is ${otp}`,
  };
  transporter.sendMail(mailOptions, (err, data) => {
    if (err) {
      console.log(err.message);
    } else {
      console.log("Email sent successfully");
    }
  });

  res.render("verify", { email, user: req.user });
};

const loadSigIn = (req, res) => {
  if (req.session.userId) {
    res.redirect("/home");
  } else {
    res.render("signin");
  }
};

const verifySignIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ user_email: email });
    if (userData) {
      const passwordMatch = await bCrypt.compare(
        password,
        userData.user_password
      );
      if (passwordMatch) {
        req.session.userId = userData._id;
        res.redirect("/");
      } else {
        res.render("signin", { message: "Email or password is incorrect" });
      }
    } else {
      res.render("signin", { message: "Email or password is incorrect" });
    }
  } catch (error) {
    console.log(error);
  }
};

const loadForgotPassword = (req, res) => {
  res.render("forgotPassword", { user: req.user });
};

const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);
    const isExist = await User.findOne({ user_email: email });
    console.log(isExist);
    if (!isExist) {
      res.render("forgotPassword", {
        message: "No user with that email address",
      });
    } else {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpiry = new Date(Date.now() + 1 * 60000);
      const userData = await User.updateOne(
        { user_email: email },
        { $set: { otp: otp, otp_expiry: otpExpiry } }
      );
      const mailOptions = {
        from: "mridulagirish2024@gmail.com",
        to: email,
        subject: "Email Verification from Adalene",
        text: `Your OTP code is ${otp}`,
      };
      transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          console.log(err.message);
        } else {
          console.log("Email sent successfully");
        }
      });
      res.render("otp", {
        success: "Check your email for the OTP",
        email: email,
        user: req.user,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const verifyFPOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(email, otp);
    const user = await User.findOne({ user_email: email, otp: otp });
    const otpExpiry = user.otp_expiry;
    const otpMilliseconds = new Date(otpExpiry).getTime();
    if (user && otpMilliseconds > Date.now()) {
      user.otp = null;
      user.otp_expiry = null;
      await user.save();
      res.render("resetPassword", { email, user: req.user });
    } else {
      res.render("otp", {
        incorrect: "OTP is incorrect or expired",
        user: req.user,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const updatePassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    const user = await User.findOne({ user_email: email });
    if (!user) {
      return res.render("resetPassword", {
        message: "User not found",
        user: req.user,
      });
    }
    const sPassword = await securePassword(password);
    const userData = await User.updateOne(
      { user_email: email },
      { $set: { user_password: sPassword } }
    );
    res.render("signin");
  } catch (error) {
    console.log(error);
  }
};

const loadHome = async (req, res) => {
  try {
    if (!req.session.userId) {
      res.redirect("/");
    } else {
      if (req.isAuthenticated()) {
        console.log(req.user);
        const products = await Products.find({ is_bestseller: true });
        res.render("home", { products, user: req.user, cart: req.cart });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const loadShopall = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 5;
    const {
      sortBy = "popularity",
      order = "asc",
      excludeOutOfStock = false,
      category = "",
      maxPrice = 10000,
      color = "",
    } = req.query;

    const categories = await Category.find();
    const sizes = await Size.find();
    const colors = await Color.find();

    const sortOption = getSortOption(sortBy, order);

    let filter = {
      prod_name: { $regex: ".*" + search + ".*", $options: "i" },
      prod_price: { $lte: parseInt(maxPrice) },
    };

    if (excludeOutOfStock === "true") {
      filter.prod_quantity = { $gt: 0 };
    }

    if (category) {
      const categoryDoc = await Category.findOne({ cat_name: category });
      if (categoryDoc) {
        filter.prod_category = categoryDoc._id;
      }
    }

    if (color) {
      filter.prod_color = color;
    }

    const products = await Products.find(filter)
      .populate("prod_category")
      .populate("prod_size")
      .populate("prod_color")
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Calculate discounted prices
    const productsWithDiscounts = await Promise.all(
      products.map(async (product) => {
        let discountedPrice = product.prod_mrp;

        // Check for product-specific offer
        if (
          product.offer &&
          product.offer.discount_percentage &&
          new Date() >= product.offer.start_date &&
          new Date() <= product.offer.end_date
        ) {
          discountedPrice =
            product.prod_mrp * (1 - product.offer.discount_percentage / 100);
        } else {
          // Check for category offer
          const categoryOffer = await Category.findOne({
            _id: product.prod_category,

            "offer.start_date": { $lte: new Date() },
            "offer.end_date": { $gte: new Date() },
          });

          if (categoryOffer && categoryOffer.offer.discount_percentage) {
            discountedPrice =
              product.prod_mrp *
              (1 - categoryOffer.offer.discount_percentage / 100);
          }
        }

        return {
          ...product.toObject(),
          discountedPrice:
            discountedPrice < product.prod_mrp ? discountedPrice : null,
        };
      })
    );

    const count = await Products.find(filter).countDocuments();

    res.render("shopall", {
      products: productsWithDiscounts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      user: req.user,
      categories,
      sizes,
      colors,
      cart: req.cart,
      sortBy,
      order,
      search,
      excludeOutOfStock: excludeOutOfStock === "true",
      currentCategory: category,
      maxPrice: parseInt(maxPrice),
      selectedColors: color,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadProductDetails = async (req, res) => {
  try {
    let id = req.params.id;
    const userId = req.user ? req.user.id : null;
    let isInWishlist = false;

    console.log(id, userId, isInWishlist);

    if (userId) {
      const wishlist = await Wishlist.findOne({ user: userId });
      isInWishlist = wishlist && wishlist.products.includes(id);
    }
    const products = await Products.findById({ _id: id })
      .populate("prod_category")
      .populate("prod_size")
      .populate("prod_color");

    if (!products) {
      return res.status(404).render("error", { message: "Product not found" });
    }

    let discountedPrice = products.prod_mrp;
    let appliedOffer = null;
    const now = new Date();
    if (products.offer && new Date() <= new Date(products.offer.end_date)) {
      const productDiscount =
        products.prod_mrp * (products.offer.discount_percentage / 100);
      discountedPrice = products.prod_mrp - productDiscount;
      appliedOffer = products.offer;
    }
    if (
      products.prod_category.offer &&
      now >= new Date(products.prod_category.offer.start_date) &&
      now <= new Date(products.prod_category.offer.end_date)
    ) {
      const categoryDiscount =
        products.prod_mrp *
        (products.prod_category.offer.discount_percentage / 100);
      const categoryDiscountedPrice = products.prod_mrp - categoryDiscount;
      console.log(categoryDiscountedPrice);

      if (categoryDiscountedPrice < discountedPrice) {
        discountedPrice = categoryDiscountedPrice;
        appliedOffer = products.prod_category.offer;
      }
    }

    const relatedProducts = await Products.find({
      prod_status: "ACTIVE",
      prod_category: products.prod_category._id,
      _id: { $ne: products._id },
    })
      .populate("prod_category")
      .limit(3);
    console.log(appliedOffer);

    res.render("productDetails", {
      products,
      relatedProducts,
      discountedPrice: discountedPrice,
      user: req.user,
      cart: req.cart,
      isInWishlist,
      appliedOffer,
    });
  } catch (error) {
    console.log(error);
  }
};

const displayProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const userData = await User.findById({ _id: id });
    res
      .status(200)
      .render("profile", { userData: userData, user: req.user, moment });
  } catch (error) {
    console.log(error);
  }
};

const displayEditProfile = async (req, res) => {
  try {
    const id = req.params.id;

    const userData = await User.findById({ _id: id });

    res
      .status(200)
      .render("editProfile", { userData: userData, user: req.user });
  } catch (error) {
    console.log(error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, mobileno, gender, dateOfBirth } = req.body;
    const id = req.params.id;

    const user = await User.findById({ _id: id });
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.user_name = name;
    user.user_email = email;
    user.user_contact = mobileno;
    user.user_gender = gender;
    user.user_dob = new Date(dateOfBirth);
    await user.save();
    res.status(302).redirect("/profile");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const displayChangePassword = async (req, res) => {
  try {
    res.render("changePassword", { user: req.user });
  } catch (error) {
    console.log(error);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log(currentPassword, newPassword);

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bCrypt.compare(currentPassword, user.user_password);

    if (!isMatch) {
      res
        .status(404)
        .json({ success: false, message: "Current password is not correct" });
    }

    const hashedPassword = await securePassword(newPassword);
    user.user_password = hashedPassword;
    await user.save();

    res
      .status(404)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
};

const displayAddresses = async (req, res) => {
  try {
    const userData = await User.findById(req.user.id);
    res.status(200).render("address", { userData: userData, user: req.user });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const displayAddAddress = async (req, res) => {
  try {
    const userData = await User.findById(req.user.id);
    res
      .status(200)
      .render("addAddress", { userData: userData, user: req.user });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const addAddress = async (req, res) => {
  const { houseNo, street, city, state, zipcode, country } = req.body;
  const userId = req.user.id;
  console.log(userId);
  console.log(houseNo, street, city, state, zipcode, country);

  const newAddress = {
    houseNo: houseNo,
    street: street,
    city: city,
    state: state,
    zipCode: zipcode,
    country: country,
  };
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { addresses: newAddress } },
      { new: true, useFindAndModify: false }
    );
    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    res.status(200).redirect("/addresses");
  } catch (error) {
    console.log(error);
  }
};

const displayEditAddress = async (req, res) => {
  try {
    const addressIndex = req.params.addressIndex;
    const userData = await User.findById(req.params.id);
    const address = userData.addresses[addressIndex];
    res.status(200).render("editAddress", {
      userData: userData,
      user: req.user,
      address,
      addressIndex,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const updateAddress = async (req, res) => {
  const { houseNo, street, city, state, zipcode, country } = req.body;
  console.log(zipcode);
  const userId = req.params.id;
  const addressIndex = req.params.addressIndex;
  try {
    const user = await User.findById(userId);

    user.addresses[addressIndex] = {
      houseNo,
      street,
      city,
      state,
      zipCode: zipcode,
      country,
    };
    await user.save();
    res.status(200).redirect("/addresses");
  } catch (error) {
    console.log(error);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id, addressIndex } = req.params;
    console.log(addressIndex);
    console.log(id);
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (addressIndex >= user.addresses.length) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid address index" });
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const displayOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("products.product")
      .sort({ orderDate: -1 });
    res.render("orderHistory", { orders, user: req.user, moment });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const cancelOrder = async (req, res) => {
  try {
    console.log(req.body.orderId);
    const order = await Order.findById(req.body.orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    for (let item of order.products) {
      const product = await Products.findById(item.product);
      if (product) {
        product.prod_quantity += item.quantity;
        await product.save();
      } else {
        throw new Error(`Product with id ${item.product} not found`);
      }
    }

    if (order.paymentMethod === "PayPal") {
      // Add refund to wallet
      await addToWallet(
        order.user,
        order.total,
        `Refund for order ${order._id}`
      );
    }

    if (order.walletAmountUsed > 0) {
      // Refund the wallet amount
      const wallet = await Wallet.findOne({ user: order.user });
      wallet.balance += order.walletAmountUsed;
      wallet.transactions.push({
        type: "CREDIT",
        amount: order.walletAmountUsed,
        description: "Order cancellation refund(from wallet balance)",
      });
      await wallet.save();
    }

    order.status = "Cancelled";
    order.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const displayOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "products.product"
    );

    res.status(200).render("orderDetails", { order, user: req.user, moment });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const cancelOrderItem = async (req, res) => {
  const { orderId, productId } = req.body;
  console.log(orderId, productId);

  try {
    const order = await Order.findById(orderId);
    console.log(order);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const product = order.products.find(
      (p) => p.product.toString() === productId
    );
    console.log(product);

    if (!product) {
      return res.status(404).json({ error: "Product not found in the order" });
    }

    // Update product status
    product.productStatus = "Cancelled";

    // Update order total
    order.total = order.products.reduce((total, item) => {
      if (item.productStatus !== "Cancelled") {
        return total + item.price * item.quantity;
      }
      return total;
    }, 0);

    // Check if all products are cancelled
    const allCancelled = order.products.every(
      (item) => item.productStatus === "Cancelled"
    );
    if (allCancelled) {
      order.status = "Cancelled";
    }

    // Update product stock
    const productInStock = await Products.findById(productId);
    if (productInStock) {
      productInStock.prod_quantity += product.quantity;
      await productInStock.save();
    } else {
      throw new Error(`Product with id ${productId} not found`);
    }

    // Handle refunds
    if (order.paymentMethod === "PayPal") {
      // Add refund to wallet for the cancelled item
      await addToWallet(
        order.user,
        product.price * product.quantity,
        `Refund for item in order ${order._id}`
      );
    }

    if (order.walletAmountUsed > 0) {
      // Calculate the proportion of wallet amount used for this item
      const itemTotal = product.price * product.quantity;
      const itemWalletAmount = (itemTotal / order.total) * order.walletAmountUsed;

      // Refund the proportional wallet amount
      const wallet = await Wallet.findOne({ user: order.user });
      wallet.balance += itemWalletAmount;
      wallet.transactions.push({
        type: "CREDIT",
        amount: itemWalletAmount,
        description: "Item cancellation refund (from wallet balance)",
      });
      await wallet.save();
    }

    await order.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


const RETURN_WINDOW_DAYS = 30;
const isWithinReturnWindow = (orderDate) => {
  const now = new Date();
  const orderDateObj = new Date(orderDate);
  const diffTime = Math.abs(now - orderDateObj);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= RETURN_WINDOW_DAYS;
};
const returnOrderRequest = async (req, res) => {
  const { orderId, reason } = req.body;
  console.log(orderId, reason);

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!isWithinReturnWindow(order.orderDate)) {
      return res
        .status(400)
        .json({ success: false, message: "Return window expired" });
    }

    for (let product of order.products) {
      product.productStatus = "Return Requested";
      product.returnReason = reason;
    }

    order.status = "Return Requested";
    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};



const returnOrderItem = async (req, res) => {
  const { orderId, productId,reason } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const product = order.products.find(
      (p) => p.product.toString() === productId
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in order" });
    }

    if (!isWithinReturnWindow(order.orderDate)) {
      // Adjust according to your date field
      return res
        .status(400)
        .json({ success: false, message: "Return window expired" });
    }

    product.productStatus = "Returned";
    product.returnReason = reason;

    order.total = order.products.reduce((total, item) => {
      if (
        item.productStatus !== "Returned" &&
        item.productStatus !== "Cancelled"
      ) {
        return total + item.price * item.quantity;
      }
      return total;
    }, 0);

    const allProcessed = order.products.every(
      (item) =>
        item.productStatus === "Returned" || item.productStatus === "Cancelled"
    );
    if (allProcessed) {
      order.status = "Returned";
    }

    const productInStock = await Products.findById(productId);
    if (productInStock) {
      productInStock.quantity += product.quantity;
      await productInStock.save();
    }

    await addToWallet(
      order.user,
      product.price * product.quantity,
      `Refund for item in order ${order._id}`
    );

    if (order.walletAmountUsed > 0) {
      // Calculate the proportion of wallet amount used for this item
      const itemTotal = product.price * product.quantity;
      const itemWalletAmount = (itemTotal / order.total) * order.walletAmountUsed;

      // Refund the proportional wallet amount
      const wallet = await Wallet.findOne({ user: order.user });
      wallet.balance += itemWalletAmount;
      wallet.transactions.push({
        type: "CREDIT",
        amount: itemWalletAmount,
        description: "Item cancellation refund (from wallet balance)",
      });
      await wallet.save();
    }


    await order.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
};


const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Fetch the order details from MongoDB
    const order = await Order.findById(orderId).populate("products.product").populate('user');
  
    // Create the PDF invoice
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
    // Add the invoice content to the PDF
    page.setFont(font);
    page.setFontSize(16);
    page.drawText('Invoice', { x: 50, y: 750, color: rgb(0, 0, 0) });
  
    page.setFontSize(12);
    page.drawText(`Order ID: ${order.orderID}`, { x: 50, y: 700 });
    page.drawText(`User: ${order.user.user_name}`, { x: 50, y: 680 });
    page.drawText(`Date: ${order.orderDate.toLocaleDateString()}`, { x: 50, y: 660 });
  
    page.drawText('Items:', { x: 50, y: 640 });
    order.products.forEach((item, index) => {
      page.drawText(`- ${item.product.prod_name} (Rs.${item.price})`, { x: 70, y: 620 - index * 20 });
    });
  
    page.drawText(`Total: Rs.${order.total}`, { x: 50, y: 580 });
  
    // Save the PDF to a buffer
    const pdfBytes = await pdfDoc.save();
  
    // Set the response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${order._id}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.end(pdfBytes);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).send('Error generating invoice');
  }
 
}


// const returnOrder = async (req, res) => {
//   const { orderId } = req.body;

//   try {
//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });
//     }

//     if (!isWithinReturnWindow(order.orderDate)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Return window expired" });
//     }

//     for (let product of order.products) {
//       product.productStatus = "Returned";

//       const productInStock = await Products.findById(product.product);
//       if (productInStock) {
//         productInStock.quantity += product.quantity;
//         await productInStock.save();
//       }
//     }
//     let refundAmount;
//     if (order.subtotal < 1000) {
//       refundAmount = order.total - 100;
//     } else {
//       refundAmount = order.total; // If subtotal >= 1000, refund the full amount
//     }
//     await addToWallet(
//       order.user,
//       refundAmount,
//       `Refund for returned order ${order._id}`
//     );
//     if (order.walletAmountUsed > 0) {
//       // Refund the wallet amount
//       const wallet = await Wallet.findOne({ user: order.user });
//       wallet.balance += Number(order.walletAmountUsed);
//       wallet.transactions.push({
//         type: "CREDIT",
//         amount: Number(order.walletAmountUsed),
//         description: "Order cancellation refund (from wallet balance)",
//       });
//       await wallet.save();
//     }

//     order.status = "Returned";
//     order.total = 0;

//     await order.save();

//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal server error");
//   }
// };

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    res.status(200).json({ message: "Product added to wishlist" });
  } catch (error) {
    console.error("Error adding product to wishlist:", error);
    res.status(500).json({ error: "Failed to add product to wishlist" });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    let wishlist = await Wishlist.findOne({ user: userId });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (product) => product.toString() !== productId
      );
      await wishlist.save();
    }

    res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Error removing product from wishlist:", error);
    res.status(500).json({ error: "Failed to remove product from wishlist" });
  }
};

const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlist = await Wishlist.findOne({ user: userId }).populate(
      "products"
    );

    // Calculate discounted prices and check stock
    const productsWithDiscounts = await Promise.all(
      wishlist.products.map(async (product) => {
        let discountedPrice = product.prod_mrp;

        // Check for product-specific offer
        if (
          product.offer &&
          product.offer.discount_percentage &&
          new Date() >= product.offer.start_date &&
          new Date() <= product.offer.end_date
        ) {
          discountedPrice =
            product.prod_mrp * (1 - product.offer.discount_percentage / 100);
        } else {
          // Check for category offer
          const categoryOffer = await Category.findOne({
            _id: product.prod_category,
            "offer.start_date": { $lte: new Date() },
            "offer.end_date": { $gte: new Date() },
          });

          if (categoryOffer && categoryOffer.offer.discount_percentage) {
            discountedPrice =
              product.prod_mrp *
              (1 - categoryOffer.offer.discount_percentage / 100);
          }
        }

        return {
          ...product.toObject(),
          discountedPrice:
            discountedPrice < product.prod_mrp ? discountedPrice : null,
          inStock: product.prod_quantity > 0,
        };
      })
    );

    res.render("wishlist", {
      user: req.user.id,
      wishlist: {
        ...wishlist.toObject(),
        products: productsWithDiscounts,
      },
    });
  } catch (error) {
    console.error("Error getting wishlist:", error);
    res.status(500).json({ error: "Failed to get wishlist" });
  }
};

const getReferrals = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("referrals");
    res.render("referrals", { user });
  } catch (error) {
    console.log(error);
  }
};

const addToCart = async (req, res) => {
  if (!req.user) {
    res.redirect("/signin");
  } else {
    const { productId, quantity, maxValue } = req.body;
    const parsedQuantity = parseInt(quantity);
    const parsedMaxValue = parseInt(maxValue);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid quantity." });
    }

    const userId = req.user.id;
    try {
      let user = await User.findOne({ _id: userId });
      const product = await Products.findById(productId).populate(
        "prod_category"
      );

      if (!user || !product) {
        return res
          .status(404)
          .json({ success: false, message: "User or product not found." });
      }

      let price = product.prod_mrp;
      let offerApplied = false;
      let discountPercentage = 0;

      const now = new Date();

      // Check product offer
      if (
        product.offer &&
        now >= new Date(product.offer.start_date) &&
        now <= new Date(product.offer.end_date)
      ) {
        discountPercentage = product.offer.discount_percentage;
        offerApplied = true;
        console.log(discountPercentage);
      }

      // Check category offer
      if (
        product.prod_category &&
        product.prod_category.offer &&
        now >= new Date(product.prod_category.offer.start_date) &&
        now <= new Date(product.prod_category.offer.end_date)
      ) {
        if (
          product.prod_category.offer.discount_percentage > discountPercentage
        ) {
          discountPercentage = product.prod_category.offer.discount_percentage;
          offerApplied = true;
        }
      }

      // Apply the highest discount
      if (offerApplied) {
        price = product.prod_mrp * (1 - discountPercentage / 100);
      }

      const productIndex = user.cart.products.findIndex(
        (p) => p.product.toString() === productId
      );

      if (productIndex > -1) {
        user.cart.products[productIndex].quantity += parsedQuantity;
        user.cart.products[productIndex].quantity = Math.min(
          user.cart.products[productIndex].quantity,
          parsedMaxValue
        );
        user.cart.products[productIndex].price = price;
      } else {
        user.cart.products.push({
          product: new mongoose.Types.ObjectId(productId),
          quantity: parseInt(quantity),
          price: price,
        });
      }

      await user.save();
      res.json({
        success: true,
        message: "Product added to cart successfully!",
        offerApplied: offerApplied,
      });
    } catch (error) {
      console.error(error);
      res.json({ success: false, message: "Failed to add product to cart." });
    }
  }
};

const loadCartPage = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById({ _id: id }).populate({
      path: "cart.products.product",
      populate: {
        path: "prod_color",
        model: "Color",
      },
    });

    let totalValue = 0;
    user.cart.products.forEach((item) => {
      totalValue += item.price * item.quantity;
    });

    res.status(200).render("cart", {
      cart: user.cart,
      user: req.user,
      totalValue: totalValue.toFixed(2),
    });
  } catch (error) {
    console.log(error);
  }
};

const updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const user = await User.findById({ _id: req.user.id });

    const product = await Products.findById(productId).populate(
      "prod_category"
    );

    if (!user || !product) {
      return res
        .status(404)
        .json({ success: false, message: "User or product not found." });
    }

    let price = product.prod_mrp;
    let offerApplied = false;
    let discountPercentage = 0;

    const now = new Date();

    // Check product offer
    if (
      product.offer &&
      now >= new Date(product.offer.start_date) &&
      now <= new Date(product.offer.end_date)
    ) {
      discountPercentage = product.offer.discount_percentage;
      offerApplied = true;
      console.log(discountPercentage);
    }

    // Check category offer
    if (
      product.prod_category &&
      product.prod_category.offer &&
      now >= new Date(product.prod_category.offer.start_date) &&
      now <= new Date(product.prod_category.offer.end_date)
    ) {
      if (
        product.prod_category.offer.discount_percentage > discountPercentage
      ) {
        discountPercentage = product.prod_category.offer.discount_percentage;
        offerApplied = true;
      }
    }

    // Apply the highest discount
    if (offerApplied) {
      price = product.prod_mrp * (1 - discountPercentage / 100);
    }

    const productIndex = user.cart.products.findIndex(
      (item) => item.product._id.toString() === productId
    );

    if (productIndex !== -1) {
      user.cart.products[productIndex].quantity = parseInt(quantity);
      user.cart.products[productIndex].price = price;
      await user.save();
      res.json({ success: true });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart" });
    }
  } catch (error) {
    console.log(error);
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.body;
    console.log(productId);
    const user = await User.findById({ _id: req.user.id });
    user.cart.products = user.cart.products.filter(
      (item) => item.product.toString() != productId
    );
    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

const countCartItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const cartCount = user.cart.items.length;
    res.json({ count: cartCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const displayAddressSelection = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).render("addressSelection", { user });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const selectedAddress = async (req, res) => {
  const { selectedAddress } = req.body;

  if (!selectedAddress) {
    res.status(302).redirect("/checkout");
  }
  req.session.selectedAddress = selectedAddress;
  res.redirect("/payment");
};

const displayPayment = async (req, res) => {
  const selectedAddressId = req.session.selectedAddress;

  try {
    const id = req.user.id;
    const user = await User.findById({ _id: id }).populate({
      path: "cart.products.product",
      populate: {
        path: "prod_color",
        model: "Color",
      },
    });

    let totalValue = 0;
    user.cart.products.forEach((item) => {
      totalValue += item.price * item.quantity;
    });

    const selectedAddress = user.addresses.id(selectedAddressId);
    console.log(selectedAddress);
    if (!selectedAddress) {
      res.redirect("/checkout");
    }

    res.render("payment", {
      user,
      selectedAddress,
      cart: user.cart,
      totalValue: totalValue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const processPayment = async (req, res) => {
  const { paymentMethod, useWalletAmount, couponCode } = req.body;
  const selectedAddressId = req.session.selectedAddress;
  console.log(paymentMethod, selectedAddressId, couponCode);

  try {
    const user = await User.findById(req.user.id).populate({
      path: "cart.products.product",
      populate: {
        path: "prod_category",
        model: "Category",
      },
    });

    let wallet = await Wallet.findOne({ user: req.user.id });
    const selectedAddress = user.addresses.id(selectedAddressId);

    let subTotal = 0;
    let totalDiscountPercentage = 0;
    const now = new Date();

    user.cart.products.forEach((item) => {
      let productPrice = item.product.prod_mrp;
      let discountPercentage = 0;

      // Check product offer
      if (
        item.product.offer &&
        now >= new Date(item.product.offer.start_date) &&
        now <= new Date(item.product.offer.end_date)
      ) {
        discountPercentage = Math.max(
          discountPercentage,
          item.product.offer.discount_percentage
        );
      }

      if (
        item.product.prod_category &&
        item.product.prod_category.offer &&
        now >= new Date(item.product.prod_category.offer.start_date) &&
        now <= new Date(item.product.prod_category.offer.end_date)
      ) {
        discountPercentage = Math.max(
          discountPercentage,
          item.product.prod_category.offer.discount_percentage
        );
      }
      if (discountPercentage > 0) {
        productPrice *= 1 - discountPercentage / 100;
      }
      subTotal += productPrice * item.quantity;
      totalDiscountPercentage += discountPercentage * item.quantity;
    });

    const averageDiscountPercentage =
      totalDiscountPercentage /
      user.cart.products.reduce((sum, item) => sum + item.quantity, 0);

    let discount = 0;
    if (req.session.appliedCoupon) {
      discount = req.session.appliedCoupon.discount;

      // Remove the coupon from the session after using it
      delete req.session.appliedCoupon;
    }

    let totalAfterDiscount = subTotal - discount;
    let shippingCost = totalAfterDiscount > 1000 ? 0 : 100;
    let finalValue = totalAfterDiscount + shippingCost;

    let walletAmountToUse = Math.min(
      parseFloat(useWalletAmount) || 0,
      wallet.balance,
      finalValue
    );

    if (paymentMethod === "wallet") {
      if (wallet.balance < finalValue) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      walletAmountToUse = finalValue;
    }

    if (walletAmountToUse > 0) {
      wallet.balance -= walletAmountToUse;
      wallet.transactions.push({
        type: "DEBIT",
        amount: walletAmountToUse,
        description: "Purchase payment",
      });
      await wallet.save();
      // finalValue -= walletAmountToUse;
    }

    const newOrder = new Order({
      orderId: generateOrderId(),
      user: user._id,
      address: `${selectedAddress.houseNo},${selectedAddress.street},${selectedAddress.city},${selectedAddress.country},${selectedAddress.zipCode}`,
      paymentMethod: paymentMethod,
      products: user.cart.products.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: subTotal,
      discount: discount,
      shippingCost: shippingCost,
      total: finalValue,
      coupon: couponCode,
      walletAmountUsed: walletAmountToUse,
      averageDiscountPercentage: averageDiscountPercentage.toFixed(2),
      paymentStatus: "Completed",
    });

    console.log(newOrder);
    await newOrder.save();

    for (let item of user.cart.products) {
      await Products.findByIdAndUpdate(item.product._id, {
        $inc: { prod_quantity: -item.quantity },
      });
    }

    user.user_orders.push(newOrder._id);
    user.cart.products = [];
    await user.save();

    res.json({ success: true, orderId: newOrder._id });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred during payment processing" });
  }
};

async function convert(price) {
  const host = "api.frankfurter.app";

  try {
    const response = await axios.get(
      `https://${host}/latest?amount=${price}&from=INR&to=USD`
    );
    const data = response.data;
    return data.rates.USD;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    throw error; // Ensure the error is propagated
  }
}

const createPaypalOrder = async (req, res) => {
  try {
    const { selectedAddress, useWalletAmount, couponCode } = req.body;

    const user = await User.findById(req.user.id).populate({
      path: "cart.products.product",
      populate: {
        path: "prod_category",
        model: "Category",
      },
    });

    let wallet = await Wallet.findOne({ user: req.user.id });

    let subTotal = 0;
    let totalDiscountPercentage = 0;
    const now = new Date();

    user.cart.products.forEach((item) => {
      let productPrice = item.product.prod_mrp;
      let discountPercentage = 0;

      // Check product offer
      if (
        item.product.offer &&
        now >= new Date(item.product.offer.start_date) &&
        now <= new Date(item.product.offer.end_date)
      ) {
        discountPercentage = Math.max(
          discountPercentage,
          item.product.offer.discount_percentage
        );
      }
      if (
        item.product.prod_category &&
        item.product.prod_category.offer &&
        now >= new Date(item.product.prod_category.offer.start_date) &&
        now <= new Date(item.product.prod_category.offer.end_date)
      ) {
        discountPercentage = Math.max(
          discountPercentage,
          item.product.prod_category.offer.discount_percentage
        );
      }
      if (discountPercentage > 0) {
        productPrice *= 1 - discountPercentage / 100;
      }
      subTotal += productPrice * item.quantity;
      totalDiscountPercentage += discountPercentage * item.quantity;
    });

    // Calculate average discount percentage
    const averageDiscountPercentage =
      totalDiscountPercentage /
      user.cart.products.reduce((sum, item) => sum + item.quantity, 0);

    let discount = 0;
    if (req.session.appliedCoupon) {
      discount = req.session.appliedCoupon.discount;
      coupon = req.session.appliedCoupon.Name;
      delete req.session.appliedCoupon;
    }

    let totalAfterDiscount = subTotal - discount;
    let shippingCost = totalAfterDiscount > 1000 ? 0 : 100;
    let finalValue = totalAfterDiscount + shippingCost;

    const walletAmountToUse = Math.min(
      parseFloat(useWalletAmount) || 0,
      wallet.balance,
      finalValue
    );

    if (walletAmountToUse > 0) {
      finalValue -= walletAmountToUse;
    }

    let convertedPrice = await convert(finalValue);

    const requestBody = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: convertedPrice.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${process.env.BASE_URL}/paypal-success`,
        cancel_url: `${process.env.BASE_URL}/order-history`,
      },
    };

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody(requestBody);

    const order = await client.execute(request);

    const newOrder = new Order({
      user: req.user.id,
      products: user.cart.products.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price, // Add the price here
      })),
      subtotal: subTotal,
      discount: discount,
      shippingCost: shippingCost,
      total: finalValue,
      status: "Pending",
      paypalOrderId: order.result.id,
      paymentMethod: "PayPal",
      address: `${selectedAddress.houseNo},${selectedAddress.street},${selectedAddress.city},${selectedAddress.country},${selectedAddress.zipCode}`,
      orderId: generateOrderId(),
      walletAmountUsed: walletAmountToUse,
      coupon: couponCode,
      averageDiscountPercentage: averageDiscountPercentage.toFixed(2),
      paymentStatus: "Failed",
    });

    if (walletAmountToUse > 0) {
      wallet.balance -= walletAmountToUse;
      wallet.transactions.push({
        type: "DEBIT",
        amount: walletAmountToUse,
        description: "Purchase payment (Pending, PayPal)",
      });
      await wallet.save();
    }

    user.cart.products = [];
    await newOrder.save();
    await user.save();

    res.json({ id: order.result.id });
  } catch (error) {
    console.error("Create PayPal Order Error:", error);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
};

const paypalSuccess = async (req, res) => {
  try {
    const { orderID } = req.body;

    const request = new paypal.orders.OrdersGetRequest(orderID);
    const order = await client.execute(request);

    const { purchase_units } = order.result;
    const userEmail = order.result.payer.email_address;

    const user = await User.findOne({ email: userEmail }).populate(
      "cart.products.product"
    );

    const existingOrder = await Order.findOne({ paypalOrderId: orderID });
    console.log(existingOrder);

    if (existingOrder) {
      console.log(order.result.status);
      // If the order already exists, update it
      if (order.result.status === "COMPLETED") {
        existingOrder.status = "Pending";
        existingOrder.paymentStatus = "Completed";

        if (existingOrder.walletAmountUsed > 0) {
          const wallet = await Wallet.findOne({ user: existingOrder.user });
          // Ensure the wallet balance is correctly deducted
          wallet.transactions.push({
            type: "DEBIT",
            amount: existingOrder.walletAmountUsed,
            description: "Purchase payment (PayPal)",
          });
          await wallet.save();
        }
      } else {
        console.log("error");
        existingOrder.status = "Payment Failed";
        existingOrder.paymentStatus = "Failed";
      }
      await existingOrder.save();
      if (existingOrder.paymentStatus === "Failed") {
        res.redirect("/order-history");
      } else {
        res.redirect(`/order-confirmation/${existingOrder._id}`);
      }
    } else {
      const userEmail = order.result.payer.email_address;
      const user = await User.findOne({ email: userEmail }).populate({
        path: "cart.products.product",
        populate: {
          path: "prod_category",
          model: "Category",
        },
      });

      let totalDiscountPercentage = 0;
      const now = new Date();

      user.cart.products.forEach((item) => {
        let discountPercentage = 0;

        // Check product offer
        if (
          item.product.offer &&
          now >= new Date(item.product.offer.start_date) &&
          now <= new Date(item.product.offer.end_date)
        ) {
          discountPercentage = Math.max(
            discountPercentage,
            item.product.offer.discount_percentage
          );
        }

        // Check category offer
        if (
          item.product.prod_category &&
          item.product.prod_category.offer &&
          now >= new Date(item.product.prod_category.offer.start_date) &&
          now <= new Date(item.product.prod_category.offer.end_date)
        ) {
          discountPercentage = Math.max(
            discountPercentage,
            item.product.prod_category.offer.discount_percentage
          );
        }

        totalDiscountPercentage += discountPercentage * item.quantity;
      });

      const averageDiscountPercentage =
        totalDiscountPercentage /
        user.cart.products.reduce((sum, item) => sum + item.quantity, 0);

      const newOrder = new Order({
        orderId: generateOrderId(),
        user: user._id,
        address: purchase_units[0].shipping.address.address_line_1,
        paymentMethod: "Paypal",
        products: user.cart.products.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
        })),
        total: purchase_units[0].amount.value,
        paypalOrderId: orderID,
        status: "Pending",
        averageDiscountPercentage: averageDiscountPercentage.toFixed(2),
        paymentStatus: "Completed",
      });

      if (order.result.status === "COMPLETED") {
        for (let item of user.cart.products) {
          await Products.findByIdAndUpdate(item.product._id, {
            $inc: { prod_quantity: -item.quantity },
          });
        }

        user.user_orders.push(newOrder._id);
        user.cart.products = [];
        await user.save();
      }

      await newOrder.save();
      res.redirect(`/order-confirmation/${newOrder._id}`);
    }
  } catch (error) {
    console.error("PayPal Success Error:", error);
    res.redirect("/order-history");
  }
};

const displayOrderConfirmation = async (req, res) => {
  try {
    const orderID = req.params.orderId;
    let order = await Order.findById(orderID).catch(() => null);

    if (!order) {
      order = await Order.findOne({ paypalOrderId: orderID });
    }
    if (!order) {
      console.log("Order not found for ID:", orderID);
      return res.status(404).json({ message: "Order not found" });
    }
    console.log("Order found:", order);
    res.render("orderConfirmation", { order, user: req.user });
  } catch (error) {
    console.error("Error in displayOrderConfirmation:", error);
    res.status(500).json({
      message: "An error occurred while fetching the order",
      error: error.message,
    });
  }
};

const userSignOut = async (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  } catch (error) {
    console.log(error);
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const categories = await Category.find({});
    const {
      categoryId,
      page = 1,
      limit = 10,
      sortBy = "popularity",
    } = req.query;
    console.log(categoryId);

    let filter = {
      is_deleted: false,
      prod_status: "ACTIVE",
      prod_category: ObjectId(categoryId),
    };

    const sortOptions = {
      popularity: { prod_rating: -1 },
      priceAsc: { prod_price: 1 },
      priceDesc: { prod_price: -1 },
      avgRating: { prod_rating: -1 },
      featured: { is_bestseller: -1 },
      newArrivals: { created_on: -1 },
      aToZ: { prod_name: 1 },
      zToA: { prod_name: -1 },
    };

    const products = await Products.find(filter)
      .sort(sortOptions[sortBy])
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalProducts = await Products.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const createPaypalOrderForRetry = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(orderId);
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Create PayPal order
    let convertedPrice = await convert(order.total);

    const requestBody = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: convertedPrice.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${process.env.BASE_URL}/paypal-success`,
        cancel_url: `${process.env.BASE_URL}/order-history`,
      },
    };

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody(requestBody);

    const paypalOrder = await client.execute(request);

    // Update the order with new PayPal order ID
    order.paypalOrderId = paypalOrder.result.id;
    await order.save();
    res.json({ id: paypalOrder.result.id });
  } catch (error) {
    console.error("Create PayPal Order for Retry Error:", error);
    res.status(500).json({ error: "Failed to create PayPal order for retry" });
  }
};

module.exports = {
  loadSignUp,
  verifySignUp,
  loadVerify,
  verifyOTP,
  resendOTP,
  successGoogleLogin,
  failureGoogleLogin,
  loadSigIn,
  verifySignIn,
  loadHome,
  loadForgotPassword,
  requestOtp,
  verifyFPOTP,
  updatePassword,
  loadShopall,
  loadProductDetails,
  userSignOut,
  addToCart,
  loadCartPage,
  updateCart,
  removeCartItem,
  displayProfile,
  displayEditProfile,
  updateProfile,
  displayAddresses,
  displayAddAddress,
  addAddress,
  displayEditAddress,
  updateAddress,
  displayAddressSelection,
  selectedAddress,
  displayPayment,
  processPayment,
  displayOrderConfirmation,
  displayOrderHistory,
  cancelOrder,
  displayOrderDetails,
  cancelOrderItem,
  getProductsByCategory,
  countCartItems,
  deleteAddress,
  displayChangePassword,
  changePassword,
  returnOrderItem,
  // returnOrder,
  paypalSuccess,
  createPaypalOrder,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  getReferrals,
  createPaypalOrderForRetry,
  returnOrderRequest,
  downloadInvoice
};
