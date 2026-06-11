const assert = require('node:assert/strict');
const test = require('node:test');

const {
    updateBatteryState,
    powerGeneration_battery,
} = require('../controller/powerGeneration_controller');
const {
    updateRoom,
    updateRoomTelemetry,
} = require('../controller/room_controller');
const {
    updateWeatherState,
    weatherForecast,
} = require('../controller/weather_controller');
const {
    acknowledgeStationEvent,
    loadStationEvents,
    loadTelemetryTrend,
    recordTelemetry,
} = require('../helper/database_helper');
const {
    stationState,
} = require('../helper/stationState_helper');

function resetState() {
    stationState.rooms = {};
    stationState.power_monitor.battery = {};
    stationState.command.weather.isNight = true;
    stationState.command.weather.isStorm = false;
}

function createResponse() {
    return {
        body: null,
        statusCode: 200,
        json(body) {
            this.body = body;
            return this;
        },
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
    };
}

test.beforeEach(resetState);

test('room numeric flags preserve false values from Lua', () => {
    const room = updateRoom('Corridor', {
        room: 'Main Corridor',
        occupied: 0,
        hazard: 0,
        pressure: 101.3,
        temperature: 293.15,
        oxygen: 0.21,
        nitrogen: 0.78,
        methane: 0,
        carbonDioxide: 0.01,
        pollution: 0,
        light_long: 4,
        light_led: 2,
        light_round: 3,
        light_round_small: 1,
        light_round_angled: 1,
        led_color: 11,
        total_lights: 11,
    });

    assert.equal(room.occupied, false);
    assert.equal(room.hazard, false);
    assert.equal(room.temperature, 20);
    assert.equal(room.round_lights, 5);
    assert.equal(room.total_lights, 11);
});

test('generation battery accepts the current Lua field name and infers its role', () => {
    const battery = updateBatteryState('GenerationStorage', {
        batteryLocation: 'Generation Storage',
        batteryCount: 2,
        ratio: 0.72,
        charge: 7200000,
        maximum: 10000000,
        powerActual: 4200,
        powerPotential: 8000,
        powerDelta: -2800000,
        batteryCharged: 0,
        batteryEmpty: 0,
        error: 0,
    });

    assert.equal(battery.battery_bank_location, 'Generation Storage');
    assert.equal(battery.bankRole, 'generation');
    assert.equal(battery.count, 2);
    assert.equal(battery.error, false);
});

test('weather preserves the intentional day offset and marks absent fields', () => {
    const weather = updateWeatherState({
        weatherMode: 0,
        nextEventTime: 480,
        windStrength: 0.42,
        daysSinceLastEvent: 1200,
        outsidePressure: 101.3,
        outsideTemperature: 293.15,
        isDay: 1,
        horizontal: 35.4,
        vertical: 62.8,
        timeOfDay: 0.325,
        daysPast: 14,
        dayLengthSeconds: 1200,
        solarIrradiance: 500,
        isEclipse: 0,
        weatherSolarRatio: 0.78,
    });

    assert.equal(weather.daysPast, 13);
    assert.equal(weather.nextWeatherHash, null);
    assert.equal(weather.weather_error, null);
    assert.equal(weather.outsideTemperature, 20);
});

test('invalid room numeric fields return 400', () => {
    const response = createResponse();

    updateRoomTelemetry({
        params: { id: 'Corridor' },
        body: { pressure: 'not-a-number' },
    }, response);

    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /pressure/);
});

test('invalid battery numeric fields return 400', () => {
    const response = createResponse();

    powerGeneration_battery({
        params: { batteryId: 'GenerationStorage' },
        body: { ratio: 'invalid' },
    }, response);

    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /ratio/);
});

test('invalid weather numeric fields return 400', () => {
    const response = createResponse();

    weatherForecast({
        body: { timeOfDay: 'invalid' },
    }, response);

    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /timeOfDay/);
});

test('battery threshold crossings create acknowledgeable events', async () => {
    updateBatteryState('StationStorage', {
        batteryBankType: 'Station Battery Storage',
        bankRole: 'station',
        batteryCount: 1,
        ratio: 0.3,
        charge: 300,
        maximum: 1000,
        error: 0,
    });
    updateBatteryState('StationStorage', {
        batteryBankType: 'Station Battery Storage',
        bankRole: 'station',
        batteryCount: 1,
        ratio: 0.2,
        charge: 200,
        maximum: 1000,
        error: 0,
    });

    const events = await loadStationEvents(20);
    const event = events.find((item) => (
        item.event_key === 'battery:StationStorage:charge-low'
    ));

    assert.ok(event);
    assert.equal(event.severity, 'warning');

    const acknowledged = await acknowledgeStationEvent(event.event_id, 'Test operator');
    assert.ok(acknowledged.acknowledged_at);
    assert.equal(acknowledged.acknowledged_by, 'Test operator');
});

test('in-memory telemetry supports trend data without a database', async () => {
    recordTelemetry('room', 'Corridor', {
        pressureRaw: 99.5,
    }, new Date().toISOString());
    recordTelemetry('room', 'Corridor', {
        pressureRaw: 101.2,
    }, new Date().toISOString());

    const points = await loadTelemetryTrend('room_pressure', 'Corridor', 1);

    assert.deepEqual(
        points.slice(-2).map((point) => point.value),
        [99.5, 101.2],
    );
});
