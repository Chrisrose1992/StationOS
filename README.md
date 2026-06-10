# StationOS

StationOS is a local telemetry and automation dashboard for Stationeers. In-game
IC/Lua scripts send device readings to an Express server, which formats and
stores the latest state in memory for display through EJS dashboards.

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
          |
          v
  In-memory station state
          |
          v
      EJS dashboards

Stationeers IC/Lua scripts
          ^
          | HTTP GET commands
          |
    Express command API
```

Telemetry is stored in memory and resets whenever the Node.js process restarts.
No database is currently configured.

## Getting Started

Requirements:

- Node.js
- Stationeers with the HTTP-capable IC/Lua integration

Install dependencies and start the server:

```powershell
npm install
npm start
```

For development with automatic restarts:

```powershell
npm run dev
```

The default address is:

```text
http://127.0.0.1:5000
```

Set `SERVER_PORT` to use a different port.

## Project Structure

```text
controller/   Request handlers and telemetry processing
helper/       Shared state, formatting, and dashboard data
Lua Code/     Weather, room, turbine, and battery telemetry scripts
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
- Stationeers IC/Lua HTTP API
- Vanilla JavaScript and CSS
