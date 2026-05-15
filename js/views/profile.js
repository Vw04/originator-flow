/* ============================================================
   HOMIUM ORIGINATOR FLOW — Profile / User Detail View
   ============================================================ */

const ProfileView = {

  /* Backwards-compatible entry point — every caller across the codebase
     invokes `ProfileView.open(id)`. We now navigate to the full-page
     profile route instead of opening a side panel. */
  open(userId) {
    if (!userId) return;
    Router.navigate('/users/' + userId);
  },

  /* No-op kept so any leftover `ProfileView.close()` calls (e.g. from
     impersonation tear-down in app.js) don't throw. The panel render
     path is gone. */
  close() {},

  /* tab state for the user profile page */
  _profileTab: 'details',
  _editMode: false,

  /* Full-page user profile — institutional treatment per Figma. Reachable
     via `/users/:userId` (view) or `/users/:userId/edit` (edit). */
  renderPage(userId, opts) {
    opts = opts || {};
    this._editMode = !!opts.edit;
    const u = State.getUser(userId);
    if (!u) {
      return `
        <div class="page-body">
          <div class="inst-card"><div class="inst-card-title">User not found</div>No user matches id ${userId}.</div>
        </div>`;
    }

    const canEdit = State.can('editAny') || State.can('manageUsers');
    const co = State.getCompany(u.companyId);
    const entity = u.investorEntityId
      ? (State.getInvestorEntities().find(e => e.id === u.investorEntityId) || null)
      : null;
    const isHomium = /@homium\.io$/i.test(u.email || '');
    const isInvestor = u.role === 'investor' || u.role === 'investor_prospect';
    const isOC = ['prog_admin', 'lo', 'lp'].includes(u.role);

    /* Back link */
    const backUrl = (() => {
      if (isHomium) return '/platform-operator/users';
      if (isInvestor && entity) return '/investors/' + entity.id + '/users';
      if (isInvestor) return '/investors/users';
      if (co) return '/origination-companies/' + co.id;
      return '/user-management';
    })();
    const backLabel = (() => {
      if (isHomium) return 'Platform Operator';
      if (isInvestor && entity) return entity.name;
      if (isInvestor) return 'Investors';
      if (co) return co.name;
      return 'User Management';
    })();

    /* Tabs: Details | Companies / Branches (N) */
    const cbCount = (State.getBranchAssignments(u.id) || []).length;
    const tabs = [
      { key: 'details', label: 'Details', count: null },
      { key: 'cb',      label: 'Companies / Branches', count: cbCount },
    ];
    if (!tabs.find(t => t.key === this._profileTab)) this._profileTab = 'details';
    const tabsHtml = tabs.map(t =>
      `<div class="section-tab ${t.key === this._profileTab ? 'active' : ''}"
            onclick="ProfileView.switchProfileTab('${t.key}')">${t.label}${t.count != null ? ` <span style="opacity:0.55;font-weight:400">(${t.count})</span>` : ''}</div>`
    ).join('');

    /* Page actions in header */
    const editing = this._editMode;
    const actions = canEdit ? (editing ? '' : `
      ${State.can('impersonate') && u.id !== State.getCurrentUser()?.id && u.onboardingStatus !== 'suspended'
        ? `<button class="btn btn-secondary btn-sm" onclick="App.startImpersonation('${u.id}')">${u.onboardingStatus === 'active' ? 'Impersonate' : 'Run as invitee →'}</button>`
        : ''}
      <button class="btn btn-secondary btn-sm" onclick="ProfileView.enterEditMode('${u.id}')">Edit</button>
    `) : '';

    /* Header meta row: Role | NMLS # | Timezone */
    const meta = [
      { label: 'Role', value: Display.roleName(u.role) },
      { label: 'NMLS #', value: u.nmlsId || '—' },
      { label: 'Timezone', value: u.timezone || 'PT' },
    ];
    const metaHtml = meta.map((m, i) =>
      `<div><span class="entity-meta-label">${m.label}</span> <span class="entity-meta-value">${m.value}</span></div>${i < meta.length - 1 ? '<span class="entity-meta-sep">|</span>' : ''}`
    ).join('');

    const statusPill = u.onboardingStatus === 'active'
      ? `<span class="entity-status-pill">Active</span>`
      : `<span class="entity-status-pill" style="color:var(--color-warning)">${Display.onboardingStatusLabel(u.onboardingStatus)}</span>`;

    /* Tab body */
    let content;
    if (this._profileTab === 'cb') content = this._renderProfileCB(u);
    else content = this._renderProfileDetails(u, { co, entity, isInvestor, isHomium, isOC, editing });

    /* Sticky footer for edit mode */
    const footer = editing ? `
      <div class="inst-footer-bar">
        <button class="btn btn-secondary btn-sm" onclick="ProfileView.cancelEdit('${u.id}')">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ProfileView.saveEdit('${u.id}')">Save changes</button>
      </div>` : '';

    return `
      <button class="back-link" onclick="Router.navigate('${backUrl}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Back to ${backLabel === 'User Management' ? 'Users' : backLabel}
      </button>
      <div class="entity-header">
        <div class="entity-header-row">
          <div>
            <h1 class="entity-header-title">${Display.fullName(u)}</h1>
            <div class="entity-header-subtitle">${u.email}</div>
          </div>
          <div class="entity-header-actions">${actions}</div>
        </div>
        <div class="entity-meta-row">
          ${metaHtml}
          ${statusPill}
        </div>
      </div>
      <div class="section-tabs">${tabsHtml}</div>
      <div class="page-body">${content}</div>
      ${footer}`;
  },

  switchProfileTab(tab) {
    this._profileTab = tab;
    App.renderView(Router.getCurrentPath());
  },

  enterEditMode(userId) {
    Router.navigate('/users/' + userId + '/edit');
  },

  cancelEdit(userId) {
    Router.navigate('/users/' + userId);
  },

  saveEdit(userId) {
    const get = (id) => document.getElementById(id)?.value.trim();
    const patch = {
      firstName: get('edit-first'),
      lastName:  get('edit-last'),
      email:     get('edit-email'),
      title:     get('edit-title') || null,
      phone:     get('edit-phone') || null,
      nmlsId:    get('edit-nmls') || null,
      timezone:  get('edit-tz') || null,
    };
    Object.keys(patch).forEach(k => { if (patch[k] === undefined) delete patch[k]; });
    if (State.updateUser) State.updateUser(userId, patch);
    Router.navigate('/users/' + userId);
  },

  /* ---- Details tab body ---- */
  _renderProfileDetails(u, ctx) {
    const { co, entity, isInvestor, isHomium, isOC, editing } = ctx;

    /* Field renderer: editable input or readonly outlined box */
    const field = (label, value, opts) => {
      opts = opts || {};
      const v = value == null ? '' : value;
      if (editing && !opts.locked) {
        return `
          <div class="form-group">
            <label>${label}</label>
            <input class="input" id="${opts.id}" value="${String(v).replace(/"/g, '&quot;')}" />
          </div>`;
      }
      const empty = v === '' ? ' empty' : '';
      const shown = v === '' ? '—' : v;
      return `
        <div class="form-group">
          <label>${label}</label>
          <div class="input is-readonly${empty}">${shown}</div>
        </div>`;
    };

    /* "User information" card per Figma */
    const userInfoCard = `
      <div class="inst-card">
        <div class="inst-card-title">User information</div>
        <div class="inst-form-grid">
          ${field('First name', u.firstName, { id: 'edit-first' })}
          ${field('Last name', u.lastName, { id: 'edit-last' })}
          ${field('Email', u.email, { id: 'edit-email' })}
          ${field('Role', Display.roleName(u.role), { locked: true })}
          ${field('Title', u.title, { id: 'edit-title' })}
          ${field('Phone', u.phone, { id: 'edit-phone' })}
          ${field('Timezone', u.timezone || 'PT', { id: 'edit-tz' })}
          ${field('NMLS #', u.nmlsId, { id: 'edit-nmls' })}
        </div>
      </div>`;

    /* Loan officer details (LO only) */
    const isLO = u.role === 'lo';
    const loDetails = isLO ? (() => {
      const assignment = (State.getBranchAssignments(u.id) || []).find(a => a.userType === 'lo');
      const allowNew  = assignment ? (assignment.allowNewOriginations !== false ? 'Yes' : 'No') : 'Yes';
      const allowAll  = assignment ? (assignment.allowAccessToAllBranchActivity ? 'Yes' : 'No') : 'No';
      const markets   = (u.licenses || []).map(l => State.getMarket(l.marketId)?.code).filter(Boolean).join(', ');
      return `
        <div class="inst-card">
          <div class="inst-card-title">Loan officer details</div>
          <div class="inst-form-grid">
            ${field('Agent NMLS #', u.agentNmlsId || u.nmlsId, { locked: true })}
            ${field('Allow new originations', allowNew, { locked: true })}
            ${field('Market enablement', markets, { locked: true })}
            ${field('Allow access to all branch activity', allowAll, { locked: true })}
          </div>
        </div>`;
    })() : '';

    /* State licenses & registrations table */
    const licenseTable = isOC ? this._renderLicenseTable(u, co) : '';

    /* Investor / Homium specific bits */
    const affiliationCard = (isInvestor && entity) ? `
      <div class="inst-card">
        <div class="inst-card-title">Investor entity</div>
        <div class="inst-form-grid">
          ${field('Entity', entity.name, { locked: true })}
          ${field('Manager', entity.manager || '—', { locked: true })}
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/investors/${entity.id}')">View entity →</button>
        </div>
      </div>` : '';

    const homiumCard = isHomium ? `
      <div class="inst-card">
        <div class="inst-card-title">Organization</div>
        <div class="inst-form-grid">
          ${field('Organization', 'Homium, Inc.', { locked: true })}
          ${field('Platform Role', Display.roleName(u.role), { locked: true })}
        </div>
      </div>` : '';

    /* Permissions placeholder */
    const permsCard = `
      <div class="inst-card">
        <div class="inst-card-title">Permissions</div>
        <div style="font-size:12.5px;color:var(--color-text-muted);line-height:1.6;max-width:760px">
          Per-user permission matrix is coming soon. Until then, this user inherits the
          ${isHomium ? 'platform-operator' : isInvestor ? 'investor-entity' : 'company / branch'}
          policy assigned to their role.
        </div>
      </div>`;

    return `
      ${userInfoCard}
      ${loDetails}
      ${licenseTable}
      ${affiliationCard}
      ${homiumCard}
      ${permsCard}`;
  },

  /* ---- Companies / Branches tab body ---- */
  _renderProfileCB(u) {
    const assignments = State.getBranchAssignments(u.id) || [];
    if (!assignments.length) {
      return `
        <div class="inst-card">
          <div class="inst-card-title">Companies / Branches</div>
          <div style="color:var(--color-text-muted);font-size:13px">This user isn't assigned to any branches yet.</div>
        </div>`;
    }
    /* Reuse the existing helpers — they render rich branch-assignment cards. */
    const eligibility = this._renderEligibilityLine(u, true);
    const branchCards = this._renderBranchAssignmentCards(u, true);
    return `${eligibility}${branchCards}`;
  },

  /* ---- State licenses & registrations table (Figma user screenshot) ---- */
  _renderLicenseTable(u, co) {
    const licenses = u.licenses || [];
    if (!licenses.length) {
      return `
        <div class="inst-card">
          <div class="inst-card-title">
            <span>State licenses &amp; registrations</span>
          </div>
          <div style="color:var(--color-text-muted);font-size:13px">No licenses on file.</div>
        </div>`;
    }
    const today = new Date();
    let activeCount = 0;
    licenses.forEach(l => { if (l.active) activeCount++; });

    const rows = licenses.map((l, idx) => {
      const m = State.getMarket(l.marketId);
      const stateCode = m?.code || '—';
      const stateName = m?.name || '—';
      const status = State.getLicenseExpiryStatus(l, today);
      const statusLabel = l.active ? 'Approved' : 'Inactive';
      const statusClass = l.active ? 'success' : 'muted';
      const licenseNumber = l.licenseNumber || `LO-${String(u.nmlsId || '').slice(-4)}${stateCode}`;
      const licenseName = l.licenseName || (u.role === 'lo' ? 'Loan Originator License' : 'Mortgage Loan Originator License');
      const renewalYear = l.renewalDate ? new Date(l.renewalDate).getFullYear() : '—';
      const issueDate = l.issueDate ? Display.date(l.issueDate) : '—';
      const statusDate = l.statusDate ? Display.date(l.statusDate) : issueDate;
      const authCompany = l.authorizedCompany || (co ? co.name : '—');
      const authNmls = l.authorizedNmlsId || (co ? co.nmlsId : '—');
      const startDate = l.startDate ? Display.date(l.startDate) : issueDate;
      const expanded = this._expandedLicenseId === l.id;
      const arrow = expanded ? '▾' : '▸';

      return `
        <tr class="lic-row" onclick="ProfileView._toggleLicense('${l.id}')">
          <td><span style="color:var(--color-text-muted);margin-right:6px">${arrow}</span><a style="color:var(--color-primary);font-weight:600">${stateCode === stateName ? stateCode : stateName}</a></td>
          <td>${licenseName}</td>
          <td class="mono">${licenseNumber}</td>
          <td><span class="status-pill" style="color:${l.active ? 'var(--color-success)' : 'var(--color-text-muted)'}"><span class="status-dot"></span>${statusLabel}</span></td>
          <td><span class="status-pill" style="color:${l.active ? 'var(--color-success)' : 'var(--color-text-muted)'}"><span class="status-dot"></span>${l.active ? 'Yes' : 'No'}</span></td>
        </tr>
        ${expanded ? `
        <tr class="lic-row-expanded">
          <td colspan="5" style="background:#FAFAF7;padding:14px 18px">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px 24px;font-size:12.5px">
              <div><span class="entity-meta-label" style="display:block;margin-bottom:4px">Original issue date</span>${issueDate}</div>
              <div><span class="entity-meta-label" style="display:block;margin-bottom:4px">Status date</span>${statusDate}</div>
              <div><span class="entity-meta-label" style="display:block;margin-bottom:4px">Renewed through</span>${renewalYear}</div>
            </div>
            <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--color-border-light)">
              <span class="entity-meta-label" style="display:block;margin-bottom:6px">Currently authorized to represent</span>
              <div><strong>Company:</strong> ${authCompany}</div>
              <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">NMLS ID: ${authNmls} &nbsp;·&nbsp; Start date: ${startDate}</div>
            </div>
          </td>
        </tr>` : ''}`;
    }).join('');

    return `
      <div class="inst-card">
        <div class="inst-card-title">
          <span>State licenses &amp; registrations</span>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="count">${activeCount} active of ${licenses.length} total</span>
            <button class="btn btn-secondary btn-sm">View all</button>
            <button class="btn btn-primary btn-sm">+ Add license</button>
          </div>
        </div>
        <table class="entity-table lic-table">
          <thead><tr>
            <th>Regulator</th>
            <th>LIC / REG Name</th>
            <th>LIC / REG #</th>
            <th>Status</th>
            <th>Auth. to Conduct</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  _toggleLicense(id) {
    this._expandedLicenseId = this._expandedLicenseId === id ? null : id;
    App.renderView(Router.getCurrentPath());
  },

  suspend(userId) {
    State.suspendUser(userId);
    if (typeof UsersView !== 'undefined' && UsersView.showSuccess) UsersView.showSuccess('User suspended');
    App.renderView(Router.getCurrentPath() || '/user-management');
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
        <div class="page-header-inner">
          <div class="page-header-left"><div class="page-title">My Profile</div></div>
          <div class="page-header-actions">
            <button class="btn btn-primary btn-sm" onclick="ProfileView.openEditModal('${u.id}')">Edit Profile</button>
          </div>
        </div>
      </div>

      <div class="page-body profile-page">
        <div class="profile-grid">
          <div class="profile-col-left">

            <!-- Identity card -->
            <div class="card profile-identity-card">
              <div class="profile-identity-head">
                <div class="avatar avatar-lg" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
                <div class="profile-identity-text">
                  <div class="profile-identity-name">${Display.fullName(u)}</div>
                  <div class="profile-identity-chips">
                    <span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span>
                    <span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span>
                  </div>
                </div>
              </div>
              <hr class="divider" />
              <div class="info-grid info-grid-compact">
                <div class="info-row"><div class="info-label">Email</div><div class="info-value">${u.email}</div></div>
                <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${u.phone || '—'}</div></div>
                <div class="info-row"><div class="info-label">Title</div><div class="info-value">${u.title || '—'}</div></div>
                <div class="info-row"><div class="info-label">NMLS ID</div><div class="info-value">${u.nmlsId || '—'}</div></div>
                <div class="info-row"><div class="info-label">Company</div><div class="info-value">${co ? co.name : '—'}</div></div>
                <div class="info-row"><div class="info-label">Branch</div><div class="info-value">${br ? br.name : '—'}</div></div>
              </div>
            </div>

            <!-- Help & tutorials (LO/LP only) -->
            ${this._renderHelpAndTutorials(u)}
          </div>

          <div class="profile-col-right">

            <!-- Onboarding progress + credentials -->
            <div class="card profile-section">
              <div class="profile-section-title">Account Onboarding</div>
              ${this._renderFlowchart(u)}
              <div class="profile-divider"></div>
              ${this._renderCredentialChips(u, true)}
            </div>

            <!-- Effective access + branch assignments -->
            <div class="card profile-section">
              ${this._renderEligibilityLine(u, true)}
              ${this._renderBranchAssignmentCards(u, true)}
            </div>

            <!-- License records -->
            <div class="card profile-section">
              ${this._renderLicenseRecords(u, true)}
            </div>
          </div>
        </div>
      </div>`;
  },

  /* ---- Help & tutorials (welcome / coachmark replay) ---- */
  _renderHelpAndTutorials(u) {
    // Only OC users have a tour; hide for everyone else.
    if (!['lo', 'lp'].includes(u.role)) return '';
    const prefs = State.getWelcomePrefs(u.id);
    const on = prefs.tutorialsEnabled !== false;
    return `
      <div class="help-tutorials-card" data-cm="tutorials-section">
        <div class="card-title" style="margin-bottom:8px">Help &amp; tutorials</div>
        <div class="help-tutorials-toggle">
          <button class="toggle-switch ${on ? 'on' : ''}"
                  aria-pressed="${on}"
                  aria-label="Show guided tutorials"
                  onclick="ProfileView._toggleTutorials()"></button>
          <div>
            <div style="font-weight:600">Show guided tutorials</div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px">
              When on, we'll walk you through new features as we ship them.
            </div>
          </div>
        </div>
        <div class="help-tutorials-actions">
          <button class="btn btn-secondary btn-sm" onclick="ProfileView._replayWelcome()">Replay welcome screen</button>
          <button class="btn btn-secondary btn-sm" onclick="ProfileView._replayTour()">Replay guided tour</button>
        </div>
      </div>`;
  },

  _toggleTutorials() {
    const u = State.getCurrentUser();
    if (!u) return;
    const prefs = State.getWelcomePrefs(u.id);
    State.setWelcomePrefs(u.id, { tutorialsEnabled: !prefs.tutorialsEnabled });
    App.renderView('/profile');
  },

  _replayWelcome() {
    const u = State.getCurrentUser();
    if (!u) return;
    State.setWelcomePrefs(u.id, { welcomeSeen: false });
    Router.navigate('/data/applications');
    setTimeout(() => { if (typeof WelcomeView !== 'undefined') WelcomeView.openModal(); }, 80);
  },

  _replayTour() {
    const u = State.getCurrentUser();
    if (!u) return;
    State.setWelcomePrefs(u.id, {
      tourCompleted: false,
      tourCursor: 0,
      dismissedSteps: [],
      tutorialsEnabled: true,
      welcomeSeen: true,
    });
    Router.navigate('/data/applications');
  },

  /* ---- KYC + NMLS credential chips ---- */
  _renderCredentialChips(u, fullPage) {
    const kyc = u.kyc || State.getKyc(u.id);
    const link = u.nmlsLink || State.getNmlsLink(u.id);
    const isLO = u.role === 'lo' || (u.branchAssignments || []).some(a => a.userType === 'lo');
    const isSelf = State.getCurrentUser()?.id === u.id;
    // KYC is required only for LOs and investors. OC standard users + platform staff skip it.
    const needsKyc = isLO || u.role === 'investor';

    const chip = ({ ok, pending, label, sub, muted }) => {
      const bg = muted ? '#F3F4F6' : ok ? '#DCFCE7' : pending ? '#FEF3C7' : '#F3F4F6';
      const fg = muted ? 'var(--color-text-muted)' : ok ? '#166534' : pending ? '#8A5A00' : 'var(--color-text-muted)';
      const icon = muted ? '–' : ok ? '✓' : pending ? '⏳' : '—';
      return `
        <div style="display:inline-flex;flex-direction:column;gap:2px;padding:8px 12px;border-radius:8px;background:${bg};color:${fg};min-width:180px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;display:flex;align-items:center;gap:6px">${icon} ${label}</div>
          <div style="font-size:11px;color:${fg};opacity:.85">${sub}</div>
        </div>`;
    };

    const kycChip = needsKyc ? chip({
      ok: kyc.status === 'verified',
      pending: kyc.status === 'pending',
      label: 'Identity (KYC)',
      sub: kyc.status === 'verified'
        ? `Securitize · ${kyc.referenceId || 'verified'}`
        : kyc.status === 'pending' ? 'Verification in progress' : 'Not started',
    }) : chip({
      muted: true,
      label: 'Identity (KYC)',
      sub: 'Not required for this user type',
    });

    const nmlsChip = chip({
      ok: link.status === 'verified',
      pending: link.status === 'pending',
      label: 'NMLS license',
      sub: link.status === 'verified'
        ? `${link.nmlsId || ''} · ${(link.licensedStates || []).length} state${(link.licensedStates || []).length === 1 ? '' : 's'}`
        : link.nmlsId ? `${link.nmlsId} · not yet linked` : 'Not linked',
    });

    const linkBtn = (isSelf && isLO && link.status !== 'verified') ? `
      <button class="btn btn-ghost btn-xs" style="margin-left:8px;align-self:center" onclick="OnboardingFlowView.open('${u.role}', { userId: '${u.id}' })">Link NMLS →</button>` : '';

    const outerStyle = fullPage
      ? 'display:flex;flex-wrap:wrap;gap:10px;align-items:stretch;margin-bottom:20px'
      : 'display:flex;flex-wrap:wrap;gap:8px;align-items:stretch;margin-bottom:18px';

    const sectionTitle = fullPage
      ? '<div class="section-title" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:10px">Credentials</div>'
      : '<div class="section-title">Credentials</div>';

    return `
      ${sectionTitle}
      <div style="${outerStyle}">
        ${kycChip}
        ${nmlsChip}
        ${linkBtn}
      </div>`;
  },

  /* ---- RBAC v1.2 §1.4 effective access summary ---- */
  _renderEligibilityLine(u, fullPage) {
    const assignments = State.getBranchAssignments(u.id);
    if (!assignments.length) return '';
    const isLO = assignments.some(a => a.userType === 'lo');
    const allLpms = new Set();
    const blockedLicense = new Set();
    const blockedOcOrBranch = new Set();
    assignments.forEach(a => {
      const eff = State.effectiveAccess(u.id, a.branchId);
      eff.lpmIds.forEach(id => allLpms.add(id));
      (eff.blockedBy.license || []).forEach(id => blockedLicense.add(id));
      [...(eff.blockedBy.oc || []), ...(eff.blockedBy.branch || [])].forEach(id => blockedOcOrBranch.add(id));
    });
    const eligible = [...allLpms].map(id => {
      const lpm = State.getLPM(id);
      const p = State.getLoanProgram(lpm?.programId);
      const m = State.getMarket(lpm?.marketId);
      return p && m ? `${p.name} — ${m.code}` : null;
    }).filter(Boolean);
    const blocked = [...blockedLicense].map(id => {
      const lpm = State.getLPM(id);
      const p = State.getLoanProgram(lpm?.programId);
      const m = State.getMarket(lpm?.marketId);
      return p && m ? `${p.name} — ${m.code} (license missing)` : null;
    }).filter(Boolean);
    const cls = fullPage ? 'card' : '';
    const wrap = fullPage ? `style="padding:14px 16px;margin-bottom:16px;font-size:13px"` : `style="padding:10px 12px;margin-bottom:16px;background:var(--color-surface);border-radius:6px;font-size:12px"`;
    return `
      <div class="${cls}" ${wrap}>
        <div style="font-size:11px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Effective Access (§1.4 gate)</div>
        <div style="margin-bottom:4px"><strong>Eligible to ${isLO ? 'originate' : 'access'} in:</strong> ${eligible.length ? eligible.join(' · ') : '<span style="color:var(--color-text-muted)">none</span>'}${!isLO ? ' <span style="color:var(--color-text-muted);font-weight:400">(license dim n/a — Standard User)</span>' : ''}</div>
        ${blocked.length ? `<div style="color:var(--color-warning)"><strong>Blocked:</strong> ${blocked.join(' · ')}</div>` : ''}
        ${blockedOcOrBranch.size ? `<div style="color:var(--color-text-muted);font-size:11px;margin-top:2px">${blockedOcOrBranch.size} LPM(s) blocked at OC or branch level — see assignment cards below.</div>` : ''}
      </div>`;
  },

  /* ---- Branch Assignment cards (spec §3 composite tuple) ---- */
  _renderBranchAssignmentCards(u, fullPage) {
    const assignments = State.getBranchAssignments(u.id);
    if (!assignments.length) return '';
    const today = new Date();
    const cls = fullPage ? 'card' : '';
    const wrap = fullPage ? `style="padding:14px 16px;margin-bottom:16px"` : '';

    const cards = assignments.map(a => {
      const branch = State.getBranch(a.branchId);
      if (!branch) return '';
      const eff = State.effectiveAccess(u.id, a.branchId);
      const futureGrant = State.hasFutureGrant(u.id, a.branchId);
      const eligibleLPMs = eff.lpmIds.map(id => {
        const lpm = State.getLPM(id);
        const p = State.getLoanProgram(lpm?.programId);
        const m = State.getMarket(lpm?.marketId);
        return p && m ? `${p.code}/${m.code}` : null;
      }).filter(Boolean);
      const utBadge = a.userType === 'lo'
        ? '<span class="tag" style="background:#e6f4ec;color:#1f6f43;font-weight:600">Loan Officer</span>'
        : '<span class="tag">Standard User</span>';
      const bmBadge = a.flags?.branchManager ? '<span class="tag" style="background:#fff7e6;color:#a35c00;font-weight:600;margin-left:4px">Branch Manager</span>' : '';

      const tupleRows = (a.loAssignments || []).map(t => {
        const scopeLabel = t.scope === 'personal' ? 'Personal Only'
          : t.scope === 'specific_los' ? `Specific LOs (${(t.loIds || []).length})`
          : 'All LOs';
        const levelLabel = { no_access: 'No Access', view: 'View Only', edit: 'Can Edit', full: 'Full Access' }[t.level];
        const subflagsLabel = t.level === 'edit'
          ? Object.entries(t.subflags || {}).filter(([k, v]) => v).map(([k]) => k.replace('can', '')).join(' · ') || '—'
          : '—';
        const floorNote = a.userType === 'lo' && t.scope === 'personal'
          ? '<span style="color:var(--color-text-muted);font-size:10px">LO-on-own (locked Full)</span>'
          : a.flags?.branchManager && t.scope === 'all_los'
          ? '<span style="color:var(--color-text-muted);font-size:10px">BM floor (≥ View)</span>'
          : '';
        return `
          <tr>
            <td style="padding:6px 8px;font-size:12px">${scopeLabel}</td>
            <td style="padding:6px 8px;font-size:12px;font-weight:500">${levelLabel}</td>
            <td style="padding:6px 8px;font-size:11px;color:var(--color-text-muted)">${subflagsLabel}</td>
            <td style="padding:6px 8px">${floorNote}</td>
          </tr>`;
      }).join('') || '<tr><td colspan="4" style="padding:8px;color:var(--color-text-muted);font-size:11px;text-align:center">No tuples configured.</td></tr>';

      const togglesRow = a.userType === 'lo' ? `
        <div style="display:flex;gap:14px;margin-top:10px;font-size:11px;color:var(--color-text-muted)">
          <label style="display:flex;align-items:center;gap:4px"><input type="checkbox" ${a.allowNewOriginations !== false ? 'checked' : ''} disabled> Allow new originations</label>
          <label style="display:flex;align-items:center;gap:4px"><input type="checkbox" ${a.allowAccessToAllBranchActivity ? 'checked' : ''} disabled> All-branch activity</label>
        </div>` : '';

      return `
        <div style="border:1px solid var(--color-border);border-radius:8px;padding:12px;margin-bottom:10px;background:var(--color-card)">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <strong style="font-size:13px">${branch.name}</strong>
              ${utBadge}${bmBadge}
            </div>
            ${branch.lastNmlsSync ? `<span style="font-size:10px;color:var(--color-text-muted)"><span class="status-dot" style="display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--color-success);margin-right:3px"></span>NMLS sync ${Display.relativeTime(branch.lastNmlsSync)}</span>` : ''}
          </div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:8px">
            Eligible: ${eligibleLPMs.length ? eligibleLPMs.join(', ') : '<span style="color:var(--color-warning)">—</span>'}
            ${(eff.blockedBy.oc?.length || eff.blockedBy.branch?.length) ? `· <span style="color:var(--color-warning)">${(eff.blockedBy.oc?.length || 0) + (eff.blockedBy.branch?.length || 0)} blocked at OC/branch</span>` : ''}
            ${eff.blockedBy.license?.length ? `· <span style="color:var(--color-warning)">${eff.blockedBy.license.length} blocked by license</span>` : ''}
          </div>
          <table style="width:100%;border-collapse:collapse;background:var(--color-surface);border-radius:6px;overflow:hidden">
            <thead><tr style="font-size:10px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em">
              <th style="padding:6px 8px;text-align:left">LO Assignment</th>
              <th style="padding:6px 8px;text-align:left">Permission Level</th>
              <th style="padding:6px 8px;text-align:left">Subflags</th>
              <th style="padding:6px 8px;text-align:left">Floor invariant</th>
            </tr></thead>
            <tbody>${tupleRows}</tbody>
          </table>
          ${togglesRow}
          ${futureGrant ? `<div style="font-size:10px;color:var(--color-text-muted);margin-top:6px">+ Auto-inherits new LOs added to this branch (spec §3.7 future grant)</div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="${cls}" ${wrap}>
        <div class="${fullPage ? 'card-title' : 'section-title'}" style="margin-bottom:10px">Branch Assignments <span style="color:var(--color-text-muted);font-weight:400;font-size:12px">${assignments.length} branch${assignments.length === 1 ? '' : 'es'}</span></div>
        ${cards}
      </div>`;
  },

  /* ---- License Records (LO sub-layer) ---- */
  _renderLicenseRecords(u, fullPage) {
    const licenses = u.licenses || [];
    if (!licenses.length) return '';
    const today = new Date();
    const rows = licenses.map(l => {
      const m = State.getMarket(l.marketId);
      const status = State.getLicenseExpiryStatus(l, today);
      const tier = status?.tier || 'ok';
      let pillClass = 'badge-active';
      let pillLabel = 'Active';
      if (tier === 'inactive') { pillClass = 'badge-suspended'; pillLabel = 'Inactive'; }
      else if (tier === 'expired') { pillClass = 'badge-failed'; pillLabel = `Expired ${-status.days}d ago`; }
      else if (tier === 'critical') { pillClass = 'badge-failed'; pillLabel = `${status.days}d critical`; }
      else if (tier === 'warning') { pillClass = 'badge-pending'; pillLabel = `${status.days}d warning`; }
      else if (tier === 'soon') { pillClass = 'badge-2fa'; pillLabel = `${status.days}d`; }
      return `
        <tr>
          <td style="padding:6px 8px;font-weight:500">${m?.code || '—'}</td>
          <td style="padding:6px 8px;font-size:11px;color:var(--color-text-muted)">${l.regulator || '—'}</td>
          <td style="padding:6px 8px"><span class="status-pill ${pillClass}"><span class="status-dot"></span>${pillLabel}</span></td>
          <td style="padding:6px 8px;font-size:11px">${Display.date(l.renewalDate)}</td>
          <td style="padding:6px 8px;font-size:10px;color:var(--color-text-muted)">${l.lastSync ? Display.relativeTime(l.lastSync) : '—'}</td>
        </tr>`;
    }).join('');
    const cls = fullPage ? 'card' : '';
    const wrap = fullPage ? `style="padding:14px 16px;margin-bottom:16px"` : '';
    return `
      <div class="${cls}" ${wrap}>
        <div class="${fullPage ? 'card-title' : 'section-title'}" style="margin-bottom:6px">Licenses <span style="color:var(--color-text-muted);font-weight:400;font-size:11px">NMLS-sourced · daily sync</span></div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:8px">${licenses.length} state${licenses.length === 1 ? '' : 's'} licensed</div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="font-size:10px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em">
            <th style="padding:6px 8px;text-align:left">Market</th>
            <th style="padding:6px 8px;text-align:left">Regulator</th>
            <th style="padding:6px 8px;text-align:left">Status</th>
            <th style="padding:6px 8px;text-align:left">Renewal</th>
            <th style="padding:6px 8px;text-align:left">Last Sync</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
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
