/* ============================================================
   MOBILE PROSPECT — Impact-first mobile experience for
   investor prospects. Designed for quick "show & tell" on phone.
   ============================================================ */

const MobileProspectView = {

  _programFilter: 'all',

  _setProgramFilter(key) {
    this._programFilter = key;
    const el = document.getElementById('mobile-main');
    if (el) el.innerHTML = this.render();
    MobileNav.setActive(Router.getCurrentPath());
  },

  /* ================================================================
     MAIN RENDER — delegates to active tab
  ================================================================ */
  render() {
    const path = Router.getCurrentPath() || '/m/prospect';
    if (path.includes('/stories')) return this._renderStories();
    if (path.includes('/data'))    return this._renderData();
    return this._renderHome();
  },

  /* ================================================================
     HOME TAB — The elevator pitch
  ================================================================ */
  _renderHome() {
    const data = State.getProspectData();
    const d    = data.platformKPIs;
    const bp   = data.borrowerProfile;

    return `
      ${this._renderHeader('Homium', 'Prospect Preview')}

      <!-- Hero -->
      <div class="mp-hero">
        <div class="mp-hero-title">Homium Investment Platform</div>
        <div class="mp-hero-tagline">Creating homeowners and generating returns through shared appreciation.</div>
      </div>

      <!-- 3 headline KPIs -->
      <div class="m-kpi-strip cols-3">
        <div class="m-kpi-card">
          <div class="m-kpi-value">${d.homeownersServed}</div>
          <div class="m-kpi-label">Homeowners</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value">$${(d.totalEquityCreated / 1e6).toFixed(0)}M</div>
          <div class="m-kpi-label">Equity Created</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value">${d.fundROI.toFixed(2)}x</div>
          <div class="m-kpi-label">Fund ROI</div>
        </div>
      </div>

      <!-- How it works -->
      <div class="m-section-header">
        <div class="m-section-title">How It Works</div>
      </div>
      <div class="mp-how-card">
        <div class="mp-how-row">
          <div class="mp-how-col">
            <div class="mp-how-label">Without Homium</div>
            <div class="mp-how-value mp-how-red">$${bp.beforeHomium.monthlyPITI.toLocaleString()}/mo</div>
          </div>
          <div class="mp-how-arrow">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-primary)" stroke-width="2"><path d="M4 10h12M12 6l4 4-4 4"/></svg>
          </div>
          <div class="mp-how-col">
            <div class="mp-how-label">With Homium</div>
            <div class="mp-how-value mp-how-green">$${bp.withHomium.monthlyPITI.toLocaleString()}/mo</div>
          </div>
        </div>
        <div class="mp-how-savings">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-primary)" stroke-width="1.6"><path d="M8 1v14M4.5 4l3.5-3 3.5 3"/></svg>
          Saves $${bp.withHomium.monthlySavings.toLocaleString()}/month per family
        </div>
        <div class="mp-how-headline">${bp.headline}</div>
      </div>

      <!-- Impact callout -->
      <div class="mp-callout">
        <div class="mp-callout-label">AFFORDABILITY GAP</div>
        <div class="mp-callout-value">$${bp.affordabilityGap.toLocaleString()}</div>
        <div class="mp-callout-desc">A 35% Homium shared appreciation mortgage closes the gap between what families earn and what homes cost.</div>
      </div>

      <!-- Programs -->
      ${this._renderProgramCards(data)}

      <!-- CTA -->
      <div class="mp-cta">
        <div class="mp-cta-title">Interested in funding a program?</div>
        <button class="m-btn m-btn-primary" onclick="alert('Contact request submitted. Our team will reach out shortly.')">
          Get in Touch
        </button>
      </div>`;
  },

  /* ================================================================
     STORIES TAB — Emotional sell
  ================================================================ */
  _renderStories() {
    const data = State.getProspectData();

    const storiesHtml = data.borrowerStories.map(s => `
      <div class="mp-story-card">
        <span class="mp-story-badge">${s.badge}</span>
        <div class="mp-story-headline">${s.headline}</div>
        <div class="mp-story-desc">${s.description}</div>
      </div>`).join('');

    return `
      ${this._renderHeader('Impact Stories', null)}

      <!-- Impact Summary -->
      <div class="mp-impact-summary">
        <p>${data.impactSummary}</p>
      </div>

      <!-- Secondary KPIs -->
      <div class="m-kpi-strip cols-2" style="padding-bottom:6px">
        <div class="m-kpi-card">
          <div class="m-kpi-value">$${data.platformKPIs.monthlySavingsPerFamily.toLocaleString()}</div>
          <div class="m-kpi-label">Avg Monthly Savings</div>
        </div>
        <div class="m-kpi-card">
          <div class="m-kpi-value">${data.platformKPIs.programsActive}</div>
          <div class="m-kpi-label">Active Programs</div>
        </div>
      </div>

      <div class="m-section-header">
        <div class="m-section-title">Borrower Stories</div>
        <div class="m-section-count">${data.borrowerStories.length} stories</div>
      </div>
      <div class="mp-stories-list">
        ${storiesHtml}
      </div>`;
  },

  /* ================================================================
     DATA TAB — Detailed metrics & projections
  ================================================================ */
  _renderData() {
    const data = State.getProspectData();
    const programs = data.programs;
    const filter = this._programFilter;
    const filtered = filter === 'all' ? programs : programs.filter(p => p.id === filter);

    /* Program filter pills */
    const tabs = [{ key: 'all', label: 'All' }, ...programs.map(p => ({ key: p.id, label: p.name.split(' ')[0] }))];
    const pillsHtml = tabs.map(t =>
      `<button class="m-filter-pill ${filter === t.key ? 'active' : ''}"
              onclick="MobileProspectView._setProgramFilter('${t.key}')">${t.label}</button>`
    ).join('');

    /* Metrics as info-rows (not table) */
    const metrics = [
      { key: 'avgHomeSalesPrice', label: 'Avg Home Price',     fmt: v => '$' + v.toLocaleString() },
      { key: 'avgSAMPct',        label: 'Homium SAM %',       fmt: v => v + '%' },
      { key: 'avgFICO',          label: 'Avg FICO',           fmt: v => v.toString() },
      { key: 'avgFirstLienLTV',  label: 'First Lien LTV',     fmt: v => v + '%' },
      { key: 'avgIncome',        label: 'Avg Annual Income',   fmt: v => '$' + v.toLocaleString() },
      { key: 'avgFrontRatio',    label: 'Front DTI Ratio',     fmt: v => v + '%' },
      { key: 'avgBackRatio',     label: 'Back DTI Ratio',      fmt: v => v + '%' },
      { key: 'avgPITI',          label: 'Avg Monthly PITI',    fmt: v => '$' + v.toLocaleString() },
    ];

    const metricsCards = filtered.map(prog => `
      <div class="m-section-header" style="padding-bottom:0">
        <div class="m-section-title">${prog.name}</div>
        <div class="m-section-count">${prog.geography}</div>
      </div>
      <div class="m-info-card">
        ${metrics.map(m => `
          <div class="m-info-row">
            <span class="m-info-label">${m.label}</span>
            <span class="m-info-value" style="font-weight:600">${m.fmt(prog[m.key])}</span>
          </div>`).join('')}
      </div>`).join('');

    /* Projections */
    const prog = filter === 'all' ? programs[0] : programs.find(p => p.id === filter) || programs[0];
    const proj = prog.projections;
    const projectionsHtml = this._renderMobileProjections(prog, proj);

    return `
      ${this._renderHeader('Data & Projections', null)}

      <div class="m-filter-strip" style="padding:12px 14px 4px">
        ${pillsHtml}
      </div>

      ${metricsCards}

      <div class="m-section-header" style="margin-top:8px">
        <div class="m-section-title">30-Year Projections</div>
        <div class="m-section-count">${prog.name}</div>
      </div>
      <div class="mp-projections">
        ${projectionsHtml}
      </div>

      <div style="padding:16px 14px 24px">
        <button class="m-btn m-btn-secondary" onclick="App.switchRole()">Switch Role</button>
      </div>`;
  },

  /* ================================================================
     HELPERS
  ================================================================ */

  _renderHeader(title, chip) {
    const chipHtml = chip ? `<span class="m-role-chip">${chip}</span>` : '';
    return `
      <div class="m-page-header">
        <div class="m-page-header-left">
          <div>
            <div class="m-page-title">${title}</div>
          </div>
          ${chipHtml}
        </div>
      </div>`;
  },

  _renderProgramCards(data) {
    const programs = data.programs;
    const filter = this._programFilter;
    const filtered = filter === 'all' ? programs : programs.filter(p => p.id === filter);

    const tabs = [{ key: 'all', label: 'All' }, ...programs.map(p => ({ key: p.id, label: p.name.split(' ')[0] }))];
    const pillsHtml = tabs.map(t =>
      `<button class="m-filter-pill ${filter === t.key ? 'active' : ''}"
              onclick="MobileProspectView._setProgramFilter('${t.key}')">${t.label}</button>`
    ).join('');

    const cardsHtml = filtered.map(p => `
      <div class="mp-program-card">
        <div class="mp-program-top">
          <span class="mp-program-geo">${p.geography}</span>
          <span class="badge badge-active" style="font-size:9px;padding:1px 6px">${p.status}</span>
        </div>
        <div class="mp-program-name">${p.name}</div>
        <div class="mp-program-grid">
          <div class="mp-pgm">
            <div class="mp-pgm-val">$${(p.fundSize / 1e6).toFixed(0)}M</div>
            <div class="mp-pgm-lbl">Fund Size</div>
          </div>
          <div class="mp-pgm">
            <div class="mp-pgm-val">${p.homeownersServed}</div>
            <div class="mp-pgm-lbl">Homeowners</div>
          </div>
          <div class="mp-pgm">
            <div class="mp-pgm-val">${p.roi.toFixed(2)}x</div>
            <div class="mp-pgm-lbl">ROI</div>
          </div>
          <div class="mp-pgm">
            <div class="mp-pgm-val">$${p.monthlySavings.toLocaleString()}</div>
            <div class="mp-pgm-lbl">Savings/mo</div>
          </div>
        </div>
      </div>`).join('');

    return `
      <div class="m-section-header">
        <div class="m-section-title">Programs</div>
        <div class="m-section-count">${programs.length} active</div>
      </div>
      <div class="m-filter-strip" style="padding:0 14px 8px">
        ${pillsHtml}
      </div>
      <div class="mp-programs-list">
        ${cardsHtml}
      </div>`;
  },

  _renderMobileProjections(prog, proj) {
    /* Equity Created — area chart */
    const eqMax = Math.max(...proj.map(p => p.equity));
    const eqPoints = proj.map((p, i) => {
      const x = (i / (proj.length - 1)) * 280 + 10;
      const y = 130 - (p.equity / eqMax) * 110;
      return `${x},${y}`;
    }).join(' ');
    const eqArea = `${10},${130} ${eqPoints} ${290},${130}`;
    const eqLabel = '$' + (proj[proj.length - 1].equity / 1e6).toFixed(0) + 'M';

    /* ROI — line chart */
    const roiMax = Math.max(...proj.map(p => p.roi)) || 1;
    const roiPoints = proj.map((p, i) => {
      const x = (i / (proj.length - 1)) * 280 + 10;
      const y = 130 - (p.roi / roiMax) * 110;
      return `${x},${y}`;
    }).join(' ');
    const roiLabel = proj[proj.length - 1].roi.toFixed(2) + 'x';

    /* Active homeowners — bar chart */
    const hoMax = Math.max(...proj.map(p => p.activeHOs));
    const sampledProj = proj.filter((_, i) => i % 2 === 0 || i === proj.length - 1);
    const barsHtml = sampledProj.map(p => {
      const pct = hoMax > 0 ? (p.activeHOs / hoMax) * 100 : 0;
      return `<div class="mp-bar-col">
        <div class="mp-bar" style="height:${Math.max(pct, 3)}%"></div>
        <span class="mp-bar-yr">${String(p.year).slice(2)}</span>
      </div>`;
    }).join('');

    return `
      <div class="mp-chart-card">
        <div class="mp-chart-label">HOMEOWNER EQUITY CREATED</div>
        <div class="mp-chart-end-val">${eqLabel}</div>
        <svg viewBox="0 0 300 140" class="mp-chart-svg">
          <polygon points="${eqArea}" fill="var(--color-primary-container)" opacity="0.4"/>
          <polyline points="${eqPoints}" fill="none" stroke="var(--color-primary)" stroke-width="2.5"/>
        </svg>
        <div class="mp-chart-axis">
          <span>${proj[0].year}</span><span>${proj[proj.length - 1].year}</span>
        </div>
      </div>

      <div class="mp-chart-card">
        <div class="mp-chart-label">CUMULATIVE ROI</div>
        <div class="mp-chart-end-val">${roiLabel}</div>
        <svg viewBox="0 0 300 140" class="mp-chart-svg">
          <polyline points="${roiPoints}" fill="none" stroke="var(--color-primary)" stroke-width="2.5"/>
        </svg>
        <div class="mp-chart-axis">
          <span>${proj[0].year}</span><span>${proj[proj.length - 1].year}</span>
        </div>
      </div>

      <div class="mp-chart-card">
        <div class="mp-chart-label">ACTIVE HOMEOWNERS</div>
        <div class="mp-chart-end-val">${hoMax.toLocaleString()}</div>
        <div class="mp-bars-wrap">${barsHtml}</div>
      </div>`;
  },
};
