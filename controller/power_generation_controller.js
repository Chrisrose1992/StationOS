const {
    formatPower,
    formatMols,
    formatPercent,
} = require("../helper/format_helper.js");

const {
    stationState,
    updatePowerNet,
    updateGenerationCommand,
} = require("../data/stationState");

function PostWindGeneration(req, res) {
    const data = req.body;
    const power = stationState.power_monitor;

    power.wind_power_w = Number(data.wind_power_w || 0);
    power.windTurbine_power = formatPower(power.wind_power_w);

    res.status(200).json(power);
}

function PostGridGeneration(req, res) {
    const data = req.body;
    const power = stationState.power_monitor;

    power.gfg_count = data.gfg_count;
    power.sfg_count = data.sfg_count;
    power.gfg_power_w = Number(data.gfg_power_w || 0);
    power.sfg_power_w = Number(data.sfg_power_w || 0);
    power.gfg_power = formatPower(data.gfg_power_w);
    power.sfg_power = formatPower(data.sfg_power_w);
    power.gfg_error = Boolean(data.gfg_error);
    power.sfg_error = Boolean(data.sfg_error);
    power.gfg_mols = Number(data.gfg_mols ?? power.gfg_mols);
    power.gfg_mols_label = formatMols(power.gfg_mols);
    power.sfg_coal_count = data.sfg_coal_count ?? power.sfg_coal_count;
    power.sfg_coal_capacity = Number(power.sfg_count || 0) * 500;

    updateGenerationCommand();

    res.status(200).json(power);
}

function PostBaseBattery(req, res) {
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
}

function PostPowerBanks(req, res) {
    const data = req.body;
    const postedBanks = data.banks || [];
    const banks = Array.isArray(postedBanks) ? postedBanks : Object.values(postedBanks);

    stationState.power_banks = banks.map(bank => ({
        id: bank.id,
        name: bank.name,

        ratio: Number(bank.ratio || 0),
        charge: formatPercent(bank.ratio),

        actual_power_out_w: Number(bank.actual_power_out_w || 0),
        actual_power_out: formatPower(bank.actual_power_out_w),

        potential_power_in_w: Number(bank.potential_power_in_w || 0),
        potential_power_in: formatPower(bank.potential_power_in_w),

        battery_error: Boolean(data.battery_error),

        online: Boolean(bank.online),
        count: Number(bank.count || 0)
    }));

    stationState.power_banks_summary = buildPowerBanksSummary(stationState.power_banks);

    res.status(200).json({
        banks: stationState.power_banks,
        summary: stationState.power_banks_summary
    });
}

function GetPower(req, res) {
    res.render("power", {
        data: stationState.power_monitor,
        generationCommand: stationState.generation_command,
        powerBanks: Object.values(stationState.power_banks),
        powerBanksSummary: stationState.power_banks_summary,
    });
}

function GetPowerBanks(req, res) {
    //res.render("power-banks", { power_banks: stationState.power_banks });
    res.render("test", { power_banks: stationState.power_banks });
}

function GetPowerBanksApi(req, res) {
    const banks = Object.values(stationState.power_banks);
    const summary = buildPowerBanksSummary(banks);

    res.json({ banks, summary });
}

function buildPowerBanksSummary(banks) {
    const totalCount = banks.reduce((sum, bank) => sum + Number(bank.count || 0), 0);
    const ratioTotal = banks.reduce((sum, bank) => {
        return sum + (Number(bank.ratio || 0) * Number(bank.count || 0));
    }, 0);
    const actualPowerOutW = banks.reduce((sum, bank) => sum + Number(bank.actual_power_out_w || 0), 0);
    const potentialPowerInW = banks.reduce((sum, bank) => sum + Number(bank.potential_power_in_w || 0), 0);
    const summaryRatio = totalCount > 0 ? ratioTotal / totalCount : 0;

    return {
        battery_count: totalCount,
        battery_ratio: summaryRatio,
        battery_charge: formatPercent(summaryRatio),
        actual_power_out_w: actualPowerOutW,
        actual_power_out: formatPower(actualPowerOutW),
        potential_power_in_w: potentialPowerInW,
        potential_power_in: formatPower(potentialPowerInW),
        online: totalCount > 0,
    };
}

module.exports = {
    PostWindGeneration,
    PostGridGeneration,
    PostBaseBattery,
    PostPowerBanks,
    GetPower,
    GetPowerBanks,
    GetPowerBanksApi,
};
