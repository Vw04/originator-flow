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
      defaultPermissionTemplateId: 'lo_own_only',
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
      defaultPermissionTemplateId: 'lo_own_only',
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
      defaultPermissionTemplateId: null,
    },
  ],

  /* ---- Branches ---- */
  branches: [
    // Capital City Lending (DC)
    { id: 'br-001', companyId: 'co-001', name: 'Downtown DC',           address: '1100 New York Ave NW, Washington, DC 20005',  state: 'DC', managingLO: 'user-003', userCount: 4, programs: ['DC Dream Fund'], status: 'active',  parentBranchId: null,     nmlsId: '2045871-001', defaultPermissionTemplateId: null },
    { id: 'br-002', companyId: 'co-001', name: 'Capitol Hill Branch',   address: '320 First St SE, Washington, DC 20003',        state: 'DC', managingLO: 'user-005', userCount: 4, programs: ['DC Dream Fund'], status: 'active',  parentBranchId: null,     nmlsId: '2045871-002', defaultPermissionTemplateId: 'lo_full_branch' },
    { id: 'br-003', companyId: 'co-001', name: 'Adams Morgan Office',   address: '1785 Columbia Rd NW, Washington, DC 20009',    state: 'DC', managingLO: null,       userCount: 2, programs: ['DC Dream Fund'], status: 'active',  parentBranchId: 'br-001', nmlsId: '2045871-003', defaultPermissionTemplateId: null },

    // Bluegrass Home Finance (KY)
    { id: 'br-004', companyId: 'co-002', name: 'Louisville HQ',         address: '400 W Market St, Louisville, KY 40202',        state: 'KY', managingLO: 'user-011', userCount: 4, programs: ['Kentucky Dream Fund'], status: 'active',  parentBranchId: null, nmlsId: '3178904-001', defaultPermissionTemplateId: null },
    { id: 'br-005', companyId: 'co-002', name: 'Lexington Branch',      address: '200 W Vine St, Lexington, KY 40507',           state: 'KY', managingLO: null,       userCount: 3, programs: ['Kentucky Dream Fund'], status: 'active',  parentBranchId: null, nmlsId: '3178904-002', defaultPermissionTemplateId: null },

    // Commonwealth Mortgage Group (KY)
    { id: 'br-006', companyId: 'co-003', name: 'Frankfort Office',      address: '702 Capital Ave, Frankfort, KY 40601',         state: 'KY', managingLO: 'user-016', userCount: 3, programs: [], status: 'pending', parentBranchId: null, nmlsId: '4290136-001', defaultPermissionTemplateId: null },
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
    { id: 'DCDC000001', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Evelyn & Marcus Ross',      address: '3407 Wisconsin Ave NW, Washington, DC 20016',  amount: 195000, program: 'DC Dream Fund', status: 'initial_application_submitted',    ltv: 71, submittedAt: '2026-03-18', cltv: 75, fico: 742, householdIncome: 125000 },
    { id: 'DCDC000002', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Carolyn Dupree',            address: '1244 U St NW, Washington, DC 20009',            amount: 220000, program: 'DC Dream Fund', status: 'application_documents_approved',    ltv: 64, submittedAt: '2026-03-10', cltv: 67, fico: 718, householdIncome: 88000 },
    { id: 'DCDC000003', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Terrence & Faith Hill',     address: '509 G St NE, Washington, DC 20002',             amount: 155000, program: 'DC Dream Fund', status: 'completed',                         ltv: 69, submittedAt: '2026-02-21', cltv: 72, fico: 765, householdIncome: 145000 },
    { id: 'DCDC000004', companyId: 'co-001', branchId: 'br-001', loId: 'user-004', borrowerName: 'Naomi Jefferson',           address: '744 Rittenhouse St NW, Washington, DC 20011',  amount: 105000, program: 'DC Dream Fund', status: 'prequalification_in_progress',      ltv: 66, submittedAt: null,         cltv: null, fico: 695, householdIncome: 62000 },
    { id: 'DCDC000005', companyId: 'co-001', branchId: 'br-002', loId: 'user-005', borrowerName: 'Antoine & Carmen Watkins',  address: '2301 Pennsylvania Ave SE, Washington, DC 20020', amount: 230000, program: 'DC Dream Fund', status: 'sent_to_docutech',                  ltv: 73, submittedAt: '2026-03-21', cltv: 77, fico: 731, householdIncome: 110000 },
    { id: 'DCDC000006', companyId: 'co-001', branchId: 'br-002', loId: 'user-005', borrowerName: 'Loretta Simmons',           address: '4829 Bending Creek Rd, Washington, DC 20019',  amount: 175000, program: 'DC Dream Fund', status: 'origination_created',               ltv: 68, submittedAt: '2026-03-12', cltv: 71, fico: 708, householdIncome: 78000 },

    // Bluegrass Home Finance — Kentucky Dream Fund
    { id: 'KDKY000001', companyId: 'co-002', branchId: 'br-004', loId: 'user-011', borrowerName: 'Floyd & Barbara Jennings', address: '1025 Bardstown Rd, Louisville, KY 40204',       amount: 160000, program: 'Kentucky Dream Fund', status: 'pending_origination_creation',  ltv: 67, submittedAt: '2026-03-17', cltv: 70, fico: 755, householdIncome: 95000 },
    { id: 'KDKY000002', companyId: 'co-002', branchId: 'br-004', loId: 'user-011', borrowerName: 'Celeste Tanner',           address: '633 E Main St, Lexington, KY 40508',            amount: 145000, program: 'Kentucky Dream Fund', status: 'original_appraisal_submitted',  ltv: 72, submittedAt: '2026-03-05', cltv: 75, fico: 682, householdIncome: 54000 },
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
    actions: ['View', 'Create/Edit', 'Submit/Approve', 'Delete', 'Manage Policies', 'Impersonate'],
    scopes: ['Platform', 'Company', 'Branch', 'Own Loans', 'Any User'],
    matrix: {
      sys_admin:  { 'Platform-View': true,  'Platform-Create/Edit': true,  'Platform-Submit/Approve': true,  'Platform-Delete': true,  'Platform-Manage Policies': true,  'Company-View': true,  'Company-Create/Edit': true,  'Company-Submit/Approve': true,  'Company-Delete': true,  'Company-Manage Policies': true,  'Branch-View': true,  'Branch-Create/Edit': true,  'Branch-Submit/Approve': true,  'Branch-Delete': true,  'Branch-Manage Policies': true,  'Own Loans-View': true,  'Own Loans-Create/Edit': true,  'Own Loans-Submit/Approve': true,  'Own Loans-Delete': true,  'Own Loans-Manage Policies': false, 'Any User-Impersonate': true  },
      operator:   { 'Platform-View': true,  'Platform-Create/Edit': true,  'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': true,  'Company-Create/Edit': true,  'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': true,  'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': false, 'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false, 'Any User-Impersonate': true  },
      prog_admin: { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': true,  'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': false, 'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false, 'Any User-Impersonate': false },
      lo:         { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': false, 'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': true,  'Own Loans-Submit/Approve': true,  'Own Loans-Delete': false, 'Own Loans-Manage Policies': false, 'Any User-Impersonate': false },
      lp:         { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': false, 'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': true,  'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': true,  'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false, 'Any User-Impersonate': false },
      investor:   { 'Platform-View': false, 'Platform-Create/Edit': false, 'Platform-Submit/Approve': false, 'Platform-Delete': false, 'Platform-Manage Policies': false, 'Company-View': false, 'Company-Create/Edit': false, 'Company-Submit/Approve': false, 'Company-Delete': false, 'Company-Manage Policies': false, 'Branch-View': false, 'Branch-Create/Edit': false, 'Branch-Submit/Approve': false, 'Branch-Delete': false, 'Branch-Manage Policies': false, 'Own Loans-View': true,  'Own Loans-Create/Edit': false, 'Own Loans-Submit/Approve': false, 'Own Loans-Delete': false, 'Own Loans-Manage Policies': false, 'Any User-Impersonate': false },
    }
  },

  /* ---- Investor Entities ---- */
  investorEntities: [
    { id: 'inv-001', name: 'Capital Partners Fund I', type: 'Institutional', status: 'active', aum: 250000000, contactName: 'Robert Huang', contactEmail: 'rhuang@capitalpartners.com', createdAt: '2025-08-01' },
    { id: 'inv-002', name: 'Heartland Housing Trust',  type: 'Community Fund', status: 'active', aum: 75000000,  contactName: 'Linda Cho', contactEmail: 'lcho@heartlandtrust.org', createdAt: '2025-11-15' },
  ],

  /* ---- Funds ---- */
  funds: [
    { id: 'fund-001', investorId: 'inv-001', name: 'CP Housing Equity Fund',  vintage: 2025, committed: 100000000, deployed: 45000000, status: 'active' },
    { id: 'fund-002', investorId: 'inv-002', name: 'Heartland HEI Pool',      vintage: 2026, committed: 50000000,  deployed: 12000000, status: 'active' },
  ],

  /* ---- Permission Templates ---- */
  permissionTemplates: [
    {
      id: 'lo_own_only',
      name: 'LO — Own Loans Only',
      description: 'Loan Officer can view, edit, and submit only their own loan applications.',
      defaultMatrix: {
        'Own Loans-View': true, 'Own Loans-Create/Edit': true, 'Own Loans-Submit/Approve': true,
        'Branch-View': true,
      },
    },
    {
      id: 'lo_full_branch',
      name: 'LO — Full Branch',
      description: 'Loan Officer has read/write access to all loans in the branch.',
      defaultMatrix: {
        'Branch-View': true,
        'Own Loans-View': true, 'Own Loans-Create/Edit': true, 'Own Loans-Submit/Approve': true,
        'Company-View': true,
      },
    },
    {
      id: 'lo_tagged_only',
      name: 'LO — Tagged Only',
      description: 'Loan Officer limited to loans matching their assigned tags.',
      defaultMatrix: {
        'Own Loans-View': true, 'Own Loans-Create/Edit': true, 'Own Loans-Submit/Approve': true,
        'Branch-View': true,
      },
    },
    {
      id: 'processor_assigned',
      name: 'Processor — Assigned LOs',
      description: 'Can view and edit loans belonging to their assigned Loan Officers only.',
      defaultMatrix: {
        'Own Loans-View': true, 'Own Loans-Create/Edit': true,
        'Branch-View': true,
      },
    },
    {
      id: 'processor_branch',
      name: 'Processor — Branch-wide',
      description: 'Can view and edit all loan applications across the branch.',
      defaultMatrix: {
        'Branch-View': true,
        'Own Loans-View': true, 'Own Loans-Create/Edit': true,
        'Company-View': true,
      },
    },
    {
      id: 'branch_manager_read',
      name: 'Branch Manager — Read',
      description: 'Read-only access to all branch activity, users, and loans.',
      defaultMatrix: {
        'Company-View': true,
        'Branch-View': true,
        'Own Loans-View': true,
      },
    },
    {
      id: 'branch_manager_full',
      name: 'Branch Manager — Full',
      description: 'Full branch access including user management and policy settings.',
      defaultMatrix: {
        'Company-View': true,
        'Branch-View': true, 'Branch-Create/Edit': true, 'Branch-Manage Policies': true,
        'Own Loans-View': true, 'Own Loans-Create/Edit': true,
      },
    },
    {
      id: 'compliance_observer',
      name: 'Compliance Observer',
      description: 'View-only access across all objects. Cannot create or modify anything.',
      defaultMatrix: {
        'Company-View': true,
        'Branch-View': true,
        'Own Loans-View': true,
      },
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Manually configured permissions. No default matrix applied.',
      defaultMatrix: {},
    },
  ],

  /* ---- Branch Assignments ---- */
  branchAssignments: [
    { id: 'ba-001', userId: 'user-003', branchId: 'br-001', tags: ['Branch Manager'], templateId: 'branch_manager_full', overridePermissions: {} },
    { id: 'ba-002', userId: 'user-004', branchId: 'br-001', tags: [], templateId: null, overridePermissions: {} },
    { id: 'ba-003', userId: 'user-005', branchId: 'br-002', tags: ['Branch Manager'], templateId: null, overridePermissions: {} },
    { id: 'ba-004', userId: 'user-006', branchId: 'br-001', tags: ['Loan Processor'], templateId: 'processor_assigned', overridePermissions: {} },
    { id: 'ba-005', userId: 'user-007', branchId: 'br-003', tags: [], templateId: null, overridePermissions: {} },
    { id: 'ba-006', userId: 'user-008', branchId: 'br-002', tags: ['Loan Processor'], templateId: null, overridePermissions: {} },
    { id: 'ba-007', userId: 'user-009', branchId: 'br-003', tags: [], templateId: null, overridePermissions: {} },
    { id: 'ba-008', userId: 'user-010', branchId: 'br-004', tags: ['Branch Manager'], templateId: 'branch_manager_full', overridePermissions: {} },
    { id: 'ba-009', userId: 'user-011', branchId: 'br-004', tags: [], templateId: null, overridePermissions: {} },
    { id: 'ba-010', userId: 'user-012', branchId: 'br-004', tags: ['Loan Processor'], templateId: null, overridePermissions: {} },
    { id: 'ba-011', userId: 'user-013', branchId: 'br-005', tags: [], templateId: null, overridePermissions: {} },
    { id: 'ba-012', userId: 'user-014', branchId: 'br-005', tags: [], templateId: null, overridePermissions: {} },
    { id: 'ba-013', userId: 'user-015', branchId: 'br-006', tags: ['Branch Manager'], templateId: null, overridePermissions: {} },
    { id: 'ba-014', userId: 'user-016', branchId: 'br-006', tags: [], templateId: null, overridePermissions: {} },
    { id: 'ba-015', userId: 'user-017', branchId: 'br-006', tags: ['Loan Processor'], templateId: null, overridePermissions: {} },
  ],

  /* ---- Permissions Audit Log ---- */
  auditLog: [
    { id: 'al-001', actorId: 'user-001', action: 'company_default_changed', entityType: 'company', entityId: 'co-001', detail: 'Company default template set to "LO — Own Loans Only"', timestamp: '2026-04-05T14:22:00Z' },
    { id: 'al-002', actorId: 'user-003', action: 'template_assigned',       entityType: 'branch',  entityId: 'br-002', detail: 'Branch default template set to "LO — Full Branch"',    timestamp: '2026-04-04T10:15:00Z' },
    { id: 'al-003', actorId: 'user-003', action: 'template_assigned',       entityType: 'user',    entityId: 'user-004', detail: 'Patricia Owens assigned "Branch Manager — Full" to Downtown DC', timestamp: '2026-04-03T16:40:00Z' },
    { id: 'al-004', actorId: 'user-001', action: 'company_default_changed', entityType: 'company', entityId: 'co-002', detail: 'Company default template set to "LO — Own Loans Only"', timestamp: '2026-04-02T09:05:00Z' },
  ],

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

  /* ---- Pool Summary (synthetic aggregate data for dashboard analytics) ---- */
  poolSummary: {
    avgLoanSize: 47489,
    totalLoans: 48,
    totalLoanValueQV: 2279454,
    totalPropertyValueFMV: 11415668,
    weightedAvgAgeMonths: 13.3,
    weightedAvgFICO: 712.1,
    weightedAvgLTV: 27.0,
    weightedAvgCLTV: 81.8,

    stateData: {
      'DC': { loans: 6, totalValue: 1080000 },
      'KY': { loans: 2, totalValue: 305000 },
      'UT': { loans: 8, totalValue: 745000 },
      'CO': { loans: 11, totalValue: 1070000 },
      'MI': { loans: 9, totalValue: 520000 },
      'OH': { loans: 3, totalValue: 180000 },
      'IN': { loans: 2, totalValue: 120000 },
      'PA': { loans: 1, totalValue: 100000 },
      'NY': { loans: 2, totalValue: 230000 },
      'FL': { loans: 1, totalValue: 110000 },
      'VA': { loans: 1, totalValue: 105000 },
      'MD': { loans: 1, totalValue: 95000 },
      'WI': { loans: 1, totalValue: 85000 },
    },

    vintageData: [
      { label: 'Q3 2025', value: 42000,   count: 2 },
      { label: 'Q4 2025', value: 285000,  count: 10 },
      { label: 'Q1 2026', value: 710000,  count: 28 },
      { label: 'Q2 2026', value: 148000,  count: 8 },
    ],

    ltvRangeData: [
      { label: '<10%',    value: 195000 },
      { label: '10%-20%', value: 580000 },
      { label: '21%-30%', value: 560000 },
      { label: '31%-40%', value: 310000 },
      { label: '41%-49%', value: 735000 },
    ],

    ficoRangeData: [
      { label: '600-649', value: 220000 },
      { label: '650-699', value: 385000 },
      { label: '700-749', value: 280000 },
      { label: '750+',    value: 500000 },
    ],

    incomeRangeData: [
      { label: '< $50K',       value: 1180000 },
      { label: '$50K - $75K',  value: 680000 },
      { label: '$75K - $100K', value: 120000 },
      { label: '$100K +',      value: 320000 },
    ],
  },
};

/* ---- US State SVG Paths (simplified from Wikimedia blank US map, public domain) ---- */
const US_STATE_PATHS = {
  'AL': 'M628,396 L625,430 623,453 621,463 619,466 636,468 656,470 656,445 658,439 662,435 665,428 660,423 658,416 655,412 651,408 649,404 645,398 638,396Z',
  'AK': 'M161,485 L143,485 129,489 120,493 113,499 109,506 100,510 90,510 82,514 78,518 80,523 88,525 95,527 98,530 88,536 80,540 72,539 62,541 55,544 48,544 42,548 36,551 32,556 25,558 22,563 18,566 16,572 10,576 12,582 20,580 28,578 35,576 42,574 50,570 58,568 62,565 70,562 78,558 86,555 92,550 100,547 108,544 114,541 120,538 128,536 136,530 142,526 148,522 152,517 158,514 164,510 168,506 172,500 175,494 172,490 166,487Z',
  'AZ': 'M205,384 L200,432 196,468 244,476 270,410 274,398 268,392 260,388 250,386 240,384 228,384 216,384Z',
  'AR': 'M560,394 L556,426 554,440 578,438 604,436 618,434 622,430 624,426 622,418 618,410 616,402 614,398 612,394 598,394 580,394Z',
  'CA': 'M108,268 L100,280 96,296 92,310 90,320 88,334 90,350 94,362 100,374 108,386 118,396 130,406 140,416 148,428 156,438 162,448 168,456 172,460 178,458 182,454 184,448 186,440 192,434 198,432 204,434 206,430 204,424 200,416 196,408 194,400 192,392 190,384 186,372 180,358 172,346 166,336 160,326 154,318 148,310 140,302 132,294 124,286 116,278Z',
  'CO': 'M280,290 L280,340 370,342 370,292Z',
  'CT': 'M836,192 L836,178 832,176 820,180 812,182 812,198 818,196 828,194Z',
  'DE': 'M790,276 L788,268 784,260 780,266 778,274 780,282 784,288 790,284Z',
  'FL': 'M660,470 L656,470 636,468 630,468 624,470 622,474 628,478 636,480 644,484 650,488 656,492 660,498 664,506 668,514 672,520 674,528 674,536 672,542 668,548 662,552 656,554 648,554 642,550 640,544 636,540 632,536 624,530 618,520 616,514 612,510 608,504 604,498 600,494 596,488 590,484 586,478 582,474 576,474 572,472 570,468 574,466 580,462 590,460 600,460 610,462 620,464 628,466 636,468',
  'GA': 'M660,394 L656,394 645,398 649,404 651,408 655,412 658,416 660,423 665,428 668,434 672,440 676,446 680,450 682,456 684,460 682,466 678,468 674,466 670,462 666,460 660,460 656,458 652,458 650,460 648,464 646,468 642,470 638,468 636,468 632,464 628,462 624,466 622,470 624,476 628,478 636,480 644,484 650,488 660,470 662,464 664,458 668,450 672,444 676,438 680,430 682,424 684,418 686,412 688,406 690,400 688,396 682,394 672,394Z',
  'HI': 'M274,506 L270,510 268,516 272,520 276,518 278,514 276,508Z M284,516 L280,520 280,526 284,528 288,526 290,520 286,516Z M296,510 L292,514 292,520 296,524 300,522 302,516 298,512Z M306,500 L302,504 302,510 306,514 310,512 312,506 308,502Z',
  'ID': 'M218,146 L214,172 210,200 208,220 206,238 220,240 230,238 240,232 248,224 252,216 254,206 252,196 248,188 244,180 240,172 236,164 232,156 226,150Z',
  'IL': 'M586,264 L584,274 582,286 580,298 576,310 572,320 568,328 564,336 562,342 558,348 560,354 564,358 568,356 572,350 576,346 580,344 582,340 582,334 586,330 590,328 592,322 592,316 594,310 596,306 596,298 598,292 598,284 596,276 594,270 590,266Z',
  'IN': 'M622,268 L620,280 618,292 616,304 614,316 612,328 610,338 608,346 604,348 600,346 596,344 592,342 590,340 590,334 592,328 592,322 594,310 596,306 596,298 598,292 598,284 600,276 602,270 606,268 614,268Z',
  'IA': 'M518,242 L516,254 514,266 512,274 508,282 512,288 518,290 524,290 530,286 536,280 540,274 544,270 548,268 554,268 558,272 558,278 556,284 552,288 550,292 548,296 544,298 538,298 532,296 526,294 520,294 518,296 516,300 514,304 520,306 528,306 536,304 544,302 552,300 560,300 568,300 574,298 580,296 584,292 586,286 586,278 586,270 584,264 582,258 580,252 576,248 570,246 562,244 554,244 544,244 536,244 528,242Z',
  'KS': 'M410,328 L410,374 506,376 508,370 510,364 510,356 508,348 506,342 504,336 502,332 500,328Z',
  'KY': 'M608,346 L612,350 618,352 624,354 630,358 636,362 640,366 646,368 652,370 658,370 664,368 670,364 676,360 680,356 684,352 686,346 684,340 680,336 676,334 670,332 664,332 658,334 652,338 646,340 640,342 634,344 628,346 622,348 616,350Z',
  'LA': 'M560,440 L558,452 556,462 554,470 552,476 556,480 562,482 568,478 574,474 580,474 584,478 590,484 594,486 598,482 600,476 600,470 598,464 596,458 592,454 588,448 584,444 578,440 570,440Z',
  'ME': 'M860,100 L858,108 856,118 852,128 848,136 844,140 838,144 834,148 830,150 828,156 830,160 834,158 838,154 842,148 846,142 850,136 854,128 858,118 862,108Z',
  'MD': 'M760,280 L756,274 752,270 748,268 742,268 736,270 730,274 726,278 724,284 726,290 730,292 736,290 742,286 748,282 754,280Z',
  'MA': 'M848,182 L840,180 832,178 824,178 820,180 824,184 830,186 836,186 842,184Z',
  'MI': 'M610,182 L608,190 604,198 600,206 596,214 594,222 594,232 598,238 604,242 610,244 618,244 624,240 628,234 630,226 630,218 628,210 624,204 620,198 616,192Z M580,186 L576,194 574,204 576,212 580,220 586,226 590,228 594,226 596,222 596,214 594,206 590,198 586,192Z',
  'MN': 'M480,132 L478,148 476,164 476,180 478,194 482,206 488,216 494,224 500,230 506,234 512,236 518,238 524,240 530,240 536,240 540,236 542,230 542,222 540,214 536,208 532,202 530,196 530,188 532,180 534,172 534,164 532,156 528,150 522,144 516,140 508,138 500,136 492,134Z',
  'MS': 'M590,398 L588,408 586,418 584,428 582,438 580,444 578,450 574,456 570,460 566,464 562,466 558,466 556,462 558,452 560,440 562,434 564,428 568,420 572,414 576,408 580,402 584,398Z',
  'MO': 'M520,306 L516,316 514,326 514,336 518,346 524,354 530,360 536,364 542,368 548,372 554,376 560,378 564,376 566,370 566,364 564,358 560,354 558,348 562,342 564,336 568,328 572,320 576,310 580,298 578,296 574,298 568,300 560,300 552,300 544,302 536,304 528,306Z',
  'MT': 'M260,134 L258,164 318,168 320,136Z',
  'NE': 'M380,280 L378,310 380,320 384,326 390,328 400,328 410,328 416,324 422,318 426,312 428,306 428,298 426,292 422,286 416,282 408,280 398,278 390,278Z',
  'NV': 'M172,230 L168,268 164,306 170,330 180,358 188,376 194,384 200,384 204,378 208,368 210,356 210,342 208,328 204,314 200,300 196,286 192,272 188,258 184,244Z',
  'NH': 'M840,144 L838,154 836,164 834,174 836,178 840,176 842,168 844,158 846,150Z',
  'NJ': 'M800,228 L796,238 794,248 792,258 790,266 792,272 796,276 800,272 802,264 802,256 800,248 798,240Z',
  'NM': 'M244,384 L240,426 236,466 300,472 306,416 310,384Z',
  'NY': 'M776,172 L772,180 768,188 766,198 768,208 772,216 778,222 784,226 790,228 796,228 800,224 802,218 802,210 800,202 796,196 790,190 784,184 780,178Z',
  'NC': 'M690,360 L686,366 682,372 676,376 670,380 664,384 658,386 652,388 646,388 640,386 636,382 632,378 630,376 634,374 640,372 648,370 656,370 664,368 670,364 676,360 684,356 690,352 696,348 702,346 710,346 718,348 726,350 732,354 736,358 738,364 736,370 732,372 726,370 720,366 714,362 706,360 698,360Z',
  'ND': 'M402,140 L400,168 468,170 470,140Z',
  'OH': 'M660,260 L656,268 652,278 650,288 648,298 648,308 650,318 652,326 656,332 660,336 664,334 668,332 672,328 676,324 678,318 678,310 676,302 674,294 672,286 668,278 664,270Z',
  'OK': 'M392,378 L390,404 388,420 440,422 464,420 480,418 496,414 506,410 510,406 510,398 508,392 506,386 504,380 502,376 500,372 496,370 490,368 482,368 474,370 466,372 456,374 446,376 436,378 424,378 412,378Z',
  'OR': 'M108,168 L104,194 100,218 100,240 108,268 116,278 128,270 140,262 152,254 164,248 172,242 178,236 184,244 186,236 188,226 186,216 182,206 176,198 170,192 164,186 156,182 148,178 140,176 132,174 124,172 116,170Z',
  'PA': 'M730,228 L726,236 724,246 724,256 726,264 730,270 736,274 744,274 752,270 758,264 764,258 770,252 774,244 776,236 776,228 774,222 770,218 764,216 758,218 752,220 746,224 740,226Z',
  'RI': 'M842,192 L840,188 838,186 836,190 838,194Z',
  'SC': 'M698,394 L694,398 690,400 688,396 684,394 680,396 676,400 674,406 674,412 676,418 680,424 686,428 692,430 698,428 702,424 704,418 704,412 702,406 700,400Z',
  'SD': 'M402,204 L400,240 470,242 472,204Z',
  'TN': 'M616,362 L612,368 610,374 612,382 616,388 620,392 624,394 630,394 636,392 640,386 644,384 650,384 658,386 666,388 674,388 680,386 686,384 690,378 690,372 688,368 686,364 682,360 678,358 672,356 666,356 660,358 654,360 648,362 640,362 632,362 626,362Z',
  'TX': 'M352,412 L350,440 350,466 352,490 358,508 366,522 376,532 388,536 400,534 412,528 422,518 432,510 440,500 446,490 452,478 456,470 460,464 462,456 462,448 460,440 458,432 456,424 452,418 446,416 440,418 434,420 428,420 422,418 416,416 410,414 404,412 396,410 390,406 388,420 386,426 382,428 376,426 370,420 366,416 362,414 358,414Z',
  'UT': 'M214,280 L212,320 260,324 262,284Z',
  'VT': 'M826,148 L824,158 822,168 822,178 826,180 830,176 832,168 832,158 830,150Z',
  'VA': 'M726,310 L722,318 718,326 714,332 712,340 714,348 718,354 724,356 732,356 740,358 748,356 754,350 758,344 760,336 758,328 754,322 748,316 742,312 736,310Z',
  'WA': 'M128,104 L124,128 120,148 118,166 124,172 134,174 144,176 156,178 166,180 174,176 180,168 184,158 186,148 184,138 180,128 174,120 166,114 158,110 148,108 138,106Z',
  'WV': 'M710,296 L706,304 704,312 704,322 706,330 710,336 714,340 718,338 722,332 724,324 726,316 726,308 724,300 720,294 716,292Z',
  'WI': 'M542,166 L540,178 538,190 538,202 540,214 544,224 548,232 552,238 556,240 560,238 564,234 566,228 566,220 564,212 560,206 556,200 554,192 554,184 556,176 558,170 556,166 550,164Z',
  'WY': 'M278,198 L276,246 350,248 352,200Z',
};

const US_STATE_NAMES = {
  'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California',
  'CO':'Colorado','CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia',
  'HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa',
  'KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland',
  'MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri',
  'MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey',
  'NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio',
  'OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina',
  'SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont',
  'VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming',
  'DC':'District of Columbia',
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

  template:                    (id)         => DEMO_DATA.permissionTemplates.find(t => t.id === id),
  branchAssignmentsByUser:     (userId)     => DEMO_DATA.branchAssignments.filter(a => a.userId === userId),
  branchAssignmentsByBranch:   (branchId)   => DEMO_DATA.branchAssignments.filter(a => a.branchId === branchId),
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

  templateName: (templateId) => {
    const t = DEMO_DATA.permissionTemplates.find(t => t.id === templateId);
    return t ? t.name : 'Unknown Template';
  },

  relativeTime: (isoString) => {
    if (!isoString) return '—';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  },
};
