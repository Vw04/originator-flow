# FIGMA_REFERENCE.md — Homium 2.0 Figma Node Map

## File
- **URL:** https://www.figma.com/design/h61NDrf5JpMsJNW7R5AAw5/-Internal--Homium-2.0
- **fileKey:** `h61NDrf5JpMsJNW7R5AAw5`
- **Page:** Material (node `0:1`)

## Key Frames

### Reference Screens (current work)
| Frame | Node ID | Description |
|-------|---------|-------------|
| Current Platform (Homium Data) | `9:1393` | OLD design — slate/gold palette. Data dashboard with pool summary, choropleth map, FICO/LTV/income charts, loan table. **Do not replicate this palette.** |
| Onboarding Dashboard (Redesign) | `9:1394` | NEW design — closest to final brand. Sand bg, stone borders, forest green accents. Onboarding funnel, stage duration, pending users table, entities overview. **Use as reference for layout patterns.** |

### Material 3 Example Screens (UX reference)
| Frame | Node ID | Type |
|-------|---------|------|
| Detailed view (Mobile) | `2:5036` | M3 list + detail pattern |
| Gallery (Mobile) | `2:5979` | M3 image grid |
| Home (Mobile) | `2:8153` | M3 home with carousels |
| Library (Mobile) | `2:9520` | M3 filter chips + card grid |
| Messaging (Mobile) | `2:9895` | M3 chat bubbles |
| Reviews (Mobile) | `2:10923` | M3 list items + ratings |
| Upcoming (Mobile) | `2:14611` | M3 carousel + list |
| Detailed view (Web) | `2:14934` | M3 nav rail + detail layout |
| Gallery (Web) | `2:15319` | M3 nav rail + image grid |
| Home (Web) | `2:16055` | M3 nav rail + sections |
| Library (Web) | `6:16777` | M3 nav rail + card grid |
| Messaging (Web) | `6:17716` | M3 split pane chat |
| Reviews (Web) | `6:18641` | M3 nav rail + list items |
| Upcoming (Web) | `6:19201` | M3 nav rail + carousel + list |

### Homium Website (reference only)
| Frame | Node ID | Type |
|-------|---------|------|
| Website Desktop | `6:20313` | Current homium.io about page |
| Website Mobile | `6:20641` | Current homium.io mobile |

## How to Use in Claude Code

Pull screenshots or design context from any frame:
```
# Get a screenshot
Figma:get_screenshot(fileKey="h61NDrf5JpMsJNW7R5AAw5", nodeId="9:1394")

# Get full design context (code + screenshot + metadata)
Figma:get_design_context(fileKey="h61NDrf5JpMsJNW7R5AAw5", nodeId="9:1394")
```

## Design System Analysis Prompt

When setting up the codebase, run this analysis to generate design system rules:

1. **Token Definitions** — All tokens are in `homium-design-tokens.json` (W3C format) and documented in `CLAUDE.md`
2. **Component Library** — Building custom React components with Radix UI primitives for accessibility
3. **Styling** — Tailwind CSS with custom theme config mapped to Homium tokens, or CSS modules with CSS custom properties
4. **Icons** — Use Lucide React (same icon set as the M3 examples)
5. **Responsive** — Desktop-first (institutional platform), responsive down to tablet. No mobile-first.

## Redesign Priority Screens

Based on the current Figma file, these screens need redesigning in order:

### Phase 1 — Core Platform
1. **Homium Data Dashboard** (currently `9:1393`) — Pool summary, choropleth map, charts, loan table. Replace gold palette with Homium tokens. Apply sequential teal ramp to map, categorical palette to comparison charts.
2. **Onboarding Dashboard** (currently `9:1394`) — Already 80% there. Align chart colors with official categorical palette. Standardize pill styles. Refine nav bar tokens.

### Phase 2 — Navigation & Shell
3. **App Shell / Navigation** — Define the platform-wide nav pattern (rail vs sidebar vs top bar — TBD based on user's decision). Apply Homium tokens to nav chrome.
4. **Users / Applications / Originations** — Data-heavy table views. Apply compact density, Homium table styles.

### Phase 3 — Detail Views
5. **Loan Detail View** — Individual loan data, appreciation chart (use diverging palette), property info
6. **Investor Portal** — Token pricing, pool performance, NAV charts
