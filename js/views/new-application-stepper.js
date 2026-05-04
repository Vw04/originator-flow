/* ============================================================
   HOMIUM ORIGINATOR FLOW — New Application Stepper (Placeholder)
   Demo-only multi-step form for the welcome flow's first-app CTA
   and the coachmark tour's "submit a loan application" walkthrough.
   Submission is a no-op: closes the modal and shows a brief toast.
   The tour anchors on data-cm attributes on each step's key fields.
   ============================================================ */

const NewApplicationStepperView = {
  _step: 0,
  _data: {
    borrowerFirst: '',
    borrowerLast:  '',
    coBorrower:    '',
    address:       '',
    city:          '',
    state:         '',
    zip:           '',
    propertyType:  'Single Family',
    program:       'Multi-State Dream Fund',
    amount:        '',
    term:          '30',
  },

  STEPS: [
    { key: 'borrower', label: 'Borrower' },
    { key: 'property', label: 'Property' },
    { key: 'terms',    label: 'Loan terms' },
    { key: 'review',   label: 'Review & submit' },
  ],

  open() {
    this._step = 0;
    let host = document.getElementById('newapp-stepper-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'newapp-stepper-host';
      document.body.appendChild(host);
    }
    this._render();
  },

  close() {
    const host = document.getElementById('newapp-stepper-host');
    if (host) host.remove();
  },

  _render() {
    const host = document.getElementById('newapp-stepper-host');
    if (!host) return;
    const step = this.STEPS[this._step];
    host.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this)NewApplicationStepperView.close()">
        <div class="newapp-modal" role="dialog" aria-label="New application">
          <div class="newapp-head">
            <div class="newapp-eyebrow">New application</div>
            <div class="newapp-title">
              <span>${step.label}</span>
              <button class="modal-close" onclick="NewApplicationStepperView.close()">×</button>
            </div>
            ${this._renderSteps()}
          </div>
          <div class="newapp-body">${this._renderStepBody(step.key)}</div>
          <div class="newapp-foot">
            <button class="btn btn-ghost"
                    ${this._step === 0 ? 'disabled' : ''}
                    onclick="NewApplicationStepperView._back()">← Back</button>
            ${this._step < this.STEPS.length - 1
              ? `<button class="btn btn-primary" onclick="NewApplicationStepperView._next()">Continue →</button>`
              : `<button class="btn btn-primary" data-cm="submit" onclick="NewApplicationStepperView._submit()">Submit application →</button>`}
          </div>
        </div>
      </div>
    `;
  },

  _renderSteps() {
    return `
      <div class="newapp-steps">
        ${this.STEPS.map((s, i) => {
          const cls = i < this._step ? 'done' : i === this._step ? 'active' : '';
          return `
            <div class="newapp-step ${cls}">
              <span class="newapp-step-num">${i < this._step ? '✓' : i + 1}</span>
              <span>${s.label}</span>
            </div>
            ${i < this.STEPS.length - 1 ? '<span class="newapp-step-arrow">›</span>' : ''}
          `;
        }).join('')}
      </div>
    `;
  },

  _renderStepBody(key) {
    if (key === 'borrower') {
      return `
        <div class="newapp-fields" data-cm="field-borrower">
          <div class="newapp-grid-2">
            <div class="newapp-field">
              <label>Borrower first name</label>
              <input value="${this._data.borrowerFirst}"
                     oninput="NewApplicationStepperView._set('borrowerFirst', this.value)"
                     placeholder="Jane" />
            </div>
            <div class="newapp-field">
              <label>Borrower last name</label>
              <input value="${this._data.borrowerLast}"
                     oninput="NewApplicationStepperView._set('borrowerLast', this.value)"
                     placeholder="Smith" />
            </div>
          </div>
          <div class="newapp-field">
            <label>Co-borrower (optional)</label>
            <input value="${this._data.coBorrower}"
                   oninput="NewApplicationStepperView._set('coBorrower', this.value)"
                   placeholder="John Smith" />
          </div>
          <div style="font-size:12px;color:var(--color-text-secondary);background:var(--color-bg);padding:10px 12px;border-radius:var(--radius);margin-top:4px">
            Names must match the IDs on file. Mismatches block downstream KYC re-checks at our underwriting partner.
          </div>
        </div>
      `;
    }

    if (key === 'property') {
      return `
        <div class="newapp-fields" data-cm="field-property">
          <div class="newapp-field">
            <label>Property address</label>
            <input value="${this._data.address}"
                   oninput="NewApplicationStepperView._set('address', this.value)"
                   placeholder="123 Main St" />
          </div>
          <div class="newapp-grid-2">
            <div class="newapp-field">
              <label>City</label>
              <input value="${this._data.city}"
                     oninput="NewApplicationStepperView._set('city', this.value)"
                     placeholder="Lexington" />
            </div>
            <div class="newapp-field">
              <label>State</label>
              <input value="${this._data.state}"
                     oninput="NewApplicationStepperView._set('state', this.value)"
                     placeholder="KY" maxlength="2" />
            </div>
          </div>
          <div class="newapp-grid-2">
            <div class="newapp-field">
              <label>ZIP</label>
              <input value="${this._data.zip}"
                     oninput="NewApplicationStepperView._set('zip', this.value)"
                     placeholder="40502" />
            </div>
            <div class="newapp-field">
              <label>Property type</label>
              <select onchange="NewApplicationStepperView._set('propertyType', this.value)">
                <option ${this._data.propertyType === 'Single Family' ? 'selected' : ''}>Single Family</option>
                <option ${this._data.propertyType === 'Townhouse' ? 'selected' : ''}>Townhouse</option>
                <option ${this._data.propertyType === 'Condo' ? 'selected' : ''}>Condo</option>
                <option ${this._data.propertyType === '2-4 Unit' ? 'selected' : ''}>2-4 Unit</option>
              </select>
            </div>
          </div>
        </div>
      `;
    }

    if (key === 'terms') {
      const programs = State.getLoanPrograms ? State.getLoanPrograms() : [];
      return `
        <div class="newapp-fields" data-cm="field-terms">
          <div class="newapp-field">
            <label>Program</label>
            <select onchange="NewApplicationStepperView._set('program', this.value)">
              ${programs.length
                ? programs.map(p => `<option ${this._data.program === p.name ? 'selected' : ''}>${p.name}</option>`).join('')
                : `<option>Multi-State Dream Fund</option>`}
            </select>
          </div>
          <div class="newapp-grid-2">
            <div class="newapp-field">
              <label>Loan amount</label>
              <input type="number" value="${this._data.amount}"
                     oninput="NewApplicationStepperView._set('amount', this.value)"
                     placeholder="350000" />
            </div>
            <div class="newapp-field">
              <label>Term (years)</label>
              <select onchange="NewApplicationStepperView._set('term', this.value)">
                ${['15','20','30'].map(t => `<option ${this._data.term === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      `;
    }

    // review
    const d = this._data;
    const nice = (v) => v && v.length ? v : '<span style="color:var(--color-text-muted)">—</span>';
    return `
      <div class="newapp-review">
        <div><b>Borrower:</b> ${nice([d.borrowerFirst, d.borrowerLast].filter(Boolean).join(' '))}</div>
        ${d.coBorrower ? `<div><b>Co-borrower:</b> ${d.coBorrower}</div>` : ''}
        <div><b>Property:</b> ${nice([d.address, d.city, d.state, d.zip].filter(Boolean).join(', '))}</div>
        <div><b>Type:</b> ${nice(d.propertyType)}</div>
        <div><b>Program:</b> ${nice(d.program)}</div>
        <div><b>Amount:</b> ${d.amount ? '$' + Number(d.amount).toLocaleString() : '—'}</div>
        <div><b>Term:</b> ${nice(d.term)} years</div>
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--color-border-light);color:var(--color-text-secondary);font-size:12px;line-height:1.5">
          On submit, this application is flagged to our underwriting team for review.
          You'll receive notifications as it advances — or if our team places a note
          requesting more from you or your borrower.
        </div>
      </div>
    `;
  },

  _set(key, value) { this._data[key] = value; },

  _next() {
    if (this._step < this.STEPS.length - 1) {
      this._step += 1;
      this._render();
    }
  },
  _back() {
    if (this._step > 0) {
      this._step -= 1;
      this._render();
    }
  },

  _submit() {
    this._toast('Application submitted — flagged to underwriting for review.');
    this.close();
  },

  _toast(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: 'var(--color-primary)',
      color: '#fff',
      padding: '12px 18px',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-lg)',
      fontSize: '13px',
      zIndex: '9500',
      maxWidth: '320px',
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  },
};

window.NewApplicationStepperView = NewApplicationStepperView;
