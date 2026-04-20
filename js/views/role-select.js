/* ============================================================
   HOMIUM ORIGINATOR FLOW — Role Selector (Landing)
   ============================================================ */

const RoleSelectView = {
  render() {
    const roles = [
      { key: 'sys_admin',  title: 'System Admin',          scope: 'Homium',        desc: 'Full platform access. Manage all organizations, branches, users, and system-wide permissions.' },
      { key: 'operator',   title: 'Platform Operator',     scope: 'Platform',      desc: 'Manage organizations, branches, and users across the platform. No policy editing.' },
      { key: 'prog_admin', title: 'Program Administrator', scope: 'Company',       desc: 'Company-level admin. View users, manage branches, and invite new team members.' },
      { key: 'lo',         title: 'Loan Officer',          scope: 'Branch',        desc: 'Create, edit, and submit loan applications for homeowners within your branch.' },
      { key: 'lp',         title: 'Loan Processor',        scope: 'Branch',        desc: 'Process and update loan applications assigned to your branch.' },
      { key: 'investor',   title: 'Investor',              scope: 'Portfolio',     desc: 'View your investment portfolio and HEI performance. Requires SecuritizeID verification.' },
      { key: 'investor_prospect', title: 'Investor Prospect', scope: 'Preview', desc: 'High-level platform preview for prospective investors. View program impact, borrower stories, and fund projections.' },
    ];

    const isMobile = State.getViewMode() === 'mobile';

    const cards = roles.map(r => `
      <div class="role-card" onclick="RoleSelectView.selectRole('${r.key}')">
        <span class="role-scope-tag">${r.scope}</span>
        <div class="role-card-title">${r.title}</div>
        <div class="role-card-desc">${r.desc}</div>
        <div style="margin-top:4px;display:flex;align-items:center;gap:4px;font-size:12px;color:var(--color-primary);font-weight:500">
          Enter as ${r.title}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.5 6h7M6.5 3.5 9 6l-2.5 2.5"/></svg>
        </div>
      </div>`).join('');

    return `
      <div class="role-select-page">
        <!-- Header bar -->
        <div class="role-select-header">
          <img src="assets/branding/HomiumLogo_0721_Wordmark (Blue).png" alt="Homium"
               onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
          <span class="topnav-logo-text" style="display:none">Homium</span>
          <div style="margin-left:16px;padding-left:16px;border-left:1px solid var(--color-border)">
            <div class="role-select-header-text">
              <h1>Originator Platform</h1>
              <p>Interactive prototype — Q2 2026</p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="role-select-body">
          <div class="role-select-title">Select a User Type</div>
          <div class="role-select-subtitle">Choose a user type to preview the platform experience. All data is fictional and resets on refresh.</div>

          <!-- View Mode Toggle -->
          <div class="view-mode-toggle-wrap">
            <span class="view-mode-label">View Mode</span>
            <div class="view-mode-toggle" onclick="RoleSelectView.toggleViewMode()">
              <span class="view-mode-opt${isMobile ? '' : ' active'}" id="vmt-desktop">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="1" y="2" width="12" height="8" rx="1.5"/><path d="M4.5 12.5h5M7 10v2.5"/></svg>
                Desktop
              </span>
              <span class="view-mode-opt${isMobile ? ' active' : ''}" id="vmt-mobile">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="1" width="7" height="12" rx="2"/><circle cx="7" cy="10.5" r=".75" fill="currentColor" stroke="none"/></svg>
                Mobile
              </span>
              <div class="view-mode-slider${isMobile ? ' mobile' : ''}" id="vmt-slider"></div>
            </div>
            <span class="view-mode-hint" id="vmt-hint">${isMobile ? 'Select a role to preview the mobile app experience' : 'Select a role to enter the desktop experience'}</span>
          </div>

          <div class="role-select-layout">
            <div class="role-grid">${cards}</div>

            <div class="role-demo-box">
              <div class="role-demo-box-title">About this prototype</div>
              <p>This is an interactive front-end mockup of the Homium Originator Platform, built to the Spec v0.3 (March 2026).</p>
              <p style="margin-top:12px">Each role shows a different view of the platform with role-appropriate navigation, data, and actions.</p>
              <p style="margin-top:12px;color:var(--color-text-muted);font-size:12px">No backend — changes are in-memory only.</p>
              <hr style="margin:16px 0;border:none;border-top:1px solid var(--color-border)">
              <div style="font-size:11px;color:var(--color-text-muted);line-height:1.6">
                <strong style="display:block;margin-bottom:4px;font-size:10px;text-transform:uppercase;letter-spacing:.07em">User Types</strong>
                <div>System Admin · Operator</div>
                <div>Program Admin · Loan Officer</div>
                <div>Loan Processor · Investor</div>
                <div>Investor Prospect</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  toggleViewMode() {
    const isMobile = State.getViewMode() !== 'mobile';
    State.setViewMode(isMobile ? 'mobile' : 'desktop');
    document.getElementById('vmt-desktop')?.classList.toggle('active', !isMobile);
    document.getElementById('vmt-mobile')?.classList.toggle('active', isMobile);
    document.getElementById('vmt-slider')?.classList.toggle('mobile', isMobile);
    const hint = document.getElementById('vmt-hint');
    if (hint) hint.textContent = isMobile
      ? 'Select a role to preview the mobile app experience'
      : 'Select a role to enter the desktop experience';
  },

  selectRole(role) {
    State.setRole(role);
    // Prospect skips onboarding — go directly to dashboard
    if (role === 'investor_prospect') {
      const path = State.getViewMode() === 'mobile' ? '/m/prospect' : '/prospect';
      Router.navigate(path, { replace: true });
      return;
    }
    // Reset demo user to invited so the wizard starts from step 0
    const user = State.getCurrentUser();
    if (user) State.updateUser(user.id, { onboardingStatus: 'invited' });
    if (State.getViewMode() === 'mobile') {
      Router.navigate('/m/home', { replace: true });
    } else {
      OnboardingFlowView.open(role);
    }
  },
};
