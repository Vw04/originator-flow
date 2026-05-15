/* ============================================================
   HOMIUM ORIGINATOR FLOW — Create Branch
   Single-page institutional form. Routed via /branches/new?company=<ocId>.
   Programs / Markets shown here are the subset enabled at the parent OC.
   ============================================================ */

const BranchCreateView = {
  _form: null,
  _enabledLpmIds: new Set(),
  _companyId: null,

  _initForm(companyId) {
    if (this._form && this._companyId === companyId) return;
    this._companyId = companyId;
    this._form = {
      name: '', nmlsId: '', branchManagerId: '',
      address1: '', suite: '', city: '', state: '', zip: '',
      contactPhone: '',
    };
    this._enabledLpmIds = new Set();
  },

  render(path) {
    /* Parse companyId from query (or default if there's only one OC). */
    const m = (path || '').match(/[?&]company=([^&]+)/);
    let companyId = m ? decodeURIComponent(m[1]) : null;
    const companies = State.getCompanies();
    if (!companyId && companies.length === 1) companyId = companies[0].id;
    this._initForm(companyId);

    const co = companyId ? State.getCompany(companyId) : null;
    if (!co) {
      return `
        <div class="page-body">
          <div class="inst-card">
            <div class="inst-card-title">Choose a parent company</div>
            <div style="margin-bottom:14px;color:var(--color-text-muted);font-size:13px">Branches are created under an existing Origination Company.</div>
            ${companies.length ? `
              <div class="program-checklist">
                ${companies.map(c => `
                  <label class="program-check-row" onclick="Router.navigate('/branches/new?company=${c.id}')">
                    <div class="pc-name">${c.name}</div>
                    <span class="pc-code">${c.nmlsId}</span>
                  </label>`).join('')}
              </div>` : '<div style="color:var(--color-text-muted);font-size:13px">No companies yet. Create one first.</div>'}
          </div>
        </div>`;
    }

    /* Programs / markets — subset that the parent OC has enabled. */
    const ocLpmIds = new Set(State.getOcEnablement(co.id) || []);
    const programs = State.getLoanPrograms();
    const eligiblePrograms = programs.filter(p => {
      const programLpmIds = State.getLPMsForProgram(p.id).map(l => l.id);
      return programLpmIds.some(id => ocLpmIds.has(id));
    });
    const markets = State.getMarkets();
    const eligibleMarketIds = new Set(
      [...ocLpmIds].map(id => State.getLPM(id)?.marketId).filter(Boolean)
    );
    const ALL_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'];
    const marketsByCode = new Map(markets.map(m => [m.code, m]));
    const selectedMarketIds = new Set(
      [...this._enabledLpmIds].map(id => State.getLPM(id)?.marketId).filter(Boolean)
    );

    const ocUsers = State.getUsersByCompany(co.id);
    const branchManagerOptions = ocUsers.map(u => `<option value="${u.id}" ${this._form.branchManagerId === u.id ? 'selected' : ''}>${Display.fullName(u)}</option>`).join('');

    const f = this._form;
    const input = (label, id, required) => `
      <div class="form-group">
        <label>${label}${required ? ' <span class="req">*</span>' : ''}</label>
        <input class="input" id="${id}" value="${f[id] != null ? String(f[id]).replace(/"/g, '&quot;') : ''}"
               oninput="BranchCreateView._set('${id}', this.value)" />
      </div>`;

    const programRows = eligiblePrograms.length ? eligiblePrograms.map(p => {
      const lpmsForProgram = State.getLPMsForProgram(p.id).filter(l => ocLpmIds.has(l.id));
      const isFully = lpmsForProgram.length > 0 && lpmsForProgram.every(l => this._enabledLpmIds.has(l.id));
      const code = (p.code || p.name.replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase();
      return `
        <label class="program-check-row">
          <input type="checkbox" ${isFully ? 'checked' : ''} onchange="BranchCreateView._toggleProgram('${p.id}', this.checked)" />
          <div class="pc-name">${p.name}</div>
          <span class="pc-code">${code}</span>
        </label>`;
    }).join('') : `<div style="padding:14px;color:var(--color-text-muted);font-size:13px">No programs enabled at <strong>${co.name}</strong>. Enable some on the company's Details tab first.</div>`;

    const chips = ALL_STATES.map(code => {
      const m = marketsByCode.get(code);
      if (!m) return `<span class="state-chip is-locked">${code}</span>`;
      const eligible = eligibleMarketIds.has(m.id);
      if (!eligible) return `<span class="state-chip is-locked" title="not enabled at parent">${code}</span>`;
      const on = selectedMarketIds.has(m.id);
      return `<span class="state-chip${on ? ' is-on' : ''}" onclick="BranchCreateView._toggleMarket('${m.id}', ${!on})" title="${m.name}">${m.code}</span>`;
    }).join('');

    return `
      <button class="back-link" onclick="Router.navigate('/origination-companies/${co.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Branches
      </button>

      <div style="padding: 8px 28px 18px">
        <h1 class="entity-header-title" style="font-size:30px">Create branch</h1>
        <div class="entity-header-subtitle" style="margin-top:4px">Add a new branch under <strong>${co.name}</strong>. Programs and states are limited to the parent company's settings.</div>
      </div>

      <div class="page-body">
        <div class="inst-card">
          <div class="inst-card-title">Branch information</div>
          <div class="inst-form-grid">
            ${input('Branch name', 'name', true)}
            ${input('Branch NMLS #', 'nmlsId', true)}
            <div class="form-group">
              <label>Branch manager</label>
              <select class="select-input" id="branchManagerId" onchange="BranchCreateView._set('branchManagerId', this.value)">
                <option value="">Select user…</option>
                ${branchManagerOptions}
              </select>
            </div>
            ${input('Address 1', 'address1')}
            ${input('Suite #', 'suite')}
            ${input('City', 'city')}
            ${input('State', 'state')}
            ${input('Zip', 'zip')}
            ${input('Contact phone', 'contactPhone')}
          </div>
        </div>

        <div class="inst-card">
          <div class="inst-card-title">
            <span>Eligible programs</span>
            <span class="count">Subset of programs enabled at parent company</span>
          </div>
          <div class="program-checklist">${programRows}</div>
        </div>

        <div class="inst-card">
          <div class="inst-card-title">
            <span>Market enablements</span>
            <span class="count">Subset of states enabled at parent. Other states are locked.</span>
          </div>
          <div class="state-grid">${chips}</div>
        </div>
      </div>

      <div class="inst-footer-bar">
        <button class="btn btn-secondary btn-sm" onclick="BranchCreateView._cancel()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="BranchCreateView._save()">Save branch</button>
      </div>`;
  },

  _set(key, value) {
    if (!this._form) return;
    this._form[key] = value;
  },

  _toggleProgram(programId, on) {
    const ocLpmIds = new Set(State.getOcEnablement(this._companyId) || []);
    const lpmsForProgram = State.getLPMsForProgram(programId).map(l => l.id).filter(id => ocLpmIds.has(id));
    if (on) lpmsForProgram.forEach(id => this._enabledLpmIds.add(id));
    else    lpmsForProgram.forEach(id => this._enabledLpmIds.delete(id));
    App.renderView(Router.getCurrentPath());
  },

  _toggleMarket(marketId, on) {
    const ocLpmIds = new Set(State.getOcEnablement(this._companyId) || []);
    const lpmsForMarket = State.getLPMsForMarket(marketId).map(l => l.id).filter(id => ocLpmIds.has(id));
    if (on) lpmsForMarket.forEach(id => this._enabledLpmIds.add(id));
    else    lpmsForMarket.forEach(id => this._enabledLpmIds.delete(id));
    App.renderView(Router.getCurrentPath());
  },

  _cancel() {
    const back = this._companyId;
    this._form = null;
    this._enabledLpmIds = new Set();
    Router.navigate(back ? '/origination-companies/' + back : '/origination-companies');
  },

  _save() {
    const f = this._form || {};
    if (!f.name || !f.nmlsId) {
      alert('Branch name and NMLS # are required.');
      return;
    }
    const co = State.getCompany(this._companyId);
    if (!co) return;
    const branch = State.addBranch({
      companyId: co.id,
      name: f.name,
      nmlsId: f.nmlsId,
      managingLO: f.branchManagerId || null,
      address1: f.address1, suite: f.suite, city: f.city, state: f.state, zip: f.zip,
      contactPhone: f.contactPhone,
      branchType: 'Branch',
      status: 'active',
    });
    /* Persist branch enablement if supported. */
    if (State.setBranchEnablement && this._enabledLpmIds.size) {
      State.setBranchEnablement(branch.id, [...this._enabledLpmIds]);
    }
    this._form = null;
    this._enabledLpmIds = new Set();
    Router.navigate('/branches/' + branch.id);
  },
};
