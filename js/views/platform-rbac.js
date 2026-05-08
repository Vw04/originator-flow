/* ============================================================
   HOMIUM ORIGINATOR FLOW — Platform Operations Users (RBAC)
   sys_admin-only. Hosts the entire /platform surface:
     /platform           → operator roster
     /platform/u/:id     → user detail (per-entity permission matrix)
     /platform/audit     → audit log
     /platform/invite    → bulk invite (Stage 1 emails → Stage 2 per-row)
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

  /* ---- Mock data — scoped to this view, not in global State ---- */
  const USERS = [
    { id: 1, name: 'Sarah Chen',       initials: 'SC', email: 'sarah@homium.io',   color: '#fff', bg: '#0E2A47' },
    { id: 2, name: 'Marcus Rodriguez', initials: 'MR', email: 'marcus@homium.io',  color: '#fff', bg: '#C2A14A' },
    { id: 3, name: 'Elena Torres',     initials: 'ET', email: 'elena@homium.io',   color: '#fff', bg: '#1E3F62' },
    { id: 4, name: 'James Kim',        initials: 'JK', email: 'james@homium.io',   color: '#fff', bg: '#2D5680' },
    { id: 5, name: 'Rachel Foster',    initials: 'RF', email: 'rachel@homium.io',  color: '#fff', bg: '#5A8AB5' },
    { id: 6, name: 'David Park',       initials: 'DP', email: 'david@homium.io',   color: '#fff', bg: '#0369A1' },
    { id: 7, name: 'Lisa Wong',        initials: 'LW', email: 'lisa@homium.io',    color: '#fff', bg: '#7C3AED' },
  ];

  const userTitles = {
    1: 'System Admin',
    2: 'Senior Operator',
    3: 'Operations Specialist',
    4: 'Operations Specialist',
    5: 'Operator',
    6: 'Operator',
    7: 'Compliance Reviewer',
  };
  const userPhones = {};

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

  /* ---- Initial permission state per user ---- */
  const INIT_PERMS = {
    1: { type: 'admin',
      platform:     { manageOrgCos: 'full', manageInvestors: 'full', managePlatformSettings: 'full' },
      orgs:         { 'all': { settings: 'full', impersonate: true  }, 'oc1': null, 'oc2': null, 'oc3': null, 'oc4': null },
      investors:    { 'all': { settings: 'full', approve: true,  impersonate: true  }, 'iv1': null, 'iv2': null, 'iv3': null, 'iv4': null },
      loanPrograms: { 'all': { originations: 'full', uwApprovals: true,  ctc: true  }, 'lp1': null, 'lp2': null, 'lp3': null, 'lp4': null },
      funds:        { 'all': { activations: 'full', fundAdmin: true,  minting: true,  updates: 'full', hOnchain: true  }, 'f1': null, 'f2': null, 'f3': null, 'f4': null } },
    2: { type: 'admin',
      platform:     { manageOrgCos: 'edit', manageInvestors: 'edit', managePlatformSettings: 'edit' },
      orgs:         { 'all': { settings: 'view', impersonate: false }, 'oc1': { settings: 'full', impersonate: true }, 'oc2': null, 'oc3': null, 'oc4': null },
      investors:    { 'all': { settings: 'view', approve: false, impersonate: false }, 'iv1': { settings: 'full', approve: false, impersonate: true }, 'iv2': null, 'iv3': null, 'iv4': null },
      loanPrograms: { 'all': { originations: 'edit', uwApprovals: false, ctc: false }, 'lp1': null, 'lp2': null, 'lp3': null, 'lp4': null },
      funds:        { 'all': { activations: 'view', fundAdmin: false, minting: false, updates: 'view', hOnchain: false }, 'f1': null, 'f2': null, 'f3': null, 'f4': null } },
    3: { type: 'member',
      platform:     { manageOrgCos: 'view', manageInvestors: 'none', managePlatformSettings: 'none' },
      orgs:         { 'all': { settings: 'none', impersonate: false }, 'oc1': { settings: 'view', impersonate: false }, 'oc2': { settings: 'view', impersonate: false }, 'oc3': null, 'oc4': null },
      investors:    { 'all': { settings: 'none', approve: false, impersonate: false }, 'iv1': null, 'iv2': null, 'iv3': null, 'iv4': null },
      loanPrograms: { 'all': { originations: 'none', uwApprovals: false, ctc: false }, 'lp1': { originations: 'edit', uwApprovals: true, ctc: true }, 'lp2': { originations: 'edit', uwApprovals: true, ctc: true }, 'lp3': { originations: 'view', uwApprovals: false, ctc: false }, 'lp4': null },
      funds:        { 'all': { activations: 'none', fundAdmin: false, minting: false, updates: 'none', hOnchain: false }, 'f1': null, 'f2': null, 'f3': null, 'f4': null } },
    4: { type: 'member',
      platform:     { manageOrgCos: 'none', manageInvestors: 'none', managePlatformSettings: 'none' },
      orgs:         { 'all': { settings: 'view', impersonate: false }, 'oc1': null, 'oc2': null, 'oc3': null, 'oc4': null },
      investors:    { 'all': { settings: 'none', approve: false, impersonate: false }, 'iv1': null, 'iv2': null, 'iv3': null, 'iv4': null },
      loanPrograms: { 'all': { originations: 'edit', uwApprovals: true, ctc: true }, 'lp1': null, 'lp2': null, 'lp3': null, 'lp4': null },
      funds:        { 'all': { activations: 'none', fundAdmin: false, minting: false, updates: 'none', hOnchain: false }, 'f1': null, 'f2': null, 'f3': null, 'f4': null } },
    5: { type: 'member',
      platform:     { manageOrgCos: 'view', manageInvestors: 'view', managePlatformSettings: 'view' },
      orgs:         { 'all': { settings: 'view', impersonate: false }, 'oc1': null, 'oc2': null, 'oc3': null, 'oc4': null },
      investors:    { 'all': { settings: 'view', approve: false, impersonate: false }, 'iv1': null, 'iv2': null, 'iv3': null, 'iv4': null },
      loanPrograms: { 'all': { originations: 'view', uwApprovals: false, ctc: false }, 'lp1': null, 'lp2': null, 'lp3': null, 'lp4': null },
      funds:        { 'all': { activations: 'view', fundAdmin: false, minting: false, updates: 'view', hOnchain: false }, 'f1': null, 'f2': null, 'f3': null, 'f4': null } },
    6: { type: 'member',
      platform:     { manageOrgCos: 'none', manageInvestors: 'none', managePlatformSettings: 'none' },
      orgs:         { 'all': { settings: 'none', impersonate: false }, 'oc1': null, 'oc2': null, 'oc3': null, 'oc4': null },
      investors:    { 'all': { settings: 'none', approve: false, impersonate: false }, 'iv1': { settings: 'full', approve: true, impersonate: false }, 'iv2': { settings: 'view', approve: false, impersonate: false }, 'iv3': null, 'iv4': null },
      loanPrograms: { 'all': { originations: 'none', uwApprovals: false, ctc: false }, 'lp1': null, 'lp2': null, 'lp3': null, 'lp4': null },
      funds:        { 'all': { activations: 'none', fundAdmin: false, minting: false, updates: 'none', hOnchain: false }, 'f1': { activations: 'full', fundAdmin: true, minting: true, updates: 'full', hOnchain: true }, 'f2': { activations: 'view', fundAdmin: false, minting: false, updates: 'view', hOnchain: false }, 'f3': null, 'f4': null } },
    7: { type: 'view-only',
      platform:     { manageOrgCos: 'view', manageInvestors: 'view', managePlatformSettings: 'none' },
      orgs:         { 'all': { settings: 'view', impersonate: false }, 'oc1': null, 'oc2': null, 'oc3': null, 'oc4': null },
      investors:    { 'all': { settings: 'view', approve: false, impersonate: false }, 'iv1': null, 'iv2': null, 'iv3': null, 'iv4': null },
      loanPrograms: { 'all': { originations: 'view', uwApprovals: false, ctc: false }, 'lp1': null, 'lp2': null, 'lp3': null, 'lp4': null },
      funds:        { 'all': { activations: 'view', fundAdmin: false, minting: false, updates: 'view', hOnchain: false }, 'f1': null, 'f2': null, 'f3': null, 'f4': null } },
  };

  /* ---- Audit log demo data ---- */
  const AUDIT = [
    { day: 'Today',      time: '10:42 AM', type: 'perm', actor: 'Sarah Chen',       action: 'Updated permissions', target: 'Elena Torres',     detail: 'Loan Programs — Premium SAM 2024-B: Origination Access → Can Edit; UW Approvals enabled' },
    { day: 'Today',      time: '10:38 AM', type: 'perm', actor: 'Sarah Chen',       action: 'Updated permissions', target: 'Elena Torres',     detail: 'Loan Programs — Standard SAM 2024-A: Clear to Close approval enabled' },
    { day: 'Today',      time: '09:15 AM', type: 'user', actor: 'Marcus Rodriguez', action: 'Changed user type',   target: 'Lisa Wong',        detail: 'Member → View-only' },
    { day: 'Today',      time: '08:50 AM', type: 'sys',  actor: 'System',           action: 'Login',               target: 'David Park',       detail: '192.168.1.45 · macOS · Chrome' },
    { day: '2 days ago', time: '',         type: 'perm', actor: 'Sarah Chen',       action: 'Updated permissions', target: 'David Park',       detail: 'Funds — Homium Housing Fund I: Full Access; Fund Admin Approve and Minting enabled' },
    { day: '2 days ago', time: '',         type: 'perm', actor: 'Sarah Chen',       action: 'Updated permissions', target: 'David Park',       detail: 'Investors — Sequoia Housing Trust: Settings → Full Access; Approve Activation enabled' },
    { day: '2 days ago', time: '',         type: 'user', actor: 'Marcus Rodriguez', action: 'Added user',          target: 'Rachel Foster',    detail: 'rachel@homium.io · Member' },
    { day: '3 days ago', time: '',         type: 'perm', actor: 'Sarah Chen',       action: 'Updated default',     target: 'James Kim',        detail: 'Loan Programs — All: Origination Access → Can Edit; UW Approvals and CTC enabled' },
    { day: '3 days ago', time: '',         type: 'user', actor: 'Sarah Chen',       action: 'Changed user type',   target: 'Marcus Rodriguez', detail: 'Member → Admin' },
    { day: '4 days ago', time: '',         type: 'sys',  actor: 'System',           action: 'Password reset',      target: 'Elena Torres',     detail: 'Completed via forgot-password flow' },
  ];

  /* ---- Module-scope mutable state (persists across re-renders) ---- */
  let _state         = JSON.parse(JSON.stringify(INIT_PERMS));
  let _saved         = JSON.parse(JSON.stringify(INIT_PERMS));
  let _activeObjTab  = 'platformsettings';
  let _searchFilter  = '';
  let _typeFilter    = 'all';                                    // 'all' | 'admin' | 'member' | 'view-only'
  let _auditTypeFilter  = 'all';
  let _auditActorFilter = 'all';
  let _modal         = null;
  let _toastTimer    = null;
  let _currentPath   = '/platform';

  /* ---- Bulk-invite Stage 1/2 state ---- */
  let _inv = null;
  function _initInvite() {
    _inv = { stage: 1, rawEmails: '', parsed: null, rows: [], nextRowId: 0 };
  }
  function _parseEmails(raw) {
    const tokens = raw.split(/[,;\s\n]+/).map(t => t.trim()).filter(Boolean);
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    const seen = new Set(USERS.map(u => u.email.toLowerCase()));
    const valid = [], invalid = [], duplicates = [];
    tokens.forEach(t => {
      if (!re.test(t)) { invalid.push(t); return; }
      const lc = t.toLowerCase();
      if (seen.has(lc)) { duplicates.push(t); return; }
      seen.add(lc);
      valid.push(t);
    });
    return { valid, invalid, duplicates };
  }

  /* ===== HELPERS ===== */

  function _adminCount() { return USERS.filter(u => _state[u.id]?.type === 'admin').length; }

  function _diffCount(userId) {
    const a = _state[userId], b = _saved[userId];
    if (!a || !b) return 0;
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
      onchange="PlatformRbacView.onPermChange(${userId},'${section}','${entityId}','${field}',this)">${options}</select>`;
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
        onchange="PlatformRbacView.onTogChange(${userId},'${section}','${entityId}','${field}',this)"><span class="rb-tog-sl"></span></label>
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
    const filtered = USERS.filter(u => {
      if (_typeFilter !== 'all' && _state[u.id]?.type !== _typeFilter) return false;
      if (_searchFilter) {
        const q = _searchFilter.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const rows = filtered.map(u => {
      const t = _state[u.id]?.type || 'member';
      return `
        <tr onclick="PlatformRbacView.openUser(${u.id})" tabindex="0"
            onkeydown="if(event.key==='Enter')PlatformRbacView.openUser(${u.id})">
          <td>
            <div class="rb-user-cell">
              ${_avatar(u, 'md')}
              <div>
                <div class="rb-uname">${_esc(u.name)}</div>
                <div class="rb-uemail">${_esc(u.email)}</div>
              </div>
            </div>
          </td>
          <td>${_typeBadge(t)}</td>
          <td><span class="rb-utitle">${_esc(userTitles[u.id] || '—')}</span></td>
        </tr>`;
    }).join('');

    const counts = ['all','admin','member','view-only'].reduce((acc, k) => {
      acc[k] = k === 'all' ? USERS.length : USERS.filter(u => _state[u.id]?.type === k).length;
      return acc;
    }, {});

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <div class="rb-header">
            <div>
              <h1 class="rb-title">Platform Operations <em>Users</em></h1>
              <div class="rb-subtitle">Internal Homium operator accounts &middot; per-entity access permissions</div>
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
                   placeholder="Search by name or email…  (press / to focus)"
                   value="${_esc(_searchFilter)}"
                   oninput="PlatformRbacView.onSearch(this.value)"
                   aria-label="Search operators by name or email" />
            ${['all','admin','member','view-only'].map(k => {
              const lbl = k==='all'?'All':k==='view-only'?'View-only':k.charAt(0).toUpperCase()+k.slice(1);
              return `<button class="rb-chip${_typeFilter===k?' active':''}"
                              aria-pressed="${_typeFilter===k}"
                              onclick="PlatformRbacView.setTypeFilter('${k}')">${lbl} <span class="rb-chip-num">${counts[k]}</span></button>`;
            }).join('')}
          </div>

          <div class="rb-card-wrap">
            ${rows ? `
              <table class="rb-table">
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">User Type</th>
                    <th scope="col">Title</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <div class="rb-list-foot">${filtered.length} of ${USERS.length} user${USERS.length===1?'':'s'}</div>
            ` : `
              <div class="rb-empty">
                <div class="rb-empty-icon"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="15" cy="12" r="6"/><path d="M2 35c0-7.18 5.82-13 13-13s13 5.82 13 13"/><circle cx="30" cy="12" r="5"/><path d="M38 34c0-5.52-3.58-10.23-8.5-11.85"/></svg></div>
                <p>No operators match your filters.</p>
                <button class="rb-btn rb-btn-outline rb-btn-sm" onclick="PlatformRbacView.clearFilters()">Clear filters</button>
              </div>
            `}
          </div>
        </div>
        ${_renderModal()}
      </div>`;
  }

  /* ===== RENDER: BULK INVITE (STAGE 1 + 2) ===== */

  function _renderInvite() {
    if (!_inv) _initInvite();
    return _inv.stage === 1 ? _renderInviteStage1() : _renderInviteStage2();
  }

  function _renderInviteStage1() {
    const s = _inv;
    const parsed = s.parsed;
    const warnings = parsed && (parsed.invalid.length || parsed.duplicates.length) ? `
      <div class="rb-inv-warn">
        <div class="rb-inv-warn-hd">These were not added:</div>
        <div class="rb-inv-warn-list">
          ${parsed.invalid.map(e => `<span class="rb-inv-tag">${_esc(e)} <span class="rb-inv-tag-sub">— invalid</span></span>`).join('')}
          ${parsed.duplicates.map(e => `<span class="rb-inv-tag">${_esc(e)} <span class="rb-inv-tag-sub">— already on platform</span></span>`).join('')}
        </div>
      </div>` : '';

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.goList()">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>
            Back to Platform Operations Users
          </a>
          <div class="rb-header">
            <div>
              <h1 class="rb-title">Invite <em>operators</em></h1>
              <div class="rb-subtitle">Step 1 of 2 &middot; paste internal email addresses</div>
            </div>
            <div class="rb-stage-dots" aria-label="Step 1 of 2">
              <span class="rb-dot current"></span><span class="rb-dot-line"></span><span class="rb-dot"></span>
            </div>
          </div>

          <div class="rb-card-wrap rb-inv-card">
            <div class="rb-inv-field">
              <label for="rb-inv-emails">Paste email addresses</label>
              <textarea class="rb-textarea" id="rb-inv-emails" rows="9"
                        placeholder="alice@homium.io, bob@homium.io&#10;carol@homium.io"
                        oninput="PlatformRbacView.invSetRawEmails(this.value)">${_esc(s.rawEmails)}</textarea>
              <div class="rb-inv-hint">Separate by comma, semicolon, space, or newline. Domain must match <strong>homium.io</strong>.</div>
            </div>

            ${warnings}

            <div class="rb-inv-actions">
              <button class="rb-btn rb-btn-outline rb-btn-sm" onclick="PlatformRbacView.goList()">Cancel</button>
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

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.invBackToStage1()">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>
            Back to Step 1
          </a>
          <div class="rb-header">
            <div>
              <h1 class="rb-title">Invite <em>operators</em></h1>
              <div class="rb-subtitle">Step 2 of 2 &middot; assign user type and title to each operator</div>
            </div>
            <div class="rb-stage-dots" aria-label="Step 2 of 2">
              <span class="rb-dot done"></span><span class="rb-dot-line done"></span><span class="rb-dot current"></span>
            </div>
          </div>

          <div class="rb-bulk-toolbar">
            <span class="rb-bulk-meta">${selected} of ${total} selected · bulk-apply to selected:</span>
            <select class="rb-select rb-select-sm" onchange="PlatformRbacView.invBulkSetType(this.value); this.value=''">
              <option value="">Set user type…</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="view-only">View-only</option>
            </select>
          </div>

          <div class="rb-card-wrap">
            <table class="rb-table rb-bulk-table">
              <thead>
                <tr>
                  <th class="rb-bulk-cb"><input type="checkbox" ${allSelected ? 'checked' : ''} onchange="PlatformRbacView.invSelectAll(this.checked)" aria-label="Select all" /></th>
                  <th>Email</th>
                  <th>User Type</th>
                  <th>Title <span class="rb-th-opt">(optional)</span></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${s.rows.map(r => `
                  <tr>
                    <td class="rb-bulk-cb"><input type="checkbox" ${r.selected ? 'checked' : ''} onchange="PlatformRbacView.invSetRow(${r.id},'selected',this.checked)" aria-label="Select ${_esc(r.email)}" /></td>
                    <td><span class="rb-bulk-email">${_esc(r.email)}</span></td>
                    <td>
                      <select class="rb-select rb-select-sm" onchange="PlatformRbacView.invSetRow(${r.id},'type',this.value)">
                        <option value="member"${r.type==='member'?' selected':''}>Member</option>
                        <option value="admin"${r.type==='admin'?' selected':''}>Admin</option>
                        <option value="view-only"${r.type==='view-only'?' selected':''}>View-only</option>
                      </select>
                    </td>
                    <td><input class="rb-input rb-input-sm" placeholder="—" value="${_esc(r.title)}" oninput="PlatformRbacView.invSetRow(${r.id},'title',this.value)" /></td>
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

  /* ===== RENDER: USER DETAIL ===== */

  function _renderDetail(userId) {
    const u = USERS.find(x => x.id === userId);
    if (!u) return _renderNotFound();
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

    const names = u.name.split(' ');

    return `
      <div class="rbac-root">
        <div class="rb-page">
          <a class="rb-back" href="javascript:PlatformRbacView.goList()">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2L4 7l5 5"/></svg>
            Back to Platform Operations Users
          </a>

          <div class="rb-detail-header">
            ${_avatar(u, 'lg')}
            <div class="rb-detail-info">
              <h1 class="rb-detail-name">${_esc(u.name)}</h1>
              <div class="rb-detail-email">${_esc(u.email)}${userTitles[userId] ? ` <span class="rb-meta-sep">·</span> <span class="rb-meta-text">${_esc(userTitles[userId])}</span>` : ''}</div>
            </div>
            <div class="rb-detail-head-right">
              <label class="rb-typesel-row" for="rb-typesel-${userId}">
                <span class="rb-typesel-lbl">User type</span>
                <select class="rb-typesel ${typeClass}" id="rb-typesel-${userId}"
                        onchange="PlatformRbacView.changeType(${userId},this)">
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
              <div class="rb-fg"><label for="rb-pf-first-${userId}">First name</label><input class="rb-input rb-input-sm" id="rb-pf-first-${userId}" value="${_esc(names[0]||'')}" readonly /></div>
              <div class="rb-fg"><label for="rb-pf-last-${userId}">Last name</label><input class="rb-input rb-input-sm" id="rb-pf-last-${userId}" value="${_esc(names.slice(1).join(' ')||'')}" readonly /></div>
              <div class="rb-fg"><label for="rb-pf-email-${userId}">Email</label><input class="rb-input rb-input-sm" id="rb-pf-email-${userId}" value="${_esc(u.email)}" readonly /></div>
              <div class="rb-fg"><label for="rb-pf-phone-${userId}">Phone</label><input class="rb-input rb-input-sm" id="rb-pf-phone-${userId}" placeholder="—" value="${_esc(userPhones[userId]||'')}" /></div>
              <div class="rb-fg"><label for="rb-pf-title-${userId}">Title</label><input class="rb-input rb-input-sm" id="rb-pf-title-${userId}" placeholder="—" value="${_esc(userTitles[userId]||'')}" oninput="PlatformRbacView.onTitleChange(${userId},this.value)" /></div>
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
            <button class="rb-btn rb-btn-danger-ghost rb-btn-sm" onclick="PlatformRbacView.confirmDeactivate(${userId})">Deactivate User</button>
            <button class="rb-btn rb-btn-ghost rb-btn-sm" ${dirty?'':'disabled'} onclick="PlatformRbacView.cancelChanges(${userId})">Cancel</button>
            <button class="rb-btn rb-btn-primary rb-btn-sm" ${dirty?'':'disabled'} onclick="PlatformRbacView.saveChanges(${userId})">Save Changes</button>
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
              onchange="PlatformRbacView.onPlatformChange(${userId},'${it.key}',this)">${opts}</select></td>
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
                       onclick="PlatformRbacView.resetRow(${userId},'${sectionKey}','${ent.id}')">×</button>`
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
      if (_auditTypeFilter  !== 'all' && e.type  !== _auditTypeFilter)  return false;
      if (_auditActorFilter !== 'all' && e.actor !== _auditActorFilter) return false;
      return true;
    });

    const rows = [];
    let prevDay = '';
    filtered.forEach(e => {
      if (e.day !== prevDay) { rows.push(`<div class="rb-audit-day">${_esc(e.day)}</div>`); prevDay = e.day; }
      const tagCls = e.type === 'perm' ? 'rb-tag-perm' : e.type === 'user' ? 'rb-tag-user' : 'rb-tag-sys';
      const tagLbl = e.type === 'perm' ? 'PERMISSION' : e.type === 'user' ? 'USER' : 'SYSTEM';
      rows.push(`
        <div class="rb-audit-row">
          <div class="rb-audit-time">${_esc(e.time||'—')}</div>
          <div class="rb-audit-body">
            <div class="rb-audit-main">
              <span class="rb-audit-actor">${_esc(e.actor)}</span> ${_esc(e.action)} — <strong>${_esc(e.target)}</strong>
              <span class="rb-audit-tag ${tagCls}">${tagLbl}</span>
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
            Back to Platform Operations Users
          </a>
          <div class="rb-header">
            <div>
              <h1 class="rb-title">Audit <em>log</em></h1>
              <div class="rb-subtitle">All permission, user-management, and system events</div>
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
    fullPath = fullPath || '/platform';
    _currentPath = fullPath;

    let html;
    if (fullPath === '/platform' || fullPath === '/platform/') {
      html = _renderList();
    } else if (fullPath.startsWith('/platform/audit')) {
      html = _renderAudit();
    } else if (fullPath.startsWith('/platform/invite')) {
      html = _renderInvite();
    } else if (fullPath.startsWith('/platform/u/')) {
      const id = parseInt(fullPath.split('/platform/u/')[1], 10);
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
    openUser(userId) { _activeObjTab = 'platformsettings'; Router.navigate('/platform/u/' + userId); },
    goList()         { Router.navigate('/platform'); },
    goAudit()        { Router.navigate('/platform/audit'); },
    goInvite()       { _initInvite(); Router.navigate('/platform/invite'); },

    /* List filters */
    onSearch(v)        { _searchFilter = v; _rerender(); },
    setTypeFilter(v)   { _typeFilter   = v; _rerender(); },
    clearFilters()     { _searchFilter=''; _typeFilter='all'; _rerender(); },

    /* Bulk-invite actions */
    invSetRawEmails(v) { _inv.rawEmails = v; },
    invContinue() {
      const parsed = _parseEmails(_inv.rawEmails || '');
      _inv.parsed = parsed;
      if (!parsed.valid.length) { _rerender(); return; }
      _inv.rows = parsed.valid.map((email) => ({ id: _inv.nextRowId++, email, type: 'member', title: '', selected: true }));
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
    invBulkSetType(value) {
      if (!value) return;
      _inv.rows.forEach(r => { if (r.selected) r.type = value; });
      _rerender();
    },
    invRemoveRow(rowId) {
      _inv.rows = _inv.rows.filter(r => r.id !== rowId);
      _rerender();
    },
    invSubmit() {
      const n = _inv.rows.length;
      _inv = null;
      Router.navigate('/platform');
      _showToast(`${n} invite${n===1?'':'s'} sent`);
    },

    /* Profile editing (title) */
    onTitleChange(userId, v) { userTitles[userId] = v; },

    /* Permission edits */
    onPermChange(userId, section, entityId, field, sel) {
      if (!_state[userId][section][entityId]) _state[userId][section][entityId] = {};
      _state[userId][section][entityId][field] = sel.value;
      _rerender();
    },
    onTogChange(userId, section, entityId, field, inp) {
      if (!_state[userId][section][entityId]) _state[userId][section][entityId] = {};
      _state[userId][section][entityId][field] = inp.checked;
      _rerender();
    },
    onPlatformChange(userId, key, sel) {
      _state[userId].platform[key] = sel.value;
      _rerender();
    },
    resetRow(userId, section, entityId) {
      _state[userId][section][entityId] = null;
      _rerender();
    },

    /* Object-tab switching on detail */
    setObjTab(id) { _activeObjTab = id; _rerender(); },

    /* Type change with last-Admin guard */
    changeType(userId, sel) {
      const newType = sel.value;
      const oldType = _state[userId].type;
      if (newType === oldType) return;
      sel.value = oldType;
      const u = USERS.find(x => x.id === userId);
      if (oldType === 'admin' && newType !== 'admin' && _adminCount() <= 1) {
        _modal = { title: 'Cannot change user type',
          body: `<strong>${_esc(u.name)}</strong> is the only Admin on this platform. At least one Admin must remain. Promote another user to Admin first.`,
          actions: [['OK', 'PlatformRbacView.closeModal()']] };
        _rerender(); return;
      }
      _modal = { title: 'Change user type',
        body: `Set <strong>${_esc(u.name)}</strong> to <strong>${_esc(newType)}</strong>? Their existing per-entity permission overrides will be preserved; if the new type has stricter caps, those overrides are clamped on save.`,
        actions: [['Cancel', 'PlatformRbacView.closeModal()'], ['Confirm', `PlatformRbacView.applyType(${userId},'${newType}')`]] };
      _rerender();
    },
    applyType(userId, newType) {
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
      const u = USERS.find(x => x.id === userId);
      if (_state[userId].type === 'admin' && _adminCount() <= 1) {
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
      _modal = null; Router.navigate('/platform'); _showToast('User deactivated');
    },

    closeModal() { _modal = null; _rerender(); },

    /* Audit */
    setAuditTypeFilter(v)  { _auditTypeFilter  = v; _rerender(); },
    setAuditActorFilter(v) { _auditActorFilter = v; _rerender(); },
    exportAudit()          { _showToast('Export queued — CSV emailed to you shortly'); },
    loadMoreAudit()        { _showToast('No older events to load'); },
  };
})();
