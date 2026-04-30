/* ============================================================
   HOMIUM ORIGINATOR FLOW — OC Onboarding Wizard
   Spec §6 / §1: Platform-operator-led flow for adding a new
   Origination Company. Six steps: NMLS lookup → confirm fields →
   enablement (program × market) → branches → first Program Admin
   → review + create.
   NMLS data is pre-populated from seed (no live API).
   ============================================================ */

const OCWizardView = {
  // Per-session wizard state
  _w: null,

  STEPS: [
    { key: 'lookup',     label: 'NMLS Lookup' },
    { key: 'confirm',    label: 'Confirm OC' },
    { key: 'enablement', label: 'Enablement' },
    { key: 'branches',   label: 'Branches' },
    { key: 'admin',      label: 'Program Admin' },
    { key: 'review',     label: 'Review & Create' },
  ],

  _initIfNeeded() {
    if (this._w) return;
    this._w = {
      step: 0,
      nmlsId: '',
      lookupResult: null,
      oc: { name: '', nmlsId: '', stateOfIncorporation: '', address1: '', address2: '', city: '', state: '', zip: '', contactPhone: '', website: '', emailDomain: '', ccEmails: '' },
      enabledLpmIds: new Set(),
      branches: [],
      admin: { firstName: '', lastName: '', email: '', title: 'Program Administrator', phone: '' },
      submitted: false,
    };
  },

  reset() { this._w = null; },

  render() {
    this._initIfNeeded();
    const w = this._w;
    const stepKey = this.STEPS[w.step].key;
    const stepBody =
        stepKey === 'lookup'     ? this._renderLookup()
      : stepKey === 'confirm'    ? this._renderConfirm()
      : stepKey === 'enablement' ? this._renderEnablement()
      : stepKey === 'branches'   ? this._renderBranches()
      : stepKey === 'admin'      ? this._renderAdmin()
      :                            this._renderReview();

    return `
      <div class="breadcrumb">
        <span class="breadcrumb-link" onclick="OCWizardView.cancel()">Origination Companies</span>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">New Origination Company</span>
      </div>
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">New Origination Company</div>
            <div class="page-subtitle">Onboard an OC, configure enablement, and invite the first Program Admin.</div>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-ghost btn-sm" onclick="OCWizardView.cancel()">Cancel</button>
          </div>
        </div>
      </div>

      <div class="section-tabs" style="margin-bottom:0">
        ${this.STEPS.map((s, i) => `
          <div class="section-tab ${i === w.step ? 'active' : ''} ${i < w.step ? 'completed' : ''}"
               onclick="OCWizardView.goto(${i})"
               style="${i > w.step ? 'opacity:.55;cursor:not-allowed' : ''}">
            <span style="font-size:11px;font-weight:700;color:var(--color-text-muted);margin-right:6px">${i + 1}</span>${s.label}
          </div>`).join('')}
      </div>

      <div class="page-body" style="max-width:1080px">
        ${stepBody}

        <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 0 0;border-top:1px solid var(--color-border);margin-top:24px">
          <button class="btn btn-secondary" onclick="OCWizardView.back()" ${w.step === 0 ? 'disabled' : ''}>← Back</button>
          ${w.step < this.STEPS.length - 1
            ? `<button class="btn btn-primary" onclick="OCWizardView.next()" ${this._canAdvance() ? '' : 'disabled'}>Continue →</button>`
            : `<button class="btn btn-primary" onclick="OCWizardView.submitFinal()">Create Origination Company</button>`}
        </div>
      </div>`;
  },

  /* ---- Step 1: NMLS Lookup ---- */
  _renderLookup() {
    const w = this._w;
    const seeds = State.listNmlsLookupSeeds();
    const result = w.lookupResult;
    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:6px">Lookup NMLS Company ID</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:16px">
          Enter the OC's NMLS Company ID. The platform pulls company info, addresses, and branches from the NMLS sync feed (pre-populated for the demo).
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start">
          <input type="text" class="input" placeholder="e.g. 5599001" value="${w.nmlsId}"
                 oninput="OCWizardView._setNmlsId(this.value)" style="max-width:280px">
          <button class="btn btn-secondary" onclick="OCWizardView.doLookup()">Look up</button>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--color-text-muted)">
          Try: ${seeds.map(s => `<code style="background:var(--color-surface);padding:2px 6px;border-radius:3px;cursor:pointer;margin-right:6px" onclick="OCWizardView._setNmlsId('${s.nmlsId}');OCWizardView.doLookup()">${s.nmlsId}</code> (${s.name})`).join('')}
        </div>
      </div>

      ${result ? `
        <div class="card" style="margin-top:16px;border-left:3px solid var(--color-success)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.2"><path d="M5 12l5 5L20 7"/></svg>
            <div>
              <div style="font-weight:600;font-size:15px">${result.name}</div>
              <div style="font-size:11px;color:var(--color-text-muted)">NMLS ID ${w.nmlsId} · State of Incorporation: ${result.stateOfIncorporation} · Last synced: just now</div>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-row"><div class="info-label">Address</div><div class="info-value">${result.address1}${result.address2 ? ', ' + result.address2 : ''}</div></div>
            <div class="info-row"><div class="info-label">City / State</div><div class="info-value">${result.city}, ${result.state} ${result.zip}</div></div>
            <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${result.contactPhone}</div></div>
            <div class="info-row"><div class="info-label">Website</div><div class="info-value">${result.website}</div></div>
            <div class="info-row"><div class="info-label">Branches found</div><div class="info-value">${result.branches.length} (${[...new Set(result.branches.map(b => b.state))].join(', ')})</div></div>
          </div>
        </div>` : ''}`;
  },

  /* ---- Step 2: Confirm OC fields ---- */
  _renderConfirm() {
    const oc = this._w.oc;
    const fld = (key, label, hint) => `
      <div class="form-group ${['address1', 'website', 'emailDomain', 'ccEmails'].includes(key) ? 'form-full' : ''}">
        <label>${label}</label>
        <input type="text" class="input" value="${oc[key] || ''}" oninput="OCWizardView._setOcField('${key}', this.value)" />
        ${hint ? `<div class="form-hint">${hint}</div>` : ''}
      </div>`;
    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:6px">Confirm OC Fields</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:16px">Pre-filled from NMLS. Edit any field that needs correction.</div>
        <div class="form-grid">
          ${fld('name',                  'Company Name')}
          ${fld('nmlsId',                'NMLS ID')}
          ${fld('stateOfIncorporation',  'State of Incorporation')}
          ${fld('contactPhone',          'Contact Phone')}
          ${fld('address1',              'Address')}
          ${fld('address2',              'Address Line 2')}
          ${fld('city',                  'City')}
          ${fld('state',                 'State')}
          ${fld('zip',                   'Zip')}
          ${fld('website',               'Website')}
          ${fld('emailDomain',           'Allowed Email Domain', 'Invitees must use this domain')}
          ${fld('ccEmails',              'CC Emails (comma-separated)', 'Optional — copied on system notifications')}
        </div>
      </div>`;
  },

  /* ---- Step 3: Enablement Grid ---- */
  _renderEnablement() {
    const w = this._w;
    const programs = State.getLoanPrograms();
    const markets = State.getMarkets();
    const lpms = State.getLPMs();
    const supportedMarkets = markets.filter(m => m.supported);
    const enabledCount = w.enabledLpmIds.size;
    const enabledProgramIds = new Set([...w.enabledLpmIds].map(id => lpms.find(l => l.id === id)?.programId).filter(Boolean));
    const enabledMarketIds = new Set([...w.enabledLpmIds].map(id => lpms.find(l => l.id === id)?.marketId).filter(Boolean));

    const headerRow = `
      <tr style="background:var(--color-surface)">
        <th style="text-align:left;font-size:11px;color:var(--color-text-muted);padding:8px 12px">Program / Market</th>
        ${supportedMarkets.map(m => `<th style="font-size:11px;color:var(--color-text-muted);padding:8px 12px;text-align:center">${m.code}<div style="font-size:9px;font-weight:400;text-transform:none;letter-spacing:0;color:var(--color-text-muted)">${m.name.split(' ')[0]}</div></th>`).join('')}
      </tr>`;
    const rows = programs.map(p => {
      const cells = supportedMarkets.map(m => {
        const lpm = lpms.find(l => l.programId === p.id && l.marketId === m.id);
        if (!lpm) {
          return `<td style="text-align:center;padding:6px;color:var(--color-text-muted)" title="Program ${p.name} cannot exist in ${m.name} per platform config">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
          </td>`;
        }
        const checked = w.enabledLpmIds.has(lpm.id);
        return `<td style="text-align:center;padding:6px">
          <input type="checkbox" ${checked ? 'checked' : ''}
                 onchange="OCWizardView._toggleLpm('${lpm.id}', this.checked)"
                 style="width:16px;height:16px;cursor:pointer">
        </td>`;
      }).join('');
      return `<tr><td style="padding:8px 12px;font-size:13px;font-weight:500">${p.name}<div style="font-size:11px;color:var(--color-text-muted);font-weight:400">${p.code} · ${p.token}</div></td>${cells}</tr>`;
    }).join('');

    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:6px">LoanProgram-Market Enablement</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:16px">
          Pick the (program × market) pairs the platform allows this OC to operate in. Locked cells indicate the platform has not allowed that combination at the system level. Spec §1.3: each OC, branch, and LO has independent enablement; effective access intersects all three at runtime.
        </div>
        <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden">
          <table style="width:100%;border-collapse:collapse">
            <thead>${headerRow}</thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="margin-top:12px;font-size:12px;color:var(--color-text)">
          <span class="tag" style="background:var(--color-surface);color:var(--color-text);font-weight:600">${enabledCount} LPMs enabled</span>
          across ${enabledProgramIds.size} program${enabledProgramIds.size === 1 ? '' : 's'} / ${enabledMarketIds.size} market${enabledMarketIds.size === 1 ? '' : 's'}
        </div>
      </div>`;
  },

  /* ---- Step 4: Branches ---- */
  _renderBranches() {
    const w = this._w;
    if (!w.branches.length) {
      return `<div class="card"><div style="text-align:center;color:var(--color-text-muted);padding:30px;font-size:13px">No branches found from NMLS lookup.</div></div>`;
    }
    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:6px">Branches from NMLS</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:16px">
          ${w.branches.length} branch${w.branches.length === 1 ? '' : 'es'} pulled from NMLS sync feed. Toggle the ones you want active at launch. Branches are flat (spec §9 #14) — no nested sub-branches. NMLS is source of truth, so no manual add.
        </div>
        <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden">
          <table>
            <thead><tr><th>Active</th><th>Type</th><th>Branch</th><th>NMLS#</th><th>State</th><th>Start Date</th></tr></thead>
            <tbody>
              ${w.branches.map((b, i) => `
                <tr>
                  <td><input type="checkbox" ${b.active ? 'checked' : ''} onchange="OCWizardView._toggleBranch(${i}, this.checked)" style="width:16px;height:16px;cursor:pointer"></td>
                  <td><span class="tag">${b.branchType}</span></td>
                  <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address1}, ${b.city}</div></td>
                  <td style="font-size:11px;color:var(--color-text-muted)">${b.nmlsId}</td>
                  <td>${b.state}</td>
                  <td style="color:var(--color-text-muted);font-size:11px">${Display.date(b.startDate)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:10px;font-size:11px;color:var(--color-text-muted)">
          <span class="status-dot" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-success);margin-right:4px"></span>
          Last NMLS sync: just now
        </div>
      </div>`;
  },

  /* ---- Step 5: First Program Admin ---- */
  _renderAdmin() {
    const a = this._w.admin;
    return `
      <div class="card" style="max-width:640px">
        <div class="card-title" style="margin-bottom:6px">First Program Admin</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:16px">
          Designate the OC's initial Program Admin (OC-Admin role per spec §3.1, §6). They will receive an invitation email and can invite additional users once active. Branch User Type assignments happen separately on the User detail screen.
        </div>
        <div class="form-grid">
          <div class="form-group"><label>First Name</label><input type="text" class="input" value="${a.firstName}" oninput="OCWizardView._setAdminField('firstName', this.value)"></div>
          <div class="form-group"><label>Last Name</label><input type="text" class="input" value="${a.lastName}" oninput="OCWizardView._setAdminField('lastName', this.value)"></div>
          <div class="form-group form-full"><label>Email</label><input type="email" class="input" value="${a.email}" oninput="OCWizardView._setAdminField('email', this.value)" placeholder="must match company email domain"></div>
          <div class="form-group"><label>Title</label><input type="text" class="input" value="${a.title}" oninput="OCWizardView._setAdminField('title', this.value)"></div>
          <div class="form-group"><label>Phone</label><input type="text" class="input" value="${a.phone}" oninput="OCWizardView._setAdminField('phone', this.value)"></div>
        </div>
      </div>`;
  },

  /* ---- Step 6: Review + Create ---- */
  _renderReview() {
    const w = this._w;
    const enabledLpms = [...w.enabledLpmIds].map(id => State.getLPM(id)).filter(Boolean);
    const programNames = [...new Set(enabledLpms.map(l => State.getLoanProgram(l.programId)?.name))].filter(Boolean);
    const marketCodes = [...new Set(enabledLpms.map(l => State.getMarket(l.marketId)?.code))].filter(Boolean);
    const activeBranches = w.branches.filter(b => b.active);

    return `
      <div style="display:grid;gap:16px">
        <div class="card">
          <div class="card-title" style="margin-bottom:10px">Origination Company</div>
          <div class="info-grid">
            <div class="info-row"><div class="info-label">Name</div><div class="info-value">${w.oc.name || '—'}</div></div>
            <div class="info-row"><div class="info-label">NMLS</div><div class="info-value">${w.oc.nmlsId || '—'}</div></div>
            <div class="info-row"><div class="info-label">Address</div><div class="info-value">${w.oc.address1 || '—'}, ${w.oc.city || ''} ${w.oc.state || ''} ${w.oc.zip || ''}</div></div>
            <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${w.oc.contactPhone || '—'}</div></div>
            <div class="info-row"><div class="info-label">Email Domain</div><div class="info-value">${w.oc.emailDomain || '—'}</div></div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:10px">Enablement</div>
          <div style="font-size:13px;line-height:1.7">
            <div><strong>${enabledLpms.length}</strong> LPMs across <strong>${programNames.length}</strong> programs and <strong>${marketCodes.length}</strong> markets</div>
            <div style="color:var(--color-text-muted);margin-top:6px">
              ${programNames.length ? programNames.map(n => `<span class="tag">${n}</span>`).join(' ') : 'No programs enabled'}
            </div>
            <div style="color:var(--color-text-muted);margin-top:6px">
              Markets: ${marketCodes.length ? marketCodes.join(', ') : 'None'}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:10px">Branches at Launch</div>
          <div style="font-size:13px">
            <div><strong>${activeBranches.length}</strong> active${w.branches.length - activeBranches.length > 0 ? ` (${w.branches.length - activeBranches.length} inactive)` : ''}</div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px">
              ${activeBranches.map(b => `<div style="font-size:12px"><strong>${b.name}</strong> <span style="color:var(--color-text-muted)">· ${b.city}, ${b.state} · NMLS ${b.nmlsId}</span></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:10px">First Program Admin</div>
          <div style="font-size:13px">
            ${w.admin.firstName} ${w.admin.lastName} <span style="color:var(--color-text-muted)">· ${w.admin.email || 'no email yet'} · ${w.admin.title}</span>
          </div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">An invite email will be sent on submit (simulated).</div>
        </div>
      </div>`;
  },

  /* ---- Wizard plumbing ---- */
  _setNmlsId(v) {
    this._w.nmlsId = v.trim();
    // Re-render to update the lookup CTA disabled state
  },

  doLookup() {
    const w = this._w;
    const result = State.nmlsLookupCompany(w.nmlsId);
    if (!result) {
      alert(`No NMLS record found for "${w.nmlsId}". Try one of the seeded IDs.`);
      return;
    }
    w.lookupResult = result;
    // Pre-populate OC fields and branches
    w.oc = {
      name: result.name,
      nmlsId: w.nmlsId,
      stateOfIncorporation: result.stateOfIncorporation,
      address1: result.address1,
      address2: result.address2 || '',
      city: result.city,
      state: result.state,
      zip: result.zip,
      contactPhone: result.contactPhone,
      website: result.website,
      emailDomain: this._guessEmailDomain(result.website, result.name),
      ccEmails: '',
    };
    w.branches = result.branches.map(b => ({ ...b, active: true }));
    App.renderView(Router.getCurrentPath());
  },

  _guessEmailDomain(website, name) {
    if (website) {
      const m = website.replace(/^https?:\/\//, '').replace(/\/.*/, '');
      if (m && m !== 'tbd') return m;
    }
    return (name || '').toLowerCase().replace(/[^a-z]/g, '') + '.com';
  },

  _setOcField(key, value) {
    this._w.oc[key] = value;
  },

  _toggleLpm(lpmId, on) {
    if (on) this._w.enabledLpmIds.add(lpmId);
    else this._w.enabledLpmIds.delete(lpmId);
    App.renderView(Router.getCurrentPath());
  },

  _toggleBranch(idx, on) {
    if (this._w.branches[idx]) this._w.branches[idx].active = !!on;
  },

  _setAdminField(key, value) {
    this._w.admin[key] = value;
  },

  _canAdvance() {
    const w = this._w;
    const stepKey = this.STEPS[w.step].key;
    if (stepKey === 'lookup')     return !!w.lookupResult;
    if (stepKey === 'confirm')    return !!(w.oc.name && w.oc.nmlsId && w.oc.emailDomain);
    if (stepKey === 'enablement') return w.enabledLpmIds.size > 0;
    if (stepKey === 'branches')   return w.branches.some(b => b.active);
    if (stepKey === 'admin')      return !!(w.admin.firstName && w.admin.lastName && w.admin.email);
    return true;
  },

  next() {
    if (!this._canAdvance()) return;
    if (this._w.step < this.STEPS.length - 1) this._w.step++;
    App.renderView(Router.getCurrentPath());
  },

  back() {
    if (this._w.step > 0) this._w.step--;
    App.renderView(Router.getCurrentPath());
  },

  goto(idx) {
    if (idx <= this._w.step) {
      this._w.step = idx;
      App.renderView(Router.getCurrentPath());
    }
  },

  cancel() {
    if (this._w?.lookupResult && !confirm('Discard this onboarding draft?')) return;
    this.reset();
    Router.navigate('/origination-companies');
  },

  submitFinal() {
    const w = this._w;
    if (!w) return;
    const oc = w.oc;
    // Create company
    const company = State.addCompany({
      name: oc.name,
      nmlsId: oc.nmlsId,
      emailDomain: oc.emailDomain,
      stateOfIncorporation: oc.stateOfIncorporation,
      primaryContact: `${w.admin.firstName} ${w.admin.lastName}`,
      address1: oc.address1, address2: oc.address2,
      city: oc.city, state: oc.state, zip: oc.zip,
      contactPhone: oc.contactPhone, website: oc.website,
      ccEmails: (oc.ccEmails || '').split(',').map(s => s.trim()).filter(Boolean),
      lastNmlsSync: new Date().toISOString(),
      complianceDocs: ['W-9'],
      status: 'active',
    });
    // Set OC enablement
    State.setOcEnablement(company.id, [...w.enabledLpmIds]);
    // Create active branches
    const createdBranches = [];
    w.branches.filter(b => b.active).forEach(b => {
      const branch = State.addBranch({
        companyId: company.id,
        name: b.name,
        nmlsId: b.nmlsId,
        branchType: b.branchType,
        address: `${b.address1}, ${b.city}, ${b.state} ${b.zip}`,
        address1: b.address1, city: b.city, state: b.state, zip: b.zip,
        startDate: b.startDate,
        lastNmlsSync: new Date().toISOString(),
        status: 'active',
      });
      // Default branch enablement = OC enablement (Program Admin can narrow later)
      State.setBranchEnablement(branch.id, [...w.enabledLpmIds]);
      createdBranches.push(branch);
    });
    // Invite first Program Admin
    State.inviteUser({
      companyId: company.id,
      branchId: createdBranches[0]?.id || null,
      firstName: w.admin.firstName,
      lastName: w.admin.lastName,
      email: w.admin.email,
      title: w.admin.title,
      phone: w.admin.phone,
      role: 'prog_admin',
      onboardingStatus: 'invited',
      branchAssignments: [],
    });
    this.reset();
    Router.navigate(`/origination-companies/${company.id}`);
  },
};
