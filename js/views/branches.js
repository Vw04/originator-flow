/* ============================================================
   HOMIUM ORIGINATOR FLOW — Branches View
   ============================================================ */

const BranchesView = {
  _filter: { search: '', companyId: '', state: '', program: '', status: '' },
  _sort: { col: null, dir: 'asc' },
  _detailId: null,
  _branchTab: 'details',  // 'details' | 'users' | 'permissions' | 'markets' | 'programs'

  _scope: null,

  setSort(col) {
    if (this._sort.col === col) {
      this._sort.dir = this._sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sort.col = col;
      this._sort.dir = 'asc';
    }
    this._rerender();
  },

  _rerender() {
    if (this._scope) {
      App.renderView(Router.getCurrentPath());
    } else {
      App.renderView('/branches');
    }
  },

  /* scope: optional { companyId } | { acrossAll: true } for section-scoped rendering */
  render(scope) {
    this._scope = scope || null;
    const role        = State.getRole();
    const currentUser = State.getCurrentUser();
    const canEdit     = State.can('editAny') || State.can('manageCompany');

    let allBranches = scope?.companyId
      ? State.getBranchesByCompany(scope.companyId)
      : State.getBranches();
    let companies   = State.getCompanies();

    // prog_admin auto-scopes even when acrossAll is requested
    if (scope?.acrossAll && role === 'prog_admin' && currentUser?.companyId) {
      allBranches = allBranches.filter(b => b.companyId === currentUser.companyId);
      companies   = companies.filter(c => c.id === currentUser.companyId);
    }

    // Legacy scope for prog_admin (when no explicit scope)
    if (!scope && role === 'prog_admin' && currentUser?.companyId) {
      allBranches = allBranches.filter(b => b.companyId === currentUser.companyId);
      companies   = companies.filter(c => c.id === currentUser.companyId);
    }

    const f = this._filter;
    let filtered = allBranches;
    if (f.search) {
      const q = f.search.toLowerCase();
      filtered = filtered.filter(b => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q) || b.state.toLowerCase().includes(q));
    }
    if (f.companyId) filtered = filtered.filter(b => b.companyId === f.companyId);
    if (f.state)     filtered = filtered.filter(b => b.state === f.state);
    if (f.status)    filtered = filtered.filter(b => b.status === f.status);

    // Spec §9 #14: branches are flat (no nested sub-branches). Render as a
    // flat ordered list — no parent/child indentation.
    const ordered = filtered.map(b => ({ branch: b, isChild: false }));

    const s = this._sort;
    if (s.col) {
      const mul = s.dir === 'asc' ? 1 : -1;
      ordered.sort((a, b) => {
        if (s.col === 'name')   return mul * a.branch.name.localeCompare(b.branch.name);
        if (s.col === 'status') return mul * a.branch.status.localeCompare(b.branch.status);
        return 0;
      });
    }
    const thClass = (col) => `sortable${s.col === col ? ' sort-' + s.dir : ''}`;

    const rows = ordered.map(({ branch: b }) => {
      const co     = State.getCompany(b.companyId);
      const mgr    = b.managingLO ? State.getUser(b.managingLO) : null;
      const users  = State.getUsersByBranch(b.id);
      // Round 2: programs available at this branch are derived live —
      // OC's enabled programs whose allowedMarkets include the branch's state.
      const branchMarket = State.getMarkets().find(m => m.code === b.state);
      const ocPrograms = (() => {
        if (!branchMarket) return [];
        const ocLpms = State.getOcEnablement(b.companyId);
        const programIds = [...new Set(ocLpms.map(id => State.getLPM(id)).filter(l => l && l.marketId === branchMarket.id).map(l => l.programId))];
        return programIds.map(pid => State.getLoanProgram(pid)).filter(Boolean);
      })();
      const programChips = ocPrograms.length
        ? ocPrograms.map(p => `<span class="tag" style="margin-right:4px">${p.name}</span>`).join('')
        : '<span class="text-muted" style="font-size:11px">Not enabled</span>';
      return `
        <tr class="clickable" onclick="Router.navigate('/branches/${b.id}')">
          <td>
            <div>
              <div class="cell-primary">${b.name}</div>
              <div class="cell-secondary">${b.address1 || b.address || ''}</div>
            </div>
          </td>
          ${(role !== 'prog_admin' && !scope?.companyId) ? `<td class="text-secondary">${co ? co.name : '—'}</td>` : ''}
          <td><span class="tag">${b.branchType || 'Branch'}</span></td>
          <td>${b.state}</td>
          <td>${mgr ? Display.fullName(mgr) : '<span class="text-muted">N/A</span>'}</td>
          <td>${users.length}</td>
          <td>${programChips}</td>
          <td style="font-size:11px;color:var(--color-text-muted)">${b.lastNmlsSync ? Display.relativeTime(b.lastNmlsSync) : '—'}</td>
          <td><span class="status-pill ${b.status === 'active' ? 'badge-active' : 'badge-pending'}"><span class="status-dot"></span>${b.status === 'active' ? 'Active' : 'Setup incomplete'}</span></td>
        </tr>`;
    }).join('');

    const hasFilters = Object.values(f).some(v => v);

    const header = scope ? '' : `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Branches</div>
            <div class="page-subtitle">${filtered.length} branch${filtered.length !== 1 ? 'es' : ''}</div>
          </div>
          ${canEdit ? `
            <div class="page-header-actions">
              <button class="btn btn-primary btn-sm" onclick="BranchesView.openAddPage()">+ Add Branch</button>
            </div>` : ''}
        </div>
      </div>`;

    return `
      ${header}
      ${scope ? '' : '<div class="page-body">'}
        <div class="table-container">
          <div class="filter-toolbar">
            <input class="filter-search" placeholder="Search branches…"
              value="${f.search}" oninput="BranchesView.setFilter('search', this.value)" />
            <div style="position:relative">
              <button class="filter-menu-btn" onclick="BranchesView.toggleFiltersMenu(event)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                Filters
              </button>
              <div class="filter-menu-panel" id="branches-filters-menu" style="display:none">
                ${(role !== 'prog_admin' && !scope?.companyId) ? `<div class="filter-menu-section">
                  <div class="filter-menu-label">Company</div>
                  ${companies.map(c=>`<div class="filter-menu-item${f.companyId===c.id?' active':''}" onclick="BranchesView.setFilter('companyId','${c.id}')">${c.name}</div>`).join('')}
                </div>` : ''}
                <div class="filter-menu-section">
                  <div class="filter-menu-label">State</div>
                  ${[...new Set(State.getBranches().map(b => b.state))].sort().map(s => `<div class="filter-menu-item${f.state===s?' active':''}" onclick="BranchesView.setFilter('state','${s}')">${s}</div>`).join('')}
                </div>
                <div class="filter-menu-section">
                  <div class="filter-menu-label">Status</div>
                  <div class="filter-menu-item${f.status==='active'?' active':''}" onclick="BranchesView.setFilter('status','active')">Active</div>
                  <div class="filter-menu-item${f.status==='pending'?' active':''}" onclick="BranchesView.setFilter('status','pending')">Pending</div>
                </div>
                ${hasFilters ? `<div class="filter-menu-section" style="border-top:1px solid var(--color-border);padding-top:8px"><div class="filter-menu-item" onclick="BranchesView.clearFilters()" style="color:var(--color-danger)">Clear All Filters</div></div>` : ''}
              </div>
            </div>
            ${scope && canEdit ? `<button class="btn btn-primary btn-sm" onclick="BranchesView.openAddPage('${scope?.companyId || ''}')" style="margin-left:auto">+ Add Branch</button>` : ''}
          </div>

          ${ordered.length ? `
            <table>
              <thead><tr>
                <th class="${thClass('name')}" onclick="BranchesView.setSort('name')" style="min-width:340px">Branch</th>
                ${(role !== 'prog_admin' && !scope?.companyId) ? '<th style="min-width:200px">Company</th>' : ''}
                <th style="width:100px">Type</th>
                <th style="width:80px">State</th>
                <th style="min-width:140px">Managing LO</th>
                <th style="width:80px">Users</th>
                <th style="width:200px">Programs</th>
                <th style="width:130px">NMLS Sync</th>
                <th class="${thClass('status')}" onclick="BranchesView.setSort('status')" style="width:110px">Status</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="table-footer">
              <span class="table-count">${filtered.length} branch${filtered.length !== 1 ? 'es' : ''}</span>
            </div>` : `
            <div class="table-empty">
              <div class="table-empty-icon"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><path d="M20 4C14.48 4 10 8.48 10 14c0 9 10 22 10 22s10-13 10-22c0-5.52-4.48-10-10-10z"/><circle cx="20" cy="14" r="3.5"/></svg></div>
              <p>No branches found.</p>
              ${hasFilters ? `<button class="btn btn-secondary btn-sm" onclick="BranchesView.clearFilters()">Clear filters</button>` : ''}
            </div>`}
        </div>
      ${scope ? '' : '</div>'}

      <div id="branch-panel-container"></div>
      <div id="branch-modal-container"></div>`;
  },

  setFilter(key, value) {
    this._filter[key] = value;
    BranchesView._rerender();
  },

  clearFilters() {
    this._filter = { search: '', companyId: '', state: '', program: '', status: '' };
    BranchesView._rerender();
  },

  toggleFiltersMenu(e) {
    e.stopPropagation();
    const el = document.getElementById('branches-filters-menu');
    if (!el) return;
    const open = el.style.display !== 'none';
    if (!open) {
      el.style.display = 'block';
      setTimeout(() => document.addEventListener('click', () => { el.style.display = 'none'; }, { once: true }), 0);
    } else { el.style.display = 'none'; }
  },

  openDetail(branchId) {
    const b       = State.getBranch(branchId);
    if (!b) return;
    this._detailId = branchId;

    const co      = State.getCompany(b.companyId);
    const mgr     = b.managingLO ? State.getUser(b.managingLO) : null;
    const users   = State.getUsersByBranch(b.id);
    const canEdit = State.can('editAny') || State.can('manageCompany');

    // Round 2: programs available at this branch are derived from OC
    // enablement, narrowed to the branch's state. No editable matrix —
    // the OC's Programs tab is the only place to toggle enablement.
    const branchMarket = State.getMarkets().find(m => m.code === b.state);
    const branchPrograms = (() => {
      if (!branchMarket) return [];
      const ocLpms = State.getOcEnablement(b.companyId);
      const programIds = [...new Set(ocLpms.map(id => State.getLPM(id)).filter(l => l && l.marketId === branchMarket.id).map(l => l.programId))];
      return programIds.map(pid => State.getLoanProgram(pid)).filter(Boolean);
    })();
    const programsList = branchPrograms.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${branchPrograms.map(p => `<span class="tag" style="padding:5px 10px">${p.name}</span>`).join('')}</div>`
      : `<div style="color:var(--color-text-muted);font-size:12px">Not enabled — OC has no programs available in ${b.state}.</div>`;

    const userRows = users.map(u => {
      const a = State.getBranchAssignments(u.id).find(x => x.branchId === b.id);
      const userTypeBadge = a?.userType === 'lo'
        ? '<span class="tag" style="background:#e6f4ec;color:#1f6f43">LO</span>'
        : '<span class="tag">Standard</span>';
      const bmBadge = a?.flags?.branchManager ? '<span class="tag" style="background:#fff7e6;color:#a35c00;margin-left:4px">BM</span>' : '';
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--color-border);cursor:pointer" onclick="ProfileView.open('${u.id}')">
          <div class="avatar avatar-sm" style="background:${avatarColor(u.role)};flex-shrink:0">${Display.initials(u)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:500;color:var(--color-text)">${Display.fullName(u)}</div>
            <div style="font-size:11px;color:var(--color-text-muted)">${userTypeBadge}${bmBadge}</div>
          </div>
          <span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}" style="font-size:10px"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span>
        </div>`;
    }).join('') || '<p style="font-size:13px;color:var(--color-text-muted)">No users in this branch.</p>';

    document.getElementById('branch-panel-container').innerHTML = `
      <div class="side-panel-overlay" onclick="if(event.target===this)BranchesView.closePanel()">
        <div class="side-panel">
          <div class="side-panel-header">
            <div>
              <div class="side-panel-title">${b.name}</div>
              <div class="side-panel-subtitle">${co ? co.name : '—'}${b.branchType ? ' · ' + b.branchType : ''}${b.lastNmlsSync ? ' · NMLS sync ' + Display.relativeTime(b.lastNmlsSync) : ''}</div>
            </div>
            <button class="modal-close" onclick="BranchesView.closePanel()">×</button>
          </div>
          <div class="side-panel-body">

            <div class="panel-section">
              <div class="panel-section-label">Branch Details</div>
              <div class="panel-field"><span class="panel-field-label">Address</span><span>${b.address1 ? `${b.address1}${b.suite ? ', ' + b.suite : ''}, ${b.city}, ${b.state} ${b.zip}` : (b.address || '—')}</span></div>
              <div class="panel-field"><span class="panel-field-label">Branch Type</span><span><span class="tag">${b.branchType || 'Branch'}</span></span></div>
              <div class="panel-field"><span class="panel-field-label">Status</span><span class="status-pill ${b.status==='active'?'badge-active':'badge-pending'}"><span class="status-dot"></span>${b.status==='active'?'Active':'Setup incomplete'}</span></div>
              <div class="panel-field"><span class="panel-field-label">NMLS</span><span>${b.nmlsId || '—'}</span></div>
              <div class="panel-field"><span class="panel-field-label">Phone</span><span>${b.contactPhone || '—'}</span></div>
              <div class="panel-field"><span class="panel-field-label">Managing LO</span><span>${mgr ? Display.fullName(mgr) : '<span class="text-muted">N/A</span>'}</span></div>
              <div class="panel-field"><span class="panel-field-label">Start Date</span><span>${b.startDate ? Display.date(b.startDate) : '—'}</span></div>
            </div>

            <div class="panel-section">
              <div class="panel-section-label">Programs Available <span style="color:var(--color-text-muted);font-weight:400">(inherited from OC, narrowed to ${b.state})</span></div>
              ${programsList}
            </div>

            <div class="panel-section">
              <div class="panel-section-label">Users (${users.length})</div>
              ${userRows}
            </div>

          </div>
          ${canEdit ? `
          <div class="side-panel-footer">
            <button class="btn btn-secondary btn-sm" onclick="BranchesView.closePanel()">Close</button>
            <button class="btn btn-primary btn-sm" onclick="BranchesView.openEditModal('${b.id}')">Edit Branch</button>
          </div>` : `
          <div class="side-panel-footer">
            <button class="btn btn-secondary btn-sm" onclick="BranchesView.closePanel()">Close</button>
          </div>`}
        </div>
      </div>`;
  },

  closePanel() {
    const pc = document.getElementById('branch-panel-container');
    if (pc) pc.innerHTML = '';
    this._detailId = null;
  },

  /* ============================================================
     BRANCH DETAIL PAGE (Round 3)
     Tabs: Details / Users / Permissions / Market Enablements / Eligible Programs
     ============================================================ */
  renderDetailPage(branchId, opts) {
    opts = opts || {};
    const editing = !!opts.edit;
    const b = State.getBranch(branchId);
    if (!b) return '<div class="page-body"><p>Branch not found.</p></div>';
    const co = State.getCompany(b.companyId);
    const role = State.getRole();
    const canEdit = State.can('editAny') || State.can('manageCompany');
    const showBack = role !== 'prog_admin';

    const tabs = [
      { key: 'details',     label: 'Details' },
      { key: 'users',       label: 'Users' },
      { key: 'permissions', label: 'Permissions' },
      { key: 'markets',     label: 'Market Enablements' },
      { key: 'programs',    label: 'Eligible Programs' },
    ];
    if (!tabs.find(t => t.key === this._branchTab)) this._branchTab = 'details';
    if (editing) this._branchTab = 'details';

    const tabsHtml = tabs.map(t =>
      `<div class="section-tab ${t.key === this._branchTab ? 'active' : ''}"
            onclick="BranchesView.switchBranchTab('${t.key}')">${t.label}</div>`
    ).join('');

    let content;
    if (editing) {
      content = this._renderBranchDetails(b, co, canEdit, true);
    } else {
      switch (this._branchTab) {
        case 'details':     content = this._renderBranchDetails(b, co, canEdit, false); break;
        case 'users':       content = this._renderBranchUsers(b, canEdit); break;
        case 'permissions': content = this._renderBranchPermissions(b, canEdit); break;
        case 'markets':     content = this._renderBranchMarkets(b, canEdit); break;
        case 'programs':    content = this._renderBranchPrograms(b, canEdit); break;
        default:            content = this._renderBranchDetails(b, co, canEdit, false);
      }
    }

    const users = State.getUsersByBranch(b.id);
    const mgr = b.managingLO ? State.getUser(b.managingLO) : null;
    const tabsCounts = {
      details: null,
      users: users.length,
      permissions: null,
      markets: null,
      programs: null,
    };
    const tabsHtmlWithCounts = tabs.map(t =>
      `<div class="section-tab ${t.key === this._branchTab ? 'active' : ''}"
            onclick="BranchesView.switchBranchTab('${t.key}')">${t.label}${tabsCounts[t.key] != null ? ` <span style="opacity:0.55;font-weight:400">(${tabsCounts[t.key]})</span>` : ''}</div>`
    ).join('');

    const backLink = showBack
      ? `<div class="back-bar">
           <button class="back-link" onclick="Router.navigate('/origination-companies/${b.companyId}')">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
             Back to Branches
           </button>
         </div>`
      : '';

    const addr = b.address1 ? `${b.address1}${b.suite ? ', ' + b.suite : ''}, ${b.city || ''} ${b.state || ''} ${b.zip || ''}`.trim() : (b.address || '—');
    const meta = [
      { label: 'NMLS #', value: b.nmlsId || '—' },
      { label: 'State', value: b.state || '—' },
      { label: 'Manager', value: mgr ? Display.fullName(mgr) : '—' },
      { label: 'Address', value: addr },
      { label: 'Phone', value: b.contactPhone || '—' },
      { label: 'Users', value: users.length },
    ];
    const metaHtml = meta.map((m, i) =>
      `<div><span class="entity-meta-label">${m.label}</span> <span class="entity-meta-value">${m.value}</span></div>${i < meta.length - 1 ? '<span class="entity-meta-sep">|</span>' : ''}`
    ).join('');

    const statusPill = b.status === 'active'
      ? `<span class="entity-status-pill">Active</span>`
      : `<span class="entity-status-pill" style="color:var(--color-warning)">Setup incomplete</span>`;

    return `
      ${backLink}
      <div class="entity-header">
        <div class="entity-header-row">
          <div>
            <h1 class="entity-header-title">${b.name}</h1>
            <div class="entity-header-subtitle">${co ? co.name : 'Branch'}</div>
          </div>
          <div class="entity-header-actions">
            ${canEdit && !editing ? `<button class="btn btn-secondary btn-sm" onclick="BranchesView.enterEditMode('${b.id}')">Edit</button>` : ''}
          </div>
        </div>
        <div class="entity-meta-row">
          ${metaHtml}
          ${statusPill}
        </div>
      </div>
      ${editing ? '' : `<div class="section-tabs">${tabsHtmlWithCounts}</div>`}
      <div class="page-body"${editing ? ' oninput="BranchesView.markDirty()"' : ''}>${content}</div>
      ${editing ? `
        <div class="inst-footer-bar">
          <span class="dirty-indicator">
            <span class="dot"></span>
            <span class="dirty-label">No changes</span>
          </span>
          <button class="btn btn-secondary btn-sm" onclick="BranchesView.cancelEdit('${b.id}')">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="BranchesView.saveEdit('${b.id}')">Save changes</button>
        </div>` : ''}
      <div id="branch-modal-container"></div>`;
  },

  markDirty() {
    if (document.body.classList.contains('is-dirty')) return;
    document.body.classList.add('is-dirty');
    const lbl = document.querySelector('.inst-footer-bar .dirty-label');
    if (lbl) lbl.textContent = 'Unsaved changes';
  },

  _clearDirty() {
    document.body.classList.remove('is-dirty');
  },

  enterEditMode(branchId) { this._clearDirty(); Router.navigate('/branches/' + branchId + '/edit'); },
  cancelEdit(branchId)    { this._clearDirty(); Router.navigate('/branches/' + branchId); },
  saveEdit(branchId) {
    const get = (id) => document.getElementById(id)?.value.trim();
    const patch = {
      name: get('br-name'),
      nmlsId: get('br-nmls'),
      managingLO: get('br-mgr') || null,
      address1: get('br-addr1'),
      suite: get('br-suite'),
      city: get('br-city'),
      state: get('br-state'),
      zip: get('br-zip'),
      contactPhone: get('br-phone'),
    };
    Object.keys(patch).forEach(k => { if (patch[k] === undefined || patch[k] === '') delete patch[k]; });
    if (State.updateBranch) State.updateBranch(branchId, patch);
    this._clearDirty();
    Router.navigate('/branches/' + branchId);
  },

  switchBranchTab(tab) {
    this._branchTab = tab;
    App.renderView(Router.getCurrentPath());
  },

  /* Deep-link from outside the branch detail (e.g. the user profile's
     Companies / Branches tab) — sets the active tab BEFORE navigating
     so the branch opens directly on that tab. */
  openOnTab(branchId, tab) {
    this._branchTab = tab || 'details';
    Router.navigate('/branches/' + branchId);
  },

  /* ---- Details tab — institutional MUI-form treatment per Figma. ---- */
  _renderBranchDetails(b, co, canEdit, editing) {
    const mgr = b.managingLO ? State.getUser(b.managingLO) : null;
    const field = (label, value, opts) => {
      opts = opts || {};
      const v = (value === null || value === undefined) ? '' : value;
      if (editing && opts.id && !opts.locked) {
        if (opts.select) {
          return `
            <div class="form-group">
              <label>${label}</label>
              <select class="select-input" id="${opts.id}">${opts.select(v)}</select>
            </div>`;
        }
        return `
          <div class="form-group">
            <label>${label}</label>
            <input class="input" id="${opts.id}" value="${String(v).replace(/"/g, '&quot;')}" />
          </div>`;
      }
      const empty = v === '' ? ' empty' : '';
      const shown = v === '' ? '—' : v;
      return `
        <div class="form-group">
          <label>${label}</label>
          <div class="field-value${empty}">${shown}</div>
        </div>`;
    };

    const ocUsers = co ? State.getUsersByCompany(co.id) : [];
    const mgrSelect = (currentId) => {
      const opts = ['<option value="">— none —</option>']
        .concat(ocUsers.map(u => `<option value="${u.id}"${u.id === b.managingLO ? ' selected' : ''}>${Display.fullName(u)}</option>`));
      return opts.join('');
    };

    return `
      <div class="inst-card">
        <div class="inst-card-title">Branch information</div>
        <div class="inst-form-grid">
          ${field('Branch name', b.name, { id: 'br-name' })}
          ${field('Branch NMLS #', b.nmlsId, { id: 'br-nmls' })}
          ${field('Branch manager', mgr ? Display.fullName(mgr) : '', { id: 'br-mgr', select: mgrSelect })}
          ${field('Address 1', b.address1, { id: 'br-addr1' })}
          ${field('Suite #', b.suite, { id: 'br-suite' })}
          ${field('City', b.city, { id: 'br-city' })}
          ${field('State', b.state, { id: 'br-state' })}
          ${field('Zip', b.zip, { id: 'br-zip' })}
          ${field('Contact phone', b.contactPhone, { id: 'br-phone' })}
          ${field('Company', co ? co.name : '', { locked: true })}
        </div>
      </div>`;
  },

  /* ---- Users tab ---- */
  _renderBranchUsers(b, canEdit) {
    const users = State.getUsersByBranch(b.id);
    if (!users.length) {
      return `<div class="card"><div style="text-align:center;color:var(--color-text-muted);padding:32px;font-size:13px">No users assigned to this branch.${canEdit ? ' <button class="btn btn-ghost btn-xs" onclick="BulkInviteView.start({ companyId: \'' + b.companyId + '\', returnPath: \'' + Router.getCurrentPath() + '\' })">+ Invite User</button>' : ''}</div></div>`;
    }
    const rows = users.map(u => {
      const a = State.getBranchAssignments(u.id).find(x => x.branchId === b.id);
      const userTypeBadge = a?.userType === 'lo'
        ? '<span class="role-chip role-lo">Loan Officer</span>'
        : '<span class="role-chip">Standard</span>';
      const bmBadge = a?.flags?.branchManager ? '<span class="tag" style="background:#fff7e6;color:#a35c00;margin-left:4px;font-size:10px">BM</span>' : '';
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
          <td>${userTypeBadge}${bmBadge}</td>
          <td><span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
          <td><span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
          <td class="text-secondary">${u.lastLogin ? Display.date(u.lastLogin) : '<span class="text-muted">Never</span>'}</td>
        </tr>`;
    }).join('');
    return `
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:14px 18px;border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="card-title" style="margin-bottom:2px">Users (${users.length})</div>
            <div style="font-size:12px;color:var(--color-text-muted)">Members assigned to this branch. Click a row to view their profile.</div>
          </div>
          ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="BulkInviteView.start({ companyId: '${b.companyId}', returnPath: '${Router.getCurrentPath()}' })">+ Invite User</button>` : ''}
        </div>
        <table>
          <thead><tr><th>User</th><th>Branch Role</th><th>Platform Role</th><th>Status</th><th>Last Login</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  /* ============================================================
     Permissions tab (Round 3 — novel build, mock-only persistence)
     - Branch-level matrix: rows = users, columns = level + flags
     - Per-LO accordion: one block per LO; controls what other branch
       members can do on THAT LO's applications.
     ============================================================ */
  _renderBranchPermissions(b, canEdit) {
    return `
      <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:12px;padding:10px 12px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px">
        <strong>Access levels:</strong>
        <span class="admin-pm-level-pill level-full" style="margin-left:6px">Full</span> all flags forced on ·
        <span class="admin-pm-level-pill level-edit">Can edit</span> set create/submit/withdraw individually ·
        <span class="admin-pm-level-pill level-view">View only</span> /
        <span class="admin-pm-level-pill level-none">No access</span> flags hidden.
      </div>
      ${this._renderBranchPermMatrix(b, canEdit)}
      ${this._renderLoAccordions(b, canEdit)}`;
  },

  _accessLabels: { none: 'No access', view: 'View only', edit: 'Can edit', full: 'Full access' },

  _accessSelect(level, onChangeJs, disabled) {
    const cls = `admin-pm-select level-${level}`;
    const dis = disabled ? 'disabled' : '';
    const opts = ['none', 'view', 'edit', 'full'].map(lv =>
      `<option value="${lv}" ${lv === level ? 'selected' : ''}>${this._accessLabels[lv]}</option>`
    ).join('');
    return `<select class="${cls}" ${dis} onchange="${onChangeJs}">${opts}</select>`;
  },

  _flagCell(level, flag, on, onChangeJs, disabled) {
    if (level === 'none' || level === 'view') {
      return `<td class="admin-pm-flag"><span class="admin-pm-dash">—</span></td>`;
    }
    const lockedOn = level === 'full';
    const checked = lockedOn ? 'checked' : (on ? 'checked' : '');
    const dis = (disabled || lockedOn) ? 'disabled' : '';
    return `<td class="admin-pm-flag"><input type="checkbox" class="admin-pm-check" ${checked} ${dis} onchange="${onChangeJs}" data-flag="${flag}"></td>`;
  },

  _renderBranchPermMatrix(b, canEdit) {
    const records = State.getBranchPermissions(b.id);
    const recById = new Map(records.map(r => [r.userId, r]));
    const branchUsers = State.getUsersByBranch(b.id);
    // Show users who either are assigned at this branch OR already have a perm record
    const userIds = new Set([...branchUsers.map(u => u.id), ...records.map(r => r.userId)]);
    const rowsHtml = [...userIds].map(uid => {
      const u = State.getUser(uid);
      if (!u) return '';
      const rec = recById.get(uid) || { accessLevel: 'none', flags: { canCreate: false, canSubmit: false, canWithdraw: false } };
      const level = rec.accessLevel;
      const lvlChange = `BranchesView._updateBranchPermLevel('${b.id}', '${uid}', this.value)`;
      const flagChange = (flag) => `BranchesView._updateBranchPermFlag('${b.id}', '${uid}', '${flag}', this.checked)`;
      return `
        <tr>
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
          <td>${this._accessSelect(level, lvlChange, !canEdit)}</td>
          ${this._flagCell(level, 'canCreate',   rec.flags?.canCreate,   flagChange('canCreate'),   !canEdit)}
          ${this._flagCell(level, 'canSubmit',   rec.flags?.canSubmit,   flagChange('canSubmit'),   !canEdit)}
          ${this._flagCell(level, 'canWithdraw', rec.flags?.canWithdraw, flagChange('canWithdraw'), !canEdit)}
          <td>${canEdit ? `<button class="btn btn-ghost btn-xs" onclick="BranchesView._removeBranchPerm('${b.id}', '${uid}')">Remove</button>` : ''}</td>
        </tr>`;
    }).join('');

    const candidatesForAdd = branchUsers.filter(u => !recById.has(u.id));
    return `
      <div class="card admin-pm-section-card">
        <div class="admin-pm-section-head">
          <div>
            <div class="card-title" style="margin-bottom:2px">Branch-level permissions</div>
            <div style="font-size:12px;color:var(--color-text-muted)">Default rights each branch member has on applications at this branch.</div>
          </div>
          ${canEdit && candidatesForAdd.length ? `
            <div style="position:relative">
              <button class="btn btn-ghost btn-sm" onclick="BranchesView._toggleAddBranchPerm(event)">+ Add user</button>
              <div class="admin-pm-popover" id="admin-pm-add-branch" style="display:none">
                ${candidatesForAdd.map(u => `<div class="admin-pm-popover-item" onclick="BranchesView._addBranchPerm('${b.id}', '${u.id}')">${Display.fullName(u)} <span style="color:var(--color-text-muted);font-size:11px;margin-left:6px">${Display.roleName(u.role)}</span></div>`).join('')}
              </div>
            </div>` : ''}
        </div>
        ${userIds.size ? `
          <table class="admin-pm-matrix">
            <thead><tr>
              <th>User</th><th>Platform Role</th><th style="width:140px">Access level</th>
              <th style="width:90px;text-align:center">Can create</th>
              <th style="width:90px;text-align:center">Can submit</th>
              <th style="width:100px;text-align:center">Can withdraw</th>
              <th style="width:80px"></th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>` : `<div style="text-align:center;color:var(--color-text-muted);padding:24px;font-size:13px">No users assigned to this branch yet.</div>`}
      </div>`;
  },

  _renderLoAccordions(b, canEdit) {
    const branchUsers = State.getUsersByBranch(b.id);
    // LOs at this branch (per branch assignment, not just role)
    const los = branchUsers.filter(u => {
      const a = State.getBranchAssignments(u.id).find(x => x.branchId === b.id);
      return a?.userType === 'lo';
    });
    if (!los.length) {
      return `<div class="card admin-pm-section-card" style="margin-top:14px">
        <div class="admin-pm-section-head"><div><div class="card-title" style="margin-bottom:2px">Loan officer permissions</div><div style="font-size:12px;color:var(--color-text-muted)">No loan officers assigned to this branch yet.</div></div></div>
      </div>`;
    }
    const blocks = los.map(lo => this._renderLoAccordion(b, lo, canEdit)).join('');
    return `
      <div class="card admin-pm-section-card" style="margin-top:14px;padding:0;overflow:hidden">
        <div class="admin-pm-section-head" style="padding:14px 18px;border-bottom:1px solid var(--color-border)">
          <div>
            <div class="card-title" style="margin-bottom:2px">Loan officer permissions</div>
            <div style="font-size:12px;color:var(--color-text-muted)">Per-LO overrides. Controls what other branch members can do on each LO's applications.</div>
          </div>
        </div>
        ${blocks}
      </div>`;
  },

  _renderLoAccordion(b, lo, canEdit) {
    const accId = `admin-pm-lo-${lo.id}`;
    const entries = State.getLoPermissions(b.id, lo.id);
    const recById = new Map(entries.map(e => [e.userId, e]));
    const branchUsers = State.getUsersByBranch(b.id).filter(u => u.id !== lo.id);
    const candidates = branchUsers.filter(u => !recById.has(u.id));
    const configuredCount = entries.filter(e => e.accessLevel !== 'none').length;

    const rowsHtml = entries.map(e => {
      const u = State.getUser(e.userId);
      if (!u) return '';
      const lvlChange = `BranchesView._updateLoPermLevel('${b.id}', '${lo.id}', '${e.userId}', this.value)`;
      const flagChange = (flag) => `BranchesView._updateLoPermFlag('${b.id}', '${lo.id}', '${e.userId}', '${flag}', this.checked)`;
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
              <div><div class="cell-primary">${Display.fullName(u)}</div><div class="cell-secondary">${Display.roleName(u.role)}</div></div>
            </div>
          </td>
          <td>${this._accessSelect(e.accessLevel, lvlChange, !canEdit)}</td>
          ${this._flagCell(e.accessLevel, 'canCreate',   e.flags?.canCreate,   flagChange('canCreate'),   !canEdit)}
          ${this._flagCell(e.accessLevel, 'canSubmit',   e.flags?.canSubmit,   flagChange('canSubmit'),   !canEdit)}
          ${this._flagCell(e.accessLevel, 'canWithdraw', e.flags?.canWithdraw, flagChange('canWithdraw'), !canEdit)}
          <td>${canEdit ? `<button class="btn btn-ghost btn-xs" onclick="BranchesView._removeLoPerm('${b.id}', '${lo.id}', '${e.userId}')">Remove</button>` : ''}</td>
        </tr>`;
    }).join('');

    return `
      <div class="admin-pm-acc">
        <div class="admin-pm-acc-head" onclick="BranchesView._toggleLoAcc('${accId}')">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="avatar avatar-sm" style="background:${avatarColor(lo.role)}">${Display.initials(lo)}</div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--color-text)">${Display.fullName(lo)}</div>
              <div style="font-size:11px;color:var(--color-text-muted)">LO · NMLS <span class="mono">${lo.agentNmlsId || lo.nmlsId || '—'}</span> · ${configuredCount} peer${configuredCount === 1 ? '' : 's'} configured</div>
            </div>
          </div>
          <span class="admin-pm-acc-caret">▾</span>
        </div>
        <div class="admin-pm-acc-body" id="${accId}">
          <div style="padding:8px 16px;font-size:11px;color:var(--color-text-muted)">Controls what other branch members can do on ${Display.fullName(lo)}'s applications.</div>
          ${entries.length ? `
            <table class="admin-pm-matrix">
              <thead><tr>
                <th>User</th><th style="width:140px">Access level</th>
                <th style="width:90px;text-align:center">Can create</th>
                <th style="width:90px;text-align:center">Can submit</th>
                <th style="width:100px;text-align:center">Can withdraw</th>
                <th style="width:80px"></th>
              </tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>` : `<div style="text-align:center;color:var(--color-text-muted);padding:18px;font-size:12px">No per-user overrides yet.</div>`}
          ${canEdit && candidates.length ? `
            <div style="padding:10px 16px;border-top:1px solid var(--color-border-light);position:relative">
              <button class="btn btn-ghost btn-sm" onclick="BranchesView._toggleAddLoPerm(event, '${accId}')">+ Add user</button>
              <div class="admin-pm-popover" id="${accId}-add" style="display:none;left:16px;top:42px">
                ${candidates.map(u => `<div class="admin-pm-popover-item" onclick="BranchesView._addLoPerm('${b.id}', '${lo.id}', '${u.id}')">${Display.fullName(u)} <span style="color:var(--color-text-muted);font-size:11px;margin-left:6px">${Display.roleName(u.role)}</span></div>`).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>`;
  },

  /* ---- Permission state mutations ---- */
  _updateBranchPermLevel(branchId, userId, level) {
    const cur = State.getBranchPermissions(branchId).find(p => p.userId === userId) || { flags: { canCreate: false, canSubmit: false, canWithdraw: false } };
    State.setBranchPermission(branchId, userId, { accessLevel: level, flags: cur.flags });
    App.renderView(Router.getCurrentPath());
  },
  _updateBranchPermFlag(branchId, userId, flag, on) {
    const cur = State.getBranchPermissions(branchId).find(p => p.userId === userId);
    if (!cur) return;
    const flags = { ...cur.flags, [flag]: !!on };
    State.setBranchPermission(branchId, userId, { accessLevel: cur.accessLevel, flags });
  },
  _removeBranchPerm(branchId, userId) {
    State.removeBranchPermission(branchId, userId);
    App.renderView(Router.getCurrentPath());
  },
  _addBranchPerm(branchId, userId) {
    State.setBranchPermission(branchId, userId, { accessLevel: 'view', flags: {} });
    App.renderView(Router.getCurrentPath());
  },
  _toggleAddBranchPerm(e) {
    e.stopPropagation();
    const el = document.getElementById('admin-pm-add-branch');
    if (!el) return;
    const open = el.style.display !== 'none';
    el.style.display = open ? 'none' : 'block';
    if (!open) setTimeout(() => document.addEventListener('click', () => { el.style.display = 'none'; }, { once: true }), 0);
  },
  _updateLoPermLevel(branchId, loUserId, userId, level) {
    const cur = State.getLoPermissions(branchId, loUserId).find(e => e.userId === userId) || { flags: { canCreate: false, canSubmit: false, canWithdraw: false } };
    State.setLoPermission(branchId, loUserId, userId, { accessLevel: level, flags: cur.flags });
    App.renderView(Router.getCurrentPath());
  },
  _updateLoPermFlag(branchId, loUserId, userId, flag, on) {
    const cur = State.getLoPermissions(branchId, loUserId).find(e => e.userId === userId);
    if (!cur) return;
    const flags = { ...cur.flags, [flag]: !!on };
    State.setLoPermission(branchId, loUserId, userId, { accessLevel: cur.accessLevel, flags });
  },
  _removeLoPerm(branchId, loUserId, userId) {
    State.removeLoPermission(branchId, loUserId, userId);
    App.renderView(Router.getCurrentPath());
  },
  _addLoPerm(branchId, loUserId, userId) {
    State.setLoPermission(branchId, loUserId, userId, { accessLevel: 'view', flags: {} });
    App.renderView(Router.getCurrentPath());
  },
  _toggleAddLoPerm(e, accId) {
    e.stopPropagation();
    const el = document.getElementById(`${accId}-add`);
    if (!el) return;
    const open = el.style.display !== 'none';
    el.style.display = open ? 'none' : 'block';
    if (!open) setTimeout(() => document.addEventListener('click', () => { el.style.display = 'none'; }, { once: true }), 0);
  },
  _toggleLoAcc(accId) {
    const el = document.getElementById(accId);
    if (!el) return;
    const head = el.previousElementSibling;
    const open = el.classList.toggle('open');
    if (head) {
      const caret = head.querySelector('.admin-pm-acc-caret');
      if (caret) caret.textContent = open ? '▾' : '▸';
    }
  },

  /* ---- Market Enablements tab — branch subset of OC's enabled markets ---- */
  _renderBranchMarkets(b, canEdit) {
    const co = State.getCompany(b.companyId);
    const ocLpms = State.getOcEnablement(b.companyId).map(id => State.getLPM(id)).filter(Boolean);
    const ocMarketIds = [...new Set(ocLpms.map(l => l.marketId))];
    const branchMarketIds = new Set(State.getBranchEnabledMarkets(b.id));
    if (!ocMarketIds.length) {
      return `<div class="card"><div style="text-align:center;color:var(--color-text-muted);padding:32px;font-size:13px">No markets enabled at <strong>${co ? co.name : 'the company'}</strong> yet. Configure under the company's <a class="breadcrumb-link" onclick="Router.navigate('/origination-companies/${b.companyId}')">Market Enablements</a> tab first.</div></div>`;
    }
    const chips = ocMarketIds.map(id => {
      const m = State.getMarket(id);
      if (!m) return '';
      const on = branchMarketIds.has(id);
      const cls = `admin-pm-chip${on ? ' is-on' : ''}${canEdit ? '' : ' is-readonly'}`;
      const click = canEdit ? `onclick="BranchesView._toggleBranchMarket('${b.id}', '${id}', ${!on})"` : '';
      return `<span class="${cls}" ${click}><span class="admin-pm-chip-code">${m.code}</span><span class="admin-pm-chip-name">${m.name}</span></span>`;
    }).join('');
    return `
      <div class="card admin-pm-section-card">
        <div class="admin-pm-section-head">
          <div>
            <div class="card-title" style="margin-bottom:2px">Market Enablements</div>
            <div style="font-size:12px;color:var(--color-text-muted)">States this branch operates in. Bounded by ${co ? co.name : 'the company'}'s enabled markets. Disabling a market here also removes any of its programs from the Eligible Programs list.</div>
          </div>
        </div>
        <div class="admin-pm-chip-grid" style="padding:10px 14px">${chips}</div>
      </div>`;
  },

  _toggleBranchMarket(branchId, marketId, on) {
    const cur = new Set(State.getBranchEnabledMarkets(branchId));
    if (on) cur.add(marketId);
    else    cur.delete(marketId);
    State.setBranchEnabledMarkets(branchId, [...cur]);
    App.renderView(Router.getCurrentPath());
  },

  /* ---- Eligible Programs tab — branch subset of OC's enabled programs ---- */
  _renderBranchPrograms(b, canEdit) {
    const co = State.getCompany(b.companyId);
    const ocLpms = State.getOcEnablement(b.companyId);
    if (!ocLpms.length) {
      return `<div class="card"><div style="text-align:center;color:var(--color-text-muted);padding:32px;font-size:13px">No programs enabled at <strong>${co ? co.name : 'the company'}</strong> yet. Configure under the company's <a class="breadcrumb-link" onclick="Router.navigate('/origination-companies/${b.companyId}')">Eligible Programs</a> tab first.</div></div>`;
    }
    const enabledMarkets = new Set(State.getBranchEnabledMarkets(b.id));
    const branchSet = new Set(State.getBranchEnabledPrograms(b.id));
    // Group OC's lpms by program, but only those whose market the branch has on
    const programs = State.getLoanPrograms();
    const rows = programs.map(p => {
      const ocLpmsForProg = State.getLPMsForProgram(p.id).filter(l => ocLpms.includes(l.id));
      if (!ocLpmsForProg.length) return ''; // not enabled at OC — hide entirely per spec
      // Per program, list each market the OC has enabled
      const marketRows = ocLpmsForProg.map(lpm => {
        const m = State.getMarket(lpm.marketId);
        const reachable = enabledMarkets.has(lpm.marketId);
        const on = branchSet.has(lpm.id) && reachable;
        const dis = !canEdit || !reachable;
        const note = !reachable ? `<span style="font-size:10px;color:var(--color-warning);margin-left:8px">market not enabled at branch</span>` : '';
        return `
          <label class="admin-pm-prog-row" style="opacity:${dis && !canEdit ? 1 : (reachable ? 1 : .5)}">
            <input type="checkbox" ${on ? 'checked' : ''} ${dis ? 'disabled' : ''}
                   onchange="BranchesView._toggleBranchProgram('${b.id}', '${lpm.id}', this.checked)">
            <span style="flex:1">${m ? m.code + ' · ' + m.name : lpm.marketId}${note}</span>
            <span class="mono" style="font-size:10px;color:var(--color-text-muted)">${p.code}-${m ? m.code : ''}</span>
          </label>`;
      }).join('');
      return `
        <div class="admin-pm-prog-card">
          <div class="admin-pm-prog-card-head">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--color-text)">${p.name}</div>
              <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">Available markets at OC: ${ocLpmsForProg.map(l => State.getMarket(l.marketId)?.code).filter(Boolean).join(', ')}</div>
            </div>
          </div>
          <div>${marketRows}</div>
        </div>`;
    }).filter(Boolean).join('');

    return `
      <div class="card admin-pm-section-card">
        <div class="admin-pm-section-head">
          <div>
            <div class="card-title" style="margin-bottom:2px">Eligible Programs</div>
            <div style="font-size:12px;color:var(--color-text-muted)">Programs available at this branch. Only programs enabled at ${co ? co.name : 'the company'} are listed; only markets enabled at this branch are selectable.</div>
          </div>
        </div>
        <div style="padding:4px 0">${rows || '<div style="text-align:center;color:var(--color-text-muted);padding:24px;font-size:13px">No programs match the branch\'s enabled markets.</div>'}</div>
      </div>`;
  },

  _toggleBranchProgram(branchId, lpmId, on) {
    const cur = new Set(State.getBranchEnabledPrograms(branchId));
    if (on) cur.add(lpmId);
    else    cur.delete(lpmId);
    State.setBranchEnabledPrograms(branchId, [...cur]);
    App.renderView(Router.getCurrentPath());
  },

  /* Navigate to the institutional Create Branch page. The Add Branch buttons
     now use this entry point instead of the legacy modal. */
  openAddPage(companyId) {
    Router.navigate('/branches/new' + (companyId ? '?company=' + companyId : ''));
  },

  openAddModal() {
    const companies = State.getCompanies();
    const role = State.getRole();
    const currentUser = State.getCurrentUser();
    const scopedCompanyId = this._scope?.companyId || (role === 'prog_admin' ? currentUser?.companyId : null);
    const companyOptions = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    document.getElementById('branch-modal-container').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)BranchesView.closeModal()">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">Add Branch</div>
              <div class="modal-subtitle">Create a new branch location (flat — no nested sub-branches per spec §9 #14)</div>
            </div>
            <button class="modal-close" onclick="BranchesView.closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Branch Name *</label>
                <input class="input" id="br-name" placeholder="e.g. Downtown DC" />
              </div>
              ${!scopedCompanyId ? `
              <div class="form-group form-full">
                <label>Origination Company *</label>
                <select class="select-input" id="br-company">
                  <option value="">Select company…</option>${companyOptions}
                </select>
              </div>` : `<input type="hidden" id="br-company" value="${scopedCompanyId}" />`}
              <div class="form-group form-full">
                <label>Street Address *</label>
                <input class="input" id="br-address" placeholder="100 Main St, City, ST 00000" />
              </div>
              <div class="form-group">
                <label>State *</label>
                <select class="select-input" id="br-state">
                  <option value="">State…</option>
                  ${['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => `<option>${s}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Branch Type</label>
                <select class="select-input" id="br-type">
                  <option value="Branch">Branch</option>
                  <option value="Main">Main</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label>NMLS Branch ID</label>
                <input class="input" id="br-nmls" placeholder="e.g. 2045871-001" />
                <div class="form-hint">Enabled (program × market) pairs are configured under <strong>Access</strong> on the OC detail screen.</div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="BranchesView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="BranchesView.submitAdd()">Create Branch</button>
          </div>
        </div>
      </div>`;
  },

  submitAdd() {
    const name       = document.getElementById('br-name')?.value.trim();
    const companyId  = document.getElementById('br-company')?.value;
    const address    = document.getElementById('br-address')?.value.trim();
    const state      = document.getElementById('br-state')?.value;
    const nmlsId     = document.getElementById('br-nmls')?.value.trim() || null;
    const branchType = document.getElementById('br-type')?.value || 'Branch';

    if (!name || !companyId || !address || !state) {
      alert('Please fill in all required fields.');
      return;
    }

    State.addBranch({ name, companyId, address, state, nmlsId, branchType, managingLO: null, lastNmlsSync: new Date().toISOString() });
    this.closeModal();
    UsersView.showSuccess(`Branch "${name}" created`);
    BranchesView._rerender();
  },

  openEditModal(branchId) {
    const b = State.getBranch(branchId);
    if (!b) return;

    const companyUsers = b.companyId ? State.getUsersByCompany(b.companyId) : State.getUsers();

    const loRows = companyUsers.map(u => `
      <div class="perm-user-row" id="lo-row-${u.id}">
        <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:500">${Display.fullName(u)}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">${Display.roleName(u.role)}</div>
        </div>
        <label class="checkbox-group" style="gap:4px;font-size:11px;color:var(--color-text-muted)">
          <input type="radio" name="edit-br-lo" value="${u.id}" ${b.managingLO === u.id ? 'checked' : ''} />
          Managing LO
        </label>
      </div>`).join('') || '<p style="font-size:12px;color:var(--color-text-muted)">No users in this company.</p>';

    document.getElementById('branch-modal-container').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)BranchesView.closeModal()">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <div class="modal-title">Edit Branch</div>
              <div class="modal-subtitle">${b.name}</div>
            </div>
            <button class="modal-close" onclick="BranchesView.closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Branch Name</label>
                <input class="input" id="edit-br-name" value="${b.name}" />
              </div>
              <div class="form-group form-full">
                <label>Street Address</label>
                <input class="input" id="edit-br-address" value="${b.address}" />
              </div>
              <div class="form-group">
                <label>NMLS Branch ID</label>
                <input class="input" id="edit-br-nmls" value="${b.nmlsId || ''}" placeholder="e.g. 2045871-001" />
              </div>
              <div class="form-group">
                <label>State</label>
                <select class="select-input" id="edit-br-state">
                  <option value="DC" ${b.state==='DC'?'selected':''}>DC</option>
                  <option value="KY" ${b.state==='KY'?'selected':''}>KY</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select class="select-input" id="edit-br-status">
                  <option value="active" ${b.status==='active'?'selected':''}>Active</option>
                  <option value="pending" ${b.status==='pending'?'selected':''}>Setup incomplete</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label>Branch Users</label>
                <input class="input input-sm" id="edit-br-lo-search" placeholder="Search users…" oninput="BranchesView._filterBranchUsers(this.value)" style="margin-bottom:8px" />
                <div id="edit-br-lo-list" style="max-height:160px;overflow-y:auto;border:1px solid var(--color-border);border-radius:var(--radius);padding:4px">
                  ${loRows}
                  <div style="padding:5px 0;font-size:12px">
                    <label class="checkbox-group">
                      <input type="radio" name="edit-br-lo" value="" ${!b.managingLO ? 'checked' : ''} />
                      <span style="color:var(--color-text-muted)">None (N/A)</span>
                    </label>
                  </div>
                </div>
                <div class="form-hint">Enabled (program × market) pairs are managed under <strong>Access</strong> on the OC detail screen.</div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="BranchesView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="BranchesView.submitEdit('${branchId}')">Save Changes</button>
          </div>
        </div>
      </div>`;

    // Store user rows for search filtering
    this._branchUserSearchData = companyUsers;
  },

  _filterBranchUsers(query) {
    const q = query.toLowerCase();
    const rows = document.querySelectorAll('#edit-br-lo-list .perm-user-row');
    rows.forEach(row => {
      const text = row.querySelector('div:nth-child(2)')?.textContent.toLowerCase() || '';
      row.style.display = text.includes(q) ? '' : 'none';
    });
  },

  submitEdit(branchId) {
    const name       = document.getElementById('edit-br-name')?.value.trim();
    const address    = document.getElementById('edit-br-address')?.value.trim();
    const nmlsId     = document.getElementById('edit-br-nmls')?.value.trim() || null;
    const state      = document.getElementById('edit-br-state')?.value;
    const status     = document.getElementById('edit-br-status')?.value;
    const loRadio = document.querySelector('input[name="edit-br-lo"]:checked');
    const managingLO = loRadio?.value || null;

    State.updateBranch(branchId, { name, address, nmlsId, state, status, managingLO });
    this.closeModal();
    if (this._detailId === branchId) this.openDetail(branchId);
    UsersView.showSuccess('Branch updated');
    BranchesView._rerender();
  },

  closeModal() {
    const mc = document.getElementById('branch-modal-container');
    if (mc) mc.innerHTML = '';
  },
};
