/* ============================================================
   HOMIUM ORIGINATOR FLOW — Investor Prospect Dashboard
   High-level platform preview for prospective investors.
   All data sourced from State.getProspectData() — no PII.
   ============================================================ */

const ProspectDashboardView = {

  _programFilter: 'all',

  _setProgramFilter(key) {
    this._programFilter = key;
    App.renderView('/prospect');
  },

  /* ================================================================
     MAIN RENDER
  ================================================================ */
  render() {
    return `
      ${this._renderHero()}
      <div class="prospect-body">
        ${this._renderKPIStrip()}
        ${this._renderProgramOverview()}
        ${this._renderBorrowerProfile()}
        ${this._renderImpactSummary()}
        ${this._renderLoanMetrics()}
        ${this._renderBorrowerStories()}
        ${this._renderProjections()}
        ${this._renderCTA()}
      </div>`;
  },

  /* ================================================================
     SECTION 1 — HERO HEADER
  ================================================================ */
  _renderHero() {
    return `
      <div class="prospect-hero">
        <div class="prospect-hero-inner">
          <div class="prospect-hero-text">
            <span class="prospect-badge">Prospect Preview</span>
            <h1 class="prospect-hero-title">Homium Investment Platform</h1>
            <p class="prospect-tagline">Shared appreciation homeownership — creating homeowners and generating returns for investors across the country.</p>
          </div>
          <div class="prospect-hero-stats">
            <div class="prospect-hero-stat">
              <div class="prospect-hero-stat-value">3</div>
              <div class="prospect-hero-stat-label">Active Programs</div>
            </div>
            <div class="prospect-hero-stat">
              <div class="prospect-hero-stat-value">3</div>
              <div class="prospect-hero-stat-label">States</div>
            </div>
            <div class="prospect-hero-stat">
              <div class="prospect-hero-stat-value">$140M</div>
              <div class="prospect-hero-stat-label">Total AUM</div>
            </div>
          </div>
        </div>
      </div>`;
  },

  /* ================================================================
     SECTION 2 — KPI STRIP
  ================================================================ */
  _renderKPIStrip() {
    const d = State.getProspectData().platformKPIs;
    const kpis = [
      { label: 'Homeowners Served',   value: d.homeownersServed.toLocaleString(), sub: 'Families achieving homeownership' },
      { label: 'Equity Created',      value: '$' + (d.totalEquityCreated / 1e6).toFixed(1) + 'M', sub: 'Total homeowner equity generated' },
      { label: 'Fund ROI',            value: d.fundROI.toFixed(2) + 'x', sub: 'Cumulative return on invested capital' },
      { label: 'Monthly Savings',     value: '$' + d.monthlySavingsPerFamily.toLocaleString(), sub: 'Average PITI reduction per family' },
      { label: 'Active Programs',     value: d.programsActive, sub: 'Across multiple states' },
    ];

    return `
      <div class="prospect-section">
        <div class="stat-row">
          ${kpis.map(k => `
            <div class="stat-item">
              <div class="stat-label">${k.label}</div>
              <div class="stat-value" style="font-size:26px">${k.value}</div>
              <div class="stat-desc">${k.sub}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ================================================================
     SECTION 3 — PROGRAM OVERVIEW
  ================================================================ */
  _renderProgramOverview() {
    const data = State.getProspectData();
    const programs = data.programs;
    const filter = this._programFilter;

    const tabs = [{ key: 'all', label: 'All Programs' }, ...programs.map(p => ({ key: p.id, label: p.name }))];
    const tabsHtml = tabs.map(t =>
      `<button class="dash-prog-tab ${filter === t.key ? 'active' : ''}"
              onclick="ProspectDashboardView._setProgramFilter('${t.key}')">${t.label}</button>`
    ).join('');

    const filtered = filter === 'all' ? programs : programs.filter(p => p.id === filter);

    const cardsHtml = filtered.map(p => `
      <div class="prospect-program-card">
        <div class="prospect-program-header">
          <span class="prospect-program-geo">${p.geography}</span>
          <span class="badge badge-active" style="font-size:10px">${p.status}</span>
        </div>
        <div class="prospect-program-name">${p.name}</div>
        <div class="prospect-program-metrics">
          <div class="prospect-program-metric">
            <span class="prospect-pm-label">Fund Size</span>
            <span class="prospect-pm-value">$${(p.fundSize / 1e6).toFixed(1)}M</span>
          </div>
          <div class="prospect-program-metric">
            <span class="prospect-pm-label">Homeowners</span>
            <span class="prospect-pm-value">${p.homeownersServed}</span>
          </div>
          <div class="prospect-program-metric">
            <span class="prospect-pm-label">Equity Created</span>
            <span class="prospect-pm-value">$${(p.equityCreated / 1e6).toFixed(1)}M</span>
          </div>
          <div class="prospect-program-metric">
            <span class="prospect-pm-label">Fund ROI</span>
            <span class="prospect-pm-value">${p.roi.toFixed(2)}x</span>
          </div>
          <div class="prospect-program-metric">
            <span class="prospect-pm-label">Monthly Savings</span>
            <span class="prospect-pm-value">$${p.monthlySavings.toLocaleString()}</span>
          </div>
          <div class="prospect-program-metric">
            <span class="prospect-pm-label">HPA Assumption</span>
            <span class="prospect-pm-value">${p.hpa}%</span>
          </div>
        </div>
        <div class="prospect-program-params">
          <span>SAM ${p.samPct}%</span>
          <span>Down ${p.downPayment}%</span>
          <span>Rate ${p.interestRate}%</span>
          <span>Fee ${p.programFee}%</span>
        </div>
      </div>`).join('');

    return `
      <div class="prospect-section">
        <div class="prospect-section-header">
          <h2 class="prospect-section-title">Program Overview</h2>
          <div class="dash-prog-tabs-wrap">${tabsHtml}</div>
        </div>
        <div class="prospect-programs-grid">${cardsHtml}</div>
      </div>`;
  },

  /* ================================================================
     SECTION 4 — TYPICAL BORROWER PROFILE
  ================================================================ */
  _renderBorrowerProfile() {
    const bp = State.getProspectData().borrowerProfile;

    return `
      <div class="prospect-section">
        <h2 class="prospect-section-title">Typical Borrower Profile</h2>
        <div class="card">
          <div class="prospect-comparison">
            <div class="prospect-comparison-col prospect-comparison-before">
              <div class="prospect-comp-label">BEFORE HOMIUM</div>
              <div class="prospect-comp-items">
                <div class="prospect-comp-row">
                  <span>Income</span>
                  <span>$${bp.income.toLocaleString()}</span>
                </div>
                <div class="prospect-comp-row">
                  <span>Home Price</span>
                  <span>$${bp.homePrice.toLocaleString()}</span>
                </div>
                <div class="prospect-comp-row">
                  <span>Monthly PITI</span>
                  <span class="prospect-comp-bold">$${bp.beforeHomium.monthlyPITI.toLocaleString()}</span>
                </div>
                <div class="prospect-comp-row">
                  <span>Max Affordable</span>
                  <span>$${bp.beforeHomium.maxAffordable.toLocaleString()}</span>
                </div>
              </div>
              <div class="prospect-comp-gap">Gap: $${(bp.beforeHomium.monthlyPITI - bp.withHomium.monthlyPITI).toLocaleString()}/mo</div>
            </div>

            <div class="prospect-comparison-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>

            <div class="prospect-comparison-col prospect-comparison-after">
              <div class="prospect-comp-label">WITH HOMIUM</div>
              <div class="prospect-comp-items">
                <div class="prospect-comp-row">
                  <span>Monthly PITI</span>
                  <span class="prospect-comp-bold prospect-comp-green">$${bp.withHomium.monthlyPITI.toLocaleString()}</span>
                </div>
                <div class="prospect-comp-row">
                  <span>Monthly Savings</span>
                  <span class="prospect-comp-green">$${bp.withHomium.monthlySavings.toLocaleString()}</span>
                </div>
              </div>
              <div class="prospect-comp-affordable">Affordable!</div>
            </div>
          </div>

          <div class="prospect-comp-headline">${bp.headline}</div>
        </div>
      </div>`;
  },

  /* ================================================================
     SECTION 5 — IMPACT SUMMARY
  ================================================================ */
  _renderImpactSummary() {
    const data = State.getProspectData();
    const bp = data.borrowerProfile;

    return `
      <div class="prospect-section">
        <h2 class="prospect-section-title">Impact Summary</h2>
        <div class="card">
          <p class="prospect-impact-text">${data.impactSummary}</p>
          <div class="prospect-gap-visual">
            <div class="prospect-gap-label">AFFORDABILITY GAP</div>
            <div class="prospect-gap-value">$${bp.affordabilityGap.toLocaleString()}</div>
            <div class="prospect-gap-desc">
              A family earning 80.0% of area median income cannot afford the median home at 35% DTI with a 3% down payment.
              A 35.0% Homium shared appreciation mortgage closes this gap.
            </div>
          </div>
        </div>
      </div>`;
  },

  /* ================================================================
     SECTION 6 — KEY IMPACT LOAN METRICS
  ================================================================ */
  _renderLoanMetrics() {
    const programs = State.getProspectData().programs;
    const filter = this._programFilter;
    const filtered = filter === 'all' ? programs : programs.filter(p => p.id === filter);

    const metrics = [
      { key: 'avgHomeSalesPrice', label: 'Avg Home Sales Price', fmt: v => '$' + v.toLocaleString() },
      { key: 'avgSAMPct',        label: 'Avg Homium SAM %',     fmt: v => v + '%' },
      { key: 'avgAMI',           label: 'Avg AMI',              fmt: v => v + '%' },
      { key: 'avgFirstLienRate', label: 'Avg First Lien Rate',  fmt: v => v.toFixed(2) + '%' },
      { key: 'avgFirstLienLTV',  label: 'Avg First Lien LTV',   fmt: v => v + '%' },
      { key: 'avgFICO',          label: 'Avg FICO Score',       fmt: v => v.toString() },
      { key: 'avgIncome',        label: 'Avg Monthly Income',   fmt: v => '$' + Math.round(v / 12).toLocaleString() },
      { key: 'avgFrontRatio',    label: 'Avg Front Ratio',      fmt: v => v + '%' },
      { key: 'avgBackRatio',     label: 'Avg Back Ratio',       fmt: v => v + '%' },
      { key: 'avgPITI',          label: 'Avg Monthly PITI + Maintenance', fmt: v => '$' + v.toLocaleString() },
    ];

    const headerCells = filtered.map(p => `<th style="text-align:right">${p.name}</th>`).join('');
    const rows = metrics.map(m => {
      const cells = filtered.map(p => `<td style="text-align:right;font-weight:600">${m.fmt(p[m.key])}</td>`).join('');
      return `<tr><td>${m.label}</td>${cells}</tr>`;
    }).join('');

    return `
      <div class="prospect-section">
        <h2 class="prospect-section-title">Key Impact Loan Data</h2>
        <div class="card">
          <div class="table-container" style="border:none;box-shadow:none">
            <table>
              <thead><tr><th>Metric</th>${headerCells}</tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  /* ================================================================
     SECTION 7 — BORROWER STORIES
  ================================================================ */
  _renderBorrowerStories() {
    const stories = State.getProspectData().borrowerStories;

    const cardsHtml = stories.map(s => `
      <div class="prospect-story-card">
        <span class="prospect-story-badge">${s.badge}</span>
        <h3 class="prospect-story-headline">${s.headline}</h3>
        <p class="prospect-story-desc">${s.description}</p>
      </div>`).join('');

    return `
      <div class="prospect-section">
        <h2 class="prospect-section-title">Borrower Stories</h2>
        <div class="prospect-stories-grid">${cardsHtml}</div>
      </div>`;
  },

  /* ================================================================
     SECTION 8 — 30-YEAR PROJECTIONS
  ================================================================ */
  _renderProjections() {
    const programs = State.getProspectData().programs;
    const filter = this._programFilter;
    const prog = filter === 'all' ? programs[0] : programs.find(p => p.id === filter) || programs[0];
    const proj = prog.projections;

    const progName = filter === 'all' ? 'Utah Program' : prog.name;

    /* ── Equity Created area chart (SVG) ── */
    const eqMax = Math.max(...proj.map(p => p.equity));
    const eqPoints = proj.map((p, i) => {
      const x = (i / (proj.length - 1)) * 280 + 10;
      const y = 140 - (p.equity / eqMax) * 120;
      return `${x},${y}`;
    }).join(' ');
    const eqArea = `${10},${140} ${eqPoints} ${280 + 10},${140}`;
    const eqFinalLabel = '$' + (proj[proj.length - 1].equity / 1e6).toFixed(0) + 'M';

    const equityChart = `
      <div class="prospect-chart-card">
        <div class="prospect-chart-label">HOMEOWNER EQUITY CREATED</div>
        <svg viewBox="0 0 300 160" class="prospect-chart-svg">
          <polygon points="${eqArea}" fill="var(--color-primary-container)" opacity="0.5"/>
          <polyline points="${eqPoints}" fill="none" stroke="var(--color-primary)" stroke-width="2"/>
          <text x="290" y="${140 - (proj[proj.length - 1].equity / eqMax) * 120 - 6}" text-anchor="end" class="prospect-chart-text">${eqFinalLabel}</text>
        </svg>
        <div class="prospect-chart-xaxis-labels">
          <span>${proj[0].year}</span><span>${proj[Math.floor(proj.length / 2)].year}</span><span>${proj[proj.length - 1].year}</span>
        </div>
      </div>`;

    /* ── Active Homeowners bar chart ── */
    const hoMax = Math.max(...proj.map(p => p.activeHOs));
    const barsHtml = proj.map(p => {
      const pct = hoMax > 0 ? (p.activeHOs / hoMax) * 100 : 0;
      return `<div class="prospect-bar-col">
        <div class="prospect-bar" style="height:${Math.max(pct, 2)}%"></div>
        <span class="prospect-bar-year">${String(p.year).slice(2)}</span>
      </div>`;
    }).join('');

    const homeownersChart = `
      <div class="prospect-chart-card">
        <div class="prospect-chart-label">ACTIVE HOMEOWNERS</div>
        <div class="prospect-chart-topval">${hoMax.toLocaleString()}</div>
        <div class="prospect-bars-wrap">${barsHtml}</div>
      </div>`;

    /* ── Fund Value & Returns (dual line SVG) ── */
    const fvMax = Math.max(...proj.map(p => Math.max(p.fundNAV, p.capitalReturned)));
    const fvPoints = proj.map((p, i) => {
      const x = (i / (proj.length - 1)) * 280 + 10;
      const y = 140 - (p.fundNAV / fvMax) * 120;
      return `${x},${y}`;
    }).join(' ');
    const crPoints = proj.map((p, i) => {
      const x = (i / (proj.length - 1)) * 280 + 10;
      const y = 140 - (p.capitalReturned / fvMax) * 120;
      return `${x},${y}`;
    }).join(' ');

    const fundChart = `
      <div class="prospect-chart-card">
        <div class="prospect-chart-label">FUND VALUE & RETURNS</div>
        <svg viewBox="0 0 300 160" class="prospect-chart-svg">
          <polyline points="${fvPoints}" fill="none" stroke="var(--color-text-secondary)" stroke-width="2"/>
          <polyline points="${crPoints}" fill="none" stroke="var(--color-primary)" stroke-width="2"/>
        </svg>
        <div class="prospect-chart-legend">
          <span><span class="prospect-legend-line" style="background:var(--color-text-secondary)"></span> Fund Value</span>
          <span><span class="prospect-legend-line" style="background:var(--color-primary)"></span> Returned Capital</span>
        </div>
        <div class="prospect-chart-xaxis-labels">
          <span>${proj[0].year}</span><span>${proj[Math.floor(proj.length / 2)].year}</span><span>${proj[proj.length - 1].year}</span>
        </div>
      </div>`;

    /* ── Cumulative ROI line chart ── */
    const roiMax = Math.max(...proj.map(p => p.roi)) || 1;
    const roiPoints = proj.map((p, i) => {
      const x = (i / (proj.length - 1)) * 280 + 10;
      const y = 140 - (p.roi / roiMax) * 120;
      return `${x},${y}`;
    }).join(' ');
    const roiFinal = proj[proj.length - 1].roi.toFixed(2) + 'x';

    const roiChart = `
      <div class="prospect-chart-card">
        <div class="prospect-chart-label">CUMULATIVE ROI</div>
        <svg viewBox="0 0 300 160" class="prospect-chart-svg">
          <polyline points="${roiPoints}" fill="none" stroke="var(--color-primary)" stroke-width="2"/>
          <text x="290" y="${140 - (proj[proj.length - 1].roi / roiMax) * 120 - 6}" text-anchor="end" class="prospect-chart-text">${roiFinal}</text>
        </svg>
        <div class="prospect-chart-xaxis-labels">
          <span>${proj[0].year}</span><span>${proj[Math.floor(proj.length / 2)].year}</span><span>${proj[proj.length - 1].year}</span>
        </div>
      </div>`;

    return `
      <div class="prospect-section">
        <div class="prospect-section-header">
          <h2 class="prospect-section-title">30-Year Projections</h2>
          <span class="prospect-proj-note">${progName} &middot; ${prog.hpa}% HPA &middot; ${prog.interestRate}% Rate</span>
        </div>
        <div class="prospect-projections-grid">
          ${equityChart}
          ${homeownersChart}
          ${fundChart}
          ${roiChart}
        </div>
      </div>`;
  },

  /* ================================================================
     SECTION 9 — CALL TO ACTION
  ================================================================ */
  _renderCTA() {
    return `
      <div class="prospect-cta">
        <h2 class="prospect-cta-title">Interested in funding a program?</h2>
        <p class="prospect-cta-desc">Join Homium's network of impact investors and help families achieve homeownership while generating returns.</p>
        <button class="btn btn-primary btn-lg" onclick="alert('Contact request submitted. Our team will reach out shortly.')">
          Get in Touch
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:6px"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
        </button>
      </div>`;
  },
};
