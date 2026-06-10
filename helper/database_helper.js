const { Pool } = require('pg');

const logger = require('../middleware/logger_middleware');

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
    ? new Pool({
        connectionString: databaseUrl,
        max: Number(process.env.DATABASE_POOL_SIZE || 10),
    })
    : null;

if (pool) {
    pool.on('error', (error) => {
        logger.error(`Unexpected database error: ${error.message}`);
    });
}

async function initializeDatabase() {
    if (!pool) {
        logger.warn('DATABASE_URL is not set; telemetry history is disabled.');
        return;
    }

    const result = await pool.query(
        "SELECT extversion FROM pg_extension WHERE extname = 'timescaledb'"
    );

    if (result.rowCount === 0) {
        throw new Error('The TimescaleDB extension is not installed.');
    }

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
    if (!pool) {
        return;
    }

    pool.query(
        `INSERT INTO telemetry_events
            (recorded_at, source_type, source_id, payload)
         VALUES ($1, $2, $3, $4)`,
        [
            recordedAt || new Date().toISOString(),
            sourceType,
            sourceId,
            payload,
        ]
    ).catch((error) => {
        logger.error(
            `Unable to store ${sourceType} telemetry for "${sourceId}": ${error.message}`
        );
    });
}

async function closeDatabase() {
    if (pool) {
        await pool.end();
    }
}

module.exports = {
    closeDatabase,
    initializeDatabase,
    loadLatestTelemetry,
    recordTelemetry,
};
