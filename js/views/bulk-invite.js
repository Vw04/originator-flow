/* ============================================================
   HOMIUM ORIGINATOR FLOW — Bulk Invite View
   Two-stage flow:
     Stage 1 — paste emails, validate against company domain
     Stage 2 — per-row role / branch / BM / NMLS, with bulk-apply
   Email is the only required field; everything else is filled by
   the invitee on accept, or defaults sensibly here.
   ============================================================ */

const BulkInviteView = {
  _state: null,
  _returnPath: null,

  /* External entry point — called from triggers (users/dashboard/companies/onboarding) */
  start({ companyId = '', returnPath = null } = {}) {
    this._returnPath = returnPath || null;
    const qp = new URLSearchParams();
    if (companyId) qp.set('company', companyId);
    const qs = qp.toString();
    Router.navigate('/bulk-invite' + (qs ? '?' + qs : ''));
  },

  render(path) {
    const qIdx = (path || '').indexOf('?');
    const qs = qIdx >= 0 ? new URLSearchParams(path.slice(qIdx + 1)) : new URLSearchParams();
    const urlCompanyId = qs.get('company') || '';

    if (!this._state || (urlCompanyId && this._state.companyId !== urlCompanyId)) {
      this._state = {
        stage: 1,
        companyId: urlCompanyId,
        rawEmails: '',
        parsed: null,
        rows: [],
        nextRowId: 0,
      };
    }
    return this._state.stage === 1 ? this._renderStage1() : this._renderStage2();
  },

  _rerender() {
    App.renderView('/bulk-invite');
  },

  _cancel() {
    const target = this._returnPath || (this._state?.companyId
      ? '/origination-companies/' + this._state.companyId
      : '/origination-companies');
    this._state = null;
    this._returnPath = null;
    Router.navigate(target);
  },

  /* ---- Stage 1 ---- */

  _renderStage1() {
    const s = this._state;
    const company = s.companyId ? State.getCompany(s.companyId) : null;
    const companyName = company?.name || '';
    const companyDomain = company?.emailDomain || '';
    const companies = State.getCompanies();
    const parsed = s.parsed;

    const titleSuffix = companyName ? ` to ${companyName}` : '';
    const domainHint = companyDomain
      ? `Separate by comma, semicolon, space, or newline. Domain must match <strong>${companyDomain}</strong>.`
      : `Separate by comma, semicolon, space, or newline.`;

    const warnings = parsed && (parsed.invalid.length || parsed.duplicates.length) ? `
      <div class="bulk-invite-warnings">
        <div style="font-weight:600;margin-bottom:6px">These were not added:</div>
        ${parsed.invalid.map(e => `<span class="tag">${e} <span style="opacity:.7">— invalid or wrong domain</span></span>`).join('')}
        ${parsed.duplicates.map(e => `<span class="tag">${e} <span style="opacity:.7">— duplicate</span></span>`).join('')}
      </div>` : '';

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Invite Users${titleSuffix}</div>
            <div class="page-subtitle">Step 1 of 2 — paste email addresses</div>
          </div>
        </div>
      </div>
      <div class="page-body">
        <div style="max-width:720px">
          ${!s.companyId ? `
            <div class="form-group">
              <label>Company *</label>
              <select class="select-input" onchange="BulkInviteView._setCompany(this.value)">
                <option value="">Select company…</option>
                ${companies.map(c => `<option value="${c.id}" ${s.companyId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>` : ''}

          <div class="form-group">
            <label>Paste email addresses</label>
            <textarea class="input" rows="10" placeholder="alice@${companyDomain || 'company.com'}, bob@${companyDomain || 'company.com'}&#10;carol@${companyDomain || 'company.com'}"
              oninput="BulkInviteView._setRawEmails(this.value)">${s.rawEmails}</textarea>
            <div class="form-hint">${domainHint}</div>
          </div>

          ${warnings}

          <div class="form-actions" style="display:flex;gap:8px;margin-top:16px">
            <button class="btn btn-secondary" onclick="BulkInviteView._cancel()">Cancel</button>
            <button class="btn btn-primary" onclick="BulkInviteView._continueToStage2()">Continue →</button>
          </div>
        </div>
      </div>`;
  },

  _setCompany(value) {
    this._state.companyId = value;
    this._state.parsed = null;
    this._rerender();
  },

  _setRawEmails(value) {
    this._state.rawEmails = value;
  },

  _parseEmails(raw, companyDomain) {
    const tokens = (raw || '').split(/[\s,;]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
    const seen = new Set();
    const valid = [], invalid = [], duplicates = [];
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const t of tokens) {
      if (!re.test(t))                                       { invalid.push(t); continue; }
      if (companyDomain && !t.endsWith('@' + companyDomain.toLowerCase())) { invalid.push(t); continue; }
      if (seen.has(t))                                       { duplicates.push(t); continue; }
      seen.add(t); valid.push(t);
    }
    return { valid, invalid, duplicates };
  },

  _continueToStage2() {
    const s = this._state;
    if (!s.companyId) { alert('Please select a company.'); return; }
    const company = State.getCompany(s.companyId);
    s.parsed = this._parseEmails(s.rawEmails, company?.emailDomain || '');
    if (s.parsed.valid.length === 0) {
      this._rerender();
      return;
    }
    s.rows = s.parsed.valid.map(email => {
      s.nextRowId += 1;
      return {
        id: s.nextRowId,
        email,
        // Role + branch are required; default to empty so the inviter must
        // pick. Validation in _submitAll rejects rows missing either.
        role: '',
        branchId: '',
        branchManager: false,
        agentNmlsId: '',
        selected: false,
      };
    });
    s.stage = 2;
    this._rerender();
  },

  /* ---- Stage 2 ---- */

  _renderStage2() {
    const s = this._state;
    const company = State.getCompany(s.companyId);
    const companyName = company?.name || '';
    const branches = State.getBranchesByCompany(s.companyId);
    const total = s.rows.length;
    const selected = s.rows.filter(r => r.selected).length;
    const allSelected = total > 0 && selected === total;

    const branchOptions = branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Invite Users to ${companyName}</div>
            <div class="page-subtitle">Step 2 of 2 — ${total} invitee${total === 1 ? '' : 's'}</div>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-ghost btn-sm" onclick="BulkInviteView._backToStage1()">← Back</button>
          </div>
        </div>
      </div>
      <div class="page-body">
        <div class="bulk-toolbar">
          <span class="bulk-toolbar-count">${selected} of ${total} selected</span>
          <select class="select-input" onchange="BulkInviteView._bulkSetBranch(this.value); this.value=''">
            <option value="">Set branch for selected…</option>
            ${branchOptions}
          </select>
          <select class="select-input" onchange="BulkInviteView._bulkSetRole(this.value); this.value=''">
            <option value="">Set role for selected…</option>
            <option value="lo">Loan Officer</option>
            <option value="standard">Standard</option>
          </select>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-secondary, var(--color-text-muted))">
            <input type="checkbox" onchange="BulkInviteView._bulkSetBM(this.checked)">
            Branch Manager (for selected)
          </label>
        </div>

        <div class="bulk-table-wrap">
          <table>
            <thead>
              <tr>
                <th class="col-checkbox"><input type="checkbox" ${allSelected ? 'checked' : ''} onchange="BulkInviteView._setSelectAll(this.checked)"></th>
                <th>Email</th>
                <th>Branch *</th>
                <th>Role *</th>
                <th>Branch Mgr</th>
                <th>NMLS ID</th>
                <th class="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              ${s.rows.map(r => this._renderRow(r, branches)).join('')}
            </tbody>
          </table>
        </div>

        <div class="form-actions" style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">
          <button class="btn btn-secondary" onclick="BulkInviteView._cancel()">Cancel</button>
          <button class="btn btn-primary" onclick="BulkInviteView._submitAll()">Send ${total} Invite${total === 1 ? '' : 's'}</button>
        </div>
      </div>`;
  },

  _renderRow(row, branches) {
    const isLO = row.role === 'lo';
    const isStd = row.role === 'standard';
    const branchOptions = branches.map(b =>
      `<option value="${b.id}" ${row.branchId === b.id ? 'selected' : ''}>${b.name}</option>`
    ).join('');
    const branchMissing = !row.branchId;
    const roleMissing = !row.role;
    return `
      <tr>
        <td class="col-checkbox">
          <input type="checkbox" ${row.selected ? 'checked' : ''}
            onchange="BulkInviteView._setRow(${row.id}, 'selected', this.checked)">
        </td>
        <td class="cell-primary">${row.email}</td>
        <td>
          <select class="select-input" style="${branchMissing ? 'border-color:var(--color-danger,#DC2626)' : ''}"
                  onchange="BulkInviteView._setRow(${row.id}, 'branchId', this.value)">
            <option value="">— Select branch —</option>
            ${branchOptions}
          </select>
        </td>
        <td>
          <select class="select-input" style="${roleMissing ? 'border-color:var(--color-danger,#DC2626)' : ''}"
                  onchange="BulkInviteView._setRow(${row.id}, 'role', this.value)">
            <option value="" ${roleMissing ? 'selected' : ''}>— Select role —</option>
            <option value="lo" ${isLO ? 'selected' : ''}>Loan Officer</option>
            <option value="standard" ${isStd ? 'selected' : ''}>Standard</option>
          </select>
        </td>
        <td style="text-align:center">
          <input type="checkbox" ${row.branchManager ? 'checked' : ''} ${!row.branchId ? 'disabled' : ''}
            onchange="BulkInviteView._setRow(${row.id}, 'branchManager', this.checked)">
        </td>
        <td>
          ${isLO
            ? `<input class="input" value="${row.agentNmlsId}" placeholder="optional"
                 oninput="BulkInviteView._setRow(${row.id}, 'agentNmlsId', this.value)">`
            : ''}
        </td>
        <td class="col-actions">
          <button class="btn btn-ghost btn-xs" onclick="BulkInviteView._removeRow(${row.id})" title="Remove">×</button>
        </td>
      </tr>`;
  },

  _backToStage1() {
    this._state.stage = 1;
    this._rerender();
  },

  _setRow(id, field, value) {
    const row = this._state.rows.find(r => r.id === id);
    if (!row) return;
    row[field] = value;
    if (field === 'branchId' && !value) row.branchManager = false;
    if (field === 'role') {
      // Re-render so the NMLS column appears/disappears
      this._rerender();
      return;
    }
    if (field === 'branchId' || field === 'selected') {
      this._rerender();
      return;
    }
    // For text inputs (NMLS), no re-render — preserves focus
  },

  _removeRow(id) {
    this._state.rows = this._state.rows.filter(r => r.id !== id);
    if (this._state.rows.length === 0) {
      this._state.stage = 1;
    }
    this._rerender();
  },

  _setSelectAll(checked) {
    this._state.rows.forEach(r => { r.selected = checked; });
    this._rerender();
  },

  _bulkSetRole(value) {
    if (!value) return;
    this._state.rows.forEach(r => { if (r.selected) r.role = value; });
    this._rerender();
  },

  _bulkSetBranch(value) {
    if (!value) return;
    this._state.rows.forEach(r => {
      if (!r.selected) return;
      r.branchId = value;
    });
    this._rerender();
  },

  _bulkSetBM(checked) {
    this._state.rows.forEach(r => {
      if (r.selected && r.branchId) r.branchManager = checked;
    });
    this._rerender();
  },

  /* ---- Submission ---- */

  _deriveName(email) {
    const local = (email.split('@')[0] || '').replace(/[^a-zA-Z0-9._-]/g, '');
    if (!local) return { firstName: '', lastName: '' };
    const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    if (local.includes('.')) {
      const [f, ...rest] = local.split('.');
      return { firstName: cap(f), lastName: cap(rest.join('.')) };
    }
    return { firstName: cap(local), lastName: '' };
  },

  _buildBranchAssignment(row) {
    if (!row.branchId) return [];
    if (row.role === 'lo') {
      return [{
        branchId: row.branchId,
        userType: 'lo',
        flags: { branchManager: !!row.branchManager },
        loAssignments: [{
          scope: 'personal',
          loIds: [],
          level: 'full',
          subflags: { canCreate: true, canSubmit: true, canWithdraw: true },
        }],
        allowNewOriginations: true,
        allowAccessToAllBranchActivity: false,
        eligibleLoanProductIds: [],
      }];
    }
    return [{
      branchId: row.branchId,
      userType: 'standard',
      flags: { branchManager: !!row.branchManager },
      loAssignments: [{
        scope: 'all_los',
        loIds: [],
        level: 'view',
        subflags: {},
      }],
      allowNewOriginations: false,
      allowAccessToAllBranchActivity: false,
      eligibleLoanProductIds: [],
    }];
  },

  _submitAll() {
    const s = this._state;
    if (!s.rows.length) return;
    const companyId = s.companyId;

    // Branch + Role are required for every row.
    const missing = s.rows.filter(r => !r.branchId || !r.role);
    if (missing.length) {
      alert(`Set Branch and Role on every row before sending. ${missing.length} row${missing.length === 1 ? '' : 's'} missing one or both.`);
      // Mark missing rows as selected so the inviter can spot them
      this._state.rows.forEach(r => { r.selected = (!r.branchId || !r.role); });
      this._rerender();
      return;
    }

    s.rows.forEach(row => {
      const { firstName, lastName } = this._deriveName(row.email);
      const branchAssignments = this._buildBranchAssignment(row);
      State.inviteUser({
        firstName,
        lastName,
        email: row.email,
        role: row.role === 'standard' ? 'lp' : 'lo',
        isProgramAdmin: false,
        companyId,
        branchId: row.branchId || null,
        title: '',
        phone: null,
        nmlsId: row.agentNmlsId || null,
        agentNmlsId: row.agentNmlsId || null,
        branchAssignments,
        licenses: [],
      });
    });

    const n = s.rows.length;
    UsersView.showSuccess(`Sent ${n} invite${n === 1 ? '' : 's'}`);

    const target = this._returnPath || ('/origination-companies/' + companyId);
    this._state = null;
    this._returnPath = null;
    Router.navigate(target);
  },
};
