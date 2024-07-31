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
    const { name, email, mobileno, password, confirmPassword, authMethod } =
      req.body;
    console.log(password, confirmPassword);
    const isExist = await User.findOne({ user_email: email });
    console.log(isExist);
    if (isExist) {
      res.render("signup", {
        message:
          "Email id already exists in the database. Use another for registration",
      });
    } else {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpiry = new Date(Date.now() + 1 * 60000);

      const sPassword = await securePassword(password);
      const user = new User({
        user_name: name,
        user_email: email,
        user_contact: mobileno,
        user_password: sPassword,
        otp: otp,
        otp_expiry: otpExpiry,
        authMethod: authMethod,
        referralCode: referralCodeGenerator(),
      });
      await user.save();
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
    } = req.query;

    const categories = await Category.find();
    const sizes = await Size.find();
    const colors = await Color.find();

    const sortOption = getSortOption(sortBy, order);
    let filter = { prod_name: { $regex: ".*" + search + ".*", $options: "i" } };
    if (excludeOutOfStock === "true") {
      filter.prod_quantity = { $gt: 0 };
    }

    const products = await Products.find(filter)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Products.find({
      prod_name: { $regex: ".*" + search + ".*", $options: "i" },
    }).countDocuments();
    res.render("shopall", {
      products,
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
    });
  } catch (error) {
    console.log(error);
  }
};


// const loadShopall = async(req,res) => {
//   try {
//     let {
//       search = "",
//       page = 1,
//       sortBy = "popularity",
//       order = "asc",
//       excludeOutOfStock = false,
//       category = "",
//       colors = "",
//       maxPrice = "",
//     } = req.query;

//     const limit = 5 ;

//     const categories = await Category.find();
//     const allColors = await Color.find();

//     const sortOption = getSortOption(sortBy, order);
//     let filter = { prod_name: { $regex: ".*" + search + ".*", $options: "i" } };
    
//     if (excludeOutOfStock === "true") {
//       filter.prod_quantity = { $gt: 0 };
//     }

//     if (category) {
//       filter.category = category;
//     }

//     if (colors) {
//       filter.color = { $in: colors.split(',') };
//     }

//     if (maxPrice) {
//       filter.prod_price = { $lte: Number(maxPrice) };
//     }

//     const products = await Products.find(filter)
//       .sort(sortOption)
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .exec();

//       const count = await Products.find(filter).countDocuments();

//       if (req.xhr) {
//         // If it's an AJAX request, only send the necessary HTML
//         return res.render("layout/productList", {
//           products,
//           totalPages: Math.ceil(count / limit),
//           currentPage: page,
//         });
//       }

//       res.render("shopall", {
//         products,
//         totalPages: Math.ceil(count / limit),
//         currentPage: page,
//         user: req.user,
//         categories,
//         colors: allColors,
//         cart: req.cart,
//         sortBy,
//         order,
//         search,
//         excludeOutOfStock: excludeOutOfStock === "true",
//         selectedCategory: category,
//         selectedColors: colors.split(','),
//         maxPrice,
//       });

//   } catch (error) {
//     console.log(error);
//     res.status(500).send("An error occurred");
//   }
// }

const loadBags = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
      console.log(search);
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const categories = await Category.find();
    const sizes = await Size.find();
    const colors = await Color.find();

    const limit = 5;

    const { sortBy = "popularity", order = "asc",excludeOutOfStock = false } = req.query;

    const sortOption = getSortOption(sortBy, order);

    let filter = {
       prod_name: { $regex: ".*" + search + ".*", $options: "i" },
       prod_category: "66702daed57b7afd0c8cafe1"
    };
    if (excludeOutOfStock === "true") {
      filter.prod_quantity = { $gt: 0 };
      
    }

    const bagsData = await Products.find(filter)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("prod_category")
      .exec();

    const count = await Products.find(filter).countDocuments();

    res.render("bags", {
      products: bagsData,
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
    });
  } catch (error) {
    console.log(error);
  }
};

const loadWallets = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
      console.log(search);
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const categories = await Category.find();
    const sizes = await Size.find();
    const colors = await Color.find();

    const limit = 5;

    const { sortBy = "popularity", order = "asc",excludeOutOfStock = false  } = req.query;

    const sortOption = getSortOption(sortBy, order);

    let filter = {
      prod_name: { $regex: ".*" + search + ".*", $options: "i" },
      prod_category:  "6673eca9e5d3e08f0ce33581"
   };
   if (excludeOutOfStock === "true") {
     filter.prod_quantity = { $gt: 0 };
     
   }
    const walletData = await Products.find(filter)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("prod_category")
      .exec();

    const count = await Products.find(filter).countDocuments();

    res.render("wallets", {
      products: walletData,
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
    });
  } catch (error) {
    console.log(error);
  }
};
const loadBelts = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
      console.log(search);
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const categories = await Category.find();
    const sizes = await Size.find();
    const colors = await Color.find();

    const limit = 5;

    const { sortBy = "popularity", order = "asc",excludeOutOfStock = false } = req.query;

    const sortOption = getSortOption(sortBy, order);

    let filter = {
      prod_name: { $regex: ".*" + search + ".*", $options: "i" },
      prod_category:  "6673ecb8e5d3e08f0ce33584"
   };
   if (excludeOutOfStock === "true") {
     filter.prod_quantity = { $gt: 0 };
     
   }
    const beltsData = await Products.find(filter)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Products.find(filter).countDocuments();

    res.render("belts", {
      products: beltsData,
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
    });
  } catch (error) {
    console.log(error);
  }
};

