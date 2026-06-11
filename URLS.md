# StationOS URLs

Default server:

```text
http://127.0.0.1:5000
```

All telemetry and lighting request bodies use
`Content-Type: application/json`.

## Dashboard Pages

| Page | Method | URL |
| --- | --- | --- |
| Overview | GET | `/` |
| Room dashboard | GET | `/rooms/:id` |
| Power generation | GET | `/power-generation` |
| Atmospherics | GET | `/atmos` |
| Weather | GET | `/weather` |
| Manufacturing | GET | `/manufacturing` |

Room pages become available after the room has posted telemetry. For example,
telemetry sent to `/api/room/Corridor` creates the page `/rooms/Corridor`.

## GET API

| Purpose | URL |
| --- | --- |
| Global weather command | `/api/command` |
| Weather and lighting command for one room | `/api/command/:roomId` |
| Latest weather state and freshness | `/api/weather` |
| Latest room state | `/api/room/:id` |
| Stationeers hash lookup | `/api/hash-lookup/:hash` |
| Dashboard change token | `/api/dashboard-status` |
| Recent station events | `/api/events?limit=10` |
| Telemetry trend | `/api/trends/:series?sourceId=:id&hours=6` |

The hash lookup accepts signed decimal values and hexadecimal CRC32 values.
Unknown rooms return `404`; invalid hashes return `400`, and hashes that are
valid but absent from the lookup return `404`.

## POST API

| Purpose | URL |
| --- | --- |
| Wind turbine telemetry | `/api/wind-turbine` |
| Battery-bank telemetry | `/api/battery/:batteryId` |
| Weather telemetry | `/api/weather` |
| Room telemetry | `/api/room/:id` |
| Set room lighting using `roomId` in the body | `/api/command/lighting` |
| Set room lighting using the URL | `/api/command/:roomId/lighting` |
| Acknowledge a station event | `/api/events/:eventId/acknowledge` |

## Weather Telemetry

`POST /api/weather`

```json
{
  "weatherMode": 0,
  "nextEventTime": 480,
  "nextWeatherHash": 0,
  "windStrength": 0.42,
  "weather_error": false,
  "daysSinceLastEvent": 1200,
  "outsidePressure": 101.3,
  "outsideTemperature": 293.15,
  "isDay": 1,
  "horizontal": 35.4,
  "vertical": 62.8,
  "timeOfDay": 0.325042724609375,
  "daysPast": 14,
  "dayLengthSeconds": 1200,
  "solarIrradiance": 500,
  "isEclipse": 0,
  "weatherSolarRatio": 0.78
}
```

`timeOfDay` is a ratio from `0` to `1`. The server converts it into Morning,
Day Time, Evening, Night Time, or Early Morning.

The weather dashboard uses:

- `horizontal` for the solar-compass bearing
- `vertical` for the solar-elevation indicator
- `timeOfDay` for the solar path and planetary clock
- `nextEventTime` for storm urgency and countdown
- `weatherSolarRatio` and `solarIrradiance` for solar availability
- `weatherMode` and `isDay` to choose sun, storm, or moon visuals

`nextWeatherHash` and `weather_error` are optional. When they are not included,
the dashboard shows `Not reported` instead of presenting a zero or healthy
status as received telemetry.

The compass represents the sun's sensor angle. Wind direction is not displayed
because the current telemetry payload reports wind strength only.

## Room Telemetry

`POST /api/room/Corridor`

```json
{
  "room": "Main Corridor",
  "occupied": true,
  "pressure": 101.3,
  "temperature": 293.15,
  "oxygen": 0.21,
  "nitrogen": 0.78,
  "methane": 0,
  "carbonDioxide": 0.01,
  "pollution": 0,
  "hazard": false,
  "light_long": 4,
  "light_led": 2,
  "light_round": 3,
  "light_round_small": 1,
  "light_round_angled": 1,
  "led_color": 11,
  "total_lights": 11
}
```

## Wind Turbine Telemetry

`POST /api/wind-turbine`

```json
{
  "powerOutput": 2500,
  "windSpeed": 0.65,
  "turbineSpeed": 0.82
}
```

The power dashboard retains the raw output value for aggregate reporting and
shows the formatted output, wind speed, turbine speed, and last report time.

## Battery-Bank Telemetry

`POST /api/battery/GenerationStorage`

```json
{
  "batteryBankType": "Generation Battery Storage",
  "bankRole": "generation",
  "batteryCount": 1,
  "ratio": 0.72,
  "charge": 7200000,
  "maximum": 10000000,
  "powerActual": 4200,
  "powerPotential": 8000,
  "powerDelta": -2800000,
  "batteryCharged": 0,
  "batteryEmpty": 0,
  "error": 0
}
```

