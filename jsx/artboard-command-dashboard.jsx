/* COMMAND DASHBOARD — Map-centered dashboard for platform operators + investors.
   Map at the center showing active loans, LMI census tracts, CRA assessment
   zones, and home-price appreciation by MSA as a color overlay. Toggleable
   program selector switches the geographic boundary + pins between
   DC Dream Fund / Utah Dream Fund / Tobias Harris Homeownership Initiative. */

const COMMAND_PROGRAMS = {
  'dc-dream-fund': {
    id: 'dc-dream-fund',
    name: 'DC Dream Fund',
    region: 'the District',
    msaName: 'Washington–Arlington–Alexandria MSA',
    coords: '38.9072°N · 77.0369°W',
    // Boundary (DC diamond)
    boundary: <path d="M 400 50 L 720 380 L 540 760 L 80 400 Z" fill="#FBFAF7" stroke="#C9C2B0" strokeWidth="1.5" strokeDasharray="4 3"/>,
    boundaryGuides: <>
      <line x1="400" y1="50" x2="540" y2="760" stroke="#D9D3C3" strokeWidth="0.8"/>
      <line x1="80" y1="400" x2="720" y2="380" stroke="#D9D3C3" strokeWidth="0.8"/>
    </>,
    rivers: <>
      <path d="M 0 560 Q 120 540 260 620 Q 400 680 560 720 L 800 820 L 800 800 L 0 800 Z" fill="#CFE0EE" opacity="0.6"/>
      <path d="M 540 440 Q 620 480 680 560 Q 720 660 800 700 L 800 560 L 700 480 L 600 420 Z" fill="#CFE0EE" opacity="0.55"/>
    </>,
    landmark: <>
      <rect x="380" y="470" width="120" height="12" fill="#E2DCC9" rx="2"/>
      <text x="440" y="496" fontSize="8" fill="#A69E8A" textAnchor="middle" fontFamily="Inter, sans-serif">THE MALL</text>
    </>,
    neighborhoods: [
      { x: 360, y: 180, n: 'Shepherd Park' }, { x: 340, y: 310, n: 'Columbia Hts' },
      { x: 460, y: 350, n: 'Logan Circle' },  { x: 540, y: 400, n: 'NoMa' },
      { x: 520, y: 520, n: 'Capitol Hill' },  { x: 580, y: 600, n: 'Anacostia' },
      { x: 220, y: 270, n: 'Tenleytown' },    { x: 300, y: 420, n: 'Dupont' },
    ],
    // LMI census tract overlays
    lmi: [
      { cx: 520, cy: 520, r: 90 },
      { cx: 420, cy: 280, r: 70 },
      { cx: 320, cy: 420, r: 60 },
    ],
    // CRA assessment zones (roughly East-of-the-River)
    cra: <path d="M 540 540 L 720 600 L 600 760 L 480 700 Z" fill="#00334A" fillOpacity="0.06" stroke="#00334A" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 4"/>,
    // MSA appreciation sub-regions — colored polygons (red = depreciation, blue = appreciation)
    appreciation: [
      { d: 'M 80 400 L 360 200 L 400 50 L 200 240 Z',  pct: 3.9, label: 'NW' },
      { d: 'M 400 50 L 720 380 L 540 320 L 380 220 Z', pct: 4.6, label: 'NE' },
      { d: 'M 200 240 L 400 220 L 380 460 L 240 460 Z', pct: 5.5, label: 'Central' },
      { d: 'M 380 220 L 540 320 L 600 480 L 380 460 Z', pct: 4.8, label: 'Capitol' },
      { d: 'M 240 460 L 380 460 L 420 720 L 320 600 Z', pct: 5.2, label: 'SW' },
      { d: 'M 380 460 L 600 480 L 540 760 L 420 720 Z', pct: 6.2, label: 'SE / East-of-River' },
    ],
    // existing 8 loans pinned to DC
    pins: [
      { id: 'DCDC000001', x: 0.22, y: 0.30 }, { id: 'DCDC000002', x: 0.44, y: 0.42 },
      { id: 'DCDC000003', x: 0.62, y: 0.48 }, { id: 'DCDC000004', x: 0.39, y: 0.18 },
      { id: 'DCDC000005', x: 0.73, y: 0.76 }, { id: 'DCDC000006', x: 0.41, y: 0.36 },
      { id: 'DCDC000007', x: 0.42, y: 0.32 }, { id: 'DCDC000008', x: 0.58, y: 0.24 },
    ],
  },
  'utah-dream-fund': {
    id: 'utah-dream-fund',
    name: 'Utah Dream Fund',
    region: 'the Wasatch Front',
    msaName: 'Salt Lake City MSA',
    coords: '40.7608°N · 111.8910°W',
    boundary: <path d="M 200 80 L 600 80 L 600 720 L 200 720 Z" fill="#FBFAF7" stroke="#C9C2B0" strokeWidth="1.5" strokeDasharray="4 3"/>,
    boundaryGuides: <line x1="200" y1="400" x2="600" y2="400" stroke="#D9D3C3" strokeWidth="0.8"/>,
    // Great Salt Lake on the west
    rivers: <path d="M 0 200 Q 100 250 180 320 L 180 480 Q 80 520 0 480 Z" fill="#CFE0EE" opacity="0.6"/>,
    landmark: <>
      <rect x="380" y="370" width="120" height="12" fill="#E2DCC9" rx="2"/>
      <text x="440" y="396" fontSize="8" fill="#A69E8A" textAnchor="middle" fontFamily="Inter, sans-serif">TEMPLE SQUARE</text>
    </>,
    neighborhoods: [
      { x: 400, y: 200, n: 'Ogden' },        { x: 400, y: 380, n: 'Salt Lake City' },
      { x: 400, y: 540, n: 'Provo' },        { x: 290, y: 320, n: 'West Valley' },
      { x: 510, y: 320, n: 'Park City' },    { x: 510, y: 580, n: 'Orem' },
    ],
    lmi: [
      { cx: 400, cy: 380, r: 80 },
      { cx: 380, cy: 540, r: 70 },
    ],
    cra: <path d="M 290 320 L 510 320 L 480 460 L 320 460 Z" fill="#00334A" fillOpacity="0.06" stroke="#00334A" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 4"/>,
    appreciation: [
      { d: 'M 200 80 L 600 80 L 600 280 L 200 280 Z', pct: 3.2, label: 'North · Ogden' },
      { d: 'M 200 280 L 600 280 L 600 460 L 200 460 Z', pct: 5.4, label: 'SLC Metro' },
      { d: 'M 200 460 L 600 460 L 600 720 L 200 720 Z', pct: 4.7, label: 'South · Utah Co' },
    ],
    pins: [],
  },
  'tobias-harris': {
    id: 'tobias-harris',
    name: 'Tobias Harris Homeownership Initiative',
    region: 'Philadelphia',
    msaName: 'Philadelphia–Camden–Wilmington MSA',
    coords: '39.9526°N · 75.1652°W',
    boundary: <path d="M 220 100 L 580 100 L 640 380 L 540 720 L 220 720 L 160 400 Z" fill="#FBFAF7" stroke="#C9C2B0" strokeWidth="1.5" strokeDasharray="4 3"/>,
    boundaryGuides: null,
    rivers: <>
      <path d="M 130 100 Q 200 300 260 500 Q 300 650 280 800 L 240 800 Q 200 600 160 400 Q 120 200 90 100 Z" fill="#CFE0EE" opacity="0.6"/>
      <path d="M 600 100 Q 660 300 720 500 L 760 500 L 740 300 L 680 100 Z" fill="#CFE0EE" opacity="0.55"/>
    </>,
    landmark: <>
      <rect x="370" y="380" width="120" height="12" fill="#E2DCC9" rx="2"/>
      <text x="430" y="406" fontSize="8" fill="#A69E8A" textAnchor="middle" fontFamily="Inter, sans-serif">CITY HALL</text>
    </>,
    neighborhoods: [
      { x: 360, y: 180, n: 'North Philly' },  { x: 460, y: 240, n: 'Fishtown' },
      { x: 380, y: 380, n: 'Center City' },   { x: 280, y: 460, n: 'West Philly' },
      { x: 460, y: 480, n: 'South Philly' },  { x: 540, y: 360, n: 'Kensington' },
    ],
    lmi: [
      { cx: 360, cy: 200, r: 75 },
      { cx: 540, cy: 360, r: 60 },
      { cx: 280, cy: 480, r: 60 },
    ],
    cra: <path d="M 280 220 L 480 220 L 480 360 L 280 360 Z" fill="#00334A" fillOpacity="0.06" stroke="#00334A" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 4"/>,
    appreciation: [
      { d: 'M 220 100 L 580 100 L 460 280 L 280 280 Z', pct: 6.8, label: 'North' },
      { d: 'M 280 280 L 460 280 L 460 460 L 280 460 Z', pct: 4.5, label: 'Center / W. Philly' },
      { d: 'M 460 280 L 640 380 L 540 540 L 460 460 Z', pct: 5.9, label: 'East / Fishtown' },
      { d: 'M 280 460 L 460 460 L 540 720 L 220 720 Z', pct: 5.1, label: 'South Philly' },
    ],
    pins: [],
  },
};

