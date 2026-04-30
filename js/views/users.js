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
      const assignments = State.getBranchAssignments(u.id);
      // Branch assignment chips with User Type + BM flag (spec §3.2/§3.3)
      const branchChips = assignments.map(a => {
        const branchObj = State.getBranch(a.branchId);
        const branchLabel = branchObj?.name?.replace(/^Branch ([A-Z]) — /, '$1 — ') || a.branchId;
        const ut = a.userType === 'lo' ? 'LO' : 'Std';
        const utColor = a.userType === 'lo' ? '#1f6f43' : 'var(--color-text-muted)';
        const utBg = a.userType === 'lo' ? '#e6f4ec' : 'var(--color-surface)';
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
        const color = expiring > 0 ? 'var(--color-warning)' : 'var(--color-success)';
        const text = expiring > 0 ? `${licenses.length} states · ${expiring} alert${expiring === 1 ? '' : 's'}` : `${licenses.length} states · valid`;
        licChip = `<span class="tag" style="font-size:10px;background:${expiring > 0 ? '#fff7e6' : '#e6f4ec'};color:${color}">${text}</span>`;
      }
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
          <td>${branchChips}</td>
          ${!hideOrgCol ? `<td class="text-secondary">${co ? co.name : '—'}</td>` : ''}
          <td>${licChip || '<span class="text-muted" style="font-size:11px">—</span>'}</td>
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
                <th>Branch Assignments</th>
                ${!hideOrgCol ? '<th>Company</th>' : ''}
                <th>Licenses</th>
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

  /* ---- Invite Modal (RBAC v1.2) ----
     Captures: identity + role, then per-branch User Type + Branch Manager
     flag + LO Assignment tuple (scope × level × subflags). Multi-branch
     supported; spec-mandated invariants enforced live. */
  _invite: null,

  openInviteModal() {
    const role        = State.getRole();
    const currentUser = State.getCurrentUser();
    const scopedCompanyId = this._scope?.companyId || (role === 'prog_admin' ? currentUser?.companyId : null) || this._presetCompany || null;
    this._presetCompany = null;
    this._invite = {
      firstName: '', lastName: '', email: '', title: '', phone: '', agentNmlsId: '',
      role: scopedCompanyId ? 'lo' : '',
      companyId: scopedCompanyId || '',
      assignments: [],
    };
    this._renderInviteModal();
  },

  _renderInviteModal() {
    const w = this._invite;
    const companies = State.getCompanies();
    const isPlatformScope = this._scope?.platformOnly;
    const branches = w.companyId ? State.getBranches().filter(b => b.companyId === w.companyId) : [];
    const companyName = w.companyId ? (State.getCompany(w.companyId)?.name || '') : '';

    const allRoles = [
      { value: 'prog_admin', label: 'Program Admin (OC-Admin)' },
      { value: 'lo',         label: 'Branch User — Loan Officer (default)' },
      { value: 'lp',         label: 'Branch User — Standard User' },
    ];
    const platformRoles = [
      { value: 'sys_admin', label: 'System Admin' },
      { value: 'operator',  label: 'Platform Operator' },
      { value: 'investor',  label: 'Investor' },
    ];
    const roleOptions = (isPlatformScope ? platformRoles : allRoles)
      .map(r => `<option value="${r.value}" ${w.role === r.value ? 'selected' : ''}>${r.label}</option>`).join('');

    const showBranchSection = !isPlatformScope && w.role !== 'investor' && w.role !== 'sys_admin' && w.role !== 'operator';
    const isProgAdmin = w.role === 'prog_admin';

    const branchSection = !showBranchSection ? '' : `
      <div style="margin-top:18px;border-top:1px solid var(--color-border);padding-top:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div>
            <div style="font-size:13px;font-weight:600">Branch Assignments ${isProgAdmin ? '<span style="color:var(--color-text-muted);font-weight:400">(optional for Program Admin)</span>' : '*'}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">Per-branch User Type, flags, and permission tuples (spec §3.2–§3.6)</div>
          </div>
          ${branches.length ? `<button class="btn btn-ghost btn-xs" onclick="UsersView._addInviteAssignment()">+ Add Branch Assignment</button>` : ''}
        </div>
        ${w.assignments.length === 0 ? `<div style="font-size:12px;color:var(--color-text-muted);padding:14px;text-align:center;border:1px dashed var(--color-border);border-radius:6px">${branches.length ? 'No assignments yet — click "+ Add Branch Assignment".' : (w.companyId ? 'This company has no branches yet.' : 'Pick a company first.')}</div>` : ''}
        ${w.assignments.map((a, i) => this._renderInviteAssignment(a, i, branches, w)).join('')}
      </div>`;

    document.getElementById('modal-container').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)UsersView.closeModal()">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <div class="modal-title">Invite User</div>
              <div class="modal-subtitle">${w.companyId ? companyName : isPlatformScope ? 'Platform Operations' : 'Identity, role, and per-branch access matrix'}</div>
            </div>
            <button class="modal-close" onclick="UsersView.closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group"><label>First Name *</label><input class="input" value="${w.firstName}" oninput="UsersView._setInviteField('firstName', this.value)"></div>
              <div class="form-group"><label>Last Name *</label><input class="input" value="${w.lastName}" oninput="UsersView._setInviteField('lastName', this.value)"></div>
              <div class="form-group form-full"><label>Email *</label><input class="input" type="email" value="${w.email}" oninput="UsersView._setInviteField('email', this.value)"><div class="form-hint">Must match the company's registered email domain.</div></div>
              <div class="form-group"><label>Title</label><input class="input" value="${w.title}" oninput="UsersView._setInviteField('title', this.value)"></div>
              <div class="form-group"><label>Phone</label><input class="input" value="${w.phone}" oninput="UsersView._setInviteField('phone', this.value)"></div>
              <div class="form-group"><label>Role *</label><select class="select-input" onchange="UsersView._setInviteRole(this.value)"><option value="">Select role…</option>${roleOptions}</select></div>
              ${!w.companyId && !isPlatformScope ? `
              <div class="form-group"><label>Origination Company *</label><select class="select-input" onchange="UsersView._setInviteCompany(this.value)"><option value="">Select company…</option>${companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>` : ''}
              <div class="form-group"><label>Agent NMLS ID</label><input class="input" value="${w.agentNmlsId}" oninput="UsersView._setInviteField('agentNmlsId', this.value)" placeholder="LOs only"><div class="form-hint">Used to resolve NMLS license records.</div></div>
            </div>
            ${branchSection}
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UsersView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="UsersView.submitInvite()">Send Invite</button>
          </div>
        </div>
      </div>`;
  },

  _renderInviteAssignment(a, idx, branches, w) {
    // Templates for spec scenarios 1, 2, 4, 7, 9
    const templates = [
      { key: 'sc1',  label: 'Standard Personal LO (Sc 1)' },
      { key: 'sc2',  label: 'Full Branch LO (Sc 2)' },
      { key: 'sc4',  label: 'View-Only Branch Manager (Sc 4)' },
      { key: 'sc7',  label: 'Full Branch Standard User (Sc 7)' },
      { key: 'sc9',  label: 'Single-LO Standard User (Sc 9)' },
    ];

    const branchSelect = `<select class="select-input" onchange="UsersView._setAssignmentField(${idx}, 'branchId', this.value)">
      <option value="">Select branch…</option>
      ${branches.map(b => `<option value="${b.id}" ${a.branchId === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
    </select>`;

    const userTypeSelect = `<select class="select-input" onchange="UsersView._setAssignmentField(${idx}, 'userType', this.value)">
      <option value="standard" ${a.userType === 'standard' ? 'selected' : ''}>Standard User</option>
      <option value="lo" ${a.userType === 'lo' ? 'selected' : ''}>Loan Officer</option>
    </select>`;

    const tuplesHtml = (a.loAssignments || []).map((t, ti) => this._renderInviteTuple(idx, ti, t, a)).join('');

    return `
      <div style="border:1px solid var(--color-border);border-radius:8px;padding:14px;margin-bottom:10px;background:var(--color-card)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:12px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em">Branch Assignment ${idx + 1}</div>
          <button class="btn btn-ghost btn-xs" onclick="UsersView._removeInviteAssignment(${idx})">Remove</button>
        </div>
        <div class="form-grid" style="gap:10px">
          <div class="form-group"><label>Branch *</label>${branchSelect}</div>
          <div class="form-group"><label>Branch User Type *</label>${userTypeSelect}</div>
          <div class="form-group" style="align-self:end">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;cursor:pointer">
              <input type="checkbox" ${a.flags?.branchManager ? 'checked' : ''} onchange="UsersView._setAssignmentFlag(${idx}, 'branchManager', this.checked)">
              Branch Manager flag
            </label>
            <div class="form-hint">BM has minimum View on all branch loans (spec §3.3).</div>
          </div>
          ${a.userType === 'lo' ? `
          <div class="form-group"><label>Allow new originations</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ${a.allowNewOriginations !== false ? 'checked' : ''} onchange="UsersView._setAssignmentField(${idx}, 'allowNewOriginations', this.checked)"> Enabled</label>
          </div>` : ''}
        </div>

        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--color-border-light)">
          <div style="font-size:11px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Quick templates</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
            ${templates.map(t => `<button class="btn btn-ghost btn-xs" onclick="UsersView._applyTemplate(${idx}, '${t.key}')">${t.label}</button>`).join('')}
          </div>

          <div style="font-size:11px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Permission tuples</div>
          ${tuplesHtml || '<div style="font-size:12px;color:var(--color-text-muted);padding:8px 0">No tuples — click a template above or "+ Add tuple".</div>'}
          <button class="btn btn-ghost btn-xs" onclick="UsersView._addTuple(${idx})" style="margin-top:6px">+ Add tuple</button>
        </div>
      </div>`;
  },

  _renderInviteTuple(aIdx, tIdx, t, a) {
    const isLOPersonalLock = a.userType === 'lo' && t.scope === 'personal';
    const isBMAllLosFloor  = a.flags?.branchManager && t.scope === 'all_los';

    const levels = [
      { value: 'no_access', label: 'No Access' },
      { value: 'view',      label: 'View Only' },
      { value: 'edit',      label: 'Can Edit' },
      { value: 'full',      label: 'Full Access' },
    ];
    const allowedLevels = isLOPersonalLock ? ['full'] : isBMAllLosFloor ? ['view', 'edit', 'full'] : ['no_access', 'view', 'edit', 'full'];
    const branchLOs = State.getUsersByBranch(a.branchId).filter(u => {
      const ax = State.getBranchAssignments(u.id).find(x => x.branchId === a.branchId);
      return ax?.userType === 'lo';
    });

    const subflagsRow = t.level === 'edit' ? `
      <div style="display:flex;gap:14px;margin-top:6px;font-size:11px">
        <label><input type="checkbox" ${t.subflags?.canCreate ? 'checked' : ''} onchange="UsersView._setSubflag(${aIdx}, ${tIdx}, 'canCreate', this.checked)"> Can Create</label>
        <label><input type="checkbox" ${t.subflags?.canSubmit ? 'checked' : ''} onchange="UsersView._setSubflag(${aIdx}, ${tIdx}, 'canSubmit', this.checked)"> Can Submit</label>
        <label><input type="checkbox" ${t.subflags?.canWithdraw ? 'checked' : ''} onchange="UsersView._setSubflag(${aIdx}, ${tIdx}, 'canWithdraw', this.checked)"> Can Withdraw</label>
      </div>` : '';

    const loPicker = t.scope === 'specific_los' && branchLOs.length ? `
      <div style="margin-top:6px;font-size:11px">
        <span style="color:var(--color-text-muted);margin-right:6px">LOs:</span>
        ${branchLOs.map(lo => `<label style="display:inline-flex;align-items:center;gap:4px;margin-right:8px"><input type="checkbox" ${(t.loIds || []).includes(lo.id) ? 'checked' : ''} onchange="UsersView._toggleTupleLO(${aIdx}, ${tIdx}, '${lo.id}', this.checked)"> ${Display.fullName(lo)}</label>`).join('')}
      </div>` : '';

    return `
      <div style="display:grid;grid-template-columns:auto auto 1fr auto;gap:8px;align-items:center;padding:8px;border:1px solid var(--color-border);border-radius:6px;margin-bottom:6px;background:var(--color-surface)">
        <select class="select-input" style="font-size:12px" onchange="UsersView._setTupleField(${aIdx}, ${tIdx}, 'scope', this.value)">
          <option value="personal" ${t.scope === 'personal' ? 'selected' : ''}>Personal Only</option>
          <option value="specific_los" ${t.scope === 'specific_los' ? 'selected' : ''}>Specific LO(s)</option>
          <option value="all_los" ${t.scope === 'all_los' ? 'selected' : ''}>All LOs in Branch</option>
        </select>
        <select class="select-input" style="font-size:12px" onchange="UsersView._setTupleField(${aIdx}, ${tIdx}, 'level', this.value)" ${isLOPersonalLock ? 'disabled title="LO has Full on own loans (invariant §3.6)"' : ''}>
          ${levels.filter(l => allowedLevels.includes(l.value)).map(l => `<option value="${l.value}" ${t.level === l.value ? 'selected' : ''}>${l.label}</option>`).join('')}
        </select>
        <div>
          ${loPicker}
          ${subflagsRow}
        </div>
        <button class="btn btn-ghost btn-xs" onclick="UsersView._removeTuple(${aIdx}, ${tIdx})">×</button>
      </div>
      ${isLOPersonalLock ? '<div style="font-size:10px;color:var(--color-text-muted);margin:-4px 0 6px 0">↑ LO Full-on-own invariant — locked</div>' : ''}
      ${isBMAllLosFloor && t.level === 'no_access' ? '<div style="font-size:10px;color:var(--color-warning);margin:-4px 0 6px 0">↑ BM minimum View invariant — adjusted</div>' : ''}`;
  },

  _setInviteField(key, value) {
    if (this._invite) this._invite[key] = value;
  },

  _setInviteRole(role) {
    this._invite.role = role;
    // For LO/Standard branch users, ensure at least one assignment slot
    if (this._invite.companyId && (role === 'lo' || role === 'lp') && this._invite.assignments.length === 0) {
      this._addInviteAssignment();
      // Default the first assignment User Type from the role
      const a = this._invite.assignments[0];
      a.userType = role === 'lo' ? 'lo' : 'standard';
    }
    this._renderInviteModal();
  },

  _setInviteCompany(companyId) {
    this._invite.companyId = companyId;
    this._invite.assignments = [];
    this._renderInviteModal();
  },

  _addInviteAssignment() {
    this._invite.assignments.push({
      branchId: '', userType: this._invite.role === 'lo' ? 'lo' : 'standard',
      flags: { branchManager: false },
      loAssignments: [],
      allowNewOriginations: this._invite.role === 'lo',
      allowAccessToAllBranchActivity: false,
      eligibleLoanProductIds: [],
    });
    this._renderInviteModal();
  },

  _removeInviteAssignment(idx) {
    this._invite.assignments.splice(idx, 1);
    this._renderInviteModal();
  },

  _setAssignmentField(idx, key, value) {
    this._invite.assignments[idx][key] = value;
    this._renderInviteModal();
  },

  _setAssignmentFlag(idx, flag, on) {
    this._invite.assignments[idx].flags = { ...(this._invite.assignments[idx].flags || {}), [flag]: !!on };
    // Apply BM floor invariant: bump no_access tuples on all_los to view
    if (flag === 'branchManager' && on) {
      (this._invite.assignments[idx].loAssignments || []).forEach(t => {
        if (t.scope === 'all_los' && t.level === 'no_access') t.level = 'view';
      });
    }
    this._renderInviteModal();
  },

  _addTuple(aIdx) {
    const a = this._invite.assignments[aIdx];
    a.loAssignments.push({ scope: 'all_los', loIds: [], level: 'view', subflags: {} });
    this._renderInviteModal();
  },

  _removeTuple(aIdx, tIdx) {
    this._invite.assignments[aIdx].loAssignments.splice(tIdx, 1);
    this._renderInviteModal();
  },

  _setTupleField(aIdx, tIdx, key, value) {
    const t = this._invite.assignments[aIdx].loAssignments[tIdx];
    t[key] = value;
    // Apply LO Full-on-own invariant
    const a = this._invite.assignments[aIdx];
    if (a.userType === 'lo' && t.scope === 'personal') {
      t.level = 'full';
      t.subflags = { canCreate: true, canSubmit: true, canWithdraw: true };
    }
    // Apply BM floor invariant
    if (a.flags?.branchManager && t.scope === 'all_los' && t.level === 'no_access') t.level = 'view';
    this._renderInviteModal();
  },

  _setSubflag(aIdx, tIdx, sub, on) {
    const t = this._invite.assignments[aIdx].loAssignments[tIdx];
    t.subflags = { ...(t.subflags || {}), [sub]: !!on };
  },

  _toggleTupleLO(aIdx, tIdx, loId, on) {
    const t = this._invite.assignments[aIdx].loAssignments[tIdx];
    t.loIds = t.loIds || [];
    if (on && !t.loIds.includes(loId)) t.loIds.push(loId);
    if (!on) t.loIds = t.loIds.filter(x => x !== loId);
  },

  _applyTemplate(aIdx, tplKey) {
    const a = this._invite.assignments[aIdx];
    const fullSubflags = { canCreate: true, canSubmit: true, canWithdraw: true };
    if (tplKey === 'sc1')      { a.userType = 'lo';       a.flags = { branchManager: false }; a.allowNewOriginations = true;
      a.loAssignments = [{ scope: 'personal', loIds: [], level: 'full', subflags: fullSubflags }]; }
    else if (tplKey === 'sc2') { a.userType = 'lo';       a.flags = { branchManager: false }; a.allowNewOriginations = true;
      a.loAssignments = [{ scope: 'all_los',  loIds: [], level: 'full', subflags: fullSubflags }]; }
    else if (tplKey === 'sc4') { a.userType = 'standard'; a.flags = { branchManager: true };  a.allowNewOriginations = false;
      a.loAssignments = [{ scope: 'all_los',  loIds: [], level: 'view', subflags: {} }]; }
    else if (tplKey === 'sc7') { a.userType = 'standard'; a.flags = { branchManager: false }; a.allowNewOriginations = false;
      a.loAssignments = [{ scope: 'all_los',  loIds: [], level: 'full', subflags: fullSubflags }]; }
    else if (tplKey === 'sc9') { a.userType = 'standard'; a.flags = { branchManager: false }; a.allowNewOriginations = false;
      a.loAssignments = [{ scope: 'specific_los', loIds: [], level: 'full', subflags: fullSubflags }]; }
    this._renderInviteModal();
  },

  submitInvite() {
    const w = this._invite;
    if (!w) return;
    if (!w.firstName || !w.lastName || !w.email || !w.role) {
      alert('Please fill in all required fields (name, email, role).');
      return;
    }
    if (!w.companyId && !this._scope?.platformOnly) {
      alert('Please select a company.');
      return;
    }
    if (w.role !== 'sys_admin' && w.role !== 'operator' && w.role !== 'investor' && w.role !== 'prog_admin' && w.assignments.length === 0) {
      alert('Branch users must have at least one branch assignment.');
      return;
    }
    if (w.assignments.some(a => !a.branchId)) {
      alert('All branch assignments need a branch.');
      return;
    }

    State.inviteUser({
      firstName: w.firstName,
      lastName:  w.lastName,
      email:     w.email,
      role:      w.role,
      companyId: w.companyId || null,
      branchId:  w.assignments[0]?.branchId || null,
      title:     w.title,
      phone:     w.phone || null,
      nmlsId:    w.agentNmlsId || null,
      agentNmlsId: w.agentNmlsId || null,
      branchAssignments: w.assignments,
      licenses: [],
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
