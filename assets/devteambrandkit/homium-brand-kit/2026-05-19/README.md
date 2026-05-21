# Homium Design System — Team Handoff

This is the complete design system Homium's prototype has been built against. It's everything your team needs to keep building new pages and sections on top of a consistent foundation — and to use Claude Code as a coding partner who already knows the rules.

**Captured:** 2026-05-19

---

## What's in this folder

| File | Purpose |
|---|---|
| `CLAUDE.md` | **The design system.** Tokens, typography, components, layouts, patterns, conventions, and the behavioral contract for working with Claude Code. This is the source of truth. |
| `index.html` | **The working prototype.** Every pattern in `CLAUDE.md` lives here as real, inspectable code. Open it in a browser, click around, grep for usage examples. |
| `README.md` | This file. |

---

## How to integrate into your project

### Step 1 — Drop `CLAUDE.md` at the root of your repo

```bash
cp CLAUDE.md /path/to/your/homium-project/CLAUDE.md
```

Claude Code automatically reads any file named `CLAUDE.md` it finds in the working directory and treats it as its instruction set. That's it — no configuration, no setup. The next time you open Claude Code in that directory, it knows your tokens, your components, your conventions, and the working agreement.

### Step 2 — Keep `index.html` somewhere accessible

You don't need it in your production repo. Treat it as a reference artifact:

- Open it in a browser to visually inspect any component before implementing it.
- Use browser DevTools to read the live CSS and copy patterns directly.
- Grep it from the command line for usage examples (`grep -n 'class="DetailHeaderCard"' index.html`).

A common pattern: keep it in `docs/prototype/index.html` so engineers can serve it locally when they need a visual reference.

### Step 3 — Set the working agreement in your team's first session

In your first Claude Code session on the Homium project, open `CLAUDE.md` and read the **Working Agreement** section at the top together with your team. Three things matter most:

- Claude will **describe before tweaking** — every change is previewed before it lands.
- Claude will **reuse what exists** and stop-and-ask before inventing new patterns.
- Claude will **surface options** when a task could go several ways, instead of picking silently.

This makes Claude a careful collaborator, not an aggressive auto-pilot.

---

## How to use Claude Code on Homium

A few patterns that have worked well in the prototype's development:

### Building a new page from scratch

> "Let's build the borrower detail page. Read CLAUDE.md and propose a layout using existing components. Don't write code yet."

Claude will return a plan composed entirely of documented components. You approve, it builds.

### Modifying an existing page

> "On the Branches list page, I want to add a sortable 'Last activity' column. Walk me through what you'd change before doing anything."

Claude will describe the change (markup, JS, footer impact), reference the table pattern in `CLAUDE.md`, and pause for approval.

### Adding a new component or pattern

When Claude detects the user is asking for something that doesn't exist in the design system, it will stop and propose options. Pick one, and only then will it implement — AND document it in `CLAUDE.md` in the same pass.

### When something feels off

> "I don't like how this looks. What are my options to improve it?"

Claude will give you 2–3 directions with tradeoffs rather than silently overwriting.

---

## What changed in this version (vs. previous handoffs)

See `CLAUDE.md` → the **Document history** section at the bottom for the full timeline. Highlights since the May 5 handoff:

- **Form-page navigation pattern locked in** — sticky `BackToMain` link + Save-only bar + dirty-form modal covering all four exit paths (top Back, sidebar, top-nav, browser back/reload).
- **Modal primitive added** — single shared library component for any confirm/destructive flow.
- **Heading typeface migrated from Georgia to Source Serif 4** — modern open-source serif with proper lining figures; removes the `HeadingNumFix` workaround entirely.
- **Setup section chrome simplified** — top NavBar dropdown is the single nav source; the duplicate in-page left SideNav has been removed.
- **PermissionsMatrix Access-level redesigned** — dot vocabulary (green/blue/gray/hollow) instead of filled-blue selected-state appearance. HelpTooltip legend mirrors it.
- **Role pills** — full names only (no abbreviations), sentence case (no uppercase). Cell unification across all user tables uses the canonical `UserCell` (avatar + name + email + inline DEMO badge driven by data flag).
- **Type-scale hierarchy enforced** — `SectionTitle--page` (28px) modifier for page-level titles inside cards, so page H1 outranks card section titles.
- **Tab spacing fixed** — 16px below the tab strip platform-wide (was stacking to 40px).

---

## Questions?

The doc is comprehensive but not infinite. If you hit a pattern or convention that isn't covered, the right move is to ask before improvising — that's the rule the prototype followed, and it's the rule the doc itself documents. Send questions to whoever owns this handoff on the Homium side.
