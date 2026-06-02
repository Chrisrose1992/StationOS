# StationOS URLs

Default local server:

```text
http://127.0.0.1:4000
```

## Pages

| Page | URL |
| --- | --- |
| Overview | `/` |
| Base Status | `/base-status` |
| Power Control | `/power` |
| Power Banks | `/power-banks` |
| Workshop | `/workshop` |
| Weather | `/weather` |
| Hallway | `/hallway` |

## GET API

| Purpose | URL |
| --- | --- |
| Health check | `/health` |
| Full live station state | `/api/station` |
| Base status | `/api/base-status` |
| Power monitor | `/api/power_monitor` |
| Power banks | `/api/power/banks` |
| Workshop printers | `/api/workshop/printers` |
| Weather telemetry | `/api/weather` |
| Hallway telemetry | `/api/hallway` |
| Active alerts | `/api/alerts` |
| Generation command | `/api/generation_command` |
| Environment command | `/api/environment_command` |
| Hash lookup by path | `/api/hash-lookup/:hash` |
| Hash lookup by query | `/api/hash-lookup?hash=-732925934` |

## POST API

| Purpose | URL |
| --- | --- |
| Base heartbeat/status | `/api/base-status` |
| Battery summary | `/api/battery` |
| Power bank list | `/api/power/banks` |
| Grid generation | `/api/grid_generation` |
| Wind generation | `/api/wind_generation` |
| Workshop printer list | `/api/workshop/printers` |
| Weather telemetry | `/api/weather` |
| Hallway telemetry | `/api/hallway` |
| Test endpoint | `/api/test` |

## Example Payloads

### Base Status

```json
{
  "base_id": "main_base",
  "version": "0.1.0",
  "world_name": "Mars",
  "session_id": "session_001",
  "online": true
}
```

### Power Banks

```json
{
  "banks": [
    {
      "id": "wind_bank_1",
      "name": "Wind Bank 1",
      "ratio": 0.82,
      "actual_power_out_w": 1200,
      "potential_power_in_w": 3500,
      "online": true,
      "count": 4
    }
  ]
}
```

### Workshop Printers

```json
{
  "printers": [
    {
      "id": "autolathe_1",
      "name": "Workshop Autolathe",
      "type": "autolathe",
      "online": true,
      "active": true,
      "recipe_hash": -1301215609,
      "recipe_name": "ItemIronIngot",
      "print_amount": 100,
      "printed_count": 42,
      "completion": 0.63
    }
  ]
}
```
