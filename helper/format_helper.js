function formatPressure(p) {

    if (p >= 1000)
        return `${(p / 1000).toFixed(2)} MPa`;

    return `${p.toFixed(1)} kPa`;

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

function formatPower(watts) {
    const value = Number(watts || 0);

    if (Math.abs(value) >= 1000000) {
        return `${(value / 1000000).toFixed(2)} MW`;
    }

    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(2)} kW`;
    }

    return `${value.toFixed(0)} W`;
}

function updatePowerNet(power_actual_in_w, power_required_out_w) {

    let net_power_w = Number(power_actual_in_w || 0) - Number(power_required_out_w || 0);
    net_power_w = formatPower(net_power_w);

    return net_power_w;
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

function formatPercent(ratio) {
    return `${(Number(ratio || 0) * 100).toFixed(0)}%`;
}

module.exports = {
    formatPressure,
    kelvinToCelsius,
    weatherStatus,
    formatDuration,
    formatPower,
    formatMols,
    updatePowerNet,
    formatPercent,
};