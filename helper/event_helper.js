const { recordStationEvent } = require('./database_helper');

const pressureMinimum = Number(process.env.ROOM_PRESSURE_MIN_KPA || 80);
const pressureMaximum = Number(process.env.ROOM_PRESSURE_MAX_KPA || 120);
const batteryLowRatio = Number(process.env.BATTERY_LOW_PERCENT || 25) / 100;
const solarDropRatio = Number(process.env.SOLAR_DROP_PERCENT || 60) / 100;

function isPressureSafe(pressure) {
    return Number.isFinite(pressure)
        && pressure >= pressureMinimum
        && pressure <= pressureMaximum;
}

function detectBatteryEvents(batteryId, previous, current) {
    if (!previous.updatedAt) {
        return;
    }

    if (previous.ratioRaw >= batteryLowRatio && current.ratioRaw < batteryLowRatio) {
        recordStationEvent({
            eventKey: `battery:${batteryId}:charge-low`,
            severity: 'warning',
            sourceType: 'battery',
            sourceId: batteryId,
            message: `${current.battery_bank_location} charge below ${batteryLowRatio * 100}%`,
            metadata: { chargePercent: current.ratioRaw * 100 },
        });
    } else if (previous.ratioRaw < batteryLowRatio && current.ratioRaw >= batteryLowRatio) {
        recordStationEvent({
            eventKey: `battery:${batteryId}:charge-restored`,
            severity: 'info',
            sourceType: 'battery',
            sourceId: batteryId,
            message: `${current.battery_bank_location} charge restored above ${batteryLowRatio * 100}%`,
            metadata: { chargePercent: current.ratioRaw * 100 },
        });
    }

    if (!previous.error && current.error) {
        recordStationEvent({
            eventKey: `battery:${batteryId}:error`,
            severity: 'critical',
            sourceType: 'battery',
            sourceId: batteryId,
            message: `${current.battery_bank_location} reported an error`,
        });
    } else if (previous.error && !current.error) {
        recordStationEvent({
            eventKey: `battery:${batteryId}:error-cleared`,
            severity: 'info',
            sourceType: 'battery',
            sourceId: batteryId,
            message: `${current.battery_bank_location} error cleared`,
        });
    }
}

function detectRoomEvents(roomId, previous, current) {
    if (!previous.updatedAt) {
        return;
    }

    if (!previous.hazard && current.hazard) {
        recordStationEvent({
            eventKey: `room:${roomId}:hazard`,
            severity: 'critical',
            sourceType: 'room',
            sourceId: roomId,
            message: `${current.room} hazard detected`,
        });
    } else if (previous.hazard && !current.hazard) {
        recordStationEvent({
            eventKey: `room:${roomId}:hazard-cleared`,
            severity: 'info',
            sourceType: 'room',
            sourceId: roomId,
            message: `${current.room} hazard cleared`,
        });
    }

    const previousHasPressure = Array.isArray(previous.reportedFields)
        ? previous.reportedFields.includes('pressure')
        : previous.pressureRaw > 0;
    const previousPressureSafe = isPressureSafe(previous.pressureRaw);
    const currentPressureSafe = isPressureSafe(current.pressureRaw);

    if (previousHasPressure && previousPressureSafe && !currentPressureSafe) {
        recordStationEvent({
            eventKey: `room:${roomId}:pressure-warning`,
            severity: 'warning',
            sourceType: 'room',
            sourceId: roomId,
            message: `${current.room} pressure outside safe range`,
            metadata: { pressureKpa: current.pressureRaw },
        });
    } else if (previousHasPressure && !previousPressureSafe && currentPressureSafe) {
        recordStationEvent({
            eventKey: `room:${roomId}:pressure-restored`,
            severity: 'info',
            sourceType: 'room',
            sourceId: roomId,
            message: `${current.room} pressure restored`,
            metadata: { pressureKpa: current.pressureRaw },
        });
    }
}

function detectWeatherEvents(previous, current) {
    if (!previous.updatedAt) {
        return;
    }

    const previousStorm = previous.weather_mode === 1 || previous.weather_mode === 2;
    const currentStorm = current.weather_mode === 1 || current.weather_mode === 2;

    if (!previousStorm && currentStorm) {
        recordStationEvent({
            eventKey: 'weather:storm-detected',
            severity: 'critical',
            sourceType: 'weather',
            sourceId: 'station',
            message: current.weather_event || 'Storm detected',
        });
    } else if (previousStorm && !currentStorm) {
        recordStationEvent({
            eventKey: 'weather:storm-cleared',
            severity: 'info',
            sourceType: 'weather',
            sourceId: 'station',
            message: 'Storm cleared',
        });
    }

    if (
        previous.solarIrradiance > 0
        && current.solarIrradiance <= previous.solarIrradiance * (1 - solarDropRatio)
    ) {
        const dropPercent = Math.round(
            (1 - (current.solarIrradiance / previous.solarIrradiance)) * 100,
        );

        recordStationEvent({
            eventKey: 'weather:solar-output-drop',
            severity: 'warning',
            sourceType: 'weather',
            sourceId: 'station',
            message: `Solar output dropped ${dropPercent}%`,
            metadata: {
                currentIrradiance: current.solarIrradiance,
                previousIrradiance: previous.solarIrradiance,
            },
        });
    }
}

module.exports = {
    detectBatteryEvents,
    detectRoomEvents,
    detectWeatherEvents,
    isPressureSafe,
};
