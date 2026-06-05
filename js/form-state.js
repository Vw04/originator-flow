/* ============================================================
   HOMIUM ORIGINATOR FLOW — Form Snapshot + Dirty State (Pattern D)

   Per canon (homium-design-canon/DESIGN_CANON.md):
     - captureFormSnapshot(rootId) — on entering edit mode
     - revertFormSnapshot(rootId)  — Discard (Pattern B); restores inputs
     - clearFormSnapshot(rootId)   — Save success / unmount
     - markFormDirty(rootId)       — input handler marks the form dirty
     - isFormDirty(rootId)         — for the hashchange dirty-guard
     - cancelEditForm(rootId, proceed) — Cancel (Pattern D); no modal, just navigate
     - saveEditForm(rootId, persist, proceed) — Save; persist then navigate
     - hasAnyDirtyForm() — true if any tracked form is dirty

   Snapshots are stored per-form-id in an in-memory map. The `body.is-dirty`
   class continues to mirror "ANY form is dirty" for existing CSS hooks.
   ============================================================ */

const FormState = (() => {
  const _snapshots = new Map();   // rootId → { inputs: {id: value}, dirty: bool }

  function _allInputs(root) {
    if (!root) return [];
    return Array.from(root.querySelectorAll('input, select, textarea')).filter(el => el.id);
  }

  function _readValue(el) {
    if (el.type === 'checkbox' || el.type === 'radio') return el.checked;
    return el.value;
  }
  function _writeValue(el, val) {
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!val;
    else el.value = val == null ? '' : val;
  }

  function _refreshBodyDirty() {
    const anyDirty = [..._snapshots.values()].some(s => s.dirty);
    document.body.classList.toggle('is-dirty', anyDirty);
    // Update any visible SaveBar dirty label text.
    document.querySelectorAll('.inst-footer-bar .dirty-label').forEach(lbl => {
      lbl.textContent = anyDirty ? 'Unsaved changes' : 'No changes';
    });
  }

  return {
    captureFormSnapshot(rootId) {
      const root = document.getElementById(rootId) || document.body;
      const inputs = {};
      _allInputs(root).forEach(el => { inputs[el.id] = _readValue(el); });
      _snapshots.set(rootId, { inputs, dirty: false });
      _refreshBodyDirty();
    },

    revertFormSnapshot(rootId) {
      const snap = _snapshots.get(rootId);
      if (!snap) return;
      const root = document.getElementById(rootId) || document.body;
      _allInputs(root).forEach(el => {
        if (el.id in snap.inputs) _writeValue(el, snap.inputs[el.id]);
      });
      snap.dirty = false;
      _refreshBodyDirty();
    },

    clearFormSnapshot(rootId) {
      _snapshots.delete(rootId);
      _refreshBodyDirty();
    },

    markFormDirty(rootId) {
      let snap = _snapshots.get(rootId);
      if (!snap) {
        snap = { inputs: {}, dirty: true };
        _snapshots.set(rootId, snap);
      }
      snap.dirty = true;
      _refreshBodyDirty();
    },

    isFormDirty(rootId) {
      return !!_snapshots.get(rootId)?.dirty;
    },

    hasAnyDirtyForm() {
      return [..._snapshots.values()].some(s => s.dirty);
    },

    /* Pattern D — Cancel: explicit intent, no modal. Clears snapshot + navigates. */
    cancelEditForm(rootId, proceed) {
      this.clearFormSnapshot(rootId);
      if (typeof proceed === 'function') proceed();
    },

    /* Pattern D — Save: clears snapshot BEFORE proceed() so the dirty-guard
       doesn't fire on the post-save navigation. */
    saveEditForm(rootId, persist, proceed) {
      let ok = true;
      if (typeof persist === 'function') {
        try { const r = persist(); if (r === false) ok = false; }
        catch (_) { ok = false; }
      }
      if (!ok) return;
      this.clearFormSnapshot(rootId);
      if (typeof proceed === 'function') proceed();
    },
  };
})();

window.FormState = FormState;
