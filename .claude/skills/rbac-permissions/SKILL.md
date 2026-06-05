---

description: Use this when planning, designing, reviewing, documenting, or implementing Homium RBAC and permissions for the Platform Operator layer or Loan Origination Company layer, including user types, access levels, permission matrices, Grant-All inheritance, per-entity overrides, LOC branch/LO permissions, enablement gates, NMLS/license gates, impersonation, audit logs, permission-driven UI behavior, and acceptance scenarios.
argument-hint: "[RBAC workflow, permission surface, user type, screen, or access question]"
-------------------------------------------------------------------------------------------

# RBAC Permissions Skill

## Purpose

Use this skill for Homium RBAC and permissions work related to:

* Platform Operator permissions
* Loan Origination Company permissions
* user types
* access levels
* permission subflags
* Grant-All / future-grant inheritance
* per-entity overrides
* Branch / LO permission matrices
* Branch Manager flags
* Program Manager OC-admin behavior
* enablement gates
* NMLS/license gates
* application lifecycle permission gates
* impersonation
* audit logs
* export permissions
* permission-driven UI behavior
* RBAC implementation specs
* RBAC acceptance scenarios

The goal is to preserve the canonical RBAC model and prevent inconsistent, unsafe, or casually invented permission behavior.

## Out of Scope for This Skill

Do not use this skill for investor-user permission design.

Investor-specific roles, investor dashboards, investor portfolio views, investor activation views, investor reporting permissions, and investor-specific access models should be handled in a separate module and separate skill file.

If investor-specific permissions appear in source documents, do not expand on them here. Flag them as out of scope for this skill.

## Source-of-Truth Hierarchy

When working in this project, use the RBAC source material in this order:

1. `RBAC Final Requirements.md`

   * Primary source for Homium V2 RBAC implementation scope.
   * Use for final naming, implementation framing, build sequencing, V2 scope, Figma alignment, cross-cutting requirements, and acceptance framing.
   * If there is explicit disagreement between documents, follow `RBAC Final Requirements.md`.

2. `RBAC_Permissions_Spec_v2_0.md`

   * Use for detailed mechanics where `RBAC Final Requirements.md` is silent, incomplete, or placeholder-only.
   * Use for Platform Operator mechanics, LOC mechanics, Grant-All / per-entity override behavior, LOC scenario matrix, data model details, and permission invariants.

If both docs are silent, do not invent behavior. Mark the item as an open question or proposed option.

If the docs conflict:

1. Follow `RBAC Final Requirements.md`.
2. Note the conflict explicitly.
3. Do not silently merge incompatible mechanics.

## Critical Distinction

Do not confuse Vincent, the Claude Code user, with the users of the Homium platform.

Vincent is using Claude Code to design, document, and implement the project.

This skill focuses on these Homium platform user groups:

1. Homium Platform Operator users
2. Mortgage Origination Company / LOC users

## Platform User Groups

### 1. Homium Platform Operator Users

These are internal Homium users who manage the platform.

They may manage:

* platform settings
* origination companies
* loan programs
* funds
* originations
* underwriting approvals
* clear to close
* user administration
* enablement
* impersonation
* audit logs
* exports
* operational exceptions

Design expectations:

* efficient
* auditable
* permissioned
* operationally clear
* capable of exposing complexity when needed
* optimized for control, exceptions, logs, and scalable operations

RBAC expectations:

* governed by Platform Operator layer
* user type establishes capability floor
* per-object and per-entity overrides apply on top
* Grant-All / future-grant inheritance must be preserved
* View-only users cannot be assigned edit/full behavior
* at least one Admin must remain active at all times

### 2. Mortgage Origination Company / LOC Users

These are external users at mortgage origination companies.

They may include:

* licensed Loan Officers with NMLS IDs
* branch support staff
* loan processors
* branch managers
* Program Managers / OC-admin users
* other support users who upload documents, check borrower status, troubleshoot, or support loan workflows

Design expectations:

* blunt
* intuitive
* task-oriented
* minimal cognitive load
* clear next action
* no unnecessary capital markets, fund, or internal Homium mechanics

RBAC expectations:

* governed by LOC layer
* access depends on Branch assignment, User Type, Branch flags, LO assignment, permission level, subflags, enablement, and license status
* originating a new application requires the relevant access gate to pass
* Loan Officers and support users may have different permission structures
* Standard Users can hold meaningful permissions but cannot be LO of record

