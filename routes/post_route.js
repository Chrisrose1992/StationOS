const router = require("express").Router();
const { stationState } = require("../data/stationState");
const roomsController = require("../controller/rooms_controller");

router.get("/", (req, res) => {
    res.render("index", {
        station: stationState,
    });
});

router.get("/base-status", (req, res) => {
    res.render("base-status", {
        base: stationState.base_status,
    });
});

router.get("/hallway", roomsController.GetRoomPage);
router.get("/rooms/:roomId", roomsController.GetRoomPage);

router.get("/workshop", (req, res) => {
    res.render("workshop", {
        printers: Object.values(stationState.workshop.printers),
    });
});

router.get("/api/station", (req, res) => {
    res.json(stationState);
});

router.get("/api/power_monitor", (req, res) => {
    res.json(stationState.power_monitor);
});

router.get("/api/weather", (req, res) => {
    res.json(stationState.weather);
});

router.get("/api/hallway", (req, res) => {
    req.params.roomId = "hallway";
    roomsController.GetRoomApi(req, res);
});

router.get("/api/rooms", roomsController.GetRoomsApi);
router.get("/api/rooms/:roomId", roomsController.GetRoomApi);

router.get("/api/base-status", (req, res) => {
    res.json(stationState.base_status);
});


router.get("/api/workshop/printers", (req, res) => {
    res.json({
        printers: Object.values(stationState.workshop.printers),
    });
});

router.post("/api/base-status", (req, res) => {
    const data = req.body;
    const now = new Date().toISOString();

    stationState.base_status = {
        base_id: String(data.base_id || data.id || stationState.base_status.base_id || "base"),
        last_seen: now,
        version: String(data.version || ""),
        world_name: String(data.world_name || data.world || ""),
        session_id: String(data.session_id || ""),
        online: data.online === undefined ? true : Boolean(data.online),
    };

    res.status(200).json(stationState.base_status);
});

router.post("/api/workshop/printers", (req, res) => {
    const printers = Array.isArray(req.body.printers) ? req.body.printers : [];
    const now = new Date().toISOString();

    printers.forEach((printer, index) => {
        const id = String(printer.id || printer.printer_id || `printer_${index + 1}`);

        stationState.workshop.printers[id] = {
            id,
            name: String(printer.name || id),
            type: String(printer.type || "printer"),
            online: printer.online === undefined ? true : Boolean(printer.online),
            active: Boolean(printer.active),
            recipe_hash: Number(printer.recipe_hash || 0),
            recipe_name: printer.recipe_name || null,
            print_amount: Number(printer.print_amount || 0),
            printed_count: Number(printer.printed_count || 0),
            completion: Number(printer.completion || 0),
            last_seen: now,
        };
    });

    res.status(200).json({
        printers: Object.values(stationState.workshop.printers),
    });
});


router.post("/api/hallway", (req, res) => {
    req.params.roomId = "hallway";
    roomsController.PostRoomApi(req, res);
});
router.post("/api/rooms/:roomId", roomsController.PostRoomApi);

module.exports = router;
