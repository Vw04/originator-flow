/* ============================================================
   HOMIUM ORIGINATOR FLOW — Role Selector (Landing)
   ============================================================ */

const RoleSelectView = {
  render() {
    const roles = [
      {
        key:   'sys_admin',
        title: 'Homium System Admin',
        desc:  'Full platform access. Manage all organizations, branches, users, and system-wide permissions.',
        scope: 'Platform-wide',
      },
      {
        key:   'operator',
        title: 'Platform Operator',
        desc:  'Manage organizations, branches, and users across the platform. No policy editing.',
        scope: 'Platform-wide',
      },
      {
        key:   'prog_admin',
        title: 'Program Administrator',
        desc:  'Company-level admin. View users, manage branches, and invite new team members.',
        scope: 'Company-level',
      },
      {
        key:   'lo',
        title: 'Loan Officer',
        desc:  'Create, edit, and submit loan applications for homeowners within your branch.',
        scope: 'Branch-level',
      },
      {
        key:   'lp',
        title: 'Loan Processor',
        desc:  'Process and update loan applications assigned to your branch.',
        scope: 'Branch-level',
      },
      {
        key:   'investor',
        title: 'Investor',
        desc:  'View your investment portfolio and HEI performance reports. Requires SecuritizeID verification.',
        scope: 'Portfolio',
      },
    ];

    const cards = roles.map(r => `
      <div class="role-card" onclick="RoleSelectView.selectRole('${r.key}')">
        <span class="role-scope-tag">${r.scope}</span>
        <div class="role-card-title">${r.title}</div>
        <div class="role-card-desc">${r.desc}</div>
      </div>`).join('');

    return `
      <div class="role-select-page">
        <div class="role-select-header">
          <img src="assets/branding/HomiumLogo_0721_Wordmark (Blue).png" alt="Homium"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
               style="height:30px;filter:brightness(0) invert(1)" />
          <span style="display:none;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.02em">Homium</span>
          <div class="role-select-header-text" style="margin-left:16px">
            <h1>Originator Platform</h1>
            <p>Interactive Prototype — Q2 2026</p>
          </div>
        </div>

        <div class="role-select-body">
          <div class="role-select-title">User Roles</div>
          <div class="role-select-subtitle">Select a role to preview the platform experience.</div>

          <div class="role-select-layout">
            <div class="role-grid">${cards}</div>
            <div class="role-demo-box">
              <div class="role-demo-box-title">Demo Mode</div>
              <p>Select a role to preview the platform as that user type. All data is fictional and resets on page refresh.</p>
              <p style="margin-top:12px;font-size:11px;color:var(--color-text-muted)">Homium Originator Flow Spec v0.3 · March 2026 · Internal prototype only</p>
            </div>
          </div>
        </div>
      </div>`;
  },

  selectRole(role) {
    State.setRole(role);
    Router.navigate('/dashboard');
  },
};
