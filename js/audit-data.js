// ============================================
// DATA AUDIT SCRIPT
// Run this in browser console to analyze migration needs
// ============================================

(function() {
    'use strict';

    console.log('='.repeat(60));
    console.log('📊 DATA AUDIT: Analyzing valuation/ownership data structure');
    console.log('='.repeat(60));

    var companies = Data.getCompanies();
    console.log('\nTotal companies:', companies.length);

    // Categories for analysis
    var categories = {
        // Category 1: No follow-ons, manual matches entry (OK - no migration needed)
        noFollowOnsMatchesEntry: [],

        // Category 2: No follow-ons, manual differs from entry (NEEDS MIGRATION)
        noFollowOnsDiffersFromEntry: [],

        // Category 3: Has follow-ons, manual empty (OK - using follow-on data)
        hasFollowOnsManualEmpty: [],

        // Category 4: Has follow-ons, manual filled but matches latest follow-on (OK)
        hasFollowOnsManualMatchesFollowOn: [],

        // Category 5: Has follow-ons, manual filled and differs from follow-on (CONFLICT)
        hasFollowOnsManualDiffers: [],

        // Category 6: No data at all (needs attention)
        noDataAtAll: []
    };

    companies.forEach(function(c) {
        var hasFollowOns = c.followOns && c.followOns.length > 0;
        var hasManualValuation = c.latestValuation && c.latestValuation > 0;
        var hasManualOwnership = c.ownership && c.ownership > 0;
        var hasEntryValuation = c.entryValuation && c.entryValuation > 0;
        var hasEntryOwnership = c.entryOwnership && c.entryOwnership > 0;

        // Get latest follow-on data if exists
        var latestFollowOnValuation = 0;
        var latestFollowOnOwnership = 0;
        var latestFollowOnDate = '';

        if (hasFollowOns) {
            c.followOns.forEach(function(fo) {
                if (fo.date && fo.date > latestFollowOnDate) {
                    latestFollowOnDate = fo.date;
                    if (fo.roundValuation) latestFollowOnValuation = fo.roundValuation;
                    if (fo.ownershipAfter) latestFollowOnOwnership = fo.ownershipAfter;
                }
            });
        }

        var companyInfo = {
            id: c.id,
            name: c.name,
            status: c.status,
            entryDate: c.entryDate,
            entryValuation: c.entryValuation || 0,
            entryOwnership: c.entryOwnership || 0,
            latestValuation: c.latestValuation || 0,
            ownership: c.ownership || 0,
            followOnCount: c.followOns ? c.followOns.length : 0,
            latestFollowOnDate: latestFollowOnDate,
            latestFollowOnValuation: latestFollowOnValuation,
            latestFollowOnOwnership: latestFollowOnOwnership
        };

        if (!hasFollowOns) {
            // No follow-ons
            if (!hasManualValuation && !hasManualOwnership && !hasEntryValuation && !hasEntryOwnership) {
                categories.noDataAtAll.push(companyInfo);
            } else if (
                (c.latestValuation || 0) === (c.entryValuation || 0) &&
                (c.ownership || 0) === (c.entryOwnership || 0)
            ) {
                categories.noFollowOnsMatchesEntry.push(companyInfo);
            } else {
                categories.noFollowOnsDiffersFromEntry.push(companyInfo);
            }
        } else {
            // Has follow-ons
            if (!hasManualValuation && !hasManualOwnership) {
                categories.hasFollowOnsManualEmpty.push(companyInfo);
            } else {
                // Check if manual matches latest follow-on (with tolerance for rounding)
                var valuationMatches = Math.abs((c.latestValuation || 0) - latestFollowOnValuation) < 1;
                var ownershipMatches = Math.abs((c.ownership || 0) - latestFollowOnOwnership) < 0.01;

                if (valuationMatches && ownershipMatches) {
                    categories.hasFollowOnsManualMatchesFollowOn.push(companyInfo);
                } else {
                    companyInfo.mismatchDetails = {
                        valuationDiff: (c.latestValuation || 0) - latestFollowOnValuation,
                        ownershipDiff: (c.ownership || 0) - latestFollowOnOwnership
                    };
                    categories.hasFollowOnsManualDiffers.push(companyInfo);
                }
            }
        }
    });

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT RESULTS');
    console.log('='.repeat(60));

    console.log('\n✅ CATEGORY 1: No follow-ons, manual matches entry (NO MIGRATION NEEDED)');
    console.log('   Count:', categories.noFollowOnsMatchesEntry.length);
    if (categories.noFollowOnsMatchesEntry.length > 0 && categories.noFollowOnsMatchesEntry.length <= 10) {
        categories.noFollowOnsMatchesEntry.forEach(function(c) {
            console.log('   -', c.name);
        });
    }

    console.log('\n⚠️  CATEGORY 2: No follow-ons, manual DIFFERS from entry (NEEDS REVIEW)');
    console.log('   Count:', categories.noFollowOnsDiffersFromEntry.length);
    categories.noFollowOnsDiffersFromEntry.forEach(function(c) {
        console.log('   -', c.name);
        console.log('     Entry: Val=' + c.entryValuation + ', Own=' + c.entryOwnership + '%');
        console.log('     Manual: Val=' + c.latestValuation + ', Own=' + c.ownership + '%');
    });

    console.log('\n✅ CATEGORY 3: Has follow-ons, manual fields empty (OK - using follow-on data)');
    console.log('   Count:', categories.hasFollowOnsManualEmpty.length);
    if (categories.hasFollowOnsManualEmpty.length > 0 && categories.hasFollowOnsManualEmpty.length <= 10) {
        categories.hasFollowOnsManualEmpty.forEach(function(c) {
            console.log('   -', c.name, '(' + c.followOnCount + ' follow-ons)');
        });
    }

    console.log('\n✅ CATEGORY 4: Has follow-ons, manual matches latest follow-on (OK)');
    console.log('   Count:', categories.hasFollowOnsManualMatchesFollowOn.length);
    if (categories.hasFollowOnsManualMatchesFollowOn.length > 0 && categories.hasFollowOnsManualMatchesFollowOn.length <= 10) {
        categories.hasFollowOnsManualMatchesFollowOn.forEach(function(c) {
            console.log('   -', c.name);
        });
    }

    console.log('\n🚨 CATEGORY 5: Has follow-ons, manual DIFFERS from follow-on (CONFLICT!)');
    console.log('   Count:', categories.hasFollowOnsManualDiffers.length);
    categories.hasFollowOnsManualDiffers.forEach(function(c) {
        console.log('   -', c.name);
        console.log('     Manual: Val=' + c.latestValuation + ', Own=' + c.ownership + '%');
        console.log('     Follow-on (' + c.latestFollowOnDate + '): Val=' + c.latestFollowOnValuation + ', Own=' + c.latestFollowOnOwnership + '%');
        console.log('     Diff: Val=' + c.mismatchDetails.valuationDiff + ', Own=' + c.mismatchDetails.ownershipDiff.toFixed(3) + '%');
    });

    console.log('\n❓ CATEGORY 6: No valuation/ownership data at all');
    console.log('   Count:', categories.noDataAtAll.length);
    categories.noDataAtAll.forEach(function(c) {
        console.log('   -', c.name, '(Status:', c.status + ')');
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 MIGRATION SUMMARY');
    console.log('='.repeat(60));

    var okCount = categories.noFollowOnsMatchesEntry.length +
                  categories.hasFollowOnsManualEmpty.length +
                  categories.hasFollowOnsManualMatchesFollowOn.length;
    var needsReviewCount = categories.noFollowOnsDiffersFromEntry.length;
    var conflictCount = categories.hasFollowOnsManualDiffers.length;
    var noDataCount = categories.noDataAtAll.length;

    console.log('\n✅ OK (no changes needed):', okCount, 'companies');
    console.log('⚠️  Needs review (manual differs from entry, no follow-ons):', needsReviewCount, 'companies');
    console.log('🚨 Conflicts (manual differs from follow-on):', conflictCount, 'companies');
    console.log('❓ No data:', noDataCount, 'companies');

    console.log('\n📌 RECOMMENDATION:');
    if (conflictCount > 0) {
        console.log('   - CRITICAL: ' + conflictCount + ' companies have conflicting data');
        console.log('   - You must decide: use manual OR follow-on values for these');
    }
    if (needsReviewCount > 0) {
        console.log('   - ' + needsReviewCount + ' companies have manual overrides without follow-ons');
        console.log('   - These need dates assigned if migrating to follow-on-only model');
    }
    if (okCount === companies.length) {
        console.log('   - All data is consistent! Migration should be straightforward.');
    }

    // Store results for further analysis
    window._auditResults = categories;
    console.log('\n💡 Results stored in window._auditResults for further analysis');
    console.log('='.repeat(60));

    return categories;
})();
