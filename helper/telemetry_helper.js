const telemetryStaleMs = Number(process.env.TELEMETRY_STALE_MS || 15000);

function toFiniteNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
}

function toBinaryFlag(value) {
    return value === true || Number(value) === 1;
}

function isTelemetryFresh(updatedAt, staleMs = telemetryStaleMs) {
    const timestamp = new Date(updatedAt || 0).getTime();

    return Number.isFinite(timestamp)
        && timestamp > 0
        && Date.now() - timestamp <= staleMs;
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function getInvalidNumericFields(data, fields) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return ['body'];
    }

    return fields.filter((field) => (
        hasOwn(data, field)
        && !Number.isFinite(Number(data[field]))
    ));
}

module.exports = {
    getInvalidNumericFields,
    hasOwn,
    isTelemetryFresh,
    telemetryStaleMs,
    toBinaryFlag,
    toFiniteNumber,
};
