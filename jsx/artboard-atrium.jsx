/* ARTBOARD 8 — ATRIUM — light originator workbench, top tabs + persistent header + journey strip.
   Reads State.getAtriumScope() to decide which loans populate the tab strip:
   - If a scope is set (1+ ids from a loan-detail toggle or originations queue),
     the tabs show only those loans.
   - If empty (e.g. visited as a standalone artboard preview), all loans become tabs. */

/* Stage-aware data-review card. Shows the fields the originator actually
   needs to act on for THIS stage. Values are demo-side, derived
   deterministically from the loan id in the parent component. */
const StageDataCard = ({ stageId, l, d }) => {
  const cell = (lbl, val) => (
    <div className="atr-data-cell">
      <div className="atr-data-lbl">{lbl}</div>
      <div className="atr-data-val">{val ?? '—'}</div>
    </div>
  );
  let title = 'Data review';
  let cells = [];
  let extraButtons = null;
  if (stageId === 'prequalification') {
    title = 'Data review · qualification snapshot';
    cells = [
      cell('FICO', d.fico),
      cell('Household income', fmt$k(d.householdIncome)),
      cell('Program', l.program.name),
      cell('AMI band', d.amiBand),
    ];
  } else if (stageId === 'application_disclosures') {
    title = 'Data review · application';
    cells = [
      cell('Loan amount', fmt$(l.amount)),
      cell('LTV', d.ltv + '%'),
      cell('CLTV', d.cltv + '%'),
      cell('Property type', d.propertyType),
    ];
  } else if (stageId === 'cda_appraisal') {
    title = 'Data review · CDA & appraisal';
    cells = [
      cell('Appraised value', fmt$(d.appraisedValue)),
      cell('LTV', d.ltv + '%'),
      cell('CLTV', d.cltv + '%'),
      cell('Recommended', d.ltv < 80 ? 'Approve' : 'Escalate'),
    ];
    extraButtons = (
      <div className="atr-data-actions">
        <button className="atr-data-btn">Review appraisal →</button>
        <button className="atr-data-btn">View CDA report →</button>
      </div>
    );
  } else if (stageId === 'clear_close') {
    title = 'Data review · clear to close';
    cells = [
      cell('ATR cleared', d.atrCleared),
      cell('AMI verified', d.amiVerified),
      cell('Fees', d.feesTolerance),
      cell('Title', d.titleStatus),
    ];
    extraButtons = (
      <div className="atr-data-actions">
        <button className="atr-data-btn">Approve ATR / AMI →</button>
        <button className="atr-data-btn">Open fees worksheet →</button>
      </div>
    );
  } else if (stageId === 'post_closing') {
    title = 'Data review · post-closing & funding';
    cells = [
      cell('Wire date', d.wireDate),
      cell('Funding amount', fmt$(l.amount)),
      cell('MERS MIN', d.mersMin),
      cell('WAB file', 'Pending'),
    ];
  } else if (stageId === 'transfer_minting') {
    title = 'Data review · transfer & minting';
    cells = [
      cell('Mint status', d.mintStatus),
      cell('TOB2 transfer', d.tob2Status),
      cell('MERS MIN', d.mersMin),
      cell('Servicing', 'Email pending'),
    ];
  } else {
    cells = [cell('—', '—')];
  }
  return (
    <div className="atr-data-card">
      <div className="atr-data-h">{title}</div>
      <div className="atr-data-grid">{cells}</div>
      {extraButtons}
    </div>
  );
};

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
  const [completedOpen, setCompletedOpen] = React.useState(false);
  React.useEffect(() => {
    if (!scopedLoans.find(l => l.id === activeId) && scopedLoans[0]) setActiveId(scopedLoans[0].id);
  }, [scopedLoans.map(l => l.id).join(',')]);

  const focus = scopedLoans.find(l => l.id === activeId) || scopedLoans[0];

  if (!focus) return <div className="ab-atrium" style={{padding:40, color:'#6B6557'}}>No loans in scope. Select loans from the originations list and click "View in Atrium".</div>;

  const stipDone = focus.stips.filter(s => s.status === 'received').length;
  const stipTotal = focus.stips.length;
  const stipPending = focus.stips.filter(s => s.status === 'pending').length;
  const stipBlocked = focus.stips.filter(s => s.status === 'blocked').length;

  /* ── Consolidated 6-stage model + role-gated visibility ──
     Old 7-stage idx → new 6-stage idx. LO/LP see stages 1-4 only;
     operators / sys_admin / prog_admin see all 6. */
  const STAGES_FULL = HOMIUM_DATA.STAGES_FULL || [];
  const OLD_TO_NEW = [0, 1, 1, 2, 2, 3, 4];
  const role = (typeof State !== 'undefined' && State.getRole) ? State.getRole() : null;
  const isLO = role === 'lo' || role === 'lp';
  const visibleStages = isLO ? STAGES_FULL.slice(0, 4) : STAGES_FULL;
  const newStageIdx = OLD_TO_NEW[focus.stageIdx] ?? 0;
  const cappedNewIdx = Math.min(newStageIdx, visibleStages.length - 1);

  /* Stage tasks with derived statuses for the demo:
     - earlier stages: every task done
     - current stage: first ⌊stipDone/stipTotal · N⌋ tasks done, next is active (or blocked when SLA red), rest pending
     - later stages: every task pending */
  const stagesWithStatus = visibleStages.map((stage, sIdx) => {
    const tasks = stage.tasks.map((t, tIdx) => {
      let status;
      if (sIdx < cappedNewIdx) status = 'done';
      else if (sIdx > cappedNewIdx) status = 'pending';
      else {
        const ratio = stipTotal ? (stipDone / stipTotal) : 0;
        const doneInCurrent = Math.max(0, Math.min(stage.tasks.length - 1, Math.floor(ratio * stage.tasks.length)));
        if (tIdx < doneInCurrent) status = 'done';
        else if (tIdx === doneInCurrent) status = focus.sla === 'red' ? 'blocked' : 'active';
        else status = 'pending';
      }
      return { ...t, status };
    });
    return { ...stage, tasks, doneCount: tasks.filter(t => t.status === 'done').length };
  });
  const completedStagesList = stagesWithStatus.slice(0, cappedNewIdx);
  const currentStageObj = stagesWithStatus[cappedNewIdx];
  const futureStagesList = stagesWithStatus.slice(cappedNewIdx + 1);

  /* Deterministic demo-side data review values keyed off the loan id. */
  const seed = focus.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const data = {
    ltv: 65 + (seed % 12),
    cltv: 68 + (seed % 14),
    fico: 700 + (seed % 60),
    householdIncome: 65000 + ((seed % 80) * 1000),
    appraisedValue: Math.round(focus.amount / (0.65 + (seed % 12) / 100)),
    amiBand: ['80%', '100%', '120%', '140%'][seed % 4],
    propertyType: ['Single family', 'Townhouse', 'Condo'][seed % 3],
    feesTolerance: ['Within tolerance', 'Within tolerance', 'Re-disclosure needed'][seed % 3],
    atrCleared: 'Yes',
    amiVerified: 'Yes',
    titleStatus: 'Clear',
    wireDate: '2026-03-22',
    mersMin: '100' + (seed * 7).toString().padStart(10, '0').slice(0, 10),
    mintStatus: cappedNewIdx >= 5 ? 'In queue' : '—',
    tob2Status: cappedNewIdx >= 5 ? 'Pending batch' : '—',
  };

  /* Map each stip to the stage it logically belongs to, for the doc manager. */
  const stipStageLabel = (label) => {
    const L = (label || '').toLowerCase();
    if (/(prequal|soft credit)/i.test(L)) return { idx: 0, short: 'PRE-QUAL' };
    if (/(w-?2|paystub|bank statement|tax transcript|disclosure|app|voe|hard credit|signed disc|borrower qual)/i.test(L)) return { idx: 1, short: 'APP' };
    if (/(appraisal|coa memo|condition|eligibility|counseling|cda|1099)/i.test(L)) return { idx: 2, short: 'CDA' };
    if (/(title|atr|ami|clear|prelim|san note|fee|closing dis|closing pack|release of lien|cpa)/i.test(L)) return { idx: 3, short: 'CTC' };
    if (/(wire|hud|funding|post-?clos|mers|disbursement|wab)/i.test(L)) return { idx: 4, short: 'POST' };
    if (/(securit|mint|servicing|deed)/i.test(L)) return { idx: 5, short: 'MINT' };
    return { idx: cappedNewIdx, short: visibleStages[cappedNewIdx]?.short || '—' };
  };

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
          <div className="atr-header-row3">
            <span className="atr-header-team">UW <b>{focus.underwriter.name}</b> · {focus.underwriter.org}</span>
            <span className="atr-header-sep">·</span>
            <span className="atr-header-team">Originator <b>{focus.owners[0].name}</b> · {focus.owners[0].org}</span>
          </div>
        </div>

        <div className="atr-canvas-inner">
          {/* Journey rail — completed-chip + big current tile + smaller future tiles. */}
          <div className="atr-journey-v2">
            {completedStagesList.length > 0 && (
              <button
                className={'atr-jv-completed-chip' + (completedOpen ? ' open' : '')}
                onClick={() => setCompletedOpen(!completedOpen)}
                title={completedOpen ? 'Collapse completed stages' : 'Expand completed stages'}
              >
                <span className="atr-jv-completed-check">✓</span>
                <span>{completedStagesList.length} completed</span>
                <span className="atr-jv-completed-caret">{completedOpen ? '▾' : '▸'}</span>
              </button>
            )}
            {completedOpen && completedStagesList.map((s, i) => (
              <div key={s.id} className="atr-jv-completed-pill" title={s.label}>
                <span className="atr-jv-completed-pill-n">{i + 1}</span>
                <span>{s.short}</span>
                <span className="atr-jv-completed-pill-check">✓</span>
              </div>
            ))}

            {currentStageObj && (
              <div className="atr-jv-current">
                <div className="atr-jv-current-num">STAGE {String(cappedNewIdx + 1).padStart(2, '0')}</div>
                <div className="atr-jv-current-label">{currentStageObj.label}</div>
                <div className="atr-jv-current-sub">
                  {focus.sla === 'red' ? 'Stalled' : focus.sla === 'amber' ? 'Aging' : 'In progress'}
                  {' · '}
                  <b>{currentStageObj.doneCount}</b> of {currentStageObj.tasks.length} tasks
                </div>
              </div>
            )}

            {futureStagesList.map((s, i) => (
              <div key={s.id} className="atr-jv-future" title={s.label}>
                <div className="atr-jv-future-num">STAGE {String(cappedNewIdx + 2 + i).padStart(2, '0')}</div>
                <div className="atr-jv-future-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Current-stage workspace — tasks (dominant) + stage-aware data review. */}
          {currentStageObj && (
            <div className="atr-stage-workspace">
              <div className="atr-stage-card">
                <div className="atr-stage-card-h">
                  <div>
                    <div className="atr-stage-card-eyebrow">Stage {cappedNewIdx + 1} · current</div>
                    <h2 className="atr-stage-card-title">{currentStageObj.label}</h2>
                  </div>
                  <div className="atr-stage-card-meta">
                    <span className={'atr-stage-card-status' + (focus.sla === 'red' ? ' bad' : focus.sla === 'amber' ? ' warn' : '')}>
                      {focus.sla === 'red' ? 'Stalled' : 'In progress'}
                    </span>
                    <span className="atr-stage-card-count">{currentStageObj.doneCount}/{currentStageObj.tasks.length}</span>
                  </div>
                </div>
                <div className="atr-task-list">
                  {currentStageObj.tasks.map(t => (
                    <div key={t.id} className={'atr-task-row ' + t.status}>
                      <span className={'atr-task-icon ' + t.status}>
                        {t.status === 'done' ? '✓' : t.status === 'blocked' ? '!' : ''}
                      </span>
                      <span className="atr-task-label">{t.label}</span>
                      <span className="atr-task-role-pill">{t.role}</span>
                      {t.action && (t.status === 'active' || t.status === 'blocked' || t.status === 'done') && (
                        <button className="atr-task-action-btn" title={`${t.action} (demo)`}>{t.action} →</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <StageDataCard stageId={currentStageObj.id} l={focus} d={data}/>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT INSPECTOR: AI chat + smart doc manager — toggled by the panel icon in the header. */}
      {inspectorOpen && <div className="atr-inspector">
        {/* AI chat — hero. Seeded with the loan's aiNudge as the first assistant message. */}
        <div className="atr-chat">
          <div className="atr-chat-h">Homium AI · co-pilot</div>
          <div className="atr-chat-transcript">
            <div className="atr-chat-bubble assistant">
              {focus.aiNudge || `${focus.borrower} is on track — no action needed today.`}
            </div>
            <div className="atr-chat-suggestions">
              <button className="atr-chat-suggestion">What's next?</button>
              <button className="atr-chat-suggestion">Any open issues?</button>
              <button className="atr-chat-suggestion">Summarize the file</button>
            </div>
          </div>
          <form
            className="atr-chat-input-row"
            onSubmit={(e) => { e.preventDefault(); /* demo only */ }}
          >
            <input
              className="atr-chat-input"
              type="text"
              placeholder="Ask anything about this file…"
              aria-label="Ask the co-pilot a question"
            />
            <kbd className="atr-chat-kbd">⏎</kbd>
          </form>
        </div>

        {/* Documents — drag-to-upload, auto-sorted by stage. */}
        <div className="atr-docs-panel">
          <div className="atr-docs-h">
            <span className="atr-docs-title">Documents</span>
            <span className="atr-docs-count">{stipDone} of {stipTotal} received</span>
          </div>
          <label className="atr-docs-drop">
            <input
              type="file"
              multiple
              className="atr-docs-drop-input"
              onChange={(e) => {
                if (e.target.files && e.target.files.length) {
                  alert(`Demo: ${e.target.files.length} file(s) would be auto-sorted into the right stage.`);
                  e.target.value = '';
                }
              }}
            />
            <div className="atr-docs-drop-icon">↓</div>
            <div className="atr-docs-drop-msg">
              <b>Drop files here</b><br/>
              <span>We'll sort them into the right stage automatically</span>
            </div>
          </label>
          <div className="atr-docs-list">
            {focus.stips.map(s => {
              const stage = stipStageLabel(s.label);
              const statusCls = s.status === 'received' ? 'ok' : s.status === 'blocked' ? 'bad' : 'pending';
              return (
                <div key={s.id} className="atr-docs-row">
                  <span className={'atr-docs-row-icon ' + statusCls}>
                    {s.status === 'received' ? '✓' : s.status === 'blocked' ? '!' : '○'}
                  </span>
                  <span className="atr-docs-row-name">{s.label}</span>
                  <span className="atr-docs-row-stage">{stage.short}</span>
                  <span className={'atr-docs-row-status ' + statusCls}>
                    {s.status === 'received' ? '✓' : s.status === 'blocked' ? 'blocked' : 'pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>}
    </div>
  );
};

window.AtriumArtboard = AtriumArtboard;
