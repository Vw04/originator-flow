# Claude Code Implementation Brief: Permissions Tab Redesign

**Goal:** Rework the company page Permissions tab and supporting flows to implement a three-layer RBAC model (Company Default → Branch Default → User-in-Branch Override) with template-based defaults.

---

## Scope of Changes

### 1. Bug Fixes (do first)
- [ ] Fix typo: `"3 companyies"` → `"3 companies"` in the company tab/label on the company page.

### 2. Rename
- [ ] Rename the **"Select a Role"** screen/flow to **"Select a User Type"** throughout the codebase (route, component name, headings, breadcrumbs, strings).

### 3. Data Model Changes
Replace the flat `role` field on users with:
```
User {
  id, company_id,
  user_type: enum('loan_officer','generic','system_admin','platform_operator','program_admin','investor'),
  global_tags: string[]   // optional, advisory only
}

Company {
  id, name,
  default_permission_template_id  // Company Default layer
}

Branch {
  id, company_id, name,
  default_permission_template_id  // Branch Default layer (nullable → falls through to company)
}

BranchAssignment {
  user_id, branch_id,            // composite PK
  tags: string[],                 // per-branch tags
  template_id: string,            // resolved template at time of assignment
  override_permissions: jsonb     // null = pure inherit; object = user-in-branch overrides
}

PermissionTemplate {
  id, name, description,
  permissions: {
    [action]: {
      [object]: 'grant' | 'deny' | 'inherit',
      scope: 'own' | 'tagged' | 'assigned_los' | 'branch' | null
    }
  }
}

AuditEntry {
  id, timestamp, actor_user_id, branch_id, target_user_id,
  action_type, before, after
}
```

### 4. User Types (final list)
Only these six. Only `loan_officer` has special loan-ownership semantics.
```
loan_officer | generic | system_admin | platform_operator | program_admin | investor
```

### 5. Permission Templates to Ship
Seed these in the DB; make them non-editable (admins can clone to create custom):
- `lo_own_only` — LO, view/edit/create/submit own loans only
- `lo_full_branch` — LO, view/edit all in branch; create/submit own
- `lo_tagged_only` — LO, view/edit only loans they're tagged on
- `processor_assigned` — Generic, view/edit loans of assigned LOs; create for LO
- `processor_branch` — Generic, view/edit all branch loans; create for any LO
- `branch_manager_read` — Generic, view all branch loans, no edit
- `branch_manager_full` — Generic, full branch access + manage branch users
- `compliance_observer` — Generic, view-only, all branch loans
- `custom` — Admin-defined (opens matrix editor)

---

## UI Changes

### Company Page — Tab Structure
```
Overview | Branches | Users | Permissions | Programs | Settings
```

### Permissions Tab Layout
Top-to-bottom, single scrollable page:

**A. Header**
- Title: "Permissions"
- Subtitle: "Permissions resolve from company defaults → branch defaults → per-user overrides. The most specific setting wins."

**B. Company Default Card**
- Shows currently applied template name + summary of key grants.
- `Edit` button → opens Template Picker modal.
- Small `i` tooltip: "Applies to all users in this company unless overridden."

**C. Branches List**
- Card or table, one row per branch. Columns:
  - Branch name
  - Effective default template (badge: `Inherited` or `Override`)
  - User count
  - Custom override count (users with explicit per-user overrides)
  - `→` to drill into Branch Permissions view
- Sort by: name, user count, override count.

**D. Recently Modified**
- Last 5 permission audit entries. Actor, timestamp, one-line diff.
- Link: "View full audit log"

### Branch Permissions View (drill-down)
Reached from Permissions tab row click OR from Branches tab row click.

**Header:** breadcrumb `Company › Branches › [Branch Name] › Permissions`

**Section 1 — Branch Default Card**
- Current template name, summary, `Edit` button.
- Badge showing inherit-from-company vs overridden.

