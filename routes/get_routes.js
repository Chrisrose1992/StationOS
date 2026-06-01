const router = require('express').Router();

const {
    stationState,
    updateGenerationCommand,
    buildAlerts,
} = require("../data/stationState");
const stationeersHashLookup = require("../souce/stationeers_hash_lookup.json");

function normalizeHash(value) {
    if (typeof value !== "string" || value.trim() === "") {
        return null;
    }

    const hash = value.trim();

    if (/^0x[0-9a-f]+$/i.test(hash)) {
        return String(parseInt(hash, 16) | 0);
    }

    if (/^-?\d+$/.test(hash)) {
        return hash;
    }

    return null;
}

router.get("/power", (req, res) => {
    res.render("power", {
        data: stationState.power_monitor,
    });
});

router.get("/api/generation_command", (req, res) => {
    res.json(updateGenerationCommand());
});

router.get("/api/commands", (req, res) => {
    res.json(updateGenerationCommand());
});

router.get("/api/environment_command", (req, res) => {
    const weather = stationState.weather;
    const weatherMode = Number(weather.weather_mode);

    res.json({
        is_night: weather.isNight === "Night Time",
        storm_active: weatherMode === 1 || weatherMode === 2,
        weather_mode: weatherMode,
        weather_status: weather.weather_status,
    });
});

router.get("/api/alerts", (req, res) => {
    res.json({
        alerts: buildAlerts(),
    });
});

router.get("/api/hash-lookup/:hash", (req, res) => {
    const hash = normalizeHash(req.params.hash);

    if (!hash) {
        return res.status(400).json({
            error: "Hash must be a signed decimal value or hex CRC32 value.",
        });
    }

    const name = stationeersHashLookup[hash];

    if (!name) {
        return res.status(404).json({
            error: "Hash not found",
            hash,
        });
    }

    res.json({
        hash,
        name,
    });
});

router.get("/api/hash-lookup", (req, res) => {
    const hash = normalizeHash(req.query.hash);

    if (!hash) {
        return res.status(400).json({
            error: "Use /api/hash-lookup/:hash or provide ?hash=.",
        });
    }

    const name = stationeersHashLookup[hash];

    if (!name) {
        return res.status(404).json({
            error: "Hash not found",
            hash,
        });
    }

    res.json({
        hash,
        name,
    });
});

module.exports = router;
