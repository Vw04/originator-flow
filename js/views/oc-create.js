/* ============================================================
   HOMIUM ORIGINATOR FLOW — Create Origination Company
   Single-page institutional form. Replaces the OC wizard for the
   /origination-companies/new route.
   ============================================================ */

const OCCreateView = {
  /* Locally buffered form state — survives re-renders, cleared on save/cancel. */
  _form: null,
  _ocLpmIds: new Set(),

  _initForm() {
    if (this._form) return;
    this._form = {
      name: '', nmlsId: '', contactPhone: '',
      address1: '', address2: '', city: '', state: '', zip: '',
      website: '', companyType: '', ccEmails: '',
    };
    this._ocLpmIds = new Set();
  },

  render() {
    this._initForm();
    const programs = State.getLoanPrograms();
    const markets  = State.getMarkets();
    const ALL_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'];
    const marketsByCode = new Map(markets.map(m => [m.code, m]));
    const enabledMarketIds = new Set(
      [...this._ocLpmIds].map(id => State.getLPM(id)?.marketId).filter(Boolean)
    );

    const f = this._form;
    const input = (label, id, required, type) => `
      <div class="form-group">
        <label>${label}${required ? ' <span class="req">*</span>' : ''}</label>
        <input class="input" id="${id}" type="${type || 'text'}" value="${f[id] != null ? String(f[id]).replace(/"/g, '&quot;') : ''}"
               placeholder="${this._placeholders[id] || ''}"
               oninput="OCCreateView._set('${id}', this.value)" />
      </div>`;
    const select = (label, id, options) => `
      <div class="form-group">
        <label>${label}</label>
        <select class="select-input" id="${id}" onchange="OCCreateView._set('${id}', this.value)">
          <option value="">— select —</option>
          ${options.map(o => `<option value="${o}" ${f[id] === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
      </div>`;

    const programRows = programs.map(p => {
      const lpmsForProgram = State.getLPMsForProgram(p.id);
      const isFully = lpmsForProgram.length > 0 && lpmsForProgram.every(l => this._ocLpmIds.has(l.id));
      const code = (p.code || p.name.replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase();
      return `
        <label class="program-check-row">
          <input type="checkbox" ${isFully ? 'checked' : ''} onchange="OCCreateView._toggleProgram('${p.id}', this.checked)" />
          <div class="pc-name">${p.name}</div>
          <span class="pc-code">${code}</span>
        </label>`;
    }).join('');

    const chips = ALL_STATES.map(code => {
      const m = marketsByCode.get(code);
      if (!m) return `<span class="state-chip is-locked">${code}</span>`;
      const on = enabledMarketIds.has(m.id);
      const lockedCls = m.supported ? '' : ' is-locked';
      return `<span class="state-chip${on ? ' is-on' : ''}${lockedCls}" onclick="OCCreateView._toggleMarket('${m.id}', ${!on})" title="${m.name}">${m.code}</span>`;
    }).join('');

    return `
      <button class="back-link" onclick="Router.navigate('/origination-companies')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Companies
      </button>

      <div style="padding: 8px 28px 18px">
        <h1 class="entity-header-title" style="font-size:30px">Create Company</h1>
        <div class="entity-header-subtitle" style="margin-top:4px">Onboard a new company.</div>
      </div>

      <div class="page-body">
        <div class="inst-card">
          <div class="inst-card-title">Headquarters information</div>
          <div class="inst-form-grid">
            ${input('Company name', 'name', true)}
            ${input('Company NMLS #', 'nmlsId', true)}
            ${input('Address 1', 'address1')}
            ${input('Address 2', 'address2')}
            ${input('City', 'city')}
            ${input('State', 'state')}
            ${input('Zip', 'zip')}
            ${input('Website', 'website')}
            ${select('Company Type', 'companyType', ['Origination', 'Brokerage', 'Direct Lender'])}
            ${input('Contact phone', 'contactPhone')}
            <div class="form-full">${input('CC email addresses', 'ccEmails')}</div>
          </div>
        </div>

        <div class="inst-card">
          <div class="inst-card-title">
            <span>Eligible programs</span>
            <span class="count">${this._countEnabledPrograms()} of ${programs.length}</span>
          </div>
          <div class="program-checklist">${programRows || '<div style="padding:14px;color:var(--h-text-muted);font-size:13px">No programs defined yet.</div>'}</div>
        </div>

        <div class="inst-card">
          <div class="inst-card-title">
            <span>Market enablements</span>
            <span class="count">${enabledMarketIds.size} state${enabledMarketIds.size === 1 ? '' : 's'}</span>
          </div>
          <div style="font-size:12px;color:var(--h-text-muted);margin-bottom:14px">Select states where this company is authorized to operate. Locked states aren't yet supported by the platform.</div>
          <div class="state-grid">${chips}</div>
        </div>
      </div>

      <div class="inst-footer-bar">
        <button class="btn btn-secondary btn-sm" onclick="OCCreateView._cancel()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="OCCreateView._save()">Save company</button>
      </div>`;
  },

  _placeholders: {
    name: 'From NMLS: Authorized to Represent',
    nmlsId: 'NMLS Company ID',
    contactPhone: '(415) 555-0100',
    website: 'apexhomefinance.com',
    ccEmails: 'ops@example.com (comma-separated)',
  },

  _countEnabledPrograms() {
    return new Set([...this._ocLpmIds].map(id => State.getLPM(id)?.programId).filter(Boolean)).size;
  },

  _set(key, value) {
    if (!this._form) this._initForm();
    this._form[key] = value;
    // 2026-05-27 canon Pattern D: mark dirty on any field change.
    FormState.markFormDirty('oc-create-form');
  },

  _toggleProgram(programId, on) {
    const lpmIds = State.getLPMsForProgram(programId).map(l => l.id);
    if (on) lpmIds.forEach(id => this._ocLpmIds.add(id));
    else    lpmIds.forEach(id => this._ocLpmIds.delete(id));
    App.renderView(Router.getCurrentPath());
  },

  _toggleMarket(marketId, on) {
    const lpmIds = State.getLPMsForMarket(marketId).map(l => l.id);
    if (on) lpmIds.forEach(id => this._ocLpmIds.add(id));
    else    lpmIds.forEach(id => this._ocLpmIds.delete(id));
    App.renderView(Router.getCurrentPath());
  },

  /* 2026-05-27 canon Pattern D — Cancel: explicit intent, no modal. */
  _cancel() {
    this._form = null;
    this._ocLpmIds = new Set();
    FormState.cancelEditForm('oc-create-form',
      () => Router.navigateForce('/origination-companies'));
  },

  /* 2026-05-27 canon Pattern D — Save: commit then force-navigate. */
  _save() {
    const f = this._form || {};
    if (!f.name || !f.nmlsId) {
      alert('Company name and NMLS # are required.');
      return;
    }
    const ccEmails = (f.ccEmails || '').split(',').map(s => s.trim()).filter(Boolean);
    const co = State.addCompany({
      name: f.name, nmlsId: f.nmlsId, contactPhone: f.contactPhone,
      address1: f.address1, address2: f.address2, city: f.city, state: f.state, zip: f.zip,
      stateOfIncorporation: f.state || '',
      website: f.website,
      emailDomain: ccEmails[0]?.split('@')[1] || '',
      ccEmails,
      primaryContact: '',
    });
    /* Persist OC enablement (programs × markets selected on the form). */
    if (State.setOcEnablement && this._ocLpmIds.size) {
      State.setOcEnablement(co.id, [...this._ocLpmIds]);
    }
    this._form = null;
    this._ocLpmIds = new Set();
    FormState.saveEditForm('oc-create-form',
      () => {},
      () => Router.navigateForce('/origination-companies/' + co.id));
  },
};
