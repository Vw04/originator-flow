/* ============================================================
   HOMIUM ORIGINATOR FLOW — Users View
   ============================================================ */

const UsersView = {
  _filter: { search: '', role: '', status: '', branchId: '', companyId: '' },
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
          ${pending > 0 ? `<span style="font-size:12px;color:var(--color-warning);font-weight:600">${pending} pending</span>` : ''}
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

    // Base user set — apply scope if provided
    let users;
    if (scope?.platformOnly) {
      users = State.getPlatformUsers();
    } else if (scope?.companyId) {
      users = State.getUsersByCompany(scope.companyId);
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
    if (f.role)      users = users.filter(u => u.role === f.role);
    if (f.status)    users = users.filter(u => u.onboardingStatus === f.status);
    if (f.branchId)  users = users.filter(u => u.branchId === f.branchId);
    if (f.companyId) users = users.filter(u => u.companyId === f.companyId);

    // Branch options for filter
    let branches = State.getBranches();
    if (role === 'prog_admin' && currentUser?.companyId) {
      branches = branches.filter(b => b.companyId === currentUser.companyId);
    }
    const companies = State.getCompanies();

    users = this._sortUsers(users);
    const hideOrgCol = role === 'prog_admin' || scope?.companyId;

    const rows = users.map(u => {
      const co = State.getCompany(u.companyId);
      const br = State.getBranch(u.branchId);
      return `
        <tr class="clickable" onclick="ProfileView.open('${u.id}')">
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
          <td>${u.policies.length ? u.policies.map(pid => { const pol = State.getPolicies().find(p => p.id === pid); return pol ? `<span class="policy-tag">${pol.name}</span>` : ''; }).join(' ') : '<span class="text-muted">—</span>'}</td>
          ${!hideOrgCol ? `<td class="text-secondary">${co ? co.name : '—'}</td>` : ''}
          <td class="text-secondary">${br ? br.name : '—'}</td>
          <td><span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
          <td class="text-secondary">${u.lastLogin ? Display.date(u.lastLogin) : '<span class="text-muted">Never</span>'}</td>
        </tr>`;
    }).join('');

    const s = this._sort;
    const thClass = (col) => `sortable${s.col === col ? ' sort-' + s.dir : ''}`;

    const branchOptions = branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    const companyOptions = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    // When scoped (embedded in a section), skip page-header wrapper
    const header = scope ? '' : `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Users</div>
            <div class="page-subtitle">${users.length} user${users.length !== 1 ? 's' : ''} shown</div>
          </div>
          <div class="page-header-actions">
            ${canInvite ? `<button class="btn btn-primary btn-sm" onclick="UsersView.openInviteModal()">+ Invite User</button>` : ''}
          </div>
        </div>
      </div>`;

    const bodyOpen = scope ? '' : `<div class="page-body">${this._renderOnboardingBanner()}`;

    return `
      ${header}
      ${bodyOpen}
        <div class="table-container">
          <div class="filter-toolbar">
            <input class="filter-search" placeholder="Search by name or email…"
              value="${f.search}" oninput="UsersView.setFilter('search', this.value)" />
            <div style="position:relative">
              <button class="filter-menu-btn" onclick="UsersView.toggleFiltersMenu(event)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                Filters
              </button>
              <div class="filter-menu-panel" id="users-filters-menu" style="display:none">
                <div class="filter-menu-section">
                  <div class="filter-menu-label">Role</div>
                  ${['prog_admin','lo','lp','investor'].map(r=>`<div class="filter-menu-item${f.role===r?' active':''}" onclick="UsersView.setFilter('role','${r}')">${Display.roleName(r)}</div>`).join('')}
                </div>
                <div class="filter-menu-section">
                  <div class="filter-menu-label">Status</div>
                  ${['active','invited','email_verified','2fa_complete','verification_pending','verification_failed','suspended'].map(s=>`<div class="filter-menu-item${f.status===s?' active':''}" onclick="UsersView.setFilter('status','${s}')">${Display.onboardingStatusLabel(s)}</div>`).join('')}
                </div>
                ${!hideOrgCol ? `<div class="filter-menu-section">
                  <div class="filter-menu-label">Company</div>
                  ${companies.map(c=>`<div class="filter-menu-item${f.companyId===c.id?' active':''}" onclick="UsersView.setFilter('companyId','${c.id}')">${c.name}</div>`).join('')}
                </div>` : ''}
                ${Object.values(f).some(v=>v) ? `<div class="filter-menu-section" style="border-top:1px solid var(--color-border);padding-top:8px"><div class="filter-menu-item" onclick="UsersView.clearFilters()" style="color:var(--color-danger)">Clear All Filters</div></div>` : ''}
              </div>
            </div>
            ${scope && canInvite ? `<button class="btn btn-primary btn-sm" onclick="UsersView.openInviteModal()" style="margin-left:auto">+ Invite User</button>` : ''}
          </div>

          ${users.length ? `
            <table>
              <thead><tr>
                <th class="${thClass('name')}" onclick="UsersView.setSort('name')">User</th>
                <th class="${thClass('role')}" onclick="UsersView.setSort('role')">Role</th>
                <th>Policy</th>
                ${!hideOrgCol ? '<th>Company</th>' : ''}
                <th>Branch</th>
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
    this._filter = { search: '', role: '', status: '', branchId: '', companyId: '' };
    this._rerender();
  },

  toggleFiltersMenu(e) {
    e.stopPropagation();
    const el = document.getElementById('users-filters-menu');
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

  openInviteModal() {
    const role      = State.getRole();
    const currentUser = State.getCurrentUser();
    const companies = State.getCompanies();
    const branches  = State.getBranches();

    // Determine scoped company: from section scope, prog_admin's own company, or preset
    const scopedCompanyId = this._scope?.companyId || (role === 'prog_admin' ? currentUser?.companyId : null) || this._presetCompany || null;
    this._presetCompany = null; // clear one-shot preset

    const isPlatformScope = this._scope?.platformOnly;
    const companyOptions = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const filteredBranches = scopedCompanyId
      ? branches.filter(b => b.companyId === scopedCompanyId)
      : branches;
    const branchOptions = filteredBranches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    // Role options based on scope
    const scopedRoles = this._scope?.roles;
    const allRoles = [
      { value: 'sys_admin',  label: 'System Admin' },
      { value: 'operator',   label: 'Platform Operator' },
      { value: 'prog_admin', label: 'Program Administrator' },
      { value: 'lo',         label: 'Loan Officer' },
      { value: 'lp',         label: 'Loan Processor' },
      { value: 'investor',   label: 'Investor' },
    ];
    const roleOptions = (scopedRoles ? allRoles.filter(r => scopedRoles.includes(r.value)) : allRoles)
      .map(r => `<option value="${r.value}">${r.label}</option>`).join('');

    const companyName = scopedCompanyId ? (State.getCompany(scopedCompanyId)?.name || '') : '';

    document.getElementById('modal-container').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)UsersView.closeModal()">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">Invite User</div>
              <div class="modal-subtitle">${scopedCompanyId ? companyName : isPlatformScope ? 'Platform Operations' : 'An email with a magic link will be sent to the user'}</div>
            </div>
            <button class="modal-close" onclick="UsersView.closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="system-note">
              <span class="system-note-icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="12" height="9" rx="1"/><path d="M1 3l6 5 6-5"/></svg></span>
              <span>After submitting, the system will send a welcome email with a magic link. The user will follow the link to complete email verification and set up their account.</span>
            </div>

            <div class="form-grid" style="margin-top:16px">
              <div class="form-group">
                <label>First Name *</label>
                <input class="input" id="invite-first" placeholder="Jane" />
              </div>
              <div class="form-group">
                <label>Last Name *</label>
                <input class="input" id="invite-last" placeholder="Smith" />
              </div>
              <div class="form-group form-full">
                <label>Email Address *</label>
                <input class="input" id="invite-email" placeholder="jane.smith@company.com" type="email" />
                ${!isPlatformScope ? `<div class="form-hint">Must match the company's registered email domain</div>` : ''}
              </div>
              <div class="form-group">
                <label>Role *</label>
                <select class="select-input" id="invite-role">
                  <option value="">Select role…</option>
                  ${roleOptions}
                </select>
              </div>
              <div class="form-group">
                <label>Title</label>
                <input class="input" id="invite-title" placeholder="e.g. Senior Loan Officer" />
              </div>
              ${!scopedCompanyId && !isPlatformScope ? `
              <div class="form-group">
                <label>Origination Company *</label>
                <select class="select-input" id="invite-company" onchange="UsersView.updateBranchOptions(this.value)">
                  <option value="">Select company…</option>${companyOptions}
                </select>
              </div>` : scopedCompanyId ? `<input type="hidden" id="invite-company" value="${scopedCompanyId}" />` : ''}
              ${!isPlatformScope ? `
              <div class="form-group">
                <label>Branch *</label>
                <select class="select-input" id="invite-branch">
                  <option value="">Select branch…</option>${branchOptions}
                </select>
              </div>` : ''}
              <div class="form-group">
                <label>NMLS ID</label>
                <input class="input" id="invite-nmls" placeholder="e.g. 1234567" />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input class="input" id="invite-phone" placeholder="615-555-0000" type="tel" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UsersView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="UsersView.submitInvite()">Send Invite</button>
          </div>
        </div>
      </div>`;
  },

  updateBranchOptions(companyId) {
    const select = document.getElementById('invite-branch');
    if (!select) return;
    const branches = State.getBranches().filter(b => b.companyId === companyId);
    select.innerHTML = '<option value="">Select branch…</option>' +
      branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  },

  submitInvite() {
    const firstName = document.getElementById('invite-first')?.value.trim();
    const lastName  = document.getElementById('invite-last')?.value.trim();
    const email     = document.getElementById('invite-email')?.value.trim();
    const role      = document.getElementById('invite-role')?.value;
    const companyId = document.getElementById('invite-company')?.value;
    const branchId  = document.getElementById('invite-branch')?.value;
    const title     = document.getElementById('invite-title')?.value.trim();
    const nmlsId    = document.getElementById('invite-nmls')?.value.trim();
    const phone     = document.getElementById('invite-phone')?.value.trim();

    if (!firstName || !lastName || !email || !role || !companyId || !branchId) {
      alert('Please fill in all required fields.');
      return;
    }

    State.inviteUser({ firstName, lastName, email, role, companyId, branchId, title, nmlsId: nmlsId || null, phone: phone || null });
    this.closeModal();
    this.showSuccess(`Invite sent to ${email}`);
    App.renderView('/users');
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
