const {
    formatPressure,
    kelvinToCelsius,
    weatherStatus,
    formatDuration,
} = require("../helper/format_helper.js");

const {
    stationState,
    updateGenerationCommand,
} = require("../data/stationState");

async function PostWeatherData(req, res) {
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
}

async function GetWeatherData(req, res) {
    const weather = stationState.weather;

    res.render("weather", { weather });
}

module.exports = { PostWeatherData, GetWeatherData };
