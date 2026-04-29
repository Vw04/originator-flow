/* ARTBOARD 8 — ATRIUM — light originator workbench, 3-column with horizontal journey strip.
   Reads State.getAtriumScope() to decide which loans populate the left rail:
   - If a scope is set (1+ ids from a loan-detail toggle or originations queue),
     the rail shows only those loans.
   - If empty (e.g. visited as a standalone artboard preview), it shows all loans. */
const AtriumArtboard = () => {
  const LOANS = HOMIUM_DATA.LOANS;
  const STAGES = HOMIUM_DATA.STAGES;
  const PEOPLE = HOMIUM_DATA.PEOPLE;

  const scopeIds = (typeof State !== 'undefined' && State.getAtriumScope) ? State.getAtriumScope() : [];
  const scopedLoans = scopeIds.length
    ? scopeIds.map(id => LOANS.find(l => l.id === id)).filter(Boolean)
    : LOANS;

  const [activeId, setActiveId] = React.useState(scopedLoans[0] ? scopedLoans[0].id : null);
  React.useEffect(() => {
    if (!scopedLoans.find(l => l.id === activeId) && scopedLoans[0]) setActiveId(scopedLoans[0].id);
  }, [scopedLoans.map(l => l.id).join(',')]);

  const focus = scopedLoans.find(l => l.id === activeId) || scopedLoans[0];

  // when not in scoped mode, group loans like before; when scoped, just show one section
  const isScoped = scopeIds.length > 0;
  const pinned = isScoped ? scopedLoans : LOANS.filter(l => l.sla === 'red' || l.sla === 'amber' || l.stageKey === 'ctc' || l.stageKey === 'doc');
  const others = isScoped ? [] : LOANS.filter(l => !pinned.includes(l));

  if (!focus) return <div className="ab-atrium" style={{padding:40, color:'#6B6557'}}>No loans in scope. Select loans from the originations list and click "View in Atrium".</div>;

  const stipDone = focus.stips.filter(s => s.status === 'received').length;
  const stipTotal = focus.stips.length;
  const stipPending = focus.stips.filter(s => s.status === 'pending').length;
  const stipBlocked = focus.stips.filter(s => s.status === 'blocked').length;

  return (
    <div className="ab-atrium ab-atrium-no-tabs">
      {/* `.atr-top` removed — host app's topnav provides logo, search, user.
          Pins/tabs were redundant with the left rail; left rail is the single
          source of which loans are in scope. */}

      {/* LEFT RAIL: scoped loans (or full list when not scoped) */}
      <div className="atr-rail">
        <div className="atr-rail-section">
          <div className="atr-rail-h">
            <div className="atr-rail-title">{isScoped ? 'In scope' : 'Pinned to today'}</div>
            <span className="atr-rail-count">{pinned.length}</span>
          </div>
          {pinned.map(l => (
            <div
              key={l.id}
              className={'atr-rail-card' + (l.id === activeId ? ' active' : '')}
              onClick={() => setActiveId(l.id)}
            >
              <div className="atr-rail-card-id">{l.id}</div>
              <div className="atr-rail-card-name">{l.borrower}</div>
              <div className="atr-rail-card-meta">
                <span>{STAGES[l.stageIdx].short}</span>
                <span className="atr-rail-card-amt">{fmt$k(l.amount)}</span>
              </div>
              <div className="atr-rail-mini-stage" style={{display:'flex', gap:2, marginTop:8}}>
                {l.progress.map((s, i) => (
                  <div key={i} className={
                    'atr-rail-mini-seg ' +
                    (s === 'done' ? 'done' : s === 'current' ? 'cur' : s === 'blocked' ? 'bad' : '')
                  }/>
                ))}
              </div>
              <div style={{marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span className={'atr-rail-card-sla ' + l.sla}>
                  {l.sla === 'red' ? `${l.daysInStage}d · breach` : l.sla === 'amber' ? `${l.daysInStage}d · risk` : `${l.daysInStage}d`}
                </span>
                <span style={{fontSize: 10, color: '#9C9583', fontFamily: 'var(--font-mono)'}}>{l.updatedAgo}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="atr-rail-section">
          <div className="atr-rail-h">
            <div className="atr-rail-title">Other loans</div>
            <span className="atr-rail-count">{others.length}</span>
          </div>
          {others.map(l => (
            <div
              key={l.id}
              className={'atr-rail-card' + (l.id === activeId ? ' active' : '')}
              onClick={() => setActiveId(l.id)}
            >
              <div className="atr-rail-card-id">{l.id}</div>
              <div className="atr-rail-card-name">{l.borrower}</div>
              <div className="atr-rail-card-meta">
                <span>{STAGES[l.stageIdx].short}</span>
                <span className="atr-rail-card-amt">{fmt$k(l.amount)}</span>
              </div>
            </div>
          ))}
          <div className="atr-pin-hint">Drag any loan up here to pin to today</div>
        </div>
      </div>

      {/* CENTER CANVAS */}
      <div className="atr-canvas">
        <div className="atr-canvas-inner">
          <div className="atr-canvas-head">
            <div className="atr-canvas-id">
              <span>{focus.id}</span>
              <span className={'atr-canvas-pill' + (focus.sla === 'red' ? ' warn' : '')}>
                {focus.sla === 'red' ? 'SLA BREACH' : focus.sla === 'amber' ? 'SLA AT RISK' : 'ON TRACK'}
              </span>
              <span>{focus.program.name.toUpperCase()}</span>
            </div>
            <h1 className="atr-canvas-name">
              {focus.borrower} · <em>{focus.address.split(',')[0]}</em>
            </h1>
            <div className="atr-canvas-sub">
              <span>{focus.address}, {focus.cityState}</span>
              <span>·</span>
              <span>opened {focus.daysInStage} day{focus.daysInStage === 1 ? '' : 's'} ago</span>
            </div>
            <div className="atr-canvas-stats">
              <div>
                <div className="atr-canvas-stat-lbl">Loan amount</div>
                <div className="atr-canvas-stat-val">{fmt$(focus.amount)}</div>
              </div>
              <div>
                <div className="atr-canvas-stat-lbl">Stage</div>
                <div className="atr-canvas-stat-val">{STAGES[focus.stageIdx].label}</div>
              </div>
              <div>
                <div className="atr-canvas-stat-lbl">Stips</div>
                <div className="atr-canvas-stat-val">{stipDone} <span style={{color:'#9C9583', fontSize: 14}}>/ {stipTotal}</span></div>
              </div>
              <div>
                <div className="atr-canvas-stat-lbl">Days in stage</div>
                <div className="atr-canvas-stat-val" style={{color: focus.sla === 'red' ? '#B0382C' : focus.sla === 'amber' ? '#8A6414' : undefined}}>
                  {focus.daysInStage}d
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE: horizontal journey strip */}
          <div className="atr-journey-wrap">
            <div className="atr-journey-h">
              <div className="atr-journey-title">
                Journey <em>· {STAGES.length} stages</em>
              </div>
              <div className="atr-journey-eta">
                ETA to close · <b>{focus.stageKey === 'funded' ? 'funded' : `${(7 - focus.stageIdx) * 5}–${(7 - focus.stageIdx) * 7}d`}</b>
              </div>
            </div>
            <div className="atr-journey">
              {STAGES.map((s, i) => {
                const status = focus.progress[i] || 'future';
                const cls = status === 'done' ? 'done' : status === 'current' ? 'current' : status === 'blocked' ? 'blocked' : 'future';
                return (
                  <div key={s.id} className={'atr-stop ' + cls}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <div className={'atr-stop-icon ' + cls}>
                        {status === 'done' ? '✓' : status === 'blocked' ? '!' : i + 1}
                      </div>
                      <div style={{minWidth: 0, flex: 1}}>
                        <div className={'atr-stop-num ' + cls}>STAGE {String(i + 1).padStart(2, '0')}</div>
                        <div className="atr-stop-name">{s.label}</div>
                      </div>
                    </div>
                    {status === 'current' && (
                      <>
                        <div className="atr-stop-detail">
                          <b>Now</b> · {focus.daysInStage}d in stage. {focus.nextAction || 'No action required.'}
                        </div>
                        <div className="atr-stop-tasks">
                          {focus.stips.slice(0, 3).map(stip => (
                            <div key={stip.id} className={'atr-stop-task' + (stip.status === 'received' ? ' done' : stip.status === 'blocked' ? ' blocked' : '')}>
                              <span className="atr-task-check">{stip.status === 'received' ? '✓' : stip.status === 'blocked' ? '!' : ''}</span>
                              <span>{stip.label}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {status === 'blocked' && (
                      <div className="atr-stop-detail" style={{background:'#FCF1EF', color:'#B0382C'}}>
                        <b>Blocked · {focus.daysInStage}d</b><br/>{focus.nextAction || 'Action needed.'}
                      </div>
                    )}
                    {status === 'done' && (
                      <div className="atr-stop-meta">
                        <Icon name="check" size={11}/> <span>Complete</span>
                      </div>
                    )}
                    {(status === '' || status === 'future') && (
                      <div className="atr-stop-meta">
                        <span>Not started</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* FLOW SECTION 1: live document */}
          <div className="atr-flow-section">
            <div className="atr-flow-h">
              <span className="atr-flow-num">i.</span>
              <h2 className="atr-flow-title">The file <em>· at a glance</em></h2>
            </div>
            <div className="atr-doc">
              <div className="atr-doc-row">
                <div className="atr-doc-lbl">Borrower</div>
                <div className="atr-doc-val serif">{focus.borrower}</div>
              </div>
              <div className="atr-doc-row">
                <div className="atr-doc-lbl">Property</div>
                <div className="atr-doc-val">{focus.address}, {focus.cityState}</div>
              </div>
              <div className="atr-doc-row">
                <div className="atr-doc-lbl">Loan amount</div>
                <div className="atr-doc-val serif">{fmt$(focus.amount)}</div>
              </div>
              <div className="atr-doc-row">
                <div className="atr-doc-lbl">Program</div>
                <div className="atr-doc-val">{focus.program.name}</div>
              </div>
              <div className="atr-doc-row">
                <div className="atr-doc-lbl">Underwriter</div>
                <div className="atr-doc-val">{focus.underwriter.name} <span style={{color:'#9C9583', fontSize: 11}}>· {focus.underwriter.org}</span></div>
              </div>
              <div className="atr-doc-row">
                <div className="atr-doc-lbl">Originator</div>
                <div className="atr-doc-val">{focus.owners[0].name} <span style={{color:'#9C9583', fontSize: 11}}>· {focus.owners[0].org}</span></div>
              </div>
            </div>
          </div>

          {/* FLOW SECTION 2: documents */}
          <div className="atr-flow-section">
            <div className="atr-flow-h">
              <span className="atr-flow-num">ii.</span>
              <h2 className="atr-flow-title">Documents <em>· {stipDone} of {stipTotal} received</em></h2>
            </div>
            <div className="atr-docs-grid">
              {focus.stips.map(s => (
                <div key={s.id} className="atr-doc-card">
                  <div className="atr-doc-card-thumb">
                    {s.label}<br/><br/>
                    {s.status === 'received' ? 'OCR confirmed.' : s.status === 'blocked' ? 'Borrower unresponsive — ping to unblock.' : `Awaiting ${s.owner}.`}
                  </div>
                  <div className="atr-doc-card-name">{s.label}</div>
                  <div className="atr-doc-card-meta">
                    <span>{s.owner}</span>
                    <span className="atr-doc-card-conf" style={
                      s.status === 'received' ? null :
                      s.status === 'blocked' ? {background:'#FBE7E3', color:'#B0382C'} :
                      {background:'#FBF1D6', color:'#8A6414'}
                    }>
                      {s.status === 'received' ? 'OCR ✓' : s.status === 'blocked' ? 'BLOCKED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT INSPECTOR: AI copilot, presence, signals */}
      <div className="atr-inspector">
        <div className="atr-insp-section">
          <div className="atr-copilot">
            <div className="atr-copilot-h">Homium AI · co-pilot</div>
            <div className="atr-copilot-body">
              "{focus.aiNudge || `${focus.borrower} is on track — no action needed today.`}"
            </div>
            <div className="atr-copilot-actions">
              <button className="atr-copilot-btn primary">Draft a nudge</button>
              <button className="atr-copilot-btn">Ask AI →</button>
            </div>
          </div>
        </div>

        <div className="atr-insp-section">
          <div className="atr-insp-h">
            <div className="atr-insp-title">Live team</div>
            <span style={{fontSize: 10, color: '#16A34A', fontWeight: 600}}>● 3 online</span>
          </div>
          <div className="atr-person">
            <div className="atr-person-ava live" style={{background: PEOPLE.priya.bg}}>{PEOPLE.priya.initials}</div>
            <div>
              <div className="atr-person-name">{PEOPLE.priya.name}</div>
              <div className="atr-person-role">Underwriter · Homium</div>
            </div>
          </div>
          <div className="atr-person">
            <div className="atr-person-ava live" style={{background: PEOPLE.dana.bg}}>{PEOPLE.dana.initials}</div>
            <div>
              <div className="atr-person-name">{PEOPLE.dana.name}</div>
              <div className="atr-person-role">Processor · CC Lending</div>
            </div>
          </div>
          <div className="atr-person">
            <div className="atr-person-ava" style={{background: PEOPLE.marcus.bg}}>{PEOPLE.marcus.initials}</div>
            <div>
              <div className="atr-person-name">{PEOPLE.marcus.name}</div>
              <div className="atr-person-role">Underwriter · Homium</div>
            </div>
          </div>
        </div>

        <div className="atr-insp-section">
          <div className="atr-insp-h">
            <div className="atr-insp-title">Signals</div>
          </div>
          <div className="atr-signal">
            <div className={'atr-signal-dot ' + (focus.sla === 'red' ? 'red' : focus.sla === 'amber' ? 'amber' : 'green')}/>
            <div>
              <div className="atr-signal-msg">
                <b>{focus.sla === 'red' ? 'SLA breached' : focus.sla === 'amber' ? 'Approaching SLA' : 'On schedule'}</b> · {focus.daysInStage} days in {STAGES[focus.stageIdx].label}
              </div>
              <div className="atr-signal-time">{focus.updatedAgo}</div>
            </div>
          </div>
          <div className="atr-signal">
            <div className="atr-signal-dot green"/>
            <div>
              <div className="atr-signal-msg">
                <b>{stipDone}/{stipTotal} stips</b> received{stipBlocked > 0 ? ` · ${stipBlocked} blocked` : stipPending > 0 ? ` · ${stipPending} pending` : ''}
              </div>
              <div className="atr-signal-time">live</div>
            </div>
          </div>
          <div className="atr-signal">
            <div className="atr-signal-dot amber"/>
            <div>
              <div className="atr-signal-msg">
                Median close <b>34 days</b> for {focus.program.name} cohort
              </div>
              <div className="atr-signal-time">12-week trailing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.AtriumArtboard = AtriumArtboard;
