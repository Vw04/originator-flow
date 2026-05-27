# Decisions Log — 2026-05-26 Canon Review

This document records every decision made in the design review session on 2026-05-26. It covers what the 2026-05-19 dev team handoff recommended, what was decided, and why. It also documents items tabled for later alignment.

Use this document to understand the rationale behind the canon overrides. Do not use it as an implementation guide — `CLAUDE.md` is the implementation guide.

---

## Decision 1 — Navigation Architecture

**Audit section:** §01 Remaining conflict / §06 Sidenav scope  
**Prior audit status:** Open critical conflict  
**Decision: Keep ours — 92px fixed left icon rail**

### What the kit recommended
Top NavBar: teal-900 bg, 56px inner height, sticky top. Logo + nav items left; user dropdown right. Side nav 220px only for detail pages.

### What we decided
Left icon rail is the global navigation. 92px fixed, full viewport height, always present. This is locked. The kit's top-nav spec is not adopted.

### Rationale
The left rail is our existing shipped pattern. It handles deep sub-routing better than a top nav for a platform with many sections. We have more destinations than a top nav accommodates comfortably without a "More" overflow.

### Sidenav clarification
The kit's 220px detail-page sidenav is **additive**, not a conflict. When a detail page has deep sub-routes, the 220px sub-nav can appear to the right of the rail. They coexist. The sub-nav is not global — it mounts/unmounts with the detail page.

Setup pages specifically: no in-page sidebar. The left rail + flyout handles section navigation.

---

## Decision 2 — Behavioral Contract (Working Agreement)

**Audit section:** §02 Working Agreement  
**Decision: Adopt as-is**

The behavioral contract from the 2026-05-19 handoff is adopted verbatim. No changes. This covers: describe-before-tweaking, reuse-over-invent, surface-options, stop-and-ask rules.

---

## Decision 3a — Heading Font

**Audit section:** §03 Heading font / §05 Typography  
**Prior audit status:** "Negotiate" (IvyPresto vs Source Serif 4)  
**Decision: IvyPresto Display 300 — keep ours**

### What the kit recommended
Source Serif 4, weight 400 (Regular). Google Fonts, open-source, native lining figures. Chose it to drop the `HeadingNumFix` @font-face workaround.

### What we decided
IvyPresto Display, weight 300 (Light) — for all heading contexts and display-scale numerals.

### Rationale
We hold the IvyPresto Display license. IvyPresto 300 produces a distinctly more refined, lightweight elegance that aligns with our institutional positioning. The "300 vs 400" weight difference is material at display scale — 300 reads as editorial and premium; 400 reads more utilitarian. The lining figures issue that drove the kit to Source Serif 4 can be addressed with OpenType feature settings (`'lnum' 1`) rather than a font swap.

### Implementation note
When reading the prototype, translate `Source Serif 4 / 400` → `IvyPresto Display / 300`. CSS token: `--font-heading: 'IvyPresto Display', Georgia, 'Times New Roman', serif;`

---

## Decision 3b — Numerals

**Audit section:** §05 Typography  
**Decision: IvyPresto Display 300 for display numerals (strongly encouraged)**

### What was decided
KPI values, entity counts, and display-scale financial figures use IvyPresto Display 300. Dense tabular data in table bodies stays Inter 700 with tabular feature settings.

### Rationale
Display-scale numbers (36px KPI values, entity header amounts) appear in heading context. Using IvyPresto there keeps large numbers visually unified with their surrounding heading copy. Tabular data (13–14px in table cells) stays Inter — Inter's tabular-nums and lining-nums handle column alignment perfectly at that size; IvyPresto at 13px would look unusual.

---

## Decision 3c — Branch Information Text

**Decision: Inter 600 (Semibold) 15px**

Branch-level informational text (branch names in cards, branch headers below entity title, compact branch identifiers) uses Inter Semibold 15px. This is a named canon rule: `branch-info-label → Inter 600 15px`.

---

## Decision 3d — Monospace (SF Mono retained)

**Audit section:** §05 Typography  
**Decision: Retain SF Mono for code/ID contexts**

The kit recommended deprecating monospace entirely (Inter tabular-nums handles column alignment). We retain SF Mono for:
- `Tag--code` (Loan IDs, MIN numbers, program codes like UDF, DCDF)
- Dev widget display

Rationale: The `Tag--code` visual distinction (monospace chip) communicates "this is a technical identifier" — not just numeric alignment. SF Mono in that context carries semantic meaning the dev widget and code chips benefit from.

---

## Decision 4 — Token Drift / Color Tokens

**Audit section:** §04 Color discrepancies  
**Decision: Align to brand kit, remove purple**

