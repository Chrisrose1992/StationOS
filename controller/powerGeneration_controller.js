const { stationState, createBatteryState } = require('../helper/stationState_helper');
const { recordTelemetry } = require('../helper/database_helper');
const {
    formatPower,
    formatEnergy,
    formatPercent,
    formatEnergyDeficit,
    batteryLevel,
    batteryStatus,
    chargeState,
} = require('../helper/format_helper');
const {
    getInvalidNumericFields,
    toBinaryFlag,
    toFiniteNumber,
} = require('../helper/telemetry_helper');
const { detectBatteryEvents } = require('../helper/event_helper');

function powerGeneration_windTurbine(req, res) {
    const data = req.body;
    const invalidFields = getInvalidNumericFields(data, [
        'powerOutput',
        'windSpeed',
        'turbineSpeed',
    ]);

    if (invalidFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Invalid numeric field(s): ${invalidFields.join(', ')}.`,
        });
    }

    const windTurbine = stationState.power_monitor.wind_turbine;

    windTurbine.powerOutputRaw = toFiniteNumber(data.powerOutput);
    windTurbine.powerOutput = formatPower(windTurbine.powerOutputRaw);
    windTurbine.windSpeed = `${(toFiniteNumber(data.windSpeed) * 100).toFixed(1)}%`;
    windTurbine.turbineSpeed = `${(toFiniteNumber(data.turbineSpeed) * 100).toFixed(1)}%`;
    windTurbine.reportedFields = Object.keys(data);
    windTurbine.updatedAt = new Date().toISOString();

    recordTelemetry(
        'wind_turbine',
        'station',
        windTurbine,
        windTurbine.updatedAt
    );

    return res.status(200).json({ success: true, windTurbine });
}

function updateBatteryState(batteryId, data) {
    if (!stationState.power_monitor.battery[batteryId]) {
        stationState.power_monitor.battery[batteryId] =
            createBatteryState(batteryId);
    }

    const battery = stationState.power_monitor.battery[batteryId];
    const previous = { ...battery };

    const hasPreviousCharge = battery.updatedAt !== null;
    const previousCharge = battery.chargeRaw || 0;
    const currentCharge = toFiniteNumber(data.charge);
    const requestedRole = String(data.bankRole || '').toLowerCase();
    const inferredRole = batteryId.toLowerCase().includes('generation')
        ? 'generation'
        : battery.bankRole;
    const bankRole = ['generation', 'station', 'storage'].includes(requestedRole)
        ? requestedRole
        : inferredRole;
    const batteryCount = Math.max(0, Math.floor(toFiniteNumber(data.batteryCount)));

    battery.battery_bank_location = data.batteryBankType
        || data.batteryLocation
        || batteryId;
    battery.bankRole = bankRole;
    battery.count = batteryCount;
    battery.status = batteryStatus(data.error, batteryCount);
    battery.chargeStatus = hasPreviousCharge
        ? chargeState(previousCharge, currentCharge)
        : "Idle";
    battery.chargeRaw = currentCharge;
    battery.ratioRaw = toFiniteNumber(data.ratio);
    battery.ratio = formatPercent(data.ratio);
    battery.level = batteryLevel(data.ratio);
    battery.charge = formatEnergy(data.charge);
    battery.maximumRaw = toFiniteNumber(data.maximum);
    battery.maximum = formatEnergy(data.maximum);
    battery.powerActualRaw = toFiniteNumber(data.powerActual);
    battery.powerActual = formatPower(data.powerActual);
    battery.powerPotentialRaw = toFiniteNumber(data.powerPotential);
    battery.powerPotential = formatPower(data.powerPotential);
    battery.energyDeficitRaw = toFiniteNumber(data.powerDelta);
    battery.energyDeficit = formatEnergyDeficit(data.powerDelta);
    battery.charged = toBinaryFlag(data.batteryCharged);
    battery.empty = toBinaryFlag(data.batteryEmpty);
    battery.error = toBinaryFlag(data.error);
    battery.reportedFields = Object.keys(data);
    battery.updatedAt = new Date().toISOString();
    detectBatteryEvents(batteryId, previous, battery);

    return battery;
}

function powerGeneration_battery(req, res) {
    const batteryId = req.params.batteryId;
    const data = req.body;
    const invalidFields = getInvalidNumericFields(data, [
        'batteryCount',
        'ratio',
        'charge',
        'maximum',
        'powerActual',
        'powerPotential',
        'powerDelta',
        'batteryCharged',
        'batteryEmpty',
        'error',
    ]);

    if (invalidFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Invalid numeric field(s): ${invalidFields.join(', ')}.`,
        });
    }

    const battery = updateBatteryState(batteryId, data);
    recordTelemetry('battery', batteryId, battery, battery.updatedAt);

    return res.status(200).json({ success: true, battery });
}

module.exports = {
    powerGeneration_battery,
    powerGeneration_windTurbine,
    updateBatteryState,
};
