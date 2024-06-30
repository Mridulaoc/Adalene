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
        const {name,email,mobileno,password,confirmPassword}= req.body;
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
            if(req.isAuthenticated){
                const products = await Products.find({is_bestseller:true});
                res.render('home',{products, user:req.user});
            }
        }
        
    } catch (error) {
        console.log(error)
    }
   
}

const loadShopall = async(req,res) => {
    
        try {
            console.log(process.env)
            let page = 1;
            if (req.query.page) {
                page = req.query.page;
            }
            const limit = 5; 
            const categories = await Category.find();
            const sizes = await Size.find();
            const colors = await Color.find();        
            
            const products = await Products.find({})
            .limit(limit*1)
            .skip((page-1)*limit)
            .exec();

            const count = await Products.find().countDocuments();
            res.render('shopall',{products, totalPages:Math.ceil(count/limit), currentPage:page,user:req.user,
                categories,sizes,colors
            });
        } catch (error) {
            console.log(error)
        }
       
    }
   

const loadFilteredProducts = async(req,res)=>{
    try {
        
        const { categoryId, colorId, sizeId, page = 1, limit = 5, sort } = req.query;
        const query = {};

        if (categoryId && categoryId !== 'All') query.prod_category = ObjectId(categoryId);
        if (colorId && colorId !== 'All') query.prod_color = colorId;
        if (sizeId && sizeId !== 'All') query.prod_size = sizeId;

        let sortQuery = {};
        switch (sort) {
          case 'name-asc':
            sortQuery = { prod_name: 1 };
            break;
          case 'name-desc':
            sortQuery = { prod_name: -1 };
            break;
          case 'price-asc':
            sortQuery = { prod_price: 1 };
            break;
          case 'price-desc':
            sortQuery = { prod_price: -1 };
            break;
          default:
            sortQuery = { prod_name: 1 };
        }

        const products = await Products.find(query)
        .populate('prod_category')
        .populate('prod_color')
        .populate('prod_size')
        .sort(sortQuery)
        .skip((page - 1) * limit)
        .limit(5);

        const total = await Products.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.render('shopall',{ products, totalPages });
      
        // const page = parseInt(req.query.page) || 1;
        // const limit = parseInt(req.query.limit) || 5;
        // const search = req.query.search || "";
        // let sort = req.query.sort || "price";
        // let category = req.query.category || "All";
        // let size = req.query.size || "All";
        // let color = req.query.color || "All";

        // const categories = await Category.find();
        // const sizes = await Size.find();
        // const colors = await Color.find();

        // category === "All" ? (category = categories.map(category => category._id)) : (category = req.query.category.split(","));
        // size === "All" ? (size = sizes.map(size => size._id)) : (size = req.query.size.split(","));
        // color === "All" ? (color = colors.map(color => color._id)) : (color = req.query.color.split(","));

        // req.query.sort ? (sort = req.query.sort.split(",")) : (sort = [sort]);

        // let sortBy = {};
        // if (sort[1]) {
        //     sortBy[sort[0]] = sort[1];
        // } else {
        //     sortBy[sort[0]] = "asc";
        // }

        // const products = await Products.find({ 
        //     prod_name: { $regex: search, $options: "i" },
        //     prod_category: { $in: category },
        //     prod_size: { $in: size },
        //     prod_color: { $in: color }
        // })
        // .sort(sortBy)
        // .skip(page * limit)
        // .limit(limit)
        // .populate('prod_category')
        // .populate('prod_size')
        // .populate('prod_color');

        // const count = await Products.countDocuments({
        //     prod_category: { $in: category },
        //     prod_size: { $in: size },
        //     prod_color: { $in: color },
        //     prod_name: { $regex: search, $options: "i" },
        // });

        
        // res.status(200).render('shopall',{products,categories,sizes,colors,page:page+1,totalPages:Math.ceil(count/limit),currentPage:page,search} )
    } catch (error) {
        res.status(500).send({error:error});
        
    }
   
}



const loadBags = async(req,res)=>{
    try {
        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const categories = await Category.find();
        const sizes = await Size.find();
        const colors = await Color.find();   
        const limit = 5; 
        const products = await Products.find({prod_status:'ACTIVE'}).populate('prod_category');
        const bagsData = await Products.find({prod_category:'66702daed57b7afd0c8cafe1'})
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();
       
        const count = await Products.find({prod_category:'66702daed57b7afd0c8cafe1'}).countDocuments();
        
        res.render('bags',{products: bagsData,totalPages:Math.ceil(count/limit), currentPage:page,user:req.user,categories,sizes,colors });
    } catch (error) {
        console.log(error)

    }
   
}

const loadWallets = async(req,res)=>{
    try {
        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const categories = await Category.find();
        const sizes = await Size.find();
        const colors = await Color.find();   
        const limit = 5; 
        const products = await Products.find({prod_status:'ACTIVE'}).populate('prod_category');
        const walletData = await Products.find({prod_category:'6673eca9e5d3e08f0ce33581'})
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();
      
        const count = await Products.find({prod_category:'6673eca9e5d3e08f0ce33581'}).countDocuments();
      
        res.render('wallets',{products: walletData,totalPages:Math.ceil(count/limit), currentPage:page,user:req.user,categories,sizes,colors });
    } catch (error) {
        console.log(error)

    }
   
   
}
const loadBelts = async(req,res)=>{
    try {
        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const categories = await Category.find();
        const sizes = await Size.find();
        const colors = await Color.find();   
        const limit = 5; 
        const products = await Products.find({prod_status:'ACTIVE'}).populate('prod_category');
        const beltsData = await Products.find({prod_category:'6673ecb8e5d3e08f0ce33584'})
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();
      
        const count = await Products.find({prod_category:'6673ecb8e5d3e08f0ce33584'}).countDocuments();
      
        res.render('belts',{products: beltsData,totalPages:Math.ceil(count/limit), currentPage:page,user:req.user,categories,sizes,colors });
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
        res.render('productDetails',{products,relatedProducts,user:req.user});
}
     catch (error) {
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
    loadFilteredProducts

}