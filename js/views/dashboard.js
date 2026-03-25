/* ============================================================
   HOMIUM ORIGINATOR FLOW — Dashboard View (role-adaptive)
   ============================================================ */

const DashboardView = {
  _filters: [],  // [{type, value}] — multi-filter chips for admin dashboard

  render() {
    const role = State.getRole();
    switch (role) {
      case 'sys_admin':
      case 'operator':
        return this.renderAdminDashboard();
      case 'prog_admin':
        return this.renderProgAdminDashboard();
      case 'lo':
      case 'lp':
        return this.renderOriginatorDashboard();
      case 'investor':
        return this.renderInvestorDashboard();
      default:
        return '<div class="page-body">Unknown role.</div>';
    }
  },

  /* ---- Multi-filter helpers ---- */
  addFilter(type, value) {
    if (!value) return;
    if (!this._filters.find(f => f.type === type && f.value === value)) {
      this._filters.push({ type, value });
    }
    App.renderView('/dashboard');
  },

  removeFilter(idx) {
    this._filters.splice(idx, 1);
    App.renderView('/dashboard');
  },

  clearFilters() {
    this._filters = [];
    App.renderView('/dashboard');
  },

  _applyFilters(users) {
    return this._filters.reduce((list, f) => {
      if (f.type === 'company')  return list.filter(u => u.companyId === f.value);
      if (f.type === 'status')   return list.filter(u => u.onboardingStatus === f.value);
      if (f.type === 'role')     return list.filter(u => u.role === f.value);
      if (f.type === 'program') {
        const coIds = State.getCompanies().filter(c => c.programs.includes(f.value)).map(c => c.id);
        return list.filter(u => coIds.includes(u.companyId));
      }
      return list;
    }, users);
  },

  _renderFilterBar(companies) {
    const chips = this._filters.map((f, i) => {
      let label = '';
      if (f.type === 'company') label = `Org: ${companies.find(c=>c.id===f.value)?.name || f.value}`;
      if (f.type === 'status')  label = `Status: ${Display.onboardingStatusLabel(f.value)}`;
      if (f.type === 'role')    label = `Role: ${Display.roleName(f.value)}`;
      if (f.type === 'program') label = `Program: ${f.value}`;
      return `<span class="filter-chip">${label}<button class="filter-chip-remove" onclick="DashboardView.removeFilter(${i})">×</button></span>`;
    }).join('');

    return `
      <div class="filter-chip-bar">
        ${chips}
        <div style="position:relative;display:inline-block">
          <button class="btn-add-filter" onclick="DashboardView.toggleFilterDropdown(event)">+ Add Filter</button>
          <div class="filter-dropdown" id="dash-filter-dd" style="display:none;top:100%;right:0;left:auto">
            <div class="filter-dropdown-section" style="font-size:10px;font-weight:700;color:var(--color-text-muted);padding:6px 12px 2px;text-transform:uppercase;letter-spacing:0.06em">Organization</div>
            ${companies.map(c => `<div class="filter-dropdown-item" onclick="DashboardView.addFilter('company','${c.id}')">${c.name}</div>`).join('')}
            <div class="filter-dropdown-section" style="font-size:10px;font-weight:700;color:var(--color-text-muted);padding:6px 12px 2px;text-transform:uppercase;letter-spacing:0.06em">Program</div>
            ${['DC Dream Fund','Kentucky Dream Fund'].map(p =>
              `<div class="filter-dropdown-item" onclick="DashboardView.addFilter('program','${p}')">${p}</div>`
            ).join('')}
            <div class="filter-dropdown-section" style="font-size:10px;font-weight:700;color:var(--color-text-muted);padding:6px 12px 2px;text-transform:uppercase;letter-spacing:0.06em">Status</div>
            ${['invited','email_verified','2fa_complete','verification_pending'].map(s =>
              `<div class="filter-dropdown-item" onclick="DashboardView.addFilter('status','${s}')">${Display.onboardingStatusLabel(s)}</div>`
            ).join('')}
            <div class="filter-dropdown-section" style="font-size:10px;font-weight:700;color:var(--color-text-muted);padding:6px 12px 2px;text-transform:uppercase;letter-spacing:0.06em">Role</div>
            ${['lo','lp','prog_admin'].map(r =>
              `<div class="filter-dropdown-item" onclick="DashboardView.addFilter('role','${r}')">${Display.roleName(r)}</div>`
            ).join('')}
          </div>
        </div>
        ${this._filters.length ? `<button class="btn btn-ghost btn-sm" onclick="DashboardView.clearFilters()">Clear all</button>` : ''}
      </div>`;
  },

  toggleFilterDropdown(e) {
    e.stopPropagation();
    const dd = document.getElementById('dash-filter-dd');
    if (!dd) return;
    const isOpen = dd.style.display !== 'none';
    // Close any open dropdowns first
    document.querySelectorAll('.filter-dropdown').forEach(d => d.style.display = 'none');
    if (!isOpen) {
      dd.style.display = 'block';
      setTimeout(() => document.addEventListener('click', () => { dd.style.display = 'none'; }, { once: true }), 0);
    }
  },

  /* ---- System Admin / Operator Dashboard ---- */
  renderAdminDashboard() {
    const companies  = State.getCompanies();
    const branches   = State.getBranches();
    const users      = State.getUsers();
    const loans      = State.getLoans();
    const pending    = users.filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus));
    const activity   = State.getActivity();

    const filteredPending = this._applyFilters(pending);

    const stats = [
      { label: 'Active Loans',  value: loans.filter(l => !['prequalification_expired','prequalification_in_progress'].includes(l.status)).length, change: `${loans.filter(l=>l.status==='completed').length} completed` },
      { label: 'Total Users',   value: users.filter(u => u.companyId).length,                change: `${pending.length} pending` },
      { label: 'Branches',      value: branches.length,                                      change: '' },
      { label: 'Organizations', value: companies.length,                                     change: '' },
    ];

    const statCards = stats.map(s => `
      <div class="stat-card">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
        ${s.change ? `<div class="stat-change neutral">${s.change}</div>` : ''}
      </div>`).join('');

    /* Pending onboarding table */
    const pendingRows = filteredPending.slice(0, 8).map(u => {
      const co = State.getCompany(u.companyId);
      return `
        <tr class="clickable" onclick="ProfileView.open('${u.id}')">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar avatar-sm" style="background:var(--color-primary-light)">${Display.initials(u)}</div>
              <div>
                <div class="cell-primary">${Display.fullName(u)}</div>
                <div class="cell-secondary">${u.email}</div>
              </div>
            </div>
          </td>
          <td><span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
          <td>${co ? co.name : '—'}</td>
          <td><span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
        </tr>`;
    }).join('');

    /* Activity feed */
    const activityItems = activity.slice(0, 8).map(a => {
      const actor = State.getUser(a.userId);
      const actorName = actor ? Display.fullName(actor) : 'System';
      const initials = actor ? Display.initials(actor) : 'SY';
      return `
        <div class="activity-item">
          <div class="activity-avatar">${initials}</div>
          <div class="activity-content">
            <strong>${actorName}</strong> ${a.action} <strong>${a.subject}</strong>
          </div>
          <div class="activity-time">${a.time}</div>
        </div>`;
    }).join('');

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">Dashboard</div>
            <div class="page-subtitle">Platform overview · ${new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'})}</div>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/companies')">Add Organization</button>
          <button class="btn btn-primary btn-sm" onclick="UsersView.openInviteModal()">Invite User</button>
        </div>
      </div>

      <div class="page-body">
        <div class="stat-grid">${statCards}</div>

        <div style="display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start">

          <!-- Pending onboarding -->
          <div class="table-container">
            <div class="table-toolbar" style="position:relative">
              <div class="table-toolbar-title">Pending Onboarding</div>
              <div style="display:flex;align-items:center;gap:8px;margin-left:auto">
                ${this._filters.map((f, i) => {
                  let label = '';
                  if (f.type === 'company') label = `Org: ${companies.find(c=>c.id===f.value)?.name || f.value}`;
                  if (f.type === 'status')  label = `Status: ${Display.onboardingStatusLabel(f.value)}`;
                  if (f.type === 'role')    label = `Role: ${Display.roleName(f.value)}`;
                  if (f.type === 'program') label = `Program: ${f.value}`;
                  return `<span class="filter-chip">${label}<button class="filter-chip-remove" onclick="DashboardView.removeFilter(${i})">×</button></span>`;
                }).join('')}
                <div style="position:relative">
                  <button class="btn btn-secondary btn-sm" onclick="DashboardView.toggleFilterDropdown(event)">Filter</button>
                  <div class="filter-dropdown" id="dash-filter-dd" style="display:none;top:100%;right:0;margin-top:4px">
                    <div style="font-size:10px;font-weight:700;color:var(--color-text-muted);padding:6px 12px 2px;text-transform:uppercase;letter-spacing:0.06em">Organization</div>
                    ${companies.map(c => `<div class="filter-dropdown-item" onclick="DashboardView.addFilter('company','${c.id}')">${c.name}</div>`).join('')}
                    <div style="font-size:10px;font-weight:700;color:var(--color-text-muted);padding:6px 12px 2px;text-transform:uppercase;letter-spacing:0.06em">Program</div>
                    ${['DC Dream Fund','Kentucky Dream Fund'].map(p =>
                      `<div class="filter-dropdown-item" onclick="DashboardView.addFilter('program','${p}')">${p}</div>`
                    ).join('')}
                    <div style="font-size:10px;font-weight:700;color:var(--color-text-muted);padding:6px 12px 2px;text-transform:uppercase;letter-spacing:0.06em">Status</div>
                    ${['invited','email_verified','2fa_complete','verification_pending'].map(s =>
                      `<div class="filter-dropdown-item" onclick="DashboardView.addFilter('status','${s}')">${Display.onboardingStatusLabel(s)}</div>`
                    ).join('')}
                    <div style="font-size:10px;font-weight:700;color:var(--color-text-muted);padding:6px 12px 2px;text-transform:uppercase;letter-spacing:0.06em">Role</div>
                    ${['lo','lp','prog_admin'].map(r =>
                      `<div class="filter-dropdown-item" onclick="DashboardView.addFilter('role','${r}')">${Display.roleName(r)}</div>`
                    ).join('')}
                  </div>
                </div>
                ${this._filters.length ? `<button class="btn btn-ghost btn-sm" onclick="DashboardView.clearFilters()">Clear</button>` : ''}
                <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/onboarding')">View all</button>
              </div>
            </div>
            ${filteredPending.length ? `
            <table>
              <thead><tr>
                <th>User</th><th>Role</th><th>Organization</th><th>Status</th>
              </tr></thead>
              <tbody>${pendingRows}</tbody>
            </table>
            <div class="table-footer">
              <span class="table-count">${filteredPending.length} of ${pending.length} user${pending.length !== 1 ? 's' : ''} pending</span>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/onboarding')">Manage onboarding</button>
            </div>` : `
            <div class="table-empty">
              <div class="table-empty-icon"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="18" cy="18" r="15"/><path d="M12 18l4 4 8-8"/></svg></div>
              <p>${this._filters.length ? 'No users match the current filters.' : 'All users are fully onboarded!'}</p>
              ${this._filters.length ? `<button class="btn btn-secondary btn-sm" onclick="DashboardView.clearFilters()">Clear filters</button>` : ''}
            </div>`}
          </div>

          <!-- Activity feed -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Recent Activity</div>
                <div class="card-subtitle">Platform events</div>
              </div>
            </div>
            <div class="activity-feed">${activityItems}</div>
          </div>

        </div>

        <!-- Org summary -->
        <div style="margin-top:20px" class="table-container">
          <div class="table-toolbar">
            <div class="table-toolbar-title">Organizations</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/companies')">View all</button>
          </div>
          <table>
            <thead><tr>
              <th>Organization</th><th>NMLS ID</th><th>Branches</th><th>Users</th><th>Programs</th><th>Status</th>
            </tr></thead>
            <tbody>
              ${State.getCompanies().map(c => `
                <tr class="clickable" onclick="Router.navigate('/companies')">
                  <td><div class="cell-primary">${c.name}</div><div class="cell-secondary">${c.emailDomain}</div></td>
                  <td class="text-secondary">${c.nmlsId}</td>
                  <td>${c.branchCount}</td>
                  <td>${c.userCount}</td>
                  <td>${c.programs.length ? c.programs.map(p => `<span class="tag">${p}</span>`).join(' ') : '<span class="text-muted">—</span>'}</td>
                  <td><span class="status-pill ${c.status === 'active' ? 'badge-active' : 'badge-pending'}"><span class="status-dot"></span>${c.status === 'active' ? 'Active' : 'Pending'}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  /* ---- Program Admin Dashboard ---- */
  renderProgAdminDashboard() {
    const currentUser = State.getCurrentUser();
    const companyId   = currentUser?.companyId;
    const company     = State.getCompany(companyId);
    const branches    = State.getBranchesByCompany(companyId);
    const users       = State.getUsersByCompany(companyId);
    const loans       = State.getLoans().filter(l => l.companyId === companyId);
    const pending     = users.filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus));

    const stats = [
      { label: 'Branches',         value: branches.length,                   bg: '#DCFCE7' },
      { label: 'Users',            value: users.length,                      bg: '#DBEAFE' },
      { label: 'Pending Onboarding', value: pending.length,                  bg: '#FEF3C7' },
      { label: 'Active Loans',     value: loans.filter(l => !['prequalification_expired','prequalification_in_progress'].includes(l.status)).length, bg: '#EDE9FE' },
    ];

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">Dashboard</div>
            <div class="page-subtitle">${company ? company.name : 'My Company'}</div>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm" onclick="UsersView.openInviteModal()">Invite User</button>
        </div>
      </div>

      <div class="page-body">
        <div class="stat-grid">
          ${stats.map(s => `
            <div class="stat-card">
              <div class="stat-label">${s.label}</div>
              <div class="stat-value">${s.value}</div>
            </div>`).join('')}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
          <div class="table-container">
            <div class="table-toolbar">
              <div class="table-toolbar-title">Team Members</div>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/users')">View all</button>
            </div>
            <table>
              <thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Status</th></tr></thead>
              <tbody>
                ${users.slice(0, 6).map(u => {
                  const br = State.getBranch(u.branchId);
                  return `
                    <tr class="clickable" onclick="ProfileView.open('${u.id}')">
                      <td>
                        <div style="display:flex;align-items:center;gap:8px">
                          <div class="avatar avatar-sm">${Display.initials(u)}</div>
                          <div class="cell-primary">${Display.fullName(u)}</div>
                        </div>
                      </td>
                      <td><span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
                      <td class="text-secondary">${br ? br.name : '—'}</td>
                      <td><span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="table-container">
            <div class="table-toolbar">
              <div class="table-toolbar-title">Branches</div>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/branches')">View all</button>
            </div>
            <table>
              <thead><tr><th>Branch</th><th>State</th><th>Users</th><th>Status</th></tr></thead>
              <tbody>
                ${branches.map(b => `
                  <tr class="clickable" onclick="BranchesView.openDetail('${b.id}')">
                    <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address}</div></td>
                    <td>${b.state}</td>
                    <td>${b.userCount}</td>
                    <td><span class="status-pill ${b.status==='active'?'badge-active':'badge-pending'}"><span class="status-dot"></span>${b.status==='active'?'Active':'Pending'}</span></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  /* ---- LO / LP Dashboard ---- */
  renderOriginatorDashboard() {
    const user     = State.getCurrentUser();
    const role     = State.getRole();
    const loans    = State.getLoansByLO(user?.id) || [];
    const branch   = State.getBranch(user?.branchId);
    const company  = State.getCompany(user?.companyId);

    const isActive = user?.onboardingStatus === 'active';

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">Dashboard</div>
            <div class="page-subtitle">${branch ? branch.name : ''} ${company ? '· ' + company.name : ''}</div>
          </div>
        </div>
        ${isActive ? `<div class="page-header-actions"><button class="btn btn-primary btn-sm" onclick="Router.navigate('/originations')">New Application</button></div>` : ''}
      </div>

      <div class="page-body">
        ${!isActive ? `
          <div class="alert alert-warning" style="margin-bottom:20px">
            <span class="alert-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1L1 14h14L8 1z"/><path d="M8 6v4M8 11v1"/></svg></span>
            <div>
              <strong>Account setup incomplete</strong><br>
              Your account is currently <strong>${Display.onboardingStatusLabel(user?.onboardingStatus)}</strong>.
              ${role === 'lo' && user?.onboardingStatus === 'verification_pending' ? 'SecuritizeID identity verification is required before you can submit applications.' : 'Complete your onboarding steps to activate your account.'}
              <button class="btn btn-sm" style="margin-top:8px;background:#D97706;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer" onclick="Router.navigate('/onboarding')">Continue Setup</button>
            </div>
          </div>` : ''}

        <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
          ${[
            { label: 'In Progress',  value: loans.filter(l => ['prequalification_in_progress','initial_application_submitted','pending_origination_creation'].includes(l.status)).length, color: '#2563EB' },
            { label: 'In Review',    value: loans.filter(l => ['sent_to_docutech','origination_created','application_documents_approved','original_appraisal_submitted'].includes(l.status)).length, color: '#D97706' },
            { label: 'Completed',    value: loans.filter(l => l.status === 'completed').length, color: '#16A34A' },
            { label: 'Expired',      value: loans.filter(l => l.status === 'prequalification_expired').length, color: '#94A3B8' },
          ].map(s => `
            <div class="stat-card">
              <div class="stat-label">${s.label}</div>
              <div class="stat-value" style="color:${s.color}">${s.value}</div>
            </div>`).join('')}
        </div>

        <div class="table-container">
          <div class="table-toolbar">
            <div class="table-toolbar-title">Recent Applications</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/originations')">View all</button>
          </div>
          ${loans.length ? `
            <table>
              <thead><tr><th>Application</th><th>Borrower</th><th>Amount</th><th>Program</th><th>Status</th><th>Submitted</th></tr></thead>
              <tbody>
                ${loans.map(l => `
                  <tr>
                    <td><span class="text-secondary" style="font-size:12px;font-weight:600">${l.id}</span></td>
                    <td><div class="cell-primary">${l.borrowerName}</div><div class="cell-secondary">${l.address}</div></td>
                    <td style="font-weight:600">${Display.currency(l.amount)}</td>
                    <td><span class="tag">${l.program}</span></td>
                    <td><span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span></td>
                    <td class="text-secondary">${Display.date(l.submittedAt)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>` : `
            <div class="table-empty">
              <div class="table-empty-icon"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><path d="M8 4h20l8 8v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M28 4v8h8M12 18h12M12 24h8"/></svg></div>
              <p>No applications yet. Start a new application to get going.</p>
            </div>`}
        </div>
      </div>`;
  },

  /* ---- Investor Dashboard ---- */
  renderInvestorDashboard() {
    return `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Investor Dashboard</div>
        </div>
      </div>

      <div class="page-body">
        <div class="alert alert-info">
          <span class="alert-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="7"/><path d="M8 7v5M8 5v1"/></svg></span>
          <div>Investor portfolio features are in development. Your KYC verification is <strong>complete</strong> via SecuritizeID.</div>
        </div>

        <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
          <div class="stat-card">
            <div class="stat-label">Portfolio Value</div>
            <div class="stat-value">$1.24M</div>
            <div class="stat-change up">+8.2% YTD</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active HEIs</div>
            <div class="stat-value">7</div>
            <div class="stat-change neutral">Across 2 markets</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg. LTV</div>
            <div class="stat-value">68%</div>
            <div class="stat-change neutral">Portfolio average</div>
          </div>
        </div>

        <div class="card" style="margin-top:20px">
          <div class="card-header">
            <div class="card-title">Portfolio Positions</div>
            <span class="badge badge-active">All Active</span>
          </div>
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>Property</th><th>Market</th><th>HEI Amount</th><th>LTV</th><th>Program</th><th>Status</th></tr></thead>
              <tbody>
                ${[
                  { address: '3407 Wisconsin Ave NW, Washington, DC', market: 'Washington DC', amount: 195000, ltv: 71, program: 'DC Dream Fund' },
                  { address: '1244 U St NW, Washington, DC',          market: 'Washington DC', amount: 220000, ltv: 64, program: 'DC Dream Fund' },
                  { address: '1025 Bardstown Rd, Louisville, KY',     market: 'Louisville',    amount: 160000, ltv: 67, program: 'Kentucky Dream Fund' },
                  { address: '633 E Main St, Lexington, KY',          market: 'Lexington',     amount: 145000, ltv: 72, program: 'Kentucky Dream Fund' },
                ].map(p => `
                  <tr>
                    <td><div class="cell-primary" style="font-size:12px">${p.address}</div></td>
                    <td>${p.market}</td>
                    <td style="font-weight:600">${Display.currency(p.amount)}</td>
                    <td>${p.ltv}%</td>
                    <td><span class="tag">${p.program}</span></td>
                    <td><span class="badge badge-active">Active</span></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },
};
