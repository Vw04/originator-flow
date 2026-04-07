/* ============================================================
   HOMIUM ORIGINATOR FLOW — Company Permissions Workbench
   Layout: Left hierarchy tree + Right inline editor panel
   Three-layer RBAC: Company Default → Branch Default → User Override
   ============================================================ */

const CompanyPermissionsView = {
  _companyId:        null,
  _selectedLevel:    'company',  // 'company' | 'branch' | 'user'
  _selectedBranchId: null,
  _selectedUserId:   null,
  _pendingOverrides: {},
  _pendingTemplateId: null,
  _pendingTags:      null,
  _expandedBranches: {},         // { branchId: true } — which branches show their users

  render(companyId) {
    if (this._companyId !== companyId) {
      this._companyId       = companyId;
      this._selectedLevel   = 'company';
      this._selectedBranchId = null;
      this._selectedUserId  = null;
      this._pendingOverrides = {};
      this._pendingTemplateId = null;
      this._pendingTags     = null;
      this._expandedBranches = {};
      // Auto-expand all branches
      const branches = State.getBranchesByCompany(companyId);
      branches.forEach(b => { this._expandedBranches[b.id] = true; });
    }

    const sidebar  = this._renderSidebar();
    const mainPanel = this._renderMainPanel();

    return `
      <div class="pw-layout">
        <div class="pw-sidebar">${sidebar}</div>
        <div class="pw-main">${mainPanel}</div>
      </div>`;
  },

  /* ================================================================
     SIDEBAR — Company → Branches → Users hierarchy tree
  ================================================================ */
  _renderSidebar() {
    const company  = State.getCompany(this._companyId);
    const branches = State.getBranchesByCompany(this._companyId);

    const coTemplateId = company?.defaultPermissionTemplateId;
    const coTemplate   = coTemplateId ? State.getTemplate(coTemplateId) : null;
    const coActive     = this._selectedLevel === 'company';

    const branchItems = branches.map(br => {
      const brTemplateId = br.defaultPermissionTemplateId;
      const brTemplate   = brTemplateId ? State.getTemplate(brTemplateId) : null;
      const brActive     = this._selectedLevel === 'branch' && this._selectedBranchId === br.id;
      const expanded     = this._expandedBranches[br.id];
      const assignments  = State.getAssignmentsByBranch(br.id);
      const customCount  = assignments.filter(a => a.templateId || Object.keys(a.overridePermissions).length > 0).length;

      const userItems = expanded ? assignments.map(a => {
        const user   = State.getUser(a.userId);
        if (!user) return '';
        const uActive = this._selectedLevel === 'user' && this._selectedUserId === a.userId && this._selectedBranchId === br.id;
        const hasOverride = a.templateId || Object.keys(a.overridePermissions).length > 0;
        return `
          <div class="pw-tree-user ${uActive ? 'pw-tree-active' : ''}"
               onclick="CompanyPermissionsView.selectUser('${a.userId}', '${br.id}')">
            <div class="pw-tree-user-avatar" style="background:${avatarColor(user.role)}">${Display.initials(user)}</div>
            <div class="pw-tree-user-info">
              <div class="pw-tree-user-name">${Display.fullName(user)}</div>
              <div class="pw-tree-user-sub">${hasOverride ? '<span class="pw-badge-custom">Custom</span>' : '<span class="pw-badge-inherit">Inherited</span>'}</div>
            </div>
          </div>`;
      }).join('') : '';

      return `
        <div class="pw-tree-branch-wrap">
          <div class="pw-tree-branch ${brActive ? 'pw-tree-active' : ''}"
               onclick="CompanyPermissionsView.selectBranch('${br.id}')">
            <div class="pw-tree-branch-toggle" onclick="event.stopPropagation();CompanyPermissionsView.toggleBranch('${br.id}')">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"
                   style="transform:${expanded ? 'rotate(90deg)' : 'rotate(0deg)'};transition:transform .15s">
                <path d="M3 2l4 3-4 3"/>
              </svg>
            </div>
            <div class="pw-tree-branch-icon">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="1" y="3" width="10" height="8" rx="1"/><path d="M4 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/>
              </svg>
            </div>
            <div style="flex:1;min-width:0">
              <div class="pw-tree-branch-name">${br.name}</div>
              <div class="pw-tree-branch-sub">
                ${brTemplate ? brTemplate.name : `<span style="color:var(--color-text-muted)">Inherited</span>`}
                ${customCount > 0 ? `· <span style="color:var(--color-accent)">${customCount} custom</span>` : ''}
              </div>
            </div>
          </div>
          ${expanded ? `<div class="pw-tree-users">${userItems}</div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="pw-tree-company ${coActive ? 'pw-tree-active' : ''}"
           onclick="CompanyPermissionsView.selectCompany()">
        <div class="pw-tree-co-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="4" width="12" height="9" rx="1"/><path d="M4 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/>
            <path d="M5 8h4M5 11h4"/>
          </svg>
        </div>
        <div style="flex:1;min-width:0">
          <div class="pw-tree-co-name">${company?.name || 'Company'}</div>
          <div class="pw-tree-co-sub">
            Default: ${coTemplate ? coTemplate.name : '<span style="color:var(--color-text-muted)">Not set</span>'}
          </div>
        </div>
      </div>

      <div class="pw-tree-divider"></div>
      <div class="pw-tree-section-label">Branches</div>

      ${branchItems}`;
  },

  /* ================================================================
     MAIN PANEL — switches based on selected level
  ================================================================ */
  _renderMainPanel() {
    if (this._selectedLevel === 'company') return this._renderCompanyPanel();
    if (this._selectedLevel === 'branch')  return this._renderBranchPanel();
    if (this._selectedLevel === 'user')    return this._renderUserPanel();
    return '';
  },

  /* ---- Company-level panel ---- */
  _renderCompanyPanel() {
    const company = State.getCompany(this._companyId);
    const coTemplateId = company?.defaultPermissionTemplateId;
    const coTemplate   = coTemplateId ? State.getTemplate(coTemplateId) : null;
    const branches     = State.getBranchesByCompany(this._companyId);

    const templateSelect = this._renderTemplateSelect(coTemplateId,
      `CompanyPermissionsView._applyCompanyDefault(this.value)`, true);

    // Propagation summary
    const inheritingBranches = branches.filter(b => !b.defaultPermissionTemplateId);
    const customBranches     = branches.filter(b => !!b.defaultPermissionTemplateId);

    const propagationRows = branches.map(br => {
      const isCustom = !!br.defaultPermissionTemplateId;
      const effectiveTemplate = isCustom
        ? State.getTemplate(br.defaultPermissionTemplateId)
        : coTemplate;
      const assignments = State.getAssignmentsByBranch(br.id);
      return `
        <div class="pw-prop-row">
          <div class="pw-prop-branch">${br.name}</div>
          <div class="pw-prop-template">
            ${effectiveTemplate ? effectiveTemplate.name : '<span style="color:var(--color-text-muted)">None</span>'}
          </div>
          <div class="pw-prop-badge">
            ${isCustom
              ? '<span class="pw-badge-custom">Branch override</span>'
              : '<span class="pw-badge-inherit">Inherits this default</span>'}
          </div>
          <div class="pw-prop-users" style="font-size:12px;color:var(--color-text-muted)">${assignments.length} users</div>
        </div>`;
    }).join('');

    const matrixPreview = coTemplate ? this._renderMatrixPreview(coTemplate.defaultMatrix) : `
      <div style="padding:32px;text-align:center;color:var(--color-text-muted);font-size:13px">
        No default template set. Branches will have no permissions unless explicitly configured.
      </div>`;

    return `
      <div class="pw-panel-header">
        <div class="pw-panel-breadcrumb">Company</div>
        <div class="pw-panel-title">${company?.name}</div>
        <div class="pw-panel-subtitle">Set the default permissions inherited by all branches unless overridden.</div>
      </div>

      <div class="pw-panel-body">
        <!-- Template selector -->
        <div class="pw-section">
          <div class="pw-section-label">Company Default Template</div>
          <div class="pw-template-selector-row">
            ${templateSelect}
          </div>
          ${coTemplate ? `
            <div class="pw-template-desc">${coTemplate.description}</div>
          ` : `
            <div class="pw-template-desc" style="color:var(--color-text-muted)">No default selected. Branches must have their own template or users will have no permissions.</div>
          `}
        </div>

        <!-- Propagation to branches -->
        <div class="pw-section">
          <div class="pw-section-label" style="margin-bottom:10px">
            Propagation
            <span style="font-weight:400;color:var(--color-text-muted);margin-left:6px">
              ${inheritingBranches.length} inheriting · ${customBranches.length} overridden
            </span>
          </div>
          <div class="pw-prop-table">
            ${propagationRows}
          </div>
        </div>

        <!-- Permission matrix preview -->
        ${coTemplate ? `
          <div class="pw-section">
            <div class="pw-section-label">Template Permission Matrix</div>
            <div class="pw-section-hint">What users get by default when this template is applied.</div>
            ${matrixPreview}
          </div>
        ` : ''}
      </div>`;
  },

  /* ---- Branch-level panel ---- */
  _renderBranchPanel() {
    const branch     = State.getBranch(this._selectedBranchId);
    const company    = State.getCompany(this._companyId);
    const brTemplateId = branch?.defaultPermissionTemplateId;
    const coTemplateId = company?.defaultPermissionTemplateId;
    const coTemplate   = coTemplateId ? State.getTemplate(coTemplateId) : null;
    const brTemplate   = brTemplateId ? State.getTemplate(brTemplateId) : null;
    const effectiveTemplate = brTemplate || coTemplate;
    const assignments = State.getAssignmentsByBranch(this._selectedBranchId);
    const inheritCount = assignments.filter(a => !a.templateId).length;

    const templateSelect = this._renderTemplateSelect(brTemplateId,
      `CompanyPermissionsView._applyBranchDefault(this.value)`, true,
      `— Inherit from Company (${coTemplate ? coTemplate.name : 'None'}) —`);

    const userRows = assignments.map(a => {
      const user = State.getUser(a.userId);
      if (!user) return '';
      const hasOverride = a.templateId || Object.keys(a.overridePermissions).length > 0;
      const uActive = this._selectedLevel === 'user' && this._selectedUserId === a.userId;
      return `
        <div class="pw-user-row ${uActive ? 'pw-user-row-active' : ''}"
             onclick="CompanyPermissionsView.selectUser('${a.userId}', '${this._selectedBranchId}')">
          <div class="pw-tree-user-avatar" style="background:${avatarColor(user.role)}">${Display.initials(user)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600">${Display.fullName(user)}</div>
            <div style="font-size:11px;color:var(--color-text-muted)">${Display.roleName(user.role)}
              ${a.tags.length ? '· ' + a.tags.join(', ') : ''}
            </div>
          </div>
          <div>
            ${hasOverride
              ? `<span class="pw-badge-custom">Custom</span>`
              : `<span class="pw-badge-inherit">Inherited</span>`}
          </div>
          <div style="font-size:11px;color:var(--color-text-muted);min-width:90px;text-align:right">
            ${a.templateId ? (State.getTemplate(a.templateId)?.name || '—') : (effectiveTemplate ? effectiveTemplate.name : '—')}
          </div>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();CompanyPermissionsView.selectUser('${a.userId}', '${this._selectedBranchId}')">Edit</button>
        </div>`;
    }).join('');

    const matrixPreview = effectiveTemplate ? this._renderMatrixPreview(effectiveTemplate.defaultMatrix) : `
      <div style="padding:24px;text-align:center;color:var(--color-text-muted);font-size:13px">
        No effective template. Users in this branch will have no permissions.
      </div>`;

    return `
      <div class="pw-panel-header">
        <div class="pw-panel-breadcrumb">
          <span class="pw-breadcrumb-link" onclick="CompanyPermissionsView.selectCompany()">${company?.name}</span>
          <span class="pw-breadcrumb-sep">›</span>
          Branch
        </div>
        <div class="pw-panel-title">${branch?.name}</div>
        <div class="pw-panel-subtitle">Override or inherit the company default for this branch.</div>
      </div>

      <div class="pw-panel-body">
        <!-- Inheritance chain -->
        <div class="pw-section">
          <div class="pw-section-label">Branch Default Template</div>
          <div class="pw-inherit-chain">
            <div class="pw-inherit-node ${!brTemplateId ? 'pw-inherit-active' : 'pw-inherit-dim'}">
              <div class="pw-inherit-level">Company</div>
              <div class="pw-inherit-value">${coTemplate ? coTemplate.name : '<span style="opacity:.5">Not set</span>'}</div>
            </div>
            <div class="pw-inherit-arrow">→</div>
            <div class="pw-inherit-node ${brTemplateId ? 'pw-inherit-active' : 'pw-inherit-dim'}">
              <div class="pw-inherit-level">This Branch</div>
              <div class="pw-inherit-value">${brTemplate ? brTemplate.name : '<span style="opacity:.5">Inheriting</span>'}</div>
            </div>
            <div class="pw-inherit-arrow">→</div>
            <div class="pw-inherit-node pw-inherit-result">
              <div class="pw-inherit-level">Effective</div>
              <div class="pw-inherit-value">${effectiveTemplate ? effectiveTemplate.name : '<span style="opacity:.5">None</span>'}</div>
            </div>
          </div>

          <div class="pw-template-selector-row" style="margin-top:16px">
            ${templateSelect}
            ${brTemplateId ? `
              <button class="btn btn-secondary btn-sm pw-clear-btn"
                      onclick="CompanyPermissionsView._applyBranchDefault('')"
                      title="Remove override, inherit from company">Clear override</button>
            ` : ''}
          </div>
          ${effectiveTemplate ? `<div class="pw-template-desc">${effectiveTemplate.description}</div>` : ''}
          ${inheritCount > 0 ? `
            <div class="pw-affect-note">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="5"/><path d="M6 4v3M6 8.5v.5"/></svg>
              ${inheritCount} user${inheritCount !== 1 ? 's' : ''} set to inherit will be affected by changes to this default.
            </div>
          ` : ''}
        </div>

        <!-- Users in branch -->
        <div class="pw-section">
          <div class="pw-section-label" style="margin-bottom:10px">
            Users
            <span style="font-weight:400;color:var(--color-text-muted);margin-left:6px">${assignments.length}</span>
          </div>
          <div class="pw-user-list">
            ${userRows || '<div style="padding:16px;color:var(--color-text-muted);font-size:13px">No users in this branch.</div>'}
          </div>
        </div>

        <!-- Matrix preview -->
        ${effectiveTemplate ? `
          <div class="pw-section">
            <div class="pw-section-label">Effective Permission Matrix</div>
            <div class="pw-section-hint">Applied to all users set to Inherit in this branch.</div>
            ${matrixPreview}
          </div>
        ` : ''}
      </div>`;
  },

  /* ---- User-level panel ---- */
  _renderUserPanel() {
    const assignment = State.getAssignment(this._selectedUserId, this._selectedBranchId);
    const user    = State.getUser(this._selectedUserId);
    const branch  = State.getBranch(this._selectedBranchId);
    const company = State.getCompany(this._companyId);
    if (!user || !branch) return '<div class="pw-panel-body"><p>User not found.</p></div>';

    const coTemplateId = company?.defaultPermissionTemplateId;
    const brTemplateId = branch?.defaultPermissionTemplateId;
    const uTemplateId  = this._pendingTemplateId !== null
      ? this._pendingTemplateId
      : (assignment?.templateId || '');

    const coTemplate   = coTemplateId ? State.getTemplate(coTemplateId) : null;
    const brTemplate   = brTemplateId ? State.getTemplate(brTemplateId) : null;
    const uTemplate    = uTemplateId  ? State.getTemplate(uTemplateId)  : null;
    const effectiveTemplate = uTemplate || brTemplate || coTemplate;

    const currentTags = this._pendingTags !== null
      ? this._pendingTags
      : (assignment?.tags || []).join(', ');

    const overrides = assignment?.overridePermissions || {};
    const hasOverrides = Object.keys(overrides).length > 0;

    // Inheritance chain
    const inheritChain = `
      <div class="pw-inherit-chain" style="margin-bottom:20px">
        <div class="pw-inherit-node ${!uTemplateId && !hasOverrides ? 'pw-inherit-active' : 'pw-inherit-dim'}">
          <div class="pw-inherit-level">Company</div>
          <div class="pw-inherit-value">${coTemplate ? coTemplate.name : '<span style="opacity:.5">None</span>'}</div>
        </div>
        <div class="pw-inherit-arrow">→</div>
        <div class="pw-inherit-node ${brTemplateId && !uTemplateId && !hasOverrides ? 'pw-inherit-active' : 'pw-inherit-dim'}">
          <div class="pw-inherit-level">Branch</div>
          <div class="pw-inherit-value">${brTemplate ? brTemplate.name : '<span style="opacity:.5">Inherited</span>'}</div>
        </div>
        <div class="pw-inherit-arrow">→</div>
        <div class="pw-inherit-node ${(uTemplateId || hasOverrides) ? 'pw-inherit-active' : 'pw-inherit-dim'}">
          <div class="pw-inherit-level">This User</div>
          <div class="pw-inherit-value">
            ${uTemplate ? uTemplate.name : (hasOverrides ? 'Custom overrides' : '<span style="opacity:.5">Inheriting</span>')}
          </div>
        </div>
        <div class="pw-inherit-arrow">→</div>
        <div class="pw-inherit-node pw-inherit-result">
          <div class="pw-inherit-level">Effective</div>
          <div class="pw-inherit-value">${effectiveTemplate ? effectiveTemplate.name : (hasOverrides ? 'Custom' : '<span style="opacity:.5">None</span>')}</div>
        </div>
      </div>`;

    // Template selector
    const templateSelect = this._renderTemplateSelect(uTemplateId,
      `CompanyPermissionsView._onPanelTemplateChange(this.value)`, false,
      `— Inherit from Branch/Company —`);

    // 3-state override matrix
    const scopes  = DEMO_DATA.permissionMatrix.scopes;
    const actions = DEMO_DATA.permissionMatrix.actions;

    const matrixRows = scopes.map(scope => {
      const cells = actions.map(action => {
        const key = `${scope}-${action}`;
        const pendingVal = this._pendingOverrides.hasOwnProperty(key)
          ? this._pendingOverrides[key]
          : (overrides.hasOwnProperty(key) ? overrides[key] : null);

        return `
          <td class="pw-matrix-cell">
            <div class="btn-group-3state">
              <button class="${pendingVal === true  ? 'active-grant'   : ''}" onclick="CompanyPermissionsView._setOverride('${key}', true)"  title="Grant">✓</button>
              <button class="${pendingVal === false ? 'active-deny'    : ''}" onclick="CompanyPermissionsView._setOverride('${key}', false)" title="Deny">✗</button>
              <button class="${pendingVal === null || pendingVal === undefined ? 'active-inherit' : ''}" onclick="CompanyPermissionsView._setOverride('${key}', null)" title="Inherit">–</button>
            </div>
          </td>`;
      }).join('');
      return `<tr>
        <td class="pw-matrix-scope">${scope}</td>${cells}
      </tr>`;
    }).join('');

    const actionHeaders = actions.map(a =>
      `<th class="pw-matrix-action">${a.replace('/', '/<wbr>')}</th>`
    ).join('');

    // Effective preview
    const resolved = State.resolvePermissions(this._selectedUserId, this._selectedBranchId);
    const preview  = Object.assign({}, resolved);
    Object.entries(this._pendingOverrides).forEach(([k, v]) => {
      if (v !== null) preview[k] = v;
    });

    const previewRows = scopes.map(scope => {
      const cells = actions.map(action => {
        const key = `${scope}-${action}`;
        const val = preview[key];
        return `<td class="pw-matrix-cell" style="text-align:center">
          <span class="${val ? 'perm-cell-grant' : 'perm-cell-deny'}">${val ? '✓' : '✗'}</span>
        </td>`;
      }).join('');
      return `<tr><td class="pw-matrix-scope">${scope}</td>${cells}</tr>`;
    }).join('');

    const pendingCount = Object.keys(this._pendingOverrides).filter(k =>
      this._pendingOverrides[k] !== null
    ).length;

    return `
      <div class="pw-panel-header">
        <div class="pw-panel-breadcrumb">
          <span class="pw-breadcrumb-link" onclick="CompanyPermissionsView.selectCompany()">${company?.name}</span>
          <span class="pw-breadcrumb-sep">›</span>
          <span class="pw-breadcrumb-link" onclick="CompanyPermissionsView.selectBranch('${this._selectedBranchId}')">${branch.name}</span>
          <span class="pw-breadcrumb-sep">›</span>
          User
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="pw-tree-user-avatar pw-avatar-lg" style="background:${avatarColor(user.role)}">${Display.initials(user)}</div>
            <div>
              <div class="pw-panel-title" style="margin-bottom:2px">${Display.fullName(user)}</div>
              <div style="display:flex;gap:6px;align-items:center">
                <span class="badge ${Display.roleClass(user.role)}">${Display.roleName(user.role)}</span>
                ${assignment?.tags?.length ? assignment.tags.map(t =>
                  `<span class="pw-tag">${t}</span>`).join('') : ''}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            ${(uTemplateId || hasOverrides) ? `
              <button class="btn btn-secondary btn-sm" onclick="CompanyPermissionsView._resetToTemplate()">Reset to Default</button>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="pw-panel-body">

        <!-- Inheritance chain -->
        <div class="pw-section">
          <div class="pw-section-label">Permission Source</div>
          ${inheritChain}
        </div>

        <!-- Tags -->
        <div class="pw-section pw-two-col">
          <div>
            <div class="pw-section-label">Tags <span style="font-weight:400;color:var(--color-text-muted)">(advisory only)</span></div>
            <input type="text" id="panel-tags-input" value="${currentTags}"
                   placeholder="e.g. Branch Manager, Loan Processor"
                   oninput="CompanyPermissionsView._onTagsChange(this.value)"
                   class="pw-input">
            <div class="pw-section-hint">Tags are labels — they don't grant permissions directly.</div>
          </div>
          <div>
            <div class="pw-section-label">Template Override</div>
            <div style="display:flex;gap:8px;align-items:center">
              ${templateSelect}
              ${uTemplateId ? `<button class="btn btn-secondary btn-sm pw-clear-btn" onclick="CompanyPermissionsView._onPanelTemplateChange('')">Clear</button>` : ''}
            </div>
            ${uTemplate ? `<div class="pw-template-desc">${uTemplate.description}</div>` : '<div class="pw-section-hint">Uses branch or company default.</div>'}
          </div>
        </div>

        <!-- 3-state override matrix -->
        <div class="pw-section">
          <div class="pw-section-label">
            Fine-grained Overrides
            ${pendingCount > 0 ? `<span class="pw-unsaved-badge">${pendingCount} unsaved</span>` : ''}
          </div>
          <div class="pw-section-hint" style="margin-bottom:10px">
            ✓ Grant &nbsp;✗ Deny &nbsp;– Inherit from template. Per-cell overrides take precedence over templates.
          </div>
          <div class="pw-matrix-wrap">
            <table class="pw-matrix">
              <thead><tr><th></th>${actionHeaders}</tr></thead>
              <tbody>${matrixRows}</tbody>
            </table>
          </div>
        </div>

        <!-- Effective preview -->
        <div class="pw-section">
          <div class="pw-section-label">Effective Permissions Preview</div>
          <div class="pw-section-hint" style="margin-bottom:10px">Resolved result after applying all layers. Deny always wins.</div>
          <div class="pw-matrix-wrap">
            <table class="pw-matrix">
              <thead><tr><th></th>${actionHeaders}</tr></thead>
              <tbody>${previewRows}</tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Sticky save bar -->
      <div class="pw-save-bar">
        <button class="btn btn-secondary" onclick="CompanyPermissionsView.selectBranch('${this._selectedBranchId}')">Cancel</button>
        <button class="btn btn-primary" onclick="CompanyPermissionsView._saveUserPanel()">Save Changes</button>
      </div>`;
  },

  /* ================================================================
     HELPERS
  ================================================================ */
  _renderTemplateSelect(currentId, onchangeExpr, _autoApply, placeholder) {
    const ph = placeholder || '— Select a template —';
    const opts = State.getTemplates().map(t =>
      `<option value="${t.id}" ${t.id === currentId ? 'selected' : ''}>${t.name}</option>`
    ).join('');
    return `
      <select class="pw-template-select" onchange="${onchangeExpr}">
        <option value="">${ph}</option>
        ${opts}
      </select>`;
  },

  _renderMatrixPreview(defaultMatrix) {
    const scopes  = DEMO_DATA.permissionMatrix.scopes;
    const actions = DEMO_DATA.permissionMatrix.actions;
    const headers = actions.map(a => `<th class="pw-matrix-action">${a.replace('/', '/<wbr>')}</th>`).join('');
    const rows = scopes.map(scope => {
      const cells = actions.map(action => {
        const key = `${scope}-${action}`;
        const val = defaultMatrix[key];
        const cls = val === true ? 'perm-cell-grant' : val === false ? 'perm-cell-deny' : 'perm-cell-inherit';
        const sym = val === true ? '✓' : val === false ? '✗' : '–';
        return `<td class="pw-matrix-cell" style="text-align:center"><span class="${cls}">${sym}</span></td>`;
      }).join('');
      return `<tr><td class="pw-matrix-scope">${scope}</td>${cells}</tr>`;
    }).join('');
    return `
      <div class="pw-matrix-wrap">
        <table class="pw-matrix">
          <thead><tr><th></th>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  /* ================================================================
     SELECTION ACTIONS
  ================================================================ */
  selectCompany() {
    this._selectedLevel    = 'company';
    this._selectedBranchId = null;
    this._selectedUserId   = null;
    this._clearPending();
    App.renderView(Router.getCurrentPath());
  },

  selectBranch(branchId) {
    this._selectedLevel    = 'branch';
    this._selectedBranchId = branchId;
    this._selectedUserId   = null;
    this._clearPending();
    App.renderView(Router.getCurrentPath());
  },

  selectUser(userId, branchId) {
    this._selectedLevel    = 'user';
    this._selectedBranchId = branchId;
    this._selectedUserId   = userId;
    this._clearPending();
    App.renderView(Router.getCurrentPath());
  },

  toggleBranch(branchId) {
    this._expandedBranches[branchId] = !this._expandedBranches[branchId];
    App.renderView(Router.getCurrentPath());
  },

  _clearPending() {
    this._pendingOverrides  = {};
    this._pendingTemplateId = null;
    this._pendingTags       = null;
  },

  /* ================================================================
     APPLY ACTIONS (instant — no modal)
  ================================================================ */
  _applyCompanyDefault(templateId) {
    State.setCompanyDefaultTemplate(this._companyId, templateId || null);
    App.renderView(Router.getCurrentPath());
  },

  _applyBranchDefault(templateId) {
    State.setBranchDefaultTemplate(this._selectedBranchId, templateId || null);
    App.renderView(Router.getCurrentPath());
  },

  _onPanelTemplateChange(value) {
    this._pendingTemplateId = value || null;
    App.renderView(Router.getCurrentPath());
  },

  _onTagsChange(value) {
    this._pendingTags = value;
  },

  _setOverride(key, value) {
    this._pendingOverrides[key] = value;
    App.renderView(Router.getCurrentPath());
  },

  _resetToTemplate() {
    this._pendingOverrides = {};
    this._pendingTemplateId = '';  // clear user template override
    // Stage all overrides as null (clear)
    DEMO_DATA.permissionMatrix.scopes.forEach(scope => {
      DEMO_DATA.permissionMatrix.actions.forEach(action => {
        this._pendingOverrides[`${scope}-${action}`] = null;
      });
    });
    App.renderView(Router.getCurrentPath());
  },

  _saveUserPanel() {
    const assignment = State.getAssignment(this._selectedUserId, this._selectedBranchId);
    const tagsInput  = document.getElementById('panel-tags-input');
    const rawTags    = tagsInput
      ? tagsInput.value
      : (this._pendingTags !== null ? this._pendingTags : (assignment?.tags || []).join(', '));
    const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);

    const templateId = this._pendingTemplateId !== null
      ? this._pendingTemplateId
      : (assignment?.templateId || null);

    const baseOverrides = Object.assign({}, assignment?.overridePermissions || {});
    Object.entries(this._pendingOverrides).forEach(([k, v]) => {
      if (v === null) delete baseOverrides[k];
      else baseOverrides[k] = v;
    });

    State.upsertAssignment(this._selectedUserId, this._selectedBranchId, {
      tags, templateId, overridePermissions: baseOverrides,
    });

    this._clearPending();
    App.renderView(Router.getCurrentPath());
  },
};
