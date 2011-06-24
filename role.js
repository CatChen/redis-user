const nameRegExp = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

module.exports = function(redis, user) {
    var emptyFunction = function() {};
    
    var getUsers = function(userEmails, callback) {
        var callbackCount = 0;
        var users = [];
        {
            for (var i = 0; i < userEmails.length; i++) {
                user.getUser(userEmails[i], function(user) {
                    callbackCount++;
                    if (user) {
                        users.push(user);
                    }
                    if (callbackCount == userEmails.length) {
                        callback(users);
                    }
                });
            }
        }
    }
    
    var addUsersToRole = function(users, role, callback) {
        var callbackCount = 0;
        var callbackResult = true;
        for (var i = 0; i < users.length; i++) {
            addUserToRole(users[i], role, function(result) {
                callbackCount++;
                callbackResult = callbackResult && result;
                if (callbackCount == users.length) {
                    callback(callbackResult);
                }
            });
        }
    };
    
    var addUserToRole = function(user, role, callback) {
        redis
            .multi()
            .sadd('user:' + user.id + ':roles', role.id)
            .sadd('role:' + role.id + ':users', user.id)
            .exec(function(error, results) {
                if (error) {
                    callback(false);
                    return;
                }
                callback(true);
            });
    };
    
    var removeUsersFromRole = function(users, role, callback) {
        var callbackCount = 0;
        var callbackResult = true;
        for (var i = 0; i < users.length; i++) {
            removeUserFromRole(users[i], role, function(result) {
                callbackCount++;
                callbackResult = callbackResult && result;
                if (callbackCount == users.length) {
                    callback(callbackResult);
                }
            });
        }
    };
    
    var removeUserFromRole = function(user, role, callback) {
        redis
            .multi()
            .srem('user:' + user.id + ':roles', role.id)
            .srem('role:' + role.id + ':users', user.id)
            .exec(function(error, results) {
                if (error) {
                    callback(false);
                    return;
                }
                callback(true);
            });
    };
    
    var role = {
        createRole: function(name, callback) {
            callback = callback || emptyFunction;
            if (!nameRegExp.test(name)) {
                callback(false);
                return;
            }
            redis.incr('global:nextRoleId', function(error, id) {
                if (error) {
                    callback(false);
                    return;
                }
                redis.setnx('role:' + name + ':id', id, function(error, set) {
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
                        .set('role:' + id + ':name', name)
                        .exec(function(error, result) {
                            if (error) {
                                callback(false);
                                return;
                            }
                            callback(true);
                        });
                });
            });
        },
        getRole: function(name, callback) {
            callback = callback || emptyFunction;
            redis.get('role:' + name + ':id', function(error, id) {
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
                    .get('user:' + id + ':name')
                    .exec(function(error, results) {
                        if (error) {
                            callback(null);
                            return;
                        }
                        callback({
                            id: id,
                            name: name
                        });
                    });
            });
        },
        deleteRole: function(name, callback) {
            callback = callback || emptyFunction;
            role.getRole(name, function(role) {
                if (role == null) {
                    callback(false);
                    return;
                }
                redis
                    .multi()
                    .del('role:' + role.id + ':name')
                    .del('role:' + role.name + ':id')
                    .exec(function(error, results) {
                        if (error) {
                            callback(false);
                            return;
                        }
                        callback(true);
                    });
            });
        },
        addUsersToRoles: function(userEmails, roleNames, callback) {
            callback = callback || emptyFunction;
            getUsers(userEmails, function(users) {
                var callbackCount = 0;
                var callbackResult = true;
                {
                    for (var i = 0; i < roleNames.length; i++) {
                        role.getRole(roleNames[i], function(role) {
                            if (role) {
                                addUsersToRole(users, role, function(result) {
                                    callbackCount++;
                                    callbackResult = callbackResult && result;
                                    if (callbackCount == roleNames.length) {
                                        callback(callbackResult);
                                    }
                                });
                            } else {
                                if (callbackCount == roleNames.length) {
                                    callbackCount++;
                                    callback(callbackResult);
                                }
                            }
                        });
                    }
                }
            });
        },
        removeUsersFromRoles: function(userEmails, roleNames, callback) {
            callback = callback || emptyFunction;
            getUsers(userEmails, function(users) {
                var callbackCount = 0;
                var callbackResult = true;
                {
                    for (var i = 0; i < roleNames.length; i++) {
                        role.getRole(roleNames[i], function(role) {
                            if (role) {
                                removeUsersFromRole(users, role, function(result) {
                                    callbackCount++;
                                    callbackResult = callbackResult && result;
                                    if (callbackCount == roleNames.length) {
                                        callback(callbackResult);
                                    }
                                });
                            } else {
                                callbackCount++;
                                if (callbackCount == roleNames.length) {
                                    callback(callbackResult);
                                }
                            }
                        });
                    }
                }
            });
        },
        isUserInRole: function(userEmail, roleName, callback) {
            callback = callback || emptyFunction;
            user.getUser(userEmail, function(user) {
                if (user == null) {
                    callback(false);
                    return;
                }
                role.getRole(roleName, function(role) {
                    if (role == null) {
                        callback(false);
                        return;
                    }
                    redis.sismember('role:' + role.id + ':users', user.id, function(error, result) {
                        if (error) {
                            callback(false);
                            return;
                        }
                        callback(result == 1);
                    });
                });
            });
        }
    };
    
    return role
};
