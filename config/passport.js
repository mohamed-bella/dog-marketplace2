const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user'); // For trainers
const Seller = require('../models/seller'); // For sellers
require('dotenv').config();
const passport = require('passport');
const slugify = require('slugify');

passport.use(
     new GoogleStrategy({
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/auth/google/cb', // Ensure this matches the Google Developer Console
     },
          async (accessToken, refreshToken, profile, done) => {
               try {
                    // Check if the user is a trainer
                    let user = await User.findOne({ googleId: profile.id });
                    if (user) {
                         return done(null, user);
                    }

                    // If not a trainer, check if the user is a seller
                    let seller = await Seller.findOne({ googleId: profile.id });
                    if (!seller) {
                         // Try to generate a unique slug
                         let slug;
                         let isUniqueSlug = false;
                         let attemptCount = 0;  // Add a counter to avoid an infinite loop

                         while (!isUniqueSlug && attemptCount < 10) { // Limit slug generation attempts to 10
                              const randomNum = Math.floor(1000 + Math.random() * 9000);
                              slug = slugify(`${profile.displayName}-${randomNum}`, { lower: true, strict: true });

                              // Check if the slug already exists
                              const existingSeller = await Seller.findOne({ slug });
                              if (!existingSeller) {
                                   isUniqueSlug = true; // Slug is unique, exit the loop
                              }
                              attemptCount++; // Increment the counter
                         }

                         // Check if emails exist in the Google profile
                         const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

                         // Create a new seller if the seller does not exist
                         seller = new Seller({
                              slug: slug,
                              googleId: profile.id,
                              displayName: profile.displayName,
                              image: profile.photos[0].value,
                              email: email || 'noemail@unknown.com' // Handle the case where no email is returned
                         });

                         await seller.save();
                    }

                    done(null, seller);
               } catch (err) {
                    console.error(err);
                    done(err, null);
               }
          })
);

passport.serializeUser((user, done) => {
     done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
     try {
          // Check both User (trainer) and Seller (seller) collections
          let user = await User.findById(id);
          if (user) {
               done(null, user);
          } else {
               let seller = await Seller.findById(id);
               done(null, seller);
          }
     } catch (err) {
          done(err, null);
     }
});
