import { useState, useMemo } from "react";

// Contrast ratio calculation
function luminance(hex) {
  const rgb = hex.replace('#','').match(/.{2}/g).map(c => {
    let v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

function wcagGrade(ratio) {
  if (ratio >= 7) return { grade: 'AAA', color: '#14935F' };
  if (ratio >= 4.5) return { grade: 'AA', color: '#14935F' };
  if (ratio >= 3) return { grade: 'AA Large', color: '#C4850C' };
  return { grade: 'Fail', color: '#C4382A' };
}

function Swatch({ hex, name, sub, size = 'md', textColor }) {
  const auto = luminance(hex) > 0.4 ? '#061D29' : '#FFFFFF';
  const fg = textColor || auto;
  const h = size === 'lg' ? 100 : size === 'sm' ? 56 : 72;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        backgroundColor: hex,
        height: h,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'flex-end',
        padding: '8px 12px',
        border: `1px solid rgba(0,0,0,0.08)`,
        minWidth: size === 'sm' ? 80 : 110,
      }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: fg, opacity: 0.9 }}>{hex}</span>
      </div>
      {name && <span style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: '#061D29', fontFamily: "'DM Sans', sans-serif" }}>{name}</span>}
      {sub && <span style={{ fontSize: 11, color: '#6B7280', fontFamily: "'DM Sans', sans-serif" }}>{sub}</span>}
    </div>
  );
}

function ContrastPill({ fg, bg }) {
  const ratio = contrastRatio(fg, bg);
  const { grade, color } = wcagGrade(ratio);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20,
      backgroundColor: `${color}14`, border: `1px solid ${color}30`,
      fontSize: 11, fontFamily: "'DM Mono', monospace",
    }}>
      <span style={{ color: '#061D29' }}>{ratio}:1</span>
      <span style={{ fontWeight: 700, color }}>{grade}</span>
    </div>
  );
}

function Section({ title, children, description }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h3 style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: 20,
        color: '#00334A',
        marginBottom: description ? 6 : 16,
        fontWeight: 400,
      }}>{title}</h3>
      {description && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif", maxWidth: 680 }}>{description}</p>}
      {children}
    </div>
  );
}

function SwatchRow({ children }) {
  return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{children}</div>;
}

