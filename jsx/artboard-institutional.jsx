/* ARTBOARD 1 — INSTITUTIONAL — refined Homium green + serif (LO / admin pipeline view) */
const InstitutionalArtboard = () => {
  const [selected, setSel] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('all'); // all | mine | sla | new
  const [search, setSearch] = React.useState('');
  const LOANS = HOMIUM_DATA.LOANS;
  const STAGES = HOMIUM_DATA.STAGES;

  const openLoan = (l) => { setSel(l); setDrawerOpen(true); };

  const filteredLoans = LOANS.filter(l => {
    if (search && !(l.borrower.toLowerCase().includes(search.toLowerCase())
                  || l.address.toLowerCase().includes(search.toLowerCase())
                  || l.id.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filter === 'sla')  return l.sla === 'red' || l.sla === 'amber';
    if (filter === 'new')  return l.stageIdx <= 1;
    if (filter === 'mine') return (l.owners || []).some(o => o.initials === 'JO');
    return true;
  });

  const total      = LOANS.reduce((s, l) => s + l.amount, 0);
  const slaAtRisk  = LOANS.filter(l => l.sla === 'red' || l.sla === 'amber').length;
  const inUW       = LOANS.filter(l => ['uw', 'cda'].includes(l.stageKey)).length;
  const fundedQtr  = 88; // demo metric matching the brief
  const avgDays    = Math.round(LOANS.reduce((s,l)=>s+l.daysInStage,0) / LOANS.length);

  return (
    <div className="ab-institutional">
      <div className="inst-top">
        <div className="inst-brand">
          <div className="inst-brand-mark">h</div>
          <div className="inst-brand-name">Homium</div>
        </div>
        <nav className="inst-nav">
          <a className="active">Applications</a>
          <a>Pipeline</a>
          <a>Closings</a>
          <a>Reports</a>
          <a>Settings</a>
        </nav>
        <div className="inst-top-right">
          <div className="inst-cmdk">
            <Icon name="search" size={14}/>
            <span>Jump to loan, borrower, or address</span>
            <kbd>⌘K</kbd>
          </div>
          <button className="inst-bell">
            <Icon name="bell" size={18} style={{color:'var(--h-ink-2)'}}/>
            <span className="inst-bell-dot"/>
          </button>
          <div className="inst-user">
            <div>
              <div className="inst-user-name">James Okafor</div>
              <div className="inst-user-role">Originator · CC Lending</div>
            </div>
            <div className="inst-user-ava">JO</div>
          </div>
        </div>
      </div>

      <div className="inst-header">
        <div>
          <h1 className="inst-title">Applications <em>in flight</em></h1>
          <div className="inst-subtitle">{LOANS.length} loans · {fmt$(total)} committed · live underwriter activity</div>
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
        <div className="inst-ai-body">
          <b>{slaAtRisk} loan{slaAtRisk === 1 ? '' : 's'} need your attention</b> · the Hayes file (DCDC#5) is 11 days in App stage with no borrower response — a personal call within the next 4 hours could save the August close.
        </div>
        <div className="inst-ai-actions">
          <button className="inst-ai-btn">Read drafts</button>
          <button className="inst-ai-btn">Open Hayes →</button>
        </div>
      </div>

      <div className="inst-stats">
        <div className="inst-stat">
          <div className="inst-stat-label">Capital deployed</div>
          <div className="inst-stat-value">{fmt$k(total)}</div>
          <div className="inst-stat-desc">+$140k this month</div>
        </div>
        <div className="inst-stat">
          <div className="inst-stat-label">Active</div>
          <div className="inst-stat-value">{LOANS.filter(l => l.stageKey !== 'funded').length}</div>
          <div className="inst-stat-desc">1 funded · {LOANS.filter(l => l.stageKey !== 'funded').length} in pipeline</div>
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
      </div>

      <div className="inst-filters">
        <input
          className="inst-filter-search"
          placeholder="Filter by borrower, address, or loan id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className={'inst-filter' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>All ({LOANS.length})</button>
        <button className={'inst-filter' + (filter === 'mine' ? ' active' : '')} onClick={() => setFilter('mine')}>Mine</button>
        <button className={'inst-filter' + (filter === 'sla' ? ' active' : '')} onClick={() => setFilter('sla')}>SLA at risk ({slaAtRisk})</button>
        <button className={'inst-filter' + (filter === 'new' ? ' active' : '')} onClick={() => setFilter('new')}>New</button>
        <div className="inst-view-toggle">
          <button className="active">Table</button>
          <button>Board</button>
        </div>
        <button className="inst-new-app">+ New application</button>
      </div>

      <div className="inst-table-wrap">
        <table className="inst-table">
          <thead>
            <tr>
              <th style={{width: '18%'}}>Loan / Borrower</th>
              <th style={{width: '16%'}}>Address</th>
              <th style={{width: '9%'}}>Amount</th>
              <th style={{width: '20%'}}>Stage</th>
              <th style={{width: '14%'}}>Next action</th>
              <th style={{width: '12%'}}>Originator</th>
              <th style={{width: '10%'}}>Updated</th>
              <th style={{width: 6}}></th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.map(loan => (
              <tr key={loan.id} onClick={() => openLoan(loan)} style={{cursor: 'pointer'}}>
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
                    <div className="inst-owner">{loan.owners[0].name}</div>
                    <div className="inst-owner-org">{loan.owners[0].org}</div>
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
            ))}
          </tbody>
        </table>
      </div>

      <Drawer loan={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)}/>
    </div>
  );
};

window.InstitutionalArtboard = InstitutionalArtboard;
