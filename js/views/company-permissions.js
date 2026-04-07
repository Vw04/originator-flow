/* ============================================================
   HOMIUM ORIGINATOR FLOW — Company Permissions Workbench
   Three-layer RBAC: Company Default → Branch Default → User Override
   ============================================================ */

const CompanyPermissionsView = {
  _companyId: null,
  _activeBranchId: null,
  _editingUserId: null,
  _pendingOverrides: {},
  _pendingTemplateId: null,  // staged template in user panel (before save)
  _pendingTags: null,        // staged tags in user panel (before save)

  render(companyId) {
    if (this._companyId !== companyId) {
      // Reset drill-down state when switching companies
      this._companyId = companyId;
      this._activeBranchId = null;
      this._editingUserId = null;
      this._pendingOverrides = {};
      this._pendingTemplateId = null;
      this._pendingTags = null;
    }
    if (this._activeBranchId) {
      return this._renderBranchDrillDown();
    }
    return this._renderOverview();
  },

  /* ================================================================
     OVERVIEW — Company Default card + Branches list + Audit log
  ================================================================ */
  _renderOverview() {
    const company = State.getCompany(this._companyId);
    if (!company) return '<p>Company not found.</p>';

    const branches = State.getBranchesByCompany(this._companyId);
    const auditEntries = State.getAuditLogByCompany(this._companyId);

    // Section 1: Company Default Card
    const coTemplateId = company.defaultPermissionTemplateId;
    const coTemplate = coTemplateId ? State.getTemplate(coTemplateId) : null;
    const templateOptions = State.getTemplates().map(t =>
      `<option value="${t.id}" ${t.id === coTemplateId ? 'selected' : ''}>${t.name}</option>`
    ).join('');

    const companyDefaultCard = `
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--color-text-muted);margin-bottom:6px">Company Default Template</div>
            <div style="font-size:15px;font-weight:600;margin-bottom:4px">
              ${coTemplate ? coTemplate.name : '<span style="color:var(--color-text-muted)">No Default Set</span>'}
              ${coTemplate ? '' : ''}
            </div>
            <div style="font-size:12px;color:var(--color-text-secondary)">
              ${coTemplate ? coTemplate.description : 'All branch users will inherit from their branch default, or have no permissions if no branch default is set.'}
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="CompanyPermissionsView._openCompanyDefaultModal()">Edit</button>
        </div>
      </div>`;

    // Section 2: Branches List
    const branchRows = branches.map(br => {
      const brTemplateId = br.defaultPermissionTemplateId;
      const brTemplate = brTemplateId ? State.getTemplate(brTemplateId) : null;
      const userCount = State.getAssignmentsByBranch(br.id).length;
      const isCustom = !!brTemplateId;
      const badgeClass = isCustom ? 'badge-active' : 'badge-neutral';
      const badgeLabel = isCustom ? 'Custom' : 'Inherited';
      const templateLabel = brTemplate ? brTemplate.name : (coTemplate ? `${coTemplate.name} <span style="color:var(--color-text-muted);font-size:11px">(from company)</span>` : '<span style="color:var(--color-text-muted)">None</span>');

      return `
        <div class="branch-perm-row">
          <div class="branch-perm-name">${br.name}</div>
          <div class="branch-perm-template">${templateLabel}</div>
          <div style="font-size:12px;color:var(--color-text-muted);min-width:60px;text-align:right">${userCount} user${userCount !== 1 ? 's' : ''}</div>
          <span class="badge ${badgeClass}" style="font-size:11px">${badgeLabel}</span>
          <button class="btn btn-secondary btn-sm" onclick="CompanyPermissionsView.drillInto('${br.id}')">View →</button>
        </div>`;
    }).join('');

    const branchSection = `
      <div style="margin-bottom:24px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--color-text-muted);margin-bottom:10px">Branches</div>
        <div class="card" style="padding:0 16px">
          ${branchRows || '<div style="padding:16px 0;color:var(--color-text-muted);font-size:13px">No branches found.</div>'}
        </div>
      </div>`;

    // Section 3: Recently Modified (audit log)
    const auditRows = auditEntries.map(e => {
      const actor = State.getUser(e.actorId);
      const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Unknown';
      const initials = actor ? Display.initials(actor) : '?';
      const avatarBg = actor ? avatarColor(actor.role) : '#999';
      return `
        <div class="perm-audit-row">
          <div class="avatar" style="background:${avatarBg};width:24px;height:24px;font-size:9px;flex-shrink:0">${initials}</div>
          <div class="perm-audit-detail">
            <strong>${actorName}</strong> — ${e.detail}
          </div>
          <div class="perm-audit-time">${Display.relativeTime(e.timestamp)}</div>
        </div>`;
    }).join('');

    const auditSection = `
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--color-text-muted);margin-bottom:10px">Recently Modified</div>
        <div class="card" style="padding:0 16px">
          ${auditRows || '<div style="padding:16px 0;color:var(--color-text-muted);font-size:13px">No recent activity.</div>'}
        </div>
      </div>`;

    // Company default modal (hidden by default, shown via _openCompanyDefaultModal)
    const modal = `
      <div id="co-perm-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1000;align-items:center;justify-content:center">
        <div class="card" style="width:440px;max-width:92vw;padding:24px">
          <div style="font-size:15px;font-weight:700;margin-bottom:16px">Edit Company Default Template</div>
          <div style="margin-bottom:8px;font-size:12px;font-weight:600;color:var(--color-text-secondary)">Template</div>
          <select id="co-perm-template-select" onchange="CompanyPermissionsView._updateModalDesc(this.value)"
                  style="width:100%;margin-bottom:8px;padding:8px;border:1px solid var(--color-border);border-radius:4px;font-size:13px">
            <option value="">— No Default —</option>
            ${templateOptions}
          </select>
          <div id="co-perm-template-desc" style="font-size:12px;color:var(--color-text-secondary);margin-bottom:20px;min-height:16px">
            ${coTemplate ? coTemplate.description : ''}
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-secondary btn-sm" onclick="CompanyPermissionsView._closeCompanyDefaultModal()">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="CompanyPermissionsView._saveCompanyDefault()">Save</button>
          </div>
        </div>
      </div>`;

    return companyDefaultCard + branchSection + auditSection + modal;
  },

  /* ================================================================
     BRANCH DRILL-DOWN — Branch template + users table + side panel
  ================================================================ */
  _renderBranchDrillDown() {
    const branch = State.getBranch(this._activeBranchId);
    if (!branch) return '<p>Branch not found.</p>';

    const company = State.getCompany(this._companyId);
    const assignments = State.getAssignmentsByBranch(this._activeBranchId);
    const brTemplateId = branch.defaultPermissionTemplateId;
    const coTemplate = company?.defaultPermissionTemplateId ? State.getTemplate(company.defaultPermissionTemplateId) : null;
    const inheritCount = assignments.filter(a => !a.templateId).length;

    const templateOptions = `
      <option value="">— Inherit from Company (${coTemplate ? coTemplate.name : 'None'}) —</option>
      ${State.getTemplates().map(t =>
        `<option value="${t.id}" ${t.id === brTemplateId ? 'selected' : ''}>${t.name}</option>`
      ).join('')}`;

    // Users table
    const tableRows = assignments.map(a => {
      const user = State.getUser(a.userId);
      if (!user) return '';
      const isCustom = !!a.templateId || Object.keys(a.overridePermissions).length > 0;
      const badgeClass = isCustom ? 'badge-active' : 'badge-neutral';
      const badgeLabel = isCustom ? 'Custom' : 'Inherited';
      const templateName = a.templateId ? (State.getTemplate(a.templateId)?.name || 'Custom') : 'Inherited';
      const tagsHtml = a.tags.length
        ? a.tags.map(t => `<span style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;padding:1px 7px;font-size:11px;color:var(--color-text-secondary)">${t}</span>`).join(' ')
        : '<span style="color:var(--color-text-muted);font-size:12px">—</span>';
      const isEditing = this._editingUserId === a.userId;

      return `
        <tr class="${isEditing ? 'table-row-selected' : ''}">
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="avatar" style="background:${avatarColor(user.role)};width:28px;height:28px;font-size:11px">${Display.initials(user)}</div>
              <div>
                <div style="font-weight:600;font-size:13px">${Display.fullName(user)}</div>
                <div style="font-size:11px;color:var(--color-text-muted)">${user.email}</div>
              </div>
            </div>
          </td>
          <td><span class="badge ${Display.roleClass(user.role)}">${Display.roleName(user.role)}</span></td>
          <td>${tagsHtml}</td>
          <td><span class="badge ${badgeClass}">${badgeLabel}</span><span style="font-size:11px;color:var(--color-text-muted);margin-left:6px">${templateName}</span></td>
          <td><button class="btn btn-secondary btn-sm" onclick="CompanyPermissionsView.openUserPanel('${a.userId}')">Edit</button></td>
        </tr>`;
    }).join('');

    const table = `
      <div class="card" style="padding:0">
        <table style="width:100%">
          <thead>
            <tr>
              <th>User</th>
              <th>User Type</th>
              <th>Tags</th>
              <th>Template</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${tableRows || '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:20px">No users assigned to this branch.</td></tr>'}</tbody>
        </table>
      </div>`;

    // Side panel (if editing)
    const panel = this._editingUserId ? this._renderUserEditPanel(this._editingUserId) : '';

    return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
        <button class="btn btn-secondary btn-sm" onclick="CompanyPermissionsView.drillInto(null)">← Branches</button>
        <span style="font-size:18px;font-weight:700">${branch.name}</span>
      </div>

      <div class="card" style="margin-bottom:20px;padding:16px 20px">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <div style="font-size:13px;font-weight:600;color:var(--color-text-secondary);white-space:nowrap">Branch Default Template</div>
          <select id="br-template-select" onchange="CompanyPermissionsView._onBranchTemplateChange(this.value)"
                  style="padding:6px 10px;border:1px solid var(--color-border);border-radius:4px;font-size:13px;min-width:260px">
            ${templateOptions}
          </select>
          <span id="br-affected-msg" style="font-size:12px;color:var(--color-text-muted)">
            ${inheritCount > 0 ? `${inheritCount} user${inheritCount !== 1 ? 's' : ''} currently set to Inherit` : ''}
          </span>
          <button class="btn btn-primary btn-sm" onclick="CompanyPermissionsView._saveBranchDefault()">Apply</button>
        </div>
      </div>

      <div style="display:flex;gap:20px;align-items:flex-start">
        <div style="flex:1;min-width:0">${table}</div>
        ${panel ? `<div style="width:380px;flex-shrink:0">${panel}</div>` : ''}
      </div>`;
  },

  /* ================================================================
     USER EDIT PANEL — 4 zones
  ================================================================ */
  _renderUserEditPanel(userId) {
    const assignment = State.getAssignment(userId, this._activeBranchId);
    const user = State.getUser(userId);
    const branch = State.getBranch(this._activeBranchId);
    if (!user || !branch) return '';

    const currentTemplateId = this._pendingTemplateId !== null
      ? this._pendingTemplateId
      : (assignment?.templateId || '');
    const currentTags = this._pendingTags !== null
      ? this._pendingTags
      : (assignment?.tags || []).join(', ');

    // Zone 1: Context header
    const zone1 = `
      <div style="padding:16px 16px 0">
        <div style="font-size:13px;font-weight:700;margin-bottom:2px">${Display.fullName(user)}</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:12px">${branch.name}</div>
        <div style="margin-bottom:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted)">Tags (advisory)</div>
        <input type="text" id="panel-tags-input" value="${currentTags}"
               placeholder="e.g. Branch Manager, Loan Processor"
               oninput="CompanyPermissionsView._onTagsChange(this.value)"
               style="width:100%;padding:6px 8px;border:1px solid var(--color-border);border-radius:4px;font-size:12px;box-sizing:border-box;margin-bottom:4px">
        <div style="font-size:11px;color:var(--color-text-muted)">Tags are advisory labels — they do not grant permissions directly.</div>
      </div>`;

    // Zone 2: Template selector
    const selectedTemplate = currentTemplateId ? State.getTemplate(currentTemplateId) : null;
    const templateOpts = `
      <option value="">— Inherit from Branch/Company —</option>
      ${State.getTemplates().map(t =>
        `<option value="${t.id}" ${t.id === currentTemplateId ? 'selected' : ''}>${t.name}</option>`
      ).join('')}`;

    const zone2 = `
      <div style="padding:12px 16px 0;border-top:1px solid var(--color-border-light)">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:6px">Template</div>
        <select id="panel-template-select" onchange="CompanyPermissionsView._onPanelTemplateChange(this.value)"
                style="width:100%;padding:7px 10px;border:1px solid var(--color-border);border-radius:4px;font-size:13px;margin-bottom:6px">
          ${templateOpts}
        </select>
        <div id="panel-template-desc" style="font-size:12px;color:var(--color-text-secondary);min-height:16px">
          ${selectedTemplate ? selectedTemplate.description : 'Uses the branch or company default template.'}
        </div>
      </div>`;

    // Zone 3: 3-state permission matrix
    const scopes = DEMO_DATA.permissionMatrix.scopes;
    const actions = DEMO_DATA.permissionMatrix.actions;
    const overrides = assignment?.overridePermissions || {};

    const matrixRows = scopes.map(scope => {
      const cells = actions.map(action => {
        const key = `${scope}-${action}`;
        const pendingVal = this._pendingOverrides.hasOwnProperty(key)
          ? this._pendingOverrides[key]
          : (overrides.hasOwnProperty(key) ? overrides[key] : null);

        const grantActive = pendingVal === true ? 'active-grant' : '';
        const denyActive  = pendingVal === false ? 'active-deny' : '';
        const inheritActive = (pendingVal === null || pendingVal === undefined) ? 'active-inherit' : '';

        return `
          <td style="text-align:center;padding:3px">
            <div class="btn-group-3state">
              <button class="${grantActive}" onclick="CompanyPermissionsView._setOverride('${key}', true)" title="Grant">✓</button>
              <button class="${denyActive}"  onclick="CompanyPermissionsView._setOverride('${key}', false)" title="Deny">✗</button>
              <button class="${inheritActive}" onclick="CompanyPermissionsView._setOverride('${key}', null)" title="Inherit">–</button>
            </div>
          </td>`;
      }).join('');
      return `<tr><td style="font-size:11px;padding:3px 6px;white-space:nowrap;color:var(--color-text-secondary)">${scope}</td>${cells}</tr>`;
    }).join('');

    const actionHeaders = actions.map(a =>
      `<th style="font-size:10px;font-weight:600;text-align:center;padding:3px;color:var(--color-text-muted)">${a.replace('/', '/<br>')}</th>`
    ).join('');

    const zone3 = `
      <div style="padding:12px 16px 0;border-top:1px solid var(--color-border-light)">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:8px">Permission Overrides</div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th></th>${actionHeaders}</tr></thead>
            <tbody>${matrixRows}</tbody>
          </table>
        </div>
      </div>`;

    // Zone 4: Effective preview
    const resolved = State.resolvePermissions(userId, this._activeBranchId);
    // Apply pending overrides on top of resolved (for live preview)
    const preview = Object.assign({}, resolved);
    Object.entries(this._pendingOverrides).forEach(([k, v]) => {
      if (v !== null) preview[k] = v;
    });

    const previewRows = scopes.map(scope => {
      const cells = actions.map(action => {
        const key = `${scope}-${action}`;
        const val = preview[key];
        return `<td style="text-align:center;padding:3px">
          <span class="${val ? 'perm-cell-grant' : 'perm-cell-deny'}">${val ? '✓' : '✗'}</span>
        </td>`;
      }).join('');
      return `<tr><td style="font-size:11px;padding:3px 6px;white-space:nowrap;color:var(--color-text-secondary)">${scope}</td>${cells}</tr>`;
    }).join('');

    const zone4 = `
      <div style="padding:12px 16px 0;border-top:1px solid var(--color-border-light)">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:8px">Effective Permissions (Preview)</div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th></th>${actionHeaders}</tr></thead>
            <tbody>${previewRows}</tbody>
          </table>
        </div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">Resolved from: user overrides → branch template → company default. Deny always wins.</div>
      </div>`;

    // Footer
    const footer = `
      <div style="padding:12px 16px;border-top:1px solid var(--color-border);display:flex;gap:8px;justify-content:flex-end;background:var(--color-surface);border-radius:0 0 8px 8px">
        <button class="btn btn-secondary btn-sm" onclick="CompanyPermissionsView._resetToTemplate()">Reset to Template</button>
        <button class="btn btn-secondary btn-sm" onclick="CompanyPermissionsView.closeUserPanel()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="CompanyPermissionsView._saveUserPanel()">Save</button>
      </div>`;

    return `
      <div class="card" style="padding:0;position:sticky;top:20px">
        <div style="padding:14px 16px 10px;border-bottom:1px solid var(--color-border);background:var(--color-surface);border-radius:8px 8px 0 0">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--color-text-muted)">Edit Permissions</div>
        </div>
        ${zone1}${zone2}${zone3}${zone4}${footer}
      </div>`;
  },

  /* ================================================================
     ACTIONS
  ================================================================ */
  drillInto(branchId) {
    this._activeBranchId = branchId;
    this._editingUserId = null;
    this._pendingOverrides = {};
    this._pendingTemplateId = null;
    this._pendingTags = null;
    App.renderView(Router.getCurrentPath());
  },

  openUserPanel(userId) {
    this._editingUserId = userId;
    this._pendingOverrides = {};
    this._pendingTemplateId = null;
    this._pendingTags = null;
    App.renderView(Router.getCurrentPath());
  },

  closeUserPanel() {
    this._editingUserId = null;
    this._pendingOverrides = {};
    this._pendingTemplateId = null;
    this._pendingTags = null;
    App.renderView(Router.getCurrentPath());
  },

  _setOverride(key, value) {
    this._pendingOverrides[key] = value;
    // Re-render just the panel area without full page reload
    App.renderView(Router.getCurrentPath());
  },

  _onPanelTemplateChange(value) {
    this._pendingTemplateId = value || null;
    App.renderView(Router.getCurrentPath());
  },

  _onTagsChange(value) {
    this._pendingTags = value;
    // No re-render needed — just track the value
  },

  _resetToTemplate() {
    const assignment = State.getAssignment(this._editingUserId, this._activeBranchId);
    const templateId = this._pendingTemplateId !== null
      ? this._pendingTemplateId
      : (assignment?.templateId || null);
    this._pendingOverrides = {};
    // Mark all keys as null (inherit) so they show as cleared
    const template = templateId ? State.getTemplate(templateId) : null;
    if (template) {
      DEMO_DATA.permissionMatrix.scopes.forEach(scope => {
        DEMO_DATA.permissionMatrix.actions.forEach(action => {
          const key = `${scope}-${action}`;
          this._pendingOverrides[key] = null;
        });
      });
    }
    App.renderView(Router.getCurrentPath());
  },

  _saveUserPanel() {
    const assignment = State.getAssignment(this._editingUserId, this._activeBranchId);
    const tagsInput = document.getElementById('panel-tags-input');
    const rawTags = tagsInput ? tagsInput.value : (this._pendingTags !== null ? this._pendingTags : (assignment?.tags || []).join(', '));
    const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);

    const templateId = this._pendingTemplateId !== null
      ? this._pendingTemplateId
      : (assignment?.templateId || null);

    // Merge pending overrides: null values mean "clear override"
    const baseOverrides = Object.assign({}, assignment?.overridePermissions || {});
    Object.entries(this._pendingOverrides).forEach(([k, v]) => {
      if (v === null) {
        delete baseOverrides[k];
      } else {
        baseOverrides[k] = v;
      }
    });

    State.upsertAssignment(this._editingUserId, this._activeBranchId, {
      tags,
      templateId,
      overridePermissions: baseOverrides,
    });

    this._editingUserId = null;
    this._pendingOverrides = {};
    this._pendingTemplateId = null;
    this._pendingTags = null;
    App.renderView(Router.getCurrentPath());
  },

  _onBranchTemplateChange(value) {
    const assignments = State.getAssignmentsByBranch(this._activeBranchId);
    const inheritCount = assignments.filter(a => !a.templateId).length;
    const msg = document.getElementById('br-affected-msg');
    if (msg) {
      msg.textContent = value
        ? `${inheritCount} user${inheritCount !== 1 ? 's' : ''} set to Inherit will be updated`
        : `${inheritCount} user${inheritCount !== 1 ? 's' : ''} currently set to Inherit`;
    }
  },

  _saveBranchDefault() {
    const select = document.getElementById('br-template-select');
    const value = select ? select.value : null;
    State.setBranchDefaultTemplate(this._activeBranchId, value || null);
    App.renderView(Router.getCurrentPath());
  },

  _updateModalDesc(templateId) {
    const desc = document.getElementById('co-perm-template-desc');
    if (!desc) return;
    const tmpl = templateId ? State.getTemplate(templateId) : null;
    desc.textContent = tmpl ? tmpl.description : '';
  },

  _openCompanyDefaultModal() {
    const modal = document.getElementById('co-perm-modal');
    if (modal) modal.style.display = 'flex';
  },

  _closeCompanyDefaultModal() {
    const modal = document.getElementById('co-perm-modal');
    if (modal) modal.style.display = 'none';
  },

  _saveCompanyDefault() {
    const select = document.getElementById('co-perm-template-select');
    const value = select ? select.value : null;
    State.setCompanyDefaultTemplate(this._companyId, value || null);
    this._closeCompanyDefaultModal();
    App.renderView(Router.getCurrentPath());
  },
};
