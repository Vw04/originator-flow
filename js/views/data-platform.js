/* ============================================================
   HOMIUM ORIGINATOR FLOW — Data Platform View
   Dashboard, Applications, Originations, Batches, Activations
   ============================================================ */

const DataPlatformView = {

  _activeTab: 'analytics',
  _selectedApplicationId: null,
  _activeStep: 4,
  _activeAppTab: 'overview',
  _expandedAppStages: new Set(),
  _appFilter: 'all',
  _appSearch: '',
  _appSortField: null,
  _appSortDir: 'asc',
  _appPage: 0,
  _appPageSize: 15,
  _appSelected: new Set(),
  _batchExpanded: null,
  _dashProgramFilter: 'all',
  _dashCollapsedCompanies: [],

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
      { key: 'batches',      label: 'Batches' },
      { key: 'activations',  label: 'Activations' },
    ];
    if (role === 'prog_admin') return all.slice(0, 2);
    if (role === 'lo')         return [all[1]];
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
    this._activeAppTab = 'overview';
    this._expandedAppStages = new Set();
    App.renderView('/data/applications');
  },

  selectStep(idx) {
    this._activeStep = idx;
    App.renderView('/data/applications');
  },

  switchAppTab(tab) {
    this._activeAppTab = tab;
    App.renderView('/data/applications');
  },

  toggleAppStage(stageId) {
    if (this._expandedAppStages.has(stageId)) this._expandedAppStages.delete(stageId);
    else this._expandedAppStages.add(stageId);
    App.renderView('/data/applications');
  },

  _setDashProgramFilter(prog) {
    this._dashProgramFilter = prog;
    App.renderView('/data/analytics');
  },

  _toggleDashCompany(coId) {
    const idx = this._dashCollapsedCompanies.indexOf(coId);
    if (idx === -1) this._dashCollapsedCompanies.push(coId);
    else this._dashCollapsedCompanies.splice(idx, 1);
    App.renderView('/data/analytics');
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
      { label: 'Active Pipeline',      value: Display.currency(active.reduce((s,l)=>s+l.amount,0)), sub: `${active.length} loan${active.length!==1?'s':''} in progress` },
      { label: 'Submitted This Month', value: thisMonth.length,                                      sub: thisMonth.length ? Display.currency(thisMonth.reduce((s,l)=>s+l.amount,0)) : '$0 value' },
      { label: 'Completed',            value: completed.length,                                      sub: completed.length ? Display.currency(completed.reduce((s,l)=>s+l.amount,0)) + ' closed' : '$0 closed' },
      { label: 'Avg Days to Close',    value: '45',                                                  sub: 'Industry avg: 49 days' },
      { label: 'On-Track Rate',        value: onTrackPct + '%',                                      sub: stalledLoans.length > 0 ? `${stalledLoans.length} loan${stalledLoans.length!==1?'s':''} stalled` : 'All loans on track', accent: onTrackPct < 80, accentColor: 'var(--color-danger)' },
    ];
    const kpiHtml = `<div class="lop-kpi-cards" style="grid-template-columns:repeat(5,1fr)">${
      kpis.map(k => `
        <div class="lop-kpi-card">
          <div class="lop-kpi-value" style="${k.accent ? `color:${k.accentColor}` : ''}">${k.value}</div>
          <div class="lop-kpi-label">${k.label}</div>
          <div class="lop-kpi-sub">${k.sub}</div>
        </div>`).join('')
    }</div>`;

    const STAGE_DEFS = [
      { label: 'Prequalification', statuses: ['prequalification_in_progress'],  color: '#94A3B8' },
      { label: 'Submitted',        statuses: ['initial_application_submitted'],  color: '#60A5FA' },
      { label: 'Docs / Appraisal', statuses: ['application_documents_approved','original_appraisal_submitted'], color: '#34D399' },
      { label: 'In Origination',   statuses: ['sent_to_docutech','pending_origination_creation','origination_created'], color: '#FBBF24' },
      { label: 'Completed',        statuses: ['completed'],                      color: '#1D3D2A' },
    ];

    /* ── Section 2: Requires Attention (full width, most prominent) ── */
    const attnSection = isInvestor ? '' : `
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div class="card-title" style="margin-bottom:0">Requires Attention</div>
          ${stalledLoans.length > 0
            ? `<span style="background:#FEE2E2;color:#DC2626;font-size:11px;font-weight:700;padding:2px 10px;border-radius:10px">${stalledLoans.length} loan${stalledLoans.length!==1?'s':''} stalled</span>`
            : `<span style="background:#D1FAE5;color:#065F46;font-size:11px;font-weight:700;padding:2px 10px;border-radius:10px">All on track</span>`}
        </div>
        ${stalledLoans.length ? `
          <div class="table-container">
            <table>
              <thead><tr>
                <th>Loan / Borrower</th>
                <th>Program</th>
                <th>Stage</th>
                <th>Days Stalled</th>
                <th>Amount</th>
                <th>Next Action</th>
              </tr></thead>
              <tbody>
                ${stalledLoans.map(l => `
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
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>` : `
          <div class="dash-attn-ok">
            <span style="color:var(--color-success);font-weight:700;font-size:14px">&#10003;</span>
            All loans are on track — no loans stalled over 14 days.
          </div>`}
      </div>`;

    /* ── Section 3: Pipeline by Stage with program filter ── */
    const programs = [...new Set(loans.map(l => l.program))].filter(Boolean);
    const progFilter  = this._dashProgramFilter || 'all';
    const filteredLoans = progFilter === 'all' ? loans : loans.filter(l => l.program === progFilter);
    const stageCounts = STAGE_DEFS.map(s => ({
      ...s,
      loans: filteredLoans.filter(l => s.statuses.includes(l.status)),
    }));
    const maxCount = Math.max(1, ...stageCounts.map(s => s.loans.length));

    const progTabsHtml = [{ key: 'all', label: 'All Programs' }, ...programs.map(p => ({ key: p, label: p }))]
      .map(t => `<button class="dash-prog-tab ${progFilter === t.key ? 'active' : ''}"
                         onclick="DataPlatformView._setDashProgramFilter('${t.key}')">${t.label}</button>`).join('');

    let progMetricsHtml = '';
    if (progFilter !== 'all') {
      const pActive  = filteredLoans.filter(l => l.status !== 'draft' && l.status !== 'completed');
      const pVal     = filteredLoans.reduce((s,l) => s+l.amount, 0);
      const ltvL     = filteredLoans.filter(l => l.ltv);
      const avgLTV   = ltvL.length ? (ltvL.reduce((s,l)=>s+l.ltv,0)/ltvL.length).toFixed(1)+'%' : '—';
      const pStalled = pActive.filter(l => this._daysInStage(l) > 14).length;
      const pDone    = filteredLoans.filter(l => l.status === 'completed').length;
      progMetricsHtml = `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;padding:12px 16px;background:var(--color-surface);border-radius:8px">
          <div>
            <div style="font-size:20px;font-weight:700;color:var(--color-text)">${pActive.length}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">Active Loans</div>
          </div>
          <div>
            <div style="font-size:20px;font-weight:700;color:var(--color-text)">${Display.currency(pVal)}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">Pipeline Value</div>
          </div>
          <div>
            <div style="font-size:20px;font-weight:700;color:var(--color-text)">${avgLTV}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">Avg LTV</div>
          </div>
          <div>
            <div style="font-size:20px;font-weight:700;color:${pStalled > 0 ? 'var(--color-danger)' : 'var(--color-success)'}">${pStalled > 0 ? pStalled + ' stalled' : pDone + ' done'}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">${pStalled > 0 ? 'Need attention' : 'Completed'}</div>
          </div>
        </div>`;
    }

    const pipelineSection = isInvestor ? '' : `
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="card-title" style="margin-bottom:0">Pipeline by Stage</div>
          <div class="dash-prog-tabs">${progTabsHtml}</div>
        </div>
        ${progMetricsHtml}
        <div class="horiz-stage-chart">
          ${stageCounts.map(s => {
            const pct = Math.round((s.loans.length / maxCount) * 100);
            const val = s.loans.reduce((acc, l) => acc + l.amount, 0);
            return `
              <div class="horiz-stage-row">
                <div class="horiz-stage-label">${s.label}</div>
                <div class="horiz-stage-track">
                  <div class="horiz-stage-bar" style="width:${s.loans.length > 0 ? Math.max(pct, 3) : 0}%;background:${s.color}"></div>
                </div>
                <div class="horiz-stage-count">${s.loans.length}</div>
                <div class="horiz-stage-value">${val ? Display.currency(Math.round(val / 1000)) + 'k' : '—'}</div>
              </div>`;
          }).join('')}
        </div>
      </div>`;

    /* ── Section 4: Company & Branch Performance (collapsible) ── */
    const branchSection = isInvestor ? '' : (() => {
      const companies   = State.getCompanies();
      const allBranches = State.getBranches();
      const collapsed   = this._dashCollapsedCompanies;

      const rows = companies.map(co => {
        const coBranches = allBranches.filter(b => b.companyId === co.id);
        const coLoans    = loans.filter(l => l.companyId === co.id);
        const coActive   = coLoans.filter(l => l.status !== 'draft' && l.status !== 'completed');
        const coVal      = coActive.reduce((s,l) => s+l.amount, 0);
        const coStalled  = coActive.filter(l => this._daysInStage(l) > 14).length;
        const coLtvL     = coActive.filter(l => l.ltv);
        const coAvgLTV   = coLtvL.length ? (coLtvL.reduce((s,l)=>s+l.ltv,0)/coLtvL.length).toFixed(1)+'%' : '—';
        const coOnTrack  = coActive.filter(l => this._daysInStage(l) <= 14).length;
        const isCollapsed = collapsed.includes(co.id);

        const branchRows = isCollapsed ? '' : coBranches.map(b => {
          const bActive  = loans.filter(l => l.branchId === b.id && l.status !== 'draft' && l.status !== 'completed');
          const bOnTrack = bActive.filter(l => this._daysInStage(l) <= 14).length;
          const ltvB     = bActive.filter(l => l.ltv);
          const avgLTV   = ltvB.length ? (ltvB.reduce((s,l)=>s+l.ltv,0)/ltvB.length).toFixed(1)+'%' : '—';
          const bVal     = bActive.reduce((s,l) => s+l.amount, 0);
          return `
            <tr class="dash-branch-row">
              <td style="padding-left:36px">
                <span style="font-size:12px;color:var(--color-text-secondary)">${b.name}</span>
              </td>
              <td style="font-size:12px;text-align:center">${bActive.length || '—'}</td>
              <td style="font-size:12px">${bVal ? Display.currency(bVal) : '—'}</td>
              <td style="font-size:12px;text-align:center">
                <span style="color:${bActive.length > 0 && bOnTrack === bActive.length ? 'var(--color-success)' : bActive.length > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)'}">
                  ${bActive.length > 0 ? bOnTrack + '/' + bActive.length : '—'}
                </span>
              </td>
              <td style="font-size:12px">${avgLTV}</td>
              <td></td>
            </tr>`;
        }).join('');

        return `
          <tr class="dash-co-row" onclick="DataPlatformView._toggleDashCompany('${co.id}')">
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="dash-co-caret">${isCollapsed ? '&#9654;' : '&#9660;'}</span>
                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--color-text)">${co.name}</div>
                  <div style="font-size:11px;color:var(--color-text-muted);margin-top:1px">${co.state || ''} &middot; ${coBranches.length} branch${coBranches.length!==1?'es':''}</div>
                </div>
              </div>
            </td>
            <td style="font-size:13px;font-weight:700;text-align:center">${coActive.length || '—'}</td>
            <td style="font-size:13px;font-weight:700">${coVal ? Display.currency(coVal) : '—'}</td>
            <td style="text-align:center">
              <span style="font-size:12px;color:${coActive.length > 0 && coOnTrack === coActive.length ? 'var(--color-success)' : coActive.length > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)'}">
                ${coActive.length > 0 ? coOnTrack + '/' + coActive.length : '—'}
              </span>
            </td>
            <td style="font-size:12px">${coAvgLTV}</td>
            <td style="text-align:right">${coStalled > 0 ? `<span style="background:#FEE2E2;color:#DC2626;font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px">${coStalled} stalled</span>` : ''}</td>
          </tr>
          ${branchRows}`;
      }).join('');

      return `
        <div class="card" style="margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
            <div class="card-title" style="margin-bottom:0">Company &amp; Branch Performance</div>
            <span style="font-size:11px;color:var(--color-text-muted)">Click company to collapse branches</span>
          </div>
          <div class="table-container">
            <table>
              <thead><tr>
                <th>Company / Branch</th>
                <th style="text-align:center">Active Loans</th>
                <th>Pipeline Value</th>
                <th style="text-align:center">On-Track</th>
                <th>Avg LTV</th>
                <th></th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
    })();

    const poolSummarySection = this._renderPoolSummary();

    return `
      ${kpiHtml}
      ${poolSummarySection}
      ${pipelineSection}
      ${attnSection}
      ${branchSection}`;
  },

  /* ================================================================
     POOL SUMMARY & ANALYTICS
  ================================================================ */
  _renderPoolSummary() {
    const pool = State.getPoolSummary();

    /* ── Color interpolation for map ── */
    const stateValues = Object.values(pool.stateData).map(s => s.totalValue);
    const minVal = Math.min(...stateValues);
    const maxVal = Math.max(...stateValues);
    const stops = [[232,245,233],[165,214,167],[102,187,106],[46,125,50],[29,61,42]];
    function getStateColor(value) {
      const t = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal)));
      const idx = t * (stops.length - 1);
      const lo = Math.floor(idx);
      const hi = Math.min(lo + 1, stops.length - 1);
      const f = idx - lo;
      const r = Math.round(stops[lo][0] + (stops[hi][0] - stops[lo][0]) * f);
      const g = Math.round(stops[lo][1] + (stops[hi][1] - stops[lo][1]) * f);
      const b = Math.round(stops[lo][2] + (stops[hi][2] - stops[lo][2]) * f);
      return `rgb(${r},${g},${b})`;
    }

    /* ── Header ── */
    const headerHtml = `
      <div class="pool-summary-header">
        <div class="pool-summary-header-left">
          <div class="card-title">Homium SAN Pool Summary</div>
          <span class="pool-filter-chip">
            <span class="pool-filter-chip-x">&times;</span>
            In Progress Applications: Included
          </span>
        </div>
        <button class="pool-filter-btn">
          Filters (1)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
        </button>
      </div>`;

    /* ── Metrics grid ── */
    const metrics = [
      { label: 'Average Loan Size',                  value: Display.currency(pool.avgLoanSize) },
      { label: 'Total Number of Loans',              value: pool.totalLoans.toLocaleString() },
      { label: 'Total Loan Value (QV)',              value: Display.currency(pool.totalLoanValueQV) },
      { label: 'Total Underlying Property Value (FMV)', value: Display.currency(pool.totalPropertyValueFMV) },
      { label: 'Weighted Average Age (Months)',      value: pool.weightedAvgAgeMonths.toFixed(1) },
      { label: 'Weighted Average Original FICO',     value: pool.weightedAvgFICO.toFixed(1) },
      { label: 'Weighted Average Original LTV',      value: pool.weightedAvgLTV.toFixed(1) + '%' },
      { label: 'Weighted Average Original CLTV',     value: pool.weightedAvgCLTV.toFixed(1) + '%' },
    ];
    const metricsHtml = `
      <div class="san-pool-grid">
        ${metrics.map(m => `
          <div>
            <div class="san-pool-stat-label">${m.label} <span class="pool-info-icon" title="${m.label}">?</span></div>
            <div class="san-pool-stat-value">${m.value}</div>
          </div>`).join('')}
      </div>`;

    /* ── US Map ── */
    const statePathsHtml = Object.entries(US_STATE_PATHS).map(([abbr, path]) => {
      const data = pool.stateData[abbr];
      const fill = data ? getStateColor(data.totalValue) : '#F0EFE9';
      const name = US_STATE_NAMES[abbr] || abbr;
      const title = data
        ? `${name}: ${data.loans} loan${data.loans !== 1 ? 's' : ''}, ${Display.currency(data.totalValue)}`
        : name;
      return `<path d="${path}" fill="${fill}"><title>${title}</title></path>`;
    }).join('\n');

    const legendSteps = 4;
    const legendLabels = [];
    for (let i = 0; i <= legendSteps; i++) {
      const val = minVal + (maxVal - minVal) * (i / legendSteps);
      legendLabels.push(val >= 1000000
        ? '$' + (val / 1000000).toFixed(2) + 'M'
        : '$' + (val / 1000).toFixed(2) + 'K');
    }

    const mapHtml = `
      <div class="pool-map-container">
        <div class="pool-map-title">Homium Loan By Location</div>
        <div class="pool-map-wrap">
          <div class="pool-map-svg-wrap">
            <svg class="pool-map-svg" viewBox="0 0 960 620" preserveAspectRatio="xMidYMid meet">
              ${statePathsHtml}
            </svg>
          </div>
          <div class="pool-map-legend">
            <div class="pool-map-legend-title">Total Loan Value (QV)</div>
            <div style="display:flex;gap:4px;align-items:stretch">
              <div class="pool-map-legend-labels">
                ${legendLabels.reverse().map(l => `
                  <div class="pool-map-legend-row">
                    <span>${l}</span>
                    <span class="pool-map-legend-tick"></span>
                  </div>`).join('')}
              </div>
              <div class="pool-map-legend-bar"></div>
            </div>
          </div>
        </div>
      </div>`;

    /* ── Helper: horizontal bar chart ── */
    function renderBarChart(title, data, colors) {
      const maxVal = Math.max(...data.map(d => d.value));
      const xSteps = 5;
      const xLabels = [];
      for (let i = 0; i <= xSteps; i++) {
        const v = (maxVal / xSteps) * i;
        xLabels.push(v >= 1000000 ? '$' + (v / 1000000).toFixed(1) + 'M'
                   : v >= 1000    ? '$' + Math.round(v / 1000).toLocaleString() + 'K'
                   : '$' + Math.round(v));
      }

      const rows = data.map(d => {
        const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
        if (d.value2 !== undefined) {
          const pct1 = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
          const pct2 = maxVal > 0 ? (d.value2 / maxVal) * 100 : 0;
          return `
            <div class="pool-bar-row">
              <div class="pool-bar-label">${d.label}</div>
              <div class="pool-bar-track">
                <div class="pool-bar-fill pool-bar-fill-gold" style="width:${Math.max(pct1, 0.5)}%"></div>
                <div class="pool-bar-fill pool-bar-fill-blue" style="width:${Math.max(pct2, 0.5)}%"></div>
              </div>
            </div>`;
        }
        const colorClass = colors || 'pool-bar-fill-blue';
        return `
          <div class="pool-bar-row">
            <div class="pool-bar-label">${d.label}</div>
            <div class="pool-bar-track">
              <div class="pool-bar-fill ${colorClass}" style="width:${Math.max(pct, 1)}%"></div>
            </div>
          </div>`;
      }).join('');

      return `
        <div class="pool-chart-card">
          <div class="pool-chart-title">${title}</div>
          ${rows}
          <div class="pool-chart-xaxis">
            ${xLabels.map(l => `<span>${l}</span>`).join('')}
          </div>
        </div>`;
    }

    /* ── Vintage chart (stacked gold + blue) ── */
    const vintageData = pool.vintageData.map(d => ({
      label: d.label,
      value: Math.round(d.value * 0.15),
      value2: Math.round(d.value * 0.85),
    }));
    const vintageMax = Math.max(...vintageData.map(d => d.value + d.value2));
    const vintageRows = vintageData.map(d => {
      const pct1 = vintageMax > 0 ? (d.value / vintageMax) * 100 : 0;
      const pct2 = vintageMax > 0 ? (d.value2 / vintageMax) * 100 : 0;
      return `
        <div class="pool-bar-row">
          <div class="pool-bar-label">${d.label}</div>
          <div class="pool-bar-track">
            <div class="pool-bar-fill pool-bar-fill-gold" style="width:${Math.max(pct1, 0.5)}%"></div>
            <div class="pool-bar-fill pool-bar-fill-blue" style="width:${Math.max(pct2, 0.5)}%"></div>
          </div>
        </div>`;
    }).join('');
    const vintXSteps = 5;
    const vintXLabels = [];
    for (let i = 0; i <= vintXSteps; i++) {
      const v = (vintageMax / vintXSteps) * i;
      vintXLabels.push(v >= 1000000 ? '$' + (v / 1000000).toFixed(1) + 'M'
                     : v >= 1000    ? '$' + Math.round(v / 1000).toLocaleString() + 'K'
                     : '$' + Math.round(v));
    }
    const vintageChart = `
      <div class="pool-chart-card">
        <div class="pool-chart-title">Loan Vintage (Application Date)</div>
        ${vintageRows}
        <div class="pool-chart-xaxis">
          ${vintXLabels.map(l => `<span>${l}</span>`).join('')}
        </div>
      </div>`;

    const ltvChart    = renderBarChart('LTV Range', pool.ltvRangeData);
    const ficoChart   = renderBarChart('FICO Range', pool.ficoRangeData);
    const incomeChart = renderBarChart('Household Annual Income', pool.incomeRangeData);

    const chartsHtml = `
      <div class="pool-charts-grid">
        ${vintageChart}
        ${ltvChart}
        ${ficoChart}
        ${incomeChart}
      </div>`;

    return `
      <div class="card" style="margin-bottom:20px">
        ${headerHtml}
        ${metricsHtml}
        ${mapHtml}
        ${chartsHtml}
      </div>`;
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

    // Sorting
    if (this._appSortField) {
      const dir = this._appSortDir === 'asc' ? 1 : -1;
      filtered = [...filtered].sort((a, b) => {
        let va, vb;
        switch (this._appSortField) {
          case 'id':       va = a.id; vb = b.id; break;
          case 'borrower': va = a.borrowerName; vb = b.borrowerName; break;
          case 'amount':   va = a.amount; vb = b.amount; return (va - vb) * dir;
          case 'days':     va = this._daysInStage(a); vb = this._daysInStage(b); return (va - vb) * dir;
          case 'progress': va = this._loanStep(a); vb = this._loanStep(b); return (va - vb) * dir;
          case 'updated':  va = a.submittedAt || ''; vb = b.submittedAt || ''; break;
          default: return 0;
        }
        return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
      });
    }

    // Pagination
    const totalPages = Math.ceil(filtered.length / this._appPageSize);
    if (this._appPage >= totalPages) this._appPage = Math.max(0, totalPages - 1);
    const pageStart = this._appPage * this._appPageSize;
    const pageLoans = filtered.slice(pageStart, pageStart + this._appPageSize);

    const allChecked = pageLoans.length > 0 && pageLoans.every(l => this._appSelected.has(l.id));
    const someChecked = this._appSelected.size > 0;

    const rows = pageLoans.map((l, i) => {
      const step     = this._loanStep(l);
      const days     = this._daysInStage(l);
      const attn     = days > 14 && l.status !== 'completed' && l.status !== 'draft';
      const lo       = State.getUser(l.loId);
      const loName   = lo ? Display.fullName(lo) : '—';
      const dots     = Array.from({length: 9}, (_, di) =>
        `<span class="loan-progress-dot ${di < step ? 'done' : di === step ? 'current' : ''}"></span>`
      ).join('');
      const checked  = this._appSelected.has(l.id);
      const timeAgo  = l.submittedAt ? Display.relativeTime(l.submittedAt) : '—';

      return `
        <tr class="${attn ? 'row-needs-attention' : ''}" style="cursor:pointer"
            onclick="DataPlatformView.openApplication('${l.id}')">
          <td onclick="event.stopPropagation()">
            <input type="checkbox" ${checked ? 'checked' : ''} style="accent-color:var(--color-primary)"
                   onchange="DataPlatformView._toggleSelect('${l.id}')" />
          </td>
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
          <td style="font-size:11px;color:var(--color-text-muted);white-space:nowrap">${timeAgo}</td>
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
      ${someChecked ? `
      <div class="app-bulk-bar">
        <span style="font-size:12px;font-weight:600;color:var(--color-text)">${this._appSelected.size} selected</span>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation()">Export</button>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation()">Batch</button>
        <button class="btn btn-ghost btn-sm" onclick="DataPlatformView._clearSelection()">Clear</button>
      </div>` : ''}
      <div class="table-container">
        <table>
          <thead><tr>
            <th style="width:32px" onclick="event.stopPropagation()">
              <input type="checkbox" ${allChecked ? 'checked' : ''} style="accent-color:var(--color-primary)"
                     onchange="DataPlatformView._toggleSelectAll()" />
            </th>
            <th class="sortable-th" onclick="DataPlatformView._setSort('id')">Loan / Borrower ${this._sortIcon('id')}</th>
            <th>Address</th>
            <th class="sortable-th" onclick="DataPlatformView._setSort('progress')">Progress ${this._sortIcon('progress')}</th>
            <th class="sortable-th" onclick="DataPlatformView._setSort('days')">Days in Stage ${this._sortIcon('days')}</th>
            <th>Next Action</th>
            <th class="sortable-th" onclick="DataPlatformView._setSort('borrower')">Loan Officer ${this._sortIcon('borrower')}</th>
            <th class="sortable-th" onclick="DataPlatformView._setSort('amount')">Amount ${this._sortIcon('amount')}</th>
            <th class="sortable-th" onclick="DataPlatformView._setSort('updated')">Updated ${this._sortIcon('updated')}</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="10" style="text-align:center;color:var(--color-text-muted);padding:32px">No applications found</td></tr>'}</tbody>
        </table>
      </div>
      ${totalPages > 1 ? `
      <div class="app-pagination">
        <button class="btn btn-ghost btn-sm" ${this._appPage === 0 ? 'disabled' : ''} onclick="DataPlatformView._setPage(${this._appPage - 1})">← Prev</button>
        <span class="app-pagination-info">Page ${this._appPage + 1} of ${totalPages} · ${filtered.length} loans</span>
        <button class="btn btn-ghost btn-sm" ${this._appPage >= totalPages - 1 ? 'disabled' : ''} onclick="DataPlatformView._setPage(${this._appPage + 1})">Next →</button>
      </div>` : `<div class="app-pagination"><span class="app-pagination-info">${filtered.length} loan${filtered.length !== 1 ? 's' : ''}</span></div>`}
      <div id="dp-modal"></div>`;
  },

  _setFilter(f) { this._appFilter = f; this._appPage = 0; this._appSelected.clear(); App.renderView('/data/applications'); },
  _setSearch(v) { this._appSearch = v; this._appPage = 0; App.renderView('/data/applications'); },
  _setSort(field) {
    if (this._appSortField === field) {
      this._appSortDir = this._appSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._appSortField = field;
      this._appSortDir = 'asc';
    }
    App.renderView('/data/applications');
  },
  _sortIcon(field) {
    if (this._appSortField !== field) return '<span class="sort-icon">⇅</span>';
    return `<span class="sort-icon active">${this._appSortDir === 'asc' ? '↑' : '↓'}</span>`;
  },
  _setPage(p) { this._appPage = p; App.renderView('/data/applications'); },
  _toggleSelect(id) {
    if (this._appSelected.has(id)) this._appSelected.delete(id);
    else this._appSelected.add(id);
    App.renderView('/data/applications');
  },
  _toggleSelectAll() {
    const role = State.getRole();
    const user = State.getCurrentUser();
    const allLoans = (role === 'lo' || role === 'lp') ? State.getLoansByLO(user?.id) : State.getLoans();
    let filtered = allLoans;
    if (this._appFilter === 'needs_action') filtered = filtered.filter(l => this._daysInStage(l) > 14 && l.status !== 'completed' && l.status !== 'draft');
    else if (this._appFilter === 'in_review') filtered = filtered.filter(l => ['application_documents_approved','original_appraisal_submitted','sent_to_docutech','pending_origination_creation'].includes(l.status));
    else if (this._appFilter === 'completed') filtered = filtered.filter(l => l.status === 'completed');
    const pageLoans = filtered.slice(this._appPage * this._appPageSize, (this._appPage + 1) * this._appPageSize);
    const allChecked = pageLoans.every(l => this._appSelected.has(l.id));
    if (allChecked) pageLoans.forEach(l => this._appSelected.delete(l.id));
    else pageLoans.forEach(l => this._appSelected.add(l.id));
    App.renderView('/data/applications');
  },
  _clearSelection() { this._appSelected.clear(); App.renderView('/data/applications'); },

  /* ================================================================
     LOAN WARNINGS (derived from loan data)
  ================================================================ */
  _deriveLoanWarnings(loan, rateLockDate, estCloseDate) {
    const warnings = [];
    const step = this._loanStep(loan);
    const daysInStage = loan.submittedAt
      ? Math.floor((Date.now() - new Date(loan.submittedAt).getTime()) / 86400000)
      : 0;

    // Rate lock expiring soon
    if (rateLockDate) {
      const rlDate = new Date(rateLockDate);
      const daysUntilRL = Math.floor((rlDate - Date.now()) / 86400000);
      if (daysUntilRL < 0) {
        warnings.push({ icon: '⚠', msg: 'Rate lock has expired', severity: 'danger', action: 'Review pricing', stepIdx: 5 });
      } else if (daysUntilRL <= 7) {
        warnings.push({ icon: '⏱', msg: `Rate lock expires in ${daysUntilRL} day${daysUntilRL !== 1 ? 's' : ''}`, severity: 'warning', action: 'Extend or close', stepIdx: 5 });
      }
    }

    // Stalled in stage
    if (daysInStage > 14 && step < 8) {
      warnings.push({ icon: '◷', msg: `${daysInStage} days in current stage`, severity: 'warning', action: 'Review progress', stepIdx: step });
    }

    // Missing conditions (steps 2-3)
    if (step === 2 || step === 3) {
      warnings.push({ icon: '◔', msg: 'Outstanding conditions need attention', severity: 'info', action: 'View conditions', stepIdx: 2 });
    }

    // Close date approaching
    if (estCloseDate) {
      const cdDate = new Date(estCloseDate);
      const daysUntilClose = Math.floor((cdDate - Date.now()) / 86400000);
      if (daysUntilClose <= 14 && daysUntilClose > 0 && step < 7) {
        warnings.push({ icon: '📅', msg: `Closing in ${daysUntilClose} days — not yet in final review`, severity: 'warning', action: 'Expedite', stepIdx: 7 });
      }
    }

    return warnings;
  },

  _renderWarningsPanel(warnings) {
    if (!warnings.length) return '';
    const severityDot = { danger: 'notif-dot-action', warning: 'notif-dot-action', info: 'notif-dot-info' };
    const items = warnings.map(w => `
      <div class="app-comms-item" style="padding:6px 0">
        <span class="notif-dot ${severityDot[w.severity] || 'notif-dot-info'}" style="margin-top:3px;flex-shrink:0"></span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:var(--color-text)">${w.icon} ${w.msg}</div>
          <a style="font-size:11px;color:var(--color-primary);cursor:pointer;text-decoration:none"
             onclick="DataPlatformView.selectStep(${w.stepIdx})">${w.action} →</a>
        </div>
      </div>`).join('');

    return `
      <div class="app-comms-panel" style="margin-bottom:16px;border-color:var(--color-warning);background:rgba(217,119,6,0.04)">
        <div class="app-comms-section-title" style="color:var(--color-warning)">Needs Attention</div>
        ${items}
      </div>`;
  },

  /* ================================================================
     STEP-CONTEXTUAL DOCUMENT & CONDITION HELPERS
     Each step shows only what's needed for that phase.
  ================================================================ */
  _renderStepDocs(docs) {
    const statusBadge = { received: 'badge-active', pending: 'badge-pending', sent: 'badge-submitted' };
    const statusLabel = { received: 'Received', pending: 'Pending', sent: 'Sent' };
    return docs.map(d => `
      <div class="app-condition-row" style="justify-content:space-between">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;color:var(--color-text)">${d.name}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">${d.date || 'Not yet received'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="tag" style="font-size:10px">${d.party}</span>
          <span class="badge ${statusBadge[d.status]}" style="font-size:10px">${statusLabel[d.status]}</span>
        </div>
      </div>`).join('');
  },

  _renderStepConditions(conditions) {
    const statusClass = { Accepted: 'badge-active', Pending: 'badge-pending', 'In Review': 'badge-submitted' };
    return conditions.map(c => `
      <div class="condition-row-enhanced" onclick="this.querySelector('.condition-expand').classList.toggle('open')">
        <div class="condition-row-main">
          <input type="checkbox" ${c.done ? 'checked' : ''} onclick="return false" style="accent-color:var(--color-primary);flex-shrink:0" />
          <span style="flex:1;font-size:13px;color:${c.done ? 'var(--color-text)' : 'var(--color-text-secondary)'}">${c.label}</span>
          <span class="tag" style="font-size:10px">${c.party}</span>
          <span class="badge ${statusClass[c.status] || 'badge-pending'}" style="font-size:10px">${c.status}</span>
          <span style="font-size:11px;color:var(--color-text-muted);cursor:pointer">▾</span>
        </div>
        <div class="condition-expand">
          ${c.doc ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="font-size:11px;color:var(--color-text-secondary)">📄 ${c.doc}</span>
            <span class="badge badge-active" style="font-size:9px">Reviewed ✓</span>
          </div>` : ''}
          ${c.notes ? `<div style="font-size:11px;color:var(--color-text-muted)">${c.notes}</div>` : ''}
        </div>
      </div>`).join('');
  },

  /* ================================================================
     REUSABLE ENRICHMENT HELPERS
  ================================================================ */

  /** Enhanced document table with upload zones */
  _renderUploadDocTable(docs) {
    const rows = docs.map(d => {
      const isPending = d.status === 'Pending Upload' || d.status === 'pending';
      const isApproved = d.status === 'Approved' || d.status === 'received';
      const statusClass = isApproved ? 'badge-active' : 'badge-pending';
      const statusLabel = isApproved ? (d.status === 'received' ? 'Received' : 'Approved') : 'Pending Upload';
      const action = isPending
        ? `<span class="upload-action-zone" onclick="event.stopPropagation()">📎 Click to upload or drag and drop PDF <span style="color:var(--color-text-muted)">(max. 5MB)</span></span>`
        : `<a class="upload-action-link">View and Review</a>`;
      return `<tr>
        <td>${d.name}</td>
        <td><span class="badge ${statusClass}" style="font-size:10px">${statusLabel}</span></td>
        <td><span class="tag" style="font-size:10px">${d.party || ''}</span></td>
        <td>${action}</td>
      </tr>`;
    }).join('');
    return `<table class="upload-doc-table">
      <thead><tr><th>Document</th><th>Status</th><th>Party</th><th>Action</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  },

  /** Origination process task tracker */
  _renderProcessTracker(title, tasks) {
    const done = tasks.filter(t => t.status === 'done').length;
    const items = tasks.map(t => {
      const checkClass = t.status === 'done' ? 'done' : t.status === 'active' ? 'active' : 'pending';
      const icon = t.status === 'done' ? '✓' : t.status === 'active' ? '◎' : '·';
      const labelClass = t.status === 'done' ? 'done' : '';
      return `<div class="process-tracker-task">
        <div class="process-tracker-check ${checkClass}">${icon}</div>
        <div class="process-tracker-task-label ${labelClass}">${t.label}</div>
        <span class="tag" style="font-size:10px">${t.party}</span>
        <span class="badge ${t.status === 'done' ? 'badge-active' : t.status === 'active' ? 'badge-submitted' : 'badge-pending'}" style="font-size:10px">${t.status === 'done' ? 'Complete' : t.status === 'active' ? 'In Progress' : 'Pending'}</span>
        ${t.action ? `<button class="process-tracker-validate-btn">${t.action}</button>` : ''}
      </div>`;
    }).join('');
    return `<div class="process-tracker">
      <div class="process-tracker-header">
        <div class="process-tracker-title">${title}</div>
        <div class="process-tracker-progress">${done} of ${tasks.length} tasks completed</div>
      </div>
      ${items}
    </div>`;
  },

  /** Originator/LO verification info grid */
  _renderOriginatorInfo(loan) {
    const lo = State.getUser(loan.loId);
    if (!lo) return '';
    const company = State.getCompanies().find(c => c.id === lo.companyId);
    const branch = State.getBranches().find(b => b.id === lo.branchId);
    return `
      <div class="app-step-subsection-title">Verify Originator Information</div>
      <div class="form-grid" style="margin-bottom:20px">
        <div class="form-group">
          <label>Loan Officer</label>
          <input class="input" value="${Display.fullName(lo)}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>NMLS #</label>
          <input class="input" value="${lo.nmlsId || '—'}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input class="input" value="${lo.email || '—'}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input class="input" value="${lo.phone || '—'}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Company</label>
          <input class="input" value="${company?.name || '—'}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Branch</label>
          <input class="input" value="${branch?.name || '—'}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Title</label>
          <input class="input" value="${lo.title || '—'}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Branch NMLS #</label>
          <input class="input" value="${branch?.nmlsId || '—'}" readonly style="background:var(--color-surface)" />
        </div>
      </div>`;
  },

  /** Borrower information section with demo data */
  _renderBorrowerInfo(loan) {
    const BORROWER_DEMO = {
      'DCDC000001': { ssn: '***-**-4829', dob: '03/15/1985', phone: '(202) 555-0312', email: 'mthompson@email.com', employer: 'Federal Government — GS-13', employerYears: '8 years', coBorrower: 'Robert Thompson' },
      'DCDC000002': { ssn: '***-**-7741', dob: '11/22/1990', phone: '(202) 555-0188', email: 'sjohnson@email.com', employer: 'Deloitte Consulting', employerYears: '4 years', coBorrower: '' },
      'DCDC000003': { ssn: '***-**-3356', dob: '07/04/1978', phone: '(202) 555-0255', email: 'awilliams@email.com', employer: 'Georgetown University', employerYears: '12 years', coBorrower: 'Lisa Williams' },
    };
    const b = BORROWER_DEMO[loan.id] || { ssn: '***-**-0000', dob: '01/01/1988', phone: '(555) 555-0100', email: 'borrower@email.com', employer: 'Self-Employed', employerYears: '3 years', coBorrower: '' };
    const addrParts = loan.address.split(',');
    return `
      <div class="app-step-subsection-title">Borrower Information</div>
      <div class="form-grid" style="margin-bottom:20px">
        <div class="form-group">
          <label>Full Name</label>
          <input class="input" value="${loan.borrowerName}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>SSN</label>
          <input class="input" value="${b.ssn}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Date of Birth</label>
          <input class="input" value="${b.dob}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input class="input" value="${b.phone}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input class="input" value="${b.email}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Current Address</label>
          <input class="input" value="${addrParts[0]?.trim() || loan.address}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Employer</label>
          <input class="input" value="${b.employer}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Years Employed</label>
          <input class="input" value="${b.employerYears}" readonly style="background:var(--color-surface)" />
        </div>
        ${b.coBorrower ? `<div class="form-group form-full">
          <label>Co-Borrower</label>
          <input class="input" value="${b.coBorrower}" readonly style="background:var(--color-surface)" />
        </div>` : ''}
      </div>`;
  },

  /** Property & loan information grid */
  _renderPropertyInfo(loan) {
    const addrParts = loan.address.split(',');
    const street = addrParts[0]?.trim() || '';
    const city = addrParts[1]?.trim() || '';
    const stateZip = addrParts[2]?.trim() || '';
    const statePart = stateZip.split(' ').filter(Boolean);
    const state = statePart[0] || '';
    const zip = statePart[1] || '';
    const purchasePrice = Math.round(loan.amount / ((loan.ltv || 75) / 100));
    return `
      <div class="app-step-subsection-title">Property & Loan Information</div>
      <div class="form-grid-4" style="margin-bottom:20px">
        <div class="form-group form-half">
          <label>Street Address</label>
          <input class="input" value="${street}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>City</label>
          <input class="input" value="${city}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>State / ZIP</label>
          <input class="input" value="${state} ${zip}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Property Type</label>
          <input class="input" value="Single Family Residence" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Occupancy</label>
          <input class="input" value="Primary Residence" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Est. Property Value</label>
          <input class="input" value="${Display.currency(purchasePrice)}" readonly style="background:var(--color-surface)" />
        </div>
        <div class="form-group">
          <label>Loan Purpose</label>
          <input class="input" value="Purchase" readonly style="background:var(--color-surface)" />
        </div>
      </div>`;
  },

  /* ================================================================
     APPLICATION DETAIL
  ================================================================ */
  _renderApplicationDetail(loanId) {
    const loan = State.getLoans().find(l => l.id === loanId);
    if (!loan) return '<div class="empty-state">Application not found.</div>';

    const lo = State.getUser(loan.loId);
    const loName = lo ? Display.fullName(lo) : '—';
    const proc = generateOriginationProcess(loan.status);
    const days = this._daysInStage(loan);
    const rateLockDate = loanId === 'DCDC000002' ? 'Apr 12, 2026' : 'Apr 30, 2026';
    const estCloseDate = loanId === 'DCDC000003' ? 'Mar 15, 2026' : 'May 15, 2026';

    return `
      <button class="ud-back-btn" onclick="DataPlatformView._backToApplications()">&#8592; Back to Applications</button>
      ${this._appContextHeader(loan, loName, proc, rateLockDate, estCloseDate)}
      ${this._appActionBanner(loan, proc)}
      <div class="ud-content-grid">
        <div>
          ${this._appContentTabs()}
          <div class="ud-content-main">${this._appTabContent(loan, proc, loName)}</div>
        </div>
        <div>${this._appSidebar(loan, loName, days, rateLockDate, estCloseDate)}</div>
      </div>
      <div id="dp-modal"></div>`;
  },

  /* ── App Detail: Owner avatar helper ── */
  _appOwnerAvatar(role) {
    if (!role) return '';
    const r = role.toLowerCase();
    let cls = 'system', initials = 'SY';
    if (r.includes('loan officer') || r === 'lo') { cls = 'lo'; initials = 'LO'; }
    else if (r.includes('account') || r.includes('am')) { cls = 'am'; initials = 'AM'; }
    else if (r.includes('processor')) { cls = 'am'; initials = 'PR'; }
    else if (r.includes('borrower')) { cls = 'borrower'; initials = 'BO'; }
    else if (r.includes('appraiser')) { cls = 'system'; initials = 'AP'; }
    return `<span class="ud-task-owner ${cls}" title="${role}">${initials}<span class="ud-task-owner-tip">${role}</span></span>`;
  },

  /* ── App Detail: Stage icon SVGs ── */
  _appStageIcon(stageId) {
    const icons = {
      prequalification: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
      application_disclosures: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      cda_appraisal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><circle cx="15" cy="13" r="3"/><path d="M17.5 15.5L20 18"/></svg>',
      clear_close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
      post_closing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
      transfer_minting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
    };
    return icons[stageId] || icons.prequalification;
  },

  /* ── App Detail: Context Header (with integrated progress strip) ── */
  _appContextHeader(loan, loName, proc, rateLockDate, estCloseDate) {
    const isCompleted = loan.status === 'completed';
    const addr = loan.phase === 'prequalification' ? 'PREQUALIFICATION' : loan.address.split(',')[0].trim();
    const sub = loan.address.split(',').slice(1).join(',').trim();
    const dti = loan.id === 'DCDC000003' ? 38 : Math.round(28 + (loan.ltv || 70) / 5);
    const rateLockExpiring = loan.id === 'DCDC000002';

    // Progress strip data
    const totalTasks = proc.reduce((s, st) => s + st.tasks.length, 0);
    const doneTasks = proc.reduce((s, st) => s + st.tasks.filter(t => t.status === 'done').length, 0);
    const overallPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const currentStage = proc.find(s => s.status === 'in_progress');
    const currentIdx = currentStage ? proc.indexOf(currentStage) : (isCompleted ? proc.length : 0);

    const segments = proc.map((stage) => {
      const cls = stage.status === 'completed' ? 'done' : stage.status === 'in_progress' ? 'current' : 'pending';
      const sDone = stage.tasks.filter(t => t.status === 'done').length;
      const sTotal = stage.tasks.length;
      const pct = sTotal ? Math.round((sDone / sTotal) * 100) : 0;
      const statusLabel = cls === 'done' ? 'Complete' : cls === 'current' ? 'In Progress' : 'Pending';
      return `<div class="ud-progress-segment ${cls}" style="flex:${sTotal}">
        <span class="ud-progress-segment-tip">
          <div class="ud-seg-tip-header">
            <div class="ud-seg-tip-icon ${cls}">${this._appStageIcon(stage.id)}</div>
            <span class="ud-seg-tip-name">${stage.label}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px">
            <span class="ud-seg-tip-status ${cls}">${statusLabel}</span>
          </div>
          <div class="ud-seg-tip-progress">
            <div class="ud-seg-tip-bar"><div class="ud-seg-tip-bar-fill" style="width:${pct}%"></div></div>
            <span>${sDone}/${sTotal} tasks</span>
          </div>
        </span>
      </div>`;
    }).join('');

    const stageLabel = currentStage ? currentStage.label : (isCompleted ? 'Completed' : 'Not Started');
    const stageIconCls = isCompleted ? 'done' : '';
    const stageIconSvg = currentStage ? this._appStageIcon(currentStage.id) : this._appStageIcon('transfer_minting');
    const stageDone = currentStage ? currentStage.tasks.filter(t => t.status === 'done').length : 0;
    const stageTotal = currentStage ? currentStage.tasks.length : 0;
    const stageCount = currentStage ? `${stageDone}/${stageTotal} tasks` : '';

    return `
      <div class="ud-context-header">
        <div class="ud-context-top">
          <div>
            <div class="ud-context-address">${addr}</div>
            <div class="ud-context-sub">${sub}</div>
          </div>
          <span class="ud-status-pill ${isCompleted ? 'completed' : ''}"><span class="ud-status-pill-dot"></span> ${Display.loanStatusLabel(loan.status)}</span>
        </div>
        <div class="ud-context-chips">
          <div class="ud-chip"><span class="ud-chip-label">Loan ID</span><span class="ud-chip-value">${loan.id}</span></div>
          <div class="ud-chip"><span class="ud-chip-label">Program</span><span class="ud-chip-value">${loan.program}</span></div>
          <div class="ud-chip"><span class="ud-chip-label">Amount</span><span class="ud-chip-value">${Display.currency(loan.amount)}</span></div>
          <div class="ud-chip"><span class="ud-chip-label">LTV / CLTV</span><span class="ud-chip-value">${loan.ltv ?? '—'}% / ${loan.cltv ?? '—'}%</span></div>
          <div class="ud-chip"><span class="ud-chip-label">DTI</span><span class="ud-chip-value">${dti}%</span></div>
          <div class="ud-chip"><span class="ud-chip-label">FICO</span><span class="ud-chip-value">${loan.fico || '—'}</span></div>
          <div class="ud-chip"><span class="ud-chip-label">Borrower</span><span class="ud-chip-value">${loan.borrowerName}</span></div>
          <div class="ud-chip"><span class="ud-chip-label">Loan Officer</span><span class="ud-chip-value">${loName}</span></div>
          <div class="ud-chip"><span class="ud-chip-label">Rate Lock</span><span class="ud-chip-value ${rateLockExpiring ? 'warn' : ''}">${rateLockDate}</span></div>
          <div class="ud-chip"><span class="ud-chip-label">Est. Close</span><span class="ud-chip-value">${estCloseDate}</span></div>
        </div>
        <div class="ud-progress-strip">
          <div class="ud-progress-bar-segmented">${segments}</div>
          <div class="ud-progress-meta">
            <div class="ud-progress-stage-icon ${stageIconCls}">${stageIconSvg}</div>
            <span class="ud-progress-stage-label">${stageLabel}</span>
            ${stageCount ? `<span class="ud-progress-stage-count">${stageCount}</span>` : ''}
            <span class="ud-progress-overall">Stage ${currentIdx + 1} of ${proc.length} &middot; ${overallPct}% complete</span>
          </div>
        </div>
      </div>`;
  },

  /* ── App Detail: Action Banner (next required action) ── */
  /* SLA deadlines per task (business days from submission) */
  _TASK_SLA: {
    pq_creation: 0, pq_submitted: 1, pq_review: 3, pq_accepted: 5,
    ad_initial: 7, ad_title: 10, ad_disclosures: 14, ad_borrower_docs: 18, ad_app_docs: 21, ad_final: 24,
    ca_upload: 26, ca_approve: 28, ca_order: 30, ca_report: 33, ca_review: 35,
    cc_docs: 37, cc_atr: 39, cc_ctc: 42, cc_prelim: 44, cc_san: 46, cc_dates: 48, cc_fees: 50, cc_submit: 52,
    pc_validate: 54, pc_files: 56, pc_package: 58, pc_funding: 60,
    tm_securitize: 62, tm_approval: 64, tm_mers: 66, tm_mint: 68, tm_servicing: 70,
  },

  _taskDeadline(loan, taskId) {
    if (!loan.submittedAt) return null;
    const sla = this._TASK_SLA[taskId];
    if (sla == null) return null;
    const base = new Date(loan.submittedAt + 'T00:00:00');
    let added = 0, d = new Date(base);
    while (added < sla) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
    return d;
  },

  _formatDeadline(deadline) {
    if (!deadline) return null;
    const now = new Date();
    const diffMs = deadline - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const dateStr = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    let cls = '', urgency = '';
    if (diffDays < 0) { cls = 'overdue'; urgency = `${Math.abs(diffDays)}d overdue`; }
    else if (diffDays <= 3) { cls = 'soon'; urgency = diffDays === 0 ? 'Due today' : `${diffDays}d remaining`; }
    else { urgency = `${diffDays}d remaining`; }
    return { dateStr, urgency, cls };
  },

  _appActionBanner(loan, proc) {
    const currentStage = proc.find(s => s.status === 'in_progress');
    const activeTask = currentStage?.tasks.find(t => t.status === 'active');
    if (!activeTask && loan.status === 'completed') {
      return `<div class="ud-action-banner complete">
        <div class="ud-action-banner-icon">&#10003;</div>
        <div class="ud-action-banner-body">
          <div class="ud-action-banner-label">Completed</div>
          <div class="ud-action-banner-text">All stages and tasks are complete</div>
        </div>
      </div>`;
    }
    if (!activeTask) return '';
    const nextPending = currentStage?.tasks.find(t => t.status === 'pending');
    const upNextHtml = nextPending ? `<div class="ud-action-banner-sub">Up next: ${nextPending.label} &middot; ${nextPending.role}</div>` : '';

    // Deadline
    const deadline = this._taskDeadline(loan, activeTask.id);
    const dl = this._formatDeadline(deadline);
    const deadlineHtml = dl
      ? `<div class="ud-action-banner-deadline ${dl.cls}">Suggested deadline: ${dl.dateStr}<br>${dl.urgency}</div>`
      : '';

    return `<div class="ud-action-banner">
      <div class="ud-action-banner-icon">&#9888;</div>
      <div class="ud-action-banner-body">
        <div class="ud-action-banner-label">Next Action Required</div>
        <div class="ud-action-banner-text">${activeTask.label}</div>
        <div class="ud-action-banner-sub">${this._appOwnerAvatar(activeTask.role)} ${activeTask.role} &middot; ${currentStage.label}</div>
        ${upNextHtml}
      </div>
      <div class="ud-action-banner-right">
        ${activeTask.action ? `<button class="ud-action-banner-btn" onclick="event.stopPropagation()">${activeTask.action}</button>` : ''}
        ${deadlineHtml}
      </div>
    </div>`;
  },

  /* ── App Detail: Content Tabs ── */
  _appContentTabs() {
    const tabs = ['Overview', 'Tasks', 'Documents', 'Parties', 'History'];
    const keys = ['overview', 'tasks', 'documents', 'parties', 'history'];
    return `<div class="ud-content-tabs">${tabs.map((t, i) =>
      `<button class="ud-content-tab ${this._activeAppTab === keys[i] ? 'active' : ''}" onclick="DataPlatformView.switchAppTab('${keys[i]}')">${t}</button>`
    ).join('')}</div>`;
  },

  /* ── App Detail: Tab Content Dispatcher ── */
  _appTabContent(loan, proc, loName) {
    switch (this._activeAppTab) {
      case 'tasks':     return this._appTasksTab(proc);
      case 'documents': return this._appDocumentsTab(loan);
      case 'parties':   return this._appPartiesTab(loan, loName);
      case 'history':   return this._appHistoryTab(loan);
      default:          return this._appOverviewTab(loan, proc);
    }
  },

  /* ── App Detail: Overview Tab ── */
  _appOverviewTab(loan, proc) {
    const currentStage = proc.find(s => s.status === 'in_progress');
    const lastCompleted = proc.filter(s => s.status === 'completed').pop();
    const activeStage = currentStage || lastCompleted;

    let currentSectionHtml = '';
    if (activeStage) {
      const done = activeStage.tasks.filter(t => t.status === 'done').length;
      const total = activeStage.tasks.length;
      const pct = Math.round((done / total) * 100);
      currentSectionHtml = `
        <div class="ud-content-section">
          <div class="ud-section-title">
            ${activeStage.label}
            <span class="ud-section-count">${done} of ${total} tasks</span>
            <div style="flex:1"></div>
            <div style="width:100px"><div class="ud-progress-bar"><div class="ud-progress-fill" style="width:${pct}%"></div></div></div>
          </div>
          ${activeStage.tasks.map(t => `
            <div class="ud-task-row">
              <div class="ud-task-icon ${t.status === 'done' ? 'done' : t.status === 'active' ? 'active' : 'pending'}">${t.status === 'done' ? '&#10003;' : t.status === 'active' ? '&#9679;' : ''}</div>
              <span class="ud-task-label ${t.status === 'done' ? 'done' : ''}">${t.label}</span>
              ${this._appOwnerAvatar(t.role)}
              ${t.action && t.status !== 'done' ? `<button class="ud-task-action ${t.status === 'active' ? 'primary' : ''}" onclick="event.stopPropagation()">${t.action}</button>` : ''}
            </div>`).join('')}
        </div>`;
    }

    const completedStages = proc.filter(s => s.status === 'completed' && s !== activeStage);
    const completedHtml = completedStages.map(s => `
      <div class="ud-content-section">
        <div class="ud-section-title" style="color:#16A34A"><span style="font-size:16px;margin-right:4px">&#10003;</span> ${s.label} <span class="ud-section-count">${s.tasks.length}/${s.tasks.length} complete</span></div>
      </div>`).join('');

    const purchasePrice = Math.round(loan.amount / ((loan.ltv || 75) / 100));
    const overviewItems = [
      ['Loan Amount', Display.currency(loan.amount)],
      ['Purchase Price', Display.currency(purchasePrice)],
      ['LTV / CLTV', `${loan.ltv ?? '—'}% / ${loan.cltv ?? '—'}%`],
      ['FICO', loan.fico || '—'],
      ['Appraised Value', loan.appraisedHomeValue ? Display.currency(loan.appraisedHomeValue) : 'TBD'],
      ['Closing Date', loan.closingDate ? Display.date(loan.closingDate) : 'TBD'],
      ['Closing Fees', loan.closingFees ? Display.currency(loan.closingFees) : 'TBD'],
      ['Borrower Net', loan.borrowerNet ? Display.currency(loan.borrowerNet) : 'TBD'],
    ];

    const originatorItems = [
      ['Company', loan.originatorCompany || '—'],
      ['Company NMLS #', loan.originatorNmls || '—'],
      ['Appraiser', loan.appraiserCompany || 'TBD'],
      ['Title Company', 'First American Title'],
    ];

    return `
      ${currentSectionHtml}
      ${completedHtml}
      <div class="ud-content-section">
        <div class="ud-section-title">Loan Overview</div>
        <div class="ud-info-grid">${overviewItems.map(([l, v]) =>
          `<div class="ud-info-item"><div class="ud-info-label">${l}</div><div class="ud-info-value ${v === 'TBD' ? 'tbd' : ''}">${v}</div></div>`
        ).join('')}</div>
      </div>
      <div class="ud-content-section">
        <div class="ud-section-title">Originator &amp; Appraisal</div>
        <div class="ud-info-grid">${originatorItems.map(([l, v]) =>
          `<div class="ud-info-item"><div class="ud-info-label">${l}</div><div class="ud-info-value ${v === 'TBD' ? 'tbd' : ''}">${v}</div></div>`
        ).join('')}</div>
      </div>`;
  },

  /* ── App Detail: Tasks Tab ── */
  _appTasksTab(proc) {
    return proc.map(stage => {
      const done = stage.tasks.filter(t => t.status === 'done').length;
      const total = stage.tasks.length;
      const isDone = stage.status === 'completed';
      const isCurrent = stage.status === 'in_progress';
      const isPending = stage.status === 'pending';
      const isExpanded = this._expandedAppStages.has(stage.id) || isCurrent;

      if (isPending && !this._expandedAppStages.has(stage.id)) {
        return `
          <div class="ud-content-section">
            <div class="ud-stage-section-header" onclick="DataPlatformView.toggleAppStage('${stage.id}')">
              <div class="ud-section-title" style="color:var(--color-text-muted);margin:0">${stage.label} <span class="ud-section-count">0/${total} &middot; Pending</span></div>
              <span class="ud-stage-section-toggle">&#9654;</span>
            </div>
          </div>`;
      }

      return `
        <div class="ud-content-section ud-stage-section ${isCurrent ? 'in-progress' : ''}">
          <div class="ud-stage-section-header" onclick="DataPlatformView.toggleAppStage('${stage.id}')">
            <div class="ud-section-title" style="margin:0">
              ${isDone ? '<span style="color:#16A34A;font-size:16px;margin-right:4px">&#10003;</span>' : ''}
              ${stage.label}
              <span class="ud-section-count">${done}/${total}${isCurrent ? ' \u00B7 In Progress' : isDone ? ' complete' : ''}</span>
            </div>
            <span class="ud-stage-section-toggle ${isExpanded ? 'open' : ''}">&#9654;</span>
          </div>
          ${isExpanded ? stage.tasks.map(t => `
            <div class="ud-task-row">
              <div class="ud-task-icon ${t.status === 'done' ? 'done' : t.status === 'active' ? 'active' : 'pending'}">${t.status === 'done' ? '&#10003;' : t.status === 'active' ? '&#9679;' : ''}</div>
              <span class="ud-task-label ${t.status === 'done' ? 'done' : ''}">${t.label}</span>
              ${this._appOwnerAvatar(t.role)}
              ${t.action && t.status !== 'done' ? `<button class="ud-task-action ${t.status === 'active' ? 'primary' : ''}" onclick="event.stopPropagation()">${t.action}</button>` : ''}
            </div>`).join('') : ''}
        </div>`;
    }).join('');
  },

  /* ── App Detail: Documents Tab ── */
  _appDocumentsTab(loan) {
    const hasAppraisal = ['application_documents_approved','original_appraisal_submitted','sent_to_docutech','pending_origination_creation','origination_created','completed'].includes(loan.status);
    const hasTitle = ['sent_to_docutech','pending_origination_creation','origination_created','completed'].includes(loan.status);
    const isComplete = loan.status === 'completed';
    const hasOrigination = isComplete || loan.status === 'origination_created';
    const hasDocs = loan.status !== 'draft' && loan.status !== 'prequalification_in_progress';

    const docs = [
      { name: 'Initial Disclosure Package', meta: 'PDF \u00B7 2.4 MB \u00B7 Uploaded Mar 18', status: hasDocs ? 'approved' : 'missing', owner: 'Account Manager' },
      { name: 'Borrower Authorization',     meta: 'PDF \u00B7 156 KB \u00B7 Uploaded Mar 18', status: hasDocs ? 'approved' : 'missing', owner: 'Account Manager' },
      { name: 'Signed Loan Application 1003', meta: hasDocs ? 'PDF \u00B7 320 KB \u00B7 Uploaded Mar 18' : 'Required for Application', status: hasDocs ? 'approved' : 'missing', owner: 'Borrower' },
      { name: 'Appraisal Report',            meta: hasAppraisal ? 'PDF \u00B7 8.1 MB \u00B7 Uploaded Mar 22' : 'Required for CDA & Appraisal stage', status: hasAppraisal ? 'approved' : 'missing', owner: 'Loan Officer' },
      { name: 'Title Commitment',            meta: hasTitle ? 'PDF \u00B7 1.8 MB \u00B7 Uploaded Mar 25' : 'Required for Closing stage', status: hasTitle ? 'approved' : 'pending', owner: 'Account Manager' },
      { name: 'Closing Disclosure',          meta: isComplete ? 'PDF \u00B7 3.2 MB \u00B7 Uploaded Apr 1' : 'Required for Closing stage', status: isComplete ? 'approved' : 'pending', owner: 'System' },
      { name: 'SAN Note',                    meta: hasOrigination ? 'PDF \u00B7 412 KB \u00B7 Uploaded Apr 2' : 'Required for Closing stage', status: hasOrigination ? 'approved' : 'pending', owner: 'Account Manager' },
    ];
    const approvedCount = docs.filter(d => d.status === 'approved').length;

    return `
      <div class="ud-content-section">
        <div class="ud-section-title">Documents <span class="ud-section-count">${approvedCount} of ${docs.length} approved</span></div>
        ${docs.map(d => `
          <div class="ud-doc-row">
            <div class="ud-doc-icon">&#128196;</div>
            <div class="ud-doc-info"><div class="ud-doc-name">${d.name}</div><div class="ud-doc-meta">${d.meta}</div></div>
            <span class="ud-doc-badge ${d.status}">${d.status === 'approved' ? 'Approved' : d.status === 'missing' ? 'Not Uploaded' : 'Pending'}</span>
            ${this._appOwnerAvatar(d.owner)}
            ${d.status === 'missing' ? '<button class="ud-task-action" onclick="event.stopPropagation()">Upload</button>' : ''}
          </div>`).join('')}
      </div>`;
  },

  /* ── App Detail: Parties Tab ── */
  _appPartiesTab(loan, loName) {
    const borrowerItems = [
      ['Borrower Name(s)', loan.borrowerName],
      ['FICO Score', loan.fico || '—'],
      ['Household Income', loan.householdIncome ? Display.currency(loan.householdIncome) : '—'],
      ['Employment Status', 'Verified'],
      ['Debt-to-Income Ratio', (loan.id === 'DCDC000003' ? 38 : Math.round(28 + (loan.ltv || 70) / 5)) + '%'],
      ['Credit History', 'Good standing'],
    ];
    const originatorItems = [
      ['Loan Officer', loName],
      ['Company', loan.originatorCompany || '—'],
      ['Company NMLS #', loan.originatorNmls || '—'],
      ['Processor', 'Kevin Park'],
    ];
    const titleItems = [
      ['Title Company', 'First American Title'],
      ['Title Officer', 'Karen Mitchell'],
      ['Title Number', 'FA-2026-' + loan.id.slice(-4)],
    ];
    const appraisalItems = [
      ['Appraiser Company', loan.appraiserCompany || 'TBD'],
      ['Appraiser Name', loan.appraiserName || 'TBD'],
      ['Appraiser License #', loan.appraiserLicense || 'TBD'],
    ];

    const renderGrid = (items) => `<div class="ud-info-grid">${items.map(([l, v]) =>
      `<div class="ud-info-item"><div class="ud-info-label">${l}</div><div class="ud-info-value ${v === 'TBD' ? 'tbd' : ''}">${v}</div></div>`
    ).join('')}</div>`;

    return `
      <div class="ud-content-section"><div class="ud-section-title">Borrower</div>${renderGrid(borrowerItems)}</div>
      <div class="ud-content-section"><div class="ud-section-title">Originator</div>${renderGrid(originatorItems)}</div>
      <div class="ud-content-section"><div class="ud-section-title">Appraiser</div>${renderGrid(appraisalItems)}</div>
      <div class="ud-content-section"><div class="ud-section-title">Title Company</div>${renderGrid(titleItems)}</div>`;
  },

  /* ── App Detail: History Tab ── */
  _appHistoryTab(loan) {
    const COMMS = {
      'DCDC000001': [
        { action: 'Loan Estimate sent to borrower', actor: 'System', time: 'Mar 20, 2026' },
        { action: 'Application submitted', actor: 'Loan Officer', time: 'Mar 18, 2026' },
        { action: 'Prequalification completed', actor: 'Account Manager', time: 'Mar 15, 2026' },
        { action: 'Loan created', actor: 'System', time: 'Mar 12, 2026' },
      ],
      'DCDC000002': [
        { action: 'Closing Disclosure sent to borrower', actor: 'System', time: 'Apr 1, 2026' },
        { action: 'Documents approved by underwriter', actor: 'Account Manager', time: 'Mar 28, 2026' },
        { action: 'Loan Estimate sent', actor: 'System', time: 'Mar 12, 2026' },
        { action: 'Loan created', actor: 'System', time: 'Mar 5, 2026' },
      ],
      'DCDC000003': [
        { action: 'Closing completed — loan funded', actor: 'System', time: 'Mar 15, 2026' },
        { action: 'Final CD sent to borrower', actor: 'System', time: 'Mar 10, 2026' },
        { action: 'Title insurance confirmed', actor: 'Title Co.', time: 'Mar 5, 2026' },
        { action: 'Loan created', actor: 'System', time: 'Feb 20, 2026' },
      ],
    };
    const events = COMMS[loan.id] || [
      { action: 'Loan created', actor: 'System', time: loan.submittedAt || '2026-03-10' },
      { action: 'Status: ' + Display.loanStatusLabel(loan.status), actor: 'System', time: loan.updatedAt || '2026-04-01' },
    ];

    return `
      <div class="ud-content-section">
        <div class="ud-section-title">Activity History</div>
        <div class="ud-timeline">
          ${events.map(e => `
            <div class="ud-timeline-item">
              <div class="ud-timeline-dot"></div>
              <div class="ud-timeline-content"><strong>${e.action}</strong> &mdash; ${e.actor}</div>
              <div class="ud-timeline-time">${typeof e.time === 'string' && e.time.includes(',') ? e.time : Display.date(e.time)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── App Detail: Right Sidebar (Next Actions moved to banner) ── */
  _appSidebar(loan, loName, days, rateLockDate, estCloseDate) {
    const rateLockExpiring = loan.id === 'DCDC000002';

    // Warnings
    let warningsHtml = '';
    if (days > 14 && loan.status !== 'completed') {
      warningsHtml += `<div class="ud-sidebar-item"><span class="ud-sidebar-dot red"></span><div class="ud-sidebar-item-text"><div>${days} days in current stage</div><div class="ud-sidebar-item-sub">Avg for this stage: 10 days</div></div></div>`;
    }
    if (rateLockExpiring) {
      warningsHtml += `<div class="ud-sidebar-item"><span class="ud-sidebar-dot red"></span><div class="ud-sidebar-item-text"><div>Rate lock expiring soon</div><div class="ud-sidebar-item-sub">${rateLockDate}</div></div></div>`;
    }
    if (!loan.closingDate && loan.status !== 'completed') {
      warningsHtml += `<div class="ud-sidebar-item"><span class="ud-sidebar-dot amber"></span><div class="ud-sidebar-item-text"><div>Closing date not set</div><div class="ud-sidebar-item-sub">Set closing date to proceed</div></div></div>`;
    }
    if (!warningsHtml) warningsHtml = '<div class="ud-sidebar-item" style="color:var(--color-text-muted);font-size:12px;padding:12px 16px">No warnings</div>';

    return `
      <div class="ud-sidebar-panel">
        <div class="ud-sidebar-panel-title">Warnings</div>
        ${warningsHtml}
      </div>
      <div class="ud-sidebar-panel">
        <div class="ud-sidebar-panel-title">Key Dates</div>
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Submitted</span><span class="ud-sidebar-kv-value">${loan.submittedAt ? Display.date(loan.submittedAt) : '—'}</span></div>
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Rate Lock</span><span class="ud-sidebar-kv-value ${rateLockExpiring ? 'warn' : ''}">${rateLockDate}</span></div>
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Est. Close</span><span class="ud-sidebar-kv-value">${estCloseDate}</span></div>
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Days in Stage</span><span class="ud-sidebar-kv-value" ${days > 14 ? 'style="color:var(--color-danger)"' : ''}>${days}d</span></div>
      </div>
      <div class="ud-sidebar-panel">
        <div class="ud-sidebar-panel-title">Parties</div>
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Borrower</span><span class="ud-sidebar-kv-value">${loan.borrowerName}</span></div>
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Loan Officer</span><span class="ud-sidebar-kv-value">${loName}</span></div>
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Processor</span><span class="ud-sidebar-kv-value">Kevin Park</span></div>
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Title Co.</span><span class="ud-sidebar-kv-value">First American Title</span></div>
      </div>`;
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
        { label: 'Signed 1003 (Uniform Residential Loan Application) received', done: true,  party: 'Borrower',  status: 'Accepted' },
        { label: 'Proof of income verified',                                      done: false, party: 'Borrower',  status: 'Pending' },
        { label: `Credit report pulled — FICO: ${loan.ltv ? Math.round(680 + loan.ltv / 2) : '—'}`, done: true, party: 'System', status: 'Accepted' },
        { label: 'Flood certification ordered',                                   done: false, party: 'Processor', status: 'In Review' },
        { label: 'Property insurance verification',                               done: false, party: 'Borrower',  status: 'Pending' },
      ];

      const tasks = [
        { label: 'Initial application submission and origination creation', party: 'Loan Officer',  status: 'done' },
        { label: 'Validate title information and send initial disclosures', party: 'Account Mgr',   status: 'active', action: 'Validate' },
        { label: 'Initial disclosures signed',                              party: 'Borrower',      status: 'pending' },
      ];

      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Initial Application Review</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">Application submitted. Review loan terms, fees, property details, and outstanding conditions.</div>

          ${this._renderPropertyInfo(loan)}

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

          <div class="condition-category-header">Prior to Approval</div>
          <div class="app-conditions">${this._renderStepConditions(conditions.slice(0, 3))}</div>
          <div class="condition-category-header">Prior to Close</div>
          <div class="app-conditions" style="margin-bottom:16px">${this._renderStepConditions(conditions.slice(3))}</div>

          ${this._renderProcessTracker('Application Process', tasks)}

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn-secondary btn-sm">Uniform Residential Loan Application</button>
            <button class="btn btn-secondary btn-sm">Download MISMO XML</button>
          </div>
        </div>`;
    }

    // Step 4: Appraisal
    if (stepIdx === 4) {
      const appraisalDocs = [
        { name: 'Appraisal Report',              status: 'Pending Upload', party: 'Appraiser' },
        { name: 'Homeowner\'s Insurance Binder',  status: 'Pending Upload', party: 'Borrower' },
        { name: 'Flood Certification',            status: 'Pending Upload', party: 'Processor' },
      ];
      const tasks = [
        { label: 'Order appraisal through AMC',    party: 'Loan Officer', status: 'done' },
        { label: 'Schedule property inspection',   party: 'Appraiser',   status: 'done' },
        { label: 'Receive appraisal report',       party: 'Appraiser',   status: 'active' },
        { label: 'Review appraisal for adequacy',  party: 'Processor',   status: 'pending', action: 'Review' },
      ];
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Appraisal</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">Order and review the property appraisal. Upload the completed report to proceed.</div>

          <div class="app-step-subsection-title">Property Details</div>
          <div class="form-grid-4" style="margin-bottom:20px">
            <div class="form-group">
              <label>Property Type</label>
              <input class="input" value="Single Family Residence" readonly style="background:var(--color-surface)" />
            </div>
            <div class="form-group">
              <label>Year Built</label>
              <input class="input" value="2004" readonly style="background:var(--color-surface)" />
            </div>
            <div class="form-group">
              <label>Square Footage</label>
              <input class="input" value="2,150 sq ft" readonly style="background:var(--color-surface)" />
            </div>
            <div class="form-group">
              <label>Bed / Bath</label>
              <input class="input" value="4 bed / 2.5 bath" readonly style="background:var(--color-surface)" />
            </div>
          </div>

          <div class="app-step-subsection-title">Appraisal Information</div>
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

          <div style="margin-top:20px">
            <div class="app-step-subsection-title">Comparable Sales</div>
            <table class="app-detail-table" style="width:100%;margin-bottom:16px">
              <thead><tr><th>Address</th><th>Sale Price</th><th>Date</th><th>Distance</th></tr></thead>
              <tbody>
                <tr><td style="font-size:12px">742 Oak Lane, ${loan.address.split(',')[1]?.trim() || ''}</td><td>${Display.currency(purchasePrice + 12000)}</td><td>Feb 2026</td><td>0.3 mi</td></tr>
                <tr><td style="font-size:12px">1105 Maple Dr, ${loan.address.split(',')[1]?.trim() || ''}</td><td>${Display.currency(purchasePrice - 8000)}</td><td>Jan 2026</td><td>0.5 mi</td></tr>
                <tr><td style="font-size:12px">890 Elm St, ${loan.address.split(',')[1]?.trim() || ''}</td><td>${Display.currency(purchasePrice + 5000)}</td><td>Dec 2025</td><td>0.7 mi</td></tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top:16px;padding:14px 16px;background:#FEF3C7;border-radius:var(--radius-lg);border:1px solid #FCD34D;font-size:13px;color:#92400E">
            <strong>Action Required:</strong> Appraisal report due by <strong>Apr 10, 2026</strong>. Upload the completed report to proceed.
          </div>

          <div style="margin-top:20px">
            <div class="app-step-subsection-title">Required Documents</div>
            ${this._renderUploadDocTable(appraisalDocs)}
          </div>

          <div class="upload-dropzone" style="margin-top:16px" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="event.preventDefault();this.classList.remove('dragover')">
            <div class="upload-dropzone-icon">📄</div>
            <div class="upload-dropzone-text">Upload Appraisal Report</div>
            <div class="upload-dropzone-hint">PDF — max 5MB</div>
          </div>

          ${this._renderProcessTracker('Appraisal Process', tasks)}
        </div>`;
    }

    // Step 6: Application Documents
    if (stepIdx === 6) {
      const docs = [
        { name: 'Appraisal Report',            status: 'Pending Upload', party: 'Appraiser',  sentToBorrower: false },
        { name: 'Title Commitment',             status: 'Pending Upload', party: 'Title Co.',  sentToBorrower: false },
        { name: 'Property Insurance Binder',    status: 'Approved',       party: 'Borrower',   sentToBorrower: true  },
        { name: 'Signed Loan Application 1003', status: 'Approved',       party: 'Borrower',   sentToBorrower: true  },
        { name: 'Borrower ID Verification',     status: 'Approved',       party: 'Borrower',   sentToBorrower: true  },
        { name: 'Income Verification (W-2s)',   status: 'Pending Upload', party: 'Borrower',   sentToBorrower: false },
        { name: 'Flood Zone Certification',     status: 'Pending Upload', party: 'Processor',  sentToBorrower: false },
        { name: 'Closing Disclosure',           status: 'Pending Upload', party: 'LO',         sentToBorrower: false },
      ];
      const approvedCount = docs.filter(d => d.status === 'Approved').length;
      const pendingCount = docs.length - approvedCount;

      const tasks = [
        { label: 'Prepare document package',           party: 'Processor',    status: approvedCount >= 3 ? 'done' : 'active' },
        { label: 'Upload outstanding documents',       party: 'Loan Officer', status: pendingCount === 0 ? 'done' : 'active' },
        { label: 'Send documents to borrower for sig', party: 'System',       status: 'pending' },
        { label: 'All documents signed by borrower',   party: 'Borrower',     status: 'pending' },
      ];

      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Application Documents</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">Upload and manage all required loan documents. Send to borrower for signature when complete.</div>

          <div class="doc-package-summary">
            <div class="doc-package-stat"><strong>${approvedCount}</strong> approved</div>
            <div class="doc-package-stat" style="color:var(--color-warning)"><strong>${pendingCount}</strong> pending</div>
            <div class="doc-package-stat">${docs.filter(d => d.sentToBorrower).length} sent to borrower</div>
            <div class="doc-package-bar"><div class="doc-package-bar-fill" style="width:${Math.round(approvedCount/docs.length*100)}%"></div></div>
          </div>

          ${this._renderUploadDocTable(docs)}

          <div style="display:flex;gap:8px;margin-top:16px">
            <button class="btn btn-primary btn-sm">Send All to Borrower</button>
            <button class="btn btn-secondary btn-sm">Send Reminder</button>
          </div>

          ${this._renderProcessTracker('Document Process', tasks)}
        </div>`;
    }

    // Step 7: Final Review / Title
    if (stepIdx === 7) {
      const dti = loanId === 'DCDC000003' ? 38 : Math.round(28 + (loan.ltv || 70) / 5);
      const fico = loan.ltv ? Math.round(680 + loan.ltv / 2) : '—';
      const riskRating = dti > 40 ? 'Medium' : 'Low';
      const riskColor = dti > 40 ? 'var(--color-warning)' : 'var(--color-success)';
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Final Review</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">Verify title, review final conditions, and prepare for closing.</div>

          <div class="app-step-subsection-title">Underwriting Summary</div>
          <div class="step-summary-strip cols-4" style="margin-bottom:20px">
            <div>
              <div class="step-summary-metric-value">${dti}%</div>
              <div class="step-summary-metric-label">DTI Ratio</div>
            </div>
            <div>
              <div class="step-summary-metric-value">${loan.ltv ?? '—'}% / ${loan.cltv ?? '—'}%</div>
              <div class="step-summary-metric-label">LTV / CLTV</div>
            </div>
            <div>
              <div class="step-summary-metric-value">${fico}</div>
              <div class="step-summary-metric-label">Credit Score</div>
            </div>
            <div>
              <div class="step-summary-metric-value" style="color:${riskColor}">${riskRating}</div>
              <div class="step-summary-metric-label">Risk Rating</div>
            </div>
          </div>

          <div class="app-step-subsection-title">Title Company Information</div>
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
          <div style="margin-top:24px">
            <div class="app-step-subsection-title">Final Review Conditions</div>
            ${this._renderStepConditions([
              { label: 'Title commitment received and reviewed',    done: false, party: 'Title Co.',  status: 'Pending',   doc: '', notes: 'First American engaged, ETA 5 business days' },
              { label: 'Final underwriting sign-off',               done: false, party: 'Processor',  status: 'Pending',   doc: '', notes: '' },
              { label: 'Closing Disclosure sent (3-day rule)',      done: false, party: 'LO',         status: 'Pending',   doc: '', notes: 'Must be sent 3 business days before closing' },
              { label: 'VOE — Verification of Employment',         done: false, party: 'LO',         status: 'In Review', doc: '', notes: 'Phone verification scheduled' },
              { label: 'Power of Attorney verification (if applic.)', done: true,  party: 'Processor', status: 'Accepted', doc: '', notes: 'N/A — no POA on file' },
              { label: 'Final credit pull (soft)',                  done: false, party: 'System',     status: 'Pending',   doc: '', notes: 'Scheduled 3 days before close' },
            ])}
          </div>
          <div style="margin-top:24px">
            <div class="app-step-subsection-title">Parties & Contacts</div>
            <table class="app-detail-table" style="margin-top:8px">
              <tbody>
                <tr><td>Borrower</td><td><strong>${loan.borrowerName}</strong></td></tr>
                <tr><td>Loan Officer</td><td><strong>${State.getUser(loan.loId) ? Display.fullName(State.getUser(loan.loId)) : '—'}</strong></td></tr>
                <tr><td>Processor</td><td><strong>Kevin Park</strong></td></tr>
                <tr><td>Appraiser</td><td><strong>Metro Appraisal Services</strong></td></tr>
                <tr><td>Insurance Agent</td><td><strong>State Farm — J. Mitchell</strong></td></tr>
                <tr><td>Title Company</td><td><strong>First American Title — Sandra Reeves</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>`;
    }

    // Step 8: Confirm & Submit
    if (stepIdx === 8) {
      const completedSteps = STEPS.filter(s => s.status === 'completed').length;
      const allDone = completedSteps >= STEPS.length - 1;
      const dti = loanId === 'DCDC000003' ? 38 : Math.round(28 + (loan.ltv || 70) / 5);
      const rate = loanId === 'DCDC000003' ? '6.125%' : loanId === 'DCDC000002' ? '5.875%' : '6.250%';
      const estCloseDate = loanId === 'DCDC000003' ? 'Mar 15, 2026' : 'May 15, 2026';
      const monthlyPayment = Math.round(loan.amount * 0.006); // rough estimate
      const stepDates = ['Mar 15', 'Mar 16', 'Mar 18', 'Mar 22', 'Apr 2', 'Apr 5', 'Apr 8', 'Apr 10', '—'];
      const stepItems = STEPS.map((s, i) => {
        const isDone = s.status === 'completed';
        return `<li class="step-completion-item">
          <span class="step-completion-icon ${isDone ? 'done' : 'pending'}">${isDone ? '✓' : i + 1}</span>
          <span class="step-completion-label" style="color:${isDone ? 'var(--color-text)' : 'var(--color-text-muted)'}">${s.short}</span>
          <span class="step-completion-date">${isDone ? stepDates[i] + ', 2026' : 'Pending'}</span>
        </li>`;
      }).join('');

      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Confirm and Submit</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">Review all steps, confirm loan terms, and submit for final processing.</div>

          <div style="padding:16px;background:var(--color-surface);border-radius:var(--radius-lg);margin-bottom:20px;border:1px solid var(--color-border)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="font-size:14px;font-weight:700;color:var(--color-text)">Application Progress</div>
              <div style="font-size:13px;font-weight:600;color:${allDone ? 'var(--color-success)' : 'var(--color-text-secondary)'}">${completedSteps} of ${STEPS.length} steps completed</div>
            </div>
            <div style="background:var(--color-border);border-radius:4px;height:8px;overflow:hidden;margin-bottom:16px">
              <div style="background:var(--color-primary);height:100%;width:${Math.round(completedSteps/STEPS.length*100)}%;border-radius:4px"></div>
            </div>
            <ul class="step-completion-list">${stepItems}</ul>
          </div>

          <div class="app-step-subsection-title">Final Loan Terms Summary</div>
          <div class="step-summary-strip cols-5" style="margin-bottom:20px">
            <div>
              <div class="step-summary-metric-value">${Display.currency(loan.amount)}</div>
              <div class="step-summary-metric-label">Loan Amount</div>
            </div>
            <div>
              <div class="step-summary-metric-value">${rate}</div>
              <div class="step-summary-metric-label">Interest Rate</div>
            </div>
            <div>
              <div class="step-summary-metric-value">${loan.ltv ?? '—'}% / ${loan.cltv ?? '—'}%</div>
              <div class="step-summary-metric-label">LTV / CLTV</div>
            </div>
            <div>
              <div class="step-summary-metric-value">${dti}%</div>
              <div class="step-summary-metric-label">DTI Ratio</div>
            </div>
            <div>
              <div class="step-summary-metric-value">${Display.currency(monthlyPayment)}</div>
              <div class="step-summary-metric-label">Est. Monthly Payment</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
            <div>
              <div class="app-step-subsection-title">Borrower & Property</div>
              <table class="app-detail-table">
                <tbody>
                  <tr><td>Borrower</td><td><strong>${loan.borrowerName}</strong></td></tr>
                  <tr><td>Property</td><td>${loan.address}</td></tr>
                  <tr><td>Property Type</td><td>Single Family Residence</td></tr>
                  <tr><td>Occupancy</td><td>Primary Residence</td></tr>
                  <tr><td>Program</td><td>${loan.program}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <div class="app-step-subsection-title">Closing Details</div>
              <table class="app-detail-table">
                <tbody>
                  <tr><td>Est. Closing Date</td><td><strong>${estCloseDate}</strong></td></tr>
                  <tr><td>Closing Location</td><td>First American Title — DC Office</td></tr>
                  <tr><td>Title Company</td><td>First American Title</td></tr>
                  <tr><td>Escrow Officer</td><td>Sandra Reeves</td></tr>
                  <tr><td>Wire Instructions</td><td><a style="color:var(--color-primary);font-size:12px;cursor:pointer">View wire details →</a></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          ${!allDone ? `<div style="padding:14px 16px;background:#FEF3C7;border-radius:var(--radius-lg);border:1px solid #FCD34D;font-size:13px;color:#92400E;margin-bottom:16px">
            <strong>Cannot submit yet:</strong> ${STEPS.length - 1 - completedSteps} step${STEPS.length - 1 - completedSteps !== 1 ? 's' : ''} still pending. Complete all prior steps before submitting.
          </div>` : ''}

          <button class="btn btn-primary" ${!allDone ? 'disabled style="opacity:0.5"' : ''}>Submit for Final Review</button>
        </div>`;
    }

    // Step 0: Upload Loan File
    if (stepIdx === 0) {
      const isComplete = step?.status === 'completed';
      const docs = [
        { name: 'Loan File Package (1003 + supporting docs)', status: isComplete ? 'Approved' : 'Pending Upload', party: 'LO' },
        { name: 'Borrower Photo ID (government-issued)',       status: isComplete ? 'Approved' : 'Pending Upload', party: 'Borrower' },
        { name: 'Initial Borrower Authorization Form',         status: isComplete ? 'Approved' : 'Pending Upload', party: 'Borrower' },
        { name: 'Purchase Contract / Sales Agreement',         status: isComplete ? 'Approved' : 'Pending Upload', party: 'LO' },
        { name: 'Preliminary Title Report',                    status: isComplete ? 'Approved' : 'Pending Upload', party: 'LO' },
      ];
      const approvedCount = docs.filter(d => d.status === 'Approved').length;
      const tasks = [
        { label: 'Upload loan file package',           party: 'Loan Officer', status: isComplete ? 'done' : 'active' },
        { label: 'Collect borrower photo ID',          party: 'Borrower',     status: isComplete ? 'done' : 'pending' },
        { label: 'Obtain borrower authorization',      party: 'Borrower',     status: isComplete ? 'done' : 'pending' },
        { label: 'Upload purchase contract',           party: 'Loan Officer', status: isComplete ? 'done' : 'pending' },
      ];
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Upload Loan File</div>
          <div class="step-info-callout">
            <span class="step-info-callout-icon">📋</span>
            <div>Upload the initial loan package to begin the origination process. All required documents must be submitted before the application can move to prequalification.</div>
          </div>
          <div class="doc-package-summary">
            <div class="doc-package-stat"><strong>${approvedCount}</strong> of <strong>${docs.length}</strong> documents received</div>
            <div class="doc-package-bar"><div class="doc-package-bar-fill" style="width:${Math.round(approvedCount/docs.length*100)}%"></div></div>
          </div>

          <div class="upload-dropzone" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="event.preventDefault();this.classList.remove('dragover')">
            <div class="upload-dropzone-icon">📁</div>
            <div class="upload-dropzone-text">Drag and drop files here, or click to browse</div>
            <div class="upload-dropzone-hint">PDF, DOC, DOCX — max 5MB per file</div>
          </div>

          <div style="margin-top:20px">
            <div class="app-step-subsection-title">Required Documents</div>
            ${this._renderUploadDocTable(docs)}
          </div>

          ${this._renderProcessTracker('Origination Process', tasks)}
        </div>`;
    }

    // Step 1: Prequalification
    if (stepIdx === 1) {
      const isComplete = step?.status === 'completed';
      const fico = loan.ltv ? Math.round(680 + loan.ltv / 2) : '—';
      const conditions = [
        { label: 'Credit report pulled',                        done: isComplete, party: 'System',    status: isComplete ? 'Accepted' : 'Pending',   doc: isComplete ? 'credit_report_equifax.pdf' : '', notes: `FICO: ${fico}` },
        { label: 'Income documentation received',               done: isComplete, party: 'Borrower',  status: isComplete ? 'Accepted' : 'Pending',   doc: '', notes: 'W-2s and/or tax returns required' },
        { label: 'Asset verification initiated',                done: isComplete, party: 'Borrower',  status: isComplete ? 'Accepted' : 'Pending',   doc: '', notes: 'Bank statements — 2 most recent months' },
        { label: 'Employment verification completed',           done: isComplete, party: 'LO',        status: isComplete ? 'Accepted' : 'In Review', doc: '', notes: 'Written or verbal VOE required' },
        { label: 'DTI calculation within program limits',       done: isComplete, party: 'System',    status: isComplete ? 'Accepted' : 'Pending',   doc: '', notes: `DTI must be ≤ 50% — current est: ${Math.round(28 + (loan.ltv || 70) / 5)}%` },
        { label: 'Program eligibility confirmed',               done: isComplete, party: 'System',    status: isComplete ? 'Accepted' : 'Pending',   doc: '', notes: `${loan.program} — property must be in eligible market` },
      ];
      const tasks = [
        { label: 'Pull credit report',          party: 'System',       status: isComplete ? 'done' : 'active' },
        { label: 'Verify income documentation', party: 'Borrower',     status: isComplete ? 'done' : 'pending' },
        { label: 'Verify asset statements',     party: 'Borrower',     status: isComplete ? 'done' : 'pending' },
        { label: 'Confirm employment',          party: 'Loan Officer', status: isComplete ? 'done' : 'pending', action: 'Verify' },
        { label: 'Calculate DTI ratio',         party: 'System',       status: isComplete ? 'done' : 'pending' },
      ];
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Prequalification</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">Verify originator, borrower eligibility, and financial qualification before proceeding.</div>

          <div class="step-summary-strip cols-4">
            <div>
              <div class="step-summary-metric-value">${fico}</div>
              <div class="step-summary-metric-label">FICO Score</div>
            </div>
            <div>
              <div class="step-summary-metric-value">${Math.round(28 + (loan.ltv || 70) / 5)}%</div>
              <div class="step-summary-metric-label">Est. DTI</div>
            </div>
            <div>
              <div class="step-summary-metric-value">${loan.ltv ?? '—'}%</div>
              <div class="step-summary-metric-label">LTV</div>
            </div>
            <div>
              <div class="step-summary-metric-value">${conditions.filter(c=>c.done).length}/${conditions.length}</div>
              <div class="step-summary-metric-label">Conditions Met</div>
            </div>
          </div>

          ${this._renderOriginatorInfo(loan)}
          ${this._renderBorrowerInfo(loan)}

          <div class="app-step-subsection-title">Prequalification Conditions <span style="font-size:11px;font-weight:400;color:var(--color-text-muted)">${conditions.filter(c=>c.done).length}/${conditions.length}</span></div>
          <div style="margin-bottom:16px">${this._renderStepConditions(conditions)}</div>

          ${this._renderProcessTracker('Prequalification Process', tasks)}

          <div style="margin-top:20px">
            <button class="btn btn-primary btn-sm" ${isComplete ? 'disabled style="opacity:0.5"' : ''}>Mark Prequalification Complete</button>
          </div>
        </div>`;
    }

    // Step 3: Documents Approved
    if (stepIdx === 3) {
      const isComplete = step?.status === 'completed';
      const docs = [
        { name: 'Signed 1003 — Uniform Residential Loan Application', status: 'Approved',       party: 'Borrower' },
        { name: 'W-2 Wage Statements (2 years)',                       status: 'Approved',       party: 'Borrower' },
        { name: 'Bank Statements (2 months)',                          status: 'Approved',       party: 'Borrower' },
        { name: 'Federal Tax Returns (2 years)',                       status: isComplete ? 'Approved' : 'Pending Upload', party: 'Borrower' },
        { name: 'Loan Estimate (sent to borrower)',                    status: 'Approved',       party: 'LO' },
      ];
      const conditions = [
        { label: 'All income docs verified and cross-referenced',  done: isComplete, party: 'Processor', status: isComplete ? 'Accepted' : 'In Review', doc: '', notes: 'Processor must verify employment and income against 1003' },
        { label: 'Loan Estimate acknowledged by borrower',         done: isComplete, party: 'Borrower',  status: isComplete ? 'Accepted' : 'Pending',   doc: '', notes: '' },
        { label: 'Employment verification completed',              done: isComplete, party: 'LO',        status: isComplete ? 'Accepted' : 'In Review', doc: '', notes: 'Written or verbal VOE' },
        { label: 'LTV within program guidelines',                  done: true,       party: 'System',    status: 'Accepted',                            doc: '', notes: `LTV: ${loan.ltv ?? '—'}% — within ${loan.program} limits` },
      ];
      const approvedCount = docs.filter(d => d.status === 'Approved').length;
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Document Approval Review</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">Review and approve all submitted documents before ordering the appraisal.</div>

          <div class="doc-package-summary">
            <div class="doc-package-stat"><strong>${approvedCount}</strong> of <strong>${docs.length}</strong> approved</div>
            <div class="doc-package-bar"><div class="doc-package-bar-fill" style="width:${Math.round(approvedCount/docs.length*100)}%"></div></div>
          </div>

          <div class="app-step-subsection-title">Documents for This Phase</div>
          <div style="margin-bottom:20px">${this._renderUploadDocTable(docs)}</div>

          <div class="app-step-subsection-title">Approval Conditions <span style="font-size:11px;font-weight:400;color:var(--color-text-muted)">${conditions.filter(c=>c.done).length}/${conditions.length}</span></div>
          <div style="margin-bottom:16px">${this._renderStepConditions(conditions)}</div>
          <button class="btn btn-primary btn-sm" ${isComplete ? 'disabled style="opacity:0.5"' : ''}>Approve Documents</button>
        </div>`;
    }

    // Step 5: DocuTech / Disclosures
    if (stepIdx === 5) {
      const isComplete = step?.status === 'completed';
      const conditions = [
        { label: 'Initial disclosures sent within 3 business days', done: isComplete, party: 'System',    status: isComplete ? 'Accepted' : 'In Review', doc: '', notes: 'TRID compliance — Loan Estimate timing' },
        { label: 'TRID Closing Disclosure prepared',                done: false,      party: 'Processor', status: 'Pending',                              doc: '', notes: 'Must be sent 3 business days before closing' },
        { label: 'HMDA data fields verified',                       done: isComplete, party: 'System',    status: isComplete ? 'Accepted' : 'Pending',    doc: '', notes: 'Race, ethnicity, sex, income — auto-checked' },
        { label: 'Fair lending review cleared',                     done: isComplete, party: 'System',    status: isComplete ? 'Accepted' : 'Pending',    doc: '', notes: '' },
      ];
      const tlSteps = [
        { label: 'LE Sent',                done: true,       date: 'Mar 20, 2026' },
        { label: 'CD Prepared',            done: false,      date: 'Pending' },
        { label: 'CD Sent (3-day rule)',   done: false,      date: 'Pending' },
        { label: 'Borrower Acknowledged',  done: false,      date: 'Pending' },
      ];
      const timelineHtml = tlSteps.map(t => `
        <div class="disclosure-timeline-step ${t.done ? 'done' : ''}">
          <div class="disclosure-timeline-dot ${t.done ? 'done' : 'pending'}">${t.done ? '✓' : ''}</div>
          <div class="disclosure-timeline-label">${t.label}</div>
          <div class="disclosure-timeline-date">${t.date}</div>
        </div>`).join('');

      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Disclosures & Compliance</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px">Prepare and send required disclosures. Verify TRID, HMDA, and fair lending compliance.</div>

          <div class="app-step-subsection-title">Disclosure Timeline</div>
          <div class="disclosure-timeline" style="margin-bottom:24px">${timelineHtml}</div>

          <div class="app-step-subsection-title">Compliance Status</div>
          <div class="compliance-grid">
            <div class="compliance-item"><span class="compliance-dot ${isComplete ? 'pass' : 'pending'}"></span>TRID Compliant</div>
            <div class="compliance-item"><span class="compliance-dot ${isComplete ? 'pass' : 'pending'}"></span>HMDA Complete</div>
            <div class="compliance-item"><span class="compliance-dot ${isComplete ? 'pass' : 'pass'}"></span>Fair Lending Cleared</div>
            <div class="compliance-item"><span class="compliance-dot ${isComplete ? 'pass' : 'pass'}"></span>ECOA Compliance</div>
          </div>

          <div class="app-step-subsection-title">HMDA Data Fields</div>
          <div class="form-grid-4" style="margin-bottom:20px">
            <div class="form-group">
              <label>Ethnicity</label>
              <input class="input" value="Not Hispanic or Latino" readonly style="background:var(--color-surface);font-size:12px" />
            </div>
            <div class="form-group">
              <label>Race</label>
              <input class="input" value="White" readonly style="background:var(--color-surface);font-size:12px" />
            </div>
            <div class="form-group">
              <label>Sex</label>
              <input class="input" value="Male" readonly style="background:var(--color-surface);font-size:12px" />
            </div>
            <div class="form-group">
              <label>Income Bracket</label>
              <input class="input" value="$75,000–$99,999" readonly style="background:var(--color-surface);font-size:12px" />
            </div>
          </div>

          <div class="app-step-subsection-title">Compliance Checklist <span style="font-size:11px;font-weight:400;color:var(--color-text-muted)">${conditions.filter(c=>c.done).length}/${conditions.length}</span></div>
          <div style="margin-bottom:16px">${this._renderStepConditions(conditions)}</div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-primary btn-sm">Send to DocuTech</button>
            <button class="btn btn-secondary btn-sm">Preview Closing Disclosure</button>
          </div>
        </div>`;
    }

    // Default — completed or pending placeholder
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
