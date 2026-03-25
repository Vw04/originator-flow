/* ============================================================
   HOMIUM ORIGINATOR FLOW — Branches View
   ============================================================ */

const BranchesView = {
  _filter: { search: '', companyId: '', state: '', program: '', status: '' },
  _detailId: null,

  render() {
    const role        = State.getRole();
    const currentUser = State.getCurrentUser();
    const canEdit     = State.can('editAny') || State.can('manageCompany');

    let allBranches = State.getBranches();
    let companies   = State.getCompanies();

    // Scope for prog_admin
    if (role === 'prog_admin' && currentUser?.companyId) {
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
    if (f.program)   filtered = filtered.filter(b => b.programs.includes(f.program));
    if (f.status)    filtered = filtered.filter(b => b.status === f.status);

    // Build hierarchical order: parents first, then their sub-branches indented
    const parents    = filtered.filter(b => !b.parentBranchId);
    const subs       = filtered.filter(b => !!b.parentBranchId);
    const ordered    = [];
    parents.forEach(p => {
      ordered.push({ branch: p, isChild: false });
      subs.filter(s => s.parentBranchId === p.id).forEach(s => ordered.push({ branch: s, isChild: true }));
    });
    // Any sub-branches whose parent was filtered out still appear
    subs.filter(s => !parents.find(p => p.id === s.parentBranchId)).forEach(s => ordered.push({ branch: s, isChild: false }));

    const companyOptions = companies.map(c => `<option value="${c.id}" ${f.companyId===c.id?'selected':''}>${c.name}</option>`).join('');

    // Collect unique programs from all branches for filter
    const allPrograms = [...new Set(allBranches.flatMap(b => b.programs))];
    const programOptions = allPrograms.map(p => `<option value="${p}" ${f.program===p?'selected':''}>${p}</option>`).join('');

    const rows = ordered.map(({ branch: b, isChild }) => {
      const co     = State.getCompany(b.companyId);
      const mgr    = b.managingLO ? State.getUser(b.managingLO) : null;
      const users  = State.getUsersByBranch(b.id);
      const programs = b.programs.length ? b.programs.map(p => `<span class="tag">${p}</span>`).join(' ') : '<span class="text-muted">None</span>';
      const indent = isChild ? `<span class="subbranch-indicator">└</span>` : '';
      return `
        <tr class="clickable ${isChild ? 'subbranch-row' : ''}" onclick="BranchesView.openDetail('${b.id}')">
          <td>
            <div style="display:flex;align-items:flex-start;gap:4px">
              ${indent}
              <div>
                <div class="cell-primary">${b.name}</div>
                <div class="cell-secondary">${b.address}</div>
              </div>
            </div>
          </td>
          ${role !== 'prog_admin' ? `<td class="text-secondary">${co ? co.name : '—'}</td>` : ''}
          <td>${b.state}</td>
          <td>${mgr ? Display.fullName(mgr) : '<span class="text-muted">N/A</span>'}</td>
          <td>${users.length}</td>
          <td>${programs}</td>
          <td><span class="status-pill ${b.status === 'active' ? 'badge-active' : 'badge-pending'}"><span class="status-dot"></span>${b.status === 'active' ? 'Active' : 'Setup incomplete'}</span></td>
        </tr>`;
    }).join('');

    const hasFilters = Object.values(f).some(v => v);

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">Branches</div>
            <div class="page-subtitle">${filtered.length} branch${filtered.length !== 1 ? 'es' : ''}</div>
          </div>
        </div>
        ${canEdit ? `
          <div class="page-header-actions">
            <button class="btn btn-primary btn-sm" onclick="BranchesView.openAddModal()">+ Add Branch</button>
          </div>` : ''}
      </div>

      <div class="page-body">
        <div class="table-container">
          <div class="table-toolbar">
            <input type="text" class="input input-sm input-search" style="width:200px" placeholder="Search branches…"
              value="${f.search}" oninput="BranchesView.setFilter('search', this.value)" />
            ${role !== 'prog_admin' ? `
              <select class="filter-select" onchange="BranchesView.setFilter('companyId', this.value)">
                <option value="">All Organizations</option>${companyOptions}
              </select>` : ''}
            <select class="filter-select" onchange="BranchesView.setFilter('state', this.value)">
              <option value="">All States</option>
              <option value="DC" ${f.state==='DC'?'selected':''}>DC</option>
              <option value="KY" ${f.state==='KY'?'selected':''}>KY</option>
            </select>
            <select class="filter-select" onchange="BranchesView.setFilter('program', this.value)">
              <option value="">All Programs</option>${programOptions}
            </select>
            <select class="filter-select" onchange="BranchesView.setFilter('status', this.value)">
              <option value="">All Statuses</option>
              <option value="active" ${f.status==='active'?'selected':''}>Active</option>
              <option value="pending" ${f.status==='pending'?'selected':''}>Pending</option>
            </select>
            ${hasFilters ? `<button class="btn btn-ghost btn-sm" onclick="BranchesView.clearFilters()">Clear</button>` : ''}
          </div>

          ${ordered.length ? `
            <table>
              <thead><tr>
                <th>Branch</th>
                ${role !== 'prog_admin' ? '<th>Organization</th>' : ''}
                <th>State</th>
                <th>Managing LO</th>
                <th>Users</th>
                <th>Programs</th>
                <th>Status</th>
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
      </div>

      <div id="branch-panel-container"></div>
      <div id="branch-modal-container"></div>`;
  },

  setFilter(key, value) {
    this._filter[key] = value;
    App.renderView('/branches');
  },

  clearFilters() {
    this._filter = { search: '', companyId: '', state: '', program: '', status: '' };
    App.renderView('/branches');
  },

  openDetail(branchId) {
    const b       = State.getBranch(branchId);
    if (!b) return;
    this._detailId = branchId;

    const co      = State.getCompany(b.companyId);
    const mgr     = b.managingLO ? State.getUser(b.managingLO) : null;
    const users   = State.getUsersByBranch(b.id);
    const subBranches = State.getBranches().filter(x => x.parentBranchId === b.id);
    const canEdit = State.can('editAny') || State.can('manageCompany');

    const userRows = users.map(u => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--color-border);cursor:pointer" onclick="ProfileView.open('${u.id}')">
        <div class="avatar avatar-sm" style="background:${avatarColor(u.role)};flex-shrink:0">${Display.initials(u)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--color-text)">${Display.fullName(u)}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">${Display.roleName(u.role)}</div>
        </div>
        <span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}" style="font-size:10px"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span>
      </div>`).join('') || '<p style="font-size:13px;color:var(--color-text-muted)">No users in this branch.</p>';

    const subRows = subBranches.map(s => `
      <div style="padding:6px 0;border-bottom:1px solid var(--color-border)">
        <div style="font-size:13px;font-weight:500;color:var(--color-text)">${s.name}</div>
        <div style="font-size:11px;color:var(--color-text-muted)">${s.address}</div>
      </div>`).join('') || '';

    document.getElementById('branch-panel-container').innerHTML = `
      <div class="side-panel-overlay" onclick="if(event.target===this)BranchesView.closePanel()">
        <div class="side-panel">
          <div class="side-panel-header">
            <div>
              <div class="side-panel-title">${b.name}</div>
              <div class="side-panel-subtitle">${co ? co.name : '—'}</div>
            </div>
            <button class="modal-close" onclick="BranchesView.closePanel()">×</button>
          </div>
          <div class="side-panel-body">

            <div class="panel-section">
              <div class="panel-section-label">Branch Details</div>
              <div class="panel-field"><span class="panel-field-label">Address</span><span>${b.address}</span></div>
              <div class="panel-field"><span class="panel-field-label">State</span><span>${b.state}</span></div>
              <div class="panel-field"><span class="panel-field-label">Status</span><span class="status-pill ${b.status==='active'?'badge-active':'badge-pending'}"><span class="status-dot"></span>${b.status==='active'?'Active':'Setup incomplete'}</span></div>
              <div class="panel-field"><span class="panel-field-label">Managing LO</span><span>${mgr ? Display.fullName(mgr) : '<span class="text-muted">N/A</span>'}</span></div>
              <div class="panel-field"><span class="panel-field-label">Programs</span><span>${b.programs.length ? b.programs.map(p=>`<span class="tag">${p}</span>`).join(' ') : '<span class="text-muted">None</span>'}</span></div>
              ${b.parentBranchId ? `<div class="panel-field"><span class="panel-field-label">Parent Branch</span><span>${State.getBranch(b.parentBranchId)?.name || b.parentBranchId}</span></div>` : ''}
            </div>

            <div class="panel-section">
              <div class="panel-section-label">Users (${users.length})</div>
              ${userRows}
            </div>

            ${subBranches.length ? `
            <div class="panel-section">
              <div class="panel-section-label">Sub-Branches (${subBranches.length})</div>
              ${subRows}
            </div>` : ''}

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
    const companyOptions = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const loUsers = State.getUsers().filter(u => u.role === 'lo');
    const loOptions = loUsers.map(u => `<option value="${u.id}">${Display.fullName(u)}</option>`).join('');

    // Parent branch options (only non-sub-branches)
    const parentBranches = State.getBranches().filter(b => !b.parentBranchId);
    const parentOptions = parentBranches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    document.getElementById('branch-modal-container').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)BranchesView.closeModal()">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">Add Branch</div>
              <div class="modal-subtitle">Create a new branch location</div>
            </div>
            <button class="modal-close" onclick="BranchesView.closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Branch Name *</label>
                <input class="input" id="br-name" placeholder="e.g. Downtown DC" />
              </div>
              ${role !== 'prog_admin' ? `
              <div class="form-group form-full">
                <label>Organization *</label>
                <select class="select-input" id="br-company">
                  <option value="">Select organization…</option>${companyOptions}
                </select>
              </div>` : `<input type="hidden" id="br-company" value="${currentUser?.companyId || ''}" />`}
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
                <label>Managing Loan Officer</label>
                <select class="select-input" id="br-mgr">
                  <option value="">None (N/A)</option>${loOptions}
                </select>
              </div>
              <div class="form-group form-full">
                <label>Parent Branch <span style="font-weight:400;color:var(--color-text-muted)">(optional — creates a sub-branch)</span></label>
                <select class="select-input" id="br-parent">
                  <option value="">None (top-level branch)</option>${parentOptions}
                </select>
              </div>
              <div class="form-group form-full">
                <label>Enabled Programs</label>
                <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:4px">
                  <label class="checkbox-group"><input type="checkbox" id="br-prog-dc" value="DC Dream Fund" /> DC Dream Fund</label>
                  <label class="checkbox-group"><input type="checkbox" id="br-prog-ky" value="Kentucky Dream Fund" /> Kentucky Dream Fund</label>
                </div>
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
    const name           = document.getElementById('br-name')?.value.trim();
    const companyId      = document.getElementById('br-company')?.value;
    const address        = document.getElementById('br-address')?.value.trim();
    const state          = document.getElementById('br-state')?.value;
    const managingLO     = document.getElementById('br-mgr')?.value || null;
    const parentBranchId = document.getElementById('br-parent')?.value || null;
    const programs       = [];
    if (document.getElementById('br-prog-dc')?.checked) programs.push('DC Dream Fund');
    if (document.getElementById('br-prog-ky')?.checked) programs.push('Kentucky Dream Fund');

    if (!name || !companyId || !address || !state) {
      alert('Please fill in all required fields.');
      return;
    }

    State.addBranch({ name, companyId, address, state, managingLO, programs, parentBranchId });
    this.closeModal();
    UsersView.showSuccess(`Branch "${name}" created`);
    App.renderView('/branches');
  },

  openEditModal(branchId) {
    const b = State.getBranch(branchId);
    if (!b) return;

    const companyUsers = b.companyId ? State.getUsersByCompany(b.companyId).filter(u => u.role === 'lo') : State.getUsers().filter(u => u.role === 'lo');
    const subBranches  = State.getBranches().filter(x => x.parentBranchId === b.id);

    const loRows = companyUsers.map(u => `
      <div class="perm-user-row" id="lo-row-${u.id}">
        <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
        <div style="flex:1">${Display.fullName(u)}</div>
        <label class="checkbox-group">
          <input type="radio" name="edit-br-lo" value="${u.id}" ${b.managingLO === u.id ? 'checked' : ''} />
        </label>
      </div>`).join('') || '<p style="font-size:12px;color:var(--color-text-muted)">No LOs in this company.</p>';

    const subRows = subBranches.map(s => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--color-border-light);font-size:12px">
        <span>${s.name}</span>
        <button class="btn btn-ghost btn-xs" onclick="BranchesView._removeSubBranch('${s.id}')">Remove</button>
      </div>`).join('') || '';

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
                <label>Enabled Programs</label>
                <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:4px">
                  <label class="checkbox-group"><input type="checkbox" id="edit-br-prog-dc" ${b.programs.includes('DC Dream Fund')?'checked':''} /> DC Dream Fund</label>
                  <label class="checkbox-group"><input type="checkbox" id="edit-br-prog-ky" ${b.programs.includes('Kentucky Dream Fund')?'checked':''} /> Kentucky Dream Fund</label>
                </div>
              </div>
              <div class="form-group form-full">
                <label>Managing Loan Officer</label>
                <input class="input input-sm" id="edit-br-lo-search" placeholder="Search LOs…" oninput="BranchesView._filterLOList(this.value)" style="margin-bottom:8px" />
                <div id="edit-br-lo-list" style="max-height:160px;overflow-y:auto;border:1px solid var(--color-border);border-radius:var(--radius);padding:4px">
                  ${loRows}
                  <div style="padding:5px 0;font-size:12px">
                    <label class="checkbox-group">
                      <input type="radio" name="edit-br-lo" value="" ${!b.managingLO ? 'checked' : ''} />
                      <span style="color:var(--color-text-muted)">None (N/A)</span>
                    </label>
                  </div>
                </div>
              </div>
              ${subBranches.length || true ? `
              <div class="form-group form-full">
                <label>Sub-Branches</label>
                <div id="edit-br-sub-list" style="margin-bottom:8px">${subRows}</div>
                <button class="btn btn-secondary btn-sm" onclick="BranchesView._addSubBranchInline('${b.id}')">+ Add Sub-branch</button>
              </div>` : ''}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="BranchesView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="BranchesView.submitEdit('${branchId}')">Save Changes</button>
          </div>
        </div>
      </div>`;

    // Store LO rows for search filtering
    this._loSearchData = companyUsers;
  },

  _filterLOList(query) {
    const q = query.toLowerCase();
    const rows = document.querySelectorAll('#edit-br-lo-list .perm-user-row');
    rows.forEach(row => {
      const name = row.querySelector('div:nth-child(2)')?.textContent.toLowerCase() || '';
      row.style.display = name.includes(q) ? '' : 'none';
    });
  },

  _removeSubBranch(subId) {
    State.updateBranch(subId, { parentBranchId: null });
    const row = document.querySelector(`#edit-br-sub-list [onclick*="${subId}"]`)?.closest('div');
    if (row) row.remove();
  },

  _addSubBranchInline(parentId) {
    const name = prompt('Sub-branch name:');
    if (!name || !name.trim()) return;
    const parent = State.getBranch(parentId);
    State.addBranch({ name: name.trim(), companyId: parent.companyId, address: '', state: parent.state, managingLO: null, programs: [], parentBranchId: parentId });
    UsersView.showSuccess(`Sub-branch "${name.trim()}" added`);
    this.openEditModal(parentId);
  },

  submitEdit(branchId) {
    const name    = document.getElementById('edit-br-name')?.value.trim();
    const address = document.getElementById('edit-br-address')?.value.trim();
    const state   = document.getElementById('edit-br-state')?.value;
    const status  = document.getElementById('edit-br-status')?.value;
    const programs = [];
    if (document.getElementById('edit-br-prog-dc')?.checked) programs.push('DC Dream Fund');
    if (document.getElementById('edit-br-prog-ky')?.checked) programs.push('Kentucky Dream Fund');
    const loRadio = document.querySelector('input[name="edit-br-lo"]:checked');
    const managingLO = loRadio?.value || null;

    State.updateBranch(branchId, { name, address, state, status, programs, managingLO });
    this.closeModal();
    if (this._detailId === branchId) this.openDetail(branchId);
    UsersView.showSuccess('Branch updated');
    App.renderView('/branches');
  },

  closeModal() {
    const mc = document.getElementById('branch-modal-container');
    if (mc) mc.innerHTML = '';
  },
};
