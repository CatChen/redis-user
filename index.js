const user = require('./user');
const role = require('./role');

module.exports = function(redisClient) {
    return {
        User: user(redisClient),
        Role: role(redisClient)
    };
};
