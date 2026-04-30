# RBAC Spec — Origination Companies & Loan Officers

**Homium, Inc.** · Q2 2026 · Dev-team implementation reference · v1.2

> **Scope.** Authorization model for the Origination Company (LOC) administration layer: roles, permission levels, market/program enablement, license validation, entity model. Platform Operator and Investor authorization are out of scope here — see *Originator Flow Sitemap, Org & Roles v0.8*.
>
> **Status.** Implementation-ready, with open questions in §10.

---

## 1. Entity Model

### 1.1 Entities and ownership

| Entity | Owned by | Cardinality | Notes |
|---|---|---|---|
| **Market** | Platform (system-defined, hardcoded) | Many | Geography unit. Examples: a state (UT, MI, DC, CA), a region (Canada-East), a zip-code set, a city. Represents system capabilities, not just a list of states. |
| **Loan Program** | Platform Operator (Homium) | Many | Underwriting guideline + fund linkage (see v0.8 §1). Defines the Markets in which the program can exist. |
| **LoanProgram-Market** | Platform Operator (Homium) | Many-to-many join | Atomic unit of enablement. A single (program × market) pair can be enabled independently at OC, Branch, and LO levels. |
| **Origination Company (OC)** | Platform Operator creates initially; future self-management by Program Manager possible but not in scope for v1 | Many | External originator firm. |
| **Branch** | Platform Operator (today); OC's Program Manager can self-administer market/program enablement at branch level | Many per OC | Flat hierarchy. Inherits OC-level enablement; can narrow but not widen. |
| **User** | OC (within Platform Operator-approved bounds) | Many per OC | Has zero or one OC-admin role (§3.1) and zero-or-more Branch assignments (§3.2). |
| **Application / Loan** | Originating LO + Branch | One per LO + Branch pair | **Non-transferrable.** Always associated to exactly one LO and exactly one Branch for the life of the application. Cannot be deleted; supports drafts pre-submission. |

### 1.2 The two dimensions of eligibility

LO access to a Loan Program is governed by **two independent dimensions**, each maintained separately:

| Dimension | What it determines | Configured by |
|---|---|---|
| **Product configuration** (LoanProgram-Market eligibility) | Which (program × market) pairs the OC, Branch, and LO are *enabled* for. | Homium at OC level; OC Program Manager (future) or Homium at Branch level. |
| **Licenses** | Which Markets the OC and the individual LO are *legally permitted* to operate in. | NMLS API, automated sync (§2). |

Effective access is the intersection of both dimensions. A LoanProgram-Market that is enabled but not licensed is not accessible. A licensed Market with no enabled program is also not accessible.

### 1.3 Enablement model — independent configurations, intersection at runtime

LoanProgram-Markets are **configured independently at each level**. The system takes the **intersection of all enabled maps at runtime** to determine effective access. Inheritance is implicit: if a privilege is removed at a higher level (e.g. company), it is automatically disabled for all lower levels via the intersection — no cascading config update required.

```
   Platform Supported Markets (system-defined, dev-implemented)
        │
        ▼
   Loan Program           ──►  Set by Platform Operator. Defines Markets where program can exist.
        │
        ▼
   OC enablement          ──►  Enable LoanProgram-Markets that CAN be assigned to the OC.
        │                      Set by Homium (eligible Markets AND Loan Programs).
        │
        ▼
   Branch enablement      ──►  Enable a specific allowable LoanProgram-Market for all LOs of the branch.
        │                      Branch-level inheritance of OC's enabled Markets and Loan Programs.
        │                      Further narrowing controlled by Program Manager / Homium;
        │                      can be as wide as what is available at OC level.
        │
        ▼
   LO licensure           ──►  LO is licensed to operate in a set of Markets (NMLS-sourced, §2).
                               LO's effective enablement = (Branch enabled set) ∩ (LO licensed Markets).
```

> **Key implementation note.** Enablement maps at each level are independent records; no validation that child ⊆ parent at config time. The runtime authorization check computes the intersection on every relevant request.

### 1.4 The loan-access gate

