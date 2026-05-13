/* ARTBOARD 8 — ATRIUM — light originator workbench, top tabs + persistent header + journey strip.
   Reads State.getAtriumScope() to decide which loans populate the tab strip:
   - If a scope is set (1+ ids from a loan-detail toggle or originations queue),
     the tabs show only those loans.
   - If empty (e.g. visited as a standalone artboard preview), all loans become tabs. */
const AtriumArtboard = () => {
  const LOANS = HOMIUM_DATA.LOANS;
  const STAGES = HOMIUM_DATA.STAGES;
  const PEOPLE = HOMIUM_DATA.PEOPLE;

  const scopeIds = (typeof State !== 'undefined' && State.getAtriumScope) ? State.getAtriumScope() : [];
  const scopedLoans = scopeIds.length
    ? scopeIds.map(id => LOANS.find(l => l.id === id)).filter(Boolean)
    : LOANS;

  const [activeId, setActiveId] = React.useState(scopedLoans[0] ? scopedLoans[0].id : null);
  const [inspectorOpen, setInspectorOpen] = React.useState(true);
  React.useEffect(() => {
    if (!scopedLoans.find(l => l.id === activeId) && scopedLoans[0]) setActiveId(scopedLoans[0].id);
  }, [scopedLoans.map(l => l.id).join(',')]);

  const focus = scopedLoans.find(l => l.id === activeId) || scopedLoans[0];

  if (!focus) return <div className="ab-atrium" style={{padding:40, color:'#6B6557'}}>No loans in scope. Select loans from the originations list and click "View in Atrium".</div>;

  const stipDone = focus.stips.filter(s => s.status === 'received').length;
  const stipTotal = focus.stips.length;
  const stipPending = focus.stips.filter(s => s.status === 'pending').length;
  const stipBlocked = focus.stips.filter(s => s.status === 'blocked').length;

  return (
    <div className={'ab-atrium ab-atrium-no-tabs' + (inspectorOpen ? '' : ' atrium-inspector-collapsed')}>
      {/* CANVAS — tabs strip + persistent header flow continuously into the scrollable content. */}
      <div className="atr-canvas">
        {/* Tabs strip — one tab per loan in scope; + opens originations list to add more. */}
        <div className="atr-tabs-row">
          {scopedLoans.map(l => (
            <div
              key={l.id}
              className={'atr-tab' + (l.id === activeId ? ' active' : '')}
              onClick={() => setActiveId(l.id)}
              title={l.borrower}
            >
              {l.sla === 'red' && <span className="atr-tab-pulse"/>}
              <span className="atr-tab-id">{l.id}</span>
              <span className="atr-tab-name">{l.borrower}</span>
              <button
                className="atr-tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof State !== 'undefined' && State.setAtriumScope) {
                    State.setAtriumScope(scopeIds.filter(x => x !== l.id));
                    if (typeof App !== 'undefined' && App.renderView) App.renderView('/originations');
                  }
                }}
                title="Remove from atrium"
              >×</button>
            </div>
          ))}
          <button
            className="atr-tab-add"
            onClick={() => {
              if (typeof State !== 'undefined' && State.setPageMode) State.setPageMode('originations','institutional');
              if (typeof App !== 'undefined' && App.renderView) App.renderView('/originations');
            }}
            title="Add loans to atrium"
          >+</button>
        </div>

        {/* Persistent loan header — sticky, visually continuous with the active tab. */}
        <div className="atr-header">
          <div className="atr-header-row1">
            <span className="atr-header-id">{focus.id}</span>
            <span className="atr-header-sep">·</span>
            <span className="atr-header-program">{focus.program.name.toUpperCase()}</span>
            <span className={'atr-canvas-pill' + (focus.sla === 'red' ? ' warn' : '')}>
              {focus.sla === 'red' ? 'STAGE STALLED' : focus.sla === 'amber' ? 'STAGE AGING' : 'ON TRACK'}
            </span>
            <button
              className={'atr-panel-toggle' + (inspectorOpen ? ' open' : '')}
              onClick={() => setInspectorOpen(!inspectorOpen)}
              title={inspectorOpen ? 'Hide inspector panel' : 'Show inspector panel'}
              aria-label={inspectorOpen ? 'Hide inspector panel' : 'Show inspector panel'}
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/>
                <line x1="10" y1="2.5" x2="10" y2="13.5"/>
                {inspectorOpen && <rect x="10" y="2.5" width="4.5" height="11" fill="currentColor" stroke="none"/>}
              </svg>
            </button>
          </div>
          <div className="atr-header-row2">
            <span className="atr-header-name">{focus.borrower}</span>
            <em className="atr-header-addr-short">· {focus.address.split(',')[0]}</em>
            <span className="atr-header-divider"/>
            <span className="atr-header-meta">{focus.address}, {focus.cityState}</span>
            <span className="atr-header-sep">·</span>
            <span className="atr-header-amt">{fmt$(focus.amount)}</span>
            <span className="atr-header-sep">·</span>
            <span className={'atr-sticky-pill ' + (focus.sla === 'red' ? 'warn' : focus.sla === 'amber' ? 'aging' : 'ok')}>
              {focus.sla === 'red' ? `Stalled · ${focus.daysInStage}d` : focus.sla === 'amber' ? `Aging · ${focus.daysInStage}d` : `${focus.daysInStage}d in stage`}
            </span>
            <span className="atr-header-sep">·</span>
            <span className="atr-header-meta">Stips <b>{stipDone}/{stipTotal}</b></span>
          </div>
        </div>

        <div className="atr-canvas-inner">
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

      {/* RIGHT INSPECTOR: AI copilot, presence, signals — toggled by the panel icon in the header. */}
      {inspectorOpen && <div className="atr-inspector">
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
                <b>{focus.sla === 'red' ? 'Stage stalled' : focus.sla === 'amber' ? 'Stage aging' : 'On schedule'}</b> · {focus.daysInStage} days in {STAGES[focus.stageIdx].label}
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
      </div>}
    </div>
  );
};

window.AtriumArtboard = AtriumArtboard;
