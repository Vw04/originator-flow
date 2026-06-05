# Homium — Migration / Cleanup Punch List

Bring the `originator-flow` app into line with `DESIGN_CANON.md`, area by area.
Each item: **what → why → where**. Line numbers are anchors that may drift — the
**selector / token name** is the reliable target. Check items off as you go.

> Most of this is *polish*, not rebuild: your `nav.js` already matches the canonical
> SideRail (ours was modeled on it), and you're already on Source Serif 4. The real
> work is the token swaps + a few state/treatment fixes below.

---

## 0. Wire up the tokens (do this first)
- [ ] Import the canonical tokens: add `@import "homium-design-canon/tokens.css";`
      at the top of `css/styles.css` (or copy its `:root` block in). Everything below
      then resolves through `var(--h-*)`.
- [ ] Remove local color/spacing literals that now duplicate a token (search
      `styles.css` for raw hex like `#C5DEF5`, `#5A8AA0`, and ad-hoc px paddings).

## 1. Navigation — SideRail
- [ ] **Active tile fill** — `styles.css` `.sidenav-tile.active` (~line 290):
      change `background: var(--color-primary-container, #C5DEF5)` →
      `background: var(--h-action-bg-strong)`. (Off-brand Material blue → brand navy tint.)
- [ ] **Remove the active left bar** — delete `.sidenav-tile.active::before`
      (`styles.css` ~295–302). The filled pill is the single active signal.
- [ ] **Hover** — confirm `.sidenav-tile:hover` uses `rgba(0,51,74,0.08)` navy tint
      (`styles.css` ~289), consistent with the active family.
- [ ] **Flyout/overlay polish** — Administration/Search/Notifications/Profile:
      drop the `::before` arrow pointers; add fade+slide (opacity/transform, 120ms);
      ensure mutual exclusion + Escape-to-close + `aria-expanded` on triggers
      (`nav.js`). Tile-anchored flyouts must flip on viewport overflow.

## 2. Components & pills
- [ ] **Avatars → one teal style.** `nav.js` (~290, 295) renders avatars with inline
      `style="background:${avatarColor(role)}"`. Remove the per-role color; let
      `.sidenav-avatar` use `--h-avatar-bg` / `--h-avatar-text`. Delete the
      `avatarColor(role)` helper. (Canon: one avatar style, no per-user color.)
- [ ] **Role/entity pills → ghost-outlined, identical.** Any filled/abbreviated role
      pills → transparent + `1px var(--h-stone)` + `--h-text-secondary`, full names
      in Title Case. Status pills stay the only colored badge.
- [ ] **Input height.** Set `--input-height: 32px` (compact) and add
      `--input-height-wizard: 40px`; point wizard fields at the 40px token.
- [ ] **Card elevation → flat.** Strip `box-shadow` from card classes
      (`.inst-card`, `.entity-header`, `.hm-card`). Keep shadow tokens for overlays only.
- [ ] **Card padding.** `--card-pad: 24px` (was 25px) to sit on the spacing scale.
- [ ] **Save bar → save-only.** Remove Cancel from form action bars; rely on the
      sticky BackToMain. Save button navy (`--h-action`), label names the entity.

## 3. Typography
- [ ] Confirm headings are Source Serif 4 **weight 400 only** (no bold) everywhere.
- [ ] Card section titles = 20px serif; page H1 = 28px. Never 20px for a page title.
- [ ] Numbers use Inter tabular figures (`.h-num` pattern), not the serif.
- [ ] Tab strips: 16px gap below the strip, platform-wide.

## 4. Data viz
- [ ] **Bar palette** → `--h-data-1` = brand teal; single-variable bars use opacity
      stepping (0.40/0.55/0.70/0.85/1). Multi-series: navy → teal → light blue.
- [ ] **Chart tooltip** → white bg, 1px border, **3px navy top accent** (NOT green —
      green is reserved for diverging-positive data; see DECISIONS #DV-1), value in
      **Source Serif 18px**, label Inter 11px.
- [ ] **Dim-siblings hover** → `.is-hovering`/`.is-hovered`, 0.40/0.85 opacity;
      never `filter: brightness()`.

## 5. Retire the old specs (single source of truth)
- [ ] Archive/delete the superseded spec HTMLs now that `DESIGN_CANON.md` is authoritative:
      `assets/specs/design-canon.html`, `design-canon-vs-brandkit.html`,
      `design-canon-iterations.html`, `design-canon-action-bar.html`.
      (Move to an `_archive/` folder or remove. Keep RBAC + PRD specs — those are
      product docs, not design canon.)
- [ ] Point any READMEs/links that referenced those files at `homium-design-canon/`.

## 6. Going forward
- [ ] Keep `homium-design-canon/CLAUDE.md` discoverable so every Claude Code session
      reads the canon before building.
- [ ] New atom/component/deviation? Surface trade-off → sign-off → document in
      `DESIGN_CANON.md` (+ token in `tokens.css`) → append to `DECISIONS.md`.
