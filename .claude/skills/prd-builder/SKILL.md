---

description: Use this when creating, editing, reviewing, or distilling PRDs, product briefs, screen specs, strategy docs, implementation plans, addenda, engineering handoff docs, or requirements from messy notes/conversations. Prioritizes concise structure, explicit assumptions, no scope creep, P0/P1/P2 prioritization, and implementation-ready outputs.
argument-hint: "[product/module/workflow/document name]"
--------------------------------------------------------

# PRD Builder Skill

## Purpose

Use this skill to create, revise, review, or distill product requirements documents and related product planning materials.

This skill is especially useful for:

* PRDs
* product briefs
* strategy docs
* screen specs
* engineering handoff docs
* implementation plans
* feature addenda
* workflow specifications
* requirements extracted from conversations, screenshots, Teams chats, emails, or rough notes
* converting product/business context into structured build-ready documentation

The goal is to turn complex, messy operating context into clear, decision-useful product documentation without adding unsupported scope.

## Operating Principles

* Be concise, structured, and practical.
* Separate facts from assumptions.
* Do not silently convert assumptions into requirements.
* Do not add features, fields, views, permissions, compliance rules, or workflows unless explicitly stated or strongly implied.
* When uncertain, label the item as a working assumption or flagged question.
* Optimize for business clarity, operational usefulness, and engineering handoff.
* Preserve the user’s intended scope.
* Prefer MVP-first thinking with clear future-state expansion paths.
* Tie requirements to business, operational, compliance, audit, or user-value rationale.
* Use tables, checklists, and structured sections when helpful.
* Always distinguish between Vincent as the Claude Code user and the actual Homium platform users.
* When writing PRDs, define platform user personas explicitly before describing requirements.
* Do not assume the same UX depth, language, or complexity tolerance across originator, investor, and Homium operator users.


## Claude User Context

The person using Claude Code is Vincent, an operator at an early-stage fintech / proptech startup focused on housing finance and shared-appreciation mortgage products.

Vincent’s background is in finance, capital markets, strategy, and operations. He is moving deeper into product management, implementation, and systems/process design.

Vincent is technical-curious but not a full-time software engineer.

When helping Vincent:

* Prioritize clarity, structure, and actionable outputs.
* Default to step-by-step guidance when setting up tools, workflows, files, or implementation plans.
* Explain technical recommendations briefly, then provide the practical output.
* Avoid unnecessary jargon unless it adds precision.
* Assume Vincent is building materials for a seasoned internal team that understands advanced housing finance, mortgage, capital markets, and platform concepts.

## Platform User Context

Do not confuse Vincent, the Claude Code user, with the users of the Homium platform.

The Homium platform has three primary user groups.

### 1. Mortgage Origination Users

These are users at mortgage origination companies.

They may include:

* Loan Officers with NMLS IDs and required licensing
* Branch support staff
* Loan processors
* Operations/support staff who upload documents, check borrower status, troubleshoot issues, or support the first mortgage workflow

Design and product expectations:

* They are not expected to understand complex Homium mechanics.
* They care about what is next, what is required, and what they need to do.
* The experience should be blunt, intuitive, no-BS, and workflow-driven.
* Avoid exposing unnecessary capital markets, token, investor, or fund mechanics.
* Minimize cognitive load.
* Use plain labels, clear statuses, direct CTAs, and obvious next steps.
* Assume they want speed, certainty, borrower status visibility, and minimal disruption to their existing first mortgage process.

### 2. Investor Users

These are sophisticated finance, housing, and impact stakeholders.

They may include:

* housing finance agency employees
* CFOs
* lawyers
* tax accountants
* impact investors
* philanthropic investors
* nonprofit and foundation employees
* corporate executives and staff
* housing finance professionals
* capital markets professionals

Design and product expectations:

* They may understand finance, capital markets, mortgages, home prices, portfolio returns, risk, program performance, Case-Shiller indices, pool dynamics, diversification, shared appreciation mortgage structures, and impact investing.
* They need clarity, transparency, reporting, and confidence.
* They may need portfolio, program, activation, wallet, reporting, performance, impact, and fund/accounting visibility depending on module scope.
* They can handle sophisticated concepts, but the interface should still make required actions obvious.
* In action-heavy workflows, surface “attention needed” clearly.
* In reporting-heavy workflows, support drilldowns, definitions, assumptions, and exportable data where relevant.

### 3. Homium Platform Operator Users

These are internal Homium users who manage the platform.

They may handle:

* origination operations
* program management
* investor operations
* activations
* token operations
* accounting and reconciliation
* capital markets workflows
* impact reporting
* KYC/onboarding
* analytics
* user administration
* RBAC and permissions
* exceptions and support

Design and product expectations:

