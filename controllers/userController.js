const userRoute = require("../routers/userRouter");
const bCrypt = require("bcrypt");
const User = require("../models/user");
const Products = require("../models/product");
const Category = require("../models/category");
const Size = require("../models/size");
const Color = require("../models/color");
const nodemailer = require("nodemailer");
const { session } = require("passport");
const  mongoose  = require("mongoose");
const Order = require("../models/order");
const generateOrderId = require("../utils/orderIdGenerator");
const getSortOption = require('../utils/sortOptions')
require('dotenv/config')
var moment = require('moment');




const successGoogleLogin = async(req, res)=>{
   
   
        if(req.isAuthenticated){
            const products = await Products.find({is_bestseller:true});
            res.render('home',{products, user:req.user});
        }
    }
    


const failureGoogleLogin =(req, res)=>{
    res.send("Error")
}


const securePassword = async(password)=>{
    try {
        const hashedPassword = await bCrypt.hash(password,10);
        return hashedPassword;

    } catch (error) {
        console.log(error.message)
    }
}




const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    }
});


const loadSignUp = (req,res)=>{
    try {
        res.render('signup');
    } catch (error) {
        console.log(error)
    }
}

const verifySignUp = async(req,res)=>{
    try {
        const {name,email,mobileno,password,confirmPassword,authMethod}= req.body;
        console.log(password,confirmPassword)
        const isExist = await User.findOne({ user_email: email});
        console.log(isExist)
        if(isExist) {
            res.render('signup', {message: 'Email id already exists in the database. Use another for registration'})
        }else{
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            const otpExpiry = new Date(Date.now() + 1 * 60000);              
            
                const sPassword = await securePassword(password);
                const user = new User({
                user_name: name,
                user_email: email,
                user_contact:mobileno,                
                user_password: sPassword,
                otp: otp,
                otp_expiry: otpExpiry,
                authMethod: authMethod,

            })
            await user.save();
            const mailOptions = {
                from: 'mridulagirish2024@gmail.com',
                to: email,
                subject: 'Email Verification from Adalene',
                text: `Your OTP code is ${otp}`
        }
       transporter.sendMail(mailOptions,(err,data)=>{
            if(err){
                console.log(err.message)
            }else{
                console.log("Email sent successfully")
            }
        });

        res.render('verify',{email: email,user:req.user,success:'Email sent successfully'}) 
  
    }

    } catch (error) {
        console.log(error.message);
    }
    
}

const loadVerify = (req,res) => {

    if(req.session.userId){
        res.redirect('/')
    }else{
        res.render('verify');
    }
    
    
}

const verifyOTP = async(req, res) => {
    try {
        const {email} = req.body;
        const { digit1, digit2, digit3, digit4} = req.body        
        const newOTP = `${digit1}${digit2}${digit3}${digit4}`
        console.log(newOTP);
        const user = await User.findOne({user_email: email, otp:newOTP})
        console.log(user);
        if(user){
        const otpExpiry = user.otp_expiry;
        const otpMilliseconds = new Date(otpExpiry).getTime();
    
        
        console.log(Date.now());
    
        if(otpMilliseconds > Date.now()){
            user.isVerified = true;
            user.otp = null;
            user.otp_expiry = null;
            await user.save();
            req.login(user, (err) => {
                if (err) {
                    return next(err);
                }
                return res.redirect('/'); 
            });
        }
    }
        else{
            const otpExpired = true;
            res.render('verify',{user:req.user,message:'OTP expired or wrong OTP',email:email})
        }
    }
    
     catch (error) {
        console.log(error)
    }
}  

const resendOTP = async(req, res) => {
    const {email} = req.body;
    console.log(email);
    const otp = Math.floor(1000+ Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 1 * 60000); 
    await User.updateOne({user_email:email},{$set:{otp:otp, otp_expiry:otpExpiry}});

    const mailOptions = {
        from: 'mridulagirish2024@gmail.com',
        to: email,
        subject: 'Email Verification from Adalene',
        text: `Your OTP code is ${otp}`
}
transporter.sendMail(mailOptions,(err,data)=>{
    if(err){
        console.log(err.message)
    }else{
        console.log("Email sent successfully")
    }
})

res.render('verify', { email,user:req.user });
}


const loadSigIn = (req, res) => {
    if(req.session.userId){        
        res.redirect('/home')
    }else{
        res.render('signin')
    }
}

