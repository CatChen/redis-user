const user = require('./user');
const role = require('./role');

module.exports = function(redisClient) {
    var User = user(redisClient);
    User.Role = role(redisClient);
    return User;
};
