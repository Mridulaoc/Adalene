const User = require('../models/user');
const userManagementRoute = require("../routers/userManagementRouter");


const loadUserManagement = async(req,res)=>{

    try {
        const users = await User.find();
        res.render('userList',{users: users});
    } catch (error) {
        console.log(error);
    }  

}

const blockUser = async(req,res)=>{
    const id = req.query.id;
    const userData = await User.findById({_id:id});
    if(userData.isBlocked){
        await User.findByIdAndUpdate({_id:id},{$set:{isBlocked:false}});
        res.redirect('/admin/users');
    }else{
        await User.findByIdAndUpdate({_id:id},{$set:{isBlocked:true}});
        console.log(userData)
        res.redirect('/admin/users');
    }
   
}



module.exports = {
    loadUserManagement,
    blockUser,
}