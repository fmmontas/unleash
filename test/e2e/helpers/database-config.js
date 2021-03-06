'use strict';

function getDatabaseUrl() {
    if (process.env.TEST_DATABASE_URL) {
        return process.env.TEST_DATABASE_URL;
    } else {
        return 'postgres://unleash_user:password@localhost:5432/unleash';
    }
}

module.exports = {
    getDatabaseUrl,
};
