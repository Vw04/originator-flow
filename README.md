# Homium Originator Platform — Interactive Prototype

High-fidelity front-end mockup of the Homium originator platform redesign (Spec v0.3, March 2026). Built for internal product/design validation.

## Quick Start

Open `index.html` in a browser, or serve locally:

```bash
cd originator-flow
python3 -m http.server 8080
# → http://localhost:8080
```

Or push to GitHub and enable **GitHub Pages** (root of `main` branch).

## How to Use

1. Open the app — you'll see the **Role Selector** landing page
2. Click a role card to enter that role's experience
3. Navigate using the sidebar
4. Make changes (invite users, edit orgs, toggle permissions) — all changes persist for your session only
5. **Refresh** to reset all state to demo defaults
6. Click **Switch Role** in the sidebar footer to return to the role selector

## Roles

| Role | Scope | Key Views |
|------|-------|-----------|
| Homium System Admin | Platform-wide | Dashboard, Orgs, Branches, Users, Permissions, Onboarding |
| Platform Operator | Platform-wide | Dashboard, Orgs, Branches, Users, Onboarding |
| Program Administrator | Company-level | Dashboard, Branches, Users, Onboarding |
| Loan Officer | Branch-level | Dashboard, My Originations, Profile |
| Loan Processor | Branch-level | Dashboard, Applications, Profile |
| Investor | Portfolio | Dashboard, KYC Status |

## File Structure

```
originator-flow/
├── index.html              # App shell
├── css/styles.css          # Full design system
├── js/
│   ├── data.js             # Demo data (users, companies, loans…)
│   ├── state.js            # In-memory session state
│   ├── router.js           # Hash-based SPA router
│   ├── nav.js              # Role-aware sidebar nav
│   ├── app.js              # Entry point + originations view
│   └── views/
│       ├── role-select.js  # Landing role picker
│       ├── dashboard.js    # Role-adaptive dashboard
│       ├── companies.js    # Organization management
│       ├── branches.js     # Branch management
│       ├── users.js        # User roster + invite flow
│       ├── permissions.js  # Policy/permission matrix
│       ├── onboarding.js   # Onboarding wizard + management
│       └── profile.js      # User profile panel + edit
├── assets/
│   ├── branding/           # Homium logos and photos
│   └── screenshots/        # Reference screenshots (not used at runtime)
└── docs/
    └── assumptions.md      # Design/UX decisions and assumptions
```

## Key Interactions

- **Invite User** — fills in-memory roster with "Invited" status; simulates magic link email send
- **Advance Onboarding** — steps a user through the status pipeline (Invited → Email Verified → 2FA → KYC → Active)
- **Permission Matrix** — checkboxes are live; changes persist in session
- **Policy Assignment** — assign/remove policies to users per role
- **Add Org / Branch** — forms create new records visible in all relevant views
- **Edit User / Branch / Org** — in-place edits reflected immediately

## Tech Stack

- Vanilla HTML/CSS/JavaScript — no build step, no framework, no dependencies
- Hash-based SPA routing (`#/dashboard`, `#/users`, etc.)
- In-memory state via plain JS objects
- Inter font via Google Fonts
- GitHub Pages compatible out of the box
