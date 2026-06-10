const {
    getLightColour,
    lightColours,
    stationState,
} = require('../helper/stationState_helper');

const {
    createPageData,
    getRooms,
    getSystemPage,
} = require('../helper/dashboard_helper');
const {
    formatEnergy,
    formatPower,
} = require('../helper/format_helper');

function renderOverview(req, res) {
    const rooms = getRooms();
    const hazardCount = rooms.filter((room) => room.hazard).length;

    return res.render('index', createPageData('Overview', 'dashboard', {
        rooms,
        hazardCount,
        weather: stationState.command.weather,
    }));
}

function renderRoom(req, res) {
    const roomId = req.params.id;
    const room = stationState.rooms[roomId];

    if (!room) {
        return res.status(404).render('404', createPageData('Room Not Found', 'room', {
            message: `Room "${roomId}" has not reported to the station.`,
        }));
    }

    const selectedLightColour = stationState.command.roomLighting[roomId]
        ?? room.light_colour;

    return res.render('room', createPageData(room.room || roomId, 'room', {
        activeRoomId: roomId,
        room,
        lightColour: getLightColour(room.light_colour),
        lightColours,
        selectedLightColour,
        selectedLightColourData: getLightColour(selectedLightColour),
    }));
}

function renderWeather(req, res) {
    return res.render('weather', createPageData('Weather', 'weather', {
        weather: stationState.weather_monitor,
    }));
}

function renderPower(req, res) {
    const power = stationState.power_monitor;
    const batteries = Object.values(power.battery);
    const totalCharge = batteries.reduce(
        (total, battery) => total + Number(battery.chargeRaw || 0),
        0,
    );
    const totalCapacity = batteries.reduce(
        (total, battery) => total + Number(battery.maximumRaw || 0),
        0,
    );
    const batteryCount = batteries.reduce(
        (total, battery) => total + Number(battery.count || 0),
        0,
    );
    const chargePercent = totalCapacity > 0
        ? Math.min(100, Math.max(0, (totalCharge / totalCapacity) * 100))
        : 0;
    const reportTimes = [
        power.wind_turbine.updatedAt,
        ...batteries.map((battery) => battery.updatedAt),
    ].filter(Boolean);
    const updatedAt = reportTimes.length > 0
        ? new Date(Math.max(...reportTimes.map((value) => new Date(value).getTime())))
            .toISOString()
        : null;

    return res.render('power', createPageData('Power Generation', 'power', {
        turbine: power.wind_turbine,
        batteries,
        summary: {
            hasTelemetry: Boolean(updatedAt),
            updatedAt,
            generatedPower: formatPower(power.wind_turbine.powerOutputRaw),
            storedEnergy: formatEnergy(totalCharge),
            totalCapacity: formatEnergy(totalCapacity),
            chargePercent,
            batteryCount,
            bankCount: batteries.length,
            errorCount: batteries.filter((battery) => battery.error).length,
        },
    }));
}

function renderSystemPage(pageId) {
    return (req, res) => {
        const page = getSystemPage(pageId);

        return res.render(
            'system-page',
            createPageData(page.title, page.activePage, page),
        );
    };
}

module.exports = {
    renderOverview,
    renderPower,
    renderRoom,
    renderWeather,
    renderSystemPage,
};
