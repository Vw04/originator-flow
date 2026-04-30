/* ============================================================
   HOMIUM ORIGINATOR FLOW — Origination Companies Section
   Wrapper with company list + drill-down detail view
   ============================================================ */

const OriginationCompaniesView = {
  _selectedCompanyId: null,
  _activeTab: 'overview',

  render(fullPath) {
    const path = fullPath || '/origination-companies';
    const role = State.getRole();
    const currentUser = State.getCurrentUser();

    // Parse company ID from path: /origination-companies/co-001
    const segments = path.replace('/origination-companies', '').split('/').filter(Boolean);
    const first = segments[0] || null;

    // OC onboarding wizard route — only platform-side roles can launch it
    if (first === 'new') {
      if (!State.can('manageCompany')) return this._renderList();
      return OCWizardView.render();
    }

    const companyId = first;

    // prog_admin auto-drills into their own company
    if (role === 'prog_admin' && !companyId && currentUser?.companyId) {
      this._selectedCompanyId = currentUser.companyId;
      return this._renderDetail(currentUser.companyId);
    }

    if (companyId) {
      this._selectedCompanyId = companyId;
      return this._renderDetail(companyId);
    }

    this._selectedCompanyId = null;
    this._activeTab = 'overview';
    return this._renderList();
  },

  /* ---- Company List (reuses CompaniesView) ---- */
  _renderList() {
    CompaniesView._clickMode = 'navigate';
    const html = CompaniesView.render();
    CompaniesView._clickMode = 'panel';
    return html;
  },

  /* ---- Company Detail with sub-tabs ---- */
  _renderDetail(companyId) {
    const c = State.getCompany(companyId);
    if (!c) return '<div class="page-body"><p>Company not found.</p></div>';

    const role = State.getRole();
    const canEdit = State.can('manageCompany') || State.can('editAny');
    const showBack = role !== 'prog_admin'; // prog_admin has no list to go back to

    // Spec §6: Program Admin manages OC config screens. Round 2: the
    // Access tab was dropped — program enablement now lives in Programs.
    const tabs = [
      { key: 'overview',    label: 'Overview' },
      { key: 'branches',    label: 'Branches' },
      { key: 'users',       label: 'Users' },
      { key: 'programs',    label: 'Programs' },
      { key: 'settings',    label: 'Settings' },
    ];
    if (this._activeTab === 'permissions' || this._activeTab === 'access') this._activeTab = 'programs';

    const tabsHtml = tabs.map(t =>
      `<div class="section-tab ${t.key === this._activeTab ? 'active' : ''}"
            onclick="OriginationCompaniesView.switchTab('${t.key}')">${t.label}</div>`
    ).join('');

    let content;
    switch (this._activeTab) {
      case 'overview':    content = this._renderOverview(c, canEdit); break;
      case 'branches':    content = BranchesView.render({ companyId }); break;
      case 'users':       content = UsersView.render({ companyId, roles: ['prog_admin', 'lo', 'lp'] }); break;
      case 'programs':    content = this._renderPrograms(c, canEdit); break;
      case 'settings':    content = this._renderSettings(c, canEdit); break;
      default:            content = this._renderOverview(c, canEdit);
    }

    const breadcrumb = showBack ? `
      <div class="breadcrumb">
        <span class="breadcrumb-link" onclick="Router.navigate('/origination-companies')">Origination Companies</span>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">${c.name}</span>
      </div>` : '';

    return `
      ${breadcrumb}
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">${c.name}</div>
            <div class="page-subtitle">NMLS ${c.nmlsId} · ${c.emailDomain}</div>
          </div>
          <div class="page-header-actions">
            ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="CompaniesView.openEditModal('${c.id}')">Edit Company</button>` : ''}
          </div>
        </div>
      </div>
      <div class="section-tabs">${tabsHtml}</div>
      <div class="page-body">${content}</div>
      <div id="company-modal-container"></div>
      <div id="company-panel-container"></div>`;
  },

  /* ---- Overview tab ---- */
  _renderOverview(c, canEdit) {
    const branches = State.getBranchesByCompany(c.id);
    const users = State.getUsersByCompany(c.id);
    const activeUsers = users.filter(u => u.onboardingStatus === 'active').length;
    const pendingUsers = users.filter(u => !['active', 'suspended'].includes(u.onboardingStatus)).length;

    const ocLpmIds = State.getOcEnablement(c.id);
    const enabledLPMs = ocLpmIds.map(id => State.getLPM(id)).filter(Boolean);
    const enabledProgramIds = [...new Set(enabledLPMs.map(l => l.programId))];
    const enabledPrograms = enabledProgramIds.map(id => State.getLoanProgram(id)).filter(Boolean);

    // Round 2: count expiring licenses for the At-a-Glance chip only —
    // the standalone watchlist card was dropped per user feedback.
    const today = new Date();
    const branchIds = new Set(branches.map(b => b.id));
    const branchUsers = users.filter(u => {
      const assignments = State.getBranchAssignments(u.id);
      return assignments.some(a => branchIds.has(a.branchId));
    });
    let expSoonCount = 0;
    branchUsers.forEach(u => {
      (u.licenses || []).forEach(lic => {
        const status = State.getLicenseExpiryStatus(lic, today);
        if (status && ['critical', 'warning', 'soon', 'expired', 'inactive'].includes(status.tier)) {
          expSoonCount++;
        }
      });
    });
    const lastSync = c.lastNmlsSync ? Display.relativeTime(c.lastNmlsSync) : '—';

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card">
          <div class="card-title" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
            <span>Company Details</span>
            <span style="font-size:11px;color:var(--color-text-muted);font-weight:500">
              <span class="status-dot" style="background:var(--color-success);display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px"></span>
              NMLS sync: ${lastSync}
            </span>
          </div>
          <div class="info-grid">
            <div class="info-row"><div class="info-label">Status</div><div class="info-value"><span class="badge ${c.status === 'active' ? 'badge-active' : 'badge-pending'}">${c.status === 'active' ? 'Active' : 'Pending Setup'}</span></div></div>
            <div class="info-row"><div class="info-label">NMLS ID</div><div class="info-value">${c.nmlsId}</div></div>
            <div class="info-row"><div class="info-label">State of Incorporation</div><div class="info-value">${c.stateOfIncorporation}</div></div>
            <div class="info-row"><div class="info-label">Address</div><div class="info-value">${[c.address1, c.address2, [c.city, c.state, c.zip].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || '—'}</div></div>
            <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${c.contactPhone || '—'}</div></div>
            <div class="info-row"><div class="info-label">Website</div><div class="info-value">${c.website ? `<a href="${c.website}" target="_blank" style="color:var(--color-primary)">${c.website.replace(/^https?:\/\//, '')}</a>` : '—'}</div></div>
            <div class="info-row"><div class="info-label">Primary Contact</div><div class="info-value">${c.primaryContact}</div></div>
            <div class="info-row"><div class="info-label">Email Domain</div><div class="info-value">${c.emailDomain}</div></div>
            <div class="info-row"><div class="info-label">Created</div><div class="info-value">${Display.date(c.createdAt)}</div></div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="card">
            <div class="card-title" style="margin-bottom:14px">At a Glance</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center">
              <div>
                <div style="font-size:24px;font-weight:700;color:var(--color-primary)">${branches.length}</div>
                <div style="font-size:11px;color:var(--color-text-secondary)">Branches</div>
              </div>
              <div>
                <div style="font-size:24px;font-weight:700;color:var(--color-primary)">${activeUsers}</div>
                <div style="font-size:11px;color:var(--color-text-secondary)">Active Users</div>
              </div>
              <div>
                <div style="font-size:24px;font-weight:700;color:${pendingUsers > 0 ? 'var(--color-warning)' : 'var(--color-primary)'}">${pendingUsers}</div>
                <div style="font-size:11px;color:var(--color-text-secondary)">Pending</div>
              </div>
              <div>
                <div style="font-size:24px;font-weight:700;color:${expSoonCount ? 'var(--color-warning)' : 'var(--color-text-muted)'}">${expSoonCount}</div>
                <div style="font-size:11px;color:var(--color-text-secondary)">Lic. ≤60d</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title" style="margin-bottom:10px">Compliance Documents</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${c.complianceDocs.map(d => `<span class="tag">${d}</span>`).join('')}
              ${!c.complianceDocs.length ? '<span class="text-muted" style="font-size:12px">No docs on file</span>' : ''}
            </div>
          </div>
        </div>
      </div>

      ${enabledLPMs.length === 0 ? `
        <div class="alert alert-warning" style="margin-bottom:20px;padding:12px 16px;background:#fff7e6;border-left:3px solid var(--color-warning);border-radius:6px;font-size:13px">
          <strong>No programs enabled yet.</strong> New applications cannot be created until the platform enables at least one program for this OC. Configure under <a href="javascript:void(0)" onclick="OriginationCompaniesView.switchTab('programs')" style="color:var(--color-primary);font-weight:600">Programs</a>.
        </div>` : ''}

      <div class="card" style="margin-bottom:24px">
        <div class="card-title" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
          <span>Programs Enabled <span style="color:var(--color-text-muted);font-weight:400;font-size:12px">(${enabledPrograms.length})</span></span>
          ${canEdit ? `<button class="btn btn-xs btn-ghost" onclick="OriginationCompaniesView.switchTab('programs')">Manage →</button>` : ''}
        </div>
        ${enabledPrograms.length
          ? `<div style="display:flex;flex-wrap:wrap;gap:8px">${enabledPrograms.map(p => `<span class="tag" style="font-size:13px;padding:5px 12px">${p.name}<span style="color:var(--color-text-muted);font-weight:400;margin-left:6px">${(p.allowedMarketIds || []).map(id => State.getMarket(id)?.code).filter(Boolean).join(', ')}</span></span>`).join('')}</div>`
          : '<div style="color:var(--color-text-muted);font-size:13px">No programs enabled.</div>'}
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:14px">Branches</div>
        <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden">
          <table>
            <thead><tr><th>Branch</th><th>Type</th><th>State</th><th>Users</th><th>NMLS Sync</th><th>Status</th></tr></thead>
            <tbody>
              ${branches.map(b => `
                <tr class="clickable" onclick="BranchesView.openDetail('${b.id}')">
                  <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address1 || b.address || ''}</div></td>
                  <td>${b.branchType || 'Branch'}</td>
                  <td>${b.state}</td>
                  <td>${b.userCount}</td>
                  <td style="color:var(--color-text-muted);font-size:11px">${b.lastNmlsSync ? Display.relativeTime(b.lastNmlsSync) : '—'}</td>
                  <td><span class="badge ${b.status === 'active' ? 'badge-active' : 'badge-pending'}">${b.status}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  /* ---- Programs tab — OC-level enablement editor ----
     Round 2: each platform-defined program is a single checkbox. Toggling
     enables/disables ALL of that program's allowed-market LPMs at the OC
     level. Branches inherit; per-branch enablement editor was dropped. */
  _renderPrograms(c, canEdit) {
    const ocLpmIds = State.getOcEnablement(c.id);
    const ocSet = new Set(ocLpmIds);
    const programs = State.getLoanPrograms();

    if (!programs.length) {
      return `<div class="card"><div style="text-align:center;color:var(--color-text-muted);padding:32px;font-size:13px">No platform-defined loan programs yet.${canEdit ? ' Define one under <a href="javascript:void(0)" onclick="Router.navigate(\'/system-config\')" style="color:var(--color-primary);font-weight:600">System Configuration</a>.' : ''}</div></div>`;
    }

    const rows = programs.map(p => {
      const lpmsForProgram = State.getLPMsForProgram(p.id);
      const isFullyEnabled = lpmsForProgram.length > 0 && lpmsForProgram.every(l => ocSet.has(l.id));
      const isPartialEnabled = !isFullyEnabled && lpmsForProgram.some(l => ocSet.has(l.id));
      const marketsLabel = (p.allowedMarketIds || []).map(id => State.getMarket(id)?.code).filter(Boolean).join(', ');
      return `
        <label style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--color-border-light);cursor:${canEdit ? 'pointer' : 'default'}">
          <input type="checkbox" ${isFullyEnabled ? 'checked' : ''} ${isPartialEnabled && !isFullyEnabled ? 'data-indeterminate="1"' : ''} ${canEdit ? '' : 'disabled'}
                 onchange="OriginationCompaniesView._toggleProgramEnabled('${c.id}', '${p.id}', this.checked)"
                 style="width:16px;height:16px;cursor:${canEdit ? 'pointer' : 'not-allowed'};flex-shrink:0">
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:600;color:var(--color-text)">${p.name}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">
              Markets: ${marketsLabel || '—'} · ${lpmsForProgram.length} program-market pair${lpmsForProgram.length === 1 ? '' : 's'}
            </div>
          </div>
          ${isFullyEnabled ? '<span class="badge badge-active" style="flex-shrink:0">Enabled</span>' : isPartialEnabled ? '<span class="badge badge-pending" style="flex-shrink:0">Partial</span>' : ''}
        </label>`;
    }).join('');

    return `
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:16px 18px;border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between">
          <div>
            <div class="card-title" style="margin-bottom:2px">Programs Enabled</div>
            <div style="font-size:12px;color:var(--color-text-muted)">Toggle the loan programs available to this OC. Branches inherit. Loan Officers must hold an active NMLS license in a program's market to originate.</div>
          </div>
        </div>
        ${rows}
      </div>`;
  },

  _toggleProgramEnabled(ocId, programId, on) {
    const lpms = State.getLPMsForProgram(programId).map(l => l.id);
    const cur = new Set(State.getOcEnablement(ocId));
    if (on) lpms.forEach(id => cur.add(id));
    else    lpms.forEach(id => cur.delete(id));
    State.setOcEnablement(ocId, [...cur]);
    App.renderView(Router.getCurrentPath());
  },

  /* ---- Settings tab — OC preferences ---- */
  _renderSettings(c, canEdit) {
    const disabled = canEdit ? '' : 'disabled';
    return `
      <div class="card" style="max-width:720px">
        <div class="card-title" style="margin-bottom:14px">OC Preferences</div>
        <div class="form-grid">
          <div class="form-group form-full">
            <label>Allowed Email Domains</label>
            <input type="text" class="input" value="${(c.emailDomain || '') + (c.ccEmails?.length ? ', ' + c.ccEmails.map(e => e.split('@')[1]).filter(Boolean).join(', ') : '')}" ${disabled}>
            <div class="form-hint">Invited users must use one of these domains.</div>
          </div>
          <div class="form-group">
            <label>Require MFA</label>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500">
              <input type="checkbox" checked ${disabled}> Enforce two-factor authentication
            </label>
          </div>
          <div class="form-group">
            <label>Account Manager (Homium)</label>
            <input type="text" class="input" value="Jordan Lee" ${disabled}>
          </div>
          <div class="form-group form-full">
            <label>Notification Preferences</label>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:13px">
              <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked ${disabled}> LO license expiring (60/30/7-day)</label>
              <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked ${disabled}> License revocation</label>
              <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked ${disabled}> New invites pending platform approval</label>
              <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" ${disabled}> Daily NMLS sync digest</label>
            </div>
          </div>
        </div>
        <div style="margin-top:20px;font-size:11px;color:var(--color-text-muted)">
          Settings persist to State only; mockup environment does not write to a backend.
        </div>
      </div>`;
  },

  switchTab(tab) {
    this._activeTab = tab;
    App.renderView(Router.getCurrentPath());
  },
};
