# StationOS Lua Scripts

These Stationeers IC/Lua scripts send telemetry to StationOS and retrieve
automation commands from it.

The examples assume StationOS is running at:

```text
http://127.0.0.1:5000
```

Change each script's `httpServer` or `commandServer` when the Node.js server
runs on another host or port. `127.0.0.1` refers to the machine running
Stationeers, so use the StationOS host's LAN address when the server runs on a
different computer.

## Scripts

### `weather.lua`

Posts weather telemetry to `/api/weather` every five seconds.

Device slots:

| Slot | Device | Readings |
| --- | --- | --- |
| 0 | Weather station | Mode, next weather event time |
| 1 | Gas sensor | Outside pressure and temperature |
| 2 | Daylight sensor | Day state, horizontal angle, vertical angle |
| 3 | Logic reader | Wind strength |
| 4 | Logic reader | Time since last weather event |
| 5 | Logic reader | Time-of-day ratio |
| 6 | Logic reader | Days passed |
| 7 | Logic reader | Day length |
| 8 | Logic reader | Solar irradiance |
| 9 | Logic reader | Eclipse state |
| 10 | Logic reader | Weather solar ratio |

The `timeOfDay` value is expected to be a ratio between `0` and `1`. StationOS
maps the ratio to a readable period and uses the day sensor state to display an
animated sun or moon.

### `roome.lua`

Posts room telemetry to `/api/room/Corridor` and polls
`/api/command/Corridor`.

The script reports:

- Occupancy
- Pressure and temperature
- Gas composition
- Hazard state
- Light counts and LED colour

It batch-reads room gas sensors and each supported light type. Normal lights
follow occupancy, while LED lights indicate storms or hazardous gases in red
and otherwise use the colour selected from the dashboard.

The command response provides:

- `weather.isNight`
- `weather.isStorm`
- `room.lightColour`

Change `Corridor` in both URLs when using the script for another room. The same
identifier is used by the API and the dashboard route, such as
`/rooms/Corridor`.

### `windTurbine.lua`

Posts power output, wind speed, and turbine speed to `/api/wind-turbine` every
five seconds.

Device slots:

| Slot | Reading |
| --- | --- |
| 0 | Wind speed |
| 1 | Turbine speed |
| 2 | Power output |

### `battery.lua`

Posts generation-battery telemetry to `/api/battery/GenerationStorage` every
five seconds. It batch-reads all connected large batteries, so keep its IC
network limited to the generation bank before the transformer.

### `stationBattery.lua`

Posts station-battery telemetry to `/api/battery/StationStorage` every five
seconds. Run it in a second IC housing and assign the station battery directly
to device slot 0.

Both battery scripts report:

- Battery count
- Charge ratio
- Stored charge and maximum capacity
- Actual and potential power
- Charged, empty, and error states

`battery.lua` logic-reader slots:

| Slot | Reading |
| --- | --- |
| 0 | Energy or power deficit |
| 1 | Battery charged state |
| 2 | Battery empty state |

`stationBattery.lua` device slots:

| Slot | Device or reading |
| --- | --- |
| 0 | Station battery |
| 1 | Logic reader: energy or power deficit |
| 2 | Logic reader: battery charged state |
| 3 | Logic reader: battery empty state |

StationOS compares each total charge reading with the previous report to show
whether the bank is charging, discharging, or idle.

For the layout:

```text
Wind turbine -> generation battery -> transformer -> station battery
```

Use `battery.lua` before the transformer and `stationBattery.lua` after it.
Do not point both scripts at the same battery. The dashboard uses the station
battery for the headline station-charge percentage and combines both banks only
for total stored energy and capacity.

## Setup

1. Start StationOS with `npm start`, `npm run dev`, or Docker Compose.
2. Load the required script into an in-game IC housing.
3. Assign devices and logic readers to the slots documented above.
4. Update the server URL if Stationeers cannot reach `127.0.0.1`.
5. Open the matching dashboard page and confirm telemetry is updating.

With the Docker Compose setup, telemetry is written to TimescaleDB and the
latest reading for each source is restored when StationOS starts. A native
`npm start` or `npm run dev` session without `DATABASE_URL` keeps telemetry
only in memory, so restarting that process clears the current readings.

For dashboard development, `npm run dev` also restarts the server after backend
changes and reloads open browser pages after server, EJS, CSS, or browser
JavaScript changes.