* These users can be trained and supported internally.
* The interface does not need to be oversimplified, but it must be efficient, logical, auditable, and operationally clear.
* Prioritize speed, control, visibility, exception handling, logs, and workflow accuracy.
* Complex mechanics can be exposed when useful, but they should be organized into clear operating flows.
* Internal workflows should support permissions, auditability, and scalable operations.


## Anti-Scope-Creep Rule

When reviewing raw context, classify items as:

| Classification     | Meaning                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| Confirmed          | Explicitly stated or already agreed                                                 |
| Working Assumption | Reasonable but not confirmed                                                        |
| Proposed           | Suggested improvement, not yet approved                                             |
| Flagged for Review | Requires decision from user, engineering, legal, compliance, finance, or leadership |
| Out of Scope       | Not part of current PRD/build                                                       |
| Future State       | Useful later, not required for MVP                                                  |

Do not add unconfirmed requirements as if they are final.

If a feature was not explicitly discussed, do not introduce it unless clearly labeled as a proposed option.

If privacy, compliance, data visibility, or user access is unclear, flag it instead of inventing a rule.

## Required Workflow

When invoked, follow this sequence.

### 1. Restate the Objective

Briefly state what document or product artifact is being created or reviewed.

Identify:

* module or feature name
* intended audience
* expected output
* current maturity level
* whether this is for discussion, mockup, engineering handoff, or implementation

### 2. Identify Source Context

Before drafting, identify the source material being used.

Examples:

* user-provided notes
* existing PRD
* screenshots
* mockup files
* repo docs
* design canon
* Teams/email/chat transcript
* prior decisions
* engineering constraints

If files must be read, create a context budget first.

### 3. Create a Context Budget

Before reading files, provide:

| Category          | Required Output                                              |
| ----------------- | ------------------------------------------------------------ |
| Objective         | What needs to be produced                                    |
| Likely files      | Which files/folders are probably needed                      |
| Max initial reads | Usually 3–7 files                                            |
| Search terms      | Terms to search before reading                               |
| Avoid reading     | Assets, unrelated mockups, generated files, broad folders    |
| Stop condition    | When enough context exists to draft or review the next batch |

Use search before broad reads.

Do not read the entire repo unless explicitly asked.

### 4. Distill the Context

Summarize the input into:

1. Confirmed facts
2. Decisions already made
3. Working assumptions
4. Open questions
5. Dependencies
6. Risks
7. Items that should remain out of scope

Do this before drafting if the context is messy or long.

### 5. Define Scope

Clearly define:

* In scope
* Out of scope
* MVP / P0 scope
* P1 enhancements
* P2 / future-state items

P0 means core minimum viable product and must-haves.

P1 means important but not blocking initial MVP.

P2 means future-state, ambitious, or later-phase work.

Do not overload P0.

### 6. Draft or Review the PRD

Use the standard PRD structure unless the user requests something else.

## Standard PRD Structure

### 1. Overview

Short description of the feature/module.

### 2. Problem Statement

What problem is being solved?

Include:

* current pain
* why it matters
* who experiences the pain
* what happens if not solved

### 3. Goals

Define what success looks like.

Goals should be measurable or observable where possible.

### 4. Non-Goals

Define what is explicitly not being solved in this version.

### 5. Users and Personas

Identify relevant user types.

For each user, include:

* what they need to accomplish
* what they should be able to see
* what they should be able to do
* what they should not be able to see or do

### 6. Current State

Describe the current workflow, limitation, or mockup behavior.

Separate:

* current product reality
* current mockup behavior
* current manual process
* current assumptions

### 7. Proposed Future State

Describe the target workflow.

Include:

* entry point
* core flow
* success path
* exception path
* approval/review steps
* downstream effects

### 8. User Flows

For each user flow, include:

* trigger
* actor
* preconditions
* steps
* result
* error states
* audit/logging implications, if relevant

### 9. Requirements

Separate requirements into:

#### Functional Requirements

What the system must do.

#### Data Requirements

What fields, statuses, or objects are needed.

#### Permission Requirements

Who can view, create, edit, approve, cancel, revoke, trigger, export, or impersonate.

#### Notification Requirements

What events create alerts, who receives them, and where the alert links.

#### Audit Requirements

What actions must be logged.

#### Reporting Requirements

What metrics, exports, or dashboards are required.

### 10. State Machine / Lifecycle

For workflow-heavy features, define:

* statuses
* valid transitions
* transition triggers
* required permissions
* downstream effects
* failure states

Do not leave lifecycle logic implicit.

### 11. Screen Specs

For each screen, define:

* purpose
* primary user
* default view
* table columns
* filters
* CTAs
* button states
* empty state
* error state
* validation rules
* permission gates
* audit links

### 12. Validation Rules

