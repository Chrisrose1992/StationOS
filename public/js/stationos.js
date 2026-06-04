function setText(id, value) {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    if (value === null || value === undefined || value === "") {
        element.textContent = "-";
        return;
    }

    element.textContent = String(value);
}

function setStatus(message) {
    setText("status", message);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
    }[character]));
}

function titleFromKey(key) {
    return key.replaceAll("_", " ").replaceAll("-", " ");
}

function valueClass(value) {
    if (value === true || value === "Day Time" || value === "No Storm") {
        return "ok";
    }

    if (value === false) {
        return "warn";
    }

    if (value === "Night Time" || value === "Storm In Progress") {
        return "danger";
    }

    return "";
}

function renderSignals(elementId, data) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.innerHTML = Object.entries(data).map(([key, value]) => `
        <div class="signal">
            <div class="signal-name">${titleFromKey(key)}</div>
            <div class="signal-value ${valueClass(value)}">${value ?? "-"}</div>
        </div>
    `).join("");
}

async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`${url} returned HTTP ${response.status}`);
    }

    return response.json();
}

function setClassState(elementId, state) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.classList.remove("state-ok", "state-warn", "state-danger", "ok", "warn", "danger");

    if (state) {
        element.classList.add(`state-${state}`, state);
    }
}

function setBatteryFill(value) {
    const fill = document.getElementById("battery-fill");

    if (fill) {
        fill.style.height = value || "0%";
    }
}

function percent(value) {
    return Math.max(0, Math.min(100, Number(value || 0)));
}

function powerState(watts) {
    return Number(watts || 0) < 0 ? "danger" : "ok";
}

function batteryState(charge) {
    const value = Number(charge || 0);

    return value <= 20 ? "danger" : value <= 45 ? "warn" : "ok";
}

function generatorState(watts, hasError) {
    if (hasError) {
        return "danger";
    }

    return Number(watts || 0) > 0 ? "ok" : "warn";
}

function weatherState(weather) {
    const mode = Number(weather.weather_mode || 0);

    return weather.weather_error || mode === 2 ? "danger" : mode === 1 ? "warn" : "ok";
}

