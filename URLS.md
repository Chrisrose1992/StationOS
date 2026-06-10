# StationOS URLs

Default server:

```text
http://127.0.0.1:5000
```

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
| Latest room state | `/api/room/:id` |
| Stationeers hash lookup | `/api/hash-lookup/:hash` |

The hash lookup accepts signed decimal values and hexadecimal CRC32 values.

## POST API

| Purpose | URL |
| --- | --- |
| Wind turbine telemetry | `/api/wind-turbine` |
| Weather telemetry | `/api/weather` |
| Room telemetry | `/api/room/:id` |
| Set room lighting using `roomId` in the body | `/api/command/lighting` |
| Set room lighting using the URL | `/api/command/:roomId/lighting` |

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
Day Time, Evening, Night Time, or Early Morning. The weather dashboard uses
`isDay` to choose its animated sun or moon display.

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

## Lighting Command

`POST /api/command/Corridor/lighting`

```json
{
  "value": 11
}
```

The lighting value must be an integer from `1` through `11`.

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
