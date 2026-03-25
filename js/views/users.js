/* ============================================================
   HOMIUM ORIGINATOR FLOW — Users View
   ============================================================ */

const UsersView = {
  _filter: { search: '', role: '', status: '', branchId: '', companyId: '' },

  render() {
    const role      = State.getRole();
    const currentUser = State.getCurrentUser();
    const canEdit   = State.can('manageUsers') || State.can('editAny');
    const canInvite = canEdit || role === 'prog_admin';

    // Scope users to company for prog_admin
    let users = State.getUsers().filter(u => u.companyId); // exclude Homium staff from list
    if (role === 'prog_admin' && currentUser?.companyId) {
      users = users.filter(u => u.companyId === currentUser.companyId);
    }

    // Apply filters
    const f = this._filter;
    if (f.search) {
      const q = f.search.toLowerCase();
      users = users.filter(u =>
        Display.fullName(u).toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (f.role)      users = users.filter(u => u.role === f.role);
    if (f.status)    users = users.filter(u => u.onboardingStatus === f.status);
    if (f.branchId)  users = users.filter(u => u.branchId === f.branchId);
    if (f.companyId) users = users.filter(u => u.companyId === f.companyId);

    // Branch options for filter
    let branches = State.getBranches();
    if (role === 'prog_admin' && currentUser?.companyId) {
      branches = branches.filter(b => b.companyId === currentUser.companyId);
    }
    const companies = State.getCompanies();

    const rows = users.map(u => {
      const co = State.getCompany(u.companyId);
      const br = State.getBranch(u.branchId);
      return `
        <tr class="clickable" onclick="ProfileView.open('${u.id}')">
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar avatar-sm" style="background:${avatarColor(u.role)}">${Display.initials(u)}</div>
              <div>
                <div class="cell-primary">${Display.fullName(u)}</div>
                <div class="cell-secondary">${u.email}</div>
              </div>
            </div>
          </td>
          <td><span class="role-chip ${Display.roleClass(u.role)}">${Display.roleName(u.role)}</span></td>
          ${role !== 'prog_admin' ? `<td class="text-secondary">${co ? co.name : '—'}</td>` : ''}
          <td class="text-secondary">${br ? br.name : '—'}</td>
          <td><span class="status-pill ${Display.onboardingStatusClass(u.onboardingStatus)}"><span class="status-dot"></span>${Display.onboardingStatusLabel(u.onboardingStatus)}</span></td>
          <td class="text-secondary">${u.lastLogin ? Display.date(u.lastLogin) : '<span class="text-muted">Never</span>'}</td>
        </tr>`;
    }).join('');

    const branchOptions = branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    const companyOptions = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    return `
      <div class="page-header">
        <div class="page-header-left">
          <div>
            <div class="page-title">Users</div>
            <div class="page-subtitle">${users.length} user${users.length !== 1 ? 's' : ''} shown</div>
          </div>
        </div>
        <div class="page-header-actions">
          ${canInvite ? `<button class="btn btn-primary btn-sm" onclick="UsersView.openInviteModal()">+ Invite User</button>` : ''}
        </div>
      </div>

      <div class="page-body">
        <div class="table-container">
          <div class="table-toolbar">
            <input type="text" class="input input-sm input-search" style="width:220px" placeholder="Search users…"
              value="${f.search}" oninput="UsersView.setFilter('search', this.value)" />
            <select class="filter-select" onchange="UsersView.setFilter('role', this.value)">
              <option value="">All Roles</option>
              <option value="prog_admin" ${f.role==='prog_admin'?'selected':''}>Program Admin</option>
              <option value="lo" ${f.role==='lo'?'selected':''}>Loan Officer</option>
              <option value="lp" ${f.role==='lp'?'selected':''}>Loan Processor</option>
              <option value="investor" ${f.role==='investor'?'selected':''}>Investor</option>
            </select>
            <select class="filter-select" onchange="UsersView.setFilter('status', this.value)">
              <option value="">All Statuses</option>
              <option value="active" ${f.status==='active'?'selected':''}>Active</option>
              <option value="invited" ${f.status==='invited'?'selected':''}>Invited</option>
              <option value="email_verified" ${f.status==='email_verified'?'selected':''}>Email Verified</option>
              <option value="2fa_complete" ${f.status==='2fa_complete'?'selected':''}>2FA Complete</option>
              <option value="verification_pending" ${f.status==='verification_pending'?'selected':''}>KYC Pending</option>
              <option value="verification_failed" ${f.status==='verification_failed'?'selected':''}>KYC Failed</option>
              <option value="suspended" ${f.status==='suspended'?'selected':''}>Suspended</option>
            </select>
            ${role !== 'prog_admin' ? `
              <select class="filter-select" onchange="UsersView.setFilter('companyId', this.value)">
                <option value="">All Orgs</option>${companyOptions}
              </select>` : ''}
            <select class="filter-select" onchange="UsersView.setFilter('branchId', this.value)">
              <option value="">All Branches</option>${branchOptions}
            </select>
            ${Object.values(f).some(v=>v) ? `<button class="btn btn-ghost btn-sm" onclick="UsersView.clearFilters()">Clear</button>` : ''}
          </div>

          ${users.length ? `
            <table>
              <thead><tr>
                <th>User</th>
                <th>Role</th>
                ${role !== 'prog_admin' ? '<th>Organization</th>' : ''}
                <th>Branch</th>
                <th>Status</th>
                <th>Last Login</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="table-footer">
              <span class="table-count">${users.length} user${users.length !== 1 ? 's' : ''}</span>
            </div>` : `
            <div class="table-empty">
              <div class="table-empty-icon"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="15" cy="12" r="6"/><path d="M2 35c0-7.18 5.82-13 13-13s13 5.82 13 13"/><circle cx="30" cy="12" r="5"/><path d="M38 34c0-5.52-3.58-10.23-8.5-11.85"/></svg></div>
              <p>No users match your filters.</p>
              ${Object.values(f).some(v=>v) ? `<button class="btn btn-secondary btn-sm" onclick="UsersView.clearFilters()">Clear filters</button>` : ''}
            </div>`}
        </div>
      </div>

      <div id="modal-container"></div>
      <div id="panel-container"></div>`;
  },

  setFilter(key, value) {
    this._filter[key] = value;
    App.renderView('/users');
  },

  clearFilters() {
    this._filter = { search: '', role: '', status: '', branchId: '', companyId: '' };
    App.renderView('/users');
  },

  advanceStatus(userId) {
    State.advanceOnboarding(userId);
    App.renderView('/users');
  },

  openInviteModal() {
    const role      = State.getRole();
    const currentUser = State.getCurrentUser();
    const companies = State.getCompanies();
    const branches  = State.getBranches();

    const companyOptions = companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    // For prog_admin, pre-select company and only show their branches
    const isProgAdmin = role === 'prog_admin';
    const filteredBranches = isProgAdmin && currentUser?.companyId
      ? branches.filter(b => b.companyId === currentUser.companyId)
      : branches;

    const branchOptions = filteredBranches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    document.getElementById('modal-container').innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)UsersView.closeModal()">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">Invite User</div>
              <div class="modal-subtitle">An email with a magic link will be sent to the user</div>
            </div>
            <button class="modal-close" onclick="UsersView.closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="system-note">
              <span class="system-note-icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="12" height="9" rx="1"/><path d="M1 3l6 5 6-5"/></svg></span>
              <span>After submitting, the system will send a welcome email with a magic link. The user will follow the link to complete email verification and set up their account.</span>
            </div>

            <div class="form-grid" style="margin-top:16px">
              <div class="form-group">
                <label>First Name *</label>
                <input class="input" id="invite-first" placeholder="Jane" />
              </div>
              <div class="form-group">
                <label>Last Name *</label>
                <input class="input" id="invite-last" placeholder="Smith" />
              </div>
              <div class="form-group form-full">
                <label>Email Address *</label>
                <input class="input" id="invite-email" placeholder="jane.smith@company.com" type="email" />
                <div class="form-hint">Must match the company's registered email domain</div>
              </div>
              <div class="form-group">
                <label>Role *</label>
                <select class="select-input" id="invite-role">
                  <option value="">Select role…</option>
                  <option value="prog_admin">Program Administrator</option>
                  <option value="lo">Loan Officer</option>
                  <option value="lp">Loan Processor</option>
                </select>
              </div>
              <div class="form-group">
                <label>Title</label>
                <input class="input" id="invite-title" placeholder="e.g. Senior Loan Officer" />
              </div>
              ${!isProgAdmin ? `
              <div class="form-group">
                <label>Organization *</label>
                <select class="select-input" id="invite-company" onchange="UsersView.updateBranchOptions(this.value)">
                  <option value="">Select org…</option>${companyOptions}
                </select>
              </div>` : `<input type="hidden" id="invite-company" value="${currentUser?.companyId || ''}" />`}
              <div class="form-group">
                <label>Branch *</label>
                <select class="select-input" id="invite-branch">
                  <option value="">Select branch…</option>${branchOptions}
                </select>
              </div>
              <div class="form-group">
                <label>NMLS ID</label>
                <input class="input" id="invite-nmls" placeholder="e.g. 1234567" />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input class="input" id="invite-phone" placeholder="615-555-0000" type="tel" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UsersView.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="UsersView.submitInvite()">Send Invite</button>
          </div>
        </div>
      </div>`;
  },

  updateBranchOptions(companyId) {
    const select = document.getElementById('invite-branch');
    if (!select) return;
    const branches = State.getBranches().filter(b => b.companyId === companyId);
    select.innerHTML = '<option value="">Select branch…</option>' +
      branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  },

  submitInvite() {
    const firstName = document.getElementById('invite-first')?.value.trim();
    const lastName  = document.getElementById('invite-last')?.value.trim();
    const email     = document.getElementById('invite-email')?.value.trim();
    const role      = document.getElementById('invite-role')?.value;
    const companyId = document.getElementById('invite-company')?.value;
    const branchId  = document.getElementById('invite-branch')?.value;
    const title     = document.getElementById('invite-title')?.value.trim();
    const nmlsId    = document.getElementById('invite-nmls')?.value.trim();
    const phone     = document.getElementById('invite-phone')?.value.trim();

    if (!firstName || !lastName || !email || !role || !companyId || !branchId) {
      alert('Please fill in all required fields.');
      return;
    }

    State.inviteUser({ firstName, lastName, email, role, companyId, branchId, title, nmlsId: nmlsId || null, phone: phone || null });
    this.closeModal();
    this.showSuccess(`Invite sent to ${email}`);
    App.renderView('/users');
  },

  closeModal() {
    const mc = document.getElementById('modal-container');
    if (mc) mc.innerHTML = '';
  },

  showSuccess(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#16A34A;color:#fff;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideUp 0.2s ease';
    toast.textContent = '✓ ' + message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },
};

/* Color per role for avatars */
function avatarColor(role) {
  return { sys_admin:'#3730A3', operator:'#BE123C', prog_admin:'#15803D', lo:'#1D4ED8', lp:'#854D0E', investor:'#7C3AED' }[role] || '#1B3564';
}
