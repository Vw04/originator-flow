/* ============================================================
   HOMIUM ORIGINATOR FLOW — Branches View
   ============================================================ */

const BranchesView = {
  _filter: { search: '', companyId: '', state: '', program: '', status: '' },
  _sort: { col: null, dir: 'asc' },
  _detailId: null,

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

  /* scope: optional { companyId } for section-scoped rendering */
  render(scope) {
    this._scope = scope || null;
    const role        = State.getRole();
    const currentUser = State.getCurrentUser();
    const canEdit     = State.can('editAny') || State.can('manageCompany');

    let allBranches = scope?.companyId
      ? State.getBranchesByCompany(scope.companyId)
      : State.getBranches();
    let companies   = State.getCompanies();

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
        <tr class="clickable" onclick="BranchesView.openDetail('${b.id}')">
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
              <button class="btn btn-primary btn-sm" onclick="BranchesView.openAddModal()">+ Add Branch</button>
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
            ${scope && canEdit ? `<button class="btn btn-primary btn-sm" onclick="BranchesView.openAddModal()" style="margin-left:auto">+ Add Branch</button>` : ''}
          </div>

          ${ordered.length ? `
            <table>
              <thead><tr>
                <th class="${thClass('name')}" onclick="BranchesView.setSort('name')">Branch</th>
                ${(role !== 'prog_admin' && !scope?.companyId) ? '<th>Company</th>' : ''}
                <th>Type</th>
                <th>State</th>
                <th>Managing LO</th>
                <th>Users</th>
                <th>Programs</th>
                <th>NMLS Sync</th>
                <th class="${thClass('status')}" onclick="BranchesView.setSort('status')">Status</th>
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
