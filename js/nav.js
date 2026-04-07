/* ============================================================
   HOMIUM ORIGINATOR FLOW — Top Nav
   Unified LOP nav with Administration dropdown for admin roles
   ============================================================ */

const Nav = (() => {

  /* LOP tabs per role */
  const LOP_TABS = {
    sys_admin:  [
      { path: '/data/analytics',    label: 'Dashboard' },
      { path: '/data/applications', label: 'Applications' },
      { path: '/data/originations', label: 'Originations' },
      { path: '/data/batches',      label: 'Batches' },
      { path: '/data/activations',  label: 'Activations' },
    ],
    operator:   [
      { path: '/data/analytics',    label: 'Dashboard' },
      { path: '/data/applications', label: 'Applications' },
      { path: '/data/originations', label: 'Originations' },
      { path: '/data/batches',      label: 'Batches' },
      { path: '/data/activations',  label: 'Activations' },
    ],
    prog_admin: [
      { path: '/data/analytics',    label: 'Dashboard' },
      { path: '/data/applications', label: 'Applications' },
      { path: '/data/originations', label: 'Originations' },
    ],
    lo: [
      { path: '/data/applications', label: 'Applications' },
      { path: '/originations',      label: 'My Originations' },
      { path: '/profile',           label: 'My Profile' },
    ],
    lp: [
      { path: '/data/applications', label: 'Applications' },
      { path: '/profile',           label: 'My Profile' },
    ],
    investor: [
      { path: '/data/analytics',    label: 'Dashboard' },
      { path: '/profile',           label: 'My Profile' },
    ],
  };

  /* Administration dropdown items per role */
  const ADMIN_ITEMS = {
    sys_admin:  [
      { path: '/origination-companies', label: 'Origination Companies' },
      { path: '/investors',             label: 'Investors & Funds' },
      { path: '/platform',              label: 'Platform Operations' },
      { path: '/system-config',         label: 'System Configuration' },
    ],
    operator:   [
      { path: '/origination-companies', label: 'Origination Companies' },
      { path: '/investors',             label: 'Investors & Funds' },
      { path: '/platform',              label: 'Platform Operations' },
      { path: '/system-config',         label: 'System Configuration' },
    ],
    prog_admin: [
      { path: '/origination-companies', label: 'My Company' },
    ],
    lo: [], lp: [], investor: [],
  };

  const ADMIN_PATHS = ['/dashboard', '/origination-companies', '/investors', '/platform', '/system-config'];

  const ROLE_META = {
    sys_admin:  { label: 'System Admin' },
    operator:   { label: 'Platform Operator' },
    prog_admin: { label: 'Program Admin' },
    lo:         { label: 'Loan Officer' },
    lp:         { label: 'Loan Processor' },
    investor:   { label: 'Investor' },
  };

  function render() {
    const role = State.getRole();
    const user = State.getCurrentUser();
    if (!role) return '';

    const currentPath = Router.getCurrentPath() || '/data/analytics';
    const tabs        = LOP_TABS[role] || [];
    const adminItems  = ADMIN_ITEMS[role] || [];
    const meta        = ROLE_META[role] || {};
    const isOnAdmin   = ADMIN_PATHS.some(p => currentPath === p || currentPath.startsWith(p + '/'));

    const navLinks = tabs.map(item => {
      const isActive = currentPath === item.path ||
        (item.path !== '/data/analytics' && item.path !== '/profile' && currentPath.startsWith(item.path));
      return `<span class="topnav-link ${isActive ? 'active' : ''}"
                    data-path="${item.path}"
                    onclick="Nav._goLOP('${item.path}')">${item.label}</span>`;
    }).join('');

    const adminDropdown = adminItems.length ? `
      <div class="admin-nav-wrap" id="admin-nav-wrap">
        <button class="topnav-link admin-nav-btn ${isOnAdmin ? 'active' : ''}"
                onclick="Nav.toggleAdminDropdown(event)">
          Administration
          <svg class="admin-nav-caret" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M2 3.5l3 3 3-3"/>
          </svg>
        </button>
        <div class="admin-nav-menu" id="admin-nav-menu">
          ${adminItems.map(item => `
            <div class="admin-nav-item ${currentPath === item.path || currentPath.startsWith(item.path + '/') ? 'active' : ''}"
                 onclick="Nav.goAdmin('${item.path}')">
              ${item.label}
            </div>`).join('')}
        </div>
      </div>` : '';

    const initials = user ? Display.initials(user) : 'HM';
    const userName  = user ? Display.fullName(user) : 'Demo User';

    return `
      <nav class="topnav">
        <div class="topnav-left">
          <div class="topnav-logo">
            <img src="assets/branding/HomiumLogo_0721_Wordmark (Blue).png" alt="Homium"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
            <span class="topnav-logo-text" style="display:none">Homium</span>
          </div>
        </div>
        <div class="topnav-links">
          ${navLinks}
          ${adminDropdown}
        </div>
        <div class="topnav-right">
          <div class="topnav-user-info">
            <div class="topnav-user-name">${userName}</div>
            <div class="topnav-role-label">${meta.label || role}</div>
          </div>
          <div class="topnav-profile" id="topnav-profile" onclick="Nav.toggleProfileMenu(event)">
            <div class="topnav-avatar" style="background:${avatarColor(role)}">${initials}</div>
            <div class="profile-dropdown" id="profile-dropdown">
              <div class="profile-dropdown-header">
                <div class="topnav-avatar" style="background:${avatarColor(role)};width:36px;height:36px;font-size:13px">${initials}</div>
                <div>
                  <div style="font-weight:600;font-size:13px;color:var(--color-text)">${userName}</div>
                  <div style="font-size:11px;color:var(--color-text-muted);margin-top:1px">${meta.label || role}</div>
                </div>
              </div>
              <div class="profile-dropdown-divider"></div>
              <div class="profile-dropdown-item" onclick="event.stopPropagation();Router.navigate('/profile')">My Profile</div>
              <div class="profile-dropdown-item" onclick="event.stopPropagation();App.switchRole()">Switch Role</div>
              <div class="profile-dropdown-divider"></div>
              <div class="profile-dropdown-item" onclick="event.stopPropagation()">Contact Support</div>
              <div class="profile-dropdown-item profile-dropdown-item-danger" onclick="event.stopPropagation();App.switchRole()">Log Out</div>
            </div>
          </div>
        </div>
      </nav>`;
  }

  return {
    render,

    setActive(path) {
      document.querySelectorAll('.topnav-link[data-path]').forEach(el => {
        const elPath = el.dataset.path;
        const isActive = path === elPath ||
          (elPath !== '/' && elPath !== '/data/analytics' && elPath !== '/profile' && path.startsWith(elPath));
        el.classList.toggle('active', isActive);
      });
      const adminBtn = document.querySelector('.admin-nav-btn');
      if (adminBtn) {
        const onAdmin = ADMIN_PATHS.some(p => path === p || path.startsWith(p + '/'));
        adminBtn.classList.toggle('active', onAdmin);
      }
    },

    refresh() {
      const nav = document.querySelector('.topnav');
      if (nav) nav.outerHTML = render();
    },

    _goLOP(path) {
      State.setMode('data');
      Router.navigate(path);
    },

    goAdmin(path) {
      State.setMode('admin');
      document.getElementById('admin-nav-menu')?.classList.remove('open');
      Router.navigate(path);
    },

    toggleAdminDropdown(e) {
      if (e) e.stopPropagation();
      const menu = document.getElementById('admin-nav-menu');
      if (menu) menu.classList.toggle('open');
      const close = (ev) => {
        if (!document.getElementById('admin-nav-wrap')?.contains(ev.target)) {
          document.getElementById('admin-nav-menu')?.classList.remove('open');
          document.removeEventListener('click', close);
        }
      };
      document.addEventListener('click', close);
    },

    toggleProfileMenu(e) {
      if (e) e.stopPropagation();
      const dropdown = document.getElementById('profile-dropdown');
      if (dropdown) dropdown.classList.toggle('open');
      const close = (ev) => {
        if (!document.getElementById('topnav-profile')?.contains(ev.target)) {
          document.getElementById('profile-dropdown')?.classList.remove('open');
          document.removeEventListener('click', close);
        }
      };
      document.addEventListener('click', close);
    },

    // Legacy compat
    setMode(mode) {
      State.setMode(mode);
      const defaultPath = mode === 'admin' ? '/origination-companies' : '/data/analytics';
      this.refresh();
      Router.navigate(defaultPath);
    },
  };
})();
