const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

// Configure Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Extract user info from Google profile
                const email = profile.emails[0].value;
                const firstName = profile.name.givenName;
                const lastName = profile.name.familyName;
                const avatar = profile.photos[0]?.value;

                // Check if user exists with this email
                let user = await User.findOne({ email });

                if (user) {
                    // User exists - link Google account if not already linked
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.authProvider = 'google';
                        user.isEmailVerified = true; // Auto-verify Google users

                        // Safely update avatar if not already set
                        if (avatar) {
                            if (!user.profile) user.profile = {};
                            if (!user.profile.avatar) user.profile.avatar = {};
                            if (!user.profile.avatar.url) {
                                user.profile.avatar.url = avatar;
                            }
                        }

                        await user.save({ validateBeforeSave: false });
                    }
                } else {
                    // Create new user with Google account
                    user = new User({
                        email,
                        firstName,
                        lastName,
                        googleId: profile.id,
                        authProvider: 'google',
                        isEmailVerified: true, // Auto-verify Google users
                        profile: {
                            avatar: {
                                url: avatar,
                            },
                        },
                    });

                    // Save without validation (OAuth users don't have passwords)
                    await user.save({ validateBeforeSave: false });
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
