/* ============================================================
   HOMIUM ORIGINATOR FLOW — Permissions / Policy Management
   System Admin only
   ============================================================ */

const PermissionsView = {
  _selectedPolicy: null,
  _roleTab: 'sys_admin',

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

    /* ---- Role tab headers ---- */
    const roleTabs = Object.entries(roleLabels).map(([key, label]) => `
      <div class="tab-item ${this._roleTab === key ? 'active' : ''}"
           onclick="PermissionsView.setRoleTab('${key}')">${label}</div>
    `).join('');

    /* ---- Permission matrix for selected role ---- */
    const role  = this._roleTab;
    const perms = matrix.matrix[role] || {};

    const actionHeaders = matrix.actions.map(a => `<th>${a}</th>`).join('');
    const matrixRows = matrix.scopes.map(scope => {
      const cells = matrix.actions.map(action => {
        const key   = `${scope}-${action}`;
        const val   = !!perms[key];
        const isNA  = (scope === 'Platform' && ['lo','lp','investor'].includes(role)) ||
                      (scope === 'Company'  && ['lo','lp','investor'].includes(role)) ||
                      (scope === 'Own Loans' && action === 'Manage Policies');

        if (isNA) return `<td><span class="perm-na">—</span></td>`;

        return `<td>
          <input type="checkbox" class="perm-check" ${val ? 'checked' : ''}
            ${!canEdit ? 'disabled' : ''}
            onchange="PermissionsView.togglePerm('${role}', '${scope}', '${action}', this.checked)"
            title="${scope} · ${action}" />
        </td>`;
      }).join('');

      return `<tr><td>${scope}</td>${cells}</tr>`;
    }).join('');

    /* ---- Policy list ---- */
    const policyItems = policies.map(p => `
      <div class="policy-item ${this._selectedPolicy === p.id ? 'selected' : ''}"
           style="padding:12px 16px;border-bottom:1px solid var(--color-border);cursor:pointer;transition:background 0.1s;background:${this._selectedPolicy === p.id ? '#EEF2FF' : 'transparent'}"
           onclick="PermissionsView.selectPolicy('${p.id}')">
        <div style="font-size:13px;font-weight:600;color:var(--color-text)">${p.name}</div>
        <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px">${p.description}</div>
        <div style="margin-top:4px"><span class="tag" style="font-size:10px">${roleLabels[p.roleTarget] || p.roleTarget}</span></div>
      </div>`).join('');

    /* ---- Selected policy detail / assignment ---- */
    const selPolicy = this._selectedPolicy ? policies.find(p => p.id === this._selectedPolicy) : null;
    let policyDetail = '';

    if (selPolicy) {
      const eligibleUsers = State.getUsers().filter(u => u.role === selPolicy.roleTarget && u.companyId);
      const policyDetail_rows = eligibleUsers.map(u => {
        const hasPolicy = u.policies.includes(selPolicy.id);
        const co = State.getCompany(u.companyId);
        return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
                <div>
                  <div class="cell-primary">${Display.fullName(u)}</div>
                  <div class="cell-secondary">${co ? co.name : ''}</div>
                </div>
              </div>
            </td>
            <td><span class="badge ${Display.onboardingStatusClass(u.onboardingStatus)}">${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
            <td>
              <label class="checkbox-group">
                <input type="checkbox" ${hasPolicy ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}
                  onchange="PermissionsView.toggleUserPolicy('${u.id}', '${selPolicy.id}', this.checked)" />
                <span style="font-size:12px">${hasPolicy ? 'Assigned' : 'Not assigned'}</span>
              </label>
            </td>
          </tr>`;
      }).join('');

      policyDetail = `
        <div style="padding:16px;background:var(--color-surface);border-bottom:1px solid var(--color-border)">
          <div style="font-size:14px;font-weight:700;color:var(--color-text)">${selPolicy.name}</div>
          <div style="font-size:12px;color:var(--color-text-secondary);margin-top:4px">${selPolicy.description}</div>
        </div>
        <div style="padding:12px 16px;border-bottom:1px solid var(--color-border)">
          <div class="section-title">Assign to Users</div>
          ${eligibleUsers.length ? `
            <table style="margin-top:8px;width:100%">
              <thead><tr><th>User</th><th>Status</th><th>Assigned</th></tr></thead>
              <tbody>${policyDetail_rows}</tbody>
            </table>` : `<div style="font-size:12px;color:var(--color-text-muted);padding:12px 0">No ${roleLabels[selPolicy.roleTarget]} users found.</div>`}
        </div>`;
    }

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">Permissions & Policies</div>
            <div class="page-subtitle">Manage role-based access and assign policies to users</div>
          </div>
        </div>
      </div>

      <div class="page-body">
        ${!canEdit ? `
          <div class="alert alert-info">
            <span class="alert-icon">ℹ️</span>
            <span>You have <strong>read-only</strong> access to permissions. Contact a System Admin to make changes.</span>
          </div>` : ''}

        <div style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start">

          <!-- Policy list sidebar -->
          <div>
            <div class="card" style="padding:0;overflow:hidden">
              <div style="padding:12px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-border)">
                <div style="font-size:12px;font-weight:700;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em">Policies</div>
              </div>
              ${policyItems}
            </div>
          </div>

          <!-- Matrix + Policy detail -->
          <div>
            <!-- Permission Matrix -->
            <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px">
              <div style="padding:14px 20px;border-bottom:1px solid var(--color-border)">
                <div style="font-weight:700;font-size:14px">Permission Matrix</div>
                <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px">Base permissions by role and scope</div>
              </div>

              <div class="tabs" style="padding:0 20px;margin-bottom:0;border-bottom:1px solid var(--color-border)">
                ${roleTabs}
              </div>

              <div style="padding:16px 20px;overflow-x:auto">
                <table class="permission-matrix">
                  <thead>
                    <tr>
                      <th>Scope</th>${actionHeaders}
                    </tr>
                  </thead>
                  <tbody>${matrixRows}</tbody>
                </table>
                ${canEdit ? `<div style="margin-top:10px;font-size:11px;color:var(--color-text-muted)">Changes take effect immediately for this session. Refresh to reset to defaults.</div>` : ''}
              </div>
            </div>

            <!-- Selected Policy Detail -->
            ${selPolicy ? `
              <div class="card" style="padding:0;overflow:hidden">
                <div style="padding:12px 20px;border-bottom:1px solid var(--color-border)">
                  <div style="font-weight:700;font-size:14px">Policy Assignment: ${selPolicy.name}</div>
                </div>
                ${policyDetail}
              </div>` : `
              <div class="card" style="padding:40px;text-align:center;color:var(--color-text-muted)">
                <div style="font-size:28px;margin-bottom:8px">🔐</div>
                <div style="font-size:13px">Select a policy from the list to manage user assignments</div>
              </div>`}
          </div>
        </div>
      </div>`;
  },

  setRoleTab(role) {
    this._roleTab = role;
    App.renderView('/permissions');
  },

  selectPolicy(policyId) {
    this._selectedPolicy = this._selectedPolicy === policyId ? null : policyId;
    App.renderView('/permissions');
  },

  togglePerm(role, scope, action, value) {
    State.setPermission(role, scope, action, value);
    // Don't re-render to avoid losing checkbox state mid-edit
    UsersView.showSuccess(`Permission updated: ${scope} · ${action} = ${value ? 'on' : 'off'}`);
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