const verifySignIn = async(req, res) => {
    try {
        const {email, password} = req.body;
    const userData = await User.findOne({user_email:email});
    if(userData){
        const passwordMatch = await bCrypt.compare(password, userData.user_password);
        if(passwordMatch){
            req.session.userId = userData._id;            
            res.redirect('/');
        }else{
            res.render('signin',{message:"Email or password is incorrect"})
        }
    }else{
        res.render('signin',{message:"Email or password is incorrect"})
    }
    } catch (error) {
        console.log(error)
    }   
    
}


const loadForgotPassword = (req,res)=>{
    res.render('forgotPassword',{user:req.user});
}

const requestOtp = async(req,res)=>{

    try {
        const { email } = req.body;
        console.log(email)
        const isExist = await User.findOne({user_email: email})
        console.log(isExist)
        if(!isExist){
            res.render('forgotPassword', { message: 'No user with that email address' });
        }else{
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            const otpExpiry = new Date(Date.now() + 1 * 60000);
            const userData = await User.updateOne({user_email: email},{$set:{otp:otp,otp_expiry:otpExpiry}});
            const mailOptions = {
                from: 'mridulagirish2024@gmail.com',
                to: email,
                subject: 'Email Verification from Adalene',
                text: `Your OTP code is ${otp}`
        }
        transporter.sendMail(mailOptions,(err,data)=>{
            if(err){
                console.log(err.message)
            }else{
                console.log("Email sent successfully")
            }
        });
            res.render('otp',{success:'Check your email for the OTP',email:email,user:req.user })
        } 
        
       
    } catch (error) {
        console.log(error)
    }  

}

const verifyFPOTP = async(req,res)=>{
    try {
        const {email,otp} = req.body;
        console.log(email,otp)
        const user = await User.findOne({user_email: email, otp:otp})        
        const otpExpiry = user.otp_expiry;
        const otpMilliseconds = new Date(otpExpiry).getTime();
        if(user && otpMilliseconds > Date.now()){
            user.otp = null;
            user.otp_expiry = null;
            await user.save();
            res.render('resetPassword',{email,user:req.user})     
    
        }
        else{
            res.render('otp',{incorrect:"OTP is incorrect or expired",user:req.user})
        }      
      
    } catch (error) {
        console.log(error)
    }
}

const updatePassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email,password)
        const user = await User.findOne({user_email:email});
        if (!user) {
            return res.render('resetPassword', { message: 'User not found',user:req.user });
          }
        const sPassword = await securePassword(password);
        const userData = await User.updateOne({user_email: email},{$set:{user_password:sPassword}});        
        res.render('signin')
    } catch (error) {
        console.log(error);
    }
}

const loadHome = async(req,res)=>{
    try {
        
        if(!req.session.userId){
            res.redirect('/');
        }else{            
            if(req.isAuthenticated()){
                console.log(req.user)
                const products = await Products.find({is_bestseller:true});
                res.render('home',{products, user:req.user,cart:req.cart});
            }
        }
        
    } catch (error) {
        console.log(error)
    }
   
}

const loadShopall = async(req,res) => {
    
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
            const limit = 5; 
            const {sortBy ='popularity', order = 'asc'}=req.query;

            const categories = await Category.find();
            const sizes = await Size.find();
            const colors = await Color.find();            
            

            const sortOption = getSortOption(sortBy, order);

            
            const products = await Products.find({ prod_name: { $regex: ".*" + search + ".*", $options: 'i' } })
            .sort(sortOption)
            .limit(limit*1)
            .skip((page-1)*limit)
            .exec();

            const count = await Products.find({ prod_name: { $regex: ".*" + search + ".*", $options: 'i' } }).countDocuments();
            res.render('shopall',{products, totalPages:Math.ceil(count/limit), currentPage:page,user:req.user,
                categories,sizes,colors,cart:req.cart,sortBy,order,search
            });
        } catch (error) {
            console.log(error)
        }       
    }
   




const loadBags = async(req,res)=>{
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
        

        const {sortBy ='popularity', order = 'asc'}=req.query;

        const sortOption = getSortOption(sortBy, order);


        const products = await Products.find({prod_status:'ACTIVE'}).populate('prod_category');
        const bagsData = await Products.find({prod_category:'66702daed57b7afd0c8cafe1',prod_name: { $regex: ".*" + search + ".*", $options: 'i'}})
        .sort(sortOption)
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();
       
        const count = await Products.find({prod_category:'66702daed57b7afd0c8cafe1'}).countDocuments();
        
        res.render('bags',{products: bagsData,totalPages:Math.ceil(count/limit), currentPage:page,user:req.user,categories,sizes,colors,cart:req.cart,sortBy,order,search });
    } catch (error) {
        console.log(error)

    }
   
}

