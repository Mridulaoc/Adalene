const isSignedIn = async(req,res,next)=>{
    try {

        if(req.session.userId){

        }else{
            res.redirect('/signin');
        }
        next();
        
    } catch (error) {
        console.log(error);
    }
}


const isSignedOut = async(req,res,next)=>{
    try {
        if(req.session.userId){
            res.redirect('/');
        }
    } catch (error) {
        console.log(error)
    }
    next();
}

module.exports ={isSignedIn, isSignedOut}