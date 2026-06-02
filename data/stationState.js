const stationState = {
    base_status: {
        base_id: "",
        last_seen: null,
        version: "",
        world_name: "",
        session_id: "",
        online: false,
    },

    power_monitor: {
        battery_count: 0,
        sfg_count: 0,
        gfg_count: 0,
        has_battery_data: false,
        battery_charge: 0,
        battery_charge_percent: 0,
        battery_error: false,
        sfg_power: "0 W",
        sfg_power_w: 0,
        sfg_error: false,
        sfg_coal_count: 0,
        sfg_coal_capacity: 0,
        gfg_power: "0 W",
        gfg_power_w: 0,
        gfg_error: false,
        gfg_mols: 0,
        gfg_mols_label: "0 mol",
        windTurbine_power: "0 W",
        wind_power_w: 0,
        power_actual_in: "0 W",
        power_actual_in_w: 0,
        power_actual_out: "0 W",
        power_actual_out_w: 0,
        power_required: "0 W",
        power_required_out_w: 0,
        net_power: "0 W",
        net_power_w: 0,
    },

    generation_command: {
        action: "generation_off",
        enabled: false,
        gas_fuel_enabled: false,
        solid_fuel_enabled: false,
        target: "none",
        reason: "Waiting for station data",
        diagnostics: {},
        battery_low_threshold: 30,
        battery_high_threshold: 95,
        storm_lockout: true,
    },

    weather: {
        isNight: false,
        Horizontal: 0,
        Vertical: 0,
        weather_mode: 0,
        weather_status: "",
        weather_powered: false,
        weather_error: false,
        weather_next_event: 0,
        weather_next_event_label: "0s",
        solar_radiance: 0,
        outdoor_pressure: 0,
        outdoor_temperature: 0,
    },

    hallway: {
        room: "",
        occupied: false,
        pressure: 0,
        temperature: 0,
        oxygen: 0,
        nitrogen: 0,
        methane: 0,
        carbonDioxide: 0,
        pollution: 0,
        hazard: false,
        light_colour: 0,
        long_lights: 0,
        round_lights: 0,
        led_lights: 0,
        total_lights: 0,
    },

    power_banks: {},

    workshop: {
        printers: {},
    },
};

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

function formatPercent(ratio) {
    return `${(Number(ratio || 0) * 100).toFixed(0)}%`;
}

function updatePowerNet() {
    const power = stationState.power_monitor;

    power.net_power_w = Number(power.power_actual_in_w || 0) - Number(power.power_required_out_w || 0);
    power.net_power = formatPower(power.net_power_w);

    return power.net_power_w;
}

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
    const hallway = stationState.hallway;
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

    if (hallway.hazard === 1 || hallway.hazard === true) {
        alerts.push({
            level: "danger",
            title: "Toxic gas detected",
            message: hallway.room ? `${hallway.room} atmosphere is hazardous.` : "Room atmosphere is hazardous.",
        });
    }

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
