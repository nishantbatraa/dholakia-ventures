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

    function init() {
        // Initialize app directly without auth
        initApp();
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

        // Global search
        document.addEventListener('input', function (e) {
            if (e.target.id === 'global-search') {
                clearTimeout(window._searchTimeout);
                window._searchTimeout = setTimeout(function () {
                    if (e.target.value.length > 0 && currentPage !== 'portfolio') {
                        currentPage = 'portfolio';
                        window.location.hash = 'portfolio';
                        renderPage('portfolio');

                        setTimeout(function () {
                            var filterSearch = document.getElementById('filter-search');
                            if (filterSearch) {
                                filterSearch.value = e.target.value;
                                filterSearch.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }, 100);
                    }
                }, 300);
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

    // Expose refresh function for currency changes
    FamilyOffice.App = {
        refresh: refresh
    };

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
