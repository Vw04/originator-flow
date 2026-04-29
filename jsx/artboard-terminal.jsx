/* ARTBOARD 2 — TERMINAL: dense, dark, power-user for Homium UW/Ops */
const TerminalArtboard = () => {
  const [selected, setSel] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const STAGES = HOMIUM_DATA.STAGES;
  const LOANS = HOMIUM_DATA.LOANS;

  const openLoan = (l) => { setSel(l); setDrawerOpen(true); };

  return (
    <div className="ab-terminal" style={{position:'relative'}}>
      {/* Sidebar */}
      <aside className="term-side">
        <div className="term-brand">
          <div className="term-brand-mark">h</div>
          <div className="term-brand-name">homium</div>
          <div className="term-brand-env">UW</div>
        </div>

        <div className="term-nav-group">
          <div className="term-nav-label">Workspace</div>
          <div className="term-nav-item"><Icon name="home" size={14}/> Dashboard</div>
          <div className="term-nav-item active"><Icon name="list" size={14}/> Applications <span className="term-nav-count">8</span></div>
          <div className="term-nav-item"><Icon name="doc" size={14}/> Queue <span className="term-nav-count">23</span></div>
          <div className="term-nav-item"><Icon name="activity" size={14}/> Activity</div>
        </div>

        <div className="term-nav-group">
          <div className="term-nav-label">Portfolio</div>
          <div className="term-nav-item"><Icon name="pie" size={14}/> Programs</div>
          <div className="term-nav-item"><Icon name="users" size={14}/> Borrowers</div>
          <div className="term-nav-item"><Icon name="archive" size={14}/> Batches</div>
        </div>

        <div className="term-nav-group">
          <div className="term-nav-label">Admin</div>
          <div className="term-nav-item"><Icon name="users" size={14}/> Users</div>
          <div className="term-nav-item"><Icon name="settings" size={14}/> Settings</div>
        </div>

        <div style={{marginTop:'auto', padding:'10px', borderTop:'1px solid #1E1F22', display:'flex', alignItems:'center', gap:8}}>
          <div style={{width:24,height:24,borderRadius:'50%',background:'#0369A1',display:'grid',placeItems:'center',fontSize:10,fontWeight:600,color:'#fff'}}>PS</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:11, fontWeight:500, color:'#F3F4F6'}}>Priya Shah</div>
            <div style={{fontSize:10, color:'#6B7280', fontFamily:'var(--font-mono)'}}>underwriter@homium</div>
          </div>
        </div>
      </aside>

      <main className="term-main">
        {/* topbar */}
        <div className="term-topbar">
          <div className="term-crumb">
            <span>homium</span><span className="term-crumb-sep">/</span>
            <span>workspace</span><span className="term-crumb-sep">/</span>
            <span style={{color:'#F3F4F6'}}>applications</span>
          </div>
          <div className="term-presence">
            <AvatarStack people={[HOMIUM_DATA.PEOPLE.james, HOMIUM_DATA.PEOPLE.dana, HOMIUM_DATA.PEOPLE.marcus]} live={['JO','DH','MW']} />
            <span className="term-presence-count">3 online</span>
          </div>
          <button className="term-cmdk">
            <Icon name="search" size={12}/>
            <span>search or run command</span>
            <kbd>⌘K</kbd>
          </button>
        </div>

        {/* page header */}
        <div className="term-page-header">
          <div>
            <div className="term-h1">applications <span>pipeline · 8 loans · $1.39M committed</span></div>
          </div>
          <div style={{display:'flex', gap:6}}>
            <button style={{padding:'5px 10px', background:'#18191B', border:'1px solid #2B2D30', borderRadius:5, fontSize:11, color:'#A1A1AA', fontFamily:'var(--font-mono)'}}>export.csv</button>
            <button style={{padding:'5px 10px', background:'#1A2E21', border:'1px solid #2D5C3D', borderRadius:5, fontSize:11, color:'#BFD3E8', fontFamily:'var(--font-mono)'}}>+ new</button>
          </div>
        </div>

        {/* stats strip */}
        <div className="term-stats">
          <div className="term-stat">
            <div className="term-stat-label">pipeline</div>
            <div className="term-stat-value">$1.23M</div>
            <div className="term-stat-delta up">▲ $140k</div>
          </div>
          <div className="term-stat">
            <div className="term-stat-label">pending actions</div>
            <div className="term-stat-value bad">6</div>
            <div className="term-stat-delta down">2 breached</div>
          </div>
          <div className="term-stat">
            <div className="term-stat-label">with UW</div>
            <div className="term-stat-value">4</div>
            <div className="term-stat-delta">queue 7</div>
          </div>
          <div className="term-stat">
            <div className="term-stat-label">avg stage days</div>
            <div className="term-stat-value">22</div>
            <div className="term-stat-delta up">▼ 3d</div>
          </div>
          <div className="term-stat">
            <div className="term-stat-label">throughput 30d</div>
            <div className="term-stat-value">13%</div>
            <div className="term-spark">
              {[4,3,6,5,8,7,9,6,10,11,9,13].map((v,i) => (
                <div key={i} className={`term-spark-bar ${v > 9 ? 'peak' : ''}`} style={{height: `${v*2}px`}}/>
              ))}
            </div>
          </div>
          <div className="term-stat">
            <div className="term-stat-label">median close</div>
            <div className="term-stat-value">34d</div>
            <div className="term-stat-delta">target 30d</div>
          </div>
        </div>

        {/* filters */}
        <div className="term-filters">
          <input className="term-filter-search" placeholder="search: borrower, loan, addr…"/>
          <span className="term-filter-chip active">stage:any</span>
          <span className="term-filter-chip">program:dc</span>
          <span className="term-filter-chip active">sla:red|amber</span>
          <span className="term-filter-chip">assignee:me</span>
          <span className="term-filter-chip-add">+ filter</span>
          <div style={{marginLeft:'auto', display:'flex', gap:6}}>
            <button className="term-filter-chip">group:stage</button>
            <button className="term-filter-chip">sort:updated ↓</button>
          </div>
        </div>

        {/* table */}
        <div className="term-table-wrap">
          <table className="term-table">
            <thead>
              <tr>
                <th style={{width:'6%'}}>id</th>
                <th style={{width:'16%'}}>borrower</th>
                <th style={{width:'14%'}}>address</th>
                <th style={{width:'9%'}}>amount</th>
                <th style={{width:'13%'}}>stage</th>
                <th style={{width:'7%'}}>d/stage</th>
                <th style={{width:'7%'}}>sla</th>
                <th style={{width:'10%'}}>next</th>
                <th style={{width:'9%'}}>uw</th>
                <th style={{width:'9%'}}>updated</th>
              </tr>
            </thead>
            <tbody>
              {LOANS.map(loan => (
                <tr key={loan.id} className={selected?.id === loan.id ? 'selected' : ''}
                    onClick={() => openLoan(loan)}>
                  <td className="term-id">{loan.id.replace('DCDC000','#')}</td>
                  <td className="term-borrower">{loan.borrower}</td>
                  <td style={{color:'#9CA3AF'}}>{loan.address}</td>
                  <td className="term-amount">{fmt$(loan.amount)}</td>
                  <td><StageSegments progress={loan.progress}/></td>
                  <td style={{fontFamily:'var(--font-mono)', color: loan.sla==='red' ? '#F87171' : loan.sla==='amber' ? '#FBBF24' : '#D1D5DB'}}>{loan.daysInStage}d</td>
                  <td><span className={`term-sla ${loan.sla}`}>● {loan.sla}</span></td>
                  <td>
                    {loan.nextActor ? (
                      <span className={`term-action ${loan.nextActor}`}>{loan.nextActor}</span>
                    ) : <span style={{color:'#4B5563'}}>—</span>}
                  </td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:6}}>
                      <Avatar person={loan.underwriter}/>
                      <span style={{fontSize:11}}>{loan.underwriter.name.split(' ')[0]}</span>
                    </div>
                  </td>
                  <td style={{fontFamily:'var(--font-mono)', fontSize:11, color:'#6B7280'}}>{loan.updatedHours}h ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{padding:'8px 14px', borderTop:'1px solid #1E1F22', display:'flex', justifyContent:'space-between', fontFamily:'var(--font-mono)', fontSize:11, color:'#6B7280'}}>
          <span>8 rows · selection: {selected ? '1' : '0'}</span>
          <span>↑↓ navigate · enter open · ⌘k palette · esc close</span>
        </div>
      </main>

      <Drawer loan={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

window.TerminalArtboard = TerminalArtboard;
