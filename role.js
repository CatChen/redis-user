const Overload = require('jshelpers').Overload;

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
                id--;
                redis.setnx('role:' + name.toLowerCase() + ':id', id, function(error, set) {
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
        listRoles: function(callback) {
            callback = callback || emptyFunction;
            /* TODO: if 'global:nextRoleId' doesn't exist */
            redis.get('global:nextRoleId', function(error, length) {
                if (error) {
                    callback(null);
                    return;
                }
                var roles = [];
                var callbackCount = 0;
                for (var id = 0; id < length; id++) {
                    (function(id) {
                        redis.exists('role:' + id + ':name', function(error, exists) {
                            if (exists == 1) {
                                redis.get('role:' + id + ':name', function(error, name) {
                                    if (error) {
                                        /* prevent the callbackCount reaching the value of length */
                                        callbackCount--;
                                        callback(null);
                                        return;
                                    }
                                    roles.push({
                                        id: id,
                                        name: name
                                    });
                                    callbackCount++;
                                    if (callbackCount == length) {
                                        callback(roles.sort(function (role1, role2) { return role1.id - role2.id; }));
                                    }
                                });
                            } else {
                                callbackCount++;
                                if (callbackCount == length) {
                                    callback(roles.sort(function (role1, role2) { return role1.id - role2.id; }));
                                }
                            }
                        });
                    })(id);
                }
            });
        },
        getRole: Overload
            .add([Number], function(id) { role.getRole(id, emptyFunction); })
            .add([String], function(name) { role.getRole(name, emptyFunction); })
            .add([Number, Function], function(id, callback) {
                redis
                    .multi()
                    .get('role:' + id + ':name')
                    .exec(function(error, results) {
                        if (error) {
                            callback(null);
                            return;
                        }
                        callback({
                            id: id,
                            name: results[0]
                        });
                    });
            })
            .add([String, Function], function(name, callback) {
                redis.get('role:' + name.toLowerCase() + ':id', function(error, id) {
                    if (error) {
                        callback(null);
                        return;
                    }
                    if (id == null) {
                        callback(null);
                        return;
                    }
                    role.getRole(parseInt(id), callback);
                });
            }),
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
                    .del('role:' + role.name.toLowerCase() + ':id')
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
