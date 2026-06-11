const { stationState } = require('../helper/stationState_helper');
const { recordTelemetry } = require('../helper/database_helper');

const { formatDuration, weatherStatus, formatPressure, kelvinToCelsius, timeOfDay } = require('../helper/format_helper');
const {
    getInvalidNumericFields,
    hasOwn,
    isTelemetryFresh,
    toBinaryFlag,
    toFiniteNumber,
} = require('../helper/telemetry_helper');
const { detectWeatherEvents } = require('../helper/event_helper');

const weatherStaleMs = Number(process.env.WEATHER_STALE_MS || 15000);

function isWeatherFresh(weather = stationState.weather_monitor) {
    return isTelemetryFresh(weather.updatedAt, weatherStaleMs);
}

function getWeather(req, res) {
    return res.json({
        success: true,
        isFresh: isWeatherFresh(),
        weather: stationState.weather_monitor,
    });
}

function updateWeatherState(data) {
    const weather = stationState.weather_monitor;
    const previous = { ...weather };
    const weatherMode = toFiniteNumber(data.weatherMode);
    const isDay = toBinaryFlag(data.isDay);
    const timeOfDayValue = toFiniteNumber(data.timeOfDay);

    weather.weather_mode = weatherMode;
    weather.weather_event = weatherStatus(weatherMode);
    weather.nextEvent_raw = toFiniteNumber(data.nextEventTime);
    weather.nextEvent = formatDuration(data.nextEventTime);
    weather.nextWeatherHash = hasOwn(data, 'nextWeatherHash')
        ? toFiniteNumber(data.nextWeatherHash)
        : null;
    weather.windStrength = `${(toFiniteNumber(data.windStrength) * 100).toFixed(1)}%`;
    weather.weather_error = hasOwn(data, 'weather_error')
        ? toBinaryFlag(data.weather_error)
        : null;
    weather.daysSinceLastEvent = formatDuration(data.daysSinceLastEvent);
    weather.outsidePressure = formatPressure(data.outsidePressure);
    weather.outsideTemperature = kelvinToCelsius(data.outsideTemperature);
    weather.isNight = isDay ? "Day Time" : "Night Time";
    weather.horizontal = toFiniteNumber(data.horizontal).toFixed(2);
    weather.vertical = toFiniteNumber(data.vertical).toFixed(2);
    weather.timeOfDayRaw = Math.min(1, Math.max(0, timeOfDayValue));
    weather.timeOfDay = timeOfDay(weather.timeOfDayRaw);
    weather.daysPast = Math.max(0, Number(data.daysPast || 0) - 1);
    weather.dayLengthSeconds = formatDuration(data.dayLengthSeconds);
    weather.solarIrradiance = toFiniteNumber(data.solarIrradiance);
    weather.isEclipse = toBinaryFlag(data.isEclipse);
    weather.weatherSolarRatio = toFiniteNumber(data.weatherSolarRatio);
    weather.reportedFields = Object.keys(data);
    weather.updatedAt = new Date().toISOString();

    stationState.command.weather.isNight = !isDay;
    stationState.command.weather.isStorm = weatherMode === 2 || weatherMode === 1;
    detectWeatherEvents(previous, weather);

    return weather;
}

function weatherForecast(req, res) {
    const data = req.body;
    const invalidFields = getInvalidNumericFields(data, [
        'weatherMode',
        'nextEventTime',
        'nextWeatherHash',
        'windStrength',
        'weather_error',
        'daysSinceLastEvent',
        'outsidePressure',
        'outsideTemperature',
        'isDay',
        'horizontal',
        'vertical',
        'timeOfDay',
        'daysPast',
        'dayLengthSeconds',
        'solarIrradiance',
        'isEclipse',
        'weatherSolarRatio',
    ]);

    if (invalidFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Invalid numeric field(s): ${invalidFields.join(', ')}.`,
        });
    }

    const weather = updateWeatherState(data);
    recordTelemetry('weather', 'station', weather, weather.updatedAt);

    //console.table(weather);

    return res.status(200).json({ success: true, data: weather });
}

module.exports = {
    getWeather,
    isWeatherFresh,
    updateWeatherState,
    weatherForecast,
};
