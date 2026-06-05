---

description: Use this when implementing, modifying, reviewing, or integrating changes into the working Homium front-end mockup, especially when translating PRDs, wireframes, strategy docs, Figma/dev-team designs, or reviewed design differences into the existing mockup while preserving the established brand canon and minimizing token usage.
argument-hint: "[mockup screen/module/change request]"
------------------------------------------------------

# Mockup Implementation Skill

## Purpose

Use this skill when working on the Homium front-end mockup.

This includes:

* implementing a new module into the working mockup
* modifying an existing mockup screen
* integrating a PRD, wireframe, or strategy doc into the front-end mockup
* reviewing differences between the user’s mockup and dev/Figma work
* updating a specific module based on design feedback
* aligning mockup implementation with the existing brand canon
* adding static/example data for prototype purposes
* preserving the current working mockup while continuing to build new features

The goal is to efficiently integrate product/workflow content into the existing mockup system without introducing unnecessary design drift, file reads, architecture churn, or token waste.

## Core Principle

Mockup implementation is a constrained integration task.

Do not treat every implementation request as a new design exploration.

Use PRDs, wireframes, strategy docs, and dev-team/Figma materials as sources for:

* content
* workflow
* screen structure
* required states
* required data
* user actions
* product logic
* module relationships

Do not automatically copy their visual design if it conflicts with the existing Homium mockup system or brand canon.

The final implementation should conform to the existing mockup foundations unless the user explicitly asks to redesign those foundations.

## Token Efficiency Rules

Be extremely conservative with file reads.

Before reading files, provide a context budget.

The context budget must include:

| Category             | Required Output                                                      |
| -------------------- | -------------------------------------------------------------------- |
| Target module/screen | Exact area being modified                                            |
| Requested change     | What needs to be implemented or reviewed                             |
| Likely files         | Smallest set of files likely needed                                  |
| Max initial reads    | Usually 3–5 files                                                    |
| Search terms         | Terms to locate target files before reading                          |
| Files to avoid       | Unrelated modules, assets, generated files, full docs, broad folders |
| Stop condition       | When enough context exists to make the next safe edit                |

Do not read the entire repository.

Do not read all docs.

Do not read all mockups.

Do not read large assets.

Do not inspect unrelated modules unless there is a specific dependency.

Use targeted search before file reads.

If more files are needed, pause and explain why before reading them.

## Brand Canon Rule

Follow the established Homium design canon for mockup implementation.

The brand canon controls:

* layout foundations
* page structure
* typography
* color usage
* spacing
* buttons
* cards
* tables
* tabs
* status badges
* navigation
* modal patterns
* form patterns
* density
* visual hierarchy

Before introducing new visual patterns, check whether an existing pattern already solves the need.

Do not introduce new:

* color systems
* spacing systems
* button shapes
* card styles
* table structures
* typography scales
* navigation schemas
* layout schemas
* arbitrary shadows, borders, or radii

unless explicitly requested.

If a PRD or wireframe uses different design conventions, treat it as a structural/content reference, not the final visual design.

## Design Canon Sources

Use design canon sources only when needed.

Likely sources:

* `homium-design-canon/DESIGN_CANON.md`
* `homium-design-canon/DECISIONS.md`
* `homium-design-canon/MIGRATION.md`
* `homium-design-canon/tokens.css`
* `.claude/rules/brand-canon.md`

Do not read all design canon files by default.

Preferred approach:

1. First inspect the existing implemented screen/module pattern.
2. If visual uncertainty remains, inspect the relevant design canon file.
3. If token values are needed, inspect `tokens.css`.
4. Do not invent design rules when canon exists.

## Implementation Hierarchy

When integrating a wireframe, PRD, or dev-team design into the working mockup, follow this hierarchy:

1. Existing working mockup architecture
2. Existing mockup layout/component patterns
3. Homium design canon
4. Module-specific PRD/workflow requirements
5. Wireframe content/structure
6. Dev/Figma deltas
7. New design invention only if unavoidable and explicitly labeled

