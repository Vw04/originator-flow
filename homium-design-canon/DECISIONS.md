# Homium Design Decisions Log

Append-only record of design decisions. Newest at top. Every deviation from the
canon, every new pattern, and every resolved trade-off goes here — so the system
stays auditable and we never re-litigate a settled call.

Format: **ID · date · decision — rationale.** Roles: Xivic = UX/UI authority;
Vince/Homium = product & flow authority. Where we overrode Vince's spec, it's noted.

---

## 2026-05-28 — v2 canon review + originator-flow incorporation

### Navigation
- **NAV-1 · Top nav → 92px fixed left SideRail.** Single global nav; top nav retired.
  Tiles are icon+label (Tabler webfont). Settings + Sign out moved to the rail footer.
- **NAV-2 · Active tile = filled pill, no bar.** Fill `--h-action-bg-strong` + bold
  navy label is the sole active signal. Dropped the 3px left bar (redundant; sat on
  the weakest edge). Rejected Vince's `#C5DEF5` Material blue and an interim warm-sand
  fill (hue-clashed with the cool hover) in favor of the on-brand navy tint.
- **NAV-3 · Flyouts: tile-anchored, flip on overflow, simplified, fade+slide.**
  Click-to-toggle; mutually exclusive; close on outside-click/Escape. No arrow/pointer
  connectors (the highlighted tile signals ownership). Fixes Vince's `bottom:0`
  upward-growth bug.
- **NAV-4 · Setup flyout = Administration parity; single nav source.** Per Vince's
  canon (Setup = Companies/Branches/Users, no duplicate in-page sub-nav). Navigating
  to a Setup page always lands on its list view (incl. same-page re-click reset).
- **NAV-5 · Rail is fully labeled.** Footer Notifications ("Alerts") + Settings became
  icon+label tiles matching the nav, for one consistent column (vs icon-only utility).
- **NAV-6 · Overlay entrance unified.** Notification panel + profile dropdown now use
  the same fade + 6px slide (120ms) as the flyouts. No section-divider labels (rail is
  short enough that grouping adds chrome).
- **NAV-7 · Global search = rail tile + input-only popover.** Prototype scope stops at
  the search field; cross-entity results are a later spec (command palette ⌘K deferred).
- **NAV-8 · Detail sub-nav sticky offset 80px → 32px.** The 80px was a stale top-nav
  offset; with no top nav it aligns to the 32px page padding.

### Components
- **CMP-1 · Avatars: one teal style for everyone** (`--h-avatar-bg`/`--h-avatar-text`).
  No per-user colors. Matches Vince's "invisible infrastructure" canon; fixed the rail
  avatar that was diverging to navy.
- **CMP-2 · Pills:** status pills are the only colored badge; role/entity pills are
  ghost-outlined and identical. Role labels Title Case ("Loan Officer") — kept over
  Vince's "sentence case" note (reads as proper role names).
- **CMP-3 · Wizard input height = 40px** (`--h-input-height-wizard`); compact
  tables/forms stay 32px. Was a hardcoded 36px.
- **CMP-4 · Cards flat, 24px padding; save bars save-only.** (Confirmed already
  canon-compliant in our prototype.)

### Typography
- **TYP-1 · Source Serif 4, weight 400 only.** Page H1 28px, card section title 20px,
  KPI numbers 36px serif; eyebrow labels 10–11px uppercase Inter. (Already adopted;
  verified.) Notification panel title changed from serif → uppercase eyebrow to match
  the flyout headers + card-label convention.

### Data viz
- **DV-1 · Tooltip top accent stays NAVY, not green.** *Override of Vince's spec.*
  Vince specced a green-500 top accent, but his own rule reserves red/green for
  diverging data only — a green accent on neutral tooltips would mislead. Kept navy.
- **DV-2 · Tooltip value = Source Serif 4 18px.** Adopted Vince's spec; required
  lifting `.ChartTooltip__value` out of the global "numbers are always Inter" rule.
  Trade-off accepted: tooltip value is serif while the bars' inline values stay Inter.
- **DV-3 · Bar palette = brand teal ramp** (`--h-data-1` = `--h-teal-500` + opacity
  stepping). Replaced an off-brand muted blue (`#5A8AA0`). Multi-series order
  navy → teal → light blue.

