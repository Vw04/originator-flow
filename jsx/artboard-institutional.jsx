/* ARTBOARD 1 — INSTITUTIONAL — refined Homium green + serif.
   `context` selects framing: 'applications' (originator-focused, default) or
   'originations' (underwriter-focused). Layout is identical; copy + filter chips
   + KPI emphasis differ to preserve the original page differentiation. */
const InstitutionalArtboard = ({ context = 'applications' } = {}) => {
  const isUW = context === 'originations';
  const [selected, setSel] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const LOANS = HOMIUM_DATA.LOANS;
  const STAGES = HOMIUM_DATA.STAGES;
  const PEOPLE = HOMIUM_DATA.PEOPLE;

  const openLoan = (l) => { setSel(l); setDrawerOpen(true); };

  // Underwriter view = post-doc loans only (UW + CDA + CTC + Funded)
  // Originator view  = full pipeline
  const baseScope = isUW ? LOANS.filter(l => l.stageIdx >= 3) : LOANS;

  const filteredLoans = baseScope.filter(l => {
    if (search && !(l.borrower.toLowerCase().includes(search.toLowerCase())
                  || l.address.toLowerCase().includes(search.toLowerCase())
                  || l.id.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filter === 'sla')  return l.sla === 'red' || l.sla === 'amber';
    if (filter === 'new')  return l.stageIdx <= 1;
    if (filter === 'queue')return l.stageKey === 'uw';
    if (filter === 'cda')  return l.stageKey === 'cda';
    if (filter === 'ctc')  return l.stageKey === 'ctc';
    if (filter === 'mine') return isUW
      ? (l.underwriter && l.underwriter.name === 'Priya Shah')
      : (l.owners || []).some(o => o.initials === 'JO');
    return true;
  });

  const total      = baseScope.reduce((s, l) => s + l.amount, 0);
  const slaAtRisk  = baseScope.filter(l => l.sla === 'red' || l.sla === 'amber').length;
  const inUW       = LOANS.filter(l => ['uw', 'cda'].includes(l.stageKey)).length;
  const inCDA      = LOANS.filter(l => l.stageKey === 'cda').length;
  const inCTC      = LOANS.filter(l => l.stageKey === 'ctc').length;
  const fundedQtr  = 88;
  const avgDays    = Math.round(baseScope.reduce((s,l)=>s+l.daysInStage,0) / Math.max(baseScope.length, 1));

  // Page framing
  const FRAME = isUW ? {
    user: PEOPLE.priya,
    userRole: 'Underwriter · Homium',
    activeNav: 'Pipeline',
    title: 'Underwriting <em>pipeline</em>',
    subtitle: `${baseScope.length} loans in your queue · ${fmt$(total)} committed · live activity`,
    aiBody: `<b>${slaAtRisk} loan${slaAtRisk === 1 ? '' : 's'} flagged</b> · ${inCDA} awaiting condition-of-approval review, ${inCTC} ready for clear-to-close. Priya — pulling Hayes (DCDC#5) up first will unblock James downstream.`,
    filters: [
      { id: 'all',   label: `Queue (${baseScope.length})` },
      { id: 'mine',  label: 'My queue' },
      { id: 'sla',   label: `SLA at risk (${slaAtRisk})` },
      { id: 'cda',   label: `In CDA (${inCDA})` },
      { id: 'ctc',   label: `In CTC (${inCTC})` },
    ],
    primaryCta: null,
    ownerLabel: 'Underwriter',
    showActionAs: 'underwriter',
  } : {
    user: PEOPLE.james,
    userRole: 'Originator · CC Lending',
    activeNav: 'Applications',
    title: 'Applications <em>in flight</em>',
    subtitle: `${baseScope.length} loans · ${fmt$(total)} committed · live underwriter activity`,
    aiBody: `<b>${slaAtRisk} loan${slaAtRisk === 1 ? '' : 's'} need your attention</b> · the Hayes file (DCDC#5) is 11 days in App stage with no borrower response — a personal call within the next 4 hours could save the August close.`,
    filters: [
      { id: 'all',   label: `All (${baseScope.length})` },
      { id: 'mine',  label: 'Mine' },
      { id: 'sla',   label: `SLA at risk (${slaAtRisk})` },
      { id: 'new',   label: 'New' },
    ],
    primaryCta: { label: '+ New application', action: () => {} },
    ownerLabel: 'Originator',
    showActionAs: 'originator',
  };

  return (
    <div className="ab-institutional">
      {/* `.inst-top` removed — the host app's topnav provides logo, nav, search,
          notifications, and user profile. The header below carries the
          page-specific framing instead. */}

      <div className="inst-header">
        <div>
          <h1 className="inst-title" dangerouslySetInnerHTML={{__html: FRAME.title}}/>
          <div className="inst-subtitle">{FRAME.subtitle}</div>
        </div>
        <div style={{fontSize: 11, color: 'var(--h-ink-3)', display: 'flex', alignItems: 'center', gap: 8}}>
          <span className="pill-dot" style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: 'var(--h-success)'
          }}/>
          <span>3 teammates online</span>
        </div>
      </div>

      <div className="inst-ai">
        <div className="inst-ai-body" dangerouslySetInnerHTML={{__html: FRAME.aiBody}}/>
        <div className="inst-ai-actions">
          <button className="inst-ai-btn">Read drafts</button>
          <button className="inst-ai-btn">Open Hayes →</button>
        </div>
      </div>

      <div className="inst-stats">
        {isUW ? (<>
          <div className="inst-stat">
            <div className="inst-stat-label">In queue</div>
            <div className="inst-stat-value">{baseScope.length}</div>
            <div className="inst-stat-desc">{fmt$k(total)} committed</div>
          </div>
          <div className="inst-stat">
            <div className="inst-stat-label">SLA at risk</div>
            <div className="inst-stat-value danger">{slaAtRisk}</div>
            <div className="inst-stat-desc">action required today</div>
          </div>
          <div className="inst-stat">
            <div className="inst-stat-label">In CDA</div>
            <div className="inst-stat-value">{inCDA}</div>
            <div className="inst-stat-desc">condition-of-approval review</div>
          </div>
          <div className="inst-stat">
            <div className="inst-stat-label">In CTC</div>
            <div className="inst-stat-value">{inCTC}</div>
            <div className="inst-stat-desc">clear-to-close</div>
          </div>
          <div className="inst-stat">
            <div className="inst-stat-label">Avg days in UW</div>
            <div className="inst-stat-value">{avgDays}</div>
            <div className="inst-stat-desc">↓ 2d vs trailing 30d</div>
          </div>
          <div className="inst-stat">
            <div className="inst-stat-label">Funded · QTD</div>
            <div className="inst-stat-value">{fundedQtr}</div>
            <div className="inst-stat-desc">$19.4M · 88 households</div>
          </div>
        </>) : (<>
          <div className="inst-stat">
            <div className="inst-stat-label">Capital deployed</div>
            <div className="inst-stat-value">{fmt$k(total)}</div>
            <div className="inst-stat-desc">+$140k this month</div>
          </div>
          <div className="inst-stat">
            <div className="inst-stat-label">Active</div>
            <div className="inst-stat-value">{baseScope.filter(l => l.stageKey !== 'funded').length}</div>
            <div className="inst-stat-desc">1 funded · {baseScope.filter(l => l.stageKey !== 'funded').length} in pipeline</div>
          </div>
          <div className="inst-stat">
            <div className="inst-stat-label">SLA at risk</div>
            <div className="inst-stat-value danger">{slaAtRisk}</div>
            <div className="inst-stat-desc">1 breach · 1 amber</div>
          </div>
          <div className="inst-stat">
            <div className="inst-stat-label">In review</div>
            <div className="inst-stat-value">{inUW}</div>
            <div className="inst-stat-desc">With underwriter</div>
          </div>
          <div className="inst-stat">
            <div className="inst-stat-label">Avg days in stage</div>
            <div className="inst-stat-value">{avgDays}</div>
            <div className="inst-stat-desc">↓ 3d vs last month</div>
          </div>
          <div className="inst-stat">
            <div className="inst-stat-label">Funded · QTD</div>
            <div className="inst-stat-value">{fundedQtr}</div>
            <div className="inst-stat-desc">$19.4M · 88 households</div>
          </div>
        </>)}
      </div>

      <div className="inst-filters">
        <input
          className="inst-filter-search"
          placeholder={isUW ? 'Filter by borrower, address, or loan id…' : 'Filter by borrower, address, or loan id…'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {FRAME.filters.map(f => (
          <button key={f.id}
                  className={'inst-filter' + (filter === f.id ? ' active' : '')}
                  onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
        <div className="inst-view-toggle">
          <button className="active">Table</button>
          <button>Board</button>
        </div>
        {FRAME.primaryCta && <button className="inst-new-app">{FRAME.primaryCta.label}</button>}
      </div>

      <div className="inst-table-wrap">
        <table className="inst-table">
          <thead>
            <tr>
              {isUW && <th style={{width: 32}}></th>}
              <th style={{width: '18%'}}>Loan / Borrower</th>
              <th style={{width: '16%'}}>Address</th>
              <th style={{width: '9%'}}>Amount</th>
              <th style={{width: '20%'}}>Stage</th>
              <th style={{width: '14%'}}>Next action</th>
              <th style={{width: '12%'}}>{FRAME.ownerLabel}</th>
              <th style={{width: '10%'}}>Updated</th>
              <th style={{width: 6}}></th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.map(loan => {
              const queued = isUW && typeof State !== 'undefined' && State.getAtriumScope().includes(loan.id);
              return (
              <tr key={loan.id} onClick={() => openLoan(loan)} style={{cursor: 'pointer'}}>
                {isUW && (
                  <td onClick={(e) => e.stopPropagation()} style={{textAlign: 'center'}}>
                    <input
                      type="checkbox"
                      checked={queued}
                      onChange={() => window.OriginationsView && window.OriginationsView._toggleAtriumQueue(loan.id)}
                      title="Queue for Atrium workbench"
                      style={{accentColor: '#1D3D2A', cursor: 'pointer'}}
                    />
                  </td>
                )}
                <td>
                  <div className="inst-cell-id">{loan.id}</div>
                  <div className="inst-cell-name">{loan.borrower}</div>
                </td>
                <td>
                  <div className="inst-cell-addr">{loan.address}</div>
                  <div className="inst-cell-addr-2">{loan.cityState}</div>
                </td>
                <td><span className="inst-amount">{fmt$(loan.amount)}</span></td>
                <td><StageProgress progress={loan.progress} stages={STAGES} showLabel/></td>
                <td>
                  {loan.nextAction ? (
                    <div>
                      <span className={'inst-action ' + (loan.nextActor || '')}>
                        <span className="pill-dot" style={{
                          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                          background: 'currentColor'
                        }}/> {loan.nextActor}
                      </span>
                      <div style={{fontSize: 11, color: 'var(--h-ink-2)', marginTop: 4}}>{loan.nextAction}</div>
                    </div>
                  ) : <span style={{color: 'var(--h-ink-3)'}}>—</span>}
                </td>
                <td>
                  <div className="inst-owner-list">
                    <div className="inst-owner">{isUW ? loan.underwriter.name : loan.owners[0].name}</div>
                    <div className="inst-owner-org">{isUW ? loan.underwriter.org : loan.owners[0].org}</div>
                  </div>
                </td>
                <td>
                  <div className={'inst-updated' + (loan.sla === 'red' ? ' sla-red' : loan.sla === 'amber' ? ' sla-amber' : '')}>
                    {loan.updatedAgo}
                    {loan.sla === 'red' && <div style={{fontSize: 10, marginTop: 2}}>⚠ SLA breach</div>}
                    {loan.sla === 'amber' && <div style={{fontSize: 10, marginTop: 2}}>approaching SLA</div>}
                  </div>
                </td>
                <td><Icon name="chevR" size={14} style={{color: 'var(--h-ink-3)'}}/></td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer loan={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)}/>
    </div>
  );
};

window.InstitutionalArtboard = InstitutionalArtboard;
