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
      { path: '/originations',      label: 'Originations' },
      { path: '/data/batches',      label: 'Batches' },
      { path: '/data/activations',  label: 'Activations' },
    ],
    operator:   [
      { path: '/data/analytics',    label: 'Dashboard' },
      { path: '/data/applications', label: 'Applications' },
      { path: '/originations',      label: 'Originations' },
      { path: '/data/batches',      label: 'Batches' },
      { path: '/data/activations',  label: 'Activations' },
    ],
    prog_admin: [
      { path: '/data/analytics',    label: 'Dashboard' },
      { path: '/data/applications', label: 'Applications' },
    ],
    lo: [
      { path: '/data/applications', label: 'Applications' },
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
    investor_prospect: [
      { path: '/prospect',          label: 'Dashboard' },
    ],
  };

  /* Notification data */
  const DEMO_NOTIFICATIONS = [
    { type: 'action',   loanId: 'DCDC000001', borrowerName: 'Evelyn & Marcus Ross',   msg: 'Appraisal report due Apr 10 — upload required',             time: '2h ago' },
    { type: 'action',   loanId: 'DCDC000002', borrowerName: 'Carolyn Dupree',         msg: 'Rate lock expires Apr 12 — borrower action needed',         time: '4h ago' },
    { type: 'sent',     loanId: 'DCDC000003', borrowerName: 'Terrence & Faith Hill',  msg: 'Closing Disclosure sent — awaiting borrower signature',     time: '1d ago' },
    { type: 'sent',     loanId: 'DCDC000001', borrowerName: 'Evelyn & Marcus Ross',   msg: 'Loan Estimate sent to borrower — awaiting acknowledgement', time: '1d ago' },
    { type: 'complete', loanId: 'DCDC000004', borrowerName: 'Naomi Jefferson',        msg: 'Borrower documents approved — ready for final review',      time: '2d ago' },
    { type: 'info',     loanId: null,          borrowerName: null,                    msg: 'BATCH-2026-001 advanced to Pending Issuance',               time: '3d ago' },
    { type: 'complete', loanId: 'DCDC000002', borrowerName: 'Carolyn Dupree',         msg: 'Title commitment received and verified',                    time: '3d ago' },
  ];

  /* Administration dropdown items per role */
  const ADMIN_ITEMS = {
    sys_admin:  [
      { path: '/dashboard',             label: 'Administration Dashboard' },
      { path: '/origination-companies', label: 'Origination Companies' },
      { path: '/investors',             label: 'Investors & Funds' },
      { path: '/platform',              label: 'Platform Operations' },
      { path: '/system-config',         label: 'System Configuration' },
    ],
    operator:   [
      { path: '/dashboard',             label: 'Administration Dashboard' },
      { path: '/origination-companies', label: 'Origination Companies' },
      { path: '/investors',             label: 'Investors & Funds' },
      { path: '/platform',              label: 'Platform Operations' },
      { path: '/system-config',         label: 'System Configuration' },
    ],
    prog_admin: [
      { path: '/origination-companies', label: 'My Company' },
    ],
    lo: [], lp: [], investor: [], investor_prospect: [],
  };

  const ADMIN_PATHS = ['/admin-dashboard', '/dashboard', '/origination-companies', '/investors', '/platform', '/system-config'];

  const ROLE_META = {
    sys_admin:  { label: 'System Admin' },
    operator:   { label: 'Platform Operator' },
    prog_admin: { label: 'Program Admin' },
    lo:         { label: 'Loan Officer' },
    lp:         { label: 'Loan Processor' },
    investor:   { label: 'Investor' },
    investor_prospect: { label: 'Investor Prospect' },
  };

  function _notifForRole(role) {
    if (role === 'lo' || role === 'lp') {
      const user = State.getCurrentUser();
      const myLoans = user ? State.getLoansByLO(user.id).map(l => l.id) : [];
      return DEMO_NOTIFICATIONS.filter(n => !n.loanId || myLoans.includes(n.loanId));
    }
    return DEMO_NOTIFICATIONS;
  }

  function _notifCount(role) {
    return _notifForRole(role).filter(n => n.type === 'action').length;
  }

  function _renderNotifications(role) {
    const notifs = _notifForRole(role);
    if (!notifs.length) return '<div style="padding:24px;text-align:center;color:var(--color-text-muted);font-size:13px">No notifications</div>';

    const DOT = { action: 'notif-dot-action', sent: 'notif-dot-sent', complete: 'notif-dot-complete', info: 'notif-dot-info' };
    const LABEL = { action: 'Action Required', sent: 'Sent', complete: 'Completed', info: 'Update' };
    const TAG = { action: 'notif-tag-action', sent: 'notif-tag-sent', complete: 'notif-tag-complete', info: 'notif-tag-info' };

    return notifs.map(n => `
      <div class="notif-item ${n.loanId ? 'notif-item-clickable' : ''}"
           ${n.loanId ? `onclick="event.stopPropagation();Nav._openNotifLoan('${n.loanId}')"` : ''}>
        <span class="notif-dot ${DOT[n.type] || 'notif-dot-info'}"></span>
        <div class="notif-item-body">
          ${n.loanId ? `<div class="notif-loan-id">${n.loanId}${n.borrowerName ? ' &middot; ' + n.borrowerName : ''}</div>` : ''}
          <div class="notif-item-msg">${n.msg}</div>
          <div class="notif-item-meta">
            <span class="notif-tag ${TAG[n.type]}">${LABEL[n.type]}</span>
            <span class="notif-time">${n.time}</span>
          </div>
        </div>
      </div>`).join('');
  }

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
          ${role === 'investor_prospect' ? '' : `<div class="topnav-notif" id="topnav-notif" onclick="Nav.toggleNotifications(event)">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 1.5a5.5 5.5 0 0 1 5.5 5.5c0 3 1 4 1.5 5H2c.5-1 1.5-2 1.5-5A5.5 5.5 0 0 1 9 1.5z"/>
              <path d="M7 15.5a2 2 0 0 0 4 0"/>
            </svg>
            <span class="notif-badge" id="notif-badge">${_notifCount(role)}</span>
            <div class="notif-panel" id="notif-panel">
              <div class="notif-panel-header">
                <span>Notifications</span>
                <span style="font-size:11px;color:var(--color-text-muted)">${_notifCount(role)} unread</span>
              </div>
              ${_renderNotifications(role)}
            </div>
          </div>`}
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

    toggleNotifications(e) {
      if (e) e.stopPropagation();
      const panel = document.getElementById('notif-panel');
      if (panel) panel.classList.toggle('open');
      const close = (ev) => {
        if (!document.getElementById('topnav-notif')?.contains(ev.target)) {
          document.getElementById('notif-panel')?.classList.remove('open');
          document.removeEventListener('click', close);
        }
      };
      document.addEventListener('click', close);
    },

    _openNotifLoan(loanId) {
      document.getElementById('notif-panel')?.classList.remove('open');
      DataPlatformView._selectedApplicationId = loanId;
      DataPlatformView._activeTab = 'applications';
      Router.navigate('/data/applications');
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