function PaletteAudit({ colors, label }) {
  return (
    <div style={{ padding: 20, backgroundColor: '#FAFAFA', borderRadius: 10, border: '1px solid #E0DDD6', marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#00334A', marginBottom: 12, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <SwatchRow>
        {colors.map((c, i) => <Swatch key={i} hex={c.hex} name={c.name} sub={c.role} size="sm" />)}
      </SwatchRow>
    </div>
  );
}

function DataVizPreview({ colors, bg = '#FFFFFF' }) {
  const barData = [85, 62, 48, 72, 38, 55];
  return (
    <div style={{ backgroundColor: bg, borderRadius: 10, padding: 20, border: '1px solid rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: 11, color: luminance(bg) > 0.4 ? '#6B7280' : '#A0A8B4', fontFamily: "'DM Sans', sans-serif", marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample Chart</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {barData.map((h, i) => (
          <div key={i} style={{
            flex: 1,
            height: `${h}%`,
            backgroundColor: colors[i % colors.length],
            borderRadius: 4,
            transition: 'height 0.3s ease',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
        {colors.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: c }} />
            <span style={{ fontSize: 10, color: luminance(bg) > 0.4 ? '#6B7280' : '#A0A8B4', fontFamily: "'DM Mono', monospace" }}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ButtonPreview({ label, bg, fg, border }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '10px 24px', borderRadius: 6,
      backgroundColor: bg, color: fg,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 13, fontWeight: 600,
      border: border || 'none',
      cursor: 'pointer',
    }}>{label}</div>
  );
}

function MockCard({ mode }) {
  const isDark = mode === 'dark';
  const bg = isDark ? '#0A1F2E' : '#FAFAFA';
  const surface = isDark ? '#122A3A' : '#FFFFFF';
  const border = isDark ? '#1A3A4D' : '#E0DDD6';
  const textPrimary = isDark ? '#E8E4DF' : '#061D29';
  const textSecondary = isDark ? '#8A9BAA' : '#6B7280';
  const green = '#14935F';
  
  return (
    <div style={{
      backgroundColor: bg, borderRadius: 12, padding: 24,
      border: `1px solid ${border}`, minWidth: 280,
    }}>
      <div style={{ fontSize: 11, color: textSecondary, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 16 }}>
        {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </div>
      <div style={{
        backgroundColor: surface, borderRadius: 8, padding: 16,
        border: `1px solid ${border}`, marginBottom: 12,
      }}>
        <div style={{ fontSize: 12, color: textSecondary, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Total Loan Value</div>
        <div style={{ fontSize: 24, fontFamily: "'DM Serif Display', Georgia, serif", color: isDark ? '#FFFFFF' : '#00334A', fontWeight: 400 }}>$1,820,000</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: green, fontWeight: 600 }}>↑ 12.4%</span>
          <span style={{ fontSize: 11, color: textSecondary }}>vs last quarter</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <ButtonPreview label="View Pool" bg={green} fg="#FFFFFF" />
        <ButtonPreview label="Export" bg="transparent" fg={isDark ? '#E8E4DF' : '#00334A'} border={`1px solid ${border}`} />
      </div>
    </div>
  );
}

function SemanticRow({ name, hex, usage, bg = '#FFFFFF' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #F0EDE8' }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: hex, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#061D29', fontFamily: "'DM Sans', sans-serif" }}>{name}</div>
        <div style={{ fontSize: 11, color: '#6B7280', fontFamily: "'DM Sans', sans-serif" }}>{usage}</div>
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6B7280' }}>{hex}</div>
      <ContrastPill fg={hex} bg={bg} />
    </div>
  );
}

function PillPreview({ label, bg, fg }) {
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 10px', borderRadius: 12,
      backgroundColor: bg, color: fg,
      fontSize: 11, fontWeight: 600,
      fontFamily: "'DM Sans', sans-serif",
    }}>{label}</span>
  );
}

export default function HomiumPaletteSystem() {
  const [activeTab, setActiveTab] = useState('audit');
  
  const tabs = [
    { id: 'audit', label: 'Audit' },
    { id: 'website', label: 'Website Palette' },
    { id: 'system', label: 'Design System' },
    { id: 'semantic', label: 'Semantic Colors' },
    { id: 'dataviz', label: 'Data Visualization' },
    { id: 'darkmode', label: 'Dark Mode' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: '#F2F1EC', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <div style={{ backgroundColor: '#00334A', padding: '32px 32px 0', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 400, margin: 0 }}>Homium</h1>
          <span style={{ fontSize: 13, opacity: 0.6 }}>Brand Palette System</span>
        </div>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 24, maxWidth: 600, lineHeight: 1.5 }}>
          Color analysis, unified palette, and design system extension for a best-in-class fintech platform.
        </p>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, overflow: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 20px',
              backgroundColor: activeTab === t.id ? '#F2F1EC' : 'transparent',
              color: activeTab === t.id ? '#00334A' : 'rgba(255,255,255,0.6)',
              border: 'none',
              borderRadius: activeTab === t.id ? '8px 8px 0 0' : 0,
              fontSize: 13,
              fontWeight: activeTab === t.id ? 600 : 400,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 32px 64px', maxWidth: 900 }}>

        {/* AUDIT TAB */}
        {activeTab === 'audit' && (
          <>
            <Section title="Current State: Three Palettes, Three Personalities" description="Homium currently has three distinct color languages across its touchpoints. This fragmentation dilutes brand recognition and creates cognitive dissonance for users moving between the website and platform.">
              <PaletteAudit label="Palette 1 — Website (Institutional / Mission-Driven)" colors={[
                { hex: '#00334A', name: 'Teal', role: 'Primary brand' },
                { hex: '#061D29', name: 'Midnight', role: 'Text' },
                { hex: '#14935F', name: 'Green', role: 'Accent / CTA' },
                { hex: '#D9E0E4', name: 'Mist', role: 'Background' },
                { hex: '#FFFFFF', name: 'White', role: 'Surface' },
              ]} />
              <PaletteAudit label="Palette 2 — Original Platform (Data / Trading)" colors={[
                { hex: '#1E2939', name: 'Slate', role: 'Primary' },
                { hex: '#E5A744', name: 'Gold', role: 'Accent ★ Killing' },
                { hex: '#F2F3F6', name: 'Gray', role: 'Background' },
                { hex: '#FFFFFF', name: 'White', role: 'Surface' },
              ]} />
              <PaletteAudit label="Palette 3 — New Platform (Premium / Purpose-Driven)" colors={[
                { hex: '#00324A', name: 'Teal', role: 'Primary brand' },
                { hex: '#1A1A18', name: 'Charcoal', role: 'Text' },
                { hex: '#1D3D2A', name: 'Forest', role: 'Accent ★ Main' },
                { hex: '#E0DDD6', name: 'Stone', role: 'Borders' },
                { hex: '#F2F1EC', name: 'Sand', role: 'Background' },
                { hex: '#FFFFFF', name: 'White', role: 'Surface' },
              ]} />
            </Section>

            <Section title="Key Findings">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { title: '🔴 The Green Ambiguity Problem', body: 'Using #14935F as both primary CTA and success indicator creates a UX conflict. In financial platforms, green universally means "positive/gain." If your main button is also green, users lose that semantic signal. Recommendation: keep green as CTA but shift success to a distinct lighter green, or make the CTA teal-driven.' },
                  { title: '🟡 Card vs Background Separation', body: '#FAFAFA cards on #F2F1EC background: contrast ratio is only 1.07:1. These are nearly identical. Cards will feel invisible. Recommendation: use #FFFFFF for cards, #F2F1EC for page background — gives you 1.14:1 which is still subtle but with the border (#E0DDD6) creates enough definition.' },
                  { title: '🟢 Typography Pairing is Strong', body: 'Georgia (headings) + Inter (body) — this works. Georgia signals permanence and trust, appropriate for a 30-year financial product. Inter is highly legible at small sizes for data-dense screens. However, for the design system I\'d recommend upgrading Inter to DM Sans for slightly more personality while maintaining legibility.' },
                  { title: '🟢 Warm Neutrals Are Differentiated', body: 'The sand/stone palette (#F2F1EC, #E0DDD6) is your strongest differentiator. Most fintechs default to cold grays (#F5F5F5, #E5E7EB). Your warm undertone signals humanity and approachability — critical for a housing product — while still reading as professional.' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: 16, backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E0DDD6' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#00334A', marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>{item.body}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Contrast Audit — Your Proposed Palette">
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20, border: '1px solid #E0DDD6' }}>
                {[
                  { label: 'Teal #00334A on Sand #F2F1EC', fg: '#00334A', bg: '#F2F1EC' },
                  { label: 'Midnight #061D29 on Sand #F2F1EC', fg: '#061D29', bg: '#F2F1EC' },
                  { label: 'Midnight #061D29 on White #FFFFFF', fg: '#061D29', bg: '#FFFFFF' },
                  { label: 'Green #14935F on White #FFFFFF', fg: '#14935F', bg: '#FFFFFF' },
                  { label: 'Green #14935F on Sand #F2F1EC', fg: '#14935F', bg: '#F2F1EC' },
                  { label: 'White #FFFFFF on Green #14935F', fg: '#FFFFFF', bg: '#14935F' },
                  { label: 'White #FFFFFF on Teal #00334A', fg: '#FFFFFF', bg: '#00334A' },
                ].map((test, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 6 ? '1px solid #F0EDE8' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: test.fg, border: '1px solid rgba(0,0,0,0.1)' }} />
                      <span style={{ fontSize: 12, color: test.fg, backgroundColor: test.bg, padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>Aa</span>
                      <span style={{ fontSize: 12, color: '#4A5568' }}>{test.label}</span>
                    </div>
                    <ContrastPill fg={test.fg} bg={test.bg} />
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* WEBSITE TAB */}
        {activeTab === 'website' && (
          <>
            <Section title="Version 1 — Website & Marketing Palette" description="A restrained, high-trust palette for homium.io and all outward-facing materials. Five colors maximum. No ambiguity.">
              <SwatchRow>
                <Swatch hex="#00334A" name="Teal" sub="Logo, headings, nav" size="lg" />
                <Swatch hex="#061D29" name="Midnight" sub="Body text" size="lg" />
                <Swatch hex="#14935F" name="Green" sub="CTA, links, accents" size="lg" />
                <Swatch hex="#F2F1EC" name="Sand" sub="Page background" size="lg" />
                <Swatch hex="#FFFFFF" name="White" sub="Card surfaces" size="lg" />
                <Swatch hex="#E0DDD6" name="Stone" sub="Dividers, borders" size="lg" />
              </SwatchRow>
            </Section>

            <Section title="Typography System">
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: 24, border: '1px solid #E0DDD6' }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>Headings — Georgia</div>
                  <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 36, color: '#00334A', lineHeight: 1.2, fontWeight: 400 }}>Fair and Transparent Home Finance for the 21st Century.</div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>Body — Inter / DM Sans</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#061D29', lineHeight: 1.7 }}>Homium bridges the homeownership affordability gap through shared appreciation financing that requires no monthly payments or interest, making homeownership more affordable and sustainable.</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>CTA Buttons</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <ButtonPreview label="Sponsor a Program" bg="#14935F" fg="#FFFFFF" />
                    <ButtonPreview label="Learn More" bg="transparent" fg="#00334A" border="1.5px solid #00334A" />
                    <ButtonPreview label="Contact Us" bg="#00334A" fg="#FFFFFF" />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Website Usage Rules">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { do: true, text: 'Use Sand (#F2F1EC) as the default page background to differentiate from cold fintech whites' },
                  { do: true, text: 'Use White (#FFFFFF) only for cards and elevated surfaces to create depth' },
                  { do: true, text: 'Green (#14935F) reserved exclusively for primary actions and links' },
                  { do: false, text: 'Don\'t use green for decorative elements, illustrations, or backgrounds' },
                  { do: true, text: 'Teal (#00334A) for all headings and the logo — creates a strong consistent anchor' },
                  { do: false, text: 'Don\'t mix Teal and Midnight for headings — pick one per context and stay consistent' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: 14, backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E0DDD6', display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{item.do ? '✓' : '✗'}</span>
                    <span style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* DESIGN SYSTEM TAB */}
        {activeTab === 'system' && (
          <>
            <Section title="Version 2 — Platform Design System" description="The full extended palette for the Homium platform. Covers all interactive states, component variants, and data-dense interfaces. Built for institutional users who spend hours in the product.">
              
              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginBottom: 12 }}>Core Palette</div>
              <SwatchRow>
                <Swatch hex="#00334A" name="Teal 900" sub="Brand anchor" />
                <Swatch hex="#0A4D6B" name="Teal 700" sub="Hover states" />
                <Swatch hex="#1A6E8E" name="Teal 500" sub="Active / Focus" />
                <Swatch hex="#A3C5D4" name="Teal 200" sub="Subtle fills" />
                <Swatch hex="#E0EDF3" name="Teal 50" sub="Tinted backgrounds" />
              </SwatchRow>

              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginTop: 24, marginBottom: 12 }}>Primary Action (Green)</div>
              <SwatchRow>
                <Swatch hex="#0D6B40" name="Green 900" sub="Pressed" />
                <Swatch hex="#117A4A" name="Green 700" sub="Hover" />
                <Swatch hex="#14935F" name="Green 500" sub="Default CTA" />
                <Swatch hex="#A8D7BE" name="Green 200" sub="Subtle fills" />
                <Swatch hex="#E4F3EB" name="Green 50" sub="Pill backgrounds" />
              </SwatchRow>

              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginTop: 24, marginBottom: 12 }}>Neutrals (Warm)</div>
              <SwatchRow>
                <Swatch hex="#061D29" name="Midnight" sub="Primary text" />
                <Swatch hex="#2D3E4A" name="Slate" sub="Secondary text" />
                <Swatch hex="#6B7A85" name="Gray 500" sub="Muted / Captions" />
                <Swatch hex="#9BA6AE" name="Gray 300" sub="Placeholders" />
                <Swatch hex="#C4C9CC" name="Gray 200" sub="Disabled text" />
              </SwatchRow>
              <div style={{ marginTop: 8 }} />
              <SwatchRow>
                <Swatch hex="#E0DDD6" name="Stone" sub="Borders, dividers" />
                <Swatch hex="#EDEBE6" name="Warm Gray" sub="Subtle borders" />
                <Swatch hex="#F2F1EC" name="Sand" sub="Page background" />
                <Swatch hex="#F8F7F4" name="Pearl" sub="Alt surface" />
                <Swatch hex="#FFFFFF" name="White" sub="Card surface" />
              </SwatchRow>

              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginTop: 24, marginBottom: 12 }}>Component Previews</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <ButtonPreview label="Primary Action" bg="#14935F" fg="#FFFFFF" />
                <ButtonPreview label="Secondary" bg="#00334A" fg="#FFFFFF" />
                <ButtonPreview label="Tertiary" bg="transparent" fg="#00334A" border="1.5px solid #E0DDD6" />
                <ButtonPreview label="Ghost" bg="transparent" fg="#14935F" />
                <ButtonPreview label="Destructive" bg="#C4382A" fg="#FFFFFF" />
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <PillPreview label="Active" bg="#E4F3EB" fg="#0D6B40" />
                <PillPreview label="Pending" bg="#FEF3E2" fg="#8B5E0F" />
                <PillPreview label="KYC Required" bg="#E0EDF3" fg="#00334A" />
                <PillPreview label="Suspended" bg="#FDE8E6" fg="#9B2C1E" />
                <PillPreview label="Invited" bg="#F2F1EC" fg="#6B7A85" />
                <PillPreview label="Origination" bg="#00334A" fg="#FFFFFF" />
                <PillPreview label="Investor" bg="#1A6E8E" fg="#FFFFFF" />
              </div>
            </Section>
          </>
        )}

        {/* SEMANTIC TAB */}
        {activeTab === 'semantic' && (
          <>
            <Section title="Semantic Color System" description="Critical for financial platforms. These colors carry universal meaning and must be distinct from the brand palette. Notice: Success green is intentionally different from the CTA green to avoid confusion.">
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20, border: '1px solid #E0DDD6' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Semantic Colors — Light Mode</div>
                <SemanticRow name="Success" hex="#1A8754" usage="Positive values, confirmations, gains, loan funded" />
                <SemanticRow name="Success Background" hex="#E4F3EB" usage="Success banners, positive pill fills" />
                <SemanticRow name="Warning" hex="#B8860B" usage="Attention needed, pending review, approaching limits" />
                <SemanticRow name="Warning Background" hex="#FEF3E2" usage="Warning banners, alert pill fills" />
                <SemanticRow name="Error" hex="#C4382A" usage="Failed, rejected, overdue, negative values" />
                <SemanticRow name="Error Background" hex="#FDE8E6" usage="Error banners, destructive pill fills" />
                <SemanticRow name="Info" hex="#1A6E8E" usage="Neutral information, tooltips, onboarding" />
                <SemanticRow name="Info Background" hex="#E0EDF3" usage="Info banners, help pill fills" />
              </div>

              <div style={{ marginTop: 16, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E0DDD6' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#00334A', marginBottom: 8 }}>Why Success ≠ CTA</div>
                <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6 }}>
                  <strong>CTA Green (#14935F)</strong> says "click me, take action." <strong>Success Green (#1A8754)</strong> says "this went well, positive outcome." They look similar at first glance — that's intentional, they're in the same family — but Success is slightly warmer and deeper. In practice, they never appear in the same context: CTAs are interactive elements (buttons, links), while Success appears on status indicators (pills, banners, value changes). The distinction is semantic, not just visual.
                </div>
              </div>

              <div style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: '#00334A', marginBottom: 12 }}>Financial-Specific Semantic Colors</div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20, border: '1px solid #E0DDD6' }}>
                <SemanticRow name="Appreciation / Gain" hex="#1A8754" usage="Home value increase, positive returns, portfolio gains" />
                <SemanticRow name="Depreciation / Loss" hex="#C4382A" usage="Home value decrease, negative returns" />
                <SemanticRow name="Neutral Change" hex="#6B7A85" usage="No change, flat performance" />
                <SemanticRow name="LTV Safe" hex="#1A8754" usage="Loan-to-value within safe range" />
                <SemanticRow name="LTV Caution" hex="#B8860B" usage="Approaching LTV threshold" />
                <SemanticRow name="LTV Critical" hex="#C4382A" usage="Exceeds target LTV" />
              </div>
            </Section>
          </>
        )}

        {/* DATA VIZ TAB */}
        {activeTab === 'dataviz' && (
          <>
            <Section title="Data Visualization Palette" description="Two chromatic sequences designed for Homium's data-heavy interfaces — choropleth maps, bar charts, line charts, area charts, and donut charts. Built to be distinguishable by colorblind users and harmonious with the brand.">
              
              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginBottom: 12 }}>Sequential Palette — Teal Ramp (for maps, heatmaps, single-metric)</div>
              <SwatchRow>
                {['#E0EDF3', '#B0D4E3', '#6AADC6', '#3088A8', '#0A4D6B', '#00334A'].map((c, i) => (
                  <Swatch key={i} hex={c} size="sm" />
                ))}
              </SwatchRow>
              <div style={{ marginTop: 12 }}>
                <DataVizPreview colors={['#E0EDF3', '#B0D4E3', '#6AADC6', '#3088A8', '#0A4D6B', '#00334A']} />
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginTop: 32, marginBottom: 12 }}>Categorical Palette — 6 Colors (for comparing categories)</div>
              <SwatchRow>
                {['#00334A', '#14935F', '#1A6E8E', '#7B5EA7', '#C4850C', '#2D8B9E'].map((c, i) => (
                  <Swatch key={i} hex={c} size="sm" />
                ))}
              </SwatchRow>
              <div style={{ marginTop: 12 }}>
                <DataVizPreview colors={['#00334A', '#14935F', '#1A6E8E', '#7B5EA7', '#C4850C', '#2D8B9E']} />
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginTop: 32, marginBottom: 12 }}>Diverging Palette — Red ↔ Green (for gain/loss, appreciation/depreciation)</div>
              <SwatchRow>
                {['#C4382A', '#E07B6F', '#F2C4BE', '#F2F1EC', '#A8D7BE', '#4AAD7F', '#1A8754'].map((c, i) => (
                  <Swatch key={i} hex={c} size="sm" />
                ))}
              </SwatchRow>

              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginTop: 32, marginBottom: 12 }}>Extended Categorical — 10 Colors (for complex charts)</div>
              <SwatchRow>
                {['#00334A', '#14935F', '#1A6E8E', '#7B5EA7', '#C4850C', '#2D8B9E', '#8B5E3C', '#5B7F5E', '#A15C6B', '#4A6E8B'].map((c, i) => (
                  <Swatch key={i} hex={c} size="sm" />
                ))}
              </SwatchRow>

              <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 14, backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E0DDD6' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#00334A', marginBottom: 6 }}>Usage: Loan by Location Map</div>
                  <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5 }}>Use the <strong>Sequential Teal Ramp</strong> for choropleth maps showing loan density or total value by state. Lightest = lowest, darkest = highest.</div>
                </div>
                <div style={{ padding: 14, backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E0DDD6' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#00334A', marginBottom: 6 }}>Usage: FICO / LTV / Income Bars</div>
                  <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5 }}>Use <strong>one brand color</strong> (#00334A or #14935F) for single-variable bar charts. Reserve categorical palette for multi-series comparisons.</div>
                </div>
                <div style={{ padding: 14, backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E0DDD6' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#00334A', marginBottom: 6 }}>Usage: Home Price Appreciation</div>
                  <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5 }}>Use the <strong>Diverging palette</strong> for change metrics. Center on neutral sand. Green = appreciation, Red = depreciation. Never mix with CTA green.</div>
                </div>
                <div style={{ padding: 14, backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E0DDD6' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#00334A', marginBottom: 6 }}>Usage: Portfolio Composition</div>
                  <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5 }}>Use <strong>Categorical 6</strong> for pie/donut charts showing loan breakdown by state, vintage, or program. Keep teal (#00334A) as the first color always.</div>
                </div>
              </div>
            </Section>

            <Section title="Dark Background Variants" description="For dark-mode charts and data visualizations. Same hues, adjusted for contrast on dark surfaces.">
              <DataVizPreview colors={['#4EC9A0', '#6AADC6', '#A78BCA', '#E5A744', '#E07B6F', '#5BC4D6']} bg="#0A1F2E" />
            </Section>
          </>
        )}

        {/* DARK MODE TAB */}
        {activeTab === 'darkmode' && (
          <>
            <Section title="Dark Mode System" description="Dark mode for the Homium platform. The warm undertone from the light palette carries over — backgrounds are teal-tinted (not pure gray-black) to maintain brand coherence. This is essential for users who work in the platform for extended sessions.">
              
              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginBottom: 12 }}>Dark Surfaces</div>
              <SwatchRow>
                <Swatch hex="#071620" name="Background" sub="Page base" size="lg" />
                <Swatch hex="#0A1F2E" name="Surface 1" sub="Cards, panels" size="lg" />
                <Swatch hex="#122A3A" name="Surface 2" sub="Elevated cards" size="lg" />
                <Swatch hex="#1A3A4D" name="Border" sub="Dividers, outlines" size="lg" />
                <Swatch hex="#234A5E" name="Hover" sub="Interactive hover" size="lg" />
              </SwatchRow>

              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginTop: 24, marginBottom: 12 }}>Dark Mode Text</div>
              <SwatchRow>
                <Swatch hex="#FFFFFF" name="Primary" sub="Headings" size="sm" />
                <Swatch hex="#E8E4DF" name="Secondary" sub="Body text" size="sm" />
                <Swatch hex="#8A9BAA" name="Muted" sub="Captions, labels" size="sm" />
                <Swatch hex="#5A6E7D" name="Disabled" sub="Inactive text" size="sm" />
              </SwatchRow>

              <div style={{ fontSize: 14, fontWeight: 600, color: '#00334A', marginTop: 24, marginBottom: 12 }}>Dark Mode Accent Colors</div>
              <SwatchRow>
                <Swatch hex="#1EAA6E" name="Green CTA" sub="Brighter for dark" size="sm" />
                <Swatch hex="#22B878" name="Success" sub="Positive indicators" size="sm" />
                <Swatch hex="#E07B6F" name="Error" sub="Softened red" size="sm" />
                <Swatch hex="#DBA64A" name="Warning" sub="Softened amber" size="sm" />
                <Swatch hex="#5AAFCC" name="Info" sub="Brightened teal" size="sm" />
              </SwatchRow>

              <div style={{ marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <MockCard mode="light" />
                <MockCard mode="dark" />
              </div>

              <div style={{ marginTop: 24, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E0DDD6' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#00334A', marginBottom: 8 }}>Dark Mode Rules</div>
                <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.8 }}>
                  <strong>1.</strong> Never use pure black (#000000) — always teal-tinted darks to keep warmth.<br/>
                  <strong>2.</strong> Accent colors shift ~10-15% brighter to maintain contrast on dark surfaces.<br/>
                  <strong>3.</strong> Green CTA shifts from #14935F → #1EAA6E for accessibility (4.5:1 on dark surface).<br/>
                  <strong>4.</strong> Borders shift from warm stone to cool teal-gray to avoid muddy appearance.<br/>
                  <strong>5.</strong> Text uses warm white (#E8E4DF) for body, not pure white, to reduce glare.<br/>
                  <strong>6.</strong> Data viz colors are individually adjusted — never auto-invert the light palette.
                </div>
              </div>
            </Section>
          </>
        )}

      </div>
    </div>
  );
}