function renderPowerBanks(banks) {
    const grid = document.getElementById("bank-grid");

    if (!grid) {
        return;
    }

    if (!banks.length) {
        grid.innerHTML = '<article class="panel"><div class="panel-body">Waiting for battery bank telemetry.</div></article>';
        return;
    }

    grid.innerHTML = banks.map((bank) => {
        const charge = percent(Number(bank.ratio || 0) * 100);
        const state = !bank.online ? "danger" : batteryState(charge);

        return `
            <article class="device-card state-${state}">
                <div class="bank-card-layout">
                    <div class="bank-card-content">
                        <div class="device-card-top">
                            <div>
                                <strong>${escapeHtml(bank.name || bank.id)}</strong>
                                <span>${escapeHtml(bank.id)}</span>
                            </div>
                            <em class="${state}">${bank.online ? "Online" : "Offline"}</em>
                        </div>
                        <div class="device-metric">${escapeHtml(bank.charge || "0%")}</div>
                        <div class="device-rows">
                            <div><span>Actual Out</span><strong>${escapeHtml(bank.actual_power_out || "0 W")}</strong></div>
                            <div><span>Potential In</span><strong>${escapeHtml(bank.potential_power_in || "0 W")}</strong></div>
                            <div><span>Battery Count</span><strong>${Number(bank.count || 0)}</strong></div>
                        </div>
                    </div>
                    <div class="battery-icon bank-battery-icon" aria-hidden="true">
                        <div style="height: ${escapeHtml(bank.charge || "0%")}"></div>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function renderPrinters(printers) {
    const grid = document.getElementById("printer-grid");

    if (!grid) {
        return;
    }

    setText("printer-count", `${printers.length} printers`);

    if (!printers.length) {
        grid.innerHTML = '<article class="panel"><div class="panel-body">Waiting for workshop printer telemetry.</div></article>';
        return;
    }

    grid.innerHTML = printers.map((printer) => {
        const state = !printer.online ? "danger" : printer.active ? "ok" : "warn";
        const target = Number(printer.print_amount || 0);
        const printed = Number(printer.printed_count || 0);
        const progress = target > 0 ? percent((printed / target) * 100) : 0;
        const completion = (Number(printer.completion || 0) * 100).toFixed(0);

        return `
            <article class="device-card state-${state}">
                <div class="device-card-top">
                    <div>
                        <strong>${escapeHtml(printer.name || printer.id)}</strong>
                        <span>${escapeHtml(printer.type || "printer")}</span>
                    </div>
                    <em class="${state}">${printer.active ? "Printing" : printer.online ? "Idle" : "Offline"}</em>
                </div>
                <div class="device-metric">${escapeHtml(printer.recipe_name || "No recipe")}</div>
                <div class="battery-meter"><div style="width: ${progress}%"></div></div>
                <div class="device-rows">
                    <div><span>Progress</span><strong>${printed} / ${target}</strong></div>
                    <div><span>Completion</span><strong>${completion}%</strong></div>
                    <div><span>Recipe Hash</span><strong>${Number(printer.recipe_hash || 0)}</strong></div>
                </div>
            </article>
        `;
    }).join("");
}

function setActiveNavLink() {
    const currentPath = window.location.pathname;

    document.querySelectorAll("[data-nav-link]").forEach((link) => {
        const linkPath = new URL(link.href).pathname;
        link.classList.toggle("active", linkPath === currentPath);
    });
}

async function refreshRoomAccordion() {
    const list = document.getElementById("room-list");

    if (!list) {
        return;
    }

    const data = await fetchJson("/api/rooms");
    const rooms = Object.entries(data.rooms || {}).map(([id, room]) => ({
        name: room.room || titleFromKey(id),
        href: id === "hallway" ? "/hallway" : `/rooms/${encodeURIComponent(id)}`,
    }));

    list.replaceChildren(...rooms.map((room) => {
        const link = document.createElement("a");

        link.href = room.href;
        link.textContent = room.name;
        link.dataset.navLink = "";
        link.classList.toggle("active", new URL(link.href).pathname === window.location.pathname);

        return link;
    }));
}

async function refreshAlerts() {
    const banner = document.getElementById("alert-banner");
    const title = document.getElementById("alert-banner-title");
    const items = document.getElementById("alert-banner-items");

    if (!banner || !title || !items) {
        return;
    }

    const data = await fetchJson("/api/alerts");
    const alerts = data.alerts || [];
    const hasDanger = alerts.some((alert) => alert.level === "danger");
    const hasWarn = alerts.some((alert) => alert.level === "warn");

    banner.classList.remove("is-clear", "is-warn", "is-danger");
    banner.classList.add(hasDanger ? "is-danger" : hasWarn ? "is-warn" : "is-clear");

    if (alerts.length === 0) {
        title.textContent = "All systems nominal";
        items.replaceChildren();
        return;
    }

    title.textContent = `${alerts.length} active event${alerts.length === 1 ? "" : "s"}`;
    items.replaceChildren(...alerts.map((alert) => {
        const item = document.createElement("div");
        const heading = document.createElement("strong");
        const message = document.createElement("span");

        item.className = `alert-item alert-${alert.level}`;
        heading.textContent = alert.title;
        message.textContent = alert.message;
        item.append(heading, message);

        return item;
    }));
}

function startPageLoader(loader) {
    async function run() {
        try {
            await loader();
            await refreshRoomAccordion();
            await refreshAlerts();
            setStatus(`Online - ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            setStatus(`Offline - ${error.message}`);
        }
    }

    setActiveNavLink();
    run();
    setInterval(run, 2000);
}

async function refreshOverview() {
    const station = await fetchJson("/api/station");

    setText("battery-charge", station.power_monitor?.battery_charge || "0%");
    setText("battery-count", `${station.power_monitor?.battery_count || 0} batteries`);
    setText("weather-status", station.weather?.weather_status || "-");
    setText("day-night", station.weather?.isNight || "Day cycle");
    setText("hallway-room", station.rooms?.hallway?.room || station.hallway?.room || "-");
    setText("hallway-occupied", Number(station.rooms?.hallway?.occupied || station.hallway?.occupied || 0) > 0 ? "Occupied" : "Clear");
}

