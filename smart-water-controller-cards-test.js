(()=>{class n extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.currentMonth=(new Date).getMonth(),this.scheduleData=null,this._hass=null,this._config=null,this._servicePrefix=null,this._status=null,this._isDirty=!1,this._lastLoadedScheduleJson=null,this._statusTimer=null,this._entitySignature=null,this._pendingEntitySync=!1,this.shadowRoot.addEventListener("focusout",()=>{window.setTimeout(()=>{this._hasActiveEditor()||!this._pendingEntitySync||this._isDirty||(this._pendingEntitySync=!1,this._syncFromEntity(!0))},0)})}setConfig(n){if(!n?.sensor)throw new Error("You need to define a sensor in config.");this._config=n,this.sensor=n.sensor,this._entitySignature=null,this._pendingEntitySync=!1,this._hass?this._syncFromEntity(!0):this.render()}set hass(n){if(this._hass=n,!this.sensor)return void this.render();const t=this._getEntity(),e=this._buildEntitySignature(t);e!==this._entitySignature&&(this._entitySignature=e,this._hasActiveEditor()?this._pendingEntitySync=!0:(this._pendingEntitySync=!1,this._syncFromEntity()))}getCardSize(){return this._shouldShowHeader()?8:7}_getEntity(){return this._hass?.states?.[this.sensor]??null}_hasActiveEditor(){const n=this.shadowRoot?.activeElement;return Boolean(n?.matches?.("input, select, textarea"))}_shouldShowHeader(){return Boolean(this._config?.header)}_getHeaderTitle(){if(!this._shouldShowHeader())return"";const n="string"==typeof this._config?.title?this._config.title.trim():"";if(n)return n;const t=this._getEntity(),e=t?.attributes?.friendly_name;return e?String(e):"Irrigation schedule"}_buildEntitySignature(n){return JSON.stringify({friendly_name:n?.attributes?.friendly_name??null,service_prefix:this._extractServicePrefix(n),schedule:n?.attributes?.schedule??null,station_names:n?.attributes?.station_names??null,header:Boolean(this._config?.header),title:this._getHeaderTitle()})}_extractServicePrefix(n){const t=n?.attributes??{};if(t.service_prefix)return String(t.service_prefix);if(t.controller_service_prefix)return String(t.controller_service_prefix);const e=(n?.entity_id||this.sensor||"").match(/^sensor\.([0-9a-fA-F]{2}(?:_[0-9a-fA-F]{2}){5})_/);return e?e[1]:null}_getStationLabel(n){const t=this._getEntity(),e=t?.attributes??{},i=Array.isArray(e.station_names)?e.station_names:[],r=String(n).match(/^station_(\d+)_minutes$/);if(r){const n=Number(r[1])-1;if(Number.isInteger(n)&&n>=0&&n<i.length&&i[n])return i[n]}return String(n).replace("_minutes","").replace("station_","Station ")}_syncFromEntity(n=!1){if(!this._hass||!this.sensor)return void this.render();const t=this._getEntity();this._servicePrefix=this._extractServicePrefix(t);const e=t?.attributes?.schedule,i=e?JSON.stringify(e):null;i&&(n||!this.scheduleData||!this._isDirty&&i!==this._lastLoadedScheduleJson)&&(this.scheduleData=JSON.parse(i),this._lastLoadedScheduleJson=i),!i&&n&&(this.scheduleData=null,this._lastLoadedScheduleJson=null),this.render()}_getMonthSchedule(n=this.currentMonth){if(!Array.isArray(this.scheduleData))return{hours:[],stations:{},interval_days:0};const t=this.scheduleData[n]||{};return{hours:Array.isArray(t.hours)?[...t.hours]:[],stations:t.stations&&"object"==typeof t.stations?{...t.stations}:{},interval_days:Number.isFinite(Number(t.interval_days))?Number(t.interval_days):0}}_ensureScheduleData(){Array.isArray(this.scheduleData)||(this.scheduleData=Array.from({length:12},()=>({hours:[],stations:{},interval_days:0}))),this.scheduleData[this.currentMonth]||(this.scheduleData[this.currentMonth]={hours:[],stations:{},interval_days:0});const n=this.scheduleData[this.currentMonth];return Array.isArray(n.hours)||(n.hours=[]),n.stations&&"object"==typeof n.stations||(n.stations={}),Number.isFinite(Number(n.interval_days))||(n.interval_days=0),n}_markDirty(){this._isDirty=!0}_formatMonthName(n){return new Date(2026,n,1).toLocaleString(void 0,{month:"long"})}_normalizeTimeForInput(n){if(!n)return"07:00";const t=String(n);return t.length>=5?t.slice(0,5):t}_normalizeTimeForStorage(n){if(!n)return"07:00:00";const t=String(n).trim();return/^\d{2}:\d{2}:\d{2}$/.test(t)?t:/^\d{2}:\d{2}$/.test(t)?`${t}:00`:"07:00:00"}_changeMonth(n){this.currentMonth=(this.currentMonth+n+12)%12,this.render()}_selectMonth(n){this.currentMonth=Number(n),this.render()}_updateIntervalDays(n){this._ensureScheduleData().interval_days=Math.max(0,parseInt(n,10)||0),this._markDirty()}_addTimeSlot(){this._ensureScheduleData().hours.push("07:00:00"),this._markDirty(),this.render()}_updateTimeSlot(n,t){const e=this._ensureScheduleData();(e.hours[n]||""===e.hours[n])&&(e.hours[n]=this._normalizeTimeForStorage(t),this._markDirty())}_removeTimeSlot(n){const t=this._ensureScheduleData();n<0||n>=t.hours.length||(t.hours.splice(n,1),this._markDirty(),this.render())}_updateStationTime(n,t){this._ensureScheduleData().stations[n]=Math.max(0,parseInt(t,10)||0),this._markDirty()}_setStatus(n,t="info"){this._status={message:n,type:t},this._statusTimer&&clearTimeout(this._statusTimer),this._statusTimer=setTimeout(()=>{this._status=null,this.render()},3500),this.render()}async _saveSchedule(){if(!this._hass)return void this._setStatus("Home Assistant is not ready yet.","error");if(!this._servicePrefix)return void this._setStatus("Could not determine the schedule service for this controller.","error");const n=Array.isArray(this.scheduleData)?this.scheduleData.map(n=>({hours:Array.isArray(n?.hours)?n.hours.map(n=>this._normalizeTimeForStorage(n)):[],stations:n?.stations&&"object"==typeof n.stations?{...n.stations}:{},interval_days:Math.max(0,parseInt(n?.interval_days,10)||0)})):[];try{await this._hass.callService("smart_water_controller",`set_irrigation_schedule_${this._servicePrefix}`,{schedule:n}),this._isDirty=!1,this._pendingEntitySync=!1,this._lastLoadedScheduleJson=JSON.stringify(n),this._setStatus("Schedule saved successfully.","success")}catch(n){this._setStatus(n?.message||"Failed to save the schedule.","error")}}_attachEventListeners(){const n=this.shadowRoot;if(!n)return;n.querySelector("[data-action='prev-month']")?.addEventListener("click",()=>{this._changeMonth(-1)}),n.querySelector("[data-action='next-month']")?.addEventListener("click",()=>{this._changeMonth(1)}),n.querySelector("[data-role='month-select']")?.addEventListener("change",n=>{this._selectMonth(n.target.value)}),n.querySelector("[data-action='add-time']")?.addEventListener("click",()=>{this._addTimeSlot()}),n.querySelector("[data-action='save-schedule']")?.addEventListener("click",()=>{this._saveSchedule()});const t=n.querySelector("[data-role='interval-days']");t?.addEventListener("input",n=>{this._updateIntervalDays(n.target.value)}),t?.addEventListener("change",n=>{this._updateIntervalDays(n.target.value)}),n.querySelectorAll("[data-role='time-slot']").forEach(n=>{const t=n=>{const t=Number(n.currentTarget.dataset.index);this._updateTimeSlot(t,n.currentTarget.value)};n.addEventListener("input",t),n.addEventListener("change",t)}),n.querySelectorAll("[data-action='remove-time']").forEach(n=>{n.addEventListener("click",n=>{const t=Number(n.currentTarget.dataset.index);this._removeTimeSlot(t)})}),n.querySelectorAll("[data-role='station-minutes']").forEach(n=>{const t=n=>{const t=n.currentTarget.dataset.stationKey;this._updateStationTime(t,n.currentTarget.value)};n.addEventListener("input",t),n.addEventListener("change",t)})}render(){if(!this.shadowRoot)return;const n=this._getEntity(),t=this._getMonthSchedule(),e=this._formatMonthName(this.currentMonth),i=Object.entries(t.stations||{}).sort((n,t)=>(parseInt(String(n[0]).replace(/\D/g,""),10)||0)-(parseInt(String(t[0]).replace(/\D/g,""),10)||0)),r=this._shouldShowHeader(),a=this._getHeaderTitle();this.shadowRoot.innerHTML=`\n            <style>\n                :host {\n                    display: block;\n                }\n\n                * {\n                    box-sizing: border-box;\n                }\n\n                ha-card {\n                    overflow: hidden;\n                }\n\n                .wrapper {\n                    padding: 16px;\n                }\n\n                .card-header {\n                    margin: 0 0 12px;\n                }\n                \n                .card-header-title {\n                    margin: 0;\n                    color: var(--ha-card-header-color, var(--primary-text-color));\n                    font-family: var(--ha-card-header-font-family, inherit);\n                    font-size: var(--ha-card-header-font-size, var(--ha-font-size-2xl));\n                    font-weight: var(--ha-font-weight-normal);\n                    letter-spacing: -0.012em;\n                    line-height: var(--ha-line-height-expanded);\n                }\n                \n                .card-header-title .name {\n                    display: block;\n                    white-space: nowrap;\n                    overflow: hidden;\n                    text-overflow: ellipsis;\n                }\n\n                .month-header {\n                    display: grid;\n                    grid-template-columns: auto minmax(0, 1fr) auto;\n                    align-items: center;\n                    gap: 12px;\n                    margin-bottom: 20px;\n                }\n\n                .icon-button {\n                    display: inline-flex;\n                    align-items: center;\n                    justify-content: center;\n                    width: 40px;\n                    height: 40px;\n                    border: 1px solid var(--divider-color);\n                    border-radius: 999px;\n                    background: var(--ha-card-background, var(--card-background-color, #fff));\n                    color: var(--primary-text-color);\n                    cursor: pointer;\n                    transition: background-color 160ms ease, border-color 160ms ease, transform 120ms ease;\n                }\n\n                .icon-button:hover {\n                    background: var(--secondary-background-color);\n                }\n\n                .icon-button:active {\n                    transform: scale(0.98);\n                }\n\n                .icon-button ha-icon {\n                    display: block;\n                    width: 20px;\n                    height: 20px;\n                    margin: 0;\n                    color: var(--secondary-text-color);\n                }\n\n                .month-select-wrap {\n                    position: relative;\n                }\n\n                .month-select {\n                    width: 100%;\n                    height: 44px;\n                    padding: 0 40px 0 14px;\n                    border: 1px solid var(--divider-color);\n                    border-radius: 12px;\n                    background: var(--ha-card-background, var(--card-background-color, #fff));\n                    color: var(--primary-text-color);\n                    font: inherit;\n                    font-size: 16px;\n                    font-weight: 500;\n                    appearance: none;\n                    outline: none;\n                    cursor: pointer;\n                }\n\n                .month-select:focus,\n                .field:focus,\n                .time-field:focus {\n                    border-color: var(--primary-color);\n                    box-shadow: 0 0 0 1px var(--primary-color);\n                }\n\n                .month-select-wrap ha-icon {\n                    position: absolute;\n                    right: 12px;\n                    top: 50%;\n                    transform: translateY(-50%);\n                    width: 20px;\n                    height: 20px;\n                    color: var(--secondary-text-color);\n                    pointer-events: none;\n                }\n\n                .section {\n                    padding: 16px;\n                    border: 1px solid var(--divider-color);\n                    border-radius: 16px;\n                    background: color-mix(\n                        in srgb,\n                        var(--ha-card-background, var(--card-background-color, #fff)) 92%,\n                        var(--primary-text-color) 8%\n                    );\n                }\n\n                .section + .section {\n                    margin-top: 16px;\n                }\n\n                .section-title {\n                    margin: 0 0 4px;\n                    font-size: 16px;\n                    font-weight: 600;\n                    color: var(--primary-text-color);\n                }\n\n                .section-description {\n                    margin: 0 0 14px;\n                    color: var(--secondary-text-color);\n                    font-size: 13px;\n                    line-height: 1.4;\n                }\n\n                .field,\n                .time-field {\n                    width: 100%;\n                    min-height: 44px;\n                    padding: 10px 12px;\n                    border: 1px solid var(--divider-color);\n                    border-radius: 12px;\n                    background: var(--ha-card-background, var(--card-background-color, #fff));\n                    color: var(--primary-text-color);\n                    font: inherit;\n                    outline: none;\n                }\n\n                .time-list {\n                    display: grid;\n                    gap: 12px;\n                }\n\n                .time-row {\n                    display: grid;\n                    grid-template-columns: minmax(0, 1fr) auto;\n                    gap: 10px;\n                    align-items: center;\n                }\n\n                .danger-button,\n                .add-button,\n                .save-button {\n                    display: inline-flex;\n                    align-items: center;\n                    justify-content: center;\n                    gap: 8px;\n                    min-height: 40px;\n                    padding: 0 14px;\n                    border-radius: 999px;\n                    border: 1px solid transparent;\n                    font: inherit;\n                    font-weight: 500;\n                    line-height: 1;\n                    cursor: pointer;\n                    transition: filter 160ms ease, transform 120ms ease, background-color 160ms ease;\n                }\n\n                .danger-button:active,\n                .add-button:active,\n                .save-button:active {\n                    transform: scale(0.99);\n                }\n\n                .danger-button {\n                    width: 40px;\n                    min-width: 40px;\n                    padding: 0;\n                    border-color: color-mix(in srgb, var(--error-color) 30%, transparent);\n                    background: color-mix(in srgb, var(--error-color) 12%, transparent);\n                    color: var(--error-color);\n                }\n\n                .danger-button ha-icon,\n                .add-button ha-icon,\n                .save-button ha-icon {\n                    display: block;\n                    width: 18px;\n                    height: 18px;\n                    margin: 0;\n                }\n\n                .add-button {\n                    margin-top: 14px;\n                    background: color-mix(in srgb, var(--primary-color) 12%, transparent);\n                    color: var(--primary-color);\n                    border-color: color-mix(in srgb, var(--primary-color) 28%, transparent);\n                }\n\n                .save-button {\n                    background: var(--primary-color);\n                    color: var(--text-primary-color, #fff);\n                    min-width: 110px;\n                }\n\n                .button-icon {\n                    display: inline-grid;\n                    place-items: center;\n                    line-height: 0;\n                    flex: 0 0 auto;\n                }\n\n                .nav-icon {\n                    width: 20px;\n                    height: 20px;\n                }\n\n                .nav-icon-prev {\n                    transform: translate(-1px, -2px);\n                }\n                \n                .nav-icon-next {\n                    transform: translate(1px, -2px);\n                }\n                \n                .danger-icon {\n                    width: 18px;\n                    height: 18px;\n                    transform: translate(-2px, -2.5px);\n                }\n                \n                .add-icon {\n                    width: 18px;\n                    height: 18px;\n                    transform: translate(-1px, -2.5px);\n                }\n                \n                .save-icon {\n                    width: 18px;\n                    height: 18px;\n                    transform: translate(-1px, -2.5px);\n                }\n\n                .station-list {\n                    display: grid;\n                    gap: 12px;\n                }\n\n                .station-row {\n                    display: grid;\n                    grid-template-columns: minmax(110px, auto) minmax(0, 1fr);\n                    gap: 12px;\n                    align-items: center;\n                }\n\n                .station-label {\n                    color: var(--primary-text-color);\n                    font-weight: 500;\n                }\n\n                .footer {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: center;\n                    gap: 12px;\n                    margin-top: 18px;\n                    flex-wrap: wrap;\n                }\n\n                .status {\n                    min-height: 20px;\n                    font-size: 13px;\n                    color: var(--secondary-text-color);\n                }\n\n                .status.success {\n                    color: var(--success-color, #2e7d32);\n                }\n\n                .status.error {\n                    color: var(--error-color);\n                }\n\n                .save-button[disabled] {\n                    opacity: 0.6;\n                    cursor: default;\n                }\n\n                .placeholder {\n                    padding: 18px 0 6px;\n                    color: var(--secondary-text-color);\n                }\n\n                @media (max-width: 520px) {\n                    .wrapper {\n                        padding: 12px;\n                    }\n\n                    .month-header {\n                        grid-template-columns: 40px minmax(0, 1fr) 40px;\n                        gap: 10px;\n                    }\n\n                    .station-row {\n                        grid-template-columns: 1fr;\n                        gap: 8px;\n                    }\n\n                    .footer {\n                        align-items: stretch;\n                    }\n\n                    .save-button {\n                        width: 100%;\n                        justify-content: center;\n                    }\n                }\n            </style>\n\n            <ha-card>\n                <div class="wrapper">\n                    ${r?`\n                        <div class="card-header">\n                            <div class="card-header-title">\n                                <div class="name">${a}</div>\n                            </div>\n                        </div>\n                    `:""}\n\n                    <div class="month-header">\n                        <button class="icon-button" type="button" data-action="prev-month" aria-label="Previous month">\n                            <span class="button-icon nav-icon nav-icon-prev">\n                                <ha-icon icon="mdi:chevron-left"></ha-icon>\n                            </span>\n                        </button>\n\n                        <div class="month-select-wrap">\n                            <select class="month-select" data-role="month-select" aria-label="Month">\n                                ${Array.from({length:12},(n,t)=>`\n                                    <option value="${t}" ${t===this.currentMonth?"selected":""}>\n                                        ${this._formatMonthName(t)}\n                                    </option>\n                                `).join("")}\n                            </select>\n                            <ha-icon icon="mdi:chevron-down"></ha-icon>\n                        </div>\n\n                        <button class="icon-button" type="button" data-action="next-month" aria-label="Next month">\n                            <span class="button-icon nav-icon nav-icon-next">\n                                <ha-icon icon="mdi:chevron-right"></ha-icon>\n                            </span>\n                        </button>\n                    </div>\n\n                    ${this.scheduleData?`\n                        <section class="section">\n                            <h3 class="section-title">Interval between sprinkles</h3>\n                            <p class="section-description">Number of days between watering cycles for ${e}.</p>\n                            <input\n                                class="field"\n                                type="number"\n                                min="0"\n                                step="1"\n                                inputmode="numeric"\n                                value="${t.interval_days}"\n                                data-role="interval-days"\n                            >\n                        </section>\n\n                        <section class="section">\n                            <h3 class="section-title">Scheduled times</h3>\n                            <p class="section-description">Add one or more times for this month. Times are stored in 24-hour format.</p>\n\n                            <div class="time-list">\n                                ${t.hours.map((n,t)=>`\n                                    <div class="time-row">\n                                        <input\n                                            class="time-field"\n                                            type="time"\n                                            value="${this._normalizeTimeForInput(n)}"\n                                            data-role="time-slot"\n                                            data-index="${t}"\n                                        >\n                                        <button\n                                            class="danger-button"\n                                            type="button"\n                                            data-action="remove-time"\n                                            data-index="${t}"\n                                            aria-label="Remove time ${this._normalizeTimeForInput(n)}"\n                                        >\n                                            <span class="button-icon danger-icon">\n                                                <ha-icon icon="mdi:close"></ha-icon>\n                                            </span>\n                                        </button>\n                                    </div>\n                                `).join("")}\n                            </div>\n\n                            <button class="add-button" type="button" data-action="add-time">\n                                <span class="button-icon add-icon">\n                                    <ha-icon icon="mdi:plus"></ha-icon>\n                                </span>\n                                <span>Add time</span>\n                            </button>\n                        </section>\n\n                        <section class="section">\n                            <h3 class="section-title">Sprinkle time per station</h3>\n                            <p class="section-description">Set the watering duration in minutes for each station in ${e}.</p>\n\n                            <div class="station-list">\n                                ${i.map(([n,t])=>`\n                                    <div class="station-row">\n                                        <div class="station-label">${this._getStationLabel(n)}</div>\n                                        <input\n                                            class="field"\n                                            type="number"\n                                            min="0"\n                                            step="1"\n                                            inputmode="numeric"\n                                            value="${t}"\n                                            data-role="station-minutes"\n                                            data-station-key="${n}"\n                                        >\n                                    </div>\n                                `).join("")}\n                            </div>\n                        </section>\n                    `:`\n                        <div class="placeholder">\n                            ${n?"Loading schedule data...":`Entity not found: ${this.sensor}`}\n                        </div>\n                    `}\n\n                    <div class="footer">\n                        <div class="status ${this._status?.type||""}">${this._status?.message||""}</div>\n                        <button\n                            class="save-button"\n                            type="button"\n                            data-action="save-schedule"\n                            ${this.scheduleData?"":"disabled"}\n                        >\n                            <span class="button-icon save-icon">\n                                <ha-icon icon="mdi:content-save"></ha-icon>\n                            </span>\n                            <span>Save</span>\n                        </button>\n                    </div>\n                </div>\n            </ha-card>\n        `,this._attachEventListeners()}}customElements.define("smart-water-controller-schedule-card-dev",n)})();
;
/*
 * Irrigation Schedule - visual harmonization layer, v1.0
 * Keeps the original HACS schedule card and its editing/save logic intact.
 * Register as a JavaScript module resource AFTER the original HACS resource.
 */
