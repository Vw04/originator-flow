/* COMMAND DASHBOARD — Map-centered dashboard for platform operators + investors.
   Reuses the Spatial artboard's DC map at the center, surrounds it with the
   metrics that previously lived on the classic /dashboard view: KPI strip,
   pipeline by stage, avg loan by program, company/branch breakdown. */
const CommandDashboardArtboard = ({ context = 'operator' } = {}) => {
  const LOANS = HOMIUM_DATA.LOANS;
  const STAGES = HOMIUM_DATA.STAGES;
  const isInvestor = context === 'investor';

  const [selected, setSel] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(null);
  const openLoan = (l) => { setSel(l); setDrawerOpen(true); };

  // ----- Metrics -----
  const total       = LOANS.reduce((s, l) => s + l.amount, 0);
  const active      = LOANS.filter(l => l.stageKey !== 'funded');
  const funded      = LOANS.filter(l => l.stageKey === 'funded');
  const slaAtRisk   = LOANS.filter(l => l.sla === 'red' || l.sla === 'amber').length;
  const avgAmount   = Math.round(total / Math.max(LOANS.length, 1));
  const avgDays     = Math.round(LOANS.reduce((s, l) => s + l.daysInStage, 0) / Math.max(LOANS.length, 1));
  const stageCounts = STAGES.map((s, i) => LOANS.filter(l => l.stageIdx === i).length);
  const maxStage    = Math.max(...stageCounts, 1);

  // by-program (single-program demo: DC DreamCatcher)
  const programs = (() => {
    const map = {};
    LOANS.forEach(l => {
      const k = l.program ? l.program.name : 'Unassigned';
      if (!map[k]) map[k] = { count: 0, sum: 0, name: k };
      map[k].count++;
      map[k].sum += l.amount;
    });
    return Object.values(map).map(p => ({ ...p, avg: Math.round(p.sum / p.count) }));
  })();

  // by-company / branch (demo)
  const companies = (typeof State !== 'undefined' && State.getCompanies) ? State.getCompanies() : [];
  const branches  = (typeof State !== 'undefined' && State.getBranches)  ? State.getBranches()  : [];
  const companyRows = companies.slice(0, 4).map(c => {
    const compBranches = branches.filter(b => b.companyId === c.id);
    return {
      id: c.id,
      name: c.name,
      branchCount: compBranches.length,
      userCount: c.userCount || 0,
      // Demo: distribute loans somewhat evenly for visual interest
      loans: c.id === 'co-001' ? 6 : c.id === 'co-002' ? 2 : 0,
      volume: c.id === 'co-001' ? 1130000 : c.id === 'co-002' ? 255000 : 0,
    };
  });

  // ----- DC map pin coords (shared with SpatialArtboard) -----
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
    if (l.sla === 'red')   return '#DC2626';
    if (l.sla === 'amber') return '#D97706';
    return '#0E2A47';
  };

  return (
    <div className="ab-cmd-dash">
      {/* Top KPI strip */}
      <div className="cmd-kpi-strip">
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Pipeline value</div><div className="cmd-kpi-val">{fmt$k(total)}</div><div className="cmd-kpi-sub">{LOANS.length} loans · +$140k MoM</div></div>
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Active</div><div className="cmd-kpi-val">{active.length}</div><div className="cmd-kpi-sub">{funded.length} funded · {fmt$k(funded.reduce((s,l)=>s+l.amount,0))}</div></div>
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">SLA at risk</div><div className="cmd-kpi-val danger">{slaAtRisk}</div><div className="cmd-kpi-sub">1 breach · 1 amber</div></div>
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Avg loan</div><div className="cmd-kpi-val">{fmt$k(avgAmount)}</div><div className="cmd-kpi-sub">across DC DreamCatcher</div></div>
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Avg days in stage</div><div className="cmd-kpi-val">{avgDays}</div><div className="cmd-kpi-sub">↓ 3d vs trailing 30d</div></div>
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Funded · QTD</div><div className="cmd-kpi-val">88</div><div className="cmd-kpi-sub">$19.4M · 88 households</div></div>
      </div>

      {/* Body: map (left) + inspector (right) */}
      <div className="cmd-body">
        {/* MAP */}
        <div className="cmd-map">
          <div className="cmd-map-head">
            <div>
              <div className="cmd-map-title">Command Center · <em>the District</em></div>
              <div className="cmd-map-sub">Live map of every loan in flight · {LOANS.length} pins · click to inspect</div>
            </div>
            <div className="cmd-map-legend">
              {[
                { c: '#16A34A', l: 'Funded',          n: funded.length },
                { c: '#0E2A47', l: 'On track',        n: LOANS.filter(l => l.stageKey !== 'funded' && l.sla === 'green').length },
                { c: '#D97706', l: 'Approaching SLA', n: LOANS.filter(l => l.sla === 'amber').length },
                { c: '#DC2626', l: 'SLA breach',      n: LOANS.filter(l => l.sla === 'red').length },
              ].map((k, i) => (
                <div key={i} className="cmd-leg-item">
                  <span className="cmd-leg-dot" style={{ background: k.c, boxShadow: `0 0 0 3px ${k.c}22` }}/>
                  <span>{k.l}</span><span className="cmd-leg-num">· {k.n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cmd-map-canvas">
            <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet" style={{position:'absolute', inset: 0, width: '100%', height: '100%'}}>
              <defs>
                <pattern id="cmd-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                  <line x1="0" y1="0" x2="0" y2="5" stroke="#BFD3E8" strokeWidth="1.2" opacity="0.55"/>
                </pattern>
              </defs>
              {/* Rivers + DC diamond, stripped from Spatial */}
              <path d="M 0 560 Q 120 540 260 620 Q 400 680 560 720 L 800 820 L 800 800 L 0 800 Z" fill="#CFE0EE" opacity="0.6"/>
              <path d="M 540 440 Q 620 480 680 560 Q 720 660 800 700 L 800 560 L 700 480 L 600 420 Z" fill="#CFE0EE" opacity="0.55"/>
              <path d="M 400 50 L 720 380 L 540 760 L 80 400 Z" fill="#FBFAF7" stroke="#C9C2B0" strokeWidth="1.5" strokeDasharray="4 3"/>
              <line x1="400" y1="50" x2="540" y2="760" stroke="#D9D3C3" strokeWidth="0.8"/>
              <line x1="80"  y1="400" x2="720" y2="380" stroke="#D9D3C3" strokeWidth="0.8"/>
              <circle cx="520" cy="520" r="90" fill="url(#cmd-hatch)"/>
              <circle cx="420" cy="280" r="70" fill="url(#cmd-hatch)"/>
              <circle cx="320" cy="420" r="60" fill="url(#cmd-hatch)"/>
              {[
                { x: 360, y: 180, n: 'Shepherd Park' }, { x: 340, y: 310, n: 'Columbia Hts' },
                { x: 460, y: 350, n: 'Logan Circle' }, { x: 540, y: 400, n: 'NoMa' },
                { x: 520, y: 520, n: 'Capitol Hill' }, { x: 580, y: 600, n: 'Anacostia' },
                { x: 220, y: 270, n: 'Tenleytown' },   { x: 300, y: 420, n: 'Dupont' },
              ].map((p, i) => (
                <text key={i} x={p.x} y={p.y} fontSize="10" fill="#9C9583" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing="0.04em">{p.n}</text>
              ))}
              <rect x="380" y="470" width="120" height="12" fill="#E2DCC9" rx="2"/>
              <text x="440" y="496" fontSize="8" fill="#A69E8A" textAnchor="middle" fontFamily="Inter, sans-serif">THE MALL</text>
              {PINS.map(p => {
                const loan = LOANS.find(l => l.id === p.id);
                if (!loan) return null;
                const cx = p.x * 800;
                const cy = p.y * 800;
                const color = stageColor(loan);
                const active = selected && selected.id === loan.id || hovered === p.id;
                return (
                  <g key={p.id} style={{cursor: 'pointer'}}
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
                        <text x={cx + 24} y={cy + 2}  fontSize="10"  fill="#9CA3AF" fontFamily="Inter, sans-serif">{loan.address}</text>
                        <text x={cx + 24} y={cy + 16} fontSize="10"  fill={color}   fontFamily="JetBrains Mono, monospace" fontWeight="600">{STAGES[loan.stageIdx].short} · ${(loan.amount/1000).toFixed(0)}k</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="cmd-map-panel cmd-layers">
              <div className="cmd-panel-h">Layers</div>
              <label><input type="checkbox" defaultChecked/> Active loans</label>
              <label><input type="checkbox" defaultChecked/> LMI census tracts</label>
              <label><input type="checkbox"/> CRA assessment zones</label>
              <label><input type="checkbox"/> Appreciation overlay</label>
            </div>
            <div className="cmd-map-panel cmd-fairlend">
              <div className="cmd-panel-h" style={{color:'#B0382C'}}>Fair-lending</div>
              <div className="cmd-fairlend-body">6/8 loans in LMI tracts<br/><span style={{color:'#B0382C'}}>0 in wards 7 &amp; 8</span></div>
              <div className="cmd-fairlend-foot">CRA assessment area · Q2 review</div>
            </div>
          </div>
        </div>

        {/* RIGHT INSPECTOR */}
        <div className="cmd-rail">
          <div className="cmd-rail-section">
            <div className="cmd-rail-h">Pipeline by stage</div>
            <div className="cmd-stage-bars">
              {STAGES.map((s, i) => (
                <div key={s.id} className="cmd-stage-row">
                  <span className="cmd-stage-lbl">{s.short}</span>
                  <div className="cmd-stage-track">
                    <div className="cmd-stage-fill" style={{ width: `${(stageCounts[i] / maxStage) * 100}%` }}/>
                  </div>
                  <span className="cmd-stage-num">{stageCounts[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cmd-rail-section">
            <div className="cmd-rail-h">Avg loan by program</div>
            {programs.map(p => (
              <div key={p.name} className="cmd-prog-row">
                <div>
                  <div className="cmd-prog-name">{p.name}</div>
                  <div className="cmd-prog-sub">{p.count} loans · {fmt$k(p.sum)} total</div>
                </div>
                <div className="cmd-prog-avg">{fmt$k(p.avg)}</div>
              </div>
            ))}
          </div>

          {!isInvestor && companyRows.length > 0 && (
            <div className="cmd-rail-section">
              <div className="cmd-rail-h">By origination company</div>
              {companyRows.map(c => (
                <div key={c.id} className="cmd-co-row">
                  <div>
                    <div className="cmd-co-name">{c.name}</div>
                    <div className="cmd-co-sub">{c.branchCount} branches · {c.userCount} users</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div className="cmd-co-loans">{c.loans}</div>
                    <div className="cmd-co-vol">{fmt$k(c.volume)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="cmd-rail-section">
            <div className="cmd-rail-h">Recent activity</div>
            {[
              { tag: 'fund',  msg: <><b>Hill household</b> funded · $155k</>, time: '14:32' },
              { tag: 'uw',    msg: <><b>Webb</b> cleared appraisal · DCDC#7</>, time: '14:28' },
              { tag: 'borr',  msg: <><b>Ross</b> uploaded W-2</>, time: '14:21' },
              { tag: 'alert', msg: <><b>SLA breach</b> · DCDC#5 · Hayes</>, time: '14:18' },
            ].map((r, i) => (
              <div key={i} className="cmd-act-row">
                <span className={'cmd-act-tag cmd-act-' + r.tag}>{r.tag}</span>
                <span className="cmd-act-msg">{r.msg}</span>
                <span className="cmd-act-time">{r.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Drawer loan={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)}/>
    </div>
  );
};

window.CommandDashboardArtboard = CommandDashboardArtboard;
