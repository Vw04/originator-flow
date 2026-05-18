/* ============================================================
   HOMIUM ORIGINATOR FLOW — Section Stub Views
   Investors & Funds, Platform Operations, System Configuration
   ============================================================ */

/* ---- Shared section shell helper ----
   Optional `opts`: { primaryAction: html, breadcrumb: html, eyebrow: text } */
function renderSectionShell(title, subtitle, tabs, activeTab, content, opts) {
  opts = opts || {};
  const tabsHtml = tabs.map(t =>
    `<div class="section-tab ${t.key === activeTab ? 'active' : ''}"
          onclick="Router.navigate('${t.path}')">${t.label}</div>`
  ).join('');

  const eyebrow = opts.eyebrow ? `<div class="page-title-eyebrow">${opts.eyebrow}</div>` : '';
  const action  = opts.primaryAction ? `<div class="page-header-actions">${opts.primaryAction}</div>` : '';
  const crumb   = opts.breadcrumb || '';

  return `
    ${crumb}
    <div class="page-header">
      <div class="page-header-inner">
        <div class="page-header-left">
          ${eyebrow}
          <div class="page-title">${title}</div>
          <div class="page-subtitle">${subtitle}</div>
        </div>
        ${action}
      </div>
    </div>
    <div class="section-tabs">${tabsHtml}</div>
    <div class="page-body">${content}</div>`;
}

function renderStubContent(icon, heading, description) {
  return `
    <div class="stub-placeholder">
      <div class="stub-placeholder-icon">${icon}</div>
      <h3>${heading}</h3>
      <p>${description}</p>
    </div>`;
}

/* ============================================================
   Investors View — entities list + entity detail page.
   Per the RBAC wireframe: the hub is a plain entities list (no tab
   strip). System admins drill into an entity to see its users.
   ============================================================ */
