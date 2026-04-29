/* ARTBOARD 7 — MISSION CONTROL — single-screen ops cockpit (platform operators / system admin) */
const MissionArtboard = () => {
  const [tab, setTab] = React.useState('ops'); // 'ops' | 'command'
  const [selected, setSel] = React.useState(HOMIUM_DATA.LOANS[4]); // Hayes (red SLA) as focus
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(null);
  const [now, setNow] = React.useState(new Date());
  const LOANS = HOMIUM_DATA.LOANS;
  const STAGES = HOMIUM_DATA.STAGES;

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const ticker = [
    { lbl: '10Y TSY', val: '4.32%', d: '+0.04', up: true },
    { lbl: '30Y FIX', val: '6.78%', d: '+0.02', up: true },
    { lbl: 'MBS UM30', val: '99.87', d: '-0.06', up: false },
    { lbl: 'AMI DC', val: '$142.3k', d: 'Q2 2026' },
    { lbl: 'PIPELINE', val: '$1.23M', d: '+$140k', up: true },
    { lbl: 'FUNDED Q2', val: '88', d: '+12 wk', up: true },
    { lbl: 'MED CLOSE', val: '34d', d: '-3d', up: true },
    { lbl: 'SLA BREACH', val: '1', d: 'Hayes', dn: true },
    { lbl: 'IN UW', val: '4', d: 'q:7' },
    { lbl: 'RATE LOCK', val: '12 active', d: '3 expire 7d' },
  ];

  const focus = selected || LOANS[4];
  const stipDone = focus.stips.filter(s => s.status === 'received').length;
  const stipPending = focus.stips.filter(s => s.status === 'pending').length;
  const stipBlocked = focus.stips.filter(s => s.status === 'blocked').length;

  // Throughput data — 12 weeks
  const throughputWeeks = [4,3,6,5,8,7,9,6,10,11,9,13];
  const maxTP = Math.max(...throughputWeeks);

  return (
    <div className="ab-mission">
      {/* TICKER */}
      <div className="mc-ticker">
        <div className="mc-ticker-track">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="mc-tick">
              <span>{t.lbl}</span>
              <b>{t.val}</b>
              <span className={t.up ? 'up' : t.dn ? 'dn' : ''}>{t.d}</span>
              <span style={{color:'#1F2530'}}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* TOP BAR */}
      <div className="mc-top">
        <div className="mc-top-brand">
          <div className="mc-top-brand-mark">h</div>
          <div>
            <div className="mc-top-brand-name">homium · ops</div>
            <div className="mc-top-brand-sub">mission control · v2.4</div>
          </div>
        </div>
        <div className="mc-top-status">
          <span className="mc-status-pill ok">
            <span className="mc-status-dot"/> systems nominal
          </span>
          <span className="mc-status-pill warn">
            <span className="mc-status-dot"/> 1 SLA at risk
          </span>
          <span className="mc-status-pill crit">
            <span className="mc-status-dot"/> 1 breach · #5
          </span>
          <span className="mc-status-pill ok">
            <span className="mc-status-dot"/> docu-sign · ok
          </span>
          <span className="mc-status-pill ok">
            <span className="mc-status-dot"/> wire desk · ok
          </span>
        </div>
        <div className="mc-tabs">
          <button className={`mc-tab ${tab==='ops'?'active':''}`} onClick={() => setTab('ops')}>// OPS</button>
          <button className={`mc-tab ${tab==='command'?'active':''}`} onClick={() => setTab('command')}>// COMMAND</button>
          <button className="mc-tab" disabled style={{opacity:0.4}}>// ADMIN</button>
        </div>
        <div style={{textAlign:'right'}}>
          <div className="mc-clock">{time}</div>
          <div className="mc-clock-zone">EST · {now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</div>
        </div>
      </div>

      {/* MAIN GRID */}
      {tab === 'ops' && (
      <div className="mc-grid">
        {/* LEFT: pipeline list */}
        <div className="mc-pane" style={{gridColumn:1, gridRow:'1 / 3'}}>
          <div className="mc-pane-head">
            <div className="mc-pane-title"><b>PIPELINE</b> · 8</div>
            <div className="mc-pane-meta">live</div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:2, overflowY:'auto', flex:1}}>
            {LOANS.map(l => (
              <div key={l.id}
                   className={`mc-pl-row ${selected?.id === l.id ? 'active' : ''}`}
                   onClick={() => setSel(l)}>
                <span className={`mc-pl-sla ${l.sla}`}/>
                <div style={{minWidth:0, flex:1}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                    <span className="mc-pl-name">{l.borrowerFirst} {l.borrower.split(' ').slice(-1)[0]}</span>
                    <span className="mc-pl-amt">{fmt$k(l.amount)}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:1}}>
                    <span className="mc-pl-id">{l.id.replace('DCDC000','#')} · {STAGES[l.stageIdx].short}</span>
                    <span className="mc-pl-id" style={{color: l.sla==='red'?'#F87171':l.sla==='amber'?'#FBBF24':'#4A5568'}}>{l.daysInStage}d</span>
                  </div>
                  <div className="mc-pl-stage">
                    {l.progress.map((s, i) => (
                      <div key={i} className={`mc-pl-stage-seg ${s === 'done' ? 'done' : s === 'current' ? 'cur' : s === 'blocked' ? 'bad' : ''}`}/>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{paddingTop:10, borderTop:'1px solid #1F2530', marginTop:10, fontFamily:'var(--font-mono)', fontSize:10, color:'#4A5568', display:'flex', justifyContent:'space-between'}}>
            <span>↑↓ select</span><span>⏎ open</span>
          </div>
        </div>

        {/* CENTER-TOP: focus loan */}
        <div className="mc-pane mc-focus">
          <div className="mc-pane-head">
            <div className="mc-pane-title">FOCUS <b>·</b> {focus.id}</div>
            <div style={{display:'flex', gap:6}}>
              <button onClick={() => setDrawerOpen(true)} style={{padding:'4px 10px', fontFamily:'var(--font-mono)', fontSize:10, color:'#5BA0E5', border:'1px solid #102A47', borderRadius:3, background:'#0A1A2E', textTransform:'uppercase', letterSpacing:'0.08em'}}>open dossier</button>
              <button style={{padding:'4px 10px', fontFamily:'var(--font-mono)', fontSize:10, color:'#FBBF24', border:'1px solid #4D3A0E', borderRadius:3, background:'#1B1407', textTransform:'uppercase', letterSpacing:'0.08em'}}>intervene</button>
            </div>
          </div>
          <div className="mc-focus-grid">
            <div style={{minWidth:0}}>
              <div className="mc-focus-id">{focus.id} · {focus.program.name}</div>
              <div className="mc-focus-name">{focus.borrower}</div>
              <div className="mc-focus-addr">{focus.address}, {focus.cityState}</div>

              <div className="mc-focus-stats">
                <div className="mc-focus-stat">
                  <div className="lbl">Amount</div>
                  <div className="val">{fmt$k(focus.amount)}</div>
                  <div className="delta">LTV 0.85</div>
                </div>
                <div className="mc-focus-stat">
                  <div className="lbl">D / stage</div>
                  <div className={`val ${focus.sla==='red'?'crit':focus.sla==='amber'?'warn':''}`}>{focus.daysInStage}</div>
                  <div className="delta">SLA: {focus.sla.toUpperCase()}</div>
                </div>
                <div className="mc-focus-stat">
                  <div className="lbl">Stips</div>
                  <div className="val">{stipDone}/{focus.stips.length}</div>
                  <div className="delta">{stipBlocked > 0 ? `${stipBlocked} blocked` : `${stipPending} pending`}</div>
                </div>
                <div className="mc-focus-stat">
                  <div className="lbl">DTI</div>
                  <div className="val">38<span style={{fontSize:14,color:'#6F7A8A'}}>%</span></div>
                  <div className="delta">cap 43%</div>
                </div>
              </div>

              {/* timeline */}
              <div className="mc-timeline">
                <div className="mc-tl-row">
                  {STAGES.map((s, i) => (
                    <React.Fragment key={i}>
                      <div className="mc-tl-node">
                        <div className={`mc-tl-dot ${focus.progress[i] === 'done' ? 'done' : focus.progress[i] === 'current' ? 'cur' : focus.progress[i] === 'blocked' ? 'bad' : ''}`}/>
                        <div className={`mc-tl-lbl ${focus.progress[i] === 'current' ? 'cur' : focus.progress[i] === 'blocked' ? 'bad' : ''}`}>{s.short}</div>
                      </div>
                      {i < STAGES.length - 1 && <div className={`mc-tl-conn ${focus.progress[i] === 'done' ? 'done' : ''}`}/>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* right column */}
            <div style={{borderLeft:'1px solid #1F2530', paddingLeft:18, overflow:'auto', minHeight:0}}>
              <div className="mc-fr-section">
                <div className="mc-fr-section-h">// stipulations · {stipDone}/{focus.stips.length}</div>
                {focus.stips.slice(0,5).map(s => (
                  <div key={s.id} className="mc-fr-stip-row">
                    <div className={`mc-fr-stip-icon ${s.status === 'received' ? 'done' : s.status === 'blocked' ? 'blocked' : 'pending'}`}>
                      {s.status === 'received' ? '✓' : s.status === 'blocked' ? '!' : '·'}
                    </div>
                    <div className={`mc-fr-stip-lbl ${s.status==='received'?'done':''}`} style={{fontSize:10.5}}>{s.label}</div>
                    <span style={{fontFamily:'var(--font-mono)', fontSize:9, color:'#4A5568', textTransform:'uppercase'}}>{s.owner}</span>
                  </div>
                ))}
              </div>

              <div className="mc-fr-section">
                <div className="mc-fr-section-h">// next-action · ai-prioritized</div>
                <div style={{padding:'10px 12px', background:'#0A1A2E', border:'1px solid #102A47', borderRadius:3, fontSize:11, color:'#BFD3E8', lineHeight:1.5}}>
                  <span style={{color:'#5BA0E5', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.08em'}}>RECOMMEND →</span><br/>
                  {focus.aiNudge || focus.nextAction || 'No action; loan progressing nominally.'}
                </div>
              </div>

              <div className="mc-fr-section">
                <div className="mc-fr-section-h">// channel · last contact</div>
                <div style={{fontFamily:'var(--font-mono)', fontSize:10, color:'#98A1B0', lineHeight:1.6}}>
                  <div>sms · 11d ago · delivered</div>
                  <div>email · 11d ago · opened</div>
                  <div>call · 14d ago · voicemail</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT-TOP: live feed */}
        <div className="mc-pane mc-feed">
          <div className="mc-pane-head">
            <div className="mc-pane-title"><b>LIVE FEED</b></div>
            <div className="mc-pane-meta" style={{display:'flex', gap:6, alignItems:'center'}}>
              <span style={{width:6, height:6, borderRadius:'50%', background:'#5BA0E5', boxShadow:'0 0 6px #5BA0E5'}}/>
              streaming
            </div>
          </div>
          <div style={{flex:1, overflow:'auto', display:'flex', flexDirection:'column'}}>
            {[
              { t: '14:32:08', tag: 'fund', cls: 'fund', m: <><b>$155,000</b> wired · DCDC#3 · Hill household</>},
              { t: '14:28:51', tag: 'uw',   cls: 'uw',   m: <>Webb cleared appraisal · DCDC#7</>},
              { t: '14:21:03', tag: 'borr', cls: 'borr', m: <>Ross uploaded W-2 (auto-confirmed)</>},
              { t: '14:18:42', tag: 'alert', cls: 'alert', m: <><b>SLA breach</b> · DCDC#5 · Hayes · 11d</>},
              { t: '14:12:30', tag: 'sys',  cls: 'sys',  m: <>OCR pipeline · 1.4s avg · 99.7% conf</>},
              { t: '14:08:17', tag: 'uw',   cls: 'uw',   m: <>Shah issued COA · DCDC#2 · $220k</>},
              { t: '14:02:55', tag: 'borr', cls: 'borr', m: <>Patel signed disclosures · DCDC#8</>},
              { t: '13:58:22', tag: 'sys',  cls: 'sys',  m: <>title API healthy · 247ms p99</>},
              { t: '13:54:11', tag: 'fund', cls: 'fund', m: <>Wire batch #4112 settled</>},
              { t: '13:47:09', tag: 'uw',   cls: 'uw',   m: <>Webb opened DCDC#7 · 18m</>},
              { t: '13:42:31', tag: 'borr', cls: 'borr', m: <>Hayes voicemail · "callback Mon"</>},
              { t: '13:38:02', tag: 'sys',  cls: 'sys',  m: <>auto-nudge sent · 3 borrowers</>},
              { t: '13:32:14', tag: 'uw',   cls: 'uw',   m: <>Shah opened queue · 7 items</>},
              { t: '13:25:40', tag: 'borr', cls: 'borr', m: <>Kim viewed disclosures · DCDC#4</>},
            ].map((row, i) => (
              <div key={i} className="mc-feed-row">
                <span className="mc-feed-time">{row.t}</span>
                <span className={`mc-feed-tag ${row.cls}`}>{row.tag}</span>
                <span className="mc-feed-msg">{row.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER-BOTTOM: anomalies */}
        <div className="mc-pane mc-anom">
          <div className="mc-pane-head">
            <div className="mc-pane-title"><b>ANOMALIES</b> · last 24h · ai-flagged</div>
            <div className="mc-pane-meta">3 unresolved</div>
          </div>
          <div style={{flex:1, overflow:'auto'}}>
            <div className="mc-anom-row">
              <div className="mc-anom-sev crit">P1</div>
              <div className="mc-anom-msg">
                <b>SLA breach · DCDC#5</b> — Hayes loan 11 days in App stage. Borrower last contacted 14d ago. Voicemail unanswered. <span style={{color:'#F87171'}}>Suggested: personal phone call within next 4h.</span>
              </div>
              <div className="mc-anom-time">2h ago</div>
            </div>
            <div className="mc-anom-row">
              <div className="mc-anom-sev warn">P2</div>
              <div className="mc-anom-msg">
                <b>Rate lock expires</b> — DCDC#2 lock expires Friday 18:00. Borrower hasn't acknowledged updated terms. Program eligibility tied to current lock.
              </div>
              <div className="mc-anom-time">4h ago</div>
            </div>
            <div className="mc-anom-row">
              <div className="mc-anom-sev warn">P2</div>
              <div className="mc-anom-msg">
                <b>OCR confidence drop</b> — paystub on DCDC#6 returned 84% confidence (typical 99%+). Manual review queued; processor notified.
              </div>
              <div className="mc-anom-time">6h ago</div>
            </div>
            <div className="mc-anom-row">
              <div className="mc-anom-sev info">i</div>
              <div className="mc-anom-msg">
                <b>Coverage gap detected</b> — 0 active loans in Wards 7 & 8. Pattern flagged for compliance review (CRA assessment area, Q2).
              </div>
              <div className="mc-anom-time">12h ago</div>
            </div>
            <div className="mc-anom-row">
              <div className="mc-anom-sev info">i</div>
              <div className="mc-anom-msg">
                <b>Throughput up 44%</b> — funded loans for week of 4/21 outpacing 12-week trailing avg. Capacity headroom remains at underwriting tier.
              </div>
              <div className="mc-anom-time">18h ago</div>
            </div>
          </div>
        </div>

        {/* RIGHT-BOTTOM: throughput chart */}
        <div className="mc-pane mc-chart">
          <div className="mc-pane-head">
            <div className="mc-pane-title"><b>THROUGHPUT</b> · 12-wk · stage transitions</div>
            <div className="mc-pane-meta">7d / 30d / <b style={{color:'#5BA0E5'}}>12w</b> / 1y</div>
          </div>
          <div className="mc-chart-grid">
            <svg className="mc-chart-svg" viewBox="0 0 600 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fundedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5BA0E5" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#5BA0E5" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* gridlines */}
              {[0,1,2,3,4].map(i => (
                <line key={i} x1="40" y1={20 + i*40} x2="590" y2={20 + i*40} stroke="#131820" strokeDasharray="2 4"/>
              ))}
              {[0,3,6,9,12].map(i => (
                <text key={i} x={40 + (i/12)*550} y="210" fill="#4A5568" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="middle">w-{12-i}</text>
              ))}
              {[0,5,10,15,20].map((v, i) => (
                <text key={i} x="32" y={185 - i*40 + 3} fill="#4A5568" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="end">{v}</text>
              ))}
              {/* funded bars */}
              {throughputWeeks.map((v, i) => {
                const x = 50 + i * (540/12);
                const h = (v / maxTP) * 160;
                return (
                  <rect key={i} x={x} y={180 - h} width={28} height={h}
                        fill={i === throughputWeeks.length - 1 ? '#5BA0E5' : '#1E3F62'}
                        opacity={i === throughputWeeks.length - 1 ? 1 : 0.7}/>
                );
              })}
              {/* trend line */}
              <path d={throughputWeeks.map((v, i) => {
                const x = 50 + i * (540/12) + 14;
                const y = 180 - (v / maxTP) * 160;
                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
              }).join(' ')}
                fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="3 3"/>
              {throughputWeeks.map((v, i) => {
                const x = 50 + i * (540/12) + 14;
                const y = 180 - (v / maxTP) * 160;
                return <circle key={i} cx={x} cy={y} r="2" fill="#FBBF24"/>;
              })}
              {/* current marker */}
              <text x="580" y="50" fill="#5BA0E5" fontSize="22" fontFamily="JetBrains Mono, monospace" textAnchor="end" fontWeight="500">13</text>
              <text x="580" y="64" fill="#5BA0E5" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="end" letterSpacing="0.1em">THIS WEEK</text>
            </svg>

            <div className="mc-chart-legend">
              <div className="mc-leg-row">
                <span className="mc-leg-bar" style={{background:'#5BA0E5'}}/>
                <span style={{fontSize:11, color:'#D7DEE8'}}>Funded · this wk</span>
                <span className="mc-leg-num">13</span>
              </div>
              <div className="mc-leg-row">
                <span className="mc-leg-bar" style={{background:'#1E3F62', opacity:0.7}}/>
                <span style={{fontSize:11, color:'#98A1B0'}}>Funded · prior</span>
                <span className="mc-leg-num">91</span>
              </div>
              <div className="mc-leg-row">
                <span className="mc-leg-bar" style={{background:'transparent', borderBottom:'1.5px dashed #FBBF24', height:0, marginBottom:8}}/>
                <span style={{fontSize:11, color:'#98A1B0'}}>Trend (12w avg)</span>
                <span className="mc-leg-num">7.3</span>
              </div>

              <div style={{height:1, background:'#1F2530', margin:'8px 0'}}/>

              <div style={{fontFamily:'var(--font-mono)', fontSize:9, color:'#4A5568', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6}}>// derived</div>
              <div className="mc-leg-row">
                <span style={{fontSize:11, color:'#98A1B0'}}>Median close (d)</span>
                <span className="mc-leg-num">34</span>
              </div>
              <div className="mc-leg-row">
                <span style={{fontSize:11, color:'#98A1B0'}}>Pull-through</span>
                <span className="mc-leg-num">81%</span>
              </div>
              <div className="mc-leg-row">
                <span style={{fontSize:11, color:'#98A1B0'}}>Auto-approval</span>
                <span className="mc-leg-num">62%</span>
              </div>
              <div className="mc-leg-row">
                <span style={{fontSize:11, color:'#98A1B0'}}>UW capacity</span>
                <span className="mc-leg-num" style={{color:'#FBBF24'}}>74%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      )}

      {tab === 'command' && (
        <div className="mc-cmd-wrap">
          <div className="mc-cmd-head">
            <div>
              <div className="mc-cmd-title">// COMMAND CENTER · the District</div>
              <div className="mc-cmd-sub">live map · 8 pins · 6 LMI · ward-7/8 coverage gap flagged</div>
            </div>
            <div className="mc-cmd-legend">
              {[
                { c:'#22C55E', l:'funded',     n:1 },
                { c:'#5BA0E5', l:'on-track',   n:5 },
                { c:'#FBBF24', l:'sla-risk',   n:1 },
                { c:'#F87171', l:'breach',     n:1 },
              ].map((k,i) => (
                <span key={i} className="mc-cmd-leg-item">
                  <span style={{width:8, height:8, borderRadius:'50%', background:k.c, boxShadow:`0 0 0 3px ${k.c}33`}}/>
                  <span>{k.l}</span>
                  <span style={{color:'#4A5568'}}>· {k.n}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mc-cmd-body">
            {/* MAP */}
            <div className="mc-cmd-map">
              <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
                <defs>
                  <pattern id="mc-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="#1E3F62" strokeWidth="1" opacity="0.6"/>
                  </pattern>
                  <pattern id="mc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0F1620" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect x="0" y="0" width="800" height="800" fill="url(#mc-grid)"/>
                {/* Rivers */}
                <path d="M 0 560 Q 120 540 260 620 Q 400 680 560 720 L 800 820 L 800 800 L 0 800 Z" fill="#0A2038" opacity="0.7"/>
                <path d="M 540 440 Q 620 480 680 560 Q 720 660 800 700 L 800 560 L 700 480 L 600 420 Z" fill="#0A2038" opacity="0.65"/>
                {/* DC diamond */}
                <path d="M 400 50 L 720 380 L 540 760 L 80 400 Z" fill="none" stroke="#1F2530" strokeWidth="1.2" strokeDasharray="4 4"/>
                <line x1="400" y1="50" x2="540" y2="760" stroke="#1F2530" strokeWidth="0.6"/>
                <line x1="80" y1="400" x2="720" y2="380" stroke="#1F2530" strokeWidth="0.6"/>
                {/* LMI heat */}
                <circle cx="520" cy="520" r="90" fill="url(#mc-hatch)"/>
                <circle cx="420" cy="280" r="70" fill="url(#mc-hatch)"/>
                <circle cx="320" cy="420" r="60" fill="url(#mc-hatch)"/>
                {/* Coverage gap */}
                <circle cx="640" cy="600" r="60" fill="#1B0A0A" stroke="#4D1A1A" strokeWidth="1" strokeDasharray="3 3"/>
                <text x="640" y="600" fontSize="9" fill="#F87171" fontFamily="JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.08em">WARD 7/8</text>
                <text x="640" y="612" fontSize="8" fill="#F87171" fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity="0.7">// 0 active</text>
                {/* labels */}
                {[
                  { x:360, y:180, n:'shepherd-park' },{ x:340, y:310, n:'columbia-hts' },
                  { x:460, y:350, n:'logan' },{ x:540, y:400, n:'noma' },
                  { x:520, y:520, n:'cap-hill' },{ x:580, y:600, n:'anacostia' },
                  { x:220, y:270, n:'tenleytown' },{ x:300, y:420, n:'dupont' },
                ].map((p,i) => (
                  <text key={i} x={p.x} y={p.y} fontSize="9" fill="#3F4856" fontFamily="JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.04em">{p.n}</text>
                ))}
                <rect x="380" y="470" width="120" height="10" fill="#1F2530" rx="1"/>
                <text x="440" y="494" fontSize="7" fill="#4A5568" textAnchor="middle" fontFamily="JetBrains Mono, monospace" letterSpacing="0.1em">THE MALL</text>
                {/* pins */}
                {[
                  { id: 'DCDC000001', x: 0.22, y: 0.30 },
                  { id: 'DCDC000002', x: 0.44, y: 0.42 },
                  { id: 'DCDC000003', x: 0.62, y: 0.48 },
                  { id: 'DCDC000004', x: 0.39, y: 0.18 },
                  { id: 'DCDC000005', x: 0.73, y: 0.76 },
                  { id: 'DCDC000006', x: 0.41, y: 0.36 },
                  { id: 'DCDC000007', x: 0.42, y: 0.32 },
                  { id: 'DCDC000008', x: 0.58, y: 0.24 },
                ].map(p => {
                  const loan = LOANS.find(l => l.id === p.id);
                  if (!loan) return null;
                  const cx = p.x * 800;
                  const cy = p.y * 800;
                  const color = loan.stageKey === 'funded' ? '#22C55E' : loan.sla === 'red' ? '#F87171' : loan.sla === 'amber' ? '#FBBF24' : '#5BA0E5';
                  const active = selected?.id === loan.id || hovered === p.id;
                  return (
                    <g key={p.id} style={{cursor:'pointer'}}
                       onMouseEnter={() => setHovered(p.id)}
                       onMouseLeave={() => setHovered(null)}
                       onClick={() => setSel(loan)}>
                      {loan.sla === 'red' && (
                        <circle cx={cx} cy={cy} r="22" fill={color} opacity="0.25">
                          <animate attributeName="r" values="14;30;14" dur="2.4s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite"/>
                        </circle>
                      )}
                      <circle cx={cx} cy={cy} r={active ? 13 : 10} fill="#0A0E14" stroke={color} strokeWidth="2.5"/>
                      <circle cx={cx} cy={cy} r={active ? 6 : 4} fill={color}/>
                      {active && (
                        <g>
                          <rect x={cx + 14} y={cy - 32} width="180" height="60" rx="2" fill="#0F1620" stroke="#1F2530" strokeWidth="1"/>
                          <text x={cx + 22} y={cy - 18} fontSize="9" fill="#4A5568" fontFamily="JetBrains Mono, monospace" letterSpacing="0.1em">// {loan.id.replace('DCDC000','#')}</text>
                          <text x={cx + 22} y={cy - 4} fontSize="11" fill="#E1E6EE" fontFamily="JetBrains Mono, monospace" fontWeight="600">{loan.borrower}</text>
                          <text x={cx + 22} y={cy + 10} fontSize="9" fill="#98A1B0" fontFamily="JetBrains Mono, monospace">{loan.address}</text>
                          <text x={cx + 22} y={cy + 22} fontSize="9" fill={color} fontFamily="JetBrains Mono, monospace" fontWeight="600">{STAGES[loan.stageIdx].short.toUpperCase()} · ${(loan.amount/1000).toFixed(0)}K · {loan.daysInStage}d</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* layers panel */}
              <div className="mc-cmd-panel" style={{top:14, left:14}}>
                <div className="mc-cmd-panel-h">// LAYERS</div>
                <label><input type="checkbox" defaultChecked/> active-loans</label>
                <label><input type="checkbox" defaultChecked/> lmi-tracts</label>
                <label><input type="checkbox" defaultChecked/> coverage-gaps</label>
                <label><input type="checkbox"/> cra-zones</label>
                <label><input type="checkbox"/> appreciation</label>
              </div>

              {/* coverage callout */}
              <div className="mc-cmd-panel" style={{bottom:14, left:14, maxWidth:260}}>
                <div className="mc-cmd-panel-h" style={{color:'#F87171'}}>// FAIR-LENDING ALERT</div>
                <div style={{fontFamily:'var(--font-mono)', fontSize:13, color:'#E1E6EE', lineHeight:1.4, marginTop:4}}>
                  6/8 loans in LMI tracts<br/>
                  <span style={{color:'#F87171'}}>0 in wards 7 &amp; 8</span>
                </div>
                <div style={{fontFamily:'var(--font-mono)', fontSize:9, color:'#6F7A8A', marginTop:6, lineHeight:1.5}}>
                  // CRA assessment area<br/>
                  // Q2 review · flagged
                </div>
              </div>

              {/* coords readout */}
              <div className="mc-cmd-panel" style={{top:14, right:14, fontFamily:'var(--font-mono)', fontSize:10}}>
                <div className="mc-cmd-panel-h">// VIEW</div>
                <div style={{color:'#98A1B0'}}>38.9072°N</div>
                <div style={{color:'#98A1B0'}}>77.0369°W</div>
                <div style={{color:'#4A5568', marginTop:4}}>z: 11 · proj: epsg:3857</div>
              </div>
            </div>

            {/* SIDE RAIL */}
            <div className="mc-cmd-rail">
              <div className="mc-cmd-rail-head">
                <span><b>// IN-FLIGHT</b> · 8</span>
                <span style={{color:'#4A5568'}}>sort: urgency↓</span>
              </div>
              {[...LOANS]
                .sort((a,b) => ({red:0,amber:1,green:2}[a.sla]) - ({red:0,amber:1,green:2}[b.sla]))
                .map(l => {
                  const color = l.stageKey === 'funded' ? '#22C55E' : l.sla === 'red' ? '#F87171' : l.sla === 'amber' ? '#FBBF24' : '#5BA0E5';
                  return (
                    <div key={l.id}
                         className={`mc-cmd-row ${selected?.id===l.id?'active':''}`}
                         onClick={() => setSel(l)}
                         onMouseEnter={() => setHovered(l.id)}
                         onMouseLeave={() => setHovered(null)}>
                      <span className="mc-cmd-row-dot" style={{background:color, boxShadow:`0 0 0 3px ${color}22`}}/>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                          <span className="mc-cmd-row-name">{l.borrower}</span>
                          <span className="mc-cmd-row-amt">{fmt$k(l.amount)}</span>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:2}}>
                          <span className="mc-cmd-row-meta">{l.id.replace('DCDC000','#')} · {STAGES[l.stageIdx].short}</span>
                          <span className="mc-cmd-row-meta" style={{color}}>{l.daysInStage}d{l.sla==='red'?' ⚠':''}</span>
                        </div>
                        <div className="mc-pl-stage" style={{marginTop:4}}>
                          {l.progress.map((s, i) => (
                            <div key={i} className={`mc-pl-stage-seg ${s === 'done' ? 'done' : s === 'current' ? 'cur' : s === 'blocked' ? 'bad' : ''}`}/>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* status bar */}
      <div className="mc-statusbar">
        <span>● <b>connected</b> <span className="sep">|</span> homium-ops-edge-04 <span className="sep">|</span> latency 41ms</span>
        <span>autorefresh: <b>2s</b> <span className="sep">|</span> ws: <b>open</b> <span className="sep">|</span> uptime 99.987%</span>
        <span>operator: <b>p.shah@homium</b> <span className="sep">|</span> session 02:14:33 <span className="sep">|</span> ⌘k commands</span>
      </div>

      <Drawer loan={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)}/>
    </div>
  );
};

window.MissionArtboard = MissionArtboard;
