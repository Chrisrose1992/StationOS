const router = require("express").Router();
const {
    stationState,
    formatPower,
    updatePowerNet,
    updateGenerationCommand,
    kelvinToCelsius,
    weatherStatus,
    formatDuration,
    formatPressure,
    formatMols,
} = require("../data/stationState");

router.get("/", (req, res) => {
    res.render("index");
});


router.get("/weather", (req, res) => {
    res.render("weather");
});

router.get("/hallway", (req, res) => {
    res.render("hallway");
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
    res.json(stationState.hallway);
});

router.post("/api/battery", (req, res) => {
    const data = req.body;
    const power = stationState.power_monitor;
    const batteryCharge = Number(data.battery_ratio || 0) * 100;

    power.has_battery_data = true;
    power.battery_count = data.battery_count;
    power.battery_charge_percent = batteryCharge;
    power.battery_charge = batteryCharge.toFixed(0) + "%";
    power.battery_error = Boolean(data.battery_error);
    power.power_actual_in_w = Number(data.power_actual_in_w || 0);
    power.power_actual_out_w = Number(data.power_actual_out_w || 0);
    power.power_required_out_w = Number(data.power_required_out_w || 0);
    power.power_actual_in = formatPower(data.power_actual_in_w);
    power.power_actual_out = formatPower(data.power_actual_out_w);
    power.power_required = formatPower(data.power_required_out_w);

    updatePowerNet();
    updateGenerationCommand();

    res.status(200).json(power);
});

router.post("/api/grid_generation", (req, res) => {
    const data = req.body;
    const power = stationState.power_monitor;

    power.gfg_count = data.gfg_count;
    power.sfg_count = data.sfg_count;
    power.gfg_power_w = Number(data.gfg_power_w || 0);
    power.sfg_power_w = Number(data.sfg_power_w || 0);
    power.wind_power_w = Number(data.wind_power_w || 0);
    power.gfg_power = formatPower(data.gfg_power_w);
    power.sfg_power = formatPower(data.sfg_power_w);
    power.windTurbine_power = formatPower(data.wind_power_w);
    power.gfg_error = Boolean(data.gfg_error);
    power.sfg_error = Boolean(data.sfg_error);
    power.gfg_mols = Number(data.gfg_mols ?? power.gfg_mols);
    power.gfg_mols_label = formatMols(power.gfg_mols);
    power.sfg_coal_count = data.sfg_coal_count ?? power.sfg_coal_count;
    power.sfg_coal_capacity = Number(power.sfg_count || 0) * 500;

    updateGenerationCommand();

    res.status(200).json(power);
});

router.post("/api/wind_generation", (req, res) => {
    const data = req.body;
    const power = stationState.power_monitor;

    power.wind_power_w = Number(data.wind_power_w || 0);
    power.windTurbine_power = formatPower(power.wind_power_w);

    res.status(200).json({
        wind_power_w: power.wind_power_w,
        windTurbine_power: power.windTurbine_power,
    });
});

router.post("/api/weather", (req, res) => {
    const data = req.body;
    const weather = stationState.weather;

    weather.isNight = Number(data.isNight) === 1 ? "Day Time" : "Night Time";
    weather.Horizontal = Number(data.Horizontal).toFixed(2);
    weather.Vertical   = Number(data.Vertical).toFixed(2);
    weather.weather_mode = data.weather_mode;
    weather.weather_status = weatherStatus(data.weather_mode);
    weather.weather_powered = data.weather_powered;
    weather.weather_error = Boolean(data.weather_error);
    weather.weather_next_event = data.weather_next_event;
    weather.weather_next_event_label = formatDuration(data.weather_next_event);
    weather.solar_radiance = Number(data.solar_radiance || 0).toFixed(2);
    weather.outdoor_pressure = formatPressure(data.outdoor_pressure);
    weather.outdoor_temperature = kelvinToCelsius(data.outdoor_temperature);

    updateGenerationCommand();

    res.status(200).json(weather);
});

router.post("/api/hallway", (req, res) => {
    const data = req.body;
    const hallway = stationState.hallway;

    hallway.room = data.room;
    hallway.occupied = data.occupied;
    hallway.pressure = formatPressure(data.pressure);
    hallway.temperature = kelvinToCelsius(data.temperature);
    hallway.oxygen = Number(data.oxygen * 100).toFixed(2);
    hallway.nitrogen = Number(data.nitrogen * 100).toFixed(2);
    hallway.methane = Number(data.methane * 100).toFixed(2);
    hallway.carbonDioxide = Number(data.carbonDioxide * 100).toFixed(2);
    hallway.pollution = Number(data.pollution * 100).toFixed(2);
    hallway.hazard = data.hazard;
    hallway.light_colour = data.light_colour;
    hallway.long_lights = data.long_lights;
    hallway.round_lights = data.round_lights;
    hallway.led_lights = data.led_lights;
    hallway.total_lights = data.total_lights;

    res.status(200).json(hallway);
});

module.exports = router;
