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
  TOUR: [
    {
      id: 'apps-newbtn',
      route: '/data/applications',
      target: '[data-cm="new-app"]',
      title: 'Start a new application',
      body: 'Click here whenever you want to begin originating a new loan. We\'ll walk through the form together in a moment.',
      placement: 'bottom',
    },
    {
      id: 'apps-row',
      route: '/data/applications',
      target: '[data-cm="app-row"]',
      title: 'Open an application',
      body: 'Each row is one application in flight. Click into one to see status, documents, and any notes from underwriting.',
      placement: 'top',
      optional: true, // skipped automatically when there are no rows
    },
    {
      id: 'newapp-borrower',
      route: '/data/applications',
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
      trigger: 'open-newapp',
      stepperStep: 3,
      target: '[data-cm="submit"]',
      title: 'Submit to underwriting',
      body: 'Once submitted, this application is flagged to our underwriting team for review. If anything needs attention they\'ll add a note on the application — and you\'ll see a notification update.',
      placement: 'top',
    },
    {
      id: 'notif-bell',
      route: '/data/applications',
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

  next() {
    const u = State.getCurrentUser();
    if (!u) return;
    const prefs = State.getWelcomePrefs(u.id);
    const cursor = (prefs.tourCursor || 0) + 1;
    State.setWelcomePrefs(u.id, { tourCursor: cursor });

    if (cursor >= this.TOUR.length) {
      State.setWelcomePrefs(u.id, { tourCompleted: true });
      this._teardown();
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
    this.next();
  },

  /* ── Internal ── */

  _showStep(cursor) {
    const step = this.TOUR[cursor];
    if (!step) return;

    // Run trigger (open or close a modal etc.)
    if (step.trigger === 'open-newapp') {
      if (typeof NewApplicationStepperView !== 'undefined') {
        if (!document.getElementById('newapp-stepper-host')) {
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

    // Wait one frame so any newly-opened modal lays out before we measure.
    requestAnimationFrame(() => this._render(step, cursor));
  },

  _render(step, cursor) {
    this._teardown();
    const target = document.querySelector(step.target);
    if (!target) {
      // Anchor missing — skip step.
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
        <button class="btn btn-ghost" onclick="Coachmarks.skip()">Skip tour</button>
        <span class="cm-tooltip-dots">${dots}</span>
        <button class="btn btn-primary" onclick="Coachmarks.next()">${isLast ? 'Done' : 'Next →'}</button>
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
