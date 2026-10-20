/*
 * Irrigation Schedule - visual harmonization layer, v1.0
 * Keeps the original HACS schedule card and its editing/save logic intact.
 * Register as a JavaScript module resource AFTER the original HACS resource.
 */
(() => {
  const tagName = 'smart-water-controller-schedule-card';
  const marker = 'irrigation-schedule-visual-style';
  const css = `
    :host { display: block; --irrigation-accent: var(--success-color, #43a047); }
    ha-card {
      overflow: hidden;
      border-radius: 18px !important;
      background: var(--ha-card-background, var(--card-background-color)) !important;
      box-shadow: var(--ha-card-box-shadow, none);
    }
    .wrapper { padding: 13px !important; }
    .card-header { margin-bottom: 12px !important; }
    .card-header-title { font-size: 16px !important; font-weight: 650 !important; }
    .month-header {
      grid-template-columns: 38px minmax(0,1fr) 38px !important;
      gap: 8px !important;
      margin-bottom: 12px !important;
    }
    .icon-button {
      width: 38px !important; height: 38px !important;
      border: 0 !important; border-radius: 11px !important;
      background: var(--secondary-background-color, rgba(128,128,128,.09)) !important;
    }
    .icon-button:hover { background: color-mix(in srgb, var(--irrigation-accent) 15%, transparent) !important; }
    .month-select {
      height: 40px !important;
      border: 0 !important;
      border-radius: 11px !important;
      background: var(--secondary-background-color, rgba(128,128,128,.09)) !important;
      font-size: 14px !important;
      font-weight: 650 !important;
    }
    .section {
      padding: 13px !important;
      border: 0 !important;
      border-radius: 12px !important;
      background: var(--secondary-background-color, rgba(128,128,128,.09)) !important;
    }
    .section + .section { margin-top: 9px !important; }
    .section-title { font-size: 13px !important; font-weight: 650 !important; margin: 0 0 3px !important; }
    .section-description {
      font-size: 11px !important;
      line-height: 1.35 !important;
      margin: 0 0 11px !important;
    }
    .field, .time-field {
      min-height: 39px !important;
      padding: 8px 10px !important;
      border: 1px solid var(--divider-color, rgba(128,128,128,.16)) !important;
      border-radius: 10px !important;
      background: var(--ha-card-background, var(--card-background-color)) !important;
      font-size: 13px !important;
      font-variant-numeric: tabular-nums;
    }
    .field:focus, .time-field:focus, .month-select:focus {
      outline: 2px solid var(--irrigation-accent) !important;
      outline-offset: 1px;
    }
    .time-list, .station-list { gap: 8px !important; }
    .time-row { gap: 8px !important; }
    .station-row {
      grid-template-columns: minmax(0, 1fr) 95px !important;
      gap: 10px !important;
      min-height: 40px;
    }
    .station-label {
      font-size: 12px !important;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .station-row .field { text-align: center; }
    .danger-button, .add-button, .save-button {
      min-height: 39px !important;
      border-radius: 10px !important;
      font-size: 12px !important;
      font-weight: 650 !important;
    }
    .danger-button {
      width: 39px !important; min-width: 39px !important;
      background: color-mix(in srgb, var(--error-color, #db4437) 13%, transparent) !important;
    }
    .add-button {
      margin-top: 10px !important;
      border: 0 !important;
      background: color-mix(in srgb, var(--irrigation-accent) 14%, transparent) !important;
      color: var(--irrigation-accent) !important;
    }
    .save-button {
      border: 0 !important;
      background: color-mix(in srgb, var(--irrigation-accent) 18%, transparent) !important;
      color: var(--irrigation-accent) !important;
      min-width: 92px !important;
    }
    .save-button:hover { background: color-mix(in srgb, var(--irrigation-accent) 26%, transparent) !important; }
    .footer { margin-top: 12px !important; gap: 8px !important; }
    .status { font-size: 11px !important; }
    @media (max-width: 520px) {
      .wrapper { padding: 12px !important; }
      .station-row { grid-template-columns: minmax(0,1fr) 84px !important; gap: 7px !important; }
      .station-label { font-size: 11px !important; }
      .footer { flex-direction: row !important; align-items: center !important; }
      .save-button { width: auto !important; }
    }
  `;

  function applyStyle(card) {
    if (!card?.shadowRoot || card.shadowRoot.querySelector(`#${marker}`)) return;
    const style = document.createElement('style');
    style.id = marker;
    style.textContent = css;
    card.shadowRoot.appendChild(style);
  }

  customElements.whenDefined(tagName).then(() => {
    const CardClass = customElements.get(tagName);
    if (!CardClass || CardClass.prototype.__irrigationVisualStylePatched) return;
    CardClass.prototype.__irrigationVisualStylePatched = true;
    const originalRender = CardClass.prototype.render;
    if (typeof originalRender === 'function') {
      CardClass.prototype.render = function (...args) {
        const result = originalRender.apply(this, args);
        applyStyle(this);
        return result;
      };
    }

    // Apply immediately to already-rendered cards, including nested HA shadow roots.
    function visit(root) {
      if (!root?.querySelectorAll) return;
      root.querySelectorAll('*').forEach(element => {
        if (element.localName === tagName) applyStyle(element);
        if (element.shadowRoot) visit(element.shadowRoot);
      });
    }
    visit(document);
  }).catch(error => console.error('Irrigation schedule styling failed:', error));
})();