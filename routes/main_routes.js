const router = require('express').Router();

const { getHashLookUp } = require('../controller/DataLookUp_controller');
const {
    powerGeneration_windTurbine,
    powerGeneration_battery,
} = require('../controller/powerGeneration_controller');
const {
    getCommand,
    getRoomCommand,
    setRoomLighting,
} = require('../controller/command_controller');
const {
    renderOverview,
    renderPower,
    renderRoom,
    renderWeather,
    renderSystemPage,
    getDashboardStatus,
} = require('../controller/page_controller');
const {
    getRoom,
    updateRoomTelemetry,
} = require('../controller/room_controller');

const {
    getWeather,
    weatherForecast,
} = require('../controller/weather_controller');
const {
    acknowledgeEvent,
    getEvents,
    getTrend,
} = require('../controller/operations_controller');

router.get('/', renderOverview);
router.get('/rooms/:id', renderRoom);
router.get('/power-generation', renderPower);
router.get('/atmos', renderSystemPage('atmos'));
router.get('/weather', renderWeather);
router.get('/manufacturing', renderSystemPage('manufacturing'));

router.get('/api/hash-lookup/:hash', getHashLookUp);
router.get('/api/dashboard-status', getDashboardStatus);
router.get('/api/events', getEvents);
router.post('/api/events/:eventId/acknowledge', acknowledgeEvent);
router.get('/api/trends/:series', getTrend);

// Power Generation
router.post('/api/wind-turbine', powerGeneration_windTurbine);
router.post('/api/battery/:batteryId', powerGeneration_battery);

router.get('/api/weather', getWeather);
router.post('/api/weather', weatherForecast);

router.get('/api/command', getCommand);
router.get('/api/command/:roomId', getRoomCommand);
router.post('/api/command/lighting', setRoomLighting);
router.post('/api/command/:roomId/lighting', setRoomLighting);

router.get('/api/room/:id', getRoom);
router.post('/api/room/:id', updateRoomTelemetry);

module.exports = router;
