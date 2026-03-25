/* ============================================================
   HOMIUM ORIGINATOR FLOW — App Entry Point
   Wires router, nav, and views together.
   ============================================================ */

const App = {

  init() {
    // Register all routes
    Router.register('/', () => this.renderRole());
    Router.register('/dashboard',    () => this.renderShell(DashboardView.render()));
    Router.register('/companies',    () => this.renderShell(CompaniesView.render()));
    Router.register('/branches',     () => this.renderShell(BranchesView.render()));
    Router.register('/users',        () => this.renderShell(UsersView.render()));
    Router.register('/permissions',  () => this.renderShell(PermissionsView.render()));
    Router.register('/onboarding',   () => this.renderShell(OnboardingView.render()));
    Router.register('/profile',      () => this.renderShell(ProfileView.renderMyProfile()));
    Router.register('/originations', () => this.renderShell(OriginationsView.render()));

    // Subscribe state to re-render nav badge counts
    State.subscribe(() => {
      const navEl = document.querySelector('.sidebar-nav');
      if (navEl) {
        // Refresh only badge counts, not full nav (avoid scroll reset)
        document.querySelectorAll('.nav-badge').forEach(b => b.remove());
        const role = State.getRole();
        if (role === 'sys_admin' || role === 'operator') {
          const count = State.getUsers().filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus)).length;
          const onbItem = document.querySelector('.nav-item[data-path="/onboarding"]');
          if (onbItem && count > 0) {
            onbItem.insertAdjacentHTML('beforeend', `<span class="nav-badge">${count}</span>`);
          }
        }
      }
    });

    Router.init();
  },

  renderRole() {
    document.getElementById('app').innerHTML = RoleSelectView.render();
  },

  renderShell(content) {
    document.getElementById('app').innerHTML = `
      <div class="app-shell">
        ${Nav.render()}
        <div class="main-content">${content}</div>
      </div>`;
    Nav.setActive(Router.getCurrentPath() || '/dashboard');
  },

  renderView(path) {
    // Re-render just the main-content area without rebuilding nav
    const mainEl = document.querySelector('.main-content');
    if (!mainEl) { Router.navigate(path); return; }

    const viewMap = {
      '/dashboard':    () => DashboardView.render(),
      '/companies':    () => CompaniesView.render(),
      '/branches':     () => BranchesView.render(),
      '/users':        () => UsersView.render(),
      '/permissions':  () => PermissionsView.render(),
      '/onboarding':   () => OnboardingView.render(),
      '/profile':      () => ProfileView.renderMyProfile(),
      '/originations': () => OriginationsView.render(),
    };

    // Match path prefix
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
    // Clear state and go back to role selector
    State.setRole(null);
    Router.navigate('/', { replace: true });
    this.renderRole();
  },
};

/* ============================================================
   Originations View (LO / LP)
   ============================================================ */

const OriginationsView = {
  render() {
    const role = State.getRole();
    const user = State.getCurrentUser();
    const loans = role === 'lo' || role === 'lp'
      ? State.getLoansByLO(user?.id)
      : State.getLoans();

    const loanCards = loans.map(l => `
      <div class="loan-card">
        <div style="flex-shrink:0">
          <div style="width:40px;height:40px;border-radius:var(--radius);background:var(--color-surface);border:1px solid var(--color-border);display:flex;align-items:center;justify-content:center;font-size:18px">🏠</div>
        </div>
        <div class="loan-card-main">
          <div class="loan-card-id">${l.id}</div>
          <div class="loan-card-borrower">${l.borrowerName}</div>
          <div class="loan-card-address">${l.address}</div>
        </div>
        <div style="flex-shrink:0;text-align:right">
          <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;margin-bottom:4px">
            <span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span>
          </div>
          <div class="loan-amount">${Display.currency(l.amount)}</div>
          <div class="loan-program">${l.program} · LTV ${l.ltv}%</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">${l.submittedAt ? 'Submitted ' + Display.date(l.submittedAt) : 'Draft'}</div>
        </div>
      </div>`).join('');

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">${role === 'lo' ? 'My Originations' : 'Applications'}</div>
            <div class="page-subtitle">${loans.length} application${loans.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        ${role === 'lo' ? `
          <div class="page-header-actions">
            <button class="btn btn-primary btn-sm" onclick="OriginationsView.showNewAppModal()">+ New Application</button>
          </div>` : ''}
      </div>

      <div class="page-body">
        ${loans.length ? `
          <div style="display:flex;flex-direction:column;gap:10px">${loanCards}</div>` : `
          <div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <h3>No applications yet</h3>
            <p>Start a new application to originate a Home Equity Investment.</p>
            ${role === 'lo' ? `<button class="btn btn-primary" onclick="OriginationsView.showNewAppModal()">+ New Application</button>` : ''}
          </div>`}
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

    const id = `ORG-2026-${String(Math.floor(Math.random() * 900 + 100)).padStart(4, '0')}`;
    State.getLoans().push({
      id, companyId: user.companyId, branchId: user.branchId, loId: user.id,
      borrowerName: borrower, address, amount, program, status: 'draft', ltv: null, submittedAt: null, cltv: null,
    });

    this.closeModal();
    UsersView.showSuccess('Draft application created');
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
