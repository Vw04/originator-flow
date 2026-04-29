/* ============================================================
   ArtboardMountView — bridges the vanilla-JS app shell to the
   React/JSX artboards (Institutional, Investor, Spatial, Atrium,
   Terminal, Mission, Briefing).

   Returns an HTML string with a single mount node, then schedules
   a microtask to ReactDOM-render the requested component into it
   after the parent view's innerHTML write has settled.
   ============================================================ */

const ArtboardMountView = (() => {
  const COMPONENT_BY_NAME = {
    institutional: () => window.InstitutionalArtboard,
    investor:      () => window.InvestorArtboard,
    spatial:       () => window.SpatialArtboard,
    atrium:        () => window.AtriumArtboard,
    terminal:      () => window.TerminalArtboard,
    mission:       () => window.MissionArtboard,
    briefing:      () => window.BriefingArtboard,
  };

  // Active roots — keyed by mount-id so re-renders unmount cleanly
  const _roots = new Map();

  function render(name, opts = {}) {
    const id = 'artboard-mount-' + name + '-' + (opts.suffix || 'main');
    const heightCss = opts.height || 'calc(100vh - 60px)';

    // schedule the React mount after this string is inserted into the DOM
    queueMicrotask(() => mount(name, id));

    return `<div id="${id}" class="artboard-mount" style="width:100%; height:${heightCss}; overflow:hidden;"></div>`;
  }

  function mount(name, id) {
    const node = document.getElementById(id);
    if (!node) return;
    const getComp = COMPONENT_BY_NAME[name];
    const Comp = getComp ? getComp() : null;
    if (!Comp) {
      node.innerHTML = '<div style="padding:40px; font-family: Inter, sans-serif; color:#7B7A73;">Loading artboard…</div>';
      // Babel may still be transpiling — retry once after a brief delay
      setTimeout(() => mount(name, id), 250);
      return;
    }
    // Each main-app re-render replaces the parent innerHTML, so the mount
    // node is a fresh DOM element. Detect that and create a fresh React root.
    let root = _roots.get(id);
    if (!root || root.__homiumNode !== node) {
      if (root) { try { root.unmount(); } catch (e) {} }
      root = ReactDOM.createRoot(node);
      root.__homiumNode = node;
      _roots.set(id, root);
    }
    root.render(React.createElement(Comp));
  }

  function unmountAll() {
    _roots.forEach(r => { try { r.unmount(); } catch (e) {} });
    _roots.clear();
  }

  return { render, mount, unmountAll };
})();

window.ArtboardMountView = ArtboardMountView;