const loadWallets = async(req,res)=>{
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

        const {sortBy ='popularity', order = 'asc'}=req.query;

        const sortOption = getSortOption(sortBy, order);

        const products = await Products.find({prod_status:'ACTIVE'}).populate('prod_category');
        const walletData = await Products.find({prod_category:'6673eca9e5d3e08f0ce33581',prod_name: { $regex: ".*" + search + ".*", $options: 'i'}})
        .sort(sortOption)
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();
      
        const count = await Products.find({prod_category:'6673eca9e5d3e08f0ce33581'}).countDocuments();
      
        res.render('wallets',{products: walletData,totalPages:Math.ceil(count/limit), currentPage:page,user:req.user,categories,sizes,colors,cart:req.cart,sortBy,order,search });
    } catch (error) {
        console.log(error)

    }
   
   
}
const loadBelts = async(req,res)=>{
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

        const {sortBy ='popularity', order = 'asc'}=req.query;

        const sortOption = getSortOption(sortBy, order);

        const products = await Products.find({prod_status:'ACTIVE'}).populate('prod_category');
        const beltsData = await Products.find({prod_category:'6673ecb8e5d3e08f0ce33584',prod_name: { $regex: ".*" + search + ".*", $options: 'i'}})
        .sort(sortOption)
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();
      
        const count = await Products.find({prod_category:'6673ecb8e5d3e08f0ce33584'}).countDocuments();
      
        res.render('belts',{products: beltsData,totalPages:Math.ceil(count/limit), currentPage:page,user:req.user,categories,sizes,colors,cart:req.cart,sortBy,order,search });
    } catch (error) {
        console.log(error)

    }
   
}

const loadPhoneCases = async(req,res)=>{
    try {
        const products = await Products.find({prod_status:'ACTIVE'}).populate('prod_category');
        const phoneCases = products.filter(product=>product.prod_category.cat_name === 'Phone Cases')
        res.render('phonecases',{products: phoneCases});
    } catch (error) {
        console.log(error)
    }
   
}

const loadProductDetails = async(req,res)=>{
    try {
        let id =req.params.id;
        const products = await Products.findById({_id:id}).populate('prod_category').populate('prod_size').populate('prod_color')
        const relatedProducts = await Products.find({prod_status:'ACTIVE',prod_category:products.prod_category._id,_id:{$ne:products._id}}).populate('prod_category');    
        console.log(relatedProducts)   
        res.render('productDetails',{products,relatedProducts,user:req.user,cart:req.cart});
}
     catch (error) {
        console.log(error)
    }
}

const displayProfile = async(req,res)=>{
    try {
        
        const id =req.user.id;       
        const userData = await User.findById({_id:id})        
        res.status(200).render('profile',{userData:userData,user:req.user,moment});

    } catch (error) {
        console.log(error)
    }
}

const displayEditProfile= async(req,res)=>{
    try {
        const id = req.params.id; 
       
        const userData = await User.findById({_id:id})
        
        res.status(200).render('editProfile',{userData:userData, user:req.user});
        
    } catch (error) {
        console.log(error)
    }
}

