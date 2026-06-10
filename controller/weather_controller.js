const { stationState } = require('../helper/stationState_helper');

const { formatDuration, weatherStatus, formatPressure, kelvinToCelsius, timeOfDay } = require('../helper/format_helper');


function weatherForecast(req, res) {
    const data = req.body;
    const weather = stationState.weather_monitor;
    const weatherMode = Number(data.weatherMode || 0);
    const isDay = Number(data.isDay) === 1;
    const timeOfDayValue = Number(data.timeOfDay || 0);

    weather.weather_mode = weatherMode;
    weather.weather_event = weatherStatus(weatherMode);
    weather.nextEvent_raw = data.nextEventTime;
    weather.nextEvent = formatDuration(data.nextEventTime);
    weather.nextWeatherHash = Number(data.nextWeatherHash || 0);
    weather.windStrength = `${(Number(data.windStrength) * 100).toFixed(1)}%`;
    weather.weather_error = Boolean(data.weather_error);
    weather.daysSinceLastEvent = formatDuration(data.daysSinceLastEvent);
    weather.outsidePressure = formatPressure(data.outsidePressure);
    weather.outsideTemperature = kelvinToCelsius(data.outsideTemperature);
    weather.isNight = isDay ? "Day Time" : "Night Time";
    weather.horizontal = Number(data.horizontal || 0).toFixed(2);
    weather.vertical = Number(data.vertical || 0).toFixed(2);
    weather.timeOfDay = timeOfDay(Number(timeOfDayValue).toFixed(2));
    weather.daysPast = Number(data.daysPast || 0);
    weather.dayLengthSeconds = formatDuration(data.dayLengthSeconds);
    weather.solarIrradiance = Number(data.solarIrradiance || 0);
    weather.isEclipse = Number(data.isEclipse) === 1;
    weather.weatherSolarRatio = Number(data.weatherSolarRatio || 0);
    weather.updatedAt = new Date().toISOString();

    stationState.command.weather.isNight = !isDay;
    stationState.command.weather.isStorm = weatherMode === 2 || weatherMode === 1;

    //console.table(weather);

    return res.status(200).json({ success: true, data: weather });
}

module.exports = { weatherForecast };
