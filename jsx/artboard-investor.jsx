/* ARTBOARD 3 — INVESTOR: portfolio + pipeline + command center tabs (Rhea Tanaka, DC HFA) */
const InvestorArtboard = () => {
  const [tab, setTab] = React.useState('portfolio'); // 'portfolio' | 'pipeline' | 'command'
  const [selected, setSel] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(null);
  const LOANS = HOMIUM_DATA.LOANS;
  const STAGES = HOMIUM_DATA.STAGES;
  const openLoan = (l) => { setSel(l); setDrawerOpen(true); };

  // shared
  const stageDist = STAGES.map((s, i) => LOANS.filter(l => l.stageIdx === i).length);
  const maxCol = Math.max(...stageDist, 1);

  return (
    <div className="ab-investor" style={{position:'relative', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden'}}>
      {/* Top bar */}
      <div className="inv-top">
        <div className="inv-brand">
          <div className="inv-brand-mark">h</div>
          <div>
            <div className="inv-brand-name">Homium</div>
            <div className="inv-brand-meta">Sponsor Portal · DC HFA</div>
          </div>
        </div>
        <nav className="inv-nav">
          <a className={tab==='portfolio'?'active':''} onClick={() => setTab('portfolio')}>Portfolio</a>
          <a className={tab==='pipeline'?'active':''}  onClick={() => setTab('pipeline')}>Pipeline</a>
          <a className={tab==='command'?'active':''}   onClick={() => setTab('command')}>Command Center</a>
          <a>Impact</a>
          <a>Reports</a>
          <a>Settings</a>
        </nav>
        <div className="inv-user">
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:12, fontWeight:600}}>Rhea Tanaka</div>
            <div style={{fontSize:11, color:'var(--h-ink-3)'}}>Portfolio Manager · DC HFA</div>
          </div>
          <div style={{width:34, height:34, borderRadius:'50%', background:'#7C3AED', color:'#fff', display:'grid', placeItems:'center', fontSize:12, fontWeight:600}}>RT</div>
        </div>
      </div>

      {tab === 'portfolio' && (
        <div style={{flex:1, overflow:'auto'}}>
          {/* Hero */}
          <div className="inv-hero">
            <div className="inv-hero-eyebrow">DC Dream Fund · Q2 2026</div>
            <h1 className="inv-hero-title">Your capital has helped <em>88 households</em> cross the threshold into ownership this quarter.</h1>
            <div className="inv-hero-sub">
              Live view of your shared-equity portfolio across the District — stage-by-stage, with real-time borrower and underwriter activity.
            </div>
          </div>

          <div className="inv-stats">
            <div className="inv-stat"><div className="inv-stat-label">Capital deployed</div><div className="inv-stat-value">$1.23<span className="inv-stat-unit">M</span></div><div className="inv-stat-delta">+$140k this month</div></div>
            <div className="inv-stat"><div className="inv-stat-label">Active positions</div><div className="inv-stat-value">7</div><div className="inv-stat-delta">1 funded · 6 in pipeline</div></div>
            <div className="inv-stat"><div className="inv-stat-label">Est. appreciation</div><div className="inv-stat-value">+4.8<span className="inv-stat-unit">%</span></div><div className="inv-stat-delta">YoY · portfolio-weighted</div></div>
            <div className="inv-stat"><div className="inv-stat-label">Avg household income</div><div className="inv-stat-value">$78<span className="inv-stat-unit">,500</span></div><div className="inv-stat-delta">82% of area median</div></div>
          </div>

          <div className="inv-main">
            <div style={{display:'flex', flexDirection:'column', gap:24}}>
              <div className="inv-card">
                <div className="inv-card-head">
                  <div>
                    <div className="inv-card-title">Pipeline by stage</div>
                    <div className="inv-card-sub">Where your $1.23M is in the origination flow, today</div>
                  </div>
                  <button onClick={() => setTab('pipeline')} style={{fontSize:12, color:'var(--h-green)', fontWeight:500, padding:'6px 14px', background:'var(--h-mint)', borderRadius:999}}>
                    Open pipeline →
                  </button>
                </div>
                <div className="inv-stage-bar">
                  {STAGES.map((s, i) => (
                    <div key={s.id} className="inv-stage-col">
                      <div className="inv-stage-count">{stageDist[i]}</div>
                      <div className="inv-stage-track">
                        <div className="inv-stage-fill" style={{ height: `${(stageDist[i]/maxCol)*100}%`, opacity: i === 6 ? 1 : 0.8 - (6-i)*0.05 }} />
                      </div>
                      <div className="inv-stage-lbl">{s.short}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="inv-card">
                <div className="inv-card-head">
                  <div>
                    <div className="inv-card-title">Your positions</div>
                    <div className="inv-card-sub">Click any row to see the live origination workspace</div>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--h-ink-3)'}}>
                    <span className="pill-dot" style={{color:'var(--h-success)'}}/> 3 teammates online across DC HFA · Homium
                  </div>
                </div>
                <div className="inv-positions">
                  {LOANS.slice(0, 6).map(l => (
                    <div key={l.id} className="inv-position" onClick={() => openLoan(l)} style={{cursor:'pointer'}}>
                      <div>
                        <div className="inv-position-addr">{l.address}</div>
                        <div className="inv-position-meta">{l.cityState} · {l.borrower} · {l.id}</div>
                      </div>
                      <span className={`inv-position-stage ${l.stageKey === 'funded' ? 'funded' : l.sla === 'red' ? 'hold' : ''}`}>
                        {l.stageKey === 'funded' ? '✓ Funded' : STAGES[l.stageIdx].short}
                      </span>
                      <span className="inv-position-amount">{fmt$(l.amount)}</span>
                      <Icon name="chevR" size={16} style={{color:'var(--h-ink-3)'}}/>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:24}}>
              <div className="inv-card" style={{background: 'linear-gradient(180deg, #FEF9EE 0%, #fff 100%)', borderColor:'#F1E0B9'}}>
                <div className="inv-card-head">
                  <div>
                    <div className="inv-card-title">Impact · {new Date().toLocaleDateString('en-US', {month:'long', year:'numeric'})}</div>
                    <div className="inv-card-sub">Measured outcomes for sponsor reporting</div>
                  </div>
                </div>
                <div className="inv-impact-grid">
                  <div className="inv-impact-tile"><div className="inv-impact-val">88<span className="inv-impact-unit">%</span></div><div className="inv-impact-lbl">First-time homebuyers</div></div>
                  <div className="inv-impact-tile"><div className="inv-impact-val">68<span className="inv-impact-unit">%</span></div><div className="inv-impact-lbl">Minority households served</div></div>
                  <div className="inv-impact-tile"><div className="inv-impact-val">82<span className="inv-impact-unit">%</span></div><div className="inv-impact-lbl">Median of area income</div></div>
                  <div className="inv-impact-tile"><div className="inv-impact-val">$26<span className="inv-impact-unit">k</span></div><div className="inv-impact-lbl">Avg equity boost per family</div></div>
                </div>
                <button style={{marginTop:16, width:'100%', padding:'10px 16px', background:'var(--h-gold)', color:'#fff', borderRadius:999, fontSize:12, fontWeight:500}}>
                  Generate Q2 impact report · PDF
                </button>
              </div>

              <div className="inv-card">
                <div className="inv-card-head">
                  <div>
                    <div className="inv-card-title">Live activity</div>
                    <div className="inv-card-sub">Real-time across your portfolio</div>
                  </div>
                  <div style={{fontSize:10, color:'var(--h-success)', fontWeight:600, display:'flex', alignItems:'center', gap:6}}>
                    <span style={{width:8,height:8,background:'var(--h-success)',borderRadius:'50%',animation:'pulse 2s ease-in-out infinite'}}/>
                    LIVE
                  </div>
                </div>
                <div className="act-list">
                  <div className="act-item">
                    <div className="act-ava"><Avatar person={HOMIUM_DATA.PEOPLE.priya}/></div>
                    <div className="act-body">
                      <div><b>Priya Shah</b> approved COA memo on <b>1244 U St NW</b></div>
                      <div className="act-detail">Condition of Approval · $220,000</div>
                      <div className="act-time">6h ago</div>
                    </div>
                  </div>
                  <div className="act-item">
                    <div className="act-ava"><Avatar person={HOMIUM_DATA.PEOPLE.james}/></div>
                    <div className="act-body">
                      <div><b>James Okafor</b> closed & funded <b>509 G St NE</b></div>
                      <div className="act-detail">Wire confirmed · $155,000 · Hill household</div>
                      <div className="act-time">15d ago</div>
                    </div>
                  </div>
                  <div className="act-item">
                    <div className="act-ava"><Avatar person={HOMIUM_DATA.PEOPLE.marcus}/></div>
                    <div className="act-body">
                      <div><b>Marcus Webb</b> issued clear-to-close on <b>2301 Pennsylvania Ave SE</b></div>
                      <div className="act-detail">All conditions satisfied · $230,000</div>
                      <div className="act-time">1d ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'pipeline' && (
        <div style={{flex:1, overflow:'auto', background:'var(--h-paper)'}}>
          <div className="inst-header">
            <div>
              <h1 className="inst-title">Pipeline <em>positions</em></h1>
              <div className="inst-subtitle">8 loans · $1,385,000 committed · live underwriter activity</div>
            </div>
            <div style={{fontSize:11, color:'var(--h-ink-3)', display:'flex', alignItems:'center', gap:8}}>
              <span className="pill-dot" style={{color:'var(--h-success)'}}/>
              <span>3 teammates online</span>
            </div>
          </div>
          <div className="inst-stats">
            <div className="inst-stat"><div className="inst-stat-label">Capital deployed</div><div className="inst-stat-value">$1.23M</div><div className="inst-stat-desc">+$140k this month</div></div>
            <div className="inst-stat"><div className="inst-stat-label">Active positions</div><div className="inst-stat-value">7</div><div className="inst-stat-desc">1 funded · 6 in pipeline</div></div>
            <div className="inst-stat"><div className="inst-stat-label">Pending action</div><div className="inst-stat-value danger">2</div><div className="inst-stat-desc">Stage aging</div></div>
            <div className="inst-stat"><div className="inst-stat-label">In review</div><div className="inst-stat-value">4</div><div className="inst-stat-desc">With underwriter</div></div>
            <div className="inst-stat"><div className="inst-stat-label">Avg days in stage</div><div className="inst-stat-value">22</div><div className="inst-stat-desc">↓ 3d vs last month</div></div>
            <div className="inst-stat"><div className="inst-stat-label">Funded rate</div><div className="inst-stat-value">81<span style={{fontSize:20,color:'var(--h-ink-3)'}}>%</span></div><div className="inst-stat-desc">trailing 90d</div></div>
          </div>
          <div className="inst-table-wrap" style={{paddingBottom:40}}>
            <table className="inst-table">
              <thead>
                <tr>
                  <th style={{width:'18%'}}>Loan / Borrower</th>
                  <th style={{width:'16%'}}>Address</th>
                  <th style={{width:'9%'}}>Amount</th>
                  <th style={{width:'18%'}}>Stage</th>
                  <th style={{width:'14%'}}>Next action</th>
                  <th style={{width:'12%'}}>Originator</th>
                  <th style={{width:'9%'}}>Updated</th>
                  <th style={{width:6}}></th>
                </tr>
              </thead>
              <tbody>
                {LOANS.map(loan => (
                  <tr key={loan.id} onClick={() => openLoan(loan)}>
                    <td>
                      <div className="inst-cell-id">{loan.id}</div>
                      <div className="inst-cell-name">{loan.borrower}</div>
                    </td>
                    <td>
                      <div className="inst-cell-addr">{loan.address}</div>
                      <div className="inst-cell-addr-2">{loan.cityState}</div>
                    </td>
                    <td><span className="inst-amount">{fmt$(loan.amount)}</span></td>
                    <td><StageProgress progress={loan.progress} showLabel stages={STAGES} /></td>
                    <td>
                      {loan.nextAction ? (
                        <div>
                          <span className={`inst-action ${loan.nextActor}`}><span className="pill-dot"/> {loan.nextActor}</span>
                          <div style={{fontSize:11, color:'var(--h-ink-2)', marginTop:4}}>{loan.nextAction}</div>
                        </div>
                      ) : <span style={{color:'var(--h-ink-3)'}}>—</span>}
                    </td>
                    <td>
                      <div className="inst-owner-list">
                        <div className="inst-owner">{loan.owners[0].name}</div>
                        <div className="inst-owner-org">{loan.owners[0].org}</div>
                      </div>
                    </td>
                    <td>
                      <div className={`inst-updated ${loan.sla==='red' ? 'sla-red' : loan.sla==='amber' ? 'sla-amber' : ''}`}>
                        {loan.updatedAgo}
                        {loan.sla === 'red' && <div style={{fontSize:10, marginTop:2}}>⚠ Stage stalled</div>}
                        {loan.sla === 'amber' && <div style={{fontSize:10, marginTop:2}}>stage aging</div>}
                      </div>
                    </td>
                    <td><Icon name="chevR" size={14} style={{color:'var(--h-ink-3)'}}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'command' && (
        <CommandCenterMap LOANS={LOANS} STAGES={STAGES} openLoan={openLoan} selected={selected} hovered={hovered} setHovered={setHovered}/>
      )}

      <Drawer loan={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

/* Reusable Command Center map (used by Investor "Command Center" tab AND
   the standalone Spatial direction). Pure presentation — wires through callbacks. */
const CommandCenterMap = ({ LOANS, STAGES, openLoan, selected, hovered, setHovered, headerVariant = 'investor' }) => {
  const PINS = [
    { id: 'DCDC000001', x: 0.22, y: 0.30 },
    { id: 'DCDC000002', x: 0.44, y: 0.42 },
    { id: 'DCDC000003', x: 0.62, y: 0.48 },
    { id: 'DCDC000004', x: 0.39, y: 0.18 },
    { id: 'DCDC000005', x: 0.73, y: 0.76 },
    { id: 'DCDC000006', x: 0.41, y: 0.36 },
    { id: 'DCDC000007', x: 0.42, y: 0.32 },
    { id: 'DCDC000008', x: 0.58, y: 0.24 },
  ];
  const stageColor = (l) => {
    if (l.stageKey === 'funded') return '#16A34A';
    if (l.sla === 'red') return '#DC2626';
    if (l.sla === 'amber') return '#D97706';
    return '#0E2A47';
  };
  const loanById = (id) => LOANS.find(l => l.id === id);

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden', background:'var(--h-paper)'}}>
      <div style={{padding:'18px 28px 16px', borderBottom:'1px solid var(--h-line-2)', display:'flex', alignItems:'flex-end', justifyContent:'space-between', background:'#fff'}}>
        <div>
          <h1 className="inst-title" style={{fontSize:28}}>Command Center · <em>the District</em></h1>
          <div className="inst-subtitle">Live map of every loan in flight · 8 pins · click to open workspace</div>
        </div>
        <div style={{display:'flex', gap:14}}>
          {[
            { c:'#16A34A', l:'Funded', n:1 },
            { c:'#0E2A47', l:'On track', n:5 },
            { c:'#D97706', l:'Stage aging', n:1 },
            { c:'#DC2626', l:'Stage stalled', n:1 },
          ].map((k,i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--h-ink-2)'}}>
              <span style={{width:10, height:10, borderRadius:'50%', background:k.c, boxShadow:`0 0 0 3px ${k.c}22`}}/>
              <span>{k.l}</span>
              <span style={{fontFamily:'var(--font-mono)', color:'var(--h-ink-3)'}}>· {k.n}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 420px', minHeight:0}}>
        <div style={{position:'relative', background:'#EFECE3', borderRight:'1px solid var(--h-line)', overflow:'hidden'}}>
          <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
            <defs>
              <pattern id="cc-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <line x1="0" y1="0" x2="0" y2="5" stroke="#BFD3E8" strokeWidth="1.2" opacity="0.55"/>
              </pattern>
            </defs>
            <path d="M 0 560 Q 120 540 260 620 Q 400 680 560 720 L 800 820 L 800 800 L 0 800 Z" fill="#CFE0EE" opacity="0.6"/>
            <path d="M 540 440 Q 620 480 680 560 Q 720 660 800 700 L 800 560 L 700 480 L 600 420 Z" fill="#CFE0EE" opacity="0.55"/>
            <path d="M 400 50 L 720 380 L 540 760 L 80 400 Z" fill="#FBFAF7" stroke="#C9C2B0" strokeWidth="1.5" strokeDasharray="4 3"/>
            <line x1="400" y1="50" x2="540" y2="760" stroke="#D9D3C3" strokeWidth="0.8"/>
            <line x1="80" y1="400" x2="720" y2="380" stroke="#D9D3C3" strokeWidth="0.8"/>
            <circle cx="520" cy="520" r="90" fill="url(#cc-hatch)"/>
            <circle cx="420" cy="280" r="70" fill="url(#cc-hatch)"/>
            <circle cx="320" cy="420" r="60" fill="url(#cc-hatch)"/>
            {[
              { x:360, y:180, n:'Shepherd Park' },{ x:340, y:310, n:'Columbia Hts' },
              { x:460, y:350, n:'Logan Circle' },{ x:540, y:400, n:'NoMa' },
              { x:520, y:520, n:'Capitol Hill' },{ x:580, y:600, n:'Anacostia' },
              { x:220, y:270, n:'Tenleytown' },{ x:300, y:420, n:'Dupont' },
            ].map((p,i) => (
              <text key={i} x={p.x} y={p.y} fontSize="10" fill="#9C9583" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing="0.04em">{p.n}</text>
            ))}
            <rect x="380" y="470" width="120" height="12" fill="#E2DCC9" rx="2"/>
            <text x="440" y="496" fontSize="8" fill="#A69E8A" textAnchor="middle" fontFamily="Inter, sans-serif">THE MALL</text>
            {PINS.map(p => {
              const loan = loanById(p.id);
              if (!loan) return null;
              const cx = p.x * 800;
              const cy = p.y * 800;
              const color = stageColor(loan);
              const active = selected?.id === loan.id || hovered === p.id;
              return (
                <g key={p.id} style={{cursor:'pointer'}}
                   onMouseEnter={() => setHovered(p.id)}
                   onMouseLeave={() => setHovered(null)}
                   onClick={() => openLoan(loan)}>
                  {loan.sla === 'red' && (
                    <circle cx={cx} cy={cy} r="22" fill={color} opacity="0.2">
                      <animate attributeName="r" values="14;28;14" dur="2.4s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite"/>
                    </circle>
                  )}
                  <circle cx={cx} cy={cy} r={active ? 14 : 11} fill="#fff" stroke={color} strokeWidth="3"/>
                  <circle cx={cx} cy={cy} r={active ? 7 : 5} fill={color}/>
                  {active && (
                    <g>
                      <rect x={cx + 14} y={cy - 28} width="170" height="54" rx="7" fill="#1A1A18" opacity="0.96"/>
                      <text x={cx + 24} y={cy - 12} fontSize="10.5" fill="#E5E7EB" fontFamily="Inter, sans-serif" fontWeight="600">{loan.borrower}</text>
                      <text x={cx + 24} y={cy + 2} fontSize="10" fill="#9CA3AF" fontFamily="Inter, sans-serif">{loan.address}</text>
                      <text x={cx + 24} y={cy + 16} fontSize="10" fill={color} fontFamily="JetBrains Mono, monospace" fontWeight="600">{STAGES[loan.stageIdx].short} · ${(loan.amount/1000).toFixed(0)}k</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          <div style={{position:'absolute', top:16, left:16, background:'#fff', border:'1px solid var(--h-line)', borderRadius:10, padding:'10px 12px', boxShadow:'0 4px 12px rgba(0,0,0,0.06)', fontSize:12}}>
            <div style={{fontSize:10, fontWeight:600, color:'var(--h-ink-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8}}>Layers</div>
            <label style={{display:'flex',alignItems:'center',gap:8, marginBottom:5, cursor:'pointer'}}><input type="checkbox" defaultChecked/> Active loans</label>
            <label style={{display:'flex',alignItems:'center',gap:8, marginBottom:5, cursor:'pointer'}}><input type="checkbox" defaultChecked/> LMI census tracts</label>
            <label style={{display:'flex',alignItems:'center',gap:8, marginBottom:5, cursor:'pointer'}}><input type="checkbox"/> CRA assessment zones</label>
            <label style={{display:'flex',alignItems:'center',gap:8, cursor:'pointer'}}><input type="checkbox"/> Home appreciation heatmap</label>
          </div>

          <div style={{position:'absolute', bottom:16, left:16, background:'#fff', border:'1px solid var(--h-line)', borderRadius:10, padding:'14px 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.06)', maxWidth:280}}>
            <div style={{fontSize:10, fontWeight:600, color:'var(--h-green)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6}}>Fair-lending coverage</div>
            <div style={{fontFamily:'var(--font-serif)', fontSize:22, fontWeight:300, lineHeight:1.1, letterSpacing:'-0.01em'}}>
              6 of 8 loans in LMI census tracts
            </div>
            <div style={{fontSize:11, color:'var(--h-ink-3)', marginTop:6}}>
              Ward 7 & 8 underserved — 0 active positions. AI suggests targeted outreach.
            </div>
          </div>
        </div>

        <div style={{overflow:'auto', padding:'16px 20px', background:'#fff'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
            <div style={{fontSize:11, fontWeight:600, color:'var(--h-ink-3)', textTransform:'uppercase', letterSpacing:'0.08em'}}>In flight · 8</div>
            <div style={{fontSize:11, color:'var(--h-ink-3)'}}>sorted by urgency</div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[...LOANS]
              .sort((a,b) => ({red:0,amber:1,green:2}[a.sla]) - ({red:0,amber:1,green:2}[b.sla]))
              .map(l => {
                const color = stageColor(l);
                return (
                  <div key={l.id}
                       onClick={() => openLoan(l)}
                       onMouseEnter={() => setHovered(l.id)}
                       onMouseLeave={() => setHovered(null)}
                       style={{padding:14, border:'1px solid var(--h-line)', borderRadius:10, cursor:'pointer', background: selected?.id===l.id ? 'var(--h-mint)' : '#fff'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
                      <span style={{width:10, height:10, borderRadius:'50%', background:color, flexShrink:0, boxShadow:`0 0 0 3px ${color}22`}}/>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:13, fontWeight:600}}>{l.borrower}</div>
                        <div style={{fontSize:11, color:'var(--h-ink-3)'}}>{l.address}</div>
                      </div>
                      <div className="inst-amount" style={{fontSize:16}}>{fmt$k(l.amount)}</div>
                    </div>
                    <StageProgress progress={l.progress} stages={STAGES}/>
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:10, color:'var(--h-ink-3)'}}>
                      <span style={{textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, color}}>{STAGES[l.stageIdx].short}</span>
                      {l.sla === 'red' && <span style={{color:'var(--h-red)', fontWeight:600}}>⚠ {l.daysInStage}d — Stage stalled</span>}
                      {l.sla === 'amber' && <span style={{color:'var(--h-amber)', fontWeight:600}}>{l.daysInStage}d — approaching</span>}
                      {l.sla === 'green' && <span>{l.daysInStage}d in stage</span>}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

window.InvestorArtboard = InvestorArtboard;
window.CommandCenterMap = CommandCenterMap;
