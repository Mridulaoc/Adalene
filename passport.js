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

passport.use(new googleStrategy({
    clientID:"79618050499-8jbji070v2i38494p5ourjb34u2srcio.apps.googleusercontent.com",
    clientSecret:"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",
    callbackURL:"http://localhost:3000/auth/google/callback",
    passReqToCallback:true,
},
function(request, accessToken,refreshToken,profile,done) {
    return done(null,profile);
}

))

passport.use(new LocalStrategy((email, password, done) => {
    const user = User.findOne({user_email:email});
    if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
    }
    bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
            return done(null, user);
        } else {
            return done(null, false, { message: 'Incorrect password.' });
        }
    });
}));