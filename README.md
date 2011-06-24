- Introduction

This is a simple membership module. It stores user and role data in Redis.

- Roadmap

0.1.0 - User implementation
0.2.0 - Role implementation
0.3.0 - Custom property implementation

- API

`
const User = require('redis-user');

/* when user registers an account */
User.createUser(email, password, function(result) {
    if (result) {
        /* continue */
    } else {
        /* show error */
    }
});
`