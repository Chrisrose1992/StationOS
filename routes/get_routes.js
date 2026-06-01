const router = require('express').Router();

const {
    stationState,
    updateGenerationCommand,
    buildAlerts,
} = require("../data/stationState");

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

module.exports = router;
