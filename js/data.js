/* ============================================================
   HOMIUM ORIGINATOR FLOW — Demo Data
   All data is static seed data; reset on every page load.
   ============================================================ */

const DEMO_DATA = {

  /* ---- Companies ---- */
  companies: [
    {
      id: 'co-001',
      name: 'Nashville Lending Group',
      nmlsId: '1234567',
      emailDomain: 'nashvillelending.com',
      status: 'active',
      branchCount: 3,
      userCount: 12,
      stateOfIncorporation: 'TN',
      createdAt: '2025-11-03',
      primaryContact: 'Sarah Mitchell',
      programs: ['Standard HEI', 'Jumbo HEI'],
      complianceDocs: ['W-9', 'Broker Agreement', 'E&O Insurance'],
    },
    {
      id: 'co-002',
      name: 'Apex Mortgage Solutions',
      nmlsId: '8901234',
      emailDomain: 'apexmortgage.com',
      status: 'active',
      branchCount: 2,
      userCount: 8,
      stateOfIncorporation: 'TX',
      createdAt: '2025-12-15',
      primaryContact: 'David Torres',
      programs: ['Standard HEI'],
      complianceDocs: ['W-9', 'Broker Agreement'],
    },
    {
      id: 'co-003',
      name: 'Summit Financial Group',
      nmlsId: '5678901',
      emailDomain: 'summitfg.com',
      status: 'pending',
      branchCount: 1,
      userCount: 3,
      stateOfIncorporation: 'CO',
      createdAt: '2026-02-20',
      primaryContact: 'Jennifer Park',
      programs: [],
      complianceDocs: ['W-9'],
    },
  ],

  /* ---- Branches ---- */
  branches: [
    // Nashville Lending Group
    { id: 'br-001', companyId: 'co-001', name: 'Downtown Nashville',    address: '100 Broadway, Nashville, TN 37201', state: 'TN', managingLO: 'user-003', userCount: 4, programs: ['Standard HEI', 'Jumbo HEI'], status: 'active' },
    { id: 'br-002', companyId: 'co-001', name: 'Brentwood Branch',      address: '5500 Maryland Way, Brentwood, TN 37027', state: 'TN', managingLO: 'user-005', userCount: 5, programs: ['Standard HEI'], status: 'active' },
    { id: 'br-003', companyId: 'co-001', name: 'Murfreesboro Branch',   address: '2615 Medical Center Pkwy, Murfreesboro, TN 37129', state: 'TN', managingLO: 'user-007', userCount: 3, programs: ['Standard HEI'], status: 'active' },
    // Apex Mortgage
    { id: 'br-004', companyId: 'co-002', name: 'Austin Main',           address: '301 Congress Ave, Austin, TX 78701', state: 'TX', managingLO: 'user-011', userCount: 5, programs: ['Standard HEI'], status: 'active' },
    { id: 'br-005', companyId: 'co-002', name: 'Dallas Branch',         address: '1700 Pacific Ave, Dallas, TX 75201', state: 'TX', managingLO: 'user-013', userCount: 3, programs: ['Standard HEI'], status: 'active' },
    // Summit Financial
    { id: 'br-006', companyId: 'co-003', name: 'Denver HQ',             address: '1700 Lincoln St, Denver, CO 80203', state: 'CO', managingLO: 'user-016', userCount: 3, programs: [], status: 'pending' },
  ],

  /* ---- Users ---- */
  users: [
    // Homium Staff
    { id: 'user-001', companyId: null,    branchId: null,    firstName: 'Alex',      lastName: 'Morgan',    email: 'alex.morgan@homium.com',        role: 'sys_admin',    onboardingStatus: 'active',            lastLogin: '2026-03-25',  nmlsId: null,      phone: '615-555-0100', title: 'Platform Admin', policies: ['full_access'] },
    { id: 'user-002', companyId: null,    branchId: null,    firstName: 'Jordan',    lastName: 'Lee',       email: 'jordan.lee@homium.com',          role: 'operator',     onboardingStatus: 'active',            lastLogin: '2026-03-24',  nmlsId: null,      phone: '615-555-0101', title: 'Platform Operator', policies: ['platform_ops'] },

    // Nashville Lending Group
    { id: 'user-003', companyId: 'co-001', branchId: 'br-001', firstName: 'Sarah',    lastName: 'Mitchell',  email: 'smitchell@nashvillelending.com',  role: 'prog_admin',   onboardingStatus: 'active',            lastLogin: '2026-03-24',  nmlsId: '2234567', phone: '615-555-0200', title: 'Program Administrator', policies: ['prog_view', 'prog_invite'] },
    { id: 'user-004', companyId: 'co-001', branchId: 'br-001', firstName: 'Marcus',   lastName: 'Johnson',   email: 'mjohnson@nashvillelending.com',   role: 'lo',           onboardingStatus: 'active',            lastLogin: '2026-03-23',  nmlsId: '3345678', phone: '615-555-0201', title: 'Senior Loan Officer', policies: ['lo_standard'] },
    { id: 'user-005', companyId: 'co-001', branchId: 'br-002', firstName: 'Rachel',   lastName: 'Chen',      email: 'rchen@nashvillelending.com',      role: 'lo',           onboardingStatus: 'active',            lastLogin: '2026-03-22',  nmlsId: '4456789', phone: '615-555-0202', title: 'Loan Officer', policies: ['lo_standard'] },
    { id: 'user-006', companyId: 'co-001', branchId: 'br-001', firstName: 'Tyler',    lastName: 'Brooks',    email: 'tbrooks@nashvillelending.com',    role: 'lp',           onboardingStatus: 'active',            lastLogin: '2026-03-21',  nmlsId: null,      phone: '615-555-0203', title: 'Loan Processor', policies: ['lp_standard'] },
    { id: 'user-007', companyId: 'co-001', branchId: 'br-003', firstName: 'Nicole',   lastName: 'Patel',     email: 'npatel@nashvillelending.com',     role: 'lo',           onboardingStatus: 'verification_pending', lastLogin: null,        nmlsId: '5567890', phone: '615-555-0204', title: 'Loan Officer', policies: ['lo_standard'] },
    { id: 'user-008', companyId: 'co-001', branchId: 'br-002', firstName: 'James',    lastName: 'Harrington', email: 'jharrington@nashvillelending.com', role: 'lp',          onboardingStatus: '2fa_complete',     lastLogin: null,          nmlsId: null,      phone: '615-555-0205', title: 'Loan Processor', policies: [] },
    { id: 'user-009', companyId: 'co-001', branchId: 'br-003', firstName: 'Amanda',   lastName: 'Foster',    email: 'afoster@nashvillelending.com',    role: 'lo',           onboardingStatus: 'invited',           lastLogin: null,          nmlsId: null,      phone: null, title: 'Loan Officer', policies: [] },

    // Apex Mortgage
    { id: 'user-010', companyId: 'co-002', branchId: 'br-004', firstName: 'David',    lastName: 'Torres',    email: 'dtorres@apexmortgage.com',        role: 'prog_admin',   onboardingStatus: 'active',            lastLogin: '2026-03-20',  nmlsId: '6678901', phone: '512-555-0300', title: 'Program Administrator', policies: ['prog_view'] },
    { id: 'user-011', companyId: 'co-002', branchId: 'br-004', firstName: 'Luis',     lastName: 'Ramirez',   email: 'lramirez@apexmortgage.com',       role: 'lo',           onboardingStatus: 'active',            lastLogin: '2026-03-19',  nmlsId: '7789012', phone: '512-555-0301', title: 'Senior Loan Officer', policies: ['lo_standard'] },
    { id: 'user-012', companyId: 'co-002', branchId: 'br-004', firstName: 'Angela',   lastName: 'Kim',       email: 'akim@apexmortgage.com',           role: 'lp',           onboardingStatus: 'email_verified',   lastLogin: null,          nmlsId: null,      phone: '512-555-0302', title: 'Loan Processor', policies: [] },
    { id: 'user-013', companyId: 'co-002', branchId: 'br-005', firstName: 'Carlos',   lastName: 'Mendoza',   email: 'cmendoza@apexmortgage.com',       role: 'lo',           onboardingStatus: 'active',            lastLogin: '2026-03-18',  nmlsId: '8890123', phone: '214-555-0303', title: 'Loan Officer', policies: ['lo_standard'] },
    { id: 'user-014', companyId: 'co-002', branchId: 'br-005', firstName: 'Priya',    lastName: 'Sharma',    email: 'psharma@apexmortgage.com',        role: 'lo',           onboardingStatus: 'verification_failed', lastLogin: null,        nmlsId: '9901234', phone: '214-555-0304', title: 'Loan Officer', policies: [] },

    // Summit Financial (in progress onboarding)
    { id: 'user-015', companyId: 'co-003', branchId: 'br-006', firstName: 'Jennifer', lastName: 'Park',      email: 'jpark@summitfg.com',              role: 'prog_admin',   onboardingStatus: '2fa_complete',     lastLogin: null,          nmlsId: '1012345', phone: '720-555-0400', title: 'Program Administrator', policies: [] },
    { id: 'user-016', companyId: 'co-003', branchId: 'br-006', firstName: 'Brian',    lastName: 'Walsh',     email: 'bwalsh@summitfg.com',             role: 'lo',           onboardingStatus: 'verification_pending', lastLogin: null,        nmlsId: '1123456', phone: '720-555-0401', title: 'Loan Officer', policies: [] },
    { id: 'user-017', companyId: 'co-003', branchId: 'br-006', firstName: 'Monica',   lastName: 'Tran',      email: 'mtran@summitfg.com',              role: 'lp',           onboardingStatus: 'invited',           lastLogin: null,          nmlsId: null,      phone: null, title: 'Loan Processor', policies: [] },

    // Investor
    { id: 'user-018', companyId: null,    branchId: null,    firstName: 'Robert',    lastName: 'Huang',     email: 'rhuang@capitalpartners.com',      role: 'investor',     onboardingStatus: 'active',            lastLogin: '2026-03-15',  nmlsId: null,      phone: '212-555-0500', title: 'Accredited Investor', policies: ['investor_view'] },
  ],

  /* ---- Loans / Originations ---- */
  loans: [
    { id: 'ORG-2026-0142', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Kevin & Lisa Stafford', address: '4412 Hillsboro Pike, Nashville, TN 37215', amount: 185000, program: 'Standard HEI', status: 'in_review',    ltv: 72, submittedAt: '2026-03-18', cltv: 76 },
    { id: 'ORG-2026-0138', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Patricia Nguyen',       address: '702 Glendale Ln, Brentwood, TN 37027',   amount: 225000, program: 'Jumbo HEI',    status: 'approved',     ltv: 65, submittedAt: '2026-03-10', cltv: 68 },
    { id: 'ORG-2026-0131', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Thomas & Grace Yoo',    address: '1830 Woodmont Blvd, Nashville, TN 37215', amount: 140000, program: 'Standard HEI', status: 'funded',       ltv: 70, submittedAt: '2026-02-28', cltv: 74 },
    { id: 'ORG-2026-0127', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Michelle Carter',       address: '3309 Granny White Pike, Nashville, TN',   amount: 95000,  program: 'Standard HEI', status: 'draft',        ltv: 68, submittedAt: null,         cltv: 71 },
    { id: 'ORG-2026-0119', companyId: 'co-001', branchId: 'br-002', loId: 'user-005', borrowerName: 'Steve & Amy Larson',    address: '200 Governors Way, Brentwood, TN 37027',  amount: 210000, program: 'Standard HEI', status: 'in_review',    ltv: 74, submittedAt: '2026-03-21', cltv: 78 },
    { id: 'ORG-2026-0114', companyId: 'co-001', branchId: 'br-002', loId: 'user-005', borrowerName: 'Diana Okonkwo',         address: '1055 Mallory Ln, Franklin, TN 37067',     amount: 175000, program: 'Standard HEI', status: 'approved',     ltv: 69, submittedAt: '2026-03-12', cltv: 72 },
    { id: 'ORG-2026-0101', companyId: 'co-002', branchId: 'br-004', loId: 'user-011', borrowerName: 'Frank & Ellen Reyes',   address: '5820 Balcones Dr, Austin, TX 78731',       amount: 300000, program: 'Standard HEI', status: 'funded',       ltv: 60, submittedAt: '2026-02-14', cltv: 63 },
    { id: 'ORG-2026-0098', companyId: 'co-002', branchId: 'br-004', loId: 'user-011', borrowerName: 'Sandra Whitfield',      address: '2401 Barton Creek Blvd, Austin, TX 78735', amount: 275000, program: 'Standard HEI', status: 'in_review',    ltv: 66, submittedAt: '2026-03-17', cltv: 69 },
  ],

  /* ---- Permission Policies ---- */
  policies: [
    { id: 'full_access',   name: 'Full Access',               description: 'Platform-wide CRUD on all objects', roleTarget: 'sys_admin' },
    { id: 'platform_ops',  name: 'Platform Operations',       description: 'Manage orgs, branches, users; no policy editing', roleTarget: 'operator' },
    { id: 'prog_view',     name: 'Program Admin — View',      description: 'View all company objects read-only', roleTarget: 'prog_admin' },
    { id: 'prog_invite',   name: 'Program Admin — Invite',    description: 'Invite new users to company branches', roleTarget: 'prog_admin' },
    { id: 'prog_edit',     name: 'Program Admin — Edit',      description: 'Edit branch info and user profiles', roleTarget: 'prog_admin' },
    { id: 'lo_standard',   name: 'LO Standard',               description: 'Create, edit, submit loan applications in assigned branch', roleTarget: 'lo' },
    { id: 'lo_multi_branch', name: 'LO Multi-Branch',         description: 'LO Standard extended to multiple branches', roleTarget: 'lo' },
    { id: 'lp_standard',   name: 'LP Standard',               description: 'Process and update loan applications in assigned branch', roleTarget: 'lp' },
    { id: 'investor_view', name: 'Investor View',             description: 'View portfolio and investment reports', roleTarget: 'investor' },
  ],

  /* ---- Permission Matrix (base permissions by role) ---- */
  permissionMatrix: {
    actions: ['View', 'Create/Edit', 'Submit/Approve', 'Delete', 'Manage Policies'],
    scopes: ['Platform', 'Company', 'Branch', 'Own Loans'],
    matrix: {
      sys_admin:   { 'Platform-View': true,  'Platform-Create/Edit': true,  'Platform-Submit/Approve': true,  'Platform-Delete': true,  'Platform-Manage Policies': true,  'Company-View': true,  'Company-Create/Edit': true,  'Company-Submit/Approve': true,  'Company-Delete': true,  'Company-Manage Policies': true,  'Branch-View': true,  'Branch-Create/Edit': true,  'Branch-Submit/Approve': true,  'Branch-Delete': true,  'Branch-Manage Policies': true,  'Own Loans-View': true,  'Own Loans-Create/Edit': true,  'Own Loans-Submit/Approve': true,  'Own Loans-Delete': true,  'Own Loans-Manage Policies': false },
      operator:    { 'Platform-View': true,  'Platform-Create/Edit': true,  'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': true,  'Company-Create/Edit': true,  'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': true,  'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': false, 'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false },
      prog_admin:  { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': true,  'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': false, 'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false },
      lo:          { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': false, 'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': true,  'Own Loans-Submit/Approve': true,  'Own Loans-Delete': false, 'Own Loans-Manage Policies': false },
      lp:          { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': false, 'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': true,  'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false },
      investor:    { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': false, 'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': false, 'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': false, 'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false },
    }
  },

  /* ---- Activity Log ---- */
  activityLog: [
    { userId: 'user-001', action: 'invited',     subject: 'Amanda Foster',     subjectType: 'user',    time: '2 hours ago',   companyId: 'co-001' },
    { userId: 'user-001', action: 'created',     subject: 'Summit Financial',  subjectType: 'company', time: '1 day ago',     companyId: 'co-003' },
    { userId: 'user-003', action: 'submitted',   subject: 'ORG-2026-0142',     subjectType: 'loan',    time: '2 days ago',    companyId: 'co-001' },
    { userId: 'user-002', action: 'approved',    subject: 'ORG-2026-0138',     subjectType: 'loan',    time: '3 days ago',    companyId: 'co-001' },
    { userId: 'user-010', action: 'invited',     subject: 'Angela Kim',        subjectType: 'user',    time: '4 days ago',    companyId: 'co-002' },
    { userId: 'user-001', action: 'updated',     subject: 'Apex Mortgage',     subjectType: 'company', time: '5 days ago',    companyId: 'co-002' },
    { userId: 'user-004', action: 'submitted',   subject: 'ORG-2026-0131',     subjectType: 'loan',    time: '1 week ago',    companyId: 'co-001' },
    { userId: 'user-001', action: 'policy updated', subject: 'Sarah Mitchell', subjectType: 'user',    time: '1 week ago',    companyId: 'co-001' },
  ],
};

/* ---- Helper lookups ---- */
const Lookup = {
  company:  (id) => DEMO_DATA.companies.find(c => c.id === id),
  branch:   (id) => DEMO_DATA.branches.find(b => b.id === id),
  user:     (id) => DEMO_DATA.users.find(u => u.id === id),
  policy:   (id) => DEMO_DATA.policies.find(p => p.id === id),

  branchesByCompany: (companyId) => DEMO_DATA.branches.filter(b => b.companyId === companyId),
  usersByCompany:    (companyId) => DEMO_DATA.users.filter(u => u.companyId === companyId),
  usersByBranch:     (branchId)  => DEMO_DATA.users.filter(u => u.branchId === branchId),
  loansByLO:         (loId)      => DEMO_DATA.loans.filter(l => l.loId === loId),
  loansByBranch:     (branchId)  => DEMO_DATA.loans.filter(l => l.branchId === branchId),
  loansByCompany:    (companyId) => DEMO_DATA.loans.filter(l => l.companyId === companyId),
};

/* ---- Display helpers ---- */
const Display = {
  fullName: (user) => `${user.firstName} ${user.lastName}`,
  initials: (user) => `${user.firstName[0]}${user.lastName[0]}`,

  roleName: (role) => ({
    sys_admin:  'System Admin',
    operator:   'Platform Operator',
    prog_admin: 'Program Admin',
    lo:         'Loan Officer',
    lp:         'Loan Processor',
    investor:   'Investor',
  })[role] || role,

  roleClass: (role) => ({
    sys_admin:  'role-sys-admin',
    operator:   'role-operator',
    prog_admin: 'role-prog-admin',
    lo:         'role-lo',
    lp:         'role-lp',
    investor:   'role-investor',
  })[role] || '',

  onboardingStatusLabel: (s) => ({
    invited:              'Invited',
    email_verified:       'Email Verified',
    '2fa_complete':       '2FA Complete',
    verification_pending: 'KYC Pending',
    active:               'Active',
    suspended:            'Suspended',
    verification_failed:  'KYC Failed',
  })[s] || s,

  onboardingStatusClass: (s) => ({
    invited:              'badge-invited',
    email_verified:       'badge-2fa',
    '2fa_complete':       'badge-2fa',
    verification_pending: 'badge-kyc',
    active:               'badge-active',
    suspended:            'badge-suspended',
    verification_failed:  'badge-failed',
  })[s] || 'badge-neutral',

  loanStatusLabel: (s) => ({
    draft:     'Draft',
    in_review: 'In Review',
    approved:  'Approved',
    funded:    'Funded',
    declined:  'Declined',
  })[s] || s,

  loanStatusClass: (s) => ({
    draft:     'badge-neutral',
    in_review: 'badge-invited',
    approved:  'badge-active',
    funded:    'badge-verified',
    declined:  'badge-failed',
  })[s] || 'badge-neutral',

  currency: (n) => n ? '$' + n.toLocaleString() : '—',
  date:     (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
};
