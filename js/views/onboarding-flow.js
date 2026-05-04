/* ============================================================
   HOMIUM ORIGINATOR FLOW — New-User Onboarding Wizard
   Full-page layout (matches OC Wizard pattern). Auth (verify-email +
   password) happens in the login page. Wizard steps:
     1. Profile  — always shown; user can review/edit pre-filled data
     2. External Certification Validation (LO + investor only)
        - NMLS validation runs in the background (system-initiated)
        - Securitize KYC modal is user-initiated via "Begin KYC" button
        - Branch authorization + product licensing roll into NMLS
     3. Complete
   Section tabs are clickable to navigate back to any visited step
   for review. Current step persists on user.onboardingProgress so
   logout / login resumes where the user left off.
   ============================================================ */

const OnboardingFlowView = {
  _step: 0,
  _maxStep: 0,
  _userId: null,
  _role: null,
  _email: '',
  _branchId: null,
  _pendingNmlsId: '',
  _securitizeStep: 0,        // 0 = closed; 1..5 = open at given screen

  /* ---- Public entry point ---- */
  open(role, opts = {}) {
    this._role = role;
    const user = opts.userId ? State.getUser(opts.userId) : State.getCurrentUser();
    this._userId = user?.id || null;
    this._email = user?.email || 'user@example.com';
    this._branchId = user?.branchId || (user?.branchAssignments?.[0]?.branchId) || null;
    this._pendingNmlsId = user?.nmlsLink?.nmlsId || user?.agentNmlsId || user?.nmlsId || '';
    // Resume from saved progress
    const saved = user?.onboardingProgress || { step: 0, maxStep: 0 };
    this._step = Math.min(saved.step, this._steps().length - 1);
    this._maxStep = Math.max(saved.maxStep, this._step);
    this._securitizeStep = 0;

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

  _needsCert() {
    // External certification required for LOs (NMLS + KYC) and investors (KYC only)
    const u = this._user();
    const role = u?.role || this._role;
    return this._isLO() || role === 'investor';
  },

  /* ---- Step graph ---- */
  STEP_LABELS: {
    'unified-profile':         'Profile',
    'external-cert-validation':'External Certification',
    'finish':                  'Complete',
  },

  _steps() {
    const steps = ['unified-profile'];
    if (this._needsCert()) steps.push('external-cert-validation');
    steps.push('finish');
    return steps;
  },

  _currentStepId() { return this._steps()[this._step] || 'finish'; },

  _persistProgress() {
    if (!this._userId) return;
    State.updateUser(this._userId, {
      onboardingProgress: { step: this._step, maxStep: this._maxStep },
    });
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
      ${this._renderHeader()}
      ${this._renderTabs()}
      <div class="wiz-body">
        ${this._renderStep(stepId)}
        ${isFinish ? '' : this._renderFooter(stepId)}
      </div>
      ${this._securitizeStep > 0 ? this._renderSecuritizeModal() : ''}`;
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
    return `
      <div class="section-tabs wiz-tabs">
        ${steps.map((s, i) => {
          const isCurrent = i === this._step;
          const isCompleted = i < this._step;
          const isVisited = i <= this._maxStep;
          const cls = isCurrent ? 'active' : (isCompleted ? 'completed' : '');
          const onclick = isVisited ? `onclick="OnboardingFlowView._gotoStep(${i})"` : '';
          const style = !isVisited ? 'opacity:.55;cursor:not-allowed' : 'cursor:pointer';
          return `<div class="section-tab ${cls}" ${onclick} style="${style}" title="${isVisited ? 'Click to review' : 'Locked until you reach this step'}">
            <span style="font-size:11px;font-weight:700;color:var(--color-text-muted);margin-right:6px">${i + 1}</span>${this.STEP_LABELS[s] || s}
          </div>`;
        }).join('')}
      </div>`;
  },

  _renderFooter(stepId) {
    const isFirst = this._step === 0;
    const isProfile = stepId === 'unified-profile';
    const isCert = stepId === 'external-cert-validation';

    let primaryBtn;
    if (isProfile) {
      primaryBtn = `<button class="btn btn-primary" onclick="OnboardingFlowView._submitUnifiedProfile()">Submit →</button>`;
    } else if (isCert) {
      primaryBtn = `<button class="btn btn-primary" onclick="OnboardingFlowView._advance()">Continue →</button>`;
    } else {
      primaryBtn = `<button class="btn btn-primary" onclick="OnboardingFlowView._advance()">Continue →</button>`;
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
      case 'unified-profile':          return this._renderUnifiedProfile();
      case 'external-cert-validation': return this._renderCertValidation();
      case 'finish':                   return this._renderFinish();
      default:                         return this._renderFinish();
    }
  },

  /* ---- Unified profile (always shown; user reviews / edits pre-filled) ---- */
  _renderUnifiedProfile() {
    const u = this._user() || {};
    const isLO = this._isLO();
    const companyId = u.companyId;
    const branches = companyId ? State.getBranchesByCompany(companyId) : [];

    return `
      <div class="card wiz-card">
        <div class="card-title" style="margin-bottom:6px">Set up your profile</div>
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:18px">
          Confirm or fill in your details. Anything pre-filled was provided by your program admin and is editable.
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
        <div class="form-hint" style="font-size:11px;margin-top:4px">We'll verify your NMLS license and identity in the next step.</div>
        ` : ''}
      </div>`;
  },

  /* ---- External certification validation step ---- */
  _renderCertValidation() {
    const u = this._user() || {};
    const isLO = this._isLO();
    const kyc = u.kyc || { status: 'not_started' };
    const link = u.nmlsLink || { status: 'not_linked' };
    const branch = this._branchId ? State.getBranch(this._branchId) : null;

    const nmlsCard = isLO ? this._renderNmlsCard(link, branch) : '';
    const kycCard = this._renderKycCard(kyc);

    return `
      <div class="cert-grid">
        ${nmlsCard}
        ${kycCard}
      </div>
      <div class="cert-helper">
        <strong>What's happening?</strong> NMLS verification (and your branch + product license coverage) runs automatically in our daily verification batch — typically complete within 24 hours. Securitize KYC is user-initiated; click <em>Begin Securitize KYC</em> when you're ready. You'll receive an email when both are verified. You can sign out and resume from this step at any time.
      </div>`;
  },

  _renderNmlsCard(link, branch) {
    const status = link.status || 'not_linked';
    let statusPill, body, icon;
    if (status === 'verified') {
      statusPill = `<span class="status-pill" style="background:#DCFCE7;color:#166534"><span class="status-dot" style="background:#16A34A"></span>Verified</span>`;
      icon = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#16A34A" stroke-width="2.4"><circle cx="20" cy="20" r="16"/><path d="M13 20l5 5 9-10"/></svg>`;
      body = `<div style="font-size:12px;color:var(--color-text-secondary);line-height:1.5">
                NMLS ID <strong>${link.nmlsId}</strong> linked.
                <br>${(link.licensedStates || []).length} state license${(link.licensedStates || []).length === 1 ? '' : 's'} (${(link.licensedStates || []).join(', ') || '—'})
                <br>${(link.authorizedBranchNmlsIds || []).length} authorized branch${(link.authorizedBranchNmlsIds || []).length === 1 ? '' : 'es'}.
              </div>`;
    } else {
      // pending — kicked off automatically when user landed on this step
      statusPill = `<span class="status-pill" style="background:#FEF3C7;color:#8A5A00"><span class="status-dot" style="background:#D97706"></span>Validation in progress</span>`;
      icon = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#D97706" stroke-width="2.4">
                <circle cx="20" cy="20" r="16" stroke-opacity="0.3"/>
                <path d="M20 8 v12 l8 5" stroke-linecap="round"/>
              </svg>`;
      body = `<div style="font-size:12px;color:var(--color-text-secondary);line-height:1.5">
                Cross-checking NMLS ID <strong>${link.nmlsId || this._pendingNmlsId || '—'}</strong> against the federal registry.
                Includes ${branch ? `authorization at <strong>${branch.name}</strong> and licensing for ${branch.programs?.join(', ') || 'branch programs'}` : 'branch authorization and product licensing'}.
                Runs in our daily batch — typically 24h.
              </div>`;
    }

    return `
      <div class="card cert-card">
        <div class="cert-card-head">
          <div class="cert-card-vendor" style="color:#D97706;background:#FEF3C7">NMLS</div>
          ${statusPill}
        </div>
        <div class="cert-card-icon">${icon}</div>
        <div class="cert-card-title">NMLS license &amp; sponsorship</div>
        ${body}
      </div>`;
  },

  _renderKycCard(kyc) {
    const status = kyc.status || 'not_started';
    let statusPill, body, icon, action;
    if (status === 'verified') {
      statusPill = `<span class="status-pill" style="background:#DCFCE7;color:#166534"><span class="status-dot" style="background:#16A34A"></span>Verified</span>`;
      icon = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#16A34A" stroke-width="2.4"><circle cx="20" cy="20" r="16"/><path d="M13 20l5 5 9-10"/></svg>`;
      body = `<div style="font-size:12px;color:var(--color-text-secondary);line-height:1.5">
                Identity confirmed. Securitize reference <code style="background:var(--color-surface);padding:1px 6px;border-radius:3px;font-size:11px">${kyc.referenceId || '—'}</code>.
              </div>`;
      action = '';
    } else if (status === 'pending') {
      statusPill = `<span class="status-pill" style="background:#EFF6FF;color:#1D4ED8"><span class="status-dot" style="background:#2563EB"></span>Validation in progress</span>`;
      icon = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#2563EB" stroke-width="2.4">
                <circle cx="20" cy="20" r="16" stroke-opacity="0.3"/>
                <path d="M20 8 v12 l8 5" stroke-linecap="round"/>
              </svg>`;
      body = `<div style="font-size:12px;color:var(--color-text-secondary);line-height:1.5">
                Securitize is reviewing your submission. Verification typically completes within 24 hours; we'll email you when it's done.
              </div>`;
      action = '';
    } else {
      statusPill = `<span class="status-pill" style="background:var(--color-surface);color:var(--color-text-muted)"><span class="status-dot" style="background:#9CA3AF"></span>Not started</span>`;
      icon = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#1D4ED8" stroke-width="2.2">
                <circle cx="20" cy="14" r="6"/><path d="M8 34c0-6 6-10 12-10s12 4 12 10"/><path d="M30 5l3 3-9 9"/>
              </svg>`;
      body = `<div style="font-size:12px;color:var(--color-text-secondary);line-height:1.5">
                We use Securitize for ID capture, address verification, and sanctions screening. Click below to begin — you'll be guided through ID upload and a quick selfie.
              </div>`;
      action = `<button class="btn btn-primary cert-card-action" onclick="OnboardingFlowView._openSecuritize()">Begin Securitize KYC →</button>`;
    }

    return `
      <div class="card cert-card">
        <div class="cert-card-head">
          <div class="cert-card-vendor" style="color:#1D4ED8;background:#EFF6FF">SecuritizeID</div>
          ${statusPill}
        </div>
        <div class="cert-card-icon">${icon}</div>
        <div class="cert-card-title">Identity verification (KYC)</div>
        ${body}
        ${action}
      </div>`;
  },

  /* ---- Securitize KYC modal (5-step simulated flow) ---- */
  _openSecuritize() {
    this._securitizeStep = 1;
    this._render();
  },
  _closeSecuritize() {
    this._securitizeStep = 0;
    this._render();
  },
  _securitizeNext() {
    if (this._securitizeStep < 5) {
      this._securitizeStep++;
      this._render();
    }
  },
  _securitizeSubmit() {
    // Mark KYC as pending (validation in progress)
    if (this._userId) {
      const u = this._user();
      State.updateUser(this._userId, {
        kyc: { ...(u?.kyc || {}), status: 'pending', vendor: 'securitize', verifiedAt: null, referenceId: null },
      });
    }
    this._securitizeStep = 0;
    this._render();
  },

  _renderSecuritizeModal() {
    const step = this._securitizeStep;
    let body = '';
    if (step === 1) {
      body = `
        <div style="text-align:center">
          <div class="securitize-step-icon" style="background:#EFF6FF;color:#1D4ED8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/></svg>
          </div>
          <div class="securitize-step-title">Welcome to SecuritizeID</div>
          <div class="securitize-step-subtitle">Identity &amp; Accreditation Verification</div>
          <div class="securitize-step-body">
            We'll guide you through a quick verification flow:
            <ol style="text-align:left;margin:12px auto 0;max-width:340px;padding-left:18px;font-size:13px;color:var(--color-text-secondary);line-height:1.7">
              <li>Choose an ID document type</li>
              <li>Upload your government ID (front &amp; back)</li>
              <li>Take a selfie for biometric matching</li>
              <li>Review and submit</li>
            </ol>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:14px">Your data is processed by Securitize, not stored on Homium.</div>
          </div>
        </div>`;
    } else if (step === 2) {
      body = `
        <div>
          <div class="securitize-step-title">Choose your ID document</div>
          <div class="securitize-step-subtitle">Pick the government-issued ID you'll use for verification</div>
          <div class="securitize-doc-grid">
            ${[
              { label: "Driver's License", desc: 'Most common · 30s capture' },
              { label: 'Passport',         desc: 'Photo page only · works for any country' },
              { label: 'State ID Card',    desc: 'Non-driver state-issued ID' },
            ].map((d, i) => `
              <label class="securitize-doc-card${i === 0 ? ' selected' : ''}">
                <input type="radio" name="securitize-doc" ${i === 0 ? 'checked' : ''} />
                <div>
                  <div style="font-weight:600;font-size:13px">${d.label}</div>
                  <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">${d.desc}</div>
                </div>
              </label>`).join('')}
          </div>
        </div>`;
    } else if (step === 3) {
      body = `
        <div>
          <div class="securitize-step-title">Upload your driver's license</div>
          <div class="securitize-step-subtitle">Front and back. Make sure all four corners are visible.</div>
          <div class="securitize-upload-grid">
            <div class="securitize-upload-tile">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>
              <div style="font-size:12px;font-weight:600;margin-top:8px">Front of ID</div>
              <div style="font-size:10px;color:var(--color-text-muted);margin-top:2px">drivers-license-front.jpg · 1.2 MB</div>
            </div>
            <div class="securitize-upload-tile">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>
              <div style="font-size:12px;font-weight:600;margin-top:8px">Back of ID</div>
              <div style="font-size:10px;color:var(--color-text-muted);margin-top:2px">drivers-license-back.jpg · 0.9 MB</div>
            </div>
          </div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:12px;text-align:center">Both files captured. Ready to continue.</div>
        </div>`;
    } else if (step === 4) {
      body = `
        <div>
          <div class="securitize-step-title">Liveness check</div>
          <div class="securitize-step-subtitle">A quick selfie so we can match it against your ID photo.</div>
          <div class="securitize-selfie-tile">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2">
              <circle cx="12" cy="9" r="4"/>
              <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
            </svg>
            <div style="font-size:13px;font-weight:600;margin-top:12px;color:#16A34A">Liveness check passed ✓</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">Match score: 99.2%</div>
          </div>
        </div>`;
    } else if (step === 5) {
      body = `
        <div>
          <div class="securitize-step-title">Review &amp; submit</div>
          <div class="securitize-step-subtitle">We'll send your submission to compliance for verification</div>
          <div class="securitize-review">
            <div class="securitize-review-row"><span>Document type</span><strong>Driver's License</strong></div>
            <div class="securitize-review-row"><span>Front of ID</span><strong>✓ Captured</strong></div>
            <div class="securitize-review-row"><span>Back of ID</span><strong>✓ Captured</strong></div>
            <div class="securitize-review-row"><span>Liveness check</span><strong>✓ Passed (99.2%)</strong></div>
          </div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:12px;line-height:1.5">
            By submitting, you authorize Securitize to perform identity verification, address verification, and sanctions screening. Verification typically completes within 24 hours.
          </div>
        </div>`;
    }

    const isLast = step === 5;
    const totalSteps = 5;
    return `
      <div class="securitize-overlay" onclick="if(event.target===this)OnboardingFlowView._closeSecuritize()">
        <div class="securitize-modal">
          <div class="securitize-header">
            <div class="securitize-brand">
              <div class="securitize-brand-mark">SI</div>
              <div>
                <div style="font-size:13px;font-weight:700;color:#1D4ED8">SecuritizeID</div>
                <div style="font-size:10px;color:var(--color-text-muted)">Powered by Securitize</div>
              </div>
            </div>
            <button class="securitize-close" onclick="OnboardingFlowView._closeSecuritize()" title="Close">×</button>
          </div>
          <div class="securitize-progress">
            ${[1,2,3,4,5].map(i => `<div class="securitize-progress-dot ${i <= step ? 'done' : ''}"></div>`).join('')}
          </div>
          <div class="securitize-body">${body}</div>
          <div class="securitize-footer">
            <button class="btn btn-ghost btn-sm" onclick="OnboardingFlowView._closeSecuritize()">Cancel</button>
            <div style="font-size:11px;color:var(--color-text-muted)">Step ${step} of ${totalSteps}</div>
            ${isLast
              ? `<button class="btn btn-primary" onclick="OnboardingFlowView._securitizeSubmit()" style="background:#1D4ED8">Submit for verification →</button>`
              : `<button class="btn btn-primary" onclick="OnboardingFlowView._securitizeNext()" style="background:#1D4ED8">Continue →</button>`}
          </div>
        </div>
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
        // NMLS validation kicks off automatically on entry to the cert step.
        // Reset to 'pending' so the user lands there with the in-progress visual.
        nmlsLink: { ...(u.nmlsLink || {}), nmlsId, status: 'pending' },
      } : {}),
    });
    return true;
  },

  _submitUnifiedProfile() {
    const ok = this._saveProfile(this._readUnifiedProfileFields(), { strict: true });
    if (ok) this._advance();
  },

  /* ---- Skip-step (demo-only fast forward) ---- */
  _skipStep(stepId) {
    if (stepId === 'unified-profile') {
      this._saveProfile(this._readUnifiedProfileFields(), { strict: false });
      this._advance();
      return;
    }
    if (stepId === 'external-cert-validation') {
      // Mark both NMLS and KYC as verified, then advance
      if (this._userId) {
        const isLO = this._isLO();
        if (isLO) State.setNmlsLinkVerified(this._userId, this._pendingNmlsId);
        if (this._needsCert()) State.setKycVerified(this._userId);
        // Patch branch authorization in case the seeded NMLS authority doesn't include it
        if (isLO && this._branchId) {
          const branch = State.getBranch(this._branchId);
          const u = this._user();
          if (branch?.nmlsId && u?.nmlsLink && !u.nmlsLink.authorizedBranchNmlsIds.includes(branch.nmlsId)) {
            State.updateUser(u.id, {
              nmlsLink: { ...u.nmlsLink, authorizedBranchNmlsIds: [...u.nmlsLink.authorizedBranchNmlsIds, branch.nmlsId] },
            });
          }
        }
      }
      this._advance();
      return;
    }
    // finish step has no skip
    this._advance();
  },

  /* ---- Navigation ---- */
  _advance() {
    this._step = Math.min(this._step + 1, this._steps().length - 1);
    this._maxStep = Math.max(this._maxStep, this._step);
    // On entering the cert step for the first time, kick off NMLS validation in the background
    if (this._currentStepId() === 'external-cert-validation' && this._isLO()) {
      const u = this._user();
      if (u && (u.nmlsLink?.status === 'not_linked' || !u.nmlsLink?.status)) {
        State.updateUser(this._userId, {
          nmlsLink: { ...(u.nmlsLink || {}), nmlsId: this._pendingNmlsId, status: 'pending' },
        });
      }
    }
    this._persistProgress();
    this._render();
  },

  _back() {
    if (this._step > 0) {
      this._step--;
      this._persistProgress();
      this._render();
    }
  },

  _gotoStep(idx) {
    if (idx < 0 || idx > this._maxStep) return;
    this._step = idx;
    this._persistProgress();
    this._render();
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
