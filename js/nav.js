/* ============================================================
   HOMIUM ORIGINATOR FLOW — Side Nav
   Vertical left-rail nav with icon+label tiles, ADMINISTRATION
   section, bottom-anchored search / notifications / profile.
   ============================================================ */

const Nav = (() => {

  /* Inline SVG icons keyed by route. Stroke inherits via currentColor. */
  const ICONS = {
    // LOP destinations
    '/data/analytics':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7.5" height="7.5" rx="1.4"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.4"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.4"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.4"/></svg>',
    '/data/applications': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6M9 8h2"/></svg>',
    '/originations':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9z"/></svg>',
    '/data/batches':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/></svg>',
    '/data/activations':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
    '/data/portfolio':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/></svg>',
    '/profile':           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
    '/prospect':          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>',

    // Admin destinations
    '/dashboard':              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l5 5"/></svg>',
    '/admin-dashboard':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l5 5"/></svg>',
    '/origination-companies':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M10 10h.01M14 10h.01M10 14h.01M14 14h.01M10 18h.01M14 18h.01"/></svg>',
    '/investors':              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1.4 1.3-2 3-2s3 .8 3 2.2-1.3 2-3 2-3 .6-3 2 1.3 2.3 3 2.3 3-.7 3-2"/></svg>',
    '/user-management':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.8"/><path d="M14.5 20c0-2.5 1.5-4.5 4-4.5s4 2 4 4.5"/></svg>',
    '/system-config':          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',

    // UI affordances
    search:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    bell:          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2a6 6 0 0 1 6 6c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6a6 6 0 0 1 6-6z"/><path d="M9.5 20a2.5 2.5 0 0 0 5 0"/></svg>',
  };

  function _iconFor(path) { return ICONS[path] || ICONS['/profile']; }

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
      { path: '/data/portfolio',    label: 'Portfolio' },
      { path: '/profile',           label: 'My Profile' },
    ],
    investor_prospect: [
      { path: '/prospect',          label: 'Dashboard' },
    ],
  };

  /* Tile labels in the sidebar are tighter than the original menu labels */
  const SHORT_LABELS = {
    '/data/analytics':         'Dashboard',
    '/data/applications':      'Applications',
    '/originations':           'Originations',
    '/data/batches':           'Batches',
    '/data/activations':       'Activations',
    '/data/portfolio':         'Portfolio',
    '/profile':                'My Profile',
    '/prospect':               'Dashboard',
    '/dashboard':              'Admin Dash',
    '/admin-dashboard':        'Admin Dash',
    '/origination-companies':  'Origination Cos',
    '/investors':              'Investors',
    '/user-management':        'User Mgmt',
    '/system-config':          'System Config',
  };
  function _tileLabel(item) { return SHORT_LABELS[item.path] || item.label; }

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

  /* Administration items per role */
  const ADMIN_ITEMS = {
    sys_admin:  [
      { path: '/dashboard',             label: 'Administration Dashboard' },
      { path: '/origination-companies', label: 'Origination Companies' },
      { path: '/investors',             label: 'Investors' },
      { path: '/platform-operator',     label: 'Platform Operator' },
      { path: '/system-config',         label: 'System Configuration' },
      { path: '/user-management',       label: 'User Management' },
    ],
    operator:   [
      { path: '/dashboard',             label: 'Administration Dashboard' },
      { path: '/origination-companies', label: 'Origination Companies' },
      { path: '/investors',             label: 'Investors' },
      { path: '/platform-operator',     label: 'Platform Operator' },
      { path: '/system-config',         label: 'System Configuration' },
    ],
    prog_admin: [
      { path: '/origination-companies', label: 'My Company' },
    ],
    lo: [], lp: [], investor: [], investor_prospect: [],
  };

  const ADMIN_PATHS = ['/admin-dashboard', '/dashboard', '/origination-companies', '/investors', '/platform-operator', '/user-management', '/system-config'];

  const ROLE_META = {
    sys_admin:  { label: 'System Admin' },
    operator:   { label: 'Platform Operator' },
    prog_admin: { label: 'Program Admin' },
    lo:         { label: 'Loan Officer' },
    lp:         { label: 'Loan Processor' },
    investor:   { label: 'Investor' },
    investor_prospect: { label: 'Investor Prospect' },
  };

  function _isActive(itemPath, currentPath) {
    if (currentPath === itemPath) return true;
    // Avoid generic prefixes like '/' or '/profile' false-matching
    if (itemPath === '/data/analytics' || itemPath === '/profile' || itemPath === '/prospect') return false;
    return currentPath.startsWith(itemPath + '/') || currentPath.startsWith(itemPath);
  }

  function _renderTile(item, currentPath, isAdmin) {
    const active = isAdmin
      ? (currentPath === item.path || currentPath.startsWith(item.path + '/'))
      : _isActive(item.path, currentPath);
    const onclick = isAdmin
      ? `Nav.goAdmin('${item.path}')`
      : `Nav._goLOP('${item.path}')`;
    return `
      <div class="sidenav-tile${active ? ' active' : ''}"
           data-path="${item.path}"
           tabindex="0"
           onclick="${onclick}"
           onkeydown="if(event.key==='Enter')${onclick}">
        ${_iconFor(item.path)}
        <span>${_tileLabel(item)}</span>
      </div>`;
  }

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

    const initials  = user ? Display.initials(user) : 'HM';
    const userName  = user ? Display.fullName(user) : 'Demo User';
    const firstName = user?.firstName || userName.split(' ')[0];
    const orgLine   = meta.label || role;

    const lopHtml   = tabs.map(item => _renderTile(item, currentPath, false)).join('');

    // Once-only bindings (Cmd/Ctrl+K palette shortcut)
    setTimeout(_bindGlobalShortcuts, 0);

    return `
      <aside class="sidenav" aria-label="Primary navigation">
        <div class="sidenav-logo">
          <img src="assets/branding/HomiumLogo_0721_Icon (Blue).png" alt="Homium"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
          <span class="sidenav-logo-fallback" style="display:none">H</span>
        </div>

        <div class="sidenav-section">
          <div class="sidenav-search" role="button" tabindex="0"
               onclick="Nav.openSearchPalette()"
               onkeydown="if(event.key==='Enter')Nav.openSearchPalette()"
               aria-label="Search (⌘K)" title="Search loans, borrowers, or addresses — ⌘K">
            ${ICONS.search}
            <span>Search</span>
          </div>
        </div>

        <div class="sidenav-section">${lopHtml}</div>

        ${adminItems.length ? `
          <div class="sidenav-section">
            <div class="sidenav-tile${isOnAdmin ? ' active' : ''}"
                 id="admin-nav-wrap"
                 data-admin="1"
                 tabindex="0"
                 onclick="Nav.toggleAdminDropdown(event)"
                 onkeydown="if(event.key==='Enter')Nav.toggleAdminDropdown(event)"
                 style="position:relative">
              ${ICONS['/system-config']}
              <span>Admin</span>
              <div class="admin-flyout" id="admin-nav-menu">
                <div class="admin-flyout-head">
                  <div class="admin-flyout-eyebrow">System</div>
                  <div class="admin-flyout-title">Administration</div>
                  <div class="admin-flyout-meta">${adminItems.length} area${adminItems.length === 1 ? '' : 's'}</div>
                </div>
                <div class="admin-flyout-list">
                  ${adminItems.map(item => `
                    <div class="admin-flyout-item${(currentPath === item.path || currentPath.startsWith(item.path + '/')) ? ' active' : ''}"
                         onclick="event.stopPropagation();Nav.goAdmin('${item.path}')">
                      <span class="admin-flyout-item-label">${item.label}</span>
                      <span class="admin-flyout-item-caret">›</span>
                    </div>`).join('')}
                </div>
              </div>
            </div>
          </div>` : ''}

        <div class="sidenav-spacer"></div>

        <div class="sidenav-footer">
          ${role === 'investor_prospect' ? '' : `
            <div class="sidenav-icon-btn" id="topnav-notif" onclick="Nav.toggleNotifications(event)"
                 aria-label="Notifications" title="Notifications">
              ${ICONS.bell}
              <span class="notif-badge" id="notif-badge">${_notifCount(role)}</span>
              <div class="notif-panel" id="notif-panel">
                <div class="notif-panel-header">
                  <span>Notifications</span>
                  <span style="font-size:11px;color:var(--color-text-muted)">${_notifCount(role)} unread</span>
                </div>
                ${_renderNotifications(role)}
              </div>
            </div>`}

          <div class="sidenav-profile" id="topnav-profile" onclick="Nav.toggleProfileMenu(event)"
               aria-label="Account menu" title="${userName} — ${orgLine}">
            <div class="sidenav-avatar" style="background:${avatarColor(role)}">${initials}</div>
            <div class="sidenav-avatar-name">${firstName}</div>
            <div class="sidenav-avatar-role">${orgLine}</div>
            <div class="profile-dropdown" id="profile-dropdown">
              <div class="profile-dropdown-header">
                <div class="sidenav-avatar" style="background:${avatarColor(role)};width:36px;height:36px;font-size:13px">${initials}</div>
                <div>
                  <div style="font-weight:600;font-size:13px;color:var(--color-text)">${userName}</div>
                  <div style="font-size:11px;color:var(--color-text-muted);margin-top:1px">${orgLine}</div>
                </div>
              </div>
              <div class="profile-dropdown-divider"></div>
              <div class="profile-dropdown-item" onclick="event.stopPropagation();Router.navigate('/profile')">My Profile</div>
              <div class="profile-dropdown-item" onclick="event.stopPropagation();App.switchRole()">Switch Role</div>
              ${adminItems.length ? `<div class="profile-dropdown-item" onclick="event.stopPropagation();Router.navigate('/system-config')">Settings</div>` : ''}
              <div class="profile-dropdown-divider"></div>
              <div class="profile-dropdown-item" onclick="event.stopPropagation()">Contact Support</div>
              <div class="profile-dropdown-item profile-dropdown-item-danger" onclick="event.stopPropagation();App.switchRole()">Log Out</div>
            </div>
          </div>
        </div>
      </aside>`;
  }

  /* ===== Command palette ===== */

  let _paletteRoot = null;
  let _paletteFocusIdx = 0;
  let _paletteResults = [];
  let _shortcutsBound = false;

  function _bindGlobalShortcuts() {
    if (_shortcutsBound) return;
    _shortcutsBound = true;
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearchPalette();
      }
    });
  }

  function _searchLoans(q) {
    if (!q) return [];
    const ql = q.toLowerCase();
    const loans = typeof State !== 'undefined' && State.getLoans ? State.getLoans() : [];
    const matches = [];
    for (const l of loans) {
      const hay = [l.id, l.borrowerName, l.address].filter(Boolean).join(' ').toLowerCase();
      if (hay.includes(ql)) matches.push(l);
      if (matches.length >= 12) break;
    }
    return matches;
  }

  function _renderPaletteResults() {
    const list = document.getElementById('cmd-palette-results');
    if (!list) return;
    if (!_paletteResults.length) {
      const q = document.getElementById('cmd-palette-input')?.value || '';
      list.innerHTML = q
        ? `<div class="cmd-palette-empty">No matches for "${q.replace(/[<>]/g, '')}"</div>`
        : `<div class="cmd-palette-empty">Start typing a loan ID, borrower name, or address.</div>`;
      return;
    }
    list.innerHTML = `
      <div class="cmd-palette-section">Loans &amp; borrowers</div>
      ${_paletteResults.map((l, i) => `
        <div class="cmd-palette-result${i === _paletteFocusIdx ? ' focused' : ''}"
             data-idx="${i}"
             onclick="Nav._paletteSelect(${i})">
          <div class="cmd-palette-result-primary">${l.borrowerName || '(no borrower)'}</div>
          <div class="cmd-palette-result-secondary">${l.id}${l.address ? ' &middot; ' + l.address : ''}</div>
        </div>`).join('')}`;
  }

  function _onPaletteInput(e) {
    _paletteResults = _searchLoans(e.target.value);
    _paletteFocusIdx = 0;
    _renderPaletteResults();
  }

  function _onPaletteKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); _closePalette(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _paletteFocusIdx = Math.min(_paletteResults.length - 1, _paletteFocusIdx + 1);
      _renderPaletteResults();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _paletteFocusIdx = Math.max(0, _paletteFocusIdx - 1);
      _renderPaletteResults();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (_paletteResults[_paletteFocusIdx]) _selectPaletteResult(_paletteFocusIdx);
    }
  }

  function _selectPaletteResult(idx) {
    const loan = _paletteResults[idx];
    if (!loan) return;
    _closePalette();
    if (typeof DataPlatformView !== 'undefined') {
      DataPlatformView._appSearch = loan.id;
      DataPlatformView._selectedApplicationId = loan.id;
      DataPlatformView._activeTab = 'applications';
    }
    Router.navigate('/data/applications');
  }

  function openSearchPalette() {
    if (_paletteRoot) return;
    _paletteRoot = document.createElement('div');
    _paletteRoot.className = 'cmd-palette-overlay';
    _paletteRoot.onclick = (e) => { if (e.target === _paletteRoot) _closePalette(); };
    _paletteRoot.innerHTML = `
      <div class="cmd-palette" role="dialog" aria-label="Search">
        <div class="cmd-palette-input-wrap">
          ${ICONS.search}
          <input id="cmd-palette-input" class="cmd-palette-input" type="text"
                 placeholder="Search loans, borrowers, or addresses…" autocomplete="off" />
          <kbd class="cmd-palette-kbd">ESC</kbd>
        </div>
        <div id="cmd-palette-results" class="cmd-palette-results"></div>
      </div>`;
    document.body.appendChild(_paletteRoot);
    const input = document.getElementById('cmd-palette-input');
    input.addEventListener('input', _onPaletteInput);
    input.addEventListener('keydown', _onPaletteKey);
    _paletteResults = [];
    _paletteFocusIdx = 0;
    _renderPaletteResults();
    setTimeout(() => input.focus(), 0);
  }

  function _closePalette() {
    if (!_paletteRoot) return;
    _paletteRoot.remove();
    _paletteRoot = null;
    _paletteResults = [];
    _paletteFocusIdx = 0;
  }

  /* ===== Public API ===== */

  return {
    render,

    setActive(path) {
      document.querySelectorAll('.sidenav-tile[data-path]').forEach(el => {
        const elPath = el.dataset.path;
        let isActive = path === elPath;
        if (!isActive && elPath !== '/data/analytics' && elPath !== '/profile' && elPath !== '/prospect') {
          isActive = path.startsWith(elPath + '/') || path.startsWith(elPath);
        }
        el.classList.toggle('active', isActive);
      });
      const adminTile = document.getElementById('admin-nav-wrap');
      if (adminTile) {
        const onAdmin = ADMIN_PATHS.some(p => path === p || path.startsWith(p + '/'));
        adminTile.classList.toggle('active', onAdmin);
      }
    },

    refresh() {
      const nav = document.querySelector('.sidenav');
      if (nav) nav.outerHTML = render();
    },

    _goLOP(path) {
      State.setMode('data');
      Router.navigate(path);
    },

    openSearchPalette,
    _openCmdK: openSearchPalette,           // back-compat alias
    _paletteSelect: _selectPaletteResult,

    goAdmin(path) {
      State.setMode('admin');
      document.getElementById('admin-nav-menu')?.classList.remove('open');
      Router.navigate(path);
    },

    toggleAdminDropdown(e) {
      if (e) e.stopPropagation();
      const menu = document.getElementById('admin-nav-menu');
      if (menu) menu.classList.toggle('open');
      // Close peer flyouts
      document.getElementById('notif-panel')?.classList.remove('open');
      document.getElementById('profile-dropdown')?.classList.remove('open');
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
      // Close peer flyouts
      document.getElementById('profile-dropdown')?.classList.remove('open');
      document.getElementById('admin-nav-menu')?.classList.remove('open');
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
      // Close peer flyouts
      document.getElementById('notif-panel')?.classList.remove('open');
      document.getElementById('admin-nav-menu')?.classList.remove('open');
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
