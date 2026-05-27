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
  _editMode: false,

  render(fullPath) {
    const path = fullPath || '/origination-companies';
    const role = State.getRole();
    const currentUser = State.getCurrentUser();

    // Parse company ID from path: /origination-companies/co-001 (optional /edit)
    const segments = path.replace('/origination-companies', '').split('/').filter(Boolean);
    const first = segments[0] || null;

    // OC create route — institutional single-page form (replaces the wizard)
    if (first === 'new') {
      if (!State.can('manageCompany')) return this._renderHub();
      return OCCreateView.render();
    }

    const companyId = first;
    this._editMode = segments[1] === 'edit';
    if (this._editMode) this._activeTab = 'details';

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
    this._editMode = false;
    if (this._activeTab === 'overview' || this._activeTab === 'settings') this._activeTab = 'details';
    return this._renderHub();
  },

  /* 2026-05-27 canon Pattern D — Cancel/Save via FormState. */
  markDirty() { FormState.markFormDirty('oc-edit-form'); },

  enterEditMode(companyId) {
    Router.navigate('/origination-companies/' + companyId + '/edit');
    setTimeout(() => FormState.captureFormSnapshot('oc-edit-form'), 0);
  },

  cancelEdit(companyId) {
    FormState.cancelEditForm('oc-edit-form',
      () => Router.navigateForce('/origination-companies/' + companyId));
  },

  saveEdit(companyId) {
    const get = (id) => document.getElementById(id)?.value.trim();
    const patch = {
      name: get('co-name'),
      nmlsId: get('co-nmls'),
      address1: get('co-addr1'),
      address2: get('co-addr2'),
      city: get('co-city'),
      state: get('co-state'),
      zip: get('co-zip'),
      contactPhone: get('co-phone'),
      website: get('co-website'),
      primaryContact: get('co-progadmin'),
    };
    const cc = get('co-cc');
    if (cc !== undefined) patch.ccEmails = cc.split(',').map(s => s.trim()).filter(Boolean);
    Object.keys(patch).forEach(k => { if (patch[k] === undefined || patch[k] === '') delete patch[k]; });
    FormState.saveEditForm('oc-edit-form',
      () => { if (State.updateCompany) State.updateCompany(companyId, patch); },
      () => Router.navigateForce('/origination-companies/' + companyId));
  },

  /* ============================================================
     HUB: page-header + companies list (no tab strip — per RBAC
     wireframe, the OC hub is just a companies list; user
     management lives at /user-management).
     ============================================================ */
  _renderHub() {
    const canEdit = State.can('manageCompany') || State.can('editAny');
    CompaniesView._clickMode = 'navigate';
    CompaniesView._headless  = true;
    const content = CompaniesView.render();
    CompaniesView._clickMode = 'panel';
    CompaniesView._headless  = false;
    const primaryAction = canEdit
      ? `<button class="btn btn-primary btn-sm" onclick="Router.navigate('/origination-companies/new')">+ New Origination Company</button>`
      : '';

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
      <div class="page-body">${content}</div>
      <div id="company-modal-container"></div>
      <div id="company-panel-container"></div>`;
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
    const editing = this._editMode;

    const branches = State.getBranchesByCompany(c.id);
    const users    = State.getUsersByCompany(c.id);

    const tabs = [
      { key: 'details',  label: 'Details',  count: null },
      { key: 'branches', label: 'Branches', count: branches.length },
    ];
    // Migrate legacy active-tab keys (incl. former 'users' tab) → details.
    const legacy = { overview: 'details', settings: 'details', access: 'details', permissions: 'details', programs: 'details', markets: 'details', users: 'details' };
    if (legacy[this._activeTab]) this._activeTab = legacy[this._activeTab];
    if (!tabs.find(t => t.key === this._activeTab)) this._activeTab = 'details';

    const tabsHtml = tabs.map(t =>
      `<div class="section-tab ${t.key === this._activeTab ? 'active' : ''}"
            onclick="OriginationCompaniesView.switchTab('${t.key}')">${t.label}${t.count != null ? ` <span style="opacity:0.55;font-weight:400">(${t.count})</span>` : ''}</div>`
    ).join('');

    let content;
    if (editing) {
      content = this._renderDetails(c, canEdit, /* editing */ true);
    } else {
      switch (this._activeTab) {
        case 'details':  content = this._renderDetails(c, canEdit, false); break;
        case 'branches': content = BranchesView.render({ companyId }); break;
        default:         content = this._renderDetails(c, canEdit, false);
      }
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
      { label: 'Website', value: c.website ? `<a href="${c.website}" target="_blank" style="color:var(--h-action);text-decoration:none">${websiteShort}</a>` : '—' },
      { label: 'Branches', value: branches.length },
      { label: 'Users',    value: users.length },
    ];
    const metaHtml = meta.map((m, i) =>
      `<div><span class="entity-meta-label">${m.label}</span> <span class="entity-meta-value">${m.value}</span></div>${i < meta.length - 1 ? '<span class="entity-meta-sep">|</span>' : ''}`
    ).join('');

    const statusPill = c.status === 'active'
      ? `<span class="entity-status-pill">Active</span>`
      : `<span class="entity-status-pill" style="color:var(--h-warning)">Pending Setup</span>`;

    const editAction = canEdit
      ? (editing
        ? ''
        : `<button class="btn btn-secondary btn-sm" onclick="OriginationCompaniesView.enterEditMode('${c.id}')">Edit</button>`)
      : '';
    const footer = editing ? `
      <div class="inst-footer-bar">
        <span class="dirty-indicator">
          <span class="dot"></span>
          <span class="dirty-label">No changes</span>
        </span>
        <button class="btn btn-secondary btn-sm" onclick="OriginationCompaniesView.cancelEdit('${c.id}')">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="OriginationCompaniesView.saveEdit('${c.id}')">Save changes</button>
      </div>` : '';

    return `
      ${backLink}
      <div class="entity-header">
        <div class="entity-header-row">
          <div>
            <h1 class="entity-header-title">${c.name}</h1>
            <div class="entity-header-subtitle">Origination company</div>
          </div>
          <div class="entity-header-actions">${editAction}</div>
        </div>
        <div class="entity-meta-row">
          ${metaHtml}
          ${statusPill}
        </div>
      </div>
      ${editing ? '' : `<div class="section-tabs">${tabsHtml}</div>`}
      <div id="oc-edit-form" class="page-body"${editing ? ' oninput="OriginationCompaniesView.markDirty()"' : ''}>${content}</div>
      ${footer}
      <div id="company-modal-container"></div>
      <div id="company-panel-container"></div>`;
  },

  /* ---- Details tab — institutional MUI-form treatment.
     Headquarters card (read-only form fields), Eligible Programs (checkbox
     list lifted from old standalone tab), Market Enablements (50-state chip
     grid lifted from old standalone tab). No Branches sub-section. ---- */
  _renderDetails(c, canEdit, editing) {
    const ocLpmIds = State.getOcEnablement(c.id);
    const ocSet    = new Set(ocLpmIds);
    const ocLpms   = ocLpmIds.map(id => State.getLPM(id)).filter(Boolean);
    const enabledMarketIds = new Set(ocLpms.map(l => l.marketId));
    const enabledProgramIds = new Set(ocLpms.map(l => l.programId));
    const programs = State.getLoanPrograms();
    const markets = State.getMarkets();

    /* Field renderer: editable input or read-only outlined box. */
    const field = (label, value, opts) => {
      opts = opts || {};
      const v = (value === null || value === undefined) ? '' : value;
      if (editing && opts.id) {
        return `
          <div class="form-group">
            <label>${label}${opts.required ? ' <span class="req">*</span>' : ''}</label>
            <input class="input" id="${opts.id}" value="${String(v).replace(/"/g, '&quot;')}" />
          </div>`;
      }
      const empty = v === '' ? ' empty' : '';
      const shown = v === '' ? '—' : v;
      return `
        <div class="form-group">
          <label>${label}${opts.required ? ' <span class="req">*</span>' : ''}</label>
          <div class="field-value${empty}">${shown}</div>
        </div>`;
    };
    const fieldRO = (label, value, opts) => field(label, value, opts);

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
    }).join('') : `<div style="padding:16px 14px;color:var(--h-text-muted);font-size:13px">No platform-defined loan programs yet.${canEdit ? ' Define one under <a href="javascript:Router.navigate(\'/system-config\')" style="color:var(--h-action);font-weight:600">System Configuration</a>.' : ''}</div>`;

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
          ${field('Company name', c.name, { required: true, id: 'co-name' })}
          ${field('Company NMLS #', c.nmlsId, { required: true, id: 'co-nmls' })}
          ${field('Address 1', c.address1, { id: 'co-addr1' })}
          ${field('Suite #', c.address2, { id: 'co-addr2' })}
          ${field('City', c.city, { id: 'co-city' })}
          ${field('State', c.state || c.stateOfIncorporation, { id: 'co-state' })}
          ${field('Zip', c.zip, { id: 'co-zip' })}
          ${field('Contact phone', c.contactPhone, { id: 'co-phone' })}
          ${field('Website', c.website ? c.website.replace(/^https?:\/\//, '') : '', { id: 'co-website' })}
          ${field('Program admin', c.primaryContact, { id: 'co-progadmin' })}
          <div class="form-full">${field('CC email addresses', (c.ccEmails || []).join(', '), { id: 'co-cc' })}</div>
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
        <div style="font-size:12px;color:var(--h-text-muted);margin-bottom:14px">Select states where this company is authorized to originate. Locked states aren't yet supported by the platform.</div>
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
