module.exports = function(redisClient) {
    var addUsersToRole = function(userEmails, roleName) {
        
    };
    
    var addUserToRole = function(userEmail, roleName) {
        
    };
    
    return {
        createRole: function(name) {},
        getRole: function(name) {},
        getAllRoles: function() {},
        deleteRole: function(name) {},
        addUsersToRoles: function(userEmails, roleNames) {},
        removeUsersFromRoles: function(userEmails, roleNames) {},
        getRolesForUser: function(userEmail) {},
        isUserInRole: function(userEmail, roleName) {}
    };
};
