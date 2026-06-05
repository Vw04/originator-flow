# PRD — Notifications Module (Homium V2 Platform)

**Status:** Draft for review
**Owner:** Vincent (Product)
**Source of truth:** `assets/specs/Notification_Events_Registry_v2.xlsx` (the "Registry") — 119 events, 3 categories, 8 types, full role × channel matrix, preset system, legend.
**Audience:** Engineering, Design, Ops/Compliance
**Maturity:** First-pass PRD; registry is mature, module is unbuilt.

> **Status labels used in this doc:** **Confirmed** · **Working Assumption** · **Proposed** · **Flagged for Review** · **Out of Scope** · **Future State**

---

## 0. Scope at a Glance

| Decision | Choice | Status |
|---|---|---|
| Preference depth (P0) | **Presets only** — 4 cumulative levels + in-app/email channel toggle per role. Per-event override + digest/frequency → **P1**. | Confirmed |
| Surface (P0) | **Desktop web platform** — bell, feed, dismissable banners, preference center. Mobile parity → P1. | Confirmed |
| Investors / Program Sponsors | **Out of P0 — Future State.** Separate registry/portal required (per Registry's own deferral note). | Confirmed |
| Channels (P0) | **In-app + email only.** Borrowers email-only (no system access). Push/SMS deferred. | Confirmed |
| Event catalog | The Registry is canonical. This PRD specifies the *system* around it; it does not re-enumerate all 119 events. | Confirmed |

---

## 1. Overview

The Notifications Module is a new, cross-cutting platform service that turns Homium platform and loan-origination events into delivered, permissioned, actionable notifications. It introduces:

- A **canonical event catalog** (the Registry) classified by category, type, and origination phase.
- A **routing + delivery layer** that maps each event to roles and channels (in-app, email).
- A **permission + preference system** controlling *who sees what*, *how much/how often*, and *how to change it*.
- **Surfaces**: a bell + dropdown, a full notification feed, dismissable banners, and a preference center.

This is the first PRD in `docs/prds/`. It serves loan-origination users and Homium platform operators in P0; investor/sponsor users are Future State.

---

## 2. Problem Statement

**Current pain.** The V2 platform has no notifications system. The only existing artifact is a 68-line mobile demo view (`js/views/mobile/mobile-notifications.js`) using an ad-hoc 4-type taxonomy (`action`/`sent`/`complete`/`info`) with hardcoded demo data and simple loan-scoped filtering. There is no preference center, no desktop surface, no email routing, and no canonical event model in product.

**Why it matters.**
- **Missed action-required events.** 39 of 119 events are `Action Req? = Yes`. Without reliable delivery, originators miss approvals, conditions, and KYC follow-ups → stalled loans.
- **Regulatory exposure.** 8 official communiques and 10 `Regulatory`-type events are compliance-mandated borrower-facing or must-act communications. No system means no auditable delivery.
- **SLA breaches.** 9 `SLA` time-based events have no mechanism to surface aging work.
- **Notification fatigue (the inverse risk).** A naive "send everything" approach buries the critical signals. The Registry already encodes a 4-level preset model to manage noise — but it is unbuilt.

**Who experiences it.** Loan Officers, Loan Processors, Branch/Originating Managers, and Homium platform operators (Sys Admin/AM). Borrowers experience it indirectly via email-only communiques.

**If not solved.** Manual follow-up via email/phone, inconsistent delivery, compliance gaps, slower cycle times, and poor adoption of the platform as the system of record.

---

## 3. Goals

| # | Goal | Observable measure |
|---|---|---|
| G1 | Every Registry event reliably routes to the correct roles and channels per its matrix. | Delivery record exists for each fired event matching the role × channel map. |
| G2 | Users can control notification volume without losing must-act signals. | Locked (`Configurable=No`) events always deliver regardless of preset; presets filter the rest. |
| G3 | Action-required events are visibly distinct and resolvable. | `Action Req?=Yes` events render a CTA and a resolution state. |
| G4 | Compliance communiques are delivered and auditable. | All `official_communique` events produce an email + internal mirror + audit log entry. |
| G5 | Admins set sensible role defaults; users self-serve from there. | Per-role default preset + channel defaults applied on provisioning; user override persists. |

---

## 4. Non-Goals (P0)

- **Out of Scope:** Investor/program-sponsor notifications (Future State, separate registry/portal).
- **Out of Scope (P0):** Per-event override center, digest/roll-up frequency, snooze, quiet hours → **P1**.
- **Out of Scope (P0):** Push notifications, SMS, Slack/Teams → deferred.
- **Out of Scope (P0):** Mobile parity → P1 (reconcile existing mobile demo view to the new taxonomy).
- **Out of Scope:** Borrower in-app experience (borrowers are email-only, no system access).
- **Out of Scope:** Notification analytics dashboard → P2.

---

## 5. Users & Personas

Three platform user groups. **Investors are Future State and excluded below.**

### 5a. Mortgage Origination Users (external partners)

| Persona | Needs | Sees | Does | Does NOT see/do |
|---|---|---|---|---|
| **Loan Officer (LO)** | Know what's next on *their* loans; never miss an approval/condition/borrower step. | In-app + email for events on loans they own; full feed scoped to their loans. | Act on CTAs, change own preset/channel, mark read/dismiss. | Other LOs' loans; platform-wide ops events not in their matrix. |
| **Loan Processor (LP)** | Support assigned loans without being LO. | Notifications **only in loan-tagged scope mode** — i.e., loans an LO has tagged/permissioned them on. | Act on CTAs within tagged loans; change own preset. | Loans not tagged to them. |
| **Originating / Branch Manager (Orig. Mgr)** | Oversight of branch/org without noise. | Critical events in their branch by default (recommended default = **Critical only**). | Upgrade own preset; receive provisioning/admin alerts. | Cross-branch loans outside their org scope. |

### 5b. Homium Platform Operator Users (internal)

| Persona | Needs | Sees | Does | Notes |
|---|---|---|---|---|
| **Sys Admin / Account Manager (AM)** | Wide visibility into platform + loan activity; efficient operation. | Broad matrix coverage (Sys Admin column). Default preset = **Standard**; **email default OFF, in-app primary**. | Review/approve/monitor; configure role defaults; impersonation (see §11). | Registry folds legacy Account Manager / Default AM / Funding Agent (Homium-internal) under the Sys Admin column. |

### 5c. Borrower (email-only)

| Persona | Needs | Channel | Notes |
|---|---|---|---|
| **Borrower** | Clear, fair, regulated communications + key milestone confirmations. | **Email only — no system access.** | Sparse matrix population; flagged only where the Registry marks it or a regulated comm requires it. |

### 5d. Future State

- **Investor / Program Sponsor users** — deferred. Will require a separate event registry and likely a separate portal surface. Not specified here.

---

## 6. Current State

| Layer | Reality |
|---|---|
| Product | No notifications module. |
| Mockup | `js/views/mobile/mobile-notifications.js` — mobile-only demo, 4 ad-hoc types (`action`/`sent`/`complete`/`info`), `MobileNav.DEMO_NOTIFICATIONS` hardcoded data, loan-scoped filter for LO/LP. No preference center. |
| Spec | Mature: `Notification_Events_Registry_v2.xlsx` defines the full catalog, matrix, presets, and legend. |
| Process today | Manual email/phone follow-up; no auditable in-platform delivery. |

**Working Assumption:** the existing mobile demo's 4-type taxonomy will be **superseded** by the Registry's category/type model; mobile will be reconciled in P1.

---

## 7. Proposed Future State

**Event lifecycle (happy path):**

```
Event fires (user / system / time / external callback)
   → Resolve Registry record (category, type, phase, action_req, configurable, default_preset, role×channel map)
   → Determine recipients (role match + scope: LO/LP loan-scoping, Mgr branch-scoping)
   → Apply preference filter (locked events bypass; else preset level + channel toggle)
   → Deliver per channel:
        • system_alert      → dismissable banner + bell
        • system_event      → in-app feed + email (per preset)
        • official_communique → email (primary) + internal in-app mirror
   → Record delivery + (for action_req) track resolution
   → Audit log entry (esp. communiques, security, regulatory)
```

**Exception paths** (detailed in §16): async external callbacks (KYC pending/approved/failed), callback failures/timeouts, role changes mid-flight, recipient with no eligible channel.

---

## 8. Taxonomy Model

The Registry is the canonical catalog. The module classifies every event on three axes:

### 8a. Category (3) — drives surface & delivery behavior

| Category | Count | Surface / behavior |
|---|---|---|
| `system_alert` | 34 | Platform/profile/permissions update → **dismissable banner + bell icon**. |
| `system_event` | 77 | Loan workflow event (status/milestone/approval) → **in-app feed + email per preset**. |
| `official_communique` | 8 | Regulated borrower-facing communication → **email primary + internal in-app mirror**. |

### 8b. Type (8) — semantic classification

| Type | Count | Meaning |
|---|---|---|
| Status | 38 | State change (informational). |
| Milestone | 22 | Pipeline phase transition. |
| Approval | 19 | Decision event. |
| Config | 13 | Setting/permission change. |
| Regulatory | 10 | Compliance-mandated. |
| SLA | 9 | Time-based threshold. |
| Security | 4 | Auth/access. |
| Collab | 4 | User-to-user. |

### 8c. Phase — origination process stage (used for feed filtering)

- **Section A — Platform events** (`system_alert`): Account & Onboarding, Permissions & RBAC, Org & Branch Admin, Programs & Eligibility, Compliance & Licensing, Platform-wide.
- **Section B — Workflow events** (`system_event`): Prequalification → Initial Application → Document Review (cross-stage) → CDA/Appraisal → Final Application → Claiming → Clear To Close → Funding Approval → Loan Package → Closing → Post Closing → Transfer Agent Approval → Minting → Post Minting → Lifecycle Terminal → Collaboration & Assignment → SLA/Time-Based.
- **Section C — Official communiques**: Pre-Qualification, Application, Commitment & Closing, Account comms.

**Working Assumption:** Phase strings must match origination process stage names exactly (per Registry legend) so the feed phase filter and the loan pipeline stay in sync.

---

## 9. User Flows

### F1 — Receive & read a workflow notification (LO)
- **Trigger:** `system_event` fires on a loan owned by the LO.
- **Preconditions:** LO's preset includes the event's `default_preset` level; in-app channel on.
- **Steps:** Bell unread count increments → LO opens dropdown/feed → reads item (scoped to their loans) → marked read.
- **Result:** Unread count decremented; read state persisted.
- **Errors:** Email channel failure logged, retried; in-app always available as fallback.

### F2 — Act on an action-required event
- **Trigger:** Event with `Action Req? = Yes` (e.g., approval needed, condition added, KYC failed).
- **Steps:** Item renders distinct "Action Required" treatment + CTA → user clicks → routed to the relevant entity (loan/condition/task) → completes action.
- **Result:** Notification moves to resolved/actioned state.
- **Audit:** Action and resolution logged.

### F3 — Dismiss a banner (`system_alert`)
- **Trigger:** Platform/RBAC/profile alert.
- **Steps:** Banner shows at top + bell entry → user dismisses banner → bell entry persists until read.
- **Open question (§20):** banner dismiss persistence vs auto-expire.

### F4 — Change notification preset (preference center)
- **Trigger:** User opens preference center.
- **Steps:** Selects preset (Off / Critical / Standard / All) + toggles in-app/email → save.
- **Result:** Future delivery filtered by new preset; **locked events still deliver**.
- **Validation:** Downgrade warning if dropping below Standard (loss of milestones/collab).

### F5 — Official communique with internal mirror
- **Trigger:** `official_communique` fires (borrower-facing regulated comm).
- **Steps:** Email sent to borrower (primary) → internal in-app mirror created for designated internal role(s).
- **Audit:** Mandatory delivery log.
- **Open question (§20):** which internal roles receive the mirror.

---

## 10. Requirements

### 10a. Functional (P0)
- F-1 Maintain a canonical event catalog sourced from the Registry (event_id, category, type, phase, actor/source, action_req, configurable, default_preset, per-role channel map).
- F-2 On event fire, resolve recipients by role + scope (loan-scope for LO/LP; branch/org-scope for Mgr).
- F-3 Apply preference filter: locked events bypass; configurable events filtered by user preset + channel toggle.
- F-4 Deliver per category behavior (banner+bell / feed+email / email+mirror).
- F-5 Maintain per-user, per-notification state (unread → read → dismissed/actioned).
- F-6 Render bell + unread count, dropdown, full feed with filters, dismissable banners, preference center.
- F-7 Distinct rendering + CTA for `Action Req? = Yes`.

### 10b. Data (see §11 for schema detail)
- D-1 Event definition object (from Registry).
- D-2 Notification/delivery record (instance of an event delivered to a recipient on a channel).
- D-3 User preference object (role default + selected preset + channel toggles).
- D-4 Read/dismiss/resolution state per recipient.

### 10c. Permission (the core ask — full detail in §11)
- P-1 Visibility governed by role × channel matrix + scope.
- P-2 `Configurable=No` (16 events) are locked-on and cannot be disabled by users.
- P-3 Volume governed by 4 cumulative presets + channel on/off.
- P-4 Admins set per-role defaults; users self-serve overrides (P0: preset+channel; P1: per-event).

### 10d. Notification-routing
- R-1 Scope rules: LO sees own loans; LP sees loan-tagged loans only; Mgr sees branch/org; Sys Admin broad.
- R-2 Channel codes drive delivery: `I+E`, `I`, `E`, `—` per role per event.
- R-3 External-callback events (KYC, DocuSign, CDA, Transfer Agent, MERS, Deutsche Bank) route on callback receipt.

### 10e. Audit
- A-1 Log all `official_communique`, `Security`, and `Regulatory` deliveries.
- A-2 Log preference changes (who/when/old→new).
- A-3 Log action-required resolutions.

### 10f. Reporting (P2 — Future State)
- Delivery rates, action-required aging, communique delivery confirmation. Not in P0/P1.

---

## 11. Notification Model & Permissioning (Core Section)

### 11a. Data model (Working Assumption — field names proposed)

**Event Definition** (one per Registry row):
```
event_id            string   (e.g., "user.invited")
category            enum     system_alert | system_event | official_communique
type                enum     Status | Approval | Milestone | Config | Regulatory | SLA | Security | Collab
phase               string   (must match origination stage name)
trigger_condition   text
actor_source        string   (User | System | external: SecuritizeID, DocuSign, CDA Vendor, NMLS, Transfer Agent, Deutsche Bank, MERS)
action_req          bool
configurable        bool     (false = locked-on)
default_preset      enum     C | S | A   (cumulative)
channel_map         { sys_admin, orig_mgr, lo, lp, borrower } → I+E | I | E | —
```

**Delivery Record** (instance):
```
notification_id, event_id, recipient_user_id, recipient_role, channel, loan_id?,
created_at, state (unread|read|dismissed|actioned), action_resolved_at?
```

**User Preference**:
```
user_id, role, preset (Off|Critical|Standard|All),
channel_in_app (on|off), channel_email (on|off)
-- P1: per_event_overrides[], digest_frequency
```

### 11b. Permission layer (a) — *Who sees it*

Driven by the **role × channel matrix** in the Registry. Each event defines, per role, one of: `I+E` (in-app + email), `I` (in-app only), `E` (email only), `—` (not delivered).

- Roles: **Sys Admin, Orig. Mgr, LO, LP, Borrower(email-only)**.
- **Scope narrows visibility within a role:** LO → own loans; LP → loan-tagged loans only; Orig. Mgr → branch/org; Sys Admin → broad.
- **16 locked events** (`Configurable=No`) are regulatory/critical-security and are **always delivered** to their mapped roles regardless of preset.

### 11c. Permission layer (b) — *How often / how much*

Volume is controlled by **two dials**:
1. **Preset level** (4 cumulative — see §12): filters which configurable events deliver.
2. **Channel toggle**: in-app on/off and email on/off per user.

`Action Req?` and locked events are never filtered out.

### 11d. Permission layer (c) — *How to modify it (more or less)*

| Mechanism | P0 | P1 |
|---|---|---|
| Select preset (Off/Critical/Standard/All) | ✅ | |
| Toggle in-app / email channel | ✅ | |
| Admin sets per-role defaults on provisioning | ✅ | |
| Per-event override (the 103 configurable events) | | ✅ |
| Digest / roll-up frequency (real-time vs daily) | | ✅ |
| Snooze / quiet hours | | ✅ (Proposed) |

- **Admin-set defaults vs user self-service:** Admins (Sys Admin) set the recommended default preset + channel state per role at provisioning (see §12 defaults). Users then self-serve overrides within allowed bounds. Locked events cannot be turned off at any level.
- **LP grant model (Flagged for Review):** LPs receive notifications only in "loan-tagged scope mode," which an LO permissions per loan. Exact granting mechanism ties to the RBAC module (§17, §20).

### 11e. Permission matrix table (Standard PRD format)

| Permission Area | Rule |
|---|---|
| Visibility | Role × channel matrix + scope (loan/branch/org). |
| Creation | System-generated only (no user-created notifications in P0). |
| Editing (preferences) | User edits own preset + channel toggles; Admin edits role defaults. |
| Locked events | 16 `Configurable=No` events cannot be disabled by any user. |
| Triggering | Events fire from user actions, system, time-based jobs, or external callbacks — not manually triggered by users in P0. |
| Exporting | N/A in P0 (reporting P2). |
| Impersonation | **Flagged for Review** — if Sys Admin impersonates, do they see the impersonated user's notification state? Tie to RBAC impersonation rules. |
| Audit | Communiques, security, regulatory deliveries + all preference changes logged. |

---

## 12. Preset System Spec

**4 cumulative levels** (each higher level includes all lower). Default = **Standard**.

| Preset | Includes | Excludes (typical) |
|---|---|---|
| **Off** | Email communiques only (regulated). | All in-app notifications. |
| **Critical only** (`C`) | Approvals/denials, KYC failed, license expired, CTC, adverse action, SLA breaches, rescissions, all communiques. | Status changes, doc uploads, confirmations, collab, platform announcements. |
| **Standard** (`S`) ← DEFAULT | Critical + invitations, KYC initiated/pending/approved, doc events, prequal stages, comments/mentions, license expiring, program changes, milestones. | 2FA configured, email verified, doc-uploaded (daily roll-up), AM-internal queue events. |
| **All activity** (`A`) | Every confirmation incl. 2FA, email verified, every status change. | Nothing. High-noise — power users / Mgr roles. |

**Preset distribution across catalog:** `C` = 52 events, `S` = 56, `A` = 11 (cumulative semantics: C events also fire in S and A).

**Recommended Admin Defaults by Role** (from Registry "Preset Defaults" sheet):

| Role | Default Preset | In-App | Email | User-configurable? | Notes |
|---|---|---|---|---|---|
| Sys Admin (Homium) | Standard | On | On | Yes | Wide visibility; can opt down for noise. |
| Branch / Orig. Manager | Critical only | On | On | Yes | Critical events in their branch; can upgrade. |
| Loan Officer (LO) | Standard | On | On | Yes | Primary owner of loan + borrower activity. |
| Loan Processor (LP) | Standard | On | On | Yes (LO can grant) | LO permissions tagged LPs to receive same notifications. |
| Platform Operator (AM) | Standard | On | **Off** | Yes | In-app primary; email default off. |

> **Note:** AM is folded under the Sys Admin column in the event matrix but carries its own recommended default (email off). Reconcile in implementation.

---

## 13. State / Lifecycle

**Notification states (per recipient):**

```
unread ──read──▶ read
  │                │
  │ (system_alert) │
  └──dismiss──▶ dismissed
  (action_req=Yes) ──resolve action──▶ actioned
```

| State | Entry trigger | Notes |
|---|---|---|
| unread | Delivery created. | Increments bell count. |
| read | User views item. | Decrements count. |
| dismissed | User dismisses a `system_alert` banner. | Bell entry may persist until read (see §20). |
| actioned | `Action Req?=Yes` event's underlying action completed. | Distinct from read; closes the CTA. |

**External async sub-states (KYC example):** `pending → approved | failed` — each may be its own Registry event; the failed branch is typically locked/critical.

---

## 14. Screen Specs (Desktop P0)

### 14a. Bell + unread badge
- **Purpose:** Persistent entry point + unread count.
- **Default:** Badge shows unread count (action-required emphasized).
- **CTA:** Opens dropdown.
- **Empty:** No badge when zero unread.

### 14b. Notification dropdown
- **Default view:** Most recent N items, unread first; action-required pinned/emphasized.
- **CTAs:** Item click → entity; "View all" → full feed; "Mark all read."
- **States:** Loading skeleton; empty ("No notifications"); error (retry).

### 14c. Full notification feed
- **Purpose:** Complete, filterable history.
- **Default sort:** Newest first; unread emphasized.
- **Filters:** Category, Type, Phase, Action-required, Unread-only. **Scope auto-applied** (LO/LP loan-scoped, Mgr branch-scoped).
- **Columns/fields:** icon (category/type), title, message, loan id + borrower (where applicable), phase, time, state.
- **States:** empty / loading / error per above.
- **Permission gate:** Items outside the user's matrix/scope are never returned.

### 14d. Dismissable banner (`system_alert`)
- **Purpose:** Surface platform/RBAC/profile alerts at top of app.
- **Behavior:** Dismiss control; mirrored to bell.
- **Validation:** Locked critical-security alerts may be non-dismissable (Flagged for Review).

### 14e. Preference center (P0)
- **Purpose:** Self-service control of volume + channels.
- **Default view:** Current preset + channel toggles, with the role's recommended default indicated.
- **Controls:** Preset selector (Off/Critical/Standard/All); in-app toggle; email toggle.
- **Validation:** Downgrade warning below Standard; locked events shown as "always on" (read-only).
- **P1 (out of P0):** per-event override grid, digest frequency.
- **States:** save confirmation; error on save.

---

## 15. Validation Rules

| Action | Rule |
|---|---|
| Disable a locked event | Hard block — `Configurable=No` events cannot be turned off. Shown read-only as "always on." |
| Downgrade preset below Standard | Warning: lists categories of events that will stop (milestones, collab, doc events). |
| Turn off all channels | Warning: communiques (email) still deliver where regulated; confirm intent. |
| Banner dismiss on locked critical-security alert | May be blocked (Flagged for Review). |

---

## 16. Edge Cases

1. **LP not tagged on a loan** — receives no notifications for that loan; tagging is the gate (RBAC dependency).
2. **Async KYC** — `pending`, `approved`, `failed` arrive separately; `failed` is typically locked/critical and must surface regardless of preset.
3. **External callback failure/timeout** — DocuSign/CDA/Transfer Agent/MERS/Deutsche Bank callbacks may fail; need retry + an internal-ops alert (Flagged for Review).
4. **Role change mid-flight** — user's scope/role changes; in-flight notifications must re-scope (no leakage of out-of-scope loans).
5. **Borrower has no in-app** — any borrower-targeted event must resolve to email; `I`-only mappings for borrower are invalid.
6. **Recipient with no eligible channel** (`—` for all) — event simply does not deliver to that role; no error.
7. **Daily roll-up referenced but digest is P1** — Standard preset excludes "doc uploaded (daily roll-up)"; in P0 without digest, confirm interim handling (suppress vs send individually). See §20.
8. **AM email default off** — AM relies on in-app; ensure critical/regulatory still reach AM via in-app at minimum.
9. **Duplicate fires** — idempotency on event_id + loan_id + recipient to avoid double-delivery.

---

## 17. Dependencies

| Area | Dependency |
|---|---|
| RBAC module | Role definitions, LO/LP loan-tagging, branch/org scope, impersonation rules. **Hard dependency.** |
| Origination pipeline | Phase events (Section B) must emit on stage transitions; phase names must match. |
| Email service | Transactional email delivery + templates for communiques. |
| External integrations | SecuritizeID (KYC), DocuSign (e-sign), CDA Vendor, NMLS (license), Transfer Agent/Securitize (minting), Deutsche Bank (custodian), MERS — webhook/callback handling. |
| Design canon | Bell, banner, feed, preference center components per `homium-design-canon/` (navy brand, tokens). |
| Audit/logging | Audit log service for communiques, security, regulatory, and preference changes. |

---

## 18. Risks & Guardrails

| Risk | Guardrail |
|---|---|
| Notification fatigue → ignored signals. | Preset defaults tuned per role; locked set kept minimal (16); action-required visually distinct. |
| Missed regulatory comms. | Communiques + locked events bypass all filters; mandatory audit log. |
| Scope creep into investors. | Investors explicitly Future State; separate registry required. |
| Permission leakage (wrong loan/role). | Scope enforced server-side on query; role-change re-scoping; idempotency. |
| Digest gap in P0. | Decide interim handling for roll-up events before launch (§20). |
| Mobile drift. | Mobile reconciled to Registry taxonomy in P1; demo view's 4-type model deprecated. |

---

## 19. Prioritization

| Priority | Requirement | Rationale |
|---|---|---|
| **P0** | Event catalog from Registry; routing by role × channel + scope; locked-event bypass; in-app + email delivery; bell + dropdown + feed + banners; 4-level presets + channel toggles; action-required treatment; admin role defaults; audit for communiques/security/regulatory + pref changes. | Core MVP — reliable, permissioned, controllable delivery. |
| **P1** | Per-event override center; digest/roll-up frequency; mobile parity (reconcile demo view); snooze. | Important volume control + reach; not blocking. |
| **P2** | Notification analytics (delivery rates, action-required aging); quiet hours. | Future-state operational insight. |
| **Future State** | Investor/program-sponsor notifications + portal; push; SMS; Slack/Teams. | Separate registry/infra. |

---

## 20. Open Questions

| # | Question | Owner | Impact | Working Assumption |
|---|---|---|---|---|
| Q1 | Which events are emitted by Homium services vs external webhooks vs scheduled jobs? Registry lists actor/source but not emit mechanism for all. | Eng | Routing reliability | Mixed; map per event during build. |
| Q2 | Exact LP "loan-tagged scope" granting mechanism — does LO grant per-loan, and where in RBAC? | Product + RBAC | LP visibility | LO grants per-loan via RBAC. |
| Q3 | Do `system_alert` banners require per-user dismiss persistence, or auto-expire? | Design + Eng | Banner UX | Persist dismiss; bell entry until read. |
| Q4 | P0 ships without digest. How are "daily roll-up" events handled in P0 — suppress, or send individually? | Product | Standard preset noise | Send individually in P0; roll-up in P1. |
| Q5 | Which internal role(s) receive the in-app mirror of borrower-facing communiques? | Compliance + Product | Audit/oversight | LO + Sys Admin/AM on the loan. |
| Q6 | Impersonation — does an impersonating Sys Admin see the impersonated user's notification state? | RBAC | Audit/permissions | Read-only view; actions logged. |
| Q7 | Are any locked critical-security banners non-dismissable? | Security | Banner validation | Yes for critical-security. |
| Q8 | Reporting scope/timing (P2) — what metrics do ops actually need? | Ops | Future | Delivery + action-aging, P2. |

---

## 21. Acceptance Criteria

- [ ] Every Registry event delivers to exactly the roles/channels in its matrix, narrowed by scope.
- [ ] The 16 locked (`Configurable=No`) events deliver regardless of preset/channel state.
- [ ] Each of the 4 presets filters configurable events per cumulative semantics; Standard is default.
- [ ] Admin role defaults applied on provisioning; user overrides (preset + channel) persist.
- [ ] `Action Req?=Yes` events render a distinct CTA and reach an `actioned` state on resolution.
- [ ] All `official_communique` events send email + create internal mirror + write an audit entry.
- [ ] Bell unread count, dropdown, full feed (with category/type/phase/action/unread filters + auto scope), banners, and preference center function on desktop.
- [ ] Preference changes are audited; downgrade-below-Standard warning shows.
- [ ] No out-of-scope loan/role data leaks across users (server-side scope enforcement).
- [ ] Investor notifications are absent (confirmed Future State).

---

## 22. Handoff Checklist

- [x] Scope confirmed (P0 decisions locked: presets-only, desktop-first, in-app+email, investors deferred).
- [x] Open questions listed (§20).
- [x] Assumptions labeled (Confirmed / Working Assumption / Proposed / Flagged / Out of Scope / Future State).
- [x] Screen specs included (§14).
- [x] Permissions included (§11).
- [x] Validation included (§15).
- [x] Edge cases included (§16).
- [x] Dependencies listed (§17).
- [x] P0/P1/P2 included (§19).
- [x] Unresolved items flagged (§20).
- [ ] Eng/Design/Compliance review of open questions — **next step**.

---

*Grounded entirely in `assets/specs/Notification_Events_Registry_v2.xlsx`. No events, fields, or roles invented beyond proposed schema field names (labeled Working Assumption) and items explicitly flagged Proposed/Future State.*
