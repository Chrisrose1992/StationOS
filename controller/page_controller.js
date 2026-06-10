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
    renderRoom,
    renderWeather,
    renderSystemPage,
};
