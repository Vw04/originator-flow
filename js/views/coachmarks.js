/* ============================================================
   HOMIUM ORIGINATOR FLOW — Coachmark Tour Engine
   Vanilla JS, no library. Multi-page guided tour for OC users
   (LO / LP / branch staff). Drives a single linear sequence of
   steps across the applications view, the new-application stepper,
   the profile page, and the notifications bell.

   How it runs:
     1. After welcome → continue, the user lands on /data/applications.
     2. Each relevant view calls `Coachmarks.maybeStart()` from its
        post-render hook in app.js.
     3. The engine looks up the current step (welcomePrefs.tourCursor),
        verifies its route matches the current path, and renders the
        spotlight + tooltip anchored on the step's CSS selector.
     4. "Next" advances the cursor; if the next step lives on a
        different route, the engine navigates there. The next view's
        render hook will then resume the tour automatically.

   Persistence: welcomePrefs on the user object — survives navigation
   within the session. Not persisted across full page reloads (state
   is in-memory by design — see js/state.js header comment).
   ============================================================ */

const Coachmarks = {

  // Tour definition. Each entry is one step. `route` is matched against
  // Router.getCurrentPath() at runtime. `trigger` runs before anchoring
  // so we can open modals or drawers as the tour progresses.
  /* Tour structure (Round 4 redesign):
       Phase 1 — Orient: what is this page, what's on it (4 steps)
       Phase 2 — Walk a sample loan to teach the detail page (4 steps)
       Phase 3 — Create a new application (5 steps)
       Phase 4 — Notifications + how to replay (2 steps)

     `requires`:  'app-list' | 'app-detail' — context the step expects.
     `trigger`:   'open-sample-loan' | 'close-loan' | 'open-newapp' | 'close-newapp'
     `optional`:  true → cascade-skip when anchor missing instead of pausing
     `placement`: 'top' | 'bottom' | 'left' | 'right' (defaults to bottom)
  */
  TOUR: [
    /* ---------- Phase 1: orient ---------- */
    {
      id: 'apps-intro',
      route: '/data/applications',
      requires: 'app-list',
      trigger: 'close-loan',
      target: '[data-cm="apps-page"]',
      title: 'Welcome to your Applications',
      body: 'This is your loan-origination pipeline. Every application you start lives here — from prequalification through closing. Track progress, spot what needs attention, and create new applications.',
      placement: 'bottom',
    },
    {
      id: 'apps-stats',
      route: '/data/applications',
      requires: 'app-list',
      target: '[data-cm="apps-stats"]',
      title: 'Your pipeline at a glance',
      body: 'Top-line metrics: how many applications you have in flight, total committed value, average days in stage, and how many need your attention.',
      placement: 'bottom',
      optional: true,
    },
    {
      id: 'apps-banner',
      route: '/data/applications',
      requires: 'app-list',
      target: '[data-cm="apps-banner"]',
      title: 'Aging & action items',
      body: 'Loans sitting in a stage too long surface here as a flag — a personal nudge to keep deals moving.',
      placement: 'bottom',
      optional: true,
    },
    {
      id: 'apps-table',
      route: '/data/applications',
      requires: 'app-list',
      target: '[data-cm="apps-table"]',
      title: 'Your loan list',
      body: 'Every application you\'re working on. Sort by status or amount, filter, search by borrower or loan ID.',
      placement: 'top',
      optional: true,
    },

    /* ---------- Phase 2: walk a sample loan ---------- */
    {
      id: 'open-sample',
      route: '/data/applications',
      requires: 'app-list',
      target: '[data-cm="app-row"]',
      title: 'Open a loan to dig in',
      body: 'Click any row to open its detail page. We\'ll click for you — Next →.',
      placement: 'top',
      optional: true,
    },
    {
      id: 'loan-header',
      route: '/data/applications',
      requires: 'app-detail',
      trigger: 'open-sample-loan',
      target: '[data-cm="loan-header"]',
      title: 'The loan-detail page',
      body: 'The header shows where this loan is and the key data: address, loan ID, program, amount, LTV, FICO, and the borrower / loan officer of record.',
      placement: 'bottom',
    },
    {
      id: 'loan-action',
      route: '/data/applications',
      requires: 'app-detail',
      target: '[data-cm="loan-action"]',
      title: 'Next required action',
      body: 'The most actionable item is surfaced at the top of the loan, with a deadline. Click the button to jump straight to that task.',
      placement: 'bottom',
      optional: true,
    },
    {
      id: 'loan-deeper',
      route: '/data/applications',
      requires: 'app-detail',
      target: '[data-cm="loan-tabs"]',
      title: 'Dive deeper',
      body: 'Tabs for Overview, Tasks, Documents, Parties, and History. The right-side panel keeps borrower info, key dates, and the active checklist within reach.',
      placement: 'top',
      optional: true,
    },

    /* ---------- Phase 3: create a new application ---------- */
    {
      id: 'apps-newbtn',
      route: '/data/applications',
      requires: 'app-list',
      trigger: 'close-loan',
      target: '[data-cm="new-app"]',
      title: 'Start a new application',
      body: 'Now let\'s start one from scratch. Click + New application — or hit Next and we\'ll open the form.',
      placement: 'bottom',
    },
    {
      id: 'newapp-borrower',
      route: '/data/applications',
      requires: 'app-list',
      trigger: 'open-newapp',
      stepperStep: 0,
      target: '[data-cm="field-borrower"]',
      title: 'Start with the borrower',
      body: 'Names must match the borrower\'s government ID. Mismatches block downstream KYC re-checks at our underwriting partner.',
      placement: 'right',
    },
    {
      id: 'newapp-property',
      route: '/data/applications',
      requires: 'app-list',
      trigger: 'open-newapp',
      stepperStep: 1,
      target: '[data-cm="field-property"]',
      title: 'Property details',
      body: 'The address determines which markets and programs are eligible. State and ZIP are required for licensing checks.',
      placement: 'right',
    },
    {
      id: 'newapp-terms',
      route: '/data/applications',
      requires: 'app-list',
      trigger: 'open-newapp',
      stepperStep: 2,
      target: '[data-cm="field-terms"]',
      title: 'Loan terms',
      body: 'Pick the program your branch is enabled for. Amount and term feed into the rate sheet and pricing engine.',
      placement: 'right',
    },
    {
      id: 'newapp-submit',
      route: '/data/applications',
      requires: 'app-list',
      trigger: 'open-newapp',
      stepperStep: 3,
      target: '[data-cm="submit"]',
      title: 'Submit to underwriting',
      body: 'Once submitted, this application is flagged to our underwriting team for review. If anything needs attention they\'ll add a note on the application — and you\'ll see a notification update.',
      placement: 'top',
    },

    /* ---------- Phase 4: notifications + replay ---------- */
    {
      id: 'notif-bell',
      route: '/data/applications',
      requires: 'app-list',
      trigger: 'close-newapp',
      target: '#topnav-notif',
      title: 'Updates land here',
      body: 'Action items, sent updates, completions, and platform info — color-coded so you can scan quickly. Click any notification to jump to that loan.',
      placement: 'bottom',
    },
    {
      id: 'profile-tutorials',
      route: '/profile',
      target: '[data-cm="tutorials-section"]',
      title: 'Replay this anytime',
      body: 'Toggle tutorials off if you don\'t want them. Or re-run this tour or the welcome screen any time from here.',
      placement: 'top',
    },
  ],

  /* ── Public ── */

  // Called from the post-render hook of any view that hosts a tour step.
  maybeStart() {
    const u = State.getCurrentUser();
    if (!u) return;
    if (!['lo', 'lp'].includes(u.role)) return;
    const prefs = State.getWelcomePrefs(u.id);
    if (!prefs.welcomeSeen) return;
    if (!prefs.tutorialsEnabled) return;
    if (prefs.tourCompleted) return;

    // Skip dismissed and route-mismatched steps.
    let cursor = Math.max(0, prefs.tourCursor || 0);
    while (cursor < this.TOUR.length) {
      const step = this.TOUR[cursor];
      if ((prefs.dismissedSteps || []).includes(step.id)) {
        cursor += 1;
        continue;
      }
      if (step.route && step.route !== Router.getCurrentPath()) {
        // Step is on another route — persist and stop. The next view will resume.
        State.setWelcomePrefs(u.id, { tourCursor: cursor });
        this._teardown();
        return;
      }
      // Optional step: skip if anchor doesn't exist
      if (step.optional && !document.querySelector(step.target)) {
        cursor += 1;
        continue;
      }
      this._showStep(cursor);
      State.setWelcomePrefs(u.id, { tourCursor: cursor });
      return;
    }
    // Completed entire tour
    State.setWelcomePrefs(u.id, { tourCompleted: true });
    this._teardown();
  },

  // Cascade flag: true while the engine is auto-advancing past steps
  // whose anchors couldn't be found (vs. a user-driven Next click).
  // While cascading, we suppress modal-popping triggers so the user
  // doesn't get a surprise modal as their first impression.
  _cascading: false,

  next() {
    this._cascading = false;
    this._advance();
  },

  back() {
    const u = State.getCurrentUser();
    if (!u) return;
    const prefs = State.getWelcomePrefs(u.id);
    let cursor = (prefs.tourCursor || 0) - 1;
    // Skip over previously-dismissed steps so Back lands on the most
    // recent step the user actually saw.
    while (cursor >= 0 && (prefs.dismissedSteps || []).includes(this.TOUR[cursor]?.id)) {
      cursor -= 1;
    }
    if (cursor < 0) return; // already at first
    State.setWelcomePrefs(u.id, { tourCursor: cursor });
    const prevStep = this.TOUR[cursor];
    this._cascading = false;
    // If the previous step lives on a different route, navigate back.
    if (prevStep.route && prevStep.route !== Router.getCurrentPath()) {
      this._teardown();
      Router.navigate(prevStep.route);
      return;
    }
    // Run any "reverse" trigger to put the page state back where the
    // step expects (e.g. close the new-app modal so we can show the
    // open-application step again).
    this._runBackwardTrigger(prevStep);
    this._teardown();
    setTimeout(() => this.maybeStart(), 30);
  },

  /* When stepping backward, put the page state back into the shape the
     previous step expects so its anchor is reachable. */
  _runBackwardTrigger(prevStep) {
    // Going back into a list-context step: close any open detail or stepper.
    if (prevStep.requires === 'app-list') {
      if (typeof NewApplicationStepperView !== 'undefined') NewApplicationStepperView.close();
      if (typeof DataPlatformView !== 'undefined' && DataPlatformView._selectedApplicationId) {
        DataPlatformView._selectedApplicationId = null;
        App.renderView(Router.getCurrentPath());
      }
    }
    // Going back into a detail-context step: ensure a sample loan is open
    // and the stepper modal is closed.
    if (prevStep.requires === 'app-detail') {
      if (typeof NewApplicationStepperView !== 'undefined') NewApplicationStepperView.close();
      if (typeof DataPlatformView !== 'undefined' && !DataPlatformView._selectedApplicationId) {
        const loans = (typeof State !== 'undefined' && typeof State.getLoansForRole === 'function')
          ? State.getLoansForRole() : [];
        if (loans[0]) DataPlatformView.openApplication(loans[0].id);
      }
    }
  },

  _advance() {
    const u = State.getCurrentUser();
    if (!u) return;
    const prefs = State.getWelcomePrefs(u.id);
    const cursor = (prefs.tourCursor || 0) + 1;
    State.setWelcomePrefs(u.id, { tourCursor: cursor });

    if (cursor >= this.TOUR.length) {
      State.setWelcomePrefs(u.id, { tourCompleted: true });
      this._teardown();
      this._cascading = false;
      // Close any modal the tour opened
      if (typeof NewApplicationStepperView !== 'undefined') NewApplicationStepperView.close();
      return;
    }

    const next = this.TOUR[cursor];
    if (next.route && next.route !== Router.getCurrentPath()) {
      this._teardown();
      Router.navigate(next.route);
      return;
    }
    // Same route: re-render after running any trigger
    this._teardown();
    setTimeout(() => this.maybeStart(), 30);
  },

  skip() {
    const u = State.getCurrentUser();
    if (u) State.setWelcomePrefs(u.id, { tourCompleted: true });
    if (typeof NewApplicationStepperView !== 'undefined') NewApplicationStepperView.close();
    this._teardown();
  },

  disableForever() {
    const u = State.getCurrentUser();
    if (u) State.setWelcomePrefs(u.id, { tourCompleted: true, tutorialsEnabled: false });
    if (typeof NewApplicationStepperView !== 'undefined') NewApplicationStepperView.close();
    this._teardown();
  },

  dismissCurrent() {
    const u = State.getCurrentUser();
    if (!u) return;
    const prefs = State.getWelcomePrefs(u.id);
    const cur = this.TOUR[prefs.tourCursor || 0];
    if (cur) {
      const dismissed = [...(prefs.dismissedSteps || []), cur.id];
      State.setWelcomePrefs(u.id, { dismissedSteps: dismissed });
    }
    // Engine-driven dismissal counts as a cascade. Public next() resets this.
    this._cascading = true;
    this._advance();
  },

  /* ── Internal ── */

  _showStep(cursor) {
    const step = this.TOUR[cursor];
    if (!step) return;

    // Cascade safety: never auto-open a modal/detail when the engine is
    // fast-forwarding past skipped steps. The user shouldn't get a surprise
    // borrower form (or detail page) as their first impression.
    const modalAlreadyOpen = !!document.getElementById('newapp-stepper-host');
    const detailAlreadyOpen = typeof DataPlatformView !== 'undefined' && !!DataPlatformView._selectedApplicationId;
    if (this._cascading && step.trigger === 'open-newapp' && !modalAlreadyOpen) {
      this.dismissCurrent();
      return;
    }
    if (this._cascading && step.trigger === 'open-sample-loan' && !detailAlreadyOpen) {
      this.dismissCurrent();
      return;
    }

    // Run trigger (open or close a modal / detail page etc.)
    if (step.trigger === 'open-newapp') {
      if (typeof NewApplicationStepperView !== 'undefined') {
        if (!modalAlreadyOpen) {
          NewApplicationStepperView.open();
        }
        if (typeof step.stepperStep === 'number') {
          NewApplicationStepperView._step = step.stepperStep;
          NewApplicationStepperView._render();
        }
      }
    }
    if (step.trigger === 'close-newapp') {
      if (typeof NewApplicationStepperView !== 'undefined') NewApplicationStepperView.close();
    }
    if (step.trigger === 'open-sample-loan') {
      if (typeof DataPlatformView !== 'undefined' && !detailAlreadyOpen) {
        // Pick the first loan in the user's list as the demo target.
        const loans = (typeof State !== 'undefined' && typeof State.getLoansForRole === 'function')
          ? State.getLoansForRole()
          : [];
        const sample = loans[0];
        if (sample) {
          DataPlatformView.openApplication(sample.id);
          // openApplication re-renders, so resume after the next tick.
          setTimeout(() => this.maybeStart(), 60);
          return;
        }
      }
    }
    if (step.trigger === 'close-loan') {
      if (typeof DataPlatformView !== 'undefined' && DataPlatformView._selectedApplicationId) {
        DataPlatformView._selectedApplicationId = null;
        App.renderView(Router.getCurrentPath());
        setTimeout(() => this.maybeStart(), 60);
        return;
      }
    }

    // Wait one frame so any newly-opened modal lays out before we measure.
    requestAnimationFrame(() => this._render(step, cursor));
  },

  _render(step, cursor, retry = 0) {
    this._teardown();
    const target = document.querySelector(step.target);
    if (!target) {
      // Retry several frames to absorb first-paint layout races. The
      // institutional artboard mounts via Babel/React and may not have
      // its anchors in the DOM at the initial 50ms post-render hook.
      // 6 RAFs ≈ 100ms — enough to cover React mount in practice
      // without making a doomed step feel slow.
      if (retry < 6) {
        requestAnimationFrame(() => this._render(step, cursor, retry + 1));
        return;
      }
      // Still missing — advance past this step. dismissCurrent permanently
      // marks it dismissed and calls _advance() under the cascade flag,
      // which prevents any later step's modal-popping trigger from
      // auto-firing.
      this.dismissCurrent();
      return;
    }

    const root = document.createElement('div');
    root.className = 'cm-root';
    root.id = 'cm-root';
    document.body.appendChild(root);

    const r = target.getBoundingClientRect();
    const pad = 6;
    const rect = {
      top:    Math.max(0, r.top - pad),
      left:   Math.max(0, r.left - pad),
      width:  r.width + pad * 2,
      height: r.height + pad * 2,
    };
    rect.bottom = rect.top + rect.height;
    rect.right  = rect.left + rect.width;

    // Four dimmer panels around the target
    const dimAttrs = (top, left, width, height) =>
      `style="top:${top}px;left:${left}px;width:${width}px;height:${height}px"`;
    const vw = window.innerWidth, vh = window.innerHeight;
    root.innerHTML = `
      <div class="cm-dim" ${dimAttrs(0, 0, vw, rect.top)}></div>
      <div class="cm-dim" ${dimAttrs(rect.bottom, 0, vw, vh - rect.bottom)}></div>
      <div class="cm-dim" ${dimAttrs(rect.top, 0, rect.left, rect.height)}></div>
      <div class="cm-dim" ${dimAttrs(rect.top, rect.right, vw - rect.right, rect.height)}></div>
      <div class="cm-spotlight" style="top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px"></div>
    `;

    // Tooltip
    const tip = document.createElement('div');
    tip.className = 'cm-tooltip';
    tip.innerHTML = this._tooltipHtml(step, cursor);
    root.appendChild(tip);

    // Position tooltip
    requestAnimationFrame(() => {
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      const place = step.placement || 'bottom';
      const margin = 12;
      let top, left;

      switch (place) {
        case 'top':
          top = rect.top - th - margin;
          left = rect.left + rect.width / 2 - tw / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - th / 2;
          left = rect.left - tw - margin;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - th / 2;
          left = rect.right + margin;
          break;
        case 'bottom':
        default:
          top = rect.bottom + margin;
          left = rect.left + rect.width / 2 - tw / 2;
          break;
      }
      // Clamp to viewport
      top = Math.max(8, Math.min(top, vh - th - 8));
      left = Math.max(8, Math.min(left, vw - tw - 8));
      tip.style.top = top + 'px';
      tip.style.left = left + 'px';
    });

    // Re-position on resize/scroll
    if (this._reflow) window.removeEventListener('resize', this._reflow);
    this._reflow = () => this._render(step, cursor);
    window.addEventListener('resize', this._reflow);
  },

  _tooltipHtml(step, cursor) {
    const total = this.TOUR.length;
    const isLast = cursor === total - 1;
    const isFirst = cursor === 0;
    const dots = this.TOUR.map((_, i) =>
      `<span class="cm-tooltip-dot ${i === cursor ? 'active' : ''}"></span>`
    ).join('');
    return `
      <div class="cm-tooltip-head">
        <div class="cm-tooltip-title">${step.title}</div>
        <button class="cm-tooltip-close" aria-label="Skip" onclick="Coachmarks.dismissCurrent()">×</button>
      </div>
      <div class="cm-tooltip-body">${step.body}</div>
      <div class="cm-tooltip-foot">
        <span class="cm-tooltip-dots">${dots}</span>
        <div class="cm-tooltip-foot-actions">
          <button class="btn btn-ghost" onclick="Coachmarks.skip()">Skip tour</button>
          <div class="cm-tooltip-nav">
            <button class="btn btn-ghost cm-back-btn" ${isFirst ? 'disabled' : ''} onclick="Coachmarks.back()">← Back</button>
            <button class="btn btn-primary" onclick="Coachmarks.next()">${isLast ? 'Done' : 'Next →'}</button>
          </div>
        </div>
      </div>
      <button class="cm-tooltip-disable" onclick="Coachmarks.disableForever()">Don't show me tutorials again</button>
    `;
  },

  _teardown() {
    const root = document.getElementById('cm-root');
    if (root) root.remove();
    if (this._reflow) {
      window.removeEventListener('resize', this._reflow);
      this._reflow = null;
    }
  },
};

window.Coachmarks = Coachmarks;
