const passport = require('passport');
const User = require('./models/user');
const googleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
require('dotenv/config')

passport.serializeUser((user,done)=>{
    done(null,user.id);
})
passport.deserializeUser((id,done)=>{
    const user = { id};
    done(null, user);
     
})

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

// passport.use(new LocalStrategy((usernameField:'email', password, done) => {
//     const user = User.findOne({user_email:email});
//     if (!user) {
//         return done(null, false, { message: 'Incorrect username.' });
//     }
//     bcrypt.compare(password, user_password, (err, res) => {
//         if (res) {
//             return done(null, user);
//         } else {
//             return done(null, false, { message: 'Incorrect password.' });
//         }
//     });
// }));