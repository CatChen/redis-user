const user = require('./user');
const role = require('./role');
const redis = require('redis');

module.exports = function(redisClient) {
    return {
        User: user(redisClient),
        Role: role(redisClient)
    };
};
