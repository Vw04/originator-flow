/* ============================================================
   MOBILE HOME — Role-branched home dashboards
   ============================================================ */

const MobileHomeView = {

  /* Loan status → display label */
  _STATUS_LABELS: {
    draft: 'Draft',
    initial_application_submitted: 'Submitted',
    prequalification_in_progress: 'Submitted',
    application_documents_approved: 'In Review',
    sent_to_docutech: 'In Review',
    origination_created: 'In Review',
    pending_origination_creation: 'In Review',
    original_appraisal_submitted: 'In Review',
    completed: 'Completed',
  },

  /* Group statuses into pipeline stages */
  _STAGE_MAP: {
    Draft:     ['draft'],
    Submitted: ['initial_application_submitted', 'prequalification_in_progress'],
    'In Review': ['application_documents_approved', 'sent_to_docutech', 'origination_created', 'pending_origination_creation', 'original_appraisal_submitted'],
    Completed: ['completed'],
  },

  /* Simulated "days in stage" for demo loans */
  _LOAN_DAYS: {
    DCDC000001: 21,
    DCDC000002: 29,
    DCDC000003: 2,
    DCDC000004: 8,
    DCDC000005: 18,
    DCDC000006: 27,
    KDKY000001: 22,
    KDKY000002: 34,
  },

  _NEXT_ACTIONS: {
    draft: 'Complete application',
    initial_application_submitted: 'Awaiting review',
    prequalification_in_progress: 'Prequal review',
    application_documents_approved: 'Send to DocuTech',
    sent_to_docutech: 'Awaiting origination',
    origination_created: 'Final review',
    pending_origination_creation: 'Create origination',
    original_appraisal_submitted: 'Appraisal review',
    completed: 'Closed',
  },

  render() {
    const role = State.getRole();
    switch (role) {
      case 'sys_admin':
      case 'operator':   return this._renderOperatorHome();
      case 'prog_admin': return this._renderProgAdminHome();
      case 'lo':         return this._renderLOHome();
      case 'lp':         return this._renderLPHome();
      case 'investor':   return this._renderInvestorHome();
      default:           return '<div class="m-empty-state">Select a role to continue</div>';
    }
  },

  _adminTab: 'overview', // 'overview' | 'pipeline' | 'companies'

  /* ── Operator / Sys Admin ── */
  _renderOperatorHome() {
    const role = State.getRole();
    const user = State.getCurrentUser();
    const tab = this._adminTab || 'overview';

    return `
      ${this._pageHeader(Display.roleName(role), user)}

      <!-- Admin sub-tabs -->
      <div class="m-filter-strip" style="padding-top:6px">
        <button class="m-filter-pill${tab === 'overview' ? ' active' : ''}" onclick="MobileHomeView._adminTab='overview';App.renderMobileShell(MobileHomeView.render())">Overview</button>
        <button class="m-filter-pill${tab === 'pipeline' ? ' active' : ''}" onclick="MobileHomeView._adminTab='pipeline';App.renderMobileShell(MobileHomeView.render())">Loan Pipeline</button>
        <button class="m-filter-pill${tab === 'companies' ? ' active' : ''}" onclick="MobileHomeView._adminTab='companies';App.renderMobileShell(MobileHomeView.render())">Companies</button>
      </div>

      ${tab === 'overview' ? this._renderAdminOverview() : ''}
      ${tab === 'pipeline' ? this._renderAdminPipeline() : ''}
      ${tab === 'companies' ? this._renderAdminCompanies() : ''}
    `;
  },

  _renderAdminOverview() {
    const users = State.getUsers();
    const companies = State.getCompanies();
    const activity = State.getActivity();
    const loans = State.getLoans();

    const totalUsers = users.length;
    const totalCos = companies.length;
    const pending = users.filter(u => u.onboardingStatus !== 'active' && u.onboardingStatus !== 'suspended').length;
    const activeLoans = loans.filter(l => l.status !== 'draft' && l.status !== 'completed').length;

    const stuckUsers = users.filter(u =>
      u.onboardingStatus === 'verification_pending' || u.onboardingStatus === 'verification_failed'
    );

    return `
      <div class="m-kpi-strip cols-2" style="padding-top:10px">
        <div class="m-kpi-card">
          <div class="m-kpi-value">${totalUsers}</div>
          <div class="m-kpi-label">Total Users</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value">${totalCos}</div>
          <div class="m-kpi-label">Companies</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value${pending > 0 ? ' accent-warning' : ''}">${pending}</div>
          <div class="m-kpi-label">Pending Onboarding</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value accent-success">${activeLoans}</div>
          <div class="m-kpi-label">Active Loans</div>
        </div>
      </div>

      ${stuckUsers.length ? `
        <div class="m-section-header">
          <span class="m-section-title">Needs Attention</span>
          <span class="m-section-count">${stuckUsers.length}</span>
        </div>
        <div class="m-list">
          ${stuckUsers.map(u => {
            const co = State.getCompany(u.companyId);
            const isFailed = u.onboardingStatus === 'verification_failed';
            return `
              <div class="m-list-item ${isFailed ? 'danger' : 'attention'}">
                <div class="m-list-item-header">
                  <span class="m-list-item-title">${Display.fullName(u)}</span>
                  <span class="status-badge ${isFailed ? 'status-danger' : 'status-warning'}" style="font-size:10px;padding:2px 7px">${isFailed ? 'Failed' : 'Pending'}</span>
                </div>
                <div class="m-list-item-sub">${co ? co.name : 'N/A'} &middot; ${Display.roleName(u.role)}</div>
                <div class="m-list-item-footer">
                  <span style="font-size:11px;color:var(--h-text-muted)">${u.email}</span>
                  <button class="m-alert-action" onclick="State.advanceOnboarding('${u.id}');App.renderMobileShell(MobileHomeView.render())">Advance</button>
                </div>
              </div>`;
          }).join('')}
        </div>
      ` : ''}

      <div class="m-section-header">
        <span class="m-section-title">Recent Activity</span>
      </div>
      <div class="m-activity-list" style="padding:0 14px 14px">
        ${activity.slice(0, 8).map(a => {
          const actor = a.userId ? State.getUser(a.userId) : null;
          const name = actor ? Display.fullName(actor) : 'System';
          return `
            <div class="m-activity-item">
              <div class="m-activity-dot"></div>
              <div class="m-activity-body">
                <div class="m-activity-text"><strong>${name}</strong> ${a.action} <em>${a.subject || ''}</em></div>
                <div class="m-activity-time">${a.time}</div>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  },

  _renderAdminPipeline() {
    const loans = State.getLoans();
    const active = loans.filter(l => l.status !== 'draft' && l.status !== 'completed');
    const attentionLoans = loans.filter(l => (this._LOAN_DAYS[l.id] || 0) > 14 && l.status !== 'completed');
    const maxCount = Math.max(...Object.values(this._STAGE_MAP).map(statuses => loans.filter(l => statuses.includes(l.status)).length), 1);

    return `
      <div class="m-kpi-strip cols-3" style="padding-top:10px">
        <div class="m-kpi-card">
          <div class="m-kpi-value accent-success">${active.length}</div>
          <div class="m-kpi-label">Active</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value${attentionLoans.length > 0 ? ' accent-warning' : ''}">${attentionLoans.length}</div>
          <div class="m-kpi-label">Needs Attn</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value">${loans.filter(l => l.status === 'completed').length}</div>
          <div class="m-kpi-label">Completed</div>
        </div>
      </div>

      <div class="m-section-header">
        <span class="m-section-title">Pipeline by Stage</span>
      </div>
      <div class="m-pipeline-bars">
        ${Object.entries(this._STAGE_MAP).map(([stage, statuses]) => {
          const count = loans.filter(l => statuses.includes(l.status)).length;
          const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
          return `
            <div class="m-pipeline-row">
              <span class="m-pipeline-label">${stage}</span>
              <div class="m-pipeline-track"><div class="m-pipeline-bar" style="width:${pct}%"></div></div>
              <span class="m-pipeline-count">${count}</span>
            </div>`;
        }).join('')}
      </div>

      ${attentionLoans.length ? `
        <div class="m-section-header">
          <span class="m-section-title">Stalled Loans</span>
          <span class="m-section-count">${attentionLoans.length}</span>
        </div>
        <div class="m-list" style="padding-bottom:14px">
          ${attentionLoans.map(l => this._loanCard(l)).join('')}
        </div>
      ` : ''}
    `;
  },

  _renderAdminCompanies() {
    const companies = State.getCompanies();
    const users = State.getUsers();

    return `
      <div class="m-list" style="padding:10px 14px 14px">
        ${companies.map(co => {
          const coUsers = users.filter(u => u.companyId === co.id);
          const active = coUsers.filter(u => u.onboardingStatus === 'active').length;
          const total = coUsers.length;
          const pct = total > 0 ? Math.round((active / total) * 100) : 0;
          const pillClass = pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red';
          const branches = State.getBranchesByCompany(co.id);
          const coLoans = State.getLoansByCompany(co.id);

          return `
            <div class="m-co-item">
              <div class="m-co-row" onclick="MobileLoansView.toggleCompany('${co.id}')">
                <div>
                  <div class="m-co-name">${co.name}</div>
                  <div class="m-co-meta">${co.stateOfIncorporation} &middot; ${branches.length} branch${branches.length !== 1 ? 'es' : ''} &middot; ${total} users &middot; ${coLoans.length} loans</div>
                </div>
                <div class="m-co-right">
                  <span class="m-onboard-pill ${pillClass}">${pct}%</span>
                </div>
              </div>
              <div class="m-co-detail" id="co-detail-${co.id}">
                <div class="m-co-detail-row"><span>Primary Contact</span><span class="m-co-detail-val">${co.primaryContact}</span></div>
                <div class="m-co-detail-row"><span>NMLS</span><span class="m-co-detail-val">${co.nmlsId}</span></div>
                <div class="m-co-detail-row"><span>Programs</span><span class="m-co-detail-val">${co.programs.length ? co.programs.join(', ') : 'None'}</span></div>
                <div class="m-co-detail-row"><span>Active Users</span><span class="m-co-detail-val">${active} / ${total}</span></div>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  },

  /* ── Program Admin ── */
  _renderProgAdminHome() {
    const user = State.getCurrentUser();
    const loans = user ? State.getLoansByCompany(user.companyId) : [];

    const activePipeline = loans.filter(l => l.status !== 'completed' && l.status !== 'draft').length;
    const submitted = loans.filter(l => ['initial_application_submitted', 'prequalification_in_progress'].includes(l.status)).length;
    const completed = loans.filter(l => l.status === 'completed').length;

    const attentionLoans = loans.filter(l => (this._LOAN_DAYS[l.id] || 0) > 14 && l.status !== 'completed');
    const maxCount = Math.max(...Object.values(this._STAGE_MAP).map(statuses => loans.filter(l => statuses.includes(l.status)).length), 1);

    return `
      ${this._pageHeader('Program Admin', user)}

      <div class="m-kpi-strip cols-3">
        <div class="m-kpi-card">
          <div class="m-kpi-value accent-success">${activePipeline}</div>
          <div class="m-kpi-label">Active Pipeline</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value">${submitted}</div>
          <div class="m-kpi-label">Submitted</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value">${completed}</div>
          <div class="m-kpi-label">Completed</div>
        </div>
      </div>

      ${attentionLoans.length ? `
        <div class="m-section-header">
          <span class="m-section-title">Requires Attention</span>
          <span class="m-section-count">${attentionLoans.length}</span>
        </div>
        <div class="m-list">
          ${attentionLoans.map(l => this._loanCard(l)).join('')}
        </div>
      ` : ''}

      <div class="m-section-header">
        <span class="m-section-title">Pipeline by Stage</span>
      </div>
      <div class="m-pipeline-bars" style="padding-bottom:14px">
        ${Object.entries(this._STAGE_MAP).map(([stage, statuses]) => {
          const count = loans.filter(l => statuses.includes(l.status)).length;
          const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
          return `
            <div class="m-pipeline-row">
              <span class="m-pipeline-label">${stage}</span>
              <div class="m-pipeline-track"><div class="m-pipeline-bar" style="width:${pct}%"></div></div>
              <span class="m-pipeline-count">${count}</span>
            </div>`;
        }).join('')}
      </div>
    `;
  },

  /* ── Loan Officer ── */
  _renderLOHome() {
    const user = State.getCurrentUser();
    const loans = user ? State.getLoansByLO(user.id) : [];

    const stageCounts = {};
    Object.entries(this._STAGE_MAP).forEach(([stage, statuses]) => {
      stageCounts[stage] = loans.filter(l => statuses.includes(l.status)).length;
    });

    const attentionLoans = loans.filter(l =>
      l.status !== 'completed' && ((this._LOAN_DAYS[l.id] || 0) > 7 || l.status === 'draft')
    );

    return `
      ${this._pageHeader('Loan Officer', user)}

      <div class="m-kpi-strip cols-2" style="padding-bottom:8px">
        ${Object.entries(stageCounts).map(([stage, count]) => `
          <div class="m-kpi-card">
            <div class="m-kpi-value">${count}</div>
            <div class="m-kpi-label">${stage}</div>
          </div>
        `).join('')}
      </div>

      ${attentionLoans.length ? `
        <div class="m-section-header">
          <span class="m-section-title">Needs Your Attention</span>
          <span class="m-section-count">${attentionLoans.length}</span>
        </div>
        <div class="m-list" style="padding-bottom:14px">
          ${attentionLoans.map(l => this._loanCard(l)).join('')}
        </div>
      ` : `
        <div class="m-empty-state">
          <div class="m-empty-icon">&#10003;</div>
          All loans on track
        </div>
      `}
    `;
  },

  /* ── Loan Processor ── */
  _renderLPHome() {
    const user = State.getCurrentUser();
    const loans = user ? State.getLoansByLO(user.id) : [];
    const actionLoans = loans.filter(l => l.status !== 'draft' && l.status !== 'completed');

    return `
      ${this._pageHeader('Loan Processor', user)}

      <div class="m-kpi-strip cols-2">
        <div class="m-kpi-card">
          <div class="m-kpi-value">${actionLoans.length}</div>
          <div class="m-kpi-label">Active Loans</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value">${loans.length}</div>
          <div class="m-kpi-label">Total Assigned</div>
        </div>
      </div>

      <div class="m-section-header">
        <span class="m-section-title">Loans Needing Action</span>
        <span class="m-section-count">${actionLoans.length}</span>
      </div>
      ${actionLoans.length ? `
        <div class="m-list" style="padding-bottom:14px">
          ${actionLoans.map(l => this._loanCard(l)).join('')}
        </div>
      ` : `
        <div class="m-empty-state">
          <div class="m-empty-icon">&#10003;</div>
          No loans needing action
        </div>
      `}
    `;
  },

  /* ── Investor ── */
  _renderInvestorHome() {
    const user = State.getCurrentUser();
    const funds = State.getFunds();
    const loans = State.getLoans();

    const totalDeployed = funds.reduce((s, f) => s + f.deployed, 0);
    const totalCommitted = funds.reduce((s, f) => s + f.committed, 0);
    const activeFunds = funds.filter(f => f.status === 'active').length;

    const maxCount = Math.max(...Object.values(this._STAGE_MAP).map(statuses => loans.filter(l => statuses.includes(l.status)).length), 1);

    return `
      ${this._pageHeader('Investor', user)}

      <div class="m-kpi-strip cols-3">
        <div class="m-kpi-card">
          <div class="m-kpi-value" style="font-size:20px">$${(totalDeployed / 1e6).toFixed(1)}M</div>
          <div class="m-kpi-label">Deployed</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value" style="font-size:20px">$${(totalCommitted / 1e6).toFixed(0)}M</div>
          <div class="m-kpi-label">Committed</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value">${activeFunds}</div>
          <div class="m-kpi-label">Active Funds</div>
        </div>
      </div>

      <div class="m-section-header">
        <span class="m-section-title">Pipeline Overview</span>
      </div>
      <div class="m-pipeline-bars" style="padding-bottom:14px">
        ${Object.entries(this._STAGE_MAP).map(([stage, statuses]) => {
          const count = loans.filter(l => statuses.includes(l.status)).length;
          const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
          return `
            <div class="m-pipeline-row">
              <span class="m-pipeline-label">${stage}</span>
              <div class="m-pipeline-track"><div class="m-pipeline-bar" style="width:${pct}%"></div></div>
              <span class="m-pipeline-count">${count}</span>
            </div>`;
        }).join('')}
      </div>
    `;
  },

  /* ── Shared helpers ── */
  _pageHeader(roleLabel, user) {
    const name = user ? Display.fullName(user) : 'Demo User';
    return `
      <div class="m-page-header">
        <div class="m-page-header-left">
          <img src="assets/branding/HomiumLogo_0721_Icon (Blue).png" alt="H" style="height:22px"
               onerror="this.style.display='none'" />
          <div>
            <div class="m-page-title">Home</div>
            <div class="m-page-subtitle">${name}</div>
          </div>
        </div>
        <span class="m-role-chip">${roleLabel}</span>
      </div>`;
  },

  _loanCard(l) {
    const days = this._LOAN_DAYS[l.id] || 0;
    const stageLabel = this._STATUS_LABELS[l.status] || l.status;
    const nextAction = this._NEXT_ACTIONS[l.status] || '';
    const isAttention = days > 14;
    return `
      <div class="m-list-item${isAttention ? ' attention' : ''}" onclick="MobileDetailView.open('${l.id}')">
        <div class="m-list-item-header">
          <span class="m-list-item-title">${l.borrowerName}</span>
          <span class="m-days-badge${days <= 7 ? ' ok' : ''}">${days}d</span>
        </div>
        <div class="m-list-item-sub">${l.id} &middot; ${l.program}</div>
        <div class="m-list-item-footer">
          <span class="status-badge status-${stageLabel === 'Completed' ? 'success' : stageLabel === 'Draft' ? 'neutral' : 'info'}" style="font-size:10px;padding:2px 7px">${stageLabel}</span>
          <span class="m-list-item-amount">$${(l.amount / 1000).toFixed(0)}k</span>
        </div>
        ${nextAction ? `<div style="font-size:11px;color:var(--h-text-muted);margin-top:2px">Next: ${nextAction}</div>` : ''}
      </div>`;
  },
};
