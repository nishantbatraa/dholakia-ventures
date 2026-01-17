// ============================================
// PORTFOLIO VIEW - Global scope (no ES modules)
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Portfolio = (function () {
    var Utils = FamilyOffice.Utils;
    var Data = FamilyOffice.Data;
    var Components = FamilyOffice.Components;

    var currentView = 'board';
    var currentFilters = {
        industry: 'all',
        stage: 'all',
        status: 'all',
        dealSourcer: 'all',
        search: ''
    };
    var currentEditId = null;
    var deleteId = null;

    function render() {
        var companies = Data.getCompanies();
        var filteredCompanies = Utils.filterCompanies(companies, currentFilters);

        return '\
      <div class="animate-fadeIn">\
        <div class="flex justify-between items-center mb-6">\
          ' + Components.renderViewToggle(currentView) + '\
          <div class="text-sm text-muted">' + filteredCompanies.length + ' companies</div>\
        </div>\
        ' + Components.renderFilterBar(currentFilters) + '\
        <div id="portfolio-content">\
          ' + (currentView === 'board' ? renderBoardView(filteredCompanies) : renderTableView(filteredCompanies)) + '\
        </div>\
      </div>';
    }

    function renderBoardView(companies) {
        // Use Data.STAGES plus Exited and Written Off for the board columns
        var stages = Data.STAGES.concat(['Exited', 'Written Off']);
        var byStage = {};

        stages.forEach(function (stage) {
            if (stage === 'Exited') {
                // Show companies in Exited column if status is 'Exited' OR currentStage is 'Exited'
                byStage[stage] = companies.filter(function (c) {
                    return c.status === 'Exited' || c.currentStage === 'Exited';
                });
            } else if (stage === 'Written Off') {
                // Show companies in Written Off column if status is 'Written-off' OR currentStage is 'Written Off'
                byStage[stage] = companies.filter(function (c) {
                    return c.status === 'Written-off' || c.currentStage === 'Written Off';
                });
            } else {
                byStage[stage] = companies.filter(function (c) {
                    // Use currentStage, fallback to entryStage
                    var companyStage = c.currentStage || c.entryStage;
                    // Treat null/undefined/Active status as Active
                    var companyStatus = c.status || 'Active';
                    // Don't show in regular columns if status is Exited/Written-off or currentStage is Exited/Written Off
                    return companyStage === stage &&
                        companyStatus !== 'Exited' &&
                        companyStatus !== 'Written-off' &&
                        companyStage !== 'Exited' &&
                        companyStage !== 'Written Off';
                });
            }
        });


        return '<div class="board-container">' +
            stages.map(function (stage) {
                return Components.renderStageColumn(stage, byStage[stage] || []);
            }).join('') +
            '</div>';
    }

    function renderTableView(companies) {
        if (companies.length === 0) {
            return Components.renderEmptyState(
                '📂',
                'No companies found',
                'Try adjusting your filters or add a new company to your portfolio.',
                'Add Company',
                'empty-add-company-btn'
            );
        }
        return Components.renderCompanyTable(companies);
    }

    function refreshContent() {
        var content = document.getElementById('portfolio-content');
        if (!content) return;

        var companies = Data.getCompanies();
        var filteredCompanies = Utils.filterCompanies(companies, currentFilters);

        // Update count
        var countEl = document.querySelector('.flex.justify-between .text-sm.text-muted');
        if (countEl) {
            countEl.textContent = filteredCompanies.length + ' companies';
        }

        // Update view toggle
        document.querySelectorAll('.tab').forEach(function (tab) {
            if (tab.dataset.view === currentView) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        content.innerHTML = currentView === 'board' ? renderBoardView(filteredCompanies) : renderTableView(filteredCompanies);
    }

    function initEvents() {
        var pageContent = document.getElementById('page-content');
        var modalContainer = document.getElementById('modal-container');

        // View Toggle
        pageContent.addEventListener('click', function (e) {
            var tab = e.target.closest('.tab');
            if (tab && tab.dataset.view) {
                currentView = tab.dataset.view;
                refreshContent();
            }

            // Company card click
            var companyCard = e.target.closest('.company-card');
            if (companyCard) {
                openCompanyDetail(companyCard.dataset.companyId);
            }

            // Table row click
            var tableRow = e.target.closest('.table-row-clickable');
            if (tableRow && !e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
                openCompanyDetail(tableRow.dataset.companyId);
            }

            // Edit button
            var editBtn = e.target.closest('.edit-btn');
            if (editBtn) {
                e.stopPropagation();
                openEditModal(editBtn.dataset.id);
            }

            // Delete button
            var deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                e.stopPropagation();
                openDeleteConfirm(deleteBtn.dataset.id);
            }

            // Empty state add button
            if (e.target.id === 'empty-add-company-btn') {
                openAddModal();
            }
        });

        // Filter changes
        pageContent.addEventListener('change', function (e) {
            if (e.target.id === 'filter-industry') {
                currentFilters.industry = e.target.value;
                refreshContent();
            }
            if (e.target.id === 'filter-stage') {
                currentFilters.stage = e.target.value;
                refreshContent();
            }
            if (e.target.id === 'filter-status') {
                currentFilters.status = e.target.value;
                refreshContent();
            }
            if (e.target.id === 'filter-deal-sourcer') {
                currentFilters.dealSourcer = e.target.value;
                refreshContent();
            }
        });

        // Search
        var searchTimeout;
        pageContent.addEventListener('input', function (e) {
            if (e.target.id === 'filter-search') {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function () {
                    currentFilters.search = e.target.value;
                    refreshContent();
                }, 300);
            }
        });

        // Add company button
        var addBtn = document.getElementById('add-company-btn');
        if (addBtn) {
            addBtn.addEventListener('click', openAddModal);
        }

        // Import CSV dropdown
        var importBtn = document.getElementById('import-csv-btn');
        var importMenu = document.getElementById('import-dropdown-menu');
        if (importBtn && importMenu) {
            importBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                importMenu.classList.toggle('show');
            });
            // Close dropdown when clicking outside
            document.addEventListener('click', function () {
                importMenu.classList.remove('show');
            });
        }
        // Import companies handler
        var importCompaniesBtn = document.getElementById('import-companies-btn');
        if (importCompaniesBtn) {
            importCompaniesBtn.addEventListener('click', function () {
                if (importMenu) importMenu.classList.remove('show');
                if (FamilyOffice.CSVImport) FamilyOffice.CSVImport.openImportModal();
            });
        }
        // Import follow-on rounds handler
        var importFollowonsBtn = document.getElementById('import-followons-btn');
        if (importFollowonsBtn) {
            importFollowonsBtn.addEventListener('click', function () {
                if (importMenu) importMenu.classList.remove('show');
                if (FamilyOffice.CSVImport) FamilyOffice.CSVImport.openFollowOnImportModal();
            });
        }

        // Modal events
        modalContainer.addEventListener('click', function (e) {
            // Close modal when clicking overlay or close button (use closest for button with icon)
            if (e.target.id === 'modal-overlay' || e.target.closest('#modal-close')) {
                closeModal();
            }
            if (e.target.id === 'modal-cancel' || e.target.closest('#modal-cancel')) {
                closeModal();
            }
            if (e.target.id === 'modal-save' || e.target.closest('#modal-save')) {
                saveCompany();
            }
            if (e.target.id === 'detail-edit-btn' || e.target.closest('#detail-edit-btn')) {
                var btn = e.target.closest('#detail-edit-btn') || e.target;
                var companyId = btn.dataset.id;
                closeModal();
                setTimeout(function () { openEditModal(companyId); }, 100);
            }
            if (e.target.id === 'detail-delete-btn' || e.target.closest('#detail-delete-btn')) {
                var btn = e.target.closest('#detail-delete-btn') || e.target;
                var companyId = btn.dataset.id;
                closeModal();
                setTimeout(function () { openDeleteConfirm(companyId); }, 100);
            }
            if (e.target.id === 'confirm-overlay' || e.target.id === 'confirm-close' || e.target.closest('#confirm-close') || e.target.id === 'confirm-cancel' || e.target.closest('#confirm-cancel')) {
                closeConfirm();
            }
            if (e.target.id === 'confirm-ok' || e.target.closest('#confirm-ok')) {
                confirmDelete();
            }

            // Legal Edit Modal handlers
            if (e.target.classList.contains('edit-legal-btn')) {
                var companyId = e.target.dataset.companyId;
                var roundType = e.target.dataset.round;
                var company = Data.getCompanyById(companyId);
                var docs, rights, roundIndex = 0;

                if (roundType === 'initial') {
                    docs = company.documents || [];
                    rights = company.legalRights || {};
                } else {
                    roundIndex = parseInt(roundType);
                    var fo = company.followOns && company.followOns[roundIndex];
                    docs = fo ? (fo.documents || []) : [];
                    rights = fo ? (fo.legalRights || {}) : {};
                }

                // Store temp docs for this modal session
                window.tempLegalDocs = docs.slice();

                modalContainer.innerHTML = Components.renderLegalEditModal(company, roundType, roundIndex, docs, rights);
            }

            // Close legal modal
            if (e.target.id === 'close-legal-modal' || e.target.id === 'cancel-legal-modal' || e.target.id === 'legal-edit-modal') {
                if (e.target.id === 'legal-edit-modal' && e.target !== e.currentTarget) return;
                window.tempLegalDocs = [];
                modalContainer.innerHTML = '';
            }

            // Add document form toggle
            if (e.target.id === 'add-doc-btn') {
                document.getElementById('add-doc-form').style.display = 'block';
            }
            if (e.target.id === 'cancel-doc-btn') {
                document.getElementById('add-doc-form').style.display = 'none';
            }

            // Save new document
            if (e.target.id === 'save-doc-btn') {
                var type = document.getElementById('new-doc-type').value;
                var url = document.getElementById('new-doc-url').value;
                if (url) {
                    window.tempLegalDocs = window.tempLegalDocs || [];
                    window.tempLegalDocs.push({ type: type, url: url, addedAt: new Date().toISOString() });

                    var docsListHtml = window.tempLegalDocs.map(function (d, i) {
                        return '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--color-bg-tertiary); border-radius: 6px; margin-bottom: 4px;">' +
                            '<span>📄 ' + d.type + '</span>' +
                            '<div style="display: flex; gap: 8px;">' +
                            '<a href="' + d.url + '" target="_blank" class="btn btn-ghost btn-sm">Open</a>' +
                            '<button type="button" class="btn btn-ghost btn-sm delete-doc-btn" data-index="' + i + '">🗑️</button>' +
                            '</div></div>';
                    }).join('') || '<div class="text-sm text-muted">No documents linked</div>';

                    document.getElementById('docs-list').innerHTML = docsListHtml;
                    document.getElementById('add-doc-form').style.display = 'none';
                    document.getElementById('new-doc-url').value = '';
                }
            }

            // Delete document
            if (e.target.classList.contains('delete-doc-btn')) {
                var idx = parseInt(e.target.dataset.index);
                window.tempLegalDocs.splice(idx, 1);

                var docsListHtml = window.tempLegalDocs.map(function (d, i) {
                    return '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--color-bg-tertiary); border-radius: 6px; margin-bottom: 4px;">' +
                        '<span>📄 ' + d.type + '</span>' +
                        '<div style="display: flex; gap: 8px;">' +
                        '<a href="' + d.url + '" target="_blank" class="btn btn-ghost btn-sm">Open</a>' +
                        '<button type="button" class="btn btn-ghost btn-sm delete-doc-btn" data-index="' + i + '">🗑️</button>' +
                        '</div></div>';
                }).join('') || '<div class="text-sm text-muted">No documents linked</div>';

                document.getElementById('docs-list').innerHTML = docsListHtml;
            }

            // Save legal data
            if (e.target.id === 'save-legal-btn') {
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
                modalContainer.innerHTML = '';

                // Refresh the detail modal
                openCompanyDetail(companyId);
            }
        });

        // Show/hide exit value field and auto-sync stages
        modalContainer.addEventListener('change', function (e) {
            if (e.target.name === 'status') {
                var exitGroup = document.getElementById('exit-fields-group');
                if (exitGroup) {
                    exitGroup.style.display = e.target.value === 'Exited' ? 'flex' : 'none';
                }
            }
            // Auto-sync Entry Stage to Current Stage if Current Stage is empty
            if (e.target.name === 'entryStage') {
                var currentStageSelect = document.querySelector('select[name="currentStage"]');
                if (currentStageSelect && !currentStageSelect.value) {
                    currentStageSelect.value = e.target.value;
                }
            }
            // Auto-sync status to 'Exited' when currentStage is 'Exited'
            if (e.target.name === 'currentStage' && e.target.value === 'Exited') {
                var statusSelect = document.querySelector('select[name="status"]');
                if (statusSelect) {
                    statusSelect.value = 'Exited';
                    // Also show exit fields
                    var exitGroup = document.getElementById('exit-fields-group');
                    if (exitGroup) exitGroup.style.display = 'flex';
                }
            }
        });

        // Add New functionality for dynamic dropdowns
        modalContainer.addEventListener('click', function (e) {
            // Industry Add button
            if (e.target.id === 'add-industry-btn') {
                document.getElementById('add-industry-input').style.display = 'flex';
                document.getElementById('new-industry-name').focus();
            }
            if (e.target.id === 'cancel-industry-btn') {
                document.getElementById('add-industry-input').style.display = 'none';
                document.getElementById('new-industry-name').value = '';
            }
            if (e.target.id === 'save-industry-btn') {
                var inputEl = document.getElementById('new-industry-name');
                var name = inputEl.value.trim();
                if (name && Data.addCustomIndustry(name)) {
                    // Re-render the form to refresh dropdown
                    refreshModalForm();
                    // Select the newly added option
                    setTimeout(function () {
                        var select = document.querySelector('select[name="industry"]');
                        if (select) select.value = name;
                    }, 50);
                } else if (name) {
                    alert('Industry already exists or invalid name');
                }
                inputEl.value = '';
                document.getElementById('add-industry-input').style.display = 'none';
            }

            // Deal Sourcer Add button
            if (e.target.id === 'add-sourcer-btn') {
                document.getElementById('add-sourcer-input').style.display = 'flex';
                document.getElementById('new-sourcer-name').focus();
            }
            if (e.target.id === 'cancel-sourcer-btn') {
                document.getElementById('add-sourcer-input').style.display = 'none';
                document.getElementById('new-sourcer-name').value = '';
            }
            if (e.target.id === 'save-sourcer-btn') {
                var inputEl = document.getElementById('new-sourcer-name');
                var name = inputEl.value.trim();
                if (name && Data.addCustomTeamMember(name)) {
                    refreshModalForm();
                    setTimeout(function () {
                        var select = document.querySelector('select[name="dealSourcer"]');
                        if (select) select.value = name;
                    }, 50);
                } else if (name) {
                    alert('Team member already exists or invalid name');
                }
                inputEl.value = '';
                document.getElementById('add-sourcer-input').style.display = 'none';
            }

            // Analyst Add button
            if (e.target.id === 'add-analyst-btn') {
                document.getElementById('add-analyst-input').style.display = 'flex';
                document.getElementById('new-analyst-name').focus();
            }
            if (e.target.id === 'cancel-analyst-btn') {
                document.getElementById('add-analyst-input').style.display = 'none';
                document.getElementById('new-analyst-name').value = '';
            }
            if (e.target.id === 'save-analyst-btn') {
                var inputEl = document.getElementById('new-analyst-name');
                var name = inputEl.value.trim();
                if (name && Data.addCustomTeamMember(name)) {
                    refreshModalForm();
                    setTimeout(function () {
                        var select = document.querySelector('select[name="analyst"]');
                        if (select) select.value = name;
                    }, 50);
                } else if (name) {
                    alert('Team member already exists or invalid name');
                }
                inputEl.value = '';
                document.getElementById('add-analyst-input').style.display = 'none';
            }

            // HQ Location Add button
            if (e.target.id === 'add-hq-btn') {
                document.getElementById('add-hq-input').style.display = 'flex';
                document.getElementById('new-hq-name').focus();
            }
            if (e.target.id === 'cancel-hq-btn') {
                document.getElementById('add-hq-input').style.display = 'none';
                document.getElementById('new-hq-name').value = '';
            }
            if (e.target.id === 'save-hq-btn') {
                var inputEl = document.getElementById('new-hq-name');
                var name = inputEl.value.trim();
                if (name && Data.addCustomHQLocation(name)) {
                    refreshModalForm();
                    setTimeout(function () {
                        var select = document.querySelector('select[name="hq"]');
                        if (select) select.value = name;
                    }, 50);
                } else if (name) {
                    alert('HQ location already exists or invalid name');
                }
                inputEl.value = '';
                document.getElementById('add-hq-input').style.display = 'none';
            }

            // Quick add founder from company form
            if (e.target.id === 'quick-add-founder-btn') {
                var inputEl = document.getElementById('quick-add-founder-name');
                var name = inputEl.value.trim();
                if (name) {
                    // Create founder with just name
                    var newFounder = Data.addFounder({ name: name, role: 'Founder' });
                    if (newFounder) {
                        // Refresh the founders section only
                        refreshModalForm();
                        // Check the new founder checkbox after refresh
                        setTimeout(function () {
                            var checkbox = document.querySelector('[name="founderIds"][value="' + newFounder.id + '"]');
                            if (checkbox) checkbox.checked = true;
                        }, 50);
                    }
                    inputEl.value = '';
                } else {
                    inputEl.focus();
                }
            }
            // Manage buttons - Open manage modal
            if (e.target.id === 'manage-industry-btn' || e.target.closest && e.target.closest('#manage-industry-btn')) {
                openManageModal('industry', Data.getAllIndustries(), function (name) { return Data.isCustomIndustry(name); }, 'Manage Industries');
            }
            if (e.target.id === 'manage-team-btn' || e.target.closest && e.target.closest('#manage-team-btn')) {
                openManageModal('team', Data.getAllTeamMembers(), function (name) { return Data.isCustomTeamMember(name); }, 'Manage Team Members');
            }
            if (e.target.id === 'manage-hq-btn' || e.target.closest && e.target.closest('#manage-hq-btn')) {
                openManageModal('hq', Data.getAllHQLocations(), function (name) { return Data.isCustomHQLocation(name); }, 'Manage HQ Locations');
            }

            // Manage modal - Remove option
            if (e.target.classList.contains('remove-option-btn')) {
                var type = e.target.dataset.type;
                var name = e.target.dataset.name;
                if (type === 'industry') {
                    Data.removeIndustry(name);
                } else if (type === 'team') {
                    Data.removeTeamMember(name);
                } else if (type === 'hq') {
                    Data.removeHQLocation(name);
                }
                // Refresh manage modal
                e.target.closest('.manage-option-item').remove();
                refreshModalForm();
            }

            // Manage modal - Close/Done
            if (e.target.id === 'manage-options-close' || e.target.id === 'manage-options-done' || e.target.id === 'manage-options-overlay') {
                var manageOverlay = document.getElementById('manage-options-overlay');
                if (manageOverlay) manageOverlay.remove();
            }

            // Follow-on Rounds - Show add form
            if (e.target.id === 'add-followon-btn' || e.target.closest('#add-followon-btn')) {
                var addForm = document.getElementById('add-followon-form');
                if (addForm) addForm.style.display = 'block';
            }

            // Follow-on Rounds - Cancel add form
            if (e.target.id === 'cancel-followon-btn') {
                var addForm = document.getElementById('add-followon-form');
                if (addForm) {
                    addForm.style.display = 'none';
                    // Clear the form
                    document.getElementById('followon-date').value = '';
                    document.getElementById('followon-our-investment').value = '';
                    document.getElementById('followon-total-raised').value = '';
                    document.getElementById('followon-valuation').value = '';
                    document.getElementById('followon-ownership').value = '';
                    // Reset edit mode
                    window.editFollowOnIndex = undefined;
                    // Reset button text and form title
                    var saveBtn = document.getElementById('save-followon-btn');
                    if (saveBtn) saveBtn.textContent = 'Add Round';
                    var formTitle = addForm.querySelector('h4');
                    if (formTitle) formTitle.textContent = 'Add Follow-on Round';
                }
            }

            // Follow-on Rounds - Save new follow-on (or update existing)
            if (e.target.id === 'save-followon-btn') {
                var date = document.getElementById('followon-date').value;
                var round = document.getElementById('followon-round').value;
                var didWeInvest = document.getElementById('followon-invested').value === 'true';
                var ourInvestment = parseFloat(document.getElementById('followon-our-investment').value) || 0;
                var totalRaised = parseFloat(document.getElementById('followon-total-raised').value) || 0;
                var roundValuation = parseFloat(document.getElementById('followon-valuation').value) || 0;
                var ownershipAfter = parseFloat(document.getElementById('followon-ownership').value) || 0;

                if (!date) {
                    alert('Please enter a round date');
                    return;
                }

                var followOnData = {
                    date: date,
                    round: round,
                    didWeInvest: didWeInvest,
                    ourInvestment: ourInvestment,
                    totalRaised: totalRaised,
                    roundValuation: roundValuation,
                    ownershipAfter: ownershipAfter
                };

                // Check if we're editing or adding
                if (!window.tempFollowOns) window.tempFollowOns = [];

                if (window.editFollowOnIndex !== undefined) {
                    // Update existing entry
                    window.tempFollowOns[window.editFollowOnIndex] = followOnData;
                    window.editFollowOnIndex = undefined; // Clear edit mode
                } else {
                    // Add new entry
                    window.tempFollowOns.push(followOnData);
                }

                // Update the list display
                var listEl = document.getElementById('followons-list');
                if (listEl) {
                    listEl.innerHTML = Components.renderFollowOnsList(window.tempFollowOns);
                }

                // Hide and clear the form
                var addForm = document.getElementById('add-followon-form');
                addForm.style.display = 'none';
                document.getElementById('followon-date').value = '';
                document.getElementById('followon-our-investment').value = '';
                document.getElementById('followon-total-raised').value = '';
                document.getElementById('followon-valuation').value = '';
                document.getElementById('followon-ownership').value = '';

                // Reset button text and form title
                var saveBtn = document.getElementById('save-followon-btn');
                if (saveBtn) saveBtn.textContent = 'Add Round';
                var formTitle = addForm.querySelector('h4');
                if (formTitle) formTitle.textContent = 'Add Follow-on Round';
            }

            // Follow-on Rounds - Edit follow-on
            if (e.target.closest('.edit-followon-btn')) {
                var index = parseInt(e.target.closest('.edit-followon-btn').dataset.index);
                if (window.tempFollowOns && !isNaN(index) && window.tempFollowOns[index]) {
                    var fo = window.tempFollowOns[index];
                    // Show the add form and populate with existing data
                    var addForm = document.getElementById('add-followon-form');
                    if (addForm) {
                        addForm.style.display = 'block';
                        // Populate form fields
                        document.getElementById('followon-date').value = fo.date || '';
                        document.getElementById('followon-round').value = fo.round || 'Seed';
                        document.getElementById('followon-invested').value = fo.didWeInvest !== false ? 'true' : 'false';
                        document.getElementById('followon-our-investment').value = fo.ourInvestment || fo.amount || '';
                        document.getElementById('followon-total-raised').value = fo.totalRaised || '';
                        document.getElementById('followon-valuation').value = fo.roundValuation || '';
                        document.getElementById('followon-ownership').value = fo.ownershipAfter || '';

                        // Store edit index for save
                        window.editFollowOnIndex = index;

                        // Update button text
                        var saveBtn = document.getElementById('save-followon-btn');
                        if (saveBtn) saveBtn.textContent = 'Update Round';

                        // Update form title
                        var formTitle = addForm.querySelector('h4');
                        if (formTitle) formTitle.textContent = 'Edit Follow-on Round';
                    }
                }
            }

            // Follow-on Rounds - Delete follow-on
            if (e.target.closest('.delete-followon-btn')) {
                var index = parseInt(e.target.closest('.delete-followon-btn').dataset.index);
                if (window.tempFollowOns && !isNaN(index)) {
                    window.tempFollowOns.splice(index, 1);
                    var listEl = document.getElementById('followons-list');
                    if (listEl) {
                        listEl.innerHTML = Components.renderFollowOnsList(window.tempFollowOns);
                    }
                    // Clear edit mode if we deleted the item being edited
                    if (window.editFollowOnIndex === index) {
                        window.editFollowOnIndex = undefined;
                        var addForm = document.getElementById('add-followon-form');
                        if (addForm) addForm.style.display = 'none';
                    } else if (window.editFollowOnIndex !== undefined && window.editFollowOnIndex > index) {
                        // Adjust edit index if we deleted an item before it
                        window.editFollowOnIndex--;
                    }
                }
            }
        });
    }

    function openManageModal(type, items, isCustomFn, title) {
        var modalContainer = document.getElementById('modal-container');
        // Append to modal container (on top of existing modal)
        var manageModal = document.createElement('div');
        manageModal.innerHTML = Components.renderManageOptionsModal(type, items, isCustomFn, title);
        modalContainer.appendChild(manageModal.firstElementChild);
    }

    // Helper to refresh modal form while preserving entered values
    function refreshModalForm() {
        var form = document.getElementById('company-form');
        if (!form) return;

        // Save current form values
        var formData = new FormData(form);
        var currentValues = {};
        formData.forEach(function (value, key) {
            currentValues[key] = value;
        });

        // Re-render the form
        var modalBody = form.closest('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = Components.renderCompanyForm(currentValues);
        }
    }

    function openAddModal() {
        currentEditId = null;
        window.tempFollowOns = []; // Initialize empty follow-ons for new company
        var modalContainer = document.getElementById('modal-container');
        var content = Components.renderCompanyForm();
        var footer = '\
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>\
      <button class="btn btn-primary" id="modal-save">Add Company</button>';
        modalContainer.innerHTML = Components.renderModal('Add Portfolio Company', content, footer);
    }

    function openEditModal(companyId) {
        currentEditId = companyId;
        var company = Data.getCompanyById(companyId);
        window.tempFollowOns = company.followOns ? company.followOns.slice() : []; // Copy existing follow-ons
        var modalContainer = document.getElementById('modal-container');
        var content = Components.renderCompanyForm(company);
        var footer = '\
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>\
      <button class="btn btn-primary" id="modal-save">Save Changes</button>';
        modalContainer.innerHTML = Components.renderModal('Edit Company', content, footer);
    }

    function openCompanyDetail(companyId) {
        var company = Data.getCompanyById(companyId);
        var modalContainer = document.getElementById('modal-container');
        var content = Components.renderCompanyDetail(company);
        var footer = '\
      <button class="btn btn-danger" id="detail-delete-btn" data-id="' + companyId + '" style="margin-right: auto;">Delete</button>\
      <button class="btn btn-secondary" id="modal-cancel">Close</button>\
      <button class="btn btn-primary" id="detail-edit-btn" data-id="' + companyId + '">Edit Company</button>';
        modalContainer.innerHTML = Components.renderModal('Company Details', content, footer);
    }

    function openDeleteConfirm(companyId) {
        deleteId = companyId;
        var company = Data.getCompanyById(companyId);
        var modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = Components.renderConfirmDialog(
            'Delete Company',
            'Are you sure you want to delete "' + company.name + '" from your portfolio? This action cannot be undone.'
        );
    }

    function closeModal() {
        var modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = '';
        currentEditId = null;
        window.tempFollowOns = []; // Clear temp follow-ons
    }

    function closeConfirm() {
        var confirmOverlay = document.getElementById('confirm-overlay');
        if (confirmOverlay) {
            confirmOverlay.remove();
        }
        deleteId = null;
    }

    function confirmDelete() {
        if (deleteId) {
            Data.deleteCompany(deleteId);
            closeConfirm();
            refreshContent();
        }
    }

    function saveCompany() {
        var form = document.getElementById('company-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Use querySelector directly to get values from all form elements
        // This is more robust than FormData when form structure is complex
        var getValue = function (name) {
            var el = document.querySelector('[name="' + name + '"]');
            return el ? el.value : '';
        };

        // Get follow-ons from temp storage
        var followOns = window.tempFollowOns || [];

        // Calculate total invested from initial + all follow-on rounds where we invested
        var followOnTotal = followOns.reduce(function (sum, f) {
            return sum + (f.didWeInvest ? (f.ourInvestment || f.amount || 0) : 0);
        }, 0);

        // Find the last investment date
        var lastInvestmentDate = getValue('entryDate');
        followOns.forEach(function (f) {
            if (f.didWeInvest && f.date > lastInvestmentDate) {
                lastInvestmentDate = f.date;
            }
        });

        var data = {
            name: getValue('name'),
            industry: getValue('industry'),
            hq: getValue('hq'),
            dealSourcer: getValue('dealSourcer'),
            analyst: getValue('analyst'),
            entryDate: getValue('entryDate'),
            entryStage: getValue('entryStage'),
            currentStage: getValue('currentStage') || getValue('entryStage'),
            initialInvestment: parseFloat(getValue('initialInvestment')) || 0,
            latestValuation: parseFloat(getValue('latestValuation')) || 0,
            ownership: parseFloat(getValue('ownership')) || 0,
            status: getValue('status') || 'Active',
            exitValue: parseFloat(getValue('exitValue')) || 0,
            exitDate: getValue('exitDate'),
            notes: getValue('notes'),
            followOns: followOns,
            lastInvestmentDate: lastInvestmentDate,
            totalInvested: (parseFloat(getValue('initialInvestment')) || 0) + followOnTotal
        };

        // Get selected founder IDs from checkboxes
        var founderCheckboxes = document.querySelectorAll('[name="founderIds"]:checked');
        var newFounderIds = [];
        founderCheckboxes.forEach(function (cb) {
            newFounderIds.push(cb.value);
        });
        data.founderIds = newFounderIds;

        var savedCompany;
        if (currentEditId) {
            // Get old founder IDs for unlinking
            var oldCompany = Data.getCompanyById(currentEditId);
            var oldFounderIds = oldCompany.founderIds || [];

            // Unlink removed founders
            oldFounderIds.forEach(function (fid) {
                if (newFounderIds.indexOf(fid) === -1) {
                    Data.unlinkFounderFromCompany(fid, currentEditId);
                }
            });

            // Link new founders
            newFounderIds.forEach(function (fid) {
                if (oldFounderIds.indexOf(fid) === -1) {
                    Data.linkFounderToCompany(fid, currentEditId);
                }
            });

            savedCompany = Data.updateCompany(currentEditId, data);
        } else {
            savedCompany = Data.addCompany(data);
            // Link founders to new company
            newFounderIds.forEach(function (fid) {
                Data.linkFounderToCompany(fid, savedCompany.id);
            });
        }

        closeModal();
        refreshContent();
    }

    function resetFilters() {
        currentFilters = {
            industry: 'all',
            stage: 'all',
            status: 'all',
            dealSourcer: 'all',
            search: ''
        };
        currentView = 'board';
    }

    return {
        render: render,
        initEvents: initEvents,
        resetFilters: resetFilters
    };
})();
