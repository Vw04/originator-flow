# Homium Design Canon

**The single source of truth for the Homium platform's design system.**
This document supersedes the older scattered specs (`assets/specs/design-canon.html`,
`design-canon-vs-brandkit.html`, `design-canon-iterations.html`,
`design-canon-action-bar.html`). Archive those — see `MIGRATION.md`.

Working reference implementation: `reference/onboarding-dashboard.html`.
Tokens: `tokens.css`. How to build against this: `CLAUDE.md`.

---

## 1. Foundations

### Tokens
All values live in `tokens.css` as CSS custom properties. **Reference tokens; never
hardcode** a color, radius, or spacing a token covers. If you need a value no token
provides, that's a design decision (see CLAUDE.md → the build loop).

### Color strategy — restrained
Tinted neutrals + one brand action color (navy `--h-action`, `#00334A`). Light is
default; dark remaps action to gold. Never `#000`/`#fff` directly — use `--h-white`,
text/surface tokens (all tinted toward the brand hue).

- **Action / brand:** `--h-action` (navy). The *only* brand action color.
- **Status semantics:** success/warning/error + their `-bg` tints. Red/green appear
  **only** in status pills and diverging charts — nowhere decorative.
- **Surfaces:** `--h-surface-1` (cards), `--h-bg` (page), `--h-surface-2/-hover`.
- **Borders:** `--h-border` (1px hairline everywhere).

### Typography
- **Heading font:** Source Serif 4 (`--h-font-heading`), **weight 400 only — never bold.**
  Native lining figures. Used for page titles, card section titles, KPI display numbers.
- **Body + numbers:** Inter (`--h-font-body`). Numbers use tabular + lining figures
  (`.h-num` / `font-feature-settings:'tnum' 1,'lnum' 1`) so columns of digits align.
- **Type scale (rank — page H1 outranks card titles):**
  - Page H1 = **28px** / 400 serif (`.PageHeader__title`, `.SectionTitle--page`)
  - Card section title = **20px** / 400 serif (`.SectionTitle`)
  - Eyebrow label = **10–11px** / 600 / uppercase / `0.12em` Inter, muted color
    (card labels, flyout headers, notification header)
  - Body = 13px, secondary text = 11–12px
  - KPI display number = 36px serif
  - **Rule:** never use 20px for a page-level title.
- Cap body line length ~65–75ch. Hierarchy via scale + weight (≥1.25 step ratio).

### Spacing
Only the `--h-space-*` scale (2/4/8/12/16/20/24/32/40/48/64). No arbitrary px for
padding/margin/gap. Vary spacing for rhythm; don't pad everything identically.

### Radius
`--h-radius-sm` 4 · `md` 6 · `lg` 8 · `xl` 12 · `full` 999 (pills, avatars).

### Elevation
**Cards are flat** — 1px `--h-border`, no box-shadow. Shadows (`--h-shadow-*`) are
**reserved for overlays**: modals, dropdowns, flyouts, tooltips.

### Motion
Ease-out (quart/quint/expo), ~120ms. No bounce/elastic. **Never animate layout
properties** (width/height/top/left) — animate `opacity`/`transform`. Honor
`prefers-reduced-motion`. A load-time `.no-transition` guard prevents first-paint flash.

### Iconography
Tabler Icons, **shipped as inline SVG** (never the icon webfont). Inline SVG so icons
export to Figma as vectors and round-trip through html.to.design. Each icon's geometry
carries `stroke="currentColor"`, wrapped in `<svg class="ti ti-{name}" width="1em"
height="1em" viewBox="0 0 24 24">` so it inherits **size from font-size** and **color
from `color`** (a drop-in for the old `<i class="ti">`). 20–22px in the rail, 16px inside
components. Never mix icon libraries; never reintroduce the icon webfont.

---

## 2. Navigation — the SideRail (only nav)

A **92px fixed left rail** (`--h-sidenav-width`). There is **no top nav**
(`--h-top-nav-height: 0`). Structure, top to bottom:

1. **Logo** (H mark), hairline border below.
2. **Search tile** (pinned top of nav) — opens a search popover beside the rail.
3. **Nav tiles** — icon + label, column layout, ~75×59px. Per-role (see §6).
4. **Administration flyout tile** (admin-tier roles) — opens a right-side menu.
5. **Footer:** Notifications (Alerts) tile + badge, Settings tile, Profile block
   (avatar + name + role) with a role/account dropdown.

### Tile states
- **Hover:** `rgba(0,51,74,0.08)` fill + navy text.
- **Active:** filled pill `--h-action-bg-strong` (`#C5DCE6`) + navy text, weight 600.
  **No left indicator bar** — the filled pill is the single active signal.

### Flyouts & overlays (Administration, Setup, Search, Notifications, Profile)
- Open to the **right** of the rail (`left: calc(var(--h-sidenav-width) + 8px)`).
- **Tile-anchored** flyouts: top aligns to the tile, **flip to bottom-anchored** if
  they'd overflow the viewport. Footer overlays (notif/profile) anchor `bottom:14px`.
- **No arrow/pointer** connectors — the highlighted trigger signals ownership.
- **Entrance:** fade + 6px slide-in, 120ms (`opacity`/`transform`, pointer-events gate).
- **Mutually exclusive** — opening one closes the others.
- Close on outside-click and **Escape** (Escape returns focus to the trigger).
- A11y: triggers carry `aria-haspopup` + `aria-expanded`; flyout menus support
  ArrowUp/Down/Home/End roving focus; `:focus-visible` ring on all interactives.

---

## 3. Components

