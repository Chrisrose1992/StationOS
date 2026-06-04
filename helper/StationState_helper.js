function createRoomState(name = "") {
    return {
        room: name,
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
    };
}

const hallwayRoom = createRoomState("Hallway");

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
        battery_charge: "0%",
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

    rooms: {
        hallway: hallwayRoom,
    },

    hallway: hallwayRoom,

    power_banks: {},
    power_banks_summary: {
        battery_count: 0,
        battery_ratio: 0,
        battery_charge: "0%",
        actual_power_out_w: 0,
        actual_power_out: "0 W",
        potential_power_in_w: 0,
        potential_power_in: "0 W",
        online: false,
    },

    workshop: {
        printers: {},
    },
};

module.exports = { stationState, createRoomState };
