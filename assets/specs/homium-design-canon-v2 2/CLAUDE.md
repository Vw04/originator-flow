# Homium Design Canon

The complete design system for the Homium platform — tokens, typography, components, patterns, layouts, and behavioral conventions. This document is the **single source of truth** for any UI work on Homium.

_Last updated: 2026-05-26. This canon supersedes the 2026-05-19 dev team handoff. Key overrides: heading typeface is IvyPresto Display 300 (not Source Serif 4); global navigation is the 92px left icon rail (not the top NavBar); PermissionsMatrix uses binary on/off or explicit text labels (not the dot vocabulary system). All other 2026-05-19 patterns are adopted unless noted._

---

## How to Use This Document

1. **Place `CLAUDE.md` at the root of your project.** Claude Code automatically reads any `CLAUDE.md` in the working directory and uses it as its instruction set. Drop this file in your repo root and it becomes Claude's source of truth on every task.
2. **Use the prototype (`index.html`) as the implementation reference.** Located in the 2026-05-19 handoff. Open it in a browser to inspect components; grep it for class usage examples. Where the prototype and this document disagree, **this document wins** — it incorporates decisions made after the prototype was built.
3. **Keep this document evergreen.** When a new pattern is introduced and approved, document it here in the same pass. Treat doc-debt the same as code-debt.

---

## Working Agreement (for Claude Code — and every contributor)

Read this before every task. It applies whether you are updating the prototype, building a new page, or editing a component.

### The default — always

- **Describe before tweaking.** Before touching any file, state clearly what you are about to change and why. For small edits, a one-line preview is enough. For larger changes, present a brief plan with file paths and rationale. The user always sees what is coming before it lands.
- **Reuse over invent.** Use existing tokens, components, and patterns documented here. Never invent a new color value, spacing unit, pill shape, button variant, or layout convention without explicit approval.
- **Surface options.** When a task could go several ways, present 1–3 approaches with trade-offs and let the user choose. Do not pick silently. This is especially important for design decisions — color semantics, button hierarchy, table behavior — where reasonable people disagree.
- **Files are the source of truth.** Read the current state of the file before editing. Do not work from memory of past conversations.

### Stop and ask before…

- Adding a **new library component** — Modal variants, new card types, new button modifiers, new chart types, new form-field variants
- Adding or modifying **design tokens** — colors, spacing scale entries, type scale entries, radius values, shadows
- Introducing a **new pattern** — new table column type, new sticky-bottom variant, new dirty-state mechanism, new keyboard shortcut
- **Breaking changes** — renaming a class, changing a CSS variable's meaning, retiring a component
- **Out-of-scope edits** — flag consistency drift as a separate follow-up; do not fix silently in the same PR

### Safe to do without asking

- Use any existing component, token, layout, or pattern documented here exactly as documented
- Apply explicit instructions exactly as given (e.g., "change the button to outlined" — just do it after stating the change)
- Restate your change plan before making the edit (confirming intent, not asking permission)

### When the user asks for something this document does not cover

1. State what pattern you think they are asking for
2. List what already exists nearby that might solve it
3. Present 2–3 options if a new pattern is needed, with trade-offs
4. State your recommendation — but ask before implementing

---

## Quick Reference

