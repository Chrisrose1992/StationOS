const { stationState } = require("./StationState_helper");

function commandGenerationOn(command, power, reason) {
    const solidHasCoal = Number(power.sfg_coal_count || 0) > 0;

    command.action = "generation_on";
    command.gas_fuel_enabled = !power.gfg_error;
    command.solid_fuel_enabled = solidHasCoal;
    command.enabled = command.gas_fuel_enabled || command.solid_fuel_enabled;
    command.diagnostics = {
        battery_charge_percent: power.battery_charge_percent,
        gfg_error: power.gfg_error,
        sfg_error: power.sfg_error,
        sfg_coal_count: power.sfg_coal_count,
        sfg_has_coal: solidHasCoal,
    };

    if (!command.enabled) {
        command.action = "generation_off";
        command.target = "none";
        command.reason = `${reason}, no available fuel generators`;
        return command;
    }

    if (command.gas_fuel_enabled && command.solid_fuel_enabled) {
        command.target = "all_fuel";
        command.reason = `${reason}, using gas and solid fuel`;
        return command;
    }

    if (command.gas_fuel_enabled) {
        command.target = "gas_fuel";
        command.reason = solidHasCoal
            ? `${reason}, using gas fuel`
            : `${reason}, no coal detected, using gas fuel`;
        return command;
    }

    command.target = "solid_fuel";
    command.reason = power.gfg_error
        ? `${reason}, gas fuel error, using solid fuel`
        : `${reason}, using solid fuel`;
    return command;
}

function updateGenerationCommand() {
    const power = stationState.power_monitor;
    const weather = stationState.weather;
    const command = stationState.generation_command;
    const batteryCharge = Number(power.battery_charge_percent || 0);
    const weatherMode = Number(weather.weather_mode);
    const stormActive = weatherMode === 1 || weatherMode === 2;

    if (!power.has_battery_data) {
        command.action = "generation_off";
        command.enabled = false;
        command.gas_fuel_enabled = false;
        command.solid_fuel_enabled = false;
        command.target = "none";
        command.diagnostics = {
            battery_charge_percent: power.battery_charge_percent,
            gfg_error: power.gfg_error,
            sfg_error: power.sfg_error,
            sfg_coal_count: power.sfg_coal_count,
        };
        command.reason = "Waiting for battery data";
        return command;
    }

    if (stormActive && command.storm_lockout) {
        command.action = "generation_off";
        command.enabled = false;
        command.gas_fuel_enabled = false;
        command.solid_fuel_enabled = false;
        command.target = "none";
        command.diagnostics = {
            battery_charge_percent: power.battery_charge_percent,
            weather_mode: weather.weather_mode,
        };
        command.reason = "Storm lockout active";
        return command;
    }

    if (batteryCharge <= command.battery_low_threshold) {
        return commandGenerationOn(command, power, `Battery below ${command.battery_low_threshold}%`);
    }

    if (batteryCharge >= command.battery_high_threshold) {
        command.action = "generation_off";
        command.enabled = false;
        command.gas_fuel_enabled = false;
        command.solid_fuel_enabled = false;
        command.target = "none";
        command.diagnostics = {
            battery_charge_percent: power.battery_charge_percent,
            high_threshold: command.battery_high_threshold,
        };
        command.reason = `Battery above ${command.battery_high_threshold}%`;
        return command;
    }

    if (command.enabled) {
        return commandGenerationOn(command, power, "Charging until high threshold");
    }

    command.action = "generation_hold";
    command.enabled = false;
    command.gas_fuel_enabled = false;
    command.solid_fuel_enabled = false;
    command.target = "none";
    command.diagnostics = {
        battery_charge_percent: power.battery_charge_percent,
        low_threshold: command.battery_low_threshold,
        high_threshold: command.battery_high_threshold,
    };
    command.reason = "Battery within target range, generation idle";
    return command;
}

module.exports = {
    updateGenerationCommand,
};
