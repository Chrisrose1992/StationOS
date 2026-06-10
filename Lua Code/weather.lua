local LT = ic.enums.LogicType

local httpServer =
	"http://127.0.0.1:5000/api/weather"

local postTimer = 0

local weatherStation = 0
local gasSensor = 1
local daySensor = 2
local reader1 = 3
local reader2 = 4
local reader3 = 5
local reader4 = 6
local reader5 = 7
local reader6 = 8
local reader7 = 9
local reader8 = 10

function tick(dt)
	postTimer = postTimer + dt

	if postTimer >= 5 then

		postTimer = 0

		local data =
			util.json.encode({

				weatherMode =
				ic.read(weatherStation, LT.Mode) or 0,

				nextEventTime =
				ic.read(weatherStation, LT.NextWeatherEventTime) or 0,

				windStrength =
				ic.read(reader1, LT.Setting) or 0,

				daysSinceLastEvent =
				ic.read(reader2, LT.Setting) or 0,

				outsidePressure =
				ic.read(gasSensor, LT.Pressure) or 0,

				outsideTemperature =
				ic.read(gasSensor, LT.Temperature) or 0,

				isDay =
				ic.read(daySensor, LT.Activate) or 0,

				horizontal =
				ic.read(daySensor, LT.Horizontal) or 0,

				vertical =
				ic.read(daySensor, LT.Vertical) or 0,

				timeOfDay =
				ic.read(reader3, LT.Setting) or 0,

				daysPast =
				ic.read(reader4, LT.Setting) or 0,

				dayLengthSeconds =
				ic.read(reader5, LT.Setting) or 0,

				solarIrradiance =
				ic.read(reader6, LT.Setting) or 0,

				isEclipse =
				ic.read(reader7, LT.Setting) or 0,

				weatherSolarRatio =
				ic.read(reader8, LT.Setting) or 0,

			})

		ic.http.post(
			httpServer,
			data,
			"application/json"
		)

	end
end