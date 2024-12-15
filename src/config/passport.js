import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import UserGG from "../models/UserFromGG.js";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      callbackURL: "/auth/google/redirect",
      clientID: process.env.Google_ClientID,
      clientSecret: process.env.Google_ClientSecret,
    },
    (accessToken, refreshToken, profile, done) => {
      // Check if user already exists in our db
      UserGG.findOne({ googleID: profile.id }).then((currentUser) => {
        if (currentUser) {
          // Already have the user
          console.log("User is : ", currentUser);
        } else {
          // If not, create new
          new UserGG({
            name: profile.displayName,
            googleID: profile.id,
          })
            .save()
            .then((newUser) => {
              console.log("New user created" + newUser);
            });
        }
      });
    }
  )
);

export default passport;
