/* ============================================================
   HOMIUM ORIGINATOR FLOW — New-User Onboarding Wizard
   Step graph: account setup (email/password/2FA) → optional profile +
   role/branch picker → KYC (Securitize) → NMLS link (LO) → branch +
   product gates (LO at branch) → finish. Each external check renders
   as a ~3s loading screen with an animated bullet checklist; "Skip
   simulation" cancels timers and applies effects immediately.
   ============================================================ */

const OnboardingFlowView = {
  _step: 0,
  _userId: null,
  _role: null,
  _email: '',
  _branchId: null,
  _pendingNmlsId: '',
  _branchOverride: false,
  _timers: [],

  /* ---- Public entry point ---- */
  open(role, opts = {}) {
    this._step = 0;
    this._role = role;
    this._timers = [];
    const user = opts.userId ? State.getUser(opts.userId) : State.getCurrentUser();
    this._userId = user?.id || null;
    this._email = user?.email || 'user@example.com';
    this._branchId = user?.branchId || (user?.branchAssignments?.[0]?.branchId) || null;
    this._pendingNmlsId = user?.nmlsLink?.nmlsId || user?.agentNmlsId || user?.nmlsId || '';
    this._branchOverride = false;

    const existing = document.getElementById('onboarding-flow-overlay');
    if (!existing) {
      const el = document.createElement('div');
      el.id = 'onboarding-flow-overlay';
      el.className = 'ob-overlay';
      document.getElementById('app').appendChild(el);
    }
    this._render();
  },

  /* ---- User helpers ---- */
  _user() { return this._userId ? State.getUser(this._userId) : State.getCurrentUser(); },

  _isLO() {
    const u = this._user();
    if (this._role === 'lo') return true;
    if (u?.role === 'lo') return true;
    if (u?.branchAssignments?.some(a => a.userType === 'lo')) return true;
    return false;
  },

  /* KYC (Securitize) is required only for Loan Officers and investors.
     OC-side standard users (loan processors, branch support, prog admins)
     and platform staff (sys_admin, operator) skip the KYC stage entirely. */
  _needsKyc() {
    const u = this._user();
    const role = u?.role || this._role;
    return this._isLO() || role === 'investor';
  },

  /* ---- Step graph ----
     Returns the active step IDs based on the user's current credential state.
     Steps already passed are skipped (idempotent — wizard can resume). */
  _steps() {
    const u = this._user();
    const status = u?.onboardingStatus || 'invited';
    const isLO = this._isLO();
    const branchId = this._branchId;
    const profileComplete = !!(u?.firstName && u?.lastName && u?.phone && u?.role && (!isLO || !!branchId));
    const kycDone = u?.kyc?.status === 'verified';
    const nmlsDone = u?.nmlsLink?.status === 'verified';

    const steps = [];

    // Stage A — auth: magic-link 2FA via email, then password.
    // Only shown if onboardingStatus hasn't passed 2fa_complete yet.
    const authIdx = ['invited', 'email_verified', '2fa_complete', 'verification_pending', 'active'].indexOf(status);
    if (authIdx <= 1)                          steps.push('verify-email');
    if (authIdx <= 1)                          steps.push('password');

    // Stage B — unified profile (name, role, branch, NMLS, phone, title).
    // Pre-filled from invite where available; everything is editable.
    if (!profileComplete)                      steps.push('unified-profile');

    // Stage C — LO verification (NMLS first, then KYC). LO-only.
    if (isLO && !nmlsDone) {
      steps.push('nmls-loading');
      steps.push('nmls-success');
    }
    // KYC (Securitize) — LOs and investors only. OC standard users skip entirely.
    if (this._needsKyc() && !kycDone) {
      steps.push('kyc-intro');
      steps.push('kyc-loading');
      steps.push('kyc-success');
    }

    // Stage D — branch + product gates (LO + branch only)
    if (isLO && branchId) {
      steps.push('branch-loading');
      steps.push('product-loading');
      steps.push('gates-summary');
    }

    // Stage E — finish (always)
    steps.push('finish');

    return steps;
  },

  /* ---- Core render ---- */
  _render() {
    this._clearTimers();
    const overlay = document.getElementById('onboarding-flow-overlay');
    if (!overlay) return;
    overlay.innerHTML = this._buildOverlay();
    const firstInput = overlay.querySelector('input:not([type="checkbox"])');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
    // Loading screens fire their effects after their timers
    const stepId = this._steps()[this._step];
    if (stepId === 'kyc-loading')      this._scheduleKycComplete();
    if (stepId === 'nmls-loading')     this._scheduleNmlsComplete();
    if (stepId === 'branch-loading')   this._scheduleBranchCheck();
    if (stepId === 'product-loading')  this._scheduleProductCheck();
  },

  _buildOverlay() {
    const steps = this._steps();
    const stepId = steps[this._step];
    const isFinish = stepId === 'finish';

    const progress = isFinish ? '' : this._renderProgress(steps);

    const logo = `
      <div class="ob-logo">
        <img src="assets/branding/HomiumLogo_0721_Wordmark (Blue).png" alt="Homium" style="height:28px"
             onerror="this.style.display='none'" />
      </div>`;

    const body = this._renderStep(stepId);

    const skip = isFinish ? '' : `
      <button class="ob-btn-ghost" onclick="OnboardingFlowView._skipAll()">Skip simulation →</button>`;

    return `${logo}${progress}${body}${skip}`;
  },

  _renderProgress(steps) {
    const dots = steps.filter(s => s !== 'finish').map((_, i) => {
      let cls = 'ob-dot';
      if (i < this._step) cls += ' done';
      else if (i === this._step) cls += ' current';
      return `<div class="${cls}"></div>`;
    }).join('');
    return `<div class="ob-progress">${dots}</div>`;
  },

  /* ---- Step renderers ---- */
  _renderStep(stepId) {
    switch (stepId) {
      case 'verify-email':    return this._renderVerifyEmail();
      case 'password':        return this._renderPassword();
      case 'unified-profile': return this._renderUnifiedProfile();
      case 'kyc-intro':       return this._renderKycIntro();
      case 'kyc-loading':     return this._renderKycLoading();
      case 'kyc-success':     return this._renderKycSuccess();
      case 'nmls-loading':    return this._renderNmlsLoading();
      case 'nmls-success':    return this._renderNmlsSuccess();
      case 'branch-loading':  return this._renderBranchLoading();
      case 'product-loading': return this._renderProductLoading();
      case 'gates-summary':   return this._renderGatesSummary();
      case 'finish':          return this._renderFinish();
      default:                return this._renderFinish();
    }
  },

  /* ---- Stage A: auth (magic-link 2FA via email + password) ---- */
  _renderVerifyEmail() {
    // Single screen: magic link landing + 6-digit code field. The code IS the
    // 2FA via email — no separate password-then-2FA pair, since any flow that
    // proves email control is already 2FA-grade for first login.
    return `
      <div class="ob-card">
        <div class="ob-icon" style="background:#E8F4FF;color:#2563EB">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
        </div>
        <div class="ob-title">Welcome to Homium</div>
        <div class="ob-subtitle">We sent a magic link and a 6-digit code to <strong>${this._email}</strong>. Enter the code below to verify.</div>
        <div style="text-align:center;margin-bottom:18px">
          <div class="ob-email-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
            ${this._email}
          </div>
        </div>
        <div class="ob-code-row" id="ob-code-row">
          ${[1,2,3,4,5,6].map((d, i) => `<input class="ob-code-input" maxlength="1" value="${d}" id="ob-code-${i}"
            oninput="OnboardingFlowView._codeInput(this, ${i})"
            onkeydown="OnboardingFlowView._codeKey(event, ${i})" />`).join('')}
        </div>
        <button class="ob-btn-primary" onclick="OnboardingFlowView._submitVerifyEmail()">Verify &amp; Continue →</button>
      </div>`;
  },

  _renderPassword() {
    return `
      <div class="ob-card">
        <div class="ob-icon" style="background:#E8F0EB;color:var(--color-primary)">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div class="ob-title">Create your password</div>
        <div class="ob-subtitle">Choose a strong password to protect your account.</div>
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
        <button class="ob-btn-primary" onclick="OnboardingFlowView._submitPassword()">Create Account →</button>
      </div>`;
  },

  /* ---- Stage B: unified profile (name, role, branch, NMLS, phone, title) ---- */
  _renderUnifiedProfile() {
    const u = this._user() || {};
    const isLO = this._isLO();
    const companyId = u.companyId;
    const branches = companyId ? State.getBranchesByCompany(companyId) : [];
    return `
      <div class="ob-card" style="max-width:520px">
        <div class="ob-icon" style="background:#E8F4FF;color:#2563EB">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </div>
        <div class="ob-title">Set up your profile</div>
        <div class="ob-subtitle">Confirm or fill in the details below. Anything pre-filled was provided by your program admin.</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div>
            <div class="ob-field-label">First Name *</div>
            <input class="input" id="ob-first" value="${u.firstName || ''}" style="width:100%;box-sizing:border-box" />
          </div>
          <div>
            <div class="ob-field-label">Last Name *</div>
            <input class="input" id="ob-last" value="${u.lastName || ''}" style="width:100%;box-sizing:border-box" />
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div>
            <div class="ob-field-label">Phone *</div>
            <input class="input" id="ob-phone" value="${u.phone || ''}" placeholder="(202) 555-0123" style="width:100%;box-sizing:border-box" />
          </div>
          <div>
            <div class="ob-field-label">Title</div>
            <input class="input" id="ob-title" value="${u.title || ''}" placeholder="Senior Loan Officer" style="width:100%;box-sizing:border-box" />
          </div>
        </div>

        <div class="ob-field-label" style="margin-top:6px">Role *</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          <label style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border:2px solid ${isLO ? 'var(--color-primary)' : 'var(--color-border)'};border-radius:8px;cursor:pointer;background:${isLO ? 'rgba(29,61,42,0.04)' : 'var(--color-card)'}">
            <input type="radio" name="ob-role" value="lo" ${isLO ? 'checked' : ''} onchange="OnboardingFlowView._setRole('lo')" style="margin-top:2px">
            <div>
              <div style="font-size:13px;font-weight:600">Loan Officer</div>
              <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">Originates applications. NMLS + KYC required.</div>
            </div>
          </label>
          <label style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border:2px solid ${!isLO ? 'var(--color-primary)' : 'var(--color-border)'};border-radius:8px;cursor:pointer;background:${!isLO ? 'rgba(29,61,42,0.04)' : 'var(--color-card)'}">
            <input type="radio" name="ob-role" value="standard" ${!isLO ? 'checked' : ''} onchange="OnboardingFlowView._setRole('standard')" style="margin-top:2px">
            <div>
              <div style="font-size:13px;font-weight:600">Standard User</div>
              <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">Loan Processor, Branch Support. No NMLS / KYC.</div>
            </div>
          </label>
        </div>

        ${isLO ? `
        <div style="margin-bottom:14px">
          <div class="ob-field-label">Branch ${branches.length ? '*' : ''}</div>
          <select class="select-input" id="ob-branch" style="width:100%;box-sizing:border-box" ${branches.length === 0 ? 'disabled' : ''}>
            <option value="">${branches.length ? '— Select branch —' : 'No branches available'}</option>
            ${branches.map(b => `<option value="${b.id}" ${this._branchId === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
        </div>

        <div style="margin-bottom:20px">
          <div class="ob-field-label">NMLS ID *</div>
          <input class="input" id="ob-nmls" value="${this._pendingNmlsId}" placeholder="e.g. 3256789" style="width:100%;box-sizing:border-box;font-family:'JetBrains Mono', monospace" />
          <div class="form-hint" style="font-size:11px;margin-top:6px">We'll verify this with NMLS in the next step.</div>
        </div>` : '<div style="margin-bottom:20px"></div>'}

        <button class="ob-btn-primary" onclick="OnboardingFlowView._submitUnifiedProfile()">${isLO ? 'Submit & Verify NMLS →' : 'Submit & Enter Platform →'}</button>
      </div>`;
  },

  /* ---- Stage C: KYC ---- */
  _renderKycIntro() {
    return `
      <div class="ob-card">
        <div class="ob-icon" style="background:#EFF6FF;color:#2563EB">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M19 3l2 2-6 6"/></svg>
        </div>
        <div class="ob-title">Verify your identity</div>
        <div class="ob-subtitle">We use Securitize to confirm who you are. Required for everyone on the platform.</div>
        <div class="ob-securitize-card">
          <img src="https://www.securitize.io/favicon.ico" width="20" height="20" style="vertical-align:middle;margin-right:8px;border-radius:4px"
               onerror="this.style.display='none'" />
          <strong style="font-size:14px;color:#1D4ED8">SecuritizeID</strong>
          <div style="font-size:12px;color:#3B82F6;margin-top:6px">Identity &amp; Accreditation Verification</div>
        </div>
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:20px;text-align:center;line-height:1.5">
          You'll be redirected to SecuritizeID to capture your government ID and a quick selfie. We don't store this data — only the verification result.
        </div>
        <button class="ob-btn-primary" onclick="OnboardingFlowView.next()">Begin KYC with SecuritizeID →</button>
      </div>`;
  },

  _renderKycLoading() {
    return this._renderLoadingCard({
      vendor: 'SecuritizeID',
      vendorColor: '#1D4ED8',
      title: 'Verifying your identity',
      subtitle: 'SecuritizeID is reviewing your submission.',
      bullets: ['Identity check', 'Address verification', 'Sanctions screening'],
    });
  },

  _renderKycSuccess() {
    const kyc = this._user()?.kyc;
    return `
      <div class="ob-card" style="text-align:center">
        <div class="ob-icon" style="background:#DCFCE7;color:var(--color-success);margin:0 auto 20px">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="14" cy="14" r="12"/><path d="M8 14l4 4 8-8"/></svg>
        </div>
        <div class="ob-title">Identity verified</div>
        <div class="ob-subtitle">Securitize reference: <code style="background:var(--color-surface);padding:2px 6px;border-radius:4px;font-size:12px">${kyc?.referenceId || ''}</code></div>
        <button class="ob-btn-primary" onclick="OnboardingFlowView.next()">Continue →</button>
      </div>`;
  },

  /* ---- Stage C: NMLS verification (LO only) ---- */
  _renderNmlsLoading() {
    return this._renderLoadingCard({
      vendor: 'NMLS',
      vendorColor: '#D97706',
      title: 'Linking your NMLS license',
      subtitle: `Looking up record for NMLS ID <strong>${this._pendingNmlsId}</strong>.`,
      bullets: ['Locating record', 'Verifying licensed states', 'Loading authorized branches'],
    });
  },

  _renderNmlsSuccess() {
    const link = this._user()?.nmlsLink || {};
    const states = link.licensedStates || [];
    const branches = link.authorizedBranchNmlsIds || [];
    const hasData = states.length > 0 || branches.length > 0;
    return `
      <div class="ob-card" style="text-align:center">
        <div class="ob-icon" style="background:#DCFCE7;color:var(--color-success);margin:0 auto 20px">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="14" cy="14" r="12"/><path d="M8 14l4 4 8-8"/></svg>
        </div>
        <div class="ob-title">NMLS license linked</div>
        <div class="ob-subtitle">${hasData
          ? `${states.length} state license${states.length === 1 ? '' : 's'} · ${branches.length} authorized branch${branches.length === 1 ? '' : 'es'}`
          : `No matching authority record — your branch and product gates may need manual verification.`}</div>
        ${states.length ? `<div style="margin:12px auto 18px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${states.map(s => `<span class="tag" style="font-size:11px;background:#DCFCE7;color:#166534;padding:2px 8px;border-radius:4px">${s}</span>`).join('')}</div>` : ''}
        <button class="ob-btn-primary" onclick="OnboardingFlowView.next()">Continue →</button>
      </div>`;
  },

  /* ---- Stage E: branch + product gates ---- */
  _renderBranchLoading() {
    const branch = this._branchId ? State.getBranch(this._branchId) : null;
    return this._renderLoadingCard({
      vendor: 'NMLS',
      vendorColor: '#D97706',
      title: `Verifying branch authorization`,
      subtitle: `Confirming you can operate at <strong>${branch?.name || 'your branch'}</strong>.`,
      bullets: ['Cross-referencing NMLS', 'Checking branch authority', 'Validating sponsorship'],
    });
  },

  _renderProductLoading() {
    const branch = this._branchId ? State.getBranch(this._branchId) : null;
    const programs = branch?.programs || [];
    return this._renderLoadingCard({
      vendor: 'NMLS',
      vendorColor: '#D97706',
      title: 'Checking license coverage',
      subtitle: programs.length
        ? `Verifying you're licensed for ${programs.join(', ')}.`
        : `No programs assigned at this branch.`,
      bullets: ['State license check', 'Program eligibility', 'Compliance review'],
    });
  },

  _renderGatesSummary() {
    const userId = this._userId;
    const branchId = this._branchId;
    const branch = branchId ? State.getBranch(branchId) : null;
    const gates = State.getActiveAtBranchGates(userId, branchId);
    const branchOk = this._branchOverride || gates.branchAuth.ok;

    const row = (ok, title, detail) => `
      <tr>
        <td style="width:32px;text-align:center;padding:10px 4px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${ok ? '#DCFCE7' : '#FEE2E2'};color:${ok ? '#166534' : '#991B1B'};font-weight:700;font-size:12px">${ok ? '✓' : '!'}</span>
        </td>
        <td style="padding:10px 4px">
          <div style="font-size:13px;font-weight:600;color:${ok ? 'var(--color-text)' : 'var(--color-danger)'}">${title}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">${detail}</div>
        </td>
      </tr>`;

    const allOk = gates.kyc.ok && gates.nmls.ok && branchOk && gates.productLicensing.ok;
    const branchUnauthorized = !gates.branchAuth.ok && !this._branchOverride;

    return `
      <div class="ob-card">
        <div class="ob-icon" style="background:${allOk ? '#DCFCE7' : '#FEE2E2'};color:${allOk ? 'var(--color-success)' : 'var(--color-danger)'}">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${allOk
            ? '<circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r=".5" fill="currentColor"/>'}</svg>
        </div>
        <div class="ob-title">${allOk ? 'You\'re ready to originate' : 'A gate didn\'t pass'}</div>
        <div class="ob-subtitle">${allOk
          ? `All four checks cleared for ${branch?.name || 'this branch'}.`
          : `Resolve the issue below to continue. In production this would route to compliance.`}</div>
        <table class="ob-gates-table">
          ${row(gates.kyc.ok, 'Identity verified', gates.kyc.label)}
          ${row(gates.nmls.ok, 'NMLS license linked', gates.nmls.label)}
          ${row(branchOk, `Authorized at ${branch?.name || 'branch'}`, this._branchOverride ? 'Override applied (demo only)' : gates.branchAuth.label)}
          ${row(gates.productLicensing.ok, 'Licensed for branch programs', gates.productLicensing.label)}
        </table>
        ${branchUnauthorized ? `
        <div style="background:#FEF3C7;border:1px solid #F0D8A0;border-radius:6px;padding:10px;margin:12px 0;font-size:12px;color:#8A5A00">
          Branch ${branch?.nmlsId || ''} isn't in your NMLS authority. Either contact your prog admin or override for the demo.
        </div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="ob-btn-ghost" style="flex:1" onclick="OnboardingFlowView._goToStep('nmls-intro')">← Re-link NMLS</button>
          <button class="ob-btn-primary" style="flex:1;background:#D97706" onclick="OnboardingFlowView._overrideBranch()">Override for demo</button>
        </div>` : `
        <button class="ob-btn-primary" onclick="OnboardingFlowView.next()">${allOk ? 'Enter Platform →' : 'Continue anyway →'}</button>`}
      </div>`;
  },

  /* ---- Stage F: finish ---- */
  _renderFinish() {
    const u = this._user();
    const role = u?.role || this._role;
    const roleWelcome = {
      sys_admin:  'You have full platform access. Manage organizations, users, and system configuration.',
      operator:   'You can manage organizations, branches, and users across the platform.',
      prog_admin: 'You can manage your organization\'s branches and invite team members.',
      lo:         'Your identity has been verified and you\'re authorized to originate.',
      lp:         'You can now process and update loan applications assigned to your branch.',
      investor:   'Your accreditation is confirmed. Your investment portfolio is ready to view.',
    };
    return `
      <div class="ob-card" style="text-align:center">
        <div class="ob-icon" style="background:#DCFCE7;color:var(--color-success);margin:0 auto 20px">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="14" cy="14" r="12"/><path d="M8 14l4 4 8-8"/></svg>
        </div>
        <div class="ob-title">You're all set!</div>
        <div class="ob-subtitle">${roleWelcome[role] || 'Welcome to the Homium platform.'}</div>
        <button class="ob-btn-primary" onclick="OnboardingFlowView.finish()">Enter Platform →</button>
      </div>`;
  },

  /* ---- Loading screen helper ---- */
  _renderLoadingCard({ vendor, vendorColor, title, subtitle, bullets }) {
    const items = bullets.map((b, i) => `
      <div class="ob-checklist-item pending" id="ob-bullet-${i}">
        <span class="ob-checklist-icon">⏳</span>
        <span class="ob-checklist-label">${b}</span>
      </div>`).join('');
    return `
      <div class="ob-card ob-loading-card">
        <div class="ob-vendor-tag" style="color:${vendorColor};border-color:${vendorColor}">${vendor}</div>
        <div class="ob-spinner"></div>
        <div class="ob-title" style="margin-top:18px">${title}</div>
        <div class="ob-subtitle">${subtitle}</div>
        <div class="ob-checklist">${items}</div>
      </div>`;
  },

  _animateChecklist(count, totalMs) {
    // Flip each bullet from pending → done over the duration
    const stride = totalMs / (count + 1);
    for (let i = 0; i < count; i++) {
      const t = setTimeout(() => {
        const el = document.getElementById('ob-bullet-' + i);
        if (el) {
          el.classList.remove('pending');
          el.classList.add('done');
          const icon = el.querySelector('.ob-checklist-icon');
          if (icon) icon.textContent = '✓';
        }
      }, stride * (i + 1));
      this._timers.push(t);
    }
  },

  _scheduleKycComplete() {
    const dur = 3000;
    this._animateChecklist(3, dur);
    const t = setTimeout(() => {
      if (this._userId) State.setKycVerified(this._userId);
      this.next();
    }, dur + 200);
    this._timers.push(t);
  },

  _scheduleNmlsComplete() {
    const dur = 3000;
    this._animateChecklist(3, dur);
    const t = setTimeout(() => {
      if (this._userId) State.setNmlsLinkVerified(this._userId, this._pendingNmlsId);
      this.next();
    }, dur + 200);
    this._timers.push(t);
  },

  _scheduleBranchCheck() {
    const dur = 2500;
    this._animateChecklist(3, dur);
    const t = setTimeout(() => this.next(), dur + 200);
    this._timers.push(t);
  },

  _scheduleProductCheck() {
    const dur = 2500;
    this._animateChecklist(3, dur);
    const t = setTimeout(() => this.next(), dur + 200);
    this._timers.push(t);
  },

  _clearTimers() {
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];
  },

  /* ---- Code input helpers ---- */
  _codeInput(input, idx) {
    if (input.value.length === 1) {
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

  /* ---- Submit handlers ---- */
  /* Verify-email is the magic-link 2FA via email — collapses the old
     welcome+verify+2FA triple into one screen. We jump status straight
     to 2fa_complete since this single proof of email control covers both. */
  _submitVerifyEmail() {
    if (this._userId) State.updateUser(this._userId, { onboardingStatus: '2fa_complete' });
    this.next();
  },

  _submitPassword() {
    const checked = document.getElementById('ob-tos-check');
    if (checked && !checked.checked) {
      checked.style.outline = '2px solid var(--color-danger)';
      return;
    }
    this.next();
  },

  /* Switching role re-renders so the LO-only fields (branch + NMLS) appear/hide. */
  _setRole(value) {
    this._role = value === 'lo' ? 'lo' : 'lp';
    // Persist tentatively so _isLO() reads the new value before the form is submitted
    if (this._userId) State.updateUser(this._userId, { role: this._role });
    this._render();
  },

  /* One submit covers everything on the unified profile screen:
     identity + role + branch (if LO) + NMLS (if LO). */
  _submitUnifiedProfile() {
    if (!this._userId) { this.next(); return; }
    const firstName = document.getElementById('ob-first')?.value.trim();
    const lastName  = document.getElementById('ob-last')?.value.trim();
    const phone     = document.getElementById('ob-phone')?.value.trim();
    const title     = document.getElementById('ob-title')?.value.trim() || '';
    if (!firstName || !lastName || !phone) {
      alert('Please fill in your name and phone.');
      return;
    }

    const isLO = this._isLO();
    const role = isLO ? 'lo' : 'lp';
    let branchId = null;
    let nmlsId = '';
    if (isLO) {
      const branchSel = document.getElementById('ob-branch');
      branchId = branchSel?.value || null;
      const branches = State.getBranchesByCompany(this._user()?.companyId || '');
      if (branches.length && !branchId) {
        alert('Loan Officers must select a branch.');
        return;
      }
      nmlsId = document.getElementById('ob-nmls')?.value.trim() || '';
      if (!nmlsId) {
        alert('Loan Officers must provide an NMLS ID. We\'ll verify it next.');
        return;
      }
      this._branchId = branchId;
      this._pendingNmlsId = nmlsId;
    }

    const branchAssignments = (isLO && branchId) ? [{
      branchId,
      userType: 'lo',
      flags: { branchManager: false },
      loAssignments: [{ scope: 'personal', loIds: [], level: 'full', subflags: { canCreate: true, canSubmit: true, canWithdraw: true } }],
      allowNewOriginations: true,
      allowAccessToAllBranchActivity: false,
      eligibleLoanProductIds: [],
    }] : [];

    State.updateUser(this._userId, {
      firstName, lastName, phone, title, role,
      ...(branchId ? { branchId } : {}),
      ...(branchAssignments.length ? { branchAssignments } : {}),
      ...(nmlsId ? {
        nmlsId,
        agentNmlsId: nmlsId,
        nmlsLink: { ...(this._user()?.nmlsLink || {}), nmlsId, status: 'not_linked' },
      } : {}),
    });

    this.next();
  },

  _overrideBranch() {
    this._branchOverride = true;
    const u = this._user();
    if (u && this._branchId) {
      // Patch the user's authorizedBranchNmlsIds so downstream gates pass too
      const branch = State.getBranch(this._branchId);
      if (branch?.nmlsId) {
        const link = u.nmlsLink || { authorizedBranchNmlsIds: [] };
        if (!link.authorizedBranchNmlsIds.includes(branch.nmlsId)) {
          State.updateUser(u.id, {
            nmlsLink: { ...link, authorizedBranchNmlsIds: [...link.authorizedBranchNmlsIds, branch.nmlsId] },
          });
        }
      }
    }
    this._render();
  },

  /* ---- Navigation ---- */
  next() {
    this._step++;
    this._render();
  },

  _goToStep(stepId) {
    const idx = this._steps().indexOf(stepId);
    if (idx >= 0) {
      this._step = idx;
      this._render();
    }
  },

  finish() {
    if (this._userId) {
      State.updateUser(this._userId, { onboardingStatus: 'active' });
    }
    this._teardown();
    // Land somewhere sensible per role
    const role = this._user()?.role || this._role;
    if (role === 'prog_admin') Router.navigate('/origination-companies');
    else if (role === 'lo' || role === 'lp') Router.navigate('/originations');
    else Router.navigate('/data/analytics');
  },

  _skipAll() {
    if (this._userId) {
      // Apply all credential effects so the demo lands in a fully verified state
      if (this._needsKyc()) State.setKycVerified(this._userId);
      if (this._isLO()) {
        State.setNmlsLinkVerified(this._userId, this._pendingNmlsId || '3256789');
        // Force branch authorization for whichever branch is selected
        if (this._branchId) {
          const branch = State.getBranch(this._branchId);
          const u = State.getUser(this._userId);
          if (branch?.nmlsId && u?.nmlsLink && !u.nmlsLink.authorizedBranchNmlsIds.includes(branch.nmlsId)) {
            State.updateUser(this._userId, {
              nmlsLink: { ...u.nmlsLink, authorizedBranchNmlsIds: [...u.nmlsLink.authorizedBranchNmlsIds, branch.nmlsId] },
            });
          }
        }
      }
      State.updateUser(this._userId, { onboardingStatus: 'active' });
    }
    this._teardown();
    Router.navigate('/data/analytics');
  },

  _teardown() {
    this._clearTimers();
    const overlay = document.getElementById('onboarding-flow-overlay');
    if (overlay) overlay.remove();
    DataPlatformView._activeTab = 'analytics';
  },
};
