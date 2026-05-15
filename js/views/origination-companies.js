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

    // OC onboarding wizard route
    if (first === 'new') {
      if (!State.can('manageCompany')) return this._renderHub();
      return OCWizardView.render();
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

    const tabs = [
      { key: 'details',  label: 'Details' },
      { key: 'branches', label: 'Branches' },
      { key: 'users',    label: 'Users' },
      { key: 'programs', label: 'Eligible Programs' },
      { key: 'markets',  label: 'Market Enablements' },
    ];
    // Migrate legacy active-tab keys to new ones
    const legacy = { overview: 'details', settings: 'details', access: 'programs', permissions: 'programs' };
    if (legacy[this._activeTab]) this._activeTab = legacy[this._activeTab];
    if (!tabs.find(t => t.key === this._activeTab)) this._activeTab = 'details';

    const tabsHtml = tabs.map(t =>
      `<div class="section-tab ${t.key === this._activeTab ? 'active' : ''}"
            onclick="OriginationCompaniesView.switchTab('${t.key}')">${t.label}</div>`
    ).join('');

    let content;
    switch (this._activeTab) {
      case 'details':  content = this._renderDetails(c, canEdit); break;
      case 'branches': content = BranchesView.render({ companyId }); break;
      case 'users':    content = UsersView.render({ companyId, roles: ['prog_admin', 'lo', 'lp'] }); break;
      case 'programs': content = this._renderEligiblePrograms(c, canEdit); break;
      case 'markets':  content = this._renderMarketEnablements(c, canEdit); break;
      default:         content = this._renderDetails(c, canEdit);
    }

    const breadcrumb = showBack ? `
      <div class="breadcrumb">
        <span class="breadcrumb-link" onclick="Router.navigate('/origination-companies')">Origination Companies</span>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">${c.name}</span>
      </div>` : '';

    return `
      ${breadcrumb}
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">${c.name}</div>
            <div class="page-subtitle">NMLS <span class="mono">${c.nmlsId}</span> · ${c.emailDomain}</div>
          </div>
          <div class="page-header-actions">
            ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="CompaniesView.openEditModal('${c.id}')">Edit Company</button>` : ''}
          </div>
        </div>
      </div>
      <div class="section-tabs">${tabsHtml}</div>
      <div class="page-body">${content}</div>
      <div id="company-modal-container"></div>
      <div id="company-panel-container"></div>`;
  },

  /* ---- Details tab — formerly Overview; absorbed key Settings fields ---- */
  _renderDetails(c, canEdit) {
    const branches = State.getBranchesByCompany(c.id);
    const users = State.getUsersByCompany(c.id);
    const activeUsers = users.filter(u => u.onboardingStatus === 'active').length;
    const pendingUsers = users.filter(u => !['active', 'suspended'].includes(u.onboardingStatus)).length;

    const ocLpmIds = State.getOcEnablement(c.id);
    const enabledLPMs = ocLpmIds.map(id => State.getLPM(id)).filter(Boolean);
    const enabledProgramIds = [...new Set(enabledLPMs.map(l => l.programId))];
    const enabledPrograms = enabledProgramIds.map(id => State.getLoanProgram(id)).filter(Boolean);
    const enabledMarketIds = [...new Set(enabledLPMs.map(l => l.marketId))];

    const today = new Date();
    const branchIds = new Set(branches.map(b => b.id));
    const branchUsers = users.filter(u => {
      const assignments = State.getBranchAssignments(u.id);
      return assignments.some(a => branchIds.has(a.branchId));
    });
    let expSoonCount = 0;
    branchUsers.forEach(u => {
      (u.licenses || []).forEach(lic => {
        const status = State.getLicenseExpiryStatus(lic, today);
        if (status && ['critical', 'warning', 'soon', 'expired', 'inactive'].includes(status.tier)) expSoonCount++;
      });
    });
    const lastSync = c.lastNmlsSync ? Display.relativeTime(c.lastNmlsSync) : '—';
    const ccDomains = (c.ccEmails || []).map(e => e.split('@')[1]).filter(Boolean);

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card">
          <div class="card-title" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
            <span>Company Details</span>
            <span style="font-size:11px;color:var(--color-text-muted);font-weight:500">
              <span class="status-dot" style="background:var(--color-success);display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px"></span>
              NMLS sync: ${lastSync}
            </span>
          </div>
          <div class="info-grid">
            <div class="info-row"><div class="info-label">Status</div><div class="info-value"><span class="badge ${c.status === 'active' ? 'badge-active' : 'badge-pending'}">${c.status === 'active' ? 'Active' : 'Pending Setup'}</span></div></div>
            <div class="info-row"><div class="info-label">NMLS ID</div><div class="info-value mono">${c.nmlsId}</div></div>
            <div class="info-row"><div class="info-label">State of Incorporation</div><div class="info-value">${c.stateOfIncorporation}</div></div>
            <div class="info-row"><div class="info-label">Address</div><div class="info-value">${[c.address1, c.address2, [c.city, c.state, c.zip].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || '—'}</div></div>
            <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${c.contactPhone || '—'}</div></div>
            <div class="info-row"><div class="info-label">Website</div><div class="info-value">${c.website ? `<a href="${c.website}" target="_blank" style="color:var(--color-primary)">${c.website.replace(/^https?:\/\//, '')}</a>` : '—'}</div></div>
            <div class="info-row"><div class="info-label">Primary Contact</div><div class="info-value">${c.primaryContact}</div></div>
            <div class="info-row"><div class="info-label">Allowed Email Domains</div><div class="info-value">${[c.emailDomain, ...ccDomains].filter(Boolean).join(', ')}</div></div>
            <div class="info-row"><div class="info-label">Created</div><div class="info-value">${Display.date(c.createdAt)}</div></div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="card">
            <div class="card-title" style="margin-bottom:14px">At a Glance</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center">
              <div>
                <div style="font-size:24px;font-weight:700;color:var(--color-primary)">${branches.length}</div>
                <div style="font-size:11px;color:var(--color-text-secondary)">Branches</div>
              </div>
              <div>
                <div style="font-size:24px;font-weight:700;color:var(--color-primary)">${activeUsers}</div>
                <div style="font-size:11px;color:var(--color-text-secondary)">Active Users</div>
              </div>
              <div>
                <div style="font-size:24px;font-weight:700;color:${pendingUsers > 0 ? 'var(--color-warning)' : 'var(--color-primary)'}">${pendingUsers}</div>
                <div style="font-size:11px;color:var(--color-text-secondary)">Pending</div>
              </div>
              <div>
                <div style="font-size:24px;font-weight:700;color:${expSoonCount ? 'var(--color-warning)' : 'var(--color-text-muted)'}">${expSoonCount}</div>
                <div style="font-size:11px;color:var(--color-text-secondary)">Lic. ≤60d</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title" style="margin-bottom:10px">Compliance Documents</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${c.complianceDocs.map(d => `<span class="tag">${d}</span>`).join('')}
              ${!c.complianceDocs.length ? '<span class="text-muted" style="font-size:12px">No docs on file</span>' : ''}
            </div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card">
          <div class="card-title" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
            <span>Eligible Programs <span style="color:var(--color-text-muted);font-weight:400;font-size:12px">(${enabledPrograms.length})</span></span>
            ${canEdit ? `<button class="btn btn-xs btn-ghost" onclick="OriginationCompaniesView.switchTab('programs')">Manage →</button>` : ''}
          </div>
          ${enabledPrograms.length
            ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${enabledPrograms.map(p => `<span class="tag" style="font-size:12px;padding:4px 10px">${p.name}</span>`).join('')}</div>`
            : '<div style="color:var(--color-text-muted);font-size:13px">No programs enabled.</div>'}
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
            <span>Market Enablements <span style="color:var(--color-text-muted);font-weight:400;font-size:12px">(${enabledMarketIds.length})</span></span>
            ${canEdit ? `<button class="btn btn-xs btn-ghost" onclick="OriginationCompaniesView.switchTab('markets')">Manage →</button>` : ''}
          </div>
          ${enabledMarketIds.length
            ? `<div class="admin-pm-chip-grid">${enabledMarketIds.map(id => { const m = State.getMarket(id); return m ? `<span class="admin-pm-chip is-on">${m.code}</span>` : ''; }).join('')}</div>`
            : '<div style="color:var(--color-text-muted);font-size:13px">No markets enabled.</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:14px">Branches</div>
        <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden">
          <table>
            <thead><tr><th>Branch</th><th>Type</th><th>State</th><th>Users</th><th>NMLS Sync</th><th>Status</th></tr></thead>
            <tbody>
              ${branches.map(b => `
                <tr class="clickable" onclick="Router.navigate('/branches/${b.id}')">
                  <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address1 || b.address || ''}</div></td>
                  <td>${b.branchType || 'Branch'}</td>
                  <td>${b.state}</td>
                  <td>${b.userCount}</td>
                  <td style="color:var(--color-text-muted);font-size:11px">${b.lastNmlsSync ? Display.relativeTime(b.lastNmlsSync) : '—'}</td>
                  <td><span class="badge ${b.status === 'active' ? 'badge-active' : 'badge-pending'}">${b.status}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  /* ---- Eligible Programs tab — OC-level program enablement ----
     Each platform-defined program is a single checkbox. Toggling
     enables/disables ALL of that program's allowed-market LPMs at OC level.
     Program *creation* is in System Configuration — this view only enables
     programs already defined there. */
  _renderEligiblePrograms(c, canEdit) {
    const ocLpmIds = State.getOcEnablement(c.id);
    const ocSet = new Set(ocLpmIds);
    const programs = State.getLoanPrograms();

    if (!programs.length) {
      return `<div class="card"><div style="text-align:center;color:var(--color-text-muted);padding:32px;font-size:13px">No platform-defined loan programs yet.${canEdit ? ' Define one under <a href="javascript:void(0)" onclick="Router.navigate(\'/system-config\')" style="color:var(--color-primary);font-weight:600">System Configuration</a>.' : ''}</div></div>`;
    }

    const rows = programs.map(p => {
      const lpmsForProgram = State.getLPMsForProgram(p.id);
      const isFullyEnabled = lpmsForProgram.length > 0 && lpmsForProgram.every(l => ocSet.has(l.id));
      const isPartialEnabled = !isFullyEnabled && lpmsForProgram.some(l => ocSet.has(l.id));
      const marketsLabel = (p.allowedMarketIds || []).map(id => State.getMarket(id)?.code).filter(Boolean).join(', ');
      return `
        <label style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--color-border-light);cursor:${canEdit ? 'pointer' : 'default'}">
          <input type="checkbox" ${isFullyEnabled ? 'checked' : ''} ${isPartialEnabled && !isFullyEnabled ? 'data-indeterminate="1"' : ''} ${canEdit ? '' : 'disabled'}
                 onchange="OriginationCompaniesView._toggleProgramEnabled('${c.id}', '${p.id}', this.checked)"
                 style="width:16px;height:16px;cursor:${canEdit ? 'pointer' : 'not-allowed'};flex-shrink:0">
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:600;color:var(--color-text)">${p.name}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">
              Markets: ${marketsLabel || '—'} · ${lpmsForProgram.length} program-market pair${lpmsForProgram.length === 1 ? '' : 's'}
            </div>
          </div>
          ${isFullyEnabled ? '<span class="badge badge-active" style="flex-shrink:0">Enabled</span>' : isPartialEnabled ? '<span class="badge badge-pending" style="flex-shrink:0">Partial</span>' : ''}
        </label>`;
    }).join('');

    return `
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:16px 18px;border-bottom:1px solid var(--color-border)">
          <div class="card-title" style="margin-bottom:2px">Eligible Programs</div>
          <div style="font-size:12px;color:var(--color-text-muted)">Toggle the loan programs available to this company. Branches can opt in to a subset under their own <strong>Eligible Programs</strong> tab. Loan officers must hold an active NMLS license in a program's market to originate.</div>
        </div>
        ${rows}
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

  /* ---- Market Enablements tab — chip grid over all supported markets ----
     Toggling a market on enables every LPM whose program supports that
     market; toggling off removes them. Branches' market subsets cascade
     through setOcEnablement automatically. */
  _renderMarketEnablements(c, canEdit) {
    const ocLpmIds = State.getOcEnablement(c.id);
    const ocLpms = ocLpmIds.map(id => State.getLPM(id)).filter(Boolean);
    const enabledMarketIds = new Set(ocLpms.map(l => l.marketId));
    const markets = State.getMarkets().filter(m => m.supported);

    const chips = markets.map(m => {
      const on = enabledMarketIds.has(m.id);
      const cls = canEdit ? `admin-pm-chip${on ? ' is-on' : ''}` : `admin-pm-chip is-readonly${on ? ' is-on' : ''}`;
      const click = canEdit ? `onclick="OriginationCompaniesView._toggleMarketEnabled('${c.id}', '${m.id}', ${!on})"` : '';
      return `<span class="${cls}" ${click}>${m.code} <span style="opacity:.7;font-weight:400;margin-left:4px">${m.name}</span></span>`;
    }).join('');

    return `
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:16px 18px;border-bottom:1px solid var(--color-border)">
          <div class="card-title" style="margin-bottom:2px">Market Enablements</div>
          <div style="font-size:12px;color:var(--color-text-muted)">States in which this company can originate. Toggling a market on/off enables/disables every program-market pair (LPM) that program supports for that market.</div>
        </div>
        <div style="padding:18px"><div class="admin-pm-chip-grid">${chips || '<span class="text-muted" style="font-size:12px">No markets supported by the platform.</span>'}</div></div>
      </div>`;
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
