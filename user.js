const Overload = require('jshelpers').Overload;

const crypto = require('crypto');
const emailRegExp = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
const passwordHashAlgorithm = 'sha1';

module.exports = function(redis) {
    var computeSHA1 = function(str) { return crypto.createHash(passwordHashAlgorithm).update(str).digest('hex'); };
    var emptyFunction = function() {};
    
    var user = {
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
                id--;
                redis.setnx('user:' + email.toLowerCase() + ':id', id, function(error, set) {
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
        listUsers: function(callback) {
            callback = callback || emptyFunction;
            /* TODO: if 'global:nextUserId' doesn't exist */
            redis.get('global:nextUserId', function(error, length) {
                if (error) {
                    callback(null);
                    return;
                }
                var users = [];
                var callbackCount = 0;
                for (var id = 0; id < length; id++) {
                    (function(id) {
                        redis.exists('user:' + id + ':email', function(error, exists) {
                            if (exists == 1) {
                                redis.get('user:' + id + ':email', function(error, email) {
                                    if (error) {
                                        /* prevent the callbackCount reaching the value of length */
                                        callbackCount--;
                                        callback(null);
                                        return;
                                    }
                                    users.push({
                                        id: id,
                                        email: email
                                    });
                                    callbackCount++;
                                    if (callbackCount == length) {
                                        callback(users.sort(function (user1, user2) { return user1.id - user2.id; }));
                                    }
                                });
                            } else {
                                callbackCount++;
                                if (callbackCount == length) {
                                    callback(users.sort(function (user1, user2) { return user1.id - user2.id; }));
                                }
                            }
                        });
                    })(id);
                }
            });
        },
        getUser: Overload
            .add([Number], function(id) { user.getUser(id, emptyFunction); })
            .add([String], function(email) { user.getUser(email, emptyFunction); })
            .add([Number, Function], function(id, callback) {
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
            })
            .add([String, Function], function(email, callback) {
                redis.get('user:' + email.toLowerCase() + ':id', function(error, id) {
                    if (error) {
                        callback(null);
                        return;
                    }
                    if (id == null) {
                        callback(null);
                        return;
                    }
                    user.getUser(parseInt(id), callback);
                });
            }),
        updateUserPassword: function(email, password, callback) {
            callback = callback || emptyFunction;
            user.getUser(email, function(user) {
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
        },
        deleteUser: function(email, callback) {
            callback = callback || emptyFunction;
            user.getUser(email, function(user) {
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
            user.getUser(email, function(user) {
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
    
    return user;
};
