/* ============================================================
   HOMIUM ORIGINATOR FLOW — OC Access (Branch Enablement Editor)
   Replaces the legacy Permissions / CompanyPermissions UIs with
   the spec v1.2 model:
     • OC enablement (program × market) — set by Platform Operator
     • Branch enablement — narrows OC enablement, set per branch
     • User-level access (LO Assignment × Permission Level × Subflags)
       lives on the Profile screen
   Spec §1.3: independent records, intersected at runtime.
   ============================================================ */

const OCAccessView = {
  _selectedBranchId: null,
  _editingOC: false,

  render(companyId) {
    const c = State.getCompany(companyId);
    if (!c) return '<div>Company not found</div>';
    const branches = State.getBranchesByCompany(companyId);
    const ocLpmIds = State.getOcEnablement(companyId);
    const programs = State.getLoanPrograms();
    const markets = State.getMarkets().filter(m => m.supported);
    const lpms = State.getLPMs();

    // Default branch selection to first
    const branchId = this._selectedBranchId && branches.some(b => b.id === this._selectedBranchId)
      ? this._selectedBranchId : (branches[0]?.id || null);
    this._selectedBranchId = branchId;
    const branch = branches.find(b => b.id === branchId);

    const canEditOC = State.can('manageCompany') || State.can('editAny');
    const canEditBranch = canEditOC || State.can('inviteUsers');

    return `
      <div style="display:grid;grid-template-columns:280px 1fr;gap:20px">
        <!-- Left: branch list -->
        <div class="card" style="padding:0;align-self:start;position:sticky;top:80px">
          <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:11px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em">OC Enablement</div>
              <div style="font-size:13px;color:var(--color-text);margin-top:4px"><strong>${ocLpmIds.length}</strong> LPMs platform-allowed</div>
            </div>
            ${canEditOC ? `<button class="btn btn-xs btn-ghost" onclick="OCAccessView.toggleEditOC()">${this._editingOC ? 'Done' : 'Edit'}</button>` : ''}
          </div>
          <div style="padding:8px 0">
            ${branches.length === 0 ? `<div style="padding:14px 16px;color:var(--color-text-muted);font-size:12px;text-align:center">No branches yet</div>` : ''}
            ${branches.map(b => {
              const brSet = new Set(State.getBranchEnablement(b.id));
              const intersect = ocLpmIds.filter(id => brSet.has(id));
              const isSelected = b.id === branchId;
              return `
                <div onclick="OCAccessView.selectBranch('${b.id}')" style="padding:10px 16px;cursor:pointer;border-left:3px solid ${isSelected ? 'var(--color-primary)' : 'transparent'};background:${isSelected ? 'var(--color-surface)' : 'transparent'}">
                  <div style="font-size:13px;font-weight:${isSelected ? '600' : '500'};color:var(--color-text)">${b.name}</div>
                  <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px">${b.state} · <strong>${intersect.length}</strong>/${ocLpmIds.length} LPMs</div>
                </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Right: editor -->
        <div>
          ${this._editingOC ? this._renderOCEditor(companyId, programs, markets, lpms, ocLpmIds) : ''}
          ${branch ? this._renderBranchEditor(branch, ocLpmIds, programs, markets, lpms, canEditBranch) : `
            <div class="card"><div style="text-align:center;color:var(--color-text-muted);padding:30px;font-size:13px">Select a branch to configure enablement.</div></div>`}
          ${branch ? this._renderUsersInBranch(branch) : ''}
        </div>
      </div>`;
  },

  /* ---- OC-level enablement editor (when in edit mode) ---- */
  _renderOCEditor(companyId, programs, markets, lpms, ocLpmIds) {
    const ocSet = new Set(ocLpmIds);
    const headerRow = `<tr><th style="text-align:left;font-size:11px;color:var(--color-text-muted);padding:8px 12px">Program</th>${markets.map(m => `<th style="font-size:11px;color:var(--color-text-muted);padding:8px 12px;text-align:center">${m.code}</th>`).join('')}</tr>`;
    const rows = programs.map(p => {
      const cells = markets.map(m => {
        const lpm = lpms.find(l => l.programId === p.id && l.marketId === m.id);
        if (!lpm) {
          return `<td style="text-align:center;padding:6px;color:var(--color-text-muted)" title="Not allowed at platform level"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></td>`;
        }
        const checked = ocSet.has(lpm.id);
        return `<td style="text-align:center;padding:6px"><input type="checkbox" ${checked ? 'checked' : ''} onchange="OCAccessView._toggleOcLpm('${companyId}', '${lpm.id}', this.checked)" style="width:15px;height:15px;cursor:pointer"></td>`;
      }).join('');
      return `<tr><td style="padding:8px 12px;font-size:13px;font-weight:500">${p.name}</td>${cells}</tr>`;
    }).join('');
    return `
      <div class="card" style="margin-bottom:16px;border-left:3px solid var(--color-primary)">
        <div class="card-title" style="margin-bottom:8px">Edit OC Enablement</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:14px">
          Set the (program × market) pairs the platform allows this OC to operate in. Removing a pair here also removes it from any branch that had it enabled.
        </div>
        <div style="border:1px solid var(--color-border);border-radius:8px;overflow:hidden">
          <table style="width:100%;border-collapse:collapse"><thead style="background:var(--color-surface)">${headerRow}</thead><tbody>${rows}</tbody></table>
        </div>
      </div>`;
  },

  /* ---- Branch-level enablement editor ---- */
  _renderBranchEditor(branch, ocLpmIds, programs, markets, lpms, canEdit) {
    const ocSet = new Set(ocLpmIds);
    const brIds = State.getBranchEnablement(branch.id);
    const brSet = new Set(brIds);
    const intersect = ocLpmIds.filter(id => brSet.has(id));

    // Filter programs/markets to those touched by OC enablement (others greyed)
    const headerRow = `<tr><th style="text-align:left;font-size:11px;color:var(--color-text-muted);padding:8px 12px">Program</th>${markets.map(m => `<th style="font-size:11px;color:var(--color-text-muted);padding:8px 12px;text-align:center">${m.code}</th>`).join('')}</tr>`;
    const rows = programs.map(p => {
      const cells = markets.map(m => {
        const lpm = lpms.find(l => l.programId === p.id && l.marketId === m.id);
        if (!lpm) {
          return `<td style="text-align:center;padding:6px;color:var(--color-text-muted)" title="Not allowed at platform level">—</td>`;
        }
        if (!ocSet.has(lpm.id)) {
          return `<td style="text-align:center;padding:6px;color:var(--color-text-muted);background:var(--color-surface)" title="Not enabled at OC level"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></td>`;
        }
        const checked = brSet.has(lpm.id);
        return `<td style="text-align:center;padding:6px"><input type="checkbox" ${checked ? 'checked' : ''} ${canEdit ? '' : 'disabled'} onchange="OCAccessView._toggleBranchLpm('${branch.id}', '${lpm.id}', this.checked)" style="width:15px;height:15px;cursor:${canEdit ? 'pointer' : 'not-allowed'}"></td>`;
      }).join('');
      return `<tr><td style="padding:8px 12px;font-size:13px;font-weight:500">${p.name}</td>${cells}</tr>`;
    }).join('');

    return `
      <div class="card" style="margin-bottom:20px">
        <div class="card-title" style="margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
          <span>${branch.name} <span style="color:var(--color-text-muted);font-weight:400;font-size:12px">· ${intersect.length} of ${ocLpmIds.length} LPMs enabled${intersect.length < ocLpmIds.length ? ' (narrowed)' : ''}</span></span>
          <span style="font-size:11px;color:var(--color-text-muted);font-weight:400">${branch.lastNmlsSync ? '<span class="status-dot" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-success);margin-right:4px"></span>NMLS sync ' + Display.relativeTime(branch.lastNmlsSync) : ''}</span>
        </div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:14px">
          Spec §1.3: branch enablement is independent of OC enablement; the runtime takes the intersection. Greyed cells indicate (program × market) pairs not enabled at the OC level.
        </div>
        <div style="border:1px solid var(--color-border);border-radius:8px;overflow:hidden">
          <table style="width:100%;border-collapse:collapse"><thead style="background:var(--color-surface)">${headerRow}</thead><tbody>${rows}</tbody></table>
        </div>
      </div>`;
  },

  /* ---- Users in this branch (link out to profile editor) ---- */
  _renderUsersInBranch(branch) {
    const users = State.getUsers().filter(u => {
      const assignments = State.getBranchAssignments(u.id);
      return assignments.some(a => a.branchId === branch.id);
    });
    if (!users.length) {
      return `<div class="card"><div style="text-align:center;color:var(--color-text-muted);padding:24px;font-size:13px">No users assigned to this branch yet.</div></div>`;
    }
    return `
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">Users at ${branch.name} <span style="color:var(--color-text-muted);font-weight:400;font-size:12px">· ${users.length} user${users.length === 1 ? '' : 's'}</span></div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:12px">
          Edit per-user permission tuples (LO Assignment × Permission Level × Subflags) on the Profile screen.
        </div>
        <div style="border:1px solid var(--color-border);border-radius:8px;overflow:hidden">
          <table>
            <thead><tr><th>User</th><th>Branch User Type</th><th>Flags</th><th>Assignment Tuples</th><th></th></tr></thead>
            <tbody>
              ${users.map(u => {
                const a = State.getBranchAssignments(u.id).find(x => x.branchId === branch.id);
                const tuples = (a?.loAssignments || []);
                const tupleSummary = tuples.map(t => {
                  const scope = t.scope === 'personal' ? 'Personal' : t.scope === 'specific_los' ? `LO×${(t.loIds || []).length}` : 'All LOs';
                  return `<span class="tag" style="margin-right:4px;font-size:10px">${scope} · ${t.level}</span>`;
                }).join('') || '<span class="text-muted" style="font-size:11px">—</span>';
                return `
                  <tr class="clickable" onclick="ProfileView.open('${u.id}')">
                    <td>
                      <div class="cell-primary">${Display.fullName(u)}</div>
                      <div class="cell-secondary">${u.email}</div>
                    </td>
                    <td><span class="badge ${a?.userType === 'lo' ? 'badge-active' : 'badge-pending'}">${a?.userType === 'lo' ? 'Loan Officer' : 'Standard User'}</span></td>
                    <td>${a?.flags?.branchManager ? '<span class="tag" style="background:#fff7e6;color:#a35c00">BM</span>' : '<span class="text-muted" style="font-size:11px">—</span>'}</td>
                    <td>${tupleSummary}</td>
                    <td><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();ProfileView.open('${u.id}')">Edit →</button></td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  /* ---- Plumbing ---- */
  selectBranch(branchId) {
    this._selectedBranchId = branchId;
    App.renderView(Router.getCurrentPath());
  },

  toggleEditOC() {
    this._editingOC = !this._editingOC;
    App.renderView(Router.getCurrentPath());
  },

  _toggleOcLpm(companyId, lpmId, on) {
    const cur = new Set(State.getOcEnablement(companyId));
    if (on) cur.add(lpmId); else cur.delete(lpmId);
    State.setOcEnablement(companyId, [...cur]);
    App.renderView(Router.getCurrentPath());
  },

  _toggleBranchLpm(branchId, lpmId, on) {
    const cur = new Set(State.getBranchEnablement(branchId));
    if (on) cur.add(lpmId); else cur.delete(lpmId);
    State.setBranchEnablement(branchId, [...cur]);
    App.renderView(Router.getCurrentPath());
  },
};
