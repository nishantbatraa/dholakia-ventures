// ============================================
// SETTINGS MODULE - Admin Settings Page
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Settings = (function () {
    var Data = FamilyOffice.Data;
    var Components = FamilyOffice.Components;
    var Utils = FamilyOffice.Utils;

    function render() {
        var html = Components.renderSettingsPage();
        // If called as a refresh (not initial render), update the DOM
        var pageContent = document.getElementById('page-content');
        if (pageContent && pageContent.querySelector('.settings-container')) {
            pageContent.innerHTML = html;
            initEvents(); // Re-attach event handlers
        }
        return html;
    }

    function initEvents() {
        var pageContent = document.getElementById('page-content');

        pageContent.addEventListener('click', function (e) {
            // Add new item buttons
            if (e.target.id === 'add-industry-settings-btn') {
                showAddInput('industry');
            }
            if (e.target.id === 'add-team-settings-btn') {
                showAddInput('team');
            }
            if (e.target.id === 'add-hq-settings-btn') {
                showAddInput('hq');
            }

            // Save new item buttons
            if (e.target.id === 'save-industry-settings-btn') {
                saveNewItem('industry');
            }
            if (e.target.id === 'save-team-settings-btn') {
                saveNewItem('team');
            }
            if (e.target.id === 'save-hq-settings-btn') {
                saveNewItem('hq');
            }

            // Cancel buttons
            if (e.target.classList.contains('cancel-add-btn')) {
                hideAddInputs();
            }

            // Remove item buttons
            if (e.target.classList.contains('remove-settings-item')) {
                var type = e.target.dataset.type;
                var name = e.target.dataset.name;
                removeItem(type, name);
            }

            // Data management buttons
            if (e.target.id === 'export-data-btn') {
                exportData();
            }
            if (e.target.id === 'export-excel-btn') {
                exportToExcel();
            }
            if (e.target.id === 'import-data-btn') {
                document.getElementById('import-file-input').click();
            }
            if (e.target.id === 'reset-data-btn') {
                resetData();
            }

            // AI Assistant API key
            if (e.target.id === 'save-api-key-btn') {
                saveApiKey();
            }

            // User management buttons
            if (e.target.id === 'add-user-settings-btn') {
                showAddUserModal();
            }
            if (e.target.classList.contains('edit-user-btn')) {
                var userId = e.target.dataset.userId;
                var userName = e.target.dataset.userName;
                var userRole = e.target.dataset.userRole;
                showEditUserModal(userId, userName, userRole);
            }
            if (e.target.classList.contains('delete-user-btn')) {
                var userId = e.target.dataset.userId;
                var userName = e.target.dataset.userName;
                deleteUser(userId, userName);
            }
        });

        // File input change handler for import
        var fileInput = document.getElementById('import-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', function (e) {
                var file = e.target.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.onload = function (evt) {
                        var result = Data.importData(evt.target.result);
                        if (result.success) {
                            showNotification('Data imported successfully!', 'success');
                            render(); // Refresh the page
                        } else {
                            showNotification(result.message, 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        // Cloud Sync - Test Connection button (cloud-first: always synced automatically)
        var testBtn = document.getElementById('check-connection-btn');
        if (testBtn) {
            testBtn.addEventListener('click', function () {
                var Supabase = FamilyOffice.Supabase;
                if (!Supabase || !Supabase.checkConnection) {
                    showNotification('Supabase not available', 'error');
                    return;
                }
                testBtn.disabled = true;
                testBtn.innerHTML = '<span class="btn-icon">⏳</span> Testing...';
                showSyncStatus('Testing connection...', 'info');

                Supabase.checkConnection()
                    .then(function (result) {
                        if (result.connected) {
                            showSyncStatus('✅ Connected! Database has ' + (result.count || 0) + ' companies.', 'success');
                            showNotification('Connection successful!', 'success');
                        } else {
                            showSyncStatus('❌ Connection failed: ' + result.error, 'error');
                            showNotification('Connection failed: ' + result.error, 'error');
                        }
                        testBtn.disabled = false;
                        testBtn.innerHTML = '<span class="btn-icon">🔌</span> Test Connection';
                    })
                    .catch(function (err) {
                        showSyncStatus('❌ Connection failed: ' + err, 'error');
                        testBtn.disabled = false;
                        testBtn.innerHTML = '<span class="btn-icon">🔌</span> Test Connection';
                    });
            });
        }
    }

    function showSyncStatus(message, type) {
        var statusEl = document.getElementById('sync-status');
        if (!statusEl) return;

        var bgColor = type === 'success' ? 'rgba(16, 185, 129, 0.15)' :
            type === 'error' ? 'rgba(239, 68, 68, 0.15)' :
                'rgba(59, 130, 246, 0.15)';
        var textColor = type === 'success' ? '#10b981' :
            type === 'error' ? '#ef4444' : '#3b82f6';

        statusEl.style.display = 'block';
        statusEl.style.background = bgColor;
        statusEl.style.color = textColor;
        statusEl.textContent = message;
    }

    function showAddInput(type) {
        hideAddInputs();
        var input = document.getElementById('add-' + type + '-input');
        if (input) {
            input.style.display = 'flex';
            var textInput = input.querySelector('input[type="text"]');
            if (textInput) textInput.focus();
        }
    }

    function hideAddInputs() {
        var inputs = document.querySelectorAll('.settings-add-input');
        inputs.forEach(function (input) {
            input.style.display = 'none';
        });
    }

    function saveNewItem(type) {
        var inputId = 'new-' + type + '-name-settings';
        var input = document.getElementById(inputId);
        var name = input ? input.value.trim() : '';

        if (!name) {
            showNotification('Please enter a name', 'error');
            return;
        }

        var success = false;
        if (type === 'industry') {
            success = Data.addCustomIndustry(name);
        } else if (type === 'team') {
            success = Data.addCustomTeamMember(name);
        } else if (type === 'hq') {
            success = Data.addCustomHQLocation(name);
        }

        if (success) {
            showNotification(name + ' added successfully!', 'success');
            render(); // Refresh the page
        } else {
            showNotification('Item already exists', 'error');
        }
    }

    function removeItem(type, name) {
        var usageCount = 0;
        if (type === 'industry') {
            usageCount = Data.getIndustryUsageCount(name);
        } else if (type === 'team') {
            usageCount = Data.getTeamMemberUsageCount(name);
        } else if (type === 'hq') {
            usageCount = Data.getHQLocationUsageCount(name);
        }

        var confirmMsg = 'Are you sure you want to remove "' + name + '"?';
        if (usageCount > 0) {
            confirmMsg += '\n\n⚠️ Warning: This item is used by ' + usageCount + ' company/companies. Removing it will hide it from dropdown options.';
        }

        if (confirm(confirmMsg)) {
            if (type === 'industry') {
                Data.removeIndustry(name);
            } else if (type === 'team') {
                Data.removeTeamMember(name);
            } else if (type === 'hq') {
                Data.removeHQLocation(name);
            }
            showNotification(name + ' removed', 'success');
            render(); // Refresh the page
        }
    }

    function exportData() {
        var data = Data.exportAllData();
        var blob = new Blob([data], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'family_office_data_' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Data exported successfully!', 'success');
    }

    function exportToExcel() {
        var companies = Data.getCompanies();

        // CSV headers
        var headers = [
            'Name', 'Industry', 'HQ', 'Deal Sourcer', 'Analyst',
            'Entry Date', 'Entry Stage', 'Current Stage', 'Status',
            'Initial Investment', 'Total Invested', 'Entry Valuation', 'Entry Ownership %',
            'Latest Valuation', 'Current Ownership %', 'Share Type',
            'Exit Date', 'Exit Value', 'Notes',
            'Follow-on Count', 'Follow-on Rounds'
        ];

        // Build CSV rows
        var rows = companies.map(function(c) {
            // Calculate current values
            var currentOwnership = Utils.getCurrentOwnership(c);
            var latestValuation = Utils.getLatestValuation(c);

            // Format follow-on rounds as text
            var followOnText = '';
            if (c.followOns && c.followOns.length > 0) {
                followOnText = c.followOns.map(function(fo) {
                    return fo.date + ' ' + fo.round + ' Val:' + (fo.roundValuation || 0) + ' Own:' + (fo.ownershipAfter || 0) + '%';
                }).join(' | ');
            }

            return [
                escapeCsvField(c.name || ''),
                escapeCsvField(c.industry || ''),
                escapeCsvField(c.hq || ''),
                escapeCsvField(c.dealSourcer || ''),
                escapeCsvField(c.analyst || ''),
                c.entryDate || '',
                escapeCsvField(c.entryStage || ''),
                escapeCsvField(c.currentStage || ''),
                escapeCsvField(c.status || 'Active'),
                c.initialInvestment || 0,
                c.totalInvested || c.initialInvestment || 0,
                c.entryValuation || 0,
                c.entryOwnership || 0,
                latestValuation || 0,
                currentOwnership.toFixed(3),
                c.shareType || 'primary',
                c.exitDate || '',
                c.exitValue || '',
                escapeCsvField(c.notes || ''),
                c.followOns ? c.followOns.length : 0,
                escapeCsvField(followOnText)
            ].join(',');
        });

        // Combine headers and rows
        var csv = headers.join(',') + '\n' + rows.join('\n');

        // Download as CSV (Excel compatible)
        var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio_export_' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Excel export successful! (' + companies.length + ' companies)', 'success');
    }

    function escapeCsvField(value) {
        if (value === null || value === undefined) return '';
        var str = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    function resetData() {
        if (confirm('⚠️ Are you sure you want to reset all data?\n\nThis will:\n• Delete all custom options\n• Remove all your companies\n• Restore the sample companies\n\nThis action cannot be undone!')) {
            if (confirm('Please confirm again: Reset ALL data to defaults?')) {
                Data.resetToDefaults();
                showNotification('Data reset to defaults', 'success');
                render(); // Refresh the page
            }
        }
    }

    function saveApiKey() {
        var input = document.getElementById('gemini-api-key-input');
        var apiKey = input ? input.value.trim() : '';

        if (!apiKey) {
            showNotification('Please enter an API key', 'error');
            return;
        }

        var ChatAssistant = FamilyOffice.ChatAssistant;
        if (ChatAssistant && ChatAssistant.setApiKey) {
            var success = ChatAssistant.setApiKey(apiKey);
            if (success) {
                showNotification('API key saved successfully!', 'success');
                input.value = ''; // Clear the input for security
                render(); // Refresh to update the status
            } else {
                showNotification('Failed to save API key', 'error');
            }
        } else {
            showNotification('Chat Assistant module not available', 'error');
        }
    }

    function showNotification(message, type) {
        // Create a simple notification
        var existing = document.querySelector('.settings-notification');
        if (existing) existing.remove();

        var notification = document.createElement('div');
        notification.className = 'settings-notification ' + (type === 'error' ? 'notification-error' : 'notification-success');
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(function () {
            notification.remove();
        }, 3000);
    }

    return {
        render: render,
        initEvents: initEvents
    };
})();

// User management functions (added outside IIFE for modal event handling)
(function () {
    var Users = FamilyOffice.Users;
    var Settings = FamilyOffice.Settings;

    // Add User Modal
    window.showAddUserModal = function () {
        var modalHtml = '\
            <div id="user-modal" class="modal-overlay">\
                <div class="modal" style="width: 400px;">\
                    <div class="modal-header">\
                        <h2>Add New User</h2>\
                        <button class="modal-close" id="close-user-modal">&times;</button>\
                    </div>\
                    <div class="modal-body">\
                        <div class="form-group">\
                            <label class="form-label">Name *</label>\
                            <input type="text" class="form-input" id="user-name-input" placeholder="Enter user name" required>\
                        </div>\
                        <div class="form-group">\
                            <label class="form-label">Role</label>\
                            <select class="form-select" id="user-role-input">\
                                <option value="Admin">Admin</option>\
                                <option value="Partner">Partner</option>\
                                <option value="Analyst" selected>Analyst</option>\
                                <option value="Viewer">Viewer</option>\
                            </select>\
                        </div>\
                    </div>\
                    <div class="modal-footer">\
                        <button class="btn btn-secondary" id="cancel-user-modal">Cancel</button>\
                        <button class="btn btn-primary" id="save-user-btn">Add User</button>\
                    </div>\
                </div>\
            </div>';
        var modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = modalHtml;
        document.getElementById('user-name-input').focus();
    };

    // Edit User Modal
    window.showEditUserModal = function (userId, userName, userRole) {
        var modalHtml = '\
            <div id="user-modal" class="modal-overlay">\
                <div class="modal" style="width: 400px;">\
                    <div class="modal-header">\
                        <h2>Edit User</h2>\
                        <button class="modal-close" id="close-user-modal">&times;</button>\
                    </div>\
                    <div class="modal-body">\
                        <div class="form-group">\
                            <label class="form-label">Name *</label>\
                            <input type="text" class="form-input" id="user-name-input" value="' + userName + '" required>\
                        </div>\
                        <div class="form-group">\
                            <label class="form-label">Role</label>\
                            <select class="form-select" id="user-role-input">\
                                <option value="Admin" ' + (userRole === 'Admin' ? 'selected' : '') + '>Admin</option>\
                                <option value="Partner" ' + (userRole === 'Partner' ? 'selected' : '') + '>Partner</option>\
                                <option value="Analyst" ' + (userRole === 'Analyst' ? 'selected' : '') + '>Analyst</option>\
                                <option value="Viewer" ' + (userRole === 'Viewer' ? 'selected' : '') + '>Viewer</option>\
                            </select>\
                        </div>\
                    </div>\
                    <div class="modal-footer">\
                        <button class="btn btn-secondary" id="cancel-user-modal">Cancel</button>\
                        <button class="btn btn-primary" id="update-user-btn" data-user-id="' + userId + '">Save Changes</button>\
                    </div>\
                </div>\
            </div>';
        var modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = modalHtml;
        document.getElementById('user-name-input').focus();
    };

    // Delete User
    window.deleteUser = function (userId, userName) {
        if (confirm('Are you sure you want to delete "' + userName + '"?\n\nThis will remove the user and their preferences.')) {
            Users.deleteUser(userId);
            Settings.render();
        }
    };

    // Modal event handlers
    document.addEventListener('click', function (e) {
        // Close modal
        if (e.target.id === 'close-user-modal' || e.target.id === 'cancel-user-modal' || e.target.id === 'user-modal') {
            var modal = document.getElementById('user-modal');
            if (modal) modal.remove();
        }

        // Save new user
        if (e.target.id === 'save-user-btn') {
            var name = document.getElementById('user-name-input').value.trim();
            var role = document.getElementById('user-role-input').value;
            if (!name) {
                alert('Please enter a name');
                return;
            }
            Users.addUser(name, role);
            document.getElementById('user-modal').remove();
            Settings.render();
        }

        // Update existing user
        if (e.target.id === 'update-user-btn') {
            var userId = e.target.dataset.userId;
            var name = document.getElementById('user-name-input').value.trim();
            var role = document.getElementById('user-role-input').value;
            if (!name) {
                alert('Please enter a name');
                return;
            }
            Users.updateUser(userId, { name: name, role: role });
            document.getElementById('user-modal').remove();
            Settings.render();
        }
    });
})();
