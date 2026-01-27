// ============================================
// ANALYTICS VIEW - Global scope (no ES modules)
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Analytics = (function () {
  var Utils = FamilyOffice.Utils;
  var Data = FamilyOffice.Data;

  // Filter state
  var filters = {
    stage: 'all',
    industry: 'all',
    hq: 'all',
    year: 'all',
    status: 'all',
    amountMin: '',
    amountMax: ''
  };

  // Load saved filter preferences from user profile
  function loadSavedFilters() {
    var Users = FamilyOffice.Users;
    if (!Users) return;

    var prefs = Users.getUserPreferences();
    if (prefs && prefs.analyticsFilters) {
      var saved = prefs.analyticsFilters;
      filters.stage = saved.stage || 'all';
      filters.industry = saved.industry || 'all';
      filters.hq = saved.hq || 'all';
      filters.year = saved.year || 'all';
      filters.status = saved.status || 'all';
      filters.amountMin = saved.amountMin || '';
      filters.amountMax = saved.amountMax || '';
    }
  }

  // Save current filters as user's default preferences
  function saveFiltersAsDefault() {
    var Users = FamilyOffice.Users;
    if (!Users) return false;

    Users.setUserPreferences({
      analyticsFilters: {
        stage: filters.stage,
        industry: filters.industry,
        hq: filters.hq,
        year: filters.year,
        status: filters.status,
        amountMin: filters.amountMin,
        amountMax: filters.amountMax
      }
    });
    return true;
  }

  function resetFilters() {
    filters = {
      stage: 'all',
      industry: 'all',
      hq: 'all',
      year: 'all',
      status: 'all',
      amountMin: '',
      amountMax: ''
    };
    // Load saved defaults if available
    loadSavedFilters();
  }

  function applyFilters(companies) {
    return companies.filter(function (c) {
      // Stage filter
      if (filters.stage !== 'all') {
        var companyStage = c.currentStage || c.entryStage;
        if (companyStage !== filters.stage) return false;
      }

      // Industry filter
      if (filters.industry !== 'all') {
        if (c.industry !== filters.industry) return false;
      }

      // HQ/Geography filter
      if (filters.hq !== 'all') {
        if ((c.hq || 'Unknown') !== filters.hq) return false;
      }

      // Year filter (entry year)
      if (filters.year !== 'all') {
        var entryYear = new Date(c.entryDate).getFullYear().toString();
        if (entryYear !== filters.year) return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        var status = c.status || 'Active';
        if (status !== filters.status) return false;
      }

      // Amount range filter
      var invested = c.totalInvested || 0;
      if (filters.amountMin !== '' && !isNaN(parseFloat(filters.amountMin))) {
        if (invested < parseFloat(filters.amountMin)) return false;
      }
      if (filters.amountMax !== '' && !isNaN(parseFloat(filters.amountMax))) {
        if (invested > parseFloat(filters.amountMax)) return false;
      }

      return true;
    });
  }

  function buildFilterUI(allCompanies) {
    // Get unique values for dropdowns
    var industries = [];
    var locations = [];
    var years = [];

    allCompanies.forEach(function (c) {
      if (c.industry && industries.indexOf(c.industry) === -1) {
        industries.push(c.industry);
      }
      var hq = c.hq || 'Unknown';
      if (locations.indexOf(hq) === -1) {
        locations.push(hq);
      }
      var year = new Date(c.entryDate).getFullYear().toString();
      if (years.indexOf(year) === -1) {
        years.push(year);
      }
    });

    industries.sort();
    locations.sort();
    years.sort().reverse();

    var stageOptions = '<option value="all">All Stages</option>' +
      Data.STAGES.map(function (s) {
        return '<option value="' + s + '"' + (filters.stage === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('');

    var industryOptions = '<option value="all">All Sectors</option>' +
      industries.map(function (i) {
        return '<option value="' + i + '"' + (filters.industry === i ? ' selected' : '') + '>' + i + '</option>';
      }).join('');

    var locationOptions = '<option value="all">All Locations</option>' +
      locations.map(function (l) {
        return '<option value="' + l + '"' + (filters.hq === l ? ' selected' : '') + '>' + l + '</option>';
      }).join('');

    var yearOptions = '<option value="all">All Years</option>' +
      years.map(function (y) {
        return '<option value="' + y + '"' + (filters.year === y ? ' selected' : '') + '>' + y + '</option>';
      }).join('');

    var statusOptions = '<option value="all">All Status</option>' +
      '<option value="Active"' + (filters.status === 'Active' ? ' selected' : '') + '>Active</option>' +
      '<option value="Exited"' + (filters.status === 'Exited' ? ' selected' : '') + '>Exited</option>' +
      '<option value="Written Off"' + (filters.status === 'Written Off' ? ' selected' : '') + '>Written Off</option>';

    return '\
      <div class="card mb-6" style="padding: var(--space-4);">\
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">\
          <h3 class="card-title" style="margin: 0;">Filter Analytics</h3>\
          <div style="display: flex; gap: 8px;">\
            <button id="analytics-save-defaults" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;">💾 Save as Default</button>\
            <button id="analytics-reset-filters" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;">Reset Filters</button>\
          </div>\
        </div>\
        <div class="grid" style="grid-template-columns: repeat(6, 1fr); gap: 12px;">\
          <div>\
            <label class="text-xs text-muted" style="display: block; margin-bottom: 4px;">Stage</label>\
            <select id="analytics-filter-stage" class="form-select" style="width: 100%; padding: 8px; font-size: 13px;">' + stageOptions + '</select>\
          </div>\
          <div>\
            <label class="text-xs text-muted" style="display: block; margin-bottom: 4px;">Sector</label>\
            <select id="analytics-filter-industry" class="form-select" style="width: 100%; padding: 8px; font-size: 13px;">' + industryOptions + '</select>\
          </div>\
          <div>\
            <label class="text-xs text-muted" style="display: block; margin-bottom: 4px;">Geography</label>\
            <select id="analytics-filter-hq" class="form-select" style="width: 100%; padding: 8px; font-size: 13px;">' + locationOptions + '</select>\
          </div>\
          <div>\
            <label class="text-xs text-muted" style="display: block; margin-bottom: 4px;">Entry Year</label>\
            <select id="analytics-filter-year" class="form-select" style="width: 100%; padding: 8px; font-size: 13px;">' + yearOptions + '</select>\
          </div>\
          <div>\
            <label class="text-xs text-muted" style="display: block; margin-bottom: 4px;">Status</label>\
            <select id="analytics-filter-status" class="form-select" style="width: 100%; padding: 8px; font-size: 13px;">' + statusOptions + '</select>\
          </div>\
          <div>\
            <label class="text-xs text-muted" style="display: block; margin-bottom: 4px;">Investment ($)</label>\
            <div style="display: flex; gap: 4px;">\
              <input type="number" id="analytics-filter-amount-min" placeholder="Min" value="' + filters.amountMin + '" style="width: 50%; padding: 8px; font-size: 13px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg-secondary);">\
              <input type="number" id="analytics-filter-amount-max" placeholder="Max" value="' + filters.amountMax + '" style="width: 50%; padding: 8px; font-size: 13px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg-secondary);">\
            </div>\
          </div>\
        </div>\
      </div>';
  }

  function render() {
    var allCompanies = Data.getCompanies();
    var companies = applyFilters(allCompanies);

    // Calculate metrics from filtered companies
    var metrics = {
      totalInvested: companies.reduce(function (sum, c) { return sum + (c.totalInvested || 0); }, 0),
      unrealizedValue: companies.filter(function (c) { return c.status === 'Active' || !c.status; })
        .reduce(function (sum, c) { return sum + ((c.latestValuation || 0) * ((c.ownership || 0) / 100)); }, 0),
      totalExitValue: companies.filter(function (c) { return c.status === 'Exited'; })
        .reduce(function (sum, c) { return sum + (c.exitValue || 0); }, 0)
    };

    // Calculate Portfolio XIRR
    var cashFlows = Utils.getPortfolioCashFlows(companies);
    var portfolioXIRR = Utils.calculateXIRR(cashFlows);

    // Group by industry (filtered)
    var byIndustry = {};
    companies.forEach(function (c) {
      if (!byIndustry[c.industry]) {
        byIndustry[c.industry] = [];
      }
      byIndustry[c.industry].push(c);
    });

    // Industry distribution
    var industryData = Object.keys(byIndustry)
      .map(function (industry) {
        var comps = byIndustry[industry];
        return {
          industry: industry,
          count: comps.length,
          invested: comps.reduce(function (sum, c) { return sum + (c.totalInvested || 0); }, 0),
          percentage: companies.length > 0 ? (comps.length / companies.length) * 100 : 0
        };
      })
      .sort(function (a, b) { return b.invested - a.invested; });

    // Stage distribution - use Data.STAGES constant
    var stageData = Data.STAGES.map(function (stage) {
      var stageComps = companies.filter(function (c) {
        var companyStage = c.currentStage || c.entryStage;
        return companyStage === stage && (c.status === 'Active' || !c.status);
      });
      return {
        stage: stage,
        count: stageComps.length,
        invested: stageComps.reduce(function (sum, c) { return sum + (c.totalInvested || 0); }, 0)
      };
    }).filter(function (s) { return s.count > 0; });

    // Investment timeline (from filtered companies)
    var investmentsByYear = {};
    companies.forEach(function (c) {
      var year = new Date(c.entryDate).getFullYear();
      if (!investmentsByYear[year]) {
        investmentsByYear[year] = { count: 0, invested: 0 };
      }
      investmentsByYear[year].count++;
      investmentsByYear[year].invested += c.initialInvestment || 0;

      (c.followOns || []).forEach(function (f) {
        // Only count follow-ons where we invested
        if (f.didWeInvest) {
          var fYear = new Date(f.date).getFullYear();
          if (!investmentsByYear[fYear]) {
            investmentsByYear[fYear] = { count: 0, invested: 0 };
          }
          // Use ourInvestment (not amount) - fall back to amount for legacy data
          investmentsByYear[fYear].invested += (f.ourInvestment || f.amount || 0);
        }
      });
    });

    var timelineData = Object.keys(investmentsByYear)
      .sort()
      .map(function (year) {
        return { year: year, count: investmentsByYear[year].count, invested: investmentsByYear[year].invested };
      });

    // Top investments
    var topByInvestment = companies.slice().sort(function (a, b) { return (b.totalInvested || 0) - (a.totalInvested || 0); }).slice(0, 10);

    // Unrealized gains
    var unrealizedGains = companies
      .filter(function (c) { return c.status === 'Active' || !c.status; })
      .map(function (c) {
        var unrealizedValue = (c.latestValuation || 0) * ((c.ownership || 0) / 100);
        var invested = c.totalInvested || 0;
        return {
          name: c.name,
          gain: unrealizedValue - invested,
          moic: invested > 0 ? unrealizedValue / invested : 0
        };
      })
      .sort(function (a, b) { return b.gain - a.gain; })
      .slice(0, 10);

    // Team performance
    var teamPerf = getTeamPerformance(companies);

    // Follow-on tracking metrics
    var followOnStats = getFollowOnStats(companies);

    // Geographic distribution (by HQ)
    var geoData = getGeographicDistribution(companies);

    // Portfolio health metrics
    var healthData = getPortfolioHealth(companies);

    // Build HTML
    var filterHtml = buildFilterUI(allCompanies);
    var industryHtml = buildIndustryChart(industryData);
    var stageHtml = buildStageChart(stageData);
    var stagePieHtml = buildStagePieChart();
    var timelineHtml = buildTimelineChart(timelineData);
    var topInvestmentsHtml = buildTopInvestmentsTable(topByInvestment);
    var unrealizedHtml = buildUnrealizedTable(unrealizedGains);
    var teamHtml = buildTeamCards(teamPerf);
    var followOnHtml = buildFollowOnStats(followOnStats);
    var geoHtml = buildGeographicChart(geoData);
    var geoRegionCardsHtml = buildGeoRegionCards(geoData);
    var healthHtml = buildHealthIndicators(healthData);

    // New analytics features
    var portfolioValueData = getPortfolioValueOverTime(companies);
    window._chartData = window._chartData || {};
    window._chartData.portfolioValue = portfolioValueData;
    var portfolioValueHtml = buildPortfolioValueChart();

    var vintageData = getVintageYearAnalysis(companies);
    var vintageHtml = buildVintageAnalysis(vintageData);

    var blendedMoic = metrics.totalInvested > 0 ? (metrics.unrealizedValue + metrics.totalExitValue) / metrics.totalInvested : 0;

    var returnsDashboardHtml = buildReturnsDashboard(companies, metrics, portfolioXIRR, blendedMoic);

    // Check if any filters are active
    var hasActiveFilters = filters.stage !== 'all' || filters.industry !== 'all' ||
      filters.hq !== 'all' || filters.year !== 'all' ||
      filters.status !== 'all' || filters.amountMin !== '' || filters.amountMax !== '';
    var filterCountHtml = hasActiveFilters
      ? '<div class="text-sm text-muted mb-4" style="text-align: center;">Showing <strong style="color: var(--color-accent-primary);">' + companies.length + '</strong> of ' + allCompanies.length + ' companies</div>'
      : '';

    return '\
      <div class="animate-fadeIn">\
        <!-- Filter Section -->\
        ' + filterHtml + '\
        ' + filterCountHtml + '\
        \
        <!-- Summary Cards -->\
        <div class="grid" style="grid-template-columns: repeat(5, 1fr); gap: 1.5rem; margin-bottom: 2rem;">\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-xs text-muted mb-2">Total Invested</div>\
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-accent-primary);">' + Utils.formatCurrency(metrics.totalInvested) + '</div>\
          </div>\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-xs text-muted mb-2">Unrealized Value</div>\
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-accent-tertiary);">' + Utils.formatCurrency(metrics.unrealizedValue) + '</div>\
          </div>\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-xs text-muted mb-2">Realized Returns</div>\
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">' + Utils.formatCurrency(metrics.totalExitValue) + '</div>\
          </div>\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-xs text-muted mb-2">Blended MOIC</div>\
            <div style="font-size: 1.5rem; font-weight: 700;">' + Utils.formatMOIC(blendedMoic) + '</div>\
          </div>\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-xs text-muted mb-2">Portfolio XIRR</div>\
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-accent-secondary);">' + Utils.formatXIRR(portfolioXIRR) + '</div>\
          </div>\
        </div>\
        \
        <!-- Returns Dashboard (NEW) -->\
        ' + returnsDashboardHtml + '\
        \
        <!-- Follow-on Tracking Stats -->\
        ' + followOnHtml + '\
        \
        <!-- Portfolio Health Indicators -->\
        ' + healthHtml + '\
        \
        <!-- Portfolio Value Over Time (NEW) -->\
        <div class="card mb-6">\
          <div class="card-header"><h3 class="card-title">Portfolio Value Over Time</h3></div>\
          <div style="padding: 20px;">' + portfolioValueHtml + '</div>\
        </div>\
        \
        <!-- Vintage Year Analysis (NEW) -->\
        <div class="card mb-6">\
          <div class="card-header"><h3 class="card-title">Vintage Year Analysis</h3></div>\
          <div style="padding: 20px;">' + vintageHtml + '</div>\
        </div>\
        \
        <!-- Charts Row -->\
        <div class="grid grid-cols-2 gap-6 mb-6">\
          <div class="card">\
            <div class="card-header"><h3 class="card-title">Investment by Industry</h3></div>\
            <div class="flex flex-col gap-3">' + industryHtml + '</div>\
          </div>\
          <div class="card">\
            <div class="card-header"><h3 class="card-title">Portfolio by Stage</h3></div>\
            <div class="grid grid-cols-2 gap-4">\
              <div>' + stageHtml + '</div>\
              <div>' + stagePieHtml + '</div>\
            </div>\
          </div>\
        </div>\
        \
        <!-- Geographic Distribution -->\
        <div class="card mb-6">\
          <div class="card-header"><h3 class="card-title">Geographic Distribution</h3></div>\
          ' + geoRegionCardsHtml + '\
          <div class="flex flex-col gap-3">' + geoHtml + '</div>\
        </div>\
        \
        <!-- Investment Timeline -->\
        <div class="card mb-6">\
          <div class="card-header"><h3 class="card-title">Investment Timeline</h3></div>\
          <div style="padding: 20px 0;">\
            <div class="flex items-end gap-4" style="height: 200px;">' + timelineHtml + '</div>\
          </div>\
        </div>\
        \
        <!-- Tables Row -->\
        <div class="grid grid-cols-2 gap-6">\
          <div class="card">\
            <div class="card-header"><h3 class="card-title">Top Investments by Amount</h3></div>\
            ' + topInvestmentsHtml + '\
          </div>\
          <div class="card">\
            <div class="card-header"><h3 class="card-title">Unrealized Gains</h3></div>\
            ' + unrealizedHtml + '\
          </div>\
        </div>\
        \
        <!-- Team Performance -->\
        <div class="card mt-6">\
          <div class="card-header">\
            <h3 class="card-title">Team Performance</h3>\
            <span class="text-sm text-muted">By Deal Sourcer</span>\
          </div>\
          <div class="grid grid-cols-3 gap-4">' + teamHtml + '</div>\
        </div>\
      </div>';
  }

  function buildIndustryChart(industryData) {
    // Store data for Chart.js initialization
    window._chartData = window._chartData || {};
    window._chartData.industry = industryData;

    return '<div style="height: 280px; position: relative;"><canvas id="industry-chart"></canvas></div>';
  }

  function buildStageChart(stageData) {
    // Store data for Chart.js initialization
    window._chartData = window._chartData || {};
    window._chartData.stage = stageData;

    return '<div style="height: 280px; position: relative;"><canvas id="stage-chart"></canvas></div>';
  }

  function buildTimelineChart(timelineData) {
    // Store data for Chart.js initialization
    window._chartData = window._chartData || {};
    window._chartData.timeline = timelineData;

    return '<div style="height: 220px; position: relative;"><canvas id="timeline-chart"></canvas></div>';
  }

  function buildGeographicChart(geoData) {
    // Store data for Chart.js initialization  
    window._chartData = window._chartData || {};
    window._chartData.geo = geoData;

    return '<div style="height: 220px; position: relative;"><canvas id="geo-chart"></canvas></div>';
  }

  // Chart.js instances tracking
  var chartInstances = {};

  function destroyCharts() {
    Object.keys(chartInstances).forEach(function (key) {
      if (chartInstances[key]) {
        chartInstances[key].destroy();
      }
    });
    chartInstances = {};
  }

  function initCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded');
      return;
    }

    destroyCharts();

    var data = window._chartData || {};
    var colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

    // Industry Doughnut Chart
    var industryCanvas = document.getElementById('industry-chart');
    if (industryCanvas && data.industry && data.industry.length > 0) {
      var ctx = industryCanvas.getContext('2d');
      chartInstances.industry = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.industry.slice(0, 8).map(function (d) { return d.industry; }),
          datasets: [{
            data: data.industry.slice(0, 8).map(function (d) { return d.invested; }),
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#9ca3af',
                padding: 12,
                font: { size: 11 },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#d1d5db',
              padding: 12,
              callbacks: {
                label: function (context) {
                  return Utils.formatCurrency(context.raw) + ' (' + data.industry[context.dataIndex].count + ' companies)';
                }
              }
            }
          }
        }
      });
    }

    // Stage Horizontal Bar Chart
    var stageCanvas = document.getElementById('stage-chart');
    if (stageCanvas && data.stage && data.stage.length > 0) {
      var stageColors = {
        'Pre-Seed': '#9ca3af',
        'Seed': '#f59e0b',
        'Pre Series A': '#84cc16',
        'Series A': '#3b82f6',
        'Series B & Above': '#8b5cf6',
        'Pre-IPO': '#10b981'
      };
      var ctx2 = stageCanvas.getContext('2d');
      chartInstances.stage = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: data.stage.map(function (d) { return d.stage; }),
          datasets: [{
            label: 'Invested',
            data: data.stage.map(function (d) { return d.invested; }),
            backgroundColor: data.stage.map(function (d) { return stageColors[d.stage] || '#6366f1'; }),
            borderRadius: 6,
            maxBarThickness: 28
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#d1d5db',
              padding: 12,
              callbacks: {
                label: function (context) {
                  var item = data.stage[context.dataIndex];
                  return Utils.formatCurrency(context.raw) + ' (' + item.count + ' companies)';
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#9ca3af',
                callback: function (value) { return Utils.formatCurrency(value); }
              }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#f3f4f6', font: { size: 11 } }
            }
          }
        }
      });
    }

    // Timeline Bar Chart
    var timelineCanvas = document.getElementById('timeline-chart');
    if (timelineCanvas && data.timeline && data.timeline.length > 0) {
      var ctx3 = timelineCanvas.getContext('2d');
      var gradient = ctx3.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(1, '#6366f1');

      chartInstances.timeline = new Chart(ctx3, {
        type: 'bar',
        data: {
          labels: data.timeline.map(function (d) { return d.year; }),
          datasets: [{
            label: 'Invested',
            data: data.timeline.map(function (d) { return d.invested; }),
            backgroundColor: gradient,
            borderRadius: 6,
            maxBarThickness: 50
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#d1d5db',
              padding: 12,
              callbacks: {
                label: function (context) {
                  var item = data.timeline[context.dataIndex];
                  return Utils.formatCurrency(context.raw) + ' (' + item.count + ' deals)';
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#9ca3af' }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#9ca3af',
                callback: function (value) { return Utils.formatCurrency(value); }
              }
            }
          }
        }
      });
    }

    // Geographic Horizontal Bar Chart
    var geoCanvas = document.getElementById('geo-chart');
    if (geoCanvas && data.geo && data.geo.length > 0) {
      var ctx4 = geoCanvas.getContext('2d');
      chartInstances.geo = new Chart(ctx4, {
        type: 'bar',
        data: {
          labels: data.geo.map(function (d) { return d.location; }),
          datasets: [{
            label: 'Invested',
            data: data.geo.map(function (d) { return d.invested; }),
            backgroundColor: colors.slice(0, data.geo.length),
            borderRadius: 6,
            maxBarThickness: 24
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#d1d5db',
              padding: 12,
              callbacks: {
                label: function (context) {
                  var item = data.geo[context.dataIndex];
                  return Utils.formatCurrency(context.raw) + ' (' + item.count + ' companies)';
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#9ca3af',
                callback: function (value) { return Utils.formatCurrency(value); }
              }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#f3f4f6', font: { size: 11 } }
            }
          }
        }
      });
    }

    // NEW: Portfolio Value Over Time Line Chart
    var portfolioValueCanvas = document.getElementById('portfolio-value-chart');
    if (portfolioValueCanvas && data.portfolioValue && data.portfolioValue.length > 0) {
      var ctx5 = portfolioValueCanvas.getContext('2d');
      var investedGradient = ctx5.createLinearGradient(0, 0, 0, 280);
      investedGradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
      investedGradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');

      var valueGradient = ctx5.createLinearGradient(0, 0, 0, 280);
      valueGradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
      valueGradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');

      chartInstances.portfolioValue = new Chart(ctx5, {
        type: 'line',
        data: {
          labels: data.portfolioValue.map(function (d) {
            return d.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }),
          datasets: [{
            label: 'Invested Capital',
            data: data.portfolioValue.map(function (d) { return d.invested; }),
            borderColor: '#6366f1',
            backgroundColor: investedGradient,
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 6
          }, {
            label: 'Portfolio Value',
            data: data.portfolioValue.map(function (d) { return d.value; }),
            borderColor: '#10b981',
            backgroundColor: valueGradient,
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#9ca3af',
                padding: 16,
                font: { size: 11 },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#d1d5db',
              padding: 12,
              callbacks: {
                label: function (context) {
                  return context.dataset.label + ': ' + Utils.formatCurrency(context.raw);
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#9ca3af', maxRotation: 45, font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#9ca3af',
                callback: function (value) { return Utils.formatCurrency(value); }
              }
            }
          }
        }
      });
    }

    // NEW: Vintage Year Grouped Bar Chart
    var vintageCanvas = document.getElementById('vintage-chart');
    if (vintageCanvas && data.vintage && data.vintage.length > 0) {
      var ctx6 = vintageCanvas.getContext('2d');
      chartInstances.vintage = new Chart(ctx6, {
        type: 'bar',
        data: {
          labels: data.vintage.map(function (d) { return d.year; }),
          datasets: [{
            label: 'Invested',
            data: data.vintage.map(function (d) { return d.invested; }),
            backgroundColor: '#6366f1',
            borderRadius: 4,
            maxBarThickness: 30
          }, {
            label: 'Current Value',
            data: data.vintage.map(function (d) { return d.value; }),
            backgroundColor: '#10b981',
            borderRadius: 4,
            maxBarThickness: 30
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#9ca3af',
                padding: 12,
                font: { size: 11 },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#d1d5db',
              padding: 12,
              callbacks: {
                label: function (context) {
                  var item = data.vintage[context.dataIndex];
                  return context.dataset.label + ': ' + Utils.formatCurrency(context.raw) +
                    (context.datasetIndex === 1 ? ' (MOIC: ' + Utils.formatMOIC(item.moic) + ')' : '');
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#9ca3af' }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#9ca3af',
                callback: function (value) { return Utils.formatCurrency(value); }
              }
            }
          }
        }
      });
    }

    // NEW: Stage Pie/Doughnut Chart
    var stagePieCanvas = document.getElementById('stage-pie-chart');
    if (stagePieCanvas && data.stage && data.stage.length > 0) {
      var stageColors = {
        'Pre-Seed': '#9ca3af',
        'Seed': '#f59e0b',
        'Pre Series A': '#84cc16',
        'Series A': '#3b82f6',
        'Series B & Above': '#8b5cf6',
        'Pre-IPO': '#10b981'
      };
      var ctx7 = stagePieCanvas.getContext('2d');
      chartInstances.stagePie = new Chart(ctx7, {
        type: 'doughnut',
        data: {
          labels: data.stage.map(function (d) { return d.stage; }),
          datasets: [{
            data: data.stage.map(function (d) { return d.count; }),
            backgroundColor: data.stage.map(function (d) { return stageColors[d.stage] || '#6366f1'; }),
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#d1d5db',
              padding: 12,
              callbacks: {
                label: function (context) {
                  var item = data.stage[context.dataIndex];
                  return item.stage + ': ' + item.count + ' companies (' + Utils.formatCurrency(item.invested) + ')';
                }
              }
            }
          }
        }
      });
    }

    // NEW: MOIC by Vintage Mini Chart
    var moicVintageCanvas = document.getElementById('moic-vintage-chart');
    if (moicVintageCanvas && data.moicVintage && data.moicVintage.length > 0) {
      var ctx8 = moicVintageCanvas.getContext('2d');
      chartInstances.moicVintage = new Chart(ctx8, {
        type: 'bar',
        data: {
          labels: data.moicVintage.map(function (d) { return d.year; }),
          datasets: [{
            label: 'MOIC',
            data: data.moicVintage.map(function (d) { return d.moic; }),
            backgroundColor: data.moicVintage.map(function (d) {
              return d.moic >= 2 ? '#10b981' : d.moic >= 1 ? '#f59e0b' : '#ef4444';
            }),
            borderRadius: 3,
            maxBarThickness: 20
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#d1d5db',
              padding: 8,
              callbacks: {
                label: function (context) {
                  var item = data.moicVintage[context.dataIndex];
                  return Utils.formatMOIC(context.raw) + ' (' + item.count + ' deals)';
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#9ca3af',
                font: { size: 9 },
                callback: function (value) { return value.toFixed(1) + 'x'; }
              }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#f3f4f6', font: { size: 9 } }
            }
          }
        }
      });
    }

    // NEW: MOIC by Stage Mini Chart
    var moicStageCanvas = document.getElementById('moic-stage-chart');
    if (moicStageCanvas && data.moicStage && data.moicStage.length > 0) {
      var ctx9 = moicStageCanvas.getContext('2d');
      chartInstances.moicStage = new Chart(ctx9, {
        type: 'bar',
        data: {
          labels: data.moicStage.map(function (d) { return d.stage; }),
          datasets: [{
            label: 'MOIC',
            data: data.moicStage.map(function (d) { return d.moic; }),
            backgroundColor: data.moicStage.map(function (d) {
              return d.moic >= 2 ? '#10b981' : d.moic >= 1 ? '#f59e0b' : '#ef4444';
            }),
            borderRadius: 3,
            maxBarThickness: 20
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#d1d5db',
              padding: 8,
              callbacks: {
                label: function (context) {
                  var item = data.moicStage[context.dataIndex];
                  return Utils.formatMOIC(context.raw) + ' (' + item.count + ' deals)';
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#9ca3af',
                font: { size: 9 },
                callback: function (value) { return value.toFixed(1) + 'x'; }
              }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#f3f4f6', font: { size: 9 } }
            }
          }
        }
      });
    }
  }

  function buildTopInvestmentsTable(companies) {
    var rows = companies.map(function (c, i) {
      return '\
        <tr>\
          <td>\
            <div class="flex items-center gap-2">\
              <span class="text-muted text-xs">#' + (i + 1) + '</span>\
              <span style="font-weight: 500;">' + c.name + '</span>\
            </div>\
          </td>\
          <td class="text-sm text-muted">' + c.industry + '</td>\
          <td style="color: var(--color-accent-tertiary);">' + Utils.formatCurrency(c.totalInvested) + '</td>\
        </tr>';
    }).join('');

    return '<table class="table" style="margin: 0;"><thead><tr><th>Company</th><th>Industry</th><th>Invested</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function buildUnrealizedTable(gains) {
    var rows = gains.map(function (c, i) {
      var gainColor = c.gain >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
      var gainPrefix = c.gain >= 0 ? '+' : '';
      return '\
        <tr>\
          <td>\
            <div class="flex items-center gap-2">\
              <span class="text-muted text-xs">#' + (i + 1) + '</span>\
              <span style="font-weight: 500;">' + c.name + '</span>\
            </div>\
          </td>\
          <td style="color: ' + gainColor + ';">' + gainPrefix + Utils.formatCurrency(c.gain) + '</td>\
          <td style="font-weight: 600;">' + Utils.formatMOIC(c.moic) + '</td>\
        </tr>';
    }).join('');

    return '<table class="table" style="margin: 0;"><thead><tr><th>Company</th><th>Gain</th><th>MOIC</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function buildTeamCards(team) {
    return team.map(function (member) {
      return '\
        <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg);">\
          <div style="font-weight: 600; margin-bottom: 8px;">' + member.name + '</div>\
          <div class="flex justify-between text-sm mb-1">\
            <span class="text-muted">Deals Sourced</span>\
            <span>' + member.deals + '</span>\
          </div>\
          <div class="flex justify-between text-sm mb-1">\
            <span class="text-muted">Total Invested</span>\
            <span>' + Utils.formatCurrency(member.invested) + '</span>\
          </div>\
          <div class="flex justify-between text-sm">\
            <span class="text-muted">Avg MOIC</span>\
            <span style="color: var(--color-success);">' + Utils.formatMOIC(member.avgMoic) + '</span>\
          </div>\
        </div>';
    }).join('');
  }

  function getTeamPerformance(companies) {
    var team = {};

    companies.forEach(function (c) {
      if (!team[c.dealSourcer]) {
        team[c.dealSourcer] = { name: c.dealSourcer, deals: 0, invested: 0, totalMoic: 0 };
      }

      team[c.dealSourcer].deals++;
      team[c.dealSourcer].invested += c.totalInvested;

      if (c.status === 'Active') {
        var moic = (c.latestValuation * (c.ownership / 100)) / c.totalInvested;
        team[c.dealSourcer].totalMoic += moic;
      } else if (c.status === 'Exited') {
        var exitMoic = c.exitValue / c.totalInvested;
        team[c.dealSourcer].totalMoic += exitMoic;
      }
    });

    return Object.keys(team).map(function (name) {
      var m = team[name];
      return {
        name: m.name,
        deals: m.deals,
        invested: m.invested,
        avgMoic: m.deals > 0 ? m.totalMoic / m.deals : 0
      };
    }).sort(function (a, b) { return b.invested - a.invested; });
  }

  function getFollowOnStats(companies) {
    var totalRounds = 0;
    var roundsInvested = 0;
    var roundsPassed = 0;
    var capitalDeployed = 0;

    companies.forEach(function (c) {
      (c.followOns || []).forEach(function (f) {
        totalRounds++;
        if (f.didWeInvest) {
          roundsInvested++;
          capitalDeployed += (f.ourInvestment || f.amount || 0);
        } else {
          roundsPassed++;
        }
      });
    });

    var participationRate = totalRounds > 0 ? (roundsInvested / totalRounds) * 100 : 0;

    return {
      totalRounds: totalRounds,
      roundsInvested: roundsInvested,
      roundsPassed: roundsPassed,
      capitalDeployed: capitalDeployed,
      participationRate: participationRate
    };
  }

  function getGeographicDistribution(companies) {
    var byLocation = {};

    companies.forEach(function (c) {
      var hq = c.hq || 'Unknown';
      if (!byLocation[hq]) {
        byLocation[hq] = { count: 0, invested: 0 };
      }
      byLocation[hq].count++;
      byLocation[hq].invested += (c.totalInvested || 0);
    });

    return Object.keys(byLocation)
      .map(function (location) {
        return {
          location: location,
          count: byLocation[location].count,
          invested: byLocation[location].invested
        };
      })
      .sort(function (a, b) { return b.invested - a.invested; })
      .slice(0, 8);
  }

  function buildFollowOnStats(stats) {
    if (stats.totalRounds === 0) {
      return '<div class="card mb-6" style="padding: var(--space-4); text-align: center;">\
        <div class="text-muted">No follow-on rounds recorded yet</div>\
      </div>';
    }

    return '\
      <div class="grid grid-cols-4 gap-6 mb-6">\
        <div class="card" style="padding: var(--space-4); text-align: center;">\
          <div class="text-xs text-muted mb-2">Total Follow-on Rounds</div>\
          <div style="font-size: 1.5rem; font-weight: 700;">' + stats.totalRounds + '</div>\
        </div>\
        <div class="card" style="padding: var(--space-4); text-align: center;">\
          <div class="text-xs text-muted mb-2">Rounds We Invested</div>\
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">' + stats.roundsInvested + '</div>\
        </div>\
        <div class="card" style="padding: var(--space-4); text-align: center;">\
          <div class="text-xs text-muted mb-2">Rounds We Passed</div>\
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-warning);">' + stats.roundsPassed + '</div>\
        </div>\
        <div class="card" style="padding: var(--space-4); text-align: center;">\
          <div class="text-xs text-muted mb-2">Participation Rate</div>\
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-accent-primary);">' + stats.participationRate.toFixed(2) + '%</div>\
        </div>\
      </div>\
      <div class="card mb-6" style="padding: var(--space-4); text-align: center;">\
        <div class="text-xs text-muted mb-2">Follow-on Capital Deployed</div>\
        <div style="font-size: 1.8rem; font-weight: 700; color: var(--color-accent-tertiary);">' + Utils.formatCurrency(stats.capitalDeployed) + '</div>\
      </div>';
  }

  function buildGeographicChart(geoData) {
    if (geoData.length === 0) {
      return '<div class="text-muted" style="text-align: center; padding: 20px;">No location data available</div>';
    }

    var colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#6366f1'];
    var maxInvested = Math.max.apply(null, geoData.map(function (g) { return g.invested; }));

    return geoData.map(function (item, index) {
      var color = colors[index % colors.length];
      var width = (item.invested / maxInvested) * 100;
      return '\
        <div>\
          <div class="flex justify-between items-center mb-1">\
            <span class="text-sm" style="display: flex; align-items: center; gap: 8px;">\
              <span style="font-size: 1.1rem;">📍</span> ' + item.location + '\
            </span>\
            <span class="text-sm" style="color: ' + color + ';">' + Utils.formatCurrency(item.invested) + '</span>\
          </div>\
          <div style="height: 8px; background: var(--color-bg-tertiary); border-radius: 4px; overflow: hidden;">\
            <div style="height: 100%; width: ' + width + '%; background: ' + color + '; border-radius: 4px;"></div>\
          </div>\
          <div class="text-xs text-muted mt-1">' + item.count + ' companies</div>\
        </div>';
    }).join('');
  }

  function getPortfolioHealth(companies) {
    var now = new Date();
    var activeCompanies = companies.filter(function (c) { return c.status === 'Active' || !c.status; });

    // Companies needing attention (no investment in 18+ months)
    var needsAttention = activeCompanies.filter(function (c) {
      var lastInvestment = new Date(c.lastInvestmentDate || c.entryDate);
      var monthsSince = (now - lastInvestment) / (1000 * 60 * 60 * 24 * 30);
      return monthsSince > 18;
    });

    // Top concentration - investments where we have >10% ownership
    var highOwnership = activeCompanies.filter(function (c) {
      return (c.ownership || 0) >= 10;
    });

    // Capital at risk (investments with MOIC < 1)
    var atRisk = activeCompanies.filter(function (c) {
      var unrealizedValue = (c.latestValuation || 0) * ((c.ownership || 0) / 100);
      var invested = c.totalInvested || 0;
      if (invested === 0) return false;
      var moic = unrealizedValue / invested;
      return moic < 1;
    });

    // Calculate capital at risk amount
    var capitalAtRisk = atRisk.reduce(function (sum, c) {
      return sum + (c.totalInvested || 0);
    }, 0);

    // Average holding period
    var totalHoldingDays = activeCompanies.reduce(function (sum, c) {
      var entryDate = new Date(c.entryDate);
      return sum + (now - entryDate) / (1000 * 60 * 60 * 24);
    }, 0);
    var avgHoldingMonths = activeCompanies.length > 0
      ? Math.round((totalHoldingDays / activeCompanies.length) / 30)
      : 0;

    return {
      needsAttention: needsAttention,
      highOwnership: highOwnership,
      atRisk: atRisk,
      capitalAtRisk: capitalAtRisk,
      avgHoldingMonths: avgHoldingMonths,
      activeCount: activeCompanies.length
    };
  }

  function buildHealthIndicators(health) {
    var attentionColor = health.needsAttention.length > 3 ? 'var(--color-danger)' :
      health.needsAttention.length > 0 ? 'var(--color-warning)' : 'var(--color-success)';
    var riskColor = health.atRisk.length > 3 ? 'var(--color-danger)' :
      health.atRisk.length > 0 ? 'var(--color-warning)' : 'var(--color-success)';

    var attentionList = health.needsAttention.length > 0
      ? health.needsAttention.slice(0, 3).map(function (c) { return c.name; }).join(', ') +
      (health.needsAttention.length > 3 ? '...' : '')
      : 'None';

    var atRiskList = health.atRisk.length > 0
      ? health.atRisk.slice(0, 3).map(function (c) { return c.name; }).join(', ') +
      (health.atRisk.length > 3 ? '...' : '')
      : 'None';

    return '\
      <div class="card mb-6">\
        <div class="card-header"><h3 class="card-title">Portfolio Health Indicators</h3></div>\
        <div class="grid grid-cols-4 gap-4" style="padding-bottom: 16px;">\
          <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg); text-align: center;">\
            <div class="text-xs text-muted mb-2">Avg Holding Period</div>\
            <div style="font-size: 1.3rem; font-weight: 700;">' + health.avgHoldingMonths + ' mo</div>\
          </div>\
          <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg); text-align: center;">\
            <div class="text-xs text-muted mb-2">High Ownership (≥10%)</div>\
            <div style="font-size: 1.3rem; font-weight: 700; color: var(--color-accent-primary);">' + health.highOwnership.length + '</div>\
          </div>\
          <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg); text-align: center;">\
            <div class="text-xs text-muted mb-2">Need Attention (18mo+)</div>\
            <div style="font-size: 1.3rem; font-weight: 700; color: ' + attentionColor + ';">' + health.needsAttention.length + '</div>\
          </div>\
          <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg); text-align: center;">\
            <div class="text-xs text-muted mb-2">Capital at Risk (MOIC &lt;1)</div>\
            <div style="font-size: 1.3rem; font-weight: 700; color: ' + riskColor + ';">' + Utils.formatCurrency(health.capitalAtRisk) + '</div>\
          </div>\
        </div>\
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">\
          <div style="padding: 12px; background: rgba(245, 158, 11, 0.1); border-radius: var(--radius-md); border-left: 3px solid var(--color-warning);">\
            <div class="text-xs text-muted mb-1">Companies Needing Attention</div>\
            <div class="text-sm">' + attentionList + '</div>\
          </div>\
          <div style="padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md); border-left: 3px solid var(--color-danger);">\
            <div class="text-xs text-muted mb-1">Investments at Risk</div>\
            <div class="text-sm">' + atRiskList + '</div>\
          </div>\
        </div>\
      </div>';
  }

  // ============================================
  // NEW FEATURE 1: Portfolio Value Over Time
  // ============================================
  function getPortfolioValueOverTime(companies) {
    // Collect all investment events (initial + follow-ons)
    var events = [];

    companies.forEach(function (c) {
      // Initial investment
      events.push({
        date: new Date(c.entryDate),
        invested: c.initialInvestment || 0,
        company: c.name
      });

      // Follow-on investments
      (c.followOns || []).forEach(function (f) {
        if (f.didWeInvest) {
          events.push({
            date: new Date(f.date),
            invested: f.ourInvestment || f.amount || 0,
            company: c.name
          });
        }
      });
    });

    // Sort by date
    events.sort(function (a, b) { return a.date - b.date; });

    if (events.length === 0) return [];

    // Calculate cumulative invested capital at each point
    var cumulativeInvested = 0;
    var dataPoints = [];
    var seenDates = {};

    events.forEach(function (e) {
      cumulativeInvested += e.invested;
      var dateKey = e.date.toISOString().split('T')[0];

      // Aggregate same-day events
      if (seenDates[dateKey]) {
        seenDates[dateKey].invested = cumulativeInvested;
      } else {
        seenDates[dateKey] = {
          date: e.date,
          invested: cumulativeInvested
        };
      }
    });

    // Convert to array and calculate estimated portfolio value at each point
    var dateKeys = Object.keys(seenDates).sort();
    var totalCurrentValue = companies.reduce(function (sum, c) {
      if (c.status === 'Exited') {
        return sum + (c.exitValue || 0);
      }
      return sum + ((c.latestValuation || 0) * ((c.ownership || 0) / 100));
    }, 0);
    var totalInvested = companies.reduce(function (sum, c) { return sum + (c.totalInvested || 0); }, 0);
    var currentMoic = totalInvested > 0 ? totalCurrentValue / totalInvested : 1;

    dataPoints = dateKeys.map(function (key) {
      var item = seenDates[key];
      // Estimate value as invested * blended MOIC (simplified)
      return {
        date: item.date,
        invested: item.invested,
        value: item.invested * currentMoic
      };
    });

    // Add current date point
    var now = new Date();
    dataPoints.push({
      date: now,
      invested: totalInvested,
      value: totalCurrentValue
    });

    return dataPoints;
  }

  function buildPortfolioValueChart() {
    return '<div style="height: 280px; position: relative;"><canvas id="portfolio-value-chart"></canvas></div>';
  }

  // ============================================
  // NEW FEATURE 2: Stage Pie Chart (enhancement)
  // ============================================
  function buildStagePieChart() {
    return '<div style="height: 280px; position: relative;"><canvas id="stage-pie-chart"></canvas></div>';
  }

  // ============================================
  // NEW FEATURE 3: Geographic Region Cards
  // ============================================
  function buildGeoRegionCards(geoData) {
    if (geoData.length === 0) return '';

    // Define Indian cities
    var indianCities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Gurugram', 'Noida', 'Bengaluru'];

    var indiaData = { count: 0, invested: 0, cities: [] };
    var intlData = { count: 0, invested: 0, cities: [] };

    geoData.forEach(function (g) {
      var isIndia = indianCities.some(function (city) {
        return g.location.toLowerCase().indexOf(city.toLowerCase()) !== -1;
      });

      if (isIndia) {
        indiaData.count += g.count;
        indiaData.invested += g.invested;
        indiaData.cities.push(g.location);
      } else {
        intlData.count += g.count;
        intlData.invested += g.invested;
        intlData.cities.push(g.location);
      }
    });

    var totalInvested = indiaData.invested + intlData.invested;
    var indiaPercent = totalInvested > 0 ? (indiaData.invested / totalInvested * 100).toFixed(2) : 0;
    var intlPercent = totalInvested > 0 ? (intlData.invested / totalInvested * 100).toFixed(2) : 0;

    return '\
      <div class="grid grid-cols-2 gap-4 mb-4">\
        <div style="padding: 16px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05)); border-radius: var(--radius-lg); border: 1px solid rgba(16, 185, 129, 0.2);">\
          <div class="flex items-center gap-2 mb-2">\
            <span style="font-size: 1.2rem;">🇮🇳</span>\
            <span style="font-weight: 600;">India</span>\
            <span class="text-sm text-muted ml-auto">' + indiaPercent + '% of portfolio</span>\
          </div>\
          <div class="flex justify-between mb-1">\
            <span class="text-sm text-muted">' + indiaData.count + ' companies</span>\
            <span style="font-weight: 600; color: #10b981;">' + Utils.formatCurrency(indiaData.invested) + '</span>\
          </div>\
          <div class="text-xs text-muted">' + indiaData.cities.slice(0, 4).join(', ') + (indiaData.cities.length > 4 ? '...' : '') + '</div>\
        </div>\
        <div style="padding: 16px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05)); border-radius: var(--radius-lg); border: 1px solid rgba(59, 130, 246, 0.2);">\
          <div class="flex items-center gap-2 mb-2">\
            <span style="font-size: 1.2rem;">🌍</span>\
            <span style="font-weight: 600;">International</span>\
            <span class="text-sm text-muted ml-auto">' + intlPercent + '% of portfolio</span>\
          </div>\
          <div class="flex justify-between mb-1">\
            <span class="text-sm text-muted">' + intlData.count + ' companies</span>\
            <span style="font-weight: 600; color: #3b82f6;">' + Utils.formatCurrency(intlData.invested) + '</span>\
          </div>\
          <div class="text-xs text-muted">' + intlData.cities.slice(0, 4).join(', ') + (intlData.cities.length > 4 ? '...' : '') + '</div>\
        </div>\
      </div>';
  }

  // ============================================
  // NEW FEATURE 4: Vintage Year Analysis
  // ============================================
  function getVintageYearAnalysis(companies) {
    var byYear = {};

    companies.forEach(function (c) {
      var year = new Date(c.entryDate).getFullYear();
      if (!byYear[year]) {
        byYear[year] = {
          year: year,
          count: 0,
          invested: 0,
          value: 0,
          moicSum: 0
        };
      }

      byYear[year].count++;
      byYear[year].invested += c.totalInvested || 0;

      // Calculate current value
      var currentValue = 0;
      if (c.status === 'Exited') {
        currentValue = c.exitValue || 0;
      } else {
        currentValue = (c.latestValuation || 0) * ((c.ownership || 0) / 100);
      }
      byYear[year].value += currentValue;

      // Track MOIC
      var invested = c.totalInvested || 0;
      if (invested > 0) {
        byYear[year].moicSum += currentValue / invested;
      }
    });

    // Calculate MOIC per vintage
    return Object.keys(byYear)
      .sort()
      .map(function (year) {
        var data = byYear[year];
        return {
          year: data.year,
          count: data.count,
          invested: data.invested,
          value: data.value,
          moic: data.invested > 0 ? data.value / data.invested : 0,
          avgMoic: data.count > 0 ? data.moicSum / data.count : 0
        };
      });
  }

  function buildVintageAnalysis(vintageData) {
    if (vintageData.length === 0) {
      return '<div class="text-muted" style="text-align: center; padding: 20px;">No vintage data available</div>';
    }

    // Store for chart
    window._chartData = window._chartData || {};
    window._chartData.vintage = vintageData;

    // Build table
    var tableRows = vintageData.map(function (v) {
      var moicColor = v.moic >= 2 ? 'var(--color-success)' : v.moic >= 1 ? 'var(--color-warning)' : 'var(--color-danger)';
      return '\
        <tr>\
          <td style="font-weight: 600;">' + v.year + '</td>\
          <td>' + v.count + '</td>\
          <td>' + Utils.formatCurrency(v.invested) + '</td>\
          <td>' + Utils.formatCurrency(v.value) + '</td>\
          <td style="color: ' + moicColor + '; font-weight: 600;">' + Utils.formatMOIC(v.moic) + '</td>\
        </tr>';
    }).join('');

    return '\
      <div class="grid grid-cols-2 gap-6">\
        <div style="height: 280px; position: relative;"><canvas id="vintage-chart"></canvas></div>\
        <div style="overflow-x: auto;">\
          <table class="table" style="margin: 0; font-size: 13px;">\
            <thead>\
              <tr>\
                <th>Vintage</th>\
                <th>Deals</th>\
                <th>Invested</th>\
                <th>Value</th>\
                <th>MOIC</th>\
              </tr>\
            </thead>\
            <tbody>' + tableRows + '</tbody>\
          </table>\
        </div>\
      </div>';
  }

  // ============================================
  // NEW FEATURE 5: MOIC/IRR Dashboard
  // ============================================
  function buildReturnsDashboard(companies, metrics, portfolioXIRR, blendedMoic) {
    // Calculate DPI and TVPI
    var totalInvested = metrics.totalInvested;
    var distributions = companies.reduce(function (sum, c) {
      if (c.status === 'Exited') {
        return sum + (c.exitValue || 0);
      }
      return sum;
    }, 0);
    var unrealizedValue = metrics.unrealizedValue;

    var dpi = totalInvested > 0 ? distributions / totalInvested : 0;
    var tvpi = totalInvested > 0 ? (unrealizedValue + distributions) / totalInvested : 0;

    // Calculate MOIC by vintage (for mini chart)
    var vintageData = getVintageYearAnalysis(companies);
    window._chartData = window._chartData || {};
    window._chartData.moicVintage = vintageData;

    // Calculate MOIC by stage
    var stageData = Data.STAGES.map(function (stage) {
      var stageComps = companies.filter(function (c) {
        var companyStage = c.currentStage || c.entryStage;
        return companyStage === stage;
      });

      var invested = stageComps.reduce(function (sum, c) { return sum + (c.totalInvested || 0); }, 0);
      var value = stageComps.reduce(function (sum, c) {
        if (c.status === 'Exited') return sum + (c.exitValue || 0);
        return sum + ((c.latestValuation || 0) * ((c.ownership || 0) / 100));
      }, 0);

      return {
        stage: stage,
        moic: invested > 0 ? value / invested : 0,
        count: stageComps.length
      };
    }).filter(function (s) { return s.count > 0; });

    window._chartData.moicStage = stageData;

    var xirrColor = portfolioXIRR >= 0.25 ? 'var(--color-success)' : portfolioXIRR >= 0.15 ? 'var(--color-warning)' : 'var(--color-accent-primary)';
    var moicColor = blendedMoic >= 2 ? 'var(--color-success)' : blendedMoic >= 1 ? 'var(--color-warning)' : 'var(--color-danger)';
    var dpiColor = dpi >= 0.5 ? 'var(--color-success)' : dpi >= 0.25 ? 'var(--color-warning)' : 'var(--color-muted)';
    var tvpiColor = tvpi >= 2 ? 'var(--color-success)' : tvpi >= 1 ? 'var(--color-warning)' : 'var(--color-danger)';

    return '\
      <div class="card mb-6">\
        <div class="card-header"><h3 class="card-title">Returns Dashboard</h3></div>\
        <div class="grid grid-cols-4 gap-4 mb-4">\
          <div style="padding: 20px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.1)); border-radius: var(--radius-lg); text-align: center;">\
            <div class="text-xs text-muted mb-1">Portfolio XIRR</div>\
            <div style="font-size: 1.8rem; font-weight: 700; color: ' + xirrColor + ';">' + Utils.formatXIRR(portfolioXIRR) + '</div>\
            <div class="text-xs text-muted mt-1">Annualized Return</div>\
          </div>\
          <div style="padding: 20px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1)); border-radius: var(--radius-lg); text-align: center;">\
            <div class="text-xs text-muted mb-1">Blended MOIC</div>\
            <div style="font-size: 1.8rem; font-weight: 700; color: ' + moicColor + ';">' + Utils.formatMOIC(blendedMoic) + '</div>\
            <div class="text-xs text-muted mt-1">Multiple on Invested</div>\
          </div>\
          <div style="padding: 20px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1)); border-radius: var(--radius-lg); text-align: center;">\
            <div class="text-xs text-muted mb-1">DPI</div>\
            <div style="font-size: 1.8rem; font-weight: 700; color: ' + dpiColor + ';">' + dpi.toFixed(2) + 'x</div>\
            <div class="text-xs text-muted mt-1">Distributions / Paid-In</div>\
          </div>\
          <div style="padding: 20px; background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.1)); border-radius: var(--radius-lg); text-align: center;">\
            <div class="text-xs text-muted mb-1">TVPI</div>\
            <div style="font-size: 1.8rem; font-weight: 700; color: ' + tvpiColor + ';">' + tvpi.toFixed(2) + 'x</div>\
            <div class="text-xs text-muted mt-1">Total Value / Paid-In</div>\
          </div>\
        </div>\
        <div class="grid grid-cols-2 gap-4">\
          <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg);">\
            <div class="text-sm text-muted mb-2">MOIC by Vintage Year</div>\
            <div style="height: 120px; position: relative;"><canvas id="moic-vintage-chart"></canvas></div>\
          </div>\
          <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg);">\
            <div class="text-sm text-muted mb-2">MOIC by Stage</div>\
            <div style="height: 120px; position: relative;"><canvas id="moic-stage-chart"></canvas></div>\
          </div>\
        </div>\
      </div>';
  }

  function initEvents() {
    var pageContent = document.getElementById('page-content');
    if (!pageContent) return;

    // Initialize Chart.js charts
    initCharts();

    // Filter change handlers
    var stageFilter = document.getElementById('analytics-filter-stage');
    var industryFilter = document.getElementById('analytics-filter-industry');
    var hqFilter = document.getElementById('analytics-filter-hq');
    var yearFilter = document.getElementById('analytics-filter-year');
    var statusFilter = document.getElementById('analytics-filter-status');
    var amountMinFilter = document.getElementById('analytics-filter-amount-min');
    var amountMaxFilter = document.getElementById('analytics-filter-amount-max');
    var resetBtn = document.getElementById('analytics-reset-filters');

    function updateFiltersAndRender() {
      if (stageFilter) filters.stage = stageFilter.value;
      if (industryFilter) filters.industry = industryFilter.value;
      if (hqFilter) filters.hq = hqFilter.value;
      if (yearFilter) filters.year = yearFilter.value;
      if (statusFilter) filters.status = statusFilter.value;
      if (amountMinFilter) filters.amountMin = amountMinFilter.value;
      if (amountMaxFilter) filters.amountMax = amountMaxFilter.value;

      pageContent.innerHTML = render();
      initEvents(); // Re-attach events and re-init charts after re-render
    }

    if (stageFilter) {
      stageFilter.addEventListener('change', updateFiltersAndRender);
    }
    if (industryFilter) {
      industryFilter.addEventListener('change', updateFiltersAndRender);
    }
    if (hqFilter) {
      hqFilter.addEventListener('change', updateFiltersAndRender);
    }
    if (yearFilter) {
      yearFilter.addEventListener('change', updateFiltersAndRender);
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', updateFiltersAndRender);
    }

    // Debounced input for amount filters
    var amountTimeout;
    function handleAmountChange() {
      clearTimeout(amountTimeout);
      amountTimeout = setTimeout(updateFiltersAndRender, 500);
    }

    if (amountMinFilter) {
      amountMinFilter.addEventListener('input', handleAmountChange);
    }
    if (amountMaxFilter) {
      amountMaxFilter.addEventListener('input', handleAmountChange);
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        resetFilters();
        pageContent.innerHTML = render();
        initEvents();
      });
    }

    // Save as Default button
    var saveDefaultsBtn = document.getElementById('analytics-save-defaults');
    if (saveDefaultsBtn) {
      saveDefaultsBtn.addEventListener('click', function () {
        if (saveFiltersAsDefault()) {
          alert('✅ Filter preferences saved as your default!');
        }
      });
    }
  }

  return {
    render: render,
    initEvents: initEvents,
    resetFilters: resetFilters
  };
})();
