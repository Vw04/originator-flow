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
    const role = State.getRole();
    if (role === 'sys_admin' || role === 'operator') {
      return this._renderCompaniesList();
    }
    return this._renderLoansList();
  },

  /* ── Loans List (LO / LP / Prog Admin) ── */
  _renderLoansList() {
    const role = State.getRole();
    const user = State.getCurrentUser();

    let loans;
    if (role === 'prog_admin') {
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

    const title = role === 'lo' ? 'My Loans' : role === 'prog_admin' ? 'Company Loans' : 'Assigned Loans';

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
          ${stageLoans.map(l => this._loanRow(l, stage)).join('')}
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
        ${loans.map(l => {
          const stageLabel = this._STATUS_LABELS[l.status] || l.status;
          return this._loanRow(l, stageLabel);
        }).join('')}
      </div>`;
  },

  _loanRow(l, stageLabel) {
    const days = this._LOAN_DAYS[l.id] || 0;
    const label = this._STATUS_LABELS[l.status] || l.status;
    return `
      <div class="m-list-item${days > 14 ? ' attention' : ''}">
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

  /* ── Companies List (Operator / Sys Admin) ── */
  _renderCompaniesList() {
    const companies = State.getCompanies();
    const users = State.getUsers();

    return `
      <div class="m-page-header">
        <div class="m-page-header-left">
          <div>
            <div class="m-page-title">Companies</div>
            <div class="m-page-subtitle">${companies.length} total</div>
          </div>
        </div>
      </div>

      <div class="m-list" style="padding:14px">
        ${companies.map(co => {
          const coUsers = users.filter(u => u.companyId === co.id);
          const active = coUsers.filter(u => u.onboardingStatus === 'active').length;
          const total = coUsers.length;
          const pct = total > 0 ? Math.round((active / total) * 100) : 0;
          const pillClass = pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red';
          const branches = State.getBranchesByCompany(co.id);

          return `
            <div class="m-co-item">
              <div class="m-co-row" onclick="MobileLoansView.toggleCompany('${co.id}')">
                <div>
                  <div class="m-co-name">${co.name}</div>
                  <div class="m-co-meta">${co.stateOfIncorporation} &middot; ${branches.length} branch${branches.length !== 1 ? 'es' : ''} &middot; ${total} users</div>
                </div>
                <div class="m-co-right">
                  <span class="m-onboard-pill ${pillClass}">${pct}%</span>
                  <span class="status-badge status-${co.status === 'active' ? 'success' : 'warning'}" style="font-size:10px;padding:2px 7px">${co.status}</span>
                </div>
              </div>
              <div class="m-co-detail" id="co-detail-${co.id}">
                <div class="m-co-detail-row"><span>Primary Contact</span><span class="m-co-detail-val">${co.primaryContact}</span></div>
                <div class="m-co-detail-row"><span>NMLS</span><span class="m-co-detail-val">${co.nmlsId}</span></div>
                <div class="m-co-detail-row"><span>Programs</span><span class="m-co-detail-val">${co.programs.length ? co.programs.join(', ') : 'None'}</span></div>
                <div class="m-co-detail-row"><span>Active Users</span><span class="m-co-detail-val">${active} / ${total}</span></div>
                ${branches.map(br => `
                  <div class="m-co-detail-row"><span style="padding-left:8px">${br.name}</span><span class="m-co-detail-val">${br.state} &middot; ${br.userCount} users</span></div>
                `).join('')}
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
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
