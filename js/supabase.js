// ============================================
// SUPABASE CLIENT - Storage & Database
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Supabase = (function () {
    // Supabase configuration
    var SUPABASE_URL = 'https://esgglrbynwhiidfljlrh.supabase.co';
    var SUPABASE_KEY = 'sb_publishable_9SsVnNYt0Pc_8GQSCUoZzg_wOiVJefl';
    var BUCKET_NAME = 'legal-documents';

    var supabase = null;
    var syncEnabled = false;
    var lastSyncTime = null;

    // Initialize Supabase client
    function init() {
        if (window.supabase && window.supabase.createClient) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            // Check if sync was previously enabled
            syncEnabled = localStorage.getItem('dv_cloud_sync_enabled') === 'true';
            lastSyncTime = localStorage.getItem('dv_last_sync_time');
            return true;
        } else {
            console.warn('Supabase JS library not loaded');
            return false;
        }
    }

    // ============================================
    // STORAGE FUNCTIONS (existing)
    // ============================================

    // Upload a file to Supabase Storage
    function uploadFile(file, companyId, roundType, callback) {
        if (!supabase) {
            if (!init()) {
                callback({ success: false, error: 'Supabase not initialized' });
                return;
            }
        }

        // Create unique file path: company-id/round-type/timestamp-filename
        var fileName = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        var filePath = companyId + '/' + roundType + '/' + fileName;

        supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })
            .then(function (result) {
                if (result.error) {
                    console.error('Upload error:', result.error);
                    callback({ success: false, error: result.error.message });
                } else {
                    // Get public URL
                    var publicUrlResult = supabase.storage
                        .from(BUCKET_NAME)
                        .getPublicUrl(filePath);

                    callback({
                        success: true,
                        path: filePath,
                        url: publicUrlResult.data.publicUrl,
                        fileName: file.name
                    });
                }
            })
            .catch(function (err) {
                console.error('Upload exception:', err);
                callback({ success: false, error: err.message });
            });
    }

    // Delete a file from Supabase Storage
    function deleteFile(filePath, callback) {
        if (!supabase) {
            if (!init()) {
                callback({ success: false, error: 'Supabase not initialized' });
                return;
            }
        }

        supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath])
            .then(function (result) {
                if (result.error) {
                    callback({ success: false, error: result.error.message });
                } else {
                    callback({ success: true });
                }
            })
            .catch(function (err) {
                callback({ success: false, error: err.message });
            });
    }

    // Get public URL for a file
    function getPublicUrl(filePath) {
        if (!supabase) {
            init();
        }
        if (!supabase) return null;

        var result = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return result.data.publicUrl;
    }

    // ============================================
    // DATABASE FUNCTIONS (new cloud sync)
    // ============================================

    // Helper: Convert JS object keys from camelCase to snake_case for DB
    function toSnakeCase(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        var newObj = {};
        Object.keys(obj).forEach(function (key) {
            var snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            newObj[snakeKey] = obj[key];
        });
        return newObj;
    }

    // Helper: Convert DB keys from snake_case to camelCase for JS
    function toCamelCase(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        var newObj = {};
        Object.keys(obj).forEach(function (key) {
            var camelKey = key.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
            newObj[camelKey] = obj[key];
        });
        return newObj;
    }

    // --- COMPANIES ---
    function getCompaniesFromCloud() {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false })
            .then(function (result) {
                if (result.error) throw result.error;
                return result.data.map(function (row) {
                    return {
                        id: row.id,
                        name: row.name,
                        industry: row.industry,
                        hq: row.hq,
                        dealSourcer: row.deal_sourcer,
                        analyst: row.analyst,
                        entryDate: row.entry_date,
                        entryStage: row.entry_stage,
                        currentStage: row.current_stage,
                        initialInvestment: parseFloat(row.initial_investment) || 0,
                        totalInvested: parseFloat(row.total_invested) || 0,
                        latestValuation: parseFloat(row.latest_valuation) || 0,
                        ownership: parseFloat(row.ownership) || 0,
                        status: row.status,
                        exitValue: parseFloat(row.exit_value) || null,
                        notes: row.notes,
                        documents: row.documents || [],
                        legalRights: row.legal_rights || {},
                        followOns: row.follow_ons || [],
                        founderIds: row.founder_ids || []
                    };
                });
            });
    }

    function saveCompanyToCloud(company) {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        var row = {
            id: company.id,
            name: company.name,
            industry: company.industry,
            hq: company.hq,
            deal_sourcer: company.dealSourcer,
            analyst: company.analyst,
            entry_date: company.entryDate,
            entry_stage: company.entryStage,
            current_stage: company.currentStage,
            initial_investment: company.initialInvestment,
            total_invested: company.totalInvested,
            latest_valuation: company.latestValuation,
            ownership: company.ownership,
            status: company.status,
            exit_value: company.exitValue,
            notes: company.notes,
            documents: company.documents || [],
            legal_rights: company.legalRights || {},
            follow_ons: company.followOns || [],
            founder_ids: company.founderIds || [],
            updated_at: new Date().toISOString()
        };

        return supabase
            .from('companies')
            .upsert(row, { onConflict: 'id' })
            .then(function (result) {
                if (result.error) throw result.error;
                updateSyncTime();
                return { success: true };
            });
    }

    function deleteCompanyFromCloud(id) {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase
            .from('companies')
            .delete()
            .eq('id', id)
            .then(function (result) {
                if (result.error) throw result.error;
                updateSyncTime();
                return { success: true };
            });
    }

    // --- FOUNDERS ---
    function getFoundersFromCloud() {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase
            .from('founders')
            .select('*')
            .order('created_at', { ascending: false })
            .then(function (result) {
                if (result.error) throw result.error;
                return result.data.map(function (row) {
                    return {
                        id: row.id,
                        name: row.name,
                        email: row.email,
                        phone: row.phone,
                        linkedin: row.linkedin,
                        background: row.background,
                        role: row.role,
                        companyIds: row.company_ids || []
                    };
                });
            });
    }

    function saveFounderToCloud(founder) {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        var row = {
            id: founder.id,
            name: founder.name,
            email: founder.email,
            phone: founder.phone,
            linkedin: founder.linkedin,
            background: founder.background,
            role: founder.role,
            company_ids: founder.companyIds || [],
            updated_at: new Date().toISOString()
        };

        return supabase
            .from('founders')
            .upsert(row, { onConflict: 'id' })
            .then(function (result) {
                if (result.error) throw result.error;
                updateSyncTime();
                return { success: true };
            });
    }

    function deleteFounderFromCloud(id) {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase
            .from('founders')
            .delete()
            .eq('id', id)
            .then(function (result) {
                if (result.error) throw result.error;
                updateSyncTime();
                return { success: true };
            });
    }

    // --- FUNDS ---
    function getFundsFromCloud() {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase
            .from('funds')
            .select('*')
            .order('created_at', { ascending: false })
            .then(function (result) {
                if (result.error) throw result.error;
                return result.data.map(function (row) {
                    return {
                        id: row.id,
                        name: row.name,
                        manager: row.manager,
                        vintageYear: row.vintage_year,
                        committedCapital: parseFloat(row.committed_capital) || 0,
                        strategy: row.strategy,
                        status: row.status,
                        capitalCalls: row.capital_calls || [],
                        distributions: row.distributions || [],
                        navHistory: row.nav_history || [],
                        notes: row.notes
                    };
                });
            });
    }

    function saveFundToCloud(fund) {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        var row = {
            id: fund.id,
            name: fund.name,
            manager: fund.manager,
            vintage_year: fund.vintageYear,
            committed_capital: fund.committedCapital,
            strategy: fund.strategy,
            status: fund.status,
            capital_calls: fund.capitalCalls || [],
            distributions: fund.distributions || [],
            nav_history: fund.navHistory || [],
            notes: fund.notes,
            updated_at: new Date().toISOString()
        };

        return supabase
            .from('funds')
            .upsert(row, { onConflict: 'id' })
            .then(function (result) {
                if (result.error) throw result.error;
                updateSyncTime();
                return { success: true };
            });
    }

    function deleteFundFromCloud(id) {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase
            .from('funds')
            .delete()
            .eq('id', id)
            .then(function (result) {
                if (result.error) throw result.error;
                updateSyncTime();
                return { success: true };
            });
    }

    // ============================================
    // SYNC MANAGEMENT
    // ============================================

    function setSyncEnabled(enabled) {
        syncEnabled = enabled;
        localStorage.setItem('dv_cloud_sync_enabled', enabled ? 'true' : 'false');
    }

    function isSyncEnabled() {
        return syncEnabled;
    }

    function updateSyncTime() {
        lastSyncTime = new Date().toISOString();
        localStorage.setItem('dv_last_sync_time', lastSyncTime);
    }

    function getLastSyncTime() {
        return lastSyncTime;
    }

    // Full sync: Pull all data from cloud
    function pullFromCloud() {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return Promise.all([
            getCompaniesFromCloud(),
            getFoundersFromCloud(),
            getFundsFromCloud()
        ]).then(function (results) {
            var companies = results[0];
            var founders = results[1];
            var funds = results[2];

            // Save to localStorage
            if (companies.length > 0) {
                localStorage.setItem('family_office_portfolio', JSON.stringify(companies));
            }
            if (founders.length > 0) {
                localStorage.setItem('family_office_founders', JSON.stringify(founders));
            }
            if (funds.length > 0) {
                localStorage.setItem('family_office_funds', JSON.stringify(funds));
            }

            updateSyncTime();

            return {
                success: true,
                companies: companies.length,
                founders: founders.length,
                funds: funds.length
            };
        });
    }

    // Full sync: Push all local data to cloud
    function pushToCloud() {
        if (!supabase) init();
        if (!supabase) return Promise.reject('Supabase not initialized');

        var companies = JSON.parse(localStorage.getItem('family_office_portfolio') || '[]');
        var founders = JSON.parse(localStorage.getItem('family_office_founders') || '[]');
        var funds = JSON.parse(localStorage.getItem('family_office_funds') || '[]');

        var promises = [];

        companies.forEach(function (c) {
            promises.push(saveCompanyToCloud(c));
        });
        founders.forEach(function (f) {
            promises.push(saveFounderToCloud(f));
        });
        funds.forEach(function (f) {
            promises.push(saveFundToCloud(f));
        });

        return Promise.all(promises).then(function () {
            updateSyncTime();
            return {
                success: true,
                companies: companies.length,
                founders: founders.length,
                funds: funds.length
            };
        });
    }

    // Check connection to Supabase
    function checkConnection() {
        if (!supabase) init();
        if (!supabase) return Promise.resolve({ connected: false, error: 'Client not initialized' });

        return supabase
            .from('companies')
            .select('id', { count: 'exact', head: true })
            .then(function (result) {
                if (result.error) {
                    return { connected: false, error: result.error.message };
                }
                return { connected: true, count: result.count };
            })
            .catch(function (err) {
                return { connected: false, error: err.message };
            });
    }

    // Check if Supabase is available
    function isAvailable() {
        return supabase !== null || (window.supabase && window.supabase.createClient);
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

    return {
        // Storage
        init: init,
        uploadFile: uploadFile,
        deleteFile: deleteFile,
        getPublicUrl: getPublicUrl,
        isAvailable: isAvailable,

        // Database - Companies
        getCompaniesFromCloud: getCompaniesFromCloud,
        saveCompanyToCloud: saveCompanyToCloud,
        deleteCompanyFromCloud: deleteCompanyFromCloud,

        // Database - Founders
        getFoundersFromCloud: getFoundersFromCloud,
        saveFounderToCloud: saveFounderToCloud,
        deleteFounderFromCloud: deleteFounderFromCloud,

        // Database - Funds
        getFundsFromCloud: getFundsFromCloud,
        saveFundToCloud: saveFundToCloud,
        deleteFundFromCloud: deleteFundFromCloud,

        // Sync Management
        setSyncEnabled: setSyncEnabled,
        isSyncEnabled: isSyncEnabled,
        getLastSyncTime: getLastSyncTime,
        pullFromCloud: pullFromCloud,
        pushToCloud: pushToCloud,
        checkConnection: checkConnection
    };
})();
