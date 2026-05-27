/* ============================================================
   HOMIUM ORIGINATOR FLOW — Hash-based SPA Router
   ============================================================ */

const Router = (() => {
  const _routes = {};
  let _currentPath = null;
  let _bypassDirtyGuard = false;   // 2026-05-27: set true to navigate past a dirty form (Save/Cancel)

  function getCurrentPath() {
    const hash = window.location.hash;
    if (!hash || hash === '#' || hash === '#/') return '/';
    return hash.replace(/^#/, '') || '/';
  }

  /* 2026-05-27 canon Pattern B/C/D: if any form is dirty and the caller did
     not explicitly bypass (via Cancel/Save/Discard), prompt the user with the
     shared dirty-form modal. Otherwise, navigate immediately. */
  function _dirtyGuardOr(proceed) {
    if (_bypassDirtyGuard || typeof FormState === 'undefined' || !FormState.hasAnyDirtyForm()) {
      proceed();
      return;
    }
    if (typeof AppModal === 'undefined') { proceed(); return; }
    AppModal.confirmDiscard({
      onDiscard: () => {
        // User confirmed Discard — clear any tracked dirty forms then proceed.
        document.body.classList.remove('is-dirty');
        proceed();
      },
    });
  }

  function navigate(path, { replace = false, force = false } = {}) {
    const doNavigate = () => {
      if (replace) {
        window.history.replaceState(null, '', '#' + path);
      } else {
        window.location.hash = path;
      }
      render();
    };
    if (force) {
      _bypassDirtyGuard = true;
      doNavigate();
      _bypassDirtyGuard = false;
      return;
    }
    _dirtyGuardOr(doNavigate);
  }

  function render() {
    const path = getCurrentPath();

    // If no role selected and not on root, redirect to role select
    if (!State.getRole() && path !== '/') {
      navigate('/', { replace: true });
      return;
    }

    _currentPath = path;

    // Match route (exact first, then prefix)
    let handler = _routes[path];
    if (!handler) {
      // Try prefix match (e.g., /users/user-001 -> /users)
      for (const routePath of Object.keys(_routes)) {
        if (routePath !== '/' && path.startsWith(routePath)) {
          handler = _routes[routePath];
          break;
        }
      }
    }

    if (handler) {
      handler(path);
      // Update nav active state
      if (typeof Nav !== 'undefined') Nav.setActive(path);
    }
  }

  return {
    register(path, handler) {
      _routes[path] = handler;
    },

    navigate,

    getCurrentPath: () => _currentPath,

    init() {
      window.addEventListener('hashchange', (e) => {
        // 2026-05-27 canon: catch browser back / address-bar nav while dirty.
        if (!_bypassDirtyGuard && typeof FormState !== 'undefined' && FormState.hasAnyDirtyForm()) {
          const target = getCurrentPath();
          const previous = (e.oldURL || '').split('#')[1] || _currentPath || '/';
          // Restore the previous URL silently (no ghost history entry).
          _bypassDirtyGuard = true;
          window.history.replaceState(null, '', '#' + previous);
          _bypassDirtyGuard = false;
          AppModal.confirmDiscard({
            onDiscard: () => {
              document.body.classList.remove('is-dirty');
              _bypassDirtyGuard = true;
              window.location.hash = target;
              _bypassDirtyGuard = false;
            },
          });
          return;
        }
        render();
      });

      // beforeunload — browser-native warning on tab close / reload while dirty.
      window.addEventListener('beforeunload', (e) => {
        if (typeof FormState !== 'undefined' && FormState.hasAnyDirtyForm()) {
          e.preventDefault();
          e.returnValue = '';
        }
      });

      render();
    },

    // 2026-05-27 canon: explicit force-navigate (bypasses dirty-guard).
    // Use from Save / Cancel / Discard click handlers.
    navigateForce(path) { navigate(path, { force: true }); },

    // Helper for nav items
    link(path) {
      return `javascript:Router.navigate('${path}')`;
    },
  };
})();
