# Complete Project Creation Prompt

## Project Overview

Create a comprehensive **Family Office Portfolio Management Dashboard** web application called "Dholakia Ventures" - a single-page application (SPA) for managing investment portfolios, tracking companies, founders, fund investments, legal documents, and generating analytics. The application should be built with vanilla JavaScript (no frameworks), use localStorage for primary data storage with optional Supabase cloud sync, and feature a modern dark-themed luxury design.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES5-style, no modules, no build step)
- **Backend**: Supabase (PostgreSQL database, Storage, optional Authentication, Realtime subscriptions)
- **Styling**: Custom CSS with CSS variables for theming
- **Charts**: Chart.js (loaded via CDN)
- **Storage**: localStorage (primary) + Supabase cloud sync (optional)
- **Architecture**: Namespace-based module pattern (`FamilyOffice.*`)

## Project Structure

```
/
├── index.html                 # Main entry point
├── js/
│   ├── app.js                 # Main application logic, routing, initialization
│   ├── data.js                # Data management, CRUD operations, localStorage
│   ├── supabase.js            # Supabase client, cloud sync, storage
│   ├── utils.js               # Utility functions (formatting, XIRR, filtering)
│   ├── components.js          # UI component rendering functions
│   ├── dashboard.js           # Dashboard view with customizable widgets
│   ├── portfolio.js           # Portfolio management (board/table views)
│   ├── analytics.js           # Analytics and insights with charts
│   ├── settings.js            # Settings page (users, options, data management)
│   ├── founders.js            # Founders database management
│   ├── funds.js               # Fund investments tracking (LP perspective)
│   ├── legal.js               # Legal documents and rights management
│   ├── csv-import.js          # CSV import functionality
│   └── users.js               # User management and preferences
├── styles/
│   ├── index.css              # Main styles, CSS variables, theme
│   └── components.css         # Component-specific styles
├── assets/
│   └── logo.png               # Application logo
├── scripts/
│   ├── supabase-setup.sql     # Database schema setup
│   └── auth-setup.sql         # Authentication setup (optional)
└── sample_companies.csv        # Sample data for import

```

## Core Features

### 1. Dashboard
- **Summary Cards**: Total AUM, Active Companies, Portfolio XIRR, Successful Exits, Portfolio Value
- **Recent Investments**: List of 5 most recent investments with company details
- **Top Performers**: Companies sorted by valuation growth with MOIC
- **Industry Distribution**: Investment breakdown by industry with visual cards
- **Fund Investments Summary**: Total commitment, called capital, distributions, funds XIRR
- **Quick Stats Footer**: Total companies, total invested, written off, realized MOIC
- **Customizable Widgets**: Users can show/hide widgets via settings
- **Customize Button**: Fixed position button to customize dashboard layout

### 2. Portfolio Management
- **Board View (Kanban)**: Companies organized by investment stage columns
  - Stages: Pre-Seed, Seed, Pre Series A, Series A, Series B & Above, Pre-IPO, Exited, Written Off
  - Toggle between "Current Stage" and "Entry Stage" grouping
  - Drag-and-drop style card layout
- **Table View**: Detailed table with all company information
- **Filters**: Industry, Stage, Status, Deal Sourcer, Search
- **Company CRUD**: Add, Edit, Delete companies
- **Company Details Modal**: Comprehensive view with investment history, founders, legal docs
- **Follow-on Rounds Management**: 
  - Add multiple follow-on investment rounds
  - Track ownership changes through dilution calculations
  - Auto-calculate ownership or manual entry
  - Track whether we invested or passed on each round
  - Ownership history visualization with dilution breakdown

### 3. Company Data Model
```javascript
{
  id: string (unique timestamp-based),
  name: string,
  industry: string,
  hq: string (headquarters location),
  dealSourcer: string,
  analyst: string,
  entryDate: date (YYYY-MM-DD),
  entryStage: string,
  currentStage: string,
  initialInvestment: number (in INR),
  totalInvested: number (calculated),
  latestValuation: number,
  ownership: number (percentage),
  status: 'Active' | 'Exited' | 'Written Off',
  exitValue: number (if exited),
  exitDate: date,
  notes: string,
  followOns: [{
    date: date,
    round: string,
    didWeInvest: boolean,
    ourInvestment: number,
    totalRaised: number,
    preMoneyValuation: number,
    roundValuation: number (post-money),
    ownershipAfter: number,
    documents: [{type, url, addedAt}],
    legalRights: object
  }],
  documents: [{type, url, addedAt}],
  legalRights: {
    boardSeat: {enabled, details},
    observer: {enabled, details},
    preEmptive: {enabled, details},
    antiDilution: {enabled, details},
    proRata: {enabled, details},
    rofr: {enabled, details},
    tagAlong: {enabled, details},
    dragAlong: {enabled, details},
    liquidationPref: {enabled, details},
    conversionRights: {enabled, details},
    vestingSchedule: {enabled, details},
    informationRights: {enabled, details},
    customTerms: string
  },
  founderIds: [string],
  lastInvestmentDate: date
}
```