## Architecture Mental Model

Homium RBAC has two primary authorization surfaces for this skill.

### Platform Operator Layer

Internal Homium users managing the platform.

Core user types:

* Admin
* Member
* View-only

Core permission surfaces:

* Platform Settings
* Origination Companies
* Loan Programs
* Funds

Core mechanics:

* User Type establishes a permission floor.
* Permissions are configured across independent dimensions.
* Grant-All row sets default access for current and future entities.
* Per-entity overrides can narrow or expand access where allowed.
* Inactive entities disable permission controls but preserve configured values.
* At least one Admin must exist at all times.
* View-only users are capped at read-only behavior.

### LOC Layer

External origination companies, branches, loan officers, processors, and support staff.

Core structures:

* Origination Company
* Branch
* User
* Application / Loan
* Market
* Loan Program
* LoanProgram-Market enablement

Core role concepts:

* Program Manager as OC-admin role
* Loan Officer as license-bearing branch user type
* Standard User as default non-LO branch user type
* Branch Manager as a flag, not a user type

Core mechanics:

* Branch assignment is required.
* User Type may vary by Branch.
* Branch Manager has minimum View Only floor on all applications under the Branch.
* LO always has Full Access to their own applications.
* Application is tied to exactly one LO and one Branch for life.
* Application is non-transferrable.
* Application delete is generally unsupported unless explicitly scoped otherwise.

## Core RBAC Primitives

Always reason using these primitives.

### Access Levels

Standard access levels:

* No Access
* View Only
* Can Edit
* Full Access

Use shorter scales only where the canonical source documents define them.

### Subflags

Subflags apply to Can Edit where relevant:

* Can Create
* Can Submit
* Can Withdraw

Full Access generally means Can Edit plus all applicable subflags are true, unless the source documents specify otherwise.

### User Type Floor

A user’s type establishes the allowed access envelope.

For Platform Operator users:

* Admin can hold Full Access, Edit, or View permissions on allowed objects.
* Member can be configured per object up to allowed maximums.
* View-only is capped at read-only behavior.

### Future Grants / Grant-All Pattern

Entity permission tabs may include a Grant-All row.

The Grant-All row:

* applies to all current entities
* applies to future entities
* acts as the default inherited value
* can be overridden per entity
* should be visually distinct in UI
* should not be confused with a one-time bulk edit

Per-entity override:

* explicit row-level value replaces inherited value
* revert restores inheritance
* inherited values should be visually distinguishable from explicit values
* raw nulls should never be shown to users

### System-Enforced Invariants

Preserve these invariants unless the user explicitly revises them:

* Last Admin cannot be demoted or deactivated.
* View-only users cannot receive edit/full controls.
* Inactive entities disable permission controls.
* LO always has Full Access to their own applications.
* Branch Manager always has at least View Only on all Branch applications.
* Application owner LO and Branch do not change over the life of the application.
* No normal application delete flow.

## Platform Operator Permission Dimensions

When working on Platform Operator RBAC, check these dimensions.

### Platform Settings

Settings may include:

* Manage Origination Companies
* Manage Platform Settings
* other global platform configuration explicitly defined in source docs

### Origination Companies

Permissions may include:

* Settings Access
* Impersonate

### Loan Programs

Permissions may include:

* Origination Access / Manage Originations
* Underwriting Approvals
* Clear to Close
* status override / manual backtrack if explicitly scoped
* archive/delete only if explicitly scoped

### Funds

Permissions may include:

* Activation Access
* Fund Admin Approve
* Approve Minting
* Fund Updates
* On-chain Update

Do not assume these permissions are interchangeable. Each dimension controls a different operational surface.

## LOC Permission Model

When working on LOC RBAC, reason through the full permission tuple.

Complete LOC permission profile:

```text
[OC-Admin Role] + Σ(Branch × User Type × Flags × LO Assignment × Permission Level × Subflags)
```

For a specific user × branch × application:

```text
{ Branch User Type } × { Branch Flags } × { LO Assignment } × { Permission Level } × { Subflags }
```

### OC-Admin Role

Program Manager is the OC-admin role.

Program Manager:

* can access OC admin surfaces
* can manage users/settings where scoped
* does not automatically grant branch-level application access
* must be combined with explicit Branch assignment for branch/application access

### Branch User Types

Each Branch assignment requires one user type:

