/* ============================================================
   HOMIUM ORIGINATOR FLOW — Class-Name Aliases (2026-05-27 canon v2)

   The design canon names components in PascalCase BEM
   (.Btn.Btn--primary, .Card, .Modal, .NavRail, .DetailHeaderCard…).
   The codebase implements them in kebab-case. This shim translates
   PascalCase class names to their kebab equivalents at runtime, so
   both naming conventions work without renaming every CSS rule.

   New code SHOULD use the PascalCase names per canon. Legacy kebab
   classes continue working. A MutationObserver picks up nodes added
   after initial boot (every view re-render).
   ============================================================ */

(() => {
  const ALIASES = {
    // Buttons
    'Btn':              'btn',
    'Btn--primary':     'btn-primary',
    'Btn--secondary':   'btn-secondary',
    'Btn--outlined':    'btn-outline',
    'Btn--tertiary':    'btn-outline',
    'Btn--ghost':       'btn-ghost',
    'Btn--destructive': 'btn-danger',
    'Btn--sm':          'btn-sm',
    'Btn--lg':          'btn-lg',
    // Cards
    'Card':             'card',
    'Card__title':      'card-title',
    'Card__header':     'card-header',
    'Card__subtitle':   'card-subtitle',
    'Card--inst':       'inst-card',
    'Card__title--inst':'inst-card-title',
    // Modal primitive
    'Modal':            'modal-overlay',
    'Modal__panel':     'modal',
    'Modal__title':     'modal-title',
    'Modal__subtitle':  'modal-subtitle',
    'Modal__body':      'modal-body',
    'Modal__actions':   'modal-footer',
    'Modal__close':     'modal-close',
    // Nav rail
    'NavRail':          'sidenav',
    'NavRail__logo':    'sidenav-logo',
    'NavRail__items':   'sidenav-section',
    'NavRail__item':    'sidenav-tile',
    'NavRail__profile': 'sidenav-profile',
    'NavRail__footer':  'sidenav-footer',
    // Page chrome
    'PageHeader':              'page-header',
    'PageHeader__inner':       'page-header-inner',
    'PageHeader__title':       'page-title',
    'PageHeader__subtitle':    'page-subtitle',
    'PageHeader__actions':     'page-header-actions',
    'SectionTitle':            'card-title',     // 20px inside cards
    'SectionTitle--page':      'page-title',     // 28px page-level
    // Detail entity header
    'DetailHeaderCard':              'entity-header',
    'DetailHeaderCard__top':         'entity-header-row',
    'DetailHeaderCard__title':       'entity-header-title',
    'DetailHeaderCard__title-block': 'entity-header-row',
    'DetailHeaderCard__subtitle':    'entity-header-subtitle',
    'DetailHeaderCard__actions':     'entity-header-actions',
    'DetailHeaderCard__meta':        'entity-meta-row',
    'DetailHeaderCard__meta-label':  'entity-meta-label',
    'DetailHeaderCard__meta-value':  'entity-meta-value',
    'DetailHeaderCard__meta-item':   'entity-meta-row',
    'StatusPill':                    'entity-status-pill',
    // BackToMain + SaveBar
    'BackToMain':           'back-link',
    'BackToMain--sticky':   'back-bar',
    'SaveBar':              'inst-footer-bar',
    // Form helpers (FormGrid maps to existing inst-form-grid)
    'FormGrid':             'inst-form-grid',
  };

  const _aliasFor = (cls) => ALIASES[cls];

  function applyAliasesToElement(el) {
    if (!(el instanceof Element) || !el.classList?.length) return;
    el.classList.forEach((cls) => {
      const kebab = _aliasFor(cls);
      if (kebab && !el.classList.contains(kebab)) {
        el.classList.add(kebab);
      }
    });
  }

  function applyAliasesToTree(root) {
    if (!root) return;
    applyAliasesToElement(root);
    root.querySelectorAll?.('*').forEach(applyAliasesToElement);
  }

  // Initial pass — once DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyAliasesToTree(document.body));
  } else {
    applyAliasesToTree(document.body);
  }

  // Subsequent renders — observe additions to the body subtree.
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => applyAliasesToTree(n));
      if (m.type === 'attributes' && m.attributeName === 'class') {
        applyAliasesToElement(m.target);
      }
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['class']
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
      });
    });
  }

  // Expose for diagnostic use only.
  window.HomiumClassAliases = { aliases: ALIASES, apply: applyAliasesToTree };
})();
