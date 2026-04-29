/* ARTBOARD 4 — SPATIAL: map-first command center (DC map + stage pins) */
const SpatialArtboard = () => {
  const [selected, setSel] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(null);
  const LOANS = HOMIUM_DATA.LOANS;
  const STAGES = HOMIUM_DATA.STAGES;

  // Approximate DC lat/lng → projected into a 0..1 box for drawing.
  // We hand-place each loan's pin roughly where its real address would fall.
  const PINS = [
    { id: 'DCDC000001', x: 0.22, y: 0.30 }, // Wisconsin Ave NW
    { id: 'DCDC000002', x: 0.44, y: 0.42 }, // U St NW
    { id: 'DCDC000003', x: 0.62, y: 0.48 }, // G St NE
    { id: 'DCDC000004', x: 0.39, y: 0.18 }, // Rittenhouse St NW
    { id: 'DCDC000005', x: 0.73, y: 0.76 }, // Penn Ave SE
    { id: 'DCDC000006', x: 0.41, y: 0.36 }, // Park Rd NW
    { id: 'DCDC000007', x: 0.42, y: 0.32 }, // Lamont St NW
    { id: 'DCDC000008', x: 0.58, y: 0.24 }, // 7th St NE
  ];

  const stageColor = (l) => {
    if (l.stageKey === 'funded') return '#16A34A';
    if (l.sla === 'red') return '#DC2626';
    if (l.sla === 'amber') return '#D97706';
    return '#0E2A47';
  };

  const openLoan = (l) => { setSel(l); setDrawerOpen(true); };
  const loanById = (id) => LOANS.find(l => l.id === id);

  return (
    <div className="ab-spatial" style={{position:'relative', height:'100%', display:'flex', flexDirection:'column', background:'var(--h-paper)', overflow:'hidden'}}>
      {/* top bar (reuse institutional) */}
      <div className="inst-top">
        <div className="inst-brand">
          <div className="inst-brand-mark">h</div>
          <div className="inst-brand-name">Homium</div>
        </div>
        <nav className="inst-nav">
          <a>Dashboard</a>
          <a>Applications</a>
          <a className="active">Command Center</a>
          <a>Batches</a>
          <a>Administration</a>
        </nav>
        <div className="inst-top-right">
          <button className="inst-cmdk"><Icon name="search" size={13}/><span>Search the District…</span><kbd>⌘K</kbd></button>
          <div className="inst-user">
            <div style={{textAlign:'right'}}>
              <div className="inst-user-name">Rhea Tanaka</div>
              <div className="inst-user-role">Portfolio Mgr · DC HFA</div>
            </div>
            <div className="inst-user-ava" style={{background:'#7C3AED'}}>RT</div>
          </div>
        </div>
      </div>

      {/* dense header strip */}
      <div style={{padding:'18px 28px 16px', borderBottom:'1px solid var(--h-line-2)', display:'flex', alignItems:'flex-end', justifyContent:'space-between'}}>
        <div>
          <h1 className="inst-title" style={{fontSize:28}}>Command Center · <em>the District</em></h1>
          <div className="inst-subtitle">Live map of every loan in flight · 8 pins · click to open workspace</div>
        </div>
        <div style={{display:'flex', gap:20, alignItems:'center'}}>
          <div style={{display:'flex', gap:14}}>
            {[
              { c:'#16A34A', l:'Funded', n:1 },
              { c:'#0E2A47', l:'On track', n:5 },
              { c:'#D97706', l:'Approaching SLA', n:1 },
              { c:'#DC2626', l:'SLA breach', n:1 },
            ].map((k,i) => (
              <div key={i} style={{display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--h-ink-2)'}}>
                <span style={{width:10, height:10, borderRadius:'50%', background:k.c, boxShadow:`0 0 0 3px ${k.c}22`}}/>
                <span>{k.l}</span>
                <span style={{fontFamily:'var(--font-mono)', color:'var(--h-ink-3)'}}>· {k.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* main split: map + side rail */}
      <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 420px', minHeight:0}}>
        {/* MAP */}
        <div style={{position:'relative', background:'#EFECE3', borderRight:'1px solid var(--h-line)', overflow:'hidden'}}>
          {/* Stylized DC map SVG */}
          <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
            <defs>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#D9D3C3" strokeWidth="1"/>
              </pattern>
              <pattern id="hatch2" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <line x1="0" y1="0" x2="0" y2="5" stroke="#B6ECC9" strokeWidth="1.2" opacity="0.5"/>
              </pattern>
              <filter id="soft"><feGaussianBlur stdDeviation="0.6"/></filter>
            </defs>

            {/* Potomac / Anacostia rivers — abstract bands */}
            <path d="M 0 560 Q 120 540 260 620 Q 400 680 560 720 L 800 820 L 800 800 L 0 800 Z" fill="#CFE3DC" opacity="0.6"/>
            <path d="M 540 440 Q 620 480 680 560 Q 720 660 800 700 L 800 560 L 700 480 L 600 420 Z" fill="#CFE3DC" opacity="0.55"/>

            {/* DC diamond outline (rough) */}
            <path d="M 400 50 L 720 380 L 540 760 L 80 400 Z"
                  fill="#FBFAF7" stroke="#C9C2B0" strokeWidth="1.5" strokeDasharray="4 3"/>

            {/* Subtle quadrant guides */}
            <line x1="400" y1="50" x2="540" y2="760" stroke="#D9D3C3" strokeWidth="0.8"/>
            <line x1="80" y1="400" x2="720" y2="380" stroke="#D9D3C3" strokeWidth="0.8"/>

            {/* AMI heatmap zones (LMI overlay — census tracts) */}
            <circle cx="520" cy="520" r="90" fill="url(#hatch2)"/>
            <circle cx="420" cy="280" r="70" fill="url(#hatch2)"/>
            <circle cx="320" cy="420" r="60" fill="url(#hatch2)"/>

            {/* Neighborhood labels */}
            {[
              { x:360, y:180, n:'Shepherd Park' },
              { x:340, y:310, n:'Columbia Hts' },
              { x:460, y:350, n:'Logan Circle' },
              { x:540, y:400, n:'NoMa' },
              { x:520, y:520, n:'Capitol Hill' },
              { x:580, y:600, n:'Anacostia' },
              { x:220, y:270, n:'Tenleytown' },
              { x:300, y:420, n:'Dupont' },
            ].map((p,i) => (
              <text key={i} x={p.x} y={p.y} fontSize="10" fill="#9C9583" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing="0.04em">{p.n}</text>
            ))}

            {/* National Mall rectangle hint */}
            <rect x="380" y="470" width="120" height="12" fill="#E2DCC9" rx="2"/>
            <text x="440" y="496" fontSize="8" fill="#A69E8A" textAnchor="middle" fontFamily="Inter, sans-serif">THE MALL</text>

            {/* Pins */}
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
                  {/* pulse */}
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
                      <text x={cx + 24} y={cy + 2}  fontSize="10" fill="#9CA3AF" fontFamily="Inter, sans-serif">{loan.address}</text>
                      <text x={cx + 24} y={cy + 16} fontSize="10" fill={color} fontFamily="JetBrains Mono, monospace" fontWeight="600">{STAGES[loan.stageIdx].short} · ${(loan.amount/1000).toFixed(0)}k</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Map layer controls */}
          <div style={{position:'absolute', top:16, left:16, background:'#fff', border:'1px solid var(--h-line)', borderRadius:10, padding:'10px 12px', boxShadow:'0 4px 12px rgba(0,0,0,0.06)', fontSize:12}}>
            <div style={{fontSize:10, fontWeight:600, color:'var(--h-ink-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8}}>Layers</div>
            <label style={{display:'flex',alignItems:'center',gap:8, marginBottom:5, cursor:'pointer'}}><input type="checkbox" defaultChecked/> Active loans</label>
            <label style={{display:'flex',alignItems:'center',gap:8, marginBottom:5, cursor:'pointer'}}><input type="checkbox" defaultChecked/> LMI census tracts</label>
            <label style={{display:'flex',alignItems:'center',gap:8, marginBottom:5, cursor:'pointer'}}><input type="checkbox"/> CRA assessment zones</label>
            <label style={{display:'flex',alignItems:'center',gap:8, cursor:'pointer'}}><input type="checkbox"/> Home appreciation heatmap</label>
          </div>

          {/* Coverage callout */}
          <div style={{position:'absolute', bottom:16, left:16, background:'#fff', border:'1px solid var(--h-line)', borderRadius:10, padding:'14px 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.06)', maxWidth:280}}>
            <div style={{fontSize:10, fontWeight:600, color:'var(--h-green)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6}}>Fair-lending coverage</div>
            <div style={{fontFamily:'var(--font-serif)', fontSize:22, fontWeight:300, lineHeight:1.1, letterSpacing:'-0.01em'}}>
              6 of 8 loans in LMI census tracts
            </div>
            <div style={{fontSize:11, color:'var(--h-ink-3)', marginTop:6}}>
              Ward 7 & 8 underserved — 0 active positions. AI suggests targeted outreach.
            </div>
          </div>

          {/* Zoom */}
          <div style={{position:'absolute', bottom:16, right:16, display:'flex', flexDirection:'column', background:'#fff', border:'1px solid var(--h-line)', borderRadius:8, overflow:'hidden'}}>
            <button style={{padding:'8px 10px', fontSize:16, borderBottom:'1px solid var(--h-line)'}}>+</button>
            <button style={{padding:'8px 10px', fontSize:16}}>−</button>
          </div>
        </div>

        {/* Side rail */}
        <div style={{overflow:'auto', padding:'16px 20px', background:'#fff'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
            <div style={{fontSize:11, fontWeight:600, color:'var(--h-ink-3)', textTransform:'uppercase', letterSpacing:'0.08em'}}>In flight · 8</div>
            <div style={{fontSize:11, color:'var(--h-ink-3)'}}>sorted by urgency</div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[...LOANS]
              .sort((a,b) => {
                const order = { red:0, amber:1, green:2 };
                return order[a.sla] - order[b.sla];
              })
              .map(l => {
                const color = stageColor(l);
                return (
                  <div key={l.id}
                       onClick={() => openLoan(l)}
                       onMouseEnter={() => setHovered(l.id)}
                       onMouseLeave={() => setHovered(null)}
                       style={{padding:14, border:'1px solid var(--h-line)', borderRadius:10, cursor:'pointer', background: selected?.id===l.id ? 'var(--h-mint)' : '#fff', transition:'background 0.15s'}}>
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
                      {l.sla === 'red' && <span style={{color:'var(--h-red)', fontWeight:600}}>⚠ {l.daysInStage}d — SLA breach</span>}
                      {l.sla === 'amber' && <span style={{color:'var(--h-amber)', fontWeight:600}}>{l.daysInStage}d — approaching</span>}
                      {l.sla === 'green' && <span>{l.daysInStage}d in stage</span>}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <Drawer loan={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)}/>
    </div>
  );
};

window.SpatialArtboard = SpatialArtboard;
