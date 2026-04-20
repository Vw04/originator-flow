/* ============================================================
   HOMIUM ORIGINATOR FLOW — Mobile Bottom Nav
   ============================================================ */

const MobileNav = (() => {

  const ICONS = {
    home: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5L10 2l7 5.5V16a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16V7.5z"/><path d="M7.5 17.5V10h5v7.5"/></svg>',
    building: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2" width="14" height="16" rx="1.5"/><path d="M7 6h2M11 6h2M7 10h2M11 10h2M7 14h2M11 14h2"/></svg>',
    file: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2H5.5A1.5 1.5 0 0 0 4 3.5v13A1.5 1.5 0 0 0 5.5 18h9a1.5 1.5 0 0 0 1.5-1.5V7L11 2z"/><path d="M11 2v5h5"/></svg>',
    bell: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2a6 6 0 0 1 6 6c0 3.3 1.1 4.4 1.6 5.5H2.4C3 12.4 4 11.3 4 8a6 6 0 0 1 6-6z"/><path d="M7.5 16.5a2.5 2.5 0 0 0 5 0"/></svg>',
    user: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="7" r="3.5"/><path d="M3.5 17.5c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6"/></svg>',
    heart: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17.5S2.5 13 2.5 7.5C2.5 4.46 4.96 2 8 2c1.66 0 3.14.74 4.14 1.91a5.33 5.33 0 0 1 2.36-.91c2.5 0 5 2.46 5 5.5C19.5 13 10 17.5 10 17.5z"/></svg>',
    chart: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 17H3V3"/><path d="M15 6l-4 5-3-2-5 5"/></svg>',
  };

  const TABS = {
    sys_admin: [
      { path: '/m/home',          label: 'Home',      icon: 'home' },
      { path: '/m/loans',         label: 'Loans',     icon: 'file' },
      { path: '/m/notifications', label: 'Alerts',    icon: 'bell', badge: true },
      { path: '/m/profile',       label: 'Profile',   icon: 'user' },
    ],
    operator: [
      { path: '/m/home',          label: 'Home',      icon: 'home' },
      { path: '/m/loans',         label: 'Loans',     icon: 'file' },
      { path: '/m/notifications', label: 'Alerts',    icon: 'bell', badge: true },
      { path: '/m/profile',       label: 'Profile',   icon: 'user' },
    ],
    prog_admin: [
      { path: '/m/home',          label: 'Home',      icon: 'home' },
      { path: '/m/loans',         label: 'My Loans',  icon: 'file' },
      { path: '/m/notifications', label: 'Alerts',    icon: 'bell', badge: true },
      { path: '/m/profile',       label: 'Profile',   icon: 'user' },
    ],
    lo: [
      { path: '/m/home',          label: 'Home',      icon: 'home' },
      { path: '/m/loans',         label: 'My Loans',  icon: 'file' },
      { path: '/m/notifications', label: 'Alerts',    icon: 'bell', badge: true },
      { path: '/m/profile',       label: 'Profile',   icon: 'user' },
    ],
    lp: [
      { path: '/m/home',          label: 'Home',      icon: 'home' },
      { path: '/m/loans',         label: 'My Loans',  icon: 'file' },
      { path: '/m/profile',       label: 'Profile',   icon: 'user' },
    ],
    investor: [
      { path: '/m/home',          label: 'Home',      icon: 'home' },
      { path: '/m/profile',       label: 'Profile',   icon: 'user' },
    ],
    investor_prospect: [
      { path: '/m/prospect',          label: 'Home',    icon: 'home' },
      { path: '/m/prospect/stories',  label: 'Stories', icon: 'heart' },
      { path: '/m/prospect/data',     label: 'Data',    icon: 'chart' },
    ],
  };

  function _getActionCount() {
    const role = State.getRole();
    const user = State.getCurrentUser();
    if (role === 'lo' || role === 'lp') {
      const myLoans = user ? State.getLoansByLO(user.id).map(l => l.id) : [];
      return DEMO_NOTIFICATIONS.filter(n => n.type === 'action' && (!n.loanId || myLoans.includes(n.loanId))).length;
    }
    return DEMO_NOTIFICATIONS.filter(n => n.type === 'action').length;
  }

  /* shared notification data — same as Nav */
  const DEMO_NOTIFICATIONS = [
    { type: 'action',   loanId: 'DCDC000001', borrowerName: 'Evelyn & Marcus Ross',   msg: 'Appraisal report due Apr 10 — upload required',             time: '2h ago' },
    { type: 'action',   loanId: 'DCDC000002', borrowerName: 'Carolyn Dupree',         msg: 'Rate lock expires Apr 12 — borrower action needed',         time: '4h ago' },
    { type: 'sent',     loanId: 'DCDC000003', borrowerName: 'Terrence & Faith Hill',  msg: 'Closing Disclosure sent — awaiting borrower signature',     time: '1d ago' },
    { type: 'sent',     loanId: 'DCDC000001', borrowerName: 'Evelyn & Marcus Ross',   msg: 'Loan Estimate sent to borrower — awaiting acknowledgement', time: '1d ago' },
    { type: 'complete', loanId: 'DCDC000004', borrowerName: 'Naomi Jefferson',        msg: 'Borrower documents approved — ready for final review',      time: '2d ago' },
    { type: 'info',     loanId: null,          borrowerName: null,                    msg: 'BATCH-2026-001 advanced to Pending Issuance',               time: '3d ago' },
    { type: 'complete', loanId: 'DCDC000002', borrowerName: 'Carolyn Dupree',         msg: 'Title commitment received and verified',                    time: '3d ago' },
  ];

  function render() {
    const role = State.getRole();
    const tabs = TABS[role] || TABS.lo;
    const currentPath = Router.getCurrentPath() || '/m/home';
    const badgeCount = _getActionCount();

    const tabsHtml = tabs.map(tab => {
      const isActive = currentPath === tab.path;
      const badge = tab.badge && badgeCount > 0
        ? '<span class="mobile-nav-badge"></span>'
        : '';

      return `
        <button class="mobile-nav-tab${isActive ? ' active' : ''}"
                data-path="${tab.path}"
                onclick="Router.navigate('${tab.path}')">
          <div class="mobile-nav-icon-wrap">
            <div class="mobile-nav-icon-bg">${ICONS[tab.icon]}</div>
            ${badge}
          </div>
          <span class="mobile-nav-label">${tab.label}</span>
        </button>`;
    }).join('');

    return `
      <nav class="mobile-bottom-nav">
        <div class="mobile-nav-track">${tabsHtml}</div>
      </nav>`;
  }

  function setActive(path) {
    document.querySelectorAll('.mobile-nav-tab').forEach(btn => {
      const tabPath = btn.getAttribute('data-path');
      const isActive = tabPath === path;
      btn.classList.toggle('active', isActive);
    });
  }

  return { render, setActive, DEMO_NOTIFICATIONS };
})();
