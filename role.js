module.exports = function(redis) {
    var addUsersToRole = function(userEmails, roleName) {
        
    };
    
    var addUserToRole = function(userEmail, roleName) {
        
    };
    
    var Role = {
        createRole: function(name) {},
        getRole: function(name) {},
        getAllRoles: function() {},
        deleteRole: function(name) {},
        addUsersToRoles: function(userEmails, roleNames) {},
        removeUsersFromRoles: function(userEmails, roleNames) {},
        getRolesForUser: function(userEmail) {},
        isUserInRole: function(userEmail, roleName) {}
    };
    
    return Role
};
