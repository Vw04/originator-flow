/* ============================================================
   HOMIUM ORIGINATOR FLOW — Welcome / First-Login View
   Shown to LO and LP users right after KYC + onboarding completes
   (and on demand via Profile → "Replay welcome screen"). Fronts the
   first session with: greeting, verification proof, programs they're
   enabled for, a first-application CTA (LO only when zero loans), and
   a small set of orientation resources.

   Routing rules live in app.js:
     - /welcome is registered there; non-LO/LP roles get bounced.
     - OnboardingFlowView._finish() sends LO/LP to /welcome on first
       run (welcomePrefs.welcomeSeen === false), else to
       /data/applications.

   Both footer CTAs flip welcomeSeen=true. "Continue" leaves
   tutorialsEnabled at default true so the post-welcome coachmark tour
   fires on the next page; "Skip" sets tutorialsEnabled=false to opt
   the user out entirely.
   ============================================================ */

const WelcomeView = {

  render() {
    const u = State.getCurrentUser();
    if (!u) return '<div class="page-body">No user.</div>';

    const role = u.role;
    const isLO = role === 'lo';
    const branch = u.branchId ? State.getBranch(u.branchId) : null;
    const company = u.companyId ? State.getCompany(u.companyId) : null;

    const enablement = this._resolveEnablement(branch);
    const loans = isLO ? State.getLoansByLO(u.id) : [];
    const isFirstApp = isLO && loans.length === 0;

    return `
      <div class="welcome-page">
        ${this._renderHero(u, role, branch, company)}
        ${this._renderFirstAppCta(isLO, isFirstApp, enablement)}
        ${this._renderEnablementCard(enablement, role, branch)}
        ${this._renderResourcesCard()}
        ${this._renderFooter()}
      </div>
    `;
  },

  /* ---- Data helpers ---- */
  _resolveEnablement(branch) {
    if (!branch) return { programs: [], markets: [] };
    const lpmIds = State.getOcEnablement(branch.companyId);
    const lpms = lpmIds.map(id => State.getLPM(id)).filter(Boolean);
    const programIds = [...new Set(lpms.map(l => l.programId))];
    const marketIds  = [...new Set(lpms.map(l => l.marketId))];
    const programs = programIds.map(id => State.getLoanProgram(id)).filter(Boolean);
    const markets  = marketIds.map(id => State.getMarket(id)).filter(Boolean);
    return { programs, markets };
  },

  /* ---- Sections ---- */
  _renderHero(u, role, branch, company) {
    const fullName = Display.fullName(u);
    const firstName = u.firstName || fullName;
    const subtitleParts = [Display.roleName(role)];
    if (branch?.name) subtitleParts.push(`at ${branch.name}`);
    if (company?.name && company.name !== branch?.name) subtitleParts.push(company.name);
    const subtitle = subtitleParts.join(' · ');

    const kycOk   = u.kyc?.status === 'verified' || u.onboardingStatus === 'active';
    const nmlsOk  = u.nmlsLink?.status === 'verified' || (!!u.nmlsId && u.onboardingStatus === 'active');
    const onbOk   = u.onboardingStatus === 'active';

    const checks = [
      { ok: kycOk,  label: 'Identity verified' },
      { ok: nmlsOk, label: 'NMLS linked' },
      { ok: onbOk,  label: 'Onboarding complete' },
    ].filter(c => c.ok);

    return `
      <div class="welcome-hero">
        <div class="welcome-hero-row">
          <div>
            <div class="welcome-eyebrow">Welcome to Homium</div>
            <h1 class="welcome-title">Welcome, ${firstName}.</h1>
            <div class="welcome-subtitle">${subtitle}</div>
          </div>
          <span class="role-chip ${Display.roleClass(role)}">${Display.roleName(role)}</span>
        </div>
        <div class="welcome-checks">
          ${checks.map(c => `<span class="welcome-check"><span class="welcome-check-dot">✓</span>${c.label}</span>`).join('')}
        </div>
      </div>
    `;
  },

  _renderFirstAppCta(isLO, isFirstApp, enablement) {
    if (!isFirstApp && isLO) return '';

    if (!isLO) {
      // LP / branch staff variant — secondary tone, queue-oriented copy
      return `
        <div class="card welcome-card welcome-cta welcome-cta-secondary">
          <div class="welcome-cta-content">
            <div class="welcome-card-eyebrow">Get oriented</div>
            <div class="welcome-card-title">Your branch's applications queue</div>
            <div class="welcome-card-body">
              You'll work alongside your loan officers to move applications through review,
              docs, and submission. Open the queue to see what's in flight.
            </div>
          </div>
          <button class="btn btn-secondary btn-lg" onclick="WelcomeView._continue()">
            Open applications queue →
          </button>
        </div>
      `;
    }

    const nPrograms = enablement.programs.length;
    const nMarkets  = enablement.markets.length;
    const enableLine = nPrograms > 0
      ? `You're enabled for <b>${nPrograms}</b> program${nPrograms === 1 ? '' : 's'} across <b>${nMarkets}</b> market${nMarkets === 1 ? '' : 's'}.`
      : `Your branch enablement is being set up — applications will open up shortly.`;

    return `
      <div class="card welcome-card welcome-cta">
        <div class="welcome-cta-content">
          <div class="welcome-card-eyebrow">Ready when you are</div>
          <div class="welcome-card-title">Originate your first loan</div>
          <div class="welcome-card-body">${enableLine}</div>
        </div>
        <button class="btn btn-primary btn-lg" onclick="WelcomeView._continue({ openNewApp: true })">
          Start your first application →
        </button>
      </div>
    `;
  },

  _renderEnablementCard(enablement, role, branch) {
    const ownerLabel = role === 'lp' ? 'Your branch is enabled for' : 'You’re enabled for';
    if (enablement.programs.length === 0) {
      return `
        <div class="card welcome-card">
          <div class="welcome-card-title-sm">${ownerLabel}</div>
          <div class="welcome-card-body" style="color:var(--color-text-secondary)">
            No programs are enabled yet${branch?.name ? ` for ${branch.name}` : ''}.
            Your administrator can enable program-market combinations to unlock origination.
          </div>
        </div>
      `;
    }

    const programChips = enablement.programs
      .map(p => `<span class="badge badge-active welcome-chip">${p.name}</span>`)
      .join(' ');
    const marketLine = enablement.markets.length
      ? enablement.markets.map(m => m.code).join(' · ')
      : '—';

    return `
      <div class="card welcome-card">
        <div class="welcome-card-title-sm">${ownerLabel}</div>
        <div class="welcome-chip-row">${programChips}</div>
        <div class="welcome-card-meta">Active in ${marketLine}</div>
      </div>
    `;
  },

  _renderResourcesCard() {
    // Static demo links — no real navigation. The point is to show shape.
    const items = [
      { icon: '📘', title: 'Loan officer handbook',  desc: 'How originations move through Homium' },
      { icon: '📋', title: 'Product matrix',          desc: 'Programs, eligibility, rate sheets' },
      { icon: '✅', title: 'Submission checklist',    desc: 'What underwriting expects per file' },
      { icon: '🛟', title: 'Support & escalation',    desc: 'Contacts, hours, response times' },
    ];

    return `
      <div class="card welcome-card">
        <div class="welcome-card-title-sm">First time here? Start with these</div>
        <div class="welcome-resources">
          ${items.map(it => `
            <a class="welcome-resource" href="#" onclick="event.preventDefault()">
              <span class="welcome-resource-icon">${it.icon}</span>
              <div class="welcome-resource-text">
                <div class="welcome-resource-title">${it.title}</div>
                <div class="welcome-resource-desc">${it.desc}</div>
              </div>
              <span class="welcome-resource-chev">›</span>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  },

  _renderFooter() {
    return `
      <div class="welcome-footer">
        <button class="btn btn-ghost" onclick="WelcomeView._skip()">Skip — don't show again</button>
        <button class="btn btn-primary btn-lg" onclick="WelcomeView._continue()">Continue to applications →</button>
      </div>
    `;
  },

  /* ---- Actions ---- */
  _continue(opts = {}) {
    const u = State.getCurrentUser();
    if (u) {
      const patch = { welcomeSeen: true };
      // When the user takes the "Start your first application" CTA, jump
      // the tour cursor past the apps-list intro steps so the coachmarks
      // land on the stepper fields, not on the button the modal covers.
      if (opts.openNewApp) {
        const idx = (typeof Coachmarks !== 'undefined')
          ? Coachmarks.TOUR.findIndex(s => s.id === 'newapp-borrower')
          : -1;
        if (idx > 0) patch.tourCursor = idx;
      }
      State.setWelcomePrefs(u.id, patch);
    }
    if (opts.openNewApp && typeof NewApplicationStepperView !== 'undefined') {
      Router.navigate('/data/applications');
      // Open stepper after the applications view mounts; coachmark engine
      // (post-render hook in app.js, 50ms delay) will then anchor on it.
      setTimeout(() => NewApplicationStepperView.open(), 60);
      return;
    }
    Router.navigate('/data/applications');
  },

  _skip() {
    const u = State.getCurrentUser();
    if (u) State.setWelcomePrefs(u.id, { welcomeSeen: true, tutorialsEnabled: false, tourCompleted: true });
    Router.navigate('/data/applications');
  },
};

window.WelcomeView = WelcomeView;
