const crypto = require('crypto');
const sha1 = crypto.createHash('sha1');

module.exports = function(redisClient) {
    var computeSHA1 = function(str) { return sha1.update(str).digest('hex'); };
    
    return {
        createUser: function(email, password, callback) {
            redis.incr('global:nextUserId', function(error, id) {
                if (error) {
                    callback(false);
                } else {
                    redis.multi()
                        .set('user:' + id + ':email', email)
                        .set('user:' + id + ':password', computeSHA1(password))
                        .set('user:' + email + ':id', id)
                        .exec(function(error, results) {
                            if (error) {
                                callback(false);
                            } else {
                                callback(true);
                            }
                        });
                }
            });
        },
        getUser: function(email, callback) {
            redis.get('user:' + email + ':id', function(error, id) {
                
            });
        },
        getAllUsers: function(callback) {},
        updateUserPassword: function(email, oldPassword, newPassword, callback) {},
        deleteUser: function(email, callback) {}
    };
};
