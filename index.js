const Async = require('jshelpers').Async;

var addAsyncFacade = function(obj) {
    for (var key in obj) {
        (function(key) {
            var item = obj[key];
            if (item instanceof Function) {
                obj[key + 'Async'] = function() {
                    var operation = new Async.Operation();
                    var argumentsArray = Array.prototype.slice.call(arguments, 0);
                    var callback = function(result) { operation.yield(result); };
                    argumentsArray.push(callback);
                    obj[key].apply(obj, argumentsArray);
                    return operation;
                };
            }
        })(key);
    }
    return obj;
};

module.exports = function(redisClient, useAsync) {
    const user = require('./user')(redisClient);
    const role = require('./role')(redisClient, user);
    
    var result;
    if (useAsync) {
        result = addAsyncFacade(user);
        result.role = addAsyncFacade(role);
    } else {
        result = user;
        result.role = role;
    }
    return result;
};
