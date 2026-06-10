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
                'temperature',
                'oxygen',
                'total_lights',
                'light_colour',
                'long_lights',
                'round_lights',
                'led_lights',
            ].forEach((field) => setField(field, room[field]));

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
            status.className = 'live-status connected';
            status.textContent = `Live · updated ${updatedAt.toLocaleTimeString()}`;
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
