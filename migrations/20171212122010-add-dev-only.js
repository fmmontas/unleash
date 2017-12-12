'use strict';

exports.up = function(db, callback) {
    db.runSql(
        `
ALTER TABLE features ADD COLUMN dev_only INTEGER DEFAULT 0;
       `,
        callback
    );
};

exports.down = function(db, callback) {
    callback();
};