### Incorporation of Vince's originator-flow
- **INC-1 · Adopt Vince's 6-role model** (+ Investor Prospect) as canonical, replacing
  our 3-role set. Vince owns the RBAC/flow domain. Rail adapts per role; page content
  decoupled from role (slug-keyed), access gated by each role's page set.
- **INC-2 · Overlapping views reconciled case-by-case.** Kept our canon-aligned table
  views (companies/users). "Origination Companies" reuses the companies table. The
  heavy LOP data-platform + investor views reclassified as net-new builds (Phase 3);
  functional reuses kept interim.
- **INC-3 · Applications = list view (net-new), wizard as detail.** Built the LOP
  Applications list on canon components (KPIStrip, DataTable, StatusPill, Avatar);
  row/"+ New" drills into the existing wizard; back returns to the list. Also fixed a
  back-link hardcoded to the removed `originator` role.
- **INC-4 · Investor gets its own home.** New Investor Dashboard (`investor-dashboard`
  slug, so it no longer borrows the admin onboarding dashboard) = KPIStrip + Allocation
  (CompanyProgress bars) + Recent distributions (Activity feed). New Portfolio = KPIStrip
  + positions DataTable.
- **INC-5 · Profile (shared) + Investor Prospect dashboard.** One role-aware Profile
  serves Loan Officer / Processor / Investor. Prospect dashboard = onboarding checklist
  + opportunities table; notifications stay hidden for that role.
- **INC-6 · Data-platform tabs built as list views.** Originations / Batches / Activations
  are canon list views (KPIStrip + DataTable + StatusPill). Originations rows drill into
  the existing origination detail (`amOriginations`) via a new "Back to Originations" link.
- **INC-7 · Page content is slug-keyed, not role-keyed.** All new views render by page
  slug; access is gated by each role's `pages` map. This is the rule for future screens —
  build one view per slug, let roles point at it.
- **INC-8 · RBAC permissions matrix (simple version).** Built as the System
  Configuration page: capability rows × role columns with togglable checkboxes
  (navy accent, demo-only). To be deepened against Vince's full RBAC spec later.
- **CANON-1 · Codified the List/Detail view recipe** in DESIGN_CANON.md §3 so every
  future index screen is composed the same way (PageHeader + KPIStrip + TableCard +
  DataTable + StatusPill, row → in-place detail with sticky Back).
- **FIX-1 · Branch screens un-parked + dead-role nav fixed.** The Create/list/detail
  branch screens existed but were unreachable: `setup-branches` was parked (not in any
  role's `pages`) and the company-detail "+ New branch" / branch-row handlers hardcoded
  the removed `navigate('admin', …)` role. Added `setup-branches` to the company-managing
  roles (System Admin / Platform Operator / Program Admin) and switched the three handlers
  to `navigate(currentUser, …)`. Full flow now works: company detail → + New branch →
  Create branch form.
- **FIX-2 · User-detail drill un-blocked (same bug class).** The "Users assigned to this
  branch" rows (branch + company detail) hardcoded `navigate('admin','setup-users')`, and
  `setup-users` wasn't in operator/prog_admin `pages`. Switched to `navigate(currentUser,…)`
  and added `setup-users` to those roles. Flow now works: branch detail → click user →
  user detail. NOTE: an earlier sweep regex missed the *escaped-quote* form (`\'admin\'`);
  re-ran with `grep -E "navigate\\([^)]*(admin|account-manager|originator)"` which is the
  correct check — **0 dead-role navigates remain** across the whole file.
- **ICON-1 · Icons ship as inline SVG, not the webfont.** The Tabler *webfont*
  (`<i class="ti">`) doesn't export to Figma — html.to.design can't carry over
  `::before` glyph content, so rail icons came through blank. Replaced all webfont
  icons with inline Tabler SVG via a `tablerIcon()` helper + `TABLER_ICONS_SVG` map
  (geometry uses `currentColor`, sized by `font-size` so existing `.ti` CSS still
  applies). Dropped the webfont `<link>`. Resolves the drift from Vince's own note
  ("in HTML prototypes use inline SVG matching Tabler path data") and makes every
  icon export to Figma as a vector. Canon §Iconography updated.

### Known prototype limitations (not blockers)
- List rows that drill into a detail (Applications → wizard, Originations → detail) all
  open the **same** demo detail record. Acceptable for the prototype; real data wires
  the row's id through later.
- Search popover is input-only (results deferred).
- Permissions matrix toggles are not persisted (demo); deepen with the RBAC spec.
