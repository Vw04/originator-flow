/* ============================================================
   HOMIUM ORIGINATOR FLOW — Origination Companies Section

   Top-level shape (Round 3 RBAC restructure):
     /origination-companies
       └── 3-tab hub: Companies | Branches | Users  (lists scoped to LO entities)
           └── /origination-companies/:id  (Company detail)
                 ├── Details
                 ├── Branches
                 ├── Users
                 ├── Eligible Programs
                 └── Market Enablements
   ============================================================ */

const OriginationCompaniesView = {
  _selectedCompanyId: null,
  _activeTab: 'details',
  _topTab: 'companies',  // 'companies' | 'users'  (Branches lives inside each OC detail)

  render(fullPath) {
    const path = fullPath || '/origination-companies';
    const role = State.getRole();
    const currentUser = State.getCurrentUser();

    // Parse company ID from path: /origination-companies/co-001
    const segments = path.replace('/origination-companies', '').split('/').filter(Boolean);
    const first = segments[0] || null;

    // OC create route — institutional single-page form (replaces the wizard)
    if (first === 'new') {
      if (!State.can('manageCompany')) return this._renderHub();
      return OCCreateView.render();
    }

    const companyId = first;

    // prog_admin auto-drills into their own company
    if (role === 'prog_admin' && !companyId && currentUser?.companyId) {
      this._selectedCompanyId = currentUser.companyId;
      return this._renderDetail(currentUser.companyId);
    }

    if (companyId) {
      this._selectedCompanyId = companyId;
      return this._renderDetail(companyId);
    }

    this._selectedCompanyId = null;
    if (this._activeTab === 'overview' || this._activeTab === 'settings') this._activeTab = 'details';
    return this._renderHub();
  },

  /* ============================================================
     HUB: top-level 3-tab navigation
     ============================================================ */
  _renderHub() {
    const canEdit = State.can('manageCompany') || State.can('editAny');
    // Branches tab removed from the hub — branches live inside each OC's detail page.
    if (this._topTab === 'branches') this._topTab = 'companies';
    const tabs = [
      { key: 'companies', label: 'Companies' },
      { key: 'users',     label: 'Users'     },
    ];
    const tabsHtml = tabs.map(t =>
      `<div class="section-tab ${t.key === this._topTab ? 'active' : ''}"
            onclick="OriginationCompaniesView.switchTopTab('${t.key}')">${t.label}</div>`
    ).join('');

    let content;
    let primaryAction = '';

    if (this._topTab === 'companies') {
      CompaniesView._clickMode = 'navigate';
      CompaniesView._headless  = true;
      content = CompaniesView.render();
      CompaniesView._clickMode = 'panel';
      CompaniesView._headless  = false;
      if (canEdit) primaryAction = `<button class="btn btn-primary btn-sm" onclick="Router.navigate('/origination-companies/new')">+ New Origination Company</button>`;
    } else {
      content = UsersView.render({ scope: 'admin-hub', roles: ['prog_admin', 'lo', 'lp'] });
      const canInvite = canEdit || State.getRole() === 'prog_admin';
      if (canInvite) primaryAction = `<button class="btn btn-primary btn-sm" onclick="BulkInviteView.start({ companyId: '', returnPath: '${Router.getCurrentPath() || '/origination-companies'}' })">+ Invite User</button>`;
    }

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Origination Companies</div>
            <div class="page-subtitle">Companies, branches, and users for loan-origination entities</div>
          </div>
          <div class="page-header-actions">${primaryAction}</div>
        </div>
      </div>
      <div class="section-tabs">${tabsHtml}</div>
      <div class="page-body">${content}</div>
      <div id="company-modal-container"></div>
      <div id="company-panel-container"></div>`;
  },

  switchTopTab(key) {
    this._topTab = key;
    App.renderView('/origination-companies');
  },

  /* ============================================================
     COMPANY DETAIL: Details / Branches / Users / Eligible Programs / Market Enablements
     ============================================================ */
  _renderDetail(companyId) {
    const c = State.getCompany(companyId);
    if (!c) return '<div class="page-body"><p>Company not found.</p></div>';

    const role = State.getRole();
    const canEdit = State.can('manageCompany') || State.can('editAny');
    const showBack = role !== 'prog_admin';

    const branches = State.getBranchesByCompany(c.id);
    const users    = State.getUsersByCompany(c.id);

    const tabs = [
      { key: 'details',  label: 'Details',  count: null },
      { key: 'branches', label: 'Branches', count: branches.length },
      { key: 'users',    label: 'Users',    count: users.length },
    ];
    // Migrate legacy active-tab keys to new (programs/markets/overview/settings → details)
    const legacy = { overview: 'details', settings: 'details', access: 'details', permissions: 'details', programs: 'details', markets: 'details' };
    if (legacy[this._activeTab]) this._activeTab = legacy[this._activeTab];
    if (!tabs.find(t => t.key === this._activeTab)) this._activeTab = 'details';

    const tabsHtml = tabs.map(t =>
      `<div class="section-tab ${t.key === this._activeTab ? 'active' : ''}"
            onclick="OriginationCompaniesView.switchTab('${t.key}')">${t.label}${t.count != null ? ` <span style="opacity:0.55;font-weight:400">(${t.count})</span>` : ''}</div>`
    ).join('');

    let content;
    switch (this._activeTab) {
      case 'details':  content = this._renderDetails(c, canEdit); break;
      case 'branches': content = BranchesView.render({ companyId }); break;
      case 'users':    content = UsersView.render({ companyId, roles: ['prog_admin', 'lo', 'lp'] }); break;
      default:         content = this._renderDetails(c, canEdit);
    }

    // Entity header card per Figma — ← Back, serif name, subtitle, meta row,
    // status pill, top-right Edit.
    const backLink = showBack
      ? `<button class="back-link" onclick="Router.navigate('/origination-companies')">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
           Back to Companies
         </button>`
      : '';

    const websiteShort = c.website ? c.website.replace(/^https?:\/\//, '') : '';
    const meta = [
      { label: 'NMLS #', value: c.nmlsId },
      { label: 'Phone',  value: c.contactPhone || '—' },
      { label: 'Website', value: c.website ? `<a href="${c.website}" target="_blank" style="color:var(--color-primary);text-decoration:none">${websiteShort}</a>` : '—' },
      { label: 'Branches', value: branches.length },
      { label: 'Users',    value: users.length },
    ];
    const metaHtml = meta.map((m, i) =>
      `<div><span class="entity-meta-label">${m.label}</span> <span class="entity-meta-value">${m.value}</span></div>${i < meta.length - 1 ? '<span class="entity-meta-sep">|</span>' : ''}`
    ).join('');

    const statusPill = c.status === 'active'
      ? `<span class="entity-status-pill">Active</span>`
      : `<span class="entity-status-pill" style="color:var(--color-warning)">Pending Setup</span>`;

    return `
      ${backLink}
      <div class="entity-header">
        <div class="entity-header-row">
          <div>
            <h1 class="entity-header-title">${c.name}</h1>
            <div class="entity-header-subtitle">Origination company</div>
          </div>
          <div class="entity-header-actions">
            ${canEdit ? `<button class="btn btn-secondary btn-sm" onclick="CompaniesView.openEditModal('${c.id}')">Edit</button>` : ''}
          </div>
        </div>
        <div class="entity-meta-row">
          ${metaHtml}
          ${statusPill}
        </div>
      </div>
      <div class="section-tabs">${tabsHtml}</div>
      <div class="page-body">${content}</div>
      <div id="company-modal-container"></div>
      <div id="company-panel-container"></div>`;
  },

  /* ---- Details tab — institutional MUI-form treatment.
     Headquarters card (read-only form fields), Eligible Programs (checkbox
     list lifted from old standalone tab), Market Enablements (50-state chip
     grid lifted from old standalone tab). No Branches sub-section. ---- */
  _renderDetails(c, canEdit) {
    const ocLpmIds = State.getOcEnablement(c.id);
    const ocSet    = new Set(ocLpmIds);
    const ocLpms   = ocLpmIds.map(id => State.getLPM(id)).filter(Boolean);
    const enabledMarketIds = new Set(ocLpms.map(l => l.marketId));
    const enabledProgramIds = new Set(ocLpms.map(l => l.programId));
    const programs = State.getLoanPrograms();
    const markets = State.getMarkets();

    const fieldRO = (label, value, opts) => {
      const v = (value === null || value === undefined || value === '') ? '' : value;
      const empty = v === '' ? ' empty' : '';
      const shown = v === '' ? '—' : v;
      return `
        <div class="form-group">
          <label>${label}${opts?.required ? ' <span class="req">*</span>' : ''}</label>
          <div class="input is-readonly${empty}">${shown}</div>
        </div>`;
    };

    // Programs checklist
    const programRows = programs.length ? programs.map(p => {
      const lpmsForProgram = State.getLPMsForProgram(p.id);
      const isFullyEnabled = lpmsForProgram.length > 0 && lpmsForProgram.every(l => ocSet.has(l.id));
      const isPartialEnabled = !isFullyEnabled && lpmsForProgram.some(l => ocSet.has(l.id));
      const code = (p.code || p.name.replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase();
      const note = isPartialEnabled ? 'partially enabled' : '';
      return `
        <label class="program-check-row">
          <input type="checkbox" ${isFullyEnabled ? 'checked' : ''} ${canEdit ? '' : 'disabled'}
                 onchange="OriginationCompaniesView._toggleProgramEnabled('${c.id}', '${p.id}', this.checked)" />
          <div class="pc-name">${p.name}</div>
          ${note ? `<span class="pc-note">${note}</span>` : ''}
          <span class="pc-code">${code}</span>
        </label>`;
    }).join('') : `<div style="padding:16px 14px;color:var(--color-text-muted);font-size:13px">No platform-defined loan programs yet.${canEdit ? ' Define one under <a href="javascript:Router.navigate(\'/system-config\')" style="color:var(--color-primary);font-weight:600">System Configuration</a>.' : ''}</div>`;

    // 50-state chip grid — full set of US states. States supported by the
    // platform are clickable; unsupported states render muted/locked.
    const ALL_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'];
    const marketsByCode = new Map(markets.map(m => [m.code, m]));
    const chips = ALL_STATES.map(code => {
      const m = marketsByCode.get(code);
      if (!m) {
        return `<span class="state-chip is-locked" title="${code} — not supported by platform">${code}</span>`;
      }
      const on = enabledMarketIds.has(m.id);
      const click = canEdit ? `onclick="OriginationCompaniesView._toggleMarketEnabled('${c.id}', '${m.id}', ${!on})"` : '';
      const lockedCls = m.supported ? '' : ' is-locked';
      const cls = `state-chip${on ? ' is-on' : ''}${lockedCls}`;
      return `<span class="${cls}" ${click} title="${m.name}">${m.code}</span>`;
    }).join('');

    return `
      <div class="inst-card">
        <div class="inst-card-title">Headquarters information</div>
        <div class="inst-form-grid">
          ${fieldRO('Company name', c.name, { required: true })}
          ${fieldRO('Company NMLS #', c.nmlsId, { required: true })}
          ${fieldRO('Address 1', c.address1)}
          ${fieldRO('Suite #', c.address2)}
          ${fieldRO('City', c.city)}
          ${fieldRO('State', c.state || c.stateOfIncorporation)}
          ${fieldRO('Zip', c.zip)}
          ${fieldRO('Contact phone', c.contactPhone)}
          ${fieldRO('Website', c.website ? c.website.replace(/^https?:\/\//, '') : '')}
          ${fieldRO('Program admin', c.primaryContact)}
          <div class="form-full">${fieldRO('CC email addresses', (c.ccEmails || []).join(', '))}</div>
        </div>
      </div>

      <div class="inst-card">
        <div class="inst-card-title">
          <span>Eligible programs</span>
          <span class="count">${enabledProgramIds.size} of ${programs.length}</span>
        </div>
        <div class="program-checklist">${programRows}</div>
      </div>

      <div class="inst-card">
        <div class="inst-card-title">
          <span>Market enablements</span>
          <span class="count">${enabledMarketIds.size} state${enabledMarketIds.size === 1 ? '' : 's'}</span>
        </div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:14px">Select states where this company is authorized to originate. Locked states aren't yet supported by the platform.</div>
        <div class="state-grid">${chips}</div>
      </div>`;
  },

  _toggleProgramEnabled(ocId, programId, on) {
    const lpms = State.getLPMsForProgram(programId).map(l => l.id);
    const cur = new Set(State.getOcEnablement(ocId));
    if (on) lpms.forEach(id => cur.add(id));
    else    lpms.forEach(id => cur.delete(id));
    State.setOcEnablement(ocId, [...cur]);
    App.renderView(Router.getCurrentPath());
  },

  _toggleMarketEnabled(ocId, marketId, on) {
    const cur = new Set(State.getOcEnablement(ocId));
    const lpmsForMarket = State.getLPMsForMarket(marketId).map(l => l.id);
    if (on) lpmsForMarket.forEach(id => cur.add(id));
    else    lpmsForMarket.forEach(id => cur.delete(id));
    State.setOcEnablement(ocId, [...cur]);
    App.renderView(Router.getCurrentPath());
  },

  switchTab(tab) {
    this._activeTab = tab;
    App.renderView(Router.getCurrentPath());
  },
};
