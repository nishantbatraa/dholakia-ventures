// ============================================
// TEST SCENARIOS - Verify valuation/ownership calculations
// Run this in browser console to test different scenarios
// ============================================

(function() {
    'use strict';

    console.log('='.repeat(70));
    console.log('🧪 TESTING 6 SCENARIOS - Valuation, Ownership & IRR Calculations');
    console.log('='.repeat(70));

    // Helper to format currency
    function formatCr(val) {
        return '₹' + (val / 10000000).toFixed(2) + ' Cr';
    }

    // Test scenarios
    var scenarios = [
        // Scenario 1: New company with only entry data (no follow-ons)
        {
            name: 'Scenario 1: New company - Entry data only, no follow-ons',
            company: {
                id: 'test-1',
                name: 'Test Company A',
                status: 'Active',
                entryDate: '2023-01-15',
                entryValuation: 500000000,  // 50 Cr
                entryOwnership: 5,
                invested: 25000000,         // 2.5 Cr
                followOns: []
            },
            expected: {
                latestValuation: 500000000,
                currentOwnership: 5,
                description: 'Should use entry values since no follow-ons exist'
            }
        },

        // Scenario 2: Company with one follow-on round (valuation up)
        {
            name: 'Scenario 2: One follow-on round - Valuation increased',
            company: {
                id: 'test-2',
                name: 'Test Company B',
                status: 'Active',
                entryDate: '2022-06-01',
                entryValuation: 200000000,  // 20 Cr
                entryOwnership: 8,
                invested: 16000000,         // 1.6 Cr
                followOns: [
                    {
                        date: '2024-03-15',
                        round: 'Series A',
                        roundValuation: 800000000,  // 80 Cr (4x)
                        ownershipAfter: 6,           // Diluted from 8% to 6%
                        totalRaised: 100000000
                    }
                ]
            },
            expected: {
                latestValuation: 800000000,
                currentOwnership: 6,
                description: 'Should use Series A valuation (80 Cr) and diluted ownership (6%)'
            }
        },

        // Scenario 3: Company with multiple follow-ons (most recent by date matters)
        {
            name: 'Scenario 3: Multiple follow-ons - Most recent by DATE wins',
            company: {
                id: 'test-3',
                name: 'Test Company C',
                status: 'Active',
                entryDate: '2021-01-01',
                entryValuation: 100000000,  // 10 Cr
                entryOwnership: 10,
                invested: 10000000,         // 1 Cr
                followOns: [
                    {
                        date: '2022-06-01',
                        round: 'Series A',
                        roundValuation: 500000000,  // 50 Cr
                        ownershipAfter: 7,
                        totalRaised: 50000000
                    },
                    {
                        date: '2023-12-01',
                        round: 'Series B',
                        roundValuation: 1500000000,  // 150 Cr (highest)
                        ownershipAfter: 5,
                        totalRaised: 200000000
                    },
                    {
                        date: '2024-09-01',
                        round: 'Bridge',
                        roundValuation: 1200000000,  // 120 Cr (DOWN round - most recent)
                        ownershipAfter: 4.5,
                        totalRaised: 30000000
                    }
                ]
            },
            expected: {
                latestValuation: 1200000000,  // NOT 1500 Cr (highest), but 120 Cr (most recent)
                currentOwnership: 4.5,
                description: 'Should use Bridge round (120 Cr) not Series B (150 Cr) - down round handling'
            }
        },

        // Scenario 4: Company with follow-on where we participated
        {
            name: 'Scenario 4: Follow-on with our participation',
            company: {
                id: 'test-4',
                name: 'Test Company D',
                status: 'Active',
                entryDate: '2022-01-01',
                entryValuation: 300000000,  // 30 Cr
                entryOwnership: 6,
                invested: 18000000,         // 1.8 Cr initial
                followOns: [
                    {
                        date: '2024-06-01',
                        round: 'Series A',
                        roundValuation: 900000000,  // 90 Cr
                        ownershipAfter: 7,           // Increased from 6% to 7% (we invested more)
                        totalRaised: 150000000,
                        didWeInvest: true,
                        ourInvestment: 15000000     // We put in 1.5 Cr more
                    }
                ]
            },
            expected: {
                latestValuation: 900000000,
                currentOwnership: 7,
                totalInvested: 33000000,  // 1.8 Cr + 1.5 Cr = 3.3 Cr
                description: 'Should track increased ownership and total investment'
            }
        },

        // Scenario 5: Exited company
        {
            name: 'Scenario 5: Exited company - Uses exit value',
            company: {
                id: 'test-5',
                name: 'Test Company E',
                status: 'Exited',
                entryDate: '2020-01-01',
                entryValuation: 100000000,
                entryOwnership: 5,
                invested: 5000000,          // 50 Lakhs
                exitDate: '2024-06-01',
                exitValue: 50000000,        // 5 Cr (10x return)
                followOns: [
                    {
                        date: '2022-01-01',
                        round: 'Series A',
                        roundValuation: 400000000,
                        ownershipAfter: 3.5,
                        totalRaised: 50000000
                    }
                ]
            },
            expected: {
                terminalValue: 50000000,    // Exit value, not calculated
                description: 'Should use exit value directly, ignore follow-on for terminal value'
            }
        },

        // Scenario 6: Written-off company
        {
            name: 'Scenario 6: Written-off company - Zero value',
            company: {
                id: 'test-6',
                name: 'Test Company F',
                status: 'Written-off',
                entryDate: '2021-06-01',
                entryValuation: 200000000,
                entryOwnership: 4,
                invested: 8000000,          // 80 Lakhs
                followOns: [
                    {
                        date: '2023-01-01',
                        round: 'Series A',
                        roundValuation: 600000000,
                        ownershipAfter: 3,
                        totalRaised: 80000000
                    }
                ]
            },
            expected: {
                terminalValue: 0,
                irr: -1,  // -100%
                description: 'Should return 0 value and -100% IRR regardless of follow-ons'
            }
        }
    ];

    // Run each scenario
    scenarios.forEach(function(scenario, index) {
        console.log('\n' + '-'.repeat(70));
        console.log('📋 ' + scenario.name);
        console.log('-'.repeat(70));

        var company = scenario.company;
        var expected = scenario.expected;

        // Calculate actual values using Utils functions
        var actualValuation = Utils.getLatestValuation(company);
        var actualOwnership = Utils.getCurrentOwnership(company);
        var irrResult = Utils.calculateCompanyIRR(company);

        console.log('\n📊 INPUT:');
        console.log('   Entry: ' + formatCr(company.entryValuation) + ' @ ' + company.entryOwnership + '%');
        console.log('   Invested: ' + formatCr(company.invested));
        console.log('   Follow-ons: ' + (company.followOns ? company.followOns.length : 0));
        if (company.followOns && company.followOns.length > 0) {
            company.followOns.forEach(function(fo) {
                console.log('      - ' + fo.date + ': ' + fo.round + ' @ ' + formatCr(fo.roundValuation) + ', Own: ' + fo.ownershipAfter + '%');
            });
        }

        console.log('\n📈 CALCULATED:');
        console.log('   Latest Valuation: ' + formatCr(actualValuation));
        console.log('   Current Ownership: ' + actualOwnership.toFixed(2) + '%');
        console.log('   Terminal Value: ' + formatCr(irrResult.terminalValue || 0));
        console.log('   Total Invested: ' + formatCr(irrResult.totalInvested || 0));
        if (irrResult.irr !== null) {
            console.log('   IRR: ' + (irrResult.irr * 100).toFixed(1) + '%');
        } else {
            console.log('   IRR: N/A');
        }

        console.log('\n✅ EXPECTED: ' + expected.description);

        // Validation checks
        var passed = true;
        var checks = [];

        if (expected.latestValuation !== undefined) {
            var valMatch = actualValuation === expected.latestValuation;
            checks.push('   Valuation: ' + (valMatch ? '✅' : '❌') + ' Expected ' + formatCr(expected.latestValuation) + ', Got ' + formatCr(actualValuation));
            if (!valMatch) passed = false;
        }

        if (expected.currentOwnership !== undefined) {
            var ownMatch = Math.abs(actualOwnership - expected.currentOwnership) < 0.01;
            checks.push('   Ownership: ' + (ownMatch ? '✅' : '❌') + ' Expected ' + expected.currentOwnership + '%, Got ' + actualOwnership.toFixed(2) + '%');
            if (!ownMatch) passed = false;
        }

        if (expected.terminalValue !== undefined) {
            var termMatch = Math.abs((irrResult.terminalValue || 0) - expected.terminalValue) < 1;
            checks.push('   Terminal Value: ' + (termMatch ? '✅' : '❌') + ' Expected ' + formatCr(expected.terminalValue) + ', Got ' + formatCr(irrResult.terminalValue || 0));
            if (!termMatch) passed = false;
        }

        if (expected.irr !== undefined) {
            var irrMatch = irrResult.irr !== null && Math.abs(irrResult.irr - expected.irr) < 0.01;
            checks.push('   IRR: ' + (irrMatch ? '✅' : '❌') + ' Expected ' + (expected.irr * 100) + '%, Got ' + (irrResult.irr !== null ? (irrResult.irr * 100).toFixed(1) + '%' : 'N/A'));
            if (!irrMatch) passed = false;
        }

        if (expected.totalInvested !== undefined) {
            var invMatch = Math.abs((irrResult.totalInvested || 0) - expected.totalInvested) < 1;
            checks.push('   Total Invested: ' + (invMatch ? '✅' : '❌') + ' Expected ' + formatCr(expected.totalInvested) + ', Got ' + formatCr(irrResult.totalInvested || 0));
            if (!invMatch) passed = false;
        }

        console.log('\n🔍 VALIDATION:');
        checks.forEach(function(c) { console.log(c); });
        console.log('\n   ' + (passed ? '✅ SCENARIO PASSED' : '❌ SCENARIO FAILED'));
    });

    console.log('\n' + '='.repeat(70));
    console.log('🏁 TEST COMPLETE');
    console.log('='.repeat(70));

})();
