const sidebar = document.querySelector('#sidebar');
const roomToggle = document.querySelector('[data-room-toggle]');
const roomMenu = document.querySelector('[data-room-menu]');

document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
        const isOpen = document.body.classList.toggle('nav-open');
        document.querySelector('.mobile-menu-button')?.setAttribute('aria-expanded', String(isOpen));
    });
});

roomToggle?.addEventListener('click', () => {
    const isOpen = roomMenu.classList.toggle('open');
    roomToggle.setAttribute('aria-expanded', String(isOpen));
});

sidebar?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => document.body.classList.remove('nav-open'));
});

document.querySelectorAll('[data-lighting-form]').forEach((form) => {
    const select = form.querySelector('[data-colour-select]');
    const preview = form.querySelector('[data-colour-preview]');
    const status = form.querySelector('[data-lighting-status]');
    const button = form.querySelector('button[type="submit"]');

    const updatePreview = () => {
        const option = select.options[select.selectedIndex];
        preview.style.setProperty('--led-colour', option.dataset.hex);
    };

    select.addEventListener('change', updatePreview);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const roomId = form.dataset.roomId;
        button.disabled = true;
        status.className = 'lighting-control-status';
        status.textContent = 'Sending command...';

        try {
            const response = await fetch(`/api/command/${encodeURIComponent(roomId)}/lighting`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: Number(select.value) }),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Unable to update lighting colour.');
            }

            status.classList.add('success');
            status.textContent = `${result.room.colour.name} sent to ${result.room.id}.`;
        } catch (error) {
            status.classList.add('error');
            status.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    });
});

document.querySelectorAll('[data-room-live]').forEach((roomView) => {
    const roomId = roomView.dataset.roomId;
    const status = roomView.querySelector('[data-live-status]');
    let requestInProgress = false;

    const setField = (name, value) => {
        document.querySelectorAll(`[data-room-field="${name}"]`).forEach((element) => {
            element.textContent = value;
        });
    };

    const refreshRoom = async () => {
        if (requestInProgress || document.hidden) return;

        requestInProgress = true;

        try {
            const response = await fetch(`/api/room/${encodeURIComponent(roomId)}`, {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Unable to refresh room data.');
            }

            const room = result.room;

            [
                'room',
                'pressure',
                'oxygen',
                'total_lights',
                'light_colour',
                'long_lights',
                'round_lights',
                'led_lights',
            ].forEach((field) => setField(field, room[field]));
            setField('temperature', room.temperature ?? 'Not reported');
            document.querySelector('[data-temperature-unit]').textContent =
                room.temperature === null ? '' : '\u00b0C';

            const occupancy = document.querySelector('[data-room-occupancy]');
            occupancy.textContent = room.occupied ? 'Occupied' : 'Unoccupied';

            const hazard = document.querySelector('[data-room-hazard]');
            hazard.textContent = room.hazard ? 'Hazard detected' : 'Environment safe';
            hazard.classList.toggle('danger', room.hazard);
            hazard.classList.toggle('success', !room.hazard);

            ['oxygen', 'nitrogen', 'carbonDioxide', 'methane', 'pollution'].forEach((gas) => {
                const row = document.querySelector(`[data-gas-row="${gas}"]`);
                const value = Number(room[gas]) || 0;
                row.querySelector('[data-gas-value]').textContent = value;
                row.querySelector('[data-gas-bar]').style.width = `${Math.min(Math.max(value, 0), 100)}%`;
            });

            document.querySelector('[data-reported-colour-swatch]')
                .style.setProperty('--led-colour', result.lightColour.hex);
            document.querySelector('[data-reported-colour-name]').textContent = result.lightColour.name;
            document.querySelector('[data-reported-colour-hex]').textContent = result.lightColour.hex;

            const updatedAt = room.updatedAt ? new Date(room.updatedAt) : new Date();
            status.className = result.isFresh
                ? 'live-status connected'
                : 'live-status warning';
            status.textContent = result.isFresh
                ? `Live - updated ${updatedAt.toLocaleTimeString()}`
                : `Telemetry stale - last report ${updatedAt.toLocaleTimeString()}`;
        } catch (error) {
            status.className = 'live-status error';
            status.textContent = 'Connection lost';
        } finally {
            requestInProgress = false;
        }
    };

    refreshRoom();
    const refreshTimer = window.setInterval(refreshRoom, 2000);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshRoom();
    });

    window.addEventListener('pagehide', () => window.clearInterval(refreshTimer), { once: true });
});

document.querySelectorAll('[data-weather-live]').forEach((weatherView) => {
    let requestInProgress = false;
    const status = weatherView.querySelector('[data-live-status]');
    const renderedUpdatedAt = weatherView.dataset.weatherUpdatedAt;
    const renderedFresh = weatherView.dataset.weatherFresh === 'true';

    const refreshWeather = async () => {
        if (requestInProgress || document.hidden) return;

        requestInProgress = true;

        try {
            const response = await fetch('/api/weather', {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });
            const result = await response.json();

            const latestUpdatedAt = result.weather?.updatedAt || '';
            const freshnessChanged = Boolean(result.isFresh) !== renderedFresh;

            if (
                response.ok
                && (
                    latestUpdatedAt !== renderedUpdatedAt
                    || freshnessChanged
                )
            ) {
                window.location.reload();
            }
        } catch (error) {
            status.className = 'live-status error';
            status.textContent = 'Weather API connection lost';
        } finally {
            requestInProgress = false;
        }
    };

    const refreshTimer = window.setInterval(refreshWeather, 2000);
    refreshWeather();

    window.addEventListener('pagehide', () => window.clearInterval(refreshTimer), { once: true });
});

