const crypto = require('crypto');
const sha1 = crypto.createHash('sha1');

module.exports = function(redisClient) {
    var computeSHA1 = function(str) { return sha1.update(str).digest('hex'); };
    
    return {
        createUser: function(email, password) {
            var id = redis.incr('global:nextUserId');
        },
        getUser: function(email) {},
        getAllUsers: function() {},
        updateUserPassword: function(email, oldPassword, newPassword) {},
        deleteUser: function(email) {}
    };
};
