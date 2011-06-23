module.exports = function(redisClient) {
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
