const User = require('../models/user');

    const checkBlocked = async(req,res,next)=>{
        if (req.isAuthenticated()) {
            try {
                const user = await User.findById(req.user.id).exec();
                if (user && user.isBlocked) {
                    req.logout((err) => {
                        if (err) {
                            return next(err);
                        }
                        req.session.destroy((err) => {
                            if (err) {
                                return next(err);
                            }
                            res.status(302).redirect('/');
                        });
                    });
                } else {
                    next();
                }
            } catch (err) {
                next(err);
            }
        } else {
            next();
        }
    }
       
    module.exports = checkBlocked;
