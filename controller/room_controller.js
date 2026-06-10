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

function updateRoom(roomId, data) {
    if(!stationState.rooms[roomId]) {
        stationState.rooms[roomId] = createRoomState(roomId);
    }

    const room = stationState.rooms[roomId];
    room.room = data.room || room.room || roomId;
    room.occupied = Boolean(data.occupied);
    room.pressure = formatPressure(Number(data.pressure || 0));
    room.temperature = kelvinToCelsius(data.temperature);
    room.oxygen = Number((Number(data.oxygen || 0) * 100).toFixed(2));
    room.nitrogen = Number((Number(data.nitrogen || 0) * 100).toFixed(2));
    room.methane = Number((Number(data.methane || 0) * 100).toFixed(2));
    room.carbonDioxide = Number((Number(data.carbonDioxide || 0) * 100).toFixed(2));
    room.pollution = Number((Number(data.pollution || 0) * 100).toFixed(2));
    room.hazard = Boolean(data.hazard);
    room.light_colour = Number(data.light_colour ?? data.led_color ?? 0);
    room.long_lights = Number(data.long_lights ?? data.light_long ?? 0);
    room.round_lights = Number(
        data.round_lights
        ?? (
            Number(data.light_round || 0)
            + Number(data.light_round_small || 0)
            + Number(data.light_round_angled || 0)
        )
    );
    room.led_lights = Number(data.led_lights ?? data.light_led ?? 0);
    room.total_lights = Number(
        data.total_lights
        ?? (room.long_lights + room.round_lights + room.led_lights)
    );
    room.updatedAt = new Date().toISOString();

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
    });
}

function updateRoomTelemetry(req, res) {
    const roomId = req.params.id;
    const data = req.body;

    const roomData = updateRoom(roomId, data);
    recordTelemetry('room', roomId, roomData, roomData.updatedAt);

    return res.status(200).json({ success: true, room: roomData });
}

module.exports = {
    getRoom,
    updateRoomTelemetry,
};
