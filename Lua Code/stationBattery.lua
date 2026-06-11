local LT = ic.enums.LogicType

local httpServer =
	"http://127.0.0.1:5000/api/battery/StationStorage"

local batteryBankType = "Station Battery Storage"
local bankRole = "station"

local postTimer = 0

local battery = 0
local reader1 = 1
local reader2 = 2
local reader3 = 3

function tick(dt)
	postTimer = postTimer + dt

	if postTimer >= 5 then

		postTimer = 0

		local maximum =
			ic.read(battery, LT.Maximum) or 0

		local batteryCount = 0

		if maximum > 0 then
			batteryCount = 1
		end

		local data =
			util.json.encode({
				batteryBankType = batteryBankType,
				bankRole = bankRole,

				batteryCount =
					batteryCount,

				ratio =
					ic.read(battery, LT.Ratio) or 0,

				charge =
					ic.read(battery, LT.Charge) or 0,

				maximum =
					maximum,

				powerActual =
					ic.read(battery, LT.PowerActual) or 0,

				powerPotential =
					ic.read(battery, LT.PowerPotential) or 0,

				powerDelta =
					ic.read(reader1, LT.Setting) or 0,

				batteryCharged =
					ic.read(reader2, LT.Setting) or 0,

				batteryEmpty =
					ic.read(reader3, LT.Setting) or 0,

				error =
					ic.read(battery, LT.Error) or 0
			})
		ic.http.post(
			httpServer,
			data,
			"application/json"
		)

	end

end
