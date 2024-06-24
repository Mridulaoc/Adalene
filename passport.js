const passport = require('passport');
const User = require('./models/user');
const googleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
require('dotenv/config')


passport.use(
    new googleStrategy({
    clientID:"79618050499-8jbji070v2i38494p5ourjb34u2srcio.apps.googleusercontent.com",
    clientSecret:"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",
    callbackURL:"http://localhost:3000/auth/google/callback",
    passReqToCallback:true,
},
function(request, accessToken,refreshToken,profile,done) {
    // console.log(profile)
    User.findOne({user_googleId: profile.id}).then((currentUser)=>{
        if(currentUser){
            console.log('User is', currentUser)
        }else{
            new User({
                user_email: profile.emails[0].value,
                user_name: profile.displayName,
                isVerified:profile.emails[0].verified,
                user_googleId:profile.id,
            }).save()
        }
    })  

    return done(null,profile);
}

))

passport.use(new LocalStrategy(
    {
        usernameField:'email',
        passwordField:'password',
    },
    async(email,password,done) => {
    const user = await User.findOne({user_email:email});
    console.log(user)
    if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
    }
    bcrypt.compare(password, user.user_password, (err, res) => {
        if (res) {
            return done(null, user);
        } else {
            return done(null, false, { message: 'Incorrect password.' });
        }
    });
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