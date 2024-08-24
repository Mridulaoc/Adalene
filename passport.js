const passport = require('passport');
const User = require('./models/user');
const googleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
require('dotenv/config')




passport.use(
    new googleStrategy({
    clientID:process.env.PASSPORT_CLIENT_ID,
    clientSecret:process.env.PASSPORT_CLIENT_SECRET,
    callbackURL:"http://localhost:3000/auth/google/callback",
    passReqToCallback:true,
},
 async(request, accessToken,refreshToken,profile,done)=>
  {
    try {
        let user = await User.findOne({ user_googleId: profile.id }).exec();
        
        if (user && user.authMethod !== 'google') {
            return done(null, false, { message: 'Please use password login.' });
        }
        if (!user) {
            user = new User({
                user_email: profile.emails[0].value,
                user_name: profile.displayName ,
                user_googleId: profile.id,
                authMethod: 'google'
                
            });
            await user.save();
        }
        return done(null, user);
    } catch (error) {
        console.log(error);
    }  
}
))

passport.use(new LocalStrategy(
    {
        usernameField:'email',
        passwordField:'password',
    },

    async(email,password,done) => {
    const user = await User.findOne({user_email:email});
    // console.log(user)
    if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
    }

    if (user.isBlocked) return done(null, false, { message: 'You are blocked.' });

    if (user.authMethod !== 'local') {
        return done(null, false, { message: 'Please use Google login.' });
    }

    const isMatch = await bcrypt.compare(password, user.user_password);
   
        if (isMatch) {
            console.log(user)
            return done(null, user);
        } else {
            console.log("incorrect_password")
            return done(null, false, { message: 'Incorrect password.' });
        }
    }));



passport.serializeUser((user,done)=>{
    done(null,user.id);
})
passport.deserializeUser(async(id,done)=>{
    try {
        // const user = await User.findById(id);
        const user = {id};
        done(null, user);
    } catch (error) {
        done(error,false)
    }
    
     
})