An LO can access a Loan Program when **all** are true at the moment of request:

1. **OC is enabled** for the LoanProgram-Market
2. **Branch is enabled** for the LoanProgram-Market
3. **LO is licensed** to operate in that Market

Originating a new application additionally requires the LO to hold `Can Create` (§3.5) for that Branch. Status changes at any level take effect **immediately** — example: an LO who quits and switches companies mid-application is disabled at the moment of status change.

---

## 2. License Management (NMLS)

| Aspect | Spec |
|---|---|
| **Source of truth** | NMLS (external API). Lookup by NMLS license registration number. |
| **Data captured** | Per Market: regulator, active status, issue date, renewal date. |
| **Initial pull** | Automatic. On account creation / when a user is added via NMLS number, the system retrieves licenses (and branches, where applicable). Largely API-driven — no manual entry. |
| **Daily sync** | Daily batch process. Detects new / changed / expired licenses for all users. |
| **Update frequency** | As frequently as possible (daily target). Risk-management driven; system-managed. |
| **Notifications** | On license change: notify the affected LO, Branch Manager(s), Program Manager(s), and Homium Account Manager. In-app + email. |
| **Status-change effect** | **Immediate.** Effective enablement updates as soon as the system records the change. |
| **Validation at runtime** | Validation relies on the **latest status stored internally** (updated by overnight batch). Not a real-time NMLS call per request. |
| **Hard validation checkpoints** | Application **submission** + **clear to close**. |

> **Terminology change.** The team is moving away from "initial submission" / "final submission" — both caused confusion. Replace with: **submission** (single hard checkpoint) + **clear to close**. Building out the LO C2C touchpoint may be required to model the latter; alignment with Pete pending.
>
> **Backlogged.** Mid-flight handling of an application when a license is revoked between checkpoints. Foundation first; scenario edge cases later.

---

## 3. RBAC Model

The model has three independent dimensions on a user:

1. **OC-Admin Role** — optional, company-level (§3.1)
2. **Branch User Type** — required per Branch assignment (§3.2)
3. **Branch Flags** — optional per Branch assignment (§3.3)

Plus per-Branch-assignment configuration: Permission Level (§3.4), Subflags (§3.5), and LO Assignment scope (§3.6).

### 3.1 OC-Admin Role

There is one OC-admin role. It is the only role permitted to view the firm's configuration screens. All other users only access the Loan Origination System (LOS).

| Role | Cardinality | Capabilities |
|---|---|---|
| **Program Manager (Admin)** | At least 1 per OC; many supported | View OC branch/user admin screen; setup and basic KYC; manage OC preference settings (notifications, security/MFA, allowable email domains, etc.); invite new members; manage user active status. May be added to one or more Branches with a Branch User Type — stacked. |

A user without Program Manager has no OC-admin access. Program Manager is the role responsible for team onboarding and management at the OC level.

> **Future direction.** Program Managers will eventually self-administer branches, users, and per-Branch market/program enablement. For v1, Platform Operator handles initial configuration; the framework is built so this privilege can be granted later.

### 3.2 Branch User Type

Every Branch assignment requires one of two user types. The user type determines which fields exist on the user record.

| User Type | Fields enabled | Notes |
|---|---|---|
| **Loan Officer (LO)** | License records, Agent NMLS#, eligible loan products, market enablement (inherited from Branch), allow-new-originations toggle, allow-access-to-all-branch-activity toggle | Special user type. Can *own* an application — applications must reference exactly one LO. Some Loan Processors may have NMLS IDs, but only those treated as LOs for disclosure purposes are typed as LO. |
| **Standard User** | Standard fields only | Default for all non-LO origination users (Loan Processors, Branch Support Staff, etc.). Privileges assigned per Branch. May have the same privileges as an LO but applications cannot be tied to their license. |

User type can vary by Branch assignment for the same user (e.g. LO at Branch A, Standard User at Branch B).

### 3.3 Branch Flags

