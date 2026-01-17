// ============================================
// CSV IMPORT MODULE - Global scope (no ES modules)
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.CSVImport = (function () {
    var Data = FamilyOffice.Data;
    var Utils = FamilyOffice.Utils;

    // State
    var parsedData = null;
    var columnMappings = {};
    var validRows = [];
    var invalidRows = [];

    // Required fields
    var REQUIRED_FIELDS = ['name', 'industry', 'hq', 'dealSourcer', 'analyst', 'entryDate', 'entryStage', 'initialInvestment'];

    // Column mapping aliases (CSV header -> field name)
    var COLUMN_ALIASES = {
        'name': ['name', 'company', 'company name', 'company_name', 'companyname'],
        'industry': ['industry', 'sector', 'vertical'],
        'hq': ['hq', 'location', 'city', 'hq location', 'hq_location', 'headquarters'],
        'dealSourcer': ['deal sourcer', 'deal_sourcer', 'dealsourcer', 'sourcer', 'sourced by'],
        'analyst': ['analyst', 'analyst name', 'analyst_name'],
        'entryDate': ['entry date', 'entry_date', 'entrydate', 'date', 'investment date'],
        'entryStage': ['entry stage', 'entry_stage', 'entrystage', 'stage', 'round'],
        'currentStage': ['current stage', 'current_stage', 'currentstage'],
        'initialInvestment': ['initial investment', 'initial_investment', 'initialinvestment', 'investment', 'amount', 'invested'],
        'latestValuation': ['latest valuation', 'latest_valuation', 'latestvaluation', 'valuation'],
        'ownership': ['ownership', 'ownership %', 'ownership_percent', 'stake', 'equity'],
        'status': ['status'],
        'notes': ['notes', 'note', 'comments']
    };

    // Parse CSV text into rows
    function parseCSV(text) {
        var lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) {
            return { error: 'CSV must have at least a header row and one data row' };
        }

        // Parse header
        var headers = parseCSVLine(lines[0]);

        // Parse data rows
        var rows = [];
        for (var i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                var values = parseCSVLine(lines[i]);
                var row = {};
                for (var j = 0; j < headers.length; j++) {
                    row[headers[j]] = values[j] || '';
                }
                row._rowNum = i + 1;
                rows.push(row);
            }
        }

        return { headers: headers, rows: rows };
    }

    // Parse a single CSV line (handles quoted values)
    function parseCSVLine(line) {
        var result = [];
        var current = '';
        var inQuotes = false;

        for (var i = 0; i < line.length; i++) {
            var char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());

        return result;
    }

    // Auto-detect column mappings
    function detectMappings(headers) {
        var mappings = {};

        headers.forEach(function (header) {
            var headerLower = header.toLowerCase().trim();

            Object.keys(COLUMN_ALIASES).forEach(function (field) {
                if (mappings[field]) return; // Already mapped

                var aliases = COLUMN_ALIASES[field];
                if (aliases.indexOf(headerLower) !== -1) {
                    mappings[field] = header;
                }
            });
        });

        return mappings;
    }

    // Validate a single row
    function validateRow(row, mappings) {
        var errors = [];
        var mapped = {};

        // Map values
        Object.keys(mappings).forEach(function (field) {
            var csvColumn = mappings[field];
            mapped[field] = row[csvColumn] || '';
        });

        // Check required fields
        REQUIRED_FIELDS.forEach(function (field) {
            if (!mapped[field] || !mapped[field].trim()) {
                errors.push('Missing required field: ' + field);
            }
        });

        // Validate numeric fields
        if (mapped.initialInvestment && isNaN(parseFloat(mapped.initialInvestment.replace(/[₹$,]/g, '')))) {
            errors.push('Invalid investment amount');
        }
        if (mapped.ownership && isNaN(parseFloat(mapped.ownership.replace(/%/g, '')))) {
            errors.push('Invalid ownership percentage');
        }

        // Validate stage
        var validStages = Data.STAGES.concat(['Exited']);
        if (mapped.entryStage && validStages.indexOf(mapped.entryStage) === -1) {
            // Try to find a match case-insensitively
            var found = validStages.find(function (s) {
                return s.toLowerCase() === mapped.entryStage.toLowerCase();
            });
            if (found) {
                mapped.entryStage = found;
            } else {
                errors.push('Invalid stage: ' + mapped.entryStage);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            data: mapped,
            originalRow: row
        };
    }

    // Import companies from validated rows
    function importCompanies(rows) {
        var imported = 0;
        var skipped = 0;

        rows.forEach(function (row) {
            if (!row.valid) {
                skipped++;
                return;
            }

            var data = row.data;

            // Build company object
            var company = {
                name: data.name.trim(),
                industry: data.industry.trim(),
                hq: data.hq.trim(),
                dealSourcer: data.dealSourcer.trim(),
                analyst: data.analyst.trim(),
                entryDate: data.entryDate.trim(),
                entryStage: data.entryStage.trim(),
                currentStage: data.currentStage ? data.currentStage.trim() : data.entryStage.trim(),
                initialInvestment: parseFloat(data.initialInvestment.replace(/[₹$,]/g, '')) || 0,
                totalInvested: parseFloat(data.initialInvestment.replace(/[₹$,]/g, '')) || 0,
                latestValuation: data.latestValuation ? parseFloat(data.latestValuation.replace(/[₹$,]/g, '')) : 0,
                ownership: data.ownership ? parseFloat(data.ownership.replace(/%/g, '')) : 0,
                status: data.status ? data.status.trim() : 'Active',
                notes: data.notes || '',
                followOns: []
            };

            Data.addCompany(company);
            imported++;
        });

        return { imported: imported, skipped: skipped };
    }

    // Render the import modal
    function renderImportModal(step, data) {
        data = data || {};
        var content = '';
        var footer = '';

        switch (step) {
            case 'upload':
                content = renderUploadStep();
                footer = '<button class="btn btn-secondary" id="csv-cancel-btn">Cancel</button>';
                break;
            case 'mapping':
                content = renderMappingStep(data.headers);
                footer = '<button class="btn btn-secondary" id="csv-back-btn">Back</button>' +
                    '<button class="btn btn-primary" id="csv-preview-btn">Preview Import</button>';
                break;
            case 'preview':
                content = renderPreviewStep();
                footer = '<button class="btn btn-secondary" id="csv-back-mapping-btn">Back</button>' +
                    '<button class="btn btn-primary" id="csv-import-btn" ' + (validRows.length === 0 ? 'disabled' : '') + '>Import ' + validRows.length + ' Companies</button>';
                break;
            case 'result':
                content = renderResultStep(data);
                footer = '<button class="btn btn-primary" id="csv-done-btn">Done</button>';
                break;
        }

        return '\
      <div class="modal-overlay" id="csv-modal-overlay">\
        <div class="modal modal-lg">\
          <div class="modal-header">\
            <h2 class="modal-title">📥 Import Companies from CSV</h2>\
            <button class="modal-close" id="csv-modal-close">×</button>\
          </div>\
          <div class="modal-body">' + content + '</div>\
          <div class="modal-footer">' + footer + '</div>\
        </div>\
      </div>';
    }

    function renderUploadStep() {
        return '\
      <div class="csv-upload-container">\
        <div class="csv-dropzone" id="csv-dropzone">\
          <div class="csv-dropzone-icon">📄</div>\
          <div class="csv-dropzone-text">Drag & drop your CSV file here</div>\
          <div class="csv-dropzone-subtext">or click to browse</div>\
          <input type="file" id="csv-file-input" accept=".csv,.txt" style="display: none;">\
        </div>\
        <div class="csv-format-hint" style="margin-top: 20px; padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-md);">\
          <h4 style="margin-bottom: 8px;">📋 Expected CSV Format</h4>\
          <p class="text-sm text-muted" style="margin-bottom: 8px;">Your CSV should include these columns:</p>\
          <div class="csv-columns-grid" style="display: flex; flex-wrap: wrap; gap: 8px;">\
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Name</span>\
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Industry</span>\
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">HQ / Location</span>\
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Deal Sourcer</span>\
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Analyst</span>\
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Entry Date</span>\
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Entry Stage</span>\
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Initial Investment</span>\
          </div>\
        </div>\
      </div>';
    }

    function renderMappingStep(headers) {
        var fields = Object.keys(COLUMN_ALIASES);

        var mappingRows = fields.map(function (field) {
            var isRequired = REQUIRED_FIELDS.indexOf(field) !== -1;
            var currentMapping = columnMappings[field] || '';

            var options = '<option value="">-- Select Column --</option>' +
                headers.map(function (h) {
                    var selected = currentMapping === h ? 'selected' : '';
                    return '<option value="' + h + '" ' + selected + '>' + h + '</option>';
                }).join('');

            return '\
        <div class="csv-mapping-row">\
          <div class="csv-mapping-field">\
            <span>' + field + '</span>\
            ' + (isRequired ? '<span class="csv-required">*</span>' : '') + '\
          </div>\
          <div class="csv-mapping-arrow">→</div>\
          <select class="form-select csv-mapping-select" data-field="' + field + '">\
            ' + options + '\
          </select>\
        </div>';
        }).join('');

        return '\
      <div class="csv-mapping-container">\
        <h4 style="margin-bottom: 16px;">Map CSV Columns to Fields</h4>\
        <p class="text-sm text-muted" style="margin-bottom: 16px;">We\'ve auto-detected some mappings. Please verify and complete the mapping.</p>\
        <div class="csv-mapping-list">\
          ' + mappingRows + '\
        </div>\
      </div>';
    }

    function renderPreviewStep() {
        // Validate all rows with current mappings
        validRows = [];
        invalidRows = [];

        parsedData.rows.forEach(function (row) {
            var result = validateRow(row, columnMappings);
            if (result.valid) {
                validRows.push(result);
            } else {
                invalidRows.push(result);
            }
        });

        var summaryHtml = '\
      <div class="csv-preview-summary" style="display: flex; gap: 16px; margin-bottom: 20px;">\
        <div class="card" style="flex: 1; padding: 16px; text-align: center;">\
          <div style="font-size: 24px; font-weight: 600; color: var(--color-success);">' + validRows.length + '</div>\
          <div class="text-sm text-muted">Valid Rows</div>\
        </div>\
        <div class="card" style="flex: 1; padding: 16px; text-align: center;">\
          <div style="font-size: 24px; font-weight: 600; color: var(--color-danger);">' + invalidRows.length + '</div>\
          <div class="text-sm text-muted">Invalid Rows</div>\
        </div>\
      </div>';

        // Preview table (first 10 rows)
        var previewRows = validRows.slice(0, 5).concat(invalidRows.slice(0, 5));

        var tableHtml = '\
      <div class="csv-preview-table-container" style="max-height: 300px; overflow: auto;">\
        <table class="table">\
          <thead>\
            <tr>\
              <th>Row</th>\
              <th>Name</th>\
              <th>Industry</th>\
              <th>Stage</th>\
              <th>Investment</th>\
              <th>Status</th>\
            </tr>\
          </thead>\
          <tbody>\
            ' + previewRows.map(function (row) {
            var statusClass = row.valid ? '' : 'csv-error-row';
            return '\
                <tr class="' + statusClass + '">\
                  <td>' + row.originalRow._rowNum + '</td>\
                  <td>' + (row.data.name || '<span class="text-danger">Missing</span>') + '</td>\
                  <td>' + (row.data.industry || '-') + '</td>\
                  <td>' + (row.data.entryStage || '-') + '</td>\
                  <td>' + (row.data.initialInvestment ? Utils.formatCurrency(parseFloat(row.data.initialInvestment.replace(/[₹$,]/g, ''))) : '-') + '</td>\
                  <td>' + (row.valid ? '<span style="color: var(--color-success);">✓ Valid</span>' : '<span style="color: var(--color-danger);">✗ ' + row.errors[0] + '</span>') + '</td>\
                </tr>';
        }).join('') + '\
          </tbody>\
        </table>\
      </div>';

        return summaryHtml + tableHtml;
    }

    function renderResultStep(data) {
        return '\
      <div class="csv-result-container" style="text-align: center; padding: 40px;">\
        <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>\
        <h3 style="margin-bottom: 12px;">Import Complete!</h3>\
        <p class="text-muted" style="margin-bottom: 24px;">\
          Successfully imported <strong style="color: var(--color-success);">' + data.imported + '</strong> companies.\
          ' + (data.skipped > 0 ? '<br>Skipped <strong style="color: var(--color-danger);">' + data.skipped + '</strong> invalid rows.' : '') + '\
        </p>\
      </div>';
    }

    // Open the import modal
    function openImportModal() {
        parsedData = null;
        columnMappings = {};
        validRows = [];
        invalidRows = [];

        var modalHtml = renderImportModal('upload');
        document.getElementById('modal-container').innerHTML = modalHtml;
        initModalEvents('upload');
    }

    // Close the modal
    function closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    }

    // Initialize modal event handlers
    function initModalEvents(step) {
        var overlay = document.getElementById('csv-modal-overlay');
        var closeBtn = document.getElementById('csv-modal-close');
        var cancelBtn = document.getElementById('csv-cancel-btn');

        if (closeBtn) closeBtn.onclick = closeModal;
        if (cancelBtn) cancelBtn.onclick = closeModal;
        if (overlay) {
            overlay.onclick = function (e) {
                if (e.target === overlay) closeModal();
            };
        }

        if (step === 'upload') {
            var dropzone = document.getElementById('csv-dropzone');
            var fileInput = document.getElementById('csv-file-input');

            if (dropzone && fileInput) {
                dropzone.onclick = function () { fileInput.click(); };

                dropzone.ondragover = function (e) {
                    e.preventDefault();
                    dropzone.classList.add('dragover');
                };

                dropzone.ondragleave = function () {
                    dropzone.classList.remove('dragover');
                };

                dropzone.ondrop = function (e) {
                    e.preventDefault();
                    dropzone.classList.remove('dragover');
                    var file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                };

                fileInput.onchange = function () {
                    if (fileInput.files[0]) handleFile(fileInput.files[0]);
                };
            }
        }

        if (step === 'mapping') {
            var backBtn = document.getElementById('csv-back-btn');
            var previewBtn = document.getElementById('csv-preview-btn');

            if (backBtn) backBtn.onclick = function () { showStep('upload'); };
            if (previewBtn) previewBtn.onclick = function () {
                // Update mappings from selects
                var selects = document.querySelectorAll('.csv-mapping-select');
                selects.forEach(function (select) {
                    var field = select.dataset.field;
                    columnMappings[field] = select.value;
                });
                showStep('preview');
            };
        }

        if (step === 'preview') {
            var backMappingBtn = document.getElementById('csv-back-mapping-btn');
            var importBtn = document.getElementById('csv-import-btn');

            if (backMappingBtn) backMappingBtn.onclick = function () { showStep('mapping'); };
            if (importBtn) importBtn.onclick = function () {
                var result = importCompanies(validRows);
                showStep('result', result);
            };
        }

        if (step === 'result') {
            var doneBtn = document.getElementById('csv-done-btn');
            if (doneBtn) doneBtn.onclick = function () {
                closeModal();
                // Refresh portfolio view
                if (FamilyOffice.Portfolio) {
                    FamilyOffice.Portfolio.render();
                    FamilyOffice.Portfolio.initEvents();
                }
            };
        }
    }

    // Handle file upload
    function handleFile(file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var text = e.target.result;
            var result = parseCSV(text);

            if (result.error) {
                alert('Error parsing CSV: ' + result.error);
                return;
            }

            parsedData = result;
            columnMappings = detectMappings(result.headers);
            showStep('mapping');
        };
        reader.readAsText(file);
    }

    // Show a specific step
    function showStep(step, data) {
        var modalHtml = renderImportModal(step, Object.assign({ headers: parsedData ? parsedData.headers : [] }, data || {}));
        document.getElementById('modal-container').innerHTML = modalHtml;
        initModalEvents(step);
    }

    return {
        openImportModal: openImportModal,
        closeModal: closeModal
    };
})();
