/* ============================================================
   HOMIUM ORIGINATOR FLOW — Welcome / First-Login View
   Shown to LO and LP users right after KYC + onboarding completes
   (and on demand via Profile → "Replay welcome screen").

   Renders as a MODAL overlay on top of /data/applications so the
   user sees their actual workspace behind the welcome card. Both
   footer CTAs flip welcomeSeen=true and dismiss the modal.
   "Continue to applications" then triggers the coachmark tour from
   step 1; "Skip" sets tutorialsEnabled=false to opt the user out.
   ============================================================ */

const WelcomeView = {

  /* ---- Modal entry point ----
     Mounts the welcome card as an overlay over the current page
     (intended use: /data/applications). Idempotent — calling open
     twice replaces existing content. */
  openModal() {
    const u = State.getCurrentUser();
    if (!u) return;
    let host = document.getElementById('welcome-modal-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'welcome-modal-host';
      document.body.appendChild(host);
    }
    host.innerHTML = this._renderModal(u);
  },

  closeModal() {
    const host = document.getElementById('welcome-modal-host');
    if (host) host.remove();
  },

  /* Page-style render kept as a fallback (replay-welcome from profile,
     direct /welcome route). Routes its own CTAs through the modal flow
     so behavior stays consistent. */
  render() {
    const u = State.getCurrentUser();
    if (!u) return '<div class="page-body">No user.</div>';
    return this._renderInner(u, /* asModal */ false);
  },

  _renderModal(u) {
    return `
      <div class="welcome-modal-overlay" onclick="if(event.target===this)WelcomeView._skip()">
        <div class="welcome-modal" role="dialog" aria-label="Welcome to Homium">
          <button class="welcome-modal-close" aria-label="Close" onclick="WelcomeView._skip()">×</button>
          ${this._renderInner(u, /* asModal */ true)}
        </div>
      </div>
    `;
  },

  _renderInner(u, asModal) {
    const role = u.role;
    const isLO = role === 'lo';
    const branch = u.branchId ? State.getBranch(u.branchId) : null;
    const company = u.companyId ? State.getCompany(u.companyId) : null;

    const enablement = this._resolveEnablement(branch);
    const loans = isLO ? State.getLoansByLO(u.id) : [];
    const isFirstApp = isLO && loans.length === 0;

    if (asModal) {
      // Compact modal layout: hero + folded enablement, then resources, then footer.
      return `
        <div class="welcome-page welcome-page-modal">
          ${this._renderHero(u, role, branch, company, /* withEnablement */ enablement)}
          ${this._renderResourcesCard()}
          ${this._renderFooter(isLO, isFirstApp)}
        </div>
      `;
    }

    return `
      <div class="welcome-page">
        ${this._renderHero(u, role, branch, company)}
        ${this._renderFirstAppCta(isLO, isFirstApp, enablement)}
        ${this._renderEnablementCard(enablement, role, branch)}
        ${this._renderResourcesCard()}
        ${this._renderFooter(isLO, isFirstApp)}
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
  _renderHero(u, role, branch, company, enablement) {
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

    // Optional folded enablement strip (only used when modal compacting):
    let enablementStrip = '';
    if (enablement && enablement.programs && enablement.programs.length) {
      const programChips = enablement.programs
        .map(p => `<span class="welcome-hero-program">${p.name}</span>`)
        .join('');
      const marketLine = enablement.markets.length
        ? enablement.markets.map(m => m.code).join(' · ')
        : '—';
      enablementStrip = `
        <div class="welcome-hero-enablement">
          <span class="welcome-hero-enablement-label">Enabled for</span>
          <span class="welcome-hero-enablement-progs">${programChips}</span>
          <span class="welcome-hero-enablement-markets">Active in ${marketLine}</span>
        </div>`;
    }

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
        ${enablementStrip}
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

  _renderFooter(isLO, isFirstApp) {
    const startBtn = (isLO && isFirstApp)
      ? `<button class="btn btn-secondary btn-sm" onclick="WelcomeView._continue({ openNewApp: true })">Start your first application →</button>`
      : '';
    return `
      <div class="welcome-footer">
        <button class="btn btn-ghost" onclick="WelcomeView._skip()">Skip — don't show again</button>
        <div style="display:flex;gap:8px">
          ${startBtn}
          <button class="btn btn-primary btn-lg" onclick="WelcomeView._continue()">Continue to applications →</button>
        </div>
      </div>
    `;
  },

  /* ---- Actions ----
     The user is already on /data/applications behind the modal; these
     handlers dismiss the modal in place rather than re-navigating. */
  _continue(opts = {}) {
    const u = State.getCurrentUser();
    if (u) {
      // Reset the tour to step 0 every time we exit the welcome modal.
      // "Start your first application" is an action path — skip the tour
      // for that and just open the stepper. "Continue to applications"
      // runs the tour from the first step.
      State.setWelcomePrefs(u.id, {
        welcomeSeen: true,
        tourCursor: 0,
        dismissedSteps: [],
        tourCompleted: !!opts.openNewApp,
      });
    }
    this.closeModal();
    // If invoked from the legacy /welcome page route, get the user onto
    // the applications page first so the tour anchors are present.
    if (Router.getCurrentPath() !== '/data/applications') {
      Router.navigate('/data/applications');
    }
    if (opts.openNewApp && typeof NewApplicationStepperView !== 'undefined') {
      setTimeout(() => NewApplicationStepperView.open(), 60);
      return;
    }
    // Kick the tour after the artboard has had a chance to mount.
    if (typeof Coachmarks !== 'undefined') {
      setTimeout(() => Coachmarks.maybeStart(), 80);
    }
  },

  _skip() {
    const u = State.getCurrentUser();
    if (u) State.setWelcomePrefs(u.id, {
      welcomeSeen: true,
      tutorialsEnabled: false,
      tourCompleted: true,
      tourCursor: 0,
      dismissedSteps: [],
    });
    this.closeModal();
    if (Router.getCurrentPath() !== '/data/applications') {
      Router.navigate('/data/applications');
    }
  },
};

window.WelcomeView = WelcomeView;
