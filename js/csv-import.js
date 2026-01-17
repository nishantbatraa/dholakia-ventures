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
    var importMode = 'companies'; // 'companies' or 'followons'

    // Required fields for companies
    var REQUIRED_FIELDS = ['name', 'industry', 'hq', 'dealSourcer', 'analyst', 'entryDate', 'entryStage', 'initialInvestment'];

    // Column mapping aliases for companies
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

    // Required fields for follow-on rounds
    var FOLLOWON_REQUIRED_FIELDS = ['companyName', 'roundStage', 'roundDate'];

    // Column mapping aliases for follow-on rounds
    var FOLLOWON_COLUMN_ALIASES = {
        'companyName': ['company', 'company name', 'company_name', 'companyname', 'name'],
        'roundStage': ['round stage', 'round_stage', 'roundstage', 'stage', 'round'],
        'roundDate': ['round date', 'round_date', 'rounddate', 'date'],
        'didWeInvest': ['did we invest', 'did_we_invest', 'invested', 'participated'],
        'ourInvestment': ['our investment', 'our_investment', 'ourinvestment', 'investment', 'amount'],
        'totalRaised': ['total raised', 'total_raised', 'totalraised', 'round size', 'round_size'],
        'roundValuation': ['round valuation', 'round_valuation', 'roundvaluation', 'valuation', 'post-money'],
        'ownershipAfter': ['ownership after', 'ownership_after', 'ownershipafter', 'new ownership', 'ownership']
    };

    // Parse CSV text into rows
    function parseCSV(text) {
        var lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return { error: 'CSV must have at least a header row and one data row' };
        var rawHeaders = parseCSVLine(lines[0]);
        // Filter out empty headers (from trailing commas or empty columns)
        var headers = rawHeaders.filter(function (h) { return h && h.trim().length > 0; });
        if (headers.length === 0) return { error: 'No valid column headers found' };
        var rows = [];
        for (var i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                var values = parseCSVLine(lines[i]);
                var row = {};
                for (var j = 0; j < headers.length; j++) row[headers[j]] = values[j] || '';
                row._rowNum = i + 1;
                rows.push(row);
            }
        }
        return { headers: headers, rows: rows };
    }

    function parseCSVLine(line) {
        var result = [], current = '', inQuotes = false;
        for (var i = 0; i < line.length; i++) {
            var c = line[i];
            if (c === '"') inQuotes = !inQuotes;
            else if (c === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
            else current += c;
        }
        result.push(current.trim());
        return result;
    }

    function detectMappings(headers, aliases) {
        var mappings = {};
        headers.forEach(function (h) {
            var hl = h.toLowerCase().trim();
            Object.keys(aliases).forEach(function (f) {
                if (!mappings[f] && aliases[f].indexOf(hl) !== -1) mappings[f] = h;
            });
        });
        return mappings;
    }

    // Validate company row
    function validateRow(row, mappings) {
        var errors = [], mapped = {};
        Object.keys(mappings).forEach(function (f) { mapped[f] = row[mappings[f]] || ''; });
        REQUIRED_FIELDS.forEach(function (f) { if (!mapped[f] || !mapped[f].trim()) errors.push('Missing: ' + f); });
        if (mapped.initialInvestment && isNaN(parseFloat(mapped.initialInvestment.replace(/[₹$,]/g, '')))) errors.push('Invalid investment');
        var validStages = Data.STAGES.concat(['Exited']);
        if (mapped.entryStage && validStages.indexOf(mapped.entryStage) === -1) {
            var found = validStages.find(function (s) { return s.toLowerCase() === mapped.entryStage.toLowerCase(); });
            if (found) mapped.entryStage = found; else errors.push('Invalid stage');
        }
        return { valid: errors.length === 0, errors: errors, data: mapped, originalRow: row };
    }

    // Validate follow-on row
    function validateFollowOnRow(row, mappings) {
        var errors = [], mapped = {};
        Object.keys(mappings).forEach(function (f) { mapped[f] = row[mappings[f]] || ''; });
        FOLLOWON_REQUIRED_FIELDS.forEach(function (f) { if (!mapped[f] || !mapped[f].trim()) errors.push('Missing: ' + f); });
        var companies = Data.getCompanies();
        var matchedCompany = companies.find(function (c) { return c.name.toLowerCase().trim() === (mapped.companyName || '').toLowerCase().trim(); });
        if (!matchedCompany) errors.push('Company not found');
        else { mapped._companyId = matchedCompany.id; mapped._companyName = matchedCompany.name; }
        var validStages = Data.STAGES.concat(['Exited']);
        if (mapped.roundStage && validStages.indexOf(mapped.roundStage) === -1) {
            var found = validStages.find(function (s) { return s.toLowerCase() === mapped.roundStage.toLowerCase(); });
            if (found) mapped.roundStage = found; else errors.push('Invalid stage');
        }
        return { valid: errors.length === 0, errors: errors, data: mapped, originalRow: row };
    }

    // Import companies
    function importCompanies(rows) {
        var imported = 0, skipped = 0;
        rows.forEach(function (row) {
            if (!row.valid) { skipped++; return; }
            var d = row.data;
            Data.addCompany({
                name: d.name.trim(), industry: d.industry.trim(), hq: d.hq.trim(),
                dealSourcer: d.dealSourcer.trim(), analyst: d.analyst.trim(),
                entryDate: d.entryDate.trim(), entryStage: d.entryStage.trim(),
                currentStage: d.currentStage ? d.currentStage.trim() : d.entryStage.trim(),
                initialInvestment: parseFloat(d.initialInvestment.replace(/[₹$,]/g, '')) || 0,
                totalInvested: parseFloat(d.initialInvestment.replace(/[₹$,]/g, '')) || 0,
                latestValuation: d.latestValuation ? parseFloat(d.latestValuation.replace(/[₹$,]/g, '')) : 0,
                ownership: d.ownership ? parseFloat(d.ownership.replace(/%/g, '')) : 0,
                status: d.status ? d.status.trim() : 'Active', notes: d.notes || '', followOns: []
            });
            imported++;
        });
        return { imported: imported, skipped: skipped };
    }

    // Import follow-on rounds
    function importFollowOns(rows) {
        var imported = 0, skipped = 0, companies = Data.getCompanies();
        rows.forEach(function (row) {
            if (!row.valid) { skipped++; return; }
            var d = row.data;
            var company = companies.find(function (c) { return c.id === d._companyId; });
            if (!company) { skipped++; return; }
            var didInvest = d.didWeInvest ? d.didWeInvest.toLowerCase() !== 'no' && d.didWeInvest.toLowerCase() !== 'false' : true;
            var followOn = {
                date: d.roundDate.trim(), round: d.roundStage.trim(), didWeInvest: didInvest,
                ourInvestment: d.ourInvestment ? parseFloat(d.ourInvestment.replace(/[₹$,]/g, '')) : 0,
                totalRaised: d.totalRaised ? parseFloat(d.totalRaised.replace(/[₹$,]/g, '')) : 0,
                roundValuation: d.roundValuation ? parseFloat(d.roundValuation.replace(/[₹$,]/g, '')) : 0,
                ownershipAfter: d.ownershipAfter ? parseFloat(d.ownershipAfter.replace(/%/g, '')) : undefined
            };
            company.followOns = company.followOns || [];
            company.followOns.push(followOn);
            if (didInvest && followOn.ourInvestment) company.totalInvested = (company.totalInvested || company.initialInvestment || 0) + followOn.ourInvestment;
            if (followOn.roundValuation) company.latestValuation = followOn.roundValuation;
            if (followOn.ownershipAfter !== undefined) company.ownership = followOn.ownershipAfter;
            company.currentStage = followOn.round;
            Data.updateCompany(company.id, company);
            imported++;
        });
        return { imported: imported, skipped: skipped };
    }

    // Render modal
    function renderImportModal(step, data) {
        data = data || {};
        var content = '', footer = '';
        var title = importMode === 'companies' ? '📥 Import Companies from CSV' : '📥 Import Follow-on Rounds from CSV';
        switch (step) {
            case 'upload':
                content = importMode === 'companies' ? renderUploadStep() : renderFollowOnUploadStep();
                footer = '<button class="btn btn-secondary" id="csv-cancel-btn">Cancel</button>';
                break;
            case 'mapping':
                content = renderMappingStep(data.headers);
                footer = '<button class="btn btn-secondary" id="csv-back-btn">Back</button><button class="btn btn-primary" id="csv-preview-btn">Preview Import</button>';
                break;
            case 'preview':
                content = renderPreviewStep();
                var label = importMode === 'companies' ? 'Companies' : 'Rounds';
                footer = '<button class="btn btn-secondary" id="csv-back-mapping-btn">Back</button><button class="btn btn-primary" id="csv-import-btn" ' + (validRows.length === 0 ? 'disabled' : '') + '>Import ' + validRows.length + ' ' + label + '</button>';
                break;
            case 'result':
                content = renderResultStep(data);
                footer = '<button class="btn btn-primary" id="csv-done-btn">Done</button>';
                break;
        }
        return '<div class="modal-overlay" id="csv-modal-overlay"><div class="modal modal-lg"><div class="modal-header"><h2 class="modal-title">' + title + '</h2><button class="modal-close" id="csv-modal-close">×</button></div><div class="modal-body">' + content + '</div><div class="modal-footer">' + footer + '</div></div></div>';
    }

    function renderUploadStep() {
        return '<div class="csv-upload-container">' +
            '<div class="csv-dropzone" id="csv-dropzone">' +
            '<div class="csv-dropzone-icon">📄</div>' +
            '<div class="csv-dropzone-text">Drag & drop your CSV file here</div>' +
            '<div class="csv-dropzone-subtext">or click to browse</div>' +
            '<input type="file" id="csv-file-input" accept=".csv,.txt" style="display: none;">' +
            '</div>' +
            '<div class="csv-format-hint" style="margin-top: 20px; padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-md);">' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
            '<h4 style="margin: 0;">📋 Expected CSV Format</h4>' +
            '<button class="btn btn-sm btn-secondary" id="download-company-template">⬇️ Download Template</button>' +
            '</div>' +
            '<p class="text-sm text-muted" style="margin-bottom: 8px;"><strong>Required:</strong></p>' +
            '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Name *</span>' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Industry *</span>' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">HQ *</span>' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Deal Sourcer *</span>' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Analyst *</span>' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Entry Date *</span>' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Entry Stage *</span>' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Initial Investment *</span>' +
            '</div>' +
            '<p class="text-sm text-muted" style="margin-bottom: 8px;"><strong>Optional:</strong></p>' +
            '<div style="display: flex; flex-wrap: wrap; gap: 6px;">' +
            '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Current Stage</span>' +
            '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Latest Valuation</span>' +
            '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Ownership %</span>' +
            '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Status</span>' +
            '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Notes</span>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    function renderFollowOnUploadStep() {
        return '<div class="csv-upload-container">' +
            '<div class="csv-dropzone" id="csv-dropzone">' +
            '<div class="csv-dropzone-icon">📄</div>' +
            '<div class="csv-dropzone-text">Drag & drop your CSV file here</div>' +
            '<div class="csv-dropzone-subtext">or click to browse</div>' +
            '<input type="file" id="csv-file-input" accept=".csv,.txt" style="display: none;">' +
            '</div>' +
            '<div class="csv-format-hint" style="margin-top: 20px; padding: 16px; background: var(--color-bg-tertiary); border-radius: var(--radius-md);">' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
            '<h4 style="margin: 0;">📋 Follow-on Rounds CSV Format</h4>' +
            '<button class="btn btn-sm btn-secondary" id="download-followon-template">⬇️ Download Template</button>' +
            '</div>' +
            '<p class="text-sm text-muted" style="margin-bottom: 8px;"><strong>Required</strong> (company must already exist):</p>' +
            '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Company Name *</span>' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Round Stage *</span>' +
            '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Round Date *</span>' +
            '</div>' +
            '<p class="text-sm text-muted" style="margin-bottom: 8px;"><strong>Optional:</strong></p>' +
            '<div style="display: flex; flex-wrap: wrap; gap: 6px;">' +
            '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Did We Invest</span>' +
            '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Our Investment</span>' +
            '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Total Raised</span>' +
            '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Round Valuation</span>' +
            '<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">Ownership After</span>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    // Download template functions
    function downloadCompanyTemplate() {
        var csv = 'Name,Industry,HQ,Deal Sourcer,Analyst,Entry Date,Entry Stage,Initial Investment,Current Stage,Latest Valuation,Ownership,Status,Notes\n' +
            'Example Company,FinTech,Bangalore,Rahul Sharma,Priya Patel,2025-01-15,Seed,5000000,Seed,25000000,5%,Active,Initial seed investment';
        downloadCSV(csv, 'company_import_template.csv');
    }

    function downloadFollowOnTemplate() {
        var csv = 'Company Name,Round Stage,Round Date,Did We Invest,Our Investment,Total Raised,Round Valuation,Ownership After\n' +
            'Example Company,Series A,2025-06-15,Yes,10000000,50000000,100000000,4%';
        downloadCSV(csv, 'followon_import_template.csv');
    }

    function downloadCSV(content, filename) {
        var blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    function renderMappingStep(headers) {
        var aliases = importMode === 'companies' ? COLUMN_ALIASES : FOLLOWON_COLUMN_ALIASES;
        var required = importMode === 'companies' ? REQUIRED_FIELDS : FOLLOWON_REQUIRED_FIELDS;
        return '<div class="csv-mapping-container"><h4 style="margin-bottom: 16px;">Map CSV Columns to Fields</h4><p class="text-sm text-muted" style="margin-bottom: 16px;">We\'ve auto-detected some mappings. Verify and complete:</p><div class="csv-mapping-list">' + Object.keys(aliases).map(function (f) {
            var isReq = required.indexOf(f) !== -1;
            var cur = columnMappings[f] || '';
            return '<div class="csv-mapping-row"><div class="csv-mapping-field"><span>' + f + '</span>' + (isReq ? '<span class="csv-required">*</span>' : '') + '</div><div class="csv-mapping-arrow">→</div><select class="form-select csv-mapping-select" data-field="' + f + '"><option value="">-- Select --</option>' + headers.map(function (h) { return '<option value="' + h + '"' + (cur === h ? ' selected' : '') + '>' + h + '</option>'; }).join('') + '</select></div>';
        }).join('') + '</div></div>';
    }

    function renderPreviewStep() {
        validRows = []; invalidRows = [];
        var validateFn = importMode === 'companies' ? validateRow : validateFollowOnRow;
        parsedData.rows.forEach(function (r) { var res = validateFn(r, columnMappings); (res.valid ? validRows : invalidRows).push(res); });
        var summary = '<div style="display: flex; gap: 16px; margin-bottom: 20px;"><div class="card" style="flex: 1; padding: 16px; text-align: center;"><div style="font-size: 24px; font-weight: 600; color: var(--color-success);">' + validRows.length + '</div><div class="text-sm text-muted">Valid</div></div><div class="card" style="flex: 1; padding: 16px; text-align: center;"><div style="font-size: 24px; font-weight: 600; color: var(--color-danger);">' + invalidRows.length + '</div><div class="text-sm text-muted">Invalid</div></div></div>';
        var rows = validRows.slice(0, 5).concat(invalidRows.slice(0, 5));
        var th = importMode === 'companies' ? '<th>Row</th><th>Name</th><th>Industry</th><th>Stage</th><th>Investment</th><th>Status</th>' : '<th>Row</th><th>Company</th><th>Round</th><th>Date</th><th>Investment</th><th>Status</th>';
        var tr = rows.map(function (r) {
            var cls = r.valid ? '' : 'csv-error-row';
            if (importMode === 'companies') return '<tr class="' + cls + '"><td>' + r.originalRow._rowNum + '</td><td>' + (r.data.name || '-') + '</td><td>' + (r.data.industry || '-') + '</td><td>' + (r.data.entryStage || '-') + '</td><td>' + (r.data.initialInvestment ? Utils.formatCurrency(parseFloat(r.data.initialInvestment.replace(/[₹$,]/g, ''))) : '-') + '</td><td>' + (r.valid ? '<span style="color:var(--color-success)">✓</span>' : '<span style="color:var(--color-danger)">' + r.errors[0] + '</span>') + '</td></tr>';
            return '<tr class="' + cls + '"><td>' + r.originalRow._rowNum + '</td><td>' + (r.data._companyName || r.data.companyName || '-') + '</td><td>' + (r.data.roundStage || '-') + '</td><td>' + (r.data.roundDate || '-') + '</td><td>' + (r.data.ourInvestment ? Utils.formatCurrency(parseFloat(r.data.ourInvestment.replace(/[₹$,]/g, ''))) : '-') + '</td><td>' + (r.valid ? '<span style="color:var(--color-success)">✓</span>' : '<span style="color:var(--color-danger)">' + r.errors[0] + '</span>') + '</td></tr>';
        }).join('');
        return summary + '<div style="max-height: 300px; overflow: auto;"><table class="table"><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table></div>';
    }

    function renderResultStep(data) {
        var label = importMode === 'companies' ? 'companies' : 'follow-on rounds';
        return '<div style="text-align: center; padding: 40px;"><div style="font-size: 64px; margin-bottom: 20px;">🎉</div><h3 style="margin-bottom: 12px;">Import Complete!</h3><p class="text-muted">Successfully imported <strong style="color: var(--color-success);">' + data.imported + '</strong> ' + label + '.' + (data.skipped > 0 ? '<br>Skipped <strong style="color: var(--color-danger);">' + data.skipped + '</strong> invalid rows.' : '') + '</p></div>';
    }

    function openImportModal() {
        importMode = 'companies'; parsedData = null; columnMappings = {}; validRows = []; invalidRows = [];
        document.getElementById('modal-container').innerHTML = renderImportModal('upload');
        initModalEvents('upload');
    }

    function openFollowOnImportModal() {
        importMode = 'followons'; parsedData = null; columnMappings = {}; validRows = []; invalidRows = [];
        document.getElementById('modal-container').innerHTML = renderImportModal('upload');
        initModalEvents('upload');
    }

    function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

    function initModalEvents(step) {
        var overlay = document.getElementById('csv-modal-overlay');
        var closeBtn = document.getElementById('csv-modal-close');
        var cancelBtn = document.getElementById('csv-cancel-btn');
        if (closeBtn) closeBtn.onclick = closeModal;
        if (cancelBtn) cancelBtn.onclick = closeModal;
        if (overlay) overlay.onclick = function (e) { if (e.target === overlay) closeModal(); };

        if (step === 'upload') {
            var dropzone = document.getElementById('csv-dropzone');
            var fileInput = document.getElementById('csv-file-input');
            if (dropzone && fileInput) {
                dropzone.onclick = function (e) { if (e.target.tagName !== 'BUTTON') fileInput.click(); };
                dropzone.ondragover = function (e) { e.preventDefault(); dropzone.classList.add('dragover'); };
                dropzone.ondragleave = function () { dropzone.classList.remove('dragover'); };
                dropzone.ondrop = function (e) { e.preventDefault(); dropzone.classList.remove('dragover'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
                fileInput.onchange = function () { if (fileInput.files[0]) handleFile(fileInput.files[0]); };
            }
            // Download template buttons
            var downloadCompanyBtn = document.getElementById('download-company-template');
            var downloadFollowOnBtn = document.getElementById('download-followon-template');
            if (downloadCompanyBtn) downloadCompanyBtn.onclick = function (e) { e.stopPropagation(); downloadCompanyTemplate(); };
            if (downloadFollowOnBtn) downloadFollowOnBtn.onclick = function (e) { e.stopPropagation(); downloadFollowOnTemplate(); };
        }
        if (step === 'mapping') {
            var backBtn = document.getElementById('csv-back-btn');
            var previewBtn = document.getElementById('csv-preview-btn');
            if (backBtn) backBtn.onclick = function () { showStep('upload'); };
            if (previewBtn) previewBtn.onclick = function () {
                document.querySelectorAll('.csv-mapping-select').forEach(function (s) { columnMappings[s.dataset.field] = s.value; });
                showStep('preview');
            };
        }
        if (step === 'preview') {
            var backMappingBtn = document.getElementById('csv-back-mapping-btn');
            var importBtn = document.getElementById('csv-import-btn');
            if (backMappingBtn) backMappingBtn.onclick = function () { showStep('mapping'); };
            if (importBtn) importBtn.onclick = function () { var res = importMode === 'companies' ? importCompanies(validRows) : importFollowOns(validRows); showStep('result', res); };
        }
        if (step === 'result') {
            var doneBtn = document.getElementById('csv-done-btn');
            if (doneBtn) doneBtn.onclick = function () { closeModal(); if (FamilyOffice.Portfolio) { FamilyOffice.Portfolio.render(); FamilyOffice.Portfolio.initEvents(); } };
        }
    }

    function handleFile(file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var res = parseCSV(e.target.result);
            if (res.error) { alert('Error: ' + res.error); return; }
            parsedData = res;
            columnMappings = detectMappings(res.headers, importMode === 'companies' ? COLUMN_ALIASES : FOLLOWON_COLUMN_ALIASES);
            showStep('mapping');
        };
        reader.readAsText(file);
    }

    function showStep(step, data) {
        document.getElementById('modal-container').innerHTML = renderImportModal(step, Object.assign({ headers: parsedData ? parsedData.headers : [] }, data || {}));
        initModalEvents(step);
    }

    return {
        openImportModal: openImportModal,
        openFollowOnImportModal: openFollowOnImportModal,
        closeModal: closeModal
    };
})();
