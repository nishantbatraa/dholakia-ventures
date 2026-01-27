// ============================================
// DASHBOARD VIEW - Global scope (no ES modules)
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Dashboard = (function () {
  var Utils = FamilyOffice.Utils;
  var Data = FamilyOffice.Data;
  var Components = FamilyOffice.Components;
  var Users = FamilyOffice.Users;

  function getWidgetPreferences() {
    var defaults = {
      summaryCards: true,
      recentInvestments: true,
      topPerformers: true,
      industryDistribution: true,
      quickStats: true
    };

    // Get Users from FamilyOffice at call time (not module load time)
    var UsersModule = FamilyOffice.Users;

    if (UsersModule && UsersModule.getUserPreferences) {
      var prefs = UsersModule.getUserPreferences();
      var savedWidgets = prefs.dashboardWidgets || {};

      // Merge defaults with saved - only use saved value if explicitly set
      return {
        summaryCards: savedWidgets.summaryCards !== undefined ? savedWidgets.summaryCards : defaults.summaryCards,
        recentInvestments: savedWidgets.recentInvestments !== undefined ? savedWidgets.recentInvestments : defaults.recentInvestments,
        topPerformers: savedWidgets.topPerformers !== undefined ? savedWidgets.topPerformers : defaults.topPerformers,
        industryDistribution: savedWidgets.industryDistribution !== undefined ? savedWidgets.industryDistribution : defaults.industryDistribution,
        quickStats: savedWidgets.quickStats !== undefined ? savedWidgets.quickStats : defaults.quickStats
      };
    }
    return defaults;
  }

  function renderCustomizeButton() {
    return '\
      <button id="customize-dashboard-btn" class="btn btn-secondary btn-sm" style="position: fixed; bottom: 20px; right: 20px; z-index: 100; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">\
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>\
        Customize\
      </button>';
  }

  function renderCustomizeModal() {
    var widgets = getWidgetPreferences();

    function renderToggle(id, label, enabled) {
      return '\
        <div class="widget-toggle-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--color-bg-tertiary); border-radius: 8px; margin-bottom: 8px;">\
          <span style="font-weight: 500;">' + label + '</span>\
          <label class="toggle-switch" style="position: relative; display: inline-block; width: 48px; height: 26px;">\
            <input type="checkbox" class="widget-toggle" data-widget="' + id + '" ' + (enabled ? 'checked' : '') + ' style="opacity: 0; width: 0; height: 0;">\
            <span class="toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ' + (enabled ? 'var(--color-accent-primary)' : '#444') + '; transition: .3s; border-radius: 26px;"></span>\
            <span class="toggle-knob" style="position: absolute; height: 20px; width: 20px; left: ' + (enabled ? '24px' : '3px') + '; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%;"></span>\
          </label>\
        </div>';
    }

    return '\
      <div id="customize-modal" class="modal-overlay">\
        <div class="modal" style="width: 420px; max-width: 90vw;">\
          <div class="modal-header">\
            <h2>Customize Dashboard</h2>\
            <button id="close-customize-modal" class="modal-close">\
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>\
            </button>\
          </div>\
          <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">\
            <p class="text-muted mb-4">Choose which widgets to display on your dashboard.</p>\
            ' + renderToggle('summaryCards', '📊 Summary Cards (AUM, Companies, etc.)', widgets.summaryCards) + '\
            ' + renderToggle('recentInvestments', '🕐 Recent Investments', widgets.recentInvestments) + '\
            ' + renderToggle('topPerformers', '🚀 Top Performers', widgets.topPerformers) + '\
            ' + renderToggle('industryDistribution', '🏭 Industry Distribution', widgets.industryDistribution) + '\
            ' + renderToggle('quickStats', '📈 Quick Stats Footer', widgets.quickStats) + '\
          </div>\
          <div class="modal-footer">\
            <button id="save-widget-prefs" class="btn btn-primary">Save Preferences</button>\
          </div>\
        </div>\
      </div>';
  }

  function render() {
    var metrics = Data.getPortfolioMetrics();
    var companies = Data.getCompanies();
    var widgets = getWidgetPreferences();

    // Recent investments - sorted by latest investment date/time
    var recentInvestments = companies
      .filter(function (c) { return c.status === 'Active'; })
      .sort(function (a, b) {
        // Primary sort: lastInvestmentDate (most recent first)
        var dateA = a.lastInvestmentDate || a.entryDate || '';
        var dateB = b.lastInvestmentDate || b.entryDate || '';
        var dateDiff = new Date(dateB) - new Date(dateA);
        if (dateDiff !== 0) return dateDiff;
        // Secondary sort: createdAt timestamp for same-date entries
        var createdA = a.createdAt || '';
        var createdB = b.createdAt || '';
        return new Date(createdB) - new Date(createdA);
      })
      .slice(0, 5);

    // Top performers - sorted by valuation growth
    var topPerformers = companies
      .filter(function (c) { return c.status === 'Active' && c.totalInvested > 0; })
      .map(function (c) {
        var unrealizedValue = c.latestValuation * (c.ownership / 100);
        var growthPct = ((unrealizedValue - c.totalInvested) / c.totalInvested) * 100;
        return {
          name: c.name,
          industry: c.industry,
          unrealizedValue: unrealizedValue,
          moic: unrealizedValue / c.totalInvested,
          growthPct: growthPct
        };
      })
      .sort(function (a, b) { return b.growthPct - a.growthPct; })
      .slice(0, 5);

    // Investment by industry
    var byIndustry = Data.getCompaniesByIndustry();
    var industryData = Object.keys(byIndustry)
      .map(function (industry) {
        var comps = byIndustry[industry];
        return {
          industry: industry,
          count: comps.length,
          invested: comps.reduce(function (sum, c) { return sum + c.totalInvested; }, 0)
        };
      })
      .sort(function (a, b) { return b.invested - a.invested; })
      .slice(0, 6);

    // Build recent investments HTML
    var recentHtml = recentInvestments.map(function (company) {
      var avatarColor = Utils.getAvatarColor(company.name);
      // Show lastInvestmentDate (most recent activity), fallback to entryDate
      var investmentDate = new Date(company.lastInvestmentDate || company.entryDate);
      var monthYear = investmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      // Show current stage (not entry stage) and total invested (not just initial)
      return '\
        <div class="flex items-center justify-between" style="padding: 12px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg);">\
          <div class="flex items-center gap-3">\
            <div class="company-avatar" style="background: ' + avatarColor.bg + '; color: ' + avatarColor.text + '; width: 36px; height: 36px; font-size: 12px;">\
              ' + Utils.getInitials(company.name) + '\
            </div>\
            <div>\
              <div style="font-weight: 500; font-size: 14px;">' + company.name + '</div>\
              <div class="text-xs text-muted">' + company.industry + ' • ' + monthYear + '</div>\
            </div>\
          </div>\
          <div class="text-right">\
            <span class="badge ' + Utils.getStageBadgeClass(company.currentStage) + '" style="margin-bottom: 4px;">' + company.currentStage + '</span>\
            <div style="font-weight: 600; color: var(--color-accent-tertiary); font-size: 12px;">' + Utils.formatCurrency(company.totalInvested) + '</div>\
          </div>\
        </div>';
    }).join('');

    // Build top performers HTML
    var performersHtml = topPerformers.map(function (company, index) {
      var avatarColor = Utils.getAvatarColor(company.name);
      return '\
        <div class="flex items-center justify-between" style="padding: 12px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg);">\
          <div class="flex items-center gap-3">\
            <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; color: var(--color-text-tertiary);">\
              #' + (index + 1) + '\
            </div>\
            <div class="company-avatar" style="background: ' + avatarColor.bg + '; color: ' + avatarColor.text + '; width: 36px; height: 36px; font-size: 12px;">\
              ' + Utils.getInitials(company.name) + '\
            </div>\
            <div>\
              <div style="font-weight: 500; font-size: 14px;">' + company.name + '</div>\
              <div class="text-xs text-muted">' + company.industry + '</div>\
            </div>\
          </div>\
          <div class="text-right">\
            <div style="font-weight: 600; color: var(--color-success);">+' + company.growthPct.toFixed(2) + '%</div>\
            <div class="text-xs text-muted">' + Utils.formatMOIC(company.moic) + ' MOIC</div>\
          </div>\
        </div>';
    }).join('');

    // Build industry HTML
    var colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];
    var industryHtml = industryData.map(function (item, index) {
      var color = colors[index % colors.length];
      return '\
        <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg); border-left: 3px solid ' + color + ';">\
          <div class="flex justify-between items-center mb-2">\
            <span style="font-weight: 500;">' + item.industry + '</span>\
            <span class="text-xs text-muted">' + item.count + ' companies</span>\
          </div>\
          <div style="font-size: 1.25rem; font-weight: 600; color: ' + color + ';">\
            ' + Utils.formatCurrency(item.invested) + '\
          </div>\
        </div>';
    }).join('');

    // Get founder count
    var founderCount = Data.getFounders ? Data.getFounders().length : 0;

    // Calculate Portfolio XIRR
    var cashFlows = Utils.getPortfolioCashFlows(companies);
    var portfolioXIRR = Utils.calculateXIRR(cashFlows);

    // Build dashboard with conditional widgets
    var summaryCardsHtml = widgets.summaryCards ? '\
        <!-- Stats Grid -->\
        <div class="grid" style="grid-template-columns: repeat(5, 1fr); gap: 1.5rem; margin-bottom: 2rem;">\
          ' + Components.renderStatCard({
      icon: '💰',
      iconClass: 'purple',
      label: 'Total AUM',
      value: Utils.formatCurrency(metrics.totalAUM)
    }) + '\
          ' + Components.renderStatCard({
      icon: '🏢',
      iconClass: 'blue',
      label: 'Active Companies',
      value: metrics.activeCompanies.toString()
    }) + '\
          ' + Components.renderStatCard({
      icon: '📊',
      iconClass: 'cyan',
      label: 'Portfolio XIRR',
      value: Utils.formatXIRR(portfolioXIRR),
      change: portfolioXIRR !== null ? 'annualized' : 'insufficient data'
    }) + '\
          ' + Components.renderStatCard({
      icon: '🚀',
      iconClass: 'green',
      label: 'Successful Exits',
      value: metrics.exitedCompanies.toString(),
      change: Utils.formatCurrency(metrics.totalExitValue) + ' returned'
    }) + '\
          ' + Components.renderStatCard({
      icon: '📈',
      iconClass: 'orange',
      label: 'Portfolio Value',
      value: Utils.formatCurrency(metrics.portfolioValue),
      change: Utils.formatMOIC(metrics.unrealizedMOIC) + ' MOIC',
      changeType: 'positive'
    }) + '\
        </div>' : '';

    // Fund Investments Summary
    var fundMetrics = Data.getFundMetrics ? Data.getFundMetrics() : { totalCommitment: 0, calledCapital: 0 };
    var funds = Data.getFunds ? Data.getFunds() : [];
    var fundCashFlows = [];
    var today = new Date().toISOString().split('T')[0];
    funds.forEach(function (f) {
      (f.capitalCalls || []).forEach(function (cc) { fundCashFlows.push({ date: cc.date, amount: -cc.amount }); });
      (f.distributions || []).forEach(function (d) { fundCashFlows.push({ date: d.date, amount: d.amount }); });
      var nav = Data.getFundLatestNav ? Data.getFundLatestNav(f) : 0;
      if (nav > 0) fundCashFlows.push({ date: today, amount: nav });
    });
    var fundsXIRR = Utils.calculateXIRR(fundCashFlows);

    var fundSummaryHtml = funds.length > 0 ? '\
      <!-- Fund Investments Summary -->\
      <div class="card" style="padding: 16px; margin-bottom: 24px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);">\
        <div style="display: flex; justify-content: space-between; align-items: center;">\
          <div style="display: flex; align-items: center; gap: 12px;">\
            <span style="font-size: 24px;">💼</span>\
            <div>\
              <div style="font-weight: 600; font-size: 14px;">Fund Investments</div>\
              <div class="text-xs text-muted">' + funds.length + ' funds</div>\
            </div>\
          </div>\
          <div style="display: flex; gap: 32px; align-items: center;">\
            <div style="text-align: center;">\
              <div class="text-xs text-muted">Committed</div>\
              <div style="font-weight: 700;">' + Utils.formatCurrency(fundMetrics.totalCommitment) + '</div>\
            </div>\
            <div style="text-align: center;">\
              <div class="text-xs text-muted">Called</div>\
              <div style="font-weight: 700;">' + Utils.formatCurrency(fundMetrics.calledCapital) + '</div>\
            </div>\
            <div style="text-align: center;">\
              <div class="text-xs text-muted">XIRR</div>\
              <div style="font-weight: 700; color: var(--color-accent-secondary);">' + Utils.formatXIRR(fundsXIRR) + '</div>\
            </div>\
            <a href="#funds" class="btn btn-sm btn-secondary" data-page="funds">View Funds →</a>\
          </div>\
        </div>\
      </div>' : '';

    var recentInvestmentsWidget = widgets.recentInvestments ? '\
          <div class="card">\
            <div class="card-header">\
              <h3 class="card-title">Recent Investments</h3>\
              <a href="#portfolio" class="btn btn-ghost btn-sm" data-page="portfolio">View All</a>\
            </div>\
            <div class="flex flex-col gap-3">' + recentHtml + '</div>\
          </div>' : '';

    var topPerformersWidget = widgets.topPerformers ? '\
          <div class="card">\
            <div class="card-header">\
              <h3 class="card-title">Top Performers</h3>\
              <span class="text-sm text-muted">By Valuation Growth</span>\
            </div>\
            <div class="flex flex-col gap-3">' + performersHtml + '</div>\
          </div>' : '';

    var twoColumnLayout = (widgets.recentInvestments || widgets.topPerformers) ? '\
        <!-- Two Column Layout -->\
        <div class="grid grid-cols-2 gap-6">\
          ' + recentInvestmentsWidget + '\
          ' + topPerformersWidget + '\
        </div>' : '';

    var industryWidget = widgets.industryDistribution ? '\
        <!-- Investment by Industry -->\
        <div class="card mt-6">\
          <div class="card-header">\
            <h3 class="card-title">Investment by Industry</h3>\
          </div>\
          <div class="grid grid-cols-3 gap-4">' + industryHtml + '</div>\
        </div>' : '';

    var quickStatsWidget = widgets.quickStats ? '\
        <!-- Quick Stats Footer -->\
        <div class="grid grid-cols-4 gap-4 mt-6">\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-3xl mb-2">📊</div>\
            <div style="font-size: 1.5rem; font-weight: 700;">' + metrics.totalCompanies + '</div>\
            <div class="text-sm text-muted">Total Companies</div>\
          </div>\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-3xl mb-2">💵</div>\
            <div style="font-size: 1.5rem; font-weight: 700;">' + Utils.formatCurrency(metrics.totalInvested) + '</div>\
            <div class="text-sm text-muted">Total Invested</div>\
          </div>\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-3xl mb-2">📉</div>\
            <div style="font-size: 1.5rem; font-weight: 700;">' + metrics.writtenOff + '</div>\
            <div class="text-sm text-muted">Written Off</div>\
          </div>\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-3xl mb-2">🎯</div>\
            <div style="font-size: 1.5rem; font-weight: 700;">' + Utils.formatMOIC(metrics.realizedMOIC) + '</div>\
            <div class="text-sm text-muted">Realized MOIC</div>\
          </div>\
        </div>' : '';

    return '\
      <div class="animate-fadeIn">\
        ' + summaryCardsHtml + '\
        ' + fundSummaryHtml + '\
        ' + twoColumnLayout + '\
        ' + industryWidget + '\
        ' + quickStatsWidget + '\
        ' + renderCustomizeButton() + '\
      </div>';
  }

  function initEvents() {
    // Customize button
    document.addEventListener('click', function (e) {
      if (e.target.closest('#customize-dashboard-btn')) {
        var modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
          modalContainer.innerHTML = renderCustomizeModal();
        }
      }
    });

    // Close customize modal
    document.addEventListener('click', function (e) {
      var modal = document.getElementById('customize-modal');
      if (!modal) return;

      // Close on X button click
      if (e.target.closest('#close-customize-modal')) {
        modal.remove();
        return;
      }

      // Close when clicking on the overlay background (not the modal content)
      if (e.target.id === 'customize-modal') {
        modal.remove();
      }
    });

    // Toggle switch visual update
    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('widget-toggle')) {
        var label = e.target.closest('.toggle-switch');
        if (label) {
          var slider = label.querySelector('.toggle-slider');
          var knob = label.querySelector('.toggle-knob');
          if (e.target.checked) {
            slider.style.backgroundColor = 'var(--color-accent-primary)';
            knob.style.left = '24px';
          } else {
            slider.style.backgroundColor = '#444';
            knob.style.left = '3px';
          }
        }
      }
    });

    // Save widget preferences
    document.addEventListener('click', function (e) {
      if (e.target.closest('#save-widget-prefs')) {
        var toggles = document.querySelectorAll('.widget-toggle');
        var newPrefs = {};
        toggles.forEach(function (toggle) {
          newPrefs[toggle.dataset.widget] = toggle.checked;
        });

        // Use FamilyOffice.Users at call time to ensure it's defined
        var UsersModule = FamilyOffice.Users;
        if (UsersModule && UsersModule.setUserPreferences) {
          var currentPrefs = UsersModule.getUserPreferences();
          currentPrefs.dashboardWidgets = newPrefs;
          UsersModule.setUserPreferences(currentPrefs);
        }

        // Close modal and refresh
        var modal = document.getElementById('customize-modal');
        if (modal) modal.remove();

        var pageContent = document.getElementById('page-content');
        if (pageContent) {
          pageContent.innerHTML = render();
        }
      }
    });
  }

  return {
    render: render,
    initEvents: initEvents
  };
})();

