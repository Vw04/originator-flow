/* ============================================================
   HOMIUM ORIGINATOR FLOW — Branches View
   ============================================================ */

const BranchesView = {
  _filter: { search: '', companyId: '' },
  _editingId: null,

  render() {
    const role        = State.getRole();
    const currentUser = State.getCurrentUser();
    const canEdit     = State.can('editAny') || State.can('manageCompany');

    let branches = State.getBranches();
    let companies = State.getCompanies();

    // Scope for prog_admin
    if (role === 'prog_admin' && currentUser?.companyId) {
      branches = branches.filter(b => b.companyId === currentUser.companyId);
      companies = companies.filter(c => c.id === currentUser.companyId);
    }

    const f = this._filter;
    if (f.search) {
      const q = f.search.toLowerCase();
      branches = branches.filter(b => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q) || b.state.toLowerCase().includes(q));
    }
    if (f.companyId) branches = branches.filter(b => b.companyId === f.companyId);

    const companyOptions = companies.map(c => `<option value="${c.id}" ${f.companyId===c.id?'selected':''}>${c.name}</option>`).join('');

    const rows = branches.map(b => {
      const co     = State.getCompany(b.companyId);
      const mgr    = State.getUser(b.managingLO);
      const users  = State.getUsersByBranch(b.id);
      const programs = b.programs.length ? b.programs.map(p => `<span class="tag">${p}</span>`).join(' ') : '<span class="text-muted">None</span>';
      return `
        <tr>
          <td>
            <div class="cell-primary">${b.name}</div>
            <div class="cell-secondary">${b.address}</div>
          </td>
          ${role !== 'prog_admin' ? `<td class="text-secondary">${co ? co.name : '—'}</td>` : ''}
          <td>${b.state}</td>
          <td>${mgr ? Display.fullName(mgr) : '<span class="text-muted">—</span>'}</td>
          <td>${users.length}</td>
          <td>${programs}</td>
          <td><span class="badge ${b.status === 'active' ? 'badge-active' : 'badge-pending'}">${b.status === 'active' ? 'Active' : 'Pending'}</span></td>
          <td>
            ${canEdit ? `<button class="btn btn-ghost btn-xs" onclick="BranchesView.openEditModal('${b.id}')">Edit</button>` : ''}
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">Branches</div>
            <div class="page-subtitle">${branches.length} branch${branches.length !== 1 ? 'es' : ''}</div>
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
            ${Object.values(f).some(v=>v) ? `<button class="btn btn-ghost btn-sm" onclick="BranchesView.clearFilters()">Clear</button>` : ''}
          </div>

          ${branches.length ? `
            <table>
              <thead><tr>
                <th>Branch</th>
                ${role !== 'prog_admin' ? '<th>Organization</th>' : ''}
                <th>State</th>
                <th>Managing LO</th>
                <th>Users</th>
                <th>Programs</th>
                <th>Status</th>
                <th></th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="table-footer">
              <span class="table-count">${branches.length} branch${branches.length !== 1 ? 'es' : ''}</span>
            </div>` : `
            <div class="table-empty">
              <div class="table-empty-icon">📍</div>
              <p>No branches found.</p>
            </div>`}
        </div>
      </div>

      <div id="branch-modal-container"></div>`;
  },

  setFilter(key, value) {
    this._filter[key] = value;
    App.renderView('/branches');
  },

  clearFilters() {
    this._filter = { search: '', companyId: '' };
    App.renderView('/branches');
  },

  openAddModal() {
    const companies = State.getCompanies();
    const companyOptions = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const role = State.getRole();
    const currentUser = State.getCurrentUser();

    const usersForLO = State.getUsers().filter(u => u.role === 'lo');
    const loOptions = usersForLO.map(u => `<option value="${u.id}">${Display.fullName(u)}</option>`).join('');

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
                <input class="input" id="br-name" placeholder="e.g. Downtown Nashville" />
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
                  ${['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => `<option>${s}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Managing Loan Officer</label>
                <select class="select-input" id="br-mgr">
                  <option value="">Select LO…</option>${loOptions}
                </select>
              </div>
              <div class="form-group form-full">
                <label>Enabled Programs</label>
                <div style="display:flex;gap:16px;margin-top:4px">
                  <label class="checkbox-group"><input type="checkbox" id="br-prog-std" value="Standard HEI" /> Standard HEI</label>
                  <label class="checkbox-group"><input type="checkbox" id="br-prog-jumbo" value="Jumbo HEI" /> Jumbo HEI</label>
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
    const name      = document.getElementById('br-name')?.value.trim();
    const companyId = document.getElementById('br-company')?.value;
    const address   = document.getElementById('br-address')?.value.trim();
    const state     = document.getElementById('br-state')?.value;
    const managingLO = document.getElementById('br-mgr')?.value || null;
    const programs  = [];
    if (document.getElementById('br-prog-std')?.checked)   programs.push('Standard HEI');
    if (document.getElementById('br-prog-jumbo')?.checked) programs.push('Jumbo HEI');

    if (!name || !companyId || !address || !state) {
      alert('Please fill in all required fields.');
      return;
    }

    State.addBranch({ name, companyId, address, state, managingLO, programs });
    this.closeModal();
    UsersView.showSuccess(`Branch "${name}" created`);
    App.renderView('/branches');
  },

  openEditModal(branchId) {
    const b = State.getBranch(branchId);
    if (!b) return;

    document.getElementById('branch-modal-container').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)BranchesView.closeModal()">
        <div class="modal">
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
                <input class="input" id="edit-br-state" value="${b.state}" maxlength="2" />
              </div>
              <div class="form-group">
                <label>Status</label>
                <select class="select-input" id="edit-br-status">
                  <option value="active" ${b.status==='active'?'selected':''}>Active</option>
                  <option value="pending" ${b.status==='pending'?'selected':''}>Pending</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label>Enabled Programs</label>
                <div style="display:flex;gap:16px;margin-top:4px">
                  <label class="checkbox-group"><input type="checkbox" id="edit-br-prog-std" ${b.programs.includes('Standard HEI')?'checked':''} /> Standard HEI</label>
                  <label class="checkbox-group"><input type="checkbox" id="edit-br-prog-jumbo" ${b.programs.includes('Jumbo HEI')?'checked':''} /> Jumbo HEI</label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="BranchesView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="BranchesView.submitEdit('${branchId}')">Save Changes</button>
          </div>
        </div>
      </div>`;
  },

  submitEdit(branchId) {
    const name    = document.getElementById('edit-br-name')?.value.trim();
    const address = document.getElementById('edit-br-address')?.value.trim();
    const state   = document.getElementById('edit-br-state')?.value.trim();
    const status  = document.getElementById('edit-br-status')?.value;
    const programs = [];
    if (document.getElementById('edit-br-prog-std')?.checked)   programs.push('Standard HEI');
    if (document.getElementById('edit-br-prog-jumbo')?.checked) programs.push('Jumbo HEI');

    State.updateBranch(branchId, { name, address, state, status, programs });
    this.closeModal();
    UsersView.showSuccess('Branch updated');
    App.renderView('/branches');
  },

  closeModal() {
    const mc = document.getElementById('branch-modal-container');
    if (mc) mc.innerHTML = '';
  },
};
