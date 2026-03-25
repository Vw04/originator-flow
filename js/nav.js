/* ============================================================
   HOMIUM ORIGINATOR FLOW — Sidebar Nav
   Role-aware navigation component
   ============================================================ */

const Nav = (() => {

  /* SVG icon strings (16×16, currentColor stroke) */
  const ICONS = {
    dashboard:    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>`,
    building:     `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="12" rx="1"/><path d="M5 15V10h6v5"/><path d="M5 6h1M10 6h1M5 9h1M10 9h1"/></svg>`,
    mapPin:       `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1C5.24 1 3 3.24 3 6c0 4 5 9 5 9s5-5 5-9c0-2.76-2.24-5-5-5z"/><circle cx="8" cy="6" r="1.5"/></svg>`,
    users:        `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5"/><circle cx="12" cy="5" r="2"/><path d="M15 13.5c0-2-1.34-3.7-3.2-4.3"/></svg>`,
    lock:         `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="8" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/><circle cx="8" cy="11" r="1"/></svg>`,
    arrowCircle:  `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="7"/><path d="M5.5 8h5M8 5.5 10.5 8 8 10.5"/></svg>`,
    userCircle:   `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="7"/><circle cx="8" cy="6.5" r="2.5"/><path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/></svg>`,
    document:     `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2h7l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M10 2v3h3"/><path d="M5 8h6M5 11h4"/></svg>`,
    checkCircle:  `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="7"/><path d="M5 8l2.5 2.5 4-4"/></svg>`,
  };

  /* Nav config per role */
  const NAV_CONFIG = {
    sys_admin: [
      { section: 'Platform' },
      { path: '/dashboard',   label: 'Dashboard',      icon: ICONS.dashboard },
      { path: '/companies',   label: 'Organizations',  icon: ICONS.building },
      { path: '/branches',    label: 'Branches',       icon: ICONS.mapPin },
      { path: '/users',       label: 'Users',          icon: ICONS.users },
      { section: 'Configuration' },
      { path: '/permissions', label: 'Permissions',    icon: ICONS.lock },
      { path: '/onboarding',  label: 'Onboarding',     icon: ICONS.arrowCircle, badge: () => State.getUsers().filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus)).length || null },
    ],
    operator: [
      { section: 'Platform' },
      { path: '/dashboard',   label: 'Dashboard',      icon: ICONS.dashboard },
      { path: '/companies',   label: 'Organizations',  icon: ICONS.building },
      { path: '/branches',    label: 'Branches',       icon: ICONS.mapPin },
      { path: '/users',       label: 'Users',          icon: ICONS.users },
      { section: 'Tools' },
      { path: '/onboarding',  label: 'Onboarding',     icon: ICONS.arrowCircle, badge: () => State.getUsers().filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus)).length || null },
    ],
    prog_admin: [
      { section: 'My Company' },
      { path: '/dashboard',   label: 'Dashboard',      icon: ICONS.dashboard },
      { path: '/branches',    label: 'Branches',       icon: ICONS.mapPin },
      { path: '/users',       label: 'Users',          icon: ICONS.users, badge: () => { const u = State.getCurrentUser(); if (!u) return null; const pending = State.getUsersByCompany(u.companyId).filter(x => ['invited','email_verified','2fa_complete','verification_pending'].includes(x.onboardingStatus)).length; return pending || null; } },
      { section: 'Account' },
      { path: '/profile',     label: 'My Profile',     icon: ICONS.userCircle },
    ],
    lo: [
      { section: 'My Work' },
      { path: '/dashboard',   label: 'Dashboard',      icon: ICONS.dashboard },
      { path: '/originations',label: 'My Originations',icon: ICONS.document },
      { section: 'Account' },
      { path: '/profile',     label: 'My Profile',     icon: ICONS.userCircle },
    ],
    lp: [
      { section: 'My Work' },
      { path: '/dashboard',   label: 'Dashboard',      icon: ICONS.dashboard },
      { path: '/originations',label: 'Applications',   icon: ICONS.document },
      { section: 'Account' },
      { path: '/profile',     label: 'My Profile',     icon: ICONS.userCircle },
    ],
    investor: [
      { section: 'Portfolio' },
      { path: '/dashboard',   label: 'Dashboard',      icon: ICONS.dashboard },
      { path: '/profile',     label: 'My Profile',     icon: ICONS.userCircle },
      { section: 'Onboarding' },
      { path: '/onboarding',  label: 'KYC Status',     icon: ICONS.checkCircle },
    ],
  };

  const ROLE_META = {
    sys_admin:  { label: 'Homium System Admin',     color: '#3730A3' },
    operator:   { label: 'Platform Operator',       color: '#BE123C' },
    prog_admin: { label: 'Program Administrator',   color: '#15803D' },
    lo:         { label: 'Loan Officer',            color: '#1D4ED8' },
    lp:         { label: 'Loan Processor',          color: '#854D0E' },
    investor:   { label: 'Investor',                color: '#7C3AED' },
  };

  function render() {
    const role = State.getRole();
    const user = State.getCurrentUser();
    if (!role) return '';

    const items = NAV_CONFIG[role] || [];
    const meta  = ROLE_META[role] || {};

    const navItems = items.map(item => {
      if (item.section) {
        return `<div class="nav-section-label">${item.section}</div>`;
      }
      const badgeCount = item.badge ? item.badge() : null;
      const badge = badgeCount ? `<span class="nav-badge">${badgeCount}</span>` : '';
      return `
        <div class="nav-item" data-path="${item.path}" onclick="Router.navigate('${item.path}')">
          <span class="nav-icon">${item.icon}</span>
          <span>${item.label}</span>
          ${badge}
        </div>`;
    }).join('');

    const initials = user ? Display.initials(user) : 'HM';
    const userName  = user ? Display.fullName(user) : 'Demo User';
    const userEmail = user ? user.email : '';

    return `
      <aside class="sidebar">
        <div class="sidebar-logo">
          <img src="assets/branding/HomiumLogo_0721_Wordmark (Blue).png" alt="Homium" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
          <span class="sidebar-logo-text" style="display:none">Homium</span>
        </div>
        <div class="sidebar-role-badge">
          <div class="role-label">Logged in as</div>
          <div class="role-name">${meta.label || role}</div>
        </div>
        <nav class="sidebar-nav">${navItems}</nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-avatar">${initials}</div>
            <div class="sidebar-user-info">
              <div class="user-name">${userName}</div>
              <div class="user-email">${userEmail}</div>
            </div>
          </div>
          <button class="btn-switch-role" onclick="App.switchRole()">Switch Role</button>
        </div>
      </aside>`;
  }

  return {
    render,

    setActive(path) {
      document.querySelectorAll('.nav-item').forEach(el => {
        const elPath = el.dataset.path;
        el.classList.toggle('active', path.startsWith(elPath) && elPath !== '/');
      });
    },

    refresh() {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.outerHTML = render();
        // Re-attach active state
        Nav.setActive(Router.getCurrentPath() || '/dashboard');
      }
    },
  };
})();