### 4. Founders Database
- **Founder Profiles**: Name, email, phone, LinkedIn, background, role, location
- **Company Linking**: Link founders to multiple companies (bidirectional)
- **Founder Cards**: Display with avatar, contact info, linked companies
- **Filters**: Search, company filter, location filter
- **CRUD Operations**: Add, edit, delete founders

### 5. Fund Investments (LP Perspective)
- **Fund Tracking**: Track investments in external VC funds
- **Fund Data Model**:
  ```javascript
  {
    id: string,
    name: string,
    manager: string,
    vintageYear: number,
    committedCapital: number,
    strategy: string,
    status: string,
    capitalCalls: [{date, amount}],
    distributions: [{date, amount}],
    navHistory: [{date, nav}],
    notes: string
  }
  ```
- **Metrics**: DPI (Distributions/Paid-In), TVPI (Total Value/Paid-In), XIRR
- **Summary Cards**: Total commitment, called capital, distributions, funds XIRR

### 6. Legal & Rights Management
- **Document Storage**: Upload/link documents per investment round
  - Document types: SHA, Term Sheet, SSA, Due Diligence, Board Letters
  - Supabase Storage integration for file uploads
- **Rights Tracking**: Track legal rights per round
  - Board seat, observer rights, pre-emptive rights, anti-dilution, pro-rata, ROFR, tag-along, drag-along, liquidation preference, conversion rights, vesting schedule, information rights, custom terms
- **Per-Round Legal Data**: Separate legal docs and rights for initial investment and each follow-on round
- **Legal View Page**: Dedicated page to view all legal documents and rights across portfolio

### 7. Analytics & Insights
- **Charts**: 
  - Investment by Stage (pie/bar chart)
  - Investment by Industry (bar chart)
  - Investment Timeline (line chart)
  - Valuation Growth (area chart)
  - Geographic Distribution (if HQ data available)
- **Filters**: Stage, Industry, HQ Location, Year, Status, Investment Amount Range
- **Metrics**: 
  - Portfolio XIRR (Extended Internal Rate of Return)
  - Realized/Unrealized MOIC
  - Average investment size
  - Exit rate
  - Write-off rate
- **Saved Filter Preferences**: Remember user's default filter settings

### 8. Settings Page
- **User Management**: 
  - Add/edit/delete users
  - User roles (Admin, Partner, Analyst, Viewer)
  - User preferences (dashboard widgets, analytics filters)
  - Avatar generation from initials
- **Custom Options Management**:
  - Industries: Add/remove custom industries, track usage count
  - Team Members: Add/remove team members (deal sourcers, analysts)
  - HQ Locations: Add/remove headquarters locations
  - "Remove" hides from dropdowns but keeps in data
- **Cloud Sync Settings**:
  - Toggle cloud sync on/off
  - Push to cloud / Pull from cloud buttons
  - Connection test
  - Last sync time display
- **Data Management**:
  - Export all data (JSON)
  - Import data (JSON)
  - Reset to default sample data

### 9. CSV Import
- **Import Companies**: Bulk import from CSV
  - Column mapping with intelligent aliases
  - Validation and error reporting
  - Preview before import
- **Import Follow-on Rounds**: Bulk import follow-on rounds
  - Match by company name
  - Validate round data
  - Merge with existing companies

### 10. Financial Calculations

#### XIRR (Extended Internal Rate of Return)
- Calculate portfolio-level XIRR
- Calculate fund-level XIRR
- Uses Newton-Raphson method with bisection fallback
- Handles multiple cash flows with different dates
- Negative = outflow (investment), Positive = inflow (return/valuation)

#### Ownership Dilution Calculation
- Calculate ownership after each funding round
- Formula: 
  - Dilution Factor = Total New Capital / Post-Money Valuation
  - Diluted Stake = Previous Ownership × (1 - Dilution Factor)
  - New Stake = Our Investment / Post-Money Valuation
  - Final Ownership = Diluted Stake + New Stake
