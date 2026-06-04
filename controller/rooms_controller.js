const { formatPressure, kelvinToCelsius } = require("../helper/format_helper.js");
const { stationState } = require("../data/stationState");
const { createRoomState } = require("../helper/StationState_helper");

function normalizeRoomId(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function roomTitle(roomId) {
    return roomId
        .split(/[-_]/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function getRoom(roomId) {
    const id = normalizeRoomId(roomId) || "hallway";

    if (!stationState.rooms[id]) {
        stationState.rooms[id] = createRoomState(roomTitle(id));
    }

    return stationState.rooms[id];
}

function updateRoom(roomId, data) {
    const room = getRoom(roomId);

    room.room = data.room || room.room || roomTitle(roomId);
    room.occupied = data.occupied;
    room.pressure = formatPressure(Number(data.pressure || 0));
    room.temperature = kelvinToCelsius(data.temperature);
    room.oxygen = Number((Number(data.oxygen || 0) * 100).toFixed(2));
    room.nitrogen = Number((Number(data.nitrogen || 0) * 100).toFixed(2));
    room.methane = Number((Number(data.methane || 0) * 100).toFixed(2));
    room.carbonDioxide = Number((Number(data.carbonDioxide || 0) * 100).toFixed(2));
    room.pollution = Number((Number(data.pollution || 0) * 100).toFixed(2));
    room.hazard = data.hazard;
    room.light_colour = data.light_colour;
    room.long_lights = data.long_lights;
    room.round_lights = data.round_lights;
    room.led_lights = data.led_lights;
    room.total_lights = data.total_lights;

    return room;
}

function GetRoomPage(req, res) {
    const roomId = normalizeRoomId(req.params.roomId || "hallway") || "hallway";
    const room = getRoom(roomId);

    res.render("hallway", {
        roomId,
        roomName: room.room || roomTitle(roomId),
        room,
    });
}

function GetRoomsApi(req, res) {
    res.json({
        rooms: stationState.rooms,
    });
}

function GetRoomApi(req, res) {
    const roomId = normalizeRoomId(req.params.roomId || "hallway") || "hallway";

    res.json(getRoom(roomId));
}

function PostRoomApi(req, res) {
    const roomId = normalizeRoomId(req.params.roomId || req.body.room_id || "hallway") || "hallway";

    res.status(200).json(updateRoom(roomId, req.body));
}

module.exports = {
    GetRoomPage,
    GetRoomsApi,
    GetRoomApi,
    PostRoomApi,
    getRoom,
    updateRoom,
};