// MSA appreciation color helper — choropleth-style scale
function appColor(pct) {
  if (pct < 3.5)       return { fill: '#FDE7E3', stroke: '#F5BBB1' }; // very low
  if (pct < 4.5)       return { fill: '#FBE8C9', stroke: '#E5BC83' };
  if (pct < 5.5)       return { fill: '#DBE6F0', stroke: '#9DBAD2' };
  if (pct < 6.5)       return { fill: '#9DBAD2', stroke: '#5C89B5' };
  return                      { fill: '#5C89B5', stroke: '#00334A' };
}

const CommandDashboardArtboard = ({ context = 'operator' } = {}) => {
  const LOANS = HOMIUM_DATA.LOANS;
  const STAGES = HOMIUM_DATA.STAGES;
  const isInvestor = context === 'investor';

  const [programId, setProgramId] = React.useState('dc-dream-fund');
  const [selected, setSel] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(null);
  const [layers, setLayers] = React.useState({
    activeLoans: true,
    lmi: true,
    cra: false,
    appreciation: true,
  });
  const openLoan = (l) => { setSel(l); setDrawerOpen(true); };

  const program = COMMAND_PROGRAMS[programId];

  // Loans scoped to selected program by name match (DC Dream Fund matches the
  // 8 demo loans; Utah/Tobias come back empty for now).
  const scopedLoans = LOANS.filter(l =>
    l.program && l.program.name.toLowerCase() === program.name.toLowerCase()
  );

  // ----- Metrics (scoped to selected program) -----
  const total       = scopedLoans.reduce((s, l) => s + l.amount, 0);
  const active      = scopedLoans.filter(l => l.stageKey !== 'funded');
  const funded      = scopedLoans.filter(l => l.stageKey === 'funded');
  const slaAtRisk   = scopedLoans.filter(l => l.sla === 'red' || l.sla === 'amber').length;
  const avgAmount   = scopedLoans.length ? Math.round(total / scopedLoans.length) : 0;
  const avgDays     = scopedLoans.length ? Math.round(scopedLoans.reduce((s,l)=>s+l.daysInStage,0)/scopedLoans.length) : 0;
  const stageCounts = STAGES.map((s, i) => scopedLoans.filter(l => l.stageIdx === i).length);
  const maxStage    = Math.max(...stageCounts, 1);

  // by-program rows (always show all 3 for context)
  const programRows = Object.values(COMMAND_PROGRAMS).map(p => {
    const pl = LOANS.filter(l => l.program && l.program.name.toLowerCase() === p.name.toLowerCase());
    const sum = pl.reduce((s, l) => s + l.amount, 0);
    return { name: p.name, count: pl.length, sum, avg: pl.length ? Math.round(sum/pl.length) : 0 };
  });

  // by-company / branch (host app data)
  const companies = (typeof State !== 'undefined' && State.getCompanies) ? State.getCompanies() : [];
  const branches  = (typeof State !== 'undefined' && State.getBranches)  ? State.getBranches()  : [];
  const companyRows = companies.slice(0, 4).map(c => {
    const compBranches = branches.filter(b => b.companyId === c.id);
    return {
      id: c.id, name: c.name,
      branchCount: compBranches.length,
      userCount: c.userCount || 0,
      loans: c.id === 'co-001' ? 6 : c.id === 'co-002' ? 2 : 0,
      volume: c.id === 'co-001' ? 1130000 : c.id === 'co-002' ? 255000 : 0,
    };
  });

  const stageColor = (l) => {
    if (l.stageKey === 'funded') return '#16A34A';
    if (l.sla === 'red')   return '#DC2626';
    if (l.sla === 'amber') return '#D97706';
    return '#00334A';
  };
  const toggleLayer = (k) => setLayers(prev => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="ab-cmd-dash">
      {/* Top KPI strip */}
      <div className="cmd-kpi-strip">
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Pipeline value</div><div className="cmd-kpi-val">{fmt$k(total)}</div><div className="cmd-kpi-sub">{scopedLoans.length} loans · {scopedLoans.length ? '+$140k MoM' : 'no active loans'}</div></div>
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Active</div><div className="cmd-kpi-val">{active.length}</div><div className="cmd-kpi-sub">{funded.length} funded · {fmt$k(funded.reduce((s,l)=>s+l.amount,0))}</div></div>
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Stage aging</div><div className="cmd-kpi-val danger">{slaAtRisk}</div><div className="cmd-kpi-sub">{slaAtRisk ? `${scopedLoans.filter(l=>l.sla==='red').length} stalled · ${scopedLoans.filter(l=>l.sla==='amber').length} aging` : 'all on track'}</div></div>
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Avg loan</div><div className="cmd-kpi-val">{fmt$k(avgAmount)}</div><div className="cmd-kpi-sub">in {program.name}</div></div>
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Avg days in stage</div><div className="cmd-kpi-val">{avgDays}</div><div className="cmd-kpi-sub">↓ 3d vs trailing 30d</div></div>
        <div className="cmd-kpi"><div className="cmd-kpi-lbl">Funded · QTD</div><div className="cmd-kpi-val">{program.id === 'dc-dream-fund' ? '88' : '—'}</div><div className="cmd-kpi-sub">{program.id === 'dc-dream-fund' ? '$19.4M · 88 households' : 'pre-launch'}</div></div>
      </div>

      {/* Body: map (left) + inspector (right) */}
      <div className="cmd-body">
        {/* MAP */}
        <div className="cmd-map">
          <div className="cmd-map-head">
            <div>
              <div className="cmd-map-title">
                Command Center · <em>{program.region}</em>
                <select
                  className="cmd-program-select"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  aria-label="Switch program"
                >
                  {Object.values(COMMAND_PROGRAMS).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="cmd-map-sub">
                {program.msaName} · {scopedLoans.length} active loans · {program.coords}
              </div>
            </div>
            <div className="cmd-map-legend">
              {[
                { c: '#16A34A', l: 'Funded',       n: funded.length },
                { c: '#00334A', l: 'On track',     n: scopedLoans.filter(l => l.stageKey !== 'funded' && l.sla === 'green').length },
                { c: '#D97706', l: 'Stage aging',  n: scopedLoans.filter(l => l.sla === 'amber').length },
                { c: '#DC2626', l: 'Stalled',      n: scopedLoans.filter(l => l.sla === 'red').length },
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

              {/* MSA appreciation overlay (lowest z) */}
              {layers.appreciation && program.appreciation.map((a, i) => {
                const c = appColor(a.pct);
                return (
                  <g key={i}>
                    <path d={a.d} fill={c.fill} stroke={c.stroke} strokeWidth="0.8" opacity="0.85"/>
                  </g>
                );
              })}

              {program.rivers}
              {program.boundary}
              {program.boundaryGuides}

              {/* LMI tracts overlay */}
              {layers.lmi && program.lmi.map((t, i) => (
                <circle key={i} cx={t.cx} cy={t.cy} r={t.r} fill="url(#cmd-hatch)"/>
              ))}

              {/* CRA assessment zone */}
              {layers.cra && program.cra}

              {program.neighborhoods.map((p, i) => (
                <text key={i} x={p.x} y={p.y} fontSize="10" fill="#5C5852" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing="0.04em" fontWeight="500">{p.n}</text>
              ))}

              {program.landmark}

              {/* Appreciation labels (only when overlay is on) */}
              {layers.appreciation && program.appreciation.map((a, i) => {
                // Quick centroid approx — use first move command
                const m = a.d.match(/M ([0-9.]+) ([0-9.]+)/);
                const x = m ? parseFloat(m[1]) + 30 : 100;
                const y = m ? parseFloat(m[2]) + 40 : 100;
                return (
                  <text key={'a-' + i} x={x} y={y} fontSize="9" fill="#00334A" fontFamily="JetBrains Mono, monospace" fontWeight="600" opacity="0.7">
                    +{a.pct.toFixed(1)}%
                  </text>
                );
              })}

              {/* Active-loan pins */}
              {layers.activeLoans && program.pins.map(p => {
                const loan = LOANS.find(l => l.id === p.id);
                if (!loan) return null;
                const cx = p.x * 800;
                const cy = p.y * 800;
                const color = stageColor(loan);
                const active = (selected && selected.id === loan.id) || hovered === p.id;
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

              {/* Empty-state for pre-launch programs */}
              {!program.pins.length && (
                <g>
                  <rect x="280" y="350" width="240" height="100" rx="10" fill="#fff" stroke="#E5E1D2" strokeWidth="1.2"/>
                  <text x="400" y="385" fontSize="13" fill="#1A1F18" fontFamily="IvyPresto Display, serif" textAnchor="middle">Pre-launch</text>
                  <text x="400" y="405" fontSize="11" fill="#6B6557" fontFamily="Inter, sans-serif" textAnchor="middle">No active loans yet — first cohort opens Q3 '26.</text>
                  <text x="400" y="430" fontSize="10" fill="#9C9583" fontFamily="JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.06em">{program.msaName.toUpperCase()}</text>
                </g>
              )}
            </svg>

            <div className="cmd-map-panel cmd-layers">
              <div className="cmd-panel-h">Layers</div>
              <label><input type="checkbox" checked={layers.activeLoans}  onChange={() => toggleLayer('activeLoans')}/> Active loans</label>
              <label><input type="checkbox" checked={layers.lmi}          onChange={() => toggleLayer('lmi')}/> LMI census tracts</label>
              <label><input type="checkbox" checked={layers.cra}          onChange={() => toggleLayer('cra')}/> CRA assessment zones</label>
              <label><input type="checkbox" checked={layers.appreciation} onChange={() => toggleLayer('appreciation')}/> MSA appreciation (MoM)</label>
            </div>

            {layers.appreciation && (
              <div className="cmd-map-panel cmd-app-legend">
                <div className="cmd-panel-h">Appreciation · MoM</div>
                <div className="cmd-app-scale">
                  {[
                    { c: '#FDE7E3', l: '<3.5%' },
                    { c: '#FBE8C9', l: '3.5–4.5' },
                    { c: '#DBE6F0', l: '4.5–5.5' },
                    { c: '#9DBAD2', l: '5.5–6.5' },
                    { c: '#5C89B5', l: '>6.5%' },
                  ].map(s => (
                    <div key={s.l} className="cmd-app-step">
                      <span className="cmd-app-swatch" style={{background: s.c}}/>
                      <span>{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="cmd-map-panel cmd-fairlend">
              <div className="cmd-panel-h" style={{color:'#B0382C'}}>Fair-lending</div>
              <div className="cmd-fairlend-body">
                {scopedLoans.length
                  ? <>{Math.round(scopedLoans.length * 0.75)}/{scopedLoans.length} in LMI tracts<br/><span style={{color:'#B0382C'}}>0 in priority gaps</span></>
                  : <span style={{color:'#6B6557'}}>No active originations to assess.</span>}
              </div>
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
            {programRows.map(p => (
              <div key={p.name} className={'cmd-prog-row' + (p.name.toLowerCase() === program.name.toLowerCase() ? ' active' : '')}>
                <div>
                  <div className="cmd-prog-name">{p.name}</div>
                  <div className="cmd-prog-sub">{p.count ? `${p.count} loans · ${fmt$k(p.sum)} total` : 'pre-launch'}</div>
                </div>
                <div className="cmd-prog-avg">{p.avg ? fmt$k(p.avg) : '—'}</div>
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
              { tag: 'fund',  msg: <><b>Hill household</b> funded · $155k</>, time: '14:32', loanId: 'DCDC000003' },
              { tag: 'uw',    msg: <><b>Webb</b> cleared appraisal · DCDC#7</>, time: '14:28', loanId: 'DCDC000007' },
              { tag: 'borr',  msg: <><b>Ross</b> uploaded W-2</>, time: '14:21', loanId: 'DCDC000001' },
              { tag: 'alert', msg: <><b>Stage stalled</b> · DCDC#5 · Hayes</>, time: '14:18', loanId: 'DCDC000005' },
            ].map((r, i) => {
              const loan = LOANS.find(l => l.id === r.loanId);
              return (
                <div key={i} className="cmd-act-row" onClick={() => loan && openLoan(loan)} style={{cursor: loan ? 'pointer' : 'default'}}>
                  <span className={'cmd-act-tag cmd-act-' + r.tag}>{r.tag}</span>
                  <span className="cmd-act-msg">{r.msg}</span>
                  <span className="cmd-act-time">{r.time}</span>
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

window.CommandDashboardArtboard = CommandDashboardArtboard;
