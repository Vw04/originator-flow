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

    // Spec §6: Program Admin manages OC config screens; Access replaces
    // the old Permissions tab and uses the v1.2 enablement model.
    const tabs = [
      { key: 'overview',    label: 'Overview' },
      { key: 'branches',    label: 'Branches' },
      { key: 'users',       label: 'Users' },
      { key: 'access',      label: 'Access' },
      { key: 'programs',    label: 'Programs' },
      { key: 'settings',    label: 'Settings' },
    ];
    if (this._activeTab === 'permissions') this._activeTab = 'access';

    const tabsHtml = tabs.map(t =>
      `<div class="section-tab ${t.key === this._activeTab ? 'active' : ''}"
            onclick="OriginationCompaniesView.switchTab('${t.key}')">${t.label}</div>`
    ).join('');

    let content;
    switch (this._activeTab) {
      case 'overview':    content = this._renderOverview(c, canEdit); break;
      case 'branches':    content = BranchesView.render({ companyId }); break;
      case 'users':       content = UsersView.render({ companyId, roles: ['prog_admin', 'lo', 'lp'] }); break;
      case 'access':      content = OCAccessView.render(companyId); break;
      case 'programs':    content = this._renderPrograms(c); break;
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

    // §1.4: surface enablement intersection + license expiry callouts
    const ocLpmIds = State.getOcEnablement(c.id);
    const allMarkets = State.getMarkets();
    const allPrograms = State.getLoanPrograms();
    const enabledLPMs = ocLpmIds.map(id => State.getLPM(id)).filter(Boolean);
    const enabledProgramIds = [...new Set(enabledLPMs.map(l => l.programId))];
    const enabledMarketIds = [...new Set(enabledLPMs.map(l => l.marketId))];

    // Branch users → license expiry watchlist
    const today = new Date();
    const branchIds = new Set(branches.map(b => b.id));
    const branchUsers = users.filter(u => {
      const assignments = State.getBranchAssignments(u.id);
      return assignments.some(a => branchIds.has(a.branchId));
    });
    const expiringLicenses = [];
    branchUsers.forEach(u => {
      (u.licenses || []).forEach(lic => {
        const status = State.getLicenseExpiryStatus(lic, today);
        if (status && ['critical', 'warning', 'soon', 'expired', 'inactive'].includes(status.tier)) {
          expiringLicenses.push({ user: u, license: lic, status });
        }
      });
    });
    expiringLicenses.sort((a, b) => a.status.days - b.status.days);
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
                <div style="font-size:24px;font-weight:700;color:${expiringLicenses.length ? 'var(--color-warning)' : 'var(--color-text-muted)'}">${expiringLicenses.length}</div>
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

      ${c.status !== 'active' && enabledLPMs.length === 0 ? `
        <div class="alert alert-warning" style="margin-bottom:20px;padding:12px 16px;background:#fff7e6;border-left:3px solid var(--color-warning);border-radius:6px;font-size:13px">
          <strong>Pending platform enablement.</strong> No LoanProgram-Markets are enabled for this OC yet. New applications cannot be created until at least one (program × market) pair is enabled. Configure under <a href="javascript:void(0)" onclick="OriginationCompaniesView.switchTab('access')" style="color:var(--color-primary);font-weight:600">Access</a>.
        </div>` : ''}

      <div class="card" style="margin-bottom:24px">
        <div class="card-title" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
          <span>Enablement Summary <span style="color:var(--color-text-muted);font-weight:400;font-size:12px">(${enabledLPMs.length} LPMs across ${enabledProgramIds.length} programs / ${enabledMarketIds.length} markets)</span></span>
          ${canEdit ? `<button class="btn btn-xs btn-ghost" onclick="OriginationCompaniesView.switchTab('access')">Edit →</button>` : ''}
        </div>
        ${this._renderEnablementMiniGrid(ocLpmIds, allPrograms, allMarkets)}
      </div>

      ${expiringLicenses.length ? `
      <div class="card" style="margin-bottom:24px">
        <div class="card-title" style="margin-bottom:14px">License Expiry Watchlist</div>
        <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden">
          <table>
            <thead><tr><th>Loan Officer</th><th>Market</th><th>Status</th><th>Renewal</th><th>Last Sync</th></tr></thead>
            <tbody>
              ${expiringLicenses.slice(0, 8).map(({ user: u, license, status }) => {
                const mkt = State.getMarket(license.marketId);
                const tierColor = status.tier === 'critical' || status.tier === 'expired' || status.tier === 'inactive'
                  ? 'var(--color-danger)'
                  : status.tier === 'warning' ? 'var(--color-warning)' : 'var(--color-text)';
                const label = status.tier === 'expired' ? `Expired ${-status.days}d ago`
                  : status.tier === 'inactive' ? 'Inactive'
                  : `${status.days}d`;
                return `
                  <tr class="clickable" onclick="ProfileView.open('${u.id}')">
                    <td><div class="cell-primary">${Display.fullName(u)}</div></td>
                    <td>${mkt?.code || '—'} · ${mkt?.name || ''}</td>
                    <td style="color:${tierColor};font-weight:600">${label}</td>
                    <td>${Display.date(license.renewalDate)}</td>
                    <td style="color:var(--color-text-muted);font-size:11px">${Display.relativeTime(license.lastSync)}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}

      <div class="card">
        <div class="card-title" style="margin-bottom:14px">Branches</div>
        <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden">
          <table>
            <thead><tr><th>Branch</th><th>Type</th><th>State</th><th>LPMs Enabled</th><th>Users</th><th>Last Synced</th><th>Status</th></tr></thead>
            <tbody>
              ${branches.map(b => {
                const brEnab = State.getBranchEnablement(b.id);
                const narrowed = brEnab.length < ocLpmIds.length;
                return `
                <tr class="clickable" onclick="BranchesView.openDetail('${b.id}')">
                  <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address1 || b.address || ''}</div></td>
                  <td>${b.branchType || 'Branch'}</td>
                  <td>${b.state}</td>
                  <td><span class="tag" style="${narrowed ? 'background:#fff7e6;color:#a35c00' : ''}">${brEnab.length} / ${ocLpmIds.length}${narrowed ? ' · narrowed' : ''}</span></td>
                  <td>${b.userCount}</td>
                  <td style="color:var(--color-text-muted);font-size:11px">${b.lastNmlsSync ? Display.relativeTime(b.lastNmlsSync) : '—'}</td>
                  <td><span class="badge ${b.status === 'active' ? 'badge-active' : 'badge-pending'}">${b.status}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  /* ---- Enablement mini-grid (read-only program × market checkbox grid) ---- */
  _renderEnablementMiniGrid(ocLpmIds, programs, markets) {
    const ocSet = new Set(ocLpmIds);
    const supportedMarkets = markets.filter(m => m.supported);
    if (!programs.length || !supportedMarkets.length) {
      return '<div style="color:var(--color-text-muted);font-size:13px;padding:16px;text-align:center">No programs or markets configured.</div>';
    }
    const headerRow = `<tr><th style="text-align:left;font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em;padding:6px 10px">Program</th>${supportedMarkets.map(m => `<th style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em;padding:6px 10px;text-align:center">${m.code}</th>`).join('')}</tr>`;
    const rows = programs.map(p => {
      const cells = supportedMarkets.map(m => {
        const lpm = State.getLPMs().find(x => x.programId === p.id && x.marketId === m.id);
        if (!lpm) {
          // Not allowed at platform level
          return `<td style="text-align:center;padding:6px 10px;color:var(--color-text-muted)" title="Not available — program ${p.name} cannot exist in ${m.name}">—</td>`;
        }
        const isOn = ocSet.has(lpm.id);
        return `<td style="text-align:center;padding:6px 10px">${isOn ? '<span style="color:var(--color-success);font-size:14px">●</span>' : '<span style="color:var(--color-text-muted);font-size:14px">○</span>'}</td>`;
      }).join('');
      return `<tr><td style="padding:6px 10px;font-size:13px;color:var(--color-text);font-weight:500">${p.name}</td>${cells}</tr>`;
    }).join('');
    return `<table style="width:100%;border-collapse:collapse"><thead>${headerRow}</thead><tbody>${rows}</tbody></table>`;
  },

  /* ---- Programs tab — read-only summary linking back to Access ---- */
  _renderPrograms(c) {
    const ocLpmIds = State.getOcEnablement(c.id);
    const branches = State.getBranchesByCompany(c.id);
    const programs = State.getLoanPrograms();
    const enabledProgramIds = new Set(ocLpmIds.map(id => State.getLPM(id)?.programId).filter(Boolean));
    const programRows = programs.filter(p => enabledProgramIds.has(p.id)).map(p => {
      const lpms = State.getLPMs().filter(l => l.programId === p.id && ocLpmIds.includes(l.id));
      const marketsList = lpms.map(l => State.getMarket(l.marketId)?.code).filter(Boolean).join(', ');
      const branchNarrow = branches.filter(b => {
        const brSet = new Set(State.getBranchEnablement(b.id));
        return lpms.some(l => brSet.has(l.id));
      }).length;
      return `
        <tr>
          <td><div class="cell-primary">${p.name}</div><div class="cell-secondary">Token: ${p.token} · Code: ${p.code}</div></td>
          <td>${marketsList || '—'}</td>
          <td>${lpms.length}</td>
          <td>${branchNarrow} of ${branches.length}</td>
          <td><span class="badge ${p.status === 'active' ? 'badge-active' : 'badge-pending'}">${p.status}</span></td>
        </tr>`;
    }).join('');
    return `
      <div class="card" style="margin-bottom:20px">
        <div class="card-title" style="margin-bottom:6px">Enabled Programs</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:14px">
          (program × market) pairs enabled at the OC level. Branch-level narrowing happens in the
          <a href="javascript:void(0)" onclick="OriginationCompaniesView.switchTab('access')" style="color:var(--color-primary);font-weight:600">Access</a> tab.
        </div>
        <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden">
          <table>
            <thead><tr><th>Program</th><th>Markets</th><th>LPMs</th><th>Branches enabled</th><th>Status</th></tr></thead>
            <tbody>${programRows || '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:24px;font-size:13px">No programs enabled. Configure under <a href="javascript:void(0)" onclick="OriginationCompaniesView.switchTab(\'access\')" style="color:var(--color-primary)">Access</a>.</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
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
