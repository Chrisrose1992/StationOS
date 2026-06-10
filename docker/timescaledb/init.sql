CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS telemetry_events (
    recorded_at TIMESTAMPTZ NOT NULL,
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    PRIMARY KEY (recorded_at, id)
);

SELECT create_hypertable(
    'telemetry_events',
    'recorded_at',
    if_not_exists => TRUE
);


CREATE INDEX IF NOT EXISTS telemetry_events_source_time_idx
    ON telemetry_events (source_type, source_id, recorded_at DESC);
