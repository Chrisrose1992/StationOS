const {
    formatPressure,
    kelvinToCelsius
} = require('../helper/format_helper');

const {
    createRoomState,
    getLightColour,
    stationState,
} = require('../helper/stationState_helper');
const { recordTelemetry } = require('../helper/database_helper');
const {
    getInvalidNumericFields,
    isTelemetryFresh,
    toBinaryFlag,
    toFiniteNumber,
} = require('../helper/telemetry_helper');
const { detectRoomEvents } = require('../helper/event_helper');

function updateRoom(roomId, data) {
    if(!stationState.rooms[roomId]) {
        stationState.rooms[roomId] = createRoomState(roomId);
    }

    const room = stationState.rooms[roomId];
    const previous = { ...room };
    room.room = data.room || room.room || roomId;
    room.occupied = toBinaryFlag(data.occupied);
    room.pressureRaw = toFiniteNumber(data.pressure);
    room.pressure = formatPressure(room.pressureRaw);
    room.temperature = kelvinToCelsius(data.temperature);
    room.oxygen = Number((toFiniteNumber(data.oxygen) * 100).toFixed(2));
    room.nitrogen = Number((toFiniteNumber(data.nitrogen) * 100).toFixed(2));
    room.methane = Number((toFiniteNumber(data.methane) * 100).toFixed(2));
    room.carbonDioxide = Number((toFiniteNumber(data.carbonDioxide) * 100).toFixed(2));
    room.pollution = Number((toFiniteNumber(data.pollution) * 100).toFixed(2));
    room.hazard = toBinaryFlag(data.hazard);
    room.light_colour = toFiniteNumber(data.light_colour ?? data.led_color);
    room.long_lights = toFiniteNumber(data.long_lights ?? data.light_long);
    room.round_lights = Number(
        data.round_lights
        ?? (
            toFiniteNumber(data.light_round)
            + toFiniteNumber(data.light_round_small)
            + toFiniteNumber(data.light_round_angled)
        )
    );
    room.led_lights = toFiniteNumber(data.led_lights ?? data.light_led);
    room.total_lights = toFiniteNumber(
        data.total_lights
        ?? (room.long_lights + room.round_lights + room.led_lights)
    );
    room.reportedFields = Object.keys(data);
    room.updatedAt = new Date().toISOString();
    detectRoomEvents(roomId, previous, room);

    return room;
}

function getRoom(req, res) {
    const roomId = req.params.id;
    const roomData = stationState.rooms[roomId];

    if (!roomData) {
        return res.status(404).json({
            success: false,
            error: `Room "${roomId}" has not reported to the station.`,
        });
    }

    return res.json({
        success: true,
        room: {
            id: roomId,
            ...roomData,
        },
        lightColour: getLightColour(roomData.light_colour),
        isFresh: isTelemetryFresh(roomData.updatedAt),
    });
}

function updateRoomTelemetry(req, res) {
    const roomId = req.params.id;
    const data = req.body;
    const invalidFields = getInvalidNumericFields(data, [
        'occupied',
        'pressure',
        'temperature',
        'oxygen',
        'nitrogen',
        'methane',
        'carbonDioxide',
        'pollution',
        'hazard',
        'light_colour',
        'led_color',
        'long_lights',
        'light_long',
        'round_lights',
        'light_round',
        'light_round_small',
        'light_round_angled',
        'led_lights',
        'light_led',
        'total_lights',
    ]);

    if (invalidFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Invalid numeric field(s): ${invalidFields.join(', ')}.`,
        });
    }

    const roomData = updateRoom(roomId, data);
    recordTelemetry('room', roomId, roomData, roomData.updatedAt);

    return res.status(200).json({ success: true, room: roomData });
}

module.exports = {
    getRoom,
    updateRoom,
    updateRoomTelemetry,
};
