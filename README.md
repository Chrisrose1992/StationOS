# StationOS

StationOS is a web-based telemetry and automation platform for Stationeers.

Using the Stationeers HTTP API, IC scripts export live telemetry to an Express backend where it is processed and displayed through a collection of operational dashboards. The platform also supports sending commands and automation decisions back into the game, enabling two-way communication between Stationeers and external services.

StationOS is designed to function as a station-wide operations console, providing real-time visibility into critical systems such as power generation, weather conditions, atmospheric data, room status, and automation controls.

## Features

### Power Management

* Battery monitoring and status reporting
* Power generation tracking
* Grid load analysis
* Generator monitoring and automation
* Real-time power alerts

### Weather Monitoring

* Storm detection and tracking
* Solar positioning telemetry
* Environmental monitoring
* Day/night cycle reporting
* Weather-based automation

### Room Monitoring

* Atmospheric composition analysis
* Pressure and temperature monitoring
* Lighting status and reporting
* Room occupancy and hazard indicators
* Environmental alerts

### Automation

* HTTP-based telemetry export
* External automation logic
* Remote configuration and control
* Event-driven automation workflows
* Two-way communication between Stationeers and external services

## Architecture

StationOS uses a simple telemetry architecture:

```text
Stationeers IC Scripts
          │
          ▼
      HTTP POST
          │
          ▼
    Express Backend
          │
          ▼
   StationOS Dashboard
          ▲
          │
       HTTP GET
          │
          ▼
Stationeers IC Scripts
```

IC scripts periodically send telemetry to the backend using HTTP POST requests. The backend stores and processes this information before presenting it through a web-based dashboard.

IC scripts can also retrieve automation settings, commands, and configuration data using HTTP GET requests, allowing external systems to influence in-game automation and station management.

## Technology Stack

* Stationeers IC Scripts (Lua)
* Express.js
* Node.js
* HTTP API Integration
* Web-based Dashboard Interface

## Project Goals

The goal of StationOS is to provide a SCADA-inspired monitoring and automation platform for Stationeers, allowing players to manage increasingly complex stations through a centralized operations interface.

By combining in-game telemetry with external automation and visualization tools, StationOS extends station management beyond traditional IC programming and into a full operational monitoring environment.
