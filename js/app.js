/* ============================================================
   HOMIUM ORIGINATOR FLOW — App Entry Point
   ============================================================ */

const App = {

  init() {
    Router.register('/', () => this.renderRole());
    Router.register('/dashboard',    () => this.renderShell(DashboardView.render()));
    Router.register('/onboarding',   () => {
      const r = State.getRole();
      if (['sys_admin','operator','prog_admin'].includes(r)) return Router.navigate('/origination-companies', { replace: true });
      return this.renderShell(OnboardingView.render());
    });
    Router.register('/profile',      () => this.renderShell(ProfileView.renderMyProfile()));
    Router.register('/originations', (path) => {
      const match = path.match(/^\/originations\/(.+)$/);
      if (match) {
        OriginationsView._viewMode = 'detail';
        OriginationsView._selectedLoanId = match[1];
      } else {
        OriginationsView._viewMode = 'list';
        OriginationsView._selectedLoanId = null;
      }
      this.renderShell(OriginationsView.render());
    });

    // Section routes
    Router.register('/admin-dashboard',       () => this.renderShell(AdminDashboardView.render()));
    Router.register('/origination-companies', (path) => this.renderShell(OriginationCompaniesView.render(path)));
    Router.register('/investors',             (path) => this.renderShell(InvestorsView.render(path)));
    Router.register('/platform',              (path) => this.renderShell(PlatformOpsView.render(path)));
    Router.register('/system-config',         (path) => this.renderShell(SystemConfigView.render(path)));

    // Legacy redirects
    Router.register('/companies',    () => Router.navigate('/origination-companies', { replace: true }));
    Router.register('/branches',     () => Router.navigate('/origination-companies', { replace: true }));
    Router.register('/users',        () => Router.navigate('/origination-companies', { replace: true }));
    Router.register('/permissions',  () => Router.navigate('/platform/permissions', { replace: true }));

    // Data Platform sub-routes
    Router.register('/data/analytics',    () => { DataPlatformView._activeTab = 'analytics';    this.renderShell(DataPlatformView.render()); });
    Router.register('/data/applications', () => { DataPlatformView._activeTab = 'applications'; this.renderShell(DataPlatformView.render()); });
    // /data/originations removed — originations now served by /originations (OriginationsView)
    Router.register('/data/batches',      () => { DataPlatformView._activeTab = 'batches';      this.renderShell(DataPlatformView.render()); });
    Router.register('/data/activations',  () => { DataPlatformView._activeTab = 'activations';  this.renderShell(DataPlatformView.render()); });

    // Mobile routes
    Router.register('/m/home',          () => this.renderMobileShell(MobileHomeView.render()));
    Router.register('/m/loans',         () => this.renderMobileShell(MobileLoansView.render()));
    Router.register('/m/companies',     () => this.renderMobileShell(MobileLoansView.render()));
    Router.register('/m/profile',       () => this.renderMobileShell(MobileProfileView.render()));
    Router.register('/m/notifications', () => this.renderMobileShell(MobileNotificationsView.render()));
    Router.register('/m/detail',        (path) => {
      const id = path.replace('/m/detail/', '');
      if (id && id !== '/m/detail') MobileDetailView._loanId = id;
      this.renderMobileShell(MobileDetailView.render());
    });

    Router.init();
  },

  renderRole() {
    document.getElementById('app').innerHTML = RoleSelectView.render();
  },

  renderMobileShell(content) {
    document.getElementById('app').innerHTML = `
      <div class="mobile-shell">
        <div class="mobile-main" id="mobile-main">${content}</div>
        ${MobileNav.render()}
      </div>`;
    MobileNav.setActive(Router.getCurrentPath());
  },

  renderShell(content) {
    const impTarget = State.isImpersonating() ? State.getImpersonationTarget() : null;
    const impBanner = impTarget ? `
      <div class="impersonation-banner">
        <span>Impersonating <strong>${Display.fullName(impTarget)}</strong> (${Display.roleName(impTarget.role)})</span>
        <button class="btn btn-sm btn-secondary" onclick="App.stopImpersonation()">Stop Impersonating</button>
      </div>` : '';

    document.getElementById('app').innerHTML = `
      <div class="app-shell">
        ${Nav.render()}
        ${impBanner}
        <div class="main-content">${content}</div>
      </div>`;
    Nav.setActive(Router.getCurrentPath() || '/data/analytics');
  },

  renderView(path) {
    const mainEl = document.querySelector('.main-content');
    if (!mainEl) { Router.navigate(path); return; }

    const viewMap = {
      '/admin-dashboard':          () => AdminDashboardView.render(),
      '/dashboard':               () => DashboardView.render(),
      '/onboarding':              () => {
        const r = State.getRole();
        if (['sys_admin','operator','prog_admin'].includes(r)) { Router.navigate('/origination-companies', { replace: true }); return ''; }
        return OnboardingView.render();
      },
      '/profile':                 () => ProfileView.renderMyProfile(),
      '/originations':            () => {
        const curPath = Router.getCurrentPath();
        const match = curPath.match(/^\/originations\/(.+)$/);
        if (match) {
          OriginationsView._viewMode = 'detail';
          OriginationsView._selectedLoanId = match[1];
        }
        return OriginationsView.render();
      },
      '/origination-companies':   () => OriginationCompaniesView.render(path),
      '/investors':               () => InvestorsView.render(path),
      '/platform':                () => PlatformOpsView.render(path),
      '/system-config':           () => SystemConfigView.render(path),
      '/data/analytics':          () => { DataPlatformView._activeTab = 'analytics';    return DataPlatformView.render(); },
      '/data/applications':       () => { DataPlatformView._activeTab = 'applications'; return DataPlatformView.render(); },
      // /data/originations removed — originations now served by /originations
      '/data/batches':            () => { DataPlatformView._activeTab = 'batches';      return DataPlatformView.render(); },
      '/data/activations':        () => { DataPlatformView._activeTab = 'activations';  return DataPlatformView.render(); },
    };

    let fn = viewMap[path];
    if (!fn) {
      for (const [key, handler] of Object.entries(viewMap)) {
        if (key !== '/' && path.startsWith(key)) { fn = handler; break; }
      }
    }

    if (fn) {
      mainEl.innerHTML = fn();
      Nav.setActive(path);
    }
  },

  switchRole() {
    State.setRole(null);
    State.setViewMode('desktop');
    Router.navigate('/', { replace: true });
    this.renderRole();
  },

  startImpersonation(userId) {
    State.startImpersonation(userId);
    ProfileView.close();
    DataPlatformView._activeTab = 'analytics';
    this.renderShell(DataPlatformView.render());
    Nav.setActive('/data/analytics');
    Router.navigate('/data/analytics', { replace: true });
  },

  stopImpersonation() {
    State.stopImpersonation();
    DataPlatformView._activeTab = 'analytics';
    this.renderShell(DataPlatformView.render());
    Router.navigate('/data/analytics', { replace: true });
  },
};

