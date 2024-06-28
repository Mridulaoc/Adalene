const adminRoute = require('../routers/adminRouter');
const Admin = require('../models/admin');

const loadSigIn = (req,res)=>{
    if(req.session.userid){
        res.status(301).redirect('/admin/dashboard');
    }
    res.render('signin');
}

const verifySignIn = async(req,res)=>{
    try {
        const {email,password} = req.body;
        const adminData = await Admin.findOne({admin_email: email, admin_password: password});
        console.log(email,password);
        console.log(adminData)
        if(adminData){
            req.session.userid = adminData._id;       
            res.redirect('/admin/dashboard');   
        }else{
            res.status(200).render('signin', {message:"Username or password is incorrect"}); 
        }

    } catch (error) {
        console.log(err);
    }
    
}
const loadDashboard = (req,res)=>{
    if(req.session.userid){
        res.render('dashboard');
    }else{
        res.redirect('/admin');
    }
    
}

const adminSignOut = (req,res)=>{
    try {
        if(req.session.userid){
            req.session.destroy();
            res.redirect('/admin');
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports ={
    loadSigIn,
    verifySignIn,
    loadDashboard,
    adminSignOut
}