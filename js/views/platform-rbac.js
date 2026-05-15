/* ============================================================
   HOMIUM ORIGINATOR FLOW — User Management
   sys_admin-only. Hosts the entire /user-management surface:
     /user-management           → all-users roster (platform-ops, origination, investor)
     /user-management/u/:id     → user detail (type-adaptive)
     /user-management/audit     → audit log
     /user-management/invite    → bulk invite (Stage 0 category → 1 emails → 2 per-row)
   Visual aesthetic mirrors the Institutional artboard
   (warm paper, serif accents, navy primary, mint highlights, gold).
   ============================================================ */

const PlatformRbacView = (() => {

  /* ---- Object tabs shown on the user-detail page ---- */
  const TABS = [
    { id: 'platformsettings', label: 'Platform' },
    { id: 'orgs',             label: 'Origination Companies' },
    { id: 'investors',        label: 'Investors' },
    { id: 'loanprograms',     label: 'Loan Programs' },
    { id: 'funds',            label: 'Funds' },
  ];

  /* ---- Tooltip help copy (still surfaced via title attrs) ---- */
  const HELP = {
    manageOrgCos:           'Read or modify origination-company records (entity profile, branches, status).',
    manageInvestors:        'Read or modify investor entities and fund linkages.',
    managePlatformSettings: 'Read or modify platform-wide settings (markets, fees, integrations).',
    settings:               'Read or modify entity-level configuration.',
    impersonate:            'Act on behalf of an entity admin for support. Every action is fully audited.',
    approve:                'Approve activation requests for the entity (legal / compliance gate).',
    originations:           'Visibility into and editing of loans originated under this program.',
    uwApprovals:            'Issue underwriting decisions on loans in this program.',
    ctc:                    'Issue final Clear-to-Close approval for funding.',
    activations:            'Approve or block fund activations (operational gate).',
    fundAdmin:              'Sign off as Fund Admin (compliance role) for legal events.',
    minting:                'Authorize on-chain token minting for fund deposits.',
    updates:                'Publish narrative / financial updates to fund stakeholders.',
    hOnchain:               'Push fund state to the on-chain settlement layer.',
  };

  /* ---- Data accessors — pull from global State ---- */
  function _allUsers()    { return State.getUsers().map(_adapt); }
  function _findUser(id)  { const u = State.getUser(id); return u ? _adapt(u) : null; }
  function _adapt(u) {
    return {
      id: u.id,
      name: Display.fullName(u),
      initials: Display.initials(u),
      email: u.email,
      bg: avatarColor(u.role),
      color: '#fff',
      raw: u,
    };
  }
  function _category(u) {
    if (u.role === 'investor' || u.role === 'investor_prospect') return 'investor';
    if (u.role === 'sys_admin' || u.role === 'operator') return 'platform';
    // Everything else (lo, lp, prog_admin) is a loan-origination role.
    return 'origination';
  }
  function _categoryLabel(c) {
    return c === 'platform' ? 'Platform Ops' : c === 'origination' ? 'Loan Origination' : 'Investor';
  }
  function _categoryClass(c) {
    return 'rb-cat rb-cat-' + (c === 'platform' ? 'platform' : c === 'origination' ? 'orig' : 'investor');
  }

  /* ---- Permission-matrix entity lists (platform-ops detail only) ---- */
  const ORGS = [
    { id: 'oc1', name: 'FirstHome Lending',      active: true  },
    { id: 'oc2', name: 'Pacific Mortgage Group', active: true  },
    { id: 'oc3', name: 'Cornerstone Financial',  active: false },
    { id: 'oc4', name: 'Heartland Home Loans',   active: true  },
  ];
  const INVESTORS = [
    { id: 'iv1', name: 'Sequoia Housing Trust',     active: true  },
    { id: 'iv2', name: 'Pacific Capital Fund',      active: true  },
    { id: 'iv3', name: 'Heritage Investment Group', active: false },
    { id: 'iv4', name: 'National Housing Partners', active: true  },
  ];
  const LOAN_PROGRAMS = [
    { id: 'lp1', name: 'Standard SAM 2024-A', platActive: true  },
    { id: 'lp2', name: 'Premium SAM 2024-B',  platActive: true  },
    { id: 'lp3', name: 'SAM Launch 2025-A',   platActive: false },
    { id: 'lp4', name: 'Utah Dream Fund SAM', platActive: true  },
  ];
  const FUNDS = [
    { id: 'f1', name: 'Homium Housing Fund I',  active: true  },
    { id: 'f2', name: 'Homium Housing Fund II', active: true  },
    { id: 'f3', name: 'Pacific SAM Pool',       active: true  },
    { id: 'f4', name: 'Utah SAM Trust',         active: false },
  ];

  /* ---- Permission state builder. Only platform-ops users get a full matrix;
         origination and investor users get an 'n/a' sentinel — the detail
         page renders type-specific cards for those rather than the matrix. ---- */
  function _adminTemplate() {
    return { type: 'admin',
      platform:     { manageOrgCos: 'full', manageInvestors: 'full', managePlatformSettings: 'full' },
      orgs:         { 'all': { settings: 'full', impersonate: true  }, 'oc1': null, 'oc2': null, 'oc3': null, 'oc4': null },
      investors:    { 'all': { settings: 'full', approve: true,  impersonate: true  }, 'iv1': null, 'iv2': null, 'iv3': null, 'iv4': null },
      loanPrograms: { 'all': { originations: 'full', uwApprovals: true,  ctc: true  }, 'lp1': null, 'lp2': null, 'lp3': null, 'lp4': null },
      funds:        { 'all': { activations: 'full', fundAdmin: true,  minting: true,  updates: 'full', hOnchain: true  }, 'f1': null, 'f2': null, 'f3': null, 'f4': null } };
  }
  function _memberTemplate() {
    return { type: 'member',
      platform:     { manageOrgCos: 'view', manageInvestors: 'view', managePlatformSettings: 'none' },
      orgs:         { 'all': { settings: 'view', impersonate: false }, 'oc1': null, 'oc2': null, 'oc3': null, 'oc4': null },
      investors:    { 'all': { settings: 'view', approve: false, impersonate: false }, 'iv1': null, 'iv2': null, 'iv3': null, 'iv4': null },
      loanPrograms: { 'all': { originations: 'view', uwApprovals: false, ctc: false }, 'lp1': null, 'lp2': null, 'lp3': null, 'lp4': null },
      funds:        { 'all': { activations: 'view', fundAdmin: false, minting: false, updates: 'view', hOnchain: false }, 'f1': null, 'f2': null, 'f3': null, 'f4': null } };
  }
  function _viewOnlyTemplate() {
    return { type: 'view-only',
      platform:     { manageOrgCos: 'view', manageInvestors: 'view', managePlatformSettings: 'none' },
      orgs:         { 'all': { settings: 'view', impersonate: false }, 'oc1': null, 'oc2': null, 'oc3': null, 'oc4': null },
      investors:    { 'all': { settings: 'view', approve: false, impersonate: false }, 'iv1': null, 'iv2': null, 'iv3': null, 'iv4': null },
      loanPrograms: { 'all': { originations: 'view', uwApprovals: false, ctc: false }, 'lp1': null, 'lp2': null, 'lp3': null, 'lp4': null },
      funds:        { 'all': { activations: 'view', fundAdmin: false, minting: false, updates: 'view', hOnchain: false }, 'f1': null, 'f2': null, 'f3': null, 'f4': null } };
  }
  function _makeDefaultPerms(user) {
    if (_category(user) !== 'platform') return { type: 'n/a' };
    return user.role === 'sys_admin' ? _adminTemplate() : _memberTemplate();
  }
  function _ensureState(userId) {
    if (_state[userId]) return _state[userId];
    const u = State.getUser(userId);
    if (!u) return null;
    const init = _makeDefaultPerms(u);
    _state[userId] = JSON.parse(JSON.stringify(init));
    _saved[userId] = JSON.parse(JSON.stringify(init));
    return _state[userId];
  }

  /* ---- Audit log demo data — cross-category. Server-derived in production. ---- */
  const AUDIT = [
    { day: 'Today',      time: '10:42 AM', type: 'perm', targetCategory: 'platform',    actor: 'Alex Morgan',     action: 'Updated permissions', target: 'Jordan Lee',         detail: 'Loan Programs — Premium SAM 2024-B: Origination Access → Can Edit; UW Approvals enabled' },
    { day: 'Today',      time: '10:38 AM', type: 'user', targetCategory: 'origination', actor: 'Patricia Owens',  action: 'Invited user',        target: 'Devon Pryce',         detail: 'dpryce@commonwealthmortgage.com · Loan Officer · Bluegrass Main Branch' },
    { day: 'Today',      time: '09:55 AM', type: 'sys',  targetCategory: 'origination', actor: 'System',          action: 'NMLS sync',           target: 'James Okafor',        detail: 'License DC-2024 renewed · Authorized through 2026-08-31' },
    { day: 'Today',      time: '09:15 AM', type: 'user', targetCategory: 'investor',    actor: 'Alex Morgan',     action: 'Suspended user',      target: 'Robert Huang',        detail: 'Manual hold pending re-verification of accreditation documents' },
    { day: 'Today',      time: '08:50 AM', type: 'sys',  targetCategory: 'investor',    actor: 'System',          action: 'Portal login',        target: 'Robert Huang',        detail: '203.0.113.42 · iPad · Safari · Investor portal' },
    { day: '2 days ago', time: '',         type: 'perm', targetCategory: 'platform',    actor: 'Alex Morgan',     action: 'Updated permissions', target: 'Jordan Lee',          detail: 'Funds — Homium Housing Fund I: Full Access; Fund Admin Approve and Minting enabled' },
    { day: '2 days ago', time: '',         type: 'user', targetCategory: 'origination', actor: 'Marcus Webb',     action: 'Updated branch assignment', target: 'Tamara Fletcher', detail: 'Branch Manager flag enabled for Bluegrass Main Branch' },
    { day: '2 days ago', time: '',         type: 'user', targetCategory: 'origination', actor: 'Patricia Owens',  action: 'Added user',          target: 'Renee Colbert',       detail: 'rcolbert@bluegrasshomefinance.com · Loan Officer' },
    { day: '3 days ago', time: '',         type: 'perm', targetCategory: 'platform',    actor: 'Alex Morgan',     action: 'Updated default',     target: 'Jordan Lee',          detail: 'Loan Programs — All: Origination Access → Can Edit; UW Approvals and CTC enabled' },
    { day: '3 days ago', time: '',         type: 'user', targetCategory: 'platform',    actor: 'Alex Morgan',     action: 'Changed user type',   target: 'Jordan Lee',          detail: 'Member → Admin' },
    { day: '3 days ago', time: '',         type: 'user', targetCategory: 'investor',    actor: 'Alex Morgan',     action: 'Invited user',        target: 'Sarah Chen',          detail: 'schen@prospectcapital.com · Investor Prospect' },
    { day: '4 days ago', time: '',         type: 'sys',  targetCategory: 'origination', actor: 'System',          action: 'Password reset',      target: 'Dana Holloway',       detail: 'Completed via forgot-password flow' },
  ];

  /* ---- Module-scope mutable state (persists across re-renders) ---- */
  let _state         = {};                                       // lazy-init per user via _ensureState
  let _saved         = {};
  let _activeObjTab  = 'platformsettings';
  let _searchFilter  = '';
  let _categoryFilter = 'all';                                   // 'all' | 'platform' | 'origination' | 'investor'
  let _roleFilter     = 'all';
  let _accessFilter   = 'all';                                   // 'all' | 'admin' | 'member' | 'view-only' | 'n/a'
  let _statusFilter   = 'all';
  let _companyFilter  = 'all';
  let _auditTypeFilter     = 'all';
  let _auditActorFilter    = 'all';
  let _auditCategoryFilter = 'all';
  let _modal         = null;
  let _toastTimer    = null;
  let _currentPath   = '/user-management';

  /* ---- Bulk-invite Stage 0/1/2 state ---- */
  let _inv = null;
  function _initInvite() {
    _inv = { stage: 0, category: null, companyId: null, rawEmails: '', parsed: null, rows: [], nextRowId: 0 };
  }
  function _companyDomain() {
    if (!_inv?.companyId) return null;
    const c = State.getCompany(_inv.companyId);
    return c?.emailDomain || null;
  }
  function _parseEmails(raw) {
    const category = _inv?.category;
    const domain   = _companyDomain();
    const tokens = raw.split(/[,;\s\n]+/).map(t => t.trim()).filter(Boolean);
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    const seen = new Set(State.getUsers().map(u => u.email.toLowerCase()));
    const valid = [], invalid = [], duplicates = [];
    tokens.forEach(t => {
      if (!re.test(t)) { invalid.push(t); return; }
      const lc = t.toLowerCase();
      if (category === 'platform' && !lc.endsWith('@homium.io') && !lc.endsWith('@homium.com')) { invalid.push(t); return; }
      if (category === 'origination' && domain && !lc.endsWith('@' + domain.toLowerCase()))      { invalid.push(t); return; }
      if (seen.has(lc)) { duplicates.push(t); return; }
      seen.add(lc);
      valid.push(t);
    });
    return { valid, invalid, duplicates };
  }

  /* ===== HELPERS ===== */

  function _adminCount() {
    return _allUsers()
      .filter(u => _category(u.raw) === 'platform')
      .filter(u => _ensureState(u.id)?.type === 'admin').length;
  }

  function _diffCount(userId) {
    const a = _state[userId], b = _saved[userId];
    if (!a || !b) return 0;
    if (a.type === 'n/a' || b.type === 'n/a') return 0;
    return JSON.stringify(a) === JSON.stringify(b) ? 0 : _deepDiffCount(a, b);
  }
  function _deepDiffCount(a, b) {
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return a === b ? 0 : 1;
    }
    let n = 0;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(k => { n += _deepDiffCount(a?.[k], b?.[k]); });
    return n;
  }

  function _pCls(v) {
    if (v === 'full') return 'pf';
    if (v === 'edit') return 'pe';
    if (v === 'view') return 'pv';
    return 'pn';
  }

  function _esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function _help(key) {
    const t = HELP[key]; return t ? `title="${_esc(t)}" aria-label="${_esc(t)}"` : '';
  }

  function _mkSel(userId, section, entityId, field, opts, currentVal, grantAllVal, locked) {
    const isGA  = entityId === 'all';
    const isInh = !isGA && (currentVal === null || currentVal === undefined);
    const eff   = isInh ? grantAllVal : currentVal;
    const options = opts.map(([val, lbl]) =>
      `<option value="${val}"${eff === val ? ' selected' : ''}>${lbl}</option>`).join('');
    const inhCls = isInh ? ' ps-inh' : '';
    return `<select class="rb-ps ${_pCls(eff)}${inhCls}"${locked ? ' disabled' : ''}
      ${_help(field)}
      onchange="PlatformRbacView.onPermChange('${userId}','${section}','${entityId}','${field}',this)">${options}</select>`;
  }

  function _mkTog(userId, section, entityId, field, currentVal, grantAllVal, locked) {
    const isGA  = entityId === 'all';
    const isInh = !isGA && (currentVal === null || currentVal === undefined);
    const eff   = isInh ? grantAllVal : currentVal;
    const togId = `tog-${userId}-${section}-${entityId}-${field}`;
    const lblCls = `rb-tog-lbl${eff ? ' rb-tog-yes' : ''}${isInh ? ' rb-tog-inh' : ''}`;
    return `<div class="rb-tog">
      <label class="rb-tog-sw"><input type="checkbox" id="${togId}"${eff ? ' checked' : ''}${locked ? ' disabled' : ''}
        ${_help(field)}
        onchange="PlatformRbacView.onTogChange('${userId}','${section}','${entityId}','${field}',this)"><span class="rb-tog-sl"></span></label>
      <span class="${lblCls}" id="${togId}-lbl">${eff ? 'Yes' : 'No'}</span>
    </div>`;
  }

  function _typeBadge(type) {
    const lbl = type === 'admin' ? 'Admin' : type === 'view-only' ? 'View-only' : 'Member';
    const cls = type === 'admin' ? 'rb-utb-admin' : type === 'view-only' ? 'rb-utb-view' : 'rb-utb-member';
    return `<span class="rb-utb ${cls}">${lbl}</span>`;
  }

  function _avatar(u, size = 'md') {
    const sz = size === 'lg' ? 'rb-av-lg' : size === 'sm' ? 'rb-av-sm' : 'rb-av-md';
    return `<div class="rb-av ${sz}" style="background:${u.bg};color:${u.color}" aria-hidden="true">${u.initials}</div>`;
  }

  /* ===== RENDER: USER LIST ===== */

  function _renderList() {
    const all = _allUsers();
    const filtered = all.filter(u => {
      const cat = _category(u.raw);
      if (_categoryFilter !== 'all' && cat !== _categoryFilter) return false;
      if (_roleFilter     !== 'all' && u.raw.role !== _roleFilter) return false;
      if (_accessFilter   !== 'all') {
        const t = cat === 'platform' ? (_ensureState(u.id)?.type || 'member') : 'n/a';
        if (t !== _accessFilter) return false;
      }
      if (_statusFilter   !== 'all' && u.raw.onboardingStatus !== _statusFilter) return false;
      if (_companyFilter  !== 'all' && u.raw.companyId !== _companyFilter) return false;
      if (_searchFilter) {
        const q = _searchFilter.toLowerCase();
        const hay = [u.name, u.email, u.raw.title || ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const rows = filtered.map(u => {
      const cat   = _category(u.raw);
      const co    = u.raw.companyId ? State.getCompany(u.raw.companyId) : null;
      const br    = u.raw.branchId  ? State.getBranch(u.raw.branchId)   : null;
      const access = cat === 'platform' ? (_ensureState(u.id)?.type || 'member') : null;
      const accessHtml = access ? _typeBadge(access) : '<span class="rb-dim">—</span>';
      const statusHtml = cat === 'platform'
        ? '<span class="rb-dim">—</span>'
        : `<span class="status-pill ${Display.onboardingStatusClass(u.raw.onboardingStatus)}">${_esc(Display.onboardingStatusLabel(u.raw.onboardingStatus))}</span>`;
      const lastLoginHtml = u.raw.lastLogin ? _esc(Display.date(u.raw.lastLogin)) : '<span class="rb-dim">Never</span>';
      return `
        <tr onclick="PlatformRbacView.openUser('${u.id}')" tabindex="0"
            onkeydown="if(event.key==='Enter')PlatformRbacView.openUser('${u.id}')">
          <td>
            <div class="rb-user-cell">
              ${_avatar(u, 'md')}
              <div>
                <div class="rb-uname">${_esc(u.name)}</div>
                <div class="rb-uemail">${_esc(u.email)}</div>
              </div>
            </div>
          </td>
          <td><span class="${_categoryClass(cat)}">${_categoryLabel(cat)}</span></td>
          <td><span class="rb-utitle">${_esc(Display.roleName(u.raw.role))}</span></td>
          <td>${accessHtml}</td>
          <td>${co ? _esc(co.name) : '<span class="rb-dim">—</span>'}</td>
          <td>${br ? _esc(br.name) : '<span class="rb-dim">—</span>'}</td>
          <td><span class="rb-utitle">${_esc(u.raw.title || '—')}</span></td>
          <td>${statusHtml}</td>
          <td><span class="rb-utitle">${lastLoginHtml}</span></td>
        </tr>`;
    }).join('');

    const catCounts = ['all','platform','origination','investor'].reduce((acc, k) => {
      acc[k] = k === 'all' ? all.length : all.filter(u => _category(u.raw) === k).length;
      return acc;
    }, {});
    const catLbl = { all: 'All', platform: 'Platform Ops', origination: 'Origination', investor: 'Investor' };

    const roles  = ['all','sys_admin','operator','prog_admin','lo','lp','investor','investor_prospect'];
    const statuses = ['all','active','invited','email_verified','2fa_complete','verification_pending','verification_failed','suspended'];
    const companies = State.getCompanies();
    const showCompany = _categoryFilter === 'all' || _categoryFilter === 'origination';

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <div class="rb-header">
            <div>
              <h1 class="rb-title">User <em>Management</em></h1>
              <div class="rb-subtitle">All platform-ops, origination, and investor users &middot; one place to review access and onboarding</div>
            </div>
            <div class="rb-header-actions">
              <button class="rb-btn rb-btn-outline" onclick="PlatformRbacView.goAudit()">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 2h7l3 3v9H3V2z"/><path d="M5.5 7h5M5.5 9.5h5M5.5 12h3"/></svg>
                Audit Log
              </button>
              <button class="rb-btn rb-btn-primary" onclick="PlatformRbacView.goInvite()">+ Invite Users</button>
            </div>
          </div>

          <div class="rb-filters">
            <input class="rb-search" id="rb-search-input"
                   placeholder="Search name, email, or title…  (press / to focus)"
                   value="${_esc(_searchFilter)}"
                   oninput="PlatformRbacView.onSearch(this.value)"
                   aria-label="Search users by name, email, or title" />
            ${['all','platform','origination','investor'].map(k =>
              `<button class="rb-chip${_categoryFilter===k?' active':''}"
                       aria-pressed="${_categoryFilter===k}"
                       onclick="PlatformRbacView.setCategoryFilter('${k}')">${catLbl[k]} <span class="rb-chip-num">${catCounts[k]}</span></button>`
            ).join('')}
          </div>
          <div class="rb-filters rb-filters-2">
            <label class="rb-filter-lbl">Role
              <select class="rb-select rb-select-sm" onchange="PlatformRbacView.setRoleFilter(this.value)">
                ${roles.map(r => `<option value="${r}"${_roleFilter===r?' selected':''}>${r==='all'?'All roles':_esc(Display.roleName(r))}</option>`).join('')}
              </select>
            </label>
            <label class="rb-filter-lbl">Access Level
              <select class="rb-select rb-select-sm" onchange="PlatformRbacView.setAccessFilter(this.value)">
                <option value="all"${_accessFilter==='all'?' selected':''}>All</option>
                <option value="admin"${_accessFilter==='admin'?' selected':''}>Admin</option>
                <option value="member"${_accessFilter==='member'?' selected':''}>Member</option>
                <option value="view-only"${_accessFilter==='view-only'?' selected':''}>View-only</option>
                <option value="n/a"${_accessFilter==='n/a'?' selected':''}>N/A</option>
              </select>
            </label>
            <label class="rb-filter-lbl">Status
              <select class="rb-select rb-select-sm" onchange="PlatformRbacView.setStatusFilter(this.value)">
                ${statuses.map(s => `<option value="${s}"${_statusFilter===s?' selected':''}>${s==='all'?'All statuses':_esc(Display.onboardingStatusLabel(s))}</option>`).join('')}
              </select>
            </label>
            ${showCompany ? `
              <label class="rb-filter-lbl">Company
                <select class="rb-select rb-select-sm" onchange="PlatformRbacView.setCompanyFilter(this.value)">
                  <option value="all"${_companyFilter==='all'?' selected':''}>All companies</option>
                  ${companies.map(c => `<option value="${c.id}"${_companyFilter===c.id?' selected':''}>${_esc(c.name)}</option>`).join('')}
                </select>
              </label>` : ''}
          </div>

          <div class="rb-card-wrap">
            ${rows ? `
              <table class="rb-table rb-table-wide">
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Category</th>
                    <th scope="col">Role</th>
                    <th scope="col">Access Level</th>
                    <th scope="col">Company</th>
                    <th scope="col">Branch</th>
                    <th scope="col">Title</th>
                    <th scope="col">Onboarding</th>
                    <th scope="col">Last Login</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <div class="rb-list-foot">${filtered.length} of ${all.length} user${all.length===1?'':'s'}</div>
            ` : `
              <div class="rb-empty">
                <div class="rb-empty-icon"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="15" cy="12" r="6"/><path d="M2 35c0-7.18 5.82-13 13-13s13 5.82 13 13"/><circle cx="30" cy="12" r="5"/><path d="M38 34c0-5.52-3.58-10.23-8.5-11.85"/></svg></div>
                <p>No users match your filters.</p>
                <button class="rb-btn rb-btn-outline rb-btn-sm" onclick="PlatformRbacView.clearFilters()">Clear filters</button>
              </div>
            `}
          </div>
        </div>
        ${_renderModal()}
      </div>`;
  }

  /* ===== RENDER: BULK INVITE (STAGE 0 → 1 → 2) ===== */

  function _renderInvite() {
    if (!_inv) _initInvite();
    if (_inv.stage === 0) return _renderInviteStage0();
    if (_inv.stage === 1) return _renderInviteStage1();
    return _renderInviteStage2();
  }

  function _renderInviteStage0() {
    const s = _inv;
    const cards = [
      { id: 'platform',    name: 'Platform Operations', sub: 'Homium internal staff with system-wide access' },
      { id: 'origination', name: 'Loan Origination',    sub: 'Lender team members tied to a specific company & branch' },
      { id: 'investor',    name: 'Investor',            sub: 'External investors or prospects accessing the investor portal' },
    ];
    const companies = State.getCompanies();
    const canContinue = s.category && (s.category !== 'origination' || s.companyId);
    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.goList()">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>
            Back to User Management
          </a>
          <div class="rb-header">
            <div>
              <h1 class="rb-title">Invite <em>users</em></h1>
              <div class="rb-subtitle">Step 1 of 3 &middot; choose user category</div>
            </div>
            <div class="rb-stage-dots" aria-label="Step 1 of 3">
              <span class="rb-dot current"></span><span class="rb-dot-line"></span><span class="rb-dot"></span><span class="rb-dot-line"></span><span class="rb-dot"></span>
            </div>
          </div>

          <div class="rb-card-wrap rb-inv-card">
            <div class="rb-inv-catgrid">
              ${cards.map(c => `
                <button class="rb-inv-cat${s.category===c.id?' selected':''}"
                        aria-pressed="${s.category===c.id}"
                        onclick="PlatformRbacView.invSetCategory('${c.id}')">
                  <div class="rb-inv-cat-name">${c.name}</div>
                  <div class="rb-inv-cat-sub">${c.sub}</div>
                </button>`).join('')}
            </div>

            ${s.category === 'origination' ? `
              <div class="rb-inv-field" style="margin-top:18px">
                <label for="rb-inv-co">Target company</label>
                <select class="rb-select" id="rb-inv-co" onchange="PlatformRbacView.invSetCompany(this.value)">
                  <option value="">Select a company…</option>
                  ${companies.map(c => `<option value="${c.id}"${s.companyId===c.id?' selected':''}>${_esc(c.name)}</option>`).join('')}
                </select>
                <div class="rb-inv-hint">Invitees must have an email under this company's domain.</div>
              </div>` : ''}

            <div class="rb-inv-actions">
              <button class="rb-btn rb-btn-outline rb-btn-sm" onclick="PlatformRbacView.goList()">Cancel</button>
              <button class="rb-btn rb-btn-primary rb-btn-sm" ${canContinue?'':'disabled'} onclick="PlatformRbacView.invStage0Continue()">Continue →</button>
            </div>
          </div>
        </div>
        ${_renderModal()}
      </div>`;
  }

  function _renderInviteStage1() {
    const s = _inv;
    const parsed = s.parsed;
    const warnings = parsed && (parsed.invalid.length || parsed.duplicates.length) ? `
      <div class="rb-inv-warn">
        <div class="rb-inv-warn-hd">These were not added:</div>
        <div class="rb-inv-warn-list">
          ${parsed.invalid.map(e => `<span class="rb-inv-tag">${_esc(e)} <span class="rb-inv-tag-sub">— invalid or wrong domain</span></span>`).join('')}
          ${parsed.duplicates.map(e => `<span class="rb-inv-tag">${_esc(e)} <span class="rb-inv-tag-sub">— already on platform</span></span>`).join('')}
        </div>
      </div>` : '';
    const domain = _companyDomain();
    const hint = s.category === 'platform'
      ? 'Separate by comma, semicolon, space, or newline. Domain must match <strong>homium.io</strong>.'
      : s.category === 'origination'
        ? `Separate by comma, semicolon, space, or newline. Domain must match <strong>${_esc(domain || '')}</strong>.`
        : 'Separate by comma, semicolon, space, or newline. Any email domain is accepted.';
    const placeholder = s.category === 'platform'
      ? 'alice@homium.io, bob@homium.io&#10;carol@homium.io'
      : s.category === 'origination'
        ? `alice@${domain || 'company.com'}, bob@${domain || 'company.com'}`
        : 'investor1@example.com, prospect@fund.co';

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.invBackToStage0()">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>
            Back to category
          </a>
          <div class="rb-header">
            <div>
              <h1 class="rb-title">Invite <em>${_esc(_categoryLabel(s.category).toLowerCase())}</em></h1>
              <div class="rb-subtitle">Step 2 of 3 &middot; paste email addresses</div>
            </div>
            <div class="rb-stage-dots" aria-label="Step 2 of 3">
              <span class="rb-dot done"></span><span class="rb-dot-line done"></span><span class="rb-dot current"></span><span class="rb-dot-line"></span><span class="rb-dot"></span>
            </div>
          </div>

          <div class="rb-card-wrap rb-inv-card">
            <div class="rb-inv-field">
              <label for="rb-inv-emails">Paste email addresses</label>
              <textarea class="rb-textarea" id="rb-inv-emails" rows="9"
                        placeholder="${placeholder}"
                        oninput="PlatformRbacView.invSetRawEmails(this.value)">${_esc(s.rawEmails)}</textarea>
              <div class="rb-inv-hint">${hint}</div>
            </div>

            ${warnings}

            <div class="rb-inv-actions">
              <button class="rb-btn rb-btn-outline rb-btn-sm" onclick="PlatformRbacView.invBackToStage0()">Back</button>
              <button class="rb-btn rb-btn-primary rb-btn-sm" onclick="PlatformRbacView.invContinue()">Continue →</button>
            </div>
          </div>
        </div>
        ${_renderModal()}
      </div>`;
  }

  function _renderInviteStage2() {
    const s = _inv;
    const total = s.rows.length;
    const selected = s.rows.filter(r => r.selected).length;
    const allSelected = selected === total && total > 0;
    const cat = s.category;

    // Per-category column config
    const ROLE_OPTS = {
      platform:    [['admin','Admin'],['member','Member'],['view-only','View-only']],
      origination: [['lo','Loan Officer'],['lp','Loan Processor'],['prog_admin','Program Admin']],
      investor:    [['investor','Investor'],['investor_prospect','Investor Prospect']],
    }[cat];
    const branches = cat === 'origination' && s.companyId ? State.getBranchesByCompany(s.companyId) : [];

    const bulkLabel = cat === 'platform' ? 'Set user type…' : 'Set role…';
    const headers = cat === 'platform'
      ? '<th>Access Level</th><th>Title <span class="rb-th-opt">(optional)</span></th>'
      : cat === 'origination'
        ? '<th>Role</th><th>Branch</th><th>Title <span class="rb-th-opt">(optional)</span></th>'
        : '<th>Role</th><th>Title <span class="rb-th-opt">(optional)</span></th>';

    const renderRoleCell = (r) =>
      `<select class="rb-select rb-select-sm" onchange="PlatformRbacView.invSetRow(${r.id},'role',this.value)">
        ${ROLE_OPTS.map(([v,l]) => `<option value="${v}"${r.role===v?' selected':''}>${l}</option>`).join('')}
      </select>`;
    const renderBranchCell = (r) =>
      `<select class="rb-select rb-select-sm" onchange="PlatformRbacView.invSetRow(${r.id},'branchId',this.value)">
        ${branches.map(b => `<option value="${b.id}"${r.branchId===b.id?' selected':''}>${_esc(b.name)}</option>`).join('')}
      </select>`;
    const renderTitleCell = (r) =>
      `<input class="rb-input rb-input-sm" placeholder="—" value="${_esc(r.title)}" oninput="PlatformRbacView.invSetRow(${r.id},'title',this.value)" />`;

    const rowCells = (r) => cat === 'platform'
      ? `<td>${renderRoleCell(r)}</td><td>${renderTitleCell(r)}</td>`
      : cat === 'origination'
        ? `<td>${renderRoleCell(r)}</td><td>${renderBranchCell(r)}</td><td>${renderTitleCell(r)}</td>`
        : `<td>${renderRoleCell(r)}</td><td>${renderTitleCell(r)}</td>`;

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.invBackToStage1()">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>
            Back to Step 2
          </a>
          <div class="rb-header">
            <div>
              <h1 class="rb-title">Invite <em>${_esc(_categoryLabel(cat).toLowerCase())}</em></h1>
              <div class="rb-subtitle">Step 3 of 3 &middot; assign role${cat==='origination'?', branch':''} and title</div>
            </div>
            <div class="rb-stage-dots" aria-label="Step 3 of 3">
              <span class="rb-dot done"></span><span class="rb-dot-line done"></span><span class="rb-dot done"></span><span class="rb-dot-line done"></span><span class="rb-dot current"></span>
            </div>
          </div>

          <div class="rb-bulk-toolbar">
            <span class="rb-bulk-meta">${selected} of ${total} selected · bulk-apply to selected:</span>
            <select class="rb-select rb-select-sm" onchange="PlatformRbacView.invBulkSetRole(this.value); this.value=''">
              <option value="">${bulkLabel}</option>
              ${ROLE_OPTS.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
            </select>
          </div>

          <div class="rb-card-wrap">
            <table class="rb-table rb-bulk-table">
              <thead>
                <tr>
                  <th class="rb-bulk-cb"><input type="checkbox" ${allSelected ? 'checked' : ''} onchange="PlatformRbacView.invSelectAll(this.checked)" aria-label="Select all" /></th>
                  <th>Email</th>
                  ${headers}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${s.rows.map(r => `
                  <tr>
                    <td class="rb-bulk-cb"><input type="checkbox" ${r.selected ? 'checked' : ''} onchange="PlatformRbacView.invSetRow(${r.id},'selected',this.checked)" aria-label="Select ${_esc(r.email)}" /></td>
                    <td><span class="rb-bulk-email">${_esc(r.email)}</span></td>
                    ${rowCells(r)}
                    <td class="rb-row-act">
                      <button class="rb-revert" title="Remove from invite" aria-label="Remove ${_esc(r.email)}" onclick="PlatformRbacView.invRemoveRow(${r.id})">×</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>

          <div class="rb-inv-actions">
            <button class="rb-btn rb-btn-outline rb-btn-sm" onclick="PlatformRbacView.goList()">Cancel</button>
            <button class="rb-btn rb-btn-primary rb-btn-sm" onclick="PlatformRbacView.invSubmit()">Send ${total} Invite${total===1?'':'s'}</button>
          </div>
        </div>
        ${_renderModal()}
      </div>`;
  }

  /* ===== RENDER: USER DETAIL (type-adaptive) ===== */

  function _renderDetail(userId) {
    const u = _findUser(userId);
    if (!u) return _renderNotFound();
    const cat = _category(u.raw);
    if (cat === 'origination') return _renderOrigDetail(u);
    if (cat === 'investor')    return _renderInvestorDetail(u);
    return _renderPlatformDetail(u);
  }

  function _renderPlatformDetail(u) {
    const userId = u.id;
    _ensureState(userId);
    const p = _state[userId];
    const t = p.type;
    const typeClass = t === 'admin' ? 'rb-typesel-admin' : t === 'view-only' ? 'rb-typesel-view' : 'rb-typesel-member';
    const dirty = _diffCount(userId);

    let tabContent = '';
    if      (_activeObjTab === 'orgs')             tabContent = _renderOrgsTab(userId);
    else if (_activeObjTab === 'investors')        tabContent = _renderInvestorsTab(userId);
    else if (_activeObjTab === 'loanprograms')     tabContent = _renderLoanProgramsTab(userId);
    else if (_activeObjTab === 'funds')            tabContent = _renderFundsTab(userId);
    else                                           tabContent = _renderPlatformSettingsTab(userId);

    const tabsHtml = TABS.map(tab =>
      `<button class="rb-ot${tab.id===_activeObjTab?' active':''}"
               role="tab" aria-selected="${tab.id===_activeObjTab}"
               onclick="PlatformRbacView.setObjTab('${tab.id}')">${tab.label}</button>`
    ).join('');

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.goList()">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>
            Back to User Management
          </a>

          <div class="rb-detail-header">
            ${_avatar(u, 'lg')}
            <div class="rb-detail-info">
              <h1 class="rb-detail-name">${_esc(u.name)}</h1>
              <div class="rb-detail-email">${_esc(u.email)}${u.raw.title ? ` <span class="rb-meta-sep">·</span> <span class="rb-meta-text">${_esc(u.raw.title)}</span>` : ''}</div>
            </div>
            <div class="rb-detail-head-right">
              <label class="rb-typesel-row" for="rb-typesel-${userId}">
                <span class="rb-typesel-lbl">User type</span>
                <select class="rb-typesel ${typeClass}" id="rb-typesel-${userId}"
                        onchange="PlatformRbacView.changeType('${userId}',this)">
                  <option value="admin"${t==='admin'?' selected':''}>Admin</option>
                  <option value="member"${t==='member'?' selected':''}>Member</option>
                  <option value="view-only"${t==='view-only'?' selected':''}>View-only</option>
                </select>
              </label>
            </div>
          </div>

          <div class="rb-card-wrap">
            <div class="rb-section-hd">
              <div class="rb-section-hd-title">User Profile</div>
              <div class="rb-section-hd-sub">Read-only fields are populated from the operator's onboarding</div>
            </div>
            <div class="rb-profile-grid">
              <div class="rb-fg"><label for="rb-pf-first-${userId}">First name</label><input class="rb-input rb-input-sm" id="rb-pf-first-${userId}" value="${_esc(u.raw.firstName||'')}" readonly /></div>
              <div class="rb-fg"><label for="rb-pf-last-${userId}">Last name</label><input class="rb-input rb-input-sm" id="rb-pf-last-${userId}" value="${_esc(u.raw.lastName||'')}" readonly /></div>
              <div class="rb-fg"><label for="rb-pf-email-${userId}">Email</label><input class="rb-input rb-input-sm" id="rb-pf-email-${userId}" value="${_esc(u.email)}" readonly /></div>
              <div class="rb-fg"><label for="rb-pf-phone-${userId}">Phone</label><input class="rb-input rb-input-sm" id="rb-pf-phone-${userId}" placeholder="—" value="${_esc(u.raw.phone||'')}" /></div>
              <div class="rb-fg"><label for="rb-pf-title-${userId}">Title</label><input class="rb-input rb-input-sm" id="rb-pf-title-${userId}" placeholder="—" value="${_esc(u.raw.title||'')}" oninput="PlatformRbacView.onTitleChange('${userId}',this.value)" /></div>
              <div class="rb-fg"><label for="rb-pf-co-${userId}">Company</label><input class="rb-input rb-input-sm" id="rb-pf-co-${userId}" value="Homium" readonly /></div>
            </div>
          </div>

          ${t === 'view-only' ? `
            <div class="rb-vo-bar" role="status">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="6" cy="6" r="5"/><path d="M6 3v3.5M6 8.5v.01" stroke-linecap="round"/></svg>
              View-only — all editing controls are disabled. Promote to Member or Admin to grant write access.
            </div>` : ''}

          <div class="rb-card-wrap">
            <div class="rb-section-hd">
              <div class="rb-section-hd-title">Permissions Configuration</div>
              <div class="rb-section-hd-sub">Each tab grants access per object family. The amber row at the top of each table is a default applied to all current and future entities; row-level edits override it.</div>
            </div>
            <div class="rb-obj-tabs" role="tablist" aria-label="Permission categories">${tabsHtml}</div>
            <div class="rb-obj-pane">${tabContent}</div>
          </div>

          <div class="rb-detail-foot">
            ${dirty ? `<span class="rb-dirty"><span class="rb-dirty-dot"></span>${dirty} unsaved change${dirty===1?'':'s'}</span>` : '<span class="rb-clean">All changes saved</span>'}
            <div class="rb-foot-spacer"></div>
            <button class="rb-btn rb-btn-danger-ghost rb-btn-sm" onclick="PlatformRbacView.confirmDeactivate('${userId}')">Deactivate User</button>
            <button class="rb-btn rb-btn-ghost rb-btn-sm" ${dirty?'':'disabled'} onclick="PlatformRbacView.cancelChanges('${userId}')">Cancel</button>
            <button class="rb-btn rb-btn-primary rb-btn-sm" ${dirty?'':'disabled'} onclick="PlatformRbacView.saveChanges('${userId}')">Save Changes</button>
          </div>
        </div>
        ${_renderModal()}
      </div>`;
  }

  function _renderOrigDetail(u) {
    const userId = u.id;
    const co = u.raw.companyId ? State.getCompany(u.raw.companyId) : null;
    const br = u.raw.branchId  ? State.getBranch(u.raw.branchId)   : null;
    const assignments = Array.isArray(u.raw.branchAssignments) ? u.raw.branchAssignments : [];
    const licenses    = Array.isArray(u.raw.licenses)          ? u.raw.licenses          : [];
    const now = Date.now();
    const sixtyDays = 60 * 24 * 60 * 60 * 1000;

    const assignBlock = (a) => {
      const ab = State.getBranch(a.branchId);
      const utype = a.userType === 'lo' ? '<span class="rb-cat rb-cat-orig">LO</span>' : '<span class="rb-cat rb-cat-platform">Standard</span>';
      const bm    = a.flags?.branchManager ? '<span class="rb-cat rb-cat-investor">Branch Manager</span>' : '';
      const products = (a.eligibleLoanProductIds || []).map(id => `<span class="rb-inv-tag">${_esc(id)}</span>`).join(' ');
      const loSummary = (a.loAssignments || []).map(la => {
        const scope = la.scope === 'personal' ? 'Personal' : la.scope === 'all_los' ? 'All LOs' : 'Specific LO';
        const names = (la.loIds || []).map(id => State.getUser(id)).filter(Boolean).map(u2 => Display.fullName(u2)).join(', ');
        const sub = la.subflags ? Object.entries(la.subflags).filter(([,v]) => v).map(([k]) => k.replace(/^can/, '').toLowerCase()).join(' · ') : '';
        return `<li>${scope}${names?` (${_esc(names)})`:''} · <strong>${_esc(la.level)}</strong>${sub?` · ${_esc(sub)}`:''}</li>`;
      }).join('');
      return `
        <div class="rb-assign">
          <div class="rb-assign-hd">
            <span class="rb-assign-name">${_esc(ab?.name || a.branchId)}</span>
            ${utype} ${bm}
          </div>
          <div class="rb-assign-grid">
            <div class="rb-fg"><label>Allow new originations</label><div class="rb-meta-text">${a.allowNewOriginations ? 'Yes' : 'No'}</div></div>
            <div class="rb-fg"><label>Access to all branch activity</label><div class="rb-meta-text">${a.allowAccessToAllBranchActivity ? 'Yes' : 'No'}</div></div>
          </div>
          ${products ? `<div class="rb-fg"><label>Eligible loan products</label><div>${products}</div></div>` : ''}
          ${loSummary ? `<div class="rb-fg"><label>LO assignments</label><ul style="margin:4px 0 0 18px;font-size:13px;color:var(--h-ink-2)">${loSummary}</ul></div>` : ''}
          ${ab ? `<div class="rb-assign-foot"><a href="javascript:Router.navigate('/branches/${ab.id}')">Manage in branch →</a></div>` : ''}
        </div>`;
    };

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.goList()">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>
            Back to User Management
          </a>

          <div class="rb-detail-header">
            ${_avatar(u, 'lg')}
            <div class="rb-detail-info">
              <h1 class="rb-detail-name">${_esc(u.name)}</h1>
              <div class="rb-detail-email">${_esc(u.email)}${u.raw.title ? ` <span class="rb-meta-sep">·</span> <span class="rb-meta-text">${_esc(u.raw.title)}</span>` : ''}</div>
            </div>
            <div class="rb-detail-head-right">
              <span class="${_categoryClass('origination')}">Loan Origination</span>
            </div>
          </div>

          <div class="rb-card-wrap">
            <div class="rb-section-hd">
              <div class="rb-section-hd-title">Company &amp; Role</div>
            </div>
            <div class="rb-profile-grid">
              <div class="rb-fg"><label>Company</label><div class="rb-meta-text">${co ? `<a href="javascript:Router.navigate('/origination-companies/${co.id}')">${_esc(co.name)}</a>` : '—'}</div></div>
              <div class="rb-fg"><label>Primary branch</label><div class="rb-meta-text">${br ? `<a href="javascript:Router.navigate('/branches/${br.id}')">${_esc(br.name)}</a>` : '—'}</div></div>
              <div class="rb-fg"><label>Role</label><div class="rb-meta-text">${_esc(Display.roleName(u.raw.role))}</div></div>
              <div class="rb-fg"><label>Title</label><div class="rb-meta-text">${_esc(u.raw.title || '—')}</div></div>
              <div class="rb-fg"><label>NMLS ID</label><div class="rb-meta-text">${_esc(u.raw.nmlsId || '—')}</div></div>
              <div class="rb-fg"><label>Agent NMLS ID</label><div class="rb-meta-text">${_esc(u.raw.agentNmlsId || '—')}</div></div>
              <div class="rb-fg"><label>Phone</label><div class="rb-meta-text">${_esc(u.raw.phone || '—')}</div></div>
              <div class="rb-fg"><label>Onboarding</label><div><span class="status-pill ${Display.onboardingStatusClass(u.raw.onboardingStatus)}">${_esc(Display.onboardingStatusLabel(u.raw.onboardingStatus))}</span></div></div>
            </div>
          </div>

          <div class="rb-card-wrap">
            <div class="rb-section-hd">
              <div class="rb-section-hd-title">Branch Assignments</div>
              <div class="rb-section-hd-sub">Read-only view. Edit assignment details from the branch admin page.</div>
            </div>
            ${assignments.length ? assignments.map(assignBlock).join('') : '<div class="rb-empty"><p>No branch assignments on record.</p></div>'}
          </div>

          <div class="rb-card-wrap">
            <div class="rb-section-hd">
              <div class="rb-section-hd-title">Licenses &amp; NMLS</div>
              <div class="rb-section-hd-sub">State licenses and renewal status. Highlighted rows expire within 60 days.</div>
            </div>
            ${licenses.length ? `
              <table class="rb-table">
                <thead><tr><th>Market</th><th>Regulator</th><th>Active</th><th>Issued</th><th>Renewal</th><th>Last Sync</th></tr></thead>
                <tbody>
                  ${licenses.map(l => {
                    const renew = l.renewalDate ? new Date(l.renewalDate).getTime() : null;
                    const soon = renew && (renew - now) < sixtyDays;
                    return `<tr${soon?' style="background:rgba(217,119,6,0.06)"':''}>
                      <td>${_esc(l.marketId || '—')}</td>
                      <td>${_esc(l.regulator || '—')}</td>
                      <td>${l.active ? 'Yes' : 'No'}</td>
                      <td>${_esc(Display.date(l.issueDate))}</td>
                      <td>${_esc(Display.date(l.renewalDate))}${soon?' <span class="rb-cat rb-cat-investor">≤60d</span>':''}</td>
                      <td>${l.lastSync ? _esc(Display.relativeTime(l.lastSync)) : '—'}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>` : '<div class="rb-empty"><p>No licenses on record.</p></div>'}
          </div>

          <div class="rb-detail-foot">
            <span class="rb-clean">Managed in branch admin</span>
            <div class="rb-foot-spacer"></div>
            <button class="rb-btn rb-btn-danger-ghost rb-btn-sm" onclick="PlatformRbacView.confirmDeactivate('${userId}')">Deactivate User</button>
            <button class="rb-btn rb-btn-ghost rb-btn-sm" onclick="PlatformRbacView.goList()">Close</button>
          </div>
        </div>
        ${_renderModal()}
      </div>`;
  }

  function _renderInvestorDetail(u) {
    const userId = u.id;
    const entities = State.getInvestorEntities ? State.getInvestorEntities() : [];
    const matched = entities.find(e => e.contactEmail && e.contactEmail.toLowerCase() === u.email.toLowerCase());
    const policies = State.getPolicies();
    const policyChips = (u.raw.policies || []).map(pid => {
      const p = policies.find(x => x.id === pid);
      return `<span class="rb-inv-tag">${_esc(p ? p.name : pid)}</span>`;
    }).join(' ');

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.goList()">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>
            Back to User Management
          </a>

          <div class="rb-detail-header">
            ${_avatar(u, 'lg')}
            <div class="rb-detail-info">
              <h1 class="rb-detail-name">${_esc(u.name)}</h1>
              <div class="rb-detail-email">${_esc(u.email)}${u.raw.title ? ` <span class="rb-meta-sep">·</span> <span class="rb-meta-text">${_esc(u.raw.title)}</span>` : ''}</div>
            </div>
            <div class="rb-detail-head-right">
              <span class="${_categoryClass('investor')}">${_esc(Display.roleName(u.raw.role))}</span>
            </div>
          </div>

          <div class="rb-card-wrap">
            <div class="rb-section-hd">
              <div class="rb-section-hd-title">Investor Profile</div>
            </div>
            <div class="rb-profile-grid">
              <div class="rb-fg"><label>First name</label><div class="rb-meta-text">${_esc(u.raw.firstName||'')}</div></div>
              <div class="rb-fg"><label>Last name</label><div class="rb-meta-text">${_esc(u.raw.lastName||'')}</div></div>
              <div class="rb-fg"><label>Email</label><div class="rb-meta-text">${_esc(u.email)}</div></div>
              <div class="rb-fg"><label>Phone</label><div class="rb-meta-text">${_esc(u.raw.phone||'—')}</div></div>
              <div class="rb-fg"><label>Title</label><div class="rb-meta-text">${_esc(u.raw.title||'—')}</div></div>
              <div class="rb-fg"><label>Role</label><div class="rb-meta-text">${_esc(Display.roleName(u.raw.role))}</div></div>
              <div class="rb-fg"><label>Onboarding</label><div><span class="status-pill ${Display.onboardingStatusClass(u.raw.onboardingStatus)}">${_esc(Display.onboardingStatusLabel(u.raw.onboardingStatus))}</span></div></div>
              <div class="rb-fg"><label>Last login</label><div class="rb-meta-text">${u.raw.lastLogin ? _esc(Display.date(u.raw.lastLogin)) : 'Never'}</div></div>
              <div class="rb-fg"><label>Linked entity</label><div class="rb-meta-text">${matched ? `<a href="javascript:Router.navigate('/investors')">${_esc(matched.name)}</a>` : '—'}</div></div>
            </div>
            ${policyChips ? `
              <div class="rb-section-hd" style="margin-top:18px">
                <div class="rb-section-hd-title">Policies</div>
              </div>
              <div>${policyChips}</div>` : ''}
          </div>

          <div class="rb-detail-foot">
            <span class="rb-clean">Read-only profile</span>
            <div class="rb-foot-spacer"></div>
            <button class="rb-btn rb-btn-danger-ghost rb-btn-sm" onclick="PlatformRbacView.confirmDeactivate('${userId}')">Deactivate User</button>
            <button class="rb-btn rb-btn-ghost rb-btn-sm" onclick="PlatformRbacView.goList()">Close</button>
          </div>
        </div>
        ${_renderModal()}
      </div>`;
  }

  function _renderNotFound() {
    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.goList()">← Back</a>
          <div class="rb-card-wrap" style="padding:40px;text-align:center;color:var(--h-ink-3)">User not found.</div>
        </div>
      </div>`;
  }

  /* ===== RENDER: PERMISSION TABS ===== */

  function _renderPlatformSettingsTab(userId) {
    const p = _state[userId];
    const locked = p.type === 'view-only';
    const cfgOpts = locked
      ? [['none','No Access'],['view','View Only']]
      : [['none','No Access'],['view','View Only'],['edit','Can Edit'],['full','Full Access']];
    const items = [
      { key: 'manageOrgCos',           label: 'Manage Origination Companies' },
      { key: 'manageInvestors',        label: 'Manage Investors' },
      { key: 'managePlatformSettings', label: 'Manage Platform Settings' },
    ];
    const rows = items.map(it => {
      const v = p.platform[it.key];
      const opts = cfgOpts.map(([val,lbl]) => `<option value="${val}"${v===val?' selected':''}>${lbl}</option>`).join('');
      return `<tr>
        <td><span class="rb-en-name">${it.label}</span><div class="rb-en-help">${HELP[it.key]||''}</div></td>
        <td><select class="rb-ps ${_pCls(v)}"${locked?' disabled':''}
              onchange="PlatformRbacView.onPlatformChange('${userId}','${it.key}',this)">${opts}</select></td>
      </tr>`;
    }).join('');
    return `<div class="rb-pt-wrap"><table class="rb-pt">
      <thead><tr><th scope="col" style="width:55%">Configuration</th><th scope="col" style="width:45%">Access Level</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }

  function _renderEntityTable(userId, sectionKey, entities, columns) {
    const p = _state[userId];
    const locked = p.type === 'view-only';
    const ga = p[sectionKey]['all'];
    const visibleCols = columns.filter(c => !c.hideForViewOnly || !locked);

    const headCells = visibleCols.map(c =>
      `<th scope="col" style="width:${c.width}" ${HELP[c.field] ? `title="${_esc(HELP[c.field])}"` : ''}>${c.label}</th>`
    ).join('');

    const renderCell = (entityId, col, val, gaVal, dis) => {
      if (col.kind === 'select') return _mkSel(userId, sectionKey, entityId, col.field, col.opts, val, gaVal, dis);
      return _mkTog(userId, sectionKey, entityId, col.field, val, gaVal, dis);
    };

    const allRow = `
      <tr class="rb-pt-all">
        <td>
          <span class="rb-en-all">${_grantAllLabel(sectionKey)}</span>
          <span class="rb-en-all-sub">Default for current &amp; future entities</span>
        </td>
        ${visibleCols.map(c => `<td>${renderCell('all', c, ga[c.field], ga[c.field], locked)}</td>`).join('')}
        <td class="rb-row-act"></td>
      </tr>`;

    const entityRows = entities.map(ent => {
      const row    = p[sectionKey][ent.id];
      const isInh  = row === null || row === undefined;
      const active = ent.active !== undefined ? ent.active : ent.platActive;
      const dis    = locked || !active;
      const badge  = active
        ? (sectionKey === 'loanPrograms' ? '<span class="rb-eb rb-eb-plat">Platform Active</span>' : '<span class="rb-eb rb-eb-on">Active</span>')
        : '<span class="rb-eb rb-eb-off">Inactive</span>';
      const inhPill = isInh ? '<span class="rb-inh-pill" title="Inheriting the default row above">Inherited</span>' : '';
      return `
        <tr>
          <td><div class="${active?'':'rb-en-dim'}">
            <span class="rb-en-name">${_esc(ent.name)}</span>
            ${badge}
            ${inhPill}
          </div></td>
          ${visibleCols.map(c => `<td>${renderCell(ent.id, c, isInh ? null : row?.[c.field], ga[c.field], dis)}</td>`).join('')}
          <td class="rb-row-act">${!isInh && !locked
            ? `<button class="rb-revert" title="Revert to default" aria-label="Revert ${_esc(ent.name)} to default"
                       onclick="PlatformRbacView.resetRow('${userId}','${sectionKey}','${ent.id}')">×</button>`
            : ''}</td>
        </tr>`;
    }).join('');

    return `
      <div class="rb-pt-wrap">
        <table class="rb-pt">
          <thead><tr><th scope="col" style="width:240px">Entity</th>${headCells}<th class="rb-row-act"></th></tr></thead>
          <tbody>${allRow}${entityRows}</tbody>
        </table>
      </div>`;
  }

  function _grantAllLabel(sectionKey) {
    return ({
      orgs:         'All Origination Companies',
      investors:    'All Investors',
      loanPrograms: 'All Loan Programs',
      funds:        'All Funds',
    })[sectionKey] || 'All entities';
  }

  function _renderOrgsTab(userId) {
    return _renderEntityTable(userId, 'orgs', ORGS, [
      { field: 'settings',    label: 'Settings Access', width: '180px', kind: 'select',
        opts: [['none','No Access'],['view','View Only'],['full','Full Access']] },
      { field: 'impersonate', label: 'Impersonate',     width: '140px', kind: 'toggle', hideForViewOnly: true },
    ]);
  }

  function _renderInvestorsTab(userId) {
    return _renderEntityTable(userId, 'investors', INVESTORS, [
      { field: 'settings',    label: 'Settings Access',    width: '170px', kind: 'select',
        opts: [['none','No Access'],['view','View Only'],['full','Full Access']] },
      { field: 'approve',     label: 'Approve Activation', width: '160px', kind: 'toggle', hideForViewOnly: true },
      { field: 'impersonate', label: 'Impersonate',        width: '130px', kind: 'toggle', hideForViewOnly: true },
    ]);
  }

  function _renderLoanProgramsTab(userId) {
    return _renderEntityTable(userId, 'loanPrograms', LOAN_PROGRAMS, [
      { field: 'originations', label: 'Origination Access', width: '180px', kind: 'select',
        opts: [['none','No Access'],['view','View Only'],['edit','Can Edit'],['full','Full Access']] },
      { field: 'uwApprovals',  label: 'UW Approvals',       width: '140px', kind: 'toggle', hideForViewOnly: true },
      { field: 'ctc',          label: 'Clear to Close',     width: '140px', kind: 'toggle', hideForViewOnly: true },
    ]);
  }

  function _renderFundsTab(userId) {
    return _renderEntityTable(userId, 'funds', FUNDS, [
      { field: 'activations', label: 'Activation Access',    width: '160px', kind: 'select',
        opts: [['none','No Access'],['view','View Only'],['full','Full Access']] },
      { field: 'fundAdmin',   label: 'Fund Admin Approve',   width: '150px', kind: 'toggle', hideForViewOnly: true },
      { field: 'minting',     label: 'Approve Minting',      width: '140px', kind: 'toggle', hideForViewOnly: true },
      { field: 'updates',     label: 'Fund Updates',         width: '150px', kind: 'select',
        opts: [['none','No Access'],['view','View Only'],['full','Full Access']] },
      { field: 'hOnchain',    label: 'On-chain Update',      width: '140px', kind: 'toggle', hideForViewOnly: true },
    ]);
  }

  /* ===== RENDER: AUDIT LOG ===== */

  function _renderAudit() {
    const actors = ['all', ...Array.from(new Set(AUDIT.map(a => a.actor)))];
    const filtered = AUDIT.filter(e => {
      if (_auditTypeFilter     !== 'all' && e.type           !== _auditTypeFilter)     return false;
      if (_auditActorFilter    !== 'all' && e.actor          !== _auditActorFilter)    return false;
      if (_auditCategoryFilter !== 'all' && e.targetCategory !== _auditCategoryFilter) return false;
      return true;
    });

    const rows = [];
    let prevDay = '';
    filtered.forEach(e => {
      if (e.day !== prevDay) { rows.push(`<div class="rb-audit-day">${_esc(e.day)}</div>`); prevDay = e.day; }
      const tagCls = e.type === 'perm' ? 'rb-tag-perm' : e.type === 'user' ? 'rb-tag-user' : 'rb-tag-sys';
      const tagLbl = e.type === 'perm' ? 'PERMISSION' : e.type === 'user' ? 'USER' : 'SYSTEM';
      const catTag = e.targetCategory ? `<span class="${_categoryClass(e.targetCategory)}" style="margin-left:6px">${_categoryLabel(e.targetCategory)}</span>` : '';
      rows.push(`
        <div class="rb-audit-row">
          <div class="rb-audit-time">${_esc(e.time||'—')}</div>
          <div class="rb-audit-body">
            <div class="rb-audit-main">
              <span class="rb-audit-actor">${_esc(e.actor)}</span> ${_esc(e.action)} — <strong>${_esc(e.target)}</strong>
              <span class="rb-audit-tag ${tagCls}">${tagLbl}</span>${catTag}
            </div>
            <div class="rb-audit-detail">${_esc(e.detail)}</div>
          </div>
        </div>`);
    });

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.goList()">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>
            Back to User Management
          </a>
          <div class="rb-header">
            <div>
              <h1 class="rb-title">Audit <em>log</em></h1>
              <div class="rb-subtitle">All permission, user-management, and system events &middot; filters by target user</div>
            </div>
            <div class="rb-audit-controls">
              <label class="rb-audit-ctrl">
                <span>Event type</span>
                <select class="rb-select rb-select-sm" onchange="PlatformRbacView.setAuditTypeFilter(this.value)">
                  ${[['all','All events'],['perm','Permission changes'],['user','User management'],['sys','System']].map(([v,l]) =>
                    `<option value="${v}"${_auditTypeFilter===v?' selected':''}>${l}</option>`).join('')}
                </select>
              </label>
              <label class="rb-audit-ctrl">
                <span>User type</span>
                <select class="rb-select rb-select-sm" onchange="PlatformRbacView.setAuditCategoryFilter(this.value)">
                  ${[['all','All user types'],['platform','Platform Ops'],['origination','Loan Origination'],['investor','Investor']].map(([v,l]) =>
                    `<option value="${v}"${_auditCategoryFilter===v?' selected':''}>${l}</option>`).join('')}
                </select>
              </label>
              <label class="rb-audit-ctrl">
                <span>Actor</span>
                <select class="rb-select rb-select-sm" onchange="PlatformRbacView.setAuditActorFilter(this.value)">
                  ${actors.map(a => `<option value="${a}"${_auditActorFilter===a?' selected':''}>${a==='all'?'All actors':_esc(a)}</option>`).join('')}
                </select>
              </label>
              <button class="rb-btn rb-btn-outline rb-btn-sm" onclick="PlatformRbacView.exportAudit()">Export CSV</button>
            </div>
          </div>

          <div class="rb-card-wrap">
            <div class="rb-audit-list">
              ${rows.length ? rows.join('') : `<div class="rb-empty"><p>No events match the current filters.</p></div>`}
            </div>
            <div class="rb-audit-foot">
              <button class="rb-btn rb-btn-ghost rb-btn-sm" onclick="PlatformRbacView.loadMoreAudit()">Load older events</button>
            </div>
          </div>
        </div>
        ${_renderModal()}
      </div>`;
  }

  /* ===== MODAL ===== */

  function _renderModal() {
    if (!_modal) return '';
    const actions = _modal.actions.map(([lbl, fn], i) => {
      const last = i === _modal.actions.length - 1 && _modal.actions.length > 1;
      const cls = _modal.danger && last ? 'rb-btn rb-btn-danger rb-btn-sm' : last ? 'rb-btn rb-btn-primary rb-btn-sm' : 'rb-btn rb-btn-ghost rb-btn-sm';
      return `<button class="${cls}" onclick="${fn}">${_esc(lbl)}</button>`;
    }).join('');
    return `
      <div class="rb-modal-overlay" onclick="if(event.target===this)PlatformRbacView.closeModal()">
        <div class="rb-modal" role="dialog" aria-modal="true" aria-labelledby="rb-modal-title">
          <div class="rb-modal-header">
            <div>
              <div class="rb-modal-title" id="rb-modal-title">${_esc(_modal.title)}</div>
              ${_modal.subtitle ? `<div class="rb-modal-subtitle">${_esc(_modal.subtitle)}</div>` : ''}
            </div>
            <button class="rb-modal-close" aria-label="Close" onclick="PlatformRbacView.closeModal()">×</button>
          </div>
          <div class="rb-modal-body">${_modal.body}</div>
          <div class="rb-modal-footer">${actions}</div>
        </div>
      </div>`;
  }

  /* ===== TOAST ===== */

  function _showToast(msg) {
    let el = document.getElementById('rb-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rb-toast';
      el.className = 'rb-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ===== AFTER-RENDER HOOKS ===== */

  function _afterRender() {
    document.removeEventListener('keydown', _escHandler);
    document.addEventListener('keydown', _escHandler);
    document.removeEventListener('keydown', _slashHandler);
    document.addEventListener('keydown', _slashHandler);
  }
  function _escHandler(e) { if (e.key === 'Escape' && _modal) { e.preventDefault(); PlatformRbacView.closeModal(); } }
  function _slashHandler(e) {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const inField = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
    if (inField) return;
    const inp = document.getElementById('rb-search-input');
    if (inp) { e.preventDefault(); inp.focus(); inp.select?.(); }
  }

  function _rerender() {
    if (typeof App !== 'undefined' && App.renderView) {
      App.renderView(_currentPath);
      setTimeout(_afterRender, 0);
    }
  }

  /* ===== PUBLIC RENDER ENTRY ===== */

  function render(fullPath) {
    fullPath = fullPath || '/user-management';
    _currentPath = fullPath;

    let html;
    if (fullPath === '/user-management' || fullPath === '/user-management/') {
      html = _renderList();
    } else if (fullPath.startsWith('/user-management/audit')) {
      html = _renderAudit();
    } else if (fullPath.startsWith('/user-management/invite')) {
      html = _renderInvite();
    } else if (fullPath.startsWith('/user-management/u/')) {
      const id = fullPath.split('/user-management/u/')[1];
      html = _renderDetail(id);
    } else {
      html = _renderList();
    }

    setTimeout(_afterRender, 0);
    return html;
  }

  /* ===== PUBLIC API ===== */

  return {
    render,

    /* Navigation */
    openUser(userId) { _activeObjTab = 'platformsettings'; Router.navigate('/user-management/u/' + userId); },
    goList()         { Router.navigate('/user-management'); },
    goAudit()        { Router.navigate('/user-management/audit'); },
    goInvite()       { _initInvite(); Router.navigate('/user-management/invite'); },

    /* List filters */
    onSearch(v)            { _searchFilter   = v; _rerender(); },
    setCategoryFilter(v)   { _categoryFilter = v; if (v !== 'all' && v !== 'origination') _companyFilter = 'all'; _rerender(); },
    setRoleFilter(v)       { _roleFilter     = v; _rerender(); },
    setAccessFilter(v)     { _accessFilter   = v; _rerender(); },
    setStatusFilter(v)     { _statusFilter   = v; _rerender(); },
    setCompanyFilter(v)    { _companyFilter  = v; _rerender(); },
    clearFilters() {
      _searchFilter=''; _categoryFilter='all'; _roleFilter='all';
      _accessFilter='all'; _statusFilter='all'; _companyFilter='all';
      _rerender();
    },

    /* Bulk-invite actions */
    invSetCategory(v) {
      _inv.category = v;
      if (v !== 'origination') _inv.companyId = null;
      _rerender();
    },
    invSetCompany(v) { _inv.companyId = v || null; _rerender(); },
    invStage0Continue() {
      if (!_inv.category) return;
      if (_inv.category === 'origination' && !_inv.companyId) return;
      _inv.stage = 1; _rerender();
    },
    invBackToStage0() { _inv.stage = 0; _inv.parsed = null; _rerender(); },
    invSetRawEmails(v) { _inv.rawEmails = v; },
    invContinue() {
      const parsed = _parseEmails(_inv.rawEmails || '');
      _inv.parsed = parsed;
      if (!parsed.valid.length) { _rerender(); return; }
      const defaultRole = _inv.category === 'platform' ? 'member'
                        : _inv.category === 'origination' ? 'lo' : 'investor';
      const defaultBranch = _inv.category === 'origination' && _inv.companyId
        ? (State.getBranchesByCompany(_inv.companyId)[0]?.id || null) : null;
      _inv.rows = parsed.valid.map((email) => ({
        id: _inv.nextRowId++, email, role: defaultRole,
        branchId: defaultBranch, title: '', selected: true,
      }));
      _inv.stage = 2;
      _rerender();
    },
    invBackToStage1() { _inv.stage = 1; _rerender(); },
    invSetRow(rowId, key, value) {
      const r = _inv.rows.find(x => x.id === rowId);
      if (!r) return;
      r[key] = value;
      if (key === 'selected') _rerender();
    },
    invSelectAll(checked) { _inv.rows.forEach(r => r.selected = checked); _rerender(); },
    invBulkSetRole(value) {
      if (!value) return;
      _inv.rows.forEach(r => { if (r.selected) r.role = value; });
      _rerender();
    },
    invRemoveRow(rowId) {
      _inv.rows = _inv.rows.filter(r => r.id !== rowId);
      _rerender();
    },
    invSubmit() {
      const cat = _inv.category;
      const companyId = _inv.companyId || null;
      _inv.rows.forEach(r => {
        const local = r.email.split('@')[0];
        const parts = local.split(/[._]/);
        const firstName = parts[0] ? parts[0][0].toUpperCase() + parts[0].slice(1) : 'New';
        const lastName  = parts[1] ? parts[1][0].toUpperCase() + parts[1].slice(1) : 'User';
        const data = {
          firstName, lastName,
          email: r.email,
          role: cat === 'platform'
            ? (r.role === 'admin' ? 'sys_admin' : r.role === 'view-only' ? 'operator' : 'operator')
            : r.role,
          companyId: cat === 'origination' ? companyId : null,
          branchId:  cat === 'origination' ? r.branchId : null,
          title: r.title || '',
        };
        State.inviteUser(data);
      });
      const n = _inv.rows.length;
      _inv = null;
      Router.navigate('/user-management');
      _showToast(`${n} invite${n===1?'':'s'} sent`);
    },

    /* Profile editing (title) — persisted to State */
    onTitleChange(userId, v) {
      if (State.updateUser) State.updateUser(userId, { title: v });
    },

    /* Permission edits */
    onPermChange(userId, section, entityId, field, sel) {
      _ensureState(userId);
      if (!_state[userId][section][entityId]) _state[userId][section][entityId] = {};
      _state[userId][section][entityId][field] = sel.value;
      _rerender();
    },
    onTogChange(userId, section, entityId, field, inp) {
      _ensureState(userId);
      if (!_state[userId][section][entityId]) _state[userId][section][entityId] = {};
      _state[userId][section][entityId][field] = inp.checked;
      _rerender();
    },
    onPlatformChange(userId, key, sel) {
      _ensureState(userId);
      _state[userId].platform[key] = sel.value;
      _rerender();
    },
    resetRow(userId, section, entityId) {
      _ensureState(userId);
      _state[userId][section][entityId] = null;
      _rerender();
    },

    /* Object-tab switching on detail */
    setObjTab(id) { _activeObjTab = id; _rerender(); },

    /* Type change with last-Admin guard */
    changeType(userId, sel) {
      _ensureState(userId);
      const newType = sel.value;
      const oldType = _state[userId].type;
      if (newType === oldType) return;
      sel.value = oldType;
      const u = _findUser(userId);
      if (!u) return;
      if (oldType === 'admin' && newType !== 'admin' && _adminCount() <= 1) {
        _modal = { title: 'Cannot change user type',
          body: `<strong>${_esc(u.name)}</strong> is the only Admin on this platform. At least one Admin must remain. Promote another user to Admin first.`,
          actions: [['OK', 'PlatformRbacView.closeModal()']] };
        _rerender(); return;
      }
      _modal = { title: 'Change user type',
        body: `Set <strong>${_esc(u.name)}</strong> to <strong>${_esc(newType)}</strong>? Their existing per-entity permission overrides will be preserved; if the new type has stricter caps, those overrides are clamped on save.`,
        actions: [['Cancel', 'PlatformRbacView.closeModal()'], ['Confirm', `PlatformRbacView.applyType('${userId}','${newType}')`]] };
      _rerender();
    },
    applyType(userId, newType) {
      _ensureState(userId);
      _state[userId].type = newType;
      if (newType === 'view-only') {
        const plat = _state[userId].platform;
        Object.keys(plat).forEach(k => { if (plat[k] === 'edit' || plat[k] === 'full') plat[k] = 'view'; });
      }
      _modal = null; _rerender(); _showToast('User type updated');
    },

    /* Save / cancel */
    saveChanges(userId) {
      _saved[userId] = JSON.parse(JSON.stringify(_state[userId]));
      _rerender(); _showToast('Permissions saved');
    },
    cancelChanges(userId) {
      _state[userId] = JSON.parse(JSON.stringify(_saved[userId]));
      _rerender(); _showToast('Changes discarded');
    },

    /* Deactivate */
    confirmDeactivate(userId) {
      const u = _findUser(userId);
      if (!u) return;
      const cat = _category(u.raw);
      if (cat === 'platform' && _ensureState(userId)?.type === 'admin' && _adminCount() <= 1) {
        _modal = { title: 'Cannot deactivate user',
          body: `<strong>${_esc(u.name)}</strong> is the only Admin. Promote another user to Admin first.`,
          actions: [['OK', 'PlatformRbacView.closeModal()']] };
        _rerender(); return;
      }
      _modal = { title: 'Deactivate ' + _esc(u.name) + '?', danger: true,
        body: `<p style="margin-bottom:10px">This immediately revokes platform access:</p>
               <ul style="margin:0 0 10px 18px;color:var(--h-ink-2);font-size:13px;line-height:1.55">
                 <li><strong>Stops:</strong> active sessions, future logins, in-flight notifications</li>
                 <li><strong>Preserves:</strong> permission configuration (so reactivation is one click) and historic audit attribution</li>
               </ul>
               <p style="font-size:12px;color:var(--h-ink-3)">You can reactivate ${_esc(u.name)} from the user list at any time.</p>`,
        actions: [['Cancel', 'PlatformRbacView.closeModal()'], ['Deactivate', 'PlatformRbacView.doDeactivate()']] };
      _rerender();
    },
    doDeactivate() {
      _modal = null; Router.navigate('/user-management'); _showToast('User deactivated');
    },

    closeModal() { _modal = null; _rerender(); },

    /* Audit */
    setAuditTypeFilter(v)     { _auditTypeFilter     = v; _rerender(); },
    setAuditActorFilter(v)    { _auditActorFilter    = v; _rerender(); },
    setAuditCategoryFilter(v) { _auditCategoryFilter = v; _rerender(); },
    exportAudit()             { _showToast('Export queued — CSV emailed to you shortly'); },
    loadMoreAudit()           { _showToast('No older events to load'); },
  };
})();

/* Forward-friendly alias for new code that wants to refer to the view by its
   user-facing label. The legacy global PlatformRbacView is kept so existing
   inline onclick= handlers don't need to change. */
const UserManagementView = PlatformRbacView;
