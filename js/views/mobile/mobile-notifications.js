/* ============================================================
   MOBILE NOTIFICATIONS — Full-screen notification list
   ============================================================ */

const MobileNotificationsView = {

  render() {
    const role = State.getRole();
    const user = State.getCurrentUser();
    const notifs = MobileNav.DEMO_NOTIFICATIONS;

    /* Filter by role: LO/LP only see notifications for their loans */
    let visible = notifs;
    if ((role === 'lo' || role === 'lp') && user) {
      const myLoanIds = State.getLoansByLO(user.id).map(l => l.id);
      visible = notifs.filter(n => !n.loanId || myLoanIds.includes(n.loanId));
    }

    const actionCount = visible.filter(n => n.type === 'action').length;

    const ICON_SVG = {
      action:   '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 1.5v5M7 9.5v1"/></svg>',
      sent:     '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 7l4 4 6-8"/></svg>',
      complete: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="7" r="5"/><path d="M5 7l1.5 1.5L9 5.5"/></svg>',
      info:     '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="7" r="5"/><path d="M7 6v3M7 4.5v.5"/></svg>',
    };

    const LABEL = { action: 'Action Required', sent: 'Sent', complete: 'Completed', info: 'Update' };

    return `
      <div class="m-page-header">
        <div class="m-page-header-left">
          <div>
            <div class="m-page-title">Notifications</div>
            <div class="m-page-subtitle">${actionCount} action${actionCount !== 1 ? 's' : ''} required</div>
          </div>
        </div>
      </div>

      ${visible.length ? `
        <div class="m-notif-list" style="padding-top:14px">
          ${visible.map(n => `
            <div class="m-notif-item"
                 ${n.loanId ? `onclick="Router.navigate('/m/loans')"` : ''}>
              <div class="m-notif-icon ${n.type}">
                ${ICON_SVG[n.type] || ICON_SVG.info}
              </div>
              <div class="m-notif-body">
                <div class="m-notif-title">${LABEL[n.type]}</div>
                <div class="m-notif-msg">${n.msg}</div>
                <div class="m-notif-meta">
                  ${n.loanId ? `<span class="m-notif-loan-id">${n.loanId}</span><span class="m-notif-dot">&middot;</span>` : ''}
                  ${n.borrowerName ? `<span style="font-size:11px;color:var(--color-text-secondary)">${n.borrowerName}</span><span class="m-notif-dot">&middot;</span>` : ''}
                  <span class="m-notif-time">${n.time}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="m-empty-state">
          <div class="m-empty-icon">&#128276;</div>
          No notifications
        </div>
      `}
    `;
  },
};
