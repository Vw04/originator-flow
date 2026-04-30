/* ============================================================
   HOMIUM ORIGINATOR FLOW — Dashboard View (role-adaptive)
   ============================================================ */

const DashboardView = {
  _filters: [],
  _searchQuery: '',
  _analyticsCollapsed: false,
  _analyticsSelectedCompany: null,
  _analyticsStageFilter: null,

  toggleAnalytics() {
    this._analyticsCollapsed = !this._analyticsCollapsed;
    App.renderView('/dashboard');
  },

  selectAnalyticsCompany(id) {
    this._analyticsSelectedCompany = this._analyticsSelectedCompany === id ? null : id;
    App.renderView('/dashboard');
  },

  filterAnalyticsByStage(stage) {
    this._analyticsStageFilter = this._analyticsStageFilter === stage ? null : stage;
    this._analyticsSelectedCompany = null;
    App.renderView('/dashboard');
  },

  nudgeUser(userId) {
    const btn = document.getElementById('nudge-btn-' + userId);
    if (!btn) return;
    btn.textContent = '✓ Sent';
    btn.disabled = true;
    btn.style.color = 'var(--color-primary)';
    setTimeout(() => { btn.textContent = 'Nudge'; btn.disabled = false; btn.style.color = ''; }, 3000);
  },

  advanceUserFromAnalytics(userId) {
    State.advanceOnboarding(userId);
    App.renderView('/dashboard');
  },

  _renderAnalyticsSection(users, companies) {
    const STAGES = [
      { key: 'invited',              label: 'Invited', color: '#94A3B8' },
      { key: 'email_verified',       label: 'Email',   color: '#60A5FA' },
      { key: '2fa_complete',         label: '2FA',     color: '#34D399' },
      { key: 'verification_pending', label: 'KYC',     color: '#FBBF24' },
      { key: 'active',               label: 'Active',  color: '#1D3D2A' },
    ];

    // Scope to origination + investor users (exclude internal platform users)
    const orgUsers = users.filter(u => u.companyId || u.role === 'investor');
    const total    = orgUsers.length;
    const counts   = {};
    STAGES.forEach(s => { counts[s.key] = orgUsers.filter(u => u.onboardingStatus === s.key).length; });
    const maxCount = Math.max(...Object.values(counts), 1);
    const CHART_H  = 110; // px — bar area height

    /* ── Funnel: vertical bar chart ── */
    const funnelBarsHtml = STAGES.map(s => {
      const count = counts[s.key];
      const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
      const barH  = Math.max(Math.round((count / maxCount) * CHART_H), 3);
      return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:2px">
        <div style="font-size:11px;font-weight:500;color:var(--color-text);text-align:center;line-height:1.3">${count}<br><span style="font-size:10px;font-weight:400;color:var(--color-text-muted)">${pct}%</span></div>
        <div style="width:100%;border-radius:4px 4px 0 0;background:${s.color};height:${barH}px"></div>
      </div>`;
    }).join('');

    const funnelXLabels = STAGES.map(s =>
      `<div style="flex:1;font-size:11px;color:var(--color-text-muted);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.label}</div>`
    ).join('');

    /* ── Stage Duration: bar chart with y-axis gridlines ── */
    const DURATIONS = [
      { label: 'Inv → Email', days: 1.2 },
      { label: 'Email → 2FA', days: 0.8 },
      { label: '2FA → KYC',   days: 2.1 },
      { label: 'KYC → Active',days: 3.4 },
    ];
    const MAX_DAYS  = 4;
    const GRID_VALS = [4, 3, 2, 1, 0];

    const gridLinesHtml = GRID_VALS.map(v => {
      const bottomPx = Math.round((v / MAX_DAYS) * CHART_H);
      return `<div style="position:absolute;bottom:${bottomPx}px;left:0;right:0;border-top:1px dashed #D4DDD8;pointer-events:none"></div>`;
    }).join('');

    const durBarsHtml = DURATIONS.map(d => {
      const barH = Math.max(Math.round((d.days / MAX_DAYS) * CHART_H), 3);
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="font-size:11px;font-weight:500;color:var(--color-text)">${d.days}d</div>
        <div style="width:72%;border-radius:4px 4px 0 0;background:#94C5A8;height:${barH}px"></div>
      </div>`;
    }).join('');

    const durXLabels = DURATIONS.map(d =>
      `<div style="flex:1;font-size:10px;color:var(--color-text-muted);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.label}</div>`
    ).join('');

    /* ── Company Progress (compact) ── */
    const selectedCo = this._analyticsSelectedCompany;

    const companyHtml = companies.map(c => {
      const compUsers   = users.filter(u => u.companyId === c.id);
      const activeCount = compUsers.filter(u => u.onboardingStatus === 'active').length;
      const coTotal     = compUsers.length;
      const branches    = State.getBranchesByCompany(c.id);
      const ratio       = coTotal > 0 ? activeCount / coTotal : 0;
      const isExpanded  = selectedCo === c.id;
      const stuckUsers  = compUsers.filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus));

      const userListHtml = isExpanded ? `
        <div class="analytics-user-list">
          ${stuckUsers.length ? stuckUsers.map(u => `
            <div class="analytics-user-row">
              <div class="avatar avatar-sm" style="background:${avatarColor(u.role)};flex-shrink:0">${Display.initials(u)}</div>
              <div class="analytics-user-info">
                <div class="analytics-user-name">${Display.fullName(u)}</div>
                <div class="analytics-user-email">${u.email}</div>
              </div>
              <span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}" style="flex-shrink:0">
                <span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}
              </span>
              <div class="analytics-user-actions">
                <button class="analytics-action-btn" onclick="event.stopPropagation();ProfileView.open('${u.id}')">View</button>
                <button class="analytics-action-btn" id="nudge-btn-${u.id}" onclick="event.stopPropagation();DashboardView.nudgeUser('${u.id}')">Nudge</button>
                <button class="analytics-action-btn analytics-action-btn-primary" onclick="event.stopPropagation();DashboardView.advanceUserFromAnalytics('${u.id}')">Advance ›</button>
              </div>
            </div>`).join('') : `
            <div style="padding:6px 4px;font-size:11px;color:var(--color-text-muted)">✓ All users active.</div>`}
        </div>` : '';

      return `
        <div class="co-prog-row${isExpanded ? ' expanded' : ''}" onclick="DashboardView.selectAnalyticsCompany('${c.id}')">
          <div class="co-prog-main">
            <div style="flex:1;min-width:0">
              <div class="co-prog-name">${c.name}</div>
              <div class="co-prog-meta">${coTotal} users · ${branches.length} branches</div>
            </div>
            <div class="co-prog-bar-bg">
              <div class="co-prog-bar-fill" style="width:${ratio * 100}%"></div>
            </div>
            <span class="co-prog-stat">${activeCount}/${coTotal}</span>
            <span class="co-expand-chevron">${isExpanded ? '▾' : '▸'}</span>
          </div>
          ${userListHtml}
        </div>`;
    }).join('');

    return `
      <div class="analytics-band">
        <div class="analytics-band-body">
          <div class="analytics-col">
            <div class="analytics-col-title">Funnel</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <div style="display:flex;align-items:flex-end;gap:8px;height:${CHART_H}px">
                ${funnelBarsHtml}
              </div>
              <div style="display:flex;gap:8px">${funnelXLabels}</div>
            </div>
          </div>
          <div class="analytics-col-divider"></div>
          <div class="analytics-col">
            <div class="analytics-col-title">Avg. Stage Duration</div>
            <div style="display:flex;gap:8px;align-items:flex-start">
              <div style="display:flex;flex-direction:column;justify-content:space-between;height:${CHART_H}px;text-align:right;flex-shrink:0;padding-bottom:1px">
                ${GRID_VALS.map(v => `<div style="font-size:10px;color:var(--color-text-muted);line-height:1">${v}d</div>`).join('')}
              </div>
              <div style="flex:1;display:flex;flex-direction:column;gap:8px">
                <div style="position:relative;height:${CHART_H}px">
                  ${gridLinesHtml}
                  <div style="position:absolute;inset:0;display:flex;align-items:flex-end;gap:8px;padding:0 1px">
                    ${durBarsHtml}
                  </div>
                </div>
                <div style="display:flex;gap:8px">${durXLabels}</div>
              </div>
            </div>
          </div>
          <div class="analytics-col-divider"></div>
          <div class="analytics-col">
            <div class="analytics-col-title">Company Progress</div>
            ${companies.length ? companyHtml : '<div style="font-size:11px;color:var(--color-text-muted)">No companies.</div>'}
          </div>
        </div>
      </div>`;
  },

  render() {
    const role = State.getRole();
    switch (role) {
      case 'sys_admin':
      case 'operator':   return this.renderAdminDashboard();
      case 'prog_admin': return this.renderProgAdminDashboard();
      case 'lo':
      case 'lp':         return this.renderOriginatorDashboard();
      case 'investor':   return this.renderInvestorDashboard();
      default:           return '<div class="page-body">Unknown role.</div>';
    }
  },

  /* ---- Filter helpers ---- */
  addFilter(type, value) {
    if (!value) return;
    if (!this._filters.find(f => f.type === type && f.value === value))
      this._filters.push({ type, value });
    App.renderView('/dashboard');
  },
  removeFilter(idx) { this._filters.splice(idx, 1); App.renderView('/dashboard'); },
  clearFilters()    { this._filters = []; this._searchQuery = ''; App.renderView('/dashboard'); },
  setSearch(val)    { this._searchQuery = val; App.renderView('/dashboard'); },

  _applyFilters(users) {
    let list = this._filters.reduce((acc, f) => {
      if (f.type === 'company') return acc.filter(u => u.companyId === f.value);
      if (f.type === 'status')  return acc.filter(u => u.onboardingStatus === f.value);
      if (f.type === 'role')    return acc.filter(u => u.role === f.value);
      if (f.type === 'section') {
        if (f.value === 'origination') return acc.filter(u => u.companyId && u.role !== 'investor');
        if (f.value === 'investor')    return acc.filter(u => u.role === 'investor');
        if (f.value === 'platform')    return acc.filter(u => !u.companyId && u.role !== 'investor');
      }
      return acc;
    }, users);
    if (this._searchQuery) {
      const q = this._searchQuery.toLowerCase();
      list = list.filter(u => {
        const name = ((u.firstName || '') + ' ' + (u.lastName || '')).toLowerCase();
        return name.includes(q) || (u.email || '').toLowerCase().includes(q);
      });
    }
    return list;
  },

  _getUserSection(u) {
    if (u.role === 'investor') return { label: 'Investors & Funds', cls: 'section-tag-investor', route: '/investors' };
    if (u.companyId) {
      const co = State.getCompany(u.companyId);
      return { label: co ? co.name : 'Origination', cls: 'section-tag-origination', route: '/origination-companies' };
    }
    return { label: 'Platform Operations', cls: 'section-tag-platform', route: '/platform' };
  },

  toggleFilterPopover(type, e) {
    e.stopPropagation();
    const id = 'dash-popover-' + type;
    const el = document.getElementById(id);
    if (!el) return;
    const open = el.style.display !== 'none';
    document.querySelectorAll('.filter-popover').forEach(p => p.style.display = 'none');
    if (!open) {
      el.style.display = 'block';
      setTimeout(() => document.addEventListener('click', () => { el.style.display = 'none'; }, { once: true }), 0);
    }
  },

  toggleFiltersMenu(e) {
    e.stopPropagation();
    const el = document.getElementById('dash-filters-menu');
    if (!el) return;
    const open = el.style.display !== 'none';
    if (!open) {
      el.style.display = 'block';
      setTimeout(() => document.addEventListener('click', () => { el.style.display = 'none'; }, { once: true }), 0);
    } else {
      el.style.display = 'none';
    }
  },

  /* ---- System Admin / Operator ---- */
  renderAdminDashboard() {
    const companies        = State.getCompanies();
    const users            = State.getUsers();
    const investorEntities = State.getInvestorEntities();
    const platformUsers    = State.getPlatformUsers();
    const pending          = users.filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus));
    const activity         = State.getActivity().filter(a => a.subjectType !== 'loan');
    const filtered         = this._applyFilters(pending);
    const reqAttention     = users.filter(u => ['verification_failed','suspended'].includes(u.onboardingStatus));
    const activeUsers      = users.filter(u => u.onboardingStatus === 'active');

    const pendingRows = filtered.slice(0, 10).map(u => {
      const sec = this._getUserSection(u);
      return `
        <tr class="clickable" onclick="ProfileView.open('${u.id}')">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
              <div>
                <div class="cell-primary">${Display.fullName(u)}</div>
                <div class="cell-secondary">${u.email}</div>
              </div>
            </div>
          </td>
          <td><span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
          <td class="text-secondary">${sec.label}</td>
          <td><span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
        </tr>`;
    }).join('');

    const activityHtml = activity.slice(0, 8).map(a => {
      const actor = State.getUser(a.userId);
      return `
        <div class="activity-item">
          <div class="activity-avatar" style="background:${actor ? avatarColor(actor.role) : 'var(--color-primary)'}">${actor ? Display.initials(actor) : 'SY'}</div>
          <div class="activity-content">
            <strong>${actor ? Display.fullName(actor) : 'System'}</strong> ${a.action} <strong>${a.subject}</strong>
          </div>
          <div class="activity-time">${a.time}</div>
        </div>`;
    }).join('');

    const chipHtml = this._filters.map((f, i) => {
      let label = '';
      if (f.type === 'company') label = `Org: ${companies.find(c=>c.id===f.value)?.name||f.value}`;
      if (f.type === 'status')  label = `Status: ${Display.onboardingStatusLabel(f.value)}`;
      if (f.type === 'role')    label = `Role: ${Display.roleName(f.value)}`;
      if (f.type === 'section') label = `Entity: ${f.value === 'origination' ? 'Origination' : f.value === 'investor' ? 'Investors' : 'Platform'}`;
      return `<span class="filter-chip">${label}<button class="filter-chip-remove" onclick="DashboardView.removeFilter(${i})">×</button></span>`;
    }).join('');

    /* Entities overview rows */
    const entityRows = [
      ...companies.map(c => `
        <tr class="clickable" onclick="Router.navigate('/origination-companies/${c.id}')">
          <td><div class="cell-primary">${c.name}</div><div class="cell-secondary">${c.emailDomain}</div></td>
          <td><span class="section-tag section-tag-origination">Origination</span></td>
          <td>${c.userCount}</td>
          <td><span class="status-pill ${c.status==='active'?'badge-active':'badge-pending'}"><span class="status-dot"></span>${c.status==='active'?'Active':'Pending'}</span></td>
        </tr>`),
      ...investorEntities.map(e => `
        <tr class="clickable" onclick="Router.navigate('/investors')">
          <td><div class="cell-primary">${e.name}</div><div class="cell-secondary">${e.type}</div></td>
          <td><span class="section-tag section-tag-investor">Investor</span></td>
          <td>—</td>
          <td><span class="status-pill ${e.status==='active'?'badge-active':'badge-pending'}"><span class="status-dot"></span>${e.status==='active'?'Active':'Pending'}</span></td>
        </tr>`),
      `<tr class="clickable" onclick="Router.navigate('/platform')">
        <td><div class="cell-primary">Platform Operations</div><div class="cell-secondary">Internal team</div></td>
        <td><span class="section-tag section-tag-platform">Platform</span></td>
        <td>${platformUsers.length}</td>
        <td><span class="status-pill badge-active"><span class="status-dot"></span>Active</span></td>
      </tr>`,
    ].join('');

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Onboarding Dashboard</div>
            <div class="page-subtitle">Platform overview · ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</div>
          </div>
        </div>
      </div>

      <div class="page-body">
        <div class="dash-insight-card">
          <!-- Stat row -->
          <div class="stat-row">
            <div class="stat-item">
              <div class="stat-label">Total Users</div>
              <div class="stat-value">${users.length}</div>
              <div class="stat-desc">${activeUsers.length} active</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-label">Pending Onboarding</div>
              <div class="stat-value">${pending.length}</div>
              <div class="stat-desc">awaiting completion</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-label">Requiring Attention</div>
              <div class="stat-value" style="${reqAttention.length > 0 ? 'color:var(--color-danger)' : ''}">${reqAttention.length}</div>
              <div class="stat-desc">failed KYC or suspended</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-label">Entities</div>
              <div class="stat-value">${companies.length + investorEntities.length}</div>
              <div class="stat-desc">${companies.length} origination · ${investorEntities.length} investor</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-label">Investor Entities</div>
              <div class="stat-value">${investorEntities.length}</div>
              <div class="stat-desc">${investorEntities.filter(e=>e.status==='active').length} active</div>
            </div>
          </div>
          ${this._renderAnalyticsSection(users, companies)}
        </div>

        <div style="display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start">
          <!-- Pending onboarding -->
          <div class="table-container">
            <div class="table-toolbar" style="flex-wrap:wrap;gap:8px">
              <div class="table-toolbar-title">Pending Onboarding</div>
              <div style="display:flex;align-items:center;gap:8px;margin-left:auto;flex-wrap:wrap">
                ${chipHtml}
                ${this._filters.length || this._searchQuery ? `<button class="btn btn-ghost btn-sm" onclick="DashboardView.clearFilters()">Clear</button>` : ''}
              </div>
            </div>
            <div class="filter-toolbar">
              <input class="filter-search" placeholder="Search by name or email…" value="${this._searchQuery}" oninput="DashboardView.setSearch(this.value)" />
              <div style="position:relative">
                <button class="filter-menu-btn" onclick="DashboardView.toggleFiltersMenu(event)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                  Filters
                </button>
                <div class="filter-menu-panel" id="dash-filters-menu" style="display:none">
                  <div class="filter-menu-section">
                    <div class="filter-menu-label">Section</div>
                    <div class="filter-menu-item" onclick="DashboardView.addFilter('section','origination')">Origination</div>
                    <div class="filter-menu-item" onclick="DashboardView.addFilter('section','investor')">Investors & Funds</div>
                    <div class="filter-menu-item" onclick="DashboardView.addFilter('section','platform')">Platform Operations</div>
                  </div>
                  <div class="filter-menu-section">
                    <div class="filter-menu-label">Company</div>
                    ${companies.map(c=>`<div class="filter-menu-item" onclick="DashboardView.addFilter('company','${c.id}')">${c.name}</div>`).join('')}
                  </div>
                  <div class="filter-menu-section">
                    <div class="filter-menu-label">Status</div>
                    ${['invited','email_verified','2fa_complete','verification_pending'].map(s=>`<div class="filter-menu-item" onclick="DashboardView.addFilter('status','${s}')">${Display.onboardingStatusLabel(s)}</div>`).join('')}
                  </div>
                  <div class="filter-menu-section">
                    <div class="filter-menu-label">Role</div>
                    ${['sys_admin','operator','prog_admin','lo','lp','investor'].map(r=>`<div class="filter-menu-item" onclick="DashboardView.addFilter('role','${r}')">${Display.roleName(r)}</div>`).join('')}
                  </div>
                </div>
              </div>
            </div>
            ${filtered.length ? `
              <table>
                <thead><tr><th>User</th><th>Role</th><th>Entity</th><th>Status</th></tr></thead>
                <tbody>${pendingRows}</tbody>
              </table>
              <div class="table-footer">
                <span class="table-count">${filtered.length} user${filtered.length!==1?'s':''} pending</span>
              </div>` : `
              <div class="table-empty">
                <p>${this._filters.length || this._searchQuery ? 'No users match the current filters.' : 'All users are fully onboarded!'}</p>
                ${this._filters.length || this._searchQuery ? `<button class="btn btn-secondary btn-sm" style="margin-top:10px" onclick="DashboardView.clearFilters()">Clear filters</button>` : ''}
              </div>`}
          </div>

          <!-- Activity feed -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Recent Activity</div>
                <div class="card-subtitle">Admin events</div>
              </div>
            </div>
            <div class="activity-feed">${activityHtml || '<div style="padding:16px;color:var(--color-text-muted);font-size:13px">No recent admin activity.</div>'}</div>
          </div>
        </div>

        <!-- Entities overview -->
        <div style="margin-top:20px" class="table-container">
          <div class="table-toolbar">
            <div class="table-toolbar-title">Entities Overview</div>
          </div>
          <table>
            <thead><tr><th>Entity</th><th>Type</th><th>Users</th><th>Status</th></tr></thead>
            <tbody>${entityRows}</tbody>
          </table>
          <div class="table-footer"><span class="table-count">${companies.length + investorEntities.length + 1} entities</span></div>
        </div>
      </div>`;
  },

  /* ---- Program Admin ---- */
  renderProgAdminDashboard() {
    const cu      = State.getCurrentUser();
    const company = State.getCompany(cu?.companyId);
    const branches = State.getBranchesByCompany(cu?.companyId);
    const users   = State.getUsersByCompany(cu?.companyId);
    const loans   = State.getLoans().filter(l => l.companyId === cu?.companyId);
    const pending = users.filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus));

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Dashboard</div>
            <div class="page-subtitle">${company ? company.name : 'My Company'}</div>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-primary btn-sm" onclick="UsersView.openInviteModal()">Invite User</button>
          </div>
        </div>
      </div>

      <div class="page-body">
        <div class="stat-row">
          <div class="stat-item">
            <div class="stat-label">Branches</div>
            <div class="stat-value">${branches.length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Team Members</div>
            <div class="stat-value">${users.length}</div>
            <div class="stat-desc">${pending.length} pending onboarding</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Active Loans</div>
            <div class="stat-value">${loans.filter(l=>!['prequalification_expired'].includes(l.status)).length}</div>
            <div class="stat-desc">${loans.filter(l=>l.status==='completed').length} completed</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div class="table-container">
            <div class="table-toolbar">
              <div class="table-toolbar-title">Team Members</div>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/users')">View all</button>
            </div>
            <table>
              <thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Status</th></tr></thead>
              <tbody>
                ${users.slice(0, 6).map(u => {
                  const br = State.getBranch(u.branchId);
                  return `
                    <tr class="clickable" onclick="ProfileView.open('${u.id}')">
                      <td>
                        <div style="display:flex;align-items:center;gap:8px">
                          <div class="avatar avatar-sm">${Display.initials(u)}</div>
                          <div class="cell-primary">${Display.fullName(u)}</div>
                        </div>
                      </td>
                      <td><span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
                      <td class="text-secondary">${br ? br.name : '—'}</td>
                      <td><span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="table-container">
            <div class="table-toolbar">
              <div class="table-toolbar-title">Branches</div>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/branches')">View all</button>
            </div>
            <table>
              <thead><tr><th>Branch</th><th>State</th><th>Users</th><th>Status</th></tr></thead>
              <tbody>
                ${branches.map(b=>`
                  <tr class="clickable" onclick="BranchesView.openDetail('${b.id}')">
                    <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address}</div></td>
                    <td>${b.state}</td>
                    <td>${b.userCount}</td>
                    <td><span class="status-pill ${b.status==='active'?'badge-active':'badge-pending'}"><span class="status-dot"></span>${b.status==='active'?'Active':'Pending'}</span></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  /* ---- LO / LP ---- */
  renderOriginatorDashboard() {
    const user    = State.getCurrentUser();
    const loans   = State.getLoansByLO(user?.id) || [];
    const branch  = State.getBranch(user?.branchId);
    const company = State.getCompany(user?.companyId);
    const isActive = user?.onboardingStatus === 'active';

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Dashboard</div>
            <div class="page-subtitle">${branch ? branch.name : ''}${company ? ' · ' + company.name : ''}</div>
          </div>
          ${isActive ? `<div class="page-header-actions"><button class="btn btn-primary btn-sm" onclick="Router.navigate('/originations')">New Application</button></div>` : ''}
        </div>
      </div>

      <div class="page-body">
        ${!isActive ? `
          <div class="alert alert-warning">
            <span class="alert-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1L1 14h14L8 1z"/><path d="M8 6v4M8 11v1"/></svg></span>
            <div><strong>Account setup incomplete</strong> — Your account is <strong>${Display.onboardingStatusLabel(user?.onboardingStatus)}</strong>. Complete onboarding to activate.
            <br><button class="btn btn-sm btn-secondary" style="margin-top:8px" onclick="Router.navigate('/onboarding')">Continue Setup</button></div>
          </div>` : ''}

        <div class="stat-row">
          ${[
            { label: 'In Progress', value: loans.filter(l=>['prequalification_in_progress','initial_application_submitted','pending_origination_creation'].includes(l.status)).length, desc: 'active applications' },
            { label: 'In Review',   value: loans.filter(l=>['sent_to_docutech','origination_created','application_documents_approved'].includes(l.status)).length, desc: 'under review' },
            { label: 'Completed',   value: loans.filter(l=>l.status==='completed').length, desc: 'closed deals' },
            { label: 'Total',       value: loans.length, desc: 'all time' },
          ].map(s=>`
            <div class="stat-item">
              <div class="stat-label">${s.label}</div>
              <div class="stat-value">${s.value}</div>
              <div class="stat-desc">${s.desc}</div>
            </div>`).join('')}
        </div>

        <div class="table-container">
          <div class="table-toolbar">
            <div class="table-toolbar-title">Recent Applications</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/originations')">View all</button>
          </div>
          ${loans.length ? `
            <table>
              <thead><tr><th>Application</th><th>Borrower</th><th>Amount</th><th>Program</th><th>Status</th><th>Submitted</th></tr></thead>
              <tbody>
                ${loans.map(l=>`
                  <tr>
                    <td><span class="text-secondary" style="font-size:12px;font-weight:600">${l.id}</span></td>
                    <td><div class="cell-primary">${l.borrowerName}</div><div class="cell-secondary">${l.address}</div></td>
                    <td style="font-weight:600">${Display.currency(l.amount)}</td>
                    <td><span class="tag">${l.program}</span></td>
                    <td><span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span></td>
                    <td class="text-secondary">${Display.date(l.submittedAt)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>` : `
            <div class="table-empty"><p>No applications yet.</p></div>`}
        </div>
      </div>`;
  },

  /* ---- Investor ---- */
  renderInvestorDashboard() {
    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Investor Dashboard</div>
          </div>
        </div>
      </div>

      <div class="page-body">
        <div class="alert alert-info">
          <span class="alert-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="7"/><path d="M8 7v5M8 5v1"/></svg></span>
          <div>Investor portfolio features are in development. Your KYC verification is <strong>complete</strong> via SecuritizeID.</div>
        </div>

        <div class="stat-row">
          <div class="stat-item">
            <div class="stat-label">Portfolio Value</div>
            <div class="stat-value">$1.24M</div>
            <div class="stat-desc">Total Dream Fund investments</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Active Loans</div>
            <div class="stat-value">7</div>
            <div class="stat-desc">Across 2 markets</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Avg. LTV</div>
            <div class="stat-value">68%</div>
            <div class="stat-desc">Portfolio average</div>
          </div>
        </div>

        <div class="table-container" style="margin-top:20px">
          <div class="table-toolbar">
            <div class="table-toolbar-title">Portfolio Positions</div>
            <span class="badge badge-active">All Active</span>
          </div>
          <table>
            <thead><tr><th>Property</th><th>Market</th><th>Loan Amount</th><th>LTV</th><th>Program</th><th>Status</th></tr></thead>
            <tbody>
              ${[
                { address: '3407 Wisconsin Ave NW, Washington, DC', market: 'Washington DC', amount: 195000, ltv: 71, program: 'DC Dream Fund' },
                { address: '1244 U St NW, Washington, DC',          market: 'Washington DC', amount: 220000, ltv: 64, program: 'DC Dream Fund' },
                { address: '1025 Bardstown Rd, Louisville, KY',     market: 'Louisville',    amount: 160000, ltv: 67, program: 'Kentucky Dream Fund' },
                { address: '633 E Main St, Lexington, KY',          market: 'Lexington',     amount: 145000, ltv: 72, program: 'Kentucky Dream Fund' },
              ].map(p=>`
                <tr>
                  <td><div class="cell-primary" style="font-size:12px">${p.address}</div></td>
                  <td>${p.market}</td>
                  <td style="font-weight:600">${Display.currency(p.amount)}</td>
                  <td>${p.ltv}%</td>
                  <td><span class="tag">${p.program}</span></td>
                  <td><span class="badge badge-active">Active</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },
};