### Status pills — the ONLY colored badge
`.StatusPill` + variant. 999px radius, 6px colored `.StatusDot` + same-color text on a
tinted bg. Variants: `--success` (green), `--warning` (amber), `--error` (red),
`--neutral` (gray). Every status cell uses a pill — never bare text.

### Role & entity pills — ghost-outlined, identical for all
`.RolePill` / `.EntityPill`: transparent bg, 1px `--h-stone` border, `--h-text-secondary`
text, 999px. **No per-role colors.** Role labels in Title Case ("Loan Officer").

### Avatars — one style for everyone
`.Avatar` (+`--sm` 28px): `--h-avatar-bg` (teal-50) / `--h-avatar-text` (teal-500).
No per-user colors. "Invisible infrastructure."

### Inputs
Compact `--h-input-height` (32px) for tables/forms; `--h-input-height-wizard` (40px)
for multi-step wizard fields. 1px `--h-stone` border, `--h-radius-md`, focus →
`--h-action` border. `.SearchInput` / `.SearchWrap` for search fields.

### Cards
`.Card`: `--h-surface-1`, 1px `--h-border`, `--h-radius-lg`, **24px** padding
(`--h-space-24`), **no shadow**. Don't nest cards. Don't wrap everything in a card.

### Tables
`.Card` > `.TableCard__header` (`.SectionTitle` + `.TableCard__actions`) >
`.TableScroll` > `table.DataTable` > `.TableFooter`. Use `.UserCell` (Avatar+name)
for person cells, `.h-num` for numeric columns.

### Buttons
`.Btn` + `.Btn--primary` (navy, filled) / `--ghost` / `--sm`.
Primary action is navy `--h-action`, **never green**. (No `--secondary` variant — use ghost.)

### List / Detail view recipe (build every list screen this way)
Most data screens are an index list that drills into a detail. Compose them from
existing parts so they all look and behave the same:

1. `.PageHeader` → `.PageHeader__title` (page H1) + `.PageHeader__subtitle` (count/summary).
2. `<section class="KPIStrip">` of `.KPICard`s for the headline metrics (accent an alert
   metric with `--h-error`). Optional but standard on index pages.
3. `.Card` → `.TableCard__header` (`.SectionTitle` + `.TableCard__actions` for search /
   primary CTA) → `.TableScroll.TableScroll--no-fade` → `table.DataTable` → `.TableFooter`
   (the count).
4. Rows: `.UserCell` (Avatar + name) for people; `.h-num` for numeric columns; a
   `.StatusPill` for any status. A loan/record id is navy (`--h-action`), the name below it.
5. **Drill-in:** a row click hides the list and shows the detail view in place (no route
   change); the detail carries a sticky `.BackToMain` that returns to the list. (See
   Applications → wizard and Originations → detail in the reference.)

Render rows in JS from a data array; never hand-author table rows. Search filters the
array and re-renders. This recipe is the default for any new index screen.

### Save / action bar
Save-only — **no Cancel** (the sticky BackToMain is the cancel route). Save label
names the entity ("Save company" / "Save branch"). Navy primary button.

### KPI strip
`.KPIStrip` (connected bar) > `.KPICard` (`__label` / `__value` / `__subtitle`).
Values are serif display numbers; accent an alert KPI with `--h-error`.

### Absolute bans
- **Side-stripe borders** (colored `border-left/right` > 1px on cards/list-items/alerts).
- **Gradient text** (`background-clip:text`). Emphasis via weight/size, one solid color.
- **Glassmorphism** as decoration. **Modal as first thought** (exhaust inline first).
- **Em dashes** in UI copy.

---

## 4. Data visualization
- **Single-variable bars:** `--h-data-1` (brand teal) base + opacity stepping
  (0.40 / 0.55 / 0.70 / 0.85 / 1) — a sequential teal ramp.
- **Multi-series order:** `--h-action` (navy) → `--h-teal-500` → `--h-teal-200`.
- **Red/green only in diverging charts** — never as a default chart accent.
- **Tooltip:** white bg, 1px border, **3px navy (`--h-action`) top accent** (never
  green — green stays reserved for diverging-positive data). Two lines: Inter 11px
  label + **Source Serif 18px** value.
- **Dim-siblings hover:** container `.is-hovering`, bar `.is-hovered`; siblings →
  opacity 0.40, hovered → 0.85. **Never** `filter: brightness()`.

---

## 5. UX writing
Sentence case for UI labels and buttons. Every word earns its place — no restated
headings, no intros repeating the title. No em dashes (use commas/colons/parens).

---

## 6. Role model (RBAC)

Six roles (+ Investor Prospect). The rail adapts per role; page content is
role-independent (access is gated by which pages a role can reach).

| Role | Nav tiles | Administration flyout |
|---|---|---|
| **System Admin** | Dashboard · Applications · Originations · Batches · Activations | Admin Dashboard · Origination Companies · Investors · Platform Operator · System Config · User Management |
| **Platform Operator** | (same as System Admin) | (same, minus User Management) |
| **Program Admin** | Dashboard · Applications | My Company |
| **Loan Officer** | Applications · My Profile | — |
| **Loan Processor** | Applications · My Profile | — |
| **Investor** | Dashboard · Portfolio · My Profile | — |
| **Investor Prospect** | Dashboard | — (no notifications) |

Search and Profile are present for every role; Notifications for all except Investor
Prospect.

---

## 7. Layout shell
- Content offsets right of the rail by `--h-sidenav-width`; max width `--h-content-max-width`.
- Forms/wizards use the narrower `--h-form-max-width` inner column.
- Detail pages: sticky in-page sub-nav sits at `top: 32px` (page padding), not behind
  any top bar. Tab strips have **16px** below them, platform-wide.
