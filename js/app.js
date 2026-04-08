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
    Router.register('/originations', () => this.renderShell(OriginationsView.render()));

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
    Router.register('/data/originations', () => { DataPlatformView._activeTab = 'originations'; this.renderShell(DataPlatformView.render()); });
    Router.register('/data/batches',      () => { DataPlatformView._activeTab = 'batches';      this.renderShell(DataPlatformView.render()); });
    Router.register('/data/activations',  () => { DataPlatformView._activeTab = 'activations';  this.renderShell(DataPlatformView.render()); });

    Router.init();
  },

  renderRole() {
    document.getElementById('app').innerHTML = RoleSelectView.render();
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
      '/originations':            () => OriginationsView.render(),
      '/origination-companies':   () => OriginationCompaniesView.render(path),
      '/investors':               () => InvestorsView.render(path),
      '/platform':                () => PlatformOpsView.render(path),
      '/system-config':           () => SystemConfigView.render(path),
      '/data/analytics':          () => { DataPlatformView._activeTab = 'analytics';    return DataPlatformView.render(); },
      '/data/applications':       () => { DataPlatformView._activeTab = 'applications'; return DataPlatformView.render(); },
      '/data/originations':       () => { DataPlatformView._activeTab = 'originations'; return DataPlatformView.render(); },
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
   Originations View — Kanban Board (LO / LP)
   ============================================================ */

const OriginationsView = {

  COLUMNS: [
    { key: 'draft',      label: 'Draft',       statuses: ['draft'] },
    { key: 'submitted',  label: 'Submitted',   statuses: ['initial_application_submitted','prequalification_in_progress'] },
    { key: 'in_review',  label: 'In Review',   statuses: ['application_documents_approved','sent_to_docutech','origination_created','pending_origination_creation'] },
    { key: 'completed',  label: 'Completed',   statuses: ['completed'] },
  ],

  render() {
    const role  = State.getRole();
    const user  = State.getCurrentUser();
    const loans = (role === 'lo' || role === 'lp')
      ? State.getLoansByLO(user?.id)
      : State.getLoans();

    const title    = role === 'lo' ? 'My Originations' : 'Applications';
    const subtitle = `${loans.length} application${loans.length !== 1 ? 's' : ''}`;

    const columns = this.COLUMNS.map(col => {
      const cards = loans.filter(l => col.statuses.includes(l.status));

      const cardHtml = cards.length
        ? cards.map(l => `
            <div class="kanban-card">
              <div class="kanban-card-title">${l.borrowerName}</div>
              <div class="kanban-card-sub">${l.address}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                <span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span>
                <span class="tag">${l.program}</span>
              </div>
              <div class="kanban-card-row">
                <span class="kanban-card-amount">${Display.currency(l.amount)}</span>
                <span class="kanban-card-meta">${l.ltv ? `LTV ${l.ltv}%` : 'LTV —'}</span>
              </div>
              <div style="font-size:11px;color:var(--color-text-muted)">${l.submittedAt ? 'Submitted ' + Display.date(l.submittedAt) : 'Not submitted'}</div>
            </div>`).join('')
        : `<div class="kanban-empty">No deals</div>`;

      return `
        <div class="kanban-col">
          <div class="kanban-col-header">
            <span class="kanban-col-label">${col.label}</span>
            <span class="kanban-col-count">${cards.length}</span>
          </div>
          ${cardHtml}
        </div>`;
    }).join('');

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">${title}</div>
            <div class="page-subtitle">${subtitle}</div>
          </div>
          <div class="page-header-actions">
            ${role === 'lo' ? `<button class="btn btn-primary" onclick="OriginationsView.showNewAppModal()">+ New Application</button>` : ''}
          </div>
        </div>
      </div>

      <div class="page-body">
        ${loans.length === 0 && role !== 'lo' ? `
          <div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <h3>No applications yet</h3>
            <p>Applications will appear here once submitted.</p>
          </div>` : `
          <div class="kanban-board">${columns}</div>`}
      </div>
      <div id="originations-modal"></div>`;
  },

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
              <span class="alert-icon">ℹ️</span>
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
