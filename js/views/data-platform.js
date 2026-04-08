/* ============================================================
   HOMIUM ORIGINATOR FLOW — Data Platform View
   Dashboard, Applications, Originations, Batches, Activations
   ============================================================ */

const DataPlatformView = {

  _activeTab: 'analytics',
  _selectedApplicationId: null,
  _activeStep: 4,
  _appFilter: 'all',
  _appSearch: '',
  _batchExpanded: null,

  /* ---- Step / status helpers ---- */
  _STEP_MAP: {
    'draft':                          0,
    'prequalification_in_progress':   1,
    'initial_application_submitted':  2,
    'application_documents_approved': 3,
    'original_appraisal_submitted':   4,
    'sent_to_docutech':               5,
    'pending_origination_creation':   6,
    'origination_created':            7,
    'completed':                      8,
  },

  _loanStep(loan) {
    return this._STEP_MAP[loan.status] ?? 0;
  },

  _nextAction(loan) {
    const map = {
      'draft':                          'Complete & submit application',
      'prequalification_in_progress':   'Awaiting borrower prequalification',
      'initial_application_submitted':  'Upload appraisal report',
      'application_documents_approved': 'Send to DocuTech for docs',
      'original_appraisal_submitted':   'Review appraisal — order title',
      'sent_to_docutech':               'Awaiting DocuTech documents',
      'pending_origination_creation':   'Create origination record',
      'origination_created':            'Submit for final review',
      'completed':                      '—',
    };
    return map[loan.status] || '—';
  },

  /* Days since submittedAt (or last status change) — demo approximations */
  _LOAN_DAYS: {
    'DCDC000001': 21, 'DCDC000002': 29, 'DCDC000003': 46,
    'DCDC000004': 3,  'DCDC000005': 18, 'DCDC000006': 27,
    'KDKY000001': 22, 'KDKY000002': 34,
  },

  _daysInStage(loan) {
    return this._LOAN_DAYS[loan.id] || Math.floor(Math.random() * 20 + 5);
  },

  _daysBadge(days) {
    if (days <= 7)  return `<span class="days-badge days-badge-ok">${days}d</span>`;
    if (days <= 14) return `<span class="days-badge days-badge-warn">${days}d</span>`;
    return `<span class="days-badge days-badge-alert">${days}d</span>`;
  },

  /* ---- Sub-tab config per role ---- */
  _tabsForRole(role) {
    const all = [
      { key: 'analytics',    label: 'Dashboard' },
      { key: 'applications', label: 'Applications' },
      { key: 'originations', label: 'Originations' },
      { key: 'batches',      label: 'Batches' },
      { key: 'activations',  label: 'Activations' },
    ];
    if (role === 'prog_admin') return all.slice(0, 3);
    if (role === 'lo')         return [all[1], all[2]];
    if (role === 'lp')         return [all[1]];
    if (role === 'investor')   return [all[0]];
    return all;
  },

  render(tab) {
    if (tab) this._activeTab = tab;
    const role = State.getRole();
    const tabs = this._tabsForRole(role);
    if (!tabs.find(t => t.key === this._activeTab)) {
      this._activeTab = tabs[0]?.key || 'analytics';
    }

    let content = '';
    switch (this._activeTab) {
      case 'analytics':    content = this._renderDashboard();    break;
      case 'applications': content = this._renderApplications(); break;
      case 'originations': content = this._renderOriginations(); break;
      case 'batches':      content = this._renderBatches();      break;
      case 'activations':  content = this._renderActivations();  break;
      default:             content = this._renderDashboard();
    }

    return `<div class="page-body">${content}</div>`;
  },

  switchTab(tab) {
    this._activeTab = tab;
    App.renderView('/data/' + tab);
  },

  openApplication(loanId) {
    this._selectedApplicationId = loanId;
    this._activeStep = 4;
    App.renderView('/data/applications');
  },

  selectStep(idx) {
    this._activeStep = idx;
    App.renderView('/data/applications');
  },

  /* ================================================================
     DASHBOARD
  ================================================================ */
  _renderDashboard() {
    const allLoans = State.getLoans();
    const role     = State.getRole();
    const loans    = (role === 'lo' || role === 'lp')
      ? State.getLoansByLO(State.getCurrentUser()?.id)
      : allLoans;

    const isInvestor = role === 'investor';

    const active    = loans.filter(l => l.status !== 'draft' && l.status !== 'completed');
    const completed = loans.filter(l => l.status === 'completed');
    const now       = new Date();
    const thisMonth = loans.filter(l => {
      if (!l.submittedAt) return false;
      const d = new Date(l.submittedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const stalledLoans = active.filter(l => this._daysInStage(l) > 14);
    const onTrackPct   = active.length
      ? Math.round(((active.length - stalledLoans.length) / active.length) * 100)
      : 100;

    /* ── Section 1: KPI strip ── */
    const kpis = [
      { label: 'Active Pipeline',       value: Display.currency(active.reduce((s,l)=>s+l.amount,0)),  sub: `${active.length} loan${active.length!==1?'s':''} in progress` },
      { label: 'Submitted This Month',  value: thisMonth.length,                                       sub: thisMonth.length ? Display.currency(thisMonth.reduce((s,l)=>s+l.amount,0)) : '$0 value' },
      { label: 'Completed',             value: completed.length,                                       sub: completed.length ? Display.currency(completed.reduce((s,l)=>s+l.amount,0)) + ' closed' : '$0 closed' },
      { label: 'Avg Days to Close',     value: '45',                                                   sub: 'Industry avg: 49 days' },
      { label: 'On-Track Rate',         value: onTrackPct + '%',                                       sub: stalledLoans.length > 0 ? `${stalledLoans.length} loan${stalledLoans.length!==1?'s':''} stalled` : 'All loans on track', accent: onTrackPct < 80, accentColor: 'var(--color-danger)' },
    ];
    const kpiHtml = `<div class="lop-kpi-cards" style="grid-template-columns:repeat(5,1fr)">${
      kpis.map(k => `
        <div class="lop-kpi-card">
          <div class="lop-kpi-value" style="${k.accent ? `color:${k.accentColor}` : ''}">${k.value}</div>
          <div class="lop-kpi-label">${k.label}</div>
          <div class="lop-kpi-sub">${k.sub}</div>
        </div>`).join('')
    }</div>`;

    /* ── Section 2: Program Performance cards ── */
    const programs = [...new Set(loans.map(l => l.program))].filter(Boolean);
    const STAGE_DEFS = [
      { label: 'Prequalification', statuses: ['prequalification_in_progress'],  color: '#94A3B8' },
      { label: 'Submitted',        statuses: ['initial_application_submitted'],  color: '#60A5FA' },
      { label: 'Docs / Appraisal', statuses: ['application_documents_approved','original_appraisal_submitted'], color: '#34D399' },
      { label: 'In Origination',   statuses: ['sent_to_docutech','pending_origination_creation','origination_created'], color: '#FBBF24' },
      { label: 'Completed',        statuses: ['completed'],                      color: '#1D3D2A' },
    ];

    const programCardsHtml = programs.map(prog => {
      const pLoans    = loans.filter(l => l.program === prog);
      const pActive   = pLoans.filter(l => l.status !== 'draft' && l.status !== 'completed');
      const pDone     = pLoans.filter(l => l.status === 'completed').length;
      const pStalled  = pActive.filter(l => this._daysInStage(l) > 14).length;
      const pVal      = pLoans.reduce((s,l)=>s+l.amount,0);
      const ltvLoans  = pLoans.filter(l => l.ltv);
      const avgLTV    = ltvLoans.length ? (ltvLoans.reduce((s,l)=>s+l.ltv,0)/ltvLoans.length).toFixed(1) : '—';
      // find company name via first loan
      const sampleLoan = pLoans[0];
      const company = sampleLoan ? State.getCompany?.(sampleLoan.companyId) : null;
      const companyName = company ? company.name : '';
      const state = company ? company.state : '';

      const maxPCount = Math.max(1, ...STAGE_DEFS.map(s => pLoans.filter(l=>s.statuses.includes(l.status)).length));
      const miniStages = STAGE_DEFS.map(s => {
        const cnt = pLoans.filter(l => s.statuses.includes(l.status)).length;
        const pct = Math.round((cnt / maxPCount) * 100);
        return `
          <div class="dash-program-stage-row">
            <div class="dash-program-stage-label">${s.label}</div>
            <div class="dash-program-stage-bar-wrap">
              <div class="dash-program-stage-bar" style="width:${Math.max(pct, cnt>0?4:0)}%;background:${s.color}"></div>
            </div>
            <div class="dash-program-stage-count">${cnt}</div>
          </div>`;
      }).join('');

      return `
        <div class="dash-program-card">
          <div class="dash-program-name">${prog}</div>
          <div class="dash-program-company">${companyName}${state ? ' &middot; ' + state : ''}</div>
          <div class="dash-program-stats">
            <div>
              <div class="dash-program-stat-val">${pActive.length}</div>
              <div class="dash-program-stat-lbl">Active</div>
            </div>
            <div>
              <div class="dash-program-stat-val">${Display.currency(pVal)}</div>
              <div class="dash-program-stat-lbl">Total Value</div>
            </div>
            <div>
              <div class="dash-program-stat-val">${avgLTV}${avgLTV !== '—' ? '%' : ''}</div>
              <div class="dash-program-stat-lbl">Avg LTV</div>
            </div>
            <div>
              <div class="dash-program-stat-val">${pDone}</div>
              <div class="dash-program-stat-lbl">Completed</div>
            </div>
          </div>
          ${pStalled > 0 ? `<div class="dash-attn-badge">${pStalled} loan${pStalled!==1?'s':''} need attention</div>` : ''}
          <div class="dash-program-stages">${miniStages}</div>
        </div>`;
    }).join('');

    /* ── Section 3: SVG bar chart + attention queue ── */
    const stageCounts = STAGE_DEFS.map(s => ({
      ...s,
      loans: loans.filter(l => s.statuses.includes(l.status)),
    }));
    const maxCount  = Math.max(1, ...stageCounts.map(s => s.loans.length));

    // SVG dimensions
    const svgW = 400, svgH = 260;
    const padL = 28, padR = 12, padT = 28, padB = 60;
    const chartW = svgW - padL - padR;
    const chartH = svgH - padT - padB;
    const nBars  = stageCounts.length;
    const barW   = Math.floor(chartW / nBars * 0.55);
    const gap    = (chartW - barW * nBars) / (nBars + 1);

    const svgBars = stageCounts.map((s, i) => {
      const barH  = s.loans.length > 0 ? Math.max(Math.round((s.loans.length / maxCount) * chartH), 6) : 2;
      const x     = padL + gap + i * (barW + gap);
      const y     = padT + chartH - barH;
      const cx    = x + barW / 2;
      const val   = s.loans.reduce((acc, l) => acc + l.amount, 0);
      const label = s.label.split('/')[0].trim(); // shorten "Docs / Appraisal" → "Docs"
      const label2 = s.label.includes('/') ? '/ Appraisal' : (s.label === 'In Origination' ? 'Origination' : '');

      const valY = padT + chartH + (label2 ? 38 : 27);
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${s.color}" />
        <text x="${cx}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#374151">${s.loans.length}</text>
        <text x="${cx}" y="${padT + chartH + 14}" text-anchor="middle" font-size="10" fill="#6B7280">${label}</text>
        ${label2 ? `<text x="${cx}" y="${padT + chartH + 25}" text-anchor="middle" font-size="10" fill="#6B7280">${label2}</text>` : ''}
        <text x="${cx}" y="${valY}" text-anchor="middle" font-size="10" fill="#9CA3AF">${val ? Display.currency(Math.round(val/1000))+'k' : '—'}</text>
      `;
    }).join('');

    // Horizontal guide lines
    const guideLines = [0.25, 0.5, 0.75, 1].map(frac => {
      const yg = padT + chartH - Math.round(frac * chartH);
      const val = Math.round(frac * maxCount);
      return `
        <line x1="${padL}" y1="${yg}" x2="${svgW - padR}" y2="${yg}" stroke="#E5E7EB" stroke-width="1" stroke-dasharray="3,3"/>
        <text x="${padL - 4}" y="${yg + 4}" text-anchor="end" font-size="9" fill="#9CA3AF">${val}</text>`;
    }).join('');

    const barChartHtml = `
      <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" style="display:block;overflow:visible">
        ${guideLines}
        ${svgBars}
      </svg>`;

    const attnLoansHtml = stalledLoans.length
      ? `<table class="dash-attn-table">
          <thead><tr>
            <th>Loan / Borrower</th>
            <th>Program</th>
            <th>Stage</th>
            <th>Days Stalled</th>
            <th>Amount</th>
            <th>Next Action</th>
          </tr></thead>
          <tbody>
            ${stalledLoans.map(l => {
              return `
              <tr class="row-needs-attention" style="cursor:pointer" onclick="DataPlatformView.openApplication('${l.id}')">
                <td>
                  <div style="font-size:11px;font-weight:700;color:var(--color-primary);margin-bottom:1px">${l.id}</div>
                  <div style="font-size:13px;font-weight:600">${l.borrowerName}</div>
                  <div style="font-size:11px;color:var(--color-text-muted)">${l.address.split(',').slice(0,2).join(',').trim()}</div>
                </td>
                <td style="font-size:12px"><span class="tag">${l.program}</span></td>
                <td><span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span></td>
                <td>${this._daysBadge(this._daysInStage(l))}</td>
                <td style="font-weight:600;font-size:13px">${Display.currency(l.amount)}</td>
                <td style="font-size:12px;color:var(--color-text-secondary)">${this._nextAction(l)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`
      : `<div class="dash-attn-ok">
          <span style="color:var(--color-success);font-weight:700;font-size:14px">&#10003;</span>
          All loans are on track — no loans stalled over 14 days.
        </div>`;

    const midSection = isInvestor ? '' : `
      <div style="display:grid;grid-template-columns:420px 1fr;gap:16px;margin-bottom:20px">
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">Pipeline by Stage</div>
          ${barChartHtml}
        </div>
        <div class="card">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
            <div class="card-title" style="margin-bottom:0">Requires Attention</div>
            ${stalledLoans.length > 0
              ? `<span style="background:#FEE2E2;color:#DC2626;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px">${stalledLoans.length} loan${stalledLoans.length!==1?'s':''}</span>`
              : `<span style="background:#D1FAE5;color:#065F46;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px">All on track</span>`}
          </div>
          ${attnLoansHtml}
        </div>
      </div>`;

    /* ── Section 4: Branch Performance grouped by company ── */
    const branchSection = isInvestor ? '' : (() => {
      const companies = State.getCompanies();
      const allBranches = State.getBranches();

      const companyGroups = companies.map(co => {
        const coBranches = allBranches.filter(b => b.companyId === co.id);
        const coAllLoans = loans.filter(l => l.companyId === co.id);
        const coActive   = coAllLoans.filter(l => l.status !== 'draft' && l.status !== 'completed');
        const coVal      = coActive.reduce((s,l) => s+l.amount, 0);

        const branchRows = coBranches.map(b => {
          const bActive  = loans.filter(l => l.branchId === b.id && l.status !== 'draft' && l.status !== 'completed');
          const bOnTrack = bActive.filter(l => this._daysInStage(l) <= 14).length;
          const ltvB     = bActive.filter(l => l.ltv);
          const avgLTV   = ltvB.length ? (ltvB.reduce((s,l)=>s+l.ltv,0)/ltvB.length).toFixed(1)+'%' : '—';
          const bVal     = bActive.reduce((s,l)=>s+l.amount,0);
          return `
            <tr>
              <td style="padding-left:28px;color:var(--color-text-secondary);font-size:12px">${b.name}</td>
              <td style="font-size:12px;font-weight:600;text-align:center">${bActive.length || '—'}</td>
              <td style="font-size:12px">${bVal ? Display.currency(bVal) : '—'}</td>
              <td style="font-size:12px;text-align:center">
                <span style="color:${bActive.length > 0 && bOnTrack === bActive.length ? 'var(--color-success)' : bActive.length > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)'}">
                  ${bActive.length > 0 ? bOnTrack+'/'+bActive.length : '—'}
                </span>
              </td>
              <td style="font-size:12px">${avgLTV}</td>
              <td><span class="badge ${b.status === 'active' ? 'badge-active' : 'badge-pending'}" style="font-size:10px">${b.status}</span></td>
            </tr>`;
        }).join('');

        return `
          <tr style="background:var(--color-surface)">
            <td colspan="6" style="padding:10px 14px">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                  <span style="font-size:13px;font-weight:700;color:var(--color-text)">${co.name}</span>
                  <span style="font-size:11px;color:var(--color-text-muted);margin-left:8px">${co.state || ''} &middot; ${coBranches.length} branch${coBranches.length!==1?'es':''}</span>
                </div>
                <div style="display:flex;gap:16px;font-size:12px;color:var(--color-text-secondary)">
                  <span>${coActive.length} active loan${coActive.length!==1?'s':''}</span>
                  <span style="font-weight:600">${coVal ? Display.currency(coVal) : '$0'}</span>
                </div>
              </div>
            </td>
          </tr>
          ${branchRows}`;
      }).join('');

      return `
        <div class="card" style="margin-bottom:20px">
          <div class="card-title" style="margin-bottom:16px">Company &amp; Branch Performance</div>
          <div class="table-container">
            <table>
              <thead><tr>
                <th>Branch</th>
                <th style="text-align:center">Active Loans</th>
                <th>Pipeline Value</th>
                <th style="text-align:center">On-Track</th>
                <th>Avg LTV</th>
                <th>Status</th>
              </tr></thead>
              <tbody>${companyGroups}</tbody>
            </table>
          </div>
        </div>`;
    })();

    /* ── Section 5: Map ── */
    const mapSection = `
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">Loan Locations</div>
        ${this._renderMap(loans)}
      </div>`;

    return `
      ${kpiHtml}
      <div class="dash-programs-grid">${programCardsHtml}</div>
      ${midSection}
      ${branchSection}
      ${mapSection}`;
  },

  /* ================================================================
     APPLICATIONS
  ================================================================ */
  _renderApplications() {
    if (this._selectedApplicationId) {
      return this._renderApplicationDetail(this._selectedApplicationId);
    }

    const role = State.getRole();
    const user = State.getCurrentUser();
    const allLoans = (role === 'lo' || role === 'lp') ? State.getLoansByLO(user?.id) : State.getLoans();
    const canCreate = ['lo', 'prog_admin', 'sys_admin', 'operator'].includes(role);

    // Filter tabs
    const needsAction = allLoans.filter(l => this._daysInStage(l) > 14 && l.status !== 'completed' && l.status !== 'draft');
    const inReview    = allLoans.filter(l => ['application_documents_approved','original_appraisal_submitted','sent_to_docutech','pending_origination_creation'].includes(l.status));
    const done        = allLoans.filter(l => l.status === 'completed');

    let filtered = allLoans;
    if (this._appFilter === 'needs_action') filtered = needsAction;
    else if (this._appFilter === 'in_review')    filtered = inReview;
    else if (this._appFilter === 'completed')    filtered = done;

    // Search
    const search = this._appSearch.trim().toLowerCase();
    if (search) filtered = filtered.filter(l =>
      l.borrowerName.toLowerCase().includes(search) ||
      l.id.toLowerCase().includes(search)
    );

    const filterTabs = [
      { key: 'all',          label: 'All',           count: allLoans.length },
      { key: 'needs_action', label: 'Needs Action',  count: needsAction.length },
      { key: 'in_review',    label: 'In Review',     count: inReview.length },
      { key: 'completed',    label: 'Completed',     count: done.length },
    ];

    const filterTabsHtml = filterTabs.map(t => `
      <div class="lop-filter-tab ${this._appFilter === t.key ? 'active' : ''}"
           onclick="DataPlatformView._setFilter('${t.key}')">
        ${t.label}
        <span class="lop-filter-tab-count ${this._appFilter === t.key ? 'active' : ''}">${t.count}</span>
      </div>`).join('');

    const rows = filtered.map((l, i) => {
      const step     = this._loanStep(l);
      const days     = this._daysInStage(l);
      const attn     = days > 14 && l.status !== 'completed' && l.status !== 'draft';
      const lo       = State.getUser(l.loId);
      const loName   = lo ? Display.fullName(lo) : '—';
      const dots     = Array.from({length: 9}, (_, di) =>
        `<span class="loan-progress-dot ${di < step ? 'done' : di === step ? 'current' : ''}"></span>`
      ).join('');

      return `
        <tr class="${attn ? 'row-needs-attention' : ''}" style="cursor:pointer"
            onclick="DataPlatformView.openApplication('${l.id}')">
          <td style="color:var(--color-text-muted);font-size:12px">${i + 1}</td>
          <td>
            <div style="font-size:12px;font-weight:700;color:var(--color-primary)">${l.id}</div>
            <div style="font-size:13px;color:var(--color-text)">${l.borrowerName}</div>
          </td>
          <td style="font-size:12px;color:var(--color-text-secondary);max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.address}</td>
          <td><div class="loan-progress-dots">${dots}</div></td>
          <td>${this._daysBadge(days)}</td>
          <td style="font-size:12px;color:var(--color-text-secondary);max-width:160px">${this._nextAction(l)}</td>
          <td style="font-size:12px;color:var(--color-text-secondary)">${loName}</td>
          <td style="font-weight:600">${Display.currency(l.amount)}</td>
          <td><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();DataPlatformView.openApplication('${l.id}')">View</button></td>
        </tr>`;
    }).join('');

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:20px;font-weight:700;color:var(--color-text)">Applications</div>
          <span style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:20px;padding:2px 10px;font-size:12px;font-weight:600;color:var(--color-text-secondary)">${allLoans.length}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <input class="input" style="width:220px;padding:7px 12px;font-size:13px"
                 placeholder="Search borrower or loan ID…"
                 value="${this._appSearch}"
                 oninput="DataPlatformView._setSearch(this.value)" />
          ${canCreate ? `<button class="btn btn-primary btn-sm" onclick="DataPlatformView._openNewAppModal()">+ New Application</button>` : ''}
        </div>
      </div>
      <div class="lop-filter-tabs">${filterTabsHtml}</div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th>#</th>
            <th>Loan / Borrower</th>
            <th>Address</th>
            <th>Progress</th>
            <th>Days in Stage</th>
            <th>Next Action</th>
            <th>Loan Officer</th>
            <th>Amount</th>
            <th></th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:var(--color-text-muted);padding:32px">No applications found</td></tr>'}</tbody>
        </table>
      </div>
      <div id="dp-modal"></div>`;
  },

  _setFilter(f) { this._appFilter = f; App.renderView('/data/applications'); },
  _setSearch(v) { this._appSearch = v; App.renderView('/data/applications'); },

  /* ================================================================
     APPLICATION DETAIL
  ================================================================ */
  _renderApplicationDetail(loanId) {
    const loan = State.getLoans().find(l => l.id === loanId);
    if (!loan) return '<div class="empty-state">Application not found.</div>';

    const lo = State.getUser(loan.loId);
    const loName = lo ? Display.fullName(lo) : '—';
    const addrParts = loan.address.split(',');
    const streetAddr = addrParts[0]?.trim() || loan.address;
    const cityState  = addrParts.slice(1).join(',').trim();
    const step = this._loanStep(loan);

    const STEPS = [
      { label: 'Upload\nLoan File',               short: 'Upload',        status: step > 0 ? 'completed' : step === 0 ? 'in_progress' : 'pending' },
      { label: 'Prequalification',                 short: 'Prequalify',    status: step > 1 ? 'completed' : step === 1 ? 'in_progress' : 'pending' },
      { label: 'Application\nSubmitted',           short: 'App Submitted', status: step > 2 ? 'completed' : step === 2 ? 'in_progress' : 'pending' },
      { label: 'Docs\nApproved',                   short: 'Docs Approved', status: step > 3 ? 'completed' : step === 3 ? 'in_progress' : 'pending' },
      { label: 'Appraisal',                        short: 'Appraisal',     status: step > 4 ? 'completed' : step === 4 ? 'in_progress' : 'pending' },
      { label: 'Sent to\nDocuTech',                short: 'DocuTech',      status: step > 5 ? 'completed' : step === 5 ? 'in_progress' : 'pending' },
      { label: 'Origination\nCreated',             short: 'Origination',   status: step > 6 ? 'completed' : step === 6 ? 'in_progress' : 'pending' },
      { label: 'Final\nReview',                    short: 'Final Review',  status: step > 7 ? 'completed' : step === 7 ? 'in_progress' : 'pending' },
      { label: 'Closed',                           short: 'Closed',        status: step === 8 ? 'completed' : 'pending' },
    ];

    // Horizontal stepper
    const stepperHtml = STEPS.map((s, i) => {
      const isCurrent   = i === step;
      const isCompleted = s.status === 'completed';
      const isPending   = s.status === 'pending';
      return `
        <div class="app-stepper-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'done' : ''}"
             onclick="DataPlatformView.selectStep(${i})" style="cursor:pointer">
          <div class="app-stepper-dot ${isCompleted ? 'done' : isCurrent ? 'current' : 'pending'}">
            ${isCompleted ? '✓' : i + 1}
          </div>
          <div class="app-stepper-label">${s.short}</div>
          ${i < STEPS.length - 1 ? `<div class="app-stepper-line ${isCompleted ? 'done' : ''}"></div>` : ''}
        </div>`;
    }).join('');

    // Per-loan comms data
    const COMMS = {
      'DCDC000001': [
        { msg: 'Loan Estimate sent to borrower',         tag: 'sent',     date: 'Mar 20, 2026' },
        { msg: 'Application submitted',                   tag: 'done',     date: 'Mar 18, 2026' },
        { msg: 'Appraisal report due',                    tag: 'due',      date: 'Apr 10, 2026' },
        { msg: 'Rate lock expiry',                        tag: 'due',      date: 'Apr 30, 2026' },
      ],
      'DCDC000002': [
        { msg: 'Closing Disclosure sent to borrower',    tag: 'sent',     date: 'Apr 1, 2026' },
        { msg: 'Documents approved by underwriter',      tag: 'done',     date: 'Mar 28, 2026' },
        { msg: 'Loan Estimate sent to borrower',         tag: 'sent',     date: 'Mar 12, 2026' },
        { msg: 'Rate lock expires',                       tag: 'due',      date: 'Apr 12, 2026' },
      ],
      'DCDC000003': [
        { msg: 'Closing completed — loan funded',        tag: 'done',     date: 'Mar 15, 2026' },
        { msg: 'Final CD sent to borrower',              tag: 'sent',     date: 'Mar 10, 2026' },
        { msg: 'Title insurance confirmed',              tag: 'done',     date: 'Mar 5, 2026' },
      ],
    };
    const comms = COMMS[loanId] || [
      { msg: 'Application created', tag: 'done', date: loan.submittedAt ? Display.date(loan.submittedAt) : 'Pending' },
    ];

    const commsHtml = comms.map(c => {
      const tagClass = { sent: 'comms-tag-sent', done: 'comms-tag-done', due: 'comms-tag-due' }[c.tag] || 'comms-tag-done';
      const tagLabel = { sent: 'Sent', done: 'Done', due: 'Due' }[c.tag] || c.tag;
      const dotClass = { sent: 'notif-dot-sent', done: 'notif-dot-complete', due: 'notif-dot-action' }[c.tag] || 'notif-dot-info';
      return `
        <div class="app-comms-item">
          <span class="notif-dot ${dotClass}" style="margin-top:3px;flex-shrink:0"></span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;color:var(--color-text)">${c.msg}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">${c.date}</div>
          </div>
          <span class="comms-tag ${tagClass}">${tagLabel}</span>
        </div>`;
    }).join('');

    const submittedDate = loan.submittedAt ? Display.date(loan.submittedAt) : '—';
    const rateLockDate  = loanId === 'DCDC000002' ? 'Apr 12, 2026' : 'Apr 30, 2026';
    const estCloseDate  = loanId === 'DCDC000003' ? 'Mar 15, 2026' : 'May 15, 2026';

    return `
      <div style="margin-bottom:16px">
        <button class="btn btn-ghost btn-sm" onclick="DataPlatformView._backToApplications()">← Back to Applications</button>
      </div>

      <!-- Header -->
      <div class="app-detail-header">
        <div style="flex:1;min-width:0">
          <div class="app-header-address">${streetAddr}</div>
          <div class="app-header-citystate">${cityState}</div>
          <span class="tag" style="margin-top:8px;display:inline-block">${loan.program}</span>
        </div>
        <div class="app-detail-header-meta">
          <div class="app-detail-header-meta-row"><span>Loan ID</span><strong style="color:var(--color-primary)">${loan.id}</strong></div>
          <div class="app-detail-header-meta-row"><span>Amount</span><strong>${Display.currency(loan.amount)}</strong></div>
          <div class="app-detail-header-meta-row"><span>LTV / CLTV</span><strong>${loan.ltv ?? '—'}% / ${loan.cltv ?? '—'}%</strong></div>
          <div class="app-detail-header-meta-row"><span>Loan Officer</span><strong>${loName}</strong></div>
        </div>
      </div>

      <!-- Stepper -->
      <div class="app-stepper">${stepperHtml}</div>

      <!-- Body -->
      <div class="app-detail-body">
        <div class="app-detail-content">
          ${this._renderStepContent(this._activeStep, loan, STEPS)}
        </div>
        <div>
          <!-- Communications panel -->
          <div class="app-comms-panel" style="margin-bottom:16px">
            <div class="app-comms-section-title">Activity & Communications</div>
            ${commsHtml}
          </div>
          <!-- Key dates -->
          <div class="app-comms-panel" style="margin-bottom:16px">
            <div class="app-comms-section-title">Key Dates</div>
            <div class="app-key-date-row"><span>Submitted</span><strong>${submittedDate}</strong></div>
            <div class="app-key-date-row"><span>Rate Lock</span><strong style="color:${loanId === 'DCDC000002' ? 'var(--color-danger)' : 'inherit'}">${rateLockDate}</strong></div>
            <div class="app-key-date-row"><span>Est. Close</span><strong>${estCloseDate}</strong></div>
          </div>
          <!-- Parties -->
          <div class="app-comms-panel">
            <div class="app-comms-section-title">Parties</div>
            <div class="app-key-date-row"><span>Borrower</span><strong>${loan.borrowerName}</strong></div>
            <div class="app-key-date-row"><span>Loan Officer</span><strong>${loName}</strong></div>
            <div class="app-key-date-row"><span>Title Co.</span><strong>First American Title</strong></div>
            <div class="app-key-date-row"><span>Processor</span><strong>Kevin Park</strong></div>
          </div>
        </div>
      </div>
      <div id="dp-modal"></div>`;
  },

  _backToApplications() {
    this._selectedApplicationId = null;
    App.renderView('/data/applications');
  },

  _renderStepContent(stepIdx, loan, STEPS) {
    const step = STEPS[stepIdx];
    const purchasePrice = Math.round(loan.amount / ((loan.ltv || 75) / 100));
    const lenderFee     = Math.round(loan.amount * 0.01);
    const servicingFee  = Math.round(loan.amount * 0.005);

    // Step 2: Initial Application Review
    if (stepIdx === 2) {
      const conditions = [
        { label: 'Signed 1003 (Uniform Residential Loan Application) received', done: true },
        { label: 'Proof of income verified',                                       done: false },
        { label: `Credit report pulled — FICO: ${loan.ltv ? Math.round(680 + loan.ltv / 2) : '—'}`, done: true },
        { label: 'Flood certification ordered',                                    done: false },
        { label: 'Property insurance verification',                                done: false },
      ];
      const checklist = conditions.map(c => `
        <label class="app-condition-row">
          <input type="checkbox" ${c.done ? 'checked' : ''} onclick="return false" style="accent-color:var(--color-primary)" />
          <span style="color:${c.done ? 'var(--color-text)' : 'var(--color-text-secondary)'}">${c.label}</span>
        </label>`).join('');

      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Initial Application Review</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
            <div>
              <div class="app-step-subsection-title">Loan Overview</div>
              <table class="app-detail-table">
                <tbody>
                  <tr><td>Purchase Price</td><td>${Display.currency(purchasePrice)}</td></tr>
                  <tr><td>1st Mortgage Principal</td><td>${Display.currency(Math.round(purchasePrice * 0.72))}</td></tr>
                  <tr><td>Loan Amount</td><td><strong>${Display.currency(loan.amount)}</strong></td></tr>
                  <tr><td>Borrower Net</td><td>${Display.currency(Math.round(loan.amount * 0.97))}</td></tr>
                  <tr><td>LTV / CLTV</td><td>${loan.ltv ?? '—'}% / ${loan.cltv ?? '—'}%</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <div class="app-step-subsection-title">Fees</div>
              <table class="app-detail-table">
                <tbody>
                  <tr><td>Lender Fee</td><td>${Display.currency(lenderFee)}</td></tr>
                  <tr><td>Loan Servicing Fee</td><td>${Display.currency(servicingFee)}</td></tr>
                  <tr><td>Flood Certification</td><td>$12.50</td></tr>
                  <tr><td>Title Company Validation</td><td>$150.00</td></tr>
                  <tr><td>Collateral Review</td><td>$350.00</td></tr>
                  <tr><td>Settlement Fee</td><td>$525.00</td></tr>
                  <tr><td>Lender's Title Insurance</td><td>${Display.currency(Math.round(loan.amount * 0.004))}</td></tr>
                  <tr><td>Recording Trust Deed</td><td>$95.00</td></tr>
                  <tr><td>Loan Safe Fraud Manager</td><td>$18.00</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="app-step-subsection-title">Conditions Checklist</div>
          <div class="app-conditions">${checklist}</div>
          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn-secondary btn-sm">Uniform Residential Loan Application</button>
            <button class="btn btn-secondary btn-sm">Download MISMO XML</button>
          </div>
        </div>`;
    }

    // Step 4: Appraisal
    if (stepIdx === 4) {
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Appraisal</div>
          <div class="app-appraisal-grid">
            <div class="app-appraisal-field">
              <div class="app-appraisal-field-label">Ordered Date</div>
              <div class="app-appraisal-field-value">${loan.submittedAt ? Display.date(new Date(new Date(loan.submittedAt).getTime() + 3 * 86400000).toISOString()) : '—'}</div>
            </div>
            <div class="app-appraisal-field">
              <div class="app-appraisal-field-label">Appraiser</div>
              <div class="app-appraisal-field-value">David Kowalski — AMC</div>
            </div>
            <div class="app-appraisal-field">
              <div class="app-appraisal-field-label">Inspection Date</div>
              <div class="app-appraisal-field-value">Apr 8, 2026</div>
            </div>
            <div class="app-appraisal-field">
              <div class="app-appraisal-field-label">Report Received</div>
              <div class="app-appraisal-field-value">
                <span class="badge badge-pending">Pending</span>
              </div>
            </div>
            <div class="app-appraisal-field">
              <div class="app-appraisal-field-label">Appraised Value</div>
              <div class="app-appraisal-field-value">
                <input class="input" style="width:160px;padding:6px 10px;font-size:13px" placeholder="e.g. $275,000" />
              </div>
            </div>
            <div class="app-appraisal-field">
              <div class="app-appraisal-field-label">Appraisal Type</div>
              <div class="app-appraisal-field-value">Full Interior — USPAP</div>
            </div>
          </div>
          <div style="margin-top:20px;padding:14px 16px;background:#FEF3C7;border-radius:var(--radius-lg);border:1px solid #FCD34D;font-size:13px;color:#92400E">
            <strong>Action Required:</strong> Appraisal report due by <strong>Apr 10, 2026</strong>. Upload the completed report to proceed.
          </div>
          <div style="margin-top:12px">
            <button class="btn btn-primary btn-sm">Upload Appraisal Report</button>
          </div>
        </div>`;
    }

    // Step 6: Application Documents
    if (stepIdx === 6) {
      const docs = [
        { name: 'Appraisal Report',           status: 'Pending Upload', sentToBorrower: false },
        { name: 'Title Commitment',            status: 'Pending Upload', sentToBorrower: false },
        { name: 'Property Insurance Binder',   status: 'Approved',       sentToBorrower: true  },
        { name: 'Signed Loan Application 1003',status: 'Approved',       sentToBorrower: true  },
        { name: 'Borrower ID Verification',    status: 'Approved',       sentToBorrower: true  },
        { name: 'Income Verification',         status: 'Pending Upload', sentToBorrower: false },
        { name: 'Flood Zone Certification',    status: 'Pending Upload', sentToBorrower: false },
        { name: 'Closing Disclosure',          status: 'Pending Upload', sentToBorrower: false },
      ];
      const docRows = docs.map(d => `
        <tr>
          <td>${d.name}</td>
          <td><span class="badge ${d.status === 'Approved' ? 'badge-active' : 'badge-pending'}">${d.status}</span></td>
          <td style="text-align:center">${d.sentToBorrower ? '<span style="color:var(--color-success)">✓ Sent</span>' : '<span style="color:var(--color-text-muted)">—</span>'}</td>
          <td>
            ${d.status === 'Pending Upload'
              ? `<button class="btn btn-ghost btn-xs">Upload</button>
                 <button class="btn btn-ghost btn-xs" style="margin-left:4px">Send Reminder</button>`
              : '—'}
          </td>
        </tr>`).join('');

      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Application Documents</div>
          <table class="app-detail-table" style="width:100%">
            <thead><tr>
              <th>Document</th><th>Status</th><th style="text-align:center">Sent to Borrower</th><th>Actions</th>
            </tr></thead>
            <tbody>${docRows}</tbody>
          </table>
        </div>`;
    }

    // Step 7: Final Review / Title
    if (stepIdx === 7) {
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Title Information</div>
          <div class="form-grid">
            <div class="form-group">
              <label>Title Company Name</label>
              <input class="input" value="First American Title" />
            </div>
            <div class="form-group">
              <label>Title Officer</label>
              <input class="input" value="Sandra Reeves" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input class="input" value="(202) 555-0444" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input class="input" value="sreeves@firstam.com" />
            </div>
            <div class="form-group form-full">
              <label>Title Company Address</label>
              <input class="input" value="1100 New York Ave NW, Suite 400, Washington, DC 20005" />
            </div>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn btn-primary btn-sm">Save Title Info</button>
            <button class="btn btn-secondary btn-sm">Order Title Search</button>
          </div>
        </div>`;
    }

    // Step 8: Confirm & Submit
    if (stepIdx === 8) {
      const completedSteps = STEPS.filter(s => s.status === 'completed').length;
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Confirm and Submit</div>
          <div style="padding:16px;background:var(--color-surface);border-radius:var(--radius-lg);margin-bottom:16px">
            <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:12px">${completedSteps} of ${STEPS.length} steps completed</div>
            <div style="background:var(--color-border);border-radius:4px;height:8px;overflow:hidden">
              <div style="background:var(--color-primary);height:100%;width:${Math.round(completedSteps/STEPS.length*100)}%"></div>
            </div>
          </div>
          <button class="btn btn-primary" ${completedSteps < STEPS.length - 1 ? 'disabled style="opacity:0.5"' : ''}>Submit for Final Review</button>
        </div>`;
    }

    // Default for other steps
    const isCompleted = step?.status === 'completed';
    return `
      <div class="app-step-section" style="text-align:center;padding:48px 20px">
        <div style="font-size:36px;margin-bottom:14px">${isCompleted ? '✓' : '⏳'}</div>
        <div style="font-size:16px;font-weight:700;color:var(--color-text);margin-bottom:8px">${step?.short || ''}</div>
        <div style="font-size:13px;color:var(--color-text-muted)">${isCompleted ? 'This step has been completed.' : 'This step is pending completion of earlier steps.'}</div>
      </div>`;
  },

  /* ================================================================
     ORIGINATIONS
  ================================================================ */
  _renderOriginations() {
    const role  = State.getRole();
    const user  = State.getCurrentUser();
    const loans = (role === 'lo' || role === 'lp')
      ? State.getLoansByLO(user?.id)
      : State.getLoans().filter(l => l.status !== 'draft');

    const active   = loans.filter(l => l.status !== 'completed');
    const onTrack  = active.filter(l => this._daysInStage(l) <= 14);
    const attn     = active.filter(l => this._daysInStage(l) > 14);
    const done     = loans.filter(l => l.status === 'completed');

    const statsHtml = `
      <div class="stat-row" style="margin-bottom:24px">
        <div class="stat-item">
          <div class="stat-label">${role === 'lo' || role === 'lp' ? 'My Active' : 'Total Active'}</div>
          <div class="stat-value" style="font-size:26px">${active.length}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">On Track</div>
          <div class="stat-value" style="font-size:26px;color:var(--color-success)">${onTrack.length}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Needs Attention</div>
          <div class="stat-value" style="font-size:26px;color:${attn.length > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)'}">${attn.length}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Completed</div>
          <div class="stat-value" style="font-size:26px">${done.length}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Total Value</div>
          <div class="stat-value" style="font-size:26px">${Display.currency(loans.reduce((s,l)=>s+l.amount,0))}</div>
        </div>
      </div>`;

    const rows = loans.map((l, i) => {
      const days  = this._daysInStage(l);
      const isAttn = days > 14 && l.status !== 'completed' && l.status !== 'draft';
      return `
        <tr class="${isAttn ? 'row-needs-attention' : ''}">
          <td style="color:var(--color-text-muted);font-size:12px">${i + 1}</td>
          <td>
            <div style="font-size:12px;font-weight:700;color:var(--color-primary)">${l.id}</div>
            <div style="font-size:13px">${l.borrowerName}</div>
          </td>
          <td style="font-size:12px;color:var(--color-text-secondary);max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.address}</td>
          <td><span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span></td>
          <td>${this._daysBadge(days)}</td>
          <td style="font-size:12px;color:var(--color-text-secondary)">${this._nextAction(l)}</td>
          <td style="font-weight:600">${Display.currency(l.amount)}</td>
          <td style="font-size:12px;color:var(--color-text-muted)">${Display.currency(Math.round(l.amount / 1000))}</td>
          <td><button class="btn btn-ghost btn-xs" onclick="DataPlatformView.openApplication('${l.id}')">View</button></td>
        </tr>`;
    }).join('');

    return `
      ${statsHtml}
      <div class="table-container">
        <table>
          <thead><tr>
            <th>#</th>
            <th>Loan / Borrower</th>
            <th>Address</th>
            <th>Stage</th>
            <th>Days in Stage</th>
            <th>Next Action</th>
            <th>Loan ($)</th>
            <th>Total Homium ($)</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:var(--color-text-muted);padding:32px">No originations found</td></tr>'}</tbody>
        </table>
      </div>`;
  },

  /* ================================================================
     BATCHES
  ================================================================ */
  _renderBatches() {
    const role     = State.getRole();
    const loans    = State.getLoans();
    const canCreate = ['sys_admin', 'operator', 'prog_admin'].includes(role);

    const batches = [
      { id: 'BATCH-2026-001', loans: loans.slice(0,3), status: 'Pending Issuance', statusClass: 'badge-warning', created: '2026-03-10' },
      { id: 'BATCH-2026-002', loans: loans.slice(3,5), status: 'Draft',            statusClass: 'badge-neutral', created: '2026-03-20' },
      { id: 'BATCH-2025-003', loans: loans.slice(5,8), status: 'Issued',           statusClass: 'badge-active',  created: '2025-11-14' },
    ];

    const eligible = loans.filter(l => l.status === 'completed');
    const pendingIssuance = batches.filter(b => b.status === 'Pending Issuance').length;
    const issued = batches.filter(b => b.status === 'Issued').length;

    const statsHtml = `
      <div class="stat-row" style="margin-bottom:24px">
        <div class="stat-item">
          <div class="stat-label">Total Batches</div>
          <div class="stat-value" style="font-size:26px">${batches.length}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Eligible for Batching</div>
          <div class="stat-value" style="font-size:26px;color:${eligible.length > 0 ? 'var(--color-primary)' : 'inherit'}">${eligible.length}</div>
          <div class="stat-desc">completed, unbatched</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Pending Issuance</div>
          <div class="stat-value" style="font-size:26px">${pendingIssuance}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Issued</div>
          <div class="stat-value" style="font-size:26px;color:var(--color-success)">${issued}</div>
        </div>
      </div>`;

    // Eligible pool (collapsible)
    const eligibleRows = eligible.map(l => `
      <tr>
        <td><input type="checkbox" style="accent-color:var(--color-primary)" /></td>
        <td style="font-size:12px;font-weight:700;color:var(--color-primary)">${l.id}</td>
        <td>${l.borrowerName}</td>
        <td>${Display.currency(l.amount)}</td>
        <td>${l.submittedAt ? Display.date(l.submittedAt) : '—'}</td>
      </tr>`).join('');

    const eligibleSection = eligible.length ? `
      <div class="card" style="margin-bottom:20px;border:1px solid var(--color-primary);border-radius:var(--radius-lg)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div>
            <div class="card-title" style="color:var(--color-primary)">Eligible Loans Pool</div>
            <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">${eligible.length} loan${eligible.length!==1?'s':''} available for batching</div>
          </div>
          ${canCreate ? `<button class="btn btn-primary btn-sm">Create Batch from Selected</button>` : ''}
        </div>
        <div class="table-container">
          <table>
            <thead><tr>
              <th style="width:32px"></th>
              <th>Loan ID</th><th>Borrower</th><th>Amount</th><th>Completed</th>
            </tr></thead>
            <tbody>${eligibleRows || '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-text-muted)">No eligible loans</td></tr>'}</tbody>
          </table>
        </div>
      </div>` : '';

    const batchRows = batches.map(b => {
      const bVal  = b.loans.reduce((s, l) => s + (l?.amount || 0), 0);
      const bHom  = Display.currency(Math.round(bVal / 1000));
      const isExp = this._batchExpanded === b.id;

      const innerLoans = b.loans.map(l => l ? `
        <tr style="background:var(--color-surface)">
          <td colspan="2" style="padding-left:32px;font-size:12px;color:var(--color-primary);font-weight:600">${l.id}</td>
          <td style="font-size:12px">${l.borrowerName}</td>
          <td style="font-size:12px">${Display.currency(l.amount)}</td>
          <td colspan="3"></td>
        </tr>` : '').join('');

      return `
        <tr>
          <td style="font-size:12px;font-weight:700;color:var(--color-primary)">${b.id}</td>
          <td>${b.loans.length}</td>
          <td>${Display.currency(bVal)}</td>
          <td>${bHom}</td>
          <td>${Display.date(b.created)}</td>
          <td><span class="badge ${b.statusClass}">${b.status}</span></td>
          <td>
            <button class="btn btn-ghost btn-xs"
                    onclick="DataPlatformView._toggleBatch('${b.id}')">
              ${isExp ? 'Collapse' : 'View Loans'}
            </button>
          </td>
        </tr>
        ${isExp ? innerLoans : ''}`;
    }).join('');

    return `
      ${statsHtml}
      ${eligibleSection}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-size:15px;font-weight:600;color:var(--color-text)">All Batches</div>
        ${canCreate ? `<button class="btn btn-primary btn-sm">+ Create New Batch</button>` : ''}
      </div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Batch ID</th><th># Loans</th><th>Total Value</th><th>Est. HOM ($)</th>
            <th>Created</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>${batchRows}</tbody>
        </table>
      </div>`;
  },

  _toggleBatch(id) {
    this._batchExpanded = this._batchExpanded === id ? null : id;
    App.renderView('/data/batches');
  },

  /* ================================================================
     ACTIVATIONS
  ================================================================ */
  _renderActivations() {
    const activations = [
      { id: 'ACT-2025-003', batch: 'BATCH-2025-003', tokens: 788.7,  usd: 788700,  date: '2025-11-14', activatedBy: 'Jordan Lee',  status: 'Activated' },
      { id: 'ACT-2025-002', batch: 'BATCH-2025-002', tokens: 512.0,  usd: 512000,  date: '2025-09-22', activatedBy: 'Alex Morgan', status: 'Activated' },
      { id: 'ACT-2025-001', batch: 'BATCH-2025-001', tokens: 341.5,  usd: 341500,  date: '2025-07-08', activatedBy: 'Jordan Lee',  status: 'Activated' },
    ];

    const totalTokens = activations.reduce((s, a) => s + a.tokens, 0);
    const totalUSD    = activations.reduce((s, a) => s + a.usd, 0);

    const tokenSummary = `
      <div class="lop-token-cards" style="grid-template-columns:repeat(3,1fr);margin-bottom:24px">
        <div class="lop-token-card lop-token-card-dark">
          <div class="lop-token-card-ticker">HOM &nbsp;·&nbsp; Homium Class H</div>
          <div class="lop-token-card-price">$1.00000</div>
          <div class="lop-token-card-label">Current Price</div>
        </div>
        <div class="lop-token-card lop-token-card-light">
          <div class="lop-token-card-ticker">Total Homium Minted</div>
          <div class="lop-token-card-price" style="color:var(--color-primary)">${totalTokens.toFixed(1)}</div>
          <div class="lop-token-card-label">HOM tokens activated to date</div>
        </div>
        <div class="lop-token-card lop-token-card-light">
          <div class="lop-token-card-ticker">Total USD Activated</div>
          <div class="lop-token-card-price" style="color:var(--color-primary)">${Display.currency(totalUSD)}</div>
          <div class="lop-token-card-label">Cumulative activated value</div>
        </div>
      </div>`;

    const statsHtml = `
      <div class="stat-row" style="margin-bottom:24px">
        <div class="stat-item">
          <div class="stat-label">Total Activations</div>
          <div class="stat-value" style="font-size:26px">${activations.length}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Total HOM Minted</div>
          <div class="stat-value" style="font-size:26px">${totalTokens.toFixed(1)}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Total USD Value</div>
          <div class="stat-value" style="font-size:26px">${Display.currency(totalUSD)}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Last Activation</div>
          <div class="stat-value" style="font-size:20px">${Display.date(activations[0].date)}</div>
        </div>
      </div>`;

    const rows = activations.map(a => `
      <tr>
        <td style="font-size:12px;font-weight:700;color:var(--color-primary)">${a.id}</td>
        <td style="font-size:12px;color:var(--color-text-muted)">${a.batch}</td>
        <td><strong>${a.tokens.toFixed(1)}</strong> HOM</td>
        <td>${Display.currency(a.usd)}</td>
        <td>${Display.date(a.date)}</td>
        <td style="font-size:12px;color:var(--color-text-secondary)">${a.activatedBy}</td>
        <td><span class="badge badge-active">${a.status}</span></td>
        <td><button class="btn btn-ghost btn-xs">View</button></td>
      </tr>`).join('');

    return `
      ${tokenSummary}
      ${statsHtml}
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Activation ID</th><th>Batch</th><th>HOM Tokens</th><th>USD Value</th>
            <th>Activation Date</th><th>Activated By</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  /* ================================================================
     US MAP
  ================================================================ */
  _renderMap(loans) {
    const CITY_COORDS = {
      'Washington': { x: 598, y: 218 },
      'Louisville':  { x: 530, y: 235 },
      'Lexington':   { x: 548, y: 228 },
    };

    const cityData = {};
    loans.forEach(l => {
      const city = l.address.split(',')[1]?.trim() || '';
      const key  = Object.keys(CITY_COORDS).find(c => city.toLowerCase().includes(c.toLowerCase()));
      if (key) {
        if (!cityData[key]) cityData[key] = { count: 0, total: 0 };
        cityData[key].count++;
        cityData[key].total += l.amount;
      }
    });

    const dots = Object.entries(cityData).map(([city, data]) => {
      const c = CITY_COORDS[city];
      const r = Math.min(6 + data.count * 3, 16);
      return `
        <circle cx="${c.x}" cy="${c.y}" r="${r}" fill="var(--color-primary)" opacity="0.75" />
        <circle cx="${c.x}" cy="${c.y}" r="${r + 4}" fill="var(--color-primary)" opacity="0.15" />
        <title>${city}: ${data.count} loan${data.count > 1 ? 's' : ''} · ${Display.currency(data.total)}</title>`;
    }).join('');

    const usPath = `M 150,120 L 155,95 L 170,85 L 200,80 L 230,75 L 260,70 L 290,68 L 320,65 L 350,63 L 380,62 L 420,62 L 460,64 L 490,68 L 510,72 L 530,70 L 560,65 L 590,62 L 620,65 L 650,70 L 670,80 L 680,95 L 685,110 L 682,130 L 675,148 L 665,162 L 655,175 L 648,190 L 642,210 L 638,225 L 640,240 L 644,255 L 648,265 L 645,278 L 635,290 L 620,298 L 600,302 L 580,305 L 560,308 L 535,312 L 510,315 L 485,318 L 460,318 L 435,315 L 410,310 L 385,305 L 360,300 L 335,295 L 310,290 L 285,282 L 262,272 L 242,260 L 228,248 L 215,235 L 205,220 L 195,205 L 183,192 L 170,178 L 158,160 L 150,145 Z`;

    return `
      <div style="background:#F8F7F2;border-radius:6px;overflow:hidden;padding:8px">
        <svg viewBox="0 0 800 400" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
          <path d="${usPath}" fill="#E8E6E0" stroke="#C8C5BE" stroke-width="1.5" />
          <line x1="420" y1="62" x2="415" y2="318" stroke="#D4D1CA" stroke-width="0.8" opacity="0.5"/>
          <line x1="530" y1="70" x2="535" y2="312" stroke="#D4D1CA" stroke-width="0.8" opacity="0.5"/>
          <line x1="310" y1="65" x2="310" y2="290" stroke="#D4D1CA" stroke-width="0.8" opacity="0.5"/>
          ${dots}
        </svg>
        <div style="display:flex;gap:16px;flex-wrap:wrap;padding:4px 4px 0">
          ${Object.entries(cityData).map(([city, d]) => `
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--color-text-secondary)">
              <span style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);display:inline-block;opacity:0.75"></span>
              ${city} (${d.count})
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ================================================================
     NEW APPLICATION MODAL
  ================================================================ */
  _openNewAppModal() {
    const el = document.getElementById('dp-modal');
    if (!el) return;
    el.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)DataPlatformView._closeModal()">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">New Application</div>
              <div class="modal-subtitle">Start a Home Equity Investment origination</div>
            </div>
            <button class="modal-close" onclick="DataPlatformView._closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Borrower Full Name *</label>
                <input class="input" id="dp-new-borrower" placeholder="Jane & John Smith" />
              </div>
              <div class="form-group form-full">
                <label>Property Address *</label>
                <input class="input" id="dp-new-address" placeholder="123 Main St, Nashville, TN 37201" />
              </div>
              <div class="form-group">
                <label>HEI Amount ($) *</label>
                <input class="input" id="dp-new-amount" type="number" placeholder="150000" />
              </div>
              <div class="form-group">
                <label>Program *</label>
                <select class="select-input" id="dp-new-program">
                  <option value="DC Dream Fund">DC Dream Fund</option>
                  <option value="Kentucky Dream Fund">Kentucky Dream Fund</option>
                  <option value="Standard HEI">Standard HEI</option>
                  <option value="Jumbo HEI">Jumbo HEI</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="DataPlatformView._closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="DataPlatformView._submitNew()">Create Draft</button>
          </div>
        </div>
      </div>`;
  },

  _submitNew() {
    const borrower = document.getElementById('dp-new-borrower')?.value.trim();
    const address  = document.getElementById('dp-new-address')?.value.trim();
    const amount   = parseInt(document.getElementById('dp-new-amount')?.value) || 0;
    const program  = document.getElementById('dp-new-program')?.value;
    const user     = State.getCurrentUser();
    if (!borrower || !address || !amount) { alert('Please fill in all required fields.'); return; }
    const id = `ORG-2026-${String(Math.floor(Math.random() * 9000 + 1000))}`;
    State.getLoans().push({ id, companyId: user?.companyId, branchId: user?.branchId, loId: user?.id, borrowerName: borrower, address, amount, program, status: 'draft', ltv: null, submittedAt: null, cltv: null });
    this._closeModal();
    App.renderView('/data/applications');
  },

  _closeModal() {
    const el = document.getElementById('dp-modal');
    if (el) el.innerHTML = '';
  },
};