| Token | Action | From | To |
|-------|--------|------|----|
| `--color-success` | Confirm canonical | `#1A8754` | `#1A8754` (was already correct) |
| `--color-warning` | Confirm canonical | `#B8860B` | `#B8860B` (was already correct) |
| `--color-info` | Confirm canonical | `#1A6E8E` | `#1A6E8E` (was already correct) |
| `--color-purple` | **Remove** | `#7C3AED` | *(removed)* |
| `--color-success-strong` | Defer | absent | `#117A47` (add only when hover state is built) |

All three semantic tokens were already correct in our live implementation. No code changes needed — canon confirmation only.

Purple: removed from `homium-design-tokens.json`. Search for any `var(--color-purple)` or `#7C3AED` in code before deleting the CSS variable — if any references found, resolve them first.

---

## Decision 5 — Modal Primitive

**Audit section:** §03 Modal primitive  
**Decision: Adopt — use existing single shared modal primitive**

One shared `<div class="Modal" id="...">` at end of `<body>`. API: `openModal(id, { onConfirm, onDismiss })` / `closeModal()`. Tab trapped while open. Generic — reuse for any destructive-confirm flow.

---

## Decision 6 — PermissionsMatrix Access Display

**Audit section:** §03 PermissionsMatrix dot vocabulary  
**Decision: Binary on/off OR explicit text labels — no dot vocabulary**

### What the kit recommended
Four-state dot vocabulary: hollow ring (No access) · filled gray (View only) · filled blue (Can edit) · filled green (Full access). Communicated via colored leading dots inside the dropdown. HelpTooltip legend mirrors it.

### What we decided
The dot vocabulary is not adopted. Instead:
- **Option A (binary):** Filled blue (selected/active) vs empty (unselected/off). Simple on/off toggle.
- **Option B (explicit text):** "View" and "Edit" as text labels in the access level column. Use when more than two states are needed.

### Rationale
Users will not interact with the permissions matrix frequently enough to internalize a four-state visual vocabulary. "View" and "Edit" are self-documenting. A HelpTooltip is still available if context is needed, but it references text labels rather than dot icons. The four-state dot system is appropriate for products with frequent high-volume RBAC management (like Notion or Linear workspace admins); for our use case, explicit text is clearer.

### Implementation note
No `platform-rbac.js` changes in this pass — canon note only. When the matrix is built or refactored, use Option B (explicit text) as the default unless the binary toggle is sufficient for the specific context.

---

## Decision 7 — Save / Cancel Patterns

**Audit section:** §03 Form-page navigation / §06 Save bar  
**Prior status:** Tabled — pending Soren alignment  
**Decision: Four distinct patterns codified — 2026-05-27**

### What was previously stated

The 2026-05-19 canon said "Save only — no Cancel button." This was too absolute and did not match the live product. The item was tabled pending behavioral alignment.

### What we decided (from live product screenshots)

Four patterns exist. Each applies to a specific context. They do not substitute for each other.

**Pattern A — Wizard / origination flow**
Bottom sticky bar: `← See All Applications` | AutoSave indicator | `Save & Exit` | `Previous` | `Continue →`. No Cancel. AutoSave removes the need for a cancel/discard choice. Dirty-form modal does NOT fire in wizard flows.

**Pattern B — Inline entity edit (header card)**
Save/discard affordances live inside the detail header card.
- Clean state: "Save changes" visible but disabled. "Discard" hidden.
- Dirty state: "Discard" (ghost, appears) + "Save changes" (primary, activates).
- Discard click = explicit intent → no modal, immediate revert.
- Unintentional nav-away while dirty → dirty-form modal fires.

**Pattern C — Tab-level commit (e.g. Permissions tab)**
"Save changes" alone, bottom-right. No Cancel.
- User edits permission settings across the tab, then commits all at once.
- If user navigates away (different tab, left rail, browser back) while dirty → dirty-form modal fires.

**Pattern D — Full-page edit form (e.g. Edit Company)**
"Cancel" + "Save changes" in bottom bar.
- Cancel = explicit intent → navigates back to parent, no modal.
- Unintentional nav-away while dirty → dirty-form modal fires.

### Dirty-form modal — when it fires vs. when it does not

| Trigger | Fires? |
|---|---|
| Explicit Cancel click (Pattern D) | ❌ No — intentional exit |
| Explicit Discard click (Pattern B) | ❌ No — intentional exit |
| Left rail click while dirty | ✅ Yes |
| Tab click while dirty | ✅ Yes |
| BackToMain click while dirty | ✅ Yes |
| Browser back while dirty | ✅ Yes |
| Page reload / tab close | ✅ Yes (browser-native `beforeunload`) |
| Save button click | ❌ No — commits cleanly |

### Terminology

- "Discard" = Pattern B (inline edit in header) — discarding in-progress field changes
- "Cancel" = Pattern D (full-page edit form) — canceling the edit operation and returning to parent
- Consistent: both are explicit exits that require no confirmation modal

### Why not one universal pattern?