const InvestorsView = {
  _detailTab: 'details',  // 'details' | 'users' | 'programs'

  render(fullPath) {
    const path = fullPath || '/investors';
    // Detail route: /investors/inv-001  (with optional sub-tab like /investors/inv-001/users)
    const segs = path.replace('/investors', '').split('/').filter(Boolean);
    if (segs.length && segs[0] !== 'users') {
      const entityId = segs[0];
      const sub = segs[1];
      if (['details', 'users'].includes(sub)) this._detailTab = sub;
      else if (!sub) this._detailTab = 'details';
      return this._renderDetail(entityId);
    }
    // Legacy /investors/users path → redirect to the hub.
    if (segs[0] === 'users') {
      Router.navigate('/investors', { replace: true });
      return '';
    }
    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title-eyebrow">Administration</div>
            <div class="page-title">Investors</div>
            <div class="page-subtitle">Investor entities and their users</div>
          </div>
        </div>
      </div>
      <div class="page-body">${this._renderEntities()}</div>`;
  },

  _renderEntities() {
    const entities = State.getInvestorEntities();
    if (!entities.length) return renderStubContent('🏦', 'No investor entities', 'Investor entities will appear here once created.');
    const rows = entities.map(e => {
      const programs = (e.programIds || []).map(id => State.getLoanProgram(id)).filter(Boolean);
      const programChips = programs.length
        ? programs.map(p => {
            const code = (p.code || p.name.replace(/[^A-Za-z]/g, '').slice(0, 2)).toUpperCase();
            return `<span class="program-chip" title="${p.name}">${code}</span>`;
          }).join('')
        : '<span class="text-muted">—</span>';
      const userCount = State.getUsers().filter(u => u.investorEntityId === e.id).length;
      return `
        <tr class="clickable" onclick="Router.navigate('/investors/${e.id}')">
          <td class="company-cell">
            <div class="cell-primary serif">${e.name}</div>
            <div class="cell-secondary">
              <span>${e.type}</span>
              <span class="cell-dot">·</span>${Display.currency(e.aum)} AUM
              <span class="cell-dot">·</span>${e.website || '—'}
            </div>
          </td>
          <td>${e.manager || '—'}</td>
          <td>${userCount}</td>
          <td><div class="program-chip-row">${programChips}</div></td>
          <td><span class="badge ${e.status === 'active' ? 'badge-active' : 'badge-pending'}">${e.status === 'active' ? 'Active' : 'Pending'}</span></td>
          <td class="text-secondary">${Display.date(e.createdAt)}</td>
          <td><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();Router.navigate('/investors/${e.id}')">View</button></td>
        </tr>`;
    }).join('');
    return `
      <div class="table-container">
        <table class="entity-table">
          <thead><tr>
            <th style="min-width:480px">Entity</th>
            <th style="min-width:180px">Manager</th>
            <th style="width:90px">Users</th>
            <th style="width:180px">Programs</th>
            <th style="width:150px">Status</th>
            <th style="width:140px">Created</th>
            <th style="width:90px"></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="table-footer"><span class="table-count">${entities.length} entities</span></div>
      </div>`;
  },

  _renderUsers() {
    return UsersView.render({ scope: 'admin-hub', roles: ['investor'] });
  },

  /* ---- Entity detail (Details / Users) ---- */
  _renderDetail(entityId) {
    const e = State.getInvestorEntities().find(x => x.id === entityId);
    if (!e) return `<div class="page-body"><p>Investor entity not found.</p></div>`;
    const detailTabs = [
      { key: 'details', label: 'Details', path: `/investors/${entityId}` },
      { key: 'users',   label: 'Users',   path: `/investors/${entityId}/users` },
    ];
    if (this._detailTab === 'programs') this._detailTab = 'details';
    const tab = this._detailTab || 'details';
    const content = tab === 'users' ? this._renderEntityUsers(e) : this._renderEntityDetails(e);

    const breadcrumb = `
      <div class="breadcrumb">
        <span class="breadcrumb-link" onclick="Router.navigate('/investors')">Investors</span>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">${e.name}</span>
      </div>`;
    const subtitle = `${e.type} · ${Display.currency(e.aum)} AUM`;
    return renderSectionShell(
      e.name,
      subtitle,
      detailTabs, tab, content,
      { eyebrow: 'Investor entity', breadcrumb }
    );
  },

  _renderEntityDetails(e) {
    const programs = (e.programIds || []).map(id => State.getLoanProgram(id)).filter(Boolean);
    const owners = (e.owners || []).map(o => `
      <div class="owner-row">
        <div class="owner-name">${o.name}</div>
        <div class="owner-role">${o.role}${o.stake ? ` · ${Math.round(o.stake * 100)}%` : ''}</div>
      </div>`).join('') || '<span class="text-muted" style="font-size:12px">No ownership disclosed</span>';

    const addr = [e.address1, [e.city, e.state, e.zip].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || '—';
    const webLink = e.website ? `<a href="https://${e.website}" target="_blank" style="color:var(--color-primary)">${e.website}</a>` : '—';
    const programChips = programs.length
      ? programs.map(p => {
          const code = (p.code || p.name.replace(/[^A-Za-z]/g, '').slice(0, 2)).toUpperCase();
          return `<span class="program-chip" title="${p.name}">${code}</span>`;
        }).join('')
      : '<span class="text-muted" style="font-size:12px">No programs assigned</span>';

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card">
          <div class="card-title" style="margin-bottom:14px">Entity Details</div>
          <div class="info-grid">
            <div class="info-row"><div class="info-label">Status</div><div class="info-value"><span class="badge ${e.status === 'active' ? 'badge-active' : 'badge-pending'}">${e.status === 'active' ? 'Active' : 'Pending'}</span></div></div>
            <div class="info-row"><div class="info-label">Type</div><div class="info-value">${e.type}</div></div>
            <div class="info-row"><div class="info-label">AUM</div><div class="info-value">${Display.currency(e.aum)}</div></div>
            <div class="info-row"><div class="info-label">Commitment</div><div class="info-value">${e.commitment ? Display.currency(e.commitment) : '—'}</div></div>
            <div class="info-row"><div class="info-label">Website</div><div class="info-value">${webLink}</div></div>
            <div class="info-row"><div class="info-label">Address</div><div class="info-value">${addr}</div></div>
            <div class="info-row"><div class="info-label">Created</div><div class="info-value">${Display.date(e.createdAt)}</div></div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="card">
            <div class="card-title" style="margin-bottom:14px">Contact &amp; Approver</div>
            <div class="info-grid">
              <div class="info-row"><div class="info-label">Primary Contact</div><div class="info-value">${e.contactName || '—'}</div></div>
              <div class="info-row"><div class="info-label">Email</div><div class="info-value">${e.contactEmail ? `<a href="mailto:${e.contactEmail}" style="color:var(--color-primary)">${e.contactEmail}</a>` : '—'}</div></div>
              <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${e.contactPhone || '—'}</div></div>
              <div class="info-row"><div class="info-label">Investor Manager</div><div class="info-value">${e.manager || '—'}</div></div>
              <div class="info-row"><div class="info-label">Approval Role</div><div class="info-value">${e.manager ? `${e.manager} (Approver)` : '—'}</div></div>
            </div>
          </div>

          <div class="card">
            <div class="card-title" style="margin-bottom:10px">Programs Involved</div>
            <div class="program-chip-row" style="gap:6px">${programChips}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:14px">Ownership</div>
        <div class="owner-list">${owners}</div>
      </div>`;
  },

  _renderEntityUsers(e) {
    // Same institutional Users layout as OC Users tab, scoped to this entity.
    // (No inline permissions card — permissions live on each user's profile page.)
    return UsersView.render({ scope: 'admin-hub', investorEntityId: e.id, roles: ['investor'] });
  },
};


