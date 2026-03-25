/* ============================================================
   HOMIUM ORIGINATOR FLOW — In-Memory State
   All state is session-only. Resets on page refresh.
   ============================================================ */

const State = (() => {
  // Deep-clone demo data so mutations don't affect the original
  let _companies = JSON.parse(JSON.stringify(DEMO_DATA.companies));
  let _branches  = JSON.parse(JSON.stringify(DEMO_DATA.branches));
  let _users     = JSON.parse(JSON.stringify(DEMO_DATA.users));
  let _loans     = JSON.parse(JSON.stringify(DEMO_DATA.loans));
  let _policies  = JSON.parse(JSON.stringify(DEMO_DATA.policies));
  let _matrix    = JSON.parse(JSON.stringify(DEMO_DATA.permissionMatrix));
  let _activity  = JSON.parse(JSON.stringify(DEMO_DATA.activityLog));

  let _currentRole = null;  // role key: 'sys_admin' | 'operator' | 'prog_admin' | 'lo' | 'lp' | 'investor'
  let _currentUser = null;  // user object (simulated logged-in user per role)

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
      notify();
    },
    getRole: () => _currentRole,
    getCurrentUser: () => _currentUser,

    /* ---- Permission helpers ---- */
    can(action) {
      const role = _currentRole;
      const perms = {
        sys_admin:  { viewAny: true,  editAny: true,  deleteAny: true,  managePolicy: true,  manageCompany: true, manageUsers: true  },
        operator:   { viewAny: true,  editAny: true,  deleteAny: false, managePolicy: false, manageCompany: true, manageUsers: true  },
        prog_admin: { viewAny: false, editAny: false, deleteAny: false, managePolicy: false, manageCompany: false, manageUsers: false, viewCompany: true, inviteUsers: true },
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

    /* ---- Activity ---- */
    getActivity: () => [..._activity].slice(0, 20),

    /* ---- Subscriptions ---- */
    subscribe(fn) { _subscribers.push(fn); },
  };
})();
