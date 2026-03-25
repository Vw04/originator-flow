/* ============================================================
   HOMIUM ORIGINATOR FLOW — Demo Data
   All data is static seed data; reset on every page load.
   ============================================================ */

const DEMO_DATA = {

  /* ---- Companies ---- */
  companies: [
    {
      id: 'co-001',
      name: 'Capital City Lending',
      nmlsId: '2045871',
      emailDomain: 'capitalcitylending.com',
      status: 'active',
      branchCount: 3,
      userCount: 10,
      stateOfIncorporation: 'DC',
      createdAt: '2025-10-14',
      primaryContact: 'Patricia Owens',
      programs: ['DC Dream Fund'],
      complianceDocs: ['W-9', 'Broker Agreement', 'E&O Insurance'],
    },
    {
      id: 'co-002',
      name: 'Bluegrass Home Finance',
      nmlsId: '3178904',
      emailDomain: 'bluegrasshomefinance.com',
      status: 'active',
      branchCount: 2,
      userCount: 7,
      stateOfIncorporation: 'KY',
      createdAt: '2025-12-02',
      primaryContact: 'Marcus Webb',
      programs: ['Kentucky Dream Fund'],
      complianceDocs: ['W-9', 'Broker Agreement'],
    },
    {
      id: 'co-003',
      name: 'Commonwealth Mortgage Group',
      nmlsId: '4290136',
      emailDomain: 'commonwealthmortgage.com',
      status: 'pending',
      branchCount: 1,
      userCount: 3,
      stateOfIncorporation: 'KY',
      createdAt: '2026-02-10',
      primaryContact: 'Sandra Hollis',
      programs: [],
      complianceDocs: ['W-9'],
    },
  ],

  /* ---- Branches ---- */
  branches: [
    // Capital City Lending (DC)
    { id: 'br-001', companyId: 'co-001', name: 'Downtown DC',           address: '1100 New York Ave NW, Washington, DC 20005',  state: 'DC', managingLO: 'user-003', userCount: 4, programs: ['DC Dream Fund'], status: 'active',  parentBranchId: null },
    { id: 'br-002', companyId: 'co-001', name: 'Capitol Hill Branch',   address: '320 First St SE, Washington, DC 20003',        state: 'DC', managingLO: 'user-005', userCount: 4, programs: ['DC Dream Fund'], status: 'active',  parentBranchId: null },
    { id: 'br-003', companyId: 'co-001', name: 'Adams Morgan Office',   address: '1785 Columbia Rd NW, Washington, DC 20009',    state: 'DC', managingLO: null,       userCount: 2, programs: ['DC Dream Fund'], status: 'active',  parentBranchId: 'br-001' },

    // Bluegrass Home Finance (KY)
    { id: 'br-004', companyId: 'co-002', name: 'Louisville HQ',         address: '400 W Market St, Louisville, KY 40202',        state: 'KY', managingLO: 'user-011', userCount: 4, programs: ['Kentucky Dream Fund'], status: 'active',  parentBranchId: null },
    { id: 'br-005', companyId: 'co-002', name: 'Lexington Branch',      address: '200 W Vine St, Lexington, KY 40507',           state: 'KY', managingLO: null,       userCount: 3, programs: ['Kentucky Dream Fund'], status: 'active',  parentBranchId: null },

    // Commonwealth Mortgage Group (KY)
    { id: 'br-006', companyId: 'co-003', name: 'Frankfort Office',      address: '702 Capital Ave, Frankfort, KY 40601',         state: 'KY', managingLO: 'user-016', userCount: 3, programs: [], status: 'pending', parentBranchId: null },
  ],

  /* ---- Users ---- */
  users: [
    // Homium Staff
    { id: 'user-001', companyId: null,     branchId: null,    firstName: 'Alex',      lastName: 'Morgan',    email: 'alex.morgan@homium.com',               role: 'sys_admin',  onboardingStatus: 'active',               lastLogin: '2026-03-25', nmlsId: null,      phone: '202-555-0100', title: 'Platform Admin',          policies: ['full_access'] },
    { id: 'user-002', companyId: null,     branchId: null,    firstName: 'Jordan',    lastName: 'Lee',       email: 'jordan.lee@homium.com',                role: 'operator',   onboardingStatus: 'active',               lastLogin: '2026-03-24', nmlsId: null,      phone: '202-555-0101', title: 'Platform Operator',       policies: ['platform_ops'] },

    // Capital City Lending
    { id: 'user-003', companyId: 'co-001', branchId: 'br-001', firstName: 'Patricia', lastName: 'Owens',     email: 'powens@capitalcitylending.com',         role: 'prog_admin', onboardingStatus: 'active',               lastLogin: '2026-03-24', nmlsId: '2145678', phone: '202-555-0200', title: 'Program Administrator',  policies: ['prog_view', 'prog_invite'] },
    { id: 'user-004', companyId: 'co-001', branchId: 'br-001', firstName: 'James',    lastName: 'Okafor',    email: 'jokafor@capitalcitylending.com',        role: 'lo',         onboardingStatus: 'active',               lastLogin: '2026-03-23', nmlsId: '3256789', phone: '202-555-0201', title: 'Senior Loan Officer',    policies: ['lo_standard'] },
    { id: 'user-005', companyId: 'co-001', branchId: 'br-002', firstName: 'Dana',     lastName: 'Holloway',  email: 'dholloway@capitalcitylending.com',      role: 'lo',         onboardingStatus: 'active',               lastLogin: '2026-03-22', nmlsId: '4367890', phone: '202-555-0202', title: 'Loan Officer',           policies: ['lo_standard'] },
    { id: 'user-006', companyId: 'co-001', branchId: 'br-001', firstName: 'Kevin',    lastName: 'Park',      email: 'kpark@capitalcitylending.com',          role: 'lp',         onboardingStatus: 'active',               lastLogin: '2026-03-21', nmlsId: null,      phone: '202-555-0203', title: 'Loan Processor',         policies: ['lp_standard'] },
    { id: 'user-007', companyId: 'co-001', branchId: 'br-003', firstName: 'Alicia',   lastName: 'Grant',     email: 'agrant@capitalcitylending.com',         role: 'lo',         onboardingStatus: 'verification_pending', lastLogin: null,         nmlsId: '5478901', phone: '202-555-0204', title: 'Loan Officer',           policies: ['lo_standard'] },
    { id: 'user-008', companyId: 'co-001', branchId: 'br-002', firstName: 'DeShawn',  lastName: 'Carter',    email: 'dcarter@capitalcitylending.com',        role: 'lp',         onboardingStatus: '2fa_complete',         lastLogin: null,         nmlsId: null,      phone: '202-555-0205', title: 'Loan Processor',         policies: [] },
    { id: 'user-009', companyId: 'co-001', branchId: 'br-003', firstName: 'Yolanda',  lastName: 'Simmons',   email: 'ysimmons@capitalcitylending.com',       role: 'lo',         onboardingStatus: 'invited',              lastLogin: null,         nmlsId: null,      phone: null,           title: 'Loan Officer',           policies: [] },

    // Bluegrass Home Finance
    { id: 'user-010', companyId: 'co-002', branchId: 'br-004', firstName: 'Marcus',   lastName: 'Webb',      email: 'mwebb@bluegrasshomefinance.com',        role: 'prog_admin', onboardingStatus: 'active',               lastLogin: '2026-03-20', nmlsId: '6589012', phone: '502-555-0300', title: 'Program Administrator',  policies: ['prog_view'] },
    { id: 'user-011', companyId: 'co-002', branchId: 'br-004', firstName: 'Tamara',   lastName: 'Fletcher',  email: 'tfletcher@bluegrasshomefinance.com',    role: 'lo',         onboardingStatus: 'active',               lastLogin: '2026-03-19', nmlsId: '7690123', phone: '502-555-0301', title: 'Senior Loan Officer',    policies: ['lo_standard'] },
    { id: 'user-012', companyId: 'co-002', branchId: 'br-004', firstName: 'Garrett',  lastName: 'Nichols',   email: 'gnichols@bluegrasshomefinance.com',     role: 'lp',         onboardingStatus: 'email_verified',       lastLogin: null,         nmlsId: null,      phone: '502-555-0302', title: 'Loan Processor',         policies: [] },
    { id: 'user-013', companyId: 'co-002', branchId: 'br-005', firstName: 'Renee',    lastName: 'Colbert',   email: 'rcolbert@bluegrasshomefinance.com',     role: 'lo',         onboardingStatus: 'active',               lastLogin: '2026-03-18', nmlsId: '8701234', phone: '859-555-0303', title: 'Loan Officer',           policies: ['lo_standard'] },
    { id: 'user-014', companyId: 'co-002', branchId: 'br-005', firstName: 'Darnell',  lastName: 'Booker',    email: 'dbooker@bluegrasshomefinance.com',      role: 'lo',         onboardingStatus: 'verification_failed',  lastLogin: null,         nmlsId: '9812345', phone: '859-555-0304', title: 'Loan Officer',           policies: [] },

    // Commonwealth Mortgage Group (KY — in progress)
    { id: 'user-015', companyId: 'co-003', branchId: 'br-006', firstName: 'Sandra',   lastName: 'Hollis',    email: 'shollis@commonwealthmortgage.com',      role: 'prog_admin', onboardingStatus: '2fa_complete',         lastLogin: null,         nmlsId: '1023456', phone: '502-555-0400', title: 'Program Administrator',  policies: [] },
    { id: 'user-016', companyId: 'co-003', branchId: 'br-006', firstName: 'Devon',    lastName: 'Pryce',     email: 'dpryce@commonwealthmortgage.com',       role: 'lo',         onboardingStatus: 'verification_pending', lastLogin: null,         nmlsId: '1134567', phone: '502-555-0401', title: 'Loan Officer',           policies: [] },
    { id: 'user-017', companyId: 'co-003', branchId: 'br-006', firstName: 'Keisha',   lastName: 'Monroe',    email: 'kmonroe@commonwealthmortgage.com',      role: 'lp',         onboardingStatus: 'invited',              lastLogin: null,         nmlsId: null,      phone: null,           title: 'Loan Processor',         policies: [] },

    // Investor
    { id: 'user-018', companyId: null,     branchId: null,    firstName: 'Robert',    lastName: 'Huang',     email: 'rhuang@capitalpartners.com',            role: 'investor',   onboardingStatus: 'active',               lastLogin: '2026-03-15', nmlsId: null,      phone: '212-555-0500', title: 'Accredited Investor',    policies: ['investor_view'] },
  ],

  /* ---- Loans / Originations ---- */
  loans: [
    // Capital City Lending — DC Dream Fund
    { id: 'DCDC000001', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Evelyn & Marcus Ross',      address: '3407 Wisconsin Ave NW, Washington, DC 20016',  amount: 195000, program: 'DC Dream Fund', status: 'initial_application_submitted',    ltv: 71, submittedAt: '2026-03-18', cltv: 75 },
    { id: 'DCDC000002', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Carolyn Dupree',            address: '1244 U St NW, Washington, DC 20009',            amount: 220000, program: 'DC Dream Fund', status: 'application_documents_approved',    ltv: 64, submittedAt: '2026-03-10', cltv: 67 },
    { id: 'DCDC000003', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Terrence & Faith Hill',     address: '509 G St NE, Washington, DC 20002',             amount: 155000, program: 'DC Dream Fund', status: 'completed',                         ltv: 69, submittedAt: '2026-02-21', cltv: 72 },
    { id: 'DCDC000004', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Naomi Jefferson',           address: '744 Rittenhouse St NW, Washington, DC 20011',  amount: 105000, program: 'DC Dream Fund', status: 'prequalification_in_progress',      ltv: 66, submittedAt: null,         cltv: null },
    { id: 'DCDC000005', companyId: 'co-001', branchId: 'br-002', loId: 'user-005', borrowerName: 'Antoine & Carmen Watkins',  address: '2301 Pennsylvania Ave SE, Washington, DC 20020', amount: 230000, program: 'DC Dream Fund', status: 'sent_to_docutech',                  ltv: 73, submittedAt: '2026-03-21', cltv: 77 },
    { id: 'DCDC000006', companyId: 'co-001', branchId: 'br-002', loId: 'user-005', borrowerName: 'Loretta Simmons',           address: '4829 Bending Creek Rd, Washington, DC 20019',  amount: 175000, program: 'DC Dream Fund', status: 'origination_created',               ltv: 68, submittedAt: '2026-03-12', cltv: 71 },

    // Bluegrass Home Finance — Kentucky Dream Fund
    { id: 'KDKY000001', companyId: 'co-002', branchId: 'br-004', loId: 'user-011', borrowerName: 'Floyd & Barbara Jennings', address: '1025 Bardstown Rd, Louisville, KY 40204',       amount: 160000, program: 'Kentucky Dream Fund', status: 'pending_origination_creation',  ltv: 67, submittedAt: '2026-03-17', cltv: 70 },
    { id: 'KDKY000002', companyId: 'co-002', branchId: 'br-004', loId: 'user-011', borrowerName: 'Celeste Tanner',           address: '633 E Main St, Lexington, KY 40508',            amount: 145000, program: 'Kentucky Dream Fund', status: 'original_appraisal_submitted',  ltv: 72, submittedAt: '2026-03-05', cltv: 75 },
  ],

  /* ---- Permission Policies ---- */
  policies: [
    { id: 'full_access',     name: 'Full Access',             description: 'Platform-wide CRUD on all objects',                               roleTarget: 'sys_admin'  },
    { id: 'platform_ops',    name: 'Platform Operations',     description: 'Manage orgs, branches, users; no policy editing',                 roleTarget: 'operator'   },
    { id: 'prog_view',       name: 'Program Admin — View',    description: 'View all company objects read-only',                              roleTarget: 'prog_admin' },
    { id: 'prog_invite',     name: 'Program Admin — Invite',  description: 'Invite new users to company branches',                           roleTarget: 'prog_admin' },
    { id: 'prog_edit',       name: 'Program Admin — Edit',    description: 'Edit branch info and user profiles',                             roleTarget: 'prog_admin' },
    { id: 'lo_standard',     name: 'LO Standard',             description: 'Create, edit, submit loan applications in assigned branch',       roleTarget: 'lo'         },
    { id: 'lo_multi_branch', name: 'LO Multi-Branch',         description: 'LO Standard extended to multiple branches',                      roleTarget: 'lo'         },
    { id: 'lp_standard',     name: 'LP Standard',             description: 'Process and update loan applications in assigned branch',         roleTarget: 'lp'         },
    { id: 'investor_view',   name: 'Investor View',           description: 'View portfolio and investment reports',                           roleTarget: 'investor'   },
  ],

  /* ---- Permission Matrix (base permissions by role) ---- */
  permissionMatrix: {
    actions: ['View', 'Create/Edit', 'Submit/Approve', 'Delete', 'Manage Policies'],
    scopes: ['Platform', 'Company', 'Branch', 'Own Loans'],
    matrix: {
      sys_admin:  { 'Platform-View': true,  'Platform-Create/Edit': true,  'Platform-Submit/Approve': true,  'Platform-Delete': true,  'Platform-Manage Policies': true,  'Company-View': true,  'Company-Create/Edit': true,  'Company-Submit/Approve': true,  'Company-Delete': true,  'Company-Manage Policies': true,  'Branch-View': true,  'Branch-Create/Edit': true,  'Branch-Submit/Approve': true,  'Branch-Delete': true,  'Branch-Manage Policies': true,  'Own Loans-View': true,  'Own Loans-Create/Edit': true,  'Own Loans-Submit/Approve': true,  'Own Loans-Delete': true,  'Own Loans-Manage Policies': false },
      operator:   { 'Platform-View': true,  'Platform-Create/Edit': true,  'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': true,  'Company-Create/Edit': true,  'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': true,  'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': false, 'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false },
      prog_admin: { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': true,  'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': false, 'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false },
      lo:         { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': false, 'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': true,  'Own Loans-Submit/Approve': true,  'Own Loans-Delete': false, 'Own Loans-Manage Policies': false },
      lp:         { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': false, 'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': true,  'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false },
      investor:   { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': false, 'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': false, 'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': false, 'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false },
    }
  },

  /* ---- Activity Log ---- */
  activityLog: [
    { userId: 'user-001', action: 'invited',        subject: 'Yolanda Simmons',         subjectType: 'user',    time: '2 hours ago',  companyId: 'co-001' },
    { userId: 'user-001', action: 'created',        subject: 'Commonwealth Mortgage',   subjectType: 'company', time: '1 day ago',    companyId: 'co-003' },
    { userId: 'user-003', action: 'submitted',      subject: 'DCDC000001',              subjectType: 'loan',    time: '2 days ago',   companyId: 'co-001' },
    { userId: 'user-002', action: 'approved',       subject: 'DCDC000002',              subjectType: 'loan',    time: '3 days ago',   companyId: 'co-001' },
    { userId: 'user-010', action: 'invited',        subject: 'Garrett Nichols',         subjectType: 'user',    time: '4 days ago',   companyId: 'co-002' },
    { userId: 'user-001', action: 'updated',        subject: 'Bluegrass Home Finance',  subjectType: 'company', time: '5 days ago',   companyId: 'co-002' },
    { userId: 'user-004', action: 'submitted',      subject: 'DCDC000003',              subjectType: 'loan',    time: '1 week ago',   companyId: 'co-001' },
    { userId: 'user-001', action: 'policy updated', subject: 'Patricia Owens',          subjectType: 'user',    time: '1 week ago',   companyId: 'co-001' },
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
    prequalification_in_progress:    'Prequalification In Progress',
    initial_application_submitted:   'Initial Application Submitted',
    completed:                       'Completed',
    sent_to_docutech:                'Sent to Docutech',
    origination_created:             'Origination Created',
    application_documents_approved:  'Application Docs Approved',
    pending_origination_creation:    'Pending Origination Creation',
    prequalification_expired:        'Prequalification Expired',
    original_appraisal_submitted:    'Original Appraisal Submitted',
  })[s] || s,

  loanStatusClass: (s) => ({
    prequalification_in_progress:    'badge-progress',
    initial_application_submitted:   'badge-submitted',
    completed:                       'badge-complete',
    sent_to_docutech:                'badge-docutech',
    origination_created:             'badge-active',
    application_documents_approved:  'badge-verified',
    pending_origination_creation:    'badge-invited',
    prequalification_expired:        'badge-expired',
    original_appraisal_submitted:    'badge-appraisal',
  })[s] || 'badge-neutral',

  currency: (n) => n ? '$' + n.toLocaleString() : '—',
  date:     (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
};