| Looking for… | Section |
|---|---|
| Colors, tokens, dark mode | [Color Philosophy](#color-philosophy), [Brand Color System](#brand-color-system) |
| Type scale, font choices, numeric content | [Typography](#typography) |
| Spacing scale, radii, shape vocabulary | [Spacing & Shape](#spacing--shape-vocabulary) |
| Global navigation (left rail) | [Navigation — Global Left Rail](#navigation--global-left-rail) |
| Detail-page sub-navigation | [Navigation — Detail Page Sub-Nav](#navigation--detail-page-sub-nav) |
| Back links, form exit | [Navigation Patterns — BackToMain](#navigation-patterns) |
| Button variants and hierarchy | [Buttons & Action Hierarchy](#buttons--action-hierarchy) |
| Tables, columns, cells, footers | [Tables](#tables) |
| Cards (table card, detail card, KPI, chart) | [Cards](#cards) |
| Forms — fields, save bars, dirty modal | [Forms](#forms) |
| Status pills, role pills, tags, badges | [Pills & Tags](#pills--tags) |
| Modals and confirm dialogs | [Modal (library)](#modal-library) |
| Permissions matrix | [PermissionsMatrix](#permissionsmatrix) |
| Layouts (DetailPage, PageHeader, surfaces) | [Layout](#layout) |
| Charts and data visualization | [Charts & Data Visualization](#charts--data-visualization) |
| Icons | [Icon Library](#icon-library--tabler-icons) |
| User roles and routing | [User Roles & Routing](#user-roles--routing) |
| Responsive design | [Responsive Design](#responsive-design) |
| Deferred items and backlog | [Deferred Items & Backlog](#deferred-items--backlog) |

---

## Golden Rules

1. **Always follow the design system.** Every color, spacing value, font, and component pattern must come from this file. No arbitrary values. No exceptions.
2. **Build the component library.** Every reusable piece becomes a component in the library. This library is the reference for all future pages.
3. **Compose from existing components first.** When building a new page, check the component library and assemble from what exists. Do not rebuild what already exists.
4. **Ask before adding new components.** If a screen needs a component that does not exist in the library, stop and ask before creating it.
5. **Index pages separately.** Each page/screen is its own file in production. The prototype keeps everything in a single `index.html` for speed; production should split. Include a dev widget (bottom-right, collapsible) showing current user role and page name in dev mode only.
6. **Files are the source of truth.** Always read the current state of `CLAUDE.md`, the component library, and the page files before making changes. Never work from memory.
7. **Update this file when rules change.** If a new pattern is established during a task, document it here before finishing.

---

## Project Overview

Homium is a fintech platform for shared appreciation mortgage loans. We are redesigning the entire platform (currently live at homium.io) to create a best-in-class institutional fintech experience. The platform serves **institutional investors, mortgage lenders/originators, and internal operations teams** — not consumers.

---

## Design Philosophy

**Material Design 3 inspired, Homium branded.** M3 as UX reference (interaction patterns, accessibility, state management, component behavior) with a fully custom visual layer. Material's bones, Homium's skin.

Key departures from stock M3:
- **Flat + borders** instead of shadow-based elevation. Cards use `1px solid #E0DDD6` borders and surface color shifts, not drop shadows. Shadows only for overlays (modals, dropdowns, tooltips).
- **Compact density** as default. 36px table rows, 32px input heights, 28px chips. Professional users need data density, not consumer-app whitespace.
- **Warm neutrals** instead of cool grays. Airy warm page bg (#F9F8F4), pearl for readonly fills (#F8F7F4), sand for hover tints (#F2F0EA), stone (#E0DDD6) borders — not #F5F5F5/#E5E7EB.
- **Custom component library** (React + Tailwind or CSS modules), not MUI. Use Radix UI or Headless UI for accessible primitives.

---

## Color Philosophy — "Color is Signal, Not Decoration"

Four distinct color tracks. Each color on screen maps to exactly one meaning.

### 1. Action color (interactive UI)
- **Light mode:** Navy `#00334A` (`--h-action`)
- **Dark mode:** Gold `#D4A017` (`--h-action`)
- Used for: buttons, links, hover states, focus rings, active nav indicator, hovered chart elements
- NEVER used for: charts (static), status indicators, decorative elements

### 2. Success color (status only)
- Both modes: Green (`--h-success`)
- Used for: completed/approved/verified status pills, success messages, success icons
- NEVER used for: buttons, links, hover, generic "action" UI

### 3. Semantic colors (status only)
- Warning amber, error red, info teal
- Used for: status pills, alert states, badges
- NEVER used for: actions or data

### 4. Data viz neutral palette (charts only)
- `--h-data-1` through `--h-data-4` — muted teal-grays in light, brighter teals in dark
- Used for: chart bars, lines, fills, progress bars
- NEVER used for: actions or status
- On hover, a chart element shifts to `--h-data-hover` (which equals the action color) — the only intentional overlap, signaling interactivity

### Forbidden combinations
- Green button (would conflict with success status)
- Navy chart bar in light mode (would conflict with action)
- Gold chart bar in dark mode (would conflict with action)
- Action color used as a static badge/label (would falsely signal "click me")

### Number typography rule
All numerical content uses Inter with `font-feature-settings: 'tnum' 1, 'lnum' 1`. IvyPresto Display is reserved for display-scale numbers (KPI values, entity counts) — NEVER appears in dense chart labels or tabular financial data. SF Mono is used for technical identifiers (Loan IDs, MIN numbers).

---

## Brand Color System

### Core Palette
| Token | Hex | Role |
|-------|-----|------|
| `teal-900` | `#00334A` | Logo, headings, nav — brand anchor |
| `teal-700` | `#0A4D6B` | Hover states |
| `teal-500` | `#1A6E8E` | Active/Focus |
| `teal-200` | `#A3C5D4` | Subtle fills |
| `teal-50` | `#E0EDF3` | Tinted backgrounds, info bg, avatar bg |
| `green-900` | `#0D6B40` | Pressed state |
| `green-700` | `#117A4A` | Hover state |
| `green-500` | `#14935F` | **Primary CTA / Action Accent.** All primary buttons. |
| `green-200` | `#A8D7BE` | Subtle fills |
| `green-50` | `#E4F3EB` | Success/positive pill backgrounds |

### Green (#14935F) — The Action Accent

Green's only job is to signal interactivity and call-to-action. "Green = I can do something here."

**Where green appears:**
- Primary CTA buttons (filled)
- Text links and interactive text
- Table row hover: 3px green left-border
- Card hover (when clickable): 1px green border replaces stone border
- Chart tooltips: 3px `green-500` top accent border — direction-independent
- Focus rings: keyboard focus uses green outline

**Where green NEVER appears:**
- Avatars, chart bars, graph fills, backgrounds, decorative elements
- Entity type pills, role pills
- Status indicators (those use success green #1A8754 — a DIFFERENT color)

### Semantic Text Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `--h-text-primary` | `#2D3E4A` (slate) | Names, body text, table content, activity descriptions |
| `--h-text-secondary` | `#6B7A85` (gray-500) | Descriptions, metadata, KPI labels, captions |
| `--h-text-muted` | `#9BA6AE` (gray-300) | Timestamps, column headers, axis labels, placeholders |
| `--h-text-disabled` | `#C4C9CC` (gray-200) | Disabled states |
| `--h-text-heading` | `#00334A` (teal-900) | Page titles, section titles |

Primary text uses slate (#2D3E4A), NOT midnight (#061D29). Midnight is too harsh against warm backgrounds. Headings keep teal-900.

### Warm Neutrals
| Token | Hex | Role |
|-------|-----|------|
| `midnight` | `#061D29` | Reserved — prefer `--h-text-heading` |
| `slate` | `#2D3E4A` | **Default text color** (`--h-text-primary`) |
| `gray-500` | `#6B7A85` | Muted text, captions |
| `gray-300` | `#9BA6AE` | Placeholders, column headers |
| `gray-200` | `#C4C9CC` | Disabled text |
| `stone` | `#E0DDD6` | Borders, dividers, card outlines |
| `warm-gray` | `#EDEBE6` | Subtle borders, row dividers |
| `bg` | `#F9F8F4` | **Page background** |
| `sand` | `#F2F0EA` | Hover-state tint; nested expanded backgrounds |
| `pearl` | `#F8F7F4` | Alt surface, zebra stripe rows, readonly/disabled input fills |
| `white` | `#FFFFFF` | Card surfaces |

### Semantic Colors — CRITICAL: do not confuse CTA green with success green
| Token | Hex | Usage |
|-------|-----|-------|
| `--h-success` / `success` | `#1A8754` | Gains, confirmations, loan funded, appreciation |
| `--h-success-bg` / `success-bg` | `#E4F3EB` | Success banners, positive pill fills |
| `--h-warning` / `warning` | `#B8860B` | Pending review, approaching limits |
| `--h-warning-bg` / `warning-bg` | `#FEF3E2` | Warning banners, alert pill fills |
| `--h-error` / `error` | `#C4382A` | Failed, rejected, overdue, depreciation |
| `--h-error-bg` / `error-bg` | `#FDE8E6` | Error banners, destructive pill fills |
| `--h-info` / `info` | `#1A6E8E` | Neutral info, tooltips, onboarding |
| `--h-info-bg` / `info-bg` | `#E0EDF3` | Info banners, help pill fills |

**Removed token:** `--color-purple` (`#7C3AED`) — removed entirely. The brand forbids decorative purple. If any reference to this token appears in code, remove it.

### Dark Mode (deferred — Phase 3; captured here for reference)
| Token | Hex | Role |
|-------|-----|------|
| `dark-bg` | `#071620` | Page base |
| `dark-surface-1` | `#0A1F2E` | Cards, panels |
| `dark-surface-2` | `#122A3A` | Elevated cards |
| `dark-border` | `#1A3A4D` | Dividers |
| `dark-hover` | `#234A5E` | Interactive hover |
| `dark-text-primary` | `#FFFFFF` | Headings |
| `dark-text-secondary` | `#E8E4DF` | Body text (warm white, not pure white) |
| `dark-text-muted` | `#8A9BAA` | Captions |
| `dark-green-cta` | `#1EAA6E` | CTA — brightened for contrast on dark |
| `dark-success` | `#22B878` | Positive indicators |
| `dark-error` | `#E07B6F` | Softened red |
| `dark-warning` | `#DBA64A` | Softened amber |
| `dark-info` | `#5AAFCC` | Brightened teal |

---

## Typography

**Two fonts. Clean separation by role.**

### IvyPresto Display (headings, display numerals)

IvyPresto Display is the platform's heading serif. Used for every title and heading surface in the UI — page titles, section titles, card titles, entity-detail headers, and KPI display numbers.

- **Token:** `--font-heading: 'IvyPresto Display', Georgia, 'Times New Roman', serif;`
- **Weight: always 300 (Light).** Never bold, never 400. The light weight reads as elegant and institutional; bolding it reads as heavy/corporate.
- **Feature settings:** `font-feature-settings: 'lnum' 1, 'kern' 1; font-variant-numeric: lining-nums;`
- Applied globally via a selector list covering `.PageHeader__title`, `.SectionTitle`, `.KPICard__value`, `.DetailHeaderCard__title`, `.Card__title`, `.StepCard__title`, and `h1..h6`.

**Why IvyPresto Display over Source Serif 4:** We hold the IvyPresto Display license, and IvyPresto 300 produces a distinctly more refined, lightweight elegance that aligns with our institutional positioning. Source Serif 4 is the dev team's reference implementation font — a strong choice, but ours is IvyPresto. Georgia remains in the fallback stack for load windows and offline degradation.

**Note:** The dev team's prototype uses Source Serif 4. When reading the prototype's heading styles, translate `Source Serif 4 / weight 400` to `IvyPresto Display / weight 300` — the semantic intent is identical.

### IvyPresto Display for Display Numerals

KPI values, entity counts, and display-scale financial figures also use IvyPresto Display 300. This keeps large numbers visually unified with their heading context.

- KPI values (36px), entity header amounts, large display figures: IvyPresto Display 300
- Apply tabular OpenType features: `font-feature-settings: 'tnum' 1, 'lnum' 1, 'zero' 0;`
- Dense tabular data in table bodies stays Inter 700 — IvyPresto is for display-scale numbers only

### Inter (UI, body, all tabular data)

Variable font, loaded from Google Fonts. Used for everything that is not a heading or display number: body text, labels, buttons, table cells, chart labels, financial figures in tables, AND technical identifiers (Loan IDs, MIN numbers).

- **Feature settings for numeric content:** `font-feature-settings: 'tnum' 1, 'lnum' 1, 'zero' 0; font-variant-numeric: tabular-nums lining-nums;`
  - `tnum 1` — tabular numerals (equal width per digit → perfect column alignment)
  - `lnum 1` — lining figures (consistent height)
  - `zero 0` — plain circular zero. No slash. Matches Excel and standard financial UIs.
- Applied globally via `.h-num` / `[data-numeric]` selectors covering `.KPICard__value--table`, `.FunnelChart__value`, `.StageDuration__value`, `.ChartTooltip__value--table`, `.DataSection__value--mono`, `.DataGrid__value--mono`.
- **Weights in use:** 400 body, 500 secondary labels, 600 semibold labels/nav, 700 KPI table values (with `letter-spacing: -0.02em` on KPIs)

### SF Mono / Menlo (technical identifiers)

Retained for: technical IDs shown in code chip context (Loan IDs, MIN numbers when displayed in `Tag--code` style), the dev widget, and inline code in documentation.

- 11px, used only inside `.Tag.Tag--code` or `.DevWidget` contexts
- Do not use for general financial data — that stays Inter

### Typography Table

| Role | Font | Weight | Size | Color |
|------|------|--------|------|-------|
| Page title / `.PageHeader__title` | **IvyPresto Display** | 300 | 28–32px | `--h-text-heading` |
| Section titles / `.SectionTitle` | **IvyPresto Display** | 300 | 20px | `--h-text-heading` |
| Page-level section title / `.SectionTitle--page` | **IvyPresto Display** | 300 | 28px | `--h-text-heading` |
| Detail entity title / `.DetailHeaderCard__title` | **IvyPresto Display** | 300 | 28px | `--h-text-heading` |
| KPI display numbers / `.KPICard__value` | **IvyPresto Display** | 300 | 36px | `--h-text-heading` or `--h-alert-text` |
| Card labels | **Inter** | 600 | 11px uppercase, ls 0.06em | `--h-text-secondary` |
| Column headers | **Inter** | 600 | 11px uppercase, ls 0.06em | `--h-text-muted` |
| Body text | **Inter** | 400 | 14px | `--h-text-primary` |
| Branch info labels | **Inter** | 600 | 15px | `--h-text-primary` |
| User names (tables) | **Inter** | 600 | 13px | `--h-text-primary` |
| Captions/subtitles | **Inter** | 400 | 12px | `--h-text-secondary` |
| Technical IDs (Tag--code) | **SF Mono** | 400 | 11px | inherit |

### Type Scale Rule

Page H1 outranks card section title. Explicit hierarchy:
- **28px** — `.PageHeader__title` or `.SectionTitle--page` (when the card IS the page)
- **20px** — `.SectionTitle` (inside cards, below a page header)
- **28px** — `.DetailHeaderCard__title` (entity detail headers)
- **Never use 20px for a page-level title.**

### Deprecated / Not Used

- **Source Serif 4** — the dev team's reference serif. Not used in our implementation. When reading the prototype, translate to IvyPresto Display 300.
- **JetBrains Mono** — removed. Inter tabular-nums handles column alignment in most contexts. SF Mono retained only for code chip / dev widget contexts.
- **Slashed zero** (`'zero' 1`) — plain circular zero only.
- **IvyPresto bold / weight 400+** — weight 300 only.

---

## Spacing & Shape Vocabulary

### Spacing Scale — Global Tokens

Every padding, margin, and gap must use a spacing token. No arbitrary pixel values.

| Token | Value | Usage |
|-------|-------|-------|
| `--h-space-2` | 2px | Micro: borders, tiny gaps |
| `--h-space-4` | 4px | Tight: inside pills, label→value gaps |
| `--h-space-8` | 8px | Compact: between inline elements, filter chip gaps |
| `--h-space-12` | 12px | Snug: between related items, pill padding-x |
| `--h-space-16` | 16px | Base: standard element spacing, chart title to content |
| `--h-space-20` | 20px | Comfortable: between company progress rows |
| `--h-space-24` | 24px | **Card padding: ALL cards, ALL sides, no exceptions.** |
| `--h-space-32` | 32px | Reserved |
| `--h-space-40` | 40px | Major section |
| `--h-space-48` | 48px | Page section: large vertical breaks |
| `--h-space-64` | 64px | Page bottom |

### Shape Vocabulary

Shape signals interactivity level. A permanent design system rule.

| Shape | Radius | Meaning | Examples |
|-------|--------|---------|----------|
| Pill | 999px | Static label / badge | Role pills, status pills, entity type pills, active filter tags |
| Rounded rect | 6px | Interactive control | Filter chips, filter toggle, dropdown triggers, inputs |
| Square-ish | 4px | Contained element | Bar chart tops, code blocks |
| Card | 8px | Content container | Cards, panels |
| Modal | 12px | Overlay | Modals, dialogs |
| Circle | 50% | Identity / indicator | Avatars, status dots |

When building any new component, choose its shape based on what it IS:
- Is it a label? → pill (999px)
- Can the user interact with it? → rounded rectangle (6px)
- Is it a person? → circle (50%)
- Is it a container? → card (8px)

---

## Navigation — Global Left Rail

**Decision: The 92px fixed left icon rail is the platform-wide global navigation. This is locked.**

The brand kit's top NavBar (56px, teal-900) is not adopted. The left rail is our pattern — we lead here. The kit ships a complete top-nav spec; ours ships a complete left-rail spec.

### Left Rail Anatomy

```
.NavRail  (position: fixed; left: 0; top: 0; width: 92px; height: 100vh)
├── .NavRail__logo      (H wordmark or logomark, top)
├── .NavRail__items     (flex-column, icon tiles + labels)
│   └── .NavRail__item  (icon + label, each nav destination)
│       └── .NavRail__flyout  (appears on hover, slide-right)
└── .NavRail__profile   (avatar + role indicator, bottom)
```

### Spec

- **Width:** 92px, fixed position, full viewport height
- **Background:** white (#FFFFFF), `1px solid stone (#E0DDD6)` right border
- **Logo:** IvyPresto Display "H" wordmark or logomark at top, `teal-900`
- **Nav tiles:** each destination is a 60×60px tile, centered inside the rail
  - Icon: Tabler Icons, 20px, stroke 1.5, `--h-text-muted` inactive / `--h-text-heading` active
  - Label: Inter 10px, 500, uppercase, letter-spacing 0.08em, `--h-text-muted` inactive, below the icon
  - Active tile: `teal-50` (#E0EDF3) background, `teal-900` icon + text, `3px solid teal-900` left border accent
  - Hover tile: `sand` (#F2F0EA) background
  - Tile border-radius: 6px (rounded rect — it's interactive)
- **Profile stack (bottom):** avatar (32px circle, teal-50 bg, teal-500 text) + user indicator
- **Flyouts:** on hover, a labeled flyout panel slides in from the right side of the rail, showing sub-destinations for that section. Never nested flyouts.

### Sidenav for Detail Pages (Additive)

The brand kit's 220px white card sidenav (for loan detail, entity detail pages) is **additive** — it does not replace the left rail. When a detail page has sub-routes (e.g., loan detail tabs), the 220px sub-nav can appear as a secondary layer to the right of the rail.

- **Left rail** = global nav, always present, 92px
- **220px sub-nav** = detail-page sub-routes only, appears when the page has deep sub-routing
- These two panels coexist. The sub-nav is not global; it mounts and unmounts with the detail page.

**Do NOT** create a secondary sidebar on Setup pages. The left rail handles section navigation. Setup sub-pages (Companies / Branches / Users) are navigated via rail flyouts — no duplicate in-page side panel.

### What NOT to Do (Navigation)

- ❌ Never use a horizontal top NavBar as the primary global nav
- ❌ Never show the rail only on some pages — it is global, always visible
- ❌ Never use a left-side role selector — user/role switching lives in the rail's profile section (bottom)
- ❌ Never duplicate nav with a second in-page sidebar on Setup pages
- ❌ Never use Unicode chevrons (▾) — use Tabler SVG icons

---

## Navigation Patterns

### BackToMain — Platform-Wide Canonical Pattern

**BackToMain is the canonical exit pattern for every page that has a parent.** Every detail or form page renders `← Back to [parent]` at the top.

**Breadcrumbs are not used.** The left rail + sub-nav already render the section hierarchy visually; breadcrumbs would duplicate it. Homium's hierarchy is shallow (max 3–4 levels including tabs), and persistent chrome makes breadcrumbs redundant.

### Position by Page Type

| Page type | BackToMain position | Notes |
|---|---|---|
| **Detail pages** (Company / Branch / User detail, AM Originations) | Non-sticky, above primary content card | Default `.BackToMain` |
| **List pages, dashboards** | None — left rail already roots the user | n/a |
| **Form pages (Setup create/edit)** | **Sticky**, anchored below the top of the viewport | Add modifier `BackToMain--sticky` |

### Sticky Form-Page Chrome

```html
<button class="BackToMain BackToMain--sticky"
        onclick="tryExitSetupForm('<formRootId>', () => <parentGoto>)">
  <svg>…</svg>
  Back to <Parent>
</button>
```

- Sticky position with `z-index: 50`
- Background = `--h-bg` so content scrolls cleanly behind it
- Subtle 1px `--h-border-subtle` bottom border appears when content scrolls past the link (toggled via `.BackToMain--scrolled`)
- Click handler runs through `tryExitSetupForm(rootId, proceed)` to catch unsaved changes

### Top-Nav Vertical Anchor

`--h-top-nav-height: 56px` was the top NavBar height in the brand kit. Since we use a left rail, this token is repurposed to represent the **effective top offset** for sticky elements (e.g., BackToMain sticky position). If you need to anchor something to the top of the viewport content area, use this token as the `top` offset value. Update the token value if the layout changes.

---

## Charts & Data Visualization

### Color Palettes

**Single-variable charts** (funnel, stage duration, FICO range, LTV range, income):
- Use `teal-900` (#00334A) for all bars
- For progression: opacity stepping 40% → 55% → 70% → 85% → 100% via CSS classes, NOT different colors

**Multi-series comparison** (2+ distinct data series):
- Teal palette in order: `#00334A`, `#1A6E8E`, `#A3C5D4`
- Max 3–4 series; more → use tabbed/filtered view
- NEVER use green in chart fills (conflicts with action accent)
- NEVER use semantic colors (red, amber) in routine charts

**Sequential** (choropleth maps, heatmaps):
`#E0EDF3` → `#B0D4E3` → `#6AADC6` → `#3088A8` → `#0A4D6B` → `#00334A`

**Diverging** (gain/loss — the ONLY place red/green appear in charts):
`#C4382A` → `#E07B6F` → `#F2C4BE` → `#F2F1EC` → `#A8D7BE` → `#4AAD7F` → `#1A8754`
Always pair with an icon (↑/↓) or label — never rely on color alone.

### Opacity Stepping

| Class | Opacity | Usage |
|-------|---------|-------|
| `--step-1` | 40% | Earliest/lowest stage |
| `--step-2` | 55% | |
| `--step-3` | 70% | |
| `--step-4` | 85% | |
| `--step-5` | 100% | Final/highest stage |

Always use CSS classes, not inline opacity. This keeps opacity formalized and overridable by hover states.

### Hover Behavior — Dim Siblings Pattern

1. Parent container gets `.is-hovering` class
2. Hovered bar gets `.is-hovered` class
3. All bars dim to `opacity: 0.40`
4. Hovered bar highlights at `opacity: 0.85`
5. On `mouseleave`, both classes removed

```css
.Container.is-hovering .Bar { opacity: 0.40; transition: opacity 0.15s ease; }
.Container.is-hovering .Bar.is-hovered { opacity: 0.85; }
```

**Never use `filter: brightness()` for hover** — it alters the color.

### Chart Tooltip Pattern

- **Background:** white (#FFFFFF)
- **Border:** `1px solid stone` (#E0DDD6) all sides + `3px solid green-500` (#14935F) top only — direction-independent
- **Border-radius:** 6px all corners
- **Shadow:** `0 4px 12px rgba(0,51,74,0.1)`
- **Padding:** 10px 14px

```html
<div class="ChartTooltip">
  <div class="ChartTooltip__label">KYC → Active</div>
  <div class="ChartTooltip__value">2.1 days</div>
</div>
```

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Label | Inter | 11px | 500 | `text-secondary` (#6B7A85) |
| Value | IvyPresto Display | 18px | 300 | `text-heading` (#00334A) |

### Chart Legend Component

| Class | Purpose |
|-------|---------|
| `.ChartLegend` | Container — flex-wrap, gap 8px 16px, border-top, margin-top: auto |
| `.ChartLegend__item` | Each entry — inline-flex, align-center, gap 6px |
| `.ChartLegend__dot` | 8×8px, `border-radius: 2px` (rounded square — NOT circle) |
| `.ChartLegend__label` | Inter 11px, `--h-text-muted`, white-space: nowrap |

Legend dots are **rounded squares** (2px radius) — circles are reserved for status indicators.

### Chart Typography
| Element | Font | Size | Color |
|---------|------|------|-------|
| Bar value labels | IvyPresto Display | 13px | #2D3E4A |
| Count numbers in funnel | IvyPresto Display | 16px | #2D3E4A |
| Percentage labels | Inter | 11px | #6B7A85 |
| Axis labels | Inter | 11px | #9BA6AE |
| Chart card title | Inter 600 | 11px uppercase | #6B7A85 |
| Legend labels | Inter | 11px | #9BA6AE |

---

## Component Rules

### Avatars

- **Background:** `teal-50` (#E0EDF3)
- **Text:** `teal-500` (#1A6E8E), initials, 11px uppercase, weight 600
- **Size:** 32px circle (28px with `--sm`)
- **One style for all avatars** — no per-user color assignment at this time
- Shape: circle (50%) — identity marker per Shape Vocabulary
- Note: future avatar color differentiation by user type is in the backlog (see [Deferred Items](#deferred-items--backlog))

### Badges — Three Visual Lanes

**All badges use `border-radius: 999px` (full pill).** Pill shape universally signals "I'm a label, not a button."

The "visual lanes" principle — each badge type occupies a different lane:
1. **Avatars** → teal-50 circles (structural, identity)
2. **Role pills** → ghost outlined (quiet identifier)
3. **Entity pills** → ghost outlined (same as role pills; label text differentiates)
4. **Status pills** → semantic color fills with dot (the ONLY loud element)

Scan order: name → status (colored) → role (if needed). Avatars are skipped.

### Status Pills (semantic colors, dot + tinted background)

| Status | Dot | Background | Text |
|--------|-----|-----------|------|
| Active | #1A8754 | #E4F3EB | #1A8754 |
| 2FA Complete | #1A8754 | #E4F3EB | #1A8754 |
| Email Verified | #1A8754 | #E4F3EB | #1A8754 |
| KYC Pending | #B8860B | #FEF3E2 | #B8860B |
| Invited | #9BA6AE | #F8F7F4 | #6B7A85 |
| Suspended | #C4382A | #FDE8E6 | #C4382A |
| Pending | #B8860B | #FEF3E2 | #B8860B |

Dot is 6px circle, same color as text. Layout: `[dot] [label]`, gap 5px, inline-flex, align-center.

### Role Pills (ghost outlined — ALL identical)

One style for ALL roles. No tiers, no hierarchy, no elevated variants. The label text differentiates.

`background: transparent` · `color: #6B7A85` · `border: 1px solid #E0DDD6` · `padding: 2px 8px` · `font-size: 11px` · `font-weight: 500`

Applies to: Loan Officer, Loan Processor, Program Admin, System Admin — ALL visually identical.

**Role pill convention is deferred.** The current platform does not require an enforced role pill vocabulary. Future direction: introduce free-entry tagging behavior — users type a role; a tag is created from the input value. No predefined role vocabulary until that feature is scoped. (See [Deferred Items](#deferred-items--backlog).)

### Entity Type Pills (ghost outlined — ALL identical, same as role pills)

`background: transparent` · `color: #6B7A85` · `border: 1px solid #E0DDD6` · `padding: 2px 8px` · `font-size: 11px`

### Cards

- **Background:** white (#FFFFFF)
- **Page background:** `--h-bg` (#F9F8F4)
- **Border:** `1px solid stone` (#E0DDD6)
- **Hover (clickable):** border shifts to `1px solid green-500` (#14935F)
- **Alert variant:** white bg, `3px left-border` in `error` (#C4382A), NO full background fill
- **Radius:** 8px
- **Padding:** `var(--h-space-24)` (24px) all sides — no exceptions
- **Shadow: none** (flat elevation model — shadows only on overlays)
- **Overflow:** `overflow: hidden` — all cards, no exceptions

### Tables

- **Zebra striping:** white / `#FAFAF8` alternate rows
- **Row padding:** 12px vertical, 20px first/last column, 16px between columns
- **Column headers:** uppercase, 11px, letter-spacing 0.06em, `gray-300` (#9BA6AE), weight 600
- **Row dividers:** `1px solid warm-gray` (#EDEBE6)
- **Hover:** background → `sand` (#F2F0EA) AND 3px left-border in `--h-action` (#00334A)
- **Container:** `overflow-x: auto`, never overflows parent card
- **Layout:** `table-layout: fixed` with defined column proportions

### TableToolbar — Progressive Disclosure

Reusable toolbar for any table card. Filters hidden by default, revealed on demand.

**Row 1 — Title:** `.SectionTitle` (IvyPresto Display 300, 20px, teal-900)
**Row 2 — Search + Filter toggle:** Search left (flex: 1, max-width 360px, 36px height) + Filter toggle right
**Row 3 — Filter chips (collapsible):** `max-height: 0, opacity: 0` by default; `.TableToolbar__filters--open` reveals with transition
**Row 4 — Active filter tags (conditional):** only visible when filters applied

### Buttons

| Variant | Style | Class |
|---------|-------|-------|
| Primary | `bg-green-500` (#14935F), white text | `Btn Btn--primary` |
| Secondary | `bg-teal-900`, white text | `Btn Btn--secondary` |
| Tertiary | transparent, `border: 1.5px solid stone`, teal-900 text | `Btn Btn--tertiary` |
| Ghost | transparent, green-500 text | `Btn Btn--ghost` |
| Destructive | `bg-error` (#C4382A), white text | `Btn Btn--destructive` |
| Outlined | transparent, 1.5px stone border, text-primary | `Btn Btn--outlined` |

### Buttons & Action Hierarchy

**Style by nesting depth:**

| Context | Style | Class |
|---|---|---|
| **Page-level table** main action | Primary, full size | `Btn Btn--primary` |
| **Tab-section table** main action | Primary, small | `Btn Btn--primary Btn--sm` |
| **Sub-section** (1 level deep) | Outlined, small | `Btn Btn--outlined Btn--sm` |
| **Inside accordion / expanded row** (2+ levels deep) | Outlined, small | `Btn Btn--outlined Btn--sm` |
| **Page/tab-level commit** (Save changes) | Primary, full size, bottom-right | `Btn Btn--primary` |
| **Row-level destructive** (delete, remove) | Icon-only, destructive hover | `Btn--icon Btn--icon--destructive` |
| **Form Save** (sticky save bar) | Primary | `Btn--primary` |

**One primary per section.** If a section has multiple actions, only the most important is primary; others are outlined or ghost.

**Position rules:**
- Top-right of the section's header, never bottom-left or after the table
- Form save bars: Save right-aligned
- Tab-level commits: single button right-aligned at bottom of tab content

### Detail Header Card (`.DetailHeaderCard`)

Unified header for entity-detail pages (Company / Branch / User detail).

```
DetailHeaderCard (white, 8px radius, 24px padding)
├── DetailHeaderCard__top
│   ├── DetailHeaderCard__title-block (title + subtitle)
│   └── DetailHeaderCard__actions (Edit button)
└── DetailHeaderCard__meta (NMLS │ Phone │ Branches │ Users │ ●Active)
```

- **Title:** IvyPresto Display 300, 28px, `--h-text-heading`
- **Subtitle:** Inter 14px secondary text
- **Actions:** Edit button as `Btn--outlined Btn--sm`
- **Meta strip:** `.DetailHeaderCard__meta-item` with vertical dividers; status pill at far right via `margin-left: auto`

`.BackToMain` sits ABOVE the DetailHeaderCard, not inside it.

---

## Forms

### Field Max-Width

| Variant | Max width | Use case |
|---|---|---|
| Default | **400px** | Every input |
| `--wide` modifier | 720px | CC email lists, long URLs |
| `--full` modifier | none | Textareas, multi-select chip groups |
| Container `.FormGrid` | **832px** | Two paired 400px columns + 24px gap |

### Save / Cancel Patterns — Four Distinct Models

The platform uses four distinct save/cancel patterns depending on the context. Do not conflate them. Each has a precise definition.

---

#### Pattern A — Wizard / Origination Flow

Bottom sticky bar with full navigation controls. Used in multi-step wizard flows (loan application, origination steps).

```
[← See All Applications]   [Saved just now 🕐]   [Save & Exit]  [Previous]  [Continue →]
```

- **Left:** back-link to the list view (`← See All Applications`) — clean exit, no modal needed because AutoSave is active
- **Center:** AutoSave indicator — `Saved just now` with clock icon
- **Right:** `Save & Exit` (outlined) · `Previous` (ghost) · `Continue →` (primary)
- No explicit "Cancel" — AutoSave removes the need for a cancel/discard choice
- Dirty-form modal does **not** fire in wizard flows — AutoSave is the safety net

---

#### Pattern B — Inline Entity Edit (header card)

Save/discard affordances live **inside the detail header card**, not in a separate bottom bar. Used when a user edits fields directly on an entity detail page (User detail, Branch detail).

**Clean state (no changes made):**
```
[Test Branchmanager                    ]  [Save changes (greyed/disabled)]
[sorin.trofin+branchmanager@xivic.com ]
```
- "Save changes" is visible but disabled (`opacity: 0.5`, `cursor: not-allowed`)
- No "Discard" button — it is hidden until the form is dirty

**Dirty state (user has made changes):**
```
[Test Branchmanager                    ]  [Discard]  [Save changes]
[sorin.trofin+branchmanager@xivic.com ]
```
- "Discard" appears as `Btn--ghost` (ghost, no border, muted text) — only visible when dirty
- "Save changes" activates to `Btn--primary` (navy)
- Clicking **Discard** = explicit intent → reverts changes immediately, no modal
- Clicking **Save changes** = commits → clears dirty state, button returns to disabled
- Dirty-form modal fires on **unintentional** nav-away (left rail click, browser back, tab switch) while dirty

**Implementation:**
```js
// On any input change in the entity form:
markFormDirty('entityFormId');   // shows Discard, enables Save changes

// On Discard click:
revertFormSnapshot('entityFormId');   // restores snapshot, hides Discard, disables Save

// On Save click:
saveEntityForm('entityFormId', () => clearFormSnapshot('entityFormId'));
```

---

#### Pattern C — Tab-Level Commit (e.g. Permissions tab)

A single "Save changes" button, bottom-right, with no Cancel. Used when a full tab's worth of configuration changes accumulate and need a single commit action.

```
                                            [Save changes]
```

- No Cancel button — the tab fields are not a modal or a page; navigating away is the implicit cancel
- **Dirty-form modal fires** if the user clicks a different tab, a left rail item, or browser back while the tab has unsaved changes
- "Save changes" label is generic here (not entity-specific) — the tab heading provides context
- Right-aligned via `justify-content: flex-end`
- `data-sticky-bottom` attribute drives `--sticky-bottom-offset`

---

#### Pattern D — Full-Page Edit Form (e.g. Edit Company, Edit Branch)

Bottom bar with explicit Cancel + Save changes. Used when a dedicated edit page is reached via a navigation action (not inline in a detail card).

```html
<div class="SaveBar" data-sticky-bottom>
  <button class="Btn Btn--outlined" onclick="cancelEditForm('<formRootId>', () => <parentGoto>)">
    Cancel
  </button>
  <button class="Btn Btn--primary" onclick="saveEditForm('<formRootId>', '<entity>', () => <parentGoto>)">
    Save changes
  </button>
</div>
```

- **Cancel** (`Btn--outlined`, left of Save) = explicit user intent → navigates back to parent, **no dirty-form modal** (the button itself is the clear signal)
- **Save changes** (`Btn--primary`, right) = commits and navigates back to parent
- Both buttons sit right-aligned as a pair via `gap: var(--h-space-8)` inside the bar's flex container
- Dirty-form modal fires on **unintentional** nav-away (left rail, browser back, BackToMain) while dirty
- Save label is "Save changes" (generic) — the page title provides entity context
- BackToMain is still present at the top; clicking it while dirty triggers the dirty-form modal

---

### Dirty-Form Modal

Shared across Patterns B, C, and D. Fires on **unintentional** nav-away while the form is dirty. Does **not** fire when the user clicks an explicit action (Discard in Pattern B, Cancel in Pattern D).

| | |
|---|---|
| Title | `Discard changes?` |
| Body | `Your unsaved changes will be lost.` |
| Primary (right, autofocus) | `Keep editing` — `Btn--primary` |
| Destructive (left) | `Discard changes` — `Btn--ghost Btn--destructive` (error color, never gray) |
| Backdrop click | = Keep editing |
| Escape key | = Keep editing |

**Trigger paths by pattern:**

| Trigger | Pattern B (inline) | Pattern C (tab) | Pattern D (full-page) |
|---|---|---|---|
| Left rail click | ✅ modal fires | ✅ modal fires | ✅ modal fires |
| Different tab click | ✅ modal fires | ✅ modal fires | ✅ modal fires |
| BackToMain click | ✅ modal fires | n/a | ✅ modal fires |
| Browser back | ✅ modal fires | ✅ modal fires | ✅ modal fires |
| Page reload | ✅ `beforeunload` (browser-native) | ✅ `beforeunload` | ✅ `beforeunload` |
| Discard button click | ❌ no modal — explicit intent | n/a | n/a |
| Cancel button click | n/a | n/a | ❌ no modal — explicit intent |
| Save button click | ❌ no modal — commits cleanly | ❌ no modal | ❌ no modal |

Save bypasses the modal entirely — always call `clearFormSnapshot()` before any post-save navigation.

**Single hashchange interception point** handles left-rail, tab, and browser-back triggers for Patterns B, C, and D. `handleRouteWithDirtyGuard()` wraps all `location.hash` mutations. Restoration uses `history.replaceState` so dismiss leaves no ghost history entries.

### Modal Primitive (library)

Single shared `<div class="Modal" id="...">` at end of `<body>`. Wire per call:

```js
openModal('discardChangesModal', {
  onConfirm: () => { /* destructive action */ },
  onDismiss: () => { /* optional */ }
});
```

`closeModal(id)` cleans up listeners + restores focus. Tab is trapped while open. Generic — reuse for any destructive-confirm flow.

### Conditional Sections

Sections that unlock based on a related field's value:

```html
<div class="WizardSection" id="setupUserNewLoSection" style="opacity:0.4;pointer-events:none">
  <input disabled>
</div>
```

JS toggles `opacity` + `pointer-events` + each input's `disabled` based on the controlling field's value.

---

## PermissionsMatrix

RBAC matrix table. Columns: User (`.UserCell` — avatar + name + email) │ Access level │ Permission flags │ Trash.

### Access Level Display

**Decision: Binary on/off OR explicit text labels. No dot vocabulary system.**

The PermissionsMatrix communicates access in one of two ways depending on context:

**Option A — Binary (on/off):**
- Selected/active: filled blue (`--h-info`, #1A6E8E) indicator
- Not selected: empty / no fill state
- Use for simple permission toggles where "can access" vs "cannot access" is the only distinction

**Option B — Explicit text labels:**
- Use "View" and "Edit" as text labels in the access level column
- No leading dots, no fill-based vocabulary
- Use when the access level needs more than two states

**The dot vocabulary system (hollow ring / filled gray / filled blue / filled green) from the brand kit is not adopted.** Users will not reference the permissions matrix frequently enough to require a trained visual vocabulary. Explicit text is clearer and requires no legend.

**Rationale:** The four-state dot system requires users to internalize a new icon vocabulary for a UI surface they use occasionally. "View" and "Edit" are self-documenting. A HelpTooltip legend is still available if needed, but should reference text labels, not dots.

### Row State Mapping

| Level | Appearance | Permission flags |
|---|---|---|
| No access | Empty / unselected | `—` em-dash |
| View | "View" text label or filled blue indicator | `—` em-dash (read-only) |
| Edit | "Edit" text label or filled blue indicator | editable checkboxes |
| Full access | "Full" text label | all checked + disabled (forced) |

### Two Scopes

- **Branch level matrix** — what each branch member can do at the branch level
- **Per-LO matrix** — what other members can do on each LO's applications. Wrapped in `.LOAccordion` (collapsible per-LO sections).

---

## Layout

### Detail Page Layout (`.DetailPage`)

Used for loan detail views with optional sub-nav. Flex row: optional `.SideNav` (220px, sticky) + `.DetailPage__content` (flex: 1).

### SideNav (`.SideNav`) — Detail Pages Only

Width: 220px, white card, stone border, 8px radius. Items: 40px height, Inter 13px, `--h-text-secondary`. Active: teal-50 bg, heading color, weight 600. Sticky at top of content area. **Not global** — mounts only on detail sub-routes.

### Surface Hierarchy

```
Page bg          (--h-bg, warm #F9F8F4)
  ↓
Card surface     (--h-surface-1, white #FFFFFF)
  ↓
Nested expanded  (--h-surface-hover, sand #F2F0EA)   ← e.g. LO accordion when open
  ↓
Inner Card       (--h-surface-1, white)
  ↓
Table rows       (white / --h-zebra #FAFAF8)
```

### Content Max-Width

- **Page content:** `max-width: 1500px` (`--h-content-max-width`), `margin: 0 auto`, `padding: 0 32px`
- **Form/wizard inner column:** `max-width: 960px` (`--h-form-max-width`), centered inside outer canvas

---

## Icon Library — Tabler Icons

Standard icon library: `@tabler/icons-react`. 5,700+ line icons, consistent 1.5px stroke.

- **Default size:** 20px standalone, 16px inside components
- **Stroke:** always 1.5
- **Color:** inherits via `currentColor`
- **Never mix icon libraries** — Tabler only
- **Usage:** `<IconChevronDown size={16} stroke={1.5} />`
- In HTML prototypes: inline SVGs matching Tabler path data (viewBox 0 0 24 24, stroke-width 1.5, stroke-linecap round, stroke-linejoin round)

---

## User Roles & Routing

### Three User Roles

| User | Slug | Name | Initials | Role Label | Default Page |
|------|------|------|----------|------------|--------------|
| Administrator | `admin` | Alex Morgan | AM | Administrator | `dashboard` |
| Account Manager | `account-manager` | Jordan Rivera | JR | Account Manager | `originations` |
| Originator | `originator` | Sarah Chen | SC | Originator | `applications` |

### Routing Architecture

Hash-based routing: `#/<user-slug>/<page-slug>`. Nav rail, page content, and dev widget update dynamically based on current route.

### Dev Widget

Compact pill + page index panel (bottom-right). `teal-900` bg, Inter mono 11px. Shows current user role and page name. Collapses to pill when not in use. In production, behind a dev-mode feature flag.

---

## Responsive Design

Desktop-first with three breakpoints:

| Breakpoint | Width | Label |
|------------|-------|-------|
| Desktop | ≥1280px | Full left rail, grid-based components |
| Tablet | 769–1279px | Rail may collapse or narrow |
| Mobile | ≤768px | Rail collapses to icon-only or slide-over |

### Mobile Card-Based Tables (≤768px)

On mobile, data tables convert to card-based layouts:
- Hide `<table>` elements
- Show `.MobileCards` — each row becomes a `.MobileCard`
- Label/value pairs per card row
- Status dots and role pills render inline

### Responsive Spacing

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Page padding | `32px 32px 64px` | `24px 24px 48px` | `16px 16px 80px` |
| Card padding | `24px` | `20px` | `16px` |
| Table cell padding | `12px 20px` | `12px 14px` | N/A (cards) |

---

## Toast (prototype affordance)

Transient bottom-center notification for stub buttons without real backends.

```js
showToast('Demo: Permissions changes would be saved.');
```

- Bottom-center, 2.5s auto-dismiss
- Reuses a single DOM element
- Z-index 10000 (above everything)

For production, replace `showToast(...)` with real action handlers.

---

## Tags

Inline pills for codes, demo markers, short labels.

| Class | Use case |
|---|---|
| `.Tag` | Base — neutral outlined pill |
| `.Tag.Tag--code` | SF Mono, for program codes (UDF, DCDF, NMLS), Loan IDs |
| `.Tag.Tag--demo` | Neutral surface tone, "DEMO" marker for prototype data |
| `.Tag--group` | Flex container for multiple tags in a cell |

Demo tag uses neutral surface tone (NOT warning amber) — secondary metadata, not an alert.

---

## System Configuration (Setup) Architecture

### Nav Structure

Setup section is reached via the left rail. Sub-pages (Companies / Branches / Users) are navigated via a flyout from the Setup rail tile — no duplicate in-page sidebar.

### Sub-Views

`<div class="SetupSubView" data-setup-sub="list|new|detail">`. JS routers: `setupCompaniesGoto(view, payload)`, `setupBranchesGoto(...)`, `setupUsersGoto(...)`.

---

## MarketEnablementGrid

50-state US grid (51 with DC) with three visual states:
- **Selected** — action-color tint
- **Available** — outlined, hoverable
- **Unavailable** — muted/disabled, "Not enabled at parent" tooltip

Read-only mode: `.MarketGrid--readonly` strips cursor + hover affordances.

---

## What NOT to Do

- ❌ Never use a horizontal top NavBar as the primary global navigation
- ❌ Never use gold/amber (#E5A744) — removed from palette
- ❌ Never use `--color-purple` (#7C3AED) — removed entirely
- ❌ Never use green (#14935F) in charts, avatars, pills, or decorative elements — CTA/action only
- ❌ Never use cool grays (#F5F5F5, #E5E7EB) — always warm neutrals
- ❌ Never use drop shadows on cards — flat + borders only
- ❌ Never bold IvyPresto Display — always weight 300
- ❌ Never use Source Serif 4 — IvyPresto Display only for headings
- ❌ Never confuse CTA green (#14935F) with success green (#1A8754)
- ❌ Never use semantic colors (red, amber, green) in routine chart fills
- ❌ Never use full-background fills for alert KPI cards — colored text only
- ❌ Never use square/slightly-rounded rectangles for badges — all badges are full pill (999px)
- ❌ Never use filled backgrounds for role or entity pills — ghost outlined only
- ❌ Never use pill shape (999px) for interactive controls — filter chips use rounded rect (6px)
- ❌ Never omit `overflow: hidden` on cards
- ❌ Never use fixed dimensions on charts — always responsive
- ❌ Never mix icon libraries — Tabler only, 1.5px stroke
- ❌ Never use `filter: brightness()` for chart hover — use dim-siblings opacity pattern
- ❌ Never use the four-state dot vocabulary on PermissionsMatrix — use explicit text labels
- ❌ Never add a Cancel button to Pattern C (tab-level commit) save bars — no explicit cancel needed; nav-away triggers dirty-form modal
- ❌ Never omit a Cancel button from Pattern D (full-page edit form) save bars — Cancel is required there
- ❌ Never show the Discard button in Pattern B (inline header edit) when the form is clean — hidden until dirty
- ❌ Never fire the dirty-form modal when the user clicks an explicit Discard or Cancel — those are intentional exits, no confirmation needed
- ❌ Never use midnight (#061D29) as default text — use slate (#2D3E4A)
- ❌ Never use circles for chart legend dots — rounded squares (2px radius) only
- ❌ Never use `filter: brightness()` for chart hover states

---

## Deferred Items & Backlog

These items are intentionally not implemented. Document them here so they are not accidentally introduced. Each needs explicit alignment before becoming active.

### Backlog Tickets

**1. User Type Avatar Colors**
- Specification: Platform operators → gold background; Investors → green background; Loan origination users → blue background
- Current state: All avatars use `teal-50` / `teal-500`
- When to implement: When role-based avatar differentiation is scoped as a feature
- Implementation note: Add role-based class or data attribute to `.avatar`; map to token-backed background colors

**2. Form-Page Navigation — Origination Flow**
- Specification: The sticky BackToMain + save-only bar works well for the application flow. For origination state, evaluate whether the same pattern applies or a different exit/save model is appropriate.
- Current state: Not determined
- When to implement: When origination form UX is designed

**3. Role Pill Free-Entry Tagging**
- Specification: Future — introduce free-entry tagging behavior for role assignment. User types a role; a tag is created from the input value. No predefined vocabulary.
- Current state: Role pills are ghost outlined, label-only. No enforced vocabulary.
- When to implement: When the role assignment feature is scoped

### Deferred (Phase 3 or later)

**Dark mode** — full spec is documented in [Brand Color System → Dark Mode](#brand-color-system). Do not implement until Phase 3. Capture spec only; no implementation yet.

**`--color-success-strong`** (`#117A47`) — add only when a positive-action hover state is built. Not present in current token set.

**Data viz palette, Chart tooltip, Dim-siblings hover** — adopt when the first chart is built. Patterns are fully documented above. Implementation deferred until chart work begins.

---

## Document History

- **2026-05-05** — Setup section consistency pass: Tables canonical pattern, DetailHeaderCard, Forms max-widths, Surface hierarchy, System Configuration architecture, PermissionsMatrix, MarketEnablementGrid, Subset-of-parent constraint, Toast, Tags, BackToMain placement, Buttons & Action Hierarchy.
- **2026-05-06** — Form-page navigation lock-in. BackToMain sticky pattern. Save bar Save-only (no Cancel). Dirty-form modal (four exit paths). Modal primitive library. PermissionsMatrix dot vocabulary (kit pattern — superseded below). Role pill sentence case + full names. Type-scale rule explicit.
- **2026-05-26** — **Canon override pass.** Applied product decisions from design review session:
  - Navigation: **left icon rail locked** (92px fixed, global). Top NavBar not adopted. Detail-page 220px sub-nav is additive.
  - Heading font: **IvyPresto Display 300** replaces Source Serif 4 across all heading contexts and display numerals. SF Mono retained for code/ID contexts. Source Serif 4 deprecated.
  - PermissionsMatrix: **dot vocabulary not adopted.** Replaced with binary on/off (filled blue selected) or explicit "View" / "Edit" text labels.
  - Token: `--color-purple` (#7C3AED) **removed**.
  - Semantic tokens aligned to brand kit: `success` → `#1A8754`, `warning` → `#B8860B`, `info` → `#1A6E8E` (all already matching; confirmed canonical).
  - Role pill convention: **moot for now.** Future = free-entry tag field. Added to backlog.
  - Cancel button: **table — pending Soren alignment.** Added to backlog with blocking note.
  - Deferred items section added.
  - Branch info label: Inter 600 15px.
- **2026-05-27** — **Save/cancel pattern update.** Resolved the tabled Cancel button item. Four distinct save/cancel patterns codified based on live product screenshots:
  - Pattern A: Wizard/origination — AutoSave + Previous/Continue/Save & Exit/back-link. No modal.
  - Pattern B: Inline entity edit — Discard (hidden until dirty) + Save changes in header card. Dirty-form modal on unintentional nav-away only.
  - Pattern C: Tab-level commit — Save only, no Cancel. Dirty-form modal on tab/rail/browser-back nav-away.
  - Pattern D: Full-page edit form — Cancel + Save changes in bottom bar. Cancel is explicit intent, no modal. Dirty-form modal on unintentional nav-away.
  - Trigger matrix added to dirty-form modal spec. Backlog ticket #3 (Cancel/Soren alignment) closed — resolved.

---

## Files in This Canon Package

- `CLAUDE.md` — This file. The design system and source of truth.
- `homium-design-tokens.json` — Updated W3C design tokens for Tokens Studio / Figma import (purple removed, semantic tokens confirmed).
- `FIGMA_REFERENCE.md` — Figma node map with IDs for key frames and redesign priority order.
- `README.md` — How to integrate this canon into your project and what changed.
- `DECISIONS-LOG.md` — Full record of decisions made in the 2026-05-26 canon review session.

## Figma File

Working file: https://www.figma.com/design/h61NDrf5JpMsJNW7R5AAw5/-Internal--Homium-2.0
Uses Material Design 3 examples as UX reference, with Homium brand applied on top.
