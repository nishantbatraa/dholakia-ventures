// ============================================
// DATA MODULE - Global scope (no ES modules)
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Data = (function () {

  // Storage keys
  var STORAGE_KEY = 'family_office_portfolio';
  var FOUNDERS_KEY = 'family_office_founders';
  var FUNDS_KEY = 'family_office_funds';
  var CUSTOM_INDUSTRIES_KEY = 'family_office_custom_industries';
  var CUSTOM_TEAM_KEY = 'family_office_custom_team';

  // Default Team members
  var DEFAULT_TEAM_MEMBERS = [
    'Rahul Sharma',
    'Priya Patel',
    'Amit Gupta',
    'Neha Verma',
    'Vikram Singh',
    'Ananya Reddy'
  ];

  // Default Industries
  var DEFAULT_INDUSTRIES = [
    'FinTech', 'HealthTech', 'EdTech', 'SaaS', 'E-Commerce', 'Logistics',
    'AgriTech', 'CleanTech', 'PropTech', 'InsurTech', 'FoodTech', 'Gaming',
    'AI/ML', 'Cybersecurity', 'D2C', 'Enterprise Software'
  ];


  // Stages (Investment rounds)
  var STAGES = ['Pre-Seed', 'Seed', 'Pre Series A', 'Series A', 'Series B & Above', 'Pre-IPO'];

  // Statuses
  var STATUSES = ['Active', 'Exited', 'Written Off'];

  // Default HQ Locations
  var DEFAULT_HQ_LOCATIONS = [
    'Bangalore', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai',
    'Pune', 'Singapore', 'Dubai', 'San Francisco', 'New York'
  ];

  // Storage keys for custom and removed items
  var CUSTOM_HQ_KEY = 'family_office_custom_hq';
  var REMOVED_INDUSTRIES_KEY = 'family_office_removed_industries';
  var REMOVED_TEAM_KEY = 'family_office_removed_team';
  var REMOVED_HQ_KEY = 'family_office_removed_hq';

  // ============================================
  // CUSTOM OPTIONS MANAGEMENT
  // ============================================

  // Helper: get removed items from localStorage
  function getRemovedItems(key) {
    var stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  // Helper: add to removed list
  function addToRemoved(key, name) {
    var removed = getRemovedItems(key);
    if (removed.indexOf(name) === -1) {
      removed.push(name);
      localStorage.setItem(key, JSON.stringify(removed));
    }
  }

  // Helper: restore (remove from removed list)
  function restoreFromRemoved(key, name) {
    var removed = getRemovedItems(key);
    var filtered = removed.filter(function (r) { return r !== name; });
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  // ============ INDUSTRIES ============
  function getCustomIndustries() {
    var stored = localStorage.getItem(CUSTOM_INDUSTRIES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  function addCustomIndustry(name) {
    if (!name || !name.trim()) return false;
    name = name.trim();
    var custom = getCustomIndustries();
    var allExisting = DEFAULT_INDUSTRIES.concat(custom);
    if (allExisting.indexOf(name) === -1) {
      custom.push(name);
      localStorage.setItem(CUSTOM_INDUSTRIES_KEY, JSON.stringify(custom));
      // Also restore if it was removed
      restoreFromRemoved(REMOVED_INDUSTRIES_KEY, name);
      return true;
    }
    // If it exists but was removed, restore it
    if (getRemovedItems(REMOVED_INDUSTRIES_KEY).indexOf(name) !== -1) {
      restoreFromRemoved(REMOVED_INDUSTRIES_KEY, name);
      return true;
    }
    return false;
  }

  function removeIndustry(name) {
    // Remove from custom list if custom
    var custom = getCustomIndustries();
    var filtered = custom.filter(function (i) { return i !== name; });
    localStorage.setItem(CUSTOM_INDUSTRIES_KEY, JSON.stringify(filtered));
    // Add to removed list (works for both custom and default)
    addToRemoved(REMOVED_INDUSTRIES_KEY, name);
  }

  function getAllIndustries() {
    var removed = getRemovedItems(REMOVED_INDUSTRIES_KEY);
    var all = DEFAULT_INDUSTRIES.concat(getCustomIndustries());
    return all.filter(function (i) { return removed.indexOf(i) === -1; });
  }

  function isCustomIndustry(name) {
    return getCustomIndustries().indexOf(name) !== -1;
  }

  // ============ TEAM MEMBERS ============
  function getCustomTeamMembers() {
    var stored = localStorage.getItem(CUSTOM_TEAM_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  function addCustomTeamMember(name) {
    if (!name || !name.trim()) return false;
    name = name.trim();
    var custom = getCustomTeamMembers();
    var allExisting = DEFAULT_TEAM_MEMBERS.concat(custom);
    if (allExisting.indexOf(name) === -1) {
      custom.push(name);
      localStorage.setItem(CUSTOM_TEAM_KEY, JSON.stringify(custom));
      restoreFromRemoved(REMOVED_TEAM_KEY, name);
      return true;
    }
    if (getRemovedItems(REMOVED_TEAM_KEY).indexOf(name) !== -1) {
      restoreFromRemoved(REMOVED_TEAM_KEY, name);
      return true;
    }
    return false;
  }

  function removeTeamMember(name) {
    var custom = getCustomTeamMembers();
    var filtered = custom.filter(function (m) { return m !== name; });
    localStorage.setItem(CUSTOM_TEAM_KEY, JSON.stringify(filtered));
    addToRemoved(REMOVED_TEAM_KEY, name);
  }

  function getAllTeamMembers() {
    var removed = getRemovedItems(REMOVED_TEAM_KEY);
    var all = DEFAULT_TEAM_MEMBERS.concat(getCustomTeamMembers());
    return all.filter(function (m) { return removed.indexOf(m) === -1; });
  }

  function isCustomTeamMember(name) {
    return getCustomTeamMembers().indexOf(name) !== -1;
  }

  // ============ HQ LOCATIONS ============
  function getCustomHQLocations() {
    var stored = localStorage.getItem(CUSTOM_HQ_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  function addCustomHQLocation(name) {
    if (!name || !name.trim()) return false;
    name = name.trim();
    var custom = getCustomHQLocations();
    var allExisting = DEFAULT_HQ_LOCATIONS.concat(custom);
    if (allExisting.indexOf(name) === -1) {
      custom.push(name);
      localStorage.setItem(CUSTOM_HQ_KEY, JSON.stringify(custom));
      restoreFromRemoved(REMOVED_HQ_KEY, name);
      return true;
    }
    if (getRemovedItems(REMOVED_HQ_KEY).indexOf(name) !== -1) {
      restoreFromRemoved(REMOVED_HQ_KEY, name);
      return true;
    }
    return false;
  }

  function removeHQLocation(name) {
    var custom = getCustomHQLocations();
    var filtered = custom.filter(function (h) { return h !== name; });
    localStorage.setItem(CUSTOM_HQ_KEY, JSON.stringify(filtered));
    addToRemoved(REMOVED_HQ_KEY, name);
  }

  function getAllHQLocations() {
    var removed = getRemovedItems(REMOVED_HQ_KEY);
    var all = DEFAULT_HQ_LOCATIONS.concat(getCustomHQLocations());
    return all.filter(function (h) { return removed.indexOf(h) === -1; });
  }

  function isCustomHQLocation(name) {
    return getCustomHQLocations().indexOf(name) !== -1;
  }

  // Sample companies
  var SAMPLE_COMPANIES = [
    {
      id: '1', name: 'PayFlow', industry: 'FinTech', hq: 'Bangalore',
      dealSourcer: 'Rahul Sharma', analyst: 'Priya Patel',
      entryDate: '2021-03-15', entryStage: 'Seed', currentStage: 'Series B & Above',
      initialInvestment: 500000,
      // Initial round legal data
      documents: [
        { type: 'Term Sheet', url: 'https://drive.google.com/payflow-seed-ts', addedAt: '2021-03-10' },
        { type: 'SHA', url: 'https://drive.google.com/payflow-seed-sha', addedAt: '2021-03-15' }
      ],
      legalRights: {
        boardSeat: { enabled: true, details: '1 board seat' },
        observer: { enabled: true, details: '1 observer right' },
        boardComposition: { enabled: false, details: '' },
        preEmptive: { enabled: true, details: 'Pro-rata on future rounds' },
        antiDilution: { enabled: true, details: 'Weighted Average' },
        proRata: { enabled: true, details: 'Right to maintain 8% ownership' },
        rofr: { enabled: true, details: 'On secondary sales by founders' },
        tagAlong: { enabled: true, details: 'If founders sell >50%' },
        dragAlong: { enabled: false, details: '' },
        liquidationPref: { enabled: true, details: '1x Non-participating' },
        conversionRights: { enabled: true, details: 'Voluntary conversion to common' },
        vestingSchedule: { enabled: false, details: '' },
        informationRights: { enabled: true, details: 'Quarterly financials, annual audits' },
        customTerms: 'Founder vesting: 4 years, 1 year cliff'
      },
      followOns: [
        {
          date: '2022-06-20', round: 'Series A', totalRaised: 8000000, roundValuation: 25000000,
          didWeInvest: true, ourInvestment: 1500000, ownershipAfter: 12.0,
          documents: [
            { type: 'SHA', url: 'https://drive.google.com/payflow-sera-sha', addedAt: '2022-06-20' },
            { type: 'SSA', url: 'https://drive.google.com/payflow-sera-ssa', addedAt: '2022-06-20' }
          ],
          legalRights: {
            boardSeat: { enabled: true, details: 'Maintained 1 board seat' },
            observer: { enabled: true, details: '1 observer' },
            preEmptive: { enabled: true, details: 'Pro-rata on future rounds' },
            antiDilution: { enabled: true, details: 'Broad-based Weighted Average' },
            proRata: { enabled: true, details: '15% pro-rata allocation' },
            rofr: { enabled: true, details: 'On all secondary transactions' },
            tagAlong: { enabled: true, details: 'Full tag-along rights' },
            liquidationPref: { enabled: true, details: '1x Non-participating, stacked' },
            informationRights: { enabled: true, details: 'Monthly MIS, quarterly board meetings' },
            customTerms: 'Protective provisions: Approval required for >$500K expenditure'
          }
        },
        {
          date: '2023-09-10', round: 'Series B & Above', totalRaised: 20000000, roundValuation: 85000000,
          didWeInvest: true, ourInvestment: 2500000, ownershipAfter: 8.5,
          documents: [
            { type: 'SHA', url: 'https://drive.google.com/payflow-serb-sha', addedAt: '2023-09-10' }
          ],
          legalRights: {
            boardSeat: { enabled: true, details: '1 board seat (shared with new investor)' },
            antiDilution: { enabled: true, details: 'Broad-based WA' },
            proRata: { enabled: true, details: '10% allocation' },
            liquidationPref: { enabled: true, details: '1x Non-participating' },
            informationRights: { enabled: true, details: 'Quarterly financials' },
            customTerms: 'Drag-along threshold increased to 75%'
          }
        }
      ],
      totalInvested: 4500000, lastInvestmentDate: '2023-09-10',
      latestValuation: 85000000, ownership: 8.5, status: 'Active',
      exitValue: null, notes: 'Strong growth in B2B payments. Expanding to SE Asia.'
    },
    {
      id: '2', name: 'MedAssist', industry: 'HealthTech', hq: 'Mumbai',
      dealSourcer: 'Amit Gupta', analyst: 'Neha Verma',
      entryDate: '2020-08-22', entryStage: 'Seed', currentStage: 'Series B & Above',
      initialInvestment: 750000,
      documents: [
        { type: 'Term Sheet', url: 'https://drive.google.com/medassist-seed-ts', addedAt: '2020-08-20' },
        { type: 'SHA', url: 'https://drive.google.com/medassist-seed-sha', addedAt: '2020-08-22' },
        { type: 'Due Diligence', url: 'https://drive.google.com/medassist-dd', addedAt: '2020-08-15' }
      ],
      legalRights: {
        boardSeat: { enabled: true, details: '1 board seat' },
        observer: { enabled: false, details: '' },
        preEmptive: { enabled: true, details: 'Full pre-emptive rights' },
        antiDilution: { enabled: true, details: 'Full Ratchet' },
        proRata: { enabled: true, details: 'Right to maintain % ownership' },
        rofr: { enabled: true, details: 'ROFR on all share transfers' },
        tagAlong: { enabled: true, details: '100% tag-along' },
        dragAlong: { enabled: true, details: 'If >66% shareholders agree' },
        liquidationPref: { enabled: true, details: '1.5x Participating' },
        conversionRights: { enabled: true, details: 'Auto-conversion at IPO' },
        informationRights: { enabled: true, details: 'Monthly financials, quarterly board' },
        customTerms: 'Key man clause on CEO. Approval for salary >₹50L/yr'
      },
      followOns: [
        {
          date: '2021-04-15', round: 'Series A', totalRaised: 12000000, roundValuation: 45000000,
          didWeInvest: true, ourInvestment: 2000000, ownershipAfter: 9.5,
          documents: [
            { type: 'SHA', url: 'https://drive.google.com/medassist-sera-sha', addedAt: '2021-04-15' }
          ],
          legalRights: {
            boardSeat: { enabled: true, details: 'Retained board seat' },
            antiDilution: { enabled: true, details: 'Broad-based WA (negotiated down from FR)' },
            proRata: { enabled: true, details: '20% allocation secured' },
            liquidationPref: { enabled: true, details: '1x Non-participating (renegotiated)' },
            informationRights: { enabled: true, details: 'Quarterly reports, annual audit' },
            customTerms: 'Affirmative vote rights on M&A decisions'
          }
        },
        {
          date: '2022-07-01', round: 'Series B & Above', totalRaised: 35000000, roundValuation: 150000000,
          didWeInvest: true, ourInvestment: 4000000, ownershipAfter: 7.8,
          documents: [
            { type: 'SHA', url: 'https://drive.google.com/medassist-serb-sha', addedAt: '2022-07-01' },
            { type: 'Board Letters', url: 'https://drive.google.com/medassist-serb-board', addedAt: '2022-07-01' }
          ],
          legalRights: {
            boardSeat: { enabled: true, details: 'Board seat maintained' },
            proRata: { enabled: true, details: '15% pro-rata' },
            liquidationPref: { enabled: true, details: '1x Non-participating, pari-passu' },
            informationRights: { enabled: true, details: 'Monthly dashboard, quarterly review' },
            customTerms: 'IPO lock-up: 6 months'
          }
        },
        {
          date: '2024-01-20', round: 'Series B & Above', totalRaised: 50000000, roundValuation: 320000000,
          didWeInvest: true, ourInvestment: 5000000, ownershipAfter: 6.2,
          documents: [
            { type: 'SHA', url: 'https://drive.google.com/medassist-serc-sha', addedAt: '2024-01-20' }
          ],
          legalRights: {
            boardSeat: { enabled: true, details: 'Observer rights only (stepped down)' },
            proRata: { enabled: true, details: '10% allocation' },
            liquidationPref: { enabled: true, details: '1x Non-participating' },
            informationRights: { enabled: true, details: 'Quarterly financials' },
            customTerms: 'Pre-IPO secondary sale rights: can sell up to 25%'
          }
        }
      ],
      totalInvested: 11750000, lastInvestmentDate: '2024-01-20',
      latestValuation: 320000000, ownership: 6.2, status: 'Active',
      exitValue: null, notes: 'Market leader in AI diagnostics. IPO planned for 2025.'
    },
    {
      id: '3', name: 'LearnPro', industry: 'EdTech', hq: 'Delhi NCR',
      dealSourcer: 'Priya Patel', analyst: 'Rahul Sharma',
      entryDate: '2019-11-05', entryStage: 'Pre-Seed', currentStage: 'Exited',
      initialInvestment: 200000, followOns: [
        { date: '2020-09-12', amount: 800000, round: 'Seed' }
      ],
      totalInvested: 1000000, lastInvestmentDate: '2020-09-12',
      latestValuation: 45000000, ownership: 0, status: 'Exited',
      exitValue: 4500000, notes: 'Acquired by major EdTech player. 4.5x return.'
    },
    {
      id: '4', name: 'CloudStack', industry: 'SaaS', hq: 'Bangalore',
      dealSourcer: 'Vikram Singh', analyst: 'Ananya Reddy',
      entryDate: '2022-01-18', entryStage: 'Seed', currentStage: 'Series A',
      initialInvestment: 600000, followOns: [
        { date: '2023-05-22', amount: 1800000, round: 'Series A' }
      ],
      totalInvested: 2400000, lastInvestmentDate: '2023-05-22',
      latestValuation: 42000000, ownership: 7.8, status: 'Active',
      exitValue: null, notes: 'Enterprise DevOps platform. Strong ARR growth.'
    },
    {
      id: '5', name: 'QuickCart', industry: 'E-Commerce', hq: 'Mumbai',
      dealSourcer: 'Neha Verma', analyst: 'Amit Gupta',
      entryDate: '2021-07-30', entryStage: 'Series A', currentStage: 'Series B & Above',
      initialInvestment: 2000000, followOns: [
        { date: '2023-02-14', amount: 3500000, round: 'Series B & Above' }
      ],
      totalInvested: 5500000, lastInvestmentDate: '2023-02-14',
      latestValuation: 95000000, ownership: 5.5, status: 'Active',
      exitValue: null, notes: 'Q-commerce in Tier 2 cities. Unit economics positive.'
    },
    {
      id: '6', name: 'LogiTech Express', industry: 'Logistics', hq: 'Chennai',
      dealSourcer: 'Rahul Sharma', analyst: 'Vikram Singh',
      entryDate: '2020-04-10', entryStage: 'Pre-Seed', currentStage: 'Written Off',
      initialInvestment: 150000, followOns: [],
      totalInvested: 150000, lastInvestmentDate: '2020-04-10',
      latestValuation: 0, ownership: 0, status: 'Written Off',
      exitValue: 0, notes: 'Could not scale operations. Full write-off.'
    },
    {
      id: '7', name: 'AgroSmart', industry: 'AgriTech', hq: 'Hyderabad',
      dealSourcer: 'Ananya Reddy', analyst: 'Priya Patel',
      entryDate: '2022-06-01', entryStage: 'Seed', currentStage: 'Seed',
      initialInvestment: 400000, followOns: [],
      totalInvested: 400000, lastInvestmentDate: '2022-06-01',
      latestValuation: 8000000, ownership: 9.5, status: 'Active',
      exitValue: null, notes: 'IoT for precision farming. Raising Series A.'
    },
    {
      id: '8', name: 'GreenEnergy', industry: 'CleanTech', hq: 'Pune',
      dealSourcer: 'Amit Gupta', analyst: 'Neha Verma',
      entryDate: '2021-09-14', entryStage: 'Series A', currentStage: 'Series B & Above',
      initialInvestment: 2500000, followOns: [
        { date: '2023-11-01', amount: 4000000, round: 'Series B & Above' }
      ],
      totalInvested: 6500000, lastInvestmentDate: '2023-11-01',
      latestValuation: 120000000, ownership: 6.8, status: 'Active',
      exitValue: null, notes: 'EV charging infrastructure. Expanding nationally.'
    },
    {
      id: '9', name: 'PropEase', industry: 'PropTech', hq: 'Mumbai',
      dealSourcer: 'Priya Patel', analyst: 'Rahul Sharma',
      entryDate: '2023-02-28', entryStage: 'Seed', currentStage: 'Seed',
      initialInvestment: 350000, followOns: [],
      totalInvested: 350000, lastInvestmentDate: '2023-02-28',
      latestValuation: 5500000, ownership: 11.2, status: 'Active',
      exitValue: null, notes: 'Commercial real estate management SaaS.'
    },
    {
      id: '10', name: 'InsureFast', industry: 'InsurTech', hq: 'Bangalore',
      dealSourcer: 'Vikram Singh', analyst: 'Ananya Reddy',
      entryDate: '2020-12-07', entryStage: 'Seed', currentStage: 'Series B & Above',
      initialInvestment: 800000, followOns: [
        { date: '2021-08-20', amount: 2200000, round: 'Series A' },
        { date: '2022-10-15', amount: 5000000, round: 'Series B & Above' },
        { date: '2024-03-01', amount: 8000000, round: 'Series B & Above' }
      ],
      totalInvested: 16000000, lastInvestmentDate: '2024-03-01',
      latestValuation: 450000000, ownership: 5.1, status: 'Active',
      exitValue: null, notes: 'Digital insurance platform. Category leader.'
    },
    {
      id: '11', name: 'FoodBox', industry: 'FoodTech', hq: 'Delhi NCR',
      dealSourcer: 'Neha Verma', analyst: 'Amit Gupta',
      entryDate: '2019-06-20', entryStage: 'Seed', currentStage: 'Exited',
      initialInvestment: 300000, followOns: [
        { date: '2020-04-18', amount: 1200000, round: 'Series A' }
      ],
      totalInvested: 1500000, lastInvestmentDate: '2020-04-18',
      latestValuation: 65000000, ownership: 0, status: 'Exited',
      exitValue: 6000000, notes: 'Secondary sale. 4x return.'
    },
    {
      id: '12', name: 'GameVerse', industry: 'Gaming', hq: 'Bangalore',
      dealSourcer: 'Rahul Sharma', analyst: 'Priya Patel',
      entryDate: '2022-04-05', entryStage: 'Series A', currentStage: 'Series A',
      initialInvestment: 1500000, followOns: [],
      totalInvested: 1500000, lastInvestmentDate: '2022-04-05',
      latestValuation: 35000000, ownership: 6.5, status: 'Active',
      exitValue: null, notes: 'Mobile gaming studio. Two hit titles.'
    },
    {
      id: '13', name: 'AICore', industry: 'AI/ML', hq: 'Bangalore',
      dealSourcer: 'Amit Gupta', analyst: 'Vikram Singh',
      entryDate: '2023-08-10', entryStage: 'Seed', currentStage: 'Seed',
      initialInvestment: 500000, followOns: [],
      totalInvested: 500000, lastInvestmentDate: '2023-08-10',
      latestValuation: 12000000, ownership: 8.0, status: 'Active',
      exitValue: null, notes: 'Enterprise AI copilot. Strong early traction.'
    },
    {
      id: '14', name: 'SecureNet', industry: 'Cybersecurity', hq: 'Hyderabad',
      dealSourcer: 'Ananya Reddy', analyst: 'Neha Verma',
      entryDate: '2021-05-25', entryStage: 'Series A', currentStage: 'Series B & Above',
      initialInvestment: 2000000, followOns: [
        { date: '2023-04-12', amount: 3500000, round: 'Series B & Above' }
      ],
      totalInvested: 5500000, lastInvestmentDate: '2023-04-12',
      latestValuation: 88000000, ownership: 7.2, status: 'Active',
      exitValue: null, notes: 'Zero-trust security platform. Enterprise clients.'
    },
    {
      id: '15', name: 'StyleHub', industry: 'D2C', hq: 'Mumbai',
      dealSourcer: 'Priya Patel', analyst: 'Rahul Sharma',
      entryDate: '2020-10-08', entryStage: 'Seed', currentStage: 'Series A',
      initialInvestment: 450000, followOns: [
        { date: '2022-01-25', amount: 1800000, round: 'Series A' }
      ],
      totalInvested: 2250000, lastInvestmentDate: '2022-01-25',
      latestValuation: 38000000, ownership: 8.8, status: 'Active',
      exitValue: null, notes: 'Premium fashion D2C. Profitable.'
    },
    {
      id: '16', name: 'DataSync', industry: 'Enterprise Software', hq: 'Chennai',
      dealSourcer: 'Vikram Singh', analyst: 'Ananya Reddy',
      entryDate: '2021-12-15', entryStage: 'Seed', currentStage: 'Series A',
      initialInvestment: 550000, followOns: [
        { date: '2023-07-08', amount: 2000000, round: 'Series A' }
      ],
      totalInvested: 2550000, lastInvestmentDate: '2023-07-08',
      latestValuation: 45000000, ownership: 7.5, status: 'Active',
      exitValue: null, notes: 'Enterprise data integration. Strong pipeline.'
    },
    {
      id: '17', name: 'WealthPlus', industry: 'FinTech', hq: 'Bangalore',
      dealSourcer: 'Neha Verma', analyst: 'Amit Gupta',
      entryDate: '2019-08-30', entryStage: 'Pre-Seed', currentStage: 'Series B & Above',
      initialInvestment: 250000, followOns: [
        { date: '2020-06-15', amount: 1000000, round: 'Seed' },
        { date: '2021-09-20', amount: 3000000, round: 'Series A' },
        { date: '2022-12-01', amount: 6000000, round: 'Series B & Above' },
        { date: '2024-06-10', amount: 8000000, round: 'Series B & Above' }
      ],
      totalInvested: 18250000, lastInvestmentDate: '2024-06-10',
      latestValuation: 520000000, ownership: 4.8, status: 'Active',
      exitValue: null, notes: 'Wealth management platform. Market leader.'
    },
    {
      id: '18', name: 'HealthFirst', industry: 'HealthTech', hq: 'Delhi NCR',
      dealSourcer: 'Rahul Sharma', analyst: 'Priya Patel',
      entryDate: '2023-05-18', entryStage: 'Seed', currentStage: 'Seed',
      initialInvestment: 400000, followOns: [],
      totalInvested: 400000, lastInvestmentDate: '2023-05-18',
      latestValuation: 7000000, ownership: 10.5, status: 'Active',
      exitValue: null, notes: 'Preventive health platform. Strong user growth.'
    },
    {
      id: '19', name: 'EduMasters', industry: 'EdTech', hq: 'Pune',
      dealSourcer: 'Amit Gupta', analyst: 'Vikram Singh',
      entryDate: '2022-09-12', entryStage: 'Seed', currentStage: 'Series A',
      initialInvestment: 500000, followOns: [
        { date: '2024-02-20', amount: 2200000, round: 'Series A' }
      ],
      totalInvested: 2700000, lastInvestmentDate: '2024-02-20',
      latestValuation: 48000000, ownership: 7.0, status: 'Active',
      exitValue: null, notes: 'Professional upskilling. B2B focus.'
    },
    {
      id: '20', name: 'SmartSupply', industry: 'Logistics', hq: 'Hyderabad',
      dealSourcer: 'Ananya Reddy', analyst: 'Neha Verma',
      entryDate: '2021-02-08', entryStage: 'Series A', currentStage: 'Series B & Above',
      initialInvestment: 2500000, followOns: [
        { date: '2022-11-18', amount: 4500000, round: 'Series B & Above' }
      ],
      totalInvested: 7000000, lastInvestmentDate: '2022-11-18',
      latestValuation: 135000000, ownership: 6.0, status: 'Active',
      exitValue: null, notes: 'B2B supply chain platform. Expanding to GCC.'
    }
  ];

  function initializeData() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_COMPANIES));
    } else {
      // Migration: Fix companies with null/empty stages or status + convert old stage values
      var companies = JSON.parse(stored);
      var needsSave = false;

      // Map old stage values to new ones
      var stageMapping = {
        'Series B': 'Series B & Above',
        'Series C': 'Series B & Above',
        'Growth': 'Series B & Above',
        'Written-off': 'Written Off'
      };

      companies.forEach(function (c) {
        if (!c.entryStage) {
          c.entryStage = c.currentStage || 'Seed';
          needsSave = true;
        }
        if (!c.currentStage) {
          c.currentStage = c.entryStage || 'Seed';
          needsSave = true;
        }
        if (!c.status) {
          c.status = 'Active';
          needsSave = true;
        }
        // Convert old stage values to new ones
        if (stageMapping[c.entryStage]) {
          c.entryStage = stageMapping[c.entryStage];
          needsSave = true;
        }
        if (stageMapping[c.currentStage]) {
          c.currentStage = stageMapping[c.currentStage];
          needsSave = true;
        }
        if (stageMapping[c.status]) {
          c.status = stageMapping[c.status];
          needsSave = true;
        }
        // Migrate follow-on rounds too
        if (c.followOns && c.followOns.length > 0) {
          c.followOns.forEach(function (f) {
            if (stageMapping[f.round]) {
              f.round = stageMapping[f.round];
              needsSave = true;
            }
          });
        }
      });
      if (needsSave) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
      }
    }
  }

  // Auto-sync helper - triggers cloud sync after data changes
  function triggerAutoSync(operation, dataType) {
    var Supabase = FamilyOffice.Supabase;
    if (Supabase && Supabase.isSyncEnabled && Supabase.isSyncEnabled()) {
      // Update sidebar indicator
      updateSyncIndicator('syncing');

      // Auto-push to cloud
      Supabase.pushToCloud()
        .then(function () {
          updateSyncIndicator('synced');
        })
        .catch(function (err) {
          updateSyncIndicator('error');
          console.error('❌ Auto-sync failed:', err);
        });
    }
  }

  // Update the sidebar sync indicator
  function updateSyncIndicator(status) {
    var indicator = document.getElementById('sync-indicator');
    if (!indicator) return;

    var statusText = indicator.querySelector('.sync-status-text');
    var statusIcon = indicator.querySelector('.sync-status-icon');

    if (status === 'syncing') {
      if (statusIcon) statusIcon.textContent = '⟳';
      if (statusText) statusText.textContent = 'Syncing...';
      indicator.classList.add('syncing');
    } else if (status === 'synced') {
      if (statusIcon) statusIcon.textContent = '☁️';
      if (statusText) statusText.textContent = 'Synced';
      indicator.classList.remove('syncing');
    } else if (status === 'error') {
      if (statusIcon) statusIcon.textContent = '⚠️';
      if (statusText) statusText.textContent = 'Sync error';
      indicator.classList.remove('syncing');
    }
  }

  function getCompanies() {
    var stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : SAMPLE_COMPANIES;
  }

  function getCompanyById(id) {
    var companies = getCompanies();
    for (var i = 0; i < companies.length; i++) {
      if (companies[i].id === id) return companies[i];
    }
    return null;
  }

  function addCompany(company) {
    var companies = getCompanies();
    var newCompany = Object.assign({}, company, {
      id: Date.now().toString(),
      followOns: company.followOns || [],
      totalInvested: company.initialInvestment + (company.followOns || []).reduce(function (sum, f) { return sum + f.amount; }, 0)
    });
    companies.push(newCompany);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    triggerAutoSync('added', 'company');
    return newCompany;
  }

  function updateCompany(id, updates) {
    var companies = getCompanies();
    for (var i = 0; i < companies.length; i++) {
      if (companies[i].id === id) {
        companies[i] = Object.assign({}, companies[i], updates);
        if (updates.initialInvestment || updates.followOns) {
          companies[i].totalInvested =
            companies[i].initialInvestment +
            (companies[i].followOns || []).reduce(function (sum, f) { return sum + f.amount; }, 0);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
        triggerAutoSync('updated', 'company');
        return companies[i];
      }
    }
    return null;
  }

  function deleteCompany(id) {
    var companies = getCompanies();
    var filtered = companies.filter(function (c) { return c.id !== id; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    triggerAutoSync('deleted', 'company');
  }

  function getPortfolioMetrics() {
    var companies = getCompanies();
    var activeCompanies = companies.filter(function (c) { return c.status === 'Active'; });
    var exitedCompanies = companies.filter(function (c) { return c.status === 'Exited'; });
    var writtenOff = companies.filter(function (c) { return c.status === 'Written-off'; });

    var totalAUM = activeCompanies.reduce(function (sum, c) { return sum + c.totalInvested; }, 0);
    var totalInvested = companies.reduce(function (sum, c) { return sum + c.totalInvested; }, 0);
    var totalExitValue = exitedCompanies.reduce(function (sum, c) { return sum + (c.exitValue || 0); }, 0);
    var exitedInvestment = exitedCompanies.reduce(function (sum, c) { return sum + c.totalInvested; }, 0);

    var unrealizedValue = activeCompanies.reduce(function (sum, c) {
      return sum + (c.latestValuation * (c.ownership / 100));
    }, 0);

    var realizedMOIC = exitedInvestment > 0 ? (totalExitValue / exitedInvestment) : 0;
    var unrealizedMOIC = totalAUM > 0 ? (unrealizedValue / totalAUM) : 0;

    return {
      totalCompanies: companies.length,
      activeCompanies: activeCompanies.length,
      exitedCompanies: exitedCompanies.length,
      writtenOff: writtenOff.length,
      totalAUM: totalAUM,
      totalInvested: totalInvested,
      totalExitValue: totalExitValue,
      unrealizedValue: unrealizedValue,
      realizedMOIC: realizedMOIC,
      unrealizedMOIC: unrealizedMOIC,
      portfolioValue: unrealizedValue + totalExitValue
    };
  }

  function getCompaniesByIndustry() {
    var companies = getCompanies();
    var industries = {};
    companies.forEach(function (c) {
      if (!industries[c.industry]) {
        industries[c.industry] = [];
      }
      industries[c.industry].push(c);
    });
    return industries;
  }

  // Usage count functions for Settings page
  function getIndustryUsageCount(name) {
    var companies = getCompanies();
    return companies.filter(function (c) { return c.industry === name; }).length;
  }

  function getTeamMemberUsageCount(name) {
    var companies = getCompanies();
    return companies.filter(function (c) {
      return c.dealSourcer === name || c.analyst === name;
    }).length;
  }

  function getHQLocationUsageCount(name) {
    var companies = getCompanies();
    return companies.filter(function (c) { return c.hq === name; }).length;
  }

  // Data management functions
  function exportAllData() {
    var data = {
      companies: getCompanies(),
      founders: getFounders(),
      funds: getFunds(),
      customIndustries: JSON.parse(localStorage.getItem(CUSTOM_INDUSTRIES_KEY) || '[]'),
      customTeam: JSON.parse(localStorage.getItem(CUSTOM_TEAM_KEY) || '[]'),
      customHQ: JSON.parse(localStorage.getItem(CUSTOM_HQ_KEY) || '[]'),
      removedIndustries: JSON.parse(localStorage.getItem(REMOVED_INDUSTRIES_KEY) || '[]'),
      removedTeam: JSON.parse(localStorage.getItem(REMOVED_TEAM_KEY) || '[]'),
      removedHQ: JSON.parse(localStorage.getItem(REMOVED_HQ_KEY) || '[]'),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  function importData(jsonString) {
    try {
      var data = JSON.parse(jsonString);
      if (data.companies) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.companies));
      }
      if (data.founders) {
        localStorage.setItem(FOUNDERS_KEY, JSON.stringify(data.founders));
      }
      if (data.customIndustries) {
        localStorage.setItem(CUSTOM_INDUSTRIES_KEY, JSON.stringify(data.customIndustries));
      }
      if (data.customTeam) {
        localStorage.setItem(CUSTOM_TEAM_KEY, JSON.stringify(data.customTeam));
      }
      if (data.customHQ) {
        localStorage.setItem(CUSTOM_HQ_KEY, JSON.stringify(data.customHQ));
      }
      if (data.removedIndustries) {
        localStorage.setItem(REMOVED_INDUSTRIES_KEY, JSON.stringify(data.removedIndustries));
      }
      if (data.removedTeam) {
        localStorage.setItem(REMOVED_TEAM_KEY, JSON.stringify(data.removedTeam));
      }
      if (data.removedHQ) {
        localStorage.setItem(REMOVED_HQ_KEY, JSON.stringify(data.removedHQ));
      }
      if (data.funds) {
        localStorage.setItem(FUNDS_KEY, JSON.stringify(data.funds));
      }
      return { success: true, message: 'Data imported successfully' };
    } catch (e) {
      return { success: false, message: 'Invalid JSON format: ' + e.message };
    }
  }

  function resetToDefaults() {
    // Clear all custom data
    localStorage.removeItem(CUSTOM_INDUSTRIES_KEY);
    localStorage.removeItem(CUSTOM_TEAM_KEY);
    localStorage.removeItem(CUSTOM_HQ_KEY);
    localStorage.removeItem(REMOVED_INDUSTRIES_KEY);
    localStorage.removeItem(REMOVED_TEAM_KEY);
    localStorage.removeItem(REMOVED_HQ_KEY);
    // Reset companies to sample data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_COMPANIES));
    // Reset founders
    localStorage.removeItem(FOUNDERS_KEY);
  }

  // ============================================
  // FOUNDERS DATA MANAGEMENT
  // ============================================

  function getFounders() {
    var stored = localStorage.getItem(FOUNDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  function getFounderById(id) {
    var founders = getFounders();
    for (var i = 0; i < founders.length; i++) {
      if (founders[i].id === id) return founders[i];
    }
    return null;
  }

  function addFounder(founder) {
    var founders = getFounders();
    var newFounder = Object.assign({}, founder, {
      id: Date.now().toString(),
      companyIds: founder.companyIds || [],
      createdAt: new Date().toISOString()
    });
    founders.push(newFounder);
    localStorage.setItem(FOUNDERS_KEY, JSON.stringify(founders));
    triggerAutoSync('added', 'founder');
    return newFounder;
  }

  function updateFounder(id, updates) {
    var founders = getFounders();
    for (var i = 0; i < founders.length; i++) {
      if (founders[i].id === id) {
        founders[i] = Object.assign({}, founders[i], updates);
        founders[i].updatedAt = new Date().toISOString();
        localStorage.setItem(FOUNDERS_KEY, JSON.stringify(founders));
        triggerAutoSync('updated', 'founder');
        return founders[i];
      }
    }
    return null;
  }

  function deleteFounder(id) {
    var founders = getFounders();
    var filtered = founders.filter(function (f) { return f.id !== id; });
    localStorage.setItem(FOUNDERS_KEY, JSON.stringify(filtered));

    // Also remove founder from any companies that reference them
    var companies = getCompanies();
    var needsSave = false;
    companies.forEach(function (c) {
      if (c.founderIds && c.founderIds.indexOf(id) !== -1) {
        c.founderIds = c.founderIds.filter(function (fid) { return fid !== id; });
        needsSave = true;
      }
    });
    if (needsSave) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    }
    triggerAutoSync('deleted', 'founder');
  }

  // Get all founders linked to a specific company
  function getFoundersByCompany(companyId) {
    var company = getCompanyById(companyId);
    if (!company || !company.founderIds || company.founderIds.length === 0) {
      return [];
    }
    return company.founderIds.map(function (fid) {
      return getFounderById(fid);
    }).filter(function (f) { return f !== null; });
  }

  // Get all companies linked to a specific founder
  function getCompaniesByFounder(founderId) {
    var companies = getCompanies();
    return companies.filter(function (c) {
      return c.founderIds && c.founderIds.indexOf(founderId) !== -1;
    });
  }

  // Link a founder to a company
  function linkFounderToCompany(founderId, companyId) {
    // Update company's founderIds
    var companies = getCompanies();
    for (var i = 0; i < companies.length; i++) {
      if (companies[i].id === companyId) {
        if (!companies[i].founderIds) companies[i].founderIds = [];
        if (companies[i].founderIds.indexOf(founderId) === -1) {
          companies[i].founderIds.push(founderId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
        }
        break;
      }
    }

    // Update founder's companyIds
    var founders = getFounders();
    for (var j = 0; j < founders.length; j++) {
      if (founders[j].id === founderId) {
        if (!founders[j].companyIds) founders[j].companyIds = [];
        if (founders[j].companyIds.indexOf(companyId) === -1) {
          founders[j].companyIds.push(companyId);
          localStorage.setItem(FOUNDERS_KEY, JSON.stringify(founders));
        }
        break;
      }
    }
  }

  // Unlink a founder from a company
  function unlinkFounderFromCompany(founderId, companyId) {
    // Update company's founderIds
    var companies = getCompanies();
    for (var i = 0; i < companies.length; i++) {
      if (companies[i].id === companyId && companies[i].founderIds) {
        companies[i].founderIds = companies[i].founderIds.filter(function (fid) { return fid !== founderId; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
        break;
      }
    }

    // Update founder's companyIds
    var founders = getFounders();
    for (var j = 0; j < founders.length; j++) {
      if (founders[j].id === founderId && founders[j].companyIds) {
        founders[j].companyIds = founders[j].companyIds.filter(function (cid) { return cid !== companyId; });
        localStorage.setItem(FOUNDERS_KEY, JSON.stringify(founders));
        break;
      }
    }
  }

  // ============================================
  // FUNDS DATA MANAGEMENT
  // ============================================

  function getFunds() {
    var stored = localStorage.getItem(FUNDS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  function getFundById(id) {
    var funds = getFunds();
    for (var i = 0; i < funds.length; i++) {
      if (funds[i].id === id) return funds[i];
    }
    return null;
  }

  function addFund(fund) {
    var funds = getFunds();
    var newFund = Object.assign({}, fund, {
      id: Date.now().toString(),
      capitalCalls: fund.capitalCalls || [],
      distributions: fund.distributions || [],
      navHistory: fund.navHistory || [],
      createdAt: new Date().toISOString()
    });
    funds.push(newFund);
    localStorage.setItem(FUNDS_KEY, JSON.stringify(funds));
    return newFund;
  }

  function updateFund(id, updates) {
    var funds = getFunds();
    for (var i = 0; i < funds.length; i++) {
      if (funds[i].id === id) {
        funds[i] = Object.assign({}, funds[i], updates);
        funds[i].updatedAt = new Date().toISOString();
        localStorage.setItem(FUNDS_KEY, JSON.stringify(funds));
        return funds[i];
      }
    }
    return null;
  }

  function deleteFund(id) {
    var funds = getFunds();
    var filtered = funds.filter(function (f) { return f.id !== id; });
    localStorage.setItem(FUNDS_KEY, JSON.stringify(filtered));
  }

  // Fund helper functions
  function getFundCalledCapital(fund) {
    if (!fund.capitalCalls || fund.capitalCalls.length === 0) return 0;
    return fund.capitalCalls.reduce(function (sum, cc) {
      return sum + (cc.amount || 0);
    }, 0);
  }

  function getFundDistributions(fund) {
    if (!fund.distributions || fund.distributions.length === 0) return 0;
    return fund.distributions.reduce(function (sum, d) {
      return sum + (d.amount || 0);
    }, 0);
  }

  function getFundLatestNav(fund) {
    if (!fund.navHistory || fund.navHistory.length === 0) return 0;
    // Sort by date and get the latest
    var sorted = fund.navHistory.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    return sorted[0].nav || 0;
  }

  function getFundDPI(fund) {
    var called = getFundCalledCapital(fund);
    if (called === 0) return 0;
    return getFundDistributions(fund) / called;
  }

  function getFundTVPI(fund) {
    var called = getFundCalledCapital(fund);
    if (called === 0) return 0;
    return (getFundLatestNav(fund) + getFundDistributions(fund)) / called;
  }

  function getFundMetrics() {
    var funds = getFunds();
    return funds.reduce(function (acc, fund) {
      acc.totalCommitment += fund.totalCommitment || 0;
      acc.calledCapital += getFundCalledCapital(fund);
      acc.distributions += getFundDistributions(fund);
      acc.currentNav += getFundLatestNav(fund);
      return acc;
    }, { totalCommitment: 0, calledCapital: 0, distributions: 0, currentNav: 0 });
  }

  return {
    TEAM_MEMBERS: DEFAULT_TEAM_MEMBERS,
    INDUSTRIES: DEFAULT_INDUSTRIES,
    STAGES: STAGES,
    STATUSES: STATUSES,
    HQ_LOCATIONS: DEFAULT_HQ_LOCATIONS,
    initializeData: initializeData,
    getCompanies: getCompanies,
    getCompanyById: getCompanyById,
    addCompany: addCompany,
    updateCompany: updateCompany,
    deleteCompany: deleteCompany,
    getPortfolioMetrics: getPortfolioMetrics,
    getCompaniesByIndustry: getCompaniesByIndustry,
    // Custom options functions - Industries
    getAllIndustries: getAllIndustries,
    addCustomIndustry: addCustomIndustry,
    removeIndustry: removeIndustry,
    isCustomIndustry: isCustomIndustry,
    // Custom options functions - Team Members
    getAllTeamMembers: getAllTeamMembers,
    addCustomTeamMember: addCustomTeamMember,
    removeTeamMember: removeTeamMember,
    isCustomTeamMember: isCustomTeamMember,
    // Custom options functions - HQ Locations
    getAllHQLocations: getAllHQLocations,
    addCustomHQLocation: addCustomHQLocation,
    removeHQLocation: removeHQLocation,
    isCustomHQLocation: isCustomHQLocation,
    // Usage count functions
    getIndustryUsageCount: getIndustryUsageCount,
    getTeamMemberUsageCount: getTeamMemberUsageCount,
    getHQLocationUsageCount: getHQLocationUsageCount,
    // Data management functions
    exportAllData: exportAllData,
    importData: importData,
    resetToDefaults: resetToDefaults,
    // Founders functions
    getFounders: getFounders,
    getFounderById: getFounderById,
    addFounder: addFounder,
    updateFounder: updateFounder,
    deleteFounder: deleteFounder,
    getFoundersByCompany: getFoundersByCompany,
    getCompaniesByFounder: getCompaniesByFounder,
    linkFounderToCompany: linkFounderToCompany,
    unlinkFounderFromCompany: unlinkFounderFromCompany,
    // Funds functions
    getFunds: getFunds,
    getFundById: getFundById,
    addFund: addFund,
    updateFund: updateFund,
    deleteFund: deleteFund,
    getFundCalledCapital: getFundCalledCapital,
    getFundDistributions: getFundDistributions,
    getFundLatestNav: getFundLatestNav,
    getFundDPI: getFundDPI,
    getFundTVPI: getFundTVPI,
    getFundMetrics: getFundMetrics
  };
})();