The four patterns map to genuinely different user mental models:
- Wizard flows are step-by-step journeys with directional navigation — Previous/Continue are the primary affordances
- Inline editing (Pattern B) happens in context, on the entity's own page — the header card is the natural home for save/discard
- Tab commits (Pattern C) accumulate changes across a configuration view — save happens at the tab level
- Full-page edit forms (Pattern D) are distinct pages the user navigated to — Cancel returns them to where they came from, consistent with every other SaaS edit page

Forcing all four into "Save only, no Cancel" would have removed Cancel from full-page edit forms, which is a real usability regression.

---

## Decision 8 — Role Pills

**Audit section:** §03 Role pill convention  
**Decision: Moot for now — future is free-entry tag field**

The kit's role pill convention (full names, sentence case, uniform appearance) is noted. However, role pills are moot for the current implementation phase.

Future direction: introduce free-entry tagging behavior — users type a role; a tag is created from the input value. No predefined vocabulary, no enforced pill style until that feature is scoped.

---

## Decision 9 — Sidenav Scope (Left Rail)

**Audit section:** §06 Sidenav scope  
**Decision: Left icon rail is THE nav — additive sub-nav for detail sub-routes**

The kit's "sidenav scope" item referred to the 220px white card sidenav for detail pages. Since we keep the left rail globally, this becomes additive rather than a conflict. See Decision 1.

---

## Decision 10 — Net-New Concepts (Adopt / Defer)

**Audit section:** §07 Net-new concepts  
**Decisions:**

| Pattern | Decision |
|---|---|
| Data viz palette | **Adopt when first chart is built** |
| Chart tooltip | **Adopt with first chart** |
| Dim-siblings hover | **Adopt with first chart** |
| Tabler Icons (1.5px stroke) | **Adopt immediately** — audit existing inline SVGs |
| Spacing scale tokens | **Adopt** — `--h-space-2` through `--h-space-64` in `:root` |
| Shape vocabulary | **Adopt as audit lens** |
| Surface hierarchy | **Adopt incrementally** as views are refactored |
| Dark mode | **Defer — Phase 3** — spec captured in canon, no implementation |

---

## Tabled Items (Require Further Alignment)

### T1 — Cancel Button + Dirty-Form Modal ✅ RESOLVED (2026-05-27)

**Was:** Blocked pending Soren alignment.  
**Resolved:** Four-pattern save/cancel model codified. See Decision 7 above for full spec. Key confirmations from review:
- Discard button in Pattern B (inline edit) is hidden until dirty, appears only when form has changes
- Cancel button in Pattern D does NOT trigger the dirty-form modal — it is an explicit intentional exit
- Dirty-form modal fires on tab-away from Pattern C (Permissions tab) when changes are unsaved

**No further alignment needed on this item.** FE mockup blocker is cleared.

### T2 — User Type Avatar Colors

**Status: Backlog ticket — not implemented**

Specification:
- Platform operators → gold avatar background
- Investors → green avatar background
- Loan origination users → blue avatar background

Current state: all avatars use `teal-50` / `teal-500`.

When ready: add role-based class or data attribute to `.avatar`; map to token-backed background colors. Colors need to be added to the token set before implementation.

### T3 — Form-Page Navigation for Origination State

**Status: Backlog ticket — evaluate when origination form UX is designed**

The sticky BackToMain + save-only bar pattern works well for the application flow. For the origination state, the pattern needs evaluation — not as clearly appropriate. Determine what makes sense for origination-specific forms before applying the application flow pattern there.

### T4 — FE Mockup for Soren

**Status: In progress — do not ship until T1 is resolved**

Goal: Updated FE mockup to share with Soren — specifically the Branch Details page and the impersonation flow.

Prerequisites:
- Cancel button / dirty-form modal alignment complete (T1)
- Branch Details page updated with IvyPresto headings, corrected semantic tokens, save-only action bar, BackToMain sticky link
- Impersonation flow: modal-based (shared primitive), correct role display (explicit text, no dot vocab)

---

## Reference: What Remained Unchanged

The following items from the 2026-05-19 handoff are adopted without modification:

- Primary CTA color: `#00334A` navy — already aligned
- Table-row hover: 3px navy left border — already aligned
- Focus ring: 2px navy — already aligned
- All stone/warm-gray/sand/pearl/bg neutrals — already aligned
- Card border-radius (8px), card padding (24px) — already aligned
- Shape vocabulary (pill/rounded-rect/card/modal/circle/bar-top) — adopted
- Spacing scale tokens — adopted
- Tabler Icons (1.5px stroke) — adopted
- Behavioral working agreement — adopted
- Single modal primitive — adopted
- Save-only action bar — confirmed canonical
- BackToMain navigation pattern — confirmed canonical
- No breadcrumbs — confirmed
- Flat cards (no drop shadows) — already aligned
- Input heights (32px compact, 40px wizard) — already aligned
- TableToolbar progressive disclosure — adopted
- Surface hierarchy (bg → white → sand → white → zebra) — adopted
- Tab spacing 16px below strip — adopted