(() => {
  const tagName = 'smart-water-controller-schedule-card-dev';
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
;
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
if (!customElements.get('irrigation-summary-card-dev')) {
  customElements.define('irrigation-summary-card-dev', IrrigationSummaryCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'irrigation-summary-card-dev')) {
  window.customCards.push({type:'irrigation-summary-card-dev',name:'RainBird Irrigation Summary',description:'Overview and expandable weather details'});
}
;
/* RainBird expandable irrigation card, v6. Interface and comments in English. */
class IrrigationZonesCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.openZone = -1;
    this.busy = false;
    this.timer = null;
    this.draftDuration = null;
  }
  setConfig(config) {
    if (!Array.isArray(config.zones) || !config.zones.length) throw Error('zones is required');
    this.config = {
      duration: 'number.rainbird_irrigation_manual_duration',
      end_time: 'sensor.rainbird_irrigation_end_time',
      stop: 'button.rainbird_stop_sprinkle',
      show_global_stop: true,
      duration_step: 1,
      connection_switches: [
        'switch.rain_bird_sprinkler_1',
        'switch.rain_bird_sprinkler_2',
        'switch.rain_bird_sprinkler_3'
      ],
      ...config
    };
    this.openZone = -1;
    this.render();
  }
  set hass(value) {
    this._hass = value;
    const ids = [
      this.config?.duration, this.config?.end_time, this.config?.stop,
      ...(this.config?.connection_switches || []),
      ...(this.config?.zones || []).flatMap(zone => [
        zone.status, zone.today, zone.planned, zone.remaining, zone.valve
      ])
    ].filter(Boolean);
    const current = ids.map(id => value?.states?.[id]);
    if (this._trackedIds?.length === ids.length &&
        ids.every((id, index) =>
          id === this._trackedIds[index] &&
          current[index] === this._trackedEntities[index])) {
      this.updateCountdown();
      return;
    }
    this._trackedIds = ids;
    this._trackedEntities = current;
    this.render();
  }
  connectedCallback() {
    if (!this.timer) this.timer = setInterval(() => this.updateCountdown(), 1000);
  }
  disconnectedCallback() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  getCardSize() { return Math.max(2, this.config?.zones?.length || 3); }
  esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  entity(id) { return id ? this._hass?.states?.[id] : null; }
  state(id) { return this.entity(id)?.state ?? 'unavailable'; }
  valid(value) { return !['unknown','unavailable','none',''].includes(String(value ?? '').toLowerCase()); }
  running(zone) { return String(this.state(zone.status)).toLowerCase() === 'sprinkling'; }
  active() { return this.config?.zones?.find(zone => this.running(zone)); }
  connectionLost() {
    const switches = this.config?.connection_switches || [];
    return switches.some(id => !this.valid(this.state(id)));
  }
  duration() {
    const real = Number(this.state(this.config.duration));
    if (this.draftDuration !== null && Number.isFinite(real) && real === this.draftDuration) this.draftDuration = null;
    return this.draftDuration ?? (this.valid(this.state(this.config.duration)) && Number.isFinite(real) ? real : null);
  }
  durationLimits() {
    const attr = this.entity(this.config.duration)?.attributes || {};
    return {
      min: Number.isFinite(Number(attr.min)) ? Number(attr.min) : 1,
      max: Number.isFinite(Number(attr.max)) ? Number(attr.max) : 120,
      step: Number(this.config.duration_step) > 0 ? Number(this.config.duration_step) : 1
    };
  }
  countdown() {
    const raw = this.state(this.config.end_time);
    if (!this.valid(raw)) return 'End time unavailable';
    const end = Date.parse(raw);
    if (!Number.isFinite(end)) return 'End time unavailable';
    let seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    if (!seconds) return 'Finishing...';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = seconds % 60;
    const pad = n => String(n).padStart(2, '0');
    return 'Stopping in ' + (h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`);
  }
  updateCountdown() {
    this.shadowRoot.querySelectorAll('[data-countdown]').forEach(el => {
      const zone = this.config?.zones?.[Number(el.dataset.countdown)];
      if (zone && this.running(zone)) el.textContent = this.countdown();
    });
  }
  info(id) {
    if (!id) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles:true, composed:true, detail:{entityId:id} }));
  }
  value(id) {
    const value = this.state(id);
    if (!this.valid(value)) return '—';
    const unit = this.entity(id)?.attributes?.unit_of_measurement || '';
    return this.esc(value) + (unit ? ' ' + this.esc(unit) : '');
  }
  metric(label, id) {
    return id ? `<button class="metric" data-info="${this.esc(id)}"><span>${this.esc(label)}</span><strong>${this.value(id)}</strong></button>` : '';
  }
  progress(zone) {
    const done = this.state(zone.today), total = this.state(zone.planned);
    if (!this.valid(done) || !this.valid(total)) return null;
    const a = Number(done), b = Number(total);
    return Number.isFinite(a) && Number.isFinite(b) && b > 0 ? Math.min(100,Math.max(0,a / b * 100)) : null;
  }
  async changeDuration(direction) {
    if (this.busy || this.connectionLost() || !this.entity(this.config.duration)) return;
    const current = this.duration();
    if (current === null) return;
    const {min,max,step} = this.durationLimits();
    const next = Math.max(min, Math.min(max, Number((current + direction * step).toFixed(3))));
    if (next === current) return;
    this.busy = true; this.draftDuration = next; this.render();
    try {
      await this._hass.callService('number','set_value',{entity_id:this.config.duration,value:next});
    } catch (error) {
      this.draftDuration = null;
      console.error('Failed to set duration:', error);
      alert('Unable to update irrigation duration.');
    } finally { this.busy = false; this.render(); }
  }
  async press(id, message) {
    if (!id || this.busy || this.connectionLost() || !confirm(message)) return;
    if (this.connectionLost()) return;
    this.busy = true; this.render();
    try {
      await this._hass.callService('button','press',{entity_id:id});
    } catch (error) {
      console.error('Irrigation command failed:',error);
      alert('Unable to execute irrigation command.');
    } finally { this.busy = false; this.render(); }
  }
  start(zone) {
    if (this.connectionLost()) return;
    if (this.active()) { alert('Another irrigation zone is already running. Stop it first.'); return; }
    const minutes = this.duration();
    if (minutes === null) { alert('Irrigation duration is unavailable.'); return; }
    this.press(zone.start, `Start ${zone.name} for ${minutes} minutes?`);
  }
  stop(name) {
    this.press(this.config.stop, name ? `Stop irrigation for ${name}?` : 'Stop all irrigation?');
  }
  render() {
    if (!this.config || !this._hass) return;
    const active = this.active(), duration = this.duration(), {min,max} = this.durationLimits();
    const disconnected = this.connectionLost();
    const rows = this.config.zones.map((zone,index) => {
      const running = this.running(zone), expanded = this.openZone === index, progress = this.progress(zone);
      return `<section class="zone ${running ? 'running' : ''}">
        <button class="summary" data-toggle="${index}" aria-expanded="${expanded}">
          <span class="symbol"><ha-icon icon="${running ? 'mdi:water' : 'mdi:sprinkler-variant'}"></ha-icon></span>
          <span class="title"><strong>${this.esc(zone.name)}</strong><small class="${running ? 'active' : ''}">${this.esc(this.state(zone.status))}</small>${running ? `<small class="countdown" data-countdown="${index}">${this.esc(this.countdown())}</small>` : ''}</span>
          <span class="today"><strong>${this.value(zone.today)}</strong><small>Today</small></span>
          <ha-icon class="chevron" icon="mdi:chevron-${expanded ? 'up':'down'}"></ha-icon>
        </button>
        ${expanded ? `<div class="details">
          <div class="metrics">${this.metric('Status',zone.status)}${this.metric('Irrigated today',zone.today)}${this.metric('Scheduled today',zone.planned)}${this.metric('Remaining today',zone.remaining)}</div>
          ${progress === null ? '' : `<div class="progress-label"><span>Today's schedule</span><strong>${Math.round(progress)}%</strong></div><div class="progress"><div style="width:${progress}%"></div></div>`}
          <div class="controls"><div class="duration"><label>Manual duration</label><div class="stepper">
            <button data-step="-1" ${this.busy || disconnected || duration === null || duration <= min ? 'disabled':''}><ha-icon icon="mdi:minus"></ha-icon></button>
            <button data-info="${this.esc(this.config.duration)}" class="duration-value">${duration ?? '—'} min</button>
            <button data-step="1" ${this.busy || disconnected || duration === null || duration >= max ? 'disabled':''}><ha-icon icon="mdi:plus"></ha-icon></button>
          </div></div><button class="action ${running ? 'stop':'start'}" data-action="${index}" ${this.busy || disconnected || (!running && !!active) ? 'disabled':''}><ha-icon icon="mdi:${running ? 'stop':'play'}"></ha-icon>${running ? 'Stop':'Start'}</button></div>
          ${zone.valve ? `<button class="valve" data-info="${this.esc(zone.valve)}"><ha-icon icon="mdi:valve"></ha-icon>Valve details<ha-icon icon="mdi:chevron-right"></ha-icon></button>` : ''}
        </div>` : ''}</section>`;
    }).join('');
    const globalStop = this.config.show_global_stop && active
      ? `<div class="global"><span><ha-icon icon="mdi:water"></ha-icon> Irrigating: ${this.esc(active.name)}</span><button data-stop-all ${this.busy || disconnected?'disabled':''}><ha-icon icon="mdi:stop-circle-outline"></ha-icon>Stop All</button></div>` : '';
    const connectionWarning = disconnected
      ? `<div class="connection-warning"><ha-icon icon="mdi:wifi-off"></ha-icon><span>Controller unavailable — irrigation controls disabled</span></div>`
      : '';
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color);--green:var(--success-color,#43a047);--red:var(--error-color,#db4437);--blue:var(--info-color,#039be5);--border:var(--divider-color,rgba(128,128,128,.2))}
      ha-card{overflow:hidden;border-radius:18px;padding:5px 13px;background:var(--ha-card-background,var(--card-background-color))}
      button{font:inherit;color:inherit;cursor:pointer;border:0}button:disabled{opacity:.4;cursor:not-allowed}
      .connection-warning{display:flex;align-items:center;gap:8px;padding:11px 8px;color:var(--red);font-size:12px;font-weight:600;background:color-mix(in srgb,var(--red) 9%,transparent);border-radius:10px;margin:7px 0}.connection-warning ha-icon{--mdc-icon-size:19px}
      .zone+.zone{border-top:1px solid var(--border)}.summary{display:flex;align-items:center;width:100%;min-height:73px;padding:10px 3px;background:transparent;text-align:left;gap:12px}
      .symbol{display:flex;align-items:center;justify-content:center;width:43px;height:43px;flex:none;border-radius:13px;background:color-mix(in srgb,var(--green) 13%,transparent);color:var(--green)}
      .running .symbol{background:color-mix(in srgb,var(--blue) 16%,transparent);color:var(--blue)}.symbol ha-icon{--mdc-icon-size:24px}
      .title{display:flex;flex-direction:column;flex:1;gap:5px;min-width:0}.title strong{font-size:14px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      small{font-size:12px;color:var(--secondary-text-color)}.title .active,.countdown{color:var(--blue);font-weight:650}.countdown{font-size:11px;font-variant-numeric:tabular-nums}
      .today{display:flex;flex-direction:column;text-align:right;gap:3px;min-width:49px}.today strong{font-size:15px;font-variant-numeric:tabular-nums}.chevron{color:var(--secondary-text-color);--mdc-icon-size:21px}
      .details{padding:1px 1px 15px 55px}.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .metric{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-width:0;padding:10px;border-radius:10px;background:var(--secondary-background-color,rgba(128,128,128,.09));text-align:left}
      .metric span{font-size:11px;color:var(--secondary-text-color)}.metric strong{font-size:15px;font-variant-numeric:tabular-nums}
      .progress-label{display:flex;justify-content:space-between;margin:13px 0 5px;font-size:11px;color:var(--secondary-text-color)}.progress{height:6px;border-radius:20px;background:var(--divider-color,#ddd);overflow:hidden}.progress>div{height:100%;background:var(--green);border-radius:20px}
      .controls{display:flex;align-items:flex-end;gap:10px;margin-top:15px}.duration{display:flex;flex-direction:column;gap:7px;flex:1;min-width:0}.duration label{font-size:11px;color:var(--secondary-text-color)}
      .stepper{display:flex;align-items:center;justify-content:space-between;gap:4px;border-radius:10px;background:var(--secondary-background-color,rgba(128,128,128,.1));padding:3px}
      .stepper button{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;background:var(--ha-card-background,var(--card-background-color))}.stepper button ha-icon{--mdc-icon-size:18px}
      .stepper .duration-value{width:auto;padding:0 3px;background:transparent;font-size:13px;font-weight:650;white-space:nowrap;font-variant-numeric:tabular-nums}
      .action{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 17px;border-radius:10px;font-size:13px;font-weight:650;min-width:88px}.action ha-icon{--mdc-icon-size:18px}
      .start{background:color-mix(in srgb,var(--green) 17%,transparent);color:var(--green)}.stop{background:color-mix(in srgb,var(--red) 20%,transparent);color:var(--red)}
      .valve{display:flex;align-items:center;gap:6px;margin-top:12px;padding:5px 0;background:transparent;color:var(--secondary-text-color);font-size:12px}.valve ha-icon{--mdc-icon-size:17px}
      .global{display:flex;align-items:center;gap:10px;padding:12px 3px;border-top:1px solid var(--border)}.global span{display:flex;align-items:center;gap:7px;flex:1;min-width:0;font-size:12px;color:var(--secondary-text-color)}
      .global span ha-icon{color:var(--blue);--mdc-icon-size:19px}.global button{display:flex;align-items:center;gap:6px;padding:10px 14px;border-radius:10px;background:color-mix(in srgb,var(--red) 16%,transparent);color:var(--red);font-size:12px;font-weight:700}.global button ha-icon{--mdc-icon-size:18px}
      @media(max-width:370px){.summary{gap:8px}.details{padding-left:0}.symbol{width:37px;height:37px}.controls{gap:7px}.action{min-width:72px;padding:12px 10px}}
    </style><ha-card>${connectionWarning}${rows}${globalStop}</ha-card>`;
    this.shadowRoot.querySelectorAll('[data-toggle]').forEach(el => el.addEventListener('click', () => {
      const index = Number(el.dataset.toggle);
      this.openZone = this.openZone === index ? -1 : index;
      this.render();
    }));
    this.shadowRoot.querySelectorAll('[data-info]').forEach(el => el.addEventListener('click', () => this.info(el.dataset.info)));
    this.shadowRoot.querySelectorAll('[data-step]').forEach(el => el.addEventListener('click', () => this.changeDuration(Number(el.dataset.step))));
    this.shadowRoot.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', () => {
      const zone = this.config.zones[Number(el.dataset.action)];
      if (this.running(zone)) this.stop(zone.name); else this.start(zone);
    }));
    this.shadowRoot.querySelector('[data-stop-all]')?.addEventListener('click', () => this.stop());
    this.updateCountdown();
  }
}
if (!customElements.get('irrigation-zones-card-dev')) {
  customElements.define('irrigation-zones-card-dev', IrrigationZonesCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'irrigation-zones-card-dev')) {
  window.customCards.push({type:'irrigation-zones-card-dev',name:'Irrigation Zones',description:'Expandable RainBird irrigation controls'});
}
