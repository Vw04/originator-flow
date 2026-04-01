/* ============================================================
   HOMIUM ORIGINATOR FLOW — Origination Companies Section
   Wrapper with company list + drill-down detail view
   ============================================================ */

const OriginationCompaniesView = {
  _selectedCompanyId: null,
  _activeTab: 'overview',

  render(fullPath) {
    const path = fullPath || '/origination-companies';
    const role = State.getRole();
    const currentUser = State.getCurrentUser();

    // Parse company ID from path: /origination-companies/co-001
    const segments = path.replace('/origination-companies', '').split('/').filter(Boolean);
    const companyId = segments[0] || null;

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
    this._activeTab = 'overview';
    return this._renderList();
  },

  /* ---- Company List (reuses CompaniesView) ---- */
  _renderList() {
    CompaniesView._clickMode = 'navigate';
    const html = CompaniesView.render();
    CompaniesView._clickMode = 'panel';
    return html;
  },

  /* ---- Company Detail with sub-tabs ---- */
  _renderDetail(companyId) {
    const c = State.getCompany(companyId);
    if (!c) return '<div class="page-body"><p>Company not found.</p></div>';

    const role = State.getRole();
    const canEdit = State.can('manageCompany') || State.can('editAny');
    const showBack = role !== 'prog_admin'; // prog_admin has no list to go back to

    const tabs = [
      { key: 'overview',    label: 'Overview' },
      { key: 'branches',    label: 'Branches' },
      { key: 'users',       label: 'Users' },
      { key: 'permissions', label: 'Permissions' },
    ];

    const tabsHtml = tabs.map(t =>
      `<div class="section-tab ${t.key === this._activeTab ? 'active' : ''}"
            onclick="OriginationCompaniesView.switchTab('${t.key}')">${t.label}</div>`
    ).join('');

    let content;
    switch (this._activeTab) {
      case 'overview':    content = this._renderOverview(c, canEdit); break;
      case 'branches':    content = BranchesView.render({ companyId }); break;
      case 'users':       content = UsersView.render({ companyId, roles: ['prog_admin', 'lo', 'lp'] }); break;
      case 'permissions': content = PermissionsView.render({ roles: ['prog_admin', 'lo', 'lp'], companyId }); break;
      default:            content = this._renderOverview(c, canEdit);
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
            <div class="page-subtitle">NMLS ${c.nmlsId} · ${c.emailDomain}</div>
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

  /* ---- Overview tab ---- */
  _renderOverview(c, canEdit) {
    const branches = State.getBranchesByCompany(c.id);
    const users = State.getUsersByCompany(c.id);
    const activeUsers = users.filter(u => u.onboardingStatus === 'active').length;
    const pendingUsers = users.filter(u => !['active', 'suspended'].includes(u.onboardingStatus)).length;

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card">
          <div class="card-title" style="margin-bottom:14px">Company Details</div>
          <div class="info-grid">
            <div class="info-row"><div class="info-label">Status</div><div class="info-value"><span class="badge ${c.status === 'active' ? 'badge-active' : 'badge-pending'}">${c.status === 'active' ? 'Active' : 'Pending Setup'}</span></div></div>
            <div class="info-row"><div class="info-label">NMLS ID</div><div class="info-value">${c.nmlsId}</div></div>
            <div class="info-row"><div class="info-label">State</div><div class="info-value">${c.stateOfIncorporation}</div></div>
            <div class="info-row"><div class="info-label">Primary Contact</div><div class="info-value">${c.primaryContact}</div></div>
            <div class="info-row"><div class="info-label">Email Domain</div><div class="info-value">${c.emailDomain}</div></div>
            <div class="info-row"><div class="info-label">Programs</div><div class="info-value">${c.programs.length ? c.programs.join(', ') : 'None'}</div></div>
            <div class="info-row"><div class="info-label">Created</div><div class="info-value">${Display.date(c.createdAt)}</div></div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="card">
            <div class="card-title" style="margin-bottom:14px">At a Glance</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center">
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
                <div style="font-size:11px;color:var(--color-text-secondary)">Pending Onboarding</div>
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

      <div class="card">
        <div class="card-title" style="margin-bottom:14px">Branches</div>
        <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden">
          <table>
            <thead><tr><th>Branch</th><th>State</th><th>Users</th><th>Status</th></tr></thead>
            <tbody>
              ${branches.map(b => `
                <tr class="clickable" onclick="BranchesView.openDetail('${b.id}')">
                  <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address}</div></td>
                  <td>${b.state}</td>
                  <td>${b.userCount}</td>
                  <td><span class="badge ${b.status === 'active' ? 'badge-active' : 'badge-pending'}">${b.status}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  switchTab(tab) {
    this._activeTab = tab;
    App.renderView(Router.getCurrentPath());
  },
};
