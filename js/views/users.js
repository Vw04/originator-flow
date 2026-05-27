/* ============================================================
   HOMIUM ORIGINATOR FLOW — Users View
   ============================================================ */

const UsersView = {
  _filter: { search: '', role: '', status: '', branchId: '', companyId: '', investorEntityId: '' },
  _sort: { col: null, dir: 'asc' },

  _roleOrder:   { sys_admin: 0, operator: 1, prog_admin: 2, lo: 3, lp: 4, investor: 5 },
  _statusOrder: { invited: 0, email_verified: 1, '2fa_complete': 2, verification_pending: 3, active: 4, verification_failed: 5, suspended: 6 },

  setSort(col) {
    if (this._sort.col === col) {
      this._sort.dir = this._sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sort.col = col;
      this._sort.dir = 'asc';
    }
    this._rerender();
  },

  _sortUsers(users) {
    const { col, dir } = this._sort;
    if (!col) return users;
    const mul = dir === 'asc' ? 1 : -1;
    return [...users].sort((a, b) => {
      if (col === 'name')   return mul * Display.fullName(a).localeCompare(Display.fullName(b));
      if (col === 'role')   return mul * ((this._roleOrder[a.role] ?? 99) - (this._roleOrder[b.role] ?? 99));
      if (col === 'status') return mul * ((this._statusOrder[a.onboardingStatus] ?? 99) - (this._statusOrder[b.onboardingStatus] ?? 99));
      if (col === 'login')  return mul * ((a.lastLogin || '').localeCompare(b.lastLogin || ''));
      return 0;
    });
  },

  _renderOnboardingBanner() {
    if (!State.can('viewOnboarding')) return '';
    if (this._scope) return ''; // hide banner in scoped/section views
    const allUsers = State.getUsers().filter(u => u.companyId);
    const counts = {
      invited:              allUsers.filter(u => u.onboardingStatus === 'invited').length,
      email_verified:       allUsers.filter(u => u.onboardingStatus === 'email_verified').length,
      twofa_complete:       allUsers.filter(u => u.onboardingStatus === '2fa_complete').length,
      verification_pending: allUsers.filter(u => u.onboardingStatus === 'verification_pending').length,
      active:               allUsers.filter(u => u.onboardingStatus === 'active').length,
    };
    const pending = counts.invited + counts.email_verified + counts.twofa_complete + counts.verification_pending;
    return `
      <div class="onboarding-banner">
        <div class="onboarding-banner-stats">
          <div class="onboarding-stat">
            <div class="onboarding-stat-label">Active</div>
            <div class="onboarding-stat-value onboarding-stat-active">${counts.active}</div>
          </div>
          <div class="onboarding-stat-divider"></div>
          <div class="onboarding-stat">
            <div class="onboarding-stat-label">Invite Sent</div>
            <div class="onboarding-stat-value">${counts.invited}</div>
          </div>
          <div class="onboarding-stat-divider"></div>
          <div class="onboarding-stat">
            <div class="onboarding-stat-label">Email Verified</div>
            <div class="onboarding-stat-value">${counts.email_verified}</div>
          </div>
          <div class="onboarding-stat-divider"></div>
          <div class="onboarding-stat">
            <div class="onboarding-stat-label">2FA Complete</div>
            <div class="onboarding-stat-value">${counts.twofa_complete}</div>
          </div>
          <div class="onboarding-stat-divider"></div>
          <div class="onboarding-stat">
            <div class="onboarding-stat-label">KYC Pending</div>
            <div class="onboarding-stat-value">${counts.verification_pending}</div>
          </div>
        </div>
        <div class="onboarding-banner-actions">
          ${pending > 0 ? `<span style="font-size:12px;color:var(--h-warning);font-weight:600">${pending} pending</span>` : ''}
          <a class="btn btn-ghost btn-sm" onclick="Router.navigate('/onboarding')">View Full Report →</a>
        </div>
      </div>`;
  },

  /* scope: optional { companyId, roles, platformOnly } for section-scoped rendering */
  _scope: null,

  render(scope) {
    this._scope = scope || null;
    const role      = State.getRole();
    const currentUser = State.getCurrentUser();
    const canEdit   = State.can('manageUsers') || State.can('editAny');
    const canInvite = canEdit || role === 'prog_admin';
    const currentPath = Router.getCurrentPath() || '';
    /* The Add-User affordance routes to the appropriate flow per scope:
       - homiumOnly: PlatformRbacView wizard, category locked to 'platform'
       - investorEntityId: PlatformRbacView wizard, category locked to 'investor'
       - LO branch / company: existing BulkInviteView flow
       - platformOnly: legacy platform-only modal */
    let inviteOnclick;
    let inviteLabel = '+ Invite User';
    if (scope?.homiumOnly) {
      inviteOnclick = `PlatformRbacView.invStartCategory('platform', { returnPath: '${currentPath}' })`;
      inviteLabel = '+ Add Platform Operator';
    } else if (scope?.investorEntityId) {
      inviteOnclick = `PlatformRbacView.invStartCategory('investor', { investorEntityId: '${scope.investorEntityId}', returnPath: '${currentPath}' })`;
      inviteLabel = '+ Add Investor User';
    } else if (scope?.platformOnly) {
      inviteOnclick = 'UsersView.openPlatformInviteModal()';
    } else {
      inviteOnclick = `BulkInviteView.start({ companyId: '${scope?.companyId || ''}', returnPath: '${currentPath}' })`;
    }

    // Base user set — apply scope if provided
    let users;
    if (scope?.homiumOnly) {
      users = State.getHomiumUsers();
    } else if (scope?.platformOnly) {
      users = State.getPlatformUsers();
    } else if (scope?.companyId) {
      users = State.getUsersByCompany(scope.companyId);
    } else if (scope?.investorEntityId) {
      users = State.getUsers().filter(u => u.investorEntityId === scope.investorEntityId);
    } else if (scope?.roles && scope.roles.includes('investor')) {
      users = State.getInvestorUsers();
    } else {
      users = State.getUsers().filter(u => u.companyId); // exclude Homium staff from list
    }
    if (scope?.roles) users = users.filter(u => scope.roles.includes(u.role));

    // Legacy prog_admin scoping (when no explicit scope)
    if (!scope && role === 'prog_admin' && currentUser?.companyId) {
      users = users.filter(u => u.companyId === currentUser.companyId);
    }

    // Apply filters
    const f = this._filter;
    if (f.search) {
      const q = f.search.toLowerCase();
      users = users.filter(u =>
        Display.fullName(u).toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (f.role)             users = users.filter(u => u.role === f.role);
    if (f.status)           users = users.filter(u => u.onboardingStatus === f.status);
    if (f.branchId)         users = users.filter(u => u.branchId === f.branchId);
    if (f.companyId)        users = users.filter(u => u.companyId === f.companyId);
    if (f.investorEntityId) users = users.filter(u => u.investorEntityId === f.investorEntityId);

    // Branch options for filter
    let branches = State.getBranches();
    if (role === 'prog_admin' && currentUser?.companyId) {
      branches = branches.filter(b => b.companyId === currentUser.companyId);
    }
    const companies = State.getCompanies();

    users = this._sortUsers(users);
    const hideOrgCol = role === 'prog_admin' || scope?.companyId || scope?.investorEntityId;

    // Column mode: pick which secondary columns + filter pills the table shows.
    const columnMode = scope?.homiumOnly ? 'homium'
                     : (scope?.roles && scope.roles.includes('investor')) || scope?.investorEntityId ? 'investor'
                     : 'default';

    const investorEntities = State.getInvestorEntities();
    const entityById = (id) => investorEntities.find(e => e.id === id);

    const rows = users.map(u0 => {
      // Defensive re-fetch — bypass any potential closure-shadowing of u
      // and guarantee we render the LIVE user record from State, not a
      // stale snapshot. If the live record exists, prefer it.
      const u = State.getUser(u0.id) || u0;
      if (typeof console !== 'undefined' && u.role !== u0.role) {
        console.warn('[users.js] role mismatch for', u.id, 'closure:', u0.role, 'live:', u.role);
      }
      const co = State.getCompany(u.companyId);
      const entity = u.investorEntityId ? entityById(u.investorEntityId) : null;
      const assignments = State.getBranchAssignments(u.id);
      // Branch assignment chips with User Type + BM flag (spec §3.2/§3.3)
      const branchChips = assignments.map(a => {
        const branchObj = State.getBranch(a.branchId);
        const branchLabel = branchObj?.name?.replace(/^Branch ([A-Z]) — /, '$1 — ') || a.branchId;
        const ut = a.userType === 'lo' ? 'LO' : 'Std';
        const utColor = a.userType === 'lo' ? '#1f6f43' : 'var(--h-text-muted)';
        const utBg = a.userType === 'lo' ? '#e6f4ec' : 'var(--h-pearl)';
        const bmDot = a.flags?.branchManager ? `<span style="margin-left:4px;background:#fff7e6;color:#a35c00;padding:0 4px;border-radius:3px;font-size:9px;font-weight:700">BM</span>` : '';
        return `<span class="tag" style="margin-right:4px;font-size:10px;background:${utBg};color:${utColor};padding:2px 6px">${branchLabel} · ${ut}${bmDot}</span>`;
      }).join('') || '<span class="text-muted" style="font-size:11px">—</span>';
      // License summary chip (LO only)
      const today = new Date();
      const licenses = u.licenses || [];
      let licChip = '';
      if (licenses.length) {
        let expiring = 0;
        licenses.forEach(l => {
          const s = State.getLicenseExpiryStatus(l, today);
          if (s && (s.tier === 'critical' || s.tier === 'warning' || s.tier === 'expired' || s.tier === 'inactive')) expiring++;
        });
        const color = expiring > 0 ? 'var(--h-warning)' : 'var(--h-success)';
        const text = expiring > 0 ? `${licenses.length} states · ${expiring} alert${expiring === 1 ? '' : 's'}` : `${licenses.length} states · valid`;
        licChip = `<span class="tag" style="font-size:10px;background:${expiring > 0 ? '#fff7e6' : '#e6f4ec'};color:${color}">${text}</span>`;
      }

      const userCell = `
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
            <div>
              <div class="cell-primary serif">${Display.fullName(u)}</div>
              <div class="cell-secondary">${u.email}</div>
            </div>
          </div>
        </td>`;
      const roleCell = `<td><span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>`;
      const statusCell = `<td><span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>`;
      const lastLoginCell = `<td class="text-secondary">${u.lastLogin ? Display.date(u.lastLogin) : '<span class="text-muted">Never</span>'}</td>`;

      let middleCells = '';
      if (columnMode === 'investor') {
        // Title · Company (entity name) — no branch / licenses
        middleCells = `
          <td class="text-secondary">${u.title || '—'}</td>
          ${!hideOrgCol ? `<td class="text-secondary">${entity ? entity.name : '—'}</td>` : ''}`;
      } else if (columnMode === 'homium') {
        // Title only — no branch, no licenses, no company
        middleCells = `<td class="text-secondary">${u.title || '—'}</td>`;
      } else {
        // Default LOC layout: branch assignments + company + licenses
        middleCells = `
          <td>${branchChips}</td>
          ${!hideOrgCol ? `<td class="text-secondary">${co ? co.name : '—'}</td>` : ''}
          <td>${licChip || '<span class="text-muted" style="font-size:11px">—</span>'}</td>`;
      }

      return `
        <tr class="clickable" onclick="ProfileView.open('${u.id}')">
          ${userCell}
          ${roleCell}
          ${middleCells}
          ${statusCell}
          ${lastLoginCell}
        </tr>`;
    }).join('');

    const s = this._sort;
    const thClass = (col) => `sortable${s.col === col ? ' sort-' + s.dir : ''}`;

    // When scoped (embedded in a section), skip page-header wrapper
    const header = scope ? '' : `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Users</div>
            <div class="page-subtitle">${users.length} user${users.length !== 1 ? 's' : ''} shown</div>
          </div>
          <div class="page-header-actions">
            ${canInvite ? `<button class="btn btn-primary btn-sm" onclick="${inviteOnclick}">${inviteLabel}</button>` : ''}
          </div>
        </div>
      </div>`;

    const bodyOpen = scope ? '' : `<div class="page-body">${this._renderOnboardingBanner()}`;

    /* ---- Inline filter pills (Role / Status / + Company or Investor Entity) ---- */
    const roleOptions = (columnMode === 'investor')
      ? [{ value: 'investor', label: 'Investor' }, { value: 'investor_prospect', label: 'Investor Prospect' }]
      : (columnMode === 'homium')
      ? [{ value: 'sys_admin', label: 'System Admin' }, { value: 'operator', label: 'Platform Operator' }]
      : [{ value: 'prog_admin', label: 'Program Admin' }, { value: 'lo', label: 'Loan Officer' }, { value: 'lp', label: 'Loan Processor' }];

    const statusOptions = ['active', 'invited', 'email_verified', '2fa_complete', 'verification_pending', 'verification_failed', 'suspended']
      .map(v => ({ value: v, label: Display.onboardingStatusLabel(v) }));

    const rolePill = this._renderFilterPill('role', 'Role', f.role,
      roleOptions.map(o => ({ value: o.value, label: o.label })));
    const statusPill = this._renderFilterPill('status', 'Status', f.status, statusOptions);

    let orgPill = '';
    if (!hideOrgCol) {
      if (columnMode === 'investor') {
        orgPill = this._renderFilterPill('investorEntityId', 'Entity', f.investorEntityId,
          investorEntities.map(e => ({ value: e.id, label: e.name })));
      } else if (columnMode === 'default') {
        orgPill = this._renderFilterPill('companyId', 'Company', f.companyId,
          companies.map(c => ({ value: c.id, label: c.name })));
      }
    }

    const anyActive = !!(f.search || f.role || f.status || f.companyId || f.investorEntityId || f.branchId);

    return `
      ${header}
      ${bodyOpen}
        <div class="table-container">
          <div class="filter-toolbar filter-toolbar-pills">
            <input class="filter-search" placeholder="Search by name or email…"
              value="${f.search}" oninput="UsersView.setFilter('search', this.value)" />
            ${orgPill}
            ${rolePill}
            ${statusPill}
            ${anyActive ? `<button class="filter-clear-btn" onclick="UsersView.clearFilters()">Clear</button>` : ''}
            ${scope && canInvite && (scope.scope !== 'admin-hub' || scope.homiumOnly || scope.investorEntityId) ? `<button class="btn btn-primary btn-sm" onclick="${inviteOnclick}" style="margin-left:auto">${inviteLabel}</button>` : ''}
          </div>

          ${users.length ? `
            <table class="entity-table">
              <thead><tr>
                <th class="${thClass('name')}" onclick="UsersView.setSort('name')" style="min-width:360px">User</th>
                <th class="${thClass('role')}" onclick="UsersView.setSort('role')">Role</th>
                ${columnMode === 'investor' ? `
                  <th>Title</th>
                  ${!hideOrgCol ? '<th style="min-width:240px">Company</th>' : ''}
                ` : columnMode === 'homium' ? `
                  <th>Title</th>
                ` : `
                  <th>Branch Assignments</th>
                  ${!hideOrgCol ? '<th style="min-width:240px">Company</th>' : ''}
                  <th>Licenses</th>
                `}
                <th class="${thClass('status')}" onclick="UsersView.setSort('status')">Status</th>
                <th class="${thClass('login')}" onclick="UsersView.setSort('login')">Last Login</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="table-footer">
              <span class="table-count">${users.length} user${users.length !== 1 ? 's' : ''}</span>
            </div>` : `
            <div class="table-empty">
              <div class="table-empty-icon"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="15" cy="12" r="6"/><path d="M2 35c0-7.18 5.82-13 13-13s13 5.82 13 13"/><circle cx="30" cy="12" r="5"/><path d="M38 34c0-5.52-3.58-10.23-8.5-11.85"/></svg></div>
              <p>No users match your filters.</p>
              ${Object.values(f).some(v=>v) ? `<button class="btn btn-secondary btn-sm" onclick="UsersView.clearFilters()">Clear filters</button>` : ''}
            </div>`}
        </div>
      ${scope ? '' : '</div>'}

      <div id="modal-container"></div>
      <div id="panel-container"></div>`;
  },

  _rerender() {
    if (this._scope) {
      App.renderView(Router.getCurrentPath());
    } else {
      App.renderView('/users');
    }
  },

  setFilter(key, value) {
    this._filter[key] = value;
    this._rerender();
  },

  clearFilters() {
    this._filter = { search: '', role: '', status: '', branchId: '', companyId: '', investorEntityId: '' };
    this._rerender();
  },

  /* Inline filter pill: pill button + dropdown of options. The pill's label
     shows the active value or falls back to the generic name. */
  _renderFilterPill(key, label, active, options) {
    const activeOption = options.find(o => o.value === active);
    const display = activeOption ? `${label}: ${activeOption.label}` : label;
    const items = options.map(o =>
      `<div class="filter-pill-item${o.value === active ? ' active' : ''}"
            onclick="UsersView.setFilter('${key}','${o.value === active ? '' : o.value}')">${o.label}</div>`
    ).join('');
    return `
      <div class="filter-pill-wrap">
        <button class="filter-pill${active ? ' is-active' : ''}"
                onclick="UsersView.togglePill(event, 'pill-${key}')">
          <span>${display}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="filter-pill-menu" id="pill-${key}" style="display:none">
          <div class="filter-pill-list">${items}</div>
          ${active ? `<div class="filter-pill-clear" onclick="UsersView.setFilter('${key}','')">Clear ${label.toLowerCase()}</div>` : ''}
        </div>
      </div>`;
  },

  togglePill(e, id) {
    e.stopPropagation();
    // Close any other open pills first
    document.querySelectorAll('.filter-pill-menu').forEach(el => {
      if (el.id !== id) el.style.display = 'none';
    });
    const el = document.getElementById(id);
    if (!el) return;
    const open = el.style.display !== 'none';
    if (!open) {
      el.style.display = 'block';
      setTimeout(() => document.addEventListener('click', () => { el.style.display = 'none'; }, { once: true }), 0);
    } else {
      el.style.display = 'none';
    }
  },

  advanceStatus(userId) {
    State.advanceOnboarding(userId);
    this._rerender();
  },

  /* ---- Platform Invite Modal ----
     Company / branch invites use the bulk-invite page (BulkInviteView).
     This modal is only for platform-scope invites (sys_admin / operator /
     investor) where role enum differs and there are no branches/NMLS. */
  _invite: null,

  openPlatformInviteModal() {
    this._invite = {
      firstName: '', lastName: '', email: '', title: '', phone: '',
      platformRole: '',
    };
    document.getElementById('modal-container').innerHTML = this._renderPlatformInviteModal(this._invite);
  },

  _renderPlatformInviteModal(w) {
    const platformRoles = [
      { value: 'sys_admin', label: 'System Admin' },
      { value: 'operator',  label: 'Platform Operator' },
      { value: 'investor',  label: 'Investor' },
    ];
    return `
      <div class="modal-overlay" onclick="if(event.target===this)UsersView.closeModal()">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">Invite User</div>
              <div class="modal-subtitle">Platform Operations</div>
            </div>
            <button class="modal-close" onclick="UsersView.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group"><label>First Name *</label><input class="input" value="${w.firstName}" oninput="UsersView._setInviteField('firstName', this.value)"></div>
              <div class="form-group"><label>Last Name *</label><input class="input" value="${w.lastName}" oninput="UsersView._setInviteField('lastName', this.value)"></div>
              <div class="form-group form-full"><label>Email *</label><input class="input" type="email" value="${w.email}" oninput="UsersView._setInviteField('email', this.value)"></div>
              <div class="form-group"><label>Title</label><input class="input" value="${w.title}" oninput="UsersView._setInviteField('title', this.value)"></div>
              <div class="form-group"><label>Phone</label><input class="input" value="${w.phone}" oninput="UsersView._setInviteField('phone', this.value)"></div>
              <div class="form-group form-full"><label>Role *</label><select class="select-input" onchange="UsersView._setInviteField('platformRole', this.value)">
                <option value="">Select role…</option>
                ${platformRoles.map(r => `<option value="${r.value}" ${w.platformRole === r.value ? 'selected' : ''}>${r.label}</option>`).join('')}
              </select></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UsersView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="UsersView.submitInvite()">Send Invite</button>
          </div>
        </div>
      </div>`;
  },

  _setInviteField(key, value) {
    if (!this._invite) return;
    this._invite[key] = value;
  },

  /* NMLS license preview — also used by the OC wizard's inline invite step */
  _nmlsLicensePreview(nmlsId) {
    const id = (nmlsId || '').trim();
    if (!id || id.length < 5) return null;
    const match = State.getUsers().find(u => u.agentNmlsId === id);
    if (match && Array.isArray(match.licenses) && match.licenses.length) {
      const codes = match.licenses.filter(l => l.active).map(l => State.getMarket(l.marketId)?.code).filter(Boolean);
      return `<span style="color:var(--h-success)">✓ NMLS preview: ${match.licenses.length} license${match.licenses.length === 1 ? '' : 's'} on file (${codes.join(', ')}). Daily sync will keep these current.</span>`;
    }
    return `<span style="color:var(--h-text-muted)">NMLS ID ${id} — no preview seeded. Licenses will populate after the daily sync.</span>`;
  },

  submitInvite() {
    const w = this._invite;
    if (!w) return;
    if (!w.firstName || !w.lastName || !w.email) {
      alert('Please fill in all required fields (first name, last name, email).');
      return;
    }
    if (!w.platformRole) { alert('Please select a role.'); return; }
    State.inviteUser({
      firstName: w.firstName, lastName: w.lastName, email: w.email,
      role: w.platformRole, companyId: null, branchId: null,
      title: w.title, phone: w.phone || null,
    });
    this.closeModal();
    this._invite = null;
    this.showSuccess(`Invite sent to ${w.email}`);
    App.renderView(Router.getCurrentPath());
  },

  closeModal() {
    const mc = document.getElementById('modal-container');
    if (mc) mc.innerHTML = '';
  },

  showSuccess(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#16A34A;color:#fff;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideUp 0.2s ease';
    toast.textContent = '✓ ' + message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },
};

/* Color per section for avatars — Platform Ops = gold, Origination = blue, Investors = green */
function avatarColor(role) {
  return { sys_admin:'#C6952B', operator:'#C6952B', prog_admin:'#1D4ED8', lo:'#1D4ED8', lp:'#1D4ED8', investor:'#1D3D2A' }[role] || '#1B3564';
}
