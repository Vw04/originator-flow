/* ============================================================
   HOMIUM ORIGINATOR FLOW — Data Platform View
   Dashboard, Applications, Originations, Batches, Activations
   ============================================================ */

const DataPlatformView = {

  _activeTab: 'analytics',
  _selectedApplicationId: null,
  _activeStep: 4, // 0-indexed; default to "Initial Application Review"
  _appFilter: 'all',

  /* Sub-tab config per role */
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
    return all; // sys_admin, operator
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

  /* ---- Shared Token Cards ---- */
  _renderTokenCards() {
    return `
      <div class="lop-token-cards">
        <div class="lop-token-card lop-token-card-dark">
          <div class="lop-token-card-ticker">HOM &nbsp;·&nbsp; Homium Class H</div>
          <div class="lop-token-card-price">$1.00000</div>
          <div class="lop-token-card-label">Current Price</div>
        </div>
        <div class="lop-token-card lop-token-card-light">
          <div class="lop-token-card-ticker">Total Homium Minted</div>
          <div class="lop-token-card-price" style="color:var(--color-primary)">0</div>
          <div class="lop-token-card-label">Current supply: 0 HOM tokens minted</div>
        </div>
        <div class="lop-token-card lop-token-card-light">
          <div class="lop-token-card-ticker">Homium Market Cap</div>
          <div class="lop-token-card-price" style="color:var(--color-primary)">$0</div>
          <div class="lop-token-card-label">Current market cap in USD</div>
        </div>
      </div>`;
  },

  /* ---- Dashboard (was Analytics) ---- */
  _renderDashboard() {
    const loans  = State.getLoans();
    const total  = loans.reduce((s, l) => s + l.amount, 0);
    const ltvLoans = loans.filter(l => l.ltv);
    const avgLTV = ltvLoans.length
      ? (ltvLoans.reduce((s, l) => s + l.ltv, 0) / ltvLoans.length).toFixed(1)
      : '—';

    // Estimated underlying property value: amount / (ltv/100) where available
    const totalPropVal = ltvLoans.reduce((s, l) => s + (l.amount / (l.ltv / 100)), 0);

    const sanStats = [
      { label: 'Average Loan Size',                  value: loans.length ? Display.currency(Math.round(total / loans.length)) : '$0' },
      { label: 'Total Number of Loans',              value: loans.length },
      { label: 'Total Loan Value',                   value: Display.currency(total) },
      { label: 'Total Underlying Property Value',    value: Display.currency(Math.round(totalPropVal)) },
      { label: 'Weighted Avg Age (months)',           value: '14.2' },
      { label: 'Weighted Avg Origination FICO',      value: '718' },
      { label: 'Average LTV',                        value: avgLTV !== '—' ? `${avgLTV}%` : '—' },
      { label: 'Average Origination LTV',            value: avgLTV !== '—' ? `${avgLTV}%` : '—' },
    ];

    const statsHtml = sanStats.map(s => `
      <div class="san-pool-stat">
        <div class="san-pool-stat-value">${s.value}</div>
        <div class="san-pool-stat-label">${s.label}</div>
      </div>`).join('');

    return `
      ${this._renderTokenCards()}
      <div class="card" style="margin-bottom:20px">
        <div class="card-title" style="margin-bottom:20px">Homium SAN Pool Summary</div>
        <div class="san-pool-grid">${statsHtml}</div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">Homium Loan by Location</div>
        ${this._renderMap(loans)}
      </div>`;
  },

  /* ---- Applications ---- */
  _renderApplications() {
    if (this._selectedApplicationId) {
      return this._renderApplicationDetail(this._selectedApplicationId);
    }

    const role  = State.getRole();
    const user  = State.getCurrentUser();
    const allLoans = (role === 'lo' || role === 'lp')
      ? State.getLoansByLO(user?.id)
      : State.getLoans();

    const canCreate = ['lo', 'prog_admin', 'sys_admin', 'operator'].includes(role);

    let loans = allLoans;
    if (this._appFilter === 'prequalifications') {
      loans = allLoans.filter(l => l.status === 'prequalification_in_progress');
    } else if (this._appFilter === 'applications') {
      loans = allLoans.filter(l => l.status !== 'prequalification_in_progress');
    }

    const rows = loans.map((l, i) => `
      <tr style="cursor:pointer" onclick="DataPlatformView.openApplication('${l.id}')">
        <td style="color:var(--color-text-muted);font-size:12px">${i + 1}</td>
        <td style="font-size:12px;font-weight:600;color:var(--color-primary)">${l.id}</td>
        <td>${l.borrowerName}</td>
        <td>${Display.currency(l.amount)}</td>
        <td style="color:var(--color-text-secondary)">${l.address.split(',').slice(-3,-2)[0]?.trim() || '—'}</td>
        <td style="font-size:12px;color:var(--color-text-secondary);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.address.split(',').slice(0,2).join(',').trim()}</td>
        <td><span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span></td>
        <td><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();DataPlatformView.openApplication('${l.id}')">View</button></td>
      </tr>`).join('');

    return `
      ${this._renderTokenCards()}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div style="font-size:20px;font-weight:700;color:var(--color-text)">Applications
          <span style="font-size:13px;font-weight:400;color:var(--color-text-muted);margin-left:8px">${allLoans.length} total</span>
        </div>
        ${canCreate ? `<button class="btn btn-primary btn-sm" onclick="DataPlatformView._openNewAppModal()">+ Create New Application</button>` : ''}
      </div>
      <div class="lop-filter-tabs">
        <div class="lop-filter-tab ${this._appFilter === 'all' ? 'active' : ''}" onclick="DataPlatformView._setFilter('all')">All</div>
        <div class="lop-filter-tab ${this._appFilter === 'applications' ? 'active' : ''}" onclick="DataPlatformView._setFilter('applications')">Applications</div>
        <div class="lop-filter-tab ${this._appFilter === 'prequalifications' ? 'active' : ''}" onclick="DataPlatformView._setFilter('prequalifications')">Prequalifications</div>
      </div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th>#</th>
            <th>Loan Identifier</th>
            <th>Borrower Name</th>
            <th>Loan Amount ($)</th>
            <th>City</th>
            <th>Address</th>
            <th>Application Stage</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted);padding:32px">No applications found</td></tr>'}</tbody>
        </table>
      </div>
      <div id="dp-modal"></div>`;
  },

  _setFilter(filter) {
    this._appFilter = filter;
    App.renderView('/data/applications');
  },

  /* ---- Application Detail ---- */
  _renderApplicationDetail(loanId) {
    const loan = State.getLoans().find(l => l.id === loanId);
    if (!loan) return '<div class="empty-state">Application not found.</div>';

    const STEPS = [
      { label: 'Upload Loan File',               status: 'completed' },
      { label: 'Verify Originator Information',  status: 'completed' },
      { label: 'Property & Loan Information',    status: 'completed' },
      { label: 'Borrower Information',           status: 'completed' },
      { label: 'Initial Application Review',     status: 'in_progress' },
      { label: 'Appraisal',                      status: 'pending' },
      { label: 'Application Documents Upload',   status: 'pending' },
      { label: 'Final Application Review',       status: 'pending' },
      { label: 'Confirm and Submit',             status: 'pending' },
    ];

    const sidebarSteps = STEPS.map((s, i) => {
      const icon = s.status === 'completed' ? '✓'
                 : s.status === 'in_progress' ? '●' : `${i + 1}`;
      return `
        <div class="app-detail-step app-detail-step-${s.status} ${this._activeStep === i ? 'active' : ''}"
             onclick="DataPlatformView.selectStep(${i})">
          <span class="app-detail-step-icon">${icon}</span>
          <span class="app-detail-step-label">${s.label}</span>
        </div>`;
    }).join('');

    const mainContent = this._renderStepContent(this._activeStep, loan);
    const addrParts   = loan.address.split(',');
    const streetAddr  = addrParts[0]?.trim() || loan.address;
    const cityState   = addrParts.slice(1).join(',').trim();

    return `
      <div style="margin-bottom:16px">
        <button class="btn btn-ghost btn-sm" onclick="DataPlatformView._backToApplications()">← Back to Applications</button>
      </div>
      <div class="app-detail-layout">
        <div class="app-detail-sidebar">
          <div class="app-detail-sidebar-title">Application Steps</div>
          ${sidebarSteps}
        </div>
        <div class="app-detail-main">
          <div class="app-header-card">
            <div style="flex:1;min-width:0">
              <div class="app-header-address">${streetAddr}</div>
              <div class="app-header-citystate">${cityState}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:2px">Loan ID</div>
              <div style="font-size:13px;font-weight:700;color:var(--color-primary)">${loan.id}</div>
              <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">Type</div>
              <div style="font-size:12px;font-weight:600">Home Equity Investment</div>
            </div>
          </div>
          ${mainContent}
        </div>
      </div>
      <div id="dp-modal"></div>`;
  },

  _backToApplications() {
    this._selectedApplicationId = null;
    App.renderView('/data/applications');
  },

  _renderStepContent(stepIdx, loan) {
    const purchasePrice   = Math.round(loan.amount / ((loan.ltv || 75) / 100));
    const lenderFee       = Math.round(loan.amount * 0.01);
    const servicingFee    = Math.round(loan.amount * 0.005);
    const ltv             = loan.ltv ? `${loan.ltv}%` : '—';
    const cltv            = loan.cltv ? `${loan.cltv}%` : (loan.ltv ? `${Math.round(loan.ltv * 1.05)}%` : '—');

    if (stepIdx === 4) { // Initial Application Review
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Initial Application Confirmation</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <div>
              <div class="app-step-subsection-title">Loan Overview</div>
              <table class="app-detail-table">
                <tbody>
                  <tr><td>Purchase Price</td><td>${Display.currency(purchasePrice)}</td></tr>
                  <tr><td>1st Mortgage Principal</td><td>${Display.currency(Math.round(purchasePrice * 0.72))}</td></tr>
                  <tr><td>Loan Amount</td><td><strong>${Display.currency(loan.amount)}</strong></td></tr>
                  <tr><td>Borrower Net</td><td>${Display.currency(Math.round(loan.amount * 0.97))}</td></tr>
                  <tr><td>Estimated Additional Financing</td><td>$0</td></tr>
                  <tr><td>LTV</td><td>${ltv}</td></tr>
                  <tr><td>CLTV</td><td>${cltv}</td></tr>
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
          <div style="display:flex;gap:12px;margin-top:20px">
            <button class="btn btn-secondary btn-sm">Uniform Residential Loan Application</button>
            <button class="btn btn-secondary btn-sm">Download MISMO XML</button>
          </div>
        </div>`;
    }

    if (stepIdx === 6) { // Application Documents Upload
      const docs = [
        { name: 'Appraisal Report',             status: 'Pending Upload' },
        { name: 'Title Commitment',              status: 'Pending Upload' },
        { name: 'Property Insurance',            status: 'Approved' },
        { name: 'Signed Loan Application',       status: 'Approved' },
        { name: 'Borrower ID Verification',      status: 'Approved' },
        { name: 'Income Verification',           status: 'Pending Upload' },
        { name: 'Flood Zone Certification',      status: 'Pending Upload' },
      ];
      const docRows = docs.map(d => `
        <tr>
          <td>${d.name}</td>
          <td><span class="badge ${d.status === 'Approved' ? 'badge-active' : 'badge-pending'}">${d.status}</span></td>
          <td>${d.status === 'Pending Upload' ? `<button class="btn btn-ghost btn-xs">Click to upload</button>` : '—'}</td>
        </tr>`).join('');
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Underwriting Documents</div>
          <table class="app-detail-table" style="width:100%">
            <thead><tr><th>Document</th><th>Status</th><th>Your Action</th></tr></thead>
            <tbody>${docRows}</tbody>
          </table>
        </div>`;
    }

    if (stepIdx === 7) { // Final Application Review
      return `
        <div class="app-step-section">
          <div class="app-step-section-title">Title Information</div>
          <div class="form-grid">
            <div class="form-group">
              <label>Title Company Name</label>
              <input class="input" placeholder="e.g. First American Title" />
            </div>
            <div class="form-group">
              <label>Title Officer</label>
              <input class="input" placeholder="Contact name" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input class="input" placeholder="(555) 000-0000" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input class="input" placeholder="officer@titleco.com" />
            </div>
            <div class="form-group form-full">
              <label>Title Company Address</label>
              <input class="input" placeholder="Street address" />
            </div>
          </div>
        </div>`;
    }

    // Default step content (completed or pending)
    const STEPS = [
      { label: 'Upload Loan File',               status: 'completed' },
      { label: 'Verify Originator Information',  status: 'completed' },
      { label: 'Property & Loan Information',    status: 'completed' },
      { label: 'Borrower Information',           status: 'completed' },
      { label: 'Initial Application Review',     status: 'in_progress' },
      { label: 'Appraisal',                      status: 'pending' },
      { label: 'Application Documents Upload',   status: 'pending' },
      { label: 'Final Application Review',       status: 'pending' },
      { label: 'Confirm and Submit',             status: 'pending' },
    ];
    const step = STEPS[stepIdx];
    if (step.status === 'completed') {
      return `<div class="app-step-section" style="text-align:center;padding:40px 20px;color:var(--color-text-muted)">
        <div style="font-size:32px;margin-bottom:12px">✓</div>
        <div style="font-size:15px;font-weight:600;color:var(--color-text);margin-bottom:6px">${step.label}</div>
        <div style="font-size:13px">This step has been completed.</div>
      </div>`;
    }
    return `<div class="app-step-section" style="text-align:center;padding:40px 20px;color:var(--color-text-muted)">
      <div style="font-size:32px;margin-bottom:12px">⏳</div>
      <div style="font-size:15px;font-weight:600;color:var(--color-text);margin-bottom:6px">${step.label}</div>
      <div style="font-size:13px">This step is pending completion of earlier steps.</div>
    </div>`;
  },

  /* ---- Originations ---- */
  _renderOriginations() {
    const role  = State.getRole();
    const user  = State.getCurrentUser();
    const loans = (role === 'lo' || role === 'lp')
      ? State.getLoansByLO(user?.id)
      : State.getLoans().filter(l => l.status !== 'draft');

    const avgLTV = loans.filter(l => l.ltv).reduce((s, l) => s + l.ltv, 0) / Math.max(loans.filter(l => l.ltv).length, 1);

    const rows = loans.map((l, i) => `
      <tr>
        <td style="color:var(--color-text-muted);font-size:12px">${i + 1}</td>
        <td style="font-size:12px;font-weight:600;color:var(--color-primary)">${l.id}</td>
        <td>${l.borrowerName}</td>
        <td style="font-size:12px;color:var(--color-text-secondary);max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.address}</td>
        <td><span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span></td>
        <td>${Display.currency(l.amount)}</td>
        <td>${Display.currency(Math.round(l.amount / 1000))}</td>
        <td><button class="btn btn-ghost btn-xs">View</button></td>
      </tr>`).join('');

    return `
      ${this._renderTokenCards()}
      <div class="stat-row" style="margin-bottom:24px">
        <div class="stat-item">
          <div class="stat-label">Total Originated</div>
          <div class="stat-value" style="font-size:28px">${loans.length}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Total Value</div>
          <div class="stat-value" style="font-size:28px">${Display.currency(loans.reduce((s,l)=>s+l.amount,0))}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Avg LTV</div>
          <div class="stat-value" style="font-size:28px">${avgLTV.toFixed(1)}%</div>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th>#</th>
            <th>Loan Identifier</th>
            <th>Borrower Name</th>
            <th>Address</th>
            <th>Phase</th>
            <th>Loan ($)</th>
            <th>Total Homium ($)</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted);padding:32px">No originations found</td></tr>'}</tbody>
        </table>
      </div>`;
  },

  /* ---- Batches ---- */
  _renderBatches() {
    const role  = State.getRole();
    const loans = State.getLoans();
    const canCreate = ['sys_admin', 'operator', 'prog_admin'].includes(role);

    const batches = [
      { id: 'BATCH-2026-001', count: 3, value: loans.slice(0,3).reduce((s,l)=>s+l.amount,0),  status: 'Pending Issuance', statusClass: 'badge-warning', created: '2026-03-10' },
      { id: 'BATCH-2026-002', count: 2, value: loans.slice(3,5).reduce((s,l)=>s+l.amount,0),  status: 'Draft',            statusClass: 'badge-neutral', created: '2026-03-20' },
      { id: 'BATCH-2025-003', count: 5, value: loans.slice(5,10).reduce((s,l)=>s+l.amount,0), status: 'Issued',           statusClass: 'badge-active',  created: '2025-11-14' },
    ];

    const totalLoans = batches.reduce((s, b) => s + b.count, 0);
    const totalValue = batches.reduce((s, b) => s + b.value, 0);

    const rows = batches.map(b => `
      <tr>
        <td style="font-size:12px;font-weight:600;color:var(--color-primary)">${b.id}</td>
        <td>${b.count}</td>
        <td>${Display.currency(b.value)}</td>
        <td>${Display.date(b.created)}</td>
        <td><span class="badge ${b.statusClass}">${b.status}</span></td>
        <td><button class="btn btn-ghost btn-xs">View Batch</button></td>
      </tr>`).join('');

    return `
      <div class="stat-row" style="margin-bottom:24px">
        <div class="stat-item">
          <div class="stat-label">Total Batches</div>
          <div class="stat-value" style="font-size:28px">${batches.length}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Total Loans in Batches</div>
          <div class="stat-value" style="font-size:28px">${totalLoans}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Total Value</div>
          <div class="stat-value" style="font-size:28px">${Display.currency(totalValue)}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="font-size:13px;color:var(--color-text-secondary)">${batches.length} batches</div>
        ${canCreate ? `<button class="btn btn-primary btn-sm">+ Create New Batch</button>` : ''}
      </div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Batch ID</th>
            <th># Loans</th>
            <th>Total Value</th>
            <th>Created</th>
            <th>Status</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  /* ---- Activations ---- */
  _renderActivations() {
    const activations = [
      { id: 'ACT-2025-003', batch: 'BATCH-2025-003', tokens: 788.7,  usd: 788700,  date: '2025-11-14', status: 'Activated' },
      { id: 'ACT-2025-002', batch: 'BATCH-2025-002', tokens: 512.0,  usd: 512000,  date: '2025-09-22', status: 'Activated' },
      { id: 'ACT-2025-001', batch: 'BATCH-2025-001', tokens: 341.5,  usd: 341500,  date: '2025-07-08', status: 'Activated' },
    ];

    const totalTokens = activations.reduce((s, a) => s + a.tokens, 0);
    const lastDate    = activations[0]?.date ? Display.date(activations[0].date) : '—';

    const rows = activations.map(a => `
      <tr>
        <td style="font-size:12px;font-weight:600;color:var(--color-primary)">${a.id}</td>
        <td style="font-size:12px;color:var(--color-text-muted)">${a.batch}</td>
        <td>${a.tokens.toFixed(1)} HOM</td>
        <td>${Display.currency(a.usd)}</td>
        <td>${Display.date(a.date)}</td>
        <td><span class="badge badge-active">${a.status}</span></td>
        <td><button class="btn btn-ghost btn-xs">View</button></td>
      </tr>`).join('');

    return `
      <div class="stat-row" style="margin-bottom:24px">
        <div class="stat-item">
          <div class="stat-label">Total Activated</div>
          <div class="stat-value" style="font-size:28px">${activations.length}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Total HOM Tokens</div>
          <div class="stat-value" style="font-size:28px">${totalTokens.toFixed(1)}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Last Activation</div>
          <div class="stat-value" style="font-size:22px">${lastDate}</div>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Activation ID</th>
            <th>Batch</th>
            <th>HOM Tokens</th>
            <th>USD Value</th>
            <th>Activation Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  /* ---- US Map with loan location dots ---- */
  _renderMap(loans) {
    const CITY_COORDS = {
      'Washington':  { x: 598, y: 218 },
      'Louisville':  { x: 530, y: 235 },
      'Lexington':   { x: 548, y: 228 },
    };

    const cityData = {};
    loans.forEach(l => {
      const city = l.address.split(',')[1]?.trim() || l.address.split(',')[0]?.trim() || '';
      const key = Object.keys(CITY_COORDS).find(c => city.toLowerCase().includes(c.toLowerCase()));
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
        <title>${city}: ${data.count} loan${data.count>1?'s':''} · ${Display.currency(data.total)}</title>`;
    }).join('');

    const usPath = `M 150,120 L 155,95 L 170,85 L 200,80 L 230,75 L 260,70 L 290,68 L 320,65 L 350,63 L 380,62 L 420,62 L 460,64 L 490,68 L 510,72 L 530,70 L 560,65 L 590,62 L 620,65 L 650,70 L 670,80 L 680,95 L 685,110 L 682,130 L 675,148 L 665,162 L 655,175 L 648,190 L 642,210 L 638,225 L 640,240 L 644,255 L 648,265 L 645,278 L 635,290 L 620,298 L 600,302 L 580,305 L 560,308 L 535,312 L 510,315 L 485,318 L 460,318 L 435,315 L 410,310 L 385,305 L 360,300 L 335,295 L 310,290 L 285,282 L 262,272 L 242,260 L 228,248 L 215,235 L 205,220 L 195,205 L 183,192 L 170,178 L 158,160 L 150,145 Z`;

    return `
      <div style="position:relative;background:#F8F7F2;border-radius:6px;overflow:hidden;padding:8px">
        <svg viewBox="0 0 800 400" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
          <path d="${usPath}" fill="#E8E6E0" stroke="#C8C5BE" stroke-width="1.5" />
          <line x1="420" y1="62" x2="415" y2="318" stroke="#D4D1CA" stroke-width="0.8" opacity="0.5"/>
          <line x1="530" y1="70" x2="535" y2="312" stroke="#D4D1CA" stroke-width="0.8" opacity="0.5"/>
          <line x1="310" y1="65" x2="310" y2="290" stroke="#D4D1CA" stroke-width="0.8" opacity="0.5"/>
          ${dots || ''}
        </svg>
        ${Object.keys(cityData).length === 0 ? '<div style="text-align:center;font-size:12px;color:var(--color-text-muted);padding:8px">No location data</div>' : ''}
        <div style="display:flex;gap:16px;flex-wrap:wrap;padding:4px 4px 0">
          ${Object.entries(cityData).map(([city, d]) => `
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--color-text-secondary)">
              <span style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);display:inline-block;opacity:0.75"></span>
              ${city} (${d.count})
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ---- New Application modal ---- */
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
