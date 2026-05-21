# CLAUDE.md — Homium 2.0 Platform Redesign

_Last updated: 2026-05-05_

## Golden Rules (read these first, follow always)

1. **Always follow the design system.** Every color, spacing value, font, and component pattern must come from this file. No arbitrary values. No exceptions.

2. **Build the component library.** Every reusable piece becomes a component in the library. This library is the reference for building all future pages.

3. **Compose from existing components first.** When building a new page, check the component library and assemble from what exists. Do not rebuild what already exists.

4. **Ask before adding new components.** If a screen needs a component that doesn't exist in the library, stop and ask before creating it. Describe what it is, why it's needed, and how it fits the system.

5. **Index pages separately.** Each page/screen is its own file. Include a small dev widget (bottom-right corner, collapsible) that shows: current user role, current page name, and viewport width. Dev mode only.

6. **Files are the source of truth.** Always read the current state of CLAUDE.md, the component library, and the page files before making changes. Never work from memory of previous conversations.

7. **Update this file when rules change.** If a new pattern or rule is established during a task, add it here before finishing.

---

## Project Overview

Homium is a fintech platform for shared appreciation mortgage loans. We are redesigning the entire platform (currently live at homium.io) to create a best-in-class institutional fintech experience. The platform serves **institutional investors, mortgage lenders/originators, and internal operations teams** — not consumers.

## Design Philosophy

**Material Design 3 inspired, Homium branded.** We use M3 as a UX reference (interaction patterns, accessibility standards, state management, component behavior) but apply a fully custom visual layer. Material's bones, Homium's skin.

