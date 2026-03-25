/* ============================================================
   HOMIUM ORIGINATOR FLOW — Permissions / Policy Management
   System Admin only
   ============================================================ */

const PermissionsView = {
  _roleTab: 'sys_admin',
  _expandedPolicy: null,
  _matrixEditing: false,
  _matrixPending: {},  // {role-scope-action: bool}

  render() {
    const canEdit  = State.can('managePolicy');
    const policies = State.getPolicies();
    const matrix   = State.getMatrix();

    const roleLabels = {
      sys_admin:  'System Admin',
      operator:   'Platform Operator',
      prog_admin: 'Program Admin',
      lo:         'Loan Officer',
      lp:         'Loan Processor',
      investor:   'Investor',
    };

    /* ---- Vertical role sidebar ---- */
    const roleSidebar = Object.entries(roleLabels).map(([key, label]) => `
      <div class="perm-role-item ${this._roleTab === key ? 'active' : ''}"
           onclick="PermissionsView.setRoleTab('${key}')">${label}</div>
    `).join('');

    /* ---- Policy cards for selected role ---- */
    const rolePolcies = policies.filter(p => p.roleTarget === this._roleTab);
    const rolePolicyCards = rolePolcies.map(p => {
      const eligibleUsers = State.getUsers().filter(u => u.role === p.roleTarget && u.companyId);
      const assignedCount = eligibleUsers.filter(u => u.policies.includes(p.id)).length;
      const isExpanded    = this._expandedPolicy === p.id;

      const userRows = eligibleUsers.map(u => {
        const hasPolicy = u.policies.includes(p.id);
        const co = State.getCompany(u.companyId);
        return `
          <div class="perm-user-row">
            <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:500">${Display.fullName(u)}</div>
              <div style="font-size:11px;color:var(--color-text-muted)">${co ? co.name : ''}</div>
            </div>
            <label class="checkbox-group">
              <input type="checkbox" ${hasPolicy ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}
                onchange="PermissionsView.toggleUserPolicy('${u.id}','${p.id}',this.checked)" />
            </label>
          </div>`;
      }).join('') || `<p style="font-size:12px;color:var(--color-text-muted)">No ${roleLabels[p.roleTarget]} users found.</p>`;

      return `
        <div class="perm-policy-card ${isExpanded ? 'expanded' : ''}">
          <div class="perm-policy-card-header" onclick="PermissionsView.togglePolicyCard('${p.id}')">
            <div style="flex:1;min-width:0">
              <div class="perm-policy-name">${p.name}</div>
              ${p.description ? `<div class="perm-policy-desc">${p.description}</div>` : ''}
              <div class="perm-policy-meta">${assignedCount} of ${eligibleUsers.length} users assigned</div>
            </div>
            <span class="perm-policy-chevron">&#9660;</span>
          </div>
          <div class="perm-policy-body">
            <input class="perm-user-search" placeholder="Search users…" oninput="PermissionsView._filterPolicyUsers(this,'${p.id}')" />
            <div id="policy-users-${p.id}">${userRows}</div>
          </div>
        </div>`;
    }).join('') || `<div style="padding:20px;font-size:13px;color:var(--color-text-muted)">No policies for this role. ${canEdit ? `<button class="btn btn-ghost btn-sm" onclick="PermissionsView.openCreatePolicyModal()">Create one</button>` : ''}</div>`;

    /* ---- Permission matrix for selected role ---- */
    const role  = this._roleTab;
    const perms = matrix.matrix[role] || {};
    const isEditingMatrix = this._matrixEditing;

    const actionHeaders = matrix.actions.map(a => `<th>${a}</th>`).join('');
    const matrixRows = matrix.scopes.map(scope => {
      const cells = matrix.actions.map(action => {
        const key        = `${scope}-${action}`;
        const pendingKey = `${role}-${key}`;
        const val        = pendingKey in this._matrixPending ? this._matrixPending[pendingKey] : !!perms[key];
        const isNA       = (scope === 'Platform'  && ['lo','lp','investor'].includes(role)) ||
                           (scope === 'Company'   && ['lo','lp','investor'].includes(role)) ||
                           (scope === 'Own Loans' && action === 'Manage Policies');

        if (isNA) return `<td><span class="perm-na">—</span></td>`;

        return `<td>
          <input type="checkbox" class="perm-check" ${val ? 'checked' : ''}
            ${!isEditingMatrix || !canEdit ? 'disabled' : ''}
            onchange="PermissionsView.stagePerm('${role}','${scope}','${action}',this.checked)"
            title="${scope} · ${action}" />
        </td>`;
      }).join('');

      return `<tr><td>${scope}</td>${cells}</tr>`;
    }).join('');

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">Permissions & Policies</div>
            <div class="page-subtitle">Role-based access control and policy assignment</div>
          </div>
        </div>
      </div>

      <div class="page-body">
        ${!canEdit ? `
          <div class="alert alert-info">
            <span class="alert-icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5v.5"/></svg></span>
            <span>You have <strong>read-only</strong> access to permissions. Contact a System Admin to make changes.</span>
          </div>` : ''}

        <div class="perm-layout">

          <!-- Role sidebar -->
          <div class="perm-role-sidebar">
            <div style="padding:10px 16px 6px;font-size:10px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.07em">Roles</div>
            ${roleSidebar}
          </div>

          <!-- Content -->
          <div class="perm-content">

            <!-- Policy cards section -->
            <div style="padding:14px 20px;border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between">
              <div style="font-weight:700;font-size:14px">Policies — ${roleLabels[this._roleTab]}</div>
              ${canEdit ? `<button class="btn btn-ghost btn-xs" onclick="PermissionsView.openCreatePolicyModal()">+ Create Policy</button>` : ''}
            </div>
            <div class="perm-policy-grid">${rolePolicyCards}</div>

            <!-- Permission matrix section -->
            <div style="border-top:1px solid var(--color-border)">
              <div class="perm-matrix-toolbar">
                <div class="perm-matrix-toolbar-title">Permission Matrix</div>
                ${canEdit ? (isEditingMatrix
                  ? `<div style="display:flex;gap:8px">
                      <button class="btn btn-secondary btn-sm" onclick="PermissionsView.cancelMatrixEdit()">Cancel</button>
                      <button class="btn btn-primary btn-sm" onclick="PermissionsView.confirmMatrixSave()">Save Changes</button>
                    </div>`
                  : `<button class="btn btn-secondary btn-sm" onclick="PermissionsView.startMatrixEdit()">Edit Permissions</button>`
                ) : ''}
              </div>
              <div style="padding:16px 20px;overflow-x:auto">
                <table class="permission-matrix">
                  <thead><tr><th>Scope</th>${actionHeaders}</tr></thead>
                  <tbody>${matrixRows}</tbody>
                </table>
                ${isEditingMatrix ? `<div style="margin-top:8px;font-size:11px;color:var(--color-warning)">Unsaved changes — click "Save Changes" to apply.</div>` : ''}
              </div>
            </div>

          </div>
        </div>
      </div>
      <div id="permissions-modal-container"></div>`;
  },

  setRoleTab(role) {
    this._roleTab = role;
    this._expandedPolicy = null;
    this._matrixEditing  = false;
    this._matrixPending  = {};
    App.renderView('/permissions');
  },

  togglePolicyCard(policyId) {
    this._expandedPolicy = this._expandedPolicy === policyId ? null : policyId;
    App.renderView('/permissions');
  },

  _filterPolicyUsers(input, policyId) {
    const q = input.value.toLowerCase();
    const container = document.getElementById(`policy-users-${policyId}`);
    if (!container) return;
    container.querySelectorAll('.perm-user-row').forEach(row => {
      const name = row.querySelector('[style*="font-weight"]')?.textContent.toLowerCase() || '';
      row.style.display = name.includes(q) ? '' : 'none';
    });
  },

  startMatrixEdit() {
    this._matrixEditing = true;
    this._matrixPending = {};
    App.renderView('/permissions');
  },

  cancelMatrixEdit() {
    this._matrixEditing = false;
    this._matrixPending = {};
    App.renderView('/permissions');
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
          <div class="modal-header">
            <div class="modal-title">Apply Permission Changes?</div>
          </div>
          <div class="modal-body">
            <p style="font-size:13px;color:var(--color-text-secondary)">
              This will update <strong>${count} permission${count !== 1 ? 's' : ''}</strong> for the
              <strong>${roleLabels[role]}</strong> role. Changes take effect immediately for this session.
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
    App.renderView('/permissions');
  },

  openCreatePolicyModal() {
    const roleLabels = {
      sys_admin: 'System Admin', operator: 'Platform Operator', prog_admin: 'Program Admin',
      lo: 'Loan Officer', lp: 'Loan Processor', investor: 'Investor',
    };
    const mc = document.getElementById('permissions-modal-container');
    if (!mc) return;
    mc.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)PermissionsView.closeModal()">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">Create Custom Policy</div>
              <div class="modal-subtitle">Define a new permission policy and assign it to users</div>
            </div>
            <button class="modal-close" onclick="PermissionsView.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Policy Name *</label>
                <input class="input" id="cp-name" placeholder="e.g. LO Read-Only" />
              </div>
              <div class="form-group form-full">
                <label>Description</label>
                <input class="input" id="cp-desc" placeholder="Brief description of this policy" />
              </div>
              <div class="form-group form-full">
                <label>Role Target *</label>
                <select class="select-input" id="cp-role">
                  <option value="">Select role…</option>
                  ${Object.entries(roleLabels).map(([k,v]) => `<option value="${k}" ${k===this._roleTab?'selected':''}>${v}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="PermissionsView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="PermissionsView.submitCreatePolicy()">Create Policy</button>
          </div>
        </div>
      </div>`;
  },

  submitCreatePolicy() {
    const name        = document.getElementById('cp-name')?.value.trim();
    const description = document.getElementById('cp-desc')?.value.trim() || '';
    const roleTarget  = document.getElementById('cp-role')?.value;
    if (!name || !roleTarget) { alert('Name and Role Target are required.'); return; }
    const policy = State.addPolicy({ name, description, roleTarget });
    this._expandedPolicy = policy.id;
    this._roleTab = roleTarget;
    this.closeModal();
    UsersView.showSuccess(`Policy "${name}" created`);
    App.renderView('/permissions');
  },

  closeModal() {
    const mc = document.getElementById('permissions-modal-container');
    if (mc) mc.innerHTML = '';
  },

  toggleUserPolicy(userId, policyId, assign) {
    if (assign) {
      State.assignPolicy(userId, policyId);
    } else {
      State.removePolicy(userId, policyId);
    }
    UsersView.showSuccess(`Policy ${assign ? 'assigned' : 'removed'}`);
  },
};
