/* ============================================================
   HOMIUM ORIGINATOR FLOW — Administration Dashboard View
   Onboarding and user management focused
   ============================================================ */

const AdminDashboardView = {

  render() {
    const users     = State.getUsers();
    const companies = State.getCompanies();
    const activity  = State.getActivity();

    const activeUsers   = users.filter(u => u.onboardingStatus === 'active');
    const pendingUsers  = users.filter(u => u.onboardingStatus !== 'active' && u.onboardingStatus !== 'verification_failed');
    const actionRequired = users.filter(u => u.onboardingStatus === 'verification_failed' || u.onboardingStatus === 'verification_pending');

    const kpis = [
      {
        label: 'Total Users',
        value: users.length,
        sub:   `across ${companies.length} companies`,
      },
      {
        label: 'Active Users',
        value: activeUsers.length,
        sub:   'fully onboarded',
      },
      {
        label: 'Pending Onboarding',
        value: pendingUsers.length,
        sub:   'in progress',
      },
      {
        label: 'Action Required',
        value: actionRequired.length,
        sub:   'verification or failed status',
        accent: actionRequired.length > 0,
      },
    ];

    const kpiHtml = kpis.map(k => `
      <div class="admin-dash-kpi">
        <div class="admin-dash-kpi-value" style="${k.accent ? 'color:var(--color-danger)' : ''}">${k.value}</div>
        <div class="admin-dash-kpi-label">${k.label}</div>
        <div class="admin-dash-kpi-sub">${k.sub}</div>
      </div>`).join('');

    /* Onboarding funnel */
    const FUNNEL_STAGES = [
      { key: 'invited',              label: 'Invited',              color: '#94A3B8' },
      { key: 'email_verified',       label: 'Email Verified',       color: '#60A5FA' },
      { key: '2fa_complete',         label: '2FA Complete',         color: '#FBBF24' },
      { key: 'verification_pending', label: 'Verification Pending', color: '#F97316' },
      { key: 'active',               label: 'Active',               color: '#1D3D2A' },
      { key: 'verification_failed',  label: 'Verification Failed',  color: '#DC2626' },
    ];

    const maxFunnelCount = Math.max(1, ...FUNNEL_STAGES.map(s => users.filter(u => u.onboardingStatus === s.key).length));
    const totalUsers = users.length || 1;

    const funnelHtml = FUNNEL_STAGES.map(s => {
      const count = users.filter(u => u.onboardingStatus === s.key).length;
      const pct   = Math.round((count / maxFunnelCount) * 100);
      const pctOfTotal = Math.round((count / totalUsers) * 100);
      return `
        <div class="admin-funnel-row">
          <div class="admin-funnel-label">${s.label}</div>
          <div class="admin-funnel-bar-wrap">
            <div class="admin-funnel-bar" style="width:${Math.max(pct, count > 0 ? 4 : 0)}%;background:${s.color}"></div>
          </div>
          <div class="admin-funnel-count">${count}</div>
          <div class="admin-funnel-pct">${pctOfTotal}%</div>
        </div>`;
    }).join('');

    /* Users by company */
    const companyRows = companies.map(co => {
      const coUsers   = users.filter(u => u.companyId === co.id);
      const coActive  = coUsers.filter(u => u.onboardingStatus === 'active').length;
      const coPending = coUsers.filter(u => u.onboardingStatus !== 'active').length;
      const coPct     = coUsers.length ? Math.round((coActive / coUsers.length) * 100) : 0;
      return `
        <tr>
          <td style="font-weight:600">${co.name}</td>
          <td style="color:var(--color-text-muted);font-size:12px">${co.state || '—'}</td>
          <td style="color:var(--color-success);font-weight:600">${coActive}</td>
          <td style="color:var(--color-text-secondary)">${coPending}</td>
          <td>${coUsers.length}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;background:var(--color-surface);border-radius:3px;height:6px;overflow:hidden">
                <div style="width:${coPct}%;height:100%;background:var(--color-primary);border-radius:3px"></div>
              </div>
              <span style="font-size:11px;color:var(--color-text-muted);width:28px;text-align:right">${coPct}%</span>
            </div>
          </td>
        </tr>`;
    }).join('');

    /* Activity feed — no emojis, use text action labels */
    const actionLabel = { invited: 'Invited', created: 'Created', submitted: 'Submitted', approved: 'Approved', updated: 'Updated', 'policy updated': 'Policy updated' };

    const activityHtml = activity.slice(0, 8).map(a => {
      const actor    = State.getUser(a.userId);
      const initials = actor ? Display.initials(actor) : '??';
      const name     = actor ? Display.fullName(actor) : 'Unknown';
      const verb     = actionLabel[a.action] || a.action;
      return `
        <div class="activity-feed-item">
          <div class="activity-feed-avatar">${initials}</div>
          <div class="activity-feed-body">
            <strong>${name}</strong> ${verb.toLowerCase()} <span style="color:var(--color-primary)">${a.subject}</span>
          </div>
          <div class="activity-feed-time">${a.time}</div>
        </div>`;
    }).join('') || '<div style="padding:12px 0;color:var(--color-text-muted);font-size:13px">No recent activity.</div>';

    /* Audit log */
    const auditLog = [
      { actor: 'Alex Morgan',    action: 'Company default template set', entity: 'Capital City Lending',  when: '2 days ago' },
      { actor: 'Patricia Owens', action: 'Branch template assigned',     entity: 'Capitol Hill Branch',   when: '3 days ago' },
      { actor: 'Patricia Owens', action: 'User permission override',     entity: 'James Okafor',          when: '4 days ago' },
      { actor: 'Alex Morgan',    action: 'Company default template set', entity: 'Bluegrass Home Finance', when: '5 days ago' },
      { actor: 'Jordan Lee',     action: 'New company onboarded',        entity: 'Commonwealth Mortgage', when: '6 days ago' },
    ];
    const auditRows = auditLog.map(e => `
      <tr>
        <td style="font-weight:500">${e.actor}</td>
        <td>${e.action}</td>
        <td style="color:var(--color-text-secondary)">${e.entity}</td>
        <td style="color:var(--color-text-muted);white-space:nowrap">${e.when}</td>
      </tr>`).join('');

    /* Quick links — no emojis */
    const quickLinks = [
      { path: '/origination-companies', label: 'Origination Companies', desc: 'Manage companies, branches, and users' },
      { path: '/investors',             label: 'Investors & Funds',     desc: 'Investor entities and fund management' },
      { path: '/platform',             label: 'Platform Operations',   desc: 'Onboarding, integrations, and operations' },
      { path: '/system-config',        label: 'System Configuration',  desc: 'Permissions, templates, and settings' },
    ];
    const quickLinksHtml = quickLinks.map(l => `
      <div class="admin-dash-quicklink" onclick="Nav.goAdmin('${l.path}')">
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
            <div class="page-subtitle">User onboarding and platform management</div>
          </div>
        </div>
      </div>
      <div class="page-body">
        <div class="admin-dash-kpis">${kpiHtml}</div>
        <div class="admin-dash-body">
          <div class="admin-dash-main">
            <div class="card" style="margin-bottom:20px">
              <div class="card-title" style="margin-bottom:16px">User Onboarding Funnel</div>
              <div style="display:grid;grid-template-columns:1fr 80px;gap:2px;margin-bottom:4px;padding:0 0 6px;border-bottom:1px solid var(--color-border-light)">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Stage</div>
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);text-align:right">Count</div>
              </div>
              ${funnelHtml}
            </div>
            <div class="card" style="margin-bottom:20px">
              <div class="card-title" style="margin-bottom:16px">Users by Company</div>
              <div class="table-container">
                <table>
                  <thead><tr>
                    <th>Company</th><th>State</th><th>Active</th><th>Pending</th><th>Total</th><th>Onboarding %</th>
                  </tr></thead>
                  <tbody>${companyRows}</tbody>
                </table>
              </div>
            </div>
            <div class="card" style="margin-bottom:20px">
              <div class="card-title" style="margin-bottom:16px">Recent Platform Activity</div>
              ${activityHtml}
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
