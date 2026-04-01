/* ============================================================
   HOMIUM ORIGINATOR FLOW — New-User Onboarding Wizard
   Intercepts role selection and walks through setup steps.
   ============================================================ */

const OnboardingFlowView = {
  _step: 0,
  _kycStarted: false,
  _email: '',
  _role: null,

  /* ---- Public entry point ---- */
  open(role) {
    this._step = 0;
    this._kycStarted = false;
    this._role = role;
    const user = State.getCurrentUser();
    this._email = user ? user.email : 'user@example.com';

    // Inject overlay container into #app (alongside any existing content)
    const existing = document.getElementById('onboarding-flow-overlay');
    if (!existing) {
      const el = document.createElement('div');
      el.id = 'onboarding-flow-overlay';
      el.className = 'ob-overlay';
      document.getElementById('app').appendChild(el);
    }
    this._render();
  },

  /* ---- Core render ---- */
  _render() {
    const overlay = document.getElementById('onboarding-flow-overlay');
    if (!overlay) return;
    overlay.innerHTML = this._buildOverlay();
    // Auto-focus first input if present
    const firstInput = overlay.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  },

  _buildOverlay() {
    const steps = this._steps();
    const isFinish = this._step >= steps.length;

    const progress = isFinish ? '' : this._renderProgress(steps);

    const logo = `
      <div class="ob-logo">
        <img src="assets/branding/HomiumLogo_0721_Wordmark (Blue).png" alt="Homium" style="height:28px"
             onerror="this.style.display='none'" />
      </div>`;

    const body = isFinish ? this._renderFinish() : this._renderStep(steps[this._step], this._step, steps.length);

    const skip = isFinish ? '' : `
      <button class="ob-btn-ghost" onclick="OnboardingFlowView._skipAll()">Skip simulation →</button>`;

    return `${logo}${progress}${body}${skip}`;
  },

  /* ---- Steps definition ---- */
  _steps() {
    const isLO = this._role === 'lo';
    const base = [
      { id: 'welcome',  title: 'Check your email',         subtitle: `We sent a welcome email to <strong>${this._email}</strong>. Click the magic link to continue.`,                         btnLabel: 'Open Email & Click Link →', icon: 'email'    },
      { id: 'verify',   title: 'Verify your email',        subtitle: 'Enter the 6-digit code from your email.',                                                                               btnLabel: 'Verify Email →',            icon: 'code'     },
      { id: 'password', title: 'Create your password',     subtitle: 'Choose a strong password to protect your account.',                                                                     btnLabel: 'Create Account →',          icon: 'lock'     },
      { id: '2fa',      title: 'Set up two-factor auth',   subtitle: `We sent a verification code to <strong>${this._email}</strong>. Enter it below to enable 2FA.`,                        btnLabel: 'Verify Code →',             icon: 'shield'   },
    ];
    if (isLO) {
      base.push({ id: 'kyc', title: 'Identity verification', subtitle: 'As a Loan Officer, you must complete identity verification via SecuritizeID before accessing the platform.', btnLabel: 'Begin KYC with SecuritizeID →', icon: 'kyc' });
    }
    return base;
  },

  /* ---- Progress dots ---- */
  _renderProgress(steps) {
    const dots = steps.map((_, i) => {
      let cls = 'ob-dot';
      if (i < this._step) cls += ' done';
      else if (i === this._step) cls += ' current';
      return `<div class="${cls}"></div>`;
    }).join('');
    return `<div class="ob-progress">${dots}</div>`;
  },

  /* ---- Step HTML builders ---- */
  _renderStep(step, idx, total) {
    const icons = {
      email:  `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>`,
      code:   `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>`,
      lock:   `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
      shield: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      kyc:    `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M19 3l2 2-6 6"/></svg>`,
    };
    const iconBg = { email: '#E8F4FF', code: '#EDE8F0', lock: '#E8F0EB', shield: '#FEF3C7', kyc: '#EFF6FF' };
    const iconColor = { email: '#2563EB', code: '#6B3FA0', lock: 'var(--color-primary)', shield: '#D97706', kyc: '#2563EB' };

    let content = '';
    if (step.id === 'welcome') {
      content = `
        <div style="text-align:center;margin-bottom:20px">
          <div class="ob-email-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
            ${this._email}
          </div>
          <div style="font-size:12px;color:var(--color-text-muted)">Check your inbox for an email from <strong>noreply@homium.com</strong></div>
        </div>
        <button class="ob-btn-primary" onclick="OnboardingFlowView.next()">Open Email &amp; Click Link →</button>`;
    } else if (step.id === 'verify') {
      content = `
        <div class="ob-code-row" id="ob-code-row">
          ${[1,2,3,4,5,6].map((d, i) => `<input class="ob-code-input" maxlength="1" value="${d}" id="ob-code-${i}"
            oninput="OnboardingFlowView._codeInput(this, ${i})"
            onkeydown="OnboardingFlowView._codeKey(event, ${i})" />`).join('')}
        </div>
        <button class="ob-btn-primary" onclick="OnboardingFlowView.next()">Verify Email →</button>`;
    } else if (step.id === 'password') {
      content = `
        <div style="margin-bottom:14px">
          <div class="ob-field-label">Password</div>
          <input class="input" type="password" placeholder="At least 10 characters" value="••••••••••••" style="width:100%;box-sizing:border-box" />
        </div>
        <div style="margin-bottom:20px">
          <div class="ob-field-label">Confirm Password</div>
          <input class="input" type="password" placeholder="Repeat password" value="••••••••••••" style="width:100%;box-sizing:border-box" />
        </div>
        <label class="ob-tos">
          <input type="checkbox" id="ob-tos-check" checked style="margin-top:2px;flex-shrink:0" />
          I agree to the <a href="#" onclick="return false" style="color:var(--color-primary);text-decoration:underline">Terms of Service</a> and <a href="#" onclick="return false" style="color:var(--color-primary);text-decoration:underline">Privacy Policy</a>
        </label>
        <button class="ob-btn-primary" onclick="OnboardingFlowView._submitPassword()">Create Account →</button>`;
    } else if (step.id === '2fa') {
      content = `
        <div style="text-align:center;margin-bottom:16px;font-size:13px;color:var(--color-text-muted)">
          Code sent to <strong>${this._email}</strong>
        </div>
        <div class="ob-code-row">
          ${[8,4,2,7,1,3].map((d, i) => `<input class="ob-code-input" maxlength="1" value="${d}" id="ob-2fa-${i}"
            oninput="OnboardingFlowView._codeInput(this, ${i + 10})"
            onkeydown="OnboardingFlowView._codeKey(event, ${i + 10})" />`).join('')}
        </div>
        <button class="ob-btn-primary" onclick="OnboardingFlowView.next()">Verify Code →</button>`;
    } else if (step.id === 'kyc') {
      if (!this._kycStarted) {
        content = `
          <div class="ob-securitize-card">
            <img src="https://www.securitize.io/favicon.ico" width="20" height="20" style="vertical-align:middle;margin-right:8px;border-radius:4px"
                 onerror="this.style.display='none'" />
            <strong style="font-size:14px;color:#1D4ED8">SecuritizeID</strong>
            <div style="font-size:12px;color:#3B82F6;margin-top:6px">Identity &amp; Accreditation Verification</div>
          </div>
          <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:20px;text-align:center;line-height:1.5">
            You'll be redirected to SecuritizeID to complete identity verification. This is required for all Loan Officers.
          </div>
          <button class="ob-btn-primary" onclick="OnboardingFlowView.kycBegin()">Begin KYC with SecuritizeID →</button>`;
      } else {
        content = `
          <div class="ob-pending-card">
            <div style="font-size:28px;margin-bottom:8px">⏳</div>
            <div style="font-size:14px;font-weight:600;margin-bottom:4px">Verification in Progress</div>
            <div style="font-size:12px;color:var(--color-text-muted)">SecuritizeID is reviewing your submission. This typically takes a few seconds in the demo.</div>
          </div>
          <div style="text-align:center;margin-bottom:16px">
            <span class="status-pill badge-kyc"><span class="status-dot"></span>KYC Pending</span>
          </div>
          <button class="ob-btn-primary" onclick="OnboardingFlowView.kycReturn()" style="background:#2563EB">
            ✓ Return from SecuritizeID (Verified)
          </button>`;
      }
    }

    return `
      <div class="ob-card">
        <div class="ob-icon" style="background:${iconBg[step.icon]};color:${iconColor[step.icon]}">${icons[step.icon]}</div>
        <div class="ob-title">${step.title}</div>
        <div class="ob-subtitle">${step.subtitle}</div>
        ${content}
      </div>`;
  },

  _renderFinish() {
    const roleWelcome = {
      sys_admin:  'You have full platform access. Manage organizations, users, and system configuration.',
      operator:   'You can manage organizations, branches, and users across the platform.',
      prog_admin: 'You can manage your organization\'s branches and invite team members.',
      lo:         'Your identity has been verified. You can now create and submit loan applications.',
      lp:         'You can now process and update loan applications assigned to your branch.',
      investor:   'Your accreditation is confirmed. Your investment portfolio is ready to view.',
    };
    return `
      <div class="ob-card" style="text-align:center">
        <div class="ob-icon" style="background:#DCFCE7;color:var(--color-success);margin:0 auto 20px">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="14" cy="14" r="12"/><path d="M8 14l4 4 8-8"/></svg>
        </div>
        <div class="ob-title">You're all set!</div>
        <div class="ob-subtitle">${roleWelcome[this._role] || 'Welcome to the Homium platform.'}</div>
        <button class="ob-btn-primary" onclick="OnboardingFlowView.finish()">Enter Platform →</button>
      </div>`;
  },

  /* ---- Code input helpers ---- */
  _codeInput(input, idx) {
    if (input.value.length === 1) {
      // Move to next input
      const prefix = idx >= 10 ? 'ob-2fa-' : 'ob-code-';
      const realIdx = idx >= 10 ? idx - 10 : idx;
      const next = document.getElementById(`${prefix}${realIdx + 1}`);
      if (next) next.focus();
    }
  },

  _codeKey(e, idx) {
    if (e.key === 'Enter') this.next();
    if (e.key === 'Backspace' && e.target.value === '') {
      const prefix = idx >= 10 ? 'ob-2fa-' : 'ob-code-';
      const realIdx = idx >= 10 ? idx - 10 : idx;
      const prev = document.getElementById(`${prefix}${realIdx - 1}`);
      if (prev) { prev.focus(); prev.value = ''; }
    }
  },

  /* ---- Navigation ---- */
  next() {
    const steps = this._steps();
    const step = steps[this._step];
    const user = State.getCurrentUser();
    if (!user) return;

    // Advance State at key transitions
    if (step.id === 'welcome') {
      State.advanceOnboarding(user.id); // invited → email_verified
    } else if (step.id === '2fa') {
      State.advanceOnboarding(user.id); // 2fa_complete (or active for non-LO)
      // Non-LO: also set to active if not LO (State.advanceOnboarding handles it)
    }

    this._step++;
    if (this._step >= steps.length) {
      // If we haven't set active yet (e.g. non-LO path), ensure active
      if (State.getCurrentUser()?.onboardingStatus !== 'active') {
        State.updateUser(user.id, { onboardingStatus: 'active' });
      }
    }
    this._render();
  },

  _submitPassword() {
    const checked = document.getElementById('ob-tos-check');
    if (checked && !checked.checked) {
      checked.style.outline = '2px solid var(--color-danger)';
      return;
    }
    this.next();
  },

  kycBegin() {
    this._kycStarted = true;
    const user = State.getCurrentUser();
    if (user) State.advanceOnboarding(user.id); // 2fa_complete → verification_pending
    this._render();
  },

  kycReturn() {
    const user = State.getCurrentUser();
    if (user) State.updateUser(user.id, { onboardingStatus: 'active' });
    this._step++; // past kyc step
    this._render();
  },

  finish() {
    // Ensure active regardless of how we got here
    const user = State.getCurrentUser();
    if (user && user.onboardingStatus !== 'active') {
      State.updateUser(user.id, { onboardingStatus: 'active' });
    }
    const overlay = document.getElementById('onboarding-flow-overlay');
    if (overlay) overlay.remove();
    Router.navigate('/dashboard');
  },

  _skipAll() {
    const user = State.getCurrentUser();
    if (user) State.updateUser(user.id, { onboardingStatus: 'active' });
    const overlay = document.getElementById('onboarding-flow-overlay');
    if (overlay) overlay.remove();
    Router.navigate('/dashboard');
  },
};
