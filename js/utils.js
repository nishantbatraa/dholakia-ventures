// ============================================
// UTILITY FUNCTIONS - Global scope (no ES modules)
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Utils = (function () {

    // Currency setting (stored in localStorage)
    var CURRENCY_KEY = 'family_office_currency';

    function getCurrency() {
        return localStorage.getItem(CURRENCY_KEY) || 'INR';
    }

    function setCurrency(currency) {
        localStorage.setItem(CURRENCY_KEY, currency);
        // Trigger a page refresh to update all values
        if (typeof FamilyOffice.App !== 'undefined' && FamilyOffice.App.refresh) {
            FamilyOffice.App.refresh();
        }
    }

    // Format currency (INR - all values are stored in INR)
    function formatCurrency(amount) {
        // Guard against null/undefined values
        if (amount === null || amount === undefined) {
            amount = 0;
        }
        var currency = getCurrency();

        if (currency === 'INR') {
            // Values are already in INR - no conversion needed
            if (amount >= 10000000) { // 1 Crore
                return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
            }
            if (amount >= 100000) { // 1 Lakh
                return '₹' + (amount / 100000).toFixed(2) + ' L';
            }
            if (amount >= 1000) {
                return '₹' + (amount / 1000).toFixed(2) + 'K';
            }
            return '₹' + amount.toFixed(2);
        }

        // USD format - convert from INR to USD
        var usdAmount = amount / 83;
        if (usdAmount >= 1000000000) {
            return '$' + (usdAmount / 1000000000).toFixed(2) + 'B';
        }
        if (usdAmount >= 1000000) {
            return '$' + (usdAmount / 1000000).toFixed(2) + 'M';
        }
        if (usdAmount >= 1000) {
            return '$' + (usdAmount / 1000).toFixed(2) + 'K';
        }
        return '$' + usdAmount.toFixed(2);
    }

    // Format date
    function formatDate(dateString) {
        if (!dateString) return '-';
        var date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Format percentage
    function formatPercent(value) {
        return value.toFixed(2) + '%';
    }

    // Format MOIC
    function formatMOIC(value) {
        return value.toFixed(2) + 'x';
    }

    // Get stage badge class
    function getStageBadgeClass(stage) {
        var stageMap = {
            'Pre-Seed': 'badge-pre-seed',
            'Seed': 'badge-seed',
            'Pre Series A': 'badge-pre-series-a',
            'Series A': 'badge-series-a',
            'Series B & Above': 'badge-series-b',
            'Pre-IPO': 'badge-pre-ipo',
            'IPO': 'badge-ipo',
            'Exited': 'badge-exited',
            'Written Off': 'badge-written-off'
        };
        return stageMap[stage] || 'badge-seed';
    }

    // Get status class
    function getStatusClass(status) {
        var statusMap = {
            'Active': 'status-active',
            'Exited': 'status-exited',
            'Written Off': 'status-written-off'
        };
        return statusMap[status] || 'status-active';
    }

    // Get avatar color
    function getAvatarColor(name) {
        var colors = [
            { bg: 'rgba(99, 102, 241, 0.2)', text: '#818cf8' },
            { bg: 'rgba(139, 92, 246, 0.2)', text: '#a78bfa' },
            { bg: 'rgba(236, 72, 153, 0.2)', text: '#f472b6' },
            { bg: 'rgba(6, 182, 212, 0.2)', text: '#22d3ee' },
            { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
            { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
            { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' }
        ];
        var index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    // Get initials
    function getInitials(name) {
        return name.split(' ')
            .map(function (word) { return word[0]; })
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    // Debounce function
    function debounce(func, wait) {
        var timeout;
        return function () {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    }

    // Filter companies
    function filterCompanies(companies, filters) {
        return companies.filter(function (company) {
            if (filters.search) {
                var search = filters.search.toLowerCase();
                if (company.name.toLowerCase().indexOf(search) === -1 &&
                    company.industry.toLowerCase().indexOf(search) === -1) {
                    return false;
                }
            }

            if (filters.industry && filters.industry !== 'all') {
                if (company.industry !== filters.industry) return false;
            }

            if (filters.stage && filters.stage !== 'all') {
                if (company.currentStage !== filters.stage) return false;
            }

            if (filters.status && filters.status !== 'all') {
                if (company.status !== filters.status) return false;
            }

            if (filters.dealSourcer && filters.dealSourcer !== 'all') {
                if (company.dealSourcer !== filters.dealSourcer) return false;
            }

            return true;
        });
    }
    // ============================================
    // XIRR CALCULATION (for VC portfolio returns)
    // ============================================

    /**
     * Calculate XIRR (Extended Internal Rate of Return)
     * Uses Newton-Raphson method to find the rate that makes NPV = 0
     * 
     * @param {Array} cashFlows - Array of {date: Date, amount: number}
     *                           Negative = outflow (investment), Positive = inflow (return)
     * @returns {number} XIRR as decimal (0.15 = 15%), or null if calculation fails
     */
    function calculateXIRR(cashFlows) {
        if (!cashFlows || cashFlows.length < 2) return null;

        // Sort by date
        cashFlows = cashFlows.slice().sort(function (a, b) {
            return new Date(a.date) - new Date(b.date);
        });

        // Need at least one negative and one positive cash flow
        var hasNegative = cashFlows.some(function (cf) { return cf.amount < 0; });
        var hasPositive = cashFlows.some(function (cf) { return cf.amount > 0; });
        if (!hasNegative || !hasPositive) return null;

        var firstDate = new Date(cashFlows[0].date);

        // NPV function: sum of cash flows / (1 + rate)^years
        function npv(rate) {
            return cashFlows.reduce(function (sum, cf) {
                var years = (new Date(cf.date) - firstDate) / (365 * 24 * 60 * 60 * 1000);
                return sum + cf.amount / Math.pow(1 + rate, years);
            }, 0);
        }

        // Derivative of NPV for Newton-Raphson
        function npvDerivative(rate) {
            return cashFlows.reduce(function (sum, cf) {
                var years = (new Date(cf.date) - firstDate) / (365 * 24 * 60 * 60 * 1000);
                if (years === 0) return sum;
                return sum - years * cf.amount / Math.pow(1 + rate, years + 1);
            }, 0);
        }

        // Newton-Raphson iteration
        var rate = 0.1; // Start with 10% guess
        var maxIterations = 100;
        var tolerance = 0.0000001;

        for (var i = 0; i < maxIterations; i++) {
            var npvValue = npv(rate);
            var derivValue = npvDerivative(rate);

            if (Math.abs(derivValue) < tolerance) {
                // Derivative too small, try different starting point
                rate = rate + 0.1;
                continue;
            }

            var newRate = rate - npvValue / derivValue;

            // Keep rate in reasonable bounds (-99% to 1000%)
            if (newRate < -0.99) newRate = -0.99;
            if (newRate > 10) newRate = 10;

            if (Math.abs(newRate - rate) < tolerance) {
                return newRate; // Converged
            }

            rate = newRate;
        }

        // If Newton-Raphson didn't converge, try bisection method
        var low = -0.99;
        var high = 10;
        for (var j = 0; j < 100; j++) {
            var mid = (low + high) / 2;
            var npvMid = npv(mid);
            if (Math.abs(npvMid) < 0.01) return mid;
            if (npvMid > 0) {
                low = mid;
            } else {
                high = mid;
            }
        }

        return null; // Failed to converge
    }

    /**
     * Get all portfolio cash flows for XIRR calculation
     * 
     * @param {Array} companies - Array of company objects
     * @returns {Array} Array of {date, amount} cash flows
     */
    function getPortfolioCashFlows(companies) {
        var cashFlows = [];
        var today = new Date().toISOString().split('T')[0];

        companies.forEach(function (company) {
            // Initial investment (outflow - negative)
            if (company.entryDate && company.initialInvestment) {
                cashFlows.push({
                    date: company.entryDate,
                    amount: -company.initialInvestment
                });
            }

            // Follow-on investments (outflows - negative)
            if (company.followOns && company.followOns.length > 0) {
                company.followOns.forEach(function (fo) {
                    if (fo.didWeInvest && fo.ourInvestment && fo.date) {
                        cashFlows.push({
                            date: fo.date,
                            amount: -fo.ourInvestment
                        });
                    }
                });
            }

            // Exit value or current value (inflow - positive)
            if (company.status === 'Exited' && company.exitValue > 0) {
                // Exited company - use exit value and exit date
                var exitDate = company.exitDate || today;
                cashFlows.push({
                    date: exitDate,
                    amount: company.exitValue
                });
            } else if (company.status === 'Active') {
                // Active company - use current value (latestValuation * ownership%)
                var currentValue = (company.latestValuation || 0) * (company.ownership || 0) / 100;
                if (currentValue > 0) {
                    cashFlows.push({
                        date: today,
                        amount: currentValue
                    });
                }
            }
            // Written Off companies contribute nothing as return
        });

        return cashFlows;
    }

    /**
     * Format XIRR as percentage string
     */
    function formatXIRR(xirr) {
        if (xirr === null || isNaN(xirr)) return 'N/A';
        return (xirr * 100).toFixed(2) + '%';
    }

    /**
     * Calculate IRR for a single company
     * Uses latest round date for terminal value (not today)
     *
     * @param {Object} company - Company object
     * @returns {Object} { irr: number|null, valuationDate: string }
     */
    function calculateCompanyIRR(company) {
        var cashFlows = [];
        var latestDate = company.entryDate || '';
        var totalInvested = 0;

        // Initial investment (outflow - negative)
        if (company.entryDate && company.initialInvestment) {
            cashFlows.push({
                date: company.entryDate,
                amount: -company.initialInvestment
            });
            totalInvested += company.initialInvestment;
        }

        // Follow-on investments (outflows - negative)
        if (company.followOns && company.followOns.length > 0) {
            company.followOns.forEach(function (fo) {
                if (fo.didWeInvest && fo.ourInvestment && fo.date) {
                    cashFlows.push({
                        date: fo.date,
                        amount: -fo.ourInvestment
                    });
                    totalInvested += fo.ourInvestment;
                }
                // Track latest round date (regardless of whether we invested)
                if (fo.date && fo.date > latestDate) {
                    latestDate = fo.date;
                }
            });
        }

        // Terminal value based on status
        var terminalValue = 0;
        var terminalDate = latestDate;
        var today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        if (company.status === 'Exited' && company.exitValue > 0) {
            // Exited: use exit value and exit date
            terminalValue = company.exitValue;
            terminalDate = company.exitDate || latestDate;
        } else if (company.status === 'Written-off') {
            // Written off: terminal value is 0 (total loss)
            terminalValue = 0;
        } else {
            // Active: use current value (latestValuation * ownership%)
            terminalValue = (company.latestValuation || 0) * (company.ownership || 0) / 100;
            // For Active companies: if terminal date equals entry date (no follow-ons),
            // use today's date to get a meaningful IRR calculation
            if (terminalDate === company.entryDate) {
                terminalDate = today;
            }
        }

        // For written-off companies: IRR = -100%
        if (company.status === 'Written-off') {
            return {
                irr: -1, // -100%
                valuationDate: terminalDate,
                terminalValue: 0,
                totalInvested: totalInvested,
                cashFlows: cashFlows
            };
        }

        // If no terminal value or no investments, can't calculate IRR
        if (terminalValue <= 0 || totalInvested <= 0) {
            return {
                irr: null,
                valuationDate: terminalDate,
                terminalValue: terminalValue,
                totalInvested: totalInvested,
                cashFlows: cashFlows
            };
        }

        // Add terminal value as inflow (positive)
        cashFlows.push({
            date: terminalDate,
            amount: terminalValue
        });

        // Calculate XIRR
        var irr = calculateXIRR(cashFlows);

        return {
            irr: irr,
            valuationDate: terminalDate,
            terminalValue: terminalValue,
            totalInvested: totalInvested,
            cashFlows: cashFlows
        };
    }

    /**
     * Calculate ownership history through all funding rounds
     * Applies dilution sequentially and tracks new acquisitions
     * 
     * @param {Object} company - Company object with initial data and followOns array
     * @returns {Object} {
     *   initialOwnership: number,
     *   currentOwnership: number,
     *   rounds: Array of round breakdown objects
     * }
     */
    function calculateOwnershipHistory(company) {
        var result = {
            initialOwnership: 0,
            currentOwnership: 0,
            rounds: []
        };

        // Step 1: Initialize - Calculate initial ownership
        // Initial ownership = Initial Investment / Initial Post-Money Valuation
        var initialInvestment = company.initialInvestment || 0;
        var initialValuation = company.initialValuation || company.entryValuation || 0;

        if (initialValuation > 0 && initialInvestment > 0) {
            result.initialOwnership = (initialInvestment / initialValuation) * 100;
        } else if (company.ownership) {
            // Fallback to stored ownership if no valuation data
            result.initialOwnership = company.ownership;
        }

        var currentOwnership = result.initialOwnership;

        // Step 2: Process each follow-on round sequentially
        var followOns = company.followOns || [];

        // Sort by date to ensure correct order
        followOns = followOns.slice().sort(function (a, b) {
            return new Date(a.date) - new Date(b.date);
        });

        followOns.forEach(function (round, index) {
            var roundBreakdown = {
                index: index,
                date: round.date,
                roundName: round.round,
                previousOwnership: currentOwnership,
                dilutionFactor: 0,
                dilutedOwnership: currentOwnership,
                newStakeBought: 0,
                finalOwnership: currentOwnership,
                didWeInvest: round.didWeInvest,
                ourInvestment: round.ourInvestment || 0,
                totalRaised: round.totalRaised || 0,
                postMoney: round.roundValuation || 0,
                isPassiveDilution: true
            };

            // Calculate dilution if we have the data
            var totalRaised = round.totalRaised || 0;
            var postMoney = round.roundValuation || 0;

            if (postMoney > 0 && totalRaised > 0) {
                // A. Calculate Dilution Factor
                roundBreakdown.dilutionFactor = totalRaised / postMoney;

                // B. Calculate Diluted Base (Passive Dilution)
                roundBreakdown.dilutedOwnership = currentOwnership * (1 - roundBreakdown.dilutionFactor);

                // C. Handle Re-investment
                if (round.didWeInvest && round.ourInvestment > 0) {
                    roundBreakdown.newStakeBought = (round.ourInvestment / postMoney) * 100;
                    roundBreakdown.isPassiveDilution = false;
                }

                // D. Calculate Final Ownership
                roundBreakdown.finalOwnership = roundBreakdown.dilutedOwnership + roundBreakdown.newStakeBought;
            } else if (round.ownershipAfter !== undefined && round.ownershipAfter > 0) {
                // Fallback: Use stored ownership if calculation data is missing
                roundBreakdown.finalOwnership = round.ownershipAfter;
                roundBreakdown.dilutedOwnership = round.ownershipAfter; // Approximate
            }

            // Update current ownership for next round
            currentOwnership = roundBreakdown.finalOwnership;

            result.rounds.push(roundBreakdown);
        });

        result.currentOwnership = currentOwnership;
        return result;
    }

    // Icons
    var icons = {
        dashboard: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
        portfolio: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',
        analytics: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
        plus: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
        search: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
        close: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
        edit: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
        trash: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
        user: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        arrowUp: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
        table: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>',
        board: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="6" height="14" x="4" y="5" rx="2"/><rect width="6" height="10" x="14" y="7" rx="2"/></svg>',
        settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>'
    };

    // Public API
    return {
        formatCurrency: formatCurrency,
        formatDate: formatDate,
        formatPercent: formatPercent,
        formatMOIC: formatMOIC,
        formatXIRR: formatXIRR,
        getStageBadgeClass: getStageBadgeClass,
        getStatusClass: getStatusClass,
        getAvatarColor: getAvatarColor,
        getInitials: getInitials,
        debounce: debounce,
        filterCompanies: filterCompanies,
        calculateXIRR: calculateXIRR,
        calculateCompanyIRR: calculateCompanyIRR,
        getPortfolioCashFlows: getPortfolioCashFlows,
        calculateOwnershipHistory: calculateOwnershipHistory,
        icons: icons,
        getCurrency: getCurrency,
        setCurrency: setCurrency
    };
})();