- Visual breakdown showing each step
- Support for passive dilution (when we don't invest)

#### MOIC (Multiple on Invested Capital)
- Realized MOIC: Exit Value / Total Invested (for exited companies)
- Unrealized MOIC: Current Value / Total Invested (for active companies)
- Portfolio-level MOIC aggregation

### 11. Currency Support
- **Dual Currency**: INR (default) and USD
- **Storage**: All values stored in INR
- **Display**: Convert to USD for display (exchange rate: 83 INR = 1 USD)
- **Formatting**: 
  - INR: ₹1 Cr (crore), ₹1 L (lakh), ₹1K
  - USD: $1B, $1M, $1K
- **Toggle**: Currency switcher in header

## UI/UX Design

### Design System
- **Theme**: Dark luxury minimal design
- **Color Palette**:
  - Background: #050508 (primary), #0a0a10 (secondary), #111118 (tertiary)
  - Brand: #3925be (primary), #5847d4 (secondary), #2a1c8c (tertiary)
  - Text: #f8fafc (primary), #94a3b8 (secondary), #64748b (tertiary)
  - Success: #059669, Warning: #d97706, Error: #dc2626
- **Typography**: Inter font family, various weights (300-800)
- **Spacing**: Consistent spacing scale (--space-1 through --space-16)
- **Border Radius**: sm, md, lg, xl, 2xl, full
- **Shadows**: Subtle shadows with glow effects
- **Transitions**: Smooth transitions (150ms-300ms)

### Layout
- **Sidebar**: Fixed left sidebar (240px width) with navigation
- **Main Content**: Flexible main area with header and page content
- **Header**: Fixed top header with title, search, currency toggle, actions
- **Responsive**: Mobile-friendly with max-width constraints

### Components
- **Cards**: Elevated cards with subtle borders and backgrounds
- **Buttons**: Primary (brand color), Secondary (outlined), Ghost (minimal), Danger (red)
- **Forms**: Clean input fields, selects, textareas with proper labels
- **Modals**: Overlay modals with backdrop, close button, footer actions
- **Badges**: Color-coded badges for stages, statuses
- **Avatars**: Generated from company/founder initials with color coding
- **Tables**: Clean tables with hover states, sortable columns
- **Empty States**: Helpful empty states with icons and CTAs

### Icons
- SVG icons inline (dashboard, portfolio, analytics, settings, etc.)
- Consistent 20px size
- Current color inheritance

## Data Management

### localStorage Keys
- `family_office_portfolio`: Companies array
- `family_office_founders`: Founders array
- `family_office_funds`: Funds array
- `family_office_custom_industries`: Custom industries
- `family_office_custom_team`: Custom team members
- `family_office_custom_hq`: Custom HQ locations
- `family_office_removed_industries`: Removed industries
- `family_office_removed_team`: Removed team members
- `family_office_removed_hq`: Removed HQ locations
- `family_office_currency`: Current currency preference
- `family_office_users`: Users array
- `family_office_current_user`: Current user ID
- `dv_cloud_sync_enabled`: Cloud sync toggle
- `dv_last_sync_time`: Last sync timestamp

### Cloud Sync (Supabase)
- **Tables**: companies, founders, funds
- **Storage Bucket**: legal-documents
- **Sync Modes**: 
  - Pull from cloud: Load all data from Supabase
  - Push to cloud: Upload all local data to Supabase
  - Auto-sync: Automatically push after local changes
- **Realtime**: Subscribe to database changes for multi-user sync
- **Data Transformation**: Convert camelCase (JS) ↔ snake_case (DB)

## Routing

- **Hash-based routing**: `#dashboard`, `#portfolio`, `#analytics`, etc.
- **Pages**: dashboard, portfolio, analytics, settings, founders, funds, legal
- **Browser History**: Support back/forward navigation
- **Default**: Loads to dashboard if no hash

## Sample Data

Include 20 sample companies with:
- Various industries (FinTech, HealthTech, EdTech, SaaS, etc.)
- Different stages and statuses
- Follow-on rounds with ownership calculations
- Legal documents and rights examples
- Linked founders
- Realistic investment amounts and valuations

## Implementation Details

### Module Pattern
- Use IIFE (Immediately Invoked Function Expression)
- Namespace: `FamilyOffice.*`
- No ES modules, all global scope
- Scripts loaded in order via `<script>` tags

### Event Handling
- Event delegation for dynamic content
- Single event listeners on document/container
- Prevent duplicate listeners with flags (`window._navSetup`)

### State Management
- Module-level variables for current state
- localStorage for persistence
- No global state object

### Error Handling
- Try-catch blocks for async operations
- User-friendly error messages
- Console logging for debugging

### Performance
- Load from localStorage first (fast startup)
- Async cloud sync after initial render
- Debounced search inputs
- Efficient filtering and sorting

## Supabase Configuration

### Database Schema
- **companies table**: All company fields with JSONB for arrays/objects
- **founders table**: Founder profile fields
- **funds table**: Fund investment fields
- **Row Level Security**: Enabled with permissive policies (for now)
- **Indexes**: On status, stage, industry, name fields

### Storage
- **Bucket**: `legal-documents`
- **Structure**: `{companyId}/{roundType}/{timestamp-filename}`
- **File Upload**: Support PDF, DOC, DOCX, XLS, XLSX (max 10MB)

### Authentication (Optional)
- Email/password authentication
- User metadata for roles
- Session management
- Can be disabled for direct access

## Key Functions to Implement

### Data Module (`data.js`)
- `initializeData()`: Initialize with sample data if empty
- `getCompanies()`, `addCompany()`, `updateCompany()`, `deleteCompany()`
- `getPortfolioMetrics()`: Calculate AUM, MOIC, XIRR, etc.
- `getFounders()`, `addFounder()`, `updateFounder()`, `deleteFounder()`
- `getFunds()`, `addFund()`, `updateFund()`, `deleteFund()`
- `initializeFromCloud()`, `triggerAutoSync()`
- Custom options management (industries, team, HQ)

### Utils Module (`utils.js`)
- `formatCurrency()`: Format with currency symbols and abbreviations
- `formatDate()`, `formatPercent()`, `formatMOIC()`, `formatXIRR()`
- `calculateXIRR()`: Newton-Raphson + bisection method
- `calculateOwnershipHistory()`: Track ownership through rounds
- `getPortfolioCashFlows()`: Generate cash flows for XIRR
- `filterCompanies()`: Multi-criteria filtering
- `getAvatarColor()`, `getInitials()`: UI helpers

### Components Module (`components.js`)
- `renderSidebar()`: Navigation sidebar
- `renderHeader()`: Page header with search and actions
- `renderCompanyForm()`: Comprehensive company form
- `renderCompanyDetail()`: Company detail modal
- `renderModal()`, `renderConfirmDialog()`: Modal helpers
- `renderSettingsPage()`: Settings page layout
- `renderLegalEditModal()`: Legal documents/rights editor

### Dashboard Module (`dashboard.js`)
- `render()`: Dashboard with all widgets
- `getWidgetPreferences()`: Load user widget preferences
- `renderCustomizeModal()`: Widget customization UI
- Calculate and display all metrics

### Portfolio Module (`portfolio.js`)
- `render()`: Portfolio view (board or table)
- `renderBoardView()`: Kanban board by stage
- `renderTableView()`: Data table view
- `openAddModal()`, `openEditModal()`, `openCompanyDetail()`
- `saveCompany()`: Save with follow-on rounds
- `calculateOwnershipAfterRound()`: Ownership calculation UI

### Analytics Module (`analytics.js`)
- `render()`: Analytics page with charts
- Chart.js integration for visualizations
- Filter management and saved preferences
- Calculate and display metrics

### Supabase Module (`supabase.js`)
- `init()`: Initialize Supabase client
- `uploadFile()`, `deleteFile()`, `getPublicUrl()`: Storage operations
- `getCompaniesFromCloud()`, `saveCompanyToCloud()`, etc.: DB operations
- `pullFromCloud()`, `pushToCloud()`: Sync operations
- `subscribeToRealtime()`: Realtime subscriptions

## Styling Requirements

### CSS Variables
Define comprehensive CSS variables for:
- Colors (backgrounds, text, accents, status)
- Typography (font family, sizes)
- Spacing scale
- Border radius
- Shadows
- Transitions

### Component Styles
- Sidebar navigation
- Cards and containers
- Forms and inputs
- Buttons and badges
- Tables
- Modals and overlays
- Empty states
- Animations (fadeIn, slideUp)

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES5-compatible JavaScript
- localStorage support required
- No polyfills needed for basic features

## Additional Requirements

1. **Versioning**: Add `?v=N` query params to script tags for cache busting
2. **Error Messages**: User-friendly error messages throughout
3. **Loading States**: Show loading indicators for async operations
4. **Validation**: Form validation before submission
5. **Confirmation Dialogs**: Confirm destructive actions (delete)
6. **Keyboard Support**: ESC to close modals, Enter to submit forms
7. **Accessibility**: Proper labels, ARIA attributes where needed
8. **Responsive Design**: Mobile-friendly layouts

## Testing Considerations

- Test with empty data (first load)
- Test with sample data
- Test cloud sync enable/disable
- Test currency switching
- Test all CRUD operations
- Test filters and search
- Test ownership calculations
- Test XIRR calculations
- Test CSV import
- Test data export/import

## Deliverables

1. Complete HTML file (`index.html`)
2. All JavaScript modules in `js/` directory
3. All CSS files in `styles/` directory
4. Sample data file (`sample_companies.csv`)
5. Supabase setup SQL scripts
6. Logo asset
7. README with setup instructions

## Notes

- No build step required - pure HTML/CSS/JS
- All scripts loaded in order (dependencies matter)
- localStorage is primary storage, cloud is optional
- Design should feel premium and professional
- Code should be well-commented and organized
- Use consistent naming conventions
- Handle edge cases (empty data, missing fields, etc.)

---

**This prompt contains all the information needed to recreate the entire Dholakia Ventures portfolio management dashboard from scratch. Follow the structure, implement all features, and ensure the design matches the luxury dark theme described.**
