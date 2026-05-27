/* ============================================================
   HOMIUM ORIGINATOR FLOW — Shared Modal Primitive
   Adopted 2026-05-26 per design canon (see assets/specs/design-canon.html).

   One shared overlay host injected on boot. Any view calls AppModal.open()
   with declarative content; closeModal() restores state. Esc dismisses,
   Tab is trapped within the panel, focus restores to the trigger on close.

   API:
     AppModal.open({
       title, subtitle, body,         // strings (body may be raw HTML)
       actions: [['Cancel', 'X.fn()'], ['Confirm', 'Y.fn()']],
       danger,                        // bool — primary action becomes danger
       size,                          // 'sm' | 'md' (default) | 'lg' | 'xl'
       onDismiss,                     // optional fn ref called when Esc/overlay closes
     })
     AppModal.close()
     AppModal.isOpen()
   ============================================================ */

const AppModal = (() => {
  let _trigger        = null;   // element that opened the modal — restore focus here on close
  let _onDismiss      = null;   // optional dismiss callback
  let _keyHandler     = null;   // bound keydown handler
  let _pendingDiscard = null;   // 2026-05-27 canon Pattern B/D: discard-confirmation pending fn

  function _ensureHost() {
    let host = document.getElementById('app-modal-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'app-modal-host';
      document.body.appendChild(host);
    }
    return host;
  }

  function _esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
    ));
  }

  function _renderActions(actions, danger) {
    if (!actions || !actions.length) return '';
    return actions.map(([lbl, fn, style], i) => {
      const isLast = i === actions.length - 1 && actions.length > 1;
      // Explicit per-action style override (3rd element). Used by confirmDiscard
      // to render "Discard changes" as ghost-destructive on the left while the
      // primary "Keep editing" sits on the right.
      let cls;
      if (style === 'ghost-destructive') {
        cls = 'btn btn-ghost modal-action-destructive';
      } else if (style === 'primary') {
        cls = 'btn btn-primary';
      } else if (style === 'danger') {
        cls = 'btn btn-danger';
      } else if (style === 'secondary') {
        cls = 'btn btn-secondary';
      } else {
        cls = isLast
          ? (danger ? 'btn btn-danger' : 'btn btn-primary')
          : 'btn btn-secondary';
      }
      return `<button class="${cls}" onclick="${fn}">${_esc(lbl)}</button>`;
    }).join('');
  }

  function _focusables(root) {
    return Array.from(root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  function _trapTab(e) {
    const panel = document.querySelector('#app-modal-host .modal');
    if (!panel) return;
    const focusables = _focusables(panel);
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function _keyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); AppModal.close(); }
    else if (e.key === 'Tab') { _trapTab(e); }
  }

  return {
    open(opts = {}) {
      const { title = '', subtitle = '', body = '', actions = [],
              danger = false, size = '', onDismiss = null } = opts;
      _trigger   = document.activeElement;
      _onDismiss = onDismiss;

      const host = _ensureHost();
      const sizeClass = size === 'lg' ? ' modal-lg'
                      : size === 'xl' ? ' modal-xl'
                      : size === 'sm' ? ''
                      : '';

      host.innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this)AppModal.close()">
          <div class="modal${sizeClass}" role="dialog" aria-modal="true" aria-labelledby="app-modal-title">
            <div class="modal-header">
              <div>
                <div class="modal-title" id="app-modal-title">${_esc(title)}</div>
                ${subtitle ? `<div class="modal-subtitle">${_esc(subtitle)}</div>` : ''}
              </div>
              <button class="modal-close" aria-label="Close" onclick="AppModal.close()">×</button>
            </div>
            <div class="modal-body">${body}</div>
            ${actions && actions.length ? `<div class="modal-footer">${_renderActions(actions, danger)}</div>` : ''}
          </div>
        </div>`;

      _keyHandler = _keyDown;
      document.addEventListener('keydown', _keyHandler);

      // Move focus into the modal — prefer the last action button (Confirm), else first focusable.
      const panel = host.querySelector('.modal');
      const focusables = panel ? _focusables(panel) : [];
      if (focusables.length) {
        const target = focusables.find(el => el.classList.contains('btn-primary') || el.classList.contains('btn-danger'))
                    || focusables[0];
        target.focus();
      }
    },

    close() {
      const host = document.getElementById('app-modal-host');
      if (host) host.innerHTML = '';
      if (_keyHandler) {
        document.removeEventListener('keydown', _keyHandler);
        _keyHandler = null;
      }
      const dismiss = _onDismiss;
      _onDismiss = null;
      if (_trigger && typeof _trigger.focus === 'function') {
        _trigger.focus();
      }
      _trigger = null;
      if (typeof dismiss === 'function') {
        try { dismiss(); } catch (_) {}
      }
    },

    isOpen() {
      const host = document.getElementById('app-modal-host');
      return !!(host && host.children.length);
    },

    /* Dirty-form / discard-changes confirmation modal (canon Pattern B/C/D).
       Fires when the user attempts an unintentional nav-away while a form is
       dirty. Primary "Keep editing" sits right (autofocus); ghost-destructive
       "Discard changes" sits left. Both backdrop click and Esc are treated as
       "Keep editing" (default close behavior). */
    confirmDiscard({ onDiscard } = {}) {
      _pendingDiscard = typeof onDiscard === 'function' ? onDiscard : null;
      this.open({
        title: 'Discard changes?',
        body:  '<p style="font-size:14px;color:var(--h-text-secondary);margin:0">Your unsaved changes will be lost.</p>',
        actions: [
          ['Discard changes', 'AppModal._confirmDiscard()', 'ghost-destructive'],
          ['Keep editing',    'AppModal.close()',           'primary'],
        ],
      });
    },

    _confirmDiscard() {
      const fn = _pendingDiscard;
      _pendingDiscard = null;
      this.close();
      if (fn) {
        try { fn(); } catch (_) {}
      }
    },
  };
})();

// Expose globally so inline onclick= handlers can reach it.
window.AppModal = AppModal;
