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
const { isWeatherFresh } = require('./weather_controller');
const { getWeatherCommand } = require('./command_controller');
const { isTelemetryFresh } = require('../helper/telemetry_helper');

function getDashboardLiveToken() {
    const power = stationState.power_monitor;

    return JSON.stringify({
        batteries: Object.entries(power.battery).map(([id, battery]) => [
            id,
            battery.updatedAt,
            isTelemetryFresh(battery.updatedAt),
        ]),
        rooms: Object.entries(stationState.rooms).map(([id, room]) => [
            id,
            room.updatedAt,
            isTelemetryFresh(room.updatedAt),
        ]),
        turbine: [
            power.wind_turbine.updatedAt,
            isTelemetryFresh(power.wind_turbine.updatedAt),
        ],
        weather: [
            stationState.weather_monitor.updatedAt,
            isWeatherFresh(),
        ],
    });
}

function getDashboardStatus(req, res) {
    return res.json({
        success: true,
        token: getDashboardLiveToken(),
    });
}

function renderOverview(req, res) {
    const rooms = getRooms();
    const batteries = Object.values(stationState.power_monitor.battery);
    const trendBattery = batteries.find((battery) => battery.bankRole === 'station')
        || batteries[0]
        || null;
    const hazardCount = rooms.filter((room) => room.hazard).length;
    const staleRoomCount = rooms.filter((room) => !room.isFresh).length;
    const weather = getWeatherCommand();
    const alertCount = hazardCount + staleRoomCount + (weather.stale ? 1 : 0);

    return res.render('index', createPageData('Overview', 'dashboard', {
        alertCount,
        liveToken: getDashboardLiveToken(),
        rooms,
        hazardCount,
        staleRoomCount,
        trendSources: {
            battery: trendBattery?.id || null,
            room: rooms[0]?.id || null,
        },
        weather,
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
        roomIsFresh: isTelemetryFresh(room.updatedAt),
    }));
}

function renderWeather(req, res) {
    const weatherFresh = isWeatherFresh();

    return res.render('weather', createPageData('Weather', 'weather', {
        isWeatherFresh: weatherFresh,
        weather: stationState.weather_monitor,
    }));
}

function renderPower(req, res) {
    const power = stationState.power_monitor;
    const roleOrder = {
        generation: 0,
        station: 1,
        storage: 2,
    };
    const batteries = Object.values(power.battery).map((battery) => ({
        ...battery,
        isFresh: isTelemetryFresh(battery.updatedAt),
    })).sort((left, right) => (
        (roleOrder[left.bankRole] ?? 99) - (roleOrder[right.bankRole] ?? 99)
        || left.battery_bank_location.localeCompare(right.battery_bank_location)
    ));
    const totalCharge = batteries.reduce(
        (total, battery) => total + Number(battery.chargeRaw || 0),
        0,
    );
    const totalCapacity = batteries.reduce(
        (total, battery) => total + Number(battery.maximumRaw || 0),
        0,
    );
    const stationBatteries = batteries.filter(
        (battery) => battery.bankRole === 'station',
    );
    const chargeBatteries = stationBatteries.length > 0
        ? stationBatteries
        : batteries;
    const chargeBankTotal = chargeBatteries.reduce(
        (total, battery) => total + Number(battery.chargeRaw || 0),
        0,
    );
    const chargeBankCapacity = chargeBatteries.reduce(
        (total, battery) => total + Number(battery.maximumRaw || 0),
        0,
    );
    const batteryCount = batteries.reduce(
        (total, battery) => total + Number(battery.count || 0),
        0,
    );
    const chargePercent = chargeBankCapacity > 0
        ? Math.min(100, Math.max(0, (chargeBankTotal / chargeBankCapacity) * 100))
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
            liveToken: getDashboardLiveToken(),
            updatedAt,
            generatedPower: formatPower(power.wind_turbine.powerOutputRaw),
            storedEnergy: formatEnergy(totalCharge),
            totalCapacity: formatEnergy(totalCapacity),
            chargePercent,
            chargeScope: stationBatteries.length > 0
                ? 'Station storage after transformer'
                : 'Across reporting battery banks',
            batteryCount,
            bankCount: batteries.length,
            errorCount: batteries.filter((battery) => battery.error).length,
            staleCount: batteries.filter((battery) => !battery.isFresh).length,
            turbineHasTelemetry: Boolean(power.wind_turbine.updatedAt),
            turbineIsFresh: isTelemetryFresh(power.wind_turbine.updatedAt),
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
    getDashboardStatus,
    renderOverview,
    renderPower,
    renderRoom,
    renderWeather,
    renderSystemPage,
};
