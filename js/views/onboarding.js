/* ============================================================
   HOMIUM ORIGINATOR FLOW — Onboarding View
   ============================================================ */

const OnboardingView = {
  _selectedUserId: null,
  _wizardStep: 0,
  _filters: [],  // [{type, value}]

  addFilter(type, value) {
    if (!value) return;
    if (!this._filters.find(f => f.type === type && f.value === value)) {
      this._filters.push({ type, value });
    }
    App.renderView('/onboarding');
  },

  removeFilter(idx) {
    this._filters.splice(idx, 1);
    App.renderView('/onboarding');
  },

  clearOnboardingFilters() {
    this._filters = [];
    App.renderView('/onboarding');
  },

  _applyFilters(users) {
    const companies = State.getCompanies();
    const branches  = State.getBranches();
    return this._filters.reduce((list, f) => {
      if (f.type === 'company') return list.filter(u => u.companyId === f.value);
      if (f.type === 'role')    return list.filter(u => u.role === f.value);
      if (f.type === 'status')  return list.filter(u => u.onboardingStatus === f.value);
      if (f.type === 'branch')  return list.filter(u => u.branchId === f.value);
      return list;
    }, users);
  },

  _renderFilterBar(companies, branches) {
    const chips = this._filters.map((f, i) => {
      let label = '';
      if (f.type === 'company') label = `Org: ${companies.find(c=>c.id===f.value)?.name || f.value}`;
      if (f.type === 'role')    label = `Role: ${Display.roleName(f.value)}`;
      if (f.type === 'status')  label = `Status: ${Display.onboardingStatusLabel(f.value)}`;
      if (f.type === 'branch')  label = `Branch: ${branches.find(b=>b.id===f.value)?.name || f.value}`;
      return `<span class="filter-chip">${label}<button class="filter-chip-remove" onclick="OnboardingView.removeFilter(${i})">×</button></span>`;
    }).join('');

    return `
      <div class="filter-chip-bar">
        ${chips}
        <div style="position:relative;display:inline-block">
          <button class="btn-add-filter" onclick="OnboardingView.toggleFilterDropdown(event)">+ Add Filter</button>
          <div class="filter-dropdown" id="onb-filter-dd" style="display:none">
            <div class="filter-dropdown-section">By Organization</div>
            ${companies.map(c => `<div class="filter-dropdown-item" onclick="OnboardingView.addFilter('company','${c.id}')">${c.name}</div>`).join('')}
            <div class="filter-dropdown-section">By Role</div>
            ${['lo','lp','prog_admin'].map(r => `<div class="filter-dropdown-item" onclick="OnboardingView.addFilter('role','${r}')">${Display.roleName(r)}</div>`).join('')}
            <div class="filter-dropdown-section">By Status</div>
            ${['invited','email_verified','2fa_complete','verification_pending','verification_failed'].map(s =>
              `<div class="filter-dropdown-item" onclick="OnboardingView.addFilter('status','${s}')">${Display.onboardingStatusLabel(s)}</div>`
            ).join('')}
            <div class="filter-dropdown-section">By Branch</div>
            ${branches.map(b => `<div class="filter-dropdown-item" onclick="OnboardingView.addFilter('branch','${b.id}')">${b.name}</div>`).join('')}
          </div>
        </div>
        ${this._filters.length ? `<button class="btn btn-ghost btn-sm" onclick="OnboardingView.clearOnboardingFilters()">Clear all</button>` : ''}
      </div>`;
  },

  toggleFilterDropdown(e) {
    e.stopPropagation();
    const dd = document.getElementById('onb-filter-dd');
    if (!dd) return;
    const isOpen = dd.style.display !== 'none';
    document.querySelectorAll('.filter-dropdown').forEach(d => d.style.display = 'none');
    if (!isOpen) {
      dd.style.display = 'block';
      setTimeout(() => document.addEventListener('click', () => { dd.style.display = 'none'; }, { once: true }), 0);
    }
  },

  render() {
    const role = State.getRole();
    const currentUser = State.getCurrentUser();

    // Investor: show their own KYC flow
    if (role === 'investor') return this.renderInvestorKYC();

    // LO/LP: show their own onboarding steps
    if (role === 'lo' || role === 'lp') return this.renderPersonalOnboarding();

    // Admin / Operator / ProgAdmin: manage all onboarding
    return this.renderAdminOnboarding();
  },

  /* ---- Admin: Onboarding Management ---- */
  renderAdminOnboarding() {
    const role        = State.getRole();
    const currentUser = State.getCurrentUser();
    const canEdit     = State.can('manageUsers') || State.can('editAny');

    let users = State.getUsers().filter(u => u.companyId);
    if (role === 'prog_admin' && currentUser?.companyId) {
      users = users.filter(u => u.companyId === currentUser.companyId);
    }

    const pending = users.filter(u => u.onboardingStatus !== 'active' && u.onboardingStatus !== 'suspended');
    const active  = users.filter(u => u.onboardingStatus === 'active');
    const failed  = users.filter(u => u.onboardingStatus === 'verification_failed' || u.onboardingStatus === 'suspended');

    // Status pipeline counts
    const statusCounts = {
      invited:              users.filter(u => u.onboardingStatus === 'invited').length,
      email_verified:       users.filter(u => u.onboardingStatus === 'email_verified').length,
      '2fa_complete':       users.filter(u => u.onboardingStatus === '2fa_complete').length,
      verification_pending: users.filter(u => u.onboardingStatus === 'verification_pending').length,
    };

    const renderUserRow = (u) => {
      const br = State.getBranch(u.branchId);
      const isSelected = this._selectedUserId === u.id;
      return `
        <tr class="clickable ${isSelected ? 'row-selected' : ''}" onclick="OnboardingView.selectUser('${u.id}')">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
              <div>
                <div class="cell-primary">${Display.fullName(u)}</div>
                <div class="cell-secondary">${u.email}</div>
              </div>
            </div>
          </td>
          <td><span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
          <td class="text-secondary">${br ? br.name : '—'}</td>
          <td><span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
        </tr>`;
    };

    /* ---- Wizard panel for selected user ---- */
    let wizardPanel = '';
    if (this._selectedUserId) {
      const u = State.getUser(this._selectedUserId);
      if (u) wizardPanel = this.renderUserWizard(u, canEdit);
    }

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">Onboarding</div>
            <div class="page-subtitle">${pending.length} user${pending.length !== 1 ? 's' : ''} pending · ${active.length} active</div>
          </div>
        </div>
        ${canEdit ? `
          <div class="page-header-actions">
            <button class="btn btn-primary btn-sm" onclick="UsersView.openInviteModal()">+ Invite User</button>
          </div>` : ''}
      </div>

      <div class="page-body">
        <!-- Pipeline stats -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          ${[
            { label: 'Invite Sent',    value: statusCounts['invited'],              svgColor: 'var(--color-accent)' },
            { label: 'Email Verified', value: statusCounts['email_verified'],       svgColor: '#2563EB' },
            { label: '2FA Complete',   value: statusCounts['2fa_complete'],         svgColor: '#7C3AED' },
            { label: 'KYC Pending',    value: statusCounts['verification_pending'], svgColor: '#D97706' },
          ].map(s => `
            <div class="stat-card">
              <div class="stat-card-header">
                <div class="stat-label">${s.label}</div>
              </div>
              <div class="stat-value" style="color:${s.svgColor}">${s.value}</div>
            </div>`).join('')}
        </div>

        ${this._renderFilterBar(State.getCompanies(), State.getBranches().filter(b => role === 'prog_admin' && currentUser?.companyId ? b.companyId === currentUser.companyId : true))}

        <div style="display:grid;grid-template-columns:${this._selectedUserId ? '1fr 420px' : '1fr'};gap:20px;align-items:start">

          <div>
            <!-- Pending users -->
            ${this._applyFilters(pending).length ? `
              <div class="table-container" style="margin-bottom:16px">
                <div class="table-toolbar">
                  <div class="table-toolbar-title">In Progress (${this._applyFilters(pending).length})</div>
                </div>
                <table>
                  <thead><tr><th>User</th><th>Role</th><th>Branch</th><th>Status</th></tr></thead>
                  <tbody>${this._applyFilters(pending).map(u => renderUserRow(u)).join('')}</tbody>
                </table>
              </div>` : (pending.length ? `<div class="table-container" style="margin-bottom:16px"><div class="table-empty"><p>No users match the current filters.</p></div></div>` : '')}

            <!-- Problem users -->
            ${this._applyFilters(failed).length ? `
              <div class="table-container" style="margin-bottom:16px">
                <div class="table-toolbar">
                  <div class="table-toolbar-title" style="color:var(--color-danger)">Needs Attention (${this._applyFilters(failed).length})</div>
                </div>
                <table>
                  <thead><tr><th>User</th><th>Role</th><th>Branch</th><th>Status</th></tr></thead>
                  <tbody>${this._applyFilters(failed).map(u => renderUserRow(u)).join('')}</tbody>
                </table>
              </div>` : ''}

            ${!pending.length && !failed.length ? `
              <div class="empty-state">
                <div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="24" cy="24" r="20"/><path d="M15 24l6 6 12-12"/></svg></div>
                <h3>All caught up!</h3>
                <p>All users are fully onboarded and active.</p>
              </div>` : ''}
          </div>

          <!-- Step wizard panel -->
          ${wizardPanel}
        </div>
      </div>

      <div id="onboarding-modal-container"></div>`;
  },

  renderUserWizard(u, canEdit) {
    const isLO = u.role === 'lo';
    const steps = [
      { key: 'invited',              label: 'Invite Sent',     desc: 'Welcome email sent with magic link.' },
      { key: 'email_verified',       label: 'Email Verified',  desc: 'User clicked the magic link and verified their email address.' },
      { key: '2fa_complete',         label: '2FA Setup',       desc: 'User completed email-based two-factor authentication setup.' },
      ...(isLO ? [{ key: 'verification_pending', label: 'KYC Verification', desc: 'User redirected to SecuritizeID for identity verification.' }] : []),
      { key: 'active',               label: 'Active',          desc: 'Account fully verified and activated.' },
    ];

    const statusOrder = steps.map(s => s.key);
    const currentIdx  = statusOrder.indexOf(u.onboardingStatus);
    const isFailed    = u.onboardingStatus === 'verification_failed';
    const isSuspended = u.onboardingStatus === 'suspended';

    const stepItems = steps.map((s, i) => {
      let state = 'pending';
      if (i < currentIdx) state = 'complete';
      else if (i === currentIdx && !isFailed && !isSuspended) state = 'active';

      let note = '';
      if (s.key === 'invited' && i <= currentIdx) {
        note = `<div class="timeline-note">Email sent to <strong>${u.email}</strong></div>`;
      }
      if (s.key === 'email_verified' && i < currentIdx) {
        note = `<div class="timeline-note" style="background:var(--color-success-bg);border-left-color:var(--color-success);color:var(--color-success)">User returned via magic link</div>`;
      }
      if (s.key === 'verification_pending' && state === 'active') {
        note = `<div class="timeline-note">User redirected to <strong>SecuritizeID</strong> for KYC. Awaiting confirmation.<br><span style="font-size:11px;margin-top:4px;display:block;opacity:0.8">Pending approval from SecuritizeID · System Admin notified</span></div>`;
      }
      if (s.key === 'verification_pending' && state === 'complete') {
        note = `<div class="timeline-note" style="background:var(--color-success-bg);border-left-color:var(--color-success);color:var(--color-success)">KYC verified via SecuritizeID</div>`;
      }

      return `
        <div class="timeline-item">
          <div class="timeline-dot ${state}"></div>
          <div class="timeline-label">${s.label}</div>
          <div class="timeline-meta">${s.desc}</div>
          ${note}
        </div>`;
    }).join('');

    const co = State.getCompany(u.companyId);
    const br = State.getBranch(u.branchId);

    const nextStep = currentIdx < statusOrder.length - 1 && !isFailed && !isSuspended
      ? steps[currentIdx + 1] : null;

    return `
      <div class="card" style="padding:0;overflow:hidden;position:sticky;top:72px">
        <div style="padding:16px 20px;border-bottom:1px solid var(--color-border);background:var(--color-surface);display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-weight:700;font-size:14px">${Display.fullName(u)}</div>
            <div style="font-size:12px;color:var(--color-text-secondary)">${u.email}</div>
          </div>
          <button class="btn btn-ghost btn-xs" onclick="OnboardingView.selectUser(null)">✕</button>
        </div>

        <div style="padding:16px 20px;border-bottom:1px solid var(--color-border)">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span>
            <span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span>
          </div>
          <div style="margin-top:8px;font-size:12px;color:var(--color-text-secondary)">${co ? co.name : ''} ${br ? '· ' + br.name : ''}</div>
        </div>

        <div style="padding:20px">
          <div class="section-title" style="margin-bottom:16px">Onboarding Steps</div>
          <div class="timeline">${stepItems}</div>
        </div>

        ${canEdit && (nextStep || isFailed || isSuspended) ? `
          <div style="padding:14px 20px;border-top:1px solid var(--color-border);display:flex;gap:8px;flex-wrap:wrap">
            ${nextStep ? `<button class="btn btn-primary btn-sm" onclick="OnboardingView.advance('${u.id}')">Advance to: ${nextStep.label}</button>` : ''}
            ${!isSuspended && u.onboardingStatus !== 'active' ? `<button class="btn btn-danger-ghost btn-sm" onclick="OnboardingView.suspendUser('${u.id}')">Suspend</button>` : ''}
            ${isSuspended ? `<button class="btn btn-secondary btn-sm" onclick="OnboardingView.reactivateUser('${u.id}')">Reactivate</button>` : ''}
            ${isFailed ? `<button class="btn btn-secondary btn-sm" onclick="OnboardingView.retryKYC('${u.id}')">Retry KYC</button>` : ''}
          </div>` : ''}
      </div>`;
  },

  /* ---- Personal onboarding (LO / LP own steps) ---- */
  renderPersonalOnboarding() {
    const user = State.getCurrentUser();
    if (!user) return '<div class="page-body">No user found.</div>';
    return `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Account Setup</div>
        </div>
      </div>
      <div class="page-body" style="max-width:640px">
        ${this.renderUserWizard(user, false)}
      </div>`;
  },

  /* ---- Investor KYC ---- */
  renderInvestorKYC() {
    return `
      <div class="page-header">
        <div class="page-header-left"><div class="page-title">KYC Verification Status</div></div>
      </div>

      <div class="page-body" style="max-width:640px">
        <div class="wizard-card">
          <div class="wizard-icon" style="background:#DCFCE7;color:var(--color-success)"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2"><circle cx="14" cy="14" r="12"/><path d="M8 14l4 4 8-8"/></svg></div>
          <div class="wizard-title">Identity Verified</div>
          <div class="wizard-desc">
            Your SecuritizeID KYC verification is complete. You have been granted Accredited Investor status on the Homium platform.
          </div>

          <div class="info-grid">
            <div class="info-row"><div class="info-label">Verification Method</div><div class="info-value">SecuritizeID</div></div>
            <div class="info-row"><div class="info-label">Status</div><div class="info-value"><span class="badge badge-active">Verified</span></div></div>
            <div class="info-row"><div class="info-label">Accreditation</div><div class="info-value">Accredited Investor</div></div>
            <div class="info-row"><div class="info-label">Verified On</div><div class="info-value">Jan 12, 2026</div></div>
          </div>
        </div>

        <div class="wizard-card" style="margin-top:16px">
          <div style="font-weight:700;font-size:14px;margin-bottom:12px">Verification Steps</div>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-dot complete"></div>
              <div class="timeline-label">Account Invitation</div>
              <div class="timeline-meta">Welcome email sent by Homium</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot complete"></div>
              <div class="timeline-label">Email Verified</div>
              <div class="timeline-meta">Confirmed via magic link</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot complete"></div>
              <div class="timeline-label">SecuritizeID KYC</div>
              <div class="timeline-meta">Identity and accreditation verified</div>
              <div class="timeline-note" style="background:var(--color-success-bg);border-left-color:var(--color-success);color:var(--color-success)">Returned via magic link from SecuritizeID</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot complete"></div>
              <div class="timeline-label">Active</div>
              <div class="timeline-meta">Account fully activated</div>
            </div>
          </div>
        </div>
      </div>`;
  },

  selectUser(userId) {
    this._selectedUserId = userId;
    App.renderView('/onboarding');
  },

  advance(userId) {
    State.advanceOnboarding(userId);
    UsersView.showSuccess('Onboarding status advanced');
    // Refresh wizard panel
    if (this._selectedUserId === userId) {
      const u = State.getUser(userId);
      if (u) {
        const wizardEl = document.querySelector('.side-panel') || document.querySelector('[style*="position:sticky"]');
        if (!wizardEl) App.renderView('/onboarding');
        else App.renderView('/onboarding');
      }
    } else {
      App.renderView('/onboarding');
    }
  },

  suspendUser(userId) {
    State.suspendUser(userId);
    UsersView.showSuccess('User suspended');
    App.renderView('/onboarding');
  },

  reactivateUser(userId) {
    State.updateUser(userId, { onboardingStatus: 'active' });
    UsersView.showSuccess('User reactivated');
    App.renderView('/onboarding');
  },

  retryKYC(userId) {
    State.updateUser(userId, { onboardingStatus: 'verification_pending' });
    UsersView.showSuccess('KYC retry initiated — user notified via email');
    App.renderView('/onboarding');
  },
};
