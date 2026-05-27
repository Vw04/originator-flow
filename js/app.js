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
    Router.register('/welcome',      () => {
      const r = State.getRole();
      if (!['lo','lp'].includes(r)) {
        // /welcome is OC-user-only; bounce others to their normal landing.
        if (r === 'prog_admin') return Router.navigate('/origination-companies', { replace: true });
        return Router.navigate('/data/analytics', { replace: true });
      }
      // Welcome is a modal overlay on top of /data/applications now —
      // route the user there and pop the modal so they see their actual
      // workspace behind the welcome card.
      Router.navigate('/data/applications', { replace: true });
      setTimeout(() => { if (typeof WelcomeView !== 'undefined') WelcomeView.openModal(); }, 50);
    });
    Router.register('/originations', (path) => {
      // /originations is the Homium-internal operator workbench.
      // OC users (LO/LP) must never land here — bounce to their applications view.
      const r = State.getRole();
      if (['lo','lp'].includes(r)) return Router.navigate('/data/applications', { replace: true });
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
    Router.register('/platform-operator',     (path) => this.renderShell(PlatformOperatorView.render(path)));
    Router.register('/user-management',       (path) => {
      // /user-management/u/:id is legacy — redirect to the consolidated profile URL.
      if (path.startsWith('/user-management/u/')) {
        const id = path.slice('/user-management/u/'.length);
        return Router.navigate('/users/' + id, { replace: true });
      }
      this.renderShell(PlatformOpsView.render(path));
    });
    Router.register('/platform',              ()     => Router.navigate('/user-management', { replace: true }));
    Router.register('/system-config',         (path) => this.renderShell(SystemConfigView.render(path)));
    Router.register('/bulk-invite',           (path) => this.renderShell(BulkInviteView.render(path)));

    // Legacy redirects + branch detail
    Router.register('/companies',    () => Router.navigate('/origination-companies', { replace: true }));
    Router.register('/branches',     (path) => {
      const [pathOnly] = path.split('?');
      const segs = pathOnly.replace('/branches', '').split('/').filter(Boolean);
      if (!segs.length) return Router.navigate('/origination-companies', { replace: true });
      if (segs[0] === 'new') return this.renderShell(BranchCreateView.render(path));
      const edit = segs[1] === 'edit';
      this.renderShell(BranchesView.renderDetailPage(segs[0], { edit }));
    });
    Router.register('/users',        (path) => {
      const segs = path.replace('/users', '').split('/').filter(Boolean);
      const id = segs[0];
      if (!id) return Router.navigate('/user-management', { replace: true });
      const edit = segs[1] === 'edit';
      this.renderShell(ProfileView.renderPage(id, { edit }));
    });
    Router.register('/permissions',  () => Router.navigate('/user-management', { replace: true }));

    // Data Platform sub-routes
    Router.register('/data/analytics',    () => { DataPlatformView._activeTab = 'analytics';    this.renderShell(DataPlatformView.render()); });
    Router.register('/data/applications', () => { DataPlatformView._activeTab = 'applications'; this.renderShell(DataPlatformView.render()); });
    // /data/originations removed — originations now served by /originations (OriginationsView)
    Router.register('/data/portfolio',    () => { DataPlatformView._activeTab = 'portfolio';    this.renderShell(DataPlatformView.render()); });
    Router.register('/data/batches',      () => { DataPlatformView._activeTab = 'batches';      this.renderShell(DataPlatformView.render()); });
    Router.register('/data/activations',  () => { DataPlatformView._activeTab = 'activations';  this.renderShell(DataPlatformView.render()); });

    // Prospect dashboard
    Router.register('/prospect', () => this.renderShell(ProspectDashboardView.render()));

    // Mobile routes
    Router.register('/m/home',          () => this.renderMobileShell(MobileHomeView.render()));
    Router.register('/m/loans',         () => this.renderMobileShell(MobileLoansView.render()));
    Router.register('/m/companies',     () => this.renderMobileShell(MobileLoansView.render()));
    Router.register('/m/profile',       () => this.renderMobileShell(MobileProfileView.render()));
    Router.register('/m/notifications', () => this.renderMobileShell(MobileNotificationsView.render()));
    // Mobile prospect routes
    Router.register('/m/prospect',          () => this.renderMobileShell(MobileProspectView.render()));
    Router.register('/m/prospect/stories',  () => this.renderMobileShell(MobileProspectView.render()));
    Router.register('/m/prospect/data',     () => this.renderMobileShell(MobileProspectView.render()));

    Router.register('/m/detail',        (path) => {
      const id = path.replace('/m/detail/', '');
      if (id && id !== '/m/detail') MobileDetailView._loanId = id;
      this.renderMobileShell(MobileDetailView.render());
    });

    Router.init();
  },

  renderRole() {
    document.getElementById('app').innerHTML = LoginView.render();
  },

  signOut() {
    // Tear down any wizard overlay first
    const overlay = document.getElementById('onboarding-flow-overlay');
    if (overlay) overlay.remove();
    if (State.isImpersonating()) State.stopImpersonation();
    State.setRole(null);
    LoginView._state = null;
    Router.navigate('/', { replace: true });
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
        <div class="main-content">
          ${impBanner}
          ${content}
        </div>
      </div>`;
    Nav.setActive(Router.getCurrentPath() || '/data/analytics');
    // Post-render hooks for sticky header observers
    if (typeof DataPlatformView._onAfterRender === 'function') DataPlatformView._onAfterRender();
    if (typeof OriginationsView._onAfterRender === 'function') OriginationsView._onAfterRender();
    if (typeof initColumnResize === 'function') initColumnResize();
    // Resume the welcome coachmark tour if applicable
    if (typeof Coachmarks !== 'undefined') setTimeout(() => Coachmarks.maybeStart(), 50);
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
      '/welcome':                 () => {
        const r = State.getRole();
        if (!['lo','lp'].includes(r)) {
          if (r === 'prog_admin') { Router.navigate('/origination-companies', { replace: true }); return ''; }
          Router.navigate('/data/analytics', { replace: true }); return '';
        }
        return WelcomeView.render();
      },
      '/originations':            () => {
        const r = State.getRole();
        if (['lo','lp'].includes(r)) { Router.navigate('/data/applications', { replace: true }); return ''; }
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
      '/user-management':         () => PlatformOpsView.render(path),
      '/users':                   () => {
        const segs = path.replace('/users', '').split('/').filter(Boolean);
        const id = segs[0];
        if (!id) return '';
        const edit = segs[1] === 'edit';
        return ProfileView.renderPage(id, { edit });
      },
      '/branches':                () => {
        const [pathOnly] = path.split('?');
        const segs = pathOnly.replace('/branches', '').split('/').filter(Boolean);
        const id = segs[0];
        if (!id) { Router.navigate('/origination-companies', { replace: true }); return ''; }
        if (id === 'new') return BranchCreateView.render(path);
        const edit = segs[1] === 'edit';
        return BranchesView.renderDetailPage(id, { edit });
      },
      '/system-config':           () => SystemConfigView.render(path),
      '/bulk-invite':             () => BulkInviteView.render(Router.getCurrentPath()),
      '/data/analytics':          () => { DataPlatformView._activeTab = 'analytics';    return DataPlatformView.render(); },
      '/data/applications':       () => { DataPlatformView._activeTab = 'applications'; return DataPlatformView.render(); },
      // /data/originations removed — originations now served by /originations
      '/data/portfolio':          () => { DataPlatformView._activeTab = 'portfolio';     return DataPlatformView.render(); },
      '/data/batches':            () => { DataPlatformView._activeTab = 'batches';      return DataPlatformView.render(); },
      '/data/activations':        () => { DataPlatformView._activeTab = 'activations';  return DataPlatformView.render(); },
      '/prospect':                () => ProspectDashboardView.render(),
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
      // Post-render hooks for sticky header observers
      if (typeof DataPlatformView._onAfterRender === 'function') DataPlatformView._onAfterRender();
      if (typeof OriginationsView._onAfterRender === 'function') OriginationsView._onAfterRender();
      // Column resize on all tables
      if (typeof initColumnResize === 'function') initColumnResize(mainEl);
      // Resume the welcome coachmark tour if applicable
      if (typeof Coachmarks !== 'undefined') setTimeout(() => Coachmarks.maybeStart(), 50);
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
    const target = State.getCurrentUser();
    // If the impersonated user hasn't finished onboarding yet, open the wizard
    // for them. This drives the bulk-invite → impersonate → wizard demo flow.
    if (target && target.onboardingStatus !== 'active' && target.onboardingStatus !== 'suspended') {
      this.renderShell('<div style="padding:40px;text-align:center;color:var(--h-text-muted)">Loading invite onboarding…</div>');
      OnboardingFlowView.open(target.role || 'lo', { userId: target.id });
      return;
    }
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
  _filterLO: '',
  _filterOwner: '',
  _filterProgram: '',
  _sortField: null,
  _sortDir: 'asc',
  _page: 0,
  _pageSize: 15,
  _selected: new Set(),
  _activeTab: 'overview',       // 'overview' | 'tasks' | 'documents' | 'parties' | 'history'
  _expandedTaskStages: new Set(),
  _expandedTaskId: null,

  /* ── Days-in-stage (demo approximations) ── */
  _LOAN_DAYS: {
    'DCDC000001': 21, 'DCDC000002': 29, 'DCDC000003': 46,
    'DCDC000004': 3,  'DCDC000005': 18, 'DCDC000006': 27,
    'KDKY000001': 22, 'KDKY000002': 34,
  },
  _daysInStage(loan) { return this._LOAN_DAYS[loan.id] || Math.floor(Math.random() * 20 + 5); },

  /* ── Main render dispatcher ── */
  render() {
    // Detail view — single-loan workbench. Toggle here picks Atrium vs classic.
    if (this._viewMode === 'detail' && this._selectedLoanId) {
      const detailMode = State.getPageMode('originations-detail');
      if (detailMode === 'atrium') {
        // Atrium workbench filtered to just the loan(s) in scope
        State.setAtriumScope([this._selectedLoanId]);
        const toggleHtml = this._renderDetailArtboardToggle();
        return `
          <div class="artboard-floating-toggle" data-mode="atrium">${toggleHtml}</div>
          ${ArtboardMountView.render('atrium', { height: 'calc(100vh - var(--topnav-height))' })}
        `;
      }
      return `<div class="page-body">${this._renderDetail()}</div>`;
    }

    // List view — Institutional is the default originations table.
    let pageMode = State.getPageMode('originations');
    if (pageMode === 'default') pageMode = 'institutional';

    if (pageMode === 'institutional') {
      const toggleHtml = this._renderListArtboardToggle(pageMode);
      const queuedIds = State.getAtriumScope();
      return `
        ${ArtboardMountView.render('institutional', {
          height: 'calc(100vh - var(--topnav-height))',
          props: { context: 'originations' },
          suffix: 'originations'
        })}
        <div class="artboard-floating-toggle" data-mode="${pageMode}">${toggleHtml}</div>
        ${queuedIds.length ? `
          <div class="atrium-queue-bar">
            <span><b>${queuedIds.length}</b> loan${queuedIds.length === 1 ? '' : 's'} queued for Atrium</span>
            <button class="btn btn-primary btn-sm" onclick="OriginationsView._enterAtriumQueue()">View in Atrium →</button>
            <button class="btn btn-ghost btn-sm" onclick="OriginationsView._clearAtriumQueue()">Clear</button>
          </div>` : ''}
      `;
    }

    if (pageMode === 'atrium-queue') {
      const toggleHtml = this._renderListArtboardToggle(pageMode);
      return `
        <div class="artboard-floating-toggle" data-mode="atrium-queue">${toggleHtml}</div>
        ${ArtboardMountView.render('atrium', { height: 'calc(100vh - var(--topnav-height))' })}
      `;
    }

    // Classic table fallback
    return `<div class="page-body">${this._renderList(this._renderListArtboardToggle(pageMode))}</div>`;
  },

  _renderListArtboardToggle(cur) {
    const queuedIds = State.getAtriumScope();
    const modes = [
      { id: 'institutional', label: 'Institutional' },
      { id: 'classic',       label: 'Classic table' },
      { id: 'atrium-queue',  label: queuedIds.length ? `Atrium · ${queuedIds.length} queued` : 'Atrium · queue', disabled: !queuedIds.length },
    ];
    return `<div class="artboard-toggle" role="tablist" aria-label="View mode">
      ${modes.map(m => `
        <button role="tab" aria-selected="${m.id === cur}"
                ${m.disabled ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}
                class="${m.id === cur ? 'active' : ''}"
                onclick="${m.disabled ? '' : `OriginationsView._setListPageMode('${m.id}')`}">${m.label}</button>
      `).join('')}
    </div>`;
  },
  _renderDetailArtboardToggle() {
    const cur = State.getPageMode('originations-detail');
    const modes = [
      { id: 'default', label: 'Classic detail' },
      { id: 'atrium',  label: 'Atrium · workbench' },
    ];
    return `<div class="artboard-toggle" role="tablist" aria-label="View mode">
      ${modes.map(m => `
        <button role="tab" aria-selected="${m.id === cur}"
                class="${m.id === cur ? 'active' : ''}"
                onclick="OriginationsView._setDetailPageMode('${m.id}')">${m.label}</button>
      `).join('')}
    </div>`;
  },
  _setListPageMode(mode) { State.setPageMode('originations', mode); App.renderView('/originations'); },
  _setDetailPageMode(mode) {
    State.setPageMode('originations-detail', mode);
    App.renderView('/originations/' + this._selectedLoanId);
  },
  _enterAtriumQueue() { State.setPageMode('originations', 'atrium-queue'); App.renderView('/originations'); },
  _clearAtriumQueue() { State.setAtriumScope([]); App.renderView('/originations'); },
  _toggleAtriumQueue(id) {
    const cur = State.getAtriumScope();
    if (cur.includes(id)) State.setAtriumScope(cur.filter(x => x !== id));
    else State.setAtriumScope([...cur, id]);
    App.renderView('/originations');
  },

  /* ================================================================
     LIST VIEW
  ================================================================ */
  _renderList(toggleHtml) {
    const role  = State.getRole();
    let loans = State.getLoansForRole();

    const title = (role === 'lo' || role === 'lp') ? 'My Originations' : 'Originations';

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
    const needsAction = active.filter(l => this._daysInStage(l) > 14);

    const kpis = [
      { label: 'Total Originations', value: loans.length, sub: Display.currency(totalVal) + ' total value' },
      { label: 'Active Pipeline',    value: Display.currency(activeVal), sub: `${active.length} loan${active.length !== 1 ? 's' : ''} in progress` },
      { label: 'Avg Loan Amount',    value: Display.currency(avgAmount), sub: `Across ${loans.length} loans` },
      { label: 'Close Rate',         value: closeRate + '%', sub: `${completed.length} of ${loans.length} completed` },
      { label: 'Avg Days in Stage',  value: avgDays, sub: active.length ? 'Active loans' : 'No active loans' },
      { label: 'Needs Action',       value: needsAction.length, sub: needsAction.length ? 'Need attention' : 'All on track', accent: needsAction.length > 0 },
    ];

    const kpiHtml = `<div class="stat-row" style="margin-bottom:20px">${
      kpis.map(k => `
        <div class="stat-item">
          <div class="stat-label">${k.label}</div>
          <div class="stat-value" style="font-size:26px${k.accent ? ';color:var(--h-error)' : ''}">${k.value}</div>
          <div class="stat-desc">${k.sub}</div>
        </div>`).join('')
    }</div>`;

    /* ── Apply filters ── */
    const originations = loans.filter(l => l.phase === 'origination' || !l.phase);
    const prequalifications = loans.filter(l => l.phase === 'prequalification');

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

    // Advanced filters
    if (this._filterLO) filtered = filtered.filter(l => l.loId === this._filterLO);
    if (this._filterProgram) filtered = filtered.filter(l => l.program === this._filterProgram);
    if (this._filterOwner) {
      filtered = filtered.filter(l => DataPlatformView._nextActionOwner(l) === this._filterOwner);
    }

    // Derive unique values for filter dropdowns
    const loIds = [...new Set(loans.map(l => l.loId).filter(Boolean))];
    const loOptions = loIds.map(id => { const u = State.getUser(id); return u ? { id, name: Display.fullName(u) } : null; }).filter(Boolean);
    const programs = [...new Set(loans.map(l => l.program).filter(Boolean))];

    const hasAdvancedFilters = this._filter !== 'all' || this._filterLO || this._filterOwner || this._filterProgram || this._search;

    const filterBarHtml = `<div class="filter-bar">
      <input class="filter-search" placeholder="Search by ID, borrower, address…"
             value="${this._search}" oninput="OriginationsView._setSearch(this.value)" />
      <select class="filter-select" onchange="OriginationsView._setFilter(this.value)">
        <option value="all" ${this._filter === 'all' ? 'selected' : ''}>All Types (${loans.length})</option>
        <option value="originations" ${this._filter === 'originations' ? 'selected' : ''}>Originations (${originations.length})</option>
        <option value="prequalifications" ${this._filter === 'prequalifications' ? 'selected' : ''}>Prequalifications (${prequalifications.length})</option>
      </select>
      <select class="filter-select" onchange="OriginationsView._setFilterProgram(this.value)">
        <option value="">All Programs</option>
        ${programs.map(p => `<option value="${p}" ${this._filterProgram === p ? 'selected' : ''}>${p}</option>`).join('')}
      </select>
      <select class="filter-select" onchange="OriginationsView._setFilterOwner(this.value)">
        <option value="">Next Action: All</option>
        <option value="originator" ${this._filterOwner === 'originator' ? 'selected' : ''}>Originator</option>
        <option value="underwriter" ${this._filterOwner === 'underwriter' ? 'selected' : ''}>Underwriter</option>
      </select>
      <select class="filter-select" onchange="OriginationsView._setFilterLO(this.value)">
        <option value="">All Owners</option>
        ${loOptions.map(o => `<option value="${o.id}" ${this._filterLO === o.id ? 'selected' : ''}>${o.name}</option>`).join('')}
      </select>
      ${hasAdvancedFilters ? `<button class="filter-clear" onclick="OriginationsView._clearFilters()">Clear filters</button>` : ''}
    </div>`;

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

    const allChecked = pageLoans.length > 0 && pageLoans.every(l => this._selected.has(l.id));
    const someChecked = this._selected.size > 0;

    const rows = pageLoans.map(l => {
      const proc = generateOriginationProcess(l.status);
      const rowMilestone = renderMilestoneBar(proc, { size: 'compact' });
      const currentStage = proc.find(s => s.status === 'in_progress');
      const stageLabel = currentStage ? currentStage.label : (l.status === 'completed' ? 'Completed' : 'Not Started');
      const isAttn = this._daysInStage(l) > 14 && l.status !== 'completed' && l.status !== 'draft';
      const checked = this._selected.has(l.id);
      const timeAgo = l.submittedAt ? Display.relativeTime(l.submittedAt) : '—';
      const addrParts = l.address.split(',');
      const addrLine1 = addrParts[0].trim();
      const addrLine2 = addrParts.slice(1).join(',').trim();
      return `
        <tr class="orig-table-row ${isAttn ? 'row-needs-attention' : ''}" onclick="OriginationsView.openLoan('${l.id}')">
          <td onclick="event.stopPropagation()">
            <input type="checkbox" ${checked ? 'checked' : ''} style="accent-color:var(--h-action)"
                   onchange="OriginationsView._toggleSelect('${l.id}')" />
          </td>
          <td>
            <div style="font-size:12px;font-weight:700;color:var(--h-action)">${l.id}</div>
            <div style="font-size:13px;color:var(--h-text-primary)">${l.borrowerName}</div>
          </td>
          <td class="td-address"><div class="addr-line1">${addrLine1}</div><div class="addr-line2">${addrLine2}</div></td>
          <td class="td-amount">${Display.currency(l.amount)}</td>
          <td class="td-status">${rowMilestone}<div class="td-status-label">${stageLabel}</div></td>
          <td class="td-next-action">${DataPlatformView._nextActionTag(l)}<div class="td-next-action-text">${DataPlatformView._nextActionText(l)}</div></td>
          <td>${renderOwnersCell(l)}</td>
          <td style="font-size:11px;color:var(--h-text-muted);white-space:nowrap">${timeAgo}</td>
        </tr>`;
    }).join('');

    const tableHtml = `
      ${filterBarHtml}
      ${someChecked ? `
      <div class="app-bulk-bar">
        <span style="font-size:12px;font-weight:600;color:var(--h-text-primary)">${this._selected.size} selected</span>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation()">Export</button>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation()">Batch</button>
        <button class="btn btn-ghost btn-sm" onclick="OriginationsView._clearSelection()">Clear</button>
      </div>` : ''}
      <div class="table-container">
        <table>
          <thead><tr>
            <th style="width:32px" onclick="event.stopPropagation()">
              <input type="checkbox" ${allChecked ? 'checked' : ''} style="accent-color:var(--h-action)"
                     onchange="OriginationsView._toggleSelectAll()" />
            </th>
            <th class="sortable-th" onclick="OriginationsView._setSort('id')">Loan / Borrower ${sortIcon('id')}</th>
            <th>Address</th>
            <th class="sortable-th" onclick="OriginationsView._setSort('amount')">Amount ${sortIcon('amount')}</th>
            <th class="sortable-th" onclick="OriginationsView._setSort('progress')">Status ${sortIcon('progress')}</th>
            <th>Next Action</th>
            <th class="sortable-th" onclick="OriginationsView._setSort('borrowerName')">Owners ${sortIcon('borrowerName')}</th>
            <th class="sortable-th" onclick="OriginationsView._setSort('updatedAt')">Updated ${sortIcon('updatedAt')}</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--h-text-muted);padding:32px">No originations found</td></tr>'}</tbody>
        </table>
      </div>
      ${totalPages > 1 ? `
      <div class="app-pagination">
        <button class="btn btn-ghost btn-sm" ${this._page === 0 ? 'disabled' : ''} onclick="OriginationsView._setPage(${this._page - 1})">← Prev</button>
        <span class="app-pagination-info">Page ${this._page + 1} of ${totalPages} · ${filtered.length} loans</span>
        <button class="btn btn-ghost btn-sm" ${this._page >= totalPages - 1 ? 'disabled' : ''} onclick="OriginationsView._setPage(${this._page + 1})">Next →</button>
      </div>` : `<div class="app-pagination"><span class="app-pagination-info">${filtered.length} loan${filtered.length !== 1 ? 's' : ''}</span></div>`}`;

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">${title}</div>
            <div class="page-subtitle">${loans.length} total origination${loans.length !== 1 ? 's' : ''} in pipeline</div>
          </div>
          <div class="page-header-actions" style="display:flex;align-items:center;gap:12px">
            ${toggleHtml || ''}
            ${role === 'lo' ? `<button class="btn btn-primary btn-sm" onclick="OriginationsView.showNewAppModal()">+ New Application</button>` : ''}
          </div>
        </div>
      </div>
      ${kpiHtml}
      ${tableHtml}
      <div id="originations-modal"></div>`;
  },

  /* ── List helpers ── */
  _setFilter(f)  { this._filter = f; this._page = 0; App.renderView('/originations'); },
  _setSearch(q)  { this._search = q; this._page = 0; App.renderView('/originations'); },
  _setFilterLO(v) { this._filterLO = v; this._page = 0; App.renderView('/originations'); },
  _setFilterOwner(v) { this._filterOwner = v; this._page = 0; App.renderView('/originations'); },
  _setFilterProgram(v) { this._filterProgram = v; this._page = 0; App.renderView('/originations'); },
  _clearFilters() { this._filter = 'all'; this._search = ''; this._filterLO = ''; this._filterOwner = ''; this._filterProgram = ''; this._page = 0; App.renderView('/originations'); },
  _setSort(field) {
    if (this._sortField === field) this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    else { this._sortField = field; this._sortDir = 'asc'; }
    App.renderView('/originations');
  },
  _setPage(p)    { this._page = Math.max(0, p); App.renderView('/originations'); },
  _toggleSelect(id) {
    if (this._selected.has(id)) this._selected.delete(id);
    else this._selected.add(id);
    App.renderView('/originations');
  },
  _toggleSelectAll() {
    // Toggle all on current page
    let loans = State.getLoansForRole();
    const pageLoans = loans.slice(this._page * this._pageSize, (this._page + 1) * this._pageSize);
    const allChecked = pageLoans.every(l => this._selected.has(l.id));
    pageLoans.forEach(l => { if (allChecked) this._selected.delete(l.id); else this._selected.add(l.id); });
    App.renderView('/originations');
  },
  _clearSelection() { this._selected.clear(); App.renderView('/originations'); },

  /* ================================================================
     DETAIL VIEW — Unified layout (context header + stage tracker + tabs + sidebar)
  ================================================================ */
  _renderDetail() {
    const loan = State.getLoan(this._selectedLoanId);
    if (!loan) { this._viewMode = 'list'; return this._renderList(); }

    const proc = generateOriginationProcess(loan.status);
    const lo = State.getUser(loan.loId);
    const loName = lo ? Display.fullName(lo) : '—';

    const addrPrimary = loan.phase === 'prequalification' ? 'Prequalification' : (loan.address.split(',')[0] || '').trim();

    return `
      <div class="ud-detail ud-detail-orig">
        <div id="context-header-sentinel"></div>
        <div class="ud-breadcrumb">
          <span class="ud-breadcrumb-link" onclick="OriginationsView.backToList()">Originations</span>
          <span class="ud-breadcrumb-sep">/</span>
          <span class="ud-breadcrumb-current">${addrPrimary} <span class="ud-breadcrumb-mono">${loan.id}</span></span>
        </div>
        ${this._udContextHeader(loan, loName, proc)}
        ${this._udActionBanner(loan, proc)}
        <div class="ud-content-grid">
          <div>
            ${this._udContentTabs()}
            <div class="ud-content-main">${this._udTabContent(loan, proc, loName)}</div>
          </div>
          <div>${this._udSidebar(loan, proc, loName)}</div>
        </div>
        <div id="originations-modal"></div>
      </div>`;
  },

  /* ── Owner tag helper ── */
  _ownerTag(role) {
    return ownershipTag(role);
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
    const currentStage = proc.find(s => s.status === 'in_progress');

    const milestoneBarHtml = renderMilestoneBar(proc, { size: 'full', stageIcons: this._stageIcon.bind(this) });

    const stageLabel = currentStage ? currentStage.label : (isCompleted ? 'Completed' : 'Not Started');

    const compactMilestone = renderMilestoneBar(proc, { size: 'compact' });

    return `
      <div class="ud-context-header">
        <div class="ud-context-header-full">
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
            ${milestoneBarHtml}
          </div>
        </div>
        <div class="ud-context-header-compact">
          <div class="ud-compact-info">
            <div class="ud-compact-address">${addr}</div>
            <div class="ud-compact-id">${loan.id} &middot; ${loan.borrowerName}</div>
          </div>
          <span class="ud-status-pill ${isCompleted ? 'completed' : ''}" style="flex-shrink:0"><span class="ud-status-pill-dot"></span> ${Display.loanStatusLabel(loan.status)}</span>
          <div class="ud-compact-divider"></div>
          <div class="ud-compact-metrics">
            <div class="ud-compact-metric"><span class="ud-compact-metric-label">Program</span><span class="ud-compact-metric-value">${loan.program}</span></div>
            <div class="ud-compact-metric"><span class="ud-compact-metric-label">Amount</span><span class="ud-compact-metric-value">${Display.currency(loan.amount)}</span></div>
            <div class="ud-compact-metric"><span class="ud-compact-metric-label">LTV / CLTV</span><span class="ud-compact-metric-value">${loan.ltv ?? '—'}% / ${loan.cltv ?? '—'}%</span></div>
            <div class="ud-compact-metric"><span class="ud-compact-metric-label">FICO</span><span class="ud-compact-metric-value">${loan.fico || '—'}</span></div>
            <div class="ud-compact-metric"><span class="ud-compact-metric-label">Officer</span><span class="ud-compact-metric-value">${loName}</span></div>
            <div class="ud-compact-metric"><span class="ud-compact-metric-label">Est. Close</span><span class="ud-compact-metric-value">${loan.closingDate ? Display.date(loan.closingDate) : 'TBD'}</span></div>
          </div>
          <div class="ud-compact-divider"></div>
          <div class="ud-compact-progress">${compactMilestone}</div>
          <span class="ud-compact-stage">${stageLabel}</span>
        </div>
      </div>`;
  },

  /* ── SLA deadlines per task (business days from submission) ── */
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
    // Add business days
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
    const upNextHtml = nextPending ? `<div class="ud-action-banner-upnext">Up next: ${nextPending.label} &middot; ${nextPending.role}</div>` : '';

    // Deadline
    const deadline = this._taskDeadline(loan, activeTask.id);
    const dl = this._formatDeadline(deadline);
    const deadlineHtml = dl
      ? `<div class="ud-action-banner-deadline ${dl.cls}">${dl.dateStr} &middot; ${dl.urgency}</div>`
      : '';

    return `<div class="ud-action-banner">
      <div class="ud-action-banner-icon">&#9888;</div>
      <div class="ud-action-banner-body">
        <div class="ud-action-banner-label">Next Action Required</div>
        <div class="ud-action-banner-text">${activeTask.label}</div>
        <div class="ud-action-banner-sub">${this._ownerTag(activeTask.role)} ${activeTask.role} &middot; ${currentStage.label}</div>
      </div>
      <div class="ud-action-banner-right">
        ${activeTask.action ? `<button class="ud-action-banner-btn" onclick="event.stopPropagation();OriginationsView.jumpToTask('${currentStage.id}','${activeTask.id}')">${activeTask.action}</button>` : ''}
        ${deadlineHtml}
        ${upNextHtml}
      </div>
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
              ${this._ownerTag(t.role)}
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
    const activeTask = proc.flatMap(s => s.tasks).find(t => t.status === 'active');
    const expandedId = this._expandedTaskId ?? (activeTask ? activeTask.id : null);

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
              <div class="ud-section-title" style="color:var(--h-text-muted);margin:0">${stage.label} <span class="ud-section-count">0/${total} &middot; Pending</span></div>
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
          ${isExpanded ? stage.tasks.map(t => {
            const isTaskExpanded = t.id === expandedId;
            const detail = TASK_DETAILS[t.id];
            return `
            <div class="ud-task-row-wrapper ${isTaskExpanded ? 'expanded' : ''}" onclick="OriginationsView.toggleTask('${t.id}')">
              <div class="ud-task-row">
                <div class="ud-task-icon ${t.status === 'done' ? 'done' : t.status === 'active' ? 'active' : 'pending'}">${t.status === 'done' ? '&#10003;' : t.status === 'active' ? '&#9679;' : ''}</div>
                <span class="ud-task-label ${t.status === 'done' ? 'done' : ''}">${t.label}</span>
                ${this._ownerTag(t.role)}
                ${!isTaskExpanded && t.action && t.status !== 'done' ? `<button class="ud-task-action ${t.status === 'active' ? 'primary' : ''}" onclick="event.stopPropagation()">${t.action}</button>` : ''}
                <span class="ud-task-expand-toggle ${isTaskExpanded ? 'open' : ''}">&#9654;</span>
              </div>
              ${isTaskExpanded && detail ? `
              <div class="ud-task-expanded">
                <div class="ud-task-description">${detail.description}</div>
                ${detail.fields.length ? `<div class="ud-task-fields">${detail.fields.map(f =>
                  `<div class="ud-task-field-item">
                    <div class="ud-task-field-icon">${t.status === 'done' ? '&#10003;' : ''}</div>
                    <span>${f}</span>
                  </div>`).join('')}</div>` : ''}
                ${t.action && t.status !== 'done' ? `<button class="ud-task-expanded-action" onclick="event.stopPropagation()">${t.action}</button>` : ''}
              </div>` : ''}
            </div>`;
          }).join('') : ''}
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
        <div class="ud-dropzone" id="orig-dropzone"
             ondragover="event.preventDefault();this.classList.add('dragover')"
             ondragleave="this.classList.remove('dragover')"
             ondrop="event.preventDefault();this.classList.remove('dragover');OriginationsView._handleFileDrop(event)"
             onclick="document.getElementById('orig-file-input').click()">
          <div class="ud-dropzone-icon">&#128449;</div>
          <div class="ud-dropzone-text">Drag &amp; drop files here or <span>browse</span></div>
          <div class="ud-dropzone-hint">Upload documents before they are formally requested. PDF, DOC, JPG up to 25 MB.</div>
          <input type="file" id="orig-file-input" multiple style="display:none" onchange="OriginationsView._handleFileSelect(event)">
        </div>
      </div>
      <div class="ud-content-section">
        <div class="ud-section-title">Documents <span class="ud-section-count">${approvedCount} of ${docs.length} approved</span></div>
        ${docs.map(d => `
          <div class="ud-doc-row">
            <div class="ud-doc-icon">&#128196;</div>
            <div class="ud-doc-info"><div class="ud-doc-name">${d.name}</div><div class="ud-doc-meta">${d.meta}</div></div>
            <span class="ud-doc-badge ${d.status}">${d.status === 'approved' ? 'Approved' : d.status === 'missing' ? 'Not Uploaded' : 'Pending'}</span>
            ${this._ownerTag(d.owner)}
            ${d.status === 'missing' ? '<button class="ud-task-action" onclick="event.stopPropagation()">Upload</button>' : ''}
          </div>`).join('')}
      </div>`;
  },

  /* ── File drop handlers ── */
  _handleFileDrop(event) {
    const files = event.dataTransfer?.files;
    if (files?.length) this._showUploadToast('orig-dropzone', files);
  },

  _handleFileSelect(event) {
    const files = event.target?.files;
    if (files?.length) this._showUploadToast('orig-dropzone', files);
  },

  _showUploadToast(zoneId, files) {
    const names = Array.from(files).map(f => f.name).join(', ');
    const zone = document.getElementById(zoneId);
    if (zone) {
      const orig = zone.innerHTML;
      zone.innerHTML = `<div class="ud-dropzone-icon" style="color:var(--h-success)">&#10003;</div><div class="ud-dropzone-text">${files.length} file${files.length > 1 ? 's' : ''} received</div><div class="ud-dropzone-hint">${names}</div>`;
      setTimeout(() => { zone.innerHTML = orig; }, 3000);
    }
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
    if (!warningsHtml) warningsHtml = '<div class="ud-sidebar-item" style="color:var(--h-text-muted);font-size:12px;padding:12px 16px">No warnings</div>';

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
        <div class="ud-sidebar-kv"><span class="ud-sidebar-kv-label">Days in Stage</span><span class="ud-sidebar-kv-value" ${days > 14 ? 'style="color:var(--h-error)"' : ''}>${days}d</span></div>
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
    if (this._stickyObserver) { this._stickyObserver.disconnect(); this._stickyObserver = null; }
    this._expandedTaskId = null;
    Router.navigate('/originations');
  },

  _stickyObserver: null,

  _onAfterRender() {
    if (this._stickyObserver) { this._stickyObserver.disconnect(); this._stickyObserver = null; }
    const sentinel = document.getElementById('context-header-sentinel');
    const header = document.querySelector('.ud-context-header');
    if (!sentinel || !header) return;
    this._stickyObserver = new IntersectionObserver(([entry]) => {
      header.classList.toggle('sticky-compact', !entry.isIntersecting);
    }, { threshold: 0, rootMargin: '-58px 0px 0px 0px' });
    this._stickyObserver.observe(sentinel);
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

  jumpToTask(stageId, taskId) {
    this._activeTab = 'tasks';
    this._expandedTaskStages.add(stageId);
    this._expandedTaskId = taskId;
    App.renderView('/originations/' + this._selectedLoanId);
    // Scroll to the task after render
    requestAnimationFrame(() => {
      const el = document.querySelector(`.ud-task-row-wrapper[onclick*="${taskId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  },

  toggleTask(taskId) {
    this._expandedTaskId = (this._expandedTaskId === taskId) ? null : taskId;
    App.renderView('/originations/' + this._selectedLoanId);
  },

  /* ── New Application Modal (migrated to AppModal primitive — 2026-05-26 canon) ── */
  showNewAppModal() {
    AppModal.open({
      title: 'New Application',
      subtitle: 'Start a Home Equity Investment origination',
      size: 'lg',
      body: `
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
            <label>Loan Amount ($) *</label>
            <input class="input" id="new-app-amount" type="number" placeholder="150000" />
          </div>
          <div class="form-group">
            <label>Program *</label>
            <select class="select-input" id="new-app-program">
              <option value="DC Dream Fund">DC Dream Fund</option>
              <option value="Kentucky Dream Fund">Kentucky Dream Fund</option>
              <option value="Multi-State Dream Fund">Multi-State Dream Fund</option>
            </select>
          </div>
        </div>`,
      actions: [
        ['Cancel',       'OriginationsView.closeModal()'],
        ['Create Draft', 'OriginationsView.submitNew()'],
      ],
    });
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
    AppModal.close();
  },
};

/* ============================================================
   Boot
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => App.init());

// Expose to window so JSX artboards (run in babel-eval scope) can reach them.
window.App = App;
window.OriginationsView = OriginationsView;
