/* Shared primitives used by all artboards.
   Exposes: fmt$, fmt$k, Avatar, AvatarStack, Icon, StageProgress, StageSegments. */

const fmt$ = (n) => '$' + Math.round(n).toLocaleString('en-US');
const fmt$k = (n) => {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return '$' + Math.round(n / 1_000) + 'k';
  return '$' + n;
};

const Avatar = ({ person, size = 'md', live = false, style = {} }) => {
  if (!person) return null;
  const cls = 'ava' + (size === 'lg' ? ' ava-lg' : '') + (live ? ' ava-live' : '');
  return (
    <span className={cls} style={{ background: person.bg || '#0E2A47', position: 'relative', ...style }}>
      {person.initials || (person.name || '?').split(' ').map(s => s[0]).slice(0, 2).join('')}
    </span>
  );
};

const AvatarStack = ({ people = [], live = [], size = 'md' }) => (
  <span className="ava-stack">
    {people.map((p, i) => (
      <Avatar key={i} person={p} size={size} live={live.includes((p && p.initials) || '')} />
    ))}
  </span>
);

/* Inline-SVG icon set sized by font-size. Strokes inherit `currentColor`. */
const Icon = ({ name, size = 16, style = {}, className = '' }) => {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    style, className,
  };
  switch (name) {
    case 'chevR':    return <svg {...common}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevD':    return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case 'chevL':    return <svg {...common}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'search':   return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case 'home':     return <svg {...common}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
    case 'list':     return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case 'doc':      return <svg {...common}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>;
    case 'activity': return <svg {...common}><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>;
    case 'pie':      return <svg {...common}><path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M21 12A9 9 0 0 0 12 3v9z"/></svg>;
    case 'users':    return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'archive':  return <svg {...common}><rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>;
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'plus':     return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'x':        return <svg {...common}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case 'filter':   return <svg {...common}><path d="M3 4h18l-7 9v6l-4 2v-8z"/></svg>;
    case 'bell':     return <svg {...common}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>;
    case 'inbox':    return <svg {...common}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/></svg>;
    case 'check':    return <svg {...common}><path d="M5 12l5 5L20 7"/></svg>;
    default:         return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
};

/* StageProgress — dots + connectors, used by Institutional + Investor pipeline tables.
   `progress` is a 7-cell array of 'done' | 'current' | 'blocked' | ''.  */
const StageProgress = ({ progress = [], stages = [], showLabel = false }) => {
  const currentIdx = progress.findIndex(p => p === 'current' || p === 'blocked');
  const label = currentIdx >= 0 && stages[currentIdx] ? stages[currentIdx].short : '';
  return (
    <div>
      <div className="stage-progress">
        {progress.map((s, i) => (
          <React.Fragment key={i}>
            <span className={'stage-dot' + (s ? ' ' + s : '')}/>
            {i < progress.length - 1 && (
              <span className={'stage-connector ' + (s === 'done' ? 'done' : 'todo')}/>
            )}
          </React.Fragment>
        ))}
      </div>
      {showLabel && label && <div className="stage-label">{label}</div>}
    </div>
  );
};

/* StageSegments — compact horizontal bar, used by Terminal table + Mission rail. */
const StageSegments = ({ progress = [] }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {progress.map((s, i) => (
      <div
        key={i}
        className={'term-stage-seg' + (s ? ' ' + s : '')}
        style={{
          flex: 1, height: 4, borderRadius: 1,
          background: s === 'done' ? '#34D399'
                    : s === 'current' ? '#FBBF24'
                    : s === 'blocked' ? '#F87171'
                    : 'rgba(255,255,255,0.1)',
        }}
      />
    ))}
  </div>
);

window.fmt$ = fmt$;
window.fmt$k = fmt$k;
window.Avatar = Avatar;
window.AvatarStack = AvatarStack;
window.Icon = Icon;
window.StageProgress = StageProgress;
window.StageSegments = StageSegments;