Key departures from stock M3:
- **Flat + borders** instead of shadow-based elevation. Cards use `1px solid #E0DDD6` borders and surface color shifts, not drop shadows. Shadows only for overlays (modals, dropdowns, tooltips).
- **Compact density** as default. 36px table rows, 32px input heights, 28px chips. Professional users need data density, not consumer-app whitespace.
- **Warm neutrals** instead of cool grays. Airy warm page bg (#F9F8F4, `--h-bg`), pearl for readonly fills (#F8F7F4), sand for hover tints (#F2F0EA), stone (#E0DDD6) borders — not #F5F5F5/#E5E7EB.
- **Custom component library** (React + Tailwind or CSS modules), not MUI. Use Radix UI or Headless UI for accessible primitives.

---

## Color Philosophy (v2) — "Color is Signal, Not Decoration"

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
- On hover, a chart element shifts to `--h-data-hover` (which equals the action color) — the only intentional overlap, to signal interactivity

### Forbidden combinations
- Green button (would conflict with success status)
- Navy chart bar in light mode (would conflict with action)
- Gold chart bar in dark mode (would conflict with action)
- Action color used as a static badge/label (would falsely signal "click me")

### Number typography rule
All numerical content uses Inter with `font-feature-settings: 'tnum' 1, 'lnum' 1`. Georgia is reserved for prose headings only — NEVER appears in numbers, KPIs, chart labels, or tabular financial data. JetBrains Mono is used only for technical identifiers (Loan IDs, MIN numbers, hashes).

This prevents "rainbow salad" — the #1 UX anti-pattern in financial dashboards where charts, badges, avatars, pills, and buttons all compete for attention.

---

## Brand Color System

### Core Palette
| Token | Hex | Role |
|-------|-----|------|
| `teal-900` | `#00334A` | Logo, headings, nav — brand anchor. M3 Secondary. |
| `teal-700` | `#0A4D6B` | Hover states |
| `teal-500` | `#1A6E8E` | Active/Focus. M3 Tertiary. |
| `teal-200` | `#A3C5D4` | Subtle fills |
| `teal-50` | `#E0EDF3` | Tinted backgrounds, info bg, avatar bg |
| `green-900` | `#0D6B40` | Pressed state |
| `green-700` | `#117A4A` | Hover state |
| `green-500` | `#14935F` | **Primary CTA / Action Accent.** M3 Primary. All primary buttons. |
| `green-200` | `#A8D7BE` | Subtle fills |
| `green-50` | `#E4F3EB` | Success/positive pill backgrounds |

### Green (#14935F) — The Action Accent

Green is the primary accent color. Its ONLY job is to signal interactivity and call-to-action. This creates a learnable pattern: "green = I can do something here."

**Where green appears:**
- Primary CTA buttons (filled)
- Text links and interactive text
- Table row hover: subtle 3px green left-border appears, signaling actionability
- Card hover (when clickable): 1px green border replaces stone border
- Chart tooltips: 3px `green-500` top accent border — direction-independent, ties tooltip to action color without making it feel clickable
- Focus rings: keyboard focus uses green outline
- Active nav section indicator (if applicable)

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
| `--h-text-heading` | `#00334A` (teal-900) | Page titles, section titles — keeps teal-900 |

**Key change:** Primary text uses slate (#2D3E4A), NOT midnight (#061D29). Midnight is too harsh against warm backgrounds. Headings keep teal-900.

### Warm Neutrals
| Token | Hex | Role |
|-------|-----|------|
| `midnight` | `#061D29` | Reserved for headings only (prefer `--h-text-heading`) |
| `slate` | `#2D3E4A` | **Default text color** (`--h-text-primary`) |
| `gray-500` | `#6B7A85` | Muted text, captions (`--h-text-secondary`) |
| `gray-300` | `#9BA6AE` | Placeholders, column headers (`--h-text-muted`) |
| `gray-200` | `#C4C9CC` | Disabled text (`--h-text-disabled`) |
| `stone` | `#E0DDD6` | Borders, dividers, card outlines |
| `warm-gray` | `#EDEBE6` | Subtle borders, row dividers |
| `bg` | `#F9F8F4` | **Page background** — warm, airy, distinctly lighter than sand so readonly field fills (pearl) read as sunken against it |
| `sand` | `#F2F0EA` | Hover-state warm tint (one step darker than bg); no longer the page background |
| `pearl` | `#F8F7F4` | Alt surface, zebra stripe rows, **readonly/disabled input fills** |
| `white` | `#FFFFFF` | Card surfaces |

### Semantic Colors (CRITICAL — do not confuse CTA green with success green)
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#1A8754` | Gains, confirmations, loan funded, appreciation. Status dots for Active/Complete. |
| `success-bg` | `#E4F3EB` | Success banners, positive pill fills |
| `warning` | `#B8860B` | Pending review, approaching limits. Status dots for KYC Pending. |
| `warning-bg` | `#FEF3E2` | Warning banners, alert pill fills |
| `error` | `#C4382A` | Failed, rejected, overdue, depreciation. Alert KPI cards (text only). |
| `error-bg` | `#FDE8E6` | Error banners, destructive pill fills |
| `info` | `#1A6E8E` | Neutral info, tooltips, onboarding |
| `info-bg` | `#E0EDF3` | Info banners, help pill fills |

### Dark Mode
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

## Charts & Data Visualization — Teal Monochromatic

### Color Palettes

#### Single-variable charts (funnel, stage duration, FICO range, LTV range, income):
- Use `teal-900` (#00334A) for all bars
- If visual variety is needed, use opacity stepping: 100%, 85%, 70%, 55%, 40% — NOT different colors
- The height/length IS the data story; color differentiation is redundant

#### Multi-series comparison charts (only when comparing 2+ distinct data series):
- Use teal palette in order: `#00334A`, `#1A6E8E`, `#A3C5D4`
- Maximum 3-4 series per chart; more series → use tabbed/filtered view
- NEVER use green in chart fills — conflicts with action accent
- NEVER use semantic colors (red, amber) in routine charts

#### Sequential (choropleth maps, heatmaps):
`#E0EDF3` → `#B0D4E3` → `#6AADC6` → `#3088A8` → `#0A4D6B` → `#00334A`

#### Diverging (gain/loss — the ONLY place red/green appear in charts):
`#C4382A` → `#E07B6F` → `#F2C4BE` → `#F2F1EC` → `#A8D7BE` → `#4AAD7F` → `#1A8754`
Always pair with an icon (↑/↓) or label — never rely on color alone (colorblind accessibility).

#### Dark mode viz:
`#4EC9A0`, `#6AADC6`, `#A78BCA`, `#E5A744`, `#E07B6F`, `#5BC4D6`

### Opacity Stepping

For single-variable charts that need to show progression (e.g., funnel stages), use teal-900 with CSS class-based opacity:

| Class | Opacity | Usage |
|-------|---------|-------|
| `--step-1` | 40% | Earliest/lowest stage |
| `--step-2` | 55% | |
| `--step-3` | 70% | |
| `--step-4` | 85% | |
| `--step-5` | 100% | Final/highest stage |

Always use CSS classes (e.g., `.FunnelChart__bar--step-1`), not inline opacity styles. This keeps opacity formalized and overridable by hover states.

### Hover Behavior — "Dim Siblings" Pattern

When a user hovers a bar in any chart:
1. The parent container gets `.is-hovering` class
2. The hovered bar gets `.is-hovered` class
3. **All bars** in the container dim to `opacity: 0.40`
4. **The hovered bar** highlights at `opacity: 0.85`
5. The tooltip appears (see tooltip pattern below)
6. On `mouseleave`, both classes are removed and bars return to their base opacity

CSS pattern:
```css
.Container.is-hovering .Bar { opacity: 0.40; transition: opacity 0.15s ease; }
.Container.is-hovering .Bar.is-hovered { opacity: 0.85; }
```

JS pattern: use `initChartHover(containerSelector, barSelector)` — attaches `mouseenter`/`mouseleave` listeners to each bar, toggling `.is-hovering` on the container and `.is-hovered` on the bar.

**Never use `filter: brightness()` for hover** — it alters the color and doesn't communicate data relationships.

### Chart Tooltip Pattern — White + Green Top Accent

Tooltips are informational, not interactive. Green appears as a 3px **top** accent only — never as a full background fill, never on the left/right edge. The accent is always on top so the tooltip looks identical regardless of flip direction.

**Visual spec:**
- **Background:** white (#FFFFFF) — highest readability for financial data
- **Border:** `1px solid stone` (#E0DDD6) on all sides, **3px solid `green-500`** (#14935F) on top
- **Border-radius:** `var(--h-radius-md)` (6px) — all four corners equal. Symmetrical and balanced.
- **Shadow:** `0 4px 12px rgba(0, 51, 74, 0.1)` — subtle float
- **Padding:** `10px 14px`
- **Min-width:** 120px, **Max-width:** 180px
- **Pointer-events:** none (tooltip never blocks interaction)

**Two-line content structure:**
```html
<div class="ChartTooltip">
  <div class="ChartTooltip__label">KYC → Active</div>
  <div class="ChartTooltip__value">2.1 days</div>
</div>
```

| Element | Class | Font | Size | Weight | Color |
|---------|-------|------|------|--------|-------|
| Label (stage name) | `ChartTooltip__label` | Inter | 11px | 500 | `text-secondary` (#6B7A85) |
| Value (metric) | `ChartTooltip__value` | Georgia | 18px | 400 | `text-heading` (#00334A) |

**Data attributes:** Bars use `data-tooltip-label` and `data-tooltip-value` (NOT a single `data-tooltip`). JS builds the two-line HTML from these attributes.

**Positioning — always stays inside the card:**
- Tooltips are positioned via JavaScript, NOT CSS `::after` pseudo-elements
- A `.ChartTooltip` div lives inside each `Card--chart` as a direct child
- The card has `position: relative` as the positioning context
- **Left/right flip:** If the hovered bar is in the left half of the chart → tooltip to the RIGHT (+8px). If right half → tooltip to the LEFT (-8px).
- **Vertical:** Above the bar top, clamped to at least 8px from the card top
- **Horizontal clamp:** `Math.max(8, Math.min(left, cardWidth - tooltipWidth - 8))`
- **Never let the tooltip clip outside `overflow: hidden`** — if it does, the user sees nothing

Implementation: `initChartHover(containerSelector, barSelector)` handles both hover dimming AND tooltip positioning. It reads `data-tooltip-label` and `data-tooltip-value` from the bar element.

### Chart Legend Component (`.ChartLegend`)

Compact legend strip anchored to the bottom of chart cards.

| Class | Purpose |
|-------|---------|
| `.ChartLegend` | Container — `display: flex; flex-wrap: wrap; gap: 8px 16px; padding-top: 12px; border-top: 1px solid warm-gray; margin-top: auto;` |
| `.ChartLegend__item` | Each entry — `display: inline-flex; align-items: center; gap: 6px;` |
| `.ChartLegend__dot` | Color swatch — `8×8px, border-radius: 2px` (rounded square, NOT circle). Default fill: `teal-900`. Use opacity on the dot to match bar opacity stepping. |
| `.ChartLegend__dot--outline` | Outline-only variant — `background: transparent; border: 1.5px solid stone`. For "remaining" or "empty" states. |
| `.ChartLegend__label` | Text — Inter 11px, `--h-text-muted` (#9BA6AE), `white-space: nowrap` |

**Key rules:**
- Legend dots are **rounded squares** (2px radius) — circles are reserved for status indicators
- Legend sits inside the `Card--chart` flex layout, below `Card__content`
- `margin-top: auto` pushes it to the card bottom regardless of chart height
- At tablet: gap reduces to `4px 12px`, label font shrinks to 10px
- **Use legends on detail/analytics pages** where charts are larger and more complex. **Omit legends on dashboard overview pages** to reduce clutter — the chart title and inline labels are sufficient context

### Chart Typography
| Element | Font | Size | Color |
|---------|------|------|-------|
| Bar value labels ("0.8d", "3.4d") | Georgia Regular | 13px | #2D3E4A (slate) |
| Count numbers in funnel ("2", "8") | Georgia Regular | 16px | #2D3E4A (slate) |
| Percentage labels ("13%", "50%") | Inter | 11px | #6B7A85 (gray-500) |
| Axis labels ("0d"–"4d") | Inter | 11px | #9BA6AE (gray-300) |
| X-axis labels ("Inv → Email") | Inter | 11px | #9BA6AE (gray-300) |
| Chart card title ("FUNNEL") | Inter 600 | 11px, uppercase, ls 0.06em | #6B7A85 (gray-500) |
| Progress fractions ("4/7") | Inter 500 | 13px | #6B7A85 (gray-500) |
| Legend labels | Inter | 11px | #9BA6AE (gray-300) |

### Chart Anatomy (Card--chart)

Every chart card follows this flex structure:
```
Card Card--chart (position: relative — tooltip context)
├── Card__title        (flex-shrink: 0)
├── Card__content      (flex: 1; min-height: 0 — chart fills available space)
├── ChartLegend        (optional — for detail pages, margin-top: auto)
└── ChartTooltip       (position: absolute — JS-positioned white + green-accent tooltip)
```

- Card uses `display: flex; flex-direction: column; position: relative`
- `align-items: stretch` on the grid row forces all chart cards to equal height
- Bars anchor to bottom via `justify-content: flex-end` inside chart content
- Gridlines (if present) use `position: absolute; inset: 0` overlaid behind bars
- X-axis labels use `position: absolute; bottom: -22px` — removed from flex flow so bars touch the 0 baseline
- Bar height percentages are relative to the group height; no label in flow means bar extends to the bottom edge

---

## Typography

Two fonts. Clean separation by role.

### Georgia (headings and prose only)
System serif, always available, zero load cost. Used for every title / heading surface in the UI. NEVER used for numbers-as-data (KPIs, chart labels, table values, financial figures).

- Weight: **always 400 (Regular).** Never bold. The serif provides visual weight already; bolding it reads as heavy/corporate instead of elegant/permanent.
- Feature settings: `font-feature-settings: 'lnum' 1, 'kern' 1; font-variant-numeric: lining-nums;` — **lining figures** force numerals to match uppercase height. Without this, Georgia falls back to old-style figures (variable-height numerals meant for blending with lowercase prose), which makes "1140 IVY ST" look broken. Applied globally via a selector list covering `.PageHeader__title`, `.SectionTitle`, `.Activity__title`, `.PropertyHeader__address`, `.PlaceholderPage__title`, `.Drawer__title`, `.Card__title`, `.StepCard__title`, `.ProcessCard__title`, `.CollapsibleCard__title`, and `h1..h6`.

### Inter (UI, body, all numeric data)
Variable font, loaded from Google Fonts. Used for **everything that isn't a heading**: body text, labels, buttons, table cells, chart labels, KPI numbers, financial figures, AND technical identifiers (Loan IDs, MIN numbers).

- Feature settings for numeric content: `font-feature-settings: 'tnum' 1, 'lnum' 1, 'zero' 0; font-variant-numeric: tabular-nums lining-nums;`
  - `tnum 1` — tabular numerals (equal width per digit → perfect column alignment, equivalent to monospace)
  - `lnum 1` — lining figures (consistent height)
  - `zero 0` — **PLAIN circular zero, no slash.** Matches Excel and standard financial UIs. Slashed zeros read as code-editor aesthetic and don't fit our fintech tone.
- Applied globally via the `.h-num`/`[data-numeric]` selector list covering `.KPICard__value`, `.FunnelChart__value`, `.FunnelChart__pct`, `.StageDuration__value`, `.StageDuration__gridlabel`, `.ChartTooltip__value`, `.ProgressRow__fraction`, `.Activity__time`, `.PropertyHeader__value--mono`, `.DataSection__value--mono`, `.DataGrid__value--mono`, `.WizardField__input--currency`.
- Weights in use: 400 body, 500 secondary labels, 600 semibold labels/nav-active, **700 KPI display** (with `letter-spacing: -0.02em` on KPIs).

### Typography table

| Role | Font | Weight | Size | Color |
|------|------|--------|------|-------|
| Page title | **Georgia** | 400 (NEVER bold) | 28–32px | `--h-text-heading` |
| Section titles | **Georgia** | 400 | 20px | `--h-text-heading` |
| Address titles (property headers) | **Georgia** | 400 | 20–24px | `--h-text-heading` |
| KPI numbers | **Inter** | 700 | 36px (ls -0.02em) | `--h-text-heading`, or `--h-alert-text` for alert |
| Card labels | **Inter** | 600 | 11px uppercase, ls 0.06em | `--h-text-secondary` |
| Column headers | **Inter** | 600 | 11px uppercase, ls 0.06em | `--h-text-muted` |
| Body text | **Inter** | 400 | 14px | `--h-text-primary` |
| User names (tables) | **Inter** | 600 | 13px | `--h-text-primary` |
| Captions/subtitles | **Inter** | 400 | 12px | `--h-text-secondary` |
| Technical IDs (Loan ID, MIN) | **Inter** | 400 | inherit | inherit |

### Deprecated — do not use
- **JetBrains Mono** — removed entirely. The `--h-font-mono` token is gone. Inter's tabular-nums provides the same column-alignment benefits as a monospace font without the code-editor aesthetic. Every former mono site (Loan IDs, MINs, financial values, dev widget) now uses Inter with the numeric feature-settings above.
- **Georgia with default figures on headings.** If you see a new heading without `'lnum' 1`, add it (or extend the global selector list).
- **Inter with slashed zero** (`'zero' 1` or `font-variant-numeric: slashed-zero`). Plain-circle zero only.

### Why these specific choices
- **Georgia over Newsreader or other serifs:** Georgia is a system font (zero network load, available on every device), designed specifically for screen readability by Matthew Carter, and proven in fintech. The "numerals don't match cap height" problem was a configuration issue (old-style figures by default), not a font issue — `lnum` fixes it surgically.
- **Inter tabular-nums over JetBrains Mono:** same-width digits without the code-editor visual tone. One font family for all numbers = total visual consistency from KPI cards to table cells to Loan IDs.
- **Plain zero over slashed zero:** matches Excel, Bloomberg, and standard financial UIs. The slashed zero is an engineering/code convention, not a finance convention.

---

## Component Rules

### Navigation Bar
- **Two-layer structure:** `.NavBar` (outer) = full-width `teal-900` bg, sticky top. `.NavBar__inner` (inner) = `max-width: var(--h-content-max-width)` (1500px), `margin: 0 auto`, `padding: 0 32px`, flex row, height **56px**. This ensures nav content aligns with page content at any viewport width.
- **Logo:** Inline SVG wordmark (extracted from Figma node `66:2988`), height **22px**, width auto, `fill: var(--h-white)`. Paths use `fill` not `stroke`. Container is `.NavBar__logo` with `display: flex; align-items: center`.
- **Left side (clean):** Logo + nav items ONLY. No role selector, no dropdown, no pill on the left.
- **Spacing:** Logo to first tab: **48px** gap. Between tabs: **28px** visual gap (achieved via `padding: 0 14px` on each item with `gap: 0`).
- Nav items: Dynamic per user role (see **User Roles & Routing** section below).
- **Active item:** white text, Inter **14px** weight 600, **green underline accent** — full tab width (`left: 0; right: 0`), 4px tall, flush with nav bottom edge (`bottom: 0`), `green-500` (#14935F), `border-radius: 2px 2px 0 0` (rounded top, flat bottom). The indicator spans from the left padding edge to the right padding edge of the tab — proportional to tab width. Nav items use `padding: 0 14px`, `align-items: stretch` + `height: 100%` so they fill the full 56px nav height. NO `width`, NO `left: 50%`, NO `transform`. NO background fill, no pill shape.
- **Inactive items:** `teal-200` (#A3C5D4) text, Inter **14px** weight 400. Hover → white text only (no bg change).
- **Right side (user area):** Layout order: Avatar (left) → Name/Role stack → Chevron (right). All vertically centered on same axis (`align-items: center`).
  - **Avatar:** 32px circle, `rgba(255,255,255,0.15)` bg, white text, 11px uppercase initials, weight 600. Shape = circle (identity marker per Shape Vocabulary).
  - **Name:** Inter 13px weight 600, white.
  - **Role:** Inter 11px weight 400, `teal-200`.
  - **Chevron:** Tabler `IconChevronDown`, 14px, `teal-200`, stroke-width 1.5. Rotates 180° when dropdown is open (`.NavBar__user-trigger--open`).
  - **Trigger container:** `gap: 8px`, `padding: 4px 8px`, `border-radius: 6px`. Hover → `rgba(255,255,255,0.08)` bg.
- **User dropdown:** white bg, `1px solid stone`, radius 8px, `box-shadow: 0 4px 16px rgba(0,51,74,0.12)`, width 240px. Positioned `top: calc(100% + 8px); right: 0`.
  - **Active user row:** `background: #E4F3EB` (success-bg green). Tabler `IconCheck` at right, 16px, `color: #1A8754` (success green), stroke-width 2.
  - **User rows:** 28px avatar (teal-50 bg, teal-500 text) + name/role stack. `padding: 10px 14px`. Hover → sand bg.
  - **Divider:** `1px solid warm-gray`, `margin: 4px 0`.
  - **Action items:** Tabler icons (16px, stroke-width 1.5) + label. `color: text-secondary`. Hover → sand bg, text-primary.
  - **Danger action (Sign out):** `color: error` (#C4382A). Hover → `#FDE8E6` bg. Uses Tabler `IconLogout`.
  - **Settings:** Uses Tabler `IconSettings`.

**Nav typography audit — only two font families allowed:**

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Logo (text fallback) | Georgia | 400 | 22px |
| Nav items (inactive) | Inter | 400 | 14px |
| Nav items (active) | Inter | 600 | 14px |
| User name | Inter | 600 | 13px |
| Role label | Inter | 400 | 11px |
| Dropdown user name | Inter | 600 | 13px |
| Dropdown role | Inter | 400 | 11px |
| Dropdown actions | Inter | 400 | 13px |

### Buttons
- **Primary:** `bg-green-500`, white text, `hover:bg-green-700`, `active:bg-green-900`
- **Secondary:** `bg-teal-900`, white text
- **Tertiary:** transparent, `border: 1.5px solid stone`, teal-900 text
- **Ghost:** transparent, green-500 text
- **Destructive:** `bg-error`, white text

### Avatars — Subtle Blue, Invisible Infrastructure
- Background: `teal-50` (#E0EDF3) — subtle blue, quiet but branded
- Text: `teal-500` (#1A6E8E) — legible but quiet
- Size: 32px circle (28px with `--sm`), 11px uppercase initials, weight 600
- No rings, no borders, no colored variants
- Same color for ALL avatars — no per-user color assignment
- Avatars can use teal-50 because role pills are now ghost-outlined — no blue-on-blue competition
- Result: eye skips avatar → name → status (the colored thing) → role (if needed)

### Badge Component — Three Visual Lanes
**All badges use `border-radius: 999px` (full pill).** Square/slightly-rounded tags look like buttons. Pill shape universally signals "I'm a label, not a button." Compact shared sizing: `padding: 2px 8px`, `font-size: 11px`, `font-weight: 500`, `font-family: Inter`.

**The "visual lanes" principle:** In any data row, avatars, role pills, entity pills, and status pills must be instantly distinguishable. Each occupies a different visual lane:
1. **Avatars** → subtle teal-50 circles (structural, identity marker)
2. **Role pills** → ghost outlined (quiet identifier, stone border, no fill)
3. **Entity pills** → ghost outlined (same as role pills — differentiated by label text only)
4. **Status pills** → semantic color fills with dot (loud, actionable — the ONLY loud element)

Correct scan order: name → status (colored) → role (if needed). Avatars are skipped.

#### Status Pills (semantic colors, dot + tinted background)
| Status | Dot | Background | Text |
|--------|-----|-----------|------|
| Active | #1A8754 | #E4F3EB | #1A8754 |
| 2FA Complete | #1A8754 | #E4F3EB | #1A8754 |
| Email Verified | #1A8754 | #E4F3EB | #1A8754 |
| KYC Pending | #B8860B | #FEF3E2 | #B8860B |
| Invited | #9BA6AE | #F8F7F4 | #6B7A85 |
| Suspended | #C4382A | #FDE8E6 | #C4382A |
| Pending | #B8860B | #FEF3E2 | #B8860B |

Dot is 6px circle, same color as text. Layout: `[dot] [label]`, `gap: 5px`, `display: inline-flex`, `align-items: center`.

#### Role Pills (ghost outlined — ALL identical)
One style for ALL roles. No tiers, no hierarchy, no elevated variants. The label text differentiates — not color, not fill, not border weight.

`background: transparent` · `color: #6B7A85 (gray-500)` · `border: 1px solid #E0DDD6 (stone)` · `padding: 2px 8px` · `font-size: 11px`

Applies to: Loan Officer, Loan Processor, Program Admin, System Admin — ALL visually identical.

**Why no hierarchy:** Teal fills and pearl fills made some pills look like clickable buttons and created visual noise. The text label alone communicates the role. Status pills are the ONLY badges with color.

#### Entity Type Pills (ghost outlined — ALL identical, same as role pills)
One style for ALL entity types. Visually indistinguishable from role pills — same transparent bg, same stone border, same gray text.

`background: transparent` · `color: #6B7A85 (gray-500)` · `border: 1px solid #E0DDD6 (stone)` · `padding: 2px 8px` · `font-size: 11px`

Applies to: Origination, Investor, Platform — ALL visually identical.

### Cards
- Background: `white` (#FFFFFF)
- Page background: `--h-bg` (#F9F8F4) — airy warm, lighter than `sand` (which is now reserved for hover tints). Cards float on this lighter surface, and readonly `pearl` (#F8F7F4) fields read as slightly sunken against it.
- Border: `1px solid stone` (#E0DDD6)
- Hover (when clickable): border shifts to `1px solid green-500` (#14935F) — subtle "I'm interactive"
- Alert variant: white bg, `3px left-border` in `error` (#C4382A), NO full background fill. Red on metric number and label only.
- Radius: 8px
- Padding: 24px
- Shadow: **none** (flat elevation model)

### Tables — Subtle, Breathable, Actionable
- Zebra striping: even rows #FFFFFF, odd rows `#FAFAF8` (whisper between white and pearl — NOT #F8F7F4 which is too visible)
- Row padding: 12px vertical, 20px first/last column, 16px between columns
- Column headers: uppercase, 11px, letter-spacing 0.06em, color `gray-300` (#9BA6AE), weight 600
- Row dividers: `1px solid warm-gray` (#EDEBE6) — barely visible
- Hover: background → `sand` (#F2F0EA) AND 3px left-border in `--h-action` appears — signals actionability
- Container: `overflow-x: auto`, never overflows parent card
- Layout: `table-layout: fixed` with defined column proportions
- **Text truncation:** Emails max-width 180px, entity names max-width 220px, both with `text-overflow: ellipsis`. Full text in `title` attribute. User names: never truncate.

### TableToolbar — Progressive Disclosure Pattern
Reusable toolbar for any table card. Uses progressive disclosure: filters hidden by default, revealed on demand. BEM class prefix: `.TableToolbar`.

**Row 1 — Title:** `.SectionTitle` (Georgia 400, 20px, teal-900) on its own row.

**Row 2 — Search + Filter toggle:** `.TableToolbar__search-row` (`display: flex`, `gap: 12px`, `margin-top: 16px`)
- Search: `.SearchWrap` + `.SearchInput` — left-aligned, `flex: 1`, `max-width: 360px`, height 36px, radius 6px, stone border, Tabler search icon inside left. Focus → `teal-500` border.
- Filter toggle: `.TableToolbar__toggle` — right-aligned (`margin-left: auto`), rounded rect (6px), stone border, white bg, Tabler `IconFilter` (16px) + "Filters" text (13px Inter 500). Hover → pearl bg + teal-200 border. Active state (`.TableToolbar__toggle--active`): `teal-50` bg + `teal-500` border + count badge "Filters (n)".

**Row 3 — Filter chips (collapsible):** `.TableToolbar__filters` — hidden by default (`max-height: 0`, `opacity: 0`). Toggled open with `.TableToolbar__filters--open` (`max-height: 200px`, `opacity: 1`, `margin-top: 12px`). Transition: `200ms ease`. Contains existing `.FilterChip` elements.
- Filter chips: rounded rect (6px), `height: 32px`, `padding: 0 14px`, stone border, white bg, Inter 13px 500
- Chevron: 16px Tabler `IconChevronDown`, color `--h-text-muted`
- Active chip: `teal-50` bg, `teal-500` border, `teal-900` text
- Gap: `8px` between chips

**Row 4 — Active filter tags (conditional):** `.TableToolbar__tags` — only visible (`.TableToolbar__tags--visible`) when filters are applied.
- Tags: `.TableToolbar__tag` — pill shape (999px, static label), `pearl` (#F8F7F4) bg, `stone` (#E0DDD6) border, `text-primary` (#2D3E4A) text, 11px Inter 500, `padding: 3px 8px`
- Remove button: `.TableToolbar__tag-remove` — 14px × icon, `text-muted` (#9BA6AE), hover → `text-primary` (#2D3E4A). NO red on hover.
- "Clear all": `.TableToolbar__clear` — right-aligned, 12px Inter, `--h-text-muted`, hover → `error` red

**Responsive:**
- **Tablet (≤1279px):** Search `max-width: 280px`
- **Mobile (≤768px):** Search full width, filter toggle full width below search, chips wrap naturally

**HTML data attributes:** `data-toolbar`, `data-toolbar-toggle`, `data-toolbar-filters`, `data-toolbar-tags`, `data-toolbar-label`, `data-filter="key"` on each chip. JS auto-initializes all `[data-toolbar]` instances.

### Shape Scale — Visual Vocabulary
Shape signals interactivity level. This is a permanent design system rule.

| Shape | Radius | Meaning | Examples |
|-------|--------|---------|----------|
| Pill | 999px | Static label / badge | Role pills, status pills, entity type pills, active filter tags |
| Rounded rect | 6px | Interactive control | Filter chips, filter toggle button, dropdown triggers, inputs |
| Square-ish | 4px | Contained element | Nav pills, bar chart tops, code blocks |
| Card | 8px | Content container | Cards, panels |
| Modal | 12px | Overlay | Modals, dialogs |
| Circle | 50% | Identity / indicator | Avatars, status dots |

When building any new component, choose its shape based on what it IS:
- **Is it a label?** → pill (999px)
- **Can the user interact with it?** → rounded rectangle (6px)
- **Is it a person?** → circle (50%)
- **Is it a container?** → card (8px)

### Density
- Default: compact (36px table rows, 32px inputs, 28px chips)
- Offer comfortable toggle for users who prefer standard M3 density

### Spacing Scale — Global Tokens
Every padding, margin, and gap must use a spacing token. No arbitrary pixel values.

| Token | Value | Usage |
|-------|-------|-------|
| `--h-space-2` | 2px | Micro: borders, tiny gaps |
| `--h-space-4` | 4px | Tight: inside pills, label→value gaps in KPI cards |
| `--h-space-8` | 8px | Compact: between inline elements, between filter chips |
| `--h-space-12` | 12px | Snug: between related items, pill padding-x, table footer margin |
| `--h-space-16` | 16px | Base: standard element spacing, chart title to content, KPI grid gap |
| `--h-space-20` | 20px | Comfortable: between company progress rows |
| `--h-space-24` | 24px | Card padding: ALL cards, ALL sides, no exceptions. Chart card gap. Section gap: between KPI strip → charts → tables. Page header margin. |
| `--h-space-32` | 32px | Reserved for larger spacing needs. |
| `--h-space-40` | 40px | Major section: between large dashboard areas |
| `--h-space-48` | 48px | Page section: large vertical breaks |
| `--h-space-64` | 64px | Page bottom: bottom page padding |

### Content Max-Width & Alignment
All page-level content containers use `max-width: var(--h-content-max-width)` (1500px) with `margin: 0 auto` and `padding: 0 32px` for consistent alignment.

**Form / wizard inner column:** `max-width: var(--h-form-max-width)` (**960px**), centered inside the outer canvas. Applied to `.WizardPage` and `.Stepper`. Rationale — a 1500px canvas is optimal for data-dense dashboards and tables, but inline forms at that width feel stretched (line length too long; 2-column form fields become oversized). The inner form column keeps inputs at a comfortable ~400px each. Industry precedent: Stripe, Mercury, Brex, Blend, Carta, SimpleNexus all decouple outer canvas width from inner form width.

**Rule:** if a page is primarily forms / data entry, wrap the form container with `max-width: var(--h-form-max-width); margin: 0 auto`. Page chrome (BackToMain, ActionBar, NavBar) stays at the outer 1500px canvas — never resize the app frame when switching user roles or pages. Dashboards, data tables, and read-only data displays use the full 1500px.

The page-level content container set includes:
- `.NavBar__inner` — nav content (logo, tabs, user area)
- `.Page` — dashboard page content (KPI row, charts, tables)

Nav background (`teal-900`) spans full viewport width; only the inner content is width-constrained. On screens wider than ~1264px, content centers with equal margins. On smaller screens, content fills available width with 32px side padding. Logo left edge always aligns with KPI cards left edge below.

### Card Overflow Rule
**All cards use `overflow: hidden`.** All flex children use `min-height: 0`. All grid children use `min-width: 0`. Charts are responsive containers that fill their parent — never fixed dimensions. This prevents charts, tables, and any content from rendering outside card boundaries.

### Card Padding Rule
**Every card uses `padding: var(--h-space-24)` on all four sides.** No card has more bottom padding than top. If chart content doesn't fill the card, the chart grows to fill — the padding stays fixed.

### Card Divider Rule
**Dividers inside cards always respect the card's 24px padding.** They align with the content, never bleed to the card edges. No negative margins on dividers. A row-separator divider is just a simple `border-bottom` (or block element) on a child inside the padded container — the parent's padding insets it naturally. This applies to every card: activity lists, tables, form sections, settings panels.

### Chart Card Flex Layout
Chart cards use `display: flex; flex-direction: column`. Title is `flex-shrink: 0`. Chart content area is `flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end;` — charts expand to fill available height, bars anchor to bottom. `align-items: stretch` on the charts row grid forces all cards to match the tallest card.

### Detail Page Layout (`.DetailPage`)
Used for loan detail views with sidebar navigation. Flex row layout: `.SideNav` (220px, sticky) + `.DetailPage__content` (flex: 1). Contains BackToMain (above content), PropertyHeader, StepCards, DataSections, FormFields, and ActionBar. See **Navigation patterns** for the canonical rules — breadcrumbs are not used.

### SideNav (`.SideNav`)
Vertical sidebar nav for detail pages. Width: 220px (accommodates labels like "Borrower Qualifications"). White card with stone border, 8px radius. Items: 40px height, Inter 13px, `--h-text-secondary`. Active: teal-50 bg, heading color, weight 600, no accent bar. Sticky at `top: 80px`. At tablet: unstick. At mobile: horizontal scroll row.

### StepCard (`.StepCard`) — Collapsible
Workflow step cards with expand/collapse behavior. Header is fully clickable (`cursor: pointer`). Chevron (20px, `--h-text-muted`) on far right rotates -90° when collapsed. Body wraps in `.StepCard__collapse-body` with `max-height` animation. Status pills inline in header row. Uses `data-step-card` and `data-step-toggle` attributes. JS: `initStepCards()` attaches click handlers.

### DataSection (`.DataSection`)
Nested data display inside StepCards. Title: Inter 14px semibold, bottom border. Grid: flex column, label/value rows. Two-column financial layout via `.DataSection__columns` (grid). Subsection headers (`.DataSection__subsection-title`): Inter 13px semibold, top border separator. Empty values: em-dash in `--h-text-muted` (`.DataSection__value--empty`).

### Disabled Buttons (`.Btn--disabled`)
`opacity: 0.5`, `cursor: not-allowed`, `pointer-events: auto`. Always paired with helper text (`.Btn__helper`) below explaining WHY the button is disabled — either role-based ("Only Administrators can edit") or precondition-based ("All preconditions are complete"). Wrapped in `.StepCard__action-group` (flex column, items end-aligned, 4px gap).

### Disabled Form Inputs (`.FormField__input--disabled`)
Pearl bg (`--h-surface-2`), muted text, subtle border, `cursor: not-allowed`. Lock icon (`.FormField__lock`) positioned absolute at right inside input. Info icon (`.FormField__label-info`) after label text with `title` attribute explaining the permission. Use `--no-icon` modifier when input has no left icon.

### PhoneInput (`.PhoneInput`)
Composite input: country prefix button (flag emoji + "+1" + chevron, border-right divider) + text input. 36px height, stone border, 6px radius. Disabled variant: `.PhoneInput--disabled` — pearl bg, lock icon at right.

### Card Spacing — Global Rule
No card anywhere on the platform sits flush against another card. Use utility classes or flex gap:
- **Top-level cards** (`.page-stack`): `gap: var(--h-space-24)` (24px) — PropertyHeader → StepCards, ProcessCard → CollapsibleCards, etc.
- **Nested cards** (`.card-nested-stack`): `gap: var(--h-space-16)` (16px) — DataSections inside StepCards, form groups below data cards.
- **Grouped cards** (same semantic unit): `gap: var(--h-space-12)` (12px) — rarely used.
Tab content wrappers (`[data-orig-tab-content]`) must use `.page-stack` class. The parent `DetailPage__content` already has `gap: 24px` for PropertyHeader separation.

### StickyBar (`.StickyBar`) — Responsive Sticky Bottom Bar
Replaces the old ActionBar for page-level CTAs. Compact single-row layout on desktop/tablet. Uses `position: fixed`, `data-sticky-bottom` attribute. Sets `--sticky-bottom-offset` on `<html>` dynamically via JS (`requestAnimationFrame` + `offsetHeight`).

**Desktop & Tablet (≥768px):** Single compact row (~48px). Left: ⓘ info icon (Tabler `IconInfoCircle`, 16px, `--h-text-muted`) — hovering shows a tooltip (`.StickyBar__tooltip`) with the full audit trail text. Caption text always hidden (`display: none`), available only via tooltip. Right: action buttons. Tooltip: white bg, stone border, 3px green-cta top accent, 6px radius, positioned above the icon.

**Mobile (<768px):** Stacked full-width layout. ⓘ icon top-left (tooltip still works). CTAs stack vertically full-width in `column-reverse` order (primary CTA on top). Padding: 12px.

### Dev Widget Mobile Position
When the sticky bar is >80px tall on mobile viewports (<768px), the dev widget moves to top-right below the nav (`top: 72px`) instead of bottom-right to avoid collision. Uses `.DevWidget--top` and `.DevPanel--top` modifier classes toggled by `updateDevWidgetPosition()` JS function.

### ProcessCard (`.ProcessCard`) — Origination Lifecycle Tracker
13-step origination process tracker. Header: title + "Application Progress X/40" label. 3px progress bar (`.ProcessCard__bar`) with `--h-action` fill. Steps: full-width clickable rows with step name, green check icon (when complete), task count + chevron (for drill-down steps) or disabled action button (for permission-gated actions like Claim, Submit Funding Details, Mint). Hover: `--h-surface-hover` bg + `--h-action` left border.

**ProcessStep row structure (`.ProcessCard__step`) — right-side content rule:**
Each row is a `<div role="button" tabindex="0">` (NOT a `<button>`, so we can nest a real action button inside without invalid HTML). Layout: `display: flex; justify-content: space-between; min-height: 56px`. A row displays EXACTLY ONE of these right-side patterns, wrapped in a single `.ProcessCard__step-right` container:
- **Pattern A — task count:** `[check icon] [N tasks] [chevron]`
- **Pattern B — action button:** `[check icon] [.ProcessCard__step-btn]` (no chevron — button IS the action)
- **Pattern C — completed, no action:** `[check icon]` only (rare)

`.ProcessCard__step-right` uses `flex-shrink: 0` and `white-space: nowrap` so the button never wraps below the step name. Action buttons inside a row use compact sizing (28px height, 13px font, 6px radius). Disabled action buttons (`.ProcessCard__step-btn--disabled` or `[disabled]`): `--h-surface-2` bg, `--h-text-muted` text, `--h-border` border, 0.7 opacity, `cursor: not-allowed`. In dark mode, disabled border swaps to `--h-border-strong` for contrast.

**Event handling:** action buttons carry `onclick="event.stopPropagation()"` so clicking the button doesn't trigger the row's navigation click. Clicking the row navigates to step detail; clicking the button executes the action.

**Do NOT** nest a `<button>` inside another `<button>` — nested buttons are invalid HTML and the browser auto-closes the outer button when it encounters the inner one, which breaks the flex layout (content wraps to new lines).

### CollapsibleCard (`.CollapsibleCard`)
Reusable expandable/collapsible card for data display (distinct from StepCard which is for workflow steps). Uses `data-collapsible` and `data-collapsible-toggle` attributes. Chevron (20px) rotates -90° when collapsed. Body uses `max-height` + opacity animation (300ms/200ms). First card expanded by default, rest get `.CollapsibleCard--collapsed` class. Thin 1px divider (`.CollapsibleCard__divider`) between header and body. JS: `initCollapsibleCards()` attaches click handlers.

### DataGrid (`.DataGrid`)
Two-column label/value grid for structured data display. Uses CSS grid: `grid-template-columns: 1fr 1fr`, gap 12px vertical / 48px horizontal. Each item (`.DataGrid__item`) is a flex row with label and value. Value modifiers: `--mono` (monospace font for numbers/IDs), `--muted` (italic muted text for TBD/empty values). Used inside CollapsibleCards.

### ParticipantBlock (`.ParticipantBlock`)
Mini participant card with avatar + info. Displayed in a 2-column grid (`.ParticipantsGrid`). Avatar: 36px circle, teal bg, white initials (11px semibold). Info stack: role label (11px uppercase muted), name (13px semibold), optional company, address, contact (12px muted). Pearl bg, md radius, 16px padding. Used in Participants CollapsibleCard.

### Tab Switching (Originations Page)
SideNav items use `data-orig-tab` attribute. Content panels use `data-orig-tab-content` attribute and are shown/hidden via `display`. JS: `initOrigTabs()` attaches click handlers that toggle active class, show/hide panels, toggle ActionBar visibility (Closing tab only), update `--sticky-bottom-offset`, and adjust container padding. Only the Closing tab shows the ActionBar.

### Stepper (`.Stepper`) — Horizontal Wizard Progress
9-step horizontal progress indicator. Each step has a circle + label connected by lines. Three visual states: **completed** (green bg, white check icon, clickable), **active** (green bg, white number, glow ring via box-shadow), **upcoming** (stone border, gray number, not clickable). Connecting lines: completed = green, half = gradient green→stone, upcoming = stone. On mobile (≤768px): stepper hides, replaced by `.Stepper__mobile` showing "Step X of Y — Label" with a progress bar. JS: `initWizardStepper()` renders steps dynamically into `#wizardStepper`.

### WizardSection (`.WizardSection`) — Collapsible Form Section
Card-based collapsible section for wizard forms. Header is fully clickable with title + chevron. Chevron rotates 180° when collapsed. Body uses `max-height` + `opacity` animation. All sections expanded by default. Uses `data-wizard-section` + `data-wizard-section-toggle` attributes. JS: `initWizardSections()`.

### WizardField (`.WizardField`) — Form Field with Label
Label + input wrapper. Required fields use `.WizardField__required` (red asterisk, placed *before* label text). Readonly inputs use pearl bg (`--h-surface-2`), muted border — **never green borders** (green = action only). Inputs are 40px height, stone border, 6px radius. Dollar prefix inputs use a `$` span positioned inside.

### RadioGroup (`.RadioGroup`) & RadioOption (`.RadioOption`)
Vertical radio button group. Each option is a flex row: 18px circle indicator + label. Checked state: green-500 outer ring + green dot inside (6px). Unchecked: stone border, white fill. Horizontal layout available via `.RadioGroup--inline` (flex-direction: row, gap: 24px).

### FormGrid (`.FormGrid`) — 2-Column Form Layout
CSS grid: `1fr 1fr` with 16px column gap and 20px row gap. Variant `.FormGrid--3col` for `1fr 1fr 1fr`. On tablet: stays 2-column. On mobile (≤768px): collapses to single column.

### Drawer (`.Drawer`) — Slide-in Side Panel
Right-side panel, 380px wide, slides in from off-screen. `position: fixed`, full height, `z-index: 100`. Header with title + close button (X icon). Content scrolls independently. Paired with `.DrawerOverlay` (semi-transparent teal overlay, z-index 99). On tablet: 320px wide. On mobile: 100% width. Close triggers: X button, overlay click, Escape key. JS: `initDocsDrawer()` manages open/close state and body scroll lock.

### DocItem (`.DocItem`) — Document List Item
Flex row: file icon (20px, gray-400) + info stack (name + size) + download icon button. Used inside Drawer for document listings. Grouped under section headers (`.Drawer__section-title`).

### WizardBar (`.WizardBar`) — Wizard Sticky Bottom Bar
`position: fixed`, bottom bar for wizard page-level CTAs. Layout: Back button (ghost, left) | center spacer with AutoSave indicator | Save & Exit (outlined) + Continue (primary green with arrow icon, right). On mobile: stacks — Continue full-width on top, Back + Save & Exit row below.

### AutoSave (`.AutoSave`) — Save Status Indicator
Inline indicator with check icon + "Saved just now" text (green-500, 12px). Spinner variant swaps check for rotating spinner icon. Positioned in WizardBar center area.

### Btn--ghost (`.Btn--ghost`) — Ghost Button Variant
Transparent bg, `--h-text-primary` color, no border. Hover: `--h-surface-2` bg. Used for Back buttons in wizards.

### Btn--outlined (`.Btn--outlined`) — Outlined Button Variant
Transparent bg, 1.5px stone border, `--h-text-primary` color. Hover: `--h-surface-2` bg. Used for secondary actions like Save & Exit.

### Readonly Input Pattern
Readonly form inputs use pearl background (`--h-surface-2`) and muted border color. They do NOT use green borders — green is reserved exclusively for interactive/action elements. This is a platform-wide rule: if a user can't interact with it, it must not look interactive.

---

## User Roles & Routing

### Architecture
The prototype uses **hash-based routing** within a single HTML file (`onboarding-dashboard.html`). URL format: `#/<user-slug>/<page-slug>`. The nav bar, page content, and dev widget update dynamically based on the current route.

### Three User Roles

| User | Slug | Name | Initials | Role Label | Default Page | Nav Items |
|------|------|------|----------|------------|--------------|-----------|
| Administrator | `admin` | Alex Morgan | AM | Administrator | `dashboard` | Dashboard, Origination Companies, Investors & Funds, Platform Operations, System Configuration |
| Account Manager | `account-manager` | Jordan Rivera | JR | Account Manager | `originations` | Homium Data, Applications, Originations, Batches, Appraisals, Orders, Redemptions |
| Originator | `originator` | Sarah Chen | SC | Originator | `applications` | Pre-Qualifications, Applications, My Originations |

### Page Structure

Each role has a set of pages. Pages with `hasContent: true` render their built HTML content. All other pages render a **PlaceholderPage** component (centered icon + title + "This page is under construction." subtitle).

Pages with full content:
- `admin/dashboard` — Onboarding Dashboard
- `account-manager/originations` — Loan origination detail page with tabbed sidebar nav:
  - **Details tab** (default): ProcessCard (13-step origination lifecycle tracker with progress bar), CollapsibleCards (Loan Overview, Originator/Appraisal Details, Participants), DataGrid, ParticipantBlock mini cards. No ActionBar.
  - **Closing tab**: StepCard-based closing workflow (collapsible steps, data grids, form inputs, sticky ActionBar with audit trail)

- `originator/applications` — Loan application wizard (Step 3: Property & Loan Information). Horizontal Stepper (9 steps), property header card, 4 collapsible WizardSections (Property Address, Property Information, Loan Information, Monthly Expenses), Documents Drawer, WizardBar with Back/Save & Exit/Continue. Template for ALL wizard flows on the platform.

All other page slots are placeholders awaiting future builds.

### Routing Behavior
- **Default route:** `#/admin/dashboard` (loads on first visit or empty hash)
- **Default pages per user:** Each user has a `defaultPage` property. When switching users, navigation goes to their default page — not always "dashboard".
  - Administrator → `/admin/dashboard`
  - Account Manager → `/account-manager/originations`
  - Originator → `/originator/applications`
- **User switching:** `switchUser(slug)` updates the hash, re-renders nav items, swaps the avatar/name/role in the user area, and navigates to that user's default page
- **Nav click:** Updates the page slug in the hash (e.g., `#/admin/platform-operations`)
- **User dropdown:** Shows all 3 users with a green check (✓) on the active one. Clicking a different user calls `switchUser()`

### Dev Widget — Compact Pill + Page Index Panel

**Collapsed state:** Fixed bottom-right pill (`.DevWidget`). Content: `[green dot] DEV [current page name] [chevron]`. `teal-900` bg, `border-radius: 999px`, `font-family: var(--h-font-mono)`, `font-size: 11px`, `padding: 8px 14px`, `box-shadow: 0 2px 8px rgba(0,51,74,0.3)`. Green dot (6px) = dev mode active. "DEV" label in `green-500`, page name in white, chevron in `teal-200`. Hover → `teal-700` bg.

**Expanded state:** Click pill → `.DevPanel` slides up above it. `width: 320px`, `max-height: 70vh`, `teal-900` bg, `border-radius: 8px`, `box-shadow: 0 8px 24px rgba(0,51,74,0.4)`. Shows all pages grouped by role section (Administrator, Account Manager, Originator). Current page highlighted with green dot + green text. Route slugs (`admin/`, `am/`, `orig/`) shown right-aligned in `teal-200`. Section headers: mono 10px, uppercase, `teal-200`. Items: mono 12px, white, hover → `teal-700` bg. Dividers: 1px `teal-700` between sections. Animation: `opacity + translateY(8px)`, 150ms ease.

**Behavior:** Click page → navigates + closes panel. Click pill again or outside → closes. Escape key closes. Chevron rotates 180° when open.

**Sticky bar offset:** The dev widget must never overlap sticky/fixed bottom bars. Both `.DevWidget` and `.DevPanel` use `bottom: calc(var(--sticky-bottom-offset, 0px) + Npx)` where N is 16px for the pill and 52px for the panel. The `--sticky-bottom-offset` CSS variable is set on `<html>` dynamically — `renderPage()` detects visible `[data-sticky-bottom]` elements and sets the offset to their `offsetHeight`. Tab switching (`initOrigTabs`) uses `requestAnimationFrame` to measure the rendered bar height accurately across breakpoints. Pages without sticky bars get `0px`. On mobile (<768px), if the sticky bar is >80px tall, the dev widget repositions to top-right below the nav instead (see Dev Widget Mobile Position rule).

### Placeholder Page Component
```
.PlaceholderPage — centered flex column, min-height 400px
├── .PlaceholderPage__icon — 48px wrench icon, gray-300
├── .PlaceholderPage__title — Georgia 400, 24px, teal-900
└── .PlaceholderPage__subtitle — Inter 400, 14px, gray-300
```

### Key Implementation Details
- User config lives in a `USERS` JS object keyed by slug
- Nav items are generated dynamically from the active user's `navItems` array
- Page slugs are derived from nav item labels: `label.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-')`
- The admin dashboard content is wrapped in `<div id="adminDashboard">` and shown/hidden based on route
- All other pages inject placeholder HTML into `<main id="pageContent">`

---

## Responsive Design

**Desktop-first** approach with three breakpoints:

| Breakpoint | Width | Label |
|------------|-------|-------|
| Desktop | ≥1280px | Default layout — full nav, grid-based components |
| Tablet | 769–1279px | Collapsed nav, reflowed grids |
| Mobile | ≤768px | Hamburger nav, stacked layout, card-based tables |

### Navigation Collapse
- **Desktop (≥1280px):** Full horizontal nav with all items visible. User area on right with name + role + avatar + chevron dropdown.
- **Tablet (≤1279px):** Last 2 nav items collapse behind a "More ▾" dropdown (white bg, stone border, 8px radius). User area stays right-aligned with name/role visible. Nav inner padding reduces to `0 24px`.
- **Mobile (≤768px):** Nav collapses to: `[☰ hamburger] [centered Homium logo] [avatar]`. User name/role/chevron hidden. Logo uses `position: absolute; left: 50%; transform: translateX(-50%)` for true centering. Hamburger opens slide-over nav panel from left.

### KPI Grid
- **Desktop:** `repeat(5, 1fr)` — all 5 KPI cards in one row
- **Tablet (≤1279px):** `repeat(3, 1fr)` — 3+2 layout, cards wrap naturally. KPI values shrink to 30px, labels to 9px. At narrow tablet (≤1024px), card padding reduces to `14px 16px`, values to 26px.
- **Mobile (≤768px):** `repeat(2, 1fr)` — 2-column grid, 5th card spans full width (`grid-column: 1 / -1`). Card padding 16px, values 28px, labels 9px.

### Charts Grid
- **Desktop:** `1fr 1fr 1fr` — 3 charts side by side, min-height 260px
- **Tablet:** `1fr 1fr` — first 2 charts in a row, 3rd spans full width (`grid-column: 1 / -1`), min-height 240px
- **Mobile:** `1fr` — all charts stacked vertically, min-height 220px

### Content Row (Tables + Activity)
- **Desktop:** `1fr 1fr 1fr` — the SAME 3-column grid as ChartsRow. Table card spans columns 1–2 (`grid-column: 1 / 3`), Recent Activity occupies column 3 (`grid-column: 3 / 4`).
- **Tablet & Mobile:** `1fr` — stacked vertically. **Critical: reset `grid-column: auto` on both children** — the desktop `grid-column` spans must be explicitly reset at tablet/mobile, otherwise the 3-column spans create broken implicit columns in a 1-column grid.

### Mobile Card-Based Tables (≤768px)
On mobile, data tables are replaced with card-based layouts — a **permanent design system rule**:
- Hide `<table>` elements (`.TableScroll { display: none }`)
- Show `.MobileCards` — each row becomes a `.MobileCard` with:
  - **Header:** avatar + name + email (truncated)
  - **Rows:** label/value pairs — Role, Entity, Status
  - Label: gray-500, 12px, left-aligned
  - Value: text-primary, 13px, weight 500, right-aligned
- Status dots and role pills render inline within mobile cards
- Entity overview table also converts to `.MobileEntityCard` cards with name/url header, type pill, users count, status pill
- Critical overflow fix: `.ContentRow .Card { min-width: 0; max-width: 100%; overflow: hidden; }`
- Search input and filter button both go full width on mobile

### Mobile Slide-Over Nav
- Fixed position overlay from left, `width: 280px`, `height: 100vh`
- Panel background: white (`--h-white`), header background: `teal-900`
- Header: avatar + name + role (dynamically updated per current user), close button (×)
- Items: full-width buttons, `min-height: 48px` (touch-friendly), Inter 15px, weight 500, `--h-slate` text
- Active item: `teal-900` text, weight 600, `teal-50` bg, **3px green left accent bar** (`border-left: 3px solid green-500`)
- Footer: divider + action items (Switch user, Settings, Sign out in error red)
- Overlay: `rgba(0, 51, 74, 0.6)`, closes panel on tap
- Transition: `transform 0.25s ease` (slides in from left)

### Responsive Spacing
| Element | Desktop (≥1280px) | Tablet (≤1279px) | Mobile (≤768px) |
|---------|-------------------|-------------------|------------------|
| Page padding | `32px 32px 64px` | `24px 24px 48px` | `16px 16px 80px` |
| Card padding | `24px` | `20px` | `16px` |
| Nav inner padding | `0 32px` | `0 24px` | `0 24px` |
| Table cell padding | `12px 20px` | `12px 14px` (wide) / `10px 10px` (narrow) | N/A (cards) |
| Activity item margin | `0 -24px` | `0 -20px` | `0 -16px` |

### Narrow Tablet Table (769px–1024px)
- `table-layout: auto`, colgroup hidden — browser auto-sizes columns
- Entity column truncated at `max-width: 160px`
- Status column forced `white-space: nowrap` to prevent pill wrapping
- Cell padding reduced to `10px` to give more room for content

---

## Icon Library — Tabler Icons

Standard icon library: `@tabler/icons-react`. 5,700+ line icons with consistent 1.5px stroke. Preferred over Lucide for larger collection and better financial/fintech coverage.

- **Default size:** 20px standalone, 16px inside components (chips, inputs, buttons)
- **Stroke:** always 1.5 — matches our border weights
- **Color:** inherits from parent via `currentColor`
- **Never mix icon libraries** — Tabler only across the entire platform
- **Usage:** `<IconChevronDown size={16} stroke={1.5} />`
- In HTML prototypes: use inline SVGs matching Tabler's path data (viewBox 0 0 24 24, stroke-width 1.5, stroke-linecap round, stroke-linejoin round)

---

## What NOT to Do
- ❌ Never use gold/amber (#E5A744) — killed from old palette
- ❌ Never use green (#14935F) in charts, avatars, pills, or decorative elements — CTA/action accent ONLY
- ❌ Never use cool grays (#F5F5F5, #E5E7EB) — always warm neutrals
- ❌ Never use pure black (#000000) in dark mode — always teal-tinted darks
- ❌ Never use drop shadows on cards — flat + borders only (shadows only on tooltips/modals)
- ❌ Never auto-generate M3 neutrals from Theme Builder — they'll produce minty grays
- ❌ Never confuse CTA green (#14935F) with success green (#1A8754)
- ❌ Never bold Georgia — always font-weight 400 (Regular)
- ❌ Never use multiple colors per avatar — all avatars are teal-50 bg / teal-500 text
- ❌ Never use semantic colors (red, amber, green) in routine chart fills — teal monochromatic only
- ❌ Never use full-background fills for alert KPI cards — use colored text only
- ❌ Never use square/slightly-rounded rectangles for badges — all badges are full pill (999px)
- ❌ Never use a role selector on the left side of the nav — user/role switching lives in the right-side user dropdown only
- ❌ Never use a background-fill pill for the active nav tab — use a full-width green underline accent (`left: 0; right: 0`), not a fixed-width centered strip
- ❌ Never use Unicode chevrons (▾) in the nav — use Tabler `IconChevronDown` SVG (14px, stroke 1.5)
- ❌ Never use fonts other than Inter or Georgia in the nav — no system fonts, Helvetica, or Roboto
- ❌ Never use full-green background tooltips in charts — use white bg with 3px green-500 **top** accent border, 6px radius on all corners
- ❌ Never use left/right-side accent borders on tooltips — always top. The accent must be direction-independent so the tooltip looks the same regardless of flip position
- ❌ Never use midnight (#061D29) as default text color — use slate (#2D3E4A) via `--h-text-primary`
- ❌ Never use filled backgrounds for role or entity pills — ALL are ghost outlined (transparent bg + stone border), no exceptions, no tiers
- ❌ Never use pill shape (999px) for interactive controls — filter chips and dropdowns use rounded rectangle (6px)
- ❌ Never use `2fr 1fr` or fixed-width columns for content rows — use `1fr 1fr 1fr` (same grid as ChartsRow) with `grid-column` spans so columns align vertically across rows
- ❌ Never omit `overflow: hidden` on cards — charts and content must be clipped
- ❌ Never use fixed dimensions on charts — always responsive (width: 100%, height: 100%)
- ❌ Never mix icon libraries — Tabler Icons only, 1.5 stroke weight
- ❌ Never use Unicode chevrons (▾ ▸) — use SVG line icons from Tabler
- ❌ Never use `filter: brightness()` for chart hover — use the dim-siblings opacity pattern
- ❌ Never use inline opacity styles on chart bars — use CSS classes (`--step-1` through `--step-5`)
- ❌ Never use circles for legend dots — rounded squares (2px radius) only. Circles = status indicators.
- ❌ Never use CSS `::after` for chart tooltips — use a `.ChartTooltip` div with JS positioning
- ❌ Never let chart tooltips clip outside card boundaries — flip left/right based on bar position
- ❌ Never let x-axis labels sit in the flex flow — use `position: absolute` so bars touch the 0 baseline

---

## Buttons & Action Hierarchy

Established during the Setup section work (Companies / Branches / Users). This is the canonical rule for placing and styling action buttons across the platform — applies to every table, card, tab, and section.

### Style by nesting depth

| Context | Style | Class |
|---|---|---|
| **Page-level table** main action | Primary, full size | `Btn Btn--primary` |
| **Tab-section table** main action | Primary, small | `Btn Btn--primary Btn--sm` |
| **Sub-section inside tab** (1 level deep) | Ghost, small | `Btn Btn--ghost Btn--sm` |
| **Inside accordion / expanded row** (2+ levels deep) | Ghost, small | `Btn Btn--ghost Btn--sm` |
| **Page/tab-level commit** (Save changes) | Primary, full size, bottom-right | `Btn Btn--primary` |
| **Row-level destructive** (delete, remove) | Icon-only, destructive hover | `Btn--icon Btn--icon--destructive` |
| **Form Save / Cancel** (sticky save bar) | Save = Primary, Cancel = Outlined | `Btn--primary` / `Btn--outlined` |

**One primary per section.** If a section has multiple actions, only the most important is primary; others are outlined or ghost.

### Concrete examples

- ✅ `+ New company` on Companies list page header → `Btn Btn--primary` (full size — page-level main action)
- ✅ `+ Add user` on Branch → Users tab → `Btn Btn--primary Btn--sm` (tab-section main action)
- ✅ `+ Assign to branch` on User → Branch assignments tab → `Btn Btn--primary Btn--sm` (tab-section main action; consistent with the previous example)
- ✅ `+ Add user` on Branch → Permissions → Branch level permissions sub-section → `Btn Btn--outlined Btn--sm` (the tab has "Save changes" as the page-level primary, so this steps down to outlined)
- ✅ `+ Add user` on Branch → Permissions → LO accordion when expanded → `Btn Btn--outlined Btn--sm` (kept at the same weight as the branch-level + Add user — both are the same action class)
- ✅ `Save changes` on Permissions tab → `Btn Btn--primary` (commits the whole tab's changes)
- ✅ Trash icon in PermissionsMatrix rows → `Btn--icon Btn--icon--destructive`
- ❌ Tab-section main action as ghost (`+ Assign to branch` was originally ghost — fixed to primary)

### Position rules

- **Top-right of the section's header**, never bottom-left or after the table.
  - Card header: action goes in `.TableCard__actions` (right side of the header)
  - DetailHeaderCard: action goes in `.DetailHeaderCard__actions`
  - Sub-section: action goes in the section header row, right-aligned
  - LO accordion: action goes in `.LOAccordion__sub-header` (right side of the hint+action row)
- **Form save bars** (sticky bottom): Cancel left, Primary right. Used for create/edit forms where the user has been actively filling content.
- **Tab-level commits** (Save changes): single button right-aligned at bottom of the tab content. Used when changes accumulate across multiple sub-sections.

### What NOT to do

- ❌ Never put action buttons at the bottom of a section's content (other than form save bars and tab-level commits)
- ❌ Never use multiple primary buttons in a single section
- ❌ Never use full-size buttons inside tabs or cards (always `Btn--sm` for nested contexts)
- ❌ Never use `Btn--outlined` for destructive actions — use `Btn--icon--destructive` (with red hover)
- ❌ Never use `Btn--ghost` for the main action of a top-level table — that's the primary slot

### Sizing rule

- **Full-size buttons** (`Btn` without `--sm`) only for page-level hero actions
- **`Btn--sm`** for everything inside a card, tab, or nested context — this is the default in the Setup section

---

## Tables (canonical pattern)

Established during the Setup section work. **Pending Onboarding** (admin dashboard, line ~3417 of `onboarding-dashboard.html`) is the gold-standard implementation — every other table follows its anatomy.

### Anatomy

```
Card (white surface, 8px radius, 24px padding)
├── TableCard__header        ← title-block + actions (when no search)
│   OR TableToolbar          ← title + SearchInput + filter chips (when searchable)
├── TableScroll
│   └── DataTable             ← zebra rows + hover left-accent
└── TableFooter               ← "N items"
```

Required on EVERY table:
- **Card wrapper** — every table sits inside a `.Card`. NEVER float tables on the page background.
- **Title in card** — `.SectionTitle` (Georgia 20px) inside the card header. Optional `.SectionSubtitle` (Inter 13px secondary) below.
  - When the card IS the page (no separate `.PageHeader` wrapper above it — e.g., Setup → Companies / Branches / Users list pages), use `.SectionTitle.SectionTitle--page` (Georgia 28px) so the page H1 outranks card section titles in the type scale.
  - **Type scale rule:** page H1 = 28px (`.PageHeader__title` or `.SectionTitle--page`); card section title = 20px (`.SectionTitle`); detail-entity title = 28px Georgia (`.DetailHeaderCard__title`). Never use 20px for a page-level title.
- **Footer count** — `.TableFooter` ("3 companies", "5 users", "4 branches"). Format: `N {entity}`.
- **Row clickable** — `cursor: pointer` + hover with action-color 3px left accent. NO View button column.

### Three patterns by row type

**Pattern A — User tables** (rows are users)
- `.UserCell` with `.Avatar Avatar--sm` + name (13px bold) + email (11px muted) stacked
- `.RolePill` with **full role name** (`Loan Officer`, `Manager`, `Processor`, `Admin`) — sentence case, no `text-transform`
- Demo badge inline with name via `setupUserCellHTML(user, { demo: true })`
- Used in: Setup → Users list, Branch → Users tab, Pending Onboarding

**Pattern B — Entity tables** (rows are companies/branches)
- Bold entity name, no avatar
- Demo badge inline next to name (`<span class="Tag Tag--demo">Demo</span>`)
- Manager/contact-person columns: plain text (it's a reference, not the focus)
- Used in: Companies list, Branches list, Company → Branches tab

**Pattern C — Compact matrices** (dense permissions / license rows)
- Tight padding (10×12 vs Pattern A's 12×20)
- Identity uses canonical `.UserCell` (avatar + name + email) — same as Pattern A
- Role pill is NOT shown in the user cell of a matrix; the matrix's purpose is access configuration, not role review
- Trash icon for destructive (`Btn--icon Btn--icon--destructive`)
- Used in: PermissionsMatrix, License table

### Cell patterns

| Pattern | Class / convention |
|---|---|
| Identity (avatar + name + email) | `.UserCell` + `.UserCell__info` (Pattern A only) |
| Demo marker | `.Tag.Tag--demo` — INLINE next to name, never on a second line |
| Code chip (UDF, DCDF) | `.Tag.Tag--code` — monospace |
| Status pill | `.StatusPill.StatusPill--{success,warning,error,neutral,info}` — EVERY status row, ALWAYS a pill, NEVER bare text |
| Role pill | `.RolePill` — always full role names (`Loan Officer`, `Manager`, `Processor`, `Admin`). Abbreviations are not used. |
| Empty value | `<span style="color:var(--h-text-muted)">—</span>` — never blank, never "N/A", never "null" |
| Numeric | `style="font-feature-settings:'tnum' 1,'lnum' 1"` — tabular nums, right-align in narrow columns |
| Truncate multi-line | `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` + `title` attribute for tooltip |

### Status pill rule (critical)

Every status cell ALWAYS uses a pill. Inactive uses `--h-surface-2` bg + muted text via `.StatusPill--neutral`, NOT bare gray text. Bare-text status was the most common drift across the platform — every table fixed.

---

## Detail Header Card

Unified header for entity-detail pages (Company / Branch / User detail). Replaces the older `.PropertyHeader` 2-column field grid for entity pages — `PropertyHeader` keeps the property-address use case on AM Originations.

### Anatomy

```
DetailHeaderCard (white surface, 8px radius, 24px padding)
├── DetailHeaderCard__top
│   ├── DetailHeaderCard__title-block (title + subtitle)
│   └── DetailHeaderCard__actions (Edit button)
└── DetailHeaderCard__meta (NMLS │ Phone │ Branches │ Users │ ●Active)
```

- **Title** — `.DetailHeaderCard__title` (Georgia 28px, font-weight 400)
- **Subtitle** — `.DetailHeaderCard__subtitle` (Inter 14px secondary). Per page: Company = "Origination company". Branch = parent company name. User = email.
- **Actions** — `.DetailHeaderCard__actions` — Edit button as `Btn--outlined Btn--sm`
- **Meta strip** — `.DetailHeaderCard__meta` with `.DetailHeaderCard__meta-item` children. Vertical dividers between items via `:not(:first)::before` pseudo. Status pill at far right via `.DetailHeaderCard__meta-status` (margin-left: auto).

Helpers: `metaItemHTML(label, value)`, `metaCustomHTML(label, html)` (for RolePill in user meta), `metaStatusHTML(statusKey, label)`.

### BackToMain placement convention

`.BackToMain` link sits ABOVE the DetailHeaderCard, NOT inside it. The full canonical rules live in **Navigation patterns** below.

✓ Do: BackToMain link above the card, Edit button inside the card actions

---

## Navigation patterns

### Canonical rule

**`BackToMain` is the canonical navigation pattern platform-wide.** Every page that has a parent renders `← Back to [parent]` at the top.

**Breadcrumbs are not used.** The top NavBar + side SideNav already render the section/subsection hierarchy visually; breadcrumbs would duplicate it. Homium's hierarchy is shallow (max 3–4 levels including tabs), and persistent chrome makes breadcrumbs redundant — same pattern Linear, Stripe, Vercel, GitHub Settings use.

**Do not add breadcrumbs.** Revisit only if the platform grows past 4 levels of hierarchy on a single page; don't preempt.

### Position by page type

| Page type | BackToMain position | Notes |
|---|---|---|
| **Detail pages** (Company / Branch / User detail, AM Originations detail) | Non-sticky, sits above the primary content card | Default `.BackToMain` |
| **List pages, dashboards** | None — top NavBar + side SideNav already root the user | n/a |
| **Form pages (Setup create/edit)** | **Sticky**, anchored below the top NavBar via `top: var(--h-top-nav-height)` | Add modifier `BackToMain--sticky` |

### Sticky form-page chrome (`BackToMain--sticky`)

```html
<button class="BackToMain BackToMain--sticky"
        onclick="tryExitSetupForm('<formRootId>', () => <parentGoto>)">
  <svg>…</svg>
  Back to <Parent>
</button>
```

- Sticky position with `z-index: 50` — sits below NavBar (z:100), above content
- Background = `--h-bg` so content scrolls cleanly behind it
- A subtle 1px `--h-border-subtle` bottom border appears once content scrolls past the link's natural position. Toggled via `.BackToMain--scrolled` by `initStickyBackScrollShadow()` (one document-level scroll listener for all sticky-back instances)
- The click handler runs through `tryExitSetupForm(rootId, proceed)` so unsaved-changes are caught (see **Forms → Dirty-form modal**)

### Top-nav vertical anchor

`--h-top-nav-height: 56px` is the single source of truth for the NavBar inner height. `.NavBar__inner` consumes it; sticky form-page chrome uses it as its `top` offset. If the NavBar height ever changes, update only this variable.

---

## Forms

### Field max-width

| Variant | Max width | Use case |
|---|---|---|
| Default (`.WizardField__input`) | **400px** | Every input |
| `--wide` modifier | 720px | Genuinely-wide content (CC email lists, long URLs) |
| `--full` modifier | none | Textareas, multi-select chip groups |
| Container `.FormGrid` | **832px** | Two paired 400px columns + 24px gap |

Email no longer spans full row — pairs with Role on User Edit form. The grid never exceeds 832px on wide viewports.

### Conditional sections

Pattern for sections that unlock based on a related field's value (e.g., "Loan officer details" unlocks when Role = Loan Officer):

```html
<div class="WizardSection" id="setupUserNewLoSection" style="opacity:0.4;pointer-events:none">
  <input disabled>
</div>
```

JS toggles `opacity` + `pointer-events` + each input's `disabled` based on the controlling field's value. Section header includes a hint span: `<span style="font-size:11px;color:var(--h-text-muted)">unlocks when Role = Loan Officer</span>`.

### Save bar (sticky bottom)

```html
<div class="SaveBar" data-sticky-bottom>
  <button class="Btn Btn--primary"
          onclick="saveSetupForm('<formRootId>', '<entity>', () => <parentGoto>)">
    Save <entity>
  </button>
</div>
```

**Save only — no Cancel button.** The cancel/escape route is the **sticky top `BackToMain` link** (see Navigation patterns). Two buttons that lead to the same place (Cancel + Back) is the redundancy modern SaaS removed years ago — by making the top Back link sticky, both escape routes (cancel and commit) are reachable from any scroll depth without the duplicate.

- **Save label includes the entity name** — `Save company` / `Save branch` / `Save user`. Never generic "Save".
- Save remains right-aligned via the bar's `justify-content: flex-end`.
- The `data-sticky-bottom` attribute drives the global `--sticky-bottom-offset` so the DevWidget docks above the bar (see `recomputeStickyBottomOffset()`). The compute is called from `navigate()` AND from each `setupXGoto()` so internal sub-routing transitions also update.
- `saveSetupForm()` clears the form's dirty snapshot before navigating so the post-save nav doesn't trip the discard-changes modal.

### Dirty-form modal

Form-page navigation is **dirty-aware**. Any user input change marks the form dirty; any attempt to navigate away while dirty surfaces a single shared confirm modal.

**Modal copy & affordances:**

| | |
|---|---|
| Title | `Discard changes?` |
| Body | `Your unsaved changes will be lost.` |
| Primary (right, autofocus, the safe choice) | `Keep editing` — `Btn--primary` |
| Destructive (left) | `Discard changes` — `Btn--ghost Btn--destructive` (error color, never gray which reads as disabled) |
| Backdrop click | = Keep editing |
| Escape key | = Keep editing |

**Trigger paths covered (all four):**

1. Top sticky `BackToMain` link click → handled directly by `tryExitSetupForm(rootId, proceed)`
2. Setup sidebar nav click (Companies / Branches / Users) → handled by hashchange interception
3. Top NavBar click (Dashboard / Administration / Setup) → handled by hashchange interception
4. Browser back button → handled by hashchange interception
5. Page reload / tab close → `beforeunload` listener → browser-native confirm (cannot be styled per spec)

The hashchange interceptor (`handleRouteWithDirtyGuard`) is the single choke point for paths 2–4 — every nav path on the platform mutates `location.hash`, so wrapping at that one spot replaces per-element click instrumentation. Restoration uses `history.replaceState` so dismiss leaves no ghost history entries.

**Save bypasses the modal entirely.** `saveSetupForm()` calls `clearFormSnapshot()` before navigating so the post-save nav is clean.

### Dirty-state tracking

```js
// On form-enter (inside setupXGoto('new') after dynamic content renders):
snapshotFormState('setupCompanyNewForm');

// Anywhere afterward:
isFormDirty('setupCompanyNewForm');   // form-specific
isAnyFormDirty();                      // platform-wide

// On form-exit:
clearFormSnapshot('setupCompanyNewForm');
```

Snapshot baseline = serialized input/select/textarea values at the moment of capture. Comparator pass on exit-attempt — no per-input change listeners. Sufficient for prototype scale; if forms grow to thousands of inputs, swap to event-driven dirty bit.

### Modal primitive (library)

Single shared `<div class="Modal" id="...">` markup at end of `<body>`. Wire per call:

```js
openModal('discardChangesModal', {
  onConfirm: () => { /* destructive action */ },
  onDismiss: () => { /* optional */ }
});
```

`closeModal(id)` cleans up listeners + restores focus to the previously-focused element. Tab is trapped inside the panel while open. The primitive is generic — reuse for any future destructive-confirm flow (delete entity, revoke access, etc.) without per-flow markup.

---

## Surface hierarchy (nested content backgrounds)

Visual hierarchy via surface-tone steps:

```
Page bg          (--h-bg, warm #F9F8F4)
  ↓
Card surface     (--h-surface-1, white #FFFFFF)
  ↓
Nested expanded  (--h-surface-hover, sand #F2F0EA)   ← e.g. LO accordion when open
  ↓
Inner Card       (--h-surface-1, white)              ← e.g. Card around PMatrix inside accordion
  ↓
Table rows       (white odd / --h-zebra #FAFAF8 even)
```

**Critical:** `--h-surface-2` (pearl, #F8F7F4) is only ~4 hex steps from zebra (#FAFAF8) — too subtle for nested expanded backgrounds. Use `--h-surface-hover` (sand, #F2F0EA) for clear contrast against zebra rows. The LO accordion body uses sand for this reason.

---

## System Configuration (Setup) architecture

### Nav structure

Top nav: `Dashboard | Administration ▾ | Setup ▾`

- Both "Administration" and "Setup" are dropdown groups in the top NavBar — same pattern, no dual-nav competition.
- Setup dropdown: Companies / Branches / Users.
- Setup pages render full-width content (no in-page left sidebar). The dropdown alone owns sub-navigation; an additional SideNav would duplicate it.
- The `.DetailPage` flex shell is still used as the page wrapper, but only its `.DetailPage__content` child renders; the previous `.SideNav` sibling has been removed from Setup pages.

### Routing

`navigate(user, page)` stays flat. Each Setup top-level page (`setup-companies`, `setup-branches`, `setup-users`) is one slug from the global router's perspective; sub-routes (list / new / detail / tabs) are managed internally by each page's own state machine — same pattern as `initOrigTabs()` in AM Originations.

Sub-views in HTML: `<div class="SetupSubView" data-setup-sub="list|new|detail">`. JS routers: `setupCompaniesGoto(view, payload)`, `setupBranchesGoto(...)`, `setupUsersGoto(...)`.

### Slug decoupling

When item labels would collide with global slugs, use `{label, slug}` objects in the user's nav config:

```js
setupItems: [
  { label: 'Companies', slug: 'setup-companies' },
  { label: 'Branches',  slug: 'setup-branches' },
  { label: 'Users',     slug: 'setup-users' }
]
```

`appendNavGroup()` (the canonical helper for top-nav dropdown groups) supports both string and object items.

---

## PermissionsMatrix

RBAC matrix table. Columns: User (canonical `.UserCell` — avatar + name + email, no role pill) │ Access level (dropdown) │ Can create │ Can submit │ Can withdraw │ Trash (delete).

### Access level → row state mapping

| Level | Leading dot | Checkbox cells |
|---|---|---|
| No access | hollow ring (`--h-text-muted` border) | `—` em-dash |
| View only | filled `--h-text-muted` (gray) | `—` em-dash |
| Can edit | filled `--h-info` (blue) | editable, default = previous state |
| Full access | filled `--h-success` (green) | all checked + disabled (forced) |

The level is communicated by a colored **leading dot inside the dropdown**, not a fill. Fill colors read as "selected UI state" and conflict with the chevron's interactive affordance — the dot reads as level, full stop. Border + background stay neutral across all four states.

Implementation: `.PMatrix__select` declares `--pm-dot` and `--pm-dot-bg`; modifier classes (`--full / --edit / --view / --none`) override `--pm-dot` (or `--pm-dot-bg` for the hollow-ring case). Both the chevron and the dot are layered via `background-image` (comma-separated).

The "No access" hollow ring is intentional — a red fill would over-dramatize "no permission set" on a config screen. Hollow communicates absence without alarm.

The HelpTooltip on the column header mirrors the dot vocabulary one-to-one via `.HelpTooltip__levels` + `.HelpTooltip__dot--{full,edit,view,none}` so the legend reads exactly like the controls below it.

JS: `onPmLevelChange(sel)` updates the row's flag cells when the dropdown changes. Row stays visually neutral (no row-level tint) — only the leading dot carries level information.

### Refined checkbox styling

`.PMatrix__check` uses `appearance: none` + custom 1.5px-stroke pseudo-element check (replaces native `accent-color` for OS-consistent rendering). When `:disabled:checked` (Full access state), uses muted color to signal "auto-applied, not editable".

### Two scopes

- **Branch level matrix** — what each branch member can do at the branch level
- **Per-LO matrix** — what other members can do on each LO's applications. Wrapped in `.LOAccordion` (collapsible per-LO sections). First LO expanded by default.

### Zebra striping

`.PMatrix tbody tr:nth-child(odd/even)` uses `--h-surface-1` and `--h-zebra`. Contrast preserved when nested inside `.LOAccordion__body` (sand bg) because the inner Card frames the matrix with a white edge.

---

## MarketEnablementGrid

50-state US grid (51 with DC) with three visual states:

- **Selected** — action-color tint (this state is enabled here)
- **Available** — outlined, hoverable (selectable but not yet selected)
- **Unavailable** — muted/disabled (`cursor: not-allowed`, "Not enabled at parent" tooltip)

Rendered via `renderMarketGrid(elId, allStates, selectedStates, opts)`:
- `opts.editable` toggles cursor + click handler
- `opts.available` constrains which states can be toggled (subset-of-parent rule)

Read-only mode: add `.MarketGrid--readonly` class — strips cursor + hover affordances.

---

## Subset-of-parent constraint (Programs / States)

When children inherit eligibility from parents (Branch programs/states constrained by Company), the inheritance is shown explicitly in the UI:

- **Programs**: `.ProgramsChecklist` shows ALL parent's programs. Non-eligible items render with "not enabled at parent" italic muted note instead of a checkbox. Rendered via `renderProgramsChecklist(elId, availableIds, selectedIds, editable)`.
- **States**: `.MarketGrid` shows ALL US states. States not enabled at parent render as `.MarketGrid__chip--unavailable`.

**Pattern:** render the full superset, mark constraints visibly. Don't hide the unavailable items — that obscures why something isn't selectable.

---

## Toast (prototype affordance)

Transient bottom-center notification used for stub buttons that don't have real backends yet (Edit, Save changes, Add user, etc.).

```js
showToast('Demo: Permissions changes would be saved.');
```

- Bottom-center positioning (`bottom: var(--h-space-32); left: 50%; transform: translateX(-50%)`)
- 2.5s auto-dismiss
- Reuses a single DOM element via `getElementById('toast')`
- Z-index 10000 (above everything)

For production, replace `showToast(...)` calls with real action handlers. Search/replace `showToast(\'Demo:` to find all stub points.

---

## Tags

Inline pills for codes, demo markers, and short labels. Distinct from `.StatusPill` (status with dot) and `.RolePill` (RBAC role).

| Class | Use case |
|---|---|
| `.Tag` | Base — neutral outlined pill |
| `.Tag.Tag--code` | Monospace, for program codes (UDF, DCDF, NMLS) |
| `.Tag.Tag--demo` | Neutral surface tone, "DEMO" marker for prototype-only data |
| `.Tag--group` | Flex container for multiple tags in a cell |

Demo tag deliberately uses neutral surface tone (NOT warning amber) so it reads as secondary metadata, not an alert.

---

## Document history

- **2026-05-05** — Setup section consistency pass: documented Tables canonical pattern, DetailHeaderCard, Forms max-widths, Surface hierarchy, System Configuration architecture, PermissionsMatrix, MarketEnablementGrid, Subset-of-parent constraint, Toast, Tags. Established BackToMain placement convention. Added Buttons & Action Hierarchy section.
- **2026-05-06** — Form-page navigation lock-in. Added top-level **Navigation patterns** section: BackToMain canonical platform-wide, breadcrumbs explicitly out of scope (Breadcrumb CSS removed from `index.html`), `.BackToMain--sticky` modifier for form pages anchored under `--h-top-nav-height`. Forms section rewritten: Save bar is **Save only** (no Cancel — top sticky Back is the cancel route), Save label includes entity name, dirty-form modal pattern documented (Discard changes / Keep editing, all four exit paths covered, save bypasses). New library Modal primitive + `Btn--destructive` text modifier documented. PermissionsMatrix Access-level rewritten to dot vocabulary (green/blue/gray/hollow), HelpTooltip levels list documented. Role pill convention rewritten to sentence case + always full names (no abbreviations, no `text-transform: uppercase`). Type-scale rule made explicit (`SectionTitle--page` 28px for page-level titles inside cards). Tab spacing fixed at 16px below tab strip (was stacking 16+24).

---

## Files in This Kit
- `homium-design-tokens.json` — W3C design tokens for Tokens Studio / Figma import
- `homium-palette-system.jsx` — Interactive React palette explorer (all swatches, contrast audit, dark mode, data viz)
- `Homium_Brand_Guidelines_v1.pdf` — 13-page brand guidelines PDF
- `FIGMA_REFERENCE.md` — Figma node map with IDs for every key frame, plus redesign priority order
- `CLAUDE.md` — This file (project context for Claude Code)

## Figma File
Working file: https://www.figma.com/design/h61NDrf5JpMsJNW7R5AAw5/-Internal--Homium-2.0
Uses Material Design 3 examples as UX reference, with Homium brand applied on top.
