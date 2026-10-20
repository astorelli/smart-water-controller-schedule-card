/* RainBird summary cards: overview and weather. Version 1.0. */
class IrrigationSummaryCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._expanded = false;
    this._timer = null;
  }

  setConfig(config) {
    if (!['overview', 'weather'].includes(config.mode)) {
      throw new Error('Specify mode: overview or weather');
    }
    this._config = {
      controller: 'sensor.rainbird_controller_status',
      station: 'sensor.rainbird_current_irrigation_station',
      next: 'sensor.rainbird_next_schedule',
      last: 'sensor.rainbird_last_sprinkle',
      end: 'sensor.rainbird_irrigation_end_time',
      connection: 'input_boolean.rainbird_connection_lost',
      zone_statuses: [
        'sensor.rainbird_front_lawn_status_1',
        'sensor.rainbird_front_lawn_status_2',
        'sensor.rainbird_side_lawn_status'
      ],
      raining: 'binary_sensor.rainbird_is_it_raining_now',
      rain_forecast: 'binary_sensor.rainbird_will_it_rain_today',
      rain_today: 'sensor.rainbird_total_amount_of_rain_today',
      forecast_today: 'sensor.rainbird_total_forecasted_rain_today',
      rain_duration: 'sensor.rainbird_rain_time_today',
      last_rain: 'sensor.rainbird_last_rain',
      water: 'sensor.rainbird_total_water_consumption',
      ...config
    };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    const ids = Object.values(this._config || {})
      .flatMap(value => Array.isArray(value) ? value : [value])
      .filter(value => typeof value === 'string' &&
        /^(sensor|binary_sensor|input_boolean|switch)\./.test(value));
    const current = ids.map(id => hass?.states?.[id]);
    if (this._trackedIds?.length === ids.length &&
        ids.every((id, index) =>
          id === this._trackedIds[index] &&
          current[index] === this._trackedEntities[index])) {
      this.updateLiveText();
      return;
    }
    this._trackedIds = ids;
    this._trackedEntities = current;
    this.render();
  }

  connectedCallback() {
    this._timer = setInterval(() => this.updateLiveText(), 1000);
    this.updateLiveText();
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._timer = null;
  }

  getCardSize() { return this._config?.mode === 'overview' ? 3 : 3; }

  state(id) { return this._hass?.states?.[id]?.state ?? 'unavailable'; }
  entity(id) { return this._hass?.states?.[id]; }
  valid(value) { return !['unknown','unavailable','none',''].includes(String(value).toLowerCase()); }
  escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }
  moreInfo(id) {
    if (!id) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      bubbles: true, composed: true, detail: {entityId:id}
    }));
  }
  timeSince(id) {
    const raw = this.state(id);
    if (!this.valid(raw)) return '—';
    const date = Date.parse(raw);
    if (!Number.isFinite(date)) return raw;
    const seconds = Math.round((Date.now() - date) / 1000);
    if (seconds < 0) return this.timeUntil(id);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }
  timeUntil(id) {
    const raw = this.state(id);
    if (!this.valid(raw)) return '—';
    const date = Date.parse(raw);
    if (!Number.isFinite(date)) return raw;
    const seconds = Math.round((date - Date.now()) / 1000);
    if (seconds < 0) return 'Due now';
    if (seconds < 60) return 'In less than 1 min';
    if (seconds < 3600) return `In ${Math.ceil(seconds / 60)} min`;
    if (seconds < 86400) return `In ${Math.floor(seconds / 3600)} h ${Math.floor((seconds % 3600) / 60)} min`;
    return `In ${Math.floor(seconds / 86400)} days`;
  }
  countdown() {
    const end = Date.parse(this.state(this._config.end));
    if (!Number.isFinite(end)) return 'End time unavailable';
    const seconds = Math.max(0, Math.ceil((end-Date.now()) / 1000));
    if (!seconds) return 'Finishing...';
    const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60;
    const pad = n => String(n).padStart(2,'0');
    return `Stopping in ${h ? `${h}:` : ''}${pad(m)}:${pad(s)}`;
  }
  value(id, digits = null) {
    const state = this.state(id);
    if (!this.valid(state)) return '—';
    const number = Number(state);
    const unit = this.entity(id)?.attributes?.unit_of_measurement || '';
    const formatted = digits !== null && Number.isFinite(number)
      ? number.toLocaleString('en-GB',{minimumFractionDigits:digits,maximumFractionDigits:digits})
      : state;
    return `${formatted}${unit ? ' ' + unit : ''}`;
  }
  chip(label, value, icon, id, extra = '') {
    return `<button class="chip ${extra}" data-info="${this.escape(id)}">
      <span class="chip-icon"><ha-icon icon="${icon}"></ha-icon></span>
      <span class="chip-copy"><span class="muted">${this.escape(label)}</span><strong>${this.escape(value)}</strong></span>
    </button>`;
  }
  row(label, value, id, icon = '') {
    return `<button class="detail-row" data-info="${this.escape(id)}">
      <span>${icon ? `<ha-icon icon="${icon}"></ha-icon>` : ''}${this.escape(label)}</span>
      <strong>${this.escape(value)}</strong>
      <ha-icon icon="mdi:chevron-right"></ha-icon>
    </button>`;
  }
  renderOverview() {
    const c = this._config;
    const controller = this.state(c.controller);
    const active = c.zone_statuses.some(id => this.state(id).toLowerCase() === 'sprinkling');
    const lost = this.state(c.connection) === 'on';
    const mode = lost ? 'error' : active ? 'active' : controller.toLowerCase() === 'on' ? 'ready' : 'off';
    const status = lost ? 'Connection lost' : active ? 'Irrigation running' : mode === 'ready' ? 'Irrigation ready' : `Controller ${controller}`;
    const subtitle = lost ? 'Check the RainBird controller' : active ? this.state(c.station) : mode === 'ready' ? 'No active irrigation' : 'Irrigation unavailable';
    return `<div class="hero ${mode}">
      <span class="hero-icon"><ha-icon icon="${active ? 'mdi:water' : lost ? 'mdi:wifi-alert' : 'mdi:sprout'}"></ha-icon></span>
      <div class="hero-copy"><strong>${this.escape(status)}</strong><small>${this.escape(subtitle)}</small>${active ? `<small class="countdown" data-live="countdown">${this.escape(this.countdown())}</small>` : ''}</div>
      <span class="status-dot"></span>
    </div>
    <div class="overview-grid">
      ${this.chip('Next irrigation',this.timeUntil(c.next),'mdi:calendar-clock',c.next)}
      ${this.chip('Last irrigation',this.timeSince(c.last),'mdi:history',c.last)}
      ${this.chip('Controller',controller,'mdi:water-pump',c.controller)}
      ${this.chip('Current station',this.state(c.station),'mdi:sprinkler',c.station)}
    </div>`;
  }
  renderWeather() {
    const c = this._config;
    const isRaining = this.state(c.raining) === 'on';
    const forecast = this.state(c.rain_forecast) === 'on';
    const headline = isRaining ? 'Raining now' : forecast ? 'Rain expected' : 'Dry conditions';
    return `<div class="weather-header">
      <span class="weather-heading"><ha-icon icon="${isRaining ? 'mdi:weather-rainy' : 'mdi:weather-partly-cloudy'}"></ha-icon><strong>Weather & Rain</strong></span>
      <span class="weather-condition">${this.escape(headline)}</span>
    </div>
    <div class="weather-grid">
      ${this.chip('Rain today',this.value(c.rain_today,2),'mdi:weather-pouring',c.rain_today)}
      ${this.chip('Forecast today',this.value(c.forecast_today,2),'mdi:weather-cloudy',c.forecast_today)}
      ${this.chip('Rain duration',this.valid(this.state(c.rain_duration)) ? `${Math.round(Number(this.state(c.rain_duration)) || 0)} min` : '—','mdi:timer-outline',c.rain_duration)}
    </div>
    <div class="weather-bottom">${this.row('Last rain',this.timeSince(c.last_rain),c.last_rain,'mdi:history')}${this.row('Total irrigation water',this.value(c.water,2),c.water,'mdi:water')}</div>
    <button class="details-toggle" data-toggle aria-expanded="${this._expanded}">
      <span>${this._expanded ? 'Hide weather details' : 'More weather details'}</span><ha-icon icon="mdi:chevron-${this._expanded ? 'up' : 'down'}"></ha-icon>
    </button>
    ${this._expanded ? `<div class="weather-details">
      ${this.row('Raining now',isRaining ? 'Yes' : 'No',c.raining,'mdi:weather-rainy')}
      ${this.row('Will it rain today?',forecast ? 'Yes' : 'No',c.rain_forecast,'mdi:weather-cloudy')}
    </div>` : ''}`;
  }
  updateLiveText() {
    if (!this._config || !this._hass) return;
    const el = this.shadowRoot.querySelector('[data-live="countdown"]');
    if (el) el.textContent = this.countdown();
  }
  render() {
    if (!this._config || !this._hass) return;
    const html = this._config.mode === 'overview' ? this.renderOverview() : this.renderWeather();
    this.shadowRoot.innerHTML = `<style>
      :host {display:block;color:var(--primary-text-color);--accent-green:var(--success-color,#43a047);--accent-blue:var(--info-color,#039be5);--accent-red:var(--error-color,#db4437)}
      ha-card {border-radius:18px;overflow:hidden;padding:14px;background:var(--ha-card-background,var(--card-background-color))}
      button {border:0;color:inherit;font:inherit;cursor:pointer;background:transparent;text-align:left}
      .hero {display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:color-mix(in srgb,var(--accent-green) 9%,transparent)}
      .hero.active {background:color-mix(in srgb,var(--accent-blue) 10%,transparent)}
      .hero.error {background:color-mix(in srgb,var(--accent-red) 10%,transparent)}
      .hero.off {background:var(--secondary-background-color,rgba(128,128,128,.1))}
      .hero-icon {height:44px;width:44px;flex:none;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--accent-green) 16%,transparent);color:var(--accent-green)}
      .active .hero-icon {color:var(--accent-blue);background:color-mix(in srgb,var(--accent-blue) 16%,transparent)}
      .error .hero-icon {color:var(--accent-red);background:color-mix(in srgb,var(--accent-red) 16%,transparent)}
      .hero-icon ha-icon {--mdc-icon-size:25px}
      .hero-copy {display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}.hero-copy strong{font-size:16px}.hero-copy small{font-size:12px;color:var(--secondary-text-color)}
      .hero-copy .countdown{color:var(--accent-blue);font-weight:700;font-variant-numeric:tabular-nums}
      .status-dot {width:9px;height:9px;border-radius:50%;background:var(--accent-green);flex:none}.active .status-dot{background:var(--accent-blue)}.error .status-dot{background:var(--accent-red)}.off .status-dot{background:var(--secondary-text-color)}
      .overview-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:10px}
      .chip{display:flex;align-items:center;gap:9px;padding:11px 9px;border-radius:12px;background:var(--secondary-background-color,rgba(128,128,128,.09));min-width:0;min-height:65px}
      .chip-icon {height:35px;width:35px;flex:none;display:grid;place-items:center;border-radius:10px;background:color-mix(in srgb,var(--accent-blue) 10%,transparent);color:var(--accent-blue)}
      .chip-icon ha-icon{--mdc-icon-size:21px}.chip-copy{display:flex;flex-direction:column;gap:5px;min-width:0}.muted{font-size:11px;color:var(--secondary-text-color)}
      .chip-copy strong{font-size:13px;font-weight:650;overflow-wrap:anywhere;line-height:1.25}
      .weather-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px}.weather-heading{display:flex;align-items:center;gap:9px;font-size:15px}.weather-heading ha-icon{color:var(--accent-blue)}
      .weather-condition{font-size:11px;color:var(--secondary-text-color);white-space:nowrap}
      .weather-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
      .weather-grid .chip{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:10px 7px;min-height:79px}
      .weather-grid .chip-icon{height:25px;width:25px;border-radius:7px}.weather-grid .chip-icon ha-icon{--mdc-icon-size:17px}
      .weather-grid .chip-copy strong{font-size:13px}
      .weather-bottom{margin-top:10px}
      .detail-row{width:100%;display:flex;align-items:center;gap:8px;min-height:40px;border-bottom:1px solid var(--divider-color,rgba(128,128,128,.13));padding:6px 3px;font-size:12px}
      .detail-row span{display:flex;align-items:center;gap:7px;flex:1;color:var(--secondary-text-color);min-width:0}.detail-row span ha-icon{--mdc-icon-size:17px;color:var(--accent-blue)}
      .detail-row strong{font-size:12px;font-weight:650;text-align:right;overflow-wrap:anywhere}.detail-row>ha-icon{--mdc-icon-size:15px;color:var(--secondary-text-color)}
      .details-toggle{display:flex;justify-content:space-between;align-items:center;width:100%;padding:11px 3px 1px;font-size:12px;color:var(--accent-blue);font-weight:650}
      .details-toggle ha-icon{--mdc-icon-size:19px}
      .weather-details{padding-top:8px}
      @media(max-width:360px){ha-card{padding:10px}.chip{padding:9px 6px;gap:5px}.chip-icon{width:29px;height:29px}.weather-grid .chip{padding:8px 5px}.chip-copy strong{font-size:12px}}
    </style><ha-card>${html}</ha-card>`;
    this.shadowRoot.querySelectorAll('[data-info]').forEach(button => {
      button.addEventListener('click', () => this.moreInfo(button.dataset.info));
    });
    this.shadowRoot.querySelector('[data-toggle]')?.addEventListener('click', () => {
      this._expanded = !this._expanded;
      this.render();
    });
    this.updateLiveText();
  }
}
if (!customElements.get('irrigation-summary-card')) {
  customElements.define('irrigation-summary-card', IrrigationSummaryCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'irrigation-summary-card')) {
  window.customCards.push({type:'irrigation-summary-card',name:'RainBird Irrigation Summary',description:'Overview and expandable weather details'});
}