const updateProfile = async(req,res)=>{
    try {
        const {name,email,mobileno,gender,dateOfBirth}=req.body;
        const id = req.params.id;

        const user = await User.findById({_id:id});
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.user_name = name;
        user.user_email = email;
        user.user_contact= mobileno;
        user.user_gender = gender;
        user.user_dob = new Date(dateOfBirth);
        await user.save();
        res.status(302).redirect('/profile');


    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}


const displayAddresses = async(req, res)=>{
    try {
        const userData = await User.findById(req.user.id);
        res.status(200).render('address',{userData:userData, user:req.user})
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}

const displayAddAddress = async(req, res)=>{
    try {
        const userData = await User.findById(req.user.id);
        res.status(200).render('addAddress',{userData:userData,user:req.user});
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}

const addAddress = async(req, res)=>{

   
        const {houseNo,street,city,state,zipcode,country}=req.body;
        const userId = req.user.id;
        console.log(userId)
        console.log(houseNo,street,city,state,zipcode,country)
       
            const newAddress = {
                houseNo:houseNo,
                street:street ,
                city: city,
                state: state,
                zipCode:zipcode ,
                country: country,
              };
        try {

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $push: { addresses: newAddress } },
                { new: true, useFindAndModify: false }
              );
              if (!updatedUser) {
                return res.status(404).send('User not found');
              }
              res.status(200).redirect('/addresses')
       
    } catch (error) {
       console.log(error)
    }

}

const displayEditAddress = async(req, res)=>{
    try {
        const addressIndex = req.params.addressIndex;
        const userData = await User.findById(req.params.id);
        const address = userData.addresses[addressIndex];
        res.status(200).render('editAddress',{userData:userData,user:req.user,address,addressIndex});
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}

const updateAddress = async(req, res)=>{
    const {houseNo,street,city,state,zipcode,country}=req.body;
    console.log(zipcode)
    const userId = req.params.id;
    const addressIndex = req.params.addressIndex;
    try {
    const user = await User.findById(userId)

    user.addresses[addressIndex] = {houseNo,street,city,state,zipCode:zipcode,country};
    await user.save();
    res.status(200).redirect('/addresses')
   
    } catch (error) {
   console.log(error)
        }
}

 const displayOrderHistory = async(req, res)=>{
    try {
        const orders = await Order.find({user:req.user.id}).populate('products.product');
        res.render('orderHistory', {orders,user:req.user,moment})

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error')
    }
 }

 const cancelOrder = async(req, res)=>{
    try {
        console.log(req.body.orderId)
        const order = await Order.findById(req.body.orderId);
        if(order){
            order.status = 'Cancelled';
            order.save();
            res.json({success:true});
        }else{
            res.status(404).json({success:false})
        }

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
 }

 const displayOrderDetails = async(req, res)=>{
    try {
        const order = await Order.findById(req.params.orderId).populate('products.product');
      
        res.status(200).render('orderDetails', {order,user:req.user,moment})
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error')
    }
 }

 const cancelOrderItem = async(req, res)=>{
    const {orderId,productId} = req.body;
    console.log(orderId,productId);
    try {
       const order = await Order.findById(orderId);
       console.log(order)
       if(order){
        const product = order.products.find(p=>p.product.toString()===productId);
        if(product){
            product.productStatus = 'Cancelled';

            order.total = order.products.reduce((total,item)=>{
                if(item.productStatus !== 'Cancelled'){
                    return total += item.price * item.quantity;
                }
                return total;
            })
            await order.save();
            res.json({success:true})
        }
        else{
            res.status(404).json({success:false});
        }
       }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error')
    }
 } 



const addToCart = async(req,res)=>{

    if(!req.user){
        res.redirect('/signin');
    }else{
    const { productId, quantity } = req.body;
     

    const userId = req.user.id; 
       try {
        let user = await User.findOne({_id:userId});

        if(user){
            const productIndex = user.cart.products.findIndex(p=>p.product.toString()=== productId);
            if(productIndex>-1){
                user.cart.products[productIndex].quantity += parseInt(quantity);
        }else{
            user.cart.products.push({product:new mongoose.Types.ObjectId(productId),quantity:parseInt(quantity)});
        }
        await user.save();
        res.json({ success: true, message: 'Product added to cart successfully!' });
    }else{
        res.json({ success: false, message: 'User not found.' });
    }
        
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Failed to add product to cart.' });
    }
}
}

const loadCartPage = async(req,res)=>{
    try {
        const id = req.user.id;
        const user = await User.findById({_id:id}).populate({
           path: 'cart.products.product',
           populate:{
            path:'prod_color',
            model:'Color',
           }
        });

        let totalValue = 0;
        user.cart.products.forEach(item => {
            totalValue += item.product.prod_price * item.quantity;
        });

        res.status(200).render('cart',{cart:user.cart,user:req.user,totalValue: totalValue });
    } catch (error) {
        console.log(error)
    }
}

const updateCart = async(req,res)=>{
    try {
        const {productId, quantity} = req.body;
       
        const user = await User.findById({_id:req.user.id})
        const productIndex = user.cart.products.findIndex(item=>item.product._id.toString()=== productId);
        if(productIndex !== -1){
            user.cart.products[productIndex].quantity = quantity;
            await user.save();      
            res.json({ success: true });
        }else{
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }       

    } catch (error) {
        console.log(error)
    }
}


const removeCartItem = async(req,res)=>{
    try {
        const {productId} = req.body;
        console.log(productId)
        const user = await User.findById({_id:req.user.id});
        user.cart.products = user.cart.products.filter(item =>item.product.toString() != productId);
        await user.save();
        res.json({success:true});
    } catch (error) {
        console.log(error);
    }
}

const countCartItems = async(req,res)=>{
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({ error: 'User not found' });
        }
        const cartCount = user.cart.items.length; 
        res.json({ count: cartCount });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Internal server error' });
    }
}

const displayAddressSelection = async(req,res)=>{

    try {
        const user = await User.findById(req.user.id);
        res.status(200).render('addressSelection', {user})
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}

const selectedAddress = async(req,res)=>{
    const {selectedAddress} = req.body;
    
    if(!selectedAddress){
        res.status(302).redirect('/checkout');
    }    
    req.session.selectedAddress = selectedAddress;
    res.redirect('/payment');
    
}

const displayPayment = async(req,res)=>{
    const selectedAddressId = req.session.selectedAddress;
    console.log("checking")
    console.log(selectedAddressId)    

    try {
       
        const id = req.user.id;
        const user = await User.findById({_id:id}).populate({
            path: 'cart.products.product',
            populate:{
             path:'prod_color',
             model:'Color',
            }
         });

         let totalValue = 0;
         user.cart.products.forEach(item => {
             totalValue += item.product.prod_price * item.quantity;
         });

        const selectedAddress = user.addresses.id(selectedAddressId);
        if (!selectedAddress) {
            res.redirect('/checkout');
        }

        res.render('payment', { user, selectedAddress,cart:user.cart, totalValue:totalValue});

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}

const processPayment = async (req, res) => {
    const paymentMethod = req.body.paymentMethod;
    const selectedAddressId = req.session.selectedAddress;
    console.log(paymentMethod, selectedAddressId);

    try {
        const user = await User.findById(req.user.id).populate('cart.products.product');
        const selectedAddress = user.addresses.id(selectedAddressId);
        

        let totalValue = 0     
        user.cart.products.forEach(item => {
            
           totalValue += item.product.prod_price * item.quantity;
        });
       

        let finalValue = totalValue > 1000 ? totalValue : totalValue + 100;

        

        const newOrder = new Order({
            orderId:generateOrderId(),
            user: user._id,
            address: `${selectedAddress.houseNo},${selectedAddress.street},${selectedAddress.city},${selectedAddress.country},${selectedAddress.zipCode},`,
            paymentMethod: paymentMethod,
            products:user.cart.products.map(item =>({
                product: item.product._id,
                quantity:item.quantity,
                price:item.product.prod_price,
            })),
            total : finalValue
        })


        console.log(newOrder)
        await newOrder.save();

        for (let item of user.cart.products) {
            await Products.findByIdAndUpdate(item.product._id, {
                $inc: { prod_quantity: -item.quantity }
            });
            
        }
       

        user.user_orders.push(newOrder._id);
        user.cart.products = [];
        user.save();

        res.redirect(`/order-confirmation/${newOrder._id}`);

    } catch (error) {
        console.log(error);
    }
}

const displayOrderConfirmation = async(req,res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if(!order) {
            return res.status(404).json({message: 'Order not found'})
        }

        res.render('orderConfirmation', {order,user:req.user});

    } catch (error) {
        console.log(error)
    }

}

const userSignOut = async(req,res)=>{
    try {
        
        req.logout((err) => {
            if (err) { return next(err); }
            res.redirect('/'); 
          });
       
      
    } catch (error) {
        console.log(error)
    }
   
}

const getProductsByCategory = async(req,res) => {
    try {
        const categories = await Category.find({});
        const { categoryId, page = 1, limit = 10, sortBy = 'popularity'} = req.query;
        console.log(categoryId)

        let filter = { is_deleted: false, prod_status: 'ACTIVE', prod_category: ObjectId(categoryId )};

        const sortOptions = {
            popularity: { prod_rating: -1 },
            priceAsc: { prod_price: 1 },
            priceDesc: { prod_price: -1 },
            avgRating: { prod_rating: -1 },
            featured: { is_bestseller: -1 },
            newArrivals: { created_on: -1 },
            aToZ: { prod_name: 1 },
            zToA: { prod_name: -1 }
        };

        const products = await Products.find(filter)
            .sort(sortOptions[sortBy])
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const totalProducts = await Products.countDocuments(filter);

        res.json({
            products,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: Number(page)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
    
}
    

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
    countCartItems

}