* Loan Officer
* Standard User

Loan Officer:

* has NMLS/license records
* can own applications
* always has Full Access to own applications

Standard User:

* default for processors and support staff
* cannot be LO of record
* can receive substantial permissions through branch/LO assignment configuration

### Branch Manager Flag

Branch Manager is a flag, not a user type.

Branch Manager:

* can stack with Loan Officer or Standard User
* always has minimum View Only access to all applications in the Branch
* can hold higher permissions if configured

### LO Assignment Dimension

Permission scope must specify whose applications the permission applies to:

* Personal Only
* Specific LO(s)
* All LOs in Branch
* Multi-level

### Future-Grant Inheritance

For Standard Users:

* branch-level All LOs in Branch scope can inherit access to future LOs
* per-LO scoped assignments do not automatically inherit future LOs

## Enablement and License Gate

Loan access requires both product enablement and licensing.

Effective access is the intersection of:

1. Platform-supported Markets
2. Loan Program enabled for Market
3. OC enabled for LoanProgram-Market
4. Branch enabled for LoanProgram-Market
5. LO licensed in Market
6. user permission level/subflags

The Loan Access Gate requires:

1. OC enabled for LoanProgram-Market
2. Branch enabled for LoanProgram-Market
3. LO licensed for Market

Creating a new application additionally requires:

* Can Create for the relevant Branch

Hard license validation checkpoints:

* Submission
* Clear to Close

NMLS license data:

* sourced from NMLS API
* pulled on account creation or when NMLS number is added
* synced daily
* cached internally for runtime checks
* license warnings should surface at 60 / 30 / 7 days

Do not assume real-time NMLS checks unless explicitly revised.

## Application Lifecycle Gates

When reviewing application workflow permissions, use this baseline:

| Transition                 | Required Permission                    | License Gate              |
| -------------------------- | -------------------------------------- | ------------------------- |
| None → Draft               | Can Create                             | No hard gate              |
| Draft → Draft edit         | Can Edit                               | No hard gate              |
| Draft → Submitted          | Can Submit                             | Submission checkpoint     |
| Submitted → Clear to Close | Role-specific / permissioned           | Clear to Close checkpoint |
| Submitted → Withdrawn      | Can Withdraw                           | No hard gate              |
| Any → Deleted              | Not supported unless explicitly scoped | N/A                       |

Application must remain tied to exactly one LO and one Branch.

Do not add reassignment unless explicitly requested.

## Impersonation

Impersonation is audit-sensitive.

When designing or reviewing impersonation:

* specify whether impersonation is global or per-entity
* specify the target entity type
* specify who can impersonate
* specify what the impersonating user can see/do
* specify whether destructive actions are blocked, allowed, or logged
* specify audit event requirements
* specify UI entry point
* specify exit behavior

Never assume impersonation grants unrestricted access.

## Audit Log

RBAC-sensitive actions should be auditable.

Consider audit events for:

* invite user
* deactivate user
* reactivate user
* change user type
* change permission level
* set Grant-All value
* set per-entity override
* revert override
* impersonate user/entity
* export data
* underwriting approval
* clear to close
* status override/manual backtrack
* application submission
* application withdrawal
* license sync change
* enablement change

Audit events should capture:

* actor
* target user/entity
* previous value
* new value
* timestamp
* reason if required
* source system
* permission used

## UI/UX Rules for RBAC

Use `RBAC Final Requirements.md` and the relevant V2 Figma designs as the primary source for UI structure and final design direction.

When source docs mention Figma, do not duplicate or invent visual design. Instead:

* preserve the Figma-driven layout direction
* use the spec for model and behavior
* use Figma for screen structure and visual treatment
* flag missing behavior if Figma and spec do not define it

When designing permission UI:

* make inherited vs explicit values visually distinct
* do not display raw nulls
* show effective permission values
* pin Grant-All row where applicable
* show revert action only for overridden rows
* disable controls for inactive entities
* hide or disable controls for View-only users
* show last-Admin guard modal
* show unsaved changes indicator
* preserve permission config on deactivation
* preserve configuration when changing user types unless View-only downgrade rules apply
* explain blocked actions clearly

For LOC permission UI:

* support Branch rows
* support LO Assignment sub-rows
* support Permission Level + Subflags at each intersection
* collapse unused complexity for simple cases
* support templates as starting points if in scope
* always allow matrix override for complex cases

## Build Sequencing

