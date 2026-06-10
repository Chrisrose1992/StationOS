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
        updatedAt: null,
    };
}

function createBatteryState(name = "") {
    return {
        id: name,
        battery_bank_location: name,
        status: "Unknown",
        chargeStatus: "Unknown",
        count: 0,
        ratioRaw: 0,
        ratio: "0%",
        level: "Unknown",
        chargeRaw: 0,
        charge: "0 J",
        maximumRaw: 0,
        maximum: "0 J",
        powerActualRaw: 0,
        powerActual: "0 W",
        powerPotentialRaw: 0,
        powerPotential: "0 W",
        energyDeficitRaw: 0,
        energyDeficit: "0 J",
        charged: false,
        empty: false,
        error: false,
        updatedAt: null,
    };
}

const lightColours = {
    0: { name: "Blue", hex: "#212AA5" },
    1: { name: "Gray", hex: "#7B7B7B" },
    2: { name: "Green", hex: "#3F9B39" },
    3: { name: "Orange", hex: "#FF662B" },
    4: { name: "Red", hex: "#E70200" },
    5: { name: "Yellow", hex: "#FFBC1B" },
    6: { name: "White", hex: "#E7E7E7" },
    7: { name: "Black", hex: "#080908" },
    8: { name: "Brown", hex: "#633C2B" },
    9: { name: "Khaki", hex: "#63633F" },
    10: { name: "Pink", hex: "#E41C99" },
    11: { name: "Purple", hex: "#732CA7" },
};

function getLightColour(value) {
    const colourId = Number(value);

    return lightColours[colourId] || {
        name: "Unknown",
        hex: "#7B7B7B",
    };
}

const stationState = {
    rooms: {},

    command: {
        weather: {
            isNight: true,
            isStorm: false,
        },
        roomLighting: {},
    },

    power_monitor: {
        wind_turbine: {
            powerOutputRaw: 0,
            powerOutput: "0 W",
            windSpeed: "0.0%",
            turbineSpeed: "0.0%",
            updatedAt: null,
        },
        battery: {},
    },

    weather_monitor: {
        weather_mode: 0,
        weather_event: "",
        nextEvent_raw: 0,
        nextEvent: "",
        nextWeatherHash: 0,
        windStrength: "",
        weather_error: false,
        daysSinceLastEvent: "",
        outsidePressure: "",
        outsideTemperature: 0,
        isNight: "",
        horizontal: "",
        vertical: "",
        timeOfDay: "",
        daysPast: 0,
        dayLengthSeconds: "",
        solarIrradiance: 0,
        isEclipse: false,
        weatherSolarRatio: 0,
        updatedAt: null,
    },
};

module.exports = {
    createRoomState,
    getLightColour,
    lightColours,
    stationState,
    createBatteryState,
};
