# StationOS Lua Scripts

These Stationeers IC/Lua scripts send telemetry to StationOS and retrieve
automation commands from it.

The examples assume StationOS is running at:

```text
http://127.0.0.1:5000
```

Change each script's `httpServer` or `commandServer` when the Node.js server
runs on another host or port.

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

Posts battery-bank telemetry to `/api/battery/GenerationStorage` every five
seconds. Change `GenerationStorage` in the URL and `batteryBankType` in the
payload when creating another independently tracked bank.

The script batch-reads every large station battery and reports:

- Battery count
- Average charge ratio
- Total stored charge and maximum capacity
- Actual and potential power
- Charged, empty, and error states

Logic reader slots:

| Slot | Reading |
| --- | --- |
| 0 | Energy or power deficit |
| 1 | Battery charged state |
| 2 | Battery empty state |

StationOS compares each total charge reading with the previous report to show
whether the bank is charging, discharging, or idle.

## Setup

1. Start StationOS with `npm start`.
2. Load the required script into an in-game IC housing.
3. Assign devices and logic readers to the slots documented above.
4. Update the server URL if Stationeers cannot reach `127.0.0.1`.
5. Open the matching dashboard page and confirm telemetry is updating.

Telemetry is stored only in server memory. Restarting StationOS clears the
latest weather, room, and power readings.
