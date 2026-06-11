const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const logger = require('../middleware/logger_middleware');

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
    ? new Pool({
        connectionString: databaseUrl,
        max: Number(process.env.DATABASE_POOL_SIZE || 10),
    })
    : null;
const memoryTelemetry = [];
const memoryEvents = [];
const memoryTelemetryLimit = 2000;
const memoryEventLimit = 200;

if (pool) {
    pool.on('error', (error) => {
        logger.error(`Unexpected database error: ${error.message}`);
    });
}

async function initializeDatabase() {
    if (!pool) {
        logger.warn(
            'DATABASE_URL is not set; durable history is disabled and bounded memory history is active.'
        );
        return;
    }

    const result = await pool.query(
        "SELECT extversion FROM pg_extension WHERE extname = 'timescaledb'"
    );

    if (result.rowCount === 0) {
        throw new Error('The TimescaleDB extension is not installed.');
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS station_events (
            event_id TEXT PRIMARY KEY,
            event_key TEXT NOT NULL,
            severity TEXT NOT NULL,
            source_type TEXT NOT NULL,
            source_id TEXT NOT NULL,
            message TEXT NOT NULL,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL,
            acknowledged_at TIMESTAMPTZ,
            acknowledged_by TEXT
        );

        CREATE INDEX IF NOT EXISTS station_events_created_idx
            ON station_events (created_at DESC);
    `);

    logger.info(`Connected to TimescaleDB ${result.rows[0].extversion}`);
}

async function loadLatestTelemetry() {
    if (!pool) {
        return [];
    }

    const result = await pool.query(
        `SELECT DISTINCT ON (source_type, source_id)
            source_type,
            source_id,
            payload,
            recorded_at
         FROM telemetry_events
         ORDER BY source_type, source_id, recorded_at DESC, id DESC`
    );

    return result.rows;
}

function recordTelemetry(sourceType, sourceId, payload, recordedAt) {
    const timestamp = recordedAt || new Date().toISOString();
    const snapshot = JSON.parse(JSON.stringify(payload));

    memoryTelemetry.push({
        source_type: sourceType,
        source_id: sourceId,
        payload: snapshot,
        recorded_at: timestamp,
    });
    if (memoryTelemetry.length > memoryTelemetryLimit) {
        memoryTelemetry.splice(0, memoryTelemetry.length - memoryTelemetryLimit);
    }

    if (!pool) {
        return;
    }

    pool.query(
        `INSERT INTO telemetry_events
            (recorded_at, source_type, source_id, payload)
         VALUES ($1, $2, $3, $4)`,
        [
            timestamp,
            sourceType,
            sourceId,
            snapshot,
        ]
    ).catch((error) => {
        logger.error(
            `Unable to store ${sourceType} telemetry for "${sourceId}": ${error.message}`
        );
    });
}

function recordStationEvent({
    eventKey,
    severity = 'info',
    sourceType,
    sourceId,
    message,
    metadata = {},
    createdAt = new Date().toISOString(),
}) {
    const event = {
        event_id: randomUUID(),
        event_key: eventKey,
        severity,
        source_type: sourceType,
        source_id: sourceId,
        message,
        metadata,
        created_at: createdAt,
        acknowledged_at: null,
        acknowledged_by: null,
    };

    memoryEvents.unshift(event);
    if (memoryEvents.length > memoryEventLimit) {
        memoryEvents.length = memoryEventLimit;
    }

    if (pool) {
        pool.query(
            `INSERT INTO station_events (
                event_id,
                event_key,
                severity,
                source_type,
                source_id,
                message,
                metadata,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                event.event_id,
                event.event_key,
                event.severity,
                event.source_type,
                event.source_id,
                event.message,
                event.metadata,
                event.created_at,
            ],
        ).catch((error) => {
            logger.error(`Unable to store station event: ${error.message}`);
        });
    }

    return event;
}

