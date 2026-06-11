const {
    getLightColour,
    stationState,
} = require('../helper/stationState_helper');
const { isWeatherFresh } = require('./weather_controller');
const { recordStationEvent } = require('../helper/database_helper');

function getWeatherCommand() {
    if (isWeatherFresh()) {
        return {
            ...stationState.command.weather,
            stale: false,
        };
    }

    return {
        isNight: true,
        isStorm: true,
        stale: true,
    };
}

function getCommand(req, res) {
    return res.json({
        weather: getWeatherCommand(),
    });
}

function getRoomCommand(req, res) {
    const roomId = req.params.roomId;
    const lightColour = stationState.command.roomLighting[roomId] ?? null;

    return res.json({
        weather: getWeatherCommand(),
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
    const colour = getLightColour(value);

    recordStationEvent({
        eventKey: `room:${roomId}:lighting-command`,
        severity: 'info',
        sourceType: 'command',
        sourceId: roomId,
        message: `${roomId} lighting set to ${colour.name}`,
        metadata: { lightColour: value },
    });

    return res.status(200).json({
        success: true,
        room: {
            id: roomId,
            lightColour: value,
            colour,
        },
    });
}

module.exports = {
    getCommand,
    getRoomCommand,
    getWeatherCommand,
    setRoomLighting,
};
