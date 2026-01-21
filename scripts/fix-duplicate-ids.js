// Data Cleanup Script - Run this in the browser console
// This script fixes duplicate company IDs

(function () {
    const STORAGE_KEY = 'family_office_portfolio';

    // Get current data
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
        console.log('No portfolio data found');
        return;
    }

    let companies = JSON.parse(rawData);
    console.log('📊 Current companies:', companies.length);

    // Find duplicates
    const idMap = {};
    const duplicates = [];

    companies.forEach((c, index) => {
        if (idMap[c.id]) {
            duplicates.push({
                id: c.id,
                first: idMap[c.id].name,
                second: c.name,
                newId: Date.now().toString() + '_' + index
            });
            // Fix by generating a new ID
            c.id = Date.now().toString() + '_' + index;
        } else {
            idMap[c.id] = c;
        }
    });

    if (duplicates.length > 0) {
        console.log('🔴 Found duplicates:', duplicates);

        // Save fixed data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
        console.log('✅ Fixed duplicate IDs! Refresh the page.');
    } else {
        console.log('✅ No duplicate IDs found!');
    }

    // Check for any other data issues
    companies.forEach(c => {
        if (!c.id) console.log('⚠️ Missing ID:', c.name);
        if (!c.name) console.log('⚠️ Missing name:', c.id);
    });
})();