const loadPhoneCases = async (req, res) => {
  try {
    const products = await Products.find({ prod_status: "ACTIVE" }).populate(
      "prod_category"
    );
    const phoneCases = products.filter(
      (product) => product.prod_category.cat_name === "Phone Cases"
    );
    res.render("phonecases", { products: phoneCases });
  } catch (error) {
    console.log(error);
  }
};

const loadProductDetails = async (req, res) => {
  try {
    let id = req.params.id;
    const products = await Products.findById({ _id: id })
      .populate("prod_category")
      .populate("prod_size")
      .populate("prod_color");

      if (!products) {
        return res.status(404).render('error', { message: 'Product not found' });
    }

    let discountedPrice = products.prod_mrp;
        if (products.offer && new Date() <= new Date(products.offer.end_date)) {
            discountedPrice = products.prod_mrp * (1 - products.offer.discount_percentage / 100);
        }


    const relatedProducts = await Products.find({
      prod_status: "ACTIVE",
      prod_category: products.prod_category._id,
      _id: { $ne: products._id },
    }).populate("prod_category").limit(3);

    console.log(relatedProducts);
    res.render("productDetails", {
      products,
      relatedProducts,
      discountedPrice: discountedPrice,
      user: req.user,
      cart: req.cart,
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
    if (order) {
      const product = order.products.find(
        (p) => p.product.toString() === productId
      );
      console.log(product);
      if (product) {
        product.productStatus = "Cancelled";

        order.total = order.products.reduce((total, item) => {
          if (item.productStatus !== "Cancelled") {
            return total + item.price * item.quantity;
          }
          console.log(total);
          return total;
        }, 0);

        const allCancelled = order.products.every(
          (item) => item.productStatus === "Cancelled"
        );
        if (allCancelled) {
          order.status = "Cancelled";
        }

        const productInStock = await Products.findById(productId);
        if (productInStock) {
          productInStock.prod_quantity += product.quantity;
          await productInStock.save();
        }
        await order.save();

        res.json({ success: true });
      } else {
        res.status(404).json({ success: false });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
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

const returnOrderItem = async (req, res) => {
  const { orderId, productId } = req.body;
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

    await order.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
};

const returnOrder = async (req, res) => {
  const { orderId } = req.body;

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
      product.productStatus = "Returned";

      const productInStock = await Products.findById(product.product);
      if (productInStock) {
        productInStock.quantity += product.quantity;
        await productInStock.save();
      }
    }
    let refundAmount;
    if (order.subtotal < 1000) {
      refundAmount = order.total - 100;
    }
    await addToWallet(
      order.user,
      refundAmount,
      `Refund for returned order ${order._id}`
    );
    if (order.walletAmountUsed > 0) {
      // Refund the wallet amount
      const wallet = await Wallet.findOne({ user: order.user });
      wallet.balance += order.Number(walletAmountUsed);
      wallet.transactions.push({
        type: "CREDIT",
        amount: order.Number(walletAmountUsed),
        description: "Order cancellation refund (from wallet balance)",
      });
      await wallet.save();
    }

    order.status = "Returned";
    order.total = 0;

    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};

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
    res.render("wishlist", { user: req.user.id, wishlist: wishlist });
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
    const { productId, quantity,maxValue } = req.body;
    console.log(maxValue)

    const userId = req.user.id;
    try {
      let user = await User.findOne({ _id: userId });
      const product = await Products.findById(productId);

      if (!user || !product) {
        return res
          .status(404)
          .json({ success: false, message: "User or product not found." });
      }

      let price = product.prod_mrp;
      let offerApplied = false;
      if (product.offer && new Date() <= new Date(product.offer.end_date)) {
        price =
          product.prod_mrp * (1 - product.offer.discount_percentage / 100);
          offerApplied = true;
      }

      const productIndex = user.cart.products.findIndex(
        (p) => p.product.toString() === productId
      );

      if (productIndex > -1) {
        
        user.cart.products[productIndex].quantity += parseInt(quantity);
        user.cart.products[productIndex].quantity=user.cart.products[productIndex].quantity > maxValue ? maxValue : user.cart.products[productIndex]
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
        offerApplied:offerApplied
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

    const product = await Products.findById(productId);

    if (!user || !product) {
      return res
        .status(404)
        .json({ success: false, message: "User or product not found." });
    }

    let price = product.prod_mrp;
    if (product.offer && new Date() <= new Date(product.offer.end_date)) {
      price = product.prod_mrp * (1 - product.offer.discount_percentage / 100);
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
  const { paymentMethod, useWalletAmount,couponCode } = req.body;
  const selectedAddressId = req.session.selectedAddress;
  console.log(paymentMethod, selectedAddressId,couponCode);

  try {
    const user = await User.findById(req.user.id).populate(
      "cart.products.product"
    );
    let wallet = await Wallet.findOne({ user: req.user.id });
    const selectedAddress = user.addresses.id(selectedAddressId);

    let subTotal = 0;
    user.cart.products.forEach((item) => {
      subTotal += item.price * item.quantity;
    });

    let discount = 0;
    if (req.session.appliedCoupon) {
      discount = req.session.appliedCoupon.discount;
      
      // Remove the coupon from the session after using it
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
      wallet.balance -= walletAmountToUse;
      wallet.transactions.push({
        type: "DEBIT",
        amount: walletAmountToUse,
        description: "Purchase payment",
      });
      await wallet.save();
      finalValue -= walletAmountToUse;
    }

    const newOrder = new Order({
      orderId: generateOrderId(),
      user: user._id,
      address: `${selectedAddress.houseNo},${selectedAddress.street},${selectedAddress.city},${selectedAddress.country},${selectedAddress.zipCode}`,
      paymentMethod: paymentMethod,
      products: user.cart.products.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.prod_price,
      })),
      subtotal: subTotal,
      discount: discount,
      shippingCost: shippingCost,
      total: finalValue,
      coupon: couponCode,
      walletAmountUsed: walletAmountToUse,
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

    res.redirect(`/order-confirmation/${newOrder._id}`);
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
    const { selectedAddress, useWalletAmount,couponCode } = req.body;
    const user = await User.findById(req.user.id).populate(
      "cart.products.product"
    );
    let wallet = await Wallet.findOne({ user: req.user.id });

    let subTotal = 0;
    user.cart.products.forEach((item) => {
      subTotal += item.price* item.quantity;
    });

    let discount = 0;
    if (req.session.appliedCoupon) {
      discount = req.session.appliedCoupon.discount;
      coupon = req.session.appliedCoupon.Name;
      // Remove the coupon from the session after using it
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
    console.log(convertedPrice);

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
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody(requestBody);

    const order = await client.execute(request);

    const newOrder = new Order({
      user: req.user.id,
      products: user.cart.products.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.prod_price, // Add the price here
      })),
      subtotal: subTotal,
      discount: discount,
      shippingCost: shippingCost,
      total: finalValue,
      status: "Pending",
      paypalOrderId: order.result.id,
      paymentMethod: "PayPal",
      address: selectedAddress,
      orderId: generateOrderId(),
      walletAmountUsed: walletAmountToUse,
      coupon : couponCode
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

    console.log(order.result.id);
    res.json({ id: order.result.id });
  } catch (error) {
    console.error("Create PayPal Order Error:", error);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
};

const paypalSuccess = async (req, res) => {
  try {
    const { orderID } = req.query;
    const request = new paypal.orders.OrdersGetRequest(orderID);
    const order = await client.execute(request);

    const { purchase_units } = order.result;

    const user = await User.findById(req.user.id).populate(
      "cart.products.product"
    );

    const existingOrder = await Order.findOne({ paypalOrderId: orderID });

    if (existingOrder) {
      // If the order already exists, update it
      existingOrder.status = "COMPLETED";
      await existingOrder.save();

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

      res.redirect(`/order-confirmation/${existingOrder._id}`);
    } else {
      const userEmail = order.result.payer.email_address;
      const user = await User.findOne({ email: userEmail }).populate(
        "cart.products.product"
      );
      console.log(user);
      const newOrder = new Order({
        orderId: generateOrderId(),
        user: user._id,
        address: purchase_units[0].shipping.address.address_line_1,
        paymentMethod: "Paypal",
        products: user.cart.products.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.prod_price,
        })),
        total: purchase_units[0].amount.value,
        paypalOrderId: orderID,
      });

      for (let item of user.cart.products) {
        await Products.findByIdAndUpdate(item.product._id, {
          $inc: { prod_quantity: -item.quantity },
        });
      }

      user.user_orders.push(newOrder._id);
      user.cart.products = [];
      await user.save();

      res.redirect(`/order-confirmation/${newOrder._id}`);
    }
  } catch (error) {
    console.error("PayPal Success Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred during PayPal success processing" });
  }
};

const paypalCancel = async (req, res) => {
  const cancelPaypalOrder = async (req, res) => {
    try {
      const { token } = req.query;

      console.log("PayPal order cancelled. Token:", token);

      const order = await Order.findOne({ paypalOrderId: token });

      if (order) {
        order.status = "Cancelled";
        await order.save();
        console.log("Order updated to Cancelled status:", order._id);
      } else {
        console.log("No matching order found for token:", token);
      }

      // Render the cancellation page
      res.render("paypal-cancel", {
        pageTitle: "Order Cancelled",
        path: "/paypal-cancel",
      });
    } catch (error) {
      console.error("Cancel PayPal Order Error:", error);
    }
  };
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
  loadBags,
  loadBelts,
  loadWallets,
  loadPhoneCases,
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
  returnOrder,
  paypalSuccess,
  paypalCancel,
  createPaypalOrder,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  getReferrals,
};
