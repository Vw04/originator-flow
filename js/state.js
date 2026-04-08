/* ============================================================
   HOMIUM ORIGINATOR FLOW — In-Memory State
   All state is session-only. Resets on page refresh.
   ============================================================ */

const State = (() => {
  // Deep-clone demo data so mutations don't affect the original
  let _companies   = JSON.parse(JSON.stringify(DEMO_DATA.companies));
  let _branches    = JSON.parse(JSON.stringify(DEMO_DATA.branches));
  let _users       = JSON.parse(JSON.stringify(DEMO_DATA.users));
  let _loans       = JSON.parse(JSON.stringify(DEMO_DATA.loans));
  let _policies    = JSON.parse(JSON.stringify(DEMO_DATA.policies));
  let _matrix      = JSON.parse(JSON.stringify(DEMO_DATA.permissionMatrix));
  let _activity    = JSON.parse(JSON.stringify(DEMO_DATA.activityLog));
  let _investorEntities = JSON.parse(JSON.stringify(DEMO_DATA.investorEntities));
  let _funds       = JSON.parse(JSON.stringify(DEMO_DATA.funds));
  let _templates   = JSON.parse(JSON.stringify(DEMO_DATA.permissionTemplates));
  let _assignments = JSON.parse(JSON.stringify(DEMO_DATA.branchAssignments));
  let _auditLog    = JSON.parse(JSON.stringify(DEMO_DATA.auditLog));

  let _currentRole = null;  // role key: 'sys_admin' | 'operator' | 'prog_admin' | 'lo' | 'lp' | 'investor'
  let _currentUser = null;  // user object (simulated logged-in user per role)
  let _mode = 'admin';      // 'admin' | 'data'
  let _impersonating = null; // { savedRole, savedUserId } | null
  let _viewMode = 'desktop'; // 'desktop' | 'mobile'

  const _subscribers = [];

  function notify() {
    _subscribers.forEach(fn => fn());
  }

  /* ---- Role demo users (one per role for the demo) ---- */
  const DEMO_USERS_BY_ROLE = {
    sys_admin:  'user-001',
    operator:   'user-002',
    prog_admin: 'user-003',
    lo:         'user-004',
    lp:         'user-006',
    investor:   'user-018',
  };

  return {
    /* ---- Role ---- */
    setRole(role) {
      _currentRole = role;
      const uid = DEMO_USERS_BY_ROLE[role];
      _currentUser = _users.find(u => u.id === uid) || null;
      // Everyone starts in LOP (data) mode; admin sections accessible via nav dropdown
      _mode = 'data';
      _impersonating = null;
      notify();
    },
    getRole: () => _currentRole,
    getCurrentUser: () => _currentUser,

    /* ---- Mode ---- */
    getMode: () => _mode,
    setMode(m) { _mode = m; },

    /* ---- View Mode (desktop | mobile) ---- */
    getViewMode: () => _viewMode,
    setViewMode(m) { _viewMode = m === 'mobile' ? 'mobile' : 'desktop'; notify(); },

    /* ---- Impersonation ---- */
    startImpersonation(targetUserId) {
      const target = _users.find(u => u.id === targetUserId);
      if (!target) return;
      _impersonating = { savedRole: _currentRole, savedUserId: _currentUser?.id };
      _currentRole = target.role;
      _currentUser = target;
      _mode = ['lo', 'lp', 'investor'].includes(target.role) ? 'data' : 'admin';
      notify();
    },
    stopImpersonation() {
      if (!_impersonating) return;
      _currentRole = _impersonating.savedRole;
      _currentUser = _users.find(u => u.id === _impersonating.savedUserId) || null;
      _mode = 'admin';
      _impersonating = null;
      notify();
    },
    isImpersonating: () => !!_impersonating,
    getImpersonationTarget() {
      return _impersonating ? _currentUser : null;
    },

    /* ---- Permission helpers ---- */
    can(action) {
      const role = _currentRole;
      const perms = {
        sys_admin:  { viewAny: true,  editAny: true,  deleteAny: true,  managePolicy: true,  manageCompany: true, manageUsers: true,  viewOnboarding: true,  impersonate: true,  viewOriginationCompanies: true,  viewInvestors: true,  viewPlatformOps: true,  viewSystemConfig: true  },
        operator:   { viewAny: true,  editAny: true,  deleteAny: false, managePolicy: false, manageCompany: true, manageUsers: true,  viewOnboarding: true,  impersonate: true,  viewOriginationCompanies: true,  viewInvestors: true,  viewPlatformOps: true,  viewSystemConfig: true  },
        prog_admin: { viewAny: false, editAny: false, deleteAny: false, managePolicy: false, manageCompany: false, manageUsers: false, viewCompany: true, inviteUsers: true, viewOriginationCompanies: true },
        lo:         { viewAny: false, editAny: false, deleteAny: false, managePolicy: false, manageCompany: false, manageUsers: false, manageLoans: true  },
        lp:         { viewAny: false, editAny: false, deleteAny: false, managePolicy: false, manageCompany: false, manageUsers: false, processLoans: true },
        investor:   { viewAny: false, editAny: false, deleteAny: false, managePolicy: false, manageCompany: false, manageUsers: false, viewPortfolio: true },
      };
      return !!(perms[role] && perms[role][action]);
    },

    /* ---- Companies ---- */
    getCompanies: () => [..._companies],
    getCompany:   (id) => _companies.find(c => c.id === id),

    addCompany(data) {
      const company = { id: `co-${Date.now()}`, branchCount: 0, userCount: 0, status: 'pending', createdAt: new Date().toISOString().split('T')[0], programs: [], complianceDocs: [], ...data };
      _companies.push(company);
      _activity.unshift({ userId: _currentUser?.id, action: 'created', subject: company.name, subjectType: 'company', time: 'just now', companyId: company.id });
      notify();
      return company;
    },

    updateCompany(id, data) {
      const idx = _companies.findIndex(c => c.id === id);
      if (idx >= 0) { _companies[idx] = { ..._companies[idx], ...data }; notify(); }
    },

    /* ---- Branches ---- */
    getBranches:          () => [..._branches],
    getBranch:            (id) => _branches.find(b => b.id === id),
    getBranchesByCompany: (cid) => _branches.filter(b => b.companyId === cid),

    addBranch(data) {
      const branch = { id: `br-${Date.now()}`, userCount: 0, programs: [], status: 'active', ...data };
      _branches.push(branch);
      const co = _companies.find(c => c.id === data.companyId);
      if (co) co.branchCount = (_branches.filter(b => b.companyId === co.id)).length;
      notify();
      return branch;
    },

    updateBranch(id, data) {
      const idx = _branches.findIndex(b => b.id === id);
      if (idx >= 0) { _branches[idx] = { ..._branches[idx], ...data }; notify(); }
    },

    /* ---- Users ---- */
    getUsers:           () => [..._users],
    getUser:            (id) => _users.find(u => u.id === id),
    getUsersByCompany:  (cid) => _users.filter(u => u.companyId === cid),
    getUsersByBranch:   (bid) => _users.filter(u => u.branchId === bid),

    inviteUser(data) {
      const user = {
        id: `user-${Date.now()}`,
        onboardingStatus: 'invited',
        lastLogin: null,
        policies: [],
        ...data,
      };
      _users.push(user);
      const co = _companies.find(c => c.id === data.companyId);
      if (co) co.userCount = (_users.filter(u => u.companyId === co.id)).length;
      _activity.unshift({ userId: _currentUser?.id, action: 'invited', subject: `${data.firstName} ${data.lastName}`, subjectType: 'user', time: 'just now', companyId: data.companyId });
      notify();
      return user;
    },

    updateUser(id, data) {
      const idx = _users.findIndex(u => u.id === id);
      if (idx >= 0) {
        _users[idx] = { ..._users[idx], ...data };
        notify();
      }
    },

    advanceOnboarding(id) {
      const user = _users.find(u => u.id === id);
      if (!user) return;
      const seq = ['invited', 'email_verified', '2fa_complete', 'verification_pending', 'active'];
      const idx = seq.indexOf(user.onboardingStatus);
      if (user.role !== 'lo' && user.onboardingStatus === '2fa_complete') {
        user.onboardingStatus = 'active';
      } else if (idx >= 0 && idx < seq.length - 1) {
        user.onboardingStatus = seq[idx + 1];
      }
      _activity.unshift({ userId: _currentUser?.id, action: 'status updated', subject: `${user.firstName} ${user.lastName}`, subjectType: 'user', time: 'just now', companyId: user.companyId });
      notify();
    },

    suspendUser(id) {
      const user = _users.find(u => u.id === id);
      if (user) { user.onboardingStatus = 'suspended'; notify(); }
    },

    /* ---- Loans ---- */
    getLoans:          () => [..._loans],
    getLoan:           (id) => _loans.find(l => l.id === id),
    getLoansByLO:      (uid) => _loans.filter(l => l.loId === uid),
    getLoansByCompany: (cid) => _loans.filter(l => l.companyId === cid),

    /* ---- Policies / Permissions ---- */
    getPolicies: () => [..._policies],
    getMatrix:   () => JSON.parse(JSON.stringify(_matrix)),

    setPermission(role, scope, action, value) {
      const key = `${scope}-${action}`;
      if (!_matrix.matrix[role]) _matrix.matrix[role] = {};
      _matrix.matrix[role][key] = value;
      notify();
    },

    assignPolicy(userId, policyId) {
      const user = _users.find(u => u.id === userId);
      if (user && !user.policies.includes(policyId)) {
        user.policies.push(policyId);
        _activity.unshift({ userId: _currentUser?.id, action: 'policy updated', subject: `${user.firstName} ${user.lastName}`, subjectType: 'user', time: 'just now', companyId: user.companyId });
        notify();
      }
    },

    removePolicy(userId, policyId) {
      const user = _users.find(u => u.id === userId);
      if (user) {
        user.policies = user.policies.filter(p => p !== policyId);
        notify();
      }
    },

    addPolicy(data) {
      const policy = { id: `policy-${Date.now()}`, ...data };
      _policies.push(policy);
      notify();
      return policy;
    },
    updatePolicy(id, data) {
      const p = _policies.find(p => p.id === id);
      if (p) { Object.assign(p, data); notify(); }
    },

    deletePolicy(id) {
      _policies = _policies.filter(p => p.id !== id);
      // Remove policy from all users
      _users.forEach(u => { u.policies = u.policies.filter(pid => pid !== id); });
      notify();
    },

    /* ---- Investors & Funds ---- */
    getInvestorEntities: () => [..._investorEntities],
    getFunds:            () => [..._funds],
    getPlatformUsers:    () => _users.filter(u => !u.companyId && u.role !== 'investor'),
    getInvestorUsers:    () => _users.filter(u => u.role === 'investor'),

    /* ---- Activity ---- */
    getActivity: () => [..._activity].slice(0, 20),

    /* ---- Permission Templates ---- */
    getTemplates: () => [..._templates],
    getTemplate:  (id) => _templates.find(t => t.id === id),

    /* ---- Branch Assignments ---- */
    getAssignmentsByBranch: (branchId) => _assignments.filter(a => a.branchId === branchId),
    getAssignmentsByUser:   (userId)   => _assignments.filter(a => a.userId === userId),
    getAssignment:          (userId, branchId) => _assignments.find(a => a.userId === userId && a.branchId === branchId),

    upsertAssignment(userId, branchId, data) {
      const idx = _assignments.findIndex(a => a.userId === userId && a.branchId === branchId);
      if (idx >= 0) {
        _assignments[idx] = { ..._assignments[idx], ...data };
      } else {
        _assignments.push({ id: `ba-${Date.now()}`, userId, branchId, tags: [], templateId: null, overridePermissions: {}, ...data });
      }
      const actor = _currentUser;
      const user = _users.find(u => u.id === userId);
      _auditLog.unshift({
        id: `al-${Date.now()}`,
        actorId: actor?.id,
        action: 'override_set',
        entityType: 'user',
        entityId: userId,
        detail: `${actor?.firstName || 'Admin'} updated permissions for ${user?.firstName} ${user?.lastName} in branch`,
        timestamp: new Date().toISOString(),
      });
      notify();
    },

    setCompanyDefaultTemplate(companyId, templateId) {
      const co = _companies.find(c => c.id === companyId);
      if (!co) return;
      co.defaultPermissionTemplateId = templateId || null;
      const actor = _currentUser;
      const tmpl = _templates.find(t => t.id === templateId);
      _auditLog.unshift({
        id: `al-${Date.now()}`,
        actorId: actor?.id,
        action: 'company_default_changed',
        entityType: 'company',
        entityId: companyId,
        detail: `${actor?.firstName || 'Admin'} set company default to "${tmpl ? tmpl.name : 'None'}"`,
        timestamp: new Date().toISOString(),
      });
      notify();
    },

    setBranchDefaultTemplate(branchId, templateId) {
      const br = _branches.find(b => b.id === branchId);
      if (!br) return;
      br.defaultPermissionTemplateId = templateId || null;
      const actor = _currentUser;
      const tmpl = _templates.find(t => t.id === templateId);
      _auditLog.unshift({
        id: `al-${Date.now()}`,
        actorId: actor?.id,
        action: 'branch_default_changed',
        entityType: 'branch',
        entityId: branchId,
        detail: `${actor?.firstName || 'Admin'} set branch default to "${tmpl ? tmpl.name : 'Inherit from Company'}"`,
        timestamp: new Date().toISOString(),
      });
      notify();
    },

    /* ---- Permission Resolver ---- */
    resolvePermissions(userId, branchId) {
      const branch = _branches.find(b => b.id === branchId);
      if (!branch) return {};
      const company = _companies.find(c => c.id === branch.companyId);
      const assignment = _assignments.find(a => a.userId === userId && a.branchId === branchId);

      const allKeys = [];
      DEMO_DATA.permissionMatrix.scopes.forEach(scope => {
        DEMO_DATA.permissionMatrix.actions.forEach(action => {
          allKeys.push(`${scope}-${action}`);
        });
      });

      const result = {};
      allKeys.forEach(key => {
        // Layer 1: company default template
        const coTemplateId = company?.defaultPermissionTemplateId;
        const coTemplate = coTemplateId ? _templates.find(t => t.id === coTemplateId) : null;
        let resolved = coTemplate ? (coTemplate.defaultMatrix[key] ?? null) : null;

        // Layer 2: branch default template (overrides company if set)
        const brTemplateId = branch?.defaultPermissionTemplateId;
        const brTemplate = brTemplateId ? _templates.find(t => t.id === brTemplateId) : null;
        if (brTemplate) {
          const brVal = brTemplate.defaultMatrix[key] ?? null;
          if (brVal !== null) resolved = brVal;
        }

        // Layer 3: user assignment template, then overrides
        if (assignment) {
          const uTemplateId = assignment.templateId;
          const uTemplate = uTemplateId ? _templates.find(t => t.id === uTemplateId) : null;
          if (uTemplate) {
            const uVal = uTemplate.defaultMatrix[key] ?? null;
            if (uVal !== null) resolved = uVal;
          }
          const override = assignment.overridePermissions[key];
          if (override !== undefined && override !== null) resolved = override;
        }

        // Deny-wins: any explicit false overrides everything
        if (resolved === null) resolved = false; // no permission if unresolved
        result[key] = resolved;
      });

      return result;
    },

    /* ---- Audit Log ---- */
    getAuditLogByCompany(companyId) {
      const branchIds = new Set(_branches.filter(b => b.companyId === companyId).map(b => b.id));
      const userIds   = new Set(_users.filter(u => u.companyId === companyId).map(u => u.id));
      return _auditLog.filter(e =>
        (e.entityType === 'company' && e.entityId === companyId) ||
        (e.entityType === 'branch'  && branchIds.has(e.entityId)) ||
        (e.entityType === 'user'    && userIds.has(e.entityId))
      ).slice(0, 8);
    },

    /* ---- Subscriptions ---- */
    subscribe(fn) { _subscribers.push(fn); },
  };
})();