async function refreshBaseStatus() {
    const base = await fetchJson("/api/base-status");
    const baseFresh = base.last_seen && Date.now() - new Date(base.last_seen).getTime() < 60000;
    const baseOnline = Boolean(base.online) && baseFresh;

    setText("base-online", baseOnline ? "Base online" : "Base offline");
    setClassState("base-online", baseOnline ? "ok" : "danger");
    setText("base-id", base.base_id);
    setText("world-name", base.world_name);
    setText("session-id", base.session_id);
    setText("last-seen", base.last_seen ? new Date(base.last_seen).toLocaleString() : "-");
    setText("version", base.version);
}

async function refreshWeatherPage() {
    const weather = await fetchJson("/api/weather");
    const state = weatherState(weather);
    const isNight = weather.isNight === "Night Time";

    setText("weather-state", weather.weather_status || "No data");
    setClassState("weather-state", state);
    setClassState("storm-panel", state);
    setText("weather-status", weather.weather_status);
    setText("weather-mode", weather.weather_mode);
    setText("next-event", weather.weather_next_event_label || weather.weather_next_event);
    setClassState("cycle-panel", isNight ? "warn" : "ok");
    document.getElementById("weather-orb")?.classList.toggle("night", isNight);
    setText("day-night", weather.isNight);
    setText("weather-powered", weather.weather_powered ? "Powered" : "No power");
    setText("temperature", `${weather.outdoor_temperature ?? "-"} C`);
    setText("pressure", weather.outdoor_pressure);
    setText("horizontal", weather.Horizontal);
    setText("vertical", weather.Vertical);
    setText("solar-radiance", `${weather.solar_radiance ?? "-"} W/m2`);
    setText("weather-error", weather.weather_error ? "Error" : "None");
    setClassState("weather-error-card", weather.weather_error ? "danger" : "ok");
    setClassState("solar-radiance-card", Number(weather.solar_radiance || 0) > 0 ? "ok" : "warn");
}

async function refreshPowerPage() {
    const [power, bankData, commandData] = await Promise.all([
        fetchJson("/api/power_monitor"),
        fetchJson("/api/power/banks"),
        fetchJson("/api/commands"),
    ]);
    const banks = bankData.banks || [];
    const totalBankCount = banks.reduce((sum, bank) => sum + Number(bank.count || 0), 0);
    const hasOfflineBank = banks.some(bank => !bank.online);
    const charge = percent(power.battery_charge_percent);
    const batteryCount = totalBankCount || Number(power.battery_count || 0);
    const batteryPanelState = hasOfflineBank ? "warn" : power.battery_error ? "danger" : batteryState(charge);
    const netState = powerState(power.net_power_w);
    const command = commandData.generation_command || commandData;

    setText("power-state", Number(power.net_power_w || 0) >= 0 ? "Grid stable" : "Power deficit");
    setClassState("power-state", netState);
    setClassState("battery-panel", batteryPanelState);
    setText("battery-charge", power.battery_charge || "0%");
    setText("battery-count", `${batteryCount} batteries online`);
    setBatteryFill(power.battery_charge || "0%");
    setText("battery-status", totalBankCount > 0 ? hasOfflineBank ? "Partial" : "Online" : batteryCount > 0 ? "Online" : "Offline");
    setText("battery-error", power.battery_error ? "Error" : "None");
    setClassState("grid-panel", netState);
    setText("power-in", power.power_actual_in || "0 W");
    setText("power-out", power.power_actual_out || "0 W");
    setText("power-required", power.power_required || "0 W");
    setText("power-net", power.net_power || "0 W");
    document.getElementById("power-net")?.classList.toggle("danger", netState === "danger");
    document.getElementById("power-net")?.classList.toggle("ok", netState === "ok");
    setText("generation-command", command?.target ? `${command.target}: ${command.reason}` : "-");
    setText("wind-status", Number(power.wind_power_w || 0) > 0 ? "Online" : "Offline");
    setText("wind-power", power.windTurbine_power || "0 W");
    setClassState("wind-card", generatorState(power.wind_power_w));
    setText("gfg-count", `${power.gfg_count || 0} units`);
    setText("gfg-power", power.gfg_power || "0 W");
    setText("gfg-error", power.gfg_error ? "Error" : "None");
    setText("gfg-mols", power.gfg_mols_label || "0 mol");
    setClassState("gfg-card", generatorState(power.gfg_power_w, power.gfg_error));
    setText("sfg-count", `${power.sfg_count || 0} units`);
    setText("sfg-power", power.sfg_power || "0 W");
    setText("sfg-error", power.sfg_error ? "Error" : "None");
    setText("sfg-coal", `${power.sfg_coal_count || 0} / ${power.sfg_coal_capacity || 0}`);
    setClassState("sfg-card", generatorState(power.sfg_power_w, power.sfg_error));
    renderPowerBanks(banks);
}

