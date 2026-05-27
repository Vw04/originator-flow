/* ============================================================
   HOMIUM ORIGINATOR FLOW — Login Page
   Split layout: aerial neighborhood SVG on the left, sign-in card
   on the right (Homium logo + persona dropdown + email/password +
   2FA). After Verify, routes to the wizard if onboarding is
   incomplete or to the role's home page otherwise.
   ============================================================ */

const CHEVRON_RIGHT = `<svg class="btn-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4.5 2.5 8 6 4.5 9.5"/></svg>`;
const CHEVRON_LEFT  = `<svg class="btn-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="7.5 2.5 4 6 7.5 9.5"/></svg>`;

const LoginView = {
  /* Same persona list that previously lived in role-select.js. The
     persona dropdown's source of truth — picking one auto-fills the
     email/password fields and drives the routing decision after
     2FA. investor_prospect / scenario14 short-circuit the wizard. */
  PERSONAS: [
    { key: 'sys_admin',  title: 'System Admin',           userType: 'Platform',     emailHint: 'alex.morgan@homium.com' },
    { key: 'operator',   title: 'Platform Operator',      userType: 'Platform',     emailHint: 'jordan.lee@homium.com' },
    { key: 'prog_admin', title: 'Program Admin',          userType: 'OC Admin',     emailHint: 'powens@capitalcitylending.com' },
    { key: 'lo',         title: 'Loan Officer',           userType: 'Branch · LO',  emailHint: 'jokafor@capitalcitylending.com' },
    { key: 'lp',         title: 'Loan Processor',         userType: 'Branch · Std', emailHint: 'kpark@capitalcitylending.com' },
    { key: 'scenario14', title: 'Multi-Branch Power User', userType: 'Branch · Std (×5)', emailHint: 'demo+sc14@homium.com' },
    { key: 'investor',   title: 'Investor',               userType: 'Portfolio',    emailHint: 'investor@homium.com' },
    { key: 'investor_prospect', title: 'Investor Prospect', userType: 'Preview',    emailHint: 'prospect@homium.com' },
  ],

  _state: null,

  render() {
    if (!this._state) this._state = { stage: 'signin', selectedRole: 'lo' };
    const persona = this.PERSONAS.find(p => p.key === this._state.selectedRole) || this.PERSONAS[3];
    this._state.email = persona.emailHint;
    return `
      <div class="login-split">
        ${this._renderNeighborhood()}
        <div class="login-half-right">
          <div class="login-form-wrap">
            <div class="login-logo">
              <img src="assets/branding/HomiumLogo_0721_Wordmark (Blue).png" alt="Homium" style="height:32px"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
              <span style="display:none;font-size:24px;font-weight:700;color:var(--h-action);font-family:var(--font-heading)">Homium</span>
            </div>
            ${this._state.stage === 'signin' ? this._renderSignInCard(persona) : this._render2FACard(persona)}
            <div class="login-footer-note">Interactive prototype — Q2 2026 · No real authentication</div>
          </div>
        </div>
      </div>`;
  },

  _renderSignInCard(persona) {
    return `
      <div class="login-form-card">
        <div class="login-form-title">Sign in to Homium</div>
        <div class="login-form-subtitle">Originator Platform</div>

        <div class="login-field">
          <label>Demo persona</label>
          <select class="select-input" onchange="LoginView._selectPersona(this.value)">
            ${this.PERSONAS.map(p => `<option value="${p.key}" ${this._state.selectedRole === p.key ? 'selected' : ''}>${p.title} — ${p.userType}</option>`).join('')}
          </select>
          <div class="login-field-hint">Selecting a persona pre-fills the form. No real auth.</div>
        </div>

        <div class="login-field">
          <label>Email</label>
          <input class="input" id="login-email" type="email" value="${persona.emailHint}" />
        </div>

        <div class="login-field">
          <label>Password</label>
          <input class="input" id="login-password" type="password" value="••••••••••••" />
        </div>

        <label class="login-remember">
          <input type="checkbox" checked />
          <span>Remember me on this device</span>
        </label>

        <button class="btn btn-primary login-submit-btn" onclick="LoginView._submitSignIn()">Sign In ${CHEVRON_RIGHT}</button>

        <div class="login-form-footnote">
          Trouble signing in? Contact your <a href="#" onclick="return false">platform administrator</a>.
        </div>
      </div>`;
  },

  _render2FACard(persona) {
    return `
      <div class="login-form-card">
        <div class="login-form-title">Two-factor authentication</div>
        <div class="login-form-subtitle">We sent a 6-digit code to <strong>${persona.emailHint}</strong></div>

        <div class="login-code-row">
          ${[8,4,2,7,1,3].map((d, i) => `<input class="ob-code-input" maxlength="1" value="${d}" id="login-2fa-${i}"
            oninput="LoginView._codeInput(this, ${i})"
            onkeydown="LoginView._codeKey(event, ${i})" />`).join('')}
        </div>

        <button class="btn btn-primary login-submit-btn" onclick="LoginView._verify2FA()">Verify &amp; Continue ${CHEVRON_RIGHT}</button>

        <button class="btn btn-ghost login-back-btn" onclick="LoginView._backToSignIn()">${CHEVRON_LEFT} Back to sign in</button>
      </div>`;
  },

  /* Aerial neighborhood — inline SVG, no external image. Stylized:
     monochromatic green palette to match Homium brand, abstract grid
     of rooftops with tree-lined streets and a small park. */
  _renderNeighborhood() {
    return `
      <div class="login-half-left">
        <svg class="login-neighborhood" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#D6E5DA"/>
              <stop offset="50%" stop-color="#B6CFC0"/>
              <stop offset="100%" stop-color="#8FAE9A"/>
            </linearGradient>
            <linearGradient id="overlay-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#00334A" stop-opacity="0.08"/>
              <stop offset="100%" stop-color="#061629" stop-opacity="0.18"/>
            </linearGradient>
            <pattern id="grass" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#A8C2B0"/>
              <circle cx="2" cy="2" r="0.5" fill="#8FAE9A"/>
              <circle cx="4" cy="4" r="0.5" fill="#9BB7A4"/>
            </pattern>
          </defs>

          <!-- Background -->
          <rect width="600" height="900" fill="url(#bg-grad)"/>
          <rect width="600" height="900" fill="url(#grass)" opacity="0.4"/>

          <!-- Streets (horizontal + vertical) -->
          <g fill="#D8D2C0" opacity="0.85">
            <rect x="0" y="155" width="600" height="22"/>
            <rect x="0" y="380" width="600" height="22"/>
            <rect x="0" y="605" width="600" height="22"/>
            <rect x="0" y="820" width="600" height="22"/>
            <rect x="120" y="0" width="20" height="900"/>
            <rect x="290" y="0" width="20" height="900"/>
            <rect x="460" y="0" width="20" height="900"/>
          </g>

          <!-- Lane stripes -->
          <g stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="8 8" opacity="0.6">
            <line x1="0" y1="166" x2="600" y2="166"/>
            <line x1="0" y1="391" x2="600" y2="391"/>
            <line x1="0" y1="616" x2="600" y2="616"/>
            <line x1="0" y1="831" x2="600" y2="831"/>
            <line x1="130" y1="0" x2="130" y2="900"/>
            <line x1="300" y1="0" x2="300" y2="900"/>
            <line x1="470" y1="0" x2="470" y2="900"/>
          </g>

          <!-- Rooftops (rendered as a few groups with varied colors). Each "house" is a rectangle + a slim ridge-line. -->
          <g>
            ${this._buildHouses()}
          </g>

          <!-- Park (lighter green block, with a path through it) -->
          <g>
            <rect x="320" y="400" width="140" height="200" rx="6" fill="#7FA88B"/>
            <path d="M320 480 Q380 510 460 470" stroke="#D8D2C0" stroke-width="6" fill="none" opacity="0.7"/>
            <circle cx="350" cy="430" r="8" fill="#3F6B4D"/>
            <circle cx="425" cy="445" r="9" fill="#3F6B4D"/>
            <circle cx="395" cy="540" r="7" fill="#3F6B4D"/>
            <circle cx="445" cy="570" r="8" fill="#3F6B4D"/>
            <circle cx="335" cy="565" r="7" fill="#3F6B4D"/>
          </g>

          <!-- Trees scattered between blocks -->
          <g fill="#3F6B4D">
            <circle cx="60"  cy="200" r="8"/>
            <circle cx="200" cy="220" r="7"/>
            <circle cx="80"  cy="300" r="6"/>
            <circle cx="540" cy="200" r="8"/>
            <circle cx="220" cy="450" r="7"/>
            <circle cx="65"  cy="500" r="9"/>
            <circle cx="540" cy="500" r="7"/>
            <circle cx="65"  cy="700" r="8"/>
            <circle cx="220" cy="700" r="6"/>
            <circle cx="540" cy="700" r="9"/>
            <circle cx="220" cy="100" r="7"/>
            <circle cx="380" cy="100" r="6"/>
            <circle cx="540" cy="100" r="8"/>
            <circle cx="60"  cy="850" r="7"/>
            <circle cx="200" cy="870" r="8"/>
            <circle cx="380" cy="870" r="6"/>
            <circle cx="540" cy="870" r="7"/>
          </g>

          <!-- Subtle overlay tint -->
          <rect width="600" height="900" fill="url(#overlay-grad)"/>

          <!-- Brand watermark -->
          <text x="40" y="850" fill="#00334A" font-family="IvyPresto Display, Georgia, serif" font-size="22" font-weight="400" opacity="0.22">Homium</text>
          <text x="40" y="872" fill="#00334A" font-family="Ubuntu, sans-serif" font-size="11" opacity="0.4">Originator Platform</text>
        </svg>
      </div>`;
  },

  /* Build a grid of stylized rooftops between the streets. Each tile is a
     rectangle (the rooftop) with a thin ridge line. Rooftop colors rotate
     through a small palette to vary the visual without looking noisy. */
  _buildHouses() {
    const palette = ['#C97D4A', '#B8643A', '#9C5832', '#A87654', '#8B5A3C', '#7E4A2F'];
    const cells = [
      // [xStart, xEnd, yStart, yEnd] for each "block" between streets
      [0, 120, 0, 155],   [140, 290, 0, 155],   [310, 460, 0, 155],   [480, 600, 0, 155],
      [0, 120, 177, 380], [140, 290, 177, 380], [310, 460, 177, 380], [480, 600, 177, 380],
      [0, 120, 402, 605], [140, 290, 402, 605], /* park at 310-460 */ [480, 600, 402, 605],
      [0, 120, 627, 820], [140, 290, 627, 820], [310, 460, 627, 820], [480, 600, 627, 820],
      [0, 120, 842, 900], [140, 290, 842, 900], [310, 460, 842, 900], [480, 600, 842, 900],
    ];
    let out = '';
    let colorIdx = 0;
    cells.forEach(([x1, x2, y1, y2]) => {
      const blockW = x2 - x1;
      const blockH = y2 - y1;
      // Skip very small blocks (top/bottom strips)
      if (blockH < 60) return;
      // Houses arranged in a 2-column, multi-row layout per block
      const colWidth = blockW / 2;
      const houseW = Math.min(40, colWidth - 18);
      const rowGap = 14;
      const houseH = 28;
      const rows = Math.floor((blockH - 20) / (houseH + rowGap));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 2; c++) {
          const hx = x1 + 12 + c * colWidth;
          const hy = y1 + 14 + r * (houseH + rowGap);
          if (hy + houseH > y2 - 6) continue;
          const color = palette[colorIdx % palette.length];
          colorIdx++;
          out += `<rect x="${hx}" y="${hy}" width="${houseW}" height="${houseH}" rx="2" fill="${color}" opacity="0.92"/>`;
          // Ridge line
          out += `<line x1="${hx + 4}" y1="${hy + houseH / 2}" x2="${hx + houseW - 4}" y2="${hy + houseH / 2}" stroke="#5C3B2A" stroke-width="1" opacity="0.5"/>`;
          // Small driveway/yard hint
          out += `<rect x="${hx + houseW / 4}" y="${hy + houseH + 1}" width="${houseW / 2}" height="3" fill="#A8C2B0" opacity="0.7"/>`;
        }
      }
    });
    return out;
  },

  /* ---- Persona + form handlers ---- */
  _selectPersona(roleKey) {
    this._state.selectedRole = roleKey;
    this._render();
  },

  _submitSignIn() {
    // Read the email if user edited it (cosmetic)
    const emailEl = document.getElementById('login-email');
    if (emailEl) this._state.email = emailEl.value.trim();
    this._state.stage = '2fa';
    this._render();
  },

  _verify2FA() {
    const role = this._state.selectedRole;
    this._state = null;
    LoginView.completeSignIn(role);
  },

  _backToSignIn() {
    this._state.stage = 'signin';
    this._render();
  },

  /* Re-render in place by replacing #app innerHTML */
  _render() {
    const app = document.getElementById('app');
    if (app) app.innerHTML = this.render();
  },

  /* ---- Code input helpers ---- */
  _codeInput(input, idx) {
    if (input.value.length === 1) {
      const next = document.getElementById(`login-2fa-${idx + 1}`);
      if (next) next.focus();
    }
  },
  _codeKey(e, idx) {
    if (e.key === 'Enter') this._verify2FA();
    if (e.key === 'Backspace' && e.target.value === '') {
      const prev = document.getElementById(`login-2fa-${idx - 1}`);
      if (prev) { prev.focus(); prev.value = ''; }
    }
  },

  /* ---- Sign-in completion (mirrors the old RoleSelectView.selectRole) ---- */
  completeSignIn(role) {
    State.setRole(role);

    // Investor prospect bypasses the wizard entirely
    if (role === 'investor_prospect') {
      const path = State.getViewMode() === 'mobile' ? '/m/prospect' : '/prospect';
      Router.navigate(path, { replace: true });
      return;
    }

    // Scenario 14 stress-test: skip the standard onboarding and land on profile
    if (role === 'scenario14') {
      const user = State.getCurrentUser();
      if (user) State.updateUser(user.id, { onboardingStatus: 'active' });
      Router.navigate('/profile', { replace: true });
      return;
    }

    // Reset demo user's credentials only if they had previously finished the wizard.
    // Mid-wizard state (status='invited' with onboardingProgress saved) is preserved
    // so the user lands on the step they signed out during.
    const user = State.getCurrentUser();
    if (user && user.onboardingStatus === 'active') {
      State.updateUser(user.id, {
        onboardingStatus: 'invited',
        kyc: { status: 'not_started', vendor: null, referenceId: null, verifiedAt: null },
        nmlsLink: { status: 'not_linked', nmlsId: user.nmlsId || user.agentNmlsId || null, linkedAt: null, authorizedBranchNmlsIds: [], licensedStates: [] },
        onboardingProgress: { step: 0, maxStep: 0 },
      });
    }

    if (State.getViewMode() === 'mobile') {
      Router.navigate('/m/home', { replace: true });
      return;
    }

    OnboardingFlowView.open(role);
  },
};
