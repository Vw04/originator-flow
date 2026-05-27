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
      admin: {
        skipInvite: false,
        userType: 'lo',           // 'lo' | 'standard'
        isProgramAdmin: true,     // default the first invited user to Program Admin per spec §3.1
        isBranchManager: false,
        firstName: '', lastName: '', email: '', title: 'Program Administrator', phone: '', agentNmlsId: '',
      },
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
            <span style="font-size:11px;font-weight:700;color:var(--h-text-muted);margin-right:6px">${i + 1}</span>${s.label}
          </div>`).join('')}
      </div>

      <div class="page-body" style="max-width:1080px">
        ${stepBody}

        <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 0 0;border-top:1px solid var(--h-border);margin-top:24px">
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
        <div style="font-size:12px;color:var(--h-text-muted);margin-bottom:16px">
          Enter the OC's NMLS Company ID. The platform pulls company info, addresses, and branches from the NMLS sync feed (pre-populated for the demo).
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start">
          <input type="text" class="input" placeholder="e.g. 5599001" value="${w.nmlsId}"
                 oninput="OCWizardView._setNmlsId(this.value)" style="max-width:280px">
          <button class="btn btn-secondary" onclick="OCWizardView.doLookup()">Look up</button>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--h-text-muted)">
          Try: ${seeds.map(s => `<code style="background:var(--h-pearl);padding:2px 6px;border-radius:3px;cursor:pointer;margin-right:6px" onclick="OCWizardView._setNmlsId('${s.nmlsId}');OCWizardView.doLookup()">${s.nmlsId}</code> (${s.name})`).join('')}
        </div>
      </div>

      ${result ? `
        <div class="card" style="margin-top:16px;border-left:3px solid var(--h-success)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--h-success)" stroke-width="2.2"><path d="M5 12l5 5L20 7"/></svg>
            <div>
              <div style="font-weight:600;font-size:15px">${result.name}</div>
              <div style="font-size:11px;color:var(--h-text-muted)">NMLS ID ${w.nmlsId} · State of Incorporation: ${result.stateOfIncorporation} · Last synced: just now</div>
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
        <div style="font-size:12px;color:var(--h-text-muted);margin-bottom:16px">Pre-filled from NMLS. Edit any field that needs correction.</div>
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

  /* ---- Step 3: Programs Enabled (round 2 simplification) ----
     Round 1 had a program × market matrix. Round 2: single checkbox per
     program; toggling enables ALL of that program's allowed-market pairs
     at the OC level. The market dimension is a property of the program. */
  _renderEnablement() {
    const w = this._w;
    const programs = State.getLoanPrograms();
    const lpms = State.getLPMs();
    const enabledProgramIds = new Set([...w.enabledLpmIds].map(id => lpms.find(l => l.id === id)?.programId).filter(Boolean));
    const enabledMarketIds = new Set([...w.enabledLpmIds].map(id => lpms.find(l => l.id === id)?.marketId).filter(Boolean));

    const rows = programs.map(p => {
      const lpmsForProgram = lpms.filter(l => l.programId === p.id);
      const isFully = lpmsForProgram.length > 0 && lpmsForProgram.every(l => w.enabledLpmIds.has(l.id));
      const marketsLabel = (p.allowedMarketIds || []).map(id => State.getMarket(id)?.code).filter(Boolean).join(', ');
      return `
        <label style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--h-border-subtle);cursor:pointer">
          <input type="checkbox" ${isFully ? 'checked' : ''}
                 onchange="OCWizardView._toggleProgram('${p.id}', this.checked)"
                 style="width:16px;height:16px;cursor:pointer;flex-shrink:0">
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:600;color:var(--h-text-primary)">${p.name}</div>
            <div style="font-size:11px;color:var(--h-text-muted);margin-top:2px">Markets: ${marketsLabel || '—'}</div>
          </div>
          ${isFully ? '<span class="badge badge-active" style="flex-shrink:0">Enabled</span>' : ''}
        </label>`;
    }).join('');

    return `
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:16px 18px;border-bottom:1px solid var(--h-border)">
          <div class="card-title" style="margin-bottom:4px">Programs Enabled</div>
          <div style="font-size:12px;color:var(--h-text-muted)">
            Pick the loan programs the platform enables for this OC. Each program covers the markets shown next to it. Branches inherit at launch. Loan Officers must hold an active NMLS license in the program's market to originate.
          </div>
        </div>
        ${rows}
        <div style="padding:14px 18px;background:var(--h-pearl);font-size:12px;color:var(--h-text-primary)">
          <strong>${enabledProgramIds.size}</strong> program${enabledProgramIds.size === 1 ? '' : 's'} enabled across <strong>${enabledMarketIds.size}</strong> market${enabledMarketIds.size === 1 ? '' : 's'}
        </div>
      </div>`;
  },

  _toggleProgram(programId, on) {
    const w = this._w;
    const lpms = State.getLPMsForProgram(programId);
    if (on) lpms.forEach(l => w.enabledLpmIds.add(l.id));
    else    lpms.forEach(l => w.enabledLpmIds.delete(l.id));
    App.renderView(Router.getCurrentPath());
  },

  /* ---- Step 4: Branches ---- */
  _renderBranches() {
    const w = this._w;
    if (!w.branches.length) {
      return `<div class="card"><div style="text-align:center;color:var(--h-text-muted);padding:30px;font-size:13px">No branches found from NMLS lookup.</div></div>`;
    }
    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:6px">Branches from NMLS</div>
        <div style="font-size:12px;color:var(--h-text-muted);margin-bottom:16px">
          ${w.branches.length} branch${w.branches.length === 1 ? '' : 'es'} pulled from NMLS sync feed. Toggle the ones you want active at launch. Branches are flat (spec §9 #14) — no nested sub-branches. NMLS is source of truth, so no manual add.
        </div>
        <div style="border:1px solid var(--h-border);border-radius:var(--radius-lg);overflow:hidden">
          <table>
            <thead><tr><th>Active</th><th>Type</th><th>Branch</th><th>NMLS#</th><th>State</th><th>Start Date</th></tr></thead>
            <tbody>
              ${w.branches.map((b, i) => `
                <tr>
                  <td><input type="checkbox" ${b.active ? 'checked' : ''} onchange="OCWizardView._toggleBranch(${i}, this.checked)" style="width:16px;height:16px;cursor:pointer"></td>
                  <td><span class="tag">${b.branchType}</span></td>
                  <td><div class="cell-primary">${b.name}</div><div class="cell-secondary">${b.address1}, ${b.city}</div></td>
                  <td style="font-size:11px;color:var(--h-text-muted)">${b.nmlsId}</td>
                  <td>${b.state}</td>
                  <td style="color:var(--h-text-muted);font-size:11px">${Display.date(b.startDate)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:10px;font-size:11px;color:var(--h-text-muted)">
          <span class="status-dot" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--h-success);margin-right:4px"></span>
          Last NMLS sync: just now
        </div>
      </div>`;
  },

  /* ---- Step 5: Invite First User (optional) ----
     Spec §3.1 says every OC needs at least one Program Admin, but in v1
     the platform operator can invite later from the Users tab. So this
     step is optional, with the Program Admin checkbox stackable on top
     of any Branch User Type. */
  _renderAdmin() {
    const a = this._w.admin;
    const skip = a.skipInvite === true;
    const isLO = a.userType === 'lo';
    const licensePreview = isLO && a.agentNmlsId ? UsersView._nmlsLicensePreview(a.agentNmlsId) : null;
    return `
      <div class="card" style="max-width:720px">
        <div class="card-title" style="margin-bottom:6px">Invite First User <span style="color:var(--h-text-muted);font-weight:400;font-size:12px">(optional)</span></div>
        <div style="font-size:12px;color:var(--h-text-muted);margin-bottom:16px">
          Spec §3.1: every OC needs at least one Program Admin — invite one now or add it later under <strong>Users</strong>. Branch Manager and Program Admin are stackable flags on top of the Branch User Type.
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">
          <label style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border:2px solid ${skip ? 'var(--h-border)' : (isLO ? 'var(--h-action)' : 'var(--h-border)')};border-radius:8px;cursor:pointer;background:${!skip && isLO ? 'rgba(0,51,74,0.04)' : 'var(--h-surface-1)'}">
            <input type="radio" name="oc-wiz-utype" value="lo" ${!skip && isLO ? 'checked' : ''} onchange="OCWizardView._setAdminUserType('lo')">
            <div>
              <div style="font-size:13px;font-weight:600">Loan Officer</div>
              <div style="font-size:11px;color:var(--h-text-muted)">Originates apps. NMLS required.</div>
            </div>
          </label>
          <label style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border:2px solid ${skip ? 'var(--h-border)' : (!isLO ? 'var(--h-action)' : 'var(--h-border)')};border-radius:8px;cursor:pointer;background:${!skip && !isLO ? 'rgba(0,51,74,0.04)' : 'var(--h-surface-1)'}">
            <input type="radio" name="oc-wiz-utype" value="standard" ${!skip && !isLO ? 'checked' : ''} onchange="OCWizardView._setAdminUserType('standard')">
            <div>
              <div style="font-size:13px;font-weight:600">Standard User</div>
              <div style="font-size:11px;color:var(--h-text-muted)">Loan Processor, support, etc.</div>
            </div>
          </label>
          <label style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border:2px solid ${skip ? 'var(--h-action)' : 'var(--h-border)'};border-radius:8px;cursor:pointer;background:${skip ? 'rgba(0,51,74,0.04)' : 'var(--h-surface-1)'}">
            <input type="radio" name="oc-wiz-utype" value="skip" ${skip ? 'checked' : ''} onchange="OCWizardView._setAdminUserType('skip')">
            <div>
              <div style="font-size:13px;font-weight:600">Skip user invite</div>
              <div style="font-size:11px;color:var(--h-text-muted)">Add the first user later.</div>
            </div>
          </label>
        </div>

        ${skip ? `<div style="font-size:12px;color:var(--h-text-muted);padding:14px;border:1px dashed var(--h-border);border-radius:6px">No first user will be invited. The OC will be created without any Program Admin — you can invite one later from the Users tab.</div>` : `
          <div class="form-grid">
            <div class="form-group"><label>First Name</label><input type="text" class="input" value="${a.firstName}" oninput="OCWizardView._setAdminField('firstName', this.value)"></div>
            <div class="form-group"><label>Last Name</label><input type="text" class="input" value="${a.lastName}" oninput="OCWizardView._setAdminField('lastName', this.value)"></div>
            <div class="form-group form-full"><label>Email</label><input type="email" class="input" value="${a.email}" oninput="OCWizardView._setAdminField('email', this.value)" placeholder="must match company email domain"></div>
            <div class="form-group"><label>Title</label><input type="text" class="input" value="${a.title}" oninput="OCWizardView._setAdminField('title', this.value)" placeholder="e.g. Senior Loan Officer, Branch Support Staff"></div>
            <div class="form-group"><label>Phone</label><input type="text" class="input" value="${a.phone}" oninput="OCWizardView._setAdminField('phone', this.value)"></div>
            ${isLO ? `<div class="form-group form-full">
              <label>Agent NMLS ID</label>
              <input type="text" class="input" value="${a.agentNmlsId || ''}" oninput="OCWizardView._setAdminField('agentNmlsId', this.value)" onblur="App.renderView(Router.getCurrentPath())">
              ${licensePreview ? `<div style="margin-top:6px;font-size:11px">${licensePreview}</div>` : '<div class="form-hint">License records auto-populate after the daily NMLS sync.</div>'}
            </div>` : ''}
          </div>

          <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px">
            <label style="display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid var(--h-border);border-radius:6px;font-size:13px;cursor:pointer;background:${a.isProgramAdmin ? 'rgba(0,51,74,0.04)' : 'var(--h-surface-1)'}">
              <input type="checkbox" ${a.isProgramAdmin ? 'checked' : ''} onchange="OCWizardView._setAdminField('isProgramAdmin', this.checked)">
              <strong>Program Admin</strong>
              <span style="color:var(--h-text-muted);font-weight:400">— manage OC config & invite users</span>
            </label>
            <label style="display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid var(--h-border);border-radius:6px;font-size:13px;cursor:pointer;background:${a.isBranchManager ? 'rgba(0,51,74,0.04)' : 'var(--h-surface-1)'}">
              <input type="checkbox" ${a.isBranchManager ? 'checked' : ''} onchange="OCWizardView._setAdminField('isBranchManager', this.checked)">
              <strong>Branch Manager</strong>
              <span style="color:var(--h-text-muted);font-weight:400">— min View on all branch loans</span>
            </label>
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--h-text-muted)">Branch Manager flag applies to the user's first branch assignment (the OC's first active branch).</div>
        `}
      </div>`;
  },

  _setAdminUserType(value) {
    const a = this._w.admin;
    if (value === 'skip') {
      a.skipInvite = true;
    } else {
      a.skipInvite = false;
      a.userType = value;
    }
    App.renderView(Router.getCurrentPath());
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
          <div class="card-title" style="margin-bottom:10px">Programs Enabled</div>
          <div style="font-size:13px;line-height:1.7">
            <div><strong>${programNames.length}</strong> program${programNames.length === 1 ? '' : 's'} across <strong>${marketCodes.length}</strong> market${marketCodes.length === 1 ? '' : 's'}</div>
            <div style="color:var(--h-text-muted);margin-top:6px">
              ${programNames.length ? programNames.map(n => `<span class="tag">${n}</span>`).join(' ') : 'No programs enabled'}
            </div>
            <div style="color:var(--h-text-muted);margin-top:6px">
              Markets: ${marketCodes.length ? marketCodes.join(', ') : 'None'}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:10px">Branches at Launch</div>
          <div style="font-size:13px">
            <div><strong>${activeBranches.length}</strong> active${w.branches.length - activeBranches.length > 0 ? ` (${w.branches.length - activeBranches.length} inactive)` : ''}</div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px">
              ${activeBranches.map(b => `<div style="font-size:12px"><strong>${b.name}</strong> <span style="color:var(--h-text-muted)">· ${b.city}, ${b.state} · NMLS ${b.nmlsId}</span></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:10px">First User</div>
          ${w.admin.skipInvite ? `
            <div style="font-size:13px;color:var(--h-text-muted)">No first user — invite later from the Users tab.</div>
            <div style="font-size:11px;color:var(--h-warning);margin-top:6px">⚠ Spec §3.1 requires a Program Admin per OC. Invite one before going live.</div>
          ` : `
            <div style="font-size:13px">
              ${w.admin.firstName} ${w.admin.lastName} <span style="color:var(--h-text-muted)">· ${w.admin.email || 'no email yet'}</span>
            </div>
            <div style="font-size:12px;color:var(--h-text-muted);margin-top:4px">
              ${w.admin.userType === 'lo' ? 'Loan Officer' : 'Standard User'}${w.admin.isProgramAdmin ? ' · Program Admin' : ''}${w.admin.isBranchManager ? ' · Branch Manager' : ''}
            </div>
            <div style="font-size:11px;color:var(--h-text-muted);margin-top:6px">An invite email will be sent on submit (simulated).</div>
          `}
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
    if (stepKey === 'admin') {
      if (w.admin.skipInvite) return true;
      return !!(w.admin.firstName && w.admin.lastName && w.admin.email);
    }
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
      primaryContact: !w.admin.skipInvite ? `${w.admin.firstName} ${w.admin.lastName}` : '—',
      address1: oc.address1, address2: oc.address2,
      city: oc.city, state: oc.state, zip: oc.zip,
      contactPhone: oc.contactPhone, website: oc.website,
      ccEmails: (oc.ccEmails || '').split(',').map(s => s.trim()).filter(Boolean),
      lastNmlsSync: new Date().toISOString(),
      complianceDocs: ['W-9'],
      status: 'active',
    });
    // Set OC enablement (round 2: branches inherit, no separate branch table)
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
      createdBranches.push(branch);
    });
    // Invite first user (optional in round 2)
    if (!w.admin.skipInvite && w.admin.firstName && w.admin.email) {
      const isLO = w.admin.userType === 'lo';
      const firstBranchId = createdBranches[0]?.id || null;
      const branchAssignments = firstBranchId ? [{
        branchId: firstBranchId,
        userType: isLO ? 'lo' : 'standard',
        flags: { branchManager: !!w.admin.isBranchManager },
        loAssignments: isLO
          ? [{ scope: 'personal', loIds: [], level: 'full', subflags: { canCreate: true, canSubmit: true, canWithdraw: true } }]
          : [{ scope: 'all_los', loIds: [], level: 'view', subflags: {} }],
        allowNewOriginations: isLO,
        allowAccessToAllBranchActivity: false,
        eligibleLoanProductIds: [],
      }] : [];
      // Compute legacy role tag
      const role = w.admin.isProgramAdmin && branchAssignments.length === 0
        ? 'prog_admin' : (isLO ? 'lo' : 'lp');
      State.inviteUser({
        companyId: company.id,
        branchId: firstBranchId,
        firstName: w.admin.firstName,
        lastName: w.admin.lastName,
        email: w.admin.email,
        title: w.admin.title,
        phone: w.admin.phone,
        nmlsId: w.admin.agentNmlsId || null,
        agentNmlsId: w.admin.agentNmlsId || null,
        role,
        isProgramAdmin: !!w.admin.isProgramAdmin,
        onboardingStatus: 'invited',
        branchAssignments,
        licenses: [],
      });
    }
    this.reset();
    Router.navigate(`/origination-companies/${company.id}`);
  },
};
