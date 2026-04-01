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
  TABS: [
    { key: 'users',       label: 'Users',       path: '/platform' },
    { key: 'permissions', label: 'Permissions', path: '/platform/permissions' },
  ],

  render(fullPath) {
    const tab = this._parseTab(fullPath || '/platform');

    const tabsHtml = this.TABS.map(t =>
      `<div class="section-tab ${t.key === tab ? 'active' : ''}"
            onclick="Router.navigate('${t.path}')">${t.label}</div>`
    ).join('');

    // UsersView and PermissionsView return full HTML with their own page-header,
    // so we only wrap with section-tabs (no extra page-header from shell)
    let content;
    switch (tab) {
      case 'users':       content = UsersView.render({ platformOnly: true }); break;
      case 'permissions': content = PermissionsView.render({ roles: ['sys_admin', 'operator'] }); break;
      default:            content = UsersView.render({ platformOnly: true });
    }

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
  TABS: [
    { key: 'loan-programs',    label: 'Loan Programs',    path: '/system-config' },
    { key: 'fees',             label: 'Fees',             path: '/system-config/fees' },
    { key: 'title-companies',  label: 'Title Companies',  path: '/system-config/title-companies' },
  ],

  render(fullPath) {
    const tab = this._parseTab(fullPath || '/system-config');
    let content;
    switch (tab) {
      case 'loan-programs':   content = this._renderLoanPrograms(); break;
      case 'fees':            content = renderStubContent('💰', 'Fee Configuration', 'Regulated fee structures with MISMO-level handling will be configured here.'); break;
      case 'title-companies': content = renderStubContent('🏢', 'Title Companies', 'Title company records and integrations will be managed here.'); break;
      default:                content = this._renderLoanPrograms();
    }
    return renderSectionShell('System Configuration', 'Loan programs, fees, and platform-wide settings', this.TABS, tab, content);
  },

  _parseTab(path) {
    const sub = path.replace('/system-config', '').replace(/^\//, '');
    return sub || 'loan-programs';
  },

  _renderLoanPrograms() {
    return `
      <div class="table-container">
        <div class="table-toolbar" style="justify-content:flex-end">
          <button class="btn btn-primary btn-sm" disabled>+ Add New Loan Program</button>
        </div>
        <table>
          <thead><tr>
            <th>ID</th><th>Status</th><th>Program Name</th><th>Program Code</th><th>Legal Entity</th><th>Token</th><th>Enabled Markets</th><th>Actions</th>
          </tr></thead>
          <tbody>
            <tr>
              <td>01</td>
              <td><span class="badge badge-active">Active</span></td>
              <td class="cell-primary">Utah Dream Fund</td>
              <td>UD</td>
              <td class="text-secondary">—</td>
              <td class="text-secondary">HK</td>
              <td class="text-secondary">UT</td>
              <td class="text-secondary">—</td>
            </tr>
            <tr>
              <td>02</td>
              <td><span class="badge badge-active">Active</span></td>
              <td class="cell-primary">DC Dream Fund</td>
              <td>TH</td>
              <td class="text-secondary">—</td>
              <td class="text-secondary">HOM</td>
              <td class="text-secondary">DC</td>
              <td class="text-secondary">—</td>
            </tr>
            <tr>
              <td>03</td>
              <td><span class="badge badge-active">Active</span></td>
              <td class="cell-primary">Kentucky Dream Fund</td>
              <td>KY</td>
              <td class="text-secondary">—</td>
              <td class="text-secondary">HOM</td>
              <td class="text-secondary">KY</td>
              <td class="text-secondary">—</td>
            </tr>
          </tbody>
        </table>
        <div class="table-footer"><span class="table-count">3 programs</span></div>
      </div>`;
  },
};
