local LT = ic.enums.LogicType
local LBM = ic.enums.LogicBatchMethod

local httpServer =
	"http://127.0.0.1:5000/api/battery/GenerationStorage"

local postTimer = 0

local reader1 = 0
local reader2 = 1
local reader3 = 2

local BATTERY_HASH = hash("StructureBatteryLarge")

function tick(dt)
	postTimer = postTimer + dt

	if postTimer >= 5 then

		postTimer = 0

		local data =
			util.json.encode({
				batteryLocation = "Generation Storage",

				batteryCount =
				ic.batch_read(BATTERY_HASH, LT.On, LBM.Sum),

				ratio =
				ic.batch_read(BATTERY_HASH, LT.Ratio, LBM.Average),

				charge =
				ic.batch_read(BATTERY_HASH, LT.Charge, LBM.Sum),

				maximum =
				ic.batch_read(BATTERY_HASH, LT.Maximum, LBM.Sum),

				powerActual =
				ic.batch_read(BATTERY_HASH, LT.PowerActual, LBM.Sum),

				powerPotential =
				ic.batch_read(BATTERY_HASH, LT.PowerPotential, LBM.Sum),

				powerDelta =
				ic.read(reader1, LT.Setting),

				batteryCharged =
				ic.read(reader2, LT.Setting),

				batteryEmpty =
				ic.read(reader3, LT.Setting),

				error =
				ic.batch_read(BATTERY_HASH, LT.Error, LBM.Maximum)
			})
		ic.http.post(
			httpServer,
			data,
			"application/json"
		)

	end

end
