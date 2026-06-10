const { stationState } = require('./stationState_helper');

const systemPages = {
    power: {
        title: 'Power Generation',
        activePage: 'power',
        eyebrow: 'Station energy',
        heading: 'Power generation',
        description: 'Monitor generation capacity, battery storage and station demand.',
        metrics: [
            { label: 'Power generated', value: '0 W', note: 'Current output' },
            { label: 'Power required', value: '0 W', note: 'Station demand' },
            { label: 'Net power', value: '0 W', note: 'Generation minus demand', className: 'text-green' },
            { label: 'Battery charge', value: '0%', note: 'Stored capacity' },
        ],
        emptyIcon: 'PWR',
        emptyTitle: 'No power telemetry yet',
        emptyMessage: 'Power devices will appear here after they report to the server.',
    },
    atmos: {
        title: 'Atmospherics',
        activePage: 'atmos',
        eyebrow: 'Gas management',
        heading: 'Atmospherics',
        description: 'Track filtration, storage and atmospheric network conditions.',
        metrics: [
            { label: 'Network pressure', value: '0 kPa', note: 'Main pipe network' },
            { label: 'Gas stored', value: '0 mol', note: 'Across connected tanks' },
            { label: 'Active filters', value: '0', note: 'Operating filtration units' },
            { label: 'System alerts', value: '0', note: 'No active warnings', className: 'text-green' },
        ],
        emptyIcon: 'ATM',
        emptyTitle: 'No atmospherics telemetry yet',
        emptyMessage: 'Atmospheric devices will appear here after they report to the server.',
    },
    weather: {
        title: 'Weather',
        activePage: 'weather',
        eyebrow: 'External conditions',
        heading: 'Weather monitoring',
        description: 'Review daylight, storm activity and external environmental conditions.',
        metrics: [
            { label: 'Wind speed', value: '0 m/s', note: 'Current reading' },
            { label: 'Visibility', value: 'Unknown', note: 'Awaiting sensor data' },
        ],
        emptyIcon: 'WX',
        emptyTitle: 'No weather telemetry yet',
        emptyMessage: 'Weather history and forecasts will appear once sensors report data.',
    },
    manufacturing: {
        title: 'Manufacturing',
        activePage: 'manufacturing',
        eyebrow: 'Production systems',
        heading: 'Manufacturing',
        description: 'Monitor production machines, job queues and material availability.',
        metrics: [
            { label: 'Active machines', value: '0', note: 'Currently producing' },
            { label: 'Queued jobs', value: '0', note: 'Waiting for production' },
            { label: 'Completed today', value: '0', note: 'Finished products' },
            { label: 'System faults', value: '0', note: 'No reported faults', className: 'text-green' },
        ],
        emptyIcon: 'MFG',
        emptyTitle: 'No manufacturing telemetry yet',
        emptyMessage: 'Production machines and queues will appear after they report to the server.',
    },
};

function getRooms() {
    return Object.entries(stationState.rooms).map(([id, roomData]) => ({
        ...roomData,
        id,
        name: roomData.room || id,
        hazard: Boolean(roomData.hazard),
    }));
}

function createPageData(title, activePage, extra = {}) {
    return {
        title,
        activePage,
        activeRoomId: null,
        rooms: getRooms(),
        ...extra,
    };
}

function getSystemPage(pageId) {
    const page = systemPages[pageId];

    if (!page) {
        return null;
    }

    if (pageId !== 'weather') {
        return page;
    }

    return {
        ...page,
        metrics: [
            {
                label: 'Cycle',
                value: stationState.command.weather.isNight ? 'Night' : 'Day',
                note: 'Current light cycle',
            },
            {
                label: 'Storm status',
                value: stationState.command.weather.isStorm ? 'Active' : 'Clear',
                note: 'External storm sensor',
            },
            ...page.metrics,
        ],
    };
}

module.exports = {
    createPageData,
    getRooms,
    getSystemPage,
};
