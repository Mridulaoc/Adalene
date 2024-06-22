const userRoute = require("../routers/userRouter");
const bCrypt = require("bcrypt");
const User = require("../models/user");
const Products = require("../models/product");
const Category = require("../models/category");
const Size = require("../models/size");
const Color = require("../models/color");
const nodemailer = require("nodemailer");
const { session } = require("passport");
require('dotenv/config')




const successGoogleLogin = async(req, res)=>{
   
   
        if(req.isAuthenticated){
            const products = await Products.find({is_bestseller:true});
            res.render('home',{products, signOut:'Sign Out',user:req.user});
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
        user: 'mridulagirish2024@gmail.com',
        pass: 'flda jurt auvl hhfz'
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
        const {name,email,mobileno}= req.body;
        const isExist = await User.findOne({ user_email: email});
        if(isExist) {
            res.render('signup', {message: 'Email id already exists in the database. Use another for registration'})
        }else{
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            const otpExpiry = new Date(Date.now() + 1 * 60000); 
            const sPassword = await securePassword(req.body.password);
            const user = new User({
                user_name: name,
                user_email: email,
                user_contact:mobileno,                
                user_password: sPassword,
                otp: otp,
                otp_expiry: otpExpiry,                
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

        res.render('verify',{email: email})
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
        const {email,otp} = req.body;
        const user = await User.findOne({user_email: email, otp:otp})
        console.log(user);
        const otpExpiry = user.otp_expiry;
        const otpMilliseconds = new Date(otpExpiry).getTime();
    
        
        console.log(Date.now());
    
        if(user && otpMilliseconds > Date.now()){
            user.isVerified = true;
            user.otp = null;
            user.otp_expiry = null;
            await user.save();
           res.render('signin')
    
        }
        else{
            res.send("OTP is incorrect or expired")
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

res.render('verify', { email });
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
            res.redirect('/home');
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
    res.render('forgotPassword');
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
            res.render('otp',{success:'Check your email for the OTP',email:email })
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
            res.render('resetPassword',{email})     
    
        }
        else{
            res.render('otp',{incorrect:"OTP is incorrect or expired"})
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
            return res.render('resetPassword', { message: 'User not found' });
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
            const products = await Products.find({is_bestseller:true});
            res.render('home',{products, message:'Sign Out'});
        }
        
    } catch (error) {
        console.log(error)
    }
   
}

const loadShopall = async(req,res)=>{
    try {
        const products = await Products.find({prod_status:'ACTIVE'});
        res.render('shopall',{products});
    } catch (error) {
        
    }
   
}


const loadBags = async(req,res)=>{
    try {
        const products = await Products.find({prod_status:'ACTIVE'}).populate('prod_category');
        const bags = products.filter(product=>product.prod_category.cat_name === 'Bags')
        console.log(bags);
        res.render('bags',{products: bags });
    } catch (error) {
        console.log(error)

    }
   
}

const loadWallets = async(req,res)=>{
    try {
        const products = await Products.find({prod_status:'ACTIVE'}).populate('prod_category');
        const wallets = products.filter(product=>product.prod_category.cat_name === 'Wallets')
        res.render('wallets',{products: wallets});
    } catch (error) {
        console.log(error)

    }
   
}
const loadBelts = async(req,res)=>{
    try {
        const products = await Products.find({prod_status:'ACTIVE'}).populate('prod_category');
        const belts = products.filter(product=>product.prod_category.cat_name === 'Belts')
        res.render('belts',{products: belts});
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
        const products = await Products.findById({_id:req.query.id}).populate('prod_category').populate('prod_size').populate('prod_color')
        const relatedProducts = await Products.find({prod_status:'ACTIVE',prod_category:products.prod_category._id,_id:{$ne:products._id}}).populate('prod_category');    
        console.log(relatedProducts)   
        res.render('productDetails',{products,relatedProducts});
}
     catch (error) {
        console.log(error)
    }
}
    
const userSignOut = async(req,res)=>{
    try {
        
        if(req.session.userId){
            req.session.destroy();
            console.log('session destroyed')
        }
        res.redirect('/signin')
      
    } catch (error) {
        console.log(error)
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
    userSignOut

}