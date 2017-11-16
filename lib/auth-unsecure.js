'use strict';

function enableUnsecureAuth(app) {
    app.post('/api/admin/login', (req, res) => {
        const user = req.body;
        req.session.user = user;
        res
            .status(200)
            .json(user)
            .end();
    });

    app.use('/api/admin/', (req, res, next) => {
        if (req.session.user && req.session.user.email) {
            console.log(req.session);
            req.user = req.session.user;
            next();
        } else {
            return res
                .status('401')
                .json({
                    path: '/api/admin/login',
                    type: 'builtin',
                    message:
                        'You have to indetify yourself in order to use Unleash.',
                })
                .end();
        }
    });
}

module.exports = enableUnsecureAuth;
