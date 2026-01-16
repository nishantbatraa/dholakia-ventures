// ============================================
// USER MANAGEMENT - Global scope (no ES modules)
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Users = (function () {
    var USERS_KEY = 'family_office_users';
    var CURRENT_USER_KEY = 'family_office_current_user';

    var defaultPreferences = {
        dashboardWidgets: {
            summaryCards: true,
            recentInvestments: true,
            topPerformers: true,
            industryDistribution: true,
            quickStats: true
        },
        analyticsDefaults: {
            stage: 'all',
            industry: 'all'
        },
        theme: 'dark'
    };

    function generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function getUsers() {
        var users = localStorage.getItem(USERS_KEY);
        if (!users) {
            // Create default admin user
            var defaultUser = {
                id: 'user_admin',
                name: 'Admin',
                role: 'Admin',
                createdAt: new Date().toISOString(),
                preferences: JSON.parse(JSON.stringify(defaultPreferences))
            };
            var userList = [defaultUser];
            localStorage.setItem(USERS_KEY, JSON.stringify(userList));
            localStorage.setItem(CURRENT_USER_KEY, defaultUser.id);
            return userList;
        }
        return JSON.parse(users);
    }

    function getCurrentUser() {
        var userId = localStorage.getItem(CURRENT_USER_KEY);
        var users = getUsers();

        if (!userId) {
            // Default to first user
            if (users.length > 0) {
                localStorage.setItem(CURRENT_USER_KEY, users[0].id);
                return users[0];
            }
            return null;
        }

        var user = users.find(function (u) { return u.id === userId; });
        if (!user && users.length > 0) {
            // User not found, default to first
            localStorage.setItem(CURRENT_USER_KEY, users[0].id);
            return users[0];
        }
        return user;
    }

    function setCurrentUser(userId) {
        var users = getUsers();
        var user = users.find(function (u) { return u.id === userId; });
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, userId);
            return user;
        }
        return null;
    }

    function addUser(name, role) {
        var users = getUsers();
        var newUser = {
            id: generateId(),
            name: name,
            role: role || 'Viewer',
            createdAt: new Date().toISOString(),
            preferences: JSON.parse(JSON.stringify(defaultPreferences))
        };
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return newUser;
    }

    function updateUser(userId, updates) {
        var users = getUsers();
        var index = users.findIndex(function (u) { return u.id === userId; });
        if (index !== -1) {
            users[index] = Object.assign({}, users[index], updates);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return users[index];
        }
        return null;
    }

    function deleteUser(userId) {
        var users = getUsers();
        // Don't allow deleting the last user
        if (users.length <= 1) return false;

        var currentUser = getCurrentUser();
        users = users.filter(function (u) { return u.id !== userId; });
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // If deleted current user, switch to first user
        if (currentUser && currentUser.id === userId) {
            setCurrentUser(users[0].id);
        }
        return true;
    }

    function getUserPreferences() {
        var user = getCurrentUser();
        if (user && user.preferences) {
            return user.preferences;
        }
        return JSON.parse(JSON.stringify(defaultPreferences));
    }

    function setUserPreferences(prefs) {
        var user = getCurrentUser();
        if (!user) return null;

        var users = getUsers();
        var index = users.findIndex(function (u) { return u.id === user.id; });
        if (index !== -1) {
            users[index].preferences = Object.assign({}, users[index].preferences || {}, prefs);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return users[index].preferences;
        }
        return null;
    }

    function setWidgetPreference(widgetKey, enabled) {
        var prefs = getUserPreferences();
        prefs.dashboardWidgets[widgetKey] = enabled;
        setUserPreferences(prefs);
        return prefs;
    }

    function getAvatarColor(name) {
        var colors = [
            { bg: 'rgba(99, 102, 241, 0.3)', border: '#6366f1' },
            { bg: 'rgba(139, 92, 246, 0.3)', border: '#8b5cf6' },
            { bg: 'rgba(236, 72, 153, 0.3)', border: '#ec4899' },
            { bg: 'rgba(6, 182, 212, 0.3)', border: '#06b6d4' },
            { bg: 'rgba(16, 185, 129, 0.3)', border: '#10b981' },
            { bg: 'rgba(245, 158, 11, 0.3)', border: '#f59e0b' }
        ];
        var index = (name || 'A').charCodeAt(0) % colors.length;
        return colors[index];
    }

    function getInitials(name) {
        if (!name) return 'U';
        return name.split(' ')
            .map(function (word) { return word[0]; })
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    // Render user switcher dropdown
    function renderUserSwitcher() {
        var users = getUsers();
        var currentUser = getCurrentUser();
        var avatarColor = getAvatarColor(currentUser ? currentUser.name : 'Admin');

        var userOptions = users.map(function (u) {
            var isActive = currentUser && u.id === currentUser.id;
            var uColor = getAvatarColor(u.name);
            return '\
                <div class="user-option' + (isActive ? ' active' : '') + '" data-user-id="' + u.id + '" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; border-radius: 6px; transition: background 0.2s;">\
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: ' + uColor.bg + '; border: 2px solid ' + uColor.border + '; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">' + getInitials(u.name) + '</div>\
                    <div>\
                        <div style="font-weight: 500; font-size: 14px;">' + u.name + '</div>\
                        <div style="font-size: 11px; color: var(--color-text-muted);">' + (u.role || 'Viewer') + '</div>\
                    </div>\
                    ' + (isActive ? '<span style="margin-left: auto; color: var(--color-success);">✓</span>' : '') + '\
                </div>';
        }).join('');

        return '\
            <div class="user-switcher" style="position: relative;">\
                <button id="user-switcher-btn" style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: 8px; cursor: pointer; transition: all 0.2s;">\
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: ' + avatarColor.bg + '; border: 2px solid ' + avatarColor.border + '; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600;">' + getInitials(currentUser ? currentUser.name : 'Admin') + '</div>\
                    <span style="font-size: 13px; font-weight: 500;">' + (currentUser ? currentUser.name : 'Admin') + '</span>\
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>\
                </button>\
                <div id="user-dropdown" class="user-dropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 8px; min-width: 220px; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 1000; overflow: hidden;">\
                    <div style="padding: 12px; border-bottom: 1px solid var(--color-border);">\
                        <div style="font-size: 11px; text-transform: uppercase; color: var(--color-text-muted); font-weight: 600;">Switch User</div>\
                    </div>\
                    <div style="max-height: 250px; overflow-y: auto; padding: 8px;">' + userOptions + '</div>\
                    <div style="padding: 8px; border-top: 1px solid var(--color-border);">\
                        <button id="add-user-btn" style="width: 100%; padding: 10px; background: var(--color-accent-gradient); border: none; border-radius: 6px; color: white; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">\
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>\
                            Add User\
                        </button>\
                    </div>\
                </div>\
            </div>';
    }

    // Render add user modal
    function renderAddUserModal() {
        return '\
            <div id="add-user-modal" class="modal" style="display: flex;">\
                <div class="modal-backdrop"></div>\
                <div class="modal-content" style="width: 400px;">\
                    <div class="modal-header">\
                        <h2>Add New User</h2>\
                        <button id="close-user-modal" class="modal-close">\
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>\
                        </button>\
                    </div>\
                    <div class="modal-body">\
                        <div class="form-group">\
                            <label class="form-label">Name</label>\
                            <input type="text" id="new-user-name" class="form-input" placeholder="Enter user name" required>\
                        </div>\
                        <div class="form-group">\
                            <label class="form-label">Role</label>\
                            <select id="new-user-role" class="form-select">\
                                <option value="Admin">Admin</option>\
                                <option value="Partner">Partner</option>\
                                <option value="Analyst" selected>Analyst</option>\
                                <option value="Viewer">Viewer</option>\
                            </select>\
                        </div>\
                    </div>\
                    <div class="modal-footer">\
                        <button id="cancel-user-modal" class="btn btn-secondary">Cancel</button>\
                        <button id="save-new-user" class="btn btn-primary">Add User</button>\
                    </div>\
                </div>\
            </div>';
    }

    function initEvents() {
        // User switcher toggle
        document.addEventListener('click', function (e) {
            var switcher = document.getElementById('user-switcher-btn');
            var dropdown = document.getElementById('user-dropdown');

            if (!dropdown) return;

            if (e.target.closest('#user-switcher-btn')) {
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            } else if (!e.target.closest('#user-dropdown')) {
                dropdown.style.display = 'none';
            }
        });

        // User selection
        document.addEventListener('click', function (e) {
            var userOption = e.target.closest('.user-option');
            if (userOption) {
                var userId = userOption.dataset.userId;
                setCurrentUser(userId);
                // Refresh the app
                if (FamilyOffice.App && FamilyOffice.App.refresh) {
                    FamilyOffice.App.refresh();
                } else {
                    window.location.reload();
                }
            }
        });

        // Add user button
        document.addEventListener('click', function (e) {
            if (e.target.closest('#add-user-btn')) {
                var modalContainer = document.getElementById('modal-container');
                if (modalContainer) {
                    modalContainer.innerHTML = renderAddUserModal();
                }
            }
        });

        // Close user modal
        document.addEventListener('click', function (e) {
            if (e.target.closest('#close-user-modal') || e.target.closest('#cancel-user-modal') || e.target.closest('.modal-backdrop')) {
                var modal = document.getElementById('add-user-modal');
                if (modal) {
                    modal.remove();
                }
            }
        });

        // Save new user
        document.addEventListener('click', function (e) {
            if (e.target.closest('#save-new-user')) {
                var nameInput = document.getElementById('new-user-name');
                var roleSelect = document.getElementById('new-user-role');

                if (nameInput && nameInput.value.trim()) {
                    var newUser = addUser(nameInput.value.trim(), roleSelect ? roleSelect.value : 'Viewer');
                    setCurrentUser(newUser.id);

                    var modal = document.getElementById('add-user-modal');
                    if (modal) modal.remove();

                    // Refresh
                    if (FamilyOffice.App && FamilyOffice.App.refresh) {
                        FamilyOffice.App.refresh();
                    } else {
                        window.location.reload();
                    }
                }
            }
        });
    }

    // Initialize events on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEvents);
    } else {
        initEvents();
    }

    return {
        getUsers: getUsers,
        getCurrentUser: getCurrentUser,
        setCurrentUser: setCurrentUser,
        addUser: addUser,
        updateUser: updateUser,
        deleteUser: deleteUser,
        getUserPreferences: getUserPreferences,
        setUserPreferences: setUserPreferences,
        setWidgetPreference: setWidgetPreference,
        getAvatarColor: getAvatarColor,
        getInitials: getInitials,
        renderUserSwitcher: renderUserSwitcher,
        renderAddUserModal: renderAddUserModal
    };
})();
