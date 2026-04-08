/* ============================================================
   HOMIUM ORIGINATOR FLOW — Administration Dashboard View
   ============================================================ */

const AdminDashboardView = {

  render() {
    const users     = State.getUsers();
    const companies = State.getCompanies();
    const loans     = State.getLoans();
    const activity  = State.getActivity();

    const activeUsers     = users.filter(u => u.onboardingStatus === 'active').length;
    const pendingUsers    = users.filter(u => u.onboardingStatus !== 'active').length;
    const now             = new Date();
    const thisMonthLoans  = loans.filter(l => {
      if (!l.submittedAt) return false;
      const d = new Date(l.submittedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const kpis = [
      { label: 'Origination Companies', value: companies.length,           sub: 'registered on platform' },
      { label: 'Active Users',           value: activeUsers,                sub: `${pendingUsers} pending onboarding` },
      { label: 'Loans This Month',       value: thisMonthLoans.length,      sub: thisMonthLoans.length ? Display.currency(thisMonthLoans.reduce((s,l)=>s+l.amount,0)) : '$0' },
      { label: 'Total Platform Loans',   value: loans.length,               sub: Display.currency(loans.reduce((s,l)=>s+l.amount,0)) + ' pipeline' },
    ];

    const kpiHtml = kpis.map(k => `
      <div class="admin-dash-kpi">
        <div class="admin-dash-kpi-value">${k.value}</div>
        <div class="admin-dash-kpi-label">${k.label}</div>
        <div class="admin-dash-kpi-sub">${k.sub}</div>
      </div>`).join('');

    // Activity feed
    const activityHtml = activity.slice(0, 8).map(a => {
      const actor = State.getUser(a.userId);
      const initials = actor ? Display.initials(actor) : '??';
      const name     = actor ? Display.fullName(actor) : 'Unknown';
      const actionIcons = { invited: '👤', created: '🏢', submitted: '📄', approved: '✓', updated: '✏️', 'policy updated': '🔑' };
      const icon = actionIcons[a.action] || '•';
      return `
        <div class="activity-feed-item">
          <div class="activity-feed-avatar">${initials}</div>
          <div class="activity-feed-body">
            <span class="activity-feed-name">${name}</span>
            <span class="activity-feed-action"> ${a.action} </span>
            <span class="activity-feed-subject">${a.subject}</span>
          </div>
          <div class="activity-feed-time">${a.time}</div>
        </div>`;
    }).join('');

    // Recent audit log
    const auditLog = [
      { actor: 'Alex Morgan',    action: 'Company default template set', entity: 'Capital City Lending', when: '2 days ago' },
      { actor: 'Patricia Owens', action: 'Branch template assigned',     entity: 'Capitol Hill Branch',  when: '3 days ago' },
      { actor: 'Patricia Owens', action: 'User permission override',      entity: 'James Okafor',         when: '4 days ago' },
      { actor: 'Alex Morgan',    action: 'Company default template set', entity: 'Bluegrass Home Finance',when: '5 days ago' },
      { actor: 'Jordan Lee',     action: 'New company onboarded',        entity: 'Commonwealth Mortgage', when: '6 days ago' },
    ];

    const auditRows = auditLog.map(e => `
      <tr>
        <td style="font-weight:500">${e.actor}</td>
        <td>${e.action}</td>
        <td style="color:var(--color-text-secondary)">${e.entity}</td>
        <td style="color:var(--color-text-muted);white-space:nowrap">${e.when}</td>
      </tr>`).join('');

    const quickLinks = [
      { path: '/origination-companies', label: 'Origination Companies', icon: '🏢', desc: 'Manage companies, branches & users' },
      { path: '/investors',             label: 'Investors & Funds',      icon: '💼', desc: 'Investor entities and fund management' },
      { path: '/platform',             label: 'Platform Operations',    icon: '⚙️',  desc: 'Onboarding, integrations & ops' },
      { path: '/system-config',        label: 'System Configuration',   icon: '🔧', desc: 'Permissions, templates & settings' },
    ];

    const quickLinksHtml = quickLinks.map(l => `
      <div class="admin-dash-quicklink" onclick="Nav.goAdmin('${l.path}')">
        <div class="admin-dash-quicklink-icon">${l.icon}</div>
        <div>
          <div class="admin-dash-quicklink-label">${l.label}</div>
          <div class="admin-dash-quicklink-desc">${l.desc}</div>
        </div>
      </div>`).join('');

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Administration Dashboard</div>
            <div class="page-subtitle">Platform overview and management</div>
          </div>
        </div>
      </div>
      <div class="page-body">
        <div class="admin-dash-kpis">${kpiHtml}</div>
        <div class="admin-dash-body">
          <div class="admin-dash-main">
            <div class="card" style="margin-bottom:20px">
              <div class="card-title" style="margin-bottom:16px">Recent Platform Activity</div>
              <div>${activityHtml || '<div style="color:var(--color-text-muted);font-size:13px;padding:16px 0">No recent activity.</div>'}</div>
            </div>
            <div class="card">
              <div class="card-title" style="margin-bottom:16px">Audit Log</div>
              <div class="table-container">
                <table>
                  <thead><tr>
                    <th>Actor</th><th>Action</th><th>Entity</th><th>When</th>
                  </tr></thead>
                  <tbody>${auditRows}</tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="admin-dash-sidebar">
            <div class="card">
              <div class="card-title" style="margin-bottom:16px">Administration Sections</div>
              <div class="admin-dash-quicklinks">${quickLinksHtml}</div>
            </div>
          </div>
        </div>
      </div>`;
  },
};