async function refreshWorkshop() {
    const data = await fetchJson("/api/workshop/printers");

    renderPrinters(data.printers || []);
}

async function refreshRoomPage() {
    const path = window.location.pathname;
    const apiPath = path === "/hallway" ? "/api/hallway" : `/api${path}`;
    const room = await fetchJson(apiPath);
    const occupied = Number(room.occupied || 0) > 0;
    const hazard = room.hazard === 1 || room.hazard === true;
    const state = hazard ? "danger" : occupied ? "warn" : "ok";
    const lightColours = {
        0: { name: "Blue", hex: "#212AA5" },
        1: { name: "Gray", hex: "#7B7B7B" },
        2: { name: "Green", hex: "#3F9B39" },
        3: { name: "Orange", hex: "#FF662B" },
        4: { name: "Red", hex: "#E70200" },
        5: { name: "Yellow", hex: "#FFBC1B" },
        6: { name: "White", hex: "#E7E7E7" },
        7: { name: "Black", hex: "#080908" },
        8: { name: "Brown", hex: "#633C2B" },
        9: { name: "Khaki", hex: "#63633F" },
        10: { name: "Pink", hex: "#E41C99" },
        11: { name: "Purple", hex: "#732CA7" },
    };
    const lightColour = lightColours[Number(room.light_colour)] || { name: "Unknown", hex: "#303946" };

    setText("room-title", room.room || "Room");
    setText("room-state", hazard ? "Hazard" : occupied ? "Occupied" : "Clear");
    setClassState("room-state", state);
    setClassState("occupancy-panel", state);
    setText("room", room.room || "Room");
    setText("occupied", occupied ? "Occupied" : "Clear");
    setText("hazard", hazard ? "Hazard detected" : "Clear");
    setClassState("environment-panel", hazard ? "danger" : "ok");
    setText("temperature", `${room.temperature ?? 0} C`);
    setText("pressure", room.pressure);
    setText("light-colour", `${lightColour.name} (${room.light_colour ?? "-"})`);
    const swatch = document.getElementById("light-colour-swatch");

    if (swatch) {
        swatch.style.background = lightColour.hex;
    }

    [
        ["oxygen", room.oxygen],
        ["nitrogen", room.nitrogen],
        ["methane", room.methane],
        ["co2", room.carbonDioxide],
        ["pollution", room.pollution],
    ].forEach(([id, value]) => {
        const amount = percent(value);

        setText(`${id}-value`, `${amount.toFixed(2)}%`);
        const bar = document.getElementById(`${id}-bar`);

        if (bar) {
            bar.style.width = `${amount}%`;
        }
    });

    setText("long-lights", `${room.long_lights || 0} online`);
    setText("long-light-value", room.long_lights || 0);
    setText("round-lights", `${room.round_lights || 0} online`);
    setText("round-light-value", room.round_lights || 0);
    setText("led-lights", `${room.led_lights || 0} online`);
    setText("led-light-value", room.led_lights || 0);
    setText("total-lights", room.total_lights || 0);
}

function currentPageLoader() {
    const path = window.location.pathname;

    if (path === "/") {
        return refreshOverview;
    }

    if (path === "/base-status") {
        return refreshBaseStatus;
    }

    if (path === "/power") {
        return refreshPowerPage;
    }

    if (path === "/workshop") {
        return refreshWorkshop;
    }

    if (path === "/weather") {
        return refreshWeatherPage;
    }

    if (path === "/hallway" || path.startsWith("/rooms/")) {
        return refreshRoomPage;
    }

    return async () => {};
}

document.addEventListener("DOMContentLoaded", () => {
    startPageLoader(currentPageLoader());
});
