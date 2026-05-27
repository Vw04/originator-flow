# Homium Design Canon — v2026-05-26

This is the authoritative design canon for the Homium platform. It is the source of truth for all UX and frontend work going forward. The UX team and Claude Code both operate from this document.

---

## What's in This Package

| File | Purpose |
|---|---|
| `CLAUDE.md` | **The design system.** Tokens, typography, components, layouts, patterns, conventions, and the behavioral contract for Claude Code. The source of truth. Place this at the root of any Homium project repo. |
| `homium-design-tokens.json` | Updated W3C design tokens for Tokens Studio / Figma import. Purple removed. Semantic tokens confirmed. |
| `FIGMA_REFERENCE.md` | Figma node map with IDs for every key frame, plus redesign priority order. |
| `DECISIONS-LOG.md` | Full record of decisions made in the 2026-05-26 canon review session — rationale for each override. |
| `README.md` | This file. |

**The 2026-05-19 dev team handoff (`index.html`)** remains the implementation reference for component-level HTML/CSS. Keep it accessible — open it in a browser when you need to inspect a component's structure. Where the prototype and this canon disagree, **this canon wins.**

---

## What Changed from the 2026-05-19 Handoff

This canon accepts the 2026-05-19 handoff as its base and applies five overrides:

### 1. Navigation: Left Icon Rail (not top NavBar)
**What the kit said:** Top NavBar, 56px, teal-900, sticky.  
**What we decided:** 92px fixed left icon rail — global on every view. This is locked.

The detail-page 220px sub-nav from the kit is additive: it can appear as a secondary layer for deep sub-routes. It does not replace the left rail.

### 2. Heading Font: IvyPresto Display 300 (not Source Serif 4)
**What the kit said:** Source Serif 4, weight 400.  
**What we decided:** IvyPresto Display, weight 300 — for all heading contexts and display-scale numerals. We hold the IvyPresto license; its 300 weight is distinctly more refined for our institutional positioning.

When reading the prototype, translate `Source Serif 4 / 400` → `IvyPresto Display / 300`. The semantic intent is identical.

SF Mono is retained for code/ID contexts (`Tag--code`, dev widget). This overrides the kit's recommendation to deprecate monospace entirely.

### 3. PermissionsMatrix: Explicit Text Labels (not dot vocabulary)
**What the kit said:** Four-state dot vocabulary (hollow ring / gray / blue / green) communicated via colored leading dots in dropdown.  
**What we decided:** Binary on/off (filled blue selected state) OR explicit "View" / "Edit" text labels. No trained dot vocabulary required — users don't interact with this matrix frequently enough to need iconographic shorthand.

### 4. Token: `--color-purple` Removed
**What the kit said:** Defer / drop — kit forbids decorative purple, token is unused.  
**What we decided:** Removed. The token is gone from `homium-design-tokens.json`. Search for any `var(--color-purple)` or `#7C3AED` references in code and remove them.

### 5. Role Pill Convention: Deferred
**What the kit said:** Full names, sentence case, uniform appearance.  
**What we decided:** Role pills are moot for now. Future direction is free-entry tagging (user types a role; tag created from input value). No enforced vocabulary yet.

---

## How to Integrate

### Step 1 — Drop `CLAUDE.md` at the root of your repo

```bash
cp CLAUDE.md /path/to/your/homium-project/CLAUDE.md
```

Claude Code reads any `CLAUDE.md` in the working directory automatically. No configuration needed. The next time you open Claude Code in that directory, it knows your tokens, components, conventions, and behavioral contract.

### Step 2 — Keep the prototype accessible

The 2026-05-19 `index.html` is a living reference, not a deliverable. Treat it as:
- A visual inspection tool — open in a browser to see any component before implementing it
- A grep target — `grep -n 'class="DetailHeaderCard"' index.html` for usage examples
- A copy-paste source for HTML patterns (updating `Source Serif 4` references to IvyPresto)

Recommended location: `docs/prototype/index.html`.

### Step 3 — Import tokens into Figma

Import `homium-design-tokens.json` via Tokens Studio for Figma. The file is W3C format.

### Step 4 — Share the Working Agreement with your team

Read the **Working Agreement** section of `CLAUDE.md` in your first session. Three things matter most:
- Claude **describes before tweaking** — every change is previewed before it lands
- Claude **reuses what exists** and stop-and-asks before inventing new patterns
- Claude **surfaces options** when a task could go several ways

---

## Working With Claude Code on Homium

### Building a new page from scratch

> "Let's build the [page] view. Read CLAUDE.md and propose a layout using existing components. Don't write code yet."

Claude returns a plan composed of documented components. You approve, it builds.

### Modifying an existing page

> "On the Branches detail page, I want to add [X]. Walk me through what you'd change before doing anything."

Claude describes the change (files, classes, impact), references the relevant pattern in CLAUDE.md, and pauses for approval.

### Adding a new component

Claude detects when something doesn't exist in the design system, stops, and proposes options. Pick one — Claude implements AND documents it in `CLAUDE.md` in the same pass.

---

## Pending / Blocked Items

Two items are explicitly blocked and should not be implemented until resolved:

1. **Cancel button behavior** — save bar and form exit behavior needs alignment with Soren. Do not remove or add a Cancel button pattern without this sign-off.
2. **Dirty-form modal trigger logic** — add to the list of items for the Soren alignment conversation.

See `DECISIONS-LOG.md` for full context.

---

## Questions

If a pattern or convention isn't covered in this document, the right move is to ask before improvising. Open a conversation, state what you think the pattern is, list what already exists nearby, and present 2–3 options if something new is needed. That is how the design system stays coherent.
