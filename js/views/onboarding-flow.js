/* ============================================================
   HOMIUM ORIGINATOR FLOW — New-User Onboarding Wizard
   Full-page layout (matches OC Wizard pattern). Auth (verify-email +
   password) happens in the login page, so this wizard starts at the
   unified profile and then runs the LO-only verification gates.
   Each verification step has two states: pre-submit form/intro and
   post-submit "Validation in progress" (mirrors the daily-batch
   reality of NMLS / Securitize). A "Skip step" button on every
   screen lets demos advance without waiting.
   ============================================================ */

const OnboardingFlowView = {
  _step: 0,
  _userId: null,
  _role: null,
  _email: '',
  _branchId: null,
  _pendingNmlsId: '',
  _branchOverride: false,
  _submitted: null,   // Set<stepId>: which verification steps are in "in progress" state

  /* ---- Public entry point ---- */
  open(role, opts = {}) {
    this._step = 0;
    this._role = role;
    this._submitted = new Set();
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
      el.className = 'wiz-page';
      document.getElementById('app').appendChild(el);
    } else {
      existing.className = 'wiz-page';
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

  /* ---- Step graph ---- */
  STEP_LABELS: {
    'unified-profile': 'Profile',
    'nmls-verify':     'NMLS',
    'kyc-verify':      'Identity',
    'branch-verify':   'Branch',
    'product-verify':  'Products',
    'gates-review':    'Review',
    'finish':          'Complete',
  },

  _steps() {
    const u = this._user();
    const isLO = this._isLO();
    const branchId = this._branchId;
    const profileComplete = !!(u?.firstName && u?.lastName && u?.phone && u?.role && (!isLO || !!branchId));
    const kycDone = u?.kyc?.status === 'verified';
    const nmlsDone = u?.nmlsLink?.status === 'verified';

    const steps = [];
    if (!profileComplete)                     steps.push('unified-profile');
    if (isLO && !nmlsDone)                    steps.push('nmls-verify');
    if (this._needsKyc() && !kycDone)         steps.push('kyc-verify');
    if (isLO && branchId)                     steps.push('branch-verify');
    if (isLO && branchId)                     steps.push('product-verify');
    if (isLO && branchId)                     steps.push('gates-review');
    steps.push('finish');
    return steps;
  },

  _currentStepId() {
    const steps = this._steps();
    return steps[this._step] || 'finish';
  },

  /* ---- Core render ---- */
  _render() {
    const overlay = document.getElementById('onboarding-flow-overlay');
    if (!overlay) return;
    overlay.innerHTML = this._buildPage();
    const firstInput = overlay.querySelector('input:not([type="checkbox"]):not([type="radio"]), select');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  },

  _buildPage() {
    const stepId = this._currentStepId();
    const u = this._user();
    const personaName = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email : 'Guest';
    const isFinish = stepId === 'finish';

    return `
      ${this._renderTopBar(personaName)}
      ${isFinish ? '' : this._renderHeader()}
      ${isFinish ? '' : this._renderTabs()}
      <div class="wiz-body">
        ${this._renderStep(stepId)}
        ${isFinish ? '' : this._renderFooter(stepId)}
      </div>`;
  },

  _renderTopBar(personaName) {
    return `
      <div class="wiz-topbar">
        <div class="wiz-topbar-logo">
          <img src="assets/branding/HomiumLogo_0721_Wordmark (Blue).png" alt="Homium" style="height:24px"
               onerror="this.style.display='none';this.nextElementSibling.style.display='inline'" />
          <span style="display:none;font-size:18px;font-weight:700;color:var(--color-primary);font-family:Taviraj,serif">Homium</span>
        </div>
        <div class="wiz-topbar-right">
          <span class="wiz-persona-pill">Welcome, ${personaName}</span>
          <button class="btn btn-ghost btn-xs" onclick="App.signOut()">Sign out</button>
        </div>
      </div>`;
  },

  _renderHeader() {
    return `
      <div class="wiz-header">
        <div class="wiz-page-title">New User Onboarding</div>
        <div class="wiz-page-subtitle">Verify your identity and credentials to access the Homium platform.</div>
      </div>`;
  },

  _renderTabs() {
    const steps = this._steps();
    const visible = steps.filter(s => s !== 'finish');
    return `
      <div class="section-tabs wiz-tabs">
        ${visible.map((s, i) => {
          const cls = i < this._step ? 'completed' : (i === this._step ? 'active' : '');
          return `<div class="section-tab ${cls}" style="${i > this._step ? 'opacity:.55;cursor:not-allowed' : ''}">
            <span style="font-size:11px;font-weight:700;color:var(--color-text-muted);margin-right:6px">${i + 1}</span>${this.STEP_LABELS[s] || s}
          </div>`;
        }).join('')}
      </div>`;
  },

  _renderFooter(stepId) {
    const isFirst = this._step === 0;
    const isPostSubmit = this._submitted.has(stepId);
    const isProfile = stepId === 'unified-profile';
    const isReview  = stepId === 'gates-review';

    let primaryBtn;
    if (isPostSubmit && !isProfile && !isReview) {
      primaryBtn = '';  // post-submit verification steps: only Skip advances
    } else if (isReview) {
      primaryBtn = `<button class="btn btn-primary" onclick="OnboardingFlowView._advance()">Continue →</button>`;
    } else if (isProfile) {
      primaryBtn = `<button class="btn btn-primary" onclick="OnboardingFlowView._submitUnifiedProfile()">Submit →</button>`;
    } else {
      primaryBtn = `<button class="btn btn-primary" onclick="OnboardingFlowView._submitVerify('${stepId}')">Submit →</button>`;
    }

    return `
      <div class="wiz-footer">
        <button class="btn btn-secondary" onclick="OnboardingFlowView._back()" ${isFirst ? 'disabled' : ''}>← Back</button>
        <div class="wiz-footer-right">
          ${primaryBtn}
          <button class="btn btn-ghost btn-sm wiz-skip-btn" onclick="OnboardingFlowView._skipStep('${stepId}')" title="Demo: skip this step without waiting for batch verification">
            Skip step (demo) →
          </button>
        </div>
      </div>`;
  },

  /* ---- Step renderers ---- */
  _renderStep(stepId) {
    switch (stepId) {
      case 'unified-profile': return this._renderUnifiedProfile();
      case 'nmls-verify':     return this._renderVerifyStep('nmls-verify');
      case 'kyc-verify':      return this._renderVerifyStep('kyc-verify');
      case 'branch-verify':   return this._renderVerifyStep('branch-verify');
      case 'product-verify':  return this._renderVerifyStep('product-verify');
      case 'gates-review':    return this._renderGatesSummary();
      case 'finish':          return this._renderFinish();
      default:                return this._renderFinish();
    }
  },

  /* ---- Unified profile (single page: identity + role + branch + NMLS) ---- */
  _renderUnifiedProfile() {
    const u = this._user() || {};
    const isLO = this._isLO();
    const companyId = u.companyId;
    const branches = companyId ? State.getBranchesByCompany(companyId) : [];

    return `
      <div class="card wiz-card">
        <div class="card-title" style="margin-bottom:6px">Set up your profile</div>
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:18px">
          Confirm or fill in the details below. Anything pre-filled was provided by your program admin.
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div>
            <div class="ob-field-label">First Name *</div>
            <input class="input" id="ob-first" value="${u.firstName || ''}" style="width:100%;box-sizing:border-box" />
          </div>
          <div>
            <div class="ob-field-label">Last Name *</div>
            <input class="input" id="ob-last" value="${u.lastName || ''}" style="width:100%;box-sizing:border-box" />
          </div>
          <div>
            <div class="ob-field-label">Email</div>
            <input class="input" value="${u.email || this._email}" disabled style="width:100%;box-sizing:border-box;background:var(--color-surface)" />
          </div>
          <div>
            <div class="ob-field-label">Phone *</div>
            <input class="input" id="ob-phone" value="${u.phone || ''}" placeholder="(202) 555-0123" style="width:100%;box-sizing:border-box" />
          </div>
          <div style="grid-column: 1 / -1">
            <div class="ob-field-label">Title</div>
            <input class="input" id="ob-title" value="${u.title || ''}" placeholder="e.g. Senior Loan Officer" style="width:100%;box-sizing:border-box" />
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
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px">
          <div>
            <div class="ob-field-label">Branch ${branches.length ? '*' : ''}</div>
            <select class="select-input" id="ob-branch" style="width:100%;box-sizing:border-box" ${branches.length === 0 ? 'disabled' : ''}>
              <option value="">${branches.length ? '— Select branch —' : 'No branches available'}</option>
              ${branches.map(b => `<option value="${b.id}" ${this._branchId === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <div class="ob-field-label">NMLS ID *</div>
            <input class="input" id="ob-nmls" value="${this._pendingNmlsId}" placeholder="e.g. 3256789" style="width:100%;box-sizing:border-box;font-family:'JetBrains Mono', monospace" />
          </div>
        </div>
        <div class="form-hint" style="font-size:11px;margin-top:4px">We'll verify your NMLS license and branch authorization in the next steps.</div>
        ` : ''}
      </div>`;
  },

  /* ---- Verification step (one card, two states) ---- */
  _verifyConfig(stepId) {
    const u = this._user() || {};
    const branch = this._branchId ? State.getBranch(this._branchId) : null;
    const programs = branch?.programs?.join(', ') || 'this branch';
    const nmls = u.nmlsLink?.nmlsId || this._pendingNmlsId || 'your license';

    if (stepId === 'nmls-verify') {
      return {
        vendor: 'NMLS',
        vendorColor: '#D97706',
        vendorBg: '#FEF3C7',
        title: 'NMLS license verification',
        intro: `We'll cross-check your NMLS ID <strong>${nmls}</strong> against the federal registry to load your authorized branches and state licenses.`,
        pendingTitle: 'NMLS verification in progress',
        pendingBody: `Your NMLS link request has been submitted. The federal NMLS registry processes verifications in a daily batch — typically completed within 24 hours. We'll email you when your license is linked.`,
      };
    }
    if (stepId === 'kyc-verify') {
      return {
        vendor: 'SecuritizeID',
        vendorColor: '#1D4ED8',
        vendorBg: '#EFF6FF',
        title: 'Identity verification (KYC)',
        intro: `As a Loan Officer, regulators require identity verification before you can originate. We use SecuritizeID for ID capture, address verification, and sanctions screening.`,
        pendingTitle: 'Identity verification in progress',
        pendingBody: `SecuritizeID is processing your submission. Verification typically completes within 24 hours; we'll email you when it's done.`,
      };
    }
    if (stepId === 'branch-verify') {
      return {
        vendor: 'NMLS',
        vendorColor: '#D97706',
        vendorBg: '#FEF3C7',
        title: 'Branch authorization',
        intro: `We confirm with NMLS that you are authorized to operate at <strong>${branch?.name || 'this branch'}</strong> (NMLS ${branch?.nmlsId || '—'}).`,
        pendingTitle: 'Branch authorization in progress',
        pendingBody: `Your branch sponsorship is being cross-referenced with NMLS. This usually clears within 24 hours of your NMLS link being verified.`,
      };
    }
    if (stepId === 'product-verify') {
      return {
        vendor: 'NMLS',
        vendorColor: '#D97706',
        vendorBg: '#FEF3C7',
        title: 'Product licensing',
        intro: `We confirm you hold an active license in <strong>${branch?.state || '—'}</strong> for the products served at this branch (${programs}).`,
        pendingTitle: 'License coverage check in progress',
        pendingBody: `Your state licenses are being verified for the programs offered at ${branch?.name || 'this branch'}. Typically clears within the daily batch.`,
      };
    }
    return null;
  },

  _renderVerifyStep(stepId) {
    const cfg = this._verifyConfig(stepId);
    if (!cfg) return '';
    const submitted = this._submitted.has(stepId);

    if (!submitted) {
      // State 1 — pre-submit intro
      return `
        <div class="card wiz-card">
          <div class="wiz-vendor-tag" style="color:${cfg.vendorColor};background:${cfg.vendorBg}">${cfg.vendor}</div>
          <div class="card-title" style="margin:14px 0 6px">${cfg.title}</div>
          <div style="font-size:13px;color:var(--color-text-muted);line-height:1.55;margin-bottom:18px">
            ${cfg.intro}
          </div>
          <div class="wiz-info-row">
            <span style="font-size:18px">↻</span>
            <span style="font-size:12px;color:var(--color-text-muted)">After you submit, verification runs in our daily batch — typically complete within 24 hours.</span>
          </div>
        </div>`;
    }

    // State 2 — post-submit pending
    return `
      <div class="card wiz-card wiz-pending-card">
        <div class="wiz-vendor-tag" style="color:${cfg.vendorColor};background:${cfg.vendorBg}">${cfg.vendor}</div>
        <div class="wiz-pending-icon">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="${cfg.vendorColor}" stroke-width="2">
            <circle cx="22" cy="22" r="18" stroke-opacity="0.25"/>
            <path d="M22 8 v14 l10 6" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="card-title" style="text-align:center;margin:18px 0 8px">${cfg.pendingTitle}</div>
        <div style="font-size:13px;color:var(--color-text-muted);text-align:center;line-height:1.55;max-width:520px;margin:0 auto 14px">
          ${cfg.pendingBody}
        </div>
        <div style="text-align:center;margin-top:6px">
          <span class="status-pill" style="background:${cfg.vendorBg};color:${cfg.vendorColor}"><span class="status-dot" style="background:${cfg.vendorColor}"></span>Awaiting daily verification batch</span>
        </div>
      </div>`;
  },

  /* ---- Gates review ---- */
  _renderGatesSummary() {
    const userId = this._userId;
    const branchId = this._branchId;
    const branch = branchId ? State.getBranch(branchId) : null;
    const gates = State.getActiveAtBranchGates(userId, branchId);

    const row = (ok, title, detail) => `
      <tr>
        <td style="width:32px;text-align:center;padding:10px 4px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${ok ? '#DCFCE7' : '#FEE2E2'};color:${ok ? '#166534' : '#991B1B'};font-weight:700;font-size:12px">${ok ? '✓' : '!'}</span>
        </td>
        <td style="padding:10px 4px">
          <div style="font-size:13px;font-weight:600">${title}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">${detail}</div>
        </td>
      </tr>`;

    return `
      <div class="card wiz-card">
        <div class="card-title" style="margin-bottom:6px">Verification summary</div>
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:14px">
          ${gates.allPass
            ? `All four gates have cleared for ${branch?.name || 'this branch'}. You're ready to originate.`
            : `Some gates are still in progress. You can continue and we'll unblock features as each gate clears.`}
        </div>
        <table class="ob-gates-table">
          ${row(gates.kyc.ok,             'Identity verified (Securitize)',          gates.kyc.label)}
          ${row(gates.nmls.ok,            'NMLS license linked',                     gates.nmls.label)}
          ${row(gates.branchAuth.ok,      `Authorized at ${branch?.name || 'branch'}`, gates.branchAuth.label)}
          ${row(gates.productLicensing.ok,'Licensed for branch programs',            gates.productLicensing.label)}
        </table>
      </div>`;
  },

  /* ---- Finish ---- */
  _renderFinish() {
    const u = this._user();
    const role = u?.role || this._role;
    const roleWelcome = {
      sys_admin:  'You have full platform access. Manage organizations, users, and system configuration.',
      operator:   'You can manage organizations, branches, and users across the platform.',
      prog_admin: 'You can manage your organization\'s branches and invite team members.',
      lo:         'You\'re ready to originate loan applications.',
      lp:         'You can now process and update loan applications.',
      investor:   'Your accreditation is confirmed.',
    };
    return `
      <div class="card wiz-card" style="text-align:center;max-width:560px;margin:60px auto">
        <div class="ob-icon" style="background:#DCFCE7;color:var(--color-success);margin:0 auto 20px">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="14" cy="14" r="12"/><path d="M8 14l4 4 8-8"/></svg>
        </div>
        <div class="card-title" style="font-size:22px;margin-bottom:8px">You're all set</div>
        <div style="font-size:14px;color:var(--color-text-muted);margin-bottom:24px;line-height:1.55">${roleWelcome[role] || 'Welcome to the Homium platform.'}</div>
        <button class="btn btn-primary" style="min-width:200px" onclick="OnboardingFlowView._finish()">Enter Platform →</button>
      </div>`;
  },

  /* ---- Form / role handlers ---- */
  _setRole(value) {
    this._role = value === 'lo' ? 'lo' : 'lp';
    if (this._userId) State.updateUser(this._userId, { role: this._role });
    this._render();
  },

  _readUnifiedProfileFields() {
    return {
      firstName: document.getElementById('ob-first')?.value.trim() || '',
      lastName:  document.getElementById('ob-last')?.value.trim() || '',
      phone:     document.getElementById('ob-phone')?.value.trim() || '',
      title:     document.getElementById('ob-title')?.value.trim() || '',
      branchId:  document.getElementById('ob-branch')?.value || null,
      nmlsId:    document.getElementById('ob-nmls')?.value.trim() || '',
    };
  },

  _saveProfile(fields, { strict }) {
    if (!this._userId) return false;
    const u = this._user() || {};
    const isLO = this._isLO();

    // Pull defaults from existing user data when caller said "use defaults"
    const firstName = fields.firstName || u.firstName || 'New';
    const lastName  = fields.lastName  || u.lastName  || 'User';
    const phone     = fields.phone     || u.phone     || '202-555-0000';
    const title     = fields.title     || u.title     || (isLO ? 'Loan Officer' : 'Team Member');

    if (strict && (!firstName || !lastName || !phone)) {
      alert('Please fill in your name and phone.');
      return false;
    }

    const role = isLO ? 'lo' : 'lp';
    let branchId = fields.branchId;
    let nmlsId = fields.nmlsId;
    const branches = State.getBranchesByCompany(u.companyId || '');

    if (isLO && branches.length && !branchId) {
      if (strict) { alert('Loan Officers must select a branch.'); return false; }
      branchId = branches[0].id;
    }
    if (isLO && !nmlsId) {
      if (strict) { alert('Loan Officers must provide an NMLS ID. We\'ll verify it next.'); return false; }
      nmlsId = u.nmlsId || u.agentNmlsId || '3256789';
    }

    if (branchId) this._branchId = branchId;
    if (nmlsId)   this._pendingNmlsId = nmlsId;

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
        nmlsLink: { ...(u.nmlsLink || {}), nmlsId, status: 'not_linked' },
      } : {}),
    });
    return true;
  },

  _submitUnifiedProfile() {
    const ok = this._saveProfile(this._readUnifiedProfileFields(), { strict: true });
    if (ok) this._advance();
  },

  /* ---- Verify-step submission (flips into "validation in progress" state) ---- */
  _submitVerify(stepId) {
    this._submitted.add(stepId);
    this._render();
  },

  /* ---- Skip-step (demo-only fast forward through verification) ---- */
  _skipStep(stepId) {
    if (stepId === 'unified-profile') {
      this._saveProfile(this._readUnifiedProfileFields(), { strict: false });
      this._advance();
      return;
    }
    if (stepId === 'nmls-verify') {
      if (this._userId) State.setNmlsLinkVerified(this._userId, this._pendingNmlsId);
      this._advance();
      return;
    }
    if (stepId === 'kyc-verify') {
      if (this._userId) State.setKycVerified(this._userId);
      this._advance();
      return;
    }
    if (stepId === 'branch-verify') {
      const u = this._user();
      const branch = this._branchId ? State.getBranch(this._branchId) : null;
      if (u && branch?.nmlsId) {
        const link = u.nmlsLink || { authorizedBranchNmlsIds: [] };
        if (!link.authorizedBranchNmlsIds.includes(branch.nmlsId)) {
          State.updateUser(u.id, {
            nmlsLink: { ...link, authorizedBranchNmlsIds: [...link.authorizedBranchNmlsIds, branch.nmlsId] },
          });
        }
      }
      this._advance();
      return;
    }
    if (stepId === 'product-verify') {
      // Ensure user has a license covering the branch's state
      const u = this._user();
      const branch = this._branchId ? State.getBranch(this._branchId) : null;
      if (u && branch?.state) {
        const markets = State.getMarkets ? State.getMarkets() : [];
        const market = markets.find(m => m.code === branch.state);
        if (market) {
          const existing = Array.isArray(u.licenses) ? u.licenses : [];
          const has = existing.some(l => l.marketId === market.id && l.active);
          if (!has) {
            existing.push({
              id: `lic-${u.id}-${branch.state}-demo`,
              marketId: market.id,
              regulator: `${branch.state} (demo override)`,
              active: true,
              issueDate: new Date().toISOString().split('T')[0],
              renewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
              lastSync: new Date().toISOString(),
            });
            State.updateUser(u.id, { licenses: existing });
          }
        }
      }
      this._advance();
      return;
    }
    if (stepId === 'gates-review') {
      this._advance();
      return;
    }
  },

  /* ---- Navigation ---- */
  _advance() {
    this._step++;
    this._render();
  },

  _back() {
    if (this._step > 0) {
      this._step--;
      // Clear submitted state on the step we're going back to so user can re-submit
      const stepId = this._currentStepId();
      this._submitted.delete(stepId);
      this._render();
    }
  },

  _finish() {
    if (this._userId) State.updateUser(this._userId, { onboardingStatus: 'active' });
    this._teardown();
    const role = this._user()?.role || this._role;
    if (role === 'prog_admin') Router.navigate('/origination-companies');
    else if (role === 'lo' || role === 'lp') Router.navigate('/originations');
    else Router.navigate('/data/analytics');
  },

  _teardown() {
    const overlay = document.getElementById('onboarding-flow-overlay');
    if (overlay) overlay.remove();
    DataPlatformView._activeTab = 'analytics';
  },
};
