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
  let _poolSummary = JSON.parse(JSON.stringify(DEMO_DATA.poolSummary));
  let _prospectData = JSON.parse(JSON.stringify(DEMO_DATA.prospectData));

  /* ---- RBAC v1.2 mutable seed clones ----
     Round 2 simplification: branches inherit OC enablement; we no longer
     store a separate branch enablement table. The (program × market)
     intersection is an internal validation concept only — surfaces in the
     UI as "Programs Enabled". */
  let _markets          = JSON.parse(JSON.stringify(DEMO_DATA.markets || []));
  let _loanPrograms     = JSON.parse(JSON.stringify(DEMO_DATA.loanPrograms || []));
  let _lpms             = JSON.parse(JSON.stringify(DEMO_DATA.loanProgramMarkets || []));
  let _ocEnablement     = JSON.parse(JSON.stringify(DEMO_DATA.ocEnablement || []));
  const _nmlsLookup     = DEMO_DATA.nmlsCompanyLookup || {};

  let _currentRole = null;  // role key: 'sys_admin' | 'operator' | 'prog_admin' | 'lo' | 'lp' | 'investor'
  let _currentUser = null;  // user object (simulated logged-in user per role)
  let _mode = 'admin';      // 'admin' | 'data'
  let _impersonating = null; // { savedRole, savedUserId } | null
  let _viewMode = 'desktop'; // 'desktop' | 'mobile'
  let _pageModes = {};        // { [pageKey: string]: modeId } — toggle state for new artboard views
  let _atriumScope = [];      // [loanId] — which loans the Atrium workbench shows in its left rail

  const _subscribers = [];

  function notify() {
    _subscribers.forEach(fn => fn());
  }

  /* ---- Role demo users (one per role for the demo) ----
     `scenario14` is the spec §5 stress-test persona — a Standard User
     with multi-branch, mixed per-LO permissions. Uses `lp` role plumbing
     under the hood (Standard User type at branch level per spec §3.2). */
  const DEMO_USERS_BY_ROLE = {
    sys_admin:  'user-001',
    operator:   'user-002',
    prog_admin: 'user-003',
    lo:         'user-004',
    lp:         'user-006',
    scenario14: 'user-100',
    investor:   'user-018',
    investor_prospect: 'user-019',
  };

  return {
    /* ---- Role ---- */
    setRole(role) {
      // `scenario14` is a synthetic persona that maps to a real user (Standard User).
      // Set the role to the user's actual role so existing role-gated paths still work.
      _currentRole = role;
      const uid = DEMO_USERS_BY_ROLE[role];
      _currentUser = _users.find(u => u.id === uid) || null;
      if (role === 'scenario14') _currentRole = _currentUser?.role || 'lp';
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

    /* ---- Page Mode (per-page artboard toggle: 'default' | 'institutional' | 'spatial' | 'atrium' | 'investor') ---- */
    getPageMode(pageKey) { return _pageModes[pageKey] || 'default'; },
    setPageMode(pageKey, mode) { _pageModes[pageKey] = mode; notify(); },

    /* ---- Atrium scope — which loan IDs populate the Atrium workbench's left rail.
         Set to a single id when entering Atrium from a loan-detail page; set to a
         multi-id list when entering from the originations multi-select queue. ---- */
    getAtriumScope() { return [..._atriumScope]; },
    setAtriumScope(ids) { _atriumScope = Array.isArray(ids) ? [...ids] : []; notify(); },

    /* ---- Impersonation ---- */
    startImpersonation(targetUserId) {
      const target = _users.find(u => u.id === targetUserId);
      if (!target) return;
      _impersonating = { savedRole: _currentRole, savedUserId: _currentUser?.id };
      _currentRole = target.role;
      _currentUser = target;
      _mode = ['lo', 'lp', 'investor', 'investor_prospect'].includes(target.role) ? 'data' : 'admin';
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
        investor_prospect: { viewAny: false, editAny: false, deleteAny: false, managePolicy: false, manageCompany: false, manageUsers: false, viewProspect: true },
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
    getLoansByBranch:  (bid) => _loans.filter(l => l.branchId === bid),
    getLoansByCompany: (cid) => _loans.filter(l => l.companyId === cid),
    getLoansForRole: () => {
      const role = State.getRole();
      const user = State.getCurrentUser();
      if (role === 'lp') return State.getLoansByBranch(user?.branchId);
      if (role === 'lo') return State.getLoansByLO(user?.id);
      return [..._loans];
    },

    /* ---- Pool Summary ---- */
    getPoolSummary: () => _poolSummary,

    /* ---- Prospect Data ---- */
    getProspectData: () => _prospectData,

    /* ---- Investor Portfolio ---- */
    getInvestorPortfolio: () => DEMO_DATA.investorPortfolio,

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

    /* ============================================================
       RBAC v1.2 helpers (spec §1–§5)
       ============================================================ */

    /* ---- Markets ---- */
    getMarkets:      () => [..._markets],
    getMarket:       (id) => _markets.find(m => m.id === id),
    getSupportedMarkets: () => _markets.filter(m => m.supported),
    setMarketComingSoon(id, value) {
      const m = _markets.find(x => x.id === id);
      if (m) { m.comingSoon = !!value; notify(); }
    },

    /* ---- Loan Programs ---- */
    getLoanPrograms: () => [..._loanPrograms],
    getLoanProgram:  (id) => _loanPrograms.find(p => p.id === id),
    addLoanProgram(data) {
      const lp = { id: `lp-${Date.now()}`, status: 'active', token: 'HOM', allowedMarketIds: [], ...data };
      _loanPrograms.push(lp);
      // Generate LPM rows for each (program × allowed market) pair
      lp.allowedMarketIds.forEach(mktId => {
        const mkt = _markets.find(m => m.id === mktId);
        if (!mkt) return;
        _lpms.push({ id: `lpm-${lp.id}-${mkt.code}`, programId: lp.id, marketId: mktId });
      });
      notify();
      return lp;
    },
    updateLoanProgramMarkets(programId, allowedMarketIds) {
      const lp = _loanPrograms.find(p => p.id === programId);
      if (!lp) return;
      lp.allowedMarketIds = [...allowedMarketIds];
      // Regenerate LPM rows for this program
      _lpms = _lpms.filter(l => l.programId !== programId);
      lp.allowedMarketIds.forEach(mktId => {
        const mkt = _markets.find(m => m.id === mktId);
        if (mkt) _lpms.push({ id: `lpm-${programId}-${mkt.code}`, programId, marketId: mktId });
      });
      // Cascade: remove LPMs from OC enablement that no longer exist
      const validIds = new Set(_lpms.map(l => l.id));
      _ocEnablement.forEach(e => { e.lpmIds = e.lpmIds.filter(id => validIds.has(id)); });
      notify();
    },

    /* ---- LPMs (LoanProgram-Market pairs) ---- */
    getLPMs: () => [..._lpms],
    getLPM:  (id) => _lpms.find(x => x.id === id),
    getLPMsForProgram: (programId) => _lpms.filter(x => x.programId === programId),
    getLPMsForMarket:  (marketId)  => _lpms.filter(x => x.marketId === marketId),

    /* ---- OC enablement (set by Platform Operator) ---- */
    getOcEnablement(ocId) {
      return [...(_ocEnablement.find(x => x.ocId === ocId)?.lpmIds || [])];
    },
    setOcEnablement(ocId, lpmIds) {
      const idx = _ocEnablement.findIndex(x => x.ocId === ocId);
      const next = [...new Set(lpmIds)];
      if (idx >= 0) _ocEnablement[idx].lpmIds = next;
      else _ocEnablement.push({ ocId, lpmIds: next });
      _auditLog.unshift({
        id: `al-${Date.now()}`,
        actorId: _currentUser?.id,
        action: 'oc_enablement_changed',
        entityType: 'company',
        entityId: ocId,
        detail: `OC enablement set to ${next.length} program-market(s)`,
        timestamp: new Date().toISOString(),
      });
      notify();
    },

    /* ---- Branch enablement (round 2: branches inherit OC enablement) ----
       Spec §6 says self-administer branch enablement is OFF in v1. Returning
       the OC's set keeps internal validation honest while letting the UI
       drop the per-branch matrix entirely. */
    getBranchEnablement(branchId) {
      const branch = _branches.find(b => b.id === branchId);
      if (!branch) return [];
      return State.getOcEnablement(branch.companyId);
    },

    /* ---- NMLS lookup (used by OC onboarding wizard) ----
       Pre-populated table; no live API. */
    nmlsLookupCompany(nmlsId) {
      return _nmlsLookup[String(nmlsId).trim()] || null;
    },
    listNmlsLookupSeeds() {
      return Object.entries(_nmlsLookup).map(([nmlsId, rec]) => ({ nmlsId, name: rec.name, branchCount: rec.branches.length }));
    },

    /* ---- Branch assignments (RBAC v1.2 spec §3) ----
       Returns the user's per-branch assignments. Falls back to a
       synthesized assignment derived from the legacy `role` + `branchId`
       fields when the user predates v1.2. */
    getBranchAssignments(userId) {
      const u = _users.find(x => x.id === userId);
      if (!u) return [];
      if (Array.isArray(u.branchAssignments) && u.branchAssignments.length) {
        return JSON.parse(JSON.stringify(u.branchAssignments));
      }
      // Synthesize a default assignment for legacy users
      if (!u.branchId) return [];
      const isLO = u.role === 'lo';
      const isLP = u.role === 'lp';
      const isPA = u.role === 'prog_admin';
      const userType = isLO ? 'lo' : (isLP || isPA) ? 'standard' : null;
      if (!userType) return [];
      const tuples = [];
      if (isLO) {
        tuples.push({ scope: 'personal', loIds: [], level: 'full', subflags: { canCreate: true, canSubmit: true, canWithdraw: true } });
      } else if (isLP) {
        // Loan Processors default to "all LOs in branch / Can Edit (no subflags)"
        tuples.push({ scope: 'all_los', loIds: [], level: 'edit', subflags: { canCreate: false, canSubmit: false, canWithdraw: false } });
      } else if (isPA) {
        tuples.push({ scope: 'all_los', loIds: [], level: 'view', subflags: {} });
      }
      return [{
        branchId: u.branchId,
        userType,
        flags: { branchManager: false },
        loAssignments: tuples,
        allowNewOriginations: isLO,
        allowAccessToAllBranchActivity: false,
        eligibleLoanProductIds: [],
        synthesized: true,
      }];
    },

    setBranchAssignments(userId, assignments) {
      const u = _users.find(x => x.id === userId);
      if (!u) return;
      u.branchAssignments = JSON.parse(JSON.stringify(assignments));
      notify();
    },

    /* ---- Licenses (LO sub-layer; NMLS-sourced, pre-populated) ---- */
    getUserLicenses(userId) {
      const u = _users.find(x => x.id === userId);
      return u?.licenses ? [...u.licenses] : [];
    },
    setUserLicenseActive(userId, licenseId, active) {
      const u = _users.find(x => x.id === userId);
      if (!u || !u.licenses) return;
      const lic = u.licenses.find(l => l.id === licenseId);
      if (lic) { lic.active = !!active; notify(); }
    },

    /* ---- §1.4 Effective Access Gate ----
       Round 2: branches inherit OC enablement, so the gate is simply
       (OC enablement) ∩ (branch state's market) ∩ (LO licensed markets).
       The branch dimension only contributes its state — programs not
       declared for that market are filtered out so we don't claim a
       branch is enabled for a market it can't legally operate in. */
    effectiveAccess(userId, branchId) {
      const user = _users.find(u => u.id === userId);
      const branch = _branches.find(b => b.id === branchId);
      if (!user || !branch) return { lpmIds: [], blockedBy: { oc: [], branch: [], license: [] } };
      const ocLpms = State.getOcEnablement(branch.companyId);
      const branchMarketCode = branch.state;
      const branchMarket = _markets.find(m => m.code === branchMarketCode);
      // Filter OC-enabled LPMs to those whose market matches the branch's state
      const reachableAtBranch = ocLpms.filter(lpmId => {
        const lpm = _lpms.find(x => x.id === lpmId);
        return lpm && branchMarket && lpm.marketId === branchMarket.id;
      });
      const blockedByBranchState = ocLpms.filter(id => !reachableAtBranch.includes(id));

      const assignments = State.getBranchAssignments(userId);
      const a = assignments.find(x => x.branchId === branchId);
      const isLO = a?.userType === 'lo';
      if (!isLO) {
        // Standard Users not gated by the license dimension
        return {
          lpmIds: reachableAtBranch,
          blockedBy: { oc: [], branch: blockedByBranchState, license: [] },
        };
      }
      const licensedMarkets = new Set((user.licenses || []).filter(l => l.active).map(l => l.marketId));
      const licensed = reachableAtBranch.filter(lpmId => {
        const lpm = _lpms.find(x => x.id === lpmId);
        return lpm && licensedMarkets.has(lpm.marketId);
      });
      return {
        lpmIds: licensed,
        blockedBy: {
          oc: [],
          branch: blockedByBranchState,
          license: reachableAtBranch.filter(id => !licensed.includes(id)),
        },
      };
    },

    /* ---- §3.6 Resolver ----
       Returns the strongest matching tuple for a (user, loan) pair.
       Hard-codes the spec invariants:
         - LO + own loan → Full (short-circuit)
         - BM flag      → minimum View on all-LOs scope */
    resolveAssignmentForLoan(userId, loanId) {
      const loan = _loans.find(l => l.id === loanId);
      const user = _users.find(u => u.id === userId);
      if (!loan || !user) return { level: 'no_access', subflags: {} };
      const a = State.getBranchAssignments(userId).find(x => x.branchId === loan.branchId);
      if (!a) return { level: 'no_access', subflags: {} };
      // §3.6 invariant: LO Full Access on own loans
      if (a.userType === 'lo' && loan.loId === userId) {
        return { level: 'full', subflags: { canCreate: true, canSubmit: true, canWithdraw: true }, source: 'invariant_lo_own' };
      }
      const RANK = { no_access: 0, view: 1, edit: 2, full: 3 };
      // §3.3 invariant: BM minimum View on all branch loans
      const floor = a.flags?.branchManager ? 'view' : 'no_access';
      let best = { level: floor, subflags: {}, source: a.flags?.branchManager ? 'invariant_bm_floor' : 'default' };
      for (const t of (a.loAssignments || [])) {
        const matches =
          (t.scope === 'personal' && loan.loId === userId) ||
          (t.scope === 'specific_los' && (t.loIds || []).includes(loan.loId)) ||
          (t.scope === 'all_los');
        if (!matches) continue;
        if (RANK[t.level] > RANK[best.level]) best = { level: t.level, subflags: t.subflags || {}, source: 'tuple' };
      }
      return best;
    },

    /* ---- §3.6 invariant floor for the tuple editor UI ---- */
    minLevelFloor({ userType, flags, scope, isOwn }) {
      if (userType === 'lo' && (scope === 'personal' || isOwn)) return 'full';
      if (flags?.branchManager && scope === 'all_los') return 'view';
      return 'no_access';
    },

    /* ---- §3.7 Future-grant inheritance ---- */
    hasFutureGrant(userId, branchId) {
      const a = State.getBranchAssignments(userId).find(x => x.branchId === branchId);
      return !!(a?.loAssignments || []).some(t => t.scope === 'all_los');
    },

    /* ---- §3.1 Program Admin (OC-Admin) flag ----
       Round 2: Program Admin is now a stackable flag on the user, not a
       distinct role. Returns true if explicit `isProgramAdmin` is set or
       (for legacy seed data) if `role === 'prog_admin'`. */
    isProgramAdmin(userId) {
      const u = typeof userId === 'string' ? _users.find(x => x.id === userId) : userId;
      if (!u) return false;
      return u.isProgramAdmin === true || u.role === 'prog_admin';
    },

    /* ---- §1.4 + §3.5 Application creation gate ---- */
    canCreateApplication(userId, branchId) {
      const u = _users.find(x => x.id === userId);
      if (!u) return { ok: false, reason: 'unknown', detail: [] };
      const a = State.getBranchAssignments(userId).find(x => x.branchId === branchId);
      if (!a || a.userType !== 'lo') return { ok: false, reason: 'must_be_lo', detail: [] };
      const eff = State.effectiveAccess(userId, branchId);
      if (!eff.lpmIds.length) {
        if (eff.blockedBy.oc.length)      return { ok: false, reason: 'oc_not_enabled',     detail: eff.blockedBy.oc };
        if (eff.blockedBy.branch.length)  return { ok: false, reason: 'branch_not_enabled', detail: eff.blockedBy.branch };
        if (eff.blockedBy.license.length) return { ok: false, reason: 'license_missing',    detail: eff.blockedBy.license };
        return { ok: false, reason: 'unknown', detail: [] };
      }
      const tuple = (a.loAssignments || []).find(t => t.scope === 'personal' || t.scope === 'all_los');
      const canCreate = a.allowNewOriginations !== false &&
        (tuple?.level === 'full' || (tuple?.level === 'edit' && tuple?.subflags?.canCreate));
      return canCreate ? { ok: true } : { ok: false, reason: 'no_can_create', detail: [] };
    },

    /* ---- License expiry helpers ---- */
    getLicenseExpiryStatus(license, today) {
      if (!license) return null;
      const t = today instanceof Date ? today : new Date();
      const renewal = new Date(license.renewalDate);
      const days = Math.ceil((renewal - t) / (1000 * 60 * 60 * 24));
      if (!license.active) return { tier: 'inactive', days };
      if (days < 0)        return { tier: 'expired',  days };
      if (days <= 7)       return { tier: 'critical', days };
      if (days <= 30)      return { tier: 'warning',  days };
      if (days <= 60)      return { tier: 'soon',     days };
      return { tier: 'ok', days };
    },

    /* ---- Permission Resolver (DEPRECATED — use effectiveAccess + resolveAssignmentForLoan) ---- */
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

// Expose State to window so JSX artboards (run in babel-eval scope) can reach it.
window.State = State;
