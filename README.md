# StationOS

StationOS is a local telemetry and automation dashboard for Stationeers. In-game
IC/Lua scripts send device readings to an Express server, which formats and
stores the latest state in memory for display through EJS dashboards. When a
database is configured, normalized telemetry snapshots are also written to a
TimescaleDB hypertable for durable history.

The server also exposes command endpoints that IC scripts can poll, allowing
weather conditions and dashboard lighting controls to influence in-game
automation.

## Screenshots

![StationOS dashboard](<Screenshots/Screenshot 2026-06-10 120143.png>)

![StationOS power monitoring](<Screenshots/Screenshot 2026-06-10 085505.png>)

![StationOS weather monitoring](<Screenshots/Screenshot 2026-06-10 085108.png>)

## Current Features

### Weather Monitoring

- Storm status and upcoming event timing
- Outside temperature and pressure
- Wind strength and solar irradiance
- Day/night state and descriptive time-of-day periods
- Solar horizontal and vertical angles
- Eclipse and weather solar-ratio reporting
- Animated sun or moon cycle card
- Weather-driven night and storm commands for room automation

### Room Monitoring

- Dynamically created room dashboards
- Occupancy, hazard, pressure, and temperature readings
- Oxygen, nitrogen, methane, carbon dioxide, and pollutant percentages
- Long, round, and LED light counts
- Remote room-light colour selection

### Power Monitoring

- Live wind turbine output, wind speed, and turbine speed
- Animated turbine with telemetry status
- Multiple named battery banks
- Aggregate stored energy, capacity, and station charge percentage
- Battery charge level, health, and online status
- Charging, discharging, and idle state detection
- Actual power, potential power, and energy-deficit reporting

### Utilities

- Signed decimal and hexadecimal Stationeers hash lookup
- Responsive dashboard and sidebar navigation
- Structured request logging

## Architecture

```text
Stationeers IC/Lua scripts
          |
          | HTTP POST telemetry
          v
    Express controllers
          |                    |
          v                    v
  In-memory station state   TimescaleDB history
          |
          v
      EJS dashboards

Stationeers IC/Lua scripts
          ^
          | HTTP GET commands
          |
    Express command API
```

The live dashboard uses in-memory state for fast page rendering. With the
Docker Compose setup, every received weather, room, wind-turbine, and battery
snapshot is retained in TimescaleDB. When StationOS starts, it restores the
newest snapshot for every telemetry source before accepting requests.

## Getting Started

Requirements:

- Node.js 18 or later
- Stationeers with the HTTP-capable IC/Lua integration

Install dependencies and start the server:

```powershell
npm install
npm start
```

For development with automatic server restarts and browser reloads:

```powershell
npm run dev
```

Keep the dashboard open in your browser. Changes to templates, CSS, browser
JavaScript, or server code will reload the page automatically.

The default address is:

```text
http://127.0.0.1:5000
```

Set `SERVER_PORT` to use a different port.

Without `DATABASE_URL`, StationOS keeps the latest telemetry in memory and logs
that history storage is disabled. This is sufficient for local development,
but telemetry is cleared when the Node.js process stops.

## Docker and TimescaleDB

Copy `.env.example` to `.env` and change `POSTGRES_PASSWORD`, then start the
application and database:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

Open `http://127.0.0.1:5000`. Check container status and logs with:

```powershell
docker compose ps
docker compose logs -f app
```

Telemetry history is stored in the `telemetry_events` hypertable. For example:

```powershell
docker compose exec timescaledb psql -U stationos -d stationos -c "SELECT source_type, source_id, recorded_at FROM telemetry_events ORDER BY recorded_at DESC LIMIT 20;"
```

The named `timescaledb_data` volume keeps the database across container
restarts. The SQL in `docker/timescaledb/init.sql` runs only when that volume is
first created.

Closing Stationeers stops new telemetry but does not remove existing readings.
Restarting the StationOS app container reloads the most recent readings from
TimescaleDB, so rooms and power/weather dashboard values remain available.

Compose accepts these environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SERVER_PORT` | `5000` | Host port for the dashboard |
| `POSTGRES_PORT` | `5432` | Host-only PostgreSQL port |
| `POSTGRES_DB` | `stationos` | Database name |
| `POSTGRES_USER` | `stationos` | Database user |
| `POSTGRES_PASSWORD` | `stationos` | Database password; change this in `.env` |
| `DATABASE_POOL_SIZE` | `10` | Maximum application database connections |

For a native Node.js deployment with an existing TimescaleDB instance, set
`DATABASE_URL` to a PostgreSQL connection string and ensure the schema from
`docker/timescaledb/init.sql` has been applied.

### Intel Arc A380

PostgreSQL, TimescaleDB, and the current Node.js application do not perform GPU
work, so the A380 does not improve this stack. Docker Desktop for Windows
currently documents container GPU passthrough for NVIDIA GPUs only.

For a native Linux Docker host, `compose.intel-gpu.linux.yaml` exposes
`/dev/dri` to the app container:

```bash
docker compose -f compose.yaml -f compose.intel-gpu.linux.yaml up --build -d
```

That override prepares device access only. A future video, AI, or compute
service would still need Intel user-space drivers and code that uses the GPU.

## Project Structure

```text
controller/   Request handlers and telemetry processing
data_models/  Stationeers lookup data
docker/       TimescaleDB initialization
helper/       Shared state, formatting, and dashboard data
Lua Code/     Weather, room, turbine, and battery telemetry scripts
middleware/   Request and application logging
public/       Dashboard CSS and browser JavaScript
routes/       Express page and API routes
views/        EJS pages and shared partials
```

See [URLS.md](URLS.md) for the complete route and payload reference. See
[Lua Code/README.md](<Lua Code/README.md>) for in-game script setup.

## Technology

- Node.js
- Express
- EJS
- PostgreSQL and TimescaleDB
- Stationeers IC/Lua HTTP API
- Vanilla JavaScript and CSS
