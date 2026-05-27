/* ============================================================
   MOBILE DETAIL — Individual loan detail view
   Vertical stepper, documents, actions, communications
   ============================================================ */

const MobileDetailView = {

  _loanId: null,
  _activeSection: 'overview', // 'overview' | 'documents' | 'activity'

  _STEP_MAP: {
    'draft':                          0,
    'prequalification_in_progress':   1,
    'initial_application_submitted':  2,
    'application_documents_approved': 3,
    'original_appraisal_submitted':   4,
    'sent_to_docutech':               5,
    'pending_origination_creation':   6,
    'origination_created':            7,
    'completed':                      8,
  },

  STEPS: [
    { short: 'Upload Loan File' },
    { short: 'Prequalification' },
    { short: 'App Submitted' },
    { short: 'Docs Approved' },
    { short: 'Appraisal' },
    { short: 'Sent to DocuTech' },
    { short: 'Origination Created' },
    { short: 'Final Review' },
    { short: 'Closed' },
  ],

  COMMS: {
    'DCDC000001': [
      { msg: 'Loan Estimate sent to borrower',    tag: 'sent', date: 'Mar 20, 2026' },
      { msg: 'Application submitted',              tag: 'done', date: 'Mar 18, 2026' },
      { msg: 'Appraisal report due',               tag: 'due',  date: 'Apr 10, 2026' },
      { msg: 'Rate lock expiry',                    tag: 'due',  date: 'Apr 30, 2026' },
    ],
    'DCDC000002': [
      { msg: 'Closing Disclosure sent to borrower', tag: 'sent', date: 'Apr 1, 2026' },
      { msg: 'Documents approved by underwriter',   tag: 'done', date: 'Mar 28, 2026' },
      { msg: 'Loan Estimate sent to borrower',      tag: 'sent', date: 'Mar 12, 2026' },
      { msg: 'Rate lock expires',                    tag: 'due',  date: 'Apr 12, 2026' },
    ],
    'DCDC000003': [
      { msg: 'Closing completed — loan funded',     tag: 'done', date: 'Mar 15, 2026' },
      { msg: 'Final CD sent to borrower',           tag: 'sent', date: 'Mar 10, 2026' },
      { msg: 'Title insurance confirmed',            tag: 'done', date: 'Mar 5, 2026' },
    ],
    'DCDC000005': [
      { msg: 'Sent to DocuTech for processing',     tag: 'done', date: 'Mar 24, 2026' },
      { msg: 'Documents approved',                   tag: 'done', date: 'Mar 22, 2026' },
      { msg: 'Application submitted',                tag: 'done', date: 'Mar 21, 2026' },
    ],
    'DCDC000006': [
      { msg: 'Origination record created',           tag: 'done', date: 'Mar 20, 2026' },
      { msg: 'Sent to DocuTech',                     tag: 'done', date: 'Mar 16, 2026' },
      { msg: 'Application submitted',                tag: 'done', date: 'Mar 12, 2026' },
    ],
  },

  DOCS: [
    { name: 'Signed Loan Application 1003', status: 'approved',  sentToBorrower: true },
    { name: 'Borrower ID Verification',     status: 'approved',  sentToBorrower: true },
    { name: 'Property Insurance Binder',    status: 'approved',  sentToBorrower: true },
    { name: 'Income Verification',          status: 'pending',   sentToBorrower: false },
    { name: 'Appraisal Report',             status: 'pending',   sentToBorrower: false },
    { name: 'Title Commitment',             status: 'pending',   sentToBorrower: false },
    { name: 'Flood Zone Certification',     status: 'pending',   sentToBorrower: false },
    { name: 'Closing Disclosure',           status: 'pending',   sentToBorrower: false },
  ],

  open(loanId) {
    this._loanId = loanId;
    this._activeSection = 'overview';
    Router.navigate('/m/detail/' + loanId);
  },

  render() {
    const loan = State.getLoan(this._loanId);
    if (!loan) return `
      <div class="m-page-header">
        <div class="m-page-header-left">
          <button class="m-back-btn" onclick="history.back()">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4L6 9l5 5"/></svg>
          </button>
          <div class="m-page-title">Not Found</div>
        </div>
      </div>
      <div class="m-empty-state">Loan not found</div>`;

    const step = this._STEP_MAP[loan.status] ?? 0;
    const lo = State.getUser(loan.loId);
    const loName = lo ? Display.fullName(lo) : '—';
    const days = MobileHomeView._LOAN_DAYS[loan.id] || 0;
    const section = this._activeSection;
    const role = State.getRole();
    const canAdvance = ['sys_admin', 'operator', 'lo'].includes(role);
    const canSubmitDocs = ['sys_admin', 'operator', 'lo', 'lp'].includes(role);

    return `
      <!-- Header -->
      <div class="m-page-header" style="flex-direction:column;align-items:stretch;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="m-back-btn" onclick="history.back()">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4L6 9l5 5"/></svg>
          </button>
          <div style="flex:1;min-width:0">
            <div class="m-page-title" style="font-size:17px">${loan.borrowerName}</div>
            <div class="m-page-subtitle">${loan.id} &middot; ${loan.program}</div>
          </div>
          <span class="m-days-badge${days <= 7 ? ' ok' : ''}" style="font-size:11px;padding:3px 9px">${days}d</span>
        </div>
      </div>

      <!-- Loan summary strip -->
      <div class="m-kpi-strip cols-3" style="padding:10px 14px 4px">
        <div class="m-kpi-card" style="padding:10px 8px">
          <div class="m-kpi-value" style="font-size:18px">${Display.currency(loan.amount)}</div>
          <div class="m-kpi-label">Amount</div>
        </div>
        <div class="m-kpi-card" style="padding:10px 8px">
          <div class="m-kpi-value" style="font-size:18px">${loan.ltv ?? '—'}%</div>
          <div class="m-kpi-label">LTV</div>
        </div>
        <div class="m-kpi-card" style="padding:10px 8px">
          <div class="m-kpi-value" style="font-size:18px">${loan.cltv ?? '—'}%</div>
          <div class="m-kpi-label">CLTV</div>
        </div>
      </div>

      <!-- Section tabs -->
      <div class="m-filter-strip" style="padding-top:6px">
        <button class="m-filter-pill${section === 'overview' ? ' active' : ''}" onclick="MobileDetailView._activeSection='overview';App.renderMobileShell(MobileDetailView.render())">Overview</button>
        <button class="m-filter-pill${section === 'documents' ? ' active' : ''}" onclick="MobileDetailView._activeSection='documents';App.renderMobileShell(MobileDetailView.render())">Documents</button>
        <button class="m-filter-pill${section === 'activity' ? ' active' : ''}" onclick="MobileDetailView._activeSection='activity';App.renderMobileShell(MobileDetailView.render())">Activity</button>
      </div>

      ${section === 'overview' ? this._renderOverview(loan, step, loName, canAdvance) : ''}
      ${section === 'documents' ? this._renderDocuments(loan, canSubmitDocs) : ''}
      ${section === 'activity' ? this._renderActivity(loan) : ''}
    `;
  },

  /* ── Overview: vertical stepper + key info ── */
  _renderOverview(loan, step, loName, canAdvance) {
    const addrParts = loan.address.split(',');
    const streetAddr = addrParts[0]?.trim() || loan.address;
    const cityState = addrParts.slice(1).join(',').trim();
    const submittedDate = loan.submittedAt ? Display.date(loan.submittedAt) : '—';
    const stageLabel = MobileHomeView._STATUS_LABELS[loan.status] || loan.status;
    const nextAction = MobileHomeView._NEXT_ACTIONS[loan.status] || '';

    return `
      <!-- Property + parties -->
      <div class="m-info-card" style="margin-top:10px">
        <div class="m-info-row">
          <span class="m-info-label">Property</span>
          <span class="m-info-value" style="white-space:normal;text-align:right;font-size:12px">${streetAddr}<br>${cityState}</span>
        </div>
        <div class="m-info-row">
          <span class="m-info-label">Loan Officer</span>
          <span class="m-info-value">${loName}</span>
        </div>
        <div class="m-info-row">
          <span class="m-info-label">Submitted</span>
          <span class="m-info-value">${submittedDate}</span>
        </div>
        <div class="m-info-row">
          <span class="m-info-label">Status</span>
          <span class="m-info-value">
            <span class="status-badge status-${stageLabel === 'Completed' ? 'success' : stageLabel === 'Draft' ? 'neutral' : 'info'}" style="font-size:10px;padding:2px 7px">${stageLabel}</span>
          </span>
        </div>
        ${nextAction && loan.status !== 'completed' ? `
          <div class="m-info-row">
            <span class="m-info-label">Next Action</span>
            <span class="m-info-value" style="color:var(--h-warning);font-weight:600;font-size:12px">${nextAction}</span>
          </div>
        ` : ''}
      </div>

      <!-- Vertical stepper -->
      <div class="m-section-header"><span class="m-section-title">Loan Progress</span></div>
      <div class="m-stepper">
        ${this.STEPS.map((s, i) => {
          const isCompleted = i < step;
          const isCurrent = i === step;
          const isPending = i > step;
          return `
            <div class="m-stepper-step${isCompleted ? ' done' : ''}${isCurrent ? ' current' : ''}">
              <div class="m-stepper-indicator">
                <div class="m-stepper-dot">${isCompleted ? '&#10003;' : i + 1}</div>
                ${i < this.STEPS.length - 1 ? '<div class="m-stepper-line"></div>' : ''}
              </div>
              <div class="m-stepper-content">
                <div class="m-stepper-label">${s.short}</div>
                ${isCurrent ? '<span class="m-stepper-badge">Current</span>' : ''}
                ${isCompleted ? '<span class="m-stepper-check">Completed</span>' : ''}
              </div>
            </div>`;
        }).join('')}
      </div>

      ${canAdvance && loan.status !== 'completed' ? `
        <div style="padding:12px 14px 16px">
          <button class="m-btn m-btn-primary" onclick="MobileDetailView.advanceLoan()">Advance to Next Step</button>
        </div>
      ` : ''}
    `;
  },

  /* ── Documents: list with upload/approve actions ── */
  _renderDocuments(loan, canSubmitDocs) {
    const approved = this.DOCS.filter(d => d.status === 'approved');
    const pending = this.DOCS.filter(d => d.status === 'pending');

    return `
      <div class="m-section-header" style="padding-top:10px"><span class="m-section-title">Approved (${approved.length})</span></div>
      <div class="m-list">
        ${approved.map(d => `
          <div class="m-list-item" style="border-left:3px solid var(--h-success)" onclick="MobileDetailView.viewDocument('${d.name}')">
            <div class="m-list-item-header">
              <span class="m-list-item-title" style="font-size:13px">${d.name}</span>
              <span class="status-badge status-success" style="font-size:9px;padding:2px 6px">Approved</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
              ${d.sentToBorrower ? '<span style="font-size:11px;color:var(--h-success)">&#10003; Sent to borrower</span>' : ''}
              <span style="font-size:11px;color:var(--h-action);margin-left:auto">View PDF &#8250;</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="m-section-header"><span class="m-section-title">Pending Upload (${pending.length})</span></div>
      <div class="m-list" style="padding-bottom:14px">
        ${pending.map(d => `
          <div class="m-list-item" style="border-left:3px solid var(--h-warning)">
            <div class="m-list-item-header">
              <span class="m-list-item-title" style="font-size:13px">${d.name}</span>
              <span class="status-badge status-warning" style="font-size:9px;padding:2px 6px">Pending</span>
            </div>
            ${canSubmitDocs ? `
              <div style="display:flex;gap:8px;margin-top:8px">
                <button class="m-btn-sm m-btn-sm-primary" onclick="MobileDetailView.uploadDocument('${d.name}')">Upload</button>
                <button class="m-btn-sm m-btn-sm-secondary" onclick="MobileDetailView.sendReminder('${d.name}')">Send Reminder</button>
              </div>
            ` : `
              <div style="font-size:11px;color:var(--h-text-muted);margin-top:4px">Awaiting upload from loan officer</div>
            `}
          </div>
        `).join('')}
      </div>
    `;
  },

  /* ── Activity: communications timeline ── */
  _renderActivity(loan) {
    const comms = this.COMMS[loan.id] || [
      { msg: 'Application created', tag: 'done', date: loan.submittedAt ? Display.date(loan.submittedAt) : 'Pending' },
    ];

    const lo = State.getUser(loan.loId);
    const loName = lo ? Display.fullName(lo) : '—';

    return `
      <!-- Key dates -->
      <div class="m-info-card" style="margin-top:10px">
        <div class="m-info-row">
          <span class="m-info-label">Submitted</span>
          <span class="m-info-value">${loan.submittedAt ? Display.date(loan.submittedAt) : '—'}</span>
        </div>
        <div class="m-info-row">
          <span class="m-info-label">Rate Lock</span>
          <span class="m-info-value">${loan.id === 'DCDC000002' ? '<span style="color:var(--h-error)">Apr 12, 2026</span>' : 'Apr 30, 2026'}</span>
        </div>
        <div class="m-info-row">
          <span class="m-info-label">Est. Close</span>
          <span class="m-info-value">${loan.status === 'completed' ? 'Closed' : 'May 15, 2026'}</span>
        </div>
      </div>

      <!-- Parties -->
      <div class="m-info-card">
        <div class="m-info-row">
          <span class="m-info-label">Borrower</span>
          <span class="m-info-value">${loan.borrowerName}</span>
        </div>
        <div class="m-info-row">
          <span class="m-info-label">Loan Officer</span>
          <span class="m-info-value">${loName}</span>
        </div>
        <div class="m-info-row">
          <span class="m-info-label">Processor</span>
          <span class="m-info-value">Kevin Park</span>
        </div>
        <div class="m-info-row">
          <span class="m-info-label">Title Co.</span>
          <span class="m-info-value">First American Title</span>
        </div>
      </div>

      <!-- Timeline -->
      <div class="m-section-header"><span class="m-section-title">Communications</span></div>
      <div class="m-activity-list" style="padding:0 14px 14px">
        ${comms.map(c => {
          const dotColor = { sent: 'var(--h-info, #1A6E8E)', done: 'var(--h-success)', due: 'var(--h-error)' }[c.tag] || 'var(--h-text-muted)';
          const tagLabel = { sent: 'Sent', done: 'Done', due: 'Due' }[c.tag] || c.tag;
          const tagBg = { sent: '#DBEAFE', done: '#D1FAE5', due: '#FEE2E2' }[c.tag] || 'var(--h-pearl)';
          const tagColor = { sent: '#1D4ED8', done: '#065F46', due: '#991B1B' }[c.tag] || 'var(--h-text-muted)';
          return `
            <div class="m-activity-item">
              <div class="m-activity-dot" style="background:${dotColor};border-color:${dotColor}"></div>
              <div class="m-activity-body" style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                <div>
                  <div class="m-activity-text">${c.msg}</div>
                  <div class="m-activity-time">${c.date}</div>
                </div>
                <span style="flex-shrink:0;font-size:10px;font-weight:600;padding:2px 7px;border-radius:9999px;background:${tagBg};color:${tagColor}">${tagLabel}</span>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  },

  /* ── Actions ── */
  advanceLoan() {
    const loan = State.getLoan(this._loanId);
    if (!loan) return;
    const statusOrder = [
      'draft', 'prequalification_in_progress', 'initial_application_submitted',
      'application_documents_approved', 'original_appraisal_submitted', 'sent_to_docutech',
      'pending_origination_creation', 'origination_created', 'completed',
    ];
    const idx = statusOrder.indexOf(loan.status);
    if (idx >= 0 && idx < statusOrder.length - 1) {
      loan.status = statusOrder[idx + 1];
    }
    App.renderMobileShell(this.render());
  },

  uploadDocument(docName) {
    const doc = this.DOCS.find(d => d.name === docName);
    if (doc) {
      doc.status = 'approved';
      doc.sentToBorrower = false;
    }
    App.renderMobileShell(this.render());
  },

  sendReminder(docName) {
    alert('Reminder sent for: ' + docName);
  },

  viewDocument(docName) {
    alert('Opening PDF viewer for: ' + docName + '\n\n(PDF preview would open here on a real device)');
  },
};