This means the mockup should preserve the established system first, while incorporating the new module logic and content.

## Common Use Cases

### Use Case 1 — Implementing a New Module

When adding a new module:

* identify where it belongs in navigation
* inspect the nearest existing module pattern
* reuse existing layout and component conventions
* add only required new static data
* keep implementation scoped to the module
* avoid global refactors unless necessary
* summarize new files and modified files

### Use Case 2 — Updating an Existing Screen

When updating an existing screen:

* find the target file first
* inspect only the target file and directly related style/routing files
* identify existing patterns in that screen
* apply the smallest viable change
* avoid unrelated cleanup
* preserve current working behavior

### Use Case 3 — Integrating PRD / Wireframe Content

When integrating a PRD or wireframe:

* extract only implementation-relevant content
* identify required screens, tabs, tables, states, and CTAs
* map those requirements onto existing mockup patterns
* ignore visual styling from the PRD/wireframe unless explicitly approved
* implement as static/mock data unless functionality is explicitly requested
* flag anything that requires backend/API work as future implementation note

### Use Case 4 — Comparing Dev/Figma Work to User Mockup

When reviewing dev/Figma differences:

* identify the exact screen/module being compared
* compare structure, content, actions, and state logic first
* compare visual design only against the brand canon
* distinguish intentional improvements from design drift
* produce a concise delta list:

  * keep
  * modify
  * reject
  * needs decision
* implement only approved deltas

### Use Case 5 — Continuing Feature Build from Prior Work

When continuing a partially implemented feature:

* first inspect the existing module entry point
* summarize current state before editing
* identify the smallest next batch
* do not restart discovery from scratch
* avoid re-reading broad docs already summarized unless needed

## Required Workflow When Invoked

### 1. Restate the Implementation Target

Identify:

* target module
* target screen or route
* requested change
* source material being integrated
* expected output
* whether this is review, implementation, cleanup, or comparison

### 2. Define Scope

State:

* in scope
* out of scope
* files likely affected
* files that should not be touched
* whether this is static mockup work or functional implementation

Do not expand scope silently.

### 3. Create Context Budget

Before reading files, produce:

| Category          | Required Output                                        |
| ----------------- | ------------------------------------------------------ |
| Target files      | Likely files to inspect                                |
| Max initial reads | Usually 3–5                                            |
| Search first      | Yes                                                    |
| Search terms      | Exact module/screen names                              |
| Avoid             | Unrelated modules, assets, generated files, broad docs |
| Stop condition    | Enough context to propose edit plan                    |

### 4. Inspect Existing Mockup Pattern

Before editing, determine:

* current route/page structure
* current component/layout pattern
* current table/card/button conventions
* current status badge conventions
* current data/mock-data approach
* current navigation pattern
* relevant style file if needed

Prefer reusing what already exists.

### 5. Map Source Material to Existing System

If using a PRD/wireframe/Figma/dev-team design, create a mapping:

| Source requirement | Existing mockup pattern to use | Implementation note |
| ------------------ | ------------------------------ | ------------------- |

This prevents blindly copying off-canon wireframe layouts.

### 6. Produce Edit Plan

Before editing, state:

* files to edit
* changes by file
* expected visible result
* risks
* what will not be changed

Keep the first edit batch small.

### 7. Implement in Batches

Suggested batches:

#### Batch 1 — Structure

* route
* page shell
* navigation entry
* tabs
* high-level layout

#### Batch 2 — Content and Static Data

* table columns
* cards
* example records
* empty states
* labels
* action buttons

#### Batch 3 — State and Interaction Mockups

* status badges
* disabled/enabled button states
* modals
* drawer states
* notification states
* warnings/errors

#### Batch 4 — Brand Canon Alignment

* spacing
* visual hierarchy
* component consistency
* token usage
* table/card consistency
* button consistency

#### Batch 5 — Validation and Handoff

* summarize files changed
* list assumptions
* list unimplemented functionality
* identify next smallest step

Do not combine all batches unless the change is very small.

### 8. Preserve Existing Working Mockup

