# Introduction

This is a simple membership component. It stores user and role data in Redis.

# Roadmap

    * 0.1.0 - User implementation
    * 0.2.0 - Role implementation
    * 0.3.0 - Custom property implementation

# API

## User

Assuming that you have initialized [redis](https://github.com/mranney/node_redis), you can initialize user by `require('redis-user')`.

    const redis = require('redis');
    var redisClient = redis.createClient();
    const user = require('redis-user')(redisClient);
    
Call `createUser` during the user registration process.

    user.createUser('user@example.com', 'ThePasswordIsReallyReallyLengthy!', function(result) {
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

## Role

If you want to assign roles to users, you can use `user.role`.

    const role = user.role;

Before assigning a role to users, you must first create it by calling `role.createRole`.

    role.createRole('admin');

Then you can assign users to groups by calling `role.addUsersToGroups`. You can also remove users from groups by calling `role.removeUsersFromGroups`.

    role.addUsersToGroups(['user0@example.com', 'user2@example.com'], ['admin'], function(result) {
        if (result) {
            /* success */
        } else {
            /* failure */
        }
    });

If you want to know whether a user has a role, you can call `isUserInRole`.

    role.isUserInRole('user@example.com', 'admin', function(result) {
        if (result) {
            /* user@example.com has admin role */
        } else {
            /* user@example.com hasn't admin role */
        }
    });
