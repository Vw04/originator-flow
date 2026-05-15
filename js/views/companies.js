/* ============================================================
   HOMIUM ORIGINATOR FLOW — Companies / Organizations View
   ============================================================ */

const CompaniesView = {
  LOAN_PROGRAMS: ['Utah Dream Fund', 'DC Dream Fund', 'Kentucky Dream Fund'],
  _filter: { search: '', status: '' },
  _sort: { col: null, dir: 'asc' },
  _clickMode: 'panel',  // 'panel' (side panel) | 'navigate' (drill-down)
  _headless: false,     // true → omit own page-header (used when embedded under a hub)

  setSort(col) {
    if (this._sort.col === col) {
      this._sort.dir = this._sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sort.col = col;
      this._sort.dir = 'asc';
    }
    App.renderView('/companies');
  },

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

    const s = this._sort;
    if (s.col) {
      const mul = s.dir === 'asc' ? 1 : -1;
      companies = [...companies].sort((a, b) => {
        if (s.col === 'name')   return mul * a.name.localeCompare(b.name);
        if (s.col === 'status') return mul * a.status.localeCompare(b.status);
        return 0;
      });
    }
    const thClass = (col) => `sortable${s.col === col ? ' sort-' + s.dir : ''}`;

    const rows = companies.map(c => {
      const branches = State.getBranchesByCompany(c.id);
      const users    = State.getUsersByCompany(c.id);
      const pending  = users.filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus));

      // Per spec §1.4: enabled (program × market) pairs at the OC level
      const ocLpms = State.getOcEnablement(c.id);
      const enabledProgramIds = new Set(ocLpms.map(id => State.getLPM(id)?.programId).filter(Boolean));
      const enabledPrograms = State.getLoanPrograms().filter(p => enabledProgramIds.has(p.id));
      // License expiry roll-up: count licenses on this OC's branch users expiring within 30d
      const branchIds = new Set(branches.map(b => b.id));
      const today = new Date();
      let expSoon = 0;
      users.forEach(u => {
        const assignments = State.getBranchAssignments(u.id);
        if (!assignments.some(a => branchIds.has(a.branchId))) return;
        (u.licenses || []).forEach(lic => {
          const s = State.getLicenseExpiryStatus(lic, today);
          if (s && (s.tier === 'critical' || s.tier === 'warning' || s.tier === 'expired')) expSoon++;
        });
      });
      // Compact 2-letter program code chips ("UT · DC · KY"). Use program.code
      // when present (schema field), else first 2 letters of program name.
      const programChips = enabledPrograms.length
        ? enabledPrograms.map(p => {
            const code = (p.code || p.name.replace(/[^A-Za-z]/g, '').slice(0, 2)).toUpperCase();
            return `<span class="program-chip" title="${p.name}">${code}</span>`;
          }).join('')
        : '<span class="text-muted">—</span>';
      const click = this._clickMode === 'navigate'
        ? `Router.navigate('/origination-companies/${c.id}')`
        : `CompaniesView.openDetail('${c.id}')`;
      return `
        <tr class="clickable" onclick="${click}">
          <td class="company-cell">
            <div class="cell-primary serif">${c.name}</div>
            <div class="cell-secondary">
              <span class="mono">NMLS ${c.nmlsId}</span>
              <span class="cell-dot">·</span>${c.stateOfIncorporation}
              <span class="cell-dot">·</span>${c.emailDomain}
            </div>
          </td>
          <td>${branches.length}</td>
          <td>
            ${users.length}
            ${pending.length ? `<span class="badge badge-pending" style="margin-left:6px">${pending.length} pending</span>` : ''}
          </td>
          <td><div class="program-chip-row">${programChips}</div></td>
          <td><span class="badge ${c.status === 'active' ? 'badge-active' : 'badge-pending'}">${c.status === 'active' ? 'Active' : 'Pending Setup'}</span></td>
          <td style="font-size:11px;color:var(--color-text-muted)">
            ${c.lastNmlsSync ? `<span class="status-dot" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-success);margin-right:4px"></span>${Display.relativeTime(c.lastNmlsSync)}` : '—'}
            ${expSoon ? `<div style="color:var(--color-warning);font-weight:600;margin-top:2px">${expSoon} lic ≤30d</div>` : ''}
          </td>
          <td>
            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();${click}">View</button>
          </td>
        </tr>`;
    }).join('');

    const header = this._headless ? '' : `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Origination Companies</div>
            <div class="page-subtitle">${companies.length} ${companies.length !== 1 ? 'companies' : 'company'}</div>
          </div>
          ${canEdit ? `
            <div class="page-header-actions">
              <button class="btn btn-primary btn-sm" onclick="Router.navigate('/origination-companies/new')">+ New Origination Company</button>
            </div>` : ''}
        </div>
      </div>`;

    const bodyOpen  = this._headless ? '' : '<div class="page-body">';
    const bodyClose = this._headless ? '' : '</div>';

    return `
      ${header}
      ${bodyOpen}
        <div class="table-container">
          <div class="filter-toolbar">
            <input class="filter-search" placeholder="Search companies…"
              value="${f.search}" oninput="CompaniesView.setFilter('search', this.value)" />
            <div style="position:relative">
              <button class="filter-menu-btn" onclick="CompaniesView.toggleFiltersMenu(event)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                Filters
              </button>
              <div class="filter-menu-panel" id="companies-filters-menu" style="display:none">
                <div class="filter-menu-section">
                  <div class="filter-menu-label">Status</div>
                  <div class="filter-menu-item${f.status==='active'?' active':''}" onclick="CompaniesView.setFilter('status','active')">Active</div>
                  <div class="filter-menu-item${f.status==='pending'?' active':''}" onclick="CompaniesView.setFilter('status','pending')">Pending</div>
                </div>
                ${Object.values(f).some(v=>v) ? `<div class="filter-menu-section" style="border-top:1px solid var(--color-border);padding-top:8px"><div class="filter-menu-item" onclick="CompaniesView.clearFilters()" style="color:var(--color-danger)">Clear All Filters</div></div>` : ''}
              </div>
            </div>
          </div>

          ${companies.length ? `
            <table class="entity-table">
              <thead><tr>
                <th class="${thClass('name')}" onclick="CompaniesView.setSort('name')" style="min-width:340px">Company</th>
                <th>Branches</th>
                <th>Users</th>
                <th>Programs</th>
                <th class="${thClass('status')}" onclick="CompaniesView.setSort('status')">Status</th>
                <th>NMLS Sync</th>
                <th></th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="table-footer">
              <span class="table-count">${companies.length} ${companies.length !== 1 ? 'companies' : 'company'}</span>
            </div>` : `
            <div class="table-empty">
              <div class="table-empty-icon"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><rect x="4" y="8" width="32" height="28" rx="2"/><path d="M12 8V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M12 20h16M12 28h10"/></svg></div>
              <p>No companies match your search.</p>
            </div>`}
        </div>
      ${bodyClose}

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

  toggleFiltersMenu(e) {
    e.stopPropagation();
    const el = document.getElementById('companies-filters-menu');
    if (!el) return;
    const open = el.style.display !== 'none';
    if (!open) {
      el.style.display = 'block';
      setTimeout(() => document.addEventListener('click', () => { el.style.display = 'none'; }, { once: true }), 0);
    } else { el.style.display = 'none'; }
  },

  openDetail(companyId) {
    const c        = State.getCompany(companyId);
    if (!c) return;
    const branches = State.getBranchesByCompany(companyId);
    const users    = State.getUsersByCompany(companyId);
    const canEdit  = State.can('manageCompany') || State.can('editAny');

    const branchRows = branches.map(b => `
      <tr class="clickable" onclick="BranchesView.openDetail('${b.id}')">
        <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address}</div></td>
        <td>${b.state}</td>
        <td>${b.userCount}</td>
        <td><span class="badge ${b.status === 'active' ? 'badge-active' : 'badge-pending'}">${b.status}</span></td>
      </tr>`).join('');

    const userRows = users.slice(0, 5).map(u => `
      <tr class="clickable" onclick="ProfileView.open('${u.id}')">
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
            <div class="cell-primary">${Display.fullName(u)}</div>
          </div>
        </td>
        <td><span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
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
            <button class="btn btn-primary" onclick="CompaniesView.closePanel();CompaniesView.openEditModal('${c.id}')">Edit Company</button>
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
              <div class="modal-title">Add Origination Company</div>
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
            <button class="btn btn-primary" onclick="CompaniesView.submitAdd()">Create Company</button>
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
    UsersView.showSuccess(`Company "${name}" created`);
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
              <div class="modal-title">Edit Origination Company</div>
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
                <select class="select-input" id="edit-co-contact">
                  <option value="">— Select team member —</option>
                  ${State.getUsersByCompany(companyId).map(u =>
                    `<option value="${Display.fullName(u)}" ${c.primaryContact === Display.fullName(u) ? 'selected' : ''}>${Display.fullName(u)} (${Display.roleName(u.role)})</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group form-full">
                <label>Enabled Programs</label>
                <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:4px">
                  ${CompaniesView.LOAN_PROGRAMS.map((p, i) => `<label class="checkbox-group"><input type="checkbox" id="edit-co-prog-${i}" value="${p}" ${c.programs.includes(p)?'checked':''} /> ${p}</label>`).join('')}
                </div>
              </div>
            </div>

            <hr class="divider" style="margin:16px 0" />
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);margin-bottom:12px">Add Branch</div>
            <div class="form-grid" id="add-branch-form" style="margin-bottom:8px">
              <div class="form-group">
                <label>Branch Name</label>
                <input class="input" id="new-br-name" placeholder="Main Branch" />
              </div>
              <div class="form-group">
                <label>State</label>
                <input class="input" id="new-br-state" placeholder="DC" maxlength="2" style="text-transform:uppercase" />
              </div>
              <div class="form-group form-full">
                <label>Address</label>
                <input class="input" id="new-br-address" placeholder="123 Main St, Washington, DC 20001" />
              </div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="CompaniesView.addBranchInline('${companyId}')">+ Add Branch</button>

            <hr class="divider" style="margin:16px 0" />
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);margin-bottom:8px">Invite User to this Company</div>
            <button class="btn btn-ghost btn-sm" onclick="CompaniesView.closeModal();BulkInviteView.start({ companyId: '${companyId}', returnPath: '/origination-companies/${companyId}' })">+ Invite User</button>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="CompaniesView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="CompaniesView.submitEdit('${companyId}')">Save Changes</button>
          </div>
        </div>
      </div>`;
  },

  addBranchInline(companyId) {
    const name    = document.getElementById('new-br-name')?.value.trim();
    const state   = document.getElementById('new-br-state')?.value.trim().toUpperCase();
    const address = document.getElementById('new-br-address')?.value.trim();
    if (!name) { alert('Branch name is required.'); return; }
    State.addBranch({ name, address: address || '', state: state || '', companyId, programs: [] });
    UsersView.showSuccess(`Branch "${name}" added`);
    // Clear fields
    ['new-br-name','new-br-state','new-br-address'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  },

  submitEdit(companyId) {
    const name    = document.getElementById('edit-co-name')?.value.trim();
    const nmlsId  = document.getElementById('edit-co-nmls')?.value.trim();
    const status  = document.getElementById('edit-co-status')?.value;
    const domain  = document.getElementById('edit-co-domain')?.value.trim();
    const contact = document.getElementById('edit-co-contact')?.value || '';
    const programs = this.LOAN_PROGRAMS.filter((p, i) => document.getElementById(`edit-co-prog-${i}`)?.checked);

    State.updateCompany(companyId, { name, nmlsId, status, emailDomain: domain, primaryContact: contact, programs });
    this.closeModal();
    this.closePanel();
    UsersView.showSuccess('Company updated');
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
