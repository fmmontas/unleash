'use strict';

const passport = require('passport');
const GoogleOAuth2Strategy = require('passport-google-auth').Strategy;

passport.use(
    new GoogleOAuth2Strategy(
        {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },

        (accessToken, refreshToken, profile, done) => {
            done(null, {
                name: profile.displayName,
                email: profile.emails[0].value,
            });
        }
    )
);

function enableGoogleOauth(app) {
    // PASSPORT START
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));
    app.get('/api/admin/login', passport.authenticate('google'));

    app.get(
        '/auth/callback',
        passport.authenticate('google', {
            failureRedirect: '/api/admin/error-login',
        }),
        (req, res) => {
            // Successful authentication, redirect to your app.
            res.redirect('/');
        }
    );

    // TODO: this is not google auth spesific
    app.use('/api/admin/', (req, res, next) => {
        if (req.user) {
            next();
        } else {
            return res
                .status('401')
                .json({
                    path: '/api/admin/login',
                    type: 'custom',
                    message:
                        'Click the link and indetify yourself via google-auth',
                })
                .end();
        }
    });
    // Passport end
}

module.exports = enableGoogleOauth;
