const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const userModel = require("../models/userData");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://capncut-backend-1.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let existingUser = await userModel.findOne({ googleId: profile.id });
        if (existingUser) return done(null, existingUser);

        let emailUser = await userModel.findOne({ email: profile.emails[0].value });
        if (emailUser) {
          emailUser.googleId = profile.id;
          await emailUser.save();
          return done(null, emailUser);
        }

        const newUser = new userModel({
          googleId: profile.id,
          email: profile.emails[0].value,
          userName: profile.displayName,
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await userModel.findById(id);
  done(null, user);
});

module.exports = passport;