**Section 2 — Users in this Branch Table**
| Name | User Type | Tags | Effective Template | Status | Actions |
|------|-----------|------|--------------------|--------|---------|
| ...  | badge     | chips| template name      | `Inherited` or `Custom` | `Edit` |

Click a row → opens **User-in-Branch Edit Panel** (side panel, not full page).

### User-in-Branch Edit Panel (side panel)
Three zones, top to bottom:

1. **Context header** — Name, User Type badge, tags-in-this-branch chips, assignment date. Read-only.
2. **Template selector** — Dropdown. Changing template shows diff confirmation before applying.
3. **Permission matrix** — Actions × Objects grid. Each cell is a three-state control:
   - `Inherit` (shows the resolved value in muted text)
   - `Grant`
   - `Deny`
4. **Effective preview** (right side if space, below if narrow) — Live-updates as user toggles. Shows exactly what this user will be able to do in this branch.
5. **Footer** — `Reset to Inherit` (wipes overrides), `Cancel`, `Save`.

### User Profile Page — Assignments Section
On the single-user view, add an **Assignments** section listing every branch the user belongs to:
```
Branch Name | Tags | Template | Status (Inherited/Custom) | Last Modified | Edit
```

---

## Behavioral Rules (implement as invariants)

1. **Permission resolution order:** user-in-branch override → branch default → company default. First non-inherit value wins.
2. **Deny always wins.** If any layer denies, the final result is deny.
3. **Permissions are scoped per branch.** When a user navigates between branches, their effective permission set must swap completely. No cross-branch leakage — ever.
4. **Tags are advisory.** They suggest templates at assignment time but do not themselves grant permissions. Removing a tag does not change permissions.
5. **Only Loan Officers can own loans.** When a non-LO creates a loan, they must select an LO as owner. The creator is audit-logged as creator; ownership goes to the LO.
6. **Editing a branch default only affects Inherit users.** Users with explicit overrides keep their overrides. Before saving, show a confirmation with the count of affected users.
7. **Every permission change writes to audit log.** Include: actor, target user, branch, action, before/after, timestamp.
8. **Program enablement gates override permissions.** If a program is suspended/retired for the company, loan creation under that program is blocked regardless of user permissions.

---

## UX Principles (non-negotiable)

- **Always show the resolved effective state.** Any screen that edits permissions must show what the user will actually be able to do, not just the layer being edited.
- **Inherit is the default.** Empty state for any override = inherit. Admins must actively choose to diverge.
- **Badges over text.** Use `Inherited` / `Custom` / `Override` badges consistently for the status dimension.
- **Dangerous actions need confirmation.** Changing a template, changing a branch default, deprecating a user — all need a modal showing the blast radius.
- **Breadcrumbs everywhere.** Permission editing happens at multiple levels. Users need to know where they are.

---

## Out of Scope (defer)

- Time-boxed / auto-expiring overrides (vacation delegation)
- Impersonation mode
- User-initiated "request permission" workflow
- Per-field permission granularity (below loan-object level)
- Loan ownership reassignment flows

---

## Acceptance Criteria

- [ ] `"3 companyies"` typo fixed
- [ ] "Select a Role" renamed to "Select a User Type" everywhere
- [ ] User type options are exactly the six listed above
- [ ] Permissions tab shows Company Default card + Branches list + Recently Modified
- [ ] Clicking a branch from Permissions tab opens Branch Permissions view
- [ ] Branch Permissions view lists all assigned users with their effective template and inherit/custom status
- [ ] Clicking a user opens the User-in-Branch Edit Panel with three zones
- [ ] Three-state inherit/grant/deny controls work correctly
- [ ] Effective permissions preview updates live
- [ ] Resolution order implemented: user → branch → company
- [ ] Deny-wins rule enforced
- [ ] Changing a branch default only affects inherit users (with confirmation)
- [ ] Audit log entry written on every permission mutation
- [ ] User profile page shows Assignments section with per-branch status
- [ ] Permissions do not leak across branches when user switches branch context
- [ ] All nine seed templates exist and are selectable
