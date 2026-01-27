// ============================================
// COMPONENTS MODULE - Global scope (no ES modules)
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Components = (function () {
  var Utils = FamilyOffice.Utils;
  var Data = FamilyOffice.Data;
  var icons = Utils.icons;

  function renderSidebar(currentPage) {
    // Check sync status for sidebar indicator
    var Supabase = FamilyOffice.Supabase;
    var syncEnabled = Supabase && Supabase.isSyncEnabled && Supabase.isSyncEnabled();
    var lastSync = Supabase && Supabase.getLastSyncTime ? Supabase.getLastSyncTime() : null;
    var syncIndicatorHtml = '';

    if (syncEnabled) {
      var syncTimeDisplay = lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never';
      syncIndicatorHtml = '\
        <div id="sync-indicator" class="sidebar-sync-indicator">\
          <span class="sync-status-icon">☁️</span>\
          <span class="sync-status-text">Synced</span>\
          <span class="sync-time">' + syncTimeDisplay + '</span>\
        </div>';
    }

    return '\
      <div class="sidebar-logo">\
        <a href="#dashboard" data-page="dashboard" style="display: flex; align-items: center; gap: 12px; text-decoration: none;">\
          <img src="assets/logo.png" alt="Dholakia Ventures" style="height: 32px; width: auto;" />\
        </a>\
      </div>\
      <nav class="sidebar-nav">\
        <a href="#dashboard" class="sidebar-nav-item ' + (currentPage === 'dashboard' ? 'active' : '') + '" data-page="dashboard">\
          ' + icons.dashboard + '\
          <span class="sidebar-label">Dashboard</span>\
        </a>\
        <a href="#portfolio" class="sidebar-nav-item ' + (currentPage === 'portfolio' ? 'active' : '') + '" data-page="portfolio">\
          ' + icons.portfolio + '\
          <span class="sidebar-label">Portfolio</span>\
        </a>\
        <a href="#analytics" class="sidebar-nav-item ' + (currentPage === 'analytics' ? 'active' : '') + '" data-page="analytics">\
          ' + icons.analytics + '\
          <span class="sidebar-label">Analytics</span>\
        </a>\
        <a href="#funds" class="sidebar-nav-item ' + (currentPage === 'funds' ? 'active' : '') + '" data-page="funds">\
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>\
          <span class="sidebar-label">Funds</span>\
        </a>\
        <a href="#legal" class="sidebar-nav-item ' + (currentPage === 'legal' ? 'active' : '') + '" data-page="legal">\
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>\
          <span class="sidebar-label">Legal</span>\
        </a>\
        <a href="#founders" class="sidebar-nav-item ' + (currentPage === 'founders' ? 'active' : '') + '" data-page="founders">\
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>\
          <span class="sidebar-label">Founders</span>\
        </a>\
        <a href="#settings" class="sidebar-nav-item ' + (currentPage === 'settings' ? 'active' : '') + '" data-page="settings">\
          ' + icons.settings + '\
          <span class="sidebar-label">Settings</span>\
        </a>\
      </nav>\
      <div class="sidebar-footer">\
        ' + syncIndicatorHtml + '\
      </div>';
  }

  function renderHeader(title, showAddButton) {
    var currentCurrency = Utils.getCurrency();
    return '\
      <h1 class="header-title">' + title + '</h1>\
      <div class="header-actions">\
        <div class="currency-toggle">\
          <button class="btn btn-sm ' + (currentCurrency === 'INR' ? 'btn-primary' : 'btn-secondary') + '" id="currency-inr">₹ INR</button>\
          <button class="btn btn-sm ' + (currentCurrency === 'USD' ? 'btn-primary' : 'btn-secondary') + '" id="currency-usd">$ USD</button>\
        </div>\
        ' + (FamilyOffice.Users ? FamilyOffice.Users.renderUserSwitcher() : '') + '\
        ' + (showAddButton ? '\
        <div class="dropdown" id="import-dropdown">\
          <button class="btn btn-secondary dropdown-toggle" id="import-csv-btn">\
            📥 Import CSV ▾\
          </button>\
          <div class="dropdown-menu" id="import-dropdown-menu">\
            <a class="dropdown-item" id="import-companies-btn">📊 Import Companies</a>\
            <a class="dropdown-item" id="import-followons-btn">📈 Import Follow-on Rounds</a>\
          </div>\
        </div>\
        <button class="btn btn-primary" id="add-company-btn">\
          ' + icons.plus + '\
          <span>Add Company</span>\
        </button>' : '') + '\
      </div>';
  }

  function renderStatCard(opts) {
    return '\
      <div class="card stat-card animate-slideUp">\
        <div class="stat-card-icon ' + opts.iconClass + '">' + opts.icon + '</div>\
        <div class="stat-card-value">' + opts.value + '</div>\
        <div class="stat-card-label">' + opts.label + '</div>\
        ' + (opts.change ? '\
        <div class="stat-card-change ' + (opts.changeType || '') + '">\
          ' + (opts.changeType === 'positive' ? icons.arrowUp : '') + '\
          ' + opts.change + '\
        </div>' : '') + '\
      </div>';
  }

  // Helper function to calculate total invested from initial + all follow-ons
  function calculateTotalInvested(company) {
    var total = company.initialInvestment || 0;
    if (company.followOns && company.followOns.length > 0) {
      company.followOns.forEach(function (fo) {
        if (fo.didWeInvest && fo.ourInvestment) {
          total += fo.ourInvestment;
        }
      });
    }
    return total;
  }

  function renderCompanyCard(company) {
    var avatarColor = Utils.getAvatarColor(company.name);
    var totalInvested = calculateTotalInvested(company);
    return '\
      <div class="company-card" data-company-id="' + company.id + '">\
        <div class="company-card-header">\
          <div class="company-avatar" style="background: ' + avatarColor.bg + '; color: ' + avatarColor.text + '">\
            ' + Utils.getInitials(company.name) + '\
          </div>\
          <div>\
            <div class="company-card-name">' + company.name + '</div>\
            <div class="company-card-industry">' + company.industry + ' • ' + company.hq + '</div>\
          </div>\
        </div>\
        <div class="company-card-meta">\
          <span class="company-card-tag">' + company.dealSourcer + '</span>\
          <span class="company-card-investment">' + Utils.formatCurrency(totalInvested) + '</span>\
        </div>\
      </div>';
  }

  function renderStageColumn(stage, companies) {
    var stageClass = stage.toLowerCase().replace(/[&]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-');
    var cards = companies.map(function (c) { return renderCompanyCard(c); }).join('');
    return '\
      <div class="stage-column stage-' + stageClass + '">\
        <div class="stage-column-header">\
          <div class="stage-column-title">\
            <span class="stage-dot"></span>\
            ' + stage + '\
          </div>\
          <span class="stage-column-count">' + companies.length + '</span>\
        </div>\
        <div class="stage-column-content">\
          ' + cards + '\
        </div>\
      </div>';
  }

  function renderTableRow(company) {
    var avatarColor = Utils.getAvatarColor(company.name);
    var currentStage = company.currentStage || company.entryStage || '-';
    var status = company.status || 'Active';
    return '\
      <tr data-company-id="' + company.id + '" class="table-row-clickable">\
        <td>\
          <div class="table-company-cell">\
            <div class="company-avatar" style="background: ' + avatarColor.bg + '; color: ' + avatarColor.text + '; width: 32px; height: 32px; font-size: 12px;">\
              ' + Utils.getInitials(company.name) + '\
            </div>\
            <div>\
              <div style="font-weight: 500;">' + company.name + '</div>\
              <div class="text-xs text-muted">' + (company.industry || '-') + '</div>\
            </div>\
          </div>\
        </td>\
        <td>' + (company.hq || '-') + '</td>\
        <td><span class="badge ' + Utils.getStageBadgeClass(currentStage) + '">' + currentStage + '</span></td>\
        <td>' + Utils.formatCurrency(company.totalInvested || 0) + '</td>\
        <td>' + Utils.formatCurrency(company.latestValuation || 0) + '</td>\
        <td>' + Utils.formatPercent(company.ownership || 0) + '</td>\
        <td>' + (company.dealSourcer || '-') + '</td>\
        <td>' + (company.analyst || '-') + '</td>\
        <td>\
          <div class="flex items-center gap-2">\
            <span class="status-dot ' + Utils.getStatusClass(status) + '"></span>\
            ' + status + '\
          </div>\
        </td>\
        <td>\
          <div class="flex gap-1">\
            <button class="btn btn-ghost btn-icon edit-btn" data-id="' + company.id + '" title="Edit">' + icons.edit + '</button>\
            <button class="btn btn-ghost btn-icon delete-btn" data-id="' + company.id + '" title="Delete">' + icons.trash + '</button>\
          </div>\
        </td>\
      </tr>';
  }

  function renderCompanyTable(companies) {
    var rows = companies.map(function (c) { return renderTableRow(c); }).join('');
    return '\
      <div class="table-container">\
        <div style="overflow-x: auto;">\
          <table class="table">\
            <thead>\
              <tr>\
                <th>Company</th>\
                <th>HQ</th>\
                <th>Stage</th>\
                <th>Invested</th>\
                <th>Valuation</th>\
                <th>Ownership</th>\
                <th>Deal Sourcer</th>\
                <th>Analyst</th>\
                <th>Status</th>\
                <th>Actions</th>\
              </tr>\
            </thead>\
            <tbody>' + rows + '</tbody>\
          </table>\
        </div>\
      </div>';
  }

  function renderFilterBar(filters) {
    filters = filters || {};
    var industryOptions = Data.getAllIndustries().map(function (ind) {
      return '<option value="' + ind + '" ' + (filters.industry === ind ? 'selected' : '') + '>' + ind + '</option>';
    }).join('');
    var stageOptions = Data.STAGES.map(function (stage) {
      return '<option value="' + stage + '" ' + (filters.stage === stage ? 'selected' : '') + '>' + stage + '</option>';
    }).join('');
    var statusOptions = Data.STATUSES.map(function (status) {
      return '<option value="' + status + '" ' + (filters.status === status ? 'selected' : '') + '>' + status + '</option>';
    }).join('');
    var memberOptions = Data.getAllTeamMembers().map(function (member) {
      return '<option value="' + member + '" ' + (filters.dealSourcer === member ? 'selected' : '') + '>' + member + '</option>';
    }).join('');

    return '\
      <div class="filter-bar">\
        <div class="filter-group">\
          <label class="filter-label">Industry:</label>\
          <select class="filter-select" id="filter-industry">\
            <option value="all">All Industries</option>\
            ' + industryOptions + '\
          </select>\
        </div>\
        <div class="filter-group">\
          <label class="filter-label">Stage:</label>\
          <select class="filter-select" id="filter-stage">\
            <option value="all">All Stages</option>\
            ' + stageOptions + '\
          </select>\
        </div>\
        <div class="filter-group">\
          <label class="filter-label">Status:</label>\
          <select class="filter-select" id="filter-status">\
            <option value="all">All Statuses</option>\
            ' + statusOptions + '\
          </select>\
        </div>\
        <div class="filter-group">\
          <label class="filter-label">Deal Sourcer:</label>\
          <select class="filter-select" id="filter-deal-sourcer">\
            <option value="all">All</option>\
            ' + memberOptions + '\
          </select>\
        </div>\
        <div class="filter-search">\
          <input type="text" id="filter-search" placeholder="Search..." value="' + (filters.search || '') + '">\
        </div>\
      </div>';
  }

  function renderViewToggle(currentView) {
    return '\
      <div class="tabs">\
        <button class="tab ' + (currentView === 'board' ? 'active' : '') + '" data-view="board">\
          ' + icons.board + ' Board\
        </button>\
        <button class="tab ' + (currentView === 'table' ? 'active' : '') + '" data-view="table">\
          ' + icons.table + ' Table\
        </button>\
      </div>';
  }

  function renderModal(title, content, footer) {
    return '\
      <div class="modal-overlay" id="modal-overlay">\
        <div class="modal modal-lg">\
          <div class="modal-header">\
            <h2 class="modal-title">' + title + '</h2>\
            <button class="modal-close" id="modal-close">' + icons.close + '</button>\
          </div>\
          <div class="modal-body">' + content + '</div>\
          ' + (footer ? '<div class="modal-footer">' + footer + '</div>' : '') + '\
        </div>\
      </div>';
  }

  // Helper function to render follow-ons list for the form
  function renderFollowOnsList(followOns) {
    if (!followOns || followOns.length === 0) {
      return '<div class="text-muted text-sm" style="padding: var(--space-2);">No follow-on rounds yet</div>';
    }
    return followOns.map(function (f, index) {
      var investmentAmount = f.ourInvestment || f.amount || 0;
      var didInvest = f.didWeInvest !== undefined ? f.didWeInvest : true;
      var statusBadge = didInvest ?
        '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">✓ Invested</span>' :
        '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">✗ Passed</span>';

      return '\
        <div class="follow-on-item" data-index="' + index + '" style="padding: var(--space-3); margin-bottom: var(--space-2); background: var(--color-bg-tertiary); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">\
          <div style="flex: 1;">\
            <div class="flex items-center gap-2 mb-1">\
              <span class="badge ' + Utils.getStageBadgeClass(f.round) + '">' + f.round + '</span>\
              <span class="text-muted text-sm">' + Utils.formatDate(f.date) + '</span>\
              ' + statusBadge + '\
            </div>\
            <div class="text-sm">\
              ' + (didInvest && investmentAmount > 0 ? '<span style="color: var(--color-accent-tertiary); font-weight: 500;">' + Utils.formatCurrency(investmentAmount) + '</span>' : '') + '\
              ' + (f.roundValuation ? '<span class="text-muted"> • Val: ' + Utils.formatCurrency(f.roundValuation) + '</span>' : '') + '\
              ' + (f.ownershipAfter !== undefined ? '<span class="text-muted"> • Own: ' + f.ownershipAfter.toFixed(2) + '%</span>' : '') + '\
            </div>\
          </div>\
          <div style="display: flex; gap: 4px;">\
            <button type="button" class="btn btn-ghost btn-sm edit-followon-btn" data-index="' + index + '" title="Edit">' + icons.edit + '</button>\
            <button type="button" class="btn btn-ghost btn-sm delete-followon-btn" data-index="' + index + '" title="Delete">' + icons.trash + '</button>\
          </div>\
        </div>';
    }).join('');
  }

  function renderCompanyForm(company) {
    company = company || {};

    // Use dynamic getters for industries, team members, and HQ locations
    var allIndustries = Data.getAllIndustries();
    var allTeamMembers = Data.getAllTeamMembers();
    var allHQLocations = Data.getAllHQLocations();

    var industryOptions = allIndustries.map(function (ind) {
      var isCustom = Data.isCustomIndustry(ind);
      return '<option value="' + ind + '" ' + (company.industry === ind ? 'selected' : '') + '>' + ind + (isCustom ? ' ✓' : '') + '</option>';
    }).join('');

    var hqOptions = allHQLocations.map(function (loc) {
      var isCustom = Data.isCustomHQLocation(loc);
      return '<option value="' + loc + '" ' + (company.hq === loc ? 'selected' : '') + '>' + loc + (isCustom ? ' ✓' : '') + '</option>';
    }).join('');

    var sourcerOptions = allTeamMembers.map(function (member) {
      var isCustom = Data.isCustomTeamMember(member);
      return '<option value="' + member + '" ' + (company.dealSourcer === member ? 'selected' : '') + '>' + member + (isCustom ? ' ✓' : '') + '</option>';
    }).join('');

    var analystOptions = allTeamMembers.map(function (member) {
      var isCustom = Data.isCustomTeamMember(member);
      return '<option value="' + member + '" ' + (company.analyst === member ? 'selected' : '') + '>' + member + (isCustom ? ' ✓' : '') + '</option>';
    }).join('');

    var stageOptions = Data.STAGES.map(function (stage) {
      return '<option value="' + stage + '" ' + (company.entryStage === stage ? 'selected' : '') + '>' + stage + '</option>';
    }).join('');
    var currentStageOptions = Data.STAGES.map(function (stage) {
      return '<option value="' + stage + '" ' + (company.currentStage === stage ? 'selected' : '') + '>' + stage + '</option>';
    }).join('');
    var statusOptions = Data.STATUSES.map(function (status) {
      var isSelected = company.status ? (company.status === status) : (status === 'Active');
      return '<option value="' + status + '" ' + (isSelected ? 'selected' : '') + '>' + status + '</option>';
    }).join('');

    return '\
      <form id="company-form">\
        <div class="form-row">\
          <div class="form-group">\
            <label class="form-label">Company Name *</label>\
            <input type="text" class="form-input" name="name" value="' + (company.name || '') + '" required>\
          </div>\
          <div class="form-group">\
            <label class="form-label">Industry * <button type="button" class="btn-add-new" id="add-industry-btn" title="Add new">+ Add</button></label>\
            <select class="form-select" name="industry" id="industry-select" required>\
              <option value="">Select Industry</option>\
              ' + industryOptions + '\
            </select>\
            <div class="add-new-input" id="add-industry-input" style="display: none;">\
              <input type="text" class="form-input" id="new-industry-name" placeholder="New industry name">\
              <button type="button" class="btn btn-sm btn-primary" id="save-industry-btn">Add</button>\
              <button type="button" class="btn btn-sm btn-secondary" id="cancel-industry-btn">Cancel</button>\
            </div>\
          </div>\
        </div>\
        <div class="form-row">\
          <div class="form-group">\
            <label class="form-label">HQ Location * <button type="button" class="btn-add-new" id="add-hq-btn" title="Add new">+ Add</button></label>\
            <select class="form-select" name="hq" id="hq-select" required>\
              <option value="">Select Location</option>\
              ' + hqOptions + '\
            </select>\
            <div class="add-new-input" id="add-hq-input" style="display: none;">\
              <input type="text" class="form-input" id="new-hq-name" placeholder="New HQ location">\
              <button type="button" class="btn btn-sm btn-primary" id="save-hq-btn">Add</button>\
              <button type="button" class="btn btn-sm btn-secondary" id="cancel-hq-btn">Cancel</button>\
            </div>\
          </div>\
          <div class="form-group">\
            <label class="form-label">Deal Sourcer * <button type="button" class="btn-add-new" id="add-sourcer-btn" title="Add new">+ Add</button></label>\
            <select class="form-select" name="dealSourcer" id="sourcer-select" required>\
              <option value="">Select Deal Sourcer</option>\
              ' + sourcerOptions + '\
            </select>\
            <div class="add-new-input" id="add-sourcer-input" style="display: none;">\
              <input type="text" class="form-input" id="new-sourcer-name" placeholder="New team member name">\
              <button type="button" class="btn btn-sm btn-primary" id="save-sourcer-btn">Add</button>\
              <button type="button" class="btn btn-sm btn-secondary" id="cancel-sourcer-btn">Cancel</button>\
            </div>\
          </div>\
        </div>\
        <div class="form-row">\
          <div class="form-group">\
            <label class="form-label">Analyst * <button type="button" class="btn-add-new" id="add-analyst-btn" title="Add new team member">+ Add</button></label>\
            <select class="form-select" name="analyst" id="analyst-select" required>\
              <option value="">Select Analyst</option>\
              ' + analystOptions + '\
            </select>\
            <div class="add-new-input" id="add-analyst-input" style="display: none;">\
              <input type="text" class="form-input" id="new-analyst-name" placeholder="New team member name">\
              <button type="button" class="btn btn-sm btn-primary" id="save-analyst-btn">Add</button>\
              <button type="button" class="btn btn-sm btn-secondary" id="cancel-analyst-btn">Cancel</button>\
            </div>\
          </div>\
          <div class="form-group">\
            <label class="form-label">Entry Date *</label>\
            <input type="date" class="form-input" name="entryDate" value="' + (company.entryDate || '') + '" required>\
          </div>\
        </div>\
        <div class="form-row">\
          <div class="form-group">\
            <label class="form-label">Entry Stage *</label>\
            <select class="form-select" name="entryStage" required>\
              <option value="">Select Stage</option>\
              ' + stageOptions + '\
            </select>\
          </div>\
          <div class="form-group">\
            <label class="form-label">Current Stage *</label>\
            <select class="form-select" name="currentStage" required>\
              <option value="">Select Stage</option>\
              ' + currentStageOptions + '\
              <option value="Exited" ' + (company.currentStage === 'Exited' ? 'selected' : '') + '>Exited</option>\
            </select>\
          </div>\
        </div>\
        <div class="form-row">\
          <div class="form-group">\
            <label class="form-label">Initial Investment (₹) *</label>\
            <input type="number" class="form-input" name="initialInvestment" value="' + (company.initialInvestment || '') + '" min="0" step="1" required>\
          </div>\
          <div class="form-group">\
            <label class="form-label">Latest Valuation (₹)</label>\
            <input type="number" class="form-input" name="latestValuation" value="' + (company.latestValuation || '') + '" min="0" step="1">\
          </div>\
        </div>\
        <div class="form-row">\
          <div class="form-group">\
            <label class="form-label">Current Ownership (%)</label>\
            <input type="number" class="form-input" name="ownership" value="' + (company.ownership || '') + '" min="0" max="100" step="0.001">\
          </div>\
          <div class="form-group">\
            <label class="form-label">Status *</label>\
            <select class="form-select" name="status" required>\
              ' + statusOptions + '\
            </select>\
          </div>\
        </div>\
        <div class="form-row" id="exit-fields-group" style="' + (company.status !== 'Exited' ? 'display: none;' : '') + '">\
          <div class="form-group">\
            <label class="form-label">Exit Date</label>\
            <input type="date" class="form-input" name="exitDate" value="' + (company.exitDate || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">Exit Value (₹)</label>\
            <input type="number" class="form-input" name="exitValue" value="' + (company.exitValue || '') + '" min="0" step="1">\
          </div>\
        </div>\
        \
        <!-- Follow-on Rounds Section -->\
        <div class="follow-on-section" style="margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">\
          <div class="flex justify-between items-center mb-4">\
            <label class="form-label" style="margin-bottom: 0;">Follow-on Rounds</label>\
            <button type="button" class="btn btn-sm btn-secondary" id="add-followon-btn">' + icons.plus + ' Add Round</button>\
          </div>\
          \
          <!-- Existing Follow-ons List -->\
          <div id="followons-list">' + renderFollowOnsList(company.followOns || []) + '</div>\
          <!-- Add Follow-on Form (hidden by default) -->\
          <div id="add-followon-form" class="card" style="display: none; padding: var(--space-4); margin-top: var(--space-3); background: var(--color-bg-tertiary);">\
            <h4 style="margin-bottom: var(--space-3);">Add Follow-on Round</h4>\
            \
            <!-- Row 1: Basic Round Info -->\
            <div class="form-row">\
              <div class="form-group">\
                <label class="form-label">Round Date <span style="color: #ef4444;">*</span></label>\
                <input type="date" class="form-input" id="followon-date">\
              </div>\
              <div class="form-group">\
                <label class="form-label">Round Stage <span style="color: #ef4444;">*</span></label>\
                <select class="form-select" id="followon-round">\
                  ' + Data.STAGES.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') + '\
                </select>\
              </div>\
            </div>\
            \
            <!-- Row 2: Our Participation -->\
            <div class="form-row">\
              <div class="form-group">\
                <label class="form-label">Did We Invest?</label>\
                <select class="form-select" id="followon-invested">\
                  <option value="true">Yes - We Invested</option>\
                  <option value="false">No - We Passed</option>\
                </select>\
              </div>\
              <div class="form-group">\
                <label class="form-label">Our Investment (₹)</label>\
                <input type="number" class="form-input" id="followon-our-investment" min="0" step="1" placeholder="0 if we passed">\
              </div>\
            </div>\
            \
            <!-- Row 3: Round Details -->\
            <div class="form-row">\
              <div class="form-group">\
                <label class="form-label">Total Round Raised (₹)</label>\
                <input type="number" class="form-input" id="followon-total-raised" min="0" step="1" placeholder="Total amount raised">\
              </div>\
              <div class="form-group">\
                <label class="form-label">Post-money Valuation (₹)</label>\
                <input type="number" class="form-input" id="followon-valuation" min="0" step="1" placeholder="Valuation after round">\
              </div>\
            </div>\
            \
            <!-- Ownership Entry Mode Toggle -->\
            <div style="margin: 20px 0 16px; padding: 16px; background: var(--color-bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--color-border);">\
              <div style="margin-bottom: 12px; font-weight: 600; font-size: 14px;">How do you want to enter ownership?</div>\
              <div style="display: flex; gap: 12px; margin-bottom: 12px;">\
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 16px; border-radius: var(--radius-md); border: 2px solid var(--color-accent-primary); background: rgba(139, 92, 246, 0.15); flex: 1;" id="ownership-mode-auto-label">\
                  <input type="radio" name="ownership-mode" value="auto" id="ownership-mode-auto" checked style="accent-color: var(--color-accent-primary);">\
                  <div>\
                    <div style="font-size: 13px; font-weight: 500;">🧮 Auto-Calculate</div>\
                    <div style="font-size: 11px; color: var(--color-text-muted);">Requires: Pre-money valuation</div>\
                  </div>\
                </label>\
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 16px; border-radius: var(--radius-md); border: 2px solid var(--color-border); background: transparent; flex: 1;" id="ownership-mode-manual-label">\
                  <input type="radio" name="ownership-mode" value="manual" id="ownership-mode-manual" style="accent-color: var(--color-accent-primary);">\
                  <div>\
                    <div style="font-size: 13px; font-weight: 500;">✏️ Manual Entry</div>\
                    <div style="font-size: 11px; color: var(--color-text-muted);">Enter known ownership %</div>\
                  </div>\
                </label>\
              </div>\
              \
              <!-- Auto-Calculate Section -->\
              <div id="ownership-auto-section">\
                <div class="form-row" style="margin-bottom: 0;">\
                  <div class="form-group" style="margin-bottom: 12px;">\
                    <label class="form-label">Pre-money Valuation (₹) <span style="color: #f59e0b;">★</span></label>\
                    <input type="number" class="form-input" id="followon-premoney" min="0" step="1" placeholder="Required for calculation">\
                  </div>\
                  <div class="form-group" style="display: flex; align-items: flex-end; margin-bottom: 12px;">\
                    <button type="button" class="btn btn-primary" id="calc-ownership-btn" style="width: 100%; height: 42px;">🧮 Calculate Ownership</button>\
                  </div>\
                </div>\
                <div id="ownership-breakdown" style="display: none; padding: 12px; background: var(--color-bg-tertiary); border-radius: var(--radius-md); margin-bottom: 12px; font-size: 13px;">\
                </div>\
                <div class="form-group" style="margin-bottom: 0;">\
                  <label class="form-label">Calculated Ownership (%)</label>\
                  <input type="number" class="form-input" id="followon-ownership" min="0" max="100" step="0.001" placeholder="Click Calculate" readonly style="background: var(--color-bg-tertiary); cursor: not-allowed;">\
                </div>\
              </div>\
              \
              <!-- Manual Entry Section (hidden by default) -->\
              <div id="ownership-manual-section" style="display: none;">\
                <div class="form-group" style="margin-bottom: 0;">\
                  <label class="form-label">Ownership After Round (%) <span style="color: #f59e0b;">★</span></label>\
                  <input type="number" class="form-input" id="followon-ownership-manual" min="0" max="100" step="0.001" placeholder="Enter ownership from records">\
                  <div class="text-xs text-muted" style="margin-top: 6px;">💡 Use this for historical data when you know the final ownership</div>\
                </div>\
              </div>\
            </div>\
            \
            <!-- Action Buttons -->\
            <div class="form-row" style="margin-top: 16px;">\
              <div class="form-group" style="display: flex; gap: var(--space-2); margin-bottom: 0;">\
                <button type="button" class="btn btn-primary" id="save-followon-btn">Add Round</button>\
                <button type="button" class="btn btn-secondary" id="cancel-followon-btn">Cancel</button>\
              </div>\
            </div>\
          </div>\
        </div>\
        \
        <!-- Founders Section -->\
        ' + renderFoundersFormSection(company) + '\
        \
        <div class="form-group" style="margin-top: var(--space-4);">\
          <label class="form-label">Notes</label>\
          <textarea class="form-textarea" name="notes" rows="3">' + (company.notes || '') + '</textarea>\
        </div>\
      </form>';
  }

  // Render founders selection section for company form
  function renderFoundersFormSection(company) {
    var allFounders = Data.getFounders ? Data.getFounders() : [];
    var linkedFounderIds = company && company.founderIds ? company.founderIds : [];

    var founderCheckboxes = allFounders.length > 0
      ? allFounders.map(function (f) {
        var isChecked = linkedFounderIds.indexOf(f.id) !== -1;
        return '\
            <label style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--color-bg-tertiary); border-radius: var(--radius-md); margin-bottom: 6px; cursor: pointer;">\
              <input type="checkbox" name="founderIds" value="' + f.id + '" ' + (isChecked ? 'checked' : '') + '>\
              <span style="font-weight: 500;">' + f.name + '</span>\
              <span class="text-xs text-muted">' + (f.role || 'Founder') + '</span>\
            </label>';
      }).join('')
      : '<p class="text-muted text-sm" style="margin-bottom: 12px;">No founders in database yet.</p>';

    return '\
      <div class="founders-form-section" style="margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">\
        <div class="flex justify-between items-center mb-4">\
          <label class="form-label" style="margin-bottom: 0;">👥 Founders</label>\
        </div>\
        <div style="max-height: 200px; overflow-y: auto; margin-bottom: 12px;">\
          ' + founderCheckboxes + '\
        </div>\
        <div class="add-new-input">\
          <div style="display: flex; gap: 8px;">\
            <input type="text" class="form-input" id="quick-add-founder-name" placeholder="Quick add: Enter founder name">\
            <button type="button" class="btn btn-sm btn-secondary" id="quick-add-founder-btn">+ Add</button>\
          </div>\
        </div>\
      </div>';
  }

  function renderCompanyDetail(company) {
    var avatarColor = Utils.getAvatarColor(company.name);

    // Calculate dynamic ownership history
    var ownershipHistory = Utils.calculateOwnershipHistory(company);
    var displayOwnership = ownershipHistory.currentOwnership || company.ownership || 0;

    // Calculate Total Invested = Initial + All Follow-on Investments
    var totalInvested = company.initialInvestment || 0;
    var followOns = company.followOns || [];
    followOns.forEach(function (fo) {
      if (fo.didWeInvest && fo.ourInvestment) {
        totalInvested += fo.ourInvestment;
      }
    });

    // Calculate Latest Valuation = Post-money from most recent round, or initial valuation
    var latestValuation = company.initialValuation || company.entryValuation || company.latestValuation || 0;
    if (followOns.length > 0) {
      // Sort by date and get the latest
      var sortedRounds = followOns.slice().sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });
      if (sortedRounds[0].roundValuation && sortedRounds[0].roundValuation > 0) {
        latestValuation = sortedRounds[0].roundValuation;
      }
    }

    var followOnsHtml = '';
    if (company.followOns && company.followOns.length > 0) {
      var followOnItems = ownershipHistory.rounds.map(function (roundData, index) {
        var f = company.followOns[index] || {};
        var investmentAmount = roundData.ourInvestment || 0;
        var didInvest = roundData.didWeInvest;
        var investedBadge = didInvest ?
          '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">✓ Invested</span>' :
          '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">✗ Passed</span>';

        // Build dilution breakdown
        var dilutionBreakdown = '';
        if (roundData.dilutionFactor > 0) {
          var dilutionPct = (roundData.dilutionFactor * 100).toFixed(2);
          var prevOwn = roundData.previousOwnership.toFixed(2);
          var dilutedOwn = roundData.dilutedOwnership.toFixed(2);

          dilutionBreakdown = '<div style="font-size: 11px; margin-top: 6px; padding: 6px 8px; background: var(--color-bg-secondary); border-radius: var(--radius-sm);">';

          if (roundData.isPassiveDilution) {
            // Passive dilution only
            dilutionBreakdown += '<div style="color: var(--color-text-muted);">📉 Passive Dilution</div>' +
              '<div>' + prevOwn + '% → <span style="color: #ef4444;">−' + dilutionPct + '%</span> → <strong>' + dilutedOwn + '%</strong></div>';
          } else {
            // Dilution + new stake
            var newStake = roundData.newStakeBought.toFixed(2);
            var finalOwn = roundData.finalOwnership.toFixed(2);
            dilutionBreakdown += '<div style="color: var(--color-text-muted);">📊 Ownership Change</div>' +
              '<div>Diluted: ' + prevOwn + '% × (1−' + dilutionPct + '%) = ' + dilutedOwn + '%</div>' +
              '<div>+ New stake: <span style="color: #10b981;">+' + newStake + '%</span></div>' +
              '<div style="font-weight: 600; color: var(--color-accent-tertiary);">= ' + finalOwn + '%</div>';
          }
          dilutionBreakdown += '</div>';
        }

        var detailsHtml = '';
        if (roundData.totalRaised) {
          detailsHtml += '<div class="text-xs text-muted">Round: ' + Utils.formatCurrency(roundData.totalRaised) + '</div>';
        }
        if (roundData.postMoney) {
          detailsHtml += '<div class="text-xs text-muted">Post-Money: ' + Utils.formatCurrency(roundData.postMoney) + '</div>';
        }

        return '\
          <div class="follow-on-item" style="padding: var(--space-3); margin-bottom: var(--space-2); background: var(--color-bg-tertiary); border-radius: var(--radius-md);">\
            <div class="flex justify-between mb-2">\
              <div>\
                <span class="badge ' + Utils.getStageBadgeClass(roundData.roundName) + '" style="margin-right: 8px;">' + roundData.roundName + '</span>\
                <span class="text-muted text-sm">' + Utils.formatDate(roundData.date) + '</span>\
              </div>\
              ' + investedBadge + '\
            </div>\
            <div class="flex justify-between">\
              <div>' + detailsHtml + '</div>\
              ' + (didInvest && investmentAmount > 0 ? '<div style="text-align: right;"><div class="text-xs text-muted">Our Investment</div><span style="color: var(--color-accent-tertiary); font-weight: 600;">' + Utils.formatCurrency(investmentAmount) + '</span></div>' : '') + '\
            </div>\
            ' + dilutionBreakdown + '\
          </div>';
      }).join('');

      // Add initial ownership info
      var initialOwnershipHtml = '<div style="padding: var(--space-3); margin-bottom: var(--space-2); background: var(--color-bg-secondary); border-radius: var(--radius-md);">' +
        '<div class="text-xs text-muted">📍 Initial Entry</div>' +
        '<div class="flex justify-between items-center mt-1">' +
        '<span>Entry Ownership</span>' +
        '<strong style="color: var(--color-accent-tertiary);">' + ownershipHistory.initialOwnership.toFixed(2) + '%</strong>' +
        '</div>' +
        '</div>';

      followOnsHtml = '\
        <div class="mt-6">\
          <h4 class="mb-4">Ownership Journey</h4>\
          ' + initialOwnershipHtml + '\
          ' + followOnItems + '\
        </div>';
    }

    return '\
      <div class="flex gap-6">\
        <div class="company-avatar" style="background: ' + avatarColor.bg + '; color: ' + avatarColor.text + '; width: 64px; height: 64px; font-size: 24px; flex-shrink: 0;">\
          ' + Utils.getInitials(company.name) + '\
        </div>\
        <div class="flex-1">\
          <h2 style="margin-bottom: 4px;">' + company.name + '</h2>\
          <p class="text-muted">' + company.industry + ' • ' + company.hq + '</p>\
          <div class="flex gap-2 mt-4">\
            <span class="badge ' + Utils.getStageBadgeClass(company.currentStage) + '">' + company.currentStage + '</span>\
            <span class="badge" style="background: rgba(255,255,255,0.1)">\
              <span class="status-dot ' + Utils.getStatusClass(company.status) + '"></span>\
              ' + company.status + '\
            </span>\
          </div>\
        </div>\
      </div>\
      <div class="grid grid-cols-3 gap-4 mt-6">\
        <div class="card" style="padding: var(--space-4);">\
          <div class="text-xs text-muted mb-1">Total Invested</div>\
          <div style="font-size: 1.25rem; font-weight: 600; color: var(--color-accent-tertiary);">' + Utils.formatCurrency(totalInvested) + '</div>\
          ' + (followOns.length > 0 ? '<div class="text-xs text-muted" style="margin-top: 4px;">Across ' + (followOns.filter(function (f) { return f.didWeInvest && f.ourInvestment > 0; }).length + 1) + ' round(s)</div>' : '') + '\
        </div>\
        <div class="card" style="padding: var(--space-4);">\
          <div class="text-xs text-muted mb-1">Latest Valuation</div>\
          <div style="font-size: 1.25rem; font-weight: 600;">' + Utils.formatCurrency(latestValuation) + '</div>\
          ' + (followOns.length > 0 ? '<div class="text-xs text-muted" style="margin-top: 4px;">Post-money (latest)</div>' : '<div class="text-xs text-muted" style="margin-top: 4px;">Entry valuation</div>') + '\
        </div>\
        <div class="card" style="padding: var(--space-4);">\
          <div class="text-xs text-muted mb-1">Current Ownership</div>\
          <div style="font-size: 1.25rem; font-weight: 600;">' + displayOwnership.toFixed(2) + '%</div>\
          ' + (company.followOns && company.followOns.length > 0 ? '<div class="text-xs text-muted" style="margin-top: 4px;">After ' + company.followOns.length + ' round(s)</div>' : '') + '\
        </div>\
      </div>\
      <div class="grid grid-cols-2 gap-4 mt-4">\
        <div>\
          <h4 class="mb-4">Investment Details</h4>\
          <div class="card" style="padding: var(--space-4);">\
            <div class="flex justify-between mb-2"><span class="text-muted">Entry Date</span><span>' + Utils.formatDate(company.entryDate) + '</span></div>\
            <div class="flex justify-between mb-2"><span class="text-muted">Entry Stage</span><span>' + company.entryStage + '</span></div>\
            <div class="flex justify-between mb-2"><span class="text-muted">Initial Investment</span><span>' + Utils.formatCurrency(company.initialInvestment) + '</span></div>\
            <div class="flex justify-between mb-2"><span class="text-muted">Last Investment</span><span>' + Utils.formatDate(company.lastInvestmentDate) + '</span></div>\
            ' + (company.status === 'Exited' ? '<div class="flex justify-between"><span class="text-muted">Exit Value</span><span style="color: var(--color-success);">' + Utils.formatCurrency(company.exitValue) + '</span></div>' : '') + '\
          </div>\
        </div>\
        <div>\
          <h4 class="mb-4">Team</h4>\
          <div class="card" style="padding: var(--space-4);">\
            <div class="flex justify-between mb-2"><span class="text-muted">Deal Sourcer</span><span>' + company.dealSourcer + '</span></div>\
            <div class="flex justify-between"><span class="text-muted">Analyst</span><span>' + company.analyst + '</span></div>\
          </div>\
        </div>\
      </div>\
      ' + renderFoundersSection(company.id) + '\
      ' + followOnsHtml + '\
      ' + renderLegalSection(company) + '\
      ' + (company.notes ? '<div class="mt-6"><h4 class="mb-4">Notes</h4><div class="card" style="padding: var(--space-4);"><p class="text-muted">' + company.notes + '</p></div></div>' : '');
  }

  // Render founders linked to a company
  function renderFoundersSection(companyId) {
    var founders = Data.getFoundersByCompany(companyId);
    if (!founders || founders.length === 0) {
      return '';
    }

    var foundersHtml = founders.map(function (f) {
      var avatarColor = Utils.getAvatarColor(f.name);
      var contactInfo = [];
      if (f.email) contactInfo.push('<a href="mailto:' + f.email + '" style="color: var(--color-accent-tertiary);">📧 ' + f.email + '</a>');
      if (f.mobile) contactInfo.push('<a href="tel:' + f.mobile + '" style="color: var(--color-accent-tertiary);">📱 ' + f.mobile + '</a>');
      if (f.linkedin) contactInfo.push('<a href="' + f.linkedin + '" target="_blank" style="color: var(--color-accent-tertiary);">🔗 LinkedIn</a>');

      return '\
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--color-bg-tertiary); border-radius: var(--radius-md); margin-bottom: 8px;">\
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ' + avatarColor.bg + '; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: ' + avatarColor.text + ';">' + Utils.getInitials(f.name) + '</div>\
          <div style="flex: 1;">\
            <div style="font-weight: 500;">' + f.name + '</div>\
            <div class="text-xs text-muted">' + (f.role || 'Founder') + (f.location ? ' • ' + f.location : '') + '</div>\
            ' + (contactInfo.length > 0 ? '<div class="text-xs" style="margin-top: 4px;">' + contactInfo.join(' &nbsp; ') + '</div>' : '') + '\
          </div>\
        </div>';
    }).join('');

    return '\
      <div class="mt-6">\
        <h4 class="mb-4">Founders</h4>\
        <div class="card" style="padding: var(--space-4);">\
          ' + foundersHtml + '\
        </div>\
      </div>';
  }

  // Render legal documents and rights section for a company
  function renderLegalSection(company) {
    // Document types
    var docTypes = ['SHA', 'Term Sheet', 'SSA', 'Due Diligence', 'Board Letters'];

    // Rights list for display
    var rightsLabels = {
      boardSeat: '🪑 Board Seat',
      observer: '👁️ Observer',
      boardComposition: '📋 Board Composition',
      preEmptive: '⚡ Pre-emptive',
      antiDilution: '🛡️ Anti-dilution',
      proRata: '➕ Pro-rata',
      rofr: '🔄 ROFR',
      tagAlong: '🏷️ Tag-along',
      dragAlong: '🔗 Drag-along',
      liquidationPref: '💰 Liquidation Pref',
      conversionRights: '🔃 Conversion',
      vestingSchedule: '📅 Vesting',
      informationRights: '📊 Info Rights'
    };

    // Initial round rights
    var initialRights = company.legalRights || {};
    var initialDocs = company.documents || [];

    // Build initial round section
    var initialRightsBadges = Object.keys(rightsLabels).filter(function (key) {
      return initialRights[key] && initialRights[key].enabled;
    }).map(function (key) {
      var detail = initialRights[key].details ? ' (' + initialRights[key].details + ')' : '';
      return '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; margin: 2px;">' + rightsLabels[key] + detail + '</span>';
    }).join('');

    var initialDocsHtml = initialDocs.length > 0 ? initialDocs.map(function (d) {
      return '<a href="' + d.url + '" target="_blank" class="btn btn-sm btn-ghost" style="margin: 2px;">📄 ' + d.type + '</a>';
    }).join('') : '<span class="text-muted text-sm">No documents linked</span>';

    var initialHtml = '\
      <div style="padding: 12px; background: var(--color-bg-tertiary); border-radius: var(--radius-md); margin-bottom: 12px;">\
        <div class="flex justify-between items-center mb-2">\
          <div class="flex items-center gap-2">\
            <span class="badge ' + Utils.getStageBadgeClass(company.entryStage) + '">' + company.entryStage + '</span>\
            <span class="text-sm text-muted">' + Utils.formatDate(company.entryDate) + ' • ' + Utils.formatCurrency(company.initialInvestment) + '</span>\
          </div>\
          <button class="btn btn-sm btn-ghost edit-legal-btn" data-round="initial" data-company-id="' + company.id + '">✏️ Edit</button>\
        </div>\
        <div style="margin-bottom: 8px;">\
          <div class="text-xs text-muted mb-1">Documents</div>\
          ' + initialDocsHtml + '\
        </div>\
        <div>\
          <div class="text-xs text-muted mb-1">Rights</div>\
          ' + (initialRightsBadges || '<span class="text-muted text-sm">No rights specified</span>') + '\
        </div>\
      </div>';

    // Follow-on rounds
    var followOnsLegalHtml = '';
    if (company.followOns && company.followOns.length > 0) {
      followOnsLegalHtml = company.followOns.map(function (fo, idx) {
        var foRights = fo.legalRights || {};
        var foDocs = fo.documents || [];

        var foBadges = Object.keys(rightsLabels).filter(function (key) {
          return foRights[key] && foRights[key].enabled;
        }).map(function (key) {
          var detail = foRights[key].details ? ' (' + foRights[key].details + ')' : '';
          return '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; margin: 2px;">' + rightsLabels[key] + detail + '</span>';
        }).join('');

        var foDocsHtml = foDocs.length > 0 ? foDocs.map(function (d) {
          return '<a href="' + d.url + '" target="_blank" class="btn btn-sm btn-ghost" style="margin: 2px;">📄 ' + d.type + '</a>';
        }).join('') : '<span class="text-muted text-sm">No documents</span>';

        return '\
          <div style="padding: 12px; background: var(--color-bg-tertiary); border-radius: var(--radius-md); margin-bottom: 12px;">\
            <div class="flex justify-between items-center mb-2">\
              <div class="flex items-center gap-2">\
                <span class="badge ' + Utils.getStageBadgeClass(fo.round) + '">' + fo.round + '</span>\
                <span class="text-sm text-muted">' + Utils.formatDate(fo.date) + '</span>\
              </div>\
              <button class="btn btn-sm btn-ghost edit-legal-btn" data-round="' + idx + '" data-company-id="' + company.id + '">✏️ Edit</button>\
            </div>\
            <div style="margin-bottom: 8px;">\
              <div class="text-xs text-muted mb-1">Documents</div>\
              ' + foDocsHtml + '\
            </div>\
            <div>\
              <div class="text-xs text-muted mb-1">Rights</div>\
              ' + (foBadges || '<span class="text-muted text-sm">No rights specified</span>') + '\
            </div>\
          </div>';
      }).join('');
    }

    return '\
      <div class="mt-6">\
        <h4 class="mb-4">📜 Legal Documents & Rights</h4>\
        ' + initialHtml + '\
        ' + followOnsLegalHtml + '\
      </div>';
  }

  // Render modal to edit legal documents and rights for a round
  function renderLegalEditModal(company, roundType, roundIndex, existingDocs, existingRights) {
    var docTypes = ['SHA', 'Term Sheet', 'SSA', 'Due Diligence', 'Board Letters'];
    var rights = existingRights || {};
    var docs = existingDocs || [];

    var roundLabel = roundType === 'initial' ? company.entryStage + ' (Initial)' :
      (company.followOns && company.followOns[roundIndex] ? company.followOns[roundIndex].round : 'Follow-on');

    var docsListHtml = docs.map(function (d, i) {
      return '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--color-bg-tertiary); border-radius: 6px; margin-bottom: 4px;">\
        <span>📄 ' + d.type + '</span>\
        <div style="display: flex; gap: 8px;">\
          <a href="' + d.url + '" target="_blank" class="btn btn-ghost btn-sm">Open</a>\
          <button type="button" class="btn btn-ghost btn-sm delete-doc-btn" data-index="' + i + '">🗑️</button>\
        </div>\
      </div>';
    }).join('') || '<div class="text-sm text-muted">No documents linked</div>';

    var rightsFields = [
      { key: 'boardSeat', label: 'Board Seat', ph: '1 board seat' },
      { key: 'observer', label: 'Observer Rights', ph: '1 observer' },
      { key: 'boardComposition', label: 'Board Composition', ph: 'Investor appoints 2 of 5' },
      { key: 'preEmptive', label: 'Pre-emptive Rights', ph: 'Pro-rata participation' },
      { key: 'antiDilution', label: 'Anti-dilution', ph: 'Weighted Average' },
      { key: 'proRata', label: 'Pro-rata Rights', ph: 'Maintain ownership %' },
      { key: 'rofr', label: 'ROFR', ph: 'On secondary sales' },
      { key: 'tagAlong', label: 'Tag-along', ph: 'If founders sell >50%' },
      { key: 'dragAlong', label: 'Drag-along', ph: 'On exit >75% approval' },
      { key: 'liquidationPref', label: 'Liquidation Pref', ph: '1x Non-participating' },
      { key: 'conversionRights', label: 'Conversion', ph: 'Voluntary to common' },
      { key: 'vestingSchedule', label: 'Vesting', ph: '4yr, 1yr cliff' },
      { key: 'informationRights', label: 'Info Rights', ph: 'Quarterly financials' }
    ];

    var rightsHtml = rightsFields.map(function (rf) {
      var r = rights[rf.key] || { enabled: false, details: '' };
      return '<div style="margin-bottom: 8px; padding: 8px; background: var(--color-bg-tertiary); border-radius: 6px;">\
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">\
            <input type="checkbox" id="right-' + rf.key + '" name="' + rf.key + '-enabled" ' + (r.enabled ? 'checked' : '') + '>\
            <label for="right-' + rf.key + '" style="font-weight: 500; font-size: 13px;">' + rf.label + '</label>\
          </div>\
          <input type="text" class="form-input" name="' + rf.key + '-details" value="' + (r.details || '') + '" placeholder="' + rf.ph + '" style="font-size: 12px; padding: 6px;">\
        </div>';
    }).join('');

    return '\
      <div class="modal-overlay" id="legal-edit-modal">\
        <div class="modal" style="max-width: 550px; max-height: 85vh; overflow-y: auto;">\
          <div class="modal-header">\
            <h2 class="modal-title">Edit Legal - ' + roundLabel + '</h2>\
            <button class="modal-close" id="close-legal-modal">&times;</button>\
          </div>\
          <div class="modal-body">\
            <input type="hidden" id="legal-round-type" value="' + roundType + '">\
            <input type="hidden" id="legal-round-index" value="' + roundIndex + '">\
            <input type="hidden" id="legal-company-id" value="' + company.id + '">\
            <div style="margin-bottom: 20px;">\
              <div class="flex justify-between items-center mb-2">\
                <h4 style="margin: 0;">📄 Documents</h4>\
                <button type="button" class="btn btn-sm btn-secondary" id="add-doc-btn">+ Add</button>\
              </div>\
              <div id="docs-list">' + docsListHtml + '</div>\
              <div id="add-doc-form" style="display: none; padding: 10px; background: var(--color-bg-secondary); border-radius: 6px; margin-top: 8px;">\
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">\
                  <select class="form-select" id="new-doc-type" style="width: 130px;">\
                    ' + docTypes.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') + '\
                  </select>\
                  <input type="url" class="form-input" id="new-doc-url" placeholder="Paste URL or upload file below..." style="flex: 1;">\
                </div>\
                <div style="margin-bottom: 8px;">\
                  <input type="file" id="new-doc-file" accept=".pdf,.doc,.docx,.xls,.xlsx" style="font-size: 12px; width: 100%;">\
                  <div class="text-xs text-muted" style="margin-top: 4px;">Or upload file (PDF, DOC, DOCX, XLS) - Max 10MB</div>\
                </div>\
                <div id="upload-status" style="display: none; margin-bottom: 8px; padding: 8px; border-radius: 4px;"></div>\
                <button type="button" class="btn btn-sm btn-primary" id="save-doc-btn">Add</button>\
                <button type="button" class="btn btn-sm btn-ghost" id="cancel-doc-btn">Cancel</button>\
              </div>\
            </div>\
            <div>\
              <h4 style="margin-bottom: 12px;">⚖️ Rights</h4>\
              ' + rightsHtml + '\
              <div style="margin-top: 12px;">\
                <label class="form-label">Custom Terms</label>\
                <textarea class="form-textarea" id="custom-terms" rows="2" style="font-size: 12px;">' + (rights.customTerms || '') + '</textarea>\
              </div>\
            </div>\
          </div>\
          <div class="modal-footer">\
            <button class="btn btn-secondary" id="cancel-legal-modal">Cancel</button>\
            <button class="btn btn-primary" id="save-legal-btn">Save</button>\
          </div>\
        </div>\
      </div>';
  }

  function renderConfirmDialog(title, message) {
    return '\
      <div class="modal-overlay" id="confirm-overlay">\
        <div class="modal" style="max-width: 400px;">\
          <div class="modal-header">\
            <h2 class="modal-title">' + title + '</h2>\
            <button class="modal-close" id="confirm-close">' + icons.close + '</button>\
          </div>\
          <div class="modal-body"><p class="text-muted">' + message + '</p></div>\
          <div class="modal-footer">\
            <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>\
            <button class="btn btn-danger" id="confirm-ok">Delete</button>\
          </div>\
        </div>\
      </div>';
  }

  function renderEmptyState(icon, title, description, buttonText, buttonId) {
    return '\
      <div class="empty-state">\
        <div class="empty-state-icon">' + icon + '</div>\
        <h3 class="empty-state-title">' + title + '</h3>\
        <p class="empty-state-description">' + description + '</p>\
        ' + (buttonText ? '<button class="btn btn-primary" id="' + buttonId + '">' + icons.plus + ' ' + buttonText + '</button>' : '') + '\
      </div>';
  }

  function renderManageOptionsModal(type, items, isCustomFn, title) {
    var itemsList = items.map(function (item) {
      var isCustom = isCustomFn(item);
      return '\
        <div class="manage-option-item">\
          <span>' + item + (isCustom ? ' <span class="text-xs text-muted">(custom)</span>' : '') + '</span>\
          <button type="button" class="btn btn-sm btn-danger remove-option-btn" data-type="' + type + '" data-name="' + item + '">Remove</button>\
        </div>';
    }).join('');

    return '\
      <div class="modal-overlay" id="manage-options-overlay">\
        <div class="modal" style="max-width: 500px;">\
          <div class="modal-header">\
            <h2 class="modal-title">' + title + '</h2>\
            <button class="modal-close" id="manage-options-close">' + icons.close + '</button>\
          </div>\
          <div class="modal-body">\
            <p class="text-muted mb-4">Click "Remove" to hide an option from the dropdown. You can re-add it anytime using "+ Add".</p>\
            <div class="manage-options-list">' + itemsList + '</div>\
          </div>\
          <div class="modal-footer">\
            <button class="btn btn-primary" id="manage-options-done">Done</button>\
          </div>\
        </div>\
      </div>';
  }

  // ============================================
  // SETTINGS PAGE COMPONENTS
  // ============================================

  function renderSettingsItem(name, usageCount, type, isCustom) {
    var usageText = usageCount === 1 ? '1 company' : usageCount + ' companies';
    return '\
      <div class="settings-item">\
        <div class="settings-item-info">\
          <span class="settings-item-name">' + name + (isCustom ? ' <span class="badge badge-custom">Custom</span>' : '') + '</span>\
          <span class="settings-item-usage">' + usageText + '</span>\
        </div>\
        <button class="btn btn-sm btn-ghost remove-settings-item" data-type="' + type + '" data-name="' + name + '">\
          Remove\
        </button>\
      </div>';
  }

  function renderSettingsSection(title, type, items, getUsageCount, isCustomFn) {
    var itemsHtml = items.map(function (name) {
      var usage = getUsageCount(name);
      var isCustom = isCustomFn(name);
      return renderSettingsItem(name, usage, type, isCustom);
    }).join('');

    var inputId = 'new-' + type + '-name-settings';
    var addInputId = 'add-' + type + '-input';
    var addBtnId = 'add-' + type + '-settings-btn';
    var saveBtnId = 'save-' + type + '-settings-btn';

    return '\
      <div class="settings-section">\
        <div class="settings-section-header">\
          <h3 class="settings-section-title">' + title + '</h3>\
          <span class="settings-section-count">' + items.length + ' items</span>\
        </div>\
        <div class="settings-section-content">\
          ' + (items.length > 0 ? itemsHtml : '<div class="settings-empty">No items configured</div>') + '\
        </div>\
        <div class="settings-section-footer">\
          <button class="btn btn-sm btn-secondary" id="' + addBtnId + '">\
            <span class="btn-icon">+</span> Add New\
          </button>\
          <div class="settings-add-input" id="' + addInputId + '" style="display: none;">\
            <input type="text" class="form-input" id="' + inputId + '" placeholder="Enter name...">\
            <button class="btn btn-sm btn-primary" id="' + saveBtnId + '">Add</button>\
            <button class="btn btn-sm btn-ghost cancel-add-btn">Cancel</button>\
          </div>\
        </div>\
      </div>';
  }

  function renderSettingsPage() {
    var industries = Data.getAllIndustries();
    var teamMembers = Data.getAllTeamMembers();
    var hqLocations = Data.getAllHQLocations();
    var Users = FamilyOffice.Users;
    var users = Users.getUsers();
    var currentUser = Users.getCurrentUser();

    var industriesSection = renderSettingsSection(
      'Industries',
      'industry',
      industries,
      Data.getIndustryUsageCount,
      Data.isCustomIndustry
    );

    var teamSection = renderSettingsSection(
      'Team Members',
      'team',
      teamMembers,
      Data.getTeamMemberUsageCount,
      Data.isCustomTeamMember
    );

    var hqSection = renderSettingsSection(
      'HQ Locations',
      'hq',
      hqLocations,
      Data.getHQLocationUsageCount,
      Data.isCustomHQLocation
    );

    // User Management Section
    var usersList = users.map(function (user) {
      var isCurrentUser = currentUser && user.id === currentUser.id;
      var avatarColor = Users.getAvatarColor(user.name);
      return '\
        <div class="settings-item user-item" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-lg); margin-bottom: 8px;">\
          <div style="width: 40px; height: 40px; border-radius: 50%; background: ' + avatarColor.bg + '; border: 2px solid ' + avatarColor.border + '; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600;">' + Users.getInitials(user.name) + '</div>\
          <div style="flex: 1;">\
            <div style="font-weight: 500;">' + user.name + (isCurrentUser ? ' <span class="text-muted" style="font-size: 11px;">(You)</span>' : '') + '</div>\
            <div class="text-xs text-muted">' + (user.role || 'Viewer') + '</div>\
          </div>\
          <div class="flex gap-2">\
            <button class="btn btn-ghost btn-sm edit-user-btn" data-user-id="' + user.id + '" data-user-name="' + user.name + '" data-user-role="' + (user.role || 'Viewer') + '" title="Edit">✏️</button>\
            ' + (users.length > 1 && !isCurrentUser ? '<button class="btn btn-ghost btn-sm delete-user-btn" data-user-id="' + user.id + '" data-user-name="' + user.name + '" title="Delete">🗑️</button>' : '') + '\
          </div>\
        </div>';
    }).join('');

    var userManagementSection = '\
      <div class="settings-section">\
        <div class="settings-section-header">\
          <h3 class="settings-section-title">User Management</h3>\
          <button class="btn btn-sm btn-primary" id="add-user-settings-btn">+ Add User</button>\
        </div>\
        <div class="settings-section-content">\
          <p class="settings-description">Manage users who can access this portfolio. Each user has their own preferences.</p>\
          <div class="settings-list" id="users-list">\
            ' + usersList + '\
          </div>\
        </div>\
      </div>';

    // Cloud Sync Section
    var Supabase = FamilyOffice.Supabase;
    var lastSync = Supabase && Supabase.getLastSyncTime ? Supabase.getLastSyncTime() : null;
    var lastSyncText = lastSync ? new Date(lastSync).toLocaleString() : 'Never';

    var cloudSyncSection = '\
      <div class="settings-section">\
        <div class="settings-section-header">\
          <h3 class="settings-section-title">☁️ Cloud Sync</h3>\
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">● Active</span>\
        </div>\
        <div class="settings-section-content">\
          <p class="settings-description">Your data is automatically synced to Supabase cloud. All changes are saved instantly.</p>\
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 12px; background: var(--color-bg-tertiary); border-radius: var(--radius-md);">\
            <span style="font-weight: 500; color: #10b981;">✓ Cloud-first mode enabled</span>\
            <span class="text-sm text-muted" style="margin-left: auto;">Last sync: ' + lastSyncText + '</span>\
          </div>\
          <div id="sync-status" style="display: none; margin-bottom: 12px; padding: 10px; border-radius: var(--radius-md);"></div>\
          <div class="settings-actions">\
            <button class="btn btn-ghost" id="check-connection-btn">\
              <span class="btn-icon">🔌</span> Test Connection\
            </button>\
          </div>\
        </div>\
      </div>';

    var dataManagementSection = '\
      <div class="settings-section">\
        <div class="settings-section-header">\
          <h3 class="settings-section-title">Data Management</h3>\
        </div>\
        <div class="settings-section-content">\
          <p class="settings-description">Export your data for backup, import from a previous export, or reset to default sample data.</p>\
          <div class="settings-actions">\
            <button class="btn btn-secondary" id="export-data-btn">\
              <span class="btn-icon">📤</span> Export Data\
            </button>\
            <button class="btn btn-secondary" id="import-data-btn">\
              <span class="btn-icon">📥</span> Import Data\
            </button>\
            <button class="btn btn-danger" id="reset-data-btn">\
              <span class="btn-icon">⚠️</span> Reset to Defaults\
            </button>\
            <input type="file" id="import-file-input" accept=".json" style="display: none;">\
          </div>\
        </div>\
      </div>';

    return '\
      <div class="settings-page">\
        <div class="page-header">\
          <h1 class="page-title">Settings</h1>\
          <p class="page-subtitle">Manage users, dropdown options and data</p>\
        </div>\
        <div class="settings-grid">\
          ' + userManagementSection + '\
          ' + cloudSyncSection + '\
          ' + industriesSection + '\
          ' + teamSection + '\
          ' + hqSection + '\
          ' + dataManagementSection + '\
        </div>\
      </div>';
  }

  return {
    renderSidebar: renderSidebar,
    renderHeader: renderHeader,
    renderStatCard: renderStatCard,
    renderCompanyCard: renderCompanyCard,
    renderStageColumn: renderStageColumn,
    renderTableRow: renderTableRow,
    renderCompanyTable: renderCompanyTable,
    renderFilterBar: renderFilterBar,
    renderViewToggle: renderViewToggle,
    renderModal: renderModal,
    renderCompanyForm: renderCompanyForm,
    renderCompanyDetail: renderCompanyDetail,
    renderConfirmDialog: renderConfirmDialog,
    renderEmptyState: renderEmptyState,
    renderManageOptionsModal: renderManageOptionsModal,
    renderSettingsPage: renderSettingsPage,
    renderFollowOnsList: renderFollowOnsList,
    renderLegalEditModal: renderLegalEditModal
  };
})();
