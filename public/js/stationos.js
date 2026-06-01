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

function titleFromKey(key) {
    return key.replaceAll("_", " ");
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
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`${url} returned HTTP ${response.status}`);
    }

    return response.json();
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

    const hallway = await fetchJson("/api/hallway");
    const rooms = [
        {
            name: hallway.room || "Hallway",
            href: "/hallway",
        },
    ];

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
