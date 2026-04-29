/* Slide-in side drawer used by every artboard.
   Accepts a loan from HOMIUM_DATA.LOANS. Tabs: Overview, Stips, Activity, Docs. */

const Drawer = ({ loan, open, onClose }) => {
  const [tab, setTab] = React.useState('overview');
  React.useEffect(() => { if (open) setTab('overview'); }, [open, loan && loan.id]);

  if (!loan) {
    return (
      <>
        <div className={'drawer-overlay' + (open ? ' open' : '')} onClick={onClose}/>
        <div className={'drawer' + (open ? ' open' : '')}/>
      </>
    );
  }

  const stages = (window.HOMIUM_DATA && window.HOMIUM_DATA.STAGES) || [];
  const currentStage = stages[loan.stageIdx];
  const stipsDone = loan.stips ? loan.stips.filter(s => s.status === 'received').length : 0;
  const stipsTotal = loan.stips ? loan.stips.length : 0;
  const stipsBlocked = loan.stips ? loan.stips.filter(s => s.status === 'blocked').length : 0;
  const stipsPending = loan.stips ? loan.stips.filter(s => s.status === 'pending').length : 0;

  return (
    <>
      <div className={'drawer-overlay' + (open ? ' open' : '')} onClick={onClose}/>
      <div className={'drawer' + (open ? ' open' : '')}>
        <div className="drawer-head">
          <div className="drawer-head-top">
            <div style={{minWidth: 0, flex: 1}}>
              <div className="drawer-id">{loan.id} · {loan.program ? loan.program.name : '—'}</div>
              <div className="drawer-title">{loan.borrower}</div>
              <div className="drawer-sub">
                {loan.address}, {loan.cityState}
                {loan.sla === 'red' && (
                  <span style={{
                    marginLeft: 8, padding: '2px 8px', borderRadius: 999,
                    background: '#FEE2E2', color: 'var(--h-red)',
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase'
                  }}>SLA breach · {loan.daysInStage}d</span>
                )}
                {loan.sla === 'amber' && (
                  <span style={{
                    marginLeft: 8, padding: '2px 8px', borderRadius: 999,
                    background: '#FEF3C7', color: 'var(--h-amber)',
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase'
                  }}>Approaching SLA</span>
                )}
              </div>
            </div>
            <button className="drawer-close" onClick={onClose} aria-label="Close">
              <Icon name="x" size={16}/>
            </button>
          </div>

          <div className="drawer-meta-row">
            <div className="drawer-meta">
              <div className="drawer-meta-lbl">Amount</div>
              <div className="drawer-meta-val lg">{fmt$(loan.amount)}</div>
            </div>
            <div className="drawer-meta">
              <div className="drawer-meta-lbl">Stage</div>
              <div className="drawer-meta-val">{currentStage ? currentStage.label : '—'}</div>
            </div>
            <div className="drawer-meta">
              <div className="drawer-meta-lbl">Days in stage</div>
              <div className="drawer-meta-val" style={{
                color: loan.sla === 'red' ? 'var(--h-red)' : loan.sla === 'amber' ? 'var(--h-amber)' : undefined
              }}>{loan.daysInStage}d</div>
            </div>
            <div className="drawer-meta">
              <div className="drawer-meta-lbl">Underwriter</div>
              <div className="drawer-meta-val" style={{fontSize: 12}}>
                {loan.underwriter ? loan.underwriter.name : '—'}
                <div style={{fontSize: 10, color: 'var(--h-ink-3)', fontWeight: 500}}>
                  {loan.underwriter ? loan.underwriter.org : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="drawer-stage">
            <StageProgress progress={loan.progress || []} stages={stages} showLabel/>
          </div>
        </div>

        <div className="drawer-tabs">
          <button className={'drawer-tab' + (tab === 'overview' ? ' active' : '')} onClick={() => setTab('overview')}>
            Overview
          </button>
          <button className={'drawer-tab' + (tab === 'stips' ? ' active' : '')} onClick={() => setTab('stips')}>
            Stipulations <span className="drawer-tab-count">{stipsDone}/{stipsTotal}</span>
          </button>
          <button className={'drawer-tab' + (tab === 'activity' ? ' active' : '')} onClick={() => setTab('activity')}>
            Activity
          </button>
          <button className={'drawer-tab' + (tab === 'docs' ? ' active' : '')} onClick={() => setTab('docs')}>
            Documents
          </button>
        </div>

        <div className="drawer-body">
          {tab === 'overview' && (
            <>
              {loan.aiNudge && (
                <div className="drawer-ai">
                  <div className="drawer-ai-icon">✦</div>
                  <div>
                    <div style={{fontWeight: 600, color: '#5A4314', marginBottom: 3, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em'}}>
                      Homium AI · suggested
                    </div>
                    {loan.aiNudge}
                  </div>
                </div>
              )}

              {loan.nextAction && (
                <div className="stip-section">
                  <div className="stip-section-title">Next action</div>
                  <div style={{padding: 14, background: 'var(--h-paper-warm)', borderRadius: 8, border: '1px solid var(--h-line-2)'}}>
                    <div style={{fontSize: 13, fontWeight: 600, color: 'var(--h-ink)'}}>{loan.nextAction}</div>
                    <div style={{fontSize: 11, color: 'var(--h-ink-3)', marginTop: 4}}>
                      Awaiting <b style={{color: 'var(--h-ink-2)'}}>{loan.nextActor || 'unknown'}</b>
                    </div>
                  </div>
                </div>
              )}

              <div className="stip-section">
                <div className="stip-section-title">
                  Owners <span className="stip-section-count">{(loan.owners || []).length}</span>
                </div>
                {(loan.owners || []).map((o, i) => (
                  <div key={i} className="stip-row">
                    <Avatar person={{ initials: o.initials, bg: '#0E2A47' }}/>
                    <div>
                      <div className="stip-label">{o.name}</div>
                      <div className="stip-owner">{o.org}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'stips' && (
            <>
              {stipsBlocked > 0 && (
                <div className="drawer-ai" style={{background: '#FEE2E2', borderColor: '#FCA5A5', color: 'var(--h-red)'}}>
                  <div className="drawer-ai-icon" style={{color: 'var(--h-red)'}}>!</div>
                  <div>
                    <b>{stipsBlocked} blocked</b> · {stipsPending} pending · {stipsDone} received
                  </div>
                </div>
              )}
              <div className="stip-section">
                <div className="stip-section-title">
                  Required stipulations <span className="stip-section-count">{stipsDone}/{stipsTotal}</span>
                </div>
                {(loan.stips || []).map(s => (
                  <div key={s.id} className="stip-row">
                    <div className={'stip-check' + (s.status === 'received' ? ' done' : s.status === 'blocked' ? ' blocked' : '')}>
                      {s.status === 'received' && '✓'}
                    </div>
                    <div>
                      <div className={'stip-label' + (s.status === 'received' ? ' done' : '')}>{s.label}</div>
                      <div className="stip-owner">awaiting {s.owner}</div>
                      {s.status === 'blocked' && <div className="stip-blocker">Borrower unresponsive</div>}
                    </div>
                    <span className={'stip-status-tag ' + s.status}>{s.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'activity' && (
            <div className="act-list">
              <div className="act-item">
                <div className="act-ava">
                  <Avatar person={{ initials: (loan.underwriter && loan.underwriter.name || '?').split(' ').map(s=>s[0]).join('').slice(0,2), bg: '#1E3F62' }}/>
                </div>
                <div className="act-body">
                  <div><b>{loan.underwriter ? loan.underwriter.name : 'Underwriter'}</b> reviewing — {currentStage ? currentStage.label : ''}</div>
                  <div className="act-detail">Stage entered {loan.daysInStage} day{loan.daysInStage === 1 ? '' : 's'} ago</div>
                  <div className="act-time">{loan.updatedAgo}</div>
                </div>
              </div>
              {(loan.owners || []).map((o, i) => (
                <div key={i} className="act-item">
                  <div className="act-ava"><Avatar person={{ initials: o.initials, bg: '#0E2A47' }}/></div>
                  <div className="act-body">
                    <div><b>{o.name}</b> — origination team</div>
                    <div className="act-detail">{o.org}</div>
                    <div className="act-time">since application</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'docs' && (
            <div className="doc-grid">
              {(loan.stips || []).filter(s => s.status === 'received').slice(0, 6).map(s => (
                <div key={s.id} className="doc-card">
                  <div className="doc-thumb">
                    {s.label} — uploaded by {s.owner}<br/><br/>
                    Auto-extracted by OCR. Confidence 99%.
                  </div>
                  <div className="doc-name">{s.label}</div>
                  <div className="doc-meta">
                    <span>{s.owner}</span>
                    <span className="doc-badge-ocr">OCR ✓</span>
                  </div>
                </div>
              ))}
              {(loan.stips || []).filter(s => s.status === 'received').length === 0 && (
                <div style={{gridColumn: '1 / -1', padding: 24, textAlign: 'center', color: 'var(--h-ink-3)', fontSize: 12}}>
                  No documents received yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

window.Drawer = Drawer;
