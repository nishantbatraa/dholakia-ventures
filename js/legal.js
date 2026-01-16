// ============================================
// LEGAL VIEW - Global scope (no ES modules)
// Dedicated page for viewing legal documents & rights
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Legal = (function () {
  var Data = FamilyOffice.Data;
  var Utils = FamilyOffice.Utils;
  var Components = FamilyOffice.Components;

  var filters = {
    search: ''
  };

  // Rights labels for display
  var rightsLabels = {
    boardSeat: '🪑 Board Seat',
    observer: '👁️ Observer',
    boardComposition: '📋 Board Comp',
    preEmptive: '⚡ Pre-emptive',
    antiDilution: '🛡️ Anti-dilution',
    proRata: '➕ Pro-rata',
    rofr: '🔄 ROFR',
    tagAlong: '🏷️ Tag-along',
    dragAlong: '🔗 Drag-along',
    liquidationPref: '💰 Liq Pref',
    conversionRights: '🔃 Conversion',
    vestingSchedule: '📅 Vesting',
    informationRights: '📊 Info Rights'
  };

  function render() {
    var companies = Data.getCompanies();

    // Filter by search
    var filtered = companies.filter(function (c) {
      if (filters.search) {
        return c.name.toLowerCase().indexOf(filters.search.toLowerCase()) !== -1;
      }
      return true;
    });

    // Count total rounds with rights
    var totalRounds = 0;
    var roundsWithRights = 0;
    filtered.forEach(function (c) {
      totalRounds++; // Initial
      if (c.legalRights && Object.keys(c.legalRights).some(function (k) { return c.legalRights[k] && c.legalRights[k].enabled; })) {
        roundsWithRights++;
      }
      (c.followOns || []).forEach(function (fo) {
        if (fo.didWeInvest) {
          totalRounds++;
          if (fo.legalRights && Object.keys(fo.legalRights).some(function (k) { return fo.legalRights[k] && fo.legalRights[k].enabled; })) {
            roundsWithRights++;
          }
        }
      });
    });

    var cardsHtml = filtered.length > 0 ? filtered.map(function (c) {
      return renderCompanyCard(c);
    }).join('') : '<div class="empty-state" style="padding: 40px; text-align: center;">\
        <div style="font-size: 48px; margin-bottom: 12px;">📜</div>\
        <div style="font-weight: 600;">No Companies Found</div>\
        <div class="text-muted">Try adjusting your search</div>\
      </div>';

    return '\
      <div class="animate-fadeIn">\
        <div class="flex justify-between items-center mb-6">\
          <div>\
            <h1 style="font-size: 1.5rem; font-weight: 600; margin: 0;">Legal & Rights</h1>\
            <p class="text-muted text-sm" style="margin-top: 4px;">' + filtered.length + ' companies | ' + roundsWithRights + '/' + totalRounds + ' rounds with documented rights</p>\
          </div>\
        </div>\
        \
        <div class="card" style="padding: 12px; margin-bottom: 20px;">\
          <div style="display: flex; gap: 12px; align-items: center;">\
            <input type="text" class="form-input" id="legal-search" placeholder="🔍 Search company..." value="' + filters.search + '" style="width: 250px;">\
            ' + (filters.search ? '<button class="btn btn-ghost btn-sm" id="clear-legal-filters">✕ Clear</button>' : '') + '\
          </div>\
        </div>\
        \
        <div class="legal-list">\
          ' + cardsHtml + '\
        </div>\
      </div>';
  }

  function renderCompanyCard(company) {
    var avatarColor = Utils.getAvatarColor(company.name);

    // Count rounds and docs, find latest round info
    var roundCount = 1;
    var docsCount = (company.documents || []).length;
    var latestRound = company.entryStage;
    var latestDate = company.entryDate;
    var allRights = company.legalRights || {};
    var hasRights = allRights && Object.keys(allRights).some(function (k) {
      return allRights[k] && allRights[k].enabled;
    });

    (company.followOns || []).forEach(function (fo) {
      if (fo.didWeInvest) {
        roundCount++;
        docsCount += (fo.documents || []).length;
        // Track the latest round
        if (new Date(fo.date) > new Date(latestDate)) {
          latestRound = fo.round;
          latestDate = fo.date;
        }
        // Collect rights from latest round
        if (fo.legalRights && Object.keys(fo.legalRights).some(function (k) { return fo.legalRights[k] && fo.legalRights[k].enabled; })) {
          hasRights = true;
          allRights = fo.legalRights; // Use latest round's rights for display
        }
      }
    });

    // Key rights badges (from latest round with rights)
    var keyRightsList = ['boardSeat', 'antiDilution', 'liquidationPref', 'proRata', 'rofr', 'informationRights'];
    var rightsPreview = keyRightsList.filter(function (k) {
      return allRights[k] && allRights[k].enabled;
    }).slice(0, 4).map(function (k) {
      return '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; font-size: 10px; margin: 1px; white-space: nowrap;">' + rightsLabels[k] + '</span>';
    }).join('');

    var totalRightsCount = keyRightsList.filter(function (k) { return allRights[k] && allRights[k].enabled; }).length;
    if (totalRightsCount > 4) {
      rightsPreview += '<span class="badge" style="background: rgba(99, 102, 241, 0.1); color: #818cf8; font-size: 10px;">+' + (totalRightsCount - 4) + '</span>';
    }

    var statusDot = hasRights ?
      '<span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;" title="Rights documented"></span>' :
      '<span style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; display: inline-block;" title="No rights documented"></span>';

    return '\
      <div class="card legal-company-card" style="padding: 16px; margin-bottom: 12px; cursor: pointer;" data-company-id="' + company.id + '">\
        <div style="display: flex; justify-content: space-between; align-items: center;">\
          <div style="display: flex; gap: 12px; align-items: center;">\
            <div style="width: 44px; height: 44px; border-radius: 10px; background: ' + avatarColor.bg + '; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; color: ' + avatarColor.text + ';">\
              ' + Utils.getInitials(company.name) + '\
            </div>\
            <div>\
              <div style="display: flex; align-items: center; gap: 8px;">\
                <span style="font-weight: 600; font-size: 15px;">' + company.name + '</span>\
                ' + statusDot + '\
              </div>\
              <div class="text-xs text-muted">' + company.industry + ' • ' + roundCount + ' round' + (roundCount > 1 ? 's' : '') + ' • ' + docsCount + ' docs</div>\
            </div>\
          </div>\
          <div style="display: flex; align-items: center; gap: 20px;">\
            <div style="text-align: center;">\
              <div class="text-xs text-muted">Latest Round</div>\
              <div><span class="badge ' + Utils.getStageBadgeClass(latestRound) + '" style="font-size: 10px;">' + latestRound + '</span></div>\
              <div class="text-xs text-muted" style="margin-top: 2px;">' + Utils.formatDate(latestDate) + '</div>\
            </div>\
            <div style="text-align: center;">\
              <div class="text-xs text-muted">Ownership</div>\
              <div style="font-weight: 600;">' + Utils.formatPercent(company.ownership) + '</div>\
            </div>\
            <div style="text-align: center;">\
              <div class="text-xs text-muted">Total Invested</div>\
              <div style="font-weight: 600; color: var(--color-accent-tertiary);">' + Utils.formatCurrency(company.totalInvested) + '</div>\
            </div>\
            <div style="min-width: 180px;">\
              <div class="text-xs text-muted mb-1">Key Rights</div>\
              <div style="display: flex; flex-wrap: wrap; gap: 2px;">' + (rightsPreview || '<span class="text-muted text-xs">No rights set</span>') + '</div>\
            </div>\
            <div style="color: var(--color-text-tertiary);">→</div>\
          </div>\
        </div>\
      </div>';
  }

  function renderCompanyLegalModal(company) {
    var rounds = [];

    // Initial round
    rounds.push({
      label: company.entryStage + ' (Initial)',
      date: company.entryDate,
      amount: company.initialInvestment,
      documents: company.documents || [],
      rights: company.legalRights || {},
      roundType: 'initial',
      roundIndex: 0
    });

    // Follow-ons where we invested
    (company.followOns || []).forEach(function (fo, idx) {
      if (fo.didWeInvest) {
        rounds.push({
          label: fo.round,
          date: fo.date,
          amount: fo.ourInvestment || 0,
          documents: fo.documents || [],
          rights: fo.legalRights || {},
          roundType: 'followon',
          roundIndex: idx
        });
      }
    });

    var roundsHtml = rounds.map(function (r, idx) {
      var isFirst = idx === 0;
      var rightsBadges = Object.keys(rightsLabels).filter(function (key) {
        return r.rights[key] && r.rights[key].enabled;
      }).map(function (key) {
        var detail = r.rights[key].details ? ' (' + r.rights[key].details + ')' : '';
        return '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; margin: 2px; font-size: 11px;">' + rightsLabels[key] + detail + '</span>';
      }).join('');

      var docsHtml = r.documents.length > 0 ? r.documents.map(function (d) {
        return '<a href="' + d.url + '" target="_blank" class="btn btn-sm btn-ghost" style="font-size: 11px;">📄 ' + d.type + '</a>';
      }).join(' ') : '<span class="text-muted text-sm">No documents</span>';

      return '\
        <div style="padding: 16px; background: var(--color-bg-tertiary); border-radius: 8px; margin-bottom: 12px;">\
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">\
            <div style="display: flex; align-items: center; gap: 10px;">\
              <span class="badge ' + Utils.getStageBadgeClass(r.label.split(' ')[0]) + '">' + r.label + '</span>\
              <span class="text-sm text-muted">' + Utils.formatDate(r.date) + '</span>\
              <span style="font-weight: 600; color: var(--color-accent-tertiary);">' + Utils.formatCurrency(r.amount) + '</span>\
            </div>\
            <button class="btn btn-sm btn-ghost edit-round-legal-btn" data-company-id="' + company.id + '" data-round-type="' + r.roundType + '" data-round-index="' + r.roundIndex + '">✏️ Edit</button>\
          </div>\
          <div style="margin-bottom: 8px;">\
            <div class="text-xs text-muted mb-1">Documents</div>\
            <div>' + docsHtml + '</div>\
          </div>\
          <div>\
            <div class="text-xs text-muted mb-1">Rights & Terms</div>\
            <div style="display: flex; flex-wrap: wrap; gap: 2px;">' + (rightsBadges || '<span class="text-muted text-sm">No rights specified</span>') + '</div>\
            ' + (r.rights.customTerms ? '<div class="text-xs text-muted" style="margin-top: 8px; padding: 8px; background: var(--color-bg-secondary); border-radius: 4px;">📝 ' + r.rights.customTerms + '</div>' : '') + '\
          </div>\
        </div>';
    }).join('');

    return '\
      <div class="modal-overlay" id="company-legal-modal">\
        <div class="modal" style="max-width: 700px; max-height: 85vh; overflow-y: auto;">\
          <div class="modal-header">\
            <h2 class="modal-title">' + company.name + ' - Legal & Rights</h2>\
            <button class="modal-close" id="close-company-legal-modal">&times;</button>\
          </div>\
          <div class="modal-body">\
            <div style="display: flex; gap: 16px; margin-bottom: 20px; padding: 12px; background: var(--color-bg-secondary); border-radius: 8px;">\
              <div>\
                <div class="text-xs text-muted">Total Invested</div>\
                <div style="font-weight: 700; font-size: 18px; color: var(--color-accent-tertiary);">' + Utils.formatCurrency(company.totalInvested) + '</div>\
              </div>\
              <div>\
                <div class="text-xs text-muted">Current Ownership</div>\
                <div style="font-weight: 700; font-size: 18px;">' + Utils.formatPercent(company.ownership) + '</div>\
              </div>\
              <div>\
                <div class="text-xs text-muted">Investment Rounds</div>\
                <div style="font-weight: 700; font-size: 18px;">' + rounds.length + '</div>\
              </div>\
            </div>\
            <h4 style="margin-bottom: 12px;">Investment Rounds</h4>\
            ' + roundsHtml + '\
          </div>\
          <div class="modal-footer">\
            <button class="btn btn-secondary" id="close-company-legal-btn">Close</button>\
          </div>\
        </div>\
      </div>';
  }

  function initEvents() {
    var pageContent = document.getElementById('page-content');
    var modalContainer = document.getElementById('modal-container');

    // Search with debounce
    var searchTimeout;
    pageContent.addEventListener('input', function (e) {
      if (e.target.id === 'legal-search') {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
          filters.search = e.target.value;
          pageContent.innerHTML = render();
        }, 300);
      }
    });

    // Click events
    pageContent.addEventListener('click', function (e) {
      if (e.target.id === 'clear-legal-filters') {
        filters.search = '';
        pageContent.innerHTML = render();
      }

      // Click on company card to open modal
      var companyCard = e.target.closest('.legal-company-card');
      if (companyCard) {
        var companyId = companyCard.dataset.companyId;
        var company = Data.getCompanyById(companyId);
        modalContainer.innerHTML = renderCompanyLegalModal(company);
      }
    });

    // Modal events
    modalContainer.addEventListener('click', function (e) {
      // Close company legal modal
      if (e.target.id === 'close-company-legal-modal' || e.target.id === 'close-company-legal-btn' || e.target.id === 'company-legal-modal') {
        modalContainer.innerHTML = '';
      }

      // Edit round legal - opens edit modal
      if (e.target.classList.contains('edit-round-legal-btn')) {
        var companyId = e.target.dataset.companyId;
        var roundType = e.target.dataset.roundType;
        var roundIndex = parseInt(e.target.dataset.roundIndex);

        var company = Data.getCompanyById(companyId);
        var docs, rights;

        if (roundType === 'initial') {
          docs = company.documents || [];
          rights = company.legalRights || {};
        } else {
          var fo = company.followOns && company.followOns[roundIndex];
          docs = fo ? (fo.documents || []) : [];
          rights = fo ? (fo.legalRights || {}) : {};
        }

        window.tempLegalDocs = docs.slice();
        window.currentLegalCompanyId = companyId;
        modalContainer.innerHTML = Components.renderLegalEditModal(company, roundType === 'initial' ? 'initial' : roundIndex.toString(), roundIndex, docs, rights);
      }

      // Close legal edit modal
      if (e.target.id === 'close-legal-modal' || e.target.id === 'cancel-legal-modal') {
        // Re-open company modal
        if (window.currentLegalCompanyId) {
          var company = Data.getCompanyById(window.currentLegalCompanyId);
          modalContainer.innerHTML = renderCompanyLegalModal(company);
        } else {
          modalContainer.innerHTML = '';
        }
        window.tempLegalDocs = [];
      }

      // Add document form toggle
      if (e.target.id === 'add-doc-btn') {
        document.getElementById('add-doc-form').style.display = 'block';
      }
      if (e.target.id === 'cancel-doc-btn') {
        document.getElementById('add-doc-form').style.display = 'none';
      }

      // Save new document (URL or file upload)
      if (e.target.id === 'save-doc-btn') {
        var type = document.getElementById('new-doc-type').value;
        var url = document.getElementById('new-doc-url').value;
        var fileInput = document.getElementById('new-doc-file');
        var file = fileInput && fileInput.files && fileInput.files[0];
        var statusDiv = document.getElementById('upload-status');

        // If file is selected, upload to Supabase
        if (file) {
          // Check file size (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            statusDiv.style.display = 'block';
            statusDiv.style.background = 'rgba(239, 68, 68, 0.2)';
            statusDiv.style.color = '#f87171';
            statusDiv.textContent = 'File too large. Max 10MB allowed.';
            return;
          }

          // Show uploading status
          statusDiv.style.display = 'block';
          statusDiv.style.background = 'rgba(59, 130, 246, 0.2)';
          statusDiv.style.color = '#60a5fa';
          statusDiv.textContent = '⏳ Uploading...';

          var companyId = document.getElementById('legal-company-id').value;
          var roundType = document.getElementById('legal-round-type').value;

          FamilyOffice.Supabase.uploadFile(file, companyId, roundType, function (result) {
            if (result.success) {
              window.tempLegalDocs = window.tempLegalDocs || [];
              window.tempLegalDocs.push({
                type: type,
                url: result.url,
                fileName: result.fileName,
                filePath: result.path,
                addedAt: new Date().toISOString(),
                isUploaded: true
              });
              refreshDocsListInModal();
              document.getElementById('add-doc-form').style.display = 'none';
              fileInput.value = '';
              statusDiv.style.display = 'none';
            } else {
              statusDiv.style.background = 'rgba(239, 68, 68, 0.2)';
              statusDiv.style.color = '#f87171';
              statusDiv.textContent = '❌ Upload failed: ' + result.error;
            }
          });
        } else if (url) {
          // Just add URL link
          window.tempLegalDocs = window.tempLegalDocs || [];
          window.tempLegalDocs.push({ type: type, url: url, addedAt: new Date().toISOString() });
          refreshDocsListInModal();
          document.getElementById('add-doc-form').style.display = 'none';
          document.getElementById('new-doc-url').value = '';
        }
      }

      // Delete document
      if (e.target.classList.contains('delete-doc-btn')) {
        var idx = parseInt(e.target.dataset.index);
        window.tempLegalDocs.splice(idx, 1);
        refreshDocsListInModal();
      }

      // Save legal data
      if (e.target.id === 'save-legal-btn') {
        saveLegalData();
      }
    });
  }

  function refreshDocsListInModal() {
    var docsListHtml = window.tempLegalDocs.map(function (d, i) {
      var uploadBadge = d.isUploaded ? '<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 9px; margin-left: 4px;">☁️ Uploaded</span>' : '';
      var displayName = d.fileName || d.type;
      return '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--color-bg-tertiary); border-radius: 6px; margin-bottom: 4px;">' +
        '<span>📄 ' + d.type + uploadBadge + (d.fileName ? '<span class="text-xs text-muted" style="margin-left: 6px;">' + d.fileName + '</span>' : '') + '</span>' +
        '<div style="display: flex; gap: 8px;">' +
        '<a href="' + d.url + '" target="_blank" class="btn btn-ghost btn-sm">' + (d.isUploaded ? 'Download' : 'Open') + '</a>' +
        '<button type="button" class="btn btn-ghost btn-sm delete-doc-btn" data-index="' + i + '">🗑️</button>' +
        '</div></div>';
    }).join('') || '<div class="text-sm text-muted">No documents linked</div>';
    document.getElementById('docs-list').innerHTML = docsListHtml;
  }

  function saveLegalData() {
    var companyId = document.getElementById('legal-company-id').value;
    var roundType = document.getElementById('legal-round-type').value;
    var roundIndex = parseInt(document.getElementById('legal-round-index').value);

    var rightsFields = ['boardSeat', 'observer', 'boardComposition', 'preEmptive', 'antiDilution',
      'proRata', 'rofr', 'tagAlong', 'dragAlong', 'liquidationPref', 'conversionRights',
      'vestingSchedule', 'informationRights'];

    var rights = {};
    rightsFields.forEach(function (key) {
      var checkbox = document.querySelector('[name="' + key + '-enabled"]');
      var details = document.querySelector('[name="' + key + '-details"]');
      rights[key] = {
        enabled: checkbox ? checkbox.checked : false,
        details: details ? details.value : ''
      };
    });
    rights.customTerms = document.getElementById('custom-terms').value;

    var company = Data.getCompanyById(companyId);
    if (roundType === 'initial') {
      company.documents = window.tempLegalDocs || [];
      company.legalRights = rights;
    } else {
      if (company.followOns && company.followOns[roundIndex]) {
        company.followOns[roundIndex].documents = window.tempLegalDocs || [];
        company.followOns[roundIndex].legalRights = rights;
      }
    }

    Data.updateCompany(companyId, company);
    window.tempLegalDocs = [];

    // Re-open company modal to show updated data
    var modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = renderCompanyLegalModal(company);

    // Refresh the legal page in background
    document.getElementById('page-content').innerHTML = render();
  }

  return {
    render: render,
    initEvents: initEvents
  };
})();
