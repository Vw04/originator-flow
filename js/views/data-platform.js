/* ============================================================
   HOMIUM ORIGINATOR FLOW — Data Platform View
   Analytics, Applications, Originations, Batches, Activations
   ============================================================ */

const DataPlatformView = {

  _activeTab: 'analytics',

  /* Sub-tab config per role */
  _tabsForRole(role) {
    const all = [
      { key: 'analytics',    label: 'Analytics' },
      { key: 'applications', label: 'Applications' },
      { key: 'originations', label: 'Originations' },
      { key: 'batches',      label: 'Batches' },
      { key: 'activations',  label: 'Activations' },
    ];
    if (role === 'prog_admin') return all.slice(0, 3);
    if (role === 'lo')         return [all[1], all[2]];
    if (role === 'lp')         return [all[1]];
    if (role === 'investor')   return [all[0]];
    return all; // sys_admin, operator
  },

  render(tab) {
    if (tab) this._activeTab = tab;
    const role = State.getRole();
    const tabs = this._tabsForRole(role);

    // Ensure active tab is valid for this role
    if (!tabs.find(t => t.key === this._activeTab)) {
      this._activeTab = tabs[0]?.key || 'analytics';
    }

    let content = '';
    switch (this._activeTab) {
      case 'analytics':    content = this._renderAnalytics();    break;
      case 'applications': content = this._renderApplications(); break;
      case 'originations': content = this._renderOriginations(); break;
      case 'batches':      content = this._renderBatches();      break;
      case 'activations':  content = this._renderActivations();  break;
      default:             content = this._renderAnalytics();
    }

    return `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-left">
            <div class="page-title">Loan Origination Platform Dashboard</div>
            <div class="page-subtitle">Homium origination and token data</div>
          </div>
        </div>
      </div>

      <div class="page-body">${content}</div>`;
  },

  switchTab(tab) {
    this._activeTab = tab;
    App.renderView('/data/' + tab);
  },

  /* ---- Analytics ---- */
  _renderAnalytics() {
    const loans  = State.getLoans();
    const total  = loans.reduce((s, l) => s + l.amount, 0);
    const active = loans.filter(l => l.status !== 'draft' && l.status !== 'completed').length;
    const hdm    = 1000.00;

    const stateMap = {};
    loans.forEach(l => {
      const st = l.address.split(',').slice(-2)[0]?.trim().split(' ')[0] || 'Unknown';
      stateMap[st] = (stateMap[st] || 0) + l.amount;
    });
    const topStates = Object.entries(stateMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([st, amt]) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--color-border-light)">
          <span style="font-size:13px;color:var(--color-text)">${st}</span>
          <span style="font-size:13px;font-weight:600">${Display.currency(amt)}</span>
        </div>`).join('');

    return `
      <div class="stat-row" style="margin-bottom:32px">
        <div class="stat-item">
          <div class="stat-label">Pipeline Value</div>
          <div class="stat-value">${Display.currency(total)}</div>
          <div class="stat-desc">${loans.length} total applications</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">HDM Value</div>
          <div class="stat-value">$${hdm.toFixed(2)}</div>
          <div class="stat-desc">Per token (demo)</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Total Originations</div>
          <div class="stat-value">${loans.length}</div>
          <div class="stat-desc">All-time loans on platform</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Active Loans</div>
          <div class="stat-value">${active}</div>
          <div class="stat-desc">In progress</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Homium Market Cap</div>
          <div class="stat-value">$0</div>
          <div class="stat-desc">Total Homium minted: 0</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">Homium LAN Pool Summary</div>
          <div class="stat-row" style="margin-bottom:0;padding:0">
            <div class="stat-item" style="flex:1">
              <div class="stat-label">Pool Value</div>
              <div class="stat-value" style="font-size:24px">${Display.currency(total)}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item" style="flex:1">
              <div class="stat-label">Originations</div>
              <div class="stat-value" style="font-size:24px">${loans.length}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item" style="flex:1">
              <div class="stat-label">Avg. LTV</div>
              <div class="stat-value" style="font-size:24px">${(loans.reduce((s,l)=>s+(l.ltv||0),0)/Math.max(loans.filter(l=>l.ltv).length,1)).toFixed(1)}%</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:12px">Loan Distribution by Location</div>
          ${this._renderMap(loans)}
        </div>
      </div>`;
  },

  /* ---- Applications ---- */
  _renderApplications() {
    const role  = State.getRole();
    const user  = State.getCurrentUser();
    const loans = (role === 'lo' || role === 'lp')
      ? State.getLoansByLO(user?.id)
      : State.getLoans();

    const rows = loans.map(l => `
      <tr>
        <td style="font-size:12px;color:var(--color-text-muted);font-weight:600">${l.id}</td>
        <td>${l.borrowerName}</td>
        <td>${Display.currency(l.amount)}</td>
        <td style="color:var(--color-text-secondary)">${l.address.split(',').slice(-3,-2)[0]?.trim() || '—'}</td>
        <td style="font-size:12px;color:var(--color-text-secondary)">${l.address.split(',').slice(0,2).join(',').trim()}</td>
        <td><span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span></td>
        <td>
          ${role === 'lo' ? `<button class="btn btn-ghost btn-xs" onclick="">View</button>` : ''}
        </td>
      </tr>`).join('');

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="font-size:13px;color:var(--color-text-secondary)">${loans.length} application${loans.length !== 1 ? 's' : ''}</div>
        ${role === 'lo' ? `<button class="btn btn-primary btn-sm" onclick="DataPlatformView._openNewAppModal()">+ New Application</button>` : ''}
      </div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Loan ID</th>
            <th>Borrower</th>
            <th>Amount</th>
            <th>City</th>
            <th>Address</th>
            <th>Stage</th>
            <th></th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:32px">No applications found</td></tr>'}</tbody>
        </table>
      </div>
      <div id="dp-modal"></div>`;
  },

  /* ---- Originations ---- */
  _renderOriginations() {
    const role  = State.getRole();
    const user  = State.getCurrentUser();
    const loans = (role === 'lo' || role === 'lp')
      ? State.getLoansByLO(user?.id)
      : State.getLoans().filter(l => l.status !== 'draft');

    const avgLTV = loans.filter(l => l.ltv).reduce((s, l) => s + l.ltv, 0) / Math.max(loans.filter(l => l.ltv).length, 1);

    const rows = loans.map(l => `
      <tr>
        <td style="font-size:12px;color:var(--color-text-muted);font-weight:600">${l.id}</td>
        <td>${l.borrowerName}</td>
        <td><span class="tag">${l.program}</span></td>
        <td>${Display.currency(l.amount)}</td>
        <td>${l.ltv ? `${l.ltv}%` : '—'}</td>
        <td style="color:var(--color-text-secondary)">${l.address.split(',').slice(-2)[0]?.trim() || '—'}</td>
        <td><span class="badge ${Display.loanStatusClass(l.status)}">${Display.loanStatusLabel(l.status)}</span></td>
      </tr>`).join('');

    return `
      <div class="stat-row" style="margin-bottom:24px">
        <div class="stat-item">
          <div class="stat-label">Total Originated</div>
          <div class="stat-value" style="font-size:28px">${loans.length}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Total Value</div>
          <div class="stat-value" style="font-size:28px">${Display.currency(loans.reduce((s,l)=>s+l.amount,0))}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-label">Avg LTV</div>
          <div class="stat-value" style="font-size:28px">${avgLTV.toFixed(1)}%</div>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Loan ID</th>
            <th>Borrower</th>
            <th>Program</th>
            <th>Amount</th>
            <th>LTV</th>
            <th>State</th>
            <th>Status</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:32px">No originations found</td></tr>'}</tbody>
        </table>
      </div>`;
  },

  /* ---- Batches ---- */
  _renderBatches() {
    const loans = State.getLoans().filter(l => l.status === 'completed' || l.status === 'origination_created');
    const batches = [
      { id: 'BATCH-2026-001', count: 3, value: loans.slice(0,3).reduce((s,l)=>s+l.amount,0), status: 'Pending Issuance', created: '2026-03-10' },
      { id: 'BATCH-2026-002', count: 2, value: loans.slice(3,5).reduce((s,l)=>s+l.amount,0), status: 'Draft',            created: '2026-03-20' },
    ];

    const rows = batches.map(b => `
      <tr>
        <td style="font-size:12px;font-weight:600;color:var(--color-text-muted)">${b.id}</td>
        <td>${b.count}</td>
        <td>${Display.currency(b.value)}</td>
        <td>${Display.date(b.created)}</td>
        <td><span class="badge badge-pending">${b.status}</span></td>
      </tr>`).join('');

    return `
      <div style="margin-bottom:16px;font-size:13px;color:var(--color-text-secondary)">${batches.length} batches</div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Batch ID</th>
            <th># Loans</th>
            <th>Total Value</th>
            <th>Created</th>
            <th>Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  /* ---- Activations ---- */
  _renderActivations() {
    const activations = [
      { batch: 'BATCH-2025-003', tokens: 788.7, date: '2025-11-14', status: 'Activated' },
      { batch: 'BATCH-2025-002', tokens: 512.0, date: '2025-09-22', status: 'Activated' },
      { batch: 'BATCH-2025-001', tokens: 341.5, date: '2025-07-08', status: 'Activated' },
    ];

    const rows = activations.map(a => `
      <tr>
        <td style="font-size:12px;font-weight:600;color:var(--color-text-muted)">${a.batch}</td>
        <td>${a.tokens.toFixed(1)} HOM</td>
        <td>${Display.date(a.date)}</td>
        <td><span class="badge badge-active">${a.status}</span></td>
      </tr>`).join('');

    return `
      <div style="margin-bottom:16px;font-size:13px;color:var(--color-text-secondary)">${activations.length} activation events</div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Batch</th>
            <th>Token Amount</th>
            <th>Activation Date</th>
            <th>Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  /* ---- US Map with loan location dots ---- */
  _renderMap(loans) {
    // Approximate SVG coords (800×500 viewBox) for known cities in the loan data
    const CITY_COORDS = {
      'Washington':  { x: 598, y: 218 },
      'Louisville':  { x: 530, y: 235 },
      'Lexington':   { x: 548, y: 228 },
    };

    // Group loans by city and sum amounts
    const cityData = {};
    loans.forEach(l => {
      const city = l.address.split(',')[1]?.trim() || l.address.split(',')[0]?.trim() || '';
      const key = Object.keys(CITY_COORDS).find(c => city.toLowerCase().includes(c.toLowerCase()));
      if (key) {
        if (!cityData[key]) cityData[key] = { count: 0, total: 0 };
        cityData[key].count++;
        cityData[key].total += l.amount;
      }
    });

    const dots = Object.entries(cityData).map(([city, data]) => {
      const c = CITY_COORDS[city];
      const r = Math.min(6 + data.count * 3, 16);
      return `
        <circle cx="${c.x}" cy="${c.y}" r="${r}" fill="var(--color-primary)" opacity="0.75" />
        <circle cx="${c.x}" cy="${c.y}" r="${r + 4}" fill="var(--color-primary)" opacity="0.15" />
        <title>${city}: ${data.count} loan${data.count>1?'s':''} · ${Display.currency(data.total)}</title>`;
    }).join('');

    // Simplified continental US outline path
    const usPath = `M 150,120 L 155,95 L 170,85 L 200,80 L 230,75 L 260,70 L 290,68 L 320,65 L 350,63 L 380,62 L 420,62 L 460,64 L 490,68 L 510,72 L 530,70 L 560,65 L 590,62 L 620,65 L 650,70 L 670,80 L 680,95 L 685,110 L 682,130 L 675,148 L 665,162 L 655,175 L 648,190 L 642,210 L 638,225 L 640,240 L 644,255 L 648,265 L 645,278 L 635,290 L 620,298 L 600,302 L 580,305 L 560,308 L 535,312 L 510,315 L 485,318 L 460,318 L 435,315 L 410,310 L 385,305 L 360,300 L 335,295 L 310,290 L 285,282 L 262,272 L 242,260 L 228,248 L 215,235 L 205,220 L 195,205 L 183,192 L 170,178 L 158,160 L 150,145 Z`;

    return `
      <div style="position:relative;background:#F8F7F2;border-radius:6px;overflow:hidden;padding:8px">
        <svg viewBox="0 0 800 400" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
          <!-- US outline -->
          <path d="${usPath}" fill="#E8E6E0" stroke="#C8C5BE" stroke-width="1.5" />
          <!-- State boundary suggestions (major divisions, simplified) -->
          <line x1="420" y1="62" x2="415" y2="318" stroke="#D4D1CA" stroke-width="0.8" opacity="0.5"/>
          <line x1="530" y1="70" x2="535" y2="312" stroke="#D4D1CA" stroke-width="0.8" opacity="0.5"/>
          <line x1="310" y1="65" x2="310" y2="290" stroke="#D4D1CA" stroke-width="0.8" opacity="0.5"/>
          <!-- Loan location dots -->
          ${dots || ''}
        </svg>
        ${Object.keys(cityData).length === 0 ? '<div style="text-align:center;font-size:12px;color:var(--color-text-muted);padding:8px">No location data</div>' : ''}
        <div style="display:flex;gap:16px;flex-wrap:wrap;padding:4px 4px 0">
          ${Object.entries(cityData).map(([city, d]) => `
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--color-text-secondary)">
              <span style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);display:inline-block;opacity:0.75"></span>
              ${city} (${d.count})
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ---- New Application modal (LO in data mode) ---- */
  _openNewAppModal() {
    const el = document.getElementById('dp-modal');
    if (!el) return;
    el.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)DataPlatformView._closeModal()">
        <div class="modal">
          <div class="modal-header">
            <div>
              <div class="modal-title">New Application</div>
              <div class="modal-subtitle">Start a Home Equity Investment origination</div>
            </div>
            <button class="modal-close" onclick="DataPlatformView._closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Borrower Full Name *</label>
                <input class="input" id="dp-new-borrower" placeholder="Jane & John Smith" />
              </div>
              <div class="form-group form-full">
                <label>Property Address *</label>
                <input class="input" id="dp-new-address" placeholder="123 Main St, Nashville, TN 37201" />
              </div>
              <div class="form-group">
                <label>HEI Amount ($) *</label>
                <input class="input" id="dp-new-amount" type="number" placeholder="150000" />
              </div>
              <div class="form-group">
                <label>Program *</label>
                <select class="select-input" id="dp-new-program">
                  <option value="DC Dream Fund">DC Dream Fund</option>
                  <option value="Kentucky Dream Fund">Kentucky Dream Fund</option>
                  <option value="Standard HEI">Standard HEI</option>
                  <option value="Jumbo HEI">Jumbo HEI</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="DataPlatformView._closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="DataPlatformView._submitNew()">Create Draft</button>
          </div>
        </div>
      </div>`;
  },

  _submitNew() {
    const borrower = document.getElementById('dp-new-borrower')?.value.trim();
    const address  = document.getElementById('dp-new-address')?.value.trim();
    const amount   = parseInt(document.getElementById('dp-new-amount')?.value) || 0;
    const program  = document.getElementById('dp-new-program')?.value;
    const user     = State.getCurrentUser();

    if (!borrower || !address || !amount) { alert('Please fill in all required fields.'); return; }

    const id = `ORG-2026-${String(Math.floor(Math.random() * 9000 + 1000))}`;
    State.getLoans().push({ id, companyId: user.companyId, branchId: user.branchId, loId: user.id, borrowerName: borrower, address, amount, program, status: 'draft', ltv: null, submittedAt: null, cltv: null });
    this._closeModal();
    App.renderView('/data/applications');
  },

  _closeModal() {
    const el = document.getElementById('dp-modal');
    if (el) el.innerHTML = '';
  },
};
