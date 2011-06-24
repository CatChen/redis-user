# Introduction

This is a simple membership component. It stores user and role data in Redis.

# Roadmap

0.1.0 - User implementation
0.2.0 - Role implementation
0.3.0 - Custom property implementation

# API

Initialize Redis and User.

    const redis = require('redis');
    var redisClient = redis.createClient();
    const user = require('redis-user')(redisClient);
    
Call `createUser` during the user registration process.

    user.createUser(email, password, function(result) {
        if (result) {
            /* continue */
        } else {
            /* show error */
        }
    });

Call `validateUser` during the user login process.

    user.validateUser(email, password, function(result) {
        if (result) {
            /* login success */
        } else {
            /* login failure */
        }
    });

When the user wants to change the password, call `updateUserPassword`.

    user.updateUserPassword(email, oldPassword, newPassword) {
        if (result) {
            /* success */
        } else {
            /* failure */
        }
    });
