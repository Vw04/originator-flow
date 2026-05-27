/* ============================================================
   MOBILE PROFILE — Read-only profile + switch/exit actions
   ============================================================ */

const MobileProfileView = {

  /* 2026-05-27 canon: one style for all avatars (teal-50 bg, teal-500 text).
     Map kept for callsite stability; every role resolves to the canon token. */
  _AVATAR_COLORS: {
    sys_admin: 'var(--h-teal-50)', operator: 'var(--h-teal-50)', prog_admin: 'var(--h-teal-50)',
    lo: 'var(--h-teal-50)', lp: 'var(--h-teal-50)', investor: 'var(--h-teal-50)',
  },

  render() {
    const user = State.getCurrentUser();
    const role = State.getRole();
    if (!user) return '<div class="m-empty-state">No user selected</div>';

    const initials = Display.initials(user);
    const name = Display.fullName(user);
    const roleLabel = Display.roleName(role);
    const bgColor = this._AVATAR_COLORS[role] || 'var(--h-teal-50)';

    const co = user.companyId ? State.getCompany(user.companyId) : null;
    const br = user.branchId ? State.getBranch(user.branchId) : null;

    return `
      <div class="m-page-header">
        <div class="m-page-header-left">
          <div class="m-page-title">Profile</div>
        </div>
      </div>

      <div class="m-profile-hero">
        <div class="m-profile-avatar" style="background:${bgColor}">${initials}</div>
        <div class="m-profile-name">${name}</div>
        <div class="m-profile-role">${roleLabel}</div>
      </div>

      <div class="m-info-card">
        <div class="m-info-row">
          <span class="m-info-label">Email</span>
          <span class="m-info-value">${user.email}</span>
        </div>
        ${user.phone ? `
          <div class="m-info-row">
            <span class="m-info-label">Phone</span>
            <span class="m-info-value">${user.phone}</span>
          </div>
        ` : ''}
        ${user.nmlsId ? `
          <div class="m-info-row">
            <span class="m-info-label">NMLS ID</span>
            <span class="m-info-value">${user.nmlsId}</span>
          </div>
        ` : ''}
        ${user.title ? `
          <div class="m-info-row">
            <span class="m-info-label">Title</span>
            <span class="m-info-value">${user.title}</span>
          </div>
        ` : ''}
      </div>

      ${co || br ? `
        <div class="m-info-card">
          ${co ? `
            <div class="m-info-row">
              <span class="m-info-label">Company</span>
              <span class="m-info-value">${co.name}</span>
            </div>
          ` : ''}
          ${br ? `
            <div class="m-info-row">
              <span class="m-info-label">Branch</span>
              <span class="m-info-value">${br.name}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div class="m-info-card">
        <div class="m-info-row">
          <span class="m-info-label">Status</span>
          <span class="m-info-value">
            <span class="status-badge status-${user.onboardingStatus === 'active' ? 'success' : 'warning'}" style="font-size:10px;padding:2px 7px">
              ${user.onboardingStatus === 'active' ? 'Active' : user.onboardingStatus.replace(/_/g, ' ')}
            </span>
          </span>
        </div>
        ${user.lastLogin ? `
          <div class="m-info-row">
            <span class="m-info-label">Last Login</span>
            <span class="m-info-value">${user.lastLogin}</span>
          </div>
        ` : ''}
      </div>

      <div class="m-profile-actions">
        <button class="m-btn m-btn-primary" onclick="MobileProfileView.switchRole()">Switch Role</button>
        <button class="m-btn m-btn-secondary" onclick="MobileProfileView.backToDesktop()">Back to Desktop</button>
      </div>
    `;
  },

  switchRole() {
    State.setRole(null);
    State.setViewMode('mobile');
    Router.navigate('/', { replace: true });
    App.renderRole();
  },

  backToDesktop() {
    State.setRole(null);
    State.setViewMode('desktop');
    Router.navigate('/', { replace: true });
    App.renderRole();
  },
};
