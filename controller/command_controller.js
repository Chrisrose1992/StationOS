const {
    getLightColour,
    stationState,
} = require('../helper/stationState_helper');

function getCommand(req, res) {
    return res.json({
        weather: stationState.command.weather,
    });
}

function getRoomCommand(req, res) {
    const roomId = req.params.roomId;
    const lightColour = stationState.command.roomLighting[roomId] ?? null;

    return res.json({
        weather: stationState.command.weather,
        room: {
            id: roomId,
            lightColour,
            colour: lightColour === null ? null : getLightColour(lightColour),
        },
    });
}

function setRoomLighting(req, res) {
    const roomId = String(req.params.roomId || req.body.roomId || '').trim();
    const value = Number(req.body.value);

    if (!roomId) {
        return res.status(400).json({
            success: false,
            error: 'roomId is required.',
        });
    }

    if (!Number.isInteger(value) || value < 1 || value > 11) {
        return res.status(400).json({
            success: false,
            error: 'value must be an integer from 1 to 11.',
        });
    }

    stationState.command.roomLighting[roomId] = value;

    return res.status(200).json({
        success: true,
        room: {
            id: roomId,
            lightColour: value,
            colour: getLightColour(value),
        },
    });
}

module.exports = {
    getCommand,
    getRoomCommand,
    setRoomLighting,
};