The `batteryId` path value identifies the bank in the dashboard. Each bank is
stored independently, so additional banks can post to URLs such as
`/api/battery/BaseStorage`.

For compatibility with the current generation-battery script, the server
accepts either `batteryBankType` or `batteryLocation`. A battery ID containing
`Generation` is treated as the generation bank when `bankRole` is omitted.

`bankRole` may be `generation`, `station`, or `storage`. The dashboard orders
generation banks before station banks and calculates its station-charge
headline from `station` banks when they are available.

The dashboard calculates:

- Total stored energy and capacity across all banks
- Aggregate station charge percentage
- Charging, discharging, or idle state from consecutive charge readings
- Full, high, normal, low, or critical charge level
- Online, offline, and error status

Charge direction uses a `1000 J` tolerance to prevent small reading changes
from repeatedly changing the displayed state. The first reading is shown as
idle because there is no previous sample to compare.

The generation script derives `batteryCount` from powered-on batteries, so the
generation card labels this value as `Active batteries`. Other bank types use
the `Battery count` label.

## Lighting Command

`POST /api/command/Corridor/lighting`

```json
{
  "value": 11
}
```

The lighting value must be an integer from `1` through `11`.

The body-based variant is:

`POST /api/command/lighting`

```json
{
  "roomId": "Corridor",
  "value": 11
}
```

Both lighting endpoints return the selected colour:

```json
{
  "success": true,
  "room": {
    "id": "Corridor",
    "lightColour": 11,
    "colour": {
      "name": "Purple",
      "hex": "#732CA7"
    }
  }
}
```

Lighting changes are also recorded as informational station events.

## Events and Acknowledgement

StationOS creates events only when conditions change, rather than for every
telemetry POST. Current event types include:

- Battery charge crossing the configured low threshold
- Battery error starting or clearing
- Storm starting or clearing
- Solar irradiance dropping by the configured percentage
- Room hazard starting or clearing
- Room pressure leaving or returning to the configured safe range
- Dashboard lighting commands

Retrieve recent events with `GET /api/events?limit=10`. The limit is clamped
from `1` through `100`.

Acknowledge an event with:

`POST /api/events/:eventId/acknowledge`

```json
{
  "acknowledgedBy": "StationOS operator"
}
```

## Trend Graphs

The overview loads six-hour trends from:

```text
GET /api/trends/battery_charge?sourceId=StationStorage&hours=6
GET /api/trends/solar_output?hours=6
GET /api/trends/wind_power?hours=6
GET /api/trends/room_pressure?sourceId=Corridor&hours=6
```

`hours` accepts values from `1` through `168`. Responses contain timestamped
numeric points. When TimescaleDB is disabled, StationOS keeps a bounded
in-memory history for the current process.

Available series are `battery_charge`, `solar_output`, `wind_power`, and
`room_pressure`. Battery and room trends require a matching `sourceId`.

## Command Response

`GET /api/command/Corridor`

```json
{
  "weather": {
    "isNight": false,
    "isStorm": false
  },
  "room": {
    "id": "Corridor",
    "lightColour": 11,
    "colour": {
      "name": "Purple",
      "hex": "#732CA7"
    }
  }
}
```

`GET /api/command` returns only the global `weather` object. A room command may
return `null` for `lightColour` and `colour` until a dashboard lighting command
has been set.

## Telemetry Responses

Successful telemetry posts return HTTP `200` with `success: true` and the
normalized state used by the dashboard. Pressure, temperature, energy, power,
percentages, and timestamps may therefore differ in representation from the
raw request.

Telemetry posts containing non-numeric values in numeric fields return HTTP
`400` and identify the invalid fields.

When `DATABASE_URL` is configured, each weather, room, wind-turbine, and
battery post is also appended to the `telemetry_events` TimescaleDB hypertable.
On startup, StationOS restores the newest event for every source type and
source ID. Without `DATABASE_URL`, the same API remains available with bounded
in-memory telemetry and event history for the current process.

Restored weather is historical until a recent report arrives. By default,
weather older than 15 seconds is marked stale and is not returned to room
automation as a clear condition. Set `WEATHER_STALE_MS` to change that window.

`GET /api/weather` returns the current state with an `isFresh` boolean. The
weather page polls this endpoint and reloads when a newer report arrives or
when the current report becomes stale.

Room, battery, and wind-turbine freshness defaults to 15 seconds and can be
changed with `TELEMETRY_STALE_MS`. Overview and power pages poll a lightweight
status endpoint and reload only when telemetry or freshness changes.
