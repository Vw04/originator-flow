/* ============================================================
   HOMIUM ORIGINATOR FLOW — Profile / User Detail View
   ============================================================ */

const ProfileView = {

  /* Open as side panel (used from user tables) */
  open(userId) {
    const u = State.getUser(userId);
    if (!u) return;

    const currentRole = State.getRole();
    const canEdit = State.can('editAny') || State.can('manageUsers');
    const co = State.getCompany(u.companyId);
    const br = State.getBranch(u.branchId);
    const policies = u.policies.map(pid => State.getPolicies().find(p => p.id === pid)).filter(Boolean);
    const loans = State.getLoansByLO(u.id);

    const stepBars = this._renderFlowchart(u, 'compact');

    const loanRows = loans.slice(0, 3).map(l => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--color-border-light)">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--color-text-secondary)">${l.id}</div>
          <div style="font-size:13px;color:var(--color-text)">${l.borrowerName}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:700">${Display.currency(l.amount)}</div>
          <span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span>
        </div>
      </div>`).join('');

    // Container: use panel-container if available, else create one
    let container = document.getElementById('panel-container') || document.getElementById('company-panel-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'panel-container';
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="side-panel-overlay" onclick="ProfileView.close()"></div>
      <div class="side-panel">
        <div class="side-panel-header">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="avatar avatar-lg" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
            <div>
              <div class="modal-title">${Display.fullName(u)}</div>
              <div style="margin-top:2px;display:flex;gap:6px;flex-wrap:wrap">
                <span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span>
                <span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span>
              </div>
            </div>
          </div>
          <button class="modal-close" onclick="ProfileView.close()">×</button>
        </div>

        <div class="side-panel-body">

          <!-- Contact info -->
          <div class="section-title">Contact Information</div>
          <div class="info-grid" style="margin-bottom:20px">
            <div class="info-row"><div class="info-label">Email</div><div class="info-value" style="font-size:12px">${u.email}</div></div>
            <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${u.phone || '—'}</div></div>
            <div class="info-row"><div class="info-label">Title</div><div class="info-value">${u.title || '—'}</div></div>
            <div class="info-row"><div class="info-label">NMLS ID</div><div class="info-value">${u.nmlsId || '—'}</div></div>
            <div class="info-row"><div class="info-label">Organization</div><div class="info-value">${co ? co.name : '—'}</div></div>
            <div class="info-row"><div class="info-label">Branch</div><div class="info-value">${br ? br.name : '—'}</div></div>
            <div class="info-row"><div class="info-label">Last Login</div><div class="info-value">${u.lastLogin ? Display.date(u.lastLogin) : 'Never'}</div></div>
          </div>

          <!-- Onboarding progress -->
          <div class="section-title">Onboarding Progress</div>
          <div style="margin-bottom:20px">
            ${stepBars}
          </div>

          <!-- Policies -->
          <div class="section-title">Assigned Policies</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px">
            ${policies.length
              ? policies.map(p => `<a class="tag" style="cursor:pointer;text-decoration:none" onclick="ProfileView.close();PermissionsView._expandedPolicy='${p.id}';PermissionsView._roleTab='${p.roleTarget}';App.renderView('/permissions')">${p.name}</a>`).join('')
              : '<span style="font-size:12px;color:var(--color-text-muted)">No policies assigned</span>'}
          </div>

          <!-- Loans (LO/LP only) -->
          ${(u.role === 'lo' || u.role === 'lp') && loans.length ? `
            <div class="section-title">Recent Applications (${loans.length})</div>
            <div style="margin-bottom:16px">${loanRows}</div>` : ''}

        </div>

        <div class="side-panel-footer">
          ${canEdit ? `
            <button class="btn btn-secondary" onclick="ProfileView.close()">Close</button>
            <button class="btn btn-ghost btn-sm btn-danger-ghost" onclick="ProfileView.suspend('${u.id}')" ${u.onboardingStatus === 'suspended' ? 'disabled' : ''}>Suspend</button>
            <button class="btn btn-primary" onclick="ProfileView.openEditModal('${u.id}')">Edit</button>
          ` : `<button class="btn btn-secondary" onclick="ProfileView.close()">Close</button>`}
        </div>
      </div>`;
  },

  close() {
    ['panel-container', 'company-panel-container'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
  },

  suspend(userId) {
    State.suspendUser(userId);
    UsersView.showSuccess('User suspended');
    this.close();
    App.renderView(Router.getCurrentPath() || '/users');
  },

  openEditModal(userId) {
    const u = State.getUser(userId);
    if (!u) return;

    const branches = State.getBranches().filter(b => b.companyId === u.companyId);
    const branchOptions = branches.map(b => `<option value="${b.id}" ${u.branchId === b.id ? 'selected' : ''}>${b.name}</option>`).join('');

    let container = document.getElementById('panel-container') || document.getElementById('company-panel-container');
    const currentHTML = container?.innerHTML || '';

    // Open edit modal on top
    let editContainer = document.getElementById('profile-edit-modal');
    if (!editContainer) {
      editContainer = document.createElement('div');
      editContainer.id = 'profile-edit-modal';
      document.body.appendChild(editContainer);
    }

    editContainer.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)ProfileView.closeEdit()">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">Edit User</div>
              <div class="modal-subtitle">${Display.fullName(u)}</div>
            </div>
            <button class="modal-close" onclick="ProfileView.closeEdit()">×</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>First Name</label>
                <input class="input" id="edit-u-first" value="${u.firstName}" />
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input class="input" id="edit-u-last" value="${u.lastName}" />
              </div>
              <div class="form-group">
                <label>Title</label>
                <input class="input" id="edit-u-title" value="${u.title || ''}" />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input class="input" id="edit-u-phone" value="${u.phone || ''}" type="tel" />
              </div>
              <div class="form-group">
                <label>NMLS ID</label>
                <input class="input" id="edit-u-nmls" value="${u.nmlsId || ''}" />
              </div>
              <div class="form-group">
                <label>Branch</label>
                <select class="select-input" id="edit-u-branch">
                  <option value="">—</option>${branchOptions}
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="ProfileView.closeEdit()">Cancel</button>
            <button class="btn btn-primary" onclick="ProfileView.submitEdit('${userId}')">Save</button>
          </div>
        </div>
      </div>`;
  },

  submitEdit(userId) {
    const firstName = document.getElementById('edit-u-first')?.value.trim();
    const lastName  = document.getElementById('edit-u-last')?.value.trim();
    const title     = document.getElementById('edit-u-title')?.value.trim();
    const phone     = document.getElementById('edit-u-phone')?.value.trim();
    const nmlsId    = document.getElementById('edit-u-nmls')?.value.trim();
    const branchId  = document.getElementById('edit-u-branch')?.value;

    State.updateUser(userId, { firstName, lastName, title: title || null, phone: phone || null, nmlsId: nmlsId || null, branchId: branchId || null });
    this.closeEdit();
    UsersView.showSuccess('User updated');
    this.close();
    App.renderView(Router.getCurrentPath() || '/users');
  },

  closeEdit() {
    const el = document.getElementById('profile-edit-modal');
    if (el) el.remove();
  },

  /* My Profile: full-page view for LO/LP/investor */
  renderMyProfile() {
    const u = State.getCurrentUser();
    if (!u) return '<div class="page-body">No user found.</div>';

    const co = State.getCompany(u.companyId);
    const br = State.getBranch(u.branchId);

    return `
      <div class="page-header">
        <div class="page-header-left"><div class="page-title">My Profile</div></div>
      </div>

      <div class="page-body" style="max-width:680px">
        <div class="card" style="margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
            <div class="avatar avatar-lg" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
            <div>
              <div style="font-size:18px;font-weight:700;letter-spacing:-0.01em">${Display.fullName(u)}</div>
              <div style="margin-top:4px;display:flex;gap:8px">
                <span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span>
                <span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span>
              </div>
            </div>
          </div>

          <hr class="divider" />

          <div class="info-grid">
            <div class="info-row"><div class="info-label">Email</div><div class="info-value">${u.email}</div></div>
            <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${u.phone || '—'}</div></div>
            <div class="info-row"><div class="info-label">Title</div><div class="info-value">${u.title || '—'}</div></div>
            <div class="info-row"><div class="info-label">NMLS ID</div><div class="info-value">${u.nmlsId || '—'}</div></div>
            <div class="info-row"><div class="info-label">Organization</div><div class="info-value">${co ? co.name : '—'}</div></div>
            <div class="info-row"><div class="info-label">Branch</div><div class="info-value">${br ? br.name : '—'}</div></div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:16px">Account Onboarding</div>
          ${this._renderFlowchart(u)}
        </div>
      </div>`;
  },

  _renderFlowchart(u, variant) {
    const isLO   = u.role === 'lo';
    const status = u.onboardingStatus;
    const isFailed = status === 'verification_failed';

    const ORDER = ['invited', 'email_verified', '2fa_complete', 'verification_pending', 'active'];
    const currentIdx = ORDER.indexOf(status);

    const allSteps = [
      { key: 'invited',              label: 'Invited' },
      { key: 'email_verified',       label: 'Email Verified' },
      { key: '2fa_complete',         label: '2FA Setup' },
      ...(isLO ? [{ key: 'verification_pending', label: 'KYC Verification' }] : []),
      { key: 'active',               label: 'Active' },
    ];

    const items = allSteps.map((s, i) => {
      const stepIdx = ORDER.indexOf(s.key);
      let state;
      if (status === 'active')                                       state = 'vf-complete';
      else if (isFailed && s.key === 'verification_pending')         state = 'vf-failed';
      else if (stepIdx < currentIdx)                                 state = 'vf-complete';
      else if (stepIdx === currentIdx)                               state = 'vf-active';
      else                                                           state = '';

      const isLast = i === allSteps.length - 1;
      return `
        <div class="vflow-item">
          <div class="vflow-line">
            <div class="vflow-dot ${state}"></div>
            ${!isLast ? `<div class="vflow-connector ${state === 'vf-complete' ? 'vf-done' : ''}"></div>` : ''}
          </div>
          <div class="vflow-label ${state}">${s.label}</div>
        </div>`;
    }).join('');

    return `<div class="vflow">${items}</div>`;
  },
};