/* ============================================================
   Platform Operator View
   Two tabs: Details (about Homium) + Users (Homium staff only).
   /user-management still routes through PlatformOpsView below.
   ============================================================ */
const PlatformOperatorView = {
  TABS: [
    { key: 'details', label: 'Details', path: '/platform-operator' },
    { key: 'users',   label: 'Users',   path: '/platform-operator/users' },
  ],

  render(fullPath) {
    if (!['sys_admin', 'operator'].includes(State.getRole())) {
      return `
        <div class="page-header">
          <div class="page-header-inner">
            <div class="page-header-left">
              <div class="page-title-eyebrow">Administration</div>
              <div class="page-title">Platform Operator</div>
              <div class="page-subtitle">Restricted area</div>
            </div>
          </div>
        </div>
        <div class="page-body">
          ${renderStubContent('🔒', 'Restricted', 'The Platform Operator surface is available to System Admins and Platform Operators only.')}
        </div>`;
    }
    const path = fullPath || '/platform-operator';
    const sub = path.replace('/platform-operator', '').replace(/^\//, '');
    const tab = sub === 'users' ? 'users' : 'details';
    const content = tab === 'users' ? this._renderUsers() : this._renderDetails();
    return renderSectionShell(
      'Homium',
      'Platform operator details and staff',
      this.TABS, tab, content,
      { eyebrow: 'Platform Operator' }
    );
  },

  _renderDetails() {
    const homiumUsers = State.getHomiumUsers();
    const supportedMarkets = State.getMarkets().filter(m => m.supported).length;
    const livePrograms = State.getLoanPrograms().filter(p => p.status === 'active').length;
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card">
          <div class="card-title" style="margin-bottom:14px">Company</div>
          <div class="info-grid">
            <div class="info-row"><div class="info-label">Legal Name</div><div class="info-value">Homium, Inc.</div></div>
            <div class="info-row"><div class="info-label">Headquarters</div><div class="info-value">Washington, DC</div></div>
            <div class="info-row"><div class="info-label">Founded</div><div class="info-value">2024</div></div>
            <div class="info-row"><div class="info-label">Website</div><div class="info-value"><a href="https://homium.io" target="_blank" style="color:var(--color-primary)">homium.io</a></div></div>
            <div class="info-row"><div class="info-label">Support Email</div><div class="info-value"><a href="mailto:support@homium.io" style="color:var(--color-primary)">support@homium.io</a></div></div>
            <div class="info-row"><div class="info-label">Support Phone</div><div class="info-value">1-800-HOMIUM-0</div></div>
            <div class="info-row"><div class="info-label">Status</div><div class="info-value"><span class="badge badge-active">Operating</span></div></div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="card">
            <div class="card-title" style="margin-bottom:14px">Platform at a Glance</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center">
              <div>
                <div style="font-family:var(--font-heading);font-size:28px;font-weight:300;color:var(--color-primary)">${homiumUsers.length}</div>
                <div style="font-size:11px;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.08em">Staff</div>
              </div>
              <div>
                <div style="font-family:var(--font-heading);font-size:28px;font-weight:300;color:var(--color-primary)">${supportedMarkets}</div>
                <div style="font-size:11px;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.08em">Live Markets</div>
              </div>
              <div>
                <div style="font-family:var(--font-heading);font-size:28px;font-weight:300;color:var(--color-primary)">${livePrograms}</div>
                <div style="font-size:11px;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.08em">Active Programs</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title" style="margin-bottom:10px">Regulatory</div>
            <div style="font-size:12.5px;color:var(--color-text-secondary);line-height:1.55">
              Homium operates as a technology platform for loan origination programs. NMLS-licensed activity is conducted by the origination companies onboarded to the platform, not by Homium directly.
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:10px">About</div>
        <div style="font-size:13px;color:var(--color-text);line-height:1.65;max-width:780px">
          Homium is the institutional infrastructure for affordable-housing finance. We power Down Payment Assistance programs end to end — borrower intake, originator workflow, investor capital, and program-level reporting — so program sponsors can serve more buyers with less operational drag.
        </div>
      </div>`;
  },

  _renderUsers() {
    // Strict @homium.io email filter — Homium internal staff only.
    return UsersView.render({ scope: 'admin-hub', homiumOnly: true });
  },
};


/* ============================================================
   Platform Operations View (User Management entry point)
   Thin shell — gates on sys_admin and delegates to PlatformRbacView,
   which owns the full Platform Operations Users surface (roster +
   per-entity permission matrix + audit log).
   ============================================================ */
const PlatformOpsView = {
  render(fullPath) {
    if (State.getRole() !== 'sys_admin') {
      return `
        <div class="page-header">
          <div class="page-header-inner">
            <div class="page-header-left">
              <div class="page-title">User Management</div>
              <div class="page-subtitle">Restricted area</div>
            </div>
          </div>
        </div>
        <div class="page-body">
          ${renderStubContent('🔒', 'Restricted',
            'User Management is available to System Admins only. Contact your System Admin to request access.')}
        </div>`;
    }
    return PlatformRbacView.render(fullPath || '/user-management');
  },
};


/* ============================================================
   System Configuration View
   ============================================================ */
const SystemConfigView = {
  // Spec §1.1: Markets are system-defined geography units. Loan Programs
  // declare which Markets they CAN exist in (the platform-allowed LPM
  // matrix). OC- and Branch-level enablement happens elsewhere.
  TABS: [
    { key: 'markets',          label: 'Markets',          path: '/system-config/markets' },
    { key: 'loan-programs',    label: 'Loan Programs',    path: '/system-config' },
    { key: 'funds',            label: 'Funds',            path: '/system-config/funds' },
    { key: 'fees',             label: 'Fees',             path: '/system-config/fees' },
    { key: 'title-companies',  label: 'Title Companies',  path: '/system-config/title-companies' },
  ],

  _expandedProgramId: null,

  render(fullPath) {
    const tab = this._parseTab(fullPath || '/system-config');
    let content;
    switch (tab) {
      case 'markets':         content = this._renderMarkets(); break;
      case 'loan-programs':   content = this._renderLoanPrograms(); break;
      case 'funds':           content = this._renderFunds(); break;
      case 'fees':            content = renderStubContent('💰', 'Fee Configuration', 'Regulated fee structures with MISMO-level handling will be configured here.'); break;
      case 'title-companies': content = renderStubContent('🏢', 'Title Companies', 'Title company records and integrations will be managed here.'); break;
      default:                content = this._renderLoanPrograms();
    }
    return renderSectionShell(
      'System Configuration',
      'Markets, programs, funds, fees, and platform-wide settings',
      this.TABS, tab, content,
      { eyebrow: 'Administration' }
    );
  },

  _parseTab(path) {
    const sub = path.replace('/system-config', '').replace(/^\//, '');
    return sub || 'loan-programs';
  },

  _renderFunds() {
    const funds = State.getFunds();
    if (!funds.length) return renderStubContent('📊', 'No funds', 'Fund records will appear here.');
    const rows = funds.map(f => {
      const entity = State.getInvestorEntities().find(e => e.id === f.investorId);
      return `
        <tr class="${entity ? 'clickable' : ''}" ${entity ? `onclick="Router.navigate('/investors/${entity.id}')"` : ''}>
          <td class="cell-primary serif">${f.name}</td>
          <td class="text-secondary">${entity ? entity.name : '—'}</td>
          <td>${f.vintage}</td>
          <td class="text-secondary">${Display.currency(f.committed)}</td>
          <td class="text-secondary">${Display.currency(f.deployed)}</td>
          <td><span class="badge ${f.status === 'active' ? 'badge-active' : 'badge-pending'}">${f.status}</span></td>
        </tr>`;
    }).join('');
    return `
      <div class="table-container">
        <table class="entity-table">
          <thead><tr><th>Fund</th><th>Investor</th><th>Vintage</th><th>Committed</th><th>Deployed</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="table-footer"><span class="table-count">${funds.length} fund${funds.length === 1 ? '' : 's'}</span></div>
      </div>`;
  },

  _renderMarkets() {
    const markets = State.getMarkets();
    const lpms = State.getLPMs();
    const ocEnab = markets.map(m => {
      const lpmIdsForMkt = new Set(lpms.filter(l => l.marketId === m.id).map(l => l.id));
      const ocCount = State.getCompanies().reduce((acc, c) => {
        const has = State.getOcEnablement(c.id).some(id => lpmIdsForMkt.has(id));
        return acc + (has ? 1 : 0);
      }, 0);
      const programCount = State.getLoanPrograms().filter(p => p.allowedMarketIds?.includes(m.id)).length;
      return { m, ocCount, programCount };
    });
    const rows = ocEnab.map(({ m, ocCount, programCount }) => `
      <tr>
        <td><span style="color:var(--color-text-muted);margin-right:6px" title="System-defined market — locked">🔒</span><strong>${m.code}</strong></td>
        <td>${m.name}</td>
        <td><span class="tag" style="text-transform:capitalize">${m.kind}</span></td>
        <td><span class="badge ${m.supported ? 'badge-active' : 'badge-pending'}">${m.supported ? 'Supported' : 'Not Live'}</span></td>
        <td>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
            <input type="checkbox" ${m.comingSoon ? 'checked' : ''} onchange="State.setMarketComingSoon('${m.id}', this.checked);App.renderView(Router.getCurrentPath())">
            Coming Soon
          </label>
        </td>
        <td>${ocCount}</td>
        <td>${programCount}</td>
      </tr>`).join('');
    return `
      <div class="table-container">
        <div class="filter-toolbar">
          <div style="font-size:12px;color:var(--color-text-muted)">
            Markets are system-defined and cannot be deleted. Use <strong>Coming Soon</strong> to flag a market that is in pipeline but not yet live.
          </div>
        </div>
        <table>
          <thead><tr>
            <th>Code</th><th>Market</th><th>Kind</th><th>Supported</th><th>Coming Soon</th><th>OCs Enabled</th><th>Programs</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="table-footer"><span class="table-count">${markets.length} markets</span></div>
      </div>`;
  },

  _renderLoanPrograms() {
    const programs = State.getLoanPrograms();
    const markets = State.getMarkets();
    const lpms = State.getLPMs();

    const rows = programs.map((p, idx) => {
      const allowedMarkets = (p.allowedMarketIds || []).map(id => State.getMarket(id)).filter(Boolean);
      const lpmsForProgram = lpms.filter(l => l.programId === p.id);
      const ocCount = State.getCompanies().reduce((acc, c) => {
        const lpmIdSet = new Set(lpmsForProgram.map(l => l.id));
        const has = State.getOcEnablement(c.id).some(id => lpmIdSet.has(id));
        return acc + (has ? 1 : 0);
      }, 0);
      return `
        <tr>
          <td>${String(idx + 1).padStart(2, '0')}</td>
          <td><span class="badge badge-active">${p.status === 'active' ? 'Active' : p.status}</span></td>
          <td class="cell-primary">${p.name}</td>
          <td>${p.code}</td>
          <td class="text-secondary">${p.token}</td>
          <td>${allowedMarkets.map(m => `<span class="tag" style="margin-right:4px">${m.code}</span>`).join('') || '<span class="text-muted">—</span>'}</td>
          <td>${ocCount}</td>
          <td>
            <button class="btn btn-ghost btn-xs" onclick="SystemConfigView.toggleProgramEditor('${p.id}')">Configure Markets</button>
          </td>
        </tr>
        ${this._expandedProgramId === p.id ? `
        <tr><td colspan="8" style="background:var(--color-surface);padding:14px 18px">
          <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:8px"><strong>${p.name}</strong> — Pick which Markets this program can exist in. Cells the platform allows here become available for OC-level enablement.</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px">
            ${markets.map(m => `
              <label style="display:inline-flex;align-items:center;gap:6px;font-size:13px;padding:5px 10px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-card);cursor:pointer">
                <input type="checkbox" ${(p.allowedMarketIds || []).includes(m.id) ? 'checked' : ''} ${!m.supported ? 'disabled' : ''}
                       onchange="SystemConfigView._toggleProgramMarket('${p.id}', '${m.id}', this.checked)">
                <span>${m.code}</span><span style="color:var(--color-text-muted)">${m.name}</span>${!m.supported ? '<span class="tag" style="margin-left:4px;font-size:10px">soon</span>' : ''}
              </label>`).join('')}
          </div>
        </td></tr>` : ''}`;
    }).join('');

    return `
      <div class="table-container">
        <div class="table-toolbar" style="justify-content:flex-end">
          <button class="btn btn-primary btn-sm" onclick="SystemConfigView.openAddProgramModal()">+ Add New Loan Program</button>
        </div>
        <table>
          <thead><tr>
            <th>ID</th><th>Status</th><th>Program Name</th><th>Code</th><th>Token</th><th>Allowed Markets</th><th>OCs</th><th>Actions</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="table-footer"><span class="table-count">${programs.length} programs</span></div>
      </div>
      <div id="loan-program-modal-container"></div>`;
  },

  toggleProgramEditor(programId) {
    this._expandedProgramId = this._expandedProgramId === programId ? null : programId;
    App.renderView(Router.getCurrentPath());
  },

  _toggleProgramMarket(programId, marketId, on) {
    const p = State.getLoanProgram(programId);
    if (!p) return;
    const next = new Set(p.allowedMarketIds || []);
    if (on) next.add(marketId); else next.delete(marketId);
    State.updateLoanProgramMarkets(programId, [...next]);
    App.renderView(Router.getCurrentPath());
  },

  openAddProgramModal() {
    const markets = State.getMarkets().filter(m => m.supported);
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)SystemConfigView.closeAddProgramModal()">
        <div class="modal" style="max-width:520px">
          <div class="modal-header">
            <div><div class="modal-title">New Loan Program</div></div>
            <button class="modal-close" onclick="SystemConfigView.closeAddProgramModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full"><label>Program Name</label><input id="lp-name" class="input" placeholder="e.g. Texas Equity Pilot"></div>
              <div class="form-group"><label>Code</label><input id="lp-code" class="input" placeholder="TX"></div>
              <div class="form-group"><label>Token</label><input id="lp-token" class="input" value="HOM"></div>
              <div class="form-group form-full">
                <label>Allowed Markets</label>
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
                  ${markets.map(m => `
                    <label style="display:inline-flex;align-items:center;gap:5px;font-size:13px;padding:4px 9px;border:1px solid var(--color-border);border-radius:5px;cursor:pointer">
                      <input type="checkbox" data-market-id="${m.id}" class="lp-mkt-pick"> ${m.code}
                    </label>`).join('')}
                </div>
                <div class="form-hint">Pick the markets where this program can exist. OCs can later enable any subset.</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="SystemConfigView.closeAddProgramModal()">Cancel</button>
            <button class="btn btn-primary" onclick="SystemConfigView.submitAddProgram()">Create Program</button>
          </div>
        </div>
      </div>`;
    const c = document.getElementById('loan-program-modal-container');
    if (c) c.innerHTML = html;
  },

  closeAddProgramModal() {
    const c = document.getElementById('loan-program-modal-container');
    if (c) c.innerHTML = '';
  },

  submitAddProgram() {
    const name = document.getElementById('lp-name')?.value?.trim();
    const code = document.getElementById('lp-code')?.value?.trim();
    const token = document.getElementById('lp-token')?.value?.trim() || 'HOM';
    const markets = [...document.querySelectorAll('.lp-mkt-pick:checked')].map(el => el.getAttribute('data-market-id'));
    if (!name || !code) { alert('Name and Code are required.'); return; }
    State.addLoanProgram({ name, code, token, allowedMarketIds: markets });
    this.closeAddProgramModal();
    App.renderView(Router.getCurrentPath());
  },
};
