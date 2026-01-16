// ============================================
// FUNDS VIEW - Global scope (no ES modules)
// Tracks investments in external VC funds as LP
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Funds = (function () {
    var Data = FamilyOffice.Data;
    var Utils = FamilyOffice.Utils;

    var currentEditId = null;
    var tempCapitalCalls = [];
    var tempDistributions = [];
    var tempNavHistory = [];

    function render() {
        var funds = Data.getFunds();
        var metrics = Data.getFundMetrics();

        // Calculate overall funds XIRR
        var allCashFlows = [];
        var today = new Date().toISOString().split('T')[0];
        funds.forEach(function (fund) {
            // Capital calls as outflows
            (fund.capitalCalls || []).forEach(function (cc) {
                allCashFlows.push({ date: cc.date, amount: -cc.amount });
            });
            // Distributions as inflows
            (fund.distributions || []).forEach(function (d) {
                allCashFlows.push({ date: d.date, amount: d.amount });
            });
            // Current NAV as inflow (today)
            var nav = Data.getFundLatestNav(fund);
            if (nav > 0) {
                allCashFlows.push({ date: today, amount: nav });
            }
        });
        var fundsXIRR = Utils.calculateXIRR(allCashFlows);

        var fundsHtml = funds.length > 0
            ? funds.map(function (f) { return renderFundCard(f); }).join('')
            : '<div class="empty-state" style="padding: 60px;">\
           <div class="empty-state-icon">💼</div>\
           <div class="empty-state-title">No Fund Investments Yet</div>\
           <div class="empty-state-description">Track your LP investments in external VC funds.</div>\
           <button class="btn btn-primary" id="empty-add-fund-btn">+ Add First Fund</button>\
         </div>';

        return '\
      <div class="animate-fadeIn">\
        <div class="flex justify-between items-center mb-6">\
          <div>\
            <h1 style="font-size: 1.5rem; font-weight: 600; margin: 0;">Fund Investments</h1>\
            <p class="text-muted text-sm" style="margin-top: 4px;">' + funds.length + ' funds | ' + Utils.formatCurrency(metrics.totalCommitment) + ' committed</p>\
          </div>\
          <button class="btn btn-primary" id="add-fund-btn">+ Add Fund</button>\
        </div>\
        \
        <!-- Summary Cards -->\
        <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-xs text-muted mb-2">Total Commitment</div>\
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-accent-primary);">' + Utils.formatCurrency(metrics.totalCommitment) + '</div>\
          </div>\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-xs text-muted mb-2">Called Capital</div>\
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-accent-tertiary);">' + Utils.formatCurrency(metrics.calledCapital) + '</div>\
            <div class="text-xs text-muted">' + Utils.formatCurrency(metrics.totalCommitment - metrics.calledCapital) + ' remaining</div>\
          </div>\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-xs text-muted mb-2">Distributions</div>\
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">' + Utils.formatCurrency(metrics.distributions) + '</div>\
          </div>\
          <div class="card" style="padding: var(--space-4); text-align: center;">\
            <div class="text-xs text-muted mb-2">Funds XIRR</div>\
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-accent-secondary);">' + Utils.formatXIRR(fundsXIRR) + '</div>\
          </div>\
        </div>\
        \
        <div class="funds-list">\
          ' + fundsHtml + '\
        </div>\
      </div>';
    }

    function renderFundCard(fund) {
        var calledCapital = Data.getFundCalledCapital(fund);
        var distributions = Data.getFundDistributions(fund);
        var latestNav = Data.getFundLatestNav(fund);
        var dpi = Data.getFundDPI(fund);
        var tvpi = Data.getFundTVPI(fund);
        var remaining = (fund.totalCommitment || 0) - calledCapital;

        // Calculate XIRR for this fund
        var cashFlows = [];
        var today = new Date().toISOString().split('T')[0];
        (fund.capitalCalls || []).forEach(function (cc) {
            cashFlows.push({ date: cc.date, amount: -cc.amount });
        });
        (fund.distributions || []).forEach(function (d) {
            cashFlows.push({ date: d.date, amount: d.amount });
        });
        if (latestNav > 0) {
            cashFlows.push({ date: today, amount: latestNav });
        }
        var fundXIRR = Utils.calculateXIRR(cashFlows);

        var avatarColor = Utils.getAvatarColor(fund.name);

        return '\
      <div class="fund-card card" style="padding: var(--space-4); margin-bottom: var(--space-3); cursor: pointer;" data-fund-id="' + fund.id + '">\
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">\
          <div style="display: flex; gap: 16px; align-items: flex-start;">\
            <div style="width: 48px; height: 48px; border-radius: 12px; background: ' + avatarColor.bg + '; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; color: ' + avatarColor.text + ';">\
              ' + Utils.getInitials(fund.name) + '\
            </div>\
            <div>\
              <h3 style="margin: 0 0 4px 0; font-size: 16px;">' + fund.name + '</h3>\
              <div class="text-xs text-muted">' + (fund.gpName || 'GP') + ' • Vintage ' + (fund.vintageYear || 'N/A') + '</div>\
            </div>\
          </div>\
          <div class="flex gap-2">\
            <button class="btn btn-ghost btn-sm edit-fund-btn" data-id="' + fund.id + '" title="Edit">✏️</button>\
            <button class="btn btn-ghost btn-sm delete-fund-btn" data-id="' + fund.id + '" title="Delete">🗑️</button>\
          </div>\
        </div>\
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--color-border);">\
          <div>\
            <div class="text-xs text-muted">Commitment</div>\
            <div style="font-weight: 600;">' + Utils.formatCurrency(fund.totalCommitment || 0) + '</div>\
          </div>\
          <div>\
            <div class="text-xs text-muted">Called / Remaining</div>\
            <div style="font-weight: 600;">' + Utils.formatCurrency(calledCapital) + ' <span class="text-muted">/ ' + Utils.formatCurrency(remaining) + '</span></div>\
          </div>\
          <div>\
            <div class="text-xs text-muted">Latest NAV</div>\
            <div style="font-weight: 600;">' + Utils.formatCurrency(latestNav) + '</div>\
          </div>\
          <div>\
            <div class="text-xs text-muted">DPI / TVPI</div>\
            <div style="font-weight: 600;">' + dpi.toFixed(2) + 'x <span class="text-muted">/ ' + tvpi.toFixed(2) + 'x</span></div>\
          </div>\
          <div>\
            <div class="text-xs text-muted">XIRR</div>\
            <div style="font-weight: 600; color: var(--color-accent-secondary);">' + Utils.formatXIRR(fundXIRR) + '</div>\
          </div>\
        </div>\
      </div>';
    }

    function renderFundModal(fund) {
        var isEdit = fund && fund.id;

        // Initialize temp arrays
        tempCapitalCalls = (fund && fund.capitalCalls) ? fund.capitalCalls.slice() : [];
        tempDistributions = (fund && fund.distributions) ? fund.distributions.slice() : [];
        tempNavHistory = (fund && fund.navHistory) ? fund.navHistory.slice() : [];

        return '\
      <div class="modal-overlay" id="fund-modal">\
        <div class="modal" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">\
          <div class="modal-header">\
            <h2 class="modal-title">' + (isEdit ? 'Edit Fund' : 'Add New Fund') + '</h2>\
            <button class="modal-close" id="close-fund-modal">&times;</button>\
          </div>\
          <div class="modal-body">\
            <form id="fund-form">\
              <div class="form-row">\
                <div class="form-group">\
                  <label class="form-label">Fund Name *</label>\
                  <input type="text" class="form-input" name="name" value="' + (fund && fund.name || '') + '" required>\
                </div>\
                <div class="form-group">\
                  <label class="form-label">GP/Manager Name</label>\
                  <input type="text" class="form-input" name="gpName" value="' + (fund && fund.gpName || '') + '">\
                </div>\
              </div>\
              <div class="form-row">\
                <div class="form-group">\
                  <label class="form-label">Vintage Year</label>\
                  <input type="number" class="form-input" name="vintageYear" value="' + (fund && fund.vintageYear || new Date().getFullYear()) + '" min="2000" max="2030">\
                </div>\
                <div class="form-group">\
                  <label class="form-label">Fund Size (₹)</label>\
                  <input type="number" class="form-input" name="fundSize" value="' + (fund && fund.fundSize || '') + '" min="0">\
                </div>\
              </div>\
              <div class="form-row">\
                <div class="form-group">\
                  <label class="form-label">Our Commitment (₹) *</label>\
                  <input type="number" class="form-input" name="totalCommitment" value="' + (fund && fund.totalCommitment || '') + '" min="0" required>\
                </div>\
                <div class="form-group">\
                  <label class="form-label">Report URL</label>\
                  <input type="url" class="form-input" name="reportUrl" value="' + (fund && fund.reportUrl || '') + '" placeholder="Link to reports folder">\
                </div>\
              </div>\
              \
              <!-- Capital Calls Section -->\
              <div style="margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">\
                <div class="flex justify-between items-center mb-3">\
                  <label class="form-label" style="margin: 0;">💰 Capital Calls</label>\
                  <button type="button" class="btn btn-sm btn-secondary" id="add-capital-call-btn">+ Add Call</button>\
                </div>\
                <div id="capital-calls-list">' + renderCapitalCallsList() + '</div>\
                <div id="add-capital-call-form" style="display: none; background: var(--color-bg-tertiary); padding: 12px; border-radius: 8px; margin-top: 8px;">\
                  <div class="form-row">\
                    <div class="form-group"><input type="date" class="form-input" id="cc-date"></div>\
                    <div class="form-group"><input type="number" class="form-input" id="cc-amount" placeholder="Amount (₹)"></div>\
                    <div style="display: flex; gap: 8px; align-items: flex-end;">\
                      <button type="button" class="btn btn-sm btn-primary" id="save-capital-call-btn">Add</button>\
                      <button type="button" class="btn btn-sm btn-ghost" id="cancel-capital-call-btn">Cancel</button>\
                    </div>\
                  </div>\
                </div>\
              </div>\
              \
              <!-- Distributions Section -->\
              <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">\
                <div class="flex justify-between items-center mb-3">\
                  <label class="form-label" style="margin: 0;">📤 Distributions</label>\
                  <button type="button" class="btn btn-sm btn-secondary" id="add-distribution-btn">+ Add</button>\
                </div>\
                <div id="distributions-list">' + renderDistributionsList() + '</div>\
                <div id="add-distribution-form" style="display: none; background: var(--color-bg-tertiary); padding: 12px; border-radius: 8px; margin-top: 8px;">\
                  <div class="form-row">\
                    <div class="form-group"><input type="date" class="form-input" id="dist-date"></div>\
                    <div class="form-group"><input type="number" class="form-input" id="dist-amount" placeholder="Amount (₹)"></div>\
                    <div style="display: flex; gap: 8px; align-items: flex-end;">\
                      <button type="button" class="btn btn-sm btn-primary" id="save-distribution-btn">Add</button>\
                      <button type="button" class="btn btn-sm btn-ghost" id="cancel-distribution-btn">Cancel</button>\
                    </div>\
                  </div>\
                </div>\
              </div>\
              \
              <!-- NAV History Section -->\
              <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">\
                <div class="flex justify-between items-center mb-3">\
                  <label class="form-label" style="margin: 0;">📊 NAV History</label>\
                  <button type="button" class="btn btn-sm btn-secondary" id="add-nav-btn">+ Update NAV</button>\
                </div>\
                <div id="nav-history-list">' + renderNavHistoryList() + '</div>\
                <div id="add-nav-form" style="display: none; background: var(--color-bg-tertiary); padding: 12px; border-radius: 8px; margin-top: 8px;">\
                  <div class="form-row">\
                    <div class="form-group"><input type="date" class="form-input" id="nav-date"></div>\
                    <div class="form-group"><input type="number" class="form-input" id="nav-value" placeholder="NAV (₹)"></div>\
                    <div style="display: flex; gap: 8px; align-items: flex-end;">\
                      <button type="button" class="btn btn-sm btn-primary" id="save-nav-btn">Add</button>\
                      <button type="button" class="btn btn-sm btn-ghost" id="cancel-nav-btn">Cancel</button>\
                    </div>\
                  </div>\
                </div>\
              </div>\
              \
              <div class="form-group" style="margin-top: var(--space-4);">\
                <label class="form-label">Notes</label>\
                <textarea class="form-textarea" name="notes" rows="2">' + (fund && fund.notes || '') + '</textarea>\
              </div>\
            </form>\
          </div>\
          <div class="modal-footer">\
            <button class="btn btn-secondary" id="cancel-fund-modal">Cancel</button>\
            <button class="btn btn-primary" id="save-fund-btn">' + (isEdit ? 'Save Changes' : 'Add Fund') + '</button>\
          </div>\
        </div>\
      </div>';
    }

    function renderCapitalCallsList() {
        if (tempCapitalCalls.length === 0) {
            return '<div class="text-sm text-muted">No capital calls yet</div>';
        }
        return tempCapitalCalls.map(function (cc, i) {
            return '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--color-bg-tertiary); border-radius: 6px; margin-bottom: 4px;">\
        <span>' + Utils.formatDate(cc.date) + ' - ' + Utils.formatCurrency(cc.amount) + '</span>\
        <button type="button" class="btn btn-ghost btn-sm delete-cc-btn" data-index="' + i + '">🗑️</button>\
      </div>';
        }).join('');
    }

    function renderDistributionsList() {
        if (tempDistributions.length === 0) {
            return '<div class="text-sm text-muted">No distributions yet</div>';
        }
        return tempDistributions.map(function (d, i) {
            return '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--color-bg-tertiary); border-radius: 6px; margin-bottom: 4px;">\
        <span>' + Utils.formatDate(d.date) + ' - ' + Utils.formatCurrency(d.amount) + '</span>\
        <button type="button" class="btn btn-ghost btn-sm delete-dist-btn" data-index="' + i + '">🗑️</button>\
      </div>';
        }).join('');
    }

    function renderNavHistoryList() {
        if (tempNavHistory.length === 0) {
            return '<div class="text-sm text-muted">No NAV history yet</div>';
        }
        var sorted = tempNavHistory.slice().sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });
        return sorted.map(function (n, i) {
            return '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--color-bg-tertiary); border-radius: 6px; margin-bottom: 4px;">\
        <span>' + Utils.formatDate(n.date) + ' - NAV: ' + Utils.formatCurrency(n.nav) + '</span>\
        <button type="button" class="btn btn-ghost btn-sm delete-nav-btn" data-index="' + tempNavHistory.indexOf(n) + '">🗑️</button>\
      </div>';
        }).join('');
    }

    function openAddModal() {
        currentEditId = null;
        var modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = renderFundModal(null);
    }

    function openEditModal(fundId) {
        currentEditId = fundId;
        var fund = Data.getFundById(fundId);
        var modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = renderFundModal(fund);
    }

    function closeModal() {
        currentEditId = null;
        tempCapitalCalls = [];
        tempDistributions = [];
        tempNavHistory = [];
        document.getElementById('modal-container').innerHTML = '';
    }

    function saveFund() {
        var form = document.getElementById('fund-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        var data = {
            name: form.querySelector('[name="name"]').value,
            gpName: form.querySelector('[name="gpName"]').value,
            vintageYear: parseInt(form.querySelector('[name="vintageYear"]').value) || new Date().getFullYear(),
            fundSize: parseFloat(form.querySelector('[name="fundSize"]').value) || 0,
            totalCommitment: parseFloat(form.querySelector('[name="totalCommitment"]').value) || 0,
            reportUrl: form.querySelector('[name="reportUrl"]').value,
            notes: form.querySelector('[name="notes"]').value,
            capitalCalls: tempCapitalCalls,
            distributions: tempDistributions,
            navHistory: tempNavHistory
        };

        if (currentEditId) {
            Data.updateFund(currentEditId, data);
        } else {
            Data.addFund(data);
        }

        closeModal();
        refreshPage();
    }

    function deleteFund(fundId) {
        if (confirm('Are you sure you want to delete this fund?')) {
            Data.deleteFund(fundId);
            refreshPage();
        }
    }

    function refreshPage() {
        var pageContent = document.getElementById('page-content');
        if (pageContent) {
            pageContent.innerHTML = render();
        }
    }

    function initEvents() {
        var pageContent = document.getElementById('page-content');
        var modalContainer = document.getElementById('modal-container');

        // Page events
        pageContent.addEventListener('click', function (e) {
            if (e.target.id === 'add-fund-btn' || e.target.id === 'empty-add-fund-btn') {
                openAddModal();
            }
            if (e.target.classList.contains('edit-fund-btn')) {
                e.stopPropagation();
                openEditModal(e.target.dataset.id);
            }
            if (e.target.classList.contains('delete-fund-btn')) {
                e.stopPropagation();
                deleteFund(e.target.dataset.id);
            }
            // Click on fund card to open detail
            var fundCard = e.target.closest('.fund-card');
            if (fundCard && !e.target.classList.contains('edit-fund-btn') && !e.target.classList.contains('delete-fund-btn')) {
                openEditModal(fundCard.dataset.fundId);
            }
        });

        // Modal events
        modalContainer.addEventListener('click', function (e) {
            if (e.target.id === 'close-fund-modal' || e.target.id === 'cancel-fund-modal' || e.target.id === 'fund-modal') {
                closeModal();
            }
            if (e.target.id === 'save-fund-btn') {
                saveFund();
            }

            // Capital calls
            if (e.target.id === 'add-capital-call-btn') {
                document.getElementById('add-capital-call-form').style.display = 'block';
            }
            if (e.target.id === 'cancel-capital-call-btn') {
                document.getElementById('add-capital-call-form').style.display = 'none';
            }
            if (e.target.id === 'save-capital-call-btn') {
                var date = document.getElementById('cc-date').value;
                var amount = parseFloat(document.getElementById('cc-amount').value);
                if (date && amount) {
                    tempCapitalCalls.push({ id: Date.now().toString(), date: date, amount: amount });
                    document.getElementById('capital-calls-list').innerHTML = renderCapitalCallsList();
                    document.getElementById('add-capital-call-form').style.display = 'none';
                    document.getElementById('cc-date').value = '';
                    document.getElementById('cc-amount').value = '';
                }
            }
            if (e.target.classList.contains('delete-cc-btn')) {
                var idx = parseInt(e.target.dataset.index);
                tempCapitalCalls.splice(idx, 1);
                document.getElementById('capital-calls-list').innerHTML = renderCapitalCallsList();
            }

            // Distributions
            if (e.target.id === 'add-distribution-btn') {
                document.getElementById('add-distribution-form').style.display = 'block';
            }
            if (e.target.id === 'cancel-distribution-btn') {
                document.getElementById('add-distribution-form').style.display = 'none';
            }
            if (e.target.id === 'save-distribution-btn') {
                var date = document.getElementById('dist-date').value;
                var amount = parseFloat(document.getElementById('dist-amount').value);
                if (date && amount) {
                    tempDistributions.push({ id: Date.now().toString(), date: date, amount: amount });
                    document.getElementById('distributions-list').innerHTML = renderDistributionsList();
                    document.getElementById('add-distribution-form').style.display = 'none';
                    document.getElementById('dist-date').value = '';
                    document.getElementById('dist-amount').value = '';
                }
            }
            if (e.target.classList.contains('delete-dist-btn')) {
                var idx = parseInt(e.target.dataset.index);
                tempDistributions.splice(idx, 1);
                document.getElementById('distributions-list').innerHTML = renderDistributionsList();
            }

            // NAV History
            if (e.target.id === 'add-nav-btn') {
                document.getElementById('add-nav-form').style.display = 'block';
            }
            if (e.target.id === 'cancel-nav-btn') {
                document.getElementById('add-nav-form').style.display = 'none';
            }
            if (e.target.id === 'save-nav-btn') {
                var date = document.getElementById('nav-date').value;
                var nav = parseFloat(document.getElementById('nav-value').value);
                if (date && nav) {
                    tempNavHistory.push({ id: Date.now().toString(), date: date, nav: nav });
                    document.getElementById('nav-history-list').innerHTML = renderNavHistoryList();
                    document.getElementById('add-nav-form').style.display = 'none';
                    document.getElementById('nav-date').value = '';
                    document.getElementById('nav-value').value = '';
                }
            }
            if (e.target.classList.contains('delete-nav-btn')) {
                var idx = parseInt(e.target.dataset.index);
                tempNavHistory.splice(idx, 1);
                document.getElementById('nav-history-list').innerHTML = renderNavHistoryList();
            }
        });
    }

    return {
        render: render,
        initEvents: initEvents
    };
})();
