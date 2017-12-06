'use strict';

const User = require('./user');
const AuthenticationRequired = require('./authentication-required');

function enableUnsecureAuth(app) {
    app.post('/api/admin/login', (req, res) => {
        const user = req.body;
        req.session.user = new User({ email: user.email });
        res
            .status(200)
            .json(req.session.user)
            .end();
    });

    app.use('/api/admin/', (req, res, next) => {
        if (req.session.user && req.session.user.email) {
            req.user = req.session.user;
        }
        next();
    });

    app.use('/api/admin/', (req, res, next) => {
        if (req.user) {
            next();
        } else {
            return res
                .status('401')
                .json(
                    new AuthenticationRequired({
                        path: '/api/admin/login',
                        type: 'builtin',
                        message:
                            'You have to indetify yourself in order to use Unleash.',
                    })
                )
                .end();
        }
    });
}

module.exports = function(config, app) {
    if (config.adminAuthentication === 'builtin') {
        enableUnsecureAuth(app);
    }
};
