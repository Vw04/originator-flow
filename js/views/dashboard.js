/* ============================================================
   HOMIUM ORIGINATOR FLOW — Dashboard View (role-adaptive)
   ============================================================ */

const DashboardView = {

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

  /* ---- System Admin / Operator Dashboard ---- */
  renderAdminDashboard() {
    const companies  = State.getCompanies();
    const branches   = State.getBranches();
    const users      = State.getUsers();
    const loans      = State.getLoans();
    const pending    = users.filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus));
    const activity   = State.getActivity();

    const stats = [
      { label: 'Organizations', value: companies.length, icon: '🏢', bg: '#DBEAFE', change: '+1 this month' },
      { label: 'Branches',      value: branches.length,  icon: '📍', bg: '#DCFCE7', change: '+2 this month' },
      { label: 'Total Users',   value: users.filter(u => u.companyId).length, icon: '👥', bg: '#FEF3C7', change: `${pending.length} pending` },
      { label: 'Active Loans',  value: loans.filter(l => ['in_review','approved'].includes(l.status)).length, icon: '📄', bg: '#EDE9FE', change: `${loans.filter(l=>l.status==='funded').length} funded` },
    ];

    const statCards = stats.map(s => `
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-label">${s.label}</div>
          <div class="stat-icon" style="background:${s.bg}">${s.icon}</div>
        </div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-change neutral">${s.change}</div>
      </div>`).join('');

    /* Pending onboarding table */
    const pendingRows = pending.slice(0, 6).map(u => {
      const co = State.getCompany(u.companyId);
      return `
        <tr class="clickable" onclick="Router.navigate('/users')">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar avatar-sm" style="background:var(--color-primary-light)">${Display.initials(u)}</div>
              <div>
                <div class="cell-primary">${Display.fullName(u)}</div>
                <div class="cell-secondary">${u.email}</div>
              </div>
            </div>
          </td>
          <td><span class="role-badge ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
          <td>${co ? co.name : '—'}</td>
          <td><span class="badge ${Display.onboardingStatusClass(u.onboardingStatus)}">${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
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
            <div class="table-toolbar">
              <div class="table-toolbar-title">Pending Onboarding</div>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/onboarding')">View all →</button>
            </div>
            ${pending.length ? `
            <table>
              <thead><tr>
                <th>User</th><th>Role</th><th>Organization</th><th>Status</th>
              </tr></thead>
              <tbody>${pendingRows}</tbody>
            </table>
            <div class="table-footer">
              <span class="table-count">${pending.length} user${pending.length !== 1 ? 's' : ''} pending</span>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/onboarding')">Manage onboarding →</button>
            </div>` : `
            <div class="table-empty">
              <div class="table-empty-icon">🎉</div>
              <p>All users are fully onboarded!</p>
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
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/companies')">View all →</button>
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
                  <td><span class="badge ${c.status === 'active' ? 'badge-active' : 'badge-pending'}">${c.status === 'active' ? 'Active' : 'Pending'}</span></td>
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
    const loans       = State.getLoansByCompany ? State.getLoans().filter(l => l.companyId === companyId) : [];
    const pending     = users.filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus));

    const stats = [
      { label: 'Branches',    value: branches.length, icon: '📍', bg: '#DCFCE7' },
      { label: 'Users',       value: users.length,    icon: '👥', bg: '#DBEAFE' },
      { label: 'Pending Onboarding', value: pending.length, icon: '⏳', bg: '#FEF3C7' },
      { label: 'Active Loans',  value: loans.filter(l => ['in_review','approved'].includes(l.status)).length, icon: '📄', bg: '#EDE9FE' },
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
              <div class="stat-card-header">
                <div class="stat-label">${s.label}</div>
                <div class="stat-icon" style="background:${s.bg}">${s.icon}</div>
              </div>
              <div class="stat-value">${s.value}</div>
            </div>`).join('')}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
          <div class="table-container">
            <div class="table-toolbar">
              <div class="table-toolbar-title">Team Members</div>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/users')">View all →</button>
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
                      <td><span class="role-badge ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
                      <td class="text-secondary">${br ? br.name : '—'}</td>
                      <td><span class="badge ${Display.onboardingStatusClass(u.onboardingStatus)}">${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="table-container">
            <div class="table-toolbar">
              <div class="table-toolbar-title">Branches</div>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/branches')">View all →</button>
            </div>
            <table>
              <thead><tr><th>Branch</th><th>State</th><th>Users</th><th>Status</th></tr></thead>
              <tbody>
                ${branches.map(b => `
                  <tr>
                    <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address}</div></td>
                    <td>${b.state}</td>
                    <td>${b.userCount}</td>
                    <td><span class="badge ${b.status === 'active' ? 'badge-active' : 'badge-pending'}">${b.status === 'active' ? 'Active' : 'Pending'}</span></td>
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

    const statuses = {
      draft:     loans.filter(l => l.status === 'draft').length,
      in_review: loans.filter(l => l.status === 'in_review').length,
      approved:  loans.filter(l => l.status === 'approved').length,
      funded:    loans.filter(l => l.status === 'funded').length,
    };

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
            <span class="alert-icon">⚠️</span>
            <div>
              <strong>Account setup incomplete</strong><br>
              Your account is currently <strong>${Display.onboardingStatusLabel(user?.onboardingStatus)}</strong>.
              ${role === 'lo' && user?.onboardingStatus === 'verification_pending' ? 'SecuritizeID identity verification is required before you can submit applications.' : 'Complete your onboarding steps to activate your account.'}
              <button class="btn btn-sm btn-warning" style="margin-top:8px;background:#D97706;color:#fff;border:none" onclick="Router.navigate('/onboarding')">Continue Setup →</button>
            </div>
          </div>` : ''}

        <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
          ${[
            { label: 'Draft',     value: statuses.draft,     color: '#94A3B8' },
            { label: 'In Review', value: statuses.in_review, color: '#2563EB' },
            { label: 'Approved',  value: statuses.approved,  color: '#16A34A' },
            { label: 'Funded',    value: statuses.funded,    color: '#7C3AED' },
          ].map(s => `
            <div class="stat-card">
              <div class="stat-label">${s.label}</div>
              <div class="stat-value" style="color:${s.color}">${s.value}</div>
            </div>`).join('')}
        </div>

        <div class="table-container">
          <div class="table-toolbar">
            <div class="table-toolbar-title">Recent Applications</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/originations')">View all →</button>
          </div>
          ${loans.length ? `
            <table>
              <thead><tr><th>Application</th><th>Borrower</th><th>Amount</th><th>Program</th><th>Status</th><th>Submitted</th></tr></thead>
              <tbody>
                ${loans.map(l => `
                  <tr>
                    <td><span class="text-secondary fw-600" style="font-size:12px">${l.id}</span></td>
                    <td><div class="cell-primary">${l.borrowerName}</div><div class="cell-secondary">${l.address}</div></td>
                    <td class="fw-600">${Display.currency(l.amount)}</td>
                    <td><span class="tag">${l.program}</span></td>
                    <td><span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span></td>
                    <td class="text-secondary">${Display.date(l.submittedAt)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>` : `
            <div class="table-empty">
              <div class="table-empty-icon">📄</div>
              <p>No applications yet. Start a new application to get going.</p>
            </div>`}
        </div>
      </div>`;
  },

  /* ---- Investor Dashboard ---- */
  renderInvestorDashboard() {
    const user = State.getCurrentUser();
    return `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Investor Dashboard</div>
        </div>
      </div>

      <div class="page-body">
        <div class="alert alert-info">
          <span class="alert-icon">ℹ️</span>
          <div>Investor portfolio features are in development. Your KYC verification is <strong>complete</strong> via SecuritizeID.</div>
        </div>

        <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
          <div class="stat-card">
            <div class="stat-label">Portfolio Value</div>
            <div class="stat-value">$1.24M</div>
            <div class="stat-change up">↑ 8.2% YTD</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active HEIs</div>
            <div class="stat-value">7</div>
            <div class="stat-change neutral">Across 3 markets</div>
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
                  { address: '4412 Hillsboro Pike, Nashville, TN', market: 'Nashville', amount: 185000, ltv: 72, program: 'Standard HEI', status: 'Active' },
                  { address: '702 Glendale Ln, Brentwood, TN',     market: 'Nashville', amount: 225000, ltv: 65, program: 'Jumbo HEI',    status: 'Active' },
                  { address: '5820 Balcones Dr, Austin, TX',        market: 'Austin',    amount: 300000, ltv: 60, program: 'Standard HEI', status: 'Active' },
                  { address: '200 Governors Way, Brentwood, TN',    market: 'Nashville', amount: 210000, ltv: 74, program: 'Standard HEI', status: 'Active' },
                ].map(p => `
                  <tr>
                    <td><div class="cell-primary" style="font-size:12px">${p.address}</div></td>
                    <td>${p.market}</td>
                    <td class="fw-600">${Display.currency(p.amount)}</td>
                    <td>${p.ltv}%</td>
                    <td><span class="tag">${p.program}</span></td>
                    <td><span class="badge badge-active">${p.status}</span></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },
};
