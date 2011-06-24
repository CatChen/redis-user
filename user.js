const crypto = require('crypto');
const emailRegExp = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
const passwordHashAlgorithm = 'sha1';

module.exports = function(redis) {
    var computeSHA1 = function(str) { return crypto.createHash(passwordHashAlgorithm).update(str).digest('hex'); };
    var emptyFunction = function() {};
    
    var User = {
        createUser: function(email, password, callback) {
            callback = callback || emptyFunction;
            if (!emailRegExp.test(email)) {
                callback(false);
                return;
            }
            redis.incr('global:nextUserId', function(error, id) {
                if (error) {
                    callback(false);
                    return;
                }
                redis.setnx('user:' + email + ':id', id, function(error, set) {
                    if (error) {
                        callback(false);
                        return;
                    }
                    if (set == 0) {
                        callback(false);
                        return;
                    }
                    redis
                        .multi()
                        .set('user:' + id + ':email', email)
                        .set('user:' + id + ':password', computeSHA1(password))
                        .exec(function(error, results) {
                            if (error) {
                                callback(false);
                                return;
                            }
                            callback(true);
                        });
                });
            });
        },
        getUser: function(email, callback) {
            callback = callback || emptyFunction;
            redis.get('user:' + email + ':id', function(error, id) {
                if (error) {
                    callback(null);
                    return;
                }
                if (id == null) {
                    callback(null);
                    return;
                }
                redis
                    .multi()
                    .get('user:' + id + ':email')
                    .exec(function(error, results) {
                        if (error) {
                            callback(null);
                            return;
                        }
                        callback({
                            id: id,
                            email: results[0]
                        });
                    });
            });
        },
        updateUserPassword: function(email, oldPassword, newPassword, callback) {
            callback = callback || emptyFunction;
            User.validateUser(email, oldPassword, function(isValid) {
                if (!isValid) {
                    callback(false);
                    return;
                }
                User.getUser(email, function(user) {
                    if (user == null) {
                        callback(false);
                        return;
                    }
                    redis.set('user:' + user.id + ':password', computeSHA1(newPassword), function(error, password) {
                        if (error) {
                            callback(false);
                            return
                        }
                        callback(true);
                    })
                });
            });
        },
        deleteUser: function(email, callback) {
            callback = callback || emptyFunction;
            User.getUser(email, function(user) {
                if (user == null) {
                    callback(false);
                    return;
                }
                redis
                    .multi()
                    .del('user:' + user.id + ':email')
                    .del('user:' + user.id + ':password')
                    .del('user:' + user.email + ':id')
                    .exec(function(error, results) {
                        if (error) {
                            callback(false);
                            return;
                        }
                        callback(true);
                    });
            });
        },
        validateUser: function(email, passwordToValidate, callback) {
            callback = callback || emptyFunction;
            User.getUser(email, function(user) {
                if (user == null) {
                    callback(false);
                    return;
                }
                redis.get('user:' + user.id + ':password', function(error, password) {
                    if (error) {
                        callback(false);
                        return;
                    }
                    callback(computeSHA1(passwordToValidate) == password);
                });
            });
        }
    };
    
    return User;
};
