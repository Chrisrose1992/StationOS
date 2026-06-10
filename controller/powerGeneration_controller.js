const { stationState, createBatteryState } = require('../helper/stationState_helper');
const {
    formatPower,
    formatEnergy,
    formatPercent,
    formatEnergyDeficit,
    batteryLevel,
    batteryStatus,
    chargeState,
} = require('../helper/format_helper');

function powerGeneration_windTurbine(req, res) {
    const data = req.body;
    const windTurbine = stationState.power_monitor.wind_turbine;

    windTurbine.powerOutputRaw = Number(data.powerOutput || 0);
    windTurbine.powerOutput = formatPower(data.powerOutput);
    windTurbine.windSpeed = `${(Number(data.windSpeed) * 100).toFixed(1)}%`;
    windTurbine.turbineSpeed = `${(Number(data.turbineSpeed) * 100).toFixed(1)}%`;
    windTurbine.updatedAt = new Date().toISOString();

    return res.status(200).json({ success: true, windTurbine });
}

function updateBatteryState(batteryId, data) {
    if (!stationState.power_monitor.battery[batteryId]) {
        stationState.power_monitor.battery[batteryId] =
            createBatteryState(batteryId);
    }

    const battery = stationState.power_monitor.battery[batteryId];

    const hasPreviousCharge = battery.updatedAt !== null;
    const previousCharge = battery.chargeRaw || 0;
    const currentCharge = Number(data.charge || 0);

    battery.battery_bank_location = data.batteryBankType || batteryId;
    battery.count = Number(data.batteryCount || 0);
    battery.status = batteryStatus(data.error, data.batteryCount);
    battery.chargeStatus = hasPreviousCharge
        ? chargeState(previousCharge, currentCharge)
        : "Idle";
    battery.chargeRaw = currentCharge;
    battery.ratioRaw = Number(data.ratio || 0);
    battery.ratio = formatPercent(data.ratio);
    battery.level = batteryLevel(data.ratio);
    battery.charge = formatEnergy(data.charge);
    battery.maximumRaw = Number(data.maximum || 0);
    battery.maximum = formatEnergy(data.maximum);
    battery.powerActualRaw = Number(data.powerActual || 0);
    battery.powerActual = formatPower(data.powerActual);
    battery.powerPotentialRaw = Number(data.powerPotential || 0);
    battery.powerPotential = formatPower(data.powerPotential);
    battery.energyDeficitRaw = Number(data.powerDelta || 0);
    battery.energyDeficit = formatEnergyDeficit(data.powerDelta);
    battery.charged = Number(data.batteryCharged) === 1;
    battery.empty = Number(data.batteryEmpty) === 1;
    battery.error = Number(data.error) === 1;
    battery.updatedAt = new Date().toISOString();

    return battery;
}

function powerGeneration_battery(req, res) {
    const batteryId = req.params.batteryId;
    const battery = updateBatteryState(batteryId, req.body || {});

    return res.status(200).json({ success: true, battery });
}

module.exports = { powerGeneration_windTurbine, powerGeneration_battery };
