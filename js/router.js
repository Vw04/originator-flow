/* ============================================================
   HOMIUM ORIGINATOR FLOW — Hash-based SPA Router
   ============================================================ */

const Router = (() => {
  const _routes = {};
  let _currentPath = null;

  function getCurrentPath() {
    const hash = window.location.hash;
    if (!hash || hash === '#' || hash === '#/') return '/';
    return hash.replace(/^#/, '') || '/';
  }

  function navigate(path, { replace = false } = {}) {
    if (replace) {
      window.history.replaceState(null, '', '#' + path);
    } else {
      window.location.hash = path;
    }
    render();
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
      window.addEventListener('hashchange', () => render());
      render();
    },

    // Helper for nav items
    link(path) {
      return `javascript:Router.navigate('${path}')`;
    },
  };
})();
