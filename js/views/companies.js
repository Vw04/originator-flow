/* ============================================================
   HOMIUM ORIGINATOR FLOW — Companies / Organizations View
   ============================================================ */

const CompaniesView = {
  _filter: { search: '', status: '' },

  render() {
    const canEdit = State.can('manageCompany') || State.can('editAny');
    let companies = State.getCompanies();

    const f = this._filter;
    if (f.search) {
      const q = f.search.toLowerCase();
      companies = companies.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.nmlsId.includes(q) ||
        c.emailDomain.toLowerCase().includes(q)
      );
    }
    if (f.status) companies = companies.filter(c => c.status === f.status);

    const rows = companies.map(c => {
      const branches = State.getBranchesByCompany(c.id);
      const users    = State.getUsersByCompany(c.id);
      const pending  = users.filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus));

      return `
        <tr class="clickable" onclick="CompaniesView.openDetail('${c.id}')">
          <td>
            <div class="cell-primary">${c.name}</div>
            <div class="cell-secondary">${c.emailDomain}</div>
          </td>
          <td class="text-secondary fw-600">${c.nmlsId}</td>
          <td>${c.stateOfIncorporation}</td>
          <td>${branches.length}</td>
          <td>
            ${users.length}
            ${pending.length ? `<span class="badge badge-pending" style="margin-left:6px">${pending.length} pending</span>` : ''}
          </td>
          <td>${c.programs.length ? c.programs.map(p => `<span class="tag">${p}</span>`).join(' ') : '<span class="text-muted">—</span>'}</td>
          <td><span class="badge ${c.status === 'active' ? 'badge-active' : 'badge-pending'}">${c.status === 'active' ? 'Active' : 'Pending Setup'}</span></td>
          <td>
            ${canEdit ? `<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();CompaniesView.openEditModal('${c.id}')">Edit</button>` : ''}
            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();CompaniesView.openDetail('${c.id}')">View →</button>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">Organizations</div>
            <div class="page-subtitle">${companies.length} organization${companies.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        ${canEdit ? `
          <div class="page-header-actions">
            <button class="btn btn-primary btn-sm" onclick="CompaniesView.openAddModal()">+ Add Organization</button>
          </div>` : ''}
      </div>

      <div class="page-body">
        <div class="table-container">
          <div class="table-toolbar">
            <input type="text" class="input input-sm input-search" style="width:220px" placeholder="Search organizations…"
              value="${f.search}" oninput="CompaniesView.setFilter('search', this.value)" />
            <select class="filter-select" onchange="CompaniesView.setFilter('status', this.value)">
              <option value="">All Statuses</option>
              <option value="active" ${f.status==='active'?'selected':''}>Active</option>
              <option value="pending" ${f.status==='pending'?'selected':''}>Pending</option>
            </select>
            ${Object.values(f).some(v=>v) ? `<button class="btn btn-ghost btn-sm" onclick="CompaniesView.clearFilters()">Clear</button>` : ''}
          </div>

          ${companies.length ? `
            <table>
              <thead><tr>
                <th>Organization</th><th>NMLS ID</th><th>State</th><th>Branches</th><th>Users</th><th>Programs</th><th>Status</th><th></th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="table-footer">
              <span class="table-count">${companies.length} organization${companies.length !== 1 ? 's' : ''}</span>
            </div>` : `
            <div class="table-empty">
              <div class="table-empty-icon">🏢</div>
              <p>No organizations match your search.</p>
            </div>`}
        </div>
      </div>

      <div id="company-modal-container"></div>
      <div id="company-panel-container"></div>`;
  },

  setFilter(key, value) {
    this._filter[key] = value;
    App.renderView('/companies');
  },

  clearFilters() {
    this._filter = { search: '', status: '' };
    App.renderView('/companies');
  },

  openDetail(companyId) {
    const c        = State.getCompany(companyId);
    if (!c) return;
    const branches = State.getBranchesByCompany(companyId);
    const users    = State.getUsersByCompany(companyId);
    const canEdit  = State.can('manageCompany') || State.can('editAny');

    const branchRows = branches.map(b => `
      <tr>
        <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address}</div></td>
        <td>${b.state}</td>
        <td>${b.userCount}</td>
        <td><span class="badge ${b.status === 'active' ? 'badge-active' : 'badge-pending'}">${b.status}</span></td>
      </tr>`).join('');

    const userRows = users.slice(0, 5).map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
            <div class="cell-primary">${Display.fullName(u)}</div>
          </div>
        </td>
        <td><span class="role-badge ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
        <td><span class="badge ${Display.onboardingStatusClass(u.onboardingStatus)}">${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
      </tr>`).join('');

    document.getElementById('company-panel-container').innerHTML = `
      <div class="side-panel-overlay" onclick="CompaniesView.closePanel()"></div>
      <div class="side-panel">
        <div class="side-panel-header">
          <div>
            <div class="modal-title">${c.name}</div>
            <div class="modal-subtitle">NMLS ${c.nmlsId} · ${c.emailDomain}</div>
          </div>
          <button class="modal-close" onclick="CompaniesView.closePanel()">×</button>
        </div>

        <div class="side-panel-body">
          <div class="info-grid" style="margin-bottom:20px">
            <div class="info-row"><div class="info-label">Status</div><div class="info-value"><span class="badge ${c.status === 'active' ? 'badge-active' : 'badge-pending'}">${c.status === 'active' ? 'Active' : 'Pending'}</span></div></div>
            <div class="info-row"><div class="info-label">State</div><div class="info-value">${c.stateOfIncorporation}</div></div>
            <div class="info-row"><div class="info-label">Primary Contact</div><div class="info-value">${c.primaryContact}</div></div>
            <div class="info-row"><div class="info-label">Email Domain</div><div class="info-value">${c.emailDomain}</div></div>
            <div class="info-row"><div class="info-label">Branches</div><div class="info-value">${branches.length}</div></div>
            <div class="info-row"><div class="info-label">Total Users</div><div class="info-value">${users.length}</div></div>
            <div class="info-row"><div class="info-label">Programs</div><div class="info-value">${c.programs.length ? c.programs.join(', ') : 'None'}</div></div>
            <div class="info-row"><div class="info-label">Created</div><div class="info-value">${Display.date(c.createdAt)}</div></div>
          </div>

          <div style="margin-bottom:4px" class="section-title">Compliance Documents</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px">
            ${c.complianceDocs.map(d => `<span class="tag">${d}</span>`).join('')}
            ${!c.complianceDocs.length ? '<span class="text-muted" style="font-size:12px">No docs on file</span>' : ''}
          </div>

          <div style="margin-bottom:4px" class="section-title">Branches</div>
          <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:20px">
            <table>
              <thead><tr><th>Branch</th><th>State</th><th>Users</th><th>Status</th></tr></thead>
              <tbody>${branchRows}</tbody>
            </table>
          </div>

          <div style="margin-bottom:4px" class="section-title">Team Members (${users.length})</div>
          <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden">
            <table>
              <thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>${userRows}${users.length > 5 ? `<tr><td colspan="3" style="padding:10px 16px;text-align:center;font-size:12px;color:var(--color-text-secondary)">+ ${users.length - 5} more</td></tr>` : ''}</tbody>
            </table>
          </div>
        </div>

        ${canEdit ? `
          <div class="side-panel-footer">
            <button class="btn btn-secondary" onclick="CompaniesView.closePanel()">Close</button>
            <button class="btn btn-primary" onclick="CompaniesView.closePanel();CompaniesView.openEditModal('${c.id}')">Edit Organization</button>
          </div>` : `
          <div class="side-panel-footer">
            <button class="btn btn-secondary" onclick="CompaniesView.closePanel()">Close</button>
          </div>`}
      </div>`;
  },

  openAddModal() {
    document.getElementById('company-modal-container').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)CompaniesView.closeModal()">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <div class="modal-title">Add Organization</div>
              <div class="modal-subtitle">Create a new loan origination company</div>
            </div>
            <button class="modal-close" onclick="CompaniesView.closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Company Name *</label>
                <input class="input" id="co-name" placeholder="Nashville Lending Group" />
              </div>
              <div class="form-group">
                <label>NMLS ID *</label>
                <input class="input" id="co-nmls" placeholder="1234567" />
              </div>
              <div class="form-group">
                <label>State of Incorporation *</label>
                <select class="select-input" id="co-state">
                  <option value="">State…</option>
                  ${['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => `<option>${s}</option>`).join('')}
                </select>
              </div>
              <div class="form-group form-full">
                <label>Company Email Domain *</label>
                <input class="input" id="co-domain" placeholder="company.com" />
                <div class="form-hint">All users at this company must have emails matching this domain</div>
              </div>
              <div class="form-group">
                <label>Primary Contact Name</label>
                <input class="input" id="co-contact" placeholder="Full name" />
              </div>
              <div class="form-group form-full">
                <label>Compliance Documents on File</label>
                <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:4px">
                  <label class="checkbox-group"><input type="checkbox" id="co-doc-w9" /> W-9</label>
                  <label class="checkbox-group"><input type="checkbox" id="co-doc-broker" /> Broker Agreement</label>
                  <label class="checkbox-group"><input type="checkbox" id="co-doc-eo" /> E&amp;O Insurance</label>
                  <label class="checkbox-group"><input type="checkbox" id="co-doc-license" /> State License</label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="CompaniesView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="CompaniesView.submitAdd()">Create Organization</button>
          </div>
        </div>
      </div>`;
  },

  submitAdd() {
    const name    = document.getElementById('co-name')?.value.trim();
    const nmlsId  = document.getElementById('co-nmls')?.value.trim();
    const state   = document.getElementById('co-state')?.value;
    const domain  = document.getElementById('co-domain')?.value.trim();
    const contact = document.getElementById('co-contact')?.value.trim();
    const docs    = [];
    if (document.getElementById('co-doc-w9')?.checked)     docs.push('W-9');
    if (document.getElementById('co-doc-broker')?.checked) docs.push('Broker Agreement');
    if (document.getElementById('co-doc-eo')?.checked)     docs.push('E&O Insurance');
    if (document.getElementById('co-doc-license')?.checked) docs.push('State License');

    if (!name || !nmlsId || !state || !domain) {
      alert('Please fill in all required fields.');
      return;
    }

    State.addCompany({ name, nmlsId, stateOfIncorporation: state, emailDomain: domain, primaryContact: contact, complianceDocs: docs });
    this.closeModal();
    UsersView.showSuccess(`Organization "${name}" created`);
    App.renderView('/companies');
  },

  openEditModal(companyId) {
    const c = State.getCompany(companyId);
    if (!c) return;

    document.getElementById('company-modal-container').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)CompaniesView.closeModal()">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <div class="modal-title">Edit Organization</div>
              <div class="modal-subtitle">${c.name}</div>
            </div>
            <button class="modal-close" onclick="CompaniesView.closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Company Name</label>
                <input class="input" id="edit-co-name" value="${c.name}" />
              </div>
              <div class="form-group">
                <label>NMLS ID</label>
                <input class="input" id="edit-co-nmls" value="${c.nmlsId}" />
              </div>
              <div class="form-group">
                <label>Status</label>
                <select class="select-input" id="edit-co-status">
                  <option value="active" ${c.status==='active'?'selected':''}>Active</option>
                  <option value="pending" ${c.status==='pending'?'selected':''}>Pending</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label>Email Domain</label>
                <input class="input" id="edit-co-domain" value="${c.emailDomain}" />
              </div>
              <div class="form-group">
                <label>Primary Contact</label>
                <input class="input" id="edit-co-contact" value="${c.primaryContact || ''}" />
              </div>
              <div class="form-group form-full">
                <label>Enabled Programs</label>
                <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:4px">
                  <label class="checkbox-group"><input type="checkbox" id="edit-co-prog-std" ${c.programs.includes('Standard HEI')?'checked':''} /> Standard HEI</label>
                  <label class="checkbox-group"><input type="checkbox" id="edit-co-prog-jumbo" ${c.programs.includes('Jumbo HEI')?'checked':''} /> Jumbo HEI</label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="CompaniesView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="CompaniesView.submitEdit('${companyId}')">Save Changes</button>
          </div>
        </div>
      </div>`;
  },

  submitEdit(companyId) {
    const name    = document.getElementById('edit-co-name')?.value.trim();
    const nmlsId  = document.getElementById('edit-co-nmls')?.value.trim();
    const status  = document.getElementById('edit-co-status')?.value;
    const domain  = document.getElementById('edit-co-domain')?.value.trim();
    const contact = document.getElementById('edit-co-contact')?.value.trim();
    const programs = [];
    if (document.getElementById('edit-co-prog-std')?.checked)   programs.push('Standard HEI');
    if (document.getElementById('edit-co-prog-jumbo')?.checked) programs.push('Jumbo HEI');

    State.updateCompany(companyId, { name, nmlsId, status, emailDomain: domain, primaryContact: contact, programs });
    this.closeModal();
    this.closePanel();
    UsersView.showSuccess('Organization updated');
    App.renderView('/companies');
  },

  closeModal() {
    const mc = document.getElementById('company-modal-container');
    if (mc) mc.innerHTML = '';
  },

  closePanel() {
    const pc = document.getElementById('company-panel-container');
    if (pc) pc.innerHTML = '';
  },
};
