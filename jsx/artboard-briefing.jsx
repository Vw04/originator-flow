/* ARTBOARD 6 — BRIEFING — daily morning brief, single column, editorial */
const BriefingArtboard = () => {
  const [selected, setSel] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const LOANS = HOMIUM_DATA.LOANS;
  const STAGES = HOMIUM_DATA.STAGES;

  // Today's prioritized rundown
  const sortedLoans = [...LOANS].sort((a,b) => {
    const order = { red:0, amber:1, green:2 };
    return order[a.sla] - order[b.sla];
  });
  const top5 = sortedLoans.slice(0, 5);

  const openLoan = (l) => { setSel(l); setDrawerOpen(true); };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // headlines crafted per-loan
  const headlines = {
    'DCDC000005': 'After 11 days of silence, the Hayes loan needs a human nudge.',
    'DCDC000007': 'Title cleared on Penn Ave — Webb is one signature from clear-to-close.',
    'DCDC000001': 'Evelyn Ross uploaded her W-2. Two stips remaining.',
    'DCDC000002': 'COA approved on 1244 U St — moving to clear-to-close review.',
    'DCDC000003': 'Funded yesterday: 509 G St NE, the 88th household this quarter.',
    'DCDC000004': 'Park Rd appraisal scheduled for Tuesday; borrower confirmed.',
    'DCDC000006': 'New application from Lamont St — initial pull complete.',
    'DCDC000008': '7th St NE moving smoothly; appraisal back, value supported.',
  };

  const subheads = {
    'DCDC000005': 'Borrower hasn\'t responded to 3 emails. Homium AI suggests a personalized SMS referencing their April 14 voicemail. Five-minute fix could save the closing date.',
    'DCDC000007': 'Title underwriter signed off this morning. Final lender review estimated at 24 hours. Wire desk has been alerted to expect funding by EOW.',
    'DCDC000001': 'OCR auto-confirmed YTD gross of $32,140 against tax transcripts. Outstanding: signed disclosures + bank statement March. ETA to close: 37 days.',
    'DCDC000002': 'Underwriter approved with two prior-to-doc conditions. Borrower needs to acknowledge program eligibility window by Friday or shared-appreciation participation expires.',
    'DCDC000003': 'Wire confirmed at 14:32 yesterday. Hill household is officially home. Q2 funded total now $1.23M across DC Dream Fund.',
  };

  return (
    <div className="ab-briefing">
      <div className="brf-shell">

        {/* Masthead */}
        <div className="brf-masthead">
          <div className="brf-mast-l">
            <div className="brf-mast-mark">h</div>
            <div>
              <div className="brf-mast-name">The Homium Brief <em className="brf-mast-edition">— originator edition</em></div>
            </div>
          </div>
          <div className="brf-mast-r">
            <div className="brf-mast-date">{today}</div>
            <div className="brf-mast-issue">issue №412 · prepared at 06:30 ET for james.okafor@cclending</div>
          </div>
        </div>

        {/* Lead */}
        <h1 className="brf-lead">
          Eight loans, <em>$1.39M committed.</em><br/>
          Three need you today — the rest are running quietly.
        </h1>
        <p className="brf-deck">
          You're ahead of pace this month. The Hayes file is the only real concern; everything else is moving through underwriting on rhythm. Spend the morning on the three flagged below — you'll close out by lunch.
        </p>

        {/* Numbers */}
        <div className="brf-numbers">
          <div className="brf-num-cell">
            <div className="brf-num-lbl">Pipeline</div>
            <div className="brf-num-val">$1.23M</div>
            <div className="brf-num-delta">+$140k vs last week</div>
          </div>
          <div className="brf-num-cell">
            <div className="brf-num-lbl">Need you today</div>
            <div className="brf-num-val danger">3</div>
            <div className="brf-num-delta">1 stalled · 2 stips</div>
          </div>
          <div className="brf-num-cell">
            <div className="brf-num-lbl">Days median to close</div>
            <div className="brf-num-val">34</div>
            <div className="brf-num-delta">▼ 3d vs Q1 ('26)</div>
          </div>
          <div className="brf-num-cell">
            <div className="brf-num-lbl">Funded this quarter</div>
            <div className="brf-num-val">88</div>
            <div className="brf-num-delta">households · $19.4M</div>
          </div>
        </div>

        {/* AI quote-box */}
        <div className="brf-ai-quote">
          <div className="brf-ai-quote-ic">✦</div>
          <div>
            <div className="brf-ai-quote-body">
              "If you spend 15 minutes on <b>the Hayes file</b> this morning — a personal call, not another email — you'll likely save its August close. I've drafted three message variants based on what's worked with similar borrowers."
            </div>
            <div className="brf-ai-attr">— Homium AI, observed across 412 prior originator interventions</div>
            <div className="brf-ai-actions">
              <button className="primary">Read drafts</button>
              <button>Ask me anything →</button>
            </div>
          </div>
        </div>

        {/* Section: needs you today */}
        <div className="brf-section-head">
          <span className="brf-section-num">I.</span>
          <span className="brf-section-title">Needs your hand today</span>
          <span className="brf-section-rule"/>
        </div>

        {top5.filter(l => l.sla === 'red' || l.sla === 'amber').map((l, idx) => (
          <article key={l.id} className="brf-loan">
            <div className="brf-loan-rank">{String(idx+1).padStart(2,'0')}</div>
            <div>
              <span className={`brf-loan-ribbon ${l.sla}`}>
                {l.sla === 'red' ? `Stage stalled · ${l.daysInStage} days in stage` : `${l.daysInStage} days · stage aging`}
              </span>
              <h2 className="brf-loan-headline" onClick={() => openLoan(l)}>
                {headlines[l.id] || `${l.borrower} · ${STAGES[l.stageIdx].label}`}
              </h2>
              <div className="brf-loan-byline">
                {l.id} · {l.address}, {l.cityState} · {fmt$(l.amount)} · stage: {STAGES[l.stageIdx].short}
              </div>
              <p className="brf-loan-body">
                {subheads[l.id] || `Currently with ${l.underwriter.name} (${l.underwriter.org}). Last update: ${l.updatedAgo}.`}
              </p>
              <div className="brf-loan-actions">
                <button className="brf-action-btn" onClick={() => openLoan(l)}>Open file →</button>
                {l.sla === 'red' && <button className="brf-action-btn ghost">Draft a nudge</button>}
                <a className="brf-action-link" onClick={() => openLoan(l)}>view activity</a>
              </div>
            </div>
            <div className="brf-loan-aside">
              <div className="brf-aside-row"><span className="lbl">Borrower</span><span className="val" style={{fontSize:12, fontFamily:'var(--font-sans)'}}>{l.borrowerFirst}</span></div>
              <div className="brf-aside-row"><span className="lbl">Amount</span><span className="val">{fmt$k(l.amount)}</span></div>
              <div className="brf-aside-row"><span className="lbl">Days in stage</span><span className="val" style={{color: l.sla==='red'?'#B0382C':'#8A6414'}}>{l.daysInStage}d</span></div>
              <div className="brf-aside-row"><span className="lbl">Owner</span><span className="val" style={{fontSize:11, fontFamily:'var(--font-sans)'}}>{l.owners[0].initials}</span></div>
              <div className="brf-aside-stage">
                {l.progress.map((s, i) => (
                  <div key={i} className={`brf-aside-stage-seg ${s === 'done' ? 'done' : s === 'current' ? 'cur' : s === 'blocked' ? 'bad' : ''}`}/>
                ))}
              </div>
            </div>
          </article>
        ))}

        {/* Section: in motion */}
        <div className="brf-section-head">
          <span className="brf-section-num">II.</span>
          <span className="brf-section-title">In motion · running quietly</span>
          <span className="brf-section-rule"/>
        </div>

        {sortedLoans.filter(l => l.sla === 'green' && l.stageKey !== 'funded').slice(0, 3).map((l, idx) => (
          <article key={l.id} className="brf-loan">
            <div className="brf-loan-rank" style={{color:'#00334A'}}>{String(idx+1).padStart(2,'0')}</div>
            <div>
              <h2 className="brf-loan-headline" onClick={() => openLoan(l)}>
                {headlines[l.id] || `${l.borrower} progressing through ${STAGES[l.stageIdx].label}`}
              </h2>
              <div className="brf-loan-byline">
                {l.id} · {l.address}, {l.cityState} · {fmt$(l.amount)} · {l.daysInStage}d in stage
              </div>
              <p className="brf-loan-body">
                {subheads[l.id] || `On schedule. Currently with ${l.underwriter.name}. ${l.nextAction || 'No action required from you.'}`}
              </p>
              <div className="brf-loan-actions">
                <a className="brf-action-link" onClick={() => openLoan(l)}>open file →</a>
              </div>
            </div>
            <div className="brf-loan-aside" style={{background:'transparent', borderColor:'transparent', padding:0, width:160}}>
              <div className="brf-aside-row"><span className="lbl">Stage</span><span className="val" style={{fontSize:12, fontFamily:'var(--font-sans)', color:'#00334A', fontWeight:600}}>{STAGES[l.stageIdx].short}</span></div>
              <div className="brf-aside-stage">
                {l.progress.map((s, i) => (
                  <div key={i} className={`brf-aside-stage-seg ${s === 'done' ? 'done' : s === 'current' ? 'cur' : ''}`}/>
                ))}
              </div>
            </div>
          </article>
        ))}

        {/* Section: closed yesterday */}
        <div className="brf-section-head">
          <span className="brf-section-num">III.</span>
          <span className="brf-section-title">Closed yesterday</span>
          <span className="brf-section-rule"/>
        </div>

        {LOANS.filter(l => l.stageKey === 'funded').map(l => (
          <article key={l.id} className="brf-loan">
            <div className="brf-loan-rank" style={{color:'#00334A', fontStyle:'italic'}}>✓</div>
            <div>
              <span className="brf-loan-ribbon green">Funded · {fmt$(l.amount)}</span>
              <h2 className="brf-loan-headline" onClick={() => openLoan(l)}>
                {headlines[l.id] || `${l.borrower} closed and funded`}
              </h2>
              <div className="brf-loan-byline">{l.id} · {l.address}, {l.cityState}</div>
              <p className="brf-loan-body">{subheads[l.id]}</p>
            </div>
          </article>
        ))}

        {/* End mark */}
        <div className="brf-end">
          <span>End of brief · {today.toUpperCase()}</span>
          <span className="brf-end-mark">h</span>
          <span>tomorrow's brief delivers at 06:30 ET</span>
        </div>
      </div>

      <Drawer loan={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)}/>
    </div>
  );
};

window.BriefingArtboard = BriefingArtboard;