document.querySelectorAll('[data-dashboard-live]').forEach((dashboardView) => {
    let requestInProgress = false;
    const renderedToken = dashboardView.dataset.dashboardToken;
    const status = dashboardView.querySelector('[data-dashboard-status]');

    const refreshDashboard = async () => {
        if (requestInProgress || document.hidden) return;

        requestInProgress = true;

        try {
            const response = await fetch('/api/dashboard-status', {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Unable to refresh dashboard status.');
            }

            status?.classList.remove('error', 'warning');
            status?.classList.add('connected');

            if (result.token !== renderedToken) {
                window.location.reload();
            }
        } catch (error) {
            status?.classList.remove('connected', 'warning');
            status?.classList.add('error');
            if (status) status.textContent = 'Live update connection lost';
        } finally {
            requestInProgress = false;
        }
    };

    const refreshTimer = window.setInterval(refreshDashboard, 2000);
    refreshDashboard();

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshDashboard();
    });

    window.addEventListener('pagehide', () => window.clearInterval(refreshTimer), { once: true });
});

const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const formatEventTime = (value) => new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
});

document.querySelectorAll('[data-event-timeline]').forEach((timeline) => {
    const list = timeline.querySelector('[data-event-list]');
    const summary = timeline.querySelector('[data-event-summary]');

    const renderEvents = (events) => {
        const unacknowledged = events.filter((event) => (
            event.severity !== 'info'
            && !event.acknowledged_at
        ));
        summary.textContent = `${unacknowledged.length} unacknowledged`;

        if (events.length === 0) {
            list.innerHTML = '<div class="timeline-empty">No station events recorded yet.</div>';
            return;
        }

        list.innerHTML = events.map((event) => `
            <article class="timeline-event ${escapeHtml(event.severity)} ${event.acknowledged_at ? 'acknowledged' : ''}">
                <time datetime="${escapeHtml(event.created_at)}">${formatEventTime(event.created_at)}</time>
                <span class="timeline-marker" aria-hidden="true"></span>
                <div>
                    <strong>${escapeHtml(event.message)}</strong>
                    <small>${escapeHtml(event.source_type)} - ${escapeHtml(event.source_id)}</small>
                </div>
                ${event.severity === 'info'
                    ? '<span class="timeline-information">Info</span>'
                    : event.acknowledged_at
                    ? '<span class="timeline-acknowledged">Acknowledged</span>'
                    : `<button class="timeline-ack-button" type="button" data-ack-event="${escapeHtml(event.event_id)}">Acknowledge</button>`}
            </article>
        `).join('');
    };

    const loadEvents = async () => {
        try {
            const response = await fetch('/api/events?limit=10', {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.error);
            renderEvents(result.events);
        } catch (error) {
            summary.textContent = 'Unavailable';
            list.innerHTML = '<div class="timeline-empty error">Unable to load station events.</div>';
        }
    };

    list.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-ack-event]');
        if (!button) return;

        button.disabled = true;

        try {
            const response = await fetch(
                `/api/events/${encodeURIComponent(button.dataset.ackEvent)}/acknowledge`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ acknowledgedBy: 'StationOS operator' }),
                },
            );
            const result = await response.json();

            if (!response.ok) throw new Error(result.error);
            await loadEvents();
        } catch (error) {
            button.disabled = false;
            button.textContent = 'Retry';
        }
    });

    loadEvents();
    const refreshTimer = window.setInterval(loadEvents, 10000);
    window.addEventListener('pagehide', () => window.clearInterval(refreshTimer), { once: true });
});

document.querySelectorAll('[data-trend-chart]').forEach((chart) => {
    const series = chart.dataset.series;
    const sourceId = chart.dataset.sourceId;
    const unit = chart.dataset.unit || '';
    const line = chart.querySelector('[data-trend-line]');
    const area = chart.querySelector('[data-trend-area]');
    const valueLabel = chart.querySelector('[data-trend-value]');

    const renderTrend = (points) => {
        if (points.length === 0) {
            chart.classList.add('empty');
            valueLabel.textContent = 'No history';
            return;
        }

        const values = points.map((point) => Number(point.value));
        const minimum = Math.min(...values);
        const maximum = Math.max(...values);
        const range = maximum - minimum || 1;
        const coordinates = values.length === 1
            ? [[0, 56], [320, 56]]
            : values.map((value, index) => {
                const x = (index / (values.length - 1)) * 320;
                const y = 100 - (((value - minimum) / range) * 88);
                return [x, y];
            });
        const linePath = coordinates
            .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
            .join(' ');
        const latest = values.at(-1);

        line.setAttribute('d', linePath);
        area.setAttribute('d', `${linePath} L 320 110 L 0 110 Z`);
        valueLabel.textContent = `${latest.toFixed(series === 'battery_charge' ? 1 : 0)}${unit}`;
    };

    const loadTrend = async () => {
        if (
            (series === 'battery_charge' || series === 'room_pressure')
            && !sourceId
        ) {
            renderTrend([]);
            return;
        }

        const query = new URLSearchParams({ hours: '6' });
        if (sourceId) query.set('sourceId', sourceId);

        try {
            const response = await fetch(`/api/trends/${series}?${query}`, {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.error);
            renderTrend(result.points);
        } catch (error) {
            chart.classList.add('empty');
            valueLabel.textContent = 'Unavailable';
        }
    };

    loadTrend();
});
