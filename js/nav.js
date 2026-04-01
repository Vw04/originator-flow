/* ============================================================
   HOMIUM ORIGINATOR FLOW — Top Nav
   Role-aware horizontal navigation component
   ============================================================ */

const Nav = (() => {

  /* Nav config per role split by mode */
  const NAV_CONFIG = {
    sys_admin: {
      admin: [
        { path: '/dashboard',               label: 'Dashboard' },
        { path: '/origination-companies',    label: 'Origination Companies' },
        { path: '/investors',                label: 'Investors & Funds' },
        { path: '/platform',                 label: 'Platform Operations' },
        { path: '/system-config',            label: 'System Configuration' },
      ],
      data: [
        { path: '/data/analytics',    label: 'Analytics' },
        { path: '/data/applications', label: 'Applications' },
        { path: '/data/originations', label: 'Originations' },
        { path: '/data/batches',      label: 'Batches' },
        { path: '/data/activations',  label: 'Activations' },
      ],
    },
    operator: {
      admin: [
        { path: '/dashboard',               label: 'Dashboard' },
        { path: '/origination-companies',    label: 'Origination Companies' },
        { path: '/investors',                label: 'Investors & Funds' },
        { path: '/platform',                 label: 'Platform Operations' },
        { path: '/system-config',            label: 'System Configuration' },
      ],
      data: [
        { path: '/data/analytics',    label: 'Analytics' },
        { path: '/data/applications', label: 'Applications' },
        { path: '/data/originations', label: 'Originations' },
        { path: '/data/batches',      label: 'Batches' },
        { path: '/data/activations',  label: 'Activations' },
      ],
    },
    prog_admin: {
      admin: [
        { path: '/dashboard',               label: 'Dashboard' },
        { path: '/origination-companies',    label: 'My Company' },
      ],
      data: [
        { path: '/data/analytics',    label: 'Analytics' },
        { path: '/data/applications', label: 'Applications' },
        { path: '/data/originations', label: 'Originations' },
      ],
    },
    lo: {
      admin: [],
      data: [
        { path: '/data/applications', label: 'Applications' },
        { path: '/originations',      label: 'My Originations' },
        { path: '/profile',           label: 'My Profile' },
      ],
    },
    lp: {
      admin: [],
      data: [
        { path: '/data/applications', label: 'Applications' },
        { path: '/profile',           label: 'My Profile' },
      ],
    },
    investor: {
      admin: [],
      data: [
        { path: '/data/analytics', label: 'Analytics' },
        { path: '/profile',        label: 'My Profile' },
      ],
    },
  };

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

    const mode    = State.getMode();
    const config  = NAV_CONFIG[role] || { admin: [], data: [] };
    const items   = config[mode] || [];
    const meta    = ROLE_META[role] || {};
    const hasBoth = config.admin.length > 0;

    const navLinks = items.map(item =>
      `<span class="topnav-link" data-path="${item.path}" onclick="Router.navigate('${item.path}')">${item.label}</span>`
    ).join('');

    const modeToggle = hasBoth ? `
      <div class="topnav-mode-dropdown" id="topnav-mode-dropdown">
        <button class="mode-dropdown-trigger" onclick="Nav.toggleModeDropdown(event)">
          ${mode === 'admin' ? 'Administration' : 'Loan Origination Platform'}
          <span class="mode-dropdown-caret">▼</span>
        </button>
        <div class="mode-dropdown-menu" id="mode-dropdown-menu">
          <div class="mode-dropdown-item ${mode==='admin'?'active':''}" onclick="Nav.setMode('admin')">Administration</div>
          <div class="mode-dropdown-item ${mode==='data'?'active':''}" onclick="Nav.setMode('data')">Loan Origination Platform</div>
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
          ${modeToggle}
        </div>
        <div class="topnav-links">${navLinks}</div>
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
      document.querySelectorAll('.topnav-link').forEach(el => {
        const elPath = el.dataset.path;
        // Exact match, or prefix match for section drill-downs (e.g. /origination-companies/co-001)
        const isActive = path === elPath || (elPath !== '/' && elPath !== '/dashboard' && path.startsWith(elPath));
        el.classList.toggle('active', isActive);
      });
    },

    refresh() {
      const nav = document.querySelector('.topnav');
      if (nav) {
        nav.outerHTML = render();
        Nav.setActive(Router.getCurrentPath() || '/dashboard');
      }
    },

    toggleModeDropdown(e) {
      if (e) e.stopPropagation();
      const menu = document.getElementById('mode-dropdown-menu');
      if (menu) menu.classList.toggle('open');
      const close = (ev) => {
        if (!document.getElementById('topnav-mode-dropdown')?.contains(ev.target)) {
          document.getElementById('mode-dropdown-menu')?.classList.remove('open');
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

    setMode(mode) {
      State.setMode(mode);
      const defaultPath = mode === 'admin' ? '/dashboard' : '/data/analytics';
      const nav = document.querySelector('.topnav');
      if (nav) nav.outerHTML = render();
      Router.navigate(defaultPath);
    },
  };
})();
