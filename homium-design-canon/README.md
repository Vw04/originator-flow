# Homium Design Canon — handoff bundle

Drop this whole `homium-design-canon/` folder into the repo root. It's the
authoritative design system for the Homium platform. Nothing here collides with
the app — it's a self-contained reference + ruleset.

## What's inside
| File | What it is |
|---|---|
| **CLAUDE.md** | Entry point for Claude Code sessions — what to read before building, and the deviation → sign-off → document loop. |
| **DESIGN_CANON.md** | The single source of truth: tokens, typography, color, components, navigation, data viz, RBAC role model. Supersedes the old `assets/specs/design-canon*.html`. |
| **tokens.css** | The canonical CSS custom properties (light + dark). Import into `styles.css` so values can't drift. |
| **MIGRATION.md** | Phase-by-phase cleanup punch list mapped to the app's files — bring existing code into line. |
| **DECISIONS.md** | Append-only decision log (rationale + who), including where Xivic overrode a Vince spec. |
| **reference/onboarding-dashboard.html** | A working reference implementation of the canon. Look at it; **don't merge it** (it's a single-file prototype, the app is a multi-file SPA). |

## Two-minute start
1. Read **CLAUDE.md**, then **DESIGN_CANON.md**.
2. Import **tokens.css** into `styles.css`.
3. Work through **MIGRATION.md** to align the existing app.
4. For anything new: reuse the canon first; if you must deviate, surface the
   trade-off, get sign-off, then update the canon + **DECISIONS.md**.

The point: one source of truth, so pages, navigation, and components stay
consistent as the team adds screens and flows.