Avoid:

* unnecessary file moves
* broad refactors
* global style rewrites
* replacing existing components wholesale
* changing unrelated routes
* changing existing nav structure unless needed
* breaking current mockup links
* adding new design systems inside a feature file

If a cleanup is useful but not required, propose it separately.

## Static Mockup vs Functional Implementation

Default assumption: this repo is a front-end mockup/prototype unless the user says otherwise.

For mockup implementation:

* static data is acceptable
* fake records are acceptable
* non-working buttons are acceptable only if clearly part of prototype
* disabled states should be visually represented
* future API/backend dependencies should be documented
* do not overbuild real logic unless requested

When adding mock data:

* make it realistic
* keep it small
* avoid excessive rows
* use examples that demonstrate key states
* include edge cases only if useful for visual review

## Button and Interaction Rules

For each important action, clarify whether it is:

* visible and enabled
* visible and disabled
* hidden
* mock-only
* future functional
* permission-gated

Important buttons should not appear enabled if the prototype cannot represent the required state safely.

For permission-sensitive actions, include tooltip/subtext explaining why disabled when applicable.

## Table and Dashboard Rules

When implementing tables:

* use existing table conventions
* keep columns purposeful
* avoid overloading with unnecessary fields
* prioritize status, next action, owner, amount, date, and exception states where relevant
* include filters only if they support the workflow
* use default sort that surfaces action-needed items first
* avoid adding search/filter complexity unless needed for the mockup

When implementing dashboards:

* use summary cards sparingly
* prioritize operational clarity
* avoid vanity metrics
* show action-needed counts when relevant
* keep drilldown path obvious

## Status and State Rules

When representing statuses:

* use canonical statuses from PRD/spec if available
* map technical statuses to user-facing labels when needed
* avoid inventing extra statuses
* include disabled/error/empty states where relevant
* status badges should follow existing badge style

If lifecycle logic is unclear, flag it before implementing.

## Permission and RBAC Integration

When a mockup change involves permissions:

* use `/rbac-permissions` if the permission model is non-trivial
* do not invent permissions
* do not expose screens/actions to user groups that should not see them
* identify which platform user group sees the screen
* identify role/permission gates for important CTAs
* show disabled state if an action exists but user lacks permission
* preserve audit implications for sensitive actions

## Module-Specific Skill Interaction

Use other skills when needed:

* Use `/feature-planning` for broad feature/module planning.
* Use `/prd-builder` for PRDs, addenda, screen specs, and requirements review.
* Use `/token-ops-module` for activations, wallets, batching, issuance, residuals, and source-of-funds workflows.
* Use `/rbac-permissions` for RBAC, LOC permissions, platform operator permissions, access gates, impersonation, and audit-sensitive permission design.

Do not load other skills or docs unless they are actually needed for the requested implementation.

## No Scope Creep Rule

Do not add:

* new modules
* new data fields
* new permissions
* new lifecycle states
* new visual systems
* new navigation structures
* new backend assumptions
* new privacy/compliance rules
* new user flows

unless explicitly requested or clearly labeled as proposed.

If something seems useful but was not requested, list it under “Proposed future improvement” instead of implementing it.

## Required Output Format

When invoked, respond using:

1. Target module/screen
2. Requested change
3. Source material being integrated
4. In scope / out of scope
5. Context budget
6. Existing pattern to reuse
7. Brand canon considerations
8. Edit plan
9. Batch plan
10. Risks / assumptions
11. Next smallest useful step

After implementation, summarize:

1. Files searched
2. Files read
3. Files changed
4. What changed
5. What was intentionally not changed
6. Brand canon alignment notes
7. Any unresolved questions
8. Recommended next step

## Completion Checklist

Before finishing, confirm:

* target scope stayed narrow
* unnecessary files were not read
* existing mockup patterns were reused
* brand canon was followed
* source material was translated into existing visual system
* no unsupported visual language was introduced
* no unrelated files were modified
* static/mock behavior is clear
* assumptions are listed
* next step is small and actionable

