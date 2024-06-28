
const mongoose = require('mongoose')
const User = require('../models/user');
const userManagementRoute = require("../routers/userManagementRouter");
var moment = require('moment');


const loadUserManagement = async(req,res)=>{

    try {
        if (req.session.userid) {
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

            const searchConditions = [
                { user_name: { $regex: ".*" + search + ".*", $options: 'i' } },
                { user_email: { $regex: ".*" + search + ".*", $options: 'i' } }
            ];

            // If the search term can be converted to a number, add a mobile number condition
            if (!isNaN(search)) {
                searchConditions.push({ user_contact:Number(search) });
            }

            const usersData = await User.find({$or: searchConditions})
            .limit(limit*1)
            .skip((page-1)*limit)
            .exec();

            const count = await User.find({$or: searchConditions}).countDocuments();
            

            res.render('userList',{ users: usersData, search: search,moment, totalPages:Math.ceil(count/limit), currentPage:page});
        }
    } catch (error) {
        console.log(error);
    }  

}

const blockUser = async(req,res)=>{
    try {   

        const id = req.query.id;
        const userData = await User.findById({_id:id});

        if(userData.isBlocked){
        await User.findByIdAndUpdate({_id:id},{$set:{isBlocked:false}});        
        res.status(301).redirect('/admin/users');
        }else{
        await User.findByIdAndUpdate({_id:id},{$set:{isBlocked:true}});
        console.log(userData)

        // destroy user sessions 
        const sessionCollection = mongoose.connection.collection('sessions');
        const sessions = await sessionCollection.find({ 'session.passport.user': userData._id.toString() }).toArray();
        for (const session of sessions) {
            await sessionCollection.deleteOne({ _id: session._id });
        }
        
        res.status(301).redirect('/admin/users');

        }
        } catch (error) {
           console.log(error)
        }   
   
}



module.exports = {
    loadUserManagement,
    blockUser,
}