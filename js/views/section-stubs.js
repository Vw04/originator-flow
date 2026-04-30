/* ============================================================
   HOMIUM ORIGINATOR FLOW — Section Stub Views
   Investors & Funds, Platform Operations, System Configuration
   ============================================================ */

/* ---- Shared section shell helper ---- */
function renderSectionShell(title, subtitle, tabs, activeTab, content) {
  const tabsHtml = tabs.map(t =>
    `<div class="section-tab ${t.key === activeTab ? 'active' : ''}"
          onclick="Router.navigate('${t.path}')">${t.label}</div>`
  ).join('');

  return `
    <div class="page-header">
      <div class="page-header-inner">
        <div class="page-header-left">
          <div class="page-title">${title}</div>
          <div class="page-subtitle">${subtitle}</div>
        </div>
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
   Investors & Funds View
   ============================================================ */
const InvestorsView = {
  TABS: [
    { key: 'entities',    label: 'Entities',    path: '/investors' },
    { key: 'funds',       label: 'Funds',       path: '/investors/funds' },
    { key: 'users',       label: 'Users',       path: '/investors/users' },
    { key: 'permissions', label: 'Permissions', path: '/investors/permissions' },
  ],

  render(fullPath) {
    const tab = this._parseTab(fullPath || '/investors');
    let content;
    switch (tab) {
      case 'entities':    content = this._renderEntities(); break;
      case 'funds':       content = this._renderFunds(); break;
      case 'users':       content = this._renderUsers(); break;
      case 'permissions': content = this._renderPermissions(); break;
      default:            content = this._renderEntities();
    }
    return renderSectionShell('Investors & Funds', 'Investor entities, fund records, and KYC data', this.TABS, tab, content);
  },

  _parseTab(path) {
    const sub = path.replace('/investors', '').replace(/^\//, '');
    return sub || 'entities';
  },

  _renderEntities() {
    const entities = State.getInvestorEntities();
    if (!entities.length) return renderStubContent('🏦', 'No investor entities', 'Investor entities will appear here once created.');
    const rows = entities.map(e => `
      <tr>
        <td><div class="cell-primary">${e.name}</div></td>
        <td>${e.type}</td>
        <td><span class="badge ${e.status === 'active' ? 'badge-active' : 'badge-pending'}">${e.status}</span></td>
        <td class="text-secondary">${Display.currency(e.aum)}</td>
        <td class="text-secondary">${e.contactName}</td>
        <td class="text-secondary">${Display.date(e.createdAt)}</td>
      </tr>`).join('');
    return `
      <div class="table-container">
        <table>
          <thead><tr><th>Entity Name</th><th>Type</th><th>Status</th><th>AUM</th><th>Contact</th><th>Created</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="table-footer"><span class="table-count">${entities.length} entities</span></div>
      </div>`;
  },

  _renderFunds() {
    const funds = State.getFunds();
    if (!funds.length) return renderStubContent('📊', 'No funds', 'Fund records will appear here.');
    const rows = funds.map(f => {
      const entity = State.getInvestorEntities().find(e => e.id === f.investorId);
      return `
        <tr>
          <td><div class="cell-primary">${f.name}</div></td>
          <td class="text-secondary">${entity ? entity.name : '—'}</td>
          <td>${f.vintage}</td>
          <td class="text-secondary">${Display.currency(f.committed)}</td>
          <td class="text-secondary">${Display.currency(f.deployed)}</td>
          <td><span class="badge ${f.status === 'active' ? 'badge-active' : 'badge-pending'}">${f.status}</span></td>
        </tr>`;
    }).join('');
    return `
      <div class="table-container">
        <table>
          <thead><tr><th>Fund Name</th><th>Investor</th><th>Vintage</th><th>Committed</th><th>Deployed</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="table-footer"><span class="table-count">${funds.length} funds</span></div>
      </div>`;
  },

  _renderUsers() {
    const users = State.getInvestorUsers();
    if (!users.length) return renderStubContent('👤', 'No investor users', 'Investor users will appear here.');
    const rows = users.map(u => `
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
        <td><span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
        <td class="text-secondary">${u.lastLogin ? Display.date(u.lastLogin) : '<span class="text-muted">Never</span>'}</td>
      </tr>`).join('');
    return `
      <div class="table-container">
        <table>
          <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last Login</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="table-footer"><span class="table-count">${users.length} users</span></div>
      </div>`;
  },

  _renderPermissions() {
    return renderStubContent('🔒', 'Investor Permissions', 'Permission policies for investor roles will be configured here.');
  },
};


/* ============================================================
   Platform Operations View
   ============================================================ */
const PlatformOpsView = {
  // Spec v1.2: legacy Permissions tab dropped. RBAC v1.2 is configured
  // per-OC under /origination-companies/:id → Access (OCAccessView) and
  // per-user on the Profile screen. This section now hosts platform-side
  // user management only.
  TABS: [
    { key: 'users', label: 'Users', path: '/platform' },
  ],

  render(fullPath) {
    const tab = this._parseTab(fullPath || '/platform');

    const tabsHtml = this.TABS.map(t =>
      `<div class="section-tab ${t.key === tab ? 'active' : ''}"
            onclick="Router.navigate('${t.path}')">${t.label}</div>`
    ).join('');

    const content = UsersView.render({ platformOnly: true });

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Platform Operations</div>
            <div class="page-subtitle">Internal platform users and system configuration</div>
          </div>
        </div>
      </div>
      <div class="section-tabs">${tabsHtml}</div>
      <div class="page-body">${content}</div>`;
  },

  _parseTab(path) {
    const sub = path.replace('/platform', '').replace(/^\//, '');
    return sub || 'users';
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
      case 'fees':            content = renderStubContent('💰', 'Fee Configuration', 'Regulated fee structures with MISMO-level handling will be configured here.'); break;
      case 'title-companies': content = renderStubContent('🏢', 'Title Companies', 'Title company records and integrations will be managed here.'); break;
      default:                content = this._renderLoanPrograms();
    }
    return renderSectionShell('System Configuration', 'Markets, loan programs, fees, and platform-wide settings', this.TABS, tab, content);
  },

  _parseTab(path) {
    const sub = path.replace('/system-config', '').replace(/^\//, '');
    return sub || 'loan-programs';
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
          <td>${lpmsForProgram.length}</td>
          <td>${ocCount}</td>
          <td>
            <button class="btn btn-ghost btn-xs" onclick="SystemConfigView.toggleProgramEditor('${p.id}')">Configure Markets</button>
          </td>
        </tr>
        ${this._expandedProgramId === p.id ? `
        <tr><td colspan="9" style="background:var(--color-surface);padding:14px 18px">
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
            <th>ID</th><th>Status</th><th>Program Name</th><th>Code</th><th>Token</th><th>Allowed Markets</th><th>LPMs</th><th>OCs</th><th>Actions</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="table-footer"><span class="table-count">${programs.length} programs</span></div>
        <div id="loan-program-modal-container"></div>
      </div>`;
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
      <div class="modal-overlay" onclick="SystemConfigView.closeAddProgramModal()"></div>
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
                  <label style="display:inline-flex;align-items:center;gap:5px;font-size:13px;padding:4px 9px;border:1px solid var(--color-border);border-radius:5px">
                    <input type="checkbox" data-market-id="${m.id}" class="lp-mkt-pick"> ${m.code}
                  </label>`).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="SystemConfigView.closeAddProgramModal()">Cancel</button>
          <button class="btn btn-primary" onclick="SystemConfigView.submitAddProgram()">Create Program</button>
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
