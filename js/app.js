// ============================================
// MAIN APPLICATION - Global scope (no ES modules)
// ============================================

var FamilyOffice = FamilyOffice || {};

(function () {
    var Data = FamilyOffice.Data;
    var Components = FamilyOffice.Components;
    var Dashboard = FamilyOffice.Dashboard;
    var Portfolio = FamilyOffice.Portfolio;
    var Analytics = FamilyOffice.Analytics;
    var Settings = FamilyOffice.Settings;
    var Founders = FamilyOffice.Founders;
    var Funds = FamilyOffice.Funds;
    var Legal = FamilyOffice.Legal;
    var Utils = FamilyOffice.Utils;

    var currentPage = 'dashboard';

    // Password protection configuration
    // IMPORTANT: Change this password and keep it secret
    var APP_PASSWORD_HASH = 'dv2024secure'; // Simple password - change this!
    var AUTH_KEY = 'dv_authenticated';

    function init() {
        // Check if already authenticated
        if (isAuthenticated()) {
            initApp();
        } else {
            showPasswordGate();
        }
    }

    function isAuthenticated() {
        var storedAuth = localStorage.getItem(AUTH_KEY);
        return storedAuth === APP_PASSWORD_HASH;
    }

    function showPasswordGate() {
        var appContainer = document.getElementById('app-container');
        appContainer.style.display = 'none';

        // Create password gate overlay
        var gate = document.createElement('div');
        gate.id = 'password-gate';
        gate.innerHTML = '\
            <div class="password-gate-overlay">\
                <div class="password-gate-box">\
                    <div class="password-gate-logo">DV</div>\
                    <h2 class="password-gate-title">Dholakia Ventures</h2>\
                    <p class="password-gate-subtitle">Enter password to access the dashboard</p>\
                    <form id="password-form">\
                        <input type="password" id="password-input" class="password-gate-input" placeholder="Enter password" autocomplete="current-password" autofocus>\
                        <div id="password-error" class="password-gate-error"></div>\
                        <button type="submit" class="password-gate-btn">Access Dashboard</button>\
                    </form>\
                </div>\
            </div>';
        document.body.appendChild(gate);

        // Add password gate styles
        var style = document.createElement('style');
        style.textContent = '\
            .password-gate-overlay {\
                position: fixed;\
                top: 0;\
                left: 0;\
                right: 0;\
                bottom: 0;\
                background: linear-gradient(135deg, #050508 0%, #0a0a0f 50%, #050508 100%);\
                display: flex;\
                align-items: center;\
                justify-content: center;\
                z-index: 10000;\
            }\
            .password-gate-box {\
                background: rgba(255, 255, 255, 0.03);\
                border: 1px solid rgba(255, 255, 255, 0.1);\
                border-radius: 16px;\
                padding: 48px;\
                text-align: center;\
                max-width: 400px;\
                width: 90%;\
            }\
            .password-gate-logo {\
                width: 64px;\
                height: 64px;\
                background: linear-gradient(135deg, #6366f1, #8b5cf6);\
                border-radius: 16px;\
                display: flex;\
                align-items: center;\
                justify-content: center;\
                font-size: 24px;\
                font-weight: 700;\
                color: white;\
                margin: 0 auto 24px;\
            }\
            .password-gate-title {\
                font-size: 24px;\
                font-weight: 600;\
                color: #f8fafc;\
                margin: 0 0 8px;\
            }\
            .password-gate-subtitle {\
                font-size: 14px;\
                color: #71717a;\
                margin: 0 0 32px;\
            }\
            .password-gate-input {\
                width: 100%;\
                padding: 14px 16px;\
                background: rgba(255, 255, 255, 0.05);\
                border: 1px solid rgba(255, 255, 255, 0.1);\
                border-radius: 8px;\
                color: #f8fafc;\
                font-size: 16px;\
                outline: none;\
                transition: border-color 0.2s;\
                box-sizing: border-box;\
            }\
            .password-gate-input:focus {\
                border-color: #6366f1;\
            }\
            .password-gate-input::placeholder {\
                color: #52525b;\
            }\
            .password-gate-error {\
                color: #ef4444;\
                font-size: 13px;\
                margin-top: 8px;\
                min-height: 20px;\
            }\
            .password-gate-btn {\
                width: 100%;\
                padding: 14px 24px;\
                background: linear-gradient(135deg, #6366f1, #8b5cf6);\
                border: none;\
                border-radius: 8px;\
                color: white;\
                font-size: 15px;\
                font-weight: 600;\
                cursor: pointer;\
                margin-top: 16px;\
                transition: opacity 0.2s;\
            }\
            .password-gate-btn:hover {\
                opacity: 0.9;\
            }\
        ';
        document.head.appendChild(style);

        // Handle form submission
        document.getElementById('password-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var passwordInput = document.getElementById('password-input');
            var errorDiv = document.getElementById('password-error');
            var password = passwordInput.value;

            if (password === APP_PASSWORD_HASH) {
                // Store authentication
                localStorage.setItem(AUTH_KEY, APP_PASSWORD_HASH);
                // Remove gate and show app
                gate.remove();
                appContainer.style.display = '';
                initApp();
            } else {
                errorDiv.textContent = 'Incorrect password. Please try again.';
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }

    // Function to logout (can be called from settings)
    function logout() {
        localStorage.removeItem(AUTH_KEY);
        window.location.reload();
    }

    function initApp() {
        // Check for hash
        if (window.location.hash) {
            currentPage = window.location.hash.slice(1) || 'dashboard';
        }

        // Show loading overlay while fetching from cloud
        showLoadingOverlay('Connecting to cloud...');

        // Cloud-first: Load from Supabase, then cache in localStorage
        var Supabase = FamilyOffice.Supabase;
        if (Supabase && Supabase.pullFromCloud) {
            Supabase.pullFromCloud()
                .then(function (result) {
                    hideLoadingOverlay();
                    console.log('☁️ Loaded from cloud:', result.companies, 'companies,', result.founders, 'founders,', result.funds, 'funds');

                    // Render the page with cloud data
                    renderPage(currentPage);
                    setupNavigation();
                    setupCurrencyToggle();

                    // Subscribe to realtime updates
                    if (Supabase.subscribeToRealtime) {
                        Supabase.subscribeToRealtime();
                        Supabase.onRealtimeChange(function (table, payload) {
                            console.log('⚡ Realtime update:', table);
                            renderPage(currentPage);
                        });
                    }
                })
                .catch(function (err) {
                    hideLoadingOverlay();
                    console.warn('☁️ Cloud unavailable, using cached data:', err);
                    showNotification('Using cached data - cloud unavailable', 'warning');

                    // Fall back to localStorage
                    Data.initializeData();
                    renderPage(currentPage);
                    setupNavigation();
                    setupCurrencyToggle();
                });
        } else {
            // Supabase not available, use localStorage
            hideLoadingOverlay();
            Data.initializeData();
            renderPage(currentPage);
            setupNavigation();
            setupCurrencyToggle();
        }

        // Handle browser back/forward
        window.addEventListener('popstate', function () {
            var hash = window.location.hash.slice(1) || 'dashboard';
            if (hash !== currentPage) {
                currentPage = hash;
                renderPage(currentPage);
            }
        });
    }

    function showLoadingOverlay(message) {
        var overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(5,5,8,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;';
            overlay.innerHTML = '<div style="text-align:center;color:#f8fafc;"><div style="font-size:24px;margin-bottom:16px;">⟳</div><div>' + (message || 'Loading...') + '</div></div>';
            document.body.appendChild(overlay);
        }
    }

    function hideLoadingOverlay() {
        var overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    function showNotification(message, type) {
        var notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;z-index:9999;color:#fff;font-size:14px;max-width:300px;' +
            (type === 'warning' ? 'background:#d97706;' : type === 'error' ? 'background:#dc2626;' : 'background:#059669;');
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(function () { notification.remove(); }, 4000);
    }

    // Refresh current page (used when currency changes)
    function refresh() {
        renderPage(currentPage);
    }

    function renderPage(page) {
        var sidebar = document.getElementById('sidebar');
        var header = document.getElementById('header');
        var pageContent = document.getElementById('page-content');

        // Update sidebar
        sidebar.innerHTML = Components.renderSidebar(page);

        // Update header and content
        switch (page) {
            case 'dashboard':
                header.innerHTML = Components.renderHeader('Dashboard Overview');
                pageContent.innerHTML = Dashboard.render();
                Dashboard.initEvents();
                break;
            case 'portfolio':
                header.innerHTML = Components.renderHeader('Portfolio Companies', true);
                Portfolio.resetFilters();
                pageContent.innerHTML = Portfolio.render();
                Portfolio.initEvents();
                break;
            case 'analytics':
                header.innerHTML = Components.renderHeader('Analytics & Insights');
                Analytics.resetFilters();
                pageContent.innerHTML = Analytics.render();
                Analytics.initEvents();
                break;
            case 'settings':
                header.innerHTML = Components.renderHeader('Settings');
                pageContent.innerHTML = Settings.render();
                Settings.initEvents();
                break;
            case 'founders':
                header.innerHTML = Components.renderHeader('Founders Database');
                pageContent.innerHTML = Founders.render();
                Founders.initEvents();
                break;
            case 'funds':
                header.innerHTML = Components.renderHeader('Fund Investments');
                pageContent.innerHTML = Funds.render();
                Funds.initEvents();
                break;
            case 'legal':
                header.innerHTML = Components.renderHeader('Legal & Rights');
                pageContent.innerHTML = Legal.render();
                Legal.initEvents();
                break;
            default:
                header.innerHTML = Components.renderHeader('Dashboard Overview');
                pageContent.innerHTML = Dashboard.render();
                Dashboard.initEvents();
        }

        // Re-setup navigation and currency toggle
        setupNavigation();
        setupCurrencyToggle();
    }

    function setupNavigation() {
        // Use event delegation - set up once on document
        // This prevents duplicate listeners when pages re-render
        if (window._navSetup) return; // Only setup once
        window._navSetup = true;

        document.addEventListener('click', function (e) {
            var navItem = e.target.closest('[data-page]');
            if (navItem) {
                e.preventDefault();
                var page = navItem.dataset.page;

                // Always render the page, even if it's the same page (to refresh/reset)
                currentPage = page;
                window.location.hash = page;
                renderPage(page);
            }
        });
    }

    function setupCurrencyToggle() {
        // Use event delegation - set up once
        if (window._currencySetup) return;
        window._currencySetup = true;

        document.addEventListener('click', function (e) {
            if (e.target.id === 'currency-inr' || e.target.closest('#currency-inr')) {
                Utils.setCurrency('INR');
                refresh();
            }
            if (e.target.id === 'currency-usd' || e.target.closest('#currency-usd')) {
                Utils.setCurrency('USD');
                refresh();
            }
        });
    }

    // Expose functions for external use
    FamilyOffice.App = {
        refresh: refresh,
        logout: logout
    };

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