/* ============================================================
   Originations View — Enhanced List + Detail
   ============================================================ */

const OriginationsView = {

  /* ── State ── */
  _viewMode: 'list',           // 'list' | 'detail'
  _selectedLoanId: null,
  _filter: 'all',              // 'all' | 'originations' | 'prequalifications'
  _search: '',
  _sortField: null,
  _sortDir: 'asc',
  _page: 0,
  _pageSize: 15,
  _activeSidebarTab: 'details',
  _expandedStages: new Set(),
  _collapsedSections: new Set(),

  /* ── Days-in-stage (demo approximations) ── */
  _LOAN_DAYS: {
    'DCDC000001': 21, 'DCDC000002': 29, 'DCDC000003': 46,
    'DCDC000004': 3,  'DCDC000005': 18, 'DCDC000006': 27,
    'KDKY000001': 22, 'KDKY000002': 34,
  },
  _daysInStage(loan) { return this._LOAN_DAYS[loan.id] || Math.floor(Math.random() * 20 + 5); },

  /* ── Main render dispatcher ── */
  render() {
    if (this._viewMode === 'detail' && this._selectedLoanId) {
      return this._renderDetail();
    }
    return this._renderList();
  },

  /* ================================================================
     LIST VIEW
  ================================================================ */
  _renderList() {
    const role  = State.getRole();
    const user  = State.getCurrentUser();
    let loans = (role === 'lo' || role === 'lp')
      ? State.getLoansByLO(user?.id)
      : State.getLoans();

    const title = role === 'lo' ? 'My Originations' : 'Originations';

    /* ── KPI Metrics ── */
    const active    = loans.filter(l => l.status !== 'draft' && l.status !== 'completed');
    const completed = loans.filter(l => l.status === 'completed');
    const totalVal  = loans.reduce((s, l) => s + l.amount, 0);
    const activeVal = active.reduce((s, l) => s + l.amount, 0);
    const avgAmount = loans.length ? Math.round(totalVal / loans.length) : 0;
    const closeRate = loans.length ? Math.round((completed.length / loans.length) * 100) : 0;
    const avgDays   = active.length
      ? Math.round(active.reduce((s, l) => s + this._daysInStage(l), 0) / active.length)
      : 0;
    const stalled   = active.filter(l => this._daysInStage(l) > 14);

    const kpis = [
      { label: 'Total Originations', value: loans.length, sub: Display.currency(totalVal) + ' total value' },
      { label: 'Active Pipeline',    value: Display.currency(activeVal), sub: `${active.length} loan${active.length !== 1 ? 's' : ''} in progress` },
      { label: 'Avg Loan Amount',    value: Display.currency(avgAmount), sub: `Across ${loans.length} loans` },
      { label: 'Close Rate',         value: closeRate + '%', sub: `${completed.length} of ${loans.length} completed` },
      { label: 'Avg Days in Stage',  value: avgDays, sub: active.length ? 'Active loans' : 'No active loans' },
      { label: 'At-Risk',            value: stalled.length, sub: stalled.length ? 'Stalled >14 days' : 'All on track', accent: stalled.length > 0 },
    ];

    const kpiHtml = `<div class="lop-kpi-cards" style="grid-template-columns:repeat(6,1fr);margin-bottom:20px">${
      kpis.map(k => `
        <div class="lop-kpi-card">
          <div class="lop-kpi-value" ${k.accent ? 'style="color:var(--color-danger)"' : ''}>${k.value}</div>
          <div class="lop-kpi-label">${k.label}</div>
          <div class="lop-kpi-sub">${k.sub}</div>
        </div>`).join('')
    }</div>`;

    /* ── Filter & Search ── */
    const filters = [
      { key: 'all', label: 'All' },
      { key: 'originations', label: 'Originations' },
      { key: 'prequalifications', label: 'Prequalifications' },
    ];
    const filterHtml = `<div class="orig-filter-tabs">${filters.map(f =>
      `<button class="orig-filter-tab ${this._filter === f.key ? 'active' : ''}" onclick="OriginationsView._setFilter('${f.key}')">${f.label}</button>`
    ).join('')}</div>`;

    /* ── Apply filters ── */
    let filtered = [...loans];
    if (this._filter === 'originations') filtered = filtered.filter(l => l.phase === 'origination' || !l.phase);
    if (this._filter === 'prequalifications') filtered = filtered.filter(l => l.phase === 'prequalification');
    if (this._search) {
      const q = this._search.toLowerCase();
      filtered = filtered.filter(l =>
        l.id.toLowerCase().includes(q) ||
        l.borrowerName.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
      );
    }

    /* ── Sort ── */
    if (this._sortField) {
      const dir = this._sortDir === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        let va = a[this._sortField], vb = b[this._sortField];
        if (typeof va === 'string') return va.localeCompare(vb) * dir;
        return ((va || 0) - (vb || 0)) * dir;
      });
    }

    /* ── Paginate ── */
    const totalPages = Math.ceil(filtered.length / this._pageSize) || 1;
    if (this._page >= totalPages) this._page = totalPages - 1;
    const pageLoans = filtered.slice(this._page * this._pageSize, (this._page + 1) * this._pageSize);

    /* ── Table ── */
    const sortIcon = (field) => {
      if (this._sortField !== field) return '<span style="opacity:0.3">&#8597;</span>';
      return this._sortDir === 'asc' ? '&#9650;' : '&#9660;';
    };

    const tableHtml = `
      <div class="card" style="padding:0;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px">
          <div style="display:flex;align-items:center;gap:12px">
            ${filterHtml}
            <span style="font-size:12px;color:var(--color-text-muted)">${filtered.length} result${filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <input class="orig-table-search" style="width:220px;margin-top:0" placeholder="Search by ID, borrower, address..."
                   value="${this._search}" oninput="OriginationsView._setSearch(this.value)" />
            ${role === 'lo' ? `<button class="btn btn-primary btn-sm" onclick="OriginationsView.showNewAppModal()">+ New Application</button>` : ''}
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead><tr>
              <th class="orig-col-sort" onclick="OriginationsView._setSort('id')">ID ${sortIcon('id')}</th>
              <th>Loan Identifier</th>
              <th class="orig-col-sort" onclick="OriginationsView._setSort('borrowerName')">Borrower Name ${sortIcon('borrowerName')}</th>
              <th>Address</th>
              <th>Phase</th>
              <th class="orig-col-sort" onclick="OriginationsView._setSort('amount')">Loan ($) ${sortIcon('amount')}</th>
              <th>Progress</th>
              <th class="orig-col-sort" onclick="OriginationsView._setSort('updatedAt')">Updated ${sortIcon('updatedAt')}</th>
            </tr></thead>
            <tbody>
              ${pageLoans.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--color-text-muted)">No originations found</td></tr>` :

                pageLoans.map(l => {
                  const proc = generateOriginationProcess(l.status);
                  const totalTasks = proc.reduce((s, st) => s + st.tasks.length, 0);
                  const doneTasks = proc.reduce((s, st) => s + st.tasks.filter(t => t.status === 'done').length, 0);
                  const pct = Math.round((doneTasks / totalTasks) * 100);
                  return `
                  <tr class="orig-table-row" onclick="OriginationsView.openLoan('${l.id}')">
                    <td style="font-size:12px;font-weight:700;color:var(--color-primary)">${l.id}</td>
                    <td style="font-size:12px">${l.minNumber && l.minNumber !== 'PREQUALIFICATION' ? l.minNumber : l.id}</td>
                    <td>
                      <div style="font-size:13px;font-weight:600">${l.borrowerName}</div>
                    </td>
                    <td style="font-size:12px;color:var(--color-text-secondary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.address}</td>
                    <td><span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span></td>
                    <td style="font-weight:600;font-size:13px">${Display.currency(l.amount)}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="font-size:11px;font-weight:600;color:var(--color-text-muted)">${doneTasks}/${totalTasks}</span>
                        <div class="orig-progress-bar"><div class="orig-progress-bar-fill" style="width:${pct}%"></div></div>
                      </div>
                    </td>
                    <td style="font-size:12px;color:var(--color-text-muted)">${l.updatedAt ? Display.date(l.updatedAt) : '—'}</td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
        ${totalPages > 1 ? `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid var(--color-border);font-size:12px;color:var(--color-text-muted)">
            <span>Page ${this._page + 1} of ${totalPages}</span>
            <div style="display:flex;gap:6px">
              <button class="btn btn-xs btn-secondary" ${this._page === 0 ? 'disabled' : ''} onclick="OriginationsView._setPage(${this._page - 1})">Prev</button>
              <button class="btn btn-xs btn-secondary" ${this._page >= totalPages - 1 ? 'disabled' : ''} onclick="OriginationsView._setPage(${this._page + 1})">Next</button>
            </div>
          </div>` : ''}
      </div>`;

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">${title}</div>
            <div class="page-subtitle">${loans.length} total origination${loans.length !== 1 ? 's' : ''} in pipeline</div>
          </div>
        </div>
      </div>
      <div class="page-body">
        ${kpiHtml}
        ${tableHtml}
      </div>
      <div id="originations-modal"></div>`;
  },

  /* ── List helpers ── */
  _setFilter(f)  { this._filter = f; this._page = 0; App.renderView('/originations'); },
  _setSearch(q)  { this._search = q; this._page = 0; App.renderView('/originations'); },
  _setSort(field) {
    if (this._sortField === field) this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    else { this._sortField = field; this._sortDir = 'asc'; }
    App.renderView('/originations');
  },
  _setPage(p)    { this._page = Math.max(0, p); App.renderView('/originations'); },

  /* ================================================================
     DETAIL VIEW
  ================================================================ */
  _renderDetail() {
    const loan = State.getLoan(this._selectedLoanId);
    if (!loan) {
      this._viewMode = 'list';
      return this._renderList();
    }

    const proc = generateOriginationProcess(loan.status);
    const isCompleted = loan.status === 'completed';
    const statusPillClass = isCompleted ? 'completed' : '';
    const addressDisplay = loan.phase === 'prequalification' ? 'PREQUALIFICATION' : loan.address.split(',')[0].trim().toUpperCase();
    const stateDisplay = loan.address.split(',').slice(-2).join(',').trim();

    /* ── Header card ── */
    const headerHtml = `
      <div class="orig-header-card">
        <div class="orig-header-top">
          <div>
            <div class="orig-header-title">${addressDisplay}</div>
            <div class="orig-header-subtitle">${stateDisplay}</div>
          </div>
          <span class="orig-status-pill ${statusPillClass}">${Display.loanStatusLabel(loan.status)}</span>
        </div>
        <hr class="orig-header-divider" />
        <div class="orig-header-info-grid">
          <div><div class="orig-header-info-label">Type:</div><div class="orig-header-info-value">${loan.loanType || 'Purchase'}</div></div>
          <div><div class="orig-header-info-label">Loan Amount:</div><div class="orig-header-info-value">${Display.currency(loan.amount)}</div></div>
          <div><div class="orig-header-info-label">Loan ID:</div><div class="orig-header-info-value">${loan.minNumber === 'PREQUALIFICATION' ? 'PREQUALIFICATION' : loan.id}</div></div>
          <div><div class="orig-header-info-label">MIN #:</div><div class="orig-header-info-value">${loan.minNumber || '—'}</div></div>
          <div><div class="orig-header-info-label">Borrower Name(s):</div><div class="orig-header-info-value">${loan.borrowerName.toUpperCase()}</div></div>
          <div><div class="orig-header-info-label">Property Unit:</div><div class="orig-header-info-value">${loan.propertyUnit || '—'}</div></div>
          <div><div class="orig-header-info-label">Program:</div><div class="orig-header-info-value">${loan.program}</div></div>
          <div><div class="orig-header-info-label">FICO:</div><div class="orig-header-info-value">${loan.fico || '—'}</div></div>
        </div>
      </div>`;

    /* ── Sidebar ── */
    const TABS = [
      { key: 'details',          label: 'Details',                  hasContent: true },
      { key: 'documents',        label: 'Documents',                hasContent: true },
      { key: 'prequalification', label: 'Prequalification',         hasContent: true },
      { key: 'borrower',         label: 'Borrower Qualifications',  hasContent: true },
      { key: 'appraisal',        label: 'Appraisal',                hasContent: true },
      { key: 'title',            label: 'Title Information',        hasContent: false },
      { key: 'closing',          label: 'Closing',                  hasContent: true },
      { key: 'post_closing',     label: 'Post-Closing',             hasContent: true },
      { key: 'payment',          label: 'Payment',                  hasContent: false },
      { key: 'history',          label: 'History',                  hasContent: true },
      { key: 'contracts',        label: 'Contracts',                hasContent: false },
    ];

    const sidebarHtml = `<div class="orig-sidebar">${TABS.map(t =>
      `<button class="orig-sidebar-item ${this._activeSidebarTab === t.key ? 'active' : ''} ${t.hasContent ? 'has-content' : ''}" onclick="OriginationsView.switchSidebarTab('${t.key}')">${t.label}</button>`
    ).join('')}</div>`;

    /* ── Content ── */
    let contentHtml = '';
    switch (this._activeSidebarTab) {
      case 'details':          contentHtml = this._renderDetailsTab(loan, proc); break;
      case 'documents':        contentHtml = this._renderDocumentsTab(loan); break;
      case 'prequalification': contentHtml = this._renderPrequalificationTab(loan, proc); break;
      case 'borrower':         contentHtml = this._renderBorrowerTab(loan); break;
      case 'appraisal':        contentHtml = this._renderAppraisalTab(loan); break;
      case 'title':            contentHtml = this._renderTitleTab(loan); break;
      case 'closing':          contentHtml = this._renderClosingTab(loan, proc); break;
      case 'post_closing':     contentHtml = this._renderPostClosingTab(loan, proc); break;
      case 'payment':          contentHtml = this._renderPaymentTab(loan); break;
      case 'history':          contentHtml = this._renderHistoryTab(loan); break;
      case 'contracts':        contentHtml = this._renderContractsTab(loan); break;
      default:                 contentHtml = this._renderDetailsTab(loan, proc);
    }

    return `
      <div class="page-body">
        <div class="orig-detail-header">
          <button class="orig-back-btn" onclick="OriginationsView.backToList()">&#8592; Back to Originations</button>
          ${headerHtml}
        </div>
        <div class="orig-detail-layout">
          ${sidebarHtml}
          <div class="orig-main-content">${contentHtml}</div>
        </div>
      </div>`;
  },

  /* ── Details Tab (Pipeline + Overview + Originator) ── */
  _renderDetailsTab(loan, proc) {
    return this._renderPipeline(loan, proc) + this._renderLoanOverview(loan) + this._renderOriginatorDetails(loan);
  },

  /* ── Pipeline ── */
  _renderPipeline(loan, proc) {
    const totalTasks = proc.reduce((s, st) => s + st.tasks.length, 0);
    const doneTasks  = proc.reduce((s, st) => s + st.tasks.filter(t => t.status === 'done').length, 0);
    const pct = Math.round((doneTasks / totalTasks) * 100);

    const stagesHtml = proc.map((stage, idx) => {
      const isExpanded = this._expandedStages.has(stage.id);
      const doneInStage = stage.tasks.filter(t => t.status === 'done').length;
      const indicatorIcon = stage.status === 'completed' ? '&#10003;' : (idx + 1);

      const tasksHtml = !isExpanded ? '' : `
        <div class="orig-tasks">
          ${stage.tasks.map(t => `
            <div class="orig-task">
              ${Display.taskStatusIcon(t.status)}
              <span class="orig-task-label ${t.status === 'done' ? 'done' : ''}">${t.label}</span>
              <span class="orig-task-role">${t.role}</span>
              ${t.action && t.status !== 'done' ? `<button class="orig-task-action" onclick="event.stopPropagation()">${t.action}</button>` : ''}
            </div>`).join('')}
        </div>`;

      return `
        <div class="orig-stage">
          <div class="orig-stage-header" onclick="OriginationsView.toggleStage('${stage.id}')">
            <div class="orig-stage-indicator ${stage.status}">${indicatorIcon}</div>
            <div class="orig-stage-info">
              <div class="orig-stage-label">${stage.label}</div>
            </div>
            <div class="orig-stage-meta">
              <span class="orig-stage-status-pill ${stage.status}">${stage.status === 'completed' ? 'Completed' : stage.status === 'in_progress' ? 'In Progress' : 'Pending'}</span>
              <span class="orig-stage-count">${doneInStage}/${stage.tasks.length} tasks</span>
              <span class="orig-stage-chevron ${isExpanded ? 'open' : ''}">&#9660;</span>
            </div>
          </div>
          ${tasksHtml}
        </div>`;
    }).join('');

    return `
      <div class="orig-pipeline">
        <div class="orig-pipeline-header">
          <div class="orig-pipeline-title">Your Origination Process</div>
          <div class="orig-pipeline-progress">Application Progress ${doneTasks}/${totalTasks}</div>
        </div>
        <div class="orig-pipeline-bar">
          <div class="orig-pipeline-bar-fill" style="width:${pct}%"></div>
        </div>
        ${stagesHtml}
      </div>`;
  },

  /* ── Loan Overview (collapsible) ── */
  _renderLoanOverview(loan) {
    const collapsed = this._collapsedSections.has('overview');
    const items = [
      ['Loan Amount', Display.currency(loan.amount)],
      ['Closing Date', loan.closingDate ? Display.date(loan.closingDate) : 'TBD'],
      ['Appraised Home Value', loan.appraisedHomeValue ? Display.currency(loan.appraisedHomeValue) : 'TBD'],
      ['Disbursement Date', loan.disbursementDate ? Display.date(loan.disbursementDate) : 'TBD'],
      ['First Mortgage Balance', loan.firstMortgageBalance ? Display.currency(loan.firstMortgageBalance) : 'TBD'],
      ['LTV', loan.ltv ? loan.ltv + '%' : 'TBD'],
      ['CLTV', loan.cltv ? loan.cltv + '%' : 'TBD'],
      ['Closing Fees', loan.closingFees ? Display.currency(loan.closingFees) : 'TBD'],
      ['h at Minting', loan.hAtMinting != null ? 'h ' + loan.hAtMinting.toFixed(5) : '—'],
      ['Borrower Net', loan.borrowerNet ? Display.currency(loan.borrowerNet) : '—'],
      ['H to Investor', loan.hToInvestor != null ? loan.hToInvestor.toFixed(2) : '—'],
      ['Household Income', loan.householdIncome ? Display.currency(loan.householdIncome) : '—'],
    ];

    return `
      <div class="orig-section">
        <div class="orig-section-header" onclick="OriginationsView.toggleSection('overview')">
          <span class="orig-section-title">Loan Overview</span>
          <span class="orig-section-chevron ${collapsed ? 'collapsed' : ''}">&#9660;</span>
        </div>
        ${!collapsed ? `<div class="orig-section-body">
          <div class="orig-overview-grid">
            ${items.map(([label, val]) => `
              <div class="orig-overview-item">
                <div class="orig-overview-label">${label}</div>
                <div class="orig-overview-value">${val}</div>
              </div>`).join('')}
          </div>
        </div>` : ''}
      </div>`;
  },

  /* ── Originator & Appraisal Details (collapsible) ── */
  _renderOriginatorDetails(loan) {
    const collapsed = this._collapsedSections.has('originator');
    const items = [
      ['Company', loan.originatorCompany || '—'],
      ['Appraiser Company', loan.appraiserCompany || 'TBD'],
      ['Company NMLS #', loan.originatorNmls || '—'],
      ['Appraiser Name', loan.appraiserName || '—'],
      ['', ''],
      ['Appraiser License #', loan.appraiserLicense || 'TBD'],
    ];

    return `
      <div class="orig-section">
        <div class="orig-section-header" onclick="OriginationsView.toggleSection('originator')">
          <span class="orig-section-title">Originator and Appraisal Details</span>
          <span class="orig-section-chevron ${collapsed ? 'collapsed' : ''}">&#9660;</span>
        </div>
        ${!collapsed ? `<div class="orig-section-body">
          <div class="orig-overview-grid">
            ${items.filter(([l]) => l).map(([label, val]) => `
              <div class="orig-overview-item">
                <div class="orig-overview-label">${label}</div>
                <div class="orig-overview-value">${val}</div>
              </div>`).join('')}
          </div>
        </div>` : ''}
      </div>`;
  },

  /* ── Documents Tab ── */
  _renderDocumentsTab(loan) {
    const docs = [
      { name: 'Initial Disclosure Package', type: 'PDF', size: '2.4 MB', date: loan.submittedAt || '2026-03-15', status: loan.status !== 'draft' && loan.status !== 'prequalification_in_progress' ? 'approved' : 'pending' },
      { name: 'Borrower Authorization', type: 'PDF', size: '156 KB', date: loan.submittedAt || '2026-03-15', status: loan.status !== 'draft' && loan.status !== 'prequalification_in_progress' ? 'approved' : 'pending' },
      { name: 'Appraisal Report', type: 'PDF', size: '8.1 MB', date: '2026-03-22', status: ['application_documents_approved','original_appraisal_submitted','sent_to_docutech','pending_origination_creation','origination_created','completed'].includes(loan.status) ? 'approved' : 'pending' },
      { name: 'Title Commitment', type: 'PDF', size: '1.8 MB', date: '2026-03-25', status: ['sent_to_docutech','pending_origination_creation','origination_created','completed'].includes(loan.status) ? 'approved' : 'pending' },
      { name: 'Closing Disclosure', type: 'PDF', size: '3.2 MB', date: '2026-04-01', status: loan.status === 'completed' ? 'approved' : 'pending' },
      { name: 'SAN Note', type: 'PDF', size: '412 KB', date: '2026-04-02', status: loan.status === 'completed' || loan.status === 'origination_created' ? 'approved' : 'pending' },
    ];

    return `
      <div class="card" style="margin-bottom:20px">
        <div class="card-title" style="margin-bottom:16px">Documents</div>
        <div class="orig-doc-zone">
          <div class="orig-doc-zone-icon">&#128196;</div>
          <div class="orig-doc-zone-text">Drag & drop files here, or click to browse</div>
        </div>
        <ul class="orig-doc-list">
          ${docs.map(d => `
            <li class="orig-doc-item">
              <div class="orig-doc-icon">&#128196;</div>
              <div class="orig-doc-info">
                <div class="orig-doc-name">${d.name}</div>
                <div class="orig-doc-meta">${d.type} &middot; ${d.size} &middot; ${Display.date(d.date)}</div>
              </div>
              <span class="orig-doc-status ${d.status}">${d.status === 'approved' ? 'Approved' : 'Pending'}</span>
            </li>`).join('')}
        </ul>
      </div>`;
  },

  /* ── Prequalification Tab ── */
  _renderPrequalificationTab(loan, proc) {
    const pqStage = (proc || generateOriginationProcess(loan.status))[0];
    const items = [
      ['Reservation (Loan) Amount', Display.currency(loan.amount)],
      ['Prequalification Reservation Length', '30 days'],
      ['Select Investor', '—'],
      ['Select Activation', '—'],
    ];

    return `
      <div class="card" style="margin-bottom:20px">
        <div class="card-title" style="margin-bottom:16px">Prequalification Review</div>
        <div class="orig-info-grid">
          ${items.map(([label, val]) => `
            <div class="orig-info-item">
              <div class="orig-info-label">${label}</div>
              <div class="orig-info-value">${val}</div>
            </div>`).join('')}
        </div>
        <div style="margin-top:16px;display:flex;gap:10px">
          ${pqStage.status !== 'completed' ? `
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation()">Approve</button>
            <button class="btn btn-sm" style="background:var(--color-danger);color:#fff;border:none" onclick="event.stopPropagation()">Reject</button>
          ` : `<span class="badge badge-complete">Prequalification Complete</span>`}
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Prequalification Tasks</div>
        ${pqStage.tasks.map(t => `
          <div class="orig-task" style="padding-left:0">
            ${Display.taskStatusIcon(t.status)}
            <span class="orig-task-label ${t.status === 'done' ? 'done' : ''}">${t.label}</span>
            <span class="orig-task-role">${t.role}</span>
          </div>`).join('')}
      </div>`;
  },

  /* ── Borrower Qualifications Tab ── */
  _renderBorrowerTab(loan) {
    const items = [
      ['Borrower Name(s)', loan.borrowerName],
      ['FICO Score', loan.fico || '—'],
      ['Household Income', loan.householdIncome ? Display.currency(loan.householdIncome) : '—'],
      ['LTV', loan.ltv ? loan.ltv + '%' : '—'],
      ['CLTV', loan.cltv ? loan.cltv + '%' : '—'],
      ['Employment Status', 'Verified'],
      ['Debt-to-Income Ratio', '38%'],
      ['Credit History', 'Good standing'],
    ];

    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Borrower Qualifications</div>
        <div class="orig-info-grid">
          ${items.map(([label, val]) => `
            <div class="orig-info-item">
              <div class="orig-info-label">${label}</div>
              <div class="orig-info-value">${val}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── Appraisal Tab ── */
  _renderAppraisalTab(loan) {
    const items = [
      ['Appraised Home Value', loan.appraisedHomeValue ? Display.currency(loan.appraisedHomeValue) : 'TBD'],
      ['Appraiser Company', loan.appraiserCompany || 'TBD'],
      ['Appraisal Date', loan.submittedAt ? Display.date(loan.submittedAt) : 'TBD'],
      ['Appraiser Name', loan.appraiserName || '—'],
      ['Property Type', 'Single Family Residence'],
      ['Appraiser License #', loan.appraiserLicense || 'TBD'],
      ['Year Built', '2004'],
      ['Appraisal Status', ['application_documents_approved','original_appraisal_submitted','sent_to_docutech','pending_origination_creation','origination_created','completed'].includes(loan.status) ? 'Completed' : 'Pending'],
      ['Lot Size', '0.18 acres'],
      ['', ''],
      ['Living Area', '2,150 sq ft'],
      ['', ''],
    ];

    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Appraisal Details</div>
        <div class="orig-info-grid">
          ${items.filter(([l]) => l).map(([label, val]) => `
            <div class="orig-info-item">
              <div class="orig-info-label">${label}</div>
              <div class="orig-info-value">${val}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── Title Information Tab ── */
  _renderTitleTab(loan) {
    const items = [
      ['Title Company', 'First American Title'],
      ['Title Officer', 'Karen Mitchell'],
      ['Title Number', 'FA-2026-' + loan.id.slice(-4)],
      ['Effective Date', loan.submittedAt ? Display.date(loan.submittedAt) : 'TBD'],
      ['Commitment Status', ['sent_to_docutech','pending_origination_creation','origination_created','completed'].includes(loan.status) ? 'Received' : 'Pending'],
      ['Exceptions', 'Standard'],
    ];

    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Title Information</div>
        <div class="orig-info-grid">
          ${items.map(([label, val]) => `
            <div class="orig-info-item">
              <div class="orig-info-label">${label}</div>
              <div class="orig-info-value">${val}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── Closing Tab ── */
  _renderClosingTab(loan, proc) {
    const closingStage = (proc || generateOriginationProcess(loan.status))[3];
    return `
      <div class="card" style="margin-bottom:20px">
        <div class="card-title" style="margin-bottom:16px">Clear to Close & Closing</div>
        <ul class="orig-checklist">
          ${closingStage.tasks.map(t => `
            <li class="orig-checklist-item">
              <div class="orig-checklist-check ${t.status === 'done' ? 'done' : ''}">${t.status === 'done' ? '&#10003;' : ''}</div>
              <span class="orig-checklist-label ${t.status === 'done' ? 'done' : ''}">${t.label}</span>
              <span class="orig-task-role">${t.role}</span>
              ${t.action && t.status !== 'done' ? `<button class="orig-task-action" onclick="event.stopPropagation()">${t.action}</button>` : ''}
            </li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Closing Details</div>
        <div class="orig-info-grid">
          <div class="orig-info-item"><div class="orig-info-label">Closing Date</div><div class="orig-info-value">${loan.closingDate ? Display.date(loan.closingDate) : 'TBD'}</div></div>
          <div class="orig-info-item"><div class="orig-info-label">Disbursement Date</div><div class="orig-info-value">${loan.disbursementDate ? Display.date(loan.disbursementDate) : 'TBD'}</div></div>
          <div class="orig-info-item"><div class="orig-info-label">Closing Fees</div><div class="orig-info-value">${loan.closingFees ? Display.currency(loan.closingFees) : 'TBD'}</div></div>
          <div class="orig-info-item"><div class="orig-info-label">Borrower Net</div><div class="orig-info-value">${loan.borrowerNet ? Display.currency(loan.borrowerNet) : 'TBD'}</div></div>
        </div>
      </div>`;
  },

  /* ── Post-Closing Tab ── */
  _renderPostClosingTab(loan, proc) {
    const pcStage = (proc || generateOriginationProcess(loan.status))[4];
    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Post-Closing & Funding</div>
        <ul class="orig-checklist">
          ${pcStage.tasks.map(t => `
            <li class="orig-checklist-item">
              <div class="orig-checklist-check ${t.status === 'done' ? 'done' : ''}">${t.status === 'done' ? '&#10003;' : ''}</div>
              <span class="orig-checklist-label ${t.status === 'done' ? 'done' : ''}">${t.label}</span>
              <span class="orig-task-role">${t.role}</span>
              ${t.action && t.status !== 'done' ? `<button class="orig-task-action" onclick="event.stopPropagation()">${t.action}</button>` : ''}
            </li>`).join('')}
        </ul>
      </div>`;
  },

  /* ── Payment Tab ── */
  _renderPaymentTab(loan) {
    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Payment Information</div>
        <div class="orig-info-grid">
          <div class="orig-info-item"><div class="orig-info-label">Payment Status</div><div class="orig-info-value">${loan.status === 'completed' ? 'Disbursed' : 'Pending'}</div></div>
          <div class="orig-info-item"><div class="orig-info-label">Disbursement Amount</div><div class="orig-info-value">${loan.borrowerNet ? Display.currency(loan.borrowerNet) : 'TBD'}</div></div>
          <div class="orig-info-item"><div class="orig-info-label">Disbursement Date</div><div class="orig-info-value">${loan.disbursementDate ? Display.date(loan.disbursementDate) : 'TBD'}</div></div>
          <div class="orig-info-item"><div class="orig-info-label">Funding Method</div><div class="orig-info-value">Wire Transfer</div></div>
        </div>
      </div>`;
  },

  /* ── History Tab ── */
  _renderHistoryTab(loan) {
    const events = [
      { action: 'Loan created', actor: 'System', time: loan.submittedAt || '2026-03-10' },
      { action: 'Prequalification submitted', actor: 'Loan Officer', time: loan.submittedAt || '2026-03-10' },
      { action: 'Prequalification reviewed', actor: 'Account Manager', time: loan.submittedAt || '2026-03-12' },
      { action: 'Initial application submitted', actor: 'Loan Officer', time: loan.submittedAt || '2026-03-14' },
      { action: 'Documents uploaded', actor: 'Loan Officer', time: loan.submittedAt || '2026-03-16' },
      { action: 'Status updated to: ' + Display.loanStatusLabel(loan.status), actor: 'System', time: loan.updatedAt || '2026-04-01' },
    ];

    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Activity History</div>
        <div class="orig-timeline">
          ${events.map(e => `
            <div class="orig-timeline-item">
              <div class="orig-timeline-dot"></div>
              <div class="orig-timeline-content">
                <strong>${e.action}</strong> &mdash; ${e.actor}
              </div>
              <div class="orig-timeline-time">${Display.date(e.time)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── Contracts Tab ── */
  _renderContractsTab(loan) {
    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Contracts</div>
        <div style="text-align:center;padding:32px;color:var(--color-text-muted)">
          <div style="font-size:24px;margin-bottom:8px">&#128196;</div>
          <div style="font-size:13px;font-weight:600">${loan.status === 'completed' ? 'Contract documents available for download' : 'Contracts will be generated at closing'}</div>
          ${loan.status === 'completed' ? `<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="event.stopPropagation()">Download Contract Package</button>` : ''}
        </div>
      </div>`;
  },

  /* ── Navigation helpers ── */
  openLoan(id) {
    this._viewMode = 'detail';
    this._selectedLoanId = id;
    this._activeSidebarTab = 'details';
    this._collapsedSections = new Set();
    // Auto-expand the current in-progress stage (or last completed if all done)
    const loan = State.getLoan(id);
    const proc = loan ? generateOriginationProcess(loan.status) : [];
    const activeStage = proc.find(s => s.status === 'in_progress') || proc.filter(s => s.status === 'completed').pop();
    this._expandedStages = new Set(activeStage ? [activeStage.id] : []);
    Router.navigate('/originations/' + id);
  },

  backToList() {
    this._viewMode = 'list';
    this._selectedLoanId = null;
    Router.navigate('/originations');
  },

  switchSidebarTab(tab) {
    this._activeSidebarTab = tab;
    App.renderView('/originations/' + this._selectedLoanId);
  },

  toggleStage(stageId) {
    if (this._expandedStages.has(stageId)) this._expandedStages.delete(stageId);
    else this._expandedStages.add(stageId);
    App.renderView('/originations/' + this._selectedLoanId);
  },

  toggleSection(sectionId) {
    if (this._collapsedSections.has(sectionId)) this._collapsedSections.delete(sectionId);
    else this._collapsedSections.add(sectionId);
    App.renderView('/originations/' + this._selectedLoanId);
  },

  /* ── New Application Modal (retained) ── */
  showNewAppModal() {
    document.getElementById('originations-modal').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)OriginationsView.closeModal()">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <div class="modal-title">New Application</div>
              <div class="modal-subtitle">Start a Home Equity Investment origination</div>
            </div>
            <button class="modal-close" onclick="OriginationsView.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <span class="alert-icon">&#8505;&#65039;</span>
              <span>This will open a new origination in draft status. You can complete and submit it at any time.</span>
            </div>
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Borrower Full Name *</label>
                <input class="input" id="new-app-borrower" placeholder="Jane & John Smith" />
              </div>
              <div class="form-group form-full">
                <label>Property Address *</label>
                <input class="input" id="new-app-address" placeholder="123 Main St, Nashville, TN 37201" />
              </div>
              <div class="form-group">
                <label>HEI Amount ($) *</label>
                <input class="input" id="new-app-amount" type="number" placeholder="150000" />
              </div>
              <div class="form-group">
                <label>Program *</label>
                <select class="select-input" id="new-app-program">
                  <option value="DC Dream Fund">DC Dream Fund</option>
                  <option value="Kentucky Dream Fund">Kentucky Dream Fund</option>
                  <option value="Standard HEI">Standard HEI</option>
                  <option value="Jumbo HEI">Jumbo HEI</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="OriginationsView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="OriginationsView.submitNew()">Create Draft</button>
          </div>
        </div>
      </div>`;
  },

  submitNew() {
    const borrower = document.getElementById('new-app-borrower')?.value.trim();
    const address  = document.getElementById('new-app-address')?.value.trim();
    const amount   = parseInt(document.getElementById('new-app-amount')?.value) || 0;
    const program  = document.getElementById('new-app-program')?.value;
    const user = State.getCurrentUser();

    if (!borrower || !address || !amount) {
      alert('Please fill in all required fields.');
      return;
    }

    const id = `ORG-2026-${String(Math.floor(Math.random() * 9000 + 1000))}`;
    State.getLoans().push({
      id, companyId: user.companyId, branchId: user.branchId, loId: user.id,
      borrowerName: borrower, address, amount, program,
      status: 'draft', ltv: null, submittedAt: null, cltv: null,
      phase: 'origination', updatedAt: new Date().toISOString().split('T')[0],
      loanType: 'Purchase', minNumber: null, propertyUnit: '-',
      appraisedHomeValue: null, firstMortgageBalance: null, closingDate: null,
      disbursementDate: null, closingFees: null, borrowerNet: null,
      hAtMinting: null, hToInvestor: null,
      originatorCompany: State.getCompany(user.companyId)?.name || '—',
      originatorNmls: State.getCompany(user.companyId)?.nmlsId || '—',
      appraiserCompany: 'TBD', appraiserName: '', appraiserLicense: 'TBD',
    });

    this.closeModal();
    App.renderView('/originations');
  },

  closeModal() {
    const el = document.getElementById('originations-modal');
    if (el) el.innerHTML = '';
  },
};

/* ============================================================
   Boot
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => App.init());
