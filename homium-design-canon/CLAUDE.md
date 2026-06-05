# Homium — working agreement for Claude Code

You are building screens and flows for the **Homium platform**. A design system
already exists and is authoritative. Your job is to build *within* it, not to
reinvent it. Consistency across pages, navigation, and components is the goal.

## Read this BEFORE you build or decide anything

1. **`homium-design-canon/DESIGN_CANON.md`** — the single source of truth for
   tokens, components, navigation, motion, and rules. Read it before creating any
   screen, component, or style.
2. **`homium-design-canon/tokens.css`** — the canonical tokens. Reference them;
   never hardcode a color, radius, or spacing a token already covers.
3. **`homium-design-canon/reference/onboarding-dashboard.html`** — a working
   reference implementation of the canon. Look at how a pattern is done before
   writing a new one. **Do not merge it into the app** — it's a single-file
   prototype; the app is the multi-file SPA. It's a visual/behavioral reference.

If a doc and the code disagree, the doc wins — fix the code (and log it).

## The build loop

1. **Reuse first.** Find the existing token / component / pattern in the canon.
   Most screens are assembled from what already exists.
2. **If something genuinely new is needed** (a new atom, component, or a
   deviation from a documented rule):
   - **Stop.** Don't just add it.
   - State the **trade-off** plainly: what the canon says, what you want instead, why.
   - Get **sign-off** from a human.
   - Once approved: add it to `DESIGN_CANON.md` (and a token to `tokens.css` if
     it's a value), and append an entry to `DECISIONS.md`.
3. **Never introduce an undocumented pattern.** Two ways to do the same thing =
   the inconsistency we're preventing.

## Non-negotiables (full list in DESIGN_CANON.md)

- **One nav:** the 92px fixed left **SideRail**. No top nav. Tiles are icon+label.
- **Headings:** Source Serif 4, weight 400 only (never bold). Page H1 = 28px,
  card section title = 20px. Body/numbers = Inter (numbers use tabular figures).
- **Color:** navy `--h-action` is the only brand action color. Status pills are
  the only colored badges; role/entity pills are ghost-outlined. Avatars use one
  teal style. Cards are flat (1px border, no shadow); shadows are for overlays only.
- **Spacing:** only the `--h-space-*` scale. No arbitrary px.
- **Motion:** ease-out, ~120ms; never animate layout properties.
- **No em dashes in UI copy.** Sentence case for UI labels.

## Migration

The app predates this canon and has known drift. `MIGRATION.md` is the
phase-by-phase punch list (file + line + exact change). Work through it; check
items off as you go. The old `assets/specs/design-canon*.html` files are
**superseded** by `DESIGN_CANON.md` and should be archived (see MIGRATION.md).
