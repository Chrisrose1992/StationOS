const { stationState } = require("../helper/StationState_helper");
const { formatPower } = require("../helper/format_helper");
const { updateGenerationCommand } = require("../helper/command_helper");


function formatPercent(ratio) {
    return `${(Number(ratio || 0) * 100).toFixed(0)}%`;
}

function updatePowerNet() {
    const power = stationState.power_monitor;

    power.net_power_w = Number(power.power_actual_in_w || 0) - Number(power.power_required_out_w || 0);
    power.net_power = formatPower(power.net_power_w);

    return power.net_power_w;
}

function kelvinToCelsius(kelvin) {
    return Number((Number(kelvin || 0) - 273).toFixed(2));
}

function weatherStatus(mode) {
    const weatherMode = Number(mode);

    if (weatherMode === 0) {
        return "No Storm";
    }

    if (weatherMode === 1) {
        return "Storm Incoming";
    }

    if (weatherMode === 2) {
        return "Storm In Progress";
    }

    return "Unknown";
}

function formatDuration(seconds) {
    const totalSeconds = Math.max(0, Math.floor(Number(seconds || 0)));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }

    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
}

function formatMols(mols) {
    const value = Number(mols || 0);

    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(2)} kmol`;
    }

    if (Math.abs(value) >= 10) {
        return `${value.toFixed(1)} mol`;
    }

    return `${value.toFixed(2)} mol`;
}

function formatPressure(p) {

    if (p >= 1000)
        return `${(p / 1000).toFixed(2)} MPa`;

    return `${p.toFixed(1)} kPa`;

}

function buildAlerts() {
    const alerts = [];
    const power = stationState.power_monitor;
    const weather = stationState.weather;
    const rooms = Object.values(stationState.rooms || {});
    const weatherMode = Number(weather.weather_mode || 0);
    const batteryCharge = Number(power.battery_charge_percent || 0);
    const hasBatteryData = Number(power.battery_count || 0) > 0 || batteryCharge > 0;

    if (weather.weather_error) {
        alerts.push({
            level: "danger",
            title: "Weather station error",
            message: "Weather station is reporting an error.",
        });
    }

    if (weatherMode === 2) {
        alerts.push({
            level: "danger",
            title: "Storm in progress",
            message: weather.weather_next_event_label
                ? `Current event window: ${weather.weather_next_event_label}`
                : "Weather station reports an active storm.",
        });
    } else if (weatherMode === 1) {
        alerts.push({
            level: "warn",
            title: "Storm incoming",
            message: weather.weather_next_event_label
                ? `Arrives in ${weather.weather_next_event_label}`
                : "Weather station reports an incoming storm.",
        });
    }

    rooms
        .filter(room => room.hazard === 1 || room.hazard === true)
        .forEach(room => {
            alerts.push({
                level: "danger",
                title: "Toxic gas detected",
                message: room.room ? `${room.room} atmosphere is hazardous.` : "Room atmosphere is hazardous.",
            });
        });

    if (hasBatteryData && batteryCharge <= 20) {
        alerts.push({
            level: "danger",
            title: "Low battery",
            message: `Battery bank is at ${power.battery_charge}.`,
        });
    } else if (hasBatteryData && batteryCharge <= 35) {
        alerts.push({
            level: "warn",
            title: "Battery reserve low",
            message: `Battery bank is at ${power.battery_charge}.`,
        });
    }

    if (Number(power.net_power_w || 0) < 0) {
        alerts.push({
            level: "warn",
            title: "Power deficit",
            message: `Net power is ${power.net_power}.`,
        });
    }

    if (power.battery_error) {
        alerts.push({
            level: "danger",
            title: "Battery error",
            message: "Battery system is reporting an error.",
        });
    }

    if (power.gfg_error) {
        alerts.push({
            level: "warn",
            title: "Gas generator error",
            message: "Gas fuel generator is reporting an error.",
        });
    }

    if (power.sfg_error) {
        alerts.push({
            level: "warn",
            title: "Solid generator error",
            message: "Solid fuel generator is reporting an error.",
        });
    }

    return alerts;
}

module.exports = {
    stationState,
    formatPower,
    formatPercent,
    updatePowerNet,
    updateGenerationCommand,
    kelvinToCelsius,
    weatherStatus,
    formatDuration,
    formatPressure,
    formatMols,
    buildAlerts,
};
