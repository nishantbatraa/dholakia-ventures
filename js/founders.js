// ============================================
// FOUNDERS VIEW - Founders Database Management
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Founders = (function () {
  var Data = FamilyOffice.Data;
  var Utils = FamilyOffice.Utils;

  var currentEditId = null;

  // Filter state
  var filters = {
    search: '',
    company: 'all',
    location: 'all'
  };

  function render() {
    var allFounders = Data.getFounders();
    var companies = Data.getCompanies();

    // Get unique locations for filter dropdown
    var locations = [];
    allFounders.forEach(function (f) {
      if (f.location && locations.indexOf(f.location) === -1) {
        locations.push(f.location);
      }
    });
    locations.sort();

    // Apply filters
    var founders = allFounders.filter(function (f) {
      // Search filter
      if (filters.search) {
        var searchLower = filters.search.toLowerCase();
        var nameMatch = f.name.toLowerCase().indexOf(searchLower) !== -1;
        var emailMatch = f.email && f.email.toLowerCase().indexOf(searchLower) !== -1;
        var roleMatch = f.role && f.role.toLowerCase().indexOf(searchLower) !== -1;
        if (!nameMatch && !emailMatch && !roleMatch) return false;
      }

      // Company filter
      if (filters.company !== 'all') {
        var linkedCompanyIds = f.companyIds || [];
        if (linkedCompanyIds.indexOf(filters.company) === -1) return false;
      }

      // Location filter
      if (filters.location !== 'all') {
        if (f.location !== filters.location) return false;
      }

      return true;
    });

    // Build company options
    var companyOptions = '<option value="all">All Companies</option>' +
      companies.map(function (c) {
        return '<option value="' + c.id + '"' + (filters.company === c.id ? ' selected' : '') + '>' + c.name + '</option>';
      }).join('');

    // Build location options
    var locationOptions = '<option value="all">All Locations</option>' +
      locations.map(function (loc) {
        return '<option value="' + loc + '"' + (filters.location === loc ? ' selected' : '') + '>' + loc + '</option>';
      }).join('');

    var foundersHtml = founders.length > 0
      ? founders.map(function (f) {
        var linkedCompanies = Data.getCompaniesByFounder(f.id);
        var companyBadges = linkedCompanies.map(function (c) {
          return '<span class="badge badge-series-a" style="font-size: 10px; margin-right: 4px;">' + c.name + '</span>';
        }).join('');

        var avatarColor = Utils.getAvatarColor ? Utils.getAvatarColor(f.name) : { bg: 'var(--color-accent-primary)', text: '#fff' };

        return '\
            <div class="founder-card card" style="padding: var(--space-4); margin-bottom: var(--space-3);" data-founder-id="' + f.id + '">\
              <div style="display: flex; align-items: flex-start; gap: 16px;">\
                <div class="founder-avatar" style="width: 48px; height: 48px; border-radius: 50%; background: ' + avatarColor.bg + '; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; color: ' + avatarColor.text + ';">\
                  ' + Utils.getInitials(f.name) + '\
                </div>\
                <div style="flex: 1;">\
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">\
                    <div>\
                      <h3 style="margin: 0 0 4px 0; font-size: 16px;">' + f.name + '</h3>\
                      <div class="text-xs text-muted">' + (f.role || 'Founder') + (f.location ? ' • ' + f.location : '') + '</div>\
                    </div>\
                    <div class="flex gap-2">\
                      <button class="btn btn-ghost btn-sm edit-founder-btn" data-id="' + f.id + '" title="Edit">✏️</button>\
                      <button class="btn btn-ghost btn-sm delete-founder-btn" data-id="' + f.id + '" title="Delete">🗑️</button>\
                    </div>\
                  </div>\
                  <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 12px;">\
                    ' + (f.email ? '<div class="text-sm"><span class="text-muted">📧</span> <a href="mailto:' + f.email + '" style="color: var(--color-accent-tertiary);">' + f.email + '</a></div>' : '') + '\
                    ' + (f.mobile ? '<div class="text-sm"><span class="text-muted">📱</span> <a href="tel:' + f.mobile + '" style="color: var(--color-accent-tertiary);">' + f.mobile + '</a></div>' : '') + '\
                    ' + (f.linkedin ? '<div class="text-sm"><span class="text-muted">🔗</span> <a href="' + f.linkedin + '" target="_blank" style="color: var(--color-accent-tertiary);">LinkedIn</a></div>' : '') + '\
                  </div>\
                  ' + (companyBadges ? '<div style="margin-top: 12px;"><span class="text-xs text-muted" style="margin-right: 8px;">Companies:</span>' + companyBadges + '</div>' : '') + '\
                </div>\
              </div>\
            </div>';
      }).join('')
      : '<div class="empty-state" style="padding: 60px;">\
           <div class="empty-state-icon">👥</div>\
           <div class="empty-state-title">' + (allFounders.length > 0 ? 'No Matches' : 'No Founders Yet') + '</div>\
           <div class="empty-state-description">' + (allFounders.length > 0 ? 'Try adjusting your search or filters.' : 'Add founders to track their contact info and link them to portfolio companies.') + '</div>\
           ' + (allFounders.length === 0 ? '<button class="btn btn-primary" id="empty-add-founder-btn">+ Add First Founder</button>' : '') + '\
         </div>';

    // Filter bar HTML - compact single line
    var filterBarHtml = '\
      <div class="card" style="padding: 12px; margin-bottom: 20px;">\
        <div style="display: flex; gap: 10px; align-items: center;">\
          <input type="text" class="form-input" id="founder-search" placeholder="🔍 Search..." value="' + filters.search + '" style="width: 180px; padding: 6px 10px; font-size: 13px;">\
          <select class="form-select" id="founder-filter-company" style="width: 140px; padding: 6px 8px; font-size: 13px;">' + companyOptions + '</select>\
          <select class="form-select" id="founder-filter-location" style="width: 140px; padding: 6px 8px; font-size: 13px;">' + locationOptions + '</select>\
          ' + (filters.search || filters.company !== 'all' || filters.location !== 'all' ? '<button class="btn btn-ghost btn-sm" id="clear-founder-filters" style="padding: 4px 8px; font-size: 12px;">✕ Clear</button>' : '') + '\
        </div>\
      </div>';

    return '\
      <div class="animate-fadeIn">\
        <div class="flex justify-between items-center mb-6">\
          <div>\
            <h1 style="font-size: 1.5rem; font-weight: 600; margin: 0;">Founders Database</h1>\
            <p class="text-muted text-sm" style="margin-top: 4px;">' + allFounders.length + ' founders in database' + (founders.length !== allFounders.length ? ' (' + founders.length + ' shown)' : '') + '</p>\
          </div>\
          <div style="display: flex; gap: 12px;">\
            <button class="btn btn-secondary" id="quick-add-founders-btn">⚡ Quick Add Multiple</button>\
            <button class="btn btn-primary" id="add-founder-btn">+ Add Founder</button>\
          </div>\
        </div>\
        ' + filterBarHtml + '\
        <div class="founders-list">\
          ' + foundersHtml + '\
        </div>\
      </div>';
  }

  function renderFounderModal(founder) {
    var isEdit = founder && founder.id;
    var companies = Data.getCompanies();
    var selectedCompanyIds = founder && founder.companyIds ? founder.companyIds : [];

    var companyCheckboxes = companies.map(function (c) {
      var isChecked = selectedCompanyIds.indexOf(c.id) !== -1;
      return '\
        <label style="display: flex; align-items: center; gap: 8px; padding: 8px 0; cursor: pointer;">\
          <input type="checkbox" name="companyIds" value="' + c.id + '" ' + (isChecked ? 'checked' : '') + '>\
          <span>' + c.name + '</span>\
          <span class="text-xs text-muted">(' + c.industry + ')</span>\
        </label>';
    }).join('');

    return '\
      <div id="founder-modal" class="modal-overlay">\
        <div class="modal" style="width: 500px; max-width: 95vw;">\
          <div class="modal-header">\
            <h2>' + (isEdit ? 'Edit Founder' : 'Add Founder') + '</h2>\
            <button class="modal-close" id="close-founder-modal">&times;</button>\
          </div>\
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">\
            <form id="founder-form">\
              <div class="form-row">\
                <div class="form-group">\
                  <label class="form-label">Name *</label>\
                  <input type="text" class="form-input" name="name" value="' + (founder && founder.name || '') + '" required placeholder="Full name">\
                </div>\
                <div class="form-group">\
                  <label class="form-label">Role</label>\
                  <input type="text" class="form-input" name="role" value="' + (founder && founder.role || '') + '" placeholder="CEO, CTO, Co-Founder...">\
                </div>\
              </div>\
              <div class="form-row">\
                <div class="form-group">\
                  <label class="form-label">Email</label>\
                  <input type="email" class="form-input" name="email" value="' + (founder && founder.email || '') + '" placeholder="email@example.com">\
                </div>\
                <div class="form-group">\
                  <label class="form-label">Mobile</label>\
                  <input type="tel" class="form-input" name="mobile" value="' + (founder && founder.mobile || '') + '" placeholder="+91 9876543210">\
                </div>\
              </div>\
              <div class="form-row">\
                <div class="form-group">\
                  <label class="form-label">Location</label>\
                  <input type="text" class="form-input" name="location" value="' + (founder && founder.location || '') + '" placeholder="City, Country">\
                </div>\
                <div class="form-group">\
                  <label class="form-label">LinkedIn</label>\
                  <input type="url" class="form-input" name="linkedin" value="' + (founder && founder.linkedin || '') + '" placeholder="https://linkedin.com/in/...">\
                </div>\
              </div>\
              <div class="form-group">\
                <label class="form-label">Link to Companies</label>\
                <div style="max-height: 200px; overflow-y: auto; background: var(--color-bg-tertiary); border-radius: var(--radius-lg); padding: 12px;">\
                  ' + (companies.length > 0 ? companyCheckboxes : '<p class="text-muted text-sm">No companies yet. Add companies to link them here.</p>') + '\
                </div>\
              </div>\
            </form>\
          </div>\
          <div class="modal-footer">\
            <button class="btn btn-secondary" id="cancel-founder-modal">Cancel</button>\
            <button class="btn btn-primary" id="save-founder-btn">' + (isEdit ? 'Save Changes' : 'Add Founder') + '</button>\
          </div>\
        </div>\
      </div>';
  }

  function renderQuickAddModal() {
    var companies = Data.getCompanies();

    var companyOptions = companies.map(function (c) {
      return '<option value="' + c.id + '">' + c.name + ' (' + c.industry + ')</option>';
    }).join('');

    return '\
      <div id="quick-add-modal" class="modal-overlay">\
        <div class="modal" style="width: 480px; max-width: 95vw;">\
          <div class="modal-header">\
            <h2>⚡ Quick Add Multiple Founders</h2>\
            <button class="modal-close" id="close-quick-add-modal">&times;</button>\
          </div>\
          <div class="modal-body">\
            <p class="text-muted text-sm mb-4">Enter founder names, one per line. You can add their details later.</p>\
            <div class="form-group">\
              <label class="form-label">Founder Names *</label>\
              <textarea class="form-textarea" id="quick-add-names" rows="6" placeholder="John Doe\nJane Smith\nBob Wilson"></textarea>\
            </div>\
            <div class="form-group">\
              <label class="form-label">Link all to Company (optional)</label>\
              <select class="form-select" id="quick-add-company">\
                <option value="">-- Select a company --</option>\
                ' + companyOptions + '\
              </select>\
            </div>\
            <div class="form-group">\
              <label class="form-label">Default Role (optional)</label>\
              <input type="text" class="form-input" id="quick-add-role" placeholder="Co-Founder, CEO...">\
            </div>\
          </div>\
          <div class="modal-footer">\
            <button class="btn btn-secondary" id="cancel-quick-add-modal">Cancel</button>\
            <button class="btn btn-primary" id="save-quick-add-btn">Add All Founders</button>\
          </div>\
        </div>\
      </div>';
  }

  function openQuickAddModal() {
    var modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = renderQuickAddModal();
    document.getElementById('quick-add-names').focus();
  }

  function closeQuickAddModal() {
    var modal = document.getElementById('quick-add-modal');
    if (modal) modal.remove();
  }

  function saveQuickAddFounders() {
    var namesText = document.getElementById('quick-add-names').value.trim();
    var companyId = document.getElementById('quick-add-company').value;
    var defaultRole = document.getElementById('quick-add-role').value.trim();

    if (!namesText) {
      alert('Please enter at least one founder name');
      document.getElementById('quick-add-names').focus();
      return;
    }

    // Split by newlines and filter empty lines
    var names = namesText.split('\n')
      .map(function (n) { return n.trim(); })
      .filter(function (n) { return n.length > 0; });

    if (names.length === 0) {
      alert('Please enter at least one founder name');
      return;
    }

    var addedCount = 0;
    names.forEach(function (name) {
      var founderData = {
        name: name,
        role: defaultRole || 'Founder',
        companyIds: companyId ? [companyId] : []
      };

      var newFounder = Data.addFounder(founderData);

      // Link to company if selected
      if (companyId) {
        Data.linkFounderToCompany(newFounder.id, companyId);
      }

      addedCount++;
    });

    closeQuickAddModal();
    refreshPage();
    alert('✅ Added ' + addedCount + ' founder' + (addedCount > 1 ? 's' : '') + ' successfully!');
  }

  function openAddModal() {
    currentEditId = null;
    var modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = renderFounderModal(null);
  }

  function openEditModal(founderId) {
    currentEditId = founderId;
    var founder = Data.getFounderById(founderId);
    var modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = renderFounderModal(founder);
  }

  function closeModal() {
    var modal = document.getElementById('founder-modal');
    if (modal) modal.remove();
    currentEditId = null;
  }

  function saveFounder() {
    var form = document.getElementById('founder-form');
    var nameInput = form.querySelector('[name="name"]');
    var name = nameInput.value.trim();

    if (!name) {
      alert('Please enter a name');
      nameInput.focus();
      return;
    }

    // Get checked company IDs
    var companyCheckboxes = form.querySelectorAll('[name="companyIds"]:checked');
    var companyIds = [];
    companyCheckboxes.forEach(function (cb) {
      companyIds.push(cb.value);
    });

    var founderData = {
      name: name,
      role: form.querySelector('[name="role"]').value.trim(),
      email: form.querySelector('[name="email"]').value.trim(),
      mobile: form.querySelector('[name="mobile"]').value.trim(),
      location: form.querySelector('[name="location"]').value.trim(),
      linkedin: form.querySelector('[name="linkedin"]').value.trim(),
      companyIds: companyIds
    };

    if (currentEditId) {
      // Get old company IDs for unlinking
      var oldFounder = Data.getFounderById(currentEditId);
      var oldCompanyIds = oldFounder.companyIds || [];

      // Unlink from companies that were removed
      oldCompanyIds.forEach(function (cid) {
        if (companyIds.indexOf(cid) === -1) {
          Data.unlinkFounderFromCompany(currentEditId, cid);
        }
      });

      // Link to new companies
      companyIds.forEach(function (cid) {
        if (oldCompanyIds.indexOf(cid) === -1) {
          Data.linkFounderToCompany(currentEditId, cid);
        }
      });

      Data.updateFounder(currentEditId, founderData);
    } else {
      var newFounder = Data.addFounder(founderData);
      // Link to selected companies
      companyIds.forEach(function (cid) {
        Data.linkFounderToCompany(newFounder.id, cid);
      });
    }

    closeModal();
    refreshPage();
  }

  function deleteFounder(founderId) {
    var founder = Data.getFounderById(founderId);
    if (confirm('Are you sure you want to delete "' + founder.name + '"?\n\nThis will remove them from all linked companies.')) {
      Data.deleteFounder(founderId);
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
      if (e.target.id === 'add-founder-btn' || e.target.id === 'empty-add-founder-btn') {
        openAddModal();
      }

      // Quick add multiple founders
      if (e.target.id === 'quick-add-founders-btn') {
        openQuickAddModal();
      }

      // Edit founder
      if (e.target.classList.contains('edit-founder-btn')) {
        var founderId = e.target.dataset.id;
        openEditModal(founderId);
      }

      // Delete founder
      if (e.target.classList.contains('delete-founder-btn')) {
        var founderId = e.target.dataset.id;
        deleteFounder(founderId);
      }

      // Clear filters
      if (e.target.id === 'clear-founder-filters') {
        filters.search = '';
        filters.company = 'all';
        filters.location = 'all';
        refreshPage();
      }
    });

    // Search input with debounce
    var searchTimeout;
    pageContent.addEventListener('input', function (e) {
      if (e.target.id === 'founder-search') {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
          filters.search = e.target.value;
          refreshPage();
        }, 300);
      }
    });

    // Filter dropdowns
    pageContent.addEventListener('change', function (e) {
      if (e.target.id === 'founder-filter-company') {
        filters.company = e.target.value;
        refreshPage();
      }
      if (e.target.id === 'founder-filter-location') {
        filters.location = e.target.value;
        refreshPage();
      }
    });

    // Modal events
    modalContainer.addEventListener('click', function (e) {
      // Close modal
      if (e.target.id === 'close-founder-modal' || e.target.id === 'cancel-founder-modal' || e.target.id === 'founder-modal') {
        closeModal();
      }

      // Save founder
      if (e.target.id === 'save-founder-btn') {
        saveFounder();
      }

      // Quick add modal events
      if (e.target.id === 'close-quick-add-modal' || e.target.id === 'cancel-quick-add-modal' || e.target.id === 'quick-add-modal') {
        closeQuickAddModal();
      }
      if (e.target.id === 'save-quick-add-btn') {
        saveQuickAddFounders();
      }
    });
  }

  return {
    render: render,
    initEvents: initEvents,
    renderFounderModal: renderFounderModal
  };
})();
