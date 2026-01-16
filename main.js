// ============================================
// MAIN APPLICATION ENTRY POINT
// ============================================

import { initializeData } from './js/data.js';
import { renderSidebar, renderHeader } from './js/components.js';
import { renderDashboard } from './js/dashboard.js';
import { renderPortfolio, initPortfolioEvents, resetFilters } from './js/portfolio.js';
import { renderAnalytics } from './js/analytics.js';
import { debounce } from './js/utils.js';

// Current page state
let currentPage = 'dashboard';

// Initialize application
function init() {
    // Initialize data (load sample data if empty)
    initializeData();

    // Render initial page
    renderPage(currentPage);

    // Setup navigation
    setupNavigation();

    // Setup global search
    setupGlobalSearch();

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.slice(1) || 'dashboard';
        if (hash !== currentPage) {
            currentPage = hash;
            renderPage(currentPage);
        }
    });
}

// Render page based on current route
function renderPage(page) {
    const sidebar = document.getElementById('sidebar');
    const header = document.getElementById('header');
    const pageContent = document.getElementById('page-content');

    // Update sidebar
    sidebar.innerHTML = renderSidebar(page);

    // Update header and content based on page
    switch (page) {
        case 'dashboard':
            header.innerHTML = renderHeader('Dashboard Overview');
            pageContent.innerHTML = renderDashboard();
            break;
        case 'portfolio':
            header.innerHTML = renderHeader('Portfolio Companies', true);
            resetFilters();
            pageContent.innerHTML = renderPortfolio();
            initPortfolioEvents();
            break;
        case 'analytics':
            header.innerHTML = renderHeader('Analytics & Insights');
            pageContent.innerHTML = renderAnalytics();
            break;
        default:
            header.innerHTML = renderHeader('Dashboard Overview');
            pageContent.innerHTML = renderDashboard();
    }

    // Re-setup navigation after render
    setupNavigation();
}

// Setup navigation click handlers
function setupNavigation() {
    const navItems = document.querySelectorAll('[data-page]');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;

            if (page !== currentPage) {
                currentPage = page;
                window.location.hash = page;
                renderPage(page);
            }
        });
    });
}

// Setup global search
function setupGlobalSearch() {
    document.addEventListener('input', (e) => {
        if (e.target.id === 'global-search') {
            handleGlobalSearch(e.target.value);
        }
    });
}

const handleGlobalSearch = debounce((query) => {
    if (query.length > 0 && currentPage !== 'portfolio') {
        // Navigate to portfolio page with search
        currentPage = 'portfolio';
        window.location.hash = 'portfolio';
        renderPage('portfolio');

        // Set search value in filter
        setTimeout(() => {
            const filterSearch = document.getElementById('filter-search');
            if (filterSearch) {
                filterSearch.value = query;
                filterSearch.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, 100);
    }
}, 300);

// Start the application
document.addEventListener('DOMContentLoaded', init);

// Handle initial hash
if (window.location.hash) {
    currentPage = window.location.hash.slice(1);
}
