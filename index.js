const user = require('./user');
const role = require('./role');

module.exports = function(redisClient) {
    var result = user(redisClient);
    result.role = role(redisClient, result);
    return result;
};