| Flag | Behavior | Stackable with |
|---|---|---|
| **Branch Manager (BM)** | Grants admin privileges for the Branch. **Invariant:** a user with BM flag has at minimum **View Only** access to all applications under the Branch. Higher access can be configured but cannot drop below View. | LO or Standard User |

### 3.4 Permission Levels

Per source (verbatim): *No Access, View Only, Can Edit, Full Access (all subflags=TRUE).*

| Level | Behavior |
|---|---|
| **No Access** | User cannot see or interact with the in-scope applications. |
| **View Only** | Read-only on in-scope applications. |
| **Can Edit** | Can modify in-scope applications. Subflags determine which sub-actions are permitted (§3.5). |
| **Full Access** | Equivalent to Can Edit + all subflags = TRUE. |

### 3.5 Subflags (Can Edit only)

Per source: *subflags only apply to Can Edit.*

| Subflag | Meaning |
|---|---|
| **Can Create** | Initiate a new application draft. |
| **Can Submit** | Move an application from Draft → Submitted, and through subsequent submission gates. |
| **Can Withdraw** | Withdraw a submitted application. |

> **No Delete.** Per source: *cannot delete objects, but can have "drafts" before initial submission.* Application objects are never deleted.

### 3.6 LO Assignment scope and invariants

Within a Branch assignment, Permission Level is qualified by **LO Assignment** — *whose* applications the level applies to.

| LO Assignment value | Source phrasing |
|---|---|
| **Personal Only** | "Personal Only" / "Branch A - Only Personal" |
| **Specific LO(s)** | "Only Loan Officer 1" / "LO1 + LO2 not for other LOs" |
| **All LOs in Branch** | "Any LO within Branch A" / "Branch A - Full Office" / "Branch B - All Loans within Branch" |
| **Multi-level (mixed per-LO)** | "Branch A - LO1 full, others View Only" / "Branch A - LO1 full, LO2 partial, Other LOs View Only" |

A single Branch assignment can carry multiple `(LO Assignment × Permission Level × Subflags)` tuples simultaneously.

**Invariants** (system-enforced; cannot be configured below these floors):

| Invariant | Source |
|---|---|
| **An LO always has Full Access to applications tied to them.** | "Loan Officers will ALWAYS have full access to the applications tied to them" |
| **A Branch Manager always has at least View Only on all applications under the Branch.** | "If Branch Manager then user has at least VIEW access to all applications under the branch" |

Permissions can vary by Branch for the same user. Examples from source: *"a LO can have full access to submit applications at one branch but only view only access at another branch"*; *"at one branch they can have full access only to their own applications while at another branch have full access to submit applications on behalf of all LOs at the branch."*

### 3.7 Future Grant (Standard User branch-level inheritance)

Per source: *"if permissions are set for a user at the branch level (as opposed to by individual LO) then this assumes future inheritance, so if a new LO is added to the branch they would have the same privs for that new LO's applications."*

When a Standard User holds a branch-level LO Assignment (e.g. "All LOs in Branch — Full Access") and a new LO joins the Branch, the Standard User automatically receives those privileges on the new LO's applications. No reconfiguration required.

Branch-level scope is the inheriting mode. Per-LO scope (e.g. "LO1 only — Full Access") does **not** inherit; new LOs must be explicitly added to the assignment.

### 3.8 Composite permission tuple

Complete permission specification for one user × one Branch × one application:

```
{ Branch User Type } × { Branch Flags } × { LO Assignment } × { Permission Level } × { Subflags }
```

Full authorization profile:

```
[ OC-Admin Role ] + Σ ( Branch assignment × User Type × Flags × LO Assignment × Permission Level × Subflags )
```

Encodable in the User → Branch join table with a sub-table for per-LO-Assignment permissions.

---

## 4. Application Lifecycle and Permission Touchpoints

| State | Transition | Required permission | License gate |
|---|---|---|---|
| *(none)* → **Draft** | LO creates application | Can Create | — |
| Draft → Draft | LO or permissioned Standard User edits | Can Edit | — |
| Draft → **Submitted** | LO or permissioned user submits | Can Submit | **Hard checkpoint** (§2) |
| Submitted → ... → **Clear to Close** | Multi-party milestone | per role | **Hard checkpoint** (§2) |
| Submitted → **Withdrawn** | LO or permissioned user withdraws | Can Withdraw | — |
| Submitted → *(other Homium-side states)* | Out of scope for this doc | — | — |
| Any → **Deleted** | Not supported | — | — |

