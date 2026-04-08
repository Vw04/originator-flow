/* ============================================================
   MOBILE LOANS — Loan list (LO/LP/ProgAdmin) + Companies (Operator)
   ============================================================ */

const MobileLoansView = {

  _filter: 'all',
  _search: '',

  _STATUS_LABELS: MobileHomeView._STATUS_LABELS,
  _STAGE_MAP: MobileHomeView._STAGE_MAP,
  _LOAN_DAYS: MobileHomeView._LOAN_DAYS,

  render() {
    return this._renderLoansList();
  },

  /* ── Loans List (all roles) ── */
  _renderLoansList() {
    const role = State.getRole();
    const user = State.getCurrentUser();

    let loans;
    if (role === 'sys_admin' || role === 'operator') {
      loans = State.getLoans();
    } else if (role === 'prog_admin') {
      loans = user ? State.getLoansByCompany(user.companyId) : [];
    } else {
      loans = user ? State.getLoansByLO(user.id) : [];
    }

    /* Apply filter */
    let filtered = loans;
    if (this._filter !== 'all') {
      const stageStatuses = this._STAGE_MAP[this._filter] || [];
      filtered = loans.filter(l => stageStatuses.includes(l.status));
    }

    /* Apply search */
    if (this._search) {
      const q = this._search.toLowerCase();
      filtered = filtered.filter(l =>
        l.borrowerName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
      );
    }

    const filterPills = ['All', 'Draft', 'Submitted', 'In Review', 'Completed'];

    const title = (role === 'sys_admin' || role === 'operator') ? 'All Loans'
      : role === 'lo' ? 'My Loans'
      : role === 'prog_admin' ? 'Company Loans'
      : 'Assigned Loans';

    return `
      <div class="m-page-header">
        <div class="m-page-header-left">
          <div>
            <div class="m-page-title">${title}</div>
            <div class="m-page-subtitle">${loans.length} total</div>
          </div>
        </div>
      </div>

      <div class="m-filter-strip">
        ${filterPills.map(p => {
          const key = p === 'All' ? 'all' : p;
          return `<button class="m-filter-pill${this._filter === key ? ' active' : ''}"
                          onclick="MobileLoansView.setFilter('${key}')">${p}</button>`;
        }).join('')}
      </div>

      <div class="m-search-wrap">
        <input class="m-search-input" type="text"
               placeholder="Search borrower, loan ID..."
               value="${this._search}"
               oninput="MobileLoansView.setSearch(this.value)" />
      </div>

      ${role === 'lo' ? this._renderGroupedLoans(filtered) : this._renderFlatLoans(filtered)}
    `;
  },

  _renderGroupedLoans(loans) {
    const stages = ['Draft', 'Submitted', 'In Review', 'Completed'];
    let html = '';

    stages.forEach(stage => {
      const statuses = this._STAGE_MAP[stage] || [];
      const stageLoans = loans.filter(l => statuses.includes(l.status));
      if (!stageLoans.length) return;

      html += `
        <div class="m-stage-group-header">
          ${stage}
          <span class="m-stage-count-badge">${stageLoans.length}</span>
        </div>
        <div class="m-list">
          ${stageLoans.map(l => this._loanRow(l)).join('')}
        </div>`;
    });

    if (!html) {
      html = `<div class="m-empty-state"><div class="m-empty-icon">&#128196;</div>No loans found</div>`;
    }

    return html + '<div class="m-spacer"></div>';
  },

  _renderFlatLoans(loans) {
    if (!loans.length) {
      return `<div class="m-empty-state"><div class="m-empty-icon">&#128196;</div>No loans found</div>`;
    }
    return `
      <div class="m-list" style="padding-bottom:14px">
        ${loans.map(l => this._loanRow(l)).join('')}
      </div>`;
  },

  _loanRow(l) {
    const days = this._LOAN_DAYS[l.id] || 0;
    const label = this._STATUS_LABELS[l.status] || l.status;
    return `
      <div class="m-list-item${days > 14 ? ' attention' : ''}" onclick="MobileDetailView.open('${l.id}')">
        <div class="m-list-item-header">
          <span class="m-list-item-title">${l.borrowerName}</span>
          <span class="m-days-badge${days <= 7 ? ' ok' : ''}">${days}d</span>
        </div>
        <div class="m-list-item-id">${l.id}</div>
        <div class="m-list-item-sub">${l.address}</div>
        <div class="m-list-item-footer">
          <span class="status-badge status-${label === 'Completed' ? 'success' : label === 'Draft' ? 'neutral' : 'info'}" style="font-size:10px;padding:2px 7px">${label}</span>
          <span class="m-list-item-amount">$${(l.amount).toLocaleString()}</span>
        </div>
      </div>`;
  },

  /* ── Actions ── */
  setFilter(f) {
    this._filter = f;
    App.renderMobileShell(this.render());
  },

  setSearch(q) {
    this._search = q;
    /* Debounced re-render — update list only */
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      App.renderMobileShell(this.render());
    }, 200);
  },

  toggleCompany(coId) {
    const el = document.getElementById(`co-detail-${coId}`);
    if (el) el.classList.toggle('open');
  },
};
