/* ============================================================
   HOMIUM ORIGINATOR FLOW — Sidebar Nav
   Role-aware navigation component
   ============================================================ */

const Nav = (() => {

  /* Nav config per role */
  const NAV_CONFIG = {
    sys_admin: [
      { section: 'Platform' },
      { path: '/dashboard',   label: 'Dashboard',      icon: '⬛' },
      { path: '/companies',   label: 'Organizations',  icon: '🏢' },
      { path: '/branches',    label: 'Branches',       icon: '📍' },
      { path: '/users',       label: 'Users',          icon: '👥' },
      { section: 'Configuration' },
      { path: '/permissions', label: 'Permissions',    icon: '🔐' },
      { path: '/onboarding',  label: 'Onboarding',     icon: '🚀', badge: () => State.getUsers().filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus)).length || null },
    ],
    operator: [
      { section: 'Platform' },
      { path: '/dashboard',   label: 'Dashboard',      icon: '⬛' },
      { path: '/companies',   label: 'Organizations',  icon: '🏢' },
      { path: '/branches',    label: 'Branches',       icon: '📍' },
      { path: '/users',       label: 'Users',          icon: '👥' },
      { section: 'Tools' },
      { path: '/onboarding',  label: 'Onboarding',     icon: '🚀', badge: () => State.getUsers().filter(u => ['invited','email_verified','2fa_complete','verification_pending'].includes(u.onboardingStatus)).length || null },
    ],
    prog_admin: [
      { section: 'My Company' },
      { path: '/dashboard',   label: 'Dashboard',      icon: '⬛' },
      { path: '/branches',    label: 'Branches',       icon: '📍' },
      { path: '/users',       label: 'Users',          icon: '👥', badge: () => { const u = State.getCurrentUser(); if (!u) return null; const pending = State.getUsersByCompany(u.companyId).filter(x => ['invited','email_verified','2fa_complete','verification_pending'].includes(x.onboardingStatus)).length; return pending || null; } },
      { section: 'Account' },
      { path: '/profile',     label: 'My Profile',     icon: '👤' },
    ],
    lo: [
      { section: 'My Work' },
      { path: '/dashboard',   label: 'Dashboard',      icon: '⬛' },
      { path: '/originations',label: 'My Originations',icon: '📄' },
      { section: 'Account' },
      { path: '/profile',     label: 'My Profile',     icon: '👤' },
    ],
    lp: [
      { section: 'My Work' },
      { path: '/dashboard',   label: 'Dashboard',      icon: '⬛' },
      { path: '/originations',label: 'Applications',   icon: '📄' },
      { section: 'Account' },
      { path: '/profile',     label: 'My Profile',     icon: '👤' },
    ],
    investor: [
      { section: 'Portfolio' },
      { path: '/dashboard',   label: 'Dashboard',      icon: '⬛' },
      { path: '/profile',     label: 'My Profile',     icon: '👤' },
      { section: 'Onboarding' },
      { path: '/onboarding',  label: 'KYC Status',     icon: '✅' },
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
