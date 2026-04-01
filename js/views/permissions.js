/* ============================================================
   HOMIUM ORIGINATOR FLOW — Permissions / Policy Management
   System Admin only
   ============================================================ */

const PermissionsView = {
  _roleTab: 'sys_admin',
  _matrixEditing: false,
  _matrixPending: {},       // {role-scope-action: bool}
  _expandedMatrices: {},    // {policyId: bool}
  _userFilters: {},         // {policyId: {name, orgId, branchId}}

  _scope: null,

  /* scope: optional { roles: ['prog_admin','lo','lp'] } to filter the role sidebar */
  render(scope) {
    this._scope = scope || null;
    const canEdit  = State.can('managePolicy');
    const policies = State.getPolicies();
    const matrix   = State.getMatrix();

    const allRoleLabels = {
      sys_admin:  'System Admin',
      operator:   'Platform Operator',
      prog_admin: 'Program Admin',
      lo:         'Loan Officer',
      lp:         'Loan Processor',
      investor:   'Investor',
    };

    const roleLabels = scope?.roles
      ? Object.fromEntries(Object.entries(allRoleLabels).filter(([k]) => scope.roles.includes(k)))
      : allRoleLabels;

    if (!roleLabels[this._roleTab]) {
      this._roleTab = Object.keys(roleLabels)[0] || 'sys_admin';
    }

    /* ---- Role sidebar ---- */
    const roleSidebar = Object.entries(roleLabels).map(([key, label]) => `
      <div class="perm-role-item ${this._roleTab === key ? 'active' : ''}"
           onclick="PermissionsView.setRoleTab('${key}')">${label}</div>
    `).join('');

    /* ---- Policy cards ---- */
    const rolePolicies = policies.filter(p => p.roleTarget === this._roleTab);
    const rolePolicyCards = rolePolicies.map(p =>
      this._renderPolicyCard(p, scope, canEdit, matrix)
    ).join('') || `<div class="perm-empty-state">No policies for this role.${canEdit ? ` <button class="btn btn-ghost btn-sm" onclick="PermissionsView.openCreatePolicyModal()">Create one</button>` : ''}</div>`;

    const permHeader = scope ? '' : `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Permissions & Policies</div>
            <div class="page-subtitle">Role-based access control and policy assignment</div>
          </div>
        </div>
      </div>`;

    return `
      ${permHeader}
      ${scope ? '' : '<div class="page-body">'}
        ${!canEdit ? `
          <div class="alert alert-info">
            <span class="alert-icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5v.5"/></svg></span>
            <span>You have <strong>read-only</strong> access to permissions. Contact a System Admin to make changes.</span>
          </div>` : ''}

        <div class="perm-layout">
          <div class="perm-role-sidebar">
            <div style="padding:10px 16px 6px;font-size:10px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.07em">Roles</div>
            ${roleSidebar}
          </div>

          <div class="perm-content">
            <div class="perm-content-header">
              <div style="font-weight:700;font-size:14px">Policies — ${roleLabels[this._roleTab]}</div>
              ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="PermissionsView.openCreatePolicyModal()">+ New Policy</button>` : ''}
            </div>
            <div class="perm-policy-list">${rolePolicyCards}</div>
          </div>
        </div>
      ${scope ? '' : '</div>'}
      <div id="permissions-modal-container"></div>`;
  },

  _renderPolicyCard(p, scope, canEdit, matrix) {
    let eligibleUsers = State.getUsers().filter(u => u.role === p.roleTarget);
    if (scope?.companyId) eligibleUsers = eligibleUsers.filter(u => u.companyId === scope.companyId);
    else if (!scope?.platformOnly) eligibleUsers = eligibleUsers.filter(u => u.companyId);

    const assignedUsers   = eligibleUsers.filter(u => u.policies.includes(p.id));
    const unassignedUsers = eligibleUsers.filter(u => !u.policies.includes(p.id));
    const isCustom        = p.id.startsWith('policy-');
    const matrixOpen      = !!this._expandedMatrices[p.id];
    const isEditing       = this._matrixEditing && matrixOpen;

    /* ── Per-card permission matrix ── */
    const role   = p.roleTarget;
    const mdata  = matrix.matrix[role] || {};
    const matrixHtml = matrixOpen ? (() => {
      const aHeaders = matrix.actions.map(a => `<th>${a}</th>`).join('');
      const mRows = matrix.scopes.map(ms => {
        const cells = matrix.actions.map(action => {
          const key        = `${ms}-${action}`;
          const pendingKey = `${role}-${key}`;
          const val        = pendingKey in this._matrixPending ? this._matrixPending[pendingKey] : !!mdata[key];
          const isNA       = (ms === 'Platform'  && ['lo','lp','investor'].includes(role)) ||
                             (ms === 'Company'   && ['lo','lp','investor'].includes(role)) ||
                             (ms === 'Own Loans' && action === 'Manage Policies') ||
                             (action === 'Impersonate' && ms !== 'Any User') ||
                             (ms === 'Any User'  && action !== 'Impersonate');
          if (isNA) return `<td><span class="perm-na">—</span></td>`;
          return `<td><input type="checkbox" class="perm-check" ${val ? 'checked' : ''}
            ${!isEditing || !canEdit ? 'disabled' : ''}
            onchange="PermissionsView.stagePerm('${role}','${ms}','${action}',this.checked)"
            title="${ms} · ${action}" /></td>`;
        }).join('');
        return `<tr><td>${ms}</td>${cells}</tr>`;
      }).join('');
      return `
        <div class="perm-card-matrix-body">
          <div class="perm-matrix-toolbar">
            ${canEdit ? (isEditing
              ? `<div style="display:flex;gap:8px;align-items:center">
                  <span style="font-size:11px;color:var(--color-warning)">Unsaved changes</span>
                  <button class="btn btn-secondary btn-sm" onclick="PermissionsView.cancelMatrixEdit()">Cancel</button>
                  <button class="btn btn-primary btn-sm" onclick="PermissionsView.confirmMatrixSave()">Save</button>
                </div>`
              : `<button class="btn btn-secondary btn-sm" onclick="PermissionsView.startMatrixEdit()">Edit Permissions</button>`
            ) : '<span></span>'}
          </div>
          <div style="overflow-x:auto;padding:0 16px 12px">
            <table class="permission-matrix">
              <thead><tr><th>Scope</th>${aHeaders}</tr></thead>
              <tbody>${mRows}</tbody>
            </table>
          </div>
        </div>`;
    })() : '';

    /* ── Assigned users ── */
    const assignedHtml = assignedUsers.length
      ? assignedUsers.map(u => {
          const co = State.getCompany(u.companyId);
          return `
            <div class="perm-assigned-row">
              <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
              <div class="perm-assigned-info">
                <span class="perm-assigned-name">${Display.fullName(u)}</span>
                ${co ? `<span class="perm-assigned-co">${co.name}</span>` : ''}
              </div>
              ${canEdit ? `<button class="perm-remove-btn" title="Remove from policy"
                onclick="PermissionsView.toggleUserPolicy('${u.id}','${p.id}',false)">×</button>` : ''}
            </div>`;
        }).join('')
      : `<div class="perm-no-assigned">No users assigned to this policy.</div>`;

    /* ── Add users (unassigned only) ── */
    const companies  = scope?.companyId ? State.getCompanies().filter(c => c.id === scope.companyId) : State.getCompanies();
    const branches   = scope?.companyId ? State.getBranches().filter(b => b.companyId === scope.companyId) : State.getBranches();
    const orgOptions = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const branchOpts = branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    const addUsersHtml = (canEdit && unassignedUsers.length > 0) ? `
      <div class="perm-add-section">
        <div class="perm-section-label">Add Users</div>
        <div class="perm-user-search-row" style="margin-bottom:8px">
          <input class="input input-sm" placeholder="Search…" style="width:140px"
            oninput="PermissionsView._filterUsers('${p.id}','name',this.value)" />
          ${!scope?.companyId ? `
            <select class="filter-select" style="font-size:12px;height:30px"
              onchange="PermissionsView._filterUsers('${p.id}','orgId',this.value)">
              <option value="">All Companies</option>${orgOptions}
            </select>` : ''}
          <select class="filter-select" style="font-size:12px;height:30px"
            onchange="PermissionsView._filterUsers('${p.id}','branchId',this.value)">
            <option value="">All Branches</option>${branchOpts}
          </select>
        </div>
        <div id="policy-users-${p.id}">
          ${unassignedUsers.map(u => {
            const co = State.getCompany(u.companyId);
            return `
              <div class="perm-assigned-row">
                <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
                <div class="perm-assigned-info">
                  <span class="perm-assigned-name">${Display.fullName(u)}</span>
                  ${co ? `<span class="perm-assigned-co">${co.name}</span>` : ''}
                </div>
                <button class="btn btn-ghost btn-xs perm-add-btn"
                  onclick="PermissionsView.toggleUserPolicy('${u.id}','${p.id}',true)">+ Add</button>
              </div>`;
          }).join('')}
        </div>
      </div>` : '';

    return `
      <div class="perm-policy-card expanded">
        <div class="perm-card-header">
          <div class="perm-card-title-row">
            <span class="perm-policy-name">${p.name}</span>
            <span class="perm-policy-badge ${isCustom ? 'perm-badge-custom' : 'perm-badge-default'}">${isCustom ? 'Custom' : 'Default'}</span>
            ${canEdit ? `
              <div class="perm-card-actions">
                <button class="btn btn-ghost btn-xs" onclick="PermissionsView.openEditPolicyModal('${p.id}')">Edit</button>
                ${isCustom ? `<button class="btn btn-ghost btn-xs perm-btn-danger" onclick="PermissionsView.deletePolicy('${p.id}')">Delete</button>` : ''}
              </div>` : ''}
          </div>
          <div class="perm-policy-desc">${p.description || '<span style="font-style:italic;color:var(--color-text-muted)">No description</span>'}</div>
          <button class="perm-matrix-toggle-btn" onclick="PermissionsView.toggleCardMatrix('${p.id}')">
            Role Permissions <span style="font-size:9px">${matrixOpen ? '▴' : '▾'}</span>
          </button>
          ${matrixHtml}
        </div>
        <div class="perm-assigned-section">
          <div class="perm-section-label">Assigned (${assignedUsers.length})</div>
          ${assignedHtml}
        </div>
        ${addUsersHtml}
      </div>`;
  },

  _rerender() {
    if (this._scope) {
      App.renderView(Router.getCurrentPath());
    } else {
      App.renderView('/permissions');
    }
  },

  setRoleTab(role) {
    this._roleTab         = role;
    this._matrixEditing   = false;
    this._matrixPending   = {};
    this._expandedMatrices = {};
    this._rerender();
  },

  toggleCardMatrix(policyId) {
    this._expandedMatrices[policyId] = !this._expandedMatrices[policyId];
    if (!this._expandedMatrices[policyId]) {
      // cancel any pending edits when closing
      this._matrixEditing = false;
      this._matrixPending = {};
    }
    this._rerender();
  },

  _filterUsers(policyId, field, value) {
    if (!this._userFilters[policyId]) this._userFilters[policyId] = {};
    this._userFilters[policyId][field] = value.toLowerCase();
    const container = document.getElementById(`policy-users-${policyId}`);
    if (!container) return;
    const f = this._userFilters[policyId];
    container.querySelectorAll('.perm-assigned-row').forEach(row => {
      const name    = row.querySelector('.perm-assigned-name')?.textContent.toLowerCase() || '';
      const uid     = row.querySelector('button[onclick*="toggleUserPolicy"]')
                        ?.getAttribute('onclick')?.match(/'([^']+)'/)?.[0]?.replace(/'/g,'') || '';
      const user    = State.getUser(uid);
      const matchName   = !f.name     || name.includes(f.name);
      const matchOrg    = !f.orgId    || (user && user.companyId === f.orgId);
      const matchBranch = !f.branchId || (user && user.branchId  === f.branchId);
      row.style.display = (matchName && matchOrg && matchBranch) ? '' : 'none';
    });
  },

  startMatrixEdit() {
    this._matrixEditing = true;
    this._matrixPending = {};
    this._rerender();
  },

  cancelMatrixEdit() {
    this._matrixEditing = false;
    this._matrixPending = {};
    this._rerender();
  },

  stagePerm(role, scope, action, value) {
    this._matrixPending[`${role}-${scope}-${action}`] = value;
  },

  confirmMatrixSave() {
    const roleLabels = { sys_admin: 'System Admin', operator: 'Platform Operator', prog_admin: 'Program Admin', lo: 'Loan Officer', lp: 'Loan Processor', investor: 'Investor' };
    const role    = this._roleTab;
    const pending = this._matrixPending;
    const count   = Object.keys(pending).length;
    if (count === 0) { this.cancelMatrixEdit(); return; }
    const mc = document.getElementById('permissions-modal-container');
    if (!mc) return;
    mc.innerHTML = `
      <div class="modal-overlay">
        <div class="modal" style="max-width:420px">
          <div class="modal-header"><div class="modal-title">Apply Permission Changes?</div></div>
          <div class="modal-body">
            <p style="font-size:13px;color:var(--color-text-secondary)">
              This will update <strong>${count} permission${count !== 1 ? 's' : ''}</strong> for
              <strong>${roleLabels[role]}</strong>. Changes take effect immediately for this session.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="PermissionsView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="PermissionsView._applyMatrixSave()">Confirm</button>
          </div>
        </div>
      </div>`;
  },

  _applyMatrixSave() {
    Object.entries(this._matrixPending).forEach(([key, value]) => {
      const parts  = key.split('-');
      const role   = parts[0];
      const scope  = parts[1];
      const action = parts.slice(2).join('-');
      State.setPermission(role, scope, action, value);
    });
    this._matrixEditing = false;
    this._matrixPending = {};
    this.closeModal();
    UsersView.showSuccess('Permission matrix updated');
    this._rerender();
  },

  _policyModal(title, subtitle, policyId) {
    const roleLabels = {
      sys_admin: 'System Admin', operator: 'Platform Operator', prog_admin: 'Program Admin',
      lo: 'Loan Officer', lp: 'Loan Processor', investor: 'Investor',
    };
    const existing = policyId ? State.getPolicies().find(p => p.id === policyId) : null;
    const mc = document.getElementById('permissions-modal-container');
    if (!mc) return;
    mc.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)PermissionsView.closeModal()">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">${title}</div>
              <div class="modal-subtitle">${subtitle}</div>
            </div>
            <button class="modal-close" onclick="PermissionsView.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Policy Name *</label>
                <input class="input" id="cp-name" placeholder="e.g. LO Read-Only" value="${existing?.name || ''}" />
              </div>
              <div class="form-group form-full">
                <label>Description</label>
                <textarea class="input" id="cp-desc" rows="2" placeholder="Brief description of this policy">${existing?.description || ''}</textarea>
              </div>
              <div class="form-group form-full">
                <label>Role Target *</label>
                <select class="select-input" id="cp-role" ${existing ? 'disabled' : ''}>
                  <option value="">Select role…</option>
                  ${Object.entries(roleLabels).map(([k,v]) => `<option value="${k}" ${(existing?.roleTarget||this._roleTab)===k?'selected':''}>${v}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="PermissionsView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="PermissionsView.submitPolicy('${policyId || ''}')">${existing ? 'Save Changes' : 'Create Policy'}</button>
          </div>
        </div>
      </div>`;
  },

  openCreatePolicyModal() {
    this._policyModal('Create Policy', 'Define a new permission policy and assign it to users', null);
  },

  openEditPolicyModal(policyId) {
    this._policyModal('Edit Policy', 'Update policy name and description', policyId);
  },

  submitPolicy(policyId) {
    const name        = document.getElementById('cp-name')?.value.trim();
    const description = document.getElementById('cp-desc')?.value.trim() || '';
    const roleTarget  = document.getElementById('cp-role')?.value;
    if (!name) { alert('Policy name is required.'); return; }
    if (policyId) {
      State.updatePolicy(policyId, { name, description });
      this.closeModal();
      UsersView.showSuccess(`Policy updated`);
    } else {
      if (!roleTarget) { alert('Role Target is required.'); return; }
      State.addPolicy({ name, description, roleTarget });
      this._roleTab = roleTarget;
      this.closeModal();
      UsersView.showSuccess(`Policy "${name}" created`);
    }
    this._rerender();
  },

  deletePolicy(policyId) {
    const p = State.getPolicies().find(pol => pol.id === policyId);
    if (!p) return;
    if (!confirm(`Delete policy "${p.name}"? Users assigned to it will lose this policy.`)) return;
    State.deletePolicy(policyId);
    UsersView.showSuccess(`Policy deleted`);
    this._rerender();
  },

  closeModal() {
    const mc = document.getElementById('permissions-modal-container');
    if (mc) mc.innerHTML = '';
  },

  toggleUserPolicy(userId, policyId, assign) {
    if (assign) State.assignPolicy(userId, policyId);
    else State.removePolicy(userId, policyId);
    UsersView.showSuccess(`Policy ${assign ? 'assigned' : 'removed'}`);
    this._rerender();
  },
};