async function loadStationEvents(limit = 20) {
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    if (!pool) {
        return memoryEvents.slice(0, safeLimit);
    }

    const result = await pool.query(
        `SELECT
            event_id,
            event_key,
            severity,
            source_type,
            source_id,
            message,
            metadata,
            created_at,
            acknowledged_at,
            acknowledged_by
         FROM station_events
         ORDER BY created_at DESC
         LIMIT $1`,
        [safeLimit],
    );

    const eventsById = new Map(
        [...memoryEvents, ...result.rows].map((event) => [event.event_id, event]),
    );

    return [...eventsById.values()]
        .sort((left, right) => (
            new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
        ))
        .slice(0, safeLimit);
}

async function acknowledgeStationEvent(eventId, acknowledgedBy = 'StationOS operator') {
    const acknowledgedAt = new Date().toISOString();
    const memoryEvent = memoryEvents.find((event) => event.event_id === eventId);

    if (memoryEvent) {
        memoryEvent.acknowledged_at = acknowledgedAt;
        memoryEvent.acknowledged_by = acknowledgedBy;
    }

    if (!pool) {
        return memoryEvent || null;
    }

    const result = await pool.query(
        `UPDATE station_events
         SET acknowledged_at = COALESCE(acknowledged_at, $2),
             acknowledged_by = COALESCE(acknowledged_by, $3)
         WHERE event_id = $1
         RETURNING *`,
        [eventId, acknowledgedAt, acknowledgedBy],
    );

    return result.rows[0] || memoryEvent || null;
}

function mapTrendPoint(event, series) {
    const payload = event.payload || {};
    let value;

    switch (series) {
        case 'battery_charge':
            value = Number(payload.ratioRaw) * 100;
            break;
        case 'solar_output':
            value = Number(payload.solarIrradiance);
            break;
        case 'wind_power':
            value = Number(payload.powerOutputRaw);
            break;
        case 'room_pressure':
            value = Number(payload.pressureRaw);
            break;
        default:
            value = Number.NaN;
    }

    return Number.isFinite(value)
        ? { timestamp: event.recorded_at, value }
        : null;
}

async function loadTelemetryTrend(series, sourceId, hours = 6) {
    const safeHours = Math.min(168, Math.max(1, Number(hours) || 6));
    const sourceType = {
        battery_charge: 'battery',
        room_pressure: 'room',
        solar_output: 'weather',
        wind_power: 'wind_turbine',
    }[series];

    if (!sourceType) {
        return null;
    }

    if (!pool) {
        const cutoff = Date.now() - (safeHours * 60 * 60 * 1000);

        return memoryTelemetry
            .filter((event) => (
                event.source_type === sourceType
                && (!sourceId || event.source_id === sourceId)
                && new Date(event.recorded_at).getTime() >= cutoff
            ))
            .map((event) => mapTrendPoint(event, series))
            .filter(Boolean)
            .slice(-240);
    }

    const valueExpression = {
        battery_charge: "(payload->>'ratioRaw')::double precision * 100",
        room_pressure: "(payload->>'pressureRaw')::double precision",
        solar_output: "(payload->>'solarIrradiance')::double precision",
        wind_power: "(payload->>'powerOutputRaw')::double precision",
    }[series];
    const result = await pool.query(
        `SELECT timestamp, value
         FROM (
            SELECT recorded_at AS timestamp, ${valueExpression} AS value
            FROM telemetry_events
            WHERE source_type = $1
              AND ($2::text IS NULL OR source_id = $2)
              AND recorded_at >= NOW() - ($3 * INTERVAL '1 hour')
              AND payload ? $4
            ORDER BY recorded_at DESC
            LIMIT 240
         ) recent_points
         ORDER BY timestamp ASC`,
        [
            sourceType,
            sourceId || null,
            safeHours,
            {
                battery_charge: 'ratioRaw',
                room_pressure: 'pressureRaw',
                solar_output: 'solarIrradiance',
                wind_power: 'powerOutputRaw',
            }[series],
        ],
    );

    return result.rows.map((row) => ({
        timestamp: row.timestamp,
        value: Number(row.value),
    }));
}

async function closeDatabase() {
    if (pool) {
        await pool.end();
    }
}

module.exports = {
    acknowledgeStationEvent,
    closeDatabase,
    initializeDatabase,
    loadStationEvents,
    loadTelemetryTrend,
    loadLatestTelemetry,
    recordStationEvent,
    recordTelemetry,
};
