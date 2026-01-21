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
    var Auth = FamilyOffice.Auth;

    var currentPage = 'dashboard';

    function init() {
        // Check authentication first
        Auth.init().then(function (session) {
            if (!session || !session.user) {
                // Not authenticated - show login page
                showLoginPage();
                return;
            }

            // User is authenticated - proceed with app
            initApp();
        }).catch(function (err) {
            console.error('Auth init error:', err);
            // If auth fails, show login page
            showLoginPage();
        });

        // Listen for auth state changes
        Auth.onAuthStateChange(function (event, session) {
            if (event === 'SIGNED_OUT') {
                showLoginPage();
            } else if (event === 'SIGNED_IN' && session) {
                window.location.reload();
            }
        });
    }

    function showLoginPage() {
        var appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.innerHTML = Auth.renderLoginPage();
        }
    }

    function initApp() {
        // Initialize data (loads from localStorage first for fast startup)
        Data.initializeData();

        // Check for hash
        if (window.location.hash) {
            currentPage = window.location.hash.slice(1) || 'dashboard';
        }

        // Render initial page (with local data)
        renderPage(currentPage);

        // Setup navigation
        setupNavigation();

        // Setup currency toggle
        setupCurrencyToggle();

        // Initialize from cloud if sync is enabled (will refresh UI when done)
        // This happens async so the page loads fast with local data first
        Data.initializeFromCloud(function (result) {
            if (result.success && result.source === 'cloud') {
                console.log('☁️ Cloud sync complete - data refreshed');
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', function () {
            var hash = window.location.hash.slice(1) || 'dashboard';
            if (hash !== currentPage) {
                currentPage = hash;
                renderPage(currentPage);
            }
        });
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
            // Logout button
            if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
                e.preventDefault();
                Auth.signOut().then(function () {
                    showLoginPage();
                }).catch(function (err) {
                    console.error('Logout error:', err);
                    alert('Failed to logout: ' + err.message);
                });
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
