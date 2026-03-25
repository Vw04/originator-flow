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
        icon:  `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 4l15 6v9c0 9-6.5 16.5-15 19C7 35.5.5 28 .5 19v-9L22 4z"/><path d="M15 22l4.5 4.5 9-9"/></svg>`,
        scope: 'Platform-wide',
        color: '#3730A3',
        bg:    '#E0E7FF',
      },
      {
        key:   'operator',
        title: 'Platform Operator',
        desc:  'Manage organizations, branches, and users across the platform. No policy editing.',
        icon:  `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="22" cy="22" r="4"/><path d="M22 4v4M22 36v4M4 22h4M36 22h4M8.1 8.1l2.8 2.8M33.1 33.1l2.8 2.8M8.1 35.9l2.8-2.8M33.1 10.9l2.8-2.8"/></svg>`,
        scope: 'Platform-wide',
        color: '#BE123C',
        bg:    '#FFE4E6',
      },
      {
        key:   'prog_admin',
        title: 'Program Administrator',
        desc:  'Company-level admin. View users, manage branches, and invite new team members.',
        icon:  `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="10" width="32" height="28" rx="2"/><path d="M14 10V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M14 22h16M14 30h10"/></svg>`,
        scope: 'Company-level',
        color: '#15803D',
        bg:    '#DCFCE7',
      },
      {
        key:   'lo',
        title: 'Loan Officer',
        desc:  'Create, edit, and submit loan applications for homeowners within your branch.',
        icon:  `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 6h24a2 2 0 0 1 2 2v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M15 16h14M15 22h14M15 28h8"/><path d="M30 27l4 4-4 4"/></svg>`,
        scope: 'Branch-level',
        color: '#1D4ED8',
        bg:    '#DBEAFE',
      },
      {
        key:   'lp',
        title: 'Loan Processor',
        desc:  'Process and update loan applications assigned to your branch.',
        icon:  `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="6" width="32" height="32" rx="2"/><path d="M14 18h16M14 24h10M14 30h12"/><circle cx="31" cy="30" r="5" fill="none"/><path d="M29 30l1.5 1.5 3-3"/></svg>`,
        scope: 'Branch-level',
        color: '#854D0E',
        bg:    '#FEF9C3',
      },
      {
        key:   'investor',
        title: 'Investor',
        desc:  'View your investment portfolio and HEI performance reports. Requires SecuritizeID verification.',
        icon:  `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 34l10-10 8 6 12-16"/><rect x="4" y="4" width="36" height="36" rx="2"/></svg>`,
        scope: 'Portfolio',
        color: '#7C3AED',
        bg:    '#EDE9FE',
      },
    ];

    const cards = roles.map(r => `
      <div class="role-card" style="--role-color:${r.color};--role-bg:${r.bg}" onclick="RoleSelectView.selectRole('${r.key}')">
        <div class="role-card-icon" style="color:${r.color}">${r.icon}</div>
        <div>
          <div class="role-card-title">${r.title}</div>
          <div class="role-card-desc">${r.desc}</div>
        </div>
        <div class="role-card-scope">
          <span style="color:${r.color}">&#9679;</span> ${r.scope}
        </div>
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
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px">
            <div>
              <div class="role-select-title">Select a role to enter</div>
              <div class="role-select-subtitle">Each role shows a different product experience based on permissions and scope.</div>
            </div>
            <div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:12px 16px;font-size:12px;color:#5A6A85;max-width:280px">
              <strong style="color:#1A202C;display:block;margin-bottom:4px">Demo prototype</strong>
              All data is fake and resets on refresh. Changes persist for your current session only.
            </div>
          </div>

          <div class="role-grid">${cards}</div>

          <div style="margin-top:40px;padding-top:24px;border-top:1px solid #E2E8F0;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <div style="font-size:12px;color:#94A3B8">
              Homium Originator Flow Spec v0.3 · March 2026 · Internal prototype only
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