Applications carry exactly one LO and one Branch for the life of the record (non-transferrable).

---

## 5. Canonical Scenario Matrix

Canonical test cases for the LOC RBAC implementation. Any valid permission configuration must reduce to one of these patterns or a composition. **Build for Scenario 14 first** — it stress-tests every dimension; the rest are subsets.

### 5.1 LO scenarios

| # | Use case | User Type | Flags | Branch | LO Assignment | Permission Level |
|---|---|---|---|---|---|---|
| 1 | Standard Personal LO | LO | — | A | Personal Only | Full Access |
| 2 | Full Branch Access LO | LO | — | A | All LOs in Branch | Full Access (can work other LOs' loans on their behalf with full permissions) |
| 3 | Multi-Branch LO | LO | — | A, B | A: Personal Only · B: All LOs in Branch | A: Full · B: Full |

### 5.2 Branch Manager scenarios

| # | Use case | User Type | Flags | Branch | LO Assignment | Permission Level |
|---|---|---|---|---|---|---|
| 4 | Pure Branch Manager (view) | Standard User | BM | A | All LOs in Branch | View Only |
| 5 | LO + BM, same Branch | LO | BM | B | All LOs (BM) **+** Personal (LO) | All: View Only · Personal: Full Access *(invariant: LO has Full on own)* |
| 6 | LO+BM in one Branch, LO-only elsewhere | A: LO · B: LO · C: LO | A: BM · B,C: — | A, B, C | A: Personal + All other LOs · B: All LOs · C: Personal Only | A: Personal Full + Others View Only · B: Full office access · C: Personal Only |

### 5.3 Standard User scenarios

| # | Use case | User Type | Flags | Branch | LO Assignment | Permission Level |
|---|---|---|---|---|---|---|
| 7 | Standard Branch Member, Full | Standard | — | A | All LOs in Branch | Full Access |
| 8 | Standard Branch — Partial (uniform) | Standard | — | A | All LOs in Branch | Can Edit (uniform across branch — e.g. can edit but cannot create) |
| 9 | Single-LO Member | Standard | — | A | LO1 only | Full Access · others: No Access |
| 10 | Single-LO, Multi-Branch Member | Standard | — | A, B | LO1 only (both branches) | Full Access · others: No Access |
| 11 | Multi-LO Member | Standard | — | A | LO1 + LO2 | Full Access · others: No Access |
| 12 | Multi-level (single branch) | Standard | — | A | LO1 vs others | LO1: Full · others: View Only |
| 13 | Multi-level, mixed permissions | Standard | — | A | LO1, LO2, others | LO1: Full · LO2: Can Edit · others: View Only |
| 14 | Multi-Branch, Multi-level (stress test) | Standard | — | A, B, C, D, E | per-branch, per-LO | A: All LOs Full · B: LO1 Full, LO2 Can Edit · C: LO1 Can Edit, others No Access · D: restricted access all LOs · E: View Only |

> **Mixed user types across Branches.** Per source: a single user can be e.g. *"Branch A: Loan Officer · Branch B: Standard User (example Loan Processor)"* — the LO of record on their Branch A loans, a back-office processor in Branch B. Supported by default given the data model.

---

## 6. Program Manager (Admin) — Behavior Spec

Program Manager is the OC-level admin role. Every OC requires at least one. Many supported. The role can be stacked with branch assignments (LO or Standard User at any number of Branches).

| Capability | Default | Approval path |
|---|---|---|
| View OC admin screen (branches, users, settings) | ON | — |
| Manage OC preference settings (notifications, MFA, allowable email domains) | ON | — |
| Setup and basic KYC | ON | — |
| Invite new members | ON | Triggers Platform Operator approval per v0.8 §4 Workflow C |
| Manage user active status | ON | — |
| Self-administer Branch market/program enablement | OFF in v1; planned for future | Platform Operator approval today |
| Self-administer Branch creation / removal | OFF in v1 | Platform Operator approval today |
| Edit OC config (NMLS#, addresses, etc.) | OFF in v1 | Platform Operator approval today |
| Hold a Branch User Type (LO or Standard User) at one or more Branches | Optional, stackable | — |

The Program Manager role does not auto-grant any branch-level access. Branch assignments must be explicit.

---

## 7. Field-Level Data Model

The current system stores nearly all fields denormalized on the User object. The future model splits fields across four layers, with NMLS as the source of truth for most identity-bearing fields.

### 7.1 USER layer

| Field | Source |
|---|---|
| Email | Current system |
| First Name | Current system |
| Last Name | Current system |
| Role | Current system |
| Managed State | Current system |
| Account Manager | Current system |
| Timezone | Current system |

### 7.2 LOAN OFFICER sub-layer (only when User has LO type on ≥1 Branch)

| Field | Source | Notes |
|---|---|---|
| Eligible Loan Products | Current system | |
| Allow New Originations | Current system | Master toggle to suspend new app creation. |
| Market Enablement | Current system | Inherited from Branch's Market enablement (§1.3). |
| Allow Access to all Branch Activity | Current system | |
| Agent NMLS # | NMLS → Individual ID | |
| State Licenses / Registrations | NMLS → State Licenses | Daily sync per §2. Per Market: regulator, active status, issue date, renewal date. |

### 7.3 COMPANY (OC) layer — maps to NMLS *Employment*

| Field | Source |
|---|---|
| Company Name | NMLS → Authorized to Represent |
| Company NMLS # | NMLS → Company NMLS ID |
| Address 1 | New |
| Address 2 | New |
| City | New |
| State / State of Inc | New |
| Zip | New |
| Contact Phone | New |
| Website | New |
| Email Addresses to CC on Communication | Current system |
| OC-level LoanProgram-Market enablement map | Set by Platform Operator (Homium) |

### 7.4 BRANCH layer — maps to NMLS *Office Locations*

| Field | Source |
|---|---|
| Branch Name | NMLS → Office Locations → Company |
| Branch NMLS # | NMLS → Office Locations → NMLS ID |
| Branch Type | NMLS → Office Locations → Type (Branch, Main, etc.) |
| Address 1 | NMLS → Street Address |
| Address 2 | New |
| Suite # | Current system |
| City | NMLS → City |
| State | NMLS → State |
| Zip | NMLS → Zip Code |
| Contact Phone | New |
| Start Date | NMLS → Start Date |
| Branch-level LoanProgram-Market enablement map | Set by Platform Operator (today); Program Manager (future) |

> **Migration note for dev.** Today every field above lives on the User object. The future split requires (a) backfilling COMPANY and BRANCH records from existing Users, (b) deduplicating where multiple Users in the same OC have different values for a now-shared field, and (c) reconciling NMLS-sourced fields against current values.

---

## 8. UI / UX Implications

- **User-creation flow** must support a matrix-style editor: per-Branch rows, per-LO-Assignment sub-rows within each Branch, Permission Level + Subflags at the intersection. Hide unused dimensions for simple cases.
- **Default templates** map to high-frequency scenarios (1, 2, 4, 7, 9). Suggested seeds: *Standard Personal LO, Full Branch LO, View-Only Branch Manager, Full Branch LP, Single-LO LP*. Templates are starting points; matrix override always available.
- **Future-grant defaults** at the Branch level apply only when LO Assignment is set at branch scope (§3.7). Per-LO scope does not inherit.
- **Application creation entry-point** must check the §1.4 AND gate before showing the "new application" CTA. If gate fails, surface which condition blocked (OC enablement, Branch enablement, License) so Program Manager can resolve.
- **License status indicator** required in user profile and Branch user-roster views. Surface expirations 60 / 30 / 7 days out. License changes propagate effect immediately.
- **Application object** must always expose owning LO + Branch. Non-transferrable — no "reassign" affordance.
- **OC config screens** visible to Program Manager only. All other LOC users go directly to LOS.

---

## 9. Decisions Resolved

| # | Item | Resolution |
|---|---|---|
| 1 | OC-admin role | **Program Manager (Admin)** is the only OC-level admin role. At least 1 per OC; many supported. |
| 2 | Program Manager structure | User type with default permissions; specific capability granularity managed via Mike Chu's platform operator structure work (separate workstream). |
| 3 | Branch User Type | **Loan Officer** (special, has license) or **Standard User** (default). Set per Branch assignment. |
| 4 | Loan Processor / Branch Support Staff | **Not separate types.** Standard Users with assigned permission configurations. |
| 5 | Branch Manager | **Flag** (not a user type). Stackable on LO or Standard User. **Invariant: minimum View Only on all branch applications.** |
| 6 | LO invariant | **An LO always has Full Access to their own applications.** System-enforced; not configurable below this floor. |
| 7 | Permission levels | **No Access / View Only / Can Edit / Full Access.** Full Access = Can Edit + all subflags TRUE. |
| 8 | Subflags | **Can Create / Can Submit / Can Withdraw**, applicable only to Can Edit. |
| 9 | Delete | **Not supported.** Drafts pre-submission; withdraw post-submission. |
| 10 | Application ownership | **Exactly one LO + one Branch per application. Non-transferrable.** |
| 11 | Two dimensions of eligibility | **Product configuration** (LoanProgram-Market enablement) + **licenses** (NMLS). Maintained independently. |
| 12 | Enablement model | **Independent configurations at OC, Branch, LO; intersection at runtime.** Higher-level removal automatically disables lower levels via intersection. |
| 13 | LO market enablement | **Inherited from Branch enablement**, intersected with LO licenses at runtime. |
| 14 | Branch hierarchy | **Flat.** No nested sub-branches. |
| 15 | License source of truth | **NMLS API.** Auto-pulled at user creation; daily batch sync. |
| 16 | License validation at runtime | **Cached internal status** (updated by overnight batch). Not a real-time NMLS call. |
| 17 | License validation checkpoints | **Submission** + **clear to close** (replaces "initial" / "final" submission terminology). |
| 18 | License status changes | **Immediate effect** on enablement. |
| 19 | Future-grant inheritance | **Applies only to branch-level scope.** Standard User with branch-level LO Assignment auto-inherits privileges on new LOs' applications. Per-LO scope does not inherit. |
| 20 | Self-administration by Program Manager | **Out of scope for v1.** Framework built so this can be granted later; Platform Operator handles initial config. |
| 21 | Mid-flight license revocation handling | **Backlog.** Foundational process first; edge-case scenarios deferred. |

---

## 10. Open Questions for the Team

| # | Question | Why it matters | Owner |
|---|---|---|---|
| 10.1 | **Withdrawal lifecycle:** after Withdraw, can the application be re-submitted, or is Withdrawn terminal? | State machine and Can Submit semantics. | PM / Eng |
| 10.2 | **Default capability templates** — ship named templates (per §8) or require explicit matrix on every user creation? Empty matrix on every invite will hurt Program Manager UX. *Recommend: ship templates + override.* | Adoption-critical. | PM |
| 10.3 | When a Standard User is single-LO scoped (Scenario 9) and that LO's status changes (license expiry, departure), what happens to the Standard User's access? | Cascade rules for permission cleanup. *Recommend: Standard User retains record-level access for in-flight apps; Program Manager re-assigns going forward.* | PM / Compliance |
| 10.4 | **Clear to close milestone** modeling — pending alignment with Pete. Required for second hard license validation checkpoint. | Blocks license-validation completeness. | PM (with Pete) |
| 10.5 | Are there any **specific Program Manager sub-roles** to ship in v1, or is Program Manager a single configuration? Mike Chu owns the platform operator structure work — does it produce LOC-side sub-roles too, or only Homium-internal ones? | Determines whether OC admin UI is single-mode or multi-tier in v1. | Mike Chu / PM |
