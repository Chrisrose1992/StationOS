const { stationState } = require('../helper/stationState_helper');
const { formatPower } = require('../helper/format_helper');

function powerGeneration_windTurbine(req, res) {
    const data = req.body;
    const windTurbine = stationState.power_monitor.wind_turbine;

    windTurbine.powerOutput = formatPower(data.powerOutput);
    windTurbine.windSpeed = `${(Number(data.windSpeed) * 100).toFixed(1)}%`;
    windTurbine.turbineSpeed = `${(Number(data.turbineSpeed) * 100).toFixed(1)}%`;

    return res.status(200).json({ success: true, data });
}

module.exports = { powerGeneration_windTurbine }