Use `RBAC Final Requirements.md` for implementation order and sequencing.

Default sequencing principles:

### LOC Layer

* LOC may lead because it has broader user-facing impact.
* Scenario 14, the multi-branch / multi-level stress test, should be validated early.
* Implementing the complex scenario first helps validate the full LOC permission tuple before simpler scenarios are tested.

### Platform Operator Layer

* Grant-All / per-entity override behavior is the highest-risk modeling piece.
* Implement and test inheritance, overrides, revert-to-default, View-only cap, inactive entity lockdown, and Admin guard before wiring every permission surface.
* Do not build permission UI that cannot represent inherited vs explicit values.

### Cross-Cutting

* Audit logging, impersonation, export permissions, and status override behavior should be treated as cross-cutting capabilities.
* If sequencing is unclear, identify the dependency and ask whether it is required for V1 or can be layered later.

## Acceptance Scenarios

When validating LOC RBAC, use canonical scenario coverage.

Important scenario categories:

* standard personal LO
* full branch access LO
* multi-branch LO
* pure Branch Manager view
* LO + Branch Manager in same Branch
* LO + Branch Manager in one Branch and LO-only elsewhere
* Standard User full branch access
* Standard User partial access
* single-LO processor/support
* multi-LO support user
* multi-level single branch
* multi-level mixed access
* multi-branch multi-level stress test

Scenario 14, multi-branch multi-level, is the canonical stress test and should be validated early.

When validating Platform Operator RBAC, test:

* Grant-All inheritance
* per-entity override
* revert-to-default
* user type floor
* View-only cap
* Admin guard
* inactive entity lockdown
* impersonation scope
* audit logging

## Required Workflow When Invoked

When this skill is invoked, follow this sequence.

### 1. Identify the RBAC Surface

Classify the workstream:

* Platform Operator RBAC
* LOC RBAC
* cross-layer capability
* impersonation
* audit log
* export data
* enablement/license gate
* application lifecycle gate
* permission UI
* data model
* acceptance scenarios

### 2. Identify the Platform User Group

Explicitly identify:

* Homium Platform Operator User
* Mortgage Origination Company / LOC User
* mixed/cross-layer

Do not proceed with generic “user” language.

### 3. State Source Assumptions

State:

* source document relied on
* whether `RBAC Final Requirements.md` controls the issue
* whether `RBAC_Permissions_Spec_v2_0.md` fills in mechanics
* confirmed facts
* working assumptions
* open questions
* conflicts between docs, if any

If source docs have placeholders or in-progress sections, say so.

### 4. Define the Permission Model

For the relevant workflow, define:

* entity
* actor
* user type
* role/flag
* permission level
* subflags
* entity scope
* inheritance behavior
* access gate
* denied state
* audit requirement

### 5. Define UI/UX Impact

Specify:

* visible surfaces
* hidden surfaces
* enabled controls
* disabled controls
* guardrails
* empty/error states
* explanation text
* audit/history links
* impersonation entry/exit if relevant
* relevant Figma dependency if applicable

### 6. Define Implementation / PRD Impact

If writing PRD or implementation notes, include:

* current behavior
* proposed behavior
* functional requirements
* data requirements
* permission rules
* acceptance criteria
* test scenarios
* open questions
* implementation sequencing

### 7. Avoid Scope Creep

Do not add:

* new roles
* new permission levels
* new subflags
* new lifecycle states
* new impersonation behavior
* new audit policies
* new deletion/reassignment capabilities

unless explicitly provided or clearly labeled as proposed.

## Output Format

When invoked, respond using:

1. RBAC surface
2. Platform user group
3. Source assumptions
4. Canonical rules that apply
5. Permission model
6. UI/UX implications
7. Data/API implications
8. Audit/security implications
9. Implementation order
10. Acceptance scenarios
11. Open questions
12. Recommended next step

## Standing Open Questions to Preserve

Keep open questions consolidated. Do not repeatedly ask the same question.

Potential open questions may include:

* global vs per-entity impersonation reconciliation
* export data privilege scope
* Program Manager self-administration timing
* mid-flight license revocation handling
* withdrawal lifecycle after Withdrawn
* default capability templates
* Clear to Close milestone modeling
* delete/archive behavior for exceptional status override cases
* final Figma behavior if screen design conflicts with spec mechanics

If a question is unresolved, preserve the current working assumption and continue.

