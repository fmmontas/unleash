'use strict';

const gravatar = require('gravatar');

module.exports = class User {
    constructor({ name, email, imageUrl }) {
        this.email = email;
        this.name = name;
        this.imageUrl =
            imageUrl || gravatar.url(email, { s: '42', d: 'retro' });
    }
};