For each form or action, define:

* required fields
* invalid states
* warning states
* hard blocks
* override permissions
* reason/note requirements

### 13. Edge Cases

List operational, data, permission, and workflow edge cases.

### 14. Dependencies

Identify dependencies across:

* engineering
* design
* data model
* API/backend
* compliance/legal
* finance/accounting
* operations
* external vendors
* source systems

### 15. Risks and Guardrails

Include risks around:

* user confusion
* permissions
* data integrity
* auditability
* compliance
* operational breakage
* engineering ambiguity
* scope creep

### 16. Prioritization

Use:

| Priority | Requirement | Rationale                    |
| -------- | ----------- | ---------------------------- |
| P0       | Must-have   | Required for MVP to function |
| P1       | Should-have | Valuable but not blocking    |
| P2       | Later       | Future-state or advanced     |

### 17. Open Questions

Use a consolidated table.

Do not ask the same question multiple times.

| Question | Owner | Impact | Working Assumption |
| -------- | ----- | ------ | ------------------ |

### 18. Acceptance Criteria

Define what must be true for the feature to be considered complete.

### 19. Implementation Notes

Include engineering-relevant notes without overprescribing implementation details.

### 20. Handoff Checklist

Before finalizing, include:

* scope confirmed
* open questions listed
* assumptions labeled
* screen specs included
* permissions included
* validation included
* edge cases included
* dependencies listed
* P0/P1/P2 included
* unresolved items flagged

## Addendum Workflow

Use addenda when revising an existing PRD without rewriting the whole document.

Good addendum examples:

* Addendum A — State Machine and Lifecycle
* Addendum B — Screen Specs and Button States
* Addendum C — Permissions and RBAC
* Addendum D — Notifications and Work Queue
* Addendum E — Data Model and Validation
* Addendum F — Open Questions and Decisions Log

For addenda, use this structure:

1. Purpose of addendum
2. What changed
3. New or revised requirements
4. Impacted screens/workflows
5. Impacted data model
6. Impacted permissions
7. Open questions
8. Decisions needed

## PRD Review Workflow

When asked to review a PRD, do not merely summarize it.

Review it critically across:

1. Scope clarity
2. Problem definition
3. User/persona clarity
4. Workflow completeness
5. State machine completeness
6. Permission/RBAC clarity
7. Data model sufficiency
8. Screen spec readiness
9. Validation rules
10. Edge cases
11. Dependencies
12. Audit/compliance implications
13. Implementation ambiguity
14. Missing operational workflows
15. Scope creep

Output review sections as:

* What is solid
* What is incomplete
* What is missing
* Highest-risk gaps
* Recommended next pass

## Screen Spec Rules

When writing screen specs, include:

* default sort
* default filters
* visible columns
* hidden/disabled button logic
* role-based visibility
* empty states
* error states
* validation messages
* loading states if relevant
* links to related entities
* audit/history access if relevant

If screen behavior depends on lifecycle state, reference the state machine.

Do not invent new screens unless clearly identified as proposed.

## Permissions Rules

For any workflow involving permissions, define:

| Permission Area | Questions to Answer                            |
| --------------- | ---------------------------------------------- |
| Visibility      | Who can see it?                                |
| Creation        | Who can create it?                             |
| Editing         | Who can modify it?                             |
| Approval        | Who can approve/sign?                          |
| Cancellation    | Who can cancel?                                |
| Revocation      | Who can revoke?                                |
| Triggering      | Who can trigger irreversible/external actions? |
| Exporting       | Who can export/download?                       |
| Impersonation   | Is it allowed, blocked, or future-state?       |
| Audit           | What gets logged?                              |

Never assume a user can see or act on something just because they are authenticated.

## Output Style

Use concise, structured writing.

Prefer:

* tables
* numbered flows
* bullet lists
* explicit assumptions
* decision logs
* acceptance criteria
* short executive summaries

Avoid:

* overlong narrative prose
* vague words like “seamless” without defining behavior
* unsupported product claims
* invented compliance requirements
* invented data fields
* hidden assumptions

## Completion Checklist

Before finishing any PRD or review, confirm:

* objective addressed
* confirmed facts separated from assumptions
* scope boundaries stated
* P0/P1/P2 included if relevant
* user flows included
* permission model considered
* state/lifecycle logic considered
* screen specs considered
* validation/error states considered
* audit/compliance considered
* open questions consolidated
* next step recommended

## Default Response Format

When invoked, respond with:

1. Objective
2. Source context
3. Confirmed facts
4. Working assumptions
5. Scope boundaries
6. Recommended PRD structure or review plan
7. Key risks / missing decisions
8. Next smallest useful step

If the user asks for the actual PRD, then produce the PRD using the standard PRD structure.

