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
  _activeTab: 'overview',       // 'overview' | 'tasks' | 'documents' | 'parties' | 'history'
  _expandedTaskStages: new Set(),

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
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px">
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
     DETAIL VIEW — Unified layout (context header + stage tracker + tabs + sidebar)
  ================================================================ */
  _renderDetail() {
    const loan = State.getLoan(this._selectedLoanId);
    if (!loan) { this._viewMode = 'list'; return this._renderList(); }

    const proc = generateOriginationProcess(loan.status);
    const lo = State.getUser(loan.loId);
    const loName = lo ? Display.fullName(lo) : '—';

    return `
      <div class="page-body">
        <button class="ud-back-btn" onclick="OriginationsView.backToList()">&#8592; Back to Originations</button>
        ${this._udContextHeader(loan, loName, proc)}
        ${this._udActionBanner(loan, proc)}
        <div class="ud-content-grid">
          <div>
            ${this._udContentTabs()}
            <div class="ud-content-main">${this._udTabContent(loan, proc, loName)}</div>
          </div>
          <div>${this._udSidebar(loan, proc, loName)}</div>
        </div>
      </div>
      <div id="originations-modal"></div>`;
  },

  /* ── Owner avatar helper — returns full HTML for compact circle with tooltip ── */
  _ownerAvatar(role) {
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

  /* ── Stage icon SVGs ── */
  _stageIcon(stageId) {
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

  /* ── Context Header (with integrated progress strip) ── */
  _udContextHeader(loan, loName, proc) {
    const isCompleted = loan.status === 'completed';
    const addr = loan.phase === 'prequalification' ? 'PREQUALIFICATION' : loan.address.split(',')[0].trim();
    const sub = loan.address.split(',').slice(1).join(',').trim();

    // Progress strip data
    const totalTasks = proc.reduce((s, st) => s + st.tasks.length, 0);
    const doneTasks = proc.reduce((s, st) => s + st.tasks.filter(t => t.status === 'done').length, 0);
    const overallPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const currentStage = proc.find(s => s.status === 'in_progress');
    const currentIdx = currentStage ? proc.indexOf(currentStage) : (isCompleted ? proc.length : 0);

    const segments = proc.map((stage) => {
      const cls = stage.status === 'completed' ? 'done' : stage.status === 'in_progress' ? 'current' : 'pending';
      const sDone = stage.tasks.filter(t => t.status === 'done').length;
      return `<div class="ud-progress-segment ${cls}" style="flex:${stage.tasks.length}" title="${stage.label}"><span class="ud-progress-segment-tip">${stage.label} (${sDone}/${stage.tasks.length})</span></div>`;
    }).join('');

    const stageLabel = currentStage ? currentStage.label : (isCompleted ? 'Completed' : 'Not Started');
    const stageIconCls = isCompleted ? 'done' : '';
    const stageIconSvg = currentStage ? this._stageIcon(currentStage.id) : this._stageIcon('transfer_minting');
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
          <div class="ud-chip"><span class="ud-chip-label">FICO</span><span class="ud-chip-value">${loan.fico || '—'}</span></div>
          <div class="ud-chip"><span class="ud-chip-label">Borrower</span><span class="ud-chip-value">${loan.borrowerName}</span></div>
          <div class="ud-chip"><span class="ud-chip-label">Loan Officer</span><span class="ud-chip-value">${loName}</span></div>
          <div class="ud-chip"><span class="ud-chip-label">Est. Close</span><span class="ud-chip-value ${loan.closingDate ? '' : 'warn'}">${loan.closingDate ? Display.date(loan.closingDate) : 'TBD'}</span></div>
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

  /* ── Action Banner (next required action, promoted from sidebar) ── */
  _udActionBanner(loan, proc) {
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
    return `<div class="ud-action-banner">
      <div class="ud-action-banner-icon">&#9888;</div>
      <div class="ud-action-banner-body">
        <div class="ud-action-banner-label">Next Action Required</div>
        <div class="ud-action-banner-text">${activeTask.label}</div>
        <div class="ud-action-banner-sub">${this._ownerAvatar(activeTask.role)} ${activeTask.role} &middot; ${currentStage.label}${upNextHtml ? ' &middot; ' : ''}</div>
        ${upNextHtml}
      </div>
      ${activeTask.action ? `<button class="ud-action-banner-btn" onclick="event.stopPropagation()">${activeTask.action}</button>` : ''}
    </div>`;
  },

  /* ── Content Tabs ── */
  _udContentTabs() {
    const tabs = ['Overview', 'Tasks', 'Documents', 'Parties', 'History'];
    const keys = ['overview', 'tasks', 'documents', 'parties', 'history'];
    return `<div class="ud-content-tabs">${tabs.map((t, i) =>
      `<button class="ud-content-tab ${this._activeTab === keys[i] ? 'active' : ''}" onclick="OriginationsView.switchTab('${keys[i]}')">${t}</button>`
    ).join('')}</div>`;
  },

  /* ── Tab Content Dispatcher ── */
  _udTabContent(loan, proc, loName) {
    switch (this._activeTab) {
      case 'tasks':     return this._udTasksTab(proc);
      case 'documents': return this._udDocumentsTab(loan);
      case 'parties':   return this._udPartiesTab(loan, loName);
      case 'history':   return this._udHistoryTab(loan);
      default:          return this._udOverviewTab(loan, proc);
    }
  },

  /* ── Overview Tab ── */
  _udOverviewTab(loan, proc) {
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
              ${this._ownerAvatar(t.role)}
              ${t.action && t.status !== 'done' ? `<button class="ud-task-action ${t.status === 'active' ? 'primary' : ''}" onclick="event.stopPropagation()">${t.action}</button>` : ''}
            </div>`).join('')}
        </div>`;
    }

    // Completed stages summary
    const completedStages = proc.filter(s => s.status === 'completed' && s !== activeStage);
    const completedHtml = completedStages.map(s => `
      <div class="ud-content-section">
        <div class="ud-section-title" style="color:#16A34A"><span style="font-size:16px;margin-right:4px">&#10003;</span> ${s.label} <span class="ud-section-count">${s.tasks.length}/${s.tasks.length} complete</span></div>
      </div>`).join('');

    // Loan overview
    const overviewItems = [
      ['Loan Amount', Display.currency(loan.amount)],
      ['Appraised Value', loan.appraisedHomeValue ? Display.currency(loan.appraisedHomeValue) : 'TBD'],
      ['First Mortgage Balance', loan.firstMortgageBalance ? Display.currency(loan.firstMortgageBalance) : 'TBD'],
      ['LTV / CLTV', `${loan.ltv ?? '—'}% / ${loan.cltv ?? '—'}%`],
      ['Closing Date', loan.closingDate ? Display.date(loan.closingDate) : 'TBD'],
      ['Disbursement Date', loan.disbursementDate ? Display.date(loan.disbursementDate) : 'TBD'],
      ['Closing Fees', loan.closingFees ? Display.currency(loan.closingFees) : 'TBD'],
      ['Borrower Net', loan.borrowerNet ? Display.currency(loan.borrowerNet) : 'TBD'],
    ];

    const originatorItems = [
      ['Company', loan.originatorCompany || '—'],
      ['Appraiser Company', loan.appraiserCompany || 'TBD'],
      ['Company NMLS #', loan.originatorNmls || '—'],
      ['Appraiser Name', loan.appraiserName || 'TBD'],
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

  /* ── Tasks Tab (full pipeline) ── */
  _udTasksTab(proc) {
    return proc.map(stage => {
      const done = stage.tasks.filter(t => t.status === 'done').length;
      const total = stage.tasks.length;
      const isDone = stage.status === 'completed';
      const isCurrent = stage.status === 'in_progress';
      const isPending = stage.status === 'pending';
      const isExpanded = this._expandedTaskStages.has(stage.id) || isCurrent;

      if (isPending && !this._expandedTaskStages.has(stage.id)) {
        return `
          <div class="ud-content-section">
            <div class="ud-stage-section-header" onclick="OriginationsView.toggleTaskStage('${stage.id}')">
              <div class="ud-section-title" style="color:var(--color-text-muted);margin:0">${stage.label} <span class="ud-section-count">0/${total} &middot; Pending</span></div>
              <span class="ud-stage-section-toggle">&#9654;</span>
            </div>
          </div>`;
      }

      return `
        <div class="ud-content-section ud-stage-section ${isCurrent ? 'in-progress' : ''}">
          <div class="ud-stage-section-header" onclick="OriginationsView.toggleTaskStage('${stage.id}')">
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
              ${this._ownerAvatar(t.role)}
              ${t.action && t.status !== 'done' ? `<button class="ud-task-action ${t.status === 'active' ? 'primary' : ''}" onclick="event.stopPropagation()">${t.action}</button>` : ''}
            </div>`).join('') : ''}
        </div>`;
    }).join('');
  },

  /* ── Documents Tab ── */
  _udDocumentsTab(loan) {
    const hasAppraisal = ['application_documents_approved','original_appraisal_submitted','sent_to_docutech','pending_origination_creation','origination_created','completed'].includes(loan.status);
    const hasTitle = ['sent_to_docutech','pending_origination_creation','origination_created','completed'].includes(loan.status);
    const isComplete = loan.status === 'completed';
    const hasOrigination = isComplete || loan.status === 'origination_created';
    const hasDocs = loan.status !== 'draft' && loan.status !== 'prequalification_in_progress';

    const docs = [
      { name: 'Initial Disclosure Package', meta: 'PDF \u00B7 2.4 MB \u00B7 Uploaded Mar 18', status: hasDocs ? 'approved' : 'missing', owner: 'Account Manager' },
      { name: 'Borrower Authorization',     meta: 'PDF \u00B7 156 KB \u00B7 Uploaded Mar 18', status: hasDocs ? 'approved' : 'missing', owner: 'Account Manager' },
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
            ${this._ownerAvatar(d.owner)}
            ${d.status === 'missing' ? '<button class="ud-task-action" onclick="event.stopPropagation()">Upload</button>' : ''}
          </div>`).join('')}
      </div>`;
  },

  /* ── Parties Tab ── */
  _udPartiesTab(loan, loName) {
    const borrowerItems = [
      ['Borrower Name(s)', loan.borrowerName],
      ['FICO Score', loan.fico || '—'],
      ['Household Income', loan.householdIncome ? Display.currency(loan.householdIncome) : '—'],
      ['Employment Status', 'Verified'],
      ['Debt-to-Income Ratio', '38%'],
      ['Credit History', 'Good standing'],
    ];
    const originatorItems = [
      ['Loan Officer', loName],
      ['Company', loan.originatorCompany || '—'],
      ['Company NMLS #', loan.originatorNmls || '—'],
      ['Processor', 'Kevin Park'],
    ];
    const appraisalItems = [
      ['Appraiser Company', loan.appraiserCompany || 'TBD'],
      ['Appraiser Name', loan.appraiserName || 'TBD'],
      ['Appraiser License #', loan.appraiserLicense || 'TBD'],
    ];
    const titleItems = [
      ['Title Company', 'First American Title'],
      ['Title Officer', 'Karen Mitchell'],
      ['Title Number', 'FA-2026-' + loan.id.slice(-4)],
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

  /* ── History Tab ── */
  _udHistoryTab(loan) {
    const events = [
      { action: 'Loan created', actor: 'System', time: loan.submittedAt || '2026-03-10' },
      { action: 'Prequalification submitted', actor: 'Loan Officer', time: loan.submittedAt || '2026-03-10' },
      { action: 'Prequalification reviewed', actor: 'Account Manager', time: loan.submittedAt || '2026-03-12' },
      { action: 'Initial application submitted', actor: 'Loan Officer', time: loan.submittedAt || '2026-03-14' },
      { action: 'Documents uploaded', actor: 'Loan Officer', time: loan.submittedAt || '2026-03-16' },
      { action: 'Status updated to: ' + Display.loanStatusLabel(loan.status), actor: 'System', time: loan.updatedAt || '2026-04-01' },
    ];
    return `
      <div class="ud-content-section">
        <div class="ud-section-title">Activity History</div>
        <div class="ud-timeline">
          ${events.map(e => `
            <div class="ud-timeline-item">
              <div class="ud-timeline-dot"></div>
              <div class="ud-timeline-content"><strong>${e.action}</strong> &mdash; ${e.actor}</div>
              <div class="ud-timeline-time">${Display.date(e.time)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── Right Sidebar (Next Actions moved to banner) ── */
  _udSidebar(loan, _proc, loName) {
    const days = this._daysInStage(loan);

    // Warnings
    let warningsHtml = '';
    if (days > 14 && loan.status !== 'completed') {
      warningsHtml += `<div class="ud-sidebar-item"><span class="ud-sidebar-dot red"></span><div class="ud-sidebar-item-text"><div>${days} days in current stage</div><div class="ud-sidebar-item-sub">Avg for this stage: 10 days</div></div></div>`;
    }
    if (!loan.closingDate) {
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
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Rate Lock</span><span class="ud-sidebar-kv-value tbd">TBD</span></div>
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Est. Close</span><span class="ud-sidebar-kv-value ${loan.closingDate ? '' : 'warn'}">${loan.closingDate ? Display.date(loan.closingDate) : 'TBD'}</span></div>
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

  /* ── Navigation helpers ── */
  openLoan(id) {
    this._viewMode = 'detail';
    this._selectedLoanId = id;
    this._activeTab = 'overview';
    this._expandedTaskStages = new Set();
    Router.navigate('/originations/' + id);
  },

  backToList() {
    this._viewMode = 'list';
    this._selectedLoanId = null;
    Router.navigate('/originations');
  },

  switchTab(tab) {
    this._activeTab = tab;
    App.renderView('/originations/' + this._selectedLoanId);
  },

  toggleTaskStage(stageId) {
    if (this._expandedTaskStages.has(stageId)) this._expandedTaskStages.delete(stageId);
    else this._expandedTaskStages.add(stageId